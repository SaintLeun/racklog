<template>
  <!-- Asistente RACKLOG (dueño 28-10): el rack con cara de la marca va fijo a la izquierda, encima de todo, y guía
       paso a paso con una burbuja. Aparece al entrar con "Diseñar mi bodega" y saluda. La voz parte apagada: el
       parlante tachado al inicio del texto la enciende y ahí recién habla; desde ese momento lee cada mensaje
       hasta que se vuelva a apagar. Al tocarlo abre el panel con los avisos de su diseño y el tutorial del paso.
       Contenido en lib/flujo/asistente.js. Sin animaciones en bucle -->
  <!-- En pantallas anchas se para al lado del título del paso (dueño 28-10: "casi al lado de la pregunta"), en el
       margen izquierdo; si no cabe (celular, tablet), abajo a la izquierda -->
  <div
    :class="['pointer-events-none fixed z-[70] flex flex-col items-start gap-2', !junto && 'bottom-[5.5rem] left-3 sm:bottom-24 sm:left-5']"
    :style="junto ? { top: `${junto.top}px`, left: '12px', width: `${junto.ancho}px` } : undefined"
  >
    <!-- Panel -->
    <Transition name="fl-sub">
      <section
        v-if="estado.abierto" :class="['pointer-events-auto flex', junto && 'order-last']" class=" max-h-[min(64vh,580px)] w-[min(390px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
        role="dialog" aria-label="RACKLOG, asistente de diseño"
      >
        <header class="flex items-start gap-3 border-b border-neutral-100 bg-gradient-to-b from-brand-50/70 to-white px-4 py-3">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold uppercase tracking-wide text-brand-700">Paso {{ indice + 1 }} · {{ tituloPaso }}</p>
            <p class="mt-0.5 font-semibold leading-snug text-neutral-900">{{ actual.titulo }}</p>
          </div>
          <button type="button" class="h-8 w-8 flex-shrink-0 rounded-md text-lg text-neutral-500 hover:bg-neutral-100" aria-label="Cerrar" @click="estado.abierto = false">×</button>
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div class="flex items-start gap-2.5">
            <button type="button" :class="['mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-1', voz ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-neutral-500 ring-neutral-300 hover:bg-neutral-50']" :aria-pressed="voz" :aria-label="voz ? 'Silenciar a RACKLOG' : 'Escuchar a RACKLOG'" @click="alternarVoz">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
                <path v-if="voz" d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
                <path v-else d="M16 9l6 6M22 9l-6 6" />
              </svg>
            </button>
            <p class="text-[15px] leading-relaxed text-neutral-800">{{ actual.texto }}</p>
          </div>
          <button v-if="actual.accion" type="button" class="fl-btn mt-3 !min-h-10 !px-4 !text-sm" @click="pedir(actual.accion.id)">{{ actual.accion.texto }}</button>

          <!-- Avisos de su diseño (además del que se está mostrando) -->
          <ul v-if="avisos.length > (vista.tipo === 'aviso' ? 1 : 0)" class="mt-4 space-y-1.5">
            <li v-for="(a, i) in avisos" v-show="!(vista.tipo === 'aviso' && vista.i === i)" :key="`a${i}`">
              <button type="button" :class="['flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ring-1', TONO[a.tono]]" @click="vista = { tipo: 'aviso', i }">
                <span :class="['h-2 w-2 flex-shrink-0 rounded-full', PUNTO[a.tono]]" aria-hidden="true" />
                <span class="min-w-0 flex-1 font-medium">{{ a.titulo }}</span>
              </button>
            </li>
          </ul>

          <!-- Tutorial del paso: un tema a la vez -->
          <div v-if="temas.length" class="mt-4 border-t border-neutral-100 pt-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Cómo funciona este paso</p>
            <ol class="mt-2 flex flex-wrap gap-1.5">
              <li v-for="(t, i) in temas" :key="`t${i}`">
                <button type="button" :class="['rounded-full px-2.5 py-1 text-xs font-semibold ring-1', vista.tipo === 'tema' && vista.i === i ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-neutral-700 ring-neutral-300 hover:bg-neutral-50']" @click="vista = { tipo: 'tema', i }">{{ t.titulo }}</button>
              </li>
            </ol>
          </div>
        </div>
        <footer class="flex items-center justify-between gap-2 border-t border-neutral-100 px-4 py-2.5 text-sm">
          <a :href="whatsapp" target="_blank" rel="noopener" class="font-medium text-green-700 underline underline-offset-2" @click="marcar('whatsapp_click', { ubicacion: 'asistente', paso })">Hablar con una persona</a>
          <button v-if="siguiente" type="button" class="rounded-lg bg-neutral-900 px-3 py-1.5 font-semibold text-white hover:bg-neutral-800" @click="vista = siguiente">Siguiente</button>
        </footer>
      </section>
    </Transition>

    <div :class="junto ? 'flex w-full flex-col items-end gap-1' : 'flex items-end gap-1'">
      <!-- RACKLOG de cuerpo entero: al tocarlo abre o cierra el panel -->
      <button
        type="button" class="pointer-events-auto relative -mb-1 flex-shrink-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        :aria-label="alertas ? `RACKLOG: ${alertas} ${alertas === 1 ? 'aviso' : 'avisos'}` : estado.abierto ? 'Cerrar a RACKLOG' : 'Abrir la ayuda de RACKLOG'"
        :aria-expanded="estado.abierto" @click="estado.abierto ? (estado.abierto = false) : abrir()"
      >
        <!-- RACKLOG en 3D (dueño 28-10): llega caminando desde el fondo, explica en grande y después se achica a la
             esquina; al tocarlo vuelve a explicar -->
        <FlujoRobot3D
          v-if="entrada !== 'espera'" :pose="poseAvatar" :caminar="entrada === 'camina'" :hablando="hablando"
          :class="['rl-tam drop-shadow-[0_8px_12px_rgba(0,0,0,0.2)]', !grande ? 'h-20 w-20 sm:h-24 sm:w-24' : !junto && 'h-36 w-32 sm:h-60 sm:w-56']"
          :style="grande ? tamaño : undefined" @llego="llegó"
        />
        <span v-if="alertas" class="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white" aria-hidden="true">{{ alertas }}</span>
      </button>

      <!-- Burbuja: el saludo, la guía del paso o la invitación cuando lleva rato sin avanzar -->
      <Transition name="fl-sub">
        <div
          v-if="!estado.abierto && mensaje"
          :class="['pointer-events-auto rounded-2xl px-3.5 py-3 text-sm shadow-xl ring-1', guia?.tipo === 'aviso' && mensaje.tono === 'alerta' ? 'bg-red-50 ring-red-200' : 'bg-white ring-black/10', junto ? 'self-end rounded-tr-sm' : 'mb-8 w-[min(330px,calc(100vw-8.5rem))] rounded-bl-sm sm:mb-12 sm:w-[min(340px,calc(100vw-11rem))]']"
          :style="junto ? { width: `${Math.max(220, Math.min(300, junto.ancho))}px` } : undefined" role="status"
        >
          <div class="flex items-start gap-2.5">
            <button type="button" :class="['flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-1', voz ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-neutral-500 ring-neutral-300 hover:bg-neutral-50']" :aria-pressed="voz" :aria-label="voz ? 'Silenciar a RACKLOG' : 'Escuchar a RACKLOG'" @click="alternarVoz">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
                <path v-if="voz" d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
                <path v-else d="M16 9l6 6M22 9l-6 6" />
              </svg>
            </button>
            <div class="min-w-0 flex-1 pt-1">
              <p v-if="logro && guia?.tipo === 'tema' && guia.i === 0" class="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">{{ logro }}</p>
              <p v-if="guia?.tipo !== 'saludo' && guia?.tipo !== 'invitar' && mensaje.titulo" class="font-semibold text-neutral-900">{{ mensaje.titulo }}</p>
              <p :class="['leading-relaxed text-neutral-800', guia?.tipo === 'saludo' && 'text-[15px] font-medium']">{{ mensaje.texto }}</p>
            </div>
            <button type="button" class="-mr-1 -mt-0.5 h-7 w-7 flex-shrink-0 rounded text-neutral-400 hover:bg-neutral-100" aria-label="Cerrar" @click="cerrarGuia">×</button>
          </div>
          <div class="mt-2.5 flex items-center justify-end gap-3">
            <button v-if="guia?.tipo === 'tema' || guia?.tipo === 'invitar'" type="button" class="font-medium text-neutral-600 underline underline-offset-2" @click="abrir">Más ayuda</button>
            <button v-if="mensaje.accion" type="button" class="font-medium text-neutral-600 underline underline-offset-2" @click="cerrarGuia">Ahora no</button>
            <button type="button" class="rounded-lg bg-neutral-900 px-3 py-1.5 font-semibold text-white hover:bg-neutral-800" @click="mensaje.accion ? (pedir(mensaje.accion.id), cerrarGuia()) : avanzarGuia()">{{ mensaje.accion ? mensaje.accion.texto : textoAvanzar }}</button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useAsistente } from '~/composables/useAsistente';
