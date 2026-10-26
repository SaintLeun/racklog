// Factor de ocupacion (prompt v3 §6): posiciones necesarias = pallets ÷ factor. 100 pallets al 80 % piden
// 125 posiciones: un plano con 108 NO cubre. node tests/flujo/prueba-ocupacion.mjs
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const b = process.argv[2] || process.cwd();
const k = await import(pathToFileURL(b + '/lib/flujo/calculos.js').href);

assert.equal(k.conOcupacion(100, 0.8), 125);
assert.equal(k.conOcupacion(100, 1), 100);
assert.equal(k.conOcupacion(100, 0.3), Math.ceil(100 / k.OCUPACION.min), 'no baja del mínimo');
assert.equal(k.conOcupacion(83, 0.85), 98);

const pallets = [{ id: 'a', nombre: 'P', frente: 1, fondo: 1.2, alto: 1.35, peso: 700, cantidad: 100, rotacion: 'media', color: '#f59e0b' }];
const modelo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: false, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], cantidades: { a: 100 } };
const sin = k.resultadoModelo(modelo, { pallets });
const con = k.resultadoModelo(modelo, { pallets, ocupacion: 0.8 });
assert.ok(con.cuerpos > sin.cuerpos, 'con holgura pide más cuerpos');
assert.ok(con.capacidad >= 125, 'alcanza para 125 posiciones');

// Un plano con 108 posiciones (cubre 100 al 100 %, no al 80 %)
const rack = { ...k.rackDeModelo(modelo, { pallets, cuerpos: 1 }), id: 'r1', x: 10, y: 10 };
const porCuerpo = k.conteoRack(rack).posiciones;
const r108 = k.conCuerpos(rack, Math.ceil(108 / porCuerpo));
const pos = k.conteoRack(r108).posiciones;
assert.ok(pos >= 100 && pos < 125, `plano de prueba con ${pos} posiciones`);
const c1 = k.cobertura({ racks: [r108], modelos: [modelo], pallets });
const c8 = k.cobertura({ racks: [r108], modelos: [modelo], pallets, ocupacion: 0.8 });
assert.ok(c1.productos[0].ok, 'al 100 % cubre');
assert.equal(c8.productos[0].ok, false, 'al 80 % no cubre');
assert.equal(c8.productos[0].necesita, 125);
assert.equal(c8.productos[0].pallets, 100);
assert.ok(c8.modelos[0].diferencia < 0, 'el modelo dice que faltan cuerpos');
// El factor es de selectivo y drive-in: el angulo ranurado cubica sus cajas tal cual (y la bandeja propuesta
// dice los mismos cuerpos que la tarjeta)
const cajas = [{ id: 'c1', nombre: 'Caja 1', largo: 0.6, ancho: 0.4, alto: 0.3, peso: 10, cantidad: 500, apilable: 3 }];
const ar = { id: 'a1', nombre: 'AR', tipo: 'AR', doble: false, niveles: 5, bandeja: 0.4, frente: 0.92, cantidades: { c1: 500 } };
assert.equal(k.resultadoModelo(ar, { cajas, ocupacion: 0.8 }).cuerpos, k.resultadoModelo(ar, { cajas }).cuerpos, 'AR sin factor de ocupación');
const prop = k.mejorBandeja(ar, { cajas, altura: 8 });
assert.equal(k.resultadoModelo({ ...ar, ...prop, altoEntre: null }, { cajas, ocupacion: 0.8 }).cuerpos, prop.cuerpos, 'propuesta AR = tarjeta');
const cAR = k.cobertura({ racks: [], modelos: [ar], cajas, ocupacion: 0.8 });
assert.equal(cAR.modelos[0].necesita, k.resultadoModelo(ar, { cajas }).modulos * k.resultadoModelo(ar, { cajas }).porCuerpo, 'AR: bandejas sin holgura');
console.log(`ocupación: ${pos} posiciones para 100 pallets → al 80 % faltan ${c8.productos[0].falta}; pruebas ok`);
