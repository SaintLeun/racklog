// Conversión de "Planifica tu bodega" (prompt de conversión, docs/AVANCE-CONVERSION.md): textos de ingeniería,
// porqué de cada dato, "No lo sé" con valores típicos, precisión de la cotización, visita técnica como
// rescate y el lead para Kommo (vía exprés y vía diseño). Sin Vue: se puede probar sola.
// Regla dura: nada de precios. La web nunca dice que un diseño resiste: ingeniería Racklog lo valida.
import { validarRut } from '../tour/reglas.js';

// ─── Ingeniería como garantía ───
export const NORMAS = 'NCh2369 (diseño sísmico) y ANSI MH16.1';
export const TEXTO_INGENIERIA = `Diseño preliminar. Antes de cotizar, ingeniería Racklog lo valida con cálculo estructural según ${NORMAS}.`;

// ─── Más información = mejor te ayudamos ───
export const MENSAJE_INICIO = 'Mientras más sepamos de tu bodega y tu operación, más precisa y rápida es tu cotización — sin esperar visitas ni mediciones.';
// El porqué de cada dato, en beneficio del cliente (una línea)
export const PORQUE = {
  guarda: 'Define si te conviene rack para pallets o estantería para cajas.',
  cantidad: 'Dimensionamos para hoy y para crecer.',
  peso: 'Con esto calculamos la viga exacta que necesitas.',
  medidasPallet: 'Con esto calculamos el fondo del rack y la altura de cada nivel.',
  medidas: 'Con esto sabemos cuántas posiciones te caben de verdad.',
  altura: 'Define cuántos niveles puedes subir.',
  grua: 'Define el ancho de tus pasillos y hasta qué altura llegas.',
  archivo: 'Una foto o un plano nos ahorra preguntas y adelanta tu cotización.',
};
// Lo que se pierde con cada "No lo sé" (nunca bloquea)
export const PIERDE = 'Sin este dato, la cotización queda sujeta a verificación.';
export const ESTIMADO = 'estimado — tu ejecutivo lo confirma';

// ─── "No lo sé": valores típicos ───
export const PESOS_TIPICOS = [
  { v: 'liviano', t: 'Liviano', kg: 500 },
  { v: 'medio', t: 'Medio', kg: 1000 },
  { v: 'pesado', t: 'Pesado', kg: 1500 },
];
export const ALTURAS_TIPICAS = [
  { t: 'Baja', m: 4.5, d: 'bodega de barrio, galpón chico' },
  { t: 'Media', m: 6, d: 'galpón industrial típico' },
  { t: 'Alta', m: 8, d: 'centro de distribución' },
  { t: 'Muy alta', m: 10, d: 'nave logística nueva' },
];
// Medidas aproximadas de la bodega: se aceptan con ±1 m
export const TOLERANCIA_MEDIDAS = 1;

// Datos que pesan en la cotización (precisión). clave: medidas de la bodega, pallets y grúa; son los que se
// cuentan para ofrecer la visita (rescate) y, si son todos reales, se cotiza sin visita previa
export const DATOS = [
  { k: 'guarda', t: 'qué guardas', peso: 1 },
  { k: 'cantidad', t: 'cuántos pallets o cajas', peso: 2, clave: true },
  { k: 'medidasPallet', t: 'medidas del pallet o la caja', peso: 1 },
  { k: 'peso', t: 'peso del pallet', peso: 2, clave: true },
  { k: 'medidas', t: 'medidas de la bodega', peso: 3, clave: true },
  { k: 'altura', t: 'altura libre de la bodega', peso: 2 },
  { k: 'grua', t: 'equipo de carga', peso: 2, clave: true },
];

/**
 * Precisión de la cotización según los datos. estados: { [k]: 'real' | 'estimado' | 'falta' }.
 * Sube con cada dato real, baja con cada "No lo sé". Nunca bloquea.
 * @returns {{ nivel: 'alta'|'media'|'baja', pct: number, estimados: string[], faltan: string[], sinVisita: boolean, texto: string }}
 */
