// "Arma tu pallet": de la caja del cliente al pallet, y del pallet a la modulación del rack.
// Medidas en metros y kg. Valores de holgura y capacidad provisorios (parametrosTecnicos.js).
import { CAPACIDADES, DISTANCIAS } from '../rack3d/parametrosTecnicos.js';

export const BASES = [
  { v: '1200x1000', t: '1,2 × 1,0 m', frente: 1.0, fondo: 1.2 },
  { v: '1200x800', t: '1,2 × 0,8 m (europeo)', frente: 0.8, fondo: 1.2 },
  { v: '1000x1000', t: '1,0 × 1,0 m', frente: 1.0, fondo: 1.0 },
];
export const ALTO_BASE = 0.15;     // tarima de madera
export const PESO_BASE = 25;       // kg de la tarima
export const HOLGURA_NIVEL = 0.2;  // entre la carga y la viga de arriba (incluye viga)
export const ALTO_MAX_PALLET = 1.8;

/** Cómo entran las cajas en una cama: prueba las dos orientaciones y se queda con la que da más */
export function cama(base, caja) {
  const a = { cols: Math.floor(base.frente / caja.largo), filas: Math.floor(base.fondo / caja.ancho), largoEnFrente: true };
  const b = { cols: Math.floor(base.frente / caja.ancho), filas: Math.floor(base.fondo / caja.largo), largoEnFrente: false };
  const n = (o) => Math.max(0, o.cols) * Math.max(0, o.filas);
  const mejor = n(b) > n(a) ? b : a;
  return { ...mejor, cajas: n(mejor) };
}

/**
 * caja: { largo, ancho, alto } en m, peso kg, apilable (cajas de alto máx.)
 * altoMax: alto máximo del pallet cargado (m)
 */
export function armarPallet({ base, caja, pesoCaja, apilable, altoMax = ALTO_MAX_PALLET }) {
  const c = cama(base, caja);
  const porAltura = Math.floor((altoMax - ALTO_BASE + 1e-6) / caja.alto);
  const camas = Math.max(0, Math.min(apilable || 99, porAltura));
  const cajas = c.cajas * camas;
  const alto = ALTO_BASE + camas * caja.alto;
  const peso = PESO_BASE + cajas * pesoCaja;
  const limite = camas === apilable ? 'apilable' : 'altura';
  // Aprovechamiento de la base (área de cajas / área del pallet)
  const uso = c.cajas * caja.largo * caja.ancho / (base.frente * base.fondo);
  return { ...c, camas, cajas, alto, peso, limite, uso };
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

/** Ángulo ranurado: bandeja 0,92 m de frente; cuántas cajas y kg por bandeja */
export function armarBandeja({ fondo, caja, pesoCaja, apilable, altoEntreNiveles = 0.4 }) {
  const base = { frente: 0.92, fondo };
  const c = cama(base, caja);
  const camas = Math.max(0, Math.min(apilable || 99, Math.floor((altoEntreNiveles - 0.05) / caja.alto)));
  const cajas = c.cajas * camas;
  const peso = cajas * pesoCaja;
  return { ...c, camas, cajas, peso, capacidad: CAPACIDADES.bandejaAngulo.valor, uso: peso / CAPACIDADES.bandejaAngulo.valor };
}
