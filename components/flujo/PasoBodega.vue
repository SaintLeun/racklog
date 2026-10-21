<template>
  <div>
    <h1 class="fl-titulo">Tu bodega</h1>
    <p class="fl-bajada">Pon las medidas y marca por dónde circulan las grúas y las personas. Tus racks se ubican solos con sus pasillos; después puedes moverlos, girarlos y repetirlos en bloque.</p>

    <div class="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
      <div class="space-y-4">
        <!-- Medidas -->
        <section class="fl-card">
          <p class="fl-leyenda">Medidas</p>
          <div class="mt-3 grid grid-cols-2 gap-3">
            <label class="fl-campo"><span>Ancho (m)</span><input :value="p.bodega.ancho" type="number" min="4" max="200" step="0.5" inputmode="decimal" class="form-input" @change="medida('ancho', $event)"></label>
            <label class="fl-campo"><span>Largo (m)</span><input :value="p.bodega.largo" type="number" min="4" max="200" step="0.5" inputmode="decimal" class="form-input" @change="medida('largo', $event)"></label>
          </div>
          <p class="mt-3 text-sm text-neutral-500">Altura libre: {{ p.bodega.altura ? `${fm(p.bodega.altura)} m` : 'sin dato' }} · {{ grua.nombre }} (pasillo mín. {{ fm(grua.pasillo) }} m)</p>
        </section>

        <!-- Circulacion -->
        <section class="fl-card">
          <p class="fl-leyenda">Circulación</p>
          <p class="mt-1 text-sm text-neutral-600">Por dónde se mueven las grúas y las personas, y lo que no se puede usar.</p>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <button type="button" class="fl-chip !min-h-11 !text-sm" @click="agregarElemento('pasilloGrua')"><span class="mr-1.5 h-3 w-3 rounded-sm bg-amber-300" aria-hidden="true" />Pasillo de grúa</button>
            <button type="button" class="fl-chip !min-h-11 !text-sm" @click="agregarElemento('pasilloPeatonal')"><span class="mr-1.5 h-3 w-3 rounded-sm bg-green-300" aria-hidden="true" />Pasillo peatonal</button>
            <button type="button" class="fl-chip !min-h-11 !text-sm" @click="agregarElemento('zona')"><span class="mr-1.5 h-3 w-3 rounded-sm bg-red-300" aria-hidden="true" />Zona bloqueada</button>
            <button type="button" class="fl-chip !min-h-11 !text-sm" @click="agregarElemento('grua')"><span class="mr-1.5 h-3 w-3 rounded-sm bg-yellow-400" aria-hidden="true" />Grúa</button>
          </div>
          <label class="mt-4 flex items-start gap-2 text-sm text-neutral-700">
            <input v-model="reacomodar" type="checkbox" class="mt-0.5 h-4 w-4 accent-brand-600">
            <span>Reacomodar mis racks cuando muevo o cambio un pasillo</span>
          </label>
        </section>

        <!-- Elementos -->
        <section class="fl-card">
          <p class="fl-leyenda">Tu bodega tiene</p>
          <div class="mt-3 grid grid-cols-3 gap-2">
            <button v-for="cl in (['porton', 'anden', 'oficina'] as const)" :key="cl" type="button" class="fl-chip !min-h-11 !text-sm" @click="agregarElemento(cl)">{{ ELEMENTOS[cl].nombre }}</button>
          </div>
          <form class="mt-4 grid grid-cols-[1fr_1fr_auto] items-end gap-2" @submit.prevent="grillaPilares">
            <label class="fl-campo"><span class="!text-sm">Pilares cada X (m)</span><input v-model.number="gp.pasoX" type="number" min="2" step="0.5" class="form-input"></label>
            <label class="fl-campo"><span class="!text-sm">cada Y (m)</span><input v-model.number="gp.pasoY" type="number" min="2" step="0.5" class="form-input"></label>
            <button type="submit" class="fl-chip !min-h-11 !w-auto !px-3 !text-sm">Poner</button>
          </form>
          <button v-if="hayPilares" type="button" class="mt-2 text-sm text-red-700 underline underline-offset-2" @click="quitarPilares">Quitar pilares</button>
        </section>

        <!-- Elemento seleccionado -->
        <section v-if="elementoActual" class="fl-card ring-2 ring-brand-200" aria-live="polite">
          <div class="flex items-center justify-between">
            <p class="fl-leyenda">{{ ELEMENTOS[elementoActual.clase].nombre }}</p>
            <button type="button" class="text-sm text-neutral-500" @click="elementoSel = null">Cerrar</button>
          </div>
          <div v-if="elementoActual.clase === 'pasilloGrua'" class="mt-3">
            <p class="text-sm font-medium text-neutral-700">Ancho del pasillo</p>
            <div class="mt-2 grid grid-cols-3 gap-2">
              <button v-for="a in anchosGrua" :key="a" type="button" :class="['fl-chip !min-h-10 !text-sm', Math.abs(anchoPasillo - a) < 0.01 && 'fl-chip--sel']" @click="anchoDePasillo(a)">{{ fm(a) }} m</button>
            </div>
            <p v-if="anchoPasillo < grua.pasillo - 0.01" class="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">Tu {{ grua.nombre.toLowerCase() }} necesita ~{{ fm(grua.pasillo) }} m.</p>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <label class="fl-campo"><span class="!text-sm">{{ largoEnX ? 'Largo' : 'Ancho' }} en X (m)</span><input :value="elementoActual.ancho" type="number" min="0.2" step="0.1" class="form-input" @change="cambiarElemento({ ancho: num($event) })"></label>
            <label class="fl-campo"><span class="!text-sm">{{ largoEnX ? 'Ancho' : 'Largo' }} en Y (m)</span><input :value="elementoActual.alto" type="number" min="0.2" step="0.1" class="form-input" @change="cambiarElemento({ alto: num($event) })"></label>
            <label class="fl-campo"><span class="!text-sm">Desde el muro izq. (m)</span><input :value="borde.x" type="number" min="0" step="0.1" class="form-input" @change="moverElementoA('x', $event)"></label>
            <label class="fl-campo"><span class="!text-sm">Desde el muro sup. (m)</span><input :value="borde.y" type="number" min="0" step="0.1" class="form-input" @change="moverElementoA('y', $event)"></label>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <button type="button" class="fl-chip !min-h-10 !text-sm" @click="cambiarElemento({ ancho: elementoActual.alto, alto: elementoActual.ancho })">Girar</button>
            <button type="button" class="fl-chip !min-h-10 !text-sm !text-red-700" @click="quitarElemento(elementoActual.id)">Quitar</button>
          </div>
          <p class="mt-2 text-sm text-neutral-500">También puedes arrastrarlo en el plano.</p>
        </section>

        <!-- Rack seleccionado: girar, duplicar y repetir en bloque -->
        <section v-if="rackSel" class="fl-card ring-2 ring-brand-200" aria-live="polite">
          <div class="flex items-center justify-between">
            <p class="fl-leyenda">{{ nombreRack(rackSel) }}</p>
            <button type="button" class="text-sm text-neutral-500" @click="sel = null">Cerrar</button>
          </div>
          <div class="mt-3 grid grid-cols-3 gap-2">
            <button type="button" class="fl-chip !min-h-10 !text-sm" @click="girar(rackSel.id)">Girar</button>
            <button type="button" class="fl-chip !min-h-10 !text-sm" @click="duplicar(rackSel)">Duplicar</button>
            <button type="button" class="fl-chip !min-h-10 !text-sm !text-red-700" @click="eliminar(rackSel.id)">Quitar</button>
          </div>
          <div class="mt-4 border-t border-neutral-100 pt-4">
            <p class="font-semibold text-neutral-800">Repetir en bloque</p>
            <div class="mt-2 grid grid-cols-2 gap-3">
              <div><p class="text-sm text-neutral-600">A lo largo</p><FlujoNumero :valor="bloque.largo" :min="1" :max="10" etiqueta="a lo largo" @cambio="bloque.largo = $event" /></div>
              <div><p class="text-sm text-neutral-600">En profundidad</p><FlujoNumero :valor="bloque.profundidad" :min="1" :max="10" etiqueta="en profundidad" @cambio="bloque.profundidad = $event" /></div>
            </div>
            <label v-if="!rackSel.doble && rackSel.tipo !== 'DI'" class="mt-3 flex items-center gap-2 text-sm text-neutral-700">
              <input v-model="bloque.espalda" type="checkbox" class="h-4 w-4 accent-brand-600"> Filas espalda con espalda
            </label>
            <p class="mt-2 text-sm text-neutral-500">Entre filas queda el pasillo de tu equipo ({{ fm(grua.pasillo) }} m).</p>
            <button type="button" class="fl-btn mt-3 w-full" :disabled="bloque.largo * bloque.profundidad < 2" @click="repetir(rackSel)">
              Repetir {{ bloque.largo }} × {{ bloque.profundidad }}
            </button>
            <p v-if="avisoBloque" class="mt-2 text-sm text-amber-800" role="status">{{ avisoBloque }}</p>
          </div>
        </section>

        <!-- Lo que cabe -->
        <section :class="['fl-card', Object.keys(faltan).length ? 'ring-2 ring-amber-300' : '']">
          <div class="flex items-center justify-between gap-2">
            <p class="fl-leyenda">Lo que cabe</p>
            <button type="button" class="text-sm font-semibold text-brand-700" @click="ubicar(true)">Volver a ubicar</button>
          </div>
          <ul class="mt-3 space-y-2">
            <li v-for="m in p.modelos" :key="m.id" class="flex justify-between gap-3 text-neutral-800">
              <span>{{ m.nombre }}</span>
              <span class="tabular-nums">{{ ubicados(m.id) }} de {{ necesarios[m.id] }} {{ m.tipo === 'DI' ? 'calles' : 'cuerpos' }}</span>
            </li>
          </ul>
          <p v-if="Object.keys(faltan).length" class="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            No cabe todo con estas medidas. Agranda la bodega, sube niveles en el paso 3 o usa un rack doble.
          </p>
        </section>
      </div>

      <!-- Plano 2D o vista 3D -->
      <div class="fl-card !p-0 overflow-hidden lg:sticky lg:top-36 lg:self-start">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
          <div class="flex gap-1 rounded-lg bg-neutral-100 p-1" role="tablist" aria-label="Vista">
            <button v-for="v in (['2d', '3d'] as const)" :key="v" type="button" role="tab" :aria-selected="vista === v" :class="['rounded-md px-4 py-2 text-sm font-semibold', vista === v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="vista = v">{{ v === '2d' ? 'Plano 2D' : 'Vista 3D' }}</button>
          </div>
          <span class="text-sm text-neutral-600"><b class="text-neutral-900">{{ p.racks.length }}</b> racks · <b class="text-neutral-900">{{ n(total.pallets) }}</b> posiciones{{ total.bandejas ? ` · ${n(total.bandejas)} bandejas` : '' }}</span>
        </div>
        <div v-show="vista === '2d'">
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
          <ul class="flex flex-wrap gap-x-4 gap-y-1 border-t border-neutral-100 px-4 py-2.5 text-xs text-neutral-600">
            <li class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm bg-teal-200" />Pasillo de carga</li>
            <li class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm bg-amber-200" />Pasillo de grúa</li>
            <li class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm bg-green-200" />Peatonal</li>
            <li class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm bg-red-200" />Zona bloqueada</li>
            <li class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-yellow-400" />Accesorios</li>
          </ul>
        </div>
        <div v-if="vista === '3d'" class="h-[65vh] min-h-[380px]">
          <ClientOnly>
            <Visor3D :bodega="p.bodega" :racks="p.racks" etiqueta="Vista 3D de tu bodega" @seleccionar="sel = $event" @mover="mover" />
          </ClientOnly>
        </div>
        <p v-if="malos.size" class="border-t border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-800" role="status">
          Hay racks superpuestos, sobre un pasillo, pilar o zona, o fuera de la bodega (en rojo). Muévelos o toca "Volver a ubicar".
        </p>
        <p v-else-if="angostos" class="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-900" role="status">
          Hay pasillos más angostos de lo que necesita tu equipo (en rojo). Lo revisamos en el paso siguiente.
        </p>
      </div>
    </div>

    <FlujoAcciones :deshabilitado="!p.racks.length" motivo="Ubica al menos un rack." texto="Revisar mi diseño" @atras="emit('atras')" @siguiente="emit('siguiente')" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, watch, onMounted } from 'vue';
