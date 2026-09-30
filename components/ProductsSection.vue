<template>
  <section class="products-section section bg-white">
    <div class="container-page">
      <div class="section-header">
        <span class="eyebrow">Explora nuestra gama</span>
        <h2 class="section-title">Soluciones de Almacenaje</h2>
        <p class="section-lead">
          Descubre nuestras soluciones industriales diseñadas para maximizar el espacio y optimizar tus operaciones logísticas.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        <article
          v-for="(product, key) in filteredProducts"
          :key="key"
          class="product-card card card-hover group relative flex flex-col"
          :class="{'fade-in-bottom': isVisible}"
        >
          <div class="card-media">
            <img loading="lazy" decoding="async"
              :src="product.images.card"
              :alt="product.name"
            >
            <span class="badge absolute left-4 top-4">{{ product.type }}</span>
          </div>

          <div class="card-body flex flex-1 flex-col">
            <h3 class="card-title transition-colors group-hover:text-brand-700">{{ product.name }}</h3>
            <p class="card-text line-clamp-2">{{ product.description.short }}</p>

            <div class="mt-auto pt-5">
              <NuxtLink
                :to="'/productos/' + product.slug"
                class="link-arrow text-sm after:absolute after:inset-0 after:content-['']"
              >
                Explorar solución
                <span class="sr-only">: {{ product.name }}</span>
                <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </NuxtLink>
            </div>
          </div>
        </article>
      </div>

      <div class="mt-12 text-center sm:mt-14">
        <NuxtLink to="/productos" class="btn btn-dark">
          Ver todos los productos
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, onBeforeUnmount } from 'vue';
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();
const isVisible = ref(false);

const filteredProducts = computed(() => {
  return Object.values(productStore.products)
    .slice(0, 6); // Limit to 6 products for better display
});

// Improved scroll animation using Intersection Observer
const setupIntersectionObserver = () => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      isVisible.value = true;
      observer.disconnect();
    }
  }, { threshold: 0.1 });
  
  const sectionElement = document.querySelector('.products-section');
  if (sectionElement) {
    observer.observe(sectionElement);
  }
  
  return observer;
};

let observer: IntersectionObserver | undefined;

onMounted(() => {
  observer = setupIntersectionObserver();
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>
