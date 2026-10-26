// Rutas de grúas en planta (sin three ni Vue): grilla de la bodega con la holgura exacta a racks,
// elementos, barandas y muros; huella de la grúa por orientación, dónde puede girar y A* en espacio
// y tiempo (con esperas) para que varias grúas no se crucen. Coordenadas de planta en metros.
import { rectangulo, contorno, caja, puntoDentro, rectElemento, medidasRack, deLado } from './planificador.js';
import { pasillos, franjaPasillo, conGrua } from './pasillos.js';
import { tramosBaranda } from './accesorios.js';

// Medidas de cada equipo (x = ancho, largo con horquillas), las mismas de equipos.js (NOMINAL)
export const DIMENSIONES = {
  contrapeso: { ancho: 1.15, largo: 3.2 },
  retractil: { ancho: 1.25, largo: 2.7 },
  apiladora: { ancho: 0.85, largo: 2.5 },
  manual: { ancho: 0.85, largo: 2.5 },
  transpaleta: { ancho: 0.72, largo: 1.75 },
};

// PROVISORIO (confirmado: false, §7 del prompt): radio que necesita el equipo para girar 90° en un
// pasillo, medido desde su centro hasta el borde mas cercano (rack, muro). Se tomo la mitad del
// pasillo minimo menos 5 cm, para que un pasillo que cumple el ancho del equipo permita el giro.
// Tecnica Racklog debe confirmarlo por modelo de grua.
export const RADIO_GIRO = {
  contrapeso: { valor: 1.7, confirmado: false },
  retractil: { valor: 1.35, confirmado: false },
  apiladora: { valor: 1.15, confirmado: false },
  manual: { valor: 1.15, confirmado: false },
  transpaleta: { valor: 0.95, confirmado: false },
};

export const tipoGrua = (bodega) => (DIMENSIONES[bodega?.grua] ? bodega.grua : 'contrapeso');
export const dimensiones = (tipo) => DIMENSIONES[tipo] ?? DIMENSIONES.contrapeso;
export const radioGiro = (tipo) => (RADIO_GIRO[tipo] ?? RADIO_GIRO.contrapeso).valor;
// Radio de colision: media diagonal de la huella (cubre la grua girada en cualquier sentido)
export const radioColision = (tipo) => { const d = dimensiones(tipo); return Math.hypot(d.ancho, d.largo) / 2; };

/** ¿La grua puede girar hacia el rack en este pasillo? (mitad del ancho libre ≥ radio de giro) */
export function giroEnPasillo(p, tipo) {
  return p.libre / 2 >= radioGiro(tipo) - 1e-6;
}

/** Pasillos de carga donde la grua no alcanza a girar hacia el rack (para marcarlos en rojo) */
export function pasillosSinGiro(racks, bodega, tipo = tipoGrua(bodega)) {
  return pasillos(racks, bodega).filter((p) => !giroEnPasillo(p, tipo));
}

// Elementos que la grua no puede atravesar (los pasillos dibujados, porton y gruas no bloquean)
const OBSTACULO = ['pilar', 'oficina', 'anden', 'zona'];

// Distancia de un punto a un rectangulo { x0, y0, x1, y1 } (0 si esta dentro)
function aRect(x, y, q) {
  const dx = Math.max(q.x0 - x, 0, x - q.x1), dy = Math.max(q.y0 - y, 0, y - q.y1);
  return Math.hypot(dx, dy);
}
// Distancia de un punto al segmento a-b
function aSegmento(x, y, a, b) {
  const ex = b.x - a.x, ey = b.y - a.y, l2 = ex * ex + ey * ey;
  const t = l2 ? Math.max(0, Math.min(1, ((x - a.x) * ex + (y - a.y) * ey) / l2)) : 0;
  return Math.hypot(x - a.x - ex * t, y - a.y - ey * t);
}
const aCaja = (q) => ({ x0: q.x0, y0: q.y0, x1: q.x0 + q.ancho, y1: q.y0 + q.alto });

// Direcciones de la grilla: 0 E, 1 NE, 2 N, 3 NO, 4 O, 5 SO, 6 S, 7 SE. Orientacion = d % 4 (eje)
export const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

/**
 * Grilla de la bodega para un tipo de grua.
 * Devuelve { x0, y0, c, nx, ny, n, holgura, valido[4], giro, peatonal, dibujado, obstaculos,
 *            holguraEn(x, y), celda(x, y), centro(i), tipo, dim }
 * - holgura: distancia (m) del centro de la celda al obstaculo mas cercano (0 si esta dentro)
 * - valido[o]: la huella de la grua orientada segun el eje o cabe en la celda
 * - giro: hay espacio para girar ahi
 * - peatonal: la huella pisa un pasillo peatonal (se cruza, no se recorre)
 * - dibujado: celda dentro de un pasillo de grua dibujado o de carga (se prefiere)
 */
