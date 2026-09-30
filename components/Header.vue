<template>
  <!-- Barra superior de contacto (solo escritorio) -->
  <div class="hidden md:block bg-ink-950 text-neutral-300">
    <div class="container-page flex h-10 items-center justify-between gap-6 text-[13px]">
      <div class="flex items-center gap-6">
        <a href="tel:+56932403819" class="inline-flex items-center gap-2 transition-colors hover:text-white">
          <svg class="h-3.5 w-3.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          (+56) 9 3240 3819
        </a>
        <a href="mailto:contacto@racklog.cl" class="inline-flex items-center gap-2 transition-colors hover:text-white">
          <svg class="h-3.5 w-3.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          contacto@racklog.cl
        </a>
        <span class="hidden lg:inline-flex items-center gap-2">
          <svg class="h-3.5 w-3.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Lun - Vie: 8:30 AM - 6:00 PM
        </span>
        <span class="hidden xl:inline-flex items-center gap-2">
          <svg class="h-3.5 w-3.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          El Juncal 161-C, Quilicura, Santiago - Chile.
        </span>
      </div>

      <!-- Redes sociales -->
      <div class="flex items-center gap-1">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Racklog en Facebook" class="social-link">
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd" />
          </svg>
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="Racklog en LinkedIn" class="social-link">
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Racklog en Instagram" class="social-link">
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd" />
          </svg>
        </a>
      </div>
    </div>
  </div>

  <!-- Header principal (sticky). Sin filtros en <header> para no romper
       elementos fixed; el desenfoque va en la capa de fondo. -->
  <header class="sticky top-0 z-40">
    <div class="absolute inset-0 -z-10 border-b border-neutral-200/80 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/75" aria-hidden="true"></div>

    <div class="container-page flex h-16 items-center justify-between gap-4 lg:h-[72px]">
      <!-- Logo -->
      <NuxtLink to="/" class="flex flex-shrink-0 items-center" @click="closeAllMenus">
        <img src="/assets/images/logo.webp" alt="Racklog - inicio" width="709" height="184" fetchpriority="high" class="h-9 w-auto lg:h-10" />
      </NuxtLink>

      <!-- Navegacion de escritorio -->
      <nav aria-label="Principal" class="hidden lg:flex items-center gap-1">
        <NuxtLink to="/" class="nav-link" @click="closeAllMenus">Inicio</NuxtLink>
        <NuxtLink to="/nosotros" class="nav-link" @click="closeAllMenus">Nosotros</NuxtLink>
        <NuxtLink to="/blog" class="nav-link" @click="closeAllMenus">Proyectos recientes</NuxtLink>

        <!-- Productos -->
        <div class="relative dropdown-container">
          <button type="button" class="nav-link" aria-haspopup="true">
            Productos
            <svg class="dropdown-caret h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            class="dropdown-menu absolute left-1/2 top-full mt-3 w-[600px] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-2xl bg-white shadow-xl shadow-neutral-900/10 ring-1 ring-neutral-900/5"
            role="menu"
            aria-orientation="vertical"
            tabindex="-1"
          >
            <div class="grid grid-cols-[1.3fr_1fr]">
              <!-- Productos destacados -->
              <div class="p-5">
                <h3 class="px-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Productos Destacados</h3>
                <div class="mt-3 space-y-1">
                  <router-link
                    v-for="product in featuredProducts"
                    :key="product.id"
                    :to="'/productos/' + product.slug"
                    @click="closeAllMenus"
                    class="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-neutral-50"
                  >
                    <div class="aspect-[4/3] w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-neutral-200">
                      <img loading="lazy" decoding="async" :src="product.images?.card || ''" :alt="product.name" width="160" height="120" class="h-full w-full object-cover" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-neutral-900">{{ product.name }}</p>
                      <p class="line-clamp-1 text-xs text-neutral-600">{{ product.description?.short }}</p>
                    </div>
                  </router-link>
                </div>
              </div>

              <!-- Categorias -->
              <div class="flex flex-col bg-neutral-50 p-5">
                <h3 class="px-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Categorías</h3>
                <ul class="mt-3 space-y-0.5">
                  <li v-for="category in productCategories" :key="category.id">
                    <router-link
                      :to="'/productos?categoria=' + category.id"
                      @click="closeAllMenus"
                      class="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-white hover:text-neutral-900"
                    >
                      {{ category.name }}
                      <svg class="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </router-link>
                  </li>
                </ul>

                <router-link
                  to="/productos"
                  @click="closeAllMenus"
                  class="link-arrow mt-auto rounded-lg px-2 pt-4 text-sm"
                >
                  Ver todos los productos
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Servicios -->
        <div class="relative dropdown-container">
          <button type="button" class="nav-link" aria-haspopup="true">
            Servicios
            <svg class="dropdown-caret h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            class="dropdown-menu absolute left-0 top-full mt-3 w-72 rounded-2xl bg-white p-3 shadow-xl shadow-neutral-900/10 ring-1 ring-neutral-900/5"
            role="menu"
            aria-orientation="vertical"
            tabindex="-1"
          >
            <h3 class="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Nuestros Servicios</h3>
            <div class="mt-2 space-y-0.5">
              <router-link
                v-for="service in services"
                :key="service.id"
                :to="'/servicios/' + service.slug"
                @click="closeAllMenus"
                class="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-neutral-50"
              >
                <span class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-600/10" aria-hidden="true">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span class="text-sm font-medium text-neutral-800">{{ service.name }}</span>
              </router-link>
            </div>
          </div>
        </div>
      </nav>

      <!-- Acciones -->
      <div class="flex items-center gap-1 sm:gap-2">
        <router-link
          to="/carrito"
          class="relative inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          @click="closeAllMenus"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span class="sr-only xl:not-sr-only">Cotización</span>
          <span
            v-if="cartCount > 0"
            class="absolute right-0.5 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-[11px] font-bold text-white ring-2 ring-white xl:static xl:ring-0"
          >
            {{ cartCount }}
          </span>
        </router-link>

        <button type="button" class="btn btn-primary btn-sm hidden sm:inline-flex min-h-10 px-4" @click="openContactModal">
          Cotizar
        </button>

        <button
          type="button"
          @click="toggleMenu"
          class="inline-flex h-11 w-11 items-center justify-center rounded-xl text-neutral-800 transition-colors hover:bg-neutral-100 lg:hidden"
          :aria-label="isMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
          :aria-expanded="isMenuOpen ? 'true' : 'false'"
          aria-controls="menu-movil"
        >
          <svg v-if="!isMenuOpen" aria-hidden="true" class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <svg v-else aria-hidden="true" class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Menu movil -->
    <div
      id="menu-movil"
      :inert="!isMenuOpen"
      :class="isMenuOpen ? 'max-h-[calc(100dvh-4rem)] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'"
      class="border-t border-neutral-200/80 bg-white transition-all duration-300 ease-in-out lg:hidden"
    >
      <nav aria-label="Menú móvil" class="container-page py-4">
        <ul class="space-y-1">
          <li><NuxtLink to="/" @click="closeAllMenus" class="mobile-link">Inicio</NuxtLink></li>
          <li><NuxtLink to="/nosotros" @click="closeAllMenus" class="mobile-link">Nosotros</NuxtLink></li>
          <li><NuxtLink to="/blog" @click="closeAllMenus" class="mobile-link">Proyectos recientes</NuxtLink></li>

          <!-- Productos -->
          <li>
            <button
              type="button"
              @click="toggleMobileSubmenu('productos')"
              :aria-expanded="openMobileSubmenu === 'productos' ? 'true' : 'false'"
              class="mobile-link w-full justify-between"
            >
              <span>Productos</span>
              <svg
                class="h-5 w-5 text-neutral-400 transition-transform duration-200"
                :class="{ 'rotate-180': openMobileSubmenu === 'productos' }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div v-if="openMobileSubmenu === 'productos'" class="mb-2 ml-3 mt-1 space-y-0.5 border-l border-neutral-200 pl-3">
              <router-link
                v-for="category in productCategories"
                :key="category.id"
                :to="'/productos?categoria=' + category.id"
                @click="closeAllMenus"
                class="mobile-sublink"
              >
                {{ category.name }}
              </router-link>
              <router-link to="/productos" @click="closeAllMenus" class="mobile-sublink mobile-sublink--all">
                Ver todos los productos →
              </router-link>
            </div>
          </li>

          <!-- Servicios -->
          <li>
            <button
              type="button"
              @click="toggleMobileSubmenu('servicios')"
              :aria-expanded="openMobileSubmenu === 'servicios' ? 'true' : 'false'"
              class="mobile-link w-full justify-between"
            >
              <span>Servicios</span>
              <svg
                class="h-5 w-5 text-neutral-400 transition-transform duration-200"
                :class="{ 'rotate-180': openMobileSubmenu === 'servicios' }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div v-if="openMobileSubmenu === 'servicios'" class="mb-2 ml-3 mt-1 space-y-0.5 border-l border-neutral-200 pl-3">
              <router-link
                v-for="service in services"
                :key="service.id"
                :to="'/servicios/' + service.slug"
                @click="closeAllMenus"
                class="mobile-sublink"
              >
                {{ service.name }}
              </router-link>
            </div>
          </li>

          <li>
            <button type="button" @click="closeAllMenus(); openContactModal()" class="mobile-link w-full">Contacto</button>
          </li>
        </ul>

        <div class="mt-4 grid gap-2 border-t border-neutral-200 pt-4 sm:grid-cols-2">
          <router-link to="/carrito" @click="closeAllMenus" class="btn btn-secondary justify-between">
            <span class="inline-flex items-center gap-2">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Mi Cotización
            </span>
            <span v-if="cartCount > 0" class="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-700 px-1.5 text-xs font-bold text-white">
              {{ cartCount }}
            </span>
          </router-link>
          <button type="button" class="btn btn-primary" @click="openContactModal">Cotizar</button>
        </div>

        <div class="mt-4 flex flex-col gap-1 text-sm text-neutral-600">
          <a href="tel:+56932403819" class="inline-flex min-h-11 items-center gap-2 hover:text-neutral-900">
            <svg class="h-4 w-4 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            (+56) 9 3240 3819
          </a>
          <a href="mailto:contacto@racklog.cl" class="inline-flex min-h-11 items-center gap-2 hover:text-neutral-900">
            <svg class="h-4 w-4 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            contacto@racklog.cl
          </a>
        </div>
      </nav>
    </div>
  </header>

  <!-- Modal de contacto (fuera del header sticky para no quedar atrapado en su contexto de apilamiento) -->
  <ContactModal
    :isVisible="isContactModalOpen"
    @close="closeContactModal"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useProductStore } from '~/stores/productStore';
