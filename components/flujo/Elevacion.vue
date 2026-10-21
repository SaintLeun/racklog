<template>
  <!-- Vista frontal de un cuerpo con sus medidas (m): alto de marco, distancia entre vigas y largo de viga -->
  <svg :viewBox="`0 0 ${W} ${H}`" class="h-auto w-full" role="img" :aria-label="descripcion">
    <title>{{ descripcion }}</title>
    <line :x1="0" :x2="W" :y1="y(0)" :y2="y(0)" stroke="#a3a3a3" stroke-width="1" />
    <!-- Marcos -->
    <rect v-for="(xp, i) in pilares" :key="`p${i}`" :x="xp - 3" :y="y(m.alto)" width="6" :height="y(0) - y(m.alto)" fill="#9ca3af" rx="1" />

    <template v-if="tipo === 'selectivo'">
      <!-- El rack se levanta nivel por nivel cuando cambia (la clave reinicia la animacion) -->
      <g v-for="(n, i) in niveles" :key="`n${i}-${firma}`" class="fl-nivel" :style="{ '--i': i }">
        <rect v-if="!n.piso" :x="x0" :y="y(n.y) - 3" :width="ancho" height="6" :fill="arrastre?.i === i - 1 ? '#c2410c' : '#f97316'" rx="1" />
        <!-- Editable: la viga se toma y se arrastra; zona de toque amplia -->
        <rect
          v-if="!n.piso && editable" :x="x0 - 6" :y="y(n.y) - 11" :width="ancho + 12" height="22" fill="transparent" class="cursor-ns-resize"
          role="slider" tabindex="0" :aria-label="`Viga del nivel ${i}`" :aria-valuenow="Math.round(n.y * 1000)" aria-valuemin="0" aria-valuemax="99999"
          @pointerdown="tomar($event, i - 1)" @keydown.up.prevent="paso(i - 1, 1)" @keydown.down.prevent="paso(i - 1, -1)"
        />
        <!-- Luz libre bajo la viga (en rojo si no cabe la carga + 100 mm) -->
        <text v-if="!n.piso && editable" :x="x0 + ancho + 4" :y="y(n.y) + 14" font-size="8" :fill="luzMala(i - 1) ? '#dc2626' : '#64748b'">luz {{ Math.round((m.luzLibre?.[i - 1] ?? 0) * 1000) }}</text>
        <g v-for="k in m.palletsPorViga" :key="k">
          <rect
            :x="x0 + hueco * k + anchoPallet * (k - 1)" :y="y(n.base + n.alto)"
            :width="anchoPallet" :height="y(n.base) - y(n.base + n.alto)"
            fill="#e2c08c" stroke="#8a6a3b" stroke-width="0.6" rx="1.5"
          />
          <!-- Tipo de pallet: franja de su color (como en el 3D) -->
          <rect v-if="n.color" :x="x0 + hueco * k + anchoPallet * (k - 1)" :y="y(n.base + n.alto) + 2" :width="anchoPallet" height="4" :fill="n.color" />
        </g>
      </g>
    </template>
    <template v-else-if="tipo === 'drivein'">
      <g v-for="(n, i) in niveles" :key="`n${i}`">
        <rect v-if="!n.piso" :x="x0 - 2" :y="y(n.y) - 2.5" :width="10" height="5" fill="#f97316" />
        <rect v-if="!n.piso" :x="x0 + ancho - 8" :y="y(n.y) - 2.5" :width="10" height="5" fill="#f97316" />
        <rect :x="x0 + hueco" :y="y(n.base + n.alto)" :width="anchoPallet" :height="y(n.base) - y(n.base + n.alto)" fill="#d6b37a" fill-opacity="0.85" stroke="#8a6a3b" stroke-width="0.6" rx="1.5" />
      </g>
    </template>
    <template v-else>
      <rect v-for="(yb, i) in m.nivelesY" :key="`b${i}`" :x="x0" :y="y(yb) - 2" :width="ancho" height="4" fill="#94a3b8" />
    </template>

    <!-- Cotas -->
    <g font-size="10" fill="#334155" font-family="Inter, system-ui, sans-serif">
      <!-- Alto de marco a la izquierda -->
      <line :x1="x0 - 22" :x2="x0 - 22" :y1="y(0)" :y2="y(m.alto)" stroke="#334155" stroke-width="0.8" marker-start="url(#fl-f)" marker-end="url(#fl-f)" />
      <text :x="x0 - 26" :y="(y(0) + y(m.alto)) / 2" text-anchor="middle" :transform="`rotate(-90 ${x0 - 26} ${(y(0) + y(m.alto)) / 2})`">alto {{ fm(m.alto) }} m</text>
      <!-- Distancia entre vigas (primer paso) a la derecha -->
      <template v-if="pasoCota && !editable">
        <line :x1="x0 + ancho + 16" :x2="x0 + ancho + 16" :y1="y(pasoCota.a)" :y2="y(pasoCota.b)" stroke="#334155" stroke-width="0.8" marker-start="url(#fl-f)" marker-end="url(#fl-f)" />
        <text :x="x0 + ancho + 21" :y="(y(pasoCota.a) + y(pasoCota.b)) / 2 + 3">{{ fm(pasoCota.b - pasoCota.a) }} m</text>
      </template>
      <!-- Largo de viga abajo -->
      <line :x1="x0" :x2="x0 + ancho" :y1="y(0) + 16" :y2="y(0) + 16" stroke="#334155" stroke-width="0.8" marker-start="url(#fl-f)" marker-end="url(#fl-f)" />
      <text :x="x0 + ancho / 2" :y="y(0) + 29" text-anchor="middle">{{ tipo === 'drivein' ? 'calle' : tipo === 'anra' ? 'bandeja' : 'viga' }} {{ fm(largo) }} m</text>
    </g>
    <defs>
      <marker id="fl-f" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0 0 6 3 0 6z" fill="#334155" />
      </marker>
    </defs>
  </svg>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { RACK } from '~/lib/rack3d/parametrosTecnicos.js';

