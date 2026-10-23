<template>
  <section>
    <article v-for="x in rec.productos" :key="x.id" class="mt-4 border-t border-neutral-100 pt-4 first-of-type:mt-0 first-of-type:border-0 first-of-type:pt-0">
    <!-- Comparación por producto (docs/LOGICA-SELECCION-RACKS.md). El sistema que el cliente eligió es el
         protagonista: va primero y dibujado; nuestra sugerencia (si es otra) va al lado, como segunda opción -->
      <p class="text-sm text-neutral-500">{{ x.datos }}</p>
      <!-- Una alternativa que rompe un filtro duro (FIFO, equipo) no se muestra como opción: queda solo el porqué -->
      <div :class="['mt-3 grid gap-3', lados(x).length > 1 && 'sm:grid-cols-2']">
        <figure v-for="lado in lados(x)" :key="lado.t" :class="['rounded-xl p-2 ring-1', lado.tuyo ? 'bg-brand-50/40 ring-brand-200' : 'bg-neutral-50 ring-neutral-200']">
          <figcaption class="text-xs font-semibold uppercase tracking-wide" :class="lado.tuyo ? 'text-brand-800' : 'text-neutral-500'">{{ lado.t }} · {{ NOMBRE_SISTEMA[lado.s] }}</figcaption>
          <template v-if="lado.d">
            <FlujoPlantaRack :m="lado.d.m" :class="['mt-1', lados(x).length === 1 && 'mx-auto max-w-sm']" />
            <p class="text-sm font-semibold text-neutral-900">{{ n(lado.d.posiciones) }} posiciones</p>
            <p class="text-xs text-neutral-500">{{ lado.d.unidades }} {{ lado.d.unidad }} · {{ n(lado.d.m2) }} m² con pasillo</p>
          </template>
          <p v-else class="mt-2 text-sm text-neutral-700">{{ lado.c }}</p>
        </figure>
      </div>
      <p v-if="x.noCumple" class="mt-2 text-sm text-neutral-600"><span class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-semibold text-neutral-700">{{ x.noCumple }}</span> Descartamos {{ NOMBRE_SISTEMA[x.alternativa].toLowerCase() }}.</p>
      <ul class="mt-2 space-y-1 text-sm text-neutral-700">
        <li v-for="(t, i) in x.porque" :key="i" class="flex gap-2"><span class="text-brand-600" aria-hidden="true">✓</span>{{ t }}</li>
      </ul>
      <p class="mt-1 text-sm text-neutral-600">{{ x.gano }}</p>
      <p v-if="x.confirmar.length" class="mt-2 text-sm text-neutral-500">Tu ejecutivo confirmará: {{ x.confirmar.join('; ') }}.</p>
    </article>
  </section>
</template>

<script lang="ts" setup>
import { NOMBRE_SISTEMA } from '~/lib/flujo/recomendacion.js';

// actual: el sistema que el cliente está configurando (fuente de verdad del paso 3)
const props = defineProps<{ rec: { productos: any[] }; actual: string }>();
const n = (v: number) => Math.round(v).toLocaleString('es-CL');
// Primero lo que eligió; después la sugerencia (si difiere) o la alternativa válida
function lados(x: any) {
  const igual = x.sistema === props.actual;
  const nuestro = { s: x.sistema, d: x.elegido, c: x.config };
  const otro = { s: x.alternativa, d: x.otra, c: x.configAlternativa };
  if (igual) return [{ t: 'Tu elección', tuyo: true, ...nuestro }, ...(x.alternativaValida ? [{ t: 'Alternativa', tuyo: false, ...otro }] : [])];
  const tuyo = x.alternativa === props.actual ? otro : { s: props.actual, d: null, c: 'Lo configuras abajo.' };
  return [{ t: 'Tu elección', tuyo: true, ...tuyo }, { t: 'Sugerencia', tuyo: false, ...nuestro }];
}
</script>
