// Pasillos del planificador: se calculan solos a partir de los racks (no se dibujan a mano).
// Un pasillo es el espacio libre frente a una cara de carga de un rack, hasta el rack vecino o el
// muro. Las caras de carga son el frente del rack y, si es doble, tambien la de atras; los
// costados (entre racks de una misma fila) y las espaldas no son pasillo.
// Avisos, plano 2D, llenado automatico y fila paralela usan esta misma lista.
import { GRUAS, DISTANCIAS } from './parametrosTecnicos.js';
import { rectangulo, contorno, rayoMuro } from './planificador.js';

// Menos que esto entre una cara y el vecino o el muro no es pasillo: el rack esta apoyado ahi
const ESPALDA = 0.5;

export const conGrua = (r) => r.tipo === 'RS' || r.tipo === 'DI';
export const gruaDe = (bodega) => GRUAS[bodega.grua] ?? GRUAS.contrapeso;

/** Ancho (m) que necesita el pasillo frente al rack: el de la grua, o el de una persona en angulo ranurado */
export function pasilloRequerido(r, bodega) {
  return conGrua(r) ? gruaDe(bodega).pasillo : DISTANCIAS.pasilloPersona.valor;
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
      porClave.set(clave, {
        id: `${r.id}-${lado}`, ...rect, eje: dx ? 'x' : 'y', libre, minimo, ok: libre >= minimo - 1e-6,
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
