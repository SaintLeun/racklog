<template>
  <div class="hero-enhanced relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden py-10">
    <!-- Background YouTube Video -->
    <div class="video-bg absolute inset-0">
      <iframe
        class="yt-cover pointer-events-none"
        :src="playerSrc"
        title="RACKLOG Background"
        frameborder="0"
        allow="autoplay; encrypted-media; accelerometer; clipboard-write; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
      <!-- Oscurecedor para legibilidad -->
      <div class="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
    </div>

    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-5">
      <div
        class="absolute inset-0"
        style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 20px 20px;"
      ></div>
    </div>

    <!-- Main Content Container -->
    <div class="relative z-10 flex h-full items-center">
      <div class="w-full max-w-7xl mx-auto px-4 md:px-8">
        <!-- Main content grid -->
        <div class="items-center h-full">
          <!-- Left side - Content -->
          <div class="text-white space-y-8 order-2 lg:order-1">
            <!-- Main heading -->
            <div class="space-y-4">
              <h1
                class="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-center"
              >
                <span class="block text-white">Transformamos</span>
                <span class="block">
                  <span class="text-white">tu </span>
                  <span
                    class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-400"
                    >espacio</span
                  >
                </span>
                <span class="block">
                  <span class="text-white">en </span>
                  <span
                    class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-400"
                    >eficiencia</span
                  >
                </span>
              </h1>
            </div>

            <!-- Description -->
            <div class="relative">
              <div
                class="bg-gradient-to-r from-orange-400 to-yellow-400 p-6 rounded-2xl shadow-2xl"
              >
                <p class="text-black text-lg md:text-xl font-semibold leading-relaxed">
                  Creamos
                  <strong class="font-black"
                    >soluciones de almacenamiento inteligentes</strong
                  >
                  que multiplican la capacidad de tu bodega sin expandir el espacio
                  físico.
                </p>
                <!-- Decorative -->
                <div
                  class="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full shadow-lg"
                ></div>
                <div
                  class="absolute -bottom-1 -left-1 w-3 h-3 bg-orange-600 rounded-full"
                ></div>
              </div>
            </div>

            <!-- CTA -->
            <div class="space-y-4 text-center">
              <button
                @click="openContactModal()"
                class="group relative inline-flex items-center px-8 py-4 bg-white text-black rounded-xl font-bold text-lg shadow-2xl hover:shadow-orange-500/25 hover:scale-101 transition-all duration-300 overflow-hidden"
              >
                <div
                  class="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                ></div>

                <div class="relative z-10 flex items-center space-x-3">
                  <div class="flex items-center space-x-2">
                    <div
                      class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center"
                    >
                      <svg
                        class="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        ></path>
                      </svg>
                    </div>
                    <span class="group-hover:text-white transition-colors"
                      >Descubre tu potencial de almacenamiento</span
                    >
                  </div>

                  <div class="h-6 w-px bg-gray-300 group-hover:bg-white/50"></div>

                  <div class="flex items-center space-x-1">
                    <span
                      class="text-orange-600 group-hover:text-white transition-colors font-black"
                      >CONSULTA GRATIS</span
                    >
                    <svg
                      class="w-5 h-5 text-orange-600 group-hover:text-white group-hover:translate-x-1 transition-all"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      ></path>
                    </svg>
                  </div>
                </div>
              </button>

              <!-- Trust indicators -->
              <div
                class="flex items-center justify-center space-x-6 text-sm text-white-400 flex-wrap gap-2"
              >
                <div class="flex items-center space-x-2">
                  <svg
                    class="w-4 h-4 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>Análisis sin compromiso</span>
                </div>
                <div class="flex items-center space-x-2">
                  <svg
                    class="w-4 h-4 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>Proyecto integral</span>
                </div>
                <div class="flex items-center space-x-2">
                  <svg
                    class="w-4 h-4 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>Resultados garantizados</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Client Logos -->
        <div class="mt-16 lg:mt-20">
          <div class="text-center mb-8">
            <p
              class="text-white text-sm font-medium tracking-wider uppercase mb-2"
            >
              Confían en nosotros
            </p>
            <h3 class="text-white text-xl font-semibold">
              Empresas líderes que ya transformaron sus espacios
            </h3>
          </div>

          <div class="relative overflow-hidden logos-carousel">
            <div
              class="flex items-center space-x-12 animate-scroll"
              :style="{ '--scroll-width': clientLogos.length * 180 + 'px' }"
            >
              <div
                v-for="(client, index) in clientLogos"
                :key="`client-${index}`"
                class="flex-shrink-0 w-40 h-20 flex items-center justify-center bg-white bg-opacity-10 backdrop-blur-sm rounded-xl border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 group"
              >
                <img
                  :src="client.logo"
                  :alt="client.name"
                  class="max-h-12 max-w-32 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
                />
              </div>

              <div
                v-for="(client, index) in clientLogos"
                :key="`client-duplicate-${index}`"
                class="flex-shrink-0 w-40 h-20 flex items-center justify-center bg-white bg-opacity-10 backdrop-blur-sm rounded-xl border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 group"
              >
                <img
                  :src="client.logo"
                  :alt="client.name"
                  class="max-h-12 max-w-32 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact Modal -->
    <ContactModal :isVisible="isContactModalOpen" @close="closeContactModal" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ContactModal from '~/components/ContactModal.vue';

const isContactModalOpen = ref(false);
const clientLogos = ref([
  { name: 'Coca-Cola', logo: '/assets/images/clients/cocacola.png' },
  { name: 'Correos de Chile', logo: '/assets/images/clients/correosdechile.png' },
  { name: 'H&M', logo: '/assets/images/clients/hym.png' },
  { name: 'Guess', logo: '/assets/images/clients/guess.png' },
  { name: 'Pichara', logo: '/assets/images/clients/pichara.png' },
  { name: 'Skechers', logo: '/assets/images/clients/skechers.png' }
]);

const playerSrc = ref('');
const YT_ID = '-FDbkSiPtoQ';

onMounted(() => {
  const origin =
    typeof window !== 'undefined'
      ? encodeURIComponent(window.location.origin)
      : 'https%3A%2F%2Fwww.racklog.cl';

  playerSrc.value =
    `https://www.youtube.com/embed/${YT_ID}` +
    `?autoplay=1&mute=1&controls=0` +
    `&loop=1&playlist=${YT_ID}` +
    `&playsinline=1&modestbranding=1` +
    `&rel=0&iv_load_policy=3&disablekb=1` +
    `&fs=0&enablejsapi=0&origin=${origin}`;

  if (window?.dataLayer) {
    window.dataLayer.push({
      event: 'ab_test_view',
      ab_test_name: 'hero_variant',
      ab_test_variant: 'new_hero'
    });
  }
});

function openContactModal() {
  isContactModalOpen.value = true;
  if (window?.dataLayer) {
    window.dataLayer.push({
      event: 'ab_test_conversion',
      ab_test_name: 'hero_variant',
      ab_test_variant: 'new_hero',
      conversion_type: 'contact_modal_open'
    });
  }
}
function closeContactModal() {
  isContactModalOpen.value = false;
}
</script>

<style scoped>
.hero-enhanced {
  min-height: 600px;
  position: relative;
}
@media (max-width: 768px) {
  .hero-enhanced {
    min-height: 700px;
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

/* Mantén tus estilos previos */
.bg-clip-text {
  background-size: 200% 200%;
  animation: gradientShift 3s ease-in-out infinite;
}
@keyframes gradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* Logos carousel */
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
.overflow-hidden.logos-carousel {
  mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black 10%,
    black 90%,
    transparent
  );
}
</style>
