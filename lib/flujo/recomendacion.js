// Recomendacion por producto (prompt v2 §R3), segun docs/LOGICA-SELECCION-RACKS.md (BORRADOR por
// confirmar): filtros duros, mapa pallets por SKU × rotacion, alternativa calculada y mezcla de sistemas.
// Sin Vue. Los umbrales estan aqui arriba para ajustarlos sin tocar la logica.
import { resultadoModelo, nivelesMaximos } from './calculos.js';
import { medidasRack } from '../rack3d/planificador.js';
import { huella } from '../rack3d/medidas.js';
import { GRUAS } from '../rack3d/parametrosTecnicos.js';

export const UMBRALES = {
  selectivoHasta: 5,          // pallets por SKU: hasta esto, selectivo
  driveInDesde: 6,            // desde esto, drive-in (si pasa los filtros)
  driveInDesdeSinEspacio: 4,  // si falta espacio
  calleMinima: 0.5,           // drive-in: el SKU debe llenar al menos esta fraccion de una calle
  muchos: 20,                 // mas de esto: drive-in aunque rote harto
  confirmado: false,
};
const ROTACION = {
  baja: { t: 'menos de 1 vez por semana' },
  media: { t: '1 a 5 veces por semana' },
  alta: { t: 'más de 5 veces por semana' },
};
const NOMBRE = { RS: 'Rack selectivo', DI: 'Drive-in', AR: 'Ángulo ranurado' };
const n = (v) => Math.round(v).toLocaleString('es-CL');
const fm = (v) => (+(+v).toFixed(2)).toLocaleString('es-CL');
const NO_SE = { alto: 'el alto del pallet', peso: 'el peso del pallet', apilable: 'cuántas cajas aguanta apiladas', skus: 'cuántos productos distintos hay' };

// Modelo de un solo producto para comparar sistemas
function modeloDe(tipo, t, { bodega, pallets }) {
  const base = tipo === 'RS'
    ? { id: `rec-${t.id}-RS`, nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { [t.id]: t.cantidad } }
    : { id: `rec-${t.id}-DI`, nombre: 'Drive-in', tipo: 'DI', doble: false, niveles: 3, fondos: 5, cantidades: { [t.id]: t.cantidad } };
  base.niveles = nivelesMaximos(base, { pallets, altura: bodega.altura, grua: bodega.grua });
  if (tipo === 'DI') {
    // Fondo de calle segun cuanto hay por SKU (de 2 a 8 pallets de fondo)
    const porSku = t.cantidad / Math.max(1, t.skus || 1);
    base.fondos = Math.max(2, Math.min(8, Math.round(porSku / (base.niveles + 1)) || 2));
  }
  return base;
}

// Posiciones, cuerpos o calles y m² de piso (huella + la parte de pasillo que le toca)
function comparar(modelo, { bodega, pallets }) {
  const res = resultadoModelo(modelo, { pallets, grua: bodega.grua });
  const m = medidasRack({ ...res.r, cuerpos: res.modulos });
  const h = huella(m), g = GRUAS[bodega.grua] ?? GRUAS.contrapeso;
  // Selectivo doble: un pasillo por cada cara; drive-in: un pasillo al frente (medio a cada bloque vecino)
  const caras = modelo.tipo === 'RS' ? (modelo.doble ? 2 : 1) : 1;
  const m2 = h.largo * (h.fondo + (caras * g.pasillo) / 2);
  return { res, posiciones: res.capacidad, unidades: res.cuerpos, unidad: modelo.tipo === 'DI' ? 'calles' : 'cuerpos', m2, porM2: res.capacidad / m2 };
}

function configTexto(modelo, c) {
  const m = c.res.m;
  if (modelo.tipo === 'RS') {
    return `Selectivo ${modelo.doble ? 'doble' : 'simple'}, ${modelo.niveles} niveles + piso, viga ${fm(m.viga)} m, ${m.palletsPorViga} pallets por nivel → ${n(c.posiciones)} posiciones en ${c.unidades} cuerpos`;
  }
  return `Drive-in de ${c.unidades} calles × ${m.fondos} pallets de fondo, ${m.cartelasY.length + 1} niveles → ${n(c.posiciones)} posiciones`;
}

