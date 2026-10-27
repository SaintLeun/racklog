// Rack sobre pilar (dueño 27-10): un selectivo simple o doble pasa sobre un pilar y pierde solo las posiciones
// donde cae; un pilar en la boca de una posición (delante de la cara de carga) también la descuenta.
// node tests/flujo/prueba-pilar.mjs "$PWD"
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const k = await import(b + '/lib/flujo/calculos.js');
const pl = await import(b + '/lib/rack3d/planificador.js');
const { DISTANCIAS } = await import(b + '/lib/rack3d/parametrosTecnicos.js');
const bod = { ancho: 30, largo: 20, forma: null, elementos: [] };
const pil = (x, y, id = 'p') => ({ id, clase: 'pilar', x, y, ancho: 0.4, alto: 0.4 });
const caja = (r) => { const q = pl.rectangulo(r); return { x0: q.x0, y0: q.y0, x1: q.x0 + q.ancho, y1: q.y0 + q.alto }; };
const con = (els) => ({ ...bod, elementos: els });
const pos = (r, b2) => k.conteoRack(k.conPilares([r], b2)[0]).posiciones;
// 5 cuerpos, 3 niveles + piso = 4 alturas, 2 pallets por viga
for (const rot of [0, 90, 180, 270]) {
  const simple = pl.normalizar({ id: 's', tipo: 'RS', cuerpos: 5, niveles: 3, doble: false, rot, x: 15, y: 10 });
  const total = k.conteoRack(simple).posiciones;
  assert.equal(total, 5 * 2 * 4);
  const q = caja(simple), cx = (q.x0 + q.x1) / 2, cy = (q.y0 + q.y1) / 2;
  // Pilar en el centro del rack (sobre un pallet): no es choque y pierde 1 hueco × 4 alturas
  const centro = con([pil(cx + (rot % 180 ? 0 : 0.6), cy + (rot % 180 ? 0.6 : 0))]);
  assert.equal(pl.conflictos([simple], centro).size, 0, `simple rot ${rot} sobre pilar`);
  assert.equal(total - pos(simple, centro), 4, `simple rot ${rot} pierde una columna`);
  const info = pl.perdidasPorPilares(simple, centro);
  assert.equal(info.pilares, 1); assert.equal(info.huecos.length, 1); assert.equal(info.huecos[0].motivo, 'pilar');
}
// Pilar justo sobre un marco (entre dos pallets de cuerpos vecinos): pierde los dos huecos que toca
{
  const r = pl.normalizar({ id: 's', tipo: 'RS', cuerpos: 5, niveles: 3, doble: false, rot: 0, x: 15, y: 10 });
  const q = caja(r), viga = pl.medidasRack(r).viga;
  const b2 = con([pil(q.x0 + 2 * viga + 0.05, (q.y0 + q.y1) / 2)]);
  assert.equal(k.conteoRack(r).posiciones - pos(r, b2), 8, 'sobre el marco: dos columnas');
}
// Doble: pilar en una de las filas pierde solo ese lado; en el medio (separador) toca los dos lados
{
  const r = pl.normalizar({ id: 'd', tipo: 'RS', cuerpos: 5, niveles: 3, doble: true, rot: 0, x: 15, y: 10 });
  const q = caja(r), tot = k.conteoRack(r).posiciones;
  assert.equal(tot - pos(r, con([pil(q.x0 + 2, q.y0 + 0.5)])), 4, 'doble, un lado');
  assert.equal(tot - pos(r, con([pil(q.x0 + 2, (q.y0 + q.y1) / 2)])), 8, 'doble, pilar al medio toca los dos lados');
}
// Pilar en la boca de una posición (delante de la cara de carga, en el pasillo): no choca pero tapa la entrada
{
  const r = pl.normalizar({ id: 's', tipo: 'RS', cuerpos: 5, niveles: 3, doble: false, rot: 0, x: 15, y: 10 });   // frente arriba
  const q = caja(r), tot = k.conteoRack(r).posiciones;
  const delante = con([pil(q.x0 + 2, q.y0 - 0.4)]);
  assert.equal(pl.conflictos([r], delante).size, 0);
  const [a] = k.conPilares([r], delante);
  assert.equal(a.tapadas, 4); assert.equal(tot - k.conteoRack(a).posiciones, 4, 'pilar en la boca tapa una columna');
  // Lejos de la boca (más allá de DISTANCIAS.bocaPosicion) o detrás del simple: no se pierde nada
  assert.equal(pos(r, con([pil(q.x0 + 2, q.y0 - DISTANCIAS.bocaPosicion.valor - 0.5)])), tot);
  assert.equal(pos(r, con([pil(q.x0 + 2, q.y1 + 0.4)])), tot, 'detrás de un simple no tapa');
  // En un doble, la cara de atrás también se carga: ahí sí tapa
  const d = pl.normalizar({ ...r, doble: true }), qd = caja(d);
  assert.equal(k.conteoRack(d).posiciones - pos(d, con([pil(qd.x0 + 2, qd.y1 + 0.4)])), 4, 'doble: boca de atrás');
}
// Cuerpo túnel: allí ya no hay pallets abajo, se descuenta solo lo que queda
{
  const r = pl.normalizar({ id: 't', tipo: 'RS', cuerpos: 5, niveles: 3, doble: false, rot: 0, x: 15, y: 10, tunel: { cuerpo: 2, altoLibre: 2.5 } });
  const m = pl.medidasRack(r), q = caja(r);
  const b2 = con([pil(q.x0 + 2 * m.viga + 0.65, (q.y0 + q.y1) / 2)]);
  assert.equal(k.conteoRack(r).posiciones - pos(r, b2), 4 - m.tunel.quitadas);
}
// Alargar hasta el muro pasa sobre el pilar (simple). Ángulo ranurado sobre el pilar (video 27-10): no choca,
// pierde el módulo (prueba-video-27-10.mjs)
{
  const r = pl.normalizar({ id: 's', tipo: 'RS', cuerpos: 2, niveles: 3, doble: false, rot: 0, x: 3, y: 10 });
  const b2 = con([pil(12, 10)]);
  const largo = k.alargarHastaMuro(r, [r], b2, 1);
  assert.ok(caja(largo).x1 > 25, 'el lineal sigue más allá del pilar');
  const ar = pl.normalizar({ id: 'a', tipo: 'AR', cuerpos: 3, niveles: 4, rot: 0, x: 12, y: 10 });
  assert.equal(pl.conflictos([ar], b2).size, 0, 'ángulo ranurado sobre pilar: no choca');
  assert.equal(pl.perdidasPorPilares(ar, b2).huecos.length, 1, 'pierde el módulo donde cae');
}
// Sin pilares: no pierde nada y conPilares no cambia el arreglo dos veces
{
  const r = pl.normalizar({ id: 's', tipo: 'RS', cuerpos: 3, niveles: 3, doble: false, rot: 0, x: 15, y: 10 });
  const una = k.conPilares([r], bod);
  assert.equal(k.conPilares(una, bod), una);
}
// Rearmar los racks (racksAlDia: al cargar, al cambiar pallets o modelos) no borra lo que quitan los pilares
{
  const pallets = [{ id: 'a', nombre: 'P', frente: 1, fondo: 1.2, alto: 1.35, peso: 700, cantidad: 300, rotacion: 'media', color: '#f59e0b' }];
  const modelo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 300 } };
  const r = { ...k.rackDeModelo(modelo, { pallets, cuerpos: 6 }), id: 'r1', x: 10, y: 10, rot: 0 };
  const bod = { ancho: 30, largo: 40, altura: 8, forma: null, grua: 'contrapeso', elementos: [{ id: 'p', clase: 'pilar', x: 10, y: 10, ancho: 0.4, alto: 0.4 }] };
  const [c] = k.conPilares([r], bod);
  const { racks } = k.racksAlDia([c], [modelo], { pallets, grua: 'contrapeso' });
  assert.equal(k.conteoTotal(racks).posiciones, k.conteoTotal([c]).posiciones, 'racksAlDia conserva las posiciones perdidas por pilares');
}
// Pilar dentro de un pasillo (dueño 27-10): angosta el pasillo de la grúa y el arreglo lo deja dentro del rack
{
  const V = await import(b + '/lib/rack3d/viabilidad.js');
  const P = await import(b + '/lib/rack3d/pasillos.js');
  const r1 = pl.normalizar({ id: 'a', tipo: 'RS', cuerpos: 5, niveles: 3, doble: false, rot: 0, x: 10, y: 20 });
  const q = pl.rectangulo(r1);
  const r2 = pl.normalizar({ id: 'b', tipo: 'RS', cuerpos: 5, niveles: 3, doble: false, rot: 180, x: 10, y: +(q.y0 - 3.6 - q.alto / 2).toFixed(2) });
  const bod = { ancho: 20, largo: 40, altura: 8, grua: 'contrapeso', elementos: [{ id: 'p', clase: 'pilar', x: 10, y: +(q.y0 - 1.8).toFixed(2), ancho: 0.4, alto: 0.4 }] };
  const ps = P.pasillos([r1, r2], bod).find((x) => x.vecino);
  assert.ok(!ps.ok && Math.abs(ps.libre - 1.6) < 0.02 && ps.angosta?.clase === 'pilar', 'pilar al centro: quedan 1,6 m y no pasa la grúa');
  const av = V.revisarDiseno({ bodega: bod, racks: [r1, r2], pallets: [] }).find((x) => x.regla === 'pasillo');
  assert.ok(av?.arreglo?.tipo === 'racks', 'arreglo: correr las filas');
  const r = V.aplicarArreglo({ bodega: bod, racks: [r1, r2] }, av.arreglo);
  assert.equal(V.revisarDiseno({ bodega: bod, racks: k.conPilares(r.racks, bod), pallets: [] }).filter((x) => x.regla === 'pasillo').length, 0, 'después del arreglo el pasillo cumple');
}
console.log('pilar: pruebas ok');
