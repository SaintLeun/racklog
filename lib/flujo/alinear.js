// Alinear el layout (paso 5, dueño 26-10): que el cliente arme rápido y derecho, sin pelear con el plano.
// - imanRack: al mover un rack, se pega al muro, a otro rack (espalda con espalda o al pasillo exacto) y
//   alinea sus extremos con los vecinos. Devuelve también las guías que se dibujan mientras se arrastra.
// - ordenarPasillos: toma los racks junto a los muros como referencia y deja cada fila al pasillo exacto
//   de la anterior (o espalda con espalda), con los inicios alineados. Solo mueve: no agrega ni quita.
// - pasillosSinSalida / abrirConexion: un pasillo cerrado por muros en sus dos extremos no sirve (la grúa no
//   entra); se avisa y, si el cliente lo pide, se acortan las filas para abrir un pasillo de conexión.
// Sin Vue. Medidas en metros, planta x (ancho) / y (largo).
import { rectangulo, contorno, caja, normalizar, medidasRack, rayoMuro } from '../rack3d/planificador.js';
import { pasilloRequerido, carasDeCarga } from '../rack3d/pasillos.js';
import { DISTANCIAS, GRUAS } from '../rack3d/parametrosTecnicos.js';
import { conCuerpos } from './calculos.js';
import { dimensiones, tipoGrua } from '../rack3d/rutas.js';

const MURO = DISTANCIAS.rackMuro.valor;   // 10 cm entre la espalda y el muro
const ESPALDA = 0.1;                       // dos simples espalda con espalda
const TOL = 0.4;                           // el imán actúa a menos de 40 cm
const EPS = 1e-6;

const horizontal = (r) => r.rot === 0 || r.rot === 180;
const rect = (r) => { const q = rectangulo(r); return { x0: q.x0, y0: q.y0, x1: q.x0 + q.ancho, y1: q.y0 + q.alto }; };
// Caras de carga en el eje perpendicular a la fila: 'menor' (arriba/izquierda) y 'mayor' (abajo/derecha)
function carga(r) {
  if (r.doble) return { menor: true, mayor: true };
  return { 0: { menor: true, mayor: false }, 180: { menor: false, mayor: true }, 90: { menor: false, mayor: true }, 270: { menor: true, mayor: false } }[r.rot] ?? { menor: true, mayor: false };
}

/**
 * Imán al mover: x, y es el centro propuesto. Devuelve { x, y, guias } con el centro ajustado y las líneas
 * guía ({ x1, y1, x2, y2 }) de lo que lo atrajo y de todo con lo que quedó alineado. atrajo: el imán actuó
 */
