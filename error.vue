<template>
  <NuxtLayout>
    <section class="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 bg-white text-center">
      <img
        v-if="is404"
        src="/assets/images/404.webp"
        alt=""
        width="1232"
        height="928"
        class="w-full max-w-md h-auto mb-8"
      />
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        {{ is404 ? 'Página no encontrada' : 'Ocurrió un error' }}
      </h1>
      <p class="text-lg text-gray-700 mb-8 max-w-xl">
        {{ is404
          ? 'La página que buscas no existe o fue movida. Revisa nuestros productos o vuelve al inicio.'
          : 'Tuvimos un problema al mostrar esta página. Inténtalo de nuevo en unos minutos.' }}
      </p>
      <div class="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          class="min-h-[44px] px-6 py-3 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700"
          @click="goTo('/')"
        >
          Volver al inicio
        </button>
        <button
          v-if="is404"
          type="button"
          class="min-h-[44px] px-6 py-3 rounded-lg border border-gray-400 text-gray-800 font-semibold hover:bg-gray-100"
          @click="goTo('/productos')"
        >
          Ver productos
        </button>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();
const is404 = computed(() => props.error?.statusCode === 404);

useSeoMeta({
  title: () => (is404.value ? 'Página no encontrada' : 'Error'),
  robots: 'noindex',
});

function goTo(path: string) {
  clearError({ redirect: path });
}
</script>
