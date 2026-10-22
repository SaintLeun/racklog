// Lo que ve cada perfil en Revisa y en el PDF (ronda 3, bloque E). Una sola cuenta para la pestaña y el
// PDF: gerencia (hoy vs Racklog, crecimiento, capacidad útil), jefe de bodega (dónde queda cada producto,
// pasillos, alturas) y compras (especificación para comparar). Sin Vue. Medidas en m.
import { area, contorno, rectangulo, medidasRack, formatoM, NOMBRE } from '../rack3d/planificador.js';
import { GRUAS, equipoDe } from '../rack3d/parametrosTecnicos.js';
import { pasillos } from '../rack3d/pasillos.js';
import { alturaUltimoNivel } from '../rack3d/operacion.js';
import { proponerAccesorios, aplicarAjustes, numTexto } from '../rack3d/accesorios.js';
import { conteoTotal, queCotizar } from './calculos.js';

const n = (v) => Math.round(v).toLocaleString('es-CL');
const fm = (v) => formatoM(v || 0);

/** m² que ocupan los racks con su pasillo (el mismo criterio que "Te quedan X m² libres" del paso 5) */
export function areaOcupada(racks, bodega) {
  const P = (GRUAS[bodega.grua] ?? GRUAS.contrapeso).pasillo;
  return racks.reduce((t, r) => { const q = rectangulo(r); return t + q.ancho * q.alto + Math.max(q.ancho, q.alto) * P; }, 0);
}

/**
 * Encuadre a lo diseñado (planta, m): los racks con su pasillo y los portones/andenes, o null si ya ocupan
 * buena parte de la bodega (entonces se ve entera). Lo usan el plano 2D y las vistas 3D de los pasos 5–7.
 */
export function focoDiseño(racks, bodega) {
  if (!racks.length) return null;
  const xs = contorno(bodega).map((q) => q.x), ys = contorno(bodega).map((q) => q.y);
  const c = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  const P = (GRUAS[bodega.grua] ?? GRUAS.contrapeso).pasillo + 1;
  const accesos = (bodega.elementos ?? []).filter((e) => e.clase === 'porton' || e.clase === 'anden')
    .map((e) => ({ x0: e.x - e.ancho / 2, y0: e.y - e.alto / 2, ancho: e.ancho, alto: e.alto }));
  const todo = [...racks.map((r) => rectangulo(r)), ...accesos];
  const f = {
    x0: Math.max(c.x0, Math.min(...todo.map((q) => q.x0)) - P), y0: Math.max(c.y0, Math.min(...todo.map((q) => q.y0)) - P),
    x1: Math.min(c.x1, Math.max(...todo.map((q) => q.x0 + q.ancho)) + P), y1: Math.min(c.y1, Math.max(...todo.map((q) => q.y0 + q.alto)) + P),
  };
  const alto = Math.max(3, ...racks.map((r) => { const m = medidasRack(r); return Number(m.altoConCarga ?? m.alto) || 3; }));
  return (f.x1 - f.x0) * (f.y1 - f.y0) < 0.6 * (c.x1 - c.x0) * (c.y1 - c.y0) ? { ...f, alto } : null;
}

/** Posiciones que tiene hoy: lo que dijo, lo de sus importaciones o los racks que ya tiene dibujados */
export function posicionesHoy(p) {
  const existentes = conteoTotal(p.racks.filter((r) => r.existente)).posiciones;
  return p.posicionesHoy || p.pallets.reduce((t, x) => t + (x.importacion?.actuales || 0), 0) || existentes;
}

// Niveles de un rack en palabras: "piso", "piso y nivel 1", "niveles 2 a 3"
function nivelesTexto(alturas) {
  if (!alturas.length) return '';
  const piso = alturas[0] === 0, resto = alturas.filter((a) => a > 0);
  const tramo = !resto.length ? '' : resto.length === 1 ? `nivel ${resto[0]}` : `niveles ${resto[0]} a ${resto[resto.length - 1]}`;
  return piso ? (tramo ? `piso y ${tramo}` : 'piso') : tramo;
}

/**
 * { gerencia, bodega, compras } con los datos de cada pestaña. crecimiento: % anual (0,1 = 10 %).
 */
