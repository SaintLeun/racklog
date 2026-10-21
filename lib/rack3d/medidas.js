import { RACK } from './parametrosTecnicos.js';

// Medidas de los racks para el visor 3D, en metros. Sin Vue ni three: lo usan el configurador
// de cotizacion y el planificador. Basado en el modelador de la intranet (lib/catalogo.js,
// lib/motorAnra.js), simplificado: sin perforaciones ni cotas.

const mm = (v, porDefecto) => {
  const n = parseInt(String(v ?? '').replace(/[^\d]/g, ''), 10);
  return (Number.isFinite(n) && n > 0 ? n : porDefecto) / 1000;
};

// ─── Rack selectivo ───
// Mismas formulas que el resumen del configurador (QuoteModal): viga, marco y altura.
export function medidasSelectivo(config = {}) {
  const frentePallet = mm(config.frentePallet, 1000);
  const fondoPallet = mm(config.fondoPallet, 1000);
  const altoPallet = mm(config.altoPallet, 1000);
  const palletsPorViga = [1, 2, 3].includes(Number(config.palletsPerBeam)) ? Number(config.palletsPerBeam) : 2;
  const nivelesViga = Math.max(1, Math.min(15, Number(config.niveles) || 2));
  const cuerpos = Math.max(1, Math.min(30, Number(config.cuerpos) || 1));

  // Viga: n pallets → n·frente + (n+1)·100 mm (1 → +200, 2 → +300, 3 → +400)
  const viga = +(palletsPorViga * frentePallet + (palletsPorViga + 1) * RACK.holguraViga.valor).toFixed(3);
  // Perfil de viga (alto, m) — PROVISORIO: más larga, más alta. Lo confirma Técnica Racklog
  const altoViga = palletsPorViga === 3 ? 0.12 : 0.1;
  // Un nivel de pallet cada (alto pallet + 200 mm); el primero va al piso.
  // Con pallets mezclados (config.altos: alto por altura, 0 = piso) cada viga se pone sobre el pallet de abajo
  const altosCarga = Array.from({ length: nivelesViga + 1 }, (_, i) => {
    const v = Number(config.altos?.[i]);
    return v > 0.2 && v < 4 ? v : altoPallet;
  });
  const nivelesY = [];
  let yv = 0;
  for (let i = 0; i < nivelesViga; i++) { yv += altosCarga[i] + 0.2; nivelesY.push(+yv.toFixed(3)); }
  // Alto del marco = última viga + sobrante (mínimo 300 mm). El pallet del último nivel puede sobresalir del marco
  // Sobrante de marco viable: entre 300 y 1.000 mm
  const sobrante = Math.min(1.0, Math.max(0.3, Number(config.sobrante) || 0.3));
  const alto = +(yv + sobrante).toFixed(3);
  const sobresaleCarga = Math.max(0, +(yv + altosCarga[nivelesViga] - alto).toFixed(3));

  // Cuerpo túnel: sin pallets bajo `altoLibre` para que pase la grúa o la gente; su primera viga es más gruesa
  let tunel = null;
  if (config.tunel && Number(config.tunel.altoLibre) > 0) {
    const indice = Math.min(cuerpos - 1, Math.max(0, Math.round(Number(config.tunel.cuerpo) || 0)));
    const altoLibre = Number(config.tunel.altoLibre);
    // Alturas cuyo pallet quedaría dentro del paso libre (el piso siempre)
    const bases = [0, ...nivelesY];
    const quitadas = bases.filter((b) => b < altoLibre).length;
    const vigaTunel = nivelesY[quitadas - 1];
    tunel = { indice, altoLibre, quitadas, altoViga: altoViga + 0.04, libreReal: vigaTunel != null ? +(vigaTunel - (altoViga + 0.04) / 2).toFixed(2) : null };
  }

  return {
    tipo: 'selectivo',
    cuerpos,
    altoViga,
    tunel,
    sobrante,
    sobresaleCarga,                     // cuánto sobresale la carga del último nivel sobre el marco
    altoConCarga: Math.max(alto, +(yv + altosCarga[nivelesViga]).toFixed(3)),   // lo que se compara con el techo
    // Planos de carga por altura (0 = piso, sin plano): 'malla' | 'madera' | 'metal' | null
    planos: Array.from({ length: nivelesViga + 1 }, (_, i) => (i > 0 && ['malla', 'madera', 'metal'].includes(config.planos?.[i]) ? config.planos[i] : null)),
    doble: config.tipo === 'doble',
    viga,
    fondo: +(fondoPallet - 2 * RACK.voladizoPallet.valor).toFixed(3),   // fondo del marco: el pallet sobresale por delante y por detras
    alto,
    nivelesY,                           // altura del centro de cada viga
    altosCarga,                         // alto del pallet en cada altura (0 = piso)
    coloresCarga: Array.isArray(config.colores) ? config.colores.slice(0, nivelesViga + 1) : null,
    piso: true,                         // primer nivel de pallets apoyado en el piso
    palletsPorViga,
    pallet: { frente: frentePallet, fondo: fondoPallet, alto: altoPallet },
  };
}

// ─── Angulo ranurado (ANRA) ───
const ANRA_FRENTE = 0.92;     // frente de bandeja estandar (tambien hay de 1,2 m)
const ANRA_BANDEJA = 0.04;    // alto del perfil de bandeja
const ANRA_SUELO = 0.04;      // suelo → base de la bandeja inferior

