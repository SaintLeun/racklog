<template>
  <details class="card group" :open="abierto" @toggle="alAbrir">
    <summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
      <span>
        <span class="block text-sm font-semibold uppercase tracking-wider text-neutral-600">Evalúa tu proyecto</span>
        <span class="mt-1 block text-sm text-neutral-600">¿Te alcanza? ¿Cuánto ganas? ¿Selectivo o drive-in? ¿Cuánto arriendo te ahorras?</span>
      </span>
      <span class="text-xl text-neutral-400 group-open:hidden" aria-hidden="true">+</span>
      <span class="hidden text-xl text-neutral-400 group-open:inline" aria-hidden="true">−</span>
    </summary>

    <div class="grid gap-5 border-t border-neutral-100 p-5 md:grid-cols-2">
      <!-- ¿Me alcanza? -->
      <section>
        <h3 class="text-sm font-semibold text-neutral-900">¿Te alcanza la capacidad?</h3>
        <div class="mt-2 grid grid-cols-3 gap-2">
          <label class="plan-eval-campo">Productos distintos<input v-model.number="e.skus" type="number" min="0" class="plan-input !h-10" placeholder="40"></label>
          <label class="plan-eval-campo">Pallets por producto<input v-model.number="e.palletsPorSku" type="number" min="0" step="0.5" class="plan-input !h-10" placeholder="8"></label>
          <label class="plan-eval-campo">Crecimiento a 2 años (%)<input v-model.number="e.crecimiento" type="number" min="0" class="plan-input !h-10" placeholder="20"></label>
        </div>
        <p v-if="necesarias" class="mt-2 rounded-lg px-3 py-2 text-sm" :class="cubre >= 1 ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-900'" role="status">
          Necesitas <strong>{{ necesarias }}</strong> posiciones; tu diseño tiene <strong>{{ posiciones }}</strong>
          ({{ Math.round(cubre * 100) }} %).
          <template v-if="cubre < 1"> Te faltan {{ necesarias - posiciones }}.</template>
        </p>
      </section>

      <!-- Hoy vs. propuesta -->
      <section>
        <h3 class="text-sm font-semibold text-neutral-900">Hoy vs. tu diseño</h3>
        <label class="plan-eval-campo mt-2">Pallets que guardas hoy (en piso o racks)<input v-model.number="e.palletsHoy" type="number" min="0" class="plan-input !h-10" placeholder="250"></label>
        <p v-if="e.palletsHoy > 0" class="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-800" role="status">
          <template v-if="ganadas >= 0">Ganas <strong>{{ ganadas }}</strong> posiciones ({{ e.palletsHoy ? `+${Math.round((ganadas / e.palletsHoy) * 100)} %` : '' }}).</template>
          <template v-else>Tu diseño tiene {{ -ganadas }} posiciones menos que hoy.</template>
        </p>
      </section>

      <!-- Comparador -->
      <section class="md:col-span-2">
        <h3 class="text-sm font-semibold text-neutral-900">Selectivo vs. drive-in en tu bodega</h3>
        <div class="mt-2 grid gap-2 sm:grid-cols-2">
          <div v-for="c in comparacion" :key="c.tipo" :class="['rounded-xl p-3 ring-1', c.mejor ? 'bg-brand-50 ring-brand-200' : 'bg-white ring-neutral-200']">
            <p class="flex items-baseline justify-between gap-2">
              <span class="font-semibold text-neutral-900">{{ c.nombre }}</span>
              <span class="text-lg font-bold tabular-nums text-neutral-900">{{ c.posiciones.toLocaleString('es-CL') }} <span class="text-xs font-medium text-neutral-500">posiciones</span></span>
            </p>
            <p class="mt-1 text-xs text-neutral-600">{{ c.detalle }}</p>
            <p class="mt-1 text-xs text-neutral-600">{{ c.nota }}</p>
          </div>
        </div>
        <p class="mt-2 text-xs text-neutral-500">
          Estimación referencial llenando la bodega con un solo sistema, con pasillos de 3,5 m (grúa contrapeso){{ bodega.altura ? ` y altura libre de ${formatoM(bodega.altura)} m` : '; indica la altura libre para ajustar los niveles' }}. Racklog la confirma en la revisión de tu diseño.
        </p>
      </section>

      <!-- Arriendo evitado -->
      <section class="md:col-span-2">
        <h3 class="text-sm font-semibold text-neutral-900">Arriendo que evitas al guardar en altura</h3>
        <div class="mt-2 grid grid-cols-[1fr_auto] gap-2 sm:max-w-md">
          <label class="plan-eval-campo">Arriendo por m² al mes<input v-model.number="e.valorM2" type="number" min="0" step="0.01" class="plan-input !h-10" placeholder="0,25"></label>
          <label class="plan-eval-campo">Moneda
            <select v-model="e.moneda" class="plan-input !h-10"><option value="UF">UF</option><option value="$">$</option></select>
          </label>
        </div>
        <p v-if="e.valorM2 > 0 && posiciones" class="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-800" role="status">
          <template v-if="arriendo.m2Evitados > 0">
            Para guardar {{ posiciones }} pallets en el piso necesitarías unos {{ Math.round(arriendo.m2Piso).toLocaleString('es-CL') }} m²:
            <strong>{{ Math.round(arriendo.m2Evitados).toLocaleString('es-CL') }} m² más</strong> que tu bodega. Eso son
            <strong>{{ dinero(arriendo.mensual) }} al mes</strong> ({{ dinero(arriendo.mensual * 12) }} al año) que no arriendas.
          </template>
          <template v-else>Con tu diseño, esos pallets también cabrían en el piso de tu bodega: no hay arriendo extra que evitar.</template>
        </p>
        <p class="mt-1 text-xs text-neutral-500">Supone {{ formatoM(SUPUESTOS.m2PorPalletPiso) }} m² por pallet en el piso, contando pasillos (referencial).</p>
      </section>
    </div>
  </details>
