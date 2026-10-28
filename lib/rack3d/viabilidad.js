// Motor de viabilidad del planificador (nada inviable): revisa el diseno completo en cada cambio y
// devuelve los avisos con el arreglo que la interfaz aplica con un boton. Sin Vue ni three.
// Lo que "bloquea" no deja cotizar. Valores PROVISORIOS (parametrosTecnicos.js, PROMPT-CLAUDE-CODE.md §7):
// los confirma Tecnica Racklog con NCh2369 y ANSI MH16.1.
import { GRUAS, DISTANCIAS, CAPACIDADES, equipoDe, capacidadEnAltura } from './parametrosTecnicos.js';
import {
  TIPOS, NOMBRE, medidasRack, rectangulo, contorno, rectElemento, conflictos, rackDentro, bloquea, HOLGURA_GRUA_DI, gruaDriveIn, pilarDentro,
} from './planificador.js';
import { pasillos, carasDeCarga, conGrua } from './pasillos.js';
import { alturaUltimoNivel } from './operacion.js';
import { proponerAccesorios, caraConPasillo, libreHacia, tipoEnAltura, numTexto, mmTexto } from './accesorios.js';

// PROVISORIO: capacidad de un marco (kg), hasta tener la tabla de perfiles de Racklog
export const CAPACIDAD_MARCO_KG = 12000;
// PROVISORIO: alto del equipo o persona que pasa bajo un cuerpo tunel (m)
export const ALTO_PASO_TUNEL = 2.2;
// PROVISORIO: alto de marco / fondo de marco en rack simple sin anclaje especial
export const ESBELTEZ_MAX = 6;
// Repisa superior de angulo ranurado alcanzable a mano sin escalera (m)
export const REPISA_SIN_ESCALERA = 1.9;
const SOBRANTE = { min: 0.3, max: 1.0 };
const PLANOS = ['malla', 'madera', 'metal'];
const e6 = 1e-6;
const m = (v) => `${numTexto(v)} m`;

// Equipo de la bodega; el apilador manual de referencia si GRUAS aun no lo trae
function equipo(bodega) {
  return equipoDe(bodega);
}

/**
 * Niveles cuyo pallet pesa mas de lo que la grua levanta a esa altura (capacidad residual).
 * [{ nivel, altura, kg, puede }] (vacio si todo se puede levantar)
 */
export function pesoSobreGrua(r, bodega, pallets) {
  if (!conGrua(r)) return [];
  const eq = equipo(bodega), md = medidasRack(r), out = [];
  const alturas = md.tipo === 'drivein' ? md.cartelasY : md.tipo === 'selectivo' ? md.nivelesY : [];
  alturas.forEach((y, k) => {
    // Altura de la carga en la mezcla: con viga a piso la carga k va sobre la viga k (no hay carga en el piso)
    const i = md.tipo === 'selectivo' && md.piso === false ? k : k + 1;
    const t = md.tipo === 'selectivo' ? tipoEnAltura(r, i, pallets) : null;
    const kg = md.tipo === 'drivein' ? (r.kgPallet || bodega.pesoPallet || 0) : (t && t.peso > 0 ? t.peso : bodega.pesoPallet > 0 ? bodega.pesoPallet : 0);
    const puede = capacidadEnAltura(eq, y);
    if (kg > 0 && y <= eq.levante + e6 && kg > puede + e6) out.push({ nivel: i, altura: y, kg, puede });
  });
  return out;
}

const nombreRack = (r, i) => r.nombre || `${NOMBRE[r.tipo] ?? 'Rack'} ${i + 1}`;
const punta = (r) => { const md = medidasRack(r); return md.altoConCarga ?? md.alto; };

// Rack con otros niveles: recorta mezcla, altos, colores y planos para que sigan calzando
function conNiveles(r, n) {
  const c = { niveles: n };
  ['mezcla', 'altos', 'colores', 'planos'].forEach((k) => { if (Array.isArray(r[k])) c[k] = r[k].slice(0, n + 1); });
  return c;
}

// Kg que carga cada par de vigas (por altura 1..n) y el marco mas cargado de un selectivo
function cargas(r, bodega, pallets) {
  const md = medidasRack(r);
  const porNivel = [];
  for (let i = 1; i <= r.niveles; i++) {
    const t = tipoEnAltura(r, i, pallets);
    const peso = t && t.peso > 0 ? t.peso : bodega.pesoPallet > 0 ? bodega.pesoPallet : 0;
    porNivel.push(peso * md.palletsPorViga);
  }
  const vano = porNivel.reduce((a, b) => a + b, 0);
  // Un marco interior recibe medio vano de cada lado; con un solo cuerpo, medio vano
  return { porNivel, maxViga: Math.max(0, ...porNivel), marco: md.cuerpos > 1 ? vano : vano / 2 };
}

