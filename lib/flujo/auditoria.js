// Auditoría de KPI logísticos: ¿el dibujo cumple con lo que el cliente dijo de sus pallets y cantidades?
// Se recalcula desde las medidas del cliente (no desde lo que el motor ya decidió) para detectar
// incoherencias entre el paso 2, el paso 3, el plano y lo que se cotiza. Sin Vue ni three.
// Devuelve [{ id, grupo, titulo, pide, dibujo, ok, nivel: 'ok' | 'falla' | 'aviso' }].
import { medidasRack, formatoM } from '../rack3d/planificador.js';
import { RACK, GRUAS } from '../rack3d/parametrosTecnicos.js';
import { revisarDiseno } from '../rack3d/viabilidad.js';
import { conteoTotal, queCotizar, cobertura } from './calculos.js';
import { vistasPorRol } from './perfiles.js';

const EPS = 1e-3;
const m = (v) => `${formatoM(v)} m`;
const mm = (v) => `${Math.round(v * 1000).toLocaleString('es-CL')} mm`;
const n = (v) => Math.round(v).toLocaleString('es-CL');
const fila = (id, grupo, titulo, pide, dibujo, ok, aviso = false) => ({ id, grupo, titulo, pide, dibujo, ok, nivel: ok ? 'ok' : aviso ? 'aviso' : 'falla' });

// Productos (pallets) que guarda un modelo
const delModelo = (mo, pallets) => pallets.filter((t) => (mo.cantidades?.[t.id] ?? 0) > 0);

// Alturas (0 = piso) donde va un tipo de pallet en un selectivo: las de su mezcla o todas
function alturasDe(r, t, niveles) {
  if (Array.isArray(r.mezcla) && r.mezcla.some(Boolean)) return r.mezcla.map((id, i) => (id === t.id ? i : -1)).filter((i) => i >= 0);
  return Array.from({ length: niveles + 1 }, (_, i) => i);
}

function auditarSelectivo(mo, r, pallets, bodega, out) {
  const md = medidasRack(r);
  const H = RACK.holguraViga.valor, LUZ = RACK.luzVigas.valor, VOL = RACK.voladizoPallet.valor;
  const techo = Number(bodega.altura) > 0 ? Number(bodega.altura) : null;
  const libreTecho = 0.5;
  delModelo(mo, pallets).forEach((t) => {
    const g = `${mo.nombre} · ${t.nombre}`;
    // Frente: n pallets + (n + 1) holguras de 100 mm dentro de la viga (de eje a eje de pilar)
    const pideViga = md.palletsPorViga * t.frente + (md.palletsPorViga + 1) * H;
    out.push(fila(`frente:${mo.id}:${t.id}`, g, 'Frente del pallet en la viga',
      `${md.palletsPorViga} × ${m(t.frente)} + ${md.palletsPorViga + 1} holguras de 100 mm = ${m(pideViga)}`,
      `viga de ${m(md.viga)}`, pideViga <= md.viga + EPS));
    // Fondo: el marco es 200 mm más corto que el pallet (sobresale 100 mm por lado, ni más ni menos)
    const vol = (t.fondo - md.fondo) / 2;
    out.push(fila(`fondo:${mo.id}:${t.id}`, g, 'Fondo del pallet sobre el marco',
      `pallet de ${m(t.fondo)}: marco de ${mm(t.fondo - 2 * VOL)}`,
      `marco de ${mm(md.fondo)} (sobresale ${mm(Math.max(0, vol))} por lado)`, vol >= -EPS && vol <= VOL + EPS));
    // Alto: en cada altura donde va, cabe con 100 mm libres bajo la viga de arriba; arriba, 500 mm bajo el techo
    const alturas = alturasDe(r, t, md.nivelesY.length);
    const malas = [];
    alturas.forEach((i) => {
      if (i < md.nivelesY.length) {
        if (t.alto + LUZ > md.luzLibre[i] + EPS) malas.push(i === 0 ? 'piso' : `nivel ${i}`);
      } else if (techo) {
        const yv = md.nivelesY[i - 1] + md.altoViga / 2;
        if (yv + t.alto + libreTecho > techo + EPS) malas.push(`nivel ${i} (techo)`);
      }
    });
    const minLibre = Math.min(...alturas.filter((i) => i < md.nivelesY.length).map((i) => md.luzLibre[i]), Infinity);
    out.push(fila(`alto:${mo.id}:${t.id}`, g, 'Alto del pallet entre vigas',
      `${m(t.alto)} + 100 mm libres`,
      malas.length ? `no cabe en ${malas.join(', ')}` : `cabe (espacio mínimo ${Number.isFinite(minLibre) ? m(minLibre) : '—'})`, !malas.length));
    // Peso por par de vigas (el perfil lo elige el motor con el pallet más pesado del modelo)
    const kg = md.palletsPorViga * (t.peso || 0);
    if (kg > 0) {
      out.push(fila(`peso:${mo.id}:${t.id}`, g, 'Peso por par de vigas',
        `${md.palletsPorViga} × ${n(t.peso)} kg = ${n(kg)} kg`,
        `viga ${md.vigaModelo} elegida para ${n(md.kgPallet)} kg por pallet`, (t.peso || 0) <= md.kgPallet + EPS));
    }
  });
}

