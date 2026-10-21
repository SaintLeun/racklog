<template>
  <div>
    <template v-if="!p.enviado">
      <h1 class="fl-titulo">Pide tu cotización</h1>
      <p class="fl-bajada">Nuestro equipo comercial revisa tu diseño y te envía la cotización en máximo 24 horas.</p>

      <div v-if="!resumen.viable" class="mt-5 rounded-2xl bg-red-50 p-5 text-red-900 ring-1 ring-red-200">
        <p class="font-semibold">Tu diseño tiene {{ resumen.bloquea }} {{ resumen.bloquea === 1 ? 'punto' : 'puntos' }} por resolver.</p>
        <button type="button" class="mt-2 font-semibold underline underline-offset-2" @click="emit('atras')">Volver a la revisión</button>
      </div>
      <div v-else class="mt-5 rounded-2xl bg-green-50 p-4 font-semibold text-green-900 ring-1 ring-green-200">Tu diseño es viable ✓</div>

      <div class="fl-card mt-5">
        <p class="fl-leyenda">Lo que vamos a cotizar</p>
        <div v-for="q in cotizar" :key="q.modelo" class="mt-3">
          <p class="font-semibold text-neutral-900">{{ q.nombre }} · {{ n(q.posiciones || q.bandejas) }} {{ q.posiciones ? 'posiciones' : 'bandejas' }}</p>
          <ul class="mt-1 list-disc space-y-0.5 pl-5 text-neutral-700"><li v-for="(l, i) in q.lineas" :key="i">{{ l }}</li></ul>
        </div>
        <p v-if="textoAcc" class="mt-4 border-t border-neutral-100 pt-3 text-neutral-700"><b>Accesorios:</b> {{ textoAcc }}</p>
        <p v-if="noSe.length" class="mt-3 text-sm text-neutral-500">Tu ejecutivo confirmará: {{ noSe.join(', ') }}.</p>
      </div>

      <FlujoAcciones
        :texto="preparando ? 'Preparando tu diseño…' : textoCta" :deshabilitado="!resumen.viable || !p.registrado"
        :motivo="!p.registrado ? 'Completa tus datos en el paso anterior.' : 'Resuelve los puntos en rojo para cotizar.'"
        @atras="emit('atras')" @siguiente="abrir"
      />
      <p v-if="cifra.n && resumen.viable && p.registrado" class="mt-2 text-right text-sm text-neutral-500">Te respondemos en máximo 24 horas.</p>

      <FlujoEntregables ref="entregables" @registrarse="emit('atras')" />
    </template>

    <!-- Enviado -->
    <section v-else class="fl-card text-center">
      <p class="text-5xl" aria-hidden="true">✓</p>
      <h1 class="fl-titulo mt-3">¡Listo, {{ primerNombre }}!</h1>
      <p class="mx-auto mt-2 max-w-md text-neutral-700">Recibimos tu diseño. Nuestro equipo comercial te envía la cotización en <b>máximo 24 horas</b>.</p>
      <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <a href="https://wa.me/56932403819" target="_blank" rel="noopener" class="fl-btn-sec" @click="marcar('whatsapp_click', { ubicacion: 'enviado' })">Escribir por WhatsApp</a>
        <button type="button" class="fl-btn-sec" @click="p.enviado = false">Ver mi diseño</button>
      </div>
    </section>
    <FlujoEntregables v-if="p.enviado" @registrarse="emit('atras')" />

    <ContactModal
      :is-visible="abierto"
      :encabezado="{ etiqueta: 'Respuesta en máximo 24 h', titulo: 'Recibe tu cotización en máximo 24 horas', texto: 'Revisamos tu diseño y te enviamos la cotización en máximo 24 horas.' }"
      :quote-item="item"
      :prefill="{ name: p.lead.nombre, phone: p.lead.telefono, email: p.lead.correo, company: p.lead.empresa, rut: p.lead.rut }"
      :config-extra="extra"
      :initial-files="adjuntos"
      @close="abierto = false"
      @sent="enviado"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useProyecto } from '~/stores/proyecto';
import { area, contorno, formatoM, PERFILES } from '~/lib/rack3d/planificador.js';
import { GRUAS } from '~/lib/rack3d/parametrosTecnicos.js';
import { revisarDiseno, resumenViabilidad } from '~/lib/rack3d/viabilidad.js';
import { proponerAccesorios, aplicarAjustes, textoAccesorios } from '~/lib/rack3d/accesorios.js';
import { puntajeLead } from '~/lib/rack3d/operacion.js';
import { queCotizar } from '~/lib/flujo/calculos.js';
import { cifraPrincipal, porConfirmar } from '~/lib/flujo/exportar.js';
import type { QuoteItem } from '~/components/QuoteModal/ProductConfig';

const emit = defineEmits<{ atras: [] }>();
const p = useProyecto();
const abierto = ref(false);
const n = (v: number) => Math.round(v).toLocaleString('es-CL');
const primerNombre = computed(() => p.lead.nombre.split(' ')[0] || '');

