// PDF del plano del planificador: lo descarga el cliente despues de dejar sus datos (peaje).
// Es un resumen preliminar: sin despiece ni lista de materiales, con marca de agua del cliente.
// jsPDF se importa aqui y este modulo solo se carga al pedir el PDF.
import { jsPDF } from 'jspdf';

const NARANJO = [194, 65, 12];
const GRIS = [82, 82, 91];
const TINTA = [24, 24, 27];

async function imagenComoDataUrl(url) {
  const r = await fetch(url);
  const blob = await r.blob();
  return new Promise((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => ok(lector.result);
    lector.onerror = mal;
    lector.readAsDataURL(blob);
  });
}

function medidasImagen(dataUrl) {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => ok({ w: 4, h: 3 });
    img.src = dataUrl;
  });
}

// JPEG de hasta `max` px de lado, con fondo blanco: un PNG grande dejaba el PDF en ~10 MB
function comoJpeg(dataUrl, max = 2200, calidad = 0.85) {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k);
      c.height = Math.round(img.naturalHeight * k);
      const x = c.getContext('2d');
      x.fillStyle = '#fff';
      x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/jpeg', calidad));
    };
    img.onerror = () => ok(dataUrl);
    img.src = dataUrl;
  });
}

// Imagen dentro de una caja (mm), centrada y sin deformar
async function encajar(doc, dataUrl, tipo, x, y, w, h) {
  const m = await medidasImagen(dataUrl);
  const k = Math.min(w / m.w, h / m.h);
  const iw = m.w * k, ih = m.h * k;
  doc.addImage(dataUrl, tipo, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

function marcaDeAgua(doc, texto) {
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.07 }));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(...TINTA);
  for (let y = 60; y < 230; y += 70) doc.text(texto, 40, y, { angle: 25 });
  doc.restoreGraphicsState();
}

function pie(doc, pagina, total) {
  doc.setDrawColor(...NARANJO);
  doc.setLineWidth(0.6);
  doc.line(12, 197, 285, 197);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIS);
  doc.text('Diseño preliminar: no válido para fabricación ni instalación. Un ejecutivo de Racklog lo revisa sin costo antes de la propuesta formal.', 12, 202);
  doc.text('Racklog SpA · contacto@racklog.cl · +56 9 3240 3819 · racklog.cl', 12, 206);
  doc.text(`Página ${pagina} de ${total}`, 285, 206, { align: 'right' });
}

/**
 * @param {{ cliente: { company: string, rut: string, name: string, email: string, comuna: string, reference: string },
 *   plano: string, vista3d: string | null, bodega: string, filas: string[][], indicadores: [string, string][], evaluacion?: string[] }} d
 * @returns {Promise<Blob>}
 */
