import { defineStore } from 'pinia';
import productsData from './products.json';
import accesoriesData from './accesories.json';
import servicesData from './services.json';


export const useProductStore = defineStore('productStore', {
  state: () => ({
    products: productsData,
    accesories: accesoriesData,
    services: servicesData,
  }),
  getters: {
    getProducts: (state) => state.products,
    getAccesories: (state) => state.accesories,
    getServices: (state) => state.services,
  },
});
