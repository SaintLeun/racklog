// Equipos y personas para dar escala en el planificador 3D: grúas (contrapeso, retráctil, apiladora,
// transpaleta) y un maniquí con EPP. Low-poly pero con cantos redondeados, neumáticos con llanta,
// techo de tubos y horquillas en cuña, para que se lean como producto y no como bloques.
// Convención: piso en y = 0, horquillas hacia −z local, centrado en x.
// Modelos GLB: el pedido de grúas GLB realistas (R2) está bloqueado (no hay modelos ni acceso al
// bucket). cargarGLB(url) queda lista: si algún día se pasa una URL se usa el modelo; si no hay URL
// o falla la carga, se sigue usando la grúa armada aquí.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Materiales compartidos (los crea quien arma la escena y se liberan con ella)
export function materialesEquipos() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  return {
    // Pintura de seguridad (PBR): amarillo RAL 1003 satinado (sin clearcoat: caro en equipos lentos)
    amarilloSeg: std({ color: 0xf5b301, metalness: 0.1, roughness: 0.36 }),
    franjaNegra: std({ color: 0x111111, roughness: 0.6 }),
    luzRoja: std({ color: 0xb91c1c, emissive: 0xdc2626, emissiveIntensity: 0.7, roughness: 0.3 }),
    luzBlanca: std({ color: 0xf8fafc, emissive: 0xfff7d6, emissiveIntensity: 0.8, roughness: 0.2 }),
    puntoAzul: new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.55, depthWrite: false }),
    chasis: std({ color: 0x2e3236, metalness: 0.4, roughness: 0.55 }),
    contrapeso: std({ color: 0x3a3f44, metalness: 0.35, roughness: 0.6 }),
    goma: std({ color: 0x1a1a1a, roughness: 0.88, metalness: 0 }),
    llanta: std({ color: 0xc9ccd1, metalness: 0.7, roughness: 0.35 }),
    mastil: std({ color: 0x3b4045, metalness: 0.6, roughness: 0.4 }),
    horquilla: std({ color: 0x24272b, metalness: 0.55, roughness: 0.45 }),
    tubo: std({ color: 0x1f2226, metalness: 0.5, roughness: 0.45 }),
    asiento: std({ color: 0x1c1c1e, roughness: 0.8 }),
    cromo: std({ color: 0xd6d9de, metalness: 0.9, roughness: 0.25 }),
    baliza: std({ color: 0xff8a00, emissive: 0xff6a00, emissiveIntensity: 0.6, roughness: 0.4 }),
    // Persona
    pantalon: std({ color: 0x1f2a44, roughness: 0.85 }),
    polera: std({ color: 0x334155, roughness: 0.85 }),
    chaleco: std({ color: 0xff7a1a, roughness: 0.6 }),
    reflectante: std({ color: 0xe5e7eb, metalness: 0.6, roughness: 0.25, emissive: 0x555555, emissiveIntensity: 0.25 }),
    piel: std({ color: 0xc89878, roughness: 0.7 }),
    casco: std({ color: 0xfacc15, metalness: 0.1, roughness: 0.35 }),
    zapato: std({ color: 0x1a1a1a, roughness: 0.7 }),
    // Persona en una malla por pieza: ropa, piel y cara con color por vertice
    persona: std({ vertexColors: true, roughness: 0.78, metalness: 0 }),
  };
}

// ─── Piezas ───
function malla(g, geo, mat, x = 0, y = 0, z = 0, sombra = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = sombra;
  m.receiveShadow = true;
  g.add(m);
  return m;
}
const caja = (g, w, h, d, r, x, y, z, mat, sombra = true) =>
  malla(g, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * 0.999), mat, x, y, z, sombra);

