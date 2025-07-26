<template>
  <div v-if="product" class="relative overflow-hidden">
    <!-- Abstract Geometric Background -->
    <div class="absolute inset-0 -z-10 overflow-hidden">
      <!-- Small square elements randomly placed -->
      <div class="absolute top-[12%] left-[18%] w-[15px] h-[15px] bg-orange-500 opacity-[0.2]"></div>
      <div class="absolute top-[25%] left-[45%] w-[20px] h-[20px] bg-gray-700 opacity-[0.2]"></div>
      <div class="absolute top-[38%] left-[75%] w-[12px] h-[12px] bg-orange-500 opacity-[0.2]"></div>
      <div class="absolute top-[50%] left-[25%] w-[18px] h-[18px] bg-gray-700 opacity-[0.2]"></div>
      <div class="absolute top-[65%] left-[60%] w-[16px] h-[16px] bg-orange-500 opacity-[0.2]"></div>
      <div class="absolute top-[80%] left-[30%] w-[22px] h-[22px] bg-gray-700 opacity-[0.2]"></div>
      
      <!-- Medium squares with light opacity -->
      <div class="absolute top-[15%] right-[25%] w-[40px] h-[40px] bg-gray-600 opacity-[0.2]"></div>
      <div class="absolute top-[55%] right-[12%] w-[35px] h-[35px] bg-orange-400 opacity-[0.2]"></div>
      <div class="absolute top-[75%] right-[40%] w-[30px] h-[30px] bg-gray-700 opacity-[0.2]"></div>
      
      <!-- Larger squares with even lighter opacity -->
      <div class="absolute top-[8%] left-[65%] w-[80px] h-[80px] border border-orange-500 opacity-[0.2]"></div>
      <div class="absolute top-[35%] left-[8%] w-[60px] h-[60px] border border-gray-700 opacity-[0.2]"></div>
      <div class="absolute top-[65%] left-[78%] w-[70px] h-[70px] border border-orange-400 opacity-[0.2]"></div>
      
      <!-- Geometric line accents -->
      <div class="absolute top-[20%] left-0 w-[100px] h-[2px] bg-gray-700 opacity-[0.2]"></div>
      <div class="absolute top-[40%] right-0 w-[120px] h-[2px] bg-orange-500 opacity-[0.2]"></div>
      <div class="absolute top-[70%] left-[30%] w-[150px] h-[2px] bg-gray-600 opacity-[0.2]"></div>
      
      <!-- Corner right angle elements -->
      <div class="absolute top-[30%] left-[35%] opacity-[0.2]">
        <div class="w-[30px] h-[2px] bg-orange-500"></div>
        <div class="w-[2px] h-[30px] bg-orange-500"></div>
      </div>
      
      <div class="absolute top-[60%] left-[15%] opacity-[0.2]">
        <div class="w-[25px] h-[2px] bg-gray-700"></div>
        <div class="w-[2px] h-[25px] bg-gray-700"></div>
      </div>
      
      <div class="absolute top-[25%] right-[45%] opacity-[0.2]">
        <div class="w-[35px] h-[2px] bg-orange-400"></div>
        <div class="w-[2px] h-[35px] bg-orange-400"></div>
      </div>
      
      <!-- Grid pattern with large spacing -->
      <div class="absolute inset-0 grid-pattern opacity-[0.05]"></div>
    </div>

    <!-- Breadcrumbs Section -->
    <section class="text-gray-600 body-font overflow-hidden relative">
      <div class="container p-5 mx-auto">
        <Breadcrumbs :breadcrumbs="[{label: product.name}]" />
      </div>
    </section>
    
    <!-- Product Detail Section -->
    <section class="text-gray-600 body-font overflow-hidden relative">
      <div class="container px-5 py-10 mx-auto">
        <div class="lg:w-4/5 mx-auto flex flex-wrap">
          <!-- Product Image/Model Container -->
          <div class="lg:w-1/2 w-full relative overflow-hidden">
            <div class="relative rounded-lg shadow-md bg-white p-4 h-full">
              <iframe v-if="product.model"
                title="Modelo_RS_Ejemplo" 
                class="w-full h-full min-h-[400px]"
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
              <img v-else :src="product.images.card" alt="product image" class="w-full h-full max-h-[450px] object-cover object-center rounded-lg">
              
              <!-- Interactive element indicator -->
              <div v-if="product.model" class="absolute bottom-6 right-6 bg-orange-500 text-white px-3 py-1 rounded-full text-xs flex items-center shadow-md">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                Modelo 3D Interactivo
              </div>
            </div>
          </div>
          
          <!-- Product Information -->
          <div class="lg:w-1/2 w-full lg:pl-10 lg:py-6 mt-6 lg:mt-0">
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-sm title-font text-orange-500 tracking-widest font-medium">TIPO DE CARGA: {{ product.attributes.loadType }}</h2>
            <h1 class="text-gray-900 text-3xl title-font font-bold mb-4">{{ product.name }}</h1>
            
            <div class="h-1 w-20 bg-orange-500 rounded mb-6"></div>
            
            <p class="leading-relaxed text-gray-700 mb-4">{{ product.description.long }}</p>
            
            <div v-if="product.perks && product.perks.length > 0" class="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 class="font-medium text-gray-900 mb-2">Características principales:</h3>
              <ul class="list-disc pl-5 space-y-1 text-gray-700">
                <li v-for="(perk, index) in product.perks" :key="index" class="ml-2">{{ perk }}</li>
              </ul>
            </div>
            
            <div class="mt-6 space-y-3">
              <!-- Configurable product button - only for rack selectivo and angulo ranurado -->
              <button 
                v-if="isConfigurableProduct" 
                @click="openQuoteModal(product)" 
                class="flex w-full items-center justify-center bg-orange-500 hover:bg-orange-600 text-white border-0 py-3 px-6 focus:outline-none rounded-lg shadow-md transition-all transform"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                Cotiza tu {{ product.name }}
              </button>
              
              <!-- Regular "Add to Quote" button for non-configurable products -->
              <button 
                v-else 
                @click="addToCart(product)" 
                class="flex w-full items-center justify-center bg-orange-500 hover:bg-orange-600 text-white border-0 py-3 px-6 focus:outline-none rounded-lg shadow-md transition-all transform"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                Añadir a mi Cotización
              </button>
              
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
    
    <!-- Product Gallery Section -->
    <section v-if="product.images && product.images.gallery && product.images.gallery.length" class="py-10 bg-white">
      <div class="container mx-auto px-5">
        <div class="flex flex-col text-center w-full mb-8">
          <h2 class="text-xs text-orange-500 tracking-widest font-medium title-font mb-1">GALERÍA DE IMÁGENES</h2>
          <h1 class="sm:text-3xl text-2xl font-bold title-font text-gray-900 mb-2">Galería del Producto</h1>
          <div class="h-1 w-20 bg-orange-500 rounded mx-auto mb-4"></div>
          <p class="lg:w-2/3 mx-auto leading-relaxed text-base">Explora imágenes reales y renders del producto en diferentes aplicaciones y ambientes.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div v-for="(img, idx) in product.images.gallery" :key="idx" class="rounded-lg overflow-hidden shadow-md bg-gray-50">
            <img :src="img" :alt="`Imagen ${idx + 1} de ${product.name}`" class="w-full h-64 object-cover object-center transition-transform duration-300 hover:scale-105">
          </div>
        </div>
      </div>
    </section>
    
    <!-- Technical Specifications Section -->
    <section class="text-gray-600 body-font relative" v-if="product.technicalSpecs && product.technicalSpecs.length > 0">
      <div class="container px-5 py-16 mx-auto">
        <div class="flex flex-col text-center w-full mb-12">
          <h2 class="text-xs text-orange-500 tracking-widest font-medium title-font mb-1">DETALLES TÉCNICOS</h2>
          <h1 class="sm:text-3xl text-2xl font-bold title-font text-gray-900 mb-2">Especificaciones Técnicas</h1>
          <div class="h-1 w-20 bg-orange-500 rounded mx-auto mb-4"></div>
          <p class="lg:w-2/3 mx-auto leading-relaxed text-base">Conoce todos los detalles técnicos que hacen de este producto la solución ideal para tu negocio.</p>
        </div>
        
        <div class="flex flex-wrap -m-4">
          <div class="xl:w-1/3 md:w-1/2 p-4" v-for="(spec, index) in product.technicalSpecs" :key="index">
            <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 h-full flex flex-col">
              <div class="p-2 rounded-lg bg-gray-50 mb-4 flex justify-center">
                <img class="h-40 object-contain rounded" :src="spec.image" alt="content">
              </div>
              <h2 class="text-lg text-gray-900 font-medium title-font mb-2">{{ spec.name }}</h2>
              <p class="leading-relaxed text-base text-gray-700 mb-4 flex-grow">{{ spec.description }}</p>
              <ul class="list-disc pl-5 space-y-1 text-gray-700" v-if="spec.perks && spec.perks.length">
                <li v-for="(perk, pIndex) in spec.perks" :key="pIndex" class="ml-2">{{ perk }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Information Cards Section -->
    <section class="text-gray-600 body-font relative" v-if="product.infoCards && product.infoCards.length > 0">
      <div class="container px-5 py-16 mx-auto">
        <div class="flex flex-col text-center w-full mb-12">
          <h2 class="text-xs text-orange-500 tracking-widest font-medium title-font mb-1">INFORMACIÓN ADICIONAL</h2>
          <h1 class="sm:text-3xl text-2xl font-bold title-font text-gray-900 mb-2">Más Información</h1>
          <div class="h-1 w-20 bg-orange-500 rounded mx-auto mb-4"></div>
          <p class="lg:w-2/3 mx-auto leading-relaxed text-base">Descubre más datos relevantes sobre nuestro producto y cómo puede adaptarse a tus necesidades.</p>
        </div>
        
        <div class="flex flex-wrap -m-4">
          <div class="p-4 md:w-1/2 w-full" v-for="(infoCard, index) in product.infoCards" :key="index">
            <div class="h-full bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 mr-3 inline-flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-medium text-gray-900">{{ infoCard.title }}</h3>
              </div>
              <p class="leading-relaxed mb-6 text-gray-700">{{ infoCard.description }}</p>
              <ul class="list-disc pl-5 space-y-1 text-gray-700" v-if="infoCard.perks && infoCard.perks.length">
                <li v-for="(perk, pIndex) in infoCard.perks" :key="pIndex" class="ml-2">{{ perk }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <transition name="toast">
      <div 
        v-if="showCartNotification" 
        class="fixed z-50 toast-notification"
      >
        <div class="bg-white rounded-lg shadow-lg p-3 sm:p-4 flex items-center border border-gray-100">
          <div class="bg-green-100 rounded-full p-1.5 sm:p-2 mr-2 sm:mr-3 flex-shrink-0">
            <svg class="w-4 h-4 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-800 truncate text-sm sm:text-base">Producto añadido a la cotización</p>
            <p class="text-xs sm:text-sm text-gray-600 truncate">{{ lastAddedProduct }}</p>
          </div>
          <div class="flex items-center ml-2 sm:ml-4 flex-shrink-0">
            <button @click="goToCart" class="px-2 sm:px-3 py-1 bg-orange-500 text-white rounded-md text-xs sm:text-sm hover:bg-orange-600 mr-1 sm:mr-2 whitespace-nowrap">
              Ver cotización
            </button>
            <button @click="closeNotification" class="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1">
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- Quote Modal & Contact Modal Placeholders -->
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
  <div v-else class="flex flex-col items-center justify-center min-h-[60vh] px-6 py-24 bg-gray-50">
    <svg class="w-16 h-16 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <h2 class="text-2xl font-bold text-gray-800 mb-2">Producto no encontrado</h2>
    <p class="text-gray-600 mb-6 text-center">Lo sentimos, no podemos encontrar el producto que estás buscando.</p>
    <a href="/" class="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors shadow-md">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
      Volver al inicio
    </a>
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

  onMounted(() => {
    const slug = route.params.slug;
    product.value = Object.values(productStore.products).find(p => p.slug === slug);

    if (!product.value) {
      router.push('/404');
    }
  });

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
</script>

<style scoped>
/* Replace the previous patterns with these */
.grid-pattern {
  background-image: 
    linear-gradient(to right, #333333 1px, transparent 1px),
    linear-gradient(to bottom, #333333 1px, transparent 1px);
  background-size: 100px 100px;
}

/* Hover animations */
button {
  transition: all 0.3s ease;
}

button:hover {
  transform: translateY(-2px);
}

/* Card animation */
.xl\:w-1\/3:hover .bg-white,
.p-4.md\:w-1\/2:hover .bg-white {
  transform: translateY(-4px);
  transition: all 0.3s ease;
}

/* Visual container for 3D model */
iframe {
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

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
    max-width: 400px;
    width: auto;
  }
}
</style>