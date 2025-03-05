<template>
  <div class="container mx-auto py-3">
    <section class="grid md:grid-cols-2 gap-6 max-md:max-w-xs mx-auto">
      <section v-for="(product, key) in filteredProducts" :key="key" class="text-gray-600 body-font overflow-hidden">
        <div class="container px-5 py-24 mx-auto">
          <div class="lg:w-full mx-auto flex flex-wrap">
            <img alt="ecommerce" class="lg:w-1/2 w-full lg:h-auto h-64 object-cover object-center rounded" :src="product.image" />
            <div class="lg:w-1/2 w-full lg:pl-10 lg:py-6 mt-6 lg:mt-0 flex flex-col">
              <h2 class="text-sm title-font text-gray-500 tracking-widest">{{ product.headline }}</h2>
              <h1 class="text-gray-900 text-3xl title-font font-medium mb-1">{{ product.name }}</h1>
              <p class="leading-relaxed">{{ product.description }}</p>
              <div class="mt-auto">
                <button @click="openModal('Generar en 3D')" :class="buttonClass(product.buttonColor, '400', '500')" class="flex w-full text-white border-0 py-2 px-6 focus:outline-none rounded mt-4 transition-colors">Arma tu {{ product.name }}</button>
                <button @click="openModal('Cotizar')" :class="buttonClass(product.buttonColor, '400', '500')" class="flex w-full text-white border-0 py-2 px-6 focus:outline-none rounded mt-4 transition-colors">Cotizar</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
    <div class="hidden">
      <div class="bg-orange-400 hover:bg-orange-500 bg-indigo-400 hover:bg-indigo-500"></div>
    </div>
    <Modal :isVisible="isModalVisible" :title="modalTitle" @close="closeModal">
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useProductStore } from '@/stores/productStore';
import Modal from './ContactModal.vue';

const productStore = useProductStore();

const filteredProducts = computed(() => {
  return Object.values(productStore.products)
    .filter(product => product.name === 'Rack Selectivo' || product.name === 'Ángulo Ranurado')
    .map(product => ({
      ...product,
      image: product.name === 'Rack Selectivo' ? 'assets/images/rack_selectivo.jpg' : 'assets/images/anra_body.png',
      headline: product.name === 'Rack Selectivo' ? 'Almacenamiento Industrial' : 'Optimización de Espacios',
      buttonColor: product.name === 'Rack Selectivo' ? 'bg-orange' : 'bg-indigo'
    }));
});

const isModalVisible = ref(false);
const modalTitle = ref('');

function openModal(title: string) {
  modalTitle.value = title;
  isModalVisible.value = true;
}

function closeModal() {
  isModalVisible.value = false;
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