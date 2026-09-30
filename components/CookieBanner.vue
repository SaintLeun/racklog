<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="opacity-0 translate-y-4"
  >
    <section
      v-if="visible"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-text"
      class="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6"
    >
      <div class="card mx-auto max-w-3xl p-5 shadow-2xl shadow-neutral-900/15 sm:p-6">
        <div class="flex items-start gap-4">
          <span class="icon-tile hidden sm:inline-flex" aria-hidden="true">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3a9 9 0 109 9 3 3 0 01-3-3 3 3 0 01-3-3 3 3 0 01-3-3z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5h.01M12 15.5h.01M15.5 13h.01M9 16h.01" />
            </svg>
          </span>
          <div class="min-w-0">
            <h2 id="cookie-banner-title" class="text-lg font-semibold tracking-tight text-neutral-900">Usamos cookies</h2>
            <p id="cookie-banner-text" class="mt-1.5 text-sm leading-relaxed text-neutral-600 sm:text-base">
              Usamos cookies propias necesarias para que el sitio funcione (por ejemplo, tu cotización).
              Con tu permiso, también usamos cookies de analítica de Google y Microsoft Clarity para medir
              visitas y mejorar el sitio. Puedes cambiar tu decisión cuando quieras desde el pie de página.
              <NuxtLink to="/politica-cookies" class="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">Más información</NuxtLink>
            </p>
          </div>
        </div>
        <div class="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" class="btn btn-secondary" @click="reject">
            Solo necesarias
          </button>
          <button type="button" class="btn btn-primary" @click="accept">
            Aceptar analítica
          </button>
        </div>
      </div>
    </section>
  </Transition>
</template>

<script setup lang="ts">
const { analytics, settingsOpen, accept, reject } = useConsent();

// Se muestra hasta que haya una decision, o cuando se reabre desde el footer
const visible = computed(() => analytics.value === 'unset' || settingsOpen.value);
</script>
