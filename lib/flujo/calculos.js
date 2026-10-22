// Calculos del flujo "Planifica tu bodega": del modelo de rack que arma el cliente (paso 3) a sus
// medidas y cuantos cuerpos necesita, y de los modelos a racks ubicados en la bodega (paso 5).
// Sin Vue. Medidas en m y kg; valores provisorios en lib/rack3d/parametrosTecnicos.js.
import { medidasRack, normalizar, contorno, caja, rectangulo, rectElemento, rackDentro, ELEMENTOS, conflictos } from '../rack3d/planificador.js';
import { capacidad, huella, ANRA_FRENTES, ANRA_FONDOS, ANRA_NIVELES } from '../rack3d/medidas.js';
import { resolverMezcla, ROTACION } from '../rack3d/mezcla.js';
import { CAPACIDADES, DISTANCIAS, GRUAS, equipoDe } from '../rack3d/parametrosTecnicos.js';
import { pasilloRequerido } from '../rack3d/pasillos.js';
import { libre, alturaUltimoNivel, tramosEnFila, MIN_CUERPOS_TRAMO } from '../rack3d/operacion.js';
import { cargasRack, CAPACIDAD_MARCO_KG, pesoSobreGrua } from '../rack3d/viabilidad.js';


const suma = (o) => Object.values(o || {}).reduce((t, v) => t + (Number(v) || 0), 0);

// Tipos del catalogo que lleva el modelo (cantidad > 0), del que mas se pide al que menos
function tiposDe(modelo, catalogo) {
  return catalogo.filter((t) => (modelo.cantidades?.[t.id] ?? 0) > 0)
    .sort((a, b) => (modelo.cantidades[b.id] ?? 0) - (modelo.cantidades[a.id] ?? 0));
}

/**
 * Mezcla por defecto (selectivo): lo que rota harto abajo, lo alto y lento arriba, repartido segun
 * cuantos pallets de cada tipo hay. Si el modelo ya trae una mezcla valida se respeta.
 */
export function mezclaPorDefecto(modelo, pallets) {
  const n = modelo.niveles + 1;
  const tipos = tiposDe(modelo, pallets);
  const valida = (modelo.mezcla ?? []).length === n && modelo.mezcla.every((id) => !id || pallets.some((t) => t.id === id));
  if (valida && modelo.mezcla.some(Boolean)) return modelo.mezcla;
  if (!tipos.length) return Array(n).fill(pallets[0]?.id ?? null);
  const orden = [...tipos].sort((a, b) => (ROTACION[a.rotacion]?.orden ?? 1) - (ROTACION[b.rotacion]?.orden ?? 1) || a.alto - b.alto);
  const total = suma(modelo.cantidades) || 1;
  // Alturas por tipo en proporcion a su cantidad (al menos una cada uno, si alcanzan)
  const cupos = orden.map((t) => Math.max(1, Math.round(((modelo.cantidades[t.id] ?? 0) / total) * n)));
  while (cupos.reduce((x, v) => x + v, 0) > n) cupos[cupos.indexOf(Math.max(...cupos))]--;
  while (cupos.reduce((x, v) => x + v, 0) < n) cupos[0]++;
  const mezcla = orden.flatMap((t, i) => Array(Math.max(0, cupos[i])).fill(t.id));
  return mezcla;
}

/** Rack (sin posicion) con todo lo del modelo resuelto: altos y colores por nivel, pallet del cliente */
// Altura entre repisas segun la caja mas alta del modelo: camas de cajas + 4 cm de bandeja + 8 cm para la mano
export function altoEntreRepisas(modelo, cajas = []) {
  const tipos = tiposDe(modelo, cajas);
  if (!tipos.length) return null;
  const camas = Math.max(1, Math.round(modelo.camasRepisa || 1));
  return +(Math.max(...tipos.map((c) => c.alto * Math.min(camas, c.apilable || 1))) + 0.04 + 0.08).toFixed(3);
}

export function rackDeModelo(modelo, { pallets = [], cajas = [], cuerpos = 1, grua } = {}) {
  const { id: _id, nombre: _n, cantidades: _c, ...campos } = modelo;
  let r = { ...campos, id: 'plantilla', modelo: modelo.id, cuerpos, x: 0, y: 0, rot: 0 };
  if (modelo.tipo === 'DI') {
    // Drive-in: un solo tipo de pallet por bloque (el que mas se pide)
    const t = tiposDe(modelo, pallets)[0] ?? pallets[0];
    if (t) Object.assign(r, { palletFrente: t.frente, palletFondo: t.fondo, palletAlto: t.alto, kgPallet: t.peso });
    if (grua) r.grua = grua;   // el primer carril sale de la grua que entra a la calle
  }
  if (modelo.tipo === 'RS') {
    const tipos = tiposDe(modelo, pallets);
    const mezcla = mezclaPorDefecto(modelo, pallets);
    // El frente y fondo del pallet mas grande del modelo mandan en viga y marco
    const ref = tipos.length ? tipos : pallets.slice(0, 1);
    if (ref.length) {
      r.palletFrente = Math.max(...ref.map((t) => t.frente || 1));
      r.palletFondo = Math.max(...ref.map((t) => t.fondo || 1.2));
      r.palletAlto = Math.max(...ref.map((t) => t.alto || 1.2));
      // El mas pesado manda en el perfil de viga (seleccion del motor)
      r.kgPallet = Math.max(...ref.map((t) => t.peso || 0)) || 800;
    }
    r = { ...r, mezcla, ...resolverMezcla({ ...r, mezcla }, pallets) };
  }
  if (modelo.tipo === 'AR' && !(modelo.altoEntre > 0)) r.altoEntre = altoEntreRepisas(modelo, cajas);
  return normalizar(r);
}

/**
 * Racks del plano al dia con su modelo: cada copia ubicada se rearma desde el modelo y los pallets actuales
 * (la misma funcion que dibuja el paso 3), conservando solo lo que es del plano: id, posicion, giro y cuerpos.
 * Asi el alto de marco, las vigas y la carga son los mismos en los pasos 3, 5, 6, 7, PDF y Kommo.
 * Devuelve { racks, huellaCambio } (huellaCambio: algun rack cambio de largo o fondo en planta).
 */
export function racksAlDia(racks, modelos, { pallets = [], cajas = [], grua } = {}) {
  let huellaCambio = false;
  const lista = racks.map((r) => {
    const mo = !r.existente && modelos.find((m) => m.id === r.modelo);
    if (!mo) return r;
    const base = rackDeModelo(mo, { pallets, cajas, cuerpos: r.cuerpos, grua: r.tipo === 'DI' ? grua ?? r.grua : grua });
    // Tunel propio del rack (elegido en el plano, paso 5, en `tunelRack`): pisa el del modelo
    const propio = r.tunelPropio ? { tunelPropio: true, tunelRack: r.tunelRack ?? null, tunel: r.tunelRack ?? null } : {};
    const nuevo = normalizar({ ...base, id: r.id, x: r.x, y: r.y, rot: r.rot, cuerpos: r.cuerpos, ...propio, ...dobleDe(r, mo) });
    const a = huella(medidasRack(r)), b = huella(medidasRack(nuevo));
    if (Math.abs(a.largo - b.largo) > 1e-3 || Math.abs(a.fondo - b.fondo) > 1e-3) huellaCambio = true;
    return nuevo;
  });
  return { racks: lista, huellaCambio };
}

// Simple o doble lo decide el cliente por lineal (paso 5, `dobleLineal`); el del modelo es solo el de partida
function dobleDe(r, mo) {
  return mo.tipo !== 'DI' && typeof r.dobleLineal === 'boolean' ? { doble: r.dobleLineal, dobleLineal: r.dobleLineal } : {};
}

