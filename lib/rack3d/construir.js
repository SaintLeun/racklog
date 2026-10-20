// Geometria 3D de los racks (three.js), a partir de lib/rack3d/medidas.js. Adaptado del
// modelador de la intranet (components/Scene3D.jsx): mismo perfil de pilar, arriostramiento en
// zigzag, vigas naranja Racklog y pallets instanciados; sin perforaciones ni cotas.
// Cada funcion devuelve un THREE.Group con el piso en y = 0 y centrado en x/z.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { huella, SEPARACION_DOBLE } from './medidas.js';

const MAT_RACK = {
  pilar: { color: '#b9bec4', metalness: 0.8, roughness: 0.34 },
  viga: { color: '#f97316', metalness: 0.3, roughness: 0.42 },
};
const MADERA = { color: 0xba8a4e, roughness: 0.85, metalness: 0.02 };
const CARTON = { color: 0xcaa46a, roughness: 0.85, metalness: 0.02 };
const ANRA_AZUL = 0x2563eb;
const ANRA_GALV = 0xaab0b6;

// Logo Racklog a color impreso en las cajas de los pallets (como el modelador de la intranet).
// Se carga una vez; el visor espera cargarLogo() antes de dibujar para que salga desde el inicio.
const LOGO_URL = '/assets/images/logo.webp';
let logo = null;
let logoListo = null;
export function cargarLogo() {
  if (!logoListo) {
    logoListo = new Promise((ok) => {
      const img = new Image();
      img.onload = () => { logo = img; ok(); };
      img.onerror = () => ok();   // sin logo: caja lisa
      img.src = LOGO_URL;
    });
  }
  return logoListo;
}

// Cara lateral de la caja: carton con solapas y el logo centrado (512 px por metro, tope 1024)
function caraImpresa(anchoM, altoM, fondo = '#caa46a') {
  const esc = Math.min(1, 1024 / (Math.max(anchoM, altoM) * 512));
  const c = document.createElement('canvas');
  c.width = Math.max(16, Math.round(anchoM * 512 * esc));
  c.height = Math.max(16, Math.round(altoM * 512 * esc));
  const x = c.getContext('2d');
  x.fillStyle = fondo;
  x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = 'rgba(120, 85, 40, 0.10)';
  x.fillRect(0, c.height * 0.06, c.width, 2);
  x.fillRect(0, c.height * 0.94, c.width, 2);
  if (logo) {
    // Sobre una etiqueta blanca: el naranjo del logo no se lee directo sobre el carton
    const lw = c.width * 0.72, lh = lw * logo.naturalHeight / logo.naturalWidth;
    const pad = lw * 0.06, ex = (c.width - lw) / 2 - pad, ey = c.height * 0.42 - lh / 2 - pad;
    x.fillStyle = '#fbfaf7';
    x.beginPath();
    x.roundRect(ex, ey, lw + pad * 2, lh + pad * 2, pad);
    x.fill();
    x.drawImage(logo, (c.width - lw) / 2, c.height * 0.42 - lh / 2, lw, lh);
  }
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 8;
  return new THREE.MeshStandardMaterial({ ...CARTON, color: 0xffffff, map: tx });
}

// Materiales de una caja (orden de BoxGeometry: +x, −x, +y, −y, +z, −z): logo en los 4 lados
// `color` (CSS) tine la carga de ese nivel; la tarima de madera no cambia
function materialesCaja(anchoX, alto, fondoZ, color = null) {
  const base = color ? { ...CARTON, color } : CARTON;
  if (typeof document === 'undefined') return new THREE.MeshStandardMaterial(base);
  const liso = new THREE.MeshStandardMaterial(base);
  const lx = caraImpresa(fondoZ, alto, color || undefined), lz = caraImpresa(anchoX, alto, color || undefined);
  return [lx, lx, liso, liso, lz, lz];
}

const Y = new THREE.Vector3(0, 1, 0);
const UNO = new THREE.Vector3(1, 1, 1);

