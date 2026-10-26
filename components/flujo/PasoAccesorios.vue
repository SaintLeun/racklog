<template>
  <div class="relative left-1/2 w-[min(1152px,calc(100vw-2rem))] -translate-x-1/2">
    <!-- Mas ancho que la columna del paso: el 3D necesita espacio (al lado en escritorio, arriba en celular) -->
    <h1 class="fl-titulo">Accesorios y seguridad</h1>
    <p class="fl-bajada">Te proponemos lo que tu rack necesita para operar seguro. Puedes quitar o cambiar la cantidad, o arrastrar más al 3D.</p>
    <p v-if="estimado" class="mt-3 rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
      Cantidades estimadas: se recalculan cuando ubiques tus racks en la bodega.
    </p>

    <div class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
      <!-- 3D del rack (o la bodega) con los accesorios puestos; pegado arriba mientras se recorren las tarjetas -->
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
          <li
            v-for="a in opcionales"
            :key="a.id"
            :class="['fl-card flex flex-col gap-4 transition-shadow sm:flex-row lg:flex-col xl:flex-row', !a.incluido && 'opacity-60', resaltado === a.id && 'ring-2 ring-brand-500']"
            @mouseenter="resaltado = a.id"
            @mouseleave="resaltado = null"
            @focusin="resaltado = a.id"
          >
            <span class="relative mx-auto w-full max-w-[220px] flex-shrink-0 self-start rounded-xl bg-neutral-50 p-1.5 sm:mx-0 sm:w-40 lg:mx-auto xl:mx-0 xl:w-32">
              <FlujoDibujoAccesorio :a="a" :m="mRack" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-baseline justify-between gap-x-3">
                <p class="font-semibold text-neutral-900">{{ a.nombre }}<span v-if="a.medida" class="font-normal text-neutral-500"> · {{ a.medida }}</span><FlujoReferencial :de="REFERENCIAL[a.id] ?? []">Medidas y cantidades típicas: Racklog las confirma con su catálogo antes de cotizar.</FlujoReferencial></p>
                <span v-if="a.obligatorio" class="text-xs font-semibold uppercase tracking-wide text-amber-700">Recomendado</span>
              </div>
              <p class="mt-0.5 text-neutral-600">{{ a.paraQue }}</p>
              <p class="mt-1 text-sm text-neutral-500">{{ a.motivo }}</p>
              <!-- Baranda: un resumen legible; el desglose de módulos y ajustes, plegado -->
              <template v-if="a.resumen">
                <p class="mt-2 font-medium text-neutral-800">{{ a.resumen }}</p>
                <details v-if="a.detallePiezas" class="mt-1 text-sm text-neutral-600">
                  <summary class="cursor-pointer font-semibold text-brand-700">Ver detalle de piezas</summary>
                  <p class="mt-1">{{ a.detallePiezas }} (módulos de 6 m y una pieza de ajuste por tramo).</p>
                </details>
              </template>
              <p v-if="a.manuales" class="mt-2 text-sm text-brand-800">
                Incluye {{ numTexto(a.manuales) }} {{ a.unidad === 'u' ? (a.manuales === 1 ? 'puesta' : 'puestas') : 'm puestos' }} por ti en el 3D.
                <button type="button" class="font-semibold underline underline-offset-2 hover:text-brand-900" @click="quitarTodas(a.id)">Quitar {{ a.unidad === 'u' && a.manuales === 1 ? 'la tuya' : 'las tuyas' }}</button>
              </p>
              <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
                <!-- Interruptor: queda claro que se puede quitar y volver a poner -->
                <button type="button" role="switch" :aria-checked="a.incluido" class="flex min-h-10 items-center gap-2.5 text-sm font-medium text-neutral-800" @click="alternar(a.id)">
                  <span :class="['relative h-6 w-11 flex-shrink-0 rounded-full transition-colors', a.incluido ? 'bg-brand-600' : 'bg-neutral-300']" aria-hidden="true">
                    <span :class="['absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', a.incluido ? 'left-[22px]' : 'left-0.5']" />
                  </span>
                  {{ a.incluido ? 'Lo incluyo' : 'No lo incluyo' }}
                </button>
                <div v-if="a.incluido && a.opcionesMedida" class="flex items-center gap-2 text-sm text-neutral-700" role="radiogroup" :aria-label="`Alto de ${a.plural}`">
                  Alto
                  <button v-for="o in a.opcionesMedida" :key="o" type="button" role="radio" :aria-checked="a.alto === o" :class="['fl-chip !min-h-10 !w-auto !px-3 text-sm', a.alto === o && 'fl-chip--sel']" @click="medida(a.id, o)">{{ mmTexto(o) }}</button>
                </div>
                <label v-if="a.incluido" class="flex items-center gap-2 text-sm text-neutral-700">
                  Cantidad
                  <input :value="a.cantidad" type="number" min="0" step="1" class="form-input !h-10 !w-24 text-right" @change="cantidad(a, $event)">
                  {{ UNIDAD[a.unidad] ?? a.unidad }}
                </label>
                <!-- Se arrastra al 3D (mouse o dedo) y se pega al lugar valido mas cercano -->
                <button
                  v-if="TIPOS_MANUALES.includes(a.id)"
                  type="button"
                  class="fl-arrastrar inline-flex min-h-10 cursor-grab select-none items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50 active:cursor-grabbing"
                  :title="`Arrastra al 3D para agregar ${a.id === 'barandas' ? 'un tramo' : 'una'}`"
                  @pointerdown="arrastrar(a.id, $event)"
                >
                  <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="7" cy="5" r="1.4" /><circle cx="13" cy="5" r="1.4" /><circle cx="7" cy="10" r="1.4" /><circle cx="13" cy="10" r="1.4" /><circle cx="7" cy="15" r="1.4" /><circle cx="13" cy="15" r="1.4" /></svg>
                  Arrastrar al 3D
                </button>
              </div>
            </div>
          </li>
        </TransitionGroup>
        <!-- Accesorios que se pueden poner a mano aunque el sistema no los propuso (p. ej. baranda sin pasillo peatonal) -->
        <div v-if="faltantes.length" class="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-600">
          <span>También puedes arrastrar al 3D:</span>
          <button
            v-for="t in faltantes"
            :key="t.id"
            type="button"
            class="fl-arrastrar inline-flex min-h-9 cursor-grab select-none items-center gap-1.5 rounded-lg bg-white px-3 font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50 active:cursor-grabbing"
            @pointerdown="arrastrar(t.id, $event)"
          >{{ t.nombre }}</button>
        </div>
        <!-- Lo que va sí o sí (separador de bastidor en racks dobles): una línea informativa, sin interruptor -->
        <ul v-if="fijos.length" class="mt-3 space-y-2">
          <li v-for="a in fijos" :key="a.id" class="flex items-start gap-3 rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
            <span class="mt-0.5 text-brand-600" aria-hidden="true">✓</span>
            <span><b class="text-neutral-900">Incluido: {{ numTexto(a.cantidad) }} {{ a.cantidad === 1 ? a.nombre.toLowerCase() : a.plural }}</b> de {{ mmTexto(RACK.separadorBastidor.valor) }} ({{ a.medida }}). {{ a.motivo }}</span>
          </li>
        </ul>
        <p v-if="!lista.length" class="mt-6 text-neutral-600">Tu rack no necesita accesorios adicionales.</p>
        <p class="mt-4 text-sm text-neutral-500">Medidas y módulos típicos: ingeniería Racklog los valida con tu caso antes de cotizar.</p>
      </div>
    </div>

    <FlujoAcciones texto="Revisar mi diseño" @atras="emit('atras')" @siguiente="emit('siguiente')" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

