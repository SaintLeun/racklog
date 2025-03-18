<template>
    <div class="p-4 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-4 text-center">
        Configurador de Estanterías
      </h1>
  
      <div class="mb-4">
        <div class="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <button
            @click="selectedProduct = 'AR'; addRack()"
            :class="{ 'bg-blue-100 border-blue-500': selectedProduct === 'AR' }"
            class="p-2 border rounded shadow-md hover:shadow-lg transition-shadow w-full md:w-1/2"
          >
            <img
              src="/assets/images/rack_selectivo.jpg"
              alt="Ángulo Ranurado"
              class="mx-auto h-24 w-auto object-contain"
            />
            <p class="text-center font-semibold">Ángulo Ranurado (AR)</p>
          </button>
  
          <button
            @click="selectedProduct = 'RS'; addRack()"
            :class="{ 'bg-blue-100 border-blue-500': selectedProduct === 'RS' }"
            class="p-2 border rounded shadow-md hover:shadow-lg transition-shadow w-full md:w-1/2"
          >
            <img
              src="/assets/images/rack_selectivo.jpg"
              alt="Rack Selectivo"
              class="mx-auto h-24 w-auto object-contain"
            />
            <p class="text-center font-semibold">Rack Selectivo (RS)</p>
          </button>
        </div>
      </div>
  
      <div v-if="selectedProduct">
        <div class="mb-4">
          <div class="p-2 border rounded shadow-md">
            <h2 class="font-semibold mb-2">Tipo</h2>
            <div class="flex space-x-2">
              <button
                @click="config.type = 'simple'"
                :class="{ 'bg-blue-200': config.type === 'simple' }"
                class="px-4 py-2 rounded border flex-1"
              >
                Simple
              </button>
              <button
                @click="config.type = 'doble'"
                :class="{ 'bg-blue-200': config.type === 'doble' }"
                class="px-4 py-2 rounded border flex-1"
              >
                Doble
              </button>
            </div>
          </div>
        </div>
  
        <div class="mb-4">
          <div class="p-2 border rounded shadow-md">
            <h2 class="font-semibold mb-2">Altura (Niveles)</h2>
            <div class="flex items-center space-x-2">
              <button
                @click="config.niveles > 1 ? config.niveles-- : ''"
                class="px-3 py-1 rounded border"
              >
                -
              </button>
              <span>{{ config.niveles }}</span>
              <button
                @click="config.niveles < 6 ? config.niveles++ : ''"
                class="px-3 py-1 rounded border"
              >
                +
              </button>
            </div>
          </div>
        </div>
  
        <div class="mb-4">
          <div class="p-2 border rounded shadow-md">
            <h2 class="font-semibold mb-2">Ancho (Cuerpos)</h2>
            <div class="flex items-center space-x-2">
              <button
                @click="config.cuerpos > 1 ? config.cuerpos-- : ''"
                class="px-3 py-1 rounded border"
              >
                -
              </button>
              <span>{{ config.cuerpos }}</span>
              <button
                @click="config.cuerpos < 6 ? config.cuerpos++ : ''"
                class="px-3 py-1 rounded border"
              >
                +
              </button>
            </div>
          </div>
        </div>
  
        <div class="mb-4">
          <div class="p-2 border rounded shadow-md">
            <h2 class="font-semibold mb-2">Visualización 3D</h2>
            <div class="aspect-w-16 aspect-h-9">
              <iframe
                :src="sketchfabUrl"
                allowfullscreen
                mozallowfullscreen="true"
                webkitallowfullscreen="true"
              ></iframe>
            </div>
          </div>
        </div>
  
        <div class="mb-4">
          <div class="p-2 border rounded shadow-md">
            <h2 class="font-semibold mb-2">Floor Planner</h2>
            <div
              id="floor-planner"
              class="border border-gray-300"
              :style="{ width: plannerWidth + 'px', height: plannerHeight + 'px' }"
            ></div>
          </div>
        </div>
  
        <div class="mt-4">
          <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Solicitar Cotización
          </button>
        </div>
      </div>
  
      <div v-else class="text-center mt-4">
        <p class="text-lg">Seleccione un producto para configurar.</p>
      </div>
    </div>
  </template>
  
  <script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

const selectedProduct = ref(null);
const config = ref({
  type: 'simple',
  niveles: 1,
  cuerpos: 1,
});

const plannerWidth = ref(400);
const plannerHeight = ref(200);

const racks = ref([]);

const sketchfabUrl = computed(() => {
  if (selectedProduct.value === 'AR') {
    return `https://sketchfab.com/models/YOUR_AR_MODEL_UID/embed?ui_theme=dark`;
  } else if (selectedProduct.value === 'RS') {
    return `https://sketchfab.com/models/YOUR_RS_MODEL_UID/embed?ui_theme=dark`;
  }
  return '';
});
  </script>