// Accesorios y seguridad del planificador (paso 4): el sistema propone lo necesario segun los racks,
// la bodega y los pallets; el cliente acepta, quita o cambia cantidades. Sin Vue ni three.
// Las marcas son para dibujar en el plano 2D (coordenadas de planta, m).
// Medidas y modulos PROVISORIOS hasta que Racklog confirme su catalogo (PROMPT-CLAUDE-CODE.md §7).
import { medidasRack, rectangulo, contorno, rectElemento, rayoMuro } from './planificador.js';
import { SEPARACION_DOBLE } from './medidas.js';
import { pasillos, carasDeCarga } from './pasillos.js';

export const PARAMETROS_ACCESORIOS = {
  proteccionBastidor: { simple: 1.0, doble: 2.3, confirmado: false },   // m: lo mismo que el fondo del marco
  moduloBaranda: { valor: 2.0, confirmado: false },                      // m por modulo de baranda
  aberturaBaranda: { valor: 1.2, confirmado: false },                    // m de abertura en puertas y cruces
  separadoresPorMarco: { hasta6m: 2, mas6m: 3, confirmado: false },      // por marco doble segun alto del marco
  toposPorPosicion: { valor: 2, confirmado: false },
  holguraTopes: { valor: 0.3, confirmado: false },                       // m: pallet mas corto que el marco en mas de esto
  mallaDistancia: { valor: 1.0, confirmado: false },                     // m: espalda a menos de esto de un pasillo peatonal
  cabeceraLibre: { valor: 0.5, confirmado: false },                      // m: menos que esto al muro o vecino no es cabecera expuesta
};

// Pilar de marco: 100 mm (medidas.js)
const PILAR = 0.1;
const LADO = {
  arriba: { dx: 0, dy: -1 }, derecha: { dx: 1, dy: 0 }, abajo: { dx: 0, dy: 1 }, izquierda: { dx: -1, dy: 0 },
};
const FRENTE = { 0: 'arriba', 90: 'derecha', 180: 'abajo', 270: 'izquierda' };
const OPUESTO = { arriba: 'abajo', abajo: 'arriba', derecha: 'izquierda', izquierda: 'derecha' };
// Elementos que tapan una cabecera (los pasillos dibujados son transito: no tapan)
const TAPAN = ['pilar', 'oficina', 'zona'];

const PLANOS = ['malla', 'madera', 'metal'];
const r2 = (v) => +v.toFixed(2);
const nuevos = (racks) => racks.filter((r) => !r.existente);
const filas = (r) => (r.doble ? 2 : 1);

export const mmTexto = (v) => `${Math.round(v * 1000).toLocaleString('es-CL')} mm`;
export const numTexto = (v) => (+v.toFixed(1)).toLocaleString('es-CL');

// Canilleras solo con grua o apilador (la transpaleta no levanta ni golpea el pilar en altura)
const usaGruaOApilador = (bodega) => (bodega.grua || 'contrapeso') !== 'transpaleta';

// ─── Geometria del rack en planta ───
// s: a lo largo del rack (cabecera a cabecera); t: fondo, 0 = cara del frente

/** Rack en coordenadas locales: largo, fondo y como pasar (s, t) a planta */
export function marcoLocal(r) {
  const p = rectangulo(r), x1 = p.x0 + p.ancho, y1 = p.y0 + p.alto;
  const lado = r.rot === 90 || r.rot === 270;
  const largo = lado ? p.alto : p.ancho, fondo = lado ? p.ancho : p.alto;
  const aPlanta = {
    0: (s, t) => ({ x: p.x0 + s, y: p.y0 + t }),
    180: (s, t) => ({ x: x1 - s, y: y1 - t }),
    90: (s, t) => ({ x: x1 - t, y: p.y0 + s }),
    270: (s, t) => ({ x: p.x0 + t, y: y1 - s }),
  }[r.rot] ?? ((s, t) => ({ x: p.x0 + s, y: p.y0 + t }));
  return { p, largo, fondo, aPlanta };
}

/** Posiciones s de los marcos a lo largo del rack (selectivo y drive-in) */
export function marcosS(r) {
  const m = medidasRack(r);
  if (m.tipo === 'drivein') return Array.from({ length: m.calles + 1 }, (_, i) => PILAR / 2 + i * m.anchoCalle);
  if (m.tipo === 'selectivo') return Array.from({ length: m.cuerpos + 1 }, (_, i) => PILAR / 2 + i * (m.viga + PILAR));
  return [];
}