export function crearGrilla(bodega, racks, { tipo = tipoGrua(bodega), celda = null, barandas = true } = {}) {
  const poly = contorno(bodega), cj = caja(poly);
  const W = cj.x1 - cj.x0, H = cj.y1 - cj.y0;
  // 0,3 m en bodegas normales; mas gruesa en las muy grandes (a lo mas ~40.000 celdas)
  const c = celda ?? Math.max(0.3, Math.sqrt((W * H) / 40000));
  const nx = Math.max(1, Math.ceil(W / c)), ny = Math.max(1, Math.ceil(H / c)), n = nx * ny;
  const elementos = bodega.elementos ?? [];

  const rects = [
    // Un cuerpo tunel alto para el equipo deja pasar: el rack queda en dos partes
    ...racks.flatMap((r) => rectsRack(r, tipo)),
    // Las zonas de maniobra de porton o anden (con `padre`) son para circular: no bloquean
    ...elementos.filter((e) => OBSTACULO.includes(e.clase) && !(e.clase === 'zona' && e.padre)).map((e) => aCaja(rectElemento(e))),
  ];
  // Barandas de los pasillos peatonales: la grua solo los cruza por las aberturas
  if (barandas) {
    elementos.filter((e) => e.clase === 'pasilloPeatonal').forEach((e) => {
      tramosBaranda(e, bodega).tramos.forEach((t) => rects.push({
        x0: Math.min(t.x1, t.x2) - 0.04, x1: Math.max(t.x1, t.x2) + 0.04, y0: Math.min(t.y1, t.y2) - 0.04, y1: Math.max(t.y1, t.y2) + 0.04,
      }));
    });
  }
  const _p = { x: 0, y: 0 };
  const holguraEn = (x, y) => {
    _p.x = x; _p.y = y;
    if (!puntoDentro(_p, poly)) return 0;
    let d = Infinity;
    for (let i = 0; i < poly.length; i++) d = Math.min(d, aSegmento(x, y, poly[i], poly[(i + 1) % poly.length]));
    for (const q of rects) { d = Math.min(d, aRect(x, y, q)); if (d <= 0) return 0; }
    return d;
  };

  const x0 = cj.x0, y0 = cj.y0;
  const centro = (i) => ({ x: x0 + ((i % nx) + 0.5) * c, y: y0 + (Math.floor(i / nx) + 0.5) * c });
  const celdaDe = (x, y) => {
    const i = Math.floor((x - x0) / c), j = Math.floor((y - y0) / c);
    return i < 0 || j < 0 || i >= nx || j >= ny ? -1 : j * nx + i;
  };

  const dim = dimensiones(tipo), rg = radioGiro(tipo);
  const holgura = new Float32Array(n), cx = new Float32Array(n), cy = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = centro(i); cx[i] = p.x; cy[i] = p.y; holgura[i] = holguraEn(p.x, p.y); }

  // Huella: capsula de radio ancho/2 a lo largo del eje, hasta largo/2 del centro. Se mira la
  // holgura de las celdas sobre el eje (cada una a una celda de la otra: no quedan huecos)
  const rl = dim.ancho / 2 + 0.1, media = Math.max(0, dim.largo / 2 + 0.1 - rl);
  const valido = [0, 1, 2, 3].map((o) => {
    const [dx, dy] = DIRS[o], l = Math.hypot(dx, dy);
    const K = Math.ceil(media / (c * l) - 1e-9);
    const v = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (holgura[i] < rl) continue;
      const x = i % nx, y = (i - x) / nx;
      let ok = true;
      for (let k = 1; k <= K && ok; k++) {
        for (const sg of [1, -1]) {
          const xx = x + sg * dx * k, yy = y + sg * dy * k;
          if (xx < 0 || yy < 0 || xx >= nx || yy >= ny || holgura[yy * nx + xx] < rl) { ok = false; break; }
        }
      }
      v[i] = ok ? 1 : 0;
    }
    return v;
  });
  const giro = new Uint8Array(n);
  for (let i = 0; i < n; i++) giro[i] = holgura[i] >= rg - c / 2 && (valido[0][i] || valido[2][i]) ? 1 : 0;

  // Pasillos peatonales (con la mitad del ancho de la grua: la huella los pisa) y pasillos preferidos
  const peat = elementos.filter((e) => e.clase === 'pasilloPeatonal').map((e) => aCaja(rectElemento(e)));
  const pref = [
    ...elementos.filter((e) => e.clase === 'pasilloGrua').map((e) => aCaja(rectElemento(e))),
    ...pasillos(racks, bodega).map((p) => { const f = franjaPasillo(p); return { x0: f.x0, y0: f.y0, x1: f.x1, y1: f.y1 }; }),
  ];
  const peatonal = new Uint8Array(n), dibujado = new Uint8Array(n);
  const hayDibujados = elementos.some((e) => e.clase === 'pasilloGrua');
  for (let i = 0; i < n; i++) {
    const p = centro(i);
    if (peat.some((q) => aRect(p.x, p.y, q) < dim.ancho / 2)) peatonal[i] = 1;
    if (!hayDibujados || pref.some((q) => aRect(p.x, p.y, q) < 0.01)) dibujado[i] = 1;
  }
  return { x0, y0, c, nx, ny, n, cx, cy, holgura, valido, giro, peatonal, dibujado, obstaculos: rects, holguraEn, celda: celdaDe, centro, tipo, dim, poly };
}

