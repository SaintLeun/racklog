<template>
  <div>
    <FlujoRegistro v-if="!p.registrado" @listo="marcar('kpi_view', { rol: p.rol })" />
    <template v-else>
      <h1 class="fl-titulo">Revisa tu diseño</h1>

      <!-- Revision del diseño: lo que bloquea no deja cotizar; cada aviso trae su arreglo -->
      <section :class="['mt-5 rounded-2xl p-5 ring-1', resumen.viable ? 'bg-green-50 ring-green-200' : 'bg-red-50 ring-red-200']" aria-live="polite">
        <p :class="['text-xl font-bold', resumen.viable ? 'text-green-900' : 'text-red-900']">
          {{ resumen.viable ? 'Tu diseño es viable ✓' : `Hay ${resumen.bloquea} ${resumen.bloquea === 1 ? 'punto' : 'puntos'} por resolver` }}
        </p>
        <p :class="resumen.viable ? 'text-green-800' : 'text-red-800'">
          {{ resumen.viable
            ? (resumen.advierte ? `Se puede fabricar y montar. Revisa ${resumen.advierte} ${resumen.advierte === 1 ? 'sugerencia' : 'sugerencias'}.` : 'Se puede fabricar y montar tal como está.')
            : 'Resuélvelos con un toque para poder cotizar.' }}
        </p>
        <p v-if="resumen.viable" class="mt-1 text-sm text-green-800">Revisado por un ingeniero Racklog antes de cotizar · Diseño sísmico NCh2369.</p>
        <TransitionGroup tag="ul" name="fl-lista" class="mt-4 space-y-2">
          <li v-for="a in avisos" :key="a.id" class="flex flex-col gap-2 rounded-xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <span class="flex gap-2 text-neutral-800">
              <span :class="['mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full', a.nivel === 'bloquea' ? 'bg-red-500' : 'bg-amber-400']" aria-hidden="true" />
              <span><span class="sr-only">{{ a.nivel === 'bloquea' ? 'Bloquea:' : 'Sugerencia:' }}</span>{{ a.mensaje }}</span>
            </span>
            <button v-if="a.arreglo" type="button" class="fl-chip !min-h-10 !w-auto flex-shrink-0 !px-4 !text-sm" @click="arreglar(a)">{{ a.comoArreglar || 'Arreglar' }}</button>
            <span v-else-if="a.comoArreglar" class="text-sm text-neutral-500">{{ a.comoArreglar }}</span>
          </li>
        </TransitionGroup>
      </section>

      <!-- Lo que gana, en palabras simples, y antes / despues -->
      <section class="mt-6 rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
        <p class="text-[22px] font-bold leading-snug text-neutral-900">
          Guardas <FlujoContador :valor="conRacklog" /> pallets<template v-if="hoy && conRacklog > hoy">, {{ mas }} % más que hoy</template>{{ resumen.viable ? `, y tu ${grua.nombre.toLowerCase()} opera sin problema` : '' }}.
        </p>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-neutral-50 p-3">
            <p class="text-sm text-neutral-500">Tu bodega hoy</p>
            <p v-if="hoy" class="text-2xl font-bold text-neutral-700">{{ n(hoy) }} <span class="text-sm font-normal">posiciones</span></p>
            <label v-else class="mt-1 block text-sm text-neutral-600">¿Cuántas posiciones tienes hoy?
              <input type="number" min="0" class="form-input mt-1 !h-10" @change="p.posicionesHoy = Math.max(0, Number(($event.target as HTMLInputElement).value) || 0)">
            </label>
          </div>
          <div class="rounded-xl bg-brand-50 p-3 ring-1 ring-brand-200">
            <p class="text-sm text-brand-800">Con Racklog</p>
            <p class="text-2xl font-bold text-brand-800"><FlujoContador :valor="conRacklog" /> <span class="text-sm font-normal">posiciones</span></p>
            <p v-if="hoy && conRacklog > hoy" class="text-sm font-semibold text-green-700">+{{ mas }} %</p>
          </div>
        </div>
      </section>

      <!-- Vista 3D grande: la bodega con sus racks y la grua operando -->
      <div class="fl-card mt-6 !p-0 overflow-hidden">
        <div class="h-[60vh] min-h-[380px]">
          <ClientOnly>
            <Visor3D :bodega="p.bodega" :racks="p.racks" etiqueta="Vista 3D de tu bodega" />
          </ClientOnly>
        </div>
      </div>

      <!-- Vista por rol -->
      <div class="mt-8 flex gap-1 rounded-xl bg-neutral-100 p-1" role="tablist" aria-label="Ver resultados como">
        <button v-for="r in ROLES" :key="r.v" type="button" role="tab" :aria-selected="rol === r.v" :class="['flex-1 rounded-lg px-2 py-2.5 text-sm font-semibold transition', rol === r.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="rol = r.v">{{ r.t }}</button>
      </div>

      <div class="mt-4">
        <div class="fl-card">
          <template v-if="rol === 'supply'">
            <p class="fl-leyenda">Capacidad y crecimiento</p>
            <dl class="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
              <div class="fl-dato"><dt>Posiciones nuevas</dt><dd><FlujoContador :valor="k.posiciones" /></dd></div>
              <div class="fl-dato"><dt>Pallets que necesitas hoy</dt><dd><FlujoContador :valor="necesidad" /></dd></div>
              <div class="fl-dato"><dt>Holgura para crecer</dt><dd>{{ holgura }}</dd></div>
              <div class="fl-dato"><dt>Bodega</dt><dd>{{ n(m2) }} m²</dd></div>
              <div class="fl-dato"><dt>Posiciones por m²</dt><dd>{{ d2(m2 ? k.posiciones / m2 : 0) }}</dd></div>
              <div class="fl-dato"><dt>Piso con racks</dt><dd>{{ m2 ? Math.round((k.piso / m2) * 100) : 0 }} %</dd></div>
            </dl>
          </template>
          <template v-else-if="rol === 'bodega'">
            <p class="fl-leyenda">Operación</p>
            <dl class="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
              <div class="fl-dato"><dt>Posiciones</dt><dd><FlujoContador :valor="k.posiciones" /></dd></div>
              <div class="fl-dato"><dt>Cuerpos / calles</dt><dd>{{ k.cuerpos + k.calles }}</dd></div>
              <div class="fl-dato"><dt>Pasillos</dt><dd>{{ lp.length }} · mín. {{ fm(minPasillo) }} m</dd></div>
              <div class="fl-dato"><dt>Tu equipo pide</dt><dd>{{ fm(grua.pasillo) }} m</dd></div>
              <div class="fl-dato"><dt>Nivel más alto</dt><dd>{{ fm(altoMax) }} m</dd></div>
              <div class="fl-dato"><dt>Tu equipo llega a</dt><dd>{{ fm(grua.levante) }} m</dd></div>
            </dl>
          </template>
          <template v-else>
            <p class="fl-leyenda">Qué cotizar</p>
            <div v-for="q in cotizar" :key="q.modelo" class="mt-3">
              <p class="font-semibold text-neutral-900">{{ q.nombre }}</p>
              <ul class="mt-1 list-disc space-y-0.5 pl-5 text-neutral-700"><li v-for="(l, i) in q.lineas" :key="i">{{ l }}</li></ul>
            </div>
            <p v-if="textoAcc" class="mt-4 border-t border-neutral-100 pt-3 text-neutral-700"><b>Accesorios:</b> {{ textoAcc }}</p>
          </template>
        </div>
      </div>

      <FlujoAcciones
        texto="Pedir mi cotización" :deshabilitado="!resumen.viable"
        motivo="Resuelve los puntos en rojo para cotizar." @atras="emit('atras')" @siguiente="emit('siguiente')"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useProyecto } from '~/stores/proyecto';
