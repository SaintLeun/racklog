// Accesorios y seguridad del planificador (paso 4): el sistema propone lo necesario segun los racks,
// la bodega y los pallets; el cliente acepta, quita o cambia cantidades. Sin Vue ni three.
// Las marcas son para dibujar en el plano 2D (coordenadas de planta, m).
// Medidas y modulos PROVISORIOS hasta que Racklog confirme su catalogo (PROMPT-CLAUDE-CODE.md §7).
import { medidasRack, rectangulo, contorno, rectElemento, rayoMuro } from './planificador.js';
import { SEPARACION_DOBLE, voladizoDe } from './medidas.js';
import { pasillos, carasDeCarga, gruaDe } from './pasillos.js';

export const PARAMETROS_ACCESORIOS = {
  // Proteccion de bastidor: mide lo mismo que la cabecera; en un rack doble es una sola pieza que cubre los dos
  // bastidores y su separador (2 × 1.000 + 300 = 2.300 mm). Regla Racklog, ronda 3 (21-10-2026)
  proteccionBastidor: { confirmado: true },
  // Canillera: pieza SOLO por el frente del pilar (la cara que da al pasillo), no lo envuelve (dueño 22-10-2026),
  // un poco mas ancha que el pilar de 100 mm y apernada al piso. 500 mm de alto por defecto o 1.000 mm (ronda 3)
  canillera: { valor: 0.5, opciones: [0.5, 1.0], ancho: 0.12, espesor: 0.006, separacion: 0.015, confirmado: true },
  // Proteccion de bastidor: arco de tubo anclado al piso con placas base (no un perfil rectangular)
  arcoBastidor: { alto: 0.4, tubo: 0.076, confirmado: false },
  // Baranda: tubo de seccion circular, 1 m de alto, modulos con placas base al piso
  altoBaranda: { valor: 1.0, confirmado: true },
  // Baranda: modulos de 6 m y una pieza de ajuste por lo que sobra en cada tramo (regla Racklog).
  // 18 m → 3 de 6 m; 20 m → 3 de 6 m + 1 ajuste de 2 m. El ajuste se corta al decimetro
  moduloBaranda: { valor: 6.0, confirmado: true },
  ajusteBaranda: { paso: 0.1, confirmado: false },                       // m: el ajuste se redondea hacia arriba a esto
  aberturaBaranda: { valor: 1.2, confirmado: false },                    // m de abertura en puertas y cruces
  separadoresPorMarco: { hasta6m: 2, mas6m: 3, confirmado: false },      // por marco doble segun alto del marco
  toposPorPosicion: { valor: 2, confirmado: false },
  holguraTopes: { valor: 0.3, confirmado: false },                       // m: pallet mas corto que el marco en mas de esto
  mallaDistancia: { valor: 1.0, confirmado: false },                     // m: espalda a menos de esto de un pasillo peatonal
  // m: menos que esto al muro o vecino no es cabecera expuesta. Ademas la grua tiene que poder pasar por ahi:
  // la cabecera necesita delante el pasillo de trabajo del equipo (dueño 27-10: "solo donde circula la grúa")
  cabeceraLibre: { valor: 0.5, confirmado: false },
};

// Pilar de marco: 100 mm (medidas.js)
const PILAR = 0.1;
const LADO = {
  arriba: { dx: 0, dy: -1 }, derecha: { dx: 1, dy: 0 }, abajo: { dx: 0, dy: 1 }, izquierda: { dx: -1, dy: 0 },
};
const FRENTE = { 0: 'arriba', 90: 'derecha', 180: 'abajo', 270: 'izquierda' };
const OPUESTO = { arriba: 'abajo', abajo: 'arriba', derecha: 'izquierda', izquierda: 'derecha' };
// Elementos que tapan una cabecera (los pasillos dibujados son transito: no tapan)
const TAPAN = ['pilar', 'oficina', 'zona', 'zonaCarga'];

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
  if (m.tipo === 'selectivo') return Array.from({ length: m.cuerpos + 1 }, (_, i) => PILAR / 2 + i * m.viga);
  return [];
}

