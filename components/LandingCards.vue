<template>
  <section class="section bg-white">
    <div class="container-page">
      <div class="section-header">
        <span class="eyebrow">Configurador</span>
        <h2 class="section-title">Configura y Cotiza en Tiempo Real</h2>
        <p class="section-lead">
          Diseña tu solución ideal de almacenamiento a medida. Selecciona las dimensiones, capacidades y características que necesitas para tu proyecto.
        </p>
      </div>

      <div class="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:max-w-none lg:grid-cols-3 lg:gap-8">
        <article
          v-for="(product, key) in filteredProducts"
          :key="key"
          class="card flex flex-col"
        >
          <div class="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-neutral-50 to-neutral-100">
            <img
              loading="lazy"
              decoding="async"
              :alt="product.name"
              width="800"
              height="600"
              class="h-full w-full object-contain p-4"
              :src="product.images.render"
            />
            <span class="badge absolute left-4 top-4">{{ product.type }}</span>
          </div>
          <div class="card-body flex flex-1 flex-col sm:p-8">
            <h3 class="text-2xl font-semibold tracking-tight text-neutral-900">{{ product.name }}</h3>
            <p class="card-text text-base">{{ product.description.short }}</p>
            <div class="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center md:flex-col md:items-stretch xl:flex-row xl:items-center">
              <button
                type="button"
                class="btn btn-primary w-full whitespace-nowrap sm:w-auto md:w-full xl:w-auto"
                @click="openQuoteWithProduct(product)"
              >
                Configurar y cotizar
                <span class="sr-only">{{ product.name }}</span>
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
              <NuxtLink
                :to="'/productos/' + product.slug"
                class="btn btn-secondary w-full whitespace-nowrap sm:w-auto md:w-full xl:w-auto"
              >
                Ver más
                <span class="sr-only">sobre {{ product.name }}</span>
              </NuxtLink>
            </div>
          </div>
        </article>
      </div>
    </div>

    <QuoteModal
      :isVisible="isQuoteModalVisible"
      :title="modalTitle"
      :initialProduct="selectedProduct"
      @close="closeModal"
    >
    </QuoteModal>
  </section>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import QuoteModal from './QuoteModal/QuoteModal.vue';

const productStore = useProductStore();

// Productos del configurador (QuoteModal), con su codigo
const CONFIGURABLES: Record<string, 'RS' | 'AR' | 'DI'> = { 'rack-selectivo': 'RS', 'angulo-ranurado': 'AR', 'rack-drive-in': 'DI' };

const filteredProducts = computed(() => {
  return Object.values(productStore.products)
    .filter(product => product.slug in CONFIGURABLES)
    .map(product => ({
      ...product,
      buttonColor: product.slug === 'rack-selectivo' ? 'bg-orange' : 'bg-indigo'
    }));
});

const isQuoteModalVisible = ref(false);
const modalTitle = ref('');
const selectedProduct = ref<'RS' | 'AR' | 'DI' | ''>('');

function openQuoteWithProduct(product: { slug: string; name: string }) {
  // Set the selected product based on its name
  selectedProduct.value = CONFIGURABLES[product.slug];
  // Set modal title based on the product
  modalTitle.value = `Configurador de ${product.name}`;
  // Open the quote modal
  isQuoteModalVisible.value = true;
}

// Links externos (p. ej. correos) abren un configurador directo: /?configurar=drive-in
onMounted(() => {
  const slug = useRoute().query.configurar;
  const product = filteredProducts.value.find(p => p.slug === `rack-${slug}` || p.slug === slug);
  if (product) openQuoteWithProduct(product);
});

function closeModal() {
  isQuoteModalVisible.value = false;
  selectedProduct.value = '';
}

function buttonClass(color: string, base: string, hover: string) {
  return {
    [`${color}-${base}`]: true,
    [`hover:${color}-${hover}`]: true,
  }
}
</script>

<style scoped>
</style>