// Perfil del pilar selectivo visto desde arriba (100 mm de frente, 105 de fondo, plancha de 3 mm)
function perfilPilar() {
  const bAncho = 0.1, bProf = 0.105, cuello = 0.055, yCuello = 0.075, pieAncho = 0.14, pieAlto = 0.01, esp = 0.003, r = 0.006;
  const hx = bAncho / 2, cx = cuello / 2, px = pieAncho / 2;
  const yTop = bProf, yNeck = yCuello + pieAlto, yPieTop = pieAlto;
  const s = new THREE.Shape();
  s.moveTo(px, 0);
  s.lineTo(px, yPieTop);
  s.lineTo(cx + esp, yPieTop);
  s.lineTo(cx, yNeck);
  s.lineTo(hx, yTop - r);
  s.quadraticCurveTo(hx, yTop, hx - r, yTop);
  s.lineTo(-hx + r, yTop);
  s.quadraticCurveTo(-hx, yTop, -hx, yTop - r);
  s.lineTo(-cx, yNeck);
  s.lineTo(-cx - esp, yPieTop);
  s.lineTo(-px, yPieTop);
  s.lineTo(-px, 0);
  s.lineTo(-px + esp * 3, 0);
  s.lineTo(-px + esp * 3, yPieTop - esp);
  s.lineTo(-cx, yPieTop - esp);
  s.lineTo(-cx + esp, yNeck - esp);
  s.lineTo(-hx + esp, yTop - r - esp);
  s.quadraticCurveTo(-hx + esp, yTop - esp, -hx + r + esp, yTop - esp);
  s.lineTo(hx - r - esp, yTop - esp);
  s.quadraticCurveTo(hx - esp, yTop - esp, hx - esp, yTop - r - esp);
  s.lineTo(cx - esp, yNeck - esp);
  s.lineTo(cx, yPieTop - esp);
  s.lineTo(px - esp * 3, yPieTop - esp);
  s.lineTo(px - esp * 3, 0);
  s.lineTo(px, 0);
  return s;
}

// Tarima tipo europalet en una sola geometria (se instancia en todas las posiciones)
function geometriaTarima(ancho, fondo) {
  const piezas = [];
  const caja = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); piezas.push(g); };
  const cubierta = 0.022, taco = 0.1, tablas = 6, tw = ancho / (tablas * 1.5);
  for (let i = 0; i < tablas; i++) caja(tw, cubierta, fondo, -ancho / 2 + tw / 2 + i * (ancho - tw) / (tablas - 1), taco + cubierta / 2, 0);
  [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0], [-1, 0], [1, 0]].forEach(([a, b]) => caja(0.1, taco, 0.1, a * (ancho / 2 - 0.06), taco / 2, b * (fondo / 2 - 0.06)));
  [-1, 0, 1].forEach((s) => caja(ancho, cubierta, 0.1, 0, cubierta / 2, s * (fondo / 2 - 0.06)));
  const g = mergeGeometries(piezas, false);
  piezas.forEach((p) => p.dispose());
  return { geometria: g, alto: taco + cubierta };
}

function instanciar(grupo, geometria, material, matrices, sombra = true) {
  if (!matrices.length) return;
  const im = new THREE.InstancedMesh(geometria, material, matrices.length);
  matrices.forEach((m, i) => im.setMatrixAt(i, m));
  im.instanceMatrix.needsUpdate = true;
  im.castShadow = sombra;
  im.receiveShadow = true;
  grupo.add(im);
}

function unir(grupo, geometrias, material) {
  if (!geometrias.length) return;
  const m = new THREE.Mesh(mergeGeometries(geometrias, false), material);
  m.castShadow = true;
  m.receiveShadow = true;
  geometrias.forEach((g) => g.dispose());
  grupo.add(m);
}

// Centra el rack en su huella (no en la caja de la geometria): asi coincide con el plano 2D
function centrar(grupo, m) {
  const { largo, fondo } = huella(m);
  grupo.children.forEach((h) => { h.position.x -= largo / 2; h.position.z -= fondo / 2; });
  return grupo;
}