import { useProyecto, PASOS } from '~/stores/proyecto';
import { temasDe, avisosDe, porQueDe, SALUDO, FIN, type Aviso, type Tema } from '~/lib/flujo/asistente.js';

const props = defineProps<{ paso: string; indice: number; tituloPaso: string; invitar?: boolean; whatsapp: string }>();
const emit = defineEmits<{ visto: [] }>();
const p = useProyecto();
const { estado, pedir } = useAsistente();
const { analytics } = useConsent();

const TONO = { alerta: 'bg-red-50 text-red-900 ring-red-200 hover:bg-red-100', bien: 'bg-green-50 text-green-900 ring-green-200 hover:bg-green-100', info: 'bg-white text-neutral-800 ring-neutral-200 hover:bg-neutral-50' };
const PUNTO = { alerta: 'bg-red-600', bien: 'bg-green-600', info: 'bg-brand-500' };

const temas = computed<Tema[]>(() => temasDe(props.paso, p));
const avisos = computed<Aviso[]>(() => avisosDe(props.paso, p, { layout: estado.layout }));
const alertas = computed(() => avisos.value.filter((a) => a.tono === 'alerta').length);

// ─── Panel: un aviso o un tema del tutorial ───
const vista = ref<{ tipo: 'saludo' | 'aviso' | 'tema'; i: number }>({ tipo: 'tema', i: 0 });
const actual = computed<Tema & { accion?: Aviso['accion'] }>(() => {
  if (vista.value.tipo === 'saludo') return SALUDO;
  if (vista.value.tipo === 'aviso') return avisos.value[vista.value.i] ?? temas.value[0] ?? SALUDO;
  return temas.value[vista.value.i] ?? avisos.value[0] ?? SALUDO;
});
// Siguiente: de un aviso al primer tema; de un tema al que sigue
const siguiente = computed(() => {
  const v = vista.value;
  if (v.tipo !== 'tema') return temas.value.length ? { tipo: 'tema' as const, i: 0 } : null;
  return v.i + 1 < temas.value.length ? { tipo: 'tema' as const, i: v.i + 1 } : null;
});
function abrir() {
  // Primero lo urgente; si no, el tema que estaba guiando la burbuja
  const i = avisos.value.findIndex((a) => a.tono === 'alerta');
  vista.value = i >= 0 ? { tipo: 'aviso', i } : guia.value?.tipo === 'tema' ? { tipo: 'tema', i: guia.value.i } : avisos.value.length ? { tipo: 'aviso', i: 0 } : { tipo: 'tema', i: 0 };
  cerrarGuia();
  estado.abierto = true;
  marcar('asistente_abrir', { paso: props.paso });
}

