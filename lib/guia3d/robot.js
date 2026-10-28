// RACKLOG en 3D (dueño 28-10): el mono de la hoja de poses (docs/Hoja de poses del robot Racklog (1).png) armado con
// piezas de Three.js, sin modelo externo: cuerpo naranjo con la viga abajo, dos pilares perforados a los lados, casco
// blanco con la R, guantes blancos y zapatillas. Tiene las mismas 15 poses que el asistente (lib/flujo/asistente.js)
// y pasa de una a otra con una transición corta. Solo dibuja mientras se mueve: nada en bucle (sin respiración ni
// parpadeo); la boca se mueve solo mientras habla la voz
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const C = {
  naranjo: 0xff7417, naranjoOsc: 0xe2580a, gris: 0x3a3d42, grisOsc: 0x26282c, blanco: 0xf7f7f5,
  boca: 0x4a1212, lengua: 0xf0605a, ojo: 0x1c1410, carton: 0xc89a64,
};

// Texturas dibujadas en un canvas (sin archivos): perforaciones del pilar, la R del casco, la caja y la tablet
function textura(ancho, alto, dibujar) {
  const c = document.createElement('canvas');
  c.width = ancho; c.height = alto;
  dibujar(c.getContext('2d'), ancho, alto);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function dibujarR(g, x, y, s, conTexto = false) {
  // La R de Racklog: palo gris y curva naranja
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = '#3a3d42';
  g.fillRect(0, 0, 18, 64);
  g.fillStyle = '#ff7417';
  g.beginPath();
  g.moveTo(24, 0); g.lineTo(40, 0);
  g.bezierCurveTo(64, 0, 64, 36, 40, 36);
  g.lineTo(60, 64); g.lineTo(40, 64); g.lineTo(24, 38);
  g.closePath();
  g.fill();
  g.restore();
  if (conTexto) {
    g.fillStyle = '#3a3d42';
    g.font = `bold ${Math.round(30 * s)}px Arial, sans-serif`;
    g.textBaseline = 'middle';
    g.fillText('RACK', x + 72 * s, y + 32 * s);
    const w = g.measureText('RACK').width;
    g.fillStyle = '#ff7417';
    g.fillText('LOG', x + 72 * s + w, y + 32 * s);
  }
}

function materiales() {
  const m = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...extra });
  const perforado = textura(64, 512, (g, w, h) => {
    g.fillStyle = '#3a3d42'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#202226';
    for (let y = 14; y < h; y += 34) { g.beginPath(); g.ellipse(w / 2, y, 9, 11, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, 6, h);
  });
  const casco = textura(256, 128, (g) => { g.fillStyle = '#f7f7f5'; g.fillRect(0, 0, 256, 128); dibujarR(g, 104, 28, 0.8); });
  const caja = textura(256, 160, (g) => {
    g.fillStyle = '#c89a64'; g.fillRect(0, 0, 256, 160);
    g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, 70, 256, 10);
    dibujarR(g, 26, 52, 0.85, true);
  });
  const pantalla = textura(128, 160, (g) => {
    g.fillStyle = '#2a2d33'; g.fillRect(0, 0, 128, 160);
    dibujarR(g, 30, 44, 1.05);
  });
  return {
    cuerpo: m(C.naranjo), naranjo: m(C.naranjo), viga: m(C.naranjoOsc), gris: m(C.gris, { roughness: 0.45, metalness: 0.3 }),
    pilar: m(0xffffff, { map: perforado, roughness: 0.45, metalness: 0.3 }), blanco: m(C.blanco, { roughness: 0.4 }),
    casco: m(0xffffff, { map: casco, roughness: 0.35 }), boca: m(C.boca, { roughness: 0.7 }), lengua: m(C.lengua),
    ojo: m(C.ojo, { roughness: 0.2 }), brillo: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    ceja: m(C.grisOsc), carton: m(C.carton, { roughness: 0.85 }), cartonCara: m(0xffffff, { map: caja, roughness: 0.85 }),
    pantalla: m(0xffffff, { map: pantalla, roughness: 0.3 }), sombra: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }),
  };
}

