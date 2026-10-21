<template>
  <div>
    <!-- Mercaderías -->
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="(m, i) in items" :key="m.id" type="button"
        :class="['h-9 rounded-full px-4 text-sm font-semibold transition', i === sel ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:ring-neutral-400']"
        @click="sel = i"
      >{{ m.nombre || `Producto ${i + 1}` }}</button>
      <button type="button" class="h-9 rounded-full px-4 text-sm font-semibold text-brand-700 ring-1 ring-dashed ring-brand-300 hover:bg-brand-50" @click="agregarItem">+ Otro producto</button>
    </div>

    <div class="mt-4 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <!-- Formulario -->
      <div class="card space-y-5 p-5">
        <label class="ap-campo">
          <span>¿Qué producto es?</span>
          <input v-model.trim="it.nombre" type="text" placeholder="Ej. cajas de cerámica">
        </label>

        <fieldset>
          <legend class="ap-leyenda">La caja</legend>
          <div class="mt-2 grid grid-cols-3 gap-2">
            <label class="ap-campo"><span>Largo cm</span><input v-model.number="it.largo" type="number" min="5" step="1"></label>
            <label class="ap-campo"><span>Ancho cm</span><input v-model.number="it.ancho" type="number" min="5" step="1"></label>
            <label class="ap-campo"><span>Alto cm</span><input v-model.number="it.alto" type="number" min="5" step="1"></label>
          </div>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <label class="ap-campo"><span>Peso por caja (kg)</span><input v-model.number="it.peso" type="number" min="0.1" step="0.5"></label>
            <label class="ap-campo"><span>Máx. cajas de alto</span><input v-model.number="it.apilable" type="number" min="1" max="30" step="1"></label>
          </div>
          <p class="mt-1.5 text-xs text-neutral-500">Cuántas cajas aguanta una sobre otra sin aplastarse. Suele venir impreso en la caja.</p>
        </fieldset>

        <template v-if="modo === 'pallet'">
          <fieldset>
            <legend class="ap-leyenda">El pallet</legend>
            <div class="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
              <button
                v-for="b in BASES" :key="b.v" type="button"
                :class="['min-h-9 rounded-lg px-1 text-xs font-semibold transition', it.base === b.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']"
                @click="it.base = b.v"
              >{{ b.t }}</button>
            </div>
          </fieldset>
        </template>
        <template v-else>
          <label class="ap-campo">
            <span>Fondo de la repisa</span>
            <select v-model.number="it.fondoBandeja">
              <option :value="0.3">30 cm</option><option :value="0.4">40 cm</option><option :value="0.5">50 cm</option><option :value="0.6">60 cm</option>
            </select>
          </label>
        </template>

        <fieldset>
          <legend class="ap-leyenda">¿Cuánto necesitas guardar?</legend>
          <div class="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
            <button
              v-for="o in MODOS_STOCK.filter((x) => modo === 'pallet' || x.v !== 'pallets')" :key="o.v" type="button"
              :class="['min-h-9 rounded-lg px-1 text-xs font-semibold transition', it.modoStock === o.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']"
              @click="it.modoStock = o.v"
            >{{ o.t }}</button>
          </div>

          <template v-if="it.modoStock === 'importacion'">
            <div class="mt-2 grid grid-cols-2 gap-2">
              <label class="ap-campo">
                <span>Contenedor</span>
                <select v-model="it.contenedor">
                  <option v-for="(c, k) in CONTENEDORES" :key="k" :value="k">{{ c.t }}</option>
                </select>
              </label>
              <label class="ap-campo"><span>¿Cuántos llegan?</span><input v-model.number="it.nContenedores" type="number" min="1" step="1"></label>
            </div>
            <label class="ap-campo mt-2">
              <span>Cajas por contenedor</span>
              <input v-model.number="it.cajasContenedor" type="number" min="1" step="10" :placeholder="`Estimado: ${estimadoCont.cajas.toLocaleString('es-CL')}`">
            </label>
            <p class="mt-1 text-xs text-neutral-500">Si no lo sabes, lo estimamos con la medida de tu caja: <b>{{ estimadoCont.cajas.toLocaleString('es-CL') }} cajas</b>{{ estimadoCont.limitadoPorPeso ? ' (limita el peso)' : '' }}.</p>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <label class="ap-campo">
                <span>¿Cada cuánto llega?</span>
                <select v-model.number="it.semanasEntre"><option v-for="o in SEMANAS" :key="o.v" :value="o.v">{{ o.t }}</option></select>
              </label>
              <label class="ap-campo">
                <span>¿Cuánto tarda en salir?</span>
                <select v-model.number="it.semanasBodega"><option v-for="o in SEMANAS" :key="o.v" :value="o.v">{{ o.t }}</option></select>
              </label>
            </div>
            <p v-if="crecer.juntas > 1" class="mt-1 text-xs font-medium text-amber-700">Llega una importación antes de que salga la anterior: en tu peak conviven {{ crecer.juntas }}.</p>
          </template>
          <label v-else class="ap-campo mt-2">
            <span>{{ it.modoStock === 'cajas' ? 'Cajas a guardar' : 'Pallets a guardar' }}</span>
            <input v-model.number="it.stock" type="number" min="0" step="10" placeholder="Ej. 900">
          </label>

          <div class="mt-2 grid grid-cols-2 gap-2">
            <label class="ap-campo"><span>Posiciones que ya tienes</span><input v-model.number="it.actuales" type="number" min="0" step="1" placeholder="0"></label>
            <label class="ap-campo">
              <span>Margen extra</span>
              <select v-model.number="it.margen"><option :value="0">Sin margen</option><option :value="0.1">10%</option><option :value="0.2">20%</option><option :value="0.3">30%</option></select>
            </label>
          </div>
          <label class="ap-campo mt-2">
            <span>¿Cuánto esperas crecer al año?</span>
            <select v-model.number="it.crecimiento"><option :value="0">No espero crecer</option><option :value="0.1">10%</option><option :value="0.2">20%</option><option :value="0.3">30%</option><option :value="0.5">50%</option><option :value="1">Doblar</option></select>
          </label>
        </fieldset>

        <fieldset>
          <legend class="ap-leyenda">Tu bodega</legend>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <label class="ap-campo"><span>Altura libre (m)</span><input v-model.number="bodega.altura" type="number" min="2" max="20" step="0.1"></label>
          </div>
          <label v-if="modo === 'pallet'" class="ap-campo mt-2">
            <span>Equipo</span>
            <select v-model="bodega.equipo">
              <option v-for="(e, k) in EQUIPOS" :key="k" :value="k">{{ e.t }}</option>
            </select>
          </label>
        </fieldset>
      </div>

      <!-- Resultado -->
      <div class="space-y-4">
        <div v-if="modo === 'pallet' && p.cajas && crecer.pallets" class="card overflow-hidden">
          <div class="flex gap-1 border-b border-neutral-200 bg-neutral-50 p-1.5 text-xs font-semibold">
            <span class="self-center px-2 text-neutral-500">Ver como:</span>
            <button v-for="o in VISTAS" :key="o.v" type="button" :class="['rounded-lg px-3 py-1.5 transition', vista === o.v ? 'bg-white text-brand-800 shadow-sm ring-1 ring-neutral-200' : 'text-neutral-600 hover:text-neutral-900']" @click="vista = o.v">{{ o.t }}</button>
          </div>

          <!-- Supply chain: capacidad en el tiempo -->
          <div v-if="vista === 'supply'" class="bg-neutral-900 p-5 text-white">
            <p class="text-xs font-semibold uppercase tracking-wider text-brand-300">Capacidad que necesitas{{ it.nombre ? ` · ${it.nombre}` : '' }}</p>
            <div class="mt-4 flex h-44 items-end gap-4">
              <div v-for="h in horizonte" :key="h.t" class="flex flex-1 flex-col items-center gap-1.5">
                <span class="text-sm font-bold">{{ h.v.toLocaleString('es-CL') }}</span>
                <div class="relative w-full rounded-t-lg bg-brand-600" :style="{ height: `${Math.max(6, (h.v / horizonteMax) * 120)}px` }">
                  <div v-if="it.actuales" class="absolute inset-x-0 bottom-0 rounded-t-sm bg-white/30" :style="{ height: `${Math.min(100, (it.actuales / h.v) * 100)}%` }" />
                </div>
                <span class="text-xs text-neutral-300">{{ h.t }}</span>
              </div>
            </div>
            <p class="mt-3 text-sm text-neutral-300">Posiciones de pallet necesarias<template v-if="it.actuales"> (lo claro: las {{ it.actuales }} que ya tienes)</template>.</p>
            <p class="mt-2 text-sm">
              <b>Etapa 1:</b> {{ crecer.aCrecer.toLocaleString('es-CL') }} posiciones ({{ m.cuerpos }} cuerpos).
              <template v-if="crecer.etapa2"> <b>Etapa 2:</b> deja espacio para {{ crecer.etapa2.toLocaleString('es-CL') }} más ({{ Math.ceil(crecer.etapa2 / m.porCuerpo) }} cuerpos) en 2 años.</template>
            </p>
            <p class="mt-1 text-sm text-neutral-300">Bodega con pasillos a 2 años: ≈ <b class="text-white">{{ m2Total.toLocaleString('es-CL') }} m²</b> · {{ (crecer.necesarias2 / Math.max(1, m2Total)).toLocaleString('es-CL', { maximumFractionDigits: 2 }) }} posiciones por m²</p>
          </div>

          <!-- Jefe de bodega: qué necesito instalar -->
          <div v-else-if="vista === 'bodega'" class="bg-neutral-900 p-5 text-white">
            <p class="text-xs font-semibold uppercase tracking-wider text-brand-300">{{ it.modoStock === 'importacion' ? 'Para tu importación' : 'Para tu stock' }}{{ it.nombre ? ` · ${it.nombre}` : '' }}</p>
            <p class="mt-1 text-sm text-neutral-300">Necesitas crecer</p>
            <p class="text-4xl font-bold tracking-tight">{{ crecer.aCrecer.toLocaleString('es-CL') }} <span class="text-xl font-semibold text-neutral-300">posiciones de pallet</span></p>
            <p class="mt-1 text-sm text-neutral-300">≈ <b class="text-white">{{ m.cuerpos }} cuerpos</b> de {{ m.alturas }} alturas · ≈ <b class="text-white">{{ m2.toLocaleString('es-CL') }} m²</b> con pasillos de {{ dec(EQUIPOS[bodega.equipo].pasillo) }} m para tu {{ EQUIPOS[bodega.equipo].t.toLowerCase() }}</p>
          </div>

          <!-- Compras / dueño: qué cotizar -->
          <div v-else class="p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">Qué cotizar{{ it.nombre ? ` · ${it.nombre}` : '' }}</p>
            <p class="mt-1 text-sm text-neutral-600">Usa esta misma especificación para comparar cotizaciones: así comparas lo mismo.</p>
            <table class="mt-3 w-full text-sm">
              <tbody class="divide-y divide-neutral-100">
                <tr v-for="f in especificacion" :key="f[0]"><td class="py-1.5 text-neutral-600">{{ f[0] }}</td><td class="py-1.5 text-right font-semibold text-neutral-900">{{ f[1] }}</td></tr>
              </tbody>
            </table>
          </div>

          <ol class="grid grid-cols-2 gap-px border-t border-neutral-200 bg-neutral-200 text-sm sm:grid-cols-4">
            <li v-if="it.modoStock === 'importacion'" class="ap-paso"><span>{{ it.nContenedores }} × {{ CONTENEDORES[it.contenedor].t }}{{ crecer.juntas > 1 ? ` × ${crecer.juntas} juntas` : '' }}</span><b>{{ crecer.cajas.toLocaleString('es-CL') }} cajas</b></li>
            <li v-else-if="it.modoStock === 'cajas'" class="ap-paso"><span>Tu stock</span><b>{{ crecer.cajas.toLocaleString('es-CL') }} cajas</b></li>
            <li class="ap-paso"><span>{{ it.modoStock === 'pallets' ? 'Tu stock' : `÷ ${p.cajas} por pallet` }}</span><b>{{ crecer.pallets.toLocaleString('es-CL') }} pallets</b></li>
            <li class="ap-paso"><span>+ {{ Math.round(it.margen * 100) }}% margen</span><b>{{ crecer.necesarias.toLocaleString('es-CL') }} posiciones</b></li>
            <li class="ap-paso"><span>− {{ (it.actuales || 0).toLocaleString('es-CL') }} que ya tienes</span><b class="text-brand-700">{{ crecer.aCrecer.toLocaleString('es-CL') }} a crecer</b></li>
          </ol>
          <p v-if="crecer.aCrecer === 0" class="p-4 text-sm font-medium text-green-700">Con tus posiciones actuales te alcanza hoy.</p>
        </div>

        <div v-if="modo === 'pallet'" class="card p-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">Tu pallet</p>
              <p class="mt-0.5 text-xl font-bold text-neutral-900">{{ p.cajas }} cajas · {{ cm(p.alto) }} cm · {{ kg(p.peso) }}</p>
            </div>
            <span v-if="p.cajas" class="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">{{ p.cajas / p.camas }} por cama × {{ p.camas }} camas</span>
          </div>

          <div class="mt-3 grid gap-4 sm:grid-cols-[1fr_200px]">
            <svg :viewBox="iso.viewBox" class="h-72 w-full" role="img" :aria-label="`Pallet con ${p.cajas} cajas`">
              <g v-for="(f, i) in iso.caras" :key="i"><polygon :points="f.pts" :fill="f.fill" stroke="#7c2d12" stroke-opacity=".35" stroke-width=".6" /></g>
            </svg>
            <ul class="space-y-2 self-center text-sm">
              <li class="ap-dato"><span>Cajas por cama</span><b>{{ p.cajas / (p.camas || 1) }}</b></li>
              <li class="ap-dato"><span>Camas</span><b>{{ p.camas }}</b></li>
              <li class="ap-dato"><span>Uso de la base</span><b>{{ Math.round(p.uso * 100) }}%</b></li>
              <li class="ap-dato"><span>Alto total</span><b>{{ cm(p.alto) }} cm</b></li>
              <li class="ap-dato"><span>Peso total</span><b>{{ kg(p.peso) }}</b></li>
            </ul>
          </div>
          <p v-if="p.cajas && p.limite === 'apilable'" class="mt-2 text-xs text-neutral-500">Lo limita cuánto aguanta la caja ({{ it.apilable }} de alto).</p>
          <p v-else-if="p.cajas" class="mt-2 text-xs text-neutral-500">Lo limita el alto máximo recomendado del pallet (1,8 m).</p>
          <p v-if="p.uso < 0.75 && p.cajas" class="mt-1 text-xs font-medium text-amber-700">La caja aprovecha poco la base: revisa si otra medida de pallet calza mejor.</p>
          <p v-if="!p.cajas" class="mt-2 text-sm font-medium text-red-700">La caja no entra en este pallet. Revisa las medidas.</p>
        </div>

        <!-- Modulación del rack -->
        <div v-if="modo === 'pallet' && p.cajas" class="card p-5">
          <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">Así se modula tu rack selectivo</p>
          <div class="mt-3 grid gap-4 sm:grid-cols-[220px_1fr]">
            <svg :viewBox="`0 0 ${elev.w} ${elev.h}`" class="h-80 w-full" role="img" aria-label="Frente de un cuerpo de rack con tus pallets">
              <line :x1="0" :x2="elev.w" :y1="elev.techo" :y2="elev.techo" stroke="#dc2626" stroke-dasharray="5 4" stroke-width="1.2" />
              <text x="4" :y="elev.techo - 5" font-size="10" fill="#b91c1c" font-weight="600">Techo {{ dec(bodega.altura) }} m</text>
              <line :x1="0" :x2="elev.w" :y1="elev.piso" :y2="elev.piso" stroke="#a3a3a3" stroke-width="1.5" />
              <rect :x="elev.x0 - 4" :y="elev.tope" width="4" :height="elev.piso - elev.tope" fill="#1e3a8a" />
              <rect :x="elev.x1" :y="elev.tope" width="4" :height="elev.piso - elev.tope" fill="#1e3a8a" />
              <g v-for="(n, i) in elev.niveles" :key="i">
                <rect v-if="i > 0" :x="elev.x0" :y="n.viga" :width="elev.x1 - elev.x0" height="5" fill="#ea580c" />
                <rect v-for="(px, j) in elev.palletsX" :key="j" :x="px" :y="n.carga" :width="elev.anchoPallet" :height="elev.altoPallet" rx="1.5" fill="#f5e6cc" stroke="#a16207" stroke-width="1" />
                <rect v-for="(px, j) in elev.palletsX" :key="`b${j}`" :x="px" :y="n.carga + elev.altoPallet - elev.base" :width="elev.anchoPallet" :height="elev.base" fill="#d6a76a" />
              </g>
              <text :x="elev.x1 + 8" :y="elev.niveles[1]?.viga ?? elev.piso" font-size="10" fill="#525252">↕ {{ cm(m.paso) }} cm</text>
            </svg>
            <div class="space-y-2 text-sm">
              <div class="ap-dato"><span>Distancia entre vigas</span><b>{{ cm(m.paso) }} cm</b></div>
              <div class="ap-dato"><span>Niveles de vigas</span><b>{{ m.niveles }} <small class="font-normal text-neutral-500">+ piso</small></b></div>
              <div class="ap-dato"><span>Pallets por cuerpo</span><b>{{ m.porCuerpo }}</b></div>
              <div class="ap-dato"><span>Viga</span><b>{{ dec(m.viga) }} m</b></div>
              <div class="ap-dato"><span>Carga por par de vigas</span><b :class="m.uso > 1 ? 'text-red-700' : m.uso > 0.85 ? 'text-amber-700' : 'text-green-700'">{{ kg(m.cargaParVigas) }}</b></div>
              <p v-if="m.limitadoPor === 'grua'" class="text-xs font-medium text-amber-700">Tu equipo no alcanza más alto: el techo daría para más niveles.</p>
              <p v-if="m.uso > 1" class="text-xs font-medium text-red-700">El par de vigas estándar no aguanta ese peso: usamos vigas reforzadas.</p>
            </div>
          </div>
          <p class="mt-3 text-xs text-neutral-500">Medidas referenciales: un ingeniero de Racklog las confirma con la norma sísmica antes de cotizar.</p>
        </div>

        <!-- Ángulo ranurado -->
        <div v-if="modo === 'bandeja'" class="card p-5">
          <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">Tu repisa</p>
          <p class="mt-0.5 text-xl font-bold text-neutral-900">{{ b.cajas }} cajas · {{ kg(b.peso) }} por repisa</p>
          <div class="mt-3 h-3 overflow-hidden rounded-full bg-neutral-100">
            <div :class="['h-full rounded-full', b.uso > 1 ? 'bg-red-600' : b.uso > 0.85 ? 'bg-amber-500' : 'bg-green-600']" :style="{ width: `${Math.min(100, b.uso * 100)}%` }" />
          </div>
          <p class="mt-1 text-xs text-neutral-500">{{ Math.round(b.uso * 100) }}% de los {{ b.capacidad }} kg que aguanta la bandeja</p>
          <p v-if="b.uso > 1" class="mt-2 text-sm font-medium text-red-700">Es mucho peso para ángulo ranurado: pon menos cajas por repisa o evalúa rack selectivo.</p>
          <p v-if="repisasNecesarias" class="mt-3 text-sm text-neutral-700">Para tus {{ crecer.cajas.toLocaleString('es-CL') }} cajas necesitas <b>{{ repisasNecesarias.toLocaleString('es-CL') }} repisas</b> (≈ {{ Math.ceil(repisasNecesarias / 5) }} cuerpos de 5 niveles).</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import { BASES, ALTO_BASE, CONTENEDORES, armarPallet, modularSelectivo, armarBandeja, cajasPorContenedor } from '~/lib/tour/pallet.js';

