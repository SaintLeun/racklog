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
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label class="fl-campo sm:col-span-2">
            <span>¿Cuántos tienes?</span>
            <input v-model.number="t.cantidad" type="number" min="1" step="1" inputmode="numeric" class="form-input" :class="err(t).cantidad && 'fl-error'">
            <small v-if="err(t).cantidad" class="fl-msg">{{ err(t).cantidad }}</small>
          </label>
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
          <!-- Calcular alto y peso desde la caja -->
          <div class="mt-4 rounded-xl bg-neutral-50 p-3">
            <p class="text-sm font-medium text-neutral-800">Calcular alto y peso desde mis cajas</p>
            <div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
              <label class="fl-campo"><span>Largo cm</span><input v-model.number="cajaCalc(t).largo" type="number" min="5" class="form-input"></label>
              <label class="fl-campo"><span>Ancho cm</span><input v-model.number="cajaCalc(t).ancho" type="number" min="5" class="form-input"></label>
              <label class="fl-campo"><span>Alto cm</span><input v-model.number="cajaCalc(t).alto" type="number" min="5" class="form-input"></label>
              <label class="fl-campo"><span>Kg caja</span><input v-model.number="cajaCalc(t).peso" type="number" min="0.1" class="form-input"></label>
              <label class="fl-campo"><span>Apila</span><input v-model.number="cajaCalc(t).apilable" type="number" min="1" class="form-input"></label>
            </div>
            <p v-if="armado(t)" class="mt-2 text-sm text-neutral-700">
              {{ armado(t)!.cajas }} cajas por pallet ({{ armado(t)!.camas }} camas) · {{ fm(armado(t)!.alto) }} m · {{ Math.round(armado(t)!.peso) }} kg
              <button type="button" class="ml-1 font-semibold text-brand-700 underline underline-offset-2" @click="usarArmado(t)">Usar</button>
            </p>
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
import { ref, computed, reactive, onMounted } from 'vue';
import { useProyecto, type TipoPallet } from '~/stores/proyecto';
import { ROTACION } from '~/lib/rack3d/mezcla.js';
import { armarPallet } from '~/lib/tour/pallet.js';

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

// Calculadora por pallet (no se guarda en el proyecto)
const calc = reactive<Record<string, { largo: number; ancho: number; alto: number; peso: number; apilable: number }>>({});
const cajaCalc = (t: TipoPallet) => (calc[t.id] ??= { largo: 60, ancho: 40, alto: 30, peso: 15, apilable: 5 });
function armado(t: TipoPallet) {
  const c = calc[t.id];
  if (!c || !(c.largo > 0 && c.ancho > 0 && c.alto > 0)) return null;
  const r = armarPallet({ base: { frente: t.frente, fondo: t.fondo }, caja: { largo: c.largo / 100, ancho: c.ancho / 100, alto: c.alto / 100 }, pesoCaja: c.peso || 0, apilable: c.apilable || 1 });
  return r.cajas > 0 ? r : null;
}
function usarArmado(t: TipoPallet) {
  const a = armado(t);
  if (!a) return;
  t.alto = +a.alto.toFixed(2);
  t.peso = Math.round(a.peso);
  t.noSe = (t.noSe ?? []).filter((c) => c !== 'alto' && c !== 'peso');
  marcar('pallet_armado', { cajas: a.cajas });
}

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
