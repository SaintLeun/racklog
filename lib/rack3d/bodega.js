// Escena 3D del planificador: piso con la forma de la bodega, muros bajos, elementos (pilares, oficinas,
// andenes, portones, zonas, pasillos y grúas) y los racks en su lugar.
// Planta 2D → 3D: x se mantiene y la y del plano es la z de la escena.
import * as THREE from 'three';
import { construirSelectivo, construirAnra, construirDriveIn } from './construir.js';
import { medidasRack, contorno, caja, rectangulo, rectElemento, puntoDentro } from './planificador.js';
import { grua, persona, materialesEquipos } from './equipos.js';
import { planOperacion, animarOperacion } from './operar3d.js';

const PISO = '#fbfbfc';
const MURO = '#dfe3e8';
const LINEA = '#c3cad3';

const CONSTRUIR = { selectivo: construirSelectivo, anra: construirAnra, drivein: construirDriveIn };

// Cuadricula de 1 m como textura: el piso usa coordenadas en metros, asi se repite una vez por metro
function texturaGrilla() {
  const n = 256, cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = PISO;
  ctx.fillRect(0, 0, n, n);
  // Concreto pulido: moteado muy tenue
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(120,124,130,0.05)' : 'rgba(255,255,255,0.35)';
    const r = 0.5 + Math.random() * 1.6;
    ctx.fillRect(Math.random() * n, Math.random() * n, r, r);
  }
  ctx.fillStyle = LINEA;
  ctx.fillRect(0, 0, n, 6);
  ctx.fillRect(0, 0, 6, n);
  const tx = new THREE.CanvasTexture(cv);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 4;
  return tx;
}

export function construirBodega(bodega, racks) {
  const g = new THREE.Group();
  const poly = contorno(bodega);

  // Piso: la forma en XY con y negativa; al acostarlo (−90° en X) la y del plano queda como z
  const forma = new THREE.Shape(poly.map((p) => new THREE.Vector2(p.x, -p.y)));
  const geoPiso = new THREE.ShapeGeometry(forma);
  geoPiso.rotateX(-Math.PI / 2);
  // ShapeGeometry da UV = coordenadas de la forma (m): la textura se repite cada metro
  const piso = new THREE.Mesh(geoPiso, new THREE.MeshStandardMaterial({ map: texturaGrilla(), roughness: 0.9 }));
  piso.position.y = 0.005;
  piso.receiveShadow = true;
  g.add(piso);

  // Muros bajos (1,2 m) en cada lado, para dar contexto sin tapar los racks
  const altoMuro = 1.2, esp = 0.15;
  const matMuro = new THREE.MeshStandardMaterial({ color: MURO, roughness: 0.95, transparent: true, opacity: 0.75 });
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const largo = Math.hypot(b.x - a.x, b.y - a.y);
    if (largo < 0.01) return;
    const m = new THREE.Mesh(new THREE.BoxGeometry(largo + esp, altoMuro, esp), matMuro);
    m.position.set((a.x + b.x) / 2, altoMuro / 2, (a.y + b.y) / 2);
    m.rotation.y = -Math.atan2(b.y - a.y, b.x - a.x);
    m.receiveShadow = true;
    g.add(m);
  });

  const elementos = bodega.elementos ?? [];
  const mats = materiales();
  elementos.forEach((e) => { const o = elemento3D(e, bodega.altura, mats); if (o) g.add(o); });
  // Persona y grua en espacios libres de verdad (con la huella de racks y elementos), junto al porton si hay.
  // Si el usuario ya puso sus grúas en el plano no se agrega la automatica
  const porton = elementos.find((e) => e.clase === 'porton' || e.clase === 'anden');
  const c0 = caja(poly);
  const ref = porton ? { x: porton.x, y: porton.y } : { x: c0.x0, y: c0.y1 };
  const yo = persona(mats);
  const pYo = lugarLibre3D(poly, racks, elementos, ref, 0.6);
  if (pYo) { yo.position.set(pYo.x, 0, pYo.y); g.add(yo); }
  // Si hay un pasillo que cumple frente a un selectivo o drive-in, la grua opera ahi (ver operar3d.js);
  // si no, queda estacionada junto al porton
  const plan = planOperacion(bodega, racks);
  const pGrua = plan || elementos.some((e) => e.clase === 'grua') ? null : lugarLibre3D(poly, racks, elementos, pYo ?? ref, 1.6, pYo);
  if (pGrua) {
    const montacargas = grua(bodega.grua, mats);
    montacargas.position.set(pGrua.x, 0, pGrua.y);
    const centro = { x: (c0.x0 + c0.x1) / 2, y: (c0.y0 + c0.y1) / 2 };
    // Horquillas (−z local) mirando al centro de la bodega
    montacargas.rotation.y = Math.atan2(pGrua.x - centro.x, pGrua.y - centro.y);
    g.add(montacargas);
  }

  racks.forEach((r) => {
    const m = medidasRack(r);
    if (plan && plan.rackId === r.id) m.hueco = plan.hueco;
    const rack = CONSTRUIR[m.tipo](m);
    rack.position.set(r.x, 0, r.y);
    rack.rotation.y = -((r.rot || 0) * Math.PI) / 180;
    rack.userData.rackId = r.id;   // el visor lo usa para arrastrarlo
    g.add(rack);
    if (plan && plan.rackId === r.id) {
      const animar = animarOperacion(g, plan, rack, grua(plan.modelo, mats), mats);
      // El visor la llama en cada cuadro mientras la operacion este encendida
      if (animar) g.userData.animar = animar;
    }
  });
  return g;
}

