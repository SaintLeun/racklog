<template>
  <!-- Elegir el equipo por foto (prompt de conversión §D): quien no sabe el nombre de su grúa la reconoce.
       Foto real en public/assets/images/equipos/<foto>.webp (agregar su nombre a FOTOS_REALES); sin ella, un dibujo.
       Solo se piden las que existen: nunca un 404 -->
  <div>
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <button
        v-for="o in opciones" :key="o.v" type="button"
        :class="['fl-opcion !gap-1 !p-2', valor === o.v && !noSe && 'fl-opcion--sel']" :aria-pressed="valor === o.v && !noSe"
        @click="emit('elegir', o.v, false)"
      >
        <img v-if="FOTOS_REALES.includes(o.foto) && !sinFoto[o.v]" :src="`/assets/images/equipos/${o.foto}.webp`" alt="" width="240" height="160" loading="lazy" class="aspect-[3/2] w-full rounded-lg bg-white object-contain" @error="sinFoto[o.v] = true">
        <svg v-else viewBox="0 0 120 80" class="aspect-[3/2] w-full rounded-lg bg-neutral-50" aria-hidden="true">
          <g fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 72h108" stroke="#d4d4d4" stroke-width="2" />
            <!-- Horquillas y pallet (todos) -->
            <rect :x="o.dibujo === 'retractil' ? 18 : 10" :y="o.dibujo === 'transpaleta' ? 62 : 50" width="26" height="6" fill="#fdba74" stroke="#c2410c" stroke-width="1.5" />
            <template v-if="o.dibujo === 'transpaleta'">
              <path d="M44 68h30l6-8M80 60l10-34" stroke="#404040" stroke-width="3" /><circle cx="50" cy="70" r="3" fill="#404040" /><circle cx="76" cy="70" r="4" fill="#404040" />
            </template>
            <template v-else-if="o.dibujo === 'manual'">
              <path d="M46 70V14M54 70V14M46 18h8M46 56h-6" stroke="#404040" stroke-width="3" /><path d="M54 66h22l4-20" stroke="#404040" stroke-width="3" /><circle cx="50" cy="70" r="3" fill="#404040" /><circle cx="78" cy="70" r="4" fill="#404040" />
            </template>
            <template v-else-if="o.dibujo === 'apiladora'">
              <path d="M46 70V12M54 70V12" stroke="#404040" stroke-width="3" /><rect x="54" y="40" width="26" height="28" rx="3" fill="#e5e5e5" stroke="#404040" stroke-width="2" /><path d="M80 52l16-8" stroke="#404040" stroke-width="3" /><circle cx="50" cy="70" r="3" fill="#404040" /><circle cx="74" cy="70" r="4" fill="#404040" />
            </template>
            <template v-else-if="o.dibujo === 'contrapeso'">
              <path d="M40 70V10M46 70V10" stroke="#404040" stroke-width="3" /><path d="M48 36h30l8 16v14H48z" fill="#ea580c" stroke="#9a3412" stroke-width="2" /><path d="M54 36V20h22v16" stroke="#404040" stroke-width="2.5" /><rect x="86" y="44" width="12" height="22" rx="2" fill="#525252" /><circle cx="56" cy="68" r="6" fill="#262626" /><circle cx="86" cy="68" r="6" fill="#262626" />
            </template>
            <template v-else>
              <path d="M58 70V8M64 70V8" stroke="#404040" stroke-width="3" /><path d="M66 32h26l6 12v22H66z" fill="#ea580c" stroke="#9a3412" stroke-width="2" /><path d="M72 32V18h20v14" stroke="#404040" stroke-width="2.5" /><path d="M14 70h46" stroke="#404040" stroke-width="3" /><circle cx="22" cy="70" r="3" fill="#404040" /><circle cx="76" cy="68" r="5" fill="#262626" /><circle cx="92" cy="68" r="5" fill="#262626" />
            </template>
          </g>
        </svg>
        <span class="block px-1 text-sm font-semibold leading-tight text-neutral-900">{{ o.t }}</span>
        <span v-if="o.d" class="block px-1 text-xs leading-tight text-neutral-500">{{ o.d }}</span>
      </button>
    </div>
    <button v-if="conNoSe" type="button" :class="['fl-nose mt-2 w-full', noSe && 'fl-nose--sel']" @click="emit('elegir', tipico, true)">
      No lo sé — usen lo más común (grúa horquilla)
    </button>
    <p v-if="noSe" class="mt-1.5 text-sm text-amber-800">{{ ESTIMADO }}. {{ PIERDE }}</p>
    <!-- Las fotos son CC BY-SA: el crédito tiene que verse junto a ellas -->
    <p v-if="opciones.some((o) => FOTOS_REALES.includes(o.foto))" class="mt-1.5 text-[11px] leading-snug text-neutral-400">
      Fotos referenciales de Wikimedia Commons (CC BY-SA):
      <template v-for="(c, i) in creditos" :key="c.foto"><a :href="c.url" target="_blank" rel="noopener" class="underline">{{ c.autor }}</a>{{ i < creditos.length - 1 ? ', ' : '.' }}</template>
    </p>
  </div>