// La unidad en palabras ('u' no se entiende)
const UNIDAD: Record<string, string> = { u: 'unidades', m: 'metros' };
import { useProyecto } from '~/stores/proyecto';
import { proponerAccesorios, aplicarAjustes, mmTexto, numTexto, TIPOS_MANUALES, PARAMETROS_ACCESORIOS as PA } from '~/lib/rack3d/accesorios.js';
import { RACK } from '~/lib/rack3d/parametrosTecnicos.js';
import { resultadoModelo, ubicarModelos } from '~/lib/flujo/calculos.js';
import { medidasRack, rectangulo } from '~/lib/rack3d/planificador.js';
import { focoDiseño } from '~/lib/flujo/perfiles.js';

// Parametros sin confirmar que usa cada accesorio (docs/VALORES-POR-CONFIRMAR.md): con alguno pendiente sale "referencial"
const REFERENCIAL: Record<string, unknown[]> = {
  canilleras: [PA.canillera, PA.cabeceraLibre],
  proteccionBastidor: [PA.proteccionBastidor, PA.arcoBastidor, PA.cabeceraLibre],
  barandas: [PA.moduloBaranda, PA.ajusteBaranda, PA.aberturaBaranda],
  separadores: [PA.separadoresPorMarco],
  topes: [PA.toposPorPosicion, PA.holguraTopes],
  mallaAnticaida: [PA.mallaDistancia],
};

const emit = defineEmits<{ siguiente: []; atras: [] }>();
const p = useProyecto();
if (!Array.isArray(p.accesorios.manuales)) p.accesorios.manuales = [];

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
  const M = 3;
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
const NOMBRES: Record<string, string> = { canilleras: 'Canillera', proteccionBastidor: 'Protección de bastidor', barandas: 'Baranda' };
const faltantes = computed(() => TIPOS_MANUALES.filter((id) => !lista.value.some((a) => a.id === id)).map((id) => ({ id, nombre: NOMBRES[id] })));

// Accesorio resaltado en el 3D (al pasar sobre su tarjeta o su ficha de la paleta)
const resaltado = ref<string | null>(null);
const visorRef = ref<{ iniciarArrastre(tipo: string, e: PointerEvent): void } | null>(null);
function arrastrar(tipo: string, e: PointerEvent) {
  resaltado.value = tipo;
  visorRef.value?.iniciarArrastre(tipo, e);
}

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
.fl-arrastrar { touch-action: none; }
</style>