/** Carga de un rack selectivo (kg): por nivel, la del par de vigas mas cargado y la de un marco */
export const cargasRack = (r, bodega, pallets) => cargas(r, bodega, pallets);

// ─── Geometria ───
const dPuntoSeg = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};
const dPuntoRect = (p, q) => Math.hypot(Math.max(0, q.x0 - p.x, p.x - q.x0 - q.ancho), Math.max(0, q.y0 - p.y, p.y - q.y0 - q.alto));
const esquinas = (q) => [{ x: q.x0, y: q.y0 }, { x: q.x0 + q.ancho, y: q.y0 }, { x: q.x0 + q.ancho, y: q.y0 + q.alto }, { x: q.x0, y: q.y0 + q.alto }];
const dRects = (p, q) => Math.hypot(Math.max(0, q.x0 - p.x0 - p.ancho, p.x0 - q.x0 - q.ancho), Math.max(0, q.y0 - p.y0 - p.alto, p.y0 - q.y0 - q.alto));

/** Distancia (m) del rack al muro mas cercano (el rack debe estar dentro) */
export function distanciaMuro(r, bodega) {
  const q = rectangulo(r), poly = contorno(bodega);
  return Math.min(...poly.map((a, i) => {
    const b = poly[(i + 1) % poly.length];
    return Math.min(dPuntoRect(a, q), dPuntoRect(b, q), ...esquinas(q).map((p) => dPuntoSeg(p, a, b)));
  }));
}

/** Distancia (m) del rack al pilar mas cercano (Infinity si no hay pilares). Un pilar dentro de un selectivo no
 *  cuenta: el rack se arma alrededor de él (pilarDentro) */
export function distanciaPilar(r, bodega) {
  const q = rectangulo(r);
  return Math.min(Infinity, ...(bodega.elementos ?? []).filter((e) => e.clase === 'pilar' && !pilarDentro(r, e)).map((e) => dRects(q, rectElemento(e))));
}

// Ubicacion valida: dentro, sin choques y con sus distancias a muro y pilar
function ubicable(c, racks, bodega) {
  if (!rackDentro(c, bodega)) return false;
  const otros = racks.map((o) => (o.id === c.id ? c : o));
  if (conflictos(otros, bodega).has(c.id)) return false;
  return distanciaMuro(c, bodega) >= DISTANCIAS.rackMuro.valor - 0.006 && distanciaPilar(c, bodega) >= DISTANCIAS.rackPilar.valor - 0.006;
}

// Lugar valido mas cercano moviendo el rack hasta `max` m (o null)
function lugarCercano(r, racks, bodega, max = 2) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (let d = 0.05; d <= max + e6; d += 0.05) {
    for (const [dx, dy] of dirs) {
      const c = { ...r, x: +(r.x + dx * d).toFixed(2), y: +(r.y + dy * d).toFixed(2) };
      if (ubicable(c, racks, bodega)) return c;
    }
  }
  return null;
}

// Caras de carga de racks nuevos con grua sin pasillo delante (menos de 0,5 m al vecino o muro)
function carasSinPasillo(racks, bodega, lista) {
  const out = [];
  racks.filter((r) => !r.existente && conGrua(r)).forEach((r) => {
    carasDeCarga(r).forEach((lado) => { if (!caraConPasillo(r, lado, lista)) out.push({ r, lado }); });
  });
  return out;
}

// Cuantos problemas de pasillo hay (angostos con algun rack nuevo + caras sin pasillo)
function problemasPasillo(racks, bodega) {
  const lista = pasillos(racks, bodega);
  const nuevo = new Set(racks.filter((r) => !r.existente).map((r) => r.id));
  const angostos = lista.filter((p) => !p.ok && [...p.racks, p.vecino].some((id) => nuevo.has(id)));
  return angostos.length + carasSinPasillo(racks, bodega, lista).length;
}

// Movimiento que ensancha el pasillo: el primer candidato valido que reduce los problemas
function moverParaPasillo(racks, bodega, candidatos) {
  const antes = problemasPasillo(racks, bodega);
  for (const { r, dx, dy } of candidatos) {
    const c = { ...r, x: +(r.x + dx).toFixed(2), y: +(r.y + dy).toFixed(2) };
    if (!ubicable(c, racks, bodega)) continue;
    const despues = problemasPasillo(racks.map((o) => (o.id === c.id ? c : o)), bodega);
    if (despues < antes) return c;
  }
  return null;
}
const subir = (v) => Math.ceil(v * 100 - 1e-6) / 100 + 0.01;   // al cm, con 1 cm de margen

// ─── Reglas ───

function aviso(regla, clave, nivel, mensaje, comoArreglar, ids, arreglo) {
  return { id: `${regla}:${clave}`, regla, nivel, mensaje, comoArreglar, ids, arreglo: arreglo ?? null };
}