// ─── Burbuja guía: saludo al entrar, después los temas del paso uno a uno. También salta sola con un aviso
// nuevo (alerta o logro), con el "¿Por qué?" de un resultado y al enviar la cotización ───
type Guia = { tipo: 'saludo' | 'tema' | 'invitar' | 'aviso' | 'porque' | 'fin'; i: number; tema?: Tema };
const guia = ref<Guia | null>(null);
const mensaje = computed<(Tema & Partial<Pick<Aviso, 'tono' | 'accion'>>) | null>(() => {
  const g = guia.value;
  if (!g) return null;
  if (g.tipo === 'saludo') return SALUDO;
  if (g.tipo === 'invitar') return { pose: 'piensa', titulo: '', texto: '¿Te ayudo con este paso? Tócame y te explico cómo seguir.' };
  if (g.tipo === 'aviso') return avisos.value[g.i] ?? null;
  if (g.tema) return g.tema;
  return temas.value[g.i] ?? null;
});
// Grande mientras llega o explica; si no, chico en la esquina (dueño 28-10: "llega, explica y se achica")
const grande = computed(() => entrada.value !== 'lista' || !!mensaje.value);
const junto = computed(() => (grande.value ? ancla.value : null));
const textoAvanzar = computed(() => {
  const g = guia.value;
  if (g?.tipo === 'saludo') return '¡Vamos!';
  if (g?.tipo === 'invitar') return 'Sí, ayúdame';
  return g?.tipo === 'tema' && g.i + 1 < temas.value.length ? 'Siguiente' : 'Entendido';
});
function avanzarGuia() {
  const g = guia.value;
  if (!g) return;
  if (g.tipo === 'invitar') return abrir();
  if (g.tipo === 'saludo') { guardar(CLAVE_SALUDO, '1'); guia.value = temas.value.length ? { tipo: 'tema', i: 0 } : null; return; }
  if (g.tipo === 'tema' && g.i + 1 < temas.value.length) guia.value = { tipo: 'tema', i: g.i + 1 };
  else cerrarGuia();
}
function cerrarGuia() {
  if (guia.value?.tipo === 'saludo') guardar(CLAVE_SALUDO, '1');
  if (guia.value?.tipo === 'invitar') emit('visto');
  if (guia.value?.tipo === 'tema') logro.value = '';
  guia.value = null;
  callar();
  setTimeout(revisarAvisos, 400);
}
// Entrada (dueño 28-10): al abrir la página RACKLOG llega caminando desde el fondo (en 3D, FlujoRobot3D) y recién ahí
// saluda. Una sola vez, sin bucle; con "reducir movimiento" aparece directo
const entrada = ref<'espera' | 'camina' | 'lista'>('espera');
function llegó() {
  if (entrada.value === 'lista') return;
  entrada.value = 'lista';
  // Al llegar saluda (una vez por visita); si ya saludó, guía el paso donde quedó
  guia.value = !leer(CLAVE_SALUDO) ? { tipo: 'saludo', i: 0 } : temas.value.length ? { tipo: 'tema', i: 0 } : null;
}
// Al terminar un paso celebra (un salto) antes de explicar el que sigue
const festeja = ref(false);
let tFesteja: ReturnType<typeof setTimeout> | null = null;
const poseAvatar = computed(() => (festeja.value ? 'celebra' : estado.abierto ? actual.value.pose : mensaje.value?.pose ?? (alertas.value ? 'atento' : 'pulgar')));