/** Posiciones t de los pilares de un marco: frente y fondo de cada fila */
function pilaresT(r, fondo) {
  const m = medidasRack(r);
  if (m.tipo === 'selectivo' && m.doble) {
    return [PILAR / 2, m.fondo - PILAR / 2, m.fondo + SEPARACION_DOBLE + PILAR / 2, fondo - PILAR / 2];
  }
  return [PILAR / 2, fondo - PILAR / 2];
}

/** Lados cortos del rack (cabeceras), en el orden s = 0 y s = largo */
export function cabeceras(r) {
  const s0 = { 0: 'izquierda', 180: 'derecha', 90: 'arriba', 270: 'abajo' }[r.rot] ?? 'izquierda';
  return [s0, OPUESTO[s0]];
}

/**
 * Espacio libre (m) desde el borde del rack hacia `lado` hasta el muro, otro rack o un elemento
 * que tape (pilar, oficina, zona) y comparta tramo con ese borde
 */
export function libreHacia(r, lado, racks, bodega) {
  const p = rectangulo(r), { dx, dy } = LADO[lado];
  const borde = dx ? (dx > 0 ? p.x0 + p.ancho : p.x0) : (dy > 0 ? p.y0 + p.alto : p.y0);
  const a0 = dx ? p.y0 : p.x0, a1 = dx ? p.y0 + p.alto : p.x0 + p.ancho, medio = (a0 + a1) / 2;
  const poly = contorno(bodega);
  let libre = dx ? rayoMuro(borde, medio, dx, dy, poly) : rayoMuro(medio, borde, dx, dy, poly);
  const otros = [
    ...racks.filter((o) => o.id !== r.id).map(rectangulo),
    ...(bodega.elementos ?? []).filter((e) => TAPAN.includes(e.clase)).map(rectElemento),
  ];
  otros.forEach((q) => {
    const b0 = Math.max(a0, dx ? q.y0 : q.x0), b1 = Math.min(a1, dx ? q.y0 + q.alto : q.x0 + q.ancho);
    if (b1 - b0 < 0.01) return;
    const gap = dx > 0 ? q.x0 - borde : dx < 0 ? borde - (q.x0 + q.ancho) : dy > 0 ? q.y0 - borde : borde - (q.y0 + q.alto);
    if (gap > -1e-6 && gap < libre) libre = Math.max(0, gap);
  });
  return libre;
}

/** Cabeceras que dan a un pasillo o cruce: [{ lado, s }] (s = 0 o largo) */
export function cabecerasExpuestas(r, racks, bodega) {
  const { largo } = marcoLocal(r);
  return cabeceras(r)
    .map((lado, i) => ({ lado, s: i ? largo : 0 }))
    .filter(({ lado }) => libreHacia(r, lado, racks, bodega) >= PARAMETROS_ACCESORIOS.cabeceraLibre.valor - 1e-6);
}

/** La cara `lado` del rack tiene un pasillo delante (de la lista de pasillos()) */
export function caraConPasillo(r, lado, lista) {
  const p = rectangulo(r), e = 0.02, x1 = p.x0 + p.ancho, y1 = p.y0 + p.alto;
  return lista.some((q) => {
    if (!q.racks.includes(r.id) && q.vecino !== r.id) return false;
    if (lado === 'arriba') return Math.abs(q.y1 - p.y0) < e && q.x1 > p.x0 && q.x0 < x1;
    if (lado === 'abajo') return Math.abs(q.y0 - y1) < e && q.x1 > p.x0 && q.x0 < x1;
    if (lado === 'izquierda') return Math.abs(q.x1 - p.x0) < e && q.y1 > p.y0 && q.y0 < y1;
    return Math.abs(q.x0 - x1) < e && q.y1 > p.y0 && q.y0 < y1;
  });
}

// Tipo de pallet en la altura i (0 = piso): el de la mezcla o, con un solo tipo en el catalogo, ese
export function tipoEnAltura(r, i, pallets = []) {
  const id = Array.isArray(r.mezcla) ? r.mezcla[i] : pallets.length === 1 ? pallets[0].id : null;
  return pallets.find((t) => t.id === id) ?? null;
}
const pidePlano = (t) => !!t && (t.sinPallet || (Number(t.sobresale) || 0) > 0);