export function precision(estados = {}) {
  const total = DATOS.reduce((t, d) => t + d.peso, 0);
  const real = DATOS.reduce((t, d) => t + (estados[d.k] === 'real' ? d.peso : estados[d.k] === 'estimado' ? d.peso * 0.4 : 0), 0);
  const pct = Math.round((real / total) * 100);
  const estimados = DATOS.filter((d) => estados[d.k] === 'estimado').map((d) => d.t);
  const faltan = DATOS.filter((d) => !estados[d.k] || estados[d.k] === 'falta').map((d) => d.t);
  const nivel = pct >= 85 ? 'alta' : pct >= 60 ? 'media' : 'baja';
  // Sin visita previa: todos los datos clave reales
  const sinVisita = DATOS.filter((d) => d.clave).every((d) => estados[d.k] === 'real');
  const texto = nivel === 'alta'
    ? (sinVisita ? 'alta — con estos datos cotizamos sin visita' : 'alta — tu ejecutivo confirma un par de datos contigo')
    : nivel === 'media'
      ? 'media — cada dato real que agregues la sube'
      : 'baja — completa tus datos para cotizar sin visita';
  return { nivel, pct, estimados, faltan, sinVisita, texto };
}

/** "No lo sé" en datos clave (medidas de bodega, pallets o grúa) */
export const noSeClave = (estados = {}) => DATOS.filter((d) => d.clave && estados[d.k] === 'estimado').length;

/**
 * Visita técnica solo como rescate: con 2 o más "No lo sé" en datos clave, o si abandona el paso de medidas.
 * Nunca de entrada.
 */
export function pideRescate(estados = {}, { abandonoMedidas = false } = {}) {
  return abandonoMedidas || noSeClave(estados) >= 2;
}

// ─── Comunas: Región Metropolitana (52) y las principales de regiones ───
export const COMUNAS_RM = [
  'Santiago', 'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central', 'Huechuraba', 'Independencia',
  'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Espejo',
  'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura',
  'Quinta Normal', 'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón', 'Vitacura',
  'Puente Alto', 'Pirque', 'San José de Maipo', 'Colina', 'Lampa', 'Tiltil',
  'San Bernardo', 'Buin', 'Calera de Tango', 'Paine',
  'Melipilla', 'Alhué', 'Curacaví', 'María Pinto', 'San Pedro',
  'Talagante', 'El Monte', 'Isla de Maipo', 'Padre Hurtado', 'Peñaflor',
];
export const COMUNAS_REGIONES = {
  'Arica y Parinacota': ['Arica'],
  'Tarapacá': ['Iquique', 'Alto Hospicio'],
  'Antofagasta': ['Antofagasta', 'Calama', 'Mejillones', 'Tocopilla'],
  'Atacama': ['Copiapó', 'Vallenar', 'Caldera'],
  'Coquimbo': ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel'],
  'Valparaíso': ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Concón', 'San Antonio', 'Los Andes', 'San Felipe', 'Quillota', 'La Calera', 'Casablanca', 'Llay-Llay'],
  "O'Higgins": ['Rancagua', 'Machalí', 'San Fernando', 'Rengo', 'Santa Cruz'],
  'Maule': ['Talca', 'Curicó', 'Linares', 'Constitución', 'Cauquenes'],
  'Ñuble': ['Chillán', 'Chillán Viejo', 'San Carlos'],
  'Biobío': ['Concepción', 'Talcahuano', 'San Pedro de la Paz', 'Hualpén', 'Chiguayante', 'Coronel', 'Lota', 'Tomé', 'Los Ángeles'],
  'Araucanía': ['Temuco', 'Padre Las Casas', 'Villarrica', 'Angol'],
  'Los Ríos': ['Valdivia', 'La Unión'],
  'Los Lagos': ['Puerto Montt', 'Puerto Varas', 'Osorno', 'Castro', 'Ancud'],
  'Aysén': ['Coyhaique', 'Aysén'],
  'Magallanes': ['Punta Arenas', 'Puerto Natales'],
};
export const OTRA_COMUNA = 'Otra comuna (fuera de la RM)';
const sinTildes = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
/** Lista para el selector con búsqueda: { comuna, region, rm } */
export const COMUNAS = [
  ...COMUNAS_RM.map((comuna) => ({ comuna, region: 'Metropolitana', rm: true })),
  ...Object.entries(COMUNAS_REGIONES).flatMap(([region, cs]) => cs.map((comuna) => ({ comuna, region, rm: false }))),
  { comuna: OTRA_COMUNA, region: 'Otra región', rm: false },
];
/** La comuna escrita (sin importar tildes ni mayúsculas), o null si no está en la lista */
export function buscarComuna(texto) {
  const t = sinTildes(texto);
  if (!t) return null;
  return COMUNAS.find((c) => sinTildes(c.comuna) === t) ?? null;
}
export const esRM = (comuna) => !!buscarComuna(comuna)?.rm;

