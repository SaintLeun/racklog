<template>
  <div class="space-y-6">
    <!-- Estructura del bloque -->
    <section>
      <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
        <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        Estructura del bloque
      </h3>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <div v-for="campo in campos" :key="campo.clave" :class="campo.clave === 'niveles' ? 'col-span-2 sm:col-span-1' : ''">
          <span :id="`${uid}-${campo.clave}`" class="mb-2 block text-sm font-medium text-neutral-700">{{ campo.etiqueta }}</span>
          <div role="group" :aria-labelledby="`${uid}-${campo.clave}`" class="flex items-center justify-between rounded-xl bg-neutral-100 p-1">
            <button
              type="button"
              :aria-label="`${campo.etiqueta}: quitar uno`"
              :disabled="localConfig[campo.clave] <= campo.min"
              @click="localConfig[campo.clave] = Math.max(campo.min, localConfig[campo.clave] - 1)"
              :class="stepperBtnClass"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2.5" d="M5 12h14" /></svg>
            </button>
            <span class="min-w-[2.5rem] text-center text-lg font-semibold tabular-nums text-neutral-900" aria-live="polite">
              {{ localConfig[campo.clave] }}
            </span>
            <button
              type="button"
              :aria-label="`${campo.etiqueta}: agregar uno`"
              :disabled="localConfig[campo.clave] >= campo.max"
              @click="localConfig[campo.clave] = Math.min(campo.max, localConfig[campo.clave] + 1)"
              :class="stepperBtnClass"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2.5" d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </div>
      </div>
      <p class="mt-3 text-xs text-neutral-500">Calles: pasillos por donde entra la grúa. Niveles: incluye el pallet apoyado en el piso.</p>
    </section>

    <!-- Pallet y carga -->
    <section class="border-t border-neutral-100 pt-6">
      <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
        <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
        Pallet y carga
      </h3>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <div>
          <span class="mb-2 block text-sm font-medium text-neutral-700">Pallet</span>
          <p class="flex min-h-11 items-center whitespace-nowrap rounded-xl bg-neutral-100 px-3 text-sm font-semibold tabular-nums text-neutral-800">1000×1200×1200 mm</p>
        </div>
        <div>
          <label :for="`${uid}-carga`" class="mb-2 block text-sm font-medium text-neutral-700">Peso por pallet</label>
          <div class="relative">
            <select :id="`${uid}-carga`" v-model="localConfig.carga" class="form-input appearance-none">
              <option v-for="option in loadOptions" :key="option" :value="option">{{ option }}</option>
            </select>
            <svg class="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue'
import type { DriveInConfig } from '~/components/QuoteModal/ProductConfig'

const uid = useId();
const props = defineProps<{ modelValue: DriveInConfig }>()
const emit = defineEmits(['update:modelValue'])

const localConfig = reactive({ ...props.modelValue })

watch(localConfig, () => emit('update:modelValue', { ...localConfig }), { deep: true })

// Mismos rangos que el planificador (lib/rack3d/planificador.js)
const campos = [
  { clave: 'cuerpos', etiqueta: 'Calles', min: 1, max: 20 },
  { clave: 'fondos', etiqueta: 'Pallets de fondo', min: 2, max: 12 },
  { clave: 'niveles', etiqueta: 'Niveles', min: 1, max: 5 },
] as const
const loadOptions = ['500kg', '750kg', '1000kg', '1250kg', '1500kg']

// Estilo de los botones +/- (solo visual)
const stepperBtnClass = 'inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200 transition hover:text-brand-700 hover:ring-brand-600/40 disabled:cursor-not-allowed disabled:opacity-40'
</script>
