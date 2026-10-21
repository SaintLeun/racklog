<template>
  <!-- Layout de landing: sin el menú completo del sitio, para que el visitante se enfoque en cotizar -->
  <div class="flex min-h-screen flex-col">
    <header class="sticky top-0 z-40">
      <div class="absolute inset-0 -z-10 border-b border-neutral-200/80 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/75" aria-hidden="true"></div>
      <div class="container-page flex h-16 items-center justify-between gap-3">
        <NuxtLink to="/" class="flex flex-shrink-0 items-center">
          <img src="/assets/images/logo.webp" alt="Racklog - inicio" width="709" height="184" fetchpriority="high" class="h-8 w-auto sm:h-9" />
        </NuxtLink>
        <nav aria-label="Landing" class="flex items-center gap-1 sm:gap-3">
          <NuxtLink to="/productos" class="inline-flex min-h-11 items-center rounded-lg px-2.5 text-[15px] font-medium text-neutral-700 transition-colors hover:text-neutral-950 sm:px-3">
            Ver productos
          </NuxtLink>
          <NuxtLink to="/planifica-tu-bodega/disena" class="btn btn-primary h-11 px-4 text-[15px] sm:px-5" @click="marcarCotizar">
            Cotizar
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main id="contenido" class="flex-grow">
      <slot />
    </main>

    <footer class="bg-ink-950 text-neutral-400">
      <div class="container-page flex flex-col gap-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>© {{ anio }} Racklog. Fabricantes de racks industriales en Quilicura, Chile.</p>
        <nav aria-label="Legal" class="flex flex-wrap gap-x-5">
          <NuxtLink to="/politica-privacidad" class="inline-flex min-h-11 items-center hover:text-white">Política de privacidad</NuxtLink>
          <NuxtLink to="/terminos" class="inline-flex min-h-11 items-center hover:text-white">Términos</NuxtLink>
          <button type="button" class="inline-flex min-h-11 items-center hover:text-white" @click="openSettings">Configurar cookies</button>
        </nav>
      </div>
    </footer>

    <ClientOnly>
      <CookieBanner />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
const anio = new Date().getFullYear();
const { openSettings } = useConsent();

function marcarCotizar() {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event: 'cta_click', event_category: 'Landing', ubicacion: 'header' });
}
</script>
