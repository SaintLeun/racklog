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
            <div class="card p-5">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-600">1. Tu bodega</h2>
              <div role="group" aria-label="Forma de la bodega" class="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
                <button
                  v-for="op in [{ v: false, t: 'Rectangular' }, { v: true, t: 'Forma libre' }]" :key="op.t"
                  type="button" :aria-pressed="formaLibre === op.v"
                  :class="['h-10 rounded-lg text-sm font-semibold transition', formaLibre === op.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600 hover:text-neutral-900']"
                  @click="cambiarForma(op.v)"
                >{{ op.t }}</button>
              </div>
              <div class="mt-4 grid grid-cols-2 gap-3">
                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium text-neutral-700">Ancho (m)</span>
                  <input
                    v-model.number="bodegaEntrada.ancho"
                    type="number" inputmode="decimal" :min="LIMITES.bodega.min" :max="LIMITES.bodega.max" step="0.5"
                    class="plan-input" @change="aplicarBodega"
                  >
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium text-neutral-700">Largo (m)</span>
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
                    Ancho y largo son el área de dibujo. Arrastra las esquinas naranjas para ajustar la forma.
                  </template>
                </p>
                <div v-if="dibujando" class="mt-3 grid grid-cols-3 gap-2">
                  <button type="button" class="plan-accion" :disabled="!puntosDibujo.length" @click="puntosDibujo.pop()">Deshacer</button>
                  <button type="button" class="plan-accion" @click="cancelarDibujo">Cancelar</button>
                  <button type="button" class="plan-accion bg-brand-600 text-white hover:bg-brand-700" :disabled="puntosDibujo.length < 3" @click="cerrarContorno">Terminar</button>
                </div>
                <button v-else type="button" class="plan-accion mt-3 w-full" @click="empezarDibujo">Volver a dibujar el contorno</button>
              </template>
              <p class="mt-3 text-xs text-neutral-500">{{ Math.round(area(contorno(bodega))) }} m² · cuadrícula de 1 m</p>
            </div>

            <!-- 2. Agregar racks -->
            <div class="card p-5">
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
            <div class="card p-5">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-600">3. Ajusta el rack</h2>
              <template v-if="rackSel">
                <p class="mt-3 font-semibold text-neutral-900">
                  {{ indiceSel + 1 }}. {{ NOMBRE[rackSel.tipo] }}
                </p>
                <div class="mt-4 space-y-4">
                  <div v-if="TIPOS[rackSel.tipo].doble" role="group" aria-label="Tipo" class="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
                    <button
                      v-for="op in [{ v: false, t: 'Simple' }, { v: true, t: 'Doble' }]" :key="op.t"
                      type="button" :aria-pressed="rackSel.doble === op.v"
                      :class="['h-10 rounded-lg text-sm font-semibold transition', rackSel.doble === op.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600 hover:text-neutral-900']"
                      @click="cambiar({ doble: op.v })"
                    >{{ op.t }}</button>
                  </div>

                  <div v-for="(def, campo) in TIPOS[rackSel.tipo].campos" :key="campo" class="flex items-center justify-between gap-3">
                    <span class="text-sm font-medium text-neutral-700">{{ def[0] }}</span>
                    <div class="flex items-center gap-2">
                      <button type="button" class="plan-step" :aria-label="`${def[0]}: quitar uno`" :disabled="valor(campo) <= def[1]" @click="cambiar({ [campo]: valor(campo) - 1 })">−</button>
                      <span class="w-8 text-center text-lg font-bold tabular-nums" aria-live="polite">{{ valor(campo) }}</span>
                      <button type="button" class="plan-step" :aria-label="`${def[0]}: agregar uno`" :disabled="valor(campo) >= def[2]" @click="cambiar({ [campo]: valor(campo) + 1 })">+</button>
                    </div>
                  </div>
                  <p v-if="rackSel.tipo === 'AL' && rackSel.pisos > 1" class="text-xs text-neutral-500">Con 2 pisos el altillo lleva al menos 4 cuerpos.</p>

                  <div class="grid grid-cols-3 gap-2">
                    <button type="button" class="plan-accion" @click="girar(rackSel.id)">Girar</button>
                    <button type="button" class="plan-accion" @click="duplicar(rackSel.id)">Duplicar</button>
                    <button type="button" class="plan-accion text-red-700 hover:bg-red-50" @click="eliminar(rackSel.id)">Eliminar</button>
                  </div>
                </div>
              </template>
              <p v-else class="mt-3 text-sm text-neutral-600">
                {{ racks.length ? 'Toca un rack en el plano para ajustarlo o moverlo.' : 'Agrega tu primer rack para empezar.' }}
              </p>
            </div>
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

              <div class="relative h-[60vh] min-h-[360px] bg-neutral-50 sm:h-[65vh]">
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
                  <Visor3D :bodega="bodega" :racks="racks" etiqueta="Vista 3D de la bodega con los racks dibujados" />
                </ClientOnly>
              </div>

              <div v-if="malos.size" class="border-t border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-800" role="status">
                Hay racks superpuestos o fuera de la bodega (en rojo). Muévelos para separarlos.
              </div>
              <p v-else-if="vista === '2d' && racks.length" class="border-t border-neutral-100 px-4 py-2.5 text-xs text-neutral-500">
                Arrastra los racks para moverlos. Con teclado: flechas para mover, R para girar y Suprimir para eliminar.
              </p>
            </div>

            <!-- Cotizar -->
            <div class="mt-5 flex flex-col gap-4 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="font-semibold text-neutral-900">¿Listo tu diseño?</p>
                <p class="text-sm text-neutral-600">Te enviamos una cotización sin compromiso. El plano se adjunta solo.</p>
              </div>
              <div class="flex flex-shrink-0 gap-3">
                <button v-if="racks.length" type="button" class="btn h-12 px-4 text-sm text-neutral-600 hover:text-neutral-900" @click="reiniciar">Empezar de nuevo</button>
                <button type="button" class="btn btn-primary h-12 px-6" :disabled="!racks.length || preparando || dibujando" @click="cotizar">
                  {{ preparando ? 'Preparando…' : 'Solicitar cotización' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <ContactModal
      :is-visible="formularioAbierto"
      title="Cotiza tu diseño"
      :quote-item="itemCotizacion"
      :initial-files="archivosPlano"
      @close="formularioAbierto = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import {
  LIMITES, NOMBRE, TIPOS, dentroDeBodega, conflictos, lugarLibre, totales, resumenCotizacion, normalizar, contorno, area,
} from '~/lib/rack3d/planificador.js';
import type { RackPlano, Punto } from '~/components/planificador/Plano2D.vue';
import type { QuoteItem } from '~/components/QuoteModal/ProductConfig';

useSeoMeta({
  title: 'Planificador de bodega 3D',
  description: 'Dibuja tu bodega, agrega rack selectivo, drive-in, ángulo ranurado o altillo, míralos en 3D y pide tu cotización a Racklog. Gratis y sin registro.',
});

const GUARDADO = 'racklog-planificador-v1';

const bodega = reactive<{ ancho: number; largo: number; forma: Punto[] | null }>({ ancho: 20, largo: 30, forma: null });
const bodegaEntrada = reactive({ ancho: bodega.ancho, largo: bodega.largo });
const formaLibre = computed(() => !!bodega.forma || dibujando.value);
const dibujando = ref(false);
const puntosDibujo = ref<Punto[]>([]);
const racks = ref<RackPlano[]>([]);
const seleccion = ref<string | null>(null);
const vista = ref<'2d' | '3d'>('2d');
const planoRef = ref<{ $el: SVGSVGElement } | null>(null);

const malos = computed(() => conflictos(racks.value, bodega) as Set<string>);
const total = computed(() => totales(racks.value));
const indiceSel = computed(() => racks.value.findIndex((r) => r.id === seleccion.value));
const rackSel = computed(() => racks.value[indiceSel.value] ?? null);

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
const itemCotizacion = computed<QuoteItem>(() => ({ name: 'Diseño del planificador de bodega', config: resumenCotizacion(bodega, racks.value) }));

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

async function cotizar() {
  preparando.value = true;
  seleccion.value = null;   // el plano sale sin el rack resaltado
  await nextTick();
  try {
    const plano = await imagenPlano();
    archivosPlano.value = plano ? [plano] : [];
  } finally {
    preparando.value = false;
  }
  marcar('planner_quote_click', { racks: racks.value.length });
  formularioAbierto.value = true;
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
      const forma = Array.isArray(g.bodega.forma) && g.bodega.forma.length >= 3 ? g.bodega.forma : null;
      bodega.forma = forma && forma.every((p: Punto) => Number.isFinite(p?.x) && Number.isFinite(p?.y)) ? forma : null;
      racks.value = g.racks.filter((r: RackPlano) => r && r.tipo in TIPOS).map((r: RackPlano) => dentroDeBodega(normalizar(r), bodega) as RackPlano);
    }
  } catch { /* sin almacenamiento: se empieza vacio */ }
  marcar('planner_open', {});
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
