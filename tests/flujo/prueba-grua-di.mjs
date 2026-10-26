// Drive-in: el primer carril sale de la grua que entra a la calle (node tests/flujo/prueba-grua-di.mjs)
import assert from 'node:assert';
const raiz = process.argv[2] || process.cwd();
const { medidasRack } = await import(`${raiz}/lib/rack3d/planificador.js`);
const V = await import(`${raiz}/lib/rack3d/viabilidad.js`);
const di = (extra) => ({ id: 'D1', tipo: 'DI', cuerpos: 4, fondos: 5, niveles: 3, palletFrente: 1, palletFondo: 1.2, palletAlto: 1.35, x: 10, y: 10, rot: 0, ...extra });
const mm = (v) => Math.round(v * 1000);
// Contrapeso sin medir: mastil bajado 2,4 m (lo mas alto) + 150 → 2.550 (no 1.450 del pallet)
assert.equal(mm(medidasRack(di({ grua: 'contrapeso' })).primerNivel), 2550);
assert.ok(medidasRack(di({ grua: 'contrapeso' })).primerNivel >= 2.35);         // criterio de la ronda 2
assert.equal(mm(medidasRack(di({})).primerNivel), 2550);                       // sin equipo: contrapeso
assert.equal(mm(medidasRack(di({ grua: 'retractil' })).primerNivel), 2650);
assert.equal(mm(medidasRack(di({ grua: 'apiladora' })).primerNivel), 2150);
// Calle: el pallet (1.000 + 2 × 75) o la grua (1.200 + 200), lo mayor, + pilar 100
assert.equal(mm(medidasRack(di({ grua: 'contrapeso' })).anchoCalle), 1500);
assert.equal(mm(medidasRack(di({ grua: 'apiladora' })).anchoCalle), 1250);
// Medida por el cliente manda
assert.equal(mm(medidasRack(di({ grua: 'contrapeso', techoGrua: 2.05, mastilGrua: 2.1 })).primerNivel), 2250);
// Pallet mas alto que la grua: manda el pallet (1.900 + 100)
assert.equal(mm(medidasRack(di({ grua: 'apiladora', techoGrua: 1.7, palletAlto: 1.9 })).primerNivel), 2000);
// Apilador manual y transpaleta: bloqueado con su motivo
const bodega = { ancho: 40, largo: 40, altura: 10, elementos: [] };
const reglas = (grua) => V.revisarDiseno({ bodega: { ...bodega, grua }, racks: [di({ grua })] }).filter((a) => a.regla === 'gruaDriveIn');
for (const g of ['manual', 'transpaleta']) {
  const a = reglas(g);
  assert.ok(a.some((x) => x.nivel === 'bloquea' && /no se puede operar/.test(x.mensaje)), g);
}
assert.ok(reglas('contrapeso').every((x) => x.nivel !== 'bloquea'));
console.log('drive-in grúa: pruebas ok');
