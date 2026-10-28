// Portones y andenes (dueño 27-10): la franja libre delante es lo mínimo (pasillo de la grúa), el batiente
// por dentro barre su hoja y la corredera por dentro ocupa la franja junto al muro
// node tests/flujo/prueba-maniobras.mjs
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const k = await import(b + '/lib/flujo/calculos.js');
const { GRUAS, ACCESOS } = await import(b + '/lib/rack3d/parametrosTecnicos.js');
const cerca = (a, c, t = 0.01) => Math.abs(a - c) < t;
const bod = (grua = 'contrapeso', elementos = []) => ({ ancho: 20, largo: 30, forma: null, grua, elementos });

// Sin valor escrito: el pasillo de la grúa, nunca menos que el mínimo
{
  assert.ok(cerca(k.maniobraDe(bod('contrapeso'), { clase: 'anden' }), GRUAS.contrapeso.pasillo));
  assert.ok(cerca(k.maniobraDe(bod('retractil'), { clase: 'porton' }), GRUAS.retractil.pasillo));
  assert.ok(k.maniobraDe(bod('transpaleta'), { clase: 'porton' }) >= ACCESOS.maniobraMinima.valor);
  // Lo que escribe el cliente manda (también 0: sin zona)
  assert.ok(cerca(k.maniobraDe(bod(), { clase: 'anden', maniobra: 5 }), 5));
  assert.strictEqual(k.maniobraDe(bod(), { clase: 'anden', maniobra: 0 }), 0);
}

// Andén en el muro de abajo: nivelador + franja = lo que come hacia adentro (antes 4 + 4 m)
{
  const B = bod();
  const an = { id: 'a', clase: 'anden', muro: 'abajo', ...k.enMuro(B, { muro: 'abajo', dist: 2, ancho: ACCESOS.anchoAnden.valor, fondo: ACCESOS.niveladorAnden.valor }) };
  const z = k.zonaManiobra(B, an);
  assert.ok(cerca(z.alto, GRUAS.contrapeso.pasillo));
  assert.ok(cerca(z.ancho, ACCESOS.anchoAnden.valor));
  const adentro = 30 - (z.y - z.alto / 2);
  assert.ok(cerca(adentro, ACCESOS.niveladorAnden.valor + GRUAS.contrapeso.pasillo), `come ${adentro} m`);
  assert.ok(adentro < 8, 'menos que antes');
}

// Portón batiente de una hoja de 5 m por dentro: la zona cubre la hoja; hacia afuera, solo la maniobra
{
  const B = bod('transpaleta');
  const base = { id: 'p', clase: 'porton', muro: 'abajo', ...k.enMuro(B, { muro: 'abajo', dist: 3, ancho: 5, fondo: 0.3 }) };
  assert.deepStrictEqual(k.hojasPorton(2).length, 1);
  assert.deepStrictEqual(k.hojasPorton(5).map((h) => h.largo), [2.5, 2.5]);
  const adentro = k.zonaManiobra(B, { ...base, abre: 'batiente', hacia: 'adentro' });
  const afuera = k.zonaManiobra(B, { ...base, abre: 'batiente', hacia: 'afuera' });
  assert.ok(cerca(adentro.alto, Math.max(2.5, k.maniobraDe(B, base))));
  assert.ok(cerca(afuera.alto, k.maniobraDe(B, base)));
  const angosto = { ...base, ...k.enMuro(B, { muro: 'abajo', dist: 3, ancho: 2.4, fondo: 0.3 }), abre: 'batiente' };
  assert.ok(cerca(k.zonaManiobra(B, angosto).alto, Math.max(2.4, k.maniobraDe(B, base))));
}

// Corredera por dentro: franja junto al muro, al lado del vano; si no cabe a la derecha, a la izquierda
{
  const B = bod();
  const p = { id: 'p', clase: 'porton', muro: 'abajo', abre: 'corredera', ...k.enMuro(B, { muro: 'abajo', dist: 2, ancho: 4, fondo: 0.3 }) };
  const z = k.zonaCorredera(B, p);
  assert.ok(cerca(z.x - z.ancho / 2, 6) && cerca(z.ancho, 4), JSON.stringify(z));
  assert.ok(cerca(z.y + z.alto / 2, 30));
  const alFondo = { ...p, ...k.enMuro(B, { muro: 'abajo', dist: 15, ancho: 4, fondo: 0.3 }) };
  const z2 = k.zonaCorredera(B, alFondo);
  assert.ok(cerca(z2.x + z2.ancho / 2, 15), JSON.stringify(z2));
  assert.strictEqual(k.zonaCorredera(B, { ...p, hacia: 'afuera' }), null);
  assert.strictEqual(k.zonaCorredera(B, { ...p, abre: 'cortina' }), null);
  // conManiobras: zona de maniobra + hoja, ambas hijas del portón
  const els = k.conManiobras({ ...B, elementos: [p] });
  assert.deepStrictEqual(els.map((e) => e.id).sort(), ['p', 'p-corredera', 'p-maniobra']);
  assert.ok(els.find((e) => e.id === 'p-maniobra').esManiobra);
}

console.log('prueba-maniobras: ok');
