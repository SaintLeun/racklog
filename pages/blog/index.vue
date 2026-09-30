<template>
  <div class="blog-page">
    <section class="page-hero">
      <div class="container-page">
        <div class="max-w-3xl">
          <span class="eyebrow bg-white/5 text-brand-300 ring-white/10">Casos reales</span>
          <h1 class="page-hero__title mt-5">Proyectos Racklog</h1>
          <p class="page-hero__lead">Descubre algunos de nuestros proyectos destacados y cómo ayudamos a empresas a optimizar su logística y almacenaje.</p>
        </div>
      </div>
    </section>

    <section class="section section-muted">
      <div class="container-page">
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <article
            v-for="entry in paginatedEntries"
            :key="entry.slug"
            class="card card-hover group relative flex flex-col"
          >
            <div class="card-media">
              <img loading="lazy" decoding="async" :src="entry.gallery[0]" :alt="entry.title" width="800" height="600">
            </div>
            <div class="card-body flex flex-1 flex-col">
              <time :datetime="entry.date" class="text-sm text-neutral-600">{{ formatDate(entry.date) }}</time>
              <h2 class="card-title mt-2 text-xl">
                <NuxtLink :to="`/blog/${entry.slug}`" class="after:absolute after:inset-0">
                  {{ entry.title }}
                </NuxtLink>
              </h2>
              <p class="card-text line-clamp-3 flex-1">{{ entry.description }}</p>
              <span class="link-arrow mt-5 text-sm" aria-hidden="true">
                Ver proyecto
                <svg class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </span>
            </div>
          </article>
        </div>

        <!-- Paginación -->
        <nav v-if="totalPages > 1" class="mt-14 flex items-center justify-center gap-3" aria-label="Paginación de proyectos">
          <button type="button" @click="prevPage" :disabled="page === 1" class="btn btn-secondary btn-sm min-h-11 px-4">Anterior</button>
          <span class="px-3 text-sm font-semibold text-neutral-700" aria-live="polite">{{ page }} / {{ totalPages }}</span>
          <button type="button" @click="nextPage" :disabled="page === totalPages" class="btn btn-secondary btn-sm min-h-11 px-4">Siguiente</button>
        </nav>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useBlogStore } from '~/stores/blogStore';

const blogStore = useBlogStore();
const page = ref(1);
const perPage = 6;

const totalPages = computed(() => Math.ceil(blogStore.entries.length / perPage));
const paginatedEntries = computed(() => {
  const start = (page.value - 1) * perPage;
  return blogStore.entries.slice(start, start + perPage);
});

function nextPage() {
  if (page.value < totalPages.value) page.value++;
}
function prevPage() {
  if (page.value > 1) page.value--;
}
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
}

onMounted(async () => {
  await blogStore.loadEntries();
});

usePageSeo({
  title: 'Proyectos recientes',
  description: 'Proyectos de racks y estanterías industriales que Racklog ha diseñado e instalado para empresas de logística, retail, salud y más.',
});
</script>
