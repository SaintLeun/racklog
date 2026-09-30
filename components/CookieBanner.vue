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
      <div class="mx-auto max-w-3xl rounded-xl bg-white text-gray-800 shadow-2xl border border-gray-200 p-5 sm:p-6">
        <h2 id="cookie-banner-title" class="text-lg font-bold text-gray-900">Usamos cookies</h2>
        <p id="cookie-banner-text" class="mt-2 text-base text-gray-700 leading-relaxed">
          Usamos cookies propias necesarias para que el sitio funcione (por ejemplo, tu cotización).
          Con tu permiso, también usamos cookies de analítica de Google y Microsoft Clarity para medir
          visitas y mejorar el sitio. Puedes cambiar tu decisión cuando quieras desde el pie de página.
          <NuxtLink to="/politica-cookies" class="text-orange-700 underline hover:text-orange-800">Más información</NuxtLink>
        </p>
        <div class="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            class="min-h-[44px] px-5 py-2.5 rounded-lg border border-gray-400 text-gray-800 font-semibold hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            @click="reject"
          >
            Solo necesarias
          </button>
          <button
            type="button"
            class="min-h-[44px] px-5 py-2.5 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            @click="accept"
          >
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