// ─── El cuerpo, pieza por pieza (pies en y = 0, mirando a +z) ───
function armar(M) {
  const raiz = new THREE.Group();        // posición en la escena (caminata)
  const cuerpo = new THREE.Group();      // salto e inclinación
  raiz.add(cuerpo);
  const malla = (geo, mat, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); return o; };

  // Tronco: la caja naranja es también la cara
  const tronco = new THREE.Group();
  tronco.position.y = 1.3;
  cuerpo.add(tronco);
  tronco.add(malla(new RoundedBoxGeometry(0.98, 1.06, 0.56, 4, 0.12), M.cuerpo));
  tronco.add(malla(new RoundedBoxGeometry(1.02, 0.16, 0.6, 3, 0.04), M.viga, 0, -0.38, 0));
  tronco.add(malla(new RoundedBoxGeometry(1.0, 0.08, 0.58, 2, 0.03), M.viga, 0, 0.24, 0));
  // Pilares perforados a los lados, un poco inclinados como en el dibujo
  for (const s of [-1, 1]) {
    const pil = malla(new THREE.BoxGeometry(0.13, 1.42, 0.14), [M.gris, M.gris, M.gris, M.gris, M.pilar, M.gris], s * 0.56, 0.02, 0.12);
    pil.rotation.z = s * -0.06;
    tronco.add(pil);
    const pil2 = malla(new THREE.BoxGeometry(0.11, 1.3, 0.12), M.gris, s * 0.5, 0.0, -0.22);
    pil2.rotation.z = s * -0.05;
    tronco.add(pil2);
  }

  // Cara
  const cara = new THREE.Group();
  cara.position.set(0, 0.06, 0.28);
  tronco.add(cara);
  const ojos = [];
  for (const s of [-1, 1]) {
    const ojo = new THREE.Group();
    ojo.position.set(s * 0.19, 0.12, 0);
    const blanco = malla(new THREE.SphereGeometry(0.14, 24, 16), M.blanco);
    blanco.scale.set(1, 1.15, 0.45);
    const pupila = malla(new THREE.SphereGeometry(0.075, 20, 14), M.ojo, 0, -0.01, 0.045);
    pupila.scale.set(1, 1.1, 0.55);
    const brillo = malla(new THREE.SphereGeometry(0.022, 10, 8), M.brillo, 0.025, 0.03, 0.085);
    const abierto = new THREE.Group();
    abierto.add(blanco, pupila, brillo);
    // Ojo feliz (cerrado, como un arco ^)
    const feliz = malla(new THREE.TorusGeometry(0.075, 0.018, 8, 20, Math.PI), M.ojo, 0, -0.02, 0.05);
    feliz.visible = false;
    ojo.add(abierto, feliz);
    cara.add(ojo);
    const ceja = malla(new THREE.CapsuleGeometry(0.024, 0.13, 4, 8), M.ceja, s * 0.19, 0.33, 0.03);
    ceja.rotation.z = Math.PI / 2;
    cara.add(ceja);
    ojos.push({ ojo, abierto, feliz, pupila, brillo, ceja, s });
  }
  // Boca abierta (media luna con lengua) y sonrisa cerrada (arco)
  const forma = new THREE.Shape();
  forma.moveTo(-0.17, 0);
  forma.lineTo(0.17, 0);
  forma.absarc(0, 0, 0.17, 0, -Math.PI, true);
  const bocaAbierta = new THREE.Group();
  bocaAbierta.position.set(0, -0.17, 0);
  const hueco = malla(new THREE.ExtrudeGeometry(forma, { depth: 0.02, bevelEnabled: false, curveSegments: 20 }), M.boca);
  hueco.scale.set(1, 0.8, 1);
  const lengua = malla(new THREE.CircleGeometry(0.075, 18), M.lengua, 0, -0.1, 0.022);
  lengua.scale.set(1.3, 0.6, 1);
  const dientes = malla(new THREE.BoxGeometry(0.24, 0.035, 0.01), M.blanco, 0, -0.02, 0.022);
  bocaAbierta.add(hueco, lengua, dientes);
  const sonrisa = malla(new THREE.TorusGeometry(0.11, 0.02, 8, 24, Math.PI), M.boca, 0, -0.12, 0.01);
  sonrisa.rotation.z = Math.PI;
  sonrisa.visible = false;
  cara.add(bocaAbierta, sonrisa);

  // Casco con la R
  const casco = new THREE.Group();
  casco.position.set(0, 0.47, 0.02);
  tronco.add(casco);
  const domo = malla(new THREE.SphereGeometry(0.42, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.casco);
  domo.scale.set(1.16, 0.8, 1.0);
  domo.rotation.y = -Math.PI / 2;
  const ala = malla(new THREE.CylinderGeometry(0.52, 0.52, 0.04, 32), M.blanco, 0, 0.0, 0.03);
  ala.scale.set(1.0, 1, 1.05);
  const visera = malla(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 32, 1, false, -Math.PI / 2, Math.PI), M.blanco, 0, 0.0, 0.34);
  visera.scale.set(1, 1, 0.55);
  visera.rotation.x = 0.12;
  const cresta = malla(new RoundedBoxGeometry(0.1, 0.06, 0.8, 2, 0.025), M.blanco, 0, 0.3, 0);
  casco.add(domo, ala, visera, cresta);

  // Brazos: hombro → codo → mano (guante con pulgar e índice)
  const brazo = (s) => {
    const hombro = new THREE.Group();
    hombro.position.set(s * 0.62, 1.5, 0.1);
    const arriba = malla(new THREE.CylinderGeometry(0.045, 0.045, 0.34, 10), M.gris, 0, -0.17, 0);
    const codo = new THREE.Group();
    codo.position.y = -0.34;
    const abajo = malla(new THREE.CylinderGeometry(0.045, 0.045, 0.3, 10), M.gris, 0, -0.15, 0);
    const puño = malla(new THREE.CylinderGeometry(0.06, 0.06, 0.07, 14), M.naranjo, 0, -0.28, 0);
    const mano = new THREE.Group();
    mano.position.y = -0.38;
    const palma = malla(new THREE.SphereGeometry(0.1, 18, 14), M.blanco);
    palma.scale.set(1, 1.05, 0.75);
    const dedos = malla(new THREE.CapsuleGeometry(0.06, 0.05, 4, 10), M.blanco, 0, -0.09, 0.0);
    dedos.scale.set(1.25, 1, 0.75);
    const pulgar = new THREE.Group();
    pulgar.position.set(-s * 0.08, 0.0, 0.03);
    const pulg = malla(new THREE.CapsuleGeometry(0.032, 0.08, 4, 8), M.blanco, 0, 0.05, 0);
    pulgar.add(pulg);
    const indice = malla(new THREE.CapsuleGeometry(0.03, 0.13, 4, 8), M.blanco, 0, -0.16, 0.0);
    indice.visible = false;
    mano.add(palma, dedos, pulgar, indice);
    codo.add(abajo, puño, mano);
    hombro.add(arriba, codo);
    cuerpo.add(hombro);
    return { hombro, codo, mano, dedos, pulgar, indice };
  };
  const brazos = { i: brazo(-1), d: brazo(1) };

  // Piernas y zapatillas
  const pierna = (s) => {
    const cadera = new THREE.Group();
    cadera.position.set(s * 0.22, 0.78, 0);
    cadera.add(malla(new THREE.CylinderGeometry(0.05, 0.05, 0.56, 10), M.gris, 0, -0.28, 0));
    const pie = new THREE.Group();
    pie.position.y = -0.62;
    const suela = malla(new RoundedBoxGeometry(0.3, 0.07, 0.46, 2, 0.03), M.blanco, 0, -0.1, 0.07);
    const zapato = malla(new RoundedBoxGeometry(0.28, 0.17, 0.42, 3, 0.07), M.naranjo, 0, -0.0, 0.06);
    const cordones = malla(new RoundedBoxGeometry(0.16, 0.05, 0.2, 2, 0.02), M.grisOsc, 0, 0.08, 0.1);
    cordones.rotation.x = -0.35;
    const caña = malla(new THREE.CylinderGeometry(0.1, 0.11, 0.12, 14), M.gris, 0, 0.04, -0.03);
    const punta = malla(new THREE.SphereGeometry(0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.blanco, 0, -0.075, 0.2);
    punta.scale.set(1.05, 0.5, 0.6);
    pie.add(suela, zapato, cordones, caña, punta);
    cadera.add(pie);
    cuerpo.add(cadera);
    return { cadera, pie };
  };
  const piernas = { i: pierna(-1), d: pierna(1) };

  // Accesorios de algunas poses
  const cajaGeo = new RoundedBoxGeometry(0.62, 0.42, 0.42, 2, 0.02);
  const cajaMats = [M.carton, M.carton, M.carton, M.carton, M.cartonCara, M.carton];
  const nuevaCaja = () => new THREE.Mesh(cajaGeo, cajaMats);
  const props = {
    caja: nuevaCaja(),
    carga: nuevaCaja(),
    cajas: (() => { const g = new THREE.Group(); const a = nuevaCaja(); a.position.y = 0.21; const b = nuevaCaja(); b.position.set(0.03, 0.63, 0); b.rotation.y = 0.08; g.add(a, b); return g; })(),
    pilar: malla(new THREE.BoxGeometry(0.2, 2.3, 0.2), [M.gris, M.gris, M.gris, M.gris, M.pilar, M.gris]),
    tablet: (() => { const g = new THREE.Group(); g.add(malla(new RoundedBoxGeometry(0.34, 0.44, 0.03, 2, 0.02), M.grisOsc)); g.add(malla(new THREE.PlaneGeometry(0.3, 0.38), M.pantalla, 0, 0, 0.017)); return g; })(),
  };
  props.caja.position.set(0, 1.0, 0.5);
  props.carga.position.set(0, 2.33, 0.05);
  props.cajas.position.set(-0.95, 0, 0.1);
  props.pilar.position.set(-0.72, 1.15, 0.25);
  props.tablet.position.set(0.5, 1.12, 0.52);
  props.tablet.rotation.set(-0.15, -0.5, 0.1);
  for (const o of Object.values(props)) { o.visible = false; raiz.add(o); }
  // Salto y carga se mueven con el cuerpo
  for (const k of ['carga', 'tablet']) { raiz.remove(props[k]); cuerpo.add(props[k]); }

  // Sombra de contacto bajo los pies
  const sombraTex = textura(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  });
  M.sombra.alphaMap = sombraTex;
  M.sombra.color.set(0x000000);
  M.sombra.map = null;
  const sombra = malla(new THREE.PlaneGeometry(1.6, 0.9), M.sombra, 0, 0.002, 0.05);
  sombra.rotation.x = -Math.PI / 2;
  raiz.add(sombra);

  return { raiz, cuerpo, tronco, ojos, bocaAbierta, sonrisa, brazos, piernas, props, sombra };
}