const _Y = new THREE.Vector3(0, 1, 0);
// Tubo entre dos puntos
function tubo(g, a, b, r, mat, seg = 8) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const d = B.clone().sub(A);
  const m = malla(g, new THREE.CylinderGeometry(r, r, d.length(), seg), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_Y, d.normalize());
  return m;
}
// Rueda: neumatico con hombros redondeados (torno), llanta con disco y maza con pernos
function rueda(g, r, ancho, x, y, z, m, lado = Math.sign(x) || 1) {
  const n = new THREE.Group();
  n.position.set(x, y, z);
  const w = ancho / 2, ri = r * 0.6, h = Math.min(r * 0.18, w * 0.6);
  // Perfil del neumatico en (radio, eje) y torneado alrededor del eje y; luego se acuesta
  const perfilN = [new THREE.Vector2(ri, -w), new THREE.Vector2(r - h, -w)];
  for (let k = 1; k <= 4; k++) { const a = (k / 4) * Math.PI / 2; perfilN.push(new THREE.Vector2(r - h + Math.sin(a) * h, -w + h - Math.cos(a) * h)); }
  for (let k = 0; k <= 4; k++) { const a = (k / 4) * Math.PI / 2; perfilN.push(new THREE.Vector2(r - h + Math.cos(a) * h, w - h + Math.sin(a) * h)); }
  perfilN.push(new THREE.Vector2(ri, w));
  const neu = malla(n, new THREE.LatheGeometry(perfilN, 24), m.goma);
  neu.rotation.z = Math.PI / 2;
  if (r > 0.08) {
    const ll = malla(n, new THREE.CylinderGeometry(ri, ri * 0.9, ancho * 0.92, 18), m.llanta, 0, 0, 0, false);
    ll.rotation.z = Math.PI / 2;
    const disco = malla(n, new THREE.CylinderGeometry(ri * 0.82, ri * 0.82, 0.01, 18), m.amarilloSeg, lado * (w * 0.7), 0, 0, false);
    disco.rotation.z = Math.PI / 2;
    const maza = malla(n, new THREE.CylinderGeometry(r * 0.2, r * 0.22, ancho + 0.03, 10), m.chasis, 0, 0, 0, false);
    maza.rotation.z = Math.PI / 2;
    maza.position.x = lado * 0.004;
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const p = malla(n, new THREE.CylinderGeometry(0.012, 0.012, 0.02, 6), m.cromo, lado * (w + 0.01), Math.cos(a) * r * 0.14, Math.sin(a) * r * 0.14, false);
      p.rotation.z = Math.PI / 2;
    }
  }
  g.add(n);
  return n;
}
// Perfil dibujado en el plano (z, y) y extruido a lo ancho en x, centrado en `x`
function perfil(g, puntos, ancho, x, mat, bisel = 0) {
  const s = new THREE.Shape();
  puntos.forEach(([u, v], i) => (i ? s.lineTo(u, v) : s.moveTo(u, v)));
  const d = Math.max(0.001, ancho - bisel * 2);
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: bisel > 0, bevelSize: bisel, bevelThickness: bisel, bevelSegments: 2, curveSegments: 10 });
  geo.rotateY(-Math.PI / 2);         // u → z, extrusion → −x
  geo.translate(x + d / 2, 0, 0);
  return malla(g, geo, mat);
}
// Horquilla en cuña: talón vertical y hoja que se adelgaza hacia la punta (−z)
function horquilla(g, x, y, z, largo, m, alto = 0.55, esp = 0.045) {
  perfil(g, [[z, y], [z, y + alto], [z - esp, y + alto], [z - esp, y + esp], [z - largo, y + 0.014], [z - largo, y]], 0.1, x, m.horquilla);
}
// Mastil de dos etapas: canales exteriores fijos y, en `etapa` (sube con la carga), canales
// interiores, cilindro y cadenas
function mastil(g, z, alto, sep, m, etapa = g) {
  [-1, 1].forEach((s) => {
    caja(g, 0.07, alto, 0.13, 0.012, s * sep, alto / 2 + 0.04, z, m.mastil);
    caja(etapa, 0.055, alto * 0.96, 0.1, 0.01, s * (sep - 0.075), alto * 0.48 + 0.06, z - 0.05, m.mastil);
    caja(etapa, 0.012, alto * 0.75, 0.025, 0.004, s * (sep - 0.16), alto * 0.4 + 0.3, z + 0.03, m.tubo, false);   // cadena
  });
  [0.12, alto * 0.55, alto].forEach((y) => caja(g, sep * 2 + 0.07, 0.07, 0.1, 0.015, 0, y, z + 0.01, m.mastil));
  malla(etapa, new THREE.CylinderGeometry(0.035, 0.035, alto * 0.85, 12), m.cromo, 0, alto * 0.45, z + 0.06);
}
// Tablero porta-horquillas con respaldo de carga en reja
function tablero(g, z, y, ancho, m) {
  caja(g, ancho, 0.1, 0.05, 0.01, 0, y + 0.1, z, m.horquilla);
  caja(g, ancho, 0.08, 0.05, 0.01, 0, y + 0.48, z, m.horquilla);
  caja(g, ancho, 0.04, 0.03, 0.008, 0, y + 1.05, z, m.horquilla);
  [-1, -0.33, 0.33, 1].forEach((k) => caja(g, 0.03, 0.95, 0.03, 0.006, k * (ancho / 2 - 0.02), y + 0.6, z, m.horquilla, false));
}
// Techo de protección con tubos (postes delanteros inclinados) y listones
function techo(g, ancho, zF, zA, y, m, apoyoF = 1.0, apoyoA = 1.25) {
  const hx = ancho / 2 - 0.03;
  [-1, 1].forEach((s) => {
    tubo(g, [s * hx, apoyoF, zF + 0.1], [s * hx, y, zF], 0.025, m.tubo);
    tubo(g, [s * hx, apoyoA, zA], [s * hx, y, zA], 0.025, m.tubo);
    tubo(g, [s * hx, y, zF], [s * hx, y, zA], 0.025, m.tubo);
  });
  [zF, zA].forEach((z) => tubo(g, [-hx, y, z], [hx, y, z], 0.025, m.tubo));
  for (let i = 1; i < 5; i++) {
    const z = zF + (zA - zF) * (i / 5);
    tubo(g, [-hx, y + 0.01, z], [hx, y + 0.01, z], 0.012, m.tubo, 6);
  }
}
function asiento(g, x, y, z, m) {
  caja(g, 0.46, 0.1, 0.42, 0.04, x, y, z, m.asiento);
  const r = caja(g, 0.44, 0.42, 0.09, 0.04, x, y + 0.24, z + 0.22, m.asiento);
  r.rotation.x = -0.18;
}
function volante(g, y, z, m) {
  tubo(g, [0, y - 0.3, z - 0.12], [0, y, z], 0.022, m.tubo);
  const v = malla(g, new THREE.TorusGeometry(0.14, 0.016, 6, 20), m.asiento, 0, y + 0.01, z + 0.02);
  v.rotation.x = -Math.PI / 2 + 0.6;
}
function baliza(g, x, y, z, m) {
  malla(g, new THREE.CylinderGeometry(0.045, 0.05, 0.08, 12), m.baliza, x, y, z, false);
}

