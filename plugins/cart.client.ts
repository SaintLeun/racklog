import { useCartStore } from '~/stores/cartStore';

// Cargar el carrito guardado despues de hidratar, para que el HTML generado
// y el primer render del navegador coincidan
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    useCartStore().loadCart();
  });
});
