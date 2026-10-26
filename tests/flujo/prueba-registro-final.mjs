// Registro al final (prompt de conversión §C) y página ejecutiva del PDF (§G).
// - Con el control del A/B (sin variante o 'final') ningún paso pide registro antes de mostrarse: se dibuja la
//   bodega, se arma el rack y se ve el 3D sin datos; el registro va dentro de Cotiza.
// - La variante 'inicio' solo lo pide antes de la primera pregunta.
// node tests/flujo/prueba-registro-final.mjs "$PWD"
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
const b = process.argv[2] || process.cwd();
const imp = (r) => import(pathToFileURL(b + r).href);
const C = await imp('/lib/flujo/conversion.js');
const k = await imp('/lib/flujo/calculos.js');
const P = await imp('/lib/flujo/perfiles.js');
let ok = 0; const prueba = (nm, f) => { f(); ok++; console.log('ok -', nm); };
const leer = (r) => readFileSync(b + r, 'utf8');

// Los pasos del flujo, desde el store (TypeScript): { k: 'operacion', ... }
const PASOS = [...leer('/stores/proyecto.ts').matchAll(/\{ k: '(\w+)', t: '/g)].map((m) => m[1]);
prueba('el store tiene los 8 pasos de la vía diseño', () => {
  assert.deepEqual(PASOS, ['operacion', 'dibujo', 'pallets', 'rack', 'bodega', 'accesorios', 'revisa', 'cotiza']);
});
prueba('control (registro al final): ningún paso pide registro antes de mostrarse', () => {
  for (const v of [null, 'final', 'cualquiera']) for (const paso of PASOS) assert.equal(C.pideRegistroAntes(paso, { variante: v }), false, `${paso} con ${v}`);
  assert.equal(C.registroEn(null), 'final');
});
prueba('variante "inicio": solo antes de la primera pregunta, y nunca si ya se registró', () => {
  assert.deepEqual(PASOS.filter((paso) => C.pideRegistroAntes(paso, { variante: 'inicio' })), ['operacion']);
  assert.equal(C.pideRegistroAntes('operacion', { variante: 'inicio', registrado: true }), false);
});
prueba('dibujo, rack, layout y Revisa (3D) no esperan el registro', () => {
  for (const f of ['PasoBodega', 'PasoPallets', 'PasoRack', 'PasoAccesorios', 'PasoRevisa']) {
    assert.doesNotMatch(leer(`/components/flujo/${f}.vue`), /registrado/, `${f}.vue no mira p.registrado`);
  }
  const disena = leer('/pages/planifica-tu-bodega/disena.vue');
  assert.match(disena, /pideRegistroAntes\('operacion'/, 'disena.vue decide con pideRegistroAntes');
  // Cotiza: el formulario es el registro; el botón no depende de un registro previo
  const cotiza = leer('/components/flujo/PasoCotiza.vue');
  assert.match(cotiza, /<FlujoRegistroFinal/);
  assert.doesNotMatch(cotiza, /deshabilitado="[^"]*registrado/);
});
prueba('el registro final pide nombre, correo y comuna; RUT opcional', () => {
  const rf = leer('/components/flujo/RegistroFinal.vue');
  assert.match(rf, /CAMPOS = \['nombre', 'correo', 'comuna', 'rut', 'telefono', 'privacidad'\]/);
  assert.match(rf, /if \(c === 'rut'\) \{ if \(!l\.rut\.trim\(\)\) return null;/, 'RUT vacío es válido');
});

// ─── Página ejecutiva: hoy → con Racklog, m² recuperados y años de crecimiento cubiertos ───
const pallets = [{ id: 'a', nombre: 'P', frente: 1, fondo: 1.2, alto: 1.35, peso: 700, cantidad: 300, rotacion: 'media', color: '#f59e0b' }];
const modelo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 4, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 300 } };
const bodega = { ancho: 30, largo: 40, altura: 8, forma: null, grua: 'contrapeso', elementos: [] };
let n = 0;
const res = k.resultadoModelo(modelo, { pallets });
const u = k.ubicarModelos(bodega, [modelo], { m1: res.modulos }, { pallets, nuevoId: () => 'r' + (++n) });
const proyecto = { pallets, cajas: [], modelos: [modelo], racks: u.racks, bodega, posicionesHoy: 200, crecimiento: 0.1, flags: [], accesorios: { quitados: [], cantidades: {}, medidas: {}, manuales: [] }, lead: {} };
prueba('resumen ejecutivo: posiciones, +%, m² recuperados y años cubiertos', () => {
  const e = P.resumenEjecutivo(proyecto);
  const pos = k.conteoTotal(u.racks).posiciones;
  assert.equal(e.hoy, 200);
  assert.equal(e.conRacklog, pos);
  assert.equal(e.masPct, Math.round(((pos - 200) / 200) * 100));
  assert.ok(e.m2Recuperados > 0 && e.m2Recuperados % 10 === 0, `m² ${e.m2Recuperados}`);
  // Años: el último n con 300 × 1,1^n ≤ posiciones
  let esperado = 0; while (300 * 1.1 ** (esperado + 1) <= pos) esperado++;
  assert.equal(e.anosCubiertos, esperado);
  assert.equal(P.resumenEjecutivo({ ...proyecto, crecimiento: 0 }).anosCubiertos, null, 'sin crecimiento informado');
  console.log(`    hoy ${e.hoy} → ${e.conRacklog} (+${e.masPct} %), ${e.m2Recuperados} m² recuperados, ${e.anosCubiertos} años cubiertos`);
});
prueba('datos del diseño: "No lo sé" quedan estimados y suben a "datos por confirmar"', () => {
  const real = C.estadosDiseño(proyecto);
  assert.equal(real.medidas, 'real'); assert.equal(real.grua, 'real');
  // Lo que pusimos de ejemplo (bodega de 20 × 30 sin tocar, pallet de ejemplo) no cuenta como dato real
  const ejemplo = C.estadosDiseño({ ...proyecto, flags: [], bodega: { ...proyecto.bodega, ancho: 20, largo: 30, forma: null }, pallets: [{ ...pallets[0], ejemplo: true }] });
  assert.equal(ejemplo.medidas, 'estimado'); assert.equal(ejemplo.cantidad, 'estimado');
  assert.equal(C.estadosDiseño({ ...proyecto, flags: ['medidas_ok'], bodega: { ...proyecto.bodega, ancho: 20, largo: 30, forma: null } }).medidas, 'real', 'escribió 20 × 30');
  assert.equal(C.estadosDiseño({ ...proyecto, pallets: [{ ...pallets[0], noSe: ['cantidad'] }] }).cantidad, 'estimado');
  // Estimar lo que no sabe: lo que cabe en su bodega y la bodega para sus pallets van y vuelven
  const cabe = k.palletsQueCaben({ ancho: 20, largo: 30, altura: 8, forma: null, elementos: [], grua: 'contrapeso', ocupacion: 0.8 });
  assert.ok(cabe.pallets > 0 && cabe.m2 === 600, `caben ${cabe.pallets}`);
  const b = k.bodegaParaPallets(cabe.pallets, { altura: 8, grua: 'contrapeso', ocupacion: 0.8 });
  assert.ok(Math.abs(b.ancho * b.largo - 600) / 600 < 0.1, `bodega ${b.ancho} × ${b.largo} para ${cabe.pallets} pallets`);
  const conNoSe = C.estadosDiseño({ ...proyecto, flags: ['no_se:medidas', 'no_se:equipo'], pallets: [{ ...pallets[0], noSe: ['peso'] }] });
  assert.equal(conNoSe.medidas, 'estimado'); assert.equal(conNoSe.grua, 'estimado'); assert.equal(conNoSe.peso, 'estimado');
  assert.ok(C.pideRescate(conNoSe), '3 "No lo sé" clave → rescate');
  const cfg = C.configConversion({ via: 'diseno', comuna: 'Temuco', estados: conNoSe, porConfirmar: ['peso de pallet'] });
  assert.equal(cfg['Vía'], 'diseño');
  assert.equal(cfg['Comuna'], 'Temuco (Araucanía)');
  assert.match(cfg['Datos por confirmar'], /medidas de la bodega/);
});
prueba('el PDF lleva la página ejecutiva primero y el texto de ingeniería al pie', () => {
  const pdf = leer('/lib/rack3d/pdfPlano.js');
  const i = pdf.indexOf('export async function crearPdfDiseno');
  const cuerpo = pdf.slice(i);
  assert.ok(cuerpo.indexOf('paginaEjecutiva(doc') < cuerpo.indexOf('// Portada con la vista 3D'), 'ejecutiva antes de la portada');
  assert.match(pdf, /Normas de cálculo: \$\{e\.normas\}/);
  assert.match(pdf, /Datos por confirmar/);
  assert.doesNotMatch(pdf, /resiste/i);
});
console.log(`${ok} pruebas ok`);
