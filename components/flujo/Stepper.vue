<template>
  <nav aria-label="Pasos" class="fl-stepper">
    <div class="flex items-baseline justify-between gap-3">
      <p class="text-sm font-semibold text-neutral-900">
        Paso {{ indice + 1 }} de {{ PASOS.length }} · <span class="text-brand-700">{{ nombre(indice) }}</span>
      </p>
      <p class="text-xs text-neutral-500">{{ falta }}</p>
    </div>
    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200" aria-hidden="true">
      <div class="h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]" :style="{ width: `${((indice + 1) / PASOS.length) * 100}%` }" />
    </div>
    <!-- En pantalla grande: los pasos con nombre; se puede volver a los ya visitados -->
    <ol class="mt-2 hidden grid-cols-8 gap-1 md:grid">
      <li v-for="(p, i) in PASOS" :key="p.k">
        <button
          type="button"
          :disabled="i > alcanzado"
          :aria-current="i === indice ? 'step' : undefined"
          :class="['w-full truncate rounded-md px-1 py-1 text-center text-xs transition',
                   i === indice ? 'font-semibold text-brand-800' : i <= alcanzado ? 'text-neutral-600 hover:bg-neutral-100' : 'text-neutral-400']"
          @click="emit('ir', p.k)"
        >{{ i + 1 }}. {{ nombre(i) }}</button>
      </li>
    </ol>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { PASOS, useProyecto, type Paso } from '~/stores/proyecto';

const props = defineProps<{ indice: number; alcanzado: number }>();
const emit = defineEmits<{ ir: [paso: Paso] }>();
// Con ángulo ranurado (solo cajas) el paso 2 es "Tus cajas"
const proyecto = useProyecto();
const soloCajas = computed(() => (proyecto.modelos.length ? proyecto.modelos.every((m) => m.tipo === 'AR') : proyecto.sistema === 'AR'));
const nombre = (i: number) => (PASOS[i].k === 'pallets' && soloCajas.value ? 'Tus cajas' : PASOS[i].k === 'rack' && soloCajas.value ? 'Arma tu estante' : PASOS[i].t);
// Minutos que quedan desde este paso (redondeado hacia arriba)
const falta = computed(() => {
  const m = PASOS.slice(props.indice).reduce((t, p) => t + p.min, 0);
  return props.indice === PASOS.length - 1 ? 'Último paso' : `~${Math.ceil(m)} min para terminar`;
});
</script>
