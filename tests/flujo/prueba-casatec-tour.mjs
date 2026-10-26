// Caso de aceptación CASATEC en el tour (lib/tour/reglas.js): bodega 5 × 10 × 5 m, apilador manual,
// 4 lotes de 29 / 16 / 46 / 18 pallets → selectivo, con drive-in como alternativa (prompt v3 §0).
// La versión por producto (recomendacion.js) está en prueba-r3.mjs. node tests/flujo/prueba-casatec-tour.mjs "$PWD"
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const b = process.argv[2] || process.cwd();
const R = await import(pathToFileURL(b + '/lib/tour/reglas.js').href);

const casatec = { unidad: 'pallet', n_sku: 'pocos', pallets_sku: '10+', rotacion: 'media', salida: 'pallet', fifo: 'no', equipo: 'manual', espacio: 'justo' };
// Las preguntas que ve CASATEC son las del tour para pallets (sin la de peso por repisa)
const claves = R.preguntasActivas(casatec).map((q) => q.clave);
assert.ok(!claves.includes('kg_nivel') && claves.includes('equipo') && claves.includes('pallets_sku'), claves.join(','));

const r = R.recomendar(casatec);
assert.equal(r.sistema, 'RS', 'selectivo');
assert.equal(r.alternativa, 'DI', 'drive-in como alternativa');
assert.ok(r.porque.some((t) => t.includes('apilador manual')), r.porque.join(' | '));
console.log('ok - CASATEC (tour) → selectivo, alternativa drive-in:', r.porque[0]);

// Si tuviera grúa horquilla, los mismos lotes (más de 10 por producto) sí van a drive-in
const conGrua = R.recomendar({ ...casatec, equipo: 'grua' });
assert.equal(conGrua.sistema, 'DI');
assert.equal(conGrua.alternativa, 'RS');
console.log('ok - con grúa horquilla los mismos lotes van a drive-in');
console.log('2 pruebas ok');
