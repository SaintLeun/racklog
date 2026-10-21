// Modelo del planificador publico: bodega (rectangular o con forma libre) y racks en planta.
// Sin Vue ni three. Sin pasillos reglamentarios ni calculo estructural: esos valores los debe
// confirmar Tecnica Racklog (ver PLAN-PLANIFICADOR.md, enrutamiento).
import { medidasSelectivo, medidasAnra, medidasDriveIn, huella, capacidad } from './medidas.js';

// Medidas de la grúa que entra a la calle del drive-in (m). Holgura sobre lo más alto de la grúa: provisoria
export const HOLGURA_GRUA_DI = 0.15;
export function primerNivelGrua(r) {
  const alto = Math.max(Number(r.techoGrua) || 0, Number(r.mastilGrua) || 0);
  return { primerNivel: alto ? alto + HOLGURA_GRUA_DI : 0, anchoGrua: Number(r.anchoGrua) || 0 };
}

export const PASO = 0.1;          // los racks se mueven de a 10 cm
export const PASO_MURO = 0.5;     // los vertices de la bodega caen en una grilla de 50 cm

// Por tipo: nombre, campos que se ajustan (con su rango) y valores al agregarlo
export const TIPOS = {
  RS: {
    nombre: 'Rack selectivo', uso: 'Para pallets', imagen: '/assets/images/gallery-rack-selectivo-1.webp',
    campos: { cuerpos: ['Cuerpos', 1, 20], niveles: ['Niveles', 1, 8] }, doble: true,
    inicial: { cuerpos: 4, niveles: 3, doble: false },
    asesoria: {
      sirve: 'Acceso directo a cada pallet; muchos productos distintos.',
      conviene: 'Tienes muchos SKU y necesitas sacar cualquier pallet en cualquier momento.',
      noConviene: 'Te falta espacio y tus productos se repiten mucho.',
      impacto: 'Ordena y acelera el picking; necesita más pasillos.',
      datos: 'Medida y peso del pallet, altura libre y tipo de grúa.',
    },
  },
  DI: {
    nombre: 'Drive-in', uso: 'Pallets en profundidad', imagen: '/assets/images/gallery-drive-in-1.webp',
    campos: { cuerpos: ['Calles', 1, 20], fondos: ['Pallets de fondo', 2, 12], niveles: ['Niveles', 1, 5] }, doble: false,
    inicial: { cuerpos: 4, fondos: 5, niveles: 3, doble: false },
    asesoria: {
      sirve: 'Guardar mucho de pocos productos en poco espacio.',
      conviene: 'Tienes pocos SKU con muchos pallets de cada uno y puedes trabajar en bloque.',
      noConviene: 'Necesitas sacar un pallet específico sin mover otros.',
      impacto: 'Más posiciones por m²; menos selectividad.',
      datos: 'Lo mismo que el selectivo, más cuántos pallets hay por producto y si entra y sale por un lado o por dos.',
    },
  },
  AR: {
    nombre: 'Ángulo ranurado', uso: 'Para cajas y bultos', imagen: '/assets/images/gallery-angulo-ranurado-1.webp',
    campos: { cuerpos: ['Cuerpos', 1, 20], niveles: ['Niveles', 2, 10] }, doble: true,
    inicial: { cuerpos: 3, niveles: 5, doble: false },
    asesoria: {
      sirve: 'Cajas, repuestos y bultos que se toman a mano.',
      conviene: 'Tus productos no van en pallet o pesan poco por unidad.',
      noConviene: 'Mueves pallets con grúa.',
      impacto: 'Aprovecha la altura a mano; se puede agregar un altillo.',
      datos: 'Medida de las cajas, kg por bandeja y altura útil.',
    },
  },
};
// Perfil de quien disena: cambia lo que se destaca y llega al vendedor con el lead
export const PERFILES = [
  {
    v: 'bodega', t: 'Jefe de bodega u operaciones', d: 'Quiero ver si caben los racks y cómo opera la grúa.',
    entregable: 'Descarga tu plano con medidas para mostrárselo a tu jefe.',
    icono: 'M3 21V9l9-6 9 6v12M7 21v-7h10v7M7 17h10',
  },
  {
    v: 'compras', t: 'Compras o administración', d: 'Necesito especificaciones para comparar cotizaciones.',
    entregable: 'Descarga el plano y la tabla de racks para comparar cotizaciones.',
    icono: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    v: 'supply', t: 'Gerencia, logística o supply chain', d: 'Busco capacidad, indicadores y retorno.',
    entregable: 'Descarga el resumen con indicadores para presentarlo a tu comité.',
    icono: 'M4 19h16M7 16V9m5 7V5m5 11v-4',
  },
];

