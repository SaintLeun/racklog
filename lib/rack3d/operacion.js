// Reglas de operacion del planificador: pasillo y levante segun la grua, semaforo de carga,
// fila paralela, llenado automatico, recorrido desde el porton, puntaje del lead y materiales.
// Usan lib/rack3d/parametrosTecnicos.js, cuyos valores son PROVISORIOS hasta que Tecnica confirme.
import { GRUAS, DISTANCIAS, CAPACIDADES } from './parametrosTecnicos.js';
import {
  medidasRack, rectangulo, cotasRack, rackDentro, rectElemento, contorno, caja, normalizar, area,
} from './planificador.js';

const conGrua = (r) => r.tipo === 'RS' || r.tipo === 'DI';
export const gruaDe = (bodega) => GRUAS[bodega.grua] ?? GRUAS.contrapeso;

/** Altura (m) del nivel de carga mas alto: hasta donde debe levantar la grua */
export function alturaUltimoNivel(r) {
  const m = medidasRack(r);
  if (m.tipo === 'drivein') return m.cartelasY.at(-1) ?? 0;
  return m.nivelesY.at(-1) ?? 0;
}

/**
 * Avisos de operacion: pasillos mas angostos que los que pide la grua y niveles que no alcanza.
 * Devuelve { pasillos: [{ a, b, ancho }], levante: Set<id>, pasilloMin, levanteMax }
 */
export function avisosOperacion(racks, bodega) {
  const g = gruaDe(bodega);
  const pasillos = [], vistos = new Set();
  racks.filter(conGrua).forEach((r) => {
    cotasRack(r, racks, bodega).forEach((c) => {
      if (c.a !== 'rack' || c.valor >= g.pasillo - 1e-6) return;
      // El vecino: el rack que toca el extremo de la cota
      const vecino = racks.find((o) => {
        if (o.id === r.id || !conGrua(o)) return false;
        const q = rectangulo(o), e = 0.02;
        return c.x2 >= q.x0 - e && c.x2 <= q.x0 + q.ancho + e && c.y2 >= q.y0 - e && c.y2 <= q.y0 + q.alto + e;
      });
      if (!vecino) return;
      const clave = [r.id, vecino.id].sort().join();
      if (vistos.has(clave)) return;
      vistos.add(clave);
      pasillos.push({ a: r.id, b: vecino.id, ancho: c.valor });
    });
  });
  const levante = new Set(racks.filter((r) => conGrua(r) && alturaUltimoNivel(r) > g.levante + 1e-6).map((r) => r.id));
  return { pasillos, levante, pasilloMin: g.pasillo, levanteMax: g.levante };
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
function libre(r, racks, bodega) {
  if (!rackDentro(r, bodega)) return false;
  const p = rectangulo(r), e = 0.001;
  const toca = (q) => p.x0 < q.x0 + q.ancho - e && q.x0 < p.x0 + p.ancho - e && p.y0 < q.y0 + q.alto - e && q.y0 < p.y0 + p.alto - e;
  return racks.every((o) => o.id === r.id || !toca(rectangulo(o))) && (bodega.elementos ?? []).every((el) => !toca(rectElemento(el)));
}

/** Copia del rack en una fila paralela, separada por el pasillo de la grua (o null si no cabe) */
export function filaParalela(r, racks, bodega, id) {
  const p = rectangulo(r), lado = r.rot === 90 || r.rot === 270;
  const pasillo = conGrua(r) ? gruaDe(bodega).pasillo : 1.2;   // angulo ranurado: pasillo de persona
  const paso = (lado ? p.ancho : p.alto) + pasillo;
  for (const s of [1, -1]) {
    const n = { ...r, id, x: +(r.x + (lado ? s * paso : 0)).toFixed(2), y: +(r.y + (lado ? 0 : s * paso)).toFixed(2) };
    if (libre(n, racks, bodega)) return n;
  }
  return null;
}

/**
 * Llena la bodega con filas de un sistema, a lo ancho, con el pasillo de la grua. Cada fila se corta
 * en tramos donde hay muros, pilares o zonas, con el mayor numero de cuerpos que cabe.
 */
export function llenarBodega(bodega, tipo, nuevoId) {
  const c = caja(contorno(bodega)), g = gruaDe(bodega), m0 = DISTANCIAS.rackMuro.valor;
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
  const fondo = rectangulo({ ...base, id: 'x', x: 0, y: 0, niveles }).alto;
  const racks = [];
  for (let y0 = c.y0 + m0; y0 + fondo <= c.y1 - m0 + 1e-6; y0 += fondo + g.pasillo) {
    let x = c.x0 + m0;
    while (x < c.x1 - m0 - 0.5) {
      let puesto = null;
      for (let n = 20; n >= 1 && !puesto; n--) {
        const r = normalizar({ ...base, id: nuevoId(), cuerpos: n, niveles, x: 0, y: 0 });
        const p = rectangulo({ ...r, x: 0, y: 0 });
        const cand = { ...r, x: +(x + p.ancho / 2).toFixed(2), y: +(y0 + p.alto / 2).toFixed(2) };
        if (libre(cand, racks, bodega)) puesto = { r: cand, ancho: p.ancho };
      }
      if (puesto) { racks.push(puesto.r); x += puesto.ancho + 0.3; } else x += 0.5;
    }
  }
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
