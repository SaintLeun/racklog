<template>
  <svg
    ref="svgRef"
    class="h-full w-full select-none"
    :class="dibujando ? 'cursor-crosshair' : ''"
    :viewBox="`${marco.x0 - MARGEN} ${marco.y0 - MARGEN} ${marco.x1 - marco.x0 + MARGEN * 2} ${marco.y1 - marco.y0 + MARGEN * 2}`"
    preserveAspectRatio="xMidYMid meet"
    role="application"
    aria-roledescription="plano de bodega"
    :aria-label="dibujando
      ? 'Dibujo del contorno de la bodega: haz clic en cada esquina y termina en el primer punto.'
      : `Plano de la bodega con ${racks.length} racks. Selecciona un rack y muévelo con las flechas; R lo gira y Suprimir lo elimina.`"
    @pointerdown.self="dibujando ? clicDibujo($event) : emit('seleccionar', null)"
    @pointermove="moverPuntero"
    @pointerup="soltar"
    @pointercancel="soltar"
  >
    <defs>
      <pattern :id="`${uid}-grilla`" width="1" height="1" patternUnits="userSpaceOnUse">
        <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#e5e7eb" stroke-width="0.02" />
      </pattern>
      <pattern :id="`${uid}-grilla5`" width="5" height="5" patternUnits="userSpaceOnUse">
        <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#d1d5db" stroke-width="0.04" />
      </pattern>
    </defs>

    <!-- Dibujando: lienzo cuadriculado; cada clic agrega una esquina (grilla de 50 cm) -->
    <template v-if="dibujando">
      <rect
        :x="marco.x0" :y="marco.y0" :width="marco.x1 - marco.x0" :height="marco.y1 - marco.y0"
        fill="#fff" @pointerdown="clicDibujo"
      />
      <rect :x="marco.x0" :y="marco.y0" :width="marco.x1 - marco.x0" :height="marco.y1 - marco.y0" :fill="`url(#${uid}-grilla)`" pointer-events="none" />
      <rect :x="marco.x0" :y="marco.y0" :width="marco.x1 - marco.x0" :height="marco.y1 - marco.y0" :fill="`url(#${uid}-grilla5)`" pointer-events="none" />
      <polyline
        v-if="puntosDibujo.length"
        :points="[...puntosDibujo, ...(cursor ? [cursor] : [])].map((p) => `${p.x},${p.y}`).join(' ')"
        fill="rgba(234, 88, 12, 0.08)" stroke="#374151" stroke-width="0.15" stroke-linejoin="round" pointer-events="none"
      />
      <circle
        v-for="(p, i) in puntosDibujo" :key="i"
        :cx="p.x" :cy="p.y" :r="i === 0 && puntosDibujo.length >= 3 ? 0.45 : 0.25"
        :fill="i === 0 && puntosDibujo.length >= 3 ? '#ea580c' : '#374151'"
        @pointerdown.stop="i === 0 && puntosDibujo.length >= 3 ? emit('cerrar-contorno') : clicDibujo($event)"
      />
      <circle v-if="cursor" :cx="cursor.x" :cy="cursor.y" r="0.18" fill="#ea580c" pointer-events="none" />
    </template>

    <template v-else>
      <!-- Piso y muros -->
      <path :d="trazo" fill="#fff" @pointerdown="emit('seleccionar', null)" />
      <path :d="trazo" :fill="`url(#${uid}-grilla)`" pointer-events="none" />
      <path :d="trazo" :fill="`url(#${uid}-grilla5)`" pointer-events="none" />
      <path :d="trazo" fill="none" stroke="#374151" stroke-width="0.2" stroke-linejoin="round" pointer-events="none" />

      <!-- Racks -->
      <g
        v-for="(r, i) in racks"
        :key="r.id"
        class="cursor-move outline-none"
        style="touch-action: none"
        tabindex="0"
        role="button"
        :aria-label="`${i + 1}: ${describir(r)}${conflictos.has(r.id) ? ', superpuesto o fuera de la bodega' : ''}`"
        :aria-pressed="seleccion === r.id"
        @pointerdown.stop="iniciarArrastre($event, { tipo: 'rack', id: r.id, x: r.x, y: r.y })"
        @keydown="teclado($event, r)"
        @focus="emit('seleccionar', r.id)"
      >
        <template v-for="f in [figura(r)]" :key="f.clave">
          <rect
            :x="f.x0" :y="f.y0" :width="f.ancho" :height="f.alto"
            :fill="conflictos.has(r.id) ? '#fee2e2' : COLOR[r.tipo].fondo"
            :stroke="conflictos.has(r.id) ? '#dc2626' : (seleccion === r.id ? '#0f172a' : COLOR[r.tipo].borde)"
            :stroke-width="seleccion === r.id ? 0.12 : 0.06"
          />
          <!-- Divisiones (cuerpos, calles o filas) y zona del pasillo/escalera del altillo -->
          <rect v-for="(z, k) in f.zonas" :key="`z${k}`" :x="z.x0" :y="z.y0" :width="z.ancho" :height="z.alto" :fill="COLOR[r.tipo].zona" pointer-events="none" />
          <line
            v-for="(l, k) in f.lineas" :key="k"
            :x1="l[0]" :y1="l[1]" :x2="l[2]" :y2="l[3]"
            :stroke="COLOR[r.tipo].linea" stroke-width="0.03" pointer-events="none"
          />
          <line
            v-if="f.entrada"
            :x1="f.entrada[0]" :y1="f.entrada[1]" :x2="f.entrada[2]" :y2="f.entrada[3]"
            :stroke="COLOR[r.tipo].borde" stroke-width="0.14" stroke-dasharray="0.3 0.15" pointer-events="none"
          />
          <text
            v-if="Math.min(f.ancho, f.alto) >= 0.7"
            :x="f.x0 + f.ancho / 2" :y="f.y0 + f.alto / 2"
            text-anchor="middle" dominant-baseline="central"
            :font-size="Math.min(0.6, Math.min(f.ancho, f.alto) * 0.55)"
            font-weight="700" font-family="Inter, Arial, sans-serif" fill="#1f2937" pointer-events="none"
          >{{ i + 1 }}</text>
        </template>
      </g>

      <!-- Esquinas de una bodega de forma libre: se arrastran para ajustarla -->
      <template v-if="editarContorno">
        <circle
          v-for="(p, i) in bodega.forma" :key="`v${i}`"
          :cx="p.x" :cy="p.y" r="0.35"
          fill="#fff" stroke="#ea580c" stroke-width="0.1"
          class="cursor-grab" style="touch-action: none"
          role="button" :aria-label="`Esquina ${i + 1} de la bodega`"
          @pointerdown.stop="iniciarArrastre($event, { tipo: 'vertice', id: String(i), x: p.x, y: p.y })"
        />
      </template>
    </template>
  </svg>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { rectangulo, medidasRack, describir, contorno, caja, PASO, PASO_MURO } from '~/lib/rack3d/planificador.js';