export const NOMBRE = Object.fromEntries(Object.entries(TIPOS).map(([k, t]) => [k, t.nombre]));
export const LIMITES = { bodega: { min: 4, max: 200 } };

// Medidas fijas del planificador: pallet 1000×1200×1200 y bandeja de 400 mm galvanizada
const PALLET = { frentePallet: '1000mm', fondoPallet: '1200mm', altoPallet: '1200mm', palletsPerBeam: 2 };

export function medidasRack(r) {
  const tipo = r.doble ? 'doble' : 'simple';
  if (r.tipo === 'DI') return medidasDriveIn({ calles: r.cuerpos, fondos: r.fondos, niveles: r.niveles, ...primerNivelGrua(r) });
  if (r.tipo === 'AR') return medidasAnra({ tipo, cuerpos: r.cuerpos, niveles: r.niveles, bandeja: '400mm', pintado: 'galvanizado' });
  return medidasSelectivo({ tipo, cuerpos: r.cuerpos, niveles: r.niveles, ...PALLET, palletsPerBeam: r.porViga ?? 2, altos: r.altos, colores: r.colores, tunel: r.tunel, sobrante: r.sobrante, planos: r.planos });
}

/** Rack con sus campos dentro de rango */
export function normalizar(r) {
  const t = TIPOS[r.tipo];
  const out = { ...t.inicial, ...r, doble: t.doble ? !!r.doble : false, rot: ROTACIONES.includes(r.rot) ? r.rot : 0 };
  Object.entries(t.campos).forEach(([k, [, min, max]]) => { out[k] = Math.min(max, Math.max(min, Math.round(Number(out[k]) || min))); });
  return out;
}

// Giro en planta: 0, 90, 180 o 270 grados (el frente —entrada, pasillo— mira arriba, a la derecha, abajo o a la izquierda)
export const ROTACIONES = [0, 90, 180, 270];
export const deLado = (r) => r.rot === 90 || r.rot === 270;

/** Rectangulo que ocupa en planta (centro x,y; de lado intercambia largo y fondo) */
export function rectangulo(r) {
  const h = huella(medidasRack(r));
  const ancho = deLado(r) ? h.fondo : h.largo;
  const alto = deLado(r) ? h.largo : h.fondo;
  return { x0: r.x - ancho / 2, y0: r.y - alto / 2, ancho, alto };
}

// ─── Bodega: poligono en metros (sentido cualquiera). Rectangular = sus 4 esquinas ───
export function contorno(bodega) {
  if (Array.isArray(bodega.forma) && bodega.forma.length >= 3) return bodega.forma;
  return [{ x: 0, y: 0 }, { x: bodega.ancho, y: 0 }, { x: bodega.ancho, y: bodega.largo }, { x: 0, y: bodega.largo }];
}

export function caja(puntos) {
  const xs = puntos.map((p) => p.x), ys = puntos.map((p) => p.y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

export function area(puntos) {
  let a = 0;
  puntos.forEach((p, i) => { const q = puntos[(i + 1) % puntos.length]; a += p.x * q.y - q.x * p.y; });
  return Math.abs(a) / 2;
}

export function puntoDentro(p, poly) {
  let dentro = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) dentro = !dentro;
  }
  return dentro;
}

