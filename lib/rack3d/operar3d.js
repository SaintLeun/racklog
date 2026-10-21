// Grúa operando en el 3D del planificador: recorre un pasillo de verdad (lib/rack3d/pasillos.js),
// gira hacia el rack, levanta un pallet hasta un nivel que alcanza, lo deja en su posicion, vuelve y
// en la pasada siguiente lo saca. Solo se elige un pasillo que cumple el ancho de la grua.
// Planta → escena: x se mantiene y la y del plano es la z de la escena (como bodega.js).
import * as THREE from 'three';
import { medidasRack, rectangulo } from './planificador.js';
import { pasillos, carasDeCarga, conGrua, gruaDe } from './pasillos.js';
import { huella } from './medidas.js';

// Lado del rack que da al pasillo
function ladoHacia(r, p) {
  const q = rectangulo(r), e = 0.05;
  if (p.eje === 'x') return p.x0 >= q.x0 + q.ancho - e ? 'derecha' : 'izquierda';
  return p.y0 >= q.y0 + q.alto - e ? 'abajo' : 'arriba';
}

// Punto local del rack (lx, lz; centrado en su huella) en planta, con su giro (igual que bodega.js)
function aPlanta(r, lx, lz) {
  const t = -((r.rot || 0) * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  return { x: r.x + lx * c + lz * s, y: r.y - lx * s + lz * c };
}

/**
 * Que hace la grua: { rackId, hueco: { fila, cuerpo, nivel, pos }, pasillo } o null si no hay
 * un pasillo que cumpla frente a un selectivo o drive-in.
 */
export function planOperacion(bodega, racks) {
  const g = gruaDe(bodega);
  const lista = pasillos(racks, bodega).filter((p) => p.ok);
  const porId = new Map(racks.map((r) => [r.id, r]));
  const candidatos = [];
  lista.forEach((p) => p.racks.forEach((id) => {
    const r = porId.get(id);
    if (!r || !conGrua(r) || r.existente) return;
    const lado = ladoHacia(r, p);
    const caras = carasDeCarga(r);
    if (!caras.includes(lado)) return;
    candidatos.push({ r, p, fila: caras[0] === lado ? 0 : 1 });
  }));
  if (!candidatos.length) return null;
  // Primero selectivo (se ve mejor la carga por nivel) y el pasillo mas largo
  const largoP = (p) => (p.eje === 'x' ? p.y1 - p.y0 : p.x1 - p.x0);
  candidatos.sort((a, b) => (a.r.tipo === 'RS' ? 0 : 1) - (b.r.tipo === 'RS' ? 0 : 1) || largoP(b.p) - largoP(a.p));
  const { r, p, fila } = candidatos[0];
  const m = medidasRack(r);
  const { largo } = huella(m);

  // Nivel: el mas alto que alcanza la grua, sin pasar del tercero (para que se vea entero)
  let nivel = 0;
  if (m.tipo === 'selectivo') {
    m.nivelesY.forEach((y, i) => { if (y + m.altoViga / 2 <= g.levante - 0.05 && i + 1 <= 3) nivel = i + 1; });
    // En el cuerpo tunel esas alturas no existen
  } else {
    m.cartelasY.forEach((y, i) => { if (y <= g.levante - 0.05 && i + 1 <= 2) nivel = i + 1; });
  }

  // Cuerpo (o calle) cuyo centro queda mas cerca del medio del pasillo
  const n = m.tipo === 'selectivo' ? m.cuerpos : m.calles;
  const centro = (c) => (m.tipo === 'selectivo'
    ? c * (m.viga + 0.1) + 0.1 + m.viga / 2 - largo / 2
    : 0.05 + (c + 0.5) * m.anchoCalle - largo / 2);
  const medio = p.eje === 'x' ? (p.y0 + p.y1) / 2 : (p.x0 + p.x1) / 2;
  let cuerpo = 0, mejor = Infinity;
  for (let c = 0; c < n; c++) {
    if (m.tunel && c === m.tunel.indice) continue;
    const q = aPlanta(r, centro(c), 0), d = Math.abs((p.eje === 'x' ? q.y : q.x) - medio);
    if (d < mejor) { mejor = d; cuerpo = c; }
  }
  const pos = m.tipo === 'selectivo' ? Math.floor((m.palletsPorViga - 1) / 2) : 0;
  return { rackId: r.id, hueco: { fila, cuerpo, nivel, pos }, pasillo: p, modelo: bodega.grua };
}

// Pallet suelto (tarima + carga) que lleva la grua
function palletSuelto(h, mats) {
  const g = new THREE.Group();
  const tarima = new THREE.Mesh(new THREE.BoxGeometry(h.frente, 0.144, h.fondo), mats.madera);
  tarima.position.y = 0.072;
  const carga = new THREE.Mesh(new THREE.BoxGeometry(h.frente * 0.92, Math.max(0.1, h.alto - 0.144), h.fondo * 0.92), mats.carton);
  carga.position.y = 0.144 + (h.alto - 0.144) / 2;
  [tarima, carga].forEach((o) => { o.castShadow = true; o.receiveShadow = true; g.add(o); });
  return g;
}

const suave = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
// Diferencia de angulo por el lado corto
const giroCorto = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
// Rumbo para que las horquillas (−z local) apunten en la direccion (dx, dz)
const rumbo = (dx, dz) => Math.atan2(-dx, -dz);

/**
 * Pone la grua animada en `grupo` (la escena de bodega.js). `rack3d` es el rack ya construido con el
 * hueco y ubicado en el grupo; `montacargas` la grua de equipos.js. Devuelve animar(dt) → true
 * mientras se mueve (siempre: el ciclo se repite).
 */
export function animarOperacion(grupo, plan, rack3d, montacargas, mats) {
  const h = rack3d.userData.hueco;
  if (!h) return null;
  rack3d.updateMatrixWorld(true);
  const slot = rack3d.localToWorld(new THREE.Vector3(h.x, h.y, h.z));
  const giroRack = rack3d.rotation.y;
  const p = plan.pasillo, ud = montacargas.userData;

  // Eje del pasillo y punto de parada frente al hueco
  const enX = p.eje === 'y';   // ancho medido en y: el pasillo corre a lo largo de x
  const cx = (p.x0 + p.x1) / 2, cz = (p.y0 + p.y1) / 2;
  const S = enX ? new THREE.Vector3(slot.x, 0, cz) : new THREE.Vector3(cx, 0, slot.z);
  const hacia = new THREE.Vector3(slot.x - S.x, 0, slot.z - S.z);
  const dist = hacia.length();
  hacia.normalize();
  // Centro de la grua cuando el pallet queda justo en el hueco
  const zPallet = ud.punta + h.fondo / 2 - 0.05;          // z local del centro del pallet (< 0)
  const T = new THREE.Vector3(slot.x, 0, slot.z).addScaledVector(hacia, zPallet);
  const avance = Math.max(0, dist + zPallet);
  // Punto de partida: el extremo del pasillo mas lejos del hueco, sin salirse
  const margen = ud.largo / 2 + 0.3;
  const [a0, a1] = enX ? [p.x0 + margen, p.x1 - margen] : [p.y0 + margen, p.y1 - margen];
  const sA = enX ? S.x : S.z;
  const fin = a1 >= a0 ? (Math.abs(a0 - sA) > Math.abs(a1 - sA) ? a0 : a1) : sA;
  const A = enX ? new THREE.Vector3(fin, 0, cz) : new THREE.Vector3(cx, 0, fin);
  const tramo = A.distanceTo(S);
  const dir = tramo > 0.01 ? S.clone().sub(A).normalize() : new THREE.Vector3(enX ? 1 : 0, 0, enX ? 0 : 1);
  const rIda = rumbo(dir.x, dir.z), rVuelta = rIda + Math.PI, rFrente = rumbo(hacia.x, hacia.z);

  // Alturas de horquilla: con el pallet apoyado en su lugar, y 6 cm mas arriba para entrar y salir.
  // Llevado, la base del pallet queda 10 cm bajo la cara de las horquillas (la tarima las abraza)
  const apoyo = Math.max(0, h.y - ud.horquillas + 0.1);
  const arriba = apoyo + 0.06;

  const pallet = palletSuelto(h, mats);
  grupo.add(pallet);
  grupo.add(montacargas);

  // Estado y linea de tiempo: cada fase interpola algo; `llevar` cambia al terminar la fase
  const e = { pos: A.clone(), r: rIda, alto: 0, lleva: true };
  const fases = [];
  const conducir = (de, a, r) => tramo > 0.01 && fases.push({ dur: Math.max(0.6, de.distanceTo(a) / 1.6), f: (k) => { e.pos.lerpVectors(de, a, k); e.r = r; } });
  const girar = (de, a) => fases.push({ dur: 1.1, f: (k) => { e.r = de + giroCorto(de, a) * k; } });
  const subir = (de, a, lleva) => fases.push({ dur: 0.4 + Math.abs(a - de) / 0.5, f: (k) => { e.alto = de + (a - de) * k; }, lleva });
  const mover = (de, a) => avance > 0.01 && fases.push({ dur: 0.4 + avance / 0.45, f: (k) => { e.pos.lerpVectors(de, a, k); } });
  const pausa = (s) => fases.push({ dur: s, f: () => {} });
  const viaje = (guardar) => {
    conducir(A, S, rIda);
    girar(rIda, rFrente);
    subir(0, guardar ? arriba : apoyo);
    mover(S, T);
    subir(guardar ? arriba : apoyo, guardar ? apoyo : arriba, !guardar);   // deja (o toma) el pallet
    mover(T, S);
    subir(guardar ? apoyo : arriba, 0);
    girar(rFrente, rVuelta);
    conducir(S, A, rVuelta);
    pausa(0.8);
    girar(rVuelta, rIda + Math.PI * 2);
  };
  viaje(true);
  viaje(false);
  const total = fases.reduce((s, f) => s + f.dur, 0);

  const _p = new THREE.Vector3();
  function aplicar() {
    montacargas.position.copy(e.pos);
    montacargas.rotation.y = e.r;
    ud.levantar(e.alto);
    if (e.lleva) {
      montacargas.updateMatrixWorld(true);
      pallet.position.copy(montacargas.localToWorld(_p.set(0, ud.horquillas + e.alto, zPallet)));
      pallet.position.y -= 0.1;   // la tarima abraza las horquillas
      pallet.rotation.y = e.r;
    } else {
      pallet.position.copy(slot);
      pallet.rotation.y = giroRack;
    }
  }
  let t = 0;
  function animar(dt) {
    t = (t + Math.min(dt, 0.1)) % total;
    let resto = t;
    e.pos.copy(A); e.r = rIda; e.alto = 0; e.lleva = true;
    for (const f of fases) {
      if (resto >= f.dur) { f.f(1); if (f.lleva !== undefined) e.lleva = f.lleva; resto -= f.dur; continue; }
      f.f(suave(resto / f.dur));
      if (f.lleva === true) e.lleva = true;   // lo toma apenas empieza a subir
      break;
    }
    aplicar();
    return true;
  }
  aplicar();
  return animar;
}
