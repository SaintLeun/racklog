<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="h-auto w-full" role="img" :aria-label="descripcion">
    <title>{{ descripcion }}</title>
    <!-- Rack visto desde arriba (hasta 3 cuerpos o calles): marcos, vigas, pallets y el pasillo de carga -->
    <!-- Pasillos (frente abajo; atras tambien si es doble) -->
    <rect x="0" :y="H - 26" :width="W" height="26" fill="#ecfdf5" />
    <text :x="W / 2" :y="H - 9" text-anchor="middle" class="pl-txt" fill="#047857">↑ pasillo de carga (frente)</text>
    <template v-if="m.doble">
      <rect x="0" y="0" :width="W" height="26" fill="#ecfdf5" />
      <text :x="W / 2" y="17" text-anchor="middle" class="pl-txt" fill="#047857">↓ pasillo (cara de atrás)</text>
    </template>

    <g :transform="`translate(${x0} ${y0})`">
      <template v-if="tipo === 'selectivo'">
        <g v-for="f in filas" :key="`f${f}`" :transform="`translate(0 ${(f - 1) * (m.fondo + sep) * k})`">
          <!-- Vigas delantera y trasera de cada cuerpo -->
          <template v-for="c in n" :key="`c${c}`">
            <rect :x="xc(c) * k" :y="0" :width="(m.viga - 0.1) * k" :height="3" fill="#f97316" />
            <rect :x="xc(c) * k" :y="m.fondo * k - 3" :width="(m.viga - 0.1) * k" :height="3" fill="#f97316" />
            <rect
              v-for="q in m.palletsPorViga" :key="q"
              :x="(xc(c) + hueco * q + palF * (q - 1)) * k" :y="((m.fondo - palD) / 2) * k"
              :width="palF * k" :height="palD * k" fill="#e7c48f" stroke="#8a6a3b" stroke-width="0.8" rx="1.5"
            />
          </template>
          <!-- Marcos: dos pilares unidos -->
          <g v-for="i in n + 1" :key="`m${i}`">
            <rect :x="(i - 1) * paso * k" :y="0" :width="Math.max(3, 0.1 * k)" :height="m.fondo * k" fill="#cbd5e1" />
            <rect :x="(i - 1) * paso * k" :y="0" :width="Math.max(3, 0.1 * k)" :height="Math.max(3, 0.105 * k)" fill="#64748b" />
            <rect :x="(i - 1) * paso * k" :y="(m.fondo - 0.105) * k" :width="Math.max(3, 0.1 * k)" :height="Math.max(3, 0.105 * k)" fill="#64748b" />
          </g>
        </g>
      </template>
      <template v-else-if="tipo === 'drivein'">
        <g v-for="c in n" :key="`c${c}`">
          <rect v-for="j in m.fondos" :key="j" :x="((c - 1) * m.anchoCalle + (m.anchoCalle - palF) / 2 + 0.05) * k" :y="((j - 1) * m.moduloFondo + 0.025) * k" :width="palF * k" :height="(m.moduloFondo - 0.05) * k" fill="#e7c48f" stroke="#8a6a3b" stroke-width="0.8" rx="1.5" />
        </g>
        <rect v-for="i in n + 1" :key="`p${i}`" :x="(i - 1) * m.anchoCalle * k" :y="0" :width="Math.max(3, 0.1 * k)" :height="m.fondos * m.moduloFondo * k" fill="#94a3b8" />
      </template>
      <template v-else>
        <g v-for="f in filas" :key="`f${f}`" :transform="`translate(0 ${(f - 1) * m.fondoExt * k})`">
          <rect v-for="c in n" :key="c" :x="(c - 1) * m.frenteExt * k" :y="0" :width="m.frenteExt * k" :height="m.fondoExt * k" fill="#e2e8f0" stroke="#64748b" stroke-width="1" />
        </g>
      </template>
    </g>

    <!-- Cotas: largo (de un cuerpo) y fondo total -->
    <g class="pl-txt" fill="#334155">
      <text :x="x0 + (tipo === 'selectivo' ? (0.05 + m.viga / 2) : tipo === 'drivein' ? m.anchoCalle / 2 : m.frente / 2) * k" :y="y0 + fondoTotal * k + 14" text-anchor="middle">
        {{ tipo === 'selectivo' ? `viga ${fm(m.viga)} m` : tipo === 'drivein' ? '' : `bandeja ${fm(m.frente)} m` }}
      </text>
      <!-- Drive-in: ancho total del bloque, lo que define si cabe en la bodega -->
      <template v-if="tipo === 'drivein'">
        <line :x1="x0" :x2="x0 + largoDibujo * k" :y1="y0 + fondoTotal * k + 8" :y2="y0 + fondoTotal * k + 8" stroke="#334155" stroke-width="0.8" />
        <text :x="x0 + (largoDibujo * k) / 2" :y="y0 + fondoTotal * k + 21" text-anchor="middle">{{ n }} {{ n === 1 ? 'calle' : 'calles' }} · ancho total {{ fm(largoDibujo) }} m</text>
      </template>
      <text :x="x0 + largoDibujo * k + 10" :y="y0 + (fondoTotal * k) / 2" :transform="`rotate(90 ${x0 + largoDibujo * k + 10} ${y0 + (fondoTotal * k) / 2})`" text-anchor="middle">
        fondo {{ fm(fondoTotal) }} m
      </text>
    </g>
  </svg>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { SEPARACION_DOBLE } from '~/lib/rack3d/medidas.js';