const props = withDefaults(defineProps<{ modo?: 'pallet' | 'bandeja'; equipo?: string; perfil?: string | null }>(), { modo: 'pallet', equipo: 'grua', perfil: 'bodega' });
const VISTAS = [{ v: 'supply', t: 'Supply chain' }, { v: 'bodega', t: 'Jefe de bodega' }, { v: 'compras', t: 'Compras / dueño' }];
const vista = ref(VISTAS.some((x) => x.v === props.perfil) ? props.perfil! : 'bodega');
const SEMANAS = [{ v: 1, t: '1 semana' }, { v: 2, t: '2 semanas' }, { v: 4, t: '1 mes' }, { v: 8, t: '2 meses' }, { v: 13, t: '3 meses' }, { v: 26, t: '6 meses' }, { v: 52, t: '1 año' }];

// Levante máximo por equipo (m). Provisorio: manda la ficha del equipo del cliente
const EQUIPOS: Record<string, { t: string; levante: number | null; pasillo: number }> = {
  manual: { t: 'Apilador manual', levante: 3.0, pasillo: 2.4 },
  electrico: { t: 'Apilador eléctrico', levante: 4.5, pasillo: 2.6 },
  grua: { t: 'Grúa horquilla', levante: 6.0, pasillo: 3.5 },
  retractil: { t: 'Grúa retráctil', levante: 10.0, pasillo: 2.8 },
  ninguno: { t: 'Todavía no tengo', levante: null, pasillo: 3.5 },
};

