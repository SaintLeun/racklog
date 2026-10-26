// Túnel por rack (paso 5): un rack puede tener su propio cuerpo túnel que pisa el del modelo; el conteo,
// lo que se cotiza y racksAlDia lo respetan. Recorridos de la grúa y sugerencia de túnel (rutas.js).
// node tests/flujo/prueba-tunel-rack.mjs
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const k = await import(b + '/lib/flujo/calculos.js');
const pl = await import(b + '/lib/rack3d/planificador.js');
const ru = await import(b + '/lib/rack3d/rutas.js');
const pallets = [{ id: 'a', nombre: 'P', frente: 1, fondo: 1.2, alto: 1.35, peso: 700, cantidad: 800, rotacion: 'media', color: '#f59e0b' }];
const modelo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], tunel: null, cantidades: { a: 800 } };
let n = 0; const id = () => 'r' + (++n);
const bod = { ancho: 30, largo: 40, altura: 8, forma: null, grua: 'contrapeso', elementos: [{ id: 'po', clase: 'porton', x: 15, y: 39.7, ancho: 4, alto: 0.6 }] };
// Llenado automático: deja un pasillo de cabecera del lado del portón y la grúa llega a todos los pasillos
const auto = k.ubicarModelos(bod, [modelo], { m1: 60 }, { pallets, nuevoId: id });
const Ra = ru.recorridosGrua(bod, auto.racks);
assert.equal(Ra.rutas.filter((x) => x.llega).length, Ra.rutas.length, 'con pasillo de cabecera la grúa llega a todos los pasillos');
console.log(`  llenado automático: la grúa llega a ${Ra.rutas.length} de ${Ra.rutas.length} pasillos`);
// Filas de muro a muro (como las dibuja un cliente sin cabecera): el caso que pide túneles
const u = k.ubicarModelos(bod, [modelo], { m1: 60 }, { pallets, nuevoId: id, cabecera: false });
assert.ok(u.racks.length >= 3, 'hay filas');

// 1) Conteo: un rack con túnel propio pierde las posiciones bajo el paso libre y sus vigas
const sin = k.conteoTotal(u.racks);
const r0 = u.racks[0];
const conTunel = { ...r0, tunelPropio: true, tunelRack: { cuerpo: 2, altoLibre: 3.5 }, tunel: { cuerpo: 2, altoLibre: 3.5 } };
const t = pl.medidasRack(conTunel).tunel;
assert.ok(t && t.quitadas >= 2, 'el túnel quita alturas');
const racks1 = [conTunel, ...u.racks.slice(1)];
const con = k.conteoTotal(racks1);
const filas = 2, porViga = pl.medidasRack(r0).palletsPorViga;
assert.equal(sin.posiciones - con.posiciones, t.quitadas * porViga * filas, 'posiciones que quita el túnel');
assert.equal(sin.paresVigas - con.paresVigas, (t.quitadas - 1) * filas, 'pares de vigas que quita el túnel');
assert.equal(sin.cuerpos, con.cuerpos, 'los cuerpos son los mismos');

// 2) racksAlDia (al cambiar el modelo o los pallets) no borra el túnel del rack
const alDia = k.racksAlDia(racks1, [modelo], { pallets }).racks;
assert.deepEqual(alDia[0].tunel, { cuerpo: 2, altoLibre: 3.5 }, 'racksAlDia conserva el túnel propio');
assert.ok(!alDia[1].tunel, 'los demás siguen el modelo (sin túnel)');
// Modelo con túnel: todos lo llevan menos el que dice "sin túnel" (tunelPropio con null)
const mT = { ...modelo, tunel: { cuerpo: 0, altoLibre: 2.2 } };
const racks2 = [{ ...u.racks[0], tunelPropio: true, tunelRack: null }, ...u.racks.slice(1)];
const alDia2 = k.racksAlDia(racks2, [mT], { pallets }).racks;
assert.ok(!alDia2[0].tunel, 'el rack sin túnel propio no lo lleva aunque el modelo sí');
assert.ok(alDia2.slice(1).every((r) => r.tunel?.altoLibre === 2.2), 'el resto lleva el túnel del modelo');
// Simula el paso 3 (cambiarModelo pisa los campos del modelo) y vuelve racksAlDia: se mantiene el propio
const pisado = racks1.map((r) => ({ ...r, ...mT, id: r.id, modelo: 'm1' }));
assert.deepEqual(k.racksAlDia(pisado, [mT], { pallets }).racks[0].tunel, { cuerpo: 2, altoLibre: 3.5 }, 'el túnel propio sobrevive a cambiarModelo');

