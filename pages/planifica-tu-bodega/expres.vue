<template>
  <!-- Vía exprés (prompt de conversión §B): "lo diseñamos nosotros". 4 preguntas, foto o plano opcional y
       registro al final → cotización formal en máximo 24 h. Mismo circuito de Kommo, etiqueta via-expres -->
  <div class="fl min-h-screen bg-neutral-50 pb-24">
    <p v-if="prueba" class="bg-amber-400 px-4 py-1.5 text-center text-sm font-semibold text-amber-950" role="status">Modo prueba: el lead llega a Kommo con la etiqueta PRUEBA, sin vendedor ni tarea de 24 h.</p>
    <div class="sticky top-16 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div class="container-page flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <p class="text-sm font-semibold text-neutral-900">{{ paso < 4 ? `Pregunta ${paso + 1} de 4` : paso === 4 ? 'Foto o plano (opcional)' : enviado ? 'Listo' : 'Tus datos' }}</p>
        <span class="h-1.5 min-w-[6rem] flex-1 overflow-hidden rounded-full bg-neutral-100" aria-hidden="true"><span class="block h-full rounded-full bg-brand-600 transition-all duration-300" :style="{ width: `${Math.min(100, ((paso + 1) / 6) * 100)}%` }" /></span>
        <ClientOnly><FlujoPrecision v-if="paso > 0 && !enviado" compacto class="w-full sm:w-auto" :estados="estados" /></ClientOnly>
      </div>
    </div>

    <main class="container-page max-w-2xl pt-5">
      <ClientOnly>
        <Transition name="fl-paso" mode="out-in">
          <!-- 1. Qué guardas -->
          <section v-if="paso === 0" key="guarda">
            <p class="text-sm font-semibold uppercase tracking-wider text-brand-700">Lo diseñamos nosotros · 2 minutos</p>
            <h1 class="fl-titulo mt-1">¿Qué guardas en tu bodega?</h1>
            <p class="fl-bajada">{{ MENSAJE_INICIO }}</p>
            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              <button v-for="o in GUARDA" :key="o.v" type="button" :class="['fl-opcion !p-0 overflow-hidden', e.guarda === o.v && 'fl-opcion--sel']" :aria-pressed="e.guarda === o.v" @click="e.guarda = o.v; siguiente()">
                <img :src="o.img" alt="" width="400" height="300" class="aspect-[4/3] w-full bg-neutral-100 object-cover" loading="lazy">
                <span class="block px-4 pb-4 pt-3"><span class="block font-semibold text-neutral-900">{{ o.t }}</span><span class="mt-1 block text-sm text-neutral-600">{{ o.d }}</span></span>
              </button>
            </div>
            <p class="mt-3 text-sm text-neutral-500">{{ PORQUE.guarda }}</p>
            <p class="mt-6 text-sm text-neutral-600">¿Prefieres diseñarlo tú? <NuxtLink to="/planifica-tu-bodega/disena" class="font-medium text-brand-700 underline underline-offset-2" @click="marcar('cta_click', { ubicacion: 'expres', via: 'diseno' })">Diseña tu bodega paso a paso (10 min)</NuxtLink></p>
          </section>

          <!-- 2. Cuántos (y el peso, si son pallets) -->
          <section v-else-if="paso === 1" key="cantidad">
            <h1 class="fl-titulo">¿Cuántos {{ unidad }} guardas?</h1>
            <p class="fl-bajada">{{ PORQUE.cantidad }}</p>
            <label class="fl-campo mt-5 max-w-xs">
              <span>{{ unidad[0].toUpperCase() + unidad.slice(1) }} a guardar</span>
              <input id="ex-cantidad" v-model.number="e.cantidad" type="number" min="1" inputmode="numeric" class="form-input" @input="e.cantidadNoSe = false">
            </label>
            <div class="mt-2 flex flex-wrap gap-2">
              <button v-for="c in RAPIDOS[e.guarda]" :key="c" type="button" :class="['fl-chip !w-auto !min-h-9 !px-3 !text-sm', e.cantidad === c && e.cantidadNoSe && 'fl-chip--sel']" @click="e.cantidad = c; e.cantidadNoSe = true">≈ {{ n(c) }}</button>
            </div>
            <p v-if="e.cantidadNoSe" class="mt-1.5 text-sm text-amber-800">{{ ESTIMADO }}. {{ PIERDE }}</p>

            <fieldset v-if="e.guarda === 'pallets'" class="mt-7">
              <legend class="fl-pregunta">¿Cuánto pesa un pallet cargado?</legend>
              <p class="text-sm text-neutral-600">{{ PORQUE.peso }}</p>
              <div class="mt-3 flex items-end gap-2">
                <label class="fl-campo w-40"><span class="sr-only">Peso en kg</span><span class="relative"><input id="ex-peso" v-model.number="pesoExacto" type="number" min="50" max="3000" inputmode="numeric" placeholder="ej. 800" class="form-input w-full pr-10" @input="e.pesoNoSe = false; e.peso = pesoExacto || null"><i class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm not-italic text-neutral-400">kg</i></span></label>
                <button type="button" :class="['fl-nose', e.pesoNoSe && 'fl-nose--sel']" @click="pesoNoSe">No lo sé</button>
              </div>
              <div v-if="e.pesoNoSe" class="mt-3">
                <p class="text-sm text-neutral-700">Elige el más parecido:</p>
                <div class="mt-2 grid grid-cols-3 gap-2">
                  <button v-for="o in PESOS_TIPICOS" :key="o.v" type="button" :class="['fl-chip !flex-col !gap-0 leading-tight', e.peso === o.kg && 'fl-chip--sel']" @click="e.peso = o.kg">{{ o.t }}<span class="text-xs font-normal text-neutral-500">~{{ n(o.kg) }} kg</span></button>
                </div>
                <p class="mt-1.5 text-sm text-amber-800">{{ ESTIMADO }}. {{ PIERDE }}</p>
              </div>
            </fieldset>
            <FlujoAcciones :deshabilitado="!(e.cantidad > 0) || (e.guarda === 'pallets' && !e.peso)" :motivo="!(e.cantidad > 0) ? `Dinos cuántos ${unidad} (aproximado sirve).` : 'Dinos el peso o toca “No lo sé”.'" @atras="atras" @siguiente="siguiente" />
          </section>

          <!-- 3. Medidas de la bodega y altura -->
          <section v-else-if="paso === 2" key="medidas">
            <h1 class="fl-titulo">¿Cuánto mide tu bodega?</h1>
            <p class="fl-bajada">{{ PORQUE.medidas }}</p>
            <div class="mt-5 grid max-w-md grid-cols-2 gap-3">
              <label class="fl-campo"><span>Ancho (m)</span><input id="ex-ancho" v-model.number="e.ancho" type="number" min="2" max="300" step="0.5" inputmode="decimal" class="form-input"></label>
              <label class="fl-campo"><span>Largo (m)</span><input id="ex-largo" v-model.number="e.largo" type="number" min="2" max="300" step="0.5" inputmode="decimal" class="form-input"></label>
            </div>
            <label class="mt-3 flex items-center gap-2 text-sm font-medium text-neutral-800">
              <input v-model="e.medidasAprox" type="checkbox" class="h-5 w-5 accent-brand-600"> No las tengo exactas: son aproximadas (±{{ TOLERANCIA_MEDIDAS }} m)
            </label>
            <p v-if="e.medidasAprox" class="mt-1 text-sm text-amber-800">{{ ESTIMADO }}. {{ PIERDE }}</p>

            <fieldset class="mt-7">
              <legend class="fl-pregunta">¿Qué altura libre tiene? <span class="font-normal text-neutral-500">(hasta la viga o luminaria más baja)</span></legend>
              <p class="text-sm text-neutral-600">{{ PORQUE.altura }}</p>
              <div class="mt-3 flex items-end gap-2">
                <label class="fl-campo w-40"><span class="sr-only">Altura en m</span><span class="relative"><input id="ex-altura" v-model.number="alturaExacta" type="number" min="2.5" max="40" step="0.1" inputmode="decimal" placeholder="ej. 7,5" class="form-input w-full pr-8" @input="e.alturaNoSe = false; e.altura = alturaExacta || null"><i class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm not-italic text-neutral-400">m</i></span></label>
                <button type="button" :class="['fl-nose', e.alturaNoSe && 'fl-nose--sel']" @click="alturaNoSe">No lo sé</button>
              </div>
              <div v-if="e.alturaNoSe" class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button v-for="a in ALTURAS_TIPICAS" :key="a.m" type="button" :class="['fl-chip !flex-col !gap-0 leading-tight', e.altura === a.m && 'fl-chip--sel']" @click="e.altura = a.m">{{ a.t }} · {{ fm(a.m) }} m<span class="text-xs font-normal text-neutral-500">{{ a.d }}</span></button>
              </div>
              <p v-if="e.alturaNoSe" class="mt-1.5 text-sm text-amber-800">{{ ESTIMADO }}. {{ PIERDE }}</p>
            </fieldset>
            <FlujoAcciones :deshabilitado="!medidasOk || !e.altura" :motivo="!medidasOk ? 'Pon el ancho y el largo (aproximado sirve).' : 'Pon la altura o toca “No lo sé”.'" @atras="atras" @siguiente="siguiente" />
            <button type="button" class="mt-3 text-sm font-medium text-neutral-600 underline underline-offset-2" @click="sinMedidas">No tengo las medidas</button>
          </section>

          <!-- 4. Equipo, por foto -->
          <section v-else-if="paso === 3" key="grua">
            <h1 class="fl-titulo">¿Con qué equipo mueves los pallets?</h1>
            <p class="fl-bajada">{{ PORQUE.grua }} Toca el que se parece al tuyo.</p>
            <FlujoFotoEquipo class="mt-5" :valor="e.grua" :no-se="e.gruaNoSe" @elegir="(v, noSe) => { e.grua = v; e.gruaNoSe = noSe; }" />
            <FlujoAcciones :deshabilitado="!e.grua" motivo="Toca tu equipo o “No lo sé”." @atras="atras" @siguiente="siguiente" />
          </section>

          <!-- 5. Foto o plano (opcional) -->
          <section v-else-if="paso === 4" key="archivo">
            <h1 class="fl-titulo">¿Tienes una foto o un plano de tu bodega?</h1>
            <p class="fl-bajada">{{ PORQUE.archivo }} Es opcional.</p>
            <label class="fl-agregar mt-5 flex cursor-pointer items-center justify-center !min-h-24 text-center focus-within:ring-2 focus-within:ring-brand-600">
              <span>{{ archivos.length ? 'Agregar otra' : 'Subir foto o plano' }}<span class="block text-sm font-normal text-neutral-500">JPG, PNG o PDF · hasta {{ MAX_ARCHIVOS }}</span></span>
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple class="sr-only" :disabled="archivos.length >= MAX_ARCHIVOS" @change="agregarArchivos">
            </label>
            <ul v-if="archivos.length" class="mt-3 space-y-2">
              <li v-for="(a, i) in archivos" :key="a.name + i" class="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-neutral-200">
                <span class="min-w-0 truncate">{{ a.name }} <span class="text-neutral-500">· {{ Math.ceil(a.size / 1024) }} KB</span></span>
                <button type="button" class="fl-quitar" @click="archivos.splice(i, 1)">Quitar</button>
              </li>
            </ul>
            <p v-if="avisoArchivo" class="mt-2 text-sm text-red-700" role="alert">{{ avisoArchivo }}</p>
            <FlujoAcciones :texto="archivos.length ? 'Siguiente' : 'Seguir sin archivo'" @atras="atras" @siguiente="siguiente" />
          </section>

          <!-- 6. Registro y envío -->
          <section v-else-if="!enviado" key="registro">
            <h1 class="fl-titulo">Tu cotización, en máximo 24 horas</h1>
            <p class="fl-bajada">Con tus respuestas, un ejecutivo diseña tu bodega y te envía la cotización formal.</p>
            <div class="fl-card mt-5 text-sm text-neutral-700">
              <p class="fl-leyenda">Tus respuestas</p>
              <ul class="mt-2 space-y-1">
                <li v-for="r in resumen" :key="r.t" class="flex justify-between gap-3"><span class="text-neutral-500">{{ r.t }}</span><span class="text-right font-medium text-neutral-900">{{ r.v }}<span v-if="r.est" class="ml-1 text-xs font-normal text-amber-800">(estimado)</span></span></li>
              </ul>
              <button type="button" class="mt-2 text-sm font-medium text-brand-700 underline underline-offset-2" @click="paso = 0">Cambiar mis respuestas</button>
            </div>
            <!-- Al final: sumar otras estanterías a la misma cotización (dueño 27-10) -->
            <fieldset class="fl-card mt-5">
              <legend class="fl-leyenda">¿Te cotizamos también otra estantería? <span class="font-normal normal-case text-neutral-500">(opcional)</span></legend>
              <div class="mt-3 grid gap-2 sm:grid-cols-3">
                <button v-for="o in OTRAS" :key="o.v" type="button" :class="['fl-opcion !p-0 overflow-hidden text-left', tambien.includes(o.v) && 'fl-opcion--sel']" :aria-pressed="tambien.includes(o.v)" @click="alternarTambien(o.v)">
                  <img :src="o.img" alt="" width="240" height="120" class="aspect-[2/1] w-full bg-neutral-100 object-cover" loading="lazy">
                  <span class="block px-3 pb-3 pt-2"><span class="block text-sm font-semibold text-neutral-900">{{ tambien.includes(o.v) ? '✓ ' : '+ ' }}{{ o.t }}</span><span class="block text-xs text-neutral-600">{{ o.d }}</span></span>
                </button>
              </div>
            </fieldset>
            <FlujoRegistroFinal
              class="mt-5" :cliente="cliente" :estados="estados" :abandono-medidas="abandonoMedidas"
              :enviando="enviando" :error="error" @enviar="enviar"
            />
            <div class="mt-6"><button type="button" class="fl-btn-sec" @click="atras">Atrás</button></div>
          </section>

          <!-- Listo -->
          <section v-else key="listo" class="fl-card text-center">
            <p class="text-5xl" aria-hidden="true">✓</p>
            <h1 class="fl-titulo mt-3">¡Listo, {{ cliente.nombre.split(' ')[0] }}!</h1>
            <p class="mx-auto mt-2 max-w-md text-neutral-700">Recibimos tus datos. Tu ejecutivo te envía la <b>cotización formal en máximo 24 horas</b>: fabricación, montaje e ingeniería.</p>
            <p v-if="visitaPedida" class="mx-auto mt-2 max-w-md text-sm text-neutral-600">Tu ejecutivo te contacta para coordinar {{ visitaPedida === 'visita' ? 'la visita técnica' : 'la validación de tus medidas' }}.</p>
            <p class="mx-auto mt-4 max-w-md text-xs text-neutral-500">{{ TEXTO_INGENIERIA }}</p>
            <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="https://wa.me/56932403819" target="_blank" rel="noopener" class="fl-btn-sec" @click="marcar('whatsapp_click', { ubicacion: 'expres_enviado' })">Escribir por WhatsApp</a>
              <NuxtLink to="/planifica-tu-bodega/disena" class="fl-btn-sec">Diseñarla yo mismo en 3D</NuxtLink>
            </div>
          </section>
        </Transition>
        <template #fallback>
          <div class="fl-esq-cascada" role="status" aria-label="Cargando">
            <div class="fl-esq h-8 w-2/3 max-w-md" /><div class="fl-esq mt-3 h-4 w-full max-w-xl" />
            <div class="mt-6 grid gap-3 sm:grid-cols-2"><div class="fl-esq h-48" /><div class="fl-esq h-48" /></div>
          </div>
        </template>
      </ClientOnly>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { GRUAS } from '~/lib/rack3d/parametrosTecnicos.js';
