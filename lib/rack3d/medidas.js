import { RACK, VIGAS, DRIVE_IN, VIGA_PISO } from './parametrosTecnicos.js';

// Medidas de los racks para el visor 3D, en metros. Sin Vue ni three: lo usan el configurador
// de cotizacion y el planificador. Basado en el modelador de la intranet (lib/catalogo.js,
// lib/motorAnra.js), simplificado: sin perforaciones ni cotas.

const mm = (v, porDefecto) => {
  const n = parseInt(String(v ?? '').replace(/[^\d]/g, ''), 10);
  return (Number.isFinite(n) && n > 0 ? n : porDefecto) / 1000;
};

// ─── Rack selectivo ───
const ANCHO_PILAR = 0.1;

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
  const cuerpos = Math.max(1, Math.min(50, Number(config.cuerpos) || 1));

  // Viga (CA29): n pallets → n·frente + (n+1)·100 mm, de eje a eje de pilar (como el modelador de la
  // intranet): el cuerpo mide eso y entre las caras de los pilares queda la viga − 100
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
  // va a piso, salvo con viga a piso (apiladores, retráctil): entonces descansa en una viga a ~30 cm y todas
  // las cargas van sobre vigas. config.vigasY (m, centro de cada viga) permite moverlas a mano (Arma tu rack)
  const vigaPiso = !!config.vigaPiso;
  const nivelesY = [];
  let tope = 0;
  // La cara de arriba de cada viga sube a la perforacion siguiente (25 mm + k × 76,2 mm desde el piso)
  const P = RACK.pasoPerforado.valor, P0 = RACK.primeraPerforacion.valor;
  const aPerforacion = (t) => +(P0 + Math.ceil((t - P0) / P - 1e-6) * P).toFixed(4);
  if (vigaPiso) {
    tope = +(P0 + Math.round((VIGA_PISO.altura - P0) / P) * P).toFixed(4);
    nivelesY.push(+(tope - altoViga / 2).toFixed(4));
  }
  for (let i = 0; i < nivelesViga; i++) {
    tope = aPerforacion(tope + altosCarga[i] + altoViga + RACK.luzVigas.valor);
    nivelesY.push(+(tope - altoViga / 2).toFixed(4));
  }
  // Vigas movidas a mano: las mismas que las calculadas o, con viga a piso, todas menos la de piso (diseños de
  // antes de la viga a piso o hechos con otro equipo): no se pierden en silencio al cambiar de equipo
  const vy = Array.isArray(config.vigasY) && config.vigasY.every((y) => Number(y) > 0) ? config.vigasY : null;
  const desde = vy && vy.length === nivelesY.length ? 0 : vy && vigaPiso && vy.length === nivelesY.length - 1 ? 1 : -1;
  if (desde >= 0) vy.forEach((y, i) => { nivelesY[i + desde] = Math.max(+Number(y).toFixed(4), i + desde > 0 ? nivelesY[i + desde - 1] + 0.2 : 0); });
  const yv = nivelesY[nivelesY.length - 1] + altoViga / 2;   // cara de arriba de la ultima viga
  // Donde apoya cada carga (0 = piso) y el espacio libre que tiene hasta la viga de arriba
  const bases = vigaPiso ? nivelesY.map((y) => +(y + altoViga / 2).toFixed(4)) : [0, ...nivelesY.map((y) => +(y + altoViga / 2).toFixed(4))];
  const luzLibre = bases.slice(0, -1).map((b, i) => +(bases[i + 1] - altoViga - b).toFixed(4));
  // Alto del marco = ultima viga + sobrante (entre 300 y 1.000 mm). El pallet de arriba puede sobresalir
  const { min: sMin, max: sMax } = RACK.sobranteMarco;
  const sobrante = Math.min(sMax, Math.max(sMin, Number(config.sobrante) || sMin));
  const alto = +(yv + sobrante).toFixed(3);
  const sobresaleCarga = Math.max(0, +(yv + altosCarga[nivelesViga] - alto).toFixed(3));

  // Cuerpo túnel: sin pallets bajo `altoLibre` para que pase la grúa o la gente; su primera viga es más gruesa
  let tunel = null;
  if (config.tunel && Number(config.tunel.altoLibre) > 0) {
    // Sin cuerpo elegido (el del modelo, paso 3): al medio de la fila, donde acorta el recorrido; en la punta no sirve
    const elegido = config.tunel.cuerpo;
    const indice = Math.min(cuerpos - 1, Math.max(0, elegido == null || elegido === '' ? Math.floor((cuerpos - 1) / 2) : Math.round(Number(elegido) || 0)));
    const altoLibre = Number(config.tunel.altoLibre);
    // Alturas cuyo pallet quedaría dentro del paso libre (el piso siempre)
    const quitadas = bases.filter((b) => b < altoLibre).length;
    const vigaTunel = nivelesY[quitadas - (vigaPiso ? 0 : 1)];
    tunel = { indice, altoLibre, quitadas, altoViga: altoViga + 0.04, libreReal: vigaTunel != null ? +(vigaTunel - (altoViga + 0.04) / 2).toFixed(2) : null };
  }

  return {
    tipo: 'selectivo',
    cuerpos,
    altoViga,
    vigaModelo: perfil.modelo,          // perfil del motor (TC70 … 2BTC150)
    vigasManuales: desde >= 0,
    tunel,
    sobrante,
    sobresaleCarga,                     // cuánto sobresale la carga del último nivel sobre el marco
    altoConCarga: Math.max(alto, +(yv + altosCarga[nivelesViga]).toFixed(3)),
    luzLibre,                           // espacio de cada carga hasta la viga de arriba (sin la del último nivel)
    bases,                              // donde apoya cada carga (0 = piso)
    // Planos de carga por altura (0 = piso, sin plano): 'malla' | 'madera' | 'metal' | null
    planos: Array.from({ length: nivelesViga + 1 }, (_, i) => (i > 0 && ['malla', 'madera', 'metal'].includes(config.planos?.[i]) ? config.planos[i] : null)),
    doble: config.tipo === 'doble',
    viga,                               // de eje a eje de pilar = paso entre cuerpos
    libreViga: +(viga - ANCHO_PILAR).toFixed(3),   // entre las caras de los pilares (donde van los pallets)
    fondo: +(fondoPallet - 2 * RACK.voladizoPallet.valor).toFixed(3),   // CA22: fondo del marco = fondo pallet − 200
    kgPallet,
    alto,
    nivelesY,                           // altura del centro de cada viga
    altosCarga,                         // alto del pallet en cada altura (0 = piso)
    coloresCarga: Array.isArray(config.colores) ? config.colores.slice(0, nivelesViga + 1) : null,
    piso: !vigaPiso,                    // primer nivel de pallets apoyado en el piso (false: sobre la viga a piso)
    vigaPiso,
    palletsPorViga,
    pallet: { frente: frentePallet, fondo: fondoPallet, alto: altoPallet },
  };
}

