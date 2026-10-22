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
 * @returns {{ mostrar(grupo: THREE.Object3D, opciones?: { reencuadrar?: boolean, direccion?: number[], margen?: number, animar?: boolean, foco?: { x0: number, y0: number, x1: number, y1: number, alto?: number } | null }): void, centrar(): void, arrastrar(opciones: { alElegir(id: string): void, alSoltar(id: string, x: number, z: number): void }): void, operar(si: boolean): boolean, readonly tieneOperacion: boolean, mirarOperacion(): void, vista(nombre: string): void, recorrido(duracion?: number): Promise<void>, grabarRecorrido(duracion?: number): Promise<{ blob: Blob, extension: string } | null>, readonly gruasOperando: number, readonly puedeGrabar: boolean, captura(tipo?: string, calidad?: number): string, destruir(): void, canvas: HTMLCanvasElement }}
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

  // Solo en desarrollo: las pruebas de navegador posan la camara (window.__visor.mirar)
  if (import.meta.env?.DEV) {
    window.__visor = {
      mirar(p, o) { animacion = null; camera.position.set(...p); controls.target.set(...o); controls.update(); pedir(); },
      // Punto de planta (m) en pixeles de pantalla (para pruebas de arrastre)
      aPantalla(x, y, alto = 0) {
        const v = new THREE.Vector3(x, alto, y).project(camera), r = renderer.domElement.getBoundingClientRect();
        return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
      },
      get camara() { return { p: camera.position.toArray(), o: controls.target.toArray(), aspect: camera.aspect, fov: camera.fov, h: contenedor.clientHeight, w: contenedor.clientWidth, caja: ultimoEncuadre?.caja && [ultimoEncuadre.caja.min.toArray(), ultimoEncuadre.caja.max.toArray()] }; },
    };
  }
  let modelo = null;
  let pendiente = false;
  // Encuadre automatico: px de arriba y abajo que tapan los botones o avisos del componente
  let reserva = { arriba: 115, abajo: 40 };
  // Ultimo encuadre pedido y si el usuario ya movio la camara: si no la movio, al cambiar el tamano del
  // lienzo (p. ej. la pagina termina de acomodarse) se vuelve a encuadrar y nada queda cortado
  let pedidoEncuadre = null, tocado = false;
  let alPrimerCuadro = null;
  let vivo = true;
  let sombras = true;   // recalcular el mapa de sombras en el proximo cuadro
  // Operacion animada (grua del planificador): el modelo trae userData.animar(dt)
  let operando = false, ultimoCuadro = 0;
  let grabando = false;   // al grabar video se dibuja cada cuadro

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
    tocado = true;
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
    if (animacion.curva) {
      // Recorrido: la camara sigue una curva suave y el objetivo otra
      animacion.curva.getPointAt(e, camera.position);
      animacion.curvaObjetivo.getPointAt(e, controls.target);
    } else {
      camera.position.lerpVectors(animacion.p0, animacion.p1, e);
      controls.target.lerpVectors(animacion.t0, animacion.t1, e);
    }
    if (k >= 1) { const fin = animacion.alTerminar; animacion = null; fin?.(); }
    return true;
  }
  // Si el usuario toma la camara, la animacion se corta ahi mismo
  controls.addEventListener('start', () => { tocado = true; const fin = animacion?.alTerminar; animacion = null; fin?.(); });

  const dibujar = () => {
    pendiente = false;
    if (!vivo) return;
    const anim = pasoAnimacion();
    const zoom = pasoZoom();
    // Con amortiguacion la camara sigue moviendose unos cuadros despues de soltar
    const mov = controls.update();
    const ahora = performance.now();
    let opera = false;
    if (operando && modelo?.userData.animar) {
      // La grua no proyecta en el mapa de sombras (lleva la suya): no hay que recalcularlo
      opera = modelo.userData.animar(ultimoCuadro ? (ahora - ultimoCuadro) / 1000 : 0);
    }
    ultimoCuadro = opera ? ahora : 0;
    if (anim || zoom || mov || animacion || zoomPendiente || opera || grabando) pedir();
    if (sombras) { renderer.shadowMap.needsUpdate = true; sombras = false; }
    renderer.render(scene, camera);
    if (window.__visor) window.__visor.cuadros = (window.__visor.cuadros || 0) + 1;
    if (modelo && alPrimerCuadro) { const f = alPrimerCuadro; alPrimerCuadro = null; f(); }
  };
  // Primer modelo: los shaders se compilan en paralelo (compileAsync) antes del primer cuadro, para no
  // bloquear el hilo varios segundos en equipos lentos
  let compilando = null;
  const pedir = () => {
    if (compilando) return;
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
    if (modelo && pedidoEncuadre && !tocado && !animacion) encuadrar(pedidoEncuadre[0], pedidoEncuadre[1], false, pedidoEncuadre[2]);
    pedir();
  };
  const observador = new ResizeObserver(ajustarTamano);
  observador.observe(contenedor);

  // Calcula la vista que encuadra el modelo; con `animar` la camara viaja hasta ella
  // foco (opcional): { x0, y0, x1, y1, alto } en planta (m) para encuadrar solo lo diseñado y no la bodega
  // entera; las sombras y el piso siguen cubriendo todo el modelo
  function encuadrar(direccion, margen, animar = false, foco = null) {
    pedidoEncuadre = [direccion, margen, foco];
    tocado = false;
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

    // Camara: al foco si lo hay (planta → mundo: x = x, z = y), si no al modelo entero
    const cajaCam = foco ? new THREE.Box3(new THREE.Vector3(foco.x0, 0, foco.y0), new THREE.Vector3(foco.x1, foco.alto ?? 3, foco.y1)) : caja;
    const radioCam = Math.max(cajaCam.getSize(new THREE.Vector3()).length() / 2, 0.5);
    const { posicion: destino, objetivo, dist } = encajar(cajaCam, direccion, 1.02);
    // El piso se funde con el fondo a lo lejos: sin borde visible del disco
    scene.fog = new THREE.Fog(FONDO, dist * 1.8, dist * 5);
    camera.near = Math.max(0.02, dist / 300);
    camera.far = dist * 20;
    camera.updateProjectionMatrix();
    controls.minDistance = Math.min(radioCam * 0.08, 1.5);
    controls.maxDistance = Math.max(dist * 3, radio * 3);
    ultimoEncuadre = { posicion: destino, objetivo, centro: centro.clone(), dist, tam, caja: cajaCam };
    if (animar) {
      animarCamara(destino, objetivo);
    } else {
      animacion = null;
      camera.position.copy(destino);
      controls.target.copy(objetivo);
      controls.update();
    }
  }

  // Encuadre real: busca distancia y objetivo para que las 8 esquinas de `caja` queden dentro de la pantalla
  // (con margen y sin quedar bajo los botones de arriba), mirando desde `direccion`. Sirve para cualquier
  // tamaño de bodega y cualquier proporcion del lienzo (proyecta y corrige unas pocas veces)
  const _cam = new THREE.PerspectiveCamera();
  function encajar(caja, direccion, margen = 1) {
    const dir = new THREE.Vector3(...direccion).normalize();
    const esquinas = [];
    for (let i = 0; i < 8; i++) esquinas.push(new THREE.Vector3(i & 1 ? caja.max.x : caja.min.x, i & 2 ? caja.max.y : caja.min.y, i & 4 ? caja.max.z : caja.min.z));
    // Zona util en coordenadas de pantalla (-1 a 1): arriba quedan los botones (~115 px), abajo la ayuda (~40 px)
    const h = Math.max(160, contenedor.clientHeight || 400);
    // En lienzos bajos (adelanto, celular) las reservas se achican para no dejar el modelo en una franja
    const k = Math.min(1, h / 420);
    const arriba = THREE.MathUtils.clamp(1 - (2 * reserva.arriba * k) / h, 0.35, 0.96), abajo = Math.min(-0.5, -1 + (2 * reserva.abajo * k) / h);
    const zona = { x0: -0.94 / margen, x1: 0.94 / margen, y0: abajo / margen, y1: arriba / margen };
    _cam.copy(camera);
    const objetivo = caja.getCenter(new THREE.Vector3());
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let d = Math.max(caja.getSize(new THREE.Vector3()).length() / 2, 0.5) / tan * 1.5;
    const der = new THREE.Vector3(), arr = new THREE.Vector3(), q = new THREE.Vector3();
    for (let it = 0; it < 12; it++) {
      _cam.position.copy(objetivo).addScaledVector(dir, d);
      _cam.lookAt(objetivo);
      _cam.updateMatrixWorld();
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, detras = false;
      esquinas.forEach((e) => {
        q.copy(e).applyMatrix4(_cam.matrixWorldInverse);
        if (q.z > -_cam.near) detras = true;
        q.copy(e).project(_cam);
        x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
      });
      if (detras) { d *= 1.6; continue; }
      const altoT = d * tan, anchoT = altoT * _cam.aspect;
      der.set(1, 0, 0).applyQuaternion(_cam.quaternion);
      arr.set(0, 1, 0).applyQuaternion(_cam.quaternion);
      // Centra lo proyectado en la zona util y ajusta la distancia a lo que sobra o falta
      objetivo.addScaledVector(der, (((x0 + x1) - (zona.x0 + zona.x1)) / 2) * anchoT);
      objetivo.addScaledVector(arr, (((y0 + y1) - (zona.y0 + zona.y1)) / 2) * altoT);
      const s = Math.max((x1 - x0) / (zona.x1 - zona.x0), (y1 - y0) / (zona.y1 - zona.y0));
      d *= THREE.MathUtils.clamp(s, 0.5, 2);
      if (Math.abs(s - 1) < 0.01 && it > 2) break;
    }
    return { posicion: objetivo.clone().addScaledVector(dir, d), objetivo, dist: d };
  }
  let ultimoEncuadre = null;

  // Doble clic: la camara viaja a mirar el punto bajo el cursor, a algo menos de distancia
  function alDobleClic(e) {
    if (!modelo) return;
    const p = puntoBajoCursor(e.clientX, e.clientY, new THREE.Vector3());
    const d = camera.position.distanceTo(controls.target);
    const dn = THREE.MathUtils.clamp(d * 0.6, controls.minDistance, controls.maxDistance);
    const dir = camera.position.clone().sub(controls.target).normalize();
    tocado = true;
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

  // ─── Capas sobre el modelo (resaltado y vista previa de accesorios): no se liberan al cambiar el modelo ───
  const capas = {};
  function ponerCapa(nombre, grupo) {
    if (capas[nombre]) { scene.remove(capas[nombre]); liberar(capas[nombre]); }
    capas[nombre] = grupo;
    if (grupo) scene.add(grupo);
    pedir();
  }
  // Volumen de cada marca: canillera (punto) un bloque al pie del pilar; barra y linea, una franja a lo largo.
  // Con `pin`, ademas una esfera arriba para encontrarlas en una bodega grande
  function capaMarcas(marcas, color, opacidad, pin) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacidad, depthTest: false, depthWrite: false });
    const matPin = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false });
    const caja = new THREE.BoxGeometry(1, 1, 1);
    caja.translate(0, 0.5, 0);
    const bola = new THREE.SphereGeometry(0.16, 16, 12);
    const poner = (geo, m, x, y, z, sx, sy, sz, rot = 0) => {
      const o = new THREE.Mesh(geo, m);
      o.position.set(x, y, z);
      o.scale.set(sx, sy, sz);
      o.rotation.y = rot;
      o.renderOrder = 999;
      g.add(o);
    };
    marcas.forEach((k) => {
      if (k.tipo === 'punto') {
        const x = k.x + (k.nx ?? 0) * 0.08, z = k.y + (k.ny ?? 0) * 0.08;
        poner(caja, mat, x, 0, z, 0.24, k.alto ?? 0.6, 0.24);
        if (pin) poner(bola, matPin, x, (k.alto ?? 0.6) + 0.35, z, 1, 1, 1);
      } else {
        const L = Math.hypot(k.x2 - k.x1, k.y2 - k.y1);
        if (L < 0.05) return;
        const ang = -Math.atan2(k.y2 - k.y1, k.x2 - k.x1);
        const H = k.tipo === 'barra' ? 0.5 : 1.05;
        poner(caja, mat, (k.x1 + k.x2) / 2, 0, (k.y1 + k.y2) / 2, L, H, 0.14, ang);
        if (pin) poner(bola, matPin, (k.x1 + k.x2) / 2, H + 0.35, (k.y1 + k.y2) / 2, 1, 1, 1);
      }
    });
    return g;
  }

  // Camara y objetivo de cada vista fija (con el ultimo encuadre del modelo)
  function vistaDe(nombre) {
    const e = ultimoEncuadre;
    if (!e) return null;
    const c = e.centro.clone().setY(0);
    if (nombre === 'planta') {
      // Desde arriba, toda la bodega en cuadro, con el norte del plano arriba (casi vertical: el "arriba" de la
      // camara queda hacia -z, como el plano 2D)
      const v = encajar(e.caja, [0, 1, 0.012], 1.03);
      return { posicion: v.posicion, objetivo: v.objetivo };
    }
    if (nombre === 'isometrica') {
      const v = encajar(e.caja, [1, 0.95, 1], 1.03);
      return { posicion: v.posicion, objetivo: v.objetivo };
    }
    if (nombre === 'operador') {
      const v = modelo?.userData.vistaOperador?.();
      if (v) return { posicion: v.posicion.clone(), objetivo: v.objetivo.clone().setY(Math.min(v.objetivo.y, 1.1)) };
      return { posicion: c.clone().add(new THREE.Vector3(e.tam.x * 0.45, 1.6, e.tam.z * 0.45)), objetivo: c.clone().setY(1.1) };
    }
    return null;
  }

  return {
    canvas: renderer.domElement,
    // direccion: desde donde mira la camara. Por defecto tres cuartos desde el frente; el
    // planificador mira desde el borde inferior del plano para que 2D y 3D se lean igual
    // animar: con un modelo ya en pantalla, la camara viaja al nuevo encuadre en vez de saltar
    mostrar(grupo, { reencuadrar = true, direccion = [0.75, 0.55, 1], margen = 1.05, animar = true, foco = null } = {}) {
      const habia = !!modelo;
      if (modelo) {
        scene.remove(modelo);
        liberar(modelo);
      }
      modelo = grupo;
      scene.add(modelo);
      if (reencuadrar) encuadrar(direccion, margen, animar && habia, foco);
      sombras = true;
      if (!habia && renderer.compileAsync) {
        compilando = renderer.compileAsync(scene, camera).catch(() => {}).then(() => { compilando = null; pedir(); });
        return;
      }
      pedir();
    },
    // Vuelve (animado) a la vista inicial del modelo
    centrar() {
      if (!ultimoEncuadre) return;
      // Con el tamano actual del lienzo (pudo cambiar desde el primer encuadre)
      if (modelo && pedidoEncuadre) {
        const antes = { p: camera.position.clone(), o: controls.target.clone() };
        encuadrar(pedidoEncuadre[0], pedidoEncuadre[1], false, pedidoEncuadre[2]);
        const fin = { p: camera.position.clone(), o: controls.target.clone() };
        camera.position.copy(antes.p); controls.target.copy(antes.o);
        animarCamara(fin.p, fin.o);
        return;
      }
      animarCamara(ultimoEncuadre.posicion, ultimoEncuadre.objetivo);
    },
    // px que tapan los botones (arriba) y la ayuda (abajo): el encuadre los deja libres
    reservar(arriba = 115, abajo = 40) {
      reserva = { arriba, abajo };
    },
    // Se llama una vez, despues del primer cuadro dibujado con un modelo (para quitar el esqueleto de carga)
    primerCuadro(fn) {
      alPrimerCuadro = fn;
      pedir();
    },
    // Punto del piso (planta, m: { x, y }) bajo el puntero; lo que toca del modelo, o el piso si no toca nada
    pisoEn(clientX, clientY) {
      const r = renderer.domElement.getBoundingClientRect();
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
      const p = puntoBajoCursor(clientX, clientY, new THREE.Vector3());
      // Tambien donde el rayo corta el piso (lo que se ve detras de un rack, o el piso libre)
      const q = rayoZoom.ray.intersectPlane(planoPiso, new THREE.Vector3());
      return { x: p.x, y: p.z, alto: p.y, piso: q ? { x: q.x, y: q.z } : null };
    },
    // Accesorios del paso 4: marcas (planta) resaltadas sobre la escena, y la vista previa del que se arrastra
    resaltar(marcas, color = 0x2563eb) {
      ponerCapa('resaltado', marcas?.length ? capaMarcas(marcas, color, 0.45, true) : null);
    },
    fantasma(marca, ok = true) {
      ponerCapa('fantasma', marca ? capaMarcas([marca], ok ? 0x16a34a : 0xdc2626, 0.7, false) : null);
    },
    arrastrar(opciones) {
      opcionesArrastre = opciones;
    },
    // Enciende o pausa la operacion animada; devuelve si el modelo tiene una (sin sombra en el mapa)
    operar(si) {
      operando = !!si;
      ultimoCuadro = 0;
      pedir();
      return !!modelo?.userData.animar;
    },
    get tieneOperacion() { return !!modelo?.userData.animar; },
    get gruasOperando() { return modelo?.userData.gruasOperando ?? 0; },
    get puedeGrabar() { return typeof window !== 'undefined' && !!window.MediaRecorder && !!renderer.domElement.captureStream; },
    // Lleva la camara (animada) a mirar la grua operando
    mirarOperacion() {
      tocado = true;
      const c = modelo?.userData.camaraOperacion;
      if (c) animarCamara(c.posicion, c.objetivo, 900);
    },
    // Vistas fijas: 'planta' (desde arriba), 'isometrica' o 'operador' (1,6 m dentro de un pasillo)
    vista(nombre) {
      const v = vistaDe(nombre);
      tocado = true;
      if (v) animarCamara(v.posicion, v.objetivo, nombre === 'operador' ? 1300 : 900);
    },
    // Vuelo automatico (~12 s): planta → sobre la grua → altura de operador. Devuelve una promesa
    // que se cumple al terminar (o si el usuario toma la camara)
    recorrido(duracion = 12000) {
      return new Promise((listo) => {
        const e = ultimoEncuadre;
        if (!e) { listo(); return; }
        tocado = true;
        const planta = vistaDe('planta'), op = vistaDe('operador');
        const gp = modelo?.userData.gruaPosicion?.() ?? e.centro.clone();
        const sobre = new THREE.Vector3(gp.x, 0, gp.z);
        // Pasa por arriba de la grua, bajando, con la grua al centro
        const p1 = planta.posicion.clone().lerp(sobre.clone().setY(e.dist * 0.45), 0.6);
        const p2 = sobre.clone().add(new THREE.Vector3(-(op.posicion.x - sobre.x) * 0.3 + 3, 6, -(op.posicion.z - sobre.z) * 0.3 + 3));
        const o1 = e.centro.clone().lerp(sobre, 0.7);
        const o2 = sobre.clone().setY(1.2);
        zoomPendiente = 0;
        animacion = {
          curva: new THREE.CatmullRomCurve3([camera.position.clone(), planta.posicion, p1, p2, op.posicion], false, 'centripetal'),
          curvaObjetivo: new THREE.CatmullRomCurve3([controls.target.clone(), planta.objetivo, o1, o2, op.objetivo], false, 'centripetal'),
          inicio: performance.now(), duracion, alTerminar: listo,
        };
        pedir();
      });
    },
    // Graba el recorrido como video. Devuelve { blob, extension } o null si el navegador no puede
    async grabarRecorrido(duracion = 12000) {
      const MR = typeof window !== 'undefined' ? window.MediaRecorder : null;
      if (!MR || !renderer.domElement.captureStream) return null;
      const tipos = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      const tipo = tipos.find((t) => MR.isTypeSupported?.(t)) ?? '';
      const flujo = renderer.domElement.captureStream(30);
      const rec = new MR(flujo, tipo ? { mimeType: tipo, videoBitsPerSecond: 6e6 } : undefined);
      const partes = [];
      rec.ondataavailable = (ev) => { if (ev.data?.size) partes.push(ev.data); };
      const fin = new Promise((ok) => { rec.onstop = ok; });
      grabando = true;
      pedir();
      rec.start(250);
      try {
        await this.recorrido(duracion);
        await new Promise((ok) => setTimeout(ok, 400));
      } finally {
        rec.stop();
        grabando = false;
        flujo.getTracks().forEach((t) => t.stop());
      }
      await fin;
      const mime = rec.mimeType || tipo || 'video/webm';
      return { blob: new Blob(partes, { type: mime }), extension: mime.includes('mp4') ? 'mp4' : 'webm' };
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
      Object.values(capas).forEach((c) => c && liberar(c));
      liberar(piso);
      entorno.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