import { formatoM, TIPOS } from '~/lib/rack3d/planificador.js';
import {
  MENSAJE_INICIO, PORQUE, PIERDE, ESTIMADO, PESOS_TIPICOS, ALTURAS_TIPICAS, TOLERANCIA_MEDIDAS, TEXTO_INGENIERIA,
  estadosExpres, leadExpres, payloadLead, enviarLead, ofertaRescate,
} from '~/lib/flujo/conversion.js';

definePageMeta({ layout: 'landing' });
usePageSeo({
  title: 'Cotiza tu bodega en 2 minutos',
  description: 'Responde 4 preguntas sobre tu bodega y recibe una cotización formal de racks en máximo 24 horas. Sin visitas.',
});
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const n = (v: number) => Math.round(v).toLocaleString('es-CL');
const fm = (v: number) => formatoM(v);
const GUARDA = [
  { v: 'pallets', t: 'Pallets', d: 'Los mueves con grúa o apilador. Rack selectivo o drive-in.', img: '/assets/images/rack_selectivo.webp' },
  { v: 'cajas', t: 'Cajas o bultos', d: 'Los mueves a mano. Estantería de ángulo ranurado.', img: '/assets/images/anra_body.webp' },
] as const;
const RAPIDOS: Record<string, number[]> = { pallets: [50, 100, 300, 1000], cajas: [200, 500, 1000, 3000] };

