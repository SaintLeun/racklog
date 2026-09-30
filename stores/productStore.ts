import { defineStore } from 'pinia';
import productsData from './products.json';
import servicesData from './services.json';


export const useProductStore = defineStore('productStore', {
  state: () => ({
    products: productsData,
    services: servicesData,
  }),
  getters: {
    getProducts: (state) => state.products,
    getServices: (state) => state.services,
  },
});
