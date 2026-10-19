<template>
  <svg
    ref="svgRef"
    class="h-full w-full select-none"
    :class="dibujando ? 'cursor-crosshair' : ''"
    :viewBox="`${marco.x0 - MARGEN * k} ${marco.y0 - MARGEN * k} ${marco.x1 - marco.x0 + MARGEN * k * 2} ${marco.y1 - marco.y0 + MARGEN * k * 2}`"
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
      <!-- Largo de cada muro mientras se dibuja (el ultimo hasta el cursor) -->
      <text
        v-for="(m, i) in murosDibujo" :key="`md${i}`"
        :x="m.tx" :y="m.ty" :transform="`rotate(${m.ang} ${m.tx} ${m.ty})`"
        v-bind="TEXTO_COTA" text-anchor="middle" dominant-baseline="central"
      >{{ formatoM(m.largo) }} m</text>
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
        class="plan-rack cursor-move outline-none"
        style="touch-action: none"
        tabindex="0"
        role="button"
        :aria-label="`${i + 1}: ${describir(r)}${conflictos.has(r.id) ? ', superpuesto o fuera de la bodega' : ''}`"
        :aria-pressed="seleccion === r.id"
        @pointerdown.stop="iniciarArrastre($event, { tipo: 'rack', id: r.id, x: r.x, y: r.y })"
        @keydown="teclado($event, r)"
        @focus="enfocar($event, r.id)"
        @blur="focoTeclado = null"
      >
        <template v-for="f in [figura(r)]" :key="f.clave">
          <rect
            :x="f.x0" :y="f.y0" :width="f.ancho" :height="f.alto"
            :fill="conflictos.has(r.id) ? '#fee2e2' : COLOR[r.tipo].fondo"
            :stroke="conflictos.has(r.id) ? '#dc2626' : (seleccion === r.id ? '#0f172a' : COLOR[r.tipo].borde)"
            :stroke-width="seleccion === r.id ? 0.12 : 0.06"
          />
          <!-- Divisiones (cuerpos, calles o filas) -->
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
          <!-- Foco de teclado: borde de 2 px de pantalla, sin importar el zoom del plano -->
          <rect
            v-if="focoTeclado === r.id"
            :x="f.x0 - 0.12" :y="f.y0 - 0.12" :width="f.ancho + 0.24" :height="f.alto + 0.24"
            fill="none" stroke="#ea580c" stroke-width="2" vector-effect="non-scaling-stroke" pointer-events="none"
          />
        </template>
      </g>

      <!-- Racks mas altos que la altura libre: borde ambar punteado -->
      <rect
        v-for="r in racks.filter((q) => altos?.has(q.id) && !conflictos.has(q.id))" :key="`alto-${r.id}`"
        v-bind="rectDe(r)" fill="none" stroke="#b45309" stroke-width="0.14" stroke-dasharray="0.35 0.2" pointer-events="none"
      />

      <!-- Largo de cada muro -->
      <text
        v-for="(m, i) in muros" :key="`m${i}`"
        :x="m.tx" :y="m.ty" :transform="`rotate(${m.ang} ${m.tx} ${m.ty})`"
        v-bind="TEXTO_COTA" :font-size="0.42 * k" fill="#0f172a" text-anchor="middle" dominant-baseline="central"
      >{{ formatoM(m.largo) }} m</text>

      <!-- Cotas: medidas del rack y distancia a muros o al rack vecino (pasillo) -->
      <g v-for="(c, i) in cotas" :key="`c${i}`" pointer-events="none">
        <line :x1="c.x1" :y1="c.y1" :x2="c.x2" :y2="c.y2" :stroke="c.a === 'rack' ? '#0f766e' : '#64748b'" stroke-width="0.04" stroke-dasharray="0.18 0.1" />
        <text
          v-bind="TEXTO_COTA" :fill="c.a === 'rack' ? '#0f766e' : '#334155'" dominant-baseline="central"
          :x="posCota(c).x" :y="posCota(c).y" :transform="posCota(c).rot" :text-anchor="posCota(c).anchor"
        >{{ c.a === 'rack' ? 'pasillo ' : '' }}{{ formatoM(c.valor) }} m</text>
      </g>
      <!-- Medidas del rack en planta, sobre su esquina (lejos de las cotas, que salen del centro de cada lado) -->
      <text
        v-for="(d, i) in medidasRacks" :key="`d${i}`"
        :x="d.x0" :y="d.y0 - 0.3 * k" v-bind="TEXTO_COTA" fill="#0f172a" text-anchor="start"
      >{{ formatoM(d.ancho) }} × {{ formatoM(d.alto) }} m</text>

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
import { rectangulo, medidasRack, describir, contorno, caja, cotasRack, formatoM, PASO, PASO_MURO } from '~/lib/rack3d/planificador.js';

