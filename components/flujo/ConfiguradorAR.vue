<template>
  <!-- Ángulo ranurado (paso 4): el cliente arma su estante, pone su caja y ve cuántas caben por módulo. Una sola
       cuenta (moduloAR / resultadoModelo de calculos.js) para el número, el dibujo, el 3D y el plano del paso 5 -->
  <div class="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
    <!-- Lo que se ve: el estante con sus cajas y el resultado. En celular va primero -->
    <section class="fl-card order-first !p-0 overflow-hidden lg:order-none lg:sticky lg:top-36 lg:self-start" aria-label="Tu módulo">
      <div class="flex items-center justify-between gap-2 px-4 pt-3">
        <p class="fl-leyenda">Tu módulo</p>
        <div class="flex gap-0.5 rounded-lg bg-neutral-100 p-0.5" role="tablist" aria-label="Vista del módulo">
          <button v-for="v in VISTAS" :key="v.v" type="button" role="tab" :aria-selected="vista === v.v" :class="['h-8 rounded-md px-2.5 text-sm font-medium', vista === v.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="vista = v.v">{{ v.t }}</button>
        </div>
      </div>
      <div class="px-3 pb-1">
        <FlujoElevacion v-if="vista === 'frente'" :m="res.m" :cajas="cajasDibujo" class="mx-auto mt-2 max-w-[420px]" />
        <FlujoElevacion v-else-if="vista === 'planta'" :m="res.m" :cajas="cajasDibujo" vista="planta" class="mx-auto mt-2 max-w-[420px]" />
        <div v-else class="mt-2 h-[340px]">
          <FlujoPallet3D
            v-if="pr" base="estante" :estante="{ alto: res.m.alto, bandejasY: res.m.bandejasY, espesor: res.m.espesorBandeja, carga: res.m.nivelesCarga }"
            :frente="res.m.frente" :fondo="res.m.fondo" :caja="pr.c" :cols="pr.cols" :filas="pr.filas" :camas="pr.camas" :largo-en-frente="pr.largoEnFrente"
            :etiqueta="`Estante de ángulo ranurado de ${fm(res.m.alto)} m con ${res.m.nivelesCarga} niveles de bandeja y ${res.porModulo} cajas`"
          />
        </div>
      </div>

      <!-- El resultado: un solo número protagonista y de dónde sale -->
      <div class="border-t border-neutral-100 bg-gradient-to-b from-orange-50/70 to-white px-4 py-3" aria-live="polite">
        <template v-if="pr && pr.cajas > 0">
          <p class="text-[15px] text-neutral-700">Caben <b class="text-3xl font-extrabold tabular-nums text-neutral-900"><FlujoContador :valor="res.porModulo" /></b> {{ res.porModulo === 1 ? 'caja' : 'cajas' }} por módulo<span v-if="modelo.doble" class="text-sm text-neutral-500"> (por lado)</span></p>
          <p class="mt-1.5 flex flex-wrap items-center gap-1 text-sm text-neutral-700">
            <span class="fl-factor">{{ pr.cols }} al frente</span><span aria-hidden="true">×</span>
            <span class="fl-factor">{{ pr.filas }} al fondo</span><span aria-hidden="true">×</span>
            <span class="fl-factor">{{ pr.camas }} de alto</span><span aria-hidden="true">×</span>
            <span class="fl-factor fl-factor--fuerte">{{ res.m.nivelesCarga }} {{ res.m.nivelesCarga === 1 ? 'nivel' : 'niveles' }} de bandeja</span>
          </p>
          <p class="mt-2 text-sm text-neutral-700">
            Para tus <b>{{ n(res.total) }}</b> cajas: <b class="text-neutral-900">{{ n(res.modulos) }} {{ res.modulos === 1 ? 'módulo' : 'módulos' }}</b><template v-if="modelo.doble"> dobles ({{ n(res.cuerpos) }} cuerpos)</template>.
            <span class="text-neutral-500">Los ubicas en tu bodega en el paso siguiente.</span>
          </p>
        </template>
        <p v-else class="text-sm font-semibold text-red-800">Tu caja no cabe en este estante. {{ res.avisos[0] ?? '' }}</p>

        <!-- Sugerencias: no se imponen, un toque las aplica -->
        <ul class="mt-2 space-y-1.5 text-sm">
          <li v-if="propuesta?.motivo && (modelo.bandeja ?? 0.4) === propuesta.bandeja" class="rounded-lg bg-sky-50 px-3 py-2 text-sky-900">{{ propuesta.motivo }}</li>
          <li v-if="puedeMas && siguiente" class="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-white px-3 py-2 ring-1 ring-neutral-200">
            <span class="min-w-0 flex-1">Te cabe <b>1 bandeja más</b>: quedarían {{ cmTxt(siguiente.libre) }} cm libres y {{ siguiente.porModulo }} por módulo<template v-if="siguiente.escalera"> (el nivel de arriba a {{ fm(siguiente.ultimoNivel) }} m, con escalera)</template>.</span>
            <button type="button" :class="[CH, CH_NO]" @click="masNivel">Agregar nivel</button>
          </li>
          <li v-if="alt600" class="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-white px-3 py-2 ring-1 ring-neutral-200">
            <span class="min-w-0 flex-1">Con bandeja de <b>600 mm</b> caben <b>{{ alt600.porModulo }}</b> por módulo ({{ alt600.porNivel }} por nivel){{ alt600.modulos ? ` → ${n(alt600.modulos)} módulos` : '' }}.</span>
            <button type="button" :class="[CH, CH_NO]" @click="usar600">Usar 600</button>
          </li>
          <li v-if="masAlto" class="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-white px-3 py-2 ring-1 ring-neutral-200">
            <span class="min-w-0 flex-1">Tu bodega da para un ángulo de <b>{{ fm(masAlto.alto) }} m</b>: {{ masAlto.porModulo }} por módulo<template v-if="masAlto.escalera"> (lo de arriba con escalera)</template>.</span>
            <button type="button" :class="[CH, CH_NO]" @click="cambiarAngulo(masAlto.alto, masAlto.niveles)">Ver con {{ fm(masAlto.alto) }} m</button>
          </li>
          <li v-for="(a, i) in res.avisos.slice(pr && pr.cajas > 0 ? 0 : 1)" :key="i" class="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">{{ a }}</li>
        </ul>
        <button v-if="propuesta && !enPropuesta" type="button" class="mt-2 text-sm font-semibold text-brand-700 underline underline-offset-2" @click="usarPropuesta">Volver a la propuesta ({{ propuesta.porModulo }} por módulo)</button>
      </div>
    </section>

    <!-- Lo que se elige: el estante y la caja, con botones chicos -->
    <section class="fl-card fl-secciones lg:self-start">
      <fieldset>
        <legend class="flex items-center gap-2"><span class="fl-paso">1</span><span class="fl-sub">Tu estante</span></legend>
        <p class="mt-3 text-sm font-medium text-neutral-700">Alto del ángulo <FlujoInfo>El ángulo viene perforado cada 20 mm y se corta a la medida. Los de catálogo son de 2,0, 2,5 y 3,0 m.</FlujoInfo></p>
        <div class="mt-1.5 flex flex-wrap gap-1.5">
          <button v-for="a in ANRA_ANGULOS" :key="a" type="button" :class="[CH, alto === a ? CH_SI : CH_NO]" :aria-pressed="alto === a" @click="cambiarAngulo(a)">{{ fm(a) }} m</button>
          <label :class="[CH, '!px-2', !ANRA_ANGULOS.includes(alto) ? CH_SI : CH_NO]">
            <input :value="ANRA_ANGULOS.includes(alto) ? '' : fm(alto)" type="number" min="1" max="3" step="0.02" placeholder="Otro" aria-label="Alto del ángulo a medida (m)" class="w-12 bg-transparent text-center outline-none placeholder:text-neutral-500" @change="cambiarAngulo(Number(($event.target as HTMLInputElement).value.replace(',', '.')))"><span class="text-xs">m</span>
          </label>
        </div>

        <p class="mt-4 text-sm font-medium text-neutral-700">Bandeja <span class="font-normal text-neutral-500">(frente × fondo)</span></p>
        <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span class="inline-flex rounded-lg bg-neutral-100 p-0.5" role="group" aria-label="Frente de la bandeja">
            <button v-for="f in ANRA_FRENTES" :key="f" type="button" :class="['h-8 rounded-md px-2.5 text-sm font-semibold', frente === f ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" :aria-pressed="frente === f" @click="emit('cambio', { frente: f })">{{ mm(f) }}</button>
          </span>
          <span class="text-neutral-400" aria-hidden="true">×</span>
          <span class="inline-flex rounded-lg bg-neutral-100 p-0.5" role="group" aria-label="Fondo de la bandeja">
            <button v-for="f in ANRA_FONDOS" :key="f" type="button" :class="['h-8 rounded-md px-2.5 text-sm font-semibold', fondo === f ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" :aria-pressed="fondo === f" @click="emit('cambio', { bandeja: f })">{{ mm(f) }}<span v-if="f === FONDO_ESTANDAR_AR" class="ml-1 text-[10px] font-medium text-neutral-500">estándar</span></button>
          </span>
          <span class="text-xs text-neutral-500">mm</span>
        </div>

        <div class="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <p class="text-sm font-medium text-neutral-700">Niveles de bandeja <FlujoInfo>Cada nivel es una bandeja con cajas. Arriba va una bandeja más que cierra el estante: nada queda sobre el ángulo.</FlujoInfo></p>
            <div class="mt-1.5 inline-flex h-9 items-center rounded-lg ring-1 ring-neutral-300">
              <button type="button" class="h-9 w-9 text-lg font-semibold text-neutral-700 disabled:opacity-30" :disabled="niveles <= 1" aria-label="Un nivel menos" @click="emit('cambio', { niveles: niveles - 1 })">−</button>
              <output class="w-8 text-center font-bold tabular-nums" aria-live="polite">{{ niveles }}</output>
              <!-- El "+" siempre responde: agrega el nivel o dice por qué no cabe (nunca se apaga en silencio) -->
              <button type="button" :class="['h-9 w-9 text-lg font-semibold text-neutral-700', !puedeMas && 'opacity-30']" :aria-disabled="!puedeMas" :title="puedeMas ? 'Un nivel más' : motivoNoMas" aria-label="Un nivel más" @click="masNivel">+</button>
            </div>
            <p v-if="avisoNiveles" class="mt-1.5 max-w-xs text-xs font-medium text-amber-800" role="status">{{ avisoNiveles }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-neutral-700">Simple o doble <FlujoInfo>Doble = dos estantes espalda con espalda: comparten el pasillo.</FlujoInfo></p>
            <span class="mt-1.5 inline-flex rounded-lg bg-neutral-100 p-0.5" role="group" aria-label="Simple o doble">
              <button v-for="d in [false, true]" :key="String(d)" type="button" :class="['h-8 rounded-md px-3 text-sm font-semibold', !!modelo.doble === d ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" :aria-pressed="!!modelo.doble === d" @click="emit('cambio', { doble: d })">{{ d ? 'Doble' : 'Simple' }}</button>
            </span>
          </div>
        </div>
        <p class="mt-2 text-xs text-neutral-500">{{ Math.round(res.m.nicho * 100) }} cm libres entre bandejas · {{ res.m.nivelesCarga + 1 }} bandejas por módulo (con la del tope) · {{ mm(res.m.frenteExt) }} × {{ mm(res.m.fondoExt) }} mm de piso</p>
      </fieldset>

      <fieldset>
        <legend class="flex items-center gap-2"><span class="fl-paso">2</span><span class="fl-sub">Tu caja</span></legend>
        <div v-if="tipos.length > 1" class="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Tus cajas">
          <button v-for="c in tipos" :key="c.id" type="button" role="tab" :aria-selected="caja?.id === c.id" :class="[CH, caja?.id === c.id ? CH_SI : CH_NO]" @click="cajaSel = c.id">{{ c.nombre }}</button>
        </div>
        <template v-if="caja">
          <div class="mt-3 grid grid-cols-3 gap-2">
            <label v-for="d in DIMS" :key="d.k" class="fl-campo"><span class="!text-sm">{{ d.t }} (cm)</span><input :value="cmTxt((caja as any)[d.k])" type="number" min="5" max="200" inputmode="numeric" class="form-input !h-10" @change="medida(d.k, $event)"></label>
          </div>
          <div class="mt-2 grid grid-cols-3 gap-2">
            <label class="fl-campo"><span class="!text-sm">Kg por caja</span><input :value="caja.peso" type="number" min="0.1" step="0.5" inputmode="decimal" class="form-input !h-10" @change="caja.peso = Math.max(0, Number(($event.target as HTMLInputElement).value) || 0)"></label>
            <div class="fl-campo">
              <span class="!text-sm">Aguanta apiladas <FlujoInfo>Cuántas cajas se pueden poner una sobre otra sin aplastar la de abajo. En el estante van las que quepan en el espacio entre bandejas, hasta este número.</FlujoInfo></span>
              <div class="inline-flex h-10 items-center rounded-lg ring-1 ring-neutral-300">
                <button type="button" class="h-10 w-8 font-semibold text-neutral-700 disabled:opacity-30" :disabled="(caja.apilable || 1) <= 1" aria-label="Una menos" @click="caja.apilable = Math.max(1, (caja.apilable || 1) - 1)">−</button>
                <output class="w-6 text-center font-bold tabular-nums">{{ caja.apilable || 1 }}</output>
                <button type="button" class="h-10 w-8 font-semibold text-neutral-700 disabled:opacity-30" :disabled="(caja.apilable || 1) >= 20" aria-label="Una más" @click="caja.apilable = Math.min(20, (caja.apilable || 1) + 1)">+</button>
              </div>
            </div>
            <label class="fl-campo"><span class="!text-sm">¿Cuántas?</span><input :value="modelo.cantidades[caja.id] ?? 0" type="number" min="0" inputmode="numeric" class="form-input !h-10" @change="cantidad($event)"></label>
          </div>
          <p v-if="pr && pr.cajas > 0" class="mt-1.5 text-xs text-neutral-500">
            Van {{ pr.camas }} de alto<template v-if="pr.limite === 'altura'"> porque {{ pr.camas + 1 }} no caben en {{ Math.round(res.m.nicho * 100) }} cm</template><template v-else-if="pr.limite === 'apilable'">: lo que aguanta tu caja</template><template v-else-if="pr.limite === 'peso'"> para no pasar de 250 kg por bandeja</template>.
          </p>

          <!-- Cómo va en la bandeja: las dos orientaciones, vistas desde arriba -->
          <p class="mt-4 text-sm font-medium text-neutral-700">¿Cómo va en la bandeja? <span class="font-normal text-neutral-500">(vista desde arriba, el frente abajo)</span></p>
          <div class="mt-1.5 grid grid-cols-2 gap-2">
            <button
              v-for="o in orientaciones" :key="String(o.largoEnFrente)" type="button" :disabled="!o.porCama"
              :class="['flex items-center gap-2.5 rounded-xl p-2 text-left ring-1 transition disabled:cursor-not-allowed disabled:opacity-50', pr?.largoEnFrente === o.largoEnFrente && o.porCama ? 'bg-orange-50 ring-2 ring-brand-600' : 'bg-white ring-neutral-300 hover:ring-neutral-400']"
              :aria-pressed="pr?.largoEnFrente === o.largoEnFrente" @click="emit('cambio', { largoEnFrente: o.largoEnFrente })"
            >
              <svg :viewBox="`0 0 ${frente * 100 + 8} ${fondo * 100 + 8}`" class="h-10 w-16 flex-shrink-0" aria-hidden="true">
                <rect x="4" y="4" :width="frente * 100" :height="fondo * 100" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5" />
                <template v-for="i in o.cols" :key="i">
                  <rect v-for="j in o.filas" :key="j" :x="4 + (i - 1) * lado(o, 'f') * 100 + 1" :y="4 + fondo * 100 - j * lado(o, 'd') * 100 + 1" :width="lado(o, 'f') * 100 - 2" :height="lado(o, 'd') * 100 - 2" fill="#d6a964" stroke="#7a5a2e" stroke-width="1" rx="1.5" />
                </template>
              </svg>
              <span class="min-w-0 text-sm leading-tight">
                <b class="block text-neutral-900">{{ cmTxt(o.largoEnFrente ? caja.largo : caja.ancho) }} cm al frente</b>
                <span class="text-neutral-600">{{ o.porCama ? `${o.cols} × ${o.filas} = ${o.porCama} por capa` : `no entra en ${mm(fondo)} de fondo` }}</span>
              </span>
            </button>
          </div>
        </template>
        <p v-else class="mt-3 text-sm text-neutral-600">Agrega tu caja en el paso anterior.</p>
      </fieldset>

      <details class="fl-mas">
        <summary>Pasillo entre estantes</summary>
        <label class="fl-campo mt-2">
          <span>Ancho del carro de carga (cm) <FlujoInfo>El pasillo es el ancho del carro + 30 cm (mínimo 1,2 m). Sin carro, 1 m.</FlujoInfo></span>
          <input :value="modelo.anchoCarro ? Math.round(modelo.anchoCarro * 100) : ''" type="number" min="30" max="200" step="any" placeholder="Sin carro" class="form-input" @change="emit('cambio', { anchoCarro: Number(($event.target as HTMLInputElement).value) / 100 || null })">
        </label>
      </details>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useProyecto, type Modelo } from '~/stores/proyecto';
