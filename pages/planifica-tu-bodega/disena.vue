<template>
  <div class="fl min-h-screen bg-neutral-50 pb-32">
    <p v-if="p.prueba" class="bg-amber-400 px-4 py-1.5 text-center text-sm font-semibold text-amber-950" role="status">Modo prueba: el lead llega a Kommo con la etiqueta PRUEBA, sin vendedor ni tarea de 24 h.</p>
    <!-- Fijo arriba en los pasos de formulario; en el layout y los accesorios (plano grande) se suelta para no
         tapar el plano al hacer scroll (dueño 27-10) -->
    <div :class="['z-30 border-b border-neutral-200 bg-white/95 backdrop-blur', PASOS_CON_PLANO.includes(p.paso) ? 'relative' : 'sticky top-16']" :data-fijo-arriba="PASOS_CON_PLANO.includes(p.paso) ? undefined : ''">
      <div class="container-page py-3">
        <ClientOnly>
          <FlujoStepper v-if="!compartido" :indice="p.indice" :alcanzado="p.alcanzado" @ir="ir" />
          <!-- Sin "Guardar y seguir después" (dueño 27-10): el diseño solo sale por correo con RUT, en el registro final.
               Lo hecho igual queda guardado en este navegador -->
          <div v-if="!compartido" class="mt-2 flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
            <!-- Precisión de la cotización siempre a la vista: sube con cada dato real (prompt de conversión §H) -->
            <FlujoPrecision v-if="p.alcanzado > 0" compacto class="mr-auto" :estados="estados" />
            <button v-if="p.alcanzado > 0" type="button" class="text-sm font-medium text-neutral-500 underline underline-offset-2" @click="empezarDeNuevo">Empezar de nuevo</button>
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
          <div class="mt-3 grid gap-2">
            <NuxtLink to="/planifica-tu-bodega/expres" class="fl-btn" @click="marcar('cta_click', { ubicacion: 'disena_movil', via: 'expres' })">Lo diseñan ustedes (2 min)</NuxtLink>
          </div>
          <button type="button" class="mt-2 text-sm font-medium text-neutral-500 underline underline-offset-2" @click="avisoMovilCerrado = true">Seguir aquí en el celular</button>
        </div>
        <Transition name="fl-paso" mode="out-in">
          <!-- Link compartido: solo lectura, con "Cotizar este diseño" (no pisa el diseño de quien lo abre) -->
          <LazyFlujoCompartido v-if="compartido" key="compartido" :datos="compartido" @cotizar="cotizarCompartido" @propio="dejarCompartido" />
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
      <!-- Asistente de Racklog (el robot): aparece cuando el cliente lo pide; si se queda pegado en un paso, ofrece
           ayuda (antes era una píldora de WhatsApp: ahora WhatsApp va dentro del asistente) -->
      <FlujoAsistente
        v-if="!compartido" :paso="p.paso" :indice="p.indice" :titulo-paso="PASOS[p.indice].t" :invitar="ayuda"
        :whatsapp="`https://wa.me/56932403819?text=${encodeURIComponent('Hola, estoy diseñando mi bodega en la web y tengo una duda en el paso: ' + PASOS[p.indice].t)}`"
        @visto="ayuda = false; ayudaVista = true"
      />
      <!-- Dentro del flujo no hay barra flotante de cotizar: solo el botón del paso y el "Cotizar" de arriba -->
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { diseñoDesdeUrl, aplicarDiseño, limpiarUrl, pideRecorrido } from '~/lib/flujo/enlace.js';
import { leerVariante } from '~/composables/useVariante';
import { MENSAJE_INICIO, estadosDiseño, pideRegistroAntes } from '~/lib/flujo/conversion.js';
import { racksAlDia, cantidadesAlDia, conPilares } from '~/lib/flujo/calculos.js';
import { consulta } from '~/lib/flujo/consulta.js';
import { useProyecto, PASOS, type Paso } from '~/stores/proyecto';
import {
  FlujoPasoOperacion, LazyFlujoPasoPallets, LazyFlujoPasoRack, LazyFlujoPasoAccesorios, LazyFlujoPasoBodega, LazyFlujoPasoRevisa, LazyFlujoPasoCotiza,
} from '#components';


definePageMeta({ layout: 'landing' });
usePageSeo({
  title: 'Diseña tu bodega paso a paso',
  description: 'Define tus pallets, arma tu rack, ubícalo en tu bodega y recibe tu cotización en máximo 24 horas.',
});
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const p = useProyecto();
const COMPONENTES: Record<Paso, unknown> = {
  operacion: FlujoPasoOperacion, pallets: LazyFlujoPasoPallets, rack: LazyFlujoPasoRack, accesorios: LazyFlujoPasoAccesorios,
  bodega: LazyFlujoPasoBodega, revisa: LazyFlujoPasoRevisa, cotiza: LazyFlujoPasoCotiza,
};
// El paso 1 va en el primer golpe; el resto (plano, 3D) se baja cuando el navegador queda libre, así el
// cliente ve la primera pregunta al tiro y el paso siguiente ya está listo cuando avanza
function precargarPasos() {
  const bajar = () => Object.values(COMPONENTES).forEach((c) => (c as { __asyncLoader?: () => Promise<unknown> }).__asyncLoader?.());
  if ('requestIdleCallback' in window) requestIdleCallback(bajar, { timeout: 2500 });
  else setTimeout(bajar, 1500);
}
// Pasos con plano grande: el encabezado de pasos no queda fijo
const PASOS_CON_PLANO: Paso[] = ['bodega', 'accesorios'];
// Los pasos con plano o 3D usan todo el ancho
const ANCHO: Record<Paso, string> = {
  operacion: 'max-w-4xl', pallets: 'max-w-6xl', rack: 'max-w-6xl', accesorios: 'max-w-3xl', bodega: 'max-w-[1560px]', revisa: 'max-w-6xl', cotiza: 'max-w-3xl',
};

