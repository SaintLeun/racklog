<template>
  <div class="relative h-full w-full overflow-hidden bg-[#f6f7f9]">
    <div
      ref="lienzoRef"
      :class="['h-full w-full cursor-grab transition-opacity duration-500 active:cursor-grabbing', estado === 'listo' ? 'opacity-100' : 'opacity-0']"
      role="img"
      :aria-label="etiqueta"
    />

    <!-- Mientras llega three.js y se dibuja el primer cuadro: silueta de racks con brillo (nunca un recuadro vacio) -->
    <Transition name="v3d-fade">
      <div v-if="estado === 'cargando'" class="v3d-esqueleto absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden px-4" role="status" aria-live="polite">
        <svg class="v3d-silueta h-auto w-[min(78%,420px)] max-h-[60%]" viewBox="0 0 320 170" fill="none" aria-hidden="true">
          <!-- piso en perspectiva -->
          <path d="M20 150 L160 112 L300 150 L160 168 Z" fill="#e5e7eb" />
          <!-- tres racks: pilares, vigas y pallets -->
          <g v-for="(x, i) in [52, 128, 204]" :key="i" :transform="`translate(${x} ${14 + i * 4})`">
            <rect x="0" y="0" width="5" height="118" rx="1.5" fill="#cbd5e1" />
            <rect x="60" y="0" width="5" height="118" rx="1.5" fill="#cbd5e1" />
            <rect v-for="y in [30, 62, 94]" :key="y" x="0" :y="y" width="65" height="5" rx="1.5" fill="#d6dbe2" />
            <rect v-for="y in [8, 40, 72]" :key="`p${y}`" x="9" :y="y" width="22" height="20" rx="2" fill="#e8dcc6" />
            <rect v-for="y in [8, 40, 72]" :key="`q${y}`" x="35" :y="y" width="22" height="20" rx="2" fill="#e8dcc6" />
          </g>
        </svg>
        <p class="text-sm font-medium text-neutral-600">{{ bodega ? 'Armando tu bodega en 3D…' : 'Armando tu rack en 3D…' }}</p>
      </div>
    </Transition>

    <div v-if="estado === 'sin-webgl'" class="absolute inset-0 flex items-center justify-center px-6 text-center">
      <p class="max-w-xs text-sm text-neutral-600">Tu navegador no puede mostrar la vista 3D. Los detalles del producto están disponibles a continuación.</p>
    </div>

    <div v-else-if="estado === 'error'" class="absolute inset-0 flex flex-col items-center justify-center px-6 text-center" role="alert">
      <p class="max-w-xs text-sm text-neutral-600">No se pudo cargar la vista 3D. Revisa tu conexión e inténtalo de nuevo.</p>
      <button type="button" class="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50" @click="iniciar">Reintentar</button>
    </div>

    <template v-else-if="estado === 'listo' && !adelanto">
      <p
        v-if="!paleta"
        class="pointer-events-none absolute bottom-3 left-1/2 max-w-[calc(100%-1.5rem)] -translate-x-1/2 truncate rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm ring-1 ring-black/5"
      >
        {{ bodega
          ? 'Arrastra un rack para moverlo · arrastra el piso para girar · rueda o clic derecho para acercar y desplazar'
          : 'Arrastra para girar · rueda o pellizca para acercar' }}
      </p>
      <!-- Paleta de accesorios: se arrastran al 3D y se pegan al lugar valido mas cercano -->
      <div v-if="paleta" class="absolute inset-x-2 bottom-2 flex flex-col items-start gap-1.5">
        <p class="pointer-events-none max-w-full truncate rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm ring-1 ring-black/5">
          {{ arrastre ? textoArrastre : 'Arrastra un accesorio a tu rack · toca uno tuyo para quitarlo' }}
        </p>
        <div class="flex max-w-full gap-1.5 overflow-x-auto rounded-xl bg-white/90 p-1.5 shadow-sm ring-1 ring-black/10" role="toolbar" aria-label="Accesorios para arrastrar">
          <button
            v-for="t in PALETA"
            :key="t.id"
            type="button"
            class="v3d-ficha flex flex-shrink-0 cursor-grab select-none items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50 active:cursor-grabbing"
            :class="arrastre?.tipo === t.id && 'bg-brand-50 ring-brand-300'"
            :title="`Arrastra ${t.articulo} al 3D`"
            :data-accesorio="t.id"
            @pointerdown="iniciarArrastre(t.id, $event)"
            @mouseenter="emit('resaltar', t.id)"
            @mouseleave="emit('resaltar', null)"
          >
            <span class="h-3.5 w-3.5 flex-shrink-0 rounded-sm" :style="{ background: t.color }" aria-hidden="true" />
            {{ t.nombre }}
          </button>
        </div>
      </div>
      <!-- Un accesorio puesto a mano, elegido con un toque: se puede quitar -->
      <div
        v-if="elegido"
        class="absolute z-10 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm shadow-lg ring-1 ring-black/10"
        :style="{ left: `${elegido.px}px`, top: `${elegido.py}px`, transform: 'translate(-50%, calc(-100% - 10px))' }"
        role="dialog"
        aria-label="Accesorio puesto por ti"
      >
        <span class="whitespace-nowrap text-neutral-700">{{ elegido.nombre }} puesta por ti</span>
        <button type="button" class="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700" @click="quitarElegido">Quitar</button>
        <button type="button" class="px-1 text-neutral-500 hover:text-neutral-800" aria-label="Cerrar" @click="elegido = null">✕</button>
      </div>
      <button
        type="button"
        class="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/10 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        title="Volver a la vista inicial (doble clic en un punto para acercarte a él)"
        @click="vistaActiva = ''; visor?.centrar()"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M3 7V3h4M17 7V3h-4M3 13v4h4M17 13v4h-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Centrar vista
      </button>
      <button
        v-if="hayOperacion && !soloAccesorios"
        type="button"
        class="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/10 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        :aria-pressed="operando"
        title="Cada grúa va del andén a su pasillo, deja un pallet en un nivel que alcanza y en la vuelta siguiente lo saca, sin cruzarse con las otras ni con las personas"
        @click="alternarOperacion"
      >
        <svg v-if="operando" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4h3v12H6zM11 4h3v12h-3z" /></svg>
        <svg v-else class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4l10 6-10 6z" /></svg>
        {{ operando ? (gruas > 1 ? `Pausar ${gruas} grúas` : 'Pausar grúa') : (gruas > 1 ? `Ver ${gruas} grúas operando` : 'Ver grúa operando') }}
      </button>
      <button
        v-if="hayOperacion && !soloAccesorios"
        type="button"
        class="absolute left-3 top-12 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/10 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        @click="verGrua"
      >Ver la grúa de cerca</button>
      <div v-if="bodega && !soloAccesorios" class="absolute right-3 top-12 flex max-w-[60%] flex-col items-end gap-1.5">
        <div class="inline-flex overflow-hidden rounded-lg bg-white/90 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/10" role="group" aria-label="Vistas de la cámara">
          <button
            v-for="v in VISTAS"
            :key="v.id"
            type="button"
            class="px-2.5 py-1.5 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
            :class="vistaActiva === v.id ? 'bg-brand-50 text-brand-700' : ''"
            :aria-pressed="vistaActiva === v.id"
            :title="v.titulo"
            @click="verVista(v.id)"
          >{{ v.nombre }}</button>
        </div>
        <div class="flex gap-1.5">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/10 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-60"
            :disabled="grabando"
            title="Vuelo de la planta a la altura de un operador, pasando por la grúa (unos 12 s)"
            @click="recorrer"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 15c3-8 11-8 14-2" stroke-linecap="round" /><path d="M14 10l3 3-4 1" stroke-linecap="round" stroke-linejoin="round" /></svg>
            Recorrido
          </button>
          <button
            v-if="puedeGrabar"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/10 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-60"
            :disabled="grabando"
            :aria-busy="grabando"
            title="Graba el recorrido y lo descarga como video"
            @click="grabar"
          >
            <span class="h-2.5 w-2.5 rounded-full" :class="grabando ? 'animate-pulse bg-red-600' : 'bg-red-500'" aria-hidden="true" />
            {{ grabando ? 'Grabando…' : 'Grabar video' }}
          </button>
        </div>
      </div>
    </template>

    <!-- Lo que se arrastra (sigue al dedo o al mouse; verde si encaja, rojo si no) -->
    <Teleport to="body">
      <div
        v-if="arrastre"
        class="pointer-events-none fixed z-[100] flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-white shadow-lg"
        :class="arrastre.ok ? 'bg-green-600' : arrastre.sobre ? 'bg-red-600' : 'bg-neutral-700'"
        :style="{ left: `${arrastre.cx}px`, top: `${arrastre.cy}px`, transform: 'translate(-50%, calc(-100% - 14px))' }"
      >
        {{ nombreTipo(arrastre.tipo) }}{{ arrastre.ok ? ' · suelta aquí' : '' }}
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue';
import { proponerAccesorios, aplicarAjustes, encajarAccesorio, manualCerca, lugaresAccesorio } from '~/lib/rack3d/accesorios.js';

