<template>
  <div class="products-page">
    <!-- Hero -->
    <section class="page-hero">
      <div class="container-page relative">
        <h1 class="page-hero__title">
          Productos <span class="text-brand-400">Racklog</span>
        </h1>
        <p class="page-hero__lead">
          Soluciones de almacenamiento industrial diseñadas para optimizar tu espacio y mejorar la eficiencia operativa
        </p>
      </div>
    </section>

    <!-- Products Grid -->
    <section class="section section-muted !pt-10 sm:!pt-12">
      <div class="container-page">
        <!-- Filtros, busqueda y orden -->
        <div class="card p-3 sm:p-4">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="Filtrar por categoría"
              class="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:pb-0 [scrollbar-width:none]"
            >
              <button
                v-for="(category, index) in productCategories"
                :key="index"
                type="button"
                :aria-pressed="activeCategory === category.id"
                @click="activeCategory = category.id"
                :class="[
                  'inline-flex min-h-11 flex-shrink-0 items-center rounded-xl px-4 text-sm font-semibold transition-colors',
                  activeCategory === category.id
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                ]"
              >
                {{ category.name }}
              </button>
            </div>

            <div class="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div class="relative flex-grow lg:w-72">
                <svg class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input
                  type="search"
                  v-model="searchQuery"
                  placeholder="Buscar productos..."
                  aria-label="Buscar productos"
                  class="form-input pl-11"
                />
              </div>

              <div class="relative sm:w-48">
                <select
                  v-model="sortOption"
                  aria-label="Ordenar productos"
                  class="form-input appearance-none"
                >
                  <option value="alphabetical">Alfabético</option>
                  <option value="popularity">Popularidad</option>
                  <option value="newest">Más nuevos</option>
                </select>
                <svg class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <h2 class="mt-10 mb-6 flex flex-wrap items-baseline gap-x-3 text-2xl font-bold tracking-tight text-neutral-900">
          <span v-if="activeCategory === 'all'">Todos los productos</span>
          <span v-else>{{ getCategoryName(activeCategory) }}</span>
          <span class="text-sm font-medium text-neutral-600">({{ filteredProducts.length }} productos)</span>
        </h2>

        <!-- Grid de productos -->
        <div v-if="filteredProducts.length > 0" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <article
            v-for="(product, index) in filteredProducts"
            :key="product.id"
            class="product-card card card-hover group relative flex flex-col"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <div class="card-media">
              <img
                loading="lazy"
                decoding="async"
                :src="product.images.card"
                :alt="product.name"
                width="800"
                height="600"
              />
              <div class="absolute left-3 top-3 flex flex-wrap gap-2">
                <span v-if="product.badge" class="badge !bg-brand-700 !text-white !ring-0">
                  {{ product.badge }}
                </span>
                <span class="badge">
                  {{ getCategoryName(product.category) }}
                </span>
              </div>
            </div>

            <div class="card-body flex flex-1 flex-col">
              <h3 class="card-title transition-colors group-hover:text-brand-700">
                {{ product.name }}
              </h3>
              <p class="card-text line-clamp-2">
                {{ product.description.short }}
              </p>

              <ul v-if="product.features && product.features.length" class="mt-4 space-y-1.5">
                <li v-for="(feature, fIndex) in product.features.slice(0, 2)" :key="fIndex" class="flex items-start gap-2 text-xs text-neutral-600">
                  <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>{{ feature }}</span>
                </li>
              </ul>

              <div class="mt-auto pt-5">
                <router-link
                  :to="'/productos/' + product.slug"
                  class="link-arrow text-sm after:absolute after:inset-0 after:content-['']"
                >
                  Ver detalles<span class="sr-only">: {{ product.name }}</span>
                  <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </router-link>
              </div>
            </div>
          </article>
        </div>

        <!-- Estado vacio -->
        <div v-else class="card mx-auto max-w-lg px-6 py-14 text-center">
          <span class="icon-tile mx-auto" aria-hidden="true">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </span>
          <h3 class="mt-5 text-lg font-semibold text-neutral-900">No se encontraron productos</h3>
          <p class="mt-2 text-neutral-600">
            No hay productos que coincidan con tu búsqueda. Intenta con otros términos o categorías.
          </p>
          <button
            type="button"
            @click="resetFilters"
            class="btn btn-secondary mt-6"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Borrar filtros
          </button>
        </div>
      </div>
    </section>

    <!-- Quote Modal -->
    <QuoteModal 
      :isVisible="isQuoteModalOpen" 
      :initialProduct="selectedProduct" 
      @close="closeQuoteModal" 
    />

    <!-- Contact Modal -->
    <ContactModal 
      :isVisible="isContactModalOpen" 
      @close="closeContactModal" 
    />
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { useProductStore } from '@/stores/productStore';
  import { useRoute, useRouter } from 'vue-router';
  import QuoteModal from '@/components/QuoteModal/QuoteModal.vue';
  import ContactModal from '@/components/ContactModal.vue';

  // Router and route for query params
  const route = useRoute();
  const router = useRouter();

  // Store and modals
  const productStore = useProductStore();
  const isQuoteModalOpen = ref(false);
  const isContactModalOpen = ref(false);
  const selectedProduct = ref('');

  // Filters state
  const activeCategory = ref('all');
  const searchQuery = ref('');
  const sortOption = ref('alphabetical');

  // Product categories
  const productCategories = [
    { id: 'all', name: 'Todos' },
    { id: 'racks', name: 'Racks' },
    { id: 'estanterias', name: 'Estanterías' },
    { id: 'mezzanines', name: 'Mezzanines' },
    { id: 'accesorios', name: 'Accesorios' }
  ];

  // Helper function to get category name
  const getCategoryName = (categoryId) => {
    const category = productCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Todos los productos';
  };

  // Listen for query param changes (for navigation from header)
  watch(
    () => route.query,
    (newQuery) => {
      if (newQuery.categoria && typeof newQuery.categoria === 'string') {
        const categoryId = newQuery.categoria;
        // Check if the category exists in our list
        if (productCategories.some(cat => cat.id === categoryId) || categoryId === 'all') {
          activeCategory.value = categoryId;
        }
      }
    },
    { immediate: true } // Run immediately on component creation
  );

  // Update URL when category selection changes
  watch(activeCategory, (newCategory) => {
    if (newCategory === 'all') {
      // Remove categoria param if it's 'all'
      if (route.query.categoria) {
        router.replace({ query: { ...route.query, categoria: undefined }});
      }
    } else {
      // Update query param with selected category
      router.replace({ query: { ...route.query, categoria: newCategory }});
    }
  });

  // Filtered and sorted products
  const filteredProducts = computed(() => {
    let products = Object.values(productStore.products);
    
    // Filter by category
    if (activeCategory.value !== 'all') {
      products = products.filter(product => product.category === activeCategory.value);
    }
    
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.short.toLowerCase().includes(query)
      );
    }
    
    // Sort products
    switch (sortOption.value) {
      case 'alphabetical':
        return products.sort((a, b) => a.name.localeCompare(b.name));
      case 'popularity':
        return products.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      case 'newest':
        return products.sort((a, b) => (new Date(b.createdAt || 0)) - (new Date(a.createdAt || 0)));
      default:
        return products;
    }
  });

  // Modal functions
  function openQuoteModal(productSlug = '') {
    selectedProduct.value = productSlug;
    isQuoteModalOpen.value = true;
  }

  function closeQuoteModal() {
    isQuoteModalOpen.value = false;
  }

  function openContactModal() {
    isContactModalOpen.value = true;
  }

  function closeContactModal() {
    isContactModalOpen.value = false;
  }

  // Filter reset
  function resetFilters() {
    activeCategory.value = 'all';
    searchQuery.value = '';
    sortOption.value = 'alphabetical';
    // Also clear the query param
    if (route.query.categoria) {
      router.replace({ query: { ...route.query, categoria: undefined }});
    }
  }

  // Page initialization
  onMounted(() => {
    // Check for category in URL on initial load
    const categoryParam = route.query.categoria;
    if (categoryParam && typeof categoryParam === 'string') {
      // Validate that it's a valid category
      if (productCategories.some(cat => cat.id === categoryParam)) {
        activeCategory.value = categoryParam;
      }
    }
    
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  });

usePageSeo({
  title: 'Productos: racks, estanterías y entreplantas',
  description: 'Catálogo de racks selectivos, drive-in, dinámicos, push-back, ángulo ranurado, mini racks, cajas plásticas y entreplantas. Cotiza en línea.',
});
</script>

<style scoped>
  /* Entrada suave de las tarjetas */
  .product-card {
    animation: fadeInUp 0.5s ease both;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
