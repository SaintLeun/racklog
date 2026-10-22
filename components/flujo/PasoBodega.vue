<template>
  <div>
    <h1 class="fl-titulo">Tu bodega</h1>
    <p class="fl-bajada">Pon las medidas de tu bodega. Tus racks se ubican solos; después puedes moverlos.</p>

    <div class="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
      <div class="min-w-0 space-y-4">
        <!-- Controles en pestañas: en el celular el plano queda arriba y fijo, y esto debajo -->
        <!-- Pestañas en dos líneas si no caben (no se cortan ni se esconden en un scroll) -->
        <div class="flex flex-wrap gap-1 rounded-xl bg-neutral-100 p-1" role="tablist" aria-label="Datos de tu bodega">
          <button v-for="t in PESTANAS" :key="t.k" type="button" role="tab" :aria-selected="pestana === t.k" :class="['min-h-10 flex-auto whitespace-nowrap rounded-lg px-2.5 text-sm font-semibold', pestana === t.k ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="pestana = t.k">{{ t.t }}</button>
        </div>
        <!-- Medidas -->
        <section v-show="pestana === 'medidas'" class="fl-card">
          <p class="fl-leyenda">Medidas</p>
          <!-- Forma de la planta: rectángulo, L, T o libre (esquinas que se arrastran en el plano) -->
          <div class="mt-3 grid grid-cols-4 gap-1 rounded-lg bg-neutral-100 p-1" role="radiogroup" aria-label="Forma de la bodega">
            <button v-for="f in FORMAS" :key="f.v" type="button" role="radio" :aria-checked="formaActual === f.v" :title="f.t" :class="['flex h-12 flex-col items-center justify-center gap-0.5 rounded-md text-xs font-semibold', formaActual === f.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="ponerForma(f.v)">
              <svg viewBox="0 0 20 20" class="h-4 w-4" aria-hidden="true"><path :d="f.d" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg>
              {{ f.t }}
            </button>
          </div>
          <!-- Dibujo libre: cada toque en el plano es una esquina y los muros salen rectos; también se escriben con su medida -->
          <div v-if="dibujo" class="mt-3 rounded-xl bg-orange-50 p-3 ring-1 ring-orange-200">
            <p class="text-sm text-neutral-800">Toca cada esquina de tu bodega en el plano, siguiendo sus muros. Para cerrar, toca el primer punto o "Terminar".</p>
            <ol v-if="murosDibujo.length" class="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-sm text-neutral-700">
              <li v-for="m in murosDibujo" :key="m.i"><span class="font-semibold text-neutral-900">{{ m.letra }}</span> {{ m.flecha }} {{ formatoM(m.largo) }} m</li>
            </ol>
            <form class="mt-3" @submit.prevent="agregarMuro">
              <p class="text-sm font-medium text-neutral-800">{{ dibujo.length ? 'Siguiente muro' : 'Primer muro' }}, con su medida</p>
              <div class="mt-1.5 flex gap-1" role="radiogroup" aria-label="Hacia dónde va el muro">
                <button v-for="d in DIRECCIONES.filter((d) => diagonales || d.recto)" :key="d.v" type="button" role="radio" :aria-checked="muroNuevo.dir === d.v" :aria-label="d.t" :title="d.t" :class="['fl-chip !min-h-10 !min-w-10 !px-0 !text-base', muroNuevo.dir === d.v && 'fl-chip--sel']" @click="muroNuevo.dir = d.v">{{ d.f }}</button>
              </div>
              <div class="mt-2 flex gap-2">
                <label class="relative flex-1"><span class="sr-only">Largo del muro (m)</span><input v-model.number="muroNuevo.largo" type="number" min="0.5" max="300" step="0.1" inputmode="decimal" placeholder="Largo, ej. 24,5" class="form-input !pr-8"><i class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm not-italic text-neutral-500">m</i></label>
                <button type="submit" class="fl-btn !min-h-11 !px-4 !text-sm" :disabled="!(Number(muroNuevo.largo) > 0)">Agregar</button>
              </div>
            </form>
            <label class="mt-3 flex items-center gap-2 text-sm text-neutral-700"><input v-model="diagonales" type="checkbox" class="h-4 w-4 accent-brand-600">Mi bodega tiene muros en diagonal</label>
            <div class="mt-3 grid grid-cols-3 gap-1.5">
              <button type="button" class="fl-btn-sec !min-h-10 !px-2 !text-sm" :disabled="!dibujo.length" @click="dibujo.pop()">Deshacer</button>
              <button type="button" class="fl-btn-sec !min-h-10 !px-2 !text-sm" @click="dibujo = null">Cancelar</button>
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
            <p class="mt-2 text-xs text-neutral-500">Al alargar un muro, el muro que le sigue se corre entero; se acorta o alarga el que viene después.</p>
            <button type="button" class="mt-2 text-sm font-semibold text-brand-700 underline" @click="empezarDibujo">Dibujar de nuevo</button>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-3">
            <label class="fl-campo"><span>{{ dibujo ? 'Área de dibujo: ancho (m)' : p.bodega.forma ? 'Ancho total (m)' : 'Ancho (m)' }}</span><input :value="fm2(cajaBodega.x1 - cajaBodega.x0)" type="number" min="4" max="200" step="0.5" inputmode="decimal" class="form-input" @change="medida('ancho', $event)"></label>
            <label class="fl-campo"><span>{{ dibujo ? 'Área de dibujo: largo (m)' : p.bodega.forma ? 'Largo total (m)' : 'Largo (m)' }}</span><input :value="fm2(cajaBodega.y1 - cajaBodega.y0)" type="number" min="4" max="200" step="0.5" inputmode="decimal" class="form-input" @change="medida('largo', $event)"></label>
          </div>
          <p class="mt-3 text-sm text-neutral-500">Altura: {{ p.flags.includes('no_se:altura') ? `no la sabes (usamos ${fm(p.bodega.altura || 8)} m)` : p.bodega.altura ? `${fm(p.bodega.altura)} m` : 'sin dato' }} · {{ grua.nombre }}: pasillo de {{ fm(grua.pasillo) }} m entre racks</p>
        </section>

        <!-- Pasillos, zonas y grúas: en "Dibuja en el plano", junto al plano (se arrastran y se dibujan ahí) -->

        <!-- Portones, andenes y oficina: los racks se ubican cerca de los accesos -->
        <section v-show="pestana === 'accesos'" class="fl-card">
          <p class="fl-leyenda">Portones y andenes</p>
          <p class="mt-1 text-sm text-neutral-600">Ubicamos tus racks cerca de por donde entra y sale la carga, con una zona libre para maniobrar.</p>
          <div class="mt-3 grid grid-cols-3 gap-2">
            <button v-for="cl in (['porton', 'anden', 'oficina'] as const)" :key="cl" type="button" class="fl-chip !min-h-11 !text-sm" @click="agregarElemento(cl)">+ {{ ELEMENTOS[cl].nombre }}</button>
          </div>
        </section>
        <!-- Pilares en grilla N × M -->
        <section v-show="pestana === 'pilares'" class="fl-card">
          <form @submit.prevent="grillaPilares">
            <p class="fl-leyenda">Pilares de la bodega</p>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <label class="fl-campo"><span class="!text-sm">Cada cuántos metros, a lo ancho</span><input v-model.number="gp.pasoX" type="number" min="2" step="any" class="form-input"></label>
              <label class="fl-campo"><span class="!text-sm">Cada cuántos metros, a lo largo</span><input v-model.number="gp.pasoY" type="number" min="2" step="any" class="form-input"></label>
              <label class="fl-campo"><span class="!text-sm">Primer pilar, desde el muro izquierdo (m)</span><input v-model.number="gp.offX" type="number" min="0" step="any" class="form-input"></label>
              <label class="fl-campo"><span class="!text-sm">Primer pilar, desde el muro de arriba (m)</span><input v-model.number="gp.offY" type="number" min="0" step="any" class="form-input"></label>
              <label class="fl-campo"><span class="!text-sm">Tamaño del pilar (cm)</span><input v-model.number="gp.seccion" type="number" min="10" max="150" step="any" class="form-input"></label>
              <div class="fl-campo col-span-2"><span class="!text-sm">¿Cómo es el pilar?</span>
                <div class="grid grid-cols-3 gap-1">
                  <button v-for="f in FORMAS_PILAR" :key="f.v" type="button" :class="['fl-chip !min-h-16 !flex-col !gap-1 !px-1 !text-xs', gp.forma === f.v && 'fl-chip--sel']" :aria-pressed="gp.forma === f.v" @click="gp.forma = f.v">
                    <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
                      <rect v-if="f.v === 'cuadrado'" x="5" y="5" width="14" height="14" fill="#94a3b8" stroke="#475569" />
                      <circle v-else-if="f.v === 'circular'" cx="12" cy="12" r="7.5" fill="#94a3b8" stroke="#475569" />
                      <path v-else d="M5 5h14v3h-5.5v8H19v3H5v-3h5.5V8H5z" fill="#64748b" />
                    </svg>
                    {{ f.t }}
                  </button>
                </div>
              </div>
            </div>
            <button type="submit" class="fl-btn-sec mt-3 w-full" :disabled="!vistaPilares.length">Poner {{ vistaPilares.length }} pilares</button>
          </form>
          <button v-if="hayPilares" type="button" class="mt-2 text-sm text-red-700 underline underline-offset-2" @click="quitarPilares">Quitar pilares</button>
        </section>

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
        <section :class="['fl-card', cob.productos.some((x) => !x.ok) || cob.modelos.some((x) => x.diferencia < 0) ? 'ring-2 ring-amber-300' : '']">
          <div class="flex items-center justify-between gap-2">
            <p class="fl-leyenda">Tus racks en la bodega</p>
          </div>
          <button type="button" class="fl-btn mt-3 w-full" @click="ubicar(true)">Llenar mi bodega</button>
          <p class="mt-1.5 text-xs text-neutral-500">Ubica de nuevo todos tus racks en el espacio libre (lo que ya tienes no se mueve).</p>
          <!-- Cobertura contra los pallets del paso 2: por modelo (cuerpos que faltan o sobran) y por producto -->
          <ul class="mt-4 space-y-3">
            <li v-for="m in cob.modelos" :key="m.id" class="text-neutral-800">
              <p class="flex flex-wrap justify-between gap-x-3">
                <span class="font-medium">{{ m.ubicados }} {{ m.tipo === 'DI' ? 'calles de drive-in' : m.tipo === 'AR' ? 'cuerpos de ángulo ranurado' : 'cuerpos de selectivo' }}
                  <FlujoInfo>{{ m.tipo === 'DI' ? 'Calle: el pasillo interno de un drive-in donde entra la grúa.' : 'Cuerpo: el espacio entre dos marcos, con todos sus niveles.' }}</FlujoInfo></span>
                <span class="tabular-nums font-semibold">{{ n(m.posiciones) }} {{ m.unidad }}</span>
              </p>
              <p :class="['mt-0.5 text-sm', m.diferencia < 0 ? 'text-amber-800' : m.diferencia > 0 ? 'text-sky-800' : 'text-green-800']">
                Con {{ m.tipo === 'DI' ? 'estas calles' : 'estos cuerpos' }} cubres {{ n(Math.min(m.posiciones, m.necesita)) }} de tus {{ n(m.necesita) }} {{ m.tipo === 'AR' ? 'bandejas' : 'pallets' }}
                — {{ m.diferencia < 0 ? `te faltan ${-m.diferencia} ${m.unidadCuerpo}` : m.diferencia > 0 ? `te sobran ${m.diferencia} ${m.unidadCuerpo} (espacio para crecer)` : 'justo lo que necesitas ✓' }}
              </p>
            </li>
          </ul>
          <div v-if="cob.productos.length" class="mt-3 border-t border-neutral-100 pt-3">
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
            No cabe todo en tu bodega. Opciones: subir un nivel en el paso 3, usar un rack doble o agrandar las medidas.
          </p>
        </section>
      </div>

      <!-- Plano 2D o vista 3D -->
      <div class="fl-card sticky top-[8.75rem] z-20 order-first self-start !p-0 overflow-hidden shadow-md lg:top-36 lg:order-none lg:shadow-none">
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-neutral-100 px-3 py-2 lg:px-4 lg:py-3">
          <div class="flex gap-1 rounded-lg bg-neutral-100 p-1" role="tablist" aria-label="Vista">
            <button v-for="v in (['2d', '3d'] as const)" :key="v" type="button" role="tab" :aria-selected="vista === v" :class="['rounded-md px-3 py-1.5 text-sm font-semibold lg:px-4 lg:py-2', vista === v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="vista = v">{{ v === '2d' ? 'Plano 2D' : 'Vista 3D' }}</button>
          </div>
          <div v-if="p.racksHoy.length" class="flex gap-1 rounded-lg bg-neutral-100 p-1" role="group" aria-label="Qué layout ves">
            <button v-for="e in [{ v: 'propuesta', t: 'Propuesta' }, { v: 'hoy', t: 'Hoy' }]" :key="e.v" type="button" :aria-pressed="escenario === e.v" :class="['rounded-md px-3 py-1.5 text-sm font-semibold', escenario === e.v ? (e.v === 'hoy' ? 'bg-slate-700 text-white' : 'bg-white text-brand-800 shadow-sm') : 'text-neutral-600']" @click="escenario = e.v as any">{{ e.t }}</button>
          </div>
          <span v-if="enHoy" class="text-sm text-neutral-600">Hoy: <b class="text-lg text-neutral-900">{{ n(comparacion.hoy.posiciones) }}</b> posiciones</span>
          <span v-else-if="hoy.posiciones" class="text-sm text-neutral-600">Hoy <b class="text-neutral-900">{{ n(hoy.posiciones) }}</b> · Nuevo <b class="text-neutral-900"><FlujoContador :valor="total.pallets" /></b> · Total <b class="text-lg text-neutral-900">{{ n(hoy.posiciones + total.pallets) }}</b> posiciones</span>
          <span v-else class="text-sm text-neutral-600"><b class="text-neutral-900">{{ racksNuevos }}</b> {{ racksNuevos === 1 ? 'rack' : 'racks' }} · <b class="text-lg text-neutral-900"><FlujoContador :valor="total.pallets" /></b> posiciones{{ total.bandejas ? ` · ${n(total.bandejas)} bandejas` : '' }}</span>
        </div>
        <!-- Demanda contra lo que hay en el plano: siempre a la vista mientras el cliente mueve, acorta o parte filas -->
        <div v-if="!enHoy && demanda.necesita" :class="['flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b px-3 py-1.5 text-sm lg:px-4', demanda.faltan ? 'border-amber-100 bg-amber-50 text-amber-950' : 'border-green-100 bg-green-50 text-green-900']" role="status">
          <span>
            Tu demanda: <b>{{ n(demanda.necesita) }} {{ demanda.unidad }}</b> → <b>{{ n(demanda.necesarios) }} {{ demanda.unidadCuerpo }}</b> ·
            en el plano: <b>{{ n(demanda.ubicados) }} {{ demanda.unidadCuerpo }}</b>, {{ n(demanda.posiciones) }} {{ demanda.unidadPos }}
            <template v-if="demanda.faltan"> — <b>faltan {{ demanda.faltan }} {{ demanda.faltan === 1 ? demanda.unidadCuerpo.replace(/s$/, '') : demanda.unidadCuerpo }}</b></template>
            <template v-else> ✓ cubre tu demanda</template>
          </span>
          <button v-if="demanda.faltan" type="button" class="rounded-lg bg-amber-600 px-3 py-1 text-sm font-semibold text-white hover:bg-amber-700" @click="ubicarLosQueFaltan">Ubicar los que faltan</button>
        </div>
        <p v-if="avisoFaltan" class="border-b border-neutral-100 bg-white px-3 py-1.5 text-sm text-neutral-700 lg:px-4" role="status">{{ avisoFaltan }}</p>
        <!-- Espacio libre dicho como beneficio -->
        <p v-if="libre" class="border-b border-green-100 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-900 lg:px-4">Te quedan {{ n(libre) }} m² libres para crecer.</p>
        <div class="flex flex-col lg:min-h-[500px] lg:flex-row">
          <div class="min-w-0 flex-1">
        <div v-show="vista === '2d'">
          <div class="relative h-[44svh] lg:h-[max(440px,calc(100svh-19rem))]">
          <!-- Con zoom: un toque vuelve a toda la bodega (también vuelve sola al soltar la selección) -->
          <button v-if="(plano as any)?.zoom > 1" type="button" class="absolute right-3 top-3 z-10 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/10 hover:bg-white" @click="plano?.restablecerVista()">Ajustar a la bodega</button>
          <PlanificadorPlano2D
            :bodega="p.bodega" :racks="racksPlano" :seleccion="sel" :conflictos="malos" :ocultar-accesorios="!verAccesorios" :fantasmas="fantasmas" :colores="coloresModelos" :etiquetas="letrasModelos" ref="plano" :editar-contorno="!!p.bodega.forma" :muro-sel="muroSel"
            @mover-vertice="moverVertice" @fin-cambio="finForma" @seleccionar-muro="muroSel = $event; sel = null; elementoSel = null"
            :pasillos="listaPasillos" :marcas="enHoy ? [] : marcas" :elemento-sel="elementoSel"
            :trazando="!!trazado" :agregando-cruce="agregandoCruce" :trazo-peatonal="trazado ? { puntos: trazado.puntos, ancho: trazado.ancho } : null"
            :recorridos="verRecorrido && !enHoy ? recorridos : null" :sugerencias-tunel="verRecorrido && !enHoy ? sugerencias : []" :fantasma-grua="fantasmaGrua"
            @tramo-trazo="tramoTrazo" @terminar-trazo="terminarTrazado" @aplicar-tunel="aplicarSugerencia" @girar-elemento="girarElemento"
            :dibujando="!!dibujo" :puntos-dibujo="dibujo ?? []" :solo-rectos="!diagonales"
            @agregar-punto="(q: any) => { dibujo?.push(q); avisoDibujo = ''; }" @cerrar-contorno="terminarDibujo"
            class="p-3"
            @seleccionar="sel = $event; if ($event) elementoSel = null"
            @mover="mover" @girar="girar" @eliminar="eliminar"
            @seleccionar-elemento="elementoSel = $event; if ($event) sel = null"
            @mover-elemento="(id: string, x: number, y: number) => cambiarElemento({ x, y }, id)"
            @eliminar-elemento="quitarElemento"
            @cambiar-elemento="(id: string, c: any) => cambiarElemento(c, id)"
            @punto-trazo="puntoTrazo" @cruce-elemento="cruce"
          />
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
          <!-- Túnel sugerido por el recorrido de la grúa -->
          <div v-else-if="sugerencias.length && verRecorrido && !enHoy && !sel && !elementoSel" class="absolute inset-x-2 bottom-2 z-10 flex flex-wrap items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-sm shadow-lg ring-1 ring-sky-200 lg:inset-x-auto lg:left-3 lg:max-w-md" role="status">
            <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white" aria-hidden="true">T</span>
            <span class="min-w-0 flex-1 text-neutral-800"><b>Pon un túnel aquí:</b> {{ textoSugerencia(sugerencias[0]) }}</span>
            <button type="button" class="min-h-9 rounded-lg bg-sky-600 px-3 text-sm font-semibold text-white hover:bg-sky-700" @click="aplicarSugerencia(sugerencias[0])">Poner túnel</button>
            <button v-if="enLinea.length > 1" type="button" class="min-h-9 rounded-lg px-2 text-sm font-semibold text-sky-800 underline underline-offset-2" @click="aplicarEnLinea">En las {{ enLinea.length }} filas</button>
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
            <li class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm bg-teal-200" />Pasillo de carga</li>
            <li class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm bg-amber-200" />Pasillo de grúa</li>
            <li class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm bg-green-200" />Peatonal</li>
            <li class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm bg-red-200" />Zona que no se usa</li>
            <li class="flex items-center gap-1.5"><span class="h-2.5 w-4 rounded-sm border border-sky-600 bg-sky-100" />Cuerpo túnel</li>
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
          <!-- Herramientas del plano: dibujar pasillos peatonales, poner grúas (se arrastran al plano), plantillas
               y el recorrido de la grúa. En el celular, una fila bajo el plano -->
          <div v-if="vista === '2d' && !enHoy && !(rackSel || elementoActual || muroActual)" class="flex-shrink-0 border-t border-neutral-100 lg:w-[280px] lg:border-l lg:border-t-0">
            <div class="px-3 py-2.5 lg:p-4">
              <p class="fl-leyenda hidden lg:block">Dibuja en el plano</p>
              <p class="mt-1 hidden text-sm text-neutral-600 lg:block">Los pasillos entre racks se ponen solos. Agrega lo que ya tienes marcado.</p>
              <div class="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 lg:mx-0 lg:mt-3 lg:grid lg:grid-cols-2 lg:gap-2 lg:overflow-visible lg:px-0">
                <button type="button" :aria-pressed="!!trazado" :class="['fl-chip !min-h-11 !w-auto flex-shrink-0 whitespace-nowrap lg:!w-full lg:whitespace-normal !text-sm', trazado && 'fl-chip--sel']" @click="trazado ? terminarTrazado() : empezarTrazado()">
                  <svg viewBox="0 0 16 16" class="mr-1.5 h-4 w-4 flex-shrink-0" aria-hidden="true"><path d="M3 13V5h10" fill="none" stroke="#16a34a" stroke-width="3" stroke-linejoin="round" /></svg>{{ trazado ? 'Terminar' : 'Peatonal' }}
                </button>
                <button
                  type="button" class="fl-chip !min-h-11 !w-auto flex-shrink-0 whitespace-nowrap lg:!w-full lg:whitespace-normal cursor-grab !text-sm" style="touch-action: none" title="Arrástrala al plano o tócala"
                  @pointerdown="tomarGrua" @pointermove="moverGrua" @pointerup="soltarGrua" @pointercancel="cancelarGrua" @click="($event as MouseEvent).detail === 0 && ponerGrua()"
                >
                  <svg viewBox="0 0 16 16" class="mr-1.5 h-4 w-4 flex-shrink-0" aria-hidden="true"><rect x="4" y="6" width="8" height="9" rx="1" fill="#fbbf24" stroke="#a16207" /><path d="M6 1v5M10 1v5" stroke="#a16207" stroke-width="1.5" /></svg>Grúa
                </button>
                <button type="button" class="fl-chip !min-h-11 !w-auto flex-shrink-0 whitespace-nowrap lg:!w-full lg:whitespace-normal !text-sm" @click="agregarElemento('pasilloGrua')"><span class="mr-1.5 h-3 w-3 flex-shrink-0 rounded-sm bg-amber-300" aria-hidden="true" />Pasillo de grúa</button>
                <button type="button" class="fl-chip !min-h-11 !w-auto flex-shrink-0 whitespace-nowrap lg:!w-full lg:whitespace-normal !text-sm" @click="agregarElemento('zona')"><span class="mr-1.5 h-3 w-3 flex-shrink-0 rounded-sm bg-red-300" aria-hidden="true" />Zona sin uso</button>
                <!-- En el celular, las plantillas y el recorrido van en la misma fila -->
                <button type="button" class="fl-chip !min-h-11 !w-auto flex-shrink-0 whitespace-nowrap lg:!w-full lg:whitespace-normal !text-sm lg:!hidden" @click="peatonalJuntoAlMuro">Peatonal junto al muro</button>
                <button type="button" class="fl-chip !min-h-11 !w-auto flex-shrink-0 whitespace-nowrap lg:!w-full lg:whitespace-normal !text-sm lg:!hidden" :disabled="!portonYOficina" @click="peatonalPortonOficina">Portón → oficina</button>
              </div>
              <p class="mt-2 hidden text-xs text-neutral-500 lg:block">Arrastra la grúa al plano (o tócala) y gírala con la flecha.</p>
              <div class="hidden lg:block">
                <p class="fl-leyenda mt-4">Plantillas de un toque</p>
                <div class="mt-2 grid gap-2">
                  <button type="button" class="fl-chip !min-h-10 !justify-start !text-sm" @click="peatonalJuntoAlMuro">Peatonal junto al muro</button>
                  <button type="button" class="fl-chip !min-h-10 !justify-start !text-sm" :disabled="!portonYOficina" @click="peatonalPortonOficina">Peatonal entre portón y oficina</button>
                </div>
                <p v-if="!portonYOficina" class="mt-1 text-xs text-neutral-500">Para la segunda, agrega un portón y una oficina en "Portones y andenes".</p>
                <p class="fl-leyenda mt-4">Recorrido de la grúa</p>
                <label class="mt-2 flex items-center gap-2 text-sm text-neutral-700"><input v-model="verRecorrido" type="checkbox" class="h-4 w-4 accent-brand-600">Ver por dónde anda la grúa</label>
                <p v-if="verRecorrido && recorridos?.rutas?.length" :class="['mt-1.5 text-sm', rutasSinLlegar ? 'text-red-700' : 'text-neutral-600']">
                  {{ rutasSinLlegar ? `La grúa no llega a ${rutasSinLlegar} de ${recorridos.rutas.length} pasillos (en rojo).` : (recorridos.rutas.length === 1 ? 'Llega a tu pasillo de carga.' : `Llega a tus ${recorridos.rutas.length} pasillos de carga.`) }}
                </p>
                <ul v-if="verRecorrido && sugerencias.length" class="mt-2 space-y-2">
                  <li v-for="sg in sugerencias" :key="sg.rackId" class="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-950 ring-1 ring-sky-200">
                    <b>Pon un túnel aquí:</b> {{ textoSugerencia(sg) }}
                    <span class="block text-xs text-sky-800">Rack {{ numeroRack(sg.rackId) }}, cuerpo {{ sg.cuerpo + 1 }}, paso libre {{ fm(sg.altoLibre) }} m</span>
                    <span class="mt-1.5 flex flex-wrap items-center gap-2">
                      <button type="button" class="min-h-9 rounded-lg bg-sky-600 px-3 text-sm font-semibold text-white hover:bg-sky-700" @click="aplicarSugerencia(sg)">Poner túnel</button>
                      <button v-if="sg === sugerencias[0] && enLinea.length > 1" type="button" class="min-h-9 text-sm font-semibold text-sky-800 underline underline-offset-2" @click="aplicarEnLinea">En línea en las {{ enLinea.length }} filas</button>
                    </span>
                  </li>
                </ul>
                <label class="mt-4 flex items-start gap-2 text-sm text-neutral-700">
                  <input v-model="reacomodar" type="checkbox" class="mt-0.5 h-4 w-4 accent-brand-600">
                  <span>Volver a ubicar mis racks cuando cambio un pasillo</span>
                </label>
              </div>
            </div>
          </div>
          <!-- Panel de propiedades: fijo al borde derecho del plano (sin scroll) para el rack o elemento elegido -->
          <div v-if="rackSel || elementoActual || muroActual" class="relative flex-shrink-0 lg:w-[300px]">
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
                  <!-- Largo de la fila: acortarla o alargarla sin perder de vista la demanda (barra de arriba) -->
                  <p class="fl-panel__sec">Largo de la fila</p>
                  <div class="fl-prop"><span>{{ rackSel.tipo === 'DI' ? 'Calles' : rackSel.doble ? 'Cuerpos por lado' : 'Cuerpos' }}</span><FlujoNumero :valor="rackSel.cuerpos" :min="1" :max="50" etiqueta="cuerpos" @cambio="largoFila(rackSel, $event)" /></div>
                  <button v-if="rackSel.cuerpos >= 2" type="button" class="fl-chip mt-1 !min-h-9 !text-sm" @click="partir(rackSel)">Partir en dos tramos</button>
                </template>
                <!-- Cuerpo túnel de este rack (pisa el del modelo del paso 3) -->
                <template v-if="!enHoy && !rackSel.existente && rackSel.tipo === 'RS'">
                  <p class="fl-panel__sec">Cuerpo túnel</p>
                  <div class="grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1" role="group" aria-label="Cuerpo túnel">
                    <button v-for="op in [{ v: false, t: 'Sin túnel' }, { v: true, t: 'Con túnel' }]" :key="op.t" type="button" :aria-pressed="!!rackSel.tunel === op.v" :class="['h-9 rounded-md text-sm font-semibold', !!rackSel.tunel === op.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="ponerTunel(rackSel, op.v ? { cuerpo: Math.floor((rackSel.cuerpos - 1) / 2), altoLibre: altoTunelGrua(p.bodega.grua) } : null)">{{ op.t }}</button>
                  </div>
                  <template v-if="rackSel.tunel">
                    <div class="fl-prop mt-2"><span>Cuerpo (desde la izquierda)</span><FlujoNumero :valor="Math.min(rackSel.cuerpos, (rackSel.tunel.cuerpo ?? 0) + 1)" :min="1" :max="rackSel.cuerpos" etiqueta="cuerpo túnel" @cambio="ponerTunel(rackSel, { ...rackSel.tunel, cuerpo: $event - 1 })" /></div>
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
                <p class="fl-panel__sec">Repetir en bloque</p>
                <div class="fl-prop"><span>A lo largo</span><FlujoNumero :valor="bloque.largo" :min="1" :max="10" etiqueta="a lo largo" @cambio="bloque.largo = $event" /></div>
                <div class="fl-prop"><span>En profundidad</span><FlujoNumero :valor="bloque.profundidad" :min="1" :max="10" etiqueta="en profundidad" @cambio="bloque.profundidad = $event" /></div>
                <label v-if="!rackSel.doble && rackSel.tipo !== 'DI'" class="mt-2 flex items-center gap-2 text-sm text-neutral-700">
                  <input v-model="bloque.espalda" type="checkbox" class="h-4 w-4 accent-brand-600"> Filas espalda con espalda
                </label>
                <p class="mt-2 text-xs text-neutral-500">Entre filas queda el pasillo de tu equipo ({{ fm(grua.pasillo) }} m). Las copias se ven punteadas en el plano antes de agregarlas.</p>
                <p v-if="previaRacks.length" class="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700" role="status">
                  <b class="text-neutral-900">{{ previaRacks.filter((c) => c.ok).length }} {{ previaRacks.filter((c) => c.ok).length === 1 ? 'cabe' : 'caben' }}</b>
                  <template v-if="previaRacks.some((c) => !c.ok)"> · <span class="text-red-700">{{ previaRacks.filter((c) => !c.ok).length }} no {{ previaRacks.filter((c) => !c.ok).length === 1 ? 'cabe' : 'caben' }}: {{ textoMotivos(previaRacks) }}</span> (en rojo en el plano)</template>
                </p>
                <button type="button" class="fl-btn mt-2 w-full !min-h-10 !text-sm" :disabled="!previaRacks.some((c) => c.ok)" @click="repetir(rackSel)">{{ previaRacks.some((c) => c.ok) ? `Agregar ${previaRacks.filter((c) => c.ok).length} ${previaRacks.filter((c) => c.ok).length === 1 ? 'rack' : 'racks'}` : bloque.largo * bloque.profundidad < 2 ? 'Elige cuántos repetir' : 'Ninguna copia cabe' }}</button>
                <p v-if="avisoBloque" class="mt-2 text-sm text-green-800" role="status">{{ avisoBloque }}</p>
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
                  <p v-if="elementoActual.clase === 'pasilloGrua' && anchoPasillo < grua.pasillo - 0.01" class="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">Tu {{ grua.nombre.toLowerCase() }} necesita ~{{ fm(grua.pasillo) }} m.</p>
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
                    <span v-if="reacomodar" class="block text-xs text-neutral-500">Tus racks se vuelven a ubicar alrededor de los pasillos nuevos.</span>
                  </p>
                  <button type="button" class="fl-btn mt-2 w-full !min-h-10 !text-sm" :disabled="!previaPas.some((c) => c.ok)" @click="agregarSerie">{{ previaPas.some((c) => c.ok) ? `Agregar ${previaPas.filter((c) => c.ok).length} ${previaPas.filter((c) => c.ok).length === 1 ? 'pasillo' : 'pasillos'}` : serie.cantidad < 2 ? 'Elige cuántos' : 'Ninguno cabe' }}</button>
                </template>
                <!-- Portón o andén: muro, distancia a la esquina, medidas y zona de maniobra -->
                <template v-if="elementoActual.clase === 'porton' || elementoActual.clase === 'anden'">
                  <p class="fl-panel__sec">Muro</p>
                  <div class="grid grid-cols-4 gap-1">
                    <button v-for="mu in MUROS" :key="mu.v" type="button" :class="['fl-chip !min-h-9 !px-1 !text-xs', muroDe(p.bodega, elementoActual).muro === mu.v && 'fl-chip--sel']" @click="ponerEnMuro(elementoActual, { muro: mu.v })">{{ mu.t }}</button>
                  </div>
                  <p class="fl-panel__sec">Medidas</p>
                  <label class="fl-prop"><span>Desde la esquina</span><span class="fl-prop__in"><input :value="muroDe(p.bodega, elementoActual).dist" type="number" min="0" step="0.1" @change="ponerEnMuro(elementoActual, { dist: Math.max(0, Number(($event.target as HTMLInputElement).value) || 0) })"><i>m</i></span></label>
                  <label class="fl-prop"><span>Ancho</span><span class="fl-prop__in"><input :value="muroDe(p.bodega, elementoActual).ancho" type="number" min="1" step="0.1" @change="ponerEnMuro(elementoActual, { ancho: num($event) })"><i>m</i></span></label>
                  <label v-if="elementoActual.clase === 'porton'" class="fl-prop"><span>Alto</span><span class="fl-prop__in"><input :value="elementoActual.altoPorton ?? 4" type="number" min="2" max="10" step="0.1" @change="cambiarElemento({ altoPorton: num($event) })"><i>m</i></span></label>
                  <template v-else>
                    <label class="fl-prop"><span>Fondo</span><span class="fl-prop__in"><input :value="muroDe(p.bodega, elementoActual).fondo" type="number" min="1" step="0.1" @change="ponerEnMuro(elementoActual, { fondo: num($event) })"><i>m</i></span></label>
                    <label class="fl-prop"><span>Alto del andén</span><span class="fl-prop__in"><input :value="elementoActual.altoAnden ?? 1.2" type="number" min="0.5" max="2" step="0.05" @change="cambiarElemento({ altoAnden: num($event) })"><i>m</i></span></label>
                  </template>
                  <label class="fl-prop"><span>Zona libre delante</span><span class="fl-prop__in"><input :value="elementoActual.maniobra ?? (elementoActual.clase === 'anden' ? 4 : 3)" type="number" min="0" max="20" step="0.5" @change="cambiarElemento({ maniobra: Math.max(0, Number(($event.target as HTMLInputElement).value) || 0) })"><i>m</i></span></label>
                  <div v-if="elementoActual.clase === 'anden'" class="fl-prop"><span>Andenes en serie</span><FlujoNumero :valor="p.bodega.elementos.filter((e: any) => e.clase === 'anden').length" :min="1" :max="12" etiqueta="andenes" @cambio="andenesEnSerie(elementoActual, $event)" /></div>
                </template>
                <!-- Pilar suelto: forma -->
                <template v-if="elementoActual.clase === 'pilar'">
                  <p class="fl-panel__sec">Forma</p>
                  <div class="grid grid-cols-3 gap-1">
                    <button v-for="f in (['cuadrado', 'circular', 'H'] as const)" :key="f" type="button" :class="['fl-chip !min-h-9 !text-sm', (elementoActual.forma ?? 'cuadrado') === f && 'fl-chip--sel']" @click="cambiarElemento({ forma: f })">{{ f === 'cuadrado' ? 'Cuadrado' : f === 'circular' ? 'Circular' : 'Perfil H' }}</button>
                  </div>
                </template>
                <template v-if="elementoActual.clase !== 'porton' && elementoActual.clase !== 'anden'">
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
                <button type="button" class="fl-panel__accion" @click="girar(rackSel.id)">Girar</button>
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
        <p v-if="malos.size" class="border-t border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-800" role="status">
          Hay racks superpuestos, sobre un pasillo, pilar o zona, o fuera de la bodega (en rojo). Muévelos o toca "Volver a ubicar".
        </p>
        <p v-else-if="angostos" class="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-900" role="status">
          Hay pasillos más angostos de lo que necesita tu equipo (en rojo). Lo revisamos en el paso siguiente.
        </p>
      </div>
    </div>

    <FlujoAcciones :deshabilitado="!p.racks.length" motivo="Ubica al menos un rack." texto="Revisar mi diseño" @atras="emit('atras')" @siguiente="emit('siguiente')" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import { useProyecto } from '~/stores/proyecto';