// ─── Angulo ranurado (ANRA) ───
// Catalogo web del modelador de la intranet (docs/modelador-web.zip: angulo-ranurado.js). En la web el
// cliente elige pocas cosas: frente, fondo, repisas y cuerpos; la altura sale de su caja.
export const ANRA_FRENTES = [0.9, 0.92];              // 930 no existe en el cotizador AR
export const ANRA_FONDOS = [0.3, 0.4, 0.46, 0.6];
export const ANRA_ALTURA = { min: 1000, max: 3000, paso: 20 };   // mm, el angulo se corta cada 20 (perforacion)
export const ANRA_NIVELES = { min: 2, max: 8 };
// Largos de angulo del catalogo (m). Lo elige el cliente; por defecto 2,0 m, no el de 3 m (dueño 26-10-2026)
export const ANRA_ANGULOS = [2, 2.5, 3];
export const ANRA_ANGULO_DEFECTO = 2;
const ANRA_FRENTE = 0.92;
const ANRA_ESP = 2;           // espesor del angulo: suma 2 mm por lado al frente y al fondo de la bandeja
const ANRA_BANDEJA = 40;      // alto del perfil de bandeja (mm)
const ANRA_SUELO = 40;        // suelo → base de la bandeja inferior (mm)

// Altura estandar segun cuantos niveles lleva (catalogo: 2000 / 2500 / 3000 mm)
export function alturaAnra(niveles) {
  if (niveles <= 5) return 2;
  if (niveles <= 7) return 2.5;
  return 3;
}

