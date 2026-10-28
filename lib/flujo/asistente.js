// Asistente de Racklog (RACKLOG, el rack con cara de la marca; avatar del dueño 28-10 en lib/tour/AVATAR RACKLOG.png): explica cómo usar la herramienta en cada paso y avisa lo
// que importa según lo que el cliente va armando. Aparece cuando el cliente lo pide (botón en la esquina); la
// primera vez saluda. Sin Vue: los textos salen de las mismas reglas y números que usa el planificador, para que
// nunca diga algo distinto de lo que hace la herramienta.
// Poses (public/assets/images/guia/<pose>.webp, recortadas de lib/tour/AVATAR RACKLOG.png):
// saluda, pulgar, senala, celebra, atento, ok, piensa, tablet, caja, presenta, perfecto, cajas, pilar, corre, carga
import { GRUAS, RACK, DISTANCIAS } from '../rack3d/parametrosTecnicos.js';

export const POSES = ['saluda', 'pulgar', 'senala', 'celebra', 'atento', 'ok', 'piensa', 'tablet', 'caja', 'presenta', 'perfecto', 'cajas', 'pilar', 'corre', 'carga'];
export const imagenPose = (pose) => `/assets/images/guia/${POSES.includes(pose) ? pose : 'presenta'}.webp`;

const fm = (v) => (+(+v || 0).toFixed(2)).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const n = (v) => Math.round(v || 0).toLocaleString('es-CL');
const mm = (v) => `${Math.round(v * 1000).toLocaleString('es-CL')} mm`;
const equipo = (p) => GRUAS[p?.bodega?.grua] ?? GRUAS.contrapeso;

