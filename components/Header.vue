<template>
  <header>
    <div class="container mx-auto flex justify-between p-3">
      <a href="/">
        <img src="https://qa.racklog.cl/images/logorack.png" alt="racklog" class="w-70 h-auto" />
      </a>
      <div class="phone">
        <a href="tel:+56912345678" class="text-orange-500">+56 9 1234 5678</a>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="bg-neutral-800 sticky top-0 z-50">
      <div class="container mx-auto flex justify-between items-center">
        <div class="flex space-x-4 hidden md:flex">
          <a href="/" class="text-white hover:text-gray-300 py-4">Inicio</a>
          <button class="text-white hover:text-gray-300 py-4">Nosotros</button>
          <div class="relative group">
            <button class="text-white hover:text-gray-300 py-4" aria-expanded="true" aria-haspopup="true">
              Productos
            </button>
            <div class="absolute left-0 w-48 bg-white border border-gray-200 rounded shadow-lg hidden group-hover:block group-focus-within:block z-10" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
              <a :href="'/productos/' + product.slug" v-for="product in products" :key="product.name" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">{{ product.name }}</a>
            </div>
          </div>
          <button class="text-white hover:text-gray-300 py-4">Contacto</button>
        </div>
        <div class="relative flex gap-2 hidden md:flex">
          <button class="flex items-center text-white hover:text-gray-300">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h18M3 3v18m0-18l18 18"></path>
            </svg>
            Cotización
            <span class="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">0</span>
          </button>
        </div>
        <button @click="toggleMenu" class="text-white md:hidden p-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
      <div :class="{'block': isMenuOpen, 'hidden': !isMenuOpen}" class="md:hidden p-4">
        <a href="/" class="block text-white hover:text-gray-300 py-2">Inicio</a>
        <button class="block text-white hover:text-gray-300 py-2">Nosotros</button>
        <div class="relative group">
          <button class="block text-white hover:text-gray-300 py-2" aria-expanded="true" aria-haspopup="true">
            Productos
          </button>
          <div class="absolute left-0 w-48 bg-white border border-gray-200 rounded shadow-lg hidden group-hover:block group-focus-within:block z-10" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
            <a :href="'/productos/' + product.slug" v-for="product in products" :key="product.name" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">{{ product.name }}</a>
          </div>
        </div>
        <button class="block text-white hover:text-gray-300 py-2">Contacto</button>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useProductStore } from '~/stores/productStore';

const productStore = useProductStore();
const products = productStore.products;

const isMenuOpen = ref(false);

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}
</script>

<style scoped>
/* Ensure no parent elements interfere with sticky positioning */
html, body {
  overflow: visible;
}
</style>