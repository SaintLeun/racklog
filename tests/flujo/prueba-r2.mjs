import assert from 'node:assert';
const b = process.argv[2];
const k = await import(b + '/lib/flujo/calculos.js');
let ok = 0;
const prueba = (n, f) => { f(); ok++; console.log('ok -', n); };
const pal = (frente, fondo) => [{ id: 'a', nombre: 'Bebidas', frente, fondo, alto: 1.2, peso: 700, cantidad: 100, rotacion: 'media', color: '#f59e0b' }];
const modelo = (doble) => ({ id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 100 } });

prueba('viga y fondo de marco salen del frente y fondo del pallet', () => {
  const a = k.resultadoModelo(modelo(true), { pallets: pal(1.0, 1.2) });
  const g = k.resultadoModelo(modelo(true), { pallets: pal(1.2, 1.0) });
  assert.equal(a.m.viga, 2.3); assert.equal(+a.m.fondo.toFixed(3), 1.0);
  assert.equal(g.m.viga, 2.7); assert.equal(+g.m.fondo.toFixed(3), 0.8);
});

for (const doble of [true, false]) {
  prueba(`mismos números en pasos 3, 5 y cotización (${doble ? 'doble' : 'simple'})`, () => {
    const pallets = pal(1.0, 1.2), mo = modelo(doble);
    const r3 = k.resultadoModelo(mo, { pallets });
    let n = 0;
    const u = k.ubicarModelos({ ancho: 40, largo: 30, altura: 8, forma: null, elementos: [], grua: 'contrapeso' }, [mo], { m1: r3.modulos }, { pallets, nuevoId: () => 'r' + (++n) });
    const c5 = k.conteoTotal(u.racks);
    const q = k.queCotizar([mo], u.racks)[0];
    assert.equal(c5.cuerpos, r3.cuerpos, 'cuerpos 3 vs 5');
    assert.equal(c5.posiciones, r3.capacidad, 'posiciones 3 vs 5');
    assert.equal(q.posiciones, r3.capacidad, 'posiciones cotización');
    assert.ok(q.lineas[0].startsWith(`${r3.cuerpos} cuerpos`), q.lineas[0]);
    assert.ok(q.lineas[1].startsWith(`${c5.marcos} marcos`), q.lineas[1]);
    console.log(`   ${doble ? 'doble' : 'simple'}: ${r3.cuerpos} cuerpos (${r3.modulos} por lado), ${r3.porCuerpo}/cuerpo, ${r3.capacidad} posiciones, ${c5.marcos} marcos`);
  });
}
console.log(ok, 'pruebas ok');
