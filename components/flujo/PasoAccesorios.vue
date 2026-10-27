<template>
  <!-- Primero la pregunta (dueño 27-10): si no quiere accesorios de seguridad, pasa directo a Revisa -->
  <div v-if="enPregunta">
    <h1 class="fl-titulo">¿Deseas agregar accesorios de seguridad a tu cotización?</h1>
    <p class="fl-bajada">Protegen tus racks de los golpes de la grúa. Tú decides si van en la cotización.</p>
    <div class="mt-5 grid gap-3 sm:grid-cols-2">
      <button type="button" :class="['fl-opcion !p-5', p.accesorios.desea === true && 'fl-opcion--sel']" @click="responder(true)">
        <span class="text-lg font-semibold text-neutral-900">Sí, agregar</span>
        <span v-if="resumenSeguridad" class="text-sm text-neutral-600">Para tu bodega: {{ resumenSeguridad }}. Los ves en el 3D y quitas lo que no quieras.</span>
        <span v-else class="text-sm text-neutral-600">Los ves en el 3D y quitas lo que no quieras.</span>
      </button>
      <button type="button" :class="['fl-opcion !p-5', p.accesorios.desea === false && 'fl-opcion--sel']" @click="responder(false)">
        <span class="text-lg font-semibold text-neutral-900">No, cotizar sin accesorios</span>
        <span class="text-sm text-neutral-600">Pasas directo a revisar tu diseño. Si cambias de idea, vuelves a este paso.</span>
      </button>
    </div>
    <!-- Solo "Atrás": la respuesta es el botón para avanzar -->
    <div class="fl-acciones" role="group" aria-label="Avanzar en el diseño">
      <div class="container-page flex items-center py-2.5">
        <button type="button" class="fl-btn-sec" @click="emit('atras')">Atrás</button>
      </div>
    </div>
  </div>

  <div v-else class="w-[min(1152px,calc(100vw-2rem))] ml-[calc(50%-min(576px,50vw-1rem))]">
    <!-- Centrado con margen y no con transform: un transform ancla la barra fija de Siguiente a este bloque -->
    <!-- Mas ancho que la columna del paso: el 3D necesita espacio (al lado en escritorio, arriba en celular) -->
    <h1 class="fl-titulo">Accesorios y seguridad</h1>
    <p class="fl-bajada">Lo que tu rack necesita para operar seguro. Quita lo que no quieras o arrastra más al 3D.</p>
    <p v-if="estimado" class="mt-3 rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
      Cantidades estimadas: se recalculan cuando ubiques tus racks en la bodega.
    </p>

    <div class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
      <!-- 3D del rack (o la bodega) con los accesorios puestos; pegado arriba mientras se recorren las tarjetas.
           Su paleta es la unica forma de arrastrar (antes cada tarjeta repetia su boton "Arrastrar al 3D") -->
      <div
        class="sticky z-20 -mx-1 h-[46vh] min-h-[300px] overflow-hidden rounded-2xl bg-[#f6f7f9] shadow-sm ring-1 ring-black/5 lg:mx-0 lg:h-[calc(100svh-21rem)] lg:min-h-[420px]"
        :style="{ top: `${arriba}px` }"
      >
        <Visor3D
          ref="visorRef"
          :bodega="bodegaBase"
          :racks="racksBase"
          :accesorios="p.accesorios"
          :pallets="p.pallets"
          :foco="foco"
          :resaltado="resaltado"
          paleta
          :etiqueta="estimado ? 'Vista 3D de tu rack con sus accesorios' : 'Vista 3D de tu bodega con sus accesorios'"
          @accesorio="agregar"
          @quitar-accesorio="quitarManual"
          @resaltar="resaltado = $event"
        />
      </div>

      <div class="min-w-0">
        <TransitionGroup tag="ul" name="fl-lista" class="space-y-3">
          <!-- Tarjeta corta: nombre, cuánto y de qué medida, dónde va. El resto en "Ver más" -->
          <li
            v-for="a in opcionales"
            :key="a.id"
            :class="['fl-card flex gap-3 transition-shadow', !a.incluido && 'opacity-60', resaltado === a.id && 'ring-2 ring-brand-500']"
            @mouseenter="resaltado = a.id"
            @mouseleave="resaltado = null"
            @focusin="resaltado = a.id"
          >
            <span class="w-24 flex-shrink-0 self-start rounded-xl bg-neutral-50 p-1 sm:w-28">
              <FlujoDibujoAccesorio :a="a" :m="mRack" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <p class="font-semibold leading-snug text-neutral-900">{{ a.nombre }}</p>
                <!-- Interruptor: queda claro que se puede quitar y volver a poner -->
                <button type="button" role="switch" :aria-checked="a.incluido" :aria-label="`Incluir ${a.plural}`" class="-mr-1 -mt-1 flex min-h-10 flex-shrink-0 items-center gap-2 px-1 text-sm font-medium text-neutral-700" @click="alternar(a.id)">
                  <span class="hidden sm:inline">{{ a.incluido ? 'Incluido' : 'Sin incluir' }}</span>
                  <span :class="['relative h-6 w-11 flex-shrink-0 rounded-full transition-colors', a.incluido ? 'bg-brand-600' : 'bg-neutral-300']" aria-hidden="true">
                    <span :class="['absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', a.incluido ? 'left-[22px]' : 'left-0.5']" />
                  </span>
                </button>
              </div>
              <p class="mt-0.5 text-neutral-800">
                <b>{{ numTexto(a.cantidad) }} {{ unidadTexto(a) }}</b><span v-if="a.medida" class="text-neutral-600"> · {{ a.medida }}</span>
              </p>
              <p v-if="a.donde" class="text-sm text-neutral-600">{{ a.donde }}</p>
              <p v-if="a.manuales" class="mt-1 text-sm text-brand-800">
                {{ numTexto(a.manuales) }} {{ a.unidad === 'u' ? (a.manuales === 1 ? 'puesta' : 'puestas') : 'm puestos' }} por ti.
                <button type="button" class="font-semibold underline underline-offset-2 hover:text-brand-900" @click="quitarTodas(a.id)">Quitar</button>
              </p>
              <details class="fl-mas-acc mt-1 text-sm text-neutral-600">
                <summary class="inline-flex min-h-9 cursor-pointer items-center font-semibold text-brand-700">Ver más</summary>
                <div class="space-y-2 pb-1">
                  <p>{{ a.paraQue }}</p>
                  <p class="text-neutral-500">{{ a.motivo }}</p>
                  <p v-if="a.detallePiezas">Piezas: {{ a.detallePiezas }} (módulos de 6 m y una pieza de ajuste por tramo).</p>
                  <div v-if="a.incluido" class="flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-700">
                    <div v-if="a.opcionesMedida" class="flex items-center gap-2" role="radiogroup" :aria-label="`Alto de ${a.plural}`">
                      Alto
                      <button v-for="o in a.opcionesMedida" :key="o" type="button" role="radio" :aria-checked="a.alto === o" :class="['fl-chip !min-h-10 !w-auto !px-3 text-sm', a.alto === o && 'fl-chip--sel']" @click="medida(a.id, o)">{{ mmTexto(o) }}</button>
                    </div>
                    <label class="flex items-center gap-2">
                      Cantidad
                      <input :value="a.cantidad" type="number" min="0" step="1" class="form-input !h-10 !w-24 text-right" @change="cantidad(a, $event)">
                      {{ unidadTexto(a) }}
                    </label>
                  </div>
                </div>
              </details>
            </div>
          </li>
        </TransitionGroup>
        <!-- Lo que va sí o sí (separador de bastidor en racks dobles): una línea informativa, sin interruptor -->
        <ul v-if="fijos.length" class="mt-3 space-y-2">
          <li v-for="a in fijos" :key="a.id" class="flex items-start gap-3 rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
            <span class="mt-0.5 text-brand-600" aria-hidden="true">✓</span>
            <span><b class="text-neutral-900">Incluido: {{ numTexto(a.cantidad) }} {{ a.cantidad === 1 ? a.nombre.toLowerCase() : a.plural }}</b> de {{ mmTexto(RACK.separadorBastidor.valor) }}. Van siempre en racks dobles.</span>
          </li>
        </ul>
        <p v-if="!lista.length" class="mt-6 text-neutral-600">Tu rack no necesita accesorios adicionales.</p>
        <p class="mt-4 text-sm text-neutral-500">Medidas y cantidades típicas: ingeniería Racklog las valida con tu caso antes de cotizar.</p>
      </div>
    </div>

    <FlujoAcciones texto="Revisar mi diseño" @atras="volverPregunta" @siguiente="emit('siguiente')" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