// ─── Grúas ───
// Medidas nominales (x = ancho, z = largo incluyendo horquillas)
export const NOMINAL = {
  contrapeso: { ancho: 1.15, largo: 3.2 },
  retractil: { ancho: 1.25, largo: 2.7 },
  apiladora: { ancho: 0.85, largo: 2.5 },
  transpaleta: { ancho: 0.72, largo: 1.75 },
};

function contrapeso(g, m, p) {
  const W = 1.15;
  // Chasis inferior oscuro y carrocería amarilla redondeada
  caja(g, W * 0.9, 0.34, 1.75, 0.06, 0, 0.32, 0.45, m.chasis);
  caja(g, W, 0.5, 1.15, 0.09, 0, 0.72, 0.25, m.amarilloSeg);
  // Guardafangos sobre las ruedas delanteras
  [-1, 1].forEach((s) => caja(g, 0.2, 0.1, 0.62, 0.04, s * (W / 2 - 0.08), 0.68, -0.38, m.amarilloSeg));
  // Contrapeso: trasera con canto inferior y lomo superior curvos
  const curva = [[0.82, 0.18], [1.5, 0.18]];
  for (let k = 1; k <= 4; k++) { const a = (k / 4) * Math.PI / 2; curva.push([1.5 + Math.sin(a) * 0.08, 0.26 - Math.cos(a) * 0.08]); }
  curva.push([1.58, 0.95]);
  for (let k = 1; k <= 10; k++) { const a = (k / 10) * Math.PI / 2; curva.push([1.3 + Math.cos(a) * 0.28, 0.95 + Math.sin(a) * 0.32]); }
  curva.push([0.82, 1.27]);
  perfil(g, curva, W, 0, m.contrapeso, 0.03);
  // Capot, tablero, asiento y volante
  caja(g, W * 0.92, 0.1, 0.75, 0.05, 0, 1.02, 0.45, m.amarilloSeg);
  caja(g, W * 0.82, 0.32, 0.26, 0.06, 0, 1.0, -0.36, m.amarilloSeg);
  asiento(g, 0, 1.13, 0.5, m);
  volante(g, 1.42, -0.12, m);
  techo(g, W * 0.92, -0.3, 0.95, 2.12, m, 1.12, 1.27);
  baliza(g, 0, 2.2, 0.9, m);
  // Franjas negras en el contrapeso, luces traseras y delanteras, espejo y cilindros de inclinacion
  [-1, 1].forEach((s) => {
    caja(g, 0.05, 0.08, 0.04, 0.01, s * (W / 2 - 0.12), 0.9, 1.6, m.luzRoja, false);
    caja(g, 0.08, 0.06, 0.04, 0.01, s * (W / 2 - 0.1), 2.0, -0.31, m.luzBlanca, false);
    tubo(g, [s * 0.3, 0.62, -0.25], [s * 0.3, 0.95, -0.56], 0.035, m.chasis);
    tubo(g, [s * 0.3, 0.8, -0.42], [s * 0.3, 1.0, -0.6], 0.022, m.cromo);
  });
  [0.35, 0.6].forEach((y) => caja(g, W * 0.995, 0.06, 0.1, 0.02, 0, y, 1.52, m.franjaNegra, false));
  tubo(g, [W / 2 - 0.05, 2.1, -0.28], [W / 2 + 0.12, 2.0, -0.32], 0.012, m.tubo);
  caja(g, 0.14, 0.1, 0.02, 0.01, W / 2 + 0.16, 1.98, -0.33, m.asiento, false);

  // Ruedas: motrices adelante (mas grandes), directrices atras
  [-1, 1].forEach((s) => {
    rueda(g, 0.3, 0.22, s * (W / 2 - 0.11), 0.3, -0.38, m);
    rueda(g, 0.24, 0.18, s * (W / 2 - 0.12), 0.24, 1.08, m);
  });
  const zM = -0.62;
  mastil(g, zM, 2.3, 0.36, m, p.etapa);
  tablero(p.carro, zM - 0.12, 0.05, 0.95, m);
  [-0.26, 0.26].forEach((x) => horquilla(p.carro, x, 0.05, zM - 0.15, 1.1, m));
  return { mastil: 2.3, horquillas: 0.05 + 0.045 };
}

