<template>
  <header>
    <!-- Enhanced Top Header with Contact Info and Social Links -->
    <div class="bg-gray-100 py-2 border-b border-gray-200">
      <div class="container mx-auto flex flex-col sm:flex-row justify-between items-center px-4">
        <!-- Left side: Contact Information -->
        <div class="flex items-center space-x-4 mb-2 sm:mb-0">
          <div class="flex items-center text-gray-600 hover:text-orange-500 transition-colors">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
            <a href="tel:+56228400424" class="text-sm font-medium hover:underline">(+56) 2 2840 0424</a>
          </div>
          <div class="hidden sm:flex items-center text-gray-600 hover:text-orange-500 transition-colors">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <a href="mailto:contacto@racklog.cl" class="text-sm font-medium hover:underline">contacto@racklog.cl</a>
          </div>
        </div>
        
        <!-- Right side: Social Links and Quick Actions -->
        <div class="flex items-center space-x-3">
          <!-- Social Links -->
          <div class="flex space-x-2">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd"></path>
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd"></path>
              </svg>
            </a>
          </div>
          
          <!-- Quick Contact Button -->
          <button 
            @click="openContactModal" 
            class="text-xs sm:text-sm bg-orange-500 hover:bg-orange-600 text-white py-1 px-3 rounded-md shadow-sm transition-all flex items-center"
          >
            <span>Contacto Rápido</span>
            <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Logo and Main Nav -->
    <div class="border-b border-gray-200 py-3">
      <div class="container mx-auto flex justify-between items-center px-4">
        <a href="/" class="flex items-center">
          <img src="/assets/images/logo.png" alt="racklog" class="h-12 w-auto" />
        </a>
        
        <!-- Business Hours and Location - Desktop only -->
        <div class="hidden md:flex items-center space-x-6">
          <!-- Business Hours -->
          <div class="flex items-start">
            <div class="mr-3 mt-1 p-1.5 bg-orange-100 rounded-md">
              <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-800">Horario de Atención</p>
              <p class="text-xs text-gray-600">Lun - Vie: 8:30 AM - 6:00 PM</p>
            </div>
          </div>
          
          <!-- Location -->
          <div class="flex items-start">
            <div class="mr-3 mt-1 p-1.5 bg-orange-100 rounded-md">
              <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-800">Ubicación</p>
              <p class="text-xs text-gray-600">El Juncal 161-C, Quilicura, Santiago - Chile.</p>
            </div>
          </div>
        </div>
        
        <!-- Phone Badge with Pulse Effect - Mobile visible -->
        <a href="tel:+56978632154" class="flex md:hidden items-center bg-orange-50 text-orange-600 rounded-full px-3 py-1.5 border border-orange-200">
          <div class="relative mr-2">
            <span class="absolute inset-0 rounded-full animate-ping bg-orange-400 opacity-75"></span>
            <svg class="relative w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
          </div>
          <span class="font-medium text-sm">Llámanos</span>
        </a>
      </div>
    </div>

    <!-- Navigation - Sección mejorada -->
    <nav class="bg-neutral-800 sticky top-0 z-50">
      <div class="container mx-auto flex justify-between items-center">
        <div class="flex space-x-6 hidden md:flex">
          <a href="/" @click="closeAllMenus" class="text-white hover:text-orange-400 py-4 transition-colors">Inicio</a>
          <a href="/nosotros" @click="closeAllMenus" class="text-white hover:text-orange-400 py-4 transition-colors">Nosotros</a>
          
          <!-- Menú de Productos Mejorado -->
          <div class="relative dropdown-container">
            <button 
              class="flex items-center text-white hover:text-orange-400 py-4 focus:outline-none transition-colors" 
              aria-expanded="true" 
              aria-haspopup="true"
            >
              Productos
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            <!-- Menú desplegable mejorado para productos -->
            <div 
              class="dropdown-menu absolute left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 transform opacity-0 scale-95 transition-all duration-200 origin-top-left"
              style="width: 520px; max-width: calc(100vw - 40px);"
              role="menu" 
              aria-orientation="vertical" 
              tabindex="-1"
            >
              <div class="grid grid-cols-2 gap-x-2">
                <!-- Columna para productos destacados -->
                <div class="p-5">
                  <h3 class="font-bold text-gray-800 border-b pb-2 mb-3">Productos Destacados</h3>
                  <div class="space-y-3">
                    <router-link
                      v-for="product in featuredProducts"
                      :key="product.id"
                      :to="'/productos/' + product.slug"
                      @click="closeAllMenus"
                      class="flex items-start p-2 rounded-lg transition-colors hover:bg-orange-50"
                    >
                      <div class="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                        <img :src="product.images?.card || ''" :alt="product.name" class="h-full w-full object-cover" />
                      </div>
                      <div class="ml-3">
                        <p class="text-sm font-medium text-gray-800">{{ product.name }}</p>
                        <p class="text-xs text-gray-500 line-clamp-1">{{ product.description?.short }}</p>
                      </div>
                    </router-link>
                  </div>
                </div>
                
                <!-- Columna para categorías -->
                <div class="bg-gray-50 p-5 rounded-r-lg">
                  <h3 class="font-bold text-gray-800 border-b pb-2 mb-3">Categorías</h3>
                  <ul class="space-y-1">
                    <li v-for="category in productCategories" :key="category.id">
                      <router-link 
                        :to="'/productos?categoria=' + category.id" 
                        @click="closeAllMenus"
                        class="flex items-center py-1.5 px-2 text-sm text-gray-700 rounded-md hover:bg-orange-100 hover:text-orange-700 transition-colors"
                      >
                        <svg class="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                        {{ category.name }}
                      </router-link>
                    </li>
                  </ul>
                  
                  <div class="mt-4 pt-3 border-t border-gray-200">
                    <router-link 
                      to="/productos" 
                      @click="closeAllMenus"
                      class="flex items-center justify-between py-2 px-3 text-sm font-medium text-orange-500 hover:text-orange-600 rounded-md hover:bg-orange-50 transition-colors"
                    >
                      Ver todos los productos
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Menú de Servicios Mejorado -->
          <div class="relative dropdown-container">
            <button 
              class="flex items-center text-white hover:text-orange-400 py-4 focus:outline-none transition-colors" 
              aria-expanded="true" 
              aria-haspopup="true"
            >
              Servicios
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            <!-- Menú desplegable mejorado para servicios -->
            <div 
              class="dropdown-menu absolute left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-100 transform opacity-0 scale-95 transition-all duration-200 origin-top-left"
              role="menu" 
              aria-orientation="vertical" 
              tabindex="-1"
            >
              <div class="p-4">
                <h3 class="font-bold text-gray-800 border-b pb-2 mb-3">Nuestros Servicios</h3>
                <div class="space-y-1">
                  <router-link
                    v-for="service in services"
                    :key="service.id"
                    :to="'/servicios/' + service.slug"
                    @click="closeAllMenus"
                    class="flex items-center p-2 rounded-md transition-colors hover:bg-orange-50"
                  >
                    <div class="p-1.5 bg-orange-100 rounded-md mr-3">
                      <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-700">{{ service.name }}</span>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Cotización y menú móvil -->
        <div class="relative flex gap-2 hidden md:flex">
          <router-link 
            to="/carrito" 
            class="flex items-center text-white hover:text-orange-400 transition-colors"
          >
            <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            Cotización
            <span v-if="cartCount > 0" class="ml-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {{ cartCount }}
            </span>
          </router-link>
        </div>
        
        <button @click="toggleMenu" class="text-white md:hidden p-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
      
      <!-- Menú móvil mejorado -->
      <div 
        :class="{'max-h-screen opacity-100 py-4': isMenuOpen, 'max-h-0 opacity-0 py-0 overflow-hidden': !isMenuOpen}" 
        class="md:hidden transition-all duration-300 ease-in-out"
      >
        <div class="container mx-auto px-4 space-y-3">
          <a href="/" @click="closeAllMenus" class="block text-white hover:text-orange-400 py-2 transition-colors">Inicio</a>
          <a href="/nosotros" @click="closeAllMenus" class="block text-white hover:text-orange-400 py-2 transition-colors">Nosotros</a>
          
          <!-- Acordeón para productos en móvil -->
          <div>
            <button 
              @click="toggleMobileSubmenu('productos')"
              class="flex items-center justify-between w-full text-white hover:text-orange-400 py-2 transition-colors focus:outline-none"
            >
              <span>Productos</span>
              <svg 
                class="w-4 h-4 transition-transform" 
                :class="{'rotate-180': openMobileSubmenu === 'productos'}"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            <div 
              v-if="openMobileSubmenu === 'productos'"
              class="pl-4 mt-1 space-y-2 border-l border-gray-700"
            >
              <router-link 
                v-for="category in productCategories" 
                :key="category.id"
                :to="'/productos?categoria=' + category.id"
                @click="closeAllMenus"
                class="block text-gray-300 hover:text-orange-400 py-1.5 transition-colors"
              >
                {{ category.name }}
              </router-link>
              
              <router-link 
                to="/productos"
                @click="closeAllMenus"
                class="block text-orange-400 font-medium py-1.5 transition-colors"
              >
                Ver todos los productos →
              </router-link>
            </div>
          </div>
          
          <!-- Acordeón para servicios en móvil -->
          <div>
            <button 
              @click="toggleMobileSubmenu('servicios')"
              class="flex items-center justify-between w-full text-white hover:text-orange-400 py-2 transition-colors focus:outline-none"
            >
              <span>Servicios</span>
              <svg 
                class="w-4 h-4 transition-transform" 
                :class="{'rotate-180': openMobileSubmenu === 'servicios'}"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            <div 
              v-if="openMobileSubmenu === 'servicios'"
              class="pl-4 mt-1 space-y-2 border-l border-gray-700"
            >
              <router-link 
                v-for="service in services" 
                :key="service.id"
                :to="'/servicios/' + service.slug"
                @click="closeAllMenus"
                class="block text-gray-300 hover:text-orange-400 py-1.5 transition-colors"
              >
                {{ service.name }}
              </router-link>
            </div>
          </div>
          
          <a href="/contacto" @click="closeAllMenus" class="block text-white hover:text-orange-400 py-2 transition-colors">Contacto</a>
          
          <!-- Botón de cotización en móvil -->
          <router-link 
            to="/carrito"
            @click="closeAllMenus"
            class="flex items-center justify-between mt-3 bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 rounded-lg transition-colors"
          >
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <span>Mi Cotización</span>
            </div>
            <span v-if="cartCount > 0" class="bg-white text-orange-700 font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {{ cartCount }}
            </span>
          </router-link>
        </div>
      </div>
    </nav>
    
    <!-- Contact Modal -->
    <ContactModal 
      :isVisible="isContactModalOpen" 
      @close="closeContactModal"
    />
  </header>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useProductStore } from '~/stores/productStore';