export const libreEn = (G, i) => G.valido[0][i] || G.valido[1][i] || G.valido[2][i] || G.valido[3][i];

// Vecino de i en la direccion d, o -1
export function vecino(G, i, d) {
  const x = (i % G.nx) + DIRS[d][0], y = Math.floor(i / G.nx) + DIRS[d][1];
  return x < 0 || y < 0 || x >= G.nx || y >= G.ny ? -1 : y * G.nx + x;
}

/**
 * Pasos minimos (sin otras gruas ni giros) desde cada celda hasta la meta. `prohibido(i)` excluye
 * celdas. Sirve de heuristica del A* y para saber que se conecta con que.
 */
export function distancias(G, meta, prohibido = null) {
  const d = new Float32Array(G.n).fill(Infinity);
  if (meta < 0) return d;
  d[meta] = 0;
  // BFS de 8 vecinos (cada paso cuesta 1, igual que en el A*)
  const cola = new Int32Array(G.n);
  let a = 0, b = 0;
  cola[b++] = meta;
  while (a < b) {
    const i = cola[a++];
    for (let k = 0; k < 8; k++) {
      const j = vecino(G, i, k);
      if (j < 0 || d[j] !== Infinity || !G.valido[k % 4][j] || !G.valido[k % 4][i] || (prohibido && prohibido(j))) continue;
      d[j] = d[i] + 1;
      cola[b++] = j;
    }
  }
  return d;
}

// Montículo binario por f
class Monticulo {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(x) {
    const a = this.a; a.push(x);
    let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= x.f) break; a[i] = a[p]; i = p; }
    a[i] = x;
  }
  pop() {
    const a = this.a, top = a[0], x = a.pop();
    if (a.length) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i, v = x;
        if (l < a.length && a[l].f < v.f) { m = l; v = a[l]; }
        if (r < a.length && a[r].f < v.f) { m = r; v = a[r]; }
        if (m === i) break;
        a[i] = a[m]; i = m;
      }
      a[i] = x;
    }
    return top;
  }
}

// Montículo de numeros (clave f, valor entero) en arreglos: sin objetos para el recolector
class MonticuloNum {
  constructor(n = 1024) { this.f = new Float64Array(n); this.v = new Int32Array(n); this.size = 0; }
  push(f, v) {
    if (this.size === this.f.length) {
      const f2 = new Float64Array(this.size * 2), v2 = new Int32Array(this.size * 2);
      f2.set(this.f); v2.set(this.v); this.f = f2; this.v = v2;
    }
    let i = this.size++;
    while (i > 0) { const p = (i - 1) >> 1; if (this.f[p] <= f) break; this.f[i] = this.f[p]; this.v[i] = this.v[p]; i = p; }
    this.f[i] = f; this.v[i] = v;
  }
  pop() {
    const top = this.v[0], n = --this.size;
    const f = this.f[n], v = this.v[n];
    let i = 0;
    for (;;) {
      const l = 2 * i + 1, r = l + 1;
      let m = i, fm = f;
      if (l < n && this.f[l] < fm) { m = l; fm = this.f[l]; }
      if (r < n && this.f[r] < fm) { m = r; fm = this.f[r]; }
      if (m === i) break;
      this.f[i] = this.f[m]; this.v[i] = this.v[m]; i = m;
    }
    this.f[i] = f; this.v[i] = v;
    return top;
  }
}

/**
 * A* en espacio y tiempo. Cada paso (moverse a un vecino o esperar) dura un tic.
 * opciones: { inicio, orientacion (0..3 o -1), k0 (tic de partida), meta, h (distancias a la meta),
 *   choca(i, o, k) → true si en el tic k la celda i con orientacion o queda muy cerca de otro,
 *   prohibido(i), metaOk(k, o) → la llegada en el tic k sirve (p. ej. la espera en el anden),
 *   maxTics (espera maxima), maxExpansiones, peso (de la heuristica: > 1 busca menos y rinde casi igual) }
 * Devuelve [{ i, o }] por tic desde k0 (incluido) hasta la llegada, o null.
 */
