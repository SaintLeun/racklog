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

    <div v-else-if="estado === 'error'" class="absolute inset-0 flex flex-col items-center justify-center px-6 text-center" role="alert">
      <p class="max-w-xs text-sm text-neutral-600">No se pudo cargar la vista 3D. Revisa tu conexión e inténtalo de nuevo.</p>
      <button type="button" class="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50" @click="iniciar">Reintentar</button>
    </div>

    <template v-else-if="estado === 'listo'">
      <p
        class="pointer-events-none absolute bottom-3 left-1/2 max-w-[calc(100%-1.5rem)] -translate-x-1/2 truncate rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm ring-1 ring-black/5"
      >
        {{ bodega
          ? 'Arrastra un rack para moverlo · arrastra el piso para girar · rueda o clic derecho para acercar y desplazar'
          : 'Arrastra para girar · rueda o pellizca para acercar' }}
      </p>
      <button
        type="button"
        class="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/10 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        title="Volver a la vista inicial (doble clic en un punto para acercarte a él)"
        @click="visor?.centrar()"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M3 7V3h4M17 7V3h-4M3 13v4h4M17 13v4h-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Centrar vista
      </button>
      <button
        v-if="hayOperacion"
        type="button"
        class="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/10 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        :aria-pressed="operando"
        title="La grúa recorre un pasillo que cumple, deja un pallet en un nivel que alcanza y lo vuelve a sacar"
        @click="alternarOperacion"
      >
        <svg v-if="operando" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4h3v12H6zM11 4h3v12h-3z" /></svg>
        <svg v-else class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4l10 6-10 6z" /></svg>
        {{ operando ? 'Pausar grúa' : 'Ver grúa operando' }}
      </button>
      <button
        v-if="hayOperacion"
        type="button"
        class="absolute left-3 top-12 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/10 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        @click="verGrua"
      >Ver la grúa de cerca</button>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

// Un producto ('RS' rack selectivo, 'AR' angulo ranurado o 'DI' drive-in, con la config del configurador)
// o, en el planificador, una bodega con sus racks
const props = defineProps<{
  producto?: 'RS' | 'AR' | 'DI';
  config?: Record<string, unknown>;
  bodega?: { ancho: number; largo: number; forma?: Array<{ x: number; y: number }> | null };
  racks?: Array<Record<string, unknown>>;
  etiqueta?: string;
}>();

// Planificador: los racks se pueden arrastrar en 3D
const emit = defineEmits<{
  seleccionar: [id: string];
  mover: [id: string, x: number, y: number];
}>();

const lienzoRef = ref<HTMLElement | null>(null);
const estado = ref<'cargando' | 'listo' | 'sin-webgl' | 'error'>('cargando');

type Modulos = {
  visor: typeof import('~/lib/rack3d/visor.js');
  construir: typeof import('~/lib/rack3d/construir.js');
  medidas: typeof import('~/lib/rack3d/medidas.js');
  bodega: typeof import('~/lib/rack3d/bodega.js');
};
let mods: Modulos | null = null;
let visor: ReturnType<Modulos['visor']['crearVisor']> | null = null;

let ultimaBodega = '';

// Grua operando (solo planificador, si hay un pasillo que cumple): parte encendida salvo que el
// usuario pida menos movimiento
const hayOperacion = ref(false);
const operando = ref(typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
function alternarOperacion() {
  operando.value = !operando.value;
  visor?.operar(operando.value);
}
function verGrua() {
  if (!operando.value) alternarOperacion();
  visor?.mirarOperacion();
}

function construirModelo() {
  if (!mods || !visor) return;
  const { construir, medidas, bodega } = mods;
  if (props.bodega) {
    // Mover o editar un rack no mueve la camara; cambiar la bodega si la reencuadra
    const clave = JSON.stringify([props.bodega.ancho, props.bodega.largo, props.bodega.forma ?? null]);
    const reencuadrar = clave !== ultimaBodega;
    // Tres cuartos desde la esquina de abajo a la derecha del plano, cerca (la bodega llena el cuadro)
    visor.mostrar(bodega.construirBodega(props.bodega, props.racks ?? []), { reencuadrar, direccion: [0.7, 0.75, 1], margen: 0.78 });
    ultimaBodega = clave;
    hayOperacion.value = visor.operar(operando.value);
    return;
  }
  const c = (props.config ?? {}) as Record<string, any>;
  const grupo = props.producto === 'AR'
    ? construir.construirAnra(medidas.medidasAnra(c))
    : props.producto === 'DI'
      ? construir.construirDriveIn(medidas.medidasDriveIn({ calles: c.cuerpos, fondos: c.fondos, niveles: c.niveles }))
      : construir.construirSelectivo(medidas.medidasSelectivo(c));
  visor.mostrar(grupo);
}

// Si falla la descarga de three.js o el armado de la escena se muestra el error con "Reintentar":
// antes el aviso "Cargando vista 3D…" quedaba girando para siempre
async function iniciar() {
  estado.value = 'cargando';
  try {
    await montar();
  } catch (e) {
    console.error('Vista 3D:', e);
    visor?.destruir();
    visor = null;
    if (lienzoRef.value) estado.value = 'error';
  }
}

async function montar() {
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
  // El logo de las cajas: se espera un momento para que salga en el primer dibujo
  await Promise.race([construir.cargarLogo(), new Promise((ok) => setTimeout(ok, 1500))]);
  if (!lienzoRef.value) return;
  visor = visorMod.crearVisor(lienzoRef.value);
  if (props.bodega) {
    visor.arrastrar({
      alElegir: (id: string) => emit('seleccionar', id),
      async alSoltar(id: string, x: number, z: number) {
        const antes = claveModelo();
        emit('mover', id, x, z);
        await nextTick();
        // Si la posicion no cambio (p. ej. quedo en el borde de la bodega) la escena no se
        // reconstruye sola y el rack quedaria donde se solto
        if (claveModelo() === antes) construirModelo();
      },
    });
  }
  construirModelo();
  // "Listo" cuando ya hay un cuadro dibujado (una bodega llena tarda en el primero)
  await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
  if (visor) estado.value = 'listo';
}

onMounted(iniciar);

const claveModelo = () => JSON.stringify([props.producto, props.config, props.bodega, props.racks]);
// Varios cambios seguidos (p. ej. editar varios campos) se juntan en una sola reconstruccion por cuadro
let reconstruir = 0;
watch(claveModelo, () => {
  if (reconstruir) return;
  reconstruir = requestAnimationFrame(() => {
    reconstruir = 0;
    try {
      construirModelo();
    } catch (e) {
      console.error('Vista 3D:', e);
      estado.value = 'error';
    }
  });
});

// El planificador la usa para poner la vista 3D en el PDF
defineExpose({ captura: () => (visor && estado.value === 'listo' ? visor.captura() : null) });

onBeforeUnmount(() => {
  if (reconstruir) cancelAnimationFrame(reconstruir);
  visor?.destruir();
  visor = null;
});
</script>
