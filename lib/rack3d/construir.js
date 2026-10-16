// Geometria 3D de los racks (three.js), a partir de lib/rack3d/medidas.js. Adaptado del
// modelador de la intranet (components/Scene3D.jsx): mismo perfil de pilar, arriostramiento en
// zigzag, vigas naranja Racklog y pallets instanciados; sin perforaciones ni cotas.
// Cada funcion devuelve un THREE.Group con el piso en y = 0 y centrado en x/z.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const MAT_RACK = {
  pilar: { color: '#b9bec4', metalness: 0.8, roughness: 0.34 },
  viga: { color: '#f97316', metalness: 0.3, roughness: 0.42 },
};
const MADERA = { color: 0xba8a4e, roughness: 0.85, metalness: 0.02 };
const CARTON = { color: 0xcaa46a, roughness: 0.85, metalness: 0.02 };
const ANRA_AZUL = 0x2563eb;
const ANRA_GALV = 0xaab0b6;

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

function centrar(grupo) {
  const caja = new THREE.Box3().setFromObject(grupo);
  const c = caja.getCenter(new THREE.Vector3());
  grupo.children.forEach((h) => { h.position.x -= c.x; h.position.z -= c.z; });
  return grupo;
}

/** Rack selectivo: marcos con pilar perfilado y zigzag, vigas por nivel y pallets cargados */
export function construirSelectivo(m) {
  const g = new THREE.Group();
  const anchoPilar = 0.1, fondoPilar = 0.105, altoViga = 0.1, espViga = 0.055, diagonal = 0.032;
  const paso = m.viga + anchoPilar;
  const filas = m.doble ? 2 : 1, separacion = 0.08;

  const matPilar = new THREE.MeshStandardMaterial(MAT_RACK.pilar);
  const matViga = new THREE.MeshStandardMaterial(MAT_RACK.viga);
  const pilar = new THREE.ExtrudeGeometry(perfilPilar(), { depth: m.alto, bevelEnabled: false });
  pilar.rotateX(-Math.PI / 2);

  // Pallets: ancho y fondo reales, separados parejo dentro de la viga
  const n = m.palletsPorViga;
  const palAncho = Math.min(m.pallet.frente, m.viga / n - 0.05);
  const palFondo = Math.min(m.pallet.fondo, m.fondo - 0.06);
  const hueco = (m.viga - n * palAncho) / (n + 1);
  const tarima = geometriaTarima(palAncho, palFondo);
  const nivelPaso = m.nivelesY.length > 1 ? m.nivelesY[1] - m.nivelesY[0] : m.nivelesY[0];
  const altoCarga = Math.max(0.12, Math.min(m.pallet.alto - tarima.alto, nivelPaso - altoViga - tarima.alto - 0.06));
  const carga = new THREE.BoxGeometry(palAncho * 0.92, altoCarga, palFondo * 0.92);

  const matsPilar = [], diagonales = [], vigas = [], matsTarima = [], matsCarga = [];
  const niveles = [{ y: 0, piso: true }, ...m.nivelesY.map((y) => ({ y, piso: false }))];

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
      niveles.forEach(({ y, piso }) => {
        if (!piso) [z0 + fondoPilar / 2, z0 + m.fondo - fondoPilar / 2].forEach((z) => {
          const v = new THREE.BoxGeometry(m.viga, altoViga, espViga);
          v.translate(xc, y, z);
          vigas.push(v);
        });
        const base = piso ? 0 : y + altoViga / 2;
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
  instanciar(g, tarima.geometria, new THREE.MeshStandardMaterial(MADERA), matsTarima);
  instanciar(g, carga, new THREE.MeshStandardMaterial(CARTON), matsCarga);
  return centrar(g);
}

/** Estanteria de angulo ranurado: angulos L en cada esquina y bandejas por nivel */
export function construirAnra(m) {
  const g = new THREE.Group();
  const ala = 0.038, esp = 0.002, espBandeja = 0.04;
  const filas = m.doble ? 2 : 1;
  const matAngulo = new THREE.MeshStandardMaterial(m.galvanizado
    ? { color: ANRA_GALV, metalness: 0.8, roughness: 0.34 }
    : { color: ANRA_AZUL, metalness: 0.3, roughness: 0.42 });
  const matBandeja = new THREE.MeshStandardMaterial({ color: ANRA_GALV, metalness: 0.7, roughness: 0.42 });

  const angulos = [], bandejas = [];
  for (let f = 0; f < filas; f++) {
    const z0 = f * m.fondo;
    for (let i = 0; i <= m.cuerpos; i++) {
      const x = i * m.frente;
      [[z0, 1], [z0 + m.fondo, -1]].forEach(([z, sz]) => {
        // Un angulo por cara del marco; los del medio sirven a los dos cuerpos vecinos
        [-1, 1].forEach((sx) => {
          if ((i === 0 && sx === -1) || (i === m.cuerpos && sx === 1)) return;
          const xa = x + sx * (ala / 2);
          const alaX = new THREE.BoxGeometry(ala, m.alto, esp);
          alaX.translate(xa, m.alto / 2, z + sz * esp / 2);
          const alaZ = new THREE.BoxGeometry(esp, m.alto, ala);
          alaZ.translate(x + sx * esp / 2, m.alto / 2, z + sz * ala / 2);
          angulos.push(alaX, alaZ);
        });
      });
    }
    for (let c = 0; c < m.cuerpos; c++) {
      m.nivelesY.forEach((y) => {
        const b = new THREE.BoxGeometry(m.frente - esp * 2, espBandeja, m.fondo - esp * 2);
        b.translate(c * m.frente + m.frente / 2, y, z0 + m.fondo / 2);
        bandejas.push(b);
      });
    }
  }
  unir(g, angulos, matAngulo);
  unir(g, bandejas, matBandeja);
  return centrar(g);
}

/** Libera geometrias y materiales de un grupo construido aqui */
export function liberar(objeto) {
  objeto.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) [].concat(o.material).forEach((mt) => mt.dispose());
  });
}