const props = defineProps<{ m: Record<string, any>; editable?: boolean }>();
const emit = defineEmits<{ vigas: [nivelesY: number[]] }>();
const W = 300, H = 280, x0 = 70, ancho = 170, arriba = 14, abajo = 40;
const tipo = computed(() => props.m.tipo as 'selectivo' | 'drivein' | 'anra');
const tope = computed(() => Math.max(props.m.altoConCarga ?? props.m.alto, props.m.alto) * 1.02);
const y = (v: number) => H - abajo - (v / tope.value) * (H - abajo - arriba);
const largo = computed(() => (tipo.value === 'selectivo' ? props.m.viga : tipo.value === 'drivein' ? props.m.anchoCalle : props.m.frente));
const pilares = computed(() => [x0, x0 + ancho]);
const fm = (v: number) => (+v.toFixed(2)).toLocaleString('es-CL');

// Escala horizontal en px por m (a lo largo de la viga o calle)
const kx = computed(() => ancho / largo.value);
const anchoPallet = computed(() => (props.m.pallet?.frente ?? 1) * kx.value * (tipo.value === 'drivein' ? 1 : 0.98));
const hueco = computed(() => (tipo.value === 'selectivo'
  ? (ancho - props.m.palletsPorViga * anchoPallet.value) / (props.m.palletsPorViga + 1)
  : (ancho - anchoPallet.value) / 2));