/** Rack selectivo: marcos con pilar perfilado y zigzag, vigas por nivel y pallets cargados */
export function construirSelectivo(m) {
  const g = new THREE.Group();
  const anchoPilar = 0.1, fondoPilar = 0.105, espViga = 0.055, diagonal = 0.032;
  const altoViga = m.altoViga > 0 ? m.altoViga : 0.1;
  // Cuerpo tunel: en el cuerpo `indice` no hay pallets ni vigas en las `quitadas` alturas de abajo;
  // la primera viga que queda es mas gruesa y de otro tono
  const tunel = m.tunel && m.tunel.quitadas > 0 ? m.tunel : null;
  const altoVigaTunel = tunel?.altoViga > 0 ? tunel.altoViga : altoViga + 0.04;
  const paso = m.viga + anchoPilar;
  const filas = m.doble ? 2 : 1, separacion = SEPARACION_DOBLE;

  const matPilar = new THREE.MeshStandardMaterial(MAT_RACK.pilar);
  const matViga = new THREE.MeshStandardMaterial(MAT_RACK.viga);
  const pilar = new THREE.ExtrudeGeometry(perfilPilar(), { depth: m.alto, bevelEnabled: false });
  pilar.rotateX(-Math.PI / 2);

  // Pallets: 1, 2 o 3 por viga, ancho y fondo reales, separados parejo (~100 mm) dentro de la viga
  const n = Math.max(1, Math.round(m.palletsPorViga || 2));
  const palAncho = Math.min(m.pallet.frente, m.viga / n - 0.05);
  const palFondo = Math.min(m.pallet.fondo, m.fondo - 0.06);
  const hueco = (m.viga - n * palAncho) / (n + 1);
  const tarima = geometriaTarima(palAncho, palFondo);
  // Carga por altura (0 = piso, i = sobre la viga i): alto propio de cada una, sin pasar la viga de arriba
  const niveles = [{ y: 0, piso: true }, ...m.nivelesY.map((y) => ({ y, piso: false }))];
  const cargas = niveles.map(({ y, piso }, i) => {
    const base = piso ? 0 : y + altoViga / 2;
    const arriba = m.nivelesY[i];   // viga siguiente (no hay en la altura superior)
    const pedido = (m.altosCarga?.[i] ?? m.pallet.alto) - tarima.alto;
    const tope = arriba !== undefined ? arriba - altoViga / 2 - base - tarima.alto - 0.06 : Infinity;
    return { base, alto: Math.max(0.12, Math.min(pedido, tope)), color: m.coloresCarga?.[i] || null };
  });
  // Una malla instanciada por combinacion alto + color
  const grupos = new Map();

  const matsPilar = [], diagonales = [], vigas = [], vigasTunel = [], matsTarima = [];

  for (let f = 0; f < filas; f++) {
    const z0 = f * (m.fondo + separacion);
    // Marcos
    for (let i = 0; i <= m.cuerpos; i++) {
      const x = i * paso + anchoPilar / 2;
      [[z0 + fondoPilar / 2, 0], [z0 + m.fondo - fondoPilar / 2, Math.PI]].forEach(([z, giro]) => {
        matsPilar.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(Y, giro), UNO));
      });
      const tramos = Math.max(4, Math.round(m.alto / 0.9)), y0 = 0.08, dy = (m.alto - 0.16) / tramos;
      const za = z0 + fondoPilar / 2, zb = z0 + m.fondo - fondoPilar / 2;
      for (let k = 0; k < tramos; k++) {
        const a = new THREE.Vector3(x, y0 + k * dy, k % 2 ? zb : za);
        const b = new THREE.Vector3(x, y0 + (k + 1) * dy, k % 2 ? za : zb);
        const dir = b.clone().sub(a);
        const d = new THREE.BoxGeometry(diagonal, dir.length(), diagonal);
        d.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(Y, dir.normalize()), UNO));
        diagonales.push(d);
      }
    }
    // Vigas y pallets por modulo
    for (let c = 0; c < m.cuerpos; c++) {
      const xc = c * paso + anchoPilar + m.viga / 2;
      const enTunel = tunel && c === tunel.indice;
      niveles.forEach(({ y, piso }, i) => {
        if (enTunel && i < tunel.quitadas) return;   // paso libre: sin viga ni pallet
        const gruesa = enTunel && i === tunel.quitadas;
        const av = gruesa ? altoVigaTunel : altoViga;
        if (!piso) [z0 + fondoPilar / 2, z0 + m.fondo - fondoPilar / 2].forEach((z) => {
          const v = new THREE.BoxGeometry(m.viga, av, espViga);
          v.translate(xc, y, z);
          (gruesa ? vigasTunel : vigas).push(v);
        });
        const { alto: altoCarga, color } = cargas[i];
        const base = piso ? 0 : y + av / 2;
        const clave = `${altoCarga.toFixed(3)}|${color ?? ''}`;
        if (!grupos.has(clave)) grupos.set(clave, { alto: altoCarga, color, mats: [] });
        const matsCarga = grupos.get(clave).mats;
        for (let p = 0; p < n; p++) {
          const x = xc - m.viga / 2 + hueco * (p + 1) + palAncho * (p + 0.5);
          const zc = z0 + m.fondo / 2;
          matsTarima.push(new THREE.Matrix4().makeTranslation(x, base, zc));
          matsCarga.push(new THREE.Matrix4().makeTranslation(x, base + tarima.alto + altoCarga / 2, zc));
        }
      });
    }
  }

  instanciar(g, pilar, matPilar, matsPilar);
  unir(g, diagonales, matPilar);
  unir(g, vigas, matViga);
  unir(g, vigasTunel, new THREE.MeshStandardMaterial({ ...MAT_RACK.viga, color: '#c2410c' }));
  instanciar(g, tarima.geometria, new THREE.MeshStandardMaterial(MADERA), matsTarima);
  grupos.forEach(({ alto, color, mats }) => {
    instanciar(g, new THREE.BoxGeometry(palAncho * 0.92, alto, palFondo * 0.92), materialesCaja(palAncho * 0.92, alto, palFondo * 0.92, color), mats);
  });
  return centrar(g, m);
}