import { resultadoModelo, mejorBandeja, moduloAR, nivelesSugeridosAR, orientacionesCaja, FONDO_ESTANDAR_AR, FRENTE_DEFECTO_AR, MANO_AR } from '~/lib/flujo/calculos.js';
import { ANRA_FRENTES, ANRA_FONDOS, ANRA_ANGULOS, ANRA_ANGULO_DEFECTO, ANRA_ALTURA, ANRA_CARGA } from '~/lib/rack3d/medidas.js';
import { DISTANCIAS } from '~/lib/rack3d/parametrosTecnicos.js';

const props = defineProps<{ modelo: Modelo }>();
const emit = defineEmits<{ cambio: [c: Partial<Modelo>] }>();
const p = useProyecto();

const VISTAS = [{ v: 'frente', t: 'Frente' }, { v: 'planta', t: 'Arriba' }, { v: '3d', t: '3D' }] as const;
const vista = ref<'frente' | 'planta' | '3d'>('frente');
const DIMS = [{ k: 'largo', t: 'Largo' }, { k: 'ancho', t: 'Ancho' }, { k: 'alto', t: 'Alto' }] as const;
// Botones chicos: sin elegir / elegido
const CH = 'inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-semibold ring-1 transition';
const CH_NO = 'bg-white text-neutral-700 ring-neutral-300 hover:ring-neutral-400';
const CH_SI = 'bg-orange-50 text-brand-800 ring-2 ring-brand-600';
const fm = (v: number) => (+(+v).toFixed(2)).toLocaleString('es-CL', { minimumFractionDigits: 1 });
const n = (v: number) => Math.round(v).toLocaleString('es-CL');
const mm = (v: number) => Math.round(v * 1000).toLocaleString('es-CL');
const cmTxt = (v: number) => Math.round((v || 0) * 100);

