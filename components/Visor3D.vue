<template>
  <div class="relative h-full w-full overflow-hidden bg-[#f6f7f9]">
    <div
      ref="lienzoRef"
      class="h-full w-full cursor-grab active:cursor-grabbing"
      role="img"
      :aria-label="etiqueta"
    />

    <div v-if="estado === 'cargando'" class="absolute inset-0 flex flex-col items-center justify-center" role="status" aria-live="polite">
      <svg class="h-9 w-9 animate-spin text-brand-600" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p class="mt-3 text-sm font-medium text-neutral-700">Cargando vista 3D…</p>
    </div>

    <div v-else-if="estado === 'sin-webgl'" class="absolute inset-0 flex items-center justify-center px-6 text-center">
      <p class="max-w-xs text-sm text-neutral-600">Tu navegador no puede mostrar la vista 3D. Los detalles del producto están disponibles a continuación.</p>
    </div>

    <p
      v-else-if="estado === 'listo'"
      class="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm ring-1 ring-black/5"
    >
      Arrastra para girar · rueda o pellizca para acercar
    </p>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

// Un producto ('RS' rack selectivo o 'AR' angulo ranurado, con la config del configurador)
// o, en el planificador, una bodega con sus racks
const props = defineProps<{
  producto?: 'RS' | 'AR';
  config?: Record<string, unknown>;
  bodega?: { ancho: number; largo: number; forma?: Array<{ x: number; y: number }> | null };
  racks?: Array<Record<string, unknown>>;
  etiqueta?: string;
}>();

const lienzoRef = ref<HTMLElement | null>(null);
const estado = ref<'cargando' | 'listo' | 'sin-webgl'>('cargando');

type Modulos = {
  visor: typeof import('~/lib/rack3d/visor.js');
  construir: typeof import('~/lib/rack3d/construir.js');
  medidas: typeof import('~/lib/rack3d/medidas.js');
  bodega: typeof import('~/lib/rack3d/bodega.js');
};
let mods: Modulos | null = null;
let visor: ReturnType<Modulos['visor']['crearVisor']> | null = null;

let ultimaBodega = '';

function construirModelo() {
  if (!mods || !visor) return;
  const { construir, medidas, bodega } = mods;
  if (props.bodega) {
    // Mover o editar un rack no mueve la camara; cambiar la bodega si la reencuadra
    const clave = JSON.stringify([props.bodega.ancho, props.bodega.largo, props.bodega.forma ?? null]);
    visor.mostrar(bodega.construirBodega(props.bodega, props.racks ?? []), { reencuadrar: clave !== ultimaBodega, direccion: [0.25, 1.1, 1], margen: 0.95 });
    ultimaBodega = clave;
    return;
  }
  const grupo = props.producto === 'AR'
    ? construir.construirAnra(medidas.medidasAnra(props.config ?? {}))
    : construir.construirSelectivo(medidas.medidasSelectivo(props.config ?? {}));
  visor.mostrar(grupo);
}

onMounted(async () => {
  // three.js se descarga solo cuando hay un visor en pantalla
  const [visorMod, construir, medidas, bodega] = await Promise.all([
    import('~/lib/rack3d/visor.js'),
    import('~/lib/rack3d/construir.js'),
    import('~/lib/rack3d/medidas.js'),
    import('~/lib/rack3d/bodega.js'),
  ]);
  if (!lienzoRef.value) return;
  if (!visorMod.webglDisponible()) {
    estado.value = 'sin-webgl';
    return;
  }
  mods = { visor: visorMod, construir, medidas, bodega };
  visor = visorMod.crearVisor(lienzoRef.value);
  construirModelo();
  estado.value = 'listo';
});

watch(() => JSON.stringify([props.producto, props.config, props.bodega, props.racks]), construirModelo);

onBeforeUnmount(() => {
  visor?.destruir();
  visor = null;
});
</script>
