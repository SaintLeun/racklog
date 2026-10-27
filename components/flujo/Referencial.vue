<template>
  <!-- Valor tecnico que Racklog aun no confirma (docs/VALORES-POR-CONFIRMAR.md). Tono de garantia, no de
       disclaimer (prompt de conversion §E): ingenieria Racklog lo valida antes de cotizar -->
  <span v-if="visible" class="relative ml-1 inline-block align-middle">
    <button
      ref="boton" type="button" class="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-px text-[11px] font-semibold uppercase tracking-wide text-amber-900 hover:bg-amber-200"
      :aria-expanded="abierto" @click="alternar" @blur="cerrar"
    >ingeniería lo valida</button>
    <!-- Arriba del botón para no tapar el campo de la pregunta (useGlobo) -->
    <Teleport to="body">
      <span v-if="abierto" ref="globo" role="tooltip" class="fixed z-[60] rounded-lg bg-neutral-900 px-3 py-2 text-sm font-normal normal-case leading-snug tracking-normal text-white shadow-lg" :style="estilo">
        <slot>Valor típico de la industria. Antes de cotizar, ingeniería Racklog lo valida con cálculo estructural según NCh2369 (diseño sísmico) y ANSI MH16.1.</slot>
      </span>
    </Teleport>
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useGlobo } from '~/composables/useGlobo';
// Sin `de` siempre se muestra; con `de` (uno o varios parametros) solo si alguno sigue sin confirmar
const props = defineProps<{ de?: unknown }>();
const { abierto, estilo, boton, globo, alternar, cerrar } = useGlobo();
const visible = computed(() => {
  if (props.de === undefined) return true;
  const lista = Array.isArray(props.de) ? props.de : [props.de];
  return lista.some((x: any) => x && x.confirmado === false);
});
</script>
