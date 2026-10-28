<template>
  <!-- Mini-demo de "Dibujarla" (dueño 27-10): cómo se dibuja la bodega, una sola vez y se puede saltar.
       Dura ~5 s y no se repite (animaciones de una pasada, sin bucles) -->
  <div class="absolute inset-0 z-30 flex items-center justify-center bg-white/85 p-4 backdrop-blur-[1px]" role="dialog" aria-label="Cómo dibujar tu bodega">
    <div class="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10">
      <svg viewBox="0 0 240 160" class="demo w-full" aria-hidden="true">
        <defs>
          <pattern id="demo-grilla" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="#e5e7eb" stroke-width=".6" /></pattern>
        </defs>
        <rect width="240" height="160" fill="url(#demo-grilla)" />
        <path class="demo-relleno" d="M40 30H200V130H40Z" fill="#ea580c" fill-opacity=".1" />
        <line v-for="(t, i) in TRAMOS" :key="i" class="demo-tramo" :style="{ animationDelay: `${0.6 + i * 0.9}s` }" :x1="t[0]" :y1="t[1]" :x2="t[2]" :y2="t[3]" stroke="#ea580c" stroke-width="3" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />
        <circle v-for="(q, i) in ESQUINAS" :key="`e${i}`" class="demo-punto" :style="{ animationDelay: `${0.5 + i * 0.9}s` }" :cx="q[0]" :cy="q[1]" r="4.5" fill="#fff" stroke="#ea580c" stroke-width="2.5" />
        <g class="demo-metros"><rect x="98" y="11" width="44" height="15" rx="4" fill="#0f172a" /><text x="120" y="22" text-anchor="middle" font-size="10" font-weight="600" fill="#fff" font-family="Inter, system-ui, sans-serif">16 m ↵</text></g>
        <path class="demo-cursor" d="M0 0v15l4-4 3 7 3-1.5-3-6.5h6z" fill="#0f172a" stroke="#fff" stroke-width="1.2" />
      </svg>
      <p class="mt-3 text-sm text-neutral-800">Toca cada esquina siguiendo los muros. ¿Sabes cuánto mide? Escribe los metros y Enter. Termina tocando el primer punto.</p>
      <div class="mt-3 flex justify-end">
        <button type="button" class="fl-btn !min-h-10 !px-4 !text-sm" @click="emit('fin')">{{ terminado ? 'Empezar a dibujar' : 'Saltar' }}</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const emit = defineEmits<{ fin: [] }>();
const ESQUINAS = [[40, 30], [200, 30], [200, 130], [40, 130]];
const TRAMOS = ESQUINAS.map((q, i) => [...q, ...ESQUINAS[(i + 1) % 4]]);
const terminado = ref(false);
let t: ReturnType<typeof setTimeout> | null = null;
onMounted(() => { t = setTimeout(() => { terminado.value = true; }, 4600); });
onBeforeUnmount(() => { if (t) clearTimeout(t); });
</script>

<style scoped>
/* Una sola pasada (forwards). Con "reducir movimiento" se ve el dibujo terminado */
.demo-tramo { animation: tramo 0.8s ease-out forwards; }
.demo-punto { opacity: 0; animation: aparece 0.2s forwards; }
.demo-relleno { opacity: 0; animation: aparece 0.4s 4.2s forwards; }
.demo-metros { opacity: 0; animation: metros 1.4s 1.2s forwards; }
.demo-cursor { animation: cursor 4.2s ease-in-out forwards; }
@keyframes tramo { to { stroke-dashoffset: 0; } }
@keyframes aparece { to { opacity: 1; } }
@keyframes metros { 0%, 100% { opacity: 0; } 15%, 80% { opacity: 1; } }
@keyframes cursor {
  0% { transform: translate(120px, 150px); }
  12% { transform: translate(40px, 30px); }
  33% { transform: translate(200px, 30px); }
  54% { transform: translate(200px, 130px); }
  75% { transform: translate(40px, 130px); }
  96%, 100% { transform: translate(40px, 30px); }
}
@media (prefers-reduced-motion: reduce) {
  .demo-tramo { animation: none; stroke-dashoffset: 0; }
  .demo-punto, .demo-relleno { animation: none; opacity: 1; }
  .demo-metros { animation: none; }
  .demo-cursor { animation: none; transform: translate(40px, 30px); }
}
</style>
