<template>
  <svg
    ref="svgRef"
    class="h-full w-full select-none"
    :class="dibujando || herramienta === 'medir' ? 'cursor-crosshair' : (paneo ? 'cursor-grabbing' : '')"
    :viewBox="`${vista.x} ${vista.y} ${vista.w} ${vista.h}`"
    preserveAspectRatio="xMidYMid meet"
    role="application"
    aria-roledescription="plano de bodega"
    :aria-label="dibujando
      ? 'Dibujo del contorno de la bodega: haz clic en cada esquina y termina en el primer punto. También puedes escribir el largo y el ángulo de cada muro en el panel.'
      : `Plano de la bodega con ${racks.length} racks. Selecciona un rack y muévelo con las flechas; R lo gira y Suprimir lo elimina.`"
    style="touch-action: none"
    @pointerdown.self="presionarFondo"
    @pointermove="moverPuntero"
    @pointerup="soltar"
    @pointercancel="soltar"
    @wheel.prevent="rueda"
  >
    <defs>
      <pattern :id="`${uid}-grilla`" :width="grillaFina" :height="grillaFina" patternUnits="userSpaceOnUse">
        <path :d="`M ${grillaFina} 0 L 0 0 0 ${grillaFina}`" fill="none" stroke="#e5e7eb" :stroke-width="0.02 * grillaFina" />
      </pattern>
      <pattern :id="`${uid}-grilla5`" width="5" height="5" patternUnits="userSpaceOnUse">
        <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#d1d5db" stroke-width="0.04" />
      </pattern>
    </defs>

    <!-- Dibujando: lienzo cuadriculado; cada clic agrega una esquina -->
    <template v-if="dibujando">
      <rect
        :x="marco.x0" :y="marco.y0" :width="marco.x1 - marco.x0" :height="marco.y1 - marco.y0"
        fill="#fff" @pointerdown="presionarFondo"
      />
      <rect :x="marco.x0" :y="marco.y0" :width="marco.x1 - marco.x0" :height="marco.y1 - marco.y0" :fill="`url(#${uid}-grilla)`" pointer-events="none" />
      <rect :x="marco.x0" :y="marco.y0" :width="marco.x1 - marco.x0" :height="marco.y1 - marco.y0" :fill="`url(#${uid}-grilla5)`" pointer-events="none" />
      <!-- Guias de alineacion con otras esquinas -->
      <line
        v-for="(g, i) in guias" :key="`g${i}`"
        :x1="g.x1" :y1="g.y1" :x2="g.x2" :y2="g.y2"
        stroke="#0ea5e9" stroke-width="1" vector-effect="non-scaling-stroke" stroke-dasharray="4 3" pointer-events="none"
      />
      <polyline
        v-if="puntosDibujo.length"
        :points="[...puntosDibujo, ...(cursor ? [cursor] : [])].map((p) => `${p.x},${p.y}`).join(' ')"
        fill="rgba(234, 88, 12, 0.08)" stroke="#374151" stroke-width="0.15" stroke-linejoin="round" pointer-events="none"
      />
      <circle
        v-for="(p, i) in puntosDibujo" :key="i"
        :cx="p.x" :cy="p.y" :r="(i === 0 && puntosDibujo.length >= 3 ? 0.45 : 0.25) * k"
        :fill="i === 0 && puntosDibujo.length >= 3 ? '#ea580c' : '#374151'"
        @pointerdown.stop="i === 0 && puntosDibujo.length >= 3 ? emit('cerrar-contorno') : presionarFondo($event)"
      />
      <template v-if="cursor">
        <circle :cx="cursor.x" :cy="cursor.y" :r="0.18 * k" fill="#ea580c" pointer-events="none" />
        <!-- Ajuste activo: esquina o punto medio -->
        <rect
          v-if="ajuste" :x="cursor.x - 0.35 * k" :y="cursor.y - 0.35 * k" :width="0.7 * k" :height="0.7 * k"
          fill="none" stroke="#0ea5e9" stroke-width="1.5" vector-effect="non-scaling-stroke" pointer-events="none"
          :transform="ajuste === 'medio' ? `rotate(45 ${cursor.x} ${cursor.y})` : ''"
        />
        <text
          v-if="textoCursor" :x="cursor.x + 0.5 * k" :y="cursor.y - 0.5 * k"
          v-bind="TEXTO_COTA" fill="#0369a1" text-anchor="start"
        >{{ textoCursor }}</text>
      </template>
      <!-- Largo de cada muro mientras se dibuja (el ultimo hasta el cursor) -->
      <text
        v-for="(m, i) in murosDibujo" :key="`md${i}`"
        :x="m.tx" :y="m.ty" :transform="`rotate(${m.ang} ${m.tx} ${m.ty})`"
        v-bind="TEXTO_COTA" text-anchor="middle" dominant-baseline="central"
      >{{ formatoM(m.largo) }} m</text>
    </template>

    <template v-else>
      <!-- Piso y muros -->
      <path :d="trazo" fill="#fff" @pointerdown="presionarFondo" />
      <path :d="trazo" :fill="`url(#${uid}-grilla)`" pointer-events="none" />
      <path :d="trazo" :fill="`url(#${uid}-grilla5)`" pointer-events="none" />
      <path :d="trazo" fill="none" stroke="#374151" stroke-width="0.2" stroke-linejoin="round" pointer-events="none" />
      <!-- Muro seleccionado para editar su largo -->
      <line
        v-if="muroSel !== null && muroSel !== undefined && ladoSel"
        :x1="ladoSel.a.x" :y1="ladoSel.a.y" :x2="ladoSel.b.x" :y2="ladoSel.b.y"
        stroke="#0ea5e9" stroke-width="0.35" stroke-linecap="round" pointer-events="none"
      />

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
        @pointerdown.stop="herramienta === 'medir' ? presionarFondo($event) : iniciarArrastre($event, { tipo: 'rack', id: r.id, x: r.x, y: r.y })"
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
            v-for="(l, j) in f.lineas" :key="j"
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

      <!-- Largo de cada muro: un clic lo selecciona para escribir su medida -->
      <text
        v-for="m in muros" :key="`m${m.i}`"
        :x="m.tx" :y="m.ty" :transform="`rotate(${m.ang} ${m.tx} ${m.ty})`"
        v-bind="TEXTO_COTA" :font-size="0.42 * k" :fill="muroSel === m.i ? '#0369a1' : '#0f172a'"
        text-anchor="middle" dominant-baseline="central"
        :pointer-events="cotasTodas ? 'none' : 'all'" :class="cotasTodas ? '' : 'cursor-pointer'"
        role="button" :aria-label="`Muro ${m.i + 1}: ${formatoM(m.largo)} metros. Editar largo`"
        @pointerdown.stop
        @click.stop="emit('seleccionar-muro', m.i)"
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
      <template v-if="editarContorno && herramienta !== 'medir'">
        <circle
          v-for="(p, i) in bodega.forma" :key="`v${i}`"
          :cx="p.x" :cy="p.y" :r="0.35 * k"
          fill="#fff" stroke="#ea580c" :stroke-width="0.1 * k"
          class="cursor-grab" style="touch-action: none"
          role="button" :aria-label="`Esquina ${i + 1} de la bodega`"
          @pointerdown.stop="iniciarArrastre($event, { tipo: 'vertice', id: String(i), x: p.x, y: p.y })"
        />
      </template>
    </template>

    <!-- Cinta de medir -->
    <g v-if="medicion" pointer-events="none">
      <line
        :x1="medicion.a.x" :y1="medicion.a.y" :x2="medicion.b.x" :y2="medicion.b.y"
        stroke="#7c3aed" stroke-width="2" vector-effect="non-scaling-stroke"
      />
      <circle v-for="(q, i) in [medicion.a, medicion.b]" :key="`mc${i}`" :cx="q.x" :cy="q.y" :r="0.15 * k" fill="#7c3aed" />
      <text
        :x="(medicion.a.x + medicion.b.x) / 2 + 0.3 * k" :y="(medicion.a.y + medicion.b.y) / 2 - 0.3 * k"
        v-bind="TEXTO_COTA" :font-size="0.45 * k" fill="#6d28d9" text-anchor="start"
      >{{ formatoM(Math.hypot(medicion.b.x - medicion.a.x, medicion.b.y - medicion.a.y)) }} m</text>
    </g>
  </svg>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { rectangulo, medidasRack, describir, contorno, caja, cotasRack, formatoM, PASO } from '~/lib/rack3d/planificador.js';

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
  // Paso de la cuadricula en metros (0,5 / 1 / 5): tambien es el ajuste al dibujar
  grilla?: number;
  // 'mover' (racks y esquinas) o 'medir' (cinta de medir)
  herramienta?: 'mover' | 'medir';
  // Muro seleccionado (indice del lado del contorno) para editar su largo
  muroSel?: number | null;
}>();

