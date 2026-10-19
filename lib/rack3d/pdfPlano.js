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
 *   plano: string, vista3d: string | null, bodega: string, filas: string[][], indicadores: [string, string][] }} d
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
  const cols = [{ t: '#', w: 10 }, { t: 'Sistema', w: 45 }, { t: 'Configuración', w: 110 }, { t: 'Largo × fondo × alto', w: 55 }, { t: 'Capacidad', w: 53 }];
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
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); pie(doc, i, total); }
  return doc.output('blob');
}