// Punto libre mas cercano a `ref`: dentro de la bodega, a `radio` m de racks, elementos, muros y de `evitar`
function lugarLibre3D(poly, racks, elementos, ref, radio, evitar = null) {
  const c = caja(poly), rects = [...racks.map(rectangulo), ...elementos.map(rectElemento)];
  const libre = (x, y) => puntoDentro({ x, y }, poly)
    && [[radio, 0], [-radio, 0], [0, radio], [0, -radio]].every(([dx, dy]) => puntoDentro({ x: x + dx, y: y + dy }, poly))
    && rects.every((q) => x < q.x0 - radio || x > q.x0 + q.ancho + radio || y < q.y0 - radio || y > q.y0 + q.alto + radio)
    && (!evitar || Math.hypot(evitar.x - x, evitar.y - y) > radio + 1.2);
  // Paso de 0,5 m en bodegas normales; mas grueso en las muy grandes (a lo mas ~80 × 80 puntos)
  const paso = Math.max(0.5, Math.max(c.x1 - c.x0, c.y1 - c.y0) / 80);
  let mejor = null, dMejor = Infinity;
  for (let y = c.y0 + paso / 2; y < c.y1; y += paso) {
    for (let x = c.x0 + paso / 2; x < c.x1; x += paso) {
      const d = Math.hypot(x - ref.x, y - ref.y);
      if (d < dMejor && libre(x, y)) { mejor = { x, y }; dMejor = d; }
    }
  }
  return mejor;
}

