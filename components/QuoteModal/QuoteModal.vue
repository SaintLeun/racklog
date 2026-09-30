<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/60 backdrop-blur-sm">
    <!-- Contenedor exterior: clic fuera del dialogo lo cierra -->
    <div class="flex min-h-full items-end justify-center sm:items-center sm:p-4 lg:p-6" @click.self="closeModal">
      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`${uid}-title`"
        tabindex="-1"
        class="relative flex max-h-[100dvh] w-full max-w-7xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
      >
        <!-- Encabezado -->
        <div class="flex flex-shrink-0 items-center justify-between gap-3 border-b border-neutral-100 bg-gradient-to-b from-brand-50 to-white px-5 py-4 sm:px-8 sm:py-5">
          <div class="flex min-w-0 items-center gap-4">
            <span class="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/25 sm:inline-flex" aria-hidden="true">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </span>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">Personalizable</p>
              <h2 :id="`${uid}-title`" class="mt-0.5 text-lg font-bold leading-tight tracking-tight text-neutral-900 sm:text-2xl">
                {{ title || 'Configurador de Producto' }}
              </h2>
            </div>
          </div>
          <div class="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              @click="goToCart"
              class="btn btn-secondary !px-4 text-sm"
            >
              <svg class="h-5 w-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span class="hidden sm:inline">Mi Cotización</span>
              <span class="sm:hidden">Cotización</span>
            </button>
            <button type="button" aria-label="Cerrar configurador" @click="closeModal" class="inline-flex h-11 w-11 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Contenido con scroll -->
        <div class="flex-1 overflow-y-auto bg-neutral-50 p-4 sm:p-6 lg:p-8">
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
            <div class="space-y-6">
              <!-- Seleccion de producto -->
              <div class="card p-5">
                <h3 class="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Selecciona tu Producto
                </h3>
                <div class="mt-4 grid grid-cols-2 gap-3">
                  <button type="button" :aria-pressed="selectedProduct === 'AR'" @click="selectProduct('AR')" :class="productButtonClass('AR')">
                    <img loading="lazy" decoding="async" src="/assets/images/anra_body.webp" alt="" width="650" height="700" class="mx-auto h-16 w-auto sm:h-20" />
                    <span class="mt-2 block text-center text-sm font-semibold">Ángulo Ranurado</span>
                  </button>
                  <button type="button" :aria-pressed="selectedProduct === 'RS'" @click="selectProduct('RS')" :class="productButtonClass('RS')">
                    <img loading="lazy" decoding="async" src="/assets/images/rack_selectivo.webp" alt="" width="650" height="700" class="mx-auto h-16 w-auto sm:h-20" />
                    <span class="mt-2 block text-center text-sm font-semibold">Rack Selectivo</span>
                  </button>
                </div>
              </div>

              <!-- Panel de configuracion -->
              <div class="card">
                <div class="border-b border-neutral-100 px-5 py-4">
                  <h3 class="text-base font-semibold text-neutral-900">Configuración</h3>
                </div>
                <div class="p-5">
                  <AnguloRanuradoPanel
                    v-if="selectedProduct === 'AR'"
                    v-model="config as AnguloRanuradoConfig"
                  />
                  <RackSelectivoPanel
                    v-else-if="selectedProduct === 'RS'"
                    v-model="config as RackSelectivoConfig"
                  />
                  <div v-else class="flex flex-col items-center py-8 text-center">
                    <span class="icon-tile" aria-hidden="true">
                      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                    </span>
                    <p class="mt-3 text-sm text-neutral-600">Selecciona un producto para configurar</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="min-w-0 space-y-6">
              <!-- Visor 3D -->
              <div class="card">
                <div class="flex items-center gap-2 border-b border-neutral-100 px-5 py-4">
                  <svg class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                  <h3 class="text-base font-semibold text-neutral-900">Vista Previa 3D</h3>
                </div>
                <div class="relative flex h-[300px] items-center justify-center bg-neutral-100 sm:h-[400px] lg:h-[460px]">
                  <!-- Modelo no encontrado -->
                  <div v-if="modelNotFound && !loading" class="max-w-sm px-6 text-center">
                    <svg class="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="mt-3 font-semibold text-neutral-800">Modelo 3D no disponible</p>
                    <p class="mt-1 text-sm text-neutral-600">
                      No pudimos cargar el modelo 3D para esta configuración. Los detalles técnicos están disponibles a continuación.
                    </p>
                  </div>
                  
                  <!-- Estado inicial -->
                  <div v-else-if="!model && !loading" class="px-6 text-center">
                    <svg class="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    <p class="mt-3 font-semibold text-neutral-800">Configura tu producto</p>
                    <p class="mt-1 text-sm text-neutral-600">El modelo 3D aparecerá aquí</p>
                  </div>
                  
                  <!-- Modelo cargado -->
                  <iframe v-else-if="model && !loading" class="h-full w-full" :src="model" frameborder="0" allowfullscreen></iframe>

                  <!-- Cargando -->
                  <div v-if="loading" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm" role="status" aria-live="polite">
                    <svg class="h-10 w-10 animate-spin text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p class="mt-3 font-semibold text-neutral-800">Cargando modelo 3D...</p>
                    <p class="mt-1 text-sm text-neutral-600">Por favor espera</p>
                  </div>
                </div>
              </div>

              <!-- Resumen de configuracion y especificaciones -->
              <div v-if="selectedProduct && isConfigurationComplete" class="space-y-4">
                <!-- Resumen del producto -->
                <div class="card p-5">
                  <div class="flex flex-wrap items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <span class="icon-tile !h-11 !w-11" aria-hidden="true">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                      </span>
                      <div>
                        <h4 class="font-semibold text-neutral-900">
                          {{ selectedProduct === 'AR' ? 'Ángulo Ranurado' : 'Rack Selectivo' }}
                        </h4>
                        <p class="text-sm text-neutral-600">{{ config.tipo === 'simple' ? 'Simple' : 'Doble' }} • {{ config.cuerpos }} {{ config.cuerpos === 1 ? 'módulo' : 'módulos' }} • {{ config.niveles }} {{ config.niveles === 1 ? 'nivel' : 'niveles' }}</p>
                      </div>
                    </div>
                    <div class="rounded-lg bg-neutral-100 px-3 py-1.5 text-right">
                      <p class="text-[0.6875rem] font-semibold uppercase tracking-wider text-neutral-600">Código</p>
                      <p class="font-mono text-sm font-bold text-neutral-900">{{ productCode }}</p>
                    </div>
                  </div>
                  <dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-neutral-100 pt-4 text-sm sm:grid-cols-2">
                    <div class="flex justify-between gap-2">
                      <dt class="text-neutral-600">Capacidad</dt>
                      <dd class="font-semibold text-neutral-900">{{ config.carga }}</dd>
                    </div>
                    <div v-if="selectedProduct === 'RS'" class="flex justify-between gap-2">
                      <dt class="text-neutral-600">Frente pallet</dt>
                      <dd class="font-semibold text-neutral-900">{{ (config as RackSelectivoConfig).frentePallet }}</dd>
                    </div>
                    <div v-if="selectedProduct === 'RS'" class="flex justify-between gap-2">
                      <dt class="text-neutral-600">Fondo pallet</dt>
                      <dd class="font-semibold text-neutral-900">{{ (config as RackSelectivoConfig).fondoPallet }}</dd>
                    </div>
                    <div v-if="selectedProduct === 'RS'" class="flex justify-between gap-2">
                      <dt class="text-neutral-600">Alto pallet</dt>
                      <dd class="font-semibold text-neutral-900">{{ (config as RackSelectivoConfig).altoPallet }}</dd>
                    </div>
                    <div v-if="selectedProduct === 'AR'" class="flex justify-between gap-2">
                      <dt class="text-neutral-600">Bandeja</dt>
                      <dd class="font-semibold text-neutral-900">{{ (config as AnguloRanuradoConfig).bandeja }}</dd>
                    </div>
                    <div v-if="selectedProduct === 'AR'" class="flex justify-between gap-2">
                      <dt class="text-neutral-600">Acabado</dt>
                      <dd class="font-semibold text-neutral-900">{{ (config as AnguloRanuradoConfig).pintado === 'galvanizado' ? 'Galvanizado' : 'Pintado' }}</dd>
                    </div>
                  </dl>
                </div>

                <!-- Dimensiones tecnicas: solo Rack Selectivo -->
                <div v-if="selectedProduct === 'RS'" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div class="card p-4">
                    <h5 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
                      <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4a1 1 0 011-1h4m12 0h-4a1 1 0 011 1v4m0 8v4a1 1 0 01-1 1h-4m-12 0h4a1 1 0 01-1-1v-4"></path>
                      </svg>
                      Marco del Rack
                    </h5>
                    <dl class="mt-3 space-y-1.5 text-sm">
                      <div class="flex justify-between gap-2">
                        <dt class="text-neutral-600">Altura</dt>
                        <dd class="font-semibold tabular-nums text-neutral-900">{{ rackDimensions.height }}mm</dd>
                      </div>
                      <div class="flex justify-between gap-2">
                        <dt class="text-neutral-600">Largo</dt>
                        <dd class="font-semibold tabular-nums text-neutral-900">{{ rackDimensions.width }}mm</dd>
                      </div>
                      <div class="flex justify-between gap-2">
                        <dt class="text-neutral-600">Ancho</dt>
                        <dd class="font-semibold tabular-nums text-neutral-900">{{ rackDimensions.depth }}mm</dd>
                      </div>
                    </dl>
                  </div>

                  <div class="card p-4">
                    <h5 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
                      <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16M4 12l4-4m-4 4l4 4m8-8l4 4m-4-4l4-4"></path>
                      </svg>
                      Viga
                    </h5>
                    <dl class="mt-3 space-y-1.5 text-sm">
                      <div class="flex justify-between gap-2">
                        <dt class="text-neutral-600">Largo de viga</dt>
                        <dd class="font-semibold tabular-nums text-neutral-900">{{ beamDimensions.length }}mm</dd>
                      </div>
                    </dl>
                  </div>

                  <div class="card p-4">
                    <h5 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
                      <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                      </svg>
                      Posiciones
                    </h5>
                    <dl class="mt-3 space-y-1.5 text-sm">
                      <div class="flex justify-between gap-2">
                        <dt class="text-neutral-600">Por nivel</dt>
                        <dd class="font-semibold tabular-nums text-neutral-900">{{ palletPositions.perLevel }}</dd>
                      </div>
                      <div class="flex justify-between gap-2">
                        <dt class="text-neutral-600">En piso</dt>
                        <dd class="font-semibold tabular-nums text-neutral-900">{{ palletPositions.onFloor }}</dd>
                      </div>
                      <div class="flex justify-between gap-2 border-t border-neutral-100 pt-1.5">
                        <dt class="font-semibold text-neutral-800">Total</dt>
                        <dd class="font-bold tabular-nums text-brand-700">{{ palletPositions.total }}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <!-- Añadir a cotizacion -->
                <button
                  type="button"
                  @click="addToCart"
                  class="btn btn-primary btn-lg w-full"
                  :disabled="!isConfigurationComplete || isAddingToCart"
                >
                  <span v-if="!isAddingToCart && !showSuccessOverlay" class="flex items-center justify-center gap-2">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Añadir a cotización
                  </span>
                  <span v-else-if="isAddingToCart" class="flex items-center justify-center gap-2">
                    <svg class="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Añadiendo...
                  </span>
                  <span v-else-if="showSuccessOverlay" class="flex items-center justify-center gap-2">
                    <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    ¡Añadido!
                  </span>
                </button>
                <p v-if="!isConfigurationComplete" class="text-center text-sm text-neutral-600">
                  Completa todos los campos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Aviso: producto agregado -->
    <Teleport to="body">
      <transition name="toast">
        <div
          v-if="showCartNotification"
          class="fixed left-4 right-4 top-4 z-[60] flex items-center gap-3 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5 sm:left-auto sm:max-w-md"
        >
          <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700" aria-hidden="true">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-neutral-900">Producto añadido a la cotización</p>
            <p class="truncate text-sm text-neutral-600">{{ lastAddedProduct }}</p>
          </div>
          <button type="button" aria-label="Cerrar aviso" @click="showCartNotification = false" class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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



