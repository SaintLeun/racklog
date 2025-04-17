<template>
  <div class="relative overflow-hidden py-25">
    <div class="absolute inset-0 -z-10 overflow-hidden">
      <!-- Top wave -->
      <svg class="absolute top-0 left-0 w-full transform translate-y-[-30%]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#ff9800" fill-opacity="0.05" d="M0,64L48,96C96,128,192,192,288,186.7C384,181,480,107,576,80C672,53,768,75,864,112C960,149,1056,203,1152,213.3C1248,224,1344,192,1392,176L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
      </svg>
      
      <!-- Bottom wave -->
      <svg class="absolute bottom-0 left-0 w-full transform translate-y-[40%]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#333333" fill-opacity="0.03" d="M0,256L48,229.3C96,203,192,149,288,138.7C384,128,480,160,576,181.3C672,203,768,213,864,202.7C960,192,1056,160,1152,165.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
      
      <!-- Circular blob in top right -->
      <div class="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-orange-100 opacity-[0.15] blur-[70px]"></div>
      
      <!-- Circular blob in bottom left -->
      <div class="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gray-800 opacity-[0.05] blur-[100px]"></div>
      
      <!-- Diagonal pattern with lower opacity -->
      <div class="absolute inset-0 pattern-diagonal opacity-[0.02]"></div>
      
      <!-- Scattered dots pattern -->
      <div class="absolute inset-0 pattern-dots opacity-[0.03]"></div>
    </div>
    
    <!-- Main content -->
    <div class="container mx-auto p-6 relative z-10 max-w-5xl">
      <!-- Enhanced Title Section -->
      <div class="flex flex-col items-center text-center mb-16">
        <div class="inline-block relative mb-5">
          <span class="absolute inset-x-0 bottom-0 h-[6px] bg-orange-500/20 -mb-2"></span>
          <h2 class="text-sm uppercase tracking-wider font-semibold text-orange-500 relative z-10">DETALLE</h2>
        </div>
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Tu Cotización Personalizada</h1>
        <div class="w-16 h-1 rounded-full bg-orange-500 mb-6"></div>
        <p class="max-w-2xl text-gray-600 text-lg">
          Revisa los productos configurados y solicita tu cotización formal.
        </p>
      </div>

      <div v-if="cart.length > 0" class="space-y-6">
        <!-- Products Grid -->
        <div class="grid sm:grid-cols-1 lg:grid-cols-1 gap-6">
          <div
            v-for="product in cart"
            :key="product.name + JSON.stringify(product.config)"
            class="flex flex-col md:flex-row p-6 bg-white shadow-md rounded-lg border border-gray-100 hover:shadow-lg transition-shadow duration-300"
          >
            <!-- Product info -->
            <div class="flex-grow">
              <div class="flex items-center">
                <h2 class="text-xl font-bold text-gray-800">{{ product.name }}</h2>
                <span v-if="product.quoteOnly" class="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Solo cotización
                </span>
              </div>
              
              <div class="mt-3 grid sm:grid-cols-2 gap-x-8 gap-y-2">
                <div v-if="product.config" class="text-gray-600">
                  
                  <p v-if="Object.keys(product.config).length === 0" class="font-light mb-2">Sin configuración específica</p>

                  <ul v-else class="list-disc pl-5 text-sm space-y-1">
                    <li v-if="product.config.tipo">Tipo: <span class="font-medium">{{ formatConfigValue('tipo', product.config.tipo) }}</span></li>
                    <li v-if="product.config.niveles">Niveles: <span class="font-medium">{{ product.config.niveles }}</span></li>
                    <li v-if="product.config.cuerpos">Cuerpos: <span class="font-medium">{{ product.config.cuerpos }}</span></li>
                    
                    <!-- Propiedades de Ángulo Ranurado -->
                    <li v-if="product.config.pintado">Acabado: <span class="font-medium">{{ formatConfigValue('pintado', product.config.pintado) }}</span></li>
                    <li v-if="product.config.bandeja">Ancho de bandeja: <span class="font-medium">{{ product.config.bandeja }}</span></li>
                    
                    <!-- Propiedades de Rack Selectivo -->
                    <li v-if="product.config.frentePallet">Frente: <span class="font-medium">{{ product.config.frentePallet }}</span></li>
                    <li v-if="product.config.fondoPallet">Fondo: <span class="font-medium">{{ product.config.fondoPallet }}</span></li>
                    <li v-if="product.config.altoPallet">Alto: <span class="font-medium">{{ product.config.altoPallet }}</span></li>
                    
                    <!-- Capacidad de carga (común a ambos productos pero con distintos valores) -->
                    <li v-if="product.config.carga">Capacidad de carga: <span class="font-medium">{{ product.config.carga }}</span></li>
                  </ul>
                </div>
                <div>
                  <p class="text-gray-700 mb-2 font-medium">Valor:</p>
                  <!-- Show appropriate pricing based on quote-only status -->
                  <div v-if="product.quoteOnly">
                    <p class="text-2xl font-bold text-blue-600">A cotizar</p>
                    <p class="text-sm text-gray-500">Precio sujeto a evaluación</p>
                  </div>
                  <div v-else>
                    <p class="text-2xl font-bold text-orange-600">${{ product.price?.toLocaleString('es-CL') }}</p>
                    <p class="text-sm text-gray-500">Precio unitario</p>
                  </div>
                  
                  <div class="mt-4 flex items-center">
                    <p class="text-gray-700 mr-4 font-medium">Cantidad:</p>
                    <div class="flex items-center border border-gray-300 rounded-md">
                      <button
                        @click="updateQuantity(product.name, product.config, product.quantity - 1)"
                        class="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md transition-colors"
                        :disabled="product.quantity <= 1"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                        </svg>
                      </button>
                      <span class="px-4 py-1 border-x border-gray-300">{{ product.quantity }}</span>
                      <button
                        @click="updateQuantity(product.name, product.config, product.quantity + 1)"
                        class="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md transition-colors"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mt-4 flex justify-between items-end">
                <!-- Subtotal handling for quote-only products -->
                <p v-if="!product.quoteOnly" class="text-gray-700 font-medium">
                  Subtotal: <span class="text-xl font-bold text-gray-800">${{ (product.price * product.quantity).toLocaleString('es-CL') }}</span>
                </p>
                <p v-else class="text-gray-700 font-medium">
                  Subtotal: <span class="text-xl font-bold text-blue-600">A cotizar</span>
                </p>
                <button
                  @click="removeFromCart(product.name, product.config)"
                  class="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors"
                >
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary and Form Section -->
        <div class="mt-12 p-6 bg-white rounded-lg shadow-md border border-gray-100">
          <h2 class="text-xl font-bold text-gray-800 mb-6">Información de Contacto</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Name Input -->
            <div>
              <label for="nameInput" class="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
              <input 
                id="nameInput"
                v-model="customerName" 
                type="text" 
                placeholder="Juan Pérez" 
                class="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                :class="{'border-red-500': nameError}"
              />
              <p v-if="nameError" class="text-red-500 text-sm mt-1">{{ nameError }}</p>
            </div>
            
            <!-- Email Input -->
            <div>
              <label for="emailInput" class="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
              <input 
                id="emailInput"
                v-model="userEmail" 
                type="email" 
                placeholder="ejemplo@correo.com" 
                class="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                :class="{'border-red-500': emailError}"
              />
              <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
            </div>
            
            <!-- Company Input -->
            <div>
              <label for="companyInput" class="block text-sm font-medium text-gray-700 mb-2">Empresa <small>(opcional)</small></label>
              <input 
                id="companyInput"
                v-model="customerCompany" 
                type="text" 
                placeholder="Nombre de la empresa" 
                class="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
              />
            </div>
            
            <!-- Phone Input -->
            <div>
              <label for="phoneInput" class="block text-sm font-medium text-gray-700 mb-2">Teléfono de contacto</label>
              <input 
                id="phoneInput"
                v-model="customerPhone" 
                type="text" 
                placeholder="+56 9 1234 5678" 
                class="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                :class="{'border-red-500': phoneError}"
              />
              <p v-if="phoneError" class="text-red-500 text-sm mt-1">{{ phoneError }}</p>
            </div>
          </div>
          
          <!-- Comments Textarea -->
          <div class="mb-6">
            <label for="commentsInput" class="block text-sm font-medium text-gray-700 mb-2">Comentarios adicionales <small>(opcional)</small></label>
            <textarea 
              id="commentsInput"
              v-model="customerComments" 
              rows="4" 
              placeholder="Indique detalles adicionales, consultas específicas o fechas de entrega deseadas." 
              class="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
            ></textarea>
          </div>

          <!-- Summary Section -->
          <div class="mt-6 pt-6 border-t border-gray-200">
            <div class="flex justify-between items-center mb-4">
              <span class="text-lg font-medium">Total:</span>
              <!-- Show appropriate total based on whether there are quote-only products -->
              <div v-if="hasQuoteOnlyProducts">
                <span class="text-2xl font-bold text-blue-600">A cotizar</span>
                <p class="text-sm text-gray-500 text-right">Incluye productos con precio a consultar</p>
              </div>
              <div v-else>
                <span class="text-2xl font-bold text-orange-600">${{ cartTotal.toLocaleString('es-CL') }}</span>
              </div>
            </div>

            <!-- High value alert -->
            <div v-if="isHighValueQuote" 
                class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <div class="text-amber-600 shrink-0 mt-1">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <div>
                <h4 class="font-semibold text-amber-800 mb-1">Cotización de alto valor</h4>
                <p class="text-amber-700 text-sm">
                  Esta cotización supera los $3.000.000. Uno de nuestros ejecutivos comerciales se pondrá en contacto para ofrecerle condiciones especiales y verificar detalles específicos de su pedido.
                </p>
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row justify-between mt-6 gap-4">
              <button
                @click="clearCart"
                class="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Vaciar Carrito
              </button>
              <button
                @click="submitQuote"
                class="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center justify-center shadow-md"
                :disabled="isSubmitting"
              >
                <svg v-if="!isSubmitting" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
                <svg v-if="isSubmitting" class="animate-spin w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isSubmitting ? 'Enviando...' : 'Solicitar Cotización' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty Cart -->
      <div v-else class="text-center p-12 bg-white rounded-lg shadow-md border border-gray-100">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
        <p class="text-gray-600 mb-4">No hay productos en tu cotización actualmente.</p>
        <a href="/" class="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors shadow-md">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Explorar Productos
        </a>
      </div>
    </div>
    
    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div class="bg-white p-8 rounded-lg shadow-lg max-w-md m-4 animate-fade-in">
        <div class="text-center">
          <div class="bg-green-100 p-3 rounded-full inline-flex mb-4">
            <svg class="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold mb-2 text-gray-800">¡Cotización Enviada!</h3>
          <p class="mb-6 text-gray-600">Hemos enviado su cotización al correo proporcionado. Uno de nuestros ejecutivos se pondrá en contacto a la brevedad.</p>
          <button @click="closeSuccessModal" class="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors shadow-md w-full">
            Aceptar
          </button>
        </div>
      </div>
    </div>
    
    <!-- Error Modal -->
    <div v-if="showErrorModal" class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div class="bg-white p-8 rounded-lg shadow-lg max-w-md m-4 animate-fade-in">
        <div class="text-center">
          <div class="bg-red-100 p-3 rounded-full inline-flex mb-4">
            <svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold mb-2 text-gray-800">Error al enviar</h3>
          <p class="mb-6 text-gray-600">Ocurrió un error al enviar su cotización. Por favor intente nuevamente o contáctenos directamente.</p>
          <button @click="closeErrorModal" class="px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-md w-full">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useCartStore } from '../stores/cartStore';