import { useProyecto } from '~/stores/proyecto';
import {
  ELEMENTOS, conflictos, totales, contorno, caja, normalizar, dentroDeBodega, grillaPilaresXY, lugarLibre, formatoM, NOMBRE,
} from '~/lib/rack3d/planificador.js';
import { GRUAS } from '~/lib/rack3d/parametrosTecnicos.js';
import { pasillos } from '~/lib/rack3d/pasillos.js';
import { resultadoModelo, ubicarModelos, repetirBloque } from '~/lib/flujo/calculos.js';
import { proponerAccesorios, aplicarAjustes } from '~/lib/rack3d/accesorios.js';

const emit = defineEmits<{ siguiente: []; atras: [] }>();
const p = useProyecto();
const fm = formatoM;
const n = (v: number) => Math.round(v).toLocaleString('es-CL');
const num = (e: Event) => Math.max(0.2, Number((e.target as HTMLInputElement).value) || 0.2);
const nuevoId = () => Math.random().toString(36).slice(2, 9);

const vista = ref<'2d' | '3d'>('2d');
const sel = ref<string | null>(null);
const elementoSel = ref<string | null>(null);
const faltan = ref<Record<string, number>>({});
const reacomodar = ref(true);
const gp = reactive({ pasoX: 8, pasoY: 8 });
const bloque = reactive({ largo: 2, profundidad: 2, espalda: false });
const avisoBloque = ref('');

