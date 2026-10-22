<template>
  <!-- Pallet (o bandeja de angulo ranurado) armado caja por caja en 3D, con sus cotas. three.js se carga solo al mostrarse -->
  <div class="relative h-full w-full overflow-hidden rounded-xl bg-[#f6f7f9]">
    <div ref="lienzo" class="h-full w-full cursor-grab active:cursor-grabbing" role="img" :aria-label="etiqueta" />
    <div v-if="cargando" class="absolute inset-0 animate-pulse bg-neutral-100" aria-hidden="true" />
    <template v-if="!cargando">
      <!-- Vistas: de lado (con perspectiva) o desde arriba -->
      <div class="absolute left-2 top-2 flex gap-1 rounded-lg bg-white/90 p-0.5 text-xs font-medium shadow-sm ring-1 ring-black/10" role="group" :aria-label="base === 'bandeja' ? 'Vista de la bandeja' : 'Vista del pallet'">
        <button v-for="v in VISTAS" :key="v.k" type="button" :aria-pressed="vista === v.k" :class="['min-h-8 rounded-md px-2.5', vista === v.k ? 'bg-neutral-900 text-white' : 'text-neutral-700']" @click="verDesde(v.k)">{{ v.t }}</button>
      </div>
      <div class="absolute right-2 top-2 flex gap-1">
        <button type="button" class="min-h-8 rounded-lg bg-white/90 px-2.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/10 hover:bg-white" :aria-label="'Armar de nuevo'" title="Armar de nuevo" @click="armar(true)">↻</button>
      </div>
    </template>
    <!-- Cotas en texto (tambien para lectores de pantalla y si no hay 3D) -->
    <p class="sr-only">frente {{ fm(frente) }} m, fondo {{ fm(fondo) }} m<template v-if="alto">, alto {{ fm(alto) }} m</template>, {{ camas }} {{ camas === 1 ? 'cama' : 'camas' }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

const props = withDefaults(defineProps<{
  frente: number; fondo: number;
  caja: { largo: number; ancho: number; alto: number };
  cols: number; filas: number; camas: number; largoEnFrente: boolean;
  etiqueta?: string; alto?: number;
  // 'pallet': tarima de madera; 'bandeja': bandeja de angulo ranurado (galvanizada, con sus 4 angulos)
  base?: 'pallet' | 'bandeja';
}>(), { base: 'pallet', etiqueta: undefined, alto: undefined });
const fm = (v: number) => (+(+v).toFixed(2)).toLocaleString('es-CL', { minimumFractionDigits: 2 });
const VISTAS = [{ k: 'lado', t: 'De lado' }, { k: 'arriba', t: 'Desde arriba' }] as const;
const vista = ref<'lado' | 'arriba'>('lado');
// Encuadre: de lado en diagonal (frente a la derecha) o desde arriba (frente abajo, como en el pasillo)
const DIRECCION = { lado: [1, 0.8, 1.35], arriba: [0, 1, 0.001] };
const lienzo = ref<HTMLElement | null>(null);
const cargando = ref(true);
let visor: any = null, construir: any = null, THREE: any = null, reloj: ReturnType<typeof setTimeout> | null = null;
const quieto = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const ALTO_BANDEJA = 0.03;

// Etiqueta de cota: texto oscuro sobre fondo blanco, siempre de frente a la camara y encima de todo
function etiquetaCota(lineas: string[], alturaMundo: number) {
  const fs = 44, pad = 14, c = document.createElement('canvas'), x = c.getContext('2d')!;
  x.font = `600 ${fs}px Inter, "Helvetica Neue", Arial, sans-serif`;
  const w = Math.ceil(Math.max(...lineas.map((l) => x.measureText(l).width)) + pad * 2), h = Math.ceil(lineas.length * fs * 1.15 + pad * 1.4);
  c.width = w; c.height = h;
  x.font = `600 ${fs}px Inter, "Helvetica Neue", Arial, sans-serif`;
  x.fillStyle = 'rgba(255,255,255,0.94)';
  x.strokeStyle = 'rgba(15,23,42,0.18)'; x.lineWidth = 3;
  x.beginPath(); x.roundRect(1.5, 1.5, w - 3, h - 3, 14); x.fill(); x.stroke();
  x.fillStyle = '#0f172a'; x.textAlign = 'center'; x.textBaseline = 'middle';
  lineas.forEach((l, i) => { x.fillStyle = i ? '#475569' : '#0f172a'; x.fillText(l, w / 2, pad * 0.7 + fs * 1.15 * (i + 0.5)); });
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthTest: false, transparent: true, fog: false, toneMapped: false }));
  const k = alturaMundo / (fs * 1.15);
  s.scale.set(w * k, h * k, 1);
  s.renderOrder = 20;
  return s;
}

// Linea de cota con remates (segmentos entre pares de puntos)
function lineaCota(puntos: number[][]) {
  const geo = new THREE.BufferGeometry().setFromPoints(puntos.map((p) => new THREE.Vector3(...p)));
  const l = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x1e293b, depthTest: false, transparent: true, fog: false }));
  l.renderOrder = 19;
  return l;
}