// ─── Materiales compartidos de una escena (se liberan junto con ella) ───
function materiales() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  return {
    ...materialesEquipos(),
    naranjo: std({ color: 0xf97316, roughness: 0.55 }),
    amarillo: std({ color: 0xfacc15, roughness: 0.55 }),
    negro: std({ color: 0x27272a, roughness: 0.7 }),
    goma: std({ color: 0x18181b, roughness: 0.95 }),
    acero: std({ color: 0x8b9099, metalness: 0.6, roughness: 0.4 }),
    asiento: std({ color: 0x3f3f46, roughness: 0.8 }),
    hormigon: std({ color: 0x9ca3af, roughness: 0.95 }),
    hormigonClaro: std({ color: 0xc7cbd1, roughness: 0.92 }),
    placa: std({ color: 0x6b7280, metalness: 0.7, roughness: 0.45 }),
    muro: std({ color: 0xf1f2f4, roughness: 0.9 }),
    zocalo: std({ color: 0x64748b, roughness: 0.8 }),
    marco: std({ color: 0x475569, metalness: 0.5, roughness: 0.45 }),
    techo: std({ color: 0xe5e7eb, roughness: 0.85 }),
    vidrio: new THREE.MeshPhysicalMaterial({ color: 0x9ec9e6, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.38, depthWrite: false }),
    puerta: std({ color: 0x7c3aed, roughness: 0.6 }),
    madera: std({ color: 0xba8a4e, roughness: 0.85, metalness: 0.02 }),
    carton: std({ color: 0xcaa46a, roughness: 0.85, metalness: 0.02 }),
  };
}

// ─── Texturas de canvas ───
function texturaCanvas(n, dibujar, { repetir = true } = {}) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = n;
  dibujar(cv.getContext('2d'), n);
  const tx = new THREE.CanvasTexture(cv);
  if (repetir) tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 8;
  return tx;
}
// Franjas diagonales a 45° que empalman al repetir (n franjas por cuadro)
function franjasDiagonales(ctx, n, fondo, franja, k = 4, ancho = 0.5) {
  if (fondo) { ctx.fillStyle = fondo; ctx.fillRect(0, 0, n, n); } else ctx.clearRect(0, 0, n, n);
  ctx.fillStyle = franja;
  const p = n / k;
  for (let i = -k; i <= 2 * k; i++) {
    ctx.beginPath();
    ctx.moveTo(i * p, 0);
    ctx.lineTo(i * p + p * ancho, 0);
    ctx.lineTo(i * p + p * ancho - n, n);
    ctx.lineTo(i * p - n, n);
    ctx.closePath();
    ctx.fill();
  }
}
const texSeguridad = () => texturaCanvas(64, (c, n) => franjasDiagonales(c, n, '#facc15', '#111827', 2));

// Plano horizontal marcado en el piso. Ejes locales: x = largo (sentido de marcha), z = ancho
function planoPiso(largo, ancho, material, y = 0.012) {
  const geo = new THREE.PlaneGeometry(largo, ancho);
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, material);
  m.position.y = y;
  m.receiveShadow = true;
  m.renderOrder = 1;
  return m;
}
const matMarca = (o) => new THREE.MeshStandardMaterial({
  roughness: 0.85, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o,
});

// Grupo orientado por el lado largo del elemento: devuelve { g, largo, ancho } con x local = lado largo
function orientado(e) {
  const g = new THREE.Group();
  g.position.set(e.x, 0, e.y);
  const vertical = e.alto > e.ancho;
  if (vertical) g.rotation.y = Math.PI / 2;
  return { g, largo: Math.max(e.ancho, e.alto), ancho: Math.min(e.ancho, e.alto) };
}