// Reparto de las bandejas sobre la perforacion (motorAnra.repartirNiveles de la intranet), en mm: la de
// abajo apoya a 40 del suelo, la de arriba termina en el tope y el sobrante que no es multiplo de 20 va
// al nicho de abajo
export function repartirNiveles(altura, niveles) {
  const n = Math.max(2, Math.floor(niveles));
  const libre = altura - 120 - ANRA_BANDEJA * (n - 2);
  const nichos = n - 1;
  const base = ANRA_ALTURA.paso * Math.floor(libre / (ANRA_ALTURA.paso * nichos));
  const resto = libre - base * nichos;
  const bases = [];
  let y = ANRA_SUELO;
  for (let i = 0; i < n; i++) {
    if (i > 0) y += i === 1 ? base + resto : base;
    bases.push(y);
    y += ANRA_BANDEJA;
  }
  return { bases, nicho: base, valido: base >= ANRA_ALTURA.paso && altura % ANRA_ALTURA.paso === 0 };
}

const masCercano = (lista, v, porDefecto) => (Number(v) > 0 ? lista.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a)) : porDefecto);

// Niveles de carga del flujo (paso 4): cada uno con su bandeja, más la bandeja del tope que cierra el estante
// (nada va sobre el ángulo). Con 2 m caben hasta 7
export const ANRA_CARGA = { min: 1, max: 7 };

export function medidasAnra(config = {}) {
  // config.nivelesCarga (flujo): N niveles de carga = N + 1 bandejas. Si no viene, config.niveles son las bandejas
  // (cotizador y planificador de antes: la de arriba también se carga)
  const carga = Number(config.nivelesCarga) > 0 ? Math.max(ANRA_CARGA.min, Math.min(ANRA_CARGA.max, Math.round(Number(config.nivelesCarga)))) : null;
  const niveles = carga ? carga + 1 : Math.max(ANRA_NIVELES.min, Math.min(ANRA_NIVELES.max, Number(config.niveles) || 5));
  // Lo que llegue fuera de catalogo cae al permitido (1,2 m de antes → 0,92)
  const frente = ANRA_FRENTES.includes(Number(config.frente)) ? Number(config.frente) : ANRA_FRENTE;
  const fondo = masCercano(ANRA_FONDOS, mm(config.bandeja, 400), 0.4);
  // Altura: con la caja (config.altoEntre, m de centro a centro) el angulo justo para ese nicho, en la grilla
  // de 20 mm; sin dato, la estandar. Nunca mas de 3 m (excedeAlto avisa que esas repisas no caben)
  const entre = Number(config.altoEntre) > 0.1 ? Number(config.altoEntre) : null;
  const { min, max, paso } = ANRA_ALTURA;
  // Angulo elegido (config.altoAngulo, m): manda el alto y las repisas se reparten en el; si las cajas no caben
  // en ese angulo, excedeAlto. Sin angulo elegido, lo de antes (estandar por niveles o el justo para la caja)
  const angulo = Number(config.altoAngulo) > 0 ? Math.min(max, Math.max(min, Math.round(Number(config.altoAngulo) * 1000 / paso) * paso))
    : carga ? ANRA_ANGULO_DEFECTO * 1000 : null;
  let altoMm = angulo ?? Math.round(alturaAnra(niveles) * 1000), excedeAlto = false;
  if (entre) {
    const nicho = Math.ceil((entre * 1000 - ANRA_BANDEJA) / paso - 1e-6) * paso;
    const necesario = ANRA_SUELO + ANRA_BANDEJA * niveles + nicho * (niveles - 1);
    excedeAlto = necesario > (angulo ?? max);
    if (!angulo) altoMm = Math.min(max, Math.max(min, necesario));
  }
  const reparto = repartirNiveles(altoMm, niveles);
  const nivelesY = reparto.bases.map((b) => (b + ANRA_BANDEJA / 2) / 1000);
  if (carga && !reparto.valido) excedeAlto = true;   // los espacios no alcanzan ni una perforación
  return {
    tipo: 'anra',
    cuerpos: Math.max(1, Math.min(60, Number(config.cuerpos) || 1)),
    doble: config.tipo === 'doble',
    frente,
    fondo,
    // Cada cuerpo lleva sus 4 angulos (no se comparten): 920 → 924, 400 → 404
    frenteExt: (Math.round(frente * 1000) + 2 * ANRA_ESP) / 1000,
    fondoExt: (Math.round(fondo * 1000) + 2 * ANRA_ESP) / 1000,
    alto: altoMm / 1000,
    excedeAlto,
    nivelesY,
    altoEntre: niveles > 1 ? +(nivelesY[1] - nivelesY[0]).toFixed(3) : 0,
    // Niveles que guardan (sin la bandeja del tope si es del flujo), base de cada bandeja y espacio libre entre
    // bandejas (el de abajo puede tener hasta 18 mm más: el sobrante de la perforación)
    nivelesCarga: carga ?? niveles,
    bandejasY: reparto.bases.map((b) => b / 1000),
    espesorBandeja: ANRA_BANDEJA / 1000,
    nicho: reparto.nicho / 1000,
    galvanizado: config.pintado !== 'pintado',
  };
}

