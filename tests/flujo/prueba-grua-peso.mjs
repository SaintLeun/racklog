// La grúa limita el rack por altura y por peso: mientras más sube, menos kg levanta (capacidad residual).
// node tests/flujo/prueba-grua-peso.mjs
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const k = await import(b + '/lib/flujo/calculos.js');
const v = await import(b + '/lib/rack3d/viabilidad.js');
const T = await import(b + '/lib/rack3d/parametrosTecnicos.js');
const A = await import(b + '/lib/flujo/auditoria.js');
// Curva típica: contrapeso 2,5 t hasta 3,3 m y 1,8 t a 6 m; la placa del cliente la escala
const tipica = T.equipoDe({ grua: 'contrapeso' });
assert.equal(T.capacidadEnAltura(tipica, 3), 2500);
assert.equal(T.capacidadEnAltura(tipica, 6), 1800);
assert.equal(T.capacidadEnAltura(tipica, 6.5), 0, 'sobre el levante no levanta');
const suya = T.equipoDe({ grua: 'contrapeso', gruaKg: 1500, gruaLevante: 4.8 });
assert.ok(suya.propia && suya.levante === 4.8 && T.capacidadEnAltura(suya, 4.8) === 1080);
console.log('ok - capacidad residual: típica y con la placa del cliente');

const pallets = [{ id: 'a', nombre: 'P', frente: 1, fondo: 1.2, alto: 1.35, peso: 1400, cantidad: 60, rotacion: 'media', color: '#f59e0b' }];
const mo = { id: 'm1', nombre: 'S', tipo: 'RS', doble: false, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 60 } };
const bod = { ancho: 20, largo: 30, altura: 8, forma: null, grua: 'contrapeso', gruaKg: 1500, elementos: [] };
// Paso 3: con su grúa de 1,5 t no se ofrece el tercer nivel (pallet de 1.400 kg a 4,8 m); con la típica sí
assert.equal(k.nivelesMaximos(mo, { pallets, altura: 8, grua: 'contrapeso', gruaDatos: { gruaKg: 1500 } }), 2);
assert.ok(k.nivelesMaximos(mo, { pallets, altura: 8, grua: 'contrapeso' }) >= 3);
const res = k.resultadoModelo(mo, { pallets, grua: 'contrapeso', gruaDatos: { gruaKg: 1500 } });
assert.ok(res.avisos.some((t) => t.includes('levanta')), 'aviso en el paso 3: ' + res.avisos.join(' | '));
console.log('ok - paso 3: niveles máximos y aviso según el peso que levanta');
// Revisión y auditoría: bloquea con su arreglo
const racks = k.ubicarModelos(bod, [mo], { m1: res.modulos }, { pallets, nuevoId: () => 'r' + Math.random() }).racks;
const av = v.revisarDiseno({ bodega: bod, racks, pallets }).filter((a) => a.regla === 'pesoGrua');
assert.ok(av.length && av[0].nivel === 'bloquea' && av[0].arreglo?.cambio?.niveles === 2, JSON.stringify(av[0]));
const au = A.auditarDiseno({ pallets, cajas: [], modelos: [mo], racks, bodega: bod, accesorios: { quitados: [], cantidades: {} } });
assert.equal(au.filas.find((f) => f.id === 'pesoGrua').nivel, 'falla');
console.log('ok - revisión bloquea y la auditoría lo marca');
console.log('grúa peso: pruebas ok');
