<template>
  <div class="about-page">
    <!-- Hero Section -->
    <section class="relative bg-neutral-900 py-16 lg:py-20 overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-neutral-900 opacity-80"></div>
        <div class="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-transparent"></div>
        <div class="grid grid-cols-12 grid-rows-6 h-full w-full opacity-20">
          <div class="col-span-1 row-span-1 border-r border-b border-gray-500"></div>
          <div class="col-span-2 row-span-2 border-r border-b border-gray-500"></div>
          <div class="col-start-10 col-span-3 row-span-2 border-l border-b border-gray-500"></div>
          <div class="col-start-4 col-span-2 row-start-4 row-span-2 border-l border-t border-gray-500"></div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="container mx-auto px-6 relative z-10">
        <div class="max-w-3xl mx-auto text-center">
          <h1 class="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Sobre <span class="text-orange-500">Nosotros</span>
          </h1>
          <p class="text-gray-300 text-lg md:text-xl mb-8">
            Expertos en soluciones de almacenamiento industrial en Chile con más de 15 años de experiencia 
          </p>
        </div>
      </div>
    </section>

    <!-- Breadcrumbs -->
    <div class="border-b border-gray-200">
      <div class="container mx-auto px-6">
        <Breadcrumbs :breadcrumbs="breadcrumbs" />
      </div>
    </div>

    <!-- Quiénes Somos Section -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-6">
        <div class="flex flex-col lg:flex-row items-center gap-12">
          <div class="lg:w-1/2">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Quiénes Somos</h2>
            <div class="w-20 h-1.5 bg-orange-500 rounded-full mb-8"></div>
            
            <p class="text-gray-700 mb-6 leading-relaxed">
              Fundada en 2008, Racklog es una empresa chilena especializada en el diseño, fabricación e instalación de sistemas de almacenamiento industrial. Nuestro compromiso con la calidad y la innovación nos ha posicionado como referentes en el mercado, ofreciendo soluciones personalizadas que optimizan el espacio y mejoran la eficiencia logística.
            </p>
            
            <p class="text-gray-700 mb-6 leading-relaxed">
              A lo largo de nuestra trayectoria, hemos colaborado con empresas de diversos sectores, desde pequeñas y medianas empresas hasta grandes corporaciones, adaptando nuestras soluciones a las necesidades específicas de cada cliente.
            </p>
            
            <p class="text-gray-700 mb-8 leading-relaxed">
              En Racklog entendemos que la eficiencia en el almacenamiento es crucial para el éxito operativo de cualquier negocio. Por eso, nuestro equipo de profesionales trabaja de la mano con cada cliente, analizando sus requerimientos y diseñando soluciones a medida que maximizan el espacio disponible y optimizan los procesos logísticos.
            </p>
            
            <div class="flex flex-wrap gap-3">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                  <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <div>
                  <h4 class="font-bold text-gray-900">Calidad Garantizada</h4>
                  <p class="text-sm text-gray-600">Materiales y fabricación de primer nivel</p>
                </div>
              </div>
              
              <div class="flex items-center">
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                  <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div>
                  <h4 class="font-bold text-gray-900">Servicio Ágil</h4>
                  <p class="text-sm text-gray-600">Respuesta rápida y eficiente</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="lg:w-1/2">
            <div class="relative">
              <div class="absolute -bottom-6 -left-6 w-32 h-32 bg-orange-500/10 rounded-lg"></div>
              <div class="absolute -top-6 -right-6 w-32 h-32 bg-orange-500/10 rounded-lg"></div>
              
              <div class="rounded-lg shadow-lg overflow-hidden relative z-10">
                <video 
                  class="w-full h-auto"
                  controls
                >
                  <source src="/assets/videos/nosotros.mp4" type="video/mp4">
                  Su navegador no soporta la reproducción de videos.
                </video>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Misión y Visión -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Misión -->
          <div class="bg-white p-8 rounded-xl shadow-sm">
            <div class="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Nuestra Misión</h3>
            <p class="text-gray-700 leading-relaxed">
              Proveer soluciones de almacenamiento industrial de alta calidad que optimicen el espacio y los procesos logísticos de nuestros clientes, contribuyendo a mejorar su eficiencia operativa y generando relaciones de confianza a largo plazo mediante un servicio personalizado y comprometido.
            </p>
          </div>
          
          <!-- Visión -->
          <div class="bg-white p-8 rounded-xl shadow-sm">
            <div class="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Nuestra Visión</h3>
            <p class="text-gray-700 leading-relaxed">
              Ser la empresa líder en soluciones de almacenamiento industrial en Chile, reconocida por nuestra innovación constante, excelencia en el servicio y compromiso con el éxito de nuestros clientes, impulsando la eficiencia logística en todos los sectores industriales.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Valores -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Nuestros Valores</h2>
          <div class="w-20 h-1.5 bg-orange-500 rounded-full mx-auto mb-6"></div>
          <p class="text-gray-700 max-w-2xl mx-auto">
            Estos principios fundamentales guían nuestras decisiones y definen la forma en que trabajamos y nos relacionamos con nuestros clientes y colaboradores.
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Valor 1 -->
          <div class="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Compromiso</h3>
            <p class="text-gray-700">
              Nos comprometemos plenamente con cada proyecto, asegurando resultados de calidad que superan las expectativas de nuestros clientes.
            </p>
          </div>
          
          <!-- Valor 2 -->
          <div class="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Calidad</h3>
            <p class="text-gray-700">
              Nos esforzamos por la excelencia en todo lo que hacemos, desde la selección de materiales hasta la atención al cliente.
            </p>
          </div>
          
          <!-- Valor 3 -->
          <div class="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Innovación</h3>
            <p class="text-gray-700">
              Buscamos constantemente nuevas soluciones y mejores formas de abordar los desafíos logísticos de nuestros clientes.
            </p>
          </div>
          
          <!-- Valor 4 -->
          <div class="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Transparencia</h3>
            <p class="text-gray-700">
              Actuamos con honestidad y ética en todas nuestras relaciones comerciales, construyendo confianza a largo plazo.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Por Qué Elegirnos -->
    <section class="py-16 bg-neutral-900 text-white">
      <div class="container mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-4">¿Por qué elegir <span class="text-orange-500">Racklog</span>?</h2>
          <div class="w-20 h-1.5 bg-orange-500 rounded-full mx-auto mb-6"></div>
          <p class="text-gray-300 max-w-2xl mx-auto">
            Ofrecemos soluciones integrales y personalizadas para cada cliente, con un servicio de alta calidad y profesionales especializados.
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Razón 1 -->
          <div class="flex flex-col items-center p-6 bg-neutral-800 rounded-xl transition-transform hover:-translate-y-1">
            <div class="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3 text-center">Experiencia Comprobada</h3>
            <p class="text-gray-300 text-center">
              Más de 15 años ofreciendo soluciones de almacenamiento industrial de alta calidad en todo Chile.
            </p>
          </div>
          
          <!-- Razón 2 -->
          <div class="flex flex-col items-center p-6 bg-neutral-800 rounded-xl transition-transform hover:-translate-y-1">
            <div class="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3 text-center">Soluciones Personalizadas</h3>
            <p class="text-gray-300 text-center">
              Adaptamos nuestros productos y servicios a las necesidades específicas de cada cliente y espacio disponible.
            </p>
          </div>
          
          <!-- Razón 3 -->
          <div class="flex flex-col items-center p-6 bg-neutral-800 rounded-xl transition-transform hover:-translate-y-1">
            <div class="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3 text-center">Equipo Especializado</h3>
            <p class="text-gray-300 text-center">
              Contamos con profesionales altamente capacitados en logística, ingeniería y diseño de sistemas de almacenamiento.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Modal -->
    <ContactModal 
      :isVisible="isContactModalOpen" 
      @close="closeContactModal"
    />
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import Breadcrumbs from '@/components/Breadcrumbs.vue';
  import ContactModal from '@/components/ContactModal.vue';

  // Estado para el modal de contacto
  const isContactModalOpen = ref(false);

  // Datos para las migas de pan
  const breadcrumbs = [
    {
      label: 'Nosotros',
      href: '/nosotros',
      type: 'page'
    }
  ];

  // Funciones para el modal
  function openContactModal() {
    isContactModalOpen.value = true;
  }

  function closeContactModal() {
    isContactModalOpen.value = false;
  }
</script>

<style scoped>
  /* Animaciones para elementos */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  /* Mejorar interacción con elementos */
  .hover\:shadow-md {
    transition: box-shadow 0.3s ease, transform 0.3s ease;
  }

  .hover\:-translate-y-1:hover {
    transform: translateY(-4px);
  }

  /* Ajustes para imágenes */
  img {
    transition: transform 0.5s ease;
  }

  .h-64:hover img {
    transform: scale(1.05);
  }
</style>