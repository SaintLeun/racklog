<template>
  <!-- Registro al final (prompt de conversión §C): nombre y correo de empresa a cambio del PDF, el link y la
       cotización en 24 h. RUT OBLIGATORIO (dueño 27-10: solo empresas reales; sin RUT no se envía nada); la comuna
       distingue RM de regiones para el rescate (§I) -->
  <form class="fl-card" novalidate @submit.prevent="enviar">
    <!-- Certezas sin precio (§F) -->
    <p class="fl-leyenda">Lo que recibes</p>
    <ul class="mt-2 space-y-1.5 text-neutral-800">
      <li v-if="posiciones" class="flex gap-2"><span class="text-green-600" aria-hidden="true">✓</span><span><b>{{ n(posiciones) }} {{ unidad }}</b>{{ ganas ? ` (+${n(ganas)} sobre lo que tienes hoy)` : '' }}, exactas, en tu bodega</span></li>
      <li class="flex gap-2"><span class="text-green-600" aria-hidden="true">✓</span><span>Cotización formal en <b>máximo 24 horas</b> que incluye fabricación, montaje e ingeniería</span></li>
      <li class="flex gap-2"><span class="text-green-600" aria-hidden="true">✓</span><span>Ingeniería Racklog valida el diseño con cálculo estructural según {{ NORMAS }}</span></li>
      <li class="flex gap-2"><span class="text-green-600" aria-hidden="true">✓</span><span>Fabricado en Chile, en nuestra planta de Quilicura</span></li>
      <li v-if="entregables" class="flex gap-2"><span class="text-green-600" aria-hidden="true">✓</span><span>{{ entregables }}</span></li>
    </ul>
    <FlujoPrecision class="mt-4" :estados="estados" />
    <p v-if="pr.sinVisita" class="mt-2 text-sm font-medium text-green-800">Con esta información tu ejecutivo cotiza directo, sin visita previa.</p>

    <h2 class="mt-6 text-[20px] font-bold leading-tight text-neutral-900">{{ titulo }}</h2>
    <!-- items-start: cada campo con su etiqueta arriba y el input justo debajo, aunque el de al lado tenga ayuda -->
    <div class="mt-4 grid items-start gap-x-4 gap-y-5 sm:grid-cols-2">
      <label class="fl-campo"><span>Nombre</span><input id="rf-nombre" v-model.trim="cliente.nombre" autocomplete="name" class="form-input" :class="e.nombre && 'fl-error'" @input="corregir('nombre')"><small v-if="e.nombre" class="fl-msg">{{ e.nombre }}</small></label>
      <label class="fl-campo"><span>Correo de tu empresa</span><input id="rf-correo" v-model.trim="cliente.correo" type="email" autocomplete="email" placeholder="tu@empresa.cl" class="form-input" :class="e.correo && 'fl-error'" @input="corregir('correo')"><small v-if="e.correo" class="fl-msg">{{ e.correo }}</small><em v-else class="text-sm not-italic text-neutral-500">Ahí te llega el link y la cotización.</em></label>
      <label class="fl-campo"><span>RUT de la empresa</span><input id="rf-rut" v-model="cliente.rut" placeholder="76.123.456-7" inputmode="text" autocomplete="off" required aria-required="true" class="form-input" :class="e.rut && 'fl-error'" @blur="cliente.rut = cliente.rut ? formatearRut(cliente.rut) : ''" @input="corregir('rut')"><small v-if="e.rut" class="fl-msg">{{ e.rut }}</small><em v-else class="text-sm not-italic text-neutral-500">La cotización formal sale a nombre de tu empresa. Persona con giro: tu RUT.</em></label>
      <label class="fl-campo"><span>Empresa <span class="font-normal text-neutral-500">(opcional)</span></span><input id="rf-empresa" v-model.trim="cliente.empresa" autocomplete="organization" class="form-input"></label>
      <label class="fl-campo"><span>Celular <span class="font-normal text-neutral-500">(opcional)</span></span><input id="rf-telefono" v-model="cliente.telefono" type="tel" autocomplete="tel" placeholder="9 1234 5678" class="form-input" :class="e.telefono && 'fl-error'" @input="corregir('telefono')"><small v-if="e.telefono" class="fl-msg">{{ e.telefono }}</small></label>
      <label class="fl-campo">
        <span>Comuna de tu bodega</span>
        <input id="rf-comuna" v-model.trim="cliente.comuna" list="rf-comunas" autocomplete="address-level2" placeholder="Escribe y elige, ej. Quilicura" class="form-input" :class="e.comuna && 'fl-error'" @input="corregir('comuna')" @change="corregir('comuna')">
        <datalist id="rf-comunas"><option v-for="c in COMUNAS" :key="c.comuna" :value="c.comuna">{{ c.region }}</option></datalist>
        <small v-if="e.comuna" class="fl-msg">{{ e.comuna }}</small><em v-else class="text-sm not-italic text-neutral-500">Para saber cómo validamos tus medidas.</em>
      </label>
    </div>

    <!-- Visita técnica solo como rescate: aparece si se atascó (2+ "No lo sé" clave o sin medidas) -->
    <div v-if="rescate && oferta" class="mt-5 rounded-xl bg-sky-50 p-4 text-sky-950 ring-1 ring-sky-200">
      <p class="font-semibold">{{ oferta.titulo }}</p>
      <p class="mt-1 text-sm">{{ oferta.texto }}</p>
      <label class="mt-3 flex items-start gap-2 text-sm font-medium">
        <input v-model="visita" type="checkbox" class="mt-0.5 h-5 w-5 flex-shrink-0 accent-brand-600">
        {{ oferta.tipo === 'visita' ? 'Sí, prefiero que midan ustedes' : 'Sí, prefiero validarlo con un ejecutivo' }}
      </label>
    </div>

    <label class="mt-5 flex items-start gap-2 text-sm text-neutral-600">
      <input id="rf-privacidad" v-model="privacidad" type="checkbox" class="mt-0.5 h-5 w-5 flex-shrink-0 accent-brand-600">
      <span>Acepto la <NuxtLink to="/politica-privacidad" class="font-medium text-brand-700 underline underline-offset-2">política de privacidad</NuxtLink> y el uso de mis datos para responder esta solicitud.</span>
    </label>
    <small v-if="e.privacidad" class="fl-msg mt-1 block">{{ e.privacidad }}</small>

    <button type="submit" class="fl-btn mt-6 w-full" :disabled="enviando">{{ enviando ? 'Enviando…' : textoBoton }}</button>
    <p v-if="error" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{{ error }}</p>
    <p class="mt-3 text-center text-sm text-neutral-500">No publicamos precios: tu ejecutivo te envía la cotización formal en máximo 24 horas.</p>
    <p class="mt-2 text-center text-xs text-neutral-500">{{ TEXTO_INGENIERIA }}</p>
  </form>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, watch } from 'vue';
