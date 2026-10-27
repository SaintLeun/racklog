<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="h-auto w-full" role="img" :aria-label="descripcion">
    <title>{{ descripcion }}</title>
    <!-- Rack visto de lado (a lo largo de la fila): bastidor con diagonales, vigas en corte y el pallet
         que sobresale; en doble, los dos bastidores con su separador. Cotas de fondo, voladizo y alto -->
    <line x1="0" :x2="W" :y1="y(0)" :y2="y(0)" stroke="#a3a3a3" />
    <!-- Pallets primero (sobresalen del bastidor); el bastidor de la punta de la fila queda delante -->
    <g v-for="(f, k) in filas" :key="`p${k}`">
      <rect v-for="(n, i) in niveles" :key="i" :x="x(f.z0 - vol)" :y="y(n.base + n.alto)" :width="x(f.z0 + m.fondo + vol) - x(f.z0 - vol)" :height="y(n.base) - y(n.base + n.alto)" fill="#e2c08c" fill-opacity="0.85" stroke="#8a6a3b" stroke-width="0.6" rx="1.5" />
    </g>
    <g v-for="(f, k) in filas" :key="`b${k}`">
      <!-- Pilares delantero y trasero del bastidor -->
      <rect :x="x(f.z0) - 2" :y="y(m.alto)" width="4" :height="y(0) - y(m.alto)" fill="#9ca3af" />
      <rect :x="x(f.z0 + m.fondo) - 2" :y="y(m.alto)" width="4" :height="y(0) - y(m.alto)" fill="#9ca3af" />
      <!-- Diagonales en zigzag (en doble, el segundo bastidor en espejo: juntos forman rombos) -->
      <polyline :points="zigzag(f.z0, k === 1)" fill="none" stroke="#6b7280" stroke-width="1.4" stroke-linejoin="round" />
      <!-- Vigas en corte -->
      <template v-for="(n, i) in niveles" :key="i">
        <template v-if="!n.piso">
          <rect :x="x(f.z0) - 3" :y="y(n.y) - 3" width="6" height="6" fill="#f97316" />
          <rect :x="x(f.z0 + m.fondo) - 3" :y="y(n.y) - 3" width="6" height="6" fill="#f97316" />
        </template>
      </template>
    </g>
    <!-- Separadores entre bastidores (doble): en los nudos donde se juntan las diagonales -->
    <template v-if="m.doble">
      <rect v-for="ys in separadores" :key="ys" :x="x(m.fondo) + 2" :y="y(ys) - 2" :width="x(m.fondo + sep) - x(m.fondo) - 4" height="4" fill="#475569" />
    </template>

    <g font-size="10" fill="#334155" font-family="Inter, system-ui, sans-serif" font-weight="600">
      <!-- Fondo de cada bastidor -->
      <!-- Una sola cota abajo (el rack es angosto respecto de su alto) -->
      <line :x1="x(0)" :x2="x(filas[filas.length - 1].z0 + m.fondo)" :y1="y(0) + 12" :y2="y(0) + 12" stroke="#334155" stroke-width="0.8" />
      <text :x="(x(0) + x(filas[filas.length - 1].z0 + m.fondo)) / 2" :y="y(0) + 26" text-anchor="middle">
        {{ m.doble ? `bastidores 2 × ${mm(m.fondo)} + sep. ${mm(sep)}` : `bastidor ${mm(m.fondo)}` }}
      </text>
      <text :x="(x(0) + x(filas[filas.length - 1].z0 + m.fondo)) / 2" :y="y(0) + 38" text-anchor="middle" font-size="9" fill="#64748b" font-weight="500">el pallet sobresale {{ mm(vol) }} por lado</text>
      <!-- Alto -->
      <line :x1="W - 14" :x2="W - 14" :y1="y(0)" :y2="y(m.alto)" stroke="#334155" stroke-width="0.8" />
      <text :x="W - 18" :y="(y(0) + y(m.alto)) / 2" text-anchor="middle" :transform="`rotate(-90 ${W - 18} ${(y(0) + y(m.alto)) / 2})`">alto {{ mm(m.alto) }}</text>
    </g>
  </svg>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { SEPARACION_DOBLE, voladizoDe } from '~/lib/rack3d/medidas.js';
import { zigzagBastidor, alturasSeparadores } from '~/lib/rack3d/arriostramiento.js';

const props = defineProps<{ m: Record<string, any> }>();
const W = 300, H = 280, arriba = 14, abajo = 40;
const sep = SEPARACION_DOBLE;
const vol = computed(() => voladizoDe(props.m));
const mm = (v: number) => `${Math.round(v * 1000).toLocaleString('es-CL')} mm`;
const filas = computed(() => (props.m.doble ? [{ z0: 0 }, { z0: props.m.fondo + sep }] : [{ z0: 0 }]));
const ancho = computed(() => (props.m.doble ? 2 * props.m.fondo + sep : props.m.fondo) + 2 * vol.value);
const tope = computed(() => Math.max(props.m.altoConCarga ?? props.m.alto, props.m.alto) * 1.02);
// Escala igual en ambos ejes para que se lea la proporcion real
const k = computed(() => Math.min((W - 90) / ancho.value, (H - abajo - arriba) / tope.value));
const x = (z: number) => (W - 30 - ancho.value * k.value) / 2 + (z + vol.value) * k.value;
const y = (v: number) => H - abajo - v * k.value;
const niveles = computed(() => {
  const m = props.m;
  return [...(m.piso === false ? [] : [0]), ...m.nivelesY].map((yv: number, i: number) => {
    const piso = i === 0 && m.piso !== false;
    return { y: yv, piso, base: piso ? 0 : yv + (m.altoViga ?? 0.1) / 2, alto: m.altosCarga?.[i] ?? m.pallet.alto };
  });
});
// Mismo arriostramiento que el 3D (lib/rack3d/construir.js); `espejo` parte del pilar de atras
function zigzag(z0: number, espejo = false) {
  const m = props.m, { tramos, y0, dy } = zigzagBastidor(m.alto), pts: string[] = [];
  for (let i = 0; i <= tramos; i++) pts.push(`${x(z0 + ((i % 2 ? 1 : 0) ^ (espejo ? 1 : 0) ? m.fondo : 0)).toFixed(1)},${y(y0 + dy * i).toFixed(1)}`);
  return pts.join(' ');
}
const separadores = computed(() => (props.m.doble ? alturasSeparadores(props.m.alto) : []));
const descripcion = computed(() => `Vista lateral: bastidor de ${mm(props.m.fondo)}${props.m.doble ? `, doble con separador de ${mm(sep)}` : ''}, alto ${mm(props.m.alto)}`);
</script>
