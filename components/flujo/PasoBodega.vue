<template>
  <div>
    <h1 class="fl-titulo">Tu bodega</h1>
    <p class="fl-bajada">Pon las medidas de tu bodega. Ubicamos tus racks con sus pasillos y puedes moverlos con el dedo o el mouse.</p>

    <div class="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
      <div class="space-y-5">
        <div class="fl-card">
          <div class="grid grid-cols-2 gap-3">
            <label class="fl-campo"><span>Ancho (m)</span><input :value="p.bodega.ancho" type="number" min="4" max="200" step="0.5" inputmode="decimal" class="form-input" @change="medida('ancho', $event)"></label>
            <label class="fl-campo"><span>Largo (m)</span><input :value="p.bodega.largo" type="number" min="4" max="200" step="0.5" inputmode="decimal" class="form-input" @change="medida('largo', $event)"></label>
          </div>
          <p class="mt-3 text-sm text-neutral-500">Altura libre: {{ p.bodega.altura ? `${fm(p.bodega.altura)} m` : 'sin dato' }} · {{ equipo }}</p>
          <button type="button" class="fl-btn-sec mt-4 w-full" @click="ubicar(true)">Volver a ubicar mis racks</button>
        </div>

        <div :class="['fl-card', Object.keys(faltan).length ? 'ring-2 ring-amber-300' : '']">
          <p class="fl-leyenda">Lo que cabe</p>
          <ul class="mt-3 space-y-2">
            <li v-for="m in p.modelos" :key="m.id" class="flex justify-between gap-3 text-neutral-800">
              <span>{{ m.nombre }}</span>
              <span class="tabular-nums">{{ ubicados(m.id) }} de {{ necesarios[m.id] }} {{ m.tipo === 'DI' ? 'calles' : 'cuerpos' }}</span>
            </li>
          </ul>
          <p v-if="Object.keys(faltan).length" class="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            No cabe todo con estas medidas. Agranda la bodega, sube niveles en el paso 3 o usa un rack doble.
          </p>
        </div>

        <details class="fl-mas fl-card">
          <summary>Pilares, portones y pasillos</summary>
          <p class="mt-2 text-sm text-neutral-600">Agrégalos y muévelos en el plano. Los racks los esquivan al ubicarse.</p>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <button v-for="cl in CLASES" :key="cl" type="button" class="fl-chip !min-h-10 !text-sm" @click="agregarElemento(cl)">+ {{ ELEMENTOS[cl].nombre }}</button>
          </div>
          <form class="mt-4 grid grid-cols-3 items-end gap-2" @submit.prevent="grillaPilares">
            <label class="fl-campo"><span>Pilares cada X (m)</span><input v-model.number="gp.pasoX" type="number" min="2" step="0.5" class="form-input"></label>
            <label class="fl-campo"><span>cada Y (m)</span><input v-model.number="gp.pasoY" type="number" min="2" step="0.5" class="form-input"></label>
            <button type="submit" class="fl-chip !min-h-11 !text-sm">Poner</button>
          </form>
          <div v-if="elementoActual" class="mt-4 rounded-xl bg-neutral-50 p-3">
            <p class="text-sm font-medium text-neutral-800">{{ ELEMENTOS[elementoActual.clase].nombre }} seleccionado</p>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <label class="fl-campo"><span>Ancho (m)</span><input :value="elementoActual.ancho" type="number" min="0.1" step="0.1" class="form-input" @change="cambiarElemento({ ancho: num($event) })"></label>
              <label class="fl-campo"><span>Largo (m)</span><input :value="elementoActual.alto" type="number" min="0.1" step="0.1" class="form-input" @change="cambiarElemento({ alto: num($event) })"></label>
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <button type="button" class="fl-chip !min-h-10 !text-sm" @click="cambiarElemento({ ancho: elementoActual.alto, alto: elementoActual.ancho })">Girar</button>
              <button type="button" class="fl-chip !min-h-10 !text-sm !text-red-700" @click="quitarElemento(elementoActual.id)">Quitar</button>
            </div>
          </div>
        </details>
      </div>

      <div class="fl-card !p-0 overflow-hidden">
        <div class="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 text-sm text-neutral-600">
          <span><b class="text-neutral-900">{{ p.racks.length }}</b> filas · <b class="text-neutral-900">{{ n(total.pallets) }}</b> posiciones{{ total.bandejas ? ` · ${n(total.bandejas)} bandejas` : '' }}</span>
          <span v-if="rackSel" class="flex gap-2">
            <button type="button" class="font-semibold text-brand-700" @click="girar(rackSel.id)">Girar</button>
            <button type="button" class="font-semibold text-red-700" @click="eliminar(rackSel.id)">Quitar</button>
          </span>
        </div>
        <PlanificadorPlano2D
          :bodega="p.bodega" :racks="p.racks" :seleccion="sel" :conflictos="malos"
          :pasillos="listaPasillos" :marcas="marcas" :elemento-sel="elementoSel"
          class="p-3"
          @seleccionar="sel = $event; if ($event) elementoSel = null"
          @mover="mover" @girar="girar" @eliminar="eliminar"
          @seleccionar-elemento="elementoSel = $event; if ($event) sel = null"
          @mover-elemento="(id: string, x: number, y: number) => cambiarElemento({ x, y }, id)"
          @eliminar-elemento="quitarElemento"
        />
        <p v-if="malos.size" class="border-t border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-800" role="status">
          Hay racks superpuestos, sobre un pilar o fuera de la bodega (en rojo). Muévelos o toca "Volver a ubicar".
        </p>
        <p v-else-if="angostos" class="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-900" role="status">
          Hay pasillos más angostos de lo que necesita tu equipo (en rojo). Lo revisamos en el paso siguiente.
        </p>
        <p v-else class="border-t border-neutral-100 px-4 py-2.5 text-sm text-neutral-500">Arrastra un rack para moverlo. En amarillo, los accesorios de seguridad.</p>
      </div>
    </div>

    <FlujoAcciones :deshabilitado="!p.racks.length" motivo="Ubica al menos un rack." texto="Revisar mi diseño" @atras="emit('atras')" @siguiente="emit('siguiente')" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useProyecto } from '~/stores/proyecto';
