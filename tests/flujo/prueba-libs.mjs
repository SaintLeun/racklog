// node prueba-libs.mjs /workspaces/racklog
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const raiz = process.argv[2] || '/workspaces/racklog';
const lib = (f) => import(pathToFileURL(path.join(raiz, 'lib/rack3d', f)).href);
const A = await lib('accesorios.js');
const V = await lib('viabilidad.js');
const { llenarBodega } = await lib('operacion.js');
const { rectangulo } = await lib('planificador.js');

const mensajes = [];
const ver = (titulo, lista) => { mensajes.push(`\n# ${titulo}`); lista.forEach((a) => mensajes.push(`  [${a.nivel}] ${a.mensaje} → "${a.comoArreglar}" ${JSON.stringify(a.arreglo)}`)); };
const aplicar = (d, arreglo) => V.aplicarArreglo(d, arreglo);
let ok = 0;
const prueba = (nombre, fn) => { fn(); ok++; console.log(`ok - ${nombre}`); };

// Bodega grande sin elementos; 3 filas con pasillo de 3,6 m entre ellas y cabeceras libres
const bodega = { ancho: 40, largo: 30, altura: 10, forma: null, elementos: [], grua: 'contrapeso' };
function filasRack(doble) {
  const base = { tipo: 'RS', rot: 0, cuerpos: 4, niveles: 3, doble };
  const alto = rectangulo({ ...base, id: 'x', x: 0, y: 0 }).alto;
  return [0, 1, 2].map((k) => ({ ...base, id: `R${k + 1}`, x: 20, y: +(4 + alto / 2 + k * (alto + 3.6)).toFixed(2) }));
}

prueba('doble 3 filas: 6 protecciones de 2.300 mm (una por cabecera: 2 × 1.000 + separador 300)', () => {
  const lista = A.proponerAccesorios({ bodega, racks: filasRack(true), pallets: [] });
  const p = lista.find((a) => a.id === 'proteccionBastidor');
  assert.equal(p.cantidad, 6);
  assert.equal(p.medida, '2.300 mm');
  assert.equal(p.marcas.filter((x) => x.tipo === 'barra').length, 6);
  const c = lista.find((a) => a.id === 'canilleras');
  assert.ok(c.cantidad > 0 && c.marcas.every((x) => x.tipo === 'punto'));
  // Canillera: 500 mm por defecto, 1.000 mm si el cliente la elige; lo recomendado parte incluido
  assert.equal(c.medida, '500 mm');
  const ajustada = A.aplicarAjustes(lista, { medidas: { canilleras: 1 } });
  assert.equal(ajustada.find((a) => a.id === 'canilleras').medida, '1.000 mm');
  assert.ok(A.aplicarAjustes(lista).filter((a) => a.obligatorio).every((a) => a.incluido));
  mensajes.push(`\n# Accesorios doble 3 filas\n  ${A.textoAccesorios(A.aplicarAjustes(lista))}`);
  lista.forEach((a) => mensajes.push(`  - ${a.nombre}: ${a.cantidad} ${a.unidad} · ${a.medida} · ${a.motivo}`));
});

prueba('simple: protección de fondo del marco (1.000 mm)', () => {
  const lista = A.proponerAccesorios({ bodega, racks: filasRack(false), pallets: [] });
  const p = lista.find((a) => a.id === 'proteccionBastidor');
  assert.equal(p.medida, '1.000 mm');
  assert.equal(p.cantidad, 6);
  mensajes.push(`\n# Accesorios simple 3 filas\n  ${A.textoAccesorios(A.aplicarAjustes(lista))}`);
});

prueba('cabecera contra el muro: sin protección en ese lado', () => {
  const r = { tipo: 'RS', rot: 0, cuerpos: 4, niveles: 3, doble: false, id: 'M' };
  const p = rectangulo({ ...r, x: 0, y: 0 });
  const racks = [{ ...r, x: +(0.1 + p.ancho / 2).toFixed(2), y: 10 }];
  const prot = A.proponerAccesorios({ bodega, racks }).find((a) => a.id === 'proteccionBastidor');
  assert.equal(prot.cantidad, 1);
});

