// Cajas por cama: las dos orientaciones contra el frente y fondo reales del pallet (node tests/flujo/prueba-cama.mjs)
import assert from 'node:assert';
const raiz = process.argv[2] || process.cwd();
const P = await import(`${raiz}/lib/tour/pallet.js`);
const base = { frente: 1.0, fondo: 1.2 };
assert.equal(P.cama(base, { largo: 0.4, ancho: 0.4, alto: 0.3 }).cajas, 6);            // 2 × 3, no 4
assert.equal(P.cama({ frente: 1.2, fondo: 1.0 }, { largo: 0.4, ancho: 0.4, alto: 0.3 }).cajas, 6);
assert.equal(P.cama(base, { largo: 0.6, ancho: 0.4, alto: 0.3 }).cajas, 4);            // la mejor de las dos
assert.equal(P.cama(base, { largo: 0.3, ancho: 0.2, alto: 0.2 }).cajas, 20);           // 0,3 × 0,2 → 5 × 4 = 20 (no 3 × 6 = 18)
assert.equal(P.orientaciones(base, { largo: 0.42, ancho: 0.42, alto: 0.3 }, 0.03)[0].cajas, 6);   // con 30 mm de voladizo
assert.equal(P.armarPallet({ base, caja: { largo: 0.4, ancho: 0.4, alto: 0.3 }, pesoCaja: 10, apilable: 99 }).camas, 5);   // (1,8 − 0,15) / 0,3 = 5,5
console.log('cajas por cama: 6 pruebas ok');
