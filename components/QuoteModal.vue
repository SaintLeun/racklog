<template>
  <transition name="fade">
    <div v-if="isVisible" class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <transition name="modal">
        <div class="bg-gray-50 rounded-lg p-6 w-full max-w-7xl transform transition-transform duration-300 ease-out scale-95 opacity-0" :class="{'scale-100 opacity-100': isVisible}">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Cotizador</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="flex">
            <section class="text-gray-600 body-font relative w-full">
              <div class="container px-2 py-2 mx-auto flex sm:flex-nowrap flex-wrap">
                <div class="w-full md:w-1/3 p-8">
                  <div class="flex w-full space-x-2">
                    <button
                      @click="selectedProduct = 'AR'"
                      :class="['p-2 rounded shadow-md hover:shadow-lg transition-shadow w-full md:w-1/2', selectedProduct === 'AR' ? 'bg-blue-100 border border-blue-500' : 'bg-white']"
                    >
                      <img
                        src="/assets/images/anra_body.png"
                        alt="Ángulo Ranurado"
                        class="mx-auto h-24 w-auto object-contain"
                      />
                      <p class="text-center font-semibold">Ángulo Ranurado</p>
                    </button>
                    <button
                      @click="selectedProduct = 'RS'"
                      :class="['p-2 rounded shadow-md hover:shadow-lg transition-shadow w-full md:w-1/2', selectedProduct === 'RS' ? 'bg-blue-100 border border-blue-500' : 'bg-white']"
                    >
                      <img
                        src="/assets/images/rack_selectivo.jpg"
                        alt="Rack Selectivo"
                        class="mx-auto h-24 w-auto object-contain"
                      />
                      <p class="text-center font-semibold">Rack Selectivo</p>
                    </button>
                  </div>
                  <div class="p-4 mb-4 bg-white rounded">
                    <p>Código del Producto: {{ productCode }}</p>
                  </div>
                  <div class="flex-row space-x-2 mt-4" v-if="selectedProduct">
                    <div class="w-full mb-4">
                      <div class="p-4 bg-white rounded shadow-md hover:shadow-lg transition-shadow w-full">
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

                    <div class="w-full mb-4" v-if="selectedProduct === 'AR'">
                      <div class="p-4 bg-white rounded shadow-md hover:shadow-lg transition-shadow w-full">
                        <h2 class="font-semibold mb-2">Pintado</h2>
                        <div class="flex space-x-2">
                          <button
                            @click="config.pintado = 'galvanizado'"
                            :class="{ 'bg-blue-200': config.pintado === 'galvanizado' }"
                            class="px-4 py-2 rounded border flex-1"
                          >
                            Galvanizado
                          </button>
                          <button
                            @click="config.pintado = 'pintado'"
                            :class="{ 'bg-blue-200': config.pintado === 'pintado' }"
                            class="px-4 py-2 rounded border flex-1"
                          >
                            Pintado
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="w-full mb-4" v-if="selectedProduct === 'AR'">
                      <div class="p-4 bg-white rounded shadow-md hover:shadow-lg transition-shadow w-full">
                        <h2 class="font-semibold mb-2">Carga</h2>
                        <div class="flex space-x-2">
                          <button
                            @click="config.carga = '90kg'"
                            :class="{ 'bg-blue-200': config.carga === '90kg' }"
                            class="px-4 py-2 rounded border flex-1"
                          >
                            90 kg
                          </button>
                          <button
                            @click="config.carga = '150kg'"
                            :class="{ 'bg-blue-200': config.carga === '150kg' }"
                            class="px-4 py-2 rounded border flex-1"
                          >
                            150 kg
                          </button>
                          <button
                            @click="config.carga = '250kg'"
                            :class="{ 'bg-blue-200': config.carga === '250kg' }"
                            class="px-4 py-2 rounded border flex-1"
                          >
                            250 kg
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="w-full mb-4" v-if="selectedProduct === 'AR'">
                      <div class="p-4 bg-white rounded shadow-md hover:shadow-lg transition-shadow w-full">
                        <h2 class="font-semibold mb-2">Bandeja</h2>
                        <div class="flex space-x-2">
                          <button
                            @click="config.bandeja = '300mm'"
                            :class="{ 'bg-blue-200': config.bandeja === '300mm' }"
                            class="px-4 py-2 rounded border flex-1"
                          >
                            300 mm
                          </button>
                          <button
                            @click="config.bandeja = '400mm'"
                            :class="{ 'bg-blue-200': config.bandeja === '400mm' }"
                            class="px-4 py-2 rounded border flex-1"
                          >
                            400 mm
                          </button>
                          <button
                            @click="config.bandeja = '460mm'"
                            :class="{ 'bg-blue-200': config.bandeja === '460mm' }"
                            class="px-4 py-2 rounded border flex-1"
                          >
                            460 mm
                          </button>
                          <button
                            @click="config.bandeja = '600mm'"
                            :class="{ 'bg-blue-200': config.bandeja === '600mm' }"
                            class="px-4 py-2 rounded border flex-1"
                          >
                            600 mm
                          </button>
                        </div>
                      </div>
                    </div>
              
                    <div class="w-full mb-4">
                      <div class="p-4 bg-white rounded shadow-md hover:shadow-lg transition-shadow">
                        <h2 class="font-semibold mb-2">Altura (Niveles)</h2>
                        <div class="flex items-center space-x-2 w-full justify-between">
                          <span class="pl-3 text-md">{{ config.niveles }}</span>
                          <div class="gap-x-2 flex items-center">
                            <button
                              @click="config.niveles > 1 ? config.niveles-- : ''"
                              class="px-3 py-1 rounded border"
                            >
                              -
                            </button>
                            <button
                              @click="config.niveles < 10 ? config.niveles++ : ''"
                              class="px-3 py-1 rounded border relative self-end"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
              
                    <div class="w-full mb-4">
                      <div class="p-4 bg-white rounded shadow-md hover:shadow-lg transition-shadow">
                        <h2 class="font-semibold mb-2">Ancho (Cuerpos)</h2>
                        <div class="flex items-center space-x-2 w-full justify-between">
                          <span class="pl-3 text-md">{{ config.cuerpos }}</span>
                          <div class="gap-x-2 flex items-center">
                            <button
                              @click="config.cuerpos > 1 ? config.cuerpos-- : ''"
                              class="px-3 py-1 rounded border"
                            >
                              -
                            </button>
                            <button
                              @click="config.cuerpos < 10 ? config.cuerpos++ : ''"
                              class="px-3 py-1 rounded border"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button class="text-white w-full bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg">Generar</button>
                </div>
            
                
                <div class="w-full md:w-2/3 flex flex-col p-8 relative">
                  

                  <!-- Iframe or No Model Found -->
                  <div class="relative w-full h-96 bg-gray-100 flex items-center justify-center">
                    <!-- Loading Overlay -->
                    <transition name="fade">
                      <div
                        v-if="loading"
                        class="absolute inset-0 flex justify-center items-center bg-white/80 z-10"
                      >
                        <p class="text-gray-500">Cargando modelo...</p>
                      </div>
                    </transition>
                    <iframe
                      v-if="!loading && model"
                      title="Modelo_RS_Ejemplo"
                      class="w-full h-full"
                      frameborder="0"
                      allowfullscreen
                      mozallowfullscreen="true"
                      webkitallowfullscreen="true"
                      allow="autoplay; fullscreen; xr-spatial-tracking"
                      xr-spatial-tracking
                      execution-while-out-of-viewport
                      execution-while-not-rendered
                      web-share
                      :src="model"
                    ></iframe>
                    <div v-else-if="!loading && !model" class="text-gray-500">
                      No se encontró el modelo.
                    </div>
                  </div>
                  <div class="p-4 my-4 bg-white rounded">
                    Precio: {{ selectedProduct === 'AR' ? '$' + 1000 : 'Cotización' }}
                  </div>
                  <button
                    @click="addToCart"
                    class="text-white bg-orange-400 border-0 py-2 px-6 focus:outline-none hover:bg-orange-500 rounded text-lg"
                  >
                    Añadir a la Cotización
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { watch, ref, computed } from 'vue';
import axios from 'axios';
import { useCartStore } from '../stores/cartStore'; // Import the cart store

