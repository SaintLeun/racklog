<template>
  <!-- RACKLOG en el inicio (dueño 28-10): llega caminando la primera vez, se presenta y cuenta cómo funciona la
       herramienta; después queda chico abajo a la izquierda y al tocarlo vuelve a explicar. Textos en
       lib/flujo/asistente.js (INICIO). Bajo el aviso de cookies (z-60) y lejos del botón de WhatsApp (derecha) -->
  <div v-if="entrada !== 'espera'" class="pointer-events-none fixed left-3 z-[55] flex items-end gap-1 sm:bottom-5 sm:left-5" :class="arriba ? 'bottom-20' : 'bottom-3'">
    <button
      type="button" class="pointer-events-auto relative -mb-1 flex-shrink-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
      :aria-label="i === null ? 'RACKLOG: ¿cómo funciona?' : 'Cerrar a RACKLOG'" :aria-expanded="i !== null" @click="i === null ? abrir() : cerrar()"
    >
      <FlujoRobot3D
        :pose="tema?.pose ?? 'pulgar'" :caminar="entrada === 'camina'"
        :class="['rl-tam drop-shadow-[0_8px_12px_rgba(0,0,0,0.2)]', i === null ? 'h-20 w-20 sm:h-24 sm:w-24' : 'h-36 w-32 sm:h-56 sm:w-52']"
        @llego="llegó"
      />
    </button>
    <Transition name="fl-sub">
      <div v-if="tema" class="pointer-events-auto mb-8 w-[min(330px,calc(100vw-9.5rem))] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm shadow-xl ring-1 ring-black/10 sm:mb-12" role="status">
        <div class="flex items-start gap-2">
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-neutral-900">{{ tema.titulo }}</p>
            <p class="mt-0.5 leading-relaxed text-neutral-800">{{ tema.texto }}</p>
          </div>
          <button type="button" class="-mr-1.5 -mt-1 h-7 w-7 flex-shrink-0 rounded text-neutral-400 hover:bg-neutral-100" aria-label="Cerrar" @click="cerrar">×</button>
        </div>
        <div class="mt-3 flex items-center justify-end gap-3">
          <button v-if="i! + 1 < INICIO.length" type="button" class="font-medium text-neutral-600 underline underline-offset-2" @click="i = i! + 1">{{ i === 0 ? '¿Cómo funciona?' : 'Siguiente' }}</button>
          <NuxtLink :to="destino" class="rounded-lg bg-brand-600 px-3 py-1.5 font-semibold text-white hover:bg-brand-700" @click="marcar('cta_click', { ubicacion: 'racklog_inicio', tema: i })">Diseñar mi bodega</NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { INICIO } from '~/lib/flujo/asistente.js';

// arriba: en el celular sube para no tapar la barra de cotizar
defineProps<{ destino: string; arriba?: boolean }>();
const { analytics } = useConsent();
// Tema a la vista (null: chico en la esquina)
const i = ref<number | null>(null);
const tema = computed(() => (i.value === null ? null : INICIO[i.value]));
const entrada = ref<'espera' | 'camina' | 'lista'>('espera');
const CLAVE = 'racklog_inicio_saludo';
// Si ya se presentó aquí, dentro del flujo no vuelve a saludar (va directo a explicar el paso)
const CLAVE_FLUJO = 'racklog_asistente_saludo';

function llegó() {
  if (entrada.value === 'lista') return;
  entrada.value = 'lista';
  i.value = 0;
  guardar(CLAVE);
  guardar(CLAVE_FLUJO);
  marcar('asistente_inicio', {});
}
function abrir() { i.value = 0; marcar('asistente_abrir', { paso: 'inicio' }); }
function cerrar() { i.value = null; }

let t: ReturnType<typeof setTimeout> | null = null;
onMounted(() => {
  // La primera vez llega caminando cuando la portada ya cargó; después aparece chico, sin interrumpir
  if (leer(CLAVE)) { entrada.value = 'lista'; return; }
  // Espera a que el cliente responda el aviso de cookies, que va en el mismo lugar
  const partir = () => { t = setTimeout(() => { entrada.value = 'camina'; t = setTimeout(llegó, 4500); }, 1800); };
  if (analytics.value !== 'unset') return partir();
  const parar = watch(analytics, (v) => { if (v !== 'unset') { parar(); partir(); } });
});
onBeforeUnmount(() => { if (t) clearTimeout(t); });

function guardar(clave: string) { try { sessionStorage.setItem(clave, '1'); } catch { /* sin almacenamiento */ } }
function leer(clave: string) { try { return sessionStorage.getItem(clave); } catch { return null; } }
function marcar(event: string, datos: Record<string, unknown>) {
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ??= []).push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>

<style scoped>
.rl-tam { transition: width .35s ease, height .35s ease; }
</style>