function ir(paso: Paso) {
  p.ir(paso);
  marcar('tour_step', { n: p.indice + 1, paso });
  if (import.meta.client) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
const siguiente = () => ir(PASOS[Math.min(PASOS.length - 1, p.indice + 1)].k);
// El abandono de medidas (rescate §I) lo marca PasoBodega al volver sin terminar la bodega
const atras = () => ir(PASOS[Math.max(0, p.indice - 1)].k);
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
// Pilares dentro de un selectivo: el rack anota las posiciones que pierde. Aquí (página siempre montada) y no en el
// paso 5: rearmar los racks (racksAlDia) o recargar en Revisa/Cotiza las borraba (conPilares devuelve el mismo
// arreglo si nada cambió, así que no se vuelve a disparar)
watchEffect(() => {
  const nuevos = conPilares(p.racks, p.bodega), hoy = conPilares(p.racksHoy, p.bodega);
  if (nuevos !== p.racks) p.racks = nuevos;
  if (hoy !== p.racksHoy) p.racksHoy = hoy;
});
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
// Ejecutivo de Racklog abriendo el link del lead: Revisa muestra "Descargar video" (el cliente solo lo ve en pantalla)
const modoRecorrido = useState('modo-recorrido', () => false);
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
// El 3D (three.js y la escena, ~1,4 MB) se descarga en segundo plano apenas hay un momento libre: al llegar al
// primer paso con 3D ya está en caché y la vista aparece antes (rendimiento, 27-10)
// Y si el cliente todavía está en un paso sin 3D, se deja el motor gráfico precalentado (materiales compilados en
// segundo plano con una bodega de muestra): el primer 3D sale sin la espera de compilar
function precargar3D() {
  const bajar = () => Promise.all([
    import('~/lib/rack3d/visor.js'), import('~/lib/rack3d/bodega.js'), import('~/lib/rack3d/planificador.js'),
    import('~/lib/rack3d/construir.js'), import('~/lib/rack3d/medidas.js'),
  ]).then(([visor, bodega, plan]) => {
    if (['bodega', 'accesorios', 'revisa'].includes(p.paso)) return;
    const muestra = { ancho: 20, largo: 24, altura: 8, forma: null, grua: p.bodega.grua || 'contrapeso', elementos: [] };
    const rack = plan.normalizar({ id: 'muestra', tipo: 'RS', cuerpos: 4, niveles: 3, doble: true, rot: 0, x: 10, y: 8 });
    return visor.precalentar(bodega.construirBodega(muestra, [rack], { pallets: [] }));
  }).catch(() => { /* se reintenta al abrir el 3D */ });
  if ('requestIdleCallback' in window) (window as any).requestIdleCallback(bajar, { timeout: 4000 });
  else setTimeout(bajar, 1500);
}
onMounted(async () => {
  precargar3D();
  p.cargar();
  // Modo prueba: solo mientras la URL lo pida; el correo de prueba hace que Kommo lo marque PRUEBA
  p.prueba = new URLSearchParams(consulta()).get('prueba') === '1';
  if (p.prueba && !p.lead.correo) p.lead.correo = 'comercial+prueba@racklog.cl';
  // Link a un diseño (?d=...): se carga ese diseño (sin datos personales) y se limpia la URL
  try {
    const datos = await diseñoDesdeUrl();
    if (datos?.ver) compartido.value = datos;
    else if (datos) {
      // Link del ejecutivo (llega en el lead): el diseño del cliente abierto en Revisa, listo para grabar el recorrido
      const recorrido = pideRecorrido() && datos.racks?.length;
      aplicarDiseño(p, datos);
      if (recorrido) { modoRecorrido.value = true; p.ir('revisa'); }
      limpiarUrl();
    }
  } catch { /* link dañado: sigue con lo guardado */ }
  // A/B 'registro': el control (sin variante o 'final') nunca pide registro antes de dibujar
  registroAlInicio.value = pideRegistroAntes('operacion', { registrado: p.registrado, variante: leerVariante('registro') });
  movil.value = matchMedia('(max-width: 1023px)').matches;
  aplicarDemo();
  cantidadesConPallets();                       // diseños guardados con cantidades descuadradas
  if (p.racks.length) racksAlDiaConModelo();   // diseños guardados antes de este arreglo
  p.$subscribe(() => p.persistir());
  armarReloj();
  precargarPasos();
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
  const q = new URLSearchParams(consulta());
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