const alto = computed(() => Number(props.modelo.altoAngulo) || ANRA_ANGULO_DEFECTO);
const frente = computed(() => (ANRA_FRENTES.includes(Number(props.modelo.frente)) ? Number(props.modelo.frente) : FRENTE_DEFECTO_AR));
const fondo = computed(() => Number(props.modelo.bandeja) || FONDO_ESTANDAR_AR);
const niveles = computed(() => props.modelo.niveles);

// Las cajas del modelo (la que más se pide primero): esa decide la bandeja
const tipos = computed(() => p.cajas.filter((c) => (props.modelo.cantidades?.[c.id] ?? 0) > 0).sort((a, b) => (props.modelo.cantidades[b.id] ?? 0) - (props.modelo.cantidades[a.id] ?? 0)));
const cajaSel = ref<string | null>(null);
const caja = computed(() => tipos.value.find((c) => c.id === cajaSel.value) ?? tipos.value[0] ?? p.cajas[0] ?? null);

const res = computed(() => resultadoModelo(props.modelo, { cajas: p.cajas }) as any);
// La caja principal tal como va en un nivel (frente × fondo × alto, orientación y por qué no van más de alto)
const pr = computed(() => res.value.principal);
const orientaciones = computed(() => (caja.value ? orientacionesCaja(frente.value, fondo.value, caja.value) : []));
const lado = (o: { largoEnFrente: boolean }, eje: 'f' | 'd') => ((o.largoEnFrente === (eje === 'f')) ? caja.value!.largo : caja.value!.ancho);
const cajasDibujo = computed(() => res.value.porTipo.map((x: any) => ({ ...x, bandejas: x.cajas > 0 ? Math.ceil((props.modelo.cantidades[x.c.id] ?? 0) / x.cajas) : 0 })));

