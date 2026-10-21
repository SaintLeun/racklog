<template>
  <!-- Dibujo de cada accesorio con la medida real del rack elegido (cota visible) -->
  <svg viewBox="0 0 160 110" class="h-auto w-full" role="img" :aria-label="`${a.nombre}${a.medida ? ': ' + a.medida : ''}`">
    <defs>
      <pattern :id="`fr-${uid}`" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="10" height="10" fill="#facc15" /><rect width="5" height="10" fill="#111827" />
      </pattern>
      <marker :id="`fl-${uid}`" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 6 3 0 6z" fill="#334155" /></marker>
    </defs>
    <g font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">
      <!-- Proteccion de bastidor: barra a lo largo del fondo de la cabecera -->
      <template v-if="a.id === 'proteccionBastidor'">
        <rect x="18" y="30" width="8" height="58" fill="#9ca3af" /><rect x="134" y="30" width="8" height="58" fill="#9ca3af" />
        <rect x="14" y="70" width="132" height="12" :fill="`url(#fr-${uid})`" rx="2" />
        <line x1="14" x2="146" y1="96" y2="96" stroke="#334155" :marker-start="`url(#fl-${uid})`" :marker-end="`url(#fl-${uid})`" />
        <text x="80" y="108" text-anchor="middle">{{ medidaBastidor }}</text>
        <text x="80" y="22" text-anchor="middle" fill="#64748b" font-weight="500">cabecera (vista de lado)</text>
      </template>
      <!-- Canillera: protector al pie del pilar -->
      <template v-else-if="a.id === 'canilleras'">
        <rect x="70" y="8" width="16" height="92" fill="#9ca3af" />
        <path d="M62 100V62h32v38z" fill="#facc15" stroke="#a16207" />
        <line x1="104" x2="104" y1="100" y2="62" stroke="#334155" :marker-start="`url(#fl-${uid})`" :marker-end="`url(#fl-${uid})`" />
        <text x="110" y="85">400 mm</text>
      </template>
      <!-- Baranda: modulos de 6 m y ajuste -->
      <template v-else-if="a.id === 'barandas'">
        <g v-for="i in 3" :key="i" :transform="`translate(${8 + (i - 1) * 42} 0)`">
          <rect x="0" y="40" width="40" height="5" fill="#eab308" /><rect x="0" y="62" width="40" height="4" fill="#eab308" />
          <rect x="0" y="40" width="4" height="50" fill="#ca8a04" /><rect x="36" y="40" width="4" height="50" fill="#ca8a04" />
        </g>
        <g transform="translate(134 0)"><rect x="0" y="40" width="18" height="5" fill="#ea580c" /><rect x="0" y="62" width="18" height="4" fill="#ea580c" /><rect x="14" y="40" width="4" height="50" fill="#c2410c" /></g>
        <text x="70" y="104" text-anchor="middle">módulos de 6 m</text><text x="143" y="104" text-anchor="middle" fill="#c2410c">ajuste</text>
      </template>
      <!-- Separador de fila: entre dos marcos espalda con espalda -->
      <template v-else-if="a.id === 'separadores'">
        <rect x="30" y="10" width="6" height="90" fill="#9ca3af" /><rect x="124" y="10" width="6" height="90" fill="#9ca3af" />
        <rect x="36" y="40" width="88" height="5" fill="#64748b" /><rect x="36" y="72" width="88" height="5" fill="#64748b" />
        <line x1="36" x2="124" y1="26" y2="26" stroke="#334155" :marker-start="`url(#fl-${uid})`" :marker-end="`url(#fl-${uid})`" />
        <text x="80" y="20" text-anchor="middle">{{ Math.round(RACK.separadorFila.valor * 1000) }} mm</text>
      </template>
      <!-- Plano de carga sobre el par de vigas -->
      <template v-else-if="a.id === 'planosCarga'">
        <path d="M20 60l40-24h90l-40 24z" fill="#cbd5e1" stroke="#64748b" />
        <path v-for="i in 6" :key="i" :d="`M${20 + i * 13} 60l40-24`" stroke="#94a3b8" />
        <rect x="18" y="60" width="92" height="6" fill="#f97316" />
        <text x="64" y="84" text-anchor="middle">{{ m ? `viga ${mm(m.viga)}` : 'sobre las vigas' }}</text>
      </template>
      <!-- Topes de apoyo -->
      <template v-else-if="a.id === 'topes'">
        <rect x="14" y="40" width="132" height="6" fill="#f97316" /><rect x="14" y="80" width="132" height="6" fill="#f97316" />
        <rect x="50" y="46" width="6" height="34" fill="#64748b" /><rect x="104" y="46" width="6" height="34" fill="#64748b" />
        <text x="80" y="104" text-anchor="middle">2 por posición</text>
      </template>
      <!-- Placa de capacidad -->
      <template v-else-if="a.id === 'placaCapacidad'">
        <rect x="30" y="18" width="100" height="70" rx="6" fill="#fff" stroke="#334155" stroke-width="2" />
        <text x="80" y="42" text-anchor="middle" font-size="11">CARGA MÁX.</text>
        <text x="80" y="62" text-anchor="middle" font-size="15" fill="#c2410c">{{ capacidad }}</text>
        <text x="80" y="78" text-anchor="middle" font-weight="500">por nivel</text>
      </template>
      <!-- Malla anticaida en la espalda -->
      <template v-else>
        <rect x="24" y="10" width="112" height="86" fill="none" stroke="#9ca3af" stroke-width="5" />
        <path v-for="i in 9" :key="`v${i}`" :d="`M${24 + i * 11.2} 10v86`" stroke="#cbd5e1" />
        <path v-for="i in 7" :key="`h${i}`" :d="`M24 ${10 + i * 10.75}h112`" stroke="#cbd5e1" />
        <text x="80" y="108" text-anchor="middle">{{ m ? `alto ${mm(m.alto)}` : 'espalda del rack' }}</text>
      </template>
    </g>
  </svg>
</template>

<script lang="ts" setup>
import { computed, useId } from 'vue';
import { RACK, CAPACIDADES } from '~/lib/rack3d/parametrosTecnicos.js';

const props = defineProps<{ a: Record<string, any>; m?: Record<string, any> | null }>();
const uid = useId();
const mm = (v: number) => `${Math.round(v * 1000).toLocaleString('es-CL')} mm`;
// Largo de la proteccion: el que calcula accesorios.js segun el fondo real del marco
const medidaBastidor = computed(() => (props.a.detalle?.length === 1 ? mm(props.a.detalle[0].medida) : props.a.medida));
const capacidad = computed(() => `${CAPACIDADES.selectivoParVigas.valor.toLocaleString('es-CL')} kg`);
</script>
