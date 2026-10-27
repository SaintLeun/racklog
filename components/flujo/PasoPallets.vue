<template>
  <div :class="!dosColumnas && 'mx-auto max-w-3xl'">
    <!-- Con un pallet armado en 3D usa todo el ancho (3D a la izquierda); si no, una columna legible -->
    <h1 class="fl-titulo">{{ conCajas ? 'Tus cajas' : 'Tus pallets' }}</h1>
    <p class="fl-bajada">
      {{ conCajas
        ? 'Cuéntanos qué cajas guardas en tus estantes. Si no sabes un dato, usa "No sé" y lo confirma tu ejecutivo.'
        : 'Agrega cada tipo de pallet que guardas. Si no sabes un dato, usa "No sé" y lo confirma tu ejecutivo.' }}
    </p>

    <!-- Pallets -->
    <TransitionGroup v-if="!conCajas" tag="div" name="fl-lista" class="mt-4 space-y-4">
      <article v-for="(t, i) in p.pallets" :id="`pallet-${t.id}`" :key="t.id" :class="['fl-card', t.ejemplo && 'fl-ejemplo', t.desdeCaja && t.caja && 'fl-pallet-dos']" @input.capture="t.ejemplo = false" @change.capture="t.ejemplo = false">
        <p v-if="t.ejemplo" class="fl-ancho -mx-1 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
          <span>Llenamos este pallet con un <b>ejemplo</b>. Cámbialo por tus medidas, o usa "No sé" donde no sepas.</span>
          <button type="button" class="font-semibold underline underline-offset-2" @click="t.ejemplo = false">Son mis datos</button>
        </p>
        <div class="fl-ancho flex items-center gap-3">
          <span class="h-4 w-4 flex-shrink-0 rounded" :style="{ background: t.color }" aria-hidden="true" />
          <input v-model.trim="t.nombre" class="fl-input-titulo" :aria-label="`Nombre del pallet ${i + 1}`">
          <button v-if="p.pallets.length > 1" type="button" class="fl-quitar" :aria-label="`Quitar ${t.nombre}`" @click="p.pallets.splice(i, 1)">Quitar</button>
        </div>
        <!-- Pallet en 3D grande, arriba: se ve sin scroll en el celular y cambia con cada dato -->
        <div v-if="t.desdeCaja && t.caja" class="fl-pallet-3d mt-3">
          <div class="aspect-square w-full sm:aspect-[16/10] lg:aspect-square">
            <FlujoPallet3D
              :frente="t.frente" :fondo="t.fondo" :caja="t.caja" :etiqueta="`Pallet de ${t.nombre} armado con sus cajas`"
              :alto="t.alto" :cols="armado(t)?.cols ?? 0" :filas="armado(t)?.filas ?? 0" :camas="armado(t)?.camas ?? 0" :largo-en-frente="armado(t)?.largoEnFrente ?? true"
            />
          </div>
          <!-- Resultado en una linea: cuantas por cama, camas, total, alto y peso -->
          <div v-if="armado(t) && !errCajaTxt(t)" class="fl-resumen mt-3" aria-live="polite">
            <p class="text-[17px] font-semibold text-neutral-900">
              {{ armado(t)!.cols * armado(t)!.filas }} por cama × {{ armado(t)!.camas }} {{ armado(t)!.camas === 1 ? 'cama' : 'camas' }} = {{ n(armado(t)!.cajas) }} cajas
            </p>
            <p class="mt-0.5 text-neutral-700">
              <b class="font-semibold">{{ fm(armado(t)!.alto) }} m</b> de alto · <b class="font-semibold">{{ n(armado(t)!.peso) }} kg</b> con la tarima
            </p>
            <p class="mt-1 text-sm text-neutral-500">
              {{ armado(t)!.cols }} al frente × {{ armado(t)!.filas }} al fondo.
              {{ armado(t)!.limite === 'apilable' ? `Llega a ${armado(t)!.camas} camas porque la caja aguanta ${t.caja.apilable} apiladas.` : 'Llega hasta 1,8 m de alto, el máximo para un pallet.' }}
            </p>
          </div>
          <p v-else class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{{ errCajaTxt(t) || 'Esa caja no cabe en el pallet: revisa sus medidas.' }}</p>
        </div>

        <!-- 1. El pallet: frente (lo que se ve desde el pasillo) y fondo (lo que entra al rack), con las medidas de siempre -->
        <section class="mt-5">
          <h3 class="fl-paso-t"><span class="fl-num">1</span>¿De qué medida es tu pallet?</h3>
          <div class="mt-2 grid items-start gap-4" :class="!t.desdeCaja && 'sm:grid-cols-[1fr_220px]'">
            <div>
              <div class="grid grid-cols-2 gap-2">
                <div v-for="lado in (['frente', 'fondo'] as const)" :key="lado" class="fl-campo">
                  <span class="!text-sm">{{ lado === 'frente' ? 'Frente' : 'Fondo' }}
                    <FlujoInfo>{{ lado === 'frente' ? 'El lado que ves desde el pasillo: por ahí entran las horquillas de la grúa.' : 'Lo que el pallet entra hacia adentro del rack. Define el fondo del marco.' }}</FlujoInfo>
                  </span>
                  <select :value="otraMedida(t, lado) ? 'otra' : t[lado]" class="form-input" :class="err(t)[lado] && 'fl-error'" :aria-label="`${lado === 'frente' ? 'Frente' : 'Fondo'} del pallet`" @change="elegirMedida(t, lado, $event)">
                    <option v-for="m in LADOS" :key="m" :value="m">{{ fm1(m) }} m</option>
                    <option value="otra">Otra medida</option>
                  </select>
                  <span v-if="otraMedida(t, lado)" class="flex items-center gap-2">
                    <input :value="borrador[`${t.id}-${lado}`] ?? String(t[lado] || '').replace('.', ',')" type="text" inputmode="decimal" maxlength="5" class="form-input" :class="err(t)[lado] && 'fl-error'" :aria-label="`${lado === 'frente' ? 'Frente' : 'Fondo'} del pallet en metros`" @input="escribirMedida(t, lado, $event)">
                    <span class="text-sm text-neutral-500">m</span>
                  </span>
                  <small v-if="err(t)[lado]" class="fl-msg">{{ err(t)[lado] }}</small>
                </div>
              </div>
              <p v-if="nombrePallet(t)" class="mt-2 text-sm text-neutral-600">{{ nombrePallet(t) }}</p>
            </div>
            <!-- Con el pallet en 3D arriba, la planta sobra (el 3D tiene la vista desde arriba) -->
            <div v-if="!t.desdeCaja" class="flex justify-center"><FlujoPalletPlanta :frente="t.frente" :fondo="t.fondo" /></div>
          </div>
        </section>

        <!-- 2. Como viene cargado: con cajas iguales (se arma en 3D y salen el alto y el peso) o ya sabe el alto y el peso -->
        <section class="mt-5">
          <h3 class="fl-paso-t"><span class="fl-num">2</span>¿Qué lleva encima?</h3>
          <div class="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Cómo definir la carga">
            <button type="button" :class="['fl-chip !min-h-14 !flex-col !gap-0 !text-sm', t.desdeCaja && 'fl-chip--sel']" :aria-pressed="!!t.desdeCaja" @click="usarCajas(t)">
              Cajas iguales<span class="text-xs font-normal opacity-80">te calculamos alto y peso</span>
            </button>
            <button type="button" :class="['fl-chip !min-h-14 !flex-col !gap-0 !text-sm', !t.desdeCaja && 'fl-chip--sel']" :aria-pressed="!t.desdeCaja" @click="t.desdeCaja = false">
              Otra carga<span class="text-xs font-normal opacity-80">ya sé el alto y el peso</span>
            </button>
          </div>
        </section>

        <template v-if="t.desdeCaja && t.caja">
          <!-- 3. La caja, en milimetros (como viene en la ficha del producto), con su tope -->
          <section class="mt-5">
            <h3 class="fl-paso-t"><span class="fl-num">3</span>¿Cuánto mide cada caja?</h3>
            <div class="mt-2 grid grid-cols-3 gap-2">
              <label v-for="d in DIM_CAJA" :key="d.k" class="fl-campo">
                <span class="!text-sm">{{ d.t }} (mm)</span>
                <input :value="mm(t.caja[d.k])" type="text" inputmode="numeric" maxlength="4" class="form-input" :class="errCaja(t)[d.k] && 'fl-error'" @input="ponerMm(t, d.k, $event)">
              </label>
            </div>
            <small v-if="errCaja(t).largo || errCaja(t).ancho || errCaja(t).alto" class="fl-msg mt-1 block" role="alert">{{ errCaja(t).largo || errCaja(t).ancho || errCaja(t).alto }}</small>
            <p v-else class="mt-1 text-xs text-neutral-500">En este pallet cabe una caja de hasta {{ n(Math.max(t.frente, t.fondo) * 1000) }} × {{ n(Math.min(t.frente, t.fondo) * 1000) }} mm y {{ n(ALTO_CARGA * 1000) }} mm de alto.</p>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <label class="fl-campo">
                <span class="!text-sm">Kg por caja</span>
                <input v-model.number="t.caja.peso" type="number" min="0.1" max="1000" step="0.5" inputmode="decimal" class="form-input" :class="errCaja(t).peso && 'fl-error'">
              </label>
              <div class="fl-campo">
                <span class="!text-sm">Aguanta apiladas <FlujoInfo>Cuántas cajas se pueden poner una sobre otra sin que se aplaste la de abajo. Define las camas del pallet.</FlujoInfo></span>
                <div class="flex gap-2">
                  <input v-model.number="t.caja.apilable" type="number" min="1" max="60" step="1" inputmode="numeric" class="form-input" :class="errCaja(t).apilable && 'fl-error'" @input="sabe(t, 'apilable')">
                  <button type="button" :class="['fl-nose', t.noSe?.includes('apilable') && 'fl-nose--sel']" @click="t.caja.apilable = 5; marcarNoSe(t, 'apilable')">No sé</button>
                </div>
              </div>
            </div>
            <small v-if="errCaja(t).peso || errCaja(t).apilable" class="fl-msg mt-1 block" role="alert">{{ errCaja(t).peso || errCaja(t).apilable }}</small>
          </section>
          <!-- 4. Como van: las dos orientaciones con cuantas entran por cama -->
          <section v-if="!errCajaTxt(t)" class="mt-5">
            <h3 class="fl-paso-t"><span class="fl-num">4</span>¿Cómo las pones en el pallet?</h3>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <button
                v-for="o in orientaciones({ frente: t.frente, fondo: t.fondo }, t.caja)" :key="String(o.largoEnFrente)" type="button"
                :class="['fl-chip !min-h-12 !flex-col !text-sm', (armado(t)?.largoEnFrente ?? true) === o.largoEnFrente && 'fl-chip--sel']"
                :aria-pressed="(armado(t)?.largoEnFrente ?? true) === o.largoEnFrente"
                :disabled="!o.cajas" @click="t.caja.orientacion = o.largoEnFrente ? 'largo' : 'ancho'"
              >
                <span>{{ o.largoEnFrente ? 'Largo al frente' : 'Ancho al frente' }}</span>
                <span class="text-xs font-normal opacity-80">{{ o.cajas ? `${o.cols} × ${o.filas} = ${o.cajas} por cama` : 'no cabe así' }}</span>
              </button>
            </div>
          </section>
        </template>

        <div v-else class="mt-4 grid gap-4 sm:grid-cols-2">
          <div class="fl-campo">
            <span>Alto con la carga (m)</span>
            <div class="flex gap-2">
              <input v-model.number="t.alto" type="number" min="0.3" max="2.5" step="0.05" inputmode="decimal" class="form-input" :class="err(t).alto && 'fl-error'" :aria-label="`Alto del ${t.nombre} en metros`" @input="sabe(t, 'alto')">
              <button type="button" :class="['fl-nose', t.noSe?.includes('alto') && 'fl-nose--sel']" @click="noSe(t, 'alto', 1.2)">No lo sé</button>
            </div>
            <small v-if="err(t).alto" class="fl-msg">{{ err(t).alto }}</small>
            <em class="text-xs not-italic text-neutral-500">{{ t.noSe?.includes('alto') ? `${ESTIMADO}. ${PIERDE}` : PORQUE.medidasPallet }}</em>
          </div>
          <div class="fl-campo">
            <span>Peso con la carga (kg)</span>
            <div class="flex gap-2">
              <input v-model.number="t.peso" type="number" min="1" max="2000" step="10" inputmode="numeric" class="form-input" :class="err(t).peso && 'fl-error'" :aria-label="`Peso del ${t.nombre} en kilos`" @input="sabe(t, 'peso')">
              <button type="button" :class="['fl-nose', t.noSe?.includes('peso') && 'fl-nose--sel']" @click="noSe(t, 'peso', t.noSe?.includes('peso') ? t.peso : 1000)">No lo sé</button>
            </div>
            <small v-if="err(t).peso" class="fl-msg">{{ err(t).peso }}</small>
            <!-- "No lo sé" (prompt de conversión §D): rangos típicos; queda estimado -->
            <div v-if="t.noSe?.includes('peso')" class="grid grid-cols-3 gap-1.5">
              <button v-for="o in PESOS_TIPICOS" :key="o.v" type="button" :class="['fl-chip !min-h-9 !flex-col !gap-0 !text-sm leading-tight', t.peso === o.kg && 'fl-chip--sel']" @click="t.peso = o.kg">{{ o.t }}<span class="text-[11px] font-normal text-neutral-500">~{{ o.kg.toLocaleString('es-CL') }} kg</span></button>
            </div>
            <em class="text-xs not-italic text-neutral-500">{{ t.noSe?.includes('peso') ? `${ESTIMADO}. ${PIERDE}` : PORQUE.peso }}</em>
          </div>
        </div>

        <!-- Cuantos pallets y de cuantos productos -->
        <section class="mt-6 border-t border-neutral-100 pt-5">
          <h3 class="fl-paso-t"><span class="fl-num">{{ t.desdeCaja ? 5 : 3 }}</span>¿Cuántos pallets así vas a guardar?</h3>
          <label class="fl-campo mt-2">
            <span class="sr-only">Pallets de este tipo</span>
            <span class="flex gap-2">
              <input v-model.number="t.cantidad" type="number" min="1" max="50000" step="1" inputmode="numeric" class="form-input" :class="err(t).cantidad && 'fl-error'" :aria-label="`Pallets de ${t.nombre}`" @input="sabe(t, 'cantidad')">
              <button type="button" :class="['fl-nose', t.noSe?.includes('cantidad') && 'fl-nose--sel']" @click.prevent="noSeCantidad(t)">No sé</button>
            </span>
            <small v-if="err(t).cantidad" class="fl-msg">{{ err(t).cantidad }}</small>
            <em v-else class="text-xs not-italic text-neutral-500">{{ t.noSe?.includes('cantidad') ? `${ESTIMADO}. ${PIERDE}` : 'Cuenta los que tienes hoy y los que esperas tener: con eso sabemos cuántos espacios de rack necesitas.' }}</em>
          </label>
          <!-- No sabe cuántos: lo que cabe en la bodega que dibujó (paso anterior), descontando los otros tipos -->
          <div v-if="t.noSe?.includes('cantidad') && caben.pallets > 0" class="mt-2 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700 ring-1 ring-neutral-200">
            <p>En tu bodega de {{ n(caben.m2) }} m² caben unos <b>{{ n(caben.pallets) }} pallets</b> en selectivo doble de {{ caben.niveles }} {{ caben.niveles === 1 ? 'nivel' : 'niveles' }}.</p>
            <button type="button" class="fl-btn-sec mt-2 w-full !min-h-10 !text-sm" @click="usarLoQueCabe(t)">Usar {{ n(Math.max(1, caben.pallets - otros(t))) }} pallets (queda estimado)</button>
          </div>
          <!-- Cuantos pallets: desde las importaciones (contenedores que llegan y lo que tardan en salir) -->
          <details v-if="t.desdeCaja && t.caja" class="fl-mas mt-3 rounded-xl bg-neutral-50 px-3" :open="!!t.importacion">
            <summary @click="t.importacion ??= { contenedor: 'c40', n: 1, entre: 8, bodega: 8, actuales: 0, margen: 0.1, crecimiento: 0.2 }">¿No sabes cuántos? Calcúlalo desde tus importaciones</summary>
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
          <!-- Lo que ya respondió en el paso 1: no se vuelve a preguntar (se puede cambiar) -->
          <div v-if="usaDichos(i)" class="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            <p class="font-semibold text-neutral-800">Lo que nos dijiste</p>
            <ul class="mt-1 space-y-0.5">
              <li v-for="d in dichos" :key="d.clave">{{ d.corta }}: <b class="font-medium text-neutral-900">{{ d.t }}</b></li>
            </ul>
            <button type="button" class="mt-2 min-h-10 font-semibold text-brand-700 underline underline-offset-2" @click="editarDichos = true">Cambiar</button>
          </div>
          <div v-else class="mt-4">
            <label class="fl-campo">
              <span class="!text-sm">¿Y de cuántos productos distintos son esos {{ n(t.cantidad || 0) }} pallets?</span>
              <input v-model.number="t.skus" type="number" min="1" :max="Math.max(1, t.cantidad || 1)" step="1" inputmode="numeric" placeholder="1" class="form-input" :class="err(t).skus && 'fl-error'" :aria-label="`Productos distintos en los pallets de ${t.nombre}`">
              <small v-if="err(t).skus" class="fl-msg">{{ err(t).skus }}</small>
              <em v-else class="text-xs not-italic text-neutral-500">Por ejemplo, 120 pallets de jugo en 4 sabores son 4 productos. Sirve para saber si conviene guardar un pallet detrás de otro.</em>
            </label>
            <!-- La consecuencia, a la vista: cuantos pallets iguales hay de cada producto -->
            <div v-if="porProducto(t)" class="mt-2 rounded-lg bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700 ring-1 ring-neutral-200" aria-live="polite">
              <div class="flex items-center gap-2">
                <span class="flex flex-wrap gap-[3px]" aria-hidden="true">
                  <span v-for="k in Math.min(12, porProducto(t)!.n)" :key="k" class="h-3 w-3 rounded-[2px]" :style="{ background: t.color }" />
                </span>
                <span v-if="porProducto(t)!.n > 12" class="text-xs text-neutral-500" aria-hidden="true">…</span>
                <b class="font-semibold text-neutral-900">{{ porProducto(t)!.txt }}</b>
              </div>
              <p class="mt-1">{{ porProducto(t)!.que }}</p>
            </div>
          </div>
        </section>
        <fieldset v-if="!usaDichos(i)" class="mt-4">
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
        <!-- La bandeja con sus cajas acomodadas en 3D: cambia con cada dato -->
        <div class="mt-4">
          <div class="aspect-[4/3] w-full sm:aspect-[16/10]">
            <FlujoPallet3D
              v-if="bandejaDe(c)?.cajas" base="estante" :estante="bandejaDe(c)!.estante"
              :frente="bandejaDe(c)!.frente" :fondo="bandejaDe(c)!.fondo" :caja="c" :etiqueta="`Estante de ángulo ranurado con ${bandejaDe(c)!.porModulo} cajas de ${c.nombre}`"
              :cols="bandejaDe(c)!.cols" :filas="bandejaDe(c)!.filas" :camas="bandejaDe(c)!.camas" :largo-en-frente="bandejaDe(c)!.largoEnFrente"
            />
            <div v-else class="flex h-full items-center justify-center rounded-xl bg-red-50 p-4 text-center text-sm text-red-800">Esa caja no cabe en ninguna bandeja (hasta 920 × 600 mm). Revisa sus medidas.</div>
          </div>
          <div v-if="bandejaDe(c)?.cajas" class="fl-resumen mt-3" aria-live="polite">
            <p class="text-[17px] font-semibold text-neutral-900">{{ bandejaDe(c)!.porModulo }} {{ bandejaDe(c)!.porModulo === 1 ? 'caja' : 'cajas' }} por módulo</p>
            <p class="mt-0.5 text-neutral-700">{{ bandejaDe(c)!.cols }} al frente × {{ bandejaDe(c)!.filas }} al fondo × {{ bandejaDe(c)!.camas }} de alto × {{ bandejaDe(c)!.estante.carga }} niveles de bandeja · {{ n(bandejaDe(c)!.kg) }} de 250 kg por bandeja</p>
            <p class="mt-1 text-sm text-neutral-500">
              Estante de {{ fmA(bandejaDe(c)!.estante.alto) }} m con bandeja de {{ mmTxt(bandejaDe(c)!.frente) }} × {{ mmTxt(bandejaDe(c)!.fondo) }} mm, {{ bandejaDe(c)!.largoEnFrente ? 'con el largo de la caja al frente' : 'con el ancho de la caja al frente' }}.
              {{ bandejaDe(c)!.limite === 'peso' ? 'No van más para no pasar de 250 kg.' : bandejaDe(c)!.limite === 'apilable' ? `Apiladas hasta ${bandejaDe(c)!.camas}: lo que aguanta tu caja.` : '' }}
              En el paso 4 armas tu estante y ves cuántas caben por módulo.
            </p>
          </div>
        </div>
        <section class="mt-5">
          <h3 class="fl-paso-t">Tu caja</h3>
          <div class="mt-2 grid grid-cols-3 gap-2">
            <label class="fl-campo"><span class="!text-sm">Largo (cm)</span><input :value="cm(c.largo)" type="number" min="5" max="120" inputmode="numeric" class="form-input" @input="c.largo = mts($event)"></label>
            <label class="fl-campo"><span class="!text-sm">Ancho (cm)</span><input :value="cm(c.ancho)" type="number" min="5" max="120" inputmode="numeric" class="form-input" @input="c.ancho = mts($event)"></label>
            <label class="fl-campo"><span class="!text-sm">Alto (cm)</span><input :value="cm(c.alto)" type="number" min="5" max="120" inputmode="numeric" class="form-input" @input="c.alto = mts($event)"></label>
          </div>
          <div class="mt-3 grid grid-cols-3 gap-2">
            <label class="fl-campo"><span class="!text-sm">Kg por caja</span><input v-model.number="c.peso" type="number" min="0.1" step="0.5" inputmode="decimal" class="form-input"></label>
            <label class="fl-campo"><span class="!text-sm">Aguanta apiladas <FlujoInfo>Cuántas cajas se pueden poner una sobre otra sin que se aplaste la de abajo.</FlujoInfo></span><input v-model.number="c.apilable" type="number" min="1" max="20" inputmode="numeric" class="form-input"></label>
            <label class="fl-campo"><span class="!text-sm">¿Cuántas cajas?</span><input v-model.number="c.cantidad" type="number" min="1" inputmode="numeric" class="form-input" :class="!(c.cantidad >= 1) && 'fl-error'"></label>
          </div>
        </section>
      </article>
    </TransitionGroup>

    <button type="button" class="fl-agregar mt-4" @click="conCajas ? p.agregarCaja() : p.agregarPallet()">
      + Agregar otro {{ conCajas ? 'tipo de caja' : 'tipo de pallet' }}
    </button>
    <button v-if="!soloCajas" type="button" class="mt-3 block text-sm text-neutral-600 underline underline-offset-2" @click="verCajas = !verCajas">
      {{ conCajas ? 'Volver a mis pallets' : 'También guardo cajas a mano (ángulo ranurado)' }}
    </button>

    <!-- Antes de avanzar con el pallet de ejemplo, se pregunta (no se cotiza un ejemplo sin que lo sepa) -->
    <!-- Fijo sobre la barra de Siguiente: al final de la página no se veía y parecía que el botón no hacía nada -->
    <div v-if="preguntaEjemplo" class="fixed inset-x-0 bottom-[4.5rem] z-40 mx-auto w-[min(36rem,calc(100vw-2rem))] rounded-2xl bg-amber-50 p-4 text-amber-950 shadow-xl ring-1 ring-amber-200" role="alertdialog" aria-labelledby="fl-ejemplo-t">
      <p id="fl-ejemplo-t" class="font-semibold">Usamos un pallet de ejemplo. ¿Lo cambiamos por el tuyo?</p>
      <p class="mt-1 text-sm">{{ textoEjemplo }}. Si sigues así, tu ejecutivo te pregunta las medidas reales.</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button type="button" class="fl-btn !min-h-10 !text-sm" @click="cambiarEjemplo">Sí, pongo mis datos</button>
        <button type="button" class="fl-btn-sec !min-h-10 !text-sm" @click="preguntaEjemplo = false; emit('siguiente')">Seguir con el ejemplo</button>
      </div>
    </div>

    <FlujoAcciones :deshabilitado="!valido" motivo="Revisa los datos marcados en rojo." @atras="emit('atras')" @siguiente="seguir" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue';
