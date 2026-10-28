// Capa 2D del tour en video (paso 7): textos, cotas y rótulos dibujados sobre un canvas transparente encima del
// 3D. Al grabar, el visor mezcla el WebGL y esta capa en un tercer canvas y graba ese: los textos quedan en el
// video. Sin three.js: recibe los puntos ya proyectados a pantalla.
//
// Diseño (criterios del dueño): ficha blanca con una barra naranja de marca, sin degradados ni emojis;
// tipografía Inter del sitio. En pantallas anchas la ficha va abajo a la izquierda (como un rótulo de TV) y el
// modelo se encuadra a la derecha; en angostas va abajo, a todo el ancho.

const MARCA = '#c2410c';      // brand-700: texto blanco sobre él cumple AA
const ACENTO = '#ea580c';     // brand-600
const TINTA = '#171717', GRIS = '#404040', GRIS_SUAVE = '#737373';
let fuente = null;
const familia = () => (fuente ??= (typeof document !== 'undefined' && getComputedStyle(document.body).fontFamily) || 'Inter, system-ui, sans-serif');

// Corta un texto en líneas que caben en `ancho` px
function partir(ctx, texto, ancho) {
  const palabras = String(texto).split(/\s+/).filter(Boolean), lineas = [];
  let linea = '';
  palabras.forEach((w) => {
    const prueba = linea ? `${linea} ${w}` : w;
    if (ctx.measureText(prueba).width <= ancho || !linea) linea = prueba;
    else { lineas.push(linea); linea = w; }
  });
  if (linea) lineas.push(linea);
  return lineas;
}

function redondeado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Geometría de la ficha para un lienzo de W × H px (S = px del lienzo por px CSS). La usa el visor para dejar
 * libre esa zona al encuadrar.
 */
export function zonaFicha(W, H, S = 1) {
  const w = W / S, h = H / S;
  const ancha = w / h > 1.25 && w >= 560;
  const m = Math.round(Math.max(12, Math.min(28, w * 0.022)));
  return ancha
    ? { ancha, m, x: m, ancho: Math.min(w * 0.42, 520), escala: Math.max(0.85, Math.min(1.35, w / 1000)) }
    : { ancha, m, x: m, ancho: w - 2 * m, escala: Math.max(0.78, Math.min(1, w / 520)) };
}

/**
 * Dibuja la capa. e = { kicker, titulo, detalle[], nota?, cta?, numero, total, alfa (0–1), cotas: [{ a: {x,y,ok},
 * b: {x,y,ok}, texto }], etiquetas: [{ x, y, ok, texto }] } con puntos en px del lienzo.
 */
