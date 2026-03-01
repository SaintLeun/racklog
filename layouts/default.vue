<template>

  <div class="flex flex-col min-h-screen">
    <Header />
    <main class="flex-grow">
      <NuxtPage />
    </main>
    <Footer />
    
    <!-- Botón flotante de WhatsApp -->
    <a 
      href="https://wa.me/56963699510" 
      target="_blank"
      rel="noopener noreferrer"
      class="whatsapp-button fixed z-40 right-4 sm:right-6 bg-gradient-to-tr from-green-500 to-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group flex items-center justify-center"
      :class="cartCount > 0 ? 'bottom-20 sm:bottom-24' : 'bottom-4 sm:bottom-6'"
    >
      <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    </a>
    
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

/* Estilos para el botón de WhatsApp */
.whatsapp-button {
  width: 56px;
  height: 56px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.whatsapp-button:hover {
  transform: scale(1.1);
}

.whatsapp-button:active {
  transform: scale(0.95);
}

/* Animación de pulso sutil para WhatsApp */
@keyframes whatsapp-pulse {
  0% { 
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  100% { 
    box-shadow: 0 0 0 15px rgba(34, 197, 94, 0);
  }
}

.whatsapp-button {
  animation: whatsapp-pulse 2s ease-out 8s infinite;
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