// Un producto ('RS' rack selectivo, 'AR' angulo ranurado o 'DI' drive-in, con la config del configurador)
// o, en el planificador, una bodega con sus racks
const props = defineProps<{
  producto?: 'RS' | 'AR' | 'DI';
  config?: Record<string, unknown>;
  bodega?: { ancho: number; largo: number; forma?: Array<{ x: number; y: number }> | null };
  racks?: Array<Record<string, unknown>>;
  etiqueta?: string;
  // Paso 4: lo que el cliente quito o cambio de los accesorios propuestos (sin esto se ven todos)
  accesorios?: { quitados?: string[]; cantidades?: Record<string, number>; medidas?: Record<string, number>; manuales?: any[] };
  pallets?: Array<Record<string, unknown>>;
  // Adelanto antes del registro: solo la vista, sin botones ni ayudas
  adelanto?: boolean;
  // Encuadre a lo diseñado (planta, m): la camara mira los racks y no la bodega vacia
  foco?: { x0: number; y0: number; x1: number; y1: number; alto?: number } | null;
  // Paso 4 (y donde se quiera): paleta de accesorios para arrastrar al 3D; los racks no se mueven ni opera la grua
  paleta?: boolean;
  // Accesorio a resaltar en el 3D ('canilleras', 'proteccionBastidor', 'barandas'…) o null
  resaltado?: string | null;
}>();

