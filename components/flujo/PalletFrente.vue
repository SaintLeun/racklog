<template>
  <!-- Pallet visto de frente, como se ve desde el pasillo: tarima de madera y bulto de carga con sus cotas.
       Cambia en vivo con el frente, el alto y el peso que escribe el cliente -->
  <svg :viewBox="`0 0 ${W} ${H}`" class="h-auto w-full" role="img" :aria-label="etiqueta">
    <!-- Piso -->
    <line :x1="12" :x2="W - 12" :y1="piso" :y2="piso" stroke="#a3a3a3" stroke-width="1.5" />
    <!-- Carga (lo que va sobre la tarima) -->
    <rect :x="cx - anchoCarga / 2" :y="topeCarga" :width="anchoCarga" :height="altoCarga" rx="3" :fill="color" fill-opacity="0.16" :stroke="color" stroke-width="1.5" />
    <line v-for="k in franjas" :key="k" :x1="cx - anchoCarga / 2 + 6" :x2="cx + anchoCarga / 2 - 6" :y1="topeCarga + (altoCarga * k) / (franjas.length + 1)" :y2="topeCarga + (altoCarga * k) / (franjas.length + 1)" :stroke="color" stroke-opacity="0.25" stroke-width="1" />
    <g font-family="Inter, system-ui, sans-serif" text-anchor="middle">
      <text :x="cx" :y="topeCarga + altoCarga / 2 + 2" font-size="17" font-weight="700" fill="#171717">{{ pesoTxt }}</text>
      <text :x="cx" :y="topeCarga + altoCarga / 2 + 19" font-size="11" fill="#525252">{{ sinPallet ? 'el bulto' : 'pallet cargado' }}</text>
    </g>
    <!-- Tarima de madera de frente: tabla de arriba, tres tacos con las entradas de la horquilla y tabla de abajo -->
    <g v-if="!sinPallet">
      <rect :x="cx - anchoPallet / 2" :y="piso - altoTarima" :width="anchoPallet" :height="tabla" fill="#d9b27c" stroke="#8a6a3b" stroke-width="1" />
      <rect v-for="x in tacos" :key="x" :x="x" :y="piso - altoTarima + tabla" :width="anchoTaco" :height="altoTarima - 2 * tabla" fill="#c99a5e" stroke="#8a6a3b" stroke-width="1" />
      <rect :x="cx - anchoPallet / 2" :y="piso - tabla" :width="anchoPallet" :height="tabla" fill="#d9b27c" stroke="#8a6a3b" stroke-width="1" />
    </g>
    <g font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="600" fill="#334155">
      <!-- Cota del frente (abajo) -->
      <line :x1="cx - anchoPallet / 2" :x2="cx + anchoPallet / 2" :y1="piso + 16" :y2="piso + 16" stroke="#334155" stroke-width="1" />
      <line v-for="x in [cx - anchoPallet / 2, cx + anchoPallet / 2]" :key="`f${x}`" :x1="x" :x2="x" :y1="piso + 10" :y2="piso + 22" stroke="#334155" stroke-width="1" />
      <text :x="cx" :y="piso + 34" text-anchor="middle">frente {{ fm(frente) }} m</text>
      <!-- Cota del alto con carga (a la derecha, del piso a lo más alto) -->
      <line :x1="xCota" :x2="xCota" :y1="topeCarga" :y2="piso" stroke="#334155" stroke-width="1" />
      <line v-for="y in [topeCarga, piso]" :key="`a${y}`" :x1="xCota - 6" :x2="xCota + 6" :y1="y" :y2="y" stroke="#334155" stroke-width="1" />
      <text :x="xCota + 10" :y="(topeCarga + piso) / 2 - 4">{{ fm(alto) }} m</text>
      <text :x="xCota + 10" :y="(topeCarga + piso) / 2 + 11" font-size="11" font-weight="400" fill="#525252">de alto</text>
      <text :x="xCota + 10" :y="(topeCarga + piso) / 2 + 24" font-size="11" font-weight="400" fill="#525252">con carga</text>
    </g>
  </svg>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  frente: number; alto: number; peso: number; color?: string;
  sinPallet?: boolean; sobresale?: number; pesoEstimado?: boolean; nombre?: string;
}>(), { color: '#f97316', sinPallet: false, sobresale: 0, pesoEstimado: false, nombre: 'pallet' });

const W = 320, H = 270, ALTO_TARIMA = 0.15;
const fm = (v: number) => (+(+v || 0).toFixed(2)).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
// Lo que se dibuja se acota a medidas posibles (el error del campo lo explica el formulario)
const fr = computed(() => Math.min(1.8, Math.max(0.4, props.frente || 0)));
const al = computed(() => Math.min(2.5, Math.max(0.3, props.alto || 0)));
const so = computed(() => Math.min(0.15, Math.max(0, props.sobresale || 0)));
// Escala: el pallet entra en 190 × 200 px, dejando lugar a las cotas
const k = computed(() => Math.min(190 / (fr.value + 2 * so.value), 200 / al.value));
const piso = H - 44;
const anchoPallet = computed(() => fr.value * k.value);
const anchoCarga = computed(() => (fr.value + 2 * so.value) * k.value);
// Centro del pallet: el conjunto (pallet y cota del alto, ~84 px) queda al medio del dibujo
const cx = computed(() => (W - Math.max(anchoPallet.value, anchoCarga.value) - 84) / 2 + Math.max(anchoPallet.value, anchoCarga.value) / 2);
const altoTarima = computed(() => (props.sinPallet ? 0 : Math.min(ALTO_TARIMA, al.value * 0.4) * k.value));
const topeCarga = computed(() => piso - al.value * k.value);
const altoCarga = computed(() => Math.max(4, al.value * k.value - altoTarima.value));
const tabla = computed(() => Math.max(3, altoTarima.value * 0.22));
const anchoTaco = computed(() => Math.max(8, anchoPallet.value * 0.12));
const tacos = computed(() => {
  const x0 = cx.value - anchoPallet.value / 2, x1 = cx.value + anchoPallet.value / 2 - anchoTaco.value;
  return [x0, (x0 + x1) / 2, x1];
});
// Franjas suaves de la carga: una cada ~30 cm (se lee como bulto, no como caja por caja)
const franjas = computed(() => Array.from({ length: Math.max(0, Math.min(6, Math.round(al.value / 0.3) - 1)) }, (_, i) => i + 1));
const xCota = computed(() => cx.value + Math.max(anchoPallet.value, anchoCarga.value) / 2 + 14);
const pesoTxt = computed(() => (props.peso > 0 ? `${props.pesoEstimado ? '~' : ''}${Math.round(props.peso).toLocaleString('es-CL')} kg` : '¿kg?'));
const etiqueta = computed(() => `${props.nombre} visto de frente: ${fm(props.frente)} m de frente, ${fm(props.alto)} m de alto con carga y ${pesoTxt.value}`);
</script>
