// KPI logísticos por sistema, separando racks existentes (los que el cliente ya tiene) de los nuevos.
// Sin Vue. Selectividad = % de pallets a los que se llega sin mover otro (Frazelle, tabla 5.1).
import { medidasRack, rectangulo, NOMBRE } from './planificador.js';
import { capacidad } from './medidas.js';
import { CAPACIDADES } from './parametrosTecnicos.js';

const vacio = () => ({ racks: 0, posiciones: 0, bandejas: 0, piso: 0, cuerpos: 0, calles: 0, accesoDirecto: 0, kg: 0 });

function sumar(t, r) {
  const m = medidasRack(r), c = capacidad(m), p = rectangulo(r);
  t.racks += 1;
  t.posiciones += c.pallets;
  t.bandejas += c.bandejas;
  t.piso += p.ancho * p.alto;
  if (r.tipo === 'DI') {
    t.calles += m.calles;
    // Por calle y nivel solo se alcanza el pallet del frente
    t.accesoDirecto += m.calles * (m.cartelasY.length + 1);
  } else if (r.tipo === 'RS') {
    t.cuerpos += m.cuerpos * (m.doble ? 2 : 1);
    t.accesoDirecto += c.pallets;
  } else {
    t.cuerpos += m.cuerpos * (m.doble ? 2 : 1);
    t.kg += c.bandejas * CAPACIDADES.bandejaAngulo.valor;
  }
  return t;
}

/** { porSistema: { RS: { existente, nuevo, total }, ... }, global: { existente, nuevo, total } } */
export function kpisPorSistema(racks) {
  const porSistema = {};
  const global = { existente: vacio(), nuevo: vacio(), total: vacio() };
  for (const r of racks) {
    const s = (porSistema[r.tipo] ??= { nombre: NOMBRE[r.tipo], existente: vacio(), nuevo: vacio(), total: vacio() });
    const grupo = r.existente ? 'existente' : 'nuevo';
    sumar(s[grupo], r); sumar(s.total, r);
    sumar(global[grupo], r); sumar(global.total, r);
  }
  return { porSistema, global };
}

/** Indicadores derivados de un grupo */
export function derivados(g) {
  return {
    posicionesM2Piso: g.piso ? g.posiciones / g.piso : 0,
    selectividad: g.posiciones ? g.accesoDirecto / g.posiciones : null,
    palletsPorCalle: g.calles ? g.posiciones / g.calles : null,
  };
}