// Planificador: los racks se pueden arrastrar en 3D
const emit = defineEmits<{
  seleccionar: [id: string];
  mover: [id: string, x: number, y: number];
  // Paleta: accesorio puesto a mano (listo para accesorios.manuales) y quitar uno por su id
  accesorio: [manual: Record<string, any>];
  quitarAccesorio: [id: string];
  resaltar: [tipo: string | null];
}>();

// Paso 4 (paleta sin @mover): solo accesorios. Paso 5 (paleta con @mover): racks movibles, grua y vistas, mas la paleta
const conMover = !!getCurrentInstance()?.vnode.props?.onMover;
const soloAccesorios = computed(() => !!props.paleta && !conMover);
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
  vistaActiva.value = '';
  visor?.mirarOperacion();
}
const gruas = ref(0);

// Camaras: planta, isometrica, altura de operador; recorrido automatico y video
const VISTAS = [
  { id: 'planta', nombre: 'Planta', titulo: 'Vista desde arriba, como el plano' },
  { id: 'isometrica', nombre: 'Isométrica', titulo: 'Vista en diagonal desde arriba' },
  { id: 'operador', nombre: 'Operador', titulo: 'A 1,6 m del piso, dentro de un pasillo' },
] as const;
const vistaActiva = ref('');
const grabando = ref(false);
const puedeGrabar = ref(false);
function verVista(id: string) {
  vistaActiva.value = id;
  visor?.vista(id);
}
async function recorrer() {
  if (!visor) return;
  if (!operando.value) alternarOperacion();
  vistaActiva.value = '';
  await visor.recorrido();
  vistaActiva.value = 'operador';
}
async function grabar() {
  if (!visor || grabando.value) return;
  if (!operando.value) alternarOperacion();
  grabando.value = true;
  vistaActiva.value = '';
  try {
    const r = await visor.grabarRecorrido();
    if (!r || !r.blob.size) return;
    const url = URL.createObjectURL(r.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recorrido-bodega-racklog.${r.extension}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: 'video_3d', event_category: 'Planificador', formato: r.extension });
  } catch (e) {
    console.warn('Video 3D:', e);
  } finally {
    grabando.value = false;
    vistaActiva.value = 'operador';
  }
}