export function imanRack(r, racks, bodega, x, y) {
  const otros = racks.filter((o) => o.id !== r.id);
  const c = caja(contorno(bodega));
  const q0 = rectangulo({ ...r, x, y });
  const q = { x0: q0.x0, y0: q0.y0, x1: q0.x0 + q0.ancho, y1: q0.y0 + q0.alto };
  const P = pasilloRequerido(r, bodega);
  const mejor = { x: null, y: null };
  const probar = (eje, delta, guia) => {
    if (Math.abs(delta) > TOL) return;
    if (!mejor[eje] || Math.abs(delta) < Math.abs(mejor[eje].delta) - EPS) mejor[eje] = { delta, guia };
  };
  // Muros
  probar('x', c.x0 + MURO - q.x0, { x1: c.x0, y1: q.y0, x2: c.x0, y2: q.y1 });
  probar('x', c.x1 - MURO - q.x1, { x1: c.x1, y1: q.y0, x2: c.x1, y2: q.y1 });
  probar('y', c.y0 + MURO - q.y0, { x1: q.x0, y1: c.y0, x2: q.x1, y2: c.y0 });
  probar('y', c.y1 - MURO - q.y1, { x1: q.x0, y1: c.y1, x2: q.x1, y2: c.y1 });
  for (const o of otros) {
    const p = rect(o);
    // Extremos alineados (mismo inicio o mismo final) y bordes a la par
    for (const [mio, suyo] of [[q.x0, p.x0], [q.x1, p.x1], [q.x0, p.x1], [q.x1, p.x0]]) {
      probar('x', suyo - mio, { x1: suyo, y1: Math.min(q.y0, p.y0), x2: suyo, y2: Math.max(q.y1, p.y1) });
    }
    for (const [mio, suyo] of [[q.y0, p.y0], [q.y1, p.y1], [q.y0, p.y1], [q.y1, p.y0]]) {
      probar('y', suyo - mio, { x1: Math.min(q.x0, p.x0), y1: suyo, x2: Math.max(q.x1, p.x1), y2: suyo });
    }
    // Espalda con espalda y pasillo exacto, en el eje perpendicular a la fila
    const gaps = [ESPALDA, P];
    for (const g of gaps) {
      if (horizontal(r)) {
        probar('y', p.y1 + g - q.y0, { x1: q.x0, y1: p.y1 + g / 2, x2: q.x1, y2: p.y1 + g / 2 });
        probar('y', p.y0 - g - q.y1, { x1: q.x0, y1: p.y0 - g / 2, x2: q.x1, y2: p.y0 - g / 2 });
      } else {
        probar('x', p.x1 + g - q.x0, { x1: p.x1 + g / 2, y1: q.y0, x2: p.x1 + g / 2, y2: q.y1 });
        probar('x', p.x0 - g - q.x1, { x1: p.x0 - g / 2, y1: q.y0, x2: p.x0 - g / 2, y2: q.y1 });
      }
    }
  }
  const nx = +(x + (mejor.x?.delta ?? 0)).toFixed(3), ny = +(y + (mejor.y?.delta ?? 0)).toFixed(3);
  return { x: nx, y: ny, atrajo: !!(mejor.x || mejor.y), guias: guiasAlineadas({ ...r, x: nx, y: ny }, otros, [mejor.x?.guia, mejor.y?.guia].filter(Boolean)) };
}

/** Guías tipo Figma del rack donde quedó (después de redondear o de sacarlo del muro) */
export const guiasRack = (r, racks) => guiasAlineadas(r, racks.filter((o) => o.id !== r.id), []);

/**
 * Guías tipo Figma (dueño 27-10): ya puesto el rack, todas las líneas con las que quedó alineado (bordes de
 * cualquier vecino, aunque no sea el que lo atrajo). Sin repetir líneas. Las distancias en vivo no van aquí: son
 * las cotas del rack elegido (Plano2D), y repetirlas encimaba dos textos iguales
 */
function guiasAlineadas(r, otros, base) {
  const q = rect(r), A = 0.02, out = [...base], vistas = new Set();
  const poner = (g) => {
    const k = [g.x1, g.y1, g.x2, g.y2].map((v) => v.toFixed(2)).join();
    if (vistas.has(k)) return;
    vistas.add(k); out.push(g);
  };
  base.forEach((g) => vistas.add([g.x1, g.y1, g.x2, g.y2].map((v) => v.toFixed(2)).join()));
  for (const o of otros) {
    const p = rect(o);
    for (const v of [p.x0, p.x1]) for (const mio of [q.x0, q.x1]) {
      if (Math.abs(v - mio) < A) poner({ x1: v, y1: Math.min(q.y0, p.y0), x2: v, y2: Math.max(q.y1, p.y1) });
    }
    for (const v of [p.y0, p.y1]) for (const mio of [q.y0, q.y1]) {
      if (Math.abs(v - mio) < A) poner({ x1: Math.min(q.x0, p.x0), y1: v, x2: Math.max(q.x1, p.x1), y2: v });
    }
  }
  return out;
}

