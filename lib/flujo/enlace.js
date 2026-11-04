// Link a "su diseño": el estado del proyecto (sin datos personales) va en la URL, comprimido y ENCRIPTADO
// (/planifica-tu-bodega/disena?d=...#k=...). Se comprime con 'deflate-raw' y se cifra con AES-256-GCM con una
// clave aleatoria por link. El diseño cifrado va en ?d= y la clave en #k=: el fragmento (#) nunca sale del
// navegador, así que servidores, logs y analítica solo ven texto cifrado. GCM además detecta cualquier cambio:
// un link editado (p. ej. para alargar el vencimiento) no abre.
// Primera letra de `d`: 'e' cifrado y comprimido, 'f' cifrado sin comprimir; los links de antes ('z' comprimido,
// 'j' sin comprimir, sin cifrar) se siguen leyendo.

import { consulta, fragmento, olvidarConsultaInicial } from './consulta.js';
import { palletsSinCajas } from '../tour/pallet.js';
export const RUTA_DISENO = '/planifica-tu-bodega/disena';
export const PARAMETRO = 'd';
export const PARAMETRO_CLAVE = 'k';
const VERSION = 1;

// Lo que se comparte: lo que define el diseño. Fuera: lead, registro, sesion, tiempos, campaña y envio
const CAMPOS = ['sabe', 'respuestas', 'pregunta', 'sistema', 'alternativa', 'porque', 'notas',
  'pallets', 'cajas', 'modelos', 'modeloSel', 'accesorios', 'bodega', 'racks', 'flags'];

// Link para compartir con el equipo: solo lectura (con botón "Cotizar") y vence a las 24 horas (dueño 04-11).
// El de "Guardar y seguir después" es del mismo cliente: editable y sin vencimiento
export const HORAS_LINK = 24;

/**
 * Copia del estado con solo los campos del diseño (sin lead ni datos del cliente).
 * opciones.ver: link de solo lectura, con vencimiento (`hasta`, ms)
 */
export function datosDiseño(estado, { ver = false, ahora = Date.now() } = {}) {
  const d = { v: VERSION };
  for (const k of CAMPOS) if (estado[k] !== undefined) d[k] = JSON.parse(JSON.stringify(estado[k]));
  if (ver) { d.ver = 1; d.hasta = ahora + HORAS_LINK * 36e5; }
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

// Cifrado: necesita Web Crypto (https o localhost). Sin él, el link va sin cifrar (como antes)
const hayCifrado = () => typeof globalThis.crypto?.subtle?.encrypt === 'function';
const claveAes = (bytes, uso) => globalThis.crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, [uso]);

/**
 * Objeto → partes del link: `d` (diseño cifrado, para ?d=) y `k` (clave, para #k=; vacía si no se pudo cifrar)
 * @returns {Promise<{ d: string, k: string }>}
 */
export async function codificarJson(obj, reemplazo) {
  let bytes = new TextEncoder().encode(JSON.stringify(obj, reemplazo));
  let comprimido = false;
  if (hayCompresion()) {
    try { bytes = await pasarPor(new CompressionStream('deflate-raw'), bytes); comprimido = true; } catch { /* sin compresion */ }
  }
  if (hayCifrado()) {
    try {
      const clave = globalThis.crypto.getRandomValues(new Uint8Array(32));
      const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
      const cifrado = new Uint8Array(await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await claveAes(clave, 'encrypt'), bytes));
      const todo = new Uint8Array(iv.length + cifrado.length);
      todo.set(iv);
      todo.set(cifrado, iv.length);
      return { d: (comprimido ? 'e' : 'f') + aBase64url(todo), k: aBase64url(clave) };
    } catch { /* sin cifrado */ }
  }
  return { d: (comprimido ? 'z' : 'j') + aBase64url(bytes), k: '' };
}

