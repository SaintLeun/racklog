<template>
  <NuxtLayout>
    <section class="section">
      <div class="container-page flex flex-col items-center text-center">
        <img
          v-if="is404"
          src="/assets/images/404.webp"
          alt=""
          width="1232"
          height="928"
          class="mb-10 h-auto w-full max-w-sm sm:max-w-md"
        />
        <span class="eyebrow">{{ is404 ? 'Error 404' : 'Error' }}</span>
        <h1 class="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
          {{ is404 ? 'Página no encontrada' : 'Ocurrió un error' }}
        </h1>
        <p class="mt-4 max-w-xl text-lg leading-relaxed text-neutral-600">
          {{ is404
            ? 'La página que buscas no existe o fue movida. Revisa nuestros productos o vuelve al inicio.'
            : 'Tuvimos un problema al mostrar esta página. Inténtalo de nuevo en unos minutos.' }}
        </p>
        <div class="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            class="btn btn-primary btn-lg"
            @click="goTo('/')"
          >
            Volver al inicio
          </button>
          <button
            v-if="is404"
            type="button"
            class="btn btn-secondary btn-lg"
            @click="goTo('/productos')"
          >
            Ver productos
          </button>
        </div>
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