/**
 * Mismo lineal en simple o doble, con la espalda en el mismo lugar (el lado que crece es el de carga). Un
 * simple con rot 180 tiene la espalda arriba; con rot 0, abajo; 90, a la izquierda; 270, a la derecha.
 */
export function conDoble(r, doble) {
  if (r.tipo === 'DI' || !!r.doble === doble) return { ...r, dobleLineal: doble };
  const q = rectangulo(r);
  const n = normalizar({ ...r, doble, dobleLineal: doble });
  const qn = rectangulo(n);
  const rot = ((r.rot % 360) + 360) % 360;
  const pos = rot === 0 ? { y: +(q.y0 + q.alto - qn.alto / 2).toFixed(3) }
    : rot === 180 ? { y: +(q.y0 + qn.alto / 2).toFixed(3) }
    : rot === 90 ? { x: +(q.x0 + qn.ancho / 2).toFixed(3) }
    : { x: +(q.x0 + q.ancho - qn.ancho / 2).toFixed(3) };
  return { ...n, ...pos };
}

// ─── Una sola forma de contar (pasos 3, 5, 6 y cotizacion) ───
// Cuerpo = un vano entre dos marcos, de un lado. Un selectivo doble de 7 modulos son 14 cuerpos.
// En drive-in el cuerpo es la calle. `modulos` es lo que lleva el rack del plano en `cuerpos`.

/** Conteo de un rack ubicado: { cuerpos, marcos, paresVigas, posiciones, bandejas } */
export function conteoRack(r) {
  const m = medidasRack(r), c = capacidad(m);
  if (m.tipo === 'drivein') return { cuerpos: m.calles, marcos: 0, paresVigas: 0, posiciones: c.pallets, bandejas: 0 };
  const filas = m.doble ? 2 : 1;
  const quitadas = m.tunel ? m.tunel.quitadas - 1 : 0;   // en el tunel faltan vigas (el piso no tiene)
  return {
    cuerpos: m.cuerpos * filas,
    marcos: (m.cuerpos + 1) * filas,
    paresVigas: m.tipo === 'selectivo' ? (m.cuerpos * m.nivelesY.length - Math.max(0, quitadas)) * filas : 0,
    posiciones: c.pallets,
    bandejas: c.bandejas,
  };
}

/** Suma de conteoRack de varios racks */
export function conteoTotal(racks) {
  return racks.reduce((t, r) => {
    const c = conteoRack(r);
    Object.keys(t).forEach((k) => { t[k] += c[k]; });
    return t;
  }, { cuerpos: 0, marcos: 0, paresVigas: 0, posiciones: 0, bandejas: 0 });
}

// De lo que hay que guardar a cuerpos: un doble se arma de a pares (un modulo = un cuerpo por lado)
function cuerposPara(unidades, porModulo, filas) {
  const porCuerpo = porModulo / filas;
  if (!(porCuerpo > 0)) return { porCuerpo: 0, cuerpos: filas, modulos: 1 };
  const modulos = Math.max(1, Math.ceil(unidades / porModulo));
  return { porCuerpo, cuerpos: modulos * filas, modulos };
}

// ─── Angulo ranurado: como se acomodan las cajas en la bandeja ───
// Cuantas de `lado` caben en `largo` (con margen de redondeo: 0,92 / 0,46 = 1,9999…)
const caben = (largo, lado) => (lado > 0 ? Math.floor(largo / lado + 1e-6) : 0);

/**
 * Cajas en una bandeja de angulo ranurado: la mejor de las dos orientaciones (la caja va parada, como
 * viene), apiladas hasta lo que aguanta la caja y lo que cabe entre repisas (5 cm para la mano y el
 * perfil), sin pasar de 250 kg por bandeja. altoEntre: de centro a centro de bandeja (m).
 * Devuelve { cols, filas, camas, cajas, kg, largoEnFrente, limite: 'apilable'|'altura'|'peso'|null }
 */
export function bandejaCajas({ frente = 0.92, fondo = 0.4, altoEntre = 0.4, caja, largoEnFrente }) {
  const vacia = { cols: 0, filas: 0, camas: 0, cajas: 0, kg: 0, largoEnFrente: true, limite: null };
  if (!caja || !(caja.largo > 0 && caja.ancho > 0 && caja.alto > 0)) return vacia;
  const ops = [
    { cols: caben(frente, caja.largo), filas: caben(fondo, caja.ancho), largoEnFrente: true },
    { cols: caben(frente, caja.ancho), filas: caben(fondo, caja.largo), largoEnFrente: false },
  ];
  const o = largoEnFrente === true ? ops[0] : largoEnFrente === false ? ops[1] : (ops[1].cols * ops[1].filas > ops[0].cols * ops[0].filas ? ops[1] : ops[0]);
  const porCama = o.cols * o.filas;
  if (!porCama) return { ...vacia, largoEnFrente: o.largoEnFrente };
  const apilable = Math.max(1, Math.round(caja.apilable || 1));
  const porAltura = caben(altoEntre - 0.05, caja.alto);
  let camas = Math.max(0, Math.min(apilable, porAltura));
  let limite = camas === apilable ? 'apilable' : 'altura';
  let cajas = porCama * camas;
  const tope = CAPACIDADES.bandejaAngulo.valor, peso = Number(caja.peso) || 0;
  if (peso > 0 && cajas * peso > tope + 1e-6) {
    // Se quitan camas enteras; si ni una cama entra, la cama va incompleta
    const camasPeso = Math.floor(tope / (porCama * peso) + 1e-9);
    cajas = camasPeso >= 1 ? porCama * camasPeso : Math.floor(tope / peso + 1e-9);
    camas = Math.max(cajas > 0 ? 1 : 0, Math.min(camas, camasPeso));
    limite = 'peso';
  }
  return { cols: o.cols, filas: o.filas, camas, cajas, kg: cajas * peso, largoEnFrente: o.largoEnFrente, limite };
}

// Firma de lo que guarda un angulo ranurado (cajas y cantidades): si cambia, se vuelve a proponer la bandeja
export function firmaCajasAR(modelo, cajas = []) {
  return tiposDe(modelo, cajas).map((c) => [c.id, c.largo, c.ancho, c.alto, c.peso, c.apilable, modelo.cantidades[c.id]].join(':')).join('|');
}

/**
 * La bandeja que guarda las cajas del modelo en menos piso: prueba frente (900/920), fondo
 * (300/400/460/600), cajas apiladas (hasta lo que aguanta la caja) y repisas (2 a 8, sin pasar de 3 m
 * ni del techo). Piso = cuerpos × frente × (fondo + medio pasillo de 1,2 m). A igual piso, menos cuerpos
 * y luego la estanteria mas baja. Devuelve { bandeja, frente, niveles, camasRepisa, cuerpos, m2, porBandeja } o null.
 */