function cotas(g: any, top: number, baseAlto: number) {
  const f = props.frente, d = props.fondo, S = Math.max(f, d, top), off = S * 0.08, t = S * 0.03, letra = S * ((lienzo.value?.clientWidth ?? 600) < 500 ? 0.12 : 0.085);
  const zf = d / 2 + off, xd = f / 2 + off, xa = -f / 2 - off;
  // Frente (a lo largo del pasillo), al pie
  g.add(lineaCota([[-f / 2, 0.003, zf], [f / 2, 0.003, zf], [-f / 2, 0.003, zf - t], [-f / 2, 0.003, zf + t], [f / 2, 0.003, zf - t], [f / 2, 0.003, zf + t]]));
  const ef = etiquetaCota([`frente ${fm(f)} m`], letra);
  ef.position.set(0, letra * 0.6, zf + off * 0.9);
  g.add(ef);
  // Fondo, al costado derecho
  g.add(lineaCota([[xd, 0.003, -d / 2], [xd, 0.003, d / 2], [xd - t, 0.003, -d / 2], [xd + t, 0.003, -d / 2], [xd - t, 0.003, d / 2], [xd + t, 0.003, d / 2]]));
  const ed = etiquetaCota([`fondo ${fm(d)} m`], letra);
  ed.position.set(xd + off * 1.6, letra * 0.6, 0);
  g.add(ed);
  // Alto, en la esquina de adelante a la izquierda, con una marca por cama
  if (props.camas > 0) {
    const pts: number[][] = [[xa, 0, zf], [xa, top, zf], [xa - t, 0, zf], [xa + t, 0, zf], [xa - t, top, zf], [xa + t, top, zf]];
    for (let c = 1; c < props.camas; c++) { const yc = baseAlto + c * props.caja.alto; pts.push([xa - t * 0.6, yc, zf], [xa + t * 0.6, yc, zf]); }
    g.add(lineaCota(pts));
    const altoTxt = props.base === 'bandeja' ? `${fm(top - baseAlto)} m de cajas` : `alto ${fm(top)} m`;
    const ea = etiquetaCota([altoTxt, `${props.camas} ${props.camas === 1 ? (props.base === 'bandeja' ? 'caja de alto' : 'cama') : (props.base === 'bandeja' ? 'cajas de alto' : 'camas')}`], letra);
    ea.position.set(xa - off * 0.4 - ea.scale.x / 2, top / 2, zf);
    g.add(ea);
  }
}

// Bandeja de angulo ranurado: plancha galvanizada y los 4 angulos (cortos, para no tapar las cajas)
function bandeja(g: any, top: number) {
  const f = props.frente, d = props.fondo;
  const galv = new THREE.MeshStandardMaterial({ color: 0xb4bac1, metalness: 0.7, roughness: 0.38 });
  const plancha = new THREE.Mesh(new THREE.BoxGeometry(f, ALTO_BANDEJA, d), galv);
  plancha.position.y = ALTO_BANDEJA / 2;
  plancha.castShadow = true; plancha.receiveShadow = true;
  g.add(plancha);
  const azul = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.4 });
  const a = 0.035, h = top + 0.08;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(a, h, a), azul);
    p.position.set(sx * (f / 2 + a / 2), h / 2, sz * (d / 2 + a / 2));
    p.castShadow = true;
    g.add(p);
  });
}

function armar(animar: boolean) {
  if (!visor || !construir) return;
  const enBandeja = props.base === 'bandeja';
  const altoBase = enBandeja ? ALTO_BANDEJA : 0.15;
  const g = construir.palletArmado({ ...props, altoTarima: altoBase });
  if (enBandeja) {
    // Sin tarima de madera: la bandeja la reemplaza
    const tarima = g.children[0];
    g.remove(tarima); tarima.geometry?.dispose(); tarima.material?.dispose?.();
  }
  const top = altoBase + Math.max(0, props.camas) * props.caja.alto;
  if (enBandeja) bandeja(g, top);
  cotas(g, top, altoBase);
  // Encuadre: el modelo con sus cotas llena el visor (solo se reserva la franja de los botones de arriba)
  visor.reservar?.(44, 6);
  visor.mostrar(g, { direccion: DIRECCION[vista.value], animar: false });
  if (animar && !quieto()) { g.userData.reiniciar?.(); visor.operar(true); } else { g.userData.completar?.(); visor.operar(false); }
}

function verDesde(v: 'lado' | 'arriba') {
  vista.value = v;
  armar(false);
}

onMounted(async () => {
  const [v, c, t] = await Promise.all([import('~/lib/rack3d/visor.js'), import('~/lib/rack3d/construir.js'), import('three')]);
  if (!lienzo.value || !v.webglDisponible()) return;
  await Promise.race([c.cargarLogo(), new Promise((ok) => setTimeout(ok, 1200))]);
  if (!lienzo.value) return;
  construir = c; THREE = t;
  visor = v.crearVisor(lienzo.value);
  cargando.value = false;
  armar(true);
});
// Cada cambio se ve al instante (se rearma, sin esperar a que termine la animacion anterior)
watch(() => JSON.stringify(props), () => {
  if (reloj) clearTimeout(reloj);
  reloj = setTimeout(() => armar(true), 180);
});
onBeforeUnmount(() => { if (reloj) clearTimeout(reloj); visor?.destruir(); visor = null; });
</script>
