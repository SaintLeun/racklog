<template>
  <transition name="fade">
    <div v-if="isVisible" class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <transition name="modal">
        <div class="bg-gray-50 rounded-lg p-6 w-full max-w-7xl transform transition-transform duration-300 ease-out scale-95 opacity-0" :class="{'scale-100 opacity-100': isVisible}">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">{{ title }}</h2>
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
                  <div class="flex w-full space-x-2 ">
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
                              @click="config.niveles < 6 ? config.niveles++ : ''"
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
                              @click="config.cuerpos < 6 ? config.cuerpos++ : ''"
                              class="px-3 py-1 rounded border"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button class="text-white w-full bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg">Generar 3D</button>
                </div>
            
                
                <div class="w-full md:w-2/3 flex flex-col p-8">
                  <iframe v-if="model"
                    title="Modelo_RS_Ejemplo" 
                    class="w-full h-full mb-5"
                    frameborder="0" 
                    allowfullscreen 
                    mozallowfullscreen="true" 
                    webkitallowfullscreen="true" 
                    allow="autoplay; fullscreen; xr-spatial-tracking" 
                    xr-spatial-tracking 
                    execution-while-out-of-viewport 
                    execution-while-not-rendered 
                    web-share :src="model">
                  </iframe>
                  <button class="text-white bg-orange-400 border-0 py-2 px-6 focus:outline-none hover:bg-orange-500 rounded text-lg">Añadir a la Cotización</button>
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
import { watch, ref } from 'vue';

const selectedProduct = ref('');
const config = ref({
  type: 'simple',
  niveles: 1,
  cuerpos: 1,
});

const model = ref('https://sketchfab.com/models/1d90e83ff7704eaa9d7b0cc5f0f6a804/embed');

const plannerWidth = ref(400);
const plannerHeight = ref(200);

const racks = ref([]);

const props = defineProps({
  isVisible: Boolean,
  title: String,
});

const emit = defineEmits(['close']);

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

const form = ref({
  name: '',
  phone: '',
  email: '',
  message: '',
});

const sketchfabUrl = computed(() => {
  if (selectedProduct.value === 'AR') {
    return `https://sketchfab.com/models/YOUR_AR_MODEL_UID/embed?ui_theme=dark`;
  } else if (selectedProduct.value === 'RS') {
    return `https://sketchfab.com/models/YOUR_RS_MODEL_UID/embed?ui_theme=dark`;
  }
  return '';
});

function handleSubmit() {
  // Handle form submission
  console.log('Form submitted:', form.value);
  closeModal();
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