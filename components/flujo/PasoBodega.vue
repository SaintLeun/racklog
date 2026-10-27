<template>
  <div>
    <template v-if="modo === 'dibujo'">
      <h1 class="fl-titulo">Tu bodega</h1>
      <p class="fl-bajada">Dibuja tu bodega: medidas, forma, altura, pilares y portones. Todo lo que armes después se revisa contra ella.</p>
    </template>
    <template v-else>
      <h1 class="fl-titulo">Arma tu layout</h1>
      <p class="fl-bajada">Dibuja tus racks arrastrando en el plano, por el muro que quieras y del largo que quieras. Tú decides cuántos cuerpos van en cada lado. <button type="button" class="font-medium text-brand-700 underline underline-offset-2" @click="p.ir('dibujo')">Cambiar mi bodega</button></p>
    </template>

    <div class="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
      <div class="min-w-0 space-y-4">
        <!-- Lo pedido contra lo puesto, fijo al costado del plano mientras se arma (dueño 27-10). En el celular va
             en la barra de arriba del plano -->
        <section v-if="modo === 'layout' && !enHoy && demanda.necesita" :class="['fl-card z-10 hidden lg:sticky lg:top-20 lg:block', demanda.faltan ? '!outline-amber-300' : '!outline-green-300']" role="status" aria-live="polite">
          <dl class="grid grid-cols-2 gap-3">
            <div><dt class="fl-leyenda">Necesitas</dt><dd class="text-3xl font-bold tabular-nums text-neutral-900">{{ n(demanda.necesita) }}</dd></div>
            <div><dt class="fl-leyenda">En el plano</dt><dd class="text-3xl font-bold tabular-nums text-neutral-900"><FlujoContador :valor="demanda.posiciones" /></dd></div>
          </dl>
          <p class="-mt-0.5 text-xs text-neutral-500">{{ demanda.unidadPos }}</p>
          <span class="mt-2 block h-2 overflow-hidden rounded-full bg-neutral-200" aria-hidden="true">
            <span :class="['block h-full rounded-full transition-all duration-300', demanda.faltan ? 'bg-amber-500' : 'bg-green-600']" :style="{ width: `${Math.min(100, (demanda.posiciones / Math.max(1, demanda.necesita)) * 100)}%` }" />
          </span>
          <p :class="['mt-2 text-base font-semibold', demanda.faltan ? 'text-amber-800' : 'text-green-800']">
            <template v-if="porPoner > 0">Faltan {{ n(porPoner) }} {{ demanda.unidadPos }}</template>
            <template v-else-if="demanda.faltan">Faltan {{ demanda.faltan }} {{ demanda.faltan === 1 ? demanda.unidadCuerpo.replace(/s$/, '') : demanda.unidadCuerpo }} de un producto</template>
            <template v-else>✓ Ya cumples</template>
          </p>
          <p v-if="demanda.unidad === 'pallets'" class="mt-1 text-sm text-neutral-600">
            Para {{ n(demanda.pidio) }} pallets, llenando al
            <select :value="Math.round((p.bodega.ocupacion ?? 0.8) * 100)" class="rounded border border-neutral-300 bg-white px-0.5 text-sm font-semibold" aria-label="Factor de ocupación" @change="p.bodega.ocupacion = Number(($event.target as HTMLSelectElement).value) / 100"><option v-for="v in [60, 65, 70, 75, 80, 85]" :key="v" :value="v">{{ v }} %</option></select>
            <FlujoInfo>Nadie llena el 100 % de sus posiciones: entra y sale mercadería, hay lotes a medio usar y se necesita espacio para mover. Con 80 %, 100 pallets piden 125 posiciones.</FlujoInfo>
          </p>
          <p v-if="perdidasPilares" class="mt-2 border-t border-neutral-100 pt-2 text-sm text-neutral-600">Los pilares te quitan <b class="text-neutral-900">{{ n(perdidasPilares) }} {{ perdidasPilares === 1 ? 'posición' : 'posiciones' }}</b> (tachadas en el plano).</p>
        </section>
        <!-- Layout (paso 5): pestañas de lo que ya tiene, cerradas hasta que las toque -->
        <div v-if="modo === 'layout' && pestana" class="flex flex-wrap gap-1 rounded-xl bg-neutral-100 p-1" role="tablist" aria-label="Datos de tu bodega">
          <button v-for="t in PESTANAS" :key="t.k" type="button" role="tab" :aria-selected="pestana === t.k" :class="['min-h-10 flex-auto whitespace-nowrap rounded-lg px-2.5 text-sm font-semibold', pestana === t.k ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="pestana = pestana === t.k ? '' : t.k">{{ t.t }}</button>
        </div>

        <!-- Paso 2 (dueño 27-10): sin pestañas. Forma y medidas, altura libre, accesos y, al final, pilares (opcional).
             En el celular el plano queda arriba y esto debajo -->
        <template v-if="modo === 'dibujo'">
        <section class="fl-card">
          <p class="fl-leyenda">Forma y medidas</p>
          <!-- Forma: libre (dibujada muro por muro) o rectángulo. La libre va primero y más grande -->
          <div class="mt-3 grid grid-cols-[1.35fr_1fr] gap-2" role="radiogroup" aria-label="Forma de la bodega">
            <button type="button" role="radio" :aria-checked="formaActual === 'libre'" :class="['flex flex-col items-start gap-1 rounded-xl p-3 text-left ring-1 transition-colors', formaActual === 'libre' ? 'bg-brand-50 ring-2 ring-brand-600' : 'bg-white ring-brand-300 hover:bg-brand-50/50']" @click="ponerForma('libre')">
              <svg viewBox="0 0 48 32" class="h-8 w-12 text-brand-700" aria-hidden="true"><path d="M3 4h26v9h16v16H3z" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /><circle v-for="(q, i) in [[3, 4], [29, 4], [29, 13], [45, 13], [45, 29], [3, 29]]" :key="i" :cx="q[0]" :cy="q[1]" r="2.2" fill="currentColor" /></svg>
              <b class="text-base text-neutral-900">Dibujarla</b>
              <span class="text-xs leading-snug text-neutral-600">Muro por muro, con sus metros. Para cualquier forma.</span>
            </button>
            <button type="button" role="radio" :aria-checked="formaActual === 'rect'" :class="['flex flex-col items-start gap-1 rounded-xl p-3 text-left ring-1 transition-colors', formaActual === 'rect' ? 'bg-brand-50 ring-2 ring-brand-600' : 'bg-white ring-neutral-200 hover:bg-neutral-50']" @click="ponerForma('rect')">
              <svg viewBox="0 0 48 32" class="h-8 w-12 text-neutral-500" aria-hidden="true"><rect x="3" y="4" width="42" height="25" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="2" /></svg>
              <b class="text-base text-neutral-900">Rectángulo</b>
              <span class="text-xs leading-snug text-neutral-600">Solo ancho y largo.</span>
            </button>
          </div>

          <!-- Dibujando: cada clic es una esquina; los metros se escriben en el teclado (o se corrigen en la lista) -->
          <div v-if="dibujo" class="mt-3 rounded-xl bg-orange-50 p-3 ring-1 ring-orange-200">
            <ol class="space-y-1 text-sm text-neutral-800">
              <li><b>1.</b> Toca en el plano cada esquina, siguiendo los muros.</li>
              <li><b>2.</b> ¿Sabes cuánto mide el muro? Escribe los metros (ej. 16) y presiona Enter, o corrígelo en la lista.</li>
              <li><b>3.</b> Termina tocando el primer punto. Esc cancela.</li>
            </ol>
            <ul v-if="murosDibujo.length" class="mt-2 grid grid-cols-2 gap-1.5">
              <li v-for="m in murosDibujo" :key="m.i">
                <label class="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 ring-1 ring-orange-200">
                  <span class="w-9 shrink-0 text-sm font-semibold text-neutral-800">{{ m.letra }} {{ m.flecha }}</span>
                  <input :value="fm2(m.largo)" type="number" min="0.5" step="0.1" inputmode="decimal" :aria-label="`Largo del muro ${m.letra} (m)`" class="w-full min-w-0 bg-transparent py-1 text-right text-sm outline-none" @change="largoMuroDibujo(m.i, ($event.target as HTMLInputElement).value)">
                  <i class="text-xs not-italic text-neutral-500">m</i>
                </label>
              </li>
            </ul>
            <label class="mt-3 flex items-center gap-2 text-sm text-neutral-700"><input v-model="diagonales" type="checkbox" class="h-4 w-4 accent-brand-600">Mi bodega tiene muros en diagonal</label>
            <div class="mt-3 grid grid-cols-3 gap-1.5">
              <button type="button" class="fl-btn-sec !min-h-10 !px-2 !text-sm" :disabled="!dibujo.length" @click="dibujo.pop(); largoEscrito = ''">Deshacer</button>
              <button type="button" class="fl-btn-sec !min-h-10 !px-2 !text-sm" @click="cancelarDibujo">Cancelar</button>
              <button type="button" class="fl-btn !min-h-10 !px-2 !text-sm" :disabled="dibujo.length < 3" @click="terminarDibujo">Terminar</button>
            </div>
            <p v-if="avisoDibujo" class="mt-2 text-sm text-red-700" role="alert">{{ avisoDibujo }}</p>
          </div>
          <!-- Forma ya dibujada: el largo real de cada muro se escribe aquí -->
          <div v-else-if="p.bodega.forma" class="mt-3">
            <p class="text-sm text-neutral-600">Escribe el largo real de cada muro o arrastra las esquinas naranjas en el plano.</p>
            <ul class="mt-2 grid grid-cols-2 gap-1.5">
              <li v-for="m in murosForma" :key="m.i">
                <label :class="['flex items-center gap-1.5 rounded-lg px-2 py-1 ring-1', muroSel === m.i ? 'bg-sky-50 ring-sky-300' : 'ring-neutral-200']">
                  <span class="w-9 shrink-0 text-sm font-semibold text-neutral-800" :title="`Muro ${m.letra}`">{{ m.letra }} {{ m.flecha }}</span>
                  <input :value="fm2(m.largo)" type="number" min="0.5" step="0.1" inputmode="decimal" :aria-label="`Largo del muro ${m.letra} (m)`" class="w-full min-w-0 bg-transparent py-1 text-right text-sm outline-none" @focus="muroSel = m.i; sel = null; elementoSel = null" @change="largoMuro(($event.target as HTMLInputElement).value, m.i)">
                  <i class="text-xs not-italic text-neutral-500">m</i>
                </label>
              </li>
            </ul>
            <button type="button" class="mt-2 text-sm font-semibold text-brand-700 underline" @click="empezarDibujo">Dibujar de nuevo</button>
          </div>
          <div v-else class="mt-3 grid grid-cols-2 gap-3">
            <label class="fl-campo"><span>Ancho (m)</span><input :value="fm2(cajaBodega.x1 - cajaBodega.x0)" type="number" min="4" max="200" step="0.5" inputmode="decimal" class="form-input" @change="medida('ancho', $event)"></label>
            <label class="fl-campo"><span>Largo (m)</span><input :value="fm2(cajaBodega.y1 - cajaBodega.y0)" type="number" min="4" max="200" step="0.5" inputmode="decimal" class="form-input" @change="medida('largo', $event)"></label>
          </div>
          <template v-if="!dibujo">
            <label class="mt-3 flex items-start gap-2 text-sm text-neutral-700">
              <input type="checkbox" class="mt-0.5 h-4 w-4 flex-shrink-0 accent-brand-600" :checked="p.flags.includes('no_se:medidas')" @change="medidasAprox(($event.target as HTMLInputElement).checked)">
              <span>No tengo las medidas exactas: son aproximadas (±{{ TOLERANCIA_MEDIDAS }} m)</span>
            </label>
            <p class="mt-1 text-xs text-neutral-500">{{ p.flags.includes('no_se:medidas') ? `${ESTIMADO}. ${PIERDE}` : PORQUE.medidas }}</p>
            <!-- No sabe las medidas: se estiman desde cuántos pallets quiere guardar (quedan estimadas) -->
            <details v-if="!p.bodega.forma" class="fl-mas mt-2 rounded-xl bg-neutral-50 px-3" :open="sinMedidas.abierto" @toggle="sinMedidas.abierto = ($event.target as HTMLDetailsElement).open">
              <summary class="!text-sm">¿No sabes las medidas? Calcúlalas desde tus pallets</summary>
              <div class="pb-3">
                <label class="fl-campo"><span class="!text-sm">¿Cuántos pallets quieres guardar?</span>
                  <input v-model.number="sinMedidas.pallets" type="number" min="1" step="1" inputmode="numeric" class="form-input" placeholder="Ej: 500">
                </label>
                <template v-if="medidasEstimadas">
                  <p class="mt-2 text-sm text-neutral-700">Para {{ n(sinMedidas.pallets ?? 0) }} pallets en selectivo doble de {{ medidasEstimadas.niveles }} {{ medidasEstimadas.niveles === 1 ? 'nivel' : 'niveles' }} (con {{ fm(p.bodega.altura ?? 8) }} m de altura) necesitas una bodega de unos <b>{{ fm(medidasEstimadas.ancho) }} × {{ fm(medidasEstimadas.largo) }} m</b> (~{{ n(medidasEstimadas.m2) }} m²).</p>
                  <button type="button" class="fl-btn-sec mt-2 w-full !min-h-10 !text-sm" @click="usarMedidasEstimadas">Usar estas medidas (quedan estimadas)</button>
                </template>
              </div>
            </details>
          </template>
        </section>

        <!-- Altura libre: decide cuántos niveles caben; va sola y grande -->
        <section class="fl-card">
          <label for="fl-altura-bodega" class="fl-leyenda">Altura libre <FlujoInfo>Desde el piso hasta lo más bajo del techo: una viga, una lámpara o un rociador. Si no sabes, usamos 8 m.</FlujoInfo></label>
          <div class="mt-2 flex items-stretch gap-2">
            <span class="relative flex-1">
              <input id="fl-altura-bodega" :value="p.bodega.altura ?? ''" type="number" min="2.5" max="40" step="0.1" inputmode="decimal" class="form-input !h-14 !pr-10 !text-2xl !font-semibold tabular-nums" placeholder="8" @change="cambiarAltura($event)">
              <i class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg not-italic text-neutral-500">m</i>
            </span>
            <button type="button" :class="['fl-nose !h-14', p.flags.includes('no_se:altura') && 'fl-nose--sel']" @click="alturaNoSe">No lo sé</button>
          </div>
          <!-- "No lo sé" (prompt de conversión §D): valores típicos; queda estimado y el ejecutivo lo confirma -->
          <div v-if="p.flags.includes('no_se:altura')" class="mt-2 grid grid-cols-2 gap-1.5">
            <button v-for="a in ALTURAS_TIPICAS" :key="a.m" type="button" :class="['fl-chip !min-h-9 !flex-col !gap-0 !text-sm leading-tight', p.bodega.altura === a.m && 'fl-chip--sel']" @click="p.bodega.altura = a.m">{{ a.t }} · {{ fm(a.m) }} m<span class="text-[11px] font-normal text-neutral-500">{{ a.d }}</span></button>
          </div>
          <p class="mt-1.5 text-xs text-neutral-500">{{ p.flags.includes('no_se:altura') ? `${ESTIMADO}. ${PIERDE}` : PORQUE.altura }}</p>
        </section>

        <!-- Portones y andenes: se arrastran por el muro; delante queda una franja libre para maniobrar -->
        <section class="fl-card">
          <p class="fl-leyenda">Portones y andenes</p>
          <div class="mt-3 grid grid-cols-3 gap-2">
            <button v-for="cl in (['porton', 'anden', 'oficina'] as const)" :key="cl" type="button" class="fl-chip !min-h-11 !text-sm" @click="agregarElemento(cl)">+ {{ ELEMENTOS[cl].nombre }}</button>
            <!-- Opcional: donde arman pallets (en 3D trabajan dos operarios); se arrastra y se cambia de tamaño como una oficina -->
            <button type="button" class="fl-chip col-span-3 !min-h-11 !text-sm" @click="agregarElemento('zonaCarga')">+ Zona de carga (armado de pallets)</button>
          </div>
          <p class="mt-2 flex items-start gap-2 text-xs text-neutral-600">
            <svg viewBox="0 0 16 12" class="mt-0.5 h-3 w-4 flex-shrink-0" aria-hidden="true"><rect x=".5" y=".5" width="15" height="11" fill="#f8fafc" stroke="#64748b" stroke-dasharray="2 1.5" /><path d="M4 .5 0 4.5M9 .5 0 9.5M14 .5 3 11.5M16 3.5 8 11.5M16 8.5 13 11.5" stroke="#94a3b8" stroke-width=".8" /></svg>
            <span>Delante de cada uno queda libre una franja para que la {{ grua.nombre.toLowerCase() }} entre y gire: {{ fm(maniobraDe(p.bodega, {})) }} m, su pasillo de trabajo.<FlujoReferencial :de="grua" /></span>
          </p>
        </section>

        <!-- Pilares: opcionales. Una grilla que se arrastra entera hasta calzar con los de la bodega -->
        <section class="rounded-2xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-neutral-900">{{ hayPilares ? `${nPilares} ${nPilares === 1 ? 'pilar' : 'pilares'} en tu bodega` : '¿Tu bodega tiene pilares?' }}</p>
              <p class="text-xs text-neutral-600">{{ hayPilares ? 'Arrástralos en el plano hasta que calcen: se mueven todos juntos.' : 'Agrégalos y ningún rack quedará encima.' }}</p>
            </div>
            <button v-if="!formPilares" type="button" class="fl-btn-sec !min-h-10 flex-shrink-0 !px-3 !text-sm" @click="formPilares = true">{{ hayPilares ? 'Cambiar' : 'Agregar' }}</button>
          </div>
          <form v-if="formPilares" class="mt-3" @submit.prevent="grillaPilares">
            <p class="text-sm font-medium text-neutral-800">¿Cada cuántos metros hay un pilar?</p>
            <div class="mt-1.5 grid grid-cols-2 gap-2">
              <label class="fl-campo"><span class="!text-sm">A lo ancho</span><span class="relative"><input v-model.number="gp.pasoX" type="number" min="2" step="0.5" inputmode="decimal" class="form-input !pr-8"><i class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm not-italic text-neutral-500">m</i></span></label>
              <label class="fl-campo"><span class="!text-sm">A lo largo</span><span class="relative"><input v-model.number="gp.pasoY" type="number" min="2" step="0.5" inputmode="decimal" class="form-input !pr-8"><i class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm not-italic text-neutral-500">m</i></span></label>
            </div>
            <p v-if="vistaPilares.length" class="mt-1.5 text-xs text-neutral-600" aria-live="polite">{{ nxm }} = {{ vistaPilares.length }} pilares, centrados en tu bodega (los ves en el plano). Después los arrastras hasta que calcen.</p>
            <p class="mt-3 text-sm font-medium text-neutral-800">¿De qué tamaño?</p>
            <div class="mt-1.5 grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Tamaño del pilar">
              <button v-for="t in TAMANOS_PILAR" :key="t.v" type="button" role="radio" :aria-checked="gp.tamano === t.v" :class="['fl-chip !min-h-10 !justify-start !gap-2 !px-2.5 !text-sm', gp.tamano === t.v && 'fl-chip--sel']" @click="gp.tamano = t.v">
                <svg viewBox="0 0 16 16" class="h-4 w-4 flex-shrink-0" aria-hidden="true">
                  <path v-if="t.forma === 'H'" d="M2 2h12v3H9.5v6H14v3H2v-3h4.5V5H2z" fill="#475569" />
                  <rect v-else-if="t.v !== 'nose'" :x="8 - t.s * 15" :y="8 - t.s * 15" :width="t.s * 30" :height="t.s * 30" fill="#475569" />
                  <rect v-else x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#475569" stroke-dasharray="2 1.5" />
                </svg>
                {{ t.t }}
              </button>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <button type="button" class="fl-btn-sec !min-h-10 !text-sm" @click="formPilares = false">Cancelar</button>
              <button type="submit" class="fl-btn !min-h-10 !text-sm" :disabled="!vistaPilares.length">Poner {{ vistaPilares.length }}</button>
            </div>
          </form>
          <button v-else-if="hayPilares" type="button" class="mt-1 text-sm text-red-700 underline underline-offset-2" @click="quitarPilares">Quitar todos los pilares</button>
        </section>
        </template>

        <!-- Lo que ya tiene en su bodega: se dibuja en gris, no se cotiza, y lo nuevo se ubica alrededor -->
        <section v-show="pestana === 'tengo'" class="fl-card">
          <p class="fl-leyenda">Lo que ya tienes</p>
          <p class="mt-1 text-sm text-neutral-600">¿Ya tienes racks en esta bodega? Dibújalos y diseñamos lo nuevo alrededor. Solo cotizamos lo nuevo.</p>
          <div v-if="nuevoExistente" class="mt-3 space-y-3 rounded-xl bg-neutral-50 p-3">
            <div class="grid grid-cols-3 gap-1">
              <button v-for="t in (['RS', 'DI', 'AR'] as const)" :key="t" type="button" :class="['fl-chip !min-h-10 !px-1 !text-xs', nuevoExistente.tipo === t && 'fl-chip--sel']" @click="nuevoExistente.tipo = t">{{ NOMBRE[t] }}</button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div><p class="text-sm text-neutral-600">{{ nuevoExistente.tipo === 'DI' ? 'Calles' : 'Cuerpos (espacios entre marcos)' }}</p><FlujoNumero :valor="nuevoExistente.cuerpos" :min="1" :max="50" etiqueta="cuerpos" @cambio="nuevoExistente.cuerpos = $event" /></div>
              <div><p class="text-sm text-neutral-600">{{ nuevoExistente.tipo === 'AR' ? 'Repisas' : 'Niveles sobre el piso' }}</p><FlujoNumero :valor="nuevoExistente.niveles" :min="1" :max="8" etiqueta="niveles" @cambio="nuevoExistente.niveles = $event" /></div>
            </div>
            <div v-if="nuevoExistente.tipo !== 'DI'" class="grid grid-cols-2 gap-1">
              <button v-for="d in [false, true]" :key="String(d)" type="button" :class="['fl-chip !min-h-10 !text-sm', nuevoExistente.doble === d && 'fl-chip--sel']" @click="nuevoExistente.doble = d">{{ d ? 'Doble (espalda con espalda)' : 'Simple' }}</button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="fl-btn-sec !min-h-10 !text-sm" @click="nuevoExistente = null">Cancelar</button>
              <button type="button" class="fl-btn !min-h-10 !text-sm" @click="agregarExistente">Ponerlo en el plano</button>
            </div>
          </div>
          <button v-else type="button" class="fl-btn-sec mt-3 w-full" @click="nuevoExistente = { tipo: 'RS', cuerpos: 4, niveles: 3, doble: false }">+ Dibujar un rack que ya tengo</button>
          <p v-if="existentes.length" class="mt-2 text-sm text-neutral-600">{{ existentes.length }} {{ existentes.length === 1 ? 'rack' : 'racks' }} que ya tienes (en gris). Arrástralos a donde están hoy.</p>
        </section>

        <!-- Antes / después: dibuja cómo está hoy tu bodega y compárala con la propuesta -->
        <section v-show="pestana === 'hoy'" class="fl-card">
          <p class="fl-leyenda">Tu bodega hoy vs nuestra propuesta</p>
          <p class="mt-1 text-sm text-neutral-600">Dibuja los racks que tienes hoy (aunque los vayas a cambiar) y compara cuánto ganas.</p>
          <div class="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1" role="group" aria-label="Qué layout editas">
            <button v-for="e in [{ v: 'propuesta', t: 'Propuesta Racklog' }, { v: 'hoy', t: 'Mi bodega hoy' }]" :key="e.v" type="button" :aria-pressed="escenario === e.v" :class="['h-10 rounded-md text-sm font-semibold', escenario === e.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="escenario = e.v as any">{{ e.t }}</button>
          </div>
          <div v-if="nuevoExistente && enHoy" class="mt-3 space-y-3 rounded-xl bg-neutral-50 p-3">
            <div class="grid grid-cols-3 gap-1">
              <button v-for="t in (['RS', 'DI', 'AR'] as const)" :key="t" type="button" :class="['fl-chip !min-h-10 !px-1 !text-xs', nuevoExistente.tipo === t && 'fl-chip--sel']" @click="nuevoExistente.tipo = t">{{ NOMBRE[t] }}</button>
            </div>
            <div class="fl-prop"><span>{{ nuevoExistente.tipo === 'DI' ? 'Calles' : 'Cuerpos' }}</span><FlujoNumero :valor="nuevoExistente.cuerpos" :min="1" :max="50" etiqueta="cuerpos" @cambio="nuevoExistente.cuerpos = $event" /></div>
            <div class="fl-prop"><span>{{ nuevoExistente.tipo === 'AR' ? 'Repisas' : 'Niveles sobre el piso' }}</span><FlujoNumero :valor="nuevoExistente.niveles" :min="1" :max="8" etiqueta="niveles" @cambio="nuevoExistente.niveles = $event" /></div>
            <div v-if="nuevoExistente.tipo !== 'DI'" class="grid grid-cols-2 gap-1">
              <button v-for="d in [false, true]" :key="String(d)" type="button" :class="['fl-chip !min-h-10 !text-sm', nuevoExistente.doble === d && 'fl-chip--sel']" @click="nuevoExistente.doble = d">{{ d ? 'Doble' : 'Simple' }}</button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="fl-btn-sec !min-h-10 !text-sm" @click="nuevoExistente = null">Cancelar</button>
              <button type="button" class="fl-btn !min-h-10 !text-sm" @click="agregarHoy">Ponerlo en el plano</button>
            </div>
          </div>
          <button v-else type="button" class="fl-btn-sec mt-3 w-full" @click="escenario = 'hoy'; nuevoExistente = { tipo: 'RS', cuerpos: 6, niveles: 2, doble: false }">+ Dibujar un rack de hoy</button>
          <p v-if="enHoy && p.racksHoy.length" class="mt-2 text-sm text-neutral-600">Arrastra cada rack a donde está hoy; tócalo para girarlo, duplicarlo o repetirlo.</p>

          <!-- Métricas -->
          <table v-if="p.racksHoy.length" class="mt-4 w-full text-sm">
            <thead><tr class="text-left text-xs uppercase tracking-wide text-neutral-500"><th class="pb-1.5 font-semibold" /><th class="pb-1.5 text-right font-semibold">Hoy</th><th class="pb-1.5 text-right font-semibold">Propuesta</th></tr></thead>
            <tbody class="tabular-nums text-neutral-800">
              <tr class="border-t border-neutral-100"><td class="py-1.5">Posiciones de pallet</td><td class="py-1.5 text-right">{{ n(comparacion.hoy.posiciones) }}</td><td class="py-1.5 text-right font-semibold text-neutral-900">{{ n(comparacion.prop.posiciones) }}</td></tr>
              <tr class="border-t border-neutral-100"><td class="py-1.5">m² ocupados <FlujoInfo>Racks con sus pasillos de trabajo.</FlujoInfo></td><td class="py-1.5 text-right">{{ n(comparacion.hoy.m2) }}</td><td class="py-1.5 text-right font-semibold text-neutral-900">{{ n(comparacion.prop.m2) }}</td></tr>
              <tr class="border-t border-neutral-100"><td class="py-1.5">Posiciones cada 100 m²</td><td class="py-1.5 text-right">{{ n(comparacion.densHoy) }}</td><td class="py-1.5 text-right font-semibold text-neutral-900">{{ n(comparacion.densProp) }}</td></tr>
            </tbody>
          </table>
          <p v-if="p.racksHoy.length && comparacion.mejora !== null" :class="['mt-3 rounded-xl px-3 py-2.5 text-sm font-medium', comparacion.mejora > 0 ? 'bg-green-50 text-green-900' : 'bg-neutral-100 text-neutral-700']">
            <template v-if="comparacion.mejora > 0">Con la propuesta guardas <b class="text-base">{{ comparacion.mejora }} % más pallets</b> ({{ n(comparacion.prop.posiciones - comparacion.hoy.posiciones) }} posiciones más){{ comparacion.mejoraDens && comparacion.mejoraDens > 0 ? ` y aprovechas ${comparacion.mejoraDens} % mejor cada m²` : '' }}.</template>
            <template v-else>Tu layout de hoy guarda lo mismo o más: revisemos juntos qué conviene.</template>
          </p>
        </section>

        <!-- Lo que cabe -->
        <section v-if="modo === 'layout'" :class="['fl-card', cob.productos.some((x: any) => !x.ok) || cob.modelos.some((x: any) => x.diferencia < 0) ? 'ring-2 ring-amber-300' : '']">
          <div class="flex items-center justify-between gap-2">
            <p class="fl-leyenda">Tus racks en la bodega</p>
          </div>
          <p class="mt-1 text-sm text-neutral-600"><b>Dibujar</b>: arrastra en el plano por donde va el rack. O pon <b>1 cuerpo</b> y agrándalo tirando de sus flechas.</p>
          <ul class="mt-3 space-y-2.5">
            <li v-for="m in p.modelos" :key="m.id" :class="['rounded-xl p-2.5 ring-1', pincel?.modelo === m.id ? 'bg-brand-50 ring-brand-400' : 'bg-white ring-neutral-200']">
              <div class="flex items-center gap-2">
                <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-bold text-white" :style="{ background: colorModelo(m.id).borde }">{{ letraModelo(m.id) }}</span>
                <span class="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-900">{{ m.nombre }}</span>
                <span v-for="c in [cob.modelos.find((x: any) => x.id === m.id)]" :key="`f${m.id}`" :class="['whitespace-nowrap text-sm font-semibold tabular-nums', !c ? '' : c.diferencia < 0 ? 'text-amber-700' : 'text-green-700']">
                  <template v-if="c">{{ c.diferencia < 0 ? `Faltan ${-c.diferencia} ${c.unidadCuerpo}` : '✓ Cumple lo pedido' }}</template>
                </span>
              </div>
              <div class="mt-2 flex gap-2">
                <div v-if="m.tipo !== 'DI'" class="flex rounded-lg bg-neutral-100 p-0.5" role="group" :aria-label="`Simple o doble, ${m.nombre}`">
                  <button v-for="o in [{ v: false, t: 'Simple' }, { v: true, t: 'Doble' }]" :key="o.t" type="button" :aria-pressed="dobleDe(m) === o.v" :class="['h-9 rounded-md px-3 text-sm font-semibold', dobleDe(m) === o.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="elegirDoble(m, o.v)">{{ o.t }} <span class="text-xs font-normal opacity-70">{{ n(aporteCuerpo(m, o.v)) }}</span></button>
                </div>
                <button type="button" :aria-pressed="pincel?.modelo === m.id" :class="['h-10 flex-1 rounded-lg px-3 text-sm font-semibold', pincel?.modelo === m.id ? 'bg-brand-700 text-white' : 'bg-brand-600 text-white hover:bg-brand-700']" @click="tomarPincel(m.id)">
                  {{ pincel?.modelo === m.id ? 'Listo' : '✏️ Dibujar' }}
                </button>
              </div>
              <p class="mt-1.5 flex items-center justify-between gap-2 text-xs text-neutral-500">
                <span>{{ m.tipo === 'AR' ? 'Cajas' : 'Posiciones' }} por cada {{ fm(largoCuerpo(m)) }} m de largo</span>
                <button type="button" class="rounded-md px-2 py-1 font-semibold text-brand-700 ring-1 ring-brand-300 hover:bg-brand-50" @click="agregarLineal(m.id, dobleDe(m), 1)">+ 1 {{ m.tipo === 'DI' ? 'calle' : 'cuerpo' }}</button>
              </p>
            </li>
          </ul>
          <!-- En celular el plano queda arriba: lo que se descontó se dice junto a los botones -->
          <!-- "Llenar mi bodega" (menú Más) pide confirmación si ya hay racks puestos -->
          <template v-if="confirmarLlenar">
            <p class="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900" role="alert">Ya acomodaste {{ racksNuevos }} {{ racksNuevos === 1 ? 'rack' : 'racks' }}. "Llenar mi bodega" los vuelve a ubicar todos desde cero.</p>
            <div class="mt-2 flex gap-2">
              <button type="button" class="fl-btn-sec flex-1 !min-h-10 !text-sm" @click="confirmarLlenar = false">Conservar mi layout</button>
              <button type="button" class="fl-btn-sec flex-1 !min-h-10 !text-sm !text-red-700" @click="confirmarLlenar = false; ubicar(true)">Sí, ubicar de nuevo</button>
            </div>
          </template>
          <div v-if="cob.productos.length > 1" class="mt-3 border-t border-neutral-100 pt-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Por producto</p>
            <ul class="mt-2 space-y-1.5">
              <li v-for="x in cob.productos" :key="x.id" class="flex items-start gap-2 text-sm">
                <span class="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-sm" :style="{ background: x.color }" aria-hidden="true" />
                <span class="min-w-0 flex-1">
                  <b class="text-neutral-900">{{ x.nombre }}:</b> {{ n(x.posiciones) }}/{{ n(x.necesita) }} posiciones
                  <span v-if="x.ok" class="text-green-700">✓</span>
                  <span v-else class="text-amber-800">— te faltan {{ x.faltanCuerpos ? `${x.faltanCuerpos} ${x.faltanCuerpos === 1 ? 'cuerpo' : 'cuerpos'}` : `${n(x.falta)} posiciones` }}</span>
                  <span v-if="dondeVa(x.id)" class="block text-xs text-neutral-500">{{ dondeVa(x.id) }}</span>
                </span>
              </li>
            </ul>
          </div>
          <p v-if="Object.keys(faltan).length" class="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            No cabe todo en tu bodega. Opciones: subir un nivel en el paso de rack, usar un rack doble o agrandar las medidas.
          </p>
        </section>
      </div>

      <!-- Plano 2D o vista 3D -->
      <div class="fl-card z-20 order-first self-start !p-0 overflow-hidden shadow-md lg:sticky lg:top-20 lg:order-none lg:shadow-none">
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-neutral-100 px-3 py-2 lg:px-4 lg:py-3">
          <div class="flex gap-1 rounded-lg bg-neutral-100 p-1" role="tablist" aria-label="Vista">
            <button v-for="v in (['2d', '3d'] as const)" :key="v" type="button" role="tab" :aria-selected="vista === v" :class="['rounded-md px-3 py-1.5 text-sm font-semibold lg:px-4 lg:py-2', vista === v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="vista = v">{{ v === '2d' ? 'Plano 2D' : 'Vista 3D' }}</button>
          </div>
          <div v-if="p.racksHoy.length" class="flex gap-1 rounded-lg bg-neutral-100 p-1" role="group" aria-label="Qué layout ves">
            <button v-for="e in [{ v: 'propuesta', t: 'Propuesta' }, { v: 'hoy', t: 'Hoy' }]" :key="e.v" type="button" :aria-pressed="escenario === e.v" :class="['rounded-md px-3 py-1.5 text-sm font-semibold', escenario === e.v ? (e.v === 'hoy' ? 'bg-slate-700 text-white' : 'bg-white text-brand-800 shadow-sm') : 'text-neutral-600']" @click="escenario = e.v as any">{{ e.t }}</button>
          </div>
          <span v-if="enHoy" class="text-sm text-neutral-600">Hoy: <b class="text-lg text-neutral-900">{{ n(comparacion.hoy.posiciones) }}</b> posiciones</span>
          <span v-else-if="hoy.posiciones" class="text-sm text-neutral-600">Hoy <b class="text-neutral-900">{{ n(hoy.posiciones) }}</b> · Nuevo <b class="text-neutral-900"><FlujoContador :valor="total.pallets" /></b> · Total <b class="text-lg text-neutral-900">{{ n(hoy.posiciones + total.pallets) }}</b> posiciones</span>
          <span v-else-if="modo === 'layout'" class="text-sm text-neutral-600"><b class="text-neutral-900">{{ racksNuevos }}</b> {{ racksNuevos === 1 ? 'rack' : 'racks' }} · <template v-if="total.pallets || !total.bandejas"><b class="text-lg text-neutral-900"><FlujoContador :valor="total.pallets" /></b> posiciones</template><template v-if="total.pallets && total.bandejas"> · </template><template v-if="total.bandejas"><b class="text-lg text-neutral-900">{{ n(total.bandejas) }}</b> cajas</template></span>
        </div>
        <!-- Demanda contra lo que hay en el plano: siempre a la vista mientras el cliente mueve, acorta o parte filas -->
        <div v-if="modo === 'layout' && !enHoy && demanda.necesita" :class="['flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b px-3 py-1.5 text-sm lg:hidden', demanda.faltan ? 'border-amber-100 bg-amber-50 text-amber-950' : 'border-green-100 bg-green-50 text-green-900']" role="status">
          <!-- Lo que pidió se va descontando con cada lineal que pone -->
          <span class="min-w-0 flex-1">
            <span class="block">
              <template v-if="demanda.unidad === 'pallets'">Necesitas <b>{{ n(demanda.necesita) }} posiciones</b>
                <label class="inline-flex items-center gap-1 whitespace-nowrap opacity-80">({{ n(demanda.pidio) }} pallets al <select :value="Math.round((p.bodega.ocupacion ?? 0.8) * 100)" class="rounded border border-current/20 bg-white/70 px-0.5 text-sm font-semibold" aria-label="Factor de ocupación" @change="p.bodega.ocupacion = Number(($event.target as HTMLSelectElement).value) / 100"><option v-for="v in [60, 65, 70, 75, 80, 85]" :key="v" :value="v">{{ v }} %</option></select><FlujoInfo>Nadie llena el 100 % de sus posiciones: entra y sale mercadería, hay lotes a medio usar y se necesita espacio para mover. Con 80 %, 100 pallets piden 125 posiciones.</FlujoInfo>)</label></template>
              <template v-else>Pediste <b>{{ n(demanda.necesita) }} {{ demanda.unidadPos }}</b></template>
              · en el plano <b><FlujoContador :valor="demanda.posiciones" /></b>
              <template v-if="porPoner > 0"> — <b>faltan {{ n(porPoner) }}</b></template>
              <template v-else-if="demanda.faltan"> — <b>faltan {{ demanda.faltan }} {{ demanda.faltan === 1 ? demanda.unidadCuerpo.replace(/s$/, '') : demanda.unidadCuerpo }}</b> de un producto</template>
              <template v-else> — <b>✓ ya cumples</b></template>
            </span>
            <span class="mt-1 block h-1.5 overflow-hidden rounded-full bg-black/10" aria-hidden="true">
              <span :class="['block h-full rounded-full transition-all duration-300', demanda.faltan ? 'bg-amber-500' : 'bg-green-600']" :style="{ width: `${Math.min(100, (demanda.posiciones / Math.max(1, demanda.necesita)) * 100)}%` }" />
            </span>
          </span>
          <button v-if="cubierto" type="button" class="hidden rounded-lg bg-green-700 px-3 py-1 sm:inline-flex text-sm font-semibold text-white hover:bg-green-800" @click="emit('siguiente')">Seguir con accesorios →</button>
        </div>
        <!-- Barra del plano: cambia según lo que está haciendo el cliente (nada elegido / un rack elegido) -->
        <div v-if="modo === 'layout' && vista === '2d'" class="relative flex h-12 flex-nowrap items-center gap-1.5 overflow-x-auto border-b border-neutral-100 bg-neutral-50 px-2 lg:px-3" :class="menu ? '!overflow-visible' : ''">
          <button type="button" :class="BTN" :disabled="!puedeDeshacer" title="Deshacer (Ctrl+Z)" aria-label="Deshacer" @click="deshacer"><span aria-hidden="true">↶</span><span class="hidden sm:inline">Deshacer</span></button>
          <button type="button" :class="BTN" :disabled="!puedeRehacer" title="Rehacer (Ctrl+Y)" aria-label="Rehacer" @click="rehacer"><span aria-hidden="true">↷</span></button>
          <span class="mx-0.5 h-6 w-px bg-neutral-300" aria-hidden="true" />
          <!-- Un rack elegido: se maneja en el mismo plano (flechas y menú sobre el rack); aquí solo qué es -->
          <template v-if="rackSel && !rackSel.existente && !enHoy">
            <span class="flex min-w-0 items-center gap-1.5 text-sm text-neutral-800">
              <span class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[11px] font-bold text-white" :style="{ background: colorModelo(rackSel.modelo).borde }">{{ letraModelo(rackSel.modelo) }}</span>
              <b class="whitespace-nowrap">{{ n(contenidoTotal(rackSel)) }} {{ rackSel.tipo === 'AR' ? 'cajas' : 'posiciones' }}</b>
              <span v-if="rackSel.perdidas" class="whitespace-nowrap text-neutral-600">({{ n(rackSel.perdidas) }} menos por {{ rackSel.pilares > 1 || (rackSel.tapadas && rackSel.pilares) ? 'pilares' : 'un pilar' }})</span>
              <span class="hidden truncate text-neutral-500 md:inline">· tira de las flechas <b class="text-brand-700">naranjas</b> para alargarlo y de las <b class="text-neutral-900">negras</b> para sumar filas</span>
            </span>
            <button type="button" :class="[BTN, 'ml-auto flex-shrink-0']" aria-label="Listo" @click="sel = null">Listo</button>
          </template>
          <!-- Nada elegido: alinear, agregar y lo demás en menús -->
          <template v-else-if="!enHoy">
            <span class="relative">
              <button type="button" :class="BTN" :aria-expanded="menu === 'agregar'" @click="menu = menu === 'agregar' ? '' : 'agregar'">+ Agregar <span aria-hidden="true">▾</span></button>
              <div v-if="menu === 'agregar'" :class="MENU" role="menu">
                <button type="button" role="menuitem" :class="ITEM" @click="menu = ''; empezarTrazado()"><span class="h-3 w-3 rounded-sm bg-green-500" />Pasillo peatonal (se dibuja)</button>
                <button type="button" role="menuitem" :class="ITEM" @click="menu = ''; agregarElemento('pasilloGrua')"><span class="h-3 w-3 rounded-sm bg-amber-300" />Pasillo de grúa</button>
                <button type="button" role="menuitem" :class="ITEM" @click="menu = ''; ponerGrua()"><span class="h-3 w-3 rounded-sm bg-yellow-400" />Grúa (para ver su giro)</button>
                <button type="button" role="menuitem" :class="ITEM" @click="menu = ''; agregarElemento('zonaCarga')"><span class="h-3 w-3 rounded-sm bg-teal-300" />Zona de carga (armado de pallets)</button>
                <button type="button" role="menuitem" :class="ITEM" @click="menu = ''; agregarElemento('zona')"><span class="h-3 w-3 rounded-sm bg-red-300" />Zona que no se usa</button>
                <button type="button" role="menuitem" :class="ITEM" @click="menu = ''; pestana = 'tengo'"><span class="h-3 w-3 rounded-sm border border-dashed border-slate-400 bg-slate-100" />Racks que ya tengo</button>
              </div>
            </span>
            <span class="relative">
              <button type="button" :class="BTN" :aria-expanded="menu === 'mas'" @click="menu = menu === 'mas' ? '' : 'mas'">Más <span aria-hidden="true">▾</span></button>
              <div v-if="menu === 'mas'" :class="MENU" role="menu">
                <button v-if="racksNuevos > 1" type="button" role="menuitem" :class="ITEM" @click="menu = ''; alinearPasillos()">Alinear mis filas al pasillo exacto</button>
                <button type="button" role="menuitem" :class="ITEM" @click="menu = ''; llenar()">Llenar mi bodega por mí</button>
                <button v-if="demanda.faltan && p.racks.length" type="button" role="menuitem" :class="ITEM" @click="menu = ''; ubicarLosQueFaltan()">Ubicar solo lo que falta</button>
                <button type="button" role="menuitem" :class="ITEM" @click="menu = ''; verRecorrido = !verRecorrido">{{ verRecorrido ? 'Ocultar' : 'Ver' }} el recorrido de la grúa</button>
                <button type="button" role="menuitem" :class="ITEM" @click="menu = ''; verAccesorios = !verAccesorios">{{ verAccesorios ? 'Ocultar' : 'Ver' }} los accesorios</button>
                <button type="button" role="menuitem" :class="ITEM" @click="menu = ''; pestana = 'hoy'">Comparar con mi bodega de hoy</button>
              </div>
            </span>
            <span class="ml-auto hidden truncate text-xs text-neutral-500 md:inline">{{ racksNuevos ? 'Toca un rack para alargarlo, sumar filas o girarlo' : 'Empieza con ✏️ Dibujar o + 1 cuerpo' }}</span>
          </template>
        </div>
        <!-- En el celular la bandeja queda bajo el plano: los pinceles van aquí, a mano -->
        <div v-if="modo === 'layout' && !enHoy && vista === '2d'" class="flex gap-1.5 overflow-x-auto border-b border-neutral-100 px-3 py-2 lg:hidden">
          <template v-for="m in p.modelos" :key="`pm-${m.id}`">
            <button v-for="d in (m.tipo === 'DI' ? [false] : [false, true])" :key="`${m.id}${d}`" type="button" :aria-pressed="pincel?.modelo === m.id && pincel.doble === d" :class="['flex h-9 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-sm font-semibold ring-1', pincel?.modelo === m.id && pincel.doble === d ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-neutral-800 ring-neutral-300']" @click="pincel?.modelo === m.id && pincel.doble === d ? (pincel = null) : (elegirDoble(m, d), pincel = null, tomarPincel(m.id))">
              <span class="flex h-4 w-4 items-center justify-center rounded-sm text-[10px] font-bold text-white" :style="{ background: colorModelo(m.id).borde }">{{ letraModelo(m.id) }}</span>✏️ {{ m.tipo === 'DI' ? 'Bloque' : d ? 'Doble' : 'Simple' }}
            </button>
          </template>
        </div>
        <div class="flex flex-col lg:min-h-[500px] lg:flex-row">
          <div class="min-w-0 flex-1">
        <div v-show="vista === '2d'">
          <div class="relative h-[44svh] lg:h-[max(440px,calc(100svh-19rem))]">
          <!-- Con zoom: un toque vuelve a toda la bodega -->
          <div class="absolute bottom-3 right-3 z-10 flex flex-col overflow-hidden rounded-lg bg-white/95 shadow-sm ring-1 ring-black/10">
            <button type="button" class="h-9 w-9 text-lg font-semibold text-neutral-700 hover:bg-neutral-100" aria-label="Acercar" title="Acercar" @click="plano?.acercar(1.4)">+</button>
            <button type="button" class="h-9 w-9 border-t border-black/10 text-lg font-semibold text-neutral-700 hover:bg-neutral-100" aria-label="Alejar" title="Alejar" @click="plano?.acercar(1 / 1.4)">−</button>
            <button type="button" class="h-9 w-9 border-t border-black/10 text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-30" aria-label="Ver toda la bodega" title="Ver toda la bodega" :disabled="!((plano as any)?.zoom > 1)" @click="plano?.restablecerVista()">⤢</button>
          </div>
          <!-- Sobre el rack elegido: solo lo que no se hace tirando de las flechas -->
          <div v-if="menuRack" class="absolute z-20 flex items-center gap-0.5 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/10" :style="{ left: `${menuRack.x}px`, top: `${menuRack.y}px` }" role="toolbar" aria-label="Rack elegido">
            <button type="button" :class="MENU_RACK" title="Girar 90°" @click="girar(rackSel.id)"><span aria-hidden="true">⟳</span> Girar</button>
            <button type="button" :class="[MENU_RACK, '!text-red-700']" title="Quitar este rack" @click="eliminar(rackSel.id)"><span aria-hidden="true">🗑</span> Quitar</button>
            <button type="button" :class="[MENU_RACK, detalle && '!bg-neutral-900 !text-white']" :aria-pressed="detalle" @click="detalle = !detalle">Más…</button>
          </div>
          <PlanificadorPlano2D
            :bodega="p.bodega" :racks="racksPlano" :seleccion="sel" :conflictos="malos" :ocultar-accesorios="!verAccesorios" :fantasmas="fantasmas" :colores="coloresModelos" :etiquetas="letrasModelos" ref="plano" :editar-contorno="!!p.bodega.forma" :muro-sel="muroSel"
            @mover-vertice="moverVertice" @seleccionar-muro="muroSel = $event; sel = null; elementoSel = null"
            :pasillos="listaPasillos" :marcas="enHoy ? [] : marcas" :elemento-sel="elementoSel"
            :trazando="!!trazado" :agregando-cruce="agregandoCruce" :trazo-peatonal="trazado ? { puntos: trazado.puntos, ancho: trazado.ancho } : null"
            :pincel="pincel && !enHoy ? armarLineal : null" @pintar="pintarLineal" :guias-rack="guias" @fin-cambio="guias = []"
            :flechas-rack="modo === 'layout' && !enHoy && !!rackSel && !rackSel.existente" :flechas-no="flechasNo" @estirar-rack="estirarRack"
            :recorridos="verRecorrido && !enHoy ? recorridos : null" :sugerencias-tunel="verRecorrido && !enHoy ? sugerencias : []" :fantasma-grua="fantasmaGrua"
            @tramo-trazo="tramoTrazo" @terminar-trazo="terminarTrazado" @aplicar-tunel="aplicarSugerencia" @girar-elemento="girarElemento"
            :dibujando="!!dibujo" :puntos-dibujo="dibujo ?? []" :solo-rectos="!diagonales"
            @agregar-punto="agregarPuntoDibujo" @cerrar-contorno="terminarDibujo" :largo-escrito="largoEscritoNum" :bloque-pilares="moverPilares === 'todos'"
            class="p-3"
            @seleccionar="sel = $event; if ($event) { elementoSel = null; pincel = null }"
            @mover="mover" @girar="girar" @eliminar="eliminar"
            @seleccionar-elemento="elegirElemento"
            @mover-elemento="moverElemento"
            @eliminar-elemento="quitarElemento"
            @cambiar-elemento="(id: string, c: any) => cambiarElemento(c, id)"
            @punto-trazo="puntoTrazo" @cruce-elemento="cruce"
          />
          <!-- Flotando sobre el plano (no lo empujan: el plano no se corre bajo el mouse): vista previa de filas y
               avisos que piden una acción -->
          <div v-if="modo === 'layout' && !trazado && !pincel && !textoEstirar && ((rackSel && previaRacks.length) || sinSalida.length || malos.size)" :ref="observarAvisos" class="pointer-events-none absolute inset-x-2 top-2 z-10 space-y-2 lg:inset-x-3">
            <div class="pointer-events-auto">
              <!-- Filas en vista previa: cuántas caben y si con ellas cumple lo pedido; un toque las pone -->
              <div v-if="rackSel && previaRacks.length && !enHoy" class="flex flex-wrap items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm shadow-md ring-1 ring-brand-200" role="status">
          <span class="min-w-0 flex-1 text-neutral-700">
            <b class="text-neutral-900">+{{ previaRacks.filter((c) => c.ok).length }} {{ previaRacks.filter((c) => c.ok).length === 1 ? 'fila' : 'filas' }}</b> (punteadas) · +{{ n(aportePrevia) }} {{ demanda.unidadPos }}
            <template v-if="faltaDelModelo(rackSel) > 0"> · <b :class="aportePrevia >= faltaDelModelo(rackSel) ? 'text-green-700' : 'text-amber-800'">{{ aportePrevia >= faltaDelModelo(rackSel) ? '✓ con esto cumples lo pedido' : `te faltarían ${n(faltaDelModelo(rackSel) - aportePrevia)}` }}</b></template>
            <template v-if="filasJustas"> · <button type="button" class="font-semibold text-brand-700 underline" @click="bloque.profundidad = filasJustas; filasJustas = 0">bastan {{ filasJustas }}</button></template>
            <template v-if="previaRacks.some((c) => !c.ok)"> · <span class="text-red-700">{{ previaRacks.filter((c) => !c.ok).length }} no caben</span></template>
          </span>
          <span v-if="rackSel.tipo === 'AR'" class="flex items-center gap-1 text-xs text-neutral-600">Pasillo
            <select v-model.number="bloque.pasillo" class="rounded-md border border-neutral-300 bg-white px-1 py-0.5 text-sm font-semibold" aria-label="Pasillo entre filas"><option v-for="v in PASILLOS_AR" :key="v" :value="v">{{ fm(v) }} m</option></select>
          </span>
          <label v-if="!rackSel.doble && rackSel.tipo !== 'DI'" class="flex items-center gap-1 text-xs text-neutral-600"><input v-model="bloque.espalda" type="checkbox" class="h-4 w-4 accent-brand-600">Espalda con espalda</label>
          <button type="button" class="rounded-lg bg-brand-600 px-3 py-1 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50" :disabled="!previaRacks.some((c) => c.ok)" @click="repetir(rackSel)">✓ Poner</button>
              </div>
            </div>
            <div v-if="!(rackSel && previaRacks.length)" class="pointer-events-auto">
              <!-- Avisos que piden una acción: pasillo sin salida para la grúa, racks en rojo, resultado de alinear -->
              <div v-if="sinSalida.length && !trazado" class="flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 shadow-md ring-1 ring-red-200" role="alert">
          <span class="min-w-0 flex-1"><b>La grúa no puede entrar</b> a {{ sinSalida.length === 1 ? 'un pasillo' : `${sinSalida.length} pasillos` }}<span class="hidden sm:inline">: en las dos puntas de las filas queda menos de {{ fm(grua.pasillo) }} m hasta el muro. Si las acortamos por una punta, queda un pasillo cruzado por donde la grúa llega</span>.</span>
          <button type="button" class="rounded-lg bg-red-700 px-3 py-1 text-sm font-semibold text-white hover:bg-red-800" @click="abrirPaso">Acortar filas<span class="hidden sm:inline"> para que entre la grúa</span></button>
              </div>
              <div v-else-if="malos.size && !enHoy" class="flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 shadow-md ring-1 ring-red-200" role="alert">
          <span class="min-w-0 flex-1"><b>{{ malos.size }} {{ malos.size === 1 ? 'rack choca' : 'racks chocan' }}</b> con otro rack, una zona o el muro (en rojo).</span>
          <button type="button" class="rounded-lg bg-white px-3 py-1 text-sm font-semibold text-red-800 ring-1 ring-red-300" @click="verConflicto">Ver</button>
          <button type="button" class="rounded-lg bg-red-700 px-3 py-1 text-sm font-semibold text-white" @click="reubicarConflictos">Reubicar solo esos</button>
              </div>
            </div>
          </div>
          <!-- Mientras tira de una flecha: qué va a quedar, arriba al centro (no lo tapa el dedo) -->
          <p v-if="textoEstirar" class="pointer-events-none absolute left-1/2 top-2 z-20 max-w-[calc(100%-1rem)] -translate-x-1/2 truncate rounded-lg bg-slate-900/90 px-3 py-1.5 text-sm font-semibold text-white shadow" role="status" aria-live="polite">{{ textoEstirar }}</p>
          <!-- Lo que acaba de pasar (descontó, alineó): chico, abajo a la izquierda, y se va solo -->
          <p v-if="avisoAlinear || avisoFaltan" class="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[min(26rem,calc(100%-4.5rem))] rounded-lg bg-slate-900/85 px-3 py-1.5 text-sm text-white shadow" role="status" aria-live="polite">{{ avisoAlinear || avisoFaltan }}</p>
          <!-- Dibujando un lineal: qué hacer, en el mismo plano, chico para no tapar -->
          <div v-if="pincel && pincelModelo" class="pointer-events-none absolute left-2 top-2 z-10 flex select-none items-center gap-2 rounded-lg bg-slate-900/85 py-1 pl-3 pr-1 text-sm text-white shadow" role="status" aria-live="polite">
            <span>Arrastra donde va el {{ pincelModelo.tipo === 'DI' ? 'bloque' : `lineal ${pincel.doble ? 'doble' : 'simple'}` }}<span class="hidden sm:inline text-slate-300"> · toca un rack para girarlo o repetirlo</span></span>
            <button type="button" class="pointer-events-auto rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-900" @click="pincel = null">Listo</button>
          </div>
          <!-- Dibujando un pasillo peatonal: qué hacer, en el mismo plano, con deshacer y listo -->
          <div v-if="trazado" class="pointer-events-none absolute inset-x-2 top-2 z-10 select-none rounded-xl bg-green-700/90 px-3 py-2 text-sm text-white shadow-lg lg:inset-x-auto lg:left-3 lg:max-w-sm" role="status" aria-live="polite">
            <div class="flex items-center gap-1.5">
              <p class="mr-auto font-semibold leading-tight">{{ trazado.puntos.length ? 'Marca donde termina el tramo' : 'Toca donde empieza el pasillo' }}<span class="block text-xs font-normal text-green-100">{{ trazado.ids.length }} {{ trazado.ids.length === 1 ? 'tramo' : 'tramos' }}<template v-if="largoTrazado"> · {{ fm(largoTrazado) }} m</template><template v-if="trazado.puntos.length"><span class="sm:hidden"> · doble toque para terminar</span></template><template v-else><span class="sm:hidden"> · o arrastra el dedo</span></template></span></p>
              <button type="button" class="pointer-events-auto min-h-10 rounded-lg bg-white/15 px-3 text-sm font-semibold hover:bg-white/25 disabled:opacity-50" :disabled="!trazado.puntos.length" @click="deshacerTramo">Deshacer</button>
              <button type="button" class="pointer-events-auto min-h-10 rounded-lg bg-white px-3 text-sm font-semibold text-green-800" @click="terminarTrazado">Listo</button>
            </div>
            <p class="mt-1 hidden text-xs text-green-50 sm:block">{{ trazado.puntos.length ? 'Arrastra o toca donde termina; sigue tocando para doblar (en L o en U). Doble toque, Esc o "Listo" para terminar.' : 'O mantén apretado y arrastra para trazar el primer tramo. Se pega a muros y racks.' }}</p>
          </div>
          <div v-else-if="agregandoCruce" class="absolute inset-x-2 top-2 z-10 flex items-center justify-between gap-3 rounded-xl bg-green-700/95 px-3 py-2 text-sm text-white shadow-lg lg:inset-x-auto lg:left-3" role="status">
            <span>Toca el pasillo donde va el cruce.</span>
            <button type="button" class="font-semibold underline" @click="agregandoCruce = false">Cancelar</button>
          </div>
          </div>
          <!-- Configuraciones en el plano: color y letra de cada modelo, con lo que guarda -->
          <ul v-if="coloresModelos && !enHoy" class="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-neutral-100 px-4 py-2.5 text-xs text-neutral-700">
            <li v-for="m in p.modelos" :key="m.id" class="flex items-center gap-1.5">
              <span class="flex h-4 w-4 items-center justify-center rounded-sm text-[10px] font-bold text-white" :style="{ background: colorModelo(m.id).borde }">{{ letraModelo(m.id) }}</span>
              <b>{{ m.nombre }}</b><span class="text-neutral-500">· {{ resumenModelo(m) }}</span>
            </li>
          </ul>
          <ul class="flex flex-wrap gap-x-4 gap-y-1 border-t border-neutral-100 px-4 py-2.5 text-xs text-neutral-600">
            <!-- Solo lo que hay en el plano -->
            <li v-if="listaPasillos.length" class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm bg-teal-200" />Pasillo para cargar (rojo si es angosto)</li>
            <li v-if="hayElemento('pasilloGrua')" class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm bg-amber-200" />Pasillo de grúa que dibujaste</li>
            <li v-if="hayElemento('pasilloPeatonal')" class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm bg-green-200" />Peatonal</li>
            <li v-if="hayElemento('zona')" class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm bg-red-200" />Zona que no se usa</li>
            <li v-if="p.racks.some((r: any) => r.tunel)" class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm border border-sky-600 bg-sky-100" />Cuerpo túnel</li>
            <li v-if="perdidasPilares" class="flex items-center gap-1.5"><svg viewBox="0 0 16 10" class="h-2.5 w-4" aria-hidden="true"><rect x="0.5" y="0.5" width="15" height="9" fill="#e2e8f0" stroke="#64748b" /><path d="M1 1l14 8M1 9l14-8" stroke="#64748b" /></svg>Posición que se pierde por un pilar</li>
            <li>
              <button type="button" role="switch" :aria-checked="verRecorrido" class="flex items-center gap-1.5 rounded-md px-1 hover:bg-neutral-100" @click="verRecorrido = !verRecorrido">
                <span :class="['flex h-3.5 w-3.5 items-center justify-center rounded-sm border text-[9px] leading-none', verRecorrido ? 'border-brand-600 bg-brand-600 text-white' : 'border-neutral-400 bg-white']" aria-hidden="true">{{ verRecorrido ? '✓' : '' }}</span>
                <svg viewBox="0 0 16 8" class="h-2 w-4" aria-hidden="true"><path d="M1 4h14" stroke="#b45309" stroke-width="2" stroke-dasharray="3 2" /></svg>Recorrido de la grúa
              </button>
            </li>
            <li>
              <button type="button" role="switch" :aria-checked="verAccesorios" class="flex items-center gap-1.5 rounded-md px-1 hover:bg-neutral-100" @click="verAccesorios = !verAccesorios">
                <span :class="['flex h-3.5 w-3.5 items-center justify-center rounded-sm border text-[9px] leading-none', verAccesorios ? 'border-brand-600 bg-brand-600 text-white' : 'border-neutral-400 bg-white']" aria-hidden="true">{{ verAccesorios ? '✓' : '' }}</span>
                <svg viewBox="0 0 12 12" class="h-3 w-3" aria-hidden="true"><path d="M2 3v7h8V3" fill="none" stroke="#c81e1e" stroke-width="2" /></svg>Accesorios
              </button>
            </li>
            <li v-if="existentes.length" class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm border border-dashed border-slate-400 bg-slate-100" />Lo que ya tienes</li>
          </ul>
        </div>
        <div v-if="vista === '3d'" class="h-[44svh] lg:h-[max(440px,calc(100svh-19rem))]">
          <ClientOnly>
            <Visor3D :bodega="p.bodega" :racks="racksPlano" :accesorios="enHoy ? { quitados: ['canilleras', 'proteccionBastidor', 'barandas', 'planosCarga', 'topes', 'mallaAnticaida'] } : p.accesorios" :pallets="p.pallets" etiqueta="Vista 3D de tu bodega" @seleccionar="sel = $event" @mover="mover" />
          </ClientOnly>
        </div>
          </div>
          <!-- Panel de propiedades: fijo al borde derecho del plano (sin scroll) para el rack o elemento elegido -->
          <div v-if="(rackSel && (detalle || rackSel.existente || enHoy || modo !== 'layout')) || elementoActual || muroActual" class="relative flex-shrink-0 lg:w-[300px]">
          <aside class="fl-panel" aria-live="polite" :aria-label="`Propiedades: ${tituloPanel}`">
            <header class="fl-panel__cab">
              <div class="min-w-0">
                <p class="fl-panel__tipo">{{ rackSel ? (enHoy ? 'Rack de hoy' : rackSel.existente ? 'Rack que ya tienes' : 'Rack') : muroActual ? 'Forma de la bodega' : 'Elemento de la bodega' }}</p>
                <p class="fl-panel__titulo">{{ tituloPanel }}</p>
                <p v-if="rackSel" class="mt-0.5 text-sm text-neutral-500">{{ resumenRack(rackSel) }}</p>
              </div>
              <button type="button" class="fl-panel__cerrar" aria-label="Cerrar" @click="sel = null; elementoSel = null; muroSel = null">×</button>
            </header>

            <div class="fl-panel__cuerpo">
              <!-- ─── Rack ─── -->
              <template v-if="rackSel">
                <div v-if="!enHoy" class="grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1" role="group" aria-label="¿Es nuevo o ya lo tienes?">
                  <button v-for="op in [{ v: false, t: 'Nuevo, a cotizar' }, { v: true, t: 'Ya lo tengo' }]" :key="op.t" type="button" :aria-pressed="!!rackSel.existente === op.v" :class="['h-9 rounded-md text-sm font-semibold', !!rackSel.existente === op.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="marcarExistente(rackSel, op.v)">{{ op.t }}</button>
                </div>
                <!-- Simple o doble: lo decide el cliente en cada lineal -->
                <template v-if="!enHoy && !rackSel.existente && rackSel.tipo !== 'DI'">
                  <p class="fl-panel__sec">Este lineal</p>
                  <div class="grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1" role="group" aria-label="Simple o doble">
                    <button v-for="op in [{ v: false, t: 'Simple' }, { v: true, t: 'Doble' }]" :key="op.t" type="button" :aria-pressed="!!rackSel.doble === op.v" :class="['h-9 rounded-md text-sm font-semibold', !!rackSel.doble === op.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="cambiarDoble(rackSel, op.v)">{{ op.t }}</button>
                  </div>
                </template>
                <!-- Configuraciones mixtas: qué modelo (y por lo tanto qué pallets y niveles) guarda este rack -->
                <template v-if="!enHoy && !rackSel.existente">
                  <p class="fl-panel__sec">Configuración</p>
                  <div class="space-y-1.5" role="radiogroup" aria-label="Configuración de este rack">
                    <button
                      v-for="m in p.modelos.filter((x) => x.tipo === rackSel.tipo)" :key="m.id" type="button" role="radio" :aria-checked="rackSel.modelo === m.id"
                      :class="['flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm ring-1', rackSel.modelo === m.id ? 'bg-brand-50/60 ring-2 ring-brand-500' : 'ring-neutral-200 hover:ring-neutral-300']"
                      @click="asignarModelo(rackSel, m.id)"
                    >
                      <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-bold text-white" :style="{ background: colorModelo(m.id).borde }">{{ letraModelo(m.id) }}</span>
                      <span class="min-w-0"><b class="block truncate text-neutral-900">{{ m.nombre }}</b><span class="block truncate text-xs text-neutral-500">{{ resumenModelo(m) }}</span></span>
                    </button>
                  </div>
                  <p class="mt-1.5 text-xs text-neutral-500">¿Otra mezcla de pallets o niveles? <button type="button" class="font-semibold text-brand-700 underline" @click="irAlPaso3">Crea otro modelo en el paso 3</button>.</p>
                  <p class="mt-2 text-sm text-neutral-700">Guarda: {{ contenidoRack(rackSel) }}</p>
                  <p class="fl-panel__sec">Largo</p>
                  <div class="fl-prop"><span>{{ rackSel.tipo === 'DI' ? 'Calles' : rackSel.doble ? 'Cuerpos por lado' : 'Cuerpos' }}</span><FlujoNumero :valor="rackSel.cuerpos" :min="1" :max="maxLargo" etiqueta="cuerpos" @cambio="largoFila(rackSel, $event)" /></div>
                  <div class="mt-1 grid grid-cols-2 gap-1.5">
                    <button type="button" class="fl-chip !min-h-9 !text-sm" @click="alargar(rackSel, -1)">{{ rackSel.rot % 180 ? '⤒ Hasta arriba' : '⇤ Hasta el muro' }}</button>
                    <button type="button" class="fl-chip !min-h-9 !text-sm" @click="alargar(rackSel, 1)">{{ rackSel.rot % 180 ? '⤓ Hasta abajo' : 'Hasta el muro ⇥' }}</button>
                  </div>
                  <button v-if="rackSel.cuerpos >= 2" type="button" class="fl-chip mt-1 !min-h-9 !text-sm" @click="partir(rackSel)">Partir en dos tramos</button>
                  <p class="fl-panel__sec">Filas iguales</p>
                  <div class="fl-prop"><span>Filas (con esta)</span><FlujoNumero :valor="bloque.profundidad" :min="1" :max="maxFilas" etiqueta="filas" @cambio="bloque.profundidad = $event" /></div>
                  <button type="button" class="fl-chip mt-1 !min-h-9 !text-sm" @click="hastaElMuro(rackSel, 'profundidad')">Todas las que caben</button>
                  <label v-if="!rackSel.doble && rackSel.tipo !== 'DI'" class="mt-2 flex items-center gap-2 text-sm text-neutral-700"><input v-model="bloque.espalda" type="checkbox" class="h-4 w-4 accent-brand-600">Filas nuevas espalda con espalda</label>
                  <template v-if="frenteSel?.valor != null">
                    <p class="fl-panel__sec">Pasillo al frente</p>
                    <div class="fl-prop"><span>Libre al frente</span>
                      <span class="inline-flex items-center gap-1">
                        <button type="button" :class="MINI" aria-label="Pasillo 10 cm más angosto" @click="cambiarFrente(-0.1)">−</button>
                        <b :class="['w-12 text-center text-sm tabular-nums', frenteSel.valor + 0.005 < pasilloDe(rackSel) && frenteSel.a === 'rack' ? 'text-red-700' : '']">{{ fm(frenteSel.valor) }} m</b>
                        <button type="button" :class="MINI" aria-label="Pasillo 10 cm más ancho" @click="cambiarFrente(0.1)">+</button>
                      </span>
                    </div>
                    <button type="button" class="fl-chip mt-1 !min-h-9 !text-sm" @click="cambiarFrente(pasilloDe(rackSel) - frenteSel.valor)">Dejar el justo para tu equipo ({{ fm(pasilloDe(rackSel)) }} m)</button>
                  </template>
                </template>
                <!-- Cuerpo túnel de este rack (pisa el del modelo del paso 3) -->
                <template v-if="!enHoy && !rackSel.existente && rackSel.tipo === 'RS'">
                  <p class="fl-panel__sec">Cuerpo túnel</p>
                  <div class="grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1" role="group" aria-label="Cuerpo túnel">
                    <button v-for="op in [{ v: false, t: 'Sin túnel' }, { v: true, t: 'Con túnel' }]" :key="op.t" type="button" :aria-pressed="!!rackSel.tunel === op.v" :class="['h-9 rounded-md text-sm font-semibold', !!rackSel.tunel === op.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="ponerTunel(rackSel, op.v ? { cuerpo: Math.floor((rackSel.cuerpos - 1) / 2), altoLibre: altoTunelGrua(p.bodega.grua) } : null)">{{ op.t }}</button>
                  </div>
                  <template v-if="rackSel.tunel">
                    <div class="fl-prop mt-2"><span>Cuerpo (desde la izquierda)</span><FlujoNumero :valor="((medidasRack(rackSel) as any).tunel?.indice ?? 0) + 1" :min="1" :max="rackSel.cuerpos" etiqueta="cuerpo túnel" @cambio="ponerTunel(rackSel, { ...rackSel.tunel, cuerpo: $event - 1 })" /></div>
                    <p class="mt-2 text-sm text-neutral-700">¿Quién pasa por debajo?</p>
                    <div class="mt-1 grid grid-cols-2 gap-1.5">
                      <button v-for="a in ALTOS_TUNEL" :key="a.v" type="button" :class="['fl-chip !min-h-11 !flex-col !gap-0 !px-1 !text-xs leading-tight', Math.abs(rackSel.tunel.altoLibre - a.v) < 0.01 && 'fl-chip--sel']" :aria-pressed="Math.abs(rackSel.tunel.altoLibre - a.v) < 0.01" @click="ponerTunel(rackSel, { ...rackSel.tunel, altoLibre: a.v })"><b>{{ a.t }}</b><span>paso {{ fm(a.v) }} m</span></button>
                    </div>
                    <p v-if="infoTunel" :class="['mt-2 text-xs', infoTunel.grua ? 'text-neutral-600' : 'text-amber-800']">{{ infoTunel.texto }}</p>
                  </template>
                  <p v-if="rackSel.tunelPropio" class="mt-1.5 text-xs text-neutral-500">Solo este rack. <button type="button" class="font-semibold text-brand-700 underline" @click="tunelDelModelo(rackSel)">Usar el del paso 3</button></p>
                  <p v-else-if="rackSel.tunel" class="mt-1.5 text-xs text-neutral-500">Viene de la configuración del paso 3.</p>
                </template>
                <p class="fl-panel__sec">Medidas</p>
                <dl class="fl-panel__datos">
                  <div><dt>Largo</dt><dd>{{ fm(medidasPlanta(rackSel).largo) }} m</dd></div>
                  <div><dt>Fondo</dt><dd>{{ fm(medidasPlanta(rackSel).fondo) }} m</dd></div>
                  <div><dt>Alto</dt><dd>{{ fm(medidasRack(rackSel).alto) }} m</dd></div>
                </dl>
                <p class="fl-panel__sec">Ubicación</p>
                <label class="fl-prop"><span>Desde el muro izquierdo</span><span class="fl-prop__in"><input :value="bordeRack.x" type="number" min="0" step="0.1" @change="moverRackA('x', $event)"><i>m</i></span></label>
                <label class="fl-prop"><span>Desde el muro de arriba</span><span class="fl-prop__in"><input :value="bordeRack.y" type="number" min="0" step="0.1" @change="moverRackA('y', $event)"><i>m</i></span></label>
              </template>

              <!-- ─── Muro (forma de la bodega) ─── -->
              <template v-else-if="muroActual">
                <p class="fl-panel__sec">Medida</p>
                <label class="fl-prop"><span>Largo del muro</span><span class="fl-prop__in"><input :value="fm2(muroActual.largo)" type="number" min="1" step="0.5" @change="largoMuro(($event.target as HTMLInputElement).value)"><i>m</i></span></label>
                <p class="mt-1 text-xs text-neutral-500">El muro siguiente se corre para mantener la forma.</p>
                <p class="fl-panel__sec">Esquinas</p>
                <div class="grid grid-cols-2 gap-1.5">
                  <button type="button" class="fl-chip !min-h-10 !text-sm" @click="agregarEsquina">+ Esquina al medio</button>
                  <button type="button" class="fl-chip !min-h-10 !text-sm" :disabled="contornoActual.length <= 3" @click="quitarEsquina">Quitar esquina</button>
                </div>
                <p class="mt-2 text-xs text-neutral-500">La esquina nueva aparece al medio de este muro: arrástrala para dar la forma.</p>
              </template>

              <!-- ─── Elemento ─── -->
              <template v-else-if="elementoActual">
                <template v-if="elementoActual.clase === 'pasilloGrua' || elementoActual.clase === 'pasilloPeatonal'">
                  <p class="fl-panel__sec">Ancho del pasillo</p>
                  <div class="grid grid-cols-3 gap-1.5">
                    <button v-for="a in (elementoActual.clase === 'pasilloGrua' ? anchosGrua : [1.2, 1.5, 2])" :key="a" type="button" :class="['fl-chip !min-h-9 !text-sm', Math.abs(anchoPasillo - a) < 0.01 && 'fl-chip--sel']" @click="anchoDePasillo(a)">{{ fm(a) }} m</button>
                  </div>
                  <p v-if="elementoActual.clase === 'pasilloGrua' && anchoPasillo < grua.pasillo - 0.01" class="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">Tu {{ grua.nombre.toLowerCase() }} necesita ~{{ fm(grua.pasillo) }} m.<FlujoReferencial :de="grua" /></p>
                  <p v-if="elementoActual.clase === 'pasilloPeatonal' && anchoPasillo < 1.2 - 0.01" class="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Lo sugerido es 1,2 m; puedes dejarlo más angosto.</p>
                  <div v-if="elementoActual.clase === 'pasilloPeatonal'" class="mt-2 grid grid-cols-2 gap-1.5">
                    <button type="button" :class="['fl-chip !min-h-9 !text-sm', agregandoCruce && 'fl-chip--sel']" @click="agregandoCruce = !agregandoCruce">{{ agregandoCruce ? 'Toca el pasillo…' : '+ Cruce' }}</button>
                    <button type="button" class="fl-chip !min-h-9 !text-sm" :disabled="!elementoActual.aberturas?.length" @click="cambiarElemento({ aberturas: [] })">Quitar cruces ({{ elementoActual.aberturas?.length ?? 0 }})</button>
                  </div>
                </template>
                <!-- Pasillos en serie: cantidad y separación de eje a eje, con vista previa y ajuste a las filas -->
                <template v-if="elementoActual.clase === 'pasilloGrua' || elementoActual.clase === 'pasilloPeatonal'">
                  <p class="fl-panel__sec">Repetir este pasillo</p>
                  <div class="fl-prop"><span>Cantidad (con este)</span><FlujoNumero :valor="serie.cantidad" :min="1" :max="10" etiqueta="pasillos" @cambio="serie.cantidad = $event" /></div>
                  <label class="fl-prop"><span>Separación de eje a eje</span><span class="fl-prop__in"><input :value="serie.separacion" type="number" min="1" step="0.5" @change="serie.separacion = Math.max(1, Number(($event.target as HTMLInputElement).value) || 1)"><i>m</i></span></label>
                  <button v-if="pasoFilas" type="button" class="mt-1 text-sm font-semibold text-brand-700 underline underline-offset-2" @click="serie.separacion = pasoFilas">Alinear con tus filas de racks ({{ fm(pasoFilas) }} m)</button>
                  <p v-if="previaPas.length" class="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700" role="status">
                    <b class="text-neutral-900">{{ previaPas.filter((c) => c.ok).length }} {{ previaPas.filter((c) => c.ok).length === 1 ? 'cabe' : 'caben' }}</b>
                    <template v-if="previaPas.some((c) => !c.ok)"> · <span class="text-red-700">{{ previaPas.filter((c) => !c.ok).length }} no: {{ textoMotivos(previaPas) }}</span></template>
                    <span class="block text-xs text-neutral-500">Tus racks quedan donde están; si alguno choca con un pasillo nuevo se marca en rojo.</span>
                  </p>
                  <button type="button" class="fl-btn mt-2 w-full !min-h-10 !text-sm" :disabled="!previaPas.some((c) => c.ok)" @click="agregarSerie">{{ previaPas.some((c) => c.ok) ? `Agregar ${previaPas.filter((c) => c.ok).length} ${previaPas.filter((c) => c.ok).length === 1 ? 'pasillo' : 'pasillos'}` : serie.cantidad < 2 ? 'Elige cuántos' : 'Ninguno cabe' }}</button>
                </template>
                <!-- Portón o andén: muro, distancia a la esquina, medidas y zona de maniobra -->
                <template v-if="elementoActual.clase === 'porton' || elementoActual.clase === 'anden'">
                  <!-- Portón: cómo abre y hacia dónde (el plano lo dibuja; batiente y corredera por dentro bloquean su hoja) -->
                  <template v-if="elementoActual.clase === 'porton'">
                    <p class="fl-panel__sec">Cómo abre</p>
                    <div class="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Cómo abre el portón">
                      <button v-for="a in ABRE_PORTON" :key="a.v" type="button" role="radio" :aria-checked="(elementoActual.abre ?? 'cortina') === a.v" :class="['fl-chip !min-h-14 !flex-col !gap-0.5 !px-1 !text-xs', (elementoActual.abre ?? 'cortina') === a.v && 'fl-chip--sel']" @click="cambiarElemento({ abre: a.v })">
                        <svg viewBox="0 0 28 16" class="h-4 w-7" aria-hidden="true"><path :d="a.d" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /><path d="M1 14h5M22 14h5" stroke="#374151" stroke-width="2.4" /></svg>
                        {{ a.t }}
                      </button>
                    </div>
                    <div v-if="(elementoActual.abre ?? 'cortina') !== 'cortina'" class="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1" role="radiogroup" aria-label="Hacia dónde abre">
                      <button v-for="h in [{ v: 'adentro', t: 'Hacia adentro' }, { v: 'afuera', t: 'Hacia afuera' }]" :key="h.v" type="button" role="radio" :aria-checked="(elementoActual.hacia ?? 'adentro') === h.v" :class="['h-9 rounded-md text-sm font-semibold', (elementoActual.hacia ?? 'adentro') === h.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="cambiarElemento({ hacia: h.v })">{{ h.t }}</button>
                    </div>
                    <p class="mt-1 text-xs text-neutral-500">{{ textoAbre(elementoActual) }}</p>
                  </template>
                  <p class="fl-panel__sec">Muro</p>
                  <div class="grid grid-cols-4 gap-1">
                    <button v-for="mu in MUROS" :key="mu.v" type="button" :class="['fl-chip !min-h-9 !px-1 !text-xs', muroDe(p.bodega, elementoActual).muro === mu.v && 'fl-chip--sel']" @click="ponerEnMuro(elementoActual, { muro: mu.v })">{{ mu.t }}</button>
                  </div>
                  <p class="fl-panel__sec">Medidas</p>
                  <label class="fl-prop"><span>Desde la esquina</span><span class="fl-prop__in"><input :value="muroDe(p.bodega, elementoActual).dist" type="number" min="0" step="0.1" @change="ponerEnMuro(elementoActual, { dist: Math.max(0, Number(($event.target as HTMLInputElement).value) || 0) })"><i>m</i></span></label>
                  <label class="fl-prop"><span>Ancho</span><span class="fl-prop__in"><input :value="muroDe(p.bodega, elementoActual).ancho" type="number" min="1" step="0.1" @change="ponerEnMuro(elementoActual, { ancho: num($event) })"><i>m</i></span></label>
                  <label v-if="elementoActual.clase === 'porton'" class="fl-prop"><span>Alto</span><span class="fl-prop__in"><input :value="elementoActual.altoPorton ?? 4" type="number" min="2" max="10" step="0.1" @change="cambiarElemento({ altoPorton: num($event) })"><i>m</i></span></label>
                  <template v-else>
                    <label class="fl-prop"><span>Rampa niveladora (hacia adentro)</span><span class="fl-prop__in"><input :value="muroDe(p.bodega, elementoActual).fondo" type="number" min="0.3" step="0.1" @change="ponerEnMuro(elementoActual, { fondo: num($event) })"><i>m</i></span></label>
                    <label class="fl-prop"><span>Alto del andén</span><span class="fl-prop__in"><input :value="elementoActual.altoAnden ?? 1.2" type="number" min="0.5" max="2" step="0.05" @change="cambiarElemento({ altoAnden: num($event) })"><i>m</i></span></label>
                  </template>
                  <label class="fl-prop"><span>Libre delante para maniobrar</span><span class="fl-prop__in"><input :value="maniobraDe(p.bodega, elementoActual)" type="number" min="0" max="20" step="0.1" @change="cambiarElemento({ maniobra: Math.max(0, Number(($event.target as HTMLInputElement).value) || 0) })"><i>m</i></span></label>
                  <p class="mt-1 text-xs text-neutral-500">
                    Tu {{ grua.nombre.toLowerCase() }} necesita {{ fm(maniobraDe(p.bodega, {})) }} m para entrar y girar.
                    <button v-if="elementoActual.maniobra != null && Math.abs(maniobraDe(p.bodega, elementoActual) - maniobraDe(p.bodega, {})) > 0.01" type="button" class="font-semibold text-brand-700 underline" @click="cambiarElemento({ maniobra: null })">Usar {{ fm(maniobraDe(p.bodega, {})) }} m</button>
                  </p>
                  <div v-if="elementoActual.clase === 'anden'" class="fl-prop"><span>Andenes en serie</span><FlujoNumero :valor="p.bodega.elementos.filter((e: any) => e.clase === 'anden').length" :min="1" :max="12" etiqueta="andenes" @cambio="andenesEnSerie(elementoActual, $event)" /></div>
                </template>
                <!-- Pilar: se mueve con su grilla o solo; tamaño por tipo (el cliente no sabe los cm) -->
                <template v-if="elementoActual.clase === 'pilar'">
                  <template v-if="elementoActual.grupo && p.bodega.elementos.filter((e: any) => e.grupo === elementoActual.grupo).length > 1">
                    <p class="fl-panel__sec">Al arrastrar</p>
                    <div class="grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1" role="radiogroup" aria-label="Qué pilares se mueven">
                      <button v-for="o in [{ v: 'todos', t: 'Todos juntos' }, { v: 'uno', t: 'Solo este' }]" :key="o.v" type="button" role="radio" :aria-checked="moverPilares === o.v" :class="['h-9 rounded-md text-sm font-semibold', moverPilares === o.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="moverPilares = o.v as any">{{ o.t }}</button>
                    </div>
                  </template>
                  <p class="fl-panel__sec">Tamaño</p>
                  <div class="grid grid-cols-2 gap-1">
                    <button v-for="t in TAMANOS_PILAR" :key="t.v" type="button" :class="['fl-chip !min-h-9 !px-1 !text-xs', (elementoActual.tamano ?? (elementoActual.forma === 'H' ? 'H' : elementoActual.ancho <= 0.3 ? 'h30' : 'h40')) === t.v && 'fl-chip--sel']" @click="tamanoPilar(elementoActual, t.v)">{{ t.t }}</button>
                  </div>
                  <p class="fl-panel__sec">{{ moverPilares === 'todos' && elementoActual.grupo ? 'Ubicación de la grilla' : 'Ubicación' }}</p>
                  <label class="fl-prop"><span>Desde el muro izquierdo</span><span class="fl-prop__in"><input :value="borde.x" type="number" min="0" step="0.1" @change="moverElementoA('x', $event)"><i>m</i></span></label>
                  <label class="fl-prop"><span>Desde el muro de arriba</span><span class="fl-prop__in"><input :value="borde.y" type="number" min="0" step="0.1" @change="moverElementoA('y', $event)"><i>m</i></span></label>
                  <button type="button" class="mt-2 text-sm text-red-700 underline underline-offset-2" @click="quitarPilares">Quitar todos los pilares</button>
                </template>
                <template v-if="elementoActual.clase !== 'porton' && elementoActual.clase !== 'anden' && elementoActual.clase !== 'pilar'">
                  <p class="fl-panel__sec">Medidas y ubicación</p>
                  <label class="fl-prop"><span>{{ largoEnX ? 'Largo' : 'Ancho' }} en X</span><span class="fl-prop__in"><input :value="elementoActual.ancho" type="number" min="0.2" step="0.1" @change="cambiarElemento({ ancho: num($event) })"><i>m</i></span></label>
                  <label class="fl-prop"><span>{{ largoEnX ? 'Ancho' : 'Largo' }} en Y</span><span class="fl-prop__in"><input :value="elementoActual.alto" type="number" min="0.2" step="0.1" @change="cambiarElemento({ alto: num($event) })"><i>m</i></span></label>
                  <label class="fl-prop"><span>Desde el muro izquierdo</span><span class="fl-prop__in"><input :value="borde.x" type="number" min="0" step="0.1" @change="moverElementoA('x', $event)"><i>m</i></span></label>
                  <label class="fl-prop"><span>Desde el muro de arriba</span><span class="fl-prop__in"><input :value="borde.y" type="number" min="0" step="0.1" @change="moverElementoA('y', $event)"><i>m</i></span></label>
                </template>
                <p class="mt-3 text-xs text-neutral-500">{{ elementoActual.clase === 'pasilloPeatonal' ? 'Arrastra las manillas verdes (largo) y la azul (ancho), o muévelo en el plano.' : 'También puedes arrastrarlo en el plano.' }}</p>
              </template>
            </div>

            <footer class="fl-panel__pie">
              <template v-if="rackSel">
                <button v-if="!rackSel.doble && !enHoy && !rackSel.existente" type="button" class="fl-panel__accion" title="Cambiar el lado por donde se carga" @click="voltear(rackSel)">Voltear</button>
                <button v-else type="button" class="fl-panel__accion" @click="girar(rackSel.id)">Girar</button>
                <button type="button" class="fl-panel__accion" @click="duplicar(rackSel)">Duplicar</button>
                <button type="button" class="fl-panel__accion !text-red-700" @click="eliminar(rackSel.id)">Quitar</button>
              </template>
              <template v-else-if="muroActual">
                <button type="button" class="fl-panel__accion col-span-3" @click="ponerForma('rect')">Volver a rectángulo</button>
              </template>
              <template v-else-if="elementoActual">
                <button type="button" class="fl-panel__accion" @click="girarElemento(elementoActual.id)">Girar</button>
                <button type="button" class="fl-panel__accion" @click="duplicarElemento(elementoActual)">Duplicar</button>
                <button type="button" class="fl-panel__accion !text-red-700" @click="quitarElemento(elementoActual.id)">Quitar</button>
              </template>
            </footer>
          </aside>
          </div>
        </div>
        <!-- Racks en rojo: el aviso con sus botones flota sobre el plano (no se repite aquí). Pasillo angosto: con
             el número, cuánto pide la grúa y cuánto queda (dueño 27-10) -->
        <p v-if="!malos.size && angosto" class="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-900" role="status">
          <template v-if="angosto.ar">Ese pasillo necesita {{ fm(angosto.minimo) }} m y aquí quedan {{ fm(angosto.libre) }} m (en rojo).</template>
          <template v-else-if="angosto.causa">Tu grúa necesita un pasillo mínimo de <b>{{ fm(angosto.minimo) }} m</b> y por {{ angosto.causa === 'pilar' ? 'un pilar' : `la ${angosto.causa}` }} quedan <b>{{ fm(angosto.libre) }} m</b> (en rojo). Corre la fila para que {{ angosto.causa === 'pilar' ? 'el pilar quede dentro del rack' : 'quede fuera del pasillo' }}.</template>
          <template v-else>Tu grúa necesita un pasillo mínimo de <b>{{ fm(angosto.minimo) }} m</b> y aquí quedan <b>{{ fm(angosto.libre) }} m</b> (en rojo). Separa las filas o acorta una.</template>
        </p>
        <!-- Al pie del plano: la ingeniería como garantía (prompt de conversión §E) -->
        <p class="border-t border-neutral-100 bg-white px-4 py-2 text-xs text-neutral-500">{{ TEXTO_INGENIERIA }}</p>
      </div>
    </div>

    <FlujoAcciones v-if="modo === 'dibujo'" texto="Continuar con esta bodega" @atras="emit('atras')" @siguiente="emit('siguiente')" />
    <FlujoAcciones v-else :deshabilitado="!p.racks.length" motivo="Agrega al menos un lineal." texto="Seguir con accesorios" @atras="emit('atras')" @siguiente="emit('siguiente')" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, watch, watchEffect, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import { useProyecto } from '~/stores/proyecto';