type Expres = {
  guarda: 'pallets' | 'cajas' | ''; cantidad: number; cantidadNoSe: boolean; peso: number | null; pesoNoSe: boolean;
  ancho: number | null; largo: number | null; medidasAprox: boolean; altura: number | null; alturaNoSe: boolean;
  grua: string | null; gruaNoSe: boolean;
};
const e = reactive<Expres>({
  guarda: '', cantidad: 0, cantidadNoSe: false, peso: null, pesoNoSe: false,
  ancho: null, largo: null, medidasAprox: false, altura: null, alturaNoSe: false, grua: null, gruaNoSe: false,
});
const pesoExacto = ref<number | null>(null);
const alturaExacta = ref<number | null>(null);
const cliente = reactive({ nombre: '', correo: '', comuna: '', rut: '', empresa: '', telefono: '' });
const paso = ref(0);
// Otras estanterías que pide cotizar junto con lo principal (van al lead como "También cotizar")
const OTRAS = (['RS', 'DI', 'AR'] as const).map((v) => ({
  v, t: (TIPOS as any)[v].nombre as string, img: (TIPOS as any)[v].imagen as string,
  d: { RS: 'Acceso directo a cada pallet', DI: 'Muchos pallets de un mismo producto', AR: 'Cajas y productos sueltos, a mano' }[v],
}));
const tambien = ref<string[]>([]);
function alternarTambien(v: string) {
  tambien.value = tambien.value.includes(v) ? tambien.value.filter((x) => x !== v) : [...tambien.value, v];
  marcar('agregar_producto', { tipo: v, desde: 'expres', activo: tambien.value.includes(v) });
}
const abandonoMedidas = ref(false);
const prueba = ref(false);
const utm = ref<Record<string, string>>({});
const unidad = computed(() => (e.guarda === 'cajas' ? 'cajas' : 'pallets'));
const archivos = ref<File[]>([]);
const medidasOk = computed(() => (e.ancho ?? 0) >= 2 && (e.largo ?? 0) >= 2);
const estados = computed(() => estadosExpres({ ...e, archivos: archivos.value.length }));