export function mejorBandeja(modelo, { cajas = [], altura = null } = {}) {
  const tipos = tiposDe(modelo, cajas);
  if (!tipos.length) return null;
  const pasillo = DISTANCIAS.pasilloPersona?.valor ?? 1.2;
  const maxCamas = Math.max(1, Math.min(8, ...tipos.map((c) => Math.round(c.apilable || 1))));
  let mejor = null;
  for (const frente of ANRA_FRENTES) for (const bandeja of ANRA_FONDOS) for (let camas = 1; camas <= maxCamas; camas++) {
    for (let niveles = ANRA_NIVELES.min; niveles <= ANRA_NIVELES.max; niveles++) {
      const cand = { ...modelo, frente, bandeja, camasRepisa: camas, niveles, altoEntre: null };
      const res = resultadoModelo(cand, { cajas });
      if (res.m.excedeAlto) break;   // mas repisas tampoco caben
      if (altura > 0 && res.m.alto + DISTANCIAS.holguraTecho.valor > altura + 1e-6) break;
      if (!(res.principal?.cajas > 0) || res.porTipo.some((x) => !(x.cajas > 0))) continue;
      const filas = res.m.doble ? 2 : 1;
      const m2 = res.modulos * res.m.frenteExt * (res.m.fondoExt * filas + pasillo / 2 * filas);
      const p = { bandeja, frente, niveles, camasRepisa: camas, cuerpos: res.cuerpos, m2, alto: res.m.alto, porBandeja: res.principal.cajas };
      const gana = !mejor || p.m2 < mejor.m2 - 1e-6
        || (Math.abs(p.m2 - mejor.m2) <= 1e-6 && (p.cuerpos < mejor.cuerpos || (p.cuerpos === mejor.cuerpos && p.alto < mejor.alto - 1e-6)));
      if (gana) mejor = p;
    }
  }
  return mejor;
}

/**
 * Resultado de un modelo para la tarjeta del paso 3:
 * { m, porCuerpo, unidad, total, cuerpos, modulos, capacidad, carga: { kg, capacidad, uso, color } | null,
 *   alto, ultimaViga, avisos }. cuerpos y porCuerpo segun conteoRack; capacidad = lo que guardan.
 */
// Factor de ocupacion (prompt v3 §6): nadie llena el 100 % de sus posiciones. Lo que se pide se divide por el
// factor (100 pallets al 80 % = 125 posiciones). Va de 60 a 85 %; en las funciones el defecto es 1 (sin holgura)
export const OCUPACION = { min: 0.6, max: 0.85, defecto: 0.8 };
export const conOcupacion = (unidades, ocupacion = 1) => Math.ceil(unidades / Math.min(1, Math.max(OCUPACION.min, ocupacion || 1)) - 1e-9);

export function resultadoModelo(modelo, { pallets = [], cajas = [], grua = 'contrapeso', gruaDatos = {}, ocupacion = 1 } = {}) {
  const r = rackDeModelo(modelo, { pallets, cajas, grua });
  const m = medidasRack(r);
  const avisos = [];
  if (modelo.tipo === 'AR') {
    const tipos = tiposDe(modelo, cajas);
    const bandejasCuerpo = capacidad(m).bandejas;
    const alturaEntre = m.nivelesY.length > 1 ? m.nivelesY[1] - m.nivelesY[0] : 0.4;
    // Cajas por bandeja de cada tipo, con el frente y fondo reales de la bandeja y el tope de 250 kg
    const porTipo = tipos.map((c) => ({ c, ...bandejaCajas({ frente: m.frente, fondo: m.fondo, altoEntre: alturaEntre, caja: c }) }));
    const total = tipos.reduce((t, c) => t + (modelo.cantidades[c.id] ?? 0), 0);
    const bandejas = porTipo.reduce((t, x) => t + (x.cajas > 0 ? Math.ceil((modelo.cantidades[x.c.id] ?? 0) / x.cajas) : 0), 0);
    porTipo.filter((x) => x.cajas === 0).forEach((x) => avisos.push(`"${x.c.nombre}" no cabe en una bandeja de ${Math.round(m.frente * 1000)} × ${Math.round(m.fondo * 1000)} mm con ${Math.round(alturaEntre * 100)} cm entre repisas.`));
    porTipo.filter((x) => x.limite === 'peso').forEach((x) => avisos.push(`"${x.c.nombre}": van ${x.cajas} por bandeja para no pasar de ${CAPACIDADES.bandejaAngulo.valor} kg.`));
    const kg = Math.max(0, ...porTipo.map((x) => x.kg));
    const cap = CAPACIDADES.bandejaAngulo.valor;
    const superior = m.nivelesY[m.nivelesY.length - 1];
    if (superior > 1.9) avisos.push(`La repisa más alta queda a ${superior.toFixed(2).replace('.', ',')} m: se alcanza con escalera.`);
    const k = cuerposPara(conOcupacion(bandejas, ocupacion), bandejasCuerpo, m.doble ? 2 : 1);
    // Cajas que guarda: las bandejas de cada tipo llenas y las que sobran con el tipo principal
    const capacidadBandejas = k.modulos * bandejasCuerpo;
    const principal = porTipo[0] ?? null;
    const capacidadCajas = porTipo.reduce((t, x) => t + (x.cajas > 0 ? Math.ceil((modelo.cantidades[x.c.id] ?? 0) / x.cajas) * x.cajas : 0), 0)
      + Math.max(0, capacidadBandejas - bandejas) * (principal?.cajas ?? 0);
    return {
      r, m, unidad: 'bandejas', ...k, capacidad: capacidadBandejas, total, totalUnidad: 'cajas',
      bandejas, porTipo, principal, capacidadCajas,
      carga: kg > 0 ? { kg, capacidad: cap, uso: kg / cap, color: color(kg / cap) } : null,
      alto: m.alto, ultimaViga: superior, avisos,
    };
  }

  const tipos = tiposDe(modelo, pallets);
  const total = tipos.reduce((t, x) => t + (modelo.cantidades[x.id] ?? 0), 0);
  const porId = new Map(pallets.map((t) => [t.id, t]));
  const g = equipoDe({ grua, ...gruaDatos });
  // Niveles con un pallet mas pesado de lo que la grua levanta a esa altura (capacidad residual)
  const sobrePeso = modelo.tipo === 'AR' ? [] : pesoSobreGrua(r, { grua, ...gruaDatos }, pallets);
  if (sobrePeso.length) {
    const x = sobrePeso[sobrePeso.length - 1];
    avisos.push(`A ${fm(x.altura)} m tu equipo levanta ~${Math.round(x.puede).toLocaleString('es-CL')} kg y el pallet pesa ${Math.round(x.kg).toLocaleString('es-CL')} kg: deja los pesados abajo o baja un nivel.`);
  }
  if (modelo.tipo === 'DI') {
    const porCalle = m.fondos * (m.cartelasY.length + 1);
    const kg = Math.max(0, ...tipos.map((t) => t.peso || 0));
    const altos = new Set(tipos.map((t) => t.alto));
    if (altos.size > 1) avisos.push('En drive-in cada bloque lleva un solo alto de pallet: separa los tipos en otro modelo.');
    const cap = CAPACIDADES.driveInPallet.valor;
    const ultima = m.cartelasY[m.cartelasY.length - 1] ?? 0;
    if (ultima > g.levante) avisos.push(`El último nivel queda a ${fm(ultima)} m y tu equipo llega a ~${fm(g.levante)} m.`);
    const calles = Math.max(1, Math.ceil(conOcupacion(total, ocupacion) / porCalle));
    return {
      r, m, unidad: 'pallets', porCuerpo: porCalle, cuerpos: calles, modulos: calles, capacidad: calles * porCalle, total, totalUnidad: 'pallets',
      carga: kg > 0 ? { kg, capacidad: cap, uso: kg / cap, color: color(kg / cap) } : null,
      alto: m.alto, ultimaViga: ultima, avisos,
    };
  }

  // Selectivo
  const porModulo = capacidad(m).pallets;
  const k = cuerposPara(conOcupacion(total, ocupacion), porModulo, m.doble ? 2 : 1);
  const kg = Math.max(0, ...(r.mezcla ?? []).slice(1).map((id) => (porId.get(id)?.peso || 0) * m.palletsPorViga));
  const cap = CAPACIDADES.selectivoParVigas.valor;
  const ultima = alturaUltimoNivel(r);
  if (ultima > g.levante) avisos.push(`La última viga queda a ${fm(ultima)} m y tu equipo llega a ~${fm(g.levante)} m.`);
  // Carga por marco: la misma cuenta que la revision (un marco interior recibe un vano completo)
  const km = cargasRack({ ...r, cuerpos: Math.max(2, r.cuerpos) }, {}, pallets).marco;
  const cargaMarco = km > 0 ? { kg: km, capacidad: CAPACIDAD_MARCO_KG, uso: km / CAPACIDAD_MARCO_KG, color: color(km / CAPACIDAD_MARCO_KG) } : null;
  return {
    r, m, unidad: 'pallets', ...k, capacidad: k.modulos * porModulo, total, totalUnidad: 'pallets', cargaMarco,
    carga: kg > 0 ? { kg, capacidad: cap, uso: kg / cap, color: color(kg / cap) } : null,
    alto: m.altoConCarga ?? m.alto, ultimaViga: ultima, avisos,
  };
}

