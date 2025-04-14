<template>
  <div class="container mx-auto py-20">
    <!-- Section header with styled line -->
    <div class="flex flex-col items-center text-center mb-16">
      <div class="inline-block relative mb-3">
        <span class="absolute inset-x-0 bottom-0 h-[6px] bg-orange-500/20 -mb-2"></span>
        <h2 class="text-sm uppercase tracking-wider font-semibold text-orange-500 relative z-10">Configurador</h2>
      </div>
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Configura y Cotiza en Tiempo Real</h1>
      <div class="w-16 h-1 rounded-full bg-orange-500 mb-6"></div>
      <p class="max-w-2xl text-gray-600 text-lg">
        Diseña tu solución ideal de almacenamiento a medida. Selecciona las dimensiones, capacidades y características que necesitas para tu proyecto.
      </p>
    </div>
    
    <section class="grid md:grid-cols-2 gap-6 max-md:max-w-xs mx-auto">
      <!-- Rest of your content remains the same -->
      <section v-for="(product, key) in filteredProducts" :key="key" class="text-gray-600 body-font overflow-hidden">
        <div class="container px-5 py-5 mx-auto">
          <div class="lg:w-full mx-auto flex flex-wrap">
            <img alt="ecommerce" class="lg:w-1/2 w-full lg:h-auto h-64 object-cover object-center rounded" :src="product.images.render" />
            <div class="lg:w-1/2 w-full lg:pl-10 lg:py-6 mt-6 lg:mt-0 flex flex-col">
              <h2 class="text-sm title-font text-gray-500 tracking-widest">{{ product.type }}</h2>
              <h1 class="text-gray-900 text-3xl title-font font-medium mb-1">{{ product.name }}</h1>
              <p class="leading-relaxed">{{ product.description.short }}</p>
              <div class="mt-auto">
                <button @click="openQuoteWithProduct(product)" :class="buttonClass(product.buttonColor, '400', '500')" class="flex w-full items-center justify-center text-white border-0 py-2 px-6 focus:outline-none rounded mt-4 transition-colors">
                  Configura tu {{ product.name }}
                  <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
                <a :href="'/productos/' + product.slug" :class="buttonClass(product.buttonColor, '400', '500')" class="flex w-full items-center justify-center text-white border-0 py-2 px-6 focus:outline-none rounded mt-4 transition-colors">
                  Ver más
                  <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
    
    <div class="hidden">
      <div class="bg-orange-400 hover:bg-orange-500 bg-indigo-400 hover:bg-indigo-500"></div>
    </div>
    
    <ContactModal :isVisible="isContactModalVisible" :title="modalTitle" @close="closeModal('contact')">
    </ContactModal>
    <QuoteModal 
      :isVisible="isQuoteModalVisible" 
      :title="modalTitle" 
      :initialProduct="selectedProduct"
      @close="closeModal('quote')"
    >
    </QuoteModal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useProductStore } from '@/stores/productStore';
import ContactModal from './ContactModal.vue';
import QuoteModal from './QuoteModal.vue';

const productStore = useProductStore();

const filteredProducts = computed(() => {
  return Object.values(productStore.products)
    .filter(product => product.slug === 'rack-selectivo' || product.slug === 'angulo-ranurado')
    .map(product => ({
      ...product,
      buttonColor: product.slug === 'rack-selectivo' ? 'bg-orange' : 'bg-indigo'
    }));
});

const isContactModalVisible = ref(false);
const isQuoteModalVisible = ref(false);
const modalTitle = ref('');
const selectedProduct = ref('');

function openQuoteWithProduct(product) {
  // Set the selected product based on its name
  selectedProduct.value = product.slug === 'rack-selectivo' ? 'RS' : 'AR';
  // Set modal title based on the product
  modalTitle.value = `Configurador de ${product.name}`;
  // Open the quote modal
  isQuoteModalVisible.value = true;
}

function openModal(modal: string) {
  modalTitle.value = 'Modal';
  if (modal === 'contact') {
    isContactModalVisible.value = false;
    isContactModalVisible.value = true;
  } else {
    isQuoteModalVisible.value = true;
  }
}

function closeModal(modal: string) {
  if (modal === 'contact') {
    isContactModalVisible.value = false;
  } else {
    isQuoteModalVisible.value = false;
    // Reset the selected product when closing the modal
    selectedProduct.value = '';
  }
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