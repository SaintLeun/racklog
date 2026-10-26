<template>
  <span class="tabular-nums">{{ mostrado.toLocaleString('es-CL') }}</span>
</template>

<script lang="ts" setup>
import { ref, watch, onBeforeUnmount } from 'vue';

// Numero que cuenta hasta el valor nuevo en ~400 ms (sin animar si se pide menos movimiento)
const props = defineProps<{ valor: number }>();
const mostrado = ref(Math.round(props.valor));
let raf = 0;
watch(() => props.valor, (v, antes) => {
  cancelAnimationFrame(raf);
  const quieto = typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (quieto || antes === undefined) { mostrado.value = Math.round(v); return; }
  const t0 = performance.now(), desde = mostrado.value;
  const paso = (t: number) => {
    const k = Math.min(1, (t - t0) / 400), e = 1 - Math.pow(1 - k, 3);
    mostrado.value = Math.round(desde + (v - desde) * e);
    if (k < 1) raf = requestAnimationFrame(paso);
  };
  raf = requestAnimationFrame(paso);
});
onBeforeUnmount(() => cancelAnimationFrame(raf));
</script>
