// Layout automatico (ronda 2): filas continuas, cortadas solo por obstaculos, sin tramos de 1–2 cuerpos
// sueltos y del mismo largo dentro de un modelo (node tests/flujo/prueba-layout.mjs)
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const k = await import(b + '/lib/flujo/calculos.js');
const pl = await import(b + '/lib/rack3d/planificador.js');
const pa = await import(b + '/lib/rack3d/pasillos.js');
const pallets = [{ id: 'a', nombre: 'P', frente: 1, fondo: 1.2, alto: 1.35, peso: 700, cantidad: 800, rotacion: 'media', color: '#f59e0b' }];
const modelo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 800 } };
let n = 0; const id = () => 'r' + (++n);
const revisar = (nombre, bodega, pedido) => {
  const u = k.ubicarModelos(bodega, [modelo], { m1: pedido }, { pallets, nuevoId: id });
  const filas = new Map();
  u.racks.forEach((r) => filas.set(r.y, (filas.get(r.y) ?? 0) + r.cuerpos));
  const largos = [...filas.values()];
  console.log(`${nombre}: ${u.racks.length} tramos, filas ${largos.join(' / ')}, tramos ${u.racks.map((r) => r.cuerpos).join(',')}, faltan ${JSON.stringify(u.faltan)}`);
  assert.equal(pl.conflictos(u.racks, bodega).size, 0, `${nombre}: racks en rojo`);
  assert.ok(u.racks.every((r) => r.cuerpos >= 3 || u.cortos.includes(r.id)), `${nombre}: tramo suelto de 1–2 cuerpos`);
  assert.ok(Math.max(...largos) - Math.min(...largos) <= filas.size, `${nombre}: filas de distinto largo ${largos}`);
  assert.equal(pa.pasillos(u.racks, bodega).filter((p) => !p.ok).length, 0, `${nombre}: pasillo angosto`);
  return u;
};
// Sin pilares: 15 modulos en una bodega donde caben 11 por fila → filas iguales (8 + 7), no 11 + 4
const libre = revisar('sin pilares 30 × 45', { ancho: 30, largo: 45, altura: 8, forma: null, grua: 'contrapeso', elementos: [] }, 15);
assert.equal(libre.racks.length, 2);
// Criterio de aceptacion del bloque 6B: 30 × 45 m con pilares cada 6 m
const pilares = pl.grillaPilaresXY({ ancho: 30, largo: 45 }, { pasoX: 6, pasoY: 6 }).map((p, i) => ({ id: `p${i}`, clase: 'pilar', x: p.x, y: p.y, ancho: 0.4, alto: 0.4 }));
const conPilares = { ancho: 30, largo: 45, altura: 8, forma: null, grua: 'contrapeso', elementos: pilares };
revisar('30 × 45 con pilares cada 6 m (40 módulos)', conPilares, 40);
const lleno = revisar('30 × 45 con pilares cada 6 m (lo que quepa)', conPilares, 400);
console.log('  posiciones', k.conteoTotal(lleno.racks).posiciones);
console.log('layout: pruebas ok');
// "Ya lo tengo": lo nuevo deja el pasillo de la grua frente a lo que el cliente ya tiene
{
  const bod = { ancho: 30, largo: 45, altura: 8, forma: null, grua: 'contrapeso', elementos: [] };
  const ex = pl.normalizar({ id: 'ex', tipo: 'RS', cuerpos: 6, niveles: 3, doble: false, rot: 0, x: 10, y: 22, existente: true });
  const u = k.ubicarModelos(bod, [modelo], { m1: 20 }, { pallets, nuevoId: id, existentes: [ex] });
  assert.equal(pl.conflictos([ex, ...u.racks], bod).size, 0, 'existente: racks en rojo');
  assert.equal(pa.pasillos([ex, ...u.racks], bod).filter((x) => !x.ok).length, 0, 'existente: pasillo angosto');
  console.log('con lo que ya tiene: ok,', u.racks.length, 'tramos nuevos');
}
// Ronda 3: con portón en el muro de abajo, los racks parten desde ese muro (cerca del despacho)
{
  const bod = { ancho: 20, largo: 60, altura: 8, forma: null, grua: 'contrapeso', elementos: [] };
  bod.elementos = k.conManiobras({ ...bod, elementos: [{ id: 'po', clase: 'porton', muro: 'abajo', ...k.enMuro(bod, { muro: 'abajo', dist: 8, ancho: 4, fondo: 0.6 }), maniobra: 3 }] });
  const arriba = k.ubicarModelos({ ...bod, elementos: [] }, [modelo], { m1: 7 }, { pallets, nuevoId: id });
  const abajo = k.ubicarModelos(bod, [modelo], { m1: 7 }, { pallets, nuevoId: id });
  assert.equal(pl.conflictos(abajo.racks, bod).size, 0, 'portón: racks en rojo');
  assert.equal(pa.pasillos(abajo.racks, bod).filter((x) => !x.ok).length, 0, 'portón: pasillo angosto');
  assert.ok(Math.min(...abajo.racks.map((r) => r.y)) > 40, `portón abajo: racks lejos del portón (y ${abajo.racks.map((r) => r.y)})`);
  assert.ok(Math.max(...arriba.racks.map((r) => r.y)) < 20, 'sin accesos: parte arriba');
  console.log('cerca del portón: ok, filas en y =', abajo.racks.map((r) => r.y).join(', '));
}
