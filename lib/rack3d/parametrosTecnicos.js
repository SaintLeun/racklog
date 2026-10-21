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

export const DISTANCIAS = {
  rackMuro: { valor: 0.1, confirmado: false },       // m entre la espalda del rack y el muro
  rackPilar: { valor: 0.1, confirmado: false },      // m entre el rack y un pilar
  holguraTecho: { valor: 0.5, confirmado: false },   // m libres entre la carga mas alta y techo o rociador
  pasilloPersona: { valor: 1.2, confirmado: false }, // m de pasillo frente a un angulo ranurado (se carga a mano)
};

// Geometria del rack selectivo (m). PROVISORIOS hasta que Tecnica Racklog los confirme
export const RACK = {
  voladizoPallet: { valor: 0.05, confirmado: false },  // lo que el pallet sobresale del marco, por lado (fondo marco = fondo pallet − 2 × esto)
  holguraViga: { valor: 0.1, confirmado: false },      // entre pallets y a los pilares: viga = n × frente + (n + 1) × esto
  pasoPerforado: { valor: 0.05, confirmado: false },   // paso de la perforacion del pilar: las vigas suben o bajan de a esto
  separadorFila: { valor: 0.2, confirmado: false },    // entre las dos filas de un selectivo doble (espalda con espalda)
};

// Capacidad por nivel de carga (kg): selectivo = par de vigas; angulo ranurado = bandeja
export const CAPACIDADES = {
  selectivoParVigas: { valor: 2000, confirmado: false },
  driveInPallet: { valor: 1000, confirmado: false },   // kg por pallet sobre los rieles
  bandejaAngulo: { valor: 250, confirmado: true },     // "soporta hasta 250 kg" (ficha del sitio)
};

/** Algun parametro sin confirmar entre los que se usan */
export const esProvisorio = (...p) => p.some((x) => x && x.confirmado === false);