// Altura estandar segun cuantos niveles lleva (catalogo: 2000 / 2500 / 3000 mm)
export function alturaAnra(niveles) {
  if (niveles <= 5) return 2;
  if (niveles <= 7) return 2.5;
  return 3;
}

export function medidasAnra(config = {}) {
  const niveles = Math.max(2, Math.min(10, Number(config.niveles) || 5));
  const alto = alturaAnra(niveles);
  // Bandejas repartidas: la inferior a 40 mm del suelo, la superior al ras del angulo
  const primera = ANRA_SUELO + ANRA_BANDEJA / 2;
  const ultima = alto - ANRA_BANDEJA / 2;
  const nivelesY = Array.from({ length: niveles }, (_, i) => primera + (ultima - primera) * (i / (niveles - 1)));
  return {
    tipo: 'anra',
    cuerpos: Math.max(1, Math.min(30, Number(config.cuerpos) || 1)),
    doble: config.tipo === 'doble',
    frente: [0.92, 1.2].includes(Number(config.frente)) ? Number(config.frente) : ANRA_FRENTE,
    fondo: mm(config.bandeja, 400),
    alto,
    nivelesY,
    galvanizado: config.pintado !== 'pintado',
  };
}

// ─── Drive-in (modelador: lib/driveIn.mjs, simplificado) ───
// Un bloque = calles lado a lado × pallets de fondo por calle, entrada por el frente. Pallet de
// 1000 × 1200 × 1200, luz pilar-pallet 75, luz pallet-cartela 100, viga superior 100 mm.
export function medidasDriveIn(config = {}) {
  const calles = Math.max(1, Math.min(30, Number(config.calles) || 3));
  const fondos = Math.max(2, Math.min(12, Number(config.fondos) || 4));
  const niveles = Math.max(1, Math.min(5, Number(config.niveles) || 3));
  const pallet = { frente: 1, fondo: 1.2, alto: 1.2 };
  const paso = pallet.alto + 0.1 + 0.1;                 // pallet + luz a la cartela + viga
  // La primera cartela va sobre el pallet de piso, pero la grúa entra a la calle por debajo de ella:
  // manda la que sea más alta (ver primerNivelDriveIn en operacion.js)
  const porPallet = 0.1 + pallet.alto;
  const porGrua = Number(config.primerNivel) > 0 ? Number(config.primerNivel) : 0;
  const primera = Math.max(porPallet, porGrua);
  // Ancho libre entre pilares: el pallet con sus luces, o la grúa con 100 mm por lado
  const librePallet = pallet.frente + 2 * 0.075;
  const libreGrua = Number(config.anchoGrua) > 0 ? Number(config.anchoGrua) + 0.2 : 0;
  return {
    tipo: 'drivein',
    calles,
    fondos,
    anchoCalle: Math.max(librePallet, libreGrua) + 0.1,   // + pilar
    moduloFondo: pallet.fondo + 0.05,
    alto: primera + 0.1 + (niveles - 1) * paso + 0.2,      // + luz de la riostra superior
    primerNivel: primera,
    primerNivelPorGrua: porGrua > porPallet,
    calleAnchaPorGrua: libreGrua > librePallet,
    cartelasY: Array.from({ length: niveles - 1 }, (_, i) => primera + i * paso),
    pallet,
  };
}

// ─── Huella en planta (m): lo que ocupa el rack en el piso, igual que lo dibuja construir.js ───
export const SEPARACION_DOBLE = RACK.separadorFila.valor;   // entre las dos filas de un selectivo doble
// Lo que el pallet sobresale del marco por delante y por detras (selectivo)
export const voladizoDe = (m) => (m.tipo === 'selectivo' ? Math.max(0, (m.pallet.fondo - m.fondo) / 2) : 0);
const ANCHO_PILAR = 0.1;

export function huella(m) {
  if (m.tipo === 'drivein') {
    return { largo: m.calles * m.anchoCalle + ANCHO_PILAR, fondo: m.fondos * m.moduloFondo };
  }
  if (m.tipo === 'anra') {
    return { largo: m.cuerpos * m.frente, fondo: m.fondo * (m.doble ? 2 : 1) };
  }
  // En planta cuenta la carga: el pallet sobresale del marco por el frente (y por atras si es simple)
  return {
    largo: m.cuerpos * (m.viga + ANCHO_PILAR) + ANCHO_PILAR,
    fondo: (m.doble ? m.fondo * 2 + SEPARACION_DOBLE : m.fondo) + 2 * voladizoDe(m),
  };
}

// Posiciones de pallet (selectivo: incluye el nivel de piso) o bandejas (angulo ranurado)
export function capacidad(m) {
  const filas = m.doble ? 2 : 1;
  if (m.tipo === 'drivein') return { bandejas: 0, pallets: m.calles * m.fondos * (m.cartelasY.length + 1) };
  if (m.tipo === 'anra') return { bandejas: m.cuerpos * m.nivelesY.length * filas, pallets: 0 };
  const total = m.cuerpos * (m.nivelesY.length + (m.piso ? 1 : 0)) * m.palletsPorViga * filas;
  return { bandejas: 0, pallets: total - (m.tunel ? m.tunel.quitadas * m.palletsPorViga * filas : 0) };
}
