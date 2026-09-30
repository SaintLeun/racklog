<template>
  <section class="bg-gray-50 min-h-screen py-12">
    <div class="container mx-auto px-4 max-w-4xl">
      <NuxtLink to="/blog" class="inline-flex items-center text-orange-500 hover:underline mb-6">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        Volver al blog
      </NuxtLink>
      <div v-if="entry" class="bg-white rounded-xl shadow-lg p-8">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{{ entry.title }}</h1>
        <p class="text-orange-500 text-sm mb-4">{{ formatDate(entry.date) }}</p>
        <p class="text-lg text-gray-700 mb-8">{{ entry.description }}</p>
        <!-- Gallery and content distributed -->
        <div class="grid md:grid-cols-2 gap-8 mb-8">
          <img v-if="entry.gallery[0]" :src="entry.gallery[0]" :alt="`${entry.title} - foto 1`" width="800" height="600" loading="eager" fetchpriority="high" class="rounded-lg shadow-md w-full h-72 object-cover object-center">
          <div class="flex flex-col justify-center">
            <div class="prose max-w-none text-gray-800" v-html="formattedContent[0]"></div>
          </div>
        </div>
        <div class="grid md:grid-cols-2 gap-8 mb-8">
          <div class="flex flex-col justify-center order-2 md:order-1">
            <div class="prose max-w-none text-gray-800" v-html="formattedContent[1]"></div>
          </div>
          <img loading="lazy" decoding="async" v-if="entry.gallery[1]" :src="entry.gallery[1]" :alt="`${entry.title} - foto 2`" width="800" height="600" class="rounded-lg shadow-md w-full h-72 object-cover object-center order-1 md:order-2">
        </div>
        <div class="grid md:grid-cols-2 gap-8 mb-8">
          <img loading="lazy" decoding="async" v-if="entry.gallery[2]" :src="entry.gallery[2]" :alt="`${entry.title} - foto 3`" width="800" height="600" class="rounded-lg shadow-md w-full h-72 object-cover object-center">
          <div class="flex flex-col justify-center">
            <div class="prose max-w-none text-gray-800" v-html="formattedContent[2]"></div>
          </div>
        </div>
        <div class="grid md:grid-cols-2 gap-8 mb-8">
          <div class="flex flex-col justify-center order-2 md:order-1">
            <div class="prose max-w-none text-gray-800" v-html="formattedContent[3]"></div>
          </div>
          <img loading="lazy" decoding="async" v-if="entry.gallery[3]" :src="entry.gallery[3]" :alt="`${entry.title} - foto 4`" width="800" height="600" class="rounded-lg shadow-md w-full h-72 object-cover object-center order-1 md:order-2">
        </div>
        <div class="grid md:grid-cols-2 gap-8 mb-8" v-if="entry.gallery[4]">
          <img loading="lazy" decoding="async" :src="entry.gallery[4]" :alt="`${entry.title} - foto 5`" width="800" height="600" class="rounded-lg shadow-md w-full h-72 object-cover object-center">
          <div class="flex flex-col justify-center">
            <div class="prose max-w-none text-gray-800" v-html="formattedContent[4]"></div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-24">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Proyecto no encontrado</h2>
        <NuxtLink to="/blog" class="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors shadow-md mt-4">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Volver al blog
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { useBlogStore } from '~/stores/blogStore';

const route = useRoute();
const blogStore = useBlogStore();
const entry = computed(() => blogStore.getBySlug(route.params.slug as string));
if (!entry.value) {
  throw createError({ statusCode: 404, statusMessage: 'Proyecto no encontrado', fatal: true });
}

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

<style scoped>
.prose p {
  margin-bottom: 1.2em;
}
</style>
