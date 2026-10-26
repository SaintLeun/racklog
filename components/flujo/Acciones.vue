<template>
  <!-- Un solo boton principal por paso, y "Atras" -->
  <div class="mt-8 flex items-center justify-between gap-3">
    <button v-if="atras" type="button" class="fl-btn-sec" @click="emit('atras')">Atrás</button>
    <span v-else />
    <button
      type="button"
      class="fl-btn"
      :aria-disabled="deshabilitado || undefined"
      :class="deshabilitado && 'opacity-50'"
      @click="deshabilitado ? emit('bloqueado') : emit('siguiente')"
    >{{ texto }}</button>
  </div>
  <p v-if="motivo && deshabilitado" class="mt-2 text-right text-sm text-red-700" role="status">{{ motivo }}</p>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ texto?: string; atras?: boolean; deshabilitado?: boolean; motivo?: string }>(), {
  texto: 'Siguiente', atras: true, deshabilitado: false, motivo: '',
});
const emit = defineEmits<{ siguiente: []; atras: []; bloqueado: [] }>();
</script>
