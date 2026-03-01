<template>
  <transition name="fade">
    <div v-if="isVisible" class="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4 overflow-y-auto">
      <transition name="slide-up">
        <div class="bg-white rounded-xl w-full max-w-5xl shadow-xl overflow-hidden relative">
          <!-- Close button (floating) -->
          <button 
            @click="closeModal" 
            class="absolute top-4 right-4 z-10 rounded-full p-2 bg-white/80 backdrop-blur-sm hover:bg-gray-100 shadow-md transition-all duration-300 transform hover:rotate-90"
            aria-label="Cerrar ventana"
          >
            <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          <div class="flex flex-col md:flex-row">
            <!-- Left Section (Special Offer) -->
            <div class="hidden sm:static md:w-2/5 bg-gradient-to-br from-orange-500 to-orange-600 text-white p-8 lg:p-10 relative overflow-hidden">
              <!-- Background decorative elements -->
              <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
              <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              <!-- Special offer badge -->
              <div class="inline-flex items-center px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 text-sm font-bold mb-6 animate-pulse">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                OFERTA ESPECIAL
              </div>
              
              <!-- Main offer content -->
              <h2 class="text-3xl font-bold mb-4 leading-tight">
                ¡Hasta 15% de descuento!
              </h2>
              
              <div class="hidden sm:static bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
                <h3 class="text-xl font-semibold mb-3">Cotiza a través de nuestra web</h3>
                <p class="text-white/90 mb-4">
                  Obtén hasta <span class="font-bold text-yellow-300">15% de descuento</span> en tu cotización cuando la realizas directamente desde nuestro sitio web.
                </p>
              </div>
              
              <!-- Benefits list -->
              <div class="hidden sm:static space-y-3 mb-8">
                <div class="flex items-start">
                  <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-400 flex items-center justify-center mt-0.5">
                    <svg class="w-3 h-3 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p class="ml-3 text-sm text-white/90">Respuesta inmediata por email</p>
                </div>
                
                <div class="flex items-start">
                  <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-400 flex items-center justify-center mt-0.5">
                    <svg class="w-3 h-3 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p class="ml-3 text-sm text-white/90">Cotización detallada y personalizada</p>
                </div>
                
                <div class="flex items-start">
                  <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-400 flex items-center justify-center mt-0.5">
                    <svg class="w-3 h-3 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p class="ml-3 text-sm text-white/90">Asesoría técnica especializada</p>
                </div>
                
                <div class="flex items-start">
                  <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-400 flex items-center justify-center mt-0.5">
                    <svg class="w-3 h-3 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p class="ml-3 text-sm text-white/90">Sin compromiso de compra</p>
                </div>
              </div>
              
              <!-- CTA Section -->
              <div class="bg-white/15 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                <p class="text-center text-sm text-white/90 mb-2">
                  ¿Necesitas asesoría inmediata?
                </p>
                <div class="flex items-center justify-center space-x-4 text-sm">
                  <div class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    <span>(+56) 9 3240 3819 - (+56) 9 6369 9510</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Right Section (Form) -->
            <div class="md:w-3/5 p-8 lg:p-10">
              <!-- Form header -->
              <div class="mb-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-2">Solicita tu cotización con descuento</h3>
                <p class="text-gray-600 text-sm">Completa el formulario y obtén hasta 15% de descuento en tu proyecto</p>
              </div>
              
              <!-- Status message (success/error) -->
              <transition name="fade">
                <div v-if="formStatus.message" 
                     :class="`mb-6 p-4 rounded-lg text-sm ${formStatus.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <svg v-if="formStatus.success" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <svg v-else class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <p>{{ formStatus.message }}</p>
                    </div>
                  </div>
                </div>
              </transition>
              
              <!-- Contact form -->
              <form @submit.prevent="submitForm" class="space-y-5">
                <!-- Name and Email row -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input 
                      v-model="form.name" 
                      type="text" 
                      id="name" 
                      name="name" 
                      :class="[
                        'block w-full px-4 py-3 rounded-lg border bg-gray-50 focus:bg-white focus:outline-none transition-all',
                        errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                      ]"
                      placeholder="John Doe"
                      required
                    >
                    <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
                  </div>
                  
                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input 
                      v-model="form.email" 
                      type="email" 
                      id="email" 
                      name="email" 
                      :class="[
                        'block w-full px-4 py-3 rounded-lg border bg-gray-50 focus:bg-white focus:outline-none transition-all',
                        errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                      ]"
                      placeholder="ejemplo@empresa.com"
                      required
                    >
                    <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
                  </div>
                </div>
                
                <!-- Phone and Subject -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input 
                      v-model="form.phone" 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      class="block w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-orange-500 transition-all"
                      placeholder="+56 9 1234 5678"
                    >
                  </div>
                  
                  <div>
                    <label for="subject" class="block text-sm font-medium text-gray-700 mb-1">Asunto *</label>
                    <input 
                      v-model="form.subject" 
                      type="text" 
                      id="subject" 
                      name="subject" 
                      :class="[
                        'block w-full px-4 py-3 rounded-lg border bg-gray-50 focus:bg-white focus:outline-none transition-all',
                        errors.subject ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                      ]"
                      placeholder="¿En qué podemos ayudarte?"
                      required
                    >
                    <p v-if="errors.subject" class="mt-1 text-sm text-red-600">{{ errors.subject }}</p>
                  </div>
                </div>
                
                <!-- Message -->
                <div>
                  <label for="message" class="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
                  <textarea 
                    v-model="form.message" 
                    id="message" 
                    name="message" 
                    rows="4" 
                    :class="[
                      'block w-full px-4 py-3 rounded-lg border bg-gray-50 focus:bg-white focus:outline-none transition-all resize-none',
                      errors.message ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                    ]"
                    placeholder="Escribe tu mensaje aquí..."
                    required
                  ></textarea>
                  <p v-if="errors.message" class="mt-1 text-sm text-red-600">{{ errors.message }}</p>
                </div>
                
                <!-- Privacy policy checkbox -->
                <div>
                  <div class="flex items-start">
                    <div class="flex items-center h-5">
                      <input 
                        v-model="form.privacy" 
                        id="privacy" 
                        name="privacy" 
                        type="checkbox" 
                        :class="[
                          'h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-2',
                          errors.privacy ? 'text-red-600 focus:ring-red-500' : 'text-orange-600 focus:ring-orange-500'
                        ]"
                        required
                      >
                    </div>
                    <div class="ml-3 text-sm">
                      <label for="privacy" :class="errors.privacy ? 'text-red-600' : 'text-gray-600'">
                        Acepto la <a href="/politica-privacidad" class="text-orange-600 hover:underline">política de privacidad</a> y el uso de mis datos.
                      </label>
                      <p v-if="errors.privacy" class="mt-1 text-sm text-red-600">{{ errors.privacy }}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Submit button -->
                <div>
                  <button 
                    type="submit" 
                    class="w-full flex items-center justify-center px-6 py-3.5 bg-orange-500 text-white font-medium rounded-lg shadow-md hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-300 transition-all duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    :disabled="isSubmitting"
                  >
                    <div class="relative">
                      <span :class="{ 'opacity-0': isSubmitting }">Enviar mensaje</span>
                      <div v-if="isSubmitting" class="absolute inset-0 flex items-center justify-center">
                        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </transition>
  
  <!-- Toast Notification -->
  <Teleport to="body">
    <transition name="toast">
      <div 
        v-if="toast.visible" 
        class="fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center"
        :class="toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'"
      >
        <svg v-if="toast.type === 'success'" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ toast.message }}</span>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, computed, inject } from 'vue';