/** Plano de carga de cada altura: el marcado o, si el pallet lo pide, malla. null si no lleva */
export function planosDe(r, pallets = []) {
  return Array.from({ length: (r.niveles || 0) + 1 }, (_, i) => {
    if (i === 0) return null;
    if (PLANOS.includes(r.planos?.[i])) return r.planos[i];
    return pidePlano(tipoEnAltura(r, i, pallets)) ? 'malla' : null;
  });
}

// ─── Cada accesorio ───

function canilleras(bodega, racks) {
  if (!usaGruaOApilador(bodega)) return null;
  const lista = pasillos(racks, bodega);
  const puntos = new Map();
  const poner = (q) => puntos.set(`${q.x.toFixed(2)},${q.y.toFixed(2)}`, { tipo: 'punto', x: r2(q.x), y: r2(q.y) });
  let cabecerasN = 0;
  nuevos(racks).filter((r) => r.tipo === 'RS' || r.tipo === 'DI').forEach((r) => {
    const { fondo, aPlanta } = marcoLocal(r), S = marcosS(r), T = pilaresT(r, fondo);
    const frente = FRENTE[r.rot] ?? 'arriba';
    // Cada pilar del lado de pasillo
    carasDeCarga(r).forEach((lado) => {
      if (!caraConPasillo(r, lado, lista)) return;
      const t = lado === frente ? T[0] : T[T.length - 1];
      S.forEach((s) => poner(aPlanta(s, t)));
    });
    // Ambos pilares (todos los de la fila doble) del marco de cabecera expuesta
    cabecerasExpuestas(r, racks, bodega).forEach(({ s }) => {
      cabecerasN++;
      const sm = s ? S[S.length - 1] : S[0];
      T.forEach((t) => poner(aPlanta(sm, t)));
    });
    // Cuerpo tunel: pasa trafico por debajo, van en sus dos marcos
    const m = medidasRack(r);
    if (m.tunel) [S[m.tunel.indice], S[m.tunel.indice + 1]].forEach((s) => T.forEach((t) => poner(aPlanta(s, t))));
  });
  if (!puntos.size) return null;
  return {
    id: 'canilleras', nombre: 'Canilleras', plural: 'canilleras',
    paraQue: 'Protegen el pie del pilar de los golpes de la grúa.',
    cantidad: puntos.size, unidad: 'u', medida: '', sufijo: '',
    motivo: `Tu equipo circula por los pasillos: van en cada pilar que da a un pasillo${cabecerasN ? ' y en los marcos de cabecera' : ''}.`,
    obligatorio: true, marcas: [...puntos.values()],
  };
}

function proteccionBastidor(bodega, racks) {
  const P = PARAMETROS_ACCESORIOS.proteccionBastidor;
  const porMedida = new Map(), marcas = [];
  nuevos(racks).filter((r) => r.tipo === 'RS' || r.tipo === 'DI').forEach((r) => {
    const { fondo, aPlanta } = marcoLocal(r);
    // Selectivo: simple 1.000 / doble 2.300 mm; drive-in: el fondo del bloque
    const medida = r.tipo === 'RS' ? (r.doble ? P.doble : P.simple) : r2(fondo);
    cabecerasExpuestas(r, racks, bodega).forEach(({ s }) => {
      porMedida.set(medida, (porMedida.get(medida) ?? 0) + 1);
      // Barra pegada a la cabecera, por fuera
      const sb = s ? s + 0.05 : -0.05;
      const a = aPlanta(sb, 0), b = aPlanta(sb, fondo);
      marcas.push({ tipo: 'barra', x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y), medida });
    });
  });
  if (!marcas.length) return null;
  const detalle = [...porMedida.entries()].sort((a, b) => a[0] - b[0]).map(([medida, cantidad]) => ({ medida, cantidad }));
  const medida = detalle.map((d) => (detalle.length > 1 ? `${d.cantidad} de ${mmTexto(d.medida)}` : mmTexto(d.medida))).join(' · ');
  return {
    id: 'proteccionBastidor', nombre: 'Protección de bastidor', plural: 'protecciones de bastidor',
    paraQue: 'Protege el marco de la cabecera de los golpes de la grúa al doblar.',
    cantidad: marcas.length, unidad: 'u', medida, detalle,
    sufijo: detalle.length === 1 ? `de ${mmTexto(detalle[0].medida)}` : `(${medida})`,
    motivo: 'Hay cabeceras de fila que dan a un pasillo o cruce (no están contra un muro).',
    obligatorio: true, marcas,
  };
}

