<template>
  <!-- Termino tecnico explicado con un "?". El globo se abre arriba para no tapar el campo (useGlobo) -->
  <span class="relative inline-block align-middle">
    <button
      ref="boton" type="button" class="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-300"
      :aria-expanded="abierto" aria-label="Más información" @click="alternar" @blur="cerrar"
    >?</button>
    <Teleport to="body">
      <span v-if="abierto" ref="globo" role="tooltip" class="fixed z-[60] rounded-lg bg-neutral-900 px-3 py-2 text-sm font-normal normal-case leading-snug tracking-normal text-white shadow-lg" :style="estilo">
        <slot />
      </span>
    </Teleport>
  </span>
</template>

<script lang="ts" setup>
import { useGlobo } from '~/composables/useGlobo';
const { abierto, estilo, boton, globo, alternar, cerrar } = useGlobo();
</script>