// ¿El segmento a-b pasa por el interior del rectangulo? (Liang-Barsky)
function cruzaRect(a, b, r) {
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  const lados = [[-dx, a.x - r.x0], [dx, r.x1 - a.x], [-dy, a.y - r.y0], [dy, r.y1 - a.y]];
  for (const [p, q] of lados) {
    if (Math.abs(p) < 1e-12) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t1 - t0 > 1e-9;
}

/** El rack queda completo dentro de la bodega (tambien en bodegas con entrantes) */
export function rackDentro(r, bodega) {
  const p = rectangulo(r), e = 0.005;
  const rect = { x0: p.x0 + e, y0: p.y0 + e, x1: p.x0 + p.ancho - e, y1: p.y0 + p.alto - e };
  const poly = contorno(bodega);
  const esquinas = [{ x: rect.x0, y: rect.y0 }, { x: rect.x1, y: rect.y0 }, { x: rect.x1, y: rect.y1 }, { x: rect.x0, y: rect.y1 }];
  if (!esquinas.every((q) => puntoDentro(q, poly))) return false;
  return poly.every((a, i) => !cruzaRect(a, poly[(i + 1) % poly.length], rect));
}

const redondear = (v) => Math.round(v / PASO) * PASO;

/** Ajusta el rack a la grilla de 10 cm y lo deja dentro del contorno de la bodega (su caja) */
export function dentroDeBodega(r, bodega) {
  const { ancho, alto } = rectangulo(r);
  const c = caja(contorno(bodega));
  const x = Math.min(Math.max(redondear(r.x), c.x0 + ancho / 2), Math.max(c.x0 + ancho / 2, c.x1 - ancho / 2));
  const y = Math.min(Math.max(redondear(r.y), c.y0 + alto / 2), Math.max(c.y0 + alto / 2, c.y1 - alto / 2));
  return { ...r, x: +x.toFixed(2), y: +y.toFixed(2) };
}

function seTocan(a, b, holgura = 0) {
  const p = rectangulo(a), q = rectangulo(b), e = 0.001 - holgura;
  return p.x0 < q.x0 + q.ancho - e && q.x0 < p.x0 + p.ancho - e && p.y0 < q.y0 + q.alto - e && q.y0 < p.y0 + p.alto - e;
}

// ─── Elementos de la bodega: pilares, portones, andenes, oficinas y zonas bloqueadas ───
// Rectangulos en planta (centro x, y; ancho × alto en metros). Un rack encima de uno queda en rojo.
export const ELEMENTOS = {
  pilar: { nombre: 'Pilar', plural: 'pilares', ancho: 0.4, alto: 0.4, color: '#64748b', relleno: '#cbd5e1' },
  porton: { nombre: 'Portón', plural: 'portones', ancho: 4, alto: 0.6, color: '#ca8a04', relleno: '#fef08a' },
  anden: { nombre: 'Andén', plural: 'andenes', ancho: 3.5, alto: 4, color: '#0284c7', relleno: '#e0f2fe' },
  oficina: { nombre: 'Oficina', plural: 'oficinas', ancho: 5, alto: 4, color: '#7c3aed', relleno: '#ede9fe' },
  zona: { nombre: 'Zona bloqueada', plural: 'zonas bloqueadas', ancho: 4, alto: 3, color: '#dc2626', relleno: '#fee2e2' },
  // Circulación: un rack encima es conflicto
  pasilloGrua: { nombre: 'Pasillo de grúa', plural: 'pasillos de grúa', ancho: 3.5, alto: 10, color: '#d97706', relleno: '#fef3c7' },
  pasilloPeatonal: { nombre: 'Pasillo peatonal', plural: 'pasillos peatonales', ancho: 1.2, alto: 10, color: '#16a34a', relleno: '#dcfce7' },
  // Equipos: se dibujan y se cuentan, no bloquean (se mueven). modelo: clave de GRUAS
  grua: { nombre: 'Grúa', plural: 'grúas', ancho: 1.2, alto: 2.8, color: '#a16207', relleno: '#fde68a', bloquea: false },
};
export const bloquea = (e) => ELEMENTOS[e.clase]?.bloquea !== false;

export function rectElemento(e) {
  return { x0: e.x - e.ancho / 2, y0: e.y - e.alto / 2, ancho: e.ancho, alto: e.alto };
}

function solapan(p, q) {
  const e = 0.001;
  return p.x0 < q.x0 + q.ancho - e && q.x0 < p.x0 + p.ancho - e && p.y0 < q.y0 + q.alto - e && q.y0 < p.y0 + p.alto - e;
}

/** Grilla de pilares cada `paso` m dentro del contorno (a 1 m de los muros como minimo) */
export function grillaPilares(bodega, paso) {
  const poly = contorno(bodega), c = caja(poly), out = [];
  for (let y = c.y0 + paso; y < c.y1 - 0.9; y += paso) {
    for (let x = c.x0 + paso; x < c.x1 - 0.9; x += paso) {
      if (puntoDentro({ x, y }, poly)) out.push({ x: +x.toFixed(2), y: +y.toFixed(2) });
    }
  }
  return out;
}

/** Ids de los racks que se superponen con otro, con un elemento o se salen de la bodega */
export function conflictos(racks, bodega) {
  const malos = new Set();
  const elementos = (bodega.elementos ?? []).filter(bloquea).map(rectElemento);
  racks.forEach((a, i) => {
    if (!rackDentro(a, bodega)) malos.add(a.id);
    const pa = rectangulo(a);
    if (elementos.some((q) => solapan(pa, q))) malos.add(a.id);
    racks.slice(i + 1).forEach((b) => { if (seTocan(a, b)) { malos.add(a.id); malos.add(b.id); } });
  });
  return malos;
}

/** Primer lugar libre (de izquierda a derecha, de arriba abajo) dejando 1 m de pasillo */
export function lugarLibre(nuevo, racks, bodega) {
  const c = caja(contorno(bodega));
  const { ancho, alto } = rectangulo({ ...nuevo, x: 0, y: 0 });
  for (let y = c.y0 + alto / 2 + 1; y + alto / 2 <= c.y1; y += 0.5) {
    for (let x = c.x0 + ancho / 2 + 1; x + ancho / 2 <= c.x1; x += 0.5) {
      const r = { ...nuevo, x, y };
      const pr = rectangulo(r);
    const libreDeElementos = (bodega.elementos ?? []).filter(bloquea).every((q) => !solapan(pr, rectElemento(q)));
    if (rackDentro(r, bodega) && libreDeElementos && racks.every((o) => !seTocan(r, o, 1))) return dentroDeBodega(r, bodega);
    }
  }
  return dentroDeBodega({ ...nuevo, x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2 }, bodega);
}

export function describir(r) {
  const t = TIPOS[r.tipo];
  const partes = [t.nombre + (t.doble ? (r.doble ? ' doble' : ' simple') : '')];
  Object.entries(t.campos).forEach(([k, [etiqueta]]) => partes.push(`${r[k]} ${etiqueta.toLowerCase()}`));
  return partes.join(' · ');
}

export function totales(racks) {
  return racks.reduce((t, r) => {
    const c = capacidad(medidasRack(r));
    t.pallets += c.pallets;
    t.bandejas += c.bandejas;
    return t;
  }, { pallets: 0, bandejas: 0 });
}

const metros = (v) => (+v.toFixed(1)).toLocaleString('es-CL');

/** Resumen para el formulario de cotizacion (lo recibe el vendedor) */
export function resumenCotizacion(bodega, racks) {
  const t = totales(racks);
  const poly = contorno(bodega), c = caja(poly);
  const config = {
    'Origen': 'Planificador web',
    'Bodega': bodega.forma
      ? `Forma libre de ${poly.length} lados, ${metros(c.x1 - c.x0)} × ${metros(c.y1 - c.y0)} m (${Math.round(area(poly))} m²)`
      : `${metros(bodega.ancho)} × ${metros(bodega.largo)} m (${Math.round(area(poly))} m²)`,
    'Racks dibujados': racks.length,
  };
  if (t.pallets) config['Posiciones de pallet'] = t.pallets;
  const cuenta = {};
  (bodega.elementos ?? []).forEach((e) => { cuenta[e.clase] = (cuenta[e.clase] ?? 0) + 1; });
  const elementos = Object.entries(cuenta).map(([cl, n]) => `${n} ${n > 1 ? ELEMENTOS[cl].plural : ELEMENTOS[cl].nombre.toLowerCase()}`);
  if (elementos.length) config['Elementos de la bodega'] = elementos.join(', ');
  if (t.bandejas) config['Niveles de bandeja'] = t.bandejas;
  // Racks iguales agrupados: la API acepta hasta 30 campos (los otros 15: resumen, elementos, altura, operacion, perfil, evaluacion, solicitud, comuna, fecha, puntaje y materiales)
  const grupos = new Map();
  racks.forEach((r) => grupos.set(describir(r), (grupos.get(describir(r)) || 0) + 1));
  [...grupos.entries()].slice(0, 15).forEach(([texto, n], i) => { config[`Tipo ${i + 1}`] = `${n} × ${texto}`; });
  return config;
}

// ─── Altura e indicadores ───

/** Alto total del rack (m), para compararlo con la altura libre de la bodega */
export function altoRack(r) {
  const m = medidasRack(r);
  return m.altoConCarga ?? m.alto;
}

/** Racks mas altos que la altura libre declarada (si no hay altura, ninguno) */
export function racksAltos(racks, alturaLibre) {
  if (!(alturaLibre > 0)) return new Set();
  return new Set(racks.filter((r) => altoRack(r) > alturaLibre + 1e-6).map((r) => r.id));
}

/** % de piso ocupado por racks, posiciones por m² y % de la altura libre usada */
export function indicadores(bodega, racks) {
  const m2 = area(contorno(bodega));
  const piso = racks.reduce((t, r) => { const p = rectangulo(r); return t + p.ancho * p.alto; }, 0);
  const t = totales(racks);
  const alto = racks.length ? Math.max(...racks.map(altoRack)) : 0;
  return {
    m2,
    ocupacion: m2 ? piso / m2 : 0,
    posicionesM2: m2 ? t.pallets / m2 : 0,
    usoAltura: bodega.altura > 0 && alto ? alto / bodega.altura : null,
    altoMax: alto,
  };
}

// ─── Cotas en planta ───

// Distancia desde (x, y) en la direccion (dx, dy) hasta el primer muro del contorno
export function rayoMuro(x, y, dx, dy, poly) {
  let mejor = Infinity;
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const ex = b.x - a.x, ey = b.y - a.y;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) return;
    const t = ((a.x - x) * ey - (a.y - y) * ex) / den;
    const u = ((a.x - x) * dy - (a.y - y) * dx) / den;
    if (t > 1e-6 && u >= -1e-9 && u <= 1 + 1e-9) mejor = Math.min(mejor, t);
  });
  return mejor;
}

