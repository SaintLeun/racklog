<template>
  <!-- Pallet visto desde arriba sobre el par de vigas: el frente da al pasillo (abajo) -->
  <svg :viewBox="`0 0 ${W} ${H}`" class="h-auto w-full max-w-[220px]" role="img" :aria-label="`Pallet visto desde arriba: frente ${fm(frente)} m, fondo ${fm(fondo)} m`">
    <!-- Vigas delantera y trasera -->
    <rect :x="8" :y="y0 + 4" :width="W - 16" height="5" fill="#f97316" rx="1" />
    <rect :x="8" :y="y0 + alto - 9" :width="W - 16" height="5" fill="#f97316" rx="1" />
    <!-- Pallet (tablas) -->
    <rect :x="x0" :y="y0" :width="ancho" :height="alto" fill="#e7c48f" stroke="#8a6a3b" stroke-width="1" rx="2" />
    <line v-for="k in 4" :key="k" :x1="x0 + (ancho * k) / 5" :x2="x0 + (ancho * k) / 5" :y1="y0" :y2="y0 + alto" stroke="#b08a54" stroke-width="0.8" />
    <!-- Cotas -->
    <g font-size="11" fill="#334155" font-family="Inter, system-ui, sans-serif" font-weight="600">
      <text :x="x0 + ancho / 2" :y="y0 + alto + 16" text-anchor="middle">frente {{ fm(frente) }} m</text>
      <text :x="x0 + ancho + 8" :y="y0 + alto / 2" :transform="`rotate(90 ${x0 + ancho + 8} ${y0 + alto / 2})`" text-anchor="middle">fondo {{ fm(fondo) }} m</text>
    </g>
    <!-- Pasillo -->
    <rect x="0" :y="H - 20" :width="W" height="20" fill="#ecfdf5" />
    <text :x="W / 2" :y="H - 6" text-anchor="middle" font-size="11" fill="#047857" font-family="Inter, system-ui, sans-serif">↑ pasillo: la grúa entra por el frente</text>
  </svg>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{ frente: number; fondo: number }>();
const W = 220, H = 190;
const fm = (v: number) => (+(+v).toFixed(2)).toLocaleString('es-CL');
// Escala: el lado mayor ocupa ~120 px
const k = computed(() => 120 / Math.max(props.frente, props.fondo, 0.4));
const ancho = computed(() => props.frente * k.value);
const alto = computed(() => props.fondo * k.value);
const x0 = computed(() => (W - ancho.value) / 2 - 8);
const y0 = computed(() => 10 + (130 - alto.value) / 2);
</script>
