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
  // CA23 da 1.600 y 3.200; cada viga sube a la perforacion siguiente (25 + k × 76,2 mm, dueño 21-10-2026):
  // 1.625,2 y 3.225,4. Marco = ultima viga + sobrante 300
  assert.deepEqual(m.nivelesY.map((y) => mmv(y + m.altoViga / 2)), [1625, 3225]);
  assert.equal(mmv(m.alto), 3525);
  const perf = (t) => Math.abs(((t - 0.025) / 0.0762) - Math.round((t - 0.025) / 0.0762)) < 1e-3;
  assert.ok(m.nivelesY.every((y) => perf(y + m.altoViga / 2)));
});
prueba('RS: más peso y viga más larga → perfil más alto', () => {
  const m = M.medidasSelectivo({ frentePallet: '1200mm', fondoPallet: '1000mm', altoPallet: '1200mm', palletsPerBeam: 3, niveles: 3, kgPallet: 1200 });
  // W = 1200·1,5·3,9/8/18 = 48,75 → 2BTC150
  assert.equal(m.vigaModelo, '2BTC150'); assert.equal(mmv(m.altoViga), 150);
});
prueba('RS: cuerpos de eje a eje de pilar (modelador web): 14 × 2.300 + medio pilar por extremo', () => {
  const m = M.medidasSelectivo({ frentePallet: '1000mm', fondoPallet: '1200mm', altoPallet: '1400mm', palletsPerBeam: 2, niveles: 3, cuerpos: 14 });
  assert.equal(mmv(m.viga), 2300); assert.equal(mmv(m.libreViga), 2200);
  assert.equal(mmv(M.huella(m).largo), 32300);
});
prueba('AR (modelador web): 920 × 400 → 924 × 404 por cuerpo; 2.000 mm y 5 bandejas → 40/520/1.000/1.480/1.960', () => {
  const m = M.medidasAnra({ cuerpos: 5, niveles: 5, frente: 0.92, bandeja: '400mm' });
  assert.equal(mmv(M.huella(m).largo), 4620); assert.equal(mmv(M.huella(m).fondo), 404);
  assert.deepEqual(M.repartirNiveles(2000, 5).bases, [40, 520, 1000, 1480, 1960]);
  assert.deepEqual(m.nivelesY.map((y) => mmv(y) - 20), [40, 520, 1000, 1480, 1960]);
  const d = M.medidasAnra({ cuerpos: 1, niveles: 5, tipo: 'doble', frente: 1.2, bandeja: '500mm' });
  assert.equal(d.frente, 0.92); assert.ok([0.46, 0.6].includes(d.fondo)); assert.equal(mmv(M.huella(d).fondo), 2 * (mmv(d.fondo) + 4));
  // Con la caja: el angulo justo en la grilla de 20 mm y nunca sobre 3 m
  const c = M.medidasAnra({ niveles: 4, altoEntre: 0.43 });
  assert.equal(mmv(c.alto) % 20, 0); assert.ok(c.altoEntre >= 0.43 - 1e-9);
  assert.equal(M.medidasAnra({ niveles: 8, altoEntre: 0.6 }).excedeAlto, true);
});
console.log(ok, 'pruebas ok');
