<template>
  <!-- En body: dentro de secciones con su propio z-index quedaria bajo la navbar -->
  <Teleport to="body">
    <transition name="backdrop">
      <div
        v-if="isVisible"
        class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-neutral-950/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
        @click.self="closeModal"
      >
        <transition name="dialog" appear>
          <div
            ref="dialogRef"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="`${uid}-title`"
            :aria-describedby="`${uid}-desc`"
            tabindex="-1"
            class="relative w-full sm:max-w-xl max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl ring-1 ring-black/5 focus:outline-none"
          >
            <!-- Encabezado -->
            <div class="relative px-6 sm:px-8 pt-7 pb-6 bg-gradient-to-b from-orange-50 to-white border-b border-neutral-100">
              <button
                type="button"
                class="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                aria-label="Cerrar ventana"
                @click="closeModal"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div class="flex items-start gap-4 pr-10">
                <span class="hidden sm:inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-600/25" aria-hidden="true">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-orange-700">{{ encabezado?.etiqueta ?? 'Cotización sin compromiso' }}</p>
                  <h2 :id="`${uid}-title`" class="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
                    {{ encabezado?.titulo ?? 'Solicita tu cotización' }}
                  </h2>
                  <p :id="`${uid}-desc`" class="mt-1.5 text-sm text-neutral-600">
                    {{ encabezado?.texto ?? 'Te respondemos en menos de 24 horas con una propuesta a medida.' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Enviado con exito -->
            <div v-if="formStatus.success" class="px-6 sm:px-8 py-12 text-center" role="status" aria-live="polite">
              <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700" aria-hidden="true">
                <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <p class="mt-5 text-xl font-semibold text-neutral-900">¡Mensaje enviado!</p>
              <p class="mt-2 text-neutral-600">{{ formStatus.message }}</p>
              <button
                type="button"
                class="mt-8 inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 px-6 font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors"
                @click="closeModal"
              >
                Cerrar
              </button>
            </div>

            <!-- Formulario -->
            <form v-else novalidate class="px-6 sm:px-8 py-6 space-y-5" @submit.prevent="submitForm">
              <!-- Honeypot anti-bots: oculto para personas -->
              <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;" />

              <!-- Error general -->
              <div
                v-if="formStatus.message"
                role="alert"
                class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{{ formStatus.message }}</p>
              </div>

              <!-- Producto a cotizar (desde el configurador o la ficha del producto) -->
              <div v-if="quoteItem" class="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p class="text-xs font-semibold uppercase tracking-wider text-neutral-600">Producto a cotizar</p>
                <p class="mt-0.5 font-semibold text-neutral-900">{{ quoteItem.name }}</p>
                <dl v-if="quoteDetails.length" class="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <div v-for="[label, value] in quoteDetails" :key="label" class="flex justify-between gap-2">
                    <dt class="text-neutral-600">{{ label }}</dt>
                    <dd class="font-medium text-neutral-900">{{ value }}</dd>
                  </div>
                </dl>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <!-- Nombre -->
                <div>
                  <label :for="`${uid}-name`" class="field-label">Nombre <span class="text-orange-700" aria-hidden="true">*</span></label>
                  <div class="field-wrap">
                    <svg class="field-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      :id="`${uid}-name`"
                      v-model="form.name"
                      type="text"
                      name="name"
                      autocomplete="name"
                      placeholder="Tu nombre"
                      required
                      :aria-invalid="errors.name ? 'true' : 'false'"
                      :aria-describedby="errors.name ? `${uid}-name-error` : undefined"
                      :class="['field-input', { 'field-input--error': errors.name }]"
                    >
                  </div>
                  <p v-if="errors.name" :id="`${uid}-name-error`" class="field-error">{{ errors.name }}</p>
                </div>

                <!-- Email -->
                <div>
                  <label :for="`${uid}-email`" class="field-label">Email <span class="text-orange-700" aria-hidden="true">*</span></label>
                  <div class="field-wrap">
                    <svg class="field-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      :id="`${uid}-email`"
                      v-model="form.email"
                      type="email"
                      name="email"
                      autocomplete="email"
                      inputmode="email"
                      placeholder="nombre@empresa.cl"
                      required
                      :aria-invalid="errors.email ? 'true' : 'false'"
                      :aria-describedby="errors.email ? `${uid}-email-error` : undefined"
                      :class="['field-input', { 'field-input--error': errors.email }]"
                    >
                  </div>
                  <p v-if="errors.email" :id="`${uid}-email-error`" class="field-error">{{ errors.email }}</p>
                </div>

                <!-- Razon social -->
                <div>
                  <label :for="`${uid}-company`" class="field-label">Razón social <span class="text-orange-700" aria-hidden="true">*</span></label>
                  <div class="field-wrap">
                    <svg class="field-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <input
                      :id="`${uid}-company`"
                      v-model="form.company"
                      type="text"
                      name="company"
                      autocomplete="organization"
                      placeholder="Empresa SpA, o tu nombre"
                      required
                      :aria-invalid="errors.company ? 'true' : 'false'"
                      :aria-describedby="errors.company ? `${uid}-company-error` : undefined"
                      :class="['field-input', { 'field-input--error': errors.company }]"
                    >
                  </div>
                  <p v-if="errors.company" :id="`${uid}-company-error`" class="field-error">{{ errors.company }}</p>
                </div>

                <!-- RUT -->
                <div>
                  <label :for="`${uid}-rut`" class="field-label">RUT <span class="text-orange-700" aria-hidden="true">*</span></label>
                  <div class="field-wrap">
                    <svg class="field-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    <input
                      :id="`${uid}-rut`"
                      v-model="form.rut"
                      type="text"
                      name="rut"
                      autocomplete="off"
                      placeholder="76.123.456-0"
                      maxlength="12"
                      required
                      :aria-invalid="errors.rut ? 'true' : 'false'"
                      :aria-describedby="errors.rut ? `${uid}-rut-error` : undefined"
                      :class="['field-input', { 'field-input--error': errors.rut }]"
                      @blur="formatRutInput"
                    >
                  </div>
                  <p v-if="errors.rut" :id="`${uid}-rut-error`" class="field-error">{{ errors.rut }}</p>
                </div>

                <!-- Telefono -->
                <div>
                  <label :for="`${uid}-phone`" class="field-label">
                    Teléfono
                    <span v-if="requireProject" class="text-orange-700" aria-hidden="true">*</span>
                    <span v-else class="font-normal text-neutral-500">(opcional)</span>
                  </label>
                  <div class="field-wrap">
                    <svg class="field-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <input
                      :id="`${uid}-phone`"
                      v-model="form.phone"
                      type="tel"
                      name="phone"
                      autocomplete="tel"
                      inputmode="tel"
                      placeholder="+56 9 1234 5678"
                      :required="requireProject"
                      :aria-invalid="errors.phone ? 'true' : 'false'"
                      :aria-describedby="errors.phone ? `${uid}-phone-error` : undefined"
                      :class="['field-input', { 'field-input--error': errors.phone }]"
                    >
                  </div>
                  <p v-if="errors.phone" :id="`${uid}-phone-error`" class="field-error">{{ errors.phone }}</p>
                </div>

                <!-- Proyecto (planificador): donde y para cuando -->
                <template v-if="requireProject">
                  <div>
                    <label :for="`${uid}-comuna`" class="field-label">Comuna de instalación <span class="text-orange-700" aria-hidden="true">*</span></label>
                    <input
                      :id="`${uid}-comuna`"
                      v-model="form.comuna"
                      type="text"
                      name="comuna"
                      autocomplete="address-level2"
                      placeholder="Quilicura"
                      maxlength="60"
                      required
                      :aria-invalid="errors.comuna ? 'true' : 'false'"
                      :aria-describedby="errors.comuna ? `${uid}-comuna-error` : undefined"
                      :class="['field-input !pl-3.5', { 'field-input--error': errors.comuna }]"
                    >
                    <p v-if="errors.comuna" :id="`${uid}-comuna-error`" class="field-error">{{ errors.comuna }}</p>
                  </div>
                  <div>
                    <label :for="`${uid}-plazo`" class="field-label">¿Para cuándo lo necesitas? <span class="text-orange-700" aria-hidden="true">*</span></label>
                    <select
                      :id="`${uid}-plazo`"
                      v-model="form.plazo"
                      name="plazo"
                      required
                      :aria-invalid="errors.plazo ? 'true' : 'false'"
                      :aria-describedby="errors.plazo ? `${uid}-plazo-error` : undefined"
                      :class="['field-input !pl-3.5', { 'field-input--error': errors.plazo }]"
                    >
                      <option value="" disabled>Elige una opción</option>
                      <option v-for="p in PLAZOS" :key="p" :value="p">{{ p }}</option>
                    </select>
                    <p v-if="errors.plazo" :id="`${uid}-plazo-error`" class="field-error">{{ errors.plazo }}</p>
                  </div>
                </template>

                <!-- Asunto (con producto adjunto ya se sabe que es) -->
                <div v-if="!quoteItem">
                  <label :for="`${uid}-subject`" class="field-label">Asunto <span class="text-orange-700" aria-hidden="true">*</span></label>
                  <div class="field-wrap">
                    <svg class="field-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <input
                      :id="`${uid}-subject`"
                      v-model="form.subject"
                      type="text"
                      name="subject"
                      placeholder="Ej: Rack selectivo"
                      required
                      :aria-invalid="errors.subject ? 'true' : 'false'"
                      :aria-describedby="errors.subject ? `${uid}-subject-error` : undefined"
                      :class="['field-input', { 'field-input--error': errors.subject }]"
                    >
                  </div>
                  <p v-if="errors.subject" :id="`${uid}-subject-error`" class="field-error">{{ errors.subject }}</p>
                </div>
              </div>

              <!-- Mensaje -->
              <div>
                <label :for="`${uid}-message`" class="field-label">
                  {{ quoteItem ? 'Comentarios' : 'Mensaje' }}
                  <span v-if="quoteItem" class="font-normal text-neutral-500">(opcional)</span>
                  <span v-else class="text-orange-700" aria-hidden="true">*</span>
                </label>
                <textarea
                  :id="`${uid}-message`"
                  v-model="form.message"
                  name="message"
                  rows="4"
                  maxlength="2000"
                  :placeholder="quoteItem ? 'Cantidad, plazos, dirección de instalación…' : 'Cuéntanos sobre tu proyecto: medidas, carga, plazos…'"
                  :required="!quoteItem"
                  :aria-invalid="errors.message ? 'true' : 'false'"
                  :aria-describedby="errors.message ? `${uid}-message-error` : undefined"
                  :class="['field-input field-input--textarea', { 'field-input--error': errors.message }]"
                  @paste="onPaste"
                ></textarea>
                <p v-if="errors.message" :id="`${uid}-message-error`" class="field-error">{{ errors.message }}</p>
              </div>

              <!-- Adjuntos: fotos o planos (tambien se pueden pegar en el mensaje) -->
              <div>
                <span class="field-label">Fotos o planos <span class="font-normal text-neutral-500">(opcional)</span></span>
                <input
                  ref="fileInputRef"
                  type="file"
                  :accept="ACCEPTED_TYPES.join(',')"
                  multiple
                  class="sr-only"
                  tabindex="-1"
                  aria-hidden="true"
                  @change="onFileChange"
                >
                <button
                  type="button"
                  :disabled="attachments.length >= MAX_FILES || isProcessingFiles"
                  class="inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 text-sm font-medium text-neutral-700 hover:border-orange-500 hover:text-orange-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  :aria-describedby="`${uid}-files-hint`"
                  @click="fileInputRef?.click()"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {{ isProcessingFiles ? 'Procesando…' : 'Adjuntar archivo' }}
                </button>
                <p :id="`${uid}-files-hint`" class="mt-1.5 text-xs text-neutral-500">
                  También puedes pegar una imagen en el mensaje (Ctrl+V). Hasta {{ MAX_FILES }} archivos JPG, PNG o PDF, {{ MAX_TOTAL_MB }} MB en total.
                </p>
                <ul v-if="attachments.length" class="mt-3 space-y-2">
                  <li
                    v-for="file in attachments"
                    :key="file.id"
                    class="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-2 pr-1"
                  >
                    <img v-if="file.previewUrl" :src="file.previewUrl" alt="" class="h-10 w-10 flex-shrink-0 rounded-lg object-cover">
                    <span v-else class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-red-700" aria-hidden="true">PDF</span>
                    <span class="min-w-0 flex-1 text-sm">
                      <span class="block truncate font-medium text-neutral-900">{{ file.name }}</span>
                      <span class="text-neutral-500">{{ formatSize(file.size) }}</span>
                    </span>
                    <button
                      type="button"
                      class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"
                      :aria-label="`Quitar ${file.name}`"
                      @click="removeAttachment(file.id)"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                </ul>
                <p v-if="errors.attachments" class="field-error" role="alert">{{ errors.attachments }}</p>
              </div>

              <!-- Privacidad -->
              <div>
                <div class="flex items-start gap-3">
                  <input
                    :id="`${uid}-privacy`"
                    v-model="form.privacy"
                    name="privacy"
                    type="checkbox"
                    required
                    :aria-invalid="errors.privacy ? 'true' : 'false'"
                    :aria-describedby="errors.privacy ? `${uid}-privacy-error` : undefined"
                    class="mt-0.5 h-5 w-5 flex-shrink-0 rounded-md border-neutral-300 accent-orange-600 cursor-pointer"
                  >
                  <label :for="`${uid}-privacy`" class="text-sm leading-relaxed" :class="errors.privacy ? 'text-red-700' : 'text-neutral-600'">
                    Acepto la <NuxtLink to="/politica-privacidad" class="font-medium text-orange-700 underline underline-offset-2 hover:text-orange-800">política de privacidad</NuxtLink> y el uso de mis datos para responder esta solicitud.
                  </label>
                </div>
                <p v-if="errors.privacy" :id="`${uid}-privacy-error`" class="field-error pl-8">{{ errors.privacy }}</p>
              </div>

              <!-- Archivos que no se pudieron adjuntar: que el cliente lo sepa antes de enviar -->
              <div v-if="rejectedFiles.length" class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
                <p class="font-semibold">{{ rejectedFiles.length === 1 ? 'Este archivo no se adjuntó:' : 'Estos archivos no se adjuntaron:' }} {{ rejectedFiles.map((r) => r.name).join(', ') }}</p>
                <p class="mt-1">Puedes enviar el formulario igual: avisaremos al ejecutivo y podrás mandarlo respondiendo el correo de confirmación.</p>
              </div>

              <!-- Enviar -->
              <button
                type="submit"
                :disabled="isSubmitting"
                class="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 text-base font-semibold text-white shadow-lg shadow-brand-700/20 hover:bg-brand-800 active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:opacity-70"
              >
                <svg v-if="isSubmitting" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{{ isSubmitting ? 'Enviando…' : 'Enviar solicitud' }}</span>
                <svg v-if="!isSubmitting" class="h-5 w-5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </form>

            <!-- Contacto directo -->
            <div class="flex flex-wrap items-center justify-center sm:justify-between gap-x-4 gap-y-2 border-t border-neutral-100 bg-neutral-50 px-6 sm:px-8 py-4 text-sm text-neutral-600">
              <span class="flex items-center gap-2 whitespace-nowrap">
                <svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Sin compromiso
              </span>
              <span class="flex items-center gap-4 whitespace-nowrap">
                <a href="tel:+56932403819" class="font-medium text-neutral-800 hover:text-orange-700">(+56) 9 3240 3819</a>
                <a href="https://wa.me/56932403819" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-medium text-green-700 hover:text-green-800">
                  <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp
                </a>
              </span>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, computed, onBeforeUnmount, type PropType } from 'vue';
import type { QuoteItem } from '~/components/QuoteModal/ProductConfig';

const props = defineProps({
  isVisible: Boolean,
  title: {
    type: String,
    default: 'Contáctanos'
  },
  serviceInfo: {
    type: String,
    default: ''
  },
  // Producto a cotizar: se envia como cotizacion (tipo quote) con su configuracion
  quoteItem: {
    type: Object as PropType<QuoteItem | null>,
    default: null
  },
  // Archivos que se adjuntan al abrir (p. ej. el plano del planificador); el cliente puede quitarlos
  initialFiles: {
    type: Array as PropType<File[]>,
    default: () => []
  },
  // Encabezado propio (p. ej. "Descarga tu plano" del planificador); sin el, el de cotizacion
  encabezado: {
    type: Object as PropType<{ etiqueta: string; titulo: string; texto: string } | null>,
    default: null
  },
  // Lead de proyecto (planificador): telefono, comuna y fecha obligatorios para cotizar sin llamar
  requireProject: {
    type: Boolean,
    default: false
  }
});

const PLAZOS = ['Lo antes posible', 'En 1 a 3 meses', 'En 3 a 6 meses', 'En más de 6 meses o evaluando'];

// sent: envio exitoso (el planificador entrega el PDF del plano solo despues de esto)
const emit = defineEmits(['close', 'sent']);

// Ids unicos: el modal se monta en varios lugares de la misma pagina
const uid = useId();
const dialogRef = ref<HTMLElement | null>(null);

// Form state
const form = reactive({
  website: '', // honeypot
  name: '',
  phone: '',
  email: '',
  company: '',
  rut: '',
  comuna: '',
  plazo: '',
  subject: '',
  message: '',
  privacy: false
});

// Validation errors
const errors = reactive({
  name: '',
  email: '',
  company: '',
  rut: '',
  phone: '',
  comuna: '',
  plazo: '',
  subject: '',
  message: '',
  privacy: '',
  attachments: ''
});

// Adjuntos: se suben como multipart (el firewall del hosting corta JSON de mas de 1 MB). Limites iguales a los de la API
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_FILES = 3;
const MAX_TOTAL_MB = 5;
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;
// Fotos de celular y capturas grandes se achican antes de enviar
const IMAGE_MAX_SIDE = 2000;
const IMAGE_COMPRESS_FROM = 1024 * 1024;

interface Attachment {
  id: number;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  previewUrl: string | null;
}

const fileInputRef = ref<HTMLInputElement | null>(null);
const attachments = ref<Attachment[]>([]);
const isProcessingFiles = ref(false);
let attachmentSeq = 0;
// Archivos que el cliente intento adjuntar y no se pudo: se avisa junto a Enviar y el vendedor
// lo ve en el mensaje (asi puede pedirlo por correo)
const rejectedFiles = ref<{ name: string; reason: string }[]>([]);

function rejectFile(file: File, reason: string, message: string) {
  errors.attachments = message;
  if (!rejectedFiles.value.some((r) => r.name === file.name)) rejectedFiles.value.push({ name: file.name, reason });
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'attachment_rejected', event_category: 'Formulario', reason, file_type: file.type || file.name.split('.').pop(), file_mb: +(file.size / 1048576).toFixed(1) });
}

