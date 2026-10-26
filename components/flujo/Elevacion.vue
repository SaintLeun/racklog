<template>
  <div>
    <!-- Un solo elemento raíz: hereda la clase que le pasa el paso -->
    <!-- Vista frontal de un cuerpo con sus medidas (m): alto de marco, distancia entre vigas y largo de viga -->
    <!-- Angulo ranurado visto desde arriba: una bandeja con sus cajas, el frente da al pasillo (abajo) -->
    <svg v-if="vista === 'planta' && tipo === 'anra'" :viewBox="`0 0 ${W} ${HP}`" class="h-auto w-full" role="img" :aria-label="descripcionPlanta">
      <title>{{ descripcionPlanta }}</title>
      <rect :x="planta.x0 - 4" :y="planta.y0 - 4" :width="planta.w + 8" :height="planta.h + 8" fill="#cbd5e1" rx="2" />
      <rect :x="planta.x0" :y="planta.y0" :width="planta.w" :height="planta.h" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" />
      <!-- Angulos en las esquinas -->
      <rect v-for="(e, i) in planta.esquinas" :key="`e${i}`" :x="e.x - 4" :y="e.y - 4" width="8" height="8" fill="#64748b" />
      <rect v-for="(b, k) in planta.cajas" :key="`c${k}`" :x="b.x" :y="b.y" :width="b.w" :height="b.h" :fill="b.color" stroke="#7a5a2e" stroke-width="0.8" rx="1.5" />
      <g font-size="11" fill="#334155" font-family="Inter, system-ui, sans-serif">
        <line :x1="planta.x0" :x2="planta.x0 + planta.w" :y1="planta.y0 + planta.h + 14" :y2="planta.y0 + planta.h + 14" stroke="#334155" stroke-width="0.8" marker-start="url(#fl-fp)" marker-end="url(#fl-fp)" />
        <text :x="planta.x0 + planta.w / 2" :y="planta.y0 + planta.h + 28" text-anchor="middle" font-weight="600">frente {{ fm(m.frente) }} m</text>
        <line :x1="planta.x0 + planta.w + 14" :x2="planta.x0 + planta.w + 14" :y1="planta.y0" :y2="planta.y0 + planta.h" stroke="#334155" stroke-width="0.8" marker-start="url(#fl-fp)" marker-end="url(#fl-fp)" />
        <text :x="planta.x0 + planta.w + 26" :y="planta.y0 + planta.h / 2" text-anchor="middle" font-weight="600" :transform="`rotate(90 ${planta.x0 + planta.w + 26} ${planta.y0 + planta.h / 2})`">fondo {{ fm(m.fondo) }} m</text>
        <text v-if="principal" :x="W / 2" :y="14" text-anchor="middle" font-weight="600">{{ principal.cols * principal.filas }} cajas por cama: {{ principal.cols }} al frente × {{ principal.filas }} al fondo</text>
      </g>
      <rect x="0" :y="HP - 22" :width="W" height="22" fill="#ecfdf5" />
      <text :x="W / 2" :y="HP - 7" text-anchor="middle" font-size="11" fill="#047857" font-family="Inter, system-ui, sans-serif">↑ pasillo: las cajas se sacan por el frente</text>
      <defs>
        <marker id="fl-fp" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 6 3 0 6z" fill="#334155" />
        </marker>
      </defs>
    </svg>
    <svg v-else :viewBox="`0 0 ${W} ${H}`" class="h-auto w-full" role="img" :aria-label="descripcion">
      <title>{{ descripcion }}</title>
      <line :x1="0" :x2="W" :y1="y(0)" :y2="y(0)" stroke="#a3a3a3" stroke-width="1" />
      <!-- Marcos -->
      <rect v-for="(xp, i) in pilares" :key="`p${i}`" :x="xp - 3" :y="y(m.alto)" width="6" :height="y(0) - y(m.alto)" fill="#9ca3af" rx="1" />
      <!-- Perforación del pilar (selectivo cada 76,2 mm) o del ángulo (cada 20 mm). Si a esta escala no se alcanza
           a ver cada una, se dibuja una de cada tantas para que se lea la perforación -->
      <line
        v-for="(xp, i) in (tipo === 'drivein' ? [] : pilares)" :key="`h${i}`" :x1="xp" :x2="xp" :y1="y(0) - perforacion.inicio" :y2="y(m.alto)"
        stroke="#f8fafc" :stroke-width="tipo === 'anra' ? 1.6 : 2" :stroke-dasharray="perforacion.patron" pointer-events="none"
      />

      <template v-if="tipo === 'selectivo'">
        <!-- El rack se levanta nivel por nivel cuando cambia (la clave reinicia la animacion) -->
        <g v-for="(n, i) in niveles" :key="`n${i}-${firma}`" class="fl-nivel" :style="{ '--i': i }">
          <rect v-if="!n.piso" :x="x0" :y="y(n.y) - 3" :width="ancho" height="6" :fill="arrastre?.i === i - 1 ? '#c2410c' : '#f97316'" rx="1" />
          <!-- Editable: la viga se toma y se arrastra; zona de toque amplia -->
          <rect
            v-if="!n.piso && editable" :x="x0 - 6" :y="y(n.y) - 11" :width="ancho + 12" height="22" fill="transparent" class="cursor-ns-resize"
            role="slider" tabindex="0" :aria-label="`Viga del nivel ${i}`" :aria-valuenow="Math.round(n.y * 1000)" aria-valuemin="0" aria-valuemax="99999"
            @pointerdown="tomar($event, i - 1)" @keydown.up.prevent="paso(i - 1, 1)" @keydown.down.prevent="paso(i - 1, -1)"
          />
          <!-- Luz libre bajo la viga (en rojo si no cabe la carga + 100 mm) -->
          <text v-if="!n.piso && editable" :x="x0 + ancho + 4" :y="y(n.y) + 14" font-size="8" :fill="luzMala(i - 1) ? '#dc2626' : '#64748b'">espacio {{ fm(m.luzLibre?.[i - 1] ?? 0) }} m</text>
          <g v-for="k in m.palletsPorViga" :key="k">
            <rect
              :x="x0 + caraPilar + hueco * k + anchoPallet * (k - 1)" :y="y(n.base + n.alto)"
              :width="anchoPallet" :height="y(n.base) - y(n.base + n.alto)"
              fill="#e2c08c" stroke="#8a6a3b" stroke-width="0.6" rx="1.5"
            />
            <!-- Tipo de pallet: franja de su color (como en el 3D) -->
            <rect v-if="n.color" :x="x0 + caraPilar + hueco * k + anchoPallet * (k - 1)" :y="y(n.base + n.alto) + 2" :width="anchoPallet" height="4" :fill="n.color" />
          </g>
        </g>
      </template>
      <template v-else-if="tipo === 'drivein'">
        <g v-for="(n, i) in niveles" :key="`n${i}`">
          <rect v-if="!n.piso" :x="x0 - 2" :y="y(n.y) - 2.5" :width="10" height="5" fill="#f97316" />
          <rect v-if="!n.piso" :x="x0 + ancho - 8" :y="y(n.y) - 2.5" :width="10" height="5" fill="#f97316" />
          <rect :x="x0 + hueco" :y="y(n.base + n.alto)" :width="anchoPallet" :height="y(n.base) - y(n.base + n.alto)" fill="#d6b37a" fill-opacity="0.85" stroke="#8a6a3b" stroke-width="0.6" rx="1.5" />
        </g>
      </template>
      <template v-else>
        <!-- Angulo ranurado: cada repisa con sus cajas, como van (al frente y apiladas) -->
        <g v-for="(r, i) in repisas" :key="`b${i}-${firma}`" class="fl-nivel" :style="{ '--i': i }">
          <rect v-for="(b, k) in r.cajas" :key="k" :x="b.x" :y="b.y" :width="b.w" :height="b.h" :fill="b.color" stroke="#7a5a2e" stroke-width="0.6" rx="1" />
          <rect :x="x0" :y="y(r.y) - 2" :width="ancho" height="4" fill="#94a3b8" />
        </g>
      </template>

      <!-- Cotas -->
      <g font-size="10" fill="#334155" font-family="Inter, system-ui, sans-serif">
        <!-- Alto de marco a la izquierda -->
        <line :x1="x0 - 22" :x2="x0 - 22" :y1="y(0)" :y2="y(m.alto)" stroke="#334155" stroke-width="0.8" marker-start="url(#fl-f)" marker-end="url(#fl-f)" />
        <text :x="x0 - 26" :y="(y(0) + y(m.alto)) / 2" text-anchor="middle" :transform="`rotate(-90 ${x0 - 26} ${(y(0) + y(m.alto)) / 2})`">{{ tipo === 'anra' ? 'ángulo' : 'marco' }} {{ fm(m.alto) }} m</text>
        <!-- Distancia entre vigas (primer paso) a la derecha -->
        <template v-if="pasoCota && !editable">
          <line :x1="x0 + ancho + 16" :x2="x0 + ancho + 16" :y1="y(pasoCota.a)" :y2="y(pasoCota.b)" stroke="#334155" stroke-width="0.8" marker-start="url(#fl-f)" marker-end="url(#fl-f)" />
          <text :x="x0 + ancho + 21" :y="(y(pasoCota.a) + y(pasoCota.b)) / 2 + 3">{{ fm(pasoCota.b - pasoCota.a) }} m</text>
          <text v-if="tipo === 'anra'" :x="x0 + ancho + 21" :y="(y(pasoCota.a) + y(pasoCota.b)) / 2 + 14" font-size="8" fill="#64748b">entre</text>
          <text v-if="tipo === 'anra'" :x="x0 + ancho + 21" :y="(y(pasoCota.a) + y(pasoCota.b)) / 2 + 23" font-size="8" fill="#64748b">repisas</text>
        </template>
        <!-- Largo de viga abajo -->
        <line :x1="x0" :x2="x0 + ancho" :y1="y(0) + 16" :y2="y(0) + 16" stroke="#334155" stroke-width="0.8" marker-start="url(#fl-f)" marker-end="url(#fl-f)" />
        <text :x="x0 + ancho / 2" :y="y(0) + 29" text-anchor="middle">{{ tipo === 'drivein' ? 'calle' : tipo === 'anra' ? 'bandeja' : 'viga' }} {{ fm(largo) }} m</text>
      </g>
      <defs>
        <marker id="fl-f" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 6 3 0 6z" fill="#334155" />
        </marker>
      </defs>
    </svg>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { RACK } from '~/lib/rack3d/parametrosTecnicos.js';