export function vistasPorRol(p, { crecimiento = p.crecimiento ?? 0.1 } = {}) {
  const nuevos = p.racks.filter((r) => !r.existente);
  const c = conteoTotal(nuevos);
  const grua = equipoDe(p.bodega);

  // ─── Gerencia: hoy vs Racklog, crecimiento y capacidad útil (sin precios) ───
  const hoy = posicionesHoy(p);
  const conservadas = conteoTotal(p.racks.filter((r) => r.existente)).posiciones;
  const conRacklog = c.posiciones + conservadas;
  const necesidad = p.pallets.reduce((t, x) => t + (x.cantidad || 0), 0);
  const anios = [0, 1, 2].map((a) => ({ t: a === 0 ? 'Hoy' : a === 1 ? 'En 1 año' : 'En 2 años', necesitas: Math.ceil(necesidad * (1 + crecimiento) ** a) }));
  anios.forEach((x) => { x.cubre = conRacklog >= x.necesitas; });
  const m2 = area(contorno(p.bodega));
  const usado = Math.min(m2, areaOcupada(p.racks, p.bodega));
  const libre = Math.max(0, Math.round((m2 - usado) / 10) * 10);
  // Lo que cabria en el espacio libre con la misma densidad (fase 2)
  const fase2 = usado > 0 ? Math.floor((c.posiciones / Math.max(1, areaOcupada(nuevos, p.bodega))) * libre / 10) * 10 : 0;
  const gerencia = {
    hoy, conRacklog, mas: conRacklog - hoy, masPct: hoy ? Math.round(((conRacklog - hoy) / hoy) * 100) : null,
    crecimiento, anios, m2, usadoPct: m2 ? Math.round((usado / m2) * 100) : 0, libre, fase2,
    plazo: 'Plazo de fabricación y montaje: lo confirma tu ejecutivo en máximo 24 horas',
  };

  // ─── Jefe de bodega: dónde queda cada producto, pasillos y alturas en metros ───
  const productos = [];
  p.modelos.forEach((mo) => {
    const r = nuevos.find((x) => x.modelo === mo.id);
    if (!r) return;
    const filas = nuevos.filter((x) => x.modelo === mo.id).length;
    const donde = `${mo.nombre}${filas > 1 ? ` (${filas} filas)` : ''}`;
    const lista = mo.tipo === 'AR' ? p.cajas : p.pallets;
    lista.filter((t) => (mo.cantidades?.[t.id] ?? 0) > 0).forEach((t) => {
      const alturas = mo.tipo === 'RS' && Array.isArray(r.mezcla) ? r.mezcla.map((id, i) => (id === t.id ? i : -1)).filter((i) => i >= 0) : [];
      productos.push({ id: t.id, nombre: t.nombre, color: t.color, donde, niveles: nivelesTexto(alturas) || (mo.tipo === 'DI' ? 'todas sus calles' : 'en sus repisas') });
    });
  });
  const alturas = p.modelos.map((mo) => {
    const r = nuevos.find((x) => x.modelo === mo.id);
    if (!r || mo.tipo === 'AR') return null;
    const m = medidasRack(r);
    // Misma altura de nivel que el paso 3 y "Nivel más alto" (alturaUltimoNivel): el eje de la viga
    const pisos = m.tipo === 'selectivo' ? m.nivelesY : (m.cartelasY ?? []);
    return { nombre: mo.nombre, niveles: ['piso', ...pisos.map((y) => fm(y))], marco: fm(m.alto) };
  }).filter(Boolean);
  const lp = pasillos(p.racks, p.bodega);
  // Anchos de los pasillos entre racks; el espacio abierto hasta un muro lejano no es "un pasillo de 50 m"
  const entreRacks = lp.filter((x) => x.libre <= 2 * grua.pasillo);
  const anchos = [...new Set(entreRacks.map((x) => fm(x.libre)))];
  const nivelMax = Math.max(0, ...p.racks.filter((r) => r.tipo !== 'AR').map((r) => alturaUltimoNivel(r)));
  const bodega = {
    productos, alturas,
    pasillos: { n: lp.length, anchos, abiertos: lp.length - entreRacks.length, minimo: lp.length ? Math.min(...lp.map((x) => x.libre)) : 0, angostos: lp.filter((x) => !x.ok).length, pide: grua.pasillo },
    equipo: grua.nombre, nivelMax, levante: grua.levante, alcanza: nivelMax <= grua.levante + 1e-6,
  };

  // ─── Compras: especificación para comparar con otros proveedores ───
  const acc = aplicarAjustes(proponerAccesorios({ bodega: p.bodega, racks: p.racks, pallets: p.pallets }), p.accesorios)
    .filter((a) => a.incluido !== false && a.cantidad > 0)
    .map((a) => ({ nombre: a.nombre, medida: [a.medida, a.detallePiezas].filter(Boolean).join(' · '), cantidad: `${numTexto(a.cantidad)} ${a.unidad === 'u' ? (a.cantidad === 1 ? 'unidad' : 'unidades') : a.unidad === 'm' ? 'm' : a.unidad}` }));
  const compras = {
    cotizar: queCotizar(p.modelos, p.racks),
    accesorios: acc,
    conteo: c,
    norma: 'Cumple NCh2369 (cálculo sísmico por Técnica Racklog)',
    // Sin tabla de kg/m de pilares y vigas en el planificador: el peso lo entrega el cotizador
    pesoAcero: 'Lo entrega tu ejecutivo con la cotización (cálculo del cotizador Racklog)',
    sistemas: [...new Set(nuevos.map((r) => NOMBRE[r.tipo]))],
  };
  return { gerencia, bodega, compras };
}

