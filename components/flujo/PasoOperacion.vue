<template>
  <div>
    <Transition name="fl-sub" mode="out-in">
      <!-- Entrada: el camino "no sé" es el principal y va primero -->
      <section v-if="vista === 'inicio'" key="inicio">
        <h1 class="fl-titulo">¿Sabes qué rack necesitas?</h1>
        <p class="mt-2 text-neutral-600">Si no lo sabes, no importa: te hacemos 8 preguntas simples sobre tu bodega y te decimos cuál conviene.</p>
        <p class="mt-2 text-sm text-neutral-500">{{ MENSAJE_INICIO }}</p>
        <div class="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" class="fl-opcion fl-opcion--sel !p-5 text-left" @click="empezar(false)">
            <span class="block text-lg font-bold text-neutral-900">No, ayúdenme</span>
            <span class="mt-1 block text-neutral-600">Respondes 8 preguntas (unos 2 minutos) y te recomendamos el sistema.</span>
          </button>
          <button type="button" class="fl-opcion !p-5 text-left" @click="empezar(true)">
            <span class="block text-lg font-bold text-neutral-900">Sí, ya sé</span>
            <span class="mt-1 block text-neutral-600">Eliges entre rack selectivo, drive-in o ángulo ranurado.</span>
          </button>
        </div>
      </section>

      <!-- Si sabe: elige sistema y equipo -->
      <section v-else-if="vista === 'elegir'" key="elegir">
        <h1 class="fl-titulo">¿Qué rack quieres?</h1>
        <!-- Al elegir uno, los otros se apagan y al lado va cómo funciona el elegido (revisión 27-10) -->
        <div class="mt-6 grid gap-4 lg:grid-cols-[1fr_17rem]">
          <div class="grid gap-3 sm:grid-cols-3">
            <button
              v-for="(t, k) in TIPOS" :key="k" type="button"
              :class="['fl-opcion relative !p-0 overflow-hidden transition', p.sistema === k ? 'fl-opcion--sel' : p.sistema && 'opacity-45 grayscale hover:opacity-80 hover:grayscale-0']"
              :aria-pressed="p.sistema === k"
              @click="p.sistema = k as Sistema"
            >
              <img :src="t.imagen" :alt="''" width="400" height="300" class="aspect-[4/3] w-full bg-neutral-100 object-cover" loading="lazy" @error="sinImagen">
              <span v-if="p.sistema === k" class="absolute right-2 top-2 inline-flex h-7 items-center gap-1 rounded-full bg-brand-600 px-2.5 text-xs font-bold text-white shadow" aria-hidden="true">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>Elegido
              </span>
              <span class="block px-4 pb-4 pt-3">
                <span class="block font-semibold text-neutral-900">{{ t.nombre }}</span>
                <span class="mt-1 block text-sm text-neutral-600">{{ t.asesoria.sirve }}</span>
              </span>
            </button>
          </div>
          <aside v-if="p.sistema" class="rounded-2xl bg-white p-4 ring-1 ring-brand-200" aria-live="polite">
            <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">Cómo funciona</p>
            <p class="mt-1 font-bold text-neutral-900">{{ TIPOS[p.sistema].nombre }}</p>
            <ul class="mt-2 space-y-1.5 text-sm text-neutral-700">
              <li v-for="(t, i) in COMO_FUNCIONA[p.sistema]" :key="i" class="flex gap-2"><span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" aria-hidden="true" />{{ t }}</li>
            </ul>
          </aside>
          <p v-else class="hidden self-center text-sm text-neutral-500 lg:block">Toca uno y te contamos cómo funciona.</p>
        </div>
        <fieldset v-if="p.sistema && p.sistema !== 'AR'" class="mt-8">
          <legend class="fl-pregunta">¿Con qué equipo mueves los pallets?</legend>
          <p class="text-sm text-neutral-600">{{ PORQUE.grua }} Toca el que se parece al tuyo.</p>
          <!-- Por foto (prompt de conversión §D): se reconoce aunque no se sepa el nombre -->
          <FlujoFotoEquipo
            class="mt-3" :opciones="FOTOS" :valor="p.respuestas.equipo ?? null" :no-se="p.flags.includes('no_se:equipo')" tipico="grua"
            @elegir="(v, noSe) => elegirEquipo(v, noSe)"
          />
        </fieldset>
        <p v-if="diSinEquipo" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-900">
          El drive-in no se puede usar con tu equipo: {{ diSinEquipo }}. Necesitas grúa horquilla, retráctil o apilador eléctrico; o elige rack selectivo.
        </p>
        <FlujoAcciones :atras="!p.sistema" :deshabilitado="!p.sistema || !!diSinEquipo" :motivo="diSinEquipo ? 'El drive-in necesita otro equipo.' : 'Elige un sistema para seguir.'" @atras="p.sabe = null" @siguiente="confirmarEleccion" />
      </section>

      <!-- Preguntas, una por pantalla -->
      <section v-else-if="vista === 'pregunta' && actual" :key="`q-${actual.clave}`" class="grid gap-6 lg:grid-cols-[1fr_minmax(280px,40%)]">
        <!-- Lo que se va perfilando con sus respuestas: chico y recién desde la pregunta 4, para que la
             pregunta quede arriba en el celular (abajo de las opciones; al lado en escritorio) -->
        <aside v-if="respondidas >= 3" class="order-last">
          <div class="fl-card flex items-center gap-3 !p-2.5 lg:block lg:!p-0 lg:overflow-hidden">
            <img :src="TIPOS[previa].imagen" alt="" width="400" height="300" class="h-16 w-20 flex-shrink-0 rounded-lg bg-neutral-100 object-cover lg:aspect-[4/3] lg:h-auto lg:w-full lg:rounded-none" loading="lazy" @error="sinImagen">
            <div class="min-w-0 lg:p-4">
              <p class="text-xs font-semibold uppercase tracking-wider text-neutral-500">Con lo que llevas</p>
              <p class="font-bold text-neutral-900 lg:text-lg">{{ TIPOS[previa].nombre }}</p>
              <p class="hidden text-sm text-neutral-600 lg:block">{{ TIPOS[previa].asesoria.sirve }}</p>
            </div>
          </div>
        </aside>
        <div>
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-medium text-neutral-500">Pregunta {{ p.pregunta + 1 }} de {{ preguntas.length }}</p>
          <button type="button" class="text-sm font-medium text-brand-700 underline underline-offset-2" @click="p.sabe = true">Ya sé qué rack quiero</button>
        </div>
        <h1 class="fl-titulo mt-1">{{ actual.texto }}</h1>
        <p v-if="actual.clave === 'equipo'" class="fl-bajada">{{ PORQUE.grua }} Toca el que se parece al tuyo.</p>
        <FlujoFotoEquipo
          v-if="actual.clave === 'equipo'" class="mt-5" :opciones="FOTOS" :valor="p.respuestas.equipo ?? null"
          :no-se="p.flags.includes('no_se:equipo')" tipico="grua" @elegir="(v, noSe) => responder(v, noSe)"
        />
        <button v-if="actual.clave === 'equipo'" type="button" :class="['fl-chip mt-2 !justify-start !text-left', p.respuestas.equipo === 'ninguno' && 'fl-chip--sel']" @click="responder('ninguno')">Todavía no tengo equipo</button>
        <div v-else class="mt-6 grid gap-2">
          <button
            v-for="o in actual.opciones" :key="o.v" type="button"
            :class="['fl-chip !justify-start !text-left', p.respuestas[actual.clave] === o.v && 'fl-chip--sel']"
            :aria-pressed="p.respuestas[actual.clave] === o.v"
            @click="responder(o.v)"
          >{{ o.t }}</button>
          <button type="button" class="fl-chip !justify-start !text-left text-neutral-500" @click="responder(TIPICO[actual.clave], true)">
            No lo sé, usen lo típico
          </button>
        </div>
        <details class="fl-tip mt-5">
          <summary>¿Por qué te preguntamos esto?</summary>
          <p>{{ actual.tip }}</p>
        </details>
        <FlujoAcciones :texto="'Saltar'" @atras="p.pregunta ? volverPregunta() : (p.sabe = null)" @siguiente="responder(TIPICO[actual.clave], true)" />
        </div>
      </section>

      <!-- Recomendacion -->
      <section v-else-if="vista === 'resultado' && rec" key="resultado">
        <p class="text-sm font-semibold uppercase tracking-wider text-brand-700">Te recomendamos</p>
        <h1 class="fl-titulo mt-1">{{ TIPOS[p.sistema!].nombre }}</h1>
        <div class="fl-card mt-5">
          <img :src="TIPOS[p.sistema!].imagen" alt="" width="800" height="350" class="-mx-5 -mt-5 mb-4 aspect-[16/7] w-[calc(100%+2.5rem)] max-w-none rounded-t-2xl bg-neutral-100 object-cover" loading="lazy" @error="sinImagen">
          <p v-if="supuestos.length >= MUCHOS_NO_SE" class="font-medium text-neutral-900">
            Como no sabías varias respuestas, partimos con lo más común en bodegas como la tuya: es el sistema más versátil y te deja sacar cualquier pallet. Lo afinamos con tus pallets en el paso 3.
          </p>
          <ul v-else class="space-y-2 text-neutral-700">
            <li v-for="(t, i) in rec.porque" :key="i" class="flex gap-2"><span class="text-brand-600" aria-hidden="true">✓</span>{{ t }}</li>
          </ul>
          <div v-if="supuestos.length" class="mt-4 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-700">
            <p class="font-medium">Lo que supusimos (tu ejecutivo lo confirma contigo):</p>
            <ul class="mt-1 list-disc pl-5"><li v-for="t in supuestos" :key="t">{{ t }}</li></ul>
          </div>
          <ul v-if="rec.notas.length" class="mt-4 space-y-1.5 border-t border-neutral-100 pt-4 text-sm text-neutral-600">
            <li v-for="(t, i) in rec.notas" :key="i">{{ t }}</li>
          </ul>
        </div>
        <button v-if="rec.alternativa" type="button" class="mt-4 text-sm font-medium text-brand-700 underline underline-offset-2" @click="cambiarSistema(rec.alternativa)">
          Prefiero {{ TIPOS[rec.alternativa as Sistema].nombre.toLowerCase() }}
        </button>
        <button v-else type="button" class="mt-4 text-sm font-medium text-brand-700 underline underline-offset-2" @click="p.sabe = true">
          Elegir otro sistema
        </button>
        <!-- Una sola mención al ingeniero, al final -->
        <p class="mt-4 rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-600">Es una primera recomendación: en el paso 3 la afinamos producto por producto con tus pallets{{ p.flags.includes('revisar_asesor') ? ' y un ingeniero de Racklog revisa tu caso antes de cotizar' : '' }}.</p>
        <FlujoAcciones texto="Seguir con mis pallets" @atras="volverPregunta" @siguiente="emit('siguiente')" />
      </section>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useProyecto, type Sistema } from '~/stores/proyecto';