import {
  ELEMENTOS, conflictos, contorno, caja, normalizar, dentroDeBodega, grillaPilaresXY, lugarLibre, formatoM, NOMBRE,
  rectangulo, rectElemento, medidasRack, area as areaPoligono,
} from '~/lib/rack3d/planificador.js';
import { GRUAS, DISTANCIAS, ACCESOS } from '~/lib/rack3d/parametrosTecnicos.js';
import { pasillos, pasilloRequerido } from '~/lib/rack3d/pasillos.js';
import { huella } from '~/lib/rack3d/medidas.js';
import { bodegaParaPallets, conCuerpos, conDoble, partirRack, ubicarFaltantes, resultadoModelo, rackDeModelo, conteoRack, ubicarModelos, repetirBloque, previaBloque, previaPasillos, textoMotivos, cobertura, conteoTotal, conManiobras, maniobraDe, enMuro, muroDe, conPilares, linealArrastrado, maxBloque, alargarHastaMuro } from '~/lib/flujo/calculos.js';
import { imanRack, ordenarPasillos, pasillosSinSalida, abrirConexion, distanciaFrente } from '~/lib/flujo/alinear.js';
import { proponerAccesorios, aplicarAjustes } from '~/lib/rack3d/accesorios.js';
import { ALTURAS_TIPICAS, ESTIMADO, PIERDE, PORQUE, TEXTO_INGENIERIA, TOLERANCIA_MEDIDAS } from '~/lib/flujo/conversion.js';
import { areaOcupada } from '~/lib/flujo/perfiles.js';
import { recorridosGrua, sugerirTuneles, tunelesAlineados, ALTOS_TUNEL, altoTunelGrua, tunelParaGrua, dimensiones, radioGiro } from '~/lib/rack3d/rutas.js';