export interface RackPlano {
  id: string;
  tipo: 'RS' | 'AR' | 'DI';
  x: number;
  y: number;
  rot: 0 | 90 | 180 | 270;
  cuerpos: number;
  niveles: number;
  doble: boolean;
  fondos?: number;
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
  // Racks mas altos que la altura libre (borde ambar)
  altos?: Set<string>;
  // Cotas de todos los racks (para el plano que se exporta); si no, solo las del seleccionado
  cotasTodas?: boolean;
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

const MARGEN = 1.8;   // deja lugar a las medidas de los muros
const COLOR = {
  RS: { fondo: '#ffedd5', borde: '#ea580c', linea: '#fb923c' },
  DI: { fondo: '#fef3c7', borde: '#d97706', linea: '#f59e0b' },
  AR: { fondo: '#e0e7ff', borde: '#4f46e5', linea: '#818cf8' },
};
const uid = useId();
const svgRef = ref<SVGSVGElement | null>(null);
const cursor = ref<Punto | null>(null);
// Rack con foco de teclado (no de clic): lleva el anillo naranjo
const focoTeclado = ref<string | null>(null);

function enfocar(e: FocusEvent, id: string) {
  emit('seleccionar', id);
  focoTeclado.value = (e.target as Element).matches(':focus-visible') ? id : null;
}
const puntosDibujo = computed(() => props.puntosDibujo ?? []);

// Area visible: al dibujar, el lienzo (ancho × largo); si no, la caja del contorno
const marco = computed(() => {
  const c = caja(contorno(props.bodega));
  if (!props.dibujando) return c;
  return { x0: 0, y0: 0, x1: props.bodega.ancho, y1: props.bodega.largo };
});
// Medida de cada lado de un poligono, escrita por fuera y siempre legible (sin quedar de cabeza)
function medidasLados(pts: Punto[], cerrado: boolean) {
  const n = pts.length, cx = pts.reduce((t, p) => t + p.x, 0) / n, cy = pts.reduce((t, p) => t + p.y, 0) / n;
  const out = [];
  for (let i = 0; i < (cerrado ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const largo = Math.hypot(b.x - a.x, b.y - a.y);
    if (largo < 0.3) continue;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    let nx = -(b.y - a.y) / largo, ny = (b.x - a.x) / largo;
    if (nx * (mx - cx) + ny * (my - cy) < 0) { nx = -nx; ny = -ny; }   // hacia afuera
    let ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    if (ang > 90) ang -= 180; else if (ang < -90) ang += 180;
    out.push({ largo, tx: mx + nx * 0.75 * k.value, ty: my + ny * 0.75 * k.value, ang: +ang.toFixed(2) });
  }
  return out;
}
const muros = computed(() => medidasLados(contorno(props.bodega), true));
const murosDibujo = computed(() => {
  const pts = [...puntosDibujo.value, ...(cursor.value ? [cursor.value] : [])];
  return pts.length >= 2 ? medidasLados(pts, false) : [];
});

// Estilo de las cotas como atributos (no CSS): el plano se exporta copiando el SVG
// Crece con la bodega para que se lea igual en una de 10 m que en una de 80 m
const k = computed(() => { const c = marco.value; return Math.max(1, Math.max(c.x1 - c.x0, c.y1 - c.y0) / 25); });
const TEXTO_COTA = computed(() => ({
  'font-size': +(0.36 * k.value).toFixed(3), 'font-weight': 600, 'font-family': 'Inter, Arial, sans-serif', fill: '#334155',
  'paint-order': 'stroke', stroke: '#fff', 'stroke-width': +(0.12 * k.value).toFixed(3), 'stroke-linejoin': 'round', 'pointer-events': 'none',
}));

// Donde va el numero de una cota: al centro de la linea, o al costado si la linea es corta
function posCota(c: { x1: number; y1: number; x2: number; y2: number; valor: number }) {
  const mx = (c.x1 + c.x2) / 2, my = (c.y1 + c.y2) / 2, horizontal = c.y1 === c.y2;
  const corta = c.valor < 2.6 * k.value;
  if (corta) return horizontal ? { x: mx, y: my - 0.3 * k.value, rot: '', anchor: 'middle' } : { x: mx + 0.25 * k.value, y: my, rot: '', anchor: 'start' };
  return { x: mx, y: my, rot: horizontal ? '' : `rotate(-90 ${mx} ${my})`, anchor: 'middle' };
}

const rectDe = (r: RackPlano) => { const p = rectangulo(r); return { x: p.x0, y: p.y0, width: p.ancho, height: p.alto }; };

// Racks con cotas: el seleccionado o, al exportar, todos (sin repetir la misma cota entre vecinos)
const conCotas = computed(() => (props.cotasTodas ? props.racks : props.racks.filter((r) => r.id === props.seleccion)));
const cotas = computed(() => {
  if (props.dibujando) return [];
  const vistas = new Set<string>();
  return conCotas.value.flatMap((r) => cotasRack(r, props.racks, props.bodega)).filter((c) => {
    const k = [c.x1, c.y1, c.x2, c.y2].map((v) => v.toFixed(2)).sort().join();
    if (vistas.has(k)) return false;
    vistas.add(k);
    return true;
  });
});
const medidasRacks = computed(() => (props.dibujando ? [] : conCotas.value.map((r) => {
  const p = rectangulo(r);
  return { x0: p.x0, y0: p.y0, ancho: p.ancho, alto: p.alto, x: p.x0 + p.ancho / 2, y: p.y0 + p.alto / 2 };
})));

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
  const lineas: number[][] = [];
  // Lado por donde entra la grua en el drive-in
  const entrada = r.tipo === 'DI' ? seg(0, 0.06, L, 0.06) : null;
  const n = r.cuerpos, paso = L / n;
  for (let k = 1; k < n; k++) lineas.push(seg(k * paso, 0, k * paso, F));
  if (r.doble) lineas.push(seg(0, F / 2, L, F / 2));
  return { ...p, lineas, entrada, clave: `${r.id}-${m.tipo}` };
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
  focoTeclado.value = r.id;
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

