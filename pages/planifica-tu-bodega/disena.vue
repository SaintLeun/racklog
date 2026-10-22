<template>
  <div class="fl min-h-screen bg-neutral-50 pb-32">
    <p v-if="p.prueba" class="bg-amber-400 px-4 py-1.5 text-center text-sm font-semibold text-amber-950" role="status">Modo prueba: el lead llega a Kommo con la etiqueta PRUEBA, sin vendedor ni tarea de 24 h.</p>
    <div class="sticky top-16 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div class="container-page py-3">
        <ClientOnly>
          <FlujoStepper v-if="!compartido" :indice="p.indice" :alcanzado="p.alcanzado" @ir="ir" />
          <!-- Continuar donde quede: el link a su diseño llega por correo -->
          <div v-if="!compartido" class="mt-2 flex justify-end gap-5">
            <button v-if="!guardar.abierto && p.alcanzado > 0" type="button" class="text-sm font-medium text-neutral-500 underline underline-offset-2" @click="empezarDeNuevo">Empezar de nuevo</button>
            <button v-if="!guardar.abierto" type="button" class="text-sm font-medium text-brand-700 underline underline-offset-2" @click="guardar.abierto = true">Guardar y seguir después</button>
            <form v-else class="flex w-full flex-wrap items-center justify-end gap-2" @submit.prevent="enviarLink">
              <label class="sr-only" for="fl-correo-guardar">Tu correo</label>
              <input id="fl-correo-guardar" v-model.trim="guardar.correo" type="email" required placeholder="tu@empresa.cl" class="form-input !h-10 w-56 max-w-full">
              <button type="submit" class="fl-btn !min-h-10 !px-4 !text-sm" :disabled="guardar.estado === 'enviando'">{{ guardar.estado === 'enviando' ? 'Enviando…' : 'Envíame el link' }}</button>
              <span v-if="guardar.estado === 'ok'" class="text-sm text-green-700" role="status">Listo, revisa tu correo.</span>
              <span v-else-if="guardar.estado === 'error'" class="text-sm text-red-700" role="status">No se pudo enviar. Copia el link: <a :href="guardar.link" class="underline">abrir</a></span>
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
        <Transition name="fl-paso" mode="out-in">
          <!-- Link compartido: solo lectura, con "Cotizar este diseño" (no pisa el diseño de quien lo abre) -->
          <FlujoCompartido v-if="compartido" key="compartido" :datos="compartido" @cotizar="cotizarCompartido" @propio="dejarCompartido" />
          <!-- A/B 'registro': con la variante "inicio" el registro va antes de la primera pregunta -->
          <FlujoRegistro v-else-if="registroAlInicio && p.paso === 'operacion' && !p.registrado" key="registro" @listo="registroAlInicio = false" />
          <component :is="COMPONENTES[p.paso]" v-else :key="p.paso" class="fl-cascada" @siguiente="siguiente" @atras="atras" />
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
import { racksAlDia, resultadoModelo, ubicarModelos } from '~/lib/flujo/calculos.js';
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
  operacion: FlujoPasoOperacion, pallets: FlujoPasoPallets, rack: FlujoPasoRack, accesorios: FlujoPasoAccesorios,
  bodega: FlujoPasoBodega, revisa: FlujoPasoRevisa, cotiza: FlujoPasoCotiza,
};
// Los pasos con plano o 3D usan todo el ancho
const ANCHO: Record<Paso, string> = {
  operacion: 'max-w-2xl', pallets: 'max-w-6xl', rack: 'max-w-6xl', accesorios: 'max-w-3xl', bodega: 'max-w-[1560px]', revisa: 'max-w-6xl', cotiza: 'max-w-3xl',
};