// Niveles maximos que cumplen techo, levante y peso por marco (o null si ni el minimo cumple)
function nivelesQueCumplen(r, bodega, pallets) {
  const g = equipo(bodega), min = TIPOS[r.tipo]?.campos.niveles[1] ?? 1;
  for (let n = r.niveles - 1; n >= min; n--) {
    const c = { ...r, ...conNiveles(r, n) };
    if (bodega.altura > 0 && punta(c) + DISTANCIAS.holguraTecho.valor > bodega.altura + e6) continue;
    if (conGrua(c) && alturaUltimoNivel(c) > g.levante + e6) continue;
    if (pesoSobreGrua(c, bodega, pallets).length) continue;
    if (c.tipo === 'RS' && cargas(c, bodega, pallets).marco > CAPACIDAD_MARCO_KG + e6) continue;
    return n;
  }
  return null;
}
const arregloNiveles = (r, n) => (n == null ? null : { tipo: 'rack', rackId: r.id, cambio: conNiveles(r, n) });
const textoNiveles = (n) => `Bajar a ${n} ${n === 1 ? 'nivel' : 'niveles'}`;

// La grua pierde capacidad mientras mas sube: cada nivel con un pallet mas pesado de lo que levanta ahi bloquea
function reglaPesoGrua(r, i, bodega, pallets) {
  const malos = pesoSobreGrua(r, bodega, pallets);
  if (!malos.length) return null;
  const g = equipo(bodega), peor = malos[malos.length - 1];
  const n = nivelesQueCumplen(r, bodega, pallets);
  return aviso('pesoGrua', r.id, 'bloquea',
    `En ${nombreRack(r, i)}, a ${m(peor.altura)} tu ${g.nombre.toLowerCase()} levanta ~${numTexto(peor.kg > 0 ? peor.puede : 0)} kg y el pallet pesa ${numTexto(peor.kg)} kg.`,
    n != null ? `${textoNiveles(n)} o dejar los pallets pesados abajo` : 'Usar un equipo de más capacidad o pallets más livianos', [r.id], arregloNiveles(r, n));
}

function reglaSobrante(r, i) {
  if (r.tipo !== 'RS' || r.sobrante == null) return null;
  const s = Number(r.sobrante);
  if (s >= SOBRANTE.min - e6 && s <= SOBRANTE.max + e6) return null;
  const v = Math.min(SOBRANTE.max, Math.max(SOBRANTE.min, Number.isFinite(s) ? s : SOBRANTE.min));
  return aviso('sobrante', r.id, 'bloquea',
    `El sobrante de marco de ${nombreRack(r, i)} es ${mmTexto(s)}; debe estar entre 300 y 1.000 mm.`,
    `Dejar sobrante en ${mmTexto(v)}`, [r.id], { tipo: 'rack', rackId: r.id, cambio: { sobrante: v } });
}

function reglaTecho(r, i, bodega, pallets) {
  if (!(bodega.altura > 0)) return null;
  const h = DISTANCIAS.holguraTecho.valor, p = punta(r);
  if (p + h <= bodega.altura + e6) return null;
  const n = nivelesQueCumplen(r, bodega, pallets);
  return aviso('techo', r.id, 'bloquea',
    `${nombreRack(r, i)} llega a ${m(p)} con la carga y la bodega mide ${m(bodega.altura)}: deben quedar ${m(h)} libres bajo el techo.`,
    n != null ? textoNiveles(n) : 'Bajar la carga o elegir otro sistema', [r.id], arregloNiveles(r, n));
}

function reglaLevante(r, i, bodega, pallets) {
  if (!conGrua(r)) return null;
  const g = equipo(bodega), alto = alturaUltimoNivel(r);
  if (alto <= g.levante + e6) return null;
  const n = nivelesQueCumplen(r, bodega, pallets);
  let arreglo = arregloNiveles(r, n), como = n != null ? textoNiveles(n) : null;
  if (n == null) {
    // Ni con un nivel: el equipo que alcanza con el pasillo mas angosto
    const k = Object.keys(GRUAS).filter((k) => GRUAS[k].levante >= alto - e6).sort((a, b) => GRUAS[a].pasillo - GRUAS[b].pasillo)[0];
    arreglo = k ? { tipo: 'bodega', cambio: { grua: k } } : null;
    como = k ? `Usar ${GRUAS[k].nombre.toLowerCase()}` : 'Elegir un equipo que levante más';
  }
  return aviso('levante', r.id, 'bloquea',
    `El último nivel de ${nombreRack(r, i)} está a ${m(alto)} y tu ${g.nombre.toLowerCase()} levanta hasta ${m(g.levante)}.`,
    como, [r.id], arreglo);
}

