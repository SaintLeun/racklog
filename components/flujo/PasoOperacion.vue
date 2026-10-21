<template>
  <div>
    <Transition name="fl-sub" mode="out-in">
      <!-- Si sabe: elige sistema y equipo -->
      <section v-if="vista === 'elegir'" key="elegir">
        <h1 class="fl-titulo">¿Qué quieres cotizar?</h1>
        <div class="mt-6 grid gap-3 sm:grid-cols-3">
          <button
            v-for="(t, k) in TIPOS" :key="k" type="button"
            :class="['fl-opcion !p-0 overflow-hidden', p.sistema === k && 'fl-opcion--sel']"
            :aria-pressed="p.sistema === k"
            @click="p.sistema = k as Sistema"
          >
            <img :src="t.imagen" :alt="''" class="aspect-[4/3] w-full object-cover" loading="lazy">
            <span class="block px-4 pb-4 pt-3">
              <span class="block font-semibold text-neutral-900">{{ t.nombre }}</span>
              <span class="mt-1 block text-sm text-neutral-600">{{ t.asesoria.sirve }}</span>
            </span>
          </button>
        </div>
        <fieldset v-if="p.sistema && p.sistema !== 'AR'" class="mt-8">
          <legend class="fl-pregunta">¿Con qué equipo mueves los pallets?</legend>
          <div class="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              v-for="o in EQUIPOS" :key="o.v" type="button"
              :class="['fl-chip', p.respuestas.equipo === o.v && 'fl-chip--sel']" :aria-pressed="p.respuestas.equipo === o.v"
              @click="elegirEquipo(o.v)"
            >{{ o.t }}</button>
          </div>
        </fieldset>
        <FlujoAcciones :deshabilitado="!p.sistema" motivo="Elige un sistema para seguir." @atras="p.sabe = false" @siguiente="confirmarEleccion" />
      </section>

      <!-- Preguntas, una por pantalla -->
      <section v-else-if="vista === 'pregunta' && actual" :key="`q-${actual.clave}`">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-medium text-neutral-500">Pregunta {{ p.pregunta + 1 }} de {{ preguntas.length }}</p>
          <button type="button" class="text-sm font-medium text-brand-700 underline underline-offset-2" @click="p.sabe = true">Ya sé lo que quiero</button>
        </div>
        <h1 class="fl-titulo mt-1">{{ actual.texto }}</h1>
        <div class="mt-6 grid gap-2">
          <button
            v-for="o in actual.opciones" :key="o.v" type="button"
            :class="['fl-chip !justify-start !text-left', p.respuestas[actual.clave] === o.v && 'fl-chip--sel']"
            :aria-pressed="p.respuestas[actual.clave] === o.v"
            @click="responder(o.v)"
          >{{ o.t }}</button>
          <button type="button" class="fl-chip !justify-start !text-left text-neutral-500" @click="responder(TIPICO[actual.clave], true)">
            No sé, usen lo típico
          </button>
        </div>
        <details class="fl-tip mt-5">
          <summary>¿Por qué te preguntamos esto?</summary>
          <p>{{ actual.tip }}</p>
        </details>
        <FlujoAcciones :texto="'Saltar'" @atras="volverPregunta" @siguiente="responder(TIPICO[actual.clave], true)" />
      </section>

      <!-- Recomendacion -->
      <section v-else-if="vista === 'resultado' && rec" key="resultado">
        <p class="text-sm font-semibold uppercase tracking-wider text-brand-700">Te recomendamos</p>
        <h1 class="fl-titulo mt-1">{{ TIPOS[p.sistema!].nombre }}</h1>
        <div class="fl-card mt-5">
          <img :src="TIPOS[p.sistema!].imagen" alt="" class="-mx-5 -mt-5 mb-4 aspect-[16/7] w-[calc(100%+2.5rem)] max-w-none rounded-t-2xl object-cover" loading="lazy">
          <ul class="space-y-2 text-neutral-700">
            <li v-for="(t, i) in rec.porque" :key="i" class="flex gap-2"><span class="text-brand-600" aria-hidden="true">✓</span>{{ t }}</li>
          </ul>
          <ul v-if="rec.notas.length" class="mt-4 space-y-1.5 border-t border-neutral-100 pt-4 text-sm text-neutral-600">
            <li v-for="(t, i) in rec.notas" :key="i">{{ t }}</li>
          </ul>
        </div>
        <p v-if="p.flags.includes('revisar_asesor')" class="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Un ingeniero de Racklog revisará tu caso para confirmar la mejor solución.
        </p>
        <button v-if="rec.alternativa" type="button" class="mt-4 text-sm font-medium text-brand-700 underline underline-offset-2" @click="cambiarSistema(rec.alternativa)">
          Prefiero {{ TIPOS[rec.alternativa as Sistema].nombre.toLowerCase() }}
        </button>
        <button v-else type="button" class="mt-4 text-sm font-medium text-brand-700 underline underline-offset-2" @click="p.sabe = true">
          Elegir otro sistema
        </button>
        <p class="mt-4 rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-600">Es una primera recomendación. En el paso 3 la afinamos producto por producto con tus pallets.</p>
        <FlujoAcciones texto="Seguir con mis pallets" @atras="volverPregunta" @siguiente="emit('siguiente')" />
      </section>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useProyecto, type Sistema } from '~/stores/proyecto';
