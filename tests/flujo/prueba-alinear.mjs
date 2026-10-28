// Alinear el layout (dueño 26-10): imán, ordenar pasillos y pasillos sin salida
// node tests/flujo/prueba-alinear.mjs
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const A = await import(b + '/lib/flujo/alinear.js');
const pl = await import(b + '/lib/rack3d/planificador.js');
const pa = await import(b + '/lib/rack3d/pasillos.js');
const bod = { ancho: 30, largo: 40, forma: null, grua: 'contrapeso', elementos: [] };
const P = pa.pasilloRequerido({ tipo: 'RS' }, bod);
const R = (id, o) => pl.normalizar({ id, tipo: 'RS', cuerpos: 6, niveles: 3, doble: false, rot: 0, x: 15, y: 10, ...o });
const q = (r) => { const t = pl.rectangulo(r); return { x0: t.x0, y0: t.y0, x1: t.x0 + t.ancho, y1: t.y0 + t.alto }; };
const cerca = (a, b, t = 0.02) => Math.abs(a - b) < t;

// Imán: cerca del muro de arriba queda a 10 cm; cerca de otro rack, al pasillo exacto y alineado
{
  const r = R('a', { rot: 180 });
  const h = pl.rectangulo(r).alto;
  const m = A.imanRack(r, [r], bod, 5.2, h / 2 + 0.3);
  assert.ok(cerca(m.y - h / 2, 0.1), `muro: ${m.y - h / 2}`);
  const base = R('b', { rot: 0, x: 10, y: 20 }), qb = q(base);
  const mov = R('c', { rot: 0 });
  const hm = pl.rectangulo(mov).alto, wm = pl.rectangulo(mov).ancho;
  // Propuesto: un poco desalineado y a 3,3 m del frente de b (pasillo de 3,5 m)
  const m2 = A.imanRack(mov, [base, mov], bod, qb.x0 + wm / 2 + 0.25, qb.y0 - 3.3 - hm / 2);
  const qm = q({ ...mov, x: m2.x, y: m2.y });
  assert.ok(cerca(qm.x0, qb.x0), 'alinea el inicio');
  assert.ok(cerca(qb.y0 - qm.y1, P), `pasillo exacto: ${qb.y0 - qm.y1}`);
  assert.ok(m2.guias.length >= 2);
  // Guías tipo Figma: también el otro borde alineado (mismo largo: inicio y final)
  assert.ok(m2.guias.filter((g) => g.x1 === g.x2).length >= 2, 'inicio y final alineados');
  assert.deepEqual(A.guiasRack({ ...mov, x: m2.x, y: m2.y }, [base, mov]).length >= 2, true, 'guías desde la posición final');
  // Lejos de todo: no se mueve
  const m3 = A.imanRack(mov, [base, mov], bod, 20, 33);
  assert.equal(m3.x, 20); assert.equal(m3.y, 33);
}
// Ordenar pasillos: filas desordenadas quedan al pasillo exacto, la primera en el muro, inicios alineados
{
  const f1 = R('1', { rot: 180, x: 8.3, y: 1.2 });            // junto al muro de arriba, carga hacia abajo
  const f2 = R('2', { doble: true, x: 8.9, y: 7.4 });          // doble
  const f3 = R('3', { doble: true, x: 7.8, y: 13.9 });
  const o = A.ordenarPasillos([f1, f2, f3], bod);
  const [a, bb, c] = o.racks.map(q);
  assert.ok(cerca(a.y0, 0.1), 'primera al muro');
  assert.ok(cerca(bb.y0 - a.y1, P, 0.03) && cerca(c.y0 - bb.y1, P, 0.03), `pasillos ${bb.y0 - a.y1} ${c.y0 - bb.y1}`);
  assert.ok(cerca(a.x0, bb.x0) && cerca(bb.x0, c.x0), 'inicios alineados');
  assert.equal(pl.conflictos(o.racks, bod).size, 0);
  assert.equal(pa.pasillos(o.racks, bod).filter((p) => !p.ok).length, 0, 'sin pasillos angostos');
  // Dos simples espalda con espalda quedan juntos (10 cm), no con pasillo
  const s1 = R('s1', { rot: 0, x: 10, y: 10 }), s2 = R('s2', { rot: 180, x: 10, y: 12.5 });   // s1 frente arriba, s2 frente abajo: espaldas enfrentadas
  const o2 = A.ordenarPasillos([s1, s2], bod);
  const [e1, e2] = o2.racks.map(q);
  assert.ok(cerca(e2.y0 - e1.y1, 0.1, 0.03), `espalda con espalda ${e2.y0 - e1.y1}`);
  console.log('ordenar: ok,', o.movidos, 'movidos');
}
// Pasillo sin salida: dos filas de muro a muro con pasillo entre ellas → aviso; abrir conexión lo arregla.
// Regla del dueño 27-10: por la punta basta el paso de la grúa cargada (ancho o pallet + holgura), no el pasillo de trabajo
{
  const n = 8;
  const w = pl.rectangulo(pl.normalizar({ tipo: 'RS', cuerpos: n, niveles: 3, rot: 0 })).ancho;
  const filas = (punta) => {
    const bd = { ...bod, ancho: +(0.1 + w + punta).toFixed(2) };
    const a = R('a', { rot: 180, cuerpos: n, x: 0.1 + w / 2, y: 0.7 });
    const bq = R('b', { rot: 0, cuerpos: n, x: 0.1 + w / 2, y: q(a).y1 + P + 0.6 });
    return { bd, racks: [a, bq] };
  };
  const paso = A.pasoCirculacion(R('x', {}), bod);
  assert.ok(paso < P, `el paso por la punta (${paso}) es menor que el pasillo de trabajo (${P})`);
  const c1 = filas(1.5);
  const sin = A.pasillosSinSalida(c1.racks, c1.bd);
  assert.equal(sin.length, 1, 'con 1,5 m en la punta la grúa cargada no pasa: avisa');
  assert.ok(cerca(sin[0].puntas[1], 1.5, 0.05), `informa lo que queda en la punta: ${sin[0].puntas}`);
  const c2 = filas(paso + 0.1);
  assert.equal(A.pasillosSinSalida(c2.racks, c2.bd).length, 0, 'con el paso de la grúa en una punta no avisa, aunque sea menos que el pasillo de trabajo');
  const abierto = A.abrirConexion(c1.racks, c1.bd, sin[0].filas, sin[0].lado);
  assert.equal(A.pasillosSinSalida(abierto, c1.bd).length, 0, 'con la conexión ya tiene salida');
  console.log(`sin salida: paso por la punta ${paso} m (pasillo ${P} m); acortadas a ${abierto.map((r) => r.cuerpos).join(', ')}`);
}
// Doble contra el muro (dueño 27-10): sin equipo de doble profundidad va simple
{
  const C = await import(b + '/lib/flujo/calculos.js');
  const base = pl.normalizar({ tipo: 'RS', cuerpos: 1, niveles: 3, doble: true, dobleLineal: true, rot: 0, x: 0, y: 0 });
  const pegado = C.linealArrastrado(base, { x: 0.3, y: 0.3 }, { x: 10, y: 0.3 }, bod, []);
  assert.ok(A.dobleContraMuro(pegado, bod), 'doble pegado al muro: no sirve');
  assert.ok(!A.dobleContraMuro(C.conDoble(pegado, false), bod), 'pasado a simple queda bien, con la espalda al muro');
  assert.ok(!A.dobleContraMuro(C.linealArrastrado(base, { x: 0.3, y: 12 }, { x: 10, y: 12 }, bod, []), bod), 'doble al medio: bien');
  console.log('doble contra el muro: ok');
}
console.log('alinear: pruebas ok');