const emit = defineEmits<{ siguiente: []; atras: [] }>();
// Barra del plano: botones chicos, iguales y claros
const BTN = 'inline-flex h-9 items-center gap-1 rounded-lg bg-white px-2.5 text-sm font-semibold text-neutral-800 ring-1 ring-neutral-300 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40';
const GRUPO = 'inline-flex h-9 items-center gap-0.5 rounded-lg bg-white px-0.5 ring-1 ring-neutral-300';
const MINI = 'h-7 min-w-7 rounded-md px-1 text-base font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-30';
const MENU_RACK = 'inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-100';
const MENU = 'absolute left-0 top-full z-30 mt-1 w-64 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/10';
const ITEM = 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-100';
// 'dibujo' (paso 2): medidas, forma, altura, pilares y portones. 'layout' (paso 5): el cliente ubica sus lineales
const props = withDefaults(defineProps<{ modo?: 'dibujo' | 'layout' }>(), { modo: 'layout' });
const modo = computed(() => props.modo);
function cambiarAltura(e: Event) {
  const v = Number((e.target as HTMLInputElement).value);
  p.bodega.altura = v >= 2.5 ? Math.min(40, v) : null;
  p.flags = p.flags.filter((f) => f !== 'no_se:altura');
}
function alturaNoSe() {
  if (!p.flags.includes('no_se:altura')) p.bodega.altura = 8;
  p.flags = [...new Set([...p.flags, 'no_se:altura'])];
}
// Medidas aproximadas (±1 m): se dibuja igual; el ejecutivo las confirma
function medidasAprox(v: boolean) {
  p.flags = v ? [...new Set([...p.flags, 'no_se:medidas'])] : p.flags.filter((f) => f !== 'no_se:medidas');
}
const p = useProyecto();
const fm = formatoM;
const n = (v: number) => Math.round(v).toLocaleString('es-CL');
const num = (e: Event) => Math.max(0.2, Number((e.target as HTMLInputElement).value) || 0.2);
const nuevoId = () => Math.random().toString(36).slice(2, 9);
// Medidas estimadas desde los pallets (el cliente no sabe el área): se marcan como estimadas
const sinMedidas = reactive({ abierto: false, pallets: null as number | null });
const medidasEstimadas = computed(() => (sinMedidas.pallets && sinMedidas.pallets > 0
  ? bodegaParaPallets(sinMedidas.pallets, { altura: p.bodega.altura, grua: p.bodega.grua, ocupacion: p.bodega.ocupacion, pallet: p.pallets[0] ?? null })
  : null));
