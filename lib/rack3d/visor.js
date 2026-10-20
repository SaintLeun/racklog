// Visor 3D minimo: escena clara, piso con sombra, camara orbital y encuadre automatico.
// Reemplaza a los modelos de Sketchfab. Solo dibuja cuando algo cambia o se mueve (amortiguacion,
// zoom suave, transiciones) y se detiene cuando la camara queda quieta (no gasta bateria).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { liberar } from './construir.js';

const FONDO = '#f6f7f9';
const SUELO = '#eceef1';

export function webglDisponible() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

/**
 * @param {HTMLElement} contenedor elemento que recibe el canvas (toma su tamano)
 * @returns {{ mostrar(grupo: THREE.Object3D, opciones?: { reencuadrar?: boolean, direccion?: number[], margen?: number, animar?: boolean }): void, centrar(): void, arrastrar(opciones: { alElegir(id: string): void, alSoltar(id: string, x: number, z: number): void }): void, captura(tipo?: string, calidad?: number): string, destruir(): void, canvas: HTMLCanvasElement }}
 */
export function crearVisor(contenedor) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // La luz no se mueve con la camara: las sombras se recalculan solo cuando cambia la escena
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.touchAction = 'none';
  contenedor.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FONDO);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const entorno = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = entorno;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe3e8, 0.6));
  const sol = new THREE.DirectionalLight(0xffffff, 1.6);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.bias = -0.0005;
  scene.add(sol);
  scene.add(sol.target);

  const piso = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: SUELO, roughness: 1 }));
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  scene.add(piso);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 500);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.8;
  controls.panSpeed = 0.9;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;   // no meterse bajo el piso
  controls.screenSpacePanning = true;
  // Estilo AutoCAD: rueda = zoom hacia el cursor (suave, ver abajo), boton central = desplazar.
  // Izquierdo gira y derecho tambien desplaza. En tactil: un dedo gira, dos acercan y desplazan.
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

  let modelo = null;
  let pendiente = false;
  let vivo = true;
  let sombras = true;   // recalcular el mapa de sombras en el proximo cuadro

  // ─── Zoom suave hacia el cursor ───
  // La rueda acumula un zoom pendiente (en log) que se aplica de a poco en cada cuadro,
  // acercando camara y objetivo hacia el punto bajo el cursor (no hacia el centro)
  const rayoZoom = new THREE.Raycaster();
  const planoPiso = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const focoZoom = new THREE.Vector3();
  let zoomPendiente = 0;

  function puntoBajoCursor(clientX, clientY, destino) {
    const r = renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    rayoZoom.setFromCamera(v, camera);
    if (modelo) {
      const hit = rayoZoom.intersectObject(modelo, true)[0];
      if (hit) return destino.copy(hit.point);
    }
    if (rayoZoom.ray.intersectPlane(planoPiso, destino)) return destino;
    return destino.copy(controls.target);
  }

  function alRueda(e) {
    if (!vivo) return;
    e.preventDefault();
    e.stopPropagation();   // OrbitControls no hace su zoom a saltos
    animacion = null;
    let dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
    if (e.ctrlKey) dy *= 4;   // pellizco en trackpad
    dy = Math.max(-240, Math.min(240, dy));
    puntoBajoCursor(e.clientX, e.clientY, focoZoom);
    zoomPendiente += dy * 0.0016;
    pedir();
  }

  const _a = new THREE.Vector3();
  function pasoZoom() {
    if (Math.abs(zoomPendiente) < 1e-4) { zoomPendiente = 0; return false; }
    const paso = zoomPendiente * 0.22;
    zoomPendiente -= paso;
    let s = Math.exp(paso);
    // Respeta distancias minima y maxima al objetivo
    const d = camera.position.distanceTo(controls.target);
    const dn = THREE.MathUtils.clamp(d * s, controls.minDistance, controls.maxDistance);
    s = d > 0 ? dn / d : 1;
    if (Math.abs(s - 1) < 1e-5) { zoomPendiente = 0; return false; }
    camera.position.sub(focoZoom).multiplyScalar(s).add(focoZoom);
    controls.target.sub(focoZoom).multiplyScalar(s).add(focoZoom);
    // El objetivo no baja del piso
    if (controls.target.y < 0) { _a.set(0, -controls.target.y, 0); controls.target.add(_a); camera.position.add(_a); }
    return true;
  }

  // ─── Transiciones animadas de camara (encuadrar, centrar, doble clic) ───
  let animacion = null;
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function animarCamara(posicion, objetivo, duracion = 650) {
    zoomPendiente = 0;
    animacion = {
      p0: camera.position.clone(), t0: controls.target.clone(),
      p1: posicion.clone(), t1: objetivo.clone(),
      inicio: performance.now(), duracion,
    };
    pedir();
  }
  function pasoAnimacion() {
    if (!animacion) return false;
    const k = Math.min(1, (performance.now() - animacion.inicio) / animacion.duracion);
    const e = suave(k);
    camera.position.lerpVectors(animacion.p0, animacion.p1, e);
    controls.target.lerpVectors(animacion.t0, animacion.t1, e);
    if (k >= 1) animacion = null;
    return true;
  }
  // Si el usuario toma la camara, la animacion se corta ahi mismo
  controls.addEventListener('start', () => { animacion = null; });

  const dibujar = () => {
    pendiente = false;
    if (!vivo) return;
    const anim = pasoAnimacion();
    const zoom = pasoZoom();
    // Con amortiguacion la camara sigue moviendose unos cuadros despues de soltar
    const mov = controls.update();
    if (anim || zoom || mov || animacion || zoomPendiente) pedir();
    if (sombras) { renderer.shadowMap.needsUpdate = true; sombras = false; }
    renderer.render(scene, camera);
  };
  const pedir = () => {
    if (!pendiente && vivo) {
      pendiente = true;
      requestAnimationFrame(dibujar);
    }
  };
  controls.addEventListener('change', pedir);

  const ajustarTamano = () => {
    const w = contenedor.clientWidth || 1, h = contenedor.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pedir();
  };
  const observador = new ResizeObserver(ajustarTamano);
  observador.observe(contenedor);

  // Calcula la vista que encuadra el modelo; con `animar` la camara viaja hasta ella
  function encuadrar(direccion, margen, animar = false) {
    const caja = new THREE.Box3().setFromObject(modelo);
    const tam = caja.getSize(new THREE.Vector3());
    const centro = caja.getCenter(new THREE.Vector3());
    const radio = Math.max(tam.length() / 2, 0.5);

    piso.scale.setScalar(radio * 40);
    sol.position.set(centro.x + radio * 1.5, radio * 3, centro.z + radio * 2);
    sol.target.position.copy(centro);
    const s = sol.shadow.camera;
    s.left = s.bottom = -radio * 1.6;
    s.right = s.top = radio * 1.6;
    s.near = 0.1;
    s.far = radio * 8;
    s.updateProjectionMatrix();

    // Vista de tres cuartos desde el frente, algo elevada; alejada lo justo para que quepa
    const dist = radio / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.aspect < 1 ? 1.35 : 1) * margen;
    const dir = new THREE.Vector3(...direccion).normalize();
    const destino = centro.clone().addScaledVector(dir, dist);
    // El piso se funde con el fondo a lo lejos: sin borde visible del disco
    scene.fog = new THREE.Fog(FONDO, dist * 1.8, dist * 5);
    camera.near = Math.max(0.02, dist / 300);
    camera.far = dist * 20;
    camera.updateProjectionMatrix();
    controls.minDistance = Math.min(radio * 0.08, 1.5);
    controls.maxDistance = dist * 3;
    ultimoEncuadre = { posicion: destino, objetivo: centro.clone() };
    if (animar) {
      animarCamara(destino, centro);
    } else {
      animacion = null;
      camera.position.copy(destino);
      controls.target.copy(centro);
      controls.update();
    }
  }
  let ultimoEncuadre = null;

  // Doble clic: la camara viaja a mirar el punto bajo el cursor, a algo menos de distancia
  function alDobleClic(e) {
    if (!modelo) return;
    const p = puntoBajoCursor(e.clientX, e.clientY, new THREE.Vector3());
    const d = camera.position.distanceTo(controls.target);
    const dn = THREE.MathUtils.clamp(d * 0.6, controls.minDistance, controls.maxDistance);
    const dir = camera.position.clone().sub(controls.target).normalize();
    animarCamara(p.clone().addScaledVector(dir, dn), p);
  }

  ajustarTamano();

  // ─── Arrastre de objetos marcados con userData.rackId (planificador) ───
  // Se mueve sobre un plano horizontal a la altura donde se tomo; al soltar se avisa la posicion
  // final (de a 10 cm) y quien la recibe reconstruye la escena
  const rayo = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const punto = new THREE.Vector3();
  let opcionesArrastre = null;
  let arrastre = null;

  const apuntar = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    rayo.setFromCamera(ndc, camera);
  };
  const rackBajo = (e) => {
    if (!modelo) return null;
    apuntar(e);
    for (const hit of rayo.intersectObject(modelo, true)) {
      for (let o = hit.object; o && o !== modelo; o = o.parent) {
        if (o.userData.rackId) return { objeto: o, punto: hit.point };
      }
    }
    return null;
  };
  const enPlano = (e) => {
    apuntar(e);
    return rayo.ray.intersectPlane(plano, punto);
  };
  const aPaso = (v) => Math.round(v * 10) / 10;

  function alPresionar(e) {
    if (!opcionesArrastre || e.button !== 0 || !e.isPrimary) return;
    const bajo = rackBajo(e);
    if (!bajo) return;   // fuera de un rack: la camara gira como siempre
    e.stopPropagation(); // OrbitControls no se entera
    e.preventDefault();
    plano.constant = -bajo.punto.y;
    const o = bajo.objeto;
    arrastre = { objeto: o, puntero: e.pointerId, dx: o.position.x - bajo.punto.x, dz: o.position.z - bajo.punto.z, movido: false };
    renderer.domElement.setPointerCapture(e.pointerId);
    renderer.domElement.style.cursor = 'grabbing';
    opcionesArrastre.alElegir(o.userData.rackId);
  }
  function alMover(e) {
    if (!opcionesArrastre) return;
    if (!arrastre) {
      if (e.pointerType === 'mouse') renderer.domElement.style.cursor = rackBajo(e) ? 'move' : '';
      return;
    }
    if (e.pointerId !== arrastre.puntero || !enPlano(e)) return;
    arrastre.objeto.position.x = aPaso(punto.x + arrastre.dx);
    arrastre.objeto.position.z = aPaso(punto.z + arrastre.dz);
    arrastre.movido = true;
    sombras = true;
    pedir();
  }
  function alSoltar(e) {
    if (!arrastre || e.pointerId !== arrastre.puntero) return;
    const { objeto, movido } = arrastre;
    arrastre = null;
    renderer.domElement.style.cursor = '';
    if (movido) opcionesArrastre.alSoltar(objeto.userData.rackId, objeto.position.x, objeto.position.z);
  }
  // En captura sobre el contenedor: llega antes que el pointerdown de OrbitControls en el canvas
  contenedor.addEventListener('pointerdown', alPresionar, true);
  // Rueda en captura: llega antes que la de OrbitControls (que se reemplaza por el zoom suave)
  contenedor.addEventListener('wheel', alRueda, { capture: true, passive: false });
  renderer.domElement.addEventListener('dblclick', alDobleClic);
  renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  renderer.domElement.addEventListener('pointermove', alMover);
  renderer.domElement.addEventListener('pointerup', alSoltar);
  renderer.domElement.addEventListener('pointercancel', alSoltar);

  return {
    canvas: renderer.domElement,
    // direccion: desde donde mira la camara. Por defecto tres cuartos desde el frente; el
    // planificador mira desde el borde inferior del plano para que 2D y 3D se lean igual
    // animar: con un modelo ya en pantalla, la camara viaja al nuevo encuadre en vez de saltar
    mostrar(grupo, { reencuadrar = true, direccion = [0.75, 0.55, 1], margen = 1.05, animar = true } = {}) {
      const habia = !!modelo;
      if (modelo) {
        scene.remove(modelo);
        liberar(modelo);
      }
      modelo = grupo;
      scene.add(modelo);
      if (reencuadrar) encuadrar(direccion, margen, animar && habia);
      sombras = true;
      pedir();
    },
    // Vuelve (animado) a la vista inicial del modelo
    centrar() {
      if (ultimoEncuadre) animarCamara(ultimoEncuadre.posicion, ultimoEncuadre.objetivo);
    },
    arrastrar(opciones) {
      opcionesArrastre = opciones;
    },
    // Imagen de la vista actual: se dibuja y se lee en el mismo paso (sin preserveDrawingBuffer)
    captura(tipo = 'image/jpeg', calidad = 0.9) {
      controls.update();
      renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL(tipo, calidad);
    },
    destruir() {
      vivo = false;
      animacion = null;
      contenedor.removeEventListener('pointerdown', alPresionar, true);
      contenedor.removeEventListener('wheel', alRueda, true);
      observador.disconnect();
      controls.dispose();
      if (modelo) liberar(modelo);
      liberar(piso);
      entorno.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