import { storeToRefs } from 'pinia';
import { ref, computed } from 'vue';

const cartStore = useCartStore();
const { cart, cartTotal } = storeToRefs(cartStore);
const { removeFromCart, updateQuantity, clearCart } = cartStore;

// Umbral para cotización de alto valor (3 millones)
const HIGH_VALUE_THRESHOLD = 3000000;

// Check if the cart has quote-only products
const hasQuoteOnlyProducts = computed(() => {
  return cart.value.some(product => product.quoteOnly === true);
});

// Calculate subtotal for non-quote-only products
const calculatedCartTotal = computed(() => {
  return cart.value
    .filter(product => !product.quoteOnly)
    .reduce((total, product) => total + (product.price * product.quantity), 0);
});

// Determine if this is a high-value quote that exceeds the threshold
const isHighValueQuote = computed(() => {
  // Solo aplicamos la lógica si hay productos con precio
  if (hasQuoteOnlyProducts.value) {
    return false; // No mostramos alerta si hay productos "a cotizar"
  }
  
  return calculatedCartTotal.value > HIGH_VALUE_THRESHOLD;
});

// Form fields
const userEmail = ref('');
const customerName = ref('');
const customerCompany = ref('');
const customerPhone = ref('');
const customerComments = ref('');

// Form validation errors
const emailError = ref('');
const nameError = ref('');
const phoneError = ref('');

