import { defineStore } from 'pinia';

export interface CartItem {
  id: string; // Unique identifier for the product
  name: string; // Product name
  quantity: number; // Quantity of the product
  price: number; // Price per unit
  total: number; // Total price (quantity * price)
  quoteOnly: boolean; // Indicates if the product is for quotation only
  config: Record<string, any>; // Configuration details (e.g., niveles, cuerpos, etc.)
}

export const useCartStore = defineStore('cartStore', {
  state: () => ({
    cart: JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[], // Load cart from localStorage
  }),
  actions: {
    // Add a product to the cart
    addToCart(product: Omit<CartItem, 'total'>) {
      const existingItem = this.cart.find(
        (item) =>
          item.id === product.id &&
          JSON.stringify(item.config) === JSON.stringify(product.config)
      );
      if (existingItem) {
        existingItem.quantity += product.quantity;
        existingItem.total = existingItem.quantity * existingItem.price;
      } else {
        this.cart.push({
          ...product,
          total: product.quantity * product.price,
        });
      }
      this.saveCart(); // Save cart to localStorage
    },

    // Remove a product from the cart
    removeFromCart(productId: string, config: Record<string, any>) {
      const index = this.cart.findIndex(
        (item) =>
          item.id === productId &&
          JSON.stringify(item.config) === JSON.stringify(config)
      );
      if (index !== -1) {
        this.cart.splice(index, 1);
        this.saveCart(); // Save cart to localStorage
      }
    },

    // Update the quantity of a product in the cart
    updateQuantity(productId: string, config: Record<string, any>, quantity: number) {
      const item = this.cart.find(
        (item) =>
          item.id === productId &&
          JSON.stringify(item.config) === JSON.stringify(config)
      );
      if (item) {
        if (quantity > 0) {
          item.quantity = quantity;
          item.total = item.quantity * item.price;
        } else {
          this.removeFromCart(productId, config); // Remove item if quantity is 0
        }
        this.saveCart(); // Save cart to localStorage
      }
    },

    // Clear the cart
    clearCart() {
      this.cart = [];
      this.saveCart(); // Save cart to localStorage
    },

    // Save the cart to localStorage
    saveCart() {
      localStorage.setItem('cart', JSON.stringify(this.cart));
    },
  },
  getters: {
    // Get the total price of all items in the cart
    cartTotal: (state) =>
      state.cart.reduce((total, item) => total + item.total, 0),

    // Get the total number of items in the cart
    cartCount: (state) =>
      state.cart.reduce((count, item) => count + item.quantity, 0),
  },
});
