<template>
  <div class="landing text-base leading-normal text-neutral-700">
    <!-- ─── 1. Hero ─── -->
    <section ref="hero" class="relative overflow-hidden bg-ink-950">
      <div class="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
        <!-- Degradado radial en vez de blur(): mismo halo sin el costo de pintar un filtro grande -->
        <div class="halo absolute -right-56 -top-64 h-[44rem] w-[44rem]"></div>
      </div>
      <div class="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
        <div>
          <span class="eyebrow !bg-white/5 !text-brand-300 !ring-white/10">Planificador de bodegas gratis</span>
          <h1 class="mt-4 text-[32px] font-bold leading-tight tracking-tight text-white sm:text-5xl sm:leading-[1.1]">
            <template v-if="varTitulo === 'costo'">Descubre cuánto cuesta equipar tu bodega y recibe tu cotización en <span class="text-brand-400">máximo 24 horas</span></template>
            <template v-else>Diseña tu bodega en 5 minutos y recibe tu cotización en <span class="text-brand-400">máximo 24 horas</span></template>
          </h1>
          <p class="mt-5 max-w-xl text-lg leading-relaxed text-neutral-300">
            Gratis y sin instalar nada. Un ingeniero de Racklog revisa tu diseño antes de cotizar.
          </p>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <NuxtLink to="/planifica-tu-bodega/disena" class="btn btn-primary btn-lg" @click="marcar('cta_click', { ubicacion: 'hero' })">
              {{ textoCta }}
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </NuxtLink>
            <a :href="WHATSAPP" target="_blank" rel="noopener noreferrer" class="btn btn-ghost-light btn-lg active:scale-[.98]" @click="marcar('whatsapp_click', { ubicacion: 'hero' })">
              <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONO_WA" /></svg>
              Hablar por WhatsApp
            </a>
          </div>
          <ul class="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-400">
            <li class="inline-flex items-center gap-1.5"><svg class="h-4 w-4 text-brand-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>Sin costo</li>
            <li class="inline-flex items-center gap-1.5"><svg class="h-4 w-4 text-brand-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>Desde el celular</li>
            <li class="inline-flex items-center gap-1.5"><svg class="h-4 w-4 text-brand-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>Se guarda solo</li>
          </ul>
        </div>

        <div class="relative">
          <div class="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-ink-800 shadow-2xl shadow-black/40 ring-1 ring-white/10">
            <!-- Cuando exista el loop del planificador 3D (6–10 s), reemplazar la imagen por:
                 <video class="h-full w-full object-cover" muted autoplay playsinline loop preload="metadata"
                        poster="/assets/images/planificador-3d.webp" aria-label="Planificador 3D de Racklog">
                   <source src="/assets/videos/planificador-3d.webm" type="video/webm" />
                   <source src="/assets/videos/planificador-3d.mp4" type="video/mp4" />
                 </video> -->
            <img
              src="/assets/images/planificador-3d.webp"
              srcset="/assets/images/planificador-3d-480.webp 480w, /assets/images/planificador-3d.webp 832w"
              sizes="(min-width: 1024px) 560px, calc(100vw - 2rem)"
              alt="Vista 3D de una bodega con racks diseñada en el planificador Racklog"
              width="832" height="624" fetchpriority="high"
              class="h-full w-full object-cover"
            />
          </div>
          <div class="absolute -bottom-4 left-4 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 shadow-lg ring-1 ring-black/5 sm:left-6">
            <span class="text-brand-700">Tu diseño</span> en 2D y 3D
          </div>
        </div>
      </div>
    </section>

    <!-- ─── 2. Barra de confianza ─── -->
    <section class="border-b border-neutral-200 bg-white py-8 sm:py-10" aria-label="Por qué confiar en Racklog">
      <div class="container-page">
        <ul class="grid grid-cols-2 gap-4 text-sm sm:text-base lg:grid-cols-4">
          <li v-for="c in CONFIANZA" :key="c.t" class="flex items-center gap-3">
            <span class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-600/15" aria-hidden="true">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path :d="c.icono" /></svg>
            </span>
            <span class="font-semibold leading-snug text-neutral-900">{{ c.t }}</span>
          </li>
        </ul>
        <div class="mt-8">
          <p class="text-center text-sm text-neutral-500">Empresas que confían en Racklog</p>
          <ul class="mt-4 grid grid-cols-3 items-center gap-x-4 gap-y-5 sm:grid-cols-6">
            <li v-for="c in CLIENTES" :key="c.nombre" class="flex justify-center">
              <img :src="c.logo" :alt="c.nombre" width="150" height="60" loading="lazy" decoding="async" class="h-10 w-auto max-w-full opacity-70 grayscale transition duration-200 hover:opacity-100 hover:grayscale-0 sm:h-12" />
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ─── 3. Cómo funciona ─── -->
    <section class="py-14 sm:py-20">
      <div class="container-page">
        <div class="mx-auto max-w-2xl text-center" data-aparece>
          <span class="eyebrow">Cómo funciona</span>
          <h2 class="titulo-seccion mt-4">Tres pasos y listo</h2>
        </div>
        <ol class="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <li v-for="(p, i) in PASOS" :key="p.t" class="card relative p-6" data-aparece>
            <div class="flex items-center gap-3">
              <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-600/15" aria-hidden="true">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path :d="p.icono" /></svg>
              </span>
              <span class="text-sm font-semibold text-neutral-500">Paso {{ i + 1 }}</span>
            </div>
            <h3 class="mt-4 text-xl font-semibold tracking-tight text-neutral-900">{{ p.t }}</h3>
            <p class="mt-2 text-neutral-600">{{ p.d }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- ─── 4. Elige tu camino ─── -->
    <section class="bg-neutral-50 py-14 sm:py-20">
      <div class="container-page">
        <div class="mx-auto max-w-2xl text-center" data-aparece>
          <span class="eyebrow">Elige tu camino</span>
          <h2 class="titulo-seccion mt-4">¿Qué te importa más?</h2>
          <p class="mt-3 text-neutral-600">Te mostramos primero lo que necesitas para decidir.</p>
        </div>
        <div class="mt-10 grid gap-5 md:grid-cols-3">
          <NuxtLink
            v-for="r in ROLES" :key="r.rol"
            :to="`/planifica-tu-bodega/disena?rol=${r.rol}`"
            class="card group flex flex-col p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand-600/30 active:scale-[.98]"
            data-aparece
            @click="marcar('cta_click', { ubicacion: 'rol_' + r.rol })"
          >
            <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white" aria-hidden="true">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path :d="r.icono" /></svg>
            </span>
            <h3 class="mt-4 text-xl font-semibold tracking-tight text-neutral-900">{{ r.t }}</h3>
            <p class="mt-2 flex-1 text-neutral-600">{{ r.d }}</p>
            <span class="link-arrow mt-5">
              Empezar
              <svg class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ─── 5. Demo interactiva ─── -->
    <section class="py-14 sm:py-20" aria-labelledby="demo-titulo">
      <div class="container-page">
        <div class="mx-auto max-w-2xl text-center" data-aparece>
          <span class="eyebrow">Pruébalo ahora</span>
          <h2 id="demo-titulo" class="titulo-seccion mt-4">¿Cuántos racks necesitas?</h2>
          <p class="mt-3 text-neutral-600">Cambia los datos y mira el resultado al tiro, sin registrarte.</p>
        </div>

        <div class="mx-auto mt-10 grid max-w-5xl gap-5 lg:grid-cols-5" data-aparece>
          <form class="card space-y-5 p-5 sm:p-6 lg:col-span-2" @submit.prevent>
            <div>
              <label for="demo-alto" class="form-label">Alto del pallet cargado (m)</label>
              <input id="demo-alto" v-model.number="demo.alto" type="number" inputmode="decimal" min="0.8" max="2" step="0.1" class="campo" @blur="demo.alto = limitar(demo.alto, 0.8, 2, 1.2)" />
              <p class="nota">Entre 0,8 y 2,0 m, contando la tarima.</p>
            </div>
            <div>
              <label for="demo-cant" class="form-label">Cantidad de pallets a guardar</label>
              <input id="demo-cant" v-model.number="demo.cantidad" type="number" inputmode="numeric" min="1" max="20000" step="1" class="campo" @blur="demo.cantidad = Math.round(limitar(demo.cantidad, 1, 20000, 120))" />
            </div>
            <div>
              <label for="demo-techo" class="form-label">Altura libre de la bodega (m)</label>
              <input id="demo-techo" v-model.number="demo.alturaLibre" type="number" inputmode="decimal" min="3" max="20" step="0.5" class="campo" @blur="demo.alturaLibre = limitar(demo.alturaLibre, 3, 20, 8)" />
              <p class="nota">Hasta la viga o lo más bajo del techo.</p>
            </div>
            <div>
              <label for="demo-equipo" class="form-label">Equipo para subir los pallets</label>
              <select id="demo-equipo" v-model="demo.equipo" class="campo">
                <option v-for="e in EQUIPOS" :key="e.v" :value="e.v">{{ e.t }}</option>
              </select>
            </div>
          </form>

          <div class="card flex flex-col p-5 sm:p-6 lg:col-span-3" aria-live="polite">
            <p class="text-sm font-semibold uppercase tracking-wider text-neutral-500">Tu rack selectivo</p>
            <dl class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div class="rounded-xl bg-brand-50 p-4 ring-1 ring-brand-600/15">
                <dt class="text-sm text-brand-800">Posiciones por cuerpo</dt>
                <dd class="mt-1 text-3xl font-bold tabular-nums text-neutral-950 sm:text-4xl">{{ vista.porCuerpo }}</dd>
              </div>
              <div class="rounded-xl bg-brand-50 p-4 ring-1 ring-brand-600/15">
                <dt class="text-sm text-brand-800">Cuerpos necesarios</dt>
                <dd class="mt-1 text-3xl font-bold tabular-nums text-neutral-950 sm:text-4xl">{{ vista.cuerpos }}</dd>
              </div>
              <div class="col-span-2 rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200 sm:col-span-1">
                <dt class="text-sm text-neutral-600">Alturas de carga</dt>
                <dd class="mt-1 text-3xl font-bold tabular-nums text-neutral-950 sm:text-4xl">{{ vista.alturas }}</dd>
              </div>
            </dl>

            <p class="mt-5 text-neutral-700">
              Piso + <strong>{{ calculo.niveles }} {{ calculo.niveles === 1 ? 'nivel' : 'niveles' }} de vigas</strong>,
              2 pallets por nivel. Guardas <strong>{{ formato(calculo.cuerpos * calculo.porCuerpo) }}</strong> pallets en {{ calculo.cuerpos }} {{ calculo.cuerpos === 1 ? 'cuerpo' : 'cuerpos' }}.
            </p>
            <p class="mt-3 flex items-start gap-2 rounded-xl p-3 text-[15px]" :class="calculo.limitadoPor === 'grua' ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200' : 'bg-neutral-50 text-neutral-700 ring-1 ring-neutral-200'">
              <svg class="mt-0.5 h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>
              <span v-if="calculo.limitadoPor === 'grua'">
                Te limita el equipo: levanta hasta {{ formato(equipo.levante) }} m. Con un equipo de más alcance podrías aprovechar mejor la altura de tu bodega.
              </span>
              <span v-else>
                Te limita el techo: dejamos 0,5 m libres sobre la carga más alta, por seguridad.
              </span>
            </p>
            <p class="nota mt-3">Cálculo referencial con pallet de 1,2 × 1,0 m. El diseño final lo revisa un ingeniero.</p>

            <div class="mt-auto pt-6">
              <NuxtLink :to="linkDemo" class="btn btn-primary btn-lg w-full" @click="marcar('cta_click', { ubicacion: 'demo', ...datosDemo })">
                Diseñar mi bodega con estos datos
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── 6. Casos ─── -->
    <!-- Casos ILUSTRATIVOS: no son clientes reales ni datos medidos. Reemplazar por casos reales con permiso del cliente. -->
    <section class="bg-neutral-50 py-14 sm:py-20">
      <div class="container-page">
        <div class="mx-auto max-w-2xl text-center" data-aparece>
          <span class="eyebrow">Ejemplos</span>
          <h2 class="titulo-seccion mt-4">Lo que se logra diseñando bien</h2>
          <p class="mt-3 text-neutral-600">Casos de ejemplo. Cada bodega es distinta.</p>
        </div>
        <div class="mt-10 grid gap-5 md:grid-cols-3">
          <article v-for="c in CASOS" :key="c.titulo" class="card flex flex-col p-6" data-aparece>
            <p class="text-4xl font-bold tracking-tight text-brand-700">{{ c.numero }}</p>
            <p class="mt-1 text-sm font-medium text-neutral-500">{{ c.numeroTexto }}</p>
            <h3 class="mt-4 text-lg font-semibold text-neutral-900">{{ c.titulo }}</h3>
            <dl class="mt-3 space-y-3 text-[15px]">
              <div><dt class="font-semibold text-neutral-900">Problema</dt><dd class="text-neutral-600">{{ c.problema }}</dd></div>
              <div><dt class="font-semibold text-neutral-900">Solución</dt><dd class="text-neutral-600">{{ c.solucion }}</dd></div>
            </dl>
          </article>
        </div>
      </div>
    </section>

    <!-- ─── 7. FAQ ─── -->
    <section class="py-14 sm:py-20">
      <div class="container-page max-w-3xl">
        <div class="text-center" data-aparece>
          <span class="eyebrow">Preguntas frecuentes</span>
          <h2 class="titulo-seccion mt-4">Lo que nos suelen preguntar</h2>
        </div>
        <div class="mt-10 space-y-3">
          <details v-for="f in FAQ" :key="f.p" class="faq card group" data-aparece>
            <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-neutral-900">
              {{ f.p }}
              <svg class="h-5 w-5 flex-shrink-0 text-neutral-400 transition-transform duration-200 group-open:rotate-45" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </summary>
            <p class="px-5 pb-5 text-neutral-600">{{ f.r }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- ─── 8. CTA final ─── -->
    <section class="relative flex min-h-[80svh] items-center overflow-hidden bg-ink-950 py-16">
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute -bottom-40 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-brand-600/25 blur-3xl"></div>
      </div>
      <div class="container-page relative text-center" data-aparece>
        <h2 class="mx-auto max-w-3xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          Tu bodega diseñada hoy, tu cotización en máximo 24 horas
        </h2>
        <p class="mx-auto mt-5 max-w-xl text-lg text-neutral-300">Gratis, desde el celular, y con un ingeniero revisando tu diseño.</p>
        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <NuxtLink to="/planifica-tu-bodega/disena" class="btn btn-primary btn-lg w-full sm:w-auto" @click="marcar('cta_click', { ubicacion: 'final' })">
            {{ textoCta }}
          </NuxtLink>
          <a :href="WHATSAPP" target="_blank" rel="noopener noreferrer" class="btn btn-ghost-light btn-lg w-full active:scale-[.98] sm:w-auto" @click="marcar('whatsapp_click', { ubicacion: 'final' })">
            Hablar por WhatsApp
          </a>
        </div>
      </div>
    </section>

    <CtaCotizacion24 :visible="ctaVisible" :boton="textoCta" @cotizar="cotizarDesdeBarra" />
  </div>
</template>

<script lang="ts" setup>
import { modularSelectivo } from '~/lib/tour/pallet.js';
// Misma URL (con hash) que usa main.css: precargarla evita que el titulo cambie de alto al llegar la fuente (CLS)
import interLatin from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';

definePageMeta({ layout: 'landing' });

usePageSeo({
  title: 'Planifica tu bodega gratis',
  description: 'Diseña tu bodega en 5 minutos con el planificador de Racklog y recibe tu cotización de racks en máximo 24 horas. Gratis y revisado por un ingeniero.',
  ogDescription: 'Dibuja tu bodega, arma tus pallets y mira tus racks en 2D y 3D. Un ingeniero de Racklog lo revisa y te cotiza en máximo 24 horas.',
  twitterDescription: 'Planificador de bodegas gratis: racks en 2D y 3D desde el celular y cotización en máximo 24 horas.',
  image: '/assets/images/og-planifica-tu-bodega.png',
  imageAlt: 'Diseña tu bodega y recibe tu cotización en máximo 24 horas: planificador 3D de Racklog',
});

useHead({ link: [{ rel: 'preload', as: 'font', type: 'font/woff2', href: interLatin, crossorigin: '' }] });

// ─── A/B (composables/useVariante.ts; apagado por defecto) ───
const varTitulo = useVariante('titulo');
const varCta = useVariante('cta');
const textoCta = computed(() => varCta.value === 'recibir' ? 'Recibir mi cotización' : varCta.value === 'cotizar' ? 'Cotizar mi bodega gratis' : 'Empezar gratis');
// Las URLs con ?v= (variantes forzadas para avisos) no se indexan; el canonical ya apunta a la URL sin parámetros
const conVariante = usaVarianteEnUrl();
useHead(() => (conVariante.value ? { meta: [{ name: 'robots', content: 'noindex, follow' }] } : {}));

const WHATSAPP = 'https://wa.me/56932403819';
const ICONO_WA = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';

const CONFIANZA = [
  { t: 'Fabricando desde 2008', icono: 'M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z' },
  { t: 'Fabricantes en Quilicura', icono: 'M3 21h18M5 21V10l5 3V10l5 3V7l4 2v12' },
  { t: 'Proyectos en todo Chile', icono: 'M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z' },
  { t: 'Diseño sísmico NCh2369', icono: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3zM8.5 12l2.5 2.5 4.5-5' },
];

const CLIENTES = [
  { nombre: 'Coca-Cola', logo: '/assets/images/clients/cocacola.webp' },
  { nombre: 'Correos de Chile', logo: '/assets/images/clients/correosdechile.webp' },
  { nombre: 'Guess', logo: '/assets/images/clients/guess.webp' },
  { nombre: 'H&M', logo: '/assets/images/clients/hym.webp' },
  { nombre: 'Pichara', logo: '/assets/images/clients/pichara.webp' },
  { nombre: 'Skechers', logo: '/assets/images/clients/skechers.webp' },
];

const PASOS = [
  { t: 'Dibuja tu bodega', d: 'Marca las medidas, pilares, portones y oficinas. Si no sabes algo, usamos lo típico.', icono: 'M4 4h16v16H4zM4 10h6v10M14 4v6h6' },
  { t: 'Arma tus pallets y tu rack', d: 'Dinos el alto, el peso y cuántos tienes. Calculamos niveles y cuerpos por ti.', icono: 'M3 18h18M5 18v2M12 18v2M19 18v2M6 6h12v12H6zM6 12h12M12 6v12' },
  { t: 'Arma tu layout', d: 'Pon tus racks lineal por lineal, simples o dobles, donde tú quieras. Te decimos cuánto te falta.', icono: 'M4 5h16M4 12h16M4 19h16M8 5v14' },
  { t: 'Recibe tu cotización en máximo 24 h', d: 'Un ingeniero revisa tu diseño y te enviamos la cotización por correo.', icono: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const ROLES = [
  { rol: 'supply', t: 'Soy supply chain', d: 'Posiciones hoy y a 1 y 2 años, m² usados y cómo crecer por etapas.', icono: 'M4 19V5M4 19h16M8 15l3-4 3 2 5-6' },
  { rol: 'bodega', t: 'Soy jefe de bodega', d: '¿Caben mis pallets? ¿Opera la grúa? Cuerpos, niveles y pasillos.', icono: 'M3 20h18M6 20V8h12v12M6 12h12M6 16h12M10 4h4v4h-4z' },
  { rol: 'compras', t: 'Soy compras / dueño', d: 'Una lista clara de qué cotizar: cuerpos, marcos, vigas y carga.', icono: 'M9 4h6l1 2h3v15H5V6h3l1-2zM9 11h6M9 15h4' },
];

const CASOS = [
  {
    numero: '+38 %', numeroTexto: 'más posiciones en la misma bodega',
    titulo: 'Distribuidora con pallets en el piso',
    problema: 'Pallets apilados a dos alturas y pasillos anchos de más.',
    solucion: 'Rack selectivo de 4 alturas y pasillos ajustados a la grúa que ya tenían.',
  },
  {
    numero: '−1', numeroTexto: 'bodega arrendada de menos',
    titulo: 'Importadora que crecía cada temporada',
    problema: 'Cada llegada de contenedores obligaba a arrendar espacio extra.',
    solucion: 'Drive-in para los productos de mucho volumen y selectivo para el resto.',
  },
  {
    numero: '2×', numeroTexto: 'más cajas por metro de pasillo',
    titulo: 'Tienda con repuestos sueltos',
    problema: 'Cajas pequeñas en estantes de madera, difíciles de encontrar.',
    solucion: 'Ángulo ranurado con bandejas a la altura de la mano y pasillos ordenados.',
  },
];

const FAQ = [
  { p: '¿Tiene costo?', r: 'No. Diseñar tu bodega y recibir la cotización es gratis y sin compromiso.' },
  { p: '¿Qué datos necesito?', r: 'Las medidas aproximadas de tu bodega, el alto de tus pallets, cuántos tienes y con qué equipo los mueves. Si no sabes algo, elige "No sé" y usamos un valor típico que luego confirma el ejecutivo.' },
  { p: '¿En cuánto tiempo responden?', r: 'Nuestro equipo comercial te envía la cotización en máximo 24 horas desde que envías tu diseño.' },
  { p: '¿Instalan en regiones?', r: 'Sí. Fabricamos en Quilicura y despachamos e instalamos en todo Chile. Cuéntanos dónde está tu bodega al cotizar.' },
  { p: '¿Cumplen la norma sísmica?', r: 'Sí. Diseñamos según la norma chilena NCh2369 y el estándar ANSI MH16.1 para racks de almacenaje.' },
];

// ─── Demo: mini configurador antes del registro ───
const EQUIPOS = [
  { v: 'apilador-manual', t: 'Apilador manual (3,0 m de levante)', levante: 3.0 },
  { v: 'apilador-electrico', t: 'Apilador eléctrico (4,5 m)', levante: 4.5 },
  { v: 'grua-horquilla', t: 'Grúa horquilla (6,0 m)', levante: 6.0 },
  { v: 'retractil', t: 'Grúa retráctil (10,0 m)', levante: 10.0 },
];

const demo = reactive({ alto: 1.2, cantidad: 120, alturaLibre: 8, equipo: 'grua-horquilla' });
const equipo = computed(() => EQUIPOS.find((e) => e.v === demo.equipo) ?? EQUIPOS[2]);

function limitar(v: number, min: number, max: number, def: number) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return def;
  return Math.min(max, Math.max(min, v));
}

interface Modulacion { niveles: number; alturas: number; porCuerpo: number; cuerpos: number; limitadoPor: 'techo' | 'grua' }

const calculo = computed<Modulacion>(() => {
  const r = modularSelectivo({
    pallet: { alto: limitar(demo.alto, 0.8, 2, 1.2), peso: 800, frente: 1.0 },
    alturaLibre: limitar(demo.alturaLibre, 3, 20, 8),
    levanteGrua: equipo.value.levante,
    palletsPorViga: 2,
    totalPallets: Math.round(limitar(demo.cantidad, 1, 20000, 120)),
  });
  return { niveles: r.niveles, alturas: r.alturas, porCuerpo: r.porCuerpo, cuerpos: r.cuerpos ?? 0, limitadoPor: r.limitadoPor } as Modulacion;
});

const datosDemo = computed(() => ({
  alto: limitar(demo.alto, 0.8, 2, 1.2),
  pallets: Math.round(limitar(demo.cantidad, 1, 20000, 120)),
  altura: limitar(demo.alturaLibre, 3, 20, 8),
  equipo: demo.equipo,
}));
const linkDemo = computed(() => {
  const d = datosDemo.value;
  return `/planifica-tu-bodega/disena?alto=${d.alto}&pallets=${d.pallets}&altura=${d.altura}&equipo=${d.equipo}`;
});

const fmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });
const formato = (n: number) => fmt.format(n);

// Números animados contando (~400 ms); sin animación con prefers-reduced-motion
const vista = reactive({ porCuerpo: 0, cuerpos: 0, alturas: 0 });
let reducido = false;
let raf = 0;
function animarA(dest: { porCuerpo: number; cuerpos: number; alturas: number }) {
  if (typeof window === 'undefined' || reducido) { Object.assign(vista, dest); return; }
  cancelAnimationFrame(raf);
  const desde = { ...vista };
  const t0 = performance.now();
  const paso = (t: number) => {
    const k = Math.min(1, (t - t0) / 400);
    const e = 1 - Math.pow(1 - k, 3);
    vista.porCuerpo = Math.round(desde.porCuerpo + (dest.porCuerpo - desde.porCuerpo) * e);
    vista.cuerpos = Math.round(desde.cuerpos + (dest.cuerpos - desde.cuerpos) * e);
    vista.alturas = Math.round(desde.alturas + (dest.alturas - desde.alturas) * e);
    if (k < 1) raf = requestAnimationFrame(paso);
  };
  raf = requestAnimationFrame(paso);
}
// En el servidor se muestran los valores finales (sin parpadeo de ceros)
Object.assign(vista, { porCuerpo: calculo.value.porCuerpo, cuerpos: calculo.value.cuerpos, alturas: calculo.value.alturas });
watch(calculo, (c) => animarA({ porCuerpo: c.porCuerpo, cuerpos: c.cuerpos, alturas: c.alturas }));

// ─── Eventos ───
function marcar(event: string, datos: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, event_category: 'Landing', ...datos });
}

