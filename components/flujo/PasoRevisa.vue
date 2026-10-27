<template>
  <div>
    <!-- Sin registro: dibujo, rack y 3D se ven libres; el registro va al final, en Cotiza (prompt de conversión §C) -->
      <h1 class="fl-titulo">Revisa tu diseño</h1>

      <!-- Revision del diseño: lo que bloquea no deja cotizar; cada aviso trae su arreglo -->
      <section :class="['mt-5 rounded-2xl p-5 ring-1', resumen.viable ? 'bg-green-50 ring-green-200' : 'bg-red-50 ring-red-200']" aria-live="polite">
        <p :class="['text-xl font-bold', resumen.viable ? 'text-green-900' : 'text-red-900']">
          {{ resumen.viable ? 'Tu diseño es viable ✓' : `Hay ${resumen.bloquea} ${resumen.bloquea === 1 ? 'punto' : 'puntos'} por resolver` }}
        </p>
        <p :class="resumen.viable ? 'text-green-800' : 'text-red-800'">
          {{ resumen.viable
            ? (resumen.advierte ? `Se puede fabricar y montar. Revisa ${resumen.advierte} ${resumen.advierte === 1 ? 'sugerencia' : 'sugerencias'}.` : 'Se puede fabricar y montar tal como está.')
            : 'Resuélvelos aquí o cotiza igual: tu ejecutivo los revisa contigo.' }}
        </p>
        <p class="mt-1 text-sm" :class="resumen.viable ? 'text-green-800' : 'text-red-800'">{{ TEXTO_INGENIERIA }}</p>
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

      <!-- Vista 3D grande con el tour guiado (revisión 27-10 §7): bodega, lo que ya tiene, carga, altura, maquinaria y cierre -->
      <div class="fl-card mt-6 !p-0 overflow-hidden">
        <div v-if="guion.escenas.length" class="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-3">
          <p class="mr-auto text-sm text-neutral-700">
            <b class="text-neutral-900">Recorrido de tu bodega</b> · {{ guion.escenas.length }} escenas, unos {{ Math.round(guion.duracion / 1000) }} s
            <span v-if="modoRecorrido" class="block text-brand-800">Para el ejecutivo: descarga el video y envíale el link al cliente junto con la cotización.</span>
          </p>
          <button v-if="!enTour" type="button" class="btn btn-primary !min-h-10 !px-4 !text-sm" :disabled="grabandoTour" @click="verTour">Ver el recorrido</button>
          <button v-if="modoRecorrido && visorRef?.puedeGrabar" type="button" class="btn btn-secondary !min-h-10 !px-4 !text-sm" :disabled="grabandoTour || enTour" :aria-busy="grabandoTour" @click="descargarTour">
            {{ grabandoTour ? 'Grabando video…' : 'Descargar video' }}
          </button>
        </div>
        <div class="h-[60vh] min-h-[380px]">
          <ClientOnly>
            <Visor3D ref="visorRef" :bodega="p.bodega" :racks="p.racks" :foco="foco" :guion="guion.escenas.length ? guion : null" etiqueta="Vista 3D de tu bodega" />
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
              <ul class="mt-1 list-disc space-y-0.5 pl-5 text-neutral-700"><li v-for="(l, i) in q.lineas" :key="i">{{ l }}</li></ul>
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

      <!-- Al final del flujo: sumar estanterías de los otros productos (dueño 27-10). Se arman y ubican como el primero -->
      <section v-if="otros.length" class="fl-card mt-8" aria-labelledby="fl-otros">
        <h2 id="fl-otros" class="text-lg font-bold text-neutral-900">¿También necesitas otro tipo de estantería?</h2>
        <p class="mt-1 text-sm text-neutral-600">Súmala a este mismo diseño y te cotizamos todo junto.</p>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div v-for="o in otros" :key="o.tipo" class="flex gap-3 rounded-xl p-3 ring-1 ring-neutral-200">
            <img :src="o.imagen" alt="" width="112" height="84" class="h-20 w-28 flex-shrink-0 rounded-lg bg-neutral-100 object-cover" loading="lazy">
            <div class="min-w-0">
              <p class="font-semibold text-neutral-900">{{ o.nombre }}</p>
              <p class="text-sm text-neutral-600">{{ o.uso }}</p>
              <button v-if="eligiendo !== o.tipo" type="button" class="fl-btn-sec mt-2 !min-h-9 !w-auto !px-3 !text-sm" :disabled="o.bloqueado" @click="eligiendo = o.tipo">+ Agregar {{ o.nombre.toLowerCase() }}</button>
              <p v-if="o.aviso" class="mt-1 text-xs text-amber-800">{{ o.aviso }}</p>
            </div>
          </div>
        </div>

        <!-- Con qué carga va: el mismo pallet o uno nuevo; en ángulo ranurado, las mismas cajas o cambiarlas (dueño 27-10) -->
        <div v-if="eligiendo" class="mt-4 rounded-xl bg-brand-50/60 p-4 ring-1 ring-brand-200" aria-live="polite">
          <template v-if="eligiendo !== 'AR'">
            <p class="font-semibold text-neutral-900">¿Qué pallet va en el {{ nombreDe(eligiendo).toLowerCase() }}?</p>
            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              <button v-for="t in p.pallets" :key="t.id" type="button" class="fl-opcion !min-h-0 !p-3 text-left" @click="conPallet(eligiendo, t.id)">
                <span class="block text-sm font-semibold text-neutral-900">El mismo: {{ t.nombre }}</span>
                <span class="block text-xs text-neutral-600">{{ fm(t.frente) }} × {{ fm(t.fondo) }} m · {{ fm(t.alto) }} m de alto · {{ n(t.peso) }} kg</span>
              </button>
              <button type="button" class="fl-opcion !min-h-0 !p-3 text-left" @click="conPallet(eligiendo, null)">
                <span class="block text-sm font-semibold text-neutral-900">+ Configurar un pallet nuevo</span>
                <span class="block text-xs text-neutral-600">Medidas, alto y peso del otro pallet</span>
              </button>
            </div>
          </template>
          <template v-else>
            <p class="font-semibold text-neutral-900">¿Qué cajas van en las bandejas?</p>
            <p v-if="cajasBase.length" class="mt-1 text-sm text-neutral-700">Proyectamos con {{ cajasBase.length === 1 ? 'tu caja' : 'tus cajas' }}: {{ cajasBase.map((c) => `${cm(c.largo)} × ${cm(c.ancho)} × ${cm(c.alto)} cm`).join(' · ') }}.</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button v-if="cajasBase.length" type="button" class="fl-btn !min-h-10 !w-auto !px-4 !text-sm" @click="conCajas(true)">Usar las mismas cajas</button>
              <button type="button" :class="[cajasBase.length ? 'fl-btn-sec' : 'fl-btn', '!min-h-10 !w-auto !px-4 !text-sm']" @click="conCajas(false)">{{ cajasBase.length ? 'Cambiar las cajas' : 'Configurar mis cajas' }}</button>
            </div>
          </template>
          <button type="button" class="mt-3 text-sm font-medium text-neutral-500 underline underline-offset-2" @click="eligiendo = null">Cancelar</button>
        </div>
      </section>

      <!-- Nadie se queda atascado: con puntos por resolver igual se cotiza; el lead llega con "Viabilidad: con puntos por
           resolver" y el ejecutivo los revisa con el cliente (antes, un aviso sin arreglo de un toque bloqueaba aquí) -->
      <FlujoAcciones
        :texto="resumen.viable ? 'Pedir mi cotización' : 'Cotizar igual'" @atras="emit('atras')" @siguiente="seguir"
      />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useProyecto } from '~/stores/proyecto';
