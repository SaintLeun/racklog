// Modelo del planificador publico: bodega (rectangular o con forma libre) y racks en planta.
// Sin Vue ni three. Version minima a proposito (gancho para cotizar): sin pasillos reglamentarios,
// cotas ni calculo estructural.
import { medidasSelectivo, medidasAnra, medidasDriveIn, medidasAltillo, huella, capacidad } from './medidas.js';

export const PASO = 0.1;          // los racks se mueven de a 10 cm
export const PASO_MURO = 0.5;     // los vertices de la bodega caen en una grilla de 50 cm

// Por tipo: nombre, campos que se ajustan (con su rango) y valores al agregarlo
export const TIPOS = {
  RS: {
    nombre: 'Rack selectivo', uso: 'Para pallets', imagen: '/assets/images/gallery-rack-selectivo-1.webp',
    campos: { cuerpos: ['Cuerpos', 1, 20], niveles: ['Niveles', 1, 8] }, doble: true,
    inicial: { cuerpos: 4, niveles: 3, doble: false },
  },
  DI: {
    nombre: 'Drive-in', uso: 'Pallets en profundidad', imagen: '/assets/images/gallery-drive-in-1.webp',
    campos: { cuerpos: ['Calles', 1, 20], fondos: ['Pallets de fondo', 2, 12], niveles: ['Niveles', 1, 5] }, doble: false,
    inicial: { cuerpos: 4, fondos: 5, niveles: 3, doble: false },
  },
  AR: {
    nombre: 'Ángulo ranurado', uso: 'Para cajas y bultos', imagen: '/assets/images/gallery-angulo-ranurado-1.webp',
    campos: { cuerpos: ['Cuerpos', 1, 20], niveles: ['Niveles', 2, 10] }, doble: true,
    inicial: { cuerpos: 3, niveles: 5, doble: false },
  },
  AL: {
    nombre: 'Altillo', uso: 'Estantería en pisos', imagen: '/assets/images/gallery-altillo-ar-1.webp',
    campos: { cuerpos: ['Cuerpos', 1, 20], pisos: ['Pisos', 1, 2], niveles: ['Niveles por piso', 2, 8] }, doble: true,
    inicial: { cuerpos: 4, pisos: 1, niveles: 5, doble: false },
  },
};
export const NOMBRE = Object.fromEntries(Object.entries(TIPOS).map(([k, t]) => [k, t.nombre]));
export const LIMITES = { bodega: { min: 4, max: 200 } };

// Medidas fijas del planificador: pallet 1000×1200×1200 y bandeja de 400 mm galvanizada
const PALLET = { frentePallet: '1000mm', fondoPallet: '1200mm', altoPallet: '1200mm', palletsPerBeam: 2 };

export function medidasRack(r) {
  const tipo = r.doble ? 'doble' : 'simple';
  if (r.tipo === 'DI') return medidasDriveIn({ calles: r.cuerpos, fondos: r.fondos, niveles: r.niveles });
  if (r.tipo === 'AL') return medidasAltillo({ tipo, cuerpos: r.cuerpos, niveles: r.niveles, pisos: r.pisos, bandeja: '400mm' });
  if (r.tipo === 'AR') return medidasAnra({ tipo, cuerpos: r.cuerpos, niveles: r.niveles, bandeja: '400mm', pintado: 'galvanizado' });
  return medidasSelectivo({ tipo, cuerpos: r.cuerpos, niveles: r.niveles, ...PALLET });
}

/** Rack con sus campos dentro de rango (los del altillo de 2 pisos piden al menos 4 cuerpos) */
export function normalizar(r) {
  const t = TIPOS[r.tipo];
  const out = { ...t.inicial, ...r, doble: t.doble ? !!r.doble : false, rot: ROTACIONES.includes(r.rot) ? r.rot : 0 };
  Object.entries(t.campos).forEach(([k, [, min, max]]) => { out[k] = Math.min(max, Math.max(min, Math.round(Number(out[k]) || min))); });
  if (r.tipo === 'AL' && out.pisos > 1) out.cuerpos = Math.max(4, out.cuerpos);
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

function puntoDentro(p, poly) {
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

/** Ids de los racks que se superponen con otro o se salen de la bodega */
export function conflictos(racks, bodega) {
  const malos = new Set();
  racks.forEach((a, i) => {
    if (!rackDentro(a, bodega)) malos.add(a.id);
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
      if (rackDentro(r, bodega) && racks.every((o) => !seTocan(r, o, 1))) return dentroDeBodega(r, bodega);
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

/** Resumen para el formulario de cotizacion (lo recibe el vendedor) */
export function resumenCotizacion(bodega, racks) {
  const t = totales(racks);
  const poly = contorno(bodega), c = caja(poly);
  const config = {
    'Origen': 'Planificador web',
    'Bodega': bodega.forma
      ? `Forma libre de ${poly.length} lados, ${(c.x1 - c.x0).toFixed(1)} × ${(c.y1 - c.y0).toFixed(1)} m (${Math.round(area(poly))} m²)`
      : `${bodega.ancho} × ${bodega.largo} m (${Math.round(area(poly))} m²)`,
    'Racks dibujados': racks.length,
  };
  if (t.pallets) config['Posiciones de pallet'] = t.pallets;
  if (t.bandejas) config['Niveles de bandeja'] = t.bandejas;
  // Racks iguales agrupados: la API acepta hasta 30 campos
  const grupos = new Map();
  racks.forEach((r) => grupos.set(describir(r), (grupos.get(describir(r)) || 0) + 1));
  [...grupos.entries()].slice(0, 24).forEach(([texto, n], i) => { config[`Tipo ${i + 1}`] = `${n} × ${texto}`; });
  return config;
}
