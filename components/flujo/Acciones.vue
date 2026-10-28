<template>
  <!-- Un solo botón principal por paso, y "Atrás". Fijo abajo en todos los pasos (revisión 27-10: había
       que bajar mucho para encontrar "Siguiente"). El espacio lo reserva el padding inferior de la página -->
  <div class="fl-acciones" role="group" aria-label="Avanzar en el diseño">
    <!-- En el celular el motivo va en su propia línea arriba (al lado de los botones se partía en 4-5 líneas) -->
    <div class="container-page flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
      <button v-if="atras" type="button" class="fl-btn-sec" @click="emit('atras')">Atrás</button>
      <p v-if="motivo && deshabilitado" class="order-first w-full text-center text-xs leading-tight text-red-700 sm:order-none sm:w-auto sm:min-w-0 sm:flex-1 sm:text-right sm:text-sm" role="status">{{ motivo }}</p>
      <span :class="['flex-1', motivo && deshabilitado && 'sm:hidden']" />
      <button
        type="button"
        class="fl-btn"
        :aria-disabled="deshabilitado || undefined"
        :class="deshabilitado && 'opacity-50'"
        @click="deshabilitado ? emit('bloqueado') : emit('siguiente')"
      >{{ texto }}</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ texto?: string; atras?: boolean; deshabilitado?: boolean; motivo?: string }>(), {
  texto: 'Siguiente', atras: true, deshabilitado: false, motivo: '',
});
const emit = defineEmits<{ siguiente: []; atras: []; bloqueado: [] }>();
</script>
