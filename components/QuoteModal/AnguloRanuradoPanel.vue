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
      <div class="mt-4">
        <span :id="`${uid}-f1`" class="mb-2 block text-sm font-medium text-neutral-700">Tipo</span>
        <div role="group" :aria-labelledby="`${uid}-f1`" class="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
          <button
            v-for="option in ['simple', 'doble']" 
            :key="option"
            type="button"
            :aria-pressed="localConfig.tipo === option"
            @click="localConfig.tipo = option"
            :class="[
              'min-h-11 rounded-lg px-3 text-sm font-semibold capitalize transition-all duration-200',
              localConfig.tipo === option 
                ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-600/40' 
                : 'text-neutral-600 hover:bg-white/60 hover:text-neutral-900'
            ]"
          >
            {{ option }}
          </button>
        </div>
      </div>
    </section>

    <!-- Estructura -->
    <section class="border-t border-neutral-100 pt-6">
      <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
        <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>
        </svg>
        Estructura de la estantería
      </h3>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <!-- Ancho (Cuerpos) -->
        <div>
          <span :id="`${uid}-f2`" class="mb-2 block text-sm font-medium text-neutral-700">Ancho (Cuerpos)</span>
          <div role="group" :aria-labelledby="`${uid}-f2`" class="flex items-center justify-between rounded-xl bg-neutral-100 p-1">
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

        <!-- Altura (Niveles) -->
        <div>
          <span :id="`${uid}-f3`" class="mb-2 block text-sm font-medium text-neutral-700">Altura (Niveles)</span>
          <div role="group" :aria-labelledby="`${uid}-f3`" class="flex items-center justify-between rounded-xl bg-neutral-100 p-1">
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

    <!-- Acabado y especificaciones -->
    <section class="border-t border-neutral-100 pt-6">
      <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
        <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
        </svg>
        Acabado y especificaciones
      </h3>
      <div class="mt-4 space-y-4">
        <div>
          <span :id="`${uid}-f4`" class="mb-2 block text-sm font-medium text-neutral-700">Acabado</span>
          <div role="group" :aria-labelledby="`${uid}-f4`">
            <OptionToggle :options="['galvanizado', 'pintado']" v-model="localConfig.pintado" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label :for="`${uid}-f5`" class="mb-2 block text-sm font-medium text-neutral-700">Carga (kg)</label>
            <div class="relative">
              <select :id="`${uid}-f5`" 
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

          <div>
            <label :for="`${uid}-f6`" class="mb-2 block text-sm font-medium text-neutral-700">Fondo (mm)</label>
            <div class="relative">
              <select :id="`${uid}-f6`" 
                v-model="localConfig.bandeja"
                class="form-input appearance-none"
              >
                <option v-for="option in shelfWidth" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
              <svg class="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
const uid = useId();
import { reactive, watch } from 'vue'
import OptionToggle from '~/components/QuoteModal/OptionToggle.vue'
import type { AnguloRanuradoConfig } from '~/components/QuoteModal/ProductConfig'

const props = defineProps<{ modelValue: AnguloRanuradoConfig }>()
const emit = defineEmits(['update:modelValue'])

const localConfig = reactive({ ...props.modelValue })

watch(localConfig, () => emit('update:modelValue', { ...localConfig }), { deep: true })

// Arrays para opciones
const shelfWidth = ['300mm', '400mm', '460mm', '600mm']
const loadOptions = ['60kg', '90kg', '150kg', '250kg']

// Estilo de los botones +/- (solo visual)
const stepperBtnClass = 'inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200 transition hover:text-brand-700 hover:ring-brand-600/40'
</script>

