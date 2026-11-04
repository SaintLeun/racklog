// Link al diseño del planificador 3D (/planificador?d=...#k=...): la bodega y los racks van comprimidos y
// encriptados en la URL (la clave en #k, que no sale del navegador), igual que en "Planifica tu bodega" (lib/flujo/enlace.js). Llega en el lead para que el ejecutivo abra
// el diseño del cliente tal como lo dejó. Sin datos personales; el plano calcado (imagen) no va.
import { codificarJson, decodificarJson, redondearMm, armarEnlace } from '../flujo/enlace.js';

export const RUTA_PLANIFICADOR = '/planificador';
const MARCA = 'p1';
// La API descarta links de más de 8000 caracteres: mejor no enviar uno que llegaría cortado
export const LARGO_MAXIMO = 7900;

/** URL del diseño, o '' si no cabe en el límite de la API */
export async function enlacePlanificador({ bodega, racks }, origen) {
  const url = armarEnlace(`${origen}${RUTA_PLANIFICADOR}`, await codificarJson({ v: MARCA, bodega, racks }, redondearMm));
  return url.length <= LARGO_MAXIMO ? url : '';
}

/** { bodega, racks } desde `d` y su clave `k`, o null si no es un diseño del planificador (o la clave no calza) */
export async function planificadorDesdeTexto(texto, clave = '') {
  const d = await decodificarJson(texto, clave);
  if (!d || d.v !== MARCA || !d.bodega || typeof d.bodega !== 'object' || !Array.isArray(d.racks)) return null;
  return { bodega: d.bodega, racks: d.racks };
}