function usarMedidasEstimadas() {
  const e = medidasEstimadas.value;
  if (!e) return;
  p.bodega.ancho = e.ancho; p.bodega.largo = e.largo;
  medidasAprox(true);
  marcar('medidas_estimadas', { pallets: sinMedidas.pallets, m2: e.m2 });
}
// Medidas escritas o dibujadas por el cliente: dejan de ser las de ejemplo (precisión de la cotización)
watch(() => [p.bodega.ancho, p.bodega.largo, JSON.stringify(p.bodega.forma)], () => {
  if (!p.flags.includes('medidas_ok')) p.flags = [...p.flags, 'medidas_ok'];
});

const vista = ref<'2d' | '3d'>('2d');
const sel = ref<string | null>(null);
const elementoSel = ref<string | null>(null);
// ─── Antes / después: el layout de hoy (p.racksHoy) se dibuja aparte y se compara con la propuesta ───
const escenario = ref<'propuesta' | 'hoy'>('propuesta');
const enHoy = computed(() => escenario.value === 'hoy');
const racksPlano = computed<any[]>({
  get: () => (enHoy.value ? p.racksHoy : p.racks),
  set: (v) => { if (enHoy.value) p.racksHoy = v; else p.racks = v; },
});
// Pilares dentro de los racks (conPilares): se anotan en pages/planifica-tu-bodega/disena.vue, siempre montada
// Muro elegido en el plano (forma de la bodega): el panel derecho deja cambiar su largo y sus esquinas
const muroSel = ref<number | null>(null);
// Pilares (dueño 27-10): una grilla cada X × Y m que se arrastra entera hasta calzar; tamaño por tipo, no en cm
const gp = reactive({ pasoX: 6, pasoY: 6, tamano: 'h40' });
const TAMANOS_PILAR = [
  { v: 'h30', t: 'Hormigón 30 × 30', s: 0.3, forma: 'cuadrado' },
  { v: 'h40', t: 'Hormigón 40 × 40', s: 0.4, forma: 'cuadrado' },
  { v: 'H', t: 'Perfil metálico H', s: 0.3, forma: 'H' },
  { v: 'nose', t: 'No lo sé', s: 0.4, forma: 'cuadrado' },
] as const;
const formPilares = ref(false);
// Mover la grilla entera (por defecto) o solo el pilar elegido
const moverPilares = ref<'todos' | 'uno'>('todos');
watch(() => p.bodega.elementos.find((e: any) => e.id === elementoSel.value)?.grupo, () => { moverPilares.value = 'todos'; });
// Trazado de un pasillo peatonal por tramos (arrastrar o tocar donde empieza y termina) y cruces con un clic
type Pto = { x: number; y: number };
const trazado = ref<{ grupo: string; puntos: Pto[]; ids: string[]; ancho: number } | null>(null);
const agregandoCruce = ref(false);
// Cómo abre un portón (dueño 27-10): el ícono es el portón visto desde arriba, en su muro
const ABRE_PORTON = [
  { v: 'cortina', t: 'Sube', d: 'M6 14h16' },
  { v: 'batiente', t: 'Batiente', d: 'M6 14V4M6 4a10 10 0 0 1 10 10M22 14V4M22 4a10 10 0 0 0 -6 10' },
  { v: 'corredera', t: 'Corredera', d: 'M14 11h13M23 8l4 3-4 3' },
] as const;
function textoAbre(e: any) {
  const abre = e.abre ?? 'cortina', adentro = (e.hacia ?? 'adentro') === 'adentro';
  if (abre === 'cortina') return 'Cortina o seccional: sube y no ocupa piso.';
  if (abre === 'batiente') return adentro ? 'Las hojas barren hacia la bodega: ese espacio queda libre.' : 'Abre hacia el patio: no ocupa piso adentro.';
  return adentro ? 'La hoja corre por dentro, junto al muro: ahí no va rack.' : 'La hoja corre por fuera: no ocupa piso adentro.';
}
const MUROS = [{ v: 'abajo', t: 'Abajo' }, { v: 'arriba', t: 'Arriba' }, { v: 'izquierda', t: 'Izquierda' }, { v: 'derecha', t: 'Derecha' }];
const bloque = reactive({ largo: 1, profundidad: 1, espalda: false, pasillo: DISTANCIAS.pasilloAR.valor, sentido: 0 });
// Ángulo ranurado: pasillo de circulación de 0,8 a 1,5 m (dueño 26-10), de a 10 cm
const PASILLOS_AR = Array.from({ length: Math.round((DISTANCIAS.pasilloAR.max - DISTANCIAS.pasilloAR.min) * 10) + 1 }, (_, i) => +(DISTANCIAS.pasilloAR.min + i / 10).toFixed(1));
const avisoMuro = ref('');
// Pasillos en serie (panel del pasillo elegido)
const serie = reactive({ cantidad: 1, separacion: 6 });
const PESTANAS_DIBUJO = [{ k: 'medidas', t: 'Medidas' }, { k: 'pilares', t: 'Pilares' }, { k: 'accesos', t: 'Portones y andenes' }] as const;
const PESTANAS_LAYOUT = [{ k: 'tengo', t: 'Lo que ya tengo' }, { k: 'hoy', t: 'Hoy vs propuesta' }] as const;
const PESTANAS = computed(() => (modo.value === 'dibujo' ? PESTANAS_DIBUJO : PESTANAS_LAYOUT));
// En el dibujo parte en Medidas; en el layout las pestañas de lo que ya tiene van cerradas hasta que las toque
const pestana = ref<string>(props.modo === 'dibujo' ? 'medidas' : '');
// Encuadre a lo diseñado: los racks con su pasillo (y los accesos). Se calcula al ubicar, no en cada arrastre
// El plano parte mostrando toda la bodega; el zoom queda donde el cliente lo deja ("Ajustar a la bodega" lo vuelve)
const plano = ref<{ restablecerVista(): void; acercar(factor: number): void; aPlanoCliente(x: number, y: number): Pto | null; cajaRack: { x: number; y: number; w: number; h: number; W: number; H: number } | null; moviendo: boolean } | null>(null);
watch(sel, (v) => { if (v) muroSel.value = null; });
watch(elementoSel, (v) => { if (v) muroSel.value = null; });
// Capa de accesorios del plano (canilleras, protecciones, barandas): se puede ocultar
const verAccesorios = ref(true);
// m² libres para crecer: la bodega menos lo que ocupan los racks con sus pasillos (solo si es harto)
const libre = computed(() => {
  const area = Math.abs(areaPoligono(contorno(p.bodega)));
  const l = Math.round((area - areaOcupada(p.racks, p.bodega)) / 10) * 10;
  return p.racks.length && l >= 20 && l > 0.15 * area ? l : 0;
});
const avisoBloque = ref('');
// Métricas lado a lado: posiciones, m² que ocupan los racks con sus pasillos y % de mejora
const comparacion = computed(() => {
  const ch = conteoTotal(p.racksHoy), cp = conteoTotal(p.racks);
  const hoy = { posiciones: ch.posiciones + ch.cajas, m2: areaOcupada(p.racksHoy, p.bodega) };
  const prop = { posiciones: cp.posiciones + cp.cajas, m2: areaOcupada(p.racks, p.bodega) };
  const dens = (x: { posiciones: number; m2: number }) => (x.m2 > 0 ? (x.posiciones / x.m2) * 100 : 0);
  return {
    hoy, prop,
    densHoy: dens(hoy), densProp: dens(prop),
    mejora: hoy.posiciones ? Math.round(((prop.posiciones - hoy.posiciones) / hoy.posiciones) * 100) : null,
    mejoraDens: dens(hoy) ? Math.round(((dens(prop) - dens(hoy)) / dens(hoy)) * 100) : null,
  };
});
// Lo que tiene hoy alimenta el "hoy vs Racklog" de gerencia (perfiles.js)
watch(() => comparacion.value.hoy.posiciones, (v) => { if (p.racksHoy.length) p.posicionesHoy = v; });
// Rack de hoy: mismas medidas de pallet que el paso 2; va al primer lugar libre y se arrastra a donde está
function agregarHoy() {
  const e = nuevoExistente.value!, t = p.pallets[0];
  const base = normalizar({
    id: nuevoId(), tipo: e.tipo, cuerpos: e.cuerpos, niveles: e.tipo === 'AR' ? Math.max(2, e.niveles) : e.niveles, doble: e.doble, rot: 0, x: 0, y: 0,
    ...(t ? { palletFrente: t.frente, palletFondo: t.fondo, palletAlto: t.alto, kgPallet: t.peso } : {}),
    ...(e.tipo === 'DI' ? { fondos: 5, grua: p.bodega.grua } : {}),
  });
  const r = lugarLibre(base, p.racksHoy, p.bodega);
  p.racksHoy = [...p.racksHoy, r];
  escenario.value = 'hoy';
  sel.value = r.id; elementoSel.value = null;
  nuevoExistente.value = null;
  marcar('rack_add', { tipo: 'hoy', sistema: e.tipo });
}

