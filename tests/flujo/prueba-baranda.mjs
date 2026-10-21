import assert from 'node:assert';
const A = await import(process.argv[2] + '/lib/rack3d/accesorios.js');
assert.deepStrictEqual(A.piezasBaranda(18), { modulos: 3, ajuste: 0 });
assert.deepStrictEqual(A.piezasBaranda(20), { modulos: 3, ajuste: 2 });
assert.deepStrictEqual(A.piezasBaranda(4), { modulos: 0, ajuste: 4 });
assert.deepStrictEqual(A.piezasBaranda(12.3), { modulos: 2, ajuste: 0.3 });
const bodega = (largo) => ({ ancho: 40, largo: 30, altura: 10, forma: null, grua: 'contrapeso', elementos: [{ id: 'p', clase: 'pasilloPeatonal', x: 20, y: 15, ancho: 1.2, alto: largo }] });
for (const L of [18, 20]) {
  const b = A.proponerAccesorios({ bodega: bodega(L), racks: [] }).find((a) => a.id === 'barandas');
  console.log(`${L} m →`, b.cantidad, 'm ·', b.medida, '· marcas', b.marcas.length, '·', A.textoAccesorios([b]));
}
// Con un cruce de pasillo de grua de 3,5 m al medio de un peatonal de 20 m
const bc = bodega(20); bc.elementos.push({ id: 'g', clase: 'pasilloGrua', x: 20, y: 15, ancho: 10, alto: 3.5 });
const x = A.proponerAccesorios({ bodega: bc, racks: [] }).find((a) => a.id === 'barandas');
console.log('20 m con cruce →', x.cantidad, 'm ·', x.medida);