// ─── Niveles: ¿cabe otra bandeja? Con N + 1 niveles el espacio libre tiene que recibir la caja + la mano ───
const conNiveles = (k: number) => (caja.value ? moduloAR({ altoAngulo: alto.value, frente: frente.value, fondo: fondo.value, niveles: k, caja: caja.value, largoEnFrente: props.modelo.largoEnFrente ?? null }) : null);
const siguiente = computed(() => (niveles.value < ANRA_CARGA.max ? conNiveles(niveles.value + 1) : null));
const puedeMas = computed(() => !!siguiente.value?.valido);
const motivoNoMas = computed(() => {
  if (niveles.value >= ANRA_CARGA.max) return `Llegaste al máximo: ${ANRA_CARGA.max} niveles de bandeja.`;
  const x = siguiente.value, c = caja.value;
  if (!x || !c) return 'No cabe otra bandeja.';
  return `Con tu caja de ${cmTxt(c.alto)} cm no cabe otra bandeja: quedarían ${cmTxt(x.libre)} cm libres y necesita ${cmTxt(c.alto + MANO_AR)} cm (la caja + 3 cm para sacarla).`;
});
const avisoNiveles = ref('');
let relojNiveles: ReturnType<typeof setTimeout> | null = null;
function avisar(t: string) {
  avisoNiveles.value = t;
  if (relojNiveles) clearTimeout(relojNiveles);
  relojNiveles = setTimeout(() => { avisoNiveles.value = ''; }, 7000);
}
function masNivel() {
  if (puedeMas.value) { avisoNiveles.value = ''; emit('cambio', { niveles: niveles.value + 1 }); } else avisar(motivoNoMas.value);
}
// Si la caja cambia y ya no cabe en los niveles que había, se baja al máximo que la recibe y se dice por qué
watch(() => [caja.value?.alto, caja.value?.largo, caja.value?.ancho, alto.value, fondo.value, frente.value], () => {
  const c = caja.value;
  if (!c || (pr.value?.cajas ?? 0) > 0) return;
  for (let k = niveles.value - 1; k >= 1; k--) {
    if (conNiveles(k)?.valido) {
      const antes = conNiveles(niveles.value);
      emit('cambio', { niveles: k });
      avisar(`Bajamos a ${k} ${k === 1 ? 'nivel' : 'niveles'}: con ${niveles.value} tu caja de ${cmTxt(c.alto)} cm no cabía (quedaban ${cmTxt(antes?.libre ?? 0)} cm libres).`);
      return;
    }
  }
});