// cajas (angulo ranurado): por tipo, como van en la bandeja (bandejaCajas de calculos.js) + color y bandejas
type CajaBandeja = { cols: number; filas: number; camas: number; cajas: number; largoEnFrente: boolean; c: { largo: number; ancho: number; alto: number }; color?: string; bandejas?: number };
const props = defineProps<{ m: Record<string, any>; editable?: boolean; cajas?: CajaBandeja[]; vista?: 'frente' | 'planta' }>();
const emit = defineEmits<{ vigas: [nivelesY: number[]] }>();
const W = 300, H = 280, x0 = 62, ancho = 160, arriba = 14, abajo = 40;   // deja lugar a "espacio 1,76 m" a la derecha
const tipo = computed(() => props.m.tipo as 'selectivo' | 'drivein' | 'anra');
// Angulo ranurado: la repisa de arriba tambien lleva cajas (se ven sobre el angulo)
const cargaArriba = computed(() => {
  const t = (props.cajas ?? []).find((x) => x.cajas > 0);
  return tipo.value === 'anra' && t ? (props.m.nivelesY?.at(-1) ?? 0) + 0.02 + t.camas * t.c.alto : 0;
});
const tope = computed(() => Math.max(props.m.altoConCarga ?? props.m.alto, props.m.alto, cargaArriba.value) * 1.02);
const y = (v: number) => H - abajo - (v / tope.value) * (H - abajo - arriba);
const largo = computed(() => (tipo.value === 'selectivo' ? props.m.viga : tipo.value === 'drivein' ? props.m.anchoCalle : props.m.frente));
const pilares = computed(() => [x0, x0 + ancho]);
// Paso de la perforación en pantalla (px): ángulo ranurado 20 mm, selectivo RACK.pasoPerforado (76,2 mm)
const perforacion = computed(() => {
  const metro = (H - abajo - arriba) / tope.value;
  const pasoM = tipo.value === 'anra' ? 0.02 : RACK.pasoPerforado.valor;
  const cada = Math.max(1, Math.ceil(3.5 / (pasoM * metro)));
  const pasoPx = pasoM * metro * cada, agujero = Math.min(pasoPx * 0.55, tipo.value === 'anra' ? 2.4 : 1.6);
  const inicio = (tipo.value === 'anra' ? 0.02 : RACK.primeraPerforacion.valor) * metro;
  return { patron: `${agujero.toFixed(2)} ${(pasoPx - agujero).toFixed(2)}`, inicio };
});
const fm = (v: number) => (+v.toFixed(2)).toLocaleString('es-CL');