const props = defineProps<{ m: Record<string, any> }>();
const W = 300, H = 230;
const sep = SEPARACION_DOBLE;
const fm = (v: number) => (+(+v).toFixed(2)).toLocaleString('es-CL');
const tipo = computed(() => props.m.tipo as 'selectivo' | 'drivein' | 'anra');
// Se dibujan hasta 3 cuerpos (con eso se entiende el modulo); el drive-in, el bloque entero (todas sus calles)
const n = computed(() => (tipo.value === 'drivein' ? Math.max(1, props.m.calles) : Math.min(3, props.m.cuerpos)));
const filas = computed(() => (props.m.doble ? 2 : 1));
const paso = computed(() => props.m.viga);   // de eje a eje de pilar
const palF = computed(() => (tipo.value === 'anra' ? 0 : Math.min(props.m.pallet.frente, tipo.value === 'drivein' ? props.m.anchoCalle - 0.15 : (props.m.viga - 0.1) / props.m.palletsPorViga - 0.05)));
const palD = computed(() => (tipo.value === 'selectivo' ? Math.min(props.m.pallet.fondo, props.m.fondo + 0.2) : 0));
const hueco = computed(() => (tipo.value === 'selectivo' ? (props.m.viga - 0.1 - props.m.palletsPorViga * palF.value) / (props.m.palletsPorViga + 1) : 0));
const xc = (c: number) => (c - 1) * paso.value + 0.1;
const largoDibujo = computed(() => (tipo.value === 'selectivo' ? n.value * paso.value + 0.1 : tipo.value === 'drivein' ? n.value * props.m.anchoCalle + 0.1 : n.value * props.m.frenteExt));
const fondoTotal = computed(() => (tipo.value === 'selectivo'
  ? props.m.fondo * filas.value + (filas.value === 2 ? sep : 0)
  : tipo.value === 'drivein' ? props.m.fondos * props.m.moduloFondo : props.m.fondoExt * filas.value));
// Escala: que quepa entre los pasillos y con espacio para las cotas
const k = computed(() => Math.min((W - 50) / largoDibujo.value, (H - 26 - (props.m.doble ? 26 : 0) - 36) / fondoTotal.value));
const x0 = computed(() => (W - 30 - largoDibujo.value * k.value) / 2);
const y0 = computed(() => (props.m.doble ? 34 : 12) + ((H - 26 - (props.m.doble ? 34 : 12) - 22) - fondoTotal.value * k.value) / 2);
const descripcion = computed(() => `Vista en planta: fondo ${fm(fondoTotal.value)} m${tipo.value === 'selectivo' ? `, viga ${fm(props.m.viga)} m, ${props.m.palletsPorViga} pallets por nivel` : ''}`);
</script>

<style scoped>
.pl-txt { font-size: 11px; font-family: Inter, system-ui, sans-serif; font-weight: 600; }
</style>