const grua = computed(() => (GRUAS as any)[p.bodega.grua] ?? GRUAS.contrapeso);
// Misma cuenta que el paso 3 y la cotizacion (lib/flujo/calculos.js): cuerpo = vano de un lado
const resultados = computed(() => Object.fromEntries(p.modelos.map((m) => [m.id, resultadoModelo(m, { pallets: p.pallets, cajas: p.cajas, grua: p.bodega.grua, ocupacion: p.bodega.ocupacion })])));
const necesarios = computed(() => Object.fromEntries(p.modelos.map((m) => [m.id, resultados.value[m.id].cuerpos])));
const ubicados = (id: string) => conteoTotal(p.racks.filter((r) => r.modelo === id && !r.existente)).cuerpos;
const posicionesDe = (id: string) => { const c = conteoTotal(p.racks.filter((r) => r.modelo === id && !r.existente)); return c.posiciones || c.cajas; };
// ─── "Ya lo tengo": racks que el cliente ya tiene (no se cotizan) ───
const existentes = computed(() => p.racks.filter((r) => r.existente));
const hoy = computed(() => conteoTotal(existentes.value));
const racksNuevos = computed(() => p.racks.length - existentes.value.length);
const nuevoExistente = ref<{ tipo: 'RS' | 'DI' | 'AR'; cuerpos: number; niveles: number; doble: boolean } | null>(null);
function agregarExistente() {
  const e = nuevoExistente.value!, t = p.pallets[0];
  const base = normalizar({
    // Simple: de espalda al muro de arriba, mirando al pasillo (como lo ubica el layout)
    id: nuevoId(), tipo: e.tipo, cuerpos: e.cuerpos, niveles: e.tipo === 'AR' ? Math.max(2, e.niveles) : e.niveles, doble: e.doble, rot: e.doble || e.tipo === 'DI' ? 0 : 180, x: 0, y: 0, existente: true,
    ...(t ? { palletFrente: t.frente, palletFondo: t.fondo, palletAlto: t.alto, kgPallet: t.peso } : {}),
    ...(e.tipo === 'DI' ? { fondos: 5, grua: p.bodega.grua } : {}),
  });
  const r = lugarLibre(base, p.racks, p.bodega);
  p.racks = [...p.racks, { ...r, existente: true, modelo: undefined }];
  sel.value = r.id; elementoSel.value = null;
  nuevoExistente.value = null;
  marcar('rack_add', { tipo: 'existente', sistema: e.tipo });
}
function marcarExistente(r: any, v: boolean) {
  p.racks = p.racks.map((x) => (x.id === r.id ? { ...x, existente: v } : x));
}
const malos = computed(() => conflictos(racksPlano.value, p.bodega) as Set<string>);
const listaPasillos = computed(() => pasillos(racksPlano.value, p.bodega) as any[]);
// El pasillo más angosto de los que no alcanzan (para decir el número)
const angosto = computed(() => {
  const malo = listaPasillos.value.filter((x: any) => !x.ok).sort((a: any, b: any) => a.libre - a.minimo - (b.libre - b.minimo))[0];
  return malo ? { minimo: malo.minimo, libre: malo.libre, causa: malo.angosta ? (ELEMENTOS as any)[malo.angosta.clase]?.nombre.toLowerCase() : '', ar: malo.racks.some((id: string) => p.racks.find((r: any) => r.id === id)?.tipo === 'AR') } : null;
});
const total = computed(() => { const c = conteoTotal(p.racks.filter((r) => !r.existente)); return { pallets: c.posiciones, bandejas: c.cajas }; });
const rackSel = computed(() => racksPlano.value.find((r) => r.id === sel.value) ?? null);
const elementoActual = computed(() => p.bodega.elementos.find((e: any) => e.id === elementoSel.value) ?? null);
const nPilares = computed(() => p.bodega.elementos.filter((e: any) => e.clase === 'pilar').length);
const hayPilares = computed(() => nPilares.value > 0);
const marcas = computed(() => {
  const lista = aplicarAjustes(proponerAccesorios({ bodega: p.bodega, racks: p.racks, pallets: p.pallets }), p.accesorios) as any[];
  return lista.filter((a) => a.incluido).flatMap((a) => a.marcas ?? []);
});
// ─── Recorrido de la grúa (portón o andén → pasillos de carga) y dónde conviene un túnel ───
// Se calcula un rato después del último cambio (no en cada cuadro de un arrastre)
const verRecorrido = ref(false);
const recorridos = shallowRef<any>(null);
const sugerencias = shallowRef<any[]>([]);
const firmaRutas = computed(() => (verRecorrido.value && !enHoy.value
  ? JSON.stringify([p.bodega.ancho, p.bodega.largo, p.bodega.forma, p.bodega.grua,
    p.bodega.elementos.filter((e: any) => e.clase !== 'grua').map((e: any) => [e.clase, e.x, e.y, e.ancho, e.alto, e.aberturas]),
    p.racks.map((r) => [r.id, r.tipo, r.x, r.y, r.rot, r.cuerpos, r.doble, r.tunel, r.existente])])
  : ''));
let rutasTimer: ReturnType<typeof setTimeout> | null = null;
watch(firmaRutas, (f) => {
  if (rutasTimer) clearTimeout(rutasTimer);
  if (!f) { recorridos.value = null; sugerencias.value = []; return; }
  rutasTimer = setTimeout(() => {
    if (!p.racks.length) { recorridos.value = null; sugerencias.value = []; return; }
    recorridos.value = recorridosGrua(p.bodega, p.racks);
    // Las sugerencias prueban varios túneles: van aparte para no trabar el plano
    rutasTimer = setTimeout(() => { sugerencias.value = sugerirTuneles(p.bodega, p.racks); }, 60);
  }, 450);
}, { immediate: true });
onBeforeUnmount(() => { if (rutasTimer) clearTimeout(rutasTimer); });
const rutasSinLlegar = computed(() => (recorridos.value?.rutas ?? []).filter((x: any) => !x.llega).length);
const textoSugerencia = (t: { ahorro: number; nuevos: number }) => (t.nuevos
  ? `la grúa llega a ${t.nuevos} ${t.nuevos === 1 ? 'pasillo' : 'pasillos'} que hoy no alcanza${t.ahorro ? ` y ahorras ${t.ahorro} m` : ''}`
  : `ahorras ${t.ahorro} m de recorrido en cada ida y vuelta`);
const numeroRack = (id: string) => p.racks.findIndex((r) => r.id === id) + 1;
// Túnel propio de un rack (pisa el del modelo del paso 3); null = este rack sin túnel
function ponerTunel(r: any, t: { cuerpo: number; altoLibre: number } | null) {
  const v = t ? { cuerpo: Math.min(r.cuerpos - 1, Math.max(0, t.cuerpo)), altoLibre: t.altoLibre } : null;
  p.racks = p.racks.map((x) => (x.id === r.id ? { ...x, tunelPropio: true, tunelRack: v, tunel: v } : x));
  marcar('tunel', { origen: 'rack', alto: v?.altoLibre ?? 0 });
}
function tunelDelModelo(r: any) {
  const mo = p.modelos.find((m) => m.id === r.modelo);
  p.racks = p.racks.map((x) => { if (x.id !== r.id) return x; const { tunelPropio: _a, tunelRack: _b, ...resto } = x; return { ...resto, tunel: mo?.tunel ?? null }; });
}
function aplicarSugerencia(sg: { rackId: string; cuerpo: number; altoLibre: number }) {
  const r = p.racks.find((x) => x.id === sg.rackId);
  if (!r) return;
  ponerTunel(r, { cuerpo: sg.cuerpo, altoLibre: sg.altoLibre });
  sel.value = r.id; elementoSel.value = null;
  marcar('tunel', { origen: 'sugerencia' });
}
// Túneles en línea: el mismo paso en todas las filas paralelas (la grúa cruza todas derecho)
const enLinea = computed(() => (sugerencias.value[0] ? tunelesAlineados(p.racks, sugerencias.value[0]) as { rackId: string; cuerpo: number }[] : []));
function aplicarEnLinea() {
  const s0 = sugerencias.value[0], lista = enLinea.value;
  if (!s0 || !lista.length) return;
  p.racks = p.racks.map((x) => {
    const t = lista.find((l) => l.rackId === x.id);
    if (!t) return x;
    const v = { cuerpo: t.cuerpo, altoLibre: s0.altoLibre };
    return { ...x, tunelPropio: true, tunelRack: v, tunel: v };
  });
  marcar('tunel', { origen: 'en_linea', filas: lista.length });
}
// Lo que deja el túnel del rack elegido: paso libre real, posiciones que se pierden y si pasa la grúa
const infoTunel = computed(() => {
  const r = rackSel.value;
  if (!r?.tunel || r.tipo !== 'RS') return null;
  const m = medidasRack(r) as any, t = m.tunel;
  if (!t) return null;
  const pierde = t.quitadas * m.palletsPorViga * (m.doble ? 2 : 1);
  const grua = tunelParaGrua(r, p.bodega.grua);
  return {
    grua,
    texto: `Paso libre real ${fm(t.libreReal ?? t.altoLibre)} m · ${pierde} ${pierde === 1 ? 'posición menos' : 'posiciones menos'} · ${grua ? 'pasa tu grúa' : `tu grúa no pasa (necesita ${fm(altoTunelGrua(p.bodega.grua))} m)`}`,
  };
});
const nombreRack = (r: any) => p.modelos.find((m) => m.id === r.modelo)?.nombre ?? NOMBRE[r.tipo];

// ─── Panel de propiedades (derecha del plano) ───
const tituloPanel = computed(() => (rackSel.value ? nombreRack(rackSel.value) : muroActual.value ? `Muro ${letraMuro(muroActual.value.i)}` : elementoActual.value ? (ELEMENTOS as Record<string, any>)[elementoActual.value.clase].nombre : ''));

// ─── Forma de la bodega: rectángulo o libre (dibujada). L y T se quitaron (dueño 27-10) ───
const contornoActual = computed(() => contorno(p.bodega) as { x: number; y: number }[]);
const cajaBodega = computed(() => caja(contornoActual.value));
const fm2 = (v: number) => +(+v).toFixed(2);
const formaActual = computed(() => (dibujo.value || p.bodega.forma ? 'libre' : 'rect'));
const muroActual = computed(() => {
  const i = muroSel.value, poly = contornoActual.value;
  if (i === null || !p.bodega.forma || !poly[i]) return null;
  const a = poly[i], b = poly[(i + 1) % poly.length];
  return { i, a, b, largo: Math.hypot(b.x - a.x, b.y - a.y) };
});
const r05 = (v: number) => Math.round(v * 2) / 2;
function ponerForma(v: string) {
  const c = cajaBodega.value, W = c.x1 - c.x0, L = c.y1 - c.y0;
  muroSel.value = null;
  if (v === 'libre') { if (!dibujo.value && !p.bodega.forma) empezarDibujo(); return; }
  dibujo.value = null;
  p.bodega.forma = null; p.bodega.tipoForma = null; p.bodega.ancho = W; p.bodega.largo = L;
  marcar('forma_bodega', { forma: 'rect' });
}
function moverVertice(i: number, q: { x: number; y: number }) {
  if (!p.bodega.forma) return;
  // Los muros que llegan a la esquina siguen rectos: si eran horizontales o verticales, la esquina vecina la acompaña
  const f = p.bodega.forma, n = f.length, o = f[i], ant = (i - 1 + n) % n, sig = (i + 1) % n;
  const acompanar = (v: { x: number; y: number }) =>
    Math.abs(v.y - o.y) < 1e-6 ? { x: v.x, y: q.y } : Math.abs(v.x - o.x) < 1e-6 ? { x: q.x, y: v.y } : v;
  p.bodega.forma = f.map((v, j) => (j === i ? { x: q.x, y: q.y } : n >= 4 && (j === ant || j === sig) ? acompanar(v) : v));
  // Los racks del cliente se conservan: si la forma nueva los deja fuera, quedan en rojo (malos)
}
function agregarEsquina() {
  const m = muroActual.value;
  if (!m || !p.bodega.forma) return;
  const nueva = { x: r05((m.a.x + m.b.x) / 2), y: r05((m.a.y + m.b.y) / 2) };
  const f = [...p.bodega.forma];
  f.splice(m.i + 1, 0, nueva);
  p.bodega.forma = f;
  p.bodega.tipoForma = 'libre';
}
function quitarEsquina() {
  const m = muroActual.value;
  if (!m || !p.bodega.forma || p.bodega.forma.length <= 3) return;
  // Quita la esquina donde termina el muro elegido: sus dos muros quedan en uno
  const j = (m.i + 1) % p.bodega.forma.length;
  p.bodega.forma = p.bodega.forma.filter((_, k) => k !== j);
  p.bodega.tipoForma = 'libre';
  muroSel.value = null;
}
// Largo de un muro: corre su esquina final (y, si el muro siguiente es perpendicular, también ese muro entero)
function largoMuro(valor: string, i = muroSel.value) {
  const m = murosForma.value.find((x) => x.i === i), f = p.bodega.forma;
  const v = Number(valor);
  if (!m || !f || !(v >= 0.5)) return;
  const ux = (m.b.x - m.a.x) / m.largo, uy = (m.b.y - m.a.y) / m.largo, d = v - m.largo;
  const n = f.length, j = (m.i + 1) % n, k = (m.i + 2) % n;
  const c = f[k], wx = c.x - m.b.x, wy = c.y - m.b.y;
  const perpendicular = Math.abs(ux * wx + uy * wy) < 1e-6 * Math.max(1, Math.hypot(wx, wy));
  p.bodega.forma = f.map((q, idx) => (idx === j || (perpendicular && idx === k) ? { x: +(q.x + ux * d).toFixed(2), y: +(q.y + uy * d).toFixed(2) } : q));
}
// ─── Dibujo libre del contorno: esquina a esquina, muros rectos, o escritos con su largo y dirección ───
const dibujo = ref<{ x: number; y: number }[] | null>(null);
const diagonales = ref(false);
const avisoDibujo = ref('');
// Metros escritos en el teclado para el muro que se está tirando (Enter lo fija hacia donde apunta el cursor)
const largoEscrito = ref('');
const largoEscritoNum = computed(() => { const v = Number(largoEscrito.value.replace(',', '.')); return v > 0 ? v : null; });
// Plano: x a la derecha, y hacia abajo
const DIRECCIONES = [
  { v: 'e', f: '→', t: 'Hacia la derecha', dx: 1, dy: 0, recto: true },
  { v: 's', f: '↓', t: 'Hacia abajo', dx: 0, dy: 1, recto: true },
  { v: 'o', f: '←', t: 'Hacia la izquierda', dx: -1, dy: 0, recto: true },
  { v: 'n', f: '↑', t: 'Hacia arriba', dx: 0, dy: -1, recto: true },
  { v: 'se', f: '↘', t: 'En diagonal hacia abajo a la derecha', dx: 1, dy: 1, recto: false },
  { v: 'so', f: '↙', t: 'En diagonal hacia abajo a la izquierda', dx: -1, dy: 1, recto: false },
  { v: 'no', f: '↖', t: 'En diagonal hacia arriba a la izquierda', dx: -1, dy: -1, recto: false },
  { v: 'ne', f: '↗', t: 'En diagonal hacia arriba a la derecha', dx: 1, dy: -1, recto: false },
];
const letraMuro = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : `M${i + 1}`);
function flechaDe(a: { x: number; y: number }, b: { x: number; y: number }) {
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  return DIRECCIONES.map((d) => ({ d, e: Math.abs(Math.atan2(Math.sin(ang - Math.atan2(d.dy, d.dx)), Math.cos(ang - Math.atan2(d.dy, d.dx)))) })).sort((x, y) => x.e - y.e)[0].d.f;
}
const murosDe = (pts: { x: number; y: number }[], cerrado: boolean) =>
  pts.slice(0, cerrado ? pts.length : pts.length - 1).map((a, i) => {
    const b = pts[(i + 1) % pts.length];
    return { i, a, b, letra: letraMuro(i), flecha: flechaDe(a, b), largo: Math.hypot(b.x - a.x, b.y - a.y) };
  });
