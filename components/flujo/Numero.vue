<template>
  <!-- Numero con − y +: nunca ofrece valores fuera de rango -->
  <div class="mt-2 inline-flex items-center rounded-xl ring-1 ring-neutral-300">
    <button type="button" class="fl-paso-btn" :disabled="valor <= min" :aria-label="`Menos ${etiqueta}`" @click="emit('cambio', valor - 1)">−</button>
    <output class="w-14 text-center text-lg font-semibold tabular-nums" aria-live="polite">{{ valor }}</output>
    <button type="button" class="fl-paso-btn" :disabled="valor >= max" :aria-label="`Más ${etiqueta}`" @click="emit('cambio', valor + 1)">+</button>
  </div>
</template>

<script lang="ts" setup>
defineProps<{ valor: number; min: number; max: number; etiqueta: string }>();
const emit = defineEmits<{ cambio: [v: number] }>();
</script>