/**
 * Lo que se ofrece al que se atascó: visita técnica gratuita en la RM; fuera, validar por videollamada o
 * fotos. Nunca promete fecha (la coordina el ejecutivo). Sin comuna todavía: null.
 */
export function ofertaRescate(comuna) {
  const c = buscarComuna(comuna);
  if (!c) return null;
  return c.rm
    ? { tipo: 'visita', titulo: '¿Prefieres que midamos nosotros?', texto: 'Visita técnica gratuita en la RM: un técnico toma las medidas reales y verifica piso y condiciones. Tu ejecutivo te contacta para coordinarla.' }
    : { tipo: 'remota', titulo: '¿Te cuesta medir tu bodega?', texto: 'Validamos tus medidas por videollamada o con fotos o el plano de tu bodega. Tu ejecutivo te contacta para coordinarlo.' };
}

// ─── Registro al final (control) o al inicio (variante A/B 'inicio') ───
/** Dónde va el registro según la variante del experimento 'registro' (null o 'final' = control) */
export const registroEn = (variante) => (variante === 'inicio' ? 'inicio' : 'final');
/**
 * ¿Este paso pide el registro antes de mostrarse? Con el control nunca: se dibuja, se arma el rack y se ve
 * el 3D sin registro; el registro va dentro del último paso, a cambio del PDF, el link y la cotización.
 */
export function pideRegistroAntes(paso, { registrado = false, variante = null } = {}) {
  if (registrado) return false;
  return registroEn(variante) === 'inicio' && paso === 'operacion';
}

// ─── RUT obligatorio (dueño 27-10) ───
// Solo empresas reales en la base: sin RUT válido no se envía la cotización ni el diseño por correo, en las
// tres vías (diseño, exprés y el registro al inicio del A/B). La API lo exige igual (api/endpoints/send_email.php).
export const MSG_RUT_FALTA = 'Escribe el RUT de tu empresa: lo encuentras en cualquier factura.';
/** Mensaje si el RUT falta o no es válido; null si sirve */
export function rutFalla(rut) {
  if (!String(rut ?? '').trim()) return MSG_RUT_FALTA;
  const r = validarRut(rut);
  return r.ok ? null : r.msg;
}

// ─── Lead para Kommo ───
export const ETIQUETA_TOUR = 'tour-logistico';
export const ETIQUETA_EXPRES = 'via-expres';
export const ETIQUETA_VISITA = 'visita-tecnica';

/** Pares que se agregan al lead de cualquiera de las dos vías (comuna, precisión, datos por confirmar, visita) */
export function configConversion({ via, comuna = '', estados = {}, porConfirmar = [], visita = false }) {
  const c = buscarComuna(comuna);
  const pr = precision(estados);
  const confirmar = [...new Set([...pr.estimados, ...porConfirmar])];
  return {
    'Vía': via === 'expres' ? 'exprés' : 'diseño',
    ...(comuna ? { 'Comuna': c ? `${c.comuna}${c.rm ? ' (RM)' : c.region !== 'Otra región' ? ` (${c.region})` : ''}` : comuna } : {}),
    'Precisión': `${pr.nivel} (${pr.pct} %)${pr.sinVisita ? ' · sin visita previa' : ''}`,
    ...(confirmar.length ? { 'Datos por confirmar': confirmar.join('; ') } : {}),
    ...(visita ? { 'Visita técnica': c?.rm ? 'solicitada (RM)' : 'validar por videollamada o fotos' } : {}),
  };
}

