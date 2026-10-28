// Modelo del planificador publico: bodega (rectangular o con forma libre) y racks en planta.
// Sin Vue ni three. Sin pasillos reglamentarios ni calculo estructural: esos valores los debe
// confirmar Tecnica Racklog (ver PLAN-PLANIFICADOR.md, enrutamiento).
import { medidasSelectivo, medidasAnra, medidasDriveIn, huella, capacidad, ANRA_ANGULO_DEFECTO } from './medidas.js';
import { GRUA_DRIVE_IN, DISTANCIAS } from './parametrosTecnicos.js';

// Grúa que entra a la calle del drive-in (m): la medida por el cliente o, si no la midió, la típica de su
// equipo (r.grua; sin equipo, contrapeso). El primer carril queda sobre lo más alto de la grúa + la holgura:
// techo protector y mástil bajado pasan bajo el nivel 1 sin tocar carriles ni pallets cargados
export const HOLGURA_GRUA_DI = GRUA_DRIVE_IN.holgura.valor;
export function gruaDriveIn(r) {
  const tipica = GRUA_DRIVE_IN.equipos[r.grua] ?? GRUA_DRIVE_IN.equipos.contrapeso;
  const medida = Number(r.techoGrua) > 0 || Number(r.mastilGrua) > 0;
  const techo = medida ? Number(r.techoGrua) || 0 : tipica.techo || 0;
  const mastil = medida ? Number(r.mastilGrua) || 0 : tipica.mastil || 0;
  const ancho = Number(r.anchoGrua) > 0 ? Number(r.anchoGrua) : tipica.ancho || 0;
  return { techo, mastil, ancho, medida, tipica: !medida, puede: tipica.driveIn !== false, motivo: tipica.motivo ?? null };
}
export function primerNivelGrua(r) {
  const g = gruaDriveIn(r);
  const alto = Math.max(g.techo, g.mastil);
  return { primerNivel: alto ? alto + HOLGURA_GRUA_DI : 0, anchoGrua: g.ancho };
}

export const PASO = 0.1;          // los racks se mueven de a 10 cm
export const PASO_MURO = 0.5;     // los vertices de la bodega caen en una grilla de 50 cm