import { useCartStore } from '~/stores/cartStore'; 
import { useRouter } from 'vue-router'; 
import { storeToRefs } from 'pinia'; 
import ContactModal from '~/components/ContactModal.vue';

// Abrir el formulario de contacto una vez por sesion, 3 s despues de cargar la pagina
const AUTO_OPEN_DELAY_MS = 3000;

onMounted(() => {
  try {
    if (sessionStorage.getItem('contactModalShown')) return;
  } catch {
    return; // Sin sessionStorage no se abre automaticamente
  }

  setTimeout(() => {
    openContactModal();
    try {
      sessionStorage.setItem('contactModalShown', 'true');
    } catch {
      // Ignorar: sin sessionStorage solo se pierde el "una vez por sesion"
    }
  }, AUTO_OPEN_DELAY_MS);
});

const productStore = useProductStore();
const products = productStore.products;
const services = productStore.services || [];

const cartStore = useCartStore();
const { cartCount } = storeToRefs(cartStore);

const isMenuOpen = ref(false);
const openMobileSubmenu = ref(null);
const isContactModalOpen = ref(false);
const router = useRouter();

// Categorías de productos para el menú
const productCategories = [
  { id: 'racks', name: 'Racks Industriales' },
  { id: 'estanterias', name: 'Estanterías Metálicas' },
  { id: 'mezzanines', name: 'Mezzanines' },
  { id: 'accesorios', name: 'Accesorios' },
];

