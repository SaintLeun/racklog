<template>
  <!-- Premio del último paso: el link a su diseño (el PDF lo descarga en Cotiza tras registrarse).
       soloPlano: antes del registro solo queda el plano fuera de pantalla, para adjuntarlo al lead -->
  <section :class="soloPlano ? 'contents' : 'fl-card mt-6'" :aria-labelledby="soloPlano ? undefined : 'entregables-titulo'">
    <template v-if="!soloPlano">
    <p class="fl-leyenda">Llévate tu diseño</p>
    <h2 id="entregables-titulo" class="mt-1 text-lg font-bold text-neutral-900">{{ titulo }}</h2>
    <p class="mt-1 text-neutral-600">Guarda el link o compártelo con tu equipo: abre tu bodega en 3D, en solo lectura y con el botón para cotizar.</p>

    <div class="mt-4 flex flex-col gap-3 sm:flex-row">
      <button type="button" class="fl-btn flex-1" @click="copiarLink">{{ copiado ? 'Link copiado ✓' : 'Copiar link de mi diseño' }}</button>
      <button v-if="puedeCompartir" type="button" class="fl-btn-sec flex-1" @click="compartirLink">Compartir por WhatsApp o correo</button>
    </div>
    <p class="mt-2 text-sm text-neutral-500">Sin tus datos personales. Dura {{ DIAS_LINK }} días.</p>
    <input v-if="linkManual" :value="linkManual" readonly class="form-input mt-2 w-full text-sm" aria-label="Link a tu diseño" @focus="($event.target as HTMLInputElement).select()">
    <p v-if="mensaje" class="mt-3 text-sm" :class="error ? 'text-red-700' : 'text-neutral-600'" role="status">{{ mensaje }}</p>
    </template>

    <!-- Fuera de pantalla: el plano que va adjunto a la cotización (solo para el ejecutivo de Racklog) -->
    <ClientOnly>
      <div class="pointer-events-none fixed top-0" style="left: -12000px; width: 1200px" aria-hidden="true" inert>
        <div ref="planoCaja" style="width: 1000px; height: 800px">
          <PlanificadorPlano2D
            :bodega="p.bodega" :racks="p.racks" :seleccion="null" :conflictos="sinConflictos"
            :pasillos="listaPasillos" :marcas="marcas" cotas-todas
          />
        </div>
      </div>
    </ClientOnly>
  </section>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useProyecto } from '~/stores/proyecto';
import { pasillos } from '~/lib/rack3d/pasillos.js';
import { proponerAccesorios, aplicarAjustes } from '~/lib/rack3d/accesorios.js';
import { cifraPrincipal, imagenSvg, nombreArchivo } from '~/lib/flujo/exportar.js';
import { enlaceParaVer, DIAS_LINK } from '~/lib/flujo/enlace.js';

defineProps<{ soloPlano?: boolean }>();
const p = useProyecto();

const cifra = computed(() => cifraPrincipal(p.racks) as { n: number; unidad: string });
const cifraTexto = computed(() => `${Math.round(cifra.value.n).toLocaleString('es-CL')} ${cifra.value.unidad}`);
const titulo = computed(() => (p.lead.empresa ? `Bodega de ${p.lead.empresa} · ${cifraTexto.value}` : `Tu bodega · ${cifraTexto.value}`));

const sinConflictos = new Set<string>();
const listaPasillos = computed(() => pasillos(p.racks, p.bodega) as any[]);
const marcas = computed(() => (aplicarAjustes(proponerAccesorios({ bodega: p.bodega, racks: p.racks, pallets: p.pallets }), p.accesorios) as any[])
  .filter((a) => a.incluido).flatMap((a) => a.marcas ?? []));

const planoCaja = ref<HTMLElement | null>(null);
const copiado = ref(false);
const linkManual = ref('');
const mensaje = ref('');
const error = ref(false);
const puedeCompartir = ref(false);
function avisar(t: string, mal = false) {
  mensaje.value = t;
  error.value = mal;
}

async function copiarLink() {
  const url = await enlaceParaVer(p.$state) as string;
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
async function compartirLink() {
  const url = await enlaceParaVer(p.$state) as string;
  try {
    await navigator.share({ title: titulo.value, text: `${titulo.value} · diseñada en racklog.cl`, url });
    marcar('link_diseno', { largo: url.length, compartido: true });
  } catch (e: any) {
    if (e?.name !== 'AbortError') copiarLink();
  }
}

// El plano 2D con cotas como PNG (dataURL), para el PDF y el adjunto. Nunca lanza
async function plano(): Promise<string | null> {
  try {
    const svg = planoCaja.value?.querySelector('svg') as SVGSVGElement | null;
    return svg ? await imagenSvg(svg) as string | null : null;
  } catch { return null; }
}
// Adjunto para la cotización (Kommo): el plano 2D en PNG, para el ejecutivo. Nunca lanza
async function archivos(): Promise<File[]> {
  try {
    const img = await plano();
    if (img) return [new File([await (await fetch(img)).blob()], `plano-bodega-${nombreArchivo(p.lead.empresa)}.png`, { type: 'image/png' })];
  } catch { /* sin plano */ }
  return [];
}
defineExpose({ archivos, plano });

function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}

onMounted(() => {
  puedeCompartir.value = typeof navigator.share === 'function';
});
</script>
