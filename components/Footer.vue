<template>
  <footer class="bg-neutral-800 text-white pt-16 pb-8">
    <!-- Main Footer Content -->
    <div class="container mx-auto px-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <!-- Company Info -->
        <div class="space-y-6">
          <img src="/assets/images/logo-white.png" alt="Racklog" class="h-12 w-auto" />
          <p class="text-sm text-gray-300 leading-relaxed">
            Desde 2008 ofreciendo soluciones de almacenamiento industrial de alta calidad, diseñadas para optimizar espacios y mejorar la eficiencia logística de nuestros clientes.
          </p>
          <!-- Social Media -->
          <div class="flex space-x-4 pt-2">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
               class="w-9 h-9 rounded-full flex items-center justify-center bg-gray-700 hover:bg-orange-500 transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
               class="w-9 h-9 rounded-full flex items-center justify-center bg-gray-700 hover:bg-orange-500 transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"></path>
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
               class="w-9 h-9 rounded-full flex items-center justify-center bg-gray-700 hover:bg-orange-500 transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Products -->
        <div>
          <h3 class="text-lg font-bold mb-6 text-white">Productos</h3>
          <ul class="space-y-3">
            <li v-for="category in productCategories" :key="category.id">
              <router-link :to="`/productos?categoria=${category.id}`" 
                class="text-gray-300 hover:text-orange-500 transition-colors text-sm flex items-center">
                <svg class="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
                {{ category.name }}
              </router-link>
            </li>
            <li>
              <router-link to="/productos" 
                class="text-orange-400 hover:text-orange-300 transition-colors text-sm font-medium flex items-center">
                <svg class="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Ver todos los productos
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Links -->
        <div>
          <h3 class="text-lg font-bold mb-6 text-white">Enlaces útiles</h3>
          <ul class="space-y-3">
            <li>
              <router-link to="/nosotros" 
                class="text-gray-300 hover:text-orange-500 transition-colors text-sm flex items-center">
                <svg class="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
                Nosotros
              </router-link>
            </li>
            <li>
              <router-link to="/productos" 
                class="text-gray-300 hover:text-orange-500 transition-colors text-sm flex items-center">
                <svg class="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
                Catálogo de productos
              </router-link>
            </li>
            <li>
              <router-link to="/carrito" 
                class="text-gray-300 hover:text-orange-500 transition-colors text-sm flex items-center">
                <svg class="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
                Solicitar cotización
              </router-link>
            </li>
            <li>
              <a href="#" @click.prevent="openContactModal" 
                class="text-gray-300 hover:text-orange-500 transition-colors text-sm flex items-center">
                <svg class="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
                Contacto
              </a>
            </li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div>
          <h3 class="text-lg font-bold mb-6 text-white">Contáctanos</h3>
          <ul class="space-y-4">
            <li class="flex items-start">
              <svg class="w-5 h-5 mr-3 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <div>
                <p class="text-sm text-gray-300">El Juncal 161-C,</p>
                <p class="text-sm text-gray-300">Quilicura, Santiago - Chile</p>
              </div>
            </li>
            <li class="flex items-center">
              <svg class="w-5 h-5 mr-3 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <a href="tel:+56963699510" class="text-sm text-gray-300 hover:text-orange-500 transition-colors">(+56) 9 6369 9510</a>
            </li>
            <li class="flex items-center">
              <svg class="w-5 h-5 mr-3 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <a href="mailto:contacto@racklog.cl" class="text-sm text-gray-300 hover:text-orange-500 transition-colors">contacto@racklog.cl</a>
            </li>
            <li>
              <button @click="openContactModal" class="mt-3 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-md transition-colors inline-flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                Contáctanos ahora
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Featured Products -->
      <div class="mt-12 pt-8 border-t border-gray-700">
        <h3 class="text-lg font-bold mb-6 text-white">Productos destacados</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div v-for="product in featuredProducts" :key="product.name" 
               class="bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-colors">
            <router-link :to="`/productos/${product.slug}`" class="block">
              <div class="h-28 overflow-hidden">
                <img :src="product.images.card" :alt="product.name" class="w-full h-full object-cover" />
              </div>
              <div class="p-3">
                <h4 class="text-xs font-medium text-gray-200 truncate">{{ product.name }}</h4>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Copyright Section -->
    <div class="mt-12 pt-8 border-t border-gray-700">
      <div class="container mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <p class="text-sm text-gray-400">
            © {{ new Date().getFullYear() }} Racklog. Todos los derechos reservados.
          </p>
          <div class="mt-4 md:mt-0">
            <ul class="flex space-x-6">
              <li><a href="#" class="text-xs text-gray-400 hover:text-orange-500 transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" class="text-xs text-gray-400 hover:text-orange-500 transition-colors">Política de Privacidad</a></li>
              <li><a href="#" class="text-xs text-gray-400 hover:text-orange-500 transition-colors">Mapa del Sitio</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact Modal -->
    <ContactModal 
      :isVisible="isContactModalOpen" 
      @close="closeContactModal"
    />
  </footer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useProductStore } from '../stores/productStore';
import ContactModal from '~/components/ContactModal.vue';

const productStore = useProductStore();
const products = computed(() => productStore.products);
const isContactModalOpen = ref(false);

// Product categories for menu
const productCategories = [
  { id: 'racks', name: 'Racks Industriales' },
  { id: 'estanterias', name: 'Estanterías Metálicas' },
  { id: 'mezzanines', name: 'Mezzanines' },
  { id: 'accesorios', name: 'Accesorios' }
];

// Featured products for the footer
const featuredProducts = computed(() => {
  const allProducts = Object.values(products.value);
  // First try to get featured products
  const featured = allProducts.filter(product => product.featured);
  
  // If we have featured products, show them (up to 6)
  if (featured.length > 0) {
    return featured.slice(0, 6);
  }
  
  // Otherwise show the first 6 products
  return allProducts.slice(0, 6);
});

function openContactModal() {
  isContactModalOpen.value = true;
}

function closeContactModal() {
  isContactModalOpen.value = false;
}
</script>

<style scoped>
/* Hover effects */
a, button {
  transition: all 0.3s ease;
}

a:hover {
  transform: translateX(2px);
}

button:hover {
  transform: translateY(-2px);
}

/* Social icons pulse on hover */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.rounded-full:hover {
  animation: pulse 1s infinite;
}
</style>