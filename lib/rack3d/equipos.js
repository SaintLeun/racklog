// Equipos y personas para dar escala en el planificador 3D: grúas (contrapeso, retráctil, apiladora,
// transpaleta) y un maniquí con EPP. Low-poly pero con cantos redondeados, neumáticos con llanta,
// techo de tubos y horquillas en cuña, para que se lean como producto y no como bloques.
// Convención: piso en y = 0, horquillas hacia −z local, centrado en x.
// Modelos GLB: el pedido de grúas GLB realistas (R2) está bloqueado (no hay modelos ni acceso al
// bucket). cargarGLB(url) queda lista: si algún día se pasa una URL se usa el modelo; si no hay URL
// o falla la carga, se sigue usando la grúa armada aquí.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

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
// Piernas y brazos cuelgan de la cadera y el hombro: userData.caminar(a) los balancea (a en rad)
export function persona(m = materialesEquipos()) {
  const p = new THREE.Group();
  const capsula = (g, r, largo, mat, x, y, z) => malla(g, new THREE.CapsuleGeometry(r, largo, 4, 12), mat, x, y, z);
  const articulacion = (x, y) => { const a = new THREE.Group(); a.position.set(x, y, 0); p.add(a); return a; };
  // Piernas (desde la cadera, a 0,86 m) con zapato
  const piernas = [-1, 1].map((s) => {
    const a = articulacion(s * 0.095, 0.86);
    capsula(a, 0.068, 0.7, m.pantalon, 0, -0.39, 0);
    caja(a, 0.11, 0.07, 0.24, 0.03, 0, -0.825, -0.03, m.zapato);
    return a;
  });
  // Torso (polera) y chaleco con dos cintas reflectantes
  const torso = capsula(p, 0.16, 0.32, m.polera, 0, 1.17, 0);
  torso.scale.set(1, 1, 0.7);
  const chaleco = malla(p, new THREE.CylinderGeometry(0.172, 0.165, 0.46, 16, 1, true), m.chaleco, 0, 1.15, 0);
  chaleco.scale.set(1, 1, 0.72);
  chaleco.material.side = THREE.DoubleSide;
  [1.03, 1.2].forEach((y) => {
    const c = malla(p, new THREE.CylinderGeometry(0.175, 0.175, 0.035, 16, 1, true), m.reflectante, 0, y, 0, false);
    c.scale.set(1, 1, 0.73);
  });
  // Brazos (desde el hombro, a 1,42 m): manga y mano
  const brazos = [-1, 1].map((s) => {
    const a = articulacion(s * 0.215, 1.42);
    const b = capsula(a, 0.048, 0.5, m.polera, s * 0.01, -0.26, 0.01);
    b.rotation.z = s * 0.1;
    malla(a, new THREE.SphereGeometry(0.045, 10, 8), m.piel, s * 0.04, -0.58, 0.02);
    return a;
  });
  // Cuello, cabeza y casco con visera
  malla(p, new THREE.CylinderGeometry(0.045, 0.05, 0.08, 10), m.piel, 0, 1.5, 0);
  const cabeza = malla(p, new THREE.SphereGeometry(0.1, 16, 12), m.piel, 0, 1.61, 0);
  cabeza.scale.set(1, 1.12, 1.05);
  malla(p, new THREE.SphereGeometry(0.118, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), m.casco, 0, 1.64, 0);
  const ala = malla(p, new THREE.CylinderGeometry(0.13, 0.13, 0.012, 16), m.casco, 0, 1.645, -0.015);
  ala.scale.set(1, 1, 1.12);
  p.userData.caminar = (a) => {
    piernas[0].rotation.x = a; piernas[1].rotation.x = -a;
    brazos[0].rotation.x = -a * 0.8; brazos[1].rotation.x = a * 0.8;
  };
  return p;
}