import { useCartStore } from '~/stores/cartStore'; 
import { useRouter } from 'vue-router'; 
import { storeToRefs } from 'pinia'; 
import ContactModal from '~/components/ContactModal.vue';

const productStore = useProductStore();
const products = productStore.products;
const services = productStore.services || [];

const cartStore = useCartStore();
const { cartCount } = storeToRefs(cartStore);

const isMenuOpen = ref(false);
const openMobileSubmenu = ref(null);
const isContactModalOpen = ref(false);
const router = useRouter();

// Categorías de productos para el menú
const productCategories = [
  { id: 'racks', name: 'Racks Industriales' },
  { id: 'estanterias', name: 'Estanterías Metálicas' },
  { id: 'mezzanines', name: 'Mezzanines' },
  { id: 'accesorios', name: 'Accesorios' },
];

// Productos destacados para mostrar en el menú
const featuredProducts = computed(() => {
  const allProducts = Object.values(products);
  // Primero intentamos obtener productos destacados
  const featured = allProducts.filter(product => product.featured);
  
  // Si hay productos destacados, los mostramos (hasta 3)
  if (featured.length > 0) {
    return featured.slice(0, 3);
  }
  
  // Si no hay destacados, mostramos los primeros 3 productos
  return allProducts.slice(0, 3);
});

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
  // Si cerramos el menú, también cerramos cualquier submenú
  if (!isMenuOpen.value) {
    openMobileSubmenu.value = null;
  }
}