const murosDibujo = computed(() => (dibujo.value && dibujo.value.length >= 2 ? murosDe(dibujo.value, false) : []));
const murosForma = computed(() => (p.bodega.forma ? murosDe(contornoActual.value, true) : []));
function empezarDibujo() {
  dibujo.value = [];
  avisoDibujo.value = '';
  largoEscrito.value = '';
  sel.value = null; elementoSel.value = null; muroSel.value = null; trazado.value = null;
  vista.value = '2d';
  marcar('forma_bodega', { forma: 'libre' });
}
// Esquina nueva (clic en el plano o metros escritos). Si vuelve al primer punto, el dibujo termina ahí
function agregarPuntoDibujo(q: { x: number; y: number }) {
  const d = dibujo.value;
  if (!d) return;
  avisoDibujo.value = '';
  largoEscrito.value = '';
  const igual = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) < 0.02;
  if (d.length && igual(q, d[d.length - 1])) return;
  if (d.length >= 3 && igual(q, d[0])) { terminarDibujo(); return; }
  if (d.length && igual(q, d[0])) return;
  d.push({ x: q.x, y: q.y });
}
function cancelarDibujo() {
  dibujo.value = null;
  largoEscrito.value = '';
  avisoDibujo.value = '';
}
// Largo escrito para un muro ya tirado: su punta y todo lo que sigue se corren a lo largo de ese muro
function largoMuroDibujo(i: number, valor: string) {
  const d = dibujo.value, v = Number(String(valor).replace(',', '.'));
  if (!d || !d[i + 1] || !(v >= 0.5)) return;
  const a = d[i], b = d[i + 1], L = Math.hypot(b.x - a.x, b.y - a.y);
  if (L < 1e-6) return;
  const dx = ((b.x - a.x) / L) * (v - L), dy = ((b.y - a.y) / L) * (v - L);
  dibujo.value = d.map((q, j) => (j > i ? { x: +(q.x + dx).toFixed(2), y: +(q.y + dy).toFixed(2) } : q));
}
// Teclado mientras se dibuja: números = metros del muro, Enter lo fija, Retroceso borra (o deshace la esquina),
// Esc cancela el dibujo
function teclaDibujo(e: KeyboardEvent) {
  if (!dibujo.value) return;
  if (e.key === 'Escape') { e.preventDefault(); if (largoEscrito.value) largoEscrito.value = ''; else cancelarDibujo(); return; }
  if ((e.target as HTMLElement)?.closest?.('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^[0-9]$/.test(e.key) || ((e.key === ',' || e.key === '.') && !/[.,]/.test(largoEscrito.value))) {
    e.preventDefault();
    if (!dibujo.value.length) { avisoDibujo.value = 'Primero toca en el plano dónde parte el primer muro.'; return; }
    if (largoEscrito.value.length < 6) largoEscrito.value += e.key;
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    if (largoEscrito.value) largoEscrito.value = largoEscrito.value.slice(0, -1);
    else dibujo.value.pop();
  } else if (e.key === 'Enter') {
    const L = largoEscritoNum.value, q = (plano.value as any)?.cursorDibujo as { x: number; y: number } | null;
    if (L && q && dibujo.value.length) { e.preventDefault(); agregarPuntoDibujo(q); }
    else if (L) avisoDibujo.value = 'Apunta con el mouse hacia donde va el muro y presiona Enter.';
    else if (dibujo.value.length >= 3) { e.preventDefault(); terminarDibujo(); }
  }
}
onMounted(() => window.addEventListener('keydown', teclaDibujo));
onBeforeUnmount(() => window.removeEventListener('keydown', teclaDibujo));
function terminarDibujo() {
  let pts = (dibujo.value ?? []).filter((q, i, a) => i === 0 || q.x !== a[i - 1].x || q.y !== a[i - 1].y);
  if (pts.length > 1 && pts[0].x === pts[pts.length - 1].x && pts[0].y === pts[pts.length - 1].y) pts.pop();
  // Con muros rectos, si el último punto no queda alineado con el primero se agrega la esquina que falta
  const a = pts[0], z = pts[pts.length - 1], y0 = pts[pts.length - 2];
  if (!diagonales.value && pts.length >= 2 && Math.abs(a.x - z.x) > 0.01 && Math.abs(a.y - z.y) > 0.01) {
    const ultimoHorizontal = Math.abs(z.y - y0.y) < 0.01;
    pts = [...pts, ultimoHorizontal ? { x: z.x, y: a.y } : { x: a.x, y: z.y }];
  }
  // Sin esquinas en línea recta
  pts = pts.filter((q, i) => {
    const u = pts[(i - 1 + pts.length) % pts.length], w = pts[(i + 1) % pts.length];
    return Math.abs((q.x - u.x) * (w.y - u.y) - (q.y - u.y) * (w.x - u.x)) > 1e-6;
  });
  if (pts.length < 3 || Math.abs(areaPoligono(pts)) < 4) { avisoDibujo.value = 'Faltan muros: dibuja al menos tres esquinas que encierren tu bodega.'; return; }
  // Coordenadas desde 0 (el plano parte en la esquina de arriba a la izquierda)
  const c = caja(pts);
  p.bodega.forma = pts.map((q) => ({ x: +(q.x - c.x0).toFixed(2), y: +(q.y - c.y0).toFixed(2) }));
  p.bodega.tipoForma = 'libre';
  p.bodega.ancho = +(c.x1 - c.x0).toFixed(2); p.bodega.largo = +(c.y1 - c.y0).toFixed(2);
  dibujo.value = null;
  largoEscrito.value = '';
  marcar('forma_bodega_lista', { esquinas: pts.length });
}
// Largo y fondo del rack en planta (sin importar si esta girado)
function medidasPlanta(r: any) {
  const q = rectangulo(r), lado = r.rot === 90 || r.rot === 270;
  return { largo: lado ? q.alto : q.ancho, fondo: lado ? q.ancho : q.alto };
}
function resumenRack(r: any) {
  const c = conteoTotal([r]);
  const u = r.tipo === 'DI' ? (r.cuerpos === 1 ? 'calle' : 'calles') : r.cuerpos === 1 ? 'cuerpo' : 'cuerpos';
  return `${r.cuerpos} ${u}${r.doble ? ' por lado' : ''} · ${n(c.posiciones || c.cajas)} ${c.posiciones ? 'posiciones' : 'cajas'}`;
}
// Distancia del rack a los muros izquierdo y de arriba (borde del rack, m)
const bordeRack = computed(() => {
  const r = rackSel.value, c = caja(contorno(p.bodega));
  if (!r) return { x: 0, y: 0 };
  const q = rectangulo(r);
  return { x: +(q.x0 - c.x0).toFixed(2), y: +(q.y0 - c.y0).toFixed(2) };
});
function moverRackA(eje: 'x' | 'y', ev: Event) {
  const r = rackSel.value;
  if (!r) return;
  const v = Math.max(0, Number((ev.target as HTMLInputElement).value) || 0);
  const d = v - bordeRack.value[eje];
  mover(r.id, eje === 'x' ? r.x + d : r.x, eje === 'y' ? r.y + d : r.y, false);
}

// ─── Elemento seleccionado ───
const largoEnX = computed(() => (elementoActual.value ? elementoActual.value.ancho >= elementoActual.value.alto : true));
const anchoPasillo = computed(() => (elementoActual.value ? Math.min(elementoActual.value.ancho, elementoActual.value.alto) : 0));
// Anchos que se ofrecen para un pasillo de grua: el minimo del equipo y un poco mas (nunca menos)
const anchosGrua = computed(() => [grua.value.pasillo, grua.value.pasillo + 0.5, grua.value.pasillo + 1].map((v) => +v.toFixed(2)));
// Distancia al muro izquierdo y al de arriba: del elemento o, en una grilla de pilares que se mueve junta, del bloque
const borde = computed(() => {
  const e = elementoActual.value, c = caja(contorno(p.bodega));
  if (!e) return { x: 0, y: 0 };
  const grupo = e.clase === 'pilar' && e.grupo && moverPilares.value === 'todos' ? p.bodega.elementos.filter((q: any) => q.grupo === e.grupo) : [e];
  return { x: +(Math.min(...grupo.map((q: any) => q.x - q.ancho / 2)) - c.x0).toFixed(2), y: +(Math.min(...grupo.map((q: any) => q.y - q.alto / 2)) - c.y0).toFixed(2) };
});
function anchoDePasillo(a: number) {
  const e = elementoActual.value;
  if (!e) return;
  cambiarElemento(e.ancho >= e.alto ? { alto: a } : { ancho: a });
}
function moverElementoA(eje: 'x' | 'y', ev: Event) {
  const e = elementoActual.value, c = caja(contorno(p.bodega));
  if (!e) return;
  const v = Math.max(0, Number((ev.target as HTMLInputElement).value) || 0), d = v - borde.value[eje];
  if (e.clase === 'pilar') { moverElemento(e.id, eje === 'x' ? e.x + d : e.x, eje === 'y' ? e.y + d : e.y); return; }
  cambiarElemento(eje === 'x' ? { x: +(c.x0 + v + e.ancho / 2).toFixed(2) } : { y: +(c.y0 + v + e.alto / 2).toFixed(2) });
}

// El layout es del cliente (dueño 22-10-2026): el sistema no propone ni ubica racks. El cliente agrega cada
// lineal, lo arrastra y elige simple o doble; la barra de demanda le dice cuánto le falta

// Portones y andenes llevan su zona de maniobra (elemento hijo que se regenera)
function sincronizarManiobras() {
  const nuevos = conManiobras(p.bodega);
  if (JSON.stringify(nuevos) !== JSON.stringify(p.bodega.elementos)) p.bodega.elementos = nuevos;
}

function medida(campo: 'ancho' | 'largo', e: Event) {
  const v = Math.min(200, Math.max(4, Number((e.target as HTMLInputElement).value) || 4));
  if (dibujo.value) { p.bodega[campo] = v; return; }
  if (p.bodega.forma) {
    // Con forma (L, T, libre): se estira la planta en ese sentido, manteniendo la forma
    const c = cajaBodega.value, eje = campo === 'ancho' ? 'x' : 'y';
    const o = eje === 'x' ? c.x0 : c.y0, actual = eje === 'x' ? c.x1 - c.x0 : c.y1 - c.y0;
    p.bodega.forma = p.bodega.forma.map((q) => ({ ...q, [eje]: +(o + ((q[eje] - o) * v) / actual).toFixed(2) }));
  }
  p.bodega[campo] = v;
}
// Mover un rack: con imán (muro, espalda con espalda, pasillo exacto y extremos alineados) y sus guías
const guias = ref<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
function mover(id: string, x: number, y: number, iman = true) {
  const r = racksPlano.value.find((q) => q.id === id);
  if (!r) return;
  const m = iman ? imanRack(r, racksPlano.value, p.bodega, x, y) : { x, y, guias: [] };
  guias.value = m.guias;
  // Con imán no se redondea a la grilla (el pasillo quedaría 5 cm corto); igual no se sale de la bodega
  const nuevo = m.guias.length ? dentroSinRedondear(normalizar({ ...r, x: m.x, y: m.y })) : dentroDeBodega(normalizar({ ...r, x, y }), p.bodega);
  racksPlano.value = racksPlano.value.map((q) => (q.id === id ? nuevo : q));
}
function dentroSinRedondear(r: any) {
  const q = rectangulo(r), c = caja(contorno(p.bodega));
  const x = Math.min(Math.max(r.x, c.x0 + q.ancho / 2), Math.max(c.x0 + q.ancho / 2, c.x1 - q.ancho / 2));
  const y = Math.min(Math.max(r.y, c.y0 + q.alto / 2), Math.max(c.y0 + q.alto / 2, c.y1 - q.alto / 2));
  return { ...r, x: +x.toFixed(3), y: +y.toFixed(3) };
}
const contenidoTotal = (r: any) => { const c = conteoRack(r); return c.posiciones || c.cajas; };
const pasilloDe = (r: any) => pasilloRequerido(r, p.bodega);
// Voltear el frente (por dónde se carga) sin moverlo de su lugar
function voltear(r: any) {
  racksPlano.value = racksPlano.value.map((x) => (x.id === r.id ? normalizar({ ...x, rot: (x.rot + 180) % 360 }) : x));
}
// Pasillo libre frente al rack elegido: se ve y se cambia de a 10 cm (mueve el rack, no el vecino)
const frenteSel = computed(() => (rackSel.value ? distanciaFrente(rackSel.value, racksPlano.value, p.bodega) : null));
function cambiarFrente(delta: number) {
  const r = rackSel.value, f = frenteSel.value;
  if (!r || !f || f.valor == null) return;
  const d = Math.max(-f.valor, delta);
  mover(r.id, r.x - f.dx * d, r.y - f.dy * d, false);
}
// Lo máximo que cabe del rack elegido: cuerpos a lo largo (desde su inicio) y filas hasta el muro
const maxLargo = computed(() => (rackSel.value ? Math.max(rackSel.value.cuerpos, alargarHastaMuro(rackSel.value, racksPlano.value, p.bodega, 1).cuerpos) : 50));
const maxFilas = computed(() => (rackSel.value ? maxBloque(rackSel.value, opcionesBloque(rackSel.value), 'profundidad', racksPlano.value, p.bodega) : 1));
// ─── Deshacer / rehacer: racks y elementos de la bodega (Ctrl+Z / Ctrl+Y) ───
const historia = { pasado: [] as string[], futuro: [] as string[] };
const puedeDeshacer = ref(false), puedeRehacer = ref(false);
const fotoLayout = () => JSON.stringify({ racks: p.racks, racksHoy: p.racksHoy, elementos: p.bodega.elementos });
let ultimaFoto = '', restaurando = false, relojHistoria: ReturnType<typeof setTimeout> | null = null;
onMounted(() => { ultimaFoto = fotoLayout(); });
watch(() => [p.racks, p.racksHoy, p.bodega.elementos], () => {
  if (restaurando) return;
  if (relojHistoria) clearTimeout(relojHistoria);
  relojHistoria = setTimeout(guardarHistoria, 400);
}, { deep: true });
function guardarHistoria() {
  const s = fotoLayout();
  if (s === ultimaFoto) return;
  historia.pasado.push(ultimaFoto);
  if (historia.pasado.length > 80) historia.pasado.shift();
  historia.futuro = [];
  ultimaFoto = s;
  puedeDeshacer.value = true; puedeRehacer.value = false;
}
function restaurar(s: string) {
  restaurando = true;
  const o = JSON.parse(s);
  p.racks = o.racks; p.racksHoy = o.racksHoy; p.bodega.elementos = o.elementos;
  ultimaFoto = s;
  if (sel.value && !racksPlano.value.some((r) => r.id === sel.value)) sel.value = null;
  puedeDeshacer.value = historia.pasado.length > 0; puedeRehacer.value = historia.futuro.length > 0;
  setTimeout(() => { restaurando = false; }, 0);
}
function deshacer() {
  if (relojHistoria) { clearTimeout(relojHistoria); guardarHistoria(); }
  const s = historia.pasado.pop();
  if (!s) return;
  historia.futuro.push(ultimaFoto);
  restaurar(s);
}
function rehacer() {
  const s = historia.futuro.pop();
  if (!s) return;
  historia.pasado.push(ultimaFoto);
  restaurar(s);
}
function teclaHistoria(e: KeyboardEvent) {
  if (trazado.value || (e.target as HTMLElement)?.closest?.('input, textarea, select')) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); deshacer(); }
  else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); rehacer(); }
}
onMounted(() => window.addEventListener('keydown', teclaHistoria));
onBeforeUnmount(() => window.removeEventListener('keydown', teclaHistoria));
// ─── Alinear pasillos y pasillos sin salida ───
const avisoAlinear = ref('');
function alinearPasillos() {
  const o = ordenarPasillos(p.racks, p.bodega);
  p.racks = o.racks;
  avisoAlinear.value = o.avisos[0] ?? (o.movidos ? `Listo: ${o.movidos} ${o.movidos === 1 ? 'rack quedó' : 'racks quedaron'} al pasillo exacto y alineados. Si no te gusta, Deshacer.` : 'Tus racks ya estaban alineados.');
  setTimeout(() => { avisoAlinear.value = ''; }, 7000);
  marcar('alinear', { movidos: o.movidos });
}
const sinSalida = computed(() => (modo.value === 'layout' && !enHoy.value ? pasillosSinSalida(p.racks.filter((r: any) => !r.existente), p.bodega) : []));
function abrirPaso() {
  const s0 = sinSalida.value[0];
  if (!s0) return;
  const antes = porPoner.value;
  p.racks = abrirConexion(p.racks, p.bodega, s0.filas, s0.lado);
  avisoDescuento('Acortaste las filas: la grúa ya puede entrar', antes);
  marcar('abrir_conexion', {});
}
// ─── Flechas del rack elegido: tirar de un extremo lo alarga o acorta; de un costado, suma filas ───
const textoEstirar = ref('');
let antesEstirar: number | null = null, topeFilas: { s: number; k: number } | null = null;
function estirarRack(orig: any, tipo: 'largo' | 'filas', s: number, metros: number, fin: boolean) {
  if (antesEstirar == null) antesEstirar = porPoner.value;
  const u = orig.tipo === 'DI' ? 'calles' : 'cuerpos', uPos = orig.tipo === 'AR' ? 'cajas' : 'posiciones';
  if (tipo === 'largo') {
    const L0 = medidasPlanta(orig).largo, paso = L0 / orig.cuerpos;
    const tope = alargarHastaMuro(orig, racksPlano.value, p.bodega, s as 1 | -1).cuerpos;
    const k = Math.min(Math.max(1, Math.round((L0 + metros) / paso)), Math.max(orig.cuerpos, tope));
    let nuevo: any = conCuerpos(orig, k);
    if (s < 0) {
      // Se tira del extremo de la izquierda (o de arriba): el otro extremo queda donde estaba
      const q = rectangulo(orig), qc = rectangulo(nuevo), lado = orig.rot === 90 || orig.rot === 270;
      nuevo = lado ? { ...nuevo, y: +(q.y0 + q.alto - qc.alto / 2).toFixed(3) } : { ...nuevo, x: +(q.x0 + q.ancho - qc.ancho / 2).toFixed(3) };
    }
    const actual = racksPlano.value.find((x) => x.id === orig.id);
    if (actual && (actual.cuerpos !== nuevo.cuerpos || actual.x !== nuevo.x || actual.y !== nuevo.y)) racksPlano.value = racksPlano.value.map((x) => (x.id === orig.id ? nuevo : x));
    const d = k - orig.cuerpos;
    textoEstirar.value = fin ? '' : `${k} ${k === 1 ? u.replace(/s$/, '') : u} · ${n(contenidoTotal(nuevo))} ${uPos}${k > orig.cuerpos && k >= tope && metros > 0 ? ' · llegó al muro' : ''}`;
    if (fin && d) {
      avisoDescuento(`${d > 0 ? 'Alargaste' : 'Acortaste'} el lineal ${Math.abs(d)} ${Math.abs(d) === 1 ? u.replace(/s$/, '') : u}`, antesEstirar);
      marcar('rack_add', { tipo: 'flecha_largo', cuerpos: d });
    }
  } else {
    bloque.sentido = s;
    if (!topeFilas || topeFilas.s !== s) topeFilas = { s, k: maxBloque(orig, opcionesBloque(orig), 'profundidad', racksPlano.value, p.bodega) };
    const paso = medidasPlanta(orig).fondo + (orig.tipo === 'AR' ? bloque.pasillo : pasilloDe(orig));
    const quiere = 1 + Math.max(0, Math.floor(metros / paso + 0.35));
    bloque.profundidad = Math.min(quiere, topeFilas.k);
    const mas = bloque.profundidad - 1, falta = faltaDelModelo(orig);
    textoEstirar.value = fin ? '' : quiere > 1 && topeFilas.k < 2 ? 'No cabe otra fila hacia este lado'
      : mas ? `+${mas} ${mas === 1 ? 'fila' : 'filas'} · +${n(aportePrevia.value)} ${uPos}${falta > 0 && aportePrevia.value >= falta ? ' · ✓ cumples' : ''}${quiere > topeFilas.k ? ' · llegó al muro' : ''}`
      : 'Tira para sumar filas';
    if (fin) {
      if (bloque.profundidad > 1 && rackSel.value) repetir(rackSel.value);
      bloque.profundidad = 1; bloque.sentido = 0;
    }
  }
  if (fin) { antesEstirar = null; topeFilas = null; }
}
// Alto de los avisos que flotan arriba del plano (el menú del rack no se les pone encima)
const altoAvisos = ref(0);
let obsAvisos: ResizeObserver | null = null;
function observarAvisos(el: any) {
  obsAvisos?.disconnect();
  if (!el || typeof ResizeObserver === 'undefined') { altoAvisos.value = 0; return; }
  obsAvisos = new ResizeObserver(([e]) => { altoAvisos.value = Math.round(e.contentRect.height); });
  obsAvisos.observe(el);
}
onBeforeUnmount(() => obsAvisos?.disconnect());
// Hacia dónde no cabe ni una fila más: esa flecha no se muestra
const flechasNo = computed(() => {
  const r = rackSel.value;
  if (!r || r.existente) return [];
  return [-1, 1].filter((s) => !(previaBloque(r, { ...opcionesBloque(r), largo: 1, profundidad: 2, sentido: s }, racksPlano.value, p.bodega) as any[])[0]?.ok).map((s) => `filas${s > 0 ? '+' : '-'}`);
});
// Menú que flota sobre el rack elegido (arriba; si no hay espacio, abajo). Se esconde mientras se arrastra
const menuRack = computed(() => {
  const c = (plano.value as any)?.cajaRack, r = rackSel.value;
  if (!c || !r || r.existente || enHoy.value || modo.value !== 'layout' || pincel.value || trazado.value || (plano.value as any)?.moviendo) return null;
  const ancho = 230, alto = 44;
  const x = Math.min(Math.max(8, c.x + c.w / 2 - ancho / 2), Math.max(8, c.W - ancho - 8));
  // Arriba del rack (sobre su flecha de filas); si choca con el borde o con un aviso de arriba, abajo
  const techo = altoAvisos.value ? altoAvisos.value + 16 : 8;
  let y = c.y - 40 - alto;
  if (y < techo) y = c.y + c.h + 40;
  return { x, y: Math.min(Math.max(8, y), c.H - alto - 8) };
});
// Menús de la barra del plano (uno abierto a la vez) y panel de detalle del rack
const menu = ref<'' | 'agregar' | 'mas'>('');
const detalle = ref(false);
watch(sel, () => { detalle.value = false; menu.value = ''; });
function girar(id: string) {
  racksPlano.value = racksPlano.value.map((r) => (r.id === id ? dentroDeBodega(normalizar({ ...r, rot: (r.rot + 90) % 360 }), p.bodega) : r));
}
function eliminar(id: string) {
  racksPlano.value = racksPlano.value.filter((r) => r.id !== id);
  if (sel.value === id) sel.value = null;
}
function duplicar(r: any) {
  const copia = lugarLibre({ ...r, id: nuevoId() }, racksPlano.value, p.bodega);
  racksPlano.value = [...racksPlano.value, copia];
  sel.value = copia.id;
}
function repetir(r: any) {
  const antes = porPoner.value;
  const res = repetirBloque(r, opcionesBloque(r), racksPlano.value, p.bodega, nuevoId) as { nuevos: any[]; omitidos: number; copias: any[] };
  racksPlano.value = [...racksPlano.value, ...res.nuevos];
  avisoDescuento(`Agregaste ${res.nuevos.length} ${res.nuevos.length === 1 ? 'fila' : 'filas'}`, antes);
  avisoBloque.value = `Se agregaron ${res.nuevos.length} ${res.nuevos.length === 1 ? 'fila' : 'filas'}${res.omitidos ? ` (${res.omitidos} no cabían: ${textoMotivos(res.copias)})` : ''}.`;
  marcar('rack_add', { tipo: 'bloque', largo: bloque.largo, profundidad: bloque.profundidad, nuevos: res.nuevos.length });
  bloque.largo = 1; bloque.profundidad = 1; bloque.sentido = 0;
}
// ─── Vista previa en el plano: copias del bloque o de la serie de pasillos ───
const opcionesBloque = (r: any) => ({ ...bloque, pasillo: r.tipo === 'AR' ? bloque.pasillo : null });
const previaRacks = computed(() => (rackSel.value && bloque.largo * bloque.profundidad > 1 ? previaBloque(rackSel.value, opcionesBloque(rackSel.value), racksPlano.value, p.bodega) as any[] : []));
// "Hasta el muro": cuántos caben de ese rack en ese sentido; quedan en vista previa para agregarlos con un toque
function alargar(r: any, sentido: 1 | -1) {
  const antes = porPoner.value, nuevo = alargarHastaMuro(r, racksPlano.value, p.bodega, sentido);
  const mas = nuevo.cuerpos - r.cuerpos, u = r.tipo === 'DI' ? 'calles' : 'cuerpos';
  if (!mas) { avisoMuro.value = 'No cabe otro en ese sentido: el muro, un rack o un pilar está al lado.'; return; }
  racksPlano.value = racksPlano.value.map((x) => (x.id === r.id ? nuevo : x));
  avisoMuro.value = `Se alargó ${mas} ${mas === 1 ? u.replace(/s$/, '') : u}: ahora tiene ${nuevo.cuerpos}.`;
  avisoDescuento(`Alargaste el lineal ${mas} ${u}`, antes);
  marcar('rack_add', { tipo: 'alargar', cuerpos: mas });
}
function hastaElMuro(r: any, eje: 'largo' | 'profundidad') {
  bloque.sentido = 0;
  const k = maxBloque(r, opcionesBloque(r), eje, racksPlano.value, p.bodega);
  bloque[eje] = k;
  filasJustas.value = 0;
  if (k < 2) { avisoMuro.value = 'No cabe otro en ese sentido: el muro o un rack está al lado.'; return; }
  // Cuántas filas bastan para lo que pidió de este modelo (el cliente decide si pone todas o solo esas)
  const falta = faltaDelModelo(r), porFila = conteoRack(r).posiciones || conteoRack(r).cajas;
  const justas = falta > 0 && porFila > 0 ? 1 + Math.ceil(falta / porFila) : 0;
  if (justas && justas < k) {
    filasJustas.value = justas;
    avisoMuro.value = `Caben ${k} filas hasta el muro. Con ${justas} ya cumples con lo que pediste.`;
  } else avisoMuro.value = `Caben ${k} filas hasta el muro. Revisa la vista previa y agrégalas.`;
}
const esPasillo = (e: any) => e && (e.clase === 'pasilloGrua' || e.clase === 'pasilloPeatonal');
const previaPas = computed(() => (esPasillo(elementoActual.value) && serie.cantidad > 1 ? previaPasillos(elementoActual.value, { ...serie }, p.bodega) as any[] : []));
const fantasmas = computed(() => [
  // Vista previa de la grilla de pilares mientras escribe cada cuántos metros
  ...(formPilares.value ? vistaPilares.value.map((q: any) => { const s = (TAMANOS_PILAR.find((x) => x.v === gp.tamano) ?? TAMANOS_PILAR[1]).s; return { x0: q.x - s / 2, y0: q.y - s / 2, ancho: s, alto: s, ok: true }; }) : []),
  ...previaRacks.value.map((c) => ({ ...rectangulo(c.rack), ok: c.ok, motivo: c.motivo })),
  ...previaPas.value.map((c) => ({ ...rectElemento(c.el), ok: c.ok, motivo: c.motivo })),
]);
watch(elementoSel, () => { serie.cantidad = 1; });
watch(sel, () => { bloque.largo = 1; bloque.profundidad = 1; bloque.sentido = 0; avisoBloque.value = ''; avisoMuro.value = ''; });
// Paso entre filas de racks (eje a eje) perpendicular al pasillo elegido: para alinear la serie con ellas
const pasoFilas = computed(() => {
  const e = elementoActual.value;
  if (!esPasillo(e)) return null;
  const vertical = e.alto > e.ancho;
  const r = p.racks.find((x) => !x.existente);
  if (!r) return null;
  const h = huella(medidasRack(r));
  // Pasillo a lo largo de las filas: una fila + su pasillo; atravesado: el largo de un tramo + 0,5 m
  const filasEnX = r.rot === 90 || r.rot === 270;
  return +((vertical === filasEnX ? h.fondo + pasilloRequerido(r, p.bodega) : h.largo + 0.5).toFixed(2));
});
function agregarSerie() {
  const nuevos = previaPas.value.filter((c) => c.ok).map((c) => ({ ...c.el, id: nuevoId() }));
  p.bodega.elementos = [...p.bodega.elementos, ...nuevos];
  marcar('elemento_add', { clase: elementoActual.value?.clase, serie: nuevos.length + 1 });
  serie.cantidad = 1;
}
// ─── Cobertura: lo ubicado contra los pallets del paso 2, por modelo y por producto ───
// Dónde va cada producto: en qué modelo y en qué niveles ("Rack selectivo: piso y nivel 1")
function dondeVa(id: string) {
  const alturas = (ix: number[]) => {
    const t = ix.map((i) => (i === 0 ? 'piso' : `nivel ${i}`));
    return t.length > 1 ? `${t.slice(0, -1).join(', ')} y ${t[t.length - 1]}` : t[0];
  };
  return p.modelos.filter((m) => (m.cantidades?.[id] ?? 0) > 0).map((m) => {
    const mezcla = (resultados.value[m.id]?.r?.mezcla ?? []) as (string | null)[];
    const ix = mezcla.map((x, i) => (x === id ? i : -1)).filter((i) => i >= 0);
    return m.tipo === 'RS' && ix.length && ix.length < mezcla.length ? `${m.nombre}: ${alturas(ix)}` : `${m.nombre}: todos los niveles`;
  }).join(' · ');
}
// ─── Configuraciones mixtas (varios modelos): color y letra por modelo, y asignar un modelo a cada rack ───
const PALETA = [
  { fondo: '#ffedd5', borde: '#ea580c', linea: '#fb923c' },
  { fondo: '#dbeafe', borde: '#2563eb', linea: '#60a5fa' },
  { fondo: '#dcfce7', borde: '#16a34a', linea: '#4ade80' },
  { fondo: '#f3e8ff', borde: '#9333ea', linea: '#c084fc' },
  { fondo: '#ccfbf1', borde: '#0d9488', linea: '#2dd4bf' },
  { fondo: '#fce7f3', borde: '#db2777', linea: '#f472b6' },
];
const indiceModelo = (id: string) => Math.max(0, p.modelos.findIndex((m) => m.id === id));
const colorModelo = (id: string) => PALETA[indiceModelo(id) % PALETA.length];
const letraModelo = (id: string) => String.fromCharCode(65 + indiceModelo(id));
// Solo con más de un modelo: si hay uno, el plano usa el color de siempre
const coloresModelos = computed(() => (p.modelos.length > 1 ? Object.fromEntries(p.modelos.map((m) => [m.id, colorModelo(m.id)])) : undefined));
const letrasModelos = computed(() => (p.modelos.length > 1 ? Object.fromEntries(p.modelos.map((m) => [m.id, letraModelo(m.id)])) : undefined));
const nombrePallet = (id: string) => [...p.pallets, ...p.cajas].find((t) => t.id === id)?.nombre ?? '';
function resumenModelo(m: any) {
  const res = resultados.value[m.id];
  const ids = Object.entries(m.cantidades ?? {}).filter(([, v]) => (v as number) > 0).map(([k]) => k);
  const quien = ids.map(nombrePallet).filter(Boolean).join(', ') || 'sin pallets';
  return m.tipo === 'AR' ? `${quien} · ${m.niveles} niveles de bandeja` : `${quien} · ${m.niveles} ${m.tipo === 'DI' ? 'niveles con el piso' : 'niveles + piso'}${res ? ` · ${res.porCuerpo} por ${m.tipo === 'DI' ? 'calle' : 'cuerpo'}` : ''}`;
}
// Lo que guarda un rack: por producto, según el nivel que le toca a cada uno
function contenidoRack(r: any) {
  const m: any = medidasRack(r), filas = m.doble ? 2 : 1, c = conteoRack(r);
  if (m.tipo === 'selectivo' && Array.isArray(r.mezcla) && r.mezcla.some(Boolean)) {
    const por = new Map<string, number>();
    // En el cuerpo túnel no hay pallets en las alturas bajo el paso libre
    const q = m.tunel?.quitadas ?? 0;
    r.mezcla.forEach((id: string | null, i: number) => { if (id) por.set(id, (por.get(id) ?? 0) + m.palletsPorViga * filas * (m.cuerpos - (i < q ? 1 : 0))); });
    return [...por].map(([id, k]) => `${nombrePallet(id)} ${n(k)}`).join(' · ') + ' posiciones';
  }
  return `${n(c.posiciones || c.cajas)} ${c.posiciones ? 'posiciones' : 'cajas'}`;
}
// Cambia la configuración de un rack: se rearma con ese modelo en su mismo lugar (no se reubica todo)
function asignarModelo(r: any, modeloId: string) {
  const mo = p.modelos.find((m) => m.id === modeloId);
  if (!mo || r.modelo === modeloId) return;
  const base = rackDeModelo(mo, { pallets: p.pallets, cajas: p.cajas, cuerpos: r.cuerpos, grua: p.bodega.grua });
  const propio = r.tunelPropio ? { tunelPropio: true, tunelRack: r.tunelRack ?? null, tunel: r.tunelRack ?? null } : {};
  const lineal = mo.tipo !== 'DI' && typeof r.dobleLineal === 'boolean' ? { doble: r.dobleLineal, dobleLineal: r.dobleLineal } : {};
  const nuevo = dentroDeBodega(normalizar({ ...base, id: r.id, x: r.x, y: r.y, rot: r.rot, cuerpos: r.cuerpos, modelo: modeloId, ...propio, ...lineal }), p.bodega);
  p.racks = p.racks.map((x) => (x.id === r.id ? nuevo : x));
  marcar('rack_modelo', { modelos: p.modelos.length });
}
function irAlPaso3() {
  p.ir('rack');
}
const cob = computed(() => cobertura({ racks: p.racks, modelos: p.modelos, pallets: p.pallets, cajas: p.cajas, grua: p.bodega.grua, ocupacion: p.bodega.ocupacion }) as any);
// Demanda (pasos 1–3) contra lo ubicado, sumando todos los modelos: lo que dice la barra sobre el plano
const demanda = computed(() => {
  const ms = cob.value.modelos as any[];
  const soloAR = ms.length > 0 && ms.every((m) => m.tipo === 'AR');
  const soloDI = ms.length > 0 && ms.every((m) => m.tipo === 'DI');
  return {
    necesita: ms.reduce((t, m) => t + (m.necesita || 0), 0),
    // Lo que pidió (pallets o cajas), antes del factor de ocupación
    pidio: soloAR ? ms.reduce((t, m) => t + (m.necesita || 0), 0) : ms.filter((m) => m.tipo !== 'AR').reduce((t, m) => t + (resultados.value[m.id]?.total || 0), 0),
    posiciones: ms.reduce((t, m) => t + (m.posiciones || 0), 0),
    necesarios: ms.reduce((t, m) => t + (m.necesarios || 0), 0),
    ubicados: ms.reduce((t, m) => t + (m.ubicados || 0), 0),
    faltan: ms.reduce((t, m) => t + Math.max(0, -(m.diferencia || 0)), 0),
    unidad: soloAR ? 'cajas' : 'pallets', unidadPos: soloAR ? 'cajas' : 'posiciones', unidadCuerpo: soloDI ? 'calles' : 'cuerpos',
  };
});
const hayElemento = (clase: string) => (p.bodega.elementos ?? []).some((e: any) => e.clase === clase);
// Posiciones que se pierden por pilares dentro de un rack o en la boca de una posición (conPilares)
const perdidasPilares = computed(() => p.racks.reduce((t: number, r: any) => t + (r.existente ? 0 : r.perdidas || 0), 0));
const avisoFaltan = ref('');
let relojAviso: ReturnType<typeof setTimeout> | null = null;
watch(avisoFaltan, (v) => { if (relojAviso) clearTimeout(relojAviso); if (v) relojAviso = setTimeout(() => { avisoFaltan.value = ''; }, 6000); });
// Posiciones (o cajas) que aún faltan contra lo que pidió
const porPoner = computed(() => Math.max(0, demanda.value.necesita - demanda.value.posiciones));
// ─── ¿Ya alcanza? El cliente tiene que saber cuándo sus racks cubren los pallets que pidió ───
const filasJustas = ref(0);
// Lo que aún le falta al modelo de ese rack (posiciones o cajas)
function faltaDelModelo(r: any) {
  const c = cob.value.modelos.find((x: any) => x.id === r.modelo);
  return c ? Math.max(0, c.necesita - c.posiciones) : porPoner.value;
}
// Lo que aportan las filas de la vista previa, contra lo que le falta a ese modelo
const aportePrevia = computed(() => previaRacks.value.filter((c) => c.ok).reduce((t, c) => { const k = conteoRack(c.rack); return t + (k.posiciones || k.cajas); }, 0));
const cubierto = computed(() => modo.value === 'layout' && !enHoy.value && demanda.value.necesita > 0 && porPoner.value === 0 && !demanda.value.faltan);
const logro = ref(false);
let logroTimer: ReturnType<typeof setTimeout> | null = null;
// Solo cuando pasa de "falta" a "cubierto" (no al abrir un diseño que ya cumplía)
watch(cubierto, (v, antes) => {
  if (logroTimer) clearTimeout(logroTimer);
  logro.value = !!v && antes === false;
  if (logro.value) {
    logroTimer = setTimeout(() => { logro.value = false; }, 12000);
    marcar('demanda_cubierta', { posiciones: demanda.value.posiciones, necesita: demanda.value.necesita });
  }
});
const textoLogro = computed(() => {
  const d = demanda.value;
  return d.unidad === 'pallets'
    ? `Con estos racks cumples con los ${n(d.pidio)} pallets que pediste: ${n(d.posiciones)} posiciones en el plano para las ${n(d.necesita)} que necesitas (ocupación ${Math.round((p.bodega.ocupacion ?? 0.8) * 100)} %).`
    : `Con estos estantes guardas lo que pediste: caben ${n(d.posiciones)} cajas para tus ${n(d.necesita)}.`;
});
// Lo que aporta un lineal nuevo de cada modelo (6 cuerpos; drive-in 4 calles), para mostrarlo en el botón
function aporteLineal(mo: any, doble: boolean) {
  const base = rackDeModelo(mo, { pallets: p.pallets, cajas: p.cajas, cuerpos: mo.tipo === 'DI' ? 4 : 6, grua: p.bodega.grua });
  const c = conteoRack(mo.tipo === 'DI' ? base : normalizar({ ...base, doble }));
  return c.posiciones || c.cajas;
}
// Simple o doble, lado a lado (para que el cliente elija; el sistema no decide ni ubica): un lineal de 6 cuerpos
// con su pasillo. Piso = largo × (fondo + medio pasillo por cara de carga): el simple carga por una cara y el
// doble por dos. "Te faltan" = lineales de ese tipo para cubrir lo que todavía no está en el plano
function opcionesLineal(mo: any) {
  const base = rackDeModelo(mo, { pallets: p.pallets, cajas: p.cajas, cuerpos: 6, grua: p.bodega.grua });
  const c = cob.value.modelos.find((x: any) => x.id === mo.id);
  const falta = c ? Math.max(0, c.necesita - c.posiciones) : 0;
  return [false, true].map((doble) => {
    const r = normalizar({ ...base, doble, rot: 0 });
    const q = rectangulo(r), cuenta = conteoRack(r);
    const pos = cuenta.posiciones || cuenta.cajas;
    const pasillo = pasilloRequerido(r, p.bodega);
    const m2 = q.ancho * (q.alto + (doble ? 2 : 1) * pasillo / 2);
    return { doble, pos, largo: q.ancho, fondo: q.alto, pasillo, m2, densidad: m2 > 0 ? (pos / m2) * 100 : 0, lineales: pos > 0 ? Math.ceil(falta / pos) : 0 };
  });
}
const compararLineal = computed(() => Object.fromEntries(p.modelos.filter((m) => m.tipo !== 'DI').map((m) => [m.id, opcionesLineal(m)])));
// ─── Pincel: el cliente dibuja cada lineal arrastrando (dueño 26-10: "que vaya arrastrando las cantidades que
// quiera por el lado que quiera de su bodega"). Simple o doble se elige por modelo antes de dibujar ───
const pincel = ref<{ modelo: string; doble: boolean } | null>(null);
const dobles = reactive<Record<string, boolean>>({});
const dobleDe = (m: any) => m.tipo !== 'DI' && (dobles[m.id] ?? !!m.doble);
const pincelModelo = computed(() => p.modelos.find((m) => m.id === pincel.value?.modelo));
function elegirDoble(m: any, v: boolean) {
  dobles[m.id] = v;
  if (pincel.value?.modelo === m.id) pincel.value = { modelo: m.id, doble: v };
}
function tomarPincel(id: string) {
  const m = p.modelos.find((x) => x.id === id);
  if (!m || pincel.value?.modelo === id) { pincel.value = null; return; }
  pincel.value = { modelo: id, doble: dobleDe(m) };
  sel.value = null; elementoSel.value = null; vista.value = '2d';
  if (trazado.value) terminarTrazado();
  marcar('pincel', { tipo: m.tipo, doble: dobleDe(m) });
}
const baseDe = (mo: any, doble: boolean) => ({ ...rackDeModelo(mo, { pallets: p.pallets, cajas: p.cajas, cuerpos: 1, grua: p.bodega.grua }), ...(mo.tipo === 'DI' ? {} : { doble, dobleLineal: doble }) });
const largoCuerpo = (mo: any) => {
  const r = normalizar({ ...baseDe(mo, dobleDe(mo)), rot: 0 });
  return rectangulo(normalizar({ ...r, cuerpos: 2 })).ancho - rectangulo(r).ancho;
};
const aporteCuerpo = (mo: any, doble = dobleDe(mo)) => { const c = conteoRack(normalizar({ ...baseDe(mo, doble), cuerpos: 1, rot: 0 })); return c.posiciones || c.cajas; };
// Lo que se ve mientras arrastra: el rack con sus cuerpos y lo que aporta
function armarLineal(a: Pto, b: Pto) {
  const mo = pincelModelo.value;
  if (!mo || !pincel.value) return null;
  const r = linealArrastrado(baseDe(mo, pincel.value.doble), a, b, p.bodega, racksPlano.value);
  // Cuerpos como en la barra de demanda: en el doble cuentan los dos lados
  const c = conteoRack(r), u = mo.tipo === 'DI' ? (c.cuerpos === 1 ? 'calle' : 'calles') : c.cuerpos === 1 ? 'cuerpo' : 'cuerpos';
  return { ...r, id: 'pincel', modelo: mo.id, texto: `${c.cuerpos} ${u} · ${fm(rectangulo(r)[r.rot % 180 ? 'alto' : 'ancho'])} m · ${n(c.posiciones || c.cajas)} ${c.posiciones ? 'pos.' : 'cajas'}` };
}
function pintarLineal(r: any) {
  const { texto, ...rack } = r;
  void texto;
  const antes = porPoner.value, mo = pincelModelo.value;
  const id = nuevoId();
  p.racks = [...p.racks, { ...rack, id }];
  sel.value = id;
  avisoDescuento(`Dibujaste ${conteoRack(rack).cuerpos} ${mo?.tipo === 'DI' ? 'calles' : 'cuerpos'}`, antes);
  marcar('rack_add', { tipo: 'pincel', cuerpos: rack.cuerpos, doble: !!rack.doble });
}
function teclaPincel(e: KeyboardEvent) { if (e.key === 'Escape' && pincel.value) pincel.value = null; }
onMounted(() => window.addEventListener('keydown', teclaPincel));
onBeforeUnmount(() => window.removeEventListener('keydown', teclaPincel));
watch(elementoSel, (v) => { if (v) pincel.value = null; });

