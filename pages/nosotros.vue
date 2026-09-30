<template>
  <div class="about-page">
    <!-- Hero -->
    <section class="page-hero">
      <div class="container-page">
        <div class="max-w-3xl">
          <span class="eyebrow bg-white/5 text-brand-300 ring-white/10">Desde 2008</span>
          <h1 class="page-hero__title mt-5">
            Sobre <span class="text-brand-500">Nosotros</span>
          </h1>
          <p class="page-hero__lead">
            Expertos en soluciones de almacenamiento industrial en Chile con más de 15 años de experiencia
          </p>
        </div>
      </div>
    </section>

    <!-- Breadcrumbs -->
    <div class="border-b border-neutral-200">
      <div class="container-page">
        <Breadcrumbs :breadcrumbs="breadcrumbs" />
      </div>
    </div>

    <!-- Quiénes Somos -->
    <section class="section">
      <div class="container-page">
        <div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div class="section-header section-header--left mb-8 sm:mb-8">
              <span class="eyebrow">Nuestra empresa</span>
              <h2 class="section-title">Quiénes Somos</h2>
            </div>

            <div class="space-y-5 text-base leading-relaxed text-neutral-700 sm:text-lg">
              <p>
                Fundada en 2008, Racklog es una empresa chilena especializada en el diseño, fabricación e instalación de sistemas de almacenamiento industrial. Nuestro compromiso con la calidad y la innovación nos ha posicionado como referentes en el mercado, ofreciendo soluciones personalizadas que optimizan el espacio y mejoran la eficiencia logística.
              </p>
              <p>
                A lo largo de nuestra trayectoria, hemos colaborado con empresas de diversos sectores, desde pequeñas y medianas empresas hasta grandes corporaciones, adaptando nuestras soluciones a las necesidades específicas de cada cliente.
              </p>
              <p>
                En Racklog entendemos que la eficiencia en el almacenamiento es crucial para el éxito operativo de cualquier negocio. Por eso, nuestro equipo de profesionales trabaja de la mano con cada cliente, analizando sus requerimientos y diseñando soluciones a medida que maximizan el espacio disponible y optimizan los procesos logísticos.
              </p>
            </div>

            <div class="mt-10 grid gap-4 sm:grid-cols-2">
              <div class="flex items-start gap-4 rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-200/80">
                <span class="icon-tile" aria-hidden="true">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </span>
                <div>
                  <h3 class="font-semibold text-neutral-900">Calidad Garantizada</h3>
                  <p class="mt-1 text-sm text-neutral-600">Materiales y fabricación de primer nivel</p>
                </div>
              </div>

              <div class="flex items-start gap-4 rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-200/80">
                <span class="icon-tile" aria-hidden="true">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </span>
                <div>
                  <h3 class="font-semibold text-neutral-900">Servicio Ágil</h3>
                  <p class="mt-1 text-sm text-neutral-600">Respuesta rápida y eficiente</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="overflow-hidden rounded-2xl bg-ink-950 shadow-xl shadow-neutral-900/10 ring-1 ring-neutral-900/5">
              <video
                class="block aspect-video h-auto w-full"
                controls
                preload="none"
                poster="/assets/images/nosotros-poster.webp"
                width="1280"
                height="720"
                playsinline
                aria-label="Video institucional de Racklog"
              >
                <source src="/assets/videos/nosotros.mp4" type="video/mp4">
                Su navegador no soporta la reproducción de videos.
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Misión y Visión -->
    <section class="section section-muted">
      <div class="container-page">
        <div class="grid gap-6 md:grid-cols-2 lg:gap-8">
          <div class="card card-body sm:p-8 lg:p-10">
            <span class="icon-tile" aria-hidden="true">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </span>
            <h3 class="mt-6 text-2xl font-bold tracking-tight text-neutral-900">Nuestra Misión</h3>
            <p class="mt-3 leading-relaxed text-neutral-700">
              Proveer soluciones de almacenamiento industrial de alta calidad que optimicen el espacio y los procesos logísticos de nuestros clientes, contribuyendo a mejorar su eficiencia operativa y generando relaciones de confianza a largo plazo mediante un servicio personalizado y comprometido.
            </p>
          </div>

          <div class="card card-body sm:p-8 lg:p-10">
            <span class="icon-tile" aria-hidden="true">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </span>
            <h3 class="mt-6 text-2xl font-bold tracking-tight text-neutral-900">Nuestra Visión</h3>
            <p class="mt-3 leading-relaxed text-neutral-700">
              Ser la empresa líder en soluciones de almacenamiento industrial en Chile, reconocida por nuestra innovación constante, excelencia en el servicio y compromiso con el éxito de nuestros clientes, impulsando la eficiencia logística en todos los sectores industriales.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Valores -->
    <section class="section">
      <div class="container-page">
        <div class="section-header">
          <span class="eyebrow">Lo que nos guía</span>
          <h2 class="section-title">Nuestros Valores</h2>
          <p class="section-lead">
            Estos principios fundamentales guían nuestras decisiones y definen la forma en que trabajamos y nos relacionamos con nuestros clientes y colaboradores.
          </p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="valor in valores" :key="valor.title" class="card card-body">
            <span class="icon-tile" aria-hidden="true">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="valor.icon"></path>
              </svg>
            </span>
            <h3 class="card-title mt-5">{{ valor.title }}</h3>
            <p class="card-text">{{ valor.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Por qué elegirnos -->
    <section class="section section-dark">
      <div class="container-page">
        <div class="section-header">
          <span class="eyebrow">Por qué Racklog</span>
          <h2 class="section-title">¿Por qué elegir <span class="text-brand-500">Racklog</span>?</h2>
          <p class="section-lead">
            Ofrecemos soluciones integrales y personalizadas para cada cliente, con un servicio de alta calidad y profesionales especializados.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-3">
          <div v-for="razon in razones" :key="razon.title" class="rounded-(--radius-card) bg-white/[0.03] p-6 ring-1 ring-white/10 sm:p-8">
            <span class="icon-tile" aria-hidden="true">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="razon.icon"></path>
              </svg>
            </span>
            <h3 class="mt-5 text-lg font-semibold tracking-tight">{{ razon.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-neutral-400">{{ razon.text }}</p>
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

  // Contenido visual (valores y razones), antes repetido en la plantilla
  const valores = [
    {
      title: 'Compromiso',
      text: 'Nos comprometemos plenamente con cada proyecto, asegurando resultados de calidad que superan las expectativas de nuestros clientes.',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    },
    {
      title: 'Calidad',
      text: 'Nos esforzamos por la excelencia en todo lo que hacemos, desde la selección de materiales hasta la atención al cliente.',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
    {
      title: 'Innovación',
      text: 'Buscamos constantemente nuevas soluciones y mejores formas de abordar los desafíos logísticos de nuestros clientes.',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    },
    {
      title: 'Transparencia',
      text: 'Actuamos con honestidad y ética en todas nuestras relaciones comerciales, construyendo confianza a largo plazo.',
      icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
    },
  ];

  const razones = [
    {
      title: 'Experiencia Comprobada',
      text: 'Más de 15 años ofreciendo soluciones de almacenamiento industrial de alta calidad en todo Chile.',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
    {
      title: 'Soluciones Personalizadas',
      text: 'Adaptamos nuestros productos y servicios a las necesidades específicas de cada cliente y espacio disponible.',
      icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    },
    {
      title: 'Equipo Especializado',
      text: 'Contamos con profesionales altamente capacitados en logística, ingeniería y diseño de sistemas de almacenamiento.',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    },
  ];

usePageSeo({
  title: 'Nosotros',
  description: 'Conoce a Racklog: desde 2008 diseñamos, fabricamos e instalamos soluciones de almacenamiento industrial para empresas en todo Chile.',
});
</script>