import { normalizar, formatoM, TIPOS, gruaDriveIn } from '~/lib/rack3d/planificador.js';
import { GRUAS } from '~/lib/rack3d/parametrosTecnicos.js';
import { revisarDiseno, resumenViabilidad, aplicarArreglo } from '~/lib/rack3d/viabilidad.js';
import { vistasPorRol, focoDiseño } from '~/lib/flujo/perfiles.js';
import { guardarCaptura } from '~/lib/flujo/captura.js';
import { auditarDiseno } from '~/lib/flujo/auditoria.js';
import { TEXTO_INGENIERIA } from '~/lib/flujo/conversion.js';
import { guionTour } from '~/lib/flujo/guion.js';

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
const visorRef = ref<{
  captura: () => string | null; puedeGrabar: boolean; detenerTour: () => void;
  verTour: () => Promise<boolean>; grabarTour: () => Promise<{ blob: Blob; extension: string } | null>;
} | null>(null);
// Tour guiado: una escena por tema, con los números de la misma cuenta que el resumen
const guion = computed(() => guionTour(p) as { escenas: any[]; duracion: number });
const enTour = ref(false), grabandoTour = ref(false);

// Productos que todavía no están en el diseño: se ofrecen al final para cotizar todo junto
const USO: Record<string, string> = {
  RS: 'Pallets con acceso directo a cada uno: muchos productos distintos.',
  DI: 'Muchos pallets de un mismo producto, guardados uno detrás de otro.',
  AR: 'Cajas y productos sueltos que se sacan a mano.',
};
const otros = computed(() => (['RS', 'DI', 'AR'] as const)
  .filter((t) => !p.modelos.some((m) => m.tipo === t))
  .map((t) => {
    const di = t === 'DI' ? gruaDriveIn({ grua: p.bodega.grua }) as { puede: boolean; motivo?: string } : null;
    return { tipo: t, nombre: (TIPOS as any)[t].nombre as string, imagen: (TIPOS as any)[t].imagen as string, uso: USO[t],
      // Drive-in con un equipo que no entra a la calle: no se ofrece (en el rack quedaba bloqueado sin salida)
      bloqueado: !!(di && !di.puede),
      aviso: di && !di.puede ? `Tu equipo no sirve para drive-in${di.motivo ? `: ${di.motivo}` : ''}. Cámbialo en el paso 1 si tienes otro.` : '' };
  }));