/**
 * Cotas de un rack hacia los 4 lados: distancia al muro o al rack vecino mas cercano (pasillo).
 * Cada cota: { x1, y1, x2, y2, valor, a: 'muro' | 'rack' }
 */
export function cotasRack(r, racks, bodega) {
  const p = rectangulo(r), poly = contorno(bodega);
  const cx = p.x0 + p.ancho / 2, cy = p.y0 + p.alto / 2;
  const lados = [
    { x: p.x0, y: cy, dx: -1, dy: 0 }, { x: p.x0 + p.ancho, y: cy, dx: 1, dy: 0 },
    { x: cx, y: p.y0, dx: 0, dy: -1 }, { x: cx, y: p.y0 + p.alto, dx: 0, dy: 1 },
  ];
  return lados.map(({ x, y, dx, dy }) => {
    let d = rayoMuro(x, y, dx, dy, poly), a = 'muro';
    racks.forEach((o) => {
      if (o.id === r.id) return;
      const q = rectangulo(o);
      // El vecino debe cruzar la linea de la cota
      if (dx && (y < q.y0 || y > q.y0 + q.alto)) return;
      if (dy && (x < q.x0 || x > q.x0 + q.ancho)) return;
      const gap = dx > 0 ? q.x0 - x : dx < 0 ? x - (q.x0 + q.ancho) : dy > 0 ? q.y0 - y : y - (q.y0 + q.alto);
      if (gap > -1e-6 && gap < d) { d = Math.max(0, gap); a = 'rack'; }
    });
    if (!Number.isFinite(d) || d < 0.3) return null;   // pegado al muro o al vecino: sin cota (no se lee)
    return { x1: x, y1: y, x2: x + dx * d, y2: y + dy * d, valor: d, a };
  }).filter(Boolean);
}

