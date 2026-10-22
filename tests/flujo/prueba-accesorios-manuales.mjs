// Accesorios puestos a mano (arrastrados al 3D en el paso 4): encaje, cantidades y que sigan a su rack
import assert from 'node:assert';
const raiz = process.argv[2] ?? process.cwd();
const A = await import(raiz + '/lib/rack3d/accesorios.js');
const { rectangulo } = await import(raiz + '/lib/rack3d/planificador.js');
const { textoAccesorios } = A;
let ok = 0;
const prueba = (nombre, fn) => { fn(); ok++; console.log(`ok - ${nombre}`); };

const bodega = { ancho: 40, largo: 30, altura: 10, forma: null, elementos: [], grua: 'contrapeso' };
const base = { tipo: 'RS', rot: 0, cuerpos: 4, niveles: 3, doble: true, modelo: 'm1' };
const alto = rectangulo({ ...base, id: 'x', x: 0, y: 0 }).alto;
const racks = [0, 1].map((k) => ({ ...base, id: `R${k + 1}`, x: 20, y: +(4 + alto / 2 + k * (alto + 3.6)).toFixed(2) }));
const datos = { bodega, racks, pallets: [] };
const lista = (aj) => A.aplicarAjustes(A.proponerAccesorios(datos), aj);
const de = (l, id) => l.find((a) => a.id === id);
let n = 0;
const guardar = (aj, r) => ({ ...aj, manuales: [...(aj.manuales ?? []), { id: `m${n++}`, ...r.manual }] });

prueba('sin manuales: igual que antes (aplicarAjustes no cambia cantidades)', () => {
  const l = lista({});
  const p = A.proponerAccesorios(datos);
  p.forEach((a) => assert.equal(de(l, a.id).cantidad, a.cantidad));
  assert.ok(de(l, 'canilleras').manuales === 0);
});

prueba('canillera: un punto ya ocupado por las automáticas no encaja en el mismo pilar', () => {
  const c = de(lista({}), 'canilleras');
  const k = c.marcas[0];
  const r = A.encajarAccesorio('canilleras', { x: k.x, y: k.y }, datos, {});
  // Encaja en otro pilar libre cercano (p. ej. interior de la fila doble) o no encaja, pero nunca encima
  if (r.ok) assert.ok(Math.hypot(r.marca.x - k.x, r.marca.y - k.y) > 0.04);
  else assert.equal(r.motivo, 'ocupado');
});

prueba('canillera: lejos de todo no encaja (rojo)', () => {
  const r = A.encajarAccesorio('canilleras', { x: 2, y: 28 }, datos, {});
  assert.equal(r.ok, false);
});

prueba('canilleras quitadas: al soltar en un pilar del pasillo encaja y la cantidad sube de 0 a 1 manual', () => {
  const aj = { quitados: ['canilleras'] };
  const k = de(lista({}), 'canilleras').marcas[0];
  const r = A.encajarAccesorio('canilleras', { x: k.x + 0.2, y: k.y + 0.1 }, datos, aj);
  assert.ok(r.ok);
  assert.deepEqual([r.marca.x, r.marca.y], [k.x, k.y]);
  const aj2 = guardar({ ...aj, quitados: [] }, r);
  const auto = de(lista({}), 'canilleras').cantidad;
  // Al volver a incluir, el punto ya esta ocupado por la automatica: el manual se suma igual (lo puso el cliente)
  assert.equal(de(lista(aj2), 'canilleras').cantidad, auto + 1);
});

prueba('canillera manual con transpaleta (el sistema no propone): suma 1 y aparece en el texto de Qué cotizar', () => {
  const dt = { ...datos, bodega: { ...bodega, grua: 'transpaleta' } };
  const lt = (aj) => A.aplicarAjustes(A.proponerAccesorios(dt), aj);
  assert.equal(de(lt({}), 'canilleras'), undefined);
  const q = rectangulo(racks[0]);
  const r = A.encajarAccesorio('canilleras', { x: q.x0 + 2.4, y: q.y0 - 0.2 }, dt, {});
  assert.ok(r.ok, `distancia ${r.distancia}`);
  const aj = guardar({}, r);
  const c = de(lt(aj), 'canilleras');
  assert.equal(c.cantidad, 1);
  assert.equal(c.manuales, 1);
  assert.equal(c.medida, '500 mm');
  assert.ok(c.marcas.some((m) => m.manual && m.manualId === aj.manuales[0].id));
  assert.match(textoAccesorios(lt(aj)), /1 canilleras|1 canillera/);
  // Con cantidad escrita a mano, el manual se suma a esa
  assert.equal(de(lt({ ...aj, cantidades: { canilleras: 10 } }), 'canilleras').cantidad, 11);
  // El mismo lugar ya no se ofrece
  const r2 = A.encajarAccesorio('canilleras', { x: r.marca.x, y: r.marca.y }, dt, aj);
  assert.ok(!r2.ok || Math.hypot(r2.marca.x - r.marca.x, r2.marca.y - r.marca.y) > 0.04);
  // Con grua, todos los pilares que dan al pasillo ya llevan: un manual cerca no encuentra lugar libre en el mismo pie
  assert.equal(de(lista(aj), 'canilleras').cantidad, de(lista({}), 'canilleras').cantidad + 1);
});