import { useProyecto, type TipoPallet, type TipoCaja } from '~/stores/proyecto';
import { ROTACION } from '~/lib/rack3d/mezcla.js';
import { PREGUNTAS } from '~/lib/tour/reglas.js';
import { PESOS_TIPICOS, ESTIMADO, PIERDE, PORQUE } from '~/lib/flujo/conversion.js';
import { armarPallet, orientaciones, demandaImportacion, CONTENEDORES, ALTO_MAX_PALLET, ALTO_BASE } from '~/lib/tour/pallet.js';
import { UMBRALES } from '~/lib/flujo/recomendacion.js';
// Peso maximo de un pallet cargado (el mismo tope del pallet sin cajas)
const PESO_MAX = 2000;
import { mejorBandeja, resultadoModelo, palletsQueCaben } from '~/lib/flujo/calculos.js';

const emit = defineEmits<{ siguiente: []; atras: [] }>();
const p = useProyecto();
const dosColumnas = computed(() => !conCajas.value && p.pallets.some((t) => t.desdeCaja && t.caja));
// Abierto solo si viene de Revisa a cambiar las cajas del ángulo ranurado agregado (un pallet nuevo queda a la vista)
const abrirCajas = useState('pallets-abrir-cajas', () => false);
const verCajas = ref(abrirCajas.value);
abrirCajas.value = false;
// Solo cajas si todos sus racks son de ángulo ranurado (o eligió ese sistema y aún no arma racks): con
// selectivo o drive-in el paso pide pallets
const soloCajas = computed(() => (p.modelos.length ? p.modelos.every((m) => m.tipo === 'AR') : p.sistema === 'AR'));
const conCajas = computed(() => soloCajas.value || verCajas.value);

