// Link al diseño del planificador 3D (/planificador?d=...): la bodega y los racks van comprimidos en la URL,
// igual que en "Planifica tu bodega" (lib/flujo/enlace.js). Llega en el lead para que el ejecutivo abra
// el diseño del cliente tal como lo dejó. Sin datos personales; el plano calcado (imagen) no va.
import { codificarJson, decodificarJson, redondearMm } from '../flujo/enlace.js';

export const RUTA_PLANIFICADOR = '/planificador';
const MARCA = 'p1';
// La API descarta links de más de 8000 caracteres: mejor no enviar uno que llegaría cortado
export const LARGO_MAXIMO = 7900;

/** URL del diseño, o '' si no cabe en el límite de la API */
export async function enlacePlanificador({ bodega, racks }, origen) {
  const texto = await codificarJson({ v: MARCA, bodega, racks }, redondearMm);
  const url = `${origen}${RUTA_PLANIFICADOR}?d=${texto}`;
  return url.length <= LARGO_MAXIMO ? url : '';
}

/** { bodega, racks } desde el parámetro `d`, o null si no es un diseño del planificador */
export async function planificadorDesdeTexto(texto) {
  const d = await decodificarJson(texto);
  if (!d || d.v !== MARCA || !d.bodega || typeof d.bodega !== 'object' || !Array.isArray(d.racks)) return null;
  return { bodega: d.bodega, racks: d.racks };
}