let n = 0;
const nuevo = () => ({ id: ++n, nombre: '', largo: 40, ancho: 30, alto: 25, peso: 12, apilable: 6, base: '1200x1000', fondoBandeja: 0.4, stock: 900, modoStock: 'importacion', contenedor: 'c40', nContenedores: 1, cajasContenedor: null as number | null, actuales: 0, margen: 0.1, semanasEntre: 8, semanasBodega: 8, crecimiento: 0.2 });
const MODOS_STOCK = [{ v: 'importacion', t: 'Importación' }, { v: 'cajas', t: 'Cajas' }, { v: 'pallets', t: 'Pallets' }];
const items = ref([nuevo()]);
const sel = ref(0);
const it = computed(() => items.value[sel.value]);
const bodega = reactive({ altura: 6, equipo: props.equipo in EQUIPOS ? props.equipo : 'grua' });

function agregarItem() { items.value.push(nuevo()); sel.value = items.value.length - 1; }

const caja = computed(() => ({ largo: (it.value.largo || 0) / 100, ancho: (it.value.ancho || 0) / 100, alto: (it.value.alto || 1) / 100 }));
const base = computed(() => BASES.find((x) => x.v === it.value.base) ?? BASES[0]);
const p = computed(() => armarPallet({ base: base.value, caja: caja.value, pesoCaja: it.value.peso || 0, apilable: it.value.apilable || 1 }));
const estimadoCont = computed(() => cajasPorContenedor(it.value.contenedor, caja.value, it.value.peso || 0, it.value.apilable || 99));
// Demanda → pallets → posiciones → lo que falta
const crecer = computed(() => {
  const i = it.value;
  // Importaciones que conviven en el peak: llega la siguiente antes de que salga la anterior
  const juntas = i.modoStock === 'importacion' ? Math.max(1, Math.ceil((i.semanasBodega || 1) / (i.semanasEntre || 1))) : 1;
  const cajas = i.modoStock === 'importacion'
    ? (i.nContenedores || 0) * (i.cajasContenedor || estimadoCont.value.cajas) * juntas
    : i.modoStock === 'cajas' ? (i.stock || 0) : (i.stock || 0) * p.value.cajas;
  const pallets = i.modoStock === 'pallets' ? (i.stock || 0) : (p.value.cajas ? Math.ceil(cajas / p.value.cajas) : 0);
  const necesarias = Math.ceil(pallets * (1 + (i.margen || 0)));
  const aCrecer = Math.max(0, necesarias - (i.actuales || 0));
  const g = i.crecimiento || 0;
  const necesarias1 = Math.ceil(necesarias * (1 + g)), necesarias2 = Math.ceil(necesarias * (1 + g) ** 2);
  const etapa2 = Math.max(0, necesarias2 - Math.max(necesarias, i.actuales || 0));
  return { juntas, cajas, pallets, necesarias, aCrecer, necesarias1, necesarias2, etapa2 };
});
const palletsNecesarios = computed(() => crecer.value.aCrecer);
const m = computed(() => modularSelectivo({
  pallet: { alto: p.value.alto, peso: p.value.peso, frente: base.value.frente },
  alturaLibre: bodega.altura, levanteGrua: EQUIPOS[bodega.equipo].levante, totalPallets: palletsNecesarios.value,
}));
// Huella aprox.: cada cuerpo ocupa su viga × (fondo del rack + medio pasillo)
const m2 = computed(() => Math.round((m.value.cuerpos || 0) * m.value.viga * (base.value.fondo + 0.1 + EQUIPOS[bodega.equipo].pasillo / 2)));
const horizonte = computed(() => [
  { t: 'Hoy', v: crecer.value.necesarias }, { t: 'En 1 año', v: crecer.value.necesarias1 }, { t: 'En 2 años', v: crecer.value.necesarias2 },
]);
const horizonteMax = computed(() => Math.max(1, ...horizonte.value.map((h) => h.v), it.value.actuales || 0));
const m2Total = computed(() => {
  const cuerpos = Math.ceil(crecer.value.necesarias2 / Math.max(1, m.value.porCuerpo));
  return Math.round(cuerpos * m.value.viga * (base.value.fondo + 0.1 + EQUIPOS[bodega.equipo].pasillo / 2));
});
// Especificación para comparar cotizaciones (filas de hasta 10 cuerpos)
const especificacion = computed(() => {
  const c = m.value.cuerpos || 0, mm = m.value;
  const marcos = c + Math.ceil(c / 10);
  const altoMarco = Math.ceil((mm.alturaUltimaViga + p.value.alto + 0.1) / 0.5) * 0.5;
  return [
    ['Sistema', 'Rack selectivo'],
    ['Cuerpos', String(c)],
    ['Marcos (aprox.)', `${marcos} de ${dec(altoMarco)} m × ${dec(base.value.fondo + 0.1)} m`],
    ['Pares de vigas', `${c * mm.niveles} de ${dec(mm.viga)} m`],
    ['Niveles', `${mm.niveles} de vigas + piso`],
    ['Distancia entre vigas', `${cm(mm.paso)} cm`],
    ['Carga por par de vigas', kg(mm.cargaParVigas)],
    ['Posiciones de pallet', String(c * mm.porCuerpo)],
    ['Pallet', `${base.value.frente.toLocaleString('es-CL')} × ${base.value.fondo.toLocaleString('es-CL')} m · ${cm(p.value.alto)} cm · ${kg(p.value.peso)}`],
  ];
});
const b = computed(() => armarBandeja({ fondo: it.value.fondoBandeja, caja: caja.value, pesoCaja: it.value.peso || 0, apilable: it.value.apilable || 1 }));
const repisasNecesarias = computed(() => (crecer.value.cajas && b.value.cajas ? Math.ceil(crecer.value.cajas / b.value.cajas) : 0));

