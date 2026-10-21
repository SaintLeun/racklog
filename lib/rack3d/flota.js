// Flota de grúas del planificador (sin three ni Vue): cuántas grúas, a qué pasillo y hueco va cada
// una, y su operación en el tiempo sin choques: andén → pasillo → frente del rack → sube → deja (o
// saca) el pallet → vuelve al andén. Las personas caminan por los pasillos peatonales y tienen
// preferencia: las grúas las esperan. Coordenadas de planta (m); el 3D (operar3d.js) solo dibuja.
//
// Cómo se evita que choquen:
// - Cada grúa tiene su pasillo de carga (nadie más entra) y descansa frente a su hueco, en una zona
//   que las demás no pisan. Así un pasillo angosto nunca tiene dos sentidos a la vez.
// - Lo compartido (pasillos de grúa, espacio frente al portón) se reserva en el tiempo: cada grúa
//   planifica su vuelta completa con A* en espacio y tiempo contra lo que ya reservaron las otras
//   (la primera que planifica tiene la prioridad en el cruce; la otra espera).
// - Nunca atraviesan racks, pilares, oficinas, andenes ni barandas (grilla con holgura exacta) y los
//   pasillos peatonales solo los cruzan.
import { medidasRack, contorno, caja, rectangulo } from './planificador.js';
import { pasillos, carasDeCarga, conGrua, gruaDe, franjaPasillo } from './pasillos.js';
import { huella, SEPARACION_DOBLE, voladizoDe } from './medidas.js';
import {
  crearGrilla, distancias, rutaEstatica, tiemposEnRuta, celdaCercana, libreEn, DIRS,
  tipoGrua, dimensiones, radioColision, radioGiro, giroEnPasillo,
} from './rutas.js';

// PROVISORIO (confirmado: false, §7 del prompt): movimientos por hora que hace un equipo (entrar o
// sacar un pallet) en una bodega normal. Referencias habituales; Tecnica Racklog debe confirmarlas.
export const PRODUCTIVIDAD = {
  contrapeso: { valor: 20, confirmado: false },
  retractil: { valor: 25, confirmado: false },
  apiladora: { valor: 15, confirmado: false },
  manual: { valor: 8, confirmado: false },
  transpaleta: { valor: 30, confirmado: false },
};

/** Grúas que hacen falta: ceil(movimientos por hora ÷ productividad del equipo) (al menos 1) */
export function numeroGruas(movimientosHora, tipo = 'contrapeso') {
  const p = (PRODUCTIVIDAD[tipo] ?? PRODUCTIVIDAD.contrapeso).valor;
  if (!(movimientosHora > 0)) return null;
  return Math.max(1, Math.ceil(movimientosHora / p - 1e-9));
}

const VELOCIDAD = 1.5;        // m/s en los traslados (en la grilla cada tic avanza una celda)
const MARGEN = 0.3;           // m extra entre las huellas de dos gruas
const RADIO_PERSONA = 0.35;
const MARGEN_PERSONA = 0.45;  // m entre la grua y una persona
const ESPERA_ANDEN = 3.0;     // s detenida en el anden (deja y toma)
const ALTO_VIAJE = 0.15;      // m de horquilla al andar con carga
const MAX_GRUAS = 4;