// Por tipo: nombre, campos que se ajustan (con su rango) y valores al agregarlo
export const TIPOS = {
  RS: {
    nombre: 'Rack selectivo', uso: 'Para pallets', imagen: '/assets/images/gallery-rack-selectivo-1.webp',
    campos: { cuerpos: ['Cuerpos', 1, 50], niveles: ['Niveles', 1, 8] }, doble: true,
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
    campos: { cuerpos: ['Calles', 1, 50], fondos: ['Pallets de fondo', 2, 12], niveles: ['Niveles', 1, 5] }, doble: false,
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
    campos: { cuerpos: ['Cuerpos', 1, 50], niveles: ['Niveles', 2, 10] }, doble: true,
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
  if (r.tipo === 'DI') return { ...medidasDriveIn({ calles: r.cuerpos, fondos: r.fondos, niveles: r.niveles, palletFrente: r.palletFrente, palletFondo: r.palletFondo, palletAlto: r.palletAlto, ...primerNivelGrua(r) }), grua: gruaDriveIn(r) };
  // Angulo ranurado: fondo y largo de bandeja del modelo (m), o 400 mm × 0,92 m
  if (r.tipo === 'AR') return medidasAnra({ tipo, cuerpos: r.cuerpos, niveles: r.niveles, bandeja: `${Math.round((r.bandeja || 0.4) * 1000)}mm`, frente: r.frente, altoEntre: r.altoEntre, altoAngulo: r.altoAngulo ?? ANRA_ANGULO_DEFECTO, nivelesCarga: r.nivelesCarga, pintado: 'galvanizado' });
  // Selectivo: el pallet del cliente si el modelo lo trae (m), o el de referencia
  const pallet = r.palletFrente > 0 && r.palletFondo > 0
    ? { frentePallet: `${Math.round(r.palletFrente * 1000)}mm`, fondoPallet: `${Math.round(r.palletFondo * 1000)}mm`, altoPallet: `${Math.round((r.palletAlto || 1.2) * 1000)}mm` }
    : PALLET;
  return medidasSelectivo({ tipo, cuerpos: r.cuerpos, niveles: r.niveles, ...PALLET, ...pallet, palletsPerBeam: r.porViga ?? 2, altos: r.altos, colores: r.colores, tunel: r.tunel, sobrante: r.sobrante, planos: r.planos, kgPallet: r.kgPallet, vigasY: r.vigasY, vigaPiso: r.vigaPiso });
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
export function rackDentro(r, bodega, margen = 0) {
  // margen: distancia minima a los muros (m), p. ej. DISTANCIAS.rackMuro al alargar un lineal
  return rectEnBodega(rectangulo(r), bodega, margen);
}

/** El rectángulo { x0, y0, ancho, alto } queda completo dentro del contorno (no solo de su caja) */
export function rectEnBodega(p, bodega, margen = 0) {
  const e = 0.005 - margen;
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
  anden: { nombre: 'Andén', plural: 'andenes', ancho: 3, alto: 2.5, color: '#0284c7', relleno: '#e0f2fe' },
  oficina: { nombre: 'Oficina', plural: 'oficinas', ancho: 5, alto: 4, color: '#7c3aed', relleno: '#ede9fe' },
  zona: { nombre: 'Zona que no se usa', plural: 'zonas que no se usan', ancho: 4, alto: 3, color: '#dc2626', relleno: '#fee2e2' },
  // Donde se arman y preparan pallets (solo si el cliente la agrega): ni racks ni grúas encima; en 3D trabajan dos operarios
  zonaCarga: { nombre: 'Zona de carga', plural: 'zonas de carga', ancho: 6, alto: 4, color: '#0d9488', relleno: '#ccfbf1' },
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

// Rack sobre pilar (dueño 26 y 27-10): el rack puede pasar sobre un pilar estructural, se arma alrededor y
// pierde solo lo que el pilar inutiliza (perdidasPorPilares): en selectivo los huecos de pallet donde cae; en
// drive-in la calle desde el pilar hacia el fondo (la grúa entra por la boca y no pasa el pilar); en ángulo
// ranurado el módulo donde cae
export function pilarDentro(r, e) {
  if (e.clase !== 'pilar' || !['RS', 'DI', 'AR'].includes(r.tipo)) return false;
  return solapan(rectangulo(r), rectElemento(e));
}
/** Cuantos pilares quedan dentro del rack (solo selectivo) */
export const pilaresEnRack = (r, bodega) => (bodega.elementos ?? []).filter((e) => pilarDentro(r, e)).length;

// Planta → coordenadas del rack: u a lo largo (desde su izquierda) y v hacia el fondo desde la cara de carga
// (la misma convención del dibujo en Plano2D: rot 0 frente arriba, 90 derecha, 180 abajo, 270 izquierda)
function aLocal(r, q) {
  const p = rectangulo(r), lado = deLado(r);
  const L = lado ? p.alto : p.ancho, F = lado ? p.ancho : p.alto;
  const x0 = q.x0, x1 = q.x0 + q.ancho, y0 = q.y0, y1 = q.y0 + q.alto;
  const [u0, u1, v0, v1] = {
    0: [x0 - p.x0, x1 - p.x0, y0 - p.y0, y1 - p.y0],
    90: [y0 - p.y0, y1 - p.y0, p.x0 + F - x1, p.x0 + F - x0],
    180: [p.x0 + L - x1, p.x0 + L - x0, p.y0 + F - y1, p.y0 + F - y0],
    270: [p.y0 + L - y1, p.y0 + L - y0, x0 - p.x0, x1 - p.x0],
  }[r.rot] ?? [0, 0, 0, 0];
  return { u0, u1, v0, v1, L, F };
}

/**
 * Posiciones que un selectivo pierde por pilares: los que caen dentro del rack (se arma alrededor) y los que
 * quedan en la boca de una posición (a menos de DISTANCIAS.bocaPosicion delante de la cara de carga: la grúa no
 * puede meter el pallet). Cada hueco de pallet cuenta una vez con todas sus alturas (el piso incluido).
 * Devuelve { pilares, perdidas, tapadas, huecos: [{ u0, u1, v0, v1, motivo: 'pilar' | 'tapa', fila, cuerpo, pos }] } en m
 * locales (fila 0 = cara de carga del frente, 1 = la de atrás en un doble; cuerpo y pos como en construir.js)
 */
export function perdidasPorPilares(r, bodega) {
  const vacio = { pilares: 0, perdidas: 0, tapadas: 0, huecos: [] };
  const pilares = (bodega.elementos ?? []).filter((e) => e.clase === 'pilar');
  if (!pilares.length) return vacio;
  if (r.tipo === 'DI') return perdidasDriveIn(r, pilares);
  if (r.tipo === 'AR') return perdidasAngulo(r, pilares);
  if (r.tipo !== 'RS') return vacio;
  const m = medidasRack(r);
  const { F } = aLocal(r, rectangulo(r));
  const boca = DISTANCIAS.bocaPosicion.valor, t = 0.005;
  // Huecos de pallet a lo largo, como los arma construir.js: pallets parejos entre las caras de los marcos
  const n = Math.max(1, Math.round(m.palletsPorViga || 2)), libre = m.viga - 0.1;
  const palAncho = Math.min(m.pallet.frente, libre / n - 0.05), hueco = (libre - n * palAncho) / (n + 1);
  const P = Math.min(F / (m.doble ? 2 : 1), m.pallet.fondo);
  // Caras: [v del pallet, franja de la boca delante de la cara de carga]
  const caras = m.doble ? [[0, P, -boca, 0], [F - P, F, F, F + boca]] : [[0, P, -boca, 0]];
  const alturas = m.nivelesY.length + (m.piso ? 1 : 0);
  const locales = pilares.map((e) => ({ e, q: aLocal(r, rectElemento(e)) }));
  const cruza = (a0, a1, b0, b1) => a0 < b1 - t && b0 < a1 - t;
  let perdidas = 0, tapadas = 0;
  const huecos = [];
  for (let i = 0; i < m.cuerpos; i++) {
    const enTunel = m.tunel && i === m.tunel.indice ? m.tunel.quitadas : 0;
    for (let j = 0; j < n; j++) {
      const u0 = i * m.viga + 0.1 + hueco + j * (palAncho + hueco), u1 = u0 + palAncho;
      caras.forEach(([v0, v1, b0, b1], fila) => {
        const sobre = locales.filter(({ q }) => cruza(q.u0, q.u1, u0, u1));
        let motivo = null;
        if (sobre.some(({ q }) => cruza(q.v0, q.v1, v0, v1))) motivo = 'pilar';
        else if (sobre.some(({ q }) => cruza(q.v0, q.v1, b0, b1))) motivo = 'tapa';
        if (!motivo) return;
        const k = Math.max(0, alturas - enTunel);
        if (motivo === 'pilar') perdidas += k; else tapadas += k;
        huecos.push({ u0, u1, v0, v1, motivo, fila, cuerpo: i, pos: j });
      });
    }
  }
  return { pilares: pilares.filter((e) => pilarDentro(r, e)).length, perdidas, tapadas, huecos };
}

const cruzaL = (a0, a1, b0, b1) => a0 < b1 - 0.005 && b0 < a1 - 0.005;

/**
 * Drive-in con un pilar dentro: en cada calle que toca, la grúa entra por la boca (v = 0) y no pasa el pilar, así
 * que se pierden los fondos desde el que toca el pilar hasta el último, en todos los niveles. perdidas: posiciones.
 * huecos: uno por calle (cuerpo = calle, pos = primer fondo perdido)
 */
function perdidasDriveIn(r, pilares) {
  const m = medidasRack(r), niveles = m.cartelasY.length + 1, fondo = m.moduloFondo;
  const locales = pilares.map((e) => aLocal(r, rectElemento(e))).filter((q) => q.v1 > 0.005 && q.v0 < q.F - 0.005 && q.u1 > 0.005 && q.u0 < q.L - 0.005);
  let perdidas = 0;
  const huecos = [];
  for (let c = 0; c < m.calles; c++) {
    const u0 = 0.05 + c * m.anchoCalle, u1 = u0 + m.anchoCalle;
    const enCalle = locales.filter((q) => cruzaL(q.u0, q.u1, u0, u1));
    if (!enCalle.length) continue;
    const desde = Math.max(0, Math.min(m.fondos - 1, Math.floor(Math.min(...enCalle.map((q) => q.v0)) / fondo + 1e-6)));
    perdidas += (m.fondos - desde) * niveles;
    huecos.push({ u0: u0 + 0.05, u1: u1 - 0.05, v0: desde * fondo, v1: m.fondos * fondo, motivo: 'pilar', fila: 0, cuerpo: c, pos: desde });
  }
  return { pilares: locales.length, perdidas, tapadas: 0, huecos };
}

/**
 * Ángulo ranurado con un pilar dentro: el módulo donde cae no se arma. perdidas: cajas que ya no caben (niveles de
 * carga del módulo × r.cajasNivel). huecos: uno por módulo (fila 0 frente, 1 la de atrás en doble)
 */
function perdidasAngulo(r, pilares) {
  const m = medidasRack(r), filas = m.doble ? 2 : 1, niveles = m.nivelesCarga ?? m.nivelesY.length;
  const locales = pilares.map((e) => aLocal(r, rectElemento(e))).filter((q) => q.v1 > 0.005 && q.v0 < q.F - 0.005 && q.u1 > 0.005 && q.u0 < q.L - 0.005);
  let perdidas = 0;
  const huecos = [];
  for (let c = 0; c < m.cuerpos; c++) {
    const u0 = c * m.frenteExt, u1 = u0 + m.frenteExt;
    for (let f = 0; f < filas; f++) {
      const v0 = f * m.fondoExt, v1 = v0 + m.fondoExt;
      if (!locales.some((q) => cruzaL(q.u0, q.u1, u0, u1) && cruzaL(q.v0, q.v1, v0, v1))) continue;
      perdidas += niveles * (r.cajasNivel ?? 0);
      huecos.push({ u0, u1, v0, v1, motivo: 'pilar', fila: f, cuerpo: c, pos: 0 });
    }
  }
  return { pilares: locales.length, perdidas, tapadas: 0, huecos, modulos: huecos.length };
}

/** Ids de los racks que se superponen con otro, con un elemento o se salen de la bodega */
export function conflictos(racks, bodega) {
  const malos = new Set();
  const elementos = (bodega.elementos ?? []).filter(bloquea);
  racks.forEach((a, i) => {
    if (!rackDentro(a, bodega)) malos.add(a.id);
    const pa = rectangulo(a);
    if (elementos.some((e) => !pilarDentro(a, e) && solapan(pa, rectElemento(e)))) malos.add(a.id);
    racks.slice(i + 1).forEach((b) => { if (seTocan(a, b)) { malos.add(a.id); malos.add(b.id); } });
  });
  return malos;
}

/** Primer lugar libre (de izquierda a derecha, de arriba abajo) dejando 1 m de pasillo */
/** Primer lugar libre para `nuevo`, a `separacion` m de los demas racks (por defecto 1 m) */
export function lugarLibre(nuevo, racks, bodega, separacion = 1) {
  const c = caja(contorno(bodega));
  const { ancho, alto } = rectangulo({ ...nuevo, x: 0, y: 0 });
  for (let y = c.y0 + alto / 2 + 1; y + alto / 2 <= c.y1; y += 0.5) {
    for (let x = c.x0 + ancho / 2 + 1; x + ancho / 2 <= c.x1; x += 0.5) {
      const r = { ...nuevo, x, y };
      const pr = rectangulo(r);
    const libreDeElementos = (bodega.elementos ?? []).filter(bloquea).every((q) => !solapan(pr, rectElemento(q)));
    if (rackDentro(r, bodega) && libreDeElementos && racks.every((o) => !seTocan(r, o, separacion))) return dentroDeBodega(r, bodega);
    }
  }
  return dentroDeBodega({ ...nuevo, x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2 }, bodega);
}

/**
 * ¿El rectángulo (x0, y0, ancho, alto) cabe en la bodega sin pisar elementos ni racks? `holgura` lo agranda para
 * dejar aire alrededor. Lo usan los elementos nuevos: nada nace encima de otro (dueño 27-10, el portón aparecía
 * en la esquina sobre la oficina)
 */
export function rectLibre(q, bodega, racks = [], holgura = 0) {
  const p = { x0: q.x0 - holgura, y0: q.y0 - holgura, ancho: q.ancho + 2 * holgura, alto: q.alto + 2 * holgura };
  const poly = contorno(bodega), e = 0.005;
  const esquinas = [{ x: q.x0 + e, y: q.y0 + e }, { x: q.x0 + q.ancho - e, y: q.y0 + e }, { x: q.x0 + q.ancho - e, y: q.y0 + q.alto - e }, { x: q.x0 + e, y: q.y0 + q.alto - e }];
  if (!esquinas.every((c) => puntoDentro(c, poly))) return false;
  const r = { x0: q.x0 + e, y0: q.y0 + e, x1: q.x0 + q.ancho - e, y1: q.y0 + q.alto - e };
  if (poly.some((a, i) => cruzaRect(a, poly[(i + 1) % poly.length], r))) return false;
  if ((bodega.elementos ?? []).some((o) => o.clase !== 'grua' && solapan(p, rectElemento(o)))) return false;
  return racks.every((o) => !solapan(p, rectangulo(o)));
}

/** Primer centro libre para un elemento suelto de ancho × alto, de arriba abajo y de izquierda a derecha; null si no hay */
export function lugarLibreElemento(ancho, alto, bodega, racks = [], holgura = 0.5) {
  const c = caja(contorno(bodega));
  for (let y = c.y0 + alto / 2 + 0.5; y + alto / 2 <= c.y1 - 0.2; y += 0.5) {
    for (let x = c.x0 + ancho / 2 + 0.5; x + ancho / 2 <= c.x1 - 0.2; x += 0.5) {
      if (rectLibre({ x0: x - ancho / 2, y0: y - alto / 2, ancho, alto }, bodega, racks, holgura)) return { x: +x.toFixed(2), y: +y.toFixed(2) };
    }
  }
  return null;
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
// Lo que corta la cota de un rack además de muros y racks (dueño 27-10: "cota entre la oficina y el rack").
// Pasillos dibujados y la grúa no: son espacio libre. Los pilares tampoco: uno en el pasillo ya lo dice la
// etiqueta del pasillo ("por un pilar quedan…") y la cota seguiría midiendo el pasillo entero
const COTA_HASTA = { oficina: 'la oficina', zonaCarga: 'la zona de carga', zona: 'la zona', porton: 'el portón', anden: 'el andén' };

/**
 * Cotas del rack a lo más cercano por cada lado: muro, otro rack o un elemento (oficina, zona, portón o
 * andén). a: 'muro' | 'rack' | 'elemento' (con `hasta`: qué es).
 * lateral: el lado es una cabecera (punta de la fila), por donde la grúa pasa de lado y no carga
 */
export function cotasRack(r, racks, bodega) {
  const p = rectangulo(r), poly = contorno(bodega);
  const cx = p.x0 + p.ancho / 2, cy = p.y0 + p.alto / 2;
  const deLargoX = !deLado(r);
  const lados = [
    { x: p.x0, y: cy, dx: -1, dy: 0 }, { x: p.x0 + p.ancho, y: cy, dx: 1, dy: 0 },
    { x: cx, y: p.y0, dx: 0, dy: -1 }, { x: cx, y: p.y0 + p.alto, dx: 0, dy: 1 },
  ];
  const elementos = (bodega.elementos ?? []).filter((e) => COTA_HASTA[e.clase]);
  return lados.map(({ x, y, dx, dy }) => {
    let d = rayoMuro(x, y, dx, dy, poly), a = 'muro', hasta = null;
    const probar = (q, que, nombre) => {
      // El vecino debe cruzar la linea de la cota
      if (dx && (y < q.y0 || y > q.y0 + q.alto)) return;
      if (dy && (x < q.x0 || x > q.x0 + q.ancho)) return;
      const gap = dx > 0 ? q.x0 - x : dx < 0 ? x - (q.x0 + q.ancho) : dy > 0 ? q.y0 - y : y - (q.y0 + q.alto);
      if (gap > -1e-6 && gap < d) { d = Math.max(0, gap); a = que; hasta = nombre; }
    };
    racks.forEach((o) => { if (o.id !== r.id) probar(rectangulo(o), 'rack', null); });
    elementos.forEach((e) => probar(rectElemento(e), 'elemento', COTA_HASTA[e.clase]));
    if (!Number.isFinite(d) || d < 0.3) return null;   // pegado al muro o al vecino: sin cota (no se lee)
    return { x1: x, y1: y, x2: x + dx * d, y2: y + dy * d, valor: d, a, hasta, lateral: deLargoX ? !!dx : !!dy };
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

/**
 * Grilla de pilares interiores con distancia entre ejes en X e Y. Por defecto queda centrada: el mismo margen
 * a los dos muros (antes partía a un paso del muro y quedaba corrida). `offX`/`offY` fijan el primer eje.
 * @param {any} bodega
 * @param {{ pasoX: number, pasoY: number, offX?: number, offY?: number }} grilla
 */
export function grillaPilaresXY(bodega, { pasoX, pasoY, offX, offY }) {
  const poly = contorno(bodega), c = caja(poly), out = [];
  const centrado = (largo, paso) => { const n = Math.max(1, Math.ceil(largo / paso - 1e-9) - 1); return (largo - (n - 1) * paso) / 2; };
  for (let y = c.y0 + (offY ?? centrado(c.y1 - c.y0, pasoY)); y <= c.y1 - 0.3; y += pasoY) {
    for (let x = c.x0 + (offX ?? centrado(c.x1 - c.x0, pasoX)); x <= c.x1 - 0.3; x += pasoX) {
      if (puntoDentro({ x, y }, poly)) out.push({ x: +x.toFixed(2), y: +y.toFixed(2) });
    }
  }
  return out;
}

/**
 * Pilares solo por los muros (dueño 28-10: "hay veces que el pilar va solo por el perímetro cada cierta cantidad de
 * metros"): uno en cada esquina y cada `paso` m por cada muro, pegados por dentro. `desde` (un pilar que ya está
 * en un muro) corre la serie de ese muro para que pase por él
 * @param {any} bodega
 * @param {{ paso: number, tam?: number, desde?: { x: number, y: number } | null }} opciones
 */
export function pilaresPerimetro(bodega, { paso, tam = 0.4, desde = null }) {
  const poly = contorno(bodega), out = [], m = tam / 2;
  const poner = (x, y) => {
    if (out.some((q) => Math.hypot(q.x - x, q.y - y) < Math.max(1, tam))) return;
    out.push({ x: +x.toFixed(2), y: +y.toFixed(2) });
  };
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length], L = Math.hypot(b.x - a.x, b.y - a.y);
    if (L < 2 * m + 0.01) return;
    const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
    // Normal hacia adentro de la bodega (el polígono puede venir en cualquier sentido)
    let nx = -uy, ny = ux;
    if (!puntoDentro({ x: (a.x + b.x) / 2 + nx * 0.05, y: (a.y + b.y) / 2 + ny * 0.05 }, poly)) { nx = -nx; ny = -ny; }
    const en = (t) => ({ x: a.x + ux * t + nx * m, y: a.y + uy * t + ny * m });
    // Fase: desde la esquina, o pasando por el pilar `desde` si está en este muro
    let t0 = m;
    if (desde) {
      const t = (desde.x - a.x) * ux + (desde.y - a.y) * uy, d = Math.abs((desde.x - a.x) * nx + (desde.y - a.y) * ny);
      if (d <= tam + 0.05 && t >= 0 && t <= L) t0 = m + ((((t - m) % paso) + paso) % paso);
    }
    const q0 = en(m); poner(q0.x, q0.y);
    for (let t = t0; t <= L - m - 1 + 1e-6; t += paso) { const q = en(t); poner(q.x, q.y); }
    const q1 = en(L - m); poner(q1.x, q1.y);
  });
  return out;
}

export const formatoM = (v) => (+v.toFixed(2)).toLocaleString('es-CL');
