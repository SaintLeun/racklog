<template>
  <header>
    <div class="container mx-auto flex justify-between p-3">
      <img src="https://qa.racklog.cl/images/logorack.png" alt="racklog" class="w-70 h-auto" />
      <div class="phone">
        <a href="tel:+56912345678" class="text-orange-500">+56 9 1234 5678</a>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="bg-neutral-800 sticky top-0 z-50">
      <div class="container mx-auto flex justify-between items-center">
        <div class="flex space-x-4">
          <button class="text-white hover:text-gray-300 py-3">Inicio</button>
          <button class="text-white hover:text-gray-300 py-3">Nosotros</button>
          <div class="relative group">
            <button class="text-white hover:text-gray-300 py-3" aria-expanded="true" aria-haspopup="true">
              Productos
            </button>
            <div class="absolute left-0 w-48 bg-white border border-gray-200 rounded shadow-lg hidden group-hover:block group-focus-within:block z-10" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
              <a :href="product.path" v-for="product in products" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">{{ product.name }}</a>
            </div>
          </div>
          <button class="text-white hover:text-gray-300 py-3">Contacto</button>
        </div>
        <div class="relative flex gap-2">
          <button class="flex items-center text-white hover:text-gray-300">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h18M3 3v18m0-18l18 18"></path>
            </svg>
            Cotización
            <span class="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">0</span>
          </button>
          <LanguageSelector />
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
const products = [
  { name: 'Rack Selectivo', path: 'productos/rack-selectivo' },
  { name: 'Rack Selectivo', path: 'productos/rack-selectivo' },
  { name: 'Rack Selectivo', path: 'productos/rack-selectivo' },
]
</script>

<style scoped>
/* Ensure no parent elements interfere with sticky positioning */
html, body {
  overflow: visible;
}
</style>