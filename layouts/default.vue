<template>
  <div class="flex flex-col min-h-screen">
    <Header />
    <main class="flex-grow">
      <NuxtPage />
    </main>
    <Footer />
    
    <!-- Botón flotante de cotización -->
    <Transition
      enter-active-class="transform transition duration-500 ease-out"
      enter-from-class="opacity-0 translate-y-10 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transform transition duration-300 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-10 scale-95"
    >
      <div 
        v-if="cartCount > 0" 
        class="fixed z-40 right-4 sm:right-6 bottom-4 sm:bottom-6"
      >
        <NuxtLink 
          to="/carrito" 
          class="quote-cart-button flex items-center gap-2 px-4 py-3 bg-gradient-to-tr from-orange-500 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
          :class="{ 'animate-pulse': hasNewItem }"
          @mouseenter="stopAnimation"
        >
          <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-white text-orange-600 text-xs font-bold rounded-full border border-orange-300">
              {{ cartCount }}
            </span>
          </div>
          <span class="font-medium hidden sm:block">Ver cotización</span>
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useCartStore } from '~/stores/cartStore'
import { storeToRefs } from 'pinia'

// Usar el store de Pinia para acceder al conteo del carrito
const cartStore = useCartStore()
const { cartCount } = storeToRefs(cartStore)

// Variable para controlar la animación
const hasNewItem = ref(false)
// Contador previo para detectar cambios
const prevCount = ref(0)

// Monitorear cambios en el conteo del carrito para activar animación
watch(cartCount, (newCount, oldCount) => {
  // Si hay productos en el carrito y es una adición (no carga inicial)
  if (newCount > oldCount && oldCount > 0) {
    hasNewItem.value = true
    setTimeout(() => {
      hasNewItem.value = false
    }, 3000) // Detener animación después de 3 segundos
  }
  // Actualizar contador previo
  prevCount.value = newCount
})

// Detener la animación al pasar el mouse
function stopAnimation() {
  hasNewItem.value = false
}

// Guardar el conteo inicial cuando el componente se monta
onMounted(() => {
  prevCount.value = cartCount.value
})
</script>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}

/* Estilos para el botón flotante */
.quote-cart-button {
  transition: transform 0.3s ease;
}

.quote-cart-button:hover {
  transform: translateY(-3px);
}

/* Sombra interior sutil al hacer hover */
.quote-cart-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 9999px;
  box-shadow: inset 0 0 0 0 rgba(255, 255, 255, 0.1);
  transition: box-shadow 0.3s ease;
}

.quote-cart-button:hover::after {
  box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.2);
}

/* Animación de bounce para el botón */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* Clase para animar el botón */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
</style>