prueba('pasillo peatonal de 20 m: 40 m de baranda', () => {
  const b = { ...bodega, elementos: [{ id: 'p1', clase: 'pasilloPeatonal', x: 5, y: 15, ancho: 1.2, alto: 20 }] };
  const lista = A.proponerAccesorios({ bodega: b, racks: [] });
  const br = lista.find((a) => a.id === 'barandas');
  assert.equal(br.cantidad, 40); assert.equal(br.detallePiezas, "6 módulos de 6 m + 2 ajustes de 2 m");
  assert.equal(br.alto, 1); assert.match(br.resumen, /^40 m — módulos y ajustes los confirma Técnica Racklog/);
  assert.equal(br.modulos, 6);
  assert.equal(br.marcas.filter((x) => x.tipo === 'linea').length, 8);
  // Quitada no sale en el texto; con cantidad cambiada se respeta
  assert.equal(A.textoAccesorios(A.aplicarAjustes(lista, { quitados: ['barandas'] })), '');
  assert.equal(A.aplicarAjustes(lista, { cantidades: { barandas: 30 } })[0].cantidad, 30);
  mensajes.push(`\n# Baranda 20 m\n  ${A.textoAccesorios(A.aplicarAjustes(lista))}`);
  // Con un cruce de pasillo de grúa de 3,5 m: se corta en los dos lados
  const b2 = { ...b, elementos: [...b.elementos, { id: 'g', clase: 'pasilloGrua', x: 10, y: 15, ancho: 20, alto: 3.5 }] };
  const br2 = A.proponerAccesorios({ bodega: b2, racks: [] }).find((a) => a.id === 'barandas');
  mensajes.push(`  con cruce: ${br2.cantidad} m, ${br2.marcas.length} tramos · ${br2.motivo}`);
  assert.ok(br2.cantidad <= 40 && br2.marcas.length >= 4);
});

prueba('planos y separadores fijos, sin placa de capacidad', () => {
  const pallets = [{ id: 'a', nombre: 'Cajas', frente: 1, fondo: 0.8, alto: 1.2, peso: 500, cantidad: 10, rotacion: 'media', sinPallet: true }];
  const racks = [{ id: 'R1', tipo: 'RS', rot: 0, x: 20, y: 10, cuerpos: 4, niveles: 3, doble: true, mezcla: [null, 'a', null, null] }];
  const lista = A.proponerAccesorios({ bodega, racks, pallets });
  const pl = lista.find((a) => a.id === 'planosCarga');
  assert.equal(pl.cantidad, 8);       // 4 cuerpos × 2 filas en el nivel 1
  assert.equal(lista.find((a) => a.id === 'separadores').cantidad, 10);   // 5 marcos × 2
  assert.ok(!lista.find((a) => a.id === 'placaCapacidad'));   // Racklog no la vende
  // El separador no se puede quitar: va siempre en racks dobles
  assert.ok(A.aplicarAjustes(lista, { quitados: ['separadores'] }).find((a) => a.id === 'separadores').incluido);
  assert.ok(!lista.find((a) => a.id === 'topes'));   // sin pallet: no lleva topes
  const v = V.revisarDiseno({ bodega, racks, pallets });
  const bl = v.find((a) => a.regla === 'planos');
  assert.equal(bl.nivel, 'bloquea');
  ver('Planos de carga', [bl]);
  const d = aplicar({ bodega, racks }, bl.arreglo);
  assert.ok(!V.revisarDiseno({ bodega, racks: d.racks, pallets }).some((a) => a.regla === 'planos'));
});

prueba('techo: bloquea y el arreglo de niveles lo resuelve', () => {
  const b = { ...bodega, altura: 6 };
  const racks = [{ id: 'R1', tipo: 'RS', rot: 0, x: 20, y: 10, cuerpos: 4, niveles: 6, doble: true }];
  const v = V.revisarDiseno({ bodega: b, racks });
  const t = v.find((a) => a.regla === 'techo');
  assert.equal(t.nivel, 'bloquea');
  assert.equal(t.arreglo.tipo, 'rack');
  ver('Techo', v);
  const d = aplicar({ bodega: b, racks }, t.arreglo);
  const v2 = V.revisarDiseno({ bodega: b, racks: d.racks });
  assert.ok(!v2.some((a) => a.regla === 'techo' || a.regla === 'levante'));
  assert.ok(V.resumenViabilidad(v2).viable, JSON.stringify(v2));
});

