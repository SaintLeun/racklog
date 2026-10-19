<template>
  <div>
    <section class="page-hero">
      <div class="container-page">
        <div class="max-w-3xl">
          <span class="eyebrow bg-white/5 text-brand-300 ring-white/10">Gratis y sin registro</span>
          <h1 class="page-hero__title mt-5">
            Planificador de <span class="text-brand-500">bodega</span>
          </h1>
          <p class="page-hero__lead">
            Indica las medidas de tu bodega, agrega racks y míralos en 3D. Cuando termines, pide tu cotización y un ejecutivo revisa tu diseño.
          </p>
        </div>
      </div>
    </section>

    <div class="border-b border-neutral-200">
      <div class="container-page">
        <Breadcrumbs :breadcrumbs="[{ label: 'Planificador', href: '/planificador' }]" />
      </div>
    </div>

    <section class="py-8 sm:py-10">
      <div class="container-page">
        <div class="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <!-- Panel -->
          <aside class="space-y-5 lg:order-1">
            <!-- 1. Bodega -->
            <div :class="['card p-5 transition', resaltar(0)]">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-600">1. Tu bodega</h2>
              <div role="group" aria-label="Forma de la bodega" class="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
                <button
                  v-for="op in [{ v: false, t: 'Rectangular' }, { v: true, t: 'Forma libre' }]" :key="op.t"
                  type="button" :aria-pressed="formaLibre === op.v"
                  :class="['h-10 rounded-lg text-sm font-semibold transition', formaLibre === op.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600 hover:text-neutral-900']"
                  @click="cambiarForma(op.v)"
                >{{ op.t }}</button>
              </div>
              <!-- Forma libre ya cerrada: las medidas reales del contorno (las mismas que van en la cotizacion) -->
              <dl v-if="bodega.forma && !dibujando" class="mt-4 grid grid-cols-2 gap-3">
                <div class="rounded-xl bg-neutral-50 px-3 py-2 ring-1 ring-neutral-200">
                  <dt class="text-xs font-medium text-neutral-500">Ancho total</dt>
                  <dd class="text-lg font-semibold tabular-nums text-neutral-900">{{ medidasContorno.ancho.toLocaleString('es-CL') }} m</dd>
                </div>
                <div class="rounded-xl bg-neutral-50 px-3 py-2 ring-1 ring-neutral-200">
                  <dt class="text-xs font-medium text-neutral-500">Largo total</dt>
                  <dd class="text-lg font-semibold tabular-nums text-neutral-900">{{ medidasContorno.largo.toLocaleString('es-CL') }} m</dd>
                </div>
              </dl>
              <div v-else class="mt-4 grid grid-cols-2 gap-3">
                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium text-neutral-700">{{ dibujando ? 'Área de dibujo: ancho (m)' : 'Ancho (m)' }}</span>
                  <input
                    v-model.number="bodegaEntrada.ancho"
                    type="number" inputmode="decimal" :min="LIMITES.bodega.min" :max="LIMITES.bodega.max" step="0.5"
                    class="plan-input" @change="aplicarBodega"
                  >
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium text-neutral-700">{{ dibujando ? 'Área de dibujo: largo (m)' : 'Largo (m)' }}</span>
                  <input
                    v-model.number="bodegaEntrada.largo"
                    type="number" inputmode="decimal" :min="LIMITES.bodega.min" :max="LIMITES.bodega.max" step="0.5"
                    class="plan-input" @change="aplicarBodega"
                  >
                </label>
              </div>
              <template v-if="formaLibre">
                <p class="mt-3 text-sm text-neutral-600">
                  <template v-if="dibujando">
                    Haz clic en cada esquina de tu bodega sobre la cuadrícula ({{ puntosDibujo.length }} {{ puntosDibujo.length === 1 ? 'esquina' : 'esquinas' }}). Para cerrar, haz clic en el primer punto (naranja).
                  </template>
                  <template v-else>
                    Arrastra las esquinas naranjas para ajustar la forma, o vuelve a dibujar el contorno.
                  </template>
                </p>
                <div v-if="dibujando" class="mt-3 grid grid-cols-3 gap-2">
                  <button type="button" class="plan-accion" :disabled="!puntosDibujo.length" @click="puntosDibujo.pop()">Deshacer</button>
                  <button type="button" class="plan-accion" @click="cancelarDibujo">Cancelar</button>
                  <button type="button" class="plan-accion bg-brand-600 text-white hover:bg-brand-700" :disabled="puntosDibujo.length < 3" @click="cerrarContorno">Terminar</button>
                </div>
                <button v-else type="button" class="plan-accion mt-3 w-full" @click="empezarDibujo">Volver a dibujar el contorno</button>
              </template>
              <div v-if="!dibujando" class="mt-4">
                <div class="mb-1.5 flex items-center text-sm font-medium text-neutral-700">
                  <label for="plan-altura">Altura libre (m)</label>
                  <PlanificadorAyuda titulo="altura libre">Mide hasta lo más bajo del techo: viga, cercha, luminaria o rociador. Con ella sabemos cuántos niveles caben.</PlanificadorAyuda>
                </div>
                <input
                  id="plan-altura"
                  v-model.number="alturaEntrada"
                  type="number" inputmode="decimal" min="2" max="40" step="0.1" placeholder="Ej.: 7,5"
                  class="plan-input" @change="aplicarAltura"
                >
              </div>
              <p class="mt-3 text-xs text-neutral-500">{{ Math.round(area(contorno(bodega))) }} m² · cuadrícula de 1 m</p>
            </div>

            <!-- 2. Agregar racks -->
            <div :class="['card p-5 transition', resaltar(1)]">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-600">2. Agrega racks</h2>
              <div class="mt-4 grid grid-cols-2 gap-3">
                <button
                  v-for="(t, clave) in TIPOS" :key="clave"
                  type="button" class="plan-add" :disabled="dibujando" @click="agregar(clave)"
                >
                  <img :src="t.imagen" alt="" width="160" height="90" loading="lazy" class="h-14 w-full rounded-lg object-cover">
                  <span class="mt-2 block text-sm font-semibold">{{ t.nombre }}</span>
                  <span class="block text-xs text-neutral-500">{{ t.uso }}</span>
                </button>
              </div>
            </div>

            <!-- 3. Rack seleccionado -->
            <div :class="['card p-5 transition', resaltar(2)]">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-600">3. Ajusta el rack</h2>
              <template v-if="rackSel">
                <p class="mt-3 font-semibold text-neutral-900">
                  {{ indiceSel + 1 }}. {{ NOMBRE[rackSel.tipo] }}
                </p>
                <div class="mt-4 space-y-4">
                  <p v-if="TIPOS[rackSel.tipo].doble" class="-mb-2 flex items-center text-sm font-medium text-neutral-700">
                    Tipo
                    <PlanificadorAyuda titulo="simple o doble">Doble son dos racks espalda con espalda: se carga por ambos lados y ahorra un pasillo.</PlanificadorAyuda>
                  </p>
                  <div v-if="TIPOS[rackSel.tipo].doble" role="group" aria-label="Tipo" class="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
                    <button
                      v-for="op in [{ v: false, t: 'Simple' }, { v: true, t: 'Doble' }]" :key="op.t"
                      type="button" :aria-pressed="rackSel.doble === op.v"
                      :class="['h-10 rounded-lg text-sm font-semibold transition', rackSel.doble === op.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600 hover:text-neutral-900']"
                      @click="cambiar({ doble: op.v })"
                    >{{ op.t }}</button>
                  </div>

                  <div v-for="(def, campo) in TIPOS[rackSel.tipo].campos" :key="campo" class="flex items-center justify-between gap-3">
                    <span class="flex items-center text-sm font-medium text-neutral-700">
                      {{ def[0] }}
                      <PlanificadorAyuda :titulo="def[0]">{{ ayudaCampo(rackSel.tipo, String(campo)) }}</PlanificadorAyuda>
                    </span>
                    <div class="flex items-center gap-2">
                      <button type="button" class="plan-step" :aria-label="`${def[0]}: quitar uno`" :disabled="valor(campo) <= def[1]" @click="cambiar({ [campo]: valor(campo) - 1 })">−</button>
                      <span class="w-8 text-center text-lg font-bold tabular-nums" aria-live="polite">{{ valor(campo) }}</span>
                      <button type="button" class="plan-step" :aria-label="`${def[0]}: agregar uno`" :disabled="valor(campo) >= def[2]" @click="cambiar({ [campo]: valor(campo) + 1 })">+</button>
                    </div>
                  </div>

                  <p class="text-xs text-neutral-500">
                    {{ formatoM(rectSel.ancho) }} × {{ formatoM(rectSel.alto) }} m en planta · {{ formatoM(altoRack(rackSel)) }} m de alto
                    <span v-if="altos.has(rackSel.id)" class="font-semibold text-amber-700">· más alto que la bodega</span>
                  </p>

                  <details class="rounded-xl bg-neutral-50 text-sm ring-1 ring-neutral-200">
                    <summary class="cursor-pointer px-3 py-2.5 font-semibold text-neutral-800">¿Este sistema te conviene?</summary>
                    <dl class="space-y-2 px-3 pb-3 text-neutral-600">
                      <div v-for="(etq, k) in ASESORIA_ETIQUETAS" :key="k">
                        <dt class="font-medium text-neutral-800">{{ etq }}</dt>
                        <dd>{{ TIPOS[rackSel.tipo].asesoria[k] }}</dd>
                      </div>
                    </dl>
                  </details>

                  <div class="grid grid-cols-3 gap-2">
                    <button type="button" class="plan-accion" @click="girar(rackSel.id)">Girar</button>
                    <button type="button" class="plan-accion" @click="duplicar(rackSel.id)">Duplicar</button>
                    <button type="button" class="plan-accion text-red-700 hover:bg-red-50" @click="eliminar(rackSel.id)">Eliminar</button>
                  </div>
                </div>
              </template>
              <p v-else class="mt-3 text-sm text-neutral-600">
                {{ racks.length ? 'Toca un rack en el plano o en 3D para ajustarlo o moverlo.' : 'Agrega tu primer rack para empezar.' }}
              </p>
            </div>

            <PlanificadorAsesoria
              @agregar="agregar"
              @whatsapp="marcar('planner_whatsapp', {})"
              @guia="(g) => marcar('planner_guide', { guia: g })"
            />
          </aside>

          <!-- Plano / 3D -->
          <div class="min-w-0 lg:order-2">
            <div class="card overflow-hidden">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
                <div role="tablist" aria-label="Vista" class="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
                  <button
                    v-for="v in (['2d', '3d'] as const)" :key="v"
                    type="button" role="tab" :aria-selected="vista === v"
                    :class="['h-9 rounded-lg px-5 text-sm font-semibold transition', vista === v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600 hover:text-neutral-900']"
                    :disabled="dibujando && v === '3d'"
                    @click="vista = v"
                  >{{ v === '2d' ? 'Plano 2D' : 'Vista 3D' }}</button>
                </div>
                <p class="text-sm text-neutral-600">
                  <span class="font-semibold text-neutral-900">{{ racks.length }}</span> rack{{ racks.length === 1 ? '' : 's' }}
                  <template v-if="total.pallets"> · <span class="font-semibold text-neutral-900">{{ total.pallets }}</span> posiciones de pallet</template>
                  <template v-if="total.bandejas"> · <span class="font-semibold text-neutral-900">{{ total.bandejas }}</span> bandejas</template>
                </p>
              </div>
              <dl v-if="racks.length" class="flex flex-wrap gap-x-5 gap-y-1 border-b border-neutral-100 px-4 py-2 text-xs text-neutral-600">
                <div class="flex gap-1"><dt>Piso ocupado:</dt><dd class="font-semibold text-neutral-900">{{ porcentaje(ind.ocupacion) }}</dd></div>
                <div v-if="total.pallets" class="flex gap-1"><dt>Posiciones por m²:</dt><dd class="font-semibold text-neutral-900">{{ ind.posicionesM2.toLocaleString('es-CL', { maximumFractionDigits: 2 }) }}</dd></div>
                <div class="flex gap-1">
                  <dt>Uso de la altura:</dt>
                  <dd class="font-semibold text-neutral-900">{{ ind.usoAltura === null ? 'indica la altura libre' : porcentaje(ind.usoAltura) }}</dd>
                </div>
              </dl>

              <div :class="['relative h-[60vh] min-h-[360px] bg-neutral-50 transition sm:h-[65vh]', resaltar(2)]">
                <ClientOnly>
                  <PlanificadorPerfil v-if="mostrarPerfil" @elegir="elegirPerfil" />
                  <div v-else-if="pasoRecorrido !== null" class="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center lg:absolute lg:bottom-4 lg:z-20">
                    <PlanificadorRecorrido :paso="pasoRecorrido" @paso="pasoRecorrido = $event" @cerrar="cerrarRecorrido" />
                  </div>
                </ClientOnly>
                <PlanificadorPlano2D
                  v-show="vista === '2d'"
                  ref="planoRef"
                  :bodega="bodega"
                  :racks="racks"
                  :seleccion="seleccion"
                  :conflictos="malos"
                  :dibujando="dibujando"
                  :puntos-dibujo="puntosDibujo"
                  :editar-contorno="formaLibre && !dibujando"
                  :altos="altos"
                  :cotas-todas="exportando"
                  class="p-3"
                  @seleccionar="seleccion = $event"
                  @mover="mover"
                  @girar="girar"
                  @eliminar="eliminar"
                  @agregar-punto="puntosDibujo.push($event)"
                  @cerrar-contorno="cerrarContorno"
                  @mover-vertice="moverVertice"
                />
                <ClientOnly v-if="vista === '3d'">
                  <Visor3D
                    ref="visorRef"
                    :bodega="bodega" :racks="racks" etiqueta="Vista 3D de la bodega con los racks dibujados"
                    @seleccionar="seleccion = $event" @mover="mover"
                  />
                </ClientOnly>
              </div>

              <div v-if="malos.size" class="border-t border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-800" role="status">
                Hay racks superpuestos o fuera de la bodega (en rojo). Muévelos para separarlos.
              </div>
              <div v-if="altos.size" class="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-900" role="status">
                {{ altos.size === 1 ? 'Un rack es más alto' : `${altos.size} racks son más altos` }} que la altura libre ({{ formatoM(bodega.altura || 0) }} m), marcados con borde ámbar. Quítales niveles o revisa la altura.
              </div>
              <p v-if="!malos.size && !altos.size && vista === '2d' && racks.length" class="border-t border-neutral-100 px-4 py-2.5 text-xs text-neutral-500">
                Arrastra los racks para moverlos. Con teclado: flechas para mover, R para girar y Suprimir para eliminar.
              </p>
            </div>

            <!-- Cotizar -->
            <div :class="['mt-5 flex flex-col gap-4 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100 transition lg:flex-row lg:items-center lg:justify-between', resaltar(3)]">
              <div>
                <p class="font-semibold text-neutral-900">¿Listo tu diseño?</p>
                <p class="text-sm text-neutral-600">{{ textoEntregable }} Un ejecutivo lo revisa sin costo.</p>
                <p v-if="pdfListo" class="mt-1 text-sm font-medium text-green-700" role="status">Tu plano se descargó. También te llegará la confirmación por correo.</p>
              </div>
              <div class="flex flex-shrink-0 flex-wrap gap-3">
                <button v-if="racks.length" type="button" class="btn h-12 px-4 text-sm text-neutral-600 hover:text-neutral-900" @click="reiniciar">Empezar de nuevo</button>
                <button type="button" class="btn btn-secondary h-12 px-5" :disabled="!racks.length || preparando || dibujando" @click="pedir('pdf')">
                  {{ preparando && modo === 'pdf' ? 'Preparando…' : 'Descargar plano PDF' }}
                </button>
                <button type="button" class="btn btn-primary h-12 px-6" :disabled="!racks.length || preparando || dibujando" @click="pedir('cotizar')">
                  {{ preparando && modo === 'cotizar' ? 'Preparando…' : 'Solicitar cotización' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <ContactModal
      :is-visible="formularioAbierto"
      :encabezado="modo === 'pdf' ? { etiqueta: 'Gratis', titulo: 'Descarga tu plano', texto: 'Déjanos tus datos y el PDF se descarga al enviar. Un ejecutivo revisa tu diseño sin costo.' } : null"
      :quote-item="itemCotizacion"
      :initial-files="archivosPlano"
      require-project
      @sent="alEnviar"
      @close="formularioAbierto = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import {
  LIMITES, NOMBRE, TIPOS, PERFILES, dentroDeBodega, conflictos, lugarLibre, totales, resumenCotizacion, normalizar, contorno, area, caja,
  altoRack, racksAltos, indicadores, rectangulo, medidasRack, describir, formatoM,
} from '~/lib/rack3d/planificador.js';
import { capacidad } from '~/lib/rack3d/medidas.js';
import type { RackPlano, Punto } from '~/components/planificador/Plano2D.vue';
import type { QuoteItem } from '~/components/QuoteModal/ProductConfig';

usePageSeo({
  title: 'Planificador de bodega 3D',
  description: 'Dibuja tu bodega, agrega rack selectivo, drive-in o ángulo ranurado, míralos en 3D y pide tu cotización a Racklog. Gratis y sin registro.',
});

const GUARDADO = 'racklog-planificador-v1';
const GUARDADO_PERFIL = 'racklog-planificador-perfil';
const GUARDADO_RECORRIDO = 'racklog-planificador-recorrido';
const route = useRoute();
const router = useRouter();

const bodega = reactive<{ ancho: number; largo: number; forma: Punto[] | null; altura: number | null }>({ ancho: 20, largo: 30, forma: null, altura: null });
const alturaEntrada = ref<number | null>(null);
const bodegaEntrada = reactive({ ancho: bodega.ancho, largo: bodega.largo });
const formaLibre = computed(() => !!bodega.forma || dibujando.value);
const dibujando = ref(false);
const puntosDibujo = ref<Punto[]>([]);
const racks = ref<RackPlano[]>([]);
const seleccion = ref<string | null>(null);
const vista = ref<'2d' | '3d'>('2d');
const planoRef = ref<{ $el: SVGSVGElement } | null>(null);
const visorRef = ref<{ captura: () => string | null } | null>(null);

// Caja del contorno dibujado: es lo que se informa en la cotizacion
const medidasContorno = computed(() => {
  const c = caja(contorno(bodega));
  return { ancho: +(c.x1 - c.x0).toFixed(1), largo: +(c.y1 - c.y0).toFixed(1) };
});
const malos = computed(() => conflictos(racks.value, bodega) as Set<string>);
const total = computed(() => totales(racks.value));
const indiceSel = computed(() => racks.value.findIndex((r) => r.id === seleccion.value));
const rackSel = computed(() => racks.value[indiceSel.value] ?? null);
const rectSel = computed(() => (rackSel.value ? rectangulo(rackSel.value) : { ancho: 0, alto: 0 }));
const altos = computed(() => racksAltos(racks.value, bodega.altura) as Set<string>);
const ind = computed(() => indicadores(bodega, racks.value));
const porcentaje = (v: number) => `${Math.round(v * 100)} %`;

// Altura libre (m): con ella se avisa si un rack no cabe y se calcula el uso de la altura
function aplicarAltura() {
  const v = Number(alturaEntrada.value);
  bodega.altura = Number.isFinite(v) && v >= 2 ? Math.min(40, Math.round(v * 10) / 10) : null;
  alturaEntrada.value = bodega.altura;
  if (bodega.altura) marcar('planner_height', { altura: bodega.altura });
}

// ─── Perfil y recorrido inicial ───
const perfil = ref<string | null>(null);
const mostrarPerfil = ref(false);
const pasoRecorrido = ref<number | null>(null);
const textoEntregable = computed(() => PERFILES.find((p) => p.v === perfil.value)?.entregable ?? 'Descarga tu plano con medidas o pide tu cotización.');

function guardarLocal(clave: string, valor: string) {
  try { localStorage.setItem(clave, valor); } catch { /* sin almacenamiento */ }
}

function elegirPerfil(v: string | null) {
  perfil.value = v;
  mostrarPerfil.value = false;
  guardarLocal(GUARDADO_PERFIL, v ?? 'sin_perfil');
  marcar('planner_profile', { perfil: v ?? 'sin_perfil' });
  let visto = false;
  try { visto = !!localStorage.getItem(GUARDADO_RECORRIDO); } catch { /* */ }
  if (!visto) pasoRecorrido.value = 0;
}

function cerrarRecorrido() {
  marcar('planner_tour', { hasta_paso: (pasoRecorrido.value ?? 0) + 1 });
  pasoRecorrido.value = null;
  guardarLocal(GUARDADO_RECORRIDO, '1');
}

// Seccion que el recorrido esta explicando
const resaltar = (paso: number) => (pasoRecorrido.value === paso ? 'ring-2 ring-brand-500 ring-offset-2' : '');

const ASESORIA_ETIQUETAS = { sirve: 'Para qué sirve', conviene: 'Te conviene si…', noConviene: 'No te conviene si…', impacto: 'Impacto en tu bodega', datos: 'Qué necesitamos saber' };

function ayudaCampo(tipo: string, campo: string) {
  if (campo === 'cuerpos') return tipo === 'DI' ? 'Pasillos por donde entra la grúa a dejar los pallets.' : 'Cada cuerpo es un módulo entre dos marcos. Más cuerpos, rack más largo.';
  if (campo === 'fondos') return 'Cuántos pallets quedan uno detrás de otro en cada calle.';
  if (campo === 'niveles') return tipo === 'AR' ? 'Bandejas por cuerpo, de abajo hacia arriba.' : 'Niveles de carga, contando el pallet que va en el piso.';
  return '';
}

const nuevoId = () => Math.random().toString(36).slice(2, 9);

function aplicarBodega() {
  const lim = (v: number, actual: number) => (Number.isFinite(v) ? Math.min(LIMITES.bodega.max, Math.max(LIMITES.bodega.min, Math.round(v * 2) / 2)) : actual);
  bodega.ancho = lim(bodegaEntrada.ancho, bodega.ancho);
  bodega.largo = lim(bodegaEntrada.largo, bodega.largo);
  bodegaEntrada.ancho = bodega.ancho;
  bodegaEntrada.largo = bodega.largo;
  // En forma libre, ancho y largo son el lienzo: el contorno no puede quedar fuera
  if (bodega.forma) bodega.forma = bodega.forma.map((p) => ({ x: Math.min(p.x, bodega.ancho), y: Math.min(p.y, bodega.largo) }));
  racks.value = racks.value.map((r) => dentroDeBodega(r, bodega) as RackPlano);
}

// ─── Forma libre: se dibuja el contorno haciendo clic en cada esquina ───
function cambiarForma(libre: boolean) {
  if (libre === formaLibre.value) return;
  if (libre) {
    empezarDibujo();
  } else {
    dibujando.value = false;
    bodega.forma = null;
    racks.value = racks.value.map((r) => dentroDeBodega(r, bodega) as RackPlano);
  }
}

function empezarDibujo() {
  dibujando.value = true;
  puntosDibujo.value = [];
  seleccion.value = null;
  vista.value = '2d';
}

function cancelarDibujo() {
  dibujando.value = false;
  puntosDibujo.value = [];
}

function cerrarContorno() {
  // Sin puntos repetidos seguidos ni esquinas en linea recta
  const pts = puntosDibujo.value.filter((p, i, a) => i === 0 || p.x !== a[i - 1].x || p.y !== a[i - 1].y);
  if (pts.length > 1 && pts[0].x === pts[pts.length - 1].x && pts[0].y === pts[pts.length - 1].y) pts.pop();
  const limpios = pts.filter((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
    return Math.abs((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) > 1e-6;
  });
  if (limpios.length < 3 || area(limpios) < 1) return;
  bodega.forma = limpios;
  dibujando.value = false;
  puntosDibujo.value = [];
  racks.value = racks.value.map((r) => dentroDeBodega(r, bodega) as RackPlano);
  marcar('planner_custom_shape', { esquinas: limpios.length });
}

function moverVertice(i: number, p: Punto) {
  if (!bodega.forma) return;
  const q = { x: Math.min(bodega.ancho, Math.max(0, p.x)), y: Math.min(bodega.largo, Math.max(0, p.y)) };
  bodega.forma = bodega.forma.map((v, k) => (k === i ? q : v));
}

function valor(campo: string) {
  return Number((rackSel.value as unknown as Record<string, number>)?.[campo] ?? 0);
}

function agregar(tipo: RackPlano['tipo']) {
  const rack = lugarLibre(normalizar({ id: nuevoId(), tipo, rot: 0, x: 0, y: 0 }), racks.value, bodega) as RackPlano;
  racks.value.push(rack);
  seleccion.value = rack.id;
  vista.value = '2d';
  marcar('planner_add_rack', { rack_type: tipo });
}

function actualizar(id: string, cambio: Partial<RackPlano>) {
  racks.value = racks.value.map((r) => (r.id === id ? dentroDeBodega(normalizar({ ...r, ...cambio }), bodega) as RackPlano : r));
}

function cambiar(cambio: Partial<RackPlano>) {
  if (rackSel.value) actualizar(rackSel.value.id, cambio);
}

function mover(id: string, x: number, y: number) {
  actualizar(id, { x, y });
}

function girar(id: string) {
  const r = racks.value.find((q) => q.id === id);
  if (r) actualizar(id, { rot: ((r.rot + 90) % 360) as RackPlano['rot'] });
}

function duplicar(id: string) {
  const r = racks.value.find((q) => q.id === id);
  if (!r) return;
  const copia = lugarLibre({ ...r, id: nuevoId() }, racks.value, bodega) as RackPlano;
  racks.value.push(copia);
  seleccion.value = copia.id;
}

function eliminar(id: string) {
  racks.value = racks.value.filter((r) => r.id !== id);
  if (seleccion.value === id) seleccion.value = null;
}

function reiniciar() {
  if (!confirm('¿Borrar todos los racks y empezar de nuevo?')) return;
  racks.value = [];
  seleccion.value = null;
}

// ─── Cotizar: resumen para el vendedor y el plano como imagen adjunta ───
const formularioAbierto = ref(false);
const preparando = ref(false);
const archivosPlano = ref<File[]>([]);
const itemCotizacion = computed<QuoteItem>(() => ({
  name: 'Diseño del planificador de bodega',
  config: {
    ...resumenCotizacion(bodega, racks.value),
    ...(bodega.altura ? { 'Altura libre': `${formatoM(bodega.altura)} m` } : {}),
    ...(perfil.value ? { 'Perfil': PERFILES.find((p) => p.v === perfil.value)?.t ?? perfil.value } : {}),
    'Solicitud': modo.value === 'pdf' ? 'Descargó el plano en PDF' : 'Cotización',
  },
  analytics: {
    lead_origin: 'planificador',
    sistemas: [...new Set(racks.value.map((r) => r.tipo))].join(','),
    m2: Math.round(area(contorno(bodega))),
    posiciones: total.value.pallets,
    bandejas: total.value.bandejas,
    racks: racks.value.length,
    perfil: perfil.value ?? 'sin_perfil',
    entregable: modo.value,
  },
}));

async function imagenPlano(): Promise<File | null> {
  const svg = planoRef.value?.$el;
  if (!svg) return null;
  const copia = svg.cloneNode(true) as SVGSVGElement;
  const vb = svg.viewBox.baseVal;
  const escala = Math.min(4000 / vb.width, 4000 / vb.height, 60);   // ~60 px por metro
  const ancho = Math.round(vb.width * escala), alto = Math.round(vb.height * escala);
  copia.setAttribute('width', String(ancho));
  copia.setAttribute('height', String(alto));
  copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copia)], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise((ok, mal) => { img.onload = ok; img.onerror = mal; img.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/png'));
    return blob ? new File([blob], 'plano-bodega.png', { type: 'image/png' }) : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// "cotizar" o "pdf": los dos piden los datos del cliente (peaje); el PDF se descarga despues del envio
const modo = ref<'cotizar' | 'pdf'>('cotizar');
const exportando = ref(false);
const pdfListo = ref(false);

async function pedir(m: 'cotizar' | 'pdf') {
  modo.value = m;
  preparando.value = true;
  pdfListo.value = false;
  seleccion.value = null;   // el plano sale sin el rack resaltado y con todas las cotas
  exportando.value = true;
  await nextTick();
  try {
    const plano = await imagenPlano();
    archivosPlano.value = plano ? [plano] : [];
  } finally {
    exportando.value = false;
    preparando.value = false;
  }
  marcar(m === 'pdf' ? 'planner_pdf_click' : 'planner_quote_click', { racks: racks.value.length });
  formularioAbierto.value = true;
}

// Vista 3D para el PDF: si se esta en el plano, se abre el 3D un momento y se captura
async function capturar3D(): Promise<string | null> {
  const antes = vista.value;
  vista.value = '3d';
  let img: string | null = null;
  for (let i = 0; i < 40 && !img; i++) {
    await new Promise((ok) => setTimeout(ok, 150));
    img = visorRef.value?.captura() ?? null;
  }
  vista.value = antes;
  return img;
}

const aDataUrl = (f: File) => new Promise<string>((ok, mal) => {
  const r = new FileReader();
  r.onload = () => ok(r.result as string);
  r.onerror = mal;
  r.readAsDataURL(f);
});

async function alEnviar(cliente: { reference: string; name: string; email: string; company: string; rut: string; comuna: string }) {
  if (modo.value !== 'pdf') return;
  const plano = archivosPlano.value[0];
  if (!plano) return;
  const [{ crearPdfPlano }, planoUrl, vista3d] = await Promise.all([import('~/lib/rack3d/pdfPlano.js'), aDataUrl(plano), capturar3D()]);
  const filas = racks.value.map((r, i) => {
    const p = rectangulo(r), c = capacidad(medidasRack(r));
    const [sistema, ...resto] = describir(r).split(' · ');
    return [String(i + 1), sistema, resto.join(' · '), `${formatoM(p.ancho)} × ${formatoM(p.alto)} × ${formatoM(altoRack(r))} m`, c.pallets ? `${c.pallets} posiciones de pallet` : `${c.bandejas} bandejas`];
  });
  const i = ind.value;
  const blob = await crearPdfPlano({
    cliente,
    plano: planoUrl,
    vista3d,
    bodega: resumenCotizacion(bodega, racks.value).Bodega + (bodega.altura ? ` · altura libre ${formatoM(bodega.altura)} m` : ''),
    filas,
    indicadores: [
      ['Racks', String(racks.value.length)],
      ...(total.value.pallets ? [['Posiciones de pallet', String(total.value.pallets)] as [string, string]] : []),
      ...(total.value.bandejas ? [['Niveles de bandeja', String(total.value.bandejas)] as [string, string]] : []),
      ['Piso ocupado por racks', porcentaje(i.ocupacion)],
      ...(total.value.pallets ? [['Posiciones por m²', i.posicionesM2.toLocaleString('es-CL', { maximumFractionDigits: 2 })] as [string, string]] : []),
      ['Uso de la altura', i.usoAltura === null ? 'Sin altura libre' : porcentaje(i.usoAltura)],
    ],
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plano-racklog-${cliente.company.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bodega'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  pdfListo.value = true;
  marcar('planner_pdf_download', { racks: racks.value.length, perfil: perfil.value ?? 'sin_perfil' });
}

function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planificador', ...datos });
}

// ─── El diseño se guarda en este navegador (si se recarga la pagina no se pierde) ───
onMounted(() => {
  try {
    const g = JSON.parse(localStorage.getItem(GUARDADO) || 'null');
    if (g?.bodega && Array.isArray(g.racks)) {
      bodegaEntrada.ancho = g.bodega.ancho;
      bodegaEntrada.largo = g.bodega.largo;
      aplicarBodega();
      bodega.altura = Number(g.bodega.altura) >= 2 ? Number(g.bodega.altura) : null;
      alturaEntrada.value = bodega.altura;
      const forma = Array.isArray(g.bodega.forma) && g.bodega.forma.length >= 3 ? g.bodega.forma : null;
      bodega.forma = forma && forma.every((p: Punto) => Number.isFinite(p?.x) && Number.isFinite(p?.y)) ? forma : null;
      racks.value = g.racks.filter((r: RackPlano) => r && r.tipo in TIPOS).map((r: RackPlano) => dentroDeBodega(normalizar(r), bodega) as RackPlano);
    }
  } catch { /* sin almacenamiento: se empieza vacio */ }
  // Desde la ficha de un producto (?rack=RS): ese rack ya puesto en la bodega
  const pedido = route.query.rack;
  if (typeof pedido === 'string' && pedido in TIPOS) {
    agregar(pedido as RackPlano['tipo']);
    router.replace({ query: {} });   // al recargar no se vuelve a agregar
  }
  try {
    const p = localStorage.getItem(GUARDADO_PERFIL);
    if (p) perfil.value = p === 'sin_perfil' ? null : p;
    else mostrarPerfil.value = true;
  } catch { mostrarPerfil.value = true; }
  marcar('planner_open', { desde_producto: typeof pedido === 'string' ? pedido : '' });
});

watch([racks, () => ({ ...bodega })], () => {
  try {
    localStorage.setItem(GUARDADO, JSON.stringify({ bodega, racks: racks.value }));
  } catch { /* sin almacenamiento */ }
}, { deep: true });
</script>

<style scoped>
.plan-input {
  display: block;
  width: 100%;
  height: 2.75rem;
  padding: 0 0.75rem;
  border: 1px solid #e5e5e5;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}
.plan-input:focus {
  outline: none;
  border-color: #ea580c;
  box-shadow: 0 0 0 4px rgb(234 88 12 / 0.15);
}
.plan-add {
  border-radius: 0.75rem;
  padding: 0.875rem 0.5rem;
  text-align: center;
  background: #fff;
  box-shadow: inset 0 0 0 1px #e5e5e5;
  transition: box-shadow 0.15s ease, background-color 0.15s ease;
}
.plan-add:hover {
  background: #fff7ed;
  box-shadow: inset 0 0 0 2px #ea580c;
}
.plan-add:disabled,
.plan-accion:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.plan-step {
  display: inline-flex;
  height: 2.75rem;
  width: 2.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: #fff;
  font-size: 1.25rem;
  font-weight: 600;
  color: #404040;
  box-shadow: inset 0 0 0 1px #e5e5e5;
}
.plan-step:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.plan-accion {
  height: 2.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #404040;
  box-shadow: inset 0 0 0 1px #e5e5e5;
}
.plan-accion:hover {
  background: #f5f5f5;
}
</style>
