// Angulo ranurado: cajas por bandeja y bandeja propuesta (node tests/flujo/prueba-angulo-cajas.mjs)
import assert from 'node:assert';
const raiz = process.argv[2] || process.cwd();
const C = await import(`${raiz}/lib/flujo/calculos.js`);
const R = await import(`${raiz}/lib/flujo/recomendacion.js`);
let n = 0;
const prueba = (t, f) => { f(); n++; console.log('ok -', t); };

const caja = { id: 'c', nombre: 'Caja 1', largo: 0.6, ancho: 0.4, alto: 0.3, peso: 10, cantidad: 500, apilable: 3 };
const base = { id: 'm', nombre: 'AR', tipo: 'AR', doble: false, niveles: 5, bandeja: 0.4, frente: 0.92, cantidades: { c: 500 } };

prueba('bandeja: mejor orientación, apiladas hasta lo que cabe y aguanta', () => {
  const b = C.bandejaCajas({ frente: 0.92, fondo: 0.6, altoEntre: 1.04, caja });
  assert.deepEqual([b.cols, b.filas, b.camas, b.cajas, b.largoEnFrente], [2, 1, 3, 6, false]);   // 0,4 al frente: 2 × 1 × 3
  assert.equal(C.bandejaCajas({ frente: 0.92, fondo: 0.4, altoEntre: 0.42, caja }).cajas, 1);
});

prueba('bandeja: tope de 250 kg (se quitan camas enteras)', () => {
  const b = C.bandejaCajas({ frente: 0.92, fondo: 0.6, altoEntre: 1.04, caja: { ...caja, peso: 50 } });
  assert.equal(b.limite, 'peso');
  assert.ok(b.kg <= 250);
  assert.equal(b.cajas, 4);   // 2 por cama × 2 camas = 200 kg (3 camas serían 300 kg)
});

prueba('caja 60×40×30, 10 kg, 500 cajas, apila 3: la propuesta usa muchos menos cuerpos que 920 × 400 con 1 por repisa', () => {
  const antes = C.resultadoModelo(base, { cajas: [caja] });
  assert.equal(antes.cuerpos, 100);
  const b = C.mejorBandeja(base, { cajas: [caja], altura: 8 });
  const r = C.resultadoModelo({ ...base, ...b }, { cajas: [caja] });
  assert.ok(r.cuerpos <= 30, `cuerpos ${r.cuerpos}`);
  assert.equal(b.bandeja, 0.6);
  assert.ok(r.principal.cajas >= 4);
  assert.ok(r.capacidadCajas >= 500);
  assert.ok(r.m.alto <= 3 + 1e-9);
  assert.ok(r.carga.kg <= 250);
});

prueba('recomendación: el ángulo ranurado sale con la bandeja propuesta', () => {
  const rec = R.recomendarProductos({ pallets: [], cajas: [caja], respuestas: { unidad: 'cajas' }, bodega: { altura: 8 } });
  const ar = rec.modelos.find((m) => m.tipo === 'AR');
  assert.equal(ar.bandeja, 0.6);
  assert.ok(C.resultadoModelo(ar, { cajas: [caja] }).cuerpos <= 30);
  assert.equal(ar.propuestaAR, C.firmaCajasAR(ar, [caja]));
});

prueba('techo bajo: la propuesta no pasa del techo', () => {
  const b = C.mejorBandeja(base, { cajas: [caja], altura: 2.4 });
  const r = C.resultadoModelo({ ...base, ...b }, { cajas: [caja] });
  assert.ok(r.m.alto + 0.5 <= 2.4 + 1e-6, `alto ${r.m.alto}`);
});
console.log(`ángulo cajas: ${n} pruebas ok`);