// ─── Drive-in (modelador: lib/driveIn.mjs, simplificado) ───
// Un bloque = calles lado a lado × pallets de fondo por calle, entrada por el frente. Pallet de
// 1000 × 1200 × 1200, luz pilar-pallet 75, luz pallet-cartela 100, viga superior 100 mm.
export function medidasDriveIn(config = {}) {
  const calles = Math.max(1, Math.min(50, Number(config.calles) || 3));
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
export const SEPARACION_DOBLE = RACK.separadorBastidor.valor;   // entre las dos filas de un selectivo doble
// Lo que el pallet sobresale del marco por delante y por detras (selectivo)
export const voladizoDe = (m) => (m.tipo === 'selectivo' ? Math.max(0, (m.pallet.fondo - m.fondo) / 2) : 0);
export function huella(m) {
  if (m.tipo === 'drivein') {
    return { largo: m.calles * m.anchoCalle + ANCHO_PILAR, fondo: m.fondos * m.moduloFondo };
  }
  if (m.tipo === 'anra') {
    return { largo: m.cuerpos * m.frenteExt, fondo: m.fondoExt * (m.doble ? 2 : 1) };
  }
  // En planta cuenta la carga: el pallet sobresale del marco por el frente (y por atras si es simple)
  return {
    largo: m.cuerpos * m.viga + ANCHO_PILAR,   // ejes a paso de viga + medio pilar en cada extremo
    fondo: (m.doble ? m.fondo * 2 + SEPARACION_DOBLE : m.fondo) + 2 * voladizoDe(m),
  };
}

// Posiciones de pallet (selectivo: incluye el nivel de piso) o bandejas (angulo ranurado)
export function capacidad(m) {
  const filas = m.doble ? 2 : 1;
  if (m.tipo === 'drivein') return { bandejas: 0, pallets: m.calles * m.fondos * (m.cartelasY.length + 1) };
  // bandejas: piezas (las que se cotizan); niveles: las que guardan cajas
  if (m.tipo === 'anra') return { bandejas: m.cuerpos * m.nivelesY.length * filas, niveles: m.cuerpos * (m.nivelesCarga ?? m.nivelesY.length) * filas, pallets: 0 };
  const total = m.cuerpos * (m.nivelesY.length + (m.piso ? 1 : 0)) * m.palletsPorViga * filas;
  return { bandejas: 0, pallets: total - (m.tunel ? m.tunel.quitadas * m.palletsPorViga * filas : 0) };
}