// Punto local del rack (lx, lz; centrado en su huella) en planta, con su giro (igual que bodega.js)
function aPlanta(r, lx, lz) {
  const t = -((r.rot || 0) * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  return { x: r.x + lx * c + lz * s, y: r.y - lx * s + lz * c };
}

// Huecos posibles de un rack (las mismas cuentas que construir.js) en la fila que da al pasillo
function huecosRack(r, fila, levante) {
  const m = medidasRack(r), { largo, fondo: fondoH } = huella(m);
  const out = [];
  if (m.tipo === 'selectivo') {
    const altoViga = m.altoViga > 0 ? m.altoViga : 0.1;
    let nivel = 0;
    m.nivelesY.forEach((y, i) => { if (y + altoViga / 2 <= levante - 0.05 && i + 1 <= 3) nivel = i + 1; });
    const base = nivel ? m.nivelesY[nivel - 1] + altoViga / 2 : 0;
    const n = Math.max(1, Math.round(m.palletsPorViga || 2));
    const palAncho = Math.min(m.pallet.frente, m.viga / n - 0.05), luz = (m.viga - n * palAncho) / (n + 1);
    const pos = Math.floor((n - 1) / 2);
    const z0 = voladizoDe(m) + fila * (m.fondo + SEPARACION_DOBLE), lz = z0 + m.fondo / 2 - fondoH / 2;
    for (let c = 0; c < m.cuerpos; c++) {
      if (m.tunel && c === m.tunel.indice) continue;
      const x = c * (m.viga + 0.1) + 0.1 + luz * (pos + 1) + palAncho * (pos + 0.5);
      out.push({ hueco: { fila, cuerpo: c, nivel, pos }, p: aPlanta(r, x - largo / 2, lz), base, fondo: m.pallet.fondo });
    }
  } else if (m.tipo === 'drivein') {
    let nivel = 0;
    m.cartelasY.forEach((y, i) => { if (y <= levante - 0.05 && i + 1 <= 2) nivel = i + 1; });
    const base = nivel ? m.cartelasY[nivel - 1] : 0;
    const palFondo = Math.min(m.pallet.fondo, m.moduloFondo - 0.05);
    for (let c = 0; c < m.calles; c++) {
      const x = 0.05 + (c + 0.5) * m.anchoCalle;
      out.push({ hueco: { fila: 0, cuerpo: c, nivel, pos: 0 }, p: aPlanta(r, x - largo / 2, 0.5 * m.moduloFondo - fondoH / 2), base, fondo: palFondo });
    }
  }
  return out;
}

// Lado del rack que da al pasillo (como operar3d.js)
function ladoHacia(q, p) {
  const e = 0.05;
  if (p.eje === 'x') return p.x0 >= q.x0 + q.ancho - e ? 'derecha' : 'izquierda';
  return p.y0 >= q.y0 + q.alto - e ? 'abajo' : 'arriba';
}

// Pasillos de carga juntados por fila (mismo eje, misma franja, seguidos): cada uno es una "calle"
function calles(lista) {
  const grupo = lista.map((_, i) => i);
  const raiz = (i) => (grupo[i] === i ? i : (grupo[i] = raiz(grupo[i])));
  lista.forEach((a, i) => lista.forEach((b, j) => {
    if (j <= i || a.eje !== b.eje) return;
    const [a0, a1, b0, b1, s0, s1, t0, t1] = a.eje === 'y'
      ? [a.y0, a.y1, b.y0, b.y1, a.x0, a.x1, b.x0, b.x1]
      : [a.x0, a.x1, b.x0, b.x1, a.y0, a.y1, b.y0, b.y1];
    const comun = Math.min(a1, b1) - Math.max(a0, b0);
    const hueco = Math.max(s0, t0) - Math.min(s1, t1);
    if (comun > 0.5 * Math.min(a1 - a0, b1 - b0) && hueco < 0.6) grupo[raiz(i)] = raiz(j);
  }));
  const m = new Map();
  lista.forEach((p, i) => { const r = raiz(i); if (!m.has(r)) m.set(r, []); m.get(r).push(p); });
  return [...m.values()];
}

const dentroRect = (x, y, q, e = 0) => x >= q.x0 - e && x <= q.x1 + e && y >= q.y0 - e && y <= q.y1 + e;

/**
 * Arma la flota. opciones: { gruas (numero pedido), movimientosHora, horizonte }
 * Devuelve el objeto de la flota (ver el final) o null si no hay ningun pasillo donde operar.
 */
export function crearFlota(bodega, racks, opciones = {}) {
  const tipo = tipoGrua(bodega), dim = dimensiones(tipo), R = radioColision(tipo), g = gruaDe(bodega);
  const G = crearGrilla(bodega, racks, { tipo });
  const dt = G.c / VELOCIDAD;
  const poly = contorno(bodega), cj = caja(poly);
  const elementos = bodega.elementos ?? [];

  // ─── Andenes: frente al anden o al porton; si no hay, al centro del muro inferior ───
  const libreGiro = (k) => libreEn(G, k) && G.giro[k] && !G.peatonal[k];
  const andenes = [];
  elementos.filter((e) => e.clase === 'anden' || e.clase === 'porton').forEach((e) => {
    const ref = e.clase === 'anden' ? { x: e.x, y: e.y + e.alto / 2 + dim.largo / 2 + 0.4 } : { x: e.x, y: e.y };
    const k = celdaCercana(G, ref.x, ref.y, libreGiro);
    if (k >= 0 && !andenes.some((a) => a.celda === k)) andenes.push({ celda: k, ...G.centro(k), elemento: e.id ?? null });
  });
  if (!andenes.length) {
    const k = celdaCercana(G, (cj.x0 + cj.x1) / 2, cj.y1, libreGiro);
    if (k >= 0) andenes.push({ celda: k, ...G.centro(k), elemento: null });
  }

  // ─── Personas: caminan por cada pasillo peatonal (ida y vuelta, con pausa en los extremos) ───
  const personas = [];
  elementos.filter((e) => e.clase === 'pasilloPeatonal').slice(0, 4).forEach((e, i) => {
    const vertical = e.alto >= e.ancho, L = Math.max(e.ancho, e.alto), m = Math.min(1, L / 4);
    const a = vertical ? { x: e.x, y: e.y - L / 2 + m } : { x: e.x - L / 2 + m, y: e.y };
    const b = vertical ? { x: e.x, y: e.y + L / 2 - m } : { x: e.x + L / 2 - m, y: e.y };
    const largo = Math.hypot(b.x - a.x, b.y - a.y), v = 1.1, pausa = 2.5;
    const periodo = 2 * (largo / v + pausa);
    personas.push({ id: `p${i}`, a, b, largo, v, pausa, periodo, desfase: (i * 0.37 * periodo) % periodo, fija: false });
  });

  // ─── Calles de carga candidatas ───
  const porId = new Map(racks.map((r) => [r.id, r]));
  const lista = pasillos(racks, bodega).filter((p) => p.ok && giroEnPasillo(p, tipo));
  const peatonales = elementos.filter((e) => e.clase === 'pasilloPeatonal').map((e) => ({ x0: e.x - e.ancho / 2, x1: e.x + e.ancho / 2, y0: e.y - e.alto / 2, y1: e.y + e.alto / 2 }));
  const solapa = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  const callesC = calles(lista).map((ps, i) => {
    const rects = ps.map((p) => { const f = franjaPasillo(p); return { x0: f.x0, y0: f.y0, x1: f.x1, y1: f.y1 }; });
    return { id: i, pasillos: ps, rects, eje: ps[0].eje };
  }).filter((c) => !c.rects.some((q) => peatonales.some((pe) => solapa(q, pe))));
  const celdasDe = (rects) => {
    const s = new Uint8Array(G.n);
    for (let k = 0; k < G.n; k++) if (rects.some((q) => dentroRect(G.cx[k], G.cy[k], q, 0.01))) s[k] = 1;
    return s;
  };

  // Huecos de cada calle: frente a un selectivo o drive-in, con espacio para girar hacia el rack
  const rg = radioGiro(tipo);
  callesC.forEach((cl) => {
    cl.celdas = celdasDe(cl.rects);
    cl.lista = [];
    cl.celdas.forEach((v, k) => { if (v) cl.lista.push(k); });
    cl.opciones = [];
    cl.pasillos.forEach((p) => p.racks.forEach((id) => {
      const r = porId.get(id);
      if (!r || !conGrua(r) || r.existente) return;
      const q = rectangulo(r);
      const lado = ladoHacia(q, p), caras = carasDeCarga(r);
      if (!caras.includes(lado)) return;
      const fila = caras[0] === lado ? 0 : 1;
      const f = franjaPasillo(p);
      const cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2;
      huecosRack(r, fila, g.levante).forEach((h) => {
        // Parada: sobre el eje del pasillo, a la altura del hueco
        const S = p.eje === 'y' ? { x: h.p.x, y: cy } : { x: cx, y: h.p.y };
        if (!dentroRect(S.x, S.y, f, -0.2)) return;
        if (G.holguraEn(S.x, S.y) < rg - 0.06) return;
        const cS = G.celda(S.x, S.y);
        const oS = p.eje === 'y' ? 0 : 2;
        if (cS < 0 || !G.valido[oS][cS]) return;
        cl.opciones.push({ rack: r, tipoRack: r.tipo, hueco: h.hueco, slot: h.p, base: h.base, fondoPallet: h.fondo, S, celdaS: cS, oS });
      });
    }));
  });

  // ─── Cuantas gruas ───
  const utiles = callesC.filter((c) => c.opciones.length);
  const dibujadas = elementos.filter((e) => e.clase === 'grua').length;
  let pedidas = opciones.gruas
    ?? numeroGruas(opciones.movimientosHora ?? bodega.movimientosHora, tipo)
    ?? (dibujadas || (utiles.length >= 2 ? 2 : 1));
  pedidas = Math.max(1, Math.min(MAX_GRUAS, pedidas));

  // ─── Asignacion: una calle y un rack por grua, conectada con un anden sin pasar por las otras ───
  const zonaDe = (a) => 2 * R + MARGEN + a.avance + 0.25;
  const prepararOpcion = (o) => {
    const ux = o.S.x - o.slot.x, uy = o.S.y - o.slot.y, d = Math.hypot(ux, uy) || 1;
    // Centro de la grua con el pallet dentro del hueco: la punta de las horquillas al fondo del pallet
    const aT = Math.max(0, d - (dim.largo / 2 - o.fondoPallet / 2 + 0.05));
    const T = { x: o.S.x - (ux / d) * aT, y: o.S.y - (uy / d) * aT };
    return { ...o, T, avance: aT, frente: Math.atan2(-uy, -ux) };
  };
  const asignadas = [];
  // Celdas donde no puede entrar `a`: las calles de las otras y la zona donde descansan
  const prohibidoPara = (a, todas) => {
    const s = new Uint8Array(G.n);
    todas.forEach((b) => {
      if (b === a) return;
      b.calle.lista.forEach((k) => { s[k] = 1; });
      const z = zonaDe(b), r = Math.ceil(z / G.c) + 1;
      const ci = Math.floor((b.S.x - G.x0) / G.c), cjj = Math.floor((b.S.y - G.y0) / G.c);
      for (let j = Math.max(0, cjj - r); j <= Math.min(G.ny - 1, cjj + r); j++) {
        for (let i = Math.max(0, ci - r); i <= Math.min(G.nx - 1, ci + r); i++) {
          const k = j * G.nx + i;
          if ((G.cx[k] - b.S.x) ** 2 + (G.cy[k] - b.S.y) ** 2 < z * z) s[k] = 1;
        }
      }
    });
    return s;
  };
  // Distancias al anden de cada grua (cacheadas por anden y prohibidos)
  // Todas llegan a su anden sin pisar lo de las otras: primero por BFS (rapido) y despues con la
  // ruta de verdad (que respeta donde se puede girar). Deja en cada una su ruta
  const conecta = (todas) => {
    const proh = todas.map((a) => prohibidoPara(a, todas));
    const okBFS = todas.every((a, i) => {
      if (proh[i][a.celdaS]) return false;
      return distancias(G, a.anden.celda, (k) => proh[i][k] === 1)[a.celdaS] < Infinity;
    });
    if (!okBFS) return false;
    const rutas = [];
    for (let i = 0; i < todas.length; i++) {
      const a = todas[i], p = (k) => proh[i][k] === 1;
      const ida = rutaEstatica(G, { inicio: a.celdaS, orientacion: a.oS, meta: a.anden.celda, prohibido: p });
      const vuelta = ida && rutaEstatica(G, { inicio: a.anden.celda, orientacion: ida.at(-1).o, meta: a.celdaS, prohibido: p });
      if (!vuelta) return false;
      rutas.push({ prohibido: proh[i], ruta: [...ida, ...vuelta.slice(1)], idxAnden: ida.length - 1 });
    }
    todas.forEach((a, i) => Object.assign(a, rutas[i]));
    return true;
  };
  // Opciones de cada calle de la mas profunda a la mas cercana a la boca (la grua descansa adentro)
  const dA = distancias(G, andenes[0]?.celda ?? -1);
  const ordenadas = utiles.map((cl) => {
    const ops = cl.opciones.map(prepararOpcion);
    // Profundidad: distancia a la celda de la calle mas cercana a un anden
    let boca = null, mejor = Infinity;
    for (let k = 0; k < G.n; k++) if (cl.celdas[k] && dA[k] < mejor) { mejor = dA[k]; boca = G.centro(k); }
    ops.forEach((o) => { o.prof = boca ? Math.hypot(o.S.x - boca.x, o.S.y - boca.y) : 0; });
    ops.sort((a, b) => (a.tipoRack === 'RS' ? 0 : 1) - (b.tipoRack === 'RS' ? 0 : 1) || b.prof - a.prof);
    return { cl, ops, alcanzable: mejor < Infinity, largo: ops.length };
  }).sort((a, b) => (b.alcanzable - a.alcanzable) || (b.largo - a.largo));

  for (const { cl, ops, alcanzable } of ordenadas) {
    if (asignadas.length >= pedidas) break;
    if (!alcanzable && andenes.length) continue;
    // Prueba algunas opciones (de la mas profunda): la primera que deja todo conectado
    const usados = new Set(asignadas.map((a) => a.rack.id));
    const prueba = ops.filter((o) => !usados.has(o.rack.id)).filter((_, i, arr) => i < 6 || i === arr.length - 1);
    for (const o of prueba) {
      const anden = andenes[asignadas.length % Math.max(1, andenes.length)];
      if (!anden) break;
      const a = { ...o, calle: cl, anden };
      if (conecta([...asignadas, a])) { asignadas.push(a); break; }
    }
  }
  // Sin anden alcanzable desde ninguna calle: la grua va y vuelve dentro de su calle (al extremo)
  if (!asignadas.length && ordenadas.length) {
    const { cl, ops } = ordenadas[0];
    const o = ops[0];
    let lejos = -1, dm = -1;
    for (let k = 0; k < G.n; k++) {
      if (!cl.celdas[k] || !G.valido[o.oS][k]) continue;
      const p = G.centro(k), d = Math.hypot(p.x - o.S.x, p.y - o.S.y);
      if (d > dm) { dm = d; lejos = k; }
    }
    if (lejos >= 0 && dm > 2) asignadas.push({ ...o, calle: cl, anden: { celda: lejos, ...G.centro(lejos), elemento: null, interno: true } });
  }
  if (!asignadas.length) return null;

  // Persona quieta si no hay pasillos peatonales: fuera del alcance de las gruas
  if (!personas.length) {
    // Lejos de toda celda donde puede estar el centro de una grua (se mira solo alrededor)
    const alcance = dim.largo / 2 + RADIO_PERSONA + 0.6, r = Math.ceil(alcance / G.c);
    const lejos = (k) => {
      if (G.holgura[k] < 0.45 || libreEn(G, k)) return false;
      const ci = k % G.nx, cjj = Math.floor(k / G.nx);
      for (let j = Math.max(0, cjj - r); j <= Math.min(G.ny - 1, cjj + r); j++) {
        for (let i = Math.max(0, ci - r); i <= Math.min(G.nx - 1, ci + r); i++) {
          if (libreEn(G, j * G.nx + i) && Math.hypot(i - ci, j - cjj) * G.c <= alcance) return false;
        }
      }
      return true;
    };
    const ref = andenes[0] ?? { x: cj.x0, y: cj.y1 };
    const k = celdaCercana(G, ref.x, ref.y, lejos);
    if (k >= 0) {
      const p = G.centro(k);
      personas.push({ id: 'p0', a: p, b: p, largo: 0, v: 0, pausa: 0, periodo: 1, desfase: 0, fija: true });
    }
  }

  // ─── Estado de cada grua ───
  const gruas = asignadas.map((a, i) => ({
    id: i,
    ...a,
    rackId: a.rack.id,
    prohibido: a.prohibido ?? prohibidoPara(a, asignadas),
    // Plan comprometido desde el tic k0: posiciones por tic (y orientacion); despues, quieta en S
    plan: { k0: 0, xs: [a.S.x], ys: [a.S.y], os: [a.oS] },
    segmentos: [],
    lleva: true,          // parte con un pallet en las horquillas (lo va a guardar)
    ciclos: 0,
    fallas: 0, esperaMax: 0, esperando: 0,
    ang: a.oS === 0 ? 0 : Math.PI / 2,
  }));
  gruas.forEach((gr) => {
  });

  // Duracion de la maniobra frente al rack (s): girar, subir, entrar, dejar/tomar, salir, bajar, girar
  const apoyoDe = (gr) => Math.max(0, gr.base - ALTO_HORQUILLAS[tipo] + 0.1);
  const fasesManiobra = (gr) => {
    const arriba = apoyoDe(gr) + 0.06;
    return [
      ['girar', 1.2], ['subir', 0.4 + arriba / 0.5], ['entrar', 0.4 + gr.avance / 0.45],
      ['dejar', 0.7], ['salir', 0.4 + gr.avance / 0.45], ['bajar', 0.4 + arriba / 0.5], ['volver', 1.2],
    ];
  };

  // Posicion de una grua en el tic k (en _x, _y, sin crear objetos: se llama muchisimo)
  let _x = 0, _y = 0;
  const posDe = (gr, k) => {
    const p = gr.plan, i = k - p.k0;
    if (i <= 0) { _x = p.xs[0]; _y = p.ys[0]; } else if (i >= p.xs.length) { _x = gr.S.x; _y = gr.S.y; } else { _x = p.xs[i]; _y = p.ys[i]; }
  };
  // Persona en el tiempo t: posicion en _x, _y; devuelve { ang, camina } solo si se pide
  const personaXY = (pe, t) => {
    if (pe.fija) { _x = pe.a.x; _y = pe.a.y; return 0; }
    let s = ((t + pe.desfase) % pe.periodo + pe.periodo) % pe.periodo;
    const ida = pe.largo / pe.v;
    let f, dir = 1;
    if (s < ida) f = s / ida;
    else if ((s -= ida) < pe.pausa) { f = 1; dir = 0; }
    else if ((s -= pe.pausa) < ida) { f = 1 - s / ida; dir = -1; }
    else { f = 0; dir = 0; }
    _x = pe.a.x + (pe.b.x - pe.a.x) * f;
    _y = pe.a.y + (pe.b.y - pe.a.y) * f;
    return dir;
  };
  const personaEn = (pe, t) => {
    const dir = personaXY(pe, t);
    const ux = (pe.b.x - pe.a.x) / (pe.largo || 1), uy = (pe.b.y - pe.a.y) / (pe.largo || 1);
    if (pe.dir === undefined) pe.dir = 1;
    if (dir) pe.dir = dir;
    return { x: _x, y: _y, ang: Math.atan2(uy * pe.dir, ux * pe.dir), camina: dir !== 0 && !pe.fija };
  };
  // Distancia de un punto a la huella (segmento del eje) de una grua en (x, y) con orientacion o
  const aHuella = (px, py, x, y, o) => {
    const [dx, dy] = DIRS[o], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
    const m = Math.max(0, dim.largo / 2 - dim.ancho / 2);
    const s = Math.max(-m, Math.min(m, (px - x) * ux + (py - y) * uy));
    return Math.hypot(px - x - ux * s, py - y - uy * s);
  };
  const D2 = (2 * R + MARGEN) ** 2, DP = dim.ancho / 2 + RADIO_PERSONA + MARGEN_PERSONA;
  personas.forEach((pe) => {
    const m = dim.largo / 2 + DP;
    pe.caja = { x0: Math.min(pe.a.x, pe.b.x) - m, x1: Math.max(pe.a.x, pe.b.x) + m, y0: Math.min(pe.a.y, pe.b.y) - m, y1: Math.max(pe.a.y, pe.b.y) + m };
  });
  const chocaCon = (gr) => {
    const otras = gruas.filter((x) => x !== gr);
    return (i, o, k) => {
      const px = G.cx[i], py = G.cy[i];
      for (const otra of otras) {
        posDe(otra, k);
        if ((px - _x) ** 2 + (py - _y) ** 2 < D2) return true;
      }
      for (const pe of personas) {
        // Lejos de todo su recorrido: ni se mira
        if (px < pe.caja.x0 || px > pe.caja.x1 || py < pe.caja.y0 || py > pe.caja.y1) continue;
        for (let kk = k - 1; kk <= k + 1; kk++) {
          personaXY(pe, kk * dt);
          // Lejos de toda la huella: no hace falta la cuenta fina
          if (Math.abs(_x - px) > dim.largo || Math.abs(_y - py) > dim.largo) continue;
          if (aHuella(_x, _y, px, py, o) < DP) return true;
        }
      }
      return false;
    };
  };

  // Ruta fija de cada grua (ida al anden y vuelta a su parada); despues solo se decide cuando esperar
  const nA = Math.ceil(ESPERA_ANDEN / dt);
  // (las rutas ya quedaron en cada una al asignarlas; la de calle interna se arma aqui)
  gruas.forEach((gr) => {
    if (gr.ruta) return;
    const proh = (k) => gr.prohibido[k] === 1;
    const ida = rutaEstatica(G, { inicio: gr.celdaS, orientacion: gr.oS, meta: gr.anden.celda, prohibido: proh });
    const vuelta = ida && rutaEstatica(G, { inicio: gr.anden.celda, orientacion: ida.at(-1).o, meta: gr.celdaS, prohibido: proh });
    gr.ruta = ida && vuelta ? [...ida, ...vuelta.slice(1)] : null;
    gr.idxAnden = ida ? ida.length - 1 : -1;
  });

  // Planifica la vuelta completa desde S en el tic kS: S → anden (espera) → S → maniobra
  function planificar(gr, kS) {
    if (!gr.ruta) return null;
    const choca = chocaCon(gr), ruta = gr.ruta;
    const idx = tiemposEnRuta(ruta.length, {
      k0: kS, choca: (i, k) => choca(ruta[i].i, ruta[i].o, k), esperaMin: (i) => (i === gr.idxAnden ? nA : 0),
    });
    if (!idx) return null;
    const xs = [], ys = [], os = [];
    let kA = -1, kB = -1;
    idx.forEach((i, u) => {
      const n = ruta[i];
      xs.push(G.cx[n.i]); ys.push(G.cy[n.i]); os.push(n.o);
      if (i === gr.idxAnden) { if (kA < 0) kA = kS + u; kB = kS + u; }
    });
    // Ultimo tic: al punto exacto de parada
    xs.push(gr.S.x); ys.push(gr.S.y); os.push(gr.oS);
    return { k0: kS, xs, ys, os, kA, nA: kB - kA, kFin: kS + xs.length - 1 };
  }

  // Linea de tiempo: segmentos { tipo: 'maniobra'|'viaje'|'anden'|'espera', t0, t1, ... }
  let t = 0;
  const maniobra = (gr, t0) => {
    const fases = fasesManiobra(gr), dur = fases.reduce((s, f) => s + f[1], 0);
    const accion = gr.lleva ? 'guardar' : 'sacar';
    gr.segmentos.push({ tipo: 'maniobra', t0, t1: t0 + dur, fases, accion, llevaAntes: gr.lleva });
    gr.lleva = !gr.lleva;
    return t0 + dur;
  };
  // Al inicio cada grua parte guardando, desfasadas un poco
  gruas.forEach((gr, i) => {
    const t0 = i * 4;
    if (t0 > 0) gr.segmentos.push({ tipo: 'espera', t0: 0, t1: t0 });
    maniobra(gr, t0);
  });
  const fin = (gr) => gr.segmentos.at(-1).t1;
  const ADELANTO = 1.0;

  // Avanza la planificacion hasta `hasta` (s): cada grua que termina su maniobra planifica la vuelta
  // `urgente`: hasta donde se planifica si o si; de ahi a `hasta`, a lo mas `cupo` vueltas por llamada
  // (asi el trabajo se reparte entre cuadros)
  function planificarHasta(hasta, urgente = hasta, cupo = Infinity) {
    for (;;) {
      let gr = null;
      gruas.forEach((x) => { if (fin(x) <= hasta && (!gr || fin(x) < fin(gr))) gr = x; });
      if (!gr || (fin(gr) > urgente && cupo-- <= 0)) return;
      const tF = fin(gr), kS = Math.ceil(tF / dt - 1e-9);
      const p = planificar(gr, kS);
      if (!p) {
        // No hay paso ahora: espera en su calle y lo intenta de nuevo
        gr.fallas++;
        gr.esperando += 2;
        gr.esperaMax = Math.max(gr.esperaMax, gr.esperando);
        gr.segmentos.push({ tipo: 'espera', t0: tF, t1: tF + 2 });
        continue;
      }
      gr.esperando = 0;
      gr.plan = { k0: p.k0, xs: p.xs, ys: p.ys, os: p.os };
      const tS = p.k0 * dt, tA = p.kA * dt, tB = (p.kA + p.nA) * dt, tE = p.kFin * dt;
      if (tS > tF) gr.segmentos.push({ tipo: 'espera', t0: tF, t1: tS });
      gr.segmentos.push({ tipo: 'viaje', t0: tS, t1: tA, plan: gr.plan, lleva: gr.lleva });
      gr.segmentos.push({ tipo: 'anden', t0: tA, t1: tB, lleva: gr.lleva, x: gr.anden.x, y: gr.anden.y });
      gr.segmentos.push({ tipo: 'viaje', t0: tB, t1: tE, plan: gr.plan, lleva: gr.lleva });
      gr.ciclos++;
      maniobra(gr, tE);
    }
  }

  const suave = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const angDif = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

  // Estado de una grua en el tiempo t (y el angulo suavizado con el paso dt)
  function estadoGrua(gr, paso) {
    while (gr.segmentos.length > 1 && gr.segmentos[0].t1 <= t) gr.segmentos.shift();
    const s = gr.segmentos[0];
    const e = { x: gr.S.x, y: gr.S.y, ang: gr.ang, alto: 0, lleva: gr.lleva, fase: s.tipo, id: gr.id };
    if (s.tipo === 'viaje') {
      const kf = t / dt, p = s.plan;
      const i = Math.max(0, Math.min(p.xs.length - 1, Math.floor(kf) - p.k0)), j = Math.min(p.xs.length - 1, i + 1);
      const f = Math.max(0, Math.min(1, kf - Math.floor(kf)));
      e.x = p.xs[i] + (p.xs[j] - p.xs[i]) * f;
      e.y = p.ys[i] + (p.ys[j] - p.ys[i]) * f;
      e.lleva = s.lleva;
      e.alto = s.lleva ? ALTO_VIAJE : 0;
      // Rumbo: el eje de la orientacion, hacia el lado mas cercano al actual (puede ir de reversa)
      const [dx, dy] = DIRS[p.os[j]];
      let obj = Math.atan2(dy, dx);
      if (Math.abs(angDif(gr.ang, obj)) > Math.PI / 2) obj += Math.PI;
      const d = angDif(gr.ang, obj), max = 2.4 * paso;
      gr.ang += Math.max(-max, Math.min(max, d));
      e.ang = gr.ang;
    } else if (s.tipo === 'anden') {
      e.x = s.x; e.y = s.y; e.lleva = s.lleva;
      // Con carga: la baja al piso (deja) y vuelve a tomar la siguiente
      const k = Math.min(1, (t - s.t0) / (s.t1 - s.t0));
      e.alto = s.lleva ? ALTO_VIAJE * Math.abs(Math.cos(Math.PI * k)) : 0;
    } else if (s.tipo === 'maniobra') {
      const arriba = apoyoDe(gr) + 0.06, apoyo = apoyoDe(gr);
      const guardar = s.accion === 'guardar';
      const v0 = s.llevaAntes ? ALTO_VIAJE : 0, v1 = s.llevaAntes ? 0 : ALTO_VIAJE;
      // Llega mirando por el eje del pasillo: gira hacia el rack y al final vuelve al eje
      if (s.ang0 === undefined) s.ang0 = gr.ang;
      const eje = gr.oS === 0 ? 0 : Math.PI / 2;
      const salida = Math.abs(angDif(gr.frente, eje)) > Math.PI / 2 ? eje + Math.PI : eje;
      let resto = t - s.t0, ang = s.ang0, alto = v0, pos = 0;
      e.lleva = s.llevaAntes;
      for (const [nombre, dur] of s.fases) {
        const k = Math.max(0, Math.min(1, resto / dur)), q = suave(k);
        if (nombre === 'girar') ang = s.ang0 + angDif(s.ang0, gr.frente) * q;
        else if (nombre === 'subir') { ang = gr.frente; alto = v0 + ((guardar ? arriba : apoyo) - v0) * q; }
        else if (nombre === 'entrar') pos = q;
        else if (nombre === 'dejar') {
          alto = guardar ? arriba + (apoyo - arriba) * q : apoyo + (arriba - apoyo) * q;
          if (k > 0) e.lleva = !guardar;
        } else if (nombre === 'salir') pos = 1 - q;
        else if (nombre === 'bajar') alto = (guardar ? apoyo : arriba) + (v1 - (guardar ? apoyo : arriba)) * q;
        else if (nombre === 'volver') ang = gr.frente + angDif(gr.frente, salida) * q;
        if (resto < dur) break;
        resto -= dur;
      }
      e.x = gr.S.x + (gr.T.x - gr.S.x) * pos;
      e.y = gr.S.y + (gr.T.y - gr.S.y) * pos;
      e.ang = ang; e.alto = alto;
      gr.ang = ang;
    } else if (s.tipo === 'espera') {
      e.alto = gr.lleva ? ALTO_VIAJE : 0;
    }
    return e;
  }

  const horizonte = opciones.horizonte ?? 30;
  planificarHasta(2);

  return {
    tipo, dim, radio: R, dt, grilla: G, andenes, personas,
    // Cuantas se pidieron y cuantas caben (cada una necesita su calle de carga conectada al anden)
    pedidas, callesUtiles: utiles.length,
    gruas: gruas.map((gr) => ({
      id: gr.id, rackId: gr.rackId, hueco: gr.hueco, slot: gr.slot, S: gr.S, T: gr.T, base: gr.base,
      apoyo: apoyoDe(gr), anden: gr.anden, calle: gr.calle.id, frente: gr.frente,
    })),
    get t() { return t; },
    /** Avanza el reloj dt segundos; devuelve el estado de gruas y personas */
    avanzar(paso) {
      t += Math.max(0, paso);
      planificarHasta(t + horizonte, t + 2, 1);
      return this.estado(paso);
    },
    estado(paso = 0) {
      return {
        t,
        gruas: gruas.map((gr) => estadoGrua(gr, paso)),
        personas: personas.map((pe) => ({ id: pe.id, ...personaEn(pe, t) })),
      };
    },
    /** Resumen para pruebas: ciclos, fallas de planificacion y la espera mas larga (s) */
    resumen() {
      return gruas.map((gr) => ({ id: gr.id, ciclos: gr.ciclos, fallas: gr.fallas, esperaMax: gr.esperaMax, rackId: gr.rackId, anden: gr.anden.interno ? 'interno' : 'anden' }));
    },
    // Huella para pruebas: distancia de un punto a la huella de una grua
    aHuella,
    radioPersona: RADIO_PERSONA,
  };
}

// Alto de la cara de las horquillas en reposo (equipos.js, userData.horquillas sin escalar)
const ALTO_HORQUILLAS = { contrapeso: 0.095, retractil: 0.345, apiladora: 0.26, manual: 0.26, transpaleta: 0.1 };
