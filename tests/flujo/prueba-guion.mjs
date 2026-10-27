// Revisión 27-10 §7: el tour guiado (lib/flujo/guion.js) arma sus escenas en orden y con números que cuadran
// (node tests/flujo/prueba-guion.mjs "$PWD")
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const k = await import(b + '/lib/flujo/calculos.js');
const G = await import(b + '/lib/flujo/guion.js');
const pallets = [{ id: 'a', nombre: 'Pallet 1', frente: 1, fondo: 1.2, alto: 1.65, peso: 325, cantidad: 75, skus: 5, rotacion: 'media', color: '#f59e0b' }];
const modelo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 75 } };
const bodega = { ancho: 20, largo: 60, altura: 10, forma: null, grua: 'contrapeso', elementos: [{ id: 'o1', clase: 'oficina', x: 3, y: 3, ancho: 5, alto: 4 }] };
let n = 0;
const racks = k.ubicarModelos(bodega, [modelo], { m1: k.resultadoModelo(modelo, { pallets }).modulos }, { pallets, nuevoId: () => 'r' + (++n) }).racks;
const p = { pallets, cajas: [], modelos: [modelo], racks, racksHoy: [], bodega, accesorios: { quitados: [], cantidades: {} }, posicionesHoy: 40, crecimiento: 0.1 };

const g = G.guionTour(p);
const ids = g.escenas.map((e) => e.id);
console.log(ids.join(' → '), '·', Math.round(g.duracion / 1000), 's');
assert.deepEqual(ids.filter((x) => ['bodega', 'elementos', 'carga', 'grua', 'cierre'].includes(x)), ['bodega', 'elementos', 'carga', 'grua', 'cierre'], 'orden de escenas');
assert.ok(g.escenas.every((e) => e.titulo && e.duracion > 0), 'cada escena con título y duración');
assert.match(g.escenas[0].titulo, /20 × 60 m/);
assert.ok(g.escenas.find((e) => e.id === 'grua').nota.includes('preliminar'), 'disclaimer de ingeniería');
assert.ok(g.duracion < 120000, 'el tour dura menos de 2 minutos');
// Sin racks no hay tour (no se graba una bodega vacía)
assert.equal(G.guionTour({ ...p, racks: [] }).escenas.length, 0);
console.log('guion: pruebas ok');
