<template>
  <!-- Premio del paso 7: PDF con su logo, imagen 3D para compartir y link a su diseño -->
  <section class="fl-card mt-6" aria-labelledby="entregables-titulo">
    <p class="fl-leyenda">Llévate tu diseño</p>
    <h2 id="entregables-titulo" class="mt-1 text-lg font-bold text-neutral-900">{{ titulo }}</h2>

    <div v-if="p.registrado" class="mt-4 overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-neutral-200" style="aspect-ratio: 1200 / 630">
      <img v-if="vistaPrevia" :src="vistaPrevia" :alt="`Imagen de la bodega de ${empresa} con ${cifraTexto}`" class="h-full w-full object-cover">
      <div v-else class="flex h-full w-full animate-pulse items-center justify-center text-sm text-neutral-500" role="status">Preparando la imagen de tu bodega…</div>
    </div>

    <!-- Logo del cliente (opcional): solo queda en este navegador mientras dure la visita -->
    <div v-if="p.registrado" class="mt-4 flex flex-wrap items-center gap-3">
      <img v-if="logo" :src="logo" alt="Logo de tu empresa" class="h-11 max-w-[8rem] rounded-md bg-white object-contain p-1 ring-1 ring-neutral-200">
      <label class="fl-btn-sec cursor-pointer !text-sm focus-within:ring-2 focus-within:ring-brand-600">
        {{ logo ? 'Cambiar logo' : 'Agregar el logo de tu empresa' }}
        <input type="file" accept="image/png,image/jpeg" class="sr-only" @change="subirLogo">
      </label>
      <button v-if="logo" type="button" class="fl-quitar" @click="quitarLogo">Quitar</button>
      <span class="text-sm text-neutral-500">Opcional, PNG o JPG. Sale en el PDF y en la imagen.</span>
    </div>

    <div class="mt-5 grid gap-3 sm:grid-cols-3">
      <button type="button" class="fl-btn" :aria-disabled="!p.registrado || undefined" :class="!p.registrado && 'opacity-50'" @click="pdf">
        {{ ocupado === 'pdf' ? 'Armando tu PDF…' : 'Descargar PDF' }}
      </button>
      <div class="flex gap-2">
        <button type="button" class="fl-btn-sec flex-1" :aria-disabled="!p.registrado || undefined" :class="!p.registrado && 'opacity-50'" @click="imagen('descargar')">
          {{ ocupado === 'imagen' ? 'Preparando…' : 'Descargar imagen' }}
        </button>
        <button v-if="puedeCompartir" type="button" class="fl-btn-sec !px-3" :aria-disabled="!p.registrado || undefined" :class="!p.registrado && 'opacity-50'" aria-label="Compartir imagen" @click="imagen('compartir')">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 11v5h12v-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <span class="ml-1.5 hidden lg:inline">Compartir</span>
        </button>
      </div>
      <button type="button" class="fl-btn-sec" @click="copiarLink">{{ copiado ? 'Link copiado ✓' : 'Copiar link' }}</button>
    </div>
    <p class="mt-2 text-sm text-neutral-500">El link abre este mismo diseño (sin tus datos personales) para que lo vea tu equipo.</p>
    <input v-if="linkManual" :value="linkManual" readonly class="form-input mt-2 w-full text-sm" aria-label="Link a tu diseño" @focus="($event.target as HTMLInputElement).select()">

    <div v-if="!p.registrado && avisoRegistro" class="mt-4 rounded-xl bg-amber-50 p-4 text-amber-900 ring-1 ring-amber-200" role="status">
      <p>Para descargar el PDF y la imagen, deja tus datos (es un minuto).</p>
      <button type="button" class="mt-2 font-semibold underline underline-offset-2" @click="emit('registrarse')">Completar mis datos</button>
    </div>
    <p v-if="mensaje" class="mt-3 text-sm" :class="error ? 'text-red-700' : 'text-neutral-600'" role="status">{{ mensaje }}</p>

    <!-- Fuera de pantalla: plano y 3D que se convierten en imagen -->
    <ClientOnly>
      <div class="pointer-events-none fixed top-0" style="left: -12000px; width: 1200px" aria-hidden="true" inert>
        <div ref="planoCaja" style="width: 1000px; height: 800px">
          <PlanificadorPlano2D
            :bodega="p.bodega" :racks="p.racks" :seleccion="null" :conflictos="sinConflictos"
            :pasillos="listaPasillos" :marcas="marcas" cotas-todas
          />
        </div>
        <div v-if="montar3d" style="width: 1200px; height: 630px">
          <Visor3D ref="visorRef" :bodega="p.bodega" :racks="p.racks" etiqueta="Vista 3D para la imagen" />
        </div>
      </div>
    </ClientOnly>
  </section>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useProyecto } from '~/stores/proyecto';
