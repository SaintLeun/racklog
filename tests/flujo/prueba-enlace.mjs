// Ronda 3 · Bloque F: el link para compartir es de solo lectura y vence a los 30 días; el de "seguir después"
// es editable y no vence (node tests/flujo/prueba-enlace.mjs)
import assert from 'node:assert';
const b = process.argv[2] || process.cwd();
const E = await import(b + '/lib/flujo/enlace.js');
const estado = { sabe: false, respuestas: {}, pallets: [], cajas: [], modelos: [], racks: [], bodega: { ancho: 20, largo: 60 }, accesorios: {}, flags: [], lead: { correo: 'x@y.cl' } };
const ver = await E.decodificarDiseño(new URL(await E.enlaceParaVer(estado, 'https://racklog.cl')).searchParams.get('d'));
assert.equal(ver.ver, 1);
assert.ok(!E.vencido(ver));
assert.ok(E.vencido(ver, Date.now() + 31 * 864e5), 'a los 31 días debe vencer');
assert.ok(!E.vencido(ver, Date.now() + 29 * 864e5));
assert.equal(ver.lead, undefined, 'sin datos personales');
const editable = await E.decodificarDiseño(new URL(await E.enlaceDiseño(estado, 'https://racklog.cl')).searchParams.get('d'));
assert.ok(!editable.ver && !editable.hasta && !E.vencido(editable, Date.now() + 365 * 864e5));
// Link del ejecutivo (dueño 27-10): mismo diseño editable + recorrido=1, sin datos personales
const rec = await E.enlaceRecorrido(estado, 'https://racklog.cl');
assert.ok(E.pideRecorrido(rec) && !E.pideRecorrido(await E.enlaceDiseño(estado, 'https://racklog.cl')));
const delRec = await E.decodificarDiseño(new URL(rec).searchParams.get('d'));
assert.equal(delRec.lead, undefined, 'el link del ejecutivo no lleva datos personales');
assert.ok(rec.length < 8000, 'cabe en el límite del servidor (linkDeDiseno)');
console.log('enlace: pruebas ok');
