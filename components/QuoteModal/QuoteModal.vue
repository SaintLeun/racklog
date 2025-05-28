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
            <div class="w-full lg:w-1/3">
              <div class="grid grid-cols-2 gap-3 mb-5">
                <button @click="selectProduct('AR')" :class="productButtonClass('AR')">
                  <img src="/assets/images/anra_body.png" class="h-16 sm:h-24 w-auto mx-auto" />
                  <span class="text-sm sm:text-base text-center">Ángulo Ranurado</span>
                </button>
                <button @click="selectProduct('RS')" :class="productButtonClass('RS')">
                  <img src="/assets/images/rack_selectivo.jpg" class="h-16 sm:h-24 w-auto mx-auto" />
                  <span class="text-sm sm:text-base text-center">Rack Selectivo</span>
                </button>
              </div>

              <AnguloRanuradoPanel
                v-if="selectedProduct === 'AR'"
                v-model="config as AnguloRanuradoConfig"
              />
              <RackSelectivoPanel
                v-else-if="selectedProduct === 'RS'"
                v-model="config as RackSelectivoConfig"
              />
            </div>

            <div class="w-full lg:w-2/3">
              <div class="relative h-[300px] sm:h-[400px] lg:h-[460px] bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl border border-gray-200 flex items-center justify-center">
                <span v-if="!model" class="text-center px-4">Selecciona una configuración para ver el modelo</span>
                <iframe v-else class="w-full h-full" :src="model" frameborder="0" allowfullscreen></iframe>

                <div v-if="loading" class="absolute inset-0 flex flex-col justify-center items-center bg-white/80 z-10">
                  <svg class="animate-spin h-8 w-8 text-orange-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p class="text-gray-600 font-medium">Cargando modelo 3D...</p>
                </div>
              </div>

              <!-- Botón Añadir a cotización -->
              <div class="mt-4 bg-white p-4 border rounded-xl shadow-sm">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 class="font-semibold text-gray-900">
                      {{ selectedProduct ? (selectedProduct === 'AR' ? 'Ángulo Ranurado' : 'Rack Selectivo') : 'Sin producto' }}
                    </h3>
                    <div class="text-sm text-gray-600 mt-1">
                      <ul v-if="summaryText.length > 0" class="grid grid-cols-2 gap-x-4 gap-y-1">
                        <li v-for="(feature, index) in summaryText" :key="index" 
                            class="flex items-center"
                            :class="{'col-span-2': index === 0}">
                          <svg v-if="index > 0" class="w-3 h-3 mr-1 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          <span v-if="index === 0" class="font-medium text-orange-600">{{ feature }}</span>
                          <span v-else>{{ feature }}</span>
                        </li>
                      </ul>
                      <p v-else>No hay configuración disponible</p>
                    </div>
                  </div>

                  <button
                    @click="addToCart"
                    class="relative px-6 py-2 rounded-lg font-semibold transition w-full sm:w-auto overflow-hidden border"
                    :class="{
                      'bg-orange-500 text-white hover:bg-orange-600': isConfigurationComplete,
                      'bg-gray-200 text-gray-500 cursor-not-allowed': !isConfigurationComplete
                    }"
                    :disabled="!isConfigurationComplete || isAddingToCart"
                  >
                    <span v-if="!isAddingToCart && !showSuccessOverlay">Añadir a cotización</span>
                    <span v-else-if="isAddingToCart" class="flex items-center justify-center">
                      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
                </div>
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
import { useNuxtApp } from '#app'



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
    return common && c.frentePallet && c.fondoPallet && c.altoPallet && c.carga
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
      carga: '500kg'
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
    'rounded-xl border px-4 py-2 transition text-center',
    selectedProduct.value === type ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-200 hover:border-orange-300'
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
  }
  
  return features;
});

async function fetchModelUUID(modelo: string) {
  try {
    loading.value = true
    const response = await axios.get('https://api.sketchfab.com/v3/search', {
      headers: { Authorization: `Token ${token}` },
      params: { type: 'models', q: modelo, user }
    })
    const uuid = response.data.results[0]?.uid
    if (uuid) {
      model.value = `https://sketchfab.com/models/${uuid}/embed?ui_theme=dark`
    } else {
      model.value = ''
    }
  } catch (e) {
    model.value = ''
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
  const nuxtApp = useNuxtApp();
  const $gtmEvent = nuxtApp.$gtmEvent || null;
  if ($gtmEvent) {
    $gtmEvent('add_to_cart', {
      event_category: 'Funnel',
      event_label: 'Quote Product Added',
      funnel_step: 'quote_product_added',
      product: selectedProduct.value,
      config: { ...config.value }
    });
  }

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
