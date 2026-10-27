// Paso 5 (dueño 26-10): el cliente dibuja cada lineal arrastrando, del largo y por el muro que quiera, y un
// pilar puede quedar dentro de un selectivo perdiendo solo sus posiciones
// node tests/flujo/prueba-pincel.mjs
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const k = await import(b + '/lib/flujo/calculos.js');
const pl = await import(b + '/lib/rack3d/planificador.js');
const bod = { ancho: 30, largo: 20, forma: null, elementos: [] };
const base = { tipo: 'RS', niveles: 3, doble: false };
const caja = (r) => { const q = pl.rectangulo(r); return { x0: q.x0, y0: q.y0, x1: q.x0 + q.ancho, y1: q.y0 + q.alto }; };
// Junto al muro de arriba, de izquierda a derecha: espalda al muro, frente hacia adentro, parte en la esquina
const arriba = k.linealArrastrado(base, { x: 0.5, y: 0.5 }, { x: 15, y: 0.8 }, bod);
assert.equal(arriba.rot, 180); assert.ok(Math.abs(caja(arriba).y0 - 0.1) < 0.01 && Math.abs(caja(arriba).x0 - 0.1) < 0.01);
// Muro de abajo, de derecha a izquierda: crece hacia donde arrastra
const abajo = k.linealArrastrado(base, { x: 29.5, y: 19.6 }, { x: 18, y: 19 }, bod);
assert.equal(abajo.rot, 0); assert.ok(Math.abs(caja(abajo).x1 - 29.9) < 0.01 && Math.abs(caja(abajo).y1 - 19.9) < 0.01);
// Muro izquierdo, vertical
const izq = k.linealArrastrado(base, { x: 0.3, y: 2 }, { x: 0.3, y: 14 }, bod);
assert.equal(izq.rot, 90); assert.ok(Math.abs(caja(izq).x0 - 0.1) < 0.01);
// Cuantos cuerpos: el largo del arrastre redondeado a cuerpos enteros; un clic = 1 cuerpo
const L = (n) => pl.rectangulo(pl.normalizar({ ...base, cuerpos: n, rot: 0 })).ancho;
assert.equal(k.linealArrastrado(base, { x: 10, y: 10 }, { x: 10 + L(7), y: 10 }, bod).cuerpos, 7);
assert.equal(k.linealArrastrado(base, { x: 10, y: 10 }, { x: 10, y: 10 }, bod).cuerpos, 1);
assert.equal(pl.conflictos([arriba, abajo, izq], bod).size, 0, 'sin choques');
// Pilar dentro de un doble: no es conflicto y pierde una columna (un pallet por nivel, más el piso)
const doble = k.linealArrastrado({ ...base, doble: true }, { x: 4, y: 10 }, { x: 18, y: 10 }, bod);
const q = caja(doble), pilar = { id: 'p', clase: 'pilar', x: q.x0 + 2, y: q.y0 + 0.5, ancho: 0.4, alto: 0.4 };
const conPilar = { ...bod, elementos: [pilar] };
assert.equal(pl.conflictos([doble], conPilar).size, 0, 'doble con pilar adentro');
const [anotado] = k.conPilares([doble], conPilar);
assert.equal(anotado.pilares, 1);
assert.equal(k.conteoRack(doble).posiciones - k.conteoRack(anotado).posiciones, 4, 'pierde 3 niveles + piso de un lado');
// Simple (dueño 27-10): tampoco choca, pierde su columna (prueba-pilar.mjs). Drive-in: el pilar sigue chocando
const simple = pl.normalizar({ ...doble, doble: false });
assert.equal(pl.conflictos([simple], { ...bod, elementos: [{ ...pilar, y: caja(simple).y0 + 0.5 }] }).size, 0);
const di = pl.normalizar({ tipo: 'DI', cuerpos: 3, niveles: 3, rot: 0, x: 15, y: 10, id: 'd' });
assert.equal(pl.conflictos([di], { ...bod, elementos: [{ ...pilar, x: 15, y: 10 }] }).size, 1);
// Se quita el pilar: recupera sus posiciones
assert.equal(k.conPilares([anotado], bod)[0].pilares, 0);
console.log('pincel: pruebas ok');

