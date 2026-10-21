// Reglas de operacion del planificador: pasillo y levante segun la grua, semaforo de carga,
// fila paralela, llenado automatico, recorrido desde el porton, puntaje del lead y materiales.
// Usan lib/rack3d/parametrosTecnicos.js, cuyos valores son PROVISORIOS hasta que Tecnica confirme.
import { DISTANCIAS, CAPACIDADES } from './parametrosTecnicos.js';
import {
  medidasRack, rectangulo, rackDentro, rectElemento, contorno, caja, normalizar, area,
} from './planificador.js';
import { conGrua, gruaDe, pasillos, pasilloRequerido } from './pasillos.js';

export { gruaDe };

/** Altura (m) del nivel de carga mas alto: hasta donde debe levantar la grua */
export function alturaUltimoNivel(r) {
  const m = medidasRack(r);
  if (m.tipo === 'drivein') return m.cartelasY.at(-1) ?? 0;
  return m.nivelesY.at(-1) ?? 0;
}

/**
 * Avisos de operacion: pasillos (ver lib/rack3d/pasillos.js), los mas angostos de lo que piden
 * y los racks con niveles que la grua no alcanza.
 * Devuelve { pasillos, angostos, levante: Set<id>, pasilloMin, levanteMax }
 */
export function avisosOperacion(racks, bodega) {
  const g = gruaDe(bodega);
  const lista = pasillos(racks, bodega);
  const levante = new Set(racks.filter((r) => conGrua(r) && alturaUltimoNivel(r) > g.levante + 1e-6).map((r) => r.id));
  return { pasillos: lista, angostos: lista.filter((p) => !p.ok), levante, pasilloMin: g.pasillo, levanteMax: g.levante };
}

/**
 * Semaforo de carga de un rack con el peso declarado: 'verde' (≤ 80 %), 'amarillo' (≤ 100 %),
 * 'rojo' (> 100 %: requiere revision de ingenieria) o null si no hay peso.
 */
export function semaforoCarga(r, pesoPallet, pesoBandeja) {
  const m = medidasRack(r);
  let carga = 0, capacidad = 0;
  if (m.tipo === 'selectivo') { carga = (pesoPallet || 0) * m.palletsPorViga; capacidad = CAPACIDADES.selectivoParVigas.valor; }
  else if (m.tipo === 'drivein') { carga = pesoPallet || 0; capacidad = CAPACIDADES.driveInPallet.valor; }
  else { carga = pesoBandeja || 0; capacidad = CAPACIDADES.bandejaAngulo.valor; }
  if (!(carga > 0)) return null;
  const uso = carga / capacidad;
  return { uso, carga, capacidad, color: uso <= 0.8 ? 'verde' : uso <= 1 ? 'amarillo' : 'rojo' };
}

/** Racks cuya carga mas alta queda a menos de la holgura del techo */
export function racksSinHolgura(racks, alturaLibre) {
  if (!(alturaLibre > 0)) return new Set();
  const h = DISTANCIAS.holguraTecho.valor;
  return new Set(racks.filter((r) => (medidasRack(r).altoConCarga ?? medidasRack(r).alto) + h > alturaLibre + 1e-6).map((r) => r.id));
}

// Rack sin choques con muros, elementos ni otros racks
export function libre(r, racks, bodega) {
  if (!rackDentro(r, bodega)) return false;
  const p = rectangulo(r), e = 0.001;
  const toca = (q) => p.x0 < q.x0 + q.ancho - e && q.x0 < p.x0 + p.ancho - e && p.y0 < q.y0 + q.alto - e && q.y0 < p.y0 + p.alto - e;
  return racks.every((o) => o.id === r.id || !toca(rectangulo(o))) && (bodega.elementos ?? []).every((el) => !toca(rectElemento(el)));
}

/** Copia del rack en una fila paralela, separada por el pasillo de la grua (o null si no cabe) */
export function filaParalela(r, racks, bodega, id) {
  const p = rectangulo(r), lado = r.rot === 90 || r.rot === 270;
  const paso = (lado ? p.ancho : p.alto) + pasilloRequerido(r, bodega);
  for (const s of [1, -1]) {
    const n = { ...r, id, x: +(r.x + (lado ? s * paso : 0)).toFixed(2), y: +(r.y + (lado ? 0 : s * paso)).toFixed(2) };
    if (libre(n, racks, bodega)) return n;
  }
  return null;
}

/**
 * Llena la bodega con filas de un sistema, a lo ancho, con el pasillo de la grua. Cada fila se corta
 * en tramos donde hay muros, pilares o zonas, con el mayor numero de cuerpos que cabe.
 * Toda cara de carga queda frente a un pasillo completo:
 * - Selectivo: simple de espalda al muro de arriba, dobles entre pasillos y, si cabe, otra simple
 *   de espalda al muro de abajo (una doble contra el muro dejaria una cara sin pasillo).
 * - Drive-in: se carga solo por el frente (arriba), asi que cada fila lleva su pasillo delante.
 */