function reglaPasillos(racks, bodega, nombres) {
  const lista = pasillos(racks, bodega), porId = new Map(racks.map((r) => [r.id, r])), out = [];
  const nuevo = (id) => porId.has(id) && !porId.get(id).existente;
  lista.filter((p) => !p.ok).forEach((p) => {
    const ids = [...new Set([...p.racks, p.vecino].filter(Boolean))];
    if (!ids.some(nuevo)) return;
    const falta = subir(p.minimo - p.libre), cx = (p.x0 + p.x1) / 2, cy = (p.y0 + p.y1) / 2;
    // Un pilar dentro del pasillo: separar las filas no sirve (el pilar sigue al medio). Lo que hace un asesor:
    // correr la fila más cercana para que el pilar quede DENTRO del rack (pierde solo esas posiciones) y la de
    // enfrente lo mismo, para que el pasillo conserve su ancho
    const pil = p.angosta?.clase === 'pilar' ? (bodega.elementos ?? []).find((e) => e.id === p.angosta.id) : null;
    if (pil) {
      const eje = p.eje === 'x' ? 'x' : 'y', prof = eje === 'x' ? pil.ancho : pil.alto;
      const dueño = porId.get(p.racks[0]), vec = p.vecino ? porId.get(p.vecino) : null;
      const dDueño = p.angosta.distancia, dVec = (p.libreGeom ?? p.libre) - dDueño - prof;
      const [cerca, lejos, d] = vec && dVec < dDueño ? [vec, dueño, dVec] : [dueño, vec, dDueño];
      const s = Math.sign(pil[eje] - cerca[eje]) * subir(d + prof + 0.1);
      const cambios = [cerca, lejos].filter((r) => r && nuevo(r.id)).map((r) => ({ rackId: r.id, cambio: { [eje]: +(r[eje] + s).toFixed(2) } }));
      let prueba = racks;
      const ok = cambios.length && cambios.every(({ rackId, cambio }) => {
        const c = { ...prueba.find((r) => r.id === rackId), ...cambio };
        prueba = prueba.map((o) => (o.id === rackId ? c : o));
        return ubicable(c, prueba, bodega);
      }) && problemasPasillo(prueba, bodega) < problemasPasillo(racks, bodega);
      out.push(aviso('pasillo', p.id, 'bloquea',
        `Un pilar dentro del pasillo frente a ${ids.map((id) => nombres.get(id)).join(' y ')} deja pasar solo ${m(p.libre)}; tu equipo necesita ${m(p.minimo)}.`,
        ok ? `Correr la fila ${m(Math.abs(s))}: el pilar queda dentro del rack` : 'Mover la fila para que el pilar quede dentro del rack', ids,
        ok ? { tipo: 'racks', cambios } : null));
      return;
    }
    // Cada rack nuevo del pasillo se aleja de el lo que falta
    const candidatos = ids.filter(nuevo).map((id) => {
      const r = porId.get(id);
      return p.eje === 'x' ? { r, dx: Math.sign(r.x - cx) * falta, dy: 0 } : { r, dx: 0, dy: Math.sign(r.y - cy) * falta };
    });
    const c = moverParaPasillo(racks, bodega, candidatos);
    out.push(aviso('pasillo', p.id, 'bloquea',
      `El pasillo frente a ${ids.map((id) => nombres.get(id)).join(' y ')} mide ${m(p.libre)}; tu equipo necesita ${m(p.minimo)}.`,
      c ? `Ensanchar pasillo a ${m(p.minimo)}` : 'Mover o quitar un rack', ids,
      c ? { tipo: 'rack', rackId: c.id, cambio: { x: c.x, y: c.y } } : null));
  });
  // Caras de carga pegadas a otro rack o al muro: no hay por donde cargar
  carasSinPasillo(racks, bodega, lista).forEach(({ r, lado }) => {
    const libre = libreHacia(r, lado, racks, bodega), minimo = equipo(bodega).pasillo;
    const s = { arriba: [0, -1], abajo: [0, 1], izquierda: [-1, 0], derecha: [1, 0] }[lado];
    const falta = subir(minimo - libre);
    const cand = [{ r, dx: -s[0] * falta, dy: -s[1] * falta }];
    // Simple: girarlo para que cargue por el otro lado
    let c = null;
    if (!r.doble) {
      const g = { ...r, rot: (r.rot + 180) % 360 };
      const otros = racks.map((o) => (o.id === r.id ? g : o));
      if (ubicable(g, racks, bodega) && problemasPasillo(otros, bodega) < problemasPasillo(racks, bodega)) c = g;
    }
    c = c ?? moverParaPasillo(racks, bodega, cand);
    out.push(aviso('pasillo', `${r.id}-${lado}`, 'bloquea',
      `${nombres.get(r.id)} no tiene pasillo frente a su cara de carga (${m(Number.isFinite(libre) ? libre : 0)} libres).`,
      c ? (c.rot !== r.rot ? 'Girar el rack' : `Separar ${m(falta)}`) : 'Mover o quitar el rack', [r.id],
      c ? { tipo: 'rack', rackId: r.id, cambio: c.rot !== r.rot ? { rot: c.rot } : { x: c.x, y: c.y } } : null));
  });
  return out;
}