const emit = defineEmits<{
  seleccionar: [id: string | null];
  mover: [id: string, x: number, y: number];
  girar: [id: string];
  eliminar: [id: string];
  'agregar-punto': [p: Punto];
  'cerrar-contorno': [];
  'mover-vertice': [i: number, p: Punto];
  'seleccionar-muro': [i: number | null];
  // Fin de un arrastre de rack o esquina: la pagina lo guarda en el historial (deshacer)
  'fin-cambio': [];
}>();

const MARGEN = 1.8;   // deja lugar a las medidas de los muros (se multiplica por k)
const COLOR = {
  RS: { fondo: '#ffedd5', borde: '#ea580c', linea: '#fb923c' },
  DI: { fondo: '#fef3c7', borde: '#d97706', linea: '#f59e0b' },
  AR: { fondo: '#e0e7ff', borde: '#4f46e5', linea: '#818cf8' },
};
const uid = useId();
const svgRef = ref<SVGSVGElement | null>(null);
const cursor = ref<Punto | null>(null);
const ajuste = ref<'esquina' | 'medio' | null>(null);
const textoCursor = ref('');
const guias = ref<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
// Rack con foco de teclado (no de clic): lleva el anillo naranjo
const focoTeclado = ref<string | null>(null);
const paso = computed(() => props.grilla ?? 1);
const grillaFina = computed(() => paso.value);

