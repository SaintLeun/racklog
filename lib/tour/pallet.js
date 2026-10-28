// "Arma tu pallet": de la caja del cliente al pallet, y del pallet a la modulación del rack.
// Medidas en metros y kg. Valores de holgura y capacidad provisorios (parametrosTecnicos.js).
import { CAPACIDADES, DISTANCIAS, RACK } from '../rack3d/parametrosTecnicos.js';

export const BASES = [
  { v: '1200x1000', t: '1,2 × 1,0 m', frente: 1.0, fondo: 1.2 },
  { v: '1200x800', t: '1,2 × 0,8 m (europeo)', frente: 0.8, fondo: 1.2 },
  { v: '1000x1000', t: '1,0 × 1,0 m', frente: 1.0, fondo: 1.0 },
];
export const ALTO_BASE = 0.15;     // tarima de madera
export const PESO_BASE = 25;       // kg de la tarima
// Estimacion del tour: luz de 100 mm sobre la carga (CA23, confirmada) + una viga tipica de 100 mm.
// El rack definitivo lo calcula medidasSelectivo (perfil real y vigas en las perforaciones)
export const HOLGURA_NIVEL = RACK.luzVigas.valor + 0.1;
export const ALTO_MAX_PALLET = 1.8;
export const VOLADIZO_CAJA = 0;    // m que la caja puede sobresalir del pallet por lado (0: no sobresale)

/** Las dos orientaciones de la caja en una cama (largo de la caja al frente o al fondo) */
// Cuantas cajas de `lado` caben en `largo` (+ el voladizo permitido por lado). Con margen de redondeo:
// 1,2 / 0,4 da 2,9999… en coma flotante y sin el margen entraban 2 en vez de 3
const caben = (largo, lado, voladizo = 0) => (lado > 0 ? Math.floor((largo + 2 * voladizo) / lado + 1e-6) : 0);

export function orientaciones(base, caja, voladizo = VOLADIZO_CAJA) {
  const n = (o) => Math.max(0, o.cols) * Math.max(0, o.filas);
  return [
    { cols: caben(base.frente, caja.largo, voladizo), filas: caben(base.fondo, caja.ancho, voladizo), largoEnFrente: true },
    { cols: caben(base.frente, caja.ancho, voladizo), filas: caben(base.fondo, caja.largo, voladizo), largoEnFrente: false },
  ].map((o) => ({ ...o, cajas: n(o) }));
}

/**
 * Cómo entran las cajas en una cama: la orientación pedida (largoEnFrente true/false) o, sin pedir,
 * la que da más
 */
export function cama(base, caja, largoEnFrente) {
  const [a, b] = orientaciones(base, caja);
  if (largoEnFrente === true) return a;
  if (largoEnFrente === false) return b;
  return b.cajas > a.cajas ? b : a;
}

/**
 * caja: { largo, ancho, alto } en m, peso kg, apilable (cajas de alto máx.)
 * altoMax: alto máximo del pallet cargado (m)
 */
/** @param {{ base: { frente: number, fondo: number }, caja: { largo: number, ancho: number, alto: number }, pesoCaja: number, apilable: number, altoMax?: number, largoEnFrente?: boolean }} datos */
export function armarPallet({ base, caja, pesoCaja, apilable, altoMax = ALTO_MAX_PALLET, largoEnFrente }) {
  const c = cama(base, caja, largoEnFrente);
  const porAltura = caben(altoMax - ALTO_BASE, caja.alto);
  const camas = Math.max(0, Math.min(apilable || 99, porAltura));
  const cajas = c.cajas * camas;
  const alto = ALTO_BASE + camas * caja.alto;
  const peso = PESO_BASE + cajas * pesoCaja;
  const limite = camas === apilable ? 'apilable' : 'altura';
  // Aprovechamiento de la base (área de cajas / área del pallet)
  const uso = c.cajas * caja.largo * caja.ancho / (base.frente * base.fondo);
  // Densidad de la carga (kg/m³): peso de las cajas sobre el volumen que ocupan en el pallet
  const volumen = base.frente * base.fondo * camas * caja.alto;
  const densidad = volumen > 0 ? (cajas * pesoCaja) / volumen : 0;
  return { ...c, camas, cajas, alto, peso, limite, uso, densidad };
}

/** Del pallet al rack selectivo: paso entre niveles, niveles que caben, carga por par de vigas */
export function modularSelectivo({ pallet, alturaLibre, levanteGrua, palletsPorViga = 2, totalPallets }) {
  const paso = pallet.alto + HOLGURA_NIVEL;
  const techoUtil = (alturaLibre ?? 99) - DISTANCIAS.holguraTecho.valor;
  // Nivel 0 en el piso; la viga del nivel n queda a n·paso. La carga del nivel n llega a n·paso + alto
  const porTecho = Math.max(0, Math.floor((techoUtil - pallet.alto) / paso));
  const porGrua = levanteGrua == null ? Infinity : Math.max(0, Math.floor(levanteGrua / paso));
  const niveles = Math.min(porTecho, porGrua, 8);
  const alturas = niveles + 1;                    // contando el piso
  const limitadoPor = porGrua < porTecho ? 'grua' : 'techo';
  const cargaParVigas = palletsPorViga * pallet.peso;
  const capacidad = CAPACIDADES.selectivoParVigas.valor;
  const porCuerpo = palletsPorViga * alturas;
  const cuerpos = totalPallets ? Math.ceil(totalPallets / porCuerpo) : null;
  const viga = palletsPorViga === 3 ? 3 * pallet.frente + 0.4 : 2 * pallet.frente + 0.3;
  return {
    paso, niveles, alturas, limitadoPor, viga,
    alturaUltimaViga: niveles * paso,
    cargaParVigas, capacidad, uso: cargaParVigas / capacidad,
    porCuerpo, cuerpos,
  };
}

