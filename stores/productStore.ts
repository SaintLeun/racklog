import { defineStore } from 'pinia';
import productsData from '../locales/es/products.json';

interface Product {
  name: string;
  description: string;
  image?: string;
}

export const useProductStore = defineStore('productStore', {
  state: () => ({
    products: productsData.products.map((product: Product) => ({
      name: product.name,
      description: product.description,
      image: product.image || '/assets/images/default-image.png', // Default image if not provided
    })),
  }),
});