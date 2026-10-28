// Autollenado (dueño 27-10): el layout que más guarda cumpliendo todas las reglas, en toda la bodega o en un área
// marcada (node tests/flujo/prueba-autollenado.mjs "$PWD")
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const k = await import(b + '/lib/flujo/calculos.js');
const pl = await import(b + '/lib/rack3d/planificador.js');
const AU = await import(b + '/lib/flujo/autollenado.js');
const pallets = [{ id: 'a', nombre: 'P', frente: 1, fondo: 1.2, alto: 1.35, peso: 700, cantidad: 800 }];
const RS = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 800 } };
const DI = { id: 'm2', nombre: 'Drive-in', tipo: 'DI', niveles: 3, fondos: 5, cantidades: { a: 800 } };
const pil = (W, L, paso) => pl.grillaPilaresXY({ ancho: W, largo: L }, { pasoX: paso, pasoY: paso }).map((p, i) => ({ id: `p${i}`, clase: 'pilar', x: p.x, y: p.y, ancho: 0.4, alto: 0.4 }));
let n = 0; const id = () => 'r' + (++n);

const casos = [
  ['24×36 libre', { ancho: 24, largo: 36, altura: 8, forma: null, grua: 'contrapeso', elementos: [] }, RS],
  ['30×45 pilares cada 6 m', { ancho: 30, largo: 45, altura: 8, forma: null, grua: 'contrapeso', elementos: pil(30, 45, 6) }, RS],
  ['40×25 oficina y portón, retráctil', { ancho: 40, largo: 25, altura: 9, forma: null, grua: 'retractil', elementos: [{ id: 'o', clase: 'oficina', x: 3.5, y: 21.5, ancho: 6, alto: 6 }, { id: 'pt', clase: 'porton', muro: 'abajo', x: 20, y: 24.85, ancho: 4, alto: 0.3 }] }, RS],
  ['30×40 drive-in', { ancho: 30, largo: 40, altura: 9, forma: null, grua: 'contrapeso', elementos: [] }, DI],
];
for (const [nombre, bod, m] of casos) {
  const antes = AU.evaluarLayout(bod, k.ubicarModelos(bod, [m], { [m.id]: 999 }, { pallets, nuevoId: id }).racks);
  const o = AU.autollenar(bod, m, { pallets, nuevoId: id });
  const ev = AU.evaluarLayout(bod, o.racks);
  console.log(`${nombre}: ${antes.posiciones} → ${o.posiciones} (${o.variante.orientacion}, perimetral ${o.variante.perimetral}, ${o.probadas} pruebas)`);
  assert.ok(o.valido && ev.valido, `${nombre}: rompe una regla ${JSON.stringify(ev)}`);
  assert.equal(o.posiciones, ev.posiciones);
  assert.ok(o.posiciones >= antes.posiciones, `${nombre}: guarda menos que antes`);
}

// Área marcada: lo de fuera no se toca y lo nuevo queda dentro del área
{
  const bod = { ancho: 40, largo: 30, altura: 8, forma: null, grua: 'contrapeso', elementos: [] };
  const fuera = pl.normalizar({ id: 'f', tipo: 'RS', modelo: 'm1', cuerpos: 6, niveles: 3, doble: false, rot: 180, x: 8, y: 0.1 + 0.6 });
  const area = { x0: 18, y0: 8, x1: 40, y1: 30 };
  const o = AU.autollenar(bod, RS, { pallets, nuevoId: id, existentes: [fuera], area });
  assert.ok(o.racks.length > 0);
  assert.ok(o.racks.every((r) => { const q = pl.rectangulo(r); return q.x0 >= area.x0 - 1e-6 && q.y0 >= area.y0 - 1e-6 && q.x0 + q.ancho <= area.x1 + 1e-6 && q.y0 + q.alto <= area.y1 + 1e-6; }), 'todo dentro del área');
  assert.ok(!o.racks.some((r) => r.id === 'f'), 'no devuelve el de fuera');
  assert.equal(AU.racksFueraDeArea([fuera, ...o.racks], area).length, 1);
  assert.equal(pl.conflictos([fuera, ...o.racks], bod).size, 0);
  // Un área donde no cabe nada
  assert.equal(AU.autollenar(bod, RS, { pallets, nuevoId: id, area: { x0: 0, y0: 0, x1: 1.5, y1: 1.5 } }).racks.length, 0);
}
console.log('autollenado: pruebas ok');
