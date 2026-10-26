<template>
  <!-- Precisión de la cotización (prompt de conversión §H): sube con cada dato real, baja con cada "No lo sé".
       Es motivación, nunca un bloqueo -->
  <div :class="['rounded-xl px-3 py-2 text-sm', COLOR[pr.nivel].caja, compacto && '!px-2.5 !py-1']" role="status" aria-live="polite">
    <p class="flex flex-wrap items-center gap-x-2">
      <span>Precisión de tu cotización: <b>{{ compacto ? pr.nivel : pr.texto }}</b></span>
      <span class="ml-auto inline-flex h-1.5 w-20 overflow-hidden rounded-full bg-black/10" aria-hidden="true">
        <span :class="['h-full rounded-full transition-all duration-300', COLOR[pr.nivel].barra]" :style="{ width: `${pr.pct}%` }" />
      </span>
    </p>
    <p v-if="!compacto && pr.estimados.length" class="mt-1 text-xs opacity-80">Estimado (tu ejecutivo lo confirma): {{ pr.estimados.join(', ') }}.</p>
    <p v-if="!compacto && pr.faltan.length" class="mt-0.5 text-xs opacity-80">Sin dato: {{ pr.faltan.join(', ') }}.</p>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { precision } from '~/lib/flujo/conversion.js';

const props = withDefaults(defineProps<{ estados: Record<string, string>; compacto?: boolean }>(), { compacto: false });
const pr = computed(() => precision(props.estados) as { nivel: 'alta' | 'media' | 'baja'; pct: number; estimados: string[]; faltan: string[]; texto: string });
const COLOR = {
  alta: { caja: 'bg-green-50 text-green-900 ring-1 ring-green-200', barra: 'bg-green-600' },
  media: { caja: 'bg-amber-50 text-amber-950 ring-1 ring-amber-200', barra: 'bg-amber-500' },
  baja: { caja: 'bg-neutral-100 text-neutral-800 ring-1 ring-neutral-200', barra: 'bg-neutral-500' },
};
</script>