// ─── Importación: cuánto trae un contenedor ───
// Medidas interiores y carga útil típicas (referenciales; varía por naviera)
export const CONTENEDORES = {
  c20: { t: "20'", largo: 5.9, ancho: 2.35, alto: 2.39, carga: 28000, pallets: 10 },
  c40: { t: "40'", largo: 12.03, ancho: 2.35, alto: 2.39, carga: 26500, pallets: 21 },
  c40hc: { t: "40' HC", largo: 12.03, ancho: 2.35, alto: 2.69, carga: 26500, pallets: 21 },
};

/** Cajas sueltas que caben en un contenedor: mejor de las 6 orientaciones, tope por peso */
export function cajasPorContenedor(tipo, caja, pesoCaja, apilable = 99) {
  const c = CONTENEDORES[tipo];
  const d = [caja.largo, caja.ancho, caja.alto];
  // Caja parada (como viene) y sin pasar lo que aguanta de alto
  const perms = [[0, 1, 2], [1, 0, 2]];
  let mejor = 0;
  for (const [a, b, h] of perms) {
    const n = Math.floor(c.largo / d[a]) * Math.floor(c.ancho / d[b]) * Math.min(apilable || 99, Math.floor(c.alto / d[h]));
    if (n > mejor) mejor = n;
  }
  const porPeso = pesoCaja > 0 ? Math.floor(c.carga / pesoCaja) : Infinity;
  return { cajas: Math.min(mejor, porPeso), limitadoPorPeso: porPeso < mejor };
}

/**
 * Demanda por importacion (como el tour): cuantas cajas conviven en bodega en el peak, cuantos pallets
 * son, posiciones necesarias con margen y cuantas faltan respecto de las que ya tiene; mas 1 y 2 años
 * con el crecimiento anual. semanasBodega: cuanto tarda en salir una llegada.
 */
export function demandaImportacion({ contenedor = 'c40', nContenedores = 1, cajasPorContenedor: cpc = null, caja, pesoCaja = 0, apilable = 99,
  semanasEntre = 8, semanasBodega = 8, cajasPorPallet, actuales = 0, margen = 0.1, crecimiento = 0.2 }) {
  const juntas = Math.max(1, Math.ceil((semanasBodega || 1) / (semanasEntre || 1)));
  const porCont = cpc || cajasPorContenedor(contenedor, caja, pesoCaja, apilable).cajas;
  const cajas = (nContenedores || 0) * porCont * juntas;
  const pallets = cajasPorPallet > 0 ? Math.ceil(cajas / cajasPorPallet) : 0;
  const necesarias = Math.ceil(pallets * (1 + (margen || 0)));
  const aCrecer = Math.max(0, necesarias - (actuales || 0));
  const en1 = Math.ceil(necesarias * (1 + crecimiento)), en2 = Math.ceil(necesarias * (1 + crecimiento) ** 2);
  return { juntas, porContenedor: porCont, cajas, pallets, necesarias, aCrecer, en1, en2 };
}

/** Ángulo ranurado: bandeja 0,92 m de frente; cuántas cajas y kg por bandeja */
export function armarBandeja({ fondo, caja, pesoCaja, apilable, altoEntreNiveles = 0.4 }) {
  const base = { frente: 0.92, fondo };
  const c = cama(base, caja);
  const camas = Math.max(0, Math.min(apilable || 99, Math.floor((altoEntreNiveles - 0.05) / caja.alto)));
  const cajas = c.cajas * camas;
  const peso = cajas * pesoCaja;
  return { ...c, camas, cajas, peso, capacidad: CAPACIDADES.bandejaAngulo.valor, uso: peso / CAPACIDADES.bandejaAngulo.valor };
}

/**
 * Selectivo y drive-in se definen solo con frente, fondo, alto y peso del pallet cargado (dueño 27-10): el
 * armado caja por caja quedó para el ángulo ranurado. Un diseño guardado o un link con un pallet armado
 * desde cajas pasa a alto y peso directos (los que salían de su armado, si la caja era válida). Cambia
 * los pallets en el lugar y devuelve cuántos cambió.
 */
export function palletsSinCajas(pallets) {
  let n = 0;
  (pallets || []).forEach((t) => {
    if (!t || !t.desdeCaja) return;
    const c = t.caja;
    if (c && c.largo > 0 && c.ancho > 0 && c.alto > 0 && t.frente > 0 && t.fondo > 0) {
      const lef = c.orientacion === 'largo' ? true : c.orientacion === 'ancho' ? false : undefined;
      const a = armarPallet({ base: { frente: t.frente, fondo: t.fondo }, caja: c, pesoCaja: Number(c.peso) || 0, apilable: c.apilable || 1, largoEnFrente: lef });
      if (a.cajas > 0) { t.alto = +a.alto.toFixed(2); t.peso = Math.round(a.peso); }
    }
    t.desdeCaja = false;
    delete t.caja;
    delete t.importacion;
    n++;
  });
  return n;
}
