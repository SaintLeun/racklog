<template>
  <div class="fl min-h-screen bg-neutral-50 pb-32">
    <div class="sticky top-16 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div class="container-page py-3">
        <ClientOnly>
          <FlujoStepper :indice="p.indice" :alcanzado="p.alcanzado" @ir="ir" />
          <template #fallback><div class="h-12" /></template>
        </ClientOnly>
      </div>
    </div>

    <main :class="['container-page pt-8', ANCHO[p.paso]]">
      <ClientOnly>
        <Transition name="fl-paso" mode="out-in">
          <component :is="COMPONENTES[p.paso]" :key="p.paso" @siguiente="siguiente" @atras="atras" />
        </Transition>
        <template #fallback>
          <div class="space-y-4" aria-hidden="true">
            <div class="h-8 w-2/3 animate-pulse rounded-lg bg-neutral-200" />
            <div class="h-40 animate-pulse rounded-2xl bg-neutral-200" />
          </div>
        </template>
      </ClientOnly>
    </main>

    <ClientOnly>
      <!-- Ayuda si se queda pegado en un paso -->
      <Transition name="fl-sub">
        <div v-if="ayuda" class="fixed bottom-24 left-4 right-4 z-40 mx-auto max-w-md rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10 sm:left-auto sm:right-6" role="status">
          <p class="font-medium text-neutral-900">¿Te ayudamos con este paso?</p>
          <p class="text-sm text-neutral-600">Un ejecutivo te responde por WhatsApp.</p>
          <div class="mt-3 flex gap-2">
            <a :href="`https://wa.me/56932403819?text=${encodeURIComponent('Hola, estoy diseñando mi bodega en la web y tengo una duda en el paso: ' + PASOS[p.indice].t)}`" target="_blank" rel="noopener" class="fl-btn !min-h-10 !px-4 !text-sm" @click="marcar('whatsapp_click', { ubicacion: 'ayuda', paso: p.paso })">Escribir</a>
            <button type="button" class="fl-btn-sec !min-h-10 !px-4 !text-sm" @click="ayuda = false; ayudaVista = true">No, gracias</button>
          </div>
        </div>
      </Transition>
      <CtaCotizacion24 v-if="p.paso !== 'cotiza' && p.indice >= 2" @cotizar="cotizarYa" />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
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
  operacion: 'max-w-2xl', pallets: 'max-w-3xl', rack: 'max-w-6xl', accesorios: 'max-w-3xl', bodega: 'max-w-7xl', revisa: 'max-w-6xl', cotiza: 'max-w-3xl',
};

function ir(paso: Paso) {
  p.ir(paso);
  marcar('tour_step', { n: p.indice + 1, paso });
  if (import.meta.client) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
const siguiente = () => ir(PASOS[Math.min(PASOS.length - 1, p.indice + 1)].k);
const atras = () => ir(PASOS[Math.max(0, p.indice - 1)].k);
// El CTA fijo lleva a cotizar; si falta definir el rack o la bodega, al paso que falta
function cotizarYa() {
  marcar('cta_click', { ubicacion: 'barra_fija', paso: p.paso });
  if (!p.modelos.length) ir('rack');
  else if (!p.racks.length) ir('bodega');
  else ir(p.registrado ? 'cotiza' : 'revisa');
}

// ─── Ayuda por WhatsApp tras 60 s sin avanzar (una vez por paso, no intrusiva) ───
const ayuda = ref(false);
const ayudaVista = ref(false);
let reloj: ReturnType<typeof setTimeout> | null = null;
function armarReloj() {
  if (reloj) clearTimeout(reloj);
  ayuda.value = false;
  if (ayudaVista.value || p.paso === 'cotiza') return;
  reloj = setTimeout(() => { ayuda.value = true; }, 60000);
}
watch(() => p.paso, () => { ayudaVista.value = false; armarReloj(); });

onMounted(() => {
  p.cargar();
  aplicarDemo();
  p.$subscribe(() => p.persistir());
  armarReloj();
  if (p.paso === 'operacion' && p.indice === 0) marcar('planner_open', { rol: p.rol });
});
onBeforeUnmount(() => { if (reloj) clearTimeout(reloj); });

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
.fl-titulo { font-size: 1.5rem; line-height: 1.25; font-weight: 700; color: #171717; letter-spacing: -0.01em; }
.fl-bajada { margin-top: .5rem; color: #525252; }
.fl-pregunta { font-size: 1.125rem; font-weight: 600; color: #171717; }
.fl-leyenda { font-size: .8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #525252; }
.fl-sub { font-weight: 600; color: #262626; }
.fl-card { border-radius: 1rem; background: #fff; padding: 1.25rem; box-shadow: 0 1px 2px rgb(0 0 0 / .04); outline: 1px solid #e5e5e5; }
.fl-campo { display: grid; gap: .375rem; }
.fl-campo > span { font-size: .9375rem; font-weight: 500; color: #404040; }
.fl-campo .form-input { min-height: 2.75rem; font-size: 1rem; }
.fl-error { border-color: #dc2626 !important; }
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
  display: flex; flex-direction: column; gap: .25rem; text-align: left; border-radius: 1rem; background: #fff; padding: 1.25rem;
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
.fl-mas > summary, .fl-tip > summary { cursor: pointer; font-weight: 600; color: #404040; min-height: 2.75rem; display: flex; align-items: center; }
.fl-tip > p { margin-top: .25rem; color: #525252; }
.fl-dato { border-radius: .75rem; background: #fafafa; padding: .75rem; }
.fl-dato dt { font-size: .8125rem; color: #737373; }
.fl-dato dd { margin-top: .125rem; font-size: 1.25rem; font-weight: 700; color: #171717; }
.fl-paso-btn { width: 2.75rem; height: 2.75rem; font-size: 1.25rem; font-weight: 600; color: #404040; }
.fl-paso-btn:disabled { color: #d4d4d4; }

/* Transiciones: fade + 10 px, 220 ms. El paso que sale se va de inmediato (sin pantalla en blanco) */
.fl-paso-leave-active { transition: none; }
.fl-paso-enter-active, .fl-sub-enter-active, .fl-sub-leave-active { transition: opacity .22s cubic-bezier(.2, .8, .2, 1), transform .22s cubic-bezier(.2, .8, .2, 1); }
.fl-paso-enter-from, .fl-sub-enter-from { opacity: 0; transform: translateY(10px); }
.fl-paso-leave-to, .fl-sub-leave-to { opacity: 0; transform: translateY(-6px); }
.fl-lista-enter-active, .fl-lista-leave-active { transition: opacity .2s, transform .2s; }
.fl-lista-enter-from, .fl-lista-leave-to { opacity: 0; transform: translateY(8px); }
@media (min-width: 640px) { .fl-titulo { font-size: 1.75rem; } }
@media (prefers-reduced-motion: reduce) {
  .fl-paso-enter-active, .fl-paso-leave-active, .fl-sub-enter-active, .fl-sub-leave-active, .fl-lista-enter-active, .fl-lista-leave-active { transition: opacity .01s; }
  .fl-paso-enter-from, .fl-paso-leave-to, .fl-sub-enter-from, .fl-sub-leave-to, .fl-lista-enter-from, .fl-lista-leave-to { transform: none; }
}
</style>