import { TIPOS, gruaDriveIn } from '~/lib/rack3d/planificador.js';
import { preguntasActivas, recomendar } from '~/lib/tour/reglas.js';
import { MENSAJE_INICIO, PORQUE } from '~/lib/flujo/conversion.js';

const emit = defineEmits<{ siguiente: [] }>();
const p = useProyecto();
onMounted(() => { if (p.sabe === null) marcar('tour_start', {}); });
// Si una foto no carga queda el fondo gris del mismo tamaño (nunca un ícono roto ni un salto)
function sinImagen(e: Event) {
  const img = e.target as HTMLImageElement;
  if (!img.src.startsWith('data:')) img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
}

function empezar(sabe: boolean) {
  p.sabe = sabe;
  marcar('tour_entrada', { sabe });
}

// Respuesta tipica cuando el cliente no sabe (queda marcada para que el ejecutivo la confirme)
const TIPICO: Record<string, string> = {
  unidad: 'pallet', kg_nivel: 'medio', n_sku: 'varios', pallets_sku: '3-5', rotacion: 'media',
  salida: 'pallet', fifo: 'no', equipo: 'grua', espacio: 'justo',
};
// Equipo del tour → equipo del planificador (parametrosTecnicos.GRUAS)
const GRUA: Record<string, string> = { manual: 'manual', electrico: 'apiladora', grua: 'contrapeso', retractil: 'retractil', ninguno: 'contrapeso' };

