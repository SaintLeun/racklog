// Foto de la vista 3D ya armada en Revisa, para que el paso 7 no tenga que volver a armar la escena
// (la imagen y el PDF salen al instante). Vale solo para el mismo diseño (misma bodega y racks).
let ultima = null;
const clave = (p) => JSON.stringify([p.bodega, p.racks, p.accesorios]);

export function guardarCaptura(p, img) {
  if (img) ultima = { clave: clave(p), img };
}
export function capturaGuardada(p) {
  return ultima && ultima.clave === clave(p) ? ultima.img : null;
}
