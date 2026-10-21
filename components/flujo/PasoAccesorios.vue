<template>
  <div>
    <h1 class="fl-titulo">Accesorios y seguridad</h1>
    <p class="fl-bajada">Te proponemos lo que tu rack necesita para operar seguro. Puedes quitar o cambiar la cantidad.</p>
    <p v-if="estimado" class="mt-3 rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
      Cantidades estimadas: se recalculan cuando ubiques tus racks en la bodega.
    </p>

    <TransitionGroup tag="ul" name="fl-lista" class="mt-6 space-y-3">
      <li v-for="a in lista" :key="a.id" :class="['fl-card flex gap-4', !a.incluido && 'opacity-60']">
        <span class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path :d="ICONO[a.id] ?? ICONO.otro" /></svg>
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-baseline justify-between gap-x-3">
            <p class="font-semibold text-neutral-900">{{ a.nombre }}<span v-if="a.medida" class="font-normal text-neutral-500"> · {{ a.medida }}</span></p>
            <span v-if="a.obligatorio" class="text-xs font-semibold uppercase tracking-wide text-amber-700">Recomendado</span>
          </div>
          <p class="mt-0.5 text-neutral-600">{{ a.paraQue }}</p>
          <p class="mt-1 text-sm text-neutral-500">{{ a.motivo }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <label class="flex items-center gap-2 text-sm text-neutral-700">
              Cantidad
              <input :value="a.cantidad" type="number" min="0" step="1" :disabled="!a.incluido" class="form-input !h-10 !w-24 text-right" @change="cantidad(a.id, $event)">
              {{ a.unidad }}
            </label>
            <button type="button" :class="['fl-chip !min-h-10 !w-auto !px-4 !text-sm', a.incluido && 'fl-chip--sel']" :aria-pressed="a.incluido" @click="alternar(a.id)">
              {{ a.incluido ? 'Incluido' : 'Agregar' }}
            </button>
          </div>
        </div>
      </li>
    </TransitionGroup>
    <p v-if="!lista.length" class="mt-6 text-neutral-600">Tu rack no necesita accesorios adicionales.</p>
    <p class="mt-4 text-sm text-neutral-500">Medidas y módulos referenciales: los confirma Técnica Racklog según su catálogo.</p>

    <FlujoAcciones texto="Ubicar en mi bodega" @atras="emit('atras')" @siguiente="emit('siguiente')" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useProyecto } from '~/stores/proyecto';
import { proponerAccesorios, aplicarAjustes } from '~/lib/rack3d/accesorios.js';
import { resultadoModelo, ubicarModelos } from '~/lib/flujo/calculos.js';

const emit = defineEmits<{ siguiente: []; atras: [] }>();
const p = useProyecto();

// Iconos de linea (un solo set)
const ICONO: Record<string, string> = {
  canilleras: 'M8 21h8M9 21V9a3 3 0 016 0v12M9 13h6',
  proteccionBastidor: 'M4 7h16M4 17h16M6 7l4 10M10 7l4 10M14 7l4 10',
  barandas: 'M3 8h18M3 14h18M5 8v10M12 8v10M19 8v10',
  planosCarga: 'M3 10h18v4H3zM6 10v4M10 10v4M14 10v4M18 10v4',
  separadores: 'M8 4v16M16 4v16M8 9h8M8 15h8',
  topes: 'M4 15h16M7 15V9h10v6',
  placaCapacidad: 'M5 5h14v14H5zM8 9h8M8 13h5',
  mallaAnticaida: 'M4 4h16v16H4zM4 9h16M4 14h16M9 4v16M14 4v16',
  otro: 'M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7z',
};

// Sin racks ubicados todavia: se estiman en una bodega amplia (cabeceras libres, como suele quedar)
const estimado = computed(() => !p.racks.length);
const racksBase = computed(() => {
  if (p.racks.length) return p.racks;
  const amplia = { ...p.bodega, ancho: 200, largo: 200, forma: null, elementos: [] };
  const cuerpos = Object.fromEntries(p.modelos.map((m) => [m.id, resultadoModelo(m, { pallets: p.pallets, cajas: p.cajas, grua: p.bodega.grua }).cuerpos]));
  let k = 0;
  return ubicarModelos(amplia, p.modelos, cuerpos, { pallets: p.pallets, nuevoId: () => `e${k++}` }).racks;
});
const lista = computed(() => aplicarAjustes(proponerAccesorios({ bodega: p.bodega, racks: racksBase.value, pallets: p.pallets }), p.accesorios) as any[]);

function alternar(id: string) {
  const q = p.accesorios.quitados;
  p.accesorios.quitados = q.includes(id) ? q.filter((x) => x !== id) : [...q, id];
}
function cantidad(id: string, e: Event) {
  p.accesorios.cantidades = { ...p.accesorios.cantidades, [id]: Math.max(0, Math.round(Number((e.target as HTMLInputElement).value) || 0)) };
}
</script>