// Form submission state
const isSubmitting = ref(false);
const formStatus = reactive({
  success: false,
  message: ''
});


const quoteDetails = computed(() => Object.entries(props.quoteItem?.config ?? {}));

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
    if (props.initialFiles.length && !attachments.value.length) addFiles(props.initialFiles);

    // Inicio del embudo: el usuario abrio el formulario
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'form_open',
      event_category: 'Funnel',
      event_label: 'Contact Form Opened',
      funnel_step: 'form_opened'
    });

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
        company: '',
        rut: '',
        comuna: '',
        plazo: '',
        subject: tempSubject,
        message: '',
        privacy: false
      });
      clearAttachments();
      
      // Clear errors and status
      (Object.keys(errors) as Array<keyof typeof errors>).forEach((key) => {
          errors[key] = '';
      });
      
      formStatus.success = false;
      formStatus.message = '';
    }, 300);
  }
});

useModalA11y(computed(() => !!props.isVisible), dialogRef, () => closeModal());

function closeModal() {
  emit('close');
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Achica la imagen a JPEG si es pesada o muy grande; si no, la deja igual */
async function compressImage(file: File): Promise<{ blob: Blob; name: string; type: string }> {
  if (file.type === 'image/gif') return { blob: file, name: file.name, type: file.type };
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= IMAGE_COMPRESS_FROM) {
    bitmap.close();
    return { blob: file, name: file.name, type: file.type };
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d')!;
  // Fondo blanco: las capturas PNG con transparencia quedarian negras en JPEG
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob || blob.size >= file.size) return { blob: file, name: file.name, type: file.type };
  return { blob, name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg' };
}

async function addFiles(files: File[]) {
  errors.attachments = '';
  isProcessingFiles.value = true;
  try {
    for (const file of files) {
      if (attachments.value.length >= MAX_FILES) {
        errors.attachments = `Puedes adjuntar hasta ${MAX_FILES} archivos.`;
        break;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        rejectFile(file, 'formato', `"${file.name}" no es un formato permitido. Usa JPG, PNG o PDF.`);
        continue;
      }
      let processed: { blob: Blob; name: string; type: string };
      try {
        processed = file.type.startsWith('image/') ? await compressImage(file) : { blob: file, name: file.name, type: file.type };
      } catch {
        rejectFile(file, 'ilegible', `No se pudo leer "${file.name}".`);
        continue;
      }
      const used = attachments.value.reduce((sum, a) => sum + a.size, 0);
      if (used + processed.blob.size > MAX_TOTAL_BYTES) {
        rejectFile(file, 'tamano', `"${file.name}" supera el límite de ${MAX_TOTAL_MB} MB en total. Envíalo a contacto@racklog.cl o por WhatsApp.`);
        continue;
      }
      rejectedFiles.value = rejectedFiles.value.filter((r) => r.name !== file.name && r.name !== processed.name);
      attachments.value.push({
        id: ++attachmentSeq,
        name: processed.name,
        type: processed.type,
        size: processed.blob.size,
        blob: processed.blob,
        previewUrl: processed.type.startsWith('image/') ? URL.createObjectURL(processed.blob) : null
      });
    }
  } finally {
    isProcessingFiles.value = false;
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  addFiles(Array.from(input.files ?? []));
  input.value = '';
}

// Imagen pegada en el mensaje: se adjunta; si ademas viene texto, el texto se pega normal
function onPaste(event: ClipboardEvent) {
  const files = Array.from(event.clipboardData?.files ?? []);
  if (!files.length) return;
  if (!event.clipboardData?.getData('text/plain')) event.preventDefault();
  const stamp = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
  addFiles(files.map((file, i) => file.name && file.name !== 'image.png'
    ? file
    : new File([file], `imagen-pegada-${stamp}${i ? `-${i + 1}` : ''}.${file.type.split('/')[1] || 'png'}`, { type: file.type })));
}

function removeAttachment(id: number) {
  const file = attachments.value.find((a) => a.id === id);
  if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
  attachments.value = attachments.value.filter((a) => a.id !== id);
  errors.attachments = '';
}

function clearAttachments() {
  attachments.value.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
  attachments.value = [];
  rejectedFiles.value = [];
}

// Nota para el vendedor con los archivos que no se pudieron adjuntar
function rejectedNote() {
  if (!rejectedFiles.value.length) return '';
  const motivo = { formato: 'formato no permitido', tamano: `supera ${MAX_TOTAL_MB} MB`, ilegible: 'no se pudo leer' } as Record<string, string>;
  return '\n\n[El cliente intentó adjuntar y no se pudo: '
    + rejectedFiles.value.map((r) => `${r.name} (${motivo[r.reason] ?? r.reason})`).join('; ')
    + '. Pídeselo por correo.]';
}

onBeforeUnmount(clearAttachments);

function formatRutInput() {
  if (form.rut.trim() && validateRut(form.rut)) {
    form.rut = formatRut(form.rut);
  }
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
  
  // Validate company
  if (!form.company.trim()) {
    errors.company = 'La razón social es requerida';
    isValid = false;
  }

  if (props.requireProject) {
    if ((form.phone.match(/\d/g) || []).length < 8) {
      errors.phone = 'Ingresa un teléfono para coordinar la visita';
      isValid = false;
    }
    if (form.comuna.trim().length < 3) {
      errors.comuna = 'Indica la comuna donde va la bodega';
      isValid = false;
    }
    if (!form.plazo) {
      errors.plazo = 'Elige para cuándo lo necesitas';
      isValid = false;
    }
  }

  // Validate RUT
  if (!form.rut.trim()) {
    errors.rut = 'El RUT es requerido';
    isValid = false;
  } else if (!validateRut(form.rut)) {
    errors.rut = 'El RUT no es válido';
    isValid = false;
  }

  // Validate subject
  if (props.quoteItem) {
    // Sin asunto: lo da el producto
  } else if (!form.subject.trim()) {
    errors.subject = 'El asunto es requerido';
    isValid = false;
  } else if (form.subject.trim().length < 5) {
    errors.subject = 'El asunto debe tener al menos 5 caracteres';
    isValid = false;
  }
  
  // Validate message
  if (props.quoteItem) {
    // Comentarios opcionales
  } else if (!form.message.trim()) {
    errors.message = 'El mensaje es requerido';
    isValid = false;
  } else if (form.message.trim().length < 10) {
    errors.message = 'El mensaje debe tener al menos 10 caracteres';
    isValid = false;
  }
  
  if (isProcessingFiles.value) {
    errors.attachments = 'Espera a que terminen de cargarse los archivos.';
    isValid = false;
  }

  // Validate privacy checkbox
  if (!form.privacy) {
    errors.privacy = 'Debe aceptar la política de privacidad';
    isValid = false;
  }
  
  return isValid;
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
    const rut = formatRut(form.rut);
    const leadType = props.quoteItem ? 'quote' : 'contact';
    // Con producto se usa el formato de cotizacion de la API: el vendedor recibe la configuracion
    const payloadData = props.quoteItem
      ? {
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          customerCompany: form.company,
          customerRut: rut,
          customerComments: form.message + rejectedNote(),
          products: [{
            name: props.quoteItem.name,
            quantity: 1,
            price: 0,
            quoteOnly: true,
            config: {
              ...(props.quoteItem.config ?? {}),
              ...(props.requireProject ? { 'Comuna de instalación': form.comuna.trim(), 'Fecha requerida': form.plazo } : {})
            }
          }],
          cartTotal: 0
        }
      : {
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          rut,
          subject: form.subject,
          message: form.message + rejectedNote(),
          serviceInfo: props.serviceInfo
        };

    const payload = JSON.stringify({ data: payloadData, type: leadType, website: form.website });
    let request: RequestInit;
    if (attachments.value.length) {
      // La cabecera propia obliga al preflight de CORS (proteccion contra CSRF, como el JSON)
      const body = new FormData();
      body.append('payload', payload);
      attachments.value.forEach((a) => body.append('attachments[]', a.blob, a.name));
      request = { method: 'POST', headers: { 'X-Racklog-Form': '1' }, body };
    } else {
      request = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload };
    }
    const response = await fetch('https://api.racklog.cl/api/send-email', request);

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status !== 'success') {
      throw new Error(response.status === 429 ? 'rate_limit' : response.status === 413 ? 'too_large' : (data.error || 'api_error'));
    }

    formStatus.success = true;
    emit('sent', { reference: data.reference || '', name: form.name.trim(), email: form.email.trim(), company: form.company.trim(), rut: formatRut(form.rut), comuna: form.comuna.trim() });
    formStatus.message = '¡Gracias! Tu mensaje ha sido enviado correctamente. Nos pondremos en contacto contigo pronto.';

    // Conversion para GTM (GA4 y Google Ads): un lead, no una compra
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'generate_lead',
      event_category: 'Conversion',
      event_label: props.quoteItem ? 'Quote Form Sent' : 'Contact Form Sent',
      funnel_step: props.quoteItem ? 'quote_form_sent' : 'contact_form_sent',
      lead_type: leadType,
      product: props.quoteItem?.name,
      ...props.quoteItem?.analytics,
      lead_reference: data.reference,
      currency: 'CLP',
      value: 0
    });

    // Reset the form except for service-related subject
    const tempSubject = props.serviceInfo ? form.subject : '';
    Object.assign(form, {
      name: '',
      phone: '',
      email: '',
      company: '',
      rut: '',
      comuna: '',
      plazo: '',
      subject: tempSubject,
      message: '',
      privacy: false
    });
    clearAttachments();

    // Auto-close after delay
    setTimeout(() => {
      if (formStatus.success) {
        emit('close');
      }
    }, 3000);
  } catch (error) {
    formStatus.success = false;
    const reason = error instanceof Error ? error.message : '';
    formStatus.message = reason === 'rate_limit'
      ? 'Has enviado varios mensajes seguidos. Espera unos minutos e inténtalo de nuevo.'
      : reason === 'too_large'
      ? `Los archivos adjuntos superan los ${MAX_TOTAL_MB} MB. Quita alguno o envíalos a contacto@racklog.cl.`
      : 'Ha ocurrido un error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde o escríbenos a contacto@racklog.cl.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.field-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #262626;
}

