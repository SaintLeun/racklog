// Lead de la vía exprés (prompt de conversión §B, §D, §H, §I, §J): etiqueta, datos por confirmar, precisión,
// visita técnica solo como rescate y sin precios. El payload que arma la web se le pasa a la prueba PHP
// (api/tests/lead_expres_test.php) para revisar etiqueta y nota en un Kommo falso.
// node tests/flujo/prueba-lead-expres.mjs "$PWD"
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const b = process.argv[2] || process.cwd();
const C = await import(pathToFileURL(b + '/lib/flujo/conversion.js').href);
let ok = 0; const prueba = (nm, f) => { f(); ok++; console.log('ok -', nm); };

// Cliente con todos sus datos reales: precisión alta, sin visita
const completo = { guarda: 'pallets', cantidad: 300, ancho: 20, largo: 40, altura: 8, grua: 'contrapeso', peso: 900, comuna: 'Quilicura' };
prueba('datos reales → precisión alta y cotización sin visita', () => {
  const pr = C.precision(C.estadosExpres(completo));
  // La exprés no pide medidas del pallet: quedan estimadas (se confirman por teléfono, no piden visita)
  assert.equal(pr.nivel, 'alta', JSON.stringify(pr));
  assert.equal(pr.sinVisita, true);
  assert.deepEqual(pr.estimados, ['medidas del pallet o la caja']);
  assert.equal(C.precision(C.estadosExpres({ ...completo, gruaNoSe: true })).sinVisita, false);
  const todo = C.precision({ guarda: 'real', cantidad: 'real', medidasPallet: 'real', peso: 'real', medidas: 'real', altura: 'real', grua: 'real' });
  assert.equal(todo.pct, 100); assert.ok(todo.sinVisita); assert.match(todo.texto, /sin visita/);
});
prueba('cada "No lo sé" baja la precisión (nunca bloquea)', () => {
  const a = C.precision(C.estadosExpres(completo)).pct;
  const b1 = C.precision(C.estadosExpres({ ...completo, pesoNoSe: true })).pct;
  const b2 = C.precision(C.estadosExpres({ ...completo, pesoNoSe: true, medidasAprox: true })).pct;
  assert.ok(a > b1 && b1 > b2, `${a} > ${b1} > ${b2}`);
});
prueba('visita técnica: solo con 2 o más "No lo sé" en datos clave o si abandona las medidas', () => {
  assert.equal(C.pideRescate(C.estadosExpres(completo)), false);
  assert.equal(C.pideRescate(C.estadosExpres({ ...completo, gruaNoSe: true })), false, 'un "No lo sé" no basta');
  assert.equal(C.pideRescate(C.estadosExpres({ ...completo, medidasAprox: true })), false);
  assert.equal(C.pideRescate(C.estadosExpres({ ...completo, medidasAprox: true, pesoNoSe: true })), true);
  assert.equal(C.pideRescate({}, { abandonoMedidas: true }), true);
  // La altura y las medidas del pallet no son datos clave
  assert.equal(C.noSeClave({ altura: 'estimado', medidasPallet: 'estimado' }), 0);
});
prueba('RM → visita técnica gratuita; regiones → videollamada o fotos; nunca una fecha', () => {
  assert.equal(C.esRM('quilicura'), true);
  assert.equal(C.esRM('Ñuñoa'), true); assert.equal(C.esRM('nunoa'), true);
  assert.equal(C.esRM('Temuco'), false);
  assert.equal(C.COMUNAS_RM.length, 52);
  assert.equal(C.ofertaRescate('Maipú').tipo, 'visita');
  assert.equal(C.ofertaRescate('Concepción').tipo, 'remota');
  assert.equal(C.ofertaRescate('Atlantis'), null);
  for (const o of [C.ofertaRescate('Maipú'), C.ofertaRescate('Temuco')]) assert.doesNotMatch(o.texto, /\b(hoy|mañana|lunes|martes|miércoles|jueves|viernes|\d+ ?(h|horas|días))\b/i);
});