export interface RackPlano {
  id: string;
  tipo: 'RS' | 'AR' | 'DI' | 'AL';
  x: number;
  y: number;
  rot: 0 | 90 | 180 | 270;
  cuerpos: number;
  niveles: number;
  doble: boolean;
  fondos?: number;
  pisos?: number;
}
export interface Punto { x: number; y: number }

const props = defineProps<{
  bodega: { ancho: number; largo: number; forma: Punto[] | null };
  racks: RackPlano[];
  seleccion: string | null;
  conflictos: Set<string>;
  dibujando?: boolean;
  puntosDibujo?: Punto[];
  editarContorno?: boolean;
}>();

const emit = defineEmits<{
  seleccionar: [id: string | null];
  mover: [id: string, x: number, y: number];
  girar: [id: string];
  eliminar: [id: string];
  'agregar-punto': [p: Punto];
  'cerrar-contorno': [];
  'mover-vertice': [i: number, p: Punto];
}>();

const MARGEN = 1;
const COLOR = {
  RS: { fondo: '#ffedd5', borde: '#ea580c', linea: '#fb923c', zona: 'transparent' },
  DI: { fondo: '#fef3c7', borde: '#d97706', linea: '#f59e0b', zona: 'transparent' },
  AR: { fondo: '#e0e7ff', borde: '#4f46e5', linea: '#818cf8', zona: 'transparent' },
  AL: { fondo: '#ede9fe', borde: '#7c3aed', linea: '#a78bfa', zona: 'rgba(124, 58, 237, 0.12)' },
};
const uid = useId();
const svgRef = ref<SVGSVGElement | null>(null);
const cursor = ref<Punto | null>(null);
const puntosDibujo = computed(() => props.puntosDibujo ?? []);