import { TIPOS } from '~/lib/rack3d/planificador.js';
import { preguntasActivas, recomendar } from '~/lib/tour/reglas.js';

const emit = defineEmits<{ siguiente: [] }>();
const p = useProyecto();
if (p.sabe === null) p.sabe = false;
onMounted(() => { if (!p.pregunta && !p.sabe) marcar('tour_start', {}); });

// Respuesta tipica cuando el cliente no sabe (queda marcada para que el ejecutivo la confirme)
const TIPICO: Record<string, string> = {
  unidad: 'pallet', kg_nivel: 'medio', n_sku: 'varios', pallets_sku: '3-5', rotacion: 'media',
  salida: 'pallet', fifo: 'no', equipo: 'grua', espacio: 'justo',
};
// Equipo del tour → equipo del planificador (parametrosTecnicos.GRUAS)
const GRUA: Record<string, string> = { manual: 'manual', electrico: 'apiladora', grua: 'contrapeso', retractil: 'retractil', ninguno: 'contrapeso' };
const EQUIPOS = [
  { v: 'grua', t: 'Grúa horquilla' }, { v: 'retractil', t: 'Grúa retráctil' },
  { v: 'electrico', t: 'Apilador eléctrico' }, { v: 'manual', t: 'Apilador manual' },
];

const preguntas = computed(() => preguntasActivas(p.respuestas));
const actual = computed(() => preguntas.value[p.pregunta] ?? null);
const rec = computed(() => (p.sabe === false && p.pregunta >= preguntas.value.length ? recomendar(p.respuestas) : null));
// Empieza por las preguntas; "Ya sé lo que quiero" es el atajo a elegir el sistema
const vista = computed(() => {
  if (p.sabe) return 'elegir';
  return p.pregunta < preguntas.value.length ? 'pregunta' : 'resultado';
});

function responder(v: string, noSe = false) {
  const clave = actual.value!.clave;
  p.respuestas[clave] = v;
  const flag = `no_se:${clave}`;
  p.flags = noSe ? [...new Set([...p.flags, flag])] : p.flags.filter((f) => f !== flag);
  if (clave === 'equipo') p.bodega.grua = GRUA[v] ?? 'contrapeso';
  p.pregunta++;
  marcar('tour_step', { n: p.pregunta, pregunta: clave, no_se: noSe });
  if (p.pregunta >= preguntas.value.length) aplicarRecomendacion();
}
function volverPregunta() {
  if (p.pregunta > 0) p.pregunta--;
}
function aplicarRecomendacion() {
  const r = recomendar(p.respuestas);
  p.sistema = r.sistema as Sistema;
  p.alternativa = (r.alternativa as Sistema) ?? null;
  p.porque = r.porque;
  p.notas = r.notas;
  p.flags = [...new Set([...p.flags.filter((f) => f !== 'revisar_asesor'), ...r.flags])];
  marcar('recomendacion', { sistema: r.sistema });
}
function cambiarSistema(s: string) {
  p.sistema = s as Sistema;
}
function elegirEquipo(v: string) {
  p.respuestas.equipo = v;
  p.bodega.grua = GRUA[v];
}
function confirmarEleccion() {
  if (p.sistema !== 'AR' && !p.respuestas.equipo) elegirEquipo('grua');
  marcar('recomendacion', { sistema: p.sistema, elegido: true });
  emit('siguiente');
}
function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>
