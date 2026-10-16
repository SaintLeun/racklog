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
  // Un nivel de pallet cada (alto pallet + 200 mm); el primero va al piso
  const paso = altoPallet + 0.2;
  const nivelesY = Array.from({ length: nivelesViga }, (_, i) => (i + 1) * paso);
  const crudo = paso * (nivelesViga + 1);
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
  const primera = 0.1 + pallet.alto;                     // la primera cartela sobre el pallet de piso
  return {
    tipo: 'drivein',
    calles,
    fondos,
    anchoCalle: pallet.frente + 2 * 0.075 + 0.1,          // pallet + luces + pilar
    moduloFondo: pallet.fondo + 0.05,
    alto: paso * niveles + 0.2,                            // + luz de la riostra superior
    cartelasY: Array.from({ length: niveles - 1 }, (_, i) => primera + i * paso),
    pallet,
  };
}

// ─── Altillo (modelador: lib/altillo.mjs, simplificado) ───
// Estanteria de angulo ranurado por pisos: cada piso a 2350 mm con plataforma de tablero que cubre
// la estanteria mas un pasillo de 1 m al frente, baranda y una escalera que sube por el costado.
export const ALTILLO = { piso: 2.35, alturaArriba: 2.1, pasillo: 1, escaleraAncho: 0.8, anguloEscalera: 37 };

export function medidasAltillo(config = {}) {
  const pisos = Math.max(1, Math.min(2, Number(config.pisos) || 1));
  const niveles = Math.max(2, Math.min(8, Number(config.niveles) || 5));
  const reparto = (alto) => {
    const a = ANRA_SUELO + ANRA_BANDEJA / 2, b = alto - ANRA_BANDEJA / 2;
    return Array.from({ length: niveles }, (_, i) => a + (b - a) * (i / (niveles - 1)));
  };
  return {
    tipo: 'altillo',
    // Con 2 pisos la segunda escalera corre sobre la plataforma: la estanteria debe ser mas larga que ella
    cuerpos: Math.max(pisos > 1 ? 4 : 1, Math.min(30, Number(config.cuerpos) || 4)),
    doble: config.tipo === 'doble',
    pisos,
    frente: ANRA_FRENTE,
    fondo: mm(config.bandeja, 400),
    alto: ALTILLO.piso * pisos + ALTILLO.alturaArriba,
    // Cada tramo (planta baja y sobre cada piso) con sus bandejas, en alturas absolutas
    tramos: Array.from({ length: pisos + 1 }, (_, k) => {
      const base = k * ALTILLO.piso;
      const alto = k < pisos ? ALTILLO.piso - 0.02 : ALTILLO.alturaArriba;
      return { base, alto, nivelesY: reparto(alto).map((y) => base + y) };
    }),
    largoEscalera: ALTILLO.piso / Math.tan((ALTILLO.anguloEscalera * Math.PI) / 180),
    galvanizado: true,
  };
}

// ─── Huella en planta (m): lo que ocupa el rack en el piso, igual que lo dibuja construir.js ───
export const SEPARACION_DOBLE = 0.08;   // entre las dos filas de un selectivo doble
const ANCHO_PILAR = 0.1;

export function huella(m) {
  if (m.tipo === 'drivein') {
    return { largo: m.calles * m.anchoCalle + ANCHO_PILAR, fondo: m.fondos * m.moduloFondo };
  }
  if (m.tipo === 'altillo') {
    // Escalera al costado izquierdo, pasillo al frente y la estanteria detras
    return { largo: m.largoEscalera + m.cuerpos * m.frente, fondo: ALTILLO.pasillo + m.fondo * (m.doble ? 2 : 1) };
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
  if (m.tipo === 'altillo') return { bandejas: m.cuerpos * filas * m.tramos.reduce((t, tr) => t + tr.nivelesY.length, 0), pallets: 0 };
  if (m.tipo === 'anra') return { bandejas: m.cuerpos * m.nivelesY.length * filas, pallets: 0 };
  return { bandejas: 0, pallets: m.cuerpos * (m.nivelesY.length + (m.piso ? 1 : 0)) * m.palletsPorViga * filas };
}