function retractil(g, m, p) {
  const W = 1.25;
  // Cuerpo trasero con baterias y puesto del operador de lado
  caja(g, W, 0.95, 0.75, 0.1, 0, 0.58, 0.95, m.amarilloSeg);
  caja(g, W * 0.96, 0.3, 0.6, 0.06, 0, 0.25, 0.32, m.chasis);
  caja(g, 0.32, 1.0, 0.62, 0.06, W / 2 - 0.16, 0.6, 0.3, m.amarilloSeg);   // costado del puesto
  caja(g, 0.5, 0.3, 0.3, 0.05, W / 2 - 0.25, 1.1, 0.05, m.amarilloSeg);    // consola con mandos
  asiento(g, -0.18, 0.55, 0.42, m);
  techo(g, W * 0.95, -0.05, 1.25, 2.2, m, 0.9, 1.05);
  baliza(g, 0.35, 2.28, 1.2, m);
  // Patas estabilizadoras con ruedas de carga y motriz atras al centro
  [-1, 1].forEach((s) => {
    caja(g, 0.17, 0.2, 1.4, 0.04, s * (W / 2 - 0.1), 0.15, -0.55, m.chasis);
    rueda(g, 0.11, 0.1, s * (W / 2 - 0.1), 0.11, -1.15, m);
  });
  rueda(g, 0.19, 0.2, 0, 0.19, 1.05, m);
  const zM = -0.25;
  mastil(g, zM, 2.9, 0.4, m, p.etapa);
  tablero(p.carro, zM - 0.12, 0.3, 1.0, m);
  [-0.26, 0.26].forEach((x) => horquilla(p.carro, x, 0.3, zM - 0.15, 1.05, m));
  return { mastil: 2.9, horquillas: 0.3 + 0.045 };
}

function apiladora(g, m, p) {
  const W = 0.85;
  caja(g, W * 0.92, 1.05, 0.62, 0.1, 0, 0.66, 0.5, m.amarilloSeg);     // motor y bateria
  caja(g, W * 0.9, 0.06, 0.6, 0.03, 0, 1.21, 0.5, m.chasis);           // tapa
  caja(g, W * 0.8, 0.22, 0.6, 0.05, 0, 0.14, 0.5, m.chasis);
  // Timon con cabezal de mando
  tubo(g, [0, 0.75, 0.82], [0, 1.25, 1.12], 0.025, m.tubo);
  caja(g, 0.38, 0.08, 0.12, 0.04, 0, 1.28, 1.15, m.asiento);
  // Patas y ruedas
  [-1, 1].forEach((s) => {
    caja(g, 0.12, 0.1, 1.05, 0.03, s * 0.29, 0.07, -0.45, m.chasis);
    rueda(g, 0.06, 0.08, s * 0.29, 0.06, -0.92, m);
  });
  rueda(g, 0.12, 0.12, 0, 0.12, 0.55, m);
  [-1, 1].forEach((s) => rueda(g, 0.06, 0.06, s * 0.3, 0.06, 0.72, m));
  const zM = 0.12;
  mastil(g, zM, 2.4, 0.3, m, p.etapa);
  tablero(p.carro, zM - 0.12, 0.22, 0.8, m);
  [-0.22, 0.22].forEach((x) => horquilla(p.carro, x, 0.22, zM - 0.15, 1.05, m, 0.5, 0.04));
  return { mastil: 2.4, horquillas: 0.22 + 0.04 };
}

function transpaleta(g, m, p) {
  const W = 0.72;
  caja(g, W * 0.95, 0.72, 0.42, 0.08, 0, 0.47, 0.5, m.amarilloSeg);
  caja(g, W * 0.92, 0.05, 0.4, 0.02, 0, 0.85, 0.5, m.chasis);
  caja(g, W * 0.92, 0.38, 0.06, 0.02, 0, 0.3, 0.27, m.chasis);       // placa delantera
  tubo(g, [0, 0.8, 0.62], [0, 1.15, 0.9], 0.022, m.tubo);
  caja(g, 0.34, 0.07, 0.1, 0.035, 0, 1.18, 0.93, m.asiento);
  rueda(g, 0.11, 0.1, 0, 0.11, 0.52, m);
  [-1, 1].forEach((s) => rueda(g, 0.05, 0.05, s * 0.28, 0.05, 0.62, m));
  // Horquillas a ras de piso con rodillos de carga en la punta
  [-0.2, 0.2].forEach((x) => {
    perfil(p.carro, [[0.25, 0.02], [0.25, 0.1], [-0.9, 0.09], [-0.98, 0.05], [-0.98, 0.02]], 0.16, x, m.horquilla, 0.008);
    rueda(g, 0.04, 0.08, x, 0.04, -0.9, m);
  });
  return { mastil: 0, horquillas: 0.1 };
}

