// Selectivo y drive-in sin armado caja por caja (dueño 27-10): los diseños y links de antes con pallets
// armados desde cajas pasan a alto y peso del pallet cargado (node tests/flujo/prueba-pallet-sin-cajas.mjs)
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const P = await import(b + '/lib/tour/pallet.js');
const E = await import(b + '/lib/flujo/enlace.js');

const viejo = () => ({ id: 't1', nombre: 'Pallet 1', frente: 1.0, fondo: 1.2, alto: 0, peso: 0, cantidad: 100, desdeCaja: true,
  caja: { largo: 0.6, ancho: 0.4, alto: 0.3, peso: 15, apilable: 5, orientacion: 'auto' }, importacion: { contenedor: 'c40' } });

// Caja 60×40×30 en pallet 1,0×1,2: 4 por cama × 5 camas = 20 cajas; 0,15 + 1,5 = 1,65 m; 25 + 300 = 325 kg
const ps = [viejo(), { id: 't2', frente: 1, fondo: 1.2, alto: 1.4, peso: 900, desdeCaja: false }];
assert.equal(P.palletsSinCajas(ps), 1);
assert.deepEqual([ps[0].alto, ps[0].peso, ps[0].desdeCaja, ps[0].caja, ps[0].importacion], [1.65, 325, false, undefined, undefined]);
assert.deepEqual([ps[1].alto, ps[1].peso], [1.4, 900], 'el pallet con alto y peso directos no cambia');

// Caja inválida: se deja el alto y el peso que tenía
const roto = { ...viejo(), alto: 1.3, peso: 700, caja: { largo: 0, ancho: 0.4, alto: 0.3, peso: 15, apilable: 5, orientacion: 'auto' } };
P.palletsSinCajas([roto]);
assert.deepEqual([roto.alto, roto.peso, roto.desdeCaja], [1.3, 700, false]);

// Link de antes: al aplicarlo al store queda sin cajas
const store = { racks: [], modelos: [], bodega: {}, $patch(f) { f(this); } };
E.aplicarDiseño(store, { pallets: [viejo()], bodega: {} });
assert.equal(store.pallets[0].desdeCaja, false);
assert.equal(store.pallets[0].alto, 1.65);
console.log('pallet sin cajas: pruebas ok');