function enfocar(e: FocusEvent, id: string) {
  emit('seleccionar', id);
  focoTeclado.value = (e.target as Element).matches(':focus-visible') ? id : null;
}
const puntosDibujo = computed(() => props.puntosDibujo ?? []);

// Area de la bodega: al dibujar, el lienzo (ancho × largo); si no, la caja del contorno
const marco = computed(() => {
  const c = caja(contorno(props.bodega));
  if (!props.dibujando) return c;
  // Al dibujar: el lienzo, ampliado si un muro escrito por teclado sale de el
  const pts = puntosDibujo.value, xs = pts.map((q) => q.x), ys = pts.map((q) => q.y);
  return { x0: Math.min(0, ...xs), y0: Math.min(0, ...ys), x1: Math.max(props.bodega.ancho, ...xs), y1: Math.max(props.bodega.largo, ...ys) };
});
// Crece con la bodega para que se lea igual en una de 10 m que en una de 80 m
const k = computed(() => { const c = marco.value; return Math.max(1, Math.max(c.x1 - c.x0, c.y1 - c.y0) / 25); });

// ─── Zoom (rueda) y desplazamiento (arrastrar el piso) ───
const zoom = ref(1);
const centro = ref<Punto | null>(null);   // null = centrado en la bodega
const base = computed(() => {
  const m = marco.value, g = MARGEN * k.value;
  return { x: m.x0 - g, y: m.y0 - g, w: m.x1 - m.x0 + 2 * g, h: m.y1 - m.y0 + 2 * g };
});
const vista = computed(() => {
  const b = base.value, w = b.w / zoom.value, h = b.h / zoom.value;
  const c = centro.value ?? { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  return { x: c.x - w / 2, y: c.y - h / 2, w, h };
});
watch(() => [props.dibujando, props.bodega.forma?.length], () => restablecerVista());

function restablecerVista() {
  zoom.value = 1;
  centro.value = null;
}
function acercar(factor: number, foco?: Punto) {
  const z = Math.min(8, Math.max(1, zoom.value * factor));
  const v = vista.value, c = { x: v.x + v.w / 2, y: v.y + v.h / 2 };
  const f = foco ?? c;
  centro.value = z === 1 ? null : { x: f.x + (c.x - f.x) * (zoom.value / z), y: f.y + (c.y - f.y) * (zoom.value / z) };
  zoom.value = z;
}
function rueda(e: WheelEvent) {
  acercar(e.deltaY < 0 ? 1.15 : 1 / 1.15, aPlano(e));
}
defineExpose({ restablecerVista, acercar, zoom });

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
    out.push({ i, largo, tx: mx + nx * 0.75 * k.value, ty: my + ny * 0.75 * k.value, ang: +ang.toFixed(2) });
  }
  return out;
}
const muros = computed(() => medidasLados(contorno(props.bodega), true));
const ladoSel = computed(() => {
  const poly = contorno(props.bodega), i = props.muroSel;
  if (i === null || i === undefined || !poly[i]) return null;
  return { a: poly[i], b: poly[(i + 1) % poly.length] };
});
const murosDibujo = computed(() => {
  const pts = [...puntosDibujo.value, ...(cursor.value ? [cursor.value] : [])];
  return pts.length >= 2 ? medidasLados(pts, false) : [];
});

