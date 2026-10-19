// Evaluacion del proyecto en el planificador: necesidad de posiciones, comparador selectivo vs
// drive-in y arriendo evitado. Son estimaciones REFERENCIALES: los anchos de pasillo y las
// holguras definitivas los confirma Tecnica Racklog (ver PLAN-PLANIFICADOR.md, enrutamiento).
import { rectangulo, altoRack, contorno, caja, area, medidasRack } from './planificador.js';
import { capacidad } from './medidas.js';

// Supuestos visibles para el cliente
export const SUPUESTOS = {
  pasillo: 3.5,          // m, grua horquilla contrapeso (referencial)
  margenMuro: 0.5,       // m entre rack y muro
  m2PorPalletPiso: 1.8,  // m² por pallet guardado en el piso, con pasillos (referencial)
};

/** Posiciones que necesita: productos × pallets por producto, mas el crecimiento esperado */
export function necesidad({ skus, palletsPorSku, crecimiento }) {
  const base = Math.max(0, Number(skus) || 0) * Math.max(0, Number(palletsPorSku) || 0);
  return Math.ceil(base * (1 + Math.max(0, Number(crecimiento) || 0) / 100));
}

// Mas niveles que caben bajo la altura libre (si no hay altura, los del ejemplo)
function nivelesQueCaben(base, maximo, altura) {
  if (!(altura > 0)) return base.niveles;
  let n = 1;
  while (n < maximo && altoRack({ ...base, niveles: n + 1 }) <= altura) n++;
  return n;
}

// Cuantas unidades (cuerpos o calles) caben en `ancho`: el rack de 1 unidad mas lo que suma cada otra
function unidadesQueCaben(rack, ancho) {
  const uno = rectangulo({ ...rack, cuerpos: 1 }).ancho, dos = rectangulo({ ...rack, cuerpos: 2 }).ancho;
  return uno > ancho ? 0 : 1 + Math.floor((ancho - uno) / (dos - uno));
}

/**
 * Bodega llenada con un solo sistema, en filas a lo largo del ancho y pasillos de `pasillo` m.
 * Forma libre: se calcula sobre su caja y se ajusta por la proporcion de area real.
 */
export function estimarSistema(bodega, tipo, pasillo = SUPUESTOS.pasillo) {
  const poly = contorno(bodega), c = caja(poly);
  const W = c.x1 - c.x0 - 2 * SUPUESTOS.margenMuro, L = c.y1 - c.y0 - 2 * SUPUESTOS.margenMuro;
  const proporcion = area(poly) / ((c.x1 - c.x0) * (c.y1 - c.y0) || 1);
  if (W < 2 || L < 2) return { posiciones: 0, niveles: 0, detalle: 'La bodega es muy chica para estimar.' };

  if (tipo === 'RS') {
    const base = { id: 'e', tipo: 'RS', x: 0, y: 0, rot: 0, doble: true, cuerpos: 1, niveles: 4 };
    const niveles = nivelesQueCaben(base, 8, bodega.altura);
    const unidad = { ...base, niveles };
    const cuerpos = unidadesQueCaben(unidad, W);
    const fondo = rectangulo(unidad).alto;
    // Cada fila doble necesita un pasillo de un lado
    const filas = Math.max(0, Math.floor((L + pasillo) / (fondo + pasillo)));
    const pos = Math.floor(filas * cuerpos * capacidad(medidasRack(unidad)).pallets * proporcion);
    return { posiciones: pos, niveles, detalle: `${filas} filas dobles de ${cuerpos} cuerpos y ${niveles} niveles, pasillos de ${String(pasillo).replace('.', ',')} m` };
  }

  // Drive-in: bloques de calles a lo ancho; cada bloque con hasta 10 pallets de fondo y su pasillo de entrada
  const base = { id: 'e', tipo: 'DI', x: 0, y: 0, rot: 0, doble: false, cuerpos: 1, fondos: 2, niveles: 3 };
  const niveles = nivelesQueCaben(base, 5, bodega.altura);
  let fondos = 2;
  while (fondos < 10 && rectangulo({ ...base, niveles, fondos: fondos + 1 }).alto + pasillo <= L) fondos++;
  const unidad = { ...base, niveles, fondos };
  const calles = unidadesQueCaben(unidad, W);
  const prof = rectangulo(unidad).alto;
  const bloques = Math.max(0, Math.floor(L / (prof + pasillo)));
  const pos = Math.floor(bloques * calles * capacidad(medidasRack(unidad)).pallets * proporcion);
  return { posiciones: pos, niveles, detalle: `${bloques} bloque${bloques === 1 ? '' : 's'} de ${calles} calles × ${fondos} pallets de fondo y ${niveles} niveles` };
}

/** m² extra que necesitaria para guardar esos pallets en el piso, y su arriendo mensual */
export function arriendoEvitado(posiciones, m2Bodega, valorM2) {
  const m2Piso = posiciones * SUPUESTOS.m2PorPalletPiso;
  const m2Evitados = Math.max(0, m2Piso - m2Bodega);
  return { m2Piso, m2Evitados, mensual: m2Evitados * (Number(valorM2) || 0) };
}