const isAddingToCart = ref(false)
const showSuccessOverlay = ref(false)
const showCartNotification = ref(false)
const lastAddedProduct = ref('')
let notificationTimeout: number | null = null

const props = defineProps<{ isVisible: boolean; title?: string }>()
const emit = defineEmits(['close'])

const uid = useId()
const dialogRef = ref<HTMLElement | null>(null)
const selectedProduct = ref<ProductType | ''>('')
const config = ref<ProductConfig>(getDefaultConfig('AR'))
const model = ref('')
const loading = ref(false)

// Cuenta de Sketchfab con los modelos 3D publicos (la busqueda publica no requiere token)
const SKETCHFAB_USER = 'racklog.cl'

const router = useRouter()
const cartStore = useCartStore()

useModalA11y(computed(() => props.isVisible), dialogRef, () => closeModal())

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
    'flex flex-col items-center justify-center rounded-xl px-3 py-4 text-center transition-all duration-200',
    selectedProduct.value === type 
      ? 'bg-brand-50 text-brand-800 ring-2 ring-brand-600 shadow-sm' 
      : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:ring-neutral-300 hover:bg-neutral-50'
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
    const params = new URLSearchParams({ type: 'models', q: modelo, user: SKETCHFAB_USER })
    const response = await fetch(`https://api.sketchfab.com/v3/search?${params}`)
    if (!response.ok) throw new Error(`Sketchfab HTTP ${response.status}`)
    const data = await response.json()
    const uuid = data.results?.[0]?.uid
    if (uuid) {
      model.value = `https://sketchfab.com/models/${uuid}/embed?ui_theme=dark`
      modelNotFound.value = false
    } else {
      model.value = ''
      modelNotFound.value = true
    }
  } catch {
    model.value = ''
    modelNotFound.value = true
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
