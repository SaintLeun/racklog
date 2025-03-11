import { defineStore } from 'pinia';
import { onMounted } from 'vue';
import axios from 'axios';
import productsData from './products.json';
import accesoriesData from './accesories.json';
import servicesData from './services.json';


export const useProductStore = defineStore('productStore', {
  state: () => ({
    products: productsData,
    kommoListAnguloRanurado: [] as any[], // New state property for the fetched list
  }),
  actions: {
    async fetchKommoListAnguloRanurado() {
      try {
        console.log('KOMMO_API_TOKEN:', import.meta.env.VITE_KOMMO_API_TOKEN); // Debugging line to check the token
        const response = await axios.get('https://comercialracklogcl.kommo.com/api/v4/catalog/19288', {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_KOMMO_API_TOKEN}`,
          },
        });
        this.kommoListAnguloRanurado = response.data;
        console.log(response.data)
      } catch (error) {
        console.error('Failed to fetch kommoListAnguloRanurado:', error);
      }
    },
  },
  getters: {
    getProducts: (state) => state.products,
    getKommoListAnguloRanurado: (state) => state.kommoListAnguloRanurado,
  },
});
