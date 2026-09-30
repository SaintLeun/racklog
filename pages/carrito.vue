<template>
  <div class="bg-neutral-50">
    <div class="container-page py-12 sm:py-16 lg:py-20">
      <!-- Encabezado -->
      <header class="max-w-2xl">
        <span class="eyebrow">Detalle</span>
        <h1 class="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">Tu Cotización Personalizada</h1>
        <p class="mt-4 text-lg leading-relaxed text-neutral-600">
          Revisa los productos configurados y solicita tu cotización formal.
        </p>
      </header>

      <div v-if="cart.length > 0" class="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-12 lg:gap-10">
        <!-- Productos -->
        <section class="lg:col-span-7" aria-labelledby="cart-products-title">
          <div class="mb-4 flex items-center justify-between gap-4">
            <h2 id="cart-products-title" class="text-lg font-semibold text-neutral-900">
              Productos <span class="font-normal text-neutral-600">({{ cart.length }})</span>
            </h2>
            <button
              type="button"
              @click="clearCart"
              class="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Vaciar Carrito
            </button>
          </div>

          <ul class="space-y-4">
            <li
              v-for="product in cart"
              :key="product.name + JSON.stringify(product.config)"
              class="card p-5 sm:p-6"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <h3 class="text-lg font-semibold tracking-tight text-neutral-900">{{ product.name }}</h3>
                  <span v-if="product.quoteOnly" class="mt-2 inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-600/15 ring-inset">
                    Solo cotización
                  </span>
                </div>
                <button
                  type="button"
                  @click="removeFromCart(product.name, product.config)"
                  class="-mr-2 -mt-2 inline-flex min-h-11 flex-shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-neutral-600 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Eliminar
                </button>
              </div>

              <!-- Configuración -->
              <div v-if="product.config" class="mt-4">
                <p v-if="Object.keys(product.config).length === 0" class="text-sm text-neutral-600">Sin configuración específica</p>

                <ul v-else class="flex flex-wrap gap-2 text-sm">
                  <li v-if="product.config.tipo" class="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-neutral-600">Tipo: <span class="font-semibold text-neutral-900">{{ formatConfigValue('tipo', product.config.tipo) }}</span></li>
                  <li v-if="product.config.niveles" class="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-neutral-600">Niveles: <span class="font-semibold text-neutral-900">{{ product.config.niveles }}</span></li>
                  <li v-if="product.config.cuerpos" class="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-neutral-600">Cuerpos: <span class="font-semibold text-neutral-900">{{ product.config.cuerpos }}</span></li>

                  <!-- Propiedades de Ángulo Ranurado -->
                  <li v-if="product.config.pintado" class="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-neutral-600">Acabado: <span class="font-semibold text-neutral-900">{{ formatConfigValue('pintado', product.config.pintado) }}</span></li>
                  <li v-if="product.config.bandeja" class="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-neutral-600">Ancho de bandeja: <span class="font-semibold text-neutral-900">{{ product.config.bandeja }}</span></li>

                  <!-- Propiedades de Rack Selectivo -->
                  <li v-if="product.config.frentePallet" class="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-neutral-600">Frente: <span class="font-semibold text-neutral-900">{{ product.config.frentePallet }}</span></li>
                  <li v-if="product.config.fondoPallet" class="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-neutral-600">Fondo: <span class="font-semibold text-neutral-900">{{ product.config.fondoPallet }}</span></li>
                  <li v-if="product.config.altoPallet" class="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-neutral-600">Alto: <span class="font-semibold text-neutral-900">{{ product.config.altoPallet }}</span></li>

                  <!-- Capacidad de carga (común a ambos productos pero con distintos valores) -->
                  <li v-if="product.config.carga" class="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-neutral-600">Capacidad de carga: <span class="font-semibold text-neutral-900">{{ product.config.carga }}</span></li>
                </ul>
              </div>

              <!-- Precio, cantidad y subtotal -->
              <div class="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-neutral-100 pt-5">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-neutral-600">Cantidad</p>
                  <div class="mt-1.5 inline-flex items-center rounded-xl bg-white ring-1 ring-neutral-200">
                    <button
                      type="button"
                      :aria-label="`Quitar una unidad de ${product.name}`"
                      @click="updateQuantity(product.name, product.config, product.quantity - 1)"
                      class="inline-flex h-11 w-11 items-center justify-center rounded-l-xl text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
                      :disabled="product.quantity <= 1"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                      </svg>
                    </button>
                    <span class="min-w-10 px-2 text-center font-semibold tabular-nums text-neutral-900" aria-live="polite">{{ product.quantity }}</span>
                    <button
                      type="button"
                      :aria-label="`Agregar una unidad de ${product.name}`"
                      @click="updateQuantity(product.name, product.config, product.quantity + 1)"
                      class="inline-flex h-11 w-11 items-center justify-center rounded-r-xl text-neutral-700 transition-colors hover:bg-neutral-100"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="text-right">
                  <template v-if="product.quoteOnly">
                    <p class="text-sm text-neutral-600">Precio sujeto a evaluación</p>
                    <p class="mt-0.5 text-sm text-neutral-600">Subtotal: <span class="text-xl font-bold text-sky-800">A cotizar</span></p>
                  </template>
                  <template v-else>
                    <p class="text-sm text-neutral-600">${{ product.price?.toLocaleString('es-CL') }} <span class="text-neutral-600">precio unitario</span></p>
                    <p class="mt-0.5 text-sm text-neutral-600">Subtotal: <span class="text-xl font-bold tabular-nums text-neutral-900">${{ (product.price * product.quantity).toLocaleString('es-CL') }}</span></p>
                  </template>
                </div>
              </div>
            </li>
          </ul>
        </section>

        <!-- Resumen y formulario -->
        <aside class="space-y-6 lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <!-- Resumen -->
          <section class="card p-6" aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title" class="text-lg font-semibold text-neutral-900">Resumen</h2>
            <div class="mt-4 flex items-baseline justify-between gap-4 border-t border-neutral-100 pt-4">
              <span class="text-base font-medium text-neutral-700">Total:</span>
              <!-- Show appropriate total based on whether there are quote-only products -->
              <div v-if="hasQuoteOnlyProducts" class="text-right">
                <span class="text-2xl font-bold text-sky-800">A cotizar</span>
                <p class="mt-1 text-sm text-neutral-600">Incluye productos con precio a consultar</p>
              </div>
              <div v-else>
                <span class="text-2xl font-bold tabular-nums text-neutral-900 sm:text-3xl">${{ cartTotal.toLocaleString('es-CL') }}</span>
              </div>
            </div>

            <!-- High value alert -->
            <div v-if="isHighValueQuote" class="mt-5 flex items-start gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-600/20 ring-inset">
              <span class="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700" aria-hidden="true">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </span>
              <div>
                <h3 class="text-sm font-semibold text-amber-900">Cotización de alto valor</h3>
                <p class="mt-1 text-sm leading-relaxed text-amber-800">
                  Esta cotización supera los $3.000.000. Uno de nuestros ejecutivos comerciales se pondrá en contacto para ofrecerle condiciones especiales y verificar detalles específicos de su pedido.
                </p>
              </div>
            </div>
          </section>

          <!-- Formulario de contacto -->
          <section class="card p-6" aria-labelledby="cart-contact-title">
            <h2 id="cart-contact-title" class="text-lg font-semibold text-neutral-900">Información de Contacto</h2>

            <!-- Honeypot anti-bots: oculto para personas -->
            <input v-model="honeypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;" />

            <div class="mt-5 space-y-5">
              <!-- Name Input -->
              <div>
                <label for="nameInput" class="form-label">Nombre completo</label>
                <input
                  id="nameInput"
                  v-model="customerName"
                  type="text"
                  autocomplete="name"
                  placeholder="Juan Pérez"
                  class="form-input"
                  :aria-invalid="nameError ? 'true' : 'false'"
                  :aria-describedby="nameError ? 'nameInputError' : undefined"
                />
                <p v-if="nameError" id="nameInputError" class="form-error">{{ nameError }}</p>
              </div>

              <!-- Email Input -->
              <div>
                <label for="emailInput" class="form-label">Correo electrónico</label>
                <input
                  id="emailInput"
                  v-model="userEmail"
                  type="email"
                  autocomplete="email"
                  inputmode="email"
                  placeholder="ejemplo@correo.com"
                  class="form-input"
                  :aria-invalid="emailError ? 'true' : 'false'"
                  :aria-describedby="emailError ? 'emailInputError' : undefined"
                />
                <p v-if="emailError" id="emailInputError" class="form-error">{{ emailError }}</p>
              </div>

              <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <!-- Company Input -->
                <div>
                  <label for="companyInput" class="form-label">Empresa <span class="font-normal text-neutral-600">(opcional)</span></label>
                  <input
                    id="companyInput"
                    v-model="customerCompany"
                    type="text"
                    autocomplete="organization"
                    placeholder="Nombre de la empresa"
                    class="form-input"
                  />
                </div>

                <!-- Phone Input -->
                <div>
                  <label for="phoneInput" class="form-label">Teléfono de contacto</label>
                  <input
                    id="phoneInput"
                    v-model="customerPhone"
                    type="text"
                    autocomplete="tel"
                    inputmode="tel"
                    placeholder="+56 9 1234 5678"
                    class="form-input"
                    :aria-invalid="phoneError ? 'true' : 'false'"
                    :aria-describedby="phoneError ? 'phoneInputError' : undefined"
                  />
                  <p v-if="phoneError" id="phoneInputError" class="form-error">{{ phoneError }}</p>
                </div>
              </div>

              <!-- Comments Textarea -->
              <div>
                <label for="commentsInput" class="form-label">Comentarios adicionales <span class="font-normal text-neutral-600">(opcional)</span></label>
                <textarea
                  id="commentsInput"
                  v-model="customerComments"
                  rows="4"
                  placeholder="Indique detalles adicionales, consultas específicas o fechas de entrega deseadas."
                  class="form-input"
                ></textarea>
              </div>

              <!-- Consentimiento de privacidad (opt-in explicito, no premarcado) -->
              <div class="flex items-start gap-3">
                <input
                  id="privacyInput"
                  v-model="privacyAccepted"
                  type="checkbox"
                  class="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-neutral-300 accent-brand-600"
                  :aria-invalid="privacyError ? 'true' : 'false'"
                  :aria-describedby="privacyError ? 'privacyError' : undefined"
                />
                <div class="text-sm leading-relaxed">
                  <label for="privacyInput" :class="privacyError ? 'text-red-700' : 'text-neutral-600'">
                    Acepto la <NuxtLink to="/politica-privacidad" class="font-semibold text-brand-700 underline-offset-2 hover:underline">política de privacidad</NuxtLink> y el uso de mis datos para responder a esta cotización.
                  </label>
                  <p v-if="privacyError" id="privacyError" class="form-error">{{ privacyError }}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              @click="submitQuote"
              class="btn btn-primary btn-lg mt-6 w-full"
              :disabled="isSubmitting"
            >
              <svg v-if="isSubmitting" class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSubmitting ? 'Enviando...' : 'Solicitar Cotización' }}
              <svg v-if="!isSubmitting" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </button>
          </section>
        </aside>
      </div>

      <!-- Carrito vacío -->
      <div v-else class="mt-10 lg:mt-12">
        <div class="card mx-auto max-w-xl px-6 py-14 text-center sm:px-10">
          <span class="icon-tile h-14 w-14 rounded-2xl" aria-hidden="true">
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </span>
          <p class="mt-5 text-lg text-neutral-700">No hay productos en tu cotización actualmente.</p>
          <NuxtLink to="/" class="btn btn-primary mt-8">
            Explorar Productos
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        ref="successDialogRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quoteSuccessTitle"
        tabindex="-1"
        class="animate-fade-in w-full rounded-t-3xl bg-white px-6 py-10 text-center shadow-2xl ring-1 ring-black/5 sm:max-w-md sm:rounded-2xl sm:px-8"
      >
        <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700" aria-hidden="true">
          <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
          </svg>
        </span>
        <h2 id="quoteSuccessTitle" class="mt-5 text-xl font-semibold text-neutral-900">¡Cotización Enviada!</h2>
        <p class="mt-2 text-neutral-600">Hemos enviado su cotización al correo proporcionado. Uno de nuestros ejecutivos se pondrá en contacto a la brevedad.</p>
        <button type="button" @click="closeSuccessModal" class="btn btn-dark mt-8 w-full">
          Aceptar
        </button>
      </div>
    </div>

    <!-- Error Modal -->
    <div v-if="showErrorModal" class="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        ref="errorDialogRef"
        role="alertdialog"
        aria-modal="true"
        tabindex="-1"
        aria-labelledby="quoteErrorTitle"
        aria-describedby="quoteErrorDesc"
        class="animate-fade-in w-full rounded-t-3xl bg-white px-6 py-10 text-center shadow-2xl ring-1 ring-black/5 sm:max-w-md sm:rounded-2xl sm:px-8"
      >
        <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700" aria-hidden="true">
          <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </span>
        <h2 id="quoteErrorTitle" class="mt-5 text-xl font-semibold text-neutral-900">Error al enviar</h2>
        <p id="quoteErrorDesc" class="mt-2 text-neutral-600">Ocurrió un error al enviar su cotización. Por favor intente nuevamente o contáctenos directamente.</p>
        <button type="button" @click="closeErrorModal" class="btn btn-secondary mt-8 w-full">
          Cerrar
        </button>
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
const honeypot = ref(''); // honeypot anti-bots
const customerName = ref('');
const customerCompany = ref('');
const customerPhone = ref('');
const customerComments = ref('');
const privacyAccepted = ref(false);

