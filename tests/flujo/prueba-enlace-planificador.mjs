// Link del planificador 3D: ida y vuelta, rechazo de otros links y largo máximo
import assert from 'node:assert/strict';
import { enlacePlanificador, planificadorDesdeTexto, LARGO_MAXIMO } from '../../lib/rack3d/enlacePlanificador.js';
import { enlaceDiseño } from '../../lib/flujo/enlace.js';
import { origenPublico } from '../../lib/envioLead.js';

const bodega = { ancho: 20.123456, largo: 30, altura: 8, grua: 'retractil', pesoPallet: 900, pallets: [], elementos: [{ clase: 'pilar', x: 5, y: 5, ancho: 0.4, alto: 0.4 }], forma: null };
const racks = Array.from({ length: 40 }, (_, i) => ({ id: `r${i}`, tipo: 'RS', x: i * 1.1, y: 3.25, rot: 0, cuerpos: 8, niveles: 4, doble: true, existente: i < 5 }));

const url = await enlacePlanificador({ bodega, racks }, 'https://racklog.cl');
assert.ok(url.startsWith('https://racklog.cl/planificador?d='), url.slice(0, 60));
assert.ok(url.length <= LARGO_MAXIMO, `largo ${url.length}`);
const vuelta = await planificadorDesdeTexto(new URL(url).searchParams.get('d'));
assert.equal(vuelta.racks.length, 40);
assert.equal(vuelta.racks[0].existente, true);
assert.equal(vuelta.bodega.ancho, 20.123);   // redondeado a mm
assert.deepEqual(vuelta.bodega.elementos, bodega.elementos);
console.log(`ok - ida y vuelta (40 racks dobles: ${url.length} caracteres)`);

// Un link de "Planifica tu bodega" no se abre en el planificador
const otro = await enlaceDiseño({ bodega: {}, racks: [], modelos: [] }, 'https://racklog.cl');
assert.equal(await planificadorDesdeTexto(new URL(otro).searchParams.get('d')), null);
assert.equal(await planificadorDesdeTexto('basura'), null);
assert.equal(await planificadorDesdeTexto(''), null);
console.log('ok - rechaza links ajenos o dañados');

// Diseño enorme: sin link (la API lo cortaría)
const ruido = Array.from({ length: 3000 }, (_, i) => ({ id: `x${Math.random()}`, tipo: 'RS', x: Math.random() * 100, y: Math.random() * 100, cuerpos: i }));
assert.equal(await enlacePlanificador({ bodega, racks: ruido }, 'https://racklog.cl'), '');
console.log('ok - diseño que no cabe: sin link');

assert.equal(origenPublico(), 'https://racklog.cl');
console.log('enlace planificador: pruebas ok');
