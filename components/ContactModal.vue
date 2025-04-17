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
            <!-- Left Section (Contact Info) -->
            <div class="md:w-2/5 bg-gradient-to-br from-orange-500 to-orange-600 text-white p-8 lg:p-10">
              <h2 class="text-2xl font-bold mb-6">{{ title || 'Contáctanos' }}</h2>
              
              <p v-if="serviceInfo" class="mb-6 bg-white/10 px-4 py-3 rounded-lg backdrop-blur-sm inline-block">
                <span class="font-medium">{{ serviceInfo }}</span>
              </p>
              
              <p class="mb-8 text-white/90">
                Estamos aquí para responder tus preguntas y ayudarte con tus proyectos. Completa el formulario y nos pondremos en contacto contigo a la brevedad.
              </p>
              
              <div class="space-y-6">
                <!-- Contact details with cleaner icons -->
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-white/80">Teléfono</p>
                    <p class="text-base">+56 9 7863 2154</p>
                  </div>
                </div>
                
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-white/80">Email</p>
                    <p class="text-base">contacto@racklog.cl</p>
                  </div>
                </div>
                
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-white/80">Dirección</p>
                    <p class="text-base">Av. Las Condes 12.523, Santiago</p>
                  </div>
                </div>
              </div>
              
              <!-- Social links -->
              <div class="mt-12">
                <p class="text-sm font-medium text-white/80 mb-3">Síguenos en redes sociales</p>
                <div class="flex space-x-4">
                  <a href="#" class="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd"></path>
                    </svg>
                  </a>
                  <a href="#" class="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                    </svg>
                  </a>
                  <a href="#" class="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            <!-- Right Section (Form) -->
            <div class="md:w-3/5 p-8 lg:p-10">
              <!-- Form header -->
              <h3 class="text-xl font-semibold text-gray-800 mb-6">Envíanos un mensaje</h3>
              
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
import { ref, reactive, watch, computed } from 'vue';

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
        to: 'daniel.mdzl@gmail.com', // Recipient email address
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