export function rutaEspacioTiempo(G, { inicio, orientacion = -1, k0 = 0, meta, h, choca, prohibido = null, metaOk = null, maxTics = 900, maxExpansiones = 90000, peso = 1.5 }) {
  if (inicio < 0 || meta < 0 || h[inicio] === Infinity) return null;
  const abiertos = new Monticulo();
  const vistos = new Set();
  const N4 = G.n * 4;
  const clave = (i, o, k) => (k - k0) * N4 + i * 4 + o;
  const costoCelda = (i) => (G.peatonal[i] ? 4 : 0) + (G.dibujado[i] ? 0 : 0.35);
  const os = orientacion >= 0 ? [orientacion] : [0, 1, 2, 3].filter((o) => G.valido[o][inicio]);
  if (!os.length) os.push(0);
  os.forEach((o) => abiertos.push({ i: inicio, o, k: k0, g: 0, f: h[inicio] * peso, padre: null }));
  let expansiones = 0;
  while (abiertos.size && expansiones < maxExpansiones) {
    const n = abiertos.pop();
    const cl = clave(n.i, n.o, n.k);
    if (vistos.has(cl)) continue;
    vistos.add(cl);
    expansiones++;
    if (n.i === meta && (!metaOk || metaOk(n.k, n.o))) {
      const out = [];
      for (let x = n; x; x = x.padre) out.push({ i: x.i, o: x.o });
      return out.reverse();
    }
    if (n.k - k0 >= maxTics) continue;
    const k = n.k + 1;
    // Esperar
    if (!choca(n.i, n.o, k)) {
      const g = n.g + 1 + costoCelda(n.i) * 0.25;
      abiertos.push({ i: n.i, o: n.o, k, g, f: g + h[n.i] * peso, padre: n });
    }
    // Girar en el lugar (sin avanzar) donde hay espacio
    if (G.giro[n.i]) {
      for (let o = 0; o < 4; o++) {
        if (o === n.o || !G.valido[o][n.i] || choca(n.i, o, k)) continue;
        const g = n.g + 1.3;
        abiertos.push({ i: n.i, o, k, g, f: g + h[n.i] * peso, padre: n });
      }
    }
    // Avanzar (o retroceder) por el eje actual; cambiar de eje solo donde puede girar
    for (let d = 0; d < 8; d++) {
      const o = d % 4;
      if (o !== n.o && !G.giro[n.i]) continue;
      const j = vecino(G, n.i, d);
      if (j < 0 || h[j] === Infinity || !G.valido[o][j] || !G.valido[o][n.i] || (prohibido && prohibido(j))) continue;
      if (vistos.has(clave(j, o, k)) || choca(j, o, k)) continue;
      const g = n.g + 1 + costoCelda(j) + (o !== n.o ? 0.6 : 0);
      abiertos.push({ i: j, o, k, g, f: g + h[j] * peso, padre: n });
    }
  }
  return null;
}

/**
 * Ruta fija (sin tiempo) con A*: avanza o retrocede por su eje y cambia de eje solo donde puede girar.
 * Devuelve [{ i, o }] o null.
 */
export function rutaEstatica(G, { inicio, orientacion = -1, meta, prohibido = null }) {
  if (inicio < 0 || meta < 0) return null;
  const mx = G.cx[meta], my = G.cy[meta], ic = 1 / G.c;
  const h = (i) => Math.max(Math.abs(G.cx[i] - mx), Math.abs(G.cy[i] - my)) * ic * 1.3;
  const mejor = new Float64Array(G.n * 4).fill(Infinity);
  const padre = new Int32Array(G.n * 4).fill(-1);
  const cerrado = new Uint8Array(G.n * 4);
  const abiertos = new MonticuloNum();
  const os = orientacion >= 0 ? [orientacion] : [0, 1, 2, 3].filter((o) => G.valido[o][inicio]);
  os.forEach((o) => { mejor[inicio * 4 + o] = 0; abiertos.push(h(inicio), inicio * 4 + o); });
  const intentar = (s, desde, g) => { if (g < mejor[s]) { mejor[s] = g; padre[s] = desde; abiertos.push(g + h(s >> 2), s); } };
  while (abiertos.size) {
    const st = abiertos.pop();
    if (cerrado[st]) continue;
    cerrado[st] = 1;
    const i = st >> 2, o0 = st & 3, g0 = mejor[st];
    if (i === meta) {
      const out = [];
      for (let s = st; s >= 0; s = padre[s]) out.push({ i: s >> 2, o: s & 3 });
      return out.reverse();
    }
    if (G.giro[i]) for (let o = 0; o < 4; o++) if (o !== o0 && G.valido[o][i]) intentar(i * 4 + o, st, g0 + 1.3);
    // Por el eje actual, hacia adelante o atras
    for (let d = o0; d < 8; d += 4) {
      const j = vecino(G, i, d);
      if (j < 0 || !G.valido[o0][j] || (prohibido && prohibido(j))) continue;
      intentar(j * 4 + o0, st, g0 + 1 + (G.peatonal[j] ? 4 : 0) + (G.dibujado[j] ? 0 : 0.35));
    }
  }
  return null;
}

/**
 * Tiempos sobre una ruta fija: en cada tic avanza un punto o espera donde esta. `choca(idx, k)`
 * dice si el punto idx en el tic k queda muy cerca de otro. `esperaMin` (idx → tics) obliga a
 * quedarse al menos eso en un punto (el anden). Devuelve el indice de la ruta por tic desde k0, o null.
 */
