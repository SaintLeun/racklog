<template>
  <div class="space-y-6">
    <!-- Configuracion basica -->
    <section>
      <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
        <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        Configuración básica
      </h3>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <div>
          <span :id="`${uid}-f1`" class="mb-2 block text-sm font-medium text-neutral-700">Tipo</span>
          <div role="group" :aria-labelledby="`${uid}-f1`" class="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
            <button
              v-for="option in ['simple', 'doble']"
              :key="option"
              type="button"
              :aria-pressed="localConfig.tipo === option"
              @click="localConfig.tipo = option"
              :class="[
                'min-h-11 rounded-lg px-2 text-sm font-semibold transition-all duration-200',
                localConfig.tipo === option
                  ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-600/40'
                  : 'text-neutral-600 hover:bg-white/60 hover:text-neutral-900'
              ]"
            >
              <span class="capitalize">{{ option }}</span>
            </button>
          </div>
        </div>

        <!-- Pallets por nivel -->
        <div>
          <span :id="`${uid}-f2`" class="mb-2 block text-sm font-medium text-neutral-700">Pallets por nivel</span>
          <div role="group" :aria-labelledby="`${uid}-f2`" class="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
            <button
              v-for="option in [2, 3]"
              :key="option"
              type="button"
              :aria-pressed="localConfig.palletsPerBeam === option"
              @click="handlePalletsPerBeamChange(option)"
              :disabled="isPalletsPerBeamDisabled(option)"
              :class="[
                'min-h-11 rounded-lg px-2 text-sm font-semibold transition-all duration-200',
                localConfig.palletsPerBeam === option
                  ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-600/40'
                  : isPalletsPerBeamDisabled(option)
                  ? 'cursor-not-allowed text-neutral-400 line-through'
                  : 'text-neutral-600 hover:bg-white/60 hover:text-neutral-900'
              ]"
              :title="isPalletsPerBeamDisabled(option) ? 'No recomendado con pallet de 1200mm de frente' : ''"
            >
              {{ option }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Aviso: 3 pallets con frente de 1200mm -->
    <div v-if="show1200mmWarning" class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
      <div>
        <p class="text-sm font-semibold text-amber-900">Restricción técnica</p>
        <p class="mt-1 text-sm text-amber-800">
          Con pallets de 1200mm de frente no se recomienda utilizar 3 pallets por nivel. Por razones estructurales, use pallets de 800mm o 1000mm, o mantenga 2 pallets por nivel.
        </p>
      </div>
    </div>

    <!-- Estructura del rack -->
    <section class="border-t border-neutral-100 pt-6">
      <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
        <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        Estructura del rack
      </h3>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <div>
          <span :id="`${uid}-f3`" class="mb-2 block text-sm font-medium text-neutral-700">Cantidad de cuerpos</span>
          <div role="group" :aria-labelledby="`${uid}-f3`" class="flex items-center justify-between rounded-xl bg-neutral-100 p-1">
            <button
              type="button"
              aria-label="Quitar un cuerpo"
              @click="localConfig.cuerpos = Math.max(1, localConfig.cuerpos - 1)"
              :class="stepperBtnClass"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2.5" d="M5 12h14" /></svg>
            </button>
            <span class="min-w-[2.5rem] text-center text-lg font-semibold tabular-nums text-neutral-900" aria-live="polite">
              {{ localConfig.cuerpos }}
            </span>
            <button
              type="button"
              aria-label="Agregar un cuerpo"
              @click="localConfig.cuerpos = Math.min(10, localConfig.cuerpos + 1)"
              :class="stepperBtnClass"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2.5" d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </div>
        <div>
          <span :id="`${uid}-f4`" class="mb-2 block text-sm font-medium text-neutral-700">Niveles de viga</span>
          <div role="group" :aria-labelledby="`${uid}-f4`" class="flex items-center justify-between rounded-xl bg-neutral-100 p-1">
            <button
              type="button"
              aria-label="Quitar un nivel"
              @click="localConfig.niveles = Math.max(2, localConfig.niveles - 1)"
              :class="stepperBtnClass"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2.5" d="M5 12h14" /></svg>
            </button>
            <span class="min-w-[2.5rem] text-center text-lg font-semibold tabular-nums text-neutral-900" aria-live="polite">
              {{ localConfig.niveles }}
            </span>
            <button
              type="button"
              aria-label="Agregar un nivel"
              @click="localConfig.niveles = Math.min(10, localConfig.niveles + 1)"
              :class="stepperBtnClass"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2.5" d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Dimensiones del pallet -->
    <section class="border-t border-neutral-100 pt-6">
      <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
        <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
        Dimensiones del pallet
      </h3>
      <div class="mt-4 space-y-4">
        <div>
          <span :id="`${uid}-f5`" class="mb-2 block text-sm font-medium text-neutral-700">Frente (mm)</span>
          <div role="group" :aria-labelledby="`${uid}-f5`" class="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
            <button
              v-for="option in ['800mm', '1000mm', '1200mm']"
              :key="option"
              type="button"
              :aria-pressed="localConfig.frentePallet === option"
              @click="localConfig.frentePallet = option"
              :class="[
                'min-h-11 rounded-lg px-2 text-sm font-semibold transition-all duration-200',
                localConfig.frentePallet === option
                  ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-600/40'
                  : 'text-neutral-600 hover:bg-white/60 hover:text-neutral-900'
              ]"
            >
              {{ option.replace('mm', '') }}
            </button>
          </div>
        </div>
        <div>
          <span :id="`${uid}-f6`" class="mb-2 block text-sm font-medium text-neutral-700">Fondo (mm)</span>
          <div role="group" :aria-labelledby="`${uid}-f6`" class="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
            <button
              v-for="option in ['1000mm', '1200mm']"
              :key="option"
              type="button"
              :aria-pressed="localConfig.fondoPallet === option"
              @click="localConfig.fondoPallet = option"
              :class="[
                'min-h-11 rounded-lg px-2 text-sm font-semibold transition-all duration-200',
                localConfig.fondoPallet === option
                  ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-600/40'
                  : 'text-neutral-600 hover:bg-white/60 hover:text-neutral-900'
              ]"
            >
              {{ option.replace('mm', '') }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Altura y capacidad -->
    <section class="border-t border-neutral-100 pt-6">
      <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
        <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
        Altura y capacidad
      </h3>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label :for="`${uid}-f7`" class="mb-2 block text-sm font-medium text-neutral-700">Altura (mm)</label>
          <div class="relative">
            <select :id="`${uid}-f7`"
              v-model="localConfig.altoPallet"
              class="form-input appearance-none"
            >
              <option v-for="option in palletHeights" :key="option" :value="option">
                {{ option.replace('mm', '') }} mm
              </option>
            </select>
            <svg class="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        <div>
          <label :for="`${uid}-f8`" class="mb-2 block text-sm font-medium text-neutral-700">Carga por nivel</label>
          <div class="relative">
            <select :id="`${uid}-f8`"
              v-model="localConfig.carga"
              class="form-input appearance-none"
            >
              <option v-for="option in loadOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
            <svg class="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
const uid = useId();
import { reactive, watch, computed } from 'vue'
import type { RackSelectivoConfig } from '~/components/QuoteModal/ProductConfig'

const props = defineProps<{ modelValue: RackSelectivoConfig }>()
const emit = defineEmits(['update:modelValue'])

const localConfig = reactive({ ...props.modelValue })

// Ensure palletsPerBeam has a default value
if (!localConfig.palletsPerBeam) {
  localConfig.palletsPerBeam = 2;
}

// Generate height options from 1000mm to 2000mm in 100mm increments
const generatePalletHeights = () => {
  const heights = [];
  for (let i = 1000; i <= 2000; i += 100) {
    heights.push(`${i}mm`);
  }
  return heights;
}

// Arrays para opciones
const palletHeights = generatePalletHeights();
const loadOptions = ['100kg', '200kg', '300kg', '400kg', '500kg', '600kg', '700kg', '800kg', '900kg', '1000kg']

// Check if 3 pallets per beam is disabled (when frente is 1200mm)
const isPalletsPerBeamDisabled = (option: number) => {
  if (option === 3 && localConfig.frentePallet === '1200mm') {
    return true;
  }
  return false;
}

// Show warning when trying to use 3 pallets with 1200mm frente
const show1200mmWarning = computed(() => {
  return localConfig.frentePallet === '1200mm' && localConfig.palletsPerBeam === 3;
})

// Handle pallets per beam change with validation
const handlePalletsPerBeamChange = (option: number) => {
  // If trying to select 3 pallets with 1200mm frente, prevent it
  if (option === 3 && localConfig.frentePallet === '1200mm') {
    return; // Don't allow the change
  }
  localConfig.palletsPerBeam = option;
}

// Watch frente pallet changes to reset pallets per beam if needed
watch(() => localConfig.frentePallet, (newFrente) => {
  // If frente is changed to 1200mm and currently has 3 pallets per beam, reset to 2
  if (newFrente === '1200mm' && localConfig.palletsPerBeam === 3) {
    localConfig.palletsPerBeam = 2;
  }
})

watch(localConfig, () => emit('update:modelValue', { ...localConfig }), { deep: true })

// Estilo de los botones +/- (solo visual)
const stepperBtnClass = 'inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200 transition hover:text-brand-700 hover:ring-brand-600/40'
</script>