/** Partes del link (`d` y la clave `k`) → objeto, o null si no se puede leer (clave que falta o no calza, link editado) */
export async function decodificarJson(texto, clave = '') {
  try {
    if (!texto || texto.length < 2) return null;
    const tipo = texto[0];
    let bytes = deBase64url(texto.slice(1));
    if (tipo === 'e' || tipo === 'f') {
      if (!clave || !hayCifrado()) return null;
      const iv = bytes.subarray(0, 12);
      bytes = new Uint8Array(await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await claveAes(deBase64url(clave), 'decrypt'), bytes.subarray(12)));
    } else if (tipo !== 'z' && tipo !== 'j') return null;
    if (tipo === 'e' || tipo === 'z') {
      if (!hayCompresion()) return null;
      bytes = await pasarPor(new DecompressionStream('deflate-raw'), bytes);
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/** URL con el diseño: base?d=...[&extra]#k=... */
export function armarEnlace(base, { d, k }, extra = '') {
  return `${base}?${PARAMETRO}=${d}${extra}${k ? `#${PARAMETRO_CLAVE}=${k}` : ''}`;
}

/** `d` y `k` de una URL (texto o `location`) */
export function partesEnlace(loc) {
  const u = typeof loc === 'string' ? new URL(loc, 'https://racklog.cl') : loc;
  return {
    d: new URLSearchParams(u.search).get(PARAMETRO),
    k: new URLSearchParams((u.hash || '').replace(/^#/, '')).get(PARAMETRO_CLAVE) || '',
  };
}

// Numeros redondeados a mm: el link queda mas corto y no cambia el diseño
export const redondearMm = (k, v) => (k === 'hasta' ? v : (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v));

/** Partes del link ({ d, k }) para un estado del proyecto */
export async function codificarDiseño(estado, opciones = {}) {
  return codificarJson(datosDiseño(estado, opciones), redondearMm);
}

/** Datos del diseño desde `d` y su clave `k` (o null si no se puede leer) */
export async function decodificarDiseño(texto, clave = '') {
  const d = await decodificarJson(texto, clave);
  if (!d || d.v !== VERSION || typeof d.bodega !== 'object' || !Array.isArray(d.racks) || !Array.isArray(d.modelos)) return null;
  return d;
}

/** URL completa para compartir el diseño */
export async function enlaceDiseño(estado, origen = typeof location !== 'undefined' ? location.origin : 'https://racklog.cl', opciones = {}, extra = '') {
  return armarEnlace(`${origen}${RUTA_DISENO}`, await codificarDiseño(estado, opciones), extra);
}

/**
 * Link para el ejecutivo de Racklog (llega en el lead): abre el diseño en Revisa, listo para grabar el recorrido
 * en video y enviárselo al cliente (dueño 27-10: el video lo manda una persona, no la web)
 */
export const PARAMETRO_RECORRIDO = 'recorrido';
export async function enlaceRecorrido(estado, origen) {
  return enlaceDiseño(estado, origen, {}, `&${PARAMETRO_RECORRIDO}=1`);
}
export function pideRecorrido(loc = typeof location !== 'undefined' ? consulta() : null) {
  if (!loc) return false;
  return new URLSearchParams(typeof loc === 'string' ? new URL(loc, 'https://racklog.cl').search : loc.search).get(PARAMETRO_RECORRIDO) === '1';
}

/** Link para compartir con el equipo: solo lectura y vence en 24 horas */
export const enlaceParaVer = (estado, origen) => enlaceDiseño(estado, origen, { ver: true });

/**
 * Lee el diseño de la URL actual (o de un `location` / URL dado). Devuelve una promesa con los datos
 * o null si la URL no trae diseño. Se usa al abrir /planifica-tu-bodega/disena?d=...
 */
export async function diseñoDesdeUrl(loc = typeof location !== 'undefined' ? consulta() + fragmento() : null) {
  if (!loc) return null;
  const { d, k } = partesEnlace(loc);
  return decodificarDiseño(d, k);
}

/**
 * Carga el diseño en el store (useProyecto). Mantiene los datos personales de quien abre el link
 * (lead, registro, sesion, campaña) y lo deja en "Arma tu layout" con los pasos anteriores abiertos.
 * Devuelve true si se aplico.
 */
export function aplicarDiseño(store, datos) {
  if (!store || !datos) return false;
  const cambio = {};
  for (const k of CAMPOS) if (datos[k] !== undefined && k !== 'bodega') cambio[k] = datos[k];
  // Links de antes con pallets armados desde cajas (selectivo y drive-in): pasan a alto y peso directos
  if (Array.isArray(cambio.pallets)) palletsSinCajas(cambio.pallets);
  store.$patch((s) => {
    Object.assign(s, cambio);
    s.bodega = { ...s.bodega, ...(datos.bodega || {}) };
    s.enviado = false;
    s.paso = s.racks.length ? 'bodega' : s.modelos.length ? 'rack' : 'operacion';
    s.alcanzado = Math.max(s.alcanzado || 0, s.racks.length ? 4 : s.modelos.length ? 2 : 0);
  });
  if (typeof store.persistir === 'function') store.persistir();
  return true;
}

/** Quita el diseño (`d`) y su clave (`#k`) de la barra de direcciones (para que recargar no pise cambios nuevos) */
export function limpiarUrl() {
  try {
    const u = new URL(location.href);
    olvidarConsultaInicial();
    const conClave = new URLSearchParams(u.hash.replace(/^#/, '')).has(PARAMETRO_CLAVE);
    if (!u.searchParams.has(PARAMETRO) && !u.searchParams.has(PARAMETRO_RECORRIDO) && !conClave) return;
    u.searchParams.delete(PARAMETRO);
    u.searchParams.delete(PARAMETRO_RECORRIDO);
    // La clave tampoco queda en la barra de direcciones ni en el historial
    history.replaceState(history.state, '', u.pathname + u.search + (conClave ? '' : u.hash));
  } catch { /* sin history */ }
}

// Alias sin ñ (por si se importan desde un archivo que no la acepta)
export { datosDiseño as datosDiseno, codificarDiseño as codificarDiseno, decodificarDiseño as decodificarDiseno, enlaceDiseño as enlaceDiseno, diseñoDesdeUrl as disenoDesdeUrl, aplicarDiseño as aplicarDiseno };
