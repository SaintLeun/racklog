<template>
  <!-- Recomendacion por producto (docs/LOGICA-SELECCION-RACKS.md): sistema, configuracion, por que, que
       gano a la alternativa (dibujadas lado a lado) y que falta confirmar -->
  <section class="fl-card">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <p class="fl-leyenda">Nuestra recomendación para tus productos</p>
      <button type="button" class="fl-btn !min-h-10 !px-4 !text-sm" @click="emit('usar', rec.modelos)">Armar mis racks así</button>
    </div>
    <p v-if="rec.flags.includes('revisar_asesor')" class="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
      Un ingeniero de Racklog revisará si te conviene otra solución de alta densidad para algunos productos.
    </p>
    <article v-for="x in rec.productos" :key="x.id" class="mt-5 border-t border-neutral-100 pt-5 first-of-type:border-0 first-of-type:pt-0">
      <p class="text-sm text-neutral-500">{{ x.datos }}</p>
      <p class="mt-1 text-lg font-bold text-neutral-900">{{ NOMBRE_SISTEMA[x.sistema] }}</p>
      <p class="text-neutral-800">{{ x.config }}</p>
      <ul class="mt-2 space-y-1 text-neutral-700">
        <li v-for="(t, i) in x.porque" :key="i" class="flex gap-2"><span class="text-brand-600" aria-hidden="true">✓</span>{{ t }}</li>
      </ul>
      <p class="mt-1 text-sm text-neutral-600">{{ x.gano }}</p>
      <!-- Lado a lado: recomendado y alternativa, con sus posiciones -->
      <div class="mt-3 grid grid-cols-2 gap-3">
        <figure v-for="lado in [{ t: 'Recomendado', s: x.sistema, d: x.elegido, c: x.config }, { t: 'Alternativa', s: x.alternativa, d: x.otra, c: x.configAlternativa }]" :key="lado.t" :class="['rounded-xl p-2 ring-1', lado.t === 'Recomendado' ? 'bg-brand-50/40 ring-brand-200' : 'bg-neutral-50 ring-neutral-200']">
          <figcaption class="text-xs font-semibold uppercase tracking-wide" :class="lado.t === 'Recomendado' ? 'text-brand-800' : 'text-neutral-500'">{{ lado.t }} · {{ NOMBRE_SISTEMA[lado.s] }}</figcaption>
          <FlujoPlantaRack :m="lado.d.m" class="mt-1" />
          <p class="text-sm font-semibold text-neutral-900">{{ n(lado.d.posiciones) }} posiciones</p>
          <p class="text-xs text-neutral-500">{{ lado.d.unidades }} {{ lado.d.unidad }} · {{ n(lado.d.m2) }} m² con pasillo</p>
        </figure>
      </div>
      <p v-if="x.confirmar.length" class="mt-2 text-sm text-neutral-500">Tu ejecutivo confirmará: {{ x.confirmar.join('; ') }}.</p>
    </article>
    <p class="mt-4 text-xs text-neutral-400">Criterios referenciales de Racklog; un ingeniero revisa cada diseño antes de cotizar.</p>
  </section>
</template>

<script lang="ts" setup>
import { NOMBRE_SISTEMA } from '~/lib/flujo/recomendacion.js';

defineProps<{ rec: { productos: any[]; flags: string[]; modelos: any[] } }>();
const emit = defineEmits<{ usar: [modelos: any[]] }>();
const n = (v: number) => Math.round(v).toLocaleString('es-CL');
</script>