// Filas: racks paralelos que se solapan en el eje perpendicular (una fila puede tener varios tramos)
function filasDe(racks, horiz) {
  const lista = racks.map((r) => ({ r, q: rect(r) })).sort((a, b) => (horiz ? a.q.y0 - b.q.y0 : a.q.x0 - b.q.x0));
  const filas = [];
  for (const it of lista) {
    const a0 = horiz ? it.q.y0 : it.q.x0, a1 = horiz ? it.q.y1 : it.q.x1;
    const f = filas.find((x) => a0 < x.a1 - 0.05 && a1 > x.a0 + 0.05);
    if (f) { f.items.push(it); f.a0 = Math.min(f.a0, a0); f.a1 = Math.max(f.a1, a1); } else filas.push({ items: [it], a0, a1 });
  }
  return filas.sort((a, b) => a.a0 - b.a0);
}
const cargaFila = (f) => f.items.reduce((t, { r }) => { const k = carga(r); return { menor: t.menor || k.menor, mayor: t.mayor || k.mayor }; }, { menor: false, mayor: false });

/**
 * Ordena los pasillos: por cada grupo de filas paralelas, la primera queda en el muro si estaba cerca (o
 * donde está), y cada siguiente al pasillo exacto (si alguna de las dos carga hacia ese lado) o espalda con
 * espalda. Si la última estaba junto al muro del fondo, se arma desde ese muro hacia atrás también y se
 * avisa si no caben. Los inicios de las filas se alinean con la más cercana al muro.
 * Devuelve { racks, movidos, avisos: [texto] }
 */
export function ordenarPasillos(racks, bodega) {
  const c = caja(contorno(bodega));
  const nuevos = new Map();
  const avisos = [];
  for (const horiz of [true, false]) {
    const grupo = racks.filter((r) => !r.existente && horizontal(r) === horiz);
    if (!grupo.length) continue;
    const filas = filasDe(grupo, horiz);
    const lo = horiz ? c.y0 : c.x0, hi = horiz ? c.y1 : c.x1;
    // Posición de cada fila (a0) de arriba hacia abajo, al pasillo exacto
    const pos = [];
    filas.forEach((f, i) => {
      if (i === 0) { pos.push(f.a0 - lo < 2 ? lo + MURO : f.a0); return; }
      const prev = filas[i - 1], k1 = cargaFila(prev), k2 = cargaFila(f);
      const P = Math.max(...[...prev.items, ...f.items].map(({ r }) => pasilloRequerido(r, bodega)));
      const gap = k1.mayor || k2.menor ? P : ESPALDA;
      pos.push(pos[i - 1] + (prev.a1 - prev.a0) + gap + 0.01);
    });
    const ultima = filas[filas.length - 1], finUltima = pos[pos.length - 1] + (ultima.a1 - ultima.a0);
    if (finUltima > hi - MURO + EPS) avisos.push(`Las filas ${horiz ? 'horizontales' : 'verticales'} no caben con sus pasillos: sobran ${(finUltima - (hi - MURO)).toFixed(2).replace('.', ',')} m. Acorta o quita una fila.`);
    // Inicios alineados: al muro si están cerca; si no, con el inicio más repetido
    const ini = filas.map((f) => Math.min(...f.items.map(({ q }) => (horiz ? q.x0 : q.y0))));
    const loL = horiz ? c.x0 : c.y0;
    const minIni = Math.min(...ini);
    const ref = minIni - loL < 1.5 ? loL + MURO : minIni;
    filas.forEach((f, i) => {
      const da = pos[i] - f.a0;
      const inicio = Math.min(...f.items.map(({ q }) => (horiz ? q.x0 : q.y0)));
      const dl = Math.abs(inicio - ref) < 3 ? ref - inicio : 0;   // a más de 3 m es otra cosa (un tramo aparte)
      f.items.forEach(({ r }) => {
        const x = +(r.x + (horiz ? dl : da)).toFixed(3), y = +(r.y + (horiz ? da : dl)).toFixed(3);
        if (Math.abs(x - r.x) > EPS || Math.abs(y - r.y) > EPS) nuevos.set(r.id, { ...r, x, y });
      });
    });
  }
  return { racks: racks.map((r) => nuevos.get(r.id) ?? r), movidos: nuevos.size, avisos };
}