function ir(paso: Paso) {
  p.ir(paso);
  marcar('tour_step', { n: p.indice + 1, paso });
  if (import.meta.client) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
const siguiente = () => ir(PASOS[Math.min(PASOS.length - 1, p.indice + 1)].k);
const atras = () => ir(PASOS[Math.max(0, p.indice - 1)].k);
// "Cotizar" de arriba: al último paso; si falta definir el rack o la bodega, al paso que falta
function cotizarYa() {
  marcar('cta_click', { ubicacion: 'header', paso: p.paso });
  if (!p.modelos.length) ir('rack');
  else if (!p.racks.length) ir('bodega');
  else ir(p.registrado ? 'cotiza' : 'revisa');
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
// en los pasos 3, 5, 6, 7, el PDF y Kommo. Si cambia lo que ocupan en planta, se vuelven a ubicar
function racksAlDiaConModelo() {
  const opciones = { pallets: p.pallets, cajas: p.cajas, grua: p.bodega.grua };
  const { racks, huellaCambio } = racksAlDia(p.racks, p.modelos, opciones);
  if (huellaCambio) {
    const existentes = racks.filter((r: any) => r.existente);
    const modulos = Object.fromEntries(p.modelos.map((m) => [m.id, (resultadoModelo(m, opciones) as any).modulos]));
    let k = 0;
    const u = ubicarModelos(p.bodega, p.modelos, modulos, { ...opciones, existentes, nuevoId: () => `r${Date.now().toString(36)}${k++}` });
    p.racks = [...existentes, ...u.racks];
  } else if (JSON.stringify(racks) !== JSON.stringify(p.racks)) p.racks = racks;
}
watch(() => JSON.stringify([p.modelos, p.pallets, p.cajas, p.bodega.grua]), racksAlDiaConModelo);

const registroAlInicio = ref(false);
// ─── Diseño compartido (solo lectura): "Cotizar este diseño" lo carga y va a pedir la cotización ───
const compartido = ref<any>(null);
function cotizarCompartido() {
  aplicarDiseño(p, compartido.value);
  compartido.value = null;
  limpiarUrl();
  marcar('cta_click', { ubicacion: 'link_compartido' });
  ir(p.registrado ? 'cotiza' : 'revisa');
}
function dejarCompartido() {
  compartido.value = null;
  limpiarUrl();
}
// ─── Guardar y seguir despues (correo con el link al diseño) ───
const guardar = reactive({ abierto: false, correo: '', estado: '' as '' | 'enviando' | 'ok' | 'error', link: '' });
async function enviarLink() {
  guardar.estado = 'enviando';
  try {
    guardar.link = await enlaceDiseño(p.$state);
    if (!guardar.correo) guardar.correo = p.lead.correo;
    const r = await fetch('https://api.racklog.cl/api/continuar-diseno', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: guardar.correo, nombre: p.lead.nombre, link: guardar.link }),
    });
    guardar.estado = r.ok ? 'ok' : 'error';
    marcar('guardar_diseno', { ok: r.ok });
  } catch {
    guardar.estado = 'error';
  }
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
  registroAlInicio.value = leerVariante('registro') === 'inicio' && !p.registrado;
  aplicarDemo();
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