import {
  ELEMENTOS, conflictos, contorno, caja, normalizar, dentroDeBodega, grillaPilaresXY, lugarLibre, formatoM, NOMBRE,
  rectangulo, rectElemento, medidasRack, area as areaPoligono,
} from '~/lib/rack3d/planificador.js';
import { GRUAS } from '~/lib/rack3d/parametrosTecnicos.js';
import { pasillos, pasilloRequerido } from '~/lib/rack3d/pasillos.js';
import { huella } from '~/lib/rack3d/medidas.js';
import { conCuerpos, partirRack, ubicarFaltantes, resultadoModelo, rackDeModelo, conteoRack, ubicarModelos, repetirBloque, previaBloque, previaPasillos, textoMotivos, cobertura, conteoTotal, conManiobras, enMuro, muroDe } from '~/lib/flujo/calculos.js';
import { proponerAccesorios, aplicarAjustes } from '~/lib/rack3d/accesorios.js';
import { areaOcupada } from '~/lib/flujo/perfiles.js';
import { recorridosGrua, sugerirTuneles, tunelesAlineados, ALTOS_TUNEL, altoTunelGrua, tunelParaGrua, dimensiones, radioGiro } from '~/lib/rack3d/rutas.js';

const emit = defineEmits<{ siguiente: []; atras: [] }>();
const p = useProyecto();
const fm = formatoM;
const n = (v: number) => Math.round(v).toLocaleString('es-CL');
const num = (e: Event) => Math.max(0.2, Number((e.target as HTMLInputElement).value) || 0.2);
const nuevoId = () => Math.random().toString(36).slice(2, 9);

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
// Muro elegido en el plano (forma de la bodega): el panel derecho deja cambiar su largo y sus esquinas
const muroSel = ref<number | null>(null);
const faltan = ref<Record<string, number>>({});
const reacomodar = ref(true);
const gp = reactive({ pasoX: 6, pasoY: 6, offX: 6, offY: 6, seccion: 40, forma: 'cuadrado' as 'cuadrado' | 'circular' | 'H' });
// Trazado de un pasillo peatonal por tramos (arrastrar o tocar donde empieza y termina) y cruces con un clic
type Pto = { x: number; y: number };
const trazado = ref<{ grupo: string; puntos: Pto[]; ids: string[]; ancho: number } | null>(null);
const agregandoCruce = ref(false);
const FORMAS_PILAR = [{ v: 'cuadrado', t: 'Hormigón cuadrado' }, { v: 'circular', t: 'Hormigón redondo' }, { v: 'H', t: 'Perfil metálico' }] as const;
const MUROS = [{ v: 'abajo', t: 'Abajo' }, { v: 'arriba', t: 'Arriba' }, { v: 'izquierda', t: 'Izquierda' }, { v: 'derecha', t: 'Derecha' }];
const bloque = reactive({ largo: 1, profundidad: 1, espalda: false });
// Pasillos en serie (panel del pasillo elegido)
const serie = reactive({ cantidad: 1, separacion: 6 });
const PESTANAS = [{ k: 'medidas', t: 'Medidas' }, { k: 'pilares', t: 'Pilares' }, { k: 'accesos', t: 'Portones y andenes' }, { k: 'tengo', t: 'Lo que ya tengo' }, { k: 'hoy', t: 'Hoy vs propuesta' }] as const;
const pestana = ref<typeof PESTANAS[number]['k']>('medidas');
// Encuadre a lo diseñado: los racks con su pasillo (y los accesos). Se calcula al ubicar, no en cada arrastre
// El plano y el 3D muestran siempre toda la bodega; al soltar la selección el plano vuelve solo a encuadrarla
const plano = ref<{ restablecerVista(): void; aPlanoCliente(x: number, y: number): Pto | null } | null>(null);
watch(sel, (v) => { if (v) muroSel.value = null; });
watch(elementoSel, (v) => { if (v) muroSel.value = null; });
watch(() => !sel.value && !elementoSel.value && muroSel.value === null, (nada) => { if (nada) plano.value?.restablecerVista(); });
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
  const hoy = { posiciones: ch.posiciones + ch.bandejas, m2: areaOcupada(p.racksHoy, p.bodega) };
  const prop = { posiciones: cp.posiciones + cp.bandejas, m2: areaOcupada(p.racks, p.bodega) };
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
const resultados = computed(() => Object.fromEntries(p.modelos.map((m) => [m.id, resultadoModelo(m, { pallets: p.pallets, cajas: p.cajas, grua: p.bodega.grua })])));
const necesarios = computed(() => Object.fromEntries(p.modelos.map((m) => [m.id, resultados.value[m.id].cuerpos])));
const modulos = computed(() => Object.fromEntries(p.modelos.map((m) => [m.id, resultados.value[m.id].modulos])));
const ubicados = (id: string) => conteoTotal(p.racks.filter((r) => r.modelo === id && !r.existente)).cuerpos;
const posicionesDe = (id: string) => { const c = conteoTotal(p.racks.filter((r) => r.modelo === id && !r.existente)); return c.posiciones || c.bandejas; };
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
  ubicar(false);   // lo nuevo se ubica alrededor de lo que ya tiene
  sel.value = r.id; elementoSel.value = null;
  nuevoExistente.value = null;
  marcar('rack_add', { tipo: 'existente', sistema: e.tipo });
}
function marcarExistente(r: any, v: boolean) {
  p.racks = p.racks.map((x) => (x.id === r.id ? { ...x, existente: v } : x));
}
const malos = computed(() => conflictos(racksPlano.value, p.bodega) as Set<string>);
const listaPasillos = computed(() => pasillos(racksPlano.value, p.bodega) as any[]);
const angostos = computed(() => listaPasillos.value.some((x) => !x.ok));
const total = computed(() => { const c = conteoTotal(p.racks.filter((r) => !r.existente)); return { pallets: c.posiciones, bandejas: c.bandejas }; });
const rackSel = computed(() => racksPlano.value.find((r) => r.id === sel.value) ?? null);
const elementoActual = computed(() => p.bodega.elementos.find((e: any) => e.id === elementoSel.value) ?? null);
const hayPilares = computed(() => p.bodega.elementos.some((e: any) => e.clase === 'pilar'));
const marcas = computed(() => {
  const lista = aplicarAjustes(proponerAccesorios({ bodega: p.bodega, racks: p.racks, pallets: p.pallets }), p.accesorios) as any[];
  return lista.filter((a) => a.incluido).flatMap((a) => a.marcas ?? []);
});
// ─── Recorrido de la grúa (portón o andén → pasillos de carga) y dónde conviene un túnel ───
// Se calcula un rato después del último cambio (no en cada cuadro de un arrastre)
const verRecorrido = ref(true);
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

