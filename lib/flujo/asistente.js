// Asistente de Racklog (RACKLOG, el rack con cara de la marca; avatar del dueño 28-10 en lib/tour/AVATAR RACKLOG.png): explica cómo usar la herramienta en cada paso y avisa lo
// que importa según lo que el cliente va armando. Aparece cuando el cliente lo pide (botón en la esquina); la
// primera vez saluda. Sin Vue: los textos salen de las mismas reglas y números que usa el planificador, para que
// nunca diga algo distinto de lo que hace la herramienta.
// Poses (public/assets/images/guia/<pose>.webp, recortadas de lib/tour/AVATAR RACKLOG.png):
// saluda, pulgar, senala, celebra, atento, ok, piensa, tablet, caja, presenta, perfecto, cajas, pilar, corre, carga
import { GRUAS, RACK } from '../rack3d/parametrosTecnicos.js';

export const POSES = ['saluda', 'pulgar', 'senala', 'celebra', 'atento', 'ok', 'piensa', 'tablet', 'caja', 'presenta', 'perfecto', 'cajas', 'pilar', 'corre', 'carga'];
export const imagenPose = (pose) => `/assets/images/guia/${POSES.includes(pose) ? pose : 'presenta'}.webp`;

const fm = (v) => (+(+v || 0).toFixed(2)).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const n = (v) => Math.round(v || 0).toLocaleString('es-CL');
const mm = (v) => `${Math.round(v * 1000).toLocaleString('es-CL')} mm`;
const equipo = (p) => GRUAS[p?.bodega?.grua] ?? GRUAS.contrapeso;

export const SALUDO = {
  pose: 'saluda',
  titulo: 'Hola, soy RACKLOG',
  texto: 'Te ayudo a diseñar tu bodega.',
};

// Textos cortos (dueño 28-10: "me da instrucciones muy largas"): una o dos frases, lo justo para seguir
/**
 * Tutorial de cada paso: temas cortos, en el orden en que el cliente los necesita
 * @returns {{ pose: string, titulo: string, texto: string }[]}
 */
