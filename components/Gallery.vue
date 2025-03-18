<template>
  <div class="container mx-auto">
    <section class="text-gray-600 body-font">
      <div class="container px-5 py-24 mx-auto flex flex-wrap">
        <div class="flex flex-col text-center w-full mb-20">
          <h2 class="text-xs text-indigo-500 tracking-widest font-medium title-font mb-1">Soluciones de Almacenamiento</h2>
          <h1 class="sm:text-3xl text-2xl font-medium title-font text-gray-900">Para todo tipo de empresas y personas</h1>
        </div>
        <div class="flex flex-wrap md:-m-2 -m-1">
          <div class="flex flex-wrap w-1/2">
            <div class="md:p-2 p-1 w-1/2">
              <img alt="gallery" class="w-full object-cover h-full object-center block" src="/assets/images/gallery-1.png">
            </div>
            <div class="md:p-2 p-1 w-1/2">
              <img alt="gallery" class="w-full object-cover h-full object-center block" src="/assets/images/gallery-2.png">
            </div>
            <div class="md:p-2 p-1 w-full">
              <video class="w-full h-full object-cover object-center block" controls>
                <source src="/assets/videos/video1.mp4" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          <div class="flex flex-wrap w-1/2">
            <div class="md:p-2 p-1 w-full">
              <video class="w-full h-full object-cover object-center block" controls>
                <source src="/assets/videos/video2.mp4" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            </div>
            <div class="md:p-2 p-1 w-1/2">
              <img alt="gallery" class="w-full object-cover h-full object-center block" src="/assets/images/gallery-3.png">
            </div>
            <div class="md:p-2 p-1 w-1/2">
              <img alt="gallery" class="w-full object-cover h-full object-center block" src="/assets/images/gallery-4.png">
            </div>
          </div>
        </div>
      </div>
    </section>
    <section>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <div v-for="product in products" :key="product.id" class="bg-white rounded-lg shadow-md overflow-hidden">
          <img :src="product.url" :alt="product.name" class="w-full h-48 object-cover" />
          <div class="p-4">
            <h3 class="text-lg font-semibold text-gray-900">{{ product.name }}</h3>
            <p class="text-sm text-gray-500">SKU: {{ product.sku }}</p>
            <p class="text-sm text-gray-500">Medidas: {{ product.medidas }}</p>
            <p class="text-sm text-gray-500">Grupo: {{ product.grupo }}</p>
            <p class="text-sm text-gray-500">Niveles: {{ product.niveles }}</p>
            <p class="text-sm text-gray-500">Peso por Nivel: {{ product.pesoPorNivel }} kg</p>
          </div>
          <div class="px-6 py-4 bg-gray-50 text-right">
            <a href="#" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Comprar ${{ product.precio }}
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';

interface Product {
  id: number;
  name: string;
  sku: string;
  medidas: string;
  grupo: string;
  niveles: string;
  pesoPorNivel: string;
  precio: string;
  type: string;
  url: string;
}

const products = ref<Product[]>([]);

onMounted(async () => {
  try {
    const response = await fetch('https://racklog.cl/api/angulo-ranurado-list'); // Replace with your API endpoint
    const data = await response.json();
    console.log(data._embedded.elements);

    // Extract relevant fields from the JSON response
    products.value = data._embedded.elements.map((item: any) => {
      const precioField = item.custom_fields_values.find((field: any) => field.field_name === 'Precio');
      const skuField = item.custom_fields_values.find((field: any) => field.field_name === 'SKU');
      const medidasField = item.custom_fields_values.find((field: any) => field.field_name === 'Medidas');
      const grupoField = item.custom_fields_values.find((field: any) => field.field_name === 'GRUPO');
      const nivelesField = item.custom_fields_values.find((field: any) => field.field_name === 'N° Niveles');
      const pesoPorNivelField = item.custom_fields_values.find((field: any) => field.field_name === 'Peso por nivel');


      return {
        id: item.id,
        name: item.name,
        sku: skuField?.values[0]?.value || 'N/A',
        medidas: medidasField?.values[0]?.value || 'N/A',
        grupo: grupoField?.values[0]?.value || 'N/A',
        niveles: nivelesField?.values[0]?.value || 'N/A',
        pesoPorNivel: pesoPorNivelField?.values[0]?.value || 'N/A',
        precio: precioField?.values[0]?.value || 'N/A',
        type: 'image', // Default type (you can adjust this based on your logic)
        url: `/assets/images/${skuField?.values[0]?.value || 'default'}.png`, // Construct URL dynamically
      };
    })
    .filter((product: any) => product.precio !== 'N/A'); // Filter out products without a price
  } catch (error) {
    console.error('Error fetching products:', error);
  }
});
</script>

<style scoped>

</style>