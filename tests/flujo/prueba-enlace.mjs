// Ronda 3 · Bloque F (24 h desde el 04-11): el link para compartir es de solo lectura, encriptado y vence a las 24 horas; el de "seguir después"
// es editable y no vence (node tests/flujo/prueba-enlace.mjs)
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const E = await import(b + '/lib/flujo/enlace.js');
const estado = { sabe: false, respuestas: {}, pallets: [], cajas: [], modelos: [], racks: [], bodega: { ancho: 20, largo: 60 }, accesorios: {}, flags: [], lead: { correo: 'x@y.cl' } };
const abrir = async (url) => { const { d, k } = E.partesEnlace(url); return E.decodificarDiseño(d, k); };
const linkVer = await E.enlaceParaVer(estado, 'https://racklog.cl');
const ver = await abrir(linkVer);
assert.equal(ver.ver, 1);
assert.ok(!E.vencido(ver));
assert.ok(E.vencido(ver, Date.now() + 24 * 36e5 + 60e3), 'a las 24 horas debe vencer');
assert.ok(!E.vencido(ver, Date.now() + 23 * 36e5));
// Encriptado: el diseño va cifrado en ?d= y la clave en #k= (no sale del navegador)
const { d: cifrado, k: clave } = E.partesEnlace(linkVer);
assert.equal(cifrado[0], 'e', 'cifrado y comprimido');
assert.ok(clave.length >= 43, 'clave AES de 256 bits');
assert.ok(new URL(linkVer).hash.startsWith('#k='), 'la clave va en el fragmento');
assert.ok(!new URL(linkVer).search.includes(clave), 'la clave no va en la consulta');
assert.equal(await E.decodificarDiseño(cifrado, ''), null, 'sin clave no abre');
assert.equal(await E.decodificarDiseño(cifrado, E.partesEnlace(await E.enlaceParaVer(estado, 'https://racklog.cl')).k), null, 'con otra clave no abre');
const editado = cifrado.slice(0, 20) + (cifrado[20] === 'A' ? 'B' : 'A') + cifrado.slice(21);
assert.equal(await E.decodificarDiseño(editado, clave), null, 'link editado (p. ej. para alargar el vencimiento) no abre');
// Links de antes (sin cifrar) se siguen abriendo
const antiguo = 'j' + Buffer.from(JSON.stringify({ v: 1, bodega: {}, racks: [], modelos: [] })).toString('base64url');
assert.ok(await E.decodificarDiseño(antiguo), 'link antiguo sin cifrar');
assert.equal(ver.lead, undefined, 'sin datos personales');
const editable = await abrir(await E.enlaceDiseño(estado, 'https://racklog.cl'));
assert.ok(!editable.ver && !editable.hasta && !E.vencido(editable, Date.now() + 365 * 864e5));
// Link del ejecutivo (dueño 27-10): mismo diseño editable + recorrido=1, sin datos personales
const rec = await E.enlaceRecorrido(estado, 'https://racklog.cl');
assert.ok(E.pideRecorrido(rec) && !E.pideRecorrido(await E.enlaceDiseño(estado, 'https://racklog.cl')));
const delRec = await abrir(rec);
assert.ok(delRec, 'el link del ejecutivo abre');
assert.ok(/\?d=e[^#]*&recorrido=1#k=/.test(rec), 'recorrido=1 antes de la clave');
assert.equal(delRec.lead, undefined, 'el link del ejecutivo no lleva datos personales');
assert.ok(rec.length < 8000, 'cabe en el límite del servidor (linkDeDiseno)');
console.log('enlace: pruebas ok');
