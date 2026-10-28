<template>
  <div>
    <!-- Un solo elemento raíz: hereda la clase que le pasa el paso -->
    <!-- Vista frontal de una calle de drive-in (m): bastidores, carriles a cada lado por nivel, pallets
         sobre los carriles y la grúa con su operario dentro de la calle. La cota de la derecha dice si la
         grúa pasa bajo el primer carril (verde) o choca (rojo) -->
    <svg :viewBox="`0 0 ${W} ${H}`" class="h-auto w-full" role="img" :aria-label="descripcion">
      <title>{{ descripcion }}</title>
      <defs>
        <linearGradient id="di-pilar" x1="0" x2="1"><stop offset="0" stop-color="#6b7280" /><stop offset=".5" stop-color="#9ca3af" /><stop offset="1" stop-color="#6b7280" /></linearGradient>
        <linearGradient id="di-carga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f1dcb5" /><stop offset="1" stop-color="#d9b47c" /></linearGradient>
        <marker id="di-f" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 6 3 0 6z" fill="#334155" /></marker>
      </defs>
      <!-- Piso -->
      <rect :x="0" :y="y(0)" :width="W" height="6" fill="#e5e7eb" />
      <line :x1="0" :x2="W" :y1="y(0)" :y2="y(0)" stroke="#9ca3af" />

      <!-- Pallets de la calle (atrás de la grúa) -->
      <!-- El piso también guarda (la grúa deja los de atrás primero): se ve igual que los demás niveles -->
      <g v-for="(n, i) in niveles" :key="`p${i}`">
        <rect :x="xc - pw / 2" :y="y(n.base + 0.15)" :width="pw" :height="y(n.base) - y(n.base + 0.15)" fill="#b7895a" />
        <rect :x="xc - pw / 2 + 2" :y="y(n.base + alto)" :width="pw - 4" :height="y(n.base + 0.15) - y(n.base + alto)" fill="url(#di-carga)" stroke="#a07a45" stroke-width="0.6" rx="1.5" />
      </g>

      <!-- Bastidores y carriles (rieles grises sobre cartelas naranjas, a ambos lados de la calle) -->
      <rect v-for="(xp, i) in [xa, xb]" :key="`b${i}`" :x="xp - pil / 2" :y="y(m.alto)" :width="pil" :height="y(0) - y(m.alto)" fill="url(#di-pilar)" rx="1" />
      <g v-for="(yv, i) in m.cartelasY" :key="`c${i}`">
        <rect :x="xa + pil / 2" :y="y(yv)" :width="riel" :height="y(yv - 0.1) - y(yv)" fill="#8a8f96" />
        <rect :x="xb - pil / 2 - riel" :y="y(yv)" :width="riel" :height="y(yv - 0.1) - y(yv)" fill="#8a8f96" />
        <rect :x="xa + pil / 2" :y="y(yv - 0.1)" :width="riel * 0.7" :height="y(yv - 0.22) - y(yv - 0.1)" fill="#f97316" />
        <rect :x="xb - pil / 2 - riel * 0.7" :y="y(yv - 0.1)" :width="riel * 0.7" :height="y(yv - 0.22) - y(yv - 0.1)" fill="#f97316" />
      </g>
      <!-- Número de cada nivel (el 1 es el piso) -->
      <text v-for="(n, i) in niveles" :key="`t${i}`" :x="xa - 8" :y="y(n.base + alto / 2) + 3" font-size="9" font-weight="600" text-anchor="end" fill="#64748b" font-family="Inter, system-ui, sans-serif">{{ n.piso ? 'piso' : i + 1 }}</text>
      <!-- Arriostramiento superior -->
      <rect :x="xa - pil / 2" :y="y(m.alto)" :width="xb - xa + pil" :height="y(m.alto - 0.1) - y(m.alto)" fill="#f97316" />

      <!-- Grúa dentro de la calle: ruedas, chasis, mástil, techo protector y operario -->
      <g v-if="g && g.puede" :opacity="0.45">
        <rect :x="xc - gw / 2" :y="y(0.95)" :width="gw" :height="y(0.25) - y(0.95)" fill="#f59e0b" rx="3" />
        <rect :x="xc - gw / 2 + 2" :y="y(0.3)" :width="gw * 0.22" :height="y(0) - y(0.3)" fill="#1f2937" rx="2" />
        <rect :x="xc + gw / 2 - 2 - gw * 0.22" :y="y(0.3)" :width="gw * 0.22" :height="y(0) - y(0.3)" fill="#1f2937" rx="2" />
        <!-- Operario sentado -->
        <circle :cx="xc" :cy="y(techo - 0.42)" :r="kx * 0.11" fill="#fcd9b6" stroke="#7c5a3a" stroke-width="0.6" />
        <rect :x="xc - kx * 0.18" :y="y(techo - 0.55)" :width="kx * 0.36" :height="y(0.95) - y(techo - 0.55)" fill="#1d4ed8" rx="3" />
        <rect :x="xc - kx * 0.13" :y="y(techo - 0.32)" :width="kx * 0.26" :height="kx * 0.05" fill="#facc15" />
        <!-- Techo protector -->
        <rect :x="xc - gw / 2 + 1" :y="y(techo)" :width="3" :height="y(0.95) - y(techo)" fill="#374151" />
        <rect :x="xc + gw / 2 - 4" :y="y(techo)" :width="3" :height="y(0.95) - y(techo)" fill="#374151" />
        <rect :x="xc - gw / 2" :y="y(techo)" :width="gw" height="4" fill="#374151" rx="1" />
        <!-- Mástil bajado (dos rieles delante del operario) y horquillas con el pallet en traslado -->
        <rect v-if="mastil > 0" :x="xc - gw * 0.32" :y="y(mastil)" width="3" :height="y(0.05) - y(mastil)" fill="#4b5563" />
        <rect v-if="mastil > 0" :x="xc + gw * 0.32 - 3" :y="y(mastil)" width="3" :height="y(0.05) - y(mastil)" fill="#4b5563" />
      </g>
      <!-- Equipo que no trabaja en drive-in -->
      <g v-else-if="g">
        <text :x="xc" :y="y(1.2)" text-anchor="middle" font-size="10" font-weight="700" fill="#b91c1c">Tu equipo no entra</text>
        <text :x="xc" :y="y(1.2) + 12" text-anchor="middle" font-size="9" fill="#b91c1c">a la calle</text>
      </g>

      <!-- Cotas -->
      <g font-size="10" fill="#334155" font-family="Inter, system-ui, sans-serif">
        <!-- Alto del marco -->
        <line :x1="xa - 26" :x2="xa - 26" :y1="y(0)" :y2="y(m.alto)" stroke="#334155" stroke-width="0.8" marker-start="url(#di-f)" marker-end="url(#di-f)" />
        <text :x="xa - 30" :y="(y(0) + y(m.alto)) / 2" text-anchor="middle" :transform="`rotate(-90 ${xa - 30} ${(y(0) + y(m.alto)) / 2})`">alto {{ fm(m.alto) }} m</text>
        <!-- Primer carril desde el piso -->
        <template v-if="m.cartelasY.length">
          <line :x1="xb + 18" :x2="xb + 18" :y1="y(0)" :y2="y(m.primerNivel)" stroke="#334155" stroke-width="0.8" marker-start="url(#di-f)" marker-end="url(#di-f)" />
          <text :x="xb + 23" :y="(y(0) + y(m.primerNivel)) / 2" font-weight="600">1.er nivel</text>
          <text :x="xb + 23" :y="(y(0) + y(m.primerNivel)) / 2 + 12">{{ fm(m.primerNivel) }} m</text>
          <!-- Espacio libre sobre la grúa -->
          <template v-if="g && g.puede && altoGrua > 0">
            <line :x1="xc - gw / 2" :x2="xb" :y1="y(altoGrua)" :y2="y(altoGrua)" :stroke="colorHolgura" stroke-width="0.8" stroke-dasharray="3 2" />
            <text :x="xb + 23" :y="(y(0) + y(m.primerNivel)) / 2 + 26" font-size="9" font-weight="700" :fill="colorHolgura">libre {{ Math.round(holgura * 1000) }} mm</text>
          </template>
        </template>
        <!-- Ancho de calle -->
        <line :x1="xa" :x2="xb" :y1="y(0) + 18" :y2="y(0) + 18" stroke="#334155" stroke-width="0.8" marker-start="url(#di-f)" marker-end="url(#di-f)" />
        <text :x="xc" :y="y(0) + 31" text-anchor="middle">calle {{ fm(m.anchoCalle) }} m</text>
      </g>
    </svg>
    <p v-if="g && g.puede" class="mt-1 text-xs" :class="holgura >= HOLGURA - 1e-6 ? 'text-emerald-700' : 'text-red-700'">
      {{ holgura >= HOLGURA - 1e-6 ? 'La grúa pasa bajo el primer nivel sin tocar carriles ni pallets.' : 'La grúa choca con el primer nivel: hay que subirlo.' }}
      {{ g.tipica ? 'Usamos la medida típica de tu grúa; tu ejecutivo la confirma.' : '' }}
    </p>
    <p v-else-if="g" class="mt-1 text-xs text-red-700">Un drive-in necesita grúa horquilla, retráctil o apilador eléctrico: {{ g.motivo }}.</p>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { HOLGURA_GRUA_DI } from '~/lib/rack3d/planificador.js';