import {
  ELEMENTOS, conflictos, totales, contorno, caja, normalizar, dentroDeBodega, grillaPilaresXY, formatoM,
} from '~/lib/rack3d/planificador.js';
import { GRUAS } from '~/lib/rack3d/parametrosTecnicos.js';
import { pasillos } from '~/lib/rack3d/pasillos.js';
import { resultadoModelo, ubicarModelos } from '~/lib/flujo/calculos.js';
import { proponerAccesorios, aplicarAjustes } from '~/lib/rack3d/accesorios.js';

const emit = defineEmits<{ siguiente: []; atras: [] }>();
const p = useProyecto();
const fm = formatoM;
const n = (v: number) => Math.round(v).toLocaleString('es-CL');
const num = (e: Event) => Math.max(0.1, Number((e.target as HTMLInputElement).value) || 0.1);
const nuevoId = () => Math.random().toString(36).slice(2, 9);
const CLASES = ['porton', 'anden', 'oficina', 'pasilloPeatonal', 'pasilloGrua', 'zona'] as const;

const sel = ref<string | null>(null);
const elementoSel = ref<string | null>(null);
const faltan = ref<Record<string, number>>({});
const gp = reactive({ pasoX: 8, pasoY: 8 });

const equipo = computed(() => (GRUAS as any)[p.bodega.grua]?.nombre ?? 'Grúa horquilla');
const necesarios = computed(() => Object.fromEntries(p.modelos.map((m) => [m.id, resultadoModelo(m, { pallets: p.pallets, cajas: p.cajas, grua: p.bodega.grua }).cuerpos])));
const ubicados = (id: string) => p.racks.filter((r) => r.modelo === id).reduce((t, r) => t + r.cuerpos, 0);
const malos = computed(() => conflictos(p.racks, p.bodega) as Set<string>);
const listaPasillos = computed(() => pasillos(p.racks, p.bodega) as any[]);
const angostos = computed(() => listaPasillos.value.some((x) => !x.ok));
const total = computed(() => totales(p.racks.filter((r) => !r.existente)) as { pallets: number; bandejas: number });
const rackSel = computed(() => p.racks.find((r) => r.id === sel.value) ?? null);
const elementoActual = computed(() => p.bodega.elementos.find((e: any) => e.id === elementoSel.value) ?? null);
const marcas = computed(() => {
  const lista = aplicarAjustes(proponerAccesorios({ bodega: p.bodega, racks: p.racks, pallets: p.pallets }), p.accesorios) as any[];
  return lista.filter((a) => a.incluido).flatMap((a) => a.marcas ?? []);
});

