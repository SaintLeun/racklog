<template>
  <div v-if="service" class="bg-white">
    <!-- Ficha principal -->
    <section class="pb-16 sm:pb-20">
      <div class="container-page">
        <div class="pt-4 sm:pt-6">
          <Breadcrumbs :breadcrumbs="[{label: 'Servicios', link: '/servicios'}, {label: service.name}]" />
        </div>

        <div class="mt-4 grid grid-cols-1 items-start gap-10 lg:mt-8 lg:grid-cols-2 lg:gap-14">
          <!-- Imagen principal -->
          <div class="lg:sticky lg:top-24">
            <div class="card relative aspect-[4/3] bg-neutral-100">
              <img :src="service.mainImage" :alt="service.name" width="800" height="600" loading="eager" fetchpriority="high" class="absolute inset-0 h-full w-full object-cover object-center">
            </div>
          </div>
          
          <!-- Informacion del servicio -->
          <div>
            <p class="eyebrow">Servicio</p>
            <h1 class="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">{{ service.name }}</h1>
            
            <p class="mt-5 text-lg leading-relaxed text-neutral-600">{{ service.shortDescription }}</p>
            
            <div v-if="service.highlights && service.highlights.length > 0" class="mt-8">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-900">Lo que incluye</h2>
              <ul class="mt-4 space-y-4">
                <li v-for="(highlight, index) in service.highlights" :key="index" class="flex items-start gap-3 text-neutral-700">
                  <span class="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-600/15" aria-hidden="true">
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </span>
                  <span class="leading-relaxed">
                    <strong v-if="splitHighlight(highlight).title" class="font-semibold text-neutral-900">{{ splitHighlight(highlight).title }}</strong>
                    {{ splitHighlight(highlight).body }}
                  </span>
                </li>
              </ul>
            </div>
            
            <div class="mt-10 border-t border-neutral-200 pt-8">
              <button 
                type="button"
                @click="openContactModal()" 
                class="btn btn-primary btn-lg w-full sm:w-auto"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Solicitar este servicio
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Descripcion detallada -->
    <section class="section section-muted">
      <div class="container-page">
        <div class="mx-auto max-w-3xl">
          <h2 class="section-title !mt-0">Descripción detallada</h2>
          <div class="prose-page mt-6">
            <p>{{ service.longDescription }}</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Detalles del servicio -->
    <section v-if="service.serviceDetails && service.serviceDetails.length > 0" class="section">
      <div class="container-page">
        <div class="section-header">
          <span class="eyebrow">Detalles del servicio</span>
          <h2 class="section-title">Nuestro enfoque</h2>
          <p class="section-lead">Conoce en detalle cómo trabajamos y los beneficios de nuestro servicio profesional.</p>
        </div>
        
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div v-for="(detail, index) in service.serviceDetails" :key="index" class="card card-body sm:!p-8">
            <span class="icon-tile" aria-hidden="true">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="detailIcon(detail.icon)"></path>
              </svg>
            </span>
            <h3 class="mt-5 text-xl font-semibold tracking-tight text-neutral-900">{{ detail.title }}</h3>
            <p class="mt-3 leading-relaxed text-neutral-600">{{ detail.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Galeria -->
    <section v-if="service.galleryImages && service.galleryImages.length > 0" class="section section-muted">
      <div class="container-page">
        <div class="section-header">
          <span class="eyebrow">Galería</span>
          <h2 class="section-title">Nuestro servicio en acción</h2>
          <p class="section-lead">Algunas imágenes de nuestros servicios realizados para clientes.</p>
        </div>
        
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="(image, index) in service.galleryImages" :key="index" class="card group">
            <div class="card-media">
              <img loading="lazy" decoding="async" :src="image" :alt="`${service.name} imagen ${index + 1}`" width="800" height="600">
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section
      class="section"
      :class="{ '!pt-0': service.serviceDetails?.length && !service.galleryImages?.length }"
    >
      <div class="container-page">
        <div class="section-dark overflow-hidden rounded-(--radius-card) px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
          <div class="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div class="max-w-2xl">
              <h2 class="text-2xl font-bold tracking-tight text-white sm:text-3xl">¿Necesitas asesoría especializada?</h2>
              <p class="mt-3 text-neutral-300">Nuestro equipo de expertos está disponible para responder todas tus dudas y ayudarte a encontrar la mejor solución para tu negocio.</p>
            </div>
            <button 
              type="button"
              @click="openContactModal()" 
              class="btn btn-primary btn-lg flex-shrink-0"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              Contactar ahora
            </button>
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
  <div v-else class="flex min-h-[60vh] flex-col items-center justify-center bg-neutral-50 px-6 py-24 text-center">
    <span class="icon-tile" aria-hidden="true">
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </span>
    <h2 class="mt-6 text-2xl font-bold text-neutral-900">Servicio no encontrado</h2>
    <p class="mt-2 text-neutral-600">Lo sentimos, no podemos encontrar el servicio que estás buscando.</p>
    <NuxtLink to="/" class="btn btn-primary mt-8">
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
      Volver al inicio
    </NuxtLink>
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

// Buscar el servicio durante el render para que el HTML generado tenga el contenido
service.value = services.value.find(s => s.slug === route.params.slug) ?? null;
if (!service.value) {
  throw createError({ statusCode: 404, statusMessage: 'Servicio no encontrado', fatal: true });
}

function openContactModal() {
  modalTitle.value = `Solicitar información: ${service.value.name}`;
  isContactModalVisible.value = true;
}

function closeModal() {
  isContactModalVisible.value = false;
}

// Iconos (SVG) para los detalles del servicio: los datos traen nombres de Font Awesome,
// que no se carga en el sitio. Solo visual.
const detailIconPaths = {
  'fa-search': 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  'fa-wrench': 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085',
  'fa-tools': 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085',
  'fa-users': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  'fa-truck': 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
  'fa-briefcase': 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  'fa-cogs': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  'fa-check-circle': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  'fa-handshake': 'M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11',
  'fa-cubes': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  'fa-unlink': 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244',
  'fa-award': 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
};
const defaultDetailIcon = 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
const detailIcon = (name) => detailIconPaths[name] || defaultDetailIcon;

// Separa "Titulo: descripcion" de cada punto destacado para resaltar el titulo. Solo visual.
const splitHighlight = (text) => {
  const idx = text.indexOf(':');
  if (idx > 0 && idx < 60) return { title: text.slice(0, idx + 1), body: text.slice(idx + 1).trim() };
  return { title: '', body: text };
};

usePageSeo({
  title: service.value.name,
  description: service.value.shortDescription || `${service.value.name} por Racklog en Chile.`,
});

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.value.name,
      description: service.value.shortDescription,
      provider: { '@id': 'https://racklog.cl/#organization' },
      areaServed: 'CL',
    }),
  }],
});
</script>

