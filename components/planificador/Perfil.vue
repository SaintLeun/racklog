<template>
  <!-- En celular el plano queda bajo el panel: aqui va fijo en la ventana para que se vea al entrar -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-[2px] lg:absolute lg:z-20">
    <div class="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true" :aria-labelledby="`${uid}-t`">
      <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">Revisión de ingeniería sin costo</p>
      <h2 :id="`${uid}-t`" class="mt-1.5 text-lg font-bold text-neutral-900">¿Cuál es tu rol en este proyecto?</h2>
      <p class="mt-1 text-sm text-neutral-600">Así te mostramos lo que más te sirve. Un ejecutivo de Racklog revisa tu diseño gratis.</p>
      <div class="mt-4 space-y-2">
        <button
          v-for="p in PERFILES" :key="p.v" ref="botones"
          type="button"
          class="flex w-full items-start gap-3 rounded-xl p-3 text-left ring-1 ring-neutral-200 transition hover:bg-brand-50 hover:ring-brand-300"
          @click="emit('elegir', p.v)"
        >
          <span class="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700" aria-hidden="true">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path :d="p.icono" /></svg>
          </span>
          <span>
            <span class="block font-semibold text-neutral-900">{{ p.t }}</span>
            <span class="block text-sm text-neutral-600">{{ p.d }}</span>
          </span>
        </button>
      </div>
      <button type="button" class="mt-3 w-full text-center text-sm font-medium text-neutral-500 hover:text-neutral-800" @click="emit('elegir', null)">Prefiero no decirlo</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { PERFILES } from '~/lib/rack3d/planificador.js';

const emit = defineEmits<{ elegir: [perfil: string | null] }>();
const uid = useId();
const botones = ref<HTMLButtonElement[]>([]);
onMounted(() => botones.value[0]?.focus());
</script>