import { pasillos } from '~/lib/rack3d/pasillos.js';
import { proponerAccesorios, aplicarAjustes } from '~/lib/rack3d/accesorios.js';
import { cifraPrincipal, resumenDiseño, imagenSvg, imagenCompartible, descargar, nombreArchivo, logoCliente, guardarLogo, leerLogo } from '~/lib/flujo/exportar.js';
import { enlaceDiseño } from '~/lib/flujo/enlace.js';

const emit = defineEmits<{ registrarse: [] }>();
const p = useProyecto();

const empresa = computed(() => p.lead.empresa || 'tu empresa');
const cifra = computed(() => cifraPrincipal(p.racks) as { n: number; unidad: string });
const cifraTexto = computed(() => `${Math.round(cifra.value.n).toLocaleString('es-CL')} ${cifra.value.unidad}`);
const titulo = computed(() => (p.lead.empresa ? `Bodega de ${p.lead.empresa} · ${cifraTexto.value}` : `Tu bodega · ${cifraTexto.value}`));

const sinConflictos = new Set<string>();
const listaPasillos = computed(() => pasillos(p.racks, p.bodega) as any[]);
const marcas = computed(() => (aplicarAjustes(proponerAccesorios({ bodega: p.bodega, racks: p.racks, pallets: p.pallets }), p.accesorios) as any[])
  .filter((a) => a.incluido).flatMap((a) => a.marcas ?? []));

const planoCaja = ref<HTMLElement | null>(null);
const visorRef = ref<{ captura: () => string | null } | null>(null);
const montar3d = ref(false);
const logo = ref<string | null>(null);
const vistaPrevia = ref<string | null>(null);
const ocupado = ref<'' | 'pdf' | 'imagen'>('');
const copiado = ref(false);
const linkManual = ref('');
const avisoRegistro = ref(false);
const mensaje = ref('');
const error = ref(false);
const puedeCompartir = ref(false);

// ─── La vista 3D se arma una vez (fuera de pantalla), se captura y se desmonta ───
let captura3d: Promise<string | null> | null = null;
function vista3d() {
  captura3d ??= (async () => {
    montar3d.value = true;
    await nextTick();
    let img: string | null = null;
    for (let i = 0; i < 80 && !img; i++) {
      await new Promise((ok) => setTimeout(ok, 150));
      img = visorRef.value?.captura() ?? null;
    }
    // Un cuadro mas: las sombras y el logo de las cajas ya estan
    if (img) { await new Promise((ok) => setTimeout(ok, 300)); img = visorRef.value?.captura() ?? img; }
    montar3d.value = false;
    if (!img) captura3d = null;
    return img;
  })();
  return captura3d;
}
async function plano() {
  const svg = planoCaja.value?.querySelector('svg') as SVGSVGElement | null;
  return svg ? imagenSvg(svg) as Promise<string | null> : null;
}

let blobImagen: Blob | null = null;
async function armarImagen() {
  const blob = await imagenCompartible({ vista3d: await vista3d(), empresa: empresa.value, cifra: cifra.value, logoCliente: logo.value }) as Blob | null;
  blobImagen = blob;
  if (blob) {
    if (vistaPrevia.value) URL.revokeObjectURL(vistaPrevia.value);
    vistaPrevia.value = URL.createObjectURL(blob);
  }
  return blob;
}

function pedirRegistro() {
  avisoRegistro.value = true;
  return false;
}
function avisar(t: string, mal = false) {
  mensaje.value = t;
  error.value = mal;
}

async function pdf() {
  if (!p.registrado) return pedirRegistro();
  if (ocupado.value) return;
  ocupado.value = 'pdf';
  avisar('');
  try {
    const [{ crearPdfDiseno }, imgPlano, img3d] = await Promise.all([import('~/lib/rack3d/pdfPlano.js'), plano(), vista3d()]);
    const datos = resumenDiseño(p) as any;
    const blob = await crearPdfDiseno({ ...datos, logoCliente: logo.value, plano: imgPlano, vista3d: img3d });
    descargar(blob, `diseno-bodega-${nombreArchivo(p.lead.empresa)}.pdf`);
    marcar('pdf_download', { posiciones: cifra.value.n, con_logo: !!logo.value, rol: p.lead.perfil });
    avisar('Listo: tu PDF se descargó.');
  } catch (e) {
    console.error('PDF:', e);
    avisar('No pudimos armar el PDF. Inténtalo de nuevo.', true);
  } finally {
    ocupado.value = '';
  }
}