// Escala horizontal en px por m (a lo largo de la viga o calle)
const kx = computed(() => ancho / largo.value);
const anchoPallet = computed(() => (props.m.pallet?.frente ?? 1) * kx.value * (tipo.value === 'drivein' ? 1 : 0.98));
// Selectivo: la viga va de eje a eje de pilar; los pallets caben entre las caras (medio pilar por lado)
const caraPilar = computed(() => (tipo.value === 'selectivo' ? 0.05 * kx.value : 0));
const hueco = computed(() => (tipo.value === 'selectivo'
  ? (ancho - 2 * caraPilar.value - props.m.palletsPorViga * anchoPallet.value) / (props.m.palletsPorViga + 1)
  : (ancho - anchoPallet.value) / 2));

// Altura de cada nivel: base de la carga y su alto (0 = piso)
const niveles = computed(() => {
  const m = props.m;
  if (tipo.value === 'selectivo') {
    const ys = [0, ...m.nivelesY];
    return ys.map((yv: number, i: number) => {
      const piso = i === 0, base = piso ? 0 : yv + (m.altoViga ?? 0.1) / 2;
      return { y: yv, piso, base, alto: Math.max(0.2, (m.altosCarga?.[i] ?? m.pallet.alto)), color: m.coloresCarga?.[i] ?? null };
    });
  }
  if (tipo.value === 'drivein') {
    return [0, ...m.cartelasY].map((yv: number, i: number) => ({ y: yv, piso: i === 0, base: yv, alto: m.pallet.alto, color: null }));
  }
  return [];
});
// Distancia entre la primera y la segunda viga (o del piso a la primera)
const pasoCota = computed(() => {
  const ys = tipo.value === 'selectivo' ? props.m.nivelesY : tipo.value === 'drivein' ? props.m.cartelasY : props.m.nivelesY;
  if (!ys?.length) return null;
  return ys.length > 1 ? { a: ys[0], b: ys[1] } : { a: 0, b: ys[0] };
});
// ─── Vigas movibles (selectivo): de a una perforacion del pilar (3" = 76,2 mm) ───
// La cara de arriba de la viga calza en la perforacion: 25 mm + k × 76,2 mm desde el piso
const arrastre = ref<{ i: number } | null>(null);
const PERF = RACK.pasoPerforado.valor, PERF0 = RACK.primeraPerforacion.valor;
const aPerforacion = (t: number) => +(PERF0 + Math.round((t - PERF0) / PERF) * PERF).toFixed(4);
// Limites de la cara de arriba de la viga i: sobre la carga de abajo + 100 mm y bajo la carga de arriba
function limites(i: number) {
  const m = props.m, av = m.altoViga, luz = RACK.luzVigas.valor;
  const min = (i ? m.nivelesY[i - 1] + av / 2 : 0) + m.altosCarga[i] + luz + av;
  const max = i < m.nivelesY.length - 1 ? m.nivelesY[i + 1] - av / 2 - m.altosCarga[i + 1] - luz : Infinity;
  return { min, max };
}
const luzMala = (i: number) => (props.m.luzLibre?.[i] ?? 0) + 1e-6 < props.m.altosCarga[i] + RACK.luzVigas.valor;
function mover(i: number, cara: number) {
  const { min, max } = limites(i);
  let t = aPerforacion(cara);
  while (t < min - 1e-6) t = +(t + PERF).toFixed(4);
  while (t > max + 1e-6) t = +(t - PERF).toFixed(4);
  if (t < min - 1e-6) return;   // no cabe en ninguna perforacion
  const ys = [...props.m.nivelesY];
  ys[i] = +(t - props.m.altoViga / 2).toFixed(4);
  if (Math.abs(ys[i] - props.m.nivelesY[i]) > 1e-4) emit('vigas', ys);
}
const paso = (i: number, s: number) => mover(i, props.m.nivelesY[i] + props.m.altoViga / 2 + s * PERF);
function tomar(e: PointerEvent, i: number) {
  e.preventDefault();
  arrastre.value = { i };
  const el = (e.target as SVGElement).ownerSVGElement!;
  const alMover = (ev: PointerEvent) => {
    const r = el.getBoundingClientRect(), py = ((ev.clientY - r.top) / r.height) * H;
    const metros = ((H - abajo - py) / (H - abajo - arriba)) * tope.value;
    mover(i, metros + props.m.altoViga / 2);
  };
  const soltar = () => { arrastre.value = null; window.removeEventListener('pointermove', alMover); window.removeEventListener('pointerup', soltar); };
  window.addEventListener('pointermove', alMover);
  window.addEventListener('pointerup', soltar);
}

