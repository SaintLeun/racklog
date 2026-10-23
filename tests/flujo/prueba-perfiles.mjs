// Ronda 3 · Bloque E: lo que ve cada perfil (Revisa y PDF) sale de una sola cuenta y nada se lee como
// "mal diseño" (node tests/flujo/prueba-perfiles.mjs)
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const k = await import(b + '/lib/flujo/calculos.js');
const P = await import(b + '/lib/flujo/perfiles.js');
const pallets = [{ id: 'a', nombre: 'Pallet 1', frente: 1, fondo: 1.2, alto: 1.65, peso: 325, cantidad: 75, skus: 5, rotacion: 'media', color: '#f59e0b' }];
const modelo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 75 } };
const bodega = { ancho: 20, largo: 60, altura: 8, forma: null, grua: 'contrapeso', elementos: [] };
let n = 0;
const racks = k.ubicarModelos(bodega, [modelo], { m1: k.resultadoModelo(modelo, { pallets }).modulos }, { pallets, nuevoId: () => 'r' + (++n) }).racks;
const p = { pallets, cajas: [], modelos: [modelo], racks, bodega, accesorios: { quitados: [], cantidades: {} }, posicionesHoy: 40, crecimiento: 0.1 };
const v = P.vistasPorRol(p);
console.log('gerencia', JSON.stringify(v.gerencia));
console.log('bodega', JSON.stringify(v.bodega));
console.log('compras', v.compras.cotizar[0].lineas.join(' · '), '|', JSON.stringify(v.compras.accesorios));
assert.equal(v.gerencia.hoy, 40);
assert.equal(v.gerencia.conRacklog, 80);
assert.equal(v.gerencia.mas, 40); assert.equal(v.gerencia.masPct, 100);
assert.deepEqual(v.gerencia.anios.map((x) => x.necesitas), [75, 83, 91]);
assert.ok(v.gerencia.libre > 1000, 'espacio libre en positivo');
assert.ok(v.bodega.productos[0].niveles.startsWith('piso'), v.bodega.productos[0].niveles);
assert.ok(v.bodega.alcanza);
assert.ok(v.compras.cotizar[0].lineas.some((l) => /\(perfil de \d+ mm, [\d.]+ mm de largo\)/.test(l)), 'viga sin explicar');
// Bloque A: la altura del nivel más alto es la misma en el paso 3, Bodega y PDF
const paso3 = k.resultadoModelo(modelo, { pallets });
assert.equal(v.bodega.alturas[0].niveles.at(-1), paso3.ultimaViga.toFixed(2).replace('.', ','));
assert.ok(v.bodega.pasillos.anchos.every((a) => parseFloat(a.replace(',', '.')) < 8), 'pasillo de 50 m');
assert.ok(v.compras.accesorios.some((a) => a.nombre === 'Protección de bastidor' && a.medida === '2.300 mm'));
console.log('perfiles: pruebas ok');
