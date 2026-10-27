<template>
  <!-- Frente de un cuerpo de rack selectivo que el cliente acomoda a mano (revisión 27-10: "que el cliente pueda
       acomodar los pallets, muy visual"): arrastra un tipo de pallet a un nivel (o lo toca y toca el nivel),
       arrastra un pallet de un nivel a otro para cambiarlos, sube o baja las vigas y agrega o quita niveles
       sobre el mismo dibujo. Las medidas son las de medidasSelectivo (mismas del 3D, el plano y la cotización) -->
  <!-- Solo los pallets y las vigas bloquean el gesto (touch-action: none): el resto del dibujo deja bajar la página
       con el dedo en el celular -->
  <div class="select-none">
    <div ref="caja" class="relative">
      <svg
        ref="svg" :viewBox="`0 0 ${W} ${H}`" class="h-auto w-full touch-pan-y" role="group"
        :aria-label="`Frente de un cuerpo: ${m.palletsPorViga} pallets por nivel, ${cargas.length} alturas de carga, marco de ${fm(m.alto)} m`"
      >
        <defs>
          <pattern id="ri-piso" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#d4d4d4" stroke-width="2" />
          </pattern>
          <linearGradient id="ri-viga" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fb923c" /><stop offset="1" stop-color="#ea580c" />
          </linearGradient>
          <linearGradient id="ri-pilar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#9ca3af" /><stop offset=".45" stop-color="#d1d5db" /><stop offset="1" stop-color="#9ca3af" />
          </linearGradient>
          <marker id="ri-f" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 6 3 0 6z" fill="#334155" />
          </marker>
        </defs>

        <!-- Piso -->
        <rect :x="0" :y="y(0)" :width="W" height="10" fill="url(#ri-piso)" />
        <line :x1="0" :x2="W" :y1="y(0)" :y2="y(0)" stroke="#737373" stroke-width="1.2" />

        <!-- Techo y lo que alcanza la grúa (si entran en el dibujo) -->
        <g v-if="techoVisible" font-family="Inter, system-ui, sans-serif">
          <line :x1="xr0 - 8" :x2="xr1 + 8" :y1="y(techo!)" :y2="y(techo!)" stroke="#64748b" stroke-width="1" stroke-dasharray="6 4" />
          <text :x="xr1 + 12" :y="y(techo!) - 3" font-size="10" fill="#475569">techo {{ fm(techo!) }} m</text>
        </g>
        <g v-if="levanteVisible" font-family="Inter, system-ui, sans-serif">
          <line :x1="xr0 - 8" :x2="xr1 + 8" :y1="y(levante!)" :y2="y(levante!)" stroke="#0d9488" stroke-width="1" stroke-dasharray="2 3" />
          <text :x="xr1 + 12" :y="y(levante!) - 3" font-size="10" fill="#0f766e">{{ compacto ? 'grúa' : 'tu grúa llega a' }} {{ fm(levante!) }} m</text>
        </g>

        <!-- Zona de cada carga: se ilumina al arrastrar encima o con un tipo elegido -->
        <rect
          v-for="(c, i) in cargas" :key="`z${i}`"
          :x="xr0 + pilar" :y="y(c.techo)" :width="xr1 - xr0 - 2 * pilar" :height="Math.max(4, y(c.base) - y(c.techo))"
          :fill="destino === i ? '#ffedd5' : elegido && !arrastre ? '#fff7ed' : 'transparent'"
          :stroke="destino === i ? '#ea580c' : elegido && !arrastre ? '#fdba74' : 'none'" stroke-width="1.5" stroke-dasharray="5 3" rx="3"
          :class="elegido ? 'cursor-copy' : ''"
          @click="tocarNivel(i)"
        />

        <!-- Pallets: tarima de madera y la carga del color de su tipo, con sus cajas -->
        <g v-for="(c, i) in cargas" :key="`c${i}-${firma}`" class="ri-nivel" :style="{ '--i': i }">
          <g
            v-for="k in m.palletsPorViga" :key="k" :class="['ri-pallet', tiposLista.length > 1 && 'cursor-grab']" style="touch-action: none"
            :opacity="arrastre?.desde === i ? 0.35 : 1"
            @pointerdown="tomarPallet($event, i)" @click="tocarNivel(i)"
          >
            <rect :x="xp(k)" :y="y(c.base + TARIMA)" :width="anchoPallet" :height="Math.max(2, y(c.base) - y(c.base + TARIMA))" fill="#c69c6d" stroke="#8a6a3b" stroke-width="0.6" />
            <rect v-for="b in 3" :key="b" :x="xp(k) + (anchoPallet - 8) * ((b - 1) / 2)" :y="y(c.base + TARIMA) + 1.5" width="8" :height="Math.max(1, y(c.base) - y(c.base + TARIMA) - 1.5)" fill="#8a6a3b" />
            <rect
              :x="xp(k) + 1.5" :y="y(c.base + c.alto)" :width="anchoPallet - 3" :height="Math.max(2, y(c.base + TARIMA) - y(c.base + c.alto))"
              :fill="tinte(c.color)" :stroke="c.color ?? '#a3a3a3'" stroke-width="1.2" rx="1.5"
            />
            <!-- Cajas (líneas de la carga) -->
            <g :stroke="c.color ?? '#a3a3a3'" stroke-opacity=".45" stroke-width="0.8">
              <line v-for="f in filasCaja(c)" :key="`f${f}`" :x1="xp(k) + 1.5" :x2="xp(k) + anchoPallet - 1.5" :y1="y(c.base + TARIMA + f)" :y2="y(c.base + TARIMA + f)" />
              <line :x1="xp(k) + anchoPallet / 2" :x2="xp(k) + anchoPallet / 2" :y1="y(c.base + c.alto)" :y2="y(c.base + TARIMA)" />
            </g>
            <text
              v-if="k === 1 || m.palletsPorViga === 2" :x="xp(k) + anchoPallet / 2" :y="(y(c.base + TARIMA) + y(c.base + c.alto)) / 2 + 4"
              text-anchor="middle" :font-size="anchoPallet < 70 ? 10 : 11.5" font-weight="700" fill="#1c1917" pointer-events="none" font-family="Inter, system-ui, sans-serif"
            >{{ c.nombre && tiposLista.length > 1 ? corto(c.nombre, anchoPallet) : `${fm(c.alto)} m` }}</text>
          </g>
        </g>

        <!-- Marcos (pilares con perforación) -->
        <g v-for="xp0 in [xr0, xr1 - pilar]" :key="xp0">
          <rect :x="xp0" :y="y(m.alto)" :width="pilar" :height="y(0) - y(m.alto)" fill="url(#ri-pilar)" stroke="#6b7280" stroke-width="0.6" />
          <line :x1="xp0 + pilar / 2" :x2="xp0 + pilar / 2" :y1="y(0) - 4" :y2="y(m.alto) + 3" stroke="#4b5563" stroke-width="1.6" :stroke-dasharray="perforacion" />
          <rect :x="xp0 - 3" :y="y(0) - 3" :width="pilar + 6" height="3" fill="#6b7280" />
        </g>

        <!-- Vigas: se toman y se arrastran (de a una perforación) -->
        <g v-for="(v, j) in vigas" :key="`v${j}`">
          <rect :x="xr0 + pilar" :y="y(v.y + altoViga / 2)" :width="xr1 - xr0 - 2 * pilar" :height="Math.max(5, y(v.y - altoViga / 2) - y(v.y + altoViga / 2))" fill="url(#ri-viga)" :stroke="arrastreViga === j ? '#9a3412' : '#c2410c'" :stroke-width="arrastreViga === j ? 1.6 : 0.6" rx="1" />
          <g
            class="cursor-ns-resize" style="touch-action: none" role="slider" tabindex="0" :aria-label="`Viga ${v.nombre}: ${fm(v.y)} m. Flechas para subir o bajar`"
            :aria-valuenow="Math.round(v.y * 1000)" aria-valuemin="0" aria-valuemax="99999"
            @pointerdown="tomarViga($event, j)" @keydown.up.prevent="pasoViga(j, 1)" @keydown.down.prevent="pasoViga(j, -1)"
          >
            <rect :x="xr0 - 4" :y="y(v.y) - 12" :width="xr1 - xr0 + 8" height="24" fill="transparent" />
            <!-- Asa a la derecha: dice que la viga se mueve -->
            <rect :x="xr1 + 4" :y="y(v.y) - 9" width="18" height="18" rx="9" :fill="arrastreViga === j ? '#c2410c' : '#fff'" stroke="#c2410c" stroke-width="1.2" />
            <path :d="`M${xr1 + 13} ${y(v.y) - 5.5}l-3 3h6zM${xr1 + 13} ${y(v.y) + 5.5}l-3-3h6z`" :fill="arrastreViga === j ? '#fff' : '#c2410c'" />
          </g>
        </g>

        <!-- Nombre de cada altura a la izquierda y el espacio libre a la derecha -->
        <g font-family="Inter, system-ui, sans-serif" pointer-events="none">
          <template v-for="(c, i) in cargas" :key="`n${i}`">
            <text :x="xr1 + 28" :y="(y(c.base) + y(c.base + c.alto)) / 2 - (c.libre != null ? 2 : -4)" font-size="11.5" font-weight="700" fill="#404040">{{ c.etiqueta }}</text>
            <text v-if="c.libre != null" :x="xr1 + 28" :y="(y(c.base) + y(c.base + c.alto)) / 2 + 12" font-size="10.5" :fill="c.justo ? '#dc2626' : '#64748b'">{{ fm(c.libre) }} m libres</text>
          </template>
        </g>

        <!-- Cotas: alto del marco y alto con el pallet cargado, juntas a la izquierda -->
        <g font-size="11" fill="#334155" font-family="Inter, system-ui, sans-serif" pointer-events="none">
          <line :x1="xc1" :x2="xc1" :y1="y(0)" :y2="y(m.alto)" stroke="#334155" stroke-width="0.9" marker-start="url(#ri-f)" marker-end="url(#ri-f)" />
          <line :x1="xc1 - 4" :x2="xr0" :y1="y(m.alto)" :y2="y(m.alto)" stroke="#94a3b8" stroke-width="0.6" />
          <text :x="xc1 - 5" :y="(y(0) + y(m.alto)) / 2" text-anchor="middle" font-weight="600" :transform="`rotate(-90 ${xc1 - 5} ${(y(0) + y(m.alto)) / 2})`">marco {{ fm(m.alto) }} m</text>
          <template v-if="altoCarga > m.alto + 0.005">
            <line :x1="xc2" :x2="xc2" :y1="y(0)" :y2="y(altoCarga)" stroke="#c2410c" stroke-width="0.9" marker-start="url(#ri-f)" marker-end="url(#ri-f)" />
            <line :x1="xc2 - 4" :x2="xr0 + pilar" :y1="y(altoCarga)" :y2="y(altoCarga)" stroke="#fdba74" stroke-width="0.6" />
            <text :x="xc2 - 5" :y="(y(0) + y(altoCarga)) / 2" text-anchor="middle" font-weight="700" fill="#9a3412" :transform="`rotate(-90 ${xc2 - 5} ${(y(0) + y(altoCarga)) / 2})`">con carga {{ fm(altoCarga) }} m</text>
          </template>
          <!-- Largo de la viga abajo -->
          <line :x1="xr0" :x2="xr1" :y1="y(0) + 22" :y2="y(0) + 22" stroke="#334155" stroke-width="0.9" marker-start="url(#ri-f)" marker-end="url(#ri-f)" />
          <text :x="(xr0 + xr1) / 2" :y="y(0) + 36" text-anchor="middle">viga de {{ fm(m.viga) }} m · {{ m.palletsPorViga }} {{ m.palletsPorViga === 1 ? 'pallet' : 'pallets' }} por nivel</text>
        </g>

        <!-- Agregar o quitar un nivel arriba del rack (el motivo del máximo va bajo el dibujo) -->
        <g v-if="editable" font-family="Inter, system-ui, sans-serif">
          <g v-if="niveles < maxNiveles" class="cursor-pointer" role="button" tabindex="0" aria-label="Agregar un nivel" @click="emit('niveles', niveles + 1)" @keydown.enter="emit('niveles', niveles + 1)">
            <rect :x="(xr0 + xr1) / 2 - 92" :y="y(altoCarga) - 36" width="116" height="26" rx="13" fill="#fff" stroke="#ea580c" stroke-width="1.3" stroke-dasharray="4 3" />
            <text :x="(xr0 + xr1) / 2 - 34" :y="y(altoCarga) - 19" text-anchor="middle" font-size="12" font-weight="700" fill="#c2410c">+ Agregar nivel</text>
          </g>
          <g v-else>
            <rect :x="(xr0 + xr1) / 2 - 92" :y="y(altoCarga) - 36" width="116" height="26" rx="13" fill="#f5f5f4" />
            <text :x="(xr0 + xr1) / 2 - 34" :y="y(altoCarga) - 19" text-anchor="middle" font-size="11.5" font-weight="600" fill="#78716c">Nivel máximo</text>
          </g>
          <g v-if="niveles > 1" class="cursor-pointer" role="button" tabindex="0" aria-label="Quitar el nivel de arriba" @click="emit('niveles', niveles - 1)" @keydown.enter="emit('niveles', niveles - 1)">
            <rect :x="(xr0 + xr1) / 2 + 30" :y="y(altoCarga) - 36" width="64" height="26" rx="13" fill="#fff" stroke="#d4d4d4" />
            <text :x="(xr0 + xr1) / 2 + 62" :y="y(altoCarga) - 19" text-anchor="middle" font-size="11.5" font-weight="600" fill="#525252">Quitar</text>
          </g>
        </g>
      </svg>

      <!-- Ficha que sigue al dedo mientras se arrastra -->
      <div
        v-if="arrastre && arrastre.movio" class="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-white shadow-lg"
        :style="{ left: `${arrastre.cx}px`, top: `${arrastre.cy}px`, background: arrastre.tipo?.color ?? '#525252' }"
      >{{ arrastre.tipo?.nombre ?? 'Pallet' }}</div>
    </div>

    <!-- Tus tipos de pallet: se arrastran al nivel donde van (o se tocan y se toca el nivel) -->
    <div v-if="editable && tiposLista.length > 1" class="mt-3">
      <p class="text-sm font-semibold text-neutral-800">Arrastra cada pallet al nivel donde lo quieres <span class="font-normal text-neutral-500">(o tócalo y toca el nivel)</span></p>
      <div class="mt-2 flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="t in tiposLista" :key="t.id" type="button"
          :class="['flex flex-shrink-0 touch-none items-center gap-2 rounded-xl bg-white py-1.5 pl-1.5 pr-3 text-left ring-1 transition cursor-grab', elegido === t.id ? 'ring-2 ring-brand-600' : 'ring-neutral-200 hover:ring-brand-300']"
          :aria-pressed="elegido === t.id"
          @pointerdown="tomarTipo($event, t)"
        >
          <svg viewBox="0 0 34 30" class="h-9 w-10 flex-shrink-0" aria-hidden="true">
            <rect x="3" y="4" width="28" height="19" rx="2" :fill="tinte(t.color)" :stroke="t.color" stroke-width="1.5" />
            <line x1="3" x2="31" y1="13.5" y2="13.5" :stroke="t.color" stroke-opacity=".5" /><line x1="17" x2="17" y1="4" y2="23" :stroke="t.color" stroke-opacity=".5" />
            <rect x="2" y="23" width="30" height="5" fill="#c69c6d" stroke="#8a6a3b" stroke-width=".6" />
          </svg>
          <span class="min-w-0">
            <span class="block max-w-[9rem] truncate text-sm font-semibold text-neutral-900">{{ t.nombre }}</span>
            <span class="block text-xs text-neutral-500">{{ fm(t.alto) }} m · {{ enNiveles(t.id) }}</span>
          </span>
        </button>
        <button type="button" class="flex-shrink-0 rounded-xl px-3 text-sm font-semibold text-brand-700 underline underline-offset-2" @click="emit('acomodar')">Acomodar solo</button>
      </div>
    </div>
    <p v-if="editable && niveles >= maxNiveles" class="mt-2 text-sm text-neutral-600">No cabe otro nivel por {{ limite }}.</p>
    <p v-if="editable" class="mt-2 text-xs text-neutral-500">
      Sube o baja un nivel arrastrando su viga (el círculo naranjo de la derecha). Los números a la derecha son el espacio libre sobre cada pallet.
      <button v-if="vigasManuales" type="button" class="font-semibold text-brand-700 underline" @click="emit('vigas', null)">Volver a las alturas calculadas</button>
    </p>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { RACK, DISTANCIAS } from '~/lib/rack3d/parametrosTecnicos.js';

type Tipo = { id: string; nombre: string; alto: number; color: string };
const props = withDefaults(defineProps<{
  m: Record<string, any>; mezcla?: (string | null)[]; tipos?: Tipo[]; editable?: boolean;
  niveles: number; maxNiveles?: number; limite?: string; techo?: number | null; levante?: number | null; vigasManuales?: boolean;
}>(), { mezcla: () => [], tipos: () => [], editable: true, maxNiveles: 8, limite: 'tu techo o tu grúa', techo: null, levante: null, vigasManuales: false });
const emit = defineEmits<{ mezcla: [mezcla: (string | null)[]]; vigas: [nivelesY: number[] | null]; niveles: [n: number]; acomodar: [] }>();

// Geometría del dibujo: en el celular más angosto (sin márgenes de sobra) para que el texto se lea
const caja = ref<HTMLElement | null>(null);
const compacto = ref(false);
let obs: ResizeObserver | null = null;
onMounted(() => {
  if (!caja.value || typeof ResizeObserver === 'undefined') return;
  obs = new ResizeObserver(([e]) => { compacto.value = e.contentRect.width < 520; });
  obs.observe(caja.value);
});
const W = computed(() => (compacto.value ? 350 : 460));
const xr0 = computed(() => (compacto.value ? 66 : 92));
const xr1 = computed(() => (compacto.value ? 250 : 330));
const xc1 = computed(() => xr0.value - 22), xc2 = computed(() => xr0.value - 48);
const pilar = 9, arriba = 40, abajo = 46, TARIMA = 0.144;
const fm = (v: number) => (+(+v).toFixed(2)).toLocaleString('es-CL');
const altoViga = computed(() => props.m.altoViga ?? 0.1);
const altoCarga = computed(() => Math.max(props.m.altoConCarga ?? props.m.alto, props.m.alto));
const tiposLista = computed(() => props.tipos);
const porId = computed(() => new Map(props.tipos.map((t) => [t.id, t])));

// Escala: el rack con su carga y, si quedan cerca, el techo y lo que alcanza la grúa
const techoVisible = computed(() => !!props.techo && props.techo < altoCarga.value * 1.5);
const levanteVisible = computed(() => !!props.levante && props.levante < altoCarga.value * 1.5 && Math.abs((props.levante ?? 0) - (props.techo ?? -9)) > 0.15);
// Mientras se arrastra una viga la escala queda fija (si no, el dibujo crece bajo el dedo y la viga se dispara)
const escalaFija = ref<{ tope: number; H: number } | null>(null);
const tope = computed(() => escalaFija.value?.tope ?? Math.max(altoCarga.value, techoVisible.value ? props.techo! : 0, levanteVisible.value ? props.levante! : 0) * 1.03 + 0.25);
const H = computed(() => escalaFija.value?.H ?? Math.round(Math.min(560, Math.max(380, tope.value * 62))));
const y = (v: number) => H.value - abajo - (v / tope.value) * (H.value - abajo - arriba);
const perforacion = computed(() => {
  const metro = (H.value - abajo - arriba) / tope.value, paso = RACK.pasoPerforado.valor * metro, cada = Math.max(1, Math.ceil(4 / paso));
  return `1.6 ${(paso * cada - 1.6).toFixed(2)}`;
});

// Pallets a lo largo de la viga: entre las caras de los pilares, separados parejo (como el 3D)
const kx = computed(() => (xr1.value - xr0.value) / props.m.viga);
const anchoPallet = computed(() => Math.min(props.m.pallet.frente * kx.value, (xr1.value - xr0.value - 2 * pilar) / props.m.palletsPorViga - 6));
const hueco = computed(() => (xr1.value - xr0.value - 2 * pilar - props.m.palletsPorViga * anchoPallet.value) / (props.m.palletsPorViga + 1));
const xp = (k: number) => xr0.value + pilar + hueco.value * k + anchoPallet.value * (k - 1);

// Cada altura de carga: dónde apoya, su alto, el tipo y el espacio libre hasta la viga de arriba
const cargas = computed(() => {
  const m = props.m, bases: number[] = m.bases ?? [0, ...m.nivelesY.map((v: number) => v + altoViga.value / 2)];
  return bases.map((base, i) => {
    const id = props.mezcla[i] ?? null, t = id ? porId.value.get(id) : null;
    const alto = Math.max(0.2, m.altosCarga?.[i] ?? m.pallet.alto);
    const libre = m.luzLibre?.[i] ?? null;
    const techoNivel = i < bases.length - 1 ? bases[i + 1] - altoViga.value : base + alto + 0.12;
    const etiqueta = i === 0 ? (m.piso === false ? 'Viga a piso' : 'Piso') : `Nivel ${i}`;
    return { base, alto, color: t?.color ?? m.coloresCarga?.[i] ?? null, nombre: t?.nombre ?? null, libre, justo: libre != null && libre + 1e-6 < alto + RACK.luzVigas.valor, techo: techoNivel, etiqueta };
  });
});
const vigas = computed(() => (props.m.nivelesY as number[]).map((v, j) => ({ y: v, nombre: props.m.piso === false ? (j === 0 ? 'a piso' : `del nivel ${j}`) : `del nivel ${j + 1}` })));
const niveles = computed(() => props.niveles);
const firma = computed(() => [props.m.palletsPorViga, props.m.nivelesY.length, props.m.piso].join('|'));
// Líneas de cajas dentro de la carga: una cada ~35 cm
const filasCaja = (c: { alto: number }) => { const h = c.alto - TARIMA, n = Math.max(1, Math.round(h / 0.35)); return Array.from({ length: n - 1 }, (_, i) => ((i + 1) * h) / n); };
const tinte = (c: string | null) => (c ? `color-mix(in srgb, ${c} 28%, #fff)` : '#efe7da');
const corto = (s: string, w: number) => { const max = Math.max(4, Math.floor(w / 7.2)); return s.length > max ? `${s.slice(0, max - 1)}…` : s; };
const enNiveles = (id: string) => {
  const ns = props.mezcla.map((x, i) => (x === id ? i : -1)).filter((i) => i >= 0);
  if (!ns.length) return 'sin nivel';
  return ns.map((i) => (i === 0 ? (props.m.piso === false ? 'viga a piso' : 'piso') : `N${i}`)).join(', ');
};

// ─── Asignar tipos: tocar o arrastrar ───
const elegido = ref<string | null>(null);
const destino = ref<number | null>(null);
const arrastre = ref<{ tipo: Tipo | null; desde: number | null; cx: number; cy: number; x0: number; y0: number; movio: boolean } | null>(null);
const svg = ref<SVGSVGElement | null>(null);
function nivelEn(cx: number, cy: number) {
  const el = svg.value;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const px = ((cx - r.left) / r.width) * W.value, py = ((cy - r.top) / r.height) * H.value;
  if (px < xr0.value - 30 || px > xr1.value + 30) return null;
  const i = cargas.value.findIndex((c) => py <= y(c.base) + 4 && py >= y(c.techo) - 4);
  return i >= 0 ? i : null;
}
function asignar(i: number, id: string | null) {
  const n = cargas.value.length;
  const mezcla = Array.from({ length: n }, (_, j) => props.mezcla[j] ?? null);
  if (mezcla[i] === id) return;
  mezcla[i] = id;
  emit('mezcla', mezcla);
}
// Arrastrar un pallet de un nivel a otro: los dos niveles se intercambian
function intercambiar(a: number, b: number) {
  const n = cargas.value.length;
  const mezcla = Array.from({ length: n }, (_, j) => props.mezcla[j] ?? null);
  [mezcla[a], mezcla[b]] = [mezcla[b], mezcla[a]];
  if (mezcla[a] !== mezcla[b]) emit('mezcla', mezcla);
}
function tocarNivel(i: number) {
  if (arrastre.value?.movio) return;
  if (elegido.value) { asignar(i, elegido.value); elegido.value = null; }
}
function empezar(e: PointerEvent, tipo: Tipo | null, desde: number | null) {
  if (!props.editable) return;
  arrastre.value = { tipo, desde, cx: e.clientX, cy: e.clientY, x0: e.clientX, y0: e.clientY, movio: false };
  window.addEventListener('pointermove', mover);
  window.addEventListener('pointerup', soltar);
  window.addEventListener('pointercancel', cancelar);
}
function tomarTipo(e: PointerEvent, t: Tipo) { empezar(e, t, null); }
function tomarPallet(e: PointerEvent, i: number) {
  if (tiposLista.value.length < 2 || elegido.value) return;
  const id = props.mezcla[i];
  empezar(e, id ? porId.value.get(id) ?? null : null, i);
}
function mover(e: PointerEvent) {
  const a = arrastre.value;
  if (!a) return;
  a.cx = e.clientX; a.cy = e.clientY;
  if (!a.movio && Math.hypot(e.clientX - a.x0, e.clientY - a.y0) > 6) a.movio = true;
  if (a.movio) destino.value = nivelEn(e.clientX, e.clientY);
}
function soltar() {
  const a = arrastre.value;
  quitarEscuchas();
  if (a) {
    if (!a.movio && a.desde == null && a.tipo) elegido.value = elegido.value === a.tipo.id ? null : a.tipo.id;   // un toque elige el tipo
    else if (a.movio && destino.value != null) {
      if (a.desde != null) intercambiar(a.desde, destino.value);
      else if (a.tipo) asignar(destino.value, a.tipo.id);
    }
  }
  // El click que sigue al soltar no debe asignar de nuevo
  setTimeout(() => { arrastre.value = null; }, 0);
  destino.value = null;
}
function cancelar() { quitarEscuchas(); arrastre.value = null; destino.value = null; }
function quitarEscuchas() {
  window.removeEventListener('pointermove', mover);
  window.removeEventListener('pointerup', soltar);
  window.removeEventListener('pointercancel', cancelar);
}

// ─── Vigas: de a una perforación del pilar (la cara de arriba calza en 25 mm + k × 76,2 mm) ───
const arrastreViga = ref<number | null>(null);
const PERF = RACK.pasoPerforado.valor, PERF0 = RACK.primeraPerforacion.valor;
const aPerforacion = (t: number) => +(PERF0 + Math.round((t - PERF0) / PERF) * PERF).toFixed(4);
// Límites de la cara de arriba de la viga j: sobre la carga que tiene abajo (+ 100 mm) y bajo la carga que lleva
function limites(j: number) {
  const m = props.m, av = altoViga.value, luz = RACK.luzVigas.valor, bases = cargas.value.map((c) => c.base);
  const vp = m.piso === false;
  // Carga bajo la viga j: con viga a piso, la de la viga j-1 (la viga a piso no tiene carga abajo)
  const abajoI = vp ? j - 1 : j;
  const min = abajoI >= 0 ? bases[abajoI] + cargas.value[abajoI].alto + luz + av : PERF0 + av;
  const arribaI = vp ? j : j + 1;   // carga que apoya sobre esta viga
  const sig = m.nivelesY[j + 1];
  // La de arriba: su carga bajo el techo (con la holgura) y la viga al alcance de la grúa
  const max = sig != null ? sig - av / 2 - cargas.value[arribaI].alto - luz
    : Math.min(props.techo ? props.techo - DISTANCIAS.holguraTecho.valor - cargas.value[arribaI].alto : Infinity, props.levante ? props.levante + av / 2 : Infinity);
  return { min, max };
}
function moverViga(j: number, cara: number) {
  const { min, max } = limites(j);
  let t = aPerforacion(cara);
  while (t < min - 1e-6) t = +(t + PERF).toFixed(4);
  while (t > max + 1e-6) t = +(t - PERF).toFixed(4);
  if (t < min - 1e-6) return;
  const ys = [...props.m.nivelesY];
  ys[j] = +(t - altoViga.value / 2).toFixed(4);
  if (Math.abs(ys[j] - props.m.nivelesY[j]) > 1e-4) emit('vigas', ys);
}
const pasoViga = (j: number, s: number) => moverViga(j, props.m.nivelesY[j] + altoViga.value / 2 + s * PERF);
let soltarViga: (() => void) | null = null;
function tomarViga(e: PointerEvent, j: number) {
  if (!props.editable) return;
  e.preventDefault();
  arrastreViga.value = j;
  escalaFija.value = { tope: tope.value, H: H.value };
  const el = svg.value!;
  const alMover = (ev: PointerEvent) => {
    const r = el.getBoundingClientRect(), py = ((ev.clientY - r.top) / r.height) * H.value;
    const metros = ((H.value - abajo - py) / (H.value - abajo - arriba)) * tope.value;
    moverViga(j, metros + altoViga.value / 2);
  };
  soltarViga = () => { arrastreViga.value = null; escalaFija.value = null; window.removeEventListener('pointermove', alMover); window.removeEventListener('pointerup', soltarViga!); soltarViga = null; };
  window.addEventListener('pointermove', alMover);
  window.addEventListener('pointerup', soltarViga);
}
onBeforeUnmount(() => { quitarEscuchas(); soltarViga?.(); obs?.disconnect(); });
</script>

<style scoped>
.ri-nivel { animation: ri-subir .36s cubic-bezier(.2, .8, .2, 1) both; animation-delay: calc(var(--i) * 90ms); transform-box: fill-box; }
@keyframes ri-subir { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.ri-pallet { transition: opacity .15s; }
@media (prefers-reduced-motion: reduce) { .ri-nivel { animation: none; } }
</style>
