<template>
  <div class="card p-5">
    <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-600">Te asesoramos</h2>
    <p class="mt-2 text-sm text-neutral-600">Guías cortas para medir y elegir, como lo haría un ejecutivo de Racklog.</p>

    <div class="mt-4 divide-y divide-neutral-100 rounded-xl ring-1 ring-neutral-200">
      <!-- ¿Que sistema me conviene? -->
      <details class="group" :open="abierto === 'sistema'" @toggle="alAbrir($event, 'sistema')">
        <summary class="plan-guia">¿Qué sistema me conviene?</summary>
        <div class="space-y-3 px-4 pb-4 text-sm">
          <fieldset v-for="p in PREGUNTAS" :key="p.clave">
            <legend class="font-medium text-neutral-800">{{ p.texto }}</legend>
            <div class="mt-1.5 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
              <button
                v-for="op in p.opciones" :key="op.v"
                type="button" :aria-pressed="respuestas[p.clave] === op.v"
                :class="['min-h-9 rounded-lg px-2 text-xs font-semibold transition', respuestas[p.clave] === op.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600 hover:text-neutral-900']"
                @click="respuestas[p.clave] = op.v"
              >{{ op.t }}</button>
            </div>
          </fieldset>
          <div v-if="recomendado" class="rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100" role="status">
            <p class="font-semibold text-neutral-900">Te recomendamos: {{ TIPOS[recomendado].nombre }}</p>
            <p class="mt-1 text-neutral-600">{{ TIPOS[recomendado].asesoria.sirve }}</p>
            <button type="button" class="btn btn-primary btn-sm mt-3 w-full" @click="emit('agregar', recomendado)">Agregar {{ TIPOS[recomendado].nombre.toLowerCase() }}</button>
          </div>
        </div>
      </details>

      <details :open="abierto === 'pallet'" @toggle="alAbrir($event, 'pallet')">
        <summary class="plan-guia">Cómo medir tu pallet</summary>
        <div class="px-4 pb-4 text-sm text-neutral-600">
          <svg viewBox="0 0 220 120" class="mx-auto mb-3 w-48" role="img" aria-label="Pallet con las medidas de frente, fondo, alto y peso">
            <path d="M40 80 L130 80 L180 60 L90 60 Z" fill="#e7c9a0" stroke="#92400e" stroke-width="1.5" />
            <path d="M40 80 L40 88 L130 88 L130 80 M130 88 L180 68 L180 60" fill="none" stroke="#92400e" stroke-width="1.5" />
            <path d="M50 78 L50 30 L135 30 L135 78 M135 30 L172 15 L172 60 M50 30 L87 15 L172 15" fill="#f5e6cc" stroke="#a16207" stroke-width="1.5" />
            <g stroke="#ea580c" stroke-width="1.5" fill="none" marker-end="url(#pf)" marker-start="url(#pf)">
              <line x1="42" y1="100" x2="128" y2="100" /><line x1="140" y1="96" x2="182" y2="78" /><line x1="28" y1="86" x2="28" y2="32" />
            </g>
            <defs><marker id="pf" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L6 3 L0 6 Z" fill="#ea580c" /></marker></defs>
            <g font-size="10" font-family="Inter, Arial, sans-serif" fill="#7c2d12" font-weight="600">
              <text x="70" y="114">frente</text><text x="166" y="98">fondo</text><text x="2" y="62">alto</text><text x="150" y="40">kg</text>
            </g>
          </svg>
          <ul class="list-disc space-y-1 pl-5">
            <li>Largo y ancho de la base. Los más usados en Chile son 1,2 × 1,0 m y 1,2 × 0,8 m.</li>
            <li>Alto total con la carga, desde el piso. Si la carga sobresale del pallet, mide lo que sobresale.</li>
            <li>Peso del pallet cargado: el más pesado, no el promedio.</li>
          </ul>
        </div>
      </details>

      <details :open="abierto === 'bodega'" @toggle="alAbrir($event, 'bodega')">
        <summary class="plan-guia">Cómo medir tu bodega</summary>
        <ul class="list-disc space-y-1 px-4 pb-4 pl-9 text-sm text-neutral-600">
          <li>Largo y ancho interior, de muro a muro.</li>
          <li>Altura libre hasta el punto más bajo del techo: viga, cercha, luminaria o rociador.</li>
          <li>Dónde están los pilares, portones y andenes.</li>
          <li>El tipo de piso, si lo sabes (radier, asfalto, baldosa).</li>
        </ul>
      </details>

      <details :open="abierto === 'grua'" @toggle="alAbrir($event, 'grua')">
        <summary class="plan-guia">Qué grúa usas</summary>
        <div class="px-4 pb-4 text-sm text-neutral-600">
          <p>La grúa define el ancho de pasillo y hasta qué altura puedes guardar.</p>
          <ul class="mt-2 space-y-1.5">
            <li v-for="g in GRUAS" :key="g.n" class="flex justify-between gap-3">
              <span class="font-medium text-neutral-800">{{ g.n }}</span>
              <span class="text-right">{{ g.pasillo }}</span>
            </li>
          </ul>
          <p class="mt-2 text-xs text-neutral-500">Valores referenciales: los confirma Racklog en la revisión de tu diseño.</p>
        </div>
      </details>
    </div>

    <a
      :href="`https://wa.me/56932403819?text=${encodeURIComponent('Hola, estoy usando el planificador de bodega de racklog.cl y quiero que un ejecutivo me asesore.')}`"
      target="_blank" rel="noopener"
      class="mt-4 flex items-center gap-3 rounded-xl bg-green-50 p-3 text-sm ring-1 ring-green-200 transition hover:ring-green-400"
      @click="emit('whatsapp')"
    >
      <svg class="h-6 w-6 flex-shrink-0 text-green-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 000-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.1 5.1 0 001.1 2.7 11.7 11.7 0 004.5 4c1.7.7 2.3.8 3.2.6a2.6 2.6 0 001.7-1.2 2.1 2.1 0 00.1-1.2c0-.1-.2-.2-.5-.3z" /></svg>
      <span><span class="block font-semibold text-neutral-900">¿Prefieres que lo haga un experto?</span>Un ejecutivo de Racklog te asesora gratis por WhatsApp.</span>
    </a>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import { TIPOS } from '~/lib/rack3d/planificador.js';

