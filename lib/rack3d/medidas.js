import { RACK, VIGAS, DRIVE_IN } from './parametrosTecnicos.js';

// Medidas de los racks para el visor 3D, en metros. Sin Vue ni three: lo usan el configurador
// de cotizacion y el planificador. Basado en el modelador de la intranet (lib/catalogo.js,
// lib/motorAnra.js), simplificado: sin perforaciones ni cotas.

const mm = (v, porDefecto) => {
  const n = parseInt(String(v ?? '').replace(/[^\d]/g, ''), 10);
  return (Number.isFinite(n) && n > 0 ? n : porDefecto) / 1000;
};

// ─── Rack selectivo ───
/** Perfil de viga del motor (AS2): { modelo, alturaViga (mm) } para el peso por pallet y el largo de viga */
export function vigaDelMotor(kgPallet, palletsPorNivel, largoVigaMm) {
  const factor = palletsPorNivel === 1 ? 0.5 : palletsPorNivel === 2 ? 1 : 1.5;
  const W = kgPallet > 0 ? (kgPallet * factor * (largoVigaMm / 1000)) / 8 / 18 : 0;
  const modelo = (VIGAS.find(([wx]) => W <= wx) || VIGAS[VIGAS.length - 1])[1];
  return { modelo, alturaViga: /150/.test(modelo) ? 150 : /125/.test(modelo) ? 125 : /100/.test(modelo) ? 100 : 70, W };
}

