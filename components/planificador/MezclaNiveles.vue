<template>
  <div class="rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200">
    <p class="flex items-center text-sm font-semibold text-neutral-800">
      ¿Qué pallet va en cada nivel?
      <PlanificadorAyuda titulo="pallets por nivel">Toca un nivel y elige el tipo de pallet. La viga de arriba sube o baja según el alto del pallet. Lo que rota harto, abajo y a mano; lo alto y lento, al piso o arriba.</PlanificadorAyuda>
    </p>
    <p v-if="!tipos.length" class="mt-2 text-xs text-neutral-600">Primero crea tus tipos de pallet en "Tus pallets" (panel de la izquierda, arriba).</p>

    <div v-else class="mt-2 grid grid-cols-[120px_1fr] gap-3">
      <!-- Elevación clickeable -->
      <svg :viewBox="`0 0 120 ${H}`" class="w-full" role="group" aria-label="Niveles del rack">
        <line x1="0" :x2="120" :y1="y(0)" :y2="y(0)" stroke="#525252" stroke-width="1.5" />
        <rect x="14" :y="y(m.alto)" width="4" :height="y(0) - y(m.alto)" fill="#1e3a8a" />
        <rect x="102" :y="y(m.alto)" width="4" :height="y(0) - y(m.alto)" fill="#1e3a8a" />
        <g v-for="(a, i) in alturas" :key="i" class="cursor-pointer" role="button" :aria-label="`${a.nombre}: ${a.tipo?.nombre ?? 'sin tipo'}`" @click="sel = i">
          <rect v-if="i > 0" x="18" :y="y(a.base) - 2" width="84" height="4" fill="#ea580c" />
          <rect
            x="22" :y="y(a.base + a.alto)" width="76" :height="Math.max(2, y(a.base) - y(a.base + a.alto) - (i > 0 ? 2 : 0))" rx="2"
            :fill="a.tipo?.color ?? '#e7e5e4'" :fill-opacity="a.tipo ? 0.85 : 0.6"
            :stroke="sel === i ? '#0f172a' : '#78716c'" :stroke-width="sel === i ? 2 : 0.6"
          />
          <text x="60" :y="(y(a.base) + y(a.base + a.alto)) / 2 + 3" text-anchor="middle" font-size="8" font-weight="700" fill="#1c1917" pointer-events="none">{{ fm(a.alto) }} m</text>
        </g>
      </svg>

      <!-- Lista de alturas -->
      <div class="space-y-1.5">
        <div v-for="(a, i) in [...alturas].map((x, j) => ({ ...x, j })).reverse()" :key="a.j" :class="['rounded-lg p-1.5 text-xs ring-1 transition', sel === a.j ? 'bg-white ring-neutral-900' : 'ring-neutral-200']" @click="sel = a.j">
          <div class="flex items-center justify-between gap-1">
            <span class="font-semibold text-neutral-800">{{ a.nombre }}</span>
            <span class="text-neutral-500">{{ a.j > 0 ? `viga a ${fm(a.base)} m` : 'piso' }}</span>
          </div>
          <select :value="rack.mezcla?.[a.j] ?? ''" class="mt-1 h-7 w-full rounded-md border border-neutral-200 bg-white px-1 text-xs" @change="asignar(a.j, ($event.target as HTMLSelectElement).value || null)">
            <option value="">Estándar 1,2 m</option>
            <option v-for="t in tipos" :key="t.id" :value="t.id">{{ t.nombre }} · {{ fm(t.alto) }} m</option>
          </select>
          <button v-if="sel === a.j" type="button" class="mt-1 w-full rounded-md py-1 text-[11px] font-semibold text-brand-800 hover:bg-brand-50" @click.stop="emit('todos', a.j, rack.mezcla?.[a.j] ?? null)">
            Aplicar a {{ a.nombre.toLowerCase() }} de todos los selectivos
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { medidasRack, formatoM } from '~/lib/rack3d/planificador.js';

const props = defineProps<{ rack: any; tipos: any[] }>();
const emit = defineEmits<{ asignar: [mezcla: (string | null)[]]; todos: [altura: number, id: string | null] }>();
const sel = ref(0);
const H = 190;
const m = computed(() => medidasRack(props.rack) as any);
const y = (v: number) => H - 6 - (v / Math.max(m.value.alto, 1)) * (H - 14);
const fm = (v: number) => formatoM(v);
const porId = computed(() => new Map(props.tipos.map((t) => [t.id, t])));

const alturas = computed(() => [0, ...m.value.nivelesY].map((base: number, i: number) => ({
  base, alto: m.value.altosCarga?.[i] ?? 1.2, nombre: i === 0 ? 'Piso' : `Nivel ${i}`, tipo: porId.value.get(props.rack.mezcla?.[i]),
})));

function asignar(i: number, id: string | null) {
  const n = props.rack.niveles + 1;
  const mezcla = Array.from({ length: n }, (_, j) => (j === i ? id : props.rack.mezcla?.[j] ?? null));
  emit('asignar', mezcla);
}
</script>