// Productos destacados para mostrar en el menú
const featuredProducts = computed(() => {
  const allProducts = Object.values(products);
  // Primero intentamos obtener productos destacados
  const featured = allProducts.filter(product => product.featured);
  
  // Si hay productos destacados, los mostramos (hasta 3)
  if (featured.length > 0) {
    return featured.slice(0, 3);
  }
  
  // Si no hay destacados, mostramos los primeros 3 productos
  return allProducts.slice(0, 3);
});

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
  // Si cerramos el menú, también cerramos cualquier submenú
  if (!isMenuOpen.value) {
    openMobileSubmenu.value = null;
  }
}

function toggleMobileSubmenu(menuName) {
  openMobileSubmenu.value = openMobileSubmenu.value === menuName ? null : menuName;
}

// Función para cerrar todos los menús al hacer clic en un enlace
function closeAllMenus() {
  isMenuOpen.value = false;
  openMobileSubmenu.value = null;
}

function goToCart() {
  router.push('/carrito');
  closeAllMenus();
}

function openContactModal() {
  isContactModalOpen.value = true;
  closeAllMenus();
}

function closeContactModal() {
  isContactModalOpen.value = false;
}

// Cerrar los menús cuando la ruta cambia
watch(
  () => router.currentRoute.value.path,
  () => {
    closeAllMenus();
  }
);
</script>

