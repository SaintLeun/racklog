<template>
  <!-- Llamado a la acción fijo: en celular ocupa el ancho abajo; en escritorio, una pastilla abajo al centro -->
  <Transition name="cta24">
    <div v-if="visible" class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 pr-20 sm:bottom-5 sm:pr-3">
      <div class="pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl bg-neutral-950 p-2.5 pl-4 text-white shadow-2xl ring-1 ring-white/10 sm:w-auto">
        <span class="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600/20 text-brand-300 sm:inline-flex" aria-hidden="true">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        </span>
        <div class="min-w-0 flex-1 leading-tight">
          <p class="text-sm font-semibold">{{ titulo }}</p>
          <p class="truncate text-xs text-neutral-400">Nuestro equipo comercial te responde en 24 horas hábiles.</p>
        </div>
        <button type="button" class="btn btn-primary h-11 flex-shrink-0 px-5 text-sm" :disabled="deshabilitado" @click="emit('cotizar')">
          {{ boton }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ visible?: boolean; titulo?: string; boton?: string; deshabilitado?: boolean }>(), {
  visible: true, titulo: 'Tu cotización en 24 horas', boton: 'Cotizar ahora', deshabilitado: false,
});
const emit = defineEmits<{ cotizar: [] }>();
</script>

<style scoped>
.cta24-enter-active, .cta24-leave-active { transition: transform .3s ease, opacity .3s ease; }
.cta24-enter-from, .cta24-leave-to { transform: translateY(120%); opacity: 0; }
</style>
