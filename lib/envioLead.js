// A dónde van los formularios (cotización y contacto).
// En racklog.cl van directo a la API. En cualquier otro sitio (link de prueba del Codespace, localhost) la API
// los rechaza por CORS, así que van al reenvío del servidor de desarrollo (server/routes/prueba-lead/send-email.post.ts),
// que los manda a la API marcados como PRUEBA. Ese reenvío solo existe con `nuxt dev`: el sitio publicado es estático.

export const URL_LEAD = 'https://api.racklog.cl/api/send-email';
export const URL_LEAD_PRUEBA = '/prueba-lead/send-email';
const HOSTS_REALES = ['racklog.cl', 'www.racklog.cl'];

// En la versión de prueba solo se aceptan correos de prueba: así Kommo marca el lead PRUEBA y un cliente real nunca queda como prueba
export const CORREO_PRUEBA = 'comercial+prueba@racklog.cl';
export const esCorreoPrueba = (correo) => /\+prueba@racklog\.cl$/i.test(String(correo ?? '').trim());

/** true fuera de racklog.cl (link de prueba, localhost). Sin navegador (pruebas en Node): false */
export function esSitioPrueba(host = globalThis.location?.hostname ?? '') {
  return Boolean(host) && !HOSTS_REALES.includes(host);
}

export function urlLead(host) {
  return esSitioPrueba(host) ? URL_LEAD_PRUEBA : URL_LEAD;
}

// Errores propios de la versión de prueba, con el mensaje para el usuario
export const MENSAJES_PRUEBA = {
  correo_prueba: `Estás en la versión de prueba: usa un correo que termine en +prueba@racklog.cl (por ejemplo ${CORREO_PRUEBA}).`,
  prueba_sin_envio: 'Estás en la versión de prueba y este link no puede enviar cotizaciones. En racklog.cl el envío funciona normal.',
};

/**
 * Traduce el resultado de un envío fallido a un código: en la versión de prueba, un error de red o un 404
 * significa que no hay reenvío (p. ej. un build estático servido aparte), no que falló la API.
 */
export function errorEnvio(status, datos, host) {
  if (datos?.error === 'correo_prueba') return 'correo_prueba';
  if (esSitioPrueba(host) && (!status || status === 404 || status === 405)) return 'prueba_sin_envio';
  return null;
}

/**
 * Dominio para los links al diseño que viajan en el lead. La API solo acepta links de racklog.cl, así que en la
 * versión de prueba se usa racklog.cl (abre una vez publicado; para verlo en el Codespace, cambiar el dominio).
 */
export function origenPublico(host) {
  return esSitioPrueba(host) || !globalThis.location ? 'https://racklog.cl' : globalThis.location.origin;
}