function reglaCarga(r, i, bodega, pallets) {
  if (r.tipo === 'DI') {
    const t = tipoEnAltura(r, 0, pallets), peso = t?.peso > 0 ? t.peso : bodega.pesoPallet || 0;
    const cap = CAPACIDADES.driveInPallet.valor;
    if (!(peso > cap + e6)) return null;
    return aviso('carga', r.id, 'advierte', `Cada pallet de ${nombreRack(r, i)} pesa ${peso.toLocaleString('es-CL')} kg y los rieles resisten ${cap.toLocaleString('es-CL')} kg.`,
      'Pedir rieles reforzados', [r.id], null);
  }
  if (r.tipo !== 'RS') return null;
  const { maxViga } = cargas(r, bodega, pallets), cap = CAPACIDADES.selectivoParVigas.valor;
  if (!(maxViga > cap + e6)) return null;
  const porViga = r.porViga ?? 2, peso = maxViga / porViga;
  const k = [3, 2, 1].find((n) => n < porViga && peso * n <= cap + e6);
  return aviso('carga', r.id, 'advierte',
    // Sin capacidades por par ni perfiles a la vista (regla comercial 27-10): ingeniería elige la viga
    `Un nivel de ${nombreRack(r, i)} carga ${Math.round(maxViga).toLocaleString('es-CL')} kg, más de lo que lleva la viga estándar: ingeniería Racklog lo revisa.`,
    k ? `Poner ${k} ${k === 1 ? 'pallet' : 'pallets'} por nivel` : 'Que ingeniería defina la viga', [r.id],
    k ? { tipo: 'rack', rackId: r.id, cambio: { porViga: k } } : null);
}

function reglaMarco(r, i, bodega, pallets) {
  if (r.tipo !== 'RS') return null;
  const { marco } = cargas(r, bodega, pallets);
  if (!(marco > CAPACIDAD_MARCO_KG + e6)) return null;
  const n = nivelesQueCumplen(r, bodega, pallets);
  return aviso('marco', r.id, 'bloquea',
    `Un marco de ${nombreRack(r, i)} recibe ${Math.round(marco).toLocaleString('es-CL')} kg y resiste ${CAPACIDAD_MARCO_KG.toLocaleString('es-CL')} kg.`,
    n != null ? textoNiveles(n) : 'Pedir marco reforzado', [r.id], arregloNiveles(r, n));
}

function reglaEsbeltez(r, i, racks, bodega) {
  if (r.tipo !== 'RS' || r.doble) return null;
  const md = medidasRack(r), e = md.alto / md.fondo;
  if (e <= ESBELTEZ_MAX + e6) return null;
  const c = { ...r, doble: true };
  const ok = ubicable(c, racks, bodega);
  return aviso('esbeltez', r.id, 'advierte',
    `${nombreRack(r, i)} es muy esbelto: su marco mide ${m(md.alto)} de alto y ${m(md.fondo)} de fondo (más de ${ESBELTEZ_MAX} veces).`,
    ok ? 'Pasar a rack doble' : 'Pedir anclaje especial', [r.id], ok ? { tipo: 'rack', rackId: r.id, cambio: { doble: true } } : null);
}

function reglasDriveIn(r, i, pallets) {
  if (r.tipo !== 'DI') return [];
  const out = [], md = medidasRack(r);
  const g = gruaDriveIn(r), alto = Math.max(g.techo, g.mastil);
  if (!g.puede) {
    out.push(aviso('gruaDriveIn', r.id, 'bloquea',
      `${nombreRack(r, i)} no se puede operar con tu equipo: ${g.motivo}. Un drive-in necesita grúa horquilla, retráctil o apilador eléctrico.`,
      'Cambiar el sistema o el equipo', [r.id], null));
  } else if (g.tipica) {
    out.push(aviso('gruaDriveIn', r.id, 'advierte',
      `El primer nivel de ${nombreRack(r, i)} queda a ${m(md.primerNivel)} con la medida típica de tu grúa (${m(alto)} de alto). Mide la tuya: con ella se ajusta.`,
      'Mide tu grúa', [r.id], null));
  } else if (md.primerNivel < alto + HOLGURA_GRUA_DI - e6 || (g.ancho > 0 && md.anchoCalle - 0.1 < g.ancho + 0.2 - e6)) {
    out.push(aviso('gruaDriveIn', r.id, 'bloquea', `La grúa no entra en la calle de ${nombreRack(r, i)}.`, 'Revisar medidas de la grúa', [r.id], null));
  }
  // Un solo alto de pallet por bloque
  const tipos = (r.mezcla ?? []).map((id) => pallets.find((t) => t.id === id)).filter(Boolean);
  if (new Set(tipos.map((t) => t.alto)).size > 1) {
    const cuenta = new Map();
    tipos.forEach((t) => cuenta.set(t.id, (cuenta.get(t.id) ?? 0) + 1));
    const masUsado = tipos.find((t) => t.id === [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0][0]);
    out.push(aviso('altoDriveIn', r.id, 'bloquea',
      `${nombreRack(r, i)} mezcla pallets de distinto alto; un drive-in lleva un solo alto por bloque.`,
      `Usar solo ${masUsado.nombre}`, [r.id],
      { tipo: 'rack', rackId: r.id, cambio: { mezcla: (r.mezcla ?? []).map(() => masUsado.id) } }));
  }
  return out;
}

