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
      <image
        v-if="calco && !cotasTodas" :href="calco.url" x="0" y="0"
        :width="calco.w * calco.escala" :height="calco.h * calco.escala"
        :opacity="calco.opacidad" preserveAspectRatio="none" pointer-events="none"
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
      <image
        v-if="calco && !cotasTodas" :href="calco.url" x="0" y="0"
        :width="calco.w * calco.escala" :height="calco.h * calco.escala"
        :opacity="calco.opacidad * 0.6" preserveAspectRatio="none" pointer-events="none"
      />
      <path :d="trazo" :fill="`url(#${uid}-grilla)`" pointer-events="none" />
      <path :d="trazo" :fill="`url(#${uid}-grilla5)`" pointer-events="none" />
      <path :d="trazo" fill="none" stroke="#374151" stroke-width="0.2" stroke-linejoin="round" pointer-events="none" />
      <!-- Muro seleccionado para editar su largo -->
      <line
        v-if="muroSel !== null && muroSel !== undefined && ladoSel"
        :x1="ladoSel.a.x" :y1="ladoSel.a.y" :x2="ladoSel.b.x" :y2="ladoSel.b.y"
        stroke="#0ea5e9" stroke-width="0.35" stroke-linecap="round" pointer-events="none"
      />

      <!-- Pasillos: el espacio frente a cada cara de carga; en rojo si es mas angosto de lo que pide -->
      <rect
        v-for="p in dibujando ? [] : (pasillos ?? [])" :key="`p-${p.id}`"
        :x="p.x0" :y="p.y0" :width="p.x1 - p.x0" :height="p.y1 - p.y0"
        :fill="p.ok ? '#14b8a6' : '#ef4444'" :fill-opacity="p.ok ? 0.08 : 0.16" pointer-events="none"
      />

      <!-- Pilares, portones, andenes, oficinas y zonas bloqueadas -->
      <g
        v-for="el in bodega.elementos ?? []" :key="el.id"
        class="plan-rack outline-none" :class="herramienta === 'medir' ? '' : 'cursor-move'"
        style="touch-action: none" tabindex="0" role="button"
        :aria-label="`${ELEMENTOS[el.clase].nombre} de ${formatoM(el.ancho)} × ${formatoM(el.alto)} m`"
        :aria-pressed="elementoSel === el.id"
        @pointerdown.stop="herramienta === 'medir' ? presionarFondo($event) : iniciarArrastre($event, { tipo: 'elemento', id: el.id, x: el.x, y: el.y })"
        @keydown="tecladoElemento($event, el)"
        @focus="emit('seleccionar-elemento', el.id)"
      >
        <template v-for="d in [dibujoElemento(el)]" :key="d.clave">
          <!-- Base -->
          <rect
            v-bind="rectSvg(el)"
            :fill="d.relleno" :fill-opacity="d.opacidad"
            :stroke="elementoSel === el.id ? '#0f172a' : d.borde"
            :stroke-width="elementoSel === el.id ? 0.12 : d.grosor"
            :stroke-dasharray="d.punteado"
          />
          <!-- Detalle por clase -->
          <path v-if="d.trazo" :d="d.trazo" :stroke="d.borde" :stroke-width="d.grosorTrazo" fill="none" pointer-events="none" :stroke-dasharray="d.trazoPunteado" />
          <path v-if="d.relleno2" :d="d.relleno2" :fill="d.color2" pointer-events="none" />
          <text
            v-if="d.etiqueta && Math.min(el.ancho, el.alto) >= 0.5"
            :x="el.x" :y="el.y" v-bind="TEXTO_COTA" :font-size="Math.min(0.36 * k, Math.min(el.alto, el.ancho) * 0.35, Math.max(el.ancho, el.alto) * 0.14)"
            :fill="d.borde" text-anchor="middle" dominant-baseline="central"
            :transform="el.alto > el.ancho * 1.6 ? `rotate(-90 ${el.x} ${el.y})` : undefined"
          >{{ d.etiqueta }}</text>
        </template>
      </g>

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
            :fill="conflictos.has(r.id) ? '#fee2e2' : (r.existente ? '#f1f5f9' : COLOR[r.tipo].fondo)"
            :stroke="conflictos.has(r.id) ? '#dc2626' : (seleccion === r.id ? '#0f172a' : (r.existente ? '#94a3b8' : COLOR[r.tipo].borde))"
            :stroke-dasharray="r.existente ? '0.25 0.15' : undefined"
            :stroke-width="seleccion === r.id ? 0.12 : 0.06"
          />
          <path v-if="f.tunel" :d="f.tunel" fill="#e0f2fe" stroke="#0284c7" stroke-width="0.03" pointer-events="none" />
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

      <!-- Accesorios propuestos (lib/rack3d/accesorios.js): canillera = punto amarillo, proteccion de
           bastidor = barra amarilla y negra, baranda = linea amarilla gruesa -->
      <g v-if="marcas?.length && !dibujando" pointer-events="none">
        <template v-for="(mk, i) in marcas" :key="`mk-${i}`">
          <circle v-if="mk.tipo === 'punto'" :cx="mk.x" :cy="mk.y" r="0.09" fill="#facc15" stroke="#854d0e" stroke-width="0.02" />
          <g v-else-if="mk.tipo === 'barra'">
            <line :x1="mk.x1" :y1="mk.y1" :x2="mk.x2" :y2="mk.y2" stroke="#facc15" stroke-width="0.16" />
            <line :x1="mk.x1" :y1="mk.y1" :x2="mk.x2" :y2="mk.y2" stroke="#111827" stroke-width="0.16" stroke-dasharray="0.12 0.12" />
          </g>
          <line v-else :x1="mk.x1" :y1="mk.y1" :x2="mk.x2" :y2="mk.y2" stroke="#eab308" stroke-width="0.12" stroke-linecap="round" />
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
        <line :x1="c.x1" :y1="c.y1" :x2="c.x2" :y2="c.y2" :stroke="colorCota(c)" stroke-width="0.04" stroke-dasharray="0.18 0.1" />
        <text
          v-bind="TEXTO_COTA" :fill="colorCota(c)" dominant-baseline="central"
          :x="posCota(c).x" :y="posCota(c).y" :transform="posCota(c).rot" :text-anchor="posCota(c).anchor"
        >{{ pasilloDe(c) ? 'pasillo ' : c.a === 'elemento' ? 'libre ' : '' }}{{ formatoM(c.valor) }} m</text>
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

    <!-- Calibracion del calco: los dos puntos de una medida conocida -->
    <g v-if="puntosCalibracion?.length" pointer-events="none">
      <line
        v-if="puntosCalibracion.length === 2"
        :x1="puntosCalibracion[0].x" :y1="puntosCalibracion[0].y" :x2="puntosCalibracion[1].x" :y2="puntosCalibracion[1].y"
        stroke="#db2777" stroke-width="2" vector-effect="non-scaling-stroke"
      />
      <circle v-for="(q, i) in puntosCalibracion" :key="`cal${i}`" :cx="q.x" :cy="q.y" :r="0.2 * k" fill="#db2777" />
    </g>

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
import { rectangulo, rectElemento, medidasRack, describir, contorno, caja, cotasRack, cotasElemento, formatoM, PASO, ELEMENTOS } from '~/lib/rack3d/planificador.js';
import { pasilloEn } from '~/lib/rack3d/pasillos.js';

