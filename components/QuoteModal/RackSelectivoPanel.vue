<template>
  <div class="space-y-5">

    <!-- Configuration Type Section -->
    <div>
      <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <svg class="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        Configuración básica
      </h3>
      <div class="grid grid-cols-2 gap-3">
        <!-- Tipo -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Tipo</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="option in ['simple', 'doble']" 
              :key="option"
              @click="localConfig.tipo = option"
              :class="[
                'px-3 py-2 rounded-lg transition-all duration-200 border flex items-center justify-center',
                localConfig.tipo === option 
                  ? 'bg-orange-50 border-orange-400 text-orange-800 font-medium shadow-sm' 
                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
              ]"
            >
              <span class="text-sm font-medium capitalize">{{ option }}</span>
            </button>
          </div>
        </div>

        <!-- Pallets por Nivel -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Pallets por nivel</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="option in [2, 3]" 
              :key="option"
              @click="handlePalletsPerBeamChange(option)"
              :disabled="isPalletsPerBeamDisabled(option)"
              :class="[
                'px-3 py-2 rounded-lg transition-all duration-200 border flex items-center justify-center',
                localConfig.palletsPerBeam === option 
                  ? 'bg-orange-50 border-orange-400 text-orange-800 font-medium shadow-sm' 
                  : isPalletsPerBeamDisabled(option)
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
              ]"
              :title="isPalletsPerBeamDisabled(option) ? 'No recomendado con pallet de 1200mm de frente' : ''"
            >
              <span class="text-sm font-medium">{{ option }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Warning message for 3 pallets with 1200mm frente -->
    <div v-if="show1200mmWarning" class="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
      <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
      <div>
        <p class="text-sm font-semibold text-amber-800">Restricción técnica</p>
        <p class="text-xs text-amber-700 mt-1">
          Con pallets de 1200mm de frente no se recomienda utilizar 3 pallets por nivel. Por razones estructurales, use pallets de 800mm o 1000mm, o mantenga 2 pallets por nivel.
        </p>
      </div>
    </div>

    <!-- Structure Section -->
    <div>
      <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <svg class="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        Estructura del rack
      </h3>
      <div class="grid grid-cols-2 gap-3">

      <!-- Cantidad de cuerpos (Número de módulos) -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-2">Cantidad de cuerpos</label>
        <div class="flex items-center justify-between bg-gray-50 rounded-lg p-2">
          <button
            @click="localConfig.cuerpos = Math.max(1, localConfig.cuerpos - 1)"
            class="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-colors flex items-center justify-center"
          >
            <span class="text-lg font-semibold text-gray-700">−</span>
          </button>
          <span class="text-lg font-semibold text-gray-900 min-w-[3rem] text-center">
            {{ localConfig.cuerpos }}
          </span>
          <button
            @click="localConfig.cuerpos = Math.min(10, localConfig.cuerpos + 1)"
            class="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-colors flex items-center justify-center"
          >
            <span class="text-lg font-semibold text-gray-700">+</span>
          </button>
        </div>
      </div>

      <!-- Niveles de viga -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-2">Niveles de viga</label>
        <div class="flex items-center justify-between bg-gray-50 rounded-lg p-2">
          <button
            @click="localConfig.niveles = Math.max(2, localConfig.niveles - 1)"
            class="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-colors flex items-center justify-center"
          >
            <span class="text-lg font-semibold text-gray-700">−</span>
          </button>
          <span class="text-lg font-semibold text-gray-900 min-w-[3rem] text-center">
            {{ localConfig.niveles }}
          </span>
          <button
            @click="localConfig.niveles = Math.min(10, localConfig.niveles + 1)"
            class="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-colors flex items-center justify-center"
          >
            <span class="text-lg font-semibold text-gray-700">+</span>
          </button>
        </div>
      </div>
    </div>
    </div>

    <!-- Dimensiones del Pallet -->
    <div class="pt-4 border-t border-gray-200">
      <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <svg class="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
        Dimensiones del pallet
      </h3>
      <div class="grid grid-cols-2 gap-3">
        <!-- Frente del Pallet -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Frente (mm)</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="option in ['800mm', '1000mm', '1200mm']" 
            :key="option"
            @click="localConfig.frentePallet = option"
            :class="[
              'py-2 rounded-lg transition-all duration-200 border flex items-center justify-center',
              localConfig.frentePallet === option 
                ? 'bg-orange-50 border-orange-400 text-orange-800 font-medium shadow-sm' 
                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
            ]"
          >
            <span class="text-sm font-medium">{{ option.replace('mm', '') }}</span>
          </button>
        </div>
        </div>

        <!-- Fondo del Pallet -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Fondo (mm)</label>
        <div class="flex justify-between gap-2">
          <button
            v-for="option in ['1000mm', '1200mm']" 
            :key="option"
            @click="localConfig.fondoPallet = option"
            :class="[
              'flex-1 py-2 rounded-lg transition-all duration-200 border flex items-center justify-center',
              localConfig.fondoPallet === option 
                ? 'bg-orange-50 border-orange-400 text-orange-800 font-medium shadow-sm' 
                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
            ]"
          >
            <span class="text-sm font-medium">{{ option.replace('mm', '') }}</span>
          </button>
        </div>
        </div>
      </div>
    </div>

    <!-- Load Capacity Section -->
    <div>
      <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <svg class="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
        Altura y capacidad
      </h3>
      <div class="grid grid-cols-2 gap-3">
        <!-- Alto del Pallet -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Altura (mm)</label>
        <div class="relative">
          <select 
            v-model="localConfig.altoPallet"
            class="w-full py-2 px-3 rounded-lg border border-gray-200 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
          >
            <option v-for="option in palletHeights" :key="option" :value="option">
              {{ option.replace('mm', '') }} mm
            </option>
          </select>
        </div>
        </div>

        <!-- Carga por Nivel -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Carga por nivel</label>
        <div class="relative">
          <select 
            v-model="localConfig.carga"
            class="w-full py-2 px-3 rounded-lg border border-gray-200 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
          >
            <option v-for="option in loadOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
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
</script>