import { useProyecto } from '~/stores/proyecto';
import { proponerAccesorios, aplicarAjustes, mmTexto, numTexto, ACCESORIOS_SEGURIDAD } from '~/lib/rack3d/accesorios.js';
import { RACK } from '~/lib/rack3d/parametrosTecnicos.js';
import { resultadoModelo, ubicarModelos } from '~/lib/flujo/calculos.js';
import { medidasRack, rectangulo } from '~/lib/rack3d/planificador.js';
import { focoDiseño } from '~/lib/flujo/perfiles.js';
import { gruaDe } from '~/lib/rack3d/pasillos.js';

// La unidad en palabras ('u' no se entiende)
const unidadTexto = (a: any) => (a.unidad === 'u' ? (a.cantidad === 1 ? 'unidad' : 'unidades') : a.unidad === 'm' ? 'metros' : a.unidad);

const emit = defineEmits<{ siguiente: []; atras: [] }>();
const p = useProyecto();
if (!Array.isArray(p.accesorios.manuales)) p.accesorios.manuales = [];

// ─── Pregunta previa: ¿accesorios de seguridad sí o no? ───
// Se muestra mientras no haya dicho que sí (también al volver desde Revisa habiendo dicho que no).
// No: se quitan todos los de seguridad (los que van con el rack, como separadores y planos de carga, siguen) y
// se guarda lo que tenía quitado para devolverlo si después dice que sí
const enPregunta = ref(p.accesorios.desea !== true);
function responder(si: boolean) {
  const acc = p.accesorios;
  if (si) {
    if (acc.desea === false && Array.isArray(acc.previos)) acc.quitados = acc.previos;
    acc.previos = null;
    acc.desea = true;
    enPregunta.value = false;
    window.scrollTo({ top: 0 });
  } else {
    if (acc.desea !== false) acc.previos = [...acc.quitados];
    acc.quitados = [...new Set([...acc.quitados, ...ACCESORIOS_SEGURIDAD])];
    acc.desea = false;
    emit('siguiente');
  }
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ??= []).push({ event: 'accesorios_respuesta', event_category: 'Planificador', desea: si });
}
function volverPregunta() {
  enPregunta.value = true;
  window.scrollTo({ top: 0 });
}

