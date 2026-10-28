<template>
  <!-- "¿Por qué?" (dueño 28-10): RACKLOG explica de dónde sale este resultado, con los números del cliente -->
  <button type="button" class="ml-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 align-middle text-xs font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50" @click.stop.prevent="explicar(id, datos)">
    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5" /><path d="M12 17.5h.01" /></svg>
    ¿Por qué?
  </button>
</template>

<script lang="ts" setup>
import { useAsistente } from '~/composables/useAsistente';

defineProps<{ id: string; datos?: Record<string, any> }>();
const { explicar } = useAsistente();
</script>
