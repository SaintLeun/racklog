// Esquina en 90° (dueño 28-10): dos racks de perímetro que se juntan en ángulo recto cierran esa punta; la grúa
// no pasa por ahí, así que no es un pasillo angosto. El resto de la cara sí lleva su pasillo.
// node tests/flujo/prueba-esquina-90.mjs "$PWD"
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const pl = await import(b + '/lib/rack3d/planificador.js');
const { pasillos } = await import(b + '/lib/rack3d/pasillos.js');
const bod = { ancho: 30, largo: 20, forma: null, elementos: [], grua: 'contrapeso' };
const pegar = (r, x0, y0) => { const q = pl.rectangulo(r); return { ...r, x: +(x0 + q.ancho / 2).toFixed(3), y: +(y0 + q.alto / 2).toFixed(3) }; };
// Muro de arriba: simple que carga hacia abajo; muro izquierdo: simple que carga a la derecha, empieza bajo el otro
const arriba = pl.normalizar({ id: 'A', tipo: 'RS', cuerpos: 8, niveles: 3, doble: false, rot: 180, x: 0, y: 0 });
const A = pegar(arriba, 0.1, 0.1), qa = pl.rectangulo(A);
for (const hueco of [0, 1, 2]) {
  const izq = pl.normalizar({ id: 'B', tipo: 'RS', cuerpos: 5, niveles: 3, doble: false, rot: 90, x: 0, y: 0 });
  const B = pegar(izq, 0.1, qa.y0 + qa.alto + hueco);
  const lista = pasillos([A, B], bod);
  assert.equal(lista.filter((p) => !p.ok).length, 0, `esquina con ${hueco} m: ningún pasillo angosto`);
  // A sigue teniendo su pasillo hacia abajo, en la parte que B no tapa
  const deA = lista.find((p) => p.racks.includes('A'));
  assert.ok(deA && deA.libre > 10, `A conserva su pasillo (hueco ${hueco} m)`);
}
// Al revés: B ocupa la esquina y A empieza a su derecha, con la punta frente a la cara de B
{
  const izq = pl.normalizar({ id: 'B', tipo: 'RS', cuerpos: 8, niveles: 3, doble: false, rot: 90, x: 0, y: 0 });
  const B = pegar(izq, 0.1, 0.1), qb = pl.rectangulo(B);
  const A2 = pegar(arriba, qb.x0 + qb.ancho + 1.5, 0.1);
  const lista = pasillos([A2, B], bod);
  assert.equal(lista.filter((p) => !p.ok).length, 0, 'punta frente a la cara: no es pasillo angosto');
}
// Dos filas paralelas a 1,5 m siguen siendo un pasillo angosto
{
  const r1 = pegar(pl.normalizar({ id: 'R1', tipo: 'RS', cuerpos: 6, niveles: 3, doble: false, rot: 180, x: 0, y: 0 }), 5, 0.1);
  const q1 = pl.rectangulo(r1);
  const r2 = pegar(pl.normalizar({ id: 'R2', tipo: 'RS', cuerpos: 6, niveles: 3, doble: false, rot: 0, x: 0, y: 0 }), 5, q1.y0 + q1.alto + 1.5);
  assert.equal(pasillos([r1, r2], bod).filter((p) => !p.ok).length, 1, 'paralelas angostas siguen en rojo');
}
console.log('esquina 90: pruebas ok');