const color = (uso) => (uso <= 0.8 ? 'verde' : uso <= 1 ? 'amarillo' : 'rojo');
const fm = (v) => v.toFixed(2).replace('.', ',');

/**
 * Niveles que caben en el modelo bajo el techo (con la holgura) y lo que alcanza el equipo.
 * Devuelve el maximo de niveles posible (para que los controles no ofrezcan valores inviables).
 */
export function nivelesMaximos(modelo, { pallets = [], altura = null, grua = 'contrapeso', gruaDatos = {} } = {}) {
  // La grua del cliente (placa) si la dio: levante y kg; si no, la tipica
  const bod = { grua, ...gruaDatos };
  const g = equipoDe(bod);
  const tope = { RS: 8, DI: 5, AR: 8 }[modelo.tipo];
  const minimo = modelo.tipo === 'AR' ? 2 : 1;
  for (let n = tope; n >= minimo; n--) {
    const r = rackDeModelo({ ...modelo, niveles: n, mezcla: modelo.mezcla?.length === n + 1 ? modelo.mezcla : [] }, { pallets, grua });
    const m = medidasRack(r);
    const punta = m.altoConCarga ?? m.alto;
    if (m.excedeAlto) continue;   // angulo ranurado: esas repisas con esa caja pasan de 3 m
    if (altura > 0 && punta + DISTANCIAS.holguraTecho.valor > altura + 1e-6) continue;
    if (modelo.tipo !== 'AR' && alturaUltimoNivel(r) > g.levante + 1e-6) continue;
    // La grua levanta menos mientras mas sube: ningun nivel con un pallet mas pesado que lo que levanta ahi
    if (modelo.tipo !== 'AR' && pesoSobreGrua(r, bod, pallets).length) continue;
    return n;
  }
  return minimo;
}

/**
 * Ubica los modelos en la bodega: filas a lo ancho (x), de arriba abajo, cada una con los cuerpos que
 * pide su modelo (filas continuas, cortadas solo por obstaculos) y toda cara de carga frente a un pasillo:
 * - doble: pasillo arriba y abajo; drive-in: pasillo arriba (se carga por el frente);
 * - simple: de espalda al muro o a otra simple, mirando al pasillo.
 * Los pasillos de grua dibujados se respetan: uno horizontal sirve de pasillo de carga (las filas le
 * dan el frente) y uno vertical corta las filas (pasillo de cruce).
 * cuerposPorModelo: { [modeloId]: n }. Devuelve { racks, faltan: { [modeloId]: n }, cortos: [id de tramos
 * de 1 o 2 cuerpos que se pusieron porque el espacio no daba para mas] }.
 */
export function ubicarModelos(bodega, modelos, cuerposPorModelo, opciones = {}) {
  // Ubicacion logica: las filas parten desde el muro con portones o andenes (lo guardado queda cerca del
  // despacho). Se espeja la bodega para que ese muro quede arriba, se ubica y se devuelve a su lugar
  const espejo = muroDeAccesos(bodega);
  if (!espejo) return ubicarDesdeArriba(bodega, modelos, cuerposPorModelo, opciones);
  const c = caja(contorno(bodega));
  const f = espejo === 'y'
    ? (q) => ({ ...q, y: +(c.y0 + c.y1 - q.y).toFixed(4) })
    : (q) => ({ ...q, x: +(c.x0 + c.x1 - q.x).toFixed(4) });
  const giro = espejo === 'y' ? { 0: 180, 180: 0, 90: 90, 270: 270 } : { 0: 0, 180: 180, 90: 270, 270: 90 };
  const rack = (r) => ({ ...f(r), rot: giro[r.rot] ?? r.rot });
  const espejada = { ...bodega, forma: bodega.forma ? bodega.forma.map(f) : null, elementos: (bodega.elementos ?? []).map(f) };
  const u = ubicarDesdeArriba(espejada, modelos, cuerposPorModelo, { ...opciones, existentes: (opciones.existentes ?? []).map(rack) });
  return { ...u, racks: u.racks.map(rack) };
}

// Muro con mas portones y andenes: 'y' si es el de abajo, 'x' si es el de la derecha (arriba e izquierda
// ya son donde parte el layout); null sin accesos
function muroDeAccesos(bodega) {
  const accesos = (bodega.elementos ?? []).filter((e) => e.clase === 'porton' || e.clase === 'anden');
  if (!accesos.length) return null;
  const cuenta = {};
  accesos.forEach((e) => { const m = muroDe(bodega, e).muro; cuenta[m] = (cuenta[m] ?? 0) + 1; });
  const muro = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0][0];
  return muro === 'abajo' ? 'y' : muro === 'derecha' ? 'x' : null;
}

