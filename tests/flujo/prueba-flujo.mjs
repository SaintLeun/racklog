import assert from 'node:assert';
const b = process.argv[2];
const k = await import(b + '/lib/flujo/calculos.js');
const pa = await import(b + '/lib/rack3d/pasillos.js');
const pl = await import(b + '/lib/rack3d/planificador.js');
const pallets = [
  { id: 'a', nombre: '1,2 m', frente: 1, fondo: 1.2, alto: 1.2, peso: 700, cantidad: 180, rotacion: 'alta', color: '#f59e0b' },
  { id: 'b', nombre: '1,7 m', frente: 1, fondo: 1.2, alto: 1.7, peso: 600, cantidad: 50, rotacion: 'baja', color: '#3b82f6' },
];
const modelo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 180, b: 50 } };
console.log('mezcla', k.mezclaPorDefecto(modelo, pallets));
const res = k.resultadoModelo(modelo, { pallets });
console.log('RS', { porCuerpo: res.porCuerpo, total: res.total, cuerpos: res.cuerpos, carga: res.carga, alto: res.alto, avisos: res.avisos, viga: res.m.viga, altos: res.r.altos });
// Criterio §6: 180 de 1,2 que rotan harto y 50 de 1,7 que rotan poco → 1,2 en piso y niveles 1–2; 1,7 en nivel 3
assert.deepStrictEqual(k.mezclaPorDefecto(modelo, pallets), ['a', 'a', 'a', 'b']);
console.log('niveles max 8m', k.nivelesMaximos(modelo, { pallets, altura: 8 }), 'manual', k.nivelesMaximos(modelo, { pallets, altura: 8, grua: 'manual' }));
const di = { id: 'm2', nombre: 'DI', tipo: 'DI', doble: false, niveles: 3, fondos: 5, cantidades: { a: 120 } };
const rd = k.resultadoModelo(di, { pallets }); console.log('DI', rd.porCuerpo, rd.cuerpos, rd.avisos);
const ar = { id: 'm3', nombre: 'AR', tipo: 'AR', doble: false, niveles: 5, bandeja: 0.4, frente: 0.92, cantidades: { c: 500 } };
const ra = k.resultadoModelo(ar, { cajas: [{ id: 'c', nombre: 'Caja', largo: 0.4, ancho: 0.3, alto: 0.3, peso: 8, cantidad: 500, apilable: 3 }] });
console.log('AR', ra.porCuerpo, ra.cuerpos, ra.carga, ra.avisos);
let n = 0; const id = () => 'r' + (++n);
const bodega = { ancho: 30, largo: 25, altura: 8, forma: null, elementos: [], grua: 'contrapeso' };
const u = k.ubicarModelos(bodega, [modelo, di], { m1: res.cuerpos, m2: rd.cuerpos }, { pallets, nuevoId: id });
console.log('ubicados', u.racks.map((r) => `${r.tipo} rot${r.rot} c${r.cuerpos} (${r.x},${r.y})`), 'faltan', u.faltan);
const ps = pa.pasillos(u.racks, bodega);
console.log('pasillos', ps.length, 'angostos', ps.filter((p) => !p.ok).map((p) => p.libre));
console.log('conflictos', [...pl.conflictos(u.racks, bodega)]);