export function temasDe(paso, p = {}) {
  const g = equipo(p);
  const t0 = (p.pallets ?? [])[0];
  const frente = Number(t0?.frente) > 0 ? +t0.frente : 1.0, fondo = Number(t0?.fondo) > 0 ? +t0.fondo : 1.2;
  const holgura = RACK.holguraViga.valor, volado = RACK.voladizoPallet.valor;
  const viga2 = 2 * frente + 3 * holgura;
  const T = {
    operacion: [
      { pose: 'presenta', titulo: '¿Qué sistema me conviene?', texto: 'Selectivo: muchos productos. Drive-in: muchos pallets de pocos productos. Ángulo ranurado: cajas a mano.' },
      { pose: 'tablet', titulo: 'Si no lo sabes, no importa', texto: 'Responde las preguntas. Lo que no sepas, marca "No sé".' },
    ],
    dibujo: [
      { pose: 'senala', titulo: 'Dibuja tu bodega', texto: 'Rectangular: escribe ancho y largo. Otra forma: toca cada esquina.' },
      { pose: 'carga', titulo: 'La altura libre', texto: 'Del piso a lo más bajo del techo: viga, lámpara o rociador.' },
      { pose: 'pilar', titulo: 'Los pilares', texto: 'Marca uno y repítelo cada tantos metros, en grilla o solo por los muros.' },
      { pose: 'presenta', titulo: 'Portones y andenes', texto: `Delante de cada uno quedan ${fm(g.pasillo)} m libres para la grúa.` },
    ],
    pallets: [
      { pose: 'caja', titulo: 'Mide tu pallet', texto: 'Frente: lado del pasillo. Fondo: hacia el rack. Alto y peso: con la carga.' },
      { pose: 'cajas', titulo: 'Si la carga sobresale', texto: 'Súmalo al frente o al fondo.' },
      { pose: 'ok', titulo: '¿Cuántos pallets?', texto: 'Los de tu peak. La ocupación la calculamos nosotros.' },
    ],
    rack: [
      { pose: 'tablet', titulo: 'La viga', texto: `2 pallets de ${fm(frente)} m + 3 holguras de ${mm(holgura)} = ${fm(viga2)} m.` },
      { pose: 'senala', titulo: 'El fondo del marco', texto: `${fm(fondo)} − ${fm(2 * volado)} = ${fm(fondo - 2 * volado)} m: el pallet sobresale ${mm(volado)} por lado.` },
      { pose: 'carga', titulo: 'Más alto, menos peso', texto: 'Arriba la grúa levanta menos. Lo pesado, abajo.' },
      { pose: 'atento', titulo: 'Viga a piso', texto: 'Con apiladora o retráctil, el primer pallet va sobre una viga a 30 cm.' },
    ],
    bodega: [
      { pose: 'presenta', titulo: 'El pasillo', texto: `Tu ${g.nombre.toLowerCase()} pide ${fm(g.pasillo)} m. Más angosto se marca en rojo.` },
      { pose: 'senala', titulo: 'Simple o doble', texto: 'Doble: espalda con espalda. Contra el muro: simple.' },
      { pose: 'corre', titulo: 'Cabecera', texto: 'En una punta deja un pasillo cruzado para entrar a todos.' },
      { pose: 'pilar', titulo: 'Rack sobre un pilar', texto: 'Pierdes solo esas posiciones y el pasillo queda libre.' },
      { pose: 'tablet', titulo: 'Te lo armamos', texto: '"Proponme un layout" llena la bodega. Después lo cambias.' },
      { pose: 'piensa', titulo: 'Túneles', texto: 'En filas largas, un túnel deja cruzar a la grúa por debajo.' },
    ],
    accesorios: [
      { pose: 'atento', titulo: 'Canilleras', texto: 'Protegen cada pilar del rack que da al pasillo.' },
      { pose: 'presenta', titulo: 'Protección de bastidor', texto: 'Va en las cabeceras donde dobla la grúa.' },
      { pose: 'senala', titulo: 'Baranda y malla', texto: 'Separan a las personas de las grúas y de la carga.' },
      { pose: 'cajas', titulo: 'Lo que va con el rack', texto: 'Separadores, planos de carga y topes: no se quitan.' },
    ],
    revisa: [
      { pose: 'presenta', titulo: 'Revisa tu diseño', texto: 'Mira el recorrido 3D y las pestañas.' },
      { pose: 'tablet', titulo: 'Compártelo', texto: 'Con el link tu equipo ve el mismo diseño.' },
    ],
    cotiza: [
      { pose: 'ok', titulo: 'Qué pasa después', texto: 'Tu ejecutivo te llama en 24 horas e ingeniería valida el diseño.' },
    ],
  };
  return T[paso] ?? [];
}

/**
 * Avisos según cómo va el diseño (lo más urgente primero). `estado` lo publica cada paso (layout: demanda,
 * pasillos, pilares, espacio libre). accion: lo que el botón del aviso pide hacer ('autollenar-area', …)
 * @returns {{ pose: string, titulo: string, texto: string, tono: 'alerta' | 'bien' | 'info', accion?: { id: string, texto: string } }[]}
 */
