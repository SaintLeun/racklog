<template>
  <div v-if="service" class="relative overflow-hidden">
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
        <Breadcrumbs :breadcrumbs="[{label: 'Servicios', link: '/servicios'}, {label: service.name}]" />
      </div>
    </section>
    
    <!-- Service Detail Section -->
    <section class="text-gray-600 body-font overflow-hidden relative">
      <div class="container px-5 py-10 mx-auto">
        <div class="mx-auto flex flex-wrap max-w-5xl">
          <!-- Service Image Container -->
          <div class="w-full lg:w-1/2 relative overflow-hidden mb-10 lg:mb-0 lg:pr-8">
            <div class="relative rounded-lg shadow-md bg-white p-4 h-full">
              <img :src="service.mainImage" :alt="service.name" class="w-full h-full object-cover object-center rounded-lg">
            </div>
          </div>
          
          <!-- Service Information -->
          <div class="w-full lg:w-1/2 lg:pl-8">
            <div class="bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-sm title-font text-orange-500 tracking-widest font-medium">SERVICIO</h2>
              <h1 class="text-gray-900 text-3xl title-font font-bold mb-4">{{ service.name }}</h1>
              
              <div class="h-1 w-20 bg-orange-500 rounded mb-6"></div>
              
              <p class="leading-relaxed text-gray-700 mb-6">{{ service.shortDescription }}</p>
              
              <div v-if="service.highlights && service.highlights.length > 0" class="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 class="font-medium text-gray-900 mb-2">Lo que incluye:</h3>
                <ul class="list-disc pl-5 space-y-2 text-gray-700">
                  <li v-for="(highlight, index) in service.highlights" :key="index" class="ml-2">{{ highlight }}</li>
                </ul>
              </div>
              
              <div class="mt-6">
                <!-- Contact button for services -->
                <button 
                  @click="openContactModal()" 
                  class="flex w-full items-center justify-center bg-orange-500 hover:bg-orange-600 text-white border-0 py-3 px-6 focus:outline-none rounded-lg shadow-md transition-all transform"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Solicitar este servicio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Detailed Description Section -->
    <section class="text-gray-600 body-font overflow-hidden relative py-10">
      <div class="container px-5 mx-auto max-w-5xl">
        <div class="bg-white p-8 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Descripción detallada</h2>
          <div class="prose prose-lg max-w-none text-gray-700">
            <p class="mb-6">{{ service.longDescription }}</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Service Details Section -->
    <section class="text-gray-600 body-font relative py-10" v-if="service.serviceDetails && service.serviceDetails.length > 0">
      <div class="container px-5 mx-auto max-w-5xl">
        <div class="flex flex-col text-center w-full mb-12">
          <h2 class="text-xs text-orange-500 tracking-widest font-medium title-font mb-1">DETALLES DEL SERVICIO</h2>
          <h1 class="sm:text-3xl text-2xl font-bold title-font text-gray-900 mb-2">Nuestro enfoque</h1>
          <div class="h-1 w-20 bg-orange-500 rounded mx-auto mb-4"></div>
          <p class="lg:w-2/3 mx-auto leading-relaxed text-base">Conoce en detalle cómo trabajamos y los beneficios de nuestro servicio profesional.</p>
        </div>
        
        <div class="flex flex-wrap -m-4">
          <div class="p-4 w-full md:w-1/2" v-for="(detail, index) in service.serviceDetails" :key="index">
            <div class="h-full bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div class="flex items-center mb-4">
                <div class="w-10 h-10 mr-3 inline-flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <i :class="['fas', detail.icon]"></i>
                </div>
                <h3 class="text-xl font-medium text-gray-900">{{ detail.title }}</h3>
              </div>
              <p class="leading-relaxed mb-6 text-gray-700">{{ detail.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Gallery Section -->
    <section class="text-gray-600 body-font relative py-10" v-if="service.galleryImages && service.galleryImages.length > 0">
      <div class="container px-5 mx-auto max-w-5xl">
        <div class="flex flex-col text-center w-full mb-12">
          <h2 class="text-xs text-orange-500 tracking-widest font-medium title-font mb-1">GALERÍA</h2>
          <h1 class="sm:text-3xl text-2xl font-bold title-font text-gray-900 mb-2">Nuestro servicio en acción</h1>
          <div class="h-1 w-20 bg-orange-500 rounded mx-auto mb-4"></div>
          <p class="lg:w-2/3 mx-auto leading-relaxed text-base">Algunas imágenes de nuestros servicios realizados para clientes.</p>
        </div>
        
        <div class="flex flex-wrap -m-4">
          <div class="p-4 md:w-1/2 lg:w-1/3" v-for="(image, index) in service.galleryImages" :key="index">
            <div class="h-full bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <img :src="image" :alt="`${service.name} imagen ${index + 1}`" class="rounded-lg w-full h-64 object-cover object-center">
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="text-gray-600 body-font relative py-10">
      <div class="container px-5 mx-auto max-w-5xl">
        <div class="bg-orange-50 p-8 md:p-12 rounded-lg shadow-md">
          <div class="flex flex-col md:flex-row md:items-center">
            <div class="md:w-2/3 mb-6 md:mb-0 md:pr-8">
              <h2 class="text-2xl font-bold text-gray-900 mb-4">¿Necesitas asesoría especializada?</h2>
              <p class="text-gray-700 mb-4">Nuestro equipo de expertos está disponible para responder todas tus dudas y ayudarte a encontrar la mejor solución para tu negocio.</p>
            </div>
            <div class="md:w-1/3 flex justify-center md:justify-end">
              <button 
                @click="openContactModal()" 
                class="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg shadow-md transition-all transform hover:-translate-y-1"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                Contactar ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Modal -->
    <ContactModal 
      :isVisible="isContactModalVisible" 
      :title="modalTitle" 
      :serviceInfo="service.name" 
      @close="closeModal()" 
    />
  </div>
  
  <!-- Not Found State -->
  <div v-else class="flex flex-col items-center justify-center min-h-[60vh] px-6 py-24 bg-gray-50">
    <svg class="w-16 h-16 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <h2 class="text-2xl font-bold text-gray-800 mb-2">Servicio no encontrado</h2>
    <p class="text-gray-600 mb-6 text-center">Lo sentimos, no podemos encontrar el servicio que estás buscando.</p>
    <a href="/servicios" class="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors shadow-md">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
      Ver todos los servicios
    </a>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import ContactModal from '~/components/ContactModal.vue';

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const service = ref(null);
const isContactModalVisible = ref(false);
const modalTitle = ref('');

// Computed property to access services from the store
const services = computed(() => productStore.services);

onMounted(async () => {
  const slug = route.params.slug;
  
  // Find the service with matching slug
  service.value = services.value.find(s => s.slug === slug);
  
  // If service not found, redirect to services page
  if (!service.value) {
    router.push('/servicios');
  }
});

function openContactModal() {
  modalTitle.value = `Solicitar información: ${service.value.name}`;
  isContactModalVisible.value = true;
}

function closeModal() {
  isContactModalVisible.value = false;
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
.w-full.md\:w-1\/2:hover .bg-white,
.p-4.md\:w-1\/2:hover .bg-white {
  transform: translateY(-4px);
  transition: all 0.3s ease;
}

/* Image gallery hover effect */
.p-4.md\:w-1\/2.lg\:w-1\/3:hover img {
  transform: scale(1.03);
  transition: all 0.3s ease;
}

.p-4.md\:w-1\/2.lg\:w-1\/3 img {
  transition: all 0.3s ease;
}
</style>