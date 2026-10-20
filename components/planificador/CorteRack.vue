<template>
  <figure class="rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200">
    <figcaption class="flex items-center justify-between text-sm font-semibold text-neutral-800">
      Vista de corte
      <span v-if="altura" class="text-xs font-medium text-neutral-500">{{ Math.round((alto / altura) * 100) }} % de la altura</span>
    </figcaption>
    <svg :viewBox="`0 0 ${W} ${H}`" class="mt-2 w-full" role="img" :aria-label="descripcion">
      <!-- Piso y techo (altura libre) -->
      <line :x1="0" :y1="y(0)" :x2="W" :y2="y(0)" stroke="#374151" stroke-width="2" />
      <template v-if="altura">
        <line :x1="0" :y1="y(altura)" :x2="W" :y2="y(altura)" stroke="#0ea5e9" stroke-width="1.5" stroke-dasharray="5 3" />
        <text :x="W - 4" :y="y(altura) - 4" text-anchor="end" font-size="10" fill="#0369a1">Techo · {{ formatoM(altura) }} m</text>
        <rect :x="x0" :y="y(altura)" :width="ancho" :height="Math.max(0, y(alto) - y(altura))" fill="#e0f2fe" opacity="0.6" />
        <text v-if="holgura > 0.2" :x="x0 + ancho + 6" :y="(y(altura) + y(alto)) / 2 + 3" font-size="10" :fill="holgura < holguraMin ? '#b45309' : '#0369a1'">{{ formatoM(holgura) }} m libres</text>
      </template>
      <!-- Pilares del rack -->
      <rect :x="x0" :y="y(altoMarco)" width="4" :height="y(0) - y(altoMarco)" fill="#94a3b8" />
      <rect :x="x0 + ancho - 4" :y="y(altoMarco)" width="4" :height="y(0) - y(altoMarco)" fill="#94a3b8" />
      <!-- Niveles con su carga -->
      <g v-for="(n, i) in niveles" :key="i">
        <rect v-if="n.viga" :x="x0" :y="y(n.y) - 2" :width="ancho" height="4" :fill="tipo === 'AR' ? '#60a5fa' : '#f97316'" />
        <rect
          :x="x0 + 8" :y="y(n.y + n.carga)" :width="ancho - 16" :height="Math.max(1, y(n.y) - y(n.y + n.carga) - (n.viga ? 2 : 0))"
          :fill="n.color ?? (tipo === 'AR' ? '#dbeafe' : '#e7c9a0')" :stroke="tipo === 'AR' ? '#93c5fd' : '#b45309'" stroke-width="0.8"
        />
      </g>
      <text :x="x0 - 6" :y="y(alto) + 4" text-anchor="end" font-size="10" fill="#334155">{{ formatoM(alto) }} m</text>
      <text v-if="nivelMasAlto" :x="x0 - 6" :y="y(nivelMasAlto) + 4" text-anchor="end" font-size="9" fill="#64748b">{{ formatoM(nivelMasAlto) }} m</text>
    </svg>
    <p v-if="sugerencia" class="mt-1 text-xs font-medium text-green-700">{{ sugerencia }}</p>
  </figure>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { medidasRack, formatoM, normalizar } from '~/lib/rack3d/planificador.js';
import { alturaUltimoNivel } from '~/lib/rack3d/operacion.js';
import { DISTANCIAS } from '~/lib/rack3d/parametrosTecnicos.js';

// Elevacion del rack seleccionado: niveles, carga, altura libre y holgura al techo
const props = defineProps<{ rack: Record<string, any>; altura: number | null }>();

const W = 260, H = 150, x0 = 70, ancho = 110;
const m = computed(() => medidasRack(props.rack) as Record<string, any>);
const tipo = computed(() => props.rack.tipo);
const alto = computed(() => m.value.altoConCarga ?? m.value.alto);
const altoMarco = computed(() => m.value.alto);
const altura = computed(() => (props.altura && props.altura > 0 ? props.altura : null));
const tope = computed(() => Math.max(alto.value, altura.value ?? 0) * 1.08);
const y = (v: number) => H - 8 - (v / tope.value) * (H - 18);
const holgura = computed(() => (altura.value ? altura.value - alto.value : 0));
const holguraMin = DISTANCIAS.holguraTecho.valor;
const nivelMasAlto = computed(() => alturaUltimoNivel(props.rack));

const niveles = computed(() => {
  const d = m.value;
  if (d.tipo === 'anra') return d.nivelesY.map((v: number, i: number) => ({ y: v, viga: true, carga: Math.min(0.28, (d.nivelesY[i + 1] ?? d.alto) - v - 0.04) }));
  const carga = d.pallet?.alto ?? 1.2;
  if (d.tipo === 'drivein') return [0, ...d.cartelasY].map((v: number, i: number) => ({ y: v, viga: i > 0, carga }));
  return [0, ...d.nivelesY].map((v: number, i: number) => ({ y: v, viga: i > 0, carga: d.altosCarga?.[i] ?? carga, color: d.coloresCarga?.[i] ?? null }));
});

// Si sobra altura para un nivel mas (con la holgura al techo), se sugiere
const sugerencia = computed(() => {
  if (!altura.value || tipo.value === 'AR') return '';
  const mas = normalizar({ ...props.rack, niveles: props.rack.niveles + 1 });
  if (mas.niveles === props.rack.niveles) return '';
  return ((medidasRack(mas) as any).altoConCarga ?? medidasRack(mas).alto) + holguraMin <= altura.value ? 'Te cabe un nivel más bajo el techo.' : '';
});

const descripcion = computed(() => `Corte del rack: ${formatoM(alto.value)} m de alto${altura.value ? `, techo a ${formatoM(altura.value)} m` : ''}`);
</script>
