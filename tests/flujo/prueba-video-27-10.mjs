// Hallazgos del video del dueño (27-10): cota del rack a la oficina, paso lateral por la cabecera, túnel
// recomendado por metros de fila y posiciones sin pallet donde cae un pilar (node tests/flujo/prueba-video-27-10.mjs "$PWD")
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const pl = await import(b + '/lib/rack3d/planificador.js');
const ru = await import(b + '/lib/rack3d/rutas.js');
const al = await import(b + '/lib/flujo/alinear.js');
const { DISTANCIAS } = await import(b + '/lib/rack3d/parametrosTecnicos.js');

const rack = (o = {}) => pl.normalizar({ id: 'a', tipo: 'RS', cuerpos: 5, niveles: 3, doble: false, rot: 0, x: 15, y: 10, ...o });
const q = (r) => { const p = pl.rectangulo(r); return { x0: p.x0, y0: p.y0, x1: p.x0 + p.ancho, y1: p.y0 + p.alto }; };

// Cota a la oficina: la oficina a 2 m de la cabecera derecha corta la cota (antes medía hasta el muro)
{
  const r = rack(), c = q(r);
  const bod = { ancho: 30, largo: 20, forma: null, grua: 'contrapeso', elementos: [{ id: 'o', clase: 'oficina', x: c.x1 + 2 + 1.5, y: 10, ancho: 3, alto: 3 }] };
  const cs = pl.cotasRack(r, [r], bod);
  const der = cs.find((x) => x.x2 > x.x1 && x.y1 === x.y2);
  assert.equal(der.a, 'elemento'); assert.equal(der.hasta, 'la oficina'); assert.ok(Math.abs(der.valor - 2) < 1e-6);
  // Rack horizontal: las cotas a izquierda y derecha son cabeceras (laterales); arriba y abajo no
  assert.ok(cs.filter((x) => x.y1 === x.y2).every((x) => x.lateral));
  assert.ok(cs.filter((x) => x.x1 === x.x2).every((x) => !x.lateral));
  // Girado 90°: al revés
  const v = rack({ rot: 90 });
  const cv = pl.cotasRack(v, [v], { ...bod, elementos: [] });
  assert.ok(cv.filter((x) => x.x1 === x.x2).every((x) => x.lateral) && cv.filter((x) => x.y1 === x.y2).every((x) => !x.lateral));
}

// Paso lateral: la grúa cargada necesita su ancho (o el del pallet) más la holgura por lado. El ejemplo del
// video (quedan 1,5 m entre muro y marco): una grúa horquilla no pasa (pide 1,75 m)
{
  const paso = al.pasoCirculacion(rack(), { grua: 'contrapeso' });
  assert.ok(paso > 1.5 && paso <= 1.8, `paso de circulación razonable: ${paso}`);
  const frente = pl.medidasRack(rack()).pallet.frente;
  assert.ok(paso >= frente + 2 * DISTANCIAS.holguraCirculacion.valor - 1e-6, 'al menos el frente del pallet con su holgura');
}

// Túnel recomendado: fila de 12 cuerpos (~27 m) sí, en el cuerpo del medio; fila de 4 no; DI nunca
{
  const largo = rack({ cuerpos: 12, doble: true });
  const t = ru.tunelRecomendado(largo, 'contrapeso');
  assert.ok(t && t.largo >= DISTANCIAS.filaTunel.valor && t.cuerpo === 5 && t.cabeGrua);
  assert.equal(ru.tunelRecomendado(rack({ cuerpos: 4 }), 'contrapeso'), null);
  assert.equal(ru.tunelRecomendado({ ...largo, tipo: 'DI' }, 'contrapeso'), null);
  assert.equal(ru.tunelRecomendado({ ...largo, tunel: { cuerpo: 2, altoLibre: 3.5 } }, 'contrapeso'), null, 'ya tiene túnel');
  // Marco de 1 nivel bajo: la grúa no cabe por debajo (solo serviría para personas)
  const bajo = rack({ cuerpos: 12, niveles: 1, alto: 2.4 });
  const tb = ru.tunelRecomendado(bajo, 'contrapeso');
  if (tb) assert.equal(typeof tb.cabeGrua, 'boolean');
}