// Estilo de las cotas como atributos (no CSS): el plano se exporta copiando el SVG
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
    const clave = [c.x1, c.y1, c.x2, c.y2].map((v) => v.toFixed(2)).sort().join();
    if (vistas.has(clave)) return false;
    vistas.add(clave);
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
  const n = r.cuerpos, pasoCuerpo = L / n;
  for (let j = 1; j < n; j++) lineas.push(seg(j * pasoCuerpo, 0, j * pasoCuerpo, F));
  if (r.doble) lineas.push(seg(0, F / 2, L, F / 2));
  return { ...p, lineas, entrada, clave: `${r.id}-${m.tipo}` };
}

// Coordenadas del puntero en metros de la bodega
function aPlano(e: { clientX: number; clientY: number }) {
  const svg = svgRef.value!;
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM()!.inverse());
}

const redondear = (v: number, p: number) => Math.round(v / p) * p;
const aGrilla = (p: Punto) => {
  const m = marco.value;
  return {
    x: Math.min(m.x1, Math.max(m.x0, redondear(p.x, paso.value))),
    y: Math.min(m.y1, Math.max(m.y0, redondear(p.y, paso.value))),
  };
};

// ─── Ajustes al dibujar: esquina o punto medio cercano, angulo (15° o, con Shift, 0/90°), alineacion ───
function ajustarDibujo(p: Punto, e: { shiftKey: boolean }): Punto {
  const pts = puntosDibujo.value, tol = 0.45 * k.value;
  ajuste.value = null;
  guias.value = [];
  textoCursor.value = '';
  const medios = pts.slice(1).map((q, i) => ({ x: (q.x + pts[i].x) / 2, y: (q.y + pts[i].y) / 2 }));
  const cerca = (arr: Punto[]) => arr.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < tol);
  const esquina = cerca(pts), medio = cerca(medios);
  let q: Punto;
  if (esquina) { q = { ...esquina }; ajuste.value = 'esquina'; }
  else if (medio) { q = { x: +medio.x.toFixed(2), y: +medio.y.toFixed(2) }; ajuste.value = 'medio'; }
  else if (pts.length) {
    const u = pts[pts.length - 1];
    const dx = p.x - u.x, dy = p.y - u.y, largo = Math.hypot(dx, dy);
    let ang = (Math.atan2(-dy, dx) * 180) / Math.PI;   // 0° a la derecha, 90° hacia arriba
    const a15 = Math.round(ang / 15) * 15;
    const conAngulo = e.shiftKey || Math.abs(ang - a15) <= 4;
    if (conAngulo) {
      ang = e.shiftKey ? Math.round(ang / 90) * 90 : a15;
      const l = redondear(largo, 0.1), rad = (ang * Math.PI) / 180;
      q = { x: +(u.x + l * Math.cos(rad)).toFixed(2), y: +(u.y - l * Math.sin(rad)).toFixed(2) };
    } else q = aGrilla(p);
    // Guias: alinear con la x o la y de otra esquina
    pts.slice(0, -1).forEach((v) => {
      if (Math.abs(v.x - q.x) < tol && !conAngulo) { q.x = v.x; guias.value.push({ x1: v.x, y1: v.y, x2: v.x, y2: q.y }); }
      if (Math.abs(v.y - q.y) < tol && !conAngulo) { q.y = v.y; guias.value.push({ x1: v.x, y1: v.y, x2: q.x, y2: v.y }); }
    });
    const l2 = Math.hypot(q.x - u.x, q.y - u.y);
    const a2 = (((Math.atan2(-(q.y - u.y), q.x - u.x) * 180) / Math.PI) + 360) % 360;
    if (l2 > 0.05) textoCursor.value = `${formatoM(l2)} m · ${Math.round(a2)}°`;
  } else q = aGrilla(p);
  return q;
}

// ─── Cinta de medir ───
const medicion = ref<{ a: Punto; b: Punto; fija: boolean } | null>(null);
watch(() => props.herramienta, () => { medicion.value = null; });