/**
 * Rack doble pegado al muro (dueño 27-10): una de sus dos caras de carga queda contra el muro y esas posiciones
 * no se pueden cargar, salvo con un equipo de doble profundidad (`dobleProfundidad` en GRUAS; hoy ninguno).
 * Contra el muro va simple. "Pegado": menos de 1 m entre la cara y el muro
 */
export function dobleContraMuro(r, bodega) {
  if (!r.doble || r.tipo === 'DI' || GRUAS[bodega?.grua]?.dobleProfundidad) return false;
  const p = rectangulo(r), poly = contorno(bodega), cx = p.x0 + p.ancho / 2, cy = p.y0 + p.alto / 2;
  const LADO = { arriba: [cx, p.y0, 0, -1], abajo: [cx, p.y0 + p.alto, 0, 1], izquierda: [p.x0, cy, -1, 0], derecha: [p.x0 + p.ancho, cy, 1, 0] };
  return carasDeCarga(r).some((l) => { const [x, y, dx, dy] = LADO[l]; return rayoMuro(x, y, dx, dy, poly) < 1; });
}

/**
 * Paso libre (m) que necesita la grúa cargada para circular por la punta de una fila o entre un muro y un marco:
 * su ancho o el frente del pallet que lleva (lo que sea mayor) más la holgura por lado. No es el pasillo de trabajo
 * (ese es para girar y meter el pallet). Ángulo ranurado: el pasillo de una persona
 */
export function pasoCirculacion(r, bodega) {
  if (r.tipo === 'AR') return pasilloRequerido(r, bodega);
  const frente = Number(medidasRack(r).pallet?.frente) || 1.2;
  return +(Math.max(dimensiones(tipoGrua(bodega)).ancho, frente) + 2 * DISTANCIAS.holguraCirculacion.valor).toFixed(2);
}

/**
 * Pasillos de carga sin salida: entre dos filas paralelas con pasillo, cerrado por los dos extremos (cada
 * extremo tapado por el muro o por otro rack a menos del paso de circulación de la grúa cargada: dueño 27-10,
 * por la punta no necesita el pasillo de trabajo entero). Devuelve [{ filas: [ids], lado, paso, puntas }]
 */
export function pasillosSinSalida(racks, bodega) {
  const c = caja(contorno(bodega));
  const out = [];
  for (const horiz of [true, false]) {
    const grupo = racks.filter((r) => horizontal(r) === horiz);
    const filas = filasDe(grupo, horiz);
    for (let i = 0; i + 1 < filas.length; i++) {
      const a = filas[i], b = filas[i + 1], gap = b.a0 - a.a1;
      const items = [...a.items, ...b.items];
      const P = Math.max(...items.map(({ r }) => pasilloRequerido(r, bodega)));
      if (gap < P * 0.8 || !(cargaFila(a).mayor || cargaFila(b).menor)) continue;
      const paso = Math.max(...items.map(({ r }) => pasoCirculacion(r, bodega)));
      const ini = Math.min(...items.map(({ q }) => (horiz ? q.x0 : q.y0)));
      const fin = Math.max(...items.map(({ q }) => (horiz ? q.x1 : q.y1)));
      const lo = horiz ? c.x0 : c.y0, hi = horiz ? c.x1 : c.y1;
      // Un hueco dentro de una fila (tramos separados) también sirve de entrada si es de un pasillo
      const hueco = [a, b].some((f) => {
        const t = f.items.map(({ q }) => (horiz ? [q.x0, q.x1] : [q.y0, q.y1])).sort((m, n) => m[0] - n[0]);
        return t.some((s, k) => k > 0 && s[0] - t[k - 1][1] >= paso - 0.05);
      });
      if (ini - lo < paso - 0.05 && hi - fin < paso - 0.05 && !hueco) {
        out.push({ filas: items.map(({ r }) => r.id), lado: hi - fin >= ini - lo ? 'fin' : 'inicio', paso, puntas: [+(ini - lo).toFixed(2), +(hi - fin).toFixed(2)] });
      }
    }
  }
  return out;
}

