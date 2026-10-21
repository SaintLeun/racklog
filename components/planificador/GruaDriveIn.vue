<template>
  <details class="rounded-xl bg-amber-50/60 text-sm ring-1 ring-amber-200" :open="abierto">
    <summary class="cursor-pointer px-3 py-2.5 font-semibold text-neutral-900">
      Mide tu grúa: define el primer nivel
      <span v-if="m.primerNivelPorGrua" class="ml-1 rounded-full bg-amber-200 px-2 py-0.5 text-[11px] text-amber-900">manda la grúa</span>
    </summary>
    <div class="space-y-3 px-3 pb-3">
      <p class="text-neutral-700">En el drive-in la grúa <b>entra a la calle</b> por debajo del primer nivel. Si lo más alto de la grúa no pasa bajo el carril, choca.</p>

      <svg viewBox="0 0 300 190" class="w-full" role="img" aria-label="Grúa dentro de la calle del drive-in, con las medidas A, B y C">
        <!-- Pilares y carril del primer nivel -->
        <rect x="18" y="10" width="7" height="160" fill="#1e3a8a" />
        <rect x="275" y="10" width="7" height="160" fill="#1e3a8a" />
        <rect x="25" y="34" width="250" height="6" fill="#ea580c" />
        <text x="150" y="28" text-anchor="middle" font-size="10" fill="#9a3412" font-weight="700">Carril del 1.er nivel · {{ fm(m.primerNivel) }} m</text>
        <!-- Grúa vista de frente -->
        <rect x="95" y="122" width="110" height="38" rx="5" fill="#fbbf24" stroke="#92400e" />
        <rect x="100" y="62" width="6" height="62" fill="#78716c" /><rect x="194" y="62" width="6" height="62" fill="#78716c" />
        <rect x="100" y="58" width="100" height="6" fill="#78716c" />
        <rect x="132" y="70" width="36" height="60" fill="#a8a29e" />
        <circle cx="112" cy="163" r="8" fill="#292524" /><circle cx="188" cy="163" r="8" fill="#292524" />
        <line x1="5" y1="171" x2="295" y2="171" stroke="#525252" stroke-width="2" />
        <!-- Cotas -->
        <g stroke="#0369a1" stroke-width="1.2" fill="none" marker-start="url(#g)" marker-end="url(#g)">
          <line x1="215" y1="58" x2="215" y2="169" />
          <line x1="238" y1="70" x2="238" y2="169" />
          <line x1="95" y1="182" x2="205" y2="182" />
          <line x1="60" y1="40" x2="60" y2="58" stroke="#16a34a" />
        </g>
        <defs><marker id="g" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L6 3 L0 6 Z" fill="#0369a1" /></marker></defs>
        <g font-size="12" font-weight="700" fill="#0369a1">
          <text x="219" y="118">A</text><text x="242" y="128">B</text><text x="146" y="180" dy="-2">C</text>
        </g>
        <text x="64" y="52" font-size="9" fill="#15803d" font-weight="600">holgura</text>
      </svg>

      <div class="grid grid-cols-3 gap-2">
        <label class="block text-xs font-medium text-neutral-700">A (m)
          <input :value="rack.techoGrua ?? ''" type="number" min="1" max="4" step="0.01" placeholder="2,15" class="gd-input" @change="emitir('techoGrua', $event)">
        </label>
        <label class="block text-xs font-medium text-neutral-700">B (m)
          <input :value="rack.mastilGrua ?? ''" type="number" min="1" max="4" step="0.01" placeholder="2,05" class="gd-input" @change="emitir('mastilGrua', $event)">
        </label>
        <label class="block text-xs font-medium text-neutral-700">C (m)
          <input :value="rack.anchoGrua ?? ''" type="number" min="0.6" max="2" step="0.01" placeholder="1,10" class="gd-input" @change="emitir('anchoGrua', $event)">
        </label>
      </div>
      <ul class="list-disc space-y-0.5 pl-5 text-xs text-neutral-600">
        <li><b>A · Techo protector:</b> del piso a lo más alto del techo protector del operador.</li>
        <li><b>B · Mástil bajado:</b> del piso a lo más alto del mástil con las horquillas abajo. Viene en la ficha de la grúa como "altura mástil replegado".</li>
        <li><b>C · Ancho total:</b> lo más ancho de la grúa, de rueda a rueda o de chasis a chasis.</li>
      </ul>

      <dl class="space-y-1 rounded-lg bg-white p-2.5 ring-1 ring-neutral-200">
        <div class="flex justify-between"><dt class="text-neutral-600">Primer nivel (bajo el carril)</dt><dd class="font-semibold">{{ fm(m.primerNivel) }} m</dd></div>
        <div class="flex justify-between"><dt class="text-neutral-600">Ancho de calle (eje a eje)</dt><dd class="font-semibold">{{ fm(m.anchoCalle) }} m</dd></div>
        <div class="flex justify-between"><dt class="text-neutral-600">Alto total del rack</dt><dd class="font-semibold">{{ fm(m.alto) }} m</dd></div>
      </dl>
      <p v-if="m.primerNivelPorGrua" class="text-xs font-medium text-amber-800">
        La grúa sube el primer nivel {{ fm(m.primerNivel - 1.3) }} m sobre lo que pide el pallet de piso: ese espacio no se usa. Con una grúa más baja ganas altura para más niveles.
      </p>
      <p v-if="m.calleAnchaPorGrua" class="text-xs font-medium text-amber-800">Tu grúa es más ancha que el pallet: ensanchamos la calle para que pase con 10 cm por lado.</p>
      <p v-if="!rack.techoGrua && !rack.mastilGrua" class="text-xs text-neutral-500">Sin estas medidas usamos solo el alto del pallet. Un ejecutivo las confirma en terreno.</p>
    </div>
  </details>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { medidasRack } from '~/lib/rack3d/planificador.js';

const props = defineProps<{ rack: any; abierto?: boolean }>();
const emit = defineEmits<{ cambio: [c: Record<string, number | null>] }>();
const m = computed(() => medidasRack(props.rack) as any);
const fm = (v: number) => (+(+v).toFixed(2)).toLocaleString('es-CL');

function emitir(campo: string, e: Event) {
  const v = Number((e.target as HTMLInputElement).value);
  emit('cambio', { [campo]: v > 0 ? v : null });
}
</script>

<style scoped>
.gd-input { margin-top: .25rem; display: block; height: 2.25rem; width: 100%; border-radius: .5rem; border: 1px solid #d4d4d4; background: #fff; padding: 0 .5rem; font-size: .9rem; font-weight: 600; color: #171717; }
.gd-input:focus { outline: none; border-color: #ea580c; box-shadow: 0 0 0 3px #fed7aa; }
</style>