// ─── Forma de la bodega (rectángulo, L, T o libre) ───
const FORMAS = [
  { v: 'rect', t: 'Rectángulo', d: 'M3 4h14v12H3z' },
  { v: 'L', t: 'En L', d: 'M3 3h7v7h7v7H3z' },
  { v: 'T', t: 'En T', d: 'M2 3h16v6h-5v8H7V9H2z' },
  { v: 'libre', t: 'Libre', d: 'M3 5l6-2 8 3-1 10-9 1-4-5z' },
] as const;
const contornoActual = computed(() => contorno(p.bodega) as { x: number; y: number }[]);
const cajaBodega = computed(() => caja(contornoActual.value));
const fm2 = (v: number) => +(+v).toFixed(2);
const formaActual = computed(() => (dibujo.value ? 'libre' : p.bodega.forma ? (p.bodega.tipoForma ?? 'libre') : 'rect'));
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
  if (v === 'libre') { empezarDibujo(); return; }
  dibujo.value = null;
  if (v === 'rect') { p.bodega.forma = null; p.bodega.tipoForma = null; p.bodega.ancho = W; p.bodega.largo = L; ubicar(false); return; }
  const pts = v === 'L'
    ? [[0, 0], [0.55, 0], [0.55, 0.45], [1, 0.45], [1, 1], [0, 1]]
    : [[0, 0], [1, 0], [1, 0.4], [0.7, 0.4], [0.7, 1], [0.3, 1], [0.3, 0.4], [0, 0.4]];
  p.bodega.forma = pts.map(([x, y]) => ({ x: r05(c.x0 + x * W), y: r05(c.y0 + y * L) }));
  p.bodega.tipoForma = v;
  sel.value = null; elementoSel.value = null;
  ubicar(false);
  marcar('forma_bodega', { forma: v });
}
let formaTimer: ReturnType<typeof setTimeout> | null = null;
function moverVertice(i: number, q: { x: number; y: number }) {
  if (!p.bodega.forma) return;
  // Los muros que llegan a la esquina siguen rectos: si eran horizontales o verticales, la esquina vecina la acompaña
  const f = p.bodega.forma, n = f.length, o = f[i], ant = (i - 1 + n) % n, sig = (i + 1) % n;
  const acompanar = (v: { x: number; y: number }) =>
    Math.abs(v.y - o.y) < 1e-6 ? { x: v.x, y: q.y } : Math.abs(v.x - o.x) < 1e-6 ? { x: q.x, y: v.y } : v;
  p.bodega.forma = f.map((v, j) => (j === i ? { x: q.x, y: q.y } : n >= 4 && (j === ant || j === sig) ? acompanar(v) : v));
  // Al dejar de mover la esquina, los racks se vuelven a ubicar dentro de la forma nueva
  if (formaTimer) clearTimeout(formaTimer);
  formaTimer = setTimeout(finForma, 350);
}
// Al soltar una esquina: los racks se vuelven a ubicar dentro de la forma nueva
function finForma() {
  if (p.bodega.forma && reacomodar.value) ubicar(false);
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
  ubicar(false);
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
  ubicar(false);
}
// ─── Dibujo libre del contorno: esquina a esquina, muros rectos, o escritos con su largo y dirección ───
const dibujo = ref<{ x: number; y: number }[] | null>(null);
const diagonales = ref(false);
const avisoDibujo = ref('');
const muroNuevo = reactive<{ largo: number | null; dir: string }>({ largo: null, dir: 'e' });
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
  muroNuevo.largo = null; muroNuevo.dir = 'e';
  sel.value = null; elementoSel.value = null; muroSel.value = null; trazado.value = null;
  vista.value = '2d';
  marcar('forma_bodega', { forma: 'libre' });
}
function agregarMuro() {
  const L = Number(muroNuevo.largo), d = DIRECCIONES.find((x) => x.v === muroNuevo.dir)!;
  if (!dibujo.value || !(L > 0)) return;
  if (!dibujo.value.length) dibujo.value.push({ x: 0, y: 0 });
  const u = dibujo.value[dibujo.value.length - 1], k = Math.hypot(d.dx, d.dy);
  dibujo.value.push({ x: +(u.x + (L * d.dx) / k).toFixed(2), y: +(u.y + (L * d.dy) / k).toFixed(2) });
  // El siguiente muro gira a la derecha (sentido del reloj), lo más común al recorrer una bodega
  const giro = ['e', 's', 'o', 'n'];
  if (d.recto) muroNuevo.dir = giro[(giro.indexOf(d.v) + 1) % 4];
  muroNuevo.largo = null;
  avisoDibujo.value = '';
}
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
  ubicar(false);
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
  return `${r.cuerpos} ${u}${r.doble ? ' por lado' : ''} · ${n(c.posiciones || c.bandejas)} ${c.posiciones ? 'posiciones' : 'bandejas'}`;
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
  mover(r.id, eje === 'x' ? r.x + d : r.x, eje === 'y' ? r.y + d : r.y);
}