const ARMAR = { contrapeso, retractil, apiladora, transpaleta };

/**
 * Grúa por modelo. Con `huella` ({ ancho, largo }) se escala para calzar en ese rectángulo.
 * Horquillas hacia −z; el modelo queda centrado en su largo nominal.
 * userData (para animarla): carro (tablero y horquillas) y etapa (mastil interior) suben con
 * levantar(alto); horquillas = alto de la cara de apoyo en reposo; punta = z de la punta (< 0).
 */
/**
 * Junta las piezas fijas de `raiz` en una malla por material (cada pieza suelta era una llamada de
 * dibujo: una grua pasaba de 150). Lo que se anima (`excluir`: carro, mastil, articulaciones) queda
 * aparte; despues se puede fusionar por dentro con su propia llamada.
 */
export function fusionar(raiz, excluir = []) {
  const fuera = new Set();
  excluir.forEach((e) => e.traverse((o) => fuera.add(o)));
  raiz.updateMatrixWorld(true);
  const inv = raiz.matrixWorld.clone().invert();
  const porMat = new Map(), quitar = [];
  raiz.traverse((o) => {
    if (o === raiz || fuera.has(o) || !o.isMesh || o.isInstancedMesh || Array.isArray(o.material)) return;
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    Object.keys(geo.attributes).forEach((k) => { if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k); });
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    if (!geo.attributes.normal) geo.computeVertexNormals();
    geo.applyMatrix4(inv.clone().multiply(o.matrixWorld));
    const k = o.material;
    if (!porMat.has(k)) porMat.set(k, { geos: [], sombra: false });
    const e = porMat.get(k);
    e.geos.push(geo);
    e.sombra ||= o.castShadow;
    quitar.push(o);
  });
  quitar.forEach((o) => { o.parent.remove(o); o.geometry.dispose(); });
  porMat.forEach(({ geos, sombra }, mat) => {
    const geo = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!geo) return;
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = sombra;
    m.receiveShadow = true;
    raiz.add(m);
  });
  return raiz;
}

export function grua(modelo = 'contrapeso', m = materialesEquipos(), huella = null) {
  const glb = MODELOS_GLB[modelo];
  if (glb) { const c = glb.clone(true); c.userData = { ...glb.userData }; return c; }
  // El apilador manual se dibuja como la apiladora (mismo mastil y horquillas)
  const tipo = ARMAR[modelo] ? modelo : modelo === 'manual' ? 'apiladora' : 'contrapeso';
  const g = new THREE.Group();
  const cuerpo = new THREE.Group();
  const carro = new THREE.Group(), etapa = new THREE.Group();
  cuerpo.add(carro, etapa);
  const info = ARMAR[tipo](cuerpo, m, { carro, etapa });
  // Centra en z segun la caja real (horquillas incluidas)
  const bb = new THREE.Box3().setFromObject(cuerpo);
  const cz = (bb.min.z + bb.max.z) / 2, cx = (bb.min.x + bb.max.x) / 2;
  cuerpo.children.forEach((h) => { h.position.z -= cz; h.position.x -= cx; });
  // Operario: sentado bajo el techo protector (contrapeso, retractil) o caminando detras de la lanza
  // (apiladora, transpaleta). Va despues de centrar para no mover la huella de la grua
  const op = operario(tipo, m);
  op.position.x -= cx; op.position.z -= cz;
  cuerpo.add(op);
  // Piezas fijas en una malla por material; carro, mastil interior y operario aparte
  fusionar(cuerpo, [carro, etapa, op]);
  fusionar(carro);
  fusionar(etapa);
  if (huella) {
    const L = bb.max.z - bb.min.z, W = bb.max.x - bb.min.x;
    // Escala pareja (sin deformar), limitada; si la huella es otra proporcion se usa el lado que manda
    const s = THREE.MathUtils.clamp(Math.min(huella.largo / L, huella.ancho / W), 0.6, 1.4);
    cuerpo.scale.setScalar(s);
  }
  g.add(cuerpo);
  // Luz azul de advertencia proyectada en el piso, delante de las horquillas (fuera de la caja)
  if (tipo !== 'transpaleta') {
    const azul = malla(g, new THREE.CircleGeometry(0.22, 20), m.puntoAzul, 0, 0.015, (bb.min.z - cz) * cuerpo.scale.x - 0.9, false);
    azul.rotation.x = -Math.PI / 2;
    azul.receiveShadow = false;
  }
  const esc = cuerpo.scale.x, y0Carro = carro.position.y, y0Etapa = etapa.position.y;
  g.userData = {
    modelo: tipo,
    horquillas: info.horquillas * esc,
    punta: (bb.min.z - cz) * esc,
    largo: (bb.max.z - bb.min.z) * esc,
    carro,
    // Sube las horquillas `alto` m (en metros de la escena) y la etapa interior la mitad
    levantar(alto) {
      carro.position.y = y0Carro + alto / esc;
      etapa.position.y = y0Etapa + Math.min(alto / 2, info.mastil * 0.9) / esc;
    },
  };
  return g;
}