// Altura de cada nivel: base de la carga y su alto (0 = piso)
const niveles = computed(() => {
  const m = props.m;
  if (tipo.value === 'selectivo') {
    const ys = [0, ...m.nivelesY];
    return ys.map((yv: number, i: number) => {
      const piso = i === 0, base = piso ? 0 : yv + (m.altoViga ?? 0.1) / 2;
      return { y: yv, piso, base, alto: Math.max(0.2, (m.altosCarga?.[i] ?? m.pallet.alto)), color: m.coloresCarga?.[i] ?? null };
    });
  }
  if (tipo.value === 'drivein') {
    return [0, ...m.cartelasY].map((yv: number, i: number) => ({ y: yv, piso: i === 0, base: yv, alto: m.pallet.alto, color: null }));
  }
  return [];
});
// Distancia entre la primera y la segunda viga (o del piso a la primera)
const pasoCota = computed(() => {
  const ys = tipo.value === 'selectivo' ? props.m.nivelesY : tipo.value === 'drivein' ? props.m.cartelasY : props.m.nivelesY;
  if (!ys?.length) return null;
  return ys.length > 1 ? { a: ys[0], b: ys[1] } : { a: 0, b: ys[0] };
});
// ─── Vigas movibles (selectivo): de a una perforacion del pilar (3" = 76,2 mm) ───
// La cara de arriba de la viga calza en la perforacion: 48,2 mm + k × 76,2 mm desde el piso
const arrastre = ref<{ i: number } | null>(null);
const PERF = RACK.pasoPerforado.valor, PERF0 = 0.0482;
const aPerforacion = (t: number) => +(PERF0 + Math.round((t - PERF0) / PERF) * PERF).toFixed(4);
// Limites de la cara de arriba de la viga i: sobre la carga de abajo + 100 mm y bajo la carga de arriba
function limites(i: number) {
  const m = props.m, av = m.altoViga, luz = RACK.luzVigas.valor;
  const min = (i ? m.nivelesY[i - 1] + av / 2 : 0) + m.altosCarga[i] + luz + av;
  const max = i < m.nivelesY.length - 1 ? m.nivelesY[i + 1] - av / 2 - m.altosCarga[i + 1] - luz : Infinity;
  return { min, max };
}
const luzMala = (i: number) => (props.m.luzLibre?.[i] ?? 0) + 1e-6 < props.m.altosCarga[i] + RACK.luzVigas.valor;
function mover(i: number, cara: number) {
  const { min, max } = limites(i);
  let t = aPerforacion(cara);
  while (t < min - 1e-6) t = +(t + PERF).toFixed(4);
  while (t > max + 1e-6) t = +(t - PERF).toFixed(4);
  if (t < min - 1e-6) return;   // no cabe en ninguna perforacion
  const ys = [...props.m.nivelesY];
  ys[i] = +(t - props.m.altoViga / 2).toFixed(4);
  if (Math.abs(ys[i] - props.m.nivelesY[i]) > 1e-4) emit('vigas', ys);
}
const paso = (i: number, s: number) => mover(i, props.m.nivelesY[i] + props.m.altoViga / 2 + s * PERF);
function tomar(e: PointerEvent, i: number) {
  e.preventDefault();
  arrastre.value = { i };
  const el = (e.target as SVGElement).ownerSVGElement!;
  const alMover = (ev: PointerEvent) => {
    const r = el.getBoundingClientRect(), py = ((ev.clientY - r.top) / r.height) * H;
    const metros = ((H - abajo - py) / (H - abajo - arriba)) * tope.value;
    mover(i, metros + props.m.altoViga / 2);
  };
  const soltar = () => { arrastre.value = null; window.removeEventListener('pointermove', alMover); window.removeEventListener('pointerup', soltar); };
  window.addEventListener('pointermove', alMover);
  window.addEventListener('pointerup', soltar);
}

const firma = computed(() => [props.m.palletsPorViga, props.m.nivelesY.length, props.m.altosCarga?.join()].join('|'));
const descripcion = computed(() => `Vista frontal: alto de marco ${fm(props.m.alto)} m, largo ${fm(largo.value)} m`);
</script>

<style scoped>
.fl-nivel { animation: fl-subir .38s cubic-bezier(.2, .8, .2, 1) both; animation-delay: calc(var(--i) * 110ms); transform-box: fill-box; }
@keyframes fl-subir { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .fl-nivel { animation: none; } }
</style>
