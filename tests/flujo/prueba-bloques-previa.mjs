// Vista previa de "Repetir en bloque" y de pasillos en serie, y cobertura por producto (correcciones 22-10-2026)
import assert from 'node:assert';
const b = process.argv[2];
const k = await import(b + '/lib/flujo/calculos.js');
const pallets = [
  { id: 'a', nombre: 'Pallet 1', frente: 1, fondo: 1.2, alto: 1.2, peso: 700, cantidad: 100, rotacion: 'alta', color: '#f59e0b' },
  { id: 'b', nombre: 'Pallet 2', frente: 1, fondo: 1.2, alto: 1.7, peso: 600, cantidad: 100, rotacion: 'baja', color: '#3b82f6' },
];
const modelo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 100, b: 100 } };
let n = 0; const id = () => 'r' + (++n);
const bodega = { ancho: 30, largo: 25, altura: 8, forma: null, elementos: [{ id: 'g', clase: 'pasilloGrua', x: 15, y: 20, ancho: 29.8, alto: 3.5 }], grua: 'contrapeso' };
const res = k.resultadoModelo(modelo, { pallets });
const u = k.ubicarModelos(bodega, [modelo], { m1: res.modulos }, { pallets, nuevoId: id });
const r0 = u.racks[0];
// 3 × 3 desde el primer rack: algunas copias no caben y cada una dice por qué
const previa = k.previaBloque(r0, { largo: 3, profundidad: 3 }, u.racks, bodega, id);
assert.equal(previa.length, 8);
const malas = previa.filter((c) => !c.ok);
assert.ok(malas.length > 0 && malas.every((c) => ['muro', 'pasillo de grúa', 'otro rack'].includes(c.motivo)), JSON.stringify(malas.map((c) => c.motivo)));
console.log('previa', previa.length, 'no caben:', k.textoMotivos(previa));
const rep = k.repetirBloque(r0, { largo: 3, profundidad: 3 }, u.racks, bodega, id);
assert.equal(rep.nuevos.length + rep.omitidos, 8);
// Pasillos en serie: 3 pasillos de grúa a 8 m; los que salen de la bodega se marcan "muro"
const pp = k.previaPasillos(bodega.elementos[0], { cantidad: 4, separacion: 8 }, bodega, id);
assert.equal(pp.length, 3);
console.log('pasillos', pp.map((c) => `${c.el.y} ${c.ok ? 'ok' : c.motivo}`).join(' · '));
assert.ok(pp.some((c) => c.ok));
// Cobertura: con lo ubicado, por producto y por modelo
const cob = k.cobertura({ racks: u.racks, modelos: [modelo], pallets });
console.log('cobertura', JSON.stringify(cob));
assert.equal(cob.productos.length, 2);
const conMas = k.cobertura({ racks: [...u.racks, ...rep.nuevos], modelos: [modelo], pallets });
assert.ok(conMas.modelos[0].diferencia > cob.modelos[0].diferencia, 'con más racks sobran cuerpos');
console.log('con bloque', JSON.stringify(conMas.modelos[0]), conMas.productos.map((p) => `${p.nombre} ${p.posiciones}/${p.necesita}`).join(' · '));
// Sin racks: falta todo y dice cuántos cuerpos
const nada = k.cobertura({ racks: [], modelos: [modelo], pallets });
assert.ok(nada.productos.every((p) => p.falta === 100 && p.faltanCuerpos > 0), JSON.stringify(nada.productos));
console.log('pruebas ok');
