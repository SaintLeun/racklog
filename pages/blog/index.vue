<template>
  <section class="blog-section bg-gray-50 min-h-screen py-16">
    <div class="container mx-auto px-4">
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Proyectos Racklog</h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">Descubre algunos de nuestros proyectos destacados y cómo ayudamos a empresas a optimizar su logística y almacenaje.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="entry in paginatedEntries" :key="entry.slug" class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col">
          <img :src="entry.gallery[0]" :alt="entry.title" class="h-56 w-full object-cover object-center">
          <div class="p-6 flex flex-col flex-1">
            <h2 class="text-2xl font-bold text-orange-500 mb-2">{{ entry.title }}</h2>
            <p class="text-gray-700 mb-4 flex-1">{{ entry.description }}</p>
            <div class="flex items-center justify-between mt-4">
              <span class="text-xs text-gray-400">{{ formatDate(entry.date) }}</span>
              <NuxtLink :to="`/blog/${entry.slug}`" class="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
                Ver proyecto
                <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
      <!-- Pagination -->
      <div class="flex justify-center mt-12" v-if="totalPages > 1">
        <button @click="prevPage" :disabled="page === 1" class="px-4 py-2 mx-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Anterior</button>
        <span class="px-4 py-2 mx-1 text-orange-500 font-bold">{{ page }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="page === totalPages" class="px-4 py-2 mx-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Siguiente</button>
      </div>
    </div>
  </section>
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
</script>

<style scoped>
.blog-section {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
}
</style>