function bloque(grupo, w, h, d, x, y, z, mat, sombra = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = sombra;
  m.receiveShadow = true;
  grupo.add(m);
  return m;
}
// ─── Elementos de la bodega ───
function elemento3D(e, altura, mats = materiales()) {
  const H = altura > 0 ? altura : 6;
  switch (e.clase) {
    case 'pilar': {
      // Columna de hormigon con placa base y protector amarillo/negro hasta 1 m
      const g = new THREE.Group();
      g.position.set(e.x, 0, e.y);
      bloque(g, e.ancho, H, e.alto, 0, H / 2, 0, mats.hormigon);
      bloque(g, e.ancho + 0.12, 0.03, e.alto + 0.12, 0, 0.015, 0, mats.placa, false);
      const tx = texSeguridad();
      tx.repeat.set(Math.max(1, Math.round((e.ancho + e.alto) * 2 / 0.25)) / 2, 2);
      const prot = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.6 });
      bloque(g, e.ancho + 0.04, 1.0, e.alto + 0.04, 0, 0.53, 0, [prot, prot, mats.amarillo, mats.amarillo, prot, prot]);
      return g;
    }
    case 'oficina':
      return oficina(e, mats);
    case 'anden':
      return anden(e, mats);
    case 'porton':
      return porton(e, H, mats);
    case 'zona': {
      const { g, largo, ancho } = orientado(e);
      const tx = texturaCanvas(128, (c, n) => {
        franjasDiagonales(c, n, 'rgba(254,226,226,0.55)', 'rgba(220,38,38,0.75)', 4, 0.32);
      });
      tx.repeat.set(largo / 1.2, ancho / 1.2);
      g.add(planoPiso(largo, ancho, matMarca({ map: tx })));
      const borde = matMarca({ color: 0xdc2626 });
      [-1, 1].forEach((s) => {
        const a = planoPiso(largo, 0.08, borde, 0.014);
        a.position.z = s * (ancho / 2 - 0.04);
        const b = planoPiso(0.08, ancho - 0.16, borde, 0.014);
        b.position.x = s * (largo / 2 - 0.04);
        g.add(a, b);
      });
      return g;
    }
    case 'pasilloGrua': {
      const { g, largo, ancho } = orientado(e);
      // Relleno ambar tenue con flechas de sentido por el centro
      const tx = texturaCanvas(128, (c, n) => {
        c.fillStyle = 'rgba(253,230,138,0.35)';
        c.fillRect(0, 0, n, n);
        c.strokeStyle = 'rgba(217,119,6,0.75)';
        c.lineWidth = n * 0.07;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(n * 0.38, n * 0.3); c.lineTo(n * 0.62, n * 0.5); c.lineTo(n * 0.38, n * 0.7);
        c.stroke();
      });
      tx.wrapT = THREE.ClampToEdgeWrapping;
      tx.repeat.set(Math.max(1, Math.round(largo / 3)), 1);
      // Las flechas ocupan ~1 m al centro: la textura cubre una franja central y el resto es relleno
      g.add(planoPiso(largo, ancho, matMarca({ color: 0xfde68a, opacity: 0.35 }), 0.011));
      g.add(planoPiso(largo, Math.min(ancho * 0.6, 1.2), matMarca({ map: tx }), 0.012));
      const linea = matMarca({ color: 0xf59e0b, roughness: 0.6 });
      [-1, 1].forEach((s) => {
        const l = planoPiso(largo, 0.1, linea, 0.013);
        l.position.z = s * (ancho / 2 - 0.08);
        g.add(l);
      });
      return g;
    }
    case 'pasilloPeatonal': {
      const { g, largo, ancho } = orientado(e);
      // Cebra perpendicular al sentido de marcha (franjas cada 0,5 m) sobre verde
      const tx = texturaCanvas(64, (c, n) => {
        c.fillStyle = 'rgba(34,197,94,0.55)';
        c.fillRect(0, 0, n, n);
        c.fillStyle = 'rgba(240,253,244,0.95)';
        c.fillRect(n * 0.5, n * 0.0, n * 0.5, n);
      });
      tx.repeat.set(largo / 1.0, 1);
      g.add(planoPiso(largo, ancho - 0.16, matMarca({ map: tx }), 0.012));
      const linea = matMarca({ color: 0x16a34a, roughness: 0.6 });
      [-1, 1].forEach((s) => {
        const l = planoPiso(largo, 0.08, linea, 0.013);
        l.position.z = s * (ancho / 2 - 0.04);
        g.add(l);
      });
      return g;
    }
    case 'grua': {
      const { g, largo, ancho } = orientado(e);
      // El modelo se arma a lo largo de z: se gira para que su largo quede en el x local (lado largo)
      const m = grua(e.modelo, mats, { ancho, largo });
      m.rotation.y = Math.PI / 2;   // horquillas (−z) hacia −x local
      g.add(m);
      return g;
    }
  }
  return null;
}