// Intervalos [a, b] restados de [0, largo]
function restar(largo, huecos) {
  const orden = huecos.map(([a, b]) => [Math.max(0, a), Math.min(largo, b)]).filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const out = [];
  let c = 0;
  orden.forEach(([a, b]) => { if (a > c) out.push([c, a]); c = Math.max(c, b); });
  if (c < largo) out.push([c, largo]);
  return out.filter(([a, b]) => b - a > 0.05);
}

/** Tramos de baranda de un pasillo peatonal: [{ lado, a, b, x1, y1, x2, y2 }] y las aberturas */
export function tramosBaranda(e, bodega) {
  const ab = PARAMETROS_ACCESORIOS.aberturaBaranda.valor;
  const vertical = e.alto >= e.ancho;
  const q = rectElemento(e);
  const largo = vertical ? e.alto : e.ancho, ini = vertical ? q.y0 : q.x0;
  const lados = vertical ? [q.x0, q.x0 + q.ancho] : [q.y0, q.y0 + q.alto];
  const huecos = [[], []];
  let aberturas = 0;
  (bodega.elementos ?? []).forEach((o) => {
    if (o.id === e.id) return;
    // Cruce: pasillo de grua atravesado; uno paralelo al lado no abre la baranda
    const cruce = o.clase === 'pasilloGrua' && (o.alto >= o.ancho) !== vertical;
    if (!cruce && !['porton', 'oficina', 'anden'].includes(o.clase)) return;
    const r = rectElemento(o), h = 0.05;
    // Tocan: se solapan o quedan a menos de 5 cm
    if (!(r.x0 < q.x0 + q.ancho + h && q.x0 < r.x0 + r.ancho + h && r.y0 < q.y0 + q.alto + h && q.y0 < r.y0 + r.alto + h)) return;
    const a = (vertical ? r.y0 : r.x0) - ini, b = a + (vertical ? r.alto : r.ancho);
    const a0 = Math.max(0, a), b0 = Math.min(largo, b);
    if (cruce) {
      // El cruce corta los dos lados, del ancho del pasillo de grua (minimo una abertura)
      const c = (a0 + b0) / 2, w = Math.max(ab, b0 - a0);
      huecos[0].push([c - w / 2, c + w / 2]); huecos[1].push([c - w / 2, c + w / 2]);
    } else {
      // Puerta, oficina o anden: una abertura en el lado que toca
      const centro = vertical ? r.x0 + r.ancho / 2 : r.y0 + r.alto / 2;
      const i = Math.abs(centro - lados[0]) <= Math.abs(centro - lados[1]) ? 0 : 1;
      const c = (a0 + b0) / 2;
      huecos[i].push([c - ab / 2, c + ab / 2]);
    }
    aberturas++;
  });
  const tramos = [];
  lados.forEach((l, i) => restar(largo, huecos[i]).forEach(([a, b]) => {
    const p1 = vertical ? { x: l, y: ini + a } : { x: ini + a, y: l };
    const p2 = vertical ? { x: l, y: ini + b } : { x: ini + b, y: l };
    tramos.push({ lado: i, a, b, x1: r2(p1.x), y1: r2(p1.y), x2: r2(p2.x), y2: r2(p2.y) });
  }));
  return { tramos, aberturas, largo };
}