const cm = (v: number) => Math.round(v * 100);
const dec = (v: number) => (+(+v).toFixed(2)).toLocaleString('es-CL');
const kg = (v: number) => `${Math.round(v).toLocaleString('es-CL')} kg`;

// ─── Pallet en isométrico ───
const iso = computed(() => {
  const K = 120, c30 = Math.cos(Math.PI / 6), s30 = 0.5;
  const P = (x: number, y: number, z: number) => [(x - y) * c30 * K, ((x + y) * s30 - z) * K];
  const bx = base.value, cj = caja.value, pp = p.value;
  const dx = pp.largoEnFrente ? cj.largo : cj.ancho, dy = pp.largoEnFrente ? cj.ancho : cj.largo;
  const offX = (bx.frente - pp.cols * dx) / 2, offY = (bx.fondo - pp.filas * dy) / 2;
  type Caja = { x: number; y: number; z: number; w: number; d: number; h: number; c: string[] };
  const cajas: Caja[] = [{ x: 0, y: 0, z: 0, w: bx.frente, d: bx.fondo, h: ALTO_BASE, c: ['#e2b77d', '#c8955a', '#b07c43'] }];
  for (let k = 0; k < pp.camas; k++)
    for (let i = 0; i < pp.cols; i++)
      for (let j = 0; j < pp.filas; j++)
        cajas.push({ x: offX + i * dx, y: offY + j * dy, z: ALTO_BASE + k * cj.alto, w: dx, d: dy, h: cj.alto, c: ['#f8e7c9', '#e9cfa3', '#d9b886'] });
  cajas.sort((a, b2) => (a.z - b2.z) || ((a.x + a.y) - (b2.x + b2.y)));
  const caras: { pts: string; fill: string }[] = [];
  const pts = (arr: number[][]) => arr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  for (const q of cajas) {
    const { x, y, z, w, d, h } = q;
    caras.push({ pts: pts([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)]), fill: q.c[0] });
    caras.push({ pts: pts([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)]), fill: q.c[1] });
    caras.push({ pts: pts([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)]), fill: q.c[2] });
  }
  const H = Math.max(pp.alto, 1.2);
  const minX = -bx.fondo * c30 * K - 10, maxX = bx.frente * c30 * K + 10;
  const minY = -H * K - 10, maxY = (bx.frente + bx.fondo) * s30 * K + 10;
  return { caras, viewBox: `${minX.toFixed(0)} ${minY.toFixed(0)} ${(maxX - minX).toFixed(0)} ${(maxY - minY).toFixed(0)}` };
});

