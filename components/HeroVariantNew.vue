<template>
  <section class="hero-enhanced relative isolate overflow-hidden bg-ink-950">
    <!-- Fondo: imagen inmediata (LCP) y video diferido -->
    <div class="video-bg absolute inset-0">
      <!-- Imagen inmediata (LCP); el video se carga despues, si corresponde -->
      <img
        src="/assets/images/slide-1.webp"
        alt=""
        aria-hidden="true"
        fetchpriority="high"
        decoding="async"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <iframe
        v-if="playerSrc"
        class="yt-cover pointer-events-none"
        tabindex="-1"
        aria-hidden="true"
        :src="playerSrc"
        title="RACKLOG Background"
        frameborder="0"
        allow="autoplay; encrypted-media; accelerometer; clipboard-write; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
      <!-- Oscurecedor para legibilidad -->
      <div class="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/75 to-ink-950/40" aria-hidden="true"></div>
      <div class="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent" aria-hidden="true"></div>
    </div>

    <div class="container-page relative z-10 flex min-h-[inherit] flex-col">
      <!-- Contenido principal -->
      <div class="flex flex-1 items-center py-20 sm:py-24 lg:py-28">
        <div class="max-w-3xl">
          <h1 class="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl" style="letter-spacing: -0.035em;">
            Transformamos tu espacio en <span class="text-brand-400">eficiencia</span>
          </h1>

          <p class="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300 sm:text-xl">
            Creamos
            <strong class="font-semibold text-white">soluciones de almacenamiento inteligentes</strong>
            que multiplican la capacidad de tu bodega sin expandir el espacio físico.
          </p>

          <div class="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" class="btn btn-primary btn-lg" @click="openContactModal()">
              Consulta gratis
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </button>
            <NuxtLink to="/productos" class="btn btn-ghost-light btn-lg">
              Ver productos
            </NuxtLink>
          </div>

          <!-- Beneficios -->
          <ul class="mt-8 flex flex-wrap gap-2" aria-label="Beneficios">
            <li
              v-for="benefit in benefits"
              :key="benefit"
              class="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-sm font-medium text-neutral-200 ring-1 ring-white/10 ring-inset backdrop-blur"
            >
              <svg class="h-4 w-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
              {{ benefit }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Logos de clientes -->
      <div class="border-t border-white/10 py-10">
        <div class="mb-6 flex flex-col gap-1 text-center sm:flex-row sm:items-baseline sm:justify-center sm:gap-3">
          <p class="text-xs font-semibold uppercase tracking-wider text-brand-300">
            Confían en nosotros
          </p>
          <h2 class="text-sm font-medium text-neutral-300">
            Empresas líderes que ya transformaron sus espacios
          </h2>
        </div>

        <div class="relative overflow-hidden logos-carousel">
          <div
            class="flex w-max items-center gap-9 animate-scroll"
            :style="{ '--scroll-width': clientLogos.length * 180 + 'px' }"
          >
            <div
              v-for="(client, index) in clientLogos"
              :key="`client-${index}`"
              class="group flex h-16 w-36 flex-shrink-0 items-center justify-center"
            >
              <img
                :src="client.logo"
                :alt="client.name"
                width="128"
                height="48"
                loading="lazy"
                decoding="async"
                class="max-h-10 max-w-32 object-contain brightness-0 invert opacity-60 transition-opacity duration-300 group-hover:opacity-100"
              />
            </div>

            <div
              v-for="(client, index) in clientLogos"
              :key="`client-duplicate-${index}`"
              aria-hidden="true"
              class="group flex h-16 w-36 flex-shrink-0 items-center justify-center"
            >
              <img
                :src="client.logo"
                alt=""
                width="128"
                height="48"
                loading="lazy"
                decoding="async"
                class="max-h-10 max-w-32 object-contain brightness-0 invert opacity-60 transition-opacity duration-300 group-hover:opacity-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact Modal -->
    <ContactModal :isVisible="isContactModalOpen" @close="closeContactModal" />
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ContactModal from '~/components/ContactModal.vue';

const isContactModalOpen = ref(false);
const clientLogos = ref([
  { name: 'Coca-Cola', logo: '/assets/images/clients/cocacola.webp' },
  { name: 'Correos de Chile', logo: '/assets/images/clients/correosdechile.webp' },
  { name: 'H&M', logo: '/assets/images/clients/hym.webp' },
  { name: 'Guess', logo: '/assets/images/clients/guess.webp' },
  { name: 'Pichara', logo: '/assets/images/clients/pichara.webp' },
  { name: 'Skechers', logo: '/assets/images/clients/skechers.webp' }
]);

// Solo presentacion: chips de beneficios del hero
const benefits = ['Análisis sin compromiso', 'Proyecto integral', 'Resultados garantizados'];

const playerSrc = ref('');
const YT_ID = '-FDbkSiPtoQ';

function shouldLoadVideo() {
  const connection = navigator.connection;
  if (connection?.saveData) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  // En moviles el video pesa mucho para ser solo decorativo
  return window.matchMedia('(min-width: 768px)').matches;
}

function loadVideo() {
  if (!shouldLoadVideo()) return;
  const origin = encodeURIComponent(window.location.origin);
  playerSrc.value =
    `https://www.youtube-nocookie.com/embed/${YT_ID}` +
    `?autoplay=1&mute=1&controls=0` +
    `&loop=1&playlist=${YT_ID}` +
    `&playsinline=1&modestbranding=1` +
    `&rel=0&iv_load_policy=3&disablekb=1` +
    `&fs=0&enablejsapi=0&origin=${origin}`;
}

onMounted(() => {
  // Cargar el video solo cuando la pagina ya termino de cargar
  const schedule = () => ('requestIdleCallback' in window ? window.requestIdleCallback(loadVideo) : setTimeout(loadVideo, 1500));
  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }
});

function openContactModal() {
  isContactModalOpen.value = true;
}
function closeContactModal() {
  isContactModalOpen.value = false;
}
</script>

<style scoped>
.hero-enhanced {
  min-height: 640px;
}
@media (min-width: 1024px) {
  .hero-enhanced {
    min-height: min(860px, 100svh);
  }
}

/* YouTube background cover */
.video-bg {
  z-index: 0;
}
.yt-cover {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100vw;
  height: 56.25vw;
  min-width: 177.78vh;
  min-height: 100vh;
  transform: translate(-50%, -50%);
}

/* Carrusel de logos: cada item mide 144px + 36px de separacion = 180px,
   igual al --scroll-width por logo, para que el bucle no salte */
.animate-scroll {
  animation: scroll 30s linear infinite;
}
@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-1 * var(--scroll-width)));
  }
}
.animate-scroll:hover {
  animation-play-state: paused;
}
.logos-carousel {
  mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
}
</style>
