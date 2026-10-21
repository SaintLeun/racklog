<template>
  <!-- Vista frontal de un cuerpo con sus medidas (m): alto de marco, distancia entre vigas y largo de viga -->
  <svg :viewBox="`0 0 ${W} ${H}`" class="h-auto w-full" role="img" :aria-label="descripcion">
    <title>{{ descripcion }}</title>
    <line :x1="0" :x2="W" :y1="y(0)" :y2="y(0)" stroke="#a3a3a3" stroke-width="1" />
    <!-- Marcos -->
    <rect v-for="(xp, i) in pilares" :key="`p${i}`" :x="xp - 3" :y="y(m.alto)" width="6" :height="y(0) - y(m.alto)" fill="#9ca3af" rx="1" />

    <template v-if="tipo === 'selectivo'">
      <g v-for="(n, i) in niveles" :key="`n${i}`">
        <rect v-if="!n.piso" :x="x0" :y="y(n.y) - 3" :width="ancho" height="6" fill="#f97316" rx="1" />
        <rect
          v-for="k in m.palletsPorViga" :key="k"
          :x="x0 + hueco * k + anchoPallet * (k - 1)" :y="y(n.base + n.alto)"
          :width="anchoPallet" :height="y(n.base) - y(n.base + n.alto)"
          :fill="n.color || '#d6b37a'" fill-opacity="0.85" stroke="#8a6a3b" stroke-width="0.6" rx="1.5"
        />
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
      <template v-if="paso">
        <line :x1="x0 + ancho + 16" :x2="x0 + ancho + 16" :y1="y(paso.a)" :y2="y(paso.b)" stroke="#334155" stroke-width="0.8" marker-start="url(#fl-f)" marker-end="url(#fl-f)" />
        <text :x="x0 + ancho + 21" :y="(y(paso.a) + y(paso.b)) / 2 + 3">{{ fm(paso.b - paso.a) }} m</text>
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
import { computed } from 'vue';

const props = defineProps<{ m: Record<string, any> }>();
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
const paso = computed(() => {
  const ys = tipo.value === 'selectivo' ? props.m.nivelesY : tipo.value === 'drivein' ? props.m.cartelasY : props.m.nivelesY;
  if (!ys?.length) return null;
  return ys.length > 1 ? { a: ys[0], b: ys[1] } : { a: 0, b: ys[0] };
});
const descripcion = computed(() => `Vista frontal: alto de marco ${fm(props.m.alto)} m, largo ${fm(largo.value)} m`);
</script>
