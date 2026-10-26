<template>
  <div class="fl min-h-screen bg-neutral-50 pb-32">
    <p v-if="p.prueba" class="bg-amber-400 px-4 py-1.5 text-center text-sm font-semibold text-amber-950" role="status">Modo prueba: el lead llega a Kommo con la etiqueta PRUEBA, sin vendedor ni tarea de 24 h.</p>
    <div class="sticky top-16 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div class="container-page py-3">
        <ClientOnly>
          <FlujoStepper v-if="!compartido" :indice="p.indice" :alcanzado="p.alcanzado" @ir="ir" />
          <!-- Continuar donde quede: el link a su diseño llega por correo -->
          <div v-if="!compartido" class="mt-2 flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
            <!-- Precisión de la cotización siempre a la vista: sube con cada dato real (prompt de conversión §H) -->
            <FlujoPrecision v-if="p.alcanzado > 0 && !guardar.abierto" compacto class="mr-auto" :estados="estados" />
            <button v-if="!guardar.abierto && p.alcanzado > 0" type="button" class="text-sm font-medium text-neutral-500 underline underline-offset-2" @click="empezarDeNuevo">Empezar de nuevo</button>
            <button v-if="!guardar.abierto" type="button" class="text-sm font-medium text-brand-700 underline underline-offset-2" @click="guardar.abierto = true">Guardar y seguir después</button>
            <form v-else class="flex w-full flex-wrap items-center justify-end gap-2" @submit.prevent="enviarLink">
              <label class="sr-only" for="fl-correo-guardar">Tu correo</label>
              <input id="fl-correo-guardar" v-model.trim="guardar.correo" type="email" required placeholder="tu@empresa.cl" class="form-input !h-10 w-56 max-w-full">
              <button type="submit" class="fl-btn !min-h-10 !px-4 !text-sm" :disabled="guardar.estado === 'enviando'">{{ guardar.estado === 'enviando' ? 'Enviando…' : 'Envíame el link' }}</button>
              <button type="button" class="text-sm font-medium text-brand-700 underline underline-offset-2" @click="copiarLink">{{ guardar.copiado ? 'Link copiado ✓' : 'Copiar el link' }}</button>
              <span v-if="guardar.estado === 'ok'" class="text-sm text-green-700" role="status">Listo, revisa tu correo.</span>
              <!-- Si el correo falla, el diseño no se pierde: el link queda copiado y se puede mandar por WhatsApp -->
              <span v-else-if="guardar.estado === 'error'" class="w-full text-right text-sm text-neutral-700" role="status">
                No pudimos enviar el correo{{ guardar.copiado ? ', pero te copiamos el link' : '' }}: guárdalo o
                <a :href="`https://wa.me/?text=${encodeURIComponent('Mi diseño de bodega en Racklog: ' + guardar.link)}`" target="_blank" rel="noopener" class="font-semibold text-green-700 underline" @click="marcar('guardar_diseno', { ok: false, via: 'whatsapp' })">envíatelo por WhatsApp</a>.
              </span>
            </form>
          </div>
          <!-- Mientras carga: la misma forma del stepper (nunca una franja en blanco) -->
          <template #fallback>
            <div class="fl-esq-cascada" aria-hidden="true">
              <div class="flex justify-between"><div class="fl-esq h-4 w-40" /><div class="fl-esq h-3 w-28" /></div>
              <div class="fl-esq mt-2.5 h-1.5 w-full" />
              <div class="mt-3 hidden grid-cols-7 gap-3 md:grid"><div v-for="i in 7" :key="i" class="fl-esq mx-auto h-3 w-24" /></div>
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>

    <main :class="['container-page pt-5', ANCHO[p.paso]]">
      <ClientOnly>
        <!-- En el celular la vía exprés es la de por defecto: el diseño completo se sigue mejor en el computador -->
        <div v-if="movil && !compartido && p.paso === 'operacion' && !p.alcanzado && !avisoMovilCerrado" class="fl-card mb-5 bg-brand-50/60 !outline-brand-200">
          <p class="font-semibold text-neutral-900">En el celular es más rápido que lo diseñemos nosotros</p>
          <p class="mt-1 text-sm text-neutral-700">{{ MENSAJE_INICIO }}</p>
          <div class="mt-3 grid gap-2 sm:grid-cols-2">
            <NuxtLink to="/planifica-tu-bodega/expres" class="fl-btn" @click="marcar('cta_click', { ubicacion: 'disena_movil', via: 'expres' })">Lo diseñan ustedes (2 min)</NuxtLink>
            <button v-if="!guardar.abierto" type="button" class="fl-btn-sec" @click="guardar.abierto = true; marcar('cta_click', { ubicacion: 'disena_movil', via: 'link_computador' })">Envíame el link para seguir en el computador</button>
          </div>
          <button type="button" class="mt-2 text-sm font-medium text-neutral-500 underline underline-offset-2" @click="avisoMovilCerrado = true">Seguir aquí en el celular</button>
        </div>
        <Transition name="fl-paso" mode="out-in">
          <!-- Link compartido: solo lectura, con "Cotizar este diseño" (no pisa el diseño de quien lo abre) -->
          <FlujoCompartido v-if="compartido" key="compartido" :datos="compartido" @cotizar="cotizarCompartido" @propio="dejarCompartido" />
          <!-- A/B 'registro': con la variante "inicio" el registro va antes de la primera pregunta -->
          <FlujoRegistro v-else-if="registroAlInicio && p.paso === 'operacion' && !p.registrado" key="registro" @listo="registroAlInicio = false" />
          <component :is="COMPONENTES[p.paso]" v-else :key="p.paso" class="fl-cascada" v-bind="p.paso === 'dibujo' ? { modo: 'dibujo' } : {}" @siguiente="siguiente" @atras="atras" />
        </Transition>
        <!-- Mientras carga: esqueleto con la forma de un paso (título, bajada, dibujo y tarjetas) que aparece
             en cascada; así nunca se ve una pantalla en blanco -->
        <template #fallback>
          <div class="fl-esq-cascada" role="status" aria-label="Cargando tu diseño">
            <div class="fl-esq h-8 w-2/3 max-w-md" />
            <div class="fl-esq mt-3 h-4 w-full max-w-xl" />
            <div class="mt-6 grid gap-4 lg:grid-cols-[1fr_minmax(280px,38%)]">
              <div class="fl-esq-tarjeta">
                <svg viewBox="0 0 320 150" class="h-36 w-full" aria-hidden="true">
                  <g fill="none" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round">
                    <path d="M40 140V20M150 140V20M260 140V20" />
                    <path d="M40 104H260M40 66H260M40 28H260" stroke="#fed7aa" />
                  </g>
                  <g fill="#f5f5f5"><rect x="52" y="74" width="40" height="28" rx="3" /><rect x="100" y="74" width="40" height="28" rx="3" /><rect x="162" y="36" width="40" height="28" rx="3" /><rect x="52" y="112" width="40" height="26" rx="3" /><rect x="210" y="112" width="40" height="26" rx="3" /></g>
                </svg>
                <p class="mt-2 text-center text-sm text-neutral-400">Preparando tu diseño…</p>
              </div>
              <div class="space-y-3">
                <div class="fl-esq h-20" /><div class="fl-esq h-20" /><div class="fl-esq h-12 w-1/2" />
              </div>
            </div>
          </div>
        </template>
      </ClientOnly>
    </main>

    <ClientOnly>
      <!-- Ayuda si se queda pegado en un paso -->
      <Transition name="fl-sub">
        <!-- Una píldora chica en la esquina: no tapa tarjetas ni botones -->
        <div v-if="ayuda" class="fixed bottom-3 right-3 z-40 flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-sm shadow-lg ring-1 ring-black/10" role="status">
          <span class="text-neutral-700">¿Dudas con este paso?</span>
          <a :href="`https://wa.me/56932403819?text=${encodeURIComponent('Hola, estoy diseñando mi bodega en la web y tengo una duda en el paso: ' + PASOS[p.indice].t)}`" target="_blank" rel="noopener" class="rounded-full bg-green-600 px-3 py-1.5 font-semibold text-white hover:bg-green-700" @click="marcar('whatsapp_click', { ubicacion: 'ayuda', paso: p.paso })">WhatsApp</a>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100" aria-label="Cerrar ayuda" @click="ayuda = false; ayudaVista = true">×</button>
        </div>
      </Transition>
      <!-- Dentro del flujo no hay barra flotante de cotizar: solo el botón del paso y el "Cotizar" de arriba -->
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { diseñoDesdeUrl, aplicarDiseño, limpiarUrl, enlaceDiseño } from '~/lib/flujo/enlace.js';
import { leerVariante } from '~/composables/useVariante';
import { MENSAJE_INICIO, estadosDiseño, pideRegistroAntes } from '~/lib/flujo/conversion.js';
import { racksAlDia, cantidadesAlDia } from '~/lib/flujo/calculos.js';
import { useProyecto, PASOS, type Paso } from '~/stores/proyecto';
import {
  FlujoPasoOperacion, FlujoPasoPallets, FlujoPasoRack, FlujoPasoAccesorios, FlujoPasoBodega, FlujoPasoRevisa, FlujoPasoCotiza,
} from '#components';