export function llenarBodega(bodega, tipo, nuevoId) {
  const c = caja(contorno(bodega)), g = gruaDe(bodega), m0 = DISTANCIAS.rackMuro.valor;
  // + 1 cm: los centros se redondean al cm y el pasillo no debe quedar ni un poco mas angosto
  const pasillo = pasilloRequerido({ tipo }, bodega) + 0.01;
  const base = tipo === 'DI'
    ? { tipo: 'DI', rot: 0, doble: false, cuerpos: 1, fondos: 5, niveles: 3 }
    : { tipo: 'RS', rot: 0, doble: true, cuerpos: 1, niveles: 3 };
  // Niveles: los que caben bajo la altura libre con su holgura y que la grua alcanza
  const altoMax = bodega.altura > 0 ? bodega.altura - DISTANCIAS.holguraTecho.valor : Infinity;
  const maxN = tipo === 'DI' ? 5 : 8;
  let niveles = 1;
  while (niveles < maxN) {
    const prueba = { ...base, id: 'x', x: 0, y: 0, niveles: niveles + 1 };
    if ((medidasRack(prueba).altoConCarga ?? medidasRack(prueba).alto) > altoMax || alturaUltimoNivel(prueba) > g.levante) break;
    niveles++;
  }
  const fondoDe = (fila) => rectangulo({ ...base, ...fila, id: 'x', x: 0, y: 0, niveles }).alto;

  // Filas de arriba abajo: { y0, fila } con lo que cambia respecto de `base`
  const filas = [], fin = c.y1 - m0 + 1e-6;
  if (tipo === 'DI') {
    const fondo = fondoDe({});
    for (let y0 = c.y0 + pasillo; y0 + fondo <= fin; y0 += fondo + pasillo) filas.push({ y0, fila: {} });
  } else {
    const simpleAbajo = { doble: false, rot: 180 }, simpleArriba = { doble: false, rot: 0 }, doble = {};
    const fS = fondoDe(simpleAbajo), fD = fondoDe(doble);
    let y = c.y0 + m0;
    if (y + fS <= fin) { filas.push({ y0: y, fila: simpleAbajo }); y += fS + pasillo; }
    // Una doble solo si despues le queda su pasillo completo
    while (y + fD + pasillo <= fin) { filas.push({ y0: y, fila: doble }); y += fD + pasillo; }
    // La ultima, de espalda al muro de abajo (el pasillo de antes queda igual o mas ancho)
    if (filas.length && y + fS <= fin) filas.push({ y0: c.y1 - m0 - fS, fila: simpleArriba });
  }

  const racks = [];
  filas.forEach(({ y0, fila }) => {
    let x = c.x0 + m0;
    while (x < c.x1 - m0 - 0.5) {
      let puesto = null;
      for (let n = 20; n >= 1 && !puesto; n--) {
        const r = normalizar({ ...base, ...fila, id: nuevoId(), cuerpos: n, niveles, x: 0, y: 0 });
        const p = rectangulo({ ...r, x: 0, y: 0 });
        const cand = { ...r, x: +(x + p.ancho / 2).toFixed(2), y: +(y0 + p.alto / 2).toFixed(2) };
        if (libre(cand, racks, bodega)) puesto = { r: cand, ancho: p.ancho };
      }
      if (puesto) { racks.push(puesto.r); x += puesto.ancho + 0.3; } else x += 0.5;
    }
  });
  return racks;
}

/** Recorrido promedio (m) desde el porton mas cercano hasta cada rack, en linea recta */
export function recorridoPromedio(racks, bodega) {
  const portones = (bodega.elementos ?? []).filter((e) => e.clase === 'porton' || e.clase === 'anden');
  if (!portones.length || !racks.length) return null;
  const d = racks.map((r) => Math.min(...portones.map((p) => Math.hypot(p.x - r.x, p.y - r.y))));
  return d.reduce((t, v) => t + v, 0) / d.length;
}

/** Puntaje del lead (0 a 100): cuanto dato dejo para cotizar sin llamar y que tan cerca esta la compra */
export function puntajeLead({ bodega, racks, perfil, plazo, telefono }) {
  let p = 0;
  if (racks.length) p += 15;
  if (bodega.altura > 0) p += 15;
  if (bodega.pesoPallet > 0 || bodega.pesoBandeja > 0) p += 10;
  if (bodega.grua) p += 10;
  if ((bodega.elementos ?? []).length) p += 5;
  if (area(contorno(bodega)) >= 500) p += 10;
  if (perfil === 'supply' || perfil === 'compras') p += 10;
  if (telefono) p += 5;
  p += { 'Lo antes posible': 20, 'En 1 a 3 meses': 15, 'En 3 a 6 meses': 8 }[plazo] ?? 0;
  return Math.min(100, p);
}

/** Lista preliminar de materiales para el vendedor (no se muestra al cliente ni va en el PDF) */
export function materiales(racks) {
  const t = { bastidores: 0, paresVigas: 0, bandejas: 0, angulos: 0 };
  racks.forEach((r) => {
    const m = medidasRack(r), filas = r.doble ? 2 : 1;
    if (m.tipo === 'selectivo') { t.bastidores += (m.cuerpos + 1) * filas; t.paresVigas += m.cuerpos * m.nivelesY.length * filas; }
    else if (m.tipo === 'drivein') t.bastidores += (m.calles + 1) * Math.ceil(m.fondos / 2 + 1);
    else { t.angulos += (m.cuerpos + 1) * 2 * filas; t.bandejas += m.cuerpos * m.nivelesY.length * filas; }
  });
  return [
    t.bastidores && `${t.bastidores} bastidores`,
    t.paresVigas && `${t.paresVigas} pares de vigas`,
    t.angulos && `${t.angulos} ángulos`,
    t.bandejas && `${t.bandejas} bandejas`,
  ].filter(Boolean).join(' · ');
}
