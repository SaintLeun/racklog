<template>
  <!-- Pallet armado caja por caja en 3D (paso 2). three.js se carga solo al mostrarse -->
  <div class="relative h-full w-full overflow-hidden rounded-xl bg-[#f6f7f9]">
    <div ref="lienzo" class="h-full w-full cursor-grab active:cursor-grabbing" role="img" :aria-label="etiqueta" />
    <div v-if="cargando" class="absolute inset-0 animate-pulse bg-neutral-100" aria-hidden="true" />
    <button
      v-if="!cargando" type="button"
      class="absolute right-2 top-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/10 hover:bg-white"
      @click="armar(true)"
    >↻ Armar de nuevo</button>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
  frente: number; fondo: number;
  caja: { largo: number; ancho: number; alto: number };
  cols: number; filas: number; camas: number; largoEnFrente: boolean;
  etiqueta?: string;
}>();
const lienzo = ref<HTMLElement | null>(null);
const cargando = ref(true);
let visor: any = null, construir: any = null, reloj: ReturnType<typeof setTimeout> | null = null;
const quieto = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function armar(animar: boolean) {
  if (!visor || !construir) return;
  const g = construir.palletArmado({ ...props });
  visor.mostrar(g, { direccion: [1, 0.85, 1.25], margen: 1.25, animar: false });
  if (animar && !quieto()) { g.userData.reiniciar?.(); visor.operar(true); } else { g.userData.completar?.(); visor.operar(false); }
}

onMounted(async () => {
  const [v, c] = await Promise.all([import('~/lib/rack3d/visor.js'), import('~/lib/rack3d/construir.js')]);
  if (!lienzo.value || !v.webglDisponible()) return;
  await Promise.race([c.cargarLogo(), new Promise((ok) => setTimeout(ok, 1200))]);
  if (!lienzo.value) return;
  construir = c;
  visor = v.crearVisor(lienzo.value);
  cargando.value = false;
  armar(true);
});
// Cada cambio se ve al instante (se rearma, sin esperar a que termine la animacion anterior)
watch(() => JSON.stringify(props), () => {
  if (reloj) clearTimeout(reloj);
  reloj = setTimeout(() => armar(true), 180);
});
onBeforeUnmount(() => { if (reloj) clearTimeout(reloj); visor?.destruir(); visor = null; });
</script>