function ubicarDesdeArriba(bodegaReal, modelos, cuerposPorModelo, { pallets = [], cajas = [], nuevoId, existentes = [], cabecera: conCabecera = true } = {}) {
  // Lo que el cliente ya tiene lleva su pasillo de grua delante y detras: se reserva como zona para que lo
  // nuevo no quede pegado a sus caras de carga
  const reservas = existentes.map((r, i) => {
    const q = rectangulo(r), P = pasilloRequerido({ tipo: r.tipo }, bodegaReal), lado = r.rot === 90 || r.rot === 270;
    const ancho = q.ancho + (lado ? 2 * P : 0), alto = q.alto + (lado ? 0 : 2 * P);
    return { id: `_reserva${i}`, clase: 'zona', x: q.x0 + q.ancho / 2, y: q.y0 + q.alto / 2, ancho, alto };
  });
  const bodega = reservas.length ? { ...bodegaReal, elementos: [...(bodegaReal.elementos ?? []), ...reservas] } : bodegaReal;
  const c = caja(contorno(bodega)), m0 = DISTANCIAS.rackMuro.valor;
  const fin = c.y1 - m0 + 1e-6;
  const racks = [...existentes];
  const faltan = {}, cortos = [];
  let y = c.y0 + m0;
  let pasilloArriba = false;   // ya hay un pasillo justo encima de y (lo dejo la fila anterior)
  // Pasillos de grua dibujados a lo ancho (bandas en y), de arriba abajo
  const bandas = (bodega.elementos ?? []).filter((e) => e.clase === 'pasilloGrua' && e.ancho >= e.alto)
    .map((e) => ({ y0: e.y - e.alto / 2, y1: e.y + e.alto / 2 })).sort((a, b) => a.y0 - b.y0);
  // El pasillo de cabecera va del lado de los portones y andenes (sin accesos: a la izquierda)
  const accesos = (bodegaReal.elementos ?? []).filter((e) => e.clase === 'porton' || e.clase === 'anden');
  const cabeceraIzq = !accesos.length || accesos.reduce((t, e) => t + e.x, 0) / accesos.length <= (c.x0 + c.x1) / 2;

  for (const modelo of modelos) {
    let resto = Math.max(0, Math.round(cuerposPorModelo[modelo.id] ?? 0));
    const P = pasilloRequerido({ tipo: modelo.tipo }, bodega) + 0.01;
    while (resto > 0) {
      const doble = modelo.tipo !== 'DI' && modelo.doble;
      const frenteArriba = modelo.tipo === 'DI';
      let rot = 0, y0 = y, conPasilloAbajo = false;
      if (doble || frenteArriba) {
        if (!pasilloArriba) y0 = y + P;   // abrir el pasillo de su frente
        conPasilloAbajo = doble;
      } else if (pasilloArriba) {
        rot = 0;                          // simple mirando al pasillo de arriba
      } else {
        rot = 180;                        // simple de espalda: mira hacia abajo y deja su pasillo
        conPasilloAbajo = true;
      }
      const plantilla = { ...rackDeModelo(modelo, { pallets, cajas, grua: bodega.grua }), rot };
      const fondo = huella(medidasRack(plantilla)).fondo;
      // Un pasillo de grua dibujado: la fila no lo pisa; si su pasillo de abajo cae en el, lo usa
      const banda = bandas.find((b) => b.y1 > y0 + 1e-6);
      if (banda && y0 + fondo > banda.y0 + 1e-6) {
        y = banda.y1 + 0.01;
        pasilloArriba = true;
        continue;
      }
      let usaBanda = false;
      if (banda && conPasilloAbajo && y0 + fondo + P > banda.y0) {
        y0 = Math.max(y0, banda.y0 - fondo);   // pegada al pasillo dibujado, mirandolo
        usaBanda = true;
      }
      // La fila cabe con su pasillo de abajo (si lo necesita)
      if (y0 + fondo + (conPasilloAbajo && !usaBanda ? P : 0) > fin) break;

      // La fila: el tramo mas largo hasta cada obstaculo, sin tramos sueltos de 1 o 2 cuerpos. Las filas de
      // un mismo modelo quedan del mismo largo: con la capacidad de esta fila se reparte lo que falta en
      // filas iguales (15 cuerpos en filas de 7 → 5 + 5 + 5, no 7 + 7 + 1)
      // Pasillo de cabecera: las filas no van de muro a muro; en el extremo más cercano al portón o andén
      // queda un pasillo transversal del ancho de la grúa, para que pueda entrar a todos los pasillos de carga
      const cabecera = conCabecera && (c.x1 - c.x0) - 2 * m0 - P >= MIN_CUERPOS_TRAMO * 2.4 ? P : 0;
      const x0 = c.x0 + m0 + (cabeceraIzq ? cabecera : 0), x1 = c.x1 - m0 - (cabeceraIzq ? 0 : cabecera);
      const fila = (yy, limite, minimo = MIN_CUERPOS_TRAMO) => tramosEnFila(plantilla, { y0: yy, x0, x1, racks, bodega, limite, minimo });
      // Si un pilar corta la fila, se prueba bajarla (el pasillo de arriba crece) hasta que el pilar caiga
      // en el pasillo: gana la posicion con mas cuerpos y, a igualdad, la que menos corre la fila
      let mejor = { y: y0, f: fila(y0, resto) };
      if (!usaBanda && (mejor.f.cortados || mejor.f.descartados || mejor.f.total < resto)) {
        const holgura = fin - (y0 + fondo + (conPasilloAbajo ? P : 0));
        for (let s = 0.25; s <= Math.min(P, holgura) + 1e-6; s += 0.25) {
          const f = fila(+(y0 + s).toFixed(2), resto);
          if (f.total > mejor.f.total || (f.total === mejor.f.total && f.cortados < mejor.f.cortados)) mejor = { y: +(y0 + s).toFixed(2), f };
        }
      }
      y0 = mejor.y;
      const capacidadFila = mejor.f.total;
      let puestos = 0;
      if (capacidadFila > 0) {
        const filasQueFaltan = Math.ceil(resto / capacidadFila);
        const objetivo = Math.ceil(resto / filasQueFaltan);
        const f = fila(y0, objetivo, Math.min(MIN_CUERPOS_TRAMO, objetivo));
        f.tramos.forEach((r) => { racks.push({ ...r, id: nuevoId() }); });
        resto -= f.total; puestos = f.tramos.length;
      } else {
        // El espacio solo da para tramos de 1 o 2 cuerpos: se ponen y se avisa
        const f = fila(y0, resto, 1);
        f.tramos.forEach((r) => { racks.push({ ...r, id: nuevoId() }); cortos.push(r.id); });
        resto -= f.total; puestos = f.tramos.length;
        if (!puestos) { y = +(y + 0.5).toFixed(2); continue; }
      }
      if (!puestos) break;
      y = usaBanda ? banda.y1 + 0.01 : y0 + fondo + (conPasilloAbajo ? P : 0.1);
      pasilloArriba = conPasilloAbajo;
    }
    if (resto > 0) faltan[modelo.id] = resto;
  }
  return { racks: racks.slice(existentes.length), faltan, cortos };
}

/**
 * Que cotizar (lo nuevo, no lo que el cliente ya tiene), por modelo:
 * [{ modelo, nombre, tipo, filas, lineas: ['18 cuerpos de 2,3 m', '…'], posiciones, bandejas }]
 */
export function queCotizar(modelos, racks) {
  const mm = (v) => `${Math.round(v * 1000).toLocaleString('es-CL')} mm`;
  return modelos.map((mo) => {
    const rs = racks.filter((r) => r.modelo === mo.id && !r.existente);
    if (!rs.length) return null;
    const ms = rs.map((r) => medidasRack(r));
    const m = ms[0];
    const c = conteoTotal(rs);
    const cap = { p: c.posiciones, b: c.bandejas };
    const cuerpos = rs.reduce((t, r) => t + r.cuerpos, 0);   // modulos (calles en drive-in)
    const lineas = [];
    if (mo.tipo === 'RS') {
      const dobles = rs.filter((r) => r.doble).length, simples = rs.length - dobles;
      const tipoFilas = dobles && simples ? ` (${dobles} ${dobles === 1 ? 'doble' : 'dobles'}, ${simples} ${simples === 1 ? 'simple' : 'simples'})` : dobles ? ' dobles (espalda con espalda)' : '';
      lineas.push(`${c.cuerpos} cuerpos en ${rs.length} ${rs.length === 1 ? 'fila' : 'filas'}${tipoFilas}`);
      lineas.push(`${c.marcos} marcos de ${mm(m.alto)} de alto × ${mm(m.fondo)} de fondo`);
      lineas.push(`${c.paresVigas} pares de vigas ${m.vigaModelo} (perfil de ${Math.round(m.altoViga * 1000)} mm, ${mm(m.viga)} de largo)`);
      lineas.push(`${m.nivelesY.length} niveles + piso · ${m.palletsPorViga} pallets por nivel`);
      // Cuerpos tunel: cada rack puede tener el suyo (o el del modelo)
      const tuneles = ms.filter((x) => x.tunel);
      if (tuneles.length) {
        const pasos = [...new Set(tuneles.map((x) => x.tunel.altoLibre))].sort((a, b) => a - b).map(mm);
        lineas.push(`${tuneles.length} ${tuneles.length === 1 ? 'cuerpo túnel' : 'cuerpos túnel'} con paso libre de ${pasos.join(' / ')} (viga de túnel reforzada)`);
      }
    } else if (mo.tipo === 'DI') {
      lineas.push(`${cuerpos} calles de ${m.fondos} pallets de fondo en ${rs.length} ${rs.length === 1 ? 'bloque' : 'bloques'}`);
      lineas.push(`${m.cartelasY.length + 1} niveles · alto ${mm(m.alto)} · primer nivel a ${mm(m.primerNivel)}`);
      lineas.push(`Calle de ${mm(m.anchoCalle)} entre ejes`);
    } else {
      lineas.push(`${c.cuerpos} cuerpos de ángulo ranurado en ${rs.length} ${rs.length === 1 ? 'fila' : 'filas'}`);
      lineas.push(`${c.bandejas} bandejas de ${mm(m.frente)} × ${mm(m.fondo)} · alto ${mm(m.alto)}`);
    }
    return { modelo: mo.id, nombre: mo.nombre, tipo: mo.tipo, filas: rs.length, lineas, posiciones: cap.p, bandejas: cap.b };
  }).filter(Boolean);
}

