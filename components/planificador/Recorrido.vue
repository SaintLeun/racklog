<template>
  <div
    class="pointer-events-auto w-[min(26rem,calc(100%-2rem))] rounded-2xl bg-neutral-900 p-4 text-white shadow-2xl ring-1 ring-black/10"
    role="dialog" aria-modal="false" :aria-labelledby="`${uid}-titulo`"
  >
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs font-semibold uppercase tracking-wider text-brand-300">Paso {{ paso + 1 }} de {{ PASOS.length }}</p>
      <button type="button" class="text-xs font-semibold text-neutral-300 underline-offset-2 hover:text-white hover:underline" @click="emit('cerrar')">Saltar</button>
    </div>
    <p :id="`${uid}-titulo`" class="mt-1.5 font-semibold">{{ PASOS[paso].titulo }}</p>
    <p class="mt-1 text-sm leading-relaxed text-neutral-300">{{ PASOS[paso].texto }}</p>
    <div class="mt-3 flex items-center justify-between">
      <div class="flex gap-1.5" aria-hidden="true">
        <span v-for="(p, i) in PASOS" :key="i" :class="['h-1.5 w-6 rounded-full', i <= paso ? 'bg-brand-500' : 'bg-white/20']" />
      </div>
      <div class="flex gap-2">
        <button v-if="paso > 0" type="button" class="h-9 rounded-lg px-3 text-sm font-semibold text-neutral-200 hover:bg-white/10" @click="emit('paso', paso - 1)">Atrás</button>
        <button type="button" class="h-9 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700" @click="paso < PASOS.length - 1 ? emit('paso', paso + 1) : emit('cerrar')">
          {{ paso < PASOS.length - 1 ? 'Siguiente' : 'Empezar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// Recorrido inicial del planificador; la pagina resalta la seccion de cada paso
defineProps<{ paso: number }>();
const emit = defineEmits<{ paso: [n: number]; cerrar: [] }>();
const uid = useId();

const PASOS = [
  { titulo: 'Dibuja tu bodega', texto: 'Escribe sus medidas o marca las esquinas en forma libre. Mide hasta lo más bajo del techo: viga, luminaria o rociador.' },
  { titulo: 'Elige tu sistema', texto: '¿No sabes cuál? En "Te asesoramos" te lo recomendamos con 3 preguntas.' },
  { titulo: 'Ajusta y ubica tus racks', texto: 'Arrástralos, gíralos o duplícalos. Te avisamos si algo choca, se sale de la bodega o es más alto que el techo.' },
  { titulo: 'Guárdalo y recíbelo', texto: 'Descarga tu plano con medidas o pide la cotización: un ejecutivo lo revisa gratis.' },
];
</script>