export async function crearPdfPlano(d) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  const fecha = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const agua = `${d.cliente.company} · ${d.cliente.rut}`;
  const logo = await imagenComoDataUrl('/assets/images/logo.png').catch(() => null);

  const encabezado = (titulo) => {
    if (logo) doc.addImage(logo, 'PNG', 12, 9, 44, 11.4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...TINTA);
    doc.text(titulo, 285, 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRIS);
    doc.text(`Ref. ${d.cliente.reference || '—'} · ${fecha} · versión 1`, 285, 19.5, { align: 'right' });
    // Datos del cliente, siempre visibles
    doc.setFillColor(255, 247, 237);
    doc.rect(12, 24, 273, 9, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(...TINTA);
    doc.text(`${d.cliente.company}  ·  RUT ${d.cliente.rut}  ·  ${d.cliente.name} (${d.cliente.email})  ·  ${d.cliente.comuna}`, 15, 29.8);
  };

  // Pagina 1: plano 2D, vista 3D e indicadores (la marca de agua va al final, encima del plano y del 3D)
  encabezado('Plano preliminar de bodega');
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.3);
  doc.rect(12, 37, 160, 156);
  await encajar(doc, await comoJpeg(d.plano), 'JPEG', 14, 39, 156, 152);
  if (d.vista3d) {
    doc.rect(176, 37, 109, 78);
    await encajar(doc, await comoJpeg(d.vista3d, 1600), 'JPEG', 177, 38, 107, 76);
  }
  let y = d.vista3d ? 124 : 42;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NARANJO);
  doc.text('RESUMEN', 176, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(...TINTA);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(`Bodega: ${d.bodega}`, 109), 176, y);
  y += 9;
  d.indicadores.forEach(([k, v]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRIS);
    doc.text(k, 176, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TINTA);
    doc.text(v, 285, y, { align: 'right' });
    y += 6;
  });

  marcaDeAgua(doc, agua);

  // Pagina 2: tabla de racks
  doc.addPage();
  marcaDeAgua(doc, agua);
  encabezado('Racks del diseño');
  const cols = [{ t: '#', w: 10 }, { t: 'Sistema', w: 45 }, { t: 'Configuración', w: 72 }, { t: 'Largo × fondo × alto', w: 50 }, { t: 'Capacidad', w: 50 }, { t: 'Carga por nivel', w: 46 }];
  let fy = 44;
  const fila = (celdas, negrita) => {
    let x = 12;
    doc.setFont('helvetica', negrita ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...(negrita ? NARANJO : TINTA));
    celdas.forEach((c, i) => { doc.text(String(c), x + 1.5, fy); x += cols[i].w; });
    doc.setDrawColor(228, 228, 231);
    doc.line(12, fy + 2.2, 285, fy + 2.2);
    fy += 7;
  };
  fila(cols.map((c) => c.t), true);
  for (const f of d.filas) {
    if (fy > 190) { doc.addPage(); marcaDeAgua(doc, agua); encabezado('Racks del diseño (cont.)'); fy = 44; fila(cols.map((c) => c.t), true); }
    fila(f, false);
  }
  // Evaluacion (lo que lleno el cliente y el comparador): referencial, bajo la tabla
  if (d.evaluacion?.length) {
    fy += 6;
    if (fy > 175) { doc.addPage(); marcaDeAgua(doc, agua); encabezado('Evaluación'); fy = 44; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...NARANJO);
    doc.text('EVALUACIÓN (REFERENCIAL)', 12, fy);
    fy += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TINTA);
    d.evaluacion.forEach((t) => {
      const lineas = doc.splitTextToSize(t, 273);
      doc.text(lineas, 12, fy);
      fy += lineas.length * 4.2 + 1.5;
    });
    doc.setFontSize(7.5);
    doc.setTextColor(...GRIS);
    doc.text('Estimaciones con el pasillo de la grúa indicada, llenando la bodega con un solo sistema. Pasillos, alturas y capacidades provisorios: Racklog los confirma en la revisión del diseño.', 12, fy + 1);
  }
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); pie(doc, i, total); }
  return doc.output('blob');
}

// ─── PDF del diseño del flujo "Planifica tu bodega" (paso 7, premio) ───
const VERDE = [21, 128, 61];
const AMBAR = [180, 83, 9];

// Recorta la imagen al formato de la caja (sin franjas vacias), como JPEG
function recortar(dataUrl, aspecto, max = 1800) {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => {
      const a = img.naturalWidth / img.naturalHeight;
      const sw = a > aspecto ? img.naturalHeight * aspecto : img.naturalWidth;
      const sh = a > aspecto ? img.naturalHeight : img.naturalWidth / aspecto;
      const k = Math.min(1, max / Math.max(sw, sh));
      const c = document.createElement('canvas');
      c.width = Math.round(sw * k);
      c.height = Math.round(sh * k);
      const x = c.getContext('2d');
      x.fillStyle = '#fff';
      x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => ok(dataUrl);
    img.src = dataUrl;
  });
}

// Visto bueno dibujado (la fuente del PDF no trae el caracter ✓)
function visto(doc, x, y, t, color) {
  doc.setDrawColor(...color);
  doc.setLineWidth(t / 5);
  doc.line(x, y, x + t * 0.35, y + t * 0.35);
  doc.line(x + t * 0.35, y + t * 0.35, x + t, y - t * 0.45);
}