// ─── Propuesta y sugerencias ───
const propuesta = computed(() => mejorBandeja(props.modelo, { cajas: p.cajas, altura: p.bodega.altura }));
const enPropuesta = computed(() => {
  const b = propuesta.value;
  return !b || (fondo.value === b.bandeja && frente.value === b.frente && niveles.value === b.niveles && alto.value === b.altoAngulo && (props.modelo.largoEnFrente ?? null) === null);
});
function usarPropuesta() {
  const b = propuesta.value;
  if (b) emit('cambio', { bandeja: b.bandeja, frente: b.frente, niveles: b.niveles, altoAngulo: b.altoAngulo, largoEnFrente: null });
}
const total = computed(() => res.value.total as number);
// Bandeja de 600 si guarda más por módulo que la actual (con los niveles que le convienen en este ángulo)
const alt600 = computed(() => {
  if (!caja.value || fondo.value >= 0.6) return null;
  const x = nivelesSugeridosAR({ altoAngulo: alto.value, frente: frente.value, fondo: 0.6, caja: caja.value });
  if (!x || x.porModulo <= (res.value.porModulo || 0)) return null;
  return { ...x, modulos: total.value && x.porModulo ? Math.ceil(total.value / x.porModulo / (props.modelo.doble ? 2 : 1)) : 0 };
});
function usar600() {
  if (alt600.value) emit('cambio', { bandeja: 0.6, niveles: alt600.value.niveles, largoEnFrente: null });
}
// Un ángulo más alto si el techo lo permite y guarda más por módulo (lo de arriba puede quedar con escalera)
const masAlto = computed(() => {
  if (!caja.value || !p.bodega.altura) return null;
  const techo = p.bodega.altura - DISTANCIAS.holguraTecho.valor;
  for (const a of ANRA_ANGULOS.filter((x) => x > alto.value + 1e-6 && x <= techo + 1e-6)) {
    const x = nivelesSugeridosAR({ altoAngulo: a, frente: frente.value, fondo: fondo.value, caja: caja.value, escalera: true });
    if (x && x.porModulo > (res.value.porModulo || 0)) return { ...x, alto: a };
  }
  return null;
});