/**
 * Repite un rack en bloque: `largo` copias seguidas a lo largo de la fila y `profundidad` filas
 * hacia el lado con espacio, separadas por el pasillo que pide su equipo. Con `espalda` (simple),
 * las filas van de a pares espalda con espalda y el pasillo entre cada par.
 * Solo agrega las copias que caben sin chocar. Devuelve { nuevos, omitidos }.
 */
// Por que no cabe un rack: 'muro', el nombre del elemento que pisa (pilar, pasillo de grua…) u 'otro rack'
export function motivoNoCabe(n, racks, bodega) {
  if (!rackDentro(n, bodega)) return 'muro';
  const p = rectangulo(n), e = 0.001;
  const toca = (q) => p.x0 < q.x0 + q.ancho - e && q.x0 < p.x0 + p.ancho - e && p.y0 < q.y0 + q.alto - e && q.y0 < p.y0 + p.alto - e;
  const el = (bodega.elementos ?? []).find((x) => toca(rectElemento(x)));
  if (el) return (ELEMENTOS[el.clase]?.nombre ?? 'zona').toLowerCase();
  if (racks.some((o) => o.id !== n.id && toca(rectangulo(o)))) return 'otro rack';
  return null;
}

/**
 * Vista previa de "Repetir en bloque": todas las copias (largo × profundidad, sin el original) con
 * { rack, ok, motivo }. Prueba hacia el frente y hacia atras y se queda con el lado donde caben mas.
 */
export function previaBloque(r, { largo = 1, profundidad = 1, espalda = false }, racks, bodega, nuevoId = () => '_p') {
  const h = huella(medidasRack(r));
  const lado = r.rot === 90 || r.rot === 270;
  // Ejes en planta: a lo largo de la fila y hacia el fondo
  const ux = lado ? { x: 0, y: 1 } : { x: 1, y: 0 }, uy = lado ? { x: 1, y: 0 } : { x: 0, y: 1 };
  const P = pasilloRequerido(r, bodega) + 0.01;
  const dobleEspalda = espalda && !r.doble && r.tipo !== 'DI';
  // Desplazamiento de la fila k hacia el fondo
  const fila = (k) => {
    if (!dobleEspalda) return k * (h.fondo + P);
    const pares = Math.floor(k / 2);
    return pares * (2 * h.fondo + 0.1 + P) + (k % 2) * (h.fondo + 0.1);
  };
  // Primero hacia el frente del rack (cada fila nueva deja el pasillo frente a la anterior)
  const alFrente = r.rot === 0 || r.rot === 270 ? -1 : 1;
  let mejor = null;
  for (const s of [alFrente, -alFrente]) {
    const lista = [...racks], copias = [];
    for (let k = 0; k < profundidad; k++) {
      for (let i = 0; i < largo; i++) {
        if (!i && !k) continue;
        const dx = i * (h.largo + 0.05), dy = s * fila(k);
        // Espalda con espalda: la fila impar se gira 180 grados
        const rot = dobleEspalda && k % 2 ? (r.rot + 180) % 360 : r.rot;
        const n = { ...r, id: nuevoId(), rot, x: +(r.x + ux.x * dx + uy.x * dy).toFixed(2), y: +(r.y + ux.y * dx + uy.y * dy).toFixed(2) };
        const ok = libre(n, lista, bodega);
        if (ok) lista.push(n);
        copias.push({ rack: n, ok, motivo: ok ? null : motivoNoCabe(n, lista, bodega) });
      }
    }
    const caben = copias.filter((c) => c.ok).length;
    if (!mejor || caben > mejor.caben) mejor = { copias, caben };
  }
  return mejor.copias;
}

export function repetirBloque(r, opciones, racks, bodega, nuevoId) {
  const copias = previaBloque(r, opciones, racks, bodega, nuevoId);
  return { nuevos: copias.filter((c) => c.ok).map((c) => c.rack), omitidos: copias.filter((c) => !c.ok).length, copias };
}

// "1 por muro y 2 por pasillo de grúa"
export function textoMotivos(copias) {
  const cuenta = new Map();
  copias.filter((c) => !c.ok).forEach((c) => cuenta.set(c.motivo, (cuenta.get(c.motivo) ?? 0) + 1));
  const partes = [...cuenta].map(([m, k]) => `${k} por ${m}`);
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes[0] ?? '';
}

/**
 * Copias de un pasillo (de grua o peatonal) en paralelo: `cantidad` en total (con el original), a
 * `separacion` m de eje a eje, hacia donde quepan. Cada copia { el, ok, motivo }: no puede salir de la bodega
 * ni pisar otro pasillo; los racks se reacomodan despues.
 */
export function previaPasillos(e, { cantidad = 2, separacion = 6 }, bodega, nuevoId = () => '_p') {
  const vertical = e.alto > e.ancho, c = caja(contorno(bodega));
  const ancho = Math.min(e.ancho, e.alto);
  const paso = Math.max(ancho + 0.3, separacion);
  const mejor = [-1, 1].map((s) => {
    const copias = [];
    for (let k = 1; k < cantidad; k++) {
      const el = { ...e, id: nuevoId(), aberturas: [], ...(vertical ? { x: +(e.x + s * k * paso).toFixed(2) } : { y: +(e.y + s * k * paso).toFixed(2) }) };
      const q = rectElemento(el);
      let motivo = null;
      if (q.x0 < c.x0 - 0.01 || q.y0 < c.y0 - 0.01 || q.x0 + q.ancho > c.x1 + 0.01 || q.y0 + q.alto > c.y1 + 0.01) motivo = 'muro';
      else {
        const otro = (bodega.elementos ?? []).find((o) => o.id !== e.id && ['pasilloGrua', 'pasilloPeatonal', 'oficina', 'anden'].includes(o.clase) && (() => {
          const r = rectElemento(o);
          return q.x0 < r.x0 + r.ancho - 0.01 && r.x0 < q.x0 + q.ancho - 0.01 && q.y0 < r.y0 + r.alto - 0.01 && r.y0 < q.y0 + q.alto - 0.01;
        })());
        if (otro) motivo = (ELEMENTOS[otro.clase]?.nombre ?? 'zona').toLowerCase();
      }
      copias.push({ el, ok: !motivo, motivo });
    }
    return copias;
  }).sort((a, b) => b.filter((x) => x.ok).length - a.filter((x) => x.ok).length)[0];
  return mejor;
}

/**
 * Cobertura de lo que hay en el plano contra lo que el cliente necesita guardar (paso 2):
 * - por modelo: cuerpos ubicados y necesarios, posiciones y lo que falta o sobra
 * - por producto (tipo de pallet): posiciones que tiene en los racks (segun el nivel que le toca en cada
 *   rack) contra los pallets que tiene, y cuantos cuerpos le faltan
 * Los racks que ya tiene (existente) no cuentan.
 */