function reglaTunel(r, i) {
  if (r.tipo !== 'RS' || !r.tunel) return null;
  const t = medidasRack(r).tunel;
  if (!t || (t.libreReal ?? 0) >= ALTO_PASO_TUNEL - e6) return null;
  // El menor alto libre pedido que deja pasar al equipo
  let arreglo = null;
  for (let a = Math.max(t.altoLibre, ALTO_PASO_TUNEL); a <= 6 + e6; a = +(a + 0.1).toFixed(2)) {
    const tt = medidasRack({ ...r, tunel: { ...r.tunel, altoLibre: a } }).tunel;
    if (tt && tt.libreReal >= ALTO_PASO_TUNEL - e6 && tt.quitadas <= r.niveles) { arreglo = { tipo: 'rack', rackId: r.id, cambio: { tunel: { ...r.tunel, altoLibre: a } } }; break; }
  }
  return aviso('tunel', r.id, 'bloquea',
    `El paso libre del túnel de ${nombreRack(r, i)} es ${m(t.libreReal ?? 0)}; necesita ${m(ALTO_PASO_TUNEL)} para que pase el equipo.`,
    arreglo ? `Subir el paso a ${m(arreglo.cambio.tunel.altoLibre)}` : 'Quitar el túnel', [r.id],
    arreglo ?? { tipo: 'rack', rackId: r.id, cambio: { tunel: null } });
}

// Con que choca el rack, en simple
function motivoChoque(r, racks, bodega, nombres) {
  if (!rackDentro(r, bodega)) return 'se sale de la bodega';
  const p = rectangulo(r), e = 0.001;
  const solapa = (q) => p.x0 < q.x0 + q.ancho - e && q.x0 < p.x0 + p.ancho - e && p.y0 < q.y0 + q.alto - e && q.y0 < p.y0 + p.alto - e;
  const el = (bodega.elementos ?? []).filter(bloquea).find((x) => solapa(rectElemento(x)));
  const nom = { pilar: 'un pilar', porton: 'un portón', anden: 'un andén', oficina: 'una oficina', zona: 'una zona bloqueada', pasilloGrua: 'un pasillo de grúa', pasilloPeatonal: 'un pasillo peatonal' };
  if (el) return `está encima de ${nom[el.clase] ?? 'un elemento'}`;
  const o = racks.find((x) => x.id !== r.id && solapa(rectangulo(x)));
  return o ? `se monta sobre ${nombres.get(o.id)}` : 'choca con otro elemento';
}

function reglaChoques(racks, bodega, nombres) {
  const malos = conflictos(racks, bodega), out = [];
  racks.filter((r) => malos.has(r.id)).forEach((r) => {
    const c = lugarCercano(r, racks, bodega);
    const arreglo = c ? { tipo: 'rack', rackId: r.id, cambio: { x: c.x, y: c.y } } : r.existente ? null : { tipo: 'eliminar', rackId: r.id };
    out.push(aviso('choque', r.id, 'bloquea', `${nombres.get(r.id)} ${motivoChoque(r, racks, bodega, nombres)}.`,
      c ? `Mover ${m(Math.hypot(c.x - r.x, c.y - r.y))}` : r.existente ? 'Revisa la posición del rack existente' : 'Quitar el rack', [r.id], arreglo));
  });
  return out;
}

function reglaDistancias(r, i, racks, bodega, malos) {
  if (malos.has(r.id)) return null;
  const dm = distanciaMuro(r, bodega), dp = distanciaPilar(r, bodega);
  const fMuro = dm < DISTANCIAS.rackMuro.valor - 0.006, fPilar = dp < DISTANCIAS.rackPilar.valor - 0.006;
  if (!fMuro && !fPilar) return null;
  const c = lugarCercano(r, racks, bodega, 0.5);
  const que = fMuro ? `queda a ${Math.round(dm * 100)} cm del muro` : `queda a ${Math.round(dp * 100)} cm de un pilar`;
  return aviso('distancia', r.id, 'bloquea', `${nombreRack(r, i)} ${que}; deben quedar al menos 10 cm.`,
    c ? 'Separar 10 cm' : 'Mover el rack', [r.id], c ? { tipo: 'rack', rackId: r.id, cambio: { x: c.x, y: c.y } } : null);
}