<style>
/* ─── Flujo "Planifica tu bodega": tipografia con aire y controles de 44 px ─── */
.fl { font-size: 16px; line-height: 1.5; }
.fl-titulo { font-size: 1.375rem; line-height: 1.25; font-weight: 700; color: #171717; letter-spacing: -0.01em; }
.fl-bajada { margin-top: .25rem; color: #525252; }
.fl-pregunta { font-size: 1.125rem; font-weight: 600; color: #171717; }
.fl-leyenda { font-size: .8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #525252; }
.fl-sub { font-weight: 600; color: #262626; }
.fl-card { border-radius: 1rem; background: #fff; padding: 1rem; box-shadow: 0 1px 2px rgb(0 0 0 / .04); outline: 1px solid #e5e5e5; }
.fl-campo { display: grid; gap: .375rem; }
.fl-campo > span { font-size: .9375rem; font-weight: 500; color: #404040; }
.fl-campo .form-input { min-height: 2.75rem; font-size: 1rem; }
.fl-error { border-color: #dc2626 !important; }
/* Datos de ejemplo: se ven grises hasta que el cliente los cambia */
.fl-ejemplo .form-input { color: #a3a3a3; }
.fl-msg { font-size: .875rem; color: #b91c1c; }
.fl-input-titulo { flex: 1; min-width: 0; border-radius: .5rem; padding: .25rem .5rem; margin-left: -.5rem; font-weight: 600; font-size: 1.0625rem; color: #171717; }
.fl-input-titulo:hover { background: #f5f5f5; }
.fl-input-titulo:focus { outline: 2px solid #fdba74; background: #fff; }
.fl-quitar { font-size: .875rem; font-weight: 500; color: #b91c1c; padding: .5rem; }
.fl-btn {
  display: inline-flex; align-items: center; justify-content: center; min-height: 2.75rem; padding: 0 1.5rem; border-radius: .75rem;
  background: #ea580c; color: #fff; font-weight: 600; transition: background .2s, transform .12s;
}
.fl-btn:hover { background: #c2410c; }
.fl-btn:active, .fl-btn-sec:active, .fl-chip:active, .fl-opcion:active { transform: scale(.98); }
.fl-btn-sec {
  display: inline-flex; align-items: center; justify-content: center; min-height: 2.75rem; padding: 0 1.25rem; border-radius: .75rem;
  background: #fff; color: #262626; font-weight: 600; box-shadow: inset 0 0 0 1px #d4d4d4; transition: background .2s, transform .12s;
}
.fl-btn-sec:hover { background: #f5f5f5; }
.fl-opcion {
  display: flex; flex-direction: column; gap: .25rem; text-align: left; border-radius: 1rem; background: #fff; padding: 1rem;
  box-shadow: inset 0 0 0 1px #e5e5e5; transition: box-shadow .2s, transform .12s;
}
.fl-opcion:hover { box-shadow: inset 0 0 0 2px #fdba74; }
.fl-opcion--sel { box-shadow: inset 0 0 0 2px #ea580c !important; }
.fl-chip {
  display: inline-flex; align-items: center; justify-content: center; width: 100%; min-height: 2.75rem; padding: .5rem .875rem;
  border-radius: .75rem; background: #fff; color: #262626; font-weight: 500; box-shadow: inset 0 0 0 1px #d4d4d4;
  transition: box-shadow .15s, background .15s, transform .12s;
}
.fl-chip:hover { box-shadow: inset 0 0 0 1px #a3a3a3; }
.fl-chip--sel { background: #fff7ed; color: #9a3412; box-shadow: inset 0 0 0 2px #ea580c !important; font-weight: 600; }
.fl-nose { flex-shrink: 0; min-height: 2.75rem; padding: 0 .875rem; border-radius: .75rem; font-size: .875rem; font-weight: 500; color: #525252; box-shadow: inset 0 0 0 1px #d4d4d4; background: #fff; }
.fl-nose--sel { background: #f5f5f5; color: #171717; box-shadow: inset 0 0 0 2px #737373; }
.fl-agregar { display: block; width: 100%; min-height: 2.75rem; border-radius: .75rem; border: 1.5px dashed #d4d4d4; color: #c2410c; font-weight: 600; }
.fl-agregar:hover { border-color: #fdba74; background: #fff7ed; }
.fl-mas > summary, .fl-tip > summary { cursor: pointer; font-weight: 600; font-size: .9375rem; color: #404040; min-height: 2.5rem; display: flex; align-items: center; }
.fl-tip > p { margin-top: .25rem; color: #525252; }
/* Panel de propiedades del plano (paso 5): al borde derecho, fijo con el plano, acciones al pie */
.fl-panel { display: flex; flex-direction: column; flex-shrink: 0; border-top: 1px solid #f5f5f5; background: #fff; max-height: 46svh; }
/* En escritorio toma el alto del plano (absoluto en su columna) y su cuerpo scrollea: el pie siempre a la vista */
@media (min-width: 1024px) { .fl-panel { position: absolute; inset: 0; max-height: none; border-top: 0; border-left: 1px solid #f0f0f0; } }
.fl-panel__cab { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; padding: 1rem 1rem .75rem; border-bottom: 1px solid #f5f5f5; }
.fl-panel__tipo { font-size: .6875rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #a3a3a3; }
.fl-panel__titulo { font-size: 1.0625rem; font-weight: 700; color: #171717; line-height: 1.3; }
.fl-panel__cerrar { width: 2rem; height: 2rem; flex-shrink: 0; border-radius: .5rem; font-size: 1.375rem; line-height: 1; color: #737373; }
.fl-panel__cerrar:hover { background: #f5f5f5; color: #171717; }
.fl-panel__cuerpo { flex: 1; overflow-y: auto; padding: .25rem 1rem 1rem; }
.fl-panel__sec { margin: 1rem 0 .5rem; font-size: .75rem; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: #737373; }
.fl-panel__datos { display: grid; grid-template-columns: repeat(3, 1fr); gap: .375rem; }
.fl-panel__datos > div { border-radius: .5rem; background: #fafafa; padding: .375rem .5rem; }
.fl-panel__datos dt { font-size: .75rem; color: #737373; }
.fl-panel__datos dd { font-size: .9375rem; font-weight: 600; color: #171717; font-variant-numeric: tabular-nums; }
.fl-prop { display: flex; align-items: center; justify-content: space-between; gap: .75rem; min-height: 2.5rem; font-size: .875rem; color: #404040; }
.fl-prop + .fl-prop { border-top: 1px solid #fafafa; }
.fl-prop__in { position: relative; flex-shrink: 0; }
.fl-prop__in input { width: 6.5rem; height: 2.25rem; border-radius: .5rem; border: 1px solid #d4d4d4; padding: 0 1.75rem 0 .625rem; text-align: right; font-variant-numeric: tabular-nums; color: #171717; background: #fff; }
.fl-prop__in input:focus { outline: 2px solid #fb923c; outline-offset: 0; border-color: #fb923c; }
.fl-prop__in i { position: absolute; right: .625rem; top: 50%; transform: translateY(-50%); font-style: normal; font-size: .8125rem; color: #a3a3a3; pointer-events: none; }
.fl-panel__pie { display: grid; grid-template-columns: repeat(3, 1fr); gap: .375rem; padding: .75rem 1rem; border-top: 1px solid #f5f5f5; background: #fafafa; }
.fl-panel__accion { min-height: 2.5rem; border-radius: .625rem; background: #fff; box-shadow: inset 0 0 0 1px #d4d4d4; font-size: .875rem; font-weight: 600; color: #262626; }
.fl-panel__accion:hover { box-shadow: inset 0 0 0 1px #a3a3a3; }
/* Sugerencia de otro sistema (paso 3): una línea discreta y plegada bajo la altura */
.fl-sugerencia { border-radius: .75rem; background: #fff; box-shadow: inset 0 0 0 1px #e5e5e5; padding: .5rem .875rem; font-size: .9375rem; }
.fl-sugerencia > summary { cursor: pointer; list-style: none; min-height: 2.25rem; display: flex; flex-wrap: wrap; align-items: center; gap: .125rem .25rem; }
.fl-sugerencia > summary::-webkit-details-marker { display: none; }
.fl-sugerencia[open] > summary { border-bottom: 1px solid #f5f5f5; padding-bottom: .5rem; }
.fl-dato { border-radius: .625rem; background: #fafafa; padding: .5rem .625rem; }
.fl-dato dt { font-size: .75rem; line-height: 1.3; color: #737373; }
.fl-dato dd { font-size: 1.125rem; font-weight: 700; color: #171717; }
.fl-paso-btn { width: 2.75rem; height: 2.75rem; font-size: 1.25rem; font-weight: 600; color: #404040; }
.fl-paso-btn:disabled { color: #d4d4d4; }

/* Transiciones: fade + 10 px, 220 ms. El paso que sale se va de inmediato (sin pantalla en blanco) */
.fl-paso-leave-active { transition: none; }
.fl-paso-enter-active, .fl-sub-enter-active, .fl-sub-leave-active { transition: opacity .22s cubic-bezier(.2, .8, .2, 1), transform .22s cubic-bezier(.2, .8, .2, 1); }
.fl-paso-enter-from, .fl-sub-enter-from { opacity: 0; transform: translateY(10px); }
.fl-paso-leave-to, .fl-sub-leave-to { opacity: 0; transform: translateY(-6px); }
.fl-lista-enter-active, .fl-lista-leave-active { transition: opacity .2s, transform .2s; }
.fl-lista-enter-from, .fl-lista-leave-to { opacity: 0; transform: translateY(8px); }
/* Densidad: información corta en controles bajos. Con mouse los chips bajan a 40 px; con dedo quedan en 44 px */
@media (pointer: fine) {
  .fl-chip, .fl-btn, .fl-btn-sec, .fl-nose, .fl-agregar { min-height: 2.5rem; }
  .fl-campo .form-input { min-height: 2.5rem; }
  .fl input.form-input, .fl select.form-input { height: 2.5rem; padding-top: .375rem; padding-bottom: .375rem; }
}
.fl-sub { font-size: .9375rem; }
.fl-leyenda { font-size: .75rem; }
/* Tarjeta con secciones: una sola caja con líneas finas en vez de una tarjeta por dato */
.fl-secciones > * + * { margin-top: .875rem; padding-top: .875rem; border-top: 1px solid #f0f0f0; }
.fl-secciones > fieldset > legend { float: left; width: 100%; }
.fl-secciones > fieldset > legend + * { clear: both; }

/* Esqueletos de carga: brillo que pasa (no un gris plano) y entrada en cascada */
.fl-esq { border-radius: .75rem; background: linear-gradient(90deg, #ededed 0%, #f7f7f7 40%, #ededed 80%) 0 0 / 300% 100%; animation: fl-brillo 1.4s ease-in-out infinite; }
.fl-esq-tarjeta { border-radius: 1rem; background: #fff; padding: 1.25rem; outline: 1px solid #f0f0f0; }
.fl-esq-cascada > *, .fl-cascada > *, .fl-cascada > section > *, .fl-cascada > div > section > * { animation: fl-cae .38s cubic-bezier(.2, .8, .2, 1) both; }
.fl-esq-cascada > :nth-child(2), .fl-cascada > :nth-child(2), .fl-cascada > section > :nth-child(2), .fl-cascada > div > section > :nth-child(2) { animation-delay: 50ms; }
.fl-esq-cascada > :nth-child(3), .fl-cascada > :nth-child(3), .fl-cascada > section > :nth-child(3), .fl-cascada > div > section > :nth-child(3) { animation-delay: 100ms; }
.fl-esq-cascada > :nth-child(4), .fl-cascada > :nth-child(4), .fl-cascada > section > :nth-child(4), .fl-cascada > div > section > :nth-child(4) { animation-delay: 150ms; }
.fl-esq-cascada > :nth-child(n+5), .fl-cascada > :nth-child(n+5), .fl-cascada > section > :nth-child(n+5), .fl-cascada > div > section > :nth-child(n+5) { animation-delay: 200ms; }
@keyframes fl-brillo { 0% { background-position: 100% 0; } 100% { background-position: -50% 0; } }
@keyframes fl-cae { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@media (min-width: 640px) { .fl-titulo { font-size: 1.75rem; } }
@media (prefers-reduced-motion: reduce) {
  .fl-paso-enter-active, .fl-paso-leave-active, .fl-sub-enter-active, .fl-sub-leave-active, .fl-lista-enter-active, .fl-lista-leave-active { transition: opacity .01s; }
  .fl-esq { animation: none; }
  .fl-esq-cascada > *, .fl-cascada > *, .fl-cascada > section > *, .fl-cascada > div > section > * { animation: none; }
  .fl-paso-enter-from, .fl-paso-leave-to, .fl-sub-enter-from, .fl-sub-leave-to, .fl-lista-enter-from, .fl-lista-leave-to { transform: none; }
}
</style>
