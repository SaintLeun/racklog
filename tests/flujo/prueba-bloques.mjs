import assert from 'node:assert';
const b = process.argv[2];
const k = await import(b + '/lib/flujo/calculos.js');
const pa = await import(b + '/lib/rack3d/pasillos.js');
const pl = await import(b + '/lib/rack3d/planificador.js');
const pallets = [{ id: 'a', nombre: 'P', frente: 1, fondo: 1.2, alto: 1.2, peso: 700, cantidad: 300, rotacion: 'media', color: '#f59e0b' }];
const modelo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 300 } };
let n = 0; const id = () => 'r' + (++n);
// Pasillo de grua dibujado a lo ancho en y = 12
const bodega = { ancho: 30, largo: 25, altura: 8, forma: null, grua: 'contrapeso', elementos: [{ id: 'g', clase: 'pasilloGrua', x: 15, y: 12, ancho: 30, alto: 3.6 }] };
const u = k.ubicarModelos(bodega, [modelo], { m1: 19 }, { pallets, nuevoId: id });
console.log('ubicados', u.racks.map((r) => `rot${r.rot} c${r.cuerpos} y${r.y}`), 'faltan', u.faltan);
console.log('conflictos', [...pl.conflictos(u.racks, bodega)], 'angostos', pa.pasillos(u.racks, bodega).filter((p) => !p.ok).length);
// Bloque 3 a lo largo × 2 de profundidad
const b2 = { ancho: 40, largo: 30, altura: 8, forma: null, grua: 'contrapeso', elementos: [] };
const r = pl.normalizar({ id: 'base', tipo: 'RS', cuerpos: 3, niveles: 3, doble: false, rot: 0, x: 6, y: 20 });
const rep = k.repetirBloque(r, { largo: 3, profundidad: 2 }, [r], b2, id);
console.log('bloque', rep.nuevos.length, 'omitidos', rep.omitidos);
assert.equal(rep.nuevos.length, 5);
const todos = [r, ...rep.nuevos];
assert.equal(pl.conflictos(todos, b2).size, 0);
assert.equal(pa.pasillos(todos, b2).filter((p) => !p.ok).length, 0);
const esp = k.repetirBloque(r, { largo: 1, profundidad: 4, espalda: true }, [r], b2, id);
console.log('espalda', esp.nuevos.map((x) => `rot${x.rot} y${x.y}`));
assert.equal(pa.pasillos([r, ...esp.nuevos], b2).filter((p) => !p.ok).length, 0);
console.log('ok');