// Sin racks ubicados todavia: se arman los del paso 3 en una bodega a su medida (3 m libres alrededor, las
// cabeceras quedan libres como suele pasar) y eso se ve en el 3D
const estimado = computed(() => !p.racks.length);
const estimacion = computed(() => {
  if (p.racks.length) return null;
  const amplia = { ...p.bodega, ancho: 200, largo: 200, forma: null, elementos: [] };
  const cuerpos = Object.fromEntries(p.modelos.map((m) => [m.id, resultadoModelo(m, { pallets: p.pallets, cajas: p.cajas, grua: p.bodega.grua, ocupacion: p.bodega.ocupacion }).modulos]));
  let k = 0;
  const racks = ubicarModelos(amplia, p.modelos, cuerpos, { pallets: p.pallets, cajas: p.cajas, nuevoId: () => `e${k++}` }).racks as any[];
  if (!racks.length) return { bodega: { ...amplia, ancho: 12, largo: 10 }, racks };
  const q = racks.map((r) => rectangulo(r));
  const x0 = Math.min(...q.map((c) => c.x0)), y0 = Math.min(...q.map((c) => c.y0));
  const x1 = Math.max(...q.map((c) => c.x0 + c.ancho)), y1 = Math.max(...q.map((c) => c.y0 + c.alto));
  // Margen del ancho de pasillo de la grua: si no, las cabeceras no la dejan pasar y no llevan proteccion
  const M = Math.max(3, gruaDe(p.bodega).pasillo);
  return {
    bodega: { ...amplia, ancho: +(x1 - x0 + 2 * M).toFixed(2), largo: +(y1 - y0 + 2 * M).toFixed(2) },
    racks: racks.map((r) => ({ ...r, x: +(r.x - x0 + M).toFixed(3), y: +(r.y - y0 + M).toFixed(3) })),
  };
});
const racksBase = computed(() => (estimacion.value ? estimacion.value.racks : p.racks) as any[]);
const bodegaBase = computed(() => (estimacion.value ? estimacion.value.bodega : p.bodega) as any);
// Estimado: la camara mira los racks (con 1,5 m alrededor para ver cabeceras y pasillo)
const foco = computed(() => {
  if (!estimacion.value) return focoDiseño(p.racks, p.bodega) as any;
  const q = estimacion.value.racks.map((r: any) => rectangulo(r));
  if (!q.length) return null;
  const alto = Math.max(...estimacion.value.racks.map((r: any) => Number(medidasRack(r).alto) || 3));
  return { x0: Math.min(...q.map((c) => c.x0)) - 1.5, y0: Math.min(...q.map((c) => c.y0)) - 1.5, x1: Math.max(...q.map((c) => c.x0 + c.ancho)) + 1.5, y1: Math.max(...q.map((c) => c.y0 + c.alto)) + 1.5, alto };
});
// Medidas del rack que se dibujan en los accesorios (el primer selectivo nuevo)
const mRack = computed(() => { const r = racksBase.value.find((x: any) => x.tipo === 'RS' && !x.existente) ?? racksBase.value[0]; return r ? medidasRack(r) as any : null; });
const lista = computed(() => aplicarAjustes(proponerAccesorios({ bodega: bodegaBase.value, racks: racksBase.value, pallets: p.pallets }), p.accesorios) as any[]);
const opcionales = computed(() => lista.value.filter((a) => !a.fijo));
const fijos = computed(() => lista.value.filter((a) => a.fijo));
// Lo que propone el sistema en seguridad, para la pregunta: "48 canilleras y 6 protecciones de bastidor"
const resumenSeguridad = computed(() => {
  const l = (proponerAccesorios({ bodega: bodegaBase.value, racks: racksBase.value, pallets: p.pallets }) as any[])
    .filter((a) => ACCESORIOS_SEGURIDAD.includes(a.id) && a.cantidad > 0)
    .map((a) => (a.unidad === 'u' ? `${numTexto(a.cantidad)} ${a.cantidad === 1 ? a.nombre.toLowerCase() : a.plural}` : `${numTexto(a.cantidad)} ${a.unidad} de ${a.plural}`));
  return l.length > 1 ? `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}` : l[0] ?? '';
});

