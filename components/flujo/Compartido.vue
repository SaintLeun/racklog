<template>
  <section v-if="caducado" class="fl-card mx-auto max-w-xl text-center">
    <h1 class="fl-titulo">Este link venció</h1>
    <p class="fl-bajada">Los links a un diseño duran {{ DIAS_LINK }} días. Pide uno nuevo a quien te lo compartió, o diseña tu bodega en unos minutos.</p>
    <button type="button" class="fl-btn mt-6" @click="emit('propio')">Diseñar mi bodega</button>
  </section>
  <section v-else>
    <p class="text-sm font-semibold uppercase tracking-wider text-brand-700">Diseño compartido · solo lectura</p>
    <h1 class="fl-titulo mt-1">{{ n(cifra.n) }} {{ cifra.unidad }} en {{ fm(datos.bodega.ancho) }} × {{ fm(datos.bodega.largo) }} m</h1>
    <p class="fl-bajada">Alguien de tu equipo te compartió este diseño. Puedes verlo y pedir la cotización; para cambiarlo, haz tu propia copia.</p>

    <div class="fl-card mt-5 !p-0 overflow-hidden">
      <div class="flex gap-1 border-b border-neutral-100 p-2" role="tablist" aria-label="Vista">
        <button v-for="v in (['3d', '2d'] as const)" :key="v" type="button" role="tab" :aria-selected="vista === v" :class="['rounded-md px-4 py-2 text-sm font-semibold', vista === v ? 'bg-neutral-100 text-brand-800' : 'text-neutral-600']" @click="vista = v">{{ v === '2d' ? 'Plano 2D' : 'Vista 3D' }}</button>
      </div>
      <div v-if="vista === '3d'" class="h-[50svh] min-h-[320px]">
        <Visor3D :bodega="datos.bodega" :racks="datos.racks" :accesorios="datos.accesorios" :pallets="datos.pallets" :foco="foco" etiqueta="Vista 3D del diseño compartido" />
      </div>
      <div v-else class="pointer-events-none h-[50svh] min-h-[320px] p-3">
        <PlanificadorPlano2D :bodega="datos.bodega" :racks="datos.racks" :seleccion="null" :conflictos="sinConflictos" :encuadre="foco" />
      </div>
    </div>

    <div class="fl-card mt-5">
      <p class="fl-leyenda">Qué se cotiza</p>
      <div v-for="q in cotizar" :key="q.modelo" class="mt-3">
        <p class="font-semibold text-neutral-900">{{ q.nombre }}</p>
        <ul class="mt-1 list-disc space-y-0.5 pl-5 text-neutral-700"><li v-for="(l, i) in q.lineas" :key="i">{{ l }}</li></ul>
      </div>
    </div>

    <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button type="button" class="fl-btn-sec" @click="emit('propio')">Hacer mi propio diseño</button>
      <button type="button" class="fl-btn" @click="emit('cotizar')">Cotizar este diseño</button>
    </div>
    <p v-if="hasta" class="mt-3 text-sm text-neutral-500">Este link vence el {{ hasta }}.</p>
  </section>
</template>

<script lang="ts" setup>
// Diseño compartido por link: solo lectura, con "Cotizar este diseño". Vence a los 30 días 
import { ref, computed } from 'vue';
import { DIAS_LINK, vencido } from '~/lib/flujo/enlace.js';
import { queCotizar } from '~/lib/flujo/calculos.js';
import { focoDiseño } from '~/lib/flujo/perfiles.js';
import { cifraPrincipal } from '~/lib/flujo/exportar.js';
import { formatoM } from '~/lib/rack3d/planificador.js';

const props = defineProps<{ datos: any }>();
const emit = defineEmits<{ cotizar: []; propio: [] }>();
const vista = ref<'2d' | '3d'>('3d');
const sinConflictos = new Set<string>();
const fm = (v: number) => formatoM(v || 0);
const n = (v: number) => Math.round(v || 0).toLocaleString('es-CL');
const foco = computed(() => focoDiseño(props.datos.racks, props.datos.bodega) as any);
const caducado = computed(() => vencido(props.datos));
const cifra = computed(() => cifraPrincipal(props.datos.racks) as { n: number; unidad: string });
const cotizar = computed(() => queCotizar(props.datos.modelos, props.datos.racks) as any[]);
const hasta = computed(() => (props.datos.hasta ? new Date(props.datos.hasta).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''));
</script>
