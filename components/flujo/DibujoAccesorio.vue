<template>
  <svg viewBox="0 0 160 110" class="h-auto w-full" role="img" :aria-label="`${a.nombre}${a.medida ? ': ' + a.medida : ''}`">
    <defs>
    <!-- Dibujo de cada accesorio con la medida real del rack elegido (cota visible) -->
      <marker :id="`fl-${uid}`" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 6 3 0 6z" fill="#334155" /></marker>
    </defs>
    <g font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">
      <!-- Protección de bastidor: arco de tubo anclado al piso, del ancho de la cabecera (vista de lado) -->
      <template v-if="a.id === 'proteccionBastidor'">
        <rect x="20" y="14" width="7" height="76" fill="#9ca3af" /><rect x="133" y="14" width="7" height="76" fill="#9ca3af" />
        <path d="M16 90V66a8 8 0 0 1 8-8h112a8 8 0 0 1 8 8v24" fill="none" stroke="#ca8a04" stroke-width="7" stroke-linecap="round" />
        <path d="M16 90V66a8 8 0 0 1 8-8h112a8 8 0 0 1 8 8v24" fill="none" stroke="#facc15" stroke-width="4.5" stroke-linecap="round" />
        <rect x="9" y="89" width="14" height="3" fill="#475569" /><rect x="137" y="89" width="14" height="3" fill="#475569" />
        <line x1="4" x2="156" y1="92" y2="92" stroke="#cbd5e1" />
        <line x1="16" x2="144" y1="100" y2="100" stroke="#334155" :marker-start="`url(#fl-${uid})`" :marker-end="`url(#fl-${uid})`" />
        <text x="80" y="109" text-anchor="middle">{{ medidaBastidor }}</text>
        <text x="80" y="9" text-anchor="middle" fill="#64748b" font-weight="500">arco de tubo · vista de lado</text>
      </template>
      <!-- Canillera: pieza delante del pilar (no lo envuelve), un poco más ancha, apernada al piso. Frente y planta -->
      <template v-else-if="a.id === 'canilleras'">
        <rect x="24" y="8" width="16" height="88" fill="#9ca3af" />
        <circle v-for="i in 9" :key="i" cx="32" :cy="12 + i * 8" r="1.2" fill="#6b7280" />
        <rect x="22" :y="96 - altoCan" width="20" :height="altoCan" fill="#dc2626" stroke="#991b1b" />
        <rect x="18" y="93" width="28" height="3" fill="#991b1b" /><circle cx="20.5" cy="94.5" r="1.1" fill="#fff" /><circle cx="43.5" cy="94.5" r="1.1" fill="#fff" />
        <line x1="4" x2="56" y1="96" y2="96" stroke="#cbd5e1" />
        <line x1="62" x2="62" y1="96" :y2="96 - altoCan" stroke="#334155" :marker-start="`url(#fl-${uid})`" :marker-end="`url(#fl-${uid})`" />
        <text x="66" :y="99 - altoCan / 2" font-size="8">{{ mm(a.alto || 0.5) }}</text>
        <!-- Planta: la pieza va delante de la cara del pilar que da al pasillo -->
        <rect x="100" y="34" width="30" height="21" fill="#9ca3af" />
        <line x1="97" x2="133" y1="60" y2="60" stroke="#dc2626" stroke-width="3" stroke-linecap="round" />
        <text x="115" y="47" text-anchor="middle" font-size="7" fill="#fff">pilar</text>
        <text x="115" y="70" text-anchor="middle" font-size="7" fill="#64748b" font-weight="500">pasillo ↓</text>
        <line x1="97" x2="133" y1="80" y2="80" stroke="#334155" :marker-start="`url(#fl-${uid})`" :marker-end="`url(#fl-${uid})`" />
        <text x="115" y="92" text-anchor="middle" font-size="8">{{ mm(a.ancho || 0.12) }}</text>
        <text x="115" y="22" text-anchor="middle" fill="#64748b" font-weight="500" font-size="8">planta</text>
      </template>
      <!-- Baranda: tubo circular de 1 m en módulos de 6 m con placas base; el ajuste en naranjo -->
      <template v-else-if="a.id === 'barandas'">
        <g v-for="i in 3" :key="i" :transform="`translate(${20 + (i - 1) * 36} 0)`" stroke-linecap="round" fill="none">
          <path d="M2 88V42h30v46" stroke="#ca8a04" stroke-width="4.5" /><path d="M2 88V42h30v46" stroke="#facc15" stroke-width="2.8" />
          <path d="M2 65h30" stroke="#ca8a04" stroke-width="3.5" /><path d="M2 65h30" stroke="#facc15" stroke-width="2" />
          <rect x="-3" y="87" width="10" height="2.5" fill="#475569" stroke="none" /><rect x="27" y="87" width="10" height="2.5" fill="#475569" stroke="none" />
        </g>
        <g transform="translate(132 0)" stroke-linecap="round" fill="none">
          <path d="M2 88V42h14v46" stroke="#ea580c" stroke-width="3.5" /><path d="M2 65h14" stroke="#ea580c" stroke-width="2.5" />
          <rect x="-3" y="87" width="10" height="2.5" fill="#475569" stroke="none" /><rect x="11" y="87" width="10" height="2.5" fill="#475569" stroke="none" />
        </g>
        <line x1="4" x2="158" y1="89.5" y2="89.5" stroke="#cbd5e1" />
        <line x1="10" x2="10" y1="88" y2="42" stroke="#334155" :marker-start="`url(#fl-${uid})`" :marker-end="`url(#fl-${uid})`" />
        <text x="6" y="36" font-size="8">{{ mmM(a.alto || 1) }}</text>
        <text x="72" y="104" text-anchor="middle">módulos de 6 m</text><text x="141" y="104" text-anchor="middle" fill="#c2410c" font-size="8">ajuste</text>
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

const props = defineProps<{ a: Record<string, any>; m?: Record<string, any> | null }>();
const uid = useId();
const mm = (v: number) => `${Math.round(v * 1000).toLocaleString('es-CL')} mm`;
// Largo de la proteccion: el que calcula accesorios.js segun el fondo real del marco
const medidaBastidor = computed(() => (props.a.detalle?.length === 1 ? mm(props.a.detalle[0].medida) : props.a.medida));
// Alto de la canillera en el dibujo (pilar de 92 px ≈ 2 m)
const altoCan = computed(() => Math.round((props.a.alto || 0.5) * 44));
const mmM = (v: number) => `${(+v.toFixed(2)).toLocaleString('es-CL')} m`;
</script>