// Accesorio resaltado en el 3D (al pasar sobre su tarjeta o su ficha de la paleta)
const resaltado = ref<string | null>(null);
const visorRef = ref<{ iniciarArrastre(tipo: string, e: PointerEvent): void } | null>(null);

function alternar(id: string) {
  const q = p.accesorios.quitados;
  p.accesorios.quitados = q.includes(id) ? q.filter((x) => x !== id) : [...q, id];
}
function medida(id: string, v: number) {
  p.accesorios.medidas = { ...(p.accesorios.medidas ?? {}), [id]: v };
}
// La cantidad que se escribe incluye las puestas a mano: se guarda solo lo demas
function cantidad(a: any, e: Event) {
  const v = Math.max(0, Math.round(Number((e.target as HTMLInputElement).value) || 0));
  p.accesorios.cantidades = { ...p.accesorios.cantidades, [a.id]: Math.max(0, v - (a.manuales || 0)) };
}
// Puesto a mano en el 3D: se guarda y, si ese accesorio estaba quitado, vuelve a incluirse
function agregar(m: Record<string, any>) {
  p.accesorios.manuales = [...(p.accesorios.manuales ?? []), m];
  if (p.accesorios.quitados.includes(m.tipo)) p.accesorios.quitados = p.accesorios.quitados.filter((x) => x !== m.tipo);
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ??= []).push({ event: 'accesorio_3d', event_category: 'Planificador', tipo: m.tipo });
}
function quitarManual(id: string) {
  p.accesorios.manuales = (p.accesorios.manuales ?? []).filter((m: any) => m.id !== id);
}
function quitarTodas(tipo: string) {
  p.accesorios.manuales = (p.accesorios.manuales ?? []).filter((m: any) => m.tipo !== tipo);
}

// Celular: el 3D queda pegado bajo la barra de progreso (que tambien es fija) mientras se bajan las tarjetas
const arriba = ref(140);
function medirArriba() {
  const barras = [...document.querySelectorAll('header.sticky, .sticky.top-16')] as HTMLElement[];
  const b = Math.max(0, ...barras.map((x) => x.getBoundingClientRect().bottom));
  arriba.value = Math.round(b + 8);
}
onMounted(() => { medirArriba(); window.addEventListener('resize', medirArriba); });
onBeforeUnmount(() => window.removeEventListener('resize', medirArriba));
</script>

<style scoped>
.fl-mas-acc > summary { list-style: none; }
.fl-mas-acc > summary::-webkit-details-marker { display: none; }
.fl-mas-acc[open] > summary { margin-bottom: .25rem; }
</style>