const eligiendo = ref<'RS' | 'DI' | 'AR' | null>(null);
const nombreDe = (t: string) => (TIPOS as any)[t].nombre as string;
const cm = (v: number) => Math.round(v * 100);
// Cajas para el ángulo ranurado: las que ya cargó o, si no, las de sus pallets armados desde caja
const cajasBase = computed(() => (p.cajas.length ? p.cajas
  : p.pallets.filter((t) => t.desdeCaja && t.caja).map((t) => ({ ...t.caja!, nombre: `Caja de ${t.nombre}` }))) as any[]);
function ir(paso: 'pallets' | 'rack', t: string, como: string) {
  marcar('agregar_producto', { tipo: t, desde: 'revisa', como });
  eligiendo.value = null;
  // Se arma (paso 4) y se ubica (paso 5) como el primero; con pallet o cajas nuevas, antes el paso 3
  p.ir(paso);
  window.scrollTo({ top: 0 });
}
function conPallet(t: 'RS' | 'DI', idPallet: string | null) {
  const pallet = idPallet ? p.pallets.find((x) => x.id === idPallet) : p.agregarPallet({ nombre: `Pallet ${p.pallets.length + 1}` });
  const m = p.agregarModelo(t);
  // Solo ese pallet en la estantería nueva; la cantidad se pregunta al armarla (o viene del pallet nuevo)
  p.cambiarModelo(m.id, { cantidades: { [pallet!.id]: idPallet ? 0 : pallet!.cantidad } });
  ir(idPallet ? 'rack' : 'pallets', t, idPallet ? 'mismo_pallet' : 'pallet_nuevo');
}
function conCajas(mismas: boolean) {
  if (!p.cajas.length) {
    if (mismas) cajasBase.value.forEach((c: any) => p.agregarCaja({ nombre: c.nombre, largo: c.largo, ancho: c.ancho, alto: c.alto, peso: c.peso, apilable: c.apilable }));
    else p.agregarCaja();
  }
  const m = p.agregarModelo('AR');
  p.cambiarModelo(m.id, { cantidades: Object.fromEntries(p.cajas.map((c) => [c.id, c.cantidad])) });
  if (!mismas) useState('pallets-abrir-cajas', () => false).value = true;
  ir(mismas ? 'rack' : 'pallets', 'AR', mismas ? 'mismas_cajas' : 'cambiar_cajas');
}
// El video lo graba y lo envía el ejecutivo (link del lead, ?recorrido=1); el cliente ve el recorrido en pantalla
const modoRecorrido = useState('modo-recorrido', () => false);
async function verTour() {
  if (!visorRef.value) return;
  enTour.value = true;
  marcar('tour_video', { accion: 'ver' });
  try { await visorRef.value.verTour(); } finally { enTour.value = false; }
}
async function descargarTour() {
  if (!visorRef.value || grabandoTour.value) return;
  grabandoTour.value = true;
  try {
    const r = await visorRef.value.grabarTour();
    if (!r?.blob.size) return;
    const url = URL.createObjectURL(r.blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `recorrido-tu-bodega-racklog.${r.extension}` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    marcar('tour_video', { accion: 'descargar', formato: r.extension });
  } finally { grabandoTour.value = false; }
}
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