prueba('pasillo angosto: bloquea y mover lo resuelve', () => {
  const base = { tipo: 'RS', rot: 0, cuerpos: 4, niveles: 3, doble: true };
  const alto = rectangulo({ ...base, id: 'x', x: 0, y: 0 }).alto;
  // Primera fila de espalda pegada al muro (simple, frente abajo) y una doble a 2 m
  const s = { ...base, doble: false, rot: 180 };
  const altoS = rectangulo({ ...s, id: 'x', x: 0, y: 0 }).alto;
  const racks = [
    { ...s, id: 'A', x: 20, y: +(0.1 + altoS / 2).toFixed(2) },
    { ...base, id: 'B', x: 20, y: +(0.1 + altoS + 2 + alto / 2).toFixed(2) },
  ];
  const b = { ...bodega, altura: 0 };
  const v = V.revisarDiseno({ bodega: b, racks });
  ver('Pasillo angosto', v);
  const p = v.find((a) => a.regla === 'pasillo' && a.nivel === 'bloquea');
  assert.ok(p && p.arreglo && p.arreglo.tipo === 'rack' && 'y' in p.arreglo.cambio);
  const d = aplicar({ bodega: b, racks }, p.arreglo);
  const v2 = V.revisarDiseno({ bodega: b, racks: d.racks });
  assert.ok(!v2.some((a) => a.regla === 'pasillo'), JSON.stringify(v2));
  assert.equal(V.resumenViabilidad(v2).bloquea, 0);
});

prueba('sobrante 1,2 m bloquea', () => {
  const racks = [{ id: 'R1', tipo: 'RS', rot: 0, x: 20, y: 10, cuerpos: 4, niveles: 3, doble: true, sobrante: 1.2 }];
  const v = V.revisarDiseno({ bodega, racks });
  const s = v.find((a) => a.regla === 'sobrante');
  assert.equal(s.nivel, 'bloquea');
  assert.deepEqual(s.arreglo.cambio, { sobrante: 1 });
  ver('Sobrante', [s]);
});

prueba('diseño de llenarBodega 24×16×8 contrapeso: viable', () => {
  const b = { ancho: 24, largo: 16, altura: 8, forma: null, elementos: [], grua: 'contrapeso' };
  let n = 0;
  const racks = llenarBodega(b, 'RS', () => `L${++n}`);
  assert.ok(racks.length > 0);
  const v = V.revisarDiseno({ bodega: b, racks, pallets: [] });
  ver(`llenarBodega (${racks.length} racks)`, v);
  const r = V.resumenViabilidad(v);
  assert.equal(r.bloquea, 0, JSON.stringify(v, null, 1));
  assert.ok(r.viable);
  const acc = A.proponerAccesorios({ bodega: b, racks });
  mensajes.push(`  accesorios: ${A.textoAccesorios(A.aplicarAjustes(acc))}`);
  // Cliente quita protecciones y canilleras → advierte con arreglo accesorio
  const v2 = V.revisarDiseno({ bodega: b, racks, accesorios: { quitados: ['proteccionBastidor', 'canilleras'] } });
  ver('Accesorios quitados', v2.filter((a) => a.regla === 'accesorio'));
  assert.ok(v2.filter((a) => a.regla === 'accesorio').every((a) => a.nivel === 'advierte' && a.arreglo.tipo === 'accesorio'));
  assert.ok(V.resumenViabilidad(v2).viable);
});