const preguntas = computed(() => preguntasActivas(p.respuestas));
// Respuestas de verdad (no "No sé") y lo que supusimos por cada "No sé", en palabras del cliente
const MUCHOS_NO_SE = 4;
const noSe = computed(() => p.flags.filter((f) => f.startsWith('no_se:')).map((f) => f.slice(6)));
const respondidas = computed(() => Object.keys(p.respuestas).filter((k) => !noSe.value.includes(k)).length);
const supuestos = computed(() => preguntas.value
  .filter((q: any) => noSe.value.includes(q.clave))
  .map((q: any) => {
    const o = q.opciones.find((x: any) => x.v === p.respuestas[q.clave]);
    return o ? `${q.corta ?? q.texto.replace(/[¿?]/g, '')}: ${o.t.toLowerCase()}` : null;
  })
  .filter(Boolean) as string[]);
// Drive-in con un equipo que no entra a las calles (apilador manual, transpaleta): se bloquea con su motivo
const diSinEquipo = computed(() => { const g = gruaDriveIn({ grua: p.bodega.grua }); return p.sistema === 'DI' && !g.puede ? g.motivo : null; });
const actual = computed(() => preguntas.value[p.pregunta] ?? null);
// Sistema que se va perfilando con las respuestas que lleva (cambia al instante)
const previa = computed(() => (recomendar({ ...TIPICO, ...p.respuestas }).sistema as Sistema));
const rec = computed(() => (p.sabe === false && p.pregunta >= preguntas.value.length ? recomendar(p.respuestas) : null));
// Empieza por las preguntas; "Ya sé lo que quiero" es el atajo a elegir el sistema
const vista = computed(() => {
  // Con un producto ya elegido (desde la ficha del producto o al volver) no tiene lógica el "No, ayúdenme"
  if (p.sabe === null) return p.sistema ? 'elegir' : 'inicio';
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
function elegirEquipo(v: string, noSe = false) {
  p.respuestas.equipo = v;
  p.bodega.grua = GRUA[v];
  p.flags = noSe ? [...new Set([...p.flags, 'no_se:equipo'])] : p.flags.filter((f) => f !== 'no_se:equipo');
}
// Leyenda corta del rack elegido (al lado de las tarjetas)
const COMO_FUNCIONA: Record<Sistema, string[]> = {
  RS: [
    'Cada pallet tiene su lugar y la grúa llega directo a cualquiera, sin mover otros.',
    'Sirve para muchos productos distintos y para pedidos que salen todos los días.',
    'Va en filas simples contra el muro o dobles espalda con espalda, con un pasillo para la grúa.',
  ],
  DI: [
    'La grúa entra a calles dentro del rack y deja los pallets uno detrás de otro.',
    'Guarda más pallets en el mismo piso porque casi no tiene pasillos.',
    'El último que entra es el primero que sale: va un producto por calle.',
  ],
  AR: [
    'Estantes de ángulo perforado con bandejas, para cajas y productos que se sacan a mano.',
    'Las bandejas se suben o bajan cada 2 cm, a la medida de tus cajas.',
    'No necesita grúa: se trabaja a la altura de la mano.',
  ],
};
// Los equipos por foto, con el valor del tour (respuestas.equipo)
const FOTOS = [
  { v: 'grua', t: 'Grúa horquilla', d: 'contrapeso, a gas o eléctrica', dibujo: 'contrapeso', foto: 'contrapeso' },
  { v: 'retractil', t: 'Grúa retráctil', d: 'el mástil avanza; pasillo angosto', dibujo: 'retractil', foto: 'retractil' },
  { v: 'electrico', t: 'Apilador eléctrico', d: 'se maneja caminando', dibujo: 'apiladora', foto: 'apiladora' },
  { v: 'manual', t: 'Apilador manual', d: 'se levanta bombeando', dibujo: 'manual', foto: 'manual' },
];
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