// ─── Barra CTA fija: visible después del hero ───
const hero = ref<HTMLElement | null>(null);
const ctaVisible = ref(false);
let obsHero: IntersectionObserver | null = null;
let obsAparece: IntersectionObserver | null = null;

function cotizarDesdeBarra() {
  marcar('cta_click', { ubicacion: 'barra_fija' });
  navigateTo('/planifica-tu-bodega/disena');
}

onMounted(() => {
  reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  marcar('landing_view');

  if (hero.value && 'IntersectionObserver' in window) {
    obsHero = new IntersectionObserver(([e]) => { ctaVisible.value = !e.isIntersecting; }, { threshold: 0 });
    obsHero.observe(hero.value);

    // Aparición suave de bloques al entrar en pantalla (solo los que aún no se ven)
    if (!reducido) {
      // Sin getBoundingClientRect (forzaba un reflow al montar): la primera entrega del observer ya trae
      // la posicion; se ocultan solo los bloques que estan bajo la pantalla y se muestran al llegar
      const vistos = new WeakSet<Element>();
      obsAparece = new IntersectionObserver((entradas) => {
        for (const en of entradas) {
          const primera = !vistos.has(en.target);
          vistos.add(en.target);
          if (en.isIntersecting) {
            en.target.classList.remove('aparece-oculto');
            obsAparece?.unobserve(en.target);
          } else if (primera && en.boundingClientRect.top > (en.rootBounds?.height ?? window.innerHeight)) {
            en.target.classList.add('aparece-oculto');
          } else if (primera) {
            obsAparece?.unobserve(en.target);
          }
        }
      }, { rootMargin: '0px 0px -8% 0px' });
      document.querySelectorAll<HTMLElement>('[data-aparece]').forEach((el) => obsAparece!.observe(el));
    }
  }
});

