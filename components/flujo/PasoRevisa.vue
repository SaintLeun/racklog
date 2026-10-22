<template>
  <div>
    <template v-if="!p.registrado">
      <!-- Adelanto: lo que gana, antes de pedir sus datos. El plano, la lista y el link se abren al registrarse -->
      <section class="fl-card mb-6 !p-0 overflow-hidden">
        <div class="p-5">
          <p class="text-sm font-semibold uppercase tracking-wider text-brand-700">Adelanto de tu diseño</p>
          <p class="mt-1 text-[22px] font-bold leading-snug text-neutral-900">Te caben <FlujoContador :valor="conRacklog" /> pallets</p>
          <p v-if="necesidad" class="text-neutral-600">Necesitas {{ n(necesidad) }}.</p>
        </div>
        <div class="relative h-[38vh] min-h-[240px]">
          <ClientOnly>
            <Visor3D :bodega="p.bodega" :racks="p.racks" :foco="foco" adelanto etiqueta="Adelanto 3D de tu bodega" />
          </ClientOnly>
          <p class="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl bg-white/90 px-3 py-2 text-center text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-black/5">
            🔒 El plano con medidas, la lista para cotizar y el link a tu diseño se abren al registrarte.
          </p>
        </div>
      </section>
      <FlujoRegistro @listo="marcar('kpi_view', { rol: p.rol })" />
    </template>
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

      <!-- Auditoría de KPI: el dibujo contra las medidas y cantidades que dio el cliente -->
      <details class="fl-card fl-auditoria mt-6" :open="auditoria.fallas > 0 || undefined">
        <summary class="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
          <span>
            <span class="fl-leyenda block">¿Tu dibujo cumple con tus pallets?</span>
            <span :class="['mt-1 block text-lg font-bold', auditoria.fallas ? 'text-red-800' : 'text-green-800']">
              {{ auditoria.fallas ? `${auditoria.fallas} de ${auditoria.total} puntos no cumplen` : `Cumple ${auditoria.cumple} de ${auditoria.total} puntos ✓` }}
            </span>
          </span>
          <span class="text-sm font-medium text-brand-700 underline underline-offset-2">Ver auditoría</span>
        </summary>
        <div v-for="(filas, grupo) in auditoriaPorGrupo" :key="grupo" class="mt-4">
          <p class="text-sm font-semibold text-neutral-900">{{ grupo }}</p>
          <ul class="mt-1 divide-y divide-neutral-100">
            <li v-for="f in filas" :key="f.id" class="grid grid-cols-[1.25rem_1fr] gap-x-2 py-2 text-sm sm:grid-cols-[1.25rem_12rem_1fr_1fr]">
              <span :class="['font-bold', f.nivel === 'ok' ? 'text-green-600' : f.nivel === 'aviso' ? 'text-amber-500' : 'text-red-600']" :aria-label="f.nivel === 'ok' ? 'Cumple' : 'No cumple'">{{ f.nivel === 'ok' ? '✓' : f.nivel === 'aviso' ? '!' : '✗' }}</span>
              <span class="font-medium text-neutral-800">{{ f.titulo }}</span>
              <span class="col-start-2 text-neutral-500 sm:col-start-auto"><span class="sm:hidden">Pide: </span>{{ f.pide }}</span>
              <span :class="['col-start-2 sm:col-start-auto', f.nivel === 'ok' ? 'text-neutral-700' : 'font-medium text-red-700']"><span class="sm:hidden">Dibujo: </span>{{ f.dibujo }}</span>
            </li>
          </ul>
        </div>
        <p v-if="auditoria.fallas" class="mt-3 text-sm text-neutral-600">Vuelve a <button type="button" class="font-medium text-brand-700 underline" @click="p.ir('rack')">Arma tu rack</button> o a <button type="button" class="font-medium text-brand-700 underline" @click="p.ir('bodega')">Tu bodega</button> para corregirlo.</p>
      </details>

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
            <Visor3D ref="visorRef" :bodega="p.bodega" :racks="p.racks" :foco="foco" etiqueta="Vista 3D de tu bodega" />
          </ClientOnly>
        </div>
      </div>

      <!-- Vista por rol -->
      <div class="mt-8 flex gap-1 rounded-xl bg-neutral-100 p-1" role="tablist" aria-label="Ver resultados como">
        <button v-for="r in ROLES" :key="r.v" type="button" role="tab" :aria-selected="rol === r.v" :class="['flex-1 rounded-lg px-2 py-2.5 text-sm font-semibold transition', rol === r.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="rol = r.v">{{ r.t }}</button>
      </div>

      <div class="mt-4">
        <div class="fl-card">
          <!-- Gerencia: hoy vs Racklog, crecimiento y capacidad útil, todo en positivo (sin precios) -->
          <template v-if="rol === 'supply'">
            <p class="fl-leyenda">Hoy vs Racklog</p>
            <p class="mt-2 text-lg text-neutral-800">
              <template v-if="g.hoy">De <b>{{ n(g.hoy) }}</b> a <b class="text-brand-800">{{ n(g.conRacklog) }}</b> posiciones: <b class="text-green-700">+{{ n(g.mas) }} (+{{ g.masPct }} %)</b></template>
              <template v-else><b class="text-brand-800">{{ n(g.conRacklog) }}</b> posiciones con Racklog. Dinos cuántas tienes hoy (arriba) para comparar.</template>
            </p>
            <p class="fl-leyenda mt-6">Crecimiento</p>
            <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-700">
              Tu operación crece al año:
              <button v-for="c in [0, 0.1, 0.2, 0.3]" :key="c" type="button" :class="['fl-chip !min-h-9 !w-auto !px-3 !text-sm', p.crecimiento === c && 'fl-chip--sel']" @click="p.crecimiento = c">{{ Math.round(c * 100) }} %</button>
            </div>
            <dl class="mt-3 grid grid-cols-3 gap-3">
              <div v-for="x in g.anios" :key="x.t" class="fl-dato">
                <dt>{{ x.t }} necesitas</dt><dd>{{ n(x.necesitas) }}</dd>
                <p :class="['text-xs font-medium', x.cubre ? 'text-green-700' : 'text-neutral-600']">{{ x.cubre ? 'Cubierto ✓' : 'Para la fase 2' }}</p>
              </div>
            </dl>
            <p class="fl-leyenda mt-6">Capacidad útil</p>
            <dl class="mt-2 grid grid-cols-2 gap-3">
              <div class="fl-dato"><dt>Bodega usada</dt><dd>{{ g.usadoPct }} %</dd><p class="text-xs text-neutral-500">de {{ n(g.m2) }} m²</p></div>
              <div class="fl-dato"><dt>Libre para crecer</dt><dd class="!text-green-700">{{ n(g.libre) }} m²</dd><p v-if="g.fase2" class="text-xs text-neutral-500">≈ {{ n(g.fase2) }} posiciones más en una fase 2</p></div>
            </dl>
            <p class="mt-4 text-sm text-neutral-600">{{ g.plazo }}.</p>
          </template>
          <!-- Jefe de bodega: dónde queda cada producto, pasillos y alturas en metros -->
          <template v-else-if="rol === 'bodega'">
            <p class="fl-leyenda">Dónde queda cada producto</p>
            <ul class="mt-2 space-y-1.5">
              <li v-for="x in bo.productos" :key="x.id" class="flex items-start gap-2 text-neutral-800">
                <span class="mt-1.5 h-3 w-3 flex-shrink-0 rounded-sm" :style="{ background: x.color }" aria-hidden="true" />
                <span><b>{{ x.nombre }}</b>: {{ x.donde }}, {{ x.niveles }}</span>
              </li>
            </ul>
            <p class="fl-leyenda mt-6">Alturas</p>
            <ul class="mt-2 space-y-1 text-neutral-800">
              <li v-for="a in bo.alturas" :key="a.nombre">{{ a.nombre }}: niveles en {{ a.niveles.join(' · ') }} m (marco de {{ a.marco }} m)</li>
            </ul>
            <dl class="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              <div class="fl-dato"><dt>Pasillos</dt><dd>{{ bo.pasillos.n }}</dd><p class="text-xs text-neutral-500">de {{ bo.pasillos.anchos.join(' / ') || '—' }} m</p></div>
              <div class="fl-dato"><dt>Tu equipo pide<FlujoReferencial :de="GRUAS[p.bodega.grua as keyof typeof GRUAS] ?? GRUAS.contrapeso" /></dt><dd>{{ fm(bo.pasillos.pide) }} m</dd><p :class="['text-xs font-medium', bo.pasillos.angostos ? 'text-red-700' : 'text-green-700']">{{ bo.pasillos.angostos ? `${bo.pasillos.angostos} angosto(s)` : 'Todos los pasillos sirven ✓' }}</p></div>
              <div class="fl-dato"><dt>Nivel más alto</dt><dd>{{ fm(bo.nivelMax) }} m</dd><p :class="['text-xs font-medium', bo.alcanza ? 'text-green-700' : 'text-red-700']">{{ bo.alcanza ? `Tu ${bo.equipo.toLowerCase()} llega (${fm(bo.levante)} m) ✓` : `Tu equipo llega a ${fm(bo.levante)} m` }}</p></div>
            </dl>
            <p class="mt-3 text-sm text-neutral-500">En la vista 3D de arriba ves la grúa trabajando en tus pasillos.</p>
          </template>
          <!-- Compras: especificación para comparar proveedores -->
          <template v-else>
            <p class="fl-leyenda">Qué cotizar</p>
            <div v-for="q in co.cotizar" :key="q.modelo" class="mt-3">
              <p class="font-semibold text-neutral-900">{{ q.nombre }}</p>
              <ul class="mt-1 list-disc space-y-0.5 pl-5 text-neutral-700"><li v-for="(l, i) in q.lineas" :key="i">{{ l }}<FlujoInfo v-if="l.includes('pares de vigas')" class="ml-1">Código del perfil de viga de Racklog: el número es la altura del perfil en mm (70, 100, 125 o 150). Lo elige el cálculo según el peso de tus pallets.</FlujoInfo></li></ul>
            </div>
            <template v-if="co.accesorios.length">
              <p class="fl-leyenda mt-6">Accesorios</p>
              <table class="mt-2 w-full text-sm">
                <tbody>
                  <tr v-for="a in co.accesorios" :key="a.nombre" class="border-b border-neutral-100">
                    <td class="py-1.5 text-neutral-800">{{ a.nombre }}<span v-if="a.medida" class="text-neutral-500"> · {{ a.medida }}</span></td>
                    <td class="py-1.5 text-right font-semibold tabular-nums text-neutral-900">{{ a.cantidad }}</td>
                  </tr>
                </tbody>
              </table>
            </template>
            <dl class="mt-6 space-y-2 text-sm">
              <div class="flex justify-between gap-3"><dt class="text-neutral-500">Norma</dt><dd class="text-right font-medium text-neutral-900">{{ co.norma }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-neutral-500">Peso de acero</dt><dd class="text-right font-medium text-neutral-900">{{ co.pesoAcero }}</dd></div>
            </dl>
          </template>
        </div>
      </div>

      <FlujoAcciones
        texto="Pedir mi cotización" :deshabilitado="!resumen.viable"
        motivo="Resuelve los puntos en rojo para cotizar." @atras="emit('atras')" @siguiente="seguir"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useProyecto } from '~/stores/proyecto';