// Ancho y eje del pasillo peatonal; paralelo a un pasillo de grua a menos de 1 m
function reglasPeatonales(racks, bodega, quitados) {
  const out = [], elementos = bodega.elementos ?? [];
  const minimo = DISTANCIAS.pasilloPersona.valor;
  const gruas = [
    ...elementos.filter((e) => e.clase === 'pasilloGrua').map((e) => ({ ...rectElemento(e), vertical: e.alto >= e.ancho })),
    ...pasillos(racks.filter(conGrua), bodega).map((p) => ({ x0: p.x0, y0: p.y0, ancho: p.x1 - p.x0, alto: p.y1 - p.y0, vertical: p.eje === 'x' })),
  ];
  elementos.filter((e) => e.clase === 'pasilloPeatonal').forEach((e, k) => {
    const ancho = Math.min(e.ancho, e.alto), vertical = e.alto >= e.ancho;
    if (ancho < minimo - e6) {
      const nuevo = vertical ? { ...e, ancho: minimo } : { ...e, alto: minimo };
      out.push(aviso('peatonal', e.id, 'advierte', `El pasillo peatonal ${k + 1} mide ${m(ancho)}; lo mínimo es ${m(minimo)}.`,
        `Ensanchar a ${m(minimo)}`, [], { tipo: 'bodega', cambio: { elementos: elementos.map((o) => (o.id === e.id ? nuevo : o)) } }));
    }
    if (!quitados.has('barandas')) return;
    const q = rectElemento(e);
    const paralelo = gruas.some((g) => g.vertical === vertical && dRects(q, g) < 1 && (vertical
      ? Math.min(q.y0 + q.alto, g.y0 + g.alto) - Math.max(q.y0, g.y0) > 1
      : Math.min(q.x0 + q.ancho, g.x0 + g.ancho) - Math.max(q.x0, g.x0) > 1));
    if (paralelo) {
      out.push(aviso('baranda', e.id, 'advierte', `El pasillo peatonal ${k + 1} corre junto a un pasillo de grúa y quitaste la baranda.`,
        'Volver a poner baranda', [], { tipo: 'accesorio', id: 'barandas' }));
    }
  });
  return out;
}

function reglaPlanos(r, i, pallets) {
  if (r.tipo !== 'RS') return null;
  const faltan = [];
  for (let n = 1; n <= r.niveles; n++) {
    const t = tipoEnAltura(r, n, pallets);
    if (t && (t.sinPallet || (Number(t.sobresale) || 0) > 0) && !PLANOS.includes(r.planos?.[n])) faltan.push(n);
  }
  if (!faltan.length) return null;
  const planos = Array.from({ length: r.niveles + 1 }, (_, n) => (faltan.includes(n) ? 'malla' : r.planos?.[n] ?? null));
  return aviso('planos', r.id, 'bloquea',
    `${nombreRack(r, i)} tiene carga sin pallet o que sobresale en ${faltan.length === 1 ? `el nivel ${faltan[0]}` : `los niveles ${faltan.join(', ')}`} sin plano de carga.`,
    'Agregar planos de malla', [r.id], { tipo: 'rack', rackId: r.id, cambio: { planos } });
}

function reglasAccesoriosQuitados(bodega, racks, pallets, quitados) {
  if (!quitados.has('proteccionBastidor') && !quitados.has('canilleras')) return [];
  const propuestos = proponerAccesorios({ bodega, racks, pallets }), out = [];
  const p = propuestos.find((a) => a.id === 'proteccionBastidor');
  if (p && quitados.has('proteccionBastidor')) {
    out.push(aviso('accesorio', 'proteccionBastidor', 'advierte', `Quitaste la protección de bastidor y hay ${p.cantidad} ${p.cantidad === 1 ? 'cabecera expuesta' : 'cabeceras expuestas'} al tránsito de grúa.`,
      'Volver a poner protecciones', [], { tipo: 'accesorio', id: 'proteccionBastidor' }));
  }
  const c = propuestos.find((a) => a.id === 'canilleras');
  if (c && quitados.has('canilleras')) {
    out.push(aviso('accesorio', 'canilleras', 'advierte', `Quitaste las canilleras y hay ${c.cantidad} pilares que dan a pasillos de grúa.`,
      'Volver a poner canilleras', [], { tipo: 'accesorio', id: 'canilleras' }));
  }
  return out;
}