function barandas(bodega) {
  const mod = PARAMETROS_ACCESORIOS.moduloBaranda.valor;
  const peatonales = (bodega.elementos ?? []).filter((e) => e.clase === 'pasilloPeatonal');
  if (!peatonales.length) return null;
  let metros = 0, aberturas = 0;
  const marcas = [];
  peatonales.forEach((e) => {
    const t = tramosBaranda(e, bodega);
    aberturas += t.aberturas;
    // Cada tramo se arma con modulos enteros
    t.tramos.forEach((s) => {
      metros += Math.ceil((s.b - s.a) / mod - 1e-6) * mod;
      marcas.push({ tipo: 'linea', x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 });
    });
  });
  if (!metros) return null;
  return {
    id: 'barandas', nombre: 'Baranda de protección', plural: 'baranda',
    paraQue: 'Separa a las personas del tránsito de grúas en los pasillos peatonales.',
    cantidad: metros, unidad: 'm', medida: `módulos de ${numTexto(mod)} m`, modulos: metros / mod, sufijo: '',
    motivo: `Dibujaste ${peatonales.length === 1 ? 'un pasillo peatonal' : `${peatonales.length} pasillos peatonales`}: baranda a ambos lados${aberturas ? `, con ${aberturas} ${aberturas === 1 ? 'abertura' : 'aberturas'} en cruces y puertas` : ''}.`,
    obligatorio: false, marcas,
  };
}

function planosCarga(racks, pallets) {
  const porTipo = { malla: 0, madera: 0, metal: 0 };
  nuevos(racks).filter((r) => r.tipo === 'RS').forEach((r) => {
    planosDe(r, pallets).forEach((pl) => { if (pl) porTipo[pl] += r.cuerpos * filas(r); });
  });
  const total = porTipo.malla + porTipo.madera + porTipo.metal;
  if (!total) return null;
  const medida = PLANOS.filter((k) => porTipo[k]).map((k) => `${porTipo[k]} ${k}`).join(' · ');
  return {
    id: 'planosCarga', nombre: 'Plano de carga', plural: 'planos de carga',
    paraQue: 'Superficie sobre las vigas para cajas sin pallet o carga que sobresale.',
    cantidad: total, unidad: 'u', medida, porTipo, sufijo: `(${medida})`,
    motivo: 'Hay niveles marcados con plano o con pallets que sobresalen o cajas sin pallet.',
    obligatorio: true, marcas: [],
  };
}

function separadores(racks) {
  const S = PARAMETROS_ACCESORIOS.separadoresPorMarco;
  let n = 0;
  nuevos(racks).filter((r) => r.tipo === 'RS' && r.doble).forEach((r) => {
    const m = medidasRack(r);
    n += (m.cuerpos + 1) * (m.alto <= 6 ? S.hasta6m : S.mas6m);
  });
  if (!n) return null;
  return {
    id: 'separadores', nombre: 'Separador de fila', plural: 'separadores de fila',
    paraQue: 'Une las dos filas de un rack doble y las mantiene a la misma distancia.',
    cantidad: n, unidad: 'u', medida: `${S.hasta6m} por marco hasta 6 m, ${S.mas6m} si es más alto`, sufijo: '',
    motivo: 'Tienes racks dobles (espalda con espalda).',
    obligatorio: true, marcas: [],
  };
}

function topes(racks, pallets) {
  const P = PARAMETROS_ACCESORIOS;
  let n = 0;
  nuevos(racks).filter((r) => r.tipo === 'RS').forEach((r) => {
    const m = medidasRack(r);
    for (let i = 1; i <= r.niveles; i++) {
      const t = tipoEnAltura(r, i, pallets);
      if (!t || t.sinPallet || !(t.fondo > 0)) continue;
      const deLado = t.frente > t.fondo + 1e-6;
      const noCalza = t.fondo > m.fondo + 1e-6 || t.fondo < m.fondo - P.holguraTopes.valor - 1e-6;
      if (deLado || noCalza) n += P.toposPorPosicion.valor * m.cuerpos * m.palletsPorViga * filas(r);
    }
  });
  if (!n) return null;
  return {
    id: 'topes', nombre: 'Tope de apoyo', plural: 'topes de apoyo',
    paraQue: 'Travesaños que sostienen el pallet cuando no apoya bien en las vigas.',
    cantidad: n, unidad: 'u', medida: `${P.toposPorPosicion.valor} por posición`, sufijo: '',
    motivo: 'El fondo de algún pallet no calza con el fondo del marco, o va de lado.',
    obligatorio: false, marcas: [],
  };
}

