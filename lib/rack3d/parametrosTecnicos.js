// Parametros tecnicos del planificador. TODOS SON PROVISORIOS: referencias habituales de la
// industria que Tecnica Racklog debe confirmar o corregir (PLAN-PLANIFICADOR.md, "Datos que
// Racklog debe confirmar"). Cuando un valor se confirme, se cambia aqui y se marca confirmado: true;
// el planificador deja de mostrar "provisorio" para ese dato.

export const GRUAS = {
  transpaleta: { nombre: 'Transpaleta', pasillo: 2.0, levante: 0.2, confirmado: false },
  manual: { nombre: 'Apilador manual', pasillo: 2.4, levante: 3.0, confirmado: false },
  apiladora: { nombre: 'Apiladora eléctrica', pasillo: 2.4, levante: 4.5, confirmado: false },
  contrapeso: { nombre: 'Grúa horquilla contrapeso', pasillo: 3.5, levante: 6.0, confirmado: false },
  retractil: { nombre: 'Grúa retráctil', pasillo: 2.8, levante: 10.0, confirmado: false },
};

// Medidas tipicas de la grua que entra a la calle del drive-in, cuando el cliente no midio la suya (m).
// A = techo protector, B = mastil bajado, C = ancho. REFERENCIALES (dueño 21-10-2026): las confirma Racklog.
// driveIn: false = el equipo no puede trabajar dentro de las calles (se bloquea con su motivo)
export const GRUA_DRIVE_IN = {
  holgura: { valor: 0.15, confirmado: false },   // sobre lo mas alto de la grua bajo el primer carril
  equipos: {
    // Fichas de fabricantes (Crown C-5, Hangcha XF25G, Linde, Still, Toyota BT Reflex, Hyster), equipos tipicos:
    // contrapeso 2,5 t: techo 2,09–2,23, mastil bajado 2,25–2,53 (triple), ancho 1,16–1,23;
    // retractil 1,6 t: techo 2,11–2,20, mastil 2,18–2,89, ancho 1,14–1,27; apilador 1,2 t: mastil ~1,94, ancho ~0,80
    // (dueño aprobó estos valores el 21-10-2026; los confirma Tecnica Racklog)
    contrapeso: { techo: 2.2, mastil: 2.4, ancho: 1.2, driveIn: true },
    retractil: { techo: 2.2, mastil: 2.5, ancho: 1.27, driveIn: true },
    apiladora: { techo: 2.0, mastil: 2.0, ancho: 0.8, driveIn: true },   // techo = el operador que camina detras
    manual: { driveIn: false, motivo: 'con apilador manual el operador tendría que entrar caminando a la calle, entre pallets en altura' },
    transpaleta: { driveIn: false, motivo: 'la transpaleta no levanta: no puede dejar pallets en los niveles de la calle' },
  },
  confirmado: false,
};

export const DISTANCIAS = {
  rackMuro: { valor: 0.1, confirmado: false },       // m entre la espalda del rack y el muro
  rackPilar: { valor: 0.1, confirmado: false },      // m entre el rack y un pilar
  holguraTecho: { valor: 0.5, confirmado: true },    // m libres entre el ultimo pallet y techo, luminaria o rociador (dueño 21-10-2026)
  pasilloPersona: { valor: 1.2, confirmado: false }, // m de pasillo frente a un angulo ranurado (se carga a mano)
};

// Geometria del rack selectivo (m), la del motor de cotizacion de la intranet
// (motor-rack-selectivo.js, celdas CA22/CA23/CA29/CA30; docs/planos-alturas.zip)
export const RACK = {
  voladizoPallet: { valor: 0.1, confirmado: true },    // CA22: fondo marco = fondo pallet − 200 (100 por lado)
  holguraViga: { valor: 0.1, confirmado: true },       // CA29 luzPilar: viga = n × frente + (n + 1) × 100
  luzVigas: { valor: 0.1, confirmado: true },          // CA23: luz minima entre la carga y la viga de arriba (dueño 21-10-2026: 100 mm)
  pasoPerforado: { valor: 0.0762, confirmado: true },  // perforacion del pilar cada 3" (76,2 mm de eje a eje): las vigas se mueven de a esto
  primeraPerforacion: { valor: 0.025,  confirmado: true },   // eje de la primera perforacion desde el piso (dueño 21-10-2026)
  sobranteMarco: { min: 0.3, max: 1.0, confirmado: true },   // marco sobre la ultima viga: 300 a 1.000 mm
  separadorBastidor: { valor: 0.3, confirmado: true },  // separador de bastidor: luz entre los marcos de una fila doble (dueño 21-10-2026: 300 mm)
};

// Seleccion de viga del motor (AS2): W = kg × factor × L / 8 / 18; el primer modelo cuya Wx alcanza.
// [Wx, modelo]; el alto sale del nombre (70 / 100 / 125 / 150 mm). 2ATC70 no se elige nunca
export const VIGAS = [[6.04, 'TC70'], [7.87, 'ATC70'], [12.08, '2TC70'], [19.28, '2TC100'], [25.18, '2ATC100'], [30.82, '2BTC100'], [34.02, '2ATC125'], [43.34, '2ATC150'], [53.2, '2BTC150']];

// Drive-in del cotizador (altura-drive-in.js y planos/lib/driveIn.mjs de la intranet), en mm
export const DRIVE_IN = {
  luzPilarPallet: 75, luzPalletCartela: 100, luzPalletPrimeraCartela: 100, alturaViga: 100, toleranciaFondo: 20, anchoPilar: 100,
  luzRiostraSuperior: [150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1050, 1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500],
  // Bastidores version 2 (dueño 19-10-2026): fondos estandar del bloque
  fondoEstandar: [2050, 3100, 4150, 5200, 6250, 7300, 8350, 9400, 10450, 11500, 12550, 13600, 14650, 15700],
};

// Capacidad por nivel de carga (kg): selectivo = par de vigas; angulo ranurado = bandeja
export const CAPACIDADES = {
  selectivoParVigas: { valor: 2000, confirmado: false },
  driveInPallet: { valor: 1000, confirmado: false },   // kg por pallet sobre los rieles
  bandejaAngulo: { valor: 250, confirmado: true },     // "soporta hasta 250 kg" (ficha del sitio)
};

/** Algun parametro sin confirmar entre los que se usan */
export const esProvisorio = (...p) => p.some((x) => x && x.confirmado === false);
