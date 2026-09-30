import { useCartStore } from '~/stores/cartStore';

// Cargar el carrito guardado cuando la hidratacion ya termino: si se carga
// antes, el HTML generado (carrito vacio) no coincide con el primer render
// del navegador y Vue deja la pagina mal armada (hydration mismatch)
export default defineNuxtPlugin(() => {
  onNuxtReady(() => {
    useCartStore().loadCart();
  });
});
