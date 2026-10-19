<template>
  <section class="section overflow-hidden bg-white" aria-labelledby="promo-planificador">
    <div class="container-page">
      <div class="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
        <!-- Texto -->
        <div>
          <span class="eyebrow">
            <span class="relative flex h-2 w-2" aria-hidden="true">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75 motion-reduce:animate-none"></span>
              <span class="relative inline-flex h-2 w-2 rounded-full bg-brand-600"></span>
            </span>
            Nuevo · Gratis y sin registro
          </span>
          <h2 id="promo-planificador" class="section-title">
            ¿Cuántos pallets caben en <span class="text-brand-700">tu bodega</span>?
          </h2>
          <p class="section-lead">
            Dibuja tu bodega, arrastra los racks y recórrela en 3D desde tu computador o celular. En 2 minutos tienes tu diseño y cuántas posiciones de pallet te entrega.
          </p>

          <ol class="mt-8 space-y-4">
            <li v-for="(paso, i) in pasos" :key="paso.t" class="flex gap-4">
              <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 ring-1 ring-brand-600/15" aria-hidden="true">{{ i + 1 }}</span>
              <p class="pt-1.5 text-neutral-700">
                <span class="font-semibold text-neutral-900">{{ paso.t }}</span> {{ paso.d }}
              </p>
            </li>
          </ol>

          <div class="mt-9 flex flex-col items-start gap-3">
            <NuxtLink to="/planificador" class="btn btn-primary btn-lg w-full whitespace-nowrap sm:w-auto" @click="marcar('boton')">
              Diseñar mi bodega en 3D
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </NuxtLink>
            <p class="text-sm text-neutral-500">Rack selectivo, drive-in y ángulo ranurado</p>
          </div>
        </div>

        <!-- Imagen: el mismo diseño en 2D y en 3D -->
        <NuxtLink
          to="/planificador"
          class="group relative block rounded-3xl bg-gradient-to-br from-brand-50 via-neutral-50 to-neutral-100 p-3 ring-1 ring-neutral-200 transition hover:ring-brand-300 sm:p-5"
          aria-label="Abrir el planificador de bodega 3D"
          @click="marcar('imagen')"
        >
          <img
            src="/assets/images/planificador-3d.webp"
            alt="Bodega con racks selectivos, drive-in y ángulo ranurado vista en 3D en el planificador"
            width="832" height="624" loading="lazy" decoding="async"
            class="w-full rounded-2xl transition duration-500 group-hover:scale-[1.02]"
          >
          <!-- Plano 2D superpuesto -->
          <div class="absolute -bottom-4 -left-2 w-[38%] rounded-xl bg-white p-1.5 shadow-xl shadow-neutral-900/10 ring-1 ring-neutral-200 sm:-left-5 sm:p-2">
            <img src="/assets/images/planificador-2d.webp" alt="" width="480" height="389" loading="lazy" decoding="async" class="w-full rounded-lg">
            <span class="absolute -right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-brand-700 text-white shadow-md" aria-hidden="true">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
            </span>
          </div>
          <!-- Invitacion a probar -->
          <span class="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-sm font-semibold text-neutral-900 shadow-lg shadow-neutral-900/10 ring-1 ring-black/5 transition group-hover:bg-brand-700 group-hover:text-white sm:right-8 sm:top-8">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
            Pruébalo
          </span>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const pasos = [
  { t: 'Indica las medidas', d: 'de tu bodega o dibuja su forma.' },
  { t: 'Agrega y arrastra racks', d: 'hasta que todo calce.' },
  { t: 'Pide tu cotización', d: 'con el plano adjunto, sin compromiso.' },
];

function marcar(ubicacion: string) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'planner_promo_click', event_category: 'Planificador', ubicacion: `portada_${ubicacion}` });
}
</script>
