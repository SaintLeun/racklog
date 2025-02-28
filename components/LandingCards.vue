<template>
  <div class="container mx-auto py-3">
    <section class="grid md:grid-cols-2 gap-6 max-md:max-w-xs mx-auto">
      <!-- Card -->
      <section v-for="product in products" :key="product.name" class="text-gray-600 body-font overflow-hidden">
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
    <!-- Dummy element to include all possible classes -->
    <div class="hidden">
      <div class="bg-orange-400 hover:bg-orange-500 bg-indigo-400 hover:bg-indigo-500"></div>
    </div>
    <!-- Modal -->
    <Modal :isVisible="isModalVisible" :title="modalTitle" @close="closeModal">
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import Modal from './ContactModal.vue';

const products = [
  {
    name: 'Rack Selectivo',
    headline: 'Almacenamiento Industrial',
    description: 'Solucíon para almacenaje de pallets de alta carga, adaptable para selección manual (picking). Utilizado principalmente en bodegas para almacenar de manera selectiva una alta variedad de productos.',
    image: 'https://qa.racklog.cl/images/productos/RS/detalles/500x500/rack_selectivo.jpg',
    path: 'https://qa.racklog.cl/productos/rack-selectivo',
    buttonColor: 'bg-orange'
  },
  {
    name: 'Angulo Ranurado',
    headline: 'Optimización de Espacios',
    description: 'anguloRanuradoDescription',
    image: 'https://qa.racklog.cl/images/anra_body.png',
    path: 'https://qa.racklog.cl/productos/rack-selectivo',
    buttonColor: 'bg-indigo'
  },
]

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