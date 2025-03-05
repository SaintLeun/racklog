import { defineStore } from 'pinia';
import productsData from '../locales/es-ES.json';

interface Product {
  name: string;
  description: string;
  image: string;
  url: string;
}

export const useProductStore = defineStore('productStore', {
  state: () => ({
    products: productsData.products as Record<string, Product>,
  }),
});