export interface RackPlano {
  id: string;
  tipo: 'RS' | 'AR' | 'DI';
  x: number;
  y: number;
  rot: 0 | 90 | 180 | 270;
  cuerpos: number;
  niveles: number;
  doble: boolean;
  existente?: boolean;
  porViga?: number;
  sobrante?: number;
  planos?: (string | null)[];
  tunel?: { cuerpo: number; altoLibre: number } | null;
  mezcla?: (string | null)[];
  altos?: (number | null)[];
  colores?: (string | null)[];
  techoGrua?: number | null;
  mastilGrua?: number | null;
  anchoGrua?: number | null;
  fondos?: number;
}
export interface Punto { x: number; y: number }
export interface Elemento { id: string; clase: 'pilar' | 'porton' | 'anden' | 'oficina' | 'zona' | 'pasilloGrua' | 'pasilloPeatonal' | 'grua'; x: number; y: number; ancho: number; alto: number; modelo?: string; nombre?: string }
// Calculado por lib/rack3d/pasillos.js
export interface Pasillo {
  id: string; x0: number; y0: number; x1: number; y1: number; eje: 'x' | 'y';
  libre: number; minimo: number; ok: boolean; racks: string[]; vecino: string | null;
}

const props = defineProps<{
  bodega: { ancho: number; largo: number; forma: Punto[] | null; elementos?: Elemento[] };
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
  // Pasillos frente a las caras de carga (los angostos se marcan en rojo)
  pasillos?: Pasillo[];
  // Accesorios a dibujar en planta (m)
  marcas?: Array<{ tipo: 'punto'; x: number; y: number } | { tipo: 'barra' | 'linea'; x1: number; y1: number; x2: number; y2: number }>;
  // Elemento seleccionado (pilar, porton, anden, oficina o zona)
  elementoSel?: string | null;
  // Plano o foto de referencia para calcar: url, tamano en px y metros por px
  calco?: { url: string; w: number; h: number; escala: number; opacidad: number } | null;
  // Calibrando el calco: los clics marcan dos puntos de una medida conocida
  calibrando?: boolean;
  puntosCalibracion?: Punto[];
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
  'punto-calibracion': [p: Punto];
  'seleccionar-elemento': [id: string | null];
  'mover-elemento': [id: string, x: number, y: number];
  'eliminar-elemento': [id: string];
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
  const cw = props.calco ? props.calco.w * props.calco.escala : 0, ch = props.calco ? props.calco.h * props.calco.escala : 0;
  return { x0: Math.min(0, ...xs), y0: Math.min(0, ...ys), x1: Math.max(props.bodega.ancho, cw, ...xs), y1: Math.max(props.bodega.largo, ch, ...ys) };
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

// Símbolo de cada elemento en planta (en metros, como el resto del plano)
const MODELOS: Record<string, string> = { transpaleta: 'Transpaleta', apiladora: 'Apiladora', contrapeso: 'Contrapeso', retractil: 'Retráctil' };
function dibujoElemento(el: Elemento) {
  const p = rectElemento(el), def = ELEMENTOS[el.clase];
  const x0 = p.x0, y0 = p.y0, x1 = p.x0 + p.ancho, y1 = p.y0 + p.alto, w = p.ancho, h = p.alto;
  const base = { clave: el.clase, relleno: def.relleno, opacidad: 0.8, borde: def.color, grosor: 0.06, punteado: undefined as string | undefined,
    trazo: '', grosorTrazo: 0.04, trazoPunteado: undefined as string | undefined, relleno2: '', color2: '', etiqueta: el.nombre || def.nombre };
  const largoV = h >= w;   // eje largo vertical
  switch (el.clase) {
    case 'pilar':
      // Símbolo estructural: sección llena con cruz
      return { ...base, relleno: '#475569', opacidad: 1, borde: '#1e293b', trazo: `M${x0} ${y0}L${x1} ${y1}M${x1} ${y0}L${x0} ${y1}`, grosorTrazo: 0.03, etiqueta: '' };
    case 'oficina': {
      // Muros dobles y puerta con su abatimiento en el lado de abajo
      const t = 0.15, pw = Math.min(0.9, w * 0.3), px = x0 + w * 0.25;
      return { ...base, opacidad: 0.6, grosor: 0.05,
        trazo: `M${x0 + t} ${y0 + t}H${x1 - t}V${y1 - t}H${px + pw}M${px} ${y1 - t}H${x0 + t}Z` +
          `M${px} ${y1}L${px} ${y1 - pw}A${pw} ${pw} 0 0 1 ${px + pw} ${y1}`,
        grosorTrazo: 0.035,
        relleno2: `M${px} ${y1 - 0.02}h${pw}v${-t + 0.02}h${-pw}Z`, color2: '#ffffff' };
    }
    case 'anden': {
      // Plataforma con nivelador (rectángulo interior) y borde de seguridad hacia el lado de abajo
      const s2 = 0.25, nx = x0 + w * 0.2, nw = w * 0.6, ny = y1 - h * 0.45;
      const franjas = Array.from({ length: Math.max(2, Math.floor(w / 0.35)) }, (_, i) => {
        const fx = x0 + i * 0.35;
        return `M${fx} ${y1}l${Math.min(0.2, x1 - fx)} ${-s2}h0.12l${-Math.min(0.2, x1 - fx)} ${s2}Z`;
      }).join('');
      return { ...base, opacidad: 0.7, trazo: `M${nx} ${ny}h${nw}v${h * 0.45 - s2}h${-nw}Z M${el.x} ${ny - 0.6}l-0.35 0.4m0.35 -0.4l0.35 0.4m-0.35 -0.4v1.1`, grosorTrazo: 0.04,
        relleno2: franjas, color2: '#111827' };
    }
    case 'porton':
      return { ...base, opacidad: 0.9, trazo: largoV ? `M${el.x} ${y0}V${y1}` : `M${x0} ${el.y}H${x1}`, grosorTrazo: 0.06, trazoPunteado: '0.4 0.2' };
    case 'zona':
      return { ...base, punteado: '0.3 0.15', trazo: `M${x0} ${y0}L${x1} ${y1}M${x1} ${y0}L${x0} ${y1}` };
    case 'pasilloGrua': {
      // Líneas de borde amarillas y flechas de sentido por el centro
      const n = Math.max(1, Math.floor((largoV ? h : w) / 3));
      const flechas = Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        return largoV ? `M${el.x - 0.35} ${y0 + t * h - 0.2}l0.35 0.4l0.35 -0.4` : `M${x0 + t * w - 0.2} ${el.y - 0.35}l0.4 0.35l-0.4 0.35`;
      }).join('');
      const bordes = largoV ? `M${x0 + 0.08} ${y0}V${y1}M${x1 - 0.08} ${y0}V${y1}` : `M${x0} ${y0 + 0.08}H${x1}M${x0} ${y1 - 0.08}H${x1}`;
      return { ...base, opacidad: 0.45, grosor: 0, trazo: bordes + flechas, grosorTrazo: 0.1 };
    }
    case 'pasilloPeatonal': {
      // Cebra perpendicular al sentido de marcha
      const paso = 0.5, n = Math.floor((largoV ? h : w) / paso);
      const cebra = Array.from({ length: n }, (_, i) => (i % 2 ? '' : largoV
        ? `M${x0} ${y0 + i * paso}h${w}v${paso}h${-w}Z` : `M${x0 + i * paso} ${y0}v${h}h${paso}v${-h}Z`)).join('');
      return { ...base, opacidad: 0.5, grosor: 0.05, relleno2: cebra, color2: '#86efac' };
    }
    case 'grua': {
      // Silueta: chasis, contrapeso y horquillas hacia arriba (o hacia la izquierda si está acostada)
      const fl = largoV ? h * 0.3 : w * 0.3;
      const horq = largoV
        ? `M${x0 + w * 0.25} ${y0}v${fl}M${x1 - w * 0.25} ${y0}v${fl}M${x0 + w * 0.1} ${y0 + fl}h${w * 0.8}`
        : `M${x0} ${y0 + h * 0.25}h${fl}M${x0} ${y1 - h * 0.25}h${fl}M${x0 + fl} ${y0 + h * 0.1}v${h * 0.8}`;
      const cuerpo = largoV ? `M${x0} ${y0 + fl}h${w}v${h - fl}h${-w}Z` : `M${x0 + fl} ${y0}h${w - fl}v${h}h${-(w - fl)}Z`;
      return { ...base, relleno: 'transparent', opacidad: 1, grosor: 0, trazo: horq, grosorTrazo: 0.08,
        relleno2: cuerpo, color2: '#fbbf24', etiqueta: MODELOS[el.modelo ?? 'contrapeso'] ?? 'Grúa' };
    }
  }
  return base;
}