// Form validation errors
const emailError = ref('');
const nameError = ref('');
const phoneError = ref('');
const privacyError = ref('');

const isSubmitting = ref(false);

// Success/Error modals
const showSuccessModal = ref(false);
const showErrorModal = ref(false);
const successDialogRef = ref<HTMLElement | null>(null);
const errorDialogRef = ref<HTMLElement | null>(null);
useModalA11y(showSuccessModal, successDialogRef, () => closeSuccessModal());
useModalA11y(showErrorModal, errorDialogRef, () => closeErrorModal());

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
  privacyError.value = '';
  
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

  // Validate privacy consent
  if (!privacyAccepted.value) {
    privacyError.value = 'Debe aceptar la política de privacidad para enviar la cotización';
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
    

    
    const response = await fetch('https://api.racklog.cl/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: emailData,
        type: 'quote',
        website: honeypot.value
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status !== 'success') {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    // Leer el total antes de vaciar el carrito
    const quoteValue = calculatedCartTotal.value;

    // Conversion para GTM (GA4 y Google Ads): un lead, no una compra
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'generate_lead',
      event_category: 'Conversion',
      event_label: 'Quote Form Sent',
      funnel_step: 'quote_form_sent',
      lead_type: 'quote',
      lead_reference: data.reference,
      has_quote_only_products: hasQuoteOnlyProducts.value,
      currency: 'CLP',
      value: quoteValue
    });

    showSuccessModal.value = true;
    resetForm();
    clearCart();
  } catch (error) {
    showErrorModal.value = true;
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
  privacyAccepted.value = false;
  
  emailError.value = '';
  privacyError.value = '';
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

usePageSeo({
  title: 'Tu cotización',
  description: 'Revisa los productos de tu cotización y envíanos tus datos para recibir una propuesta de Racklog.',
  noindex: true,
});
</script>

<style scoped>
/* Modal animation */
.animate-fade-in {
  animation: fadeIn 0.25s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