import { normalizar, formatoM } from '~/lib/rack3d/planificador.js';
import { GRUAS } from '~/lib/rack3d/parametrosTecnicos.js';
import { revisarDiseno, resumenViabilidad, aplicarArreglo } from '~/lib/rack3d/viabilidad.js';
import { vistasPorRol, focoDiseño } from '~/lib/flujo/perfiles.js';
import { guardarCaptura } from '~/lib/flujo/captura.js';
import { auditarDiseno } from '~/lib/flujo/auditoria.js';

const emit = defineEmits<{ siguiente: []; atras: [] }>();
const p = useProyecto();
const ROLES = [{ v: 'supply', t: 'Gerencia' }, { v: 'bodega', t: 'Bodega' }, { v: 'compras', t: 'Compras' }];
const rol = ref(['supply', 'bodega', 'compras'].includes(p.rol || p.lead.perfil) ? (p.rol || p.lead.perfil) : 'bodega');
const fm = (v: number) => formatoM(v || 0);
const n = (v: number) => Math.round(v).toLocaleString('es-CL');

const avisos = computed(() => (revisarDiseno({ bodega: p.bodega, racks: p.racks, pallets: p.pallets, accesorios: p.accesorios }) as any[])
  .sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'bloquea' ? -1 : 1)));