/**
 * Recomendacion por producto (tipo de pallet). respuestas = las del paso 1 (equipo, fifo, espacio, unidad).
 * Devuelve { productos: [...], flags, modelos } con, por producto:
 * { id, nombre, sistema, alternativa, config, porque, gano, descartes, confirmar, elegido, otra }
 */
export function recomendarProductos({ pallets = [], cajas = [], respuestas = {}, bodega = {}, flags: flagsIn = [] }) {
  const flags = new Set();
  const fifo = respuestas.fifo === 'estricto' || respuestas.fifo === 'lote';
  const sinEquipo = respuestas.equipo === 'manual' || respuestas.equipo === 'ninguno' || bodega.grua === 'manual';
  const umbral = respuestas.espacio === 'falta' ? UMBRALES.driveInDesdeSinEspacio : UMBRALES.driveInDesde;
  const contexto = { bodega: { altura: 8, grua: 'contrapeso', ...bodega }, pallets };

  // Pallets por producto que dijo en el paso 1 (si no puso cuantos SKU tiene cada tipo de pallet)
  const PORSKU = { '1-2': 1.5, '3-5': 4, '6-10': 8, '10+': 15 };
  const productos = pallets.filter((t) => t.cantidad > 0).map((t) => {
    const estimado = !(t.skus > 0) && PORSKU[respuestas.pallets_sku];
    const skus = estimado ? Math.max(1, Math.round(t.cantidad / PORSKU[respuestas.pallets_sku])) : Math.max(1, Math.round(t.skus || 1));
    const porSku = t.cantidad / skus;
    const rot = t.rotacion ?? 'media';
    const datos = `${t.nombre}: ${n(t.cantidad)} pallets${skus > 1 ? ` de ${skus} productos (${fm(porSku)} por producto)` : ''}, sale ${ROTACION[rot].t}, ${fm(t.alto)} m y ${n(t.peso)} kg`;
    const descartes = [];

    // Filtros duros para drive-in
    if (fifo) descartes.push(respuestas.fifo === 'lote' ? 'despachas por lote y el drive-in entrega lo último que entró' : 'tu producto exige que salga primero lo primero que entra (FIFO) y el drive-in entrega lo último que entró');
    if (sinEquipo) descartes.push(respuestas.equipo === 'ninguno' ? 'todavía no tienes equipo para entrar a las calles' : 'con apilador manual el operador tendría que entrar caminando a la calle');
    const di = comparar(modeloDe('DI', t, contexto), contexto);
    const porCalle = di.res.porCuerpo;
    if (porSku < porCalle * UMBRALES.calleMinima) descartes.push(`cada calle guarda ${porCalle} pallets de un solo producto y tienes ${fm(porSku)} por producto: las calles quedarían a medio usar`);

    // Mapa de decision
    let mapa = 'RS';
    if (porSku >= umbral && (rot !== 'alta' || porSku > UMBRALES.muchos)) mapa = 'DI';
    const sistema = mapa === 'DI' && descartes.length ? 'RS' : mapa;
    const alternativa = sistema === 'RS' ? 'DI' : 'RS';
    if (mapa === 'DI' && sistema === 'RS') flags.add('revisar_asesor');

    const rs = comparar(modeloDe('RS', t, contexto), contexto);
    const elegido = sistema === 'RS' ? rs : di, otra = sistema === 'RS' ? di : rs;
    const modeloElegido = modeloDe(sistema, t, contexto);

    const porque = [];
    if (sistema === 'DI') {
      porque.push(`Tienes ${fm(porSku)} pallets por producto y sale ${ROTACION[rot].t}: el drive-in los guarda uno detrás de otro y ahorra pasillos.`);
    } else if (mapa === 'DI') {
      porque.push(`Por cantidad convendría drive-in, pero lo descartamos porque ${descartes[0]}.`);
      porque.push('El selectivo te deja sacar cualquier pallet en cualquier orden.');
    } else if (rot === 'alta' && porSku >= umbral) {
      porque.push(`Sale ${ROTACION[rot].t}: necesitas llegar directo a cada pallet sin mover otros.`);
    } else {
      porque.push(`Con ${fm(porSku)} pallets por producto necesitas llegar a cualquiera sin mover otros.`);
    }
    const dif = Math.round(((elegido.porM2 - otra.porM2) / otra.porM2) * 100);
    const gano = sistema === 'DI'
      ? `Frente al selectivo: ${dif > 0 ? `${dif} % más posiciones por m²` : 'usa menos piso'} (${n(elegido.posiciones)} posiciones en ${n(elegido.m2)} m² contra ${n(otra.m2)} m²).`
      : `Frente al drive-in: acceso directo al 100 % de los pallets${fifo ? ' y respeta el FIFO' : ''}${dif < 0 ? `, aunque usa ${-dif} % menos posiciones por m²` : ''}.`;
    const confirmar = [
      ...(t.noSe ?? []).map((c) => NO_SE[c] ?? c),
      ...flagsIn.filter((f) => f.startsWith('no_se:')).map((f) => ({ equipo: 'el equipo', fifo: 'si vence o va por lote', rotacion: 'la rotación', espacio: 'el espacio' }[f.slice(6)])).filter(Boolean),
    ];
    if (estimado) confirmar.push(`cuántos productos distintos hay (estimamos ${skus} por lo que respondiste)`);
    if (t.caja && t.caja.apilable <= 1) confirmar.push('la caja no aguanta apilada: cada pallet va en su posición, sin apilar en piso');
    if (mapa === 'DI' && sistema === 'RS') confirmar.push('un ingeniero revisará si conviene otra alta densidad (push-back o doble profundidad)');

    return {
      id: t.id, nombre: t.nombre, datos, sistema, alternativa, mapa,
      config: configTexto(modeloElegido, elegido), configAlternativa: configTexto(modeloDe(alternativa, t, contexto), otra),
      porque, gano, descartes: sistema === 'RS' && mapa === 'RS' ? [] : descartes, confirmar: [...new Set(confirmar)],
      elegido: { posiciones: elegido.posiciones, unidades: elegido.unidades, unidad: elegido.unidad, m2: elegido.m2, m: elegido.res.m },
      otra: { posiciones: otra.posiciones, unidades: otra.unidades, unidad: otra.unidad, m2: otra.m2, m: otra.res.m },
      alto: t.alto,
    };
  });

  // Mezcla: un selectivo con todo lo que va a selectivo, un drive-in por alto de pallet y angulo para cajas
  const modelos = [];
  const aRS = productos.filter((x) => x.sistema === 'RS');
  if (aRS.length) {
    const m = { id: 'rec-RS', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: Object.fromEntries(pallets.map((t) => [t.id, aRS.some((x) => x.id === t.id) ? t.cantidad : 0])) };
    m.niveles = nivelesMaximos(m, { pallets, altura: contexto.bodega.altura, grua: contexto.bodega.grua });
    modelos.push(m);
  }
  const porAlto = new Map();
  productos.filter((x) => x.sistema === 'DI').forEach((x) => { const k = x.alto.toFixed(2); porAlto.set(k, [...(porAlto.get(k) ?? []), x]); });
  [...porAlto.values()].forEach((grupo, i) => {
    const t0 = pallets.find((t) => t.id === grupo[0].id);
    const m = modeloDe('DI', t0, contexto);
    m.id = `rec-DI-${i}`;
    m.nombre = porAlto.size > 1 ? `Drive-in ${i + 1}` : 'Drive-in';
    m.cantidades = Object.fromEntries(pallets.map((t) => [t.id, grupo.some((x) => x.id === t.id) ? t.cantidad : 0]));
    modelos.push(m);
  });
  if (cajas.length || respuestas.unidad === 'cajas') {
    modelos.push({ id: 'rec-AR', nombre: 'Ángulo ranurado', tipo: 'AR', doble: false, niveles: 5, bandeja: 0.4, frente: 0.92, cantidades: Object.fromEntries(cajas.map((c) => [c.id, c.cantidad])) });
  }
  return { productos, flags: [...flags], modelos };
}

export { NOMBRE as NOMBRE_SISTEMA };