// Ángulo ranurado (dueño 26-10): pasillo de circulación de 0,8 a 1,5 m y "repetir hasta el muro"
{
  const pa = await import(b + '/lib/rack3d/pasillos.js');
  const pt = await import(b + '/lib/rack3d/parametrosTecnicos.js');
  const { min, max } = pt.DISTANCIAS.pasilloAR;
  assert.equal(min, 0.8); assert.equal(max, 1.5);
  const ar = pl.normalizar({ id: 'ar', tipo: 'AR', cuerpos: 6, niveles: 5, rot: 0, x: 4, y: 1 });
  assert.equal(pa.pasilloRequerido(ar, bod), 0.8);
  assert.equal(pa.pasilloRequerido({ ...ar, anchoCarro: 3 }, bod), 1.5, 'con carro no pasa de 1,5');
  const q0 = pl.rectangulo(ar);
  const fondo = q0.alto, uno = { ...ar, y: q0.alto / 2 + 0.1 };
  for (const pasillo of [0.8, 1.0, 1.5]) {
    const n = k.maxBloque(uno, { largo: 1, profundidad: 1, pasillo }, 'profundidad', [uno], bod);
    const copias = k.previaBloque(uno, { largo: 1, profundidad: n, pasillo }, [uno], bod).filter((c) => c.ok).map((c) => c.rack);
    const ys = [uno, ...copias].map((r) => pl.rectangulo(r).y0).sort((x, y) => x - y);
    const separ = ys[1] - ys[0] - fondo;
    assert.ok(Math.abs(separ - pasillo) < 0.02, `pasillo ${pasillo}: ${separ}`);
    // La siguiente fila ya no cabe: es hasta el muro
    assert.ok(k.previaBloque(uno, { largo: 1, profundidad: n + 1, pasillo }, [uno], bod).some((c) => !c.ok));
    assert.equal(pl.conflictos([uno, ...copias], bod).size, 0);
    console.log(`AR pasillo ${pasillo} m: ${n} filas hasta el muro`);
  }
  const nl = k.maxBloque(uno, { largo: 1, profundidad: 1 }, 'largo', [uno], bod);
  assert.ok(nl >= 4 && k.previaBloque(uno, { largo: nl + 1, profundidad: 1 }, [uno], bod).some((c) => !c.ok));
  console.log('AR a lo largo hasta el muro:', nl);
}
console.log('pincel + AR: pruebas ok');