definePageMeta({ layout: 'landing' });
usePageSeo({
  title: 'Diseña tu bodega paso a paso',
  description: 'Define tus pallets, arma tu rack, ubícalo en tu bodega y recibe tu cotización en máximo 24 horas.',
});
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const p = useProyecto();
const COMPONENTES: Record<Paso, unknown> = {
  operacion: FlujoPasoOperacion, dibujo: FlujoPasoBodega, pallets: FlujoPasoPallets, rack: FlujoPasoRack, accesorios: FlujoPasoAccesorios,
  bodega: FlujoPasoBodega, revisa: FlujoPasoRevisa, cotiza: FlujoPasoCotiza,
};
// Los pasos con plano o 3D usan todo el ancho
const ANCHO: Record<Paso, string> = {
  operacion: 'max-w-2xl', dibujo: 'max-w-[1560px]', pallets: 'max-w-6xl', rack: 'max-w-6xl', accesorios: 'max-w-3xl', bodega: 'max-w-[1560px]', revisa: 'max-w-6xl', cotiza: 'max-w-3xl',
};

function ir(paso: Paso) {
  p.ir(paso);
  marcar('tour_step', { n: p.indice + 1, paso });
  if (import.meta.client) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
const siguiente = () => ir(PASOS[Math.min(PASOS.length - 1, p.indice + 1)].k);
const atras = () => {
  // Volver desde el dibujo de la bodega sin haberlo terminado cuenta como abandono de medidas (rescate §I)
  if (p.paso === 'dibujo' && p.alcanzado <= PASOS.findIndex((x) => x.k === 'dibujo')) p.abandonoMedidas = true;
  ir(PASOS[Math.max(0, p.indice - 1)].k);
};
// Datos reales o estimados del diseño: alimentan la precisión de la cotización
const estados = computed(() => estadosDiseño(p));
const movil = ref(false);
const avisoMovilCerrado = ref(false);
// "Cotizar" de arriba: al último paso; si falta definir el rack o la bodega, al paso que falta
function cotizarYa() {
  marcar('cta_click', { ubicacion: 'header', paso: p.paso });
  if (!p.modelos.length) ir('rack');
  else if (!p.racks.length) ir('bodega');
  else ir('cotiza');
}

// Un diseño nuevo parte limpio (sin accesorios quitados ni racks de un recorrido anterior)
function empezarDeNuevo() {
  if (!confirm('¿Empezar un diseño nuevo? Se borra lo que llevas en este navegador.')) return;
  const { utm, rol, lead, registrado, prueba } = p.$state;
  p.reiniciar();
  p.$patch({ utm, rol, lead, registrado, prueba });
  ir('operacion');
}

// ─── Ayuda por WhatsApp tras 60 s sin actividad (una vez por paso, en una esquina) ───
// Nunca sobre un resultado: ni en la recomendación del paso 1 ni en Cotiza
const ayuda = ref(false);
const ayudaVista = ref(false);
let reloj: ReturnType<typeof setTimeout> | null = null;
const sobreResultado = () => !!compartido.value || p.paso === 'cotiza' || (p.paso === 'operacion' && !!p.sistema);
function armarReloj() {
  if (reloj) clearTimeout(reloj);
  if (ayuda.value) return;   // ya está a la vista: se queda hasta que la cierre
  if (ayudaVista.value || sobreResultado()) return;
  reloj = setTimeout(() => { if (!sobreResultado()) ayuda.value = true; }, 60000);
}
// Cualquier toque, tecla o scroll cuenta como actividad
const actividad = () => armarReloj();
const EVENTOS_ACTIVIDAD = ['pointerdown', 'keydown', 'scroll', 'input'] as const;
watch(() => p.paso, () => { ayudaVista.value = false; ayuda.value = false; armarReloj(); });
watch(() => p.sistema, () => { if (sobreResultado()) ayuda.value = false; });
// Los racks del plano siguen a su modelo (pallets, niveles, equipo): el mismo alto de marco y las mismas vigas
// en los pasos 3, 5, 6, 7, el PDF y Kommo. El layout es del cliente: aunque cambie lo que ocupan en planta,
// quedan donde los puso (si ahora chocan, el paso 5 los marca en rojo); nunca se vuelven a ubicar solos
function racksAlDiaConModelo() {
  const { racks } = racksAlDia(p.racks, p.modelos, { pallets: p.pallets, cajas: p.cajas, grua: p.bodega.grua });
  if (JSON.stringify(racks) !== JSON.stringify(p.racks)) p.racks = racks;
}
watch(() => JSON.stringify([p.modelos, p.pallets, p.cajas, p.bodega.grua]), racksAlDiaConModelo);
// Una sola cantidad por producto: si el cliente cambia cuántos pallets tiene, el rack lo sigue (y al revés,
// "Arma tu rack" actualiza la cantidad del producto). Así la barra del layout y "por producto" nunca difieren
function cantidadesConPallets() {
  const m = cantidadesAlDia(p.modelos, { pallets: p.pallets, cajas: p.cajas });
  if (m !== p.modelos) p.modelos = m;
}
watch(() => JSON.stringify([p.pallets.map((t) => [t.id, t.cantidad]), p.cajas.map((c) => [c.id, c.cantidad])]), cantidadesConPallets);

const registroAlInicio = ref(false);
// ─── Diseño compartido (solo lectura): "Cotizar este diseño" lo carga y va a pedir la cotización ───
const compartido = ref<any>(null);
function cotizarCompartido() {
  aplicarDiseño(p, compartido.value);
  compartido.value = null;
  limpiarUrl();
  marcar('cta_click', { ubicacion: 'link_compartido' });
  ir('cotiza');
}
function dejarCompartido() {
  compartido.value = null;
  limpiarUrl();
}
// ─── Guardar y seguir despues (correo con el link al diseño) ───
const guardar = reactive({ abierto: false, correo: '', estado: '' as '' | 'enviando' | 'ok' | 'error', link: '', copiado: false });
// Copiar el link al diseño (sirve aunque el correo no salga); en navegadores sin portapapeles queda para tocarlo
async function copiarLink() {
  try {
    guardar.link ||= await enlaceDiseño(p.$state);
    await navigator.clipboard.writeText(guardar.link);
    guardar.copiado = true;
    marcar('guardar_diseno', { ok: true, via: 'copiar' });
  } catch { guardar.copiado = false; }
}
async function enviarLink() {
  guardar.estado = 'enviando';
  try {
    guardar.link = await enlaceDiseño(p.$state);
    if (!guardar.correo) guardar.correo = p.lead.correo;
    const enviar = () => fetch('https://api.racklog.cl/api/continuar-diseno', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: guardar.correo, nombre: p.lead.nombre, link: guardar.link }),
    });
    // Un reintento si el servidor de correo falla (5xx o red); datos malos (4xx) no se reintentan
    let r = await enviar().catch(() => null);
    if (!r || r.status >= 500) {
      await new Promise((ok) => setTimeout(ok, 1500));
      r = await enviar();
    }
    guardar.estado = r.ok ? 'ok' : 'error';
    marcar('guardar_diseno', { ok: r.ok, status: r.status });
  } catch {
    guardar.estado = 'error';
  }
  if (guardar.estado === 'error') await copiarLink();
}
onMounted(async () => {
  p.cargar();
  // Modo prueba: solo mientras la URL lo pida; el correo de prueba hace que Kommo lo marque PRUEBA
  p.prueba = new URLSearchParams(location.search).get('prueba') === '1';
  if (p.prueba && !p.lead.correo) p.lead.correo = 'comercial+prueba@racklog.cl';
  // Link a un diseño (?d=...): se carga ese diseño (sin datos personales) y se limpia la URL
  try {
    const datos = await diseñoDesdeUrl();
    if (datos?.ver) compartido.value = datos;
    else if (datos) { aplicarDiseño(p, datos); limpiarUrl(); }
  } catch { /* link dañado: sigue con lo guardado */ }
  if (p.lead.correo) guardar.correo = p.lead.correo;
  // A/B 'registro': el control (sin variante o 'final') nunca pide registro antes de dibujar
  registroAlInicio.value = pideRegistroAntes('operacion', { registrado: p.registrado, variante: leerVariante('registro') });
  movil.value = matchMedia('(max-width: 1023px)').matches;
  aplicarDemo();
  cantidadesConPallets();                       // diseños guardados con cantidades descuadradas
  if (p.racks.length) racksAlDiaConModelo();   // diseños guardados antes de este arreglo
  p.$subscribe(() => p.persistir());
  armarReloj();
  if (p.paso === 'operacion' && p.indice === 0 && !compartido.value) marcar('planner_open', { rol: p.rol });
  window.addEventListener('racklog:cotizar', cotizarYa);
  EVENTOS_ACTIVIDAD.forEach((e) => window.addEventListener(e, actividad, { passive: true }));
});
onBeforeUnmount(() => {
  if (reloj) clearTimeout(reloj);
  window.removeEventListener('racklog:cotizar', cotizarYa);
  EVENTOS_ACTIVIDAD.forEach((e) => window.removeEventListener(e, actividad));
});