async function imagen(accion: 'descargar' | 'compartir') {
  if (!p.registrado) return pedirRegistro();
  if (ocupado.value) return;
  ocupado.value = 'imagen';
  avisar('');
  try {
    const blob = blobImagen ?? await armarImagen();
    if (!blob) throw new Error('sin imagen');
    const nombre = `bodega-${nombreArchivo(p.lead.empresa)}-racklog.png`;
    if (accion === 'compartir') {
      const archivo = new File([blob], nombre, { type: 'image/png' });
      try {
        await navigator.share({ files: [archivo], title: titulo.value, text: `${titulo.value} · diseñada en racklog.cl` });
      } catch (e: any) {
        if (e?.name !== 'AbortError') descargar(blob, nombre);
      }
    } else {
      descargar(blob, nombre);
      avisar('Listo: tu imagen se descargó.');
    }
    marcar('compartir_3d', { accion, posiciones: cifra.value.n });
  } catch (e) {
    console.error('Imagen:', e);
    avisar('No pudimos armar la imagen. Inténtalo de nuevo.', true);
  } finally {
    ocupado.value = '';
  }
}

async function copiarLink() {
  const url = await enlaceDiseño(p.$state) as string;
  let ok = false;
  try { await navigator.clipboard.writeText(url); ok = true; } catch { /* sin permiso */ }
  if (!ok) {
    try {
      const t = document.createElement('textarea');
      t.value = url;
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      ok = document.execCommand('copy');
      t.remove();
    } catch { /* nada */ }
  }
  linkManual.value = ok ? '' : url;
  copiado.value = ok;
  if (ok) setTimeout(() => { copiado.value = false; }, 2500);
  avisar(ok ? 'Link copiado. Pégalo en un correo o WhatsApp.' : 'Copia el link de abajo.');
  marcar('link_diseno', { largo: url.length, copiado: ok });
}

async function subirLogo(e: Event) {
  const input = e.target as HTMLInputElement;
  const archivo = input.files?.[0];
  input.value = '';
  if (!archivo) return;
  try {
    logo.value = await leerLogo(archivo) as string;
    guardarLogo(logo.value);
    avisar('Logo agregado.');
    if (p.registrado) armarImagen();
  } catch {
    avisar('Sube una imagen PNG o JPG.', true);
  }
}
function quitarLogo() {
  logo.value = null;
  guardarLogo(null);
  if (p.registrado) armarImagen();
}

// Adjuntos para la cotizacion (Kommo): plano 2D en PNG y el PDF del diseño. Si la vista 3D no esta
// lista en 2,5 s, el PDF sale con el plano en la portada. Nunca lanza: si algo falla, va lo que se pudo
const espera = <T>(ms: number, v: T) => new Promise<T>((ok) => setTimeout(() => ok(v), ms));
async function archivos(): Promise<File[]> {
  const lista: File[] = [];
  const nombre = nombreArchivo(p.lead.empresa);
  let imgPlano: string | null = null;
  try {
    imgPlano = await plano();
    if (imgPlano) lista.push(new File([await (await fetch(imgPlano)).blob()], `plano-bodega-${nombre}.png`, { type: 'image/png' }));
  } catch { /* sin plano */ }
  try {
    const armar = async () => {
      const [{ crearPdfDiseno }, img3d] = await Promise.all([import('~/lib/rack3d/pdfPlano.js'), Promise.race([vista3d(), espera(2500, null)])]);
      return crearPdfDiseno({ ...(resumenDiseño(p) as any), logoCliente: logo.value, plano: imgPlano, vista3d: img3d }) as Promise<Blob>;
    };
    const blob = await Promise.race([armar(), espera<Blob | null>(4500, null)]);
    if (blob) lista.push(new File([blob], `diseno-bodega-${nombre}.pdf`, { type: 'application/pdf' }));
  } catch { /* sin PDF */ }
  return lista;
}
defineExpose({ archivos });

function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}

onMounted(() => {
  logo.value = logoCliente() as string | null;
  try {
    puedeCompartir.value = typeof navigator.share === 'function' && !!navigator.canShare?.({ files: [new File([''], 'x.png', { type: 'image/png' })] });
  } catch { puedeCompartir.value = false; }
  if (p.registrado) armarImagen();
});
watch(() => p.registrado, (r) => { if (r) { avisoRegistro.value = false; if (!vistaPrevia.value) armarImagen(); } });
</script>