/** Posiciones t de los pilares de un marco: frente y fondo de cada fila */
function pilaresT(r, fondo) {
  const m = medidasRack(r), v = voladizoDe(m);
  if (m.tipo === 'selectivo' && m.doble) {
    return [v + PILAR / 2, v + m.fondo - PILAR / 2, v + m.fondo + SEPARACION_DOBLE + PILAR / 2, fondo - v - PILAR / 2];
  }
  return [v + PILAR / 2, fondo - v - PILAR / 2];
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

/**
 * Cabeceras por donde circula la grua (pasillo o cruce): [{ lado, s }] (s = 0 o largo).
 * Hace falta delante el ancho de pasillo del equipo hasta el muro, otro rack o un pilar/oficina/zona;
 * una cabecera a 1 m del muro o pegada a otro rack no la pasa la grua y no lleva proteccion
 */
export function cabecerasExpuestas(r, racks, bodega) {
  const { largo } = marcoLocal(r);
  const minimo = Math.max(PARAMETROS_ACCESORIOS.cabeceraLibre.valor, gruaDe(bodega).pasillo);
  return cabeceras(r)
    .map((lado, i) => ({ lado, s: i ? largo : 0 }))
    .filter(({ lado }) => libreHacia(r, lado, racks, bodega) >= minimo - 1e-6);
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

const medidaCanillera = (alto) => ({ alto, medida: mmTexto(alto), sufijo: `de ${mmTexto(alto)}` });

function canilleras(bodega, racks) {
  if (!usaGruaOApilador(bodega)) return null;
  const lista = pasillos(racks, bodega);
  const puntos = new Map();
  // n: hacia donde mira la canillera (el pasillo); va delante de la cara del pilar que da a ese lado
  const poner = (q, lado) => {
    const k = `${q.x.toFixed(2)},${q.y.toFixed(2)}`;
    if (!puntos.has(k)) puntos.set(k, { tipo: 'punto', x: r2(q.x), y: r2(q.y), nx: LADO[lado].dx, ny: LADO[lado].dy });
  };
  nuevos(racks).filter((r) => r.tipo === 'RS' || r.tipo === 'DI').forEach((r) => {
    const { fondo, aPlanta } = marcoLocal(r), S = marcosS(r), T = pilaresT(r, fondo);
    const frente = FRENTE[r.rot] ?? 'arriba';
    // Solo caras frontales (dueño 27-10): cada pilar del lado que da a un pasillo. Los laterales del marco de
    // cabecera no llevan: ahi va la proteccion de bastidor
    carasDeCarga(r).forEach((lado) => {
      if (!caraConPasillo(r, lado, lista)) return;
      const t = lado === frente ? T[0] : T[T.length - 1];
      S.forEach((s) => poner(aPlanta(s, t), lado));
    });
    // Cuerpo tunel: la grua entra por debajo, van en los pilares de frente y fondo de sus dos marcos
    const m = medidasRack(r);
    if (m.tunel) {
      [S[m.tunel.indice], S[m.tunel.indice + 1]].forEach((s) => {
        poner(aPlanta(s, T[0]), frente);
        poner(aPlanta(s, T[T.length - 1]), OPUESTO[frente]);
      });
    }
  });
  if (!puntos.size) return null;
  return {
    id: 'canilleras', nombre: 'Canilleras', plural: 'canilleras',
    paraQue: `Pieza de acero roja delante del pilar, por el lado del pasillo (${Math.round(PARAMETROS_ACCESORIOS.canillera.ancho * 1000)} mm de ancho, un poco más que el pilar de ${Math.round(PILAR * 1000)} mm), apernada al piso. Recibe el golpe de la grúa antes que el pilar.`,
    donde: 'En cada pilar que da al pasillo',
    cantidad: puntos.size, unidad: 'u', ancho: PARAMETROS_ACCESORIOS.canillera.ancho, ...medidaCanillera(PARAMETROS_ACCESORIOS.canillera.valor),
    opcionesMedida: PARAMETROS_ACCESORIOS.canillera.opciones,
    motivo: 'Tu grúa circula por los pasillos: van por el frente de cada pilar que da a un pasillo, no en los costados del marco.',
    obligatorio: true, marcas: [...puntos.values()],
  };
}

function proteccionBastidor(bodega, racks) {
  const porMedida = new Map(), marcas = [];
  nuevos(racks).filter((r) => r.tipo === 'RS' || r.tipo === 'DI').forEach((r) => {
    const { fondo, aPlanta } = marcoLocal(r);
    const m = medidasRack(r), v = voladizoDe(m);
    // Tramo [t0, t1] de la cabecera: el bastidor en simple; en doble los dos bastidores y su separador en una
    // sola pieza (2 × fondo + 300 mm); drive-in: el bloque
    const bastidores = m.tipo === 'selectivo'
      ? [[v, v + (m.doble ? 2 * m.fondo + SEPARACION_DOBLE : m.fondo)]]
      : [[0, fondo]];
    cabecerasExpuestas(r, racks, bodega).forEach(({ s }) => {
      // Barra pegada a cada bastidor de la cabecera, por fuera, del mismo ancho que el
      const sb = s ? s + 0.05 : -0.05;
      bastidores.forEach(([t0, t1]) => {
        const medida = r2(t1 - t0);
        porMedida.set(medida, (porMedida.get(medida) ?? 0) + 1);
        const a = aPlanta(sb, t0), b = aPlanta(sb, t1);
        marcas.push({ tipo: 'barra', x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y), medida });
      });
    });
  });
  if (!marcas.length) return null;
  const detalle = [...porMedida.entries()].sort((a, b) => a[0] - b[0]).map(([medida, cantidad]) => ({ medida, cantidad }));
  const medida = detalle.map((d) => (detalle.length > 1 ? `${d.cantidad} de ${mmTexto(d.medida)}` : mmTexto(d.medida))).join(' · ');
  return {
    id: 'proteccionBastidor', nombre: 'Protección de bastidor', plural: 'protecciones de bastidor',
    paraQue: `Arco de tubo de acero anclado al piso con placas base, del ancho de la cabecera. Protege el marco de los golpes de la grúa al doblar.`,
    donde: 'En las cabeceras por donde pasa la grúa',
    cantidad: marcas.length, unidad: 'u', medida, detalle,
    sufijo: detalle.length === 1 ? `de ${mmTexto(detalle[0].medida)}` : `(${medida})`,
    motivo: 'Solo en cabeceras con espacio para que pase la grúa; contra el muro o pegadas a otro rack no van. Un arco por cabecera, del ancho del rack (en doble cubre los dos bastidores y el separador).',
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
  // Cruces marcados a mano sobre el pasillo (un clic en el plano): abren los dos lados
  (e.aberturas ?? []).forEach((pos) => {
    huecos[0].push([pos - ab / 2, pos + ab / 2]); huecos[1].push([pos - ab / 2, pos + ab / 2]);
    aberturas++;
  });
  (bodega.elementos ?? []).forEach((o) => {
    if (o.id === e.id) return;
    // Otro tramo de pasillo peatonal que toca este (esquina de una L o U, o una T): abre el lado que toca
    if (o.clase === 'pasilloPeatonal') {
      const r = rectElemento(o), h = 0.05;
      if (!(r.x0 < q.x0 + q.ancho + h && q.x0 < r.x0 + r.ancho + h && r.y0 < q.y0 + q.alto + h && q.y0 < r.y0 + r.alto + h)) return;
      if ((o.alto >= o.ancho) === vertical) return;   // paralelo y pegado: se sigue de largo
      const a0 = Math.max(0, (vertical ? r.y0 : r.x0) - ini), b0 = Math.min(largo, (vertical ? r.y0 + r.alto : r.x0 + r.ancho) - ini);
      const centro = vertical ? r.x0 + r.ancho / 2 : r.y0 + r.alto / 2;
      // Atraviesa el pasillo (T o cruz): los dos lados; si llega de un lado, solo ese
      const cruza = vertical ? r.x0 < lados[0] - h && r.x0 + r.ancho > lados[1] + h : r.y0 < lados[0] - h && r.y0 + r.alto > lados[1] + h;
      const lista = cruza ? [0, 1] : [Math.abs(centro - lados[0]) <= Math.abs(centro - lados[1]) ? 0 : 1];
      lista.forEach((i) => huecos[i].push([a0, b0]));
      return;
    }
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

/** Piezas de un tramo de baranda: modulos enteros de 6 m y un ajuste por el resto (m) */
export function piezasBaranda(largo) {
  const mod = PARAMETROS_ACCESORIOS.moduloBaranda.valor, paso = PARAMETROS_ACCESORIOS.ajusteBaranda.paso;
  const modulos = Math.floor(largo / mod + 1e-6);
  const resto = largo - modulos * mod;
  const ajuste = resto > 0.05 ? Math.ceil(resto / paso - 1e-6) * paso : 0;
  return { modulos, ajuste: +ajuste.toFixed(2) };
}

// "6 módulos de 6 m + 2 ajustes de 2 m" (los ajustes de igual largo se juntan)
function textoPiezas(modulos, ajustes) {
  const mod = PARAMETROS_ACCESORIOS.moduloBaranda.valor;
  const partes = modulos ? [`${modulos} ${modulos === 1 ? 'módulo' : 'módulos'} de ${numTexto(mod)} m`] : [];
  const porLargo = new Map();
  ajustes.forEach((a) => porLargo.set(a, (porLargo.get(a) ?? 0) + 1));
  [...porLargo].sort((a, b) => b[0] - a[0]).forEach(([l, n]) => partes.push(`${n} ${n === 1 ? 'ajuste' : 'ajustes'} de ${numTexto(l)} m`));
  return partes.join(' + ');
}

function barandas(bodega) {
  const mod = PARAMETROS_ACCESORIOS.moduloBaranda.valor;
  const peatonales = (bodega.elementos ?? []).filter((e) => e.clase === 'pasilloPeatonal');
  if (!peatonales.length) return null;
  let metros = 0, aberturas = 0, modulos = 0;
  const ajustes = [], marcas = [];
  peatonales.forEach((e) => {
    const t = tramosBaranda(e, bodega);
    aberturas += t.aberturas;
    // Cada tramo: modulos de 6 m desde un extremo y el ajuste al final; en el plano, una linea por pieza
    t.tramos.forEach((s) => {
      const largo = s.b - s.a, pz = piezasBaranda(largo);
      metros += largo;
      modulos += pz.modulos;
      if (pz.ajuste) ajustes.push(pz.ajuste);
      const ux = (s.x2 - s.x1) / largo, uy = (s.y2 - s.y1) / largo, junta = 0.06;
      const piezas = [...Array(pz.modulos).fill(mod), ...(pz.ajuste ? [Math.min(pz.ajuste, largo - pz.modulos * mod)] : [])];
      let d = 0;
      piezas.forEach((l, k) => {
        const a = d + (k ? junta / 2 : 0), b = d + l - (k < piezas.length - 1 ? junta / 2 : 0);
        marcas.push({ tipo: 'linea', ajuste: k === pz.modulos, x1: r2(s.x1 + ux * a), y1: r2(s.y1 + uy * a), x2: r2(s.x1 + ux * b), y2: r2(s.y1 + uy * b) });
        d += l;
      });
    });
  });
  if (!metros) return null;
  const piezas = textoPiezas(modulos, ajustes);
  metros = Math.round(metros * 10) / 10;
  const alto = PARAMETROS_ACCESORIOS.altoBaranda.valor;
  return {
    id: 'barandas', nombre: 'Baranda de protección', plural: 'baranda',
    paraQue: `Tubo de acero de sección circular, ${numTexto(alto)} m de alto, en módulos con placas base apernadas al piso. Separa a las personas del tránsito de grúas.`,
    donde: 'A ambos lados del pasillo peatonal',
    // La card muestra el resumen; el desglose de piezas va plegado (detallePiezas)
    cantidad: metros, unidad: 'm', medida: `${numTexto(alto)} m de alto`, resumen: `${numTexto(metros)} m — módulos y ajustes los confirma Técnica Racklog`,
    detallePiezas: piezas, modulos, ajustes, alto, sufijo: `de ${numTexto(alto)} m de alto`,
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
    donde: 'En los niveles con carga que sobresale o sin pallet',
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
    id: 'separadores', nombre: 'Separador de bastidor', plural: 'separadores de bastidor',
    paraQue: `Une los dos bastidores de una fila doble y los mantiene a ${Math.round(SEPARACION_DOBLE * 1000)} mm.`,
    cantidad: n, unidad: 'u', medida: `${S.hasta6m} por marco hasta 6 m, ${S.mas6m} si es más alto`, sufijo: '',
    motivo: 'Tienes racks dobles (espalda con espalda): van siempre, incluidos en tu cotización.',
    // No es opcional: sin separador la fila doble no es estable
    obligatorio: true, fijo: true, marcas: [],
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
      // Sobresale mas de 100 mm por lado, o es mas corto que el marco por mas de la holgura
      const noCalza = (t.fondo - m.fondo) / 2 > 0.1 + 1e-6 || t.fondo < m.fondo - P.holguraTopes.valor - 1e-6;
      if (deLado || noCalza) n += P.toposPorPosicion.valor * m.cuerpos * m.palletsPorViga * filas(r);
    }
  });
  if (!n) return null;
  return {
    id: 'topes', nombre: 'Tope de apoyo', plural: 'topes de apoyo',
    paraQue: 'Travesaños que sostienen el pallet cuando no apoya bien en las vigas.',
    donde: 'En las posiciones donde el pallet no calza con el marco',
    cantidad: n, unidad: 'u', medida: `${P.toposPorPosicion.valor} por posición`, sufijo: '',
    motivo: 'El fondo de algún pallet no calza con el fondo del marco, o va de lado.',
    obligatorio: false, marcas: [],
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
    donde: 'En la espalda de los racks que dan a gente',
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
 * La lista lleva (no enumerable) `contexto` = { bodega, racks }: aplicarAjustes() lo usa para ubicar los
 * accesorios que el cliente puso a mano relativos a su rack (si el rack se mueve, lo siguen)
 */
export function proponerAccesorios({ bodega, racks = [], pallets = [] }) {
  const lista = [
    canilleras(bodega, racks),
    proteccionBastidor(bodega, racks),
    barandas(bodega),
    planosCarga(racks, pallets),
    separadores(racks),
    topes(racks, pallets),
    mallaAnticaida(bodega, racks),
  ].filter(Boolean).map((a) => ({ ...a, provisorio: true }));
  Object.defineProperty(lista, 'contexto', { value: { bodega, racks }, enumerable: false });
  return lista;
}

// ─── Accesorios puestos a mano (arrastrados al 3D en el paso 4) ───
// Se guardan en el proyecto: accesorios.manuales = [{ id, tipo, rackId, modelo, orden, lugar, marca }]
// - lugar: posicion en coordenadas del rack (s a lo largo, t de fondo) para seguirlo si se mueve
// - marca: la marca en planta al momento de ponerlo (respaldo si no hay racks a mano)
export const TIPOS_MANUALES = ['canilleras', 'proteccionBastidor', 'barandas'];
const ORDEN_IDS = ['canilleras', 'proteccionBastidor', 'barandas', 'planosCarga', 'separadores', 'topes', 'mallaAnticaida'];
// Distancia maxima (m) entre donde se suelta y el lugar valido mas cercano para que encaje
const UMBRAL_ENCAJE = { canilleras: 0.9, proteccionBastidor: 1.5, barandas: 1.5 };
// La baranda de cabecera va a esta distancia del rack (m) y un tramo manual en pasillo peatonal mide esto
const BARANDA_CABECERA = 0.6, TRAMO_MANUAL = 2;

/** Accesorio vacio (cuando el sistema no propuso ninguno de ese tipo pero el cliente lo puso a mano) */
function plantilla(id) {
  const P = PARAMETROS_ACCESORIOS;
  if (id === 'canilleras') {
    return {
      id, nombre: 'Canilleras', plural: 'canilleras',
      paraQue: `Pieza de acero roja delante del pilar, por el lado del pasillo, apernada al piso. Recibe el golpe de la grúa antes que el pilar.`,
      donde: 'Donde las pusiste en el 3D',
      cantidad: 0, unidad: 'u', ancho: P.canillera.ancho, ...medidaCanillera(P.canillera.valor), opcionesMedida: P.canillera.opciones,
      motivo: 'Las pusiste en el 3D.', obligatorio: false, marcas: [], provisorio: true,
    };
  }
  if (id === 'proteccionBastidor') {
    return {
      id, nombre: 'Protección de bastidor', plural: 'protecciones de bastidor',
      paraQue: 'Arco de tubo de acero anclado al piso con placas base, del ancho de la cabecera.',
      donde: 'Donde las pusiste en el 3D',
      cantidad: 0, unidad: 'u', medida: '', detalle: [], sufijo: '',
      motivo: 'Las pusiste en el 3D.', obligatorio: false, marcas: [], provisorio: true,
    };
  }
  const alto = P.altoBaranda.valor;
  return {
    id: 'barandas', nombre: 'Baranda de protección', plural: 'baranda',
    paraQue: `Tubo de acero de sección circular, ${numTexto(alto)} m de alto, en módulos con placas base apernadas al piso.`,
    donde: 'Donde la pusiste en el 3D',
    cantidad: 0, unidad: 'm', medida: `${numTexto(alto)} m de alto`, modulos: 0, ajustes: [], alto, sufijo: `de ${numTexto(alto)} m de alto`,
    motivo: 'La pusiste en el 3D.', obligatorio: false, marcas: [], provisorio: true,
  };
}

// Racks nuevos del mismo modelo, en orden (para reencontrar un rack cuyo id cambio: paso 4 estimado → paso 5)
const delModelo = (racks, modelo) => nuevos(racks).filter((r) => (r.modelo ?? null) === (modelo ?? null));

/** Marca en planta de un lugar en coordenadas de rack */
function marcaDeLugar(tipo, r, lugar) {
  const { largo, aPlanta } = marcoLocal(r);
  if (tipo === 'canilleras') {
    const s = lugar.desdeFin ? largo - lugar.s : lugar.s;
    if (s < -0.3 || s > largo + 0.3) return null;
    const q = aPlanta(s, lugar.t), d = aPlanta(s + lugar.ns, lugar.t + lugar.nt);
    const n = Math.hypot(d.x - q.x, d.y - q.y) || 1;
    return { tipo: 'punto', x: r2(q.x), y: r2(q.y), nx: Math.round((d.x - q.x) / n), ny: Math.round((d.y - q.y) / n) };
  }
  const s = lugar.extremo ? largo + lugar.off : -lugar.off;
  const a = aPlanta(s, lugar.t0), b = aPlanta(s, lugar.t1);
  return tipo === 'proteccionBastidor'
    ? { tipo: 'barra', x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y), medida: r2(lugar.t1 - lugar.t0) }
    : { tipo: 'linea', x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y) };
}

/** Marca actual de un accesorio manual (sigue a su rack); null si su rack ya no esta */
export function resolverManual(m, racks = null) {
  if (!m?.rackId || !m.lugar || !racks) return m?.marca ?? null;
  const r = racks.find((x) => x.id === m.rackId && !x.existente) ?? delModelo(racks, m.modelo)[m.orden ?? 0];
  if (!r) return null;
  return marcaDeLugar(m.tipo, r, m.lugar);
}

// Largo de una marca de linea o barra
const largoMarca = (k) => Math.hypot(k.x2 - k.x1, k.y2 - k.y1);

/** Lugares validos donde el cliente puede poner a mano un accesorio de `tipo`: [{ rackId, modelo, orden, lugar, marca }] */
export function lugaresAccesorio(tipo, { bodega, racks = [] }) {
  const out = [];
  const conOrden = (r) => ({ rackId: r.id, modelo: r.modelo ?? null, orden: delModelo(racks, r.modelo ?? null).indexOf(r) });
  nuevos(racks).filter((r) => r.tipo === 'RS' || r.tipo === 'DI').forEach((r) => {
    const { largo, fondo } = marcoLocal(r);
    const base = conOrden(r);
    const poner = (lugar) => { const marca = marcaDeLugar(tipo, r, lugar); if (marca) out.push({ ...base, lugar, marca }); };
    if (tipo === 'canilleras') {
      // Pie de cada pilar de las caras frontales (las de carga, que dan al pasillo); nunca en los costados del marco
      const S = marcosS(r), T = pilaresT(r, fondo), vistos = new Set();
      const frente = FRENTE[r.rot] ?? 'arriba', caras = carasDeCarga(r);
      const lugar = (s, t, ns, nt) => {
        const k = `${s.toFixed(3)},${t.toFixed(3)}`;
        if (vistos.has(k)) return;
        vistos.add(k);
        const desdeFin = s > largo / 2;
        poner({ s: desdeFin ? r2(largo - s) : r2(s), desdeFin, t: r2(t), ns, nt });
      };
      S.forEach((s) => {
        if (caras.includes(frente)) lugar(s, T[0], 0, -1);
        if (caras.includes(OPUESTO[frente])) lugar(s, T[T.length - 1], 0, 1);
      });
    } else if (tipo === 'proteccionBastidor') {
      const m = medidasRack(r), v = voladizoDe(m);
      const tramo = m.tipo === 'selectivo' ? [v, v + (m.doble ? 2 * m.fondo + SEPARACION_DOBLE : m.fondo)] : [0, fondo];
      [0, 1].forEach((extremo) => poner({ extremo, t0: r2(tramo[0]), t1: r2(tramo[1]), off: 0.05 }));
    } else if (tipo === 'barandas') {
      // Delante de cada cabecera, a lo ancho del rack
      [0, 1].forEach((extremo) => poner({ extremo, t0: 0, t1: r2(fondo), off: BARANDA_CABECERA }));
    }
  });
  return out;
}

// Una marca ya ocupada por otra del mismo tipo (automatica o manual)
function ocupada(marca, otras) {
  if (marca.tipo === 'punto') return otras.some((k) => k.tipo === 'punto' && Math.hypot(k.x - marca.x, k.y - marca.y) < 0.05);
  const c = { x: (marca.x1 + marca.x2) / 2, y: (marca.y1 + marca.y2) / 2 };
  return otras.some((k) => {
    if (k.tipo === 'punto') return false;
    // Misma recta (dentro de 10 cm) y se solapan
    const dx = marca.x2 - marca.x1, dy = marca.y2 - marca.y1, L = Math.hypot(dx, dy) || 1;
    const dist = (p) => Math.abs((p.x - marca.x1) * dy - (p.y - marca.y1) * dx) / L;
    if (dist({ x: k.x1, y: k.y1 }) > 0.1 || dist({ x: k.x2, y: k.y2 }) > 0.1) return false;
    const proy = (p) => ((p.x - marca.x1) * dx + (p.y - marca.y1) * dy) / L;
    const a = Math.min(proy({ x: k.x1, y: k.y1 }), proy({ x: k.x2, y: k.y2 })), b = Math.max(proy({ x: k.x1, y: k.y1 }), proy({ x: k.x2, y: k.y2 }));
    return Math.min(b, L) - Math.max(a, 0) > 0.1 || Math.hypot(c.x - (k.x1 + k.x2) / 2, c.y - (k.y1 + k.y2) / 2) < 0.1;
  });
}

const distMarca = (marca, p) => {
  if (marca.tipo === 'punto') return Math.hypot(marca.x - p.x, marca.y - p.y);
  const dx = marca.x2 - marca.x1, dy = marca.y2 - marca.y1, L2 = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((p.x - marca.x1) * dx + (p.y - marca.y1) * dy) / L2));
  return Math.hypot(marca.x1 + u * dx - p.x, marca.y1 + u * dy - p.y);
};

/**
 * Donde encaja un accesorio de `tipo` soltado en el punto `p` (planta, m): el lugar valido libre mas cercano.
 * Devuelve { ok, distancia, marca, manual } (manual sin id, listo para guardar) o { ok: false, marca: null }
 */
export function encajarAccesorio(tipo, p, { bodega, racks = [], pallets = [] }, ajustes = {}) {
  if (!TIPOS_MANUALES.includes(tipo) || !p) return { ok: false, marca: null, distancia: Infinity };
  const lista = aplicarAjustes(proponerAccesorios({ bodega, racks, pallets }), ajustes);
  const actual = lista.find((a) => a.id === tipo);
  const otras = actual && actual.incluido ? actual.marcas : (actual?.marcas ?? []).filter((k) => k.manual);
  const candidatos = lugaresAccesorio(tipo, { bodega, racks });
  // Baranda: tambien un tramo en el borde de un pasillo peatonal, centrado donde se solto
  if (tipo === 'barandas') {
    (bodega.elementos ?? []).filter((e) => e.clase === 'pasilloPeatonal').forEach((e) => {
      tramosBaranda(e, bodega).tramos.forEach((t) => {
        const L = Math.hypot(t.x2 - t.x1, t.y2 - t.y1);
        if (L < 0.3) return;
        const ux = (t.x2 - t.x1) / L, uy = (t.y2 - t.y1) / L, largo = Math.min(TRAMO_MANUAL, L);
        const u = Math.max(largo / 2, Math.min(L - largo / 2, (p.x - t.x1) * ux + (p.y - t.y1) * uy));
        const a = u - largo / 2, b = u + largo / 2;
        const marca = { tipo: 'linea', x1: r2(t.x1 + ux * a), y1: r2(t.y1 + uy * a), x2: r2(t.x1 + ux * b), y2: r2(t.y1 + uy * b) };
        candidatos.push({ rackId: null, modelo: null, orden: null, lugar: null, marca });
      });
    });
  }
  let mejor = null, dMejor = Infinity, tomado = null, dTomado = Infinity;
  candidatos.forEach((c) => {
    const d = distMarca(c.marca, p);
    if (ocupada(c.marca, otras)) {
      if (d < dTomado) { tomado = c; dTomado = d; }
      return;
    }
    if (d < dMejor) { mejor = c; dMejor = d; }
  });
  const umbral = UMBRAL_ENCAJE[tipo];
  // El lugar mas cercano ya tiene uno (y no hay otro libre a mano): rojo ahi mismo, con el motivo
  if (tomado && dTomado <= umbral && !(dMejor <= umbral)) return { ok: false, motivo: 'ocupado', distancia: r2(dTomado), marca: tomado.marca };
  if (!mejor) return { ok: false, motivo: 'lejos', marca: null, distancia: Infinity };
  const ok = dMejor <= umbral;
  return { ok, motivo: ok ? null : 'lejos', distancia: r2(dMejor), marca: mejor.marca, manual: { tipo, rackId: mejor.rackId, modelo: mejor.modelo, orden: mejor.orden, lugar: mejor.lugar, marca: mejor.marca } };
}

/** El manual mas cercano a `p` (planta, m) a menos de `radio`, con su marca actual: { manual, marca } o null */
export function manualCerca(p, manuales = [], racks = null, radio = 0.6) {
  let mejor = null, dMejor = radio;
  manuales.forEach((m) => {
    const marca = resolverManual(m, racks);
    if (!marca) return;
    const d = distMarca(marca, p);
    if (d <= dMejor) { mejor = { manual: m, marca }; dMejor = d; }
  });
  return mejor;
}

/**
 * Lista con lo que el cliente quito o cambio: cada uno con { incluido, cantidad, cantidadPropuesta, manuales }.
 * Los accesorios puestos a mano (manuales) suman su marca (manual: true) y su cantidad (1 u o los m de baranda)
 * a lo propuesto o a la cantidad escrita a mano; si el sistema no propuso ese tipo, se agrega
 */
export function aplicarAjustes(lista, { quitados = [], cantidades = {}, medidas = {}, manuales = [] } = {}) {
  const racks = lista.contexto?.racks ?? null;
  const extra = {};
  (Array.isArray(manuales) ? manuales : []).forEach((m) => {
    if (!TIPOS_MANUALES.includes(m?.tipo)) return;
    const marca = resolverManual(m, racks);
    if (!marca) return;
    (extra[m.tipo] ??= []).push({ ...marca, manual: true, manualId: m.id });
  });
  const base = [...lista];
  Object.keys(extra).forEach((id) => { if (!base.some((a) => a.id === id)) base.push(plantilla(id)); });
  base.sort((a, b) => ORDEN_IDS.indexOf(a.id) - ORDEN_IDS.indexOf(b.id));
  return base.map((a) => {
    const c = Number(cantidades[a.id]);
    // Medida elegida entre las que ofrece (canillera 500 / 1.000 mm)
    const elegida = Number(medidas?.[a.id]);
    const medida = a.opcionesMedida?.includes(elegida) && a.id === 'canilleras' ? medidaCanillera(elegida) : {};
    const mias = extra[a.id] ?? [];
    const sumaManual = a.unidad === 'm' ? Math.round(mias.reduce((t, k) => t + largoMarca(k), 0) * 10) / 10 : mias.length;
    const propuesta = a.cantidadPropuesta ?? a.cantidad;
    const out = {
      ...a,
      ...medida,
      incluido: a.fijo || !quitados.includes(a.id),
      cantidadPropuesta: propuesta,
      cantidad: (Number.isFinite(c) && c >= 0 ? c : propuesta) + sumaManual,
      manuales: sumaManual,
    };
    if (mias.length) {
      out.marcas = [...(a.marcas ?? []), ...mias];
      if (a.id === 'proteccionBastidor') {
        // Detalle por medida al dia con los manuales
        const porMedida = new Map((a.detalle ?? []).map((d) => [d.medida, d.cantidad]));
        mias.forEach((k) => { const md = r2(largoMarca(k)); porMedida.set(md, (porMedida.get(md) ?? 0) + 1); });
        out.detalle = [...porMedida.entries()].sort((x, y) => x[0] - y[0]).map(([medida, cantidad]) => ({ medida, cantidad }));
        out.medida = out.detalle.map((d) => (out.detalle.length > 1 ? `${d.cantidad} de ${mmTexto(d.medida)}` : mmTexto(d.medida))).join(' · ');
        out.sufijo = out.detalle.length === 1 ? `de ${mmTexto(out.detalle[0].medida)}` : `(${out.medida})`;
      }
      if (a.id === 'barandas') {
        const pz = mias.map((k) => piezasBaranda(largoMarca(k)));
        out.modulos = (a.modulos ?? 0) + pz.reduce((t, x) => t + x.modulos, 0);
        out.ajustes = [...(a.ajustes ?? []), ...pz.map((x) => x.ajuste).filter(Boolean)];
        out.detallePiezas = textoPiezas(out.modulos, out.ajustes);
        out.resumen = `${numTexto(out.cantidad)} m — módulos y ajustes los confirma Técnica Racklog`;
      }
    }
    return out;
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

// Accesorios de seguridad (la pregunta del paso 6): con "No" se quitan todos. Separadores, planos de carga y
// topes no entran: van con el rack para que la carga apoye bien
export const ACCESORIOS_SEGURIDAD = ['canilleras', 'proteccionBastidor', 'barandas', 'mallaAnticaida'];