function sello(doc, x, y, w, viable) {
  const color = viable ? VERDE : AMBAR;
  doc.setFillColor(...(viable ? [240, 253, 244] : [255, 251, 235]));
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, 22, 3, 3, 'FD');
  if (viable) visto(doc, x + 5, y + 11, 7, color);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...color);
  doc.text(viable ? 'Diseño viable' : 'Diseño con puntos por resolver', x + (viable ? 16 : 5), y + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(doc.splitTextToSize('Ingeniería Racklog lo valida con cálculo estructural (NCh2369 · ANSI MH16.1) antes de cotizar', w - (viable ? 20 : 9)), x + (viable ? 16 : 5), y + 15);
}

/** Una cifra grande con su etiqueta (página ejecutiva) */
function cifraEjecutiva(doc, x, y, w, valor, etiqueta, nota, color = TINTA) {
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, 34, 3, 3, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...color);
  doc.text(valor, x + 5, y + 14);
  doc.setFontSize(10);
  doc.setTextColor(...TINTA);
  doc.text(doc.splitTextToSize(etiqueta, w - 10), x + 5, y + 21);
  if (nota) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(doc.splitTextToSize(nota, w - 10), x + 5, y + 29);
  }
}

/**
 * Página ejecutiva: hoy → con Racklog, m² recuperados, crecimiento cubierto, normas y datos por confirmar.
 * El jefe de bodega la usa para vender el proyecto hacia arriba. d.ejecutivo = resumenDiseño(p).ejecutivo
 */
async function paginaEjecutiva(doc, d, { logo, logoCli, fecha, empresa }) {
  const e = d.ejecutivo;
  const n = (v) => Math.round(v || 0).toLocaleString('es-CL');
  if (logo) doc.addImage(logo, 'PNG', 12, 10, 54, 14);
  if (logoCli) await encajar(doc, logoCli, 'JPEG', 225, 8, 60, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NARANJO);
  doc.text('RESUMEN EJECUTIVO', 12, 38);
  doc.setFontSize(22);
  doc.setTextColor(...TINTA);
  const titulo = e.hoy && e.conRacklog > e.hoy
    ? `De ${n(e.hoy)} a ${n(e.conRacklog)} posiciones: +${e.masPct} % en la misma bodega`
    : `${n(e.conRacklog)} posiciones en la bodega de ${empresa}`;
  doc.text(doc.splitTextToSize(titulo, 273)[0], 12, 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text(`${fecha}  ·  ${d.bodega}`, 12, 55);

  const w = 64.5, y = 62;
  cifraEjecutiva(doc, 12, y, w, e.hoy ? n(e.hoy) : '—', 'Posiciones hoy', e.hoy ? '' : 'Dato no informado: tu ejecutivo lo confirma');
  cifraEjecutiva(doc, 12 + (w + 5), y, w, n(e.conRacklog), 'Posiciones con Racklog', e.hoy && e.mas > 0 ? `+${n(e.mas)} (+${e.masPct} %)` : '', NARANJO);
  cifraEjecutiva(doc, 12 + 2 * (w + 5), y, w, `${n(e.m2Recuperados)} m²`, 'm² recuperados', 'vs. guardar los mismos pallets a piso');
  const anos = e.anosCubiertos == null ? '—' : e.anosCubiertos >= 20 ? '20+ años' : `${e.anosCubiertos} ${e.anosCubiertos === 1 ? 'año' : 'años'}`;
  cifraEjecutiva(doc, 12 + 3 * (w + 5), y, w, anos, 'Crecimiento cubierto',
    e.crecimiento > 0 ? `creciendo ${Math.round(e.crecimiento * 100)} % al año sobre ${n(e.necesidad)} pallets` : 'sin crecimiento informado');

  // Normas y garantía de ingeniería
  let yy = y + 46;
  doc.setFillColor(255, 247, 237);
  doc.roundedRect(12, yy, 273, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...TINTA);
  doc.text(`Normas de cálculo: ${e.normas}`, 17, yy + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(doc.splitTextToSize(`${e.ingenieria} La cotización formal incluye fabricación (Quilicura, Chile), montaje e ingeniería, en máximo 24 horas.`, 263), 17, yy + 14);

  // Datos por confirmar y precisión
  yy += 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`Precisión de la cotización: ${e.precision.nivel} (${e.precision.pct} %)`, 12, yy);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text(e.precision.sinVisita ? 'Con esta información el ejecutivo cotiza directo, sin visita previa.' : 'Los datos estimados se confirman con el ejecutivo antes de la cotización formal.', 12, yy + 5.5);
  yy += 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...TINTA);
  doc.text('Datos por confirmar', 12, yy);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  yy += 6;
  const lista = e.confirmar.length ? e.confirmar : ['Ninguno: todos los datos los entregó el cliente.'];
  for (const c of lista.slice(0, 10)) {
    doc.setTextColor(...NARANJO);
    doc.text('•', 14, yy);
    doc.setTextColor(...TINTA);
    doc.text(doc.splitTextToSize(c, 260)[0], 18, yy);
    yy += 5;
  }
  doc.setFontSize(8.5);
  doc.setTextColor(...GRIS);
  doc.text('Siguen: vista 3D, plano técnico con cotas y la lista de lo que se cotiza.', 12, 192);
}

