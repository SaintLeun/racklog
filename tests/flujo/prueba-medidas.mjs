// Ronda 3 · Bloque A: mismos datos → mismo alto de marco, mismas vigas y misma carga en los pasos 3, 5, 6, 7,
// PDF y Kommo, aunque el cliente cambie el pallet después de ubicar sus racks (node tests/flujo/prueba-medidas.mjs)
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const k = await import(b + '/lib/flujo/calculos.js');
const pl = await import(b + '/lib/rack3d/planificador.js');
const op = await import(b + '/lib/rack3d/operacion.js');
const bodega = { ancho: 20, largo: 60, altura: 8, forma: null, grua: 'contrapeso', elementos: [] };
const modelo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 100 } };
let n = 0; const id = () => 'r' + (++n);
const ejemplo = [{ id: 'a', nombre: 'P', frente: 1, fondo: 1.2, alto: 1.2, peso: 600, cantidad: 100, rotacion: 'media', color: '#f59e0b' }];
const suyo = [{ ...ejemplo[0], alto: 1.65 }];
const mm = (v) => `${Math.round(v * 1000).toLocaleString('es-CL')} mm`;

// Se ubica con el pallet de ejemplo (1,2 m) y después el cliente pone el suyo (1,65 m)
const modulos = { m1: k.resultadoModelo(modelo, { pallets: ejemplo }).modulos };
const viejos = k.ubicarModelos(bodega, [modelo], modulos, { pallets: ejemplo, nuevoId: id }).racks;
const paso3 = k.resultadoModelo(modelo, { pallets: suyo, grua: bodega.grua });
const { racks } = k.racksAlDia(viejos, [modelo], { pallets: suyo, grua: bodega.grua });
const q = k.queCotizar([modelo], racks)[0];
const m3 = paso3.m;
console.log(`paso 3: marco ${mm(m3.alto)}, vigas ${m3.nivelesY.map((y) => y.toFixed(3)).join(' / ')}, carga ${mm(paso3.alto)}`);
console.log('qué cotizar:', q.lineas.join(' · '));
assert.ok(m3.alto > 5.5, `con pallet 1,65 m y 3 niveles el marco debe pasar 5,5 m (da ${m3.alto})`);
assert.ok(q.lineas.some((l) => l.includes(`marcos de ${mm(m3.alto)}`)), 'Qué cotizar con otro alto de marco que el paso 3');
racks.forEach((r) => {
  const m = pl.medidasRack(r);
  assert.equal(m.alto, m3.alto, 'alto de marco distinto en el plano');
  assert.deepEqual(m.nivelesY, m3.nivelesY, 'alturas de viga distintas en el plano');
  assert.equal(m.vigaModelo, m3.vigaModelo, 'perfil de viga distinto');
  assert.equal(op.alturaUltimoNivel(r), paso3.ultimaViga, 'nivel más alto distinto (vista Bodega / PDF)');
});
// Más alto ocupa lo mismo en planta: no hay que volver a ubicar
assert.equal(k.racksAlDia(viejos, [modelo], { pallets: suyo }).huellaCambio, false);
// Pallet girado (frente 1,2): cambia la viga y el largo → hay que volver a ubicar
assert.equal(k.racksAlDia(viejos, [modelo], { pallets: [{ ...suyo[0], frente: 1.2, fondo: 1 }] }).huellaCambio, true);
// Lo que el cliente ya tiene no se toca
const ex = { ...viejos[0], id: 'ex', existente: true, modelo: undefined };
assert.strictEqual(k.racksAlDia([ex], [modelo], { pallets: suyo }).racks[0], ex);
console.log('medidas iguales en todos los pasos: ok');