prueba('protección de bastidor: cabecera libre (las automáticas quitadas) encaja y suma con su medida', () => {
  const aj = { quitados: ['proteccionBastidor'] };
  const r1 = racks[0], q = rectangulo(r1);
  const r = A.encajarAccesorio('proteccionBastidor', { x: q.x0 - 0.3, y: r1.y }, datos, aj);
  assert.ok(r.ok);
  assert.equal(r.marca.tipo, 'barra');
  assert.equal(r.manual.rackId, 'R1');
  const aj2 = guardar(aj, r);
  const p = de(lista(aj2), 'proteccionBastidor');
  assert.equal(p.cantidad, de(lista({}), 'proteccionBastidor').cantidad + 1);   // quitada: no va al texto
  assert.equal(p.incluido, false);
  const p2 = de(lista({ ...aj2, quitados: [] }), 'proteccionBastidor');
  assert.equal(p2.cantidad, de(lista({}), 'proteccionBastidor').cantidad + 1);
  assert.match(p2.medida, /2\.300 mm/);
});

prueba('baranda manual delante de una cabecera: suma sus metros aunque el sistema no proponga baranda', () => {
  assert.equal(de(lista({}), 'barandas'), undefined);
  const q = rectangulo(racks[1]);
  const r = A.encajarAccesorio('barandas', { x: q.x0 + q.ancho + 0.7, y: racks[1].y }, datos, {});
  assert.ok(r.ok);
  const aj = guardar({}, r);
  const b = de(lista(aj), 'barandas');
  assert.ok(b && b.unidad === 'm' && Math.abs(b.cantidad - q.alto) < 0.11, `baranda ${b?.cantidad} vs ${q.alto}`);
  assert.match(textoAccesorios(lista(aj)), /m de baranda/);
});

prueba('baranda en pasillo peatonal quitada: tramo de 2 m centrado donde se suelta', () => {
  const b2 = { ...bodega, elementos: [{ id: 'p', clase: 'pasilloPeatonal', x: 5, y: 15, ancho: 1.2, alto: 20 }] };
  const d2 = { bodega: b2, racks, pallets: [] };
  const r = A.encajarAccesorio('barandas', { x: 4.3, y: 12 }, d2, { quitados: ['barandas'] });
  assert.ok(r.ok);
  assert.equal(r.manual.rackId, null);
  const L = Math.hypot(r.marca.x2 - r.marca.x1, r.marca.y2 - r.marca.y1);
  assert.ok(Math.abs(L - 2) < 0.02);
});

const dt = { ...datos, bodega: { ...bodega, grua: 'transpaleta' } };
const q0 = rectangulo(racks[0]);
const pie = { x: q0.x0 + 2.4, y: q0.y0 - 0.2 };
prueba('el manual sigue a su rack si se mueve, y por modelo y orden si cambia el id (paso 4 estimado → paso 5)', () => {
  const r = A.encajarAccesorio('canilleras', pie, dt, {});
  const m = { id: 'z', ...r.manual };
  const movidos = racks.map((x) => (x.id === 'R1' ? { ...x, x: x.x + 3 } : x));
  const k = A.resolverManual(m, movidos);
  assert.ok(Math.abs(k.x - (r.marca.x + 3)) < 0.01 && Math.abs(k.y - r.marca.y) < 0.01);
  const renombrados = racks.map((x, i) => ({ ...x, id: `nuevo${i}` }));
  const k2 = A.resolverManual(m, renombrados);
  assert.deepEqual([k2.x, k2.y], [r.marca.x, r.marca.y]);
  // Sin su rack ni otro del modelo: se descarta (no suma)
  assert.equal(A.resolverManual(m, []), null);
  const l = A.aplicarAjustes(A.proponerAccesorios({ bodega, racks: [], pallets: [] }), { manuales: [m] });
  assert.equal(de(l, 'canilleras'), undefined);
});

prueba('quitar un manual: manualCerca lo encuentra y al sacarlo vuelve la cantidad', () => {
  const r = A.encajarAccesorio('canilleras', pie, dt, {});
  const aj = guardar({}, r);
  const c = A.manualCerca({ x: r.marca.x + 0.1, y: r.marca.y }, aj.manuales, racks);
  assert.equal(c.manual.id, aj.manuales[0].id);
  const sin = { ...aj, manuales: aj.manuales.filter((x) => x.id !== c.manual.id) };
  assert.equal(de(lista(sin), 'canilleras').cantidad, de(lista({}), 'canilleras').cantidad);
});

prueba('estados guardados antiguos (sin manuales) y manuales corruptos no rompen', () => {
  assert.doesNotThrow(() => lista({ quitados: [], cantidades: {} }));
  assert.doesNotThrow(() => lista({ manuales: [null, { tipo: 'otro' }, { tipo: 'canilleras' }] }));
});

console.log(`${ok} pruebas ok`);
