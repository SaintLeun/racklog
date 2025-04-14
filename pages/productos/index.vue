<template>
  <div class="products-page">
    <!-- Hero Banner -->
    <section class="relative bg-neutral-900 py-16 lg:py-24 overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-neutral-900 opacity-80"></div>
        <div class="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-transparent"></div>
        <div class="grid grid-cols-12 grid-rows-6 h-full w-full opacity-20">
          <div class="col-span-1 row-span-1 border-r border-b border-gray-500"></div>
          <div class="col-span-2 row-span-2 border-r border-b border-gray-500"></div>
          <div class="col-start-10 col-span-3 row-span-2 border-l border-b border-gray-500"></div>
          <div class="col-start-4 col-span-2 row-start-4 row-span-2 border-l border-t border-gray-500"></div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="container mx-auto px-6 relative z-10">
        <div class="max-w-3xl mx-auto text-center">
          <h1 class="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Productos <span class="text-orange-500">Racklog</span>
          </h1>
          <p class="text-gray-300 text-lg md:text-xl mb-8">
            Soluciones de almacenamiento industrial diseñadas para optimizar tu espacio y mejorar la eficiencia operativa
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <button 
              v-for="(category, index) in productCategories" 
              :key="index"
              @click="activeCategory = category.id"
              :class="[
                'px-6 py-2 rounded-full text-sm font-medium transition-all',
                activeCategory === category.id 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              ]"
            >
              {{ category.name }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Products Grid -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto px-6">
        <!-- Search and filters -->
        <div class="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center">
          <h2 class="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            <span v-if="activeCategory === 'all'">Todos los productos</span>
            <span v-else>{{ getCategoryName(activeCategory) }}</span>
            <span class="text-sm text-gray-500 ml-2">({{ filteredProducts.length }} productos)</span>
          </h2>
          
          <div class="w-full md:w-auto flex items-center">
            <div class="relative flex-grow md:max-w-xs">
              <input 
                type="text" 
                v-model="searchQuery"
                placeholder="Buscar productos..." 
                class="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            
            <div class="relative ml-4">
              <select 
                v-model="sortOption"
                class="appearance-none px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
              >
                <option value="alphabetical">Alfabético</option>
                <option value="popularity">Popularidad</option>
                <option value="newest">Más nuevos</option>
              </select>
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Product grid with animation -->
        <div v-if="filteredProducts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div 
            v-for="(product, index) in filteredProducts" 
            :key="product.id"
            class="product-card bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
          <div class="relative overflow-hidden aspect-w-4 aspect-h-3">
              <img 
                :src="product.images.card" 
                :alt="product.name" 
                class="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div class="absolute top-3 left-3 flex gap-2">
                <span v-if="product.badge" class="inline-block px-3 py-1 bg-orange-500 text-white text-xs uppercase tracking-wider rounded-full">
                  {{ product.badge }}
                </span>
                <span class="inline-block px-3 py-1 bg-gray-700 text-white text-xs uppercase tracking-wider rounded-full">
                  {{ getCategoryName(product.category) }}
                </span>
              </div>
            </div>
            
            <div class="p-5">
              <h3 class="text-lg font-bold text-gray-900 hover:text-orange-500 transition-colors">
                {{ product.name }}
              </h3>
              <div class="w-8 h-[2px] bg-orange-500 rounded my-2"></div>
              <p class="text-sm text-gray-600 mb-4 line-clamp-2">
                {{ product.description.short }}
              </p>
              
              <!-- Features list -->
              <ul class="mb-5 space-y-1">
                <li v-for="(feature, fIndex) in product.features?.slice(0, 2)" :key="fIndex" class="flex items-start">
                  <svg class="w-4 h-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span class="text-xs text-gray-600">{{ feature }}</span>
                </li>
              </ul>
              
              <div class="pt-3 border-t border-gray-100 flex justify-between items-center">
                <router-link 
                  :to="'/productos/' + product.slug" 
                  class="inline-flex items-center text-orange-500 font-medium text-sm hover:text-orange-600"
                >
                  Ver detalles
                  <svg class="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </router-link>
                
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
          <p class="text-gray-600 mb-4">
            No hay productos que coincidan con tu búsqueda. Intenta con otros términos o categorías.
          </p>
          <button 
            @click="resetFilters" 
            class="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Borrar filtros
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
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
  import QuoteModal from '@/components/QuoteModal.vue';
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
</script>

<style scoped>
  /* Animation for product cards */
  .product-card {
    animation: fadeInUp 0.5s ease forwards;
    opacity: 0;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Aspect ratio for images - 4:3 ratio */
  .aspect-w-4 {
    position: relative;
    padding-bottom: 75%; /* 4:3 Aspect Ratio */
  }

  .aspect-w-4 > img {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    object-fit: cover;
  }

  /* Line clamp for text overflow */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;  
    overflow: hidden;
  }
</style>