export function avisosDe(paso, p = {}, estado = {}) {
  const out = [], g = equipo(p);
  if (paso === 'pallets' && (p.pallets ?? []).some((t) => t.ejemplo)) {
    out.push({ pose: 'piensa', tono: 'info', titulo: 'Pallet de ejemplo', texto: 'Pon las medidas del tuyo.' });
  }
  if (paso === 'rack' && g.vigaPiso) {
    out.push({ pose: 'atento', tono: 'info', titulo: 'Lleva viga a piso', texto: 'El primer pallet va a 30 cm. Ya está dibujado.' });
  }
  if (paso === 'bodega' && estado.layout) {
    const l = estado.layout;
    if (l.angostos > 0) out.push({ pose: 'atento', tono: 'alerta', titulo: `${l.angostos === 1 ? 'Un pasillo angosto' : `${l.angostos} pasillos angostos`}`, texto: `Pide ${fm(g.pasillo)} m. Separa las filas (en rojo).` });
    if (l.choques > 0) out.push({ pose: 'atento', tono: 'alerta', titulo: 'Racks en rojo', texto: 'Chocan con algo. Muévelos.' });
    if (l.sinSalida > 0) out.push({ pose: 'corre', tono: 'alerta', titulo: 'Pasillo sin entrada', texto: 'Acorta una fila para que entre la grúa.' });
    if (l.perdidasPilares > 0) out.push({ pose: 'pilar', tono: 'info', titulo: `Pilares: −${n(l.perdidasPilares)} ${l.perdidasPilares === 1 ? 'posición' : 'posiciones'}`, texto: `Esas filas te dan ${n(l.posicionesConPilar)}. Conviene.` });
    if (l.necesita > 0) {
      if (l.faltan <= 0) out.push({ pose: 'perfecto', tono: 'bien', titulo: '¡Ya cumples!', texto: `${n(l.posiciones)} de ${n(l.necesita)} ${l.unidad}.` });
      else if (l.faltan <= 0.15 * l.necesita) out.push({ pose: 'corre', tono: 'info', titulo: 'Te queda poco', texto: `Faltan ${n(l.faltan)} ${l.unidad}.` });
      else if (l.posiciones > 0) out.push({ pose: 'caja', tono: 'info', titulo: `Vas en ${n(l.posiciones)} de ${n(l.necesita)}`, texto: `Faltan ${n(l.faltan)} ${l.unidad}.`, accion: { id: 'autollenar', texto: 'Proponme un layout' } });
    }
    // Espacio libre: preguntar si lo quiere aprovechar (solo cuando ya hay racks y queda bastante)
    if (l.posiciones > 0 && l.libreM2 >= 40 && l.usadoPct < 70) {
      out.push({ pose: 'piensa', tono: 'info', titulo: `~${n(l.libreM2)} m² libres`, texto: '¿Los llenamos?', accion: { id: 'autollenar-area', texto: 'Llenar un área' } });
    }
  }
  if (paso === 'accesorios' && p.accesorios?.desea === false) {
    out.push({ pose: 'atento', tono: 'info', titulo: 'Sin accesorios de seguridad', texto: 'Si cambias de idea, vuelve a este paso.' });
  }
  if (paso === 'revisa') out.push({ pose: 'celebra', tono: 'bien', titulo: 'Tu diseño está listo', texto: 'Cuando quieras, pide la cotización.' });
  return out;
}

export const FIN = {
  pose: 'celebra',
  titulo: '¡Lo lograste!',
  texto: 'Tu ejecutivo te llama en 24 horas.',
};

/**
 * "¿Por qué?" de un resultado (dueño 28-10: "cómo calcula, en simple"): la cuenta contada con los números del
 * cliente. Los datos los entrega el mismo paso que muestra el resultado, para que nunca diga otra cifra
 * @returns {{ pose: string, titulo: string, texto: string } | null}
 */
export function porQueDe(id, d = {}, p = {}) {
  const g = equipo(p);
  if (id === 'viga') {
    const k = d.porViga ?? 2, h = d.holgura ?? RACK.holguraViga.valor;
    return { pose: 'tablet', titulo: `Viga de ${fm(d.viga)} m`, texto: `${k} × ${fm(d.frente)} m + ${k + 1} holguras de ${mm(h)} = ${fm(d.viga)} m.` };
  }
  if (id === 'fondo') {
    const v = RACK.voladizoPallet.valor;
    return { pose: 'senala', titulo: `Fondo de ${fm(d.fondo)} m`, texto: `${fm(d.fondoPallet)} − ${fm(2 * v)} = ${fm(d.fondo)} m: el pallet sobresale ${mm(v)} por lado.` };
  }
  if (id === 'niveles') {
    return { pose: 'carga', titulo: `${d.max} ${d.max === 1 ? 'nivel' : 'niveles'}`, texto: `Lo que te limita: ${d.limite}.` };
  }
  if (id === 'necesita') {
    const pct = Math.round((d.ocupacion ?? 0.8) * 100);
    return { pose: 'caja', titulo: `${n(d.necesita)} posiciones`, texto: `${n(d.pidio)} pallets ÷ ${pct} % de ocupación = ${n(d.necesita)}.` };
  }
  if (id === 'pasillo') {
    return { pose: 'corre', titulo: `Pasillo de ${fm(g.pasillo)} m`, texto: `Es lo que tu ${g.nombre.toLowerCase()} necesita para girar con el pallet.` };
  }
  return null;
}

// En el inicio (portada y landing del planificador): se presenta y cuenta cómo funciona la herramienta
export const INICIO = [
  { pose: 'saluda', titulo: 'Hola, soy RACKLOG', texto: 'Te ayudo a diseñar tu bodega, gratis.' },
  { pose: 'tablet', titulo: 'Así funciona', texto: '7 pasos cortos. En cada uno te aviso si algo queda mal.' },
  { pose: 'ok', titulo: 'No necesitas saber de racks', texto: 'Lo que no sepas, marca "No sé".' },
];
