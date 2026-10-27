// Flota de grúas y personas en el 3D del planificador. La operación (quién va a dónde y cuándo, sin
// choques) la decide lib/rack3d/flota.js; aquí solo se dibuja: cada grúa con su pallet, la horquilla
// que sube y baja, y las personas que caminan por los pasillos peatonales.
// Planta → escena: x se mantiene y la y del plano es la z de la escena (como bodega.js).
import * as THREE from 'three';
import { palletSuelto } from './construir.js';
import { grua, persona } from './equipos.js';

export { crearFlota } from './flota.js';

// Mancha oscura con borde difuso bajo la grua o la persona (x = ancho, z = largo). Lo que se mueve
// no entra al mapa de sombras (recalcularlo en cada cuadro con toda la bodega es caro)
let texSombra = null;
export function sombraSuave(largo, ancho, opacidad = 0.42) {
  if (!texSombra && typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 4, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
    texSombra = new THREE.CanvasTexture(c);
  }
  const geo = new THREE.PlaneGeometry(ancho, largo);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ map: texSombra, color: 0x000000, transparent: true, opacity: texSombra ? opacidad : 0.2, depthWrite: false });
  mat.userData.compartido = false;
  const m = new THREE.Mesh(geo, mat);
  m.position.y = 0.02;
  m.renderOrder = 2;
  return m;
}

// Rumbo de la escena para que el frente (−z local) apunte segun el angulo de planta (x, y)
const rumbo = (ang) => Math.atan2(-Math.cos(ang), -Math.sin(ang));

const sinSombra = (o) => o.traverse((x) => { x.castShadow = false; });

/**
 * Pone la flota animada en `grupo`. `flota` viene de crearFlota(); `racks3d` es un Map rackId → rack
 * ya construido (con su hueco) y ubicado en el grupo.
 * Devuelve animar(dt) → true (siempre se mueve). animar.camara: vista a la primera grua;
 * animar.vistaOperador(): a 1,6 m dentro de su pasillo mirando hacia ella.
 */
export function animarFlota(grupo, flota, racks3d, mats) {
  const _p = new THREE.Vector3();
  const gruas = flota.gruas.map((gf) => {
    const rack3d = racks3d.get(gf.rackId);
    const h = rack3d?.userData.hueco;
    const m = grua(flota.tipo, mats);
    const ud = m.userData;
    sinSombra(m);
    m.add(sombraSuave(ud.largo * 0.8, ud.largo * 0.5));
    grupo.add(m);
    let pallet = null, slot = null, giroRack = 0, zPallet = 0;
    if (h) {
      rack3d.updateMatrixWorld(true);
      slot = rack3d.localToWorld(new THREE.Vector3(h.x, h.y, h.z));
      giroRack = rack3d.rotation.y;
      pallet = palletSuelto(h.frente, h.fondo, h.altoCarga, h.color);
      sinSombra(pallet);
      grupo.add(pallet);
      zPallet = ud.punta + h.fondo / 2 - 0.05;   // z local del centro del pallet (< 0)
    }
    return { gf, m, ud, pallet, slot, giroRack, zPallet };
  });

  const personas = flota.personas.map(() => {
    const p = persona(mats);
    sinSombra(p);
    p.add(sombraSuave(0.55, 0.55, 0.35));
    grupo.add(p);
    return { p, fase: Math.random() * 6, ang: null, amp: 0 };
  });

  function aplicar(e, paso) {
    e.gruas.forEach((s, i) => {
      const g = gruas[i];
      if (!g) return;
      g.m.position.set(s.x, 0, s.y);
      g.m.rotation.y = rumbo(s.ang);
      g.ud.levantar(s.alto);
      if (!g.pallet) return;
      if (s.lleva) {
        g.m.updateMatrixWorld(true);
        g.pallet.position.copy(g.m.localToWorld(_p.set(0, g.ud.horquillas + s.alto, g.zPallet)));
        g.pallet.position.y -= 0.1;   // la tarima abraza las horquillas
        g.pallet.rotation.y = g.m.rotation.y;
      } else {
        g.pallet.position.copy(g.slot);
        g.pallet.rotation.y = g.giroRack;
      }
    });
    e.personas.forEach((s, i) => {
      const q = personas[i];
      if (!q) return;
      q.p.position.set(s.x, 0, s.y);
      // Gira de a poco (≈ 3,5 rad/s, por el lado corto) en vez de darse vuelta de golpe
      const meta = rumbo(s.ang);
      if (q.ang === null || !paso) q.ang = meta;
      else {
        const d = Math.atan2(Math.sin(meta - q.ang), Math.cos(meta - q.ang));
        q.ang += Math.sign(d) * Math.min(Math.abs(d), paso * 3.5);
      }
      q.p.rotation.y = q.ang;
      // Paso: piernas y brazos se balancean mientras camina (~1,8 pasos por segundo); al parar o arrancar el
      // vaivén crece o se apaga en ~0,3 s (no se congela a media zancada)
      q.amp += ((s.camina ? 1 : 0) - q.amp) * Math.min(1, paso * 6);
      if (s.camina || q.amp > 0.02) q.fase += paso * 5.6;
      const a = Math.sin(q.fase) * 0.45 * q.amp;
      q.p.userData.caminar?.(a, q.amp);
    });
  }

  function animar(dt) {
    const paso = Math.min(dt, 0.1);
    aplicar(flota.avanzar(paso), paso);
    return true;
  }
  aplicar(flota.estado(0), 0);

  // Camara para ver la primera grua: elevada, en la linea de su pasillo y algo de lado
  const g0 = flota.gruas[0];
  const ejeX = Math.abs(Math.cos(g0.frente)) < 0.5;   // el pasillo corre a lo largo de x
  const lejos = new THREE.Vector3(ejeX ? 1 : 0, 0, ejeX ? 0 : 1);
  animar.camara = {
    get posicion() {
      const m = gruas[0].m.position;
      // Sobre el eje del pasillo (de lado chocaria con el rack de enfrente), 8 m mas alla y a 5,5 m de alto
      return new THREE.Vector3(m.x, 5.5, m.z).addScaledVector(lejos, 8);
    },
    get objetivo() {
      const m = gruas[0].m.position;
      return new THREE.Vector3(m.x, 1.4, m.z);
    },
  };
  // A la altura de los ojos de un operador (1,6 m), dentro del pasillo de la primera grua, mirando
  // hacia su hueco
  animar.vistaOperador = () => {
    const S = g0.S, ux = ejeX ? 1 : 0, uz = ejeX ? 0 : 1;
    // Hacia el lado del pasillo con mas recorrido libre de la grua (hacia la boca)
    const sg = (ejeX ? flota.andenes[0]?.x - S.x : flota.andenes[0]?.y - S.y) >= 0 ? 1 : -1;
    const posicion = new THREE.Vector3(S.x + ux * sg * 7, 1.6, S.y + uz * sg * 7);
    return { posicion, objetivo: new THREE.Vector3(S.x, 1.5, S.y) };
  };
  animar.gruaPosicion = () => gruas[0].m.position.clone();
  animar.cantidad = gruas.length;
  return animar;
}