export function tiemposEnRuta(largo, { k0, choca, maxTics = 1500, esperaMin = null, ventana = 50 }) {
  // filas[t][idx]: -1 inalcanzable en el tic k0 + t; si no, tics que lleva esperando en idx.
  // Solo se miran los `ventana` puntos detras del mas adelantado (alli puede esperar): basta y es
  // mucho mas rapido que toda la ruta
  const filas = [], los = [];
  if (choca(0, k0)) return null;
  let actual = new Int32Array(largo).fill(-1), lo = 0, hi = 0;
  actual[0] = 0;
  filas.push(actual); los.push(0);
  const listo = (fila, i) => fila[i] >= 0 && (!esperaMin || fila[i] >= (esperaMin(i) || 0));
  for (let t = 1; t <= maxTics; t++) {
    const sig = new Int32Array(largo).fill(-1), k = k0 + t;
    const h2 = Math.min(largo - 1, hi + 1), l2 = Math.max(lo, h2 - ventana);
    let nuevoHi = -1, nuevoLo = -1;
    for (let i = l2; i <= h2; i++) {
      const desde = i > 0 && listo(actual, i - 1);
      const quieto = actual[i] >= 0;
      if (!desde && !quieto) continue;
      if (choca(i, k)) continue;
      // Si se puede de las dos formas se queda con la espera (llego antes: domina)
      sig[i] = quieto ? actual[i] + 1 : 0;
      if (nuevoLo < 0) nuevoLo = i;
      nuevoHi = i;
    }
    filas.push(sig); los.push(l2);
    if (listo(sig, largo - 1)) {
      // Hacia atras: en cada tic, de donde vino
      const idx = new Array(t + 1);
      let i = largo - 1;
      for (let u = t; u >= 0; u--) {
        idx[u] = i;
        if (u === 0) break;
        if (filas[u][i] === 0) {
          if (!(i > 0 && filas[u - 1][i - 1] >= 0)) return null;
          i -= 1;
        }
      }
      return idx[0] === 0 ? idx : null;
    }
    if (nuevoHi < 0) return null;
    actual = sig; lo = nuevoLo; hi = nuevoHi;
  }
  return null;
}

/** Celda valida mas cercana a (x, y) que cumple `filtro` (busqueda en anillos), o -1 */
export function celdaCercana(G, x, y, filtro) {
  const ci = Math.min(G.nx - 1, Math.max(0, Math.floor((x - G.x0) / G.c)));
  const cj = Math.min(G.ny - 1, Math.max(0, Math.floor((y - G.y0) / G.c)));
  let mejor = -1, dm = Infinity;
  const R = Math.max(G.nx, G.ny);
  for (let r = 0; r <= R; r++) {
    for (let j = cj - r; j <= cj + r; j++) {
      for (let i = ci - r; i <= ci + r; i++) {
        if (i < 0 || j < 0 || i >= G.nx || j >= G.ny || (Math.abs(i - ci) !== r && Math.abs(j - cj) !== r)) continue;
        const k = j * G.nx + i;
        if (!filtro(k)) continue;
        const p = G.centro(k), d = Math.hypot(p.x - x, p.y - y);
        if (d < dm) { dm = d; mejor = k; }
      }
    }
    // Lo encontrado a radio r ya no lo mejora un anillo mas alla de r·√2
    if (mejor >= 0 && (r - 1) * G.c > dm) break;
  }
  return mejor;
}


// ─── Cuerpos túnel: alto libre según quién pasa y hueco en planta ───
// PROVISORIO (Técnica Racklog confirma): paso libre que se ofrece según quién cruza bajo el túnel
export const ALTOS_TUNEL = [
  { v: 2.2, quien: 'personas', t: 'Personas' },
  { v: 2.5, quien: 'transpaleta', t: 'Transpaleta' },
  { v: 3.5, quien: 'grua', t: 'Grúa' },
  { v: 4.5, quien: 'gruaAlta', t: 'Grúa con carga alta' },
];
/** Paso libre que necesita el equipo de la bodega para cruzar un túnel (m) */
export const altoTunelGrua = (tipo) => (tipo === 'transpaleta' || tipo === 'manual' ? 2.5 : 3.5);

/**
 * Hueco del cuerpo túnel en planta: { x0, y0, x1, y1 } entre los dos marcos del cuerpo (lo que queda
 * libre para pasar de un pasillo al otro), o null si el rack no tiene túnel. Usa las mismas coordenadas
 * locales que el plano 2D (u a lo largo desde la izquierda del frente).
 */
export function huecoTunel(r, m = null) {
  if (r.tipo !== 'RS' || !r.tunel) return null;
  const med = m ?? medidasRack(r);
  if (!med.tunel) return null;
  const q = rectangulo(r), lado = deLado(r);
  const L = lado ? q.alto : q.ancho;
  const paso = (L - 0.1) / Math.max(1, r.cuerpos);
  // Entre las caras de los marcos (marco de ~0,1 m centrado en cada eje)
  let u0 = 0.05 + med.tunel.indice * paso + 0.05, u1 = 0.05 + (med.tunel.indice + 1) * paso - 0.05;
  if (r.rot === 180 || r.rot === 270) [u0, u1] = [L - u1, L - u0];
  return lado
    ? { x0: q.x0, x1: q.x0 + q.ancho, y0: q.y0 + u0, y1: q.y0 + u1 }
    : { x0: q.x0 + u0, x1: q.x0 + u1, y0: q.y0, y1: q.y0 + q.alto };
}