export function cobertura({ racks = [], modelos = [], pallets = [], cajas = [], grua = 'contrapeso', ocupacion = 1 }) {
  const nuevos = racks.filter((r) => !r.existente);
  const tiene = Object.fromEntries(pallets.map((t) => [t.id, 0]));
  const porCuerpoDe = {};   // posiciones por cuerpo (un lado) de cada producto, del primer rack que lo lleva
  const porModelo = modelos.map((mo) => {
    const res = resultadoModelo(mo, { pallets, cajas, grua, ocupacion });
    const suyos = nuevos.filter((r) => r.modelo === mo.id);
    const c = conteoTotal(suyos);
    const ubicados = c.cuerpos, necesarios = res.cuerpos;
    const posiciones = mo.tipo === 'AR' ? c.bandejas : c.posiciones;
    // Posiciones necesarias = lo que pidio ÷ factor de ocupacion (en AR, las bandejas de los cuerpos necesarios)
    const necesita = mo.tipo === 'AR' ? res.modulos * (res.porCuerpo || 0) * (mo.doble ? 2 : 1) : conOcupacion(res.total, ocupacion);
    if (mo.tipo !== 'AR') {
      suyos.forEach((r) => {
        const m = medidasRack(r), filas = m.doble ? 2 : 1;
        if (m.tipo === 'selectivo' && Array.isArray(r.mezcla) && r.mezcla.some(Boolean)) {
          // Cada altura guarda su tipo de pallet (el piso tambien). Un cuerpo tunel pierde las de abajo: se
          // reparte la capacidad real del rack (conteoRack) en la misma proporcion
          const bruto = r.mezcla.filter((id) => id && id in tiene).length * m.palletsPorViga * filas * m.cuerpos;
          const escala = bruto ? Math.min(1, conteoRack(r).posiciones / bruto) : 1;
          r.mezcla.forEach((id, i) => {
            if (!id || !(id in tiene)) return;
            const n = m.palletsPorViga * filas * m.cuerpos * escala;
            tiene[id] += n;
            porCuerpoDe[id] = (porCuerpoDe[id] ?? 0) || m.palletsPorViga * r.mezcla.filter((x) => x === id).length;
            void i;
          });
        } else {
          // Drive-in o selectivo de un tipo: repartido segun lo que el modelo guarda de cada producto
          const ids = Object.entries(mo.cantidades ?? {}).filter(([k, v]) => v > 0 && k in tiene);
          const tot = ids.reduce((t, [, v]) => t + v, 0);
          const cap = conteoRack(r).posiciones;
          ids.forEach(([id, v]) => {
            tiene[id] += tot ? (cap * v) / tot : 0;
            porCuerpoDe[id] = porCuerpoDe[id] || (res.porCuerpo * v) / tot;
          });
        }
      });
    }
    // Sin racks de un producto en el plano: posiciones por cuerpo segun el modelo (para decir cuantos faltan)
    if (mo.tipo !== 'AR') {
      const mezcla = res.r.mezcla ?? [];
      Object.entries(mo.cantidades ?? {}).filter(([k, v]) => v > 0 && k in tiene && !porCuerpoDe[k]).forEach(([id, v]) => {
        porCuerpoDe[id] = mo.tipo === 'RS' && mezcla.some(Boolean) ? res.m.palletsPorViga * mezcla.filter((x) => x === id).length : (res.porCuerpo * v) / Math.max(1, res.total);
      });
    }
    return {
      id: mo.id, nombre: mo.nombre, tipo: mo.tipo, ubicados, necesarios, posiciones, necesita,
      unidad: mo.tipo === 'AR' ? 'bandejas' : 'posiciones', unidadCuerpo: mo.tipo === 'DI' ? 'calles' : 'cuerpos',
      // Cuerpos que sobran o faltan segun las posiciones reales (un tunel resta posiciones sin restar cuerpos)
      diferencia: (() => {
        const pc = res.porCuerpo || 0;
        if (!(pc > 0) || !ubicados || posiciones >= necesita) return ubicados - necesarios;
        return Math.min(ubicados - necesarios, -Math.ceil((necesita - posiciones) / pc - 1e-9));
      })(),
    };
  });
  const productos = pallets.filter((t) => (t.cantidad ?? 0) > 0 && modelos.some((mo) => mo.tipo !== 'AR' && (mo.cantidades?.[t.id] ?? 0) > 0)).map((t) => {
    const posiciones = Math.floor(tiene[t.id] + 1e-6);
    const necesita = conOcupacion(t.cantidad, ocupacion);
    const falta = Math.max(0, necesita - posiciones);
    const pc = porCuerpoDe[t.id] || 0;
    return { id: t.id, nombre: t.nombre, color: t.color, pallets: t.cantidad, necesita, posiciones, falta, faltanCuerpos: falta && pc ? Math.ceil(falta / pc) : falta ? null : 0, ok: falta === 0 };
  });
  return { modelos: porModelo, productos };
}

// ─── Elementos en un muro (portones y andenes) y su zona de maniobra ───
// Muro: 'arriba' | 'abajo' | 'izquierda' | 'derecha'. `dist` = desde la esquina de arriba o de la izquierda
// hasta el borde del elemento (m). ancho = a lo largo del muro; fondo = hacia adentro.
export function enMuro(bodega, { muro = 'abajo', dist = 1, ancho = 4, fondo = 0.6 }) {
  const c = caja(contorno(bodega));
  if (muro === 'arriba' || muro === 'abajo') {
    const y = muro === 'arriba' ? c.y0 + fondo / 2 : c.y1 - fondo / 2;
    return { x: +(c.x0 + dist + ancho / 2).toFixed(2), y: +y.toFixed(2), ancho, alto: fondo };
  }
  const x = muro === 'izquierda' ? c.x0 + fondo / 2 : c.x1 - fondo / 2;
  return { x: +x.toFixed(2), y: +(c.y0 + dist + ancho / 2).toFixed(2), ancho: fondo, alto: ancho };
}

/** Muro mas cercano a un elemento y su distancia a la esquina (para editarlo) */
export function muroDe(bodega, e) {
  const c = caja(contorno(bodega));
  const d = { arriba: e.y - e.alto / 2 - c.y0, abajo: c.y1 - (e.y + e.alto / 2), izquierda: e.x - e.ancho / 2 - c.x0, derecha: c.x1 - (e.x + e.ancho / 2) };
  const muro = e.muro ?? Object.entries(d).sort((a, b) => a[1] - b[1])[0][0];
  const horizontal = muro === 'arriba' || muro === 'abajo';
  return {
    muro,
    dist: +(horizontal ? e.x - e.ancho / 2 - c.x0 : e.y - e.alto / 2 - c.y0).toFixed(2),
    ancho: horizontal ? e.ancho : e.alto,
    fondo: horizontal ? e.alto : e.ancho,
  };
}

/** Zona libre de maniobra delante de un porton o anden (rectangulo hacia el interior), o null */
export function zonaManiobra(bodega, e) {
  const prof = Number(e.maniobra ?? (e.clase === 'anden' ? 4 : 3));
  if (!(prof > 0)) return null;
  const { muro } = muroDe(bodega, e);
  if (muro === 'abajo') return { x: e.x, y: e.y - e.alto / 2 - prof / 2, ancho: e.ancho, alto: prof };
  if (muro === 'arriba') return { x: e.x, y: e.y + e.alto / 2 + prof / 2, ancho: e.ancho, alto: prof };
  if (muro === 'izquierda') return { x: e.x + e.ancho / 2 + prof / 2, y: e.y, ancho: prof, alto: e.alto };
  return { x: e.x - e.ancho / 2 - prof / 2, y: e.y, ancho: prof, alto: e.alto };
}