onMounted(() => {
  // Valores por defecto: se puede avanzar con "Siguiente" sin tocar nada
  if (p.sistema === 'AR' && !p.cajas.length) p.agregarCaja();
  if (p.sistema !== 'AR' && !p.pallets.length) p.agregarPallet({ nombre: 'Pallet 1', ...desdePaso1() });
  // El pallet de ejemplo que aún no toca toma lo que respondió en el paso 1 (pudo volver a cambiarlo)
  else if (p.pallets[0]?.ejemplo) Object.assign(p.pallets[0], desdePaso1());
});

// ─── Lo respondido en el paso 1: productos, pallets por producto y rotación ───
// Las respuestas son rangos: se usa un valor dentro del rango (pallets por producto queda igual que en el paso 1)
const SKUS: Record<string, number> = { pocos: 5, varios: 30, muchos: 60 };
const PALLETS_SKU: Record<string, number> = { '1-2': 2, '3-5': 4, '6-10': 8, '10+': 15 };
function desdePaso1(): Partial<TipoPallet> {
  const r = p.respuestas, out: Partial<TipoPallet> = {};
  if (r.rotacion && r.rotacion in ROTACION) out.rotacion = r.rotacion as TipoPallet['rotacion'];
  if (SKUS[r.n_sku]) out.skus = SKUS[r.n_sku];
  if (out.skus && PALLETS_SKU[r.pallets_sku]) out.cantidad = out.skus * PALLETS_SKU[r.pallets_sku];
  return out;
}
const dichos = computed(() => ['n_sku', 'pallets_sku', 'rotacion'].map((clave) => {
  const q = PREGUNTAS.find((x) => x.clave === clave);
  const o = q?.opciones.find((x) => x.v === p.respuestas[clave]);
  return q && o ? { clave, corta: q.corta, t: o.t } : null;
}).filter(Boolean) as { clave: string; corta: string; t: string }[]);
const editarDichos = ref(false);
const usaDichos = (i: number) => i === 0 && dichos.value.length > 0 && !editarDichos.value;

