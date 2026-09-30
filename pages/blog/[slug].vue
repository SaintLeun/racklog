<template>
  <div class="blog-entry">
    <article v-if="entry">
      <!-- Encabezado del artículo -->
      <header class="page-hero">
        <div class="container-page">
          <div class="max-w-3xl">
            <NuxtLink to="/blog" class="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-neutral-300 transition-colors hover:text-white">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Volver al blog
            </NuxtLink>
            <p class="mt-6">
              <time :datetime="entry.date" class="eyebrow bg-white/5 text-brand-300 ring-white/10 normal-case tracking-normal">{{ formatDate(entry.date) }}</time>
            </p>
            <h1 class="page-hero__title mt-5 text-3xl sm:text-4xl lg:text-5xl">{{ entry.title }}</h1>
            <p class="page-hero__lead">{{ entry.description }}</p>
          </div>
        </div>
      </header>

      <!-- Galería y contenido alternados -->
      <div class="section">
        <div class="container-page max-w-6xl space-y-12 sm:space-y-16 lg:space-y-20">
          <template v-for="(n, i) in 5" :key="n">
          <div
            v-if="i < 4 || entry.gallery[4]"
            class="grid items-center gap-8 md:grid-cols-2 lg:gap-14"
          >
            <div
              v-if="entry.gallery[i]"
              class="aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 shadow-lg shadow-neutral-900/5 ring-1 ring-neutral-900/5"
              :class="i % 2 === 1 ? 'md:order-2' : ''"
            >
              <img
                :src="entry.gallery[i]"
                :alt="`${entry.title} - foto ${n}`"
                width="800"
                height="600"
                :loading="i === 0 ? 'eager' : 'lazy'"
                :decoding="i === 0 ? undefined : 'async'"
                :fetchpriority="i === 0 ? 'high' : undefined"
                class="h-full w-full object-cover object-center"
              >
            </div>
            <div
              class="prose-page"
              :class="[i % 2 === 1 ? 'md:order-1' : '', entry.gallery[i] ? '' : 'md:col-span-2 max-w-3xl']"
              v-html="formattedContent[i]"
            ></div>
          </div>
          </template>
        </div>
      </div>

      <!-- CTA final -->
      <section class="section section-muted">
        <div class="container-page">
          <div class="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-ink-950 px-6 py-12 text-center sm:px-12 sm:py-16">
            <h2 class="text-2xl font-bold tracking-tight text-white sm:text-3xl">¿Tienes un proyecto similar?</h2>
            <p class="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-neutral-300">
              Cuéntanos qué necesitas y te enviamos una cotización sin compromiso.
            </p>
            <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button type="button" class="btn btn-primary btn-lg w-full sm:w-auto" @click="isContactModalOpen = true">
                Solicitar cotización
              </button>
              <NuxtLink to="/blog" class="btn btn-ghost-light btn-lg w-full sm:w-auto">
                Ver más proyectos
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>
    </article>

    <div v-else class="section">
      <div class="container-page max-w-xl text-center">
        <h2 class="text-2xl font-bold text-neutral-900">Proyecto no encontrado</h2>
        <NuxtLink to="/blog" class="btn btn-primary mt-6">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Volver al blog
        </NuxtLink>
      </div>
    </div>

    <ContactModal :isVisible="isContactModalOpen" @close="isContactModalOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed, ref } from 'vue';
import { useBlogStore } from '~/stores/blogStore';

const route = useRoute();
const blogStore = useBlogStore();
const entry = computed(() => blogStore.getBySlug(route.params.slug as string));
if (!entry.value) {
  throw createError({ statusCode: 404, statusMessage: 'Proyecto no encontrado', fatal: true });
}

// Modal de cotización del CTA final
const isContactModalOpen = ref(false);

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Split content into paragraphs for distributed layout
const formattedContent = computed(() => {
  if (!entry.value) return [];
  return entry.value.content.split(/\n\n+/).map(p => `<p>${p}</p>`);
});

usePageSeo({
  title: entry.value!.title,
  description: entry.value!.description,
  type: 'article',
});

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: entry.value!.title,
      description: entry.value!.description,
      datePublished: entry.value!.date,
      image: entry.value!.gallery?.[0] ? `https://racklog.cl${encodeURI(entry.value!.gallery[0])}` : undefined,
      author: { '@id': 'https://racklog.cl/#organization' },
      publisher: { '@id': 'https://racklog.cl/#organization' },
    }),
  }],
});
</script>
