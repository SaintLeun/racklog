<template>
  <!-- Valor tecnico que Racklog aun no confirma (docs/VALORES-POR-CONFIRMAR.md) -->
  <span v-if="visible" class="relative ml-1 inline-block align-middle">
    <button
      type="button" class="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-px text-[11px] font-semibold uppercase tracking-wide text-amber-900 hover:bg-amber-200"
      :aria-expanded="abierto" @click="abierto = !abierto" @blur="abierto = false"
    >referencial</button>
    <span v-if="abierto" role="tooltip" class="absolute left-1/2 top-6 z-20 w-60 -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-normal normal-case leading-snug tracking-normal text-white shadow-lg">
      <slot>Valor típico de la industria: Racklog lo confirma con tu caso antes de cotizar.</slot>
    </span>
  </span>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
// Sin `de` siempre se muestra; con `de` (uno o varios parametros) solo si alguno sigue sin confirmar
const props = defineProps<{ de?: unknown }>();
const abierto = ref(false);
const visible = computed(() => {
  if (props.de === undefined) return true;
  const lista = Array.isArray(props.de) ? props.de : [props.de];
  return lista.some((x: any) => x && x.confirmado === false);
});
</script>