const selectedProduct = ref('');
const config = ref({
  type: '',
  niveles: 1,
  cuerpos: 1,
  carga: '', // Specific to AR
  pintado: '', // Specific to AR
  bandeja: '', // Specific to AR
});

const model = ref('');
const loading = ref(false); // Loading state for the model
const token = 'eaaffe4a07a4587dc4fc7be6a145e65f'; // Replace with your Sketchfab API token
const user = 'racklog.cl'; // Replace with your Sketchfab username

const props = defineProps({
  isVisible: Boolean,
  title: String,
});

const emit = defineEmits(['close']);

const cartStore = useCartStore(); // Initialize the cart store

function closeModal() {
  emit('close');
}

watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

// Computed property to generate the concatenated string
const productCode = computed(() => {
  if (!selectedProduct.value) return '';

  const typeCode = config.value.type === 'doble' ? '2' : ''; // 2 for Doble, empty for Simple
  const cuerposCode = `${config.value.cuerpos}M`; // Number of cuerpos followed by 'M'
  const nivelesCode = `${config.value.niveles}E`; // Number of niveles followed by 'E'

  return `${selectedProduct.value}${typeCode}_${cuerposCode}_${nivelesCode}`;
});

// Function to fetch the UUID from Sketchfab API using axios
async function fetchModelUUID(modelo: string) {
  try {
    loading.value = true; // Start loading
    const response = await axios.get('https://api.sketchfab.com/v3/search', {
      headers: {
        Authorization: `Token ${token}`,
      },
      params: {
        type: 'models',
        q: modelo,
        user: user,
      },
    });

    const resultData = response.data;
    const uuid = resultData.results[0]?.uid;

    if (uuid) {
      model.value = `https://sketchfab.com/models/${uuid}/embed?ui_theme=dark`;
    } else {
      console.error('No UUID found for the given model');
    }
  } catch (error) {
    console.error('Error fetching UUID:', error);
  } finally {
    loading.value = false; // Stop loading
  }
}

// Watcher to fetch the UUID whenever the productCode changes
watch(productCode, (newCode) => {
  if (newCode) {
    fetchModelUUID(newCode);
  }
});

// Function to add the generated product to the cart
function addToCart() {
  const product = {
    id: productCode.value,
    name: selectedProduct.value === 'AR' ? 'Ángulo Ranurado' : 'Rack Selectivo',
    price: selectedProduct.value === 'AR' ? 1000 : 0, // Replace with actual price logic
    quantity: 1,
    config: config.value,
  };

  cartStore.addToCart(product); // Add the product to the cart store
  console.log('Added to cart:', product);
  // closeModal(); // Close the modal after adding to the cart
}
</script>

<style scoped>
/* Ensure the modal overlay covers the entire viewport */
.fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Define the transition effects for the backdrop */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Define the transition effects for the modal */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>