// Cada paso nuevo, RACKLOG guía desde su primer tema; si avanzó, primero celebra el paso que terminó
const logro = ref('');
watch(() => props.indice, (nuevo, antes) => {
  estado.abierto = false;
  vista.value = { tipo: 'tema', i: 0 };
  callar();
  vistos.clear();
  logro.value = nuevo > antes ? `¡Listo el paso ${antes + 1}, ${PASOS[antes]?.t.toLowerCase() ?? ''}!` : '';
  if (logro.value) {
    festeja.value = true;
    if (tFesteja) clearTimeout(tFesteja);
    tFesteja = setTimeout(() => { festeja.value = false; }, 1300);
  }
  guia.value = temas.value.length ? { tipo: 'tema', i: 0 } : null;
});

// Avisos que saltan solos (dueño 28-10): una alerta nueva (pasillo angosto, racks en rojo, sin salida) aparece
// aunque esté explicando; un logro ("ya cumples", "tu diseño está listo") espera a que termine. Cada aviso salta una
// vez por paso, y solo cuando el diseño se quedó quieto un momento (no a mitad de arrastrar un rack)
const vistos = new Set<string>();
let tAvisos: ReturnType<typeof setTimeout> | null = null;
function revisarAvisos() {
  if (entrada.value !== 'lista' || estado.abierto || guia.value?.tipo === 'saludo' || guia.value?.tipo === 'aviso' || guia.value?.tipo === 'porque' || guia.value?.tipo === 'fin') return;
  const i = avisos.value.findIndex((a) => a.tono !== 'info' && !vistos.has(a.titulo) && (a.tono === 'alerta' || !guia.value));
  if (i < 0) return;
  vistos.add(avisos.value[i].titulo);
  guia.value = { tipo: 'aviso', i };
  marcar('asistente_aviso', { paso: props.paso, aviso: avisos.value[i].titulo });
}
watch(() => avisos.value.map((a) => a.titulo).join('|'), () => {
  // Un aviso que ya se resolvió puede volver a saltar si reaparece
  for (const t of [...vistos]) if (!avisos.value.some((a) => a.titulo === t)) vistos.delete(t);
  if (guia.value?.tipo === 'aviso' && !avisos.value[guia.value.i]) guia.value = null;
  if (tAvisos) clearTimeout(tAvisos);
  tAvisos = setTimeout(revisarAvisos, 1500);
});