const avisos = computed(() => revisarDiseno({ bodega: p.bodega, racks: p.racks, pallets: p.pallets, accesorios: p.accesorios }) as any[]);
const resumen = computed(() => resumenViabilidad(avisos.value) as { viable: boolean; bloquea: number; advierte: number });
const cotizar = computed(() => queCotizar(p.modelos, p.racks) as any[]);
// CTA con sus numeros: "Cotizar mis 312 posiciones" (solo racks nuevos)
const cifra = computed(() => cifraPrincipal(p.racks) as { n: number; unidad: string });
const textoCta = computed(() => (cifra.value.n ? `Cotizar mis ${n(cifra.value.n)} ${cifra.value.unidad}` : 'Recibir mi cotización en máximo 24 h'));
const textoAcc = computed(() => textoAccesorios(aplicarAjustes(proponerAccesorios({ bodega: p.bodega, racks: p.racks, pallets: p.pallets }), p.accesorios)) as string);
// Datos que el cliente dejo en "No sé" (en palabras simples)
const noSe = computed(() => porConfirmar(p) as string[]);

const item = computed<QuoteItem>(() => {
  const config: Record<string, string | number> = {
    'Origen': 'Planifica tu bodega (landing)',
    'Rol': PERFILES.find((x) => x.v === p.lead.perfil)?.t ?? p.lead.perfil,
    'Industria': p.lead.industria,
    'Equipo': (GRUAS as any)[p.bodega.grua]?.nombre ?? p.bodega.grua,
    'Bodega': `${formatoM(p.bodega.ancho)} × ${formatoM(p.bodega.largo)} m${p.bodega.altura ? ` · ${formatoM(p.bodega.altura)} m de altura libre` : ''}`,
  };
  cotizar.value.forEach((q) => { config[q.nombre] = q.lineas.join(' · '); });
  if (textoAcc.value) config['Accesorios'] = textoAcc.value;
  p.pallets.forEach((t) => { config[`Pallet ${t.nombre}`] = `${t.cantidad} u · ${formatoM(t.alto)} m · ${t.peso} kg · ${t.frente}×${t.fondo} m`; });
  p.cajas.forEach((c) => { config[`Caja ${c.nombre}`] = `${c.cantidad} u · ${Math.round(c.largo * 100)}×${Math.round(c.ancho * 100)}×${Math.round(c.alto * 100)} cm · ${c.peso} kg`; });
  config['Viabilidad'] = resumen.value.viable ? `Viable${resumen.value.advierte ? ` (${resumen.value.advierte} sugerencias)` : ''}` : 'Con puntos por resolver';
  if (noSe.value.length) config['Confirmar con el cliente'] = noSe.value.join(', ');
  const flags = p.flags.filter((f) => !f.startsWith('no_se:'));
  if (flags.length) config['Flags'] = flags.join(', ');
  if (Object.keys(p.utm).length) config['Campaña'] = Object.entries(p.utm).map(([k, v]) => `${k}=${v}`).join(' · ');
  config['Etiqueta'] = 'tour-logistico';
  return {
    name: 'Diseño de bodega (Planifica tu bodega)',
    config,
    analytics: {
      lead_origin: 'planifica-tu-bodega',
      sistemas: [...new Set(p.racks.map((r) => r.tipo))].join(','),
      m2: Math.round(area(contorno(p.bodega))),
      posiciones: cotizar.value.reduce((t, q) => t + q.posiciones, 0),
      rol: p.lead.perfil, industria: p.lead.industria,
      minutos: Math.round((Date.now() - p.inicio) / 60000),
      ...p.utm,
    },
  };
});
// Puntaje del lead con la fecha y telefono del formulario (igual que el planificador)
function extra({ plazo, telefono }: { plazo: string; telefono: string }) {
  const pesoPallet = Math.max(0, ...p.pallets.map((t) => t.peso || 0));
  return { 'Puntaje del lead': `${puntajeLead({ racks: p.racks, bodega: { ...p.bodega, pesoPallet }, perfil: p.lead.perfil, plazo, telefono })}/100` };
}
// El plano (PNG) y el PDF del diseño van adjuntos a la cotizacion; si tardan o fallan, el formulario
// se abre igual (maximo ~9 s esperando)
const entregables = ref<{ archivos: () => Promise<File[]> } | null>(null);
const adjuntos = ref<File[]>([]);
const preparando = ref(false);
async function abrir() {
  if (preparando.value) return;
  preparando.value = true;
  try {
    adjuntos.value = await Promise.race([
      entregables.value?.archivos() ?? Promise.resolve([]),
      new Promise<File[]>((ok) => setTimeout(() => ok([]), 9000)),
    ]);
  } catch {
    adjuntos.value = [];
  } finally {
    preparando.value = false;
  }
  abierto.value = true;
  marcar('quote_open', {});
}
function enviado() {
  p.enviado = true;
  abierto.value = false;
  marcar('quote_sent', { rol: p.lead.perfil, minutos: Math.round((Date.now() - p.inicio) / 60000), ...p.utm });
}
function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>