// Muro de largo L (x local, centrado) y alto H con huecos { a, b, y0, y1 }; los de y0 > 0 llevan vidrio
function muro(L, H, esp, huecos, mats) {
  const g = new THREE.Group();
  const cortes = [...new Set([-L / 2, L / 2, ...huecos.flatMap((h) => [h.a, h.b])])].sort((p, q) => p - q);
  for (let i = 0; i < cortes.length - 1; i++) {
    const a = cortes[i], b = cortes[i + 1], xm = (a + b) / 2;
    if (b - a < 1e-3) continue;
    const tapa = huecos.filter((h) => h.a <= xm && xm <= h.b).sort((p, q) => p.y0 - q.y0);
    let y = 0;
    [...tapa, { y0: H, y1: H }].forEach((h) => {
      if (h.y0 - y > 1e-3) bloque(g, b - a, h.y0 - y, esp, xm, (y + h.y0) / 2, 0, mats.muro);
      y = Math.max(y, h.y1);
    });
  }
  huecos.filter((h) => h.y0 > 0).forEach((h) => {
    const v = bloque(g, h.b - h.a, h.y1 - h.y0, 0.02, (h.a + h.b) / 2, (h.y0 + h.y1) / 2, 0, mats.vidrio, false);
    v.receiveShadow = false;
    bloque(g, h.b - h.a + 0.04, 0.04, esp + 0.04, (h.a + h.b) / 2, h.y0, 0, mats.marco, false);   // alfeizar
    // montantes cada ~1,2 m
    const n = Math.max(1, Math.round((h.b - h.a) / 1.2));
    for (let k = 1; k < n; k++) bloque(g, 0.04, h.y1 - h.y0, esp * 0.6, h.a + (h.b - h.a) * k / n, (h.y0 + h.y1) / 2, 0, mats.marco, false);
  });
  bloque(g, L, 0.1, esp + 0.01, 0, 0.05, 0, mats.zocalo, false);
  return g;
}

// Oficina: muros de 2,6 m y 10 cm con ventanales corridos, puerta al frente (+z) y losa liviana
function oficina(e, mats) {
  const g = new THREE.Group();
  g.position.set(e.x, 0, e.y);
  const H = 2.6, esp = 0.1, w = e.ancho, d = e.alto;
  const ventana = (L, desde = -L / 2 + 0.5, hasta = L / 2 - 0.5) => (hasta - desde > 0.6 ? [{ a: desde, b: hasta, y0: 1.0, y1: 2.1 }] : []);
  // Frente (+z): puerta de 0,9 m cerca de una esquina y ventana en el resto
  const pa = -w / 2 + 0.35, pb = pa + 0.9;
  const frente = muro(w, H, esp, [{ a: pa, b: pb, y0: 0, y1: 2.1 }, ...ventana(w, pb + 0.5)], mats);
  frente.position.z = d / 2 - esp / 2;
  const fondo = muro(w, H, esp, ventana(w), mats);
  fondo.position.z = -d / 2 + esp / 2;
  const izq = muro(d - esp * 2, H, esp, ventana(d - esp * 2), mats);
  izq.rotation.y = Math.PI / 2;
  izq.position.x = -w / 2 + esp / 2;
  const der = muro(d - esp * 2, H, esp, ventana(d - esp * 2), mats);
  der.rotation.y = Math.PI / 2;
  der.position.x = w / 2 - esp / 2;
  g.add(frente, fondo, izq, der);
  // Marco y hoja de la puerta entreabierta
  const zP = d / 2 - esp / 2;
  bloque(g, 0.05, 2.1, esp + 0.03, pa, 1.05, zP, mats.marco, false);
  bloque(g, 0.05, 2.1, esp + 0.03, pb, 1.05, zP, mats.marco, false);
  bloque(g, 0.95, 0.05, esp + 0.03, (pa + pb) / 2, 2.1, zP, mats.marco, false);
  const hoja = new THREE.Group();
  hoja.position.set(pa + 0.03, 0, zP + esp / 2);
  hoja.rotation.y = -0.6;
  bloque(hoja, 0.86, 2.05, 0.04, 0.43, 1.03, 0.02, mats.puerta);
  g.add(hoja);
  // Losa liviana con un borde
  bloque(g, w + 0.1, 0.1, d + 0.1, 0, H + 0.05, 0, mats.techo);
  bloque(g, w + 0.14, 0.06, d + 0.14, 0, H + 0.13, 0, mats.marco, false);
  return g;
}

