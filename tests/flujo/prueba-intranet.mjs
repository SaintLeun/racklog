// Mismos resultados que el cotizador de la intranet (docs/planos-alturas.zip)
import assert from 'node:assert';
const M = await import(process.argv[2] + '/lib/rack3d/medidas.js');
let ok = 0; const prueba = (n, f) => { f(); ok++; console.log('ok -', n); };
const mmv = (v) => Math.round(v * 1000);

prueba('DI: pallet 1.400, 3 niveles → marco 5.000 (luz riostra 200), como altura-drive-in.test.js', () => {
  const m = M.medidasDriveIn({ calles: 3, fondos: 4, niveles: 3, palletAlto: 1.4 });
  assert.equal(mmv(m.alto), 5000); assert.equal(mmv(m.luzRiostraSuperior), 200);
});
prueba('DI: calle = frente + 2×75 + 100; fondo = primer estándar v2 que cabe', () => {
  const m = M.medidasDriveIn({ calles: 3, fondos: 4, niveles: 3, palletFrente: 1, palletFondo: 1.2, palletAlto: 1.4 });
  assert.equal(mmv(m.anchoCalle), 1250);
  assert.equal(mmv(m.fondoBloque), 5200);   // (1200+20)×4 = 4880 → 5200
  assert.deepEqual(m.cartelasY.map(mmv), [1500, 3100]);   // 100+1400; +1600
});
prueba('RS (motor CA22/CA23/CA29/CA30): 1000×1200×1400, 800 kg, 2 por nivel, 2 vigas + piso', () => {
  const m = M.medidasSelectivo({ frentePallet: '1000mm', fondoPallet: '1200mm', altoPallet: '1400mm', palletsPerBeam: 2, niveles: 2, kgPallet: 800, sobrante: 0.3 });
  assert.equal(mmv(m.viga), 2300);              // CA29
  assert.equal(mmv(m.fondo), 1000);             // CA22 = 1200 − 200
  assert.equal(m.vigaModelo, '2TC100');         // W = 800·1·2,3/8/18 = 12,8 → 2TC100
  assert.equal(mmv(m.altoViga), 100);
  // CA23 con primer pallet a piso: vigas (cara de arriba) a 1.600 y 3.200; marco = 3.200 + sobrante
  assert.deepEqual(m.nivelesY.map((y) => mmv(y + m.altoViga / 2)), [1600, 3200]);
  assert.equal(mmv(m.alto), 3500);
});
prueba('RS: más peso y viga más larga → perfil más alto', () => {
  const m = M.medidasSelectivo({ frentePallet: '1200mm', fondoPallet: '1000mm', altoPallet: '1200mm', palletsPerBeam: 3, niveles: 3, kgPallet: 1200 });
  // W = 1200·1,5·3,9/8/18 = 48,75 → 2BTC150
  assert.equal(m.vigaModelo, '2BTC150'); assert.equal(mmv(m.altoViga), 150);
});
console.log(ok, 'pruebas ok');
