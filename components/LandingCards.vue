<template>
  <div class="container mx-auto py-3">
    <section class="grid md:grid-cols-2 gap-6 max-md:max-w-xs mx-auto">
      <section v-for="(product, key) in filteredProducts" :key="key" class="text-gray-600 body-font overflow-hidden">
        <div class="container px-5 py-24 mx-auto">
          <div class="lg:w-full mx-auto flex flex-wrap">
            <img alt="ecommerce" class="lg:w-1/2 w-full lg:h-auto h-64 object-cover object-center rounded" :src="product.images.render" />
            <div class="lg:w-1/2 w-full lg:pl-10 lg:py-6 mt-6 lg:mt-0 flex flex-col">
              <h2 class="text-sm title-font text-gray-500 tracking-widest">{{ product.type }}</h2>
              <h1 class="text-gray-900 text-3xl title-font font-medium mb-1">{{ product.name }}</h1>
              <p class="leading-relaxed">{{ product.description.short }}</p>
              <div class="mt-auto">
                <button @click="openModal('quote')" :class="buttonClass(product.buttonColor, '400', '500')" class="flex w-full text-white border-0 py-2 px-6 focus:outline-none rounded mt-4 transition-colors">Arma tu {{ product.name }}</button>
                <button @click="openModal('contact')" :class="buttonClass(product.buttonColor, '400', '500')" class="flex w-full text-white border-0 py-2 px-6 focus:outline-none rounded mt-4 transition-colors">Cotizar</button>
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
    <QuoteModal :isVisible="isQuoteModalVisible" :title="modalTitle" @close="closeModal('quote')">
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
    .filter(product => product.name === 'Rack Selectivo' || product.name === 'Ángulo Ranurado')
    .map(product => ({
      ...product,
      buttonColor: product.name === 'Rack Selectivo' ? 'bg-orange' : 'bg-indigo'
    }));
});

const isContactModalVisible = ref(false);
const isQuoteModalVisible = ref(false);
const modalTitle = ref('');

function openModal(modal: string) {
  modalTitle.value = 'Modal';
  if (modal === 'contact') {
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