// Area visible: al dibujar, el lienzo (ancho × largo); si no, la caja del contorno
const marco = computed(() => {
  const c = caja(contorno(props.bodega));
  if (!props.dibujando) return c;
  return { x0: 0, y0: 0, x1: props.bodega.ancho, y1: props.bodega.largo };
});
const trazo = computed(() => contorno(props.bodega).map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') + ' Z');

function figura(r: RackPlano) {
  const p = rectangulo(r);
  const m = medidasRack(r) as Record<string, any>;
  const lado = r.rot === 90 || r.rot === 270;
  // Coordenadas locales (u a lo largo desde la izquierda, v desde el frente) → plano, igual que el giro 3D
  const L = lado ? p.alto : p.ancho, F = lado ? p.ancho : p.alto;
  const aPlanoLocal = (u: number, v: number) => ({
    0: [p.x0 + u, p.y0 + v],
    90: [p.x0 + F - v, p.y0 + u],
    180: [p.x0 + L - u, p.y0 + F - v],
    270: [p.x0 + v, p.y0 + L - u],
  })[r.rot];
  const seg = (u0: number, v0: number, u1: number, v1: number) => [...aPlanoLocal(u0, v0), ...aPlanoLocal(u1, v1)];
  const zona = (u0: number, v0: number, u1: number, v1: number) => {
    const [a, b, c, d] = seg(u0, v0, u1, v1);
    return { x0: Math.min(a, c), y0: Math.min(b, d), ancho: Math.abs(c - a), alto: Math.abs(d - b) };
  };
  const lineas: number[][] = [], zonas: ReturnType<typeof zona>[] = [];
  let entrada: number[] | null = null;
  if (r.tipo === 'AL') {
    // Escalera a la izquierda, pasillo al frente y la estanteria detras (como construir.js)
    const esc = m.largoEscalera, pas = 1;
    zonas.push(zona(0, 0, esc, 0.8), zona(esc, 0, L, pas));
    const paso = (L - esc) / r.cuerpos;
    for (let k = 1; k < r.cuerpos; k++) lineas.push(seg(esc + k * paso, pas, esc + k * paso, F));
    lineas.push(seg(esc, 0, esc, F));
    if (r.doble) lineas.push(seg(esc, pas + (F - pas) / 2, L, pas + (F - pas) / 2));
  } else {
    if (r.tipo === 'DI') entrada = seg(0, 0.06, L, 0.06);   // lado por donde entra la grua
    const n = r.cuerpos, paso = L / n;
    for (let k = 1; k < n; k++) lineas.push(seg(k * paso, 0, k * paso, F));
    if (r.doble) lineas.push(seg(0, F / 2, L, F / 2));
  }
  return { ...p, lineas, zonas, entrada, clave: `${r.id}-${m.tipo}` };
}

// Coordenadas del puntero en metros de la bodega
function aPlano(e: PointerEvent) {
  const svg = svgRef.value!;
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM()!.inverse());
}

const aGrilla = (p: Punto, paso: number) => {
  const m = marco.value;
  return {
    x: Math.min(m.x1, Math.max(m.x0, Math.round(p.x / paso) * paso)),
    y: Math.min(m.y1, Math.max(m.y0, Math.round(p.y / paso) * paso)),
  };
};

function clicDibujo(e: PointerEvent) {
  if (e.button !== 0) return;
  emit('agregar-punto', aGrilla(aPlano(e), PASO_MURO));
}

let arrastre: { tipo: 'rack' | 'vertice'; id: string; dx: number; dy: number; puntero: number } | null = null;

function iniciarArrastre(e: PointerEvent, o: { tipo: 'rack' | 'vertice'; id: string; x: number; y: number }) {
  if (e.button !== 0) return;
  if (o.tipo === 'rack') emit('seleccionar', o.id);
  const p = aPlano(e);
  arrastre = { tipo: o.tipo, id: o.id, dx: o.x - p.x, dy: o.y - p.y, puntero: e.pointerId };
  svgRef.value?.setPointerCapture(e.pointerId);
}

function moverPuntero(e: PointerEvent) {
  const p = aPlano(e);
  if (props.dibujando) {
    cursor.value = aGrilla(p, PASO_MURO);
    return;
  }
  if (!arrastre || e.pointerId !== arrastre.puntero) return;
  const destino = { x: p.x + arrastre.dx, y: p.y + arrastre.dy };
  if (arrastre.tipo === 'rack') emit('mover', arrastre.id, destino.x, destino.y);
  else emit('mover-vertice', Number(arrastre.id), { x: Math.round(destino.x / PASO_MURO) * PASO_MURO, y: Math.round(destino.y / PASO_MURO) * PASO_MURO });
}

function soltar() {
  arrastre = null;
}

function teclado(e: KeyboardEvent, r: RackPlano) {
  const d = e.shiftKey ? 1 : PASO;
  const mov: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
  if (mov[e.key]) {
    e.preventDefault();
    emit('mover', r.id, r.x + mov[e.key][0], r.y + mov[e.key][1]);
  } else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    emit('girar', r.id);
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    emit('eliminar', r.id);
  }
}
</script>