const conNoSe = { guarda: 'pallets', cantidad: 120, ancho: 15, largo: 25, medidasAprox: true, altura: 6, alturaNoSe: true, grua: 'contrapeso', gruaNoSe: true, peso: 1000, pesoNoSe: true, comuna: 'Quilicura', visita: true, archivos: 1 };
const lead = C.leadExpres(conNoSe, { nombreGrua: (k) => ({ contrapeso: 'Grúa horquilla contrapeso' })[k] ?? k, utm: { utm_source: 'google' } });
prueba('lead exprés: etiqueta, vía, comuna RM, visita y datos por confirmar', () => {
  const c = lead.config;
  assert.equal(c['Etiqueta'], 'tour-logistico');
  assert.equal(Object.keys(c).at(-1), 'Etiqueta', 'la etiqueta va al final');
  assert.equal(c['Vía'], 'exprés');
  assert.equal(c['Comuna'], 'Quilicura (RM)');
  assert.equal(c['Visita técnica'], 'solicitada (RM)');
  for (const d of ['peso del pallet', 'medidas de la bodega', 'equipo de carga', 'altura libre de la bodega']) assert.ok(c['Datos por confirmar'].includes(d), d);
  assert.match(c['Bodega'], /aprox\. ±1 m/);
  assert.match(c['Peso pallet'], /estimado/);
  assert.ok(Object.keys(c).length <= 60 && Object.values(c).every((v) => String(v).length <= 300), 'cabe en el límite de la API');
});
prueba('sin precios en el lead ni en los textos', () => {
  const textos = [JSON.stringify(lead.config), C.TEXTO_INGENIERIA, C.MENSAJE_INICIO, C.PIERDE, ...Object.values(C.PORQUE)];
  for (const t of textos) assert.doesNotMatch(t, /\$|CLP|UF\b|precio|valor ref/i, t);
  assert.match(C.TEXTO_INGENIERIA, /NCh2369/); assert.match(C.TEXTO_INGENIERIA, /ANSI MH16\.1/);
  assert.doesNotMatch(C.TEXTO_INGENIERIA, /resiste/i);
});
const payload = C.payloadLead({ nombre: 'Ana Pérez', correo: 'ana@empresa.cl', rut: '' }, lead);
prueba('payload con el formato de send-email (type quote, RUT opcional)', () => {
  assert.equal(payload.type, 'quote');
  assert.equal(payload.data.customerRut, '');
  assert.equal(payload.data.products[0].config['Vía'], 'exprés');
});
{
  const llamadas = [];
  const fetcher = async (url, init) => { llamadas.push(init); return llamadas.length === 1 ? { ok: false, status: 502, json: async () => ({}) } : { ok: true, status: 200, json: async () => ({ status: 'success', reference: 'QT-1' }) }; };
  const r = await C.enviarLead(payload, [], { fetcher });
  assert.deepEqual(r, { ok: true, referencia: 'QT-1' });
  assert.equal(llamadas.length, 2);
  assert.equal(llamadas[0].headers['Content-Type'], 'application/json');
  ok++; console.log('ok - enviarLead: JSON sin archivos, un reintento ante 5xx');
}

// La misma carga, por la API PHP contra un Kommo falso
const dir = mkdtempSync(join(tmpdir(), 'lead-expres-'));
const archivo = join(dir, 'payload.json');
writeFileSync(archivo, JSON.stringify(payload));
let php = null;
try { php = execFileSync('php', [b + '/api/tests/lead_expres_test.php', archivo], { encoding: 'utf8' }); } catch (e) {
  if (e.code === 'ENOENT') console.log('   (sin php: se omite la parte de Kommo)'); else { console.log(e.stdout); throw new Error('la prueba PHP falló'); }
}
if (php) { assert.match(php, /Todas las pruebas pasaron/); ok++; console.log('ok - Kommo (PHP): etiquetas via-expres y visita-tecnica, nota con datos por confirmar, tarea "Coordinar visita técnica"'); }
console.log(`${ok} pruebas ok`);
