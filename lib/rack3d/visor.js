// Visor 3D minimo: escena clara, piso con sombra, camara orbital y encuadre automatico.
// Reemplaza a los modelos de Sketchfab. Solo dibuja cuando algo cambia (no gasta bateria quieto).
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
 * @returns {{ mostrar(grupo: THREE.Object3D, opciones?: { reencuadrar?: boolean, direccion?: number[], margen?: number }): void, arrastrar(opciones: { alElegir(id: string): void, alSoltar(id: string, x: number, z: number): void }): void, destruir(): void, canvas: HTMLCanvasElement }}
 */
export function crearVisor(contenedor) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
  controls.maxPolarAngle = Math.PI / 2 - 0.02;   // no meterse bajo el piso
  controls.screenSpacePanning = true;

  let modelo = null;
  let pendiente = false;
  let vivo = true;

  const dibujar = () => {
    pendiente = false;
    if (!vivo) return;
    // Con amortiguacion la camara sigue moviendose unos cuadros despues de soltar
    if (controls.update()) pedir();
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

  function encuadrar(direccion, margen) {
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
    camera.position.copy(centro).addScaledVector(dir, dist);
    // El piso se funde con el fondo a lo lejos: sin borde visible del disco
    scene.fog = new THREE.Fog(FONDO, dist * 1.8, dist * 5);
    camera.near = dist / 100;
    camera.far = dist * 20;
    camera.updateProjectionMatrix();
    controls.target.copy(centro);
    controls.minDistance = radio * 0.4;
    controls.maxDistance = dist * 3;
    controls.update();
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
  renderer.domElement.addEventListener('pointermove', alMover);
  renderer.domElement.addEventListener('pointerup', alSoltar);
  renderer.domElement.addEventListener('pointercancel', alSoltar);

  return {
    canvas: renderer.domElement,
    // direccion: desde donde mira la camara. Por defecto tres cuartos desde el frente; el
    // planificador mira desde el borde inferior del plano para que 2D y 3D se lean igual
    mostrar(grupo, { reencuadrar = true, direccion = [0.75, 0.55, 1], margen = 1.05 } = {}) {
      if (modelo) {
        scene.remove(modelo);
        liberar(modelo);
      }
      modelo = grupo;
      scene.add(modelo);
      if (reencuadrar) encuadrar(direccion, margen);
      pedir();
    },
    arrastrar(opciones) {
      opcionesArrastre = opciones;
    },
    destruir() {
      vivo = false;
      contenedor.removeEventListener('pointerdown', alPresionar, true);
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
