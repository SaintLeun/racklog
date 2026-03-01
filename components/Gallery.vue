<template>
  <div class="container mx-auto">
    <section class="text-gray-600 body-font">
      <div class="container px-5 py-24 mx-auto">
        <!-- Header Section -->
        <div class="flex flex-col text-center w-full mb-12">
          <div class="inline-block relative mb-4 mx-auto">
            <span class="absolute inset-x-0 bottom-0 h-[6px] bg-orange-500/20 -mb-2"></span>
            <h2 class="text-xs text-orange-500 tracking-widest font-semibold uppercase relative z-10">NUESTROS PROYECTOS</h2>
          </div>
          <h1 class="sm:text-4xl text-3xl font-bold title-font text-gray-900 mb-4">Últimas Implementaciones</h1>
          <div class="w-16 h-1 rounded-full bg-orange-500 mx-auto mb-4"></div>
          <p class="lg:w-2/3 mx-auto leading-relaxed text-base text-gray-600">
            Conoce los proyectos más recientes donde hemos implementado soluciones de almacenamiento para empresas de diversos rubros.
          </p>
        </div>

        <!-- Blog Posts Masonry Layout -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          <!-- First Featured Post (Large - Spans 2 columns on large screens) -->
          <NuxtLink
            v-if="latestPosts[0]"
            :to="`/blog/${latestPosts[0].slug}`"
            class="group relative lg:col-span-8 h-[500px] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
          >
            <img 
              :src="latestPosts[0].gallery[0]" 
              :alt="latestPosts[0].title"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div class="flex items-center mb-3 text-sm text-orange-300">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span class="font-medium">{{ latestPosts[0].gallery.length }} imágenes</span>
              </div>
              <h3 class="text-2xl md:text-3xl font-bold mb-3 group-hover:text-orange-400 transition-colors line-clamp-2">
                {{ latestPosts[0].title }}
              </h3>
              <p class="text-gray-200 text-base leading-relaxed line-clamp-2 mb-4">
                {{ latestPosts[0].description }}
              </p>
              <div class="inline-flex items-center text-orange-400 font-semibold group-hover:gap-3 gap-2 transition-all">
                <span>Ver proyecto completo</span>
                <svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                </svg>
              </div>
            </div>
          </NuxtLink>

          <!-- Second Featured Post (Medium - Right side) -->
          <NuxtLink
            v-if="latestPosts[1]"
            :to="`/blog/${latestPosts[1].slug}`"
            class="group relative lg:col-span-4 h-[500px] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
          >
            <img 
              :src="latestPosts[1].gallery[0]" 
              :alt="latestPosts[1].title"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div class="flex items-center mb-2 text-xs text-orange-300">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span>{{ latestPosts[1].gallery.length }} imágenes</span>
              </div>
              <h3 class="text-lg font-bold mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                {{ latestPosts[1].title }}
              </h3>
              <p class="text-gray-200 text-sm leading-relaxed line-clamp-2 mb-3">
                {{ latestPosts[1].description }}
              </p>
              <div class="inline-flex items-center text-orange-400 text-sm font-semibold group-hover:gap-2 gap-1 transition-all">
                <span>Ver más</span>
                <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </NuxtLink>

          <!-- Remaining Posts (Smaller cards in 4 columns) -->
          <NuxtLink
            v-for="(post, index) in latestPosts.slice(2, 6)"
            :key="post.slug"
            :to="`/blog/${post.slug}`"
            class="group relative lg:col-span-3 md:col-span-1 h-[320px] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
          >
            <img 
              :src="post.gallery[0]" 
              :alt="post.title"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-5 text-white">
              <h3 class="text-base font-bold mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                {{ post.title }}
              </h3>
              <p class="text-gray-300 text-xs leading-relaxed line-clamp-2 mb-3">
                {{ post.description }}
              </p>
              <div class="flex items-center justify-between">
                <div class="flex items-center text-xs text-orange-300">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span>{{ post.gallery.length }}</span>
                </div>
                <svg class="w-5 h-5 text-orange-400 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- View All Button -->
        <div class="text-center mt-12">
          <NuxtLink 
            to="/blog"
            class="inline-flex items-center px-8 py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Ver todos los proyectos
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
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
</script>

<style scoped>
/* Line clamp utilities for text truncation */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>