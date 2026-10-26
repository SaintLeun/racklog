// Entregables del paso 7 (premio): datos del PDF del diseño, imagen 3D compartible (1200 × 630),
// plano 2D como imagen y el logo que sube el cliente (solo en esta sesion del navegador).
import { area, contorno, formatoM, PERFILES } from '~/lib/rack3d/planificador.js';
import { GRUAS } from '~/lib/rack3d/parametrosTecnicos.js';
import { revisarDiseno, resumenViabilidad } from '~/lib/rack3d/viabilidad.js';
import { proponerAccesorios, aplicarAjustes, textoAccesorios } from '~/lib/rack3d/accesorios.js';
import { queCotizar, conteoTotal } from '~/lib/flujo/calculos.js';
import { vistasPorRol, resumenEjecutivo } from '~/lib/flujo/perfiles.js';
import { NORMAS, TEXTO_INGENIERIA, estadosDiseño, precision } from '~/lib/flujo/conversion.js';

const n = (v) => Math.round(v || 0).toLocaleString('es-CL');
const fm = (v) => formatoM(v || 0);

/** Nombre de archivo sin tildes ni espacios: "Bodegas Sur" → "bodegas-sur" */
export const nombreArchivo = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bodega';

// Datos que el cliente dejo en "No sé", en palabras simples (el ejecutivo los confirma)
export const NOMBRES_NO_SE = {
  // Mismos nombres que DATOS (lib/flujo/conversion.js) para no repetir un dato en "Datos por confirmar"
  alto: 'medidas del pallet o la caja', peso: 'peso del pallet', altura: 'altura libre de la bodega', equipo: 'equipo de carga', rotacion: 'rotación',
  pallets_sku: 'pallets por producto', unidad: 'cómo guardas (pallet o caja)', kg_nivel: 'peso por nivel',
  n_sku: 'cuántos productos distintos', salida: 'cómo sale la mercadería', fifo: 'orden de salida de los pallets',
  espacio: 'espacio disponible', medidas: 'medidas de la bodega', apilable: 'medidas del pallet o la caja',
};
/** Lista sin repetir de lo que queda por confirmar */
export function porConfirmar(p) {
  const nombre = (k) => NOMBRES_NO_SE[k] ?? k.replace(/_/g, ' ');
  return [...new Set([
    ...p.flags.filter((f) => f.startsWith('no_se:')).map((f) => nombre(f.slice(6))),
    ...p.pallets.flatMap((t) => (t.noSe ?? []).map(nombre)),
    ...p.pallets.filter((t) => t.ejemplo).map(() => 'medidas del pallet o la caja'),
    ...(p.cajas ?? []).flatMap((t) => (t.noSe ?? []).map(nombre)),
  ])];
}

/** Cuantas posiciones (o bandejas) nuevas tiene el diseño: { n, unidad: 'posiciones' | 'bandejas' } */
export function cifraPrincipal(racks) {
  const c = conteoTotal((racks || []).filter((r) => !r.existente));
  return c.posiciones || !c.bandejas ? { n: c.posiciones, unidad: 'posiciones' } : { n: c.bandejas, unidad: 'bandejas' };
}

// ─── Logo del cliente: dataURL en memoria (y en sessionStorage si cabe), achicado a 600 px ───
const CLAVE_LOGO = 'racklog-logo-cliente';
let logoMemoria = null;
export function logoCliente() {
  if (logoMemoria) return logoMemoria;
  try { logoMemoria = sessionStorage.getItem(CLAVE_LOGO); } catch { /* bloqueado */ }
  return logoMemoria;
}
export function guardarLogo(dataUrl) {
  logoMemoria = dataUrl;
  try { if (dataUrl) sessionStorage.setItem(CLAVE_LOGO, dataUrl); else sessionStorage.removeItem(CLAVE_LOGO); } catch { /* lleno o bloqueado */ }
}
/** Lee un PNG o JPG y lo deja como PNG de hasta 600 px de lado (dataURL) */
export function leerLogo(archivo) {
  return new Promise((ok, mal) => {
    if (!archivo || !/^image\/(png|jpe?g)$/.test(archivo.type)) { mal(new Error('formato')); return; }
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * k));
      c.height = Math.max(1, Math.round(img.naturalHeight * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('imagen')); };
    img.src = url;
  });
}

