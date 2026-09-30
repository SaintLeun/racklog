<template>
  <section class="section section-muted">
    <div class="container-page">
      <div class="section-header">
        <span class="eyebrow">Nuestros proyectos</span>
        <h2 class="section-title">Últimas Implementaciones</h2>
        <p class="section-lead">
          Conoce los proyectos más recientes donde hemos implementado soluciones de almacenamiento para empresas de diversos rubros.
        </p>
      </div>

      <!-- Bento: 1 destacado + proyectos recientes -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[18rem] lg:gap-5">
        <NuxtLink
          v-for="(post, index) in latestPosts"
          :key="post.slug"
          :to="`/blog/${post.slug}`"
          class="group relative isolate block overflow-hidden rounded-(--radius-card) bg-neutral-200 shadow-sm ring-1 ring-black/5 transition duration-300 hover:shadow-xl hover:shadow-neutral-900/10"
          :class="tileClass(index)"
        >
          <img loading="lazy" decoding="async"
            :src="post.gallery[0]"
            :alt="post.title"
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/35 to-transparent" aria-hidden="true"></div>

          <div class="absolute inset-x-0 bottom-0 text-white" :class="index === 0 ? 'p-6 sm:p-8' : 'p-5'">
            <div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-neutral-300">
              <time :datetime="post.date">{{ displayDate(post.date) }}</time>
              <span class="h-1 w-1 rounded-full bg-neutral-400" aria-hidden="true"></span>
              <span class="inline-flex items-center gap-1">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                {{ post.gallery.length }} imágenes
              </span>
            </div>
            <h3
              class="font-semibold tracking-tight text-white line-clamp-2"
              :class="index === 0 ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'"
            >
              {{ post.title }}
            </h3>
            <template v-if="index === 0">
              <p class="mt-3 hidden max-w-xl text-base leading-relaxed text-neutral-200 line-clamp-2 sm:block">
                {{ post.description }}
              </p>
              <span class="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300">
                Ver proyecto completo
                <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                </svg>
              </span>
            </template>
          </div>
        </NuxtLink>
      </div>

      <div class="mt-12 text-center sm:mt-14">
        <NuxtLink to="/blog" class="btn btn-dark">
          Ver todos los proyectos
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { useBlogStore } from '../stores/blogStore';
import { computed } from 'vue';

const blogStore = useBlogStore();

// Get the latest 6 blog posts
const latestPosts = computed(() => {
  return blogStore.entries
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);
});

// Format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Solo presentacion: fecha "28 Jul 2025" leida directo del texto YYYY-MM-DD
// (new Date() la interpretaria en UTC y en Chile mostraria el dia anterior)
const displayDate = (dateString: string) => {
  const [y, m, d] = dateString.split('-').map(Number);
  if (!y || !m || !d) return formatDate(dateString);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${d} ${months[m - 1]} ${y}`;
};

// Solo presentacion: tamano de cada tile del bento
// (lg: destacado 2x2, dos a la derecha y tres abajo)
const tileClass = (index: number) => {
  if (index === 0) return 'aspect-[4/3] sm:col-span-2 sm:aspect-[16/9] lg:row-span-2 lg:aspect-auto';
  const lastOdd = index === latestPosts.value.length - 1 && latestPosts.value.length % 2 === 0;
  return lastOdd
    ? 'aspect-[4/3] sm:col-span-2 sm:aspect-[21/9] lg:col-span-1 lg:aspect-auto'
    : 'aspect-[4/3] lg:aspect-auto';
};
</script>