// Todo parte de un cuerpo (dueño 26-10): selectivo, drive-in y ángulo ranurado se alargan cuerpo a cuerpo
// hasta el muro (hacia el lado que se pide) y después se repite la fila hasta el otro muro
for (const tipo of ['RS', 'DI', 'AR']) {
  for (const doble of tipo === 'DI' ? [false] : [false, true]) {
    const uno = pl.normalizar({ id: 'u', tipo, cuerpos: 1, niveles: 3, doble, rot: 0, x: 15, y: 10 });
    const der = k.alargarHastaMuro(uno, [uno], bod, 1);
    const ambos = k.alargarHastaMuro(der, [der], bod, -1);
    const q = pl.rectangulo(ambos), q1 = pl.rectangulo(uno);
    assert.ok(Math.abs(pl.rectangulo(der).x0 - q1.x0) < 0.01, `${tipo}: el extremo izquierdo no se mueve`);
    assert.ok(q.x0 >= 0.1 - 1e-6 && q.x0 + q.ancho <= 29.9 + 1e-6 && 30 - (q.x0 + q.ancho) < 3 && q.x0 < 3, `${tipo}: llega a los dos muros dejando 10 cm`);
    assert.equal(pl.conflictos([ambos], bod).size, 0);
    // Uno más ya no cabe
    const otro = k.conCuerpos(ambos, ambos.cuerpos + 1);
    assert.ok(pl.conflictos([otro], bod).size === 1 || !pl.rackDentro(otro, bod, 0.1), `${tipo}: uno más ya no cabe dejando 10 cm`);
    const filas = k.maxBloque(ambos, { largo: 1, profundidad: 1, pasillo: tipo === 'AR' ? 1 : null }, 'profundidad', [ambos], bod);
    console.log(`${tipo}${doble ? ' doble' : ''}: 1 → ${ambos.cuerpos} ${tipo === 'DI' ? 'calles' : 'cuerpos'}, ${filas} filas hasta el muro`);
    assert.ok(filas >= (tipo === 'DI' || doble ? 1 : 2));   // el doble necesita pasillo por los dos lados, también contra el muro
  }
}
// Un rack en el camino corta el alargue; un pilar dentro de un doble no
{
  const uno = pl.normalizar({ id: 'u', tipo: 'RS', cuerpos: 1, niveles: 3, doble: true, rot: 0, x: 5, y: 10 });
  const tope = pl.normalizar({ id: 't', tipo: 'RS', cuerpos: 2, niveles: 3, doble: true, rot: 0, x: 20, y: 10 });
  const largo = k.alargarHastaMuro(uno, [uno, tope], bod, 1);
  assert.ok(pl.rectangulo(largo).x0 + pl.rectangulo(largo).ancho <= pl.rectangulo(tope).x0 + 1e-6);
  const qu = pl.rectangulo(uno);
  const conPilar = { ...bod, elementos: [{ id: 'p', clase: 'pilar', x: 12, y: qu.y0 + 0.4, ancho: 0.4, alto: 0.4 }] };
  assert.ok(pl.rectangulo(k.alargarHastaMuro(uno, [uno], conPilar, 1)).x0 + pl.rectangulo(k.alargarHastaMuro(uno, [uno], conPilar, 1)).ancho > 12.2, 'pilar dentro del doble no corta');
}
// Recién girado contra un muro (pegado a menos de 10 cm): igual se alarga a lo largo, sin salir de la bodega
{
  const uno = pl.normalizar({ id: 'g', tipo: 'RS', cuerpos: 1, niveles: 3, doble: true, rot: 90, x: 0, y: 6 });
  const pegado = { ...uno, x: +(pl.rectangulo(uno).ancho / 2 + 0.02).toFixed(3) };
  const largo = k.alargarHastaMuro(pegado, [pegado], bod, 1);
  assert.ok(largo.cuerpos > 3, 'girado contra el muro también se alarga');
  assert.ok(pl.rackDentro(largo, bod, 0));
}
// Flechas de filas: con `sentido` las filas van solo hacia ese lado
{
  const uno = pl.normalizar({ id: 's', tipo: 'RS', cuerpos: 2, niveles: 3, doble: true, rot: 0, x: 10, y: 15 });
  const abajo = k.previaBloque(uno, { largo: 1, profundidad: 3, sentido: 1 }, [uno], bod);
  const arriba = k.previaBloque(uno, { largo: 1, profundidad: 3, sentido: -1 }, [uno], bod);
  assert.ok(abajo.every((c) => c.rack.y > uno.y) && arriba.every((c) => c.rack.y < uno.y), 'sentido de las filas');
}
// Arrastrar más allá del muro: el lineal se corta 10 cm antes (no queda dentro de la muralla), en los 4 sentidos
for (const tipo of ['RS', 'AR']) {
  const base = pl.normalizar({ id: 'p', tipo, cuerpos: 1, niveles: 3, doble: false, rot: 0, x: 0, y: 0 });
  for (const [a, b] of [[{ x: 5, y: 10 }, { x: 5, y: 45 }], [{ x: 5, y: 10 }, { x: 5, y: -20 }], [{ x: 10, y: 5 }, { x: 60, y: 5 }], [{ x: 10, y: 5 }, { x: -30, y: 5 }]]) {
    const r = k.linealArrastrado(base, a, b, bod);
    assert.ok(pl.rackDentro(r, bod, 0.1 - 1e-6), `${tipo} ${JSON.stringify(b)}: dentro de la bodega`);
  }
}
console.log('desde un cuerpo: pruebas ok');
// Doble AR en el centro de una bodega angosta con simples en los dos muros: queda donde se arrastró (no se
// pega al muro de atrás del simple ni se monta encima)
{
  const bod5 = { ancho: 10, largo: 5, altura: 4, forma: null, elementos: [], grua: 'contrapeso' };
  const ar = { tipo: 'AR', cuerpos: 10, nivelesCarga: 4, bandeja: 0.6, frente: 0.92, doble: false };
  const s1 = pl.normalizar({ ...ar, id: 's1', rot: 180, x: 5, y: 0.402 }), s2 = pl.normalizar({ ...ar, id: 's2', rot: 0, x: 5, y: 4.6 });
  const d = k.linealArrastrado({ ...ar, cuerpos: 1, doble: true, dobleLineal: true }, { x: 1, y: 2.5 }, { x: 8, y: 2.5 }, bod5, [s1, s2]);
  assert.strictEqual(d.y, 2.5, 'doble AR donde se arrastró');
  assert.deepStrictEqual([...pl.conflictos([s1, s2, { ...d, id: 'd' }], bod5)], [], 'doble AR sin superponerse');
  // Arrastrado pegado a un simple: se corre lo justo para no pisarlo
  const p = k.linealArrastrado({ ...ar, cuerpos: 1, doble: true, dobleLineal: true }, { x: 1, y: 1.2 }, { x: 8, y: 1.2 }, bod5, [s1, s2]);
  assert.deepStrictEqual([...pl.conflictos([s1, s2, { ...p, id: 'p' }], bod5)], [], 'junto al simple sin superponerse');
}
console.log('doble entre racks: pruebas ok');