const props = defineProps({
  isVisible: Boolean,
  title: {
    type: String,
    default: 'Contáctanos'
  },
  serviceInfo: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);

// Form state
const form = reactive({
  name: '',
  phone: '',
  email: '',
  subject: '',
  message: '',
  privacy: false
});

// Validation errors
const errors = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
  privacy: ''
});

// Form submission state
const isSubmitting = ref(false);
const formStatus = reactive({
  success: false,
  message: ''
});

// Toast notification state
const toast = reactive({
  visible: false,
  message: '',
  type: 'success' // 'success' or 'error'
});

// Initialize form with service info if available
const hasServiceInfo = computed(() => Boolean(props.serviceInfo));

// Watch for changes in serviceInfo and update subject
watch(() => props.serviceInfo, (newVal) => {
  if (newVal) {
    form.subject = `Información sobre ${newVal}`;
  }
});

// Watch visibility to reset form and handle scroll locking
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden';
    
    // Pre-fill subject if serviceInfo is provided
    if (props.serviceInfo && !form.subject) {
      form.subject = `Información sobre ${props.serviceInfo}`;
    }
  } else {
    document.body.style.overflow = '';
    
    // Reset form after closing with delay
    setTimeout(() => {
      // Keep serviceInfo-related subject if it exists
      const tempSubject = hasServiceInfo.value ? form.subject : '';
      
      // Reset form
      Object.assign(form, {
        name: '',
        phone: '',
        email: '',
        subject: tempSubject,
        message: '',
        privacy: false
      });
      
      // Clear errors and status
      (Object.keys(errors) as Array<'name' | 'email' | 'subject' | 'message' | 'privacy'>).forEach((key) => {
          errors[key] = '';
      });
      
      formStatus.success = false;
      formStatus.message = '';
    }, 300);
  }
});

