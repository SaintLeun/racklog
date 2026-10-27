// Link a "su diseño": el estado del proyecto (sin datos personales) va comprimido en la URL
// (/planifica-tu-bodega/disena?d=...). Se comprime con CompressionStream 'deflate-raw' y base64url;
// si el navegador no lo tiene, va el JSON sin comprimir. Primera letra: 'z' comprimido, 'j' sin comprimir.

import { consulta, olvidarConsultaInicial } from './consulta.js';
export const RUTA_DISENO = '/planifica-tu-bodega/disena';
export const PARAMETRO = 'd';
const VERSION = 1;

// Lo que se comparte: lo que define el diseño. Fuera: lead, registro, sesion, tiempos, campaña y envio
const CAMPOS = ['sabe', 'respuestas', 'pregunta', 'sistema', 'alternativa', 'porque', 'notas',
  'pallets', 'cajas', 'modelos', 'modeloSel', 'accesorios', 'bodega', 'racks', 'flags'];

// Link para compartir con el equipo: solo lectura (con botón "Cotizar") y vence a los 30 días.
// El de "Guardar y seguir después" es del mismo cliente: editable y sin vencimiento
export const DIAS_LINK = 30;

/**
 * Copia del estado con solo los campos del diseño (sin lead ni datos del cliente).
 * opciones.ver: link de solo lectura, con vencimiento (`hasta`, ms)
 */
export function datosDiseño(estado, { ver = false, ahora = Date.now() } = {}) {
  const d = { v: VERSION };
  for (const k of CAMPOS) if (estado[k] !== undefined) d[k] = JSON.parse(JSON.stringify(estado[k]));
  if (ver) { d.ver = 1; d.hasta = ahora + DIAS_LINK * 864e5; }
  return d;
}

/** Link de solo lectura vencido */
export const vencido = (d, ahora = Date.now()) => !!(d?.ver && d.hasta && ahora > d.hasta);

// ─── base64url ───
function aBase64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function deBase64url(t) {
  const b = atob(t.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((t.length + 3) % 4));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

async function pasarPor(stream, bytes) {
  const r = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(r).arrayBuffer());
}
const hayCompresion = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

/** Texto del parametro `d` para un estado del proyecto */
export async function codificarDiseño(estado, opciones = {}) {
  // Numeros redondeados a mm: el link queda mas corto y no cambia el diseño
  const json = JSON.stringify(datosDiseño(estado, opciones), (k, v) => (k === 'hasta' ? v : (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v)));
  const bytes = new TextEncoder().encode(json);
  if (hayCompresion()) {
    try { return 'z' + aBase64url(await pasarPor(new CompressionStream('deflate-raw'), bytes)); } catch { /* sin compresion */ }
  }
  return 'j' + aBase64url(bytes);
}

/** Datos del diseño desde el texto del parametro `d` (o null si no se puede leer) */
export async function decodificarDiseño(texto) {
  try {
    if (!texto || texto.length < 2) return null;
    let bytes = deBase64url(texto.slice(1));
    if (texto[0] === 'z') {
      if (!hayCompresion()) return null;
      bytes = await pasarPor(new DecompressionStream('deflate-raw'), bytes);
    } else if (texto[0] !== 'j') return null;
    const d = JSON.parse(new TextDecoder().decode(bytes));
    if (!d || d.v !== VERSION || typeof d.bodega !== 'object' || !Array.isArray(d.racks) || !Array.isArray(d.modelos)) return null;
    return d;
  } catch {
    return null;
  }
}

/** URL completa para compartir el diseño */
export async function enlaceDiseño(estado, origen = typeof location !== 'undefined' ? location.origin : 'https://racklog.cl', opciones = {}) {
  return `${origen}${RUTA_DISENO}?${PARAMETRO}=${await codificarDiseño(estado, opciones)}`;
}

/**
 * Link para el ejecutivo de Racklog (llega en el lead): abre el diseño en Revisa, listo para grabar el recorrido
 * en video y enviárselo al cliente (dueño 27-10: el video lo manda una persona, no la web)
 */
export const PARAMETRO_RECORRIDO = 'recorrido';
export async function enlaceRecorrido(estado, origen) {
  return `${await enlaceDiseño(estado, origen)}&${PARAMETRO_RECORRIDO}=1`;
}
export function pideRecorrido(loc = typeof location !== 'undefined' ? consulta() : null) {
  if (!loc) return false;
  return new URLSearchParams(typeof loc === 'string' ? new URL(loc, 'https://racklog.cl').search : loc.search).get(PARAMETRO_RECORRIDO) === '1';
}

/** Link para compartir con el equipo: solo lectura y vence en 30 días */
export const enlaceParaVer = (estado, origen) => enlaceDiseño(estado, origen, { ver: true });

/**
 * Lee el diseño de la URL actual (o de un `location` / URL dado). Devuelve una promesa con los datos
 * o null si la URL no trae diseño. Se usa al abrir /planifica-tu-bodega/disena?d=...
 */
export async function diseñoDesdeUrl(loc = typeof location !== 'undefined' ? consulta() : null) {
  if (!loc) return null;
  const q = new URLSearchParams(typeof loc === 'string' ? new URL(loc, 'https://racklog.cl').search : loc.search);
  return decodificarDiseño(q.get(PARAMETRO));
}

/**
 * Carga el diseño en el store (useProyecto). Mantiene los datos personales de quien abre el link
 * (lead, registro, sesion, campaña) y lo deja en el paso "Tu bodega" con los pasos anteriores abiertos.
 * Devuelve true si se aplico.
 */
export function aplicarDiseño(store, datos) {
  if (!store || !datos) return false;
  const cambio = {};
  for (const k of CAMPOS) if (datos[k] !== undefined && k !== 'bodega') cambio[k] = datos[k];
  store.$patch((s) => {
    Object.assign(s, cambio);
    s.bodega = { ...s.bodega, ...(datos.bodega || {}) };
    s.enviado = false;
    s.paso = s.racks.length ? 'bodega' : s.modelos.length ? 'rack' : 'operacion';
    s.alcanzado = Math.max(s.alcanzado || 0, s.racks.length ? 5 : s.modelos.length ? 2 : 0);
  });
  if (typeof store.persistir === 'function') store.persistir();
  return true;
}

/** Quita el parametro `d` de la barra de direcciones (para que recargar no pise cambios nuevos) */
export function limpiarUrl() {
  try {
    const u = new URL(location.href);
    olvidarConsultaInicial();
    if (!u.searchParams.has(PARAMETRO) && !u.searchParams.has(PARAMETRO_RECORRIDO)) return;
    u.searchParams.delete(PARAMETRO);
    u.searchParams.delete(PARAMETRO_RECORRIDO);
    history.replaceState(history.state, '', u.pathname + u.search + u.hash);
  } catch { /* sin history */ }
}

// Alias sin ñ (por si se importan desde un archivo que no la acepta)
export { datosDiseño as datosDiseno, codificarDiseño as codificarDiseno, decodificarDiseño as decodificarDiseno, enlaceDiseño as enlaceDiseno, diseñoDesdeUrl as disenoDesdeUrl, aplicarDiseño as aplicarDiseno };