// Lo que respondió, para revisarlo antes de enviar
const resumen = computed(() => [
  { t: 'Guardas', v: e.guarda === 'cajas' ? 'Cajas o bultos' : 'Pallets' },
  { t: 'Cantidad', v: `${n(e.cantidad)} ${unidad.value}`, est: e.cantidadNoSe },
  ...(e.guarda === 'pallets' && e.peso ? [{ t: 'Peso por pallet', v: `${n(e.peso)} kg`, est: e.pesoNoSe }] : []),
  { t: 'Bodega', v: e.ancho && e.largo ? `${fm(e.ancho)} × ${fm(e.largo)} m` : 'sin medidas', est: e.medidasAprox },
  ...(e.altura ? [{ t: 'Altura libre', v: `${fm(e.altura)} m`, est: e.alturaNoSe }] : []),
  ...(e.guarda === 'pallets' && e.grua ? [{ t: 'Equipo', v: (GRUAS as any)[e.grua]?.nombre ?? e.grua, est: e.gruaNoSe }] : []),
  ...(archivos.value.length ? [{ t: 'Archivos', v: `${archivos.value.length}` }] : []),
]);

// Cajas: no hay pregunta de equipo
function siguiente() {
  paso.value = paso.value === 2 && e.guarda === 'cajas' ? 4 : paso.value + 1;
  marcar('expres_paso', { paso: paso.value, guarda: e.guarda });
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' });
}
function atras() {
  paso.value = paso.value === 4 && e.guarda === 'cajas' ? 2 : Math.max(0, paso.value - 1);
}
// "No lo sé": parte en el valor típico del medio y el cliente elige el más parecido
function pesoNoSe() {
  if (!e.pesoNoSe) e.peso = 1000;
  e.pesoNoSe = true; pesoExacto.value = null;
}
function alturaNoSe() {
  if (!e.alturaNoSe) e.altura = 8;
  e.alturaNoSe = true; alturaExacta.value = null;
}
// "No tengo las medidas": sigue sin ellas y cuenta como abandono del paso de medidas (rescate)
function sinMedidas() {
  e.ancho = null; e.largo = null; e.medidasAprox = false;
  if (!e.altura) { e.altura = 8; e.alturaNoSe = true; }
  abandonoMedidas.value = true;
  marcar('expres_sin_medidas', {});
  siguiente();
}