/** El SVG del plano (PlanificadorPlano2D) como PNG (dataURL), ~60 px por metro y hasta 4.000 px */
/** @param {SVGSVGElement} svg @returns {Promise<string | null>} */
export async function imagenSvg(svg) {
  if (!svg?.viewBox) return null;
  const copia = svg.cloneNode(true);
  const vb = svg.viewBox.baseVal;
  const escala = Math.min(4000 / vb.width, 4000 / vb.height, 60);
  const ancho = Math.round(vb.width * escala), alto = Math.round(vb.height * escala);
  copia.setAttribute('width', String(ancho));
  copia.setAttribute('height', String(alto));
  copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copia)], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise((ok, mal) => { img.onload = ok; img.onerror = mal; img.src = url; });
    const c = document.createElement('canvas');
    c.width = ancho;
    c.height = alto;
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, ancho, alto);
    x.drawImage(img, 0, 0);
    return c.toDataURL('image/png');
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const cargarImagen = (src) => new Promise((ok, mal) => {
  const img = new Image();
  img.onload = () => ok(img);
  img.onerror = mal;
  img.src = src;
});

function redondeado(x, X, Y, w, h, r) {
  x.beginPath();
  x.moveTo(X + r, Y);
  x.arcTo(X + w, Y, X + w, Y + h, r);
  x.arcTo(X + w, Y + h, X, Y + h, r);
  x.arcTo(X, Y + h, X, Y, r);
  x.arcTo(X, Y, X + w, Y, r);
  x.closePath();
}

/**
 * Imagen para compartir (1200 × 630, PNG): la vista 3D de fondo, logo Racklog,
 * "Bodega de <empresa> · X posiciones" y racklog.cl. Devuelve un Blob.
 * @param {{ vista3d: string | null, empresa: string, cifra: { n: number, unidad: string }, logoCliente?: string | null }} d
 * @returns {Promise<Blob | null>}
 */