// Mismas formulas que el resumen del configurador (QuoteModal): viga, marco y altura.
export function medidasSelectivo(config = {}) {
  const frentePallet = mm(config.frentePallet, 1000);
  const fondoPallet = mm(config.fondoPallet, 1000);
  const altoPallet = mm(config.altoPallet, 1000);
  const palletsPorViga = [1, 2, 3].includes(Number(config.palletsPerBeam)) ? Number(config.palletsPerBeam) : 2;
  const nivelesViga = Math.max(1, Math.min(15, Number(config.niveles) || 2));
  const cuerpos = Math.max(1, Math.min(30, Number(config.cuerpos) || 1));

  // Viga (CA29): n pallets → n·frente + (n+1)·100 mm
  const viga = +(palletsPorViga * frentePallet + (palletsPorViga + 1) * RACK.holguraViga.valor).toFixed(3);
  // Perfil de viga por carga (CA30, seleccion AS2 del motor)
  const kgPallet = Number(config.kgPallet) > 0 ? Number(config.kgPallet) : 800;
  const perfil = vigaDelMotor(kgPallet, palletsPorViga, viga * 1000);
  const altoViga = perfil.alturaViga / 1000;
  // Alto de carga por altura (0 = piso). Con pallets mezclados (config.altos) cada uno el suyo
  const altosCarga = Array.from({ length: nivelesViga + 1 }, (_, i) => {
    const v = Number(config.altos?.[i]);
    return v > 0.2 && v < 4 ? v : altoPallet;
  });
  // CA23: cada viga (su cara de arriba) a carga + alto de viga + 100 mm sobre la anterior; el primer pallet
  // va a piso. config.vigasY (m, centro de cada viga) permite moverlas a mano (Arma tu rack)
  const nivelesY = [];
  let tope = 0;
  for (let i = 0; i < nivelesViga; i++) {
    tope += altosCarga[i] + altoViga + RACK.luzVigas.valor;
    nivelesY.push(+(tope - altoViga / 2).toFixed(4));
  }
  const manual = Array.isArray(config.vigasY) && config.vigasY.length === nivelesViga && config.vigasY.every((y) => Number(y) > 0);
  if (manual) config.vigasY.forEach((y, i) => { nivelesY[i] = +Number(y).toFixed(4); });
  const yv = nivelesY[nivelesViga - 1] + altoViga / 2;   // cara de arriba de la ultima viga
  // Alto del marco = ultima viga + sobrante (entre 300 y 1.000 mm). El pallet de arriba puede sobresalir
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
    vigaModelo: perfil.modelo,          // perfil del motor (TC70 … 2BTC150)
    vigasManuales: manual,
    tunel,
    sobrante,
    sobresaleCarga,                     // cuánto sobresale la carga del último nivel sobre el marco
    altoConCarga: Math.max(alto, +(yv + altosCarga[nivelesViga]).toFixed(3)),
    luzLibre: nivelesY.map((y, i) => +((y - altoViga / 2) - (i ? nivelesY[i - 1] + altoViga / 2 : 0)).toFixed(4)),   // bajo cada viga   // lo que se compara con el techo
    // Planos de carga por altura (0 = piso, sin plano): 'malla' | 'madera' | 'metal' | null
    planos: Array.from({ length: nivelesViga + 1 }, (_, i) => (i > 0 && ['malla', 'madera', 'metal'].includes(config.planos?.[i]) ? config.planos[i] : null)),
    doble: config.tipo === 'doble',
    viga,
    fondo: +(fondoPallet - 2 * RACK.voladizoPallet.valor).toFixed(3),   // CA22: fondo del marco = fondo pallet − 200
    kgPallet,
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
  const primera = ANRA_SUELO + ANRA_BANDEJA / 2;
  // Altura entre repisas segun la caja (config.altoEntre, m): el angulo es el estandar que alcanza
  // (2 / 2,5 / 3 m) y las bandejas van a ese paso; sin dato, repartidas parejo en la altura estandar
  const entre = Number(config.altoEntre) > 0.1 ? Number(config.altoEntre) : null;
  const necesario = entre ? primera + (niveles - 1) * entre + ANRA_BANDEJA / 2 : 0;
  const alto = entre ? ([2, 2.5, 3].find((a) => a >= necesario - 1e-6) ?? +necesario.toFixed(2)) : alturaAnra(niveles);
  const ultima = alto - ANRA_BANDEJA / 2;
  const nivelesY = Array.from({ length: niveles }, (_, i) => (entre ? primera + i * entre : primera + (ultima - primera) * (i / (niveles - 1))));
  return {
    tipo: 'anra',
    cuerpos: Math.max(1, Math.min(30, Number(config.cuerpos) || 1)),
    doble: config.tipo === 'doble',
    frente: [0.92, 1.2].includes(Number(config.frente)) ? Number(config.frente) : ANRA_FRENTE,
    fondo: mm(config.bandeja, 400),
    alto,
    nivelesY,
    altoEntre: entre ?? (niveles > 1 ? (ultima - primera) / (niveles - 1) : 0),
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
  // Pallet del cliente (m) o el del cotizador DI (1000 × 1200 × 1400)
  const pallet = {
    frente: Number(config.palletFrente) > 0 ? Number(config.palletFrente) : 1,
    fondo: Number(config.palletFondo) > 0 ? Number(config.palletFondo) : 1.2,
    alto: Number(config.palletAlto) > 0 ? Number(config.palletAlto) : 1.4,
  };
  const K = DRIVE_IN, ap = Math.round(pallet.alto * 1000), v = K.alturaViga;
  const paso = ap + K.luzPalletCartela + v;
  // Primera cartela sobre el pallet de piso; la grua entra a la calle por debajo de ella: manda la mas alta
  const porPallet = K.luzPalletPrimeraCartela + ap;
  const porGrua = Number(config.primerNivel) > 0 ? Math.round(Number(config.primerNivel) * 1000) : 0;
  const primera = Math.max(porPallet, porGrua);
  // Alto del marco (cotizador DI): base y la luz de la riostra superior que lo deja en un multiplo de 100
  const base = paso * niveles + K.luzPalletPrimeraCartela - v + (primera - porPallet);
  const luz = K.luzRiostraSuperior.find((l) => (base + l) % 100 === 0) ?? K.luzRiostraSuperior[0];
  // Calle: pallet + 2 × 75 + pilar; o la grua con 100 mm por lado
  const librePallet = Math.round(pallet.frente * 1000) + 2 * K.luzPilarPallet;
  const libreGrua = Number(config.anchoGrua) > 0 ? Math.round(Number(config.anchoGrua) * 1000) + 200 : 0;
  // Fondo del bloque: el primer fondo estandar que cabe (pallet + 20 de tolerancia por pallet)
  const req = (Math.round(pallet.fondo * 1000) + K.toleranciaFondo) * fondos;
  const fondoMm = K.fondoEstandar.find((f) => req <= f) ?? req;
  return {
    tipo: 'drivein',
    calles,
    fondos,
    anchoCalle: (Math.max(librePallet, libreGrua) + K.anchoPilar) / 1000,
    moduloFondo: fondoMm / fondos / 1000,
    fondoBloque: fondoMm / 1000,
    alto: (base + luz) / 1000,
    luzRiostraSuperior: luz / 1000,
    primerNivel: primera / 1000,
    primerNivelPorGrua: porGrua > porPallet,
    calleAnchaPorGrua: libreGrua > librePallet,
    cartelasY: Array.from({ length: niveles - 1 }, (_, i) => (primera + i * paso) / 1000),
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