export function dibujarCapa(ctx, W, H, S, e) {
  ctx.clearRect(0, 0, W, H);
  if (!e) return;
  const z = zonaFicha(W, H, S), k = S * z.escala, f = familia();
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, e.alfa ?? 1));
  ctx.textBaseline = 'alphabetic';

  // ─── Cotas: línea con remates y el valor en una pastilla ───
  (e.cotas ?? []).forEach((c) => {
    if (!c.a.ok || !c.b.ok) return;
    ctx.strokeStyle = TINTA; ctx.lineWidth = 2 * S; ctx.lineCap = 'round';
    const dx = c.b.x - c.a.x, dy = c.b.y - c.a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L * 7 * S, ny = dx / L * 7 * S;
    ctx.beginPath();
    ctx.moveTo(c.a.x, c.a.y); ctx.lineTo(c.b.x, c.b.y);
    ctx.moveTo(c.a.x - nx, c.a.y - ny); ctx.lineTo(c.a.x + nx, c.a.y + ny);
    ctx.moveTo(c.b.x - nx, c.b.y - ny); ctx.lineTo(c.b.x + nx, c.b.y + ny);
    ctx.stroke();
    pastilla(ctx, (c.a.x + c.b.x) / 2, (c.a.y + c.b.y) / 2, c.texto, 15 * k, f, TINTA, '#ffffff');
  });
  // ─── Rótulos: punto y nombre ───
  (e.etiquetas ?? []).forEach((t) => {
    if (!t.ok) return;
    ctx.fillStyle = TINTA;
    ctx.beginPath(); ctx.arc(t.x, t.y, 4 * S, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = TINTA; ctx.lineWidth = 1.5 * S;
    ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x, t.y - 22 * S); ctx.stroke();
    pastilla(ctx, t.x, t.y - 22 * S - 12 * k, t.texto, 14 * k, f, '#ffffff', TINTA);
  });

  // ─── Ficha ───
  const pad = 16 * k, ancho = z.ancho * S, interior = ancho - 2 * pad - 5 * S;
  const tamK = 12.5 * k, tamT = (z.ancha ? 25 : 20) * k, tamD = (z.ancha ? 16 : 14.5) * k, tamN = 12.5 * k;
  ctx.font = `600 ${tamT}px ${f}`;
  const lt = partir(ctx, e.titulo, interior);
  ctx.font = `400 ${tamD}px ${f}`;
  const ld = (e.detalle ?? []).map((d) => partir(ctx, d, interior));
  ctx.font = `400 ${tamN}px ${f}`;
  const ln = e.nota ? partir(ctx, e.nota, interior) : [];
  const altoCta = e.cta ? tamD * 2.4 : 0;
  let alto = pad + tamK * 1.2 + 8 * k + lt.length * tamT * 1.18 + 6 * k
    + ld.reduce((t, l) => t + l.length * tamD * 1.38 + 3 * k, 0)
    + (ln.length ? 10 * k + ln.length * tamN * 1.4 : 0) + (e.cta ? 12 * k + altoCta : 0) + pad;
  const x = z.x * S, y = H - z.m * S - alto;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 18 * S; ctx.shadowOffsetY = 4 * S;
  redondeado(ctx, x, y, ancho, alto, 12 * S);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = ACENTO;
  redondeado(ctx, x, y, 5 * S, alto, 2.5 * S);
  ctx.fill();
  const x0 = x + 5 * S + pad;
  let yy = y + pad + tamK;
  ctx.font = `700 ${tamK}px ${f}`;
  ctx.fillStyle = MARCA;
  const kick = String(e.kicker ?? '').toUpperCase();
  ctx.fillText(kick, x0, yy);
  if (e.total > 1) {
    ctx.fillStyle = GRIS_SUAVE; ctx.font = `500 ${tamK}px ${f}`;
    const num = `${e.numero} de ${e.total}`;
    ctx.fillText(num, x + ancho - pad - ctx.measureText(num).width, yy);
  }
  yy += 8 * k;
  ctx.fillStyle = TINTA; ctx.font = `600 ${tamT}px ${f}`;
  lt.forEach((l) => { yy += tamT * 1.18; ctx.fillText(l, x0, yy); });
  yy += 6 * k;
  ctx.fillStyle = GRIS; ctx.font = `400 ${tamD}px ${f}`;
  ld.forEach((ls) => { ls.forEach((l) => { yy += tamD * 1.38; ctx.fillText(l, x0, yy); }); yy += 3 * k; });
  if (ln.length) {
    yy += 6 * k;
    ctx.strokeStyle = '#e5e5e5'; ctx.lineWidth = 1 * S;
    ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + interior, yy); ctx.stroke();
    yy += 4 * k;
    ctx.fillStyle = GRIS_SUAVE; ctx.font = `400 ${tamN}px ${f}`;
    ln.forEach((l) => { yy += tamN * 1.4; ctx.fillText(l, x0, yy); });
  }
  if (e.cta) {
    yy += 12 * k;
    ctx.font = `600 ${tamD}px ${f}`;
    const wc = Math.min(interior, ctx.measureText(e.cta).width + 28 * k);
    ctx.fillStyle = MARCA;
    redondeado(ctx, x0, yy, wc, altoCta, 8 * S);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    const lc = partir(ctx, e.cta, wc - 28 * k);
    const base = yy + altoCta / 2 - ((lc.length - 1) * tamD * 1.2) / 2 + tamD * 0.36;
    lc.forEach((l, i) => ctx.fillText(l, x0 + 14 * k, base + i * tamD * 1.2));
  }
  ctx.restore();
  // Marca arriba a la izquierda (siempre visible, también al cambiar de escena)
  ctx.save();
  ctx.font = `800 ${14 * k}px ${f}`;
  ctx.fillStyle = MARCA;
  ctx.fillText('RACKLOG', z.m * S, z.m * S + 14 * k);
  ctx.font = `500 ${12 * k}px ${f}`;
  ctx.fillStyle = GRIS;
  ctx.fillText('Tu bodega, en 3D', z.m * S, z.m * S + 32 * k);
  ctx.restore();
  return { alto: alto / S };
}

function pastilla(ctx, cx, cy, texto, tam, f, fondo, tinta) {
  ctx.font = `600 ${tam}px ${f}`;
  const w = ctx.measureText(texto).width + tam * 1.1, h = tam * 1.7;
  ctx.fillStyle = fondo;
  redondeado(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fill();
  if (fondo === '#ffffff') { ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.stroke(); }
  ctx.fillStyle = tinta;
  ctx.fillText(texto, cx - w / 2 + tam * 0.55, cy + tam * 0.36);
}