onMounted(() => {
  // Recien llegado o con modelos cambiados: se ubica solo
  const sinUbicar = p.modelos.some((m) => !p.racks.some((r) => r.modelo === m.id));
  if (!p.racks.length || sinUbicar) ubicar(false);
});

function ubicar(manual: boolean) {
  const existentes = p.racks.filter((r) => r.existente);
  const r = ubicarModelos(p.bodega, p.modelos, necesarios.value, { pallets: p.pallets, nuevoId, existentes });
  p.racks = [...existentes, ...r.racks];
  faltan.value = r.faltan;
  sel.value = null;
  if (manual) marcar('rack_add', { tipo: 'auto', racks: r.racks.length });
}
function medida(campo: 'ancho' | 'largo', e: Event) {
  const v = Number((e.target as HTMLInputElement).value);
  p.bodega[campo] = Math.min(200, Math.max(4, v || 4));
  p.bodega.forma = null;
  ubicar(false);
}
function mover(id: string, x: number, y: number) {
  p.racks = p.racks.map((r) => (r.id === id ? dentroDeBodega(normalizar({ ...r, x, y }), p.bodega) : r));
}
function girar(id: string) {
  p.racks = p.racks.map((r) => (r.id === id ? dentroDeBodega(normalizar({ ...r, rot: (r.rot + 90) % 360 }), p.bodega) : r));
}
function eliminar(id: string) {
  p.racks = p.racks.filter((r) => r.id !== id);
  if (sel.value === id) sel.value = null;
}

function agregarElemento(clase: typeof CLASES[number]) {
  const def = (ELEMENTOS as any)[clase], c = caja(contorno(p.bodega)), k = p.bodega.elementos.length;
  const junto = clase === 'porton' || clase === 'anden';
  const x = +((c.x0 + c.x1) / 2 + (k % 4) * 1.5).toFixed(1);
  const y = junto ? +(c.y1 - def.alto / 2).toFixed(2) : +((c.y0 + c.y1) / 2 + (k % 3) * 1.5).toFixed(1);
  const el = { id: nuevoId(), clase, x, y, ancho: def.ancho, alto: def.alto };
  p.bodega.elementos = [...p.bodega.elementos, el];
  elementoSel.value = el.id;
}
function cambiarElemento(cambio: Record<string, number>, id = elementoSel.value) {
  p.bodega.elementos = p.bodega.elementos.map((e: any) => (e.id === id ? { ...e, ...cambio } : e));
}
function quitarElemento(id: string) {
  p.bodega.elementos = p.bodega.elementos.filter((e: any) => e.id !== id);
  if (elementoSel.value === id) elementoSel.value = null;
}
function grillaPilares() {
  const c = caja(contorno(p.bodega));
  const pilares = (grillaPilaresXY(p.bodega, { pasoX: gp.pasoX, pasoY: gp.pasoY, offX: gp.pasoX, offY: gp.pasoY }) as any[])
    .map((q) => ({ id: nuevoId(), clase: 'pilar', x: q.x, y: q.y, ancho: 0.4, alto: 0.4 }))
    .filter((q) => q.x > c.x0 + 0.3 && q.x < c.x1 - 0.3 && q.y > c.y0 + 0.3 && q.y < c.y1 - 0.3);
  p.bodega.elementos = [...p.bodega.elementos.filter((e: any) => e.clase !== 'pilar'), ...pilares];
  ubicar(false);
}
function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>
