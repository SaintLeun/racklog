<template>
  <div class="min-h-[calc(100vh-4rem)] bg-neutral-50">
    <section class="page-hero !pb-10">
      <div class="container-page">
        <div class="max-w-3xl">
          <span class="eyebrow bg-white/5 text-brand-300 ring-white/10">Tour logístico · gratis</span>
          <h1 class="page-hero__title mt-5">¿Qué rack <span class="text-brand-500">necesitas</span>?</h1>
          <p class="page-hero__lead">Te guiamos como lo haría un ingeniero de Racklog: unas pocas preguntas y sabrás qué cotizar.</p>
        </div>
      </div>
    </section>

    <section class="py-8 sm:py-12">
      <div class="container-page">
        <div :class="['mx-auto', paso === 'pallet' ? 'max-w-6xl' : 'max-w-2xl']">
          <!-- Progreso -->
          <div class="mb-6 flex items-center gap-3" aria-hidden="true">
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
              <div class="h-full rounded-full bg-brand-600 transition-all duration-500" :style="{ width: `${progreso}%` }" />
            </div>
            <span class="text-xs font-semibold tabular-nums text-neutral-500">{{ progreso }}%</span>
          </div>

          <Transition name="paso" mode="out-in">
            <!-- 1. Registro -->
            <div v-if="paso === 'registro'" key="registro" class="card p-6 sm:p-8">
              <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">Antes de empezar</p>
              <h2 class="mt-1.5 text-2xl font-bold">Déjanos tus datos</h2>
              <p class="mt-1 text-sm text-neutral-600">Te entregamos tu recomendación y el plano de tu bodega. Sin costo.</p>

              <form class="mt-6 grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="registrar">
                <label class="tour-campo">
                  <span>Nombre</span>
                  <input v-model.trim="lead.nombre" type="text" autocomplete="name" :class="{ 'tour-error': errores.nombre }">
                  <small v-if="errores.nombre">{{ errores.nombre }}</small>
                </label>
                <label class="tour-campo">
                  <span>Empresa</span>
                  <input v-model.trim="lead.empresa" type="text" autocomplete="organization" :class="{ 'tour-error': errores.empresa }">
                  <small v-if="errores.empresa">{{ errores.empresa }}</small>
                </label>
                <label class="tour-campo">
                  <span>RUT de la empresa</span>
                  <input v-model="lead.rut" type="text" inputmode="text" placeholder="76.123.456-7" :class="{ 'tour-error': errores.rut }" @blur="lead.rut = formatearRut(lead.rut)">
                  <small v-if="errores.rut">{{ errores.rut }}</small>
                </label>
                <label class="tour-campo">
                  <span>Correo</span>
                  <input v-model.trim="lead.correo" type="email" autocomplete="email" placeholder="tu@empresa.cl" :class="{ 'tour-error': errores.correo }">
                  <small v-if="errores.correo">{{ errores.correo }}</small>
                  <em v-else>Correo de empresa o Gmail.</em>
                </label>
                <label class="tour-campo">
                  <span>Celular</span>
                  <input v-model="lead.telefono" type="tel" autocomplete="tel" placeholder="9 1234 5678" :class="{ 'tour-error': errores.telefono }">
                  <small v-if="errores.telefono">{{ errores.telefono }}</small>
                </label>
                <label class="tour-campo">
                  <span>Tu rol</span>
                  <select v-model="lead.perfil" :class="{ 'tour-error': errores.perfil }">
                    <option value="" disabled>Elige uno</option>
                    <option v-for="p in PERFILES" :key="p.v" :value="p.v">{{ p.t }}</option>
                  </select>
                  <small v-if="errores.perfil">{{ errores.perfil }}</small>
                </label>
                <label class="tour-campo">
                  <span>Industria</span>
                  <select v-model="lead.industria" :class="{ 'tour-error': errores.industria }">
                    <option value="" disabled>Elige una</option>
                    <option v-for="i in INDUSTRIAS" :key="i">{{ i }}</option>
                  </select>
                  <small v-if="errores.industria">{{ errores.industria }}</small>
                </label>
                <button type="submit" class="btn btn-primary btn-lg sm:col-span-2">Empezar</button>
                <p class="text-center text-xs text-neutral-500 sm:col-span-2">No publicamos precios: un ejecutivo revisa tu caso y te contacta.</p>
              </form>
            </div>

            <!-- 2. ¿Sabes qué cotizar? -->
            <div v-else-if="paso === 'sabe'" key="sabe" class="card p-6 sm:p-8">
              <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">Hola, {{ primerNombre }}</p>
              <h2 class="mt-1.5 text-2xl font-bold">¿Sabes qué producto necesitas cotizar?</h2>
              <div class="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" class="tour-opcion-grande" @click="ir('elegir')">
                  <span class="tour-icono">✓</span>
                  <span class="block text-lg font-semibold text-neutral-900">Sí, ya sé</span>
                  <span class="block text-sm text-neutral-600">Elijo el sistema y voy directo a armar mi pallet.</span>
                </button>
                <button type="button" class="tour-opcion-grande" @click="empezarTour">
                  <span class="tour-icono">?</span>
                  <span class="block text-lg font-semibold text-neutral-900">No, ayúdame a elegir</span>
                  <span class="block text-sm text-neutral-600">{{ preguntas.length }} preguntas cortas y te recomendamos.</span>
                </button>
              </div>
            </div>

            <!-- 3A. Elegir producto -->
            <div v-else-if="paso === 'elegir'" key="elegir">
              <h2 class="text-2xl font-bold">¿Qué quieres cotizar?</h2>
              <p class="mt-1 text-sm text-neutral-600">Toca uno para ver para qué sirve.</p>
              <div class="mt-5 grid gap-4 sm:grid-cols-3">
                <button
                  v-for="(t, k) in TIPOS" :key="k" type="button"
                  :class="['card flex flex-col justify-start overflow-hidden text-left transition', elegido === k ? 'ring-2 ring-brand-600' : 'hover:ring-brand-300']"
                  @click="elegido = k as Tipo"
                >
                  <img :src="t.imagen" :alt="t.nombre" class="aspect-[4/3] w-full object-cover" loading="lazy">
                  <div class="p-4">
                    <p class="font-semibold text-neutral-900">{{ t.nombre }}</p>
                    <p class="mt-1 text-sm text-neutral-600">{{ t.asesoria.sirve }}</p>
                  </div>
                </button>
              </div>
              <div v-if="elegido" class="card mt-4 p-5 text-sm">
                <p><b class="text-neutral-900">Te conviene si:</b> {{ TIPOS[elegido].asesoria.conviene }}</p>
                <p class="mt-1.5"><b class="text-neutral-900">No te conviene si:</b> {{ TIPOS[elegido].asesoria.noConviene }}</p>
              </div>
              <div class="mt-5 flex justify-between gap-3">
                <button type="button" class="btn btn-secondary" @click="ir('sabe')">Atrás</button>
                <button type="button" :disabled="!elegido" :class="['btn btn-primary', !elegido && 'opacity-40']" @click="irPallet(elegido!)">
                  {{ elegido === 'AR' ? 'Arma tu repisa' : 'Arma tu pallet' }} →
                </button>
              </div>
            </div>

            <!-- 3B. Tour guiado -->
            <div v-else-if="paso === 'pregunta'" :key="`p-${actual.clave}`" class="card p-6 sm:p-8">
              <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">Pregunta {{ indice + 1 }} de {{ preguntas.length }}</p>
              <h2 class="mt-1.5 text-xl font-bold sm:text-2xl">{{ actual.texto }}</h2>
              <div class="mt-5 grid gap-2.5">
                <button
                  v-for="op in actual.opciones" :key="op.v" type="button"
                  :class="['tour-opcion', respuestas[actual.clave] === op.v && 'tour-opcion--activa']"
                  @click="responder(op.v)"
                >{{ op.t }}</button>
              </div>
              <div class="mt-5 flex gap-3 rounded-xl bg-brand-50 p-3.5 text-sm text-brand-900 ring-1 ring-brand-100">
                <span aria-hidden="true" class="font-bold">💡</span>
                <p><b>¿Por qué te preguntamos esto?</b> {{ actual.tip }}</p>
              </div>
              <button type="button" class="mt-5 text-sm font-semibold text-neutral-500 hover:text-neutral-900" @click="atras">← Atrás</button>
            </div>

            <!-- 4. Resultado -->
            <div v-else-if="paso === 'resultado' && rec" key="resultado">
              <div class="card overflow-hidden">
                <div class="grid sm:grid-cols-[220px_1fr]">
                  <img :src="TIPOS[rec.sistema].imagen" :alt="TIPOS[rec.sistema].nombre" class="h-full max-h-56 w-full object-cover sm:max-h-none">
                  <div class="p-6">
                    <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">Te recomendamos</p>
                    <h2 class="mt-1 text-3xl font-bold">{{ TIPOS[rec.sistema].nombre }}</h2>
                    <ul class="mt-3 space-y-1.5 text-sm text-neutral-700">
                      <li v-for="(p, i) in rec.porque" :key="i" class="flex gap-2"><span class="text-brand-600">●</span>{{ p }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div v-if="rec.notas.length" class="card mt-4 p-5">
                <p class="text-sm font-semibold text-neutral-900">Para tener en cuenta</p>
                <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-600">
                  <li v-for="(n, i) in rec.notas" :key="i">{{ n }}</li>
                </ul>
              </div>

              <div v-if="rec.alternativa" class="card mt-4 flex items-center justify-between gap-4 p-5">
                <div class="text-sm">
                  <p class="font-semibold text-neutral-900">Alternativa: {{ TIPOS[rec.alternativa].nombre }}</p>
                  <p class="text-neutral-600">{{ TIPOS[rec.alternativa].asesoria.impacto }}</p>
                </div>
                <NuxtLink :to="`/planificador?rack=${rec.alternativa}`" class="btn btn-secondary btn-sm shrink-0">Ver</NuxtLink>
              </div>

              <div class="mt-6 flex flex-col-reverse justify-between gap-3 sm:flex-row">
                <button type="button" class="btn btn-secondary" @click="empezarTour">Volver a responder</button>
                <button type="button" class="btn btn-primary btn-lg" @click="irPallet(rec.sistema)">
                  {{ rec.sistema === 'AR' ? 'Arma tu repisa' : 'Arma tu pallet' }} →
                </button>
              </div>
            </div>
            <!-- 5. Arma tu pallet -->
            <div v-else-if="paso === 'pallet'" key="pallet">
              <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">{{ TIPOS[sistema].nombre }}</p>
              <h2 class="mt-1 text-2xl font-bold">{{ sistema === 'AR' ? 'Arma tu repisa' : 'Arma tu pallet' }}</h2>
              <p class="mt-1 text-sm text-neutral-600">{{ sistema === 'AR' ? 'Cuéntanos cómo es tu caja y te decimos cuántas caben y cuánto pesa cada repisa.' : 'Cuéntanos cómo es tu caja: armamos el pallet y con eso calculamos la altura de cada nivel de tu rack.' }}</p>
              <div class="mt-5">
                <TourArmaPallet ref="armaPallet" :modo="sistema === 'AR' ? 'bandeja' : 'pallet'" :equipo="respuestas.equipo" :perfil="lead.perfil" />
              </div>
              <div class="mt-6 flex flex-col-reverse justify-between gap-3 sm:flex-row">
                <button type="button" class="btn btn-secondary" @click="ir(volverDesdePallet)">Atrás</button>
                <NuxtLink :to="`/planificador?rack=${sistema}`" class="btn btn-primary btn-lg">Dibuja tu bodega →</NuxtLink>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </section>

    <CtaCotizacion24
      :visible="['elegir', 'resultado', 'pallet'].includes(paso) && !cotizando"
      @cotizar="cotizando = true"
    />
    <ContactModal
      :is-visible="cotizando"
      :encabezado="{ etiqueta: 'Respuesta en 24 horas', titulo: 'Recibe tu cotización en 24 horas', texto: 'Nuestro equipo comercial revisa lo que armaste en el tour y te envía la cotización en 24 horas hábiles.' }"
      :quote-item="itemCotizacion"
      :prefill="{ name: lead.nombre, phone: lead.telefono, email: lead.correo, company: lead.empresa, rut: lead.rut }"
      @close="cotizando = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { TIPOS, PERFILES } from '~/lib/rack3d/planificador.js';
import {
  validarCorreo, validarRut, validarTelefono, formatearRut, preguntasActivas, recomendar,
} from '~/lib/tour/reglas.js';

type Tipo = keyof typeof TIPOS;
type Paso = 'registro' | 'sabe' | 'elegir' | 'pregunta' | 'resultado' | 'pallet';

usePageSeo({
  title: 'Tour logístico: ¿qué rack necesitas?',
  description: 'Responde unas preguntas cortas y te decimos si te conviene rack selectivo, drive-in o ángulo ranurado.',
});

const INDUSTRIAS = ['Logística', 'Minería', 'Alimentos', 'Retail', 'Otra'];
const GUARDADO = 'racklog_tour_v1';

const paso = ref<Paso>('registro');
const lead = reactive({ nombre: '', empresa: '', rut: '', correo: '', telefono: '', perfil: '', industria: '' });
const errores = reactive<Record<string, string>>({});
const flagsLead = ref<string[]>([]);
const respuestas = reactive<Record<string, string>>({});
const indice = ref(0);
const elegido = ref<Tipo | null>(null);
const sistema = ref<Tipo>('RS');
const cotizando = ref(false);
const armaPallet = ref<any>(null);
// Lo que armó el cliente en el tour, para el vendedor
const itemCotizacion = computed(() => {
  const sis = paso.value === 'resultado' && rec.value ? rec.value.sistema : (paso.value === 'elegir' ? elegido.value : sistema.value) ?? 'RS';
  const config: Record<string, string | number> = {
    'Origen': 'Tour logístico web',
    'Sistema': TIPOS[sis as Tipo]?.nombre ?? 'Por definir',
    'Rol': PERFILES.find((p) => p.v === lead.perfil)?.t ?? '',
    'Industria': lead.industria,
  };
  if (rec.value) config['Recomendación'] = rec.value.porque.join(' ');
  const ap = armaPallet.value;
  if (paso.value === 'pallet' && ap?.items) {
    ap.items.forEach((it: any, i: number) => {
      config[`Producto ${i + 1}`] = `${it.nombre || 'Sin nombre'} · caja ${it.largo}×${it.ancho}×${it.alto} cm, ${it.peso} kg, apila ${it.apilable}`;
    });
    if (ap.pallet?.cajas) config['Pallet'] = `${ap.pallet.cajas} cajas · ${Math.round(ap.pallet.alto * 100)} cm · ${Math.round(ap.pallet.peso)} kg`;
    if (ap.modulacion?.cuerpos) config['Necesita'] = `${ap.modulacion.cuerpos} cuerpos · ${ap.modulacion.alturas} alturas · ${ap.modulacion.porCuerpo} pallets por cuerpo`;
  }
  if (flagsLead.value.length) config['Flags'] = flagsLead.value.join(', ');
  return { name: 'Tour logístico', config, analytics: { lead_origin: 'tour_logistico', sistema: sis, perfil: lead.perfil } };
});
const volverDesdePallet = ref<Paso>('elegir');
function irPallet(t: Tipo) {
  sistema.value = t;
  volverDesdePallet.value = paso.value === 'resultado' ? 'resultado' : 'elegir';
  ir('pallet');
}

const preguntas = computed(() => preguntasActivas(respuestas));
const actual = computed(() => preguntas.value[Math.min(indice.value, preguntas.value.length - 1)]);
const rec = computed(() => (paso.value === 'resultado' ? recomendar(respuestas) : null));
const primerNombre = computed(() => lead.nombre.split(' ')[0]);

const progreso = computed(() => {
  switch (paso.value) {
    case 'registro': return 5;
    case 'sabe': return 20;
    case 'elegir': return 60;
    case 'pallet': return 85;
    case 'pregunta': return Math.round(25 + (indice.value / preguntas.value.length) * 45);
    case 'resultado': return 75;
    default: return 100;
  }
});

function registrar() {
  for (const k of Object.keys(errores)) delete errores[k];
  if (lead.nombre.length < 2) errores.nombre = 'Escribe tu nombre.';
  if (lead.empresa.length < 2) errores.empresa = 'Escribe el nombre de tu empresa.';
  const rut = validarRut(lead.rut); if (!rut.ok) errores.rut = rut.msg!;
  const correo = validarCorreo(lead.correo); if (!correo.ok) errores.correo = correo.msg!;
  const tel = validarTelefono(lead.telefono); if (!tel.ok) errores.telefono = tel.msg!;
  if (!lead.industria) errores.industria = 'Elige tu industria.';
  if (!lead.perfil) errores.perfil = 'Elige tu rol.';
  if (Object.keys(errores).length) return;
  lead.rut = formatearRut(lead.rut);
  lead.telefono = tel.valor!;
  flagsLead.value = rut.personaNatural ? ['persona_natural_con_giro'] : [];
  // TODO Kommo: crear lead con etiqueta tour-logistico + industria + flags
  guardar();
  ir('sabe');
}

function ir(p: Paso) {
  paso.value = p;
  guardar();
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function empezarTour() {
  for (const k of Object.keys(respuestas)) delete respuestas[k];
  indice.value = 0;
  ir('pregunta');
}

function responder(v: string) {
  respuestas[actual.value.clave] = v;
  // Si cambian preguntas condicionales, se borran respuestas que ya no aplican
  const activas = new Set(preguntasActivas(respuestas).map((p) => p.clave));
  for (const k of Object.keys(respuestas)) if (!activas.has(k)) delete respuestas[k];
  setTimeout(() => {
    if (indice.value < preguntas.value.length - 1) { indice.value++; guardar(); }
    else ir('resultado');
  }, 180);
}

function atras() {
  if (indice.value > 0) indice.value--;
  else ir('sabe');
}

function guardar() {
  try {
    localStorage.setItem(GUARDADO, JSON.stringify({ paso: paso.value, sistema: sistema.value, lead, respuestas, indice: indice.value, flags: flagsLead.value }));
  } catch { /* sin almacenamiento */ }
}

onMounted(() => {
  try {
    const g = JSON.parse(localStorage.getItem(GUARDADO) || 'null');
    if (g?.lead?.correo) {
      Object.assign(lead, g.lead);
      Object.assign(respuestas, g.respuestas || {});
      indice.value = g.indice || 0;
      flagsLead.value = g.flags || [];
      if (g.sistema) sistema.value = g.sistema;
      paso.value = g.paso && g.paso !== 'registro' ? g.paso : 'sabe';
    }
  } catch { /* nada guardado */ }
});
</script>

<style scoped>
.tour-campo { display: grid; gap: 0.35rem; font-size: 0.875rem; }
.tour-campo > span { font-weight: 600; color: #262626; }
.tour-campo input, .tour-campo select {
  height: 2.75rem; border-radius: 0.75rem; border: 1px solid #d4d4d4; background: #fff;
  padding: 0 0.875rem; font-size: 0.95rem; outline: none; transition: border-color .15s, box-shadow .15s;
}
.tour-campo input:focus, .tour-campo select:focus { border-color: #ea580c; box-shadow: 0 0 0 3px #fed7aa; }
.tour-campo small { color: #b91c1c; font-size: 0.8rem; }
.tour-campo em { color: #737373; font-size: 0.8rem; font-style: normal; }
.tour-error { border-color: #dc2626 !important; }

.tour-opcion-grande {
  display: block; border-radius: 1rem; padding: 1.25rem; text-align: left;
  box-shadow: inset 0 0 0 1px #e5e5e5; transition: all .15s; background: #fff;
}
.tour-opcion-grande:hover { box-shadow: inset 0 0 0 2px #ea580c; background: #fff7ed; }
.tour-icono {
  display: inline-flex; height: 2.25rem; width: 2.25rem; align-items: center; justify-content: center;
  border-radius: 0.75rem; background: #ffedd5; color: #c2410c; font-weight: 700; margin-bottom: 0.75rem;
}
.tour-opcion {
  min-height: 3.25rem; border-radius: 0.875rem; padding: 0.75rem 1rem; text-align: left;
  font-weight: 600; color: #262626; background: #fff; box-shadow: inset 0 0 0 1px #e5e5e5; transition: all .15s;
}
.tour-opcion:hover { box-shadow: inset 0 0 0 2px #fdba74; background: #fffbf5; }
.tour-opcion--activa { box-shadow: inset 0 0 0 2px #ea580c; background: #fff7ed; color: #9a3412; }

.paso-enter-active, .paso-leave-active { transition: opacity .2s, transform .2s; }
.paso-enter-from { opacity: 0; transform: translateY(8px); }
.paso-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