type Tipo = keyof typeof TIPOS;
const emit = defineEmits<{ agregar: [tipo: Tipo]; whatsapp: []; guia: [nombre: string] }>();

// Una guia abierta a la vez
const abierto = ref<string | null>(null);
function alAbrir(e: Event, nombre: string) {
  if ((e.target as HTMLDetailsElement).open) {
    abierto.value = nombre;
    emit('guia', nombre);
  } else if (abierto.value === nombre) abierto.value = null;
}

const PREGUNTAS = [
  { clave: 'carga', texto: '¿Tus productos van en pallet o en cajas?', opciones: [{ v: 'pallet', t: 'En pallet' }, { v: 'cajas', t: 'En cajas o sueltos' }] },
  { clave: 'skus', texto: '¿Cuántos productos distintos tienes?', opciones: [{ v: 'muchos', t: 'Muchos' }, { v: 'pocos', t: 'Pocos, con mucho stock' }] },
  { clave: 'acceso', texto: '¿Necesitas sacar cualquier pallet en cualquier momento?', opciones: [{ v: 'si', t: 'Sí' }, { v: 'no', t: 'No, trabajo por lotes' }] },
] as const;
const respuestas = reactive<Record<string, string>>({});

// Cajas → angulo ranurado; pallet con pocos productos y por lotes → drive-in; si no, selectivo
const recomendado = computed<Tipo | null>(() => {
  if (respuestas.carga === 'cajas') return 'AR';
  if (respuestas.carga !== 'pallet' || !respuestas.skus) return null;
  if (respuestas.skus === 'muchos') return 'RS';
  if (!respuestas.acceso) return null;
  return respuestas.acceso === 'no' ? 'DI' : 'RS';
});

const GRUAS = [
  { n: 'Transpaleta', pasillo: 'Solo nivel de piso' },
  { n: 'Apiladora', pasillo: 'Según modelo: consúltanos' },
  { n: 'Grúa horquilla contrapeso', pasillo: 'Pasillo de ~3,5 m' },
  { n: 'Grúa retráctil', pasillo: 'Pasillo de ~2,8 m' },
];
</script>

<style scoped>
.plan-guia {
  display: flex;
  min-height: 2.75rem;
  cursor: pointer;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #262626;
  list-style: none;
}
.plan-guia::-webkit-details-marker {
  display: none;
}
.plan-guia::after {
  content: '+';
  font-size: 1.125rem;
  color: #a3a3a3;
}
details[open] > .plan-guia::after {
  content: '−';
}
</style>