// Esquinas de racks y de la bodega a las que se pega la cinta
function ajustarMedida(p: Punto): Punto {
  const tol = 0.4 * k.value;
  const puntos = [...contorno(props.bodega), ...props.racks.flatMap((r) => {
    const q = rectangulo(r);
    return [{ x: q.x0, y: q.y0 }, { x: q.x0 + q.ancho, y: q.y0 }, { x: q.x0, y: q.y0 + q.alto }, { x: q.x0 + q.ancho, y: q.y0 + q.alto }];
  })];
  const c = puntos.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < tol);
  return c ? { x: c.x, y: c.y } : { x: redondear(p.x, 0.1), y: redondear(p.y, 0.1) };
}

// ─── Puntero ───
let arrastre: { tipo: 'rack' | 'vertice'; id: string; dx: number; dy: number; puntero: number } | null = null;
let paneoInicio: { x: number; y: number; c: Punto; puntero: number; movio: boolean } | null = null;
const paneo = ref(false);

function presionarFondo(e: PointerEvent) {
  if (e.button === 1 || (e.button === 0 && !props.dibujando && props.herramienta !== 'medir')) {
    // Arrastrar el piso desplaza el plano (con zoom); un clic sin mover deselecciona
    const v = vista.value;
    paneoInicio = { x: e.clientX, y: e.clientY, c: { x: v.x + v.w / 2, y: v.y + v.h / 2 }, puntero: e.pointerId, movio: false };
    svgRef.value?.setPointerCapture(e.pointerId);
    return;
  }
  if (e.button !== 0) return;
  if (props.herramienta === 'medir' && !props.dibujando) {
    const p = ajustarMedida(aPlano(e));
    medicion.value = !medicion.value || medicion.value.fija ? { a: p, b: p, fija: false } : { ...medicion.value, b: p, fija: true };
    return;
  }
  if (props.dibujando) emit('agregar-punto', ajustarDibujo(aPlano(e), e));
}

function iniciarArrastre(e: PointerEvent, o: { tipo: 'rack' | 'vertice'; id: string; x: number; y: number }) {
  if (e.button !== 0) return;
  if (o.tipo === 'rack') emit('seleccionar', o.id);
  const p = aPlano(e);
  arrastre = { tipo: o.tipo, id: o.id, dx: o.x - p.x, dy: o.y - p.y, puntero: e.pointerId };
  svgRef.value?.setPointerCapture(e.pointerId);
}

function moverPuntero(e: PointerEvent) {
  if (paneoInicio && e.pointerId === paneoInicio.puntero) {
    const svg = svgRef.value!, r = svg.getBoundingClientRect(), v = vista.value;
    const metrosPorPx = Math.max(v.w / r.width, v.h / r.height);
    const dx = e.clientX - paneoInicio.x, dy = e.clientY - paneoInicio.y;
    if (Math.hypot(dx, dy) > 4) paneoInicio.movio = true;
    if (paneoInicio.movio && zoom.value > 1) {
      paneo.value = true;
      centro.value = { x: paneoInicio.c.x - dx * metrosPorPx, y: paneoInicio.c.y - dy * metrosPorPx };
    }
    return;
  }
  const p = aPlano(e);
  if (props.dibujando) {
    cursor.value = ajustarDibujo(p, e);
    return;
  }
  if (props.herramienta === 'medir' && medicion.value && !medicion.value.fija) {
    medicion.value = { ...medicion.value, b: ajustarMedida(p) };
    return;
  }
  if (!arrastre || e.pointerId !== arrastre.puntero) return;
  const destino = { x: p.x + arrastre.dx, y: p.y + arrastre.dy };
  if (arrastre.tipo === 'rack') emit('mover', arrastre.id, destino.x, destino.y);
  else emit('mover-vertice', Number(arrastre.id), { x: redondear(destino.x, Math.min(paso.value, 0.5)), y: redondear(destino.y, Math.min(paso.value, 0.5)) });
}

function soltar(e: PointerEvent) {
  if (paneoInicio && e.pointerId === paneoInicio.puntero) {
    if (!paneoInicio.movio) { emit('seleccionar', null); emit('seleccionar-muro', null); }
    paneoInicio = null;
    paneo.value = false;
    return;
  }
  if (arrastre) emit('fin-cambio');
  arrastre = null;
}

function teclado(e: KeyboardEvent, r: RackPlano) {
  focoTeclado.value = r.id;
  const d = e.shiftKey ? 1 : PASO;
  const mov: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
  if (mov[e.key]) {
    e.preventDefault();
    emit('mover', r.id, r.x + mov[e.key][0], r.y + mov[e.key][1]);
    emit('fin-cambio');
  } else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    emit('girar', r.id);
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    emit('eliminar', r.id);
  }
}
</script>