// Angulos L y bandejas de una estanteria ANRA: `x0`, `z0` esquina, entre `base` y `base + alto`
function estanteria(angulos, bandejas, { cuerpos, frente, fondo, doble, x0 = 0, z0 = 0, base = 0, alto, nivelesY }) {
  const ala = 0.038, esp = 0.002, espBandeja = 0.04;
  for (let f = 0; f < (doble ? 2 : 1); f++) {
    const zf = z0 + f * fondo;
    for (let i = 0; i <= cuerpos; i++) {
      const x = x0 + i * frente;
      [[zf, 1], [zf + fondo, -1]].forEach(([z, sz]) => {
        // Un angulo por cara del marco; los del medio sirven a los dos cuerpos vecinos
        [-1, 1].forEach((sx) => {
          if ((i === 0 && sx === -1) || (i === cuerpos && sx === 1)) return;
          const alaX = new THREE.BoxGeometry(ala, alto, esp);
          alaX.translate(x + sx * (ala / 2), base + alto / 2, z + sz * esp / 2);
          const alaZ = new THREE.BoxGeometry(esp, alto, ala);
          alaZ.translate(x + sx * esp / 2, base + alto / 2, z + sz * ala / 2);
          angulos.push(alaX, alaZ);
        });
      });
    }
    for (let c = 0; c < cuerpos; c++) {
      nivelesY.forEach((y) => {
        const bd = new THREE.BoxGeometry(frente - esp * 2, espBandeja, fondo - esp * 2);
        bd.translate(x0 + c * frente + frente / 2, y, zf + fondo / 2);
        bandejas.push(bd);
      });
    }
  }
}

function materialesAnra(galvanizado) {
  return {
    angulo: new THREE.MeshStandardMaterial(galvanizado
      ? { color: ANRA_GALV, metalness: 0.8, roughness: 0.34 }
      : { color: ANRA_AZUL, metalness: 0.3, roughness: 0.42 }),
    bandeja: new THREE.MeshStandardMaterial({ color: ANRA_GALV, metalness: 0.7, roughness: 0.42 }),
  };
}

/** Estanteria de angulo ranurado: angulos L en cada esquina y bandejas por nivel */
export function construirAnra(m) {
  const g = new THREE.Group();
  const mat = materialesAnra(m.galvanizado);
  const angulos = [], bandejas = [];
  estanteria(angulos, bandejas, m);
  unir(g, angulos, mat.angulo);
  unir(g, bandejas, mat.bandeja);
  return centrar(g, m);
}

// Barra entre dos puntos (diagonales, zancas): una caja girada, para juntar con unir()
function barra(a, b, grosor) {
  const dir = b.clone().sub(a);
  const geo = new THREE.BoxGeometry(grosor, dir.length(), grosor);
  geo.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(Y, dir.normalize()), UNO));
  return geo;
}

function caja(w, h, d, x, y, z) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(x, y, z);
  return geo;
}

