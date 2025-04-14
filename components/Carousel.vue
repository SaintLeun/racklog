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
          <div class="relative z-10 flex w-full max-w-6xl mx-auto items-center justify-between px-8">
            <!-- Product image on the left side -->
            <div class="w-1/2 flex justify-center items-center">
              <img :src="slide.overlay" :alt="slide.alt" class="object-contain max-h-[400px] transition-all duration-700" :class="{ 'opacity-100 translate-x-0': currentSlide === index, 'opacity-0 -translate-x-10': currentSlide !== index }">
            </div>
            
            <!-- Text card on the right side -->
            <div class="w-1/2 flex justify-end">
              <div class="text-card p-6 bg-white rounded-lg shadow-lg max-w-lg bg-opacity-95 transition-all duration-700" :class="{ 'opacity-100 translate-x-0': currentSlide === index, 'opacity-0 translate-x-10': currentSlide !== index }">
                <h2 class="text-3xl font-bold mb-3 text-gray-900">{{ slide.title }}</h2>
                <div class="w-16 h-1 bg-orange-500 rounded mb-4"></div>
                <p class="text-base text-gray-700 leading-relaxed">{{ slide.description }}</p>
                <div class="mt-4 relative z-20">
                  <button @click="goToDetails(slide)" class="mt-2 px-5 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors shadow-md flex items-center pointer-events-auto">
                    Ver detalles
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
    <button @click="prevSlide" class="absolute left-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-60 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all z-20">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
    </button>
    <button @click="nextSlide" class="absolute right-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-60 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all z-20">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// State
const currentSlide = ref(0);
const autoSlideInterval = ref(null);

// Data
const slides = ref([
  { 
    image: '/assets/images/slide-1.png', 
    overlay: 'https://qa.racklog.cl/images/slider/silder_1/palletslider1.png', 
    alt: 'Rack Selectivo', 
    title: 'Rack Selectivo', 
    description: 'La solución ideal para el almacenamiento de pallets con acceso directo a cada ubicación. Maximiza el aprovechamiento de espacio con la versatilidad que su negocio necesita.',
    link: '/productos/rack-selectivo'
  },
  { 
    image: '/assets/images/slide-2.png', 
    overlay: 'https://qa.racklog.cl/images/slider/silder_1/palletslider1.png', 
    alt: 'Ángulo Ranurado', 
    title: 'Ángulo Ranurado', 
    description: 'Sistema versátil para cargas livianas y medianas. Ideal para organizar inventarios, archivos y productos de diferentes dimensiones con fácil acceso y montaje sin herramientas especiales.',
    link: '/productos/angulo-ranurado'
  },
  { 
    image: '/assets/images/slide-1.png', 
    overlay: 'https://qa.racklog.cl/images/slider/silder_1/palletslider1.png', 
    alt: 'Rack Drive-In', 
    title: 'Rack Drive-In', 
    description: 'Maximice la capacidad de almacenamiento con nuestros sistemas Drive-In. Perfectos para almacenar grandes cantidades de productos homogéneos aprovechando al máximo el espacio disponible.',
    link: '/productos/rack-drive-in'
  },
  { 
    image: '/assets/images/slide-2.png', 
    overlay: 'https://qa.racklog.cl/images/slider/silder_1/palletslider1.png', 
    alt: 'Soluciones Industriales', 
    title: 'Soluciones Industriales Personalizadas', 
    description: 'Diseñamos e implementamos sistemas de almacenamiento a medida para satisfacer las necesidades específicas de su operación logística y maximizar la eficiencia de su espacio.',
    link: '/productos'
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
    min-height: 500px;
  }
  
  .carousel-inner img {
    object-position: center;
  }
  
  .text-card {
    max-height: 80%;
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
    .content-container {
      flex-direction: column;
    }
    
    .text-card {
      margin-top: 1rem;
    }
  }
</style>