<template>
  <div v-if="isVisible" class="fixed inset-0 flex items-start justify-center bg-black/60 z-50 overflow-y-auto py-4">
    <!-- Contenedor exterior con scroll propio que evita el scroll del body -->
    <div class="min-h-screen flex items-start justify-center w-full overflow-y-auto" @click.self="closeModal">
      <!-- Modal con altura máxima y scroll interno -->
      <div class="bg-white rounded-2xl overflow-hidden w-full max-w-7xl my-8 mx-4 shadow-2xl transform transition-all duration-300 ease-out">
        <div class="h-1.5 bg-gradient-to-r from-orange-500 to-orange-400"></div>

        <!-- Scrollable content container -->
        <div class="p-6 bg-gray-50 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center flex-wrap gap-2">
              <h2 class="text-xl sm:text-2xl font-bold text-gray-800">
                {{ title || 'Configurador de Producto' }}
              </h2>
              <span class="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                Personalizable
              </span>
            </div>
            <div class="flex items-center space-x-3">
              <button
                @click="goToCart"
                class="flex items-center text-gray-700 hover:text-orange-600 bg-white py-2 px-4 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all"
              >
                <span class="hidden sm:inline">Mi Cotización</span>
                <span class="sm:hidden">Cotización</span>
              </button>
              <button @click="closeModal" class="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="container mx-auto flex flex-col lg:flex-row gap-6">
            <div class="w-full lg:w-1/3 space-y-4">
              <!-- Product Selection Cards -->
              <div class="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                  </svg>
                  Selecciona tu Producto
                </h3>
                <div class="grid grid-cols-2 gap-3">
                  <button @click="selectProduct('AR')" :class="productButtonClass('AR')">
                    <img src="/assets/images/anra_body.png" class="h-16 sm:h-20 w-auto mx-auto mb-2" />
                    <span class="text-xs sm:text-sm font-medium text-center block">Ángulo Ranurado</span>
                  </button>
                  <button @click="selectProduct('RS')" :class="productButtonClass('RS')">
                    <img src="/assets/images/rack_selectivo.jpg" class="h-16 sm:h-20 w-auto mx-auto mb-2" />
                    <span class="text-xs sm:text-sm font-medium text-center block">Rack Selectivo</span>
                  </button>
                </div>
              </div>

              <!-- Configuration Panel -->
              <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div class="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200">
                  <h3 class="text-sm font-semibold text-gray-800 flex items-center">
                    <svg class="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                    </svg>
                    Configuración
                  </h3>
                </div>
                <div class="p-4">
                  <AnguloRanuradoPanel
                    v-if="selectedProduct === 'AR'"
                    v-model="config as AnguloRanuradoConfig"
                  />
                  <RackSelectivoPanel
                    v-else-if="selectedProduct === 'RS'"
                    v-model="config as RackSelectivoConfig"
                  />
                  <div v-else class="text-center py-8 text-gray-500">
                    <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <p class="text-sm">Selecciona un producto para configurar</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="w-full lg:w-2/3">
              <!-- 3D Model Viewer -->
              <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div class="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
                  <h3 class="text-sm font-semibold text-gray-800 flex items-center">
                    <svg class="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    Vista Previa 3D
                  </h3>
                </div>
                <div class="relative h-[300px] sm:h-[400px] lg:h-[460px] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <!-- Model Not Found State -->
                  <div v-if="modelNotFound && !loading" class="text-center px-4">
                    <svg class="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="text-gray-600 font-medium mb-1">Modelo 3D no disponible</p>
                    <p class="text-gray-500 text-sm">
                      No pudimos cargar el modelo 3D para esta configuración. Los detalles técnicos están disponibles a continuación.
                    </p>
                  </div>
                  
                  <!-- Initial State - No Configuration Yet -->
                  <div v-else-if="!model && !loading" class="text-center px-4">
                    <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    <p class="text-gray-500 font-medium">Configura tu producto</p>
                    <p class="text-gray-400 text-sm mt-1">El modelo 3D aparecerá aquí</p>
                  </div>
                  
                  <!-- Model Loaded -->
                  <iframe v-else-if="model && !loading" class="w-full h-full" :src="model" frameborder="0" allowfullscreen></iframe>

                  <!-- Loading State -->
                  <div v-if="loading" class="absolute inset-0 flex flex-col justify-center items-center bg-white/90 backdrop-blur-sm z-10">
                    <svg class="animate-spin h-10 w-10 text-orange-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p class="text-gray-700 font-semibold">Cargando modelo 3D...</p>
                    <p class="text-gray-500 text-sm mt-1">Por favor espera</p>
                  </div>
                </div>
              </div>

              <!-- Unified Specifications & Configuration Summary -->
              <div v-if="selectedProduct && isConfigurationComplete" class="mt-4 space-y-4">
                <!-- Product Summary Card -->
                <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center">
                      <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mr-3">
                        <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                      </div>
                      <div>
                        <h4 class="font-semibold text-gray-900">
                          {{ selectedProduct === 'AR' ? 'Ángulo Ranurado' : 'Rack Selectivo' }}
                        </h4>
                        <p class="text-xs text-gray-500">{{ config.tipo === 'simple' ? 'Simple' : 'Doble' }} • {{ config.cuerpos }} {{ config.cuerpos === 1 ? 'módulo' : 'módulos' }} • {{ config.niveles }} {{ config.niveles === 1 ? 'nivel' : 'niveles' }}</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-gray-500">Código</p>
                      <p class="font-mono font-bold text-sm text-gray-900">{{ productCode }}</p>
                    </div>
                  </div>
                  <div class="pt-3 border-t border-gray-100 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Capacidad:</span>
                      <span class="font-medium text-gray-900">{{ config.carga }}</span>
                    </div>
                    <div v-if="selectedProduct === 'RS'" class="flex justify-between">
                      <span class="text-gray-600">Frente pallet:</span>
                      <span class="font-medium text-gray-900">{{ (config as RackSelectivoConfig).frentePallet }}</span>
                    </div>
                    <div v-if="selectedProduct === 'RS'" class="flex justify-between">
                      <span class="text-gray-600">Fondo pallet:</span>
                      <span class="font-medium text-gray-900">{{ (config as RackSelectivoConfig).fondoPallet }}</span>
                    </div>
                    <div v-if="selectedProduct === 'RS'" class="flex justify-between">
                      <span class="text-gray-600">Alto pallet:</span>
                      <span class="font-medium text-gray-900">{{ (config as RackSelectivoConfig).altoPallet }}</span>
                    </div>
                    <div v-if="selectedProduct === 'AR'" class="flex justify-between">
                      <span class="text-gray-600">Bandeja:</span>
                      <span class="font-medium text-gray-900">{{ (config as AnguloRanuradoConfig).bandeja }}</span>
                    </div>
                    <div v-if="selectedProduct === 'AR'" class="flex justify-between">
                      <span class="text-gray-600">Acabado:</span>
                      <span class="font-medium text-gray-900">{{ (config as AnguloRanuradoConfig).pintado === 'galvanizado' ? 'Galvanizado' : 'Pintado' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Technical Dimensions - Only for Rack Selectivo -->
                <div v-if="selectedProduct === 'RS'" class="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <!-- Rack Dimensions -->
                  <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div class="flex items-center mb-2">
                      <svg class="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4a1 1 0 011-1h4m12 0h-4a1 1 0 011 1v4m0 8v4a1 1 0 01-1 1h-4m-12 0h4a1 1 0 01-1-1v-4"></path>
                      </svg>
                      <h5 class="text-sm font-semibold text-gray-800">Marco del Rack</h5>
                    </div>
                    <div class="space-y-1">
                      <div class="flex justify-between text-xs">
                        <span class="text-gray-600">Altura:</span>
                        <span class="font-medium text-gray-900">{{ rackDimensions.height }}mm</span>
                      </div>
                      <div class="flex justify-between text-xs">
                        <span class="text-gray-600">Largo:</span>
                        <span class="font-medium text-gray-900">{{ rackDimensions.width }}mm</span>
                      </div>
                      <div class="flex justify-between text-xs">
                        <span class="text-gray-600">Ancho:</span>
                        <span class="font-medium text-gray-900">{{ rackDimensions.depth }}mm</span>
                      </div>
                    </div>
                  </div>

                  <!-- Beam Dimensions -->
                  <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div class="flex items-center mb-2">
                      <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16M4 12l4-4m-4 4l4 4m8-8l4 4m-4-4l4-4"></path>
                      </svg>
                      <h5 class="text-sm font-semibold text-gray-800">Viga</h5>
                    </div>
                    <div class="space-y-1">
                      <div class="flex justify-between text-xs">
                        <span class="text-gray-600">Largo de viga:</span>
                        <span class="font-medium text-gray-900">{{ beamDimensions.length }}mm</span>
                      </div>
                    </div>
                  </div>

                  <!-- Pallet Positions -->
                  <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div class="flex items-center mb-2">
                      <svg class="w-4 h-4 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                      </svg>
                      <h5 class="text-sm font-semibold text-gray-800">Posiciones</h5>
                    </div>
                    <div class="space-y-1">
                      <div class="flex justify-between text-xs">
                        <span class="text-gray-600">Por nivel:</span>
                        <span class="font-medium text-gray-900">{{ palletPositions.perLevel }}</span>
                      </div>
                      <div class="flex justify-between text-xs">
                        <span class="text-gray-600">En piso:</span>
                        <span class="font-medium text-gray-900">{{ palletPositions.onFloor }}</span>
                      </div>
                      <div class="flex justify-between text-xs pt-1 border-t border-gray-200">
                        <span class="text-gray-600 font-medium">Total:</span>
                        <span class="font-bold text-gray-900">{{ palletPositions.total }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Add to Quote Button -->
                <button
                  @click="addToCart"
                  class="w-full px-6 py-3 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                  :class="{
                    'bg-orange-500 text-white hover:bg-orange-600': isConfigurationComplete,
                    'bg-gray-200 text-gray-400 cursor-not-allowed': !isConfigurationComplete
                  }"
                  :disabled="!isConfigurationComplete || isAddingToCart"
                >
                  <span v-if="!isAddingToCart && !showSuccessOverlay" class="flex items-center justify-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Añadir a cotización
                  </span>
                  <span v-else-if="isAddingToCart" class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Añadiendo...
                  </span>
                  <span v-else-if="showSuccessOverlay" class="flex items-center justify-center">
                    <svg class="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    ¡Añadido!
                  </span>
                </button>
                <p v-if="!isConfigurationComplete" class="text-xs text-center text-gray-500 -mt-2">
                  Completa todos los campos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification for Added to Cart -->
    <Teleport to="body">
      <transition name="toast">
        <div
          v-if="showCartNotification"
          class="fixed top-4 right-4 bg-white rounded-xl shadow-xl p-4 flex items-center z-50 max-w-md border border-gray-100"
        >
          <div class="bg-green-100 rounded-lg p-2 mr-4 flex-shrink-0">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-800 truncate">Producto añadido a la cotización</p>
            <p class="text-sm text-gray-600 truncate">{{ lastAddedProduct }}</p>
          </div>
          <button @click="showCartNotification = false" class="text-gray-400 hover:text-gray-600 ml-4">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, onBeforeUnmount, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '~/stores/cartStore'
import AnguloRanuradoPanel from '~/components/QuoteModal/AnguloRanuradoPanel.vue'
import RackSelectivoPanel from '~/components/QuoteModal/RackSelectivoPanel.vue'
import type { ProductType, ProductConfig, AnguloRanuradoConfig, RackSelectivoConfig } from '~/components/QuoteModal/ProductConfig'
import axios from 'axios'



const isAddingToCart = ref(false)
const showSuccessOverlay = ref(false)
const showCartNotification = ref(false)
const lastAddedProduct = ref('')
let notificationTimeout: number | null = null

const props = defineProps<{ isVisible: boolean; title?: string }>()
const emit = defineEmits(['close'])
const selectedProduct = ref<ProductType | ''>('')
const config = ref<ProductConfig>(getDefaultConfig('AR'))
const model = ref('')
const loading = ref(false)

const token = 'eaaffe4a07a4587dc4fc7be6a145e65f'
const user = 'racklog.cl'

const router = useRouter()
const cartStore = useCartStore()

function closeModal() {
  emit('close')
}

function goToCart() {
  router.push('/carrito')
  closeModal()
}

const isConfigurationComplete = computed(() => {
  if (!selectedProduct.value) return false

  const common = config.value.tipo && config.value.niveles && config.value.cuerpos

  if (selectedProduct.value === 'AR') {
    const c = config.value as AnguloRanuradoConfig
    return common && c.pintado && c.carga && c.bandeja
  }
  if (selectedProduct.value === 'RS') {
    const c = config.value as RackSelectivoConfig
    return common && c.frentePallet && c.fondoPallet && c.altoPallet && c.carga && c.palletsPerBeam
  }
  return false
})

function getDefaultConfig(type: ProductType): ProductConfig {
  if (type === 'AR') {
    return {
      tipo: 'simple',
      niveles: 2,
      cuerpos: 1,
      pintado: 'galvanizado',
      carga: '90kg',
      bandeja: '300mm'
    }
  } else {
    return {
      tipo: 'simple',
      niveles: 2,
      cuerpos: 1,
      frentePallet: '1000mm',
      fondoPallet: '1000mm',
      altoPallet: '1000mm',
      carga: '500kg',
      palletsPerBeam: 2
    }
  }
}

function selectProduct(type: ProductType) {
  selectedProduct.value = type
  config.value = getDefaultConfig(type)
  model.value = ''
}

function productButtonClass(type: ProductType) {
  return [
    'rounded-lg border px-3 py-3 transition-all text-center flex flex-col items-center justify-center hover:shadow-md transform hover:-translate-y-0.5',
    selectedProduct.value === type 
      ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-md ring-2 ring-orange-200' 
      : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
  ]
}

// Mapeo de identificadores de producto a nombres legibles
const productNameMap = {
  'AR': 'Ángulo Ranurado',
  'RS': 'Rack Selectivo',
};


const productCode = computed(() => {
  if (!selectedProduct.value) return ''
  const tipoCode = config.value.tipo === 'doble' ? '2' : ''
  const cuerposCode = `${config.value.cuerpos}M`
  const nivelesCode = `${config.value.niveles}E`
  return `${selectedProduct.value}${tipoCode}_${cuerposCode}_${nivelesCode}`
})

const summaryText = computed(() => {
  if (!selectedProduct.value) return ['Seleccione un producto'];
  
  // Crear un array de características para mostrar como listado
  const features = [];

  
  // Características comunes
  features.push(`Tipo: ${config.value.tipo === 'simple' ? 'Simple' : 'Doble'}`);
  features.push(`Niveles: ${config.value.niveles}`);
  features.push(`Cuerpos: ${config.value.cuerpos}`);
  
  // Características específicas por tipo de producto
  if (selectedProduct.value === 'AR') {
    const c = config.value as AnguloRanuradoConfig;
    if (c.carga) features.push(`Carga: ${c.carga}`);
    if (c.pintado) features.push(`Acabado: ${c.pintado}`);
    if (c.bandeja) features.push(`Bandeja: ${c.bandeja}`);
  } else if (selectedProduct.value === 'RS') {
    const c = config.value as RackSelectivoConfig;
    if (c.frentePallet) features.push(`Frente: ${c.frentePallet}`);
    if (c.fondoPallet) features.push(`Fondo: ${c.fondoPallet}`);
    if (c.altoPallet) features.push(`Alto: ${c.altoPallet}`);
    if (c.carga) features.push(`Carga: ${c.carga}`);
    if (c.palletsPerBeam) features.push(`Pallets/nivel: ${c.palletsPerBeam}`);
  }
  
  return features;
});

// Computed properties for dimensions calculations
const rackDimensions = computed(() => {
  if (!selectedProduct.value) return { height: 0, width: 0, depth: 0 };
  
  // Base calculations
  const basePillarSection = selectedProduct.value === 'AR' ? 40 : 80; // mm
  
  let height = 0;
  let width = 0;
  let depth = 0;
  
  if (selectedProduct.value === 'AR') {
    const c = config.value as AnguloRanuradoConfig;
    const bandejaWidth = parseInt(c.bandeja?.replace('mm', '') || '300');
    
    // Height for AR (simplified calculation)
    height = (2000 * config.value.niveles) + 200;
    
    width = (bandejaWidth * config.value.cuerpos) + (basePillarSection * 2);
    
    // For depth: if doble, it's two structures front and back
    if (config.value.tipo === 'doble') {
      depth = (bandejaWidth * 2) + (basePillarSection * 3); // Two depths + middle pillar
    } else {
      depth = bandejaWidth + (basePillarSection * 2);
    }
  } else if (selectedProduct.value === 'RS') {
    const c = config.value as RackSelectivoConfig;
    const frentePallet = parseInt(c.frentePallet?.replace('mm', '') || '1000');
    const fondoPallet = parseInt(c.fondoPallet?.replace('mm', '') || '1000');
    const altoPallet = parseInt(c.altoPallet?.replace('mm', '') || '1000');
    
    // Altura del marco: (Altura del pallet + 200 mm) × Niveles totales
    // Niveles totales = niveles de viga + 1 (nivel a piso)
    const nivelesViga = config.value.niveles;
    const nivelesTotal = nivelesViga + 1; // + 1 for floor level
    const heightRaw = (altoPallet + 200) * nivelesTotal;
    
    // Round up to nearest 500mm for structural standards
    height = Math.ceil(heightRaw / 500) * 500;
    
    // Add extra clearance for very tall configurations
    if (height >= 8000) {
      height = Math.ceil((heightRaw + 300) / 500) * 500;
    }
    
    // Largo de la viga based on frente pallet and pallets per beam
    const rsConfigTyped = config.value as RackSelectivoConfig;
    const palletsPerBeam = rsConfigTyped.palletsPerBeam || 2;
    // Fórmula: Para 2 pallets: (2 × frente) + 300
    //          Para 3 pallets: (3 × frente) + 400
    const beamLength = palletsPerBeam === 3 
      ? (3 * frentePallet) + 400 
      : (2 * frentePallet) + 300;
    
    // Largo total del rack: (Cantidad de módulos × largo de viga) + ((Cantidad de módulos + 1) × 100 mm)
    width = (config.value.cuerpos * beamLength) + ((config.value.cuerpos + 1) * 100);
    
    // Fondo del marco: (fondo pallet - 200) + 300
    const frameDepth = (fondoPallet - 200) + 300;
    
    // For depth: if doble, it's two structures front and back
    if (config.value.tipo === 'doble') {
      depth = (frameDepth * 2) + (basePillarSection * 1); // Two depths + middle pillar
    } else {
      depth = frameDepth;
    }
  }
  
  return { height, width, depth };
});



const beamDimensions = computed(() => {
  if (!selectedProduct.value) return { length: 0, section: '' };
  
  let length = 0;
  let section = '';
  
  if (selectedProduct.value === 'AR') {
    const c = config.value as AnguloRanuradoConfig;
    const bandejaWidth = parseInt(c.bandeja?.replace('mm', '') || '300');
    length = bandejaWidth;
    section = '30x40mm';
  } else if (selectedProduct.value === 'RS') {
    const c = config.value as RackSelectivoConfig;
    const frentePallet = parseInt(c.frentePallet?.replace('mm', '') || '1000');
    const palletsPerBeam = c.palletsPerBeam || 2;
    
    // Largo de la viga based on frente pallet and pallets per beam
    // Fórmula base: (palletsPerBeam × frente) + márgenes
    // Para 2 pallets: (2 × frente) + 300
    // Para 3 pallets: (3 × frente) + 400 (100mm entre cada + 100mm en extremos)
    if (palletsPerBeam === 3) {
      length = (3 * frentePallet) + 400;
    } else {
      length = (2 * frentePallet) + 300;
    }
    
    section = '80x60mm';
  }
  
  return { length, section };
});

const palletPositions = computed(() => {
  // Only calculate pallet positions for Rack Selectivo
  if (!selectedProduct.value || selectedProduct.value !== 'RS') {
    return { perLevel: 0, onFloor: 0, total: 0 };
  }
  
  const c = config.value as RackSelectivoConfig;
  
  // Posiciones de pallet: N° módulos × niveles totales × pallets por viga × profundidad
  // Niveles totales = niveles de viga + 1 (nivel a piso)
  const nivelesViga = config.value.niveles;
  const nivelesTotal = nivelesViga + 1; // + 1 for floor level
  const modulos = config.value.cuerpos;
  const palletsPerBeam = c.palletsPerBeam || 2; // Get from config (2 or 3)
  
  // Profundidad: 1 if simple, 2 if doble (front and back)
  const profundidad = config.value.tipo === 'doble' ? 2 : 1;
  
  // Total calculation: módulos × niveles totales × pallets por viga × profundidad
  const total = modulos * nivelesTotal * palletsPerBeam * profundidad;
  
  // Per level (excluding floor): módulos × pallets por viga × profundidad
  const perLevel = modulos * palletsPerBeam * profundidad;
  
  // On floor level: same as per level
  const onFloor = perLevel;
  
  return { perLevel, onFloor, total };
});

const modelNotFound = ref(false)

async function fetchModelUUID(modelo: string) {
  try {
    loading.value = true
    modelNotFound.value = false
    const response = await axios.get('https://api.sketchfab.com/v3/search', {
      headers: { Authorization: `Token ${token}` },
      params: { type: 'models', q: modelo, user }
    })
    const uuid = response.data.results[0]?.uid
    if (uuid) {
      model.value = `https://sketchfab.com/models/${uuid}/embed?ui_theme=dark`
      modelNotFound.value = false
    } else {
      model.value = ''
      modelNotFound.value = true
    }
  } catch (e) {
    model.value = ''
    modelNotFound.value = true
    console.error('Error fetching model UUID:', e)
  } finally {
    loading.value = false
  }
}

watch(productCode, (code) => {
  if (code) fetchModelUUID(code)
})

// Control de scroll del body
watch(() => props.isVisible, (visible) => {
  if (visible) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
});

onMounted(() => {
  if (props.isVisible) {
    document.body.classList.add('modal-open');
  }
});

onBeforeUnmount(() => {
  document.body.classList.remove('modal-open');
});

async function addToCart() {
  if (!selectedProduct.value || !isConfigurationComplete.value) return

  // GTM event: funnel step - product added to quote
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'add_to_cart',
    event_category: 'Funnel',
    event_label: 'Quote Product Added',
    funnel_step: 'quote_product_added',
    product: selectedProduct.value,
    config: { ...config.value },
    currency: 'CLP',
    value: 0
  });
  console.log('[GTM] Quote product add to cart event sent to dataLayer');

  isAddingToCart.value = true

  const productName = selectedProduct.value === 'AR' ? 'Ángulo Ranurado' : 'Rack Selectivo'
  const configDescription = summaryText.value

  cartStore.addToCart({
    name: productName,
    config: { ...config.value },
    price: 0,
    quoteOnly: true,
    quantity: 1
  })

  lastAddedProduct.value = `${productName} - ${configDescription}`
  showCartNotification.value = true
  showSuccessOverlay.value = true

  if (notificationTimeout) clearTimeout(notificationTimeout)
  notificationTimeout = window.setTimeout(() => {
    showCartNotification.value = false
  }, 5000)

  setTimeout(() => {
    showSuccessOverlay.value = false
    isAddingToCart.value = false
  }, 1500)
}
</script>

<style scoped>
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-leave-to, .toast-enter-from {
  transform: translateY(-20px) translateX(20px);
  opacity: 0;
}

/* Prevenir scroll en el body cuando el modal está abierto */
:deep(body.modal-open) {
  overflow: hidden;
}
</style>
