<template>
  <div>
    <template v-if="!p.enviado">
      <h1 class="fl-titulo">Pide tu cotización</h1>
      <p class="fl-bajada">{{ MENSAJE_INICIO }}</p>

      <div v-if="!resumen.viable" class="mt-5 rounded-2xl bg-red-50 p-5 text-red-900 ring-1 ring-red-200">
        <p class="font-semibold">Tu diseño tiene {{ resumen.bloquea }} {{ resumen.bloquea === 1 ? 'punto' : 'puntos' }} por resolver.</p>
        <p class="mt-1 text-sm">Puedes resolverlos tú o pedir la cotización igual: tu ejecutivo los revisa contigo. Nadie se queda atascado.</p>
        <button type="button" class="mt-2 font-semibold underline underline-offset-2" @click="emit('atras')">Volver a la revisión</button>
      </div>
      <div v-else class="mt-5 rounded-2xl bg-green-50 p-4 text-green-900 ring-1 ring-green-200">
        <p class="font-semibold">Tu diseño es viable ✓</p>
        <p class="mt-0.5 text-sm">{{ TEXTO_INGENIERIA }}</p>
      </div>

      <div class="fl-card mt-5">
        <p class="fl-leyenda">Lo que vamos a cotizar</p>
        <div v-for="q in cotizar" :key="q.modelo" class="mt-3">
          <p class="font-semibold text-neutral-900">{{ q.nombre }} · {{ n(q.posiciones || q.bandejas) }} {{ q.posiciones ? 'posiciones' : 'bandejas' }}</p>
          <ul class="mt-1 list-disc space-y-0.5 pl-5 text-neutral-700"><li v-for="(l, i) in q.lineas" :key="i">{{ l }}</li></ul>
        </div>
        <p v-if="textoAcc" class="mt-4 border-t border-neutral-100 pt-3 text-neutral-700"><b>Accesorios:</b> {{ textoAcc }}</p>
        <p v-if="noSe.length" class="mt-3 text-sm text-neutral-500">Tu ejecutivo confirmará: {{ noSe.join(', ') }}.</p>
      </div>

      <!-- Registro al final: a cambio del PDF, el link "continúa tu diseño" y la cotización en 24 h -->
      <FlujoRegistroFinal
        class="mt-5"
        :cliente="p.lead" :estados="estados" :abandono-medidas="p.abandonoMedidas"
        :posiciones="cifra.n" :unidad="cifra.unidad" :ganas="ganas"
        entregables="El PDF de tu diseño (con resumen ejecutivo para gerencia) y el link para seguir editándolo"
        :texto-boton="preparando ? 'Preparando tu diseño…' : textoCta" :enviando="preparando" :error="errorEnvio"
        @enviar="enviar"
      />
      <div class="mt-6"><button type="button" class="fl-btn-sec" @click="emit('atras')">Atrás</button></div>

      <FlujoEntregables ref="entregables" solo-plano />
    </template>

    <!-- Enviado: el premio (PDF, link y cotización en 24 h) -->
    <section v-else class="fl-card text-center">
      <p class="text-5xl" aria-hidden="true">✓</p>
      <h1 class="fl-titulo mt-3">¡Listo, {{ primerNombre }}!</h1>
      <p class="mx-auto mt-2 max-w-md text-neutral-700">Recibimos tu diseño. Tu ejecutivo te envía la cotización formal en <b>máximo 24 horas</b>: fabricación, montaje e ingeniería.</p>
      <p v-if="visitaPedida" class="mx-auto mt-2 max-w-md text-sm text-neutral-600">Tu ejecutivo te contacta para coordinar {{ visitaPedida === 'visita' ? 'la visita técnica' : 'la validación de tus medidas' }}.</p>
      <p class="mx-auto mt-2 max-w-md text-sm text-neutral-600">{{ correoLink === 'ok' ? `Te enviamos el link para seguir tu diseño a ${p.lead.correo}.` : correoLink === 'error' ? 'No pudimos enviarte el link por correo: cópialo abajo.' : '' }}</p>
      <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" class="fl-btn" :disabled="armandoPdf" @click="pdf">{{ armandoPdf ? 'Armando tu PDF…' : 'Descargar PDF de mi diseño' }}</button>
        <a href="https://wa.me/56932403819" target="_blank" rel="noopener" class="fl-btn-sec" @click="marcar('whatsapp_click', { ubicacion: 'enviado' })">Escribir por WhatsApp</a>
        <button type="button" class="fl-btn-sec" @click="p.enviado = false">Ver mi diseño</button>
      </div>
      <p v-if="errorPdf" class="mt-3 text-sm text-red-700" role="alert">{{ errorPdf }}</p>
      <p class="mx-auto mt-4 max-w-md text-xs text-neutral-500">{{ TEXTO_INGENIERIA }}</p>
    </section>
    <FlujoEntregables v-if="p.enviado" ref="entregablesEnviado" />
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
import { cifraPrincipal, porConfirmar, resumenDiseño, descargar, nombreArchivo, logoCliente } from '~/lib/flujo/exportar.js';
import { vistasPorRol } from '~/lib/flujo/perfiles.js';
import { capturaGuardada } from '~/lib/flujo/captura.js';
import { enlaceDiseño } from '~/lib/flujo/enlace.js';
import { validarRut } from '~/lib/tour/reglas.js';
import { MENSAJE_INICIO, TEXTO_INGENIERIA, configConversion, estadosDiseño, payloadLead, enviarLead, ofertaRescate } from '~/lib/flujo/conversion.js';