import { validarCorreo, validarTelefono, formatearRut } from '~/lib/tour/reglas.js';
import { COMUNAS, NORMAS, TEXTO_INGENIERIA, buscarComuna, ofertaRescate, pideRescate, precision, rutFalla } from '~/lib/flujo/conversion.js';

type Cliente = { nombre: string; correo: string; comuna: string; rut: string; empresa: string; telefono: string };
const props = withDefaults(defineProps<{
  cliente: Cliente; estados: Record<string, string>; abandonoMedidas?: boolean;
  posiciones?: number; unidad?: string; ganas?: number; entregables?: string;
  titulo?: string; textoBoton?: string; enviando?: boolean; error?: string;
}>(), {
  abandonoMedidas: false, posiciones: 0, unidad: 'posiciones', ganas: 0, entregables: '',
  titulo: '¿A quién le enviamos tu cotización?', textoBoton: 'Recibir mi cotización en 24 h', enviando: false, error: '',
});
const emit = defineEmits<{ enviar: [datos: { visita: boolean }] }>();
const n = (v: number) => Math.round(v).toLocaleString('es-CL');
const pr = computed(() => precision(props.estados) as { sinVisita: boolean });
const rescate = computed(() => pideRescate(props.estados, { abandonoMedidas: props.abandonoMedidas }));
const oferta = computed(() => ofertaRescate(props.cliente.comuna) as { tipo: string; titulo: string; texto: string } | null);
const visita = ref(false);
const privacidad = ref(false);
watch(rescate, (v) => { if (!v) visita.value = false; });
// Si se atascó, la oferta queda marcada en el dataLayer una vez (para medir el rescate)
watch(() => !!(rescate.value && oferta.value), (v) => {
  if (!v) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'rescate_visible', event_category: 'Planifica tu bodega', tipo: oferta.value?.tipo });
}, { immediate: true });

const e = reactive<Record<string, string>>({});
// En el orden en que se ven (el foco va al primero que falta)
const CAMPOS = ['nombre', 'correo', 'rut', 'telefono', 'comuna', 'privacidad'] as const;
type Campo = typeof CAMPOS[number];
function fallo(c: Campo): string | null {
  const l = props.cliente;
  if (c === 'nombre') return l.nombre.length < 2 ? 'Escribe tu nombre.' : null;
  if (c === 'correo') { const r = validarCorreo(l.correo); return r.ok ? null : r.msg!; }
  if (c === 'comuna') return buscarComuna(l.comuna) ? null : 'Elige tu comuna de la lista (o "Otra comuna (fuera de la RM)").';
  if (c === 'rut') return rutFalla(l.rut);
  if (c === 'telefono') { if (!l.telefono.trim()) return null; const r = validarTelefono(l.telefono); return r.ok ? null : r.msg!; }
  return privacidad.value ? null : 'Acepta la política de privacidad para enviarte la cotización.';
}
function corregir(c: Campo) { if (e[c] && !fallo(c)) delete e[c]; }
watch(privacidad, () => corregir('privacidad'));

function enviar() {
  const primero = CAMPOS.find((c) => fallo(c));
  if (primero) {
    e[primero] = fallo(primero)!;
    // Centrado: con focus() solo, el campo podía quedar detrás de la cabecera fija de pasos
    const el = document.getElementById(`rf-${primero}`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el?.focus({ preventScroll: true });
    return;
  }
  const c = buscarComuna(props.cliente.comuna)!;
  props.cliente.comuna = c.comuna;
  props.cliente.rut = formatearRut(props.cliente.rut);
  if (props.cliente.telefono) props.cliente.telefono = validarTelefono(props.cliente.telefono).valor!;
  emit('enviar', { visita: rescate.value && visita.value });
}
</script>
