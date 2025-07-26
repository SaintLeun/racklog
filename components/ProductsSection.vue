<template>
  <section class="products-section relative py-24 overflow-hidden">
    <!-- Background pattern -->
    <div class="absolute inset-0 z-0 opacity-[0.04]">
      <div class="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-orange-200 to-transparent rounded-bl-full"></div>
      <div class="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-gray-300 to-transparent rounded-tr-full"></div>
      
      <!-- Abstract geometric elements -->
      <div class="grid grid-cols-12 grid-rows-6 h-full w-full">
        <div class="col-span-1 row-span-1 border-r border-b border-gray-300"></div>
        <div class="col-span-2 row-span-2 border-r border-b border-gray-300"></div>
        <div class="col-start-10 col-span-3 row-span-2 border-l border-b border-gray-300"></div>
        <div class="col-start-4 col-span-2 row-start-4 row-span-2 border-l border-t border-gray-300"></div>
      </div>
    </div>
    
    <div class="container mx-auto px-6 relative z-10">
      <!-- Section header with styled line -->
      <div class="flex flex-col items-center text-center mb-16">
        <div class="inline-block relative mb-5">
          <span class="absolute inset-x-0 bottom-0 h-[6px] bg-orange-500/20 -mb-2"></span>
          <h2 class="text-sm uppercase tracking-wider font-semibold text-orange-500 relative z-10">Explora nuestra gama</h2>
        </div>
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Soluciones de Almacenaje</h1>
        <div class="w-16 h-1 rounded-full bg-orange-500 mb-6"></div>
        <p class="max-w-2xl text-gray-600 text-lg">
          Descubre nuestras soluciones industriales diseñadas para maximizar el espacio y optimizar tus operaciones logísticas.
        </p>
      </div>
      
      <!-- Products grid with fade-in animation -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="(product, key) in filteredProducts" 
          :key="key" 
          class="product-card group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
          :class="{'fade-in-bottom': isVisible}"
        >
          <!-- Reduced image size using aspect-w-4 aspect-h-3 for a 4:3 ratio instead of 16:9 -->
          <div class="aspect-w-4 aspect-h-3 bg-gray-100 relative overflow-hidden">
            <img 
              :src="product.images.card" 
              :alt="product.name" 
              class="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div class="absolute bottom-4 left-4 right-4">
                <span class="inline-block px-3 py-1 bg-orange-500 text-white text-xs uppercase tracking-wider rounded-full mb-2">Producto</span>
              </div>
            </div>
          </div>
          
          <!-- Reduced padding for a more compact card -->
          <div class="p-4">
            <h2 class="text-lg font-bold text-gray-900 mb-1 group-hover:text-orange-500 transition-colors">{{ product.name }}</h2>
            <div class="w-8 h-[2px] bg-orange-500 rounded mb-2 transition-all duration-300 group-hover:w-12"></div>
            <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ product.description.short }}</p>
            
            <div class="pt-2 border-t border-gray-100">
              <router-link 
                :to="'/productos/' + product.slug" 
                class="inline-flex items-center text-orange-500 font-medium text-sm group-hover:text-orange-600"
              >
                Explorar solución
                <svg class="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </router-link>
            </div>
          </div>
        </div>
      </div>
      
      <!-- View all products button -->
      <div class="text-center mt-12">
        <router-link 
          to="/productos" 
          class="inline-flex items-center justify-center px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          Ver todos los productos
          <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
          </svg>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, onBeforeUnmount } from 'vue';
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();
const isVisible = ref(false);

const filteredProducts = computed(() => {
  return Object.values(productStore.products)
    .slice(0, 6); // Limit to 6 products for better display
});

// Improved scroll animation using Intersection Observer
const setupIntersectionObserver = () => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      isVisible.value = true;
      observer.disconnect();
    }
  }, { threshold: 0.1 });
  
  const sectionElement = document.querySelector('.products-section');
  if (sectionElement) {
    observer.observe(sectionElement);
  }
  
  return observer;
};

let observer: IntersectionObserver | undefined;

onMounted(() => {
  observer = setupIntersectionObserver();
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.products-section {
  background-color: #f9fafb;
}

.fade-in-bottom .product-card {
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInBottom 0.5s ease forwards;
}

.fade-in-bottom .product-card:nth-child(1) { animation-delay: 0.1s; }
.fade-in-bottom .product-card:nth-child(2) { animation-delay: 0.2s; }
.fade-in-bottom .product-card:nth-child(3) { animation-delay: 0.3s; }
.fade-in-bottom .product-card:nth-child(4) { animation-delay: 0.4s; }
.fade-in-bottom .product-card:nth-child(5) { animation-delay: 0.5s; }
.fade-in-bottom .product-card:nth-child(6) { animation-delay: 0.6s; }

@keyframes fadeInBottom {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Aspect ratio for images - changed to 4:3 ratio */
.aspect-w-4 {
  position: relative;
  padding-bottom: 75%; /* 4:3 Aspect Ratio */
}

.aspect-w-4 > img {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  object-fit: cover;
}

/* Line clamp for text overflow - reduced to 2 lines */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
</style>