/**
 * Cotas de un elemento (pilar, andén, oficina…): a los muros o al elemento vecino más cercano.
 * a: 'muro' | 'elemento'. Entre dos pilares la cota es la luz libre entre caras.
 */
export function cotasElemento(e, bodega) {
  const p = rectElemento(e), poly = contorno(bodega);
  const cx = p.x0 + p.ancho / 2, cy = p.y0 + p.alto / 2;
  const otros = (bodega.elementos ?? []).filter((o) => o.id !== e.id && o.clase !== 'grua');
  const lados = [
    { x: p.x0, y: cy, dx: -1, dy: 0 }, { x: p.x0 + p.ancho, y: cy, dx: 1, dy: 0 },
    { x: cx, y: p.y0, dx: 0, dy: -1 }, { x: cx, y: p.y0 + p.alto, dx: 0, dy: 1 },
  ];
  return lados.map(({ x, y, dx, dy }) => {
    let d = rayoMuro(x, y, dx, dy, poly), a = 'muro';
    otros.forEach((o) => {
      const q = rectElemento(o);
      if (dx && (y < q.y0 || y > q.y0 + q.alto)) return;
      if (dy && (x < q.x0 || x > q.x0 + q.ancho)) return;
      const gap = dx > 0 ? q.x0 - x : dx < 0 ? x - (q.x0 + q.ancho) : dy > 0 ? q.y0 - y : y - (q.y0 + q.alto);
      if (gap > -1e-6 && gap < d) { d = Math.max(0, gap); a = 'elemento'; }
    });
    if (!Number.isFinite(d) || d < 0.05) return null;
    return { x1: x, y1: y, x2: x + dx * d, y2: y + dy * d, valor: d, a };
  }).filter(Boolean);
}

/** Grilla de pilares con distancia entre ejes en X e Y, y primer eje a `offX`/`offY` del muro */
export function grillaPilaresXY(bodega, { pasoX, pasoY, offX, offY }) {
  const poly = contorno(bodega), c = caja(poly), out = [];
  for (let y = c.y0 + (offY ?? pasoY); y <= c.y1 - 0.3; y += pasoY) {
    for (let x = c.x0 + (offX ?? pasoX); x <= c.x1 - 0.3; x += pasoX) {
      if (puntoDentro({ x, y }, poly)) out.push({ x: +x.toFixed(2), y: +y.toFixed(2) });
    }
  }
  return out;
}

export const formatoM = (v) => (+v.toFixed(2)).toLocaleString('es-CL');
