// Reenvío de formularios desde la versión de prueba (link del Codespace, localhost) a la API de producción.
// La API solo acepta navegadores de racklog.cl (CORS); este servidor la llama por detrás con ese origen.
// Todo lo que pasa por aquí llega como PRUEBA: solo correos +prueba@racklog.cl, "Prueba: sí" en la cotización
// (Kommo le pone la etiqueta PRUEBA, sin vendedor ni tarea de 24 h) y "[PRUEBA]" en los contactos.
// Solo corre con `nuxt dev`: el sitio publicado es estático (nitro preset "static") y no incluye esta ruta.
import { defineEventHandler, getRequestHeader, getRequestURL, readMultipartFormData, readRawBody, setResponseStatus, setResponseHeader } from 'h3';
import { URL_LEAD, esCorreoPrueba } from '~/lib/envioLead.js';

type Payload = { type?: string; data?: Record<string, any>; website?: string };

/**
 * Marca el payload como prueba; false si el correo no es de prueba.
 * El link al diseño apunta a racklog.cl (la API solo acepta ese dominio), pero en prueba ese sitio puede no tener
 * la versión nueva y la API publicada puede botar el link: se copia en los comentarios apuntando a este servidor.
 */
function marcarPrueba(payload: Payload, origenLocal: string): boolean {
  const d = payload?.data;
  if (!d || typeof d !== 'object') return false;
  const correo = payload.type === 'quote' ? d.customerEmail : d.email;
  if (!esCorreoPrueba(correo)) return false;
  if (Array.isArray(d.products)) {
    // Primero, para que nunca quede fuera del límite de pares de la API
    d.products = d.products.map((p: any) => ({ ...p, config: { Prueba: 'sí', ...(p?.config ?? {}) } }));
    if (typeof d.linkDiseno === 'string' && d.linkDiseno.startsWith('https://racklog.cl/')) {
      const local = origenLocal + d.linkDiseno.slice('https://racklog.cl'.length);
      const conLink = `${d.customerComments ?? ''}\n\nDiseño del cliente (PRUEBA, abre en este servidor):\n${local}`.trim();
      if (conLink.length <= 5000) d.customerComments = conLink;   // la API corta los comentarios en 5000: un link cortado no abre
    }
  } else {
    d.subject = `[PRUEBA] ${d.subject ?? ''}`.trim();
  }
  return true;
}

export default defineEventHandler(async (event) => {
  const tipo = getRequestHeader(event, 'content-type') ?? '';
  const responder = (status: number, cuerpo: unknown) => {
    setResponseStatus(event, status);
    setResponseHeader(event, 'content-type', 'application/json');
    return JSON.stringify(cuerpo);
  };

  const origen = getRequestHeader(event, 'origin') || getRequestURL(event).origin;   // la página desde la que se envió
  let payload: Payload;
  let body: BodyInit;
  const headers: Record<string, string> = { Origin: 'https://racklog.cl' };
  try {
    if (tipo.startsWith('multipart/form-data')) {
      const partes = (await readMultipartFormData(event)) ?? [];
      payload = JSON.parse(partes.find((p) => p.name === 'payload')?.data.toString('utf8') ?? '');
      if (!marcarPrueba(payload, origen)) return responder(422, { error: 'correo_prueba' });
      const fd = new FormData();
      fd.append('payload', JSON.stringify(payload));
      partes.filter((p) => p.name === 'attachments[]').forEach((p) => {
        fd.append('attachments[]', new Blob([new Uint8Array(p.data)], { type: p.type || 'application/octet-stream' }), p.filename || 'adjunto');
      });
      body = fd;
      headers['X-Racklog-Form'] = '1';
    } else {
      payload = JSON.parse((await readRawBody(event, 'utf8')) ?? '');
      if (!marcarPrueba(payload, origen)) return responder(422, { error: 'correo_prueba' });
      body = JSON.stringify(payload);
      headers['Content-Type'] = 'application/json';
    }
  } catch {
    return responder(400, { error: 'Invalid JSON' });
  }

  try {
    const r = await fetch(URL_LEAD, { method: 'POST', headers, body, signal: AbortSignal.timeout(45000) });
    const texto = await r.text();
    console.info(`[prueba-lead] ${payload.type} → API ${r.status} ${texto.slice(0, 200)}`);
    setResponseStatus(event, r.status);
    setResponseHeader(event, 'content-type', 'application/json');
    return texto;
  } catch (e) {
    console.error('[prueba-lead] la API no respondió', e);
    return responder(502, { error: 'api_sin_respuesta' });
  }
});