/** ¿La grúa de la bodega cabe bajo el túnel de este rack? */
export function tunelParaGrua(r, tipo) {
  if (r.tipo !== 'RS' || !r.tunel) return false;
  const t = medidasRack(r).tunel;
  // Lo que de verdad queda libre bajo la viga del túnel (más gruesa), no solo el paso que se pidió
  return !!t && (t.libreReal ?? t.altoLibre) >= altoTunelGrua(tipo) - 0.01;
}

// Rectángulos que ocupa un rack para la grúa: entero, o partido en dos si tiene un túnel por donde cabe
function rectsRack(r, tipo) {
  const q = aCaja(rectangulo(r));
  if (!tunelParaGrua(r, tipo)) return [q];
  const h = huecoTunel(r);
  if (!h) return [q];
  return deLado(r)
    ? [{ ...q, y1: h.y0 }, { ...q, y0: h.y1 }]
    : [{ ...q, x1: h.x0 }, { ...q, x0: h.x1 }];
}

/** Andenes (puntos de carga y descarga) de la grilla: frente a cada andén o portón; si no hay, al centro del muro de abajo */
export function andenesDe(G, bodega) {
  const cj = caja(G.poly), dim = G.dim;
  const libreGiro = (k) => libreEn(G, k) && G.giro[k] && !G.peatonal[k];
  const andenes = [];
  (bodega.elementos ?? []).filter((e) => e.clase === 'anden' || e.clase === 'porton').forEach((e) => {
    const ref = e.clase === 'anden' ? { x: e.x, y: e.y + e.alto / 2 + dim.largo / 2 + 0.4 } : { x: e.x, y: e.y };
    const k = celdaCercana(G, ref.x, ref.y, libreGiro);
    if (k >= 0 && !andenes.some((a) => a.celda === k)) andenes.push({ celda: k, ...G.centro(k), elemento: e.id ?? null, clase: e.clase });
  });
  if (!andenes.length) {
    const k = celdaCercana(G, (cj.x0 + cj.x1) / 2, cj.y1, libreGiro);
    if (k >= 0) andenes.push({ celda: k, ...G.centro(k), elemento: null, clase: null });
  }
  return andenes;
}

/**
 * Recorrido mas corto (en m) desde `inicio` a cada celda, andando por los ejes del plano (la grua avanza
 * de frente o en reversa y dobla donde tiene espacio para girar). Dijkstra sobre (celda, eje) con un
 * castigo por doblar, para que las rutas salgan rectas. Devuelve { costo, padre } (por estado celda*2+eje).
 */
function recorridoDesde(G, inicio) {
  const N = G.n * 2, costo = new Float64Array(N).fill(Infinity), padre = new Int32Array(N).fill(-1);
  const h = new MonticuloNum();
  const ejes = [[0, 4], [2, 6]];   // direcciones del eje x (E, O) y del eje y (N, S)
  [0, 1].forEach((e) => { if (G.valido[e * 2][inicio]) { costo[inicio * 2 + e] = 0; h.push(0, inicio * 2 + e); } });
  const DOBLAR = 3, CORRER = 2;   // castigo (en celdas) por girar y por correrse de carril
  while (h.size) {
    const s = h.pop(), i = s >> 1, e = s & 1, c = costo[s];
    const o = e * 2;
    for (const d of ejes[e]) {
      const j = vecino(G, i, d);
      if (j < 0 || !G.valido[o][j]) continue;
      const cj = c + 1 + (G.peatonal[j] ? 2 : 0), t = j * 2 + e;
      if (cj < costo[t]) { costo[t] = cj; padre[t] = s; h.push(cj, t); }
    }
    // Correrse de carril (una curva suave): una celda hacia el costado sin cambiar de eje
    for (const d of ejes[1 - e]) {
      const j = vecino(G, i, d);
      if (j < 0 || !G.valido[o][j]) continue;
      const cj = c + CORRER + (G.peatonal[j] ? 2 : 0), t = j * 2 + e;
      if (cj < costo[t]) { costo[t] = cj; padre[t] = s; h.push(cj, t); }
    }
    const t = i * 2 + (1 - e);
    if (G.giro[i] && G.valido[(1 - e) * 2][i] && c + DOBLAR < costo[t]) { costo[t] = c + DOBLAR; padre[t] = s; h.push(c + DOBLAR, t); }
  }
  return { costo, padre };
}
// Puntos de quiebre de la ruta hasta el estado s (donde cambia la direccion de avance)
function puntosRuta(G, padre, s) {
  const celdas = [];
  for (let t = s; t >= 0; t = padre[t]) if (!celdas.length || celdas[celdas.length - 1] !== t >> 1) celdas.push(t >> 1);
  celdas.reverse();
  const pts = [], dir = (a, b) => `${Math.sign(G.cx[b] - G.cx[a])},${Math.sign(G.cy[b] - G.cy[a])}`;
  celdas.forEach((i, k) => {
    if (k === 0 || k === celdas.length - 1 || dir(celdas[k - 1], i) !== dir(i, celdas[k + 1])) {
      const p = G.centro(i);
      pts.push({ x: +p.x.toFixed(2), y: +p.y.toFixed(2) });
    }
  });
  return pts;
}
const largoDe = (pts) => pts.slice(1).reduce((t, p, i) => t + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);

