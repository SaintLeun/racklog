<template>
  <!-- Termino tecnico explicado con un "?" -->
  <span class="relative inline-block align-middle">
    <button
      type="button" class="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-300"
      :aria-expanded="abierto" aria-label="Más información" @click="abierto = !abierto" @blur="abierto = false"
    >?</button>
    <span v-if="abierto" role="tooltip" class="absolute left-1/2 top-7 z-20 w-60 -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-normal normal-case leading-snug tracking-normal text-white shadow-lg">
      <slot />
    </span>
  </span>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
const abierto = ref(false);
</script>
