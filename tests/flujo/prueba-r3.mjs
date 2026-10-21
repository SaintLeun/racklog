import assert from 'node:assert';
const R = await import(process.argv[2] + '/lib/flujo/recomendacion.js');
let ok = 0; const prueba = (nm, f) => { f(); ok++; console.log('ok -', nm); };
const pal = (id, nombre, cantidad, o = {}) => ({ id, nombre, frente: 1, fondo: 1.2, alto: 1.2, peso: 600, cantidad, rotacion: 'media', color: '#f00', skus: 1, ...o });
prueba('CASATEC → selectivo, alternativa drive-in calculada, revisar_asesor', () => {
  const caja = { largo: 0.6, ancho: 0.4, alto: 0.3, peso: 10, apilable: 1, orientacion: 'auto' };
  const pallets = [pal('a', 'Lote 1', 29, { caja }), pal('b', 'Lote 2', 16, { caja }), pal('c', 'Lote 3', 46, { caja }), pal('d', 'Lote 4', 18, { caja })];
  const r = R.recomendarProductos({ pallets, respuestas: { equipo: 'manual', fifo: 'no', espacio: 'justo' }, bodega: { ancho: 5, largo: 10, altura: 5, grua: 'manual' } });
  r.productos.forEach((x) => assert.equal(x.sistema, 'RS', x.nombre));
  assert.ok(r.flags.includes('revisar_asesor'));
  assert.ok(r.productos.every((x) => x.otra.posiciones > 0 && x.alternativa === 'DI'));
  assert.ok(r.productos[0].porque[0].includes('apilador manual'), r.productos[0].porque[0]);
  assert.ok(r.productos[0].confirmar.some((c) => c.includes('apilada')));
  console.log('   ', r.productos[2].datos, '→', r.productos[2].config, '|', r.productos[2].gano);
});
prueba('Logística: 300 SKU, 1–2 pallets por SKU, rota harto → selectivo', () => {
  const r = R.recomendarProductos({ pallets: [pal('a', 'Retail', 450, { skus: 300, rotacion: 'alta' })], respuestas: { equipo: 'grua', fifo: 'no' }, bodega: { altura: 9, grua: 'contrapeso' } });
  assert.equal(r.productos[0].sistema, 'RS'); assert.ok(!r.flags.includes('revisar_asesor'));
});
prueba('Minería: 8 pallets por SKU, rota poco, sin vencimiento → drive-in', () => {
  const r = R.recomendarProductos({ pallets: [pal('a', 'Repuestos', 320, { skus: 40, rotacion: 'baja', peso: 900 })], respuestas: { equipo: 'grua', fifo: 'no' }, bodega: { altura: 8, grua: 'contrapeso' } });
  const x = r.productos[0];
  assert.equal(x.sistema, 'DI', x.descartes.join(';')); assert.equal(x.alternativa, 'RS');
  assert.ok(x.elegido.m2 < x.otra.m2, 'drive-in usa menos piso');
  console.log('   ', x.config, '|', x.gano);
});
prueba('Alimentos con vencimiento (FIFO estricto) → selectivo + revisar_asesor', () => {
  const r = R.recomendarProductos({ pallets: [pal('a', 'Lácteos', 300, { skus: 10 })], respuestas: { equipo: 'grua', fifo: 'estricto' }, bodega: { altura: 8, grua: 'contrapeso' } });
  assert.equal(r.productos[0].sistema, 'RS'); assert.ok(r.flags.includes('revisar_asesor'));
  assert.ok(r.productos[0].porque[0].includes('FIFO'));
});
prueba('Mezcla: selectivo y drive-in en modelos separados, drive-in por alto', () => {
  const pallets = [pal('a', 'Bebidas', 400, { skus: 10, rotacion: 'baja', alto: 1.4 }), pal('b', 'Snacks', 60, { skus: 40, rotacion: 'alta' })];
  const r = R.recomendarProductos({ pallets, respuestas: { equipo: 'grua', fifo: 'no' }, bodega: { altura: 8, grua: 'contrapeso' } });
  assert.deepEqual(r.modelos.map((m) => m.tipo).sort(), ['DI', 'RS']);
  assert.equal(r.modelos.find((m) => m.tipo === 'DI').cantidades.a, 400);
  assert.equal(r.modelos.find((m) => m.tipo === 'RS').cantidades.b, 60);
});
console.log(ok, 'pruebas ok');
