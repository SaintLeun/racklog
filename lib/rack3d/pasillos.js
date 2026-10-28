// Pasillos del planificador: se calculan solos a partir de los racks (no se dibujan a mano).
// Un pasillo es el espacio libre frente a una cara de carga de un rack, hasta el rack vecino o el
// muro. Las caras de carga son el frente del rack y, si es doble, tambien la de atras; los
// costados (entre racks de una misma fila) y las espaldas no son pasillo.
// Avisos, plano 2D, llenado automatico y fila paralela usan esta misma lista.
import { GRUAS, equipoDe, DISTANCIAS } from './parametrosTecnicos.js';
import { rectangulo, contorno, rayoMuro, rectElemento } from './planificador.js';

// Menos que esto entre una cara y el vecino o el muro no es pasillo: el rack esta apoyado ahi
const ESPALDA = 0.5;
// Lo que angosta un pasillo si queda dentro (dueño 27-10: "recuerda que hay pilares"). Pasillos peatonales, de grúa
// y franjas de maniobra se circulan: no angostan
export const ANGOSTAN = ['pilar', 'oficina', 'anden', 'zona', 'zonaCarga'];

export const conGrua = (r) => r.tipo === 'RS' || r.tipo === 'DI';
export const gruaDe = (bodega) => equipoDe(bodega);

/** Ancho (m) que necesita el pasillo frente al rack: el de la grua, o el de una persona en angulo ranurado */
export function pasilloRequerido(r, bodega) {
  if (conGrua(r)) return gruaDe(bodega).pasillo;
  // Angulo ranurado: de 0,8 a 1,5 m (DISTANCIAS.pasilloAR); con carro de carga, el carro + 0,3 m sin pasar de 1,5
  const { min, max } = DISTANCIAS.pasilloAR;
  return Math.min(max, Math.max(min, Number(r.anchoCarro) > 0 ? Number(r.anchoCarro) + 0.3 : 0));
}

// Lado del plano hacia donde mira el frente segun el giro (igual que Plano2D y la escena 3D)
const LADO = {
  arriba: { dx: 0, dy: -1 }, derecha: { dx: 1, dy: 0 }, abajo: { dx: 0, dy: 1 }, izquierda: { dx: -1, dy: 0 },
};
const FRENTE = { 0: 'arriba', 90: 'derecha', 180: 'abajo', 270: 'izquierda' };
const OPUESTO = { arriba: 'abajo', abajo: 'arriba', derecha: 'izquierda', izquierda: 'derecha' };

/** Lados por donde se carga el rack: el frente y, si es doble, tambien el de atras */
export function carasDeCarga(r) {
  const f = FRENTE[r.rot] ?? 'arriba';
  return r.doble ? [f, OPUESTO[f]] : [f];
}

/**
 * Todos los pasillos de la bodega. Cada uno:
 * { id, x0, y0, x1, y1, eje, libre, minimo, ok, racks, vecino }
 * - x0..y1: rectangulo libre en planta (m)
 * - eje: 'x' si el ancho libre se mide en x (pasillo vertical en el plano), 'y' si no
 * - libre: ancho libre (m); minimo: el que pide el rack mas exigente que carga desde ahi
 * - racks: ids de los racks que se cargan desde el pasillo (uno o los dos lados)
 * - vecino: id del rack del otro lado, o null si es el muro
 */