function placas(racks) {
  const n = nuevos(racks).filter((r) => ['RS', 'DI', 'AR'].includes(r.tipo)).length;
  if (!n) return null;
  return {
    id: 'placaCapacidad', nombre: 'Placa de capacidad', plural: 'placas de capacidad',
    paraQue: 'Letrero con la carga máxima por nivel, visible para el operador.',
    cantidad: n, unidad: 'u', medida: '1 por fila', sufijo: '',
    motivo: 'Es obligatoria en cada fila (ANSI MH16.1).',
    obligatorio: true, marcas: [],
  };
}

function mallaAnticaida(bodega, racks) {
  const d = PARAMETROS_ACCESORIOS.mallaDistancia.valor;
  const zonas = (bodega.elementos ?? []).filter((e) => e.clase === 'pasilloPeatonal' || e.clase === 'zona').map(rectElemento);
  if (!zonas.length) return null;
  let m2 = 0;
  const marcas = [];
  nuevos(racks).filter((r) => r.tipo === 'RS' && !r.doble).forEach((r) => {
    const { largo, fondo, aPlanta } = marcoLocal(r);
    // Franja de `d` m detras de la espalda
    const a = aPlanta(0, fondo), b = aPlanta(largo, fondo + d);
    const f = { x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) };
    const toca = zonas.some((q) => f.x0 < q.x0 + q.ancho - 0.001 && q.x0 < f.x1 - 0.001 && f.y0 < q.y0 + q.alto - 0.001 && q.y0 < f.y1 - 0.001);
    if (!toca) return;
    m2 += largo * medidasRack(r).alto;
    const e = aPlanta(largo, fondo);
    marcas.push({ tipo: 'linea', x1: r2(a.x), y1: r2(a.y), x2: r2(e.x), y2: r2(e.y) });
  });
  if (!m2) return null;
  return {
    id: 'mallaAnticaida', nombre: 'Malla anticaída posterior', plural: 'malla anticaída posterior',
    paraQue: 'Evita que la carga caiga por detrás del rack sobre personas.',
    cantidad: +m2.toFixed(1), unidad: 'm²', medida: 'largo de fila × alto de marco', sufijo: '',
    motivo: 'La espalda de un rack simple da a un pasillo peatonal o zona de trabajo.',
    obligatorio: true, marcas,
  };
}

/**
 * Accesorios propuestos para el diseno. Cada uno:
 * { id, nombre, plural, paraQue, cantidad, unidad: 'u'|'m'|'m²', medida, sufijo, motivo, obligatorio,
 *   provisorio: true, marcas: [{ tipo: 'punto', x, y } | { tipo: 'barra'|'linea', x1, y1, x2, y2 }] }
 * Los racks existentes (existente: true) no se cotizan: no llevan accesorios.
 */
export function proponerAccesorios({ bodega, racks = [], pallets = [] }) {
  return [
    canilleras(bodega, racks),
    proteccionBastidor(bodega, racks),
    barandas(bodega),
    planosCarga(racks, pallets),
    separadores(racks),
    topes(racks, pallets),
    placas(racks),
    mallaAnticaida(bodega, racks),
  ].filter(Boolean).map((a) => ({ ...a, provisorio: true }));
}

/** Lista con lo que el cliente quito o cambio: cada uno con { incluido, cantidad, cantidadPropuesta } */
export function aplicarAjustes(lista, { quitados = [], cantidades = {} } = {}) {
  return lista.map((a) => {
    const c = Number(cantidades[a.id]);
    return {
      ...a,
      incluido: !quitados.includes(a.id),
      cantidadPropuesta: a.cantidadPropuesta ?? a.cantidad,
      cantidad: Number.isFinite(c) && c >= 0 ? c : (a.cantidadPropuesta ?? a.cantidad),
    };
  });
}

/** "28 canilleras · 6 protecciones de bastidor de 2.300 mm · 42 m de baranda…" (solo los incluidos) */
export function textoAccesorios(lista) {
  return lista
    .filter((a) => a.incluido !== false && a.cantidad > 0)
    .map((a) => {
      const base = a.unidad === 'u'
        ? `${numTexto(a.cantidad)} ${a.cantidad === 1 ? a.nombre.toLowerCase() : a.plural}`
        : `${numTexto(a.cantidad)} ${a.unidad} de ${a.plural}`;
      return a.sufijo ? `${base} ${a.sufijo}` : base;
    })
    .join(' · ');
}
