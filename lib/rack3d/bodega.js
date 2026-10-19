// Escena 3D del planificador: piso con la forma de la bodega, muros bajos y los racks en su lugar.
// Planta 2D → 3D: x se mantiene y la y del plano es la z de la escena.
import * as THREE from 'three';
import { construirSelectivo, construirAnra, construirDriveIn } from './construir.js';
import { medidasRack, contorno, caja } from './planificador.js';

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

  g.add(persona(poly, racks));

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

// Persona de 1,75 m para dar escala, en la primera esquina libre de la bodega
function persona(poly, racks) {
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
  // Junto a una esquina, hacia adentro, donde no haya un rack
  const c = caja(poly), centro = { x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2 };
  const libre = (x, y) => racks.every((r) => Math.abs(r.x - x) > 3 || Math.abs(r.y - y) > 3);
  const candidatos = poly.map((v) => {
    const dx = centro.x - v.x, dy = centro.y - v.y, d = Math.hypot(dx, dy) || 1;
    return { x: v.x + (dx / d) * 1.2, y: v.y + (dy / d) * 1.2 };
  });
  const lugar = candidatos.find((q) => libre(q.x, q.y)) ?? candidatos[0];
  p.position.set(lugar.x, 0, lugar.y);
  return p;
}