// ─── Cambios ───
// Alto del ángulo: con él se vuelven a sugerir los niveles (los que guardan más sin escalera)
function cambiarAngulo(v: number, nivelesDados?: number) {
  if (!(v > 0)) return;
  const a = Math.min(ANRA_ALTURA.max, Math.max(ANRA_ALTURA.min, Math.round((v * 1000) / ANRA_ALTURA.paso) * ANRA_ALTURA.paso)) / 1000;
  const x = caja.value ? nivelesSugeridosAR({ altoAngulo: a, frente: frente.value, fondo: fondo.value, caja: caja.value, largoEnFrente: props.modelo.largoEnFrente ?? null, escalera: !!nivelesDados }) : null;
  emit('cambio', { altoAngulo: a, niveles: nivelesDados ?? x?.niveles ?? niveles.value });
}
// La caja es la del paso 3 (un solo dato en todo el flujo)
function medida(k: 'largo' | 'ancho' | 'alto', e: Event) {
  const v = Number((e.target as HTMLInputElement).value);
  if (caja.value && v > 0) (caja.value as any)[k] = Math.min(2, v / 100);
}
function cantidad(e: Event) {
  if (!caja.value) return;
  const v = Math.max(0, Math.round(Number((e.target as HTMLInputElement).value) || 0));
  emit('cambio', { cantidades: { ...props.modelo.cantidades, [caja.value.id]: v } });
  // La caja queda con lo que suman todos sus ángulos ranurados (igual que en PasoRack): si no, el reparto
  // posterior le cambiaba al cliente el número que escribió
  const otros = p.modelos.filter((m) => m.tipo === 'AR' && m.id !== props.modelo.id).reduce((s, m) => s + (m.cantidades?.[caja.value!.id] ?? 0), 0);
  if (v + otros > 0) caja.value.cantidad = v + otros;
}
</script>

<style scoped>
.fl-factor { display: inline-flex; align-items: center; height: 1.625rem; padding: 0 .5rem; border-radius: .5rem; background: #fff; box-shadow: inset 0 0 0 1px #e5e5e5; font-weight: 600; color: #262626; }
.fl-paso { display: inline-flex; height: 1.5rem; width: 1.5rem; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 9999px; background: #fff7ed; color: #c2410c; font-size: .8rem; font-weight: 700; box-shadow: inset 0 0 0 1px #fed7aa; }
.fl-factor--fuerte { background: #fff7ed; box-shadow: inset 0 0 0 1px #fdba74; color: #9a3412; }
</style>