const emit = defineEmits<{ atras: [] }>();
const p = useProyecto();
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
const estados = computed(() => estadosDiseño(p));
// Posiciones que gana sobre las de hoy (si las dijo)
const ganas = computed(() => { const g = (vistasPorRol(p) as any).gerencia; return g.hoy && g.mas > 0 ? g.mas : 0; });

function producto(visita: boolean) {
  const config: Record<string, string | number> = {
    // Primero, para que nunca quede fuera del límite de pares del servidor
    ...(p.prueba ? { 'Prueba': 'sí' } : {}),
    'Origen': 'Planifica tu bodega (landing)',
    ...configConversion({ via: 'diseno', comuna: p.lead.comuna, estados: estados.value, porConfirmar: noSe.value, visita }),
    ...(p.lead.perfil ? { 'Rol': PERFILES.find((x) => x.v === p.lead.perfil)?.t ?? p.lead.perfil } : {}),
    ...(p.lead.industria ? { 'Industria': p.lead.industria } : {}),
    'Equipo': (GRUAS as any)[p.bodega.grua]?.nombre ?? p.bodega.grua,
    'Bodega': `${formatoM(p.bodega.ancho)} × ${formatoM(p.bodega.largo)} m${p.bodega.altura ? ` · ${formatoM(p.bodega.altura)} m de altura libre` : ''}`,
  };
  cotizar.value.forEach((q) => { config[q.nombre] = q.lineas.join(' · '); });
  if (textoAcc.value) config['Accesorios'] = textoAcc.value;
  p.pallets.forEach((t) => { config[`Pallet ${t.nombre}`] = `${t.cantidad} u · ${formatoM(t.alto)} m · ${t.peso} kg · ${t.frente}×${t.fondo} m`; });
  p.cajas.forEach((c) => { config[`Caja ${c.nombre}`] = `${c.cantidad} u · ${Math.round(c.largo * 100)}×${Math.round(c.ancho * 100)}×${Math.round(c.alto * 100)} cm · ${c.peso} kg`; });
  config['Viabilidad'] = resumen.value.viable ? `Viable${resumen.value.advierte ? ` (${resumen.value.advierte} sugerencias)` : ''}` : 'Con puntos por resolver';
  const flags = p.flags.filter((f) => !f.startsWith('no_se:'));
  if (flags.length) config['Flags'] = flags.join(', ');
  if (Object.keys(p.utm).length) config['Campaña'] = Object.entries(p.utm).map(([k, v]) => `${k}=${v}`).join(' · ');
  // Puntaje del lead (igual que el planificador)
  const pesoPallet = Math.max(0, ...p.pallets.map((t) => t.peso || 0));
  config['Puntaje del lead'] = `${puntajeLead({ racks: p.racks, bodega: { ...p.bodega, pesoPallet }, perfil: p.lead.perfil, plazo: '', telefono: p.lead.telefono })}/100`;
  config['Etiqueta'] = 'tour-logistico';
  return { name: 'Diseño de bodega (Planifica tu bodega)', config: config as Record<string, string> };
}

