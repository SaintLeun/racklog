<template>
  <div v-if="product">
    <section class="text-gray-600 body-font overflow-hidden">
      <div class="container p-5 mx-auto">
        <Breadcrumbs :breadcrumbs="[{label: product.name}]" />
      </div>
    </section>
    <section class="text-gray-600 body-font overflow-hidden">
      <div class="container px-5 py-10 mx-auto">
        <div class="lg:w-4/5 mx-auto flex flex-wrap">
          <div class="lg:w-1/2 w-full lg:h-auto h-64 object-cover object-center rounded">
            <iframe v-if="product.model"
              title="Modelo_RS_Ejemplo" 
              class="w-full h-full"
              frameborder="0" 
              allowfullscreen 
              mozallowfullscreen="true" 
              webkitallowfullscreen="true" 
              allow="autoplay; fullscreen; xr-spatial-tracking" 
              xr-spatial-tracking 
              execution-while-out-of-viewport 
              execution-while-not-rendered 
              web-share :src="product.model">
            </iframe>
            <img v-else :src="product.images.card" alt="product image" class="w-full h-full max-h-[450px] object-cover object-center rounded-lg">
          </div>
          <div class="lg:w-1/2 w-full lg:pl-10 lg:py-6 mt-6 lg:mt-0">
            <h2 class="text-sm title-font text-gray-500 tracking-widest">TIPO DE CARGA: {{ product.type }}</h2>
            <h1 class="text-gray-900 text-3xl title-font font-medium mb-1">{{ product.name }}</h1>
            
            <p class="leading-relaxed text-justify pt-3">{{ product.description.long }}</p>
            <ul class="list-disc pl-10 pt-4">
              <li v-for="perk in product.perks">{{ perk }}</li>
            </ul>
            <div class="mt-10">
              <button class="flex w-full bg-orange-400 hover:bg-orange-500 text-white border-0 py-2 px-6 focus:outline-none rounded mt-2 transition-colors">Arma tu Ángulo Ranurado </button>
              <button class="flex w-full bg-orange-400 hover:bg-orange-500 text-white border-0 py-2 px-6 focus:outline-none rounded mt-2 transition-colors">Solicitar Cotización</button>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="text-gray-600 body-font" v-if="product.technicalSpecs.length > 0">
      <div class="container px-5 py-24 mx-auto">
        <div class="flex flex-col">
          <div class="h-1 bg-gray-200 rounded overflow-hidden">
            <div class="w-24 h-full bg-yellow-500"></div>
          </div>
          <div class="flex flex-wrap sm:flex-row flex-col py-6 mb-12">
            <h1 class="sm:w-2/5 text-gray-900 font-medium title-font text-2xl mb-2 sm:mb-0">Especificaciones Técnicas
            </h1>
          </div>
        </div>
        <div class="flex flex-wrap -m-4">
          <div class="xl:w-1/3 md:w-1/2 p-4" v-for="(spec, index) in product.technicalSpecs" :key="index">
            <div class="border border-gray-200 p-6 rounded-lg flex flex-col h-full">
              <div class="p-3 rounded-lg">
                <img class="h-40 rounded w-50 mx-auto object-cover object-center mb-6"
                  :src="spec.image" alt="content">
              </div>
              <h2 class="text-lg text-gray-900 font-medium title-font mb-2">{{ spec.name }}</h2>
              <p class="leading-relaxed text-base text-justify flex-grow">{{ spec.description }}</p>
              <ul class="list-disc pl-10 pt-5">
                <li v-for="perk in spec.perks">{{ perk }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="text-gray-600 body-font" v-if="product.infoCards.length > 0">
      <div class="container px-5 py-24 mx-auto">
        <div class="flex flex-wrap -m-4">
          <div class="p-4 md:w-1/2 w-full" v-for="(infoCard, index) in product.infoCards" :key="index">
            <div class="h-full bg-gray-100 text-gray-700 text-lg p-8 rounded">
              <h3 class="text-2xl mb-4">{{ infoCard.title }}</h3>
              <p class="leading-relaxed mb-6">{{ infoCard.description }}</p>
              <ul class="list-disc pl-10">
                <li v-if="infoCard.perks" v-for="perk in infoCard.perks"> {{ perk }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
  <div v-else>
    <p>Product not found. Please check the URL or go back to the <a href="/">homepage</a>.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useProductStore } from '~/stores/productStore';

const productStore = useProductStore();
const products = productStore.products;

const route = useRoute();
const router = useRouter();
const product = ref(null);

onMounted(() => {
  const slug = route.params.slug;
  product.value = products.find(p => p.slug === slug);

  if (!product.value) {
    router.push('/404');
    // Optionally, you can redirect to a 404 page or homepage
    // router.push('/404'); // Uncomment this line to redirect to a 404 page
    // router.push('/'); // Uncomment this line to redirect to the homepage
  }
});
</script>

<style scoped>
/* Add your styles here */
</style>