<template>
  <div v-if="product" class="bg-white">
    <!-- Ficha principal -->
    <section class="pb-16 sm:pb-20">
      <div class="container-page">
        <div class="pt-4 sm:pt-6">
          <Breadcrumbs :breadcrumbs="[{label: product.name}]" />
        </div>

        <div class="mt-4 grid grid-cols-1 items-start gap-10 lg:mt-8 lg:grid-cols-2 lg:gap-14">
          <!-- Visor 3D / imagen -->
          <div class="lg:sticky lg:top-24">
            <div class="card relative aspect-[4/3] bg-neutral-100">
              <iframe v-if="product.model"
                title="Modelo_RS_Ejemplo" 
                class="absolute inset-0 h-full w-full"
                frameborder="0" 
                allowfullscreen 
                mozallowfullscreen="true" 
                webkitallowfullscreen="true" 
                allow="autoplay; fullscreen; xr-spatial-tracking" 
                xr-spatial-tracking 
                execution-while-out-of-viewport 
                execution-while-not-rendered 
                web-share :src="product.model">
              </iframe>
              <img v-else :src="product.images.card" :alt="product.name" width="800" height="600" loading="eager" fetchpriority="high" class="absolute inset-0 h-full w-full object-cover object-center">
            </div>

            <!-- Indicador de elemento interactivo -->
            <p v-if="product.model" class="mt-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-600">
              <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              Modelo 3D Interactivo
            </p>
          </div>

          <!-- Informacion del producto -->
          <div>
            <p class="eyebrow">Tipo de carga: {{ product.attributes.loadType }}</p>
            <h1 class="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">{{ product.name }}</h1>

            <p class="mt-5 text-base leading-relaxed text-neutral-600 sm:text-lg">{{ product.description.long }}</p>

            <div v-if="product.perks && product.perks.length > 0" class="mt-8">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-900">Características principales</h2>
              <ul class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <li v-for="(perk, index) in product.perks" :key="index" class="flex items-start gap-3 text-neutral-700">
                  <span class="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-600/15" aria-hidden="true">
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </span>
                  <span>{{ perk }}</span>
                </li>
              </ul>
            </div>

            <div class="mt-10 border-t border-neutral-200 pt-8">
              <!-- Producto configurable: Rack Selectivo y Angulo Ranurado -->
              <button 
                v-if="isConfigurableProduct" 
                type="button"
                @click="openQuoteModal(product)" 
                class="btn btn-primary btn-lg w-full sm:w-auto"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                Cotiza tu {{ product.name }}
              </button>
              
              <!-- Productos no configurables: se agregan directo a la cotizacion -->
              <button 
                v-else 
                type="button"
                @click="addToCart(product)" 
                class="btn btn-primary btn-lg w-full sm:w-auto"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                Añadir a mi Cotización
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Galeria -->
    <section v-if="product.images && product.images.gallery && product.images.gallery.length" class="section section-muted">
      <div class="container-page">
        <div class="section-header">
          <span class="eyebrow">Galería de imágenes</span>
          <h2 class="section-title">Galería del Producto</h2>
          <p class="section-lead">Explora imágenes reales y renders del producto en diferentes aplicaciones y ambientes.</p>
        </div>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="(img, idx) in product.images.gallery" :key="idx" class="card group">
            <div class="card-media">
              <img loading="lazy" decoding="async" :src="img" :alt="`Imagen ${idx + 1} de ${product.name}`" width="800" height="600">
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Especificaciones tecnicas -->
    <section v-if="product.technicalSpecs && product.technicalSpecs.length > 0" class="section">
      <div class="container-page">
        <div class="section-header">
          <span class="eyebrow">Detalles técnicos</span>
          <h2 class="section-title">Especificaciones Técnicas</h2>
          <p class="section-lead">Conoce todos los detalles técnicos que hacen de este producto la solución ideal para tu negocio.</p>
        </div>
        
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div v-for="(spec, index) in product.technicalSpecs" :key="index" class="card flex flex-col">
            <div class="flex h-52 items-center justify-center border-b border-neutral-100 bg-neutral-50 p-6">
              <img loading="lazy" decoding="async" class="h-40 w-auto max-w-full object-contain" :src="spec.image" :alt="spec.title || spec.name || ''" width="320" height="240">
            </div>
            <div class="card-body flex flex-1 flex-col">
              <h3 class="card-title">{{ spec.title || spec.name }}</h3>
              <p class="card-text !text-base">{{ spec.description }}</p>
              <ul v-if="spec.perks && spec.perks.length" class="mt-5 space-y-2 border-t border-neutral-100 pt-5">
                <li v-for="(perk, pIndex) in spec.perks" :key="pIndex" class="flex items-start gap-2.5 text-sm text-neutral-700">
                  <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>{{ perk }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mas informacion -->
    <section v-if="product.infoCards && product.infoCards.length > 0" class="section section-muted">
      <div class="container-page">
        <div class="section-header">
          <span class="eyebrow">Información adicional</span>
          <h2 class="section-title">Más Información</h2>
          <p class="section-lead">Descubre más datos relevantes sobre nuestro producto y cómo puede adaptarse a tus necesidades.</p>
        </div>
        
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div v-for="(infoCard, index) in product.infoCards" :key="index" class="card card-body sm:!p-8">
            <div class="flex items-center gap-4">
              <span class="icon-tile" aria-hidden="true">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </span>
              <h3 class="text-xl font-semibold tracking-tight text-neutral-900">{{ infoCard.title }}</h3>
            </div>
            <p class="mt-4 leading-relaxed text-neutral-600">{{ infoCard.description }}</p>
            <ul v-if="infoCard.perks && infoCard.perks.length" class="mt-5 space-y-2">
              <li v-for="(perk, pIndex) in infoCard.perks" :key="pIndex" class="flex items-start gap-2.5 text-neutral-700">
                <svg class="mt-1 h-4 w-4 flex-shrink-0 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>{{ perk }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <transition name="toast">
      <div 
        v-if="showCartNotification" 
        class="fixed z-50 toast-notification"
      >
        <div class="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-black/5 sm:p-4">
          <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700" aria-hidden="true">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-neutral-900 sm:text-base">Producto añadido a la cotización</p>
            <p class="truncate text-xs text-neutral-600 sm:text-sm">{{ lastAddedProduct }}</p>
          </div>
          <div class="flex flex-shrink-0 items-center gap-1">
            <button type="button" @click="goToCart" class="btn btn-primary btn-sm whitespace-nowrap">
              Ver cotización
            </button>
            <button type="button" aria-label="Cerrar aviso" @click="closeNotification" class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- Quote Modal & Contact Modal -->
    <QuoteModal 
      v-if="isQuoteModalVisible" 
      :isVisible="isQuoteModalVisible" 
      :title="modalTitle" 
      :initialProduct="selectedProduct"
      @close="closeModal('quote')"
    />
    <ContactModal :isVisible="isContactModalVisible" :title="modalTitle" @close="closeModal('contact')" />
  </div>
  
  <!-- Not Found State -->
  <div v-else class="flex min-h-[60vh] flex-col items-center justify-center bg-neutral-50 px-6 py-24 text-center">
    <span class="icon-tile" aria-hidden="true">
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </span>
    <h2 class="mt-6 text-2xl font-bold text-neutral-900">Producto no encontrado</h2>
    <p class="mt-2 text-neutral-600">Lo sentimos, no podemos encontrar el producto que estás buscando.</p>
    <NuxtLink to="/" class="btn btn-primary mt-8">
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
      Volver al inicio
    </NuxtLink>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useProductStore } from '~/stores/productStore';
  import { useCartStore } from '~/stores/cartStore';
  import QuoteModal from '~/components/QuoteModal/QuoteModal.vue';
  import ContactModal from '~/components/ContactModal.vue';

  const productStore = useProductStore();
  const cartStore = useCartStore();
  const route = useRoute();
  const router = useRouter();

  const product = ref(null);
  const isQuoteModalVisible = ref(false);
  const isContactModalVisible = ref(false);
  const modalTitle = ref('');
  const selectedProduct = ref('');

  // Cart notification state
  const showCartNotification = ref(false);
  const lastAddedProduct = ref('');
  let notificationTimeout = null;

  // Check if the product is one of the configurable ones (Rack Selectivo or Ángulo Ranurado)
  const isConfigurableProduct = computed(() => {
    if (!product.value) return false;
    return product.value.name === 'Rack Selectivo' || product.value.name === 'Ángulo Ranurado';
  });

  // Buscar el producto durante el render para que el HTML generado tenga el contenido
  product.value = Object.values(productStore.products).find(p => p.slug === route.params.slug) ?? null;
  if (!product.value) {
    throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado', fatal: true });
  }

  function openQuoteModal(product) {
    selectedProduct.value = product.name === 'Rack Selectivo' ? 'RS' : 'AR';
    modalTitle.value = `Configurador de ${product.name}`;
    isQuoteModalVisible.value = true;
  }

  function openContactModal() {
    modalTitle.value = 'Solicitar Cotización';
    isContactModalVisible.value = true;
  }

  function closeModal(modal) {
    if (modal === 'contact') {
      isContactModalVisible.value = false;
    } else {
      isQuoteModalVisible.value = false;
      selectedProduct.value = '';
    }
  }

  // Function to add non-configurable products directly to cart
  function addToCart(product) {
    // Create a simplified item for quotation-only products
    const cartItem = {
      name: product.name,
      price: 0, // Price will be determined by sales
      quantity: 1,
      config: {}, // Flag to identify it's not configurable
      quoteOnly: true,
      image: product.images?.card || product.images?.render || '',
      description: product.description?.short || ''
    };
    
    cartStore.addToCart(cartItem);
    
    // Set notification data and show it
    lastAddedProduct.value = product.name;
    showCartNotification.value = true;
    
    // Clear any existing timeout
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }
    
    // Auto-hide the notification after 5 seconds
    notificationTimeout = setTimeout(() => {
      showCartNotification.value = false;
    }, 5000);
  }

  // Navigate to cart page
  function goToCart() {
    closeNotification();
    router.push('/carrito');
  }

  // Close the notification
  function closeNotification() {
    showCartNotification.value = false;
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }
  }

usePageSeo({
  title: product.value.name,
  description: product.value.description?.short || `${product.value.name} de Racklog: fabricación e instalación en Chile.`,
  type: 'product',
});

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.value.name,
      description: product.value.description?.short,
      image: product.value.images?.card ? `https://racklog.cl${product.value.images.card}` : undefined,
      brand: { '@type': 'Brand', name: 'Racklog' },
      category: product.value.type,
    }),
  }],
});
</script>

<style scoped>
/* Toast animation */
.toast-enter-active, 
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Toast notification responsive styles */
.toast-notification {
  top: 1rem;
  right: 1rem;
  left: 1rem;
  max-width: 100%;
  width: auto;
}

@media (min-width: 640px) {
  .toast-notification {
    left: auto;
    max-width: 440px;
    width: auto;
  }
}
</style>