/**
 * Producto del lead de la vía exprés: 4 preguntas, archivo opcional y registro.
 * e = { guarda: 'pallets'|'cajas', cantidad, ancho, largo, medidasAprox, altura, alturaNoSe, grua, gruaNoSe,
 *       peso, pesoNoSe, archivos: number }
 */
export function leadExpres(e, { nombreGrua = (k) => k, prueba = false, utm = {} } = {}) {
  const estados = estadosExpres(e);
  const config = {
    ...(prueba ? { 'Prueba': 'sí' } : {}),
    'Origen': 'Planifica tu bodega (vía exprés)',
    ...configConversion({ via: 'expres', comuna: e.comuna, estados, visita: !!e.visita }),
    'Guarda': e.guarda === 'cajas' ? 'Cajas (estantería)' : 'Pallets',
    'Cantidad': `${Math.round(e.cantidad || 0)} ${e.guarda === 'cajas' ? 'cajas' : 'pallets'}`,
    'Bodega': e.ancho && e.largo ? `${e.ancho} × ${e.largo} m${e.medidasAprox ? ` (aprox. ±${TOLERANCIA_MEDIDAS} m)` : ''}` : 'sin medidas',
    ...(e.altura ? { 'Altura libre': `${e.altura} m${e.alturaNoSe ? ' (estimada)' : ''}` } : {}),
    ...(e.guarda !== 'cajas' ? { 'Equipo': e.grua ? `${nombreGrua(e.grua)}${e.gruaNoSe ? ' (estimado)' : ''}` : 'no sabe' } : {}),
    ...(e.guarda !== 'cajas' && e.peso ? { 'Peso pallet': `${e.peso} kg${e.pesoNoSe ? ' (estimado)' : ''}` } : {}),
    ...(e.archivos ? { 'Archivos del cliente': `${e.archivos} (foto o plano)` } : {}),
    ...(Object.keys(utm).length ? { 'Campaña': Object.entries(utm).map(([k, v]) => `${k}=${v}`).join(' · ') } : {}),
    // Al final, como en la vía diseño: el servidor la busca para reconocer el lead del tour
    'Etiqueta': ETIQUETA_TOUR,
  };
  return { name: 'Cotización exprés (Planifica tu bodega)', config, estados };
}

/** Estado de cada dato en la vía exprés (real, estimado o falta) */
export function estadosExpres(e) {
  const cajas = e.guarda === 'cajas';
  return {
    guarda: e.guarda ? 'real' : 'falta',
    cantidad: e.cantidad > 0 ? (e.cantidadNoSe ? 'estimado' : 'real') : 'falta',
    // En la exprés no se piden las medidas del pallet: se asume el estándar y el ejecutivo lo confirma
    medidasPallet: 'estimado',
    peso: cajas ? 'real' : e.peso ? (e.pesoNoSe ? 'estimado' : 'real') : 'falta',
    medidas: e.ancho && e.largo ? (e.medidasAprox ? 'estimado' : 'real') : 'falta',
    altura: e.altura ? (e.alturaNoSe ? 'estimado' : 'real') : 'falta',
    grua: cajas ? 'real' : e.grua ? (e.gruaNoSe ? 'estimado' : 'real') : 'falta',
  };
}

// Medidas de la bodega puestas por el cliente: las cambió (marca 'medidas_ok'), dibujó una forma, o no son
// las de ejemplo (diseños guardados antes de la marca o que llegaron desde la landing)
const bodegaTocada = (p) => (p.flags ?? []).includes('medidas_ok') || !!p.bodega?.forma || !(p.bodega?.ancho === 20 && p.bodega?.largo === 30);