const props = defineProps<{ m: Record<string, any> }>();
const HOLGURA = HOLGURA_GRUA_DI;
const W = 336, H = 290, arriba = 12, abajo = 40, xa = 78, xb = 238, pil = 7;
const tope = computed(() => props.m.alto * 1.03);
const y = (v: number) => H - abajo - (v / tope.value) * (H - abajo - arriba);
const xc = (xa + xb) / 2;
const kx = computed(() => (xb - xa) / props.m.anchoCalle);   // px por m
const riel = computed(() => 0.16 * kx.value);
const alto = computed(() => props.m.pallet.alto);
const pw = computed(() => props.m.pallet.frente * kx.value);
const niveles = computed(() => [0, ...props.m.cartelasY].map((b: number, i: number) => ({ base: b, piso: i === 0 })));
const g = computed(() => props.m.grua ?? null);
const techo = computed(() => g.value?.techo || 2.2);
const mastil = computed(() => g.value?.mastil || 0);
const altoGrua = computed(() => Math.max(g.value?.techo || 0, g.value?.mastil || 0));
// Ancho de la grúa en el dibujo: la medida o un ancho típico de la calle
const gw = computed(() => Math.min((g.value?.ancho || props.m.anchoCalle - 0.25) * kx.value, xb - xa - 2 * riel.value - 4));
const holgura = computed(() => +(props.m.primerNivel - altoGrua.value).toFixed(3));
const colorHolgura = computed(() => (holgura.value >= HOLGURA - 1e-6 ? '#059669' : '#dc2626'));
const fm = (v: number) => (+v.toFixed(2)).toLocaleString('es-CL');
const descripcion = computed(() => `Vista frontal de una calle de drive-in: alto ${fm(props.m.alto)} m, primer nivel a ${fm(props.m.primerNivel)} m, calle de ${fm(props.m.anchoCalle)} m`);
</script>