const grua = computed(() => (GRUAS as any)[p.bodega.grua] ?? GRUAS.contrapeso);
const necesarios = computed(() => Object.fromEntries(p.modelos.map((m) => [m.id, resultadoModelo(m, { pallets: p.pallets, cajas: p.cajas, grua: p.bodega.grua }).cuerpos])));
const ubicados = (id: string) => p.racks.filter((r) => r.modelo === id).reduce((t, r) => t + r.cuerpos, 0);
const malos = computed(() => conflictos(p.racks, p.bodega) as Set<string>);
const listaPasillos = computed(() => pasillos(p.racks, p.bodega) as any[]);
const angostos = computed(() => listaPasillos.value.some((x) => !x.ok));
const total = computed(() => totales(p.racks.filter((r) => !r.existente)) as { pallets: number; bandejas: number });
const rackSel = computed(() => p.racks.find((r) => r.id === sel.value) ?? null);
const elementoActual = computed(() => p.bodega.elementos.find((e: any) => e.id === elementoSel.value) ?? null);
const hayPilares = computed(() => p.bodega.elementos.some((e: any) => e.clase === 'pilar'));
const marcas = computed(() => {
  const lista = aplicarAjustes(proponerAccesorios({ bodega: p.bodega, racks: p.racks, pallets: p.pallets }), p.accesorios) as any[];
  return lista.filter((a) => a.incluido).flatMap((a) => a.marcas ?? []);
});
const nombreRack = (r: any) => p.modelos.find((m) => m.id === r.modelo)?.nombre ?? NOMBRE[r.tipo];

// ─── Elemento seleccionado ───
const largoEnX = computed(() => (elementoActual.value ? elementoActual.value.ancho >= elementoActual.value.alto : true));
const anchoPasillo = computed(() => (elementoActual.value ? Math.min(elementoActual.value.ancho, elementoActual.value.alto) : 0));
// Anchos que se ofrecen para un pasillo de grua: el minimo del equipo y un poco mas (nunca menos)
const anchosGrua = computed(() => [grua.value.pasillo, grua.value.pasillo + 0.5, grua.value.pasillo + 1].map((v) => +v.toFixed(2)));
const borde = computed(() => {
  const e = elementoActual.value, c = caja(contorno(p.bodega));
  return e ? { x: +(e.x - e.ancho / 2 - c.x0).toFixed(2), y: +(e.y - e.alto / 2 - c.y0).toFixed(2) } : { x: 0, y: 0 };
});
function anchoDePasillo(a: number) {
  const e = elementoActual.value;
  if (!e) return;
  cambiarElemento(e.ancho >= e.alto ? { alto: a } : { ancho: a });
}
function moverElementoA(eje: 'x' | 'y', ev: Event) {
  const e = elementoActual.value, c = caja(contorno(p.bodega));
  if (!e) return;
  const v = Math.max(0, Number((ev.target as HTMLInputElement).value) || 0);
  cambiarElemento(eje === 'x' ? { x: +(c.x0 + v + e.ancho / 2).toFixed(2) } : { y: +(c.y0 + v + e.alto / 2).toFixed(2) });
}

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
// Al cambiar la circulacion (pasillos, zonas, pilares), los racks se reacomodan alrededor
const firmaCirculacion = computed(() => JSON.stringify(p.bodega.elementos.filter((e: any) => e.clase !== 'grua').map((e: any) => [e.clase, e.x, e.y, e.ancho, e.alto])));
watch(firmaCirculacion, () => { if (reacomodar.value) ubicar(false); });

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
function duplicar(r: any) {
  const copia = lugarLibre({ ...r, id: nuevoId() }, p.racks, p.bodega);
  p.racks = [...p.racks, copia];
  sel.value = copia.id;
}
function repetir(r: any) {
  const res = repetirBloque(r, { ...bloque }, p.racks, p.bodega, nuevoId) as { nuevos: any[]; omitidos: number };
  p.racks = [...p.racks, ...res.nuevos];
  avisoBloque.value = res.omitidos ? `Se agregaron ${res.nuevos.length}; ${res.omitidos} no caben (muros, pasillos u otros racks).` : `Se agregaron ${res.nuevos.length} racks.`;
  marcar('rack_add', { tipo: 'bloque', largo: bloque.largo, profundidad: bloque.profundidad, nuevos: res.nuevos.length });
}

function agregarElemento(clase: string) {
  const def = (ELEMENTOS as any)[clase], c = caja(contorno(p.bodega)), k = p.bodega.elementos.length;
  let el: any;
  if (clase === 'pasilloGrua' || clase === 'pasilloPeatonal') {
    // A lo ancho de la bodega, al medio, con el ancho de tu equipo (o 1,2 m el peatonal)
    const ancho = clase === 'pasilloGrua' ? grua.value.pasillo : def.ancho;
    el = { id: nuevoId(), clase, x: +((c.x0 + c.x1) / 2).toFixed(2), y: +((c.y0 + c.y1) / 2 + (k % 3) * 2).toFixed(2), ancho: +(c.x1 - c.x0 - 0.2).toFixed(2), alto: ancho };
  } else {
    const junto = clase === 'porton' || clase === 'anden';
    const x = +((c.x0 + c.x1) / 2 + (k % 4) * 1.5).toFixed(1);
    const y = junto ? +(c.y1 - def.alto / 2).toFixed(2) : +((c.y0 + c.y1) / 2 + (k % 3) * 1.5).toFixed(1);
    el = { id: nuevoId(), clase, x, y, ancho: def.ancho, alto: def.alto, ...(clase === 'grua' ? { modelo: p.bodega.grua } : {}) };
  }
  p.bodega.elementos = [...p.bodega.elementos, el];
  elementoSel.value = el.id;
  sel.value = null;
  vista.value = '2d';
  marcar('elemento_add', { clase });
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
}
function quitarPilares() {
  p.bodega.elementos = p.bodega.elementos.filter((e: any) => e.clase !== 'pilar');
}
function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>