</template>

<script lang="ts" setup>
import { reactive, computed } from 'vue';
import { ESTIMADO, PIERDE } from '~/lib/flujo/conversion.js';

// v: el valor que se emite (equipo del tour o clave de GRUAS); dibujo/foto: qué equipo se muestra
type Opcion = { v: string; t: string; d?: string; dibujo: string; foto: string };
const props = withDefaults(defineProps<{ valor?: string | null; noSe?: boolean; conNoSe?: boolean; tipico?: string; opciones?: Opcion[] }>(), {
  valor: null, noSe: false, conNoSe: true, tipico: 'contrapeso',
  opciones: () => [
    { v: 'contrapeso', t: 'Grúa horquilla', d: 'contrapeso, a gas o eléctrica', dibujo: 'contrapeso', foto: 'contrapeso' },
    { v: 'retractil', t: 'Grúa retráctil', d: 'el mástil avanza; pasillo angosto', dibujo: 'retractil', foto: 'retractil' },
    { v: 'apiladora', t: 'Apilador eléctrico', d: 'se maneja caminando', dibujo: 'apiladora', foto: 'apiladora' },
    { v: 'manual', t: 'Apilador manual', d: 'se levanta bombeando', dibujo: 'manual', foto: 'manual' },
    { v: 'transpaleta', t: 'Transpaleta', d: 'solo mueve a nivel de piso', dibujo: 'transpaleta', foto: 'transpaleta' },
  ],
});
const emit = defineEmits<{ elegir: [valor: string, noSe: boolean] }>();
const sinFoto = reactive<Record<string, boolean>>({});
// Fotos en public/assets/images/equipos/ (Wikimedia Commons, CC BY-SA; autor y página de cada una)
const CREDITOS: Record<string, { autor: string; url: string }> = {
  contrapeso: { autor: 'Dieter Arndt', url: 'https://commons.wikimedia.org/wiki/File:Linde_E20_Elektrostapler_r.jpg' },
  retractil: { autor: 'Jörg Scheffler / Jungheinrich AG', url: 'https://commons.wikimedia.org/wiki/File:ETV214.jpg' },
  apiladora: { autor: 'Drood', url: 'https://commons.wikimedia.org/wiki/File:Semi-elektrischer_Hochhubwagen.JPG' },
  manual: { autor: 'Drood', url: 'https://commons.wikimedia.org/wiki/File:Manueller_Hochhubwagen.JPG' },
  transpaleta: { autor: 'MarkusHagenlocher', url: 'https://commons.wikimedia.org/wiki/File:Hubwagen.jpg' },
};
const FOTOS_REALES: string[] = Object.keys(CREDITOS);
// Un crédito por foto a la vista (el mismo autor una vez)
const creditos = computed(() => {
  const vistos = new Set<string>();
  return props.opciones.filter((o) => CREDITOS[o.foto]).map((o) => ({ foto: o.foto, ...CREDITOS[o.foto] }))
    .filter((c) => !vistos.has(c.autor) && vistos.add(c.autor));
});
</script>