/** Drive-in: grilla de pilares, rieles por calle y nivel, vigas arriba y pallets en fondo */
export function construirDriveIn(m) {
  const g = new THREE.Group();
  const pilar = 0.1, fondo = m.fondos * m.moduloFondo, alto = m.alto;
  const xs = Array.from({ length: m.calles + 1 }, (_, i) => pilar / 2 + i * m.anchoCalle);
  // Un marco cada dos pallets de fondo (los extremos siempre)
  const zs = [...new Set([...Array.from({ length: Math.floor(m.fondos / 2) + 1 }, (_, j) => j * 2 * m.moduloFondo), fondo])]
    .map((z) => Math.min(fondo - pilar / 2, Math.max(pilar / 2, z)));

  const pilares = [], riostras = [], rieles = [], cartelas = [], vigas = [];
  xs.forEach((x) => {
    zs.forEach((z) => pilares.push(caja(pilar, alto, pilar, x, alto / 2, z)));
    for (let k = 0; k + 1 < zs.length; k++) {
      const za = zs[k], zb = zs[k + 1], y0 = 0.15, y1 = alto - 0.15, n = Math.max(2, Math.round((y1 - y0) / 0.9));
      riostras.push(barra(new THREE.Vector3(x, y0, za), new THREE.Vector3(x, y0, zb), 0.03));
      riostras.push(barra(new THREE.Vector3(x, y1, za), new THREE.Vector3(x, y1, zb), 0.03));
      for (let d = 0; d < n; d++) {
        const ya = y0 + ((y1 - y0) * d) / n, yb = y0 + ((y1 - y0) * (d + 1)) / n;
        riostras.push(barra(new THREE.Vector3(x, ya, d % 2 ? zb : za), new THREE.Vector3(x, yb, d % 2 ? za : zb), 0.03));
      }
    }
  });
  // Rieles (gris) sobre cartelas (naranja) a cada lado de la calle, en cada nivel elevado
  for (let c = 0; c < m.calles; c++) {
    m.cartelasY.forEach((y) => {
      [[xs[c], 1], [xs[c + 1], -1]].forEach(([x, s]) => {
        rieles.push(caja(0.05, 0.1, fondo, x + s * 0.16, y - 0.05, fondo / 2));
        zs.forEach((z) => cartelas.push(caja(0.22, 0.12, pilar, x + s * 0.11, y - 0.06, z)));
      });
    });
  }
  zs.forEach((z) => vigas.push(caja(xs[xs.length - 1] - xs[0] + pilar, 0.1, 0.06, (xs[0] + xs[xs.length - 1]) / 2, alto - 0.05, z)));

  const matPilar = new THREE.MeshStandardMaterial(MAT_RACK.pilar);
  const matViga = new THREE.MeshStandardMaterial(MAT_RACK.viga);
  unir(g, pilares, matPilar);
  unir(g, riostras, matPilar);
  unir(g, rieles, new THREE.MeshStandardMaterial({ ...MAT_RACK.pilar, color: '#8a8f96' }));
  unir(g, cartelas, matViga);
  unir(g, vigas, matViga);
  unir(g, vigasTunel, new THREE.MeshStandardMaterial({ ...MAT_RACK.viga, color: '#c2410c' }));

  // Pallets: uno por calle, fondo y nivel (el primero a piso, los demas sobre los rieles)
  const palAncho = Math.min(m.pallet.frente, m.anchoCalle - 0.25), palFondo = Math.min(m.pallet.fondo, m.moduloFondo - 0.05);
  const tarima = geometriaTarima(palAncho, palFondo);
  const altoCarga = m.pallet.alto - tarima.alto - 0.05;
  const mT = [], mC = [];
  for (let c = 0; c < m.calles; c++) {
    const x = (xs[c] + xs[c + 1]) / 2;
    for (let j = 0; j < m.fondos; j++) {
      const z = (j + 0.5) * m.moduloFondo;
      [0, ...m.cartelasY].forEach((y) => {
        mT.push(new THREE.Matrix4().makeTranslation(x, y, z));
        mC.push(new THREE.Matrix4().makeTranslation(x, y + tarima.alto + altoCarga / 2, z));
      });
    }
  }
  instanciar(g, tarima.geometria, new THREE.MeshStandardMaterial(MADERA), mT);
  instanciar(g, carga, materialesCaja(palAncho * 0.92, altoCarga, palFondo * 0.92), mC);
  return centrar(g, m);
}

/** Libera geometrias y materiales de un grupo construido aqui */
export function liberar(objeto) {
  objeto.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) [].concat(o.material).forEach((mt) => { mt.map?.dispose(); mt.dispose(); });
  });
}