function reglasAngulo(r, i, bodega) {
  if (r.tipo !== 'AR') return [];
  const out = [], cap = CAPACIDADES.bandejaAngulo.valor;
  if (bodega.pesoBandeja > cap + e6) {
    out.push(aviso('bandeja', r.id, 'bloquea', `Cada bandeja de ${nombreRack(r, i)} llevaría ${bodega.pesoBandeja} kg y resiste ${cap} kg.`,
      `Repartir a máximo ${cap} kg por bandeja`, [r.id], null));
  }
  const tope = medidasRack(r).nivelesY.at(-1) ?? 0;
  if (tope > REPISA_SIN_ESCALERA + e6) {
    out.push(aviso('escalera', r.id, 'advierte', `La repisa superior de ${nombreRack(r, i)} está a ${m(tope)}: necesitas escalera para alcanzarla.`,
      'Entendido', [r.id], null));
  }
  return out;
}

// Ids de accesorios quitados: de la lista con ajustes ({ incluido }) o de { quitados }
function quitadosDe(accesorios) {
  if (Array.isArray(accesorios)) return new Set(accesorios.filter((a) => a.incluido === false).map((a) => a.id));
  return new Set(accesorios?.quitados ?? []);
}

/**
 * Revisa el diseno. Devuelve [{ id, regla, nivel: 'bloquea'|'advierte', mensaje, comoArreglar, ids, arreglo }]
 * arreglo: { tipo: 'rack', rackId, cambio } | { tipo: 'bodega', cambio } | { tipo: 'eliminar', rackId }
 *        | { tipo: 'accesorio', id } | null
 * Los racks existentes solo se revisan por choques.
 * `accesorios`: lista de aplicarAjustes() o { quitados }.
 */
export function revisarDiseno({ bodega, racks = [], pallets = [], accesorios = null }) {
  const nombres = new Map(racks.map((r, i) => [r.id, nombreRack(r, i)]));
  const quitados = quitadosDe(accesorios);
  const malos = conflictos(racks, bodega);
  const out = [...reglaChoques(racks, bodega, nombres)];
  racks.forEach((r, i) => {
    if (r.existente) return;
    out.push(
      reglaSobrante(r, i),
      reglaTecho(r, i, bodega, pallets),
      reglaLevante(r, i, bodega, pallets),
      reglaPesoGrua(r, i, bodega, pallets),
      reglaCarga(r, i, bodega, pallets),
      reglaMarco(r, i, bodega, pallets),
      reglaEsbeltez(r, i, racks, bodega),
      ...reglasDriveIn(r, i, pallets),
      reglaTunel(r, i),
      reglaDistancias(r, i, racks, bodega, malos),
      reglaPlanos(r, i, pallets),
      ...reglasAngulo(r, i, bodega),
    );
  });
  out.push(...reglaPasillos(racks, bodega, nombres), ...reglasPeatonales(racks, bodega, quitados), ...reglasAccesoriosQuitados(bodega, racks, pallets, quitados));
  return out.filter(Boolean).sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'bloquea' ? -1 : 1));
}

/** { viable, bloquea, advierte, color: 'verde'|'amarillo'|'rojo' } */
export function resumenViabilidad(lista) {
  const bloqueaN = lista.filter((a) => a.nivel === 'bloquea').length;
  const advierteN = lista.length - bloqueaN;
  return { viable: !bloqueaN, bloquea: bloqueaN, advierte: advierteN, color: bloqueaN ? 'rojo' : advierteN ? 'amarillo' : 'verde' };
}

/** Aplica un arreglo a { bodega, racks, quitados } y devuelve el diseno nuevo (lo mismo que hace la interfaz) */
export function aplicarArreglo({ bodega, racks, quitados = [] }, arreglo) {
  if (!arreglo) return { bodega, racks, quitados };
  if (arreglo.tipo === 'rack') return { bodega, quitados, racks: racks.map((r) => (r.id === arreglo.rackId ? { ...r, ...arreglo.cambio } : r)) };
  // Varias filas a la vez (p. ej. correr las dos filas de un pasillo para que un pilar quede dentro de un rack)
  if (arreglo.tipo === 'racks') return { bodega, quitados, racks: racks.map((r) => { const c = arreglo.cambios.find((x) => x.rackId === r.id); return c ? { ...r, ...c.cambio } : r; }) };
  if (arreglo.tipo === 'bodega') return { racks, quitados, bodega: { ...bodega, ...arreglo.cambio } };
  if (arreglo.tipo === 'eliminar') return { bodega, quitados, racks: racks.filter((r) => r.id !== arreglo.rackId) };
  if (arreglo.tipo === 'accesorio') return { bodega, racks, quitados: quitados.filter((id) => id !== arreglo.id) };
  return { bodega, racks, quitados };
}
