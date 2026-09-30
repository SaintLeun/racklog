<template>
  <footer class="bg-ink-950 text-neutral-400">
    <div class="container-page">
      <!-- CTA destacado -->
      <div class="border-b border-white/10 py-12 sm:py-14">
        <div class="flex flex-col gap-6 rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
          <div class="max-w-xl">
            <p class="text-sm font-semibold uppercase tracking-wider text-brand-400">Cotización sin compromiso</p>
            <p class="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Solicita tu cotización</p>
            <p class="mt-2 text-neutral-400">Te respondemos en menos de 24 horas con una propuesta a medida.</p>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row">
            <button type="button" class="btn btn-primary btn-lg" @click="openContactModal">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Contáctanos ahora
            </button>
            <router-link to="/carrito" class="btn btn-ghost-light btn-lg">Solicitar cotización</router-link>
          </div>
        </div>
      </div>

      <!-- Columnas -->
      <div class="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        <!-- Empresa -->
        <div class="space-y-6 lg:col-span-4">
          <img loading="lazy" decoding="async" src="/assets/images/logo-white.webp" alt="Racklog" width="250" height="69" class="h-10 w-auto" />
          <p class="max-w-sm text-sm leading-relaxed text-neutral-400">
            Desde 2008 ofreciendo soluciones de almacenamiento industrial de alta calidad, diseñadas para optimizar espacios y mejorar la eficiencia logística de nuestros clientes.
          </p>
          <div class="flex gap-2">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Racklog en Facebook" class="footer-social">
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Racklog en Instagram" class="footer-social">
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="Racklog en LinkedIn" class="footer-social">
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Productos -->
        <div class="lg:col-span-2">
          <h3 class="footer-heading">Productos</h3>
          <ul class="mt-5 space-y-1">
            <li v-for="category in productCategories" :key="category.id">
              <router-link :to="`/productos?categoria=${category.id}`" class="footer-link">{{ category.name }}</router-link>
            </li>
            <li>
              <router-link to="/productos" class="footer-link footer-link--accent whitespace-nowrap">Ver todos los productos →</router-link>
            </li>
          </ul>
        </div>

        <!-- Enlaces -->
        <div class="lg:col-span-2">
          <h3 class="footer-heading">Enlaces útiles</h3>
          <ul class="mt-5 space-y-1">
            <li><router-link to="/nosotros" class="footer-link">Nosotros</router-link></li>
            <li><router-link to="/productos" class="footer-link">Catálogo de productos</router-link></li>
            <li><router-link to="/carrito" class="footer-link">Solicitar cotización</router-link></li>
            <li><a href="#" @click.prevent="openContactModal" class="footer-link">Contacto</a></li>
            <li><router-link to="/blog" class="footer-link">Proyectos recientes</router-link></li>
          </ul>
        </div>

        <!-- Contacto -->
        <div class="sm:col-span-2 lg:col-span-4">
          <h3 class="footer-heading">Contáctanos</h3>
          <ul class="mt-5 space-y-4 text-sm">
            <li class="flex items-start gap-3">
              <span class="footer-icon" aria-hidden="true">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <div class="pt-1.5">
                <p class="text-neutral-300">El Juncal 161-C,</p>
                <p class="text-neutral-300">Quilicura, Santiago - Chile</p>
              </div>
            </li>
            <li class="flex items-center gap-3">
              <span class="footer-icon" aria-hidden="true">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <a href="tel:+56932403819" class="text-neutral-300 transition-colors hover:text-white">(+56) 9 3240 3819</a>
            </li>
            <li class="flex items-center gap-3">
              <span class="footer-icon" aria-hidden="true">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <a href="mailto:contacto@racklog.cl" class="text-neutral-300 transition-colors hover:text-white">contacto@racklog.cl</a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Productos destacados -->
      <div class="border-t border-white/10 py-12">
        <h3 class="footer-heading">Productos destacados</h3>
        <ul class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <li v-for="product in featuredProducts" :key="product.name">
            <router-link :to="`/productos/${product.slug}`" class="group block">
              <div class="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/10">
                <img loading="lazy" decoding="async" :src="product.images?.card" :alt="product.name" width="320" height="240" class="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-105 group-hover:opacity-100" />
              </div>
              <p class="mt-2.5 truncate text-sm font-medium text-neutral-300 transition-colors group-hover:text-white">{{ product.name }}</p>
            </router-link>
          </li>
        </ul>
      </div>
    </div>

    <!-- Legal -->
    <div class="border-t border-white/10">
      <div class="container-page flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
        <p class="text-sm text-neutral-400">
          © {{ new Date().getFullYear() }} Racklog. Todos los derechos reservados.
        </p>
        <ul class="flex flex-wrap justify-center gap-x-6 gap-y-1">
          <li><NuxtLink to="/terminos" class="legal-link">Términos y Condiciones</NuxtLink></li>
          <li><NuxtLink to="/politica-privacidad" class="legal-link">Política de Privacidad</NuxtLink></li>
          <li><NuxtLink to="/politica-cookies" class="legal-link">Política de Cookies</NuxtLink></li>
          <li><button type="button" @click="openConsentSettings" class="legal-link">Configurar cookies</button></li>
        </ul>
      </div>
    </div>

    <!-- Contact Modal -->
    <ContactModal
      :isVisible="isContactModalOpen"
      @close="closeContactModal"
    />
  </footer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useProductStore } from '../stores/productStore';
import ContactModal from '~/components/ContactModal.vue';

const { openSettings: openConsentSettings } = useConsent();

const productStore = useProductStore();
const products = computed(() => productStore.products);
const isContactModalOpen = ref(false);

// Product categories for menu
const productCategories = [
  { id: 'racks', name: 'Racks Industriales' },
  { id: 'estanterias', name: 'Estanterías Metálicas' },
  { id: 'mezzanines', name: 'Mezzanines' },
  { id: 'accesorios', name: 'Accesorios' }
];

// Featured products for the footer
const featuredProducts = computed(() => {
  const allProducts = Object.values(products.value);
  // First try to get featured products
  const featured = allProducts.filter(product => product.featured);
  
  // If we have featured products, show them (up to 6)
  if (featured.length > 0) {
    return featured.slice(0, 6);
  }
  
  // Otherwise show the first 6 products
  return allProducts.slice(0, 6);
});

function openContactModal() {
  isContactModalOpen.value = true;
}

function closeContactModal() {
  isContactModalOpen.value = false;
}
</script>

<style scoped>
.footer-heading {
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
}
.footer-link {
  display: inline-flex;
  align-items: center;
  min-height: 2.25rem;
  font-size: 0.9375rem;
  color: #a3a3a3;
  transition: color 0.15s ease;
}
.footer-link:hover {
  color: #fff;
}
.footer-link--accent {
  font-weight: 600;
  color: #fb923c;
}
.footer-link--accent:hover {
  color: #fdba74;
}
.footer-social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  color: #d4d4d4;
  background-color: rgb(255 255 255 / 0.05);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1);
  transition: color 0.15s ease, background-color 0.15s ease;
}
.footer-social:hover {
  color: #fff;
  background-color: rgb(255 255 255 / 0.12);
}
.footer-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  color: #fb923c;
  background-color: rgb(255 255 255 / 0.05);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1);
}
.legal-link {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  font-size: 0.875rem;
  color: #a3a3a3;
  transition: color 0.15s ease;
}
.legal-link:hover {
  color: #fff;
}
</style>
