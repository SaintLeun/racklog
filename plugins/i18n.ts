import { defineNuxtPlugin } from '#app';
import { createI18n } from 'vue-i18n';
import enProducts from '../locales/en/products.json';
import esProducts from '../locales/es/products.json';

const messages = {
  en: {
    products: enProducts,
  },
  es: {
    products: esProducts,
  },
};

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: 'es',
  messages,
});

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(i18n);
});