<template>
  <div>
    <h1 class="fl-titulo">{{ conCajas ? 'Tus cajas' : 'Tus pallets' }}</h1>
    <p class="fl-bajada">
      {{ conCajas
        ? 'Cuéntanos qué guardas en las repisas. Si no sabes un dato, usa "No sé" y lo confirma tu ejecutivo.'
        : 'Agrega cada tipo de pallet que guardas. Si no sabes un dato, usa "No sé" y lo confirma tu ejecutivo.' }}
    </p>

    <!-- Pallets -->
    <TransitionGroup v-if="!conCajas" tag="div" name="fl-lista" class="mt-6 space-y-4">
      <article v-for="(t, i) in p.pallets" :key="t.id" class="fl-card">
        <div class="flex items-center gap-3">
          <span class="h-4 w-4 flex-shrink-0 rounded" :style="{ background: t.color }" aria-hidden="true" />
          <input v-model.trim="t.nombre" class="fl-input-titulo" :aria-label="`Nombre del pallet ${i + 1}`">
          <button v-if="p.pallets.length > 1" type="button" class="fl-quitar" :aria-label="`Quitar ${t.nombre}`" @click="p.pallets.splice(i, 1)">Quitar</button>
        </div>
        <!-- Medida: frente (lo que se ve desde el pasillo) y fondo (lo que entra al rack) -->
        <div class="mt-4 grid items-center gap-4 sm:grid-cols-[1fr_220px]">
          <div>
            <p class="text-[15px] font-medium text-neutral-700">Medida del pallet</p>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <button
                v-for="b in MEDIDAS" :key="b.t" type="button"
                :class="['fl-chip !min-h-10 !text-sm', t.frente === b.frente && t.fondo === b.fondo && 'fl-chip--sel']"
                :aria-pressed="t.frente === b.frente && t.fondo === b.fondo"
                @click="t.frente = b.frente; t.fondo = b.fondo"
              >{{ b.t }}</button>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <label class="fl-campo">
                <span>Frente (m) <FlujoInfo>El lado que ves desde el pasillo: por ahí entran las horquillas.</FlujoInfo></span>
                <input v-model.number="t.frente" type="number" min="0.6" max="1.6" step="0.05" inputmode="decimal" class="form-input" :class="err(t).frente && 'fl-error'">
              </label>
              <label class="fl-campo">
                <span>Fondo (m) <FlujoInfo>Lo que el pallet entra hacia adentro del rack. Define el fondo del marco.</FlujoInfo></span>
                <input v-model.number="t.fondo" type="number" min="0.6" max="1.6" step="0.05" inputmode="decimal" class="form-input" :class="err(t).fondo && 'fl-error'">
              </label>
            </div>
            <small v-if="err(t).frente || err(t).fondo" class="fl-msg">{{ err(t).frente || err(t).fondo }}</small>
          </div>
          <div class="flex flex-col items-center gap-2">
            <FlujoPalletPlanta :frente="t.frente" :fondo="t.fondo" />
            <button type="button" class="fl-chip !min-h-10 !w-auto !px-4 !text-sm" @click="[t.frente, t.fondo] = [t.fondo, t.frente]">↻ Girar pallet</button>
          </div>
        </div>
        <label class="fl-campo mt-4">
          <span>¿Cuántos productos distintos (SKU) van en este tipo de pallet? <FlujoInfo>Si son 120 pallets de 4 sabores distintos, son 4 productos. Sirve para saber si conviene guardarlos uno detrás de otro.</FlujoInfo></span>
          <input v-model.number="t.skus" type="number" min="1" step="1" inputmode="numeric" placeholder="1" class="form-input">
        </label>
        <label class="fl-campo mt-4">
          <span>¿Cuántos pallets de este tipo tienes?</span>
          <input v-model.number="t.cantidad" type="number" min="1" step="1" inputmode="numeric" class="form-input" :class="err(t).cantidad && 'fl-error'">
          <small v-if="err(t).cantidad" class="fl-msg">{{ err(t).cantidad }}</small>
        </label>

        <!-- La carga: desde la caja (pallet armado en 3D) o el alto y peso si ya los sabe -->
        <div class="mt-5 grid grid-cols-2 gap-2" role="group" aria-label="Cómo definir la carga">
          <button type="button" :class="['fl-chip !min-h-11 !text-sm', t.desdeCaja && 'fl-chip--sel']" :aria-pressed="!!t.desdeCaja" @click="usarCajas(t)">Armar desde mis cajas</button>
          <button type="button" :class="['fl-chip !min-h-11 !text-sm', !t.desdeCaja && 'fl-chip--sel']" :aria-pressed="!t.desdeCaja" @click="t.desdeCaja = false">Ya sé el alto y peso</button>
        </div>

        <div v-if="t.desdeCaja && t.caja" class="mt-4 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <!-- Pallet en 3D: primero en celular -->
          <div class="order-first lg:order-last">
            <div class="aspect-[4/3] w-full">
              <FlujoPallet3D
                :frente="t.frente" :fondo="t.fondo" :caja="t.caja" :etiqueta="`Pallet de ${t.nombre} armado con sus cajas`"
                :cols="armado(t)?.cols ?? 0" :filas="armado(t)?.filas ?? 0" :camas="armado(t)?.camas ?? 0" :largo-en-frente="armado(t)?.largoEnFrente ?? true"
              />
            </div>
            <dl v-if="armado(t)" class="mt-3 grid grid-cols-3 gap-2">
              <div class="fl-dato"><dt>Cajas</dt><dd><FlujoContador :valor="armado(t)!.cajas" /></dd><p class="text-xs text-neutral-500">{{ armado(t)!.cajas / Math.max(1, armado(t)!.camas) }} × {{ armado(t)!.camas }} camas</p></div>
              <div class="fl-dato"><dt>Alto</dt><dd>{{ fm(armado(t)!.alto) }} m</dd><p class="text-xs text-neutral-500">{{ armado(t)!.limite === 'apilable' ? 'lo que aguanta la caja' : 'tope 1,8 m' }}</p></div>
              <div class="fl-dato"><dt>Peso</dt><dd>{{ n(armado(t)!.peso) }} kg</dd><p class="text-xs text-neutral-500">con tarima</p></div>
              <div class="fl-dato col-span-3 flex items-baseline justify-between gap-3 sm:col-span-3">
                <dt>Densidad de la carga</dt><dd class="!text-base">{{ n(armado(t)!.densidad) }} kg/m³ · usa {{ Math.round(armado(t)!.uso * 100) }} % del pallet</dd>
              </div>
            </dl>
            <p v-else class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">Esa caja no cabe en el pallet: revisa sus medidas o la del pallet.</p>
          </div>

          <div class="space-y-4">
            <div>
              <p class="text-[15px] font-medium text-neutral-700">Tu caja (cm)</p>
              <div class="mt-2 grid grid-cols-3 gap-2">
                <label class="fl-campo"><span class="!text-sm">Largo</span><input :value="cm(t.caja.largo)" type="number" min="5" max="160" inputmode="numeric" class="form-input" @input="t.caja.largo = mts($event)"></label>
                <label class="fl-campo"><span class="!text-sm">Ancho</span><input :value="cm(t.caja.ancho)" type="number" min="5" max="160" inputmode="numeric" class="form-input" @input="t.caja.ancho = mts($event)"></label>
                <label class="fl-campo"><span class="!text-sm">Alto</span><input :value="cm(t.caja.alto)" type="number" min="5" max="160" inputmode="numeric" class="form-input" @input="t.caja.alto = mts($event)"></label>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <label class="fl-campo"><span class="!text-sm">Kg por caja</span><input v-model.number="t.caja.peso" type="number" min="0.1" step="0.5" inputmode="decimal" class="form-input"></label>
              <div class="fl-campo">
                <span class="!text-sm">¿Cuántas aguanta apiladas? <FlujoInfo>Cuántas cajas se pueden poner una sobre otra sin que se aplaste la de abajo.</FlujoInfo></span>
                <div class="flex gap-2">
                  <input v-model.number="t.caja.apilable" type="number" min="1" max="30" inputmode="numeric" class="form-input" @input="sabe(t, 'apilable')">
                  <button type="button" :class="['fl-nose', t.noSe?.includes('apilable') && 'fl-nose--sel']" @click="t.caja.apilable = 5; marcarNoSe(t, 'apilable')">No sé</button>
                </div>
              </div>
            </div>
            <!-- Cuantos pallets: desde las importaciones (contenedores que llegan y lo que tardan en salir) -->
            <details class="fl-mas rounded-xl bg-neutral-50 px-3" :open="!!t.importacion">
              <summary @click="t.importacion ??= { contenedor: 'c40', n: 1, entre: 8, bodega: 8, actuales: 0, margen: 0.1, crecimiento: 0.2 }">¿No sabes cuántos pallets? Calcúlalo desde tus importaciones</summary>
              <div v-if="t.importacion" class="space-y-3 pb-3">
                <div class="grid grid-cols-3 gap-2">
                  <button v-for="(c, k) in CONTENEDORES" :key="k" type="button" :class="['fl-chip !min-h-10 !text-sm', t.importacion.contenedor === k && 'fl-chip--sel']" @click="t.importacion.contenedor = k">{{ c.t }}</button>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <label class="fl-campo"><span class="!text-sm">Contenedores por llegada</span><input v-model.number="t.importacion.n" type="number" min="1" class="form-input"></label>
                  <label class="fl-campo"><span class="!text-sm">Llegan cada</span>
                    <select v-model.number="t.importacion.entre" class="form-input"><option v-for="s in SEMANAS" :key="s.v" :value="s.v">{{ s.t }}</option></select>
                  </label>
                  <label class="fl-campo"><span class="!text-sm">Tarda en salir</span>
                    <select v-model.number="t.importacion.bodega" class="form-input"><option v-for="s in SEMANAS" :key="s.v" :value="s.v">{{ s.t }}</option></select>
                  </label>
                  <label class="fl-campo"><span class="!text-sm">Posiciones que ya tienes</span><input v-model.number="t.importacion.actuales" type="number" min="0" class="form-input"></label>
                  <label class="fl-campo"><span class="!text-sm">Margen (%)</span><input :value="Math.round(t.importacion.margen * 100)" type="number" min="0" max="100" class="form-input" @input="t.importacion.margen = (Number(($event.target as HTMLInputElement).value) || 0) / 100"></label>
                  <label class="fl-campo"><span class="!text-sm">Crecimiento anual (%)</span><input :value="Math.round(t.importacion.crecimiento * 100)" type="number" min="0" max="200" class="form-input" @input="t.importacion.crecimiento = (Number(($event.target as HTMLInputElement).value) || 0) / 100"></label>
                </div>
                <div v-if="demanda(t)" class="rounded-lg bg-white p-3 text-sm text-neutral-700 ring-1 ring-neutral-200">
                  <p>{{ n(demanda(t)!.cajas) }} cajas en bodega · {{ n(demanda(t)!.pallets) }} pallets</p>
                  <p class="mt-1 font-semibold text-neutral-900">Necesitas {{ n(demanda(t)!.necesarias) }} posiciones hoy: te faltan {{ n(demanda(t)!.aCrecer) }}</p>
                  <p class="mt-1 text-neutral-500">En 1 año: {{ n(demanda(t)!.en1) }} · en 2 años: {{ n(demanda(t)!.en2) }}</p>
                  <button type="button" class="fl-btn mt-3 !min-h-10 w-full !text-sm" @click="t.cantidad = Math.max(1, demanda(t)!.aCrecer)">Usar las {{ n(demanda(t)!.aCrecer) }} que faltan</button>
                </div>
              </div>
            </details>
            <fieldset>
              <legend class="text-[15px] font-medium text-neutral-700">Cómo van en el pallet</legend>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  v-for="o in orientaciones({ frente: t.frente, fondo: t.fondo }, t.caja)" :key="String(o.largoEnFrente)" type="button"
                  :class="['fl-chip !min-h-11 !text-sm', (armado(t)?.largoEnFrente ?? true) === o.largoEnFrente && 'fl-chip--sel']"
                  :disabled="!o.cajas" @click="t.caja.orientacion = o.largoEnFrente ? 'largo' : 'ancho'"
                >{{ o.largoEnFrente ? 'Largo al frente' : 'Ancho al frente' }} · {{ o.cajas }} por cama</button>
              </div>
            </fieldset>
          </div>
        </div>

        <div v-else class="mt-4 grid gap-4 sm:grid-cols-2">
          <div class="fl-campo">
            <span>Alto con la carga (m)</span>
            <div class="flex gap-2">
              <input v-model.number="t.alto" type="number" min="0.3" max="2.5" step="0.05" inputmode="decimal" class="form-input" :class="err(t).alto && 'fl-error'" :aria-label="`Alto del ${t.nombre} en metros`" @input="sabe(t, 'alto')">
              <button type="button" :class="['fl-nose', t.noSe?.includes('alto') && 'fl-nose--sel']" @click="noSe(t, 'alto', 1.2)">No sé</button>
            </div>
            <small v-if="err(t).alto" class="fl-msg">{{ err(t).alto }}</small>
          </div>
          <div class="fl-campo">
            <span>Peso con la carga (kg)</span>
            <div class="flex gap-2">
              <input v-model.number="t.peso" type="number" min="1" max="2000" step="10" inputmode="numeric" class="form-input" :class="err(t).peso && 'fl-error'" :aria-label="`Peso del ${t.nombre} en kilos`" @input="sabe(t, 'peso')">
              <button type="button" :class="['fl-nose', t.noSe?.includes('peso') && 'fl-nose--sel']" @click="noSe(t, 'peso', 800)">No sé</button>
            </div>
            <small v-if="err(t).peso" class="fl-msg">{{ err(t).peso }}</small>
          </div>
        </div>
        <fieldset class="mt-4">
          <legend class="text-sm font-medium text-neutral-700">¿Qué tan seguido sale?</legend>
          <div class="mt-2 grid grid-cols-3 gap-2">
            <button v-for="(r, k) in ROTACION" :key="k" type="button" :class="['fl-chip !min-h-11 !text-sm', t.rotacion === k && 'fl-chip--sel']" :aria-pressed="t.rotacion === k" @click="t.rotacion = k as any">{{ r.t }}</button>
          </div>
        </fieldset>
        <details class="fl-mas mt-4">
          <summary>Más opciones</summary>
          <div class="mt-3 grid gap-4 sm:grid-cols-2">
            <label class="flex items-start gap-2 text-sm text-neutral-700">
              <input v-model="t.sinPallet" type="checkbox" class="mt-1 h-4 w-4 accent-brand-600">
              <span>Son cajas sin pallet (van directo sobre el nivel: lleva plano de carga)</span>
            </label>
            <label class="fl-campo">
              <span>¿Sobresale del pallet? (cm por lado)</span>
              <input :value="Math.round((t.sobresale ?? 0) * 100)" type="number" min="0" max="15" step="1" class="form-input" @input="t.sobresale = Math.max(0, Number(($event.target as HTMLInputElement).value) || 0) / 100">
            </label>
          </div>
        </details>
      </article>
    </TransitionGroup>

    <!-- Cajas (angulo ranurado) -->
    <TransitionGroup v-else tag="div" name="fl-lista" class="mt-6 space-y-4">
      <article v-for="(c, i) in p.cajas" :key="c.id" class="fl-card">
        <div class="flex items-center gap-3">
          <input v-model.trim="c.nombre" class="fl-input-titulo" :aria-label="`Nombre de la caja ${i + 1}`">
          <button v-if="p.cajas.length > 1" type="button" class="fl-quitar" @click="p.cajas.splice(i, 1)">Quitar</button>
        </div>
        <div class="mt-4 grid grid-cols-3 gap-3">
          <label class="fl-campo"><span>Largo (cm)</span><input :value="cm(c.largo)" type="number" min="5" max="120" class="form-input" @input="c.largo = mts($event)"></label>
          <label class="fl-campo"><span>Ancho (cm)</span><input :value="cm(c.ancho)" type="number" min="5" max="120" class="form-input" @input="c.ancho = mts($event)"></label>
          <label class="fl-campo"><span>Alto (cm)</span><input :value="cm(c.alto)" type="number" min="5" max="120" class="form-input" @input="c.alto = mts($event)"></label>
        </div>
        <div class="mt-3 grid grid-cols-3 gap-3">
          <label class="fl-campo"><span>Kg por caja</span><input v-model.number="c.peso" type="number" min="0.1" step="0.5" class="form-input"></label>
          <label class="fl-campo"><span>¿Cuántas?</span><input v-model.number="c.cantidad" type="number" min="1" class="form-input" :class="!(c.cantidad >= 1) && 'fl-error'"></label>
          <label class="fl-campo"><span>Apila hasta</span><input v-model.number="c.apilable" type="number" min="1" max="20" class="form-input"></label>
        </div>
      </article>
    </TransitionGroup>

    <button type="button" class="fl-agregar mt-4" @click="conCajas ? p.agregarCaja() : p.agregarPallet()">
      + Agregar otro {{ conCajas ? 'tipo de caja' : 'tipo de pallet' }}
    </button>
    <button v-if="p.sistema !== 'AR'" type="button" class="mt-3 block text-sm text-neutral-600 underline underline-offset-2" @click="verCajas = !verCajas">
      {{ conCajas ? 'Volver a mis pallets' : 'También guardo cajas a mano (ángulo ranurado)' }}
    </button>

    <FlujoAcciones :deshabilitado="!valido" motivo="Revisa los datos marcados en rojo." @atras="emit('atras')" @siguiente="seguir" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue';