onBeforeUnmount(() => {
  obsHero?.disconnect();
  obsAparece?.disconnect();
  cancelAnimationFrame(raf);
});
</script>

<style scoped>
.halo {
  background: radial-gradient(closest-side, color-mix(in srgb, var(--color-brand-600) 25%, transparent), transparent);
}
.titulo-seccion {
  font-size: 1.625rem; /* 26 px */
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-neutral-900);
}
@media (min-width: 640px) {
  .titulo-seccion { font-size: 1.75rem; } /* 28 px */
}
.campo {
  display: block;
  width: 100%;
  min-height: 2.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-neutral-300);
  background: #fff;
  padding: 0.625rem 0.875rem;
  font-size: 1rem;
  color: var(--color-neutral-900);
  transition: border-color .2s cubic-bezier(.2, .8, .2, 1), box-shadow .2s cubic-bezier(.2, .8, .2, 1);
}
.campo:focus {
  outline: none;
  border-color: var(--color-brand-600);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-600) 20%, transparent);
}
.nota {
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-neutral-500);
}
.faq summary::-webkit-details-marker { display: none; }
.faq[open] > p { animation: faq-abre .22s cubic-bezier(.2, .8, .2, 1); }
@keyframes faq-abre {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: none; }
}

[data-aparece] {
  transition: opacity .25s cubic-bezier(.2, .8, .2, 1), transform .25s cubic-bezier(.2, .8, .2, 1);
}
.aparece-oculto {
  opacity: 0;
  transform: translateY(12px);
}
@media (prefers-reduced-motion: reduce) {
  [data-aparece], .aparece-oculto { transition: none; opacity: 1; transform: none; }
  .faq[open] > p { animation: none; }
}
</style>