function construirModelo() {
  if (!mods || !visor) return;
  const { construir, medidas, bodega } = mods;
  if (props.bodega) {
    // Mover o editar un rack no mueve la camara; cambiar la bodega si la reencuadra
    const clave = JSON.stringify([props.bodega.ancho, props.bodega.largo, props.bodega.forma ?? null, props.foco ?? null]);
    const reencuadrar = clave !== ultimaBodega;
    // Tres cuartos desde la esquina de abajo a la derecha del plano, cerca (la bodega llena el cuadro)
    const opciones = { accesorios: props.accesorios, pallets: props.pallets };
    visor.mostrar(bodega.construirBodega(props.bodega, props.racks ?? [], opciones), { reencuadrar, direccion: [0.7, 0.75, 1], margen: props.foco ? 0.95 : 0.78, foco: props.foco ?? null });
    ultimaBodega = clave;
    hayOperacion.value = visor.operar(operando.value && !soloAccesorios.value);
    gruas.value = visor.gruasOperando;
    puedeGrabar.value = visor.puedeGrabar;
    pintarResaltado();
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
  // Se arma despues de que la pagina se pinta (el esqueleto se ve y el paso responde de inmediato)
  await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
  await new Promise((ok) => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(ok, { timeout: 700 }) : setTimeout(ok, 120)));
  if (!lienzoRef.value) return;
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
  // El adelanto no tiene botones arriba; abajo lo tapa el aviso del registro. La paleta ocupa abajo
  if (props.adelanto) visor.reservar(12, 56);
  else if (props.paleta) visor.reservar(soloAccesorios.value ? 52 : 115, 96);
  if (props.bodega && !soloAccesorios.value) {
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
  // "Listo" (se quita el esqueleto con un fundido) cuando ya hay un cuadro dibujado; a lo mas 5 s
  const primero = new Promise((ok) => { visor!.primerCuadro(ok); setTimeout(ok, 5000); });
  construirModelo();
  await primero;
  if (visor) estado.value = 'listo';
}

onMounted(iniciar);

const claveModelo = () => JSON.stringify([props.producto, props.config, props.bodega, props.racks, props.accesorios ?? null, props.pallets ?? null, props.foco ?? null]);
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
defineExpose({
  captura: () => (visor && estado.value === 'listo' ? visor.captura() : null),
  // Las tarjetas de accesorios (paso 4) inician el arrastre desde fuera del 3D
  iniciarArrastre: (tipo: string, e: PointerEvent) => iniciarArrastre(tipo, e),
});

// ─── Accesorios: resaltar, arrastrar desde la paleta y quitar los puestos a mano ───
const PALETA = [
  { id: 'canilleras', nombre: 'Canillera', articulo: 'una canillera', color: '#c81e1e' },
  { id: 'proteccionBastidor', nombre: 'Protección de bastidor', articulo: 'una protección de bastidor', color: '#f5c518' },
  { id: 'barandas', nombre: 'Baranda', articulo: 'un tramo de baranda', color: '#f59e0b' },
] as const;
const nombreTipo = (id: string) => PALETA.find((t) => t.id === id)?.nombre ?? id;
const datosAcc = () => ({ bodega: props.bodega as any, racks: (props.racks ?? []) as any[], pallets: (props.pallets ?? []) as any[] });
const listaAcc = computed(() => {
  if (!props.bodega) return [] as any[];
  try { return aplicarAjustes(proponerAccesorios(datosAcc()), props.accesorios ?? {}) as any[]; } catch { return [] as any[]; }
});
function pintarResaltado() {
  if (!visor) return;
  const a = props.resaltado ? listaAcc.value.find((x) => x.id === props.resaltado) : null;
  visor.resaltar(a && a.incluido !== false ? a.marcas.map((k: any) => ({ ...k, alto: a.alto })) : null);
}
watch(() => [props.resaltado, listaAcc.value], () => pintarResaltado());

type Arrastre = { tipo: string; puntero: number; cx: number; cy: number; ok: boolean; sobre: boolean; motivo: string | null; manual: any };
const arrastre = ref<Arrastre | null>(null);
const textoArrastre = computed(() => {
  const a = arrastre.value;
  if (!a) return '';
  if (a.ok) return 'Suelta para ponerla ahí';
  if (a.motivo === 'ocupado') return 'Ese lugar ya tiene una: prueba en otro';
  if (a.sobre) return a.tipo === 'canilleras' ? 'Llévala al pie de un pilar' : a.tipo === 'barandas' ? 'Llévala frente a una cabecera o a un pasillo peatonal' : 'Llévala a la cabecera de una fila';
  return 'Arrástrala sobre el 3D';
});
let cuadroArrastre = 0;
function evaluarArrastre() {
  cuadroArrastre = 0;
  const a = arrastre.value;
  if (!a || !visor || !props.bodega) return;
  const p = visor.pisoEn(a.cx, a.cy);
  a.sobre = !!p;
  if (!p) { a.ok = false; a.motivo = null; a.manual = null; visor.fantasma(null); return; }
  const r = mejorEncaje(a.tipo, p);
  a.ok = r.ok;
  a.motivo = r.motivo ?? null;
  a.manual = r.ok ? r.manual : null;
  visor.fantasma(r.marca ? { ...r.marca, alto: a.tipo === 'canilleras' ? 0.6 : undefined } : null, r.ok);
}
// Lo que toca el rayo (pilar, rack) o, si ahi no encaja, donde corta el piso
function mejorEncaje(tipo: string, p: { x: number; y: number; piso?: { x: number; y: number } | null }) {
  const r = encajarAccesorio(tipo, p, datosAcc(), props.accesorios ?? {});
  if (r.ok || !p.piso) return r;
  const r2 = encajarAccesorio(tipo, p.piso, datosAcc(), props.accesorios ?? {});
  return r2.ok || (r2.marca && !r.marca) ? r2 : r;
}
function alMoverArrastre(e: PointerEvent) {
  const a = arrastre.value;
  if (!a || e.pointerId !== a.puntero) return;
  e.preventDefault();
  a.cx = e.clientX;
  a.cy = e.clientY;
  if (!cuadroArrastre) cuadroArrastre = requestAnimationFrame(evaluarArrastre);
}
function terminarArrastre(e: PointerEvent) {
  const a = arrastre.value;
  if (!a || e.pointerId !== a.puntero) return;
  if (cuadroArrastre) { cancelAnimationFrame(cuadroArrastre); cuadroArrastre = 0; }
  if (e.type === 'pointerup') { a.cx = e.clientX; a.cy = e.clientY; evaluarArrastre(); }
  if (e.type === 'pointerup' && a.ok && a.manual) {
    emit('accesorio', { id: `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, ...a.manual });
  }
  arrastre.value = null;
  visor?.fantasma(null);
  window.removeEventListener('pointermove', alMoverArrastre);
  window.removeEventListener('pointerup', terminarArrastre);
  window.removeEventListener('pointercancel', terminarArrastre);
}
function iniciarArrastre(tipo: string, e: PointerEvent) {
  if (!visor || !props.bodega || (e.pointerType === 'mouse' && e.button !== 0)) return;
  e.preventDefault();
  elegido.value = null;
  try { (e.currentTarget as Element | null)?.releasePointerCapture?.(e.pointerId); } catch { /* sin captura */ }
  arrastre.value = { tipo, puntero: e.pointerId, cx: e.clientX, cy: e.clientY, ok: false, sobre: false, motivo: null, manual: null };
  window.addEventListener('pointermove', alMoverArrastre, { passive: false });
  window.addEventListener('pointerup', terminarArrastre);
  window.addEventListener('pointercancel', terminarArrastre);
}

// Toque corto sobre el 3D (sin girar): si cae sobre un accesorio puesto a mano, se ofrece quitarlo
const elegido = ref<{ id: string; nombre: string; px: number; py: number } | null>(null);
let toque: { x: number; y: number; t: number; id: number } | null = null;
function alTocarInicio(e: PointerEvent) {
  toque = props.paleta ? { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId } : null;
}
function alTocarFin(e: PointerEvent) {
  const t = toque;
  toque = null;
  if (!t || !visor || e.pointerId !== t.id || arrastre.value) return;
  if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > 8 || performance.now() - t.t > 600) return;
  const p = visor.pisoEn(e.clientX, e.clientY);
  const manuales = props.accesorios?.manuales ?? [], racks = (props.racks ?? []) as any[];
  const c = p ? (manualCerca(p, manuales, racks, 0.7) ?? (p.piso ? manualCerca(p.piso, manuales, racks, 0.7) : null)) : null;
  if (!c) { elegido.value = null; visor.fantasma(null); return; }
  const caja = lienzoRef.value!.getBoundingClientRect();
  elegido.value = { id: c.manual.id, nombre: nombreTipo(c.manual.tipo), px: e.clientX - caja.left, py: e.clientY - caja.top };
  visor.fantasma({ ...c.marca, alto: c.manual.tipo === 'canilleras' ? 0.6 : undefined }, false);
}
function quitarElegido() {
  if (!elegido.value) return;
  emit('quitarAccesorio', elegido.value.id);
  elegido.value = null;
  visor?.fantasma(null);
}
onMounted(() => {
  // Solo en desarrollo: las pruebas de navegador buscan donde soltar (lugares validos y si encajan)
  if (import.meta.dev && props.paleta) {
    (window as any).__v3dAccesorios = {
      lugares: (tipo: string) => lugaresAccesorio(tipo, datosAcc()).map((c: any) => c.marca),
      encajar: (tipo: string, x: number, y: number) => encajarAccesorio(tipo, { x, y }, datosAcc(), props.accesorios ?? {}),
      manuales: () => props.accesorios?.manuales ?? [],
      enPantalla: (tipo: string, cx: number, cy: number) => { const p = visor?.pisoEn(cx, cy); return p ? mejorEncaje(tipo, p).ok : false; },
      foco: () => props.foco ?? null,
    };
  }
  lienzoRef.value?.addEventListener('pointerdown', alTocarInicio);
  lienzoRef.value?.addEventListener('pointerup', alTocarFin);
});

onBeforeUnmount(() => {
  if (reconstruir) cancelAnimationFrame(reconstruir);
  if (cuadroArrastre) cancelAnimationFrame(cuadroArrastre);
  window.removeEventListener('pointermove', alMoverArrastre);
  window.removeEventListener('pointerup', terminarArrastre);
  window.removeEventListener('pointercancel', terminarArrastre);
  visor?.destruir();
  visor = null;
});
</script>

<style scoped>
/* Esqueleto de carga: brillo que recorre la silueta */
.v3d-esqueleto { background: #f6f7f9; }
.v3d-silueta { -webkit-mask-image: linear-gradient(100deg, #000 30%, rgba(0, 0, 0, 0.55) 50%, #000 70%); mask-image: linear-gradient(100deg, #000 30%, rgba(0, 0, 0, 0.55) 50%, #000 70%); -webkit-mask-size: 300% 100%; mask-size: 300% 100%; animation: v3d-brillo 1.6s ease-in-out infinite; }
@keyframes v3d-brillo { from { -webkit-mask-position: 100% 0; mask-position: 100% 0; } to { -webkit-mask-position: 0 0; mask-position: 0 0; } }
@media (prefers-reduced-motion: reduce) { .v3d-silueta { animation: none; } }
.v3d-fade-leave-active { transition: opacity 0.45s ease; }
.v3d-fade-leave-to { opacity: 0; }
.v3d-ficha { touch-action: none; }
</style>
