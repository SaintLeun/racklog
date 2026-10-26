// Una sola cantidad por producto: el rack sigue a "Tus pallets" (y "Arma tu rack" al producto).
// Antes: volver al paso de pallets y subir 100 → 500 dejaba el modelo en 100 y el layout decía "completo"
// mientras "por producto" decía que faltaban 497. node tests/flujo/prueba-cantidades.mjs "$PWD"
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const b = process.argv[2] || process.cwd();
const k = await import(pathToFileURL(b + '/lib/flujo/calculos.js').href);

const t = { id: 'p1', nombre: 'Pallet 1', frente: 1, fondo: 1.2, alto: 1.2, peso: 800, cantidad: 100, rotacion: 'media' };
const u = { ...t, id: 'p2', nombre: 'Pallet 2', cantidad: 50 };
const mo = { id: 'm1', nombre: 'Selectivo', tipo: 'RS', doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], cantidades: { p1: 100 } };

// Un modelo: la cantidad nueva pasa entera
let [m] = k.cantidadesAlDia([mo], { pallets: [{ ...t, cantidad: 500 }] });
assert.equal(m.cantidades.p1, 500);
// Nada cambia: los mismos objetos (no dispara watchers)
const igual = [mo];
assert.equal(k.cantidadesAlDia(igual, { pallets: [t] }), igual);
// Campo vacío mientras escribe: no saca el producto del rack
assert.equal(k.cantidadesAlDia([mo], { pallets: [{ ...t, cantidad: '' }] })[0].cantidades.p1, 100);
// Dos modelos que se reparten el producto: misma proporción, suma exacta
const mo2 = { ...mo, id: 'm2', nombre: 'Selectivo B', cantidades: { p1: 300 } };
const ms = k.cantidadesAlDia([{ ...mo, cantidades: { p1: 100 } }, mo2], { pallets: [{ ...t, cantidad: 1000 }] });
assert.deepEqual(ms.map((x) => x.cantidades.p1), [250, 750]);
// Producto nuevo: entra entero al primer modelo de su clase; uno dejado en 0 a propósito queda fuera
[m] = k.cantidadesAlDia([mo], { pallets: [t, u] });
assert.equal(m.cantidades.p2, 50);
[m] = k.cantidadesAlDia([{ ...mo, cantidades: { p1: 100, p2: 0 } }], { pallets: [t, u] });
assert.equal(m.cantidades.p2, 0);
// Las cajas van a los modelos de ángulo ranurado, no al selectivo
const c = { id: 'c1', nombre: 'Caja', largo: 0.6, ancho: 0.4, alto: 0.3, peso: 10, cantidad: 800, apilable: 3 };
const ar = { id: 'a1', nombre: 'AR', tipo: 'AR', doble: false, niveles: 5, bandeja: 0.4, frente: 0.92, cantidades: { c1: 500 } };
const r2 = k.cantidadesAlDia([mo, ar], { pallets: [t], cajas: [c] });
assert.equal(r2[1].cantidades.c1, 800); assert.ok(!('c1' in r2[0].cantidades));

// El layout y "por producto" dicen lo mismo después de cambiar la cantidad
const res = k.resultadoModelo(mo, { pallets: [t], ocupacion: 0.8 });
const rack = { ...k.rackDeModelo(mo, { pallets: [t], cuerpos: res.modulos }), id: 'r1', x: 10, y: 10 };
const t500 = { ...t, cantidad: 500 };
const cob = k.cobertura({ racks: [rack], modelos: k.cantidadesAlDia([mo], { pallets: [t500] }), pallets: [t500], ocupacion: 0.8 });
assert.ok(cob.modelos[0].diferencia < 0 && !cob.productos[0].ok, 'los dos dicen que faltan');
assert.equal(cob.modelos[0].necesita, cob.productos[0].necesita);
console.log(`cantidades: 100 → 500 pide ${cob.productos[0].necesita} posiciones en el modelo y en el producto; pruebas ok`);
