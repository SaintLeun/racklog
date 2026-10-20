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
  const palletsPorViga = config.palletsPerBeam === 3 ? 3 : 2;
  const nivelesViga = Math.max(1, Math.min(15, Number(config.niveles) || 2));
  const cuerpos = Math.max(1, Math.min(30, Number(config.cuerpos) || 1));

  // Viga: 2 pallets → 2·frente + 300 mm; 3 pallets → 3·frente + 400 mm
  const viga = palletsPorViga === 3 ? 3 * frentePallet + 0.4 : 2 * frentePallet + 0.3;
  // Un nivel de pallet cada (alto pallet + 200 mm); el primero va al piso.
  // Con pallets mezclados (config.altos: alto por altura, 0 = piso) cada viga se pone sobre el pallet de abajo
  const altosCarga = Array.from({ length: nivelesViga + 1 }, (_, i) => {
    const v = Number(config.altos?.[i]);
    return v > 0.2 && v < 4 ? v : altoPallet;
  });
  const nivelesY = [];
  let yv = 0;
  for (let i = 0; i < nivelesViga; i++) { yv += altosCarga[i] + 0.2; nivelesY.push(+yv.toFixed(3)); }
  const crudo = yv + altosCarga[nivelesViga] + 0.2;
  let alto = Math.ceil(crudo / 0.5) * 0.5;
  if (alto >= 8) alto = Math.ceil((crudo + 0.3) / 0.5) * 0.5;

  return {
    tipo: 'selectivo',
    cuerpos,
    doble: config.tipo === 'doble',
    viga,
    fondo: fondoPallet + 0.1,          // fondo del marco: (fondo pallet − 200) + 300
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
const ANRA_FRENTE = 0.92;     // frente de bandeja estandar
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
    frente: ANRA_FRENTE,
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
export const SEPARACION_DOBLE = 0.08;   // entre las dos filas de un selectivo doble
const ANCHO_PILAR = 0.1;

export function huella(m) {
  if (m.tipo === 'drivein') {
    return { largo: m.calles * m.anchoCalle + ANCHO_PILAR, fondo: m.fondos * m.moduloFondo };
  }
  if (m.tipo === 'anra') {
    return { largo: m.cuerpos * m.frente, fondo: m.fondo * (m.doble ? 2 : 1) };
  }
  return {
    largo: m.cuerpos * (m.viga + ANCHO_PILAR) + ANCHO_PILAR,
    fondo: m.doble ? m.fondo * 2 + SEPARACION_DOBLE : m.fondo,
  };
}

// Posiciones de pallet (selectivo: incluye el nivel de piso) o bandejas (angulo ranurado)
export function capacidad(m) {
  const filas = m.doble ? 2 : 1;
  if (m.tipo === 'drivein') return { bandejas: 0, pallets: m.calles * m.fondos * (m.cartelasY.length + 1) };
  if (m.tipo === 'anra') return { bandejas: m.cuerpos * m.nivelesY.length * filas, pallets: 0 };
  return { bandejas: 0, pallets: m.cuerpos * (m.nivelesY.length + (m.piso ? 1 : 0)) * m.palletsPorViga * filas };
}