// ─── Elemento seleccionado ───
const largoEnX = computed(() => (elementoActual.value ? elementoActual.value.ancho >= elementoActual.value.alto : true));
const anchoPasillo = computed(() => (elementoActual.value ? Math.min(elementoActual.value.ancho, elementoActual.value.alto) : 0));
// Anchos que se ofrecen para un pasillo de grua: el minimo del equipo y un poco mas (nunca menos)
const anchosGrua = computed(() => [grua.value.pasillo, grua.value.pasillo + 0.5, grua.value.pasillo + 1].map((v) => +v.toFixed(2)));
const borde = computed(() => {
  const e = elementoActual.value, c = caja(contorno(p.bodega));
  return e ? { x: +(e.x - e.ancho / 2 - c.x0).toFixed(2), y: +(e.y - e.alto / 2 - c.y0).toFixed(2) } : { x: 0, y: 0 };
});
function anchoDePasillo(a: number) {
  const e = elementoActual.value;
  if (!e) return;
  cambiarElemento(e.ancho >= e.alto ? { alto: a } : { ancho: a });
}
function moverElementoA(eje: 'x' | 'y', ev: Event) {
  const e = elementoActual.value, c = caja(contorno(p.bodega));
  if (!e) return;
  const v = Math.max(0, Number((ev.target as HTMLInputElement).value) || 0);
  cambiarElemento(eje === 'x' ? { x: +(c.x0 + v + e.ancho / 2).toFixed(2) } : { y: +(c.y0 + v + e.alto / 2).toFixed(2) });
}