// La demo de la landing trae alto de pallet, cantidad, altura y equipo: se precargan si no hay datos
function aplicarDemo() {
  const q = new URLSearchParams(location.search);
  const EQ: Record<string, [string, string]> = {
    'apilador-manual': ['manual', 'manual'], 'apilador-electrico': ['apiladora', 'electrico'],
    'grua-horquilla': ['contrapeso', 'grua'], retractil: ['retractil', 'retractil'],
  };
  // Desde la ficha de un producto: el sistema ya viene elegido
  const rack = q.get('rack');
  if (rack && ['RS', 'DI', 'AR'].includes(rack) && p.sabe === null) { p.sistema = rack as 'RS' | 'DI' | 'AR'; p.sabe = true; }
  const alto = Number(q.get('alto')), cant = Number(q.get('pallets')), altura = Number(q.get('altura')), eq = q.get('equipo');
  if (eq && EQ[eq]) { p.bodega.grua = EQ[eq][0]; p.respuestas.equipo = EQ[eq][1]; }
  if (altura >= 2.5 && altura <= 40) p.bodega.altura = altura;
  if (!p.pallets.length && alto >= 0.3 && alto <= 2.5) p.agregarPallet({ nombre: 'Pallet 1', alto, cantidad: cant >= 1 ? Math.round(cant) : 100, desdeCaja: false });
}

function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>

<style src="~/assets/css/flujo.css"></style>