export const SALUDO = {
  pose: 'saluda',
  titulo: 'Hola, soy RACKLOG',
  texto: 'Hola, soy RACKLOG y estoy aquí para ayudarte a diseñar tu bodega.',
};

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
  const pasillosTxt = ['contrapeso', 'retractil', 'apiladora'].map((k) => `${GRUAS[k].nombre.toLowerCase()} ${fm(GRUAS[k].pasillo)} m`).join(', ');
  const T = {
    operacion: [
      { pose: 'presenta', titulo: '¿Qué sistema me conviene?', texto: 'Rack selectivo: llegas directo a cada pallet; sirve cuando tienes muchos productos distintos. Drive-in: la grúa entra a la calle y guardas muchos pallets de pocos productos (el último que entra es el primero que sale). Ángulo ranurado: estantes para cajas y bultos que se mueven a mano.' },
      { pose: 'tablet', titulo: 'Si no lo sabes, no importa', texto: 'Responde las 8 preguntas y te recomendamos el sistema. Lo que no sepas, márcalo con "No sé": usamos un valor típico y tu ejecutivo lo confirma.' },
    ],
    dibujo: [
      { pose: 'senala', titulo: 'Dibuja tu bodega', texto: 'Si es un rectángulo, escribe ancho y largo. Si tiene otra forma, elige "Dibujarla": toca cada esquina siguiendo los muros y escribe los metros de cada muro con el teclado.' },
      { pose: 'carga', titulo: 'Cómo medir la altura libre', texto: `Mide del piso a lo más bajo del techo: una viga, una lámpara o un rociador, no la cumbrera. Sobre la última carga dejamos ${mm(DISTANCIAS.holguraTecho.valor)} libres.` },
      { pose: 'pilar', titulo: 'Los pilares importan', texto: 'Márcalos donde están: con "+ Un pilar" pones uno y te ofrecemos repetirlo cada tantos metros. Nunca dejamos un pilar en medio de un pasillo, porque angosta el paso de la grúa. Un rack selectivo sí puede pasar sobre un pilar.' },
      { pose: 'presenta', titulo: 'Portones y andenes', texto: `Delante de cada portón o andén queda libre una franja para que tu ${g.nombre.toLowerCase()} entre y gire: ${fm(g.pasillo)} m, su pasillo de trabajo. Ahí no va ningún rack.` },
    ],
    pallets: [
      { pose: 'caja', titulo: 'Cómo medir tu pallet', texto: 'Frente: el lado que mira al pasillo, por donde entra la horquilla. Fondo: lo que entra hacia el rack. Alto: del piso a lo más alto de la carga, con la tarima incluida (unos 15 cm). Peso: el pallet completo, ya cargado.' },
      { pose: 'cajas', titulo: 'Si la carga sobresale', texto: 'Si las cajas sobresalen de la tarima, súmalo al frente o al fondo. Si guardas cajas sin pallet, márcalo: van sobre un plano de carga.' },
      { pose: 'ok', titulo: '¿Cuántos pallets?', texto: 'Pon los que guardas en tu peak. Nadie llena el 100 % de sus posiciones: con 80 % de ocupación, 100 pallets piden 125 posiciones. Eso lo calculamos nosotros.' },
    ],
    rack: [
      { pose: 'tablet', titulo: 'Por qué la viga mide eso', texto: `La viga se calcula con tu pallet: pallets por nivel × frente, más ${mm(holgura)} entre cada pallet y en las puntas. Con 2 pallets de ${fm(frente)} m: 2 × ${fm(frente)} + 3 × ${fm(holgura)} = ${fm(viga2)} m. Así la horquilla entra y saca sin golpear el marco.` },
      { pose: 'senala', titulo: 'El fondo del marco', texto: `El marco mide ${mm(2 * volado)} menos que el fondo del pallet (${fm(fondo)} − ${fm(2 * volado)} = ${fm(fondo - 2 * volado)} m): el pallet sobresale ${mm(volado)} por delante y por detrás y apoya firme en las dos vigas.` },
      { pose: 'carga', titulo: 'Más alto, menos peso', texto: 'Mientras más alto sube tu grúa, menos kilos levanta. Mira la línea "a X m tu grúa levanta Y kg": si tu pallet pesa más, deja los pesados abajo o baja un nivel.' },
      { pose: 'atento', titulo: 'Viga a piso', texto: `${['manual', 'apiladora', 'retractil'].map((k) => GRUAS[k].nombre).join(', ')}: sus patas delanteras entran por debajo del rack. Si el primer pallet va en el piso, las patas chocan con él; por eso va sobre una viga a unos 30 cm.` },
    ],
    bodega: [
      { pose: 'presenta', titulo: 'El pasillo depende de tu grúa', texto: `Es el espacio para girar con el pallet (su radio de giro): ${pasillosTxt}. Tu ${g.nombre.toLowerCase()} pide ${fm(g.pasillo)} m. Si un pasillo queda más angosto, se marca en rojo.` },
      { pose: 'senala', titulo: 'Simple o doble', texto: 'Doble son dos racks espalda con espalda: un pasillo sirve a las dos caras y guardas más. Contra el muro va simple, porque la cara del muro no tendría pasillo.' },
      { pose: 'corre', titulo: 'El pasillo de cabecera', texto: `En una punta de las filas deja un pasillo cruzado para que la grúa entre a todos los pasillos. Para pasar cargada por la punta necesita su ancho más ${mm(DISTANCIAS.holguraCirculacion.valor)} por lado.` },
      { pose: 'pilar', titulo: 'Rack sobre un pilar', texto: 'Si una fila pasa sobre un pilar, pierdes solo las posiciones donde cae, pero ganas la fila completa. Si la cortas para esquivarlo, pierdes más y el pilar queda en el pasillo, estorbando a la grúa.' },
      { pose: 'tablet', titulo: 'Te lo armamos', texto: '"Proponme un layout" prueba varias formas (filas a lo ancho o a lo largo, simples contra el muro, cabecera a un lado u otro) y deja la que más guarda cumpliendo todas las reglas. También puedes marcar solo un área. Después lo cambias a tu gusto.' },
      { pose: 'piensa', titulo: 'Túneles', texto: `En filas de más de ${fm(DISTANCIAS.filaTunel.valor)} m conviene un túnel al medio: la grúa cruza por debajo sin dar la vuelta. Pierdes las posiciones de abajo de ese cuerpo.` },
    ],
    accesorios: [
      { pose: 'atento', titulo: 'Canilleras', texto: 'Pieza de acero roja delante de cada pilar que da al pasillo, apernada al piso. Recibe el golpe de la grúa antes que el pilar: un pilar doblado puede botar el rack.' },
      { pose: 'presenta', titulo: 'Protección de bastidor', texto: 'Arco de tubo en las cabeceras por donde dobla la grúa. Ahí es donde más se golpean los marcos.' },
      { pose: 'senala', titulo: 'Baranda y malla', texto: 'La baranda separa a las personas de las grúas en los pasillos peatonales. La malla anticaída va en la espalda de los racks que dan a donde camina gente: evita que caiga carga.' },
      { pose: 'cajas', titulo: 'Lo que va con el rack', texto: 'Separadores (unen los dos marcos de un doble), planos de carga (para cajas sin pallet o carga que sobresale) y topes (cuando el pallet no apoya bien en las vigas). Esos no se pueden quitar.' },
    ],
    revisa: [
      { pose: 'presenta', titulo: 'Revisa tu diseño', texto: 'Mira el recorrido 3D: tu bodega, la carga, la altura y la grúa trabajando. Cada pestaña muestra lo que le importa a gerencia, a bodega o a compras.' },
      { pose: 'tablet', titulo: 'Compártelo', texto: 'Con el link, tu equipo ve el mismo diseño. Nada se cotiza hasta que tú lo pidas.' },
    ],
    cotiza: [
      { pose: 'ok', titulo: 'Qué pasa después', texto: 'Tu ejecutivo te contacta en máximo 24 horas. Antes de fabricar, ingeniería Racklog hace el cálculo sísmico (NCh2369) y valida tu diseño.' },
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
    out.push({ pose: 'piensa', tono: 'info', titulo: 'Estás con el pallet de ejemplo', texto: 'Si cambias las medidas por las de tu pallet, las vigas y los niveles salen exactos.' });
  }
  if (paso === 'rack' && g.vigaPiso) {
    out.push({ pose: 'atento', tono: 'info', titulo: `Tu ${g.nombre.toLowerCase()} lleva viga a piso`, texto: 'Sus patas entran por debajo del rack: el primer pallet va sobre una viga a unos 30 cm, no en el piso. Ya lo dibujamos así.' });
  }
  if (paso === 'bodega' && estado.layout) {
    const l = estado.layout;
    if (l.angostos > 0) out.push({ pose: 'atento', tono: 'alerta', titulo: `${l.angostos === 1 ? 'Un pasillo queda angosto' : `${l.angostos} pasillos quedan angostos`}`, texto: `Tu ${g.nombre.toLowerCase()} necesita ${fm(g.pasillo)} m para girar con el pallet. Separa las filas o acórtalas (en rojo en el plano).` });
    if (l.choques > 0) out.push({ pose: 'atento', tono: 'alerta', titulo: 'Hay racks en rojo', texto: 'Chocan con otro rack, un muro o un elemento. Muévelos o usa "Reubicar".' });
    if (l.sinSalida > 0) out.push({ pose: 'corre', tono: 'alerta', titulo: 'La grúa no llega a un pasillo', texto: 'Está cerrado por las dos puntas. Acorta una fila para abrirle entrada, o márcalo si por ahí no circula la grúa.' });
    if (l.perdidasPilares > 0) out.push({ pose: 'pilar', tono: 'info', titulo: `Los pilares te quitan ${n(l.perdidasPilares)} ${l.perdidasPilares === 1 ? 'posición' : 'posiciones'}`, texto: `Pero esas filas te dan ${n(l.posicionesConPilar)} posiciones. Si las cortaras para esquivar los pilares, perderías más y el pilar quedaría en el pasillo.` });
    if (l.necesita > 0) {
      if (l.faltan <= 0) out.push({ pose: 'perfecto', tono: 'bien', titulo: '¡Perfecto, ya cumples!', texto: `Tienes ${n(l.posiciones)} ${l.unidad} para las ${n(l.necesita)} que necesitas.` });
      else if (l.faltan <= 0.15 * l.necesita) out.push({ pose: 'corre', tono: 'info', titulo: 'Te queda poco', texto: `Faltan ${n(l.faltan)} ${l.unidad}. Alarga una fila o súmale otra.` });
      else if (l.posiciones > 0) out.push({ pose: 'caja', tono: 'info', titulo: `Vas en ${n(l.posiciones)} de ${n(l.necesita)}`, texto: `Faltan ${n(l.faltan)} ${l.unidad}. Si quieres, "Proponme un layout" lo llena por ti.`, accion: { id: 'autollenar', texto: 'Proponme un layout' } });
    }
    // Espacio libre: preguntar si lo quiere aprovechar (solo cuando ya hay racks y queda bastante)
    if (l.posiciones > 0 && l.libreM2 >= 40 && l.usadoPct < 70) {
      out.push({ pose: 'piensa', tono: 'info', titulo: `Te quedan ~${n(l.libreM2)} m² libres`, texto: '¿Los quieres aprovechar? Marca esa área y la llenamos con racks, respetando los pasillos de tu grúa.', accion: { id: 'autollenar-area', texto: 'Llenar un área' } });
    }
  }
  if (paso === 'accesorios' && p.accesorios?.desea === false) {
    out.push({ pose: 'atento', tono: 'info', titulo: 'Cotizas sin accesorios de seguridad', texto: 'Las canilleras y protecciones evitan que un golpe de grúa doble un pilar. Si cambias de idea, vuelve a este paso.' });
  }
  if (paso === 'revisa') out.push({ pose: 'celebra', tono: 'bien', titulo: 'Tu diseño está listo', texto: 'Revísalo con calma y, cuando quieras, pide la cotización.' });
  return out;
}