// Un lineal nuevo del modelo, simple o doble a elección, en el primer lugar libre; queda elegido para moverlo
function agregarLineal(modeloId: string, doble: boolean, cuerpos?: number) {
  const mo = p.modelos.find((m) => m.id === modeloId);
  if (!mo) return;
  const base = rackDeModelo(mo, { pallets: p.pallets, cajas: p.cajas, cuerpos: cuerpos ?? (mo.tipo === 'DI' ? 4 : 6), grua: p.bodega.grua });
  const lineal = mo.tipo === 'DI' ? {} : { doble, dobleLineal: doble, rot: doble ? 0 : 180 };
  // Cae a un pasillo de grua de lo que ya hay, para que se pueda cargar sin moverlo
  let r = lugarLibre(normalizar({ ...base, id: nuevoId(), ...lineal }), p.racks, p.bodega, mo.tipo === 'AR' ? DISTANCIAS.pasilloAR.valor : grua.value.pasillo);
  // Un cuerpo suelto (para armar desde ahí), en la esquina de arriba a la izquierda si está libre: el simple con
  // la espalda al muro; el doble y el drive-in dejando el pasillo de la grúa entre su frente y el muro
  if (cuerpos === 1) {
    const c = caja(contorno(p.bodega));
    let pegado: any;
    if (!doble && mo.tipo !== 'DI') {
      const esquina = { x: c.x0 + 0.2, y: c.y0 + 0.2 };
      pegado = { ...linealArrastrado({ ...base, ...lineal }, esquina, esquina, p.bodega, p.racks), id: r.id };
    } else {
      const n0 = normalizar({ ...base, ...lineal, rot: 0, id: r.id }), q = rectangulo(n0);
      pegado = { ...n0, x: +(c.x0 + DISTANCIAS.rackMuro.valor + q.ancho / 2).toFixed(3), y: +(c.y0 + pasilloRequerido(n0, p.bodega) + 0.01 + q.alto / 2).toFixed(3) };
    }
    if (!conflictos([...p.racks, pegado], p.bodega).has(pegado.id)) r = pegado;
  }
  const antes = porPoner.value;
  p.racks = [...p.racks, r];
  sel.value = r.id; elementoSel.value = null;
  avisoDescuento(`Agregaste un ${mo.tipo === 'DI' ? 'bloque' : doble ? 'lineal doble' : 'lineal simple'}`, antes);
  marcar('rack_add', { tipo: mo.tipo === 'DI' ? 'bloque' : doble ? 'lineal_doble' : 'lineal_simple' });
}
// "Agregaste un lineal simple: +48 posiciones. Te faltan 104" (lo que pidió se va descontando)
function avisoDescuento(que: string, antes: number) {
  const u = demanda.value.unidadPos, d = antes - porPoner.value, ahora = porPoner.value;
  const cambio = d > 0 ? `descuenta ${n(d)} ${u}` : d < 0 ? `suma ${n(-d)} ${u} por poner` : 'tu demanda ya estaba cubierta';
  avisoFaltan.value = `${que}: ${cambio}. ${ahora > 0 ? `Te faltan ${n(ahora)} ${u}.` : '✓ Ya cumples con lo que pediste.'}`;
}
// Pasar un lineal a simple o doble: la espalda queda en su lugar; demanda y accesorios se recalculan solos
function cambiarDoble(r: any, doble: boolean) {
  const antes = porPoner.value;
  racksPlano.value = racksPlano.value.map((x) => (x.id === r.id ? conDoble(x, doble) : x));
  avisoDescuento(`Pasaste el lineal a ${doble ? 'doble' : 'simple'}`, antes);
  marcar('rack_doble', { doble });
}
// Conflicto: se elige el primer rack en rojo para que el cliente lo mueva
function verConflicto() {
  const id = [...malos.value][0];
  if (id) { sel.value = id; elementoSel.value = null; }
}
// ─── Atajos opcionales (el cliente los pide; nada se ubica solo) ───
// "Llenar mi bodega" rehace el layout nuevo: si el cliente ya puso racks, se le pregunta antes
const faltan = ref<Record<string, number>>({});
const confirmarLlenar = ref(false);
const modulos = computed(() => Object.fromEntries(p.modelos.map((m) => [m.id, resultados.value[m.id].modulos])));
let reveladoTimer: ReturnType<typeof setTimeout> | null = null;
function llenar() {
  if (racksNuevos.value) confirmarLlenar.value = true;
  else ubicar(true);
}
function ubicar(manual: boolean) {
  const exist = p.racks.filter((r) => r.existente);
  const r = ubicarModelos(p.bodega, p.modelos, modulos.value, { pallets: p.pallets, cajas: p.cajas, nuevoId, existentes: exist });
  faltan.value = r.faltan;
  sel.value = null;
  if (reveladoTimer) clearTimeout(reveladoTimer);
  // Los racks aparecen de a uno y el contador sube (sin animar si se pide menos movimiento)
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!manual || quieto || r.racks.length < 2) {
    p.racks = [...exist, ...r.racks];
  } else {
    p.racks = [...exist];
    const paso = Math.max(60, Math.min(220, 1600 / r.racks.length));
    const poner = (i: number) => {
      p.racks = [...exist, ...r.racks.slice(0, i)];
      if (i < r.racks.length) reveladoTimer = setTimeout(() => poner(i + 1), paso);
    };
    poner(1);
  }
  avisoFaltan.value = '';
  if (manual) marcar('rack_add', { tipo: 'llenar', racks: r.racks.length });
}
// Solo los racks en rojo se sacan y se vuelven a poner donde quepan; lo demás no se mueve
function reubicarConflictos() {
  const fuera = new Set([...malos.value].filter((id) => !p.racks.find((r: any) => r.id === id)?.existente));
  if (!fuera.size) return;
  if (sel.value && fuera.has(sel.value)) sel.value = null;
  p.racks = p.racks.filter((r: any) => !fuera.has(r.id));
  ubicarLosQueFaltan();
  marcar('rack_add', { tipo: 'conflictos', racks: fuera.size });
}
// Alarga filas o agrega nuevas solo por lo que falta, sin mover lo que el cliente acomodó
function ubicarLosQueFaltan() {
  const r = ubicarFaltantes(p.bodega, p.modelos, p.racks.filter((x: any) => !x.existente), { pallets: p.pallets, cajas: p.cajas, nuevoId }) as { racks: any[]; alargados: any[]; faltan: Record<string, number> };
  const largos = new Map((r.alargados ?? []).map((x: any) => [x.id, x]));
  p.racks = [...p.racks.map((x: any) => largos.get(x.id) ?? x), ...r.racks];
  faltan.value = r.faltan ?? {};
  const sin = Object.values(r.faltan ?? {}).reduce((t: number, v: any) => t + v, 0);
  const partes = [largos.size && `alargamos ${largos.size} ${largos.size === 1 ? 'fila' : 'filas'}`, r.racks.length && `agregamos ${r.racks.length} ${r.racks.length === 1 ? 'fila nueva' : 'filas nuevas'}`].filter(Boolean);
  avisoFaltan.value = partes.length
    ? `Listo: ${partes.join(' y ')}. Nada de lo que acomodaste se movió de lugar.${sin ? ' No cupo todo: libera espacio o agranda la bodega.' : ''}`
    : 'No hay espacio libre para lo que falta: acorta un pasillo, mueve un rack o agranda la bodega.';
  marcar('rack_add', { tipo: 'faltantes', racks: r.racks.length });
}
// Largo de una fila y partirla en dos: el cliente arma su layout; la barra de demanda dice si sigue cubriendo
function largoFila(r: any, n: number) {
  racksPlano.value = racksPlano.value.map((x) => (x.id === r.id ? dentroDeBodega(conCuerpos(x, n), p.bodega) : x));
}
function partir(r: any) {
  const [a, b] = partirRack(r, nuevoId) as any[];
  racksPlano.value = [...racksPlano.value.filter((x) => x.id !== r.id), dentroDeBodega(a, p.bodega), lugarLibre(b, [...racksPlano.value.filter((x) => x.id !== r.id), a], p.bodega)];
  sel.value = b.id;
}