// Andén: plataforma de 1,2 m con nivelador, borde de seguridad y topes de goma hacia +z (como el 2D)
function anden(e, mats) {
  const g = new THREE.Group();
  g.position.set(e.x, 0, e.y);
  const H = 1.2, w = e.ancho, d = e.alto;
  bloque(g, w, H, d, 0, H / 2, 0, mats.hormigonClaro);
  // Nivelador: plancha de acero en el borde, 60 % del ancho
  const nw = w * 0.6, nd = Math.min(d * 0.45, 2.5);
  bloque(g, nw, 0.03, nd, 0, H + 0.015, d / 2 - nd / 2, mats.placa, false);
  bloque(g, nw, 0.02, 0.35, 0, H - 0.04, d / 2 + 0.12, mats.placa, false).rotation.x = 0.35;   // labio
  // Franja de seguridad sobre el borde y en el frente
  const tx = texSeguridad();
  tx.repeat.set(w / 0.5, 1);
  const seg = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
  const borde = planoPiso(w, 0.18, seg, H + 0.004);
  borde.position.z = d / 2 - 0.09;
  g.add(borde);
  [-1, 1].forEach((s) => { const b = planoPiso(0.18, d - 0.2, seg, H + 0.004); b.position.set(s * (w / 2 - 0.09), H + 0.004, -0.1); g.add(b); });
  const tx2 = texSeguridad();
  tx2.repeat.set(w / 0.5, 0.5);
  const frente = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.2), new THREE.MeshStandardMaterial({ map: tx2, roughness: 0.6 }));
  frente.position.set(0, H - 0.1, d / 2 + 0.003);
  g.add(frente);
  // Topes de goma
  [-1, 1].forEach((s) => bloque(g, 0.25, 0.45, 0.12, s * Math.min(w / 2 - 0.3, nw / 2 + 0.3), 0.85, d / 2 + 0.06, mats.goma));
  return g;
}

// Portón enrollable: marco de acero, cortina de lamas y caja del rollo arriba
function porton(e, alturaBodega, mats) {
  const { g, largo } = orientado(e);
  const H = Math.min(4.5, Math.max(2.5, alturaBodega - 0.3));
  const tx = texturaCanvas(64, (c, n) => {
    c.fillStyle = '#cbd5e1';
    c.fillRect(0, 0, n, n);
    c.fillStyle = '#94a3b8';
    c.fillRect(0, 0, n, n * 0.12);
    c.fillStyle = '#e2e8f0';
    c.fillRect(0, n * 0.14, n, n * 0.1);
  });
  tx.repeat.set(1, H / 0.1);
  const cortina = new THREE.MeshStandardMaterial({ map: tx, metalness: 0.45, roughness: 0.45 });
  bloque(g, largo - 0.24, H - 0.1, 0.05, 0, (H - 0.1) / 2 + 0.05, 0, cortina);
  // Zocalo de seguridad abajo
  bloque(g, largo - 0.24, 0.1, 0.07, 0, 0.05, 0, mats.amarillo, false);
  // Marco
  [-1, 1].forEach((s) => bloque(g, 0.12, H + 0.3, 0.16, s * (largo / 2 - 0.06), (H + 0.3) / 2, 0, mats.marco));
  bloque(g, largo, 0.45, 0.45, 0, H + 0.15, 0.1, mats.marco);   // caja del rollo
  return g;
}
