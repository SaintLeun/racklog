// Guion del tour en video del paso 7 (Revisa): un recorrido narrado por la bodega del cliente, una escena por
// tema, con sus números reales. Sin Vue ni three.js: devuelve datos (textos, encuadres, resaltes y cotas en
// planta) que lib/rack3d/visor.js anima y graba. Se puede probar sola (tests/flujo/prueba-guion.mjs).
//
// Orden (dueño 27-10): 1 tu bodega (medidas con cotas) · 2 lo que ya tiene (oficinas, pilares, portones…) ·
// 3 tu carga (una pasada por tipo: medidas, cantidad y en qué nivel de qué filas queda, con esos módulos
// iluminados) · 4 altura sin aprovechar (posiciones y m² que quedan hacia arriba) · 5 tu maquinaria y el aviso
// honesto de ingeniería · cierre con posiciones, hoy vs propuesta y la invitación a cotizar.
// Una escena sin datos (sin elementos, sin altura, sin "hoy") se salta. Solo rack selectivo (alcance 27-10).
//
// Coordenadas: planta en m (x, y) y alto z en m. Un encuadre es { caja: { x0, y0, x1, y1, z0, z1 }, desde,
// hasta } con las direcciones de cámara (x, alto, y) al empezar y al terminar la escena: la cámara orbita
// despacio entre ambas (nada de cortes).
import { contorno, caja as cajaDe, area, rectangulo, medidasRack, formatoM, ELEMENTOS, conflictos } from '../rack3d/planificador.js';
import { equipoDe, capacidadEnAltura, DISTANCIAS } from '../rack3d/parametrosTecnicos.js';
import { alturaUltimoNivel } from '../rack3d/operacion.js';
import { armarPallet } from '../tour/pallet.js';
import { conteoTotal, cobertura, nivelesMaximos, racksAlDia } from './calculos.js';
import { vistasPorRol, resumenEjecutivo, areaOcupada } from './perfiles.js';

const n = (v) => Math.round(v).toLocaleString('es-CL');
const fm = (v) => formatoM(+(+v || 0).toFixed(2));
const cm = (v) => Math.round((+v || 0) * 100);
const plural = (k, uno, varios) => `${n(k)} ${k === 1 ? uno : varios}`;
// "a, b y c"
const lista = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);
// Tiempo de lectura: ~15 caracteres por segundo, con un mínimo para que la cámara alcance a moverse
const leer = (textos, min = 5200, max = 9000) => Math.min(max, Math.max(min, 1800 + textos.join(' ').length * 62));

export const COLOR_ALTURA = '#0ea5e9';
export const COLOR_ELEMENTO = '#7c3aed';
export const AVISO_INGENIERIA = 'Este es un modelo preliminar: las medidas reales de tu grúa y su capacidad de levante se verifican con ingeniería Racklog. En la realidad algunos aspectos pueden ajustarse.';

// Niveles en palabras, igual que la pestaña "Bodega" de Revisa: 0 = piso
function nivelesTexto(idx) {
  if (!idx.length) return '';
  const piso = idx[0] === 0, resto = idx.filter((i) => i > 0);
  const tramo = !resto.length ? '' : resto.length === 1 ? `el nivel ${resto[0]}` : resto.every((v, i) => !i || v === resto[i - 1] + 1) ? `los niveles ${resto[0]} a ${resto[resto.length - 1]}` : `los niveles ${lista(resto.map(String))}`;
  return piso ? (tramo ? `el piso y ${tramo}` : 'el piso') : tramo;
}

// Caja (planta + alto) que abarca varios rectángulos de rectangulo()
function cajaRects(rects, z1 = 3, margen = 0) {
  return {
    x0: Math.min(...rects.map((q) => q.x0)) - margen, y0: Math.min(...rects.map((q) => q.y0)) - margen,
    x1: Math.max(...rects.map((q) => q.x0 + q.ancho)) + margen, y1: Math.max(...rects.map((q) => q.y0 + q.alto)) + margen,
    z0: 0, z1,
  };
}
const dentroDe = (c, b) => ({ ...c, x0: Math.max(b.x0, c.x0), y0: Math.max(b.y0, c.y0), x1: Math.min(b.x1, c.x1), y1: Math.min(b.y1, c.y1) });

// Alto de la carga más alta de un rack (m)
const puntaRack = (r) => { const m = medidasRack(r); return Number(m.altoConCarga ?? m.alto) || 0; };