</template>

<script lang="ts" setup>
import { reactive, computed, watch } from 'vue';
import { necesidad, estimarSistema, arriendoEvitado, SUPUESTOS } from '~/lib/rack3d/evaluacion.js';
import { area, contorno, formatoM } from '~/lib/rack3d/planificador.js';

const props = defineProps<{
  bodega: { ancho: number; largo: number; forma: { x: number; y: number }[] | null; altura: number | null };
  posiciones: number;
  abierto?: boolean;
}>();
// resumen: una linea para la cotizacion y el PDF (vacia si no se lleno nada)
const emit = defineEmits<{ resumen: [texto: string]; abrir: [] }>();

const GUARDADO = 'racklog-planificador-evaluacion';
const e = reactive<{ skus: number | null; palletsPorSku: number | null; crecimiento: number | null; palletsHoy: number | null; valorM2: number | null; moneda: 'UF' | '$' }>(
  { skus: null, palletsPorSku: null, crecimiento: 20, palletsHoy: null, valorM2: null, moneda: 'UF' },
);
try { Object.assign(e, JSON.parse(localStorage.getItem(GUARDADO) || '{}')); } catch { /* sin almacenamiento */ }
watch(e, () => { try { localStorage.setItem(GUARDADO, JSON.stringify(e)); } catch { /* */ } }, { deep: true });

function alAbrir(ev: Event) {
  if ((ev.target as HTMLDetailsElement).open) emit('abrir');
}

const necesarias = computed(() => necesidad(e));
const cubre = computed(() => (necesarias.value ? props.posiciones / necesarias.value : 0));
const ganadas = computed(() => props.posiciones - (Number(e.palletsHoy) || 0));
const m2 = computed(() => area(contorno(props.bodega)));
const arriendo = computed(() => arriendoEvitado(props.posiciones, m2.value, e.valorM2));
const dinero = (v: number) => (e.moneda === 'UF' ? `${v.toLocaleString('es-CL', { maximumFractionDigits: 1 })} UF` : `$${Math.round(v).toLocaleString('es-CL')}`);

const comparacion = computed(() => {
  const rs = estimarSistema(props.bodega, 'RS'), di = estimarSistema(props.bodega, 'DI');
  const mejor = rs.posiciones >= di.posiciones ? 'RS' : 'DI';
  return [
    { tipo: 'RS', nombre: 'Rack selectivo', ...rs, mejor: mejor === 'RS', nota: 'Acceso directo a cada pallet: ideal con muchos productos distintos.' },
    { tipo: 'DI', nombre: 'Drive-in', ...di, mejor: mejor === 'DI', nota: `${rs.posiciones ? (di.posiciones >= rs.posiciones ? '+' : '') + Math.round(((di.posiciones - rs.posiciones) / rs.posiciones) * 100) + ' % de posiciones' : ''}; menos selectividad: conviene con pocos productos y mucho stock.` },
  ];
});

const resumen = computed(() => {
  const partes: string[] = [];
  if (necesarias.value) partes.push(`necesita ${necesarias.value} posiciones (el diseño cubre ${Math.round(cubre.value * 100)} %)`);
  if (Number(e.palletsHoy) > 0) partes.push(`hoy guarda ${e.palletsHoy} pallets`);
  if (Number(e.valorM2) > 0 && arriendo.value.m2Evitados > 0) partes.push(`arriendo evitado ${dinero(arriendo.value.mensual)}/mes`);
  return partes.join('; ');
});
watch(resumen, (t) => emit('resumen', t), { immediate: true });
defineExpose({ resumen, comparacion });
</script>

<style scoped>
.plan-eval-campo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #525252;
}
.plan-input {
  display: block;
  width: 100%;
  padding: 0 0.75rem;
  border: 1px solid #e5e5e5;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  background: #fff;
}
</style>