// ─── Modelos GLB opcionales (bloqueado: no hay modelos; ver arriba) ───
const MODELOS_GLB = {};
/**
 * Carga un GLB (con GLTFLoader, que se descarga solo si se usa) y lo deja como modelo de `tipo`.
 * El modelo debe venir en metros, piso en y = 0 y horquillas hacia −z. Si no hay URL o falla,
 * devuelve null y se sigue usando la grúa armada aquí.
 */
export async function cargarGLB(url, tipo = 'contrapeso') {
  if (!url) return null;
  try {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().loadAsync(url);
    const g = new THREE.Group();
    g.add(gltf.scene);
    const bb = new THREE.Box3().setFromObject(g);
    g.userData = { modelo: tipo, horquillas: 0.1, punta: bb.min.z, largo: bb.max.z - bb.min.z, levantar() {} };
    MODELOS_GLB[tipo] = g;
    return g;
  } catch {
    return null;
  }
}

// ─── Persona de 1,75 m con EPP (casco, chaleco reflectante) ───
// Anatomia simple pero creible: cabeza con cara (ojos, cejas, nariz, orejas, pelo bajo el casco),
// cuello, torso ahusado (hombros mas anchos que la cintura), brazos y piernas torneados con hombro/codo
// y cadera/rodilla. Rendimiento: las geometrias se arman una sola vez y las comparten todas las
// personas (color por vertice); cada persona son 11 mallas y 3 materiales (m.persona, m.casco,
// m.reflectante). userData.caminar(a) balancea las piernas (a en rad, ±0,45 al caminar), los brazos
// al reves, dobla la rodilla de la pierna que avanza y sube/baja el cuerpo con el paso.
// Donde va el operario en cada equipo (m, sistema local de la grua: el frente de las horquillas es −z)
const PUESTO = {
  contrapeso: { sentado: true, x: 0, cadera: 1.21, z: 0.52 },     // asiento a 1,13 m, techo a 2,12 m
  retractil: { sentado: true, x: -0.18, cadera: 0.64, z: 0.44 },  // asiento a 0,55 m, techo a 2,2 m
  apiladora: { sentado: false, x: 0, z: 1.62 },                    // detras de la lanza (1,15 m)
  transpaleta: { sentado: false, x: 0, z: 1.38 },
};
/** Operario con casco y chaleco en su puesto (sentado con las manos al volante, o de pie en la lanza) */
export function operario(tipo, m = materialesEquipos()) {
  const pu = PUESTO[tipo] ?? PUESTO.contrapeso;
  const o = persona(m);
  const pose = o.userData.pose;
  if (pu.sentado) {
    // Sentado: muslos hacia adelante, canillas colgando, brazos al volante; un poco mas chico para
    // que el casco pase bajo el techo
    o.scale.setScalar(0.92);
    pose({ cadera: 1.4, rodilla: -1.3, hombro: 0.75, codo: 0.75 });
    o.position.set(pu.x, pu.cadera - CADERA * 0.92, pu.z);
  } else {
    // De pie con las manos en la lanza
    pose({ hombro: 0.6, codo: 0.4 });
    o.position.set(pu.x, 0, pu.z);
  }
  o.userData.caminar = null;   // va con la grua: no camina
  o.userData.operario = true;
  return o;
}

const CADERA = 0.86, MUSLO = 0.43, HOMBRO = 1.4, BRAZO = 0.3;
const COLOR = {
  piel: 0xc58c68, pielSombra: 0xa86f50, pelo: 0x2b2018, ojo: 0x1b1b1f, blanco: 0xf1efe9, boca: 0x8a4a40,
  polera: 0x2f3b4f, pantalon: 0x1f2a44, cinturon: 0x15171a, chaleco: 0xff6f0f, zapato: 0x1a1a1a, suela: 0x3a3a3a,
};
let GEO_PERSONA = null;