// ─── Poses: ángulos de cada articulación (radianes). i = brazo de la izquierda en pantalla, d = derecha ───
// Brazo: [adelante(−)/atrás(+), abrir hacia afuera, codo (− dobla hacia adelante), giro de la mano]
const ABAJO_I = [0.05, -0.18, -0.15, 0], ABAJO_D = [0.05, 0.18, -0.15, 0];
const POSES = {
  presenta: { i: ABAJO_I, d: [-0.35, 0.95, -0.7, -0.8], manos: ['abierta', 'abierta'], boca: 'abierta', giro: -0.15 },
  saluda: { i: ABAJO_I, d: [0, 2.55, -0.25, 0], manos: ['abierta', 'abierta'], boca: 'abierta', saluda: true },
  pulgar: { i: [-0.65, 0.15, -1.45, 0], d: ABAJO_D, manos: ['pulgar', 'abierta'], boca: 'abierta' },
  senala: { i: [-0.6, 0.2, -1.4, 0], d: [-0.15, 1.5, 0, -1.4], manos: ['pulgar', 'indice'], boca: 'abierta', guiño: true, giro: -0.25, inclina: -0.05 },
  celebra: { i: [0, -2.6, -0.35, 0], d: [0, 2.6, -0.35, 0], manos: ['puño', 'puño'], boca: 'abierta', salta: true },
  atento: { i: [0.1, -0.45, -0.3, 0], d: [0.1, 0.45, -0.3, 0], manos: ['abierta', 'abierta'], boca: 'sonrisa', cejas: 0.06 },
  ok: { i: [-0.9, 0.55, -1.9, 0], d: [-0.9, -0.55, -1.9, 0], manos: ['puño', 'puño'], boca: 'sonrisa' },
  piensa: { i: [-1.0, 0.45, -2.25, 1.2], d: [-0.5, -0.3, -1.6, 0], manos: ['indice', 'puño'], boca: 'sonrisa', mira: 'arriba', inclina: 0.06 },
  tablet: { i: [-0.6, 0.25, -1.5, 1.3], d: [-0.75, 0.0, -1.2, 0], manos: ['indice', 'abierta'], boca: 'abierta', prop: 'tablet', giro: -0.2 },
  caja: { i: [-0.85, -0.12, -0.75, 0], d: [-0.85, 0.12, -0.75, 0], manos: ['abierta', 'abierta'], boca: 'abierta', prop: 'caja' },
  perfecto: { i: [-0.65, -0.3, -1.45, 0], d: [-0.65, 0.3, -1.45, 0], manos: ['pulgar', 'pulgar'], boca: 'abierta', ojos: 'felices' },
  cajas: { i: [-0.1, -0.75, -0.6, 0], d: [0.15, 0.55, -0.5, 0], manos: ['abierta', 'abierta'], boca: 'abierta', prop: 'cajas', inclina: 0.08, giro: 0.15 },
  pilar: { i: [-0.6, -0.9, -1.2, 0], d: [-0.8, -0.35, -1.6, 0], manos: ['abierta', 'abierta'], boca: 'abierta', prop: 'pilar', giro: 0.25, inclina: 0.05 },
  corre: { i: [0.8, -0.2, -1.3, 0], d: [-0.8, 0.2, -1.3, 0], manos: ['puño', 'puño'], boca: 'abierta', piernas: [-0.6, 0.55], adelante: 0.08 },
  carga: { i: [0, -2.75, -0.6, 0], d: [0, 2.75, -0.6, 0], manos: ['abierta', 'abierta'], boca: 'abierta', prop: 'carga' },
};