import { area, contorno, normalizar, formatoM } from '~/lib/rack3d/planificador.js';
import { GRUAS } from '~/lib/rack3d/parametrosTecnicos.js';
import { pasillos } from '~/lib/rack3d/pasillos.js';
import { kpisPorSistema } from '~/lib/rack3d/kpis.js';
import { alturaUltimoNivel } from '~/lib/rack3d/operacion.js';
import { revisarDiseno, resumenViabilidad, aplicarArreglo } from '~/lib/rack3d/viabilidad.js';
import { proponerAccesorios, aplicarAjustes, textoAccesorios } from '~/lib/rack3d/accesorios.js';
import { queCotizar, conteoTotal } from '~/lib/flujo/calculos.js';

const emit = defineEmits<{ siguiente: []; atras: [] }>();
const p = useProyecto();
const ROLES = [{ v: 'supply', t: 'Gerencia' }, { v: 'bodega', t: 'Bodega' }, { v: 'compras', t: 'Compras' }];
const rol = ref(['supply', 'bodega', 'compras'].includes(p.rol || p.lead.perfil) ? (p.rol || p.lead.perfil) : 'bodega');
const fm = (v: number) => formatoM(v || 0);
const n = (v: number) => Math.round(v).toLocaleString('es-CL');
const d2 = (v: number) => v.toLocaleString('es-CL', { maximumFractionDigits: 2 });