function closeModal() {
  emit('close');
}

function validateForm() {
  let isValid = true;
  
  // Reset all errors
  (Object.keys(errors) as Array<keyof typeof errors>).forEach(key => {
      errors[key] = '';
  });
  
  // Validate name
  if (!form.name.trim()) {
    errors.name = 'El nombre es requerido';
    isValid = false;
  } else if (form.name.trim().length < 3) {
    errors.name = 'El nombre debe tener al menos 3 caracteres';
    isValid = false;
  }
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.email.trim()) {
    errors.email = 'El email es requerido';
    isValid = false;
  } else if (!emailRegex.test(form.email)) {
    errors.email = 'Ingrese un email válido';
    isValid = false;
  }
  
  // Validate subject
  if (!form.subject.trim()) {
    errors.subject = 'El asunto es requerido';
    isValid = false;
  } else if (form.subject.trim().length < 5) {
    errors.subject = 'El asunto debe tener al menos 5 caracteres';
    isValid = false;
  }
  
  // Validate message
  if (!form.message.trim()) {
    errors.message = 'El mensaje es requerido';
    isValid = false;
  } else if (form.message.trim().length < 10) {
    errors.message = 'El mensaje debe tener al menos 10 caracteres';
    isValid = false;
  }
  
  // Validate privacy checkbox
  if (!form.privacy) {
    errors.privacy = 'Debe aceptar la política de privacidad';
    isValid = false;
  }
  
  return isValid;
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  
  // Auto-hide the toast after 4 seconds
  setTimeout(() => {
    toast.visible = false;
  }, 4000);
}

// Submit form function in ContactModal.vue
async function submitForm() {
  // Validate form
  if (!validateForm()) {
    formStatus.success = false;
    formStatus.message = 'Por favor, corrija los errores en el formulario.';
    return;
  }

  // Start loading state
  isSubmitting.value = true;
  formStatus.message = '';

  // Google Analytics event for form interaction (GTM)
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'begin_checkout',
    event_category: 'Funnel',
    event_label: 'Contact Form Opened',
    funnel_step: 'form_opened'
  });

  try {
    // Prepare data for the contact email
    const contactData = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      subject: form.subject,
      message: form.message,
      serviceInfo: props.serviceInfo
    };
    
    // Send to admin
    const response = await fetch('https://api.racklog.cl/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: form.email, // Recipient email address
        data: contactData,
        subject: `Contacto Web: ${form.subject}`,
        type: 'contact'
      })
    });
    
    // Process the response
    if (response.ok) {
      const data = await response.json();
      
      if (data.status) {
        // Show success message
        formStatus.success = true;
        formStatus.message = '¡Gracias! Tu mensaje ha sido enviado correctamente. Nos pondremos en contacto contigo pronto.';
        
        // Send conversion event to dataLayer for GTM (Google Analytics & Google Ads)
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'purchase', // Standard GA4 purchase event
          event_category: 'Conversion',
          event_label: 'Contact Form Sent',
          funnel_step: 'contact_form_sent',
          currency: 'CLP',
          value: 0
        });
        console.log('[GTM] Contact form conversion event sent to dataLayer');

        // Reset the form except for service-related subject
        const tempSubject = props.serviceInfo ? form.subject : '';
        Object.assign(form, {
          name: '',
          phone: '',
          email: '',
          subject: tempSubject,
          message: '',
          privacy: false
        });
        
        // Auto-close after delay
        setTimeout(() => {
          if (formStatus.success) {
            emit('close');
          }
        }, 3000);
      } else {
        throw new Error(data.message || 'Error al enviar el mensaje');
      }
    } else {
      throw new Error('Error en la solicitud a la API');
    }
  } catch (error) {
    console.error('Error sending form:', error);
    formStatus.success = false;
    formStatus.message = 'Ha ocurrido un error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
/* Base styles */
:deep(input), :deep(textarea) {
  transition: all 0.3s ease;
}

/* Modal transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Toast transitions */
.toast-enter-active, .toast-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Button transitions */
button {
  transition: all 0.3s ease;
}

button:not(:disabled):hover {
  box-shadow: 0 6px 15px rgba(249, 115, 22, 0.4);
}

button:disabled {
  transform: none !important;
  box-shadow: none !important;
}
</style>