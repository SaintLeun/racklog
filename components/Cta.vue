<template>
  <section class="section section-muted">
    <div class="container-page">
      <div class="card p-6 sm:p-10 lg:p-12">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:gap-12">
          <!-- Texto -->
          <div class="flex items-start gap-4">
            <span class="icon-tile" aria-hidden="true">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </span>
            <div>
              <h2 class="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">¿Necesitas atención personalizada?</h2>
              <p class="mt-3 text-base leading-relaxed text-neutral-600">Ingresa tus datos y un ejecutivo se pondrá en contacto contigo</p>
            </div>
          </div>

          <!-- Formulario -->
          <div>
            <form id="cta-form" @submit.prevent="submitForm" class="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto] xl:items-end">
              <!-- Honeypot anti-bots: oculto para personas -->
              <input v-model="formData.website" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;" />
              <div>
                <label for="cta-name" class="form-label">Nombre</label>
                <input
                  v-model="formData.name"
                  type="text"
                  id="cta-name"
                  name="full-name"
                  required
                  class="form-input"
                >
              </div>
              <div>
                <label for="cta-business" class="form-label">Empresa <span class="font-normal text-neutral-500">(opcional)</span></label>
                <input
                  v-model="formData.business"
                  type="text"
                  id="cta-business"
                  name="business"
                  class="form-input"
                >
              </div>
              <div>
                <label for="cta-phone" class="form-label">Teléfono</label>
                <input
                  v-model="formData.phone"
                  type="text"
                  id="cta-phone"
                  name="phone"
                  required
                  class="form-input"
                >
              </div>
              <div>
                <label for="cta-email" class="form-label">Correo</label>
                <input
                  v-model="formData.email"
                  type="email"
                  id="cta-email"
                  name="email"
                  required
                  class="form-input"
                >
              </div>
              <button
                type="submit"
                :disabled="isSubmitting || !formData.privacy"
                class="btn btn-primary h-12 w-full sm:col-span-2 xl:col-span-1 xl:w-auto xl:min-w-[140px]"
              >
                <span v-if="!isSubmitting">Enviar</span>
                <span v-else class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </span>
              </button>
            </form>
            <div class="mt-5 flex items-start gap-3 text-left">
              <input
                id="cta-privacy"
                v-model="formData.privacy"
                type="checkbox"
                form="cta-form"
                required
                class="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-neutral-300 accent-brand-600"
              />
              <label for="cta-privacy" class="text-sm leading-relaxed text-neutral-600">
                Acepto la <NuxtLink to="/politica-privacidad" class="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800">política de privacidad</NuxtLink> y que Racklog me contacte por esta solicitud.
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div class="fixed bottom-4 right-4 left-4 z-50 flex flex-col items-end gap-3 pointer-events-none sm:left-auto">
      <transition name="fade">
        <div v-if="showSuccessMessage" class="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5">
          <span class="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700" aria-hidden="true">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </span>
          <div class="flex-1 text-sm">
            <p class="font-semibold text-neutral-900">Solicitud enviada</p>
            <p class="mt-0.5 text-neutral-600">Pronto un ejecutivo se pondrá en contacto contigo.</p>
          </div>
          <button type="button" aria-label="Cerrar mensaje" @click="showSuccessMessage = false" class="-m-1 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="showErrorMessage" class="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5">
          <span class="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700" aria-hidden="true">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </span>
          <div class="flex-1 text-sm">
            <p class="font-semibold text-neutral-900">Error al enviar</p>
            <p class="mt-0.5 text-neutral-600">Por favor intenta nuevamente o contáctanos directamente al <b class="text-neutral-900">(+56) 9 3240 3819</b></p>
          </div>
          <button type="button" aria-label="Cerrar mensaje" @click="showErrorMessage = false" class="-m-1 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </transition>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

// Form data state
const formData = ref({
  website: '', // honeypot
  name: '',
  business: '',
  phone: '',
  email: '',
  privacy: false
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

  try {
    const business = formData.value.business?.trim();
    const contactData = {
      name: formData.value.name,
      email: formData.value.email,
      phone: formData.value.phone,
      subject: 'Solicitud de información desde formulario CTA',
      message: business
        ? `Cliente solicitando contacto desde el formulario principal. Empresa: ${business}.`
        : 'Cliente solicitando contacto desde el formulario principal.',
      serviceInfo: 'Formulario principal'
    };

    const response = await fetch('https://api.racklog.cl/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: contactData,
        type: 'contact',
        website: formData.value.website
      })
    });

    const result = await response.json().catch(() => ({}));

    if (response.ok && result.status === 'success') {
      showSuccessMessage.value = true;
      resetForm();

      // Conversion para GTM (GA4 y Google Ads): un lead, no una compra
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'generate_lead',
        event_category: 'Conversion',
        event_label: 'CTA Form Sent',
        funnel_step: 'cta_form_sent',
        lead_type: 'contact',
        lead_reference: result.reference,
        currency: 'CLP',
        value: 0
      });

      setTimeout(() => {
        showSuccessMessage.value = false;
      }, 5000);
    } else {
      showErrorMessage.value = true;
    }
  } catch {
    showErrorMessage.value = true;
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
    email: '',
    website: '',
    privacy: false
  };
}

</script>

<style scoped>
/* Fade transition for alerts */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s, transform 0.4s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