const rectSvg = (el: Elemento) => { const p = rectElemento(el); return { x: p.x0, y: p.y0, width: p.ancho, height: p.alto }; };
const diagonal = (el: Elemento) => { const p = rectElemento(el); return { x1: p.x0, y1: p.y0, x2: p.x0 + p.ancho, y2: p.y0 + p.alto }; };

// Una cota es de pasillo si cae dentro de uno (las de costado o espalda no lo son)
type Cota = { a: string; x1: number; y1: number; x2: number; y2: number };
const pasilloDe = (c: Cota) => (c.a !== 'elemento' && props.pasillos ? pasilloEn(props.pasillos, (c.x1 + c.x2) / 2, (c.y1 + c.y2) / 2) as Pasillo | null : null);
const colorCota = (c: Cota) => {
  if (c.a === 'elemento') return '#0369a1';
  const p = pasilloDe(c);
  return !p ? '#334155' : p.ok ? '#0f766e' : '#dc2626';
};

const rectDe = (r: RackPlano) => { const p = rectangulo(r); return { x: p.x0, y: p.y0, width: p.ancho, height: p.alto }; };

// Racks con cotas: el seleccionado o, al exportar, todos (sin repetir la misma cota entre vecinos)
const conCotas = computed(() => (props.cotasTodas ? props.racks : props.racks.filter((r) => r.id === props.seleccion)));
const cotas = computed(() => {
  if (props.dibujando) return [];
  const vistas = new Set<string>();
  const sel = props.cotasTodas ? [] : (props.bodega.elementos ?? []).filter((e: Elemento) => e.id === props.elementoSel);
  return [...conCotas.value.flatMap((r) => cotasRack(r, props.racks, props.bodega)), ...sel.flatMap((e: Elemento) => cotasElemento(e, props.bodega))].filter((c) => {
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
  // Cuerpo túnel: rayado y flecha de paso de lado a lado
  let tunel = '';
  if (m.tunel) {
    const u0 = m.tunel.indice * pasoCuerpo, u1 = u0 + pasoCuerpo;
    const pt = (u: number, v: number) => aPlanoLocal(u, v).join(' ');
    tunel = `M${pt(u0, 0)}L${pt(u1, 0)}L${pt(u1, F)}L${pt(u0, F)}Z`;
    for (let k = 0.3; k < pasoCuerpo + F; k += 0.35) {
      const ua = u0 + Math.min(k, pasoCuerpo), va = Math.max(0, k - pasoCuerpo);
      const ub = u0 + Math.max(0, k - F), vb = Math.min(k, F);
      tunel += `M${pt(ua, va)}L${pt(ub, vb)}`;
    }
  }
  return { ...p, lineas, entrada, tunel, clave: `${r.id}-${m.tipo}` };
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
let arrastre: { tipo: 'rack' | 'vertice' | 'elemento'; id: string; dx: number; dy: number; puntero: number } | null = null;
let paneoInicio: { x: number; y: number; c: Punto; puntero: number; movio: boolean } | null = null;
const paneo = ref(false);

function presionarFondo(e: PointerEvent) {
  if (e.button === 1 || (e.button === 0 && !props.dibujando && !props.calibrando && props.herramienta !== 'medir')) {
    // Arrastrar el piso desplaza el plano (con zoom); un clic sin mover deselecciona
    const v = vista.value;
    paneoInicio = { x: e.clientX, y: e.clientY, c: { x: v.x + v.w / 2, y: v.y + v.h / 2 }, puntero: e.pointerId, movio: false };
    svgRef.value?.setPointerCapture(e.pointerId);
    return;
  }
  if (e.button !== 0) return;
  if (props.calibrando) {
    const q = aPlano(e);
    emit('punto-calibracion', { x: +q.x.toFixed(3), y: +q.y.toFixed(3) });
    return;
  }
  if (props.herramienta === 'medir' && !props.dibujando) {
    const p = ajustarMedida(aPlano(e));
    medicion.value = !medicion.value || medicion.value.fija ? { a: p, b: p, fija: false } : { ...medicion.value, b: p, fija: true };
    return;
  }
  if (props.dibujando) emit('agregar-punto', ajustarDibujo(aPlano(e), e));
}

function iniciarArrastre(e: PointerEvent, o: { tipo: 'rack' | 'vertice' | 'elemento'; id: string; x: number; y: number }) {
  if (e.button !== 0) return;
  if (o.tipo === 'rack') emit('seleccionar', o.id);
  if (o.tipo === 'elemento') emit('seleccionar-elemento', o.id);
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
  else if (arrastre.tipo === 'elemento') emit('mover-elemento', arrastre.id, redondear(destino.x, PASO), redondear(destino.y, PASO));
  else emit('mover-vertice', Number(arrastre.id), { x: redondear(destino.x, Math.min(paso.value, 0.5)), y: redondear(destino.y, Math.min(paso.value, 0.5)) });
}

function soltar(e: PointerEvent) {
  if (paneoInicio && e.pointerId === paneoInicio.puntero) {
    if (!paneoInicio.movio) { emit('seleccionar', null); emit('seleccionar-muro', null); emit('seleccionar-elemento', null); }
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

function tecladoElemento(e: KeyboardEvent, el: Elemento) {
  const d = e.shiftKey ? 1 : PASO;
  const mov: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
  if (mov[e.key]) {
    e.preventDefault();
    emit('mover-elemento', el.id, +(el.x + mov[e.key][0]).toFixed(2), +(el.y + mov[e.key][1]).toFixed(2));
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    emit('eliminar-elemento', el.id);
  }
}
</script>
