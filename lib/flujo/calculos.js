// Calculos del flujo "Planifica tu bodega": del modelo de rack que arma el cliente (paso 3) a sus
// medidas y cuantos cuerpos necesita, y de los modelos a racks ubicados en la bodega (paso 5).
// Sin Vue. Medidas en m y kg; valores provisorios en lib/rack3d/parametrosTecnicos.js.
import { medidasRack, normalizar, contorno, caja } from '../rack3d/planificador.js';
import { capacidad, huella } from '../rack3d/medidas.js';
import { resolverMezcla, ROTACION } from '../rack3d/mezcla.js';
import { CAPACIDADES, DISTANCIAS, GRUAS } from '../rack3d/parametrosTecnicos.js';
import { pasilloRequerido } from '../rack3d/pasillos.js';
import { libre, alturaUltimoNivel } from '../rack3d/operacion.js';
import { armarBandeja } from '../tour/pallet.js';

export const MAX_CUERPOS_FILA = 10;   // filas de hasta 10 cuerpos (PROVISORIO, §7)

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
export function rackDeModelo(modelo, { pallets = [], cuerpos = 1 } = {}) {
  const { id: _id, nombre: _n, cantidades: _c, ...campos } = modelo;
  let r = { ...campos, id: 'plantilla', modelo: modelo.id, cuerpos, x: 0, y: 0, rot: 0 };
  if (modelo.tipo === 'DI') {
    // Drive-in: un solo tipo de pallet por bloque (el que mas se pide)
    const t = tiposDe(modelo, pallets)[0] ?? pallets[0];
    if (t) Object.assign(r, { palletFrente: t.frente, palletFondo: t.fondo, palletAlto: t.alto, kgPallet: t.peso });
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
  return normalizar(r);
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

/**
 * Resultado de un modelo para la tarjeta del paso 3:
 * { m, porCuerpo, unidad, total, cuerpos, modulos, capacidad, carga: { kg, capacidad, uso, color } | null,
 *   alto, ultimaViga, avisos }. cuerpos y porCuerpo segun conteoRack; capacidad = lo que guardan.
 */
export function resultadoModelo(modelo, { pallets = [], cajas = [], grua = 'contrapeso' } = {}) {
  const r = rackDeModelo(modelo, { pallets });
  const m = medidasRack(r);
  const avisos = [];
  if (modelo.tipo === 'AR') {
    const tipos = tiposDe(modelo, cajas);
    const bandejasCuerpo = capacidad(m).bandejas;
    const alturaEntre = m.nivelesY.length > 1 ? m.nivelesY[1] - m.nivelesY[0] : 0.4;
    // Cajas por bandeja de cada tipo (la bandeja de 1,2 m lleva proporcionalmente mas)
    const porTipo = tipos.map((c) => {
      const b = armarBandeja({ fondo: m.fondo, caja: c, pesoCaja: c.peso, apilable: c.apilable, altoEntreNiveles: alturaEntre });
      const factor = m.frente / 0.92;
      return { c, cajas: Math.max(0, Math.floor(b.cajas * factor)), kg: b.peso * factor };
    });
    const total = tipos.reduce((t, c) => t + (modelo.cantidades[c.id] ?? 0), 0);
    const bandejas = porTipo.reduce((t, x) => t + (x.cajas > 0 ? Math.ceil((modelo.cantidades[x.c.id] ?? 0) / x.cajas) : 0), 0);
    porTipo.filter((x) => x.cajas === 0).forEach((x) => avisos.push(`"${x.c.nombre}" no cabe en una bandeja de ${Math.round(m.fondo * 1000)} mm con ${Math.round(alturaEntre * 100)} cm entre niveles.`));
    const kg = Math.max(0, ...porTipo.map((x) => x.kg));
    const cap = CAPACIDADES.bandejaAngulo.valor;
    const superior = m.nivelesY[m.nivelesY.length - 1];
    if (superior > 1.9) avisos.push(`La repisa más alta queda a ${superior.toFixed(2).replace('.', ',')} m: se alcanza con escalera.`);
    const k = cuerposPara(bandejas, bandejasCuerpo, m.doble ? 2 : 1);
    return {
      r, m, unidad: 'bandejas', ...k, capacidad: k.modulos * bandejasCuerpo, total, totalUnidad: 'cajas',
      carga: kg > 0 ? { kg, capacidad: cap, uso: kg / cap, color: color(kg / cap) } : null,
      alto: m.alto, ultimaViga: superior, avisos,
    };
  }

  const tipos = tiposDe(modelo, pallets);
  const total = tipos.reduce((t, x) => t + (modelo.cantidades[x.id] ?? 0), 0);
  const porId = new Map(pallets.map((t) => [t.id, t]));
  const g = GRUAS[grua] ?? GRUAS.contrapeso;
  if (modelo.tipo === 'DI') {
    const porCalle = m.fondos * (m.cartelasY.length + 1);
    const kg = Math.max(0, ...tipos.map((t) => t.peso || 0));
    const altos = new Set(tipos.map((t) => t.alto));
    if (altos.size > 1) avisos.push('En drive-in cada bloque lleva un solo alto de pallet: separa los tipos en otro modelo.');
    const cap = CAPACIDADES.driveInPallet.valor;
    const ultima = m.cartelasY[m.cartelasY.length - 1] ?? 0;
    if (ultima > g.levante) avisos.push(`El último nivel queda a ${fm(ultima)} m y tu equipo llega a ~${fm(g.levante)} m.`);
    const calles = Math.max(1, Math.ceil(total / porCalle));
    return {
      r, m, unidad: 'pallets', porCuerpo: porCalle, cuerpos: calles, modulos: calles, capacidad: calles * porCalle, total, totalUnidad: 'pallets',
      carga: kg > 0 ? { kg, capacidad: cap, uso: kg / cap, color: color(kg / cap) } : null,
      alto: m.alto, ultimaViga: ultima, avisos,
    };
  }

  // Selectivo
  const porModulo = capacidad(m).pallets;
  const k = cuerposPara(total, porModulo, m.doble ? 2 : 1);
  const kg = Math.max(0, ...(r.mezcla ?? []).slice(1).map((id) => (porId.get(id)?.peso || 0) * m.palletsPorViga));
  const cap = CAPACIDADES.selectivoParVigas.valor;
  const ultima = alturaUltimoNivel(r);
  if (ultima > g.levante) avisos.push(`La última viga queda a ${fm(ultima)} m y tu equipo llega a ~${fm(g.levante)} m.`);
  return {
    r, m, unidad: 'pallets', ...k, capacidad: k.modulos * porModulo, total, totalUnidad: 'pallets',
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
export function nivelesMaximos(modelo, { pallets = [], altura = null, grua = 'contrapeso' } = {}) {
  const g = GRUAS[grua] ?? GRUAS.contrapeso;
  const tope = { RS: 8, DI: 5, AR: 10 }[modelo.tipo];
  const minimo = modelo.tipo === 'AR' ? 2 : 1;
  for (let n = tope; n >= minimo; n--) {
    const r = rackDeModelo({ ...modelo, niveles: n, mezcla: modelo.mezcla?.length === n + 1 ? modelo.mezcla : [] }, { pallets });
    const m = medidasRack(r);
    const punta = m.altoConCarga ?? m.alto;
    if (altura > 0 && punta + DISTANCIAS.holguraTecho.valor > altura + 1e-6) continue;
    if (modelo.tipo !== 'AR' && alturaUltimoNivel(r) > g.levante + 1e-6) continue;
    return n;
  }
  return minimo;
}

/**
 * Ubica los modelos en la bodega: filas a lo ancho (x), de arriba abajo, cada una con los cuerpos que
 * pide su modelo (en tramos de hasta MAX_CUERPOS_FILA) y toda cara de carga frente a un pasillo:
 * - doble: pasillo arriba y abajo; drive-in: pasillo arriba (se carga por el frente);
 * - simple: de espalda al muro o a otra simple, mirando al pasillo.
 * Los pasillos de grua dibujados se respetan: uno horizontal sirve de pasillo de carga (las filas le
 * dan el frente) y uno vertical corta las filas (pasillo de cruce).
 * cuerposPorModelo: { [modeloId]: n }. Devuelve { racks, faltan: { [modeloId]: n } }.
 */
export function ubicarModelos(bodega, modelos, cuerposPorModelo, { pallets = [], nuevoId, existentes = [] } = {}) {
  const c = caja(contorno(bodega)), m0 = DISTANCIAS.rackMuro.valor;
  const fin = c.y1 - m0 + 1e-6;
  const racks = [...existentes];
  const faltan = {};
  let y = c.y0 + m0;
  let pasilloArriba = false;   // ya hay un pasillo justo encima de y (lo dejo la fila anterior)
  // Pasillos de grua dibujados a lo ancho (bandas en y), de arriba abajo
  const bandas = (bodega.elementos ?? []).filter((e) => e.clase === 'pasilloGrua' && e.ancho >= e.alto)
    .map((e) => ({ y0: e.y - e.alto / 2, y1: e.y + e.alto / 2 })).sort((a, b) => a.y0 - b.y0);

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
      const plantilla = { ...rackDeModelo(modelo, { pallets }), rot };
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

      // Tramos a lo ancho, esquivando pilares y zonas
      let x = c.x0 + m0, puestos = 0;
      while (resto > 0 && x < c.x1 - m0 - 0.5) {
        let puesto = null;
        for (let n = Math.min(MAX_CUERPOS_FILA, resto); n >= 1 && !puesto; n--) {
          const r = normalizar({ ...plantilla, id: nuevoId(), cuerpos: n, x: 0, y: 0 });
          const h = huella(medidasRack(r));
          const ancho = h.largo;
          const cand = { ...r, x: +(x + ancho / 2).toFixed(2), y: +(y0 + fondo / 2).toFixed(2) };
          if (libre(cand, racks, bodega)) puesto = { r: cand, ancho, n };
        }
        if (puesto) { racks.push(puesto.r); x += puesto.ancho + 0.3; resto -= puesto.n; puestos++; } else x += 0.5;
      }
      if (!puestos) break;
      y = usaBanda ? banda.y1 + 0.01 : y0 + fondo + (conPasilloAbajo ? P : 0.1);
      pasilloArriba = conPasilloAbajo;
    }
    if (resto > 0) faltan[modelo.id] = resto;
  }
  return { racks: racks.slice(existentes.length), faltan };
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
    const filas = mo.tipo !== 'DI' && mo.doble ? 2 : 1;
    const c = conteoTotal(rs);
    const cap = { p: c.posiciones, b: c.bandejas };
    const cuerpos = rs.reduce((t, r) => t + r.cuerpos, 0);   // modulos (calles en drive-in)
    const lineas = [];
    if (mo.tipo === 'RS') {
      lineas.push(`${c.cuerpos} cuerpos en ${rs.length} ${rs.length === 1 ? 'fila' : 'filas'}${filas === 2 ? ' dobles (espalda con espalda)' : ''}`);
      lineas.push(`${c.marcos} marcos de ${mm(m.alto)} de alto × ${mm(m.fondo)} de fondo`);
      lineas.push(`${c.paresVigas} pares de vigas ${m.vigaModelo} de ${mm(m.viga)}`);
      lineas.push(`${m.nivelesY.length} niveles + piso · ${m.palletsPorViga} pallets por nivel`);
      if (m.tunel) lineas.push(`Cuerpo túnel con paso libre de ${mm(m.tunel.altoLibre)}`);
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
export function repetirBloque(r, { largo = 1, profundidad = 1, espalda = false }, racks, bodega, nuevoId) {
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
    const lista = [...racks], nuevos = [];
    let omitidos = 0;
    for (let k = 0; k < profundidad; k++) {
      for (let i = 0; i < largo; i++) {
        if (!i && !k) continue;
        const dx = i * (h.largo + 0.05), dy = s * fila(k);
        // Espalda con espalda: la fila impar se gira 180 grados
        const rot = dobleEspalda && k % 2 ? (r.rot + 180) % 360 : r.rot;
        const n = { ...r, id: nuevoId(), rot, x: +(r.x + ux.x * dx + uy.x * dy).toFixed(2), y: +(r.y + ux.y * dx + uy.y * dy).toFixed(2) };
        if (libre(n, lista, bodega)) { lista.push(n); nuevos.push(n); } else omitidos++;
      }
    }
    if (!mejor || nuevos.length > mejor.nuevos.length) mejor = { nuevos, omitidos };
  }
  return mejor;
}
