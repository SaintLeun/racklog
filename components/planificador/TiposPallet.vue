<template>
  <div class="card p-5">
    <h2 class="flex items-center text-sm font-semibold uppercase tracking-wider text-neutral-600">
      Tus pallets
      <PlanificadorAyuda titulo="tus pallets">Crea un tipo por cada pallet distinto que guardas (alto, peso, cuántos y cuánto rota). Después, en cada rack selectivo, eliges qué tipo va en cada nivel. La altura de las vigas se ajusta sola.</PlanificadorAyuda>
    </h2>
    <p class="mt-1 text-xs text-neutral-500">Paso 1: crea tus tipos · Paso 2: asígnalos por nivel o usa "Acomodar solo".</p>

    <ul class="mt-3 space-y-2">
      <li v-for="(t, i) in tipos" :key="t.id" class="rounded-xl p-2.5 ring-1 ring-neutral-200">
        <div class="flex items-center gap-2">
          <span class="h-4 w-4 flex-shrink-0 rounded" :style="{ background: t.color }" aria-hidden="true" />
          <input :value="t.nombre" type="text" class="tp-in flex-1 font-semibold" aria-label="Nombre del pallet" @change="set(i, { nombre: val($event) || t.nombre })">
          <button type="button" class="px-1 text-neutral-400 hover:text-red-600" :aria-label="`Quitar ${t.nombre}`" @click="quitar(i)">✕</button>
        </div>
        <div class="mt-2 grid grid-cols-3 gap-1.5">
          <label class="tp-lb">Alto (m)<input :value="t.alto" type="number" min="0.3" max="3" step="0.05" class="tp-in" @change="set(i, { alto: num($event, t.alto) })"></label>
          <label class="tp-lb">Peso (kg)<input :value="t.peso" type="number" min="1" step="50" class="tp-in" @change="set(i, { peso: num($event, t.peso) })"></label>
          <label class="tp-lb">Cantidad<input :value="t.cantidad" type="number" min="0" step="1" class="tp-in" @change="set(i, { cantidad: num($event, 0) })"></label>
        </div>
        <div class="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-neutral-100 p-0.5">
          <button
            v-for="(r, k) in ROTACION" :key="k" type="button"
            :class="['h-7 rounded-md text-[11px] font-semibold transition', t.rotacion === k ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']"
            @click="set(i, { rotacion: k })"
          >{{ r.t }}</button>
        </div>
        <div v-if="t.cantidad" class="mt-2">
          <div class="h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div class="h-full rounded-full" :style="{ width: `${Math.min(100, (ubic(t) / t.cantidad) * 100)}%`, background: t.color }" />
          </div>
          <p :class="['mt-1 text-[11px] font-medium', ubic(t) >= t.cantidad ? 'text-green-700' : 'text-amber-700']">
            {{ ubic(t) }} de {{ t.cantidad }} ubicados{{ ubic(t) < t.cantidad ? ` · faltan ${t.cantidad - ubic(t)}` : ubic(t) > t.cantidad ? ` · sobran ${ubic(t) - t.cantidad}` : ' ✓' }}
          </p>
        </div>
      </li>
    </ul>

    <button type="button" class="plan-accion-tp mt-2 w-full" @click="agregar">+ Agregar tipo de pallet</button>
    <button v-if="tipos.length" type="button" class="btn btn-primary btn-sm mt-2 w-full" :disabled="!hayRS" @click="emit('acomodar')">Acomodar solo en mis selectivos</button>
    <p v-if="tipos.length && !hayRS" class="mt-1 text-[11px] text-neutral-500">Agrega al menos un rack selectivo para acomodar.</p>
    <p v-if="libres && tipos.length" class="mt-2 text-[11px] text-neutral-500">{{ libres }} posiciones sin tipo asignado (usan el pallet estándar de 1,2 m).</p>
  </div>
</template>

<script lang="ts" setup>
import { ROTACION, nuevoTipo } from '~/lib/rack3d/mezcla.js';

const props = defineProps<{ tipos: any[]; porTipo: Record<string, number>; libres: number; hayRS: boolean }>();
const emit = defineEmits<{ 'update:tipos': [t: any[]]; acomodar: [] }>();

const val = (e: Event) => (e.target as HTMLInputElement).value.trim();
const num = (e: Event, d: number) => { const v = Number(val(e)); return Number.isFinite(v) && v >= 0 ? v : d; };
const ubic = (t: any) => props.porTipo[t.id] ?? 0;

function set(i: number, c: Record<string, unknown>) {
  emit('update:tipos', props.tipos.map((t, j) => (j === i ? { ...t, ...c } : t)));
}
function quitar(i: number) { emit('update:tipos', props.tipos.filter((_, j) => j !== i)); }
function agregar() { emit('update:tipos', [...props.tipos, nuevoTipo(props.tipos.length)]); }
</script>

<style scoped>
.tp-lb { display: grid; gap: .15rem; font-size: .68rem; font-weight: 600; color: #525252; }
.tp-in { height: 2rem; min-width: 0; border-radius: .5rem; border: 1px solid #e5e5e5; background: #fff; padding: 0 .45rem; font-size: .85rem; color: #171717; }
.tp-in:focus { outline: none; border-color: #ea580c; box-shadow: 0 0 0 2px #fed7aa; }
.plan-accion-tp { height: 2.25rem; border-radius: .75rem; font-size: .8rem; font-weight: 600; color: #9a3412; box-shadow: inset 0 0 0 1px #fdba74; }
.plan-accion-tp:hover { background: #fff7ed; }
</style>