function toggleMobileSubmenu(menuName) {
  openMobileSubmenu.value = openMobileSubmenu.value === menuName ? null : menuName;
}

// Función para cerrar todos los menús al hacer clic en un enlace
function closeAllMenus() {
  isMenuOpen.value = false;
  openMobileSubmenu.value = null;
}

function goToCart() {
  router.push('/carrito');
  closeAllMenus();
}

function openContactModal() {
  isContactModalOpen.value = true;
  closeAllMenus();
}

function closeContactModal() {
  isContactModalOpen.value = false;
}

// Cerrar los menús cuando la ruta cambia
watch(
  () => router.currentRoute.value.path,
  () => {
    closeAllMenus();
  }
);
</script>

<style scoped>
/* Ensure no parent elements interfere with sticky positioning */
html, body {
  overflow: visible;
}

/* Add ripple effect for mobile */
@media (max-width: 768px) {
  button {
    position: relative;
    overflow: hidden;
  }
  
  button:active::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100px;
    height: 100px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    animation: ripple 0.6s linear;
  }
  
  @keyframes ripple {
    to {
      transform: translate(-50%, -50%) scale(2);
      opacity: 0;
    }
  }
}

/* Agregar clases línea-clamp para truncar texto */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}

/* Transiciones mejoradas para los menús */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Transición más suave para la rotación del icono */
.rotate-180 {
  transform: rotate(180deg);
}

/* Mejorar el comportamiento del dropdown */
.dropdown-container .dropdown-menu {
  pointer-events: none;
  visibility: hidden;
  transition: opacity 0.2s, transform 0.2s, visibility 0s linear 0.2s;
}

.dropdown-container:hover .dropdown-menu {
  opacity: 1;
  transform: scale(1);
  visibility: visible;
  pointer-events: auto;
  transition-delay: 0s;
}

/* Mantener el menú visible al pasar el mouse por encima del menú o su contenedor */
.dropdown-container:hover .dropdown-menu,
.dropdown-menu:hover {
  opacity: 1;
  transform: scale(1);
  visibility: visible;
  pointer-events: auto;
  transition-delay: 0s;
}

/* Añadir un retraso cuando se sale del área */
.dropdown-menu {
  transition: opacity 0.25s ease 0.1s, transform 0.25s ease 0.1s, visibility 0s linear 0.25s;
}

/* Asegurar que el menú no se cierre si hay un pequeño gap entre el botón y el menú */
.dropdown-container::after {
  content: "";
  position: absolute;
  height: 20px;
  width: 100%;
  bottom: -10px;
  left: 0;
  z-index: 1;
}
</style>