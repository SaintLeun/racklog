// Escena 3D del planificador: piso con la forma de la bodega, muros bajos y los racks en su lugar.
// Planta 2D → 3D: x se mantiene y la y del plano es la z de la escena.
import * as THREE from 'three';
import { construirSelectivo, construirAnra, construirDriveIn } from './construir.js';
import { medidasRack, contorno, caja, rectangulo, rectElemento, puntoDentro } from './planificador.js';

const PISO = '#fbfbfc';
const MURO = '#dfe3e8';
const LINEA = '#c3cad3';

const CONSTRUIR = { selectivo: construirSelectivo, anra: construirAnra, drivein: construirDriveIn };

// Cuadricula de 1 m como textura: el piso usa coordenadas en metros, asi se repite una vez por metro
function texturaGrilla() {
  const n = 128, cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = PISO;
  ctx.fillRect(0, 0, n, n);
  ctx.fillStyle = LINEA;
  ctx.fillRect(0, 0, n, 5);
  ctx.fillRect(0, 0, 5, n);
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

  (bodega.elementos ?? []).forEach((e) => g.add(elemento3D(e, bodega.altura)));
  // Persona y grua en espacios libres de verdad (con la huella de racks y elementos), junto al porton si hay
  const elementos = bodega.elementos ?? [];
  const porton = elementos.find((e) => e.clase === 'porton' || e.clase === 'anden');
  const c0 = caja(poly);
  const ref = porton ? { x: porton.x, y: porton.y } : { x: c0.x0, y: c0.y1 };
  const yo = persona();
  const pYo = lugarLibre3D(poly, racks, elementos, ref, 0.6);
  if (pYo) { yo.position.set(pYo.x, 0, pYo.y); g.add(yo); }
  const pGrua = lugarLibre3D(poly, racks, elementos, pYo ?? ref, 1.6, pYo);
  if (pGrua) {
    const montacargas = grua();
    montacargas.position.set(pGrua.x, 0, pGrua.y);
    const centro = { x: (c0.x0 + c0.x1) / 2, y: (c0.y0 + c0.y1) / 2 };
    montacargas.rotation.y = Math.atan2(centro.x - pGrua.x, centro.y - pGrua.y);
    g.add(montacargas);
  }

  racks.forEach((r) => {
    const m = medidasRack(r);
    const rack = CONSTRUIR[m.tipo](m);
    rack.position.set(r.x, 0, r.y);
    rack.rotation.y = -((r.rot || 0) * Math.PI) / 180;
    rack.userData.rackId = r.id;   // el visor lo usa para arrastrarlo
    g.add(rack);
  });
  return g;
}

// Persona de 1,75 m para dar escala
function persona() {
  const p = new THREE.Group();
  const ropa = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.8 });
  const chaleco = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });
  const piel = new THREE.MeshStandardMaterial({ color: 0xd1a37c, roughness: 0.7 });
  const casco = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
  const pieza = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = true; p.add(m); return m; };
  [-0.1, 0.1].forEach((x) => { const pierna = pieza(new THREE.CylinderGeometry(0.075, 0.07, 0.85, 12), ropa, 0.425); pierna.position.x = x; });
  pieza(new THREE.CylinderGeometry(0.2, 0.17, 0.62, 16), chaleco, 1.16);
  pieza(new THREE.SphereGeometry(0.12, 16, 12), piel, 1.6);
  pieza(new THREE.SphereGeometry(0.135, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), casco, 1.63);
  return p;
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

// Grua horquilla contrapeso (~1,2 × 2,4 m, mastil de 2,2 m) para dar escala, en un espacio libre
function grua() {
  const g = new THREE.Group();
  const naranjo = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.55 });
  const negro = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 });
  const acero = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.6, roughness: 0.4 });
  const caja = (w, h, d, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  caja(1.1, 0.7, 1.7, 0, 0.55, 0, naranjo);           // chasis
  caja(1.12, 0.45, 0.5, 0, 0.6, -0.95, negro);        // contrapeso
  caja(0.9, 0.06, 0.9, 0, 2.05, -0.1, negro);         // techo de proteccion
  [[-0.42, 0.25], [0.42, 0.25], [-0.42, -0.45], [0.42, -0.45]].forEach(([x, z]) => caja(0.05, 1.15, 0.05, x, 1.48, z, negro));
  [-0.3, 0.3].forEach((x) => caja(0.08, 2.2, 0.1, x, 1.1, 0.95, acero));   // mastil
  [-0.25, 0.25].forEach((x) => caja(0.1, 0.05, 1.1, x, 0.12, 1.55, acero)); // horquillas
  [[-0.5, 0.55], [0.5, 0.55], [-0.5, -0.6], [0.5, -0.6]].forEach(([x, z]) => {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 18), negro);
    r.rotation.z = Math.PI / 2;
    r.position.set(x, 0.25, z);
    r.castShadow = true;
    g.add(r);
  });
  return g;
}


// Pilares hasta la altura libre (o 6 m), oficinas como volumen y lo demas marcado en el piso
function elemento3D(e, altura) {
  const color = { pilar: 0xa8a29e, porton: 0xfacc15, anden: 0x38bdf8, oficina: 0xc4b5fd, zona: 0xf87171 }[e.clase];
  if (e.clase === 'pilar' || e.clase === 'oficina') {
    const alto = e.clase === 'pilar' ? (altura > 0 ? altura : 6) : 2.6;
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(e.ancho, alto, e.alto),
      new THREE.MeshStandardMaterial({ color, roughness: 0.9, transparent: e.clase === 'oficina', opacity: e.clase === 'oficina' ? 0.55 : 1 }),
    );
    m.position.set(e.x, alto / 2, e.y);
    m.castShadow = e.clase === 'pilar';
    m.receiveShadow = true;
    return m;
  }
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(e.ancho, 0.02, e.alto),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, transparent: true, opacity: 0.6 }),
  );
  m.position.set(e.x, 0.015, e.y);
  return m;
}