// Pasillos de carga donde trabaja la grua (frente a selectivos o drive-in nuevos)
function pasillosDeCarga(racks, bodega) {
  const porId = new Map(racks.map((r) => [r.id, r]));
  return pasillos(racks, bodega).filter((p) => p.racks.some((id) => { const r = porId.get(id); return r && conGrua(r); }));
}

// Mejor llegada a cada pasillo: la celda de su franja mas cercana al anden (por recorrido)
function llegadas(G, R, lista) {
  return lista.map((p) => {
    const f = franjaPasillo(p);
    let mejor = -1, cm = Infinity;
    for (let k = 0; k < G.n; k++) {
      if (!dentro(G.cx[k], G.cy[k], f)) continue;
      for (let e = 0; e < 2; e++) if (R.costo[k * 2 + e] < cm) { cm = R.costo[k * 2 + e]; mejor = k * 2 + e; }
    }
    return { p, f, s: mejor, costo: cm };
  });
}
const dentro = (x, y, q) => x >= q.x0 - 0.01 && x <= q.x1 + 0.01 && y >= q.y0 - 0.01 && y <= q.y1 + 0.01;

/**
 * Recorridos de la grua para dibujar en el plano: desde el anden (o porton) hasta cada pasillo de carga
 * y por el pasillo hasta su fondo. Devuelve { tipo, andenes, rutas: [{ id, puntos, largo, llega }] }.
 * `llega: false` = la grua no alcanza ese pasillo (sin espacio para pasar o girar).
 */
export function recorridosGrua(bodega, racks, { tipo = tipoGrua(bodega), celda = null } = {}) {
  const G = crearGrilla(bodega, racks, { tipo, celda });
  const andenes = andenesDe(G, bodega);
  const lista = pasillosDeCarga(racks, bodega);
  if (!andenes.length || !lista.length) return { tipo, andenes, rutas: [] };
  const R = recorridoDesde(G, andenes[0].celda);
  const rutas = llegadas(G, R, lista).map(({ p, f, s, costo }) => {
    if (s < 0 || !Number.isFinite(costo)) return { id: p.id, puntos: [], largo: 0, llega: false, franja: f };
    const pts = puntosRuta(G, R.padre, s);
    // Por el pasillo: de la llegada al otro extremo, por su eje
    const u = pts[pts.length - 1], cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2;
    if (p.eje === 'y') {   // pasillo horizontal (ancho medido en y)
      const fin = Math.abs(u.x - f.x0) > Math.abs(u.x - f.x1) ? f.x0 + 0.6 : f.x1 - 0.6;
      pts.push({ x: u.x, y: +cy.toFixed(2) }, { x: +fin.toFixed(2), y: +cy.toFixed(2) });
    } else {
      const fin = Math.abs(u.y - f.y0) > Math.abs(u.y - f.y1) ? f.y0 + 0.6 : f.y1 - 0.6;
      pts.push({ x: +cx.toFixed(2), y: u.y }, { x: +cx.toFixed(2), y: +fin.toFixed(2) });
    }
    const limpio = pts.filter((q, i) => i === 0 || Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) > 0.05);
    return { id: p.id, puntos: limpio, largo: +largoDe(limpio).toFixed(1), llega: true, franja: f };
  });
  return { tipo, andenes: andenes.map(({ x, y, clase }) => ({ x, y, clase })), rutas };
}

/**
 * Donde conviene un cuerpo tunel: filas largas de selectivo que obligan a la grua a dar la vuelta para
 * llegar a los pasillos del otro lado. Prueba abrir un cuerpo (el mas cercano al anden y el del medio)
 * y mide cuanto se acorta el recorrido de ida y vuelta al pasillo que mas gana.
 * Devuelve [{ rackId, cuerpo, altoLibre, ahorro (m, ida y vuelta), nuevos (pasillos a los que hoy no llega), x, y }],
 * los que mas ayudan primero.
 */