import { useProyecto, type TipoPallet } from '~/stores/proyecto';
import { ROTACION } from '~/lib/rack3d/mezcla.js';
import { armarPallet, orientaciones, demandaImportacion, CONTENEDORES } from '~/lib/tour/pallet.js';

const emit = defineEmits<{ siguiente: []; atras: [] }>();
const p = useProyecto();
const verCajas = ref(false);
const conCajas = computed(() => p.sistema === 'AR' || verCajas.value);

onMounted(() => {
  // Valores por defecto: se puede avanzar con "Siguiente" sin tocar nada
  if (p.sistema === 'AR' && !p.cajas.length) p.agregarCaja();
  if (p.sistema !== 'AR' && !p.pallets.length) p.agregarPallet({ nombre: 'Pallet 1' });
});

const fm = (v: number) => v.toFixed(2).replace('.', ',');
const n = (v: number) => Math.round(v).toLocaleString('es-CL');
const cm = (v: number) => Math.round(v * 100);
const mts = (e: Event) => Math.max(0.05, Number((e.target as HTMLInputElement).value) / 100 || 0.05);
// Medidas tipicas: frente × fondo (el frente es el lado del pasillo)
const MEDIDAS = [
  { t: '1,0 frente × 1,2 fondo', frente: 1.0, fondo: 1.2 },
  { t: '1,2 frente × 1,0 fondo', frente: 1.2, fondo: 1.0 },
  { t: '0,8 frente × 1,2 fondo', frente: 0.8, fondo: 1.2 },
  { t: '1,0 × 1,0', frente: 1.0, fondo: 1.0 },
];
function noSe(t: TipoPallet, campo: 'alto' | 'peso', tipico: number) {
  t[campo] = tipico;
  t.noSe = [...new Set([...(t.noSe ?? []), campo])];
}
function sabe(t: TipoPallet, campo: string) {
  t.noSe = (t.noSe ?? []).filter((c) => c !== campo);
}

