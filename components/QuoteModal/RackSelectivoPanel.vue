<template>
  <div class="space-y-4">

    <!-- Tipo -->
    <OptionCard title="Tipo" icon="exchange-alt" compact>
      <div class="grid grid-cols-2 gap-2"> <!-- Reducido gap-3 a gap-2 -->
        <button
          v-for="option in ['simple', 'doble']" 
          :key="option"
          @click="localConfig.tipo = option"
          :class="[
            'px-3 py-2 rounded-lg transition-all duration-200 border flex items-center justify-center', // Reducido padding
            localConfig.tipo === option 
              ? 'bg-orange-50 border-orange-400 text-orange-800 font-medium shadow-sm' 
              : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
          ]"
        >
          <span class="text-sm font-medium capitalize">{{ option }}</span>
        </button>
      </div>
    </OptionCard>

    <!-- Tipo y Cuerpos en una fila -->
    <div class="grid grid-cols-2 gap-4">

      <!-- Ancho (Cuerpos) -->
      <OptionCard title="Ancho (Cuerpos)" icon="columns" compact>
        <div class="flex items-center justify-between">
          <button
            @click="localConfig.cuerpos = Math.max(1, localConfig.cuerpos - 1)"
            class="h-8 w-8 rounded-full text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center shadow-sm"
            :disabled="localConfig.cuerpos <= 1"
            :class="{ 'opacity-50 cursor-not-allowed': localConfig.cuerpos <= 1 }"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
            </svg>
          </button>
          <div class="text-center">
            <span class="text-2xl font-bold text-gray-900">{{ localConfig.cuerpos }}</span>
          </div>
          <button
            @click="localConfig.cuerpos = Math.min(10, localConfig.cuerpos + 1)"
            class="h-8 w-8 rounded-full text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center shadow-sm"
            :disabled="localConfig.cuerpos >= 10"
            :class="{ 'opacity-50 cursor-not-allowed': localConfig.cuerpos >= 10 }"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6"></path>
            </svg>
          </button>
        </div>
      </OptionCard>

      <!-- Altura (Niveles) -->
      <OptionCard title="Altura (Niveles)" icon="arrows-alt-v" compact>
        <div class="flex items-center justify-between">
          <button
            @click="localConfig.niveles = Math.max(2, localConfig.niveles - 1)"
            class="h-8 w-8 rounded-full text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center shadow-sm"
            :disabled="localConfig.niveles <= 2"
            :class="{ 'opacity-50 cursor-not-allowed': localConfig.niveles <= 2 }"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
            </svg>
          </button>
          <div class="text-center">
            <span class="text-2xl font-bold text-gray-900">{{ localConfig.niveles }}</span>
          </div>
          <button
            @click="localConfig.niveles = Math.min(10, localConfig.niveles + 1)"
            class="h-8 w-8 rounded-full text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center shadow-sm"
            :disabled="localConfig.niveles >= 10"
            :class="{ 'opacity-50 cursor-not-allowed': localConfig.niveles >= 10 }"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6"></path>
            </svg>
          </button>
        </div>
      </OptionCard>
    </div>

    

    <!-- Dimensiones del Pallet en una fila -->
    <p class="text-center font-semibold">Dimensiones del pallet</p>
    <div class="grid grid-cols-2 gap-4">
      <!-- Frente del Pallet -->
      <OptionCard title="Frente (mm)" icon="ruler-horizontal" compact>
        <div class="flex justify-between gap-2">
          <button
            v-for="option in ['1000mm', '1200mm']" 
            :key="option"
            @click="localConfig.frentePallet = option"
            :class="[
              'flex-1 py-2 rounded-lg transition-all duration-200 border flex items-center justify-center',
              localConfig.frentePallet === option 
                ? 'bg-orange-50 border-orange-400 text-orange-800 font-medium shadow-sm' 
                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
            ]"
          >
            <span class="text-sm font-medium">{{ option.replace('mm', '') }}</span>
          </button>
        </div>
      </OptionCard>

      <!-- Fondo del Pallet -->
      <OptionCard title="Fondo (mm)" icon="ruler-vertical" compact>
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
      </OptionCard>
    </div>

    <!-- Alto y Carga en una fila -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Alto del Pallet -->
      <OptionCard title="Alto (mm)" icon="arrows-alt-v" compact>
        <div class="relative">
          <select 
            v-model="localConfig.altoPallet"
            class="w-full py-2 px-3 rounded-lg border border-gray-200 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
          >
            <option v-for="option in palletHeights" :key="option" :value="option">
              {{ option.replace('mm', '') }}
            </option>
          </select>
        </div>
      </OptionCard>

      <!-- Carga por Nivel -->
      <OptionCard title="Carga por nivel" icon="weight-hanging" compact>
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
      </OptionCard>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue'
import OptionCard from '~/components/QuoteModal/OptionCard.vue'
import type { RackSelectivoConfig } from '~/components/QuoteModal/ProductConfig'

const props = defineProps<{ modelValue: RackSelectivoConfig }>()
const emit = defineEmits(['update:modelValue'])

const localConfig = reactive({ ...props.modelValue })

// Arrays para opciones
const palletHeights = ['250mm', '500mm', '750mm', '1000mm', '1250mm', '1500mm', '1750mm', '2000mm']
const loadOptions = ['100kg', '200kg', '300kg', '400kg', '500kg', '600kg', '700kg', '800kg', '900kg', '1000kg']

watch(localConfig, () => emit('update:modelValue', { ...localConfig }), { deep: true })
</script>