// ─── Foto o plano: las fotos se achican a 1.600 px (JPG) para no pasar los 5 MB del servidor ───
const MAX_ARCHIVOS = 3;
const MAX_TOTAL = 5 * 1024 * 1024;
const avisoArchivo = ref('');
async function achicar(f: File): Promise<File> {
  if (!f.type.startsWith('image/') || f.size < 400 * 1024) return f;
  try {
    const bmp = await createImageBitmap(f);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/jpeg', 0.82));
    return blob ? new File([blob], f.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : f;
  } catch { return f; }
}
async function agregarArchivos(ev: Event) {
  const input = ev.target as HTMLInputElement;
  avisoArchivo.value = '';
  for (const f of Array.from(input.files ?? [])) {
    if (archivos.value.length >= MAX_ARCHIVOS) { avisoArchivo.value = `Máximo ${MAX_ARCHIVOS} archivos.`; break; }
    const listo = await achicar(f);
    const total = archivos.value.reduce((t, a) => t + a.size, 0) + listo.size;
    if (total > MAX_TOTAL) { avisoArchivo.value = 'Los archivos pasan de 5 MB en total. Sube uno más liviano o envíalo después por WhatsApp.'; break; }
    archivos.value.push(listo);
  }
  input.value = '';
}

// ─── Envío: mismo circuito de Kommo que la vía diseño, con la etiqueta via-expres ───
const enviando = ref(false);
const enviado = ref(false);
const error = ref('');
const visitaPedida = ref<'' | 'visita' | 'remota'>('');
async function enviar({ visita }: { visita: boolean }) {
  if (enviando.value) return;
  enviando.value = true;
  error.value = '';
  try {
    const lead = leadExpres({ ...e, comuna: cliente.comuna, visita, archivos: archivos.value.length }, {
      nombreGrua: (k: string) => (GRUAS as any)[k]?.nombre ?? k, prueba: prueba.value, utm: utm.value,
    });
    if (tambien.value.length) lead.config['También cotizar'] = OTRAS.filter((o) => tambien.value.includes(o.v)).map((o) => o.t).join(', ');
    const r = await enviarLead(payloadLead(cliente, lead), archivos.value);
    if (!r.ok) {
      error.value = r.error === 'rate_limit' ? 'Recibimos muchas solicitudes desde tu conexión. Espera un minuto e inténtalo de nuevo.'
        : r.error === 'too_large' ? 'Los archivos pesan mucho. Quita uno e inténtalo de nuevo.'
          : r.error === 'rut' ? 'Revisa el RUT de tu empresa: sin un RUT válido no podemos enviarte la cotización.'
          : 'No pudimos enviar tus datos. Inténtalo de nuevo o escríbenos por WhatsApp al +56 9 3240 3819.';
      marcar('quote_error', { via: 'expres', error: r.error });
      return;
    }
    enviado.value = true;
    window.scrollTo({ top: 0 });
    visitaPedida.value = visita ? (ofertaRescate(cliente.comuna)?.tipo ?? '') as '' | 'visita' | 'remota' : '';
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'generate_lead', event_category: 'Conversion', event_label: 'Quote Form Sent', funnel_step: 'quote_form_sent', lead_type: 'quote',
      product: lead.name, lead_origin: 'planifica-tu-bodega', via: 'expres', lead_reference: r.referencia, currency: 'CLP', value: 0, ...utm.value,
    });
    marcar('quote_sent', { via: 'expres', visita, precision: lead.config['Precisión'] });
    try { sessionStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
  } finally {
    enviando.value = false;
  }
}