/** Estado de cada dato en la vía diseño, desde el proyecto (stores/proyecto.ts) */
export function estadosDiseño(p) {
  const flags = p.flags ?? [];
  const pallets = p.pallets ?? [], cajas = p.cajas ?? [];
  const lista = [...pallets, ...cajas];
  const algun = (campos) => lista.some((t) => (t.noSe ?? []).some((c) => campos.includes(c)));
  const soloCajas = !pallets.length && cajas.length > 0;
  return {
    guarda: lista.length ? 'real' : 'falta',
    // El pallet de ejemplo (100 que pusimos nosotros) no es un dato del cliente
    cantidad: lista.some((t) => (t.cantidad ?? 0) > 0) ? (algun(['cantidad']) || pallets.some((t) => t.ejemplo) ? 'estimado' : 'real') : 'falta',
    medidasPallet: !lista.length ? 'falta' : pallets.some((t) => t.ejemplo) || algun(['alto', 'frente', 'fondo', 'apilable']) ? 'estimado' : 'real',
    peso: soloCajas ? 'real' : !pallets.length ? 'falta' : algun(['peso']) ? 'estimado' : 'real',
    // La bodega de ejemplo (20 × 30 m sin tocar) tampoco: es real cuando el cliente escribió o dibujó sus medidas
    medidas: flags.includes('no_se:medidas') ? 'estimado' : bodegaTocada(p) ? 'real' : 'estimado',
    altura: !p.bodega?.altura ? 'falta' : flags.includes('no_se:altura') ? 'estimado' : 'real',
    grua: soloCajas ? 'real' : flags.includes('no_se:equipo') || flags.includes('no_se:grua') ? 'estimado' : 'real',
  };
}
export { estadosDiseño as estadosDiseno };

/**
 * Cuerpo para POST https://api.racklog.cl/api/send-email (mismo formato que ContactModal: type 'quote').
 * cliente = { nombre, correo, empresa?, rut?, telefono?, comentarios? }; opciones.linkDiseno = enlaceRecorrido (vía diseño)
 */
export function payloadLead(cliente, producto, { linkDiseno = '' } = {}) {
  return {
    data: {
      // Diseño abierto en el recorrido, para que el ejecutivo grabe el video y se lo envíe (solo vía diseño)
      ...(linkDiseno ? { linkDiseno } : {}),
      customerName: cliente.nombre,
      customerEmail: cliente.correo,
      customerPhone: cliente.telefono || '',
      customerCompany: cliente.empresa || '',
      customerRut: cliente.rut || '',
      customerComments: cliente.comentarios || '',
      products: [{ name: producto.name, quantity: 1, price: 0, quoteOnly: true, config: producto.config }],
      cartTotal: 0,
    },
    type: 'quote',
    website: '',
  };
}

export const URL_LEAD = 'https://api.racklog.cl/api/send-email';
/**
 * Envía el lead (con archivos como multipart, igual que ContactModal). Un reintento ante 5xx o red.
 * @returns {Promise<{ ok: boolean, referencia?: string, error?: string }>}
 */
export async function enviarLead(payload, archivos = [], { url = URL_LEAD, fetcher = fetch } = {}) {
  // Sin RUT válido no sale nada (la API lo rechaza igual con 422 'RUT requerido')
  if (rutFalla(payload?.data?.customerRut)) return { ok: false, error: 'rut' };
  const cuerpo = () => {
    if (!archivos.length) return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
    const body = new FormData();
    body.append('payload', JSON.stringify(payload));
    archivos.forEach((a) => body.append('attachments[]', a, a.name));
    // La cabecera propia obliga al preflight de CORS (protección contra CSRF, como el JSON)
    return { method: 'POST', headers: { 'X-Racklog-Form': '1' }, body };
  };
  let r = await fetcher(url, cuerpo()).catch(() => null);
  if (!r || r.status >= 500) {
    await new Promise((ok) => setTimeout(ok, 1500));
    r = await fetcher(url, cuerpo()).catch(() => null);
  }
  if (!r) return { ok: false, error: 'red' };
  const datos = await r.json().catch(() => ({}));
  if (r.ok && datos.status === 'success') return { ok: true, referencia: datos.reference || '' };
  return { ok: false, error: r.status === 429 ? 'rate_limit' : r.status === 413 ? 'too_large' : /rut/i.test(datos.error || '') ? 'rut' : (datos.error || `http_${r.status}`) };
}
