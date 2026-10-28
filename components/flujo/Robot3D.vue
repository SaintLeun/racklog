<template>
  <!-- RACKLOG en 3D (lib/guia3d/robot.js). Sin WebGL, o mientras se baja Three.js, se ve la imagen de la pose -->
  <span class="relative block">
    <canvas v-show="listo" ref="lienzo" class="block h-full w-full" aria-hidden="true" />
    <img v-if="!listo" :src="imagenPose(pose)" alt="" class="absolute inset-0 h-full w-full object-contain" :class="caminar && !fallo && 'invisible'">
  </span>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { imagenPose } from '~/lib/flujo/asistente.js';
import type { Robot } from '~/lib/guia3d/robot.js';

// caminar: al montar llega caminando desde el fondo y avisa con "llego"; hablando: mueve la boca
const props = defineProps<{ pose: string; caminar?: boolean; hablando?: boolean }>();
const emit = defineEmits<{ llego: [] }>();
const lienzo = ref<HTMLCanvasElement | null>(null);
const listo = ref(false), fallo = ref(false);
let robot: Robot | null = null, vivo = true;

onMounted(async () => {
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    const { crearRobot } = await import('~/lib/guia3d/robot.js');
    if (!vivo || !lienzo.value) return;
    robot = crearRobot(lienzo.value, { pose: props.pose });
    listo.value = true;
    if (props.caminar && !quieto) await robot.caminar();
    await robot.pose(props.pose);
  } catch {
    fallo.value = true;
  }
  if (vivo && props.caminar) emit('llego');
});
watch(() => props.pose, (v) => { robot?.pose(v); });
watch(() => props.hablando, (v) => { robot?.hablar(!!v); });
onBeforeUnmount(() => { vivo = false; robot?.destruir(); robot = null; });
</script>
