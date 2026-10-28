// Zona de carga (dueño 27-10): solo si el cliente la agrega. Dos operarios arman un pallet caja por caja: toman
// una caja de la ruma, la llevan en los brazos y la dejan en el pallet; lleno, el pallet sale y parte otro.
// Ejes locales del grupo: x = lado largo de la zona, z = lado corto (como `orientado` en bodega.js)
import * as THREE from 'three';
import { palletArmado, palletSuelto } from './construir.js';
import { persona } from './equipos.js';

const CAJA = { largo: 0.5, ancho: 0.4, alto: 0.3 };
const V = 1.0;                 // m/s caminando
const TOMAR = 0.9, DEJAR = 0.9; // s agachado al tomar y al dejar la caja
const LLENO = 2.5;             // s con el pallet lleno antes de que salga

/** Operarios y pallet de una zona de carga; `animar(dt)` los mueve. `g` ya está orientado y ubicado */
export function zonaCargaAnimada(g, largo, ancho, mats) {
  // Ruma de cajas (de donde sacan) y pallet que se arma, en los extremos del lado largo
  const xRuma = -largo / 2 + 0.9, xPallet = largo / 2 - 0.9;
  const ruma = palletSuelto(1.0, 1.2, 1.1);
  ruma.position.set(xRuma, 0, 0);
  ruma.rotation.y = Math.PI / 2;
  const pallet = palletArmado({ frente: 1.0, fondo: 1.2, caja: CAJA, cols: 2, filas: 3, camas: 4, largoEnFrente: true });
  pallet.position.set(xPallet, 0, 0);
  pallet.rotation.y = Math.PI / 2;
  g.add(ruma, pallet);
  const cajas = pallet.children.find((o) => o.isInstancedMesh);
  const total = cajas?.count ?? 0;
  let puestas = 0, lleno = 0;
  if (cajas) cajas.count = 0;

  // Recorrido de cada operario: de la ruma al pallet y de vuelta, uno a cada lado (z = ±0,55)
  const desde = xRuma + 0.85, hasta = xPallet - 0.85, d = Math.max(0.5, hasta - desde);
  const ciclo = TOMAR + d / V + DEJAR + d / V;
  const operarios = [-1, 1].map((lado, i) => {
    const p = persona(mats);
    p.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    // Caja en los brazos (se ve solo mientras la lleva)
    const caja = new THREE.Mesh(new THREE.BoxGeometry(CAJA.ancho, CAJA.alto, CAJA.largo * 0.8), new THREE.MeshStandardMaterial({ color: 0xc8a06a, roughness: 0.8 }));
    caja.position.set(0, 1.0, -0.34);
    caja.visible = false;
    p.add(caja);
    p.position.set(desde, 0, lado * Math.min(0.55, ancho / 2 - 0.4));
    g.add(p);
    return { p, caja, t: i * ciclo / 2, fase: Math.random() * 6, amp: 0, ang: -Math.PI / 2 };
  });

  const arts = (p) => p.userData.articulaciones;   // [pierna, pierna, brazo, brazo]
  function animar(dt) {
    if (!cajas) return;
    // Pallet lleno: espera y sale (vuelve a cero)
    if (puestas >= total) {
      lleno += dt;
      if (lleno > LLENO) { puestas = 0; lleno = 0; cajas.count = 0; }
    }
    operarios.forEach((o) => {
      o.t = (o.t + dt) % ciclo;
      let s = o.t, x, camina = false, agacha = 0, lleva = false, meta;
      if (s < TOMAR) { x = desde; agacha = Math.sin((s / TOMAR) * Math.PI); lleva = s > TOMAR / 2; meta = Math.PI / 2; }
      else if ((s -= TOMAR) < d / V) { x = desde + s * V; camina = true; lleva = true; meta = -Math.PI / 2; }
      else if ((s -= d / V) < DEJAR) {
        x = hasta; agacha = Math.sin((s / DEJAR) * Math.PI); lleva = s < DEJAR / 2; meta = -Math.PI / 2;
        // Al soltarla, la caja aparece en el pallet (una por operario y por vuelta)
        if (!lleva && !o.dejo && puestas < total) { puestas++; cajas.count = puestas; o.dejo = true; }
      } else { s -= DEJAR; x = hasta - s * V; camina = true; meta = Math.PI / 2; o.dejo = false; }
      o.p.position.x = x;
      // Giro de a poco hacia donde va (mira la ruma al tomar, el pallet al dejar)
      const dif = Math.atan2(Math.sin(meta - o.ang), Math.cos(meta - o.ang));
      o.ang += Math.sign(dif) * Math.min(Math.abs(dif), dt * 4);
      o.p.rotation.y = o.ang;
      // Paso (se apaga suave al parar) y, encima, brazos al frente si lleva la caja y el cuerpo agachado
      o.amp += ((camina ? 1 : 0) - o.amp) * Math.min(1, dt * 6);
      if (camina || o.amp > 0.02) o.fase += dt * 5.6;
      o.p.userData.caminar?.(Math.sin(o.fase) * 0.45 * o.amp, o.amp);
      const [, , b1, b2] = arts(o.p);
      if (lleva || agacha > 0.05) [b1, b2].forEach((b) => { b.rotation.x = 0.85 + agacha * 0.5; b.userData.codo.rotation.x = 0.75; });
      const cuerpo = o.p.children[0];
      cuerpo.rotation.x -= agacha * 0.45;
      o.caja.visible = lleva;
    });
  }
  return { animar };
}