const resumen = computed(() => resumenViabilidad(avisos.value) as { viable: boolean; bloquea: number; advierte: number });
const grua = computed(() => (GRUAS as any)[p.bodega.grua] ?? GRUAS.contrapeso);
// Auditoría de KPI (lib/flujo/auditoria.js): medidas de pallet, cantidades y una sola cuenta
const auditoria = computed(() => auditarDiseno(p) as { filas: any[]; total: number; cumple: number; fallas: number; avisos: number });
const auditoriaPorGrupo = computed(() => auditoria.value.filas.reduce((g: Record<string, any[]>, f) => { (g[f.grupo] ||= []).push(f); return g; }, {}));
const necesidad = computed(() => p.pallets.reduce((t, x) => t + (x.cantidad || 0), 0));
// Lo que ve cada perfil: una sola cuenta (lib/flujo/perfiles.js)
const vistas = computed(() => vistasPorRol(p) as any);
// La vista 3D encuadra lo diseñado (no la bodega vacía)
const foco = computed(() => focoDiseño(p.racks, p.bodega) as any);
const g = computed(() => vistas.value.gerencia);
const bo = computed(() => vistas.value.bodega);
const co = computed(() => vistas.value.compras);
// Hoy y con Racklog (lo que dijo, sus importaciones o sus racks existentes; las nuevas más las que conserva)
const hoy = computed(() => g.value.hoy as number);
const conRacklog = computed(() => g.value.conRacklog as number);
const mas = computed(() => g.value.masPct as number);

// La foto del 3D que ya está armado queda guardada para el link compartido
const visorRef = ref<{ captura: () => string | null } | null>(null);
function seguir() {
  try { guardarCaptura(p, visorRef.value?.captura() ?? null); } catch { /* sin foto: el paso 7 la arma */ }
  emit('siguiente');
}
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
