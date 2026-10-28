// Autollenado (dueño 27-10, "la bomba que prometemos"): llenar la bodega, o un área marcada dentro de ella, con
// la mayor cantidad de posiciones de pallet que cumpla todas las reglas del planificador:
// - pasillo de trabajo según la grúa (pasilloRequerido: ancho para girar con el pallet, su radio de giro)
// - pasillo de cabecera del mismo ancho, para que la grúa entre a todos los pasillos de carga
// - doble nunca contra el muro; simples perimetrales de espalda al muro (opción)
// - pilares dentro del rack (pierde solo esas posiciones), nunca en un pasillo; oficina, andén y zonas tampoco
// - sin choques, sin pasillos angostos y sin pasillos sin salida
// Prueba combinaciones (filas a lo ancho o a lo largo, con o sin simples perimetrales, cabecera a un lado o al
// otro) con el mismo algoritmo de ubicarModelos y se queda con la válida que más guarda. Sin Vue.
import { ubicarModelos, conPilares, conteoTotal } from './calculos.js';
import { conflictos, contorno, caja, rectangulo } from '../rack3d/planificador.js';
import { pasillos } from '../rack3d/pasillos.js';
import { pasillosSinSalida } from './alinear.js';

const TODO = 999;
const MURO_T = { arriba: 'izquierda', abajo: 'derecha', izquierda: 'arriba', derecha: 'abajo' };
// Reflejo en la diagonal (x ↔ y): filas a lo ancho pasan a filas a lo largo. Un rack con el frente arriba (rot 0,
// mira a −y) queda mirando a −x (rot 270); abajo (180) queda a la derecha (90)
const ROT_T = { 0: 270, 180: 90, 90: 180, 270: 0 };
const tPunto = (q) => ({ ...q, x: q.y, y: q.x });
function transponer(bodega) {
  return {
    ...bodega,
    ancho: bodega.largo, largo: bodega.ancho,
    forma: bodega.forma ? bodega.forma.map(tPunto) : null,
    elementos: (bodega.elementos ?? []).map((e) => ({ ...e, x: e.y, y: e.x, ancho: e.alto, alto: e.ancho, ...(e.muro ? { muro: MURO_T[e.muro] } : {}) })),
  };
}
const rackT = (r) => ({ ...r, x: r.y, y: r.x, rot: ROT_T[r.rot] ?? r.rot });

/** Bodega recortada a un área rectangular { x0, y0, x1, y1 } (lo de fuera no se toca) */
export function bodegaDeArea(bodega, area) {
  const c = caja(contorno(bodega));
  const x0 = Math.max(c.x0, area.x0), y0 = Math.max(c.y0, area.y0), x1 = Math.min(c.x1, area.x1), y1 = Math.min(c.y1, area.y1);
  if (x1 - x0 < 2 || y1 - y0 < 2) return null;
  return { ...bodega, forma: [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }], tipoForma: null };
}

/** Cómo queda un layout: posiciones (con lo que quitan los pilares) y cada regla que rompe */
export function evaluarLayout(bodega, racks) {
  const c = conPilares(racks, bodega);
  const choques = conflictos(racks, bodega).size;
  const angostos = pasillos(racks, bodega).filter((x) => !x.ok).length;
  const sinSalida = pasillosSinSalida(racks.filter((r) => !r.existente), bodega).length;
  return { racks: c, posiciones: conteoTotal(c.filter((r) => !r.existente)).posiciones, choques, angostos, sinSalida, valido: !choques && !angostos && !sinSalida };
}

/**
 * Mejor layout para un modelo de rack.
 * @param bodega la bodega completa (con sus elementos)
 * @param modelo modelo del paso 4 (RS simple o doble, o DI)
 * @param opciones { pallets, cajas, nuevoId, existentes: racks que se quedan (fuera del área o ya puestos),
 *   area: { x0, y0, x1, y1 } para llenar solo ahí, orientacion: 'auto' | 'ancho' | 'largo', perimetral: 'auto' | true | false }
 * Devuelve { racks (solo los nuevos), posiciones, valido, variante: { orientacion, perimetral, cabecera }, probadas }
 */
export function autollenar(bodega, modelo, { pallets = [], cajas = [], nuevoId, existentes = [], area = null, orientacion = 'auto', perimetral = 'auto' } = {}) {
  const zona = area ? bodegaDeArea(bodega, area) : bodega;
  if (!zona) return { racks: [], posiciones: 0, valido: false, variante: null, probadas: 0 };
  const orientaciones = orientacion === 'auto' ? ['ancho', 'largo'] : [orientacion];
  const perimetrales = perimetral === 'auto' ? [true, false] : [perimetral];
  const cabeceras = [null, 'izq', 'der'];
  const id = nuevoId ?? (() => `r${Math.random().toString(36).slice(2, 9)}`);
  let mejor = null, probadas = 0;
  const vistas = new Set();
  for (const o of orientaciones) {
    const b = o === 'largo' ? transponer(zona) : zona;
    const ex = o === 'largo' ? existentes.map(rackT) : existentes;
    for (const per of perimetrales) {
      for (const cab of cabeceras) {
        const u = ubicarModelos(b, [modelo], { [modelo.id]: TODO }, { pallets, cajas, nuevoId: id, existentes: ex, perimetral: per, cabeceraLado: cab });
        const nuevos = o === 'largo' ? u.racks.map(rackT) : u.racks;
        // Misma solución por otra combinación (p. ej. cabecera automática = izquierda): no se evalúa dos veces
        const firma = nuevos.map((r) => `${r.x},${r.y},${r.rot},${r.cuerpos}`).sort().join('|');
        if (vistas.has(firma)) continue;
        vistas.add(firma);
        probadas++;
        // Se evalúa contra la bodega completa: lo de fuera del área también cuenta para choques y pasillos
        const ev = evaluarLayout(bodega, [...existentes, ...nuevos]);
        const cand = { racks: ev.racks.filter((r) => !r.existente && !existentes.some((e) => e.id === r.id)), posiciones: ev.posiciones - conteoTotal(conPilares(existentes, bodega).filter((r) => !r.existente)).posiciones, valido: ev.valido, faltas: ev.choques + ev.angostos + ev.sinSalida, variante: { orientacion: o, perimetral: per, cabecera: cab ?? 'accesos' } };
        // Gana la válida que más guarda; a igualdad, la cabecera del lado de los accesos y menos tramos
        if (!mejor || mejorQue(cand, mejor)) mejor = cand;
      }
    }
  }
  return { ...mejor, probadas };
}
function mejorQue(a, b) {
  if (a.valido !== b.valido) return a.valido;
  if (!a.valido && a.faltas !== b.faltas) return a.faltas < b.faltas;
  if (a.posiciones !== b.posiciones) return a.posiciones > b.posiciones;
  if ((a.variante.cabecera === 'accesos') !== (b.variante.cabecera === 'accesos')) return a.variante.cabecera === 'accesos';
  return a.racks.length < b.racks.length;
}

/** Racks que quedan fuera de un área (los de dentro se reemplazan al autollenar el área) */
export function racksFueraDeArea(racks, area) {
  return racks.filter((r) => {
    const q = rectangulo(r), cx = q.x0 + q.ancho / 2, cy = q.y0 + q.alto / 2;
    return !(cx > area.x0 && cx < area.x1 && cy > area.y0 && cy < area.y1);
  });
}