.field-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  width: 1.25rem;
  height: 1.25rem;
  transform: translateY(-50%);
  color: #a3a3a3;
  pointer-events: none;
}

.field-input {
  display: block;
  width: 100%;
  height: 3rem;
  padding: 0 1rem 0 2.75rem;
  border: 1px solid #e5e5e5;
  border-radius: 0.75rem;
  background: #fff;
  color: #171717;
  font-size: 1rem;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.field-input::placeholder {
  color: #a3a3a3;
}
.field-input:hover {
  border-color: #d4d4d4;
}
.field-input:focus {
  outline: none;
  border-color: #ea580c;
  box-shadow: 0 0 0 4px rgb(234 88 12 / 0.15);
}
.field-wrap {
  position: relative;
}
.field-wrap:focus-within .field-icon {
  color: #ea580c;
}

.field-input--textarea {
  height: auto;
  min-height: 7rem;
  padding: 0.75rem 1rem;
  resize: vertical;
  line-height: 1.5;
}

.field-input--error,
.field-input--error:hover {
  border-color: #f87171;
  background: #fef2f2;
}
.field-input--error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 4px rgb(220 38 38 / 0.15);
}

.field-error {
  margin-top: 0.375rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

/* Animaciones */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.dialog-enter-active {
  transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.dialog-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
  transform: translateY(24px) scale(0.98);
}
</style>