// ─── Pallet de ejemplo: se ve gris y se confirma antes de avanzar ───
const preguntaEjemplo = ref(false);
const textoEjemplo = computed(() => {
  const t = p.pallets.find((x) => x.ejemplo);
  if (!t) return '';
  const c = t.desdeCaja && t.caja ? `caja de ${mm(t.caja.largo)} × ${mm(t.caja.ancho)} × ${mm(t.caja.alto)} mm y ${n(t.caja.peso)} kg, ` : '';
  return `Pusimos ${c}${n(t.cantidad)} pallets de ${fm(t.alto)} m de alto`;
});
function cambiarEjemplo() {
  preguntaEjemplo.value = false;
  const t = p.pallets.find((x) => x.ejemplo);
  const el = t && document.getElementById(`pallet-${t.id}`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  (el?.querySelector('input[type=number]') as HTMLInputElement | null)?.focus({ preventScroll: true });
}

const fm = (v: number) => v.toFixed(2).replace('.', ',');
const n = (v: number) => Math.round(v).toLocaleString('es-CL');
const cm = (v: number) => Math.round(v * 100);
const mts = (e: Event) => Math.max(0.05, Number((e.target as HTMLInputElement).value) / 100 || 0.05);
// ─── Medidas del pallet: listas con las de siempre en Chile y "Otra medida" ───
const LADOS = [0.8, 1.0, 1.1, 1.2];
const fm1 = (v: number) => v.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
// Pallets conocidos (frente × fondo, en m): se nombran bajo las listas para que el cliente reconozca el suyo
const CONOCIDOS = [
  { f: 1.0, d: 1.2, t: 'Pallet estándar (americano) de 1,0 × 1,2 m, entrando por el lado corto.' },
  { f: 1.2, d: 1.0, t: 'Pallet estándar (americano) de 1,0 × 1,2 m, entrando por el lado largo.' },
  { f: 0.8, d: 1.2, t: 'Pallet europeo de 0,8 × 1,2 m, entrando por el lado corto.' },
  { f: 1.2, d: 0.8, t: 'Pallet europeo de 0,8 × 1,2 m, entrando por el lado largo.' },
  { f: 1.1, d: 1.1, t: 'Pallet cuadrado de 1,1 × 1,1 m.' },
  { f: 1.0, d: 1.0, t: 'Pallet cuadrado de 1,0 × 1,0 m.' },
];
const nombrePallet = (t: TipoPallet) => CONOCIDOS.find((c) => c.f === t.frente && c.d === t.fondo)?.t ?? '';
// "Otra medida": la eligió en la lista o su medida no es una de la lista
const otras = ref(new Set<string>());
const otraMedida = (t: TipoPallet, lado: 'frente' | 'fondo') => otras.value.has(`${t.id}-${lado}`) || !LADOS.includes(t[lado]);
function elegirMedida(t: TipoPallet, lado: 'frente' | 'fondo', e: Event) {
  const v = (e.target as HTMLSelectElement).value, k = `${t.id}-${lado}`;
  const s = new Set(otras.value);
  if (v === 'otra') s.add(k); else { s.delete(k); t[lado] = Number(v); delete borrador.value[k]; }
  otras.value = s;
}
// Metros escritos a mano (acepta coma; solo cifras y una coma): sin topes silenciosos, el error lo explica.
// Lo escrito se guarda tal cual mientras escribe ("1," no se vuelve "1")
const borrador = ref<Record<string, string>>({});
function escribirMedida(t: TipoPallet, lado: 'frente' | 'fondo', e: Event) {
  const el = e.target as HTMLInputElement, limpio = el.value.replace('.', ',').replace(/[^\d,]/g, '').replace(/,(?=.*,)/g, '');
  if (el.value !== limpio) el.value = limpio;
  borrador.value = { ...borrador.value, [`${t.id}-${lado}`]: limpio };
  t[lado] = Number(limpio.replace(',', '.')) || 0;
}

// ─── La caja en milimetros, con tope y mensaje ───
const ALTO_CARGA = +(ALTO_MAX_PALLET - ALTO_BASE).toFixed(3);   // alto de cajas sobre la tarima (1,65 m)
const DIM_CAJA = [{ k: 'largo', t: 'Largo' }, { k: 'ancho', t: 'Ancho' }, { k: 'alto', t: 'Alto' }] as const;
const mm = (v: number) => (v > 0 ? String(Math.round(v * 1000)) : '');
// Solo numeros, hasta 4 cifras (9.999 mm): lo que pase del pallet lo explica errCaja
function ponerMm(t: TipoPallet, k: 'largo' | 'ancho' | 'alto', e: Event) {
  const el = e.target as HTMLInputElement, limpio = el.value.replace(/\D/g, '').slice(0, 4);
  if (el.value !== limpio) el.value = limpio;
  t.caja![k] = limpio ? Number(limpio) / 1000 : 0;
}
function errCaja(t: TipoPallet) {
  const e: Record<string, string> = {}, c = t.caja;
  if (!t.desdeCaja || !c) return e;
  const mayor = Math.round(Math.max(t.frente, t.fondo) * 1000), menor = Math.round(Math.min(t.frente, t.fondo) * 1000);
  const L = Math.round(c.largo * 1000), A = Math.round(c.ancho * 1000), H = Math.round(c.alto * 1000);
  const N = (v: number) => v.toLocaleString('es-CL');
  // El lado mayor de la caja va en el lado mayor del pallet: se valida por lado mayor y menor
  const [cMayor, cMenor] = L >= A ? [L, A] : [A, L];
  const kMayor = L >= A ? 'largo' : 'ancho', kMenor = L >= A ? 'ancho' : 'largo';
  if (!L) e.largo = 'Falta el largo de la caja.';
  if (!A) e.ancho = 'Falta el ancho de la caja.';
  if (L && A) {
    if (cMayor > mayor) e[kMayor] = `Esa caja no cabe en el pallet: de ${kMayor} cabe hasta ${N(mayor)} mm (el pallet mide ${N(Math.round(t.frente * 1000))} × ${N(Math.round(t.fondo * 1000))} mm).`;
    else if (cMenor > menor) e[kMenor] = `Esa caja no cabe en el pallet: con ${N(cMayor)} mm de ${kMayor}, de ${kMenor} cabe hasta ${N(cMayor > menor ? menor : mayor)} mm.`;
    else if (Math.min(L, A) < 10) e[L < A ? 'largo' : 'ancho'] = 'Mínimo 10 mm.';
  }
  if (!H) e.alto = 'Falta el alto de la caja.';
  else if (H > ALTO_CARGA * 1000) e.alto = `Esa caja es más alta que lo que se carga en un pallet: de alto cabe hasta ${N(ALTO_CARGA * 1000)} mm.`;
  else if (H < 10) e.alto = 'Mínimo 10 mm de alto.';
  if (!(c.peso > 0)) e.peso = 'Pon cuánto pesa una caja (en kg).';
  else if (c.peso > 1000) e.peso = 'Una caja de más de 1.000 kg no se carga así: revisa el peso.';
  else {
    const a = armado(t);
    if (a && a.peso > PESO_MAX) e.peso = `Así el pallet pesa ${n(a.peso)} kg y el máximo es ${N(PESO_MAX)} kg: baja el peso o las cajas apiladas.`;
  }
  if (!(Number.isInteger(c.apilable) && c.apilable >= 1 && c.apilable <= 60)) e.apilable = 'Apiladas: un número entero entre 1 y 60.';
  return e;
}
const errCajaTxt = (t: TipoPallet) => { const e = errCaja(t); return e.largo || e.ancho || e.alto || e.peso || e.apilable || ''; };
// Pallets por producto y lo que significa (mismos umbrales que la recomendacion del paso 4)
function porProducto(t: TipoPallet) {
  if (!(t.cantidad >= 1) || !(t.skus && t.skus >= 1) || t.skus > t.cantidad) return null;
  const v = t.cantidad / t.skus, r = Math.round(v);
  const txt = t.skus === 1 ? `Los ${n(t.cantidad)} pallets son del mismo producto.` : `Unos ${n(r)} ${r === 1 ? 'pallet' : 'pallets'} de cada producto.`;
  const que = v <= (UMBRALES.selectivoHasta as number)
    ? 'Pocos pallets iguales: conviene que cada pallet tenga su propio lugar en el rack, a mano desde el pasillo.'
    : v < (UMBRALES.driveInDesde as number)
      ? 'Varios pallets iguales: puede convenir guardar dos uno detrás de otro. Lo revisa tu ejecutivo.'
      : 'Muchos pallets iguales: conviene guardar uno detrás de otro y ahorrar pasillos. Lo vemos al armar tu rack.';
  return { n: r, txt, que };
}
function noSe(t: TipoPallet, campo: 'alto' | 'peso', tipico: number) {
  t[campo] = tipico;
  t.noSe = [...new Set([...(t.noSe ?? []), campo])];
}
// "No sé cuántos": queda estimado y se ofrece lo que cabe en la bodega dibujada
const caben = computed(() => palletsQueCaben(p.bodega, { pallet: p.pallets[0] ?? null, gruaDatos: { gruaLevante: p.bodega.gruaLevante, gruaKg: p.bodega.gruaKg } }));
const otros = (t: TipoPallet) => p.pallets.filter((x) => x.id !== t.id).reduce((s, x) => s + (x.cantidad || 0), 0);
function noSeCantidad(t: TipoPallet) {
  t.noSe = [...new Set([...(t.noSe ?? []), 'cantidad'])];
}
function usarLoQueCabe(t: TipoPallet) {
  t.cantidad = Math.max(1, caben.value.pallets - otros(t));
  t.noSe = [...new Set([...(t.noSe ?? []), 'cantidad'])];
  marcar('cantidad_estimada', { pallets: t.cantidad });
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
// ─── Angulo ranurado: la bandeja de esta caja (la del modelo si ya la armó en el paso 3; si no, la que ocupa menos piso) ───
const mmTxt = (v: number) => Math.round(v * 1000).toLocaleString('es-CL');
const fmA = (v: number) => (+(+v).toFixed(2)).toLocaleString('es-CL', { minimumFractionDigits: 1 });
function calcularBandeja(c: TipoCaja) {
  if (!(c.largo > 0 && c.ancho > 0 && c.alto > 0)) return null;
  const caja = { ...c, cantidad: Math.max(1, c.cantidad || 1) };
  const delModelo = p.modelos.find((m) => m.tipo === 'AR' && (m.cantidades?.[c.id] ?? 0) > 0);
  let modelo: any = delModelo ? { ...delModelo, cantidades: { [c.id]: caja.cantidad } } : null;
  if (!modelo) {
    const base = { id: 'b', nombre: 'AR', tipo: 'AR', doble: false, niveles: 4, bandeja: 0.4, frente: 0.9, altoAngulo: 2, cantidades: { [c.id]: caja.cantidad } };
    const b = mejorBandeja(base, { cajas: [caja], altura: p.bodega.altura });
    modelo = b ? { ...base, bandeja: b.bandeja, frente: b.frente, niveles: b.niveles, altoAngulo: b.altoAngulo } : base;
  }
  const r = resultadoModelo(modelo, { cajas: [caja] });
  return r.principal ? {
    ...r.principal, frente: r.m.frente, fondo: r.m.fondo, porModulo: r.porModulo,
    estante: { alto: r.m.alto, bandejasY: r.m.bandejasY, espesor: r.m.espesorBandeja, carga: r.m.nivelesCarga },
  } : null;
}
// Una vez por cambio (la busqueda prueba varias bandejas): no en cada uso del template
const bandejas = computed(() => Object.fromEntries(p.cajas.map((c) => [c.id, calcularBandeja(c)])));
const bandejaDe = (c: TipoCaja) => bandejas.value[c.id] ?? null;
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
  if (!(t.cantidad >= 1)) e.cantidad = 'Al menos 1 pallet.';
  else if (!Number.isInteger(t.cantidad)) e.cantidad = 'Pon un número entero de pallets.';
  else if (t.cantidad > 50000) e.cantidad = 'Más de 50.000 pallets: escríbenos y lo vemos con un ingeniero.';
  if (t.skus != null && (t.skus as any) !== '' && !(Number.isInteger(t.skus) && t.skus >= 1)) e.skus = 'Al menos 1 producto (número entero).';
  else if (t.skus && t.cantidad >= 1 && t.skus > t.cantidad) e.skus = `No pueden ser más productos que pallets (${n(t.cantidad)}).`;
  if (!(t.frente >= 0.6 && t.frente <= 1.6)) e.frente = `El frente de un pallet va de 0,6 a 1,6 m${t.frente > 1.6 ? ': más grande no entra en un rack de pallets' : ''}.`;
  if (!(t.fondo >= 0.6 && t.fondo <= 1.6)) e.fondo = `El fondo de un pallet va de 0,6 a 1,6 m${t.fondo > 1.6 ? ': más grande no entra en un rack de pallets' : ''}.`;
  // Armado desde la caja: el alto y el peso salen solos; el error se muestra en la caja
  if (t.desdeCaja) { delete e.alto; delete e.peso; Object.assign(e, errCaja(t)); }
  return e;
}
const valido = computed(() => (conCajas.value
  ? p.cajas.length > 0 && p.cajas.every((c) => c.cantidad >= 1 && c.largo > 0 && c.ancho > 0 && c.alto > 0)
  : p.pallets.length > 0 && p.pallets.every((t) => !Object.keys(err(t)).length)));

function seguir() {
  if (verCajas.value && !p.pallets.length && p.sistema !== 'AR') verCajas.value = false;
  if (!conCajas.value && p.pallets.some((t) => t.ejemplo)) { preguntaEjemplo.value = true; return; }
  emit('siguiente');
}
function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}
</script>

<style scoped>
/* Escritorio: el pallet en 3D queda fijo a la izquierda y los datos a la derecha (menos scroll) */
@media (min-width: 1024px) {
  .fl-pallet-dos { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 1.5rem; }
  .fl-pallet-dos > * { grid-column: 2; }
  .fl-pallet-dos > .fl-ancho { grid-column: 1 / -1; }
  .fl-pallet-dos > .fl-pallet-3d { grid-column: 1; grid-row: span 30; position: sticky; top: 11rem; align-self: start; }
}
.fl-paso-t { display: flex; align-items: center; gap: .5rem; font-size: 15px; font-weight: 600; color: #262626; }
.fl-num { display: inline-flex; height: 1.5rem; width: 1.5rem; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 9999px; background: #fff7ed; color: #c2410c; font-size: .8rem; font-weight: 700; box-shadow: inset 0 0 0 1px #fed7aa; }
.fl-resumen { border-radius: .75rem; background: #fafafa; padding: .75rem 1rem; box-shadow: inset 0 0 0 1px #e5e5e5; }
</style>
