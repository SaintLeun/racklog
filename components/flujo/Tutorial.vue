<template>
  <!-- Tutorial de una herramienta al posicionarse sobre ella (dueño 27-10: solo en dibujar, pilares y bodega).
       Solo con mouse: en el celular no hay "posicionarse" y el texto de la herramienta basta. Va debajo de la
       herramienta, fuera del flujo (no empuja nada) y se va al salir. Sin animaciones en bucle -->
  <div class="relative" @pointerenter="entrar" @pointerleave="salir" @pointerdown="salir">
    <slot />
    <div v-if="abierto" role="tooltip" :class="['pointer-events-none absolute top-full z-40 mt-2 w-64 rounded-xl bg-neutral-900 p-3 text-sm leading-snug text-white shadow-xl', derecha ? 'right-0' : 'left-0']">
      <FlujoGuia lugar="globo" />
      <p class="font-semibold">{{ titulo }}</p>
      <ol class="mt-1.5 space-y-1 text-neutral-200">
        <li v-for="(t, i) in pasos" :key="i" class="flex gap-1.5"><b class="text-brand-300">{{ i + 1 }}.</b><span>{{ t }}</span></li>
      </ol>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount } from 'vue';

defineProps<{ titulo: string; pasos: string[]; derecha?: boolean }>();
const abierto = ref(false);
let t: ReturnType<typeof setTimeout> | null = null;
// Un momento antes de abrir: pasar el mouse de camino a otra cosa no lo muestra
function entrar(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return;
  if (t) clearTimeout(t);
  t = setTimeout(() => { abierto.value = true; }, 350);
}
function salir() {
  if (t) clearTimeout(t);
  t = null;
  abierto.value = false;
}
onBeforeUnmount(salir);
</script>