// ─── Frente de un cuerpo del rack ───
const elev = computed(() => {
  const w = 220, h = 320, margen = 18;
  const alto = Math.max(bodega.altura || 6, m.value.alturas * m.value.paso + 0.3);
  const k = (h - margen * 2) / alto;
  const piso = h - margen, techo = piso - (bodega.altura || 6) * k;
  const anchoViga = m.value.viga * k;
  const x0 = (w - anchoViga) / 2 - 10, x1 = x0 + anchoViga;
  const anchoPallet = base.value.frente * k, altoPallet = p.value.alto * k;
  const hueco = (anchoViga - 2 * anchoPallet) / 3;
  const niveles = Array.from({ length: m.value.alturas }, (_, i) => {
    const viga = piso - i * m.value.paso * k;
    return { viga, carga: (i === 0 ? piso : viga) - altoPallet };
  });
  const tope = piso - (m.value.niveles * m.value.paso + p.value.alto + 0.1) * k;
  return { w, h, piso, techo, x0, x1, anchoPallet, altoPallet, base: ALTO_BASE * k, palletsX: [x0 + hueco, x0 + 2 * hueco + anchoPallet], niveles, tope };
});

defineExpose({ items, bodega, pallet: p, modulacion: m });
</script>

<style scoped>
.ap-leyenda { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #525252; }
.ap-campo { display: grid; gap: .25rem; font-size: .8rem; }
.ap-campo > span { font-weight: 600; color: #404040; }
.ap-campo input, .ap-campo select {
  height: 2.5rem; width: 100%; border-radius: .625rem; border: 1px solid #d4d4d4; background: #fff;
  padding: 0 .65rem; font-size: .95rem; outline: none;
}
.ap-campo input:focus, .ap-campo select:focus { border-color: #ea580c; box-shadow: 0 0 0 3px #fed7aa; }
.ap-dato { display: flex; justify-content: space-between; gap: .75rem; border-bottom: 1px solid #f5f5f5; padding-bottom: .35rem; color: #525252; }
.ap-dato b { color: #171717; }
.ap-paso { display: grid; gap: .15rem; background: #fff; padding: .85rem 1rem; }
.ap-paso span { font-size: .75rem; color: #737373; }
.ap-paso b { color: #171717; }
</style>
