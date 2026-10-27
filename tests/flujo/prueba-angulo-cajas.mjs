// Angulo ranurado: estante (niveles de carga + bandeja del tope), caja y cajas por modulo
// (node tests/flujo/prueba-angulo-cajas.mjs)
import assert from 'node:assert';
const raiz = process.argv[2] || process.cwd();
const C = await import(`${raiz}/lib/flujo/calculos.js`);
const R = await import(`${raiz}/lib/flujo/recomendacion.js`);
const P = await import(`${raiz}/lib/rack3d/planificador.js`);
let n = 0;
const prueba = (t, f) => { f(); n++; console.log('ok -', t); };

const caja = { id: 'c', nombre: 'Caja 1', largo: 0.3, ancho: 0.55, alto: 0.3, peso: 5, cantidad: 500, apilable: 5 };
const base = { id: 'm', nombre: 'AR', tipo: 'AR', doble: false, niveles: 4, bandeja: 0.4, frente: 0.9, altoAngulo: 2, cantidades: { c: 500 } };

prueba('bandeja: mejor orientación, apiladas hasta lo que cabe y aguanta', () => {
  const c = { id: 'x', largo: 0.6, ancho: 0.4, alto: 0.3, peso: 10, apilable: 3 };
  const b = C.bandejaCajas({ frente: 0.92, fondo: 0.6, libre: 1.0, caja: c });
  assert.deepEqual([b.cols, b.filas, b.camas, b.cajas, b.largoEnFrente], [2, 1, 3, 6, false]);   // 0,4 al frente: 2 × 1 × 3
  assert.equal(C.bandejaCajas({ frente: 0.92, fondo: 0.4, libre: 0.34, caja: c }).cajas, 1);
});

prueba('bandeja: tope de 250 kg (se quitan camas enteras)', () => {
  const b = C.bandejaCajas({ frente: 0.92, fondo: 0.6, libre: 1.0, caja: { largo: 0.6, ancho: 0.4, alto: 0.3, peso: 50, apilable: 3 } });
  assert.equal(b.limite, 'peso');
  assert.ok(b.kg <= 250);
  assert.equal(b.cajas, 4);
});

prueba('estante: niveles a espacios iguales dentro del ángulo, la bandeja del tope lo cierra', () => {
  const m = C.moduloAR({ altoAngulo: 2, frente: 0.9, fondo: 0.4, niveles: 4, caja });
  assert.equal(m.bandejas, 5);
  const ys = m.m.bandejasY, e = m.m.espesorBandeja;
  assert.ok(Math.abs(ys.at(-1) + e - 2) < 1e-9, 'la del tope termina en el alto del ángulo');
  const libres = ys.slice(0, -1).map((y, i) => +(ys[i + 1] - y - e).toFixed(3));
  assert.ok(Math.max(...libres) - Math.min(...libres) < 0.02 + 1e-9, `espacios iguales (± 1 perforación): ${libres}`);
  // Ninguna caja sobre el tope: la pila de cada nivel cabe en su espacio
  ys.slice(0, -1).forEach((y, i) => assert.ok(y + e + m.camas * caja.alto <= ys[i + 1] + 1e-9, `nivel ${i + 1}`));
  assert.ok(m.camas * caja.alto <= m.libre - C.MANO_AR + 1e-9);
});

prueba('caja 30×55×30, 500 cajas: bandeja 900 × 400 (estándar), 55 al frente, y ofrece la de 600', () => {
  const b = C.mejorBandeja(base, { cajas: [caja] });
  assert.equal(b.bandeja, 0.4);
  assert.equal(b.frente, 0.9);
  assert.equal(b.motivo, null);
  const r = C.resultadoModelo({ ...base, ...b }, { cajas: [caja] });
  assert.equal(r.principal.largoEnFrente, false, '55 cm al frente, 30 al fondo');
  assert.equal(r.porModulo, r.principal.cols * r.principal.filas * r.principal.camas * r.m.nivelesCarga);
  assert.equal(r.porModulo, b.porModulo);
  assert.ok(b.alternativa && b.alternativa.bandeja === 0.6 && b.alternativa.porModulo > b.porModulo);
  assert.ok(r.ultimoNivel <= C.ALTURA_MANO_AR, 'por defecto sin escalera');
  assert.equal(r.avisos.length, 0);
});