/**
 * Abre un pasillo de conexión: acorta (cuerpo a cuerpo, por el extremo `lado`) todas las filas de ese
 * grupo que tapan el paso, hasta dejar el pasillo de la grúa libre junto al muro. Devuelve los racks
 */
export function abrirConexion(racks, bodega, ids, lado = 'fin') {
  const c = caja(contorno(bodega));
  const muestra = racks.find((r) => ids.includes(r.id));
  if (!muestra) return racks;
  const horiz = horizontal(muestra), P = pasilloRequerido(muestra, bodega) + 0.01;
  const limite = lado === 'fin' ? (horiz ? c.x1 : c.y1) - P : (horiz ? c.x0 : c.y0) + P;
  return racks.flatMap((r) => {
    if (r.existente || horizontal(r) !== horiz) return [r];
    let s = r;
    const tapa = (x) => { const q = rect(x); return lado === 'fin' ? (horiz ? q.x1 : q.y1) > limite + EPS : (horiz ? q.x0 : q.y0) < limite - EPS; };
    if (!tapa(s)) return [r];
    const q = rect(r);
    for (let n = r.cuerpos - 1; n >= 1 && tapa(s); n--) {
      s = conCuerpos(r, n);   // conserva el inicio
      if (lado === 'inicio') {
        const qs = rect(s), d = (horiz ? q.x1 - qs.x1 : q.y1 - qs.y1);
        s = { ...s, x: +(s.x + (horiz ? d : 0)).toFixed(3), y: +(s.y + (horiz ? 0 : d)).toFixed(3) };
      }
    }
    return tapa(s) ? [] : [normalizar(s)];
  });
}

/**
 * Distancia libre frente a la cara de carga del rack (al rack vecino o al muro), en la dirección del frente.
 * Devuelve { valor, dx, dy, a: 'rack' | 'muro' } (para mostrarla y cambiarla de a 10 cm)
 */
export function distanciaFrente(r, racks, bodega) {
  const d = { 0: [0, -1], 180: [0, 1], 90: [1, 0], 270: [-1, 0] }[r.rot] ?? [0, -1];
  const [dx, dy] = d, q = rect(r), poly = contorno(bodega);
  const cx = (q.x0 + q.x1) / 2, cy = (q.y0 + q.y1) / 2;
  const x = dx > 0 ? q.x1 : dx < 0 ? q.x0 : cx, y = dy > 0 ? q.y1 : dy < 0 ? q.y0 : cy;
  let valor = rayo(x, y, dx, dy, poly), a = 'muro';
  for (const o of racks) {
    if (o.id === r.id) continue;
    const p = rect(o);
    // El vecino tiene que quedar enfrente (se solapa a lo largo)
    if (dx && (p.y1 <= q.y0 + 0.05 || p.y0 >= q.y1 - 0.05)) continue;
    if (dy && (p.x1 <= q.x0 + 0.05 || p.x0 >= q.x1 - 0.05)) continue;
    const gap = dx > 0 ? p.x0 - x : dx < 0 ? x - p.x1 : dy > 0 ? p.y0 - y : y - p.y1;
    if (gap > -EPS && gap < valor) { valor = Math.max(0, gap); a = 'rack'; }
  }
  return { valor: Number.isFinite(valor) ? +valor.toFixed(2) : null, dx, dy, a };
}
function rayo(x, y, dx, dy, poly) {
  let mejor = Infinity;
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length], ex = b.x - a.x, ey = b.y - a.y, den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) return;
    const t = ((a.x - x) * ey - (a.y - y) * ex) / den, u = ((a.x - x) * dy - (a.y - y) * dx) / den;
    if (t > 1e-6 && u >= -1e-9 && u <= 1 + 1e-9) mejor = Math.min(mejor, t);
  });
  return mejor;
}