// "¿Por qué?" de un resultado (FlujoPorQue): lo explica con los números del cliente
watch(() => estado.explicar?.t, () => {
  const e = estado.explicar;
  const tema = e && porQueDe(e.id, e.datos, p);
  if (!tema) return;
  estado.abierto = false;
  guia.value = { tipo: 'porque', i: 0, tema };
  marcar('asistente_porque', { paso: props.paso, resultado: e.id });
});
// Al enviar la cotización celebra y cuenta lo que sigue
watch(() => p.enviado, (v) => { if (v) { estado.abierto = false; guia.value = { tipo: 'fin', i: 0, tema: FIN }; } });
watch(() => props.invitar, (v) => { if (v && !guia.value && !estado.abierto) guia.value = { tipo: 'invitar', i: 0 }; });

// ─── Voz: parte apagada; el parlante la enciende y lee el mensaje que está a la vista ───
const CLAVE_SALUDO = 'racklog_asistente_saludo';
const CLAVE_VOZ = 'racklog_asistente_voz';
const voz = ref(false);
const ORDEN_VOCES = ['es-cl', 'es-419', 'es-us', 'es-mx', 'es-ar', 'es-co', 'es-es'];
// RACKLOG es un niño (dueño 28-10): voces masculinas en español de Edge/Windows, macOS/iOS y Chrome. El navegador
// no dice el género de la voz, así que se reconoce por el nombre
const HOMBRES = /lorenzo|jorge|tom[aá]s|gonzalo|[aá]lvaro|pablo|ra[uú]l|diego|carlos|juan|andr[eé]s|alonso|gerardo|emilio|arnau|mateo|federico|sergio|rodrigo|enrique|male|hombre/i;
function vozEspañol(): { voz: SpeechSynthesisVoice | null; hombre: boolean } {
  const voces = window.speechSynthesis.getVoices().filter((v) => /^es\b/i.test(v.lang.replace('_', '-')));
  const rango = (v: SpeechSynthesisVoice) => {
    const i = ORDEN_VOCES.indexOf(v.lang.replace('_', '-').toLowerCase());
    // Primero las voces neuronales (Microsoft "Online (Natural)" en Edge, Google en Chrome): las locales de Windows
    // (Pablo, Raúl…) suenan a robot. Entre las naturales, hombre primero
    return (/online|natural|google|premium|enhanced|mejorada/i.test(v.name) ? 0 : 100) + (HOMBRES.test(v.name) ? 0 : 20) + (i < 0 ? ORDEN_VOCES.length : i);
  };
  const voz = voces.sort((a, b) => rango(a) - rango(b))[0] ?? null;
  return { voz, hombre: !!voz && HOMBRES.test(voz.name) };
}
const dicho = computed(() => {
  const m = estado.abierto ? actual.value : mensaje.value;
  if (!m) return '';
  // Lo hablado va con exclamaciones: la voz del navegador las entona y suena alegre, no leída
  if (m === SALUDO) return '¡Hola! ¡Soy Racklog! Y estoy aquí... para ayudarte a diseñar tu bodega.';
  const t = m.titulo.trim();
  const titulo = t && (estado.abierto || guia.value?.tipo !== 'invitar') ? `${/[?!]$/.test(t) ? t : `¡${t}!`} ` : '';
  // "RACKLOG" en mayúsculas lo deletrean algunas voces
  return (titulo + m.texto).replace(/RACKLOG/g, 'Racklog');
});
// Mientras suena la voz, RACKLOG mueve la boca
const hablando = ref(false);
function hablar(texto: string) {
  if (!texto || !('speechSynthesis' in window)) return;
  const s = window.speechSynthesis;
  s.cancel();
  const { voz: v, hombre } = vozEspañol();
  // Frase por frase: pausas naturales entre una y otra, y las voces de Google no se cortan en los textos largos
  const frases = texto.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) ?? [texto];
  frases.forEach((frase, n) => {
    const u = new SpeechSynthesisUtterance(frase.trim());
    u.onstart = () => { hablando.value = true; };
    if (n === frases.length - 1) u.onend = u.onerror = () => { hablando.value = false; };
    if (v) u.voice = v;
    u.lang = v?.lang ?? 'es-CL';
    // Voz de personaje (dueño 28-10): alegre y juvenil, pero sin forzar el tono, que es lo que la vuelve robótica
    u.rate = 1.0;
    u.pitch = hombre ? 1.3 : 1.15;
    s.speak(u);
  });
}
function callar() { hablando.value = false; if (import.meta.client && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }
function alternarVoz() {
  voz.value = !voz.value;
  guardar(CLAVE_VOZ, voz.value ? '1' : '');
  if (voz.value) hablar(dicho.value);
  else callar();
  marcar('asistente_voz', { paso: props.paso, voz: voz.value });
}
watch(dicho, (t) => { if (voz.value) hablar(t); else callar(); });

function guardar(clave: string, valor: string) {
  try { if (valor) sessionStorage.setItem(clave, valor); else sessionStorage.removeItem(clave); } catch { /* sin almacenamiento */ }
}
function leer(clave: string) {
  try { return sessionStorage.getItem(clave); } catch { return null; }
}
// ─── Junto al título del paso: se mide el h1 del paso y RACKLOG queda en el margen izquierdo, a su altura ───
const ancla = ref<{ top: number; ancho: number } | null>(null);
function anclar() {
  const h = document.querySelector('main h1.fl-titulo');
  if (!h || window.innerWidth < 1024) { ancla.value = null; return; }
  const r = h.getBoundingClientRect();
  const ancho = Math.round(r.left - 24);
  // Lo más grande que cabe en el margen, hasta 240 px; la cara queda a la altura del título
  const lado = Math.min(240, ancho);
  // Nunca encima de la barra de pasos (fija arriba en los pasos de formulario)
  const piso = Math.max(72, (document.querySelector('[data-fijo-arriba]')?.getBoundingClientRect().bottom ?? 64) + 4);
  // La burbuja necesita ~220 px: si el margen es más angosto, va abajo a la izquierda
  ancla.value = ancho >= 220 ? { top: Math.max(piso, Math.round(r.top - lado * 0.3)), ancho } : null;
}
const tamaño = computed(() => {
  if (!ancla.value) return undefined;
  const lado = `${Math.min(240, ancla.value.ancho)}px`;
  return { width: lado, height: lado };
});
let tAncla: ReturnType<typeof setTimeout> | null = null;
// El paso entra con una transición (sale el anterior y entra el nuevo): se mide cuando ya está
function anclarLuego() { if (tAncla) clearTimeout(tAncla); tAncla = setTimeout(() => nextTick(anclar), 550); }
watch(() => props.paso, anclarLuego);
let t: ReturnType<typeof setTimeout> | null = null;
onMounted(() => {
  anclarLuego();
  window.addEventListener('resize', anclarLuego);
  // Precarga la lista de voces (Chrome la entrega tarde)
  if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
  voz.value = !!leer(CLAVE_VOZ);
  // Parte a caminar cuando ya sabe dónde pararse (al lado del título) y el aviso de cookies ya se respondió (en el
  // celular ocupan la misma esquina)
  const partir = () => {
    t = setTimeout(() => {
      entrada.value = 'camina';
      // Por si la caminata no avisa al terminar (pestaña en segundo plano, sin WebGL)
      t = setTimeout(llegó, 4500);
    }, 650);
  };
  if (analytics.value !== 'unset') partir();
  else { const parar = watch(analytics, (v) => { if (v !== 'unset') { parar(); partir(); } }); }
});
onBeforeUnmount(() => { for (const x of [t, tAncla, tAvisos, tFesteja]) if (x) clearTimeout(x); window.removeEventListener('resize', anclarLuego); callar(); });
function marcar(event: string, datos: Record<string, unknown>) {
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ??= []).push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>

<style scoped>
/* Al achicarse a la esquina (o crecer para explicar) cambia de tamaño con una transición corta; no queda en bucle */
.rl-tam { transition: width .35s ease, height .35s ease; }
</style>