prueba('la propuesta parte con el máximo de niveles que deja la caja: caja de 20 cm, más niveles que con la de 30', () => {
  const b30 = C.mejorBandeja(base, { cajas: [caja] });
  const b20 = C.mejorBandeja(base, { cajas: [{ ...caja, alto: 0.2 }] });
  assert.ok(b20.niveles > b30.niveles, `${b20.niveles} > ${b30.niveles}`);
  // Uno más ya no cabe (o quedaría con escalera)
  const mas = C.moduloAR({ altoAngulo: 2, frente: 0.9, fondo: b30.bandeja, niveles: b30.niveles + 1, caja });
  assert.ok(!mas.valido || mas.escalera);
});

prueba('caja 55×55×30: solo cabe en 600 y dice por qué', () => {
  const c = { ...caja, largo: 0.55, ancho: 0.55 };
  const b = C.mejorBandeja(base, { cajas: [c] });
  assert.equal(b.bandeja, 0.6);
  assert.match(b.motivo, /55 × 55 cm.*600 mm/);
});

prueba('"aguanta apiladas" cambia número, texto y dibujo juntos (un solo dato: la caja)', () => {
  const c = { ...caja, largo: 0.4, ancho: 0.3, alto: 0.2, apilable: 1 };
  const m = { ...base, niveles: 3 };
  const uno = C.resultadoModelo(m, { cajas: [c] }), dos = C.resultadoModelo(m, { cajas: [{ ...c, apilable: 2 }] });
  assert.equal(uno.principal.camas, 1);
  assert.equal(dos.principal.camas, 2);
  assert.equal(dos.porModulo, 2 * uno.porModulo);
  assert.ok(dos.cuerpos < uno.cuerpos);
});

prueba('escalera: aviso si el nivel más alto pasa de 1,8 m, pero no se propone por defecto', () => {
  const c = { ...caja, largo: 0.3, ancho: 0.3, alto: 0.15, apilable: 1 };
  const b = C.mejorBandeja({ ...base, altoAngulo: 3 }, { cajas: [c] });
  const r = C.resultadoModelo({ ...base, ...b }, { cajas: [c] });
  assert.ok(r.ultimoNivel <= C.ALTURA_MANO_AR + 1e-9);
  const alto = C.resultadoModelo({ ...base, altoAngulo: 3, niveles: 7 }, { cajas: [c] });
  assert.ok(alto.avisos.some((a) => /escalera/.test(a)));
});

prueba('plano: un módulo cuenta sus niveles de carga y sus cajas; la bandeja del tope se cotiza pero no guarda', () => {
  const b = C.mejorBandeja(base, { cajas: [caja] });
  const mo = { ...base, ...b };
  const r = P.normalizar({ ...C.rackDeModelo(mo, { cajas: [caja], cuerpos: 3 }), id: 'r', x: 5, y: 5, rot: 0 });
  const k = C.conteoRack(r);
  assert.equal(k.bandejas, 3 * (b.niveles + 1));
  assert.equal(k.niveles, 3 * b.niveles);
  assert.equal(k.cajas, 3 * b.porModulo);
  const cob = C.cobertura({ racks: [r], modelos: [mo], cajas: [caja] });
  assert.equal(cob.modelos[0].necesita, 500);
  assert.equal(cob.modelos[0].posiciones, 3 * b.porModulo);
});

prueba('recomendación: el ángulo ranurado sale con la propuesta', () => {
  const rec = R.recomendarProductos({ pallets: [], cajas: [caja], respuestas: { unidad: 'cajas' }, bodega: { altura: 8 } });
  const ar = rec.modelos.find((m) => m.tipo === 'AR');
  assert.equal(ar.bandeja, 0.4);
  assert.equal(ar.propuestaAR, C.firmaCajasAR(ar, [caja]));
});

prueba('techo bajo: el ángulo no pasa del techo', () => {
  const b = C.mejorBandeja({ ...base, altoAngulo: 3 }, { cajas: [caja], altura: 2.4 });
  const r = C.resultadoModelo({ ...base, ...b }, { cajas: [caja] });
  assert.ok(r.m.alto + 0.3 <= 2.4 + 1e-6, `alto ${r.m.alto}`);
});
console.log(`ángulo cajas: ${n} pruebas ok`);