// El plano (PNG) va adjunto para el ejecutivo; si tarda o falla, el lead se envía igual (máximo ~9 s)
const entregables = ref<{ archivos: () => Promise<File[]>; plano: () => Promise<string | null> } | null>(null);
const entregablesEnviado = ref<{ plano: () => Promise<string | null> } | null>(null);
const preparando = ref(false);
const errorEnvio = ref('');
const visitaPedida = ref<'' | 'visita' | 'remota'>('');
const correoLink = ref<'' | 'ok' | 'error'>('');
const ERRORES: Record<string, string> = {
  rate_limit: 'Recibimos muchas solicitudes desde tu conexión. Espera un minuto e inténtalo de nuevo.',
  too_large: 'El plano es muy pesado. Inténtalo de nuevo o escríbenos por WhatsApp.',
};
async function enviar({ visita }: { visita: boolean }) {
  if (preparando.value) return;
  preparando.value = true;
  errorEnvio.value = '';
  try {
    const archivos = await Promise.race([
      entregables.value?.archivos() ?? Promise.resolve([]),
      new Promise<File[]>((ok) => setTimeout(() => ok([]), 9000)),
    ]).catch(() => [] as File[]);
    const l = p.lead;
    const rut = l.rut ? validarRut(l.rut) : null;
    p.flags = [...new Set([...p.flags.filter((f) => f !== 'persona_natural_con_giro'), ...(rut?.ok && rut.personaNatural ? ['persona_natural_con_giro'] : [])])];
    const item = producto(visita);
    const r = await enviarLead(payloadLead({ nombre: l.nombre, correo: l.correo, empresa: l.empresa, rut: l.rut, telefono: l.telefono }, item), archivos);
    if (!r.ok) {
      errorEnvio.value = ERRORES[r.error ?? ''] ?? 'No pudimos enviar tu diseño. Inténtalo de nuevo o escríbenos por WhatsApp al +56 9 3240 3819.';
      marcar('quote_error', { error: r.error });
      return;
    }
    p.registrado = true;
    p.enviado = true;
    window.scrollTo({ top: 0 });
    visitaPedida.value = visita ? (ofertaRescate(l.comuna)?.tipo ?? '') as '' | 'visita' | 'remota' : '';
    // Conversión para GTM (GA4 y Google Ads): un lead, no una compra
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'generate_lead', event_category: 'Conversion', event_label: 'Quote Form Sent', funnel_step: 'quote_form_sent', lead_type: 'quote',
      product: item.name, lead_origin: 'planifica-tu-bodega', via: 'diseno', lead_reference: r.referencia, currency: 'CLP', value: 0,
      sistemas: [...new Set(p.racks.map((x) => x.tipo))].join(','), m2: Math.round(area(contorno(p.bodega))), posiciones: cifra.value.n, ...p.utm,
    });
    marcar('registro_ok', { via: 'diseno', comuna: l.comuna });
    marcar('quote_sent', { via: 'diseno', visita, minutos: Math.round((Date.now() - p.inicio) / 60000), ...p.utm });
    enviarLinkPorCorreo();
  } finally {
    preparando.value = false;
  }
}
// El link "continúa tu diseño" llega por correo (mismo servicio que "Guardar y seguir después")
async function enviarLinkPorCorreo() {
  try {
    const link = await enlaceDiseño(p.$state);
    const r = await fetch('https://api.racklog.cl/api/continuar-diseno', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: p.lead.correo, nombre: p.lead.nombre, link }),
    });
    correoLink.value = r.ok ? 'ok' : 'error';
  } catch {
    correoLink.value = 'error';
  }
}
// PDF con página ejecutiva, vista 3D (la de Revisa) y plano técnico
const armandoPdf = ref(false);
const errorPdf = ref('');
async function pdf() {
  if (armandoPdf.value) return;
  armandoPdf.value = true;
  errorPdf.value = '';
  try {
    const { crearPdfDiseno } = await import('~/lib/rack3d/pdfPlano.js');
    const plano = await (entregablesEnviado.value?.plano() ?? Promise.resolve(null)).catch(() => null);
    const blob = await crearPdfDiseno({ ...resumenDiseño(p), plano, vista3d: capturaGuardada(p), logoCliente: logoCliente() } as any);
    descargar(blob, `diseno-bodega-${nombreArchivo(p.lead.empresa || p.lead.nombre)}.pdf`);
    marcar('pdf_descarga', { posiciones: cifra.value.n });
  } catch {
    errorPdf.value = 'No pudimos armar el PDF. Inténtalo de nuevo.';
  } finally {
    armandoPdf.value = false;
  }
}
function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>
