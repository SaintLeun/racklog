// Rearmar el layout (paso 5): largo de fila, partirla y ubicar solo lo que falta sin mover lo puesto
// node tests/flujo/prueba-rearmar.mjs
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const k = await import(b + '/lib/flujo/calculos.js');
const pl = await import(b + '/lib/rack3d/planificador.js');
const pallets = [{ id: 'a', nombre: 'P', frente: 1, fondo: 1.2, alto: 1.35, peso: 700, cantidad: 300, rotacion: 'media', color: '#f59e0b' }];
const modelo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 300 } };
const bod = { ancho: 30, largo: 40, altura: 8, forma: null, grua: 'contrapeso', elementos: [] };
let n = 0; const id = () => 'r' + (++n);
const res = k.resultadoModelo(modelo, { pallets });
const u = k.ubicarModelos(bod, [modelo], { m1: res.modulos }, { pallets, nuevoId: id });
console.log('necesarios', res.cuerpos, 'ubicados', k.conteoTotal(u.racks).cuerpos, 'filas', u.racks.map((r) => r.cuerpos));
const r0 = u.racks[0], q0 = pl.rectangulo(r0);
const corto = k.conCuerpos(r0, r0.cuerpos - 3);
assert.ok(Math.abs(pl.rectangulo(corto).x0 - q0.x0) < 1e-6, 'extremo izq fijo');
let racks = [corto, ...u.racks.slice(1)];
const f = k.faltantes({ racks, modelos: [modelo], pallets });
console.log('faltan', JSON.stringify(f));
assert.equal(f.m1.cuerpos, 6);
const nuevos = k.ubicarFaltantes(bod, [modelo], racks, { pallets, nuevoId: id });
racks = [...racks, ...nuevos.racks];
racks = racks.map((r) => nuevos.alargados.find((x) => x.id === r.id) ?? r);
console.log('alargados', nuevos.alargados.map((r) => r.cuerpos), 'agregados', nuevos.racks.map((r) => r.cuerpos), 'faltan ahora', JSON.stringify(k.faltantes({ racks, modelos: [modelo], pallets })));
assert.deepEqual(k.faltantes({ racks, modelos: [modelo], pallets }), {});
assert.equal(pl.conflictos(racks, bod).size ?? pl.conflictos(racks, bod).length, 0, 'sin choques');
const [a, bb] = k.partirRack(u.racks[1], id, { en: 4 });
assert.equal(a.cuerpos + bb.cuerpos, u.racks[1].cuerpos);
assert.ok(pl.rectangulo(bb).x0 - (pl.rectangulo(a).x0 + pl.rectangulo(a).ancho) > 1.1, 'separados');
// Separacion por defecto = pasillo peatonal minimo (no 1,2 m fijo)
const pt = await import(b + '/lib/rack3d/parametrosTecnicos.js');
const gap = pl.rectangulo(bb).x0 - (pl.rectangulo(a).x0 + pl.rectangulo(a).ancho);
assert.ok(Math.abs(gap - pt.DISTANCIAS.pasilloPersona.valor) < 0.01, 'separacion = pasillo peatonal');

// Prompt v3 §3: un cambio de bodega nunca rehace el layout. Un pasillo nuevo que pisa un rack lo deja en
// conflicto; "Reubicar solo los racks en conflicto" saca esos y ubica lo que falta sin mover el resto
const victima = racks[0], qv = pl.rectangulo(victima);
const bod2 = { ...bod, elementos: [{ id: 'p1', clase: 'zona', x: qv.x0 + qv.ancho / 2, y: qv.y0 + qv.alto / 2, ancho: 2, alto: 2 }] };
const malos = pl.conflictos(racks, bod2);
assert.ok(malos.has(victima.id), 'el rack pisado queda en conflicto');
const quedan = racks.filter((r) => !malos.has(r.id));
const re = k.ubicarFaltantes(bod2, [modelo], quedan, { pallets, nuevoId: id });
const final = [...quedan.map((r) => re.alargados.find((x) => x.id === r.id) ?? r), ...re.racks];
for (const r of quedan) {
  const f2 = final.find((x) => x.id === r.id);
  // Puede alargarse por un extremo, pero sus cuerpos siguen donde estaban
  const a0 = pl.rectangulo(r), a1 = pl.rectangulo(f2);
  assert.ok(f2.rot === r.rot && a1.x0 <= a0.x0 + 1e-6 && a1.y0 <= a0.y0 + 1e-6 && a1.x0 + a1.ancho >= a0.x0 + a0.ancho - 1e-6 && a1.y0 + a1.alto >= a0.y0 + a0.alto - 1e-6, 'lo puesto a mano no se mueve');
}
assert.equal(pl.conflictos(final, bod2).size, 0, 'sin conflictos tras reubicar');
console.log('conflictos reubicados', malos.size, 'agregados', re.racks.length, 'faltan', JSON.stringify(k.faltantes({ racks: final, modelos: [modelo], pallets })));
console.log('rearmar: ok');