// Respuestas guardadas mientras dure la visita (si recarga, no pierde lo que llevaba)
const CLAVE = 'racklog-expres-v1';
watch([e, cliente, paso], () => { try { sessionStorage.setItem(CLAVE, JSON.stringify({ e, cliente, paso: paso.value })); } catch { /* lleno o bloqueado */ } }, { deep: true });
onMounted(() => {
  const q = new URLSearchParams(location.search);
  prueba.value = q.get('prueba') === '1';
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'li_fat_id'].forEach((k) => { const v = q.get(k); if (v) utm.value[k] = v.slice(0, 120); });
  try {
    const g = JSON.parse(sessionStorage.getItem(CLAVE) || 'null');
    if (g?.e) { Object.assign(e, g.e); Object.assign(cliente, g.cliente ?? {}); paso.value = Math.min(5, g.paso ?? 0); }
  } catch { /* sin almacenamiento */ }
  if (prueba.value && !cliente.correo) cliente.correo = 'comercial+prueba@racklog.cl';
  pesoExacto.value = e.peso && !e.pesoNoSe ? e.peso : null;
  alturaExacta.value = e.altura && !e.alturaNoSe ? e.altura : null;
  marcar('expres_open', {});
});
function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>

<style src="~/assets/css/flujo.css"></style>