<style scoped>
/* Enlaces de la navegacion principal */
.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 2.75rem;
  padding: 0 0.875rem;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #404040;
  transition: color 0.15s ease, background-color 0.15s ease;
}
.nav-link:hover,
.dropdown-container:hover > .nav-link,
.dropdown-container:focus-within > .nav-link {
  color: #171717;
  background-color: #f5f5f5;
}
.nav-link.router-link-exact-active {
  color: #171717;
  font-weight: 600;
}

/* Iconos sociales de la barra superior */
.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  color: #a3a3a3;
  transition: color 0.15s ease, background-color 0.15s ease;
}
.social-link:hover {
  color: #fff;
  background-color: rgb(255 255 255 / 0.08);
}

/* Menu movil */
.mobile-link {
  display: flex;
  align-items: center;
  min-height: 3rem;
  padding: 0 0.75rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  color: #262626;
  text-align: left;
  transition: background-color 0.15s ease;
}
.mobile-link:hover {
  background-color: #f5f5f5;
}
.mobile-link.router-link-exact-active {
  color: #c2410c;
  font-weight: 600;
}
.mobile-sublink {
  display: flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0 0.75rem;
  border-radius: 0.625rem;
  font-size: 0.9375rem;
  color: #525252;
  transition: color 0.15s ease, background-color 0.15s ease;
}
.mobile-sublink:hover {
  color: #171717;
  background-color: #f5f5f5;
}
.mobile-sublink--all {
  font-weight: 600;
  color: #c2410c;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Dropdowns: se abren con hover y con :focus-within (teclado) */
.dropdown-caret {
  transition: transform 0.2s ease;
}
.dropdown-container:hover .dropdown-caret,
.dropdown-container:focus-within .dropdown-caret {
  transform: rotate(180deg);
}

.dropdown-menu {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(6px);
  transition: opacity 0.2s ease 0.1s, transform 0.2s ease 0.1s, visibility 0s linear 0.3s;
}

.dropdown-container:hover .dropdown-menu,
.dropdown-container:focus-within .dropdown-menu,
.dropdown-menu:hover {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0s linear 0s;
}

/* Puente invisible entre el boton y el panel para que el hover no se corte */
.dropdown-container::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 0.875rem;
}
</style>
