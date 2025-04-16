<template>
  <div class="carousel relative h-150">
    <div class="carousel-inner relative overflow-hidden w-full h-full">
      <div v-for="(slide, index) in slides" :key="index" class="carousel-item absolute w-full h-full duration-500" :class="{ 'opacity-100': currentSlide === index, 'opacity-0': currentSlide !== index }">
        <!-- Main container with flex layout -->
        <div class="flex h-full items-center justify-center">
          <!-- Background image container with lower z-index -->
          <div class="absolute inset-0 z-0">
            <img :src="slide.image" :alt="slide.alt" class="w-full h-full object-cover">
          </div>
          
          <!-- Content container with proper z-index -->
          <div class="relative z-10 flex flex-col md:flex-row w-full max-w-6xl mx-auto items-center justify-between px-4 md:px-8">
            <!-- Product image hidden on small screens using Tailwind's responsive classes -->
            <div class="hidden md:flex md:w-1/2 justify-center items-center">
              <img :src="slide.overlay" :alt="slide.alt" class="object-contain max-h-[400px] transition-all duration-700" :class="{ 'opacity-100 translate-x-0': currentSlide === index, 'opacity-0 -translate-x-10': currentSlide !== index }">
            </div>
            
            <!-- Text card takes full width on small screens -->
            <div class="w-full md:w-1/2 flex justify-center md:justify-end">
              <div class="text-card p-5 md:p-6 bg-white rounded-lg shadow-lg max-w-lg bg-opacity-95 transition-all duration-700 w-full" :class="{ 'opacity-100 translate-x-0': currentSlide === index, 'opacity-0 translate-x-10': currentSlide !== index }">
                <h2 class="text-2xl md:text-3xl font-bold mb-3 text-gray-900">{{ slide.title }}</h2>
                <div class="w-16 h-1 bg-orange-500 rounded mb-4"></div>
                <p class="text-sm md:text-base text-gray-700 leading-relaxed">{{ slide.description }}</p>
                <div class="mt-4 relative z-20">
                  <!-- Button with hover effect and shadow -->
                  <button v-if="slide.link" @click="goToDetails(slide)" class="w-full md:w-auto mt-2 px-5 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors shadow-md flex items-center justify-center pointer-events-auto">
                    Ver detalles
                    <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </button>
                  <button v-else @click="openContactModal()" class="w-full md:w-auto mt-2 px-5 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors shadow-md flex items-center justify-center pointer-events-auto">
                    Contáctanos
                    <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Improved navigation buttons with higher z-index -->
    <button @click="prevSlide" class="absolute left-2 md:left-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-60 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all z-20">
      <svg class="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
    </button>
    <button @click="nextSlide" class="absolute right-2 md:right-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-60 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all z-20">
      <svg class="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
      </svg>
    </button>
    
    <!-- Slide indicators with higher z-index -->
    <div class="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
      <button 
        v-for="(slide, index) in slides" 
        :key="'dot-'+index" 
        @click="currentSlide = index"
        class="w-3 h-3 rounded-full transition-all"
        :class="currentSlide === index ? 'bg-orange-500 w-6' : 'bg-white opacity-60 hover:opacity-100'"
      ></button>
    </div>
  </div>
  <!-- Contact Modal -->
  <ContactModal 
      :isVisible="isContactModalOpen" 
      @close="closeContactModal"
    />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import ContactModal from '~/components/ContactModal.vue';

const router = useRouter();

// State
const currentSlide = ref(0);
const autoSlideInterval = ref(null);
const isContactModalOpen = ref(false);

// Data
const slides = ref([
  { 
    image: '/assets/images/slide-1.png', 
    overlay: '/assets/images/carousel-overlay-1.png', 
    alt: 'Agenda tu visita técnica gratuita', 
    title: 'Visita Técnica Gratuita',
    description: '¿Buscas optimizar tu espacio de almacenamiento? Solicita hoy mismo una visita técnica gratuita de Racklog en Santiago. Nuestros expertos analizarán tu situación y te mostrarán cómo nuestras soluciones de racks y estanterías pueden transformar tu espacio, haciéndolo más eficiente y funcional. ¡Contáctanos ahora para agendar tu visita!', 
    link: '/servicios/visita-tecnica'
  },
  { 
    image: '/assets/images/slide-4.png', 
    overlay: '/assets/images/carousel-overlay-2.png', 
    alt: 'Cotización en 24 horas', 
    title: 'Cotización en 24 horas',
    description: 'Configura tus racks y estanterías con nuestro cotizador online o solicita una cotización personalizada completando nuestro formulario. Recíbela en menos de 24 horas. ¡Contáctanos y optimiza tu espacio!', 
    link: ''
  }
]);

// Methods
const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.value.length;
};

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + slides.value.length) % slides.value.length;
};

const startAutoSlide = () => {
  autoSlideInterval.value = setInterval(() => {
    nextSlide();
  }, 7000); // Change slide every 7 seconds
};

const stopAutoSlide = () => {
  if (autoSlideInterval.value) {
    clearInterval(autoSlideInterval.value);
    autoSlideInterval.value = null;
  }
};

const goToDetails = (slide) => {
  if (slide.link) {
    router.push(slide.link);
  }
};

function openContactModal() {
  isContactModalOpen.value = true;
  if (isMenuOpen.value) {
    isMenuOpen.value = false;
  }
}

function closeContactModal() {
  isContactModalOpen.value = false;
}

// Lifecycle hooks
onMounted(() => {
  currentSlide.value = 0;
  startAutoSlide();
});

onBeforeUnmount(() => {
  stopAutoSlide();
});
</script>

<style scoped>
  .carousel {
    min-height: 300px; /* Reduced from 500px */
  }
  
  @media (min-width: 768px) {
    .carousel {
      min-height: 500px;
    }
  }
  
  .carousel-inner img {
    object-position: center;
  }
  
  .text-card {
    max-height: 90%;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  }
  
  .carousel-item {
    transition: opacity 0.7s ease-in-out;
  }
  
  /* Fix for button to ensure it's clickable */
  .text-card button {
    position: relative;
    z-index: 30;
  }
  
  /* Make sure all interactive elements have proper z-index and pointer-events */
  .carousel button, 
  .text-card, 
  .text-card * {
    pointer-events: auto;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    
    .text-card {
      width: 100%;
      margin: 0 auto;
      max-width: 90%;
    }
  }
</style>