// 3) Qué cotizar: cuenta los cuerpos túnel de todos los racks y sus posiciones
const q1 = k.queCotizar([modelo], racks1)[0];
assert.ok(q1.lineas.some((l) => /^1 cuerpo túnel con paso libre de 3\.500 mm/.test(l)), 'línea del túnel en qué cotizar: ' + q1.lineas.join(' | '));
assert.equal(q1.posiciones, con.posiciones);
assert.ok(q1.lineas.some((l) => l.startsWith(`${con.paresVigas} pares de vigas`)), 'pares de vigas con el túnel');
const q2 = k.queCotizar([mT], alDia2)[0];
assert.ok(q2.lineas.some((l) => l.startsWith(`${alDia2.length - 1} cuerpos túnel con paso libre de 2.200 mm`)), q2.lineas.join(' | '));
const q0 = k.queCotizar([modelo], u.racks)[0];
assert.ok(!q0.lineas.some((l) => l.includes('túnel')), 'sin túnel no aparece');

// 4) Recorrido de la grúa: filas de muro a muro → solo llega al primer pasillo; el túnel sugerido abre el siguiente
const R = ru.recorridosGrua(bod, u.racks);
assert.equal(R.andenes.length, 1);
const llegan = R.rutas.filter((x) => x.llega).length;
assert.ok(llegan >= 1 && llegan < R.rutas.length, `llega a ${llegan} de ${R.rutas.length}`);
R.rutas.filter((x) => x.llega).forEach((x) => assert.ok(x.puntos.length >= 2 && x.largo > 0, 'ruta con puntos'));
const S = ru.sugerirTuneles(bod, u.racks);
assert.ok(S.length >= 1 && S[0].nuevos >= 1, 'sugiere un túnel: ' + JSON.stringify(S));
const aplicado = u.racks.map((r) => (r.id === S[0].rackId ? { ...r, tunel: { cuerpo: S[0].cuerpo, altoLibre: S[0].altoLibre } } : r));
const R2 = ru.recorridosGrua(bod, aplicado);
assert.ok(R2.rutas.filter((x) => x.llega).length > llegan, 'con el túnel la grúa llega a más pasillos');
// Túnel de 2,2 m (personas): la grúa no pasa
const bajo = u.racks.map((r) => (r.id === S[0].rackId ? { ...r, tunel: { cuerpo: S[0].cuerpo, altoLibre: 2.2 } } : r));
assert.equal(ru.recorridosGrua(bod, bajo).rutas.filter((x) => x.llega).length, llegan, 'por un túnel de personas no pasa la grúa');
// Con espacio para dar la vuelta, el túnel ahorra metros
const ancha = { ...bod, ancho: 38, elementos: [{ id: 'po', clase: 'porton', x: 15, y: 39.7, ancho: 4, alto: 0.6 }] };
const S2 = ru.sugerirTuneles(ancha, u.racks);
console.log('  bodega ancha:', S2.map((s) => `${s.rackId} cuerpo ${s.cuerpo + 1}: ahorra ${s.ahorro} m, ${s.nuevos} pasillos nuevos`).join(' · ') || 'sin sugerencias');
assert.ok(S2.length && S2[0].ahorro >= 6, 'sugiere túnel por ahorro');
console.log('túnel por rack: pruebas ok');
// Túneles en línea: todas las filas con un túnel en la misma línea → la grúa llega a todos los pasillos
{
  const linea = ru.tunelesAlineados(u.racks, S[0]);
  assert.equal(linea.length, u.racks.length, 'un túnel por fila');
  const todas = u.racks.map((r) => { const t = linea.find((x) => x.rackId === r.id); return t ? { ...r, tunel: { cuerpo: t.cuerpo, altoLibre: 3.5 } } : r; });
  const R3 = ru.recorridosGrua(bod, todas);
  assert.equal(R3.rutas.filter((x) => x.llega).length, R3.rutas.length, 'con túneles en línea llega a todos: ' + R3.rutas.map((x) => x.llega).join());
  console.log(`  túneles en línea: ${linea.length} filas, llega a ${R3.rutas.length} de ${R3.rutas.length} pasillos`);
}
console.log('túneles en línea: pruebas ok');
