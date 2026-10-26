import assert from 'node:assert';
const P = await import(process.argv[2] + '/lib/tour/pallet.js');
// Criterio §6: 3 × 40' cada 2 meses, caja 60×40×30 de 20 kg que apila 5, 40 actuales, 10 % margen, 20 % crecimiento
const caja = { largo: 0.6, ancho: 0.4, alto: 0.3 };
const pal = P.armarPallet({ base: { frente: 1.0, fondo: 1.2 }, caja, pesoCaja: 20, apilable: 5 });
const d = P.demandaImportacion({ contenedor: 'c40', nContenedores: 3, caja, pesoCaja: 20, apilable: 5, semanasEntre: 8, semanasBodega: 8, cajasPorPallet: pal.cajas, actuales: 40, margen: 0.1, crecimiento: 0.2 });
console.log({ cajasPorPallet: pal.cajas, ...d });
assert.equal(d.cajas, 1500); assert.equal(d.pallets, 75); assert.equal(d.necesarias, 83); assert.equal(d.aCrecer, 43);
console.log('ok - caso importación: 1.500 cajas, 75 pallets, 83 hoy, 43 a crecer');