/**
 * Elementos con las zonas de maniobra de portones y andenes al dia: cada zona es un elemento 'zona'
 * hijo (padre = id) que se regenera; asi racks, revision y 3D la respetan sin saber de ella
 */
export function conManiobras(bodega) {
  const base = (bodega.elementos ?? []).filter((e) => !e.padre);
  const zonas = base.filter((e) => e.clase === 'porton' || e.clase === 'anden').map((e) => {
    const z = zonaManiobra(bodega, e);
    return z && { id: `${e.id}-maniobra`, clase: 'zona', padre: e.id, nombre: e.clase === 'anden' ? 'Maniobra andén' : 'Maniobra portón', ...z };
  }).filter(Boolean);
  return [...base, ...zonas];
}

// ─── Rearmar el layout a gusto del cliente sin perder la cuenta de la demanda ───
// (paso 5: largo de una fila, partirla en dos y ubicar solo lo que falta)

/** Misma fila con `n` cuerpos (calles en drive-in), dejando fijo el extremo izquierdo (o el de arriba si esta de lado) */
export function conCuerpos(r, n) {
  const q = rectangulo(r);
  const nuevo = normalizar({ ...r, cuerpos: n });
  const q2 = rectangulo(nuevo);
  const lado = r.rot === 90 || r.rot === 270;
  return lado ? { ...nuevo, y: +(q.y0 + q2.alto / 2).toFixed(3) } : { ...nuevo, x: +(q.x0 + q2.ancho / 2).toFixed(3) };
}

/**
 * Parte una fila en dos tramos (el primero con `en` cuerpos) separados por `separacion` m (por defecto el
 * pasillo peatonal minimo), para abrir un paso o llevar un tramo a otro lugar. Devuelve [a, b]
 */
export function partirRack(r, nuevoId, { en = Math.floor(r.cuerpos / 2), separacion = DISTANCIAS.pasilloPersona.valor } = {}) {
  const k = Math.min(r.cuerpos - 1, Math.max(1, Math.round(en)));
  const lado = r.rot === 90 || r.rot === 270;
  const a = conCuerpos(r, k);
  const qa = rectangulo(a);
  const b0 = normalizar({ ...r, id: nuevoId(), cuerpos: r.cuerpos - k, tunel: null, tunelPropio: false, tunelRack: null });
  const qb = rectangulo(b0);
  // El segundo tramo parte despues del primero + la separacion (sin pasarse del largo original + separacion)
  const b = lado
    ? { ...b0, x: r.x, y: +(qa.y0 + qa.alto + separacion + qb.alto / 2).toFixed(3) }
    : { ...b0, y: r.y, x: +(qa.x0 + qa.ancho + separacion + qb.ancho / 2).toFixed(3) };
  return [a, b];
}

/**
 * Cuerpos que faltan por modelo para cubrir la demanda (segun cobertura) y como modulos para ubicarModelos
 * (un doble se ubica de a pares). { [modeloId]: { cuerpos, modulos } }
 */
export function faltantes({ racks = [], modelos = [], pallets = [], cajas = [], grua = 'contrapeso', ocupacion = 1 }) {
  const c = cobertura({ racks, modelos, pallets, cajas, grua, ocupacion });
  const out = {};
  c.modelos.forEach((m) => {
    if (m.diferencia >= 0) return;
    const mo = modelos.find((x) => x.id === m.id);
    const filas = mo && mo.tipo !== 'DI' && mo.doble ? 2 : 1;
    out[m.id] = { cuerpos: -m.diferencia, modulos: Math.ceil(-m.diferencia / filas) };
  });
  return out;
}

/**
 * Ubica solo lo que falta alrededor de lo que el cliente ya acomodo. Primero alarga sus filas (hacia
 * cualquiera de los dos extremos) mientras no choquen ni pisen su pasillo; lo que no cabe va en filas nuevas.
 * Devuelve { racks: filas nuevas, alargados: [racks cambiados], faltan }
 */
export function ubicarFaltantes(bodega, modelos, racks, opciones = {}) {
  const f = faltantes({ racks, modelos, pallets: opciones.pallets, cajas: opciones.cajas, grua: bodega.grua, ocupacion: opciones.ocupacion ?? bodega.ocupacion ?? 1 });
  // Lo que falta se lleva en cuerpos: alargar un lineal doble cubre 2 por modulo, uno simple 1
  const resto = Object.fromEntries(Object.entries(f).map(([id, x]) => [id, x.cuerpos]));
  let lista = racks.slice();
  const alargados = new Map();
  Object.keys(resto).forEach((id) => {
    lista.filter((r) => r.modelo === id && !r.existente).forEach((r0) => {
      let r = lista.find((x) => x.id === r0.id);
      while (resto[id] > 0) {
        // Un modulo mas, probando a la derecha (o abajo) y luego a la izquierda (o arriba)
        const mas = conCuerpos(r, r.cuerpos + 1), q = rectangulo(r), lado = r.rot === 90 || r.rot === 270;
        const qm = rectangulo(mas);
        const izq = lado ? { ...mas, y: +(q.y0 + q.alto - qm.alto / 2).toFixed(3) } : { ...mas, x: +(q.x0 + q.ancho - qm.ancho / 2).toFixed(3) };
        const prueba = [mas, izq].find((c) => {
          const otros = lista.map((x) => (x.id === r.id ? c : x));
          return rackDentro(c, bodega) && !conflictos(otros, bodega).has(c.id) && !invadePasillo(c, otros, bodega);
        });
        if (!prueba) break;
        lista = lista.map((x) => (x.id === r.id ? prueba : x));
        r = prueba; alargados.set(r.id, r); resto[id] -= r.tipo !== 'DI' && r.doble ? 2 : 1;
      }
    });
  });
  // Filas nuevas: en el simple o doble del modelo
  const mods = Object.fromEntries(Object.entries(resto).filter(([, v]) => v > 0).map(([id, v]) => {
    const mo = modelos.find((m) => m.id === id);
    return [id, Math.ceil(v / (mo && mo.tipo !== 'DI' && mo.doble ? 2 : 1))];
  }));
  if (!Object.keys(mods).length) return { racks: [], alargados: [...alargados.values()], faltan: {} };
  const conModelo = modelos.filter((m) => mods[m.id]);
  // Lo ya puesto entra como "existente" solo para reservar su lugar y su pasillo; se devuelve sin cambios
  const fijos = lista.map((r) => ({ ...r, existente: true }));
  return { ...ubicarModelos(bodega, conModelo, mods, { ...opciones, existentes: fijos }), alargados: [...alargados.values()] };
}

// Un rack alargado no puede quedar a menos de un pasillo de grua de la cara de carga de otro
function invadePasillo(c, racks, bodega) {
  const P = pasilloRequerido({ tipo: c.tipo }, bodega) - 0.01;
  const a = rectangulo(c);
  return racks.some((o) => {
    if (o.id === c.id) return false;
    const b = rectangulo(o);
    const dx = Math.max(0, b.x0 - (a.x0 + a.ancho), a.x0 - (b.x0 + b.ancho));
    const dy = Math.max(0, b.y0 - (a.y0 + a.alto), a.y0 - (b.y0 + b.alto));
    // Solo cuenta si se enfrentan (se solapan en el otro eje) y quedan mas cerca que el pasillo
    // De lado (rot 90/270) el pasillo corre en Y y las caras se enfrentan en X
    const lado = c.rot === 90 || c.rot === 270;
    const [frente, largo] = lado ? [dx, dy] : [dy, dx];
    return (largo === 0 && frente > 0 && frente < P) || (frente === 0 && largo > 0 && largo < 0.05);
  });
}