prueba('otras reglas: carga, levante, choque, peatonal, ángulo, drive-in, túnel', () => {
  const pallets = [
    { id: 'p', nombre: 'Pesado', frente: 1, fondo: 1.2, alto: 1.2, peso: 1200, cantidad: 10, rotacion: 'media' },
    { id: 'q', nombre: 'Alto', frente: 1, fondo: 1.2, alto: 1.7, peso: 600, cantidad: 10, rotacion: 'baja' },
  ];
  const b = { ...bodega, grua: 'apiladora', pesoBandeja: 300, elementos: [
    { id: 'pil', clase: 'pilar', x: 30, y: 25, ancho: 0.4, alto: 0.4 },
    { id: 'pp', clase: 'pasilloPeatonal', x: 2, y: 15, ancho: 1, alto: 20 },
  ] };
  const racks = [
    { id: 'C', tipo: 'RS', rot: 0, x: 15, y: 10, cuerpos: 3, niveles: 4, doble: true, mezcla: ['p', 'p', 'p', 'p', 'p'] },
    { id: 'P', tipo: 'RS', rot: 0, x: 30, y: 25, cuerpos: 2, niveles: 2, doble: false },
    { id: 'D', tipo: 'DI', rot: 0, x: 25, y: 5, cuerpos: 3, fondos: 4, niveles: 3, mezcla: ['p', 'q', 'p'] },
    { id: 'T', tipo: 'RS', rot: 0, x: 10, y: 22, cuerpos: 4, niveles: 3, doble: true, tunel: { cuerpo: 1, altoLibre: 1.0 } },
    { id: 'AR1', tipo: 'AR', rot: 0, x: 35, y: 15, cuerpos: 3, niveles: 5 },
  ];
  const v = V.revisarDiseno({ bodega: b, racks, pallets, accesorios: { quitados: [] } });
  ver('Varias reglas', v);
  const regla = (x) => v.filter((a) => a.regla === x);
  assert.ok(regla('carga')[0]?.arreglo?.cambio?.porViga === 1);
  assert.ok(regla('levante').length >= 1);
  // Dueño 26 y 27-10: un selectivo (simple o doble) puede pasar sobre un pilar (pierde esas posiciones), no choca
  assert.ok(!regla('choque').some((a) => a.ids.includes('P')));
  const v2 = V.revisarDiseno({ bodega: b, racks: racks.map((r) => (r.id === 'P' ? { ...r, doble: true } : r)), pallets, accesorios: { quitados: [] } });
  assert.ok(!v2.some((a) => a.regla === 'choque' && a.ids.includes('P')));
  // Ángulo ranurado sobre el pilar: sigue siendo choque
  const v3 = V.revisarDiseno({ bodega: b, racks: racks.map((r) => (r.id === 'P' ? { ...r, tipo: 'AR', niveles: 4 } : r)), pallets, accesorios: { quitados: [] } });
  assert.ok(v3.some((a) => a.regla === 'choque' && a.ids.includes('P')));
  assert.ok(regla('peatonal').length === 1);
  assert.ok(regla('bandeja')[0].nivel === 'bloquea' && regla('escalera')[0].nivel === 'advierte');
  assert.ok(regla('altoDriveIn')[0].nivel === 'bloquea' && regla('gruaDriveIn')[0].nivel === 'advierte');
  const t = regla('tunel')[0];
  assert.ok(t.nivel === 'bloquea' && t.arreglo);
  const d = aplicar({ bodega: b, racks }, t.arreglo);
  assert.ok(!V.revisarDiseno({ bodega: b, racks: d.racks, pallets }).some((a) => a.regla === 'tunel'));
  // Ids estables
  assert.deepEqual(v.map((a) => a.id), V.revisarDiseno({ bodega: b, racks, pallets }).map((a) => a.id));
});

prueba('rack sobre pasillo peatonal y baranda quitada junto a pasillo de grúa', () => {
  const b = { ...bodega, elementos: [
    { id: 'pp', clase: 'pasilloPeatonal', x: 10, y: 15, ancho: 1.2, alto: 20 },
    { id: 'pg', clase: 'pasilloGrua', x: 12.35, y: 15, ancho: 3.5, alto: 20 },
  ] };
  const racks = [{ id: 'R1', tipo: 'RS', rot: 0, x: 10, y: 15, cuerpos: 2, niveles: 2, doble: false }];
  const v = V.revisarDiseno({ bodega: b, racks, accesorios: A.aplicarAjustes(A.proponerAccesorios({ bodega: b, racks }), { quitados: ['barandas'] }) });
  ver('Peatonal', v);
  assert.ok(v.some((a) => a.regla === 'choque' && a.nivel === 'bloquea'));
  const br = v.find((a) => a.regla === 'baranda');
  assert.ok(br && br.nivel === 'advierte' && br.arreglo.id === 'barandas');
});

console.log(mensajes.join('\n'));
console.log(`\n${ok} pruebas ok`);
