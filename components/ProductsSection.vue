<template>
  <div class="container mx-auto">
    <section class="text-gray-600 body-font">
      <div class="container px-5 py-24 mx-auto">
        <div class="flex flex-col text-center w-full mb-20">
          <h2 class="text-xs text-indigo-500 tracking-widest font-medium title-font mb-1">Más Productos</h2>
          <h1 class="sm:text-3xl text-2xl font-medium title-font text-gray-900">Other Solutions</h1>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="(product, key) in productStore.products" :key="key" class="p-4 transition-opacity duration-500 ease-in-out opacity-0" @scroll="handleScroll">
            <div class="flex rounded-lg h-full bg-gray-100">
              <img :src="product.image" alt="product image" class="w-1/3 h-full object-cover rounded-l-lg">
              <div class="w-2/3 p-8 flex flex-col">
                <div class="flex items-center mb-3">
                  <h2 class="text-gray-900 text-lg title-font font-medium">{{ product.name }}</h2> 
                </div>
                <div class="flex-grow">
                  <p class="leading-relaxed text-base">{{ product.description }}</p> 
                  <a :href="product.url" class="mt-3 text-indigo-500 inline-flex items-center">Learn More
                    <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-4 h-4 ml-2" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();

console.log(productStore.products);

function handleScroll() {
  const elements = document.querySelectorAll('.transition-opacity');
  elements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      element.classList.add('opacity-100');
    }
  });
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial check
});
</script>

<style scoped>
.opacity-100 {
  opacity: 1 !important;
}
</style>