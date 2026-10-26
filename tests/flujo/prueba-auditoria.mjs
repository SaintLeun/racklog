// Auditoría de KPI: el dibujo cumple con las medidas y cantidades de los pallets del cliente, y detecta
// cuando no (node tests/flujo/prueba-auditoria.mjs)
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const k = await import(b + '/lib/flujo/calculos.js');
const A = await import(b + '/lib/flujo/auditoria.js');
const pallets = [{ id: 'a', nombre: 'Pallet 1', frente: 1, fondo: 1.2, alto: 1.65, peso: 325, cantidad: 120, rotacion: 'media', color: '#f59e0b' }];
const modelo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 120 } };
const bodega = { ancho: 20, largo: 30, altura: 8, forma: null, grua: 'contrapeso', elementos: [] };
let n = 0;
const ubicar = (mo, ps) => k.ubicarModelos(bodega, [mo], { [mo.id]: k.resultadoModelo(mo, { pallets: ps }).modulos }, { pallets: ps, nuevoId: () => 'r' + (++n) }).racks;
const base = { pallets, cajas: [], modelos: [modelo], bodega, accesorios: { quitados: [], cantidades: {} }, posicionesHoy: 0, crecimiento: 0.1 };

// 1. Diseño del recorrido por defecto: todo cumple
const p = { ...base, racks: ubicar(modelo, pallets) };
const a = A.auditarDiseno(p);
a.filas.filter((f) => f.nivel !== 'ok').forEach((f) => console.log('  ✗', f.grupo, f.titulo, '|', f.pide, '|', f.dibujo));
assert.equal(a.fallas, 0, 'el diseño por defecto debe cumplir');
assert.ok(a.filas.some((f) => f.id.startsWith('frente:')) && a.filas.some((f) => f.id.startsWith('alto:')) && a.filas.some((f) => f.id === 'cant:total'));
console.log(`ok - por defecto: cumple ${a.cumple} de ${a.total}`);

// 2. El cliente cambia el pallet después de dibujar (racks viejos): la auditoría lo detecta
const grande = [{ ...pallets[0], frente: 1.2, alto: 2.1 }];
const b2 = A.auditarDiseno({ ...p, pallets: grande });
assert.ok(b2.filas.find((f) => f.id === 'frente:m1:a').nivel === 'falla', 'frente 1,2 en viga de 2,3 debe fallar');
assert.ok(b2.filas.find((f) => f.id === 'alto:m1:a').nivel === 'falla', 'pallet de 2,1 m entre vigas para 1,65 debe fallar');
console.log('ok - pallet cambiado sin rearmar el rack: falla frente y alto');

// 3. Faltan posiciones: más pallets que los dibujados
const c3 = A.auditarDiseno({ ...p, pallets: [{ ...pallets[0], cantidad: 400 }], modelos: [{ ...modelo, cantidades: { a: 400 } }] });
assert.equal(c3.filas.find((f) => f.id === 'cant:total').nivel, 'falla');
console.log('ok - faltan posiciones: falla la cantidad');
// 4. Un túnel resta posiciones sin restar cuerpos: la cobertura no dice "justo lo que necesitas" si faltan
{
  const pall = [{ ...pallets[0], cantidad: 128 }], mo = { ...modelo, cantidades: { a: 128 } };
  const rs = ubicar(mo, pall);
  const conT = rs.map((r, i) => (i ? r : { ...r, tunelPropio: true, tunelRack: { cuerpo: 1, altoLibre: 3.5 }, tunel: { cuerpo: 1, altoLibre: 3.5 } }));
  const c = k.cobertura({ racks: conT, modelos: [mo], pallets: pall }).modelos[0];
  assert.ok(c.posiciones < 128 && c.diferencia < 0, `con túnel faltan cuerpos: ${c.posiciones} posiciones, diferencia ${c.diferencia}`);
  const pr = k.cobertura({ racks: conT, modelos: [mo], pallets: pall }).productos[0];
  assert.equal(pr.posiciones, c.posiciones, 'por producto = total con túnel');
  console.log(`ok - túnel: ${c.posiciones} de 128 posiciones, faltan ${-c.diferencia} cuerpos`);
}
console.log('auditoria: pruebas ok');