// ─── Pallet armado desde la caja (se guarda en el proyecto: t.caja) ───
const CAJA_TIPICA = { largo: 0.6, ancho: 0.4, alto: 0.3, peso: 15, apilable: 5, orientacion: 'auto' as const };
function armado(t: TipoPallet) {
  const c = t.caja;
  if (!c || !(c.largo > 0 && c.ancho > 0 && c.alto > 0)) return null;
  const largoEnFrente = c.orientacion === 'largo' ? true : c.orientacion === 'ancho' ? false : undefined;
  const r = armarPallet({ base: { frente: t.frente, fondo: t.fondo }, caja: c, pesoCaja: c.peso || 0, apilable: c.apilable || 1, largoEnFrente });
  return r.cajas > 0 ? r : null;
}
const SEMANAS = [{ v: 1, t: '1 semana' }, { v: 2, t: '2 semanas' }, { v: 4, t: '1 mes' }, { v: 8, t: '2 meses' }, { v: 13, t: '3 meses' }, { v: 26, t: '6 meses' }, { v: 52, t: '1 año' }];
function demanda(t: TipoPallet) {
  const a = armado(t), i = t.importacion;
  if (!a || !i || !t.caja) return null;
  return demandaImportacion({ contenedor: i.contenedor, nContenedores: i.n, caja: t.caja, pesoCaja: t.caja.peso, apilable: t.caja.apilable, semanasEntre: i.entre, semanasBodega: i.bodega, cajasPorPallet: a.cajas, actuales: i.actuales, margen: i.margen, crecimiento: i.crecimiento });
}
function usarCajas(t: TipoPallet) {
  t.caja ??= { ...CAJA_TIPICA };
  t.desdeCaja = true;
}
function marcarNoSe(t: TipoPallet, campo: string) {
  t.noSe = [...new Set([...(t.noSe ?? []), campo])];
}
// Con la caja definida, el alto y el peso del pallet salen del armado (y se ven al instante)
watchEffect(() => {
  p.pallets.forEach((t) => {
    if (!t.desdeCaja) return;
    const a = armado(t);
    if (!a) return;
    const alto = +a.alto.toFixed(2), peso = Math.round(a.peso);
    if (t.alto !== alto) t.alto = alto;
    if (t.peso !== peso) t.peso = peso;
  });
});
let marcado = false;
watch(() => p.pallets.map((t) => (t.desdeCaja && t.caja ? JSON.stringify(t.caja) : '')).join(), () => {
  if (marcado) return;
  marcado = true;
  marcar('pallet_armado', {});
});

// Errores en linea: no se avanza con datos invalidos
function err(t: TipoPallet) {
  const e: Record<string, string> = {};
  if (!(t.alto >= 0.3 && t.alto <= 2.5)) e.alto = 'Entre 0,3 y 2,5 m.';
  if (!(t.peso > 0 && t.peso <= 2000)) e.peso = 'Entre 1 y 2.000 kg.';
  if (!(t.cantidad >= 1)) e.cantidad = 'Al menos 1.';
  if (!(t.frente >= 0.6 && t.frente <= 1.6)) e.frente = 'El frente va entre 0,6 y 1,6 m.';
  if (!(t.fondo >= 0.6 && t.fondo <= 1.6)) e.fondo = 'El fondo va entre 0,6 y 1,6 m.';
  return e;
}
const valido = computed(() => (conCajas.value
  ? p.cajas.length > 0 && p.cajas.every((c) => c.cantidad >= 1 && c.largo > 0 && c.ancho > 0 && c.alto > 0)
  : p.pallets.length > 0 && p.pallets.every((t) => !Object.keys(err(t)).length)));

function seguir() {
  if (verCajas.value && !p.pallets.length && p.sistema !== 'AR') verCajas.value = false;
  emit('siguiente');
}
function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>
