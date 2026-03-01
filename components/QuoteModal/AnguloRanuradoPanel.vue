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
    </div>

    <!-- Structure Section -->
    <div>
      <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <svg class="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>
        </svg>
        Estructura de la estantería
      </h3>
      <div class="grid grid-cols-2 gap-3">
        <!-- Ancho (Cuerpos) -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Ancho (Cuerpos)</label>
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

        <!-- Altura (Niveles) -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Altura (Niveles)</label>
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

    <!-- Finish and Specifications Section -->
    <div>
      <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <svg class="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
        </svg>
        Acabado y especificaciones
      </h3>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Acabado</label>
          <OptionToggle :options="['galvanizado', 'pintado']" v-model="localConfig.pintado" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-2">Carga (kg)</label>
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

          <div>
            <label class="block text-xs font-medium text-gray-600 mb-2">Fondo (mm)</label>
            <div class="relative">
              <select 
                v-model="localConfig.bandeja"
                class="w-full py-2 px-3 rounded-lg border border-gray-200 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              >
                <option v-for="option in shelfWidth" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script lang="ts" setup>
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
</script>