export async function imagenCompartible({ vista3d, empresa, cifra, logoCliente: logoCli = null }) {
  const W = 1200, H = 630;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#eef0f3';
  x.fillRect(0, 0, W, H);
  if (vista3d) {
    try {
      const img = await cargarImagen(vista3d);
      const k = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const iw = img.naturalWidth * k, ih = img.naturalHeight * k;
      x.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
    } catch { /* sin 3D: queda el fondo */ }
  }
  // Franja inferior oscura para que el texto se lea sobre cualquier 3D
  const g = x.createLinearGradient(0, H - 260, 0, H);
  g.addColorStop(0, 'rgba(23,23,23,0)');
  g.addColorStop(0.45, 'rgba(23,23,23,.72)');
  g.addColorStop(1, 'rgba(23,23,23,.9)');
  x.fillStyle = g;
  x.fillRect(0, H - 260, W, 260);

  // Logo Racklog sobre una pastilla blanca (arriba a la izquierda) y el del cliente a la derecha
  const pastilla = async (src, X, alto, derecha = false) => {
    try {
      const img = await cargarImagen(src);
      const asp = img.naturalWidth / img.naturalHeight;
      let h = alto, w = asp * h;
      if (w > 320) { w = 320; h = w / asp; }
      const px = derecha ? W - X - w - 40 : X;
      x.fillStyle = 'rgba(255,255,255,.95)';
      redondeado(x, px, 32, w + 40, alto + 28, 16);
      x.fill();
      x.drawImage(img, px + 20, 46 + (alto - h) / 2, w, h);
    } catch { /* sin logo */ }
  };
  await pastilla('/assets/images/logo.png', 40, 46);
  if (logoCli) await pastilla(logoCli, 40, 60, true);

  x.fillStyle = '#fff';
  x.textBaseline = 'alphabetic';
  const titulo = `Bodega de ${empresa || 'mi empresa'}`;
  let t = 64;
  x.font = `700 ${t}px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;
  while (x.measureText(titulo).width > W - 96 && t > 34) { t -= 2; x.font = `700 ${t}px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`; }
  x.fillText(titulo, 48, H - 112);
  x.font = `600 40px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;
  x.fillStyle = '#fdba74';
  x.fillText(`${n(cifra?.n)} ${cifra?.unidad || 'posiciones'}`, 48, H - 52);
  x.font = `600 30px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;
  x.fillStyle = '#fff';
  x.textAlign = 'right';
  x.fillText('racklog.cl', W - 48, H - 52);
  x.textAlign = 'left';
  return new Promise((ok) => c.toBlob(ok, 'image/png'));
}

/** Descarga un Blob con ese nombre */
export function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Lo que va en el PDF del diseño, calculado desde el estado del proyecto (useProyecto):
 * { empresa, bodega, viable, cifra, cotizar, accesorios, confirmar, kpis: [{ rol, filas: [[k, v]] }] }
 */
export function resumenDiseño(p) {
  const nuevos = p.racks.filter((r) => !r.existente);
  const c = conteoTotal(nuevos);
  const m2 = area(contorno(p.bodega));
  const grua = GRUAS[p.bodega.grua] ?? GRUAS.contrapeso;
  const acc = aplicarAjustes(proponerAccesorios({ bodega: p.bodega, racks: p.racks, pallets: p.pallets }), p.accesorios);
  const avisos = revisarDiseno({ bodega: p.bodega, racks: p.racks, pallets: p.pallets, accesorios: p.accesorios });
  const res = resumenViabilidad(avisos);
  const cotizar = queCotizar(p.modelos, p.racks);
  const accesorios = acc.filter((a) => a.incluido !== false && a.cantidad > 0).map((a) => textoAccesorios([a]));
  const confirmar = porConfirmar(p);
  // Por perfil: la misma cuenta que las pestañas de Revisa (lib/flujo/perfiles.js)
  const v = vistasPorRol(p);
  const g = v.gerencia, bo = v.bodega, co = v.compras;
  const kpis = [
    { rol: 'Gerencia', filas: [
      ...(g.hoy ? [['Posiciones hoy', n(g.hoy)]] : []),
      ['Con Racklog', g.hoy ? `${n(g.conRacklog)} (+${n(g.mas)}${g.masPct != null ? `, +${g.masPct} %` : ''})` : n(g.conRacklog)],
      ...g.anios.slice(1).map((x) => [`Necesitas ${x.t.toLowerCase()} (+${Math.round(g.crecimiento * 100)} %/año)`, `${n(x.necesitas)} ${x.cubre ? '· cubierto' : '· fase 2'}`]),
      ['Bodega usada', `${g.usadoPct} % de ${n(g.m2)} m²`],
      ['Libre para crecer', `${n(g.libre)} m²${g.fase2 ? ` (≈ ${n(g.fase2)} posiciones más)` : ''}`],
      ['Plazo', 'lo confirma tu ejecutivo en máximo 24 horas'],
    ] },
    { rol: 'Bodega', filas: [
      ['Posiciones', n(c.posiciones)],
      ...(c.bandejas ? [['Bandejas', n(c.bandejas)]] : []),
      ...bo.productos.slice(0, 4).map((x) => [x.nombre, `${x.donde}: ${x.niveles}`]),
      ['Pasillos', `${bo.pasillos.n} de ${bo.pasillos.anchos.join(' / ') || '—'} m`],
      ['Tu equipo pide', `${fm(grua.pasillo)} m de pasillo`],
      ['Nivel más alto', `${fm(bo.nivelMax)} m (tu equipo llega a ${fm(bo.levante)} m)`],
    ] },
    { rol: 'Compras', filas: [
      ['Marcos', n(c.marcos)],
      ['Pares de vigas', n(c.paresVigas)],
      ['Cuerpos', n(c.cuerpos)],
      ['Normas de cálculo', 'NCh2369 · ANSI MH16.1'],
      ['Cotización', 'en máximo 24 horas'],
    ] },
  ];
  // Página ejecutiva (para el que firma): lo estimado por el cliente y sus "No sé" van como datos por confirmar
  const pr = precision(estadosDiseño(p));
  const ejecutivo = { ...resumenEjecutivo(p), normas: NORMAS, ingenieria: TEXTO_INGENIERIA, precision: pr, confirmar: [...new Set([...pr.estimados, ...confirmar])] };
  return {
    ejecutivo,
    empresa: p.lead.empresa || '',
    rol: PERFILES.find((x) => x.v === p.lead.perfil)?.t ?? '',
    bodega: `${fm(p.bodega.ancho)} × ${fm(p.bodega.largo)} m (${n(m2)} m²)${p.bodega.altura ? ` · altura libre ${fm(p.bodega.altura)} m` : ''} · ${grua.nombre.toLowerCase()}`,
    viable: res.viable,
    cifra: cifraPrincipal(p.racks),
    racks: nuevos.length,
    cotizar,
    accesorios,
    confirmar,
    kpis,
    // Especificación de 1 página para compras
    especificacion: { accesorios: co.accesorios, norma: co.norma, pesoAcero: co.pesoAcero, conteo: co.conteo },
  };
}
export { resumenDiseño as resumenDiseno };

/** Especificación de 1 página para compras (aparte del PDF del diseño) */
export async function descargarEspecificacion(p) {
  const { crearPdfEspecificacion } = await import('~/lib/rack3d/pdfPlano.js');
  const blob = await crearPdfEspecificacion(resumenDiseño(p));
  descargar(blob, `especificacion-racks-${nombreArchivo(p.lead.empresa)}.pdf`);
}