function agregarElemento(clase: string) {
  if (trazado.value) terminarTrazado();
  const def = (ELEMENTOS as any)[clase], c = caja(contorno(p.bodega)), k = p.bodega.elementos.length;
  let el: any;
  if (clase === 'pasilloGrua' || clase === 'pasilloPeatonal') {
    // A lo ancho de la bodega, al medio, con el ancho de tu equipo (o 1,2 m el peatonal)
    const ancho = clase === 'pasilloGrua' ? grua.value.pasillo : def.ancho;
    el = { id: nuevoId(), clase, x: +((c.x0 + c.x1) / 2).toFixed(2), y: +((c.y0 + c.y1) / 2 + (k % 3) * 2).toFixed(2), ancho: +(c.x1 - c.x0 - 0.2).toFixed(2), alto: ancho };
  } else if (clase === 'porton' || clase === 'anden') {
    // En el muro de abajo, separados de los que ya hay
    const ya = p.bodega.elementos.filter((e: any) => e.clase === clase).length;
    // Andén: vano de la puerta y rampa niveladora hacia adentro; delante, la franja de maniobra (maniobraDe:
    // el pasillo de la grúa, sin guardar un número fijo). Portón: en el muro, sube (cortina) por defecto
    const ancho = clase === 'porton' ? ACCESOS.anchoPorton.valor : ACCESOS.anchoAnden.valor, fondo = clase === 'porton' ? 0.3 : ACCESOS.niveladorAnden.valor;
    el = { id: nuevoId(), clase, muro: 'abajo', ...enMuro(p.bodega, { muro: 'abajo', dist: 1 + ya * (ancho + 1), ancho, fondo }), ...(clase === 'porton' ? { altoPorton: 4, abre: 'cortina', hacia: 'adentro' } : { altoAnden: 1.2 }) };
  } else {
    const x = +((c.x0 + c.x1) / 2 + (k % 4) * 1.5).toFixed(1);
    const y = +((c.y0 + c.y1) / 2 + (k % 3) * 1.5).toFixed(1);
    el = { id: nuevoId(), clase, x, y, ancho: def.ancho, alto: def.alto };
  }
  p.bodega.elementos = [...p.bodega.elementos, el];
  sincronizarManiobras();
  elementoSel.value = el.id;
  sel.value = null;
  vista.value = '2d';
  marcar('elemento_add', { clase });
}
function duplicarElemento(e: any) {
  const c = { ...e, id: nuevoId(), x: +(e.x + (e.ancho >= e.alto ? 0 : e.ancho + 1)).toFixed(2), y: +(e.y + (e.ancho >= e.alto ? e.alto + 1 : 0)).toFixed(2) };
  p.bodega.elementos = [...p.bodega.elementos, c];
  sincronizarManiobras();
  elementoSel.value = c.id;
}
// Porton o anden: muro, distancia a la esquina, ancho a lo largo del muro y fondo
function ponerEnMuro(e: any, cambio: Record<string, any>) {
  const actual = muroDe(p.bodega, e);
  const datos = { ...actual, ...cambio };
  cambiarElemento({ muro: datos.muro, ...enMuro(p.bodega, datos) } as any, e.id);
}
// Andenes en serie: N iguales en el mismo muro, separados `sep` m
function andenesEnSerie(e: any, n: number, sep = 1) {
  const m = muroDe(p.bodega, e);
  const otros = p.bodega.elementos.filter((x: any) => x.clase !== 'anden' || x.id === e.id);
  const serie = Array.from({ length: Math.max(1, Math.min(12, n)) }, (_, i) => (i === 0 ? { ...e } : { ...e, id: nuevoId(), ...enMuro(p.bodega, { ...m, dist: m.dist + i * (m.ancho + sep) }) }));
  p.bodega.elementos = [...otros.filter((x: any) => x.id !== e.id), ...serie];
  sincronizarManiobras();
}
// ─── Pasillo peatonal por tramos: tocar o arrastrar; cada tramo es recto (horizontal o vertical) ───
function empezarTrazado() {
  trazado.value = { grupo: nuevoId(), puntos: [], ids: [], ancho: 1.2 };
  agregandoCruce.value = false;
  elementoSel.value = null; sel.value = null; vista.value = '2d';
  marcar('pasillo_dibujar', { accion: 'empezar' });
}
function puntoTrazo(q: Pto) {
  const t = trazado.value;
  if (t && !t.puntos.length) t.puntos = [q];
}
// Elemento de un tramo a → b (alargado medio ancho en sus puntas para que las esquinas queden cerradas)
function elementoTramo(a: Pto, b: Pto, w: number, grupo: string) {
  const horizontal = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  const largo = Math.abs(horizontal ? b.x - a.x : b.y - a.y);
  return horizontal
    ? { id: nuevoId(), clase: 'pasilloPeatonal', grupo, x: +((a.x + b.x) / 2).toFixed(3), y: +a.y.toFixed(3), ancho: +(largo + w).toFixed(2), alto: w }
    : { id: nuevoId(), clase: 'pasilloPeatonal', grupo, x: +a.x.toFixed(3), y: +((a.y + b.y) / 2).toFixed(3), ancho: w, alto: +(largo + w).toFixed(2) };
}
function tramoTrazo(a: Pto, b: Pto) {
  const t = trazado.value;
  if (!t) return;
  if (!t.puntos.length) t.puntos = [a];
  const desde = t.puntos[t.puntos.length - 1];
  const horizontal = Math.abs(b.x - desde.x) >= Math.abs(b.y - desde.y);
  const fin = horizontal ? { x: b.x, y: desde.y } : { x: desde.x, y: b.y };
  if (Math.hypot(fin.x - desde.x, fin.y - desde.y) < 0.5) return;
  const el = elementoTramo(desde, fin, t.ancho, t.grupo);
  p.bodega.elementos = [...p.bodega.elementos, el];
  t.puntos = [...t.puntos, fin];
  t.ids = [...t.ids, el.id];
}
function deshacerTramo() {
  const t = trazado.value;
  if (!t) return;
  const id = t.ids[t.ids.length - 1];
  if (id) p.bodega.elementos = p.bodega.elementos.filter((e: any) => e.id !== id);
  t.ids = t.ids.slice(0, -1);
  t.puntos = t.ids.length ? t.puntos.slice(0, -1) : [];
}
const largoTrazado = computed(() => (trazado.value?.puntos ?? []).slice(1).reduce((s2, q, i, arr) => { const a = trazado.value!.puntos[i]; return s2 + Math.hypot(q.x - a.x, q.y - a.y); }, 0));
function terminarTrazado() {
  const t = trazado.value;
  trazado.value = null;
  if (t?.ids.length) {
    marcar('pasillo_dibujar', { accion: 'listo', tramos: t.ids.length });
  }
}
// Esc termina; Ctrl+Z o Retroceso deshace el último tramo (fuera de los campos de texto)
function teclaTrazado(e: KeyboardEvent) {
  if (!trazado.value) return;
  const enCampo = (e.target as HTMLElement)?.closest?.('input, textarea, select');
  if (e.key === 'Escape') { e.preventDefault(); terminarTrazado(); }
  else if (!enCampo && ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'Backspace')) { e.preventDefault(); deshacerTramo(); }
}
onMounted(() => window.addEventListener('keydown', teclaTrazado));
onBeforeUnmount(() => window.removeEventListener('keydown', teclaTrazado));
// Pasillo de varios tramos en un toque (plantillas)
function agregarTramos(puntos: Pto[], nombre: string) {
  if (trazado.value) terminarTrazado();
  const w = 1.2, grupo = nuevoId();
  const nuevos = puntos.slice(1).map((b, i) => ({ a: puntos[i], b })).filter(({ a, b }) => Math.hypot(b.x - a.x, b.y - a.y) >= 0.5).map(({ a, b }) => elementoTramo(a, b, w, grupo));
  if (!nuevos.length) return;
  trazado.value = null;
  p.bodega.elementos = [...p.bodega.elementos, ...nuevos];
  elementoSel.value = nuevos[nuevos.length - 1].id; sel.value = null; vista.value = '2d';
  marcar('pasillo_plantilla', { plantilla: nombre });
}
// Junto al muro: por dentro del muro de la oficina (o del portón; si no, el de abajo), de punta a punta
function peatonalJuntoAlMuro() {
  const c = caja(contorno(p.bodega)), w = 1.2, els = p.bodega.elementos as any[];
  const ref = els.find((e) => e.clase === 'oficina') ?? els.find((e) => e.clase === 'porton' || e.clase === 'anden');
  let muro = 'abajo';
  if (ref) {
    const d = { arriba: ref.y - c.y0, abajo: c.y1 - ref.y, izquierda: ref.x - c.x0, derecha: c.x1 - ref.x };
    muro = Object.entries(d).sort((a, b) => a[1] - b[1])[0][0];
  }
  const m = w / 2 + 0.05;
  const pts = muro === 'abajo' ? [{ x: c.x0 + m, y: c.y1 - m }, { x: c.x1 - m, y: c.y1 - m }]
    : muro === 'arriba' ? [{ x: c.x0 + m, y: c.y0 + m }, { x: c.x1 - m, y: c.y0 + m }]
      : muro === 'izquierda' ? [{ x: c.x0 + m, y: c.y0 + m }, { x: c.x0 + m, y: c.y1 - m }]
        : [{ x: c.x1 - m, y: c.y0 + m }, { x: c.x1 - m, y: c.y1 - m }];
  agregarTramos(pts.map((q) => ({ x: +q.x.toFixed(2), y: +q.y.toFixed(2) })), 'muro');
}
const portonYOficina = computed(() => p.bodega.elementos.some((e: any) => e.clase === 'porton' || e.clase === 'anden') && p.bodega.elementos.some((e: any) => e.clase === 'oficina'));
// Del portón a la puerta de la oficina, en L: primero hacia adentro de la bodega y después derecho
function peatonalPortonOficina() {
  const els = p.bodega.elementos as any[], w = 1.2;
  const po = els.find((e) => e.clase === 'porton') ?? els.find((e) => e.clase === 'anden'), of = els.find((e) => e.clase === 'oficina');
  if (!po || !of) return;
  const muro = muroDe(p.bodega, po).muro as string;
  const adentro = { abajo: { x: 0, y: -1 }, arriba: { x: 0, y: 1 }, izquierda: { x: 1, y: 0 }, derecha: { x: -1, y: 0 } }[muro] ?? { x: 0, y: -1 };
  const fondoPo = Math.min(po.ancho, po.alto);
  const a = { x: po.x + adentro.x * (fondoPo / 2 + w / 2), y: po.y + adentro.y * (fondoPo / 2 + w / 2) };
  // Lado de la oficina más cercano, con el pasillo pegado por fuera
  const q = rectElemento(of), x1 = q.x0 + q.ancho, y1 = q.y0 + q.alto;
  const lados = [
    { x: of.x, y: y1 + w / 2 }, { x: of.x, y: q.y0 - w / 2 }, { x: q.x0 - w / 2, y: of.y }, { x: x1 + w / 2, y: of.y },
  ];
  const b = lados.sort((u, v) => (Math.abs(u.x - a.x) + Math.abs(u.y - a.y)) - (Math.abs(v.x - a.x) + Math.abs(v.y - a.y)))[0];
  const esquina = adentro.y !== 0 ? { x: a.x, y: b.y } : { x: b.x, y: a.y };
  agregarTramos([a, esquina, b].map((r) => ({ x: +r.x.toFixed(2), y: +r.y.toFixed(2) })), 'porton_oficina');
}
// ─── Grúas: se arrastran desde la paleta al plano (o un toque la pone en un pasillo de carga) ───
const fantasmaGrua = ref<{ x: number; y: number; ancho: number; alto: number; radio: number } | null>(null);
let arrastreGrua: { puntero: number; x: number; y: number; movio: boolean } | null = null;
const huellaGrua = () => { const d = dimensiones(p.bodega.grua); return { ancho: d.ancho, alto: d.largo, radio: radioGiro(p.bodega.grua) }; };
function tomarGrua(e: PointerEvent) {
  if (e.button !== 0) return;
  (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  arrastreGrua = { puntero: e.pointerId, x: e.clientX, y: e.clientY, movio: false };
}
function moverGrua(e: PointerEvent) {
  const a = arrastreGrua;
  if (!a || e.pointerId !== a.puntero) return;
  if (Math.hypot(e.clientX - a.x, e.clientY - a.y) > 6) a.movio = true;
  if (!a.movio) return;
  const q = plano.value?.aPlanoCliente(e.clientX, e.clientY);
  fantasmaGrua.value = q ? { ...huellaGrua(), x: q.x, y: q.y } : null;
}
function soltarGrua(e: PointerEvent) {
  const a = arrastreGrua;
  arrastreGrua = null;
  if (!a || e.pointerId !== a.puntero) return;
  const f = fantasmaGrua.value;
  fantasmaGrua.value = null;
  if (!a.movio) ponerGrua();
  else if (f) ponerGrua({ x: f.x, y: f.y });
}
function cancelarGrua() { arrastreGrua = null; fantasmaGrua.value = null; }
function ponerGrua(en?: Pto) {
  if (trazado.value) terminarTrazado();
  const c = caja(contorno(p.bodega)), h = huellaGrua();
  let q = en;
  if (!q) {
    // Un toque: al medio del primer pasillo de carga al que llega (o al centro de la bodega)
    const ru = recorridos.value?.rutas?.find((x: any) => x.llega && x.franja);
    q = ru ? { x: (ru.franja.x0 + ru.franja.x1) / 2, y: (ru.franja.y0 + ru.franja.y1) / 2 } : { x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2 };
    const ya = p.bodega.elementos.filter((e: any) => e.clase === 'grua').length;
    q = { x: q.x + ya * (h.ancho + 0.6), y: q.y };
  }
  const x = +Math.min(c.x1 - h.ancho / 2, Math.max(c.x0 + h.ancho / 2, q.x)).toFixed(2);
  const y = +Math.min(c.y1 - h.alto / 2, Math.max(c.y0 + h.alto / 2, q.y)).toFixed(2);
  const el = { id: nuevoId(), clase: 'grua', x, y, ancho: h.ancho, alto: h.alto, modelo: p.bodega.grua };
  p.bodega.elementos = [...p.bodega.elementos, el];
  elementoSel.value = el.id; sel.value = null; vista.value = '2d';
  marcar('elemento_add', { clase: 'grua', modo: en ? 'arrastrar' : 'toque' });
}
// Girar 90°: se intercambian largo y ancho (la grúa y los pasillos)
function girarElemento(id: string) {
  const e = p.bodega.elementos.find((x: any) => x.id === id);
  if (e) cambiarElemento({ ancho: e.alto, alto: e.ancho }, id);
}
function cruce(id: string, pos: number) {
  const e = p.bodega.elementos.find((x: any) => x.id === id);
  if (!e) return;
  cambiarElemento({ aberturas: [...(e.aberturas ?? []), pos].sort((a: number, b: number) => a - b) } as any, id);
  agregandoCruce.value = false;
}
// Arrastrar un elemento: un pasillo de varios tramos (mismo grupo) se mueve entero, sin abrir sus esquinas,
// y nada sale de la bodega (se frena en el muro)
// Tocar la franja de maniobra (o la hoja de un portón) elige su portón o andén
function elegirElemento(id: string | null) {
  const e = id ? p.bodega.elementos.find((q: any) => q.id === id) : null;
  elementoSel.value = e?.padre ?? id;
  if (id) sel.value = null;
}
function moverElemento(id: string, x: number, y: number) {
  const e = p.bodega.elementos.find((q: any) => q.id === id);
  if (!e || e.padre) return;
  // Pilares de una grilla: se mueven todos juntos, salvo que el cliente elija "Solo este"
  const enGrupo = e.grupo && (e.clase !== 'pilar' || moverPilares.value === 'todos');
  const juntos = new Set(p.bodega.elementos.filter((q: any) => q.id === id || (enGrupo && q.grupo === e.grupo)).map((q: any) => q.id));
  const rs = p.bodega.elementos.filter((q: any) => juntos.has(q.id)).map((q: any) => rectElemento(q));
  const u = { x0: Math.min(...rs.map((r) => r.x0)), y0: Math.min(...rs.map((r) => r.y0)), x1: Math.max(...rs.map((r) => r.x0 + r.ancho)), y1: Math.max(...rs.map((r) => r.y0 + r.alto)) };
  const c = caja(contorno(p.bodega));
  const dx = Math.min(Math.max(x - e.x, c.x0 - u.x0), c.x1 - u.x1), dy = Math.min(Math.max(y - e.y, c.y0 - u.y0), c.y1 - u.y1);
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return;
  p.bodega.elementos = p.bodega.elementos.map((q: any) => (juntos.has(q.id) ? { ...q, x: +(q.x + dx).toFixed(3), y: +(q.y + dy).toFixed(3) } : q));
  sincronizarManiobras();
}
function cambiarElemento(cambio: Record<string, any>, id = elementoSel.value) {
  p.bodega.elementos = p.bodega.elementos.map((e: any) => (e.id === id ? { ...e, ...cambio } : e));
  sincronizarManiobras();
}
function quitarElemento(id: string) {
  p.bodega.elementos = p.bodega.elementos.filter((e: any) => e.id !== id && e.padre !== id);
  if (elementoSel.value === id) elementoSel.value = null;
}
// Pilares N × M equidistantes: distancia entre ejes X/Y, centrados (mismo margen a cada muro)
const vistaPilares = computed(() => (gp.pasoX >= 2 && gp.pasoY >= 2 ? (grillaPilaresXY(p.bodega, { pasoX: gp.pasoX, pasoY: gp.pasoY }) as any[]) : []));
const nxm = computed(() => {
  const xs = new Set(vistaPilares.value.map((q: any) => q.x)), ys = new Set(vistaPilares.value.map((q: any) => q.y));
  return `${xs.size} × ${ys.size}`;
});
function grillaPilares() {
  const c = caja(contorno(p.bodega)), t = TAMANOS_PILAR.find((x) => x.v === gp.tamano) ?? TAMANOS_PILAR[1], grupo = `pilares-${nuevoId()}`;
  const pilares = vistaPilares.value
    .map((q: any) => ({ id: nuevoId(), clase: 'pilar', grupo, x: q.x, y: q.y, ancho: t.s, alto: t.s, forma: t.forma, tamano: t.v }))
    .filter((q) => q.x > c.x0 + 0.3 && q.x < c.x1 - 0.3 && q.y > c.y0 + 0.3 && q.y < c.y1 - 0.3);
  p.bodega.elementos = [...p.bodega.elementos.filter((e: any) => e.clase !== 'pilar'), ...pilares];
  // "No lo sé": queda como dato a confirmar por el ejecutivo
  p.flags = gp.tamano === 'nose' ? [...new Set([...p.flags, 'no_se:pilares'])] : p.flags.filter((f) => f !== 'no_se:pilares');
  formPilares.value = false;
  moverPilares.value = 'todos';
  elementoSel.value = pilares[0]?.id ?? null; sel.value = null;
  vista.value = '2d';
  marcar('elemento_add', { clase: 'pilar', cantidad: pilares.length, tamano: gp.tamano });
  // En el celular el plano queda arriba del formulario: se lleva la vista a los pilares recién puestos
  if (window.innerWidth < 1024) nextTick(() => (plano.value as any)?.$el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' }));
}
// Tamaño de un pilar (o de toda su grilla si se mueven juntos)
function tamanoPilar(e: any, v: string) {
  const t = TAMANOS_PILAR.find((x) => x.v === v);
  if (!t) return;
  const todos = moverPilares.value === 'todos' && e.grupo;
  p.bodega.elementos = p.bodega.elementos.map((q: any) => (q.id === e.id || (todos && q.grupo === e.grupo) ? { ...q, ancho: t.s, alto: t.s, forma: t.forma, tamano: t.v } : q));
  p.flags = v === 'nose' ? [...new Set([...p.flags, 'no_se:pilares'])] : p.flags.filter((f) => f !== 'no_se:pilares');
}
function quitarPilares() {
  p.bodega.elementos = p.bodega.elementos.filter((e: any) => e.clase !== 'pilar');
  p.flags = p.flags.filter((f) => f !== 'no_se:pilares');
  if (elementoSel.value && !p.bodega.elementos.some((e: any) => e.id === elementoSel.value)) elementoSel.value = null;
}
// La franja de maniobra depende del pasillo de la grúa: se rehace si cambia el equipo
watch(() => p.bodega.grua, () => sincronizarManiobras(), { immediate: true });
function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>
