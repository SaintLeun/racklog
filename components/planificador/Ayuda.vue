<template>
  <span ref="raiz" class="relative inline-flex align-middle">
    <button
      type="button"
      class="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-[11px] font-bold text-neutral-700 transition hover:bg-brand-100 hover:text-brand-800"
      :aria-label="`Ayuda: ${titulo}`"
      :aria-expanded="abierto"
      @click="abierto = !abierto"
    >?</button>
    <span
      v-if="abierto"
      role="tooltip"
      class="absolute left-0 top-6 z-30 w-64 rounded-xl bg-neutral-900 p-3 text-xs font-normal normal-case leading-relaxed tracking-normal text-white shadow-lg"
    ><slot /></span>
  </span>
</template>

<script lang="ts" setup>
import { ref, watch, onBeforeUnmount } from 'vue';

// Icono "?" junto a un campo del planificador: una linea de explicacion
defineProps<{ titulo: string }>();

const abierto = ref(false);
const raiz = ref<HTMLElement | null>(null);

const cerrarFuera = (e: Event) => { if (raiz.value && !raiz.value.contains(e.target as Node)) abierto.value = false; };
const cerrarEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') abierto.value = false; };

watch(abierto, (v) => {
  const accion = v ? 'addEventListener' : 'removeEventListener';
  document[accion]('pointerdown', cerrarFuera);
  document[accion]('keydown', cerrarEsc);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', cerrarFuera);
  document.removeEventListener('keydown', cerrarEsc);
});
</script>