const mejorQue = (a, b) => a.nuevos > b.nuevos || (a.nuevos === b.nuevos && a.ahorro > b.ahorro);
// Solo por ahorro (la grua ya llega a todo): filas largas y un ahorro que valga las posiciones que se pierden
export function sugerirTuneles(bodega, racks, { tipo = tipoGrua(bodega), max = 3, minimo = 20, filaMinima = 20, maxPruebas = 10 } = {}) {
  const c = celdaSugerencia(bodega);
  const G0 = crearGrilla(bodega, racks, { tipo, celda: c });
  const andenes = andenesDe(G0, bodega);
  const lista = pasillosDeCarga(racks, bodega);
  if (!andenes.length || !lista.length) return [];
  const a = andenes[0];
  const base = llegadas(G0, recorridoDesde(G0, a.celda), lista).map((l) => l.costo * c);
  const altoLibre = altoTunelGrua(tipo);
  const candidatos = [];
  racks.filter((r) => r.tipo === 'RS' && !r.existente && !r.tunel && r.cuerpos >= 3).forEach((r) => {
    const q = rectangulo(r), lado = deLado(r), L = lado ? q.alto : q.ancho, paso = (L - 0.1) / r.cuerpos;
    const proy = lado ? a.y - q.y0 : a.x - q.x0;   // coordenada del anden a lo largo del rack (sin girar)
    let iA = Math.floor((Math.min(L - 0.06, Math.max(0.06, proy)) - 0.05) / paso);
    if (r.rot === 180 || r.rot === 270) iA = r.cuerpos - 1 - iA;
    const iM = Math.floor(r.cuerpos / 2);
    [...new Set([iA, iM].map((i) => Math.min(r.cuerpos - 1, Math.max(0, i))))].forEach((i) => candidatos.push({ r, i, L }));
  });
  candidatos.sort((x, y) => y.L - x.L);
  const out = [];
  candidatos.slice(0, maxPruebas).forEach(({ r, i, L }) => {
    const conTunel = { ...r, tunel: { cuerpo: i, altoLibre } };
    if (!tunelParaGrua(conTunel, tipo)) return;
    const otros = racks.map((x) => (x.id === r.id ? conTunel : x));
    const G = crearGrilla(bodega, otros, { tipo, celda: c });
    const k = a.celda;   // misma grilla (mismo tamaño de celda): la misma celda de partida
    const nuevo = llegadas(G, recorridoDesde(G, k), pasillosDeCarga(otros, bodega)).map((l) => l.costo * c);
    // Pasillos a los que hoy no llega y con el tunel si; y lo que se acorta el mas beneficiado
    let ahorro = 0, nuevos = 0;
    base.forEach((b, j) => {
      const d = nuevo[j] ?? Infinity;
      if (!Number.isFinite(b)) { if (Number.isFinite(d)) nuevos++; return; }
      if (Number.isFinite(d)) ahorro = Math.max(ahorro, b - d);
    });
    ahorro = Math.round(2 * ahorro);
    if (!nuevos && (ahorro < minimo || L < filaMinima)) return;
    const h = huecoTunel(conTunel);
    out.push({ rackId: r.id, cuerpo: i, altoLibre, ahorro, nuevos, x: +((h.x0 + h.x1) / 2).toFixed(2), y: +((h.y0 + h.y1) / 2).toFixed(2) });
  });
  // Un tunel por rack (el que mas ahorra) y los mejores primero
  const porRack = new Map();
  out.forEach((s) => { if (!porRack.has(s.rackId) || mejorQue(s, porRack.get(s.rackId))) porRack.set(s.rackId, s); });
  return [...porRack.values()].sort((x, y) => (mejorQue(x, y) ? -1 : 1)).slice(0, max);
}
// Celda algo mas gruesa para probar tuneles rapido (a lo mas ~12.000 celdas)
function celdaSugerencia(bodega) {
  const cj = caja(contorno(bodega));
  return Math.max(0.3, Math.sqrt(((cj.x1 - cj.x0) * (cj.y1 - cj.y0)) / 12000));
}

/** Cuerpo del rack que queda en el punto (x, y) a lo largo de la fila (o -1 si el punto no cae en su largo) */
export function cuerpoEn(r, x, y) {
  const q = rectangulo(r), lado = deLado(r), L = lado ? q.alto : q.ancho;
  let u = lado ? y - q.y0 : x - q.x0;
  if (u < 0.05 || u > L - 0.05) return -1;
  if (r.rot === 180 || r.rot === 270) u = L - u;
  return Math.min(r.cuerpos - 1, Math.max(0, Math.floor((u - 0.05) / ((L - 0.1) / r.cuerpos))));
}

/**
 * Túneles en línea: a partir de un túnel sugerido, el mismo paso en las otras filas de selectivo paralelas
 * que cruza esa línea (para que la grúa atraviese todas las filas derecho). Devuelve [{ rackId, cuerpo }]
 * incluido el sugerido.
 */
export function tunelesAlineados(racks, s) {
  const base = racks.find((r) => r.id === s.rackId);
  if (!base) return [];
  const lado = deLado(base);
  return racks.filter((r) => r.id === s.rackId || (r.tipo === 'RS' && !r.existente && !r.tunel && deLado(r) === lado))
    .map((r) => ({ rackId: r.id, cuerpo: r.id === s.rackId ? s.cuerpo : cuerpoEn(r, s.x, s.y) }))
    .filter((t) => t.cuerpo >= 0);
}