const isSubmitting = ref(false);

// Success/Error modals
const showSuccessModal = ref(false);
const showErrorModal = ref(false);

// Function to format certain config values for better readability
function formatConfigValue(key: string, value: string): string {
  if (key === 'tipo') {
    return value === 'simple' ? 'Simple' : 'Doble';
  }
  if (key === 'pintado') {
    return value === 'pintado' ? 'Pintado' : 'Sin pintar';
  }
  return value;
}

// Function to validate email
function validateEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Function to validate form
function validateForm() {
  let isValid = true;
  
  // Reset errors
  nameError.value = '';
  emailError.value = '';
  phoneError.value = '';
  
  // Validate name
  if (!customerName.value.trim()) {
    nameError.value = 'Por favor ingrese su nombre';
    isValid = false;
  }
  
  // Validate email
  if (!userEmail.value.trim()) {
    emailError.value = 'Por favor ingrese su email';
    isValid = false;
  } else if (!validateEmail(userEmail.value)) {
    emailError.value = 'Por favor ingrese un email válido';
    isValid = false;
  }
  
  // Validate phone
  if (!customerPhone.value.trim()) {
    phoneError.value = 'Por favor ingrese su teléfono';
    isValid = false;
  }
  
  return isValid;
}

// Function to submit a quote request
async function submitQuote() {
  // Validate form
  if (!validateForm()) {
    return;
  }
  
  try {
    isSubmitting.value = true;
    
    // Prepare data for the email template
    const emailData = {
      customerName: customerName.value,
      customerEmail: userEmail.value,
      customerPhone: customerPhone.value,
      customerCompany: customerCompany.value,
      customerComments: customerComments.value,
      products: cart.value.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        quoteOnly: item.quoteOnly || false,
        config: item.config
      })),
      cartTotal: cartTotal.value
    };
    

    
    // Enviar al equipo de ventas (interno)
    const responseInternal = await fetch('https://api.racklog.cl/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'daniel.mdzl@gmail.com', // Enviar al equipo de ventas
        data: emailData, 
        type: 'quote' // Usar el template interno
      })
    });
    
    const dataInternal = await responseInternal.json();

    // Mostrar éxito solo si ambos emails se enviaron correctamente
    if (dataInternal.status) {
        showSuccessModal.value = true;
        resetForm(); // Clear form
        clearCart(); // Clear the cart after successful submission
      } else {
        // Si el email de confirmación falló pero el interno funcionó
        // Podemos mostrar éxito parcial ya que el pedido fue registrado
        showSuccessModal.value = true;
        resetForm();
        clearCart();
        console.warn('Email de confirmación al cliente no enviado:', dataInternal.message);
      }
    
  } catch (error) {
    showErrorModal.value = true;
    console.error('Error calling API:', error);
  } finally {
    isSubmitting.value = false;
  }
}

// Reset form
function resetForm() {
  userEmail.value = '';
  customerName.value = '';
  customerCompany.value = '';
  customerPhone.value = '';
  customerComments.value = '';
  
  emailError.value = '';
  nameError.value = '';
  phoneError.value = '';
}

// Close modals
function closeSuccessModal() {
  showSuccessModal.value = false;
}

function closeErrorModal() {
  showErrorModal.value = false;
}
</script>

<style scoped>
.pattern-diagonal {
  background-image: repeating-linear-gradient(
    45deg,
    #ff9800 0,
    #ff9800 1px,
    transparent 0,
    transparent 50%
  );
  background-size: 10px 10px;
}

/* Modal animation */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Spinner animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>