/**
 * @param {{ empresa: string, logoCliente?: string | null, bodega: string, viable: boolean,
 *   cifra: { n: number, unidad: string }, racks: number, plano: string | null, vista3d: string | null,
 *   cotizar: { nombre: string, lineas: string[], posiciones: number, bandejas: number }[],
 *   accesorios: string[], confirmar: string[], kpis: { rol: string, filas: [string, string][] }[] }} d
 * @returns {Promise<Blob>}
 */
export async function crearPdfDiseno(d) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  const fecha = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const logo = await imagenComoDataUrl('/assets/images/logo.png').catch(() => null);
  const logoCli = d.logoCliente ? await comoJpeg(d.logoCliente, 600, 0.92) : null;
  const empresa = d.empresa || 'tu empresa';
  const cifra = `${Math.round(d.cifra.n).toLocaleString('es-CL')} ${d.cifra.unidad}`;

  const encabezado = async (titulo) => {
    if (logo) doc.addImage(logo, 'PNG', 12, 9, 44, 11.4);
    if (logoCli) {
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.3);
      doc.line(61, 8, 61, 22);
      await encajar(doc, logoCli, 'JPEG', 65, 8, 34, 14);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...TINTA);
    doc.text(titulo, 285, 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRIS);
    doc.text(`${fecha} · diseño preliminar`, 285, 19.5, { align: 'right' });
    doc.setFillColor(255, 247, 237);
    doc.rect(12, 24, 273, 9, 'F');
    doc.setTextColor(...TINTA);
    doc.text(`Bodega de ${empresa}  ·  ${d.bodega}  ·  ${cifra}`, 15, 29.8);
  };

  // Pagina 1: resumen ejecutivo, para el que firma (prompt de conversión §G). Sin precios
  if (d.ejecutivo) {
    await paginaEjecutiva(doc, d, { logo, logoCli, fecha, empresa });
    doc.addPage();
  }

  // Portada con la vista 3D
  if (logo) doc.addImage(logo, 'PNG', 12, 10, 54, 14);
  if (logoCli) await encajar(doc, logoCli, 'JPEG', 225, 8, 60, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NARANJO);
  doc.text('DISEÑO DE BODEGA', 12, 40);
  doc.setFontSize(26);
  doc.setTextColor(...TINTA);
  const titulo = doc.splitTextToSize(`Bodega de ${empresa}`, 273);
  doc.text(titulo[0], 12, 51);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text(`${fecha}  ·  ${d.bodega}`, 12, 58);
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.3);
  doc.rect(12, 64, 186, 128);
  if (d.vista3d) await encajar(doc, await recortar(d.vista3d, 184 / 126), 'JPEG', 13, 65, 184, 126);
  else if (d.plano) await encajar(doc, await comoJpeg(d.plano), 'JPEG', 14, 66, 182, 124);
  // Columna derecha: la cifra, el sello y la promesa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  doc.setTextColor(...NARANJO);
  doc.text(Math.round(d.cifra.n).toLocaleString('es-CL'), 206, 84);
  doc.setFontSize(12);
  doc.setTextColor(...TINTA);
  doc.text(`${d.cifra.unidad} nuevas`, 206, 92);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text(`${d.racks} ${d.racks === 1 ? 'rack' : 'racks'} en el plano`, 206, 99);
  sello(doc, 206, 108, 79, d.viable);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TINTA);
  doc.text('Tu cotización en máximo 24 horas', 206, 144);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text(doc.splitTextToSize('Nuestro equipo comercial revisa este diseño y te envía la cotización en máximo 24 horas. Escríbenos a contacto@racklog.cl o al +56 9 3240 3819.', 79), 206, 150);

  // Pagina 2: plano 2D y numeros por rol
  doc.addPage();
  await encabezado('Plano de tu bodega');
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.3);
  doc.rect(12, 37, 180, 156);
  if (d.plano) await encajar(doc, await comoJpeg(d.plano), 'JPEG', 14, 39, 176, 152);
  let y = 42;
  for (const g of d.kpis) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...NARANJO);
    doc.text(`PARA ${g.rol.toUpperCase()}`, 198, y);
    y += 5.5;
    doc.setFontSize(9);
    for (const [k, v] of g.filas) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRIS);
      doc.text(k, 198, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...TINTA);
      doc.text(v, 285, y, { align: 'right' });
      doc.setDrawColor(244, 244, 245);
      doc.line(198, y + 1.6, 285, y + 1.6);
      y += 5.4;
    }
    y += 4;
  }

  // Pagina 3: que cotizar y accesorios
  doc.addPage();
  await encabezado('Qué vamos a cotizar');
  y = 44;
  const salto = async (alto) => {
    if (y + alto > 190) { doc.addPage(); await encabezado('Qué vamos a cotizar (cont.)'); y = 44; }
  };
  for (const q of d.cotizar) {
    await salto(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...TINTA);
    doc.text(`${q.nombre} · ${Math.round(q.posiciones || q.bandejas).toLocaleString('es-CL')} ${q.posiciones ? 'posiciones' : 'bandejas'}`, 12, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    for (const l of q.lineas) {
      await salto(5);
      doc.setTextColor(...NARANJO);
      doc.text('•', 14, y);
      doc.setTextColor(...TINTA);
      doc.text(l, 18, y);
      y += 5;
    }
    y += 4;
  }
  if (d.accesorios.length) {
    await salto(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...TINTA);
    doc.text('Accesorios y seguridad', 12, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    for (const a of d.accesorios) {
      const lineas = doc.splitTextToSize(a, 262);
      await salto(lineas.length * 4.6);
      doc.setTextColor(...NARANJO);
      doc.text('•', 14, y);
      doc.setTextColor(...TINTA);
      doc.text(lineas, 18, y);
      y += lineas.length * 4.6 + 0.6;
    }
    y += 4;
  }
  if (d.confirmar.length) {
    await salto(10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRIS);
    const l = doc.splitTextToSize(`Tu ejecutivo confirmará: ${d.confirmar.join(', ')}.`, 273);
    doc.text(l, 12, y);
    y += l.length * 4.4 + 4;
  }
  await salto(26);
  sello(doc, 12, y, 120, d.viable);

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...NARANJO);
    doc.setLineWidth(0.6);
    doc.line(12, 197, 285, 197);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRIS);
    doc.text(d.ejecutivo?.ingenieria ?? 'Diseño preliminar. Antes de cotizar, ingeniería Racklog lo valida con cálculo estructural según NCh2369 (diseño sísmico) y ANSI MH16.1.', 12, 202);
    doc.text('Racklog SpA · contacto@racklog.cl · +56 9 3240 3819 · racklog.cl', 12, 206);
    doc.text(`Página ${i} de ${total}`, 285, 206, { align: 'right' });
  }
  return doc.output('blob');
}

/**
 * Especificación técnica de 1 página para compras (A4 vertical): lo que se cotiza con medidas, accesorios
 * con medida y cantidad, norma y lo que falta confirmar. Para comparar con otros proveedores, sin precios.
 * d = resumenDiseño(p) (lib/flujo/exportar.js)
 * @returns {Promise<Blob>}
 */
export async function crearPdfEspecificacion(d) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const fecha = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const logo = await imagenComoDataUrl('/assets/images/logo.png').catch(() => null);
  const e = d.especificacion;
  if (logo) doc.addImage(logo, 'PNG', 12, 10, 44, 11.4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...TINTA);
  doc.text('Especificación técnica', 198, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GRIS);
  doc.text(`${fecha} · diseño preliminar`, 198, 20, { align: 'right' });
  doc.setFillColor(255, 247, 237);
  doc.rect(12, 25, 186, 9, 'F');
  doc.setTextColor(...TINTA);
  doc.text(doc.splitTextToSize(`${d.empresa || 'Tu empresa'}  ·  ${d.bodega}`, 180)[0], 15, 30.8);

  // Todo en una pagina: si hay muchas lineas, la letra baja un poco
  const lineas = d.cotizar.reduce((t, q) => t + q.lineas.length + 2, 0) + e.accesorios.length + 12;
  const f = lineas > 40 ? 8 : 9.5, h = f * 0.5;
  let y = 44;
  const titulo = (t) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(f + 1.5);
    doc.setTextColor(...NARANJO);
    doc.text(t.toUpperCase(), 12, y);
    y += h + 2;
  };
  const fila = (k, v) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(f);
    doc.setTextColor(...GRIS);
    doc.text(k, 14, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TINTA);
    doc.text(doc.splitTextToSize(v, 110)[0], 198, y, { align: 'right' });
    doc.setDrawColor(244, 244, 245);
    doc.line(14, y + 1.5, 198, y + 1.5);
    y += h + 1;
  };

  titulo('Racks');
  for (const q of d.cotizar) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(f + 0.5);
    doc.setTextColor(...TINTA);
    doc.text(`${q.nombre} · ${Math.round(q.posiciones || q.bandejas).toLocaleString('es-CL')} ${q.posiciones ? 'posiciones' : 'bandejas'}`, 14, y);
    y += h + 1;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(f);
    for (const l of q.lineas) {
      doc.setTextColor(...NARANJO);
      doc.text('•', 16, y);
      doc.setTextColor(...TINTA);
      doc.text(l, 20, y);
      y += h;
    }
    y += 2;
  }
  // De la viga solo el largo: el perfil y la capacidad los define ingeniería (dueño 27-10)
  y += 2;

  titulo('Totales');
  fila('Cuerpos', e.conteo.cuerpos.toLocaleString('es-CL'));
  fila('Marcos', e.conteo.marcos.toLocaleString('es-CL'));
  fila('Pares de vigas', e.conteo.paresVigas.toLocaleString('es-CL'));
  if (e.conteo.bandejas) fila('Bandejas', e.conteo.bandejas.toLocaleString('es-CL'));
  fila('Peso de acero', e.pesoAcero);
  y += 3;

  if (e.accesorios.length) {
    titulo('Accesorios y seguridad');
    for (const a of e.accesorios) fila(`${a.nombre}${a.medida ? ` · ${a.medida}` : ''}`, a.cantidad);
    y += 3;
  }

  titulo('Norma y cálculo');
  fila('Diseño sísmico', e.norma);
  fila('Cotización', 'en máximo 24 horas');
  if (d.confirmar.length) {
    y += 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(f - 0.5);
    doc.setTextColor(...GRIS);
    doc.text(doc.splitTextToSize(`Por confirmar con tu ejecutivo: ${d.confirmar.join(', ')}.`, 184), 14, y);
  }

  doc.setDrawColor(...NARANJO);
  doc.setLineWidth(0.6);
  doc.line(12, 282, 198, 282);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIS);
  doc.text('Diseño preliminar: no válido para fabricación ni instalación. Medidas y cantidades las confirma Técnica Racklog.', 12, 287);
  doc.text('Racklog SpA · contacto@racklog.cl · +56 9 3240 3819 · racklog.cl', 12, 291);
  return doc.output('blob');
}