// Pilar dentro del rack: los huecos dicen fila, cuerpo y posición (el 3D los deja sin pallet)
{
  const r = rack({ doble: true }), c = q(r), viga = pl.medidasRack(r).viga;
  const bod = { ancho: 30, largo: 20, forma: null, elementos: [{ id: 'p', clase: 'pilar', x: c.x0 + 2 * viga + 0.6, y: c.y0 + 0.5, ancho: 0.4, alto: 0.4 }] };
  const h = pl.perdidasPorPilares(r, bod).huecos;
  assert.equal(h.length, 1);
  assert.deepEqual([h[0].fila, h[0].cuerpo], [0, 2]);
  assert.ok(h[0].pos === 0 || h[0].pos === 1);
}
// Drive-in con un pilar dentro: no es choque; esa calle pierde del pilar hacia el fondo, en todos los niveles
{
  const k = await import(b + '/lib/flujo/calculos.js');
  const di = pl.normalizar({ id: 'd', tipo: 'DI', cuerpos: 4, niveles: 3, rot: 0, x: 15, y: 10 });
  const m = pl.medidasRack(di), c = q(di), niveles = m.cartelasY.length + 1;
  // Pilar en la calle 2 (índice 1), en el tercer fondo (índice 2)
  const bod = { ancho: 30, largo: 20, forma: null, elementos: [{ id: 'p', clase: 'pilar', x: c.x0 + 0.05 + 1.5 * m.anchoCalle, y: c.y0 + 2.5 * m.moduloFondo, ancho: 0.3, alto: 0.3 }] };
  assert.equal(pl.conflictos([di], bod).size, 0, 'drive-in sobre pilar no es choque');
  const info = pl.perdidasPorPilares(di, bod);
  assert.equal(info.huecos.length, 1); assert.equal(info.huecos[0].cuerpo, 1);
  const desde = info.huecos[0].pos;
  assert.ok(desde === 1 || desde === 2, `primer fondo perdido ${desde}`);
  assert.equal(info.perdidas, (m.fondos - desde) * niveles);
  const total = k.conteoRack(di).posiciones;
  assert.equal(k.conteoRack(k.conPilares([di], bod)[0]).posiciones, total - info.perdidas);

  // Ángulo ranurado: el módulo donde cae el pilar no se arma (sus cajas y bandejas no cuentan)
  const ar = { ...pl.normalizar({ id: 'e', tipo: 'AR', cuerpos: 5, niveles: 5, rot: 0, x: 15, y: 10 }), cajasNivel: 6 };
  const ma = pl.medidasRack(ar), ca = q(ar);
  const bodA = { ancho: 30, largo: 20, forma: null, elementos: [{ id: 'p', clase: 'pilar', x: ca.x0 + 2.5 * ma.frenteExt, y: ca.y0 + ma.fondoExt / 2, ancho: 0.2, alto: 0.2 }] };
  assert.equal(pl.conflictos([ar], bodA).size, 0, 'ángulo sobre pilar no es choque');
  const ia = pl.perdidasPorPilares(ar, bodA);
  assert.equal(ia.huecos.length, 1); assert.equal(ia.huecos[0].cuerpo, 2);
  const nCarga = ma.nivelesCarga ?? ma.nivelesY.length;
  assert.equal(ia.perdidas, nCarga * 6);
  const antes = k.conteoRack(ar), despues = k.conteoRack(k.conPilares([ar], bodA)[0]);
  assert.equal(despues.cajas, antes.cajas - nCarga * 6);
  assert.equal(antes.bandejas - despues.bandejas, ma.nivelesY.length, 'el módulo perdido no lleva bandejas');
}
console.log('video 27-10: pruebas ok');