function auditarDriveIn(mo, r, pallets, out) {
  const md = medidasRack(r);
  const tipos = delModelo(mo, pallets);
  tipos.forEach((t) => {
    const g = `${mo.nombre} · ${t.nombre}`;
    // Calle: el pallet del bloque (un solo alto y medida por bloque)
    out.push(fila(`calle:${mo.id}:${t.id}`, g, 'Frente del pallet en la calle',
      `${m(t.frente)} + 75 mm por lado`, `calle de ${m(md.anchoCalle)}`, t.frente + 0.15 + 0.1 <= md.anchoCalle + EPS));
    out.push(fila(`dimismo:${mo.id}:${t.id}`, g, 'Mismo pallet que el bloque',
      `${m(t.frente)} × ${m(t.fondo)} × ${m(t.alto)}`, `${m(md.pallet.frente)} × ${m(md.pallet.fondo)} × ${m(md.pallet.alto)}`,
      Math.abs(t.frente - md.pallet.frente) < EPS && Math.abs(t.fondo - md.pallet.fondo) < EPS && t.alto <= md.pallet.alto + EPS, true));
  });
}

/**
 * Auditoría del diseño completo (proyecto del store o equivalente).
 * { filas, cumple, total, fallas, avisos }
 */
export function auditarDiseno(p) {
  const out = [];
  const nuevos = p.racks.filter((r) => !r.existente);
  const grua = GRUAS[p.bodega.grua] ?? GRUAS.contrapeso;

  // ─── Medidas: cada producto en su rack ───
  p.modelos.forEach((mo) => {
    const r = nuevos.find((x) => x.modelo === mo.id);
    if (!r) return;
    if (mo.tipo === 'RS') auditarSelectivo(mo, r, p.pallets, p.bodega, out);
    else if (mo.tipo === 'DI') auditarDriveIn(mo, r, p.pallets, out);
  });

  // ─── Cantidades: lo dibujado guarda lo que necesita, total y por producto ───
  const cob = cobertura({ racks: p.racks, modelos: p.modelos, pallets: p.pallets, cajas: p.cajas, grua: p.bodega.grua });
  cob.productos.forEach((x) => out.push(fila(`cant:${x.id}`, 'Cantidades', `Posiciones para ${x.nombre}`,
    `${n(x.necesita)} pallets`, `${n(x.posiciones)} posiciones${x.falta ? ` (faltan ${n(x.falta)})` : ''}`, x.ok)));
  cob.modelos.filter((x) => x.tipo === 'AR').forEach((x) => out.push(fila(`cantAR:${x.id}`, 'Cantidades', `Bandejas de ${x.nombre}`,
    `${n(x.necesita)} bandejas`, `${n(x.posiciones)} bandejas`, x.posiciones >= x.necesita)));
  const total = conteoTotal(nuevos);
  const necesidad = p.pallets.reduce((t, x) => t + (x.cantidad || 0), 0);
  if (necesidad > 0 && nuevos.some((r) => r.tipo !== 'AR')) {
    out.push(fila('cant:total', 'Cantidades', 'Total de posiciones', `${n(necesidad)} pallets`, `${n(total.posiciones)} posiciones`, total.posiciones >= necesidad));
  }

  // ─── Una sola cuenta: lo que se dibuja es lo que se cotiza ───
  const cot = queCotizar(p.modelos, p.racks);
  // Pallets en posiciones y cajas en bandejas: se compara cada unidad que exista en el plano
  [['posiciones', 'posiciones'], ['bandejas', 'bandejas']].forEach(([k, u]) => {
    const enCot = cot.reduce((t, q) => t + (q[k] || 0), 0);
    if (!total[k] && !enCot) return;
    out.push(fila(`cuenta:${k}`, 'Coherencia', 'Plano = lo que se cotiza', `${n(total[k])} ${u} en el plano`, `${n(enCot)} en "Qué cotizar"`, Math.abs(enCot - total[k]) < 0.5));
  });

  // ─── Operación: pasillos y alcance del equipo ───
  const bo = vistasPorRol(p).bodega;
  if (bo.pasillos.n) {
    // Solo ángulo ranurado: se pasa a mano o con carro (el pasillo lo pide cada rack, no la grúa)
    const soloAR = nuevos.length && nuevos.every((r) => r.tipo === 'AR');
    out.push(fila('pasillos', 'Operación', 'Ancho de pasillos', soloAR ? 'a mano o con carro (mín. 1,2 m)' : `${m(grua.pasillo)} (${grua.nombre.toLowerCase()})`,
      `mínimo ${m(bo.pasillos.minimo)}`, !bo.pasillos.angostos));
  }
  if (bo.nivelMax > 0) {
    out.push(fila('levante', 'Operación', 'Alcance del equipo', `nivel más alto ${m(bo.nivelMax)}`, `levanta ${m(grua.levante)}`, bo.alcanza));
  }
  // Lo que el motor de viabilidad bloquea por carga, techo o marco también es una falla de KPI
  const malas = revisarDiseno({ bodega: p.bodega, racks: p.racks, pallets: p.pallets, accesorios: p.accesorios })
    .filter((a) => a.nivel === 'bloquea' && ['carga', 'marco', 'techo', 'levante', 'altoDriveIn', 'gruaDriveIn', 'bandeja'].includes(a.regla));
  malas.forEach((a) => out.push(fila(`motor:${a.id}`, 'Operación', 'Revisión técnica', a.comoArreglar || '—', a.mensaje, false)));

  const fallas = out.filter((x) => x.nivel === 'falla').length;
  const avisos = out.filter((x) => x.nivel === 'aviso').length;
  return { filas: out, total: out.length, cumple: out.length - fallas - avisos, fallas, avisos };
}
