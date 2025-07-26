<template>
  <div class="cta-section relative overflow-hidden">
    <!-- Vector Background (unchanged) -->
    <div class="absolute inset-0 z-0 opacity-10">
      <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
        <path fill="#ff9800" d="M0,96L48,122.7C96,149,192,203,288,202.7C384,203,480,149,576,128C672,107,768,117,864,144C960,171,1056,213,1152,213.3C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
    </div>
    <div class="absolute inset-0 z-0 opacity-5">
      <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" style="transform: rotate(180deg)">
        <path fill="#000000" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,266.7C960,267,1056,245,1152,229.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
    </div>
    
    <!-- Subtle diagonal pattern (unchanged) -->
    <div class="absolute inset-0 z-0 opacity-5 pattern-diagonal"></div>
    
    <!-- Content -->
    <section class="text-gray-700 body-font relative z-10">
      <div class="container px-5 py-24 mx-auto">
        <div class="flex flex-col text-center w-full mb-12">
          <h1 class="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">¿Necesitas atención personalizada?</h1>
          <p class="lg:w-2/3 mx-auto leading-relaxed text-base">Ingresa tus datos y un ejecutivo se pondrá en contacto contigo</p>
        </div>
        <form @submit.prevent="submitForm" class="flex lg:w-2/3 w-full sm:flex-row flex-col mx-auto px-8 sm:space-x-4 sm:space-y-0 space-y-4 sm:px-0 items-end">
          <div class="relative flex-grow w-full">
            <label for="full-name" class="leading-7 text-sm text-gray-600">Nombre</label>
            <input 
              v-model="formData.name" 
              type="text" 
              id="full-name" 
              name="full-name" 
              required
              class="w-full bg-white bg-opacity-90 rounded border border-gray-300 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out shadow-sm"
            >
          </div>
          <div class="relative flex-grow w-full">
            <label for="business" class="leading-7 text-sm text-gray-600">Empresa <small>(opcional)</small></label>
            <input 
              v-model="formData.business" 
              type="text" 
              id="business" 
              name="business" 
              class="w-full bg-white bg-opacity-90 rounded border border-gray-300 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out shadow-sm"
            >
          </div>
          <div class="relative flex-grow w-full">
            <label for="phone" class="leading-7 text-sm text-gray-600">Teléfono</label>
            <input 
              v-model="formData.phone" 
              type="text" 
              id="phone" 
              name="phone" 
              required
              class="w-full bg-white bg-opacity-90 rounded border border-gray-300 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out shadow-sm"
            >
          </div>
          <div class="relative flex-grow w-full">
            <label for="email" class="leading-7 text-sm text-gray-600">Correo</label>
            <input 
              v-model="formData.email" 
              type="email" 
              id="email" 
              name="email" 
              required
              class="w-full bg-white bg-opacity-90 rounded border border-gray-300 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out shadow-sm"
            >
          </div>
          <button 
            type="submit" 
            class="text-white bg-orange-500 border-0 py-2 px-8 focus:outline-none hover:bg-orange-600 rounded text-lg shadow-md transition-colors duration-300 ease-in-out relative overflow-hidden min-w-[160px] w-full sm:w-auto"
            :disabled="isSubmitting"
          >
            <span v-if="!isSubmitting">Enviar</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </span>
          </button>
        </form>
      </div>
      
      <!-- Success/Error Messages -->
      <div class="fixed bottom-4 right-4 z-50">
        <transition name="fade">
          <div v-if="showSuccessMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md flex items-center max-w-md">
            <svg class="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <div>
              <p class="font-bold">Solicitud enviada</p>
              <p>Pronto un ejecutivo se pondrá en contacto contigo.</p>
            </div>
            <button @click="showSuccessMessage = false" class="ml-auto text-green-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </transition>
        
        <transition name="fade">
          <div v-if="showErrorMessage" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md flex items-center max-w-md">
            <svg class="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <p class="font-bold">Error al enviar</p>
              <p>Por favor intenta nuevamente o contáctanos directamente al <b>(+56) 9 6369 9510</b></p>
            </div>
            <button @click="showErrorMessage = false" class="ml-auto text-red-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </transition>
      </div>
      
      <!-- Decorative Elements (unchanged) -->
      <div class="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-orange-200 opacity-20 z-0"></div>
      <div class="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gray-900 opacity-10 z-0"></div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';

// Form data state
const formData = ref({
  name: '',
  business: '',
  phone: '',
  email: ''
});

// Form submission state
const isSubmitting = ref(false);
const showSuccessMessage = ref(false);
const showErrorMessage = ref(false);

// Function to submit the form
async function submitForm() {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  showSuccessMessage.value = false;
  showErrorMessage.value = false;

  // GTM event: CTA form opened/submitted
  const nuxtApp = useNuxtApp();
  const $gtmEvent = nuxtApp.$gtmEvent || null;
  if ($gtmEvent) {
    console.log('[GTM] CTA form submit event fired');
    $gtmEvent('begin_checkout', {
      event_category: 'Funnel',
      event_label: 'CTA Form Submitted',
      funnel_step: 'cta_form_submitted',
    });
  } else {
    console.log('[GTM] $gtmEvent not available on CTA form submit');
  }

  try {
    // Preparar los datos para el correo en el formato estándar
    const contactData = {
      name: formData.value.name,
      email: formData.value.email,
      phone: formData.value.phone,
      subject: 'Solicitud de información desde formulario CTA',
      message: `Cliente solicitando contacto desde formulario principal de la página.`,
      serviceInfo: 'Formulario principal'
    };

    // Enviar usando el endpoint estándar con type=contact
    const response = await fetch('https://api.racklog.cl/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formData.value.email,
        data: contactData,
        type: 'contact' // Usar el mismo tipo que usa ContactModal.vue
      })
    });

    const result = await response.json();

    if (result.success || result.status === 'success') {
      // Show success message and reset form
      showSuccessMessage.value = true;
      resetForm();

      // GTM event: CTA form conversion
      if ($gtmEvent) {
        console.log('[GTM] CTA form conversion event fired');
        $gtmEvent('conversion', {
          event_category: 'Funnel',
          event_label: 'CTA Form Sent',
          funnel_step: 'cta_form_sent',
        });
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        showSuccessMessage.value = false;
      }, 5000);
    } else {
      // Show error message
      showErrorMessage.value = true;
      console.error('Error sending email:', result.message);
    }
  } catch (error) {
    // Show error message
    showErrorMessage.value = true;
    console.error('Error submitting form:', error);
  } finally {
    isSubmitting.value = false;
  }
}

// Function to reset the form after successful submission
function resetForm() {
  formData.value = {
    name: '',
    business: '',
    phone: '',
    email: ''
  };
}

// Log gtag on component mount
onMounted(() => {
  const nuxtApp = useNuxtApp();
  const gtag = nuxtApp.$gtag || nuxtApp.gtag || null;
  console.log('[gtag] onMounted CTA, nuxtApp.$gtag:', gtag);
});
</script>

<style scoped>
.cta-section {
  background-color: #fafafa;
  position: relative;
}

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

/* Subtle hover effect for the button */
button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Smooth transitions */
input, button {
  transition: all 0.3s ease;
}

/* Animation for the loading spinner */
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

/* Fade transition for alerts */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>