// ─── Angulo ranurado: cajas en cada repisa ───
const CARTON = ['#d6a964', '#b98d4f', '#e3c08a', '#a8794a'];
const tiposCaja = computed(() => (props.cajas ?? []).filter((x) => x.cajas > 0).map((x, i) => ({ ...x, color: x.color ?? CARTON[i % CARTON.length] })));
const principal = computed(() => tiposCaja.value[0] ?? null);
// Que tipo va en cada repisa: en proporcion a las bandejas que necesita cada uno (al menos una)
function reparto(n: number) {
  const t = tiposCaja.value;
  if (!t.length) return [] as number[];
  const pesos = t.map((x) => Math.max(1, x.bandejas ?? 1)), total = pesos.reduce((a, b) => a + b, 0);
  const cupos = pesos.map((w) => Math.max(1, Math.round((w / total) * n)));
  while (cupos.reduce((a, b) => a + b, 0) > n && cupos.some((c) => c > 1)) cupos[cupos.indexOf(Math.max(...cupos))]--;
  while (cupos.reduce((a, b) => a + b, 0) < n) cupos[0]++;
  return cupos.flatMap((c, i) => Array(c).fill(i)).slice(0, n);
}
// Caja vista de frente: ancho segun la orientacion (largo o ancho al frente)
const anchoFrente = (x: CajaBandeja) => (x.largoEnFrente ? x.c.largo : x.c.ancho);
const repisas = computed(() => {
  if (tipo.value !== 'anra') return [];
  const ys: number[] = props.m.nivelesY ?? [];
  const asignado = reparto(ys.length);
  return ys.map((yv, i) => {
    const t = tiposCaja.value[asignado[i]];
    const cajas: { x: number; y: number; w: number; h: number; color: string }[] = [];
    // La repisa de arriba es el techo de la estanteria: tambien lleva cajas
    if (t) {
      const w = anchoFrente(t) * kx.value, h = Math.abs(y(t.c.alto) - y(0));
      const libre = ancho - t.cols * w, xi = x0 + libre / 2;
      const porCama = t.cols * t.filas;
      for (let c = 0; c < t.camas; c++) {
        // De frente se ve una caja por columna (las de atras quedan ocultas); la cama incompleta (peso) se ve corta
        const enCama = Math.min(t.cols, Math.ceil(Math.max(0, t.cajas - c * porCama) / Math.max(1, t.filas)));
        for (let k = 0; k < enCama; k++) cajas.push({ x: xi + k * w + 0.6, y: y(yv + 0.02 + (c + 1) * t.c.alto), w: w - 1.2, h: h - 0.6, color: t.color });
      }
    }
    return { y: yv, cajas };
  });
});
// Planta de una bandeja (angulo ranurado)
const HP = 230;
const planta = computed(() => {
  const m = props.m, k = Math.min(200 / (m.frente || 1), 130 / (m.fondo || 0.4));
  const w = (m.frente || 0.92) * k, h = (m.fondo || 0.4) * k, x0p = (W - w) / 2 - 10, y0p = 30 + (130 - h) / 2;
  const cajas: { x: number; y: number; w: number; h: number; color: string }[] = [];
  const t = principal.value;
  if (t) {
    const bw = anchoFrente(t) * k, bh = (t.largoEnFrente ? t.c.ancho : t.c.largo) * k;
    const xi = x0p + (w - t.cols * bw) / 2, yi = y0p + h - t.filas * bh;   // contra el frente (abajo)
    for (let j = 0; j < t.filas; j++) for (let i = 0; i < t.cols; i++) cajas.push({ x: xi + i * bw + 1, y: yi + j * bh + 1, w: bw - 2, h: bh - 2, color: t.color });
  }
  const esquinas = [[x0p, y0p], [x0p + w, y0p], [x0p, y0p + h], [x0p + w, y0p + h]].map(([x, yy]) => ({ x, y: yy }));
  return { x0: x0p, y0: y0p, w, h, cajas, esquinas };
});
const descripcionPlanta = computed(() => `Bandeja vista desde arriba: frente ${fm(props.m.frente)} m, fondo ${fm(props.m.fondo)} m${principal.value ? `, ${principal.value.cols} cajas al frente y ${principal.value.filas} al fondo` : ''}`);

const firma = computed(() => [props.m.palletsPorViga, props.m.nivelesY.length, props.m.altosCarga?.join(), tiposCaja.value.map((x) => x.cajas).join()].join('|'));
const descripcion = computed(() => `Vista frontal: alto de marco ${fm(props.m.alto)} m, largo ${fm(largo.value)} m`);
</script>

<style scoped>
.fl-nivel { animation: fl-subir .38s cubic-bezier(.2, .8, .2, 1) both; animation-delay: calc(var(--i) * 110ms); transform-box: fill-box; }
@keyframes fl-subir { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .fl-nivel { animation: none; } }
</style>