/**
 * Escenas del tour para el proyecto p (stores/proyecto.ts). Devuelve { escenas, duracion, resumen }; sin racks
 * selectivos nuevos no hay tour (escenas vacías).
 */
export function guionTour(p) {
  const bodega = p.bodega ?? {};
  const racks = (p.racks ?? []).filter((r) => !r.existente);
  const rs = racks.filter((r) => r.tipo === 'RS');
  if (!rs.length) return { escenas: [], duracion: 0, resumen: null };
  const pallets = p.pallets ?? [];
  const modelos = (p.modelos ?? []).filter((m) => m.tipo === 'RS');
  const b = cajaDe(contorno(bodega));
  const ancho = b.x1 - b.x0, largo = b.y1 - b.y0;
  const altura = Number(bodega.altura) > 0 ? Number(bodega.altura) : null;
  const m2 = area(contorno(bodega));
  const rectsRS = rs.map(rectangulo);
  const altoRacks = Math.max(...rs.map(puntaRack));
  const zona = dentroDe(cajaRects(rectsRS, altoRacks, 2), b);
  const escenas = [];

  // ─── 1. Tu bodega: ancho × largo × alto con cotas, vista general ───
  {
    const titulo = `${fm(ancho)} × ${fm(largo)} m${altura ? `, ${fm(altura)} m de alto` : ''}`;
    const detalle = [`${n(m2)} m² de piso${bodega.forma ? ', con la forma que dibujaste' : ''}.`];
    if (!altura) detalle.push('Sin la altura libre: tu ejecutivo la confirma contigo.');
    const z = altura ?? 0;
    const cotas = [
      { a: [b.x0, b.y1 + 1, 0.05], b: [b.x1, b.y1 + 1, 0.05], texto: `${fm(ancho)} m` },
      { a: [b.x1 + 1, b.y0, 0.05], b: [b.x1 + 1, b.y1, 0.05], texto: `${fm(largo)} m` },
      ...(altura ? [{ a: [b.x1 + 0.4, b.y1 + 0.4, 0], b: [b.x1 + 0.4, b.y1 + 0.4, z], texto: `${fm(altura)} m` }] : []),
    ];
    escenas.push({
      id: 'bodega', kicker: 'Tu bodega', titulo, detalle, cotas,
      camara: { caja: { ...b, z0: 0, z1: z || 6 }, desde: [1.05, 0.95, 1.2], hasta: [0.55, 1.05, 1.25], margen: 1.12 },
      duracion: leer([titulo, ...detalle], 6200),
    });
  }

  // ─── 2. Lo que ya tiene: oficinas, pilares, andenes, portones, zonas (la cámara los recorre y los nombra) ───
  const elementos = (bodega.elementos ?? []).filter((e) => e.clase !== 'grua' && ELEMENTOS[e.clase]);
  if (elementos.length) {
    const grupos = {};
    elementos.forEach((e) => { (grupos[e.clase] ||= []).push(e); });
    const orden = ['oficina', 'porton', 'anden', 'pilar', 'zonaCarga', 'zona', 'pasilloGrua', 'pasilloPeatonal'].filter((c) => grupos[c]);
    const nombres = orden.map((c) => { const k = grupos[c].length, E = ELEMENTOS[c]; return k === 1 ? `1 ${E.nombre.toLowerCase()}` : `${n(k)} ${E.plural}`; });
    const titulo = lista(nombres);
    const altoDe = (e) => (e.clase === 'pilar' ? (altura ?? 6) : e.clase === 'oficina' ? 3 : e.clase === 'porton' ? Math.min(4.5, (altura ?? 6) - 0.5) : e.clase === 'anden' ? 1.2 : 0.06);
    const resaltes = elementos.map((e) => ({
      x0: e.x - e.ancho / 2 - (e.clase === 'pilar' ? 0.15 : 0), y0: e.y - e.alto / 2 - (e.clase === 'pilar' ? 0.15 : 0),
      x1: e.x + e.ancho / 2 + (e.clase === 'pilar' ? 0.15 : 0), y1: e.y + e.alto / 2 + (e.clase === 'pilar' ? 0.15 : 0),
      z0: 0, z1: altoDe(e), color: ELEMENTOS[e.clase].color,
    }));
    // Un rótulo por elemento; los pilares, uno solo con cuántos son (si no, el cuadro se llena de etiquetas)
    const etiquetas = orden.flatMap((c) => (c === 'pilar'
      ? [{ x: grupos[c][0].x, y: grupos[c][0].y, z: Math.min(altoDe(grupos[c][0]), 4.5), texto: grupos[c].length === 1 ? 'Pilar' : `${n(grupos[c].length)} pilares` }]
      : grupos[c].map((e) => ({ x: e.x, y: e.y, z: altoDe(e) + 0.2, texto: ELEMENTOS[c].nombre }))));
    const malos = conflictos(racks, bodega);
    const detalle = [malos.size ? 'Tu ejecutivo revisa contigo los racks que topan con alguno.' : 'Tus racks quedan armados respetando cada uno.'];
    const rects = elementos.map((e) => ({ x0: e.x - e.ancho / 2, y0: e.y - e.alto / 2, ancho: e.ancho, alto: e.alto }));
    escenas.push({
      id: 'elementos', kicker: 'Lo que ya tiene tu bodega', titulo, detalle, resaltes, etiquetas,
      camara: { caja: dentroDe(cajaRects(rects, 3.5, 3), b), desde: [-0.75, 1.0, 1.1], hasta: [0.75, 1.0, 1.1], margen: 1.08 },
      duracion: leer([titulo, ...detalle], 6400),
    });
  }

  // ─── 3. Tu carga: una pasada por tipo, con sus módulos iluminados (alternativa A, ver docs del informe) ───
  // Misma cámara para todos los tipos (órbita lenta y continua): solo cambian el texto y lo iluminado
  const cob = cobertura({ racks, modelos, pallets, grua: bodega.grua, ocupacion: bodega.ocupacion ?? 1 });
  const pasos = pallets.filter((t) => (t.cantidad ?? 0) > 0 && rs.some((r) => (r.mezcla ?? []).includes(t.id) || (!r.mezcla?.some(Boolean) && (modelos.find((m) => m.id === r.modelo)?.cantidades?.[t.id] ?? 0) > 0))).map((t) => {
    const suyos = rs.filter((r) => (r.mezcla ?? []).includes(t.id) || (!r.mezcla?.some(Boolean) && (modelos.find((m) => m.id === r.modelo)?.cantidades?.[t.id] ?? 0) > 0));
    const resaltes = [];
    let niveles = [];
    suyos.forEach((r) => {
      const m = medidasRack(r), q = rectangulo(r);
      const idx = r.mezcla?.some(Boolean) ? r.mezcla.map((id, i) => (id === t.id ? i : -1)).filter((i) => i >= 0) : (m.bases ?? []).map((_, i) => i);
      if (!niveles.length) niveles = idx;
      idx.forEach((i) => {
        const z0 = m.bases?.[i] ?? 0, alto = m.altosCarga?.[i] ?? t.alto ?? 1.2;
        resaltes.push({ x0: q.x0, y0: q.y0, x1: q.x0 + q.ancho, y1: q.y0 + q.alto, z0: z0 + 0.02, z1: z0 + alto + 0.06, color: t.color || '#f59e0b' });
      });
    });
    const cuerpos = conteoTotal(suyos).cuerpos;
    const medidas = t.sinPallet
      ? `Bulto sin pallet de ${fm(t.frente)} × ${fm(t.fondo)} m y ${fm(t.alto)} m de alto, ${n(t.peso)} kg`
      : `Pallet de ${fm(t.frente)} × ${fm(t.fondo)} m y ${fm(t.alto)} m de alto, ${n(t.peso)} kg`;
    const detalle = [medidas];
    if (t.desdeCaja && t.caja?.largo > 0 && t.caja?.ancho > 0 && t.caja?.alto > 0) {
      const c = t.caja, lef = c.orientacion === 'largo' ? true : c.orientacion === 'ancho' ? false : undefined;
      const a = armarPallet({ base: { frente: t.frente, fondo: t.fondo }, caja: c, pesoCaja: c.peso || 0, apilable: c.apilable || 1, largoEnFrente: lef });
      if (a.cajas > 0) detalle.push(`${n(a.cajas)} cajas de ${cm(c.largo)} × ${cm(c.ancho)} × ${cm(c.alto)} cm por pallet (${a.cols * a.filas} por cama, ${a.camas} ${a.camas === 1 ? 'cama' : 'camas'})`);
    }
    const donde = nivelesTexto(niveles);
    const filas = suyos.length;
    detalle.push(`Va en ${donde || 'todos los niveles'} de ${filas === 1 ? 'esta fila' : `estas ${filas} filas`} (${plural(cuerpos, 'cuerpo', 'cuerpos')}).`);
    const c = cob.productos.find((x) => x.id === t.id);
    if (c) detalle.push(c.ok ? `${n(c.posiciones)} posiciones para tus ${n(t.cantidad)} pallets.` : `${n(c.posiciones)} posiciones de las ${n(c.necesita)} que pide: faltan ${n(c.falta)}.`);
    const titulo = `${t.nombre}: ${plural(t.cantidad, t.sinPallet ? 'bulto' : 'pallet', t.sinPallet ? 'bultos' : 'pallets')}`;
    return { titulo, detalle, resaltes, duracion: leer([titulo, ...detalle], 5600, 8200), color: t.color };
  });
  if (pasos.length) {
    escenas.push({
      id: 'carga', kicker: pasos.length > 1 ? `Tu carga · ${pasos.length} tipos` : 'Tu carga',
      titulo: pasos[0].titulo, detalle: pasos[0].detalle, resaltes: pasos[0].resaltes, pasos,
      camara: { caja: { ...zona, z1: altoRacks }, desde: [1.0, 0.7, 0.55], hasta: [0.35, 0.8, 1.1], margen: 1.05 },
      duracion: pasos.reduce((t, x) => t + x.duracion, 0),
    });
  }

  // ─── 4. Altura sin aprovechar: posiciones y m² que quedan hacia arriba (solo con la altura del cliente) ───
  let altura4 = null;
  if (altura && modelos.length) {
    const holgura = DISTANCIAS.holguraTecho.valor;
    const libre = altura - altoRacks;
    const gruaDatos = { gruaLevante: bodega.gruaLevante, gruaKg: bodega.gruaKg };
    const conNiveles = (fn) => {
      const mods = modelos.map((mo) => ({ ...mo, niveles: Math.max(mo.niveles, fn(mo)), mezcla: [] }));
      return conteoTotal(racksAlDia(rs, mods, { pallets, grua: bodega.grua }).racks).posiciones;
    };
    const hoyPos = conteoTotal(rs).posiciones;
    const conGrua = conNiveles((mo) => nivelesMaximos(mo, { pallets, altura, grua: bodega.grua, gruaDatos })) - hoyPos;
    // Solo el techo manda (una grúa que llegue y levante lo que haga falta)
    const conTecho = conNiveles((mo) => nivelesMaximos(mo, { pallets, altura, grua: 'retractil', gruaDatos: { gruaLevante: 30, gruaKg: 99999 } })) - hoyPos;
    if (conTecho > 0 && libre > holgura + 0.5) {
      const porPos = areaOcupada(rs, bodega) / Math.max(1, hoyPos);
      const extra = conGrua > 0 ? conGrua : conTecho;
      const m2Eq = Math.round((extra * porPos) / 10) * 10;
      const eq = equipoDe(bodega);
      const titulo = `Te quedan ${fm(libre)} m libres sobre tus racks`;
      const detalle = conGrua > 0
        ? [`Ahí caben ${plural(conGrua, 'posición más', 'posiciones más')} con tu misma ${eq.nombre.toLowerCase()}.`]
        : [`Tu ${eq.nombre.toLowerCase()} llega a ${fm(eq.levante)} m: con un equipo de más alcance sumas ${plural(conTecho, 'posición', 'posiciones')}.`];
      if (m2Eq >= 10) detalle.push(`Es como sumar ${n(m2Eq)} m² de bodega sin moverte.`);
      if (conGrua > 0 && conTecho > conGrua) detalle.push(`Con un equipo de más alcance, hasta ${plural(conTecho, 'posición', 'posiciones')}.`);
      const resaltes = rs.map((r) => { const q = rectangulo(r); return { x0: q.x0, y0: q.y0, x1: q.x0 + q.ancho, y1: q.y0 + q.alto, z0: puntaRack(r) + 0.05, z1: altura - holgura, color: COLOR_ALTURA, tenue: true }; });
      const r0 = rs.reduce((a, r) => (puntaRack(r) >= puntaRack(a) ? r : a), rs[0]), q0 = rectangulo(r0);
      const cotas = [{ a: [q0.x0 + q0.ancho, q0.y0 + q0.alto + 0.3, puntaRack(r0)], b: [q0.x0 + q0.ancho, q0.y0 + q0.alto + 0.3, altura], texto: `${fm(libre)} m libres` }];
      altura4 = { libre, conGrua, conTecho, m2Eq };
      escenas.push({
        id: 'altura', kicker: 'Tu altura', titulo, detalle, resaltes, cotas,
        // La cámara parte baja, casi a ras de piso, y sube mostrando el espacio sobre los racks
        camara: { caja: { ...zona, z1: altura }, desde: [1.0, 0.18, 0.45], hasta: [0.75, 0.75, 0.95], margen: 1.06 },
        duracion: leer([titulo, ...detalle], 6400),
      });
    }
  }

  // ─── 5. Tu maquinaria y el aviso honesto ───
  {
    const eq = equipoDe(bodega);
    const nivelMax = Math.max(0, ...rs.map((r) => alturaUltimoNivel(r)));
    const kg = capacidadEnAltura(eq, nivelMax);
    const pesado = Math.max(0, ...pallets.filter((t) => (t.cantidad ?? 0) > 0).map((t) => t.peso || 0));
    const titulo = `${eq.nombre}: hasta ${fm(eq.levante)} m y ${n(eq.kg)} kg`;
    const detalle = [];
    if (nivelMax > 0) detalle.push(kg > 0 ? `Tu nivel más alto queda a ${fm(nivelMax)} m: ahí levanta unos ${n(kg)} kg${pesado ? ` y tu pallet más pesado tiene ${n(pesado)}` : ''}.` : `Tu nivel más alto queda a ${fm(nivelMax)} m, sobre lo que alcanza este equipo.`);
    detalle.push(`Pasillos de ${fm(eq.pasillo)} m para que opere${eq.propia ? ', con los datos de la placa que nos diste' : ', con valores típicos de este equipo'}.`);
    escenas.push({
      id: 'grua', kicker: 'Tu maquinaria', titulo, detalle, nota: AVISO_INGENIERIA,
      camara: { tipo: 'grua', caja: { ...zona, z1: altoRacks }, desde: [0.9, 0.55, 0.7], hasta: [0.6, 0.6, 1.0], margen: 0.9 },
      duracion: leer([titulo, ...detalle, AVISO_INGENIERIA], 8000, 10500),
    });
  }

  // ─── Cierre: posiciones, hoy vs propuesta (si la hay), crecimiento y la invitación a cotizar ───
  const g = vistasPorRol(p).gerencia;
  const ej = resumenEjecutivo(p);
  const pos = conteoTotal(rs).posiciones;
  const conRacklog = g.conRacklog || pos;
  // Hoy vs propuesta solo si el número tiene sentido: hoy > 0 y la propuesta crece; con un "hoy" muy chico el %
  // se dispara (de 10 a 448 = +4.380 %) y se muestra solo de cuánto a cuánto
  const hoy = g.hoy > 0 ? g.hoy : 0;
  const crece = hoy && conRacklog > hoy ? Math.round(((conRacklog - hoy) / hoy) * 100) : null;
  const detalle = [];
  if (hoy) detalle.push(crece !== null && crece <= 300 ? `Hoy tienes ${n(hoy)}${(p.racksHoy ?? []).length ? ' (lo que dibujaste)' : ''}: creces un ${n(crece)} %.` : `Hoy tienes ${n(hoy)}; con esta propuesta, ${n(conRacklog)}.`);
  if (ej.anosCubiertos >= 1 && ej.crecimiento > 0) detalle.push(`Cubre ${plural(ej.anosCubiertos, 'año', 'años')} creciendo un ${Math.round(ej.crecimiento * 100)} % al año.`);
  const ct = conteoTotal(rs);
  detalle.push(`${plural(rs.length, 'fila', 'filas')} de rack selectivo y ${plural(ct.cuerpos, 'cuerpo', 'cuerpos')}.`);
  const cta = 'Pide tu cotización formal: te respondemos en máximo 24 horas.';
  const titulo = `${n(conRacklog)} posiciones en tu bodega`;
  escenas.push({
    id: 'cierre', kicker: 'Tu propuesta', titulo, detalle, cta,
    camara: { caja: { ...b, z0: 0, z1: Math.max(altoRacks, altura ?? 0) }, desde: [0.9, 1.0, 1.1], hasta: [1.25, 0.9, 0.6], margen: 1.1 },
    duracion: leer([titulo, ...detalle, cta], 7600, 9500),
  });

  return {
    escenas,
    duracion: escenas.reduce((t, e) => t + e.duracion, 0),
    resumen: { posiciones: conRacklog, hoy, crece, anosCubiertos: ej.anosCubiertos, altura: altura4 },
  };
}