// Geometria lista para juntar: sin indice, solo posicion/normal/uv, con color, movida con `t`
function pieza(geo, color, t = {}) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  Object.keys(g.attributes).forEach((k) => { if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); });
  const c = new THREE.Color(color), n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = t;
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s)));
  return g;
}
const juntar = (piezas) => mergeGeometries(piezas, false);
// Torneado alrededor de y a partir de pares [radio, y] de abajo hacia arriba
const torno = (perfil, seg = 16) => new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), seg);
// Extremidad ahusada de 0 a −largo: casquete arriba de radio r1, abajo de radio r2 (como una capsula)
function extremidad(r1, r2, largo, seg = 12) {
  const pts = [];
  for (let k = 0; k <= 4; k++) { const a = (k / 4) * Math.PI / 2; pts.push([Math.sin(a) * r2, -largo - Math.cos(a) * r2 * 0.8]); }
  for (let k = 0; k <= 4; k++) { const a = (k / 4) * Math.PI / 2; pts.push([Math.cos(a) * r1, Math.sin(a) * r1 * 0.8]); }
  return torno(pts, seg);
}

function geometriasPersona() {
  if (GEO_PERSONA) return GEO_PERSONA;
  const C = COLOR;
  const cabeza = [0, 1.6, 0], escCabeza = [0.88, 1.1, 1];
  const cuerpo = juntar([
    // Pelvis con el pantalon y cinturon
    pieza(torno([[0, 0.8], [0.1, 0.805], [0.15, 0.85], [0.163, 0.92], [0.158, 0.985], [0, 0.99]]), C.pantalon, { s: [1, 1, 0.68] }),
    pieza(torno([[0.162, 0.95], [0.162, 0.985]], 16), C.cinturon, { s: [1.01, 1, 0.69] }),
    // Torso: cintura angosta, pecho y hombros anchos
    pieza(torno([[0, 0.96], [0.152, 0.97], [0.148, 1.06], [0.158, 1.18], [0.184, 1.3], [0.19, 1.36], [0.168, 1.41], [0.11, 1.45], [0.055, 1.47], [0, 1.47]]), C.polera, { s: [1, 1, 0.6] }),
    // Chaleco (sin mangas) sobre el torso
    pieza(torno([[0.163, 0.985], [0.162, 1.06], [0.171, 1.18], [0.197, 1.3], [0.202, 1.36], [0.18, 1.41], [0.125, 1.442]]), C.chaleco, { s: [1, 1, 0.62] }),
    // Cuello
    pieza(new THREE.CylinderGeometry(0.047, 0.052, 0.12, 12), C.piel, { p: [0, 1.48, 0.005] }),
    // Cabeza, orejas, nariz y pelo (atras, bajo el casco)
    pieza(new THREE.SphereGeometry(0.1, 20, 14), C.piel, { p: cabeza, s: escCabeza }),
    pieza(new THREE.SphereGeometry(0.103, 16, 8, 0, Math.PI, Math.PI * 0.28, Math.PI * 0.34), C.pelo, { p: [0, 1.605, 0.004], s: escCabeza }),
    ...[-1, 1].map((sx) => pieza(new THREE.SphereGeometry(0.022, 8, 6), C.piel, { p: [sx * 0.087, 1.6, 0.005], s: [0.45, 1, 0.8] })),
    pieza(new THREE.SphereGeometry(0.018, 8, 6), C.pielSombra, { p: [0, 1.592, -0.098], s: [0.8, 1, 1] }),
    // Ojos (blanco y pupila), cejas y boca
    ...[-1, 1].flatMap((sx) => [
      pieza(new THREE.SphereGeometry(0.014, 8, 6), C.blanco, { p: [sx * 0.032, 1.617, -0.083], s: [1, 0.7, 1] }),
      pieza(new THREE.SphereGeometry(0.008, 6, 5), C.ojo, { p: [sx * 0.032, 1.617, -0.095] }),
      pieza(new THREE.BoxGeometry(0.032, 0.007, 0.012), C.pelo, { p: [sx * 0.033, 1.64, -0.088], r: [0, 0, -sx * 0.12] }),
    ]),
    pieza(new THREE.BoxGeometry(0.034, 0.006, 0.01), C.boca, { p: [0, 1.555, -0.088] }),
  ]);
  // Cintas reflectantes alrededor del chaleco (siguen su perfil, apenas por fuera)
  const reflectante = juntar([
    pieza(torno([[0.169, 1.07], [0.171, 1.105]], 20), 0xffffff, { s: [1, 1, 0.63] }),
    pieza(torno([[0.18, 1.2], [0.188, 1.235]], 20), 0xffffff, { s: [1, 1, 0.63] }),
  ]);
  // Casco: casquete y ala con visera adelante
  const casco = juntar([
    pieza(new THREE.SphereGeometry(0.118, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xffffff, { p: [0, 1.632, 0.004], s: [0.93, 0.95, 1.06] }),
    pieza(new THREE.CylinderGeometry(0.122, 0.126, 0.014, 20), 0xffffff, { p: [0, 1.635, -0.012], s: [0.95, 1, 1.12] }),
  ]);
  const muslo = juntar([pieza(extremidad(0.074, 0.056, MUSLO), C.pantalon)]);
  // Canilla y zapato (del piso al tobillo: 0,07 m)
  const canilla = juntar([
    pieza(extremidad(0.056, 0.044, CADERA - MUSLO - 0.08), C.pantalon),
    pieza(new RoundedBoxGeometry(0.098, 0.07, 0.25, 2, 0.03), C.zapato, { p: [0, -(CADERA - MUSLO) + 0.045, -0.045] }),
    pieza(new THREE.BoxGeometry(0.1, 0.018, 0.25), C.suela, { p: [0, -(CADERA - MUSLO) + 0.009, -0.045] }),
  ]);
  const brazo = juntar([pieza(extremidad(0.054, 0.041, BRAZO), C.polera)]);
  // Antebrazo con la mano (ligeramente cerrada, palma hacia adentro)
  const antebrazo = juntar([
    pieza(extremidad(0.041, 0.033, 0.25), C.polera),
    pieza(new THREE.CylinderGeometry(0.03, 0.028, 0.03, 10), C.piel, { p: [0, -0.27, 0] }),
    pieza(new THREE.SphereGeometry(0.048, 12, 10), C.piel, { p: [0, -0.33, -0.004], s: [0.5, 1.05, 0.9] }),
    pieza(new THREE.CapsuleGeometry(0.012, 0.03, 2, 6), C.piel, { p: [0, -0.31, -0.04], r: [0.6, 0, 0] }),
  ]);
  GEO_PERSONA = { cuerpo, reflectante, casco, muslo, canilla, brazo, antebrazo };
  return GEO_PERSONA;
}

export function persona(m = materialesEquipos()) {
  const G = geometriasPersona();
  const p = new THREE.Group();
  const cuerpo = new THREE.Group();   // sube y baja con el paso
  p.add(cuerpo);
  const pegar = (padre, geo, mat, x = 0, y = 0, z = 0) => malla(padre, geo, mat, x, y, z);
  const articulacion = (padre, x, y) => { const a = new THREE.Group(); a.position.set(x, y, 0); padre.add(a); return a; };
  pegar(cuerpo, G.cuerpo, m.persona);
  pegar(cuerpo, G.reflectante, m.reflectante).castShadow = false;
  pegar(cuerpo, G.casco, m.casco);
  // Cadera → muslo → rodilla → canilla con zapato
  const piernas = [-1, 1].map((s) => {
    const a = articulacion(cuerpo, s * 0.088, CADERA);
    pegar(a, G.muslo, m.persona);
    const rodilla = articulacion(a, 0, -MUSLO);
    pegar(rodilla, G.canilla, m.persona);
    a.userData.rodilla = rodilla;
    return a;
  });
  // Hombro → brazo → codo → antebrazo con mano; los brazos se abren apenas para no rozar el torso
  const brazos = [-1, 1].map((s) => {
    const a = articulacion(cuerpo, s * 0.205, HOMBRO);
    a.rotation.z = s * 0.07;
    pegar(a, G.brazo, m.persona);
    const codo = articulacion(a, 0, -BRAZO);
    pegar(codo, G.antebrazo, m.persona);
    a.userData.codo = codo;
    return a;
  });
  // Pose fija (rad): cadera y hombro + adelante, rodilla − hacia atras, codo + hacia adelante
  p.userData.pose = ({ cadera = 0, rodilla = 0, hombro = 0, codo = 0 } = {}) => {
    piernas.forEach((a) => { a.rotation.x = cadera; a.userData.rodilla.rotation.x = rodilla; });
    brazos.forEach((a) => { a.rotation.x = hombro; a.userData.codo.rotation.x = codo; });
  };
  p.userData.pose({ rodilla: -0.04, codo: 0.12 });
  p.userData.articulaciones = [...piernas, ...brazos];
  // Caminata: a = amplitud·sen(fase). La fase se recupera de a y de su cambio entre cuadros: la pierna
  // que avanza dobla la rodilla (mas al pasar bajo la cadera), la de apoyo va casi recta y el cuerpo
  // baja cuando las dos piernas estan abiertas
  const A = 0.45;
  let previo = 0;
  p.userData.caminar = (a) => {
    const v = a - previo;
    previo = a;
    const vel = Math.sign(v) * Math.sqrt(Math.max(0, 1 - Math.min(1, (a / A) ** 2)));   // ≈ cos(fase)
    piernas.forEach((pi, i) => {
      const s = i ? -1 : 1, ang = s * a, avanza = s * vel;
      pi.rotation.x = ang;
      pi.userData.rodilla.rotation.x = -(0.06 + Math.max(0, avanza) * 0.85 + Math.max(0, -ang) * 0.25 * (avanza > 0 ? 1 : 0.3));
    });
    brazos.forEach((b, i) => {
      const ang = (i ? 1 : -1) * a * 0.75;
      b.rotation.x = ang;
      b.userData.codo.rotation.x = 0.15 + Math.max(0, ang) * 0.9;
    });
    cuerpo.position.y = -CADERA * (1 - Math.cos(a)) * 0.85;
  };
  return p;
}