onMounted(() => {
  // Recien llegado o con modelos cambiados: se ubica solo
  const sinUbicar = p.modelos.some((m) => !p.racks.some((r) => r.modelo === m.id));
  if (!p.racks.length || sinUbicar) ubicar(false);
});

let reveladoTimer: ReturnType<typeof setTimeout> | null = null;
function ubicar(manual: boolean) {
  const existentes = p.racks.filter((r) => r.existente);
  const r = ubicarModelos(p.bodega, p.modelos, modulos.value, { pallets: p.pallets, cajas: p.cajas, nuevoId, existentes });
  // El túnel propio de un rack se conserva si el rack queda en el mismo lugar
  const conTunel = p.racks.filter((x) => !x.existente && x.tunelPropio);
  if (conTunel.length) {
    r.racks = r.racks.map((n: any) => {
      const v = conTunel.find((x) => x.modelo === n.modelo && x.rot === n.rot && x.cuerpos === n.cuerpos && Math.abs(x.x - n.x) < 0.01 && Math.abs(x.y - n.y) < 0.01);
      return v ? { ...n, tunelPropio: true, tunelRack: v.tunelRack ?? null, tunel: v.tunelRack ?? null } : n;
    });
  }
  faltan.value = r.faltan;
  sel.value = null;
  if (reveladoTimer) clearTimeout(reveladoTimer);
  // "Llenar mi bodega": los racks aparecen de a uno y el contador sube (sin animar si se pide menos movimiento)
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!manual || quieto || r.racks.length < 2) {
    p.racks = [...existentes, ...r.racks];
  } else {
    p.racks = [...existentes];
    const paso = Math.max(60, Math.min(220, 1600 / r.racks.length));
    const poner = (i: number) => {
      p.racks = [...existentes, ...r.racks.slice(0, i)];
      if (i < r.racks.length) reveladoTimer = setTimeout(() => poner(i + 1), paso);
    };
    poner(1);
  }
  if (manual) marcar('rack_add', { tipo: 'llenar', racks: r.racks.length });
}
// Al cambiar la circulacion (pasillos, zonas, pilares), los racks se reacomodan alrededor
const firmaCirculacion = computed(() => JSON.stringify(p.bodega.elementos.filter((e: any) => e.clase !== 'grua').map((e: any) => [e.clase, e.x, e.y, e.ancho, e.alto, e.maniobra])));
watch(firmaCirculacion, () => { if (reacomodar.value && !trazado.value) ubicar(false); });
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
  ubicar(false);
}
function mover(id: string, x: number, y: number) {
  racksPlano.value = racksPlano.value.map((r) => (r.id === id ? dentroDeBodega(normalizar({ ...r, x, y }), p.bodega) : r));
  alrededorDeExistente(id);
}
function girar(id: string) {
  racksPlano.value = racksPlano.value.map((r) => (r.id === id ? dentroDeBodega(normalizar({ ...r, rot: (r.rot + 90) % 360 }), p.bodega) : r));
  alrededorDeExistente(id);
}
// Al mover o girar lo que ya tiene, lo nuevo se vuelve a ubicar alrededor (al soltar, no en cada cuadro)
let reubicarTimer: ReturnType<typeof setTimeout> | null = null;
function alrededorDeExistente(id: string) {
  if (!reacomodar.value || !p.racks.find((r) => r.id === id)?.existente) return;
  if (reubicarTimer) clearTimeout(reubicarTimer);
  reubicarTimer = setTimeout(() => { const s = sel.value; ubicar(false); sel.value = s; }, 450);
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
  const res = repetirBloque(r, { ...bloque }, racksPlano.value, p.bodega, nuevoId) as { nuevos: any[]; omitidos: number; copias: any[] };
  racksPlano.value = [...racksPlano.value, ...res.nuevos];
  avisoBloque.value = `Se agregaron ${res.nuevos.length} ${res.nuevos.length === 1 ? 'rack' : 'racks'}${res.omitidos ? ` (${res.omitidos} no cabían: ${textoMotivos(res.copias)})` : ''}.`;
  marcar('rack_add', { tipo: 'bloque', largo: bloque.largo, profundidad: bloque.profundidad, nuevos: res.nuevos.length });
  bloque.largo = 1; bloque.profundidad = 1;
}
// ─── Vista previa en el plano: copias del bloque o de la serie de pasillos ───
const previaRacks = computed(() => (rackSel.value && bloque.largo * bloque.profundidad > 1 ? previaBloque(rackSel.value, { ...bloque }, racksPlano.value, p.bodega) as any[] : []));
const esPasillo = (e: any) => e && (e.clase === 'pasilloGrua' || e.clase === 'pasilloPeatonal');
const previaPas = computed(() => (esPasillo(elementoActual.value) && serie.cantidad > 1 ? previaPasillos(elementoActual.value, { ...serie }, p.bodega) as any[] : []));
const fantasmas = computed(() => [
  ...previaRacks.value.map((c) => ({ ...rectangulo(c.rack), ok: c.ok, motivo: c.motivo })),
  ...previaPas.value.map((c) => ({ ...rectElemento(c.el), ok: c.ok, motivo: c.motivo })),
]);
watch(elementoSel, () => { serie.cantidad = 1; });
watch(sel, () => { bloque.largo = 1; bloque.profundidad = 1; avisoBloque.value = ''; });
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
  return m.tipo === 'AR' ? `${quien} · ${m.niveles} repisas` : `${quien} · ${m.niveles} niveles + piso${res ? ` · ${res.porCuerpo} por ${m.tipo === 'DI' ? 'calle' : 'cuerpo'}` : ''}`;
}
// Lo que guarda un rack: por producto, según el nivel que le toca a cada uno
function contenidoRack(r: any) {
  const m = medidasRack(r), filas = m.doble ? 2 : 1, c = conteoRack(r);
  if (m.tipo === 'selectivo' && Array.isArray(r.mezcla) && r.mezcla.some(Boolean)) {
    const por = new Map<string, number>();
    // En el cuerpo túnel no hay pallets en las alturas bajo el paso libre
    const q = m.tunel?.quitadas ?? 0;
    r.mezcla.forEach((id: string | null, i: number) => { if (id) por.set(id, (por.get(id) ?? 0) + m.palletsPorViga * filas * (m.cuerpos - (i < q ? 1 : 0))); });
    return [...por].map(([id, k]) => `${nombrePallet(id)} ${n(k)}`).join(' · ') + ' posiciones';
  }
  return `${n(c.posiciones || c.bandejas)} ${c.posiciones ? 'posiciones' : 'bandejas'}`;
}
// Cambia la configuración de un rack: se rearma con ese modelo en su mismo lugar (no se reubica todo)
function asignarModelo(r: any, modeloId: string) {
  const mo = p.modelos.find((m) => m.id === modeloId);
  if (!mo || r.modelo === modeloId) return;
  const base = rackDeModelo(mo, { pallets: p.pallets, cajas: p.cajas, cuerpos: r.cuerpos, grua: p.bodega.grua });
  const propio = r.tunelPropio ? { tunelPropio: true, tunelRack: r.tunelRack ?? null, tunel: r.tunelRack ?? null } : {};
  const nuevo = dentroDeBodega(normalizar({ ...base, id: r.id, x: r.x, y: r.y, rot: r.rot, cuerpos: r.cuerpos, modelo: modeloId, ...propio }), p.bodega);
  p.racks = p.racks.map((x) => (x.id === r.id ? nuevo : x));
  marcar('rack_modelo', { modelos: p.modelos.length });
}
function irAlPaso3() {
  p.ir('rack');
}
const cob = computed(() => cobertura({ racks: p.racks, modelos: p.modelos, pallets: p.pallets, cajas: p.cajas, grua: p.bodega.grua }) as any);
// Demanda (pasos 1–3) contra lo ubicado, sumando todos los modelos: lo que dice la barra sobre el plano
const demanda = computed(() => {
  const ms = cob.value.modelos as any[];
  const soloAR = ms.length > 0 && ms.every((m) => m.tipo === 'AR');
  const soloDI = ms.length > 0 && ms.every((m) => m.tipo === 'DI');
  return {
    necesita: ms.reduce((t, m) => t + (m.necesita || 0), 0),
    posiciones: ms.reduce((t, m) => t + (m.posiciones || 0), 0),
    necesarios: ms.reduce((t, m) => t + (m.necesarios || 0), 0),
    ubicados: ms.reduce((t, m) => t + (m.ubicados || 0), 0),
    faltan: ms.reduce((t, m) => t + Math.max(0, -(m.diferencia || 0)), 0),
    unidad: soloAR ? 'bandejas' : 'pallets', unidadPos: soloAR ? 'bandejas' : 'posiciones', unidadCuerpo: soloDI ? 'calles' : 'cuerpos',
  };
});
const avisoFaltan = ref('');
function ubicarLosQueFaltan() {
  const r = ubicarFaltantes(p.bodega, p.modelos, p.racks.filter((x: any) => !x.existente), { pallets: p.pallets, cajas: p.cajas, nuevoId }) as { racks: any[]; alargados: any[]; faltan: Record<string, number> };
  const largos = new Map((r.alargados ?? []).map((x: any) => [x.id, x]));
  p.racks = [...p.racks.map((x: any) => largos.get(x.id) ?? x), ...r.racks];
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
    const ancho = clase === 'porton' ? 4 : 3.5, fondo = clase === 'porton' ? 0.6 : 4;
    el = { id: nuevoId(), clase, muro: 'abajo', ...enMuro(p.bodega, { muro: 'abajo', dist: 1 + ya * (ancho + 1), ancho, fondo }), maniobra: clase === 'anden' ? 4 : 3, ...(clase === 'porton' ? { altoPorton: 4 } : { altoAnden: 1.2 }) };
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
    if (reacomodar.value) ubicar(false);
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
function cambiarElemento(cambio: Record<string, any>, id = elementoSel.value) {
  p.bodega.elementos = p.bodega.elementos.map((e: any) => (e.id === id ? { ...e, ...cambio } : e));
  sincronizarManiobras();
}
function quitarElemento(id: string) {
  p.bodega.elementos = p.bodega.elementos.filter((e: any) => e.id !== id && e.padre !== id);
  if (elementoSel.value === id) elementoSel.value = null;
}
// Pilares N × M equidistantes: distancia entre ejes X/Y, primer eje a offX/offY del muro, seccion y forma
const vistaPilares = computed(() => (gp.pasoX >= 2 && gp.pasoY >= 2 ? (grillaPilaresXY(p.bodega, { pasoX: gp.pasoX, pasoY: gp.pasoY, offX: gp.offX, offY: gp.offY }) as any[]) : []));
const nxm = computed(() => {
  const xs = new Set(vistaPilares.value.map((q: any) => q.x)), ys = new Set(vistaPilares.value.map((q: any) => q.y));
  return `${xs.size} × ${ys.size}`;
});
function grillaPilares() {
  const c = caja(contorno(p.bodega)), s = Math.max(0.1, gp.seccion / 100);
  const pilares = vistaPilares.value
    .map((q: any) => ({ id: nuevoId(), clase: 'pilar', x: q.x, y: q.y, ancho: s, alto: s, forma: gp.forma }))
    .filter((q) => q.x > c.x0 + 0.3 && q.x < c.x1 - 0.3 && q.y > c.y0 + 0.3 && q.y < c.y1 - 0.3);
  p.bodega.elementos = [...p.bodega.elementos.filter((e: any) => e.clase !== 'pilar'), ...pilares];
}
function quitarPilares() {
  p.bodega.elementos = p.bodega.elementos.filter((e: any) => e.clase !== 'pilar');
}
function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>