export function pasillos(racks, bodega) {
  const poly = contorno(bodega);
  const rects = new Map(racks.map((r) => [r.id, rectangulo(r)]));
  const porClave = new Map();

  racks.forEach((r) => {
    const p = rects.get(r.id);
    carasDeCarga(r).forEach((lado) => {
      const { dx, dy } = LADO[lado];
      // Cara: borde del rack en la direccion del lado; [a0, a1] es su tramo a lo largo de la cara
      const cara = dx ? (dx > 0 ? p.x0 + p.ancho : p.x0) : (dy > 0 ? p.y0 + p.alto : p.y0);
      const a0 = dx ? p.y0 : p.x0, a1 = dx ? p.y0 + p.alto : p.x0 + p.ancho;
      const medio = (a0 + a1) / 2;

      // Lo primero que hay enfrente: el rack mas cercano que comparte tramo con la cara, o el muro
      let libre = dx ? rayoMuro(cara, medio, dx, dy, poly) : rayoMuro(medio, cara, dx, dy, poly);
      let vecino = null, t0 = a0, t1 = a1;
      racks.forEach((o) => {
        if (o.id === r.id) return;
        const q = rects.get(o.id);
        const b0 = Math.max(a0, dx ? q.y0 : q.x0), b1 = Math.min(a1, dx ? q.y0 + q.alto : q.x0 + q.ancho);
        if (b1 - b0 < 0.01) return;
        const gap = dx > 0 ? q.x0 - cara : dx < 0 ? cara - (q.x0 + q.ancho) : dy > 0 ? q.y0 - cara : cara - (q.y0 + q.alto);
        if (gap > -1e-6 && gap < libre) { libre = Math.max(0, gap); vecino = o; t0 = b0; t1 = b1; }
      });
      if (!Number.isFinite(libre) || libre < ESPALDA) return;

      const lejos = cara + (dx || dy) * libre;
      const [c0, c1] = [Math.min(cara, lejos), Math.max(cara, lejos)];
      const rect = dx ? { x0: c0, x1: c1, y0: t0, y1: t1 } : { x0: t0, x1: t1, y0: c0, y1: c1 };
      // Ancho útil: un pilar (u oficina, andén, zona) dentro del pasillo deja pasar solo por el lado más ancho
      // que queda; la grúa recorre el pasillo entero, así que manda el punto más angosto
      let util = libre, angosta = null;
      (bodega.elementos ?? []).forEach((e) => {
        if (!ANGOSTAN.includes(e.clase) || (e.clase === 'zona' && e.padre)) return;
        const q = rectElemento(e);
        const b0 = Math.max(t0, dx ? q.y0 : q.x0), b1 = Math.min(t1, dx ? q.y0 + q.alto : q.x0 + q.ancho);
        if (b1 - b0 < 0.01) return;
        const n0 = dx > 0 ? q.x0 - cara : dx < 0 ? cara - (q.x0 + q.ancho) : dy > 0 ? q.y0 - cara : cara - (q.y0 + q.alto);
        const n1 = n0 + (dx ? q.ancho : q.alto);
        if (n1 <= 0.01 || n0 >= libre - 0.01) return;   // detrás de la cara (dentro del rack) o más allá del pasillo
        const paso = Math.max(Math.max(0, n0), libre - Math.min(libre, n1));
        if (paso < util - 1e-6) { util = +paso.toFixed(3); angosta = { clase: e.clase, id: e.id ?? null, x: e.x, y: e.y, distancia: +Math.max(0, n0).toFixed(2) }; }
      });
      // El mismo pasillo visto desde los dos racks que lo comparten se junta en uno
      const clave = [rect.x0, rect.y0, rect.x1, rect.y1].map((v) => v.toFixed(2)).join();
      const minimo = pasilloRequerido(r, bodega);
      const previo = porClave.get(clave);
      if (previo) {
        previo.racks.push(r.id);
        previo.minimo = Math.max(previo.minimo, minimo);
        previo.ok = previo.libre >= previo.minimo - 1e-6;
        return;
      }
      // libre = ancho útil (con lo que angosta); libreGeom = de la cara al vecino o al muro (el rectángulo dibujado)
      porClave.set(clave, {
        id: `${r.id}-${lado}`, ...rect, eje: dx ? 'x' : 'y', libre: util, libreGeom: libre, angosta, minimo, ok: util >= minimo - 1e-6,
        racks: [r.id], vecino: vecino?.id ?? null,
      });
    });
  });
  return [...porClave.values()];
}

/** Pasillo que contiene el punto (x, y), o null */
export function pasilloEn(lista, x, y) {
  const e = 0.01;
  return lista.find((p) => x >= p.x0 - e && x <= p.x1 + e && y >= p.y0 - e && y <= p.y1 + e) ?? null;
}

/**
 * Franja de pasillo propiamente tal: el ancho que pide el equipo (o lo libre, si es menos) pegado a
 * la cara de carga. Lo que sobra hasta el muro es area libre, no pasillo.
 * Devuelve { x0, y0, x1, y1, libreSobrante } (m).
 */
export function franjaPasillo(p) {
  const geo = p.libreGeom ?? p.libre;
  const ancho = Math.min(geo, p.minimo);
  const sobra = Math.max(0, geo - ancho);
  if (sobra < 0.01 || p.vecino) return { x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1, libreSobrante: 0 };
  // Lado de la cara que lo genera (id `${rack}-${lado}`): la franja queda pegada a ella
  const lado = p.id.slice(p.id.lastIndexOf('-') + 1);
  const r = { x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1, libreSobrante: sobra };
  if (lado === 'abajo') r.y1 = p.y0 + ancho;
  else if (lado === 'arriba') r.y0 = p.y1 - ancho;
  else if (lado === 'derecha') r.x1 = p.x0 + ancho;
  else r.x0 = p.x1 - ancho;
  return r;
}