const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const mezclar = (a, b, t) => a + (b - a) * t;

/**
 * Monta a RACKLOG en un canvas. Devuelve { pose(nombre), caminar() → Promise, hablar(bool), destruir() }.
 * Lanza si el navegador no tiene WebGL (el componente muestra la imagen de la pose)
 */
export function crearRobot(canvas, { pose = 'presenta' } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  camara.position.set(0.6, 1.7, 6.6);
  camara.lookAt(0, 1.25, 0);
  escena.add(new THREE.HemisphereLight(0xffffff, 0x8a7a70, 1.6));
  const sol = new THREE.DirectionalLight(0xffffff, 2.2);
  sol.position.set(2.5, 4, 5);
  escena.add(sol);
  const contra = new THREE.DirectionalLight(0xffd2b0, 1.2);
  contra.position.set(-3, 2.5, -3);
  escena.add(contra);

  const M = materiales();
  const R = armar(M);
  escena.add(R.raiz);
  R.raiz.rotation.y = -0.3;

  // Estado de las articulaciones (lo que se interpola) y lo que se cambia de golpe (manos, ojos, boca, accesorio)
  const leer = (nombre) => {
    const P = POSES[nombre] ?? POSES.presenta;
    const pi = P.piernas ?? [0, 0];
    return {
      i: [...P.i], d: [...P.d], piernas: [...pi], giro: P.giro ?? 0, inclina: P.inclina ?? 0, adelante: P.adelante ?? 0,
      cejas: P.cejas ?? 0, mira: P.mira === 'arriba' ? 1 : 0,
    };
  };
  let actual = leer(pose), nombreActual = pose;
  const extra = { saludo: 0, salto: 0, caminar: 0, paso: 0, boca: 0 };

  function aplicarDiscreto(nombre) {
    const P = POSES[nombre] ?? POSES.presenta;
    [['i', 0], ['d', 1]].forEach(([k, n]) => {
      const b = R.brazos[k], m = P.manos[n];
      b.indice.visible = m === 'indice';
      b.dedos.visible = m !== 'indice' && m !== 'pulgar';
      b.dedos.scale.y = m === 'puño' ? 0.6 : 1;
      // Pulgar arriba: perpendicular al antebrazo (eje z de la mano), que con el codo doblado queda hacia arriba
      if (m === 'pulgar') { b.pulgar.rotation.set(Math.PI / 2, 0, 0); b.pulgar.position.set(0, -0.02, 0.05); b.pulgar.scale.setScalar(1.35); }
      else { b.pulgar.rotation.set(0, 0, (k === 'i' ? -1 : 1) * 0.9); b.pulgar.position.set((k === 'i' ? 1 : -1) * 0.08, 0, 0.03); b.pulgar.scale.setScalar(1); }
    });
    R.bocaAbierta.visible = P.boca !== 'sonrisa';
    R.sonrisa.visible = P.boca === 'sonrisa';
    R.ojos.forEach((o, n) => {
      const feliz = P.ojos === 'felices' || (P.guiño && n === 1);
      o.abierto.visible = !feliz;
      o.feliz.visible = feliz;
    });
    for (const [k, o] of Object.entries(R.props)) o.visible = P.prop === k;
  }

  function aplicar(e) {
    const brazo = (b, v, s) => {
      b.hombro.rotation.set(v[0], 0, v[1]);
      b.codo.rotation.set(v[2], 0, 0);
      b.mano.rotation.set(0, v[3], 0);
    };
    brazo(R.brazos.i, e.i);
    // Saludo: la mano se mece de lado a lado unas pocas veces (no queda en bucle)
    const d = [...e.d];
    d[1] += Math.sin(extra.saludo * Math.PI * 6) * 0.28 * Math.sin(extra.saludo * Math.PI);
    d[2] += Math.sin(extra.saludo * Math.PI * 6) * 0.2 * Math.sin(extra.saludo * Math.PI);
    brazo(R.brazos.d, d);
    // Caminata: piernas y brazos alternan; el cuerpo sube en cada paso
    const ciclo = Math.sin(extra.paso), pasoK = extra.caminar;
    R.piernas.i.cadera.rotation.x = mezclar(e.piernas[0], ciclo * 0.55, pasoK);
    R.piernas.d.cadera.rotation.x = mezclar(e.piernas[1], -ciclo * 0.55, pasoK);
    R.piernas.i.pie.rotation.x = -R.piernas.i.cadera.rotation.x * 0.4;
    R.piernas.d.pie.rotation.x = -R.piernas.d.cadera.rotation.x * 0.4;
    if (pasoK > 0) {
      R.brazos.i.hombro.rotation.x = mezclar(e.i[0], -ciclo * 0.5, pasoK);
      R.brazos.d.hombro.rotation.x = mezclar(e.d[0], ciclo * 0.5, pasoK);
    }
    const rebote = pasoK * Math.abs(Math.cos(extra.paso)) * 0.06;
    const salto = Math.sin(extra.salto * Math.PI) * 0.45;
    R.cuerpo.position.y = rebote + salto;
    R.cuerpo.rotation.z = e.inclina;
    R.cuerpo.rotation.x = e.adelante;
    R.cuerpo.rotation.y = e.giro;
    // El cuerpo se estira un poco al salir del salto y se aplasta al caer
    const estira = extra.salto > 0 && extra.salto < 1 ? 1 + Math.sin(extra.salto * Math.PI * 2) * 0.05 : 1;
    R.cuerpo.scale.set(1 / Math.sqrt(estira), estira, 1 / Math.sqrt(estira));
    R.sombra.scale.setScalar(1 - salto * 0.6);
    R.ojos.forEach((o) => {
      o.ceja.position.y = 0.33 + e.cejas + e.mira * 0.03;
      o.ceja.rotation.z = Math.PI / 2 + o.s * (e.mira * 0.25);
      o.pupila.position.y = -0.01 + e.mira * 0.05;
      o.brillo.position.y = 0.03 + e.mira * 0.05;
    });
    // Boca al hablar: abre y cierra (solo mientras suena la voz)
    R.bocaAbierta.scale.y = 1 - extra.boca * 0.55;
  }

  // ─── Dibujo a pedido: un solo requestAnimationFrame mientras haya algo moviéndose ───
  const tareas = new Set();
  let raf = 0, vivo = true;
  function cuadro(ahora) {
    raf = 0;
    if (!vivo) return;
    for (const t of [...tareas]) if (t(ahora) === false) tareas.delete(t);
    aplicar(actual);
    renderer.render(escena, camara);
    if (tareas.size) raf = requestAnimationFrame(cuadro);
  }
  const dibujar = () => { if (!raf && vivo) raf = requestAnimationFrame(cuadro); };
  function animar(ms, paso, fin) {
    let t0 = null;
    return new Promise((ok) => {
      tareas.add((ahora) => {
        t0 ??= ahora;
        const t = Math.min(1, (ahora - t0) / ms);
        paso(t);
        if (t >= 1) { fin?.(); ok(); return false; }
        return true;
      });
      dibujar();
    });
  }

  function tamaño() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    dibujar();
  }
  const ro = new ResizeObserver(tamaño);
  ro.observe(canvas);
  aplicarDiscreto(pose);
  tamaño();

  let version = 0;
  return {
    /** Pasa a otra pose en ~0,45 s; saluda y celebra hacen su gesto una vez */
    pose(nombre) {
      if (!POSES[nombre]) nombre = 'presenta';
      const v = ++version;
      const desde = actual, hacia = leer(nombre);
      const P = POSES[nombre];
      const cambio = nombre !== nombreActual;
      nombreActual = nombre;
      // Los accesorios y gestos de la mano cambian a la mitad, cuando los brazos ya van en camino
      setTimeout(() => { if (v === version) { aplicarDiscreto(nombre); dibujar(); } }, cambio ? 180 : 0);
      const mezcla = (t) => {
        const k = suave(t), f = (a, b) => a.map((x, n) => mezclar(x, b[n], k));
        actual = {
          i: f(desde.i, hacia.i), d: f(desde.d, hacia.d), piernas: f(desde.piernas, hacia.piernas),
          giro: mezclar(desde.giro, hacia.giro, k), inclina: mezclar(desde.inclina, hacia.inclina, k), adelante: mezclar(desde.adelante, hacia.adelante, k),
          cejas: mezclar(desde.cejas, hacia.cejas, k), mira: mezclar(desde.mira, hacia.mira, k),
        };
      };
      return animar(450, mezcla).then(() => {
        if (v !== version) return;
        if (P.saluda) return animar(1500, (t) => { extra.saludo = t; }, () => { extra.saludo = 0; });
        if (P.salta) return animar(650, (t) => { extra.salto = t; }, () => { extra.salto = 0; });
      });
    },
    /** Llega caminando desde el fondo hasta su lugar (una vez) */
    caminar(ms = 2400) {
      const z0 = -9, x0 = -2.6;
      R.raiz.position.set(x0, 0, z0);
      R.raiz.rotation.y = 0.55;
      extra.caminar = 1;
      return animar(ms, (t) => {
        const k = 1 - (1 - t) ** 2;
        R.raiz.position.set(mezclar(x0, 0, k), 0, mezclar(z0, 0, k));
        R.raiz.rotation.y = mezclar(0.55, -0.3, Math.min(1, t * 1.3));
        extra.paso = t * Math.PI * 2 * (ms / 1000) * 1.6;
        // Los últimos pasos se frenan y vuelve a la pose
        extra.caminar = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;
      }, () => { extra.caminar = 0; extra.paso = 0; R.raiz.position.set(0, 0, 0); R.raiz.rotation.y = -0.3; });
    },
    /** Mueve la boca mientras suena la voz */
    hablar(si) {
      tareas.forEach((t) => { if (t.boca) tareas.delete(t); });
      if (!si) { extra.boca = 0; dibujar(); return; }
      const t0 = performance.now();
      const tarea = (ahora) => { const s = (ahora - t0) / 1000; extra.boca = 0.5 + 0.5 * Math.sin(s * 15) * Math.sin(s * 4.3 + 1); return true; };
      tarea.boca = true;
      tareas.add(tarea);
      dibujar();
    },
    destruir() {
      vivo = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      escena.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry.dispose();
        for (const m of [].concat(o.material)) { m.map?.dispose(); m.alphaMap?.dispose(); m.dispose(); }
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