const accesorios = computed(() => aplicarAjustes(proponerAccesorios({ bodega: p.bodega, racks: p.racks, pallets: p.pallets }), p.accesorios) as any[]);
const textoAcc = computed(() => textoAccesorios(accesorios.value) as string);
const avisos = computed(() => (revisarDiseno({ bodega: p.bodega, racks: p.racks, pallets: p.pallets, accesorios: p.accesorios }) as any[])
  .sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'bloquea' ? -1 : 1)));
const resumen = computed(() => resumenViabilidad(avisos.value) as { viable: boolean; bloquea: number; advierte: number });

// Misma cuenta que los pasos 3 y 5 y la cotizacion; piso ocupado desde los KPI
const k = computed(() => ({ ...conteoTotal(p.racks.filter((r) => !r.existente)), piso: (kpisPorSistema(p.racks).global.nuevo as any).piso, calles: 0 }));
const m2 = computed(() => area(contorno(p.bodega)));
const necesidad = computed(() => p.pallets.reduce((t, x) => t + (x.cantidad || 0), 0));
const holgura = computed(() => (necesidad.value ? `${Math.round(((k.value.posiciones - necesidad.value) / necesidad.value) * 100)} %` : '—'));
const lp = computed(() => pasillos(p.racks, p.bodega) as any[]);
const minPasillo = computed(() => (lp.value.length ? Math.min(...lp.value.map((x) => x.libre)) : 0));
const grua = computed(() => (GRUAS as any)[p.bodega.grua] ?? GRUAS.contrapeso);
// Posiciones que ya tiene hoy (lo que dijo, sus importaciones o sus racks existentes) y con Racklog
// (las nuevas mas las de los racks que conserva)
const existentes = computed(() => conteoTotal(p.racks.filter((r) => r.existente)).posiciones);
const hoy = computed(() => p.posicionesHoy || p.pallets.reduce((t, x: any) => t + (x.importacion?.actuales || 0), 0) || existentes.value);
const conRacklog = computed(() => k.value.posiciones + existentes.value);
const mas = computed(() => Math.round(((conRacklog.value - hoy.value) / Math.max(1, hoy.value)) * 100));
const altoMax = computed(() => Math.max(0, ...p.racks.filter((r) => r.tipo !== 'AR').map((r) => alturaUltimoNivel(r))));
const cotizar = computed(() => queCotizar(p.modelos, p.racks) as any[]);

function arreglar(a: any) {
  const r = aplicarArreglo({ bodega: p.bodega, racks: p.racks, quitados: p.accesorios.quitados }, a.arreglo) as any;
  p.racks = r.racks.map((x: any) => normalizar(x));
  Object.assign(p.bodega, r.bodega);
  p.accesorios.quitados = r.quitados;
  marcar('arreglo', { regla: a.regla });
}
function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>
