// Pallets mezclados en rack selectivo: el cliente define sus tipos de pallet y asigna uno a cada altura.
// Sin Vue. Una "altura" es el piso (0) o un nivel de vigas (1..n).
import { medidasRack } from './planificador.js';

export const COLORES_PALLET = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#f97316', '#6366f1'];
export const ROTACION = { alta: { t: 'Rota harto', orden: 0 }, media: { t: 'Rota normal', orden: 1 }, baja: { t: 'Rota poco', orden: 2 } };

export function nuevoTipo(i, base = {}) {
  return { id: `t${Date.now().toString(36)}${i}`, nombre: `Pallet ${i + 1}`, alto: 1.2, peso: 800, cantidad: 0, rotacion: 'media', color: COLORES_PALLET[i % COLORES_PALLET.length], ...base };
}

const filas = (r) => (r.doble ? 2 : 1);
const posPorAltura = (r) => r.cuerpos * (r.porViga ?? 2) * filas(r);

/** Alto y color por altura de un rack según su mezcla y el catálogo */
export function resolverMezcla(r, tipos) {
  const n = r.niveles + 1, porId = new Map(tipos.map((t) => [t.id, t]));
  const mezcla = Array.from({ length: n }, (_, i) => r.mezcla?.[i] ?? null);
  // Un tipo sin pallet (cajas directas) o con carga que sobresale pide plano de carga en ese nivel
  const planosAuto = mezcla.map((id, i) => {
    const t = porId.get(id);
    return i > 0 && t && (t.sinPallet || (t.sobresale ?? 0) > 0) ? (r.planos?.[i] || 'malla') : (r.planos?.[i] ?? null);
  });
  return {
    mezcla,
    planos: planosAuto,
    altos: mezcla.map((id) => porId.get(id)?.alto ?? null),
    colores: mezcla.map((id) => porId.get(id)?.color ?? null),
  };
}

/** Posiciones ubicadas por tipo (y sin asignar) en todos los selectivos */
export function ubicados(racks, tipos) {
  const out = Object.fromEntries(tipos.map((t) => [t.id, 0]));
  let libres = 0;
  racks.filter((r) => r.tipo === 'RS').forEach((r) => {
    for (let i = 0; i <= r.niveles; i++) {
      const id = r.mezcla?.[i];
      if (id && id in out) out[id] += posPorAltura(r); else libres += posPorAltura(r);
    }
  });
  return { porTipo: out, libres };
}

/**
 * Acomoda los tipos en las alturas de todos los selectivos (la misma plantilla por índice de altura):
 * lo que rota harto va a las alturas más accesibles (piso y nivel 1); lo alto y lento, arriba;
 * si arriba se pasa del techo, el pallet alto baja al piso.
 */
export function acomodar(racks, tipos, alturaLibre) {
  const rs = racks.filter((r) => r.tipo === 'RS');
  if (!rs.length || !tipos.length) return racks;
  const maxAlturas = Math.max(...rs.map((r) => r.niveles + 1));
  // Posiciones que da cada índice de altura sumando todos los racks que lo tienen
  const cap = Array.from({ length: maxAlturas }, (_, i) => rs.filter((r) => r.niveles + 1 > i).reduce((t, r) => t + posPorAltura(r), 0));
  // Accesibilidad: piso y nivel 1 primero, luego hacia arriba
  const orden = [...Array(maxAlturas).keys()];
  const prioridad = [...tipos].sort((a, b) => (ROTACION[a.rotacion].orden - ROTACION[b.rotacion].orden) || (a.alto - b.alto));
  const pendiente = new Map(prioridad.map((t) => [t.id, Math.max(0, t.cantidad || 0)]));
  const plantilla = Array(maxAlturas).fill(null);
  for (const i of orden) {
    const t = prioridad.find((x) => pendiente.get(x.id) > 0);
    if (!t) break;
    plantilla[i] = t.id;
    pendiente.set(t.id, pendiente.get(t.id) - cap[i]);
  }
  // Alturas sin asignar: el tipo con más cantidad (para no dejar niveles vacíos)
  const masPedido = [...tipos].sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0))[0];
  for (let i = 0; i < maxAlturas; i++) if (!plantilla[i]) plantilla[i] = masPedido.id;

  return racks.map((r) => {
    if (r.tipo !== 'RS') return r;
    let mezcla = plantilla.slice(0, r.niveles + 1);
    // El último nivel del rack recibe lo alto y lento si la plantilla lo dejó en un índice que este rack no tiene
    if (alturaLibre > 0) {
      const porId = new Map(tipos.map((t) => [t.id, t]));
      const prueba = { ...r, mezcla, ...resolverMezcla({ ...r, mezcla }, tipos) };
      if (medidasRack(prueba).alto > alturaLibre - 0.5) {
        // Pasa el más alto al piso
        const iMax = mezcla.reduce((m, id, i) => ((porId.get(id)?.alto ?? 0) > (porId.get(mezcla[m])?.alto ?? 0) ? i : m), 0);
        mezcla = [...mezcla];
        [mezcla[0], mezcla[iMax]] = [mezcla[iMax], mezcla[0]];
      }
    }
    return { ...r, mezcla, ...resolverMezcla({ ...r, mezcla }, tipos) };
  });
}
