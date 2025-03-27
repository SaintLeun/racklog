<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Carrito de Compras</h1>

    <div v-if="cart.length > 0" class="space-y-4">
      <div
        v-for="product in cart"
        :key="product.id + JSON.stringify(product.config)"
        class="flex items-center justify-between p-4 bg-white shadow rounded"
      >
        <div>
          <h2 class="text-lg font-semibold">{{ product.name }}</h2>
          <p class="text-gray-500">Precio: ${{ product.price }}</p>
          <p class="text-gray-500">Configuración: {{ product.config }}</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="flex items-center">
            <button
              @click="updateQuantity(product.id, product.config, product.quantity - 1)"
              class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              -
            </button>
            <span class="px-4">{{ product.quantity }}</span>
            <button
              @click="updateQuantity(product.id, product.config, product.quantity + 1)"
              class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              +
            </button>
          </div>
          <button
            @click="removeFromCart(product.id, product.config)"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div class="mt-6 p-4 bg-gray-100 rounded">
        <p class="text-lg font-semibold">Total: ${{ cartTotal }}</p>
        <button
          @click="clearCart"
          class="mt-4 px-6 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Vaciar Carrito
        </button>
      </div>
    </div>

    <div v-else class="text-center text-gray-500">
      <p>No hay productos en el carrito.</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useCartStore } from '../stores/cartStore';
import { storeToRefs } from 'pinia';

const cartStore = useCartStore();
const { cart, cartTotal } = storeToRefs(cartStore);

const { removeFromCart, updateQuantity, clearCart } = cartStore;
</script>

<style scoped>
.container {
  max-width: 800px;
}
</style>