<template>
  <div>
    <h1 class="fl-titulo">Arma tu rack</h1>
    <p class="fl-bajada">Define cómo es tu rack. En el paso 5 lo ubicamos en tu bodega.</p>

    <!-- Modelos (si tiene mas de uno) -->
    <div v-if="p.modelos.length > 1" class="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Modelos de rack">
      <button
        v-for="m in p.modelos" :key="m.id" type="button" role="tab" :aria-selected="m.id === mod?.id"
        :class="['fl-chip !min-h-10 !w-auto !px-4 !text-sm', m.id === mod?.id && 'fl-chip--sel']" @click="p.modeloSel = m.id"
      >{{ m.nombre }}</button>
    </div>

    <div v-if="mod && res" class="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
      <div class="space-y-6">
        <!-- Altura de la bodega: define cuantos niveles caben -->
        <div class="fl-card">
          <label class="fl-campo">
            <span>Altura libre de tu bodega (m)</span>
            <div class="flex gap-2">
              <input :value="p.bodega.altura ?? ''" type="number" min="2.5" max="40" step="0.1" inputmode="decimal" class="form-input" placeholder="8" @change="cambiarAltura($event)">
              <button type="button" :class="['fl-nose', p.flags.includes('no_se:altura') && 'fl-nose--sel']" @click="alturaNoSe">No sé</button>
            </div>
            <em class="text-sm not-italic text-neutral-500">Hasta lo más bajo del techo: vigas, luces o rociadores.</em>
          </label>
        </div>

        <!-- 1. Sistema -->
        <fieldset class="fl-card">
          <legend class="fl-leyenda">Sistema</legend>
          <div class="mt-3 grid grid-cols-3 gap-2">
            <button v-for="(t, k) in TIPOS" :key="k" type="button" :class="['fl-chip !text-sm', mod.tipo === k && 'fl-chip--sel']" :aria-pressed="mod.tipo === k" @click="cambiarSistema(k as Sistema)">{{ t.nombre }}</button>
          </div>
          <p v-if="p.sistema && mod.tipo !== p.sistema" class="mt-2 text-sm text-neutral-500">Te recomendamos {{ TIPOS[p.sistema].nombre.toLowerCase() }}.</p>
        </fieldset>

        <!-- 2. Que va en este modelo -->
        <fieldset class="fl-card">
          <legend class="fl-leyenda">{{ mod.tipo === 'AR' ? 'Cajas en este rack' : 'Pallets en este rack' }}</legend>
          <div class="mt-3 space-y-3">
            <label v-for="t in catalogo" :key="t.id" class="flex items-center justify-between gap-3">
              <span class="flex min-w-0 items-center gap-2 text-neutral-800">
                <span v-if="'color' in t" class="h-3 w-3 flex-shrink-0 rounded" :style="{ background: (t as any).color }" aria-hidden="true" />
                <span class="truncate">{{ t.nombre }}</span>
                <span class="flex-shrink-0 text-sm text-neutral-500">· {{ 'frente' in t ? `${fm((t as any).alto)} m` : `${cm((t as any).largo)}×${cm((t as any).ancho)}×${cm((t as any).alto)} cm` }}</span>
              </span>
              <input :value="mod.cantidades[t.id] ?? 0" type="number" min="0" step="1" inputmode="numeric" class="form-input !w-28 text-right" @change="cambiarCantidad(t.id, $event)">
            </label>
            <p v-if="!catalogo.length" class="text-sm text-neutral-600">
              Primero agrega tus {{ mod.tipo === 'AR' ? 'cajas' : 'pallets' }} en el paso anterior.
              <button type="button" class="font-semibold text-brand-700 underline" @click="emit('atras')">Volver</button>
            </p>
          </div>
        </fieldset>

        <!-- 3. Configuracion del modulo -->
        <fieldset class="fl-card">
          <legend class="fl-leyenda">Configuración</legend>
          <div class="mt-3 space-y-5">
            <div v-if="mod.tipo === 'RS'">
              <p class="fl-sub">Pallets por nivel</p>
              <div class="mt-2 grid grid-cols-3 gap-2">
                <button v-for="n in [1, 2, 3]" :key="n" type="button" :class="['fl-chip', (mod.porViga ?? 2) === n && 'fl-chip--sel']" :aria-pressed="(mod.porViga ?? 2) === n" @click="cambiar({ porViga: n })">{{ n }}</button>
              </div>
            </div>
            <div v-if="mod.tipo !== 'DI'">
              <p class="fl-sub">
                Simple o doble
                <FlujoInfo>Doble = dos racks espalda con espalda: comparten el pasillo y ganas posiciones.</FlujoInfo>
              </p>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button type="button" :class="['fl-chip', !mod.doble && 'fl-chip--sel']" :aria-pressed="!mod.doble" @click="cambiar({ doble: false })">Simple</button>
                <button type="button" :class="['fl-chip', mod.doble && 'fl-chip--sel']" :aria-pressed="mod.doble" @click="cambiar({ doble: true })">Doble</button>
              </div>
            </div>
            <div v-if="mod.tipo === 'DI'">
              <p class="fl-sub">Pallets de fondo por calle</p>
              <FlujoNumero :valor="mod.fondos ?? 5" :min="2" :max="12" etiqueta="Pallets de fondo" @cambio="cambiar({ fondos: $event })" />
            </div>
            <div>
              <p class="fl-sub">
                {{ mod.tipo === 'AR' ? 'Repisas' : 'Niveles sobre el piso' }}
                <FlujoInfo v-if="mod.tipo !== 'AR'">El piso también guarda pallets y no se cuenta como nivel.</FlujoInfo>
              </p>
              <FlujoNumero :valor="mod.niveles" :min="mod.tipo === 'AR' ? 2 : 1" :max="maxNiveles" :etiqueta="mod.tipo === 'AR' ? 'Repisas' : 'Niveles'" @cambio="cambiar({ niveles: $event, mezcla: [], vigasY: null })" />
              <p class="mt-1.5 text-sm text-neutral-500">Máximo {{ maxNiveles }} por {{ limite }}.</p>
            </div>
            <div v-if="mod.tipo === 'AR'">
              <p class="fl-sub">Fondo de la bandeja</p>
              <div class="mt-2 grid grid-cols-4 gap-2">
                <button v-for="f in [0.3, 0.4, 0.5, 0.6]" :key="f" type="button" :class="['fl-chip !text-sm', (mod.bandeja ?? 0.4) === f && 'fl-chip--sel']" @click="cambiar({ bandeja: f })">{{ f * 1000 }} mm</button>
              </div>
              <p class="fl-sub mt-4">Largo de la bandeja</p>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button v-for="f in [0.92, 1.2]" :key="f" type="button" :class="['fl-chip !text-sm', (mod.frente ?? 0.92) === f && 'fl-chip--sel']" @click="cambiar({ frente: f })">{{ fm(f) }} m</button>
              </div>
            </div>
          </div>

          <!-- Tipo de pallet por nivel (selectivo con mas de un tipo) -->
          <div v-if="mod.tipo === 'RS' && tiposModelo.length > 1" class="mt-6 border-t border-neutral-100 pt-5">
            <div class="flex items-center justify-between gap-3">
              <span />
              <button type="button" class="text-sm font-semibold text-brand-700" @click="acomodar">Acomodar solo</button>
            </div>
            <!-- Componente del planificador: elevacion clickeable y "aplicar a todos los selectivos" -->
            <PlanificadorMezclaNiveles class="mt-3" :rack="res.r" :tipos="tiposModelo" @asignar="cambiar({ mezcla: $event })" @todos="aplicarATodos" />
            <p class="mt-2 text-sm text-neutral-500">"Acomodar solo": lo que sale más seguido va abajo; lo alto y lento, arriba.</p>
          </div>

          <details v-if="mod.tipo !== 'AR'" class="fl-mas mt-6">
            <summary>Más opciones</summary>
            <div v-if="mod.tipo === 'RS'" class="mt-4 space-y-5">
              <label class="fl-campo">
                <span>Sobrante de marco sobre la última viga: {{ Math.round((mod.sobrante ?? 0.3) * 1000) }} mm</span>
                <input :value="mod.sobrante ?? 0.3" type="range" min="0.3" max="1" step="0.05" class="w-full accent-brand-600" @input="cambiar({ sobrante: Number(($event.target as HTMLInputElement).value) })">
                <em class="text-sm not-italic text-neutral-500">Entre 300 y 1.000 mm. Más de 1.000 no se fabrica.</em>
              </label>
              <div>
                <label class="flex items-center gap-2 text-neutral-800">
                  <input type="checkbox" :checked="!!mod.tunel" class="h-4 w-4 accent-brand-600" @change="cambiar({ tunel: ($event.target as HTMLInputElement).checked ? { cuerpo: 0, altoLibre: 2.2 } : null })">
                  Cuerpo túnel (para pasar por debajo)
                </label>
                <div v-if="mod.tunel" class="mt-2 grid grid-cols-2 gap-2">
                  <button v-for="a in [2.2, 2.5, 3.5, 4.5]" :key="a" type="button" :class="['fl-chip !text-sm', mod.tunel.altoLibre === a && 'fl-chip--sel']" @click="cambiar({ tunel: { ...mod.tunel, altoLibre: a } })">Paso libre {{ fm(a) }} m</button>
                </div>
              </div>
              <div>
                <p class="fl-sub">Plano de carga por nivel</p>
                <ol class="mt-2 space-y-2">
                  <li v-for="i in mod.niveles" :key="i" class="flex items-center gap-3">
                    <span class="w-16 text-sm text-neutral-600">Nivel {{ i }}</span>
                    <select :value="res.r.planos?.[i] ?? ''" class="form-input" @change="plano(i, ($event.target as HTMLSelectElement).value)">
                      <option value="">Sin plano (pallet sobre vigas)</option>
                      <option value="malla">Malla</option>
                      <option value="madera">Madera</option>
                      <option value="metal">Bandeja metálica</option>
                    </select>
                  </li>
                </ol>
              </div>
            </div>
            <div v-else class="mt-4">
              <PlanificadorGruaDriveIn :rack="res.r" :abierto="true" @cambio="cambiar($event as any)" />
            </div>
          </details>
        </fieldset>
      </div>

      <!-- 4. Resultado inmediato -->
      <!-- En celular el dibujo va primero (visual antes que controles) -->
      <aside class="order-first lg:order-none lg:sticky lg:top-36 lg:self-start">
        <div class="fl-card">
          <div class="flex items-center justify-between gap-2">
            <p class="fl-leyenda">Tu {{ TIPOS[mod.tipo].nombre.toLowerCase() }}</p>
            <div class="flex gap-1 rounded-lg bg-neutral-100 p-0.5" role="tablist" aria-label="Vista del rack">
              <button v-for="v in VISTAS_RACK" :key="v.v" type="button" role="tab" :aria-selected="vistaRack === v.v" :class="['rounded-md px-2 py-1.5 text-sm font-medium', vistaRack === v.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="vistaRack = v.v">{{ v.t }}</button>
            </div>
          </div>
          <FlujoElevacion v-if="vistaRack === 'frente'" :m="res.m" :editable="mod.tipo === 'RS'" class="mt-3 touch-none" @vigas="cambiar({ vigasY: $event })" />
          <p v-if="mod.tipo === 'RS' && vistaRack === 'frente'" class="mt-1 text-xs text-neutral-500">
            Arrastra una viga (o usa las flechas) para subirla o bajarla de a una perforación (76,2 mm).
            <button v-if="mod.vigasY?.length" type="button" class="font-semibold text-brand-700 underline" @click="cambiar({ vigasY: null })">Volver a las alturas calculadas</button>
          </p>
          <FlujoLateralRack v-else-if="vistaRack === 'lado' && mod.tipo === 'RS'" :m="res.m" class="mt-3" />
          <FlujoPlantaRack v-else :m="res.m" class="mt-3" />
          <dl class="mt-4 grid grid-cols-2 gap-3">
            <div class="fl-dato"><dt>{{ mod.tipo === 'AR' ? 'Bandejas' : 'Posiciones' }} por {{ mod.tipo === 'DI' ? 'calle' : 'cuerpo' }}</dt><dd><FlujoContador :valor="res.porCuerpo" /></dd></div>
            <div class="fl-dato">
              <dt>{{ mod.tipo === 'DI' ? 'Calles' : 'Cuerpos' }} que necesitas</dt>
              <dd><FlujoContador :valor="res.cuerpos" /></dd>
              <p v-if="mod.tipo !== 'DI' && mod.doble" class="text-xs text-neutral-500">{{ res.modulos }} por lado</p>
            </div>
            <div class="fl-dato"><dt>Alto total</dt><dd>{{ fm(res.alto) }} m</dd></div>
            <div class="fl-dato"><dt>Guardas</dt><dd><FlujoContador :valor="res.capacidad" /> <span class="text-sm font-normal text-neutral-500">{{ res.unidad }}</span></dd><p class="text-xs text-neutral-500">Necesitas {{ n(res.total) }} {{ res.totalUnidad }}</p></div>
          </dl>
          <!-- La cuenta a la vista: de donde salen viga y marco -->
          <p v-if="mod.tipo === 'RS'" class="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm leading-relaxed text-neutral-600">
            Viga = {{ res.m.palletsPorViga }} × {{ fm(res.m.pallet.frente) }} + {{ res.m.palletsPorViga + 1 }} × {{ fm(RACK.holguraViga.valor) }} = <b class="text-neutral-800">{{ fm(res.m.viga) }} m</b><br>
            Fondo del marco = {{ fm(res.m.pallet.fondo) }} − 2 × {{ fm(RACK.voladizoPallet.valor) }} = <b class="text-neutral-800">{{ fm(res.m.fondo) }} m</b><br>
            Viga {{ res.m.vigaModelo }} ({{ Math.round(res.m.altoViga * 1000) }} mm) para {{ n(res.m.kgPallet) }} kg por pallet
            <span class="block text-xs text-neutral-500">Mismas fórmulas del cotizador Racklog. El pallet sobresale {{ Math.round(RACK.voladizoPallet.valor * 1000) }} mm por lado.</span>
          </p>
          <div v-if="res.carga" :class="['mt-4 rounded-xl px-3 py-2.5 text-sm', SEMAFORO[res.carga.color as keyof typeof SEMAFORO]]">
            <b>{{ mod.tipo === 'RS' ? 'Carga por par de vigas' : mod.tipo === 'DI' ? 'Carga por pallet' : 'Carga por bandeja' }}:</b>
            {{ n(res.carga.kg) }} de {{ n(res.carga.capacidad) }} kg ({{ Math.round(res.carga.uso * 100) }} %)
            <span class="block text-xs opacity-80">Capacidad referencial: la confirma Técnica Racklog.</span>
          </div>
          <!-- Corte contra el techo: holgura y si cabe un nivel mas (componente del planificador) -->
          <PlanificadorCorteRack v-if="mod.tipo !== 'AR'" :rack="res.r" :altura="p.bodega.altura" class="mt-4" />
          <div v-if="res.cargaMarco" :class="['mt-2 rounded-xl px-3 py-2.5 text-sm', SEMAFORO[res.cargaMarco.color as keyof typeof SEMAFORO]]">
            <b>Carga por marco:</b> {{ n(res.cargaMarco.kg) }} de {{ n(res.cargaMarco.capacidad) }} kg ({{ Math.round(res.cargaMarco.uso * 100) }} %)
            <span class="block text-xs opacity-80">Capacidad referencial hasta tener la tabla de pilares de Racklog.</span>
          </div>
          <ul v-if="res.avisos.length" class="mt-3 space-y-1.5 text-sm text-amber-900">
            <li v-for="(a, i) in res.avisos" :key="i" class="rounded-lg bg-amber-50 px-3 py-2">{{ a }}</li>
          </ul>
        </div>
      </aside>
    </div>

    <div class="mt-6 flex flex-wrap gap-2">
      <button type="button" class="fl-agregar !w-auto px-4" @click="nuevo">+ Otro modelo de rack</button>
      <button v-if="mod && p.modelos.length > 1" type="button" class="fl-agregar !w-auto px-4 !text-red-700" @click="p.quitarModelo(mod.id)">Quitar este modelo</button>
    </div>

    <FlujoAcciones :deshabilitado="!valido" motivo="Indica cuántos pallets o cajas van en el rack." @atras="emit('atras')" @siguiente="emit('siguiente')" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useProyecto, type Sistema, type Modelo } from '~/stores/proyecto';
import { TIPOS } from '~/lib/rack3d/planificador.js';
import { resultadoModelo, nivelesMaximos, mezclaPorDefecto } from '~/lib/flujo/calculos.js';
import { RACK } from '~/lib/rack3d/parametrosTecnicos.js';

const emit = defineEmits<{ siguiente: []; atras: [] }>();
const p = useProyecto();
const vistaRack = ref<'frente' | 'lado' | 'planta'>('frente');
const VISTAS_RACK = computed(() => [{ v: 'frente', t: 'Frente' }, ...(mod.value?.tipo === 'RS' ? [{ v: 'lado', t: 'Lado' }] : []), { v: 'planta', t: 'Planta' }] as const);
const SEMAFORO = { verde: 'bg-green-50 text-green-900', amarillo: 'bg-amber-50 text-amber-900', rojo: 'bg-red-50 text-red-900' } as const;
const fm = (v: number) => (+(+v).toFixed(2)).toLocaleString('es-CL');
const cm = (v: number) => Math.round(v * 100);
const n = (v: number) => Math.round(v).toLocaleString('es-CL');

onMounted(() => {
  if (!p.modelos.length) {
    p.agregarModelo(p.sistema ?? 'RS');
    // Si tambien guarda cajas, un ángulo ranurado aparte
    if (p.sistema !== 'AR' && p.cajas.length) { p.agregarModelo('AR'); p.modeloSel = p.modelos[0].id; }
  }
  sincronizarCantidades();
});

const mod = computed(() => p.modeloActual as Modelo | null);
const catalogo = computed(() => (mod.value?.tipo === 'AR' ? p.cajas : p.pallets) as any[]);
const tiposModelo = computed(() => p.pallets.filter((t) => (mod.value?.cantidades[t.id] ?? 0) > 0));
const res = computed(() => (mod.value ? resultadoModelo(mod.value, { pallets: p.pallets, cajas: p.cajas, grua: p.bodega.grua }) as any : null));
const maxNiveles = computed(() => (mod.value ? nivelesMaximos(mod.value, { pallets: p.pallets, altura: p.bodega.altura, grua: p.bodega.grua }) : 1));
const limite = computed(() => (mod.value?.tipo === 'AR' ? 'altura de la estantería' : p.bodega.altura ? 'tu techo y tu equipo' : 'tu equipo'));
const valido = computed(() => p.modelos.length > 0 && p.modelos.every((m) => Object.values(m.cantidades).some((v) => v > 0)));

// Tipos nuevos del catalogo: entran con su cantidad al unico modelo de su clase
function sincronizarCantidades() {
  p.modelos.forEach((m) => {
    const lista = m.tipo === 'AR' ? p.cajas : p.pallets;
    const mismos = p.modelos.filter((o) => (o.tipo === 'AR') === (m.tipo === 'AR'));
    const cantidades = { ...m.cantidades };
    lista.forEach((t) => { if (!(t.id in cantidades)) cantidades[t.id] = mismos[0].id === m.id ? t.cantidad : 0; });
    Object.keys(cantidades).forEach((k) => { if (!lista.some((t) => t.id === k)) delete cantidades[k]; });
    p.cambiarModelo(m.id, { cantidades });
  });
  // Niveles dentro de lo posible desde el inicio
  p.modelos.forEach((m) => {
    const max = nivelesMaximos(m, { pallets: p.pallets, altura: p.bodega.altura, grua: p.bodega.grua });
    if (m.niveles > max) p.cambiarModelo(m.id, { niveles: max, mezcla: [] });
  });
}

function cambiar(c: Partial<Modelo>) {
  if (!mod.value) return;
  // Si cambia lo que va en cada nivel, las vigas movidas a mano vuelven a las calculadas (la luz cambia)
  if (('mezcla' in c || 'cantidades' in c || 'porViga' in c) && !('vigasY' in c)) c = { ...c, vigasY: null };
  p.cambiarModelo(mod.value.id, c);
}
function cambiarSistema(t: Sistema) {
  if (!mod.value || mod.value.tipo === t) return;
  const lista = t === 'AR' ? p.cajas : p.pallets;
  const base = t === 'RS' ? { porViga: 2, sobrante: 0.3, doble: true, niveles: 3 } : t === 'DI' ? { fondos: 5, doble: false, niveles: 3 } : { bandeja: 0.4, frente: 0.92, doble: false, niveles: 5 };
  cambiar({ tipo: t, ...base, mezcla: [], nombre: TIPOS[t].nombre, cantidades: Object.fromEntries(lista.map((x) => [x.id, x.cantidad])) });
  if (t === 'AR' && !p.cajas.length) { p.agregarCaja(); sincronizarCantidades(); }
  if (t !== 'AR' && !p.pallets.length) { p.agregarPallet(); sincronizarCantidades(); }
  sincronizarCantidades();
}
function cambiarCantidad(id: string, e: Event) {
  if (!mod.value) return;
  const v = Math.max(0, Math.round(Number((e.target as HTMLInputElement).value) || 0));
  cambiar({ cantidades: { ...mod.value.cantidades, [id]: v }, mezcla: [] });
}
function cambiarAltura(e: Event) {
  const v = Number((e.target as HTMLInputElement).value);
  p.bodega.altura = v >= 2.5 ? Math.min(40, v) : null;
  p.flags = p.flags.filter((f) => f !== 'no_se:altura');
  sincronizarCantidades();
}
function alturaNoSe() {
  p.bodega.altura = 8;
  p.flags = [...new Set([...p.flags, 'no_se:altura'])];
  sincronizarCantidades();
}
const alturaNombre = (i: number) => (i === 0 ? 'Piso' : `Nivel ${i}`);
function asignar(i: number, id: string) {
  const mezcla = [...res.value.r.mezcla];
  mezcla[i] = id;
  cambiar({ mezcla });
}
function acomodar() {
  if (!mod.value) return;
  cambiar({ mezcla: mezclaPorDefecto({ ...mod.value, mezcla: [] }, p.pallets) });
}
// "Aplicar a todos": esa altura con ese tipo en todos los selectivos del proyecto
function aplicarATodos(i: number, id: string | null) {
  p.modelos.filter((m) => m.tipo === 'RS' && m.niveles >= i).forEach((m) => {
    const actual = resultadoModelo(m, { pallets: p.pallets }).r.mezcla as (string | null)[];
    p.cambiarModelo(m.id, { mezcla: actual.map((x, j) => (j === i ? id : x)) });
  });
}
function plano(i: number, tipo: string) {
  const planos = Array.from({ length: (mod.value?.niveles ?? 0) + 1 }, (_, j) => (j === i ? tipo || null : res.value.r.planos?.[j] ?? null));
  cambiar({ planos });
}
function nuevo() {
  const tipo = mod.value?.tipo === 'RS' && p.cajas.length ? 'AR' : (mod.value?.tipo ?? 'RS');
  p.agregarModelo(tipo);
  sincronizarCantidades();
}
</script>
