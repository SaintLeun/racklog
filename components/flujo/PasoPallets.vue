<template>
  <div :class="!dosColumnas && 'mx-auto max-w-3xl'">
    <!-- Con un pallet armado en 3D usa todo el ancho (3D a la izquierda); si no, una columna legible -->
    <h1 class="fl-titulo">{{ conCajas ? 'Tus cajas' : 'Tus pallets' }}</h1>
    <p class="fl-bajada">
      {{ conCajas
        ? 'Cuéntanos qué guardas en las repisas. Si no sabes un dato, usa "No sé" y lo confirma tu ejecutivo.'
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
        <!-- Como define la carga: desde la caja (pallet armado en 3D) o el alto y peso si ya los sabe -->
        <div class="fl-ancho mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Cómo definir la carga">
          <button type="button" :class="['fl-chip !min-h-11 !text-sm', t.desdeCaja && 'fl-chip--sel']" :aria-pressed="!!t.desdeCaja" @click="usarCajas(t)">Armar desde mis cajas</button>
          <button type="button" :class="['fl-chip !min-h-11 !text-sm', !t.desdeCaja && 'fl-chip--sel']" :aria-pressed="!t.desdeCaja" @click="t.desdeCaja = false">Ya sé el alto y peso</button>
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
          <div v-if="armado(t)" class="fl-resumen mt-3" aria-live="polite">
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
          <p v-else class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">Esa caja no cabe en el pallet: revisa sus medidas o las del pallet.</p>
        </div>

        <!-- 1. El pallet: frente (lo que se ve desde el pasillo) y fondo (lo que entra al rack) -->
        <section class="mt-5">
          <h3 class="fl-paso-t"><span v-if="t.desdeCaja" class="fl-num">1</span>Tu pallet</h3>
          <div class="mt-2 grid items-center gap-4" :class="!t.desdeCaja && 'sm:grid-cols-[1fr_220px]'">
            <div>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="b in MEDIDAS" :key="b.t" type="button"
                  :class="['fl-chip !min-h-10 !text-sm', t.frente === b.frente && t.fondo === b.fondo && 'fl-chip--sel']"
                  :aria-pressed="t.frente === b.frente && t.fondo === b.fondo"
                  @click="t.frente = b.frente; t.fondo = b.fondo"
                >{{ b.t }}</button>
              </div>
              <div class="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <label class="fl-campo">
                  <span class="!text-sm">Frente (m) <FlujoInfo>El lado que ves desde el pasillo: por ahí entran las horquillas.</FlujoInfo></span>
                  <input v-model.number="t.frente" type="number" min="0.6" max="1.6" step="0.05" inputmode="decimal" class="form-input" :class="err(t).frente && 'fl-error'">
                </label>
                <label class="fl-campo">
                  <span class="!text-sm">Fondo (m) <FlujoInfo>Lo que el pallet entra hacia adentro del rack. Define el fondo del marco.</FlujoInfo></span>
                  <input v-model.number="t.fondo" type="number" min="0.6" max="1.6" step="0.05" inputmode="decimal" class="form-input" :class="err(t).fondo && 'fl-error'">
                </label>
                <button type="button" class="fl-chip !min-h-11 !w-auto !px-3 !text-sm" aria-label="Girar pallet (cambiar frente por fondo)" @click="[t.frente, t.fondo] = [t.fondo, t.frente]">↻ Girar</button>
              </div>
              <small v-if="err(t).frente || err(t).fondo" class="fl-msg">{{ err(t).frente || err(t).fondo }}</small>
            </div>
            <!-- Con el pallet en 3D arriba, la planta sobra (el 3D tiene la vista desde arriba) -->
            <div v-if="!t.desdeCaja" class="flex justify-center"><FlujoPalletPlanta :frente="t.frente" :fondo="t.fondo" /></div>
          </div>
        </section>

        <template v-if="t.desdeCaja && t.caja">
          <!-- 2. La caja -->
          <section class="mt-5">
            <h3 class="fl-paso-t"><span class="fl-num">2</span>Tu caja</h3>
            <div class="mt-2 grid grid-cols-3 gap-2">
              <label class="fl-campo"><span class="!text-sm">Largo (cm)</span><input :value="cm(t.caja.largo)" type="number" min="5" max="160" inputmode="numeric" class="form-input" @input="t.caja.largo = mts($event)"></label>
              <label class="fl-campo"><span class="!text-sm">Ancho (cm)</span><input :value="cm(t.caja.ancho)" type="number" min="5" max="160" inputmode="numeric" class="form-input" @input="t.caja.ancho = mts($event)"></label>
              <label class="fl-campo"><span class="!text-sm">Alto (cm)</span><input :value="cm(t.caja.alto)" type="number" min="5" max="160" inputmode="numeric" class="form-input" @input="t.caja.alto = mts($event)"></label>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <label class="fl-campo"><span class="!text-sm">Kg por caja</span><input v-model.number="t.caja.peso" type="number" min="0.1" step="0.5" inputmode="decimal" class="form-input"></label>
              <div class="fl-campo">
                <span class="!text-sm">Aguanta apiladas <FlujoInfo>Cuántas cajas se pueden poner una sobre otra sin que se aplaste la de abajo. Define las camas del pallet.</FlujoInfo></span>
                <div class="flex gap-2">
                  <input v-model.number="t.caja.apilable" type="number" min="1" max="30" inputmode="numeric" class="form-input" @input="sabe(t, 'apilable')">
                  <button type="button" :class="['fl-nose', t.noSe?.includes('apilable') && 'fl-nose--sel']" @click="t.caja.apilable = 5; marcarNoSe(t, 'apilable')">No sé</button>
                </div>
              </div>
            </div>
          </section>
          <!-- 3. Como van: las dos orientaciones con cuantas entran por cama -->
          <section class="mt-5">
            <h3 class="fl-paso-t"><span class="fl-num">3</span>Cómo van en el pallet</h3>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <button
                v-for="o in orientaciones({ frente: t.frente, fondo: t.fondo }, t.caja)" :key="String(o.largoEnFrente)" type="button"
                :class="['fl-chip !min-h-12 !flex-col !text-sm', (armado(t)?.largoEnFrente ?? true) === o.largoEnFrente && 'fl-chip--sel']"
                :aria-pressed="(armado(t)?.largoEnFrente ?? true) === o.largoEnFrente"
                :disabled="!o.cajas" @click="t.caja.orientacion = o.largoEnFrente ? 'largo' : 'ancho'"
              >
                <span>{{ o.largoEnFrente ? 'Largo al frente' : 'Ancho al frente' }}</span>
                <span class="text-xs font-normal opacity-80">{{ o.cols }} × {{ o.filas }} = {{ o.cajas }} por cama</span>
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
          <h3 class="fl-paso-t"><span v-if="t.desdeCaja" class="fl-num">4</span>Cuántos tienes</h3>
          <label class="fl-campo mt-2">
            <span class="!text-sm">Pallets de este tipo</span>
            <span class="flex gap-2">
              <input v-model.number="t.cantidad" type="number" min="1" step="1" inputmode="numeric" class="form-input" :class="err(t).cantidad && 'fl-error'" @input="sabe(t, 'cantidad')">
              <button type="button" :class="['fl-nose', t.noSe?.includes('cantidad') && 'fl-nose--sel']" @click.prevent="noSeCantidad(t)">No sé</button>
            </span>
            <small v-if="err(t).cantidad" class="fl-msg">{{ err(t).cantidad }}</small>
            <em v-else class="text-xs not-italic text-neutral-500">{{ t.noSe?.includes('cantidad') ? `${ESTIMADO}. ${PIERDE}` : PORQUE.cantidad }}</em>
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
          <label v-else class="fl-campo mt-4">
            <span class="!text-sm">¿Cuántos productos distintos van en este tipo de pallet? <FlujoInfo>Si son 120 pallets de 4 sabores distintos, son 4 productos. Sirve para saber si conviene guardarlos uno detrás de otro.</FlujoInfo></span>
            <input v-model.number="t.skus" type="number" min="1" step="1" inputmode="numeric" placeholder="1" class="form-input">
          </label>
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
              v-if="bandejaDe(c)?.cajas" base="bandeja"
              :frente="bandejaDe(c)!.frente" :fondo="bandejaDe(c)!.fondo" :caja="c" :etiqueta="`Bandeja de ángulo ranurado con ${bandejaDe(c)!.cajas} cajas de ${c.nombre}`"
              :cols="bandejaDe(c)!.cols" :filas="bandejaDe(c)!.filas" :camas="bandejaDe(c)!.camas" :largo-en-frente="bandejaDe(c)!.largoEnFrente"
            />
            <div v-else class="flex h-full items-center justify-center rounded-xl bg-red-50 p-4 text-center text-sm text-red-800">Esa caja no cabe en ninguna bandeja (hasta 920 × 600 mm). Revisa sus medidas.</div>
          </div>
          <div v-if="bandejaDe(c)?.cajas" class="fl-resumen mt-3" aria-live="polite">
            <p class="text-[17px] font-semibold text-neutral-900">{{ bandejaDe(c)!.cajas }} {{ bandejaDe(c)!.cajas === 1 ? 'caja' : 'cajas' }} por bandeja</p>
            <p class="mt-0.5 text-neutral-700">{{ bandejaDe(c)!.cols }} al frente × {{ bandejaDe(c)!.filas }} al fondo × {{ bandejaDe(c)!.camas }} de alto · {{ n(bandejaDe(c)!.kg) }} de 250 kg</p>
            <p class="mt-1 text-sm text-neutral-500">
              Bandeja de {{ mmTxt(bandejaDe(c)!.frente) }} × {{ mmTxt(bandejaDe(c)!.fondo) }} mm, {{ bandejaDe(c)!.largoEnFrente ? 'con el largo de la caja al frente' : 'con el ancho de la caja al frente' }}.
              {{ bandejaDe(c)!.limite === 'peso' ? 'No van más para no pasar de 250 kg.' : bandejaDe(c)!.limite === 'apilable' ? `Apiladas hasta ${bandejaDe(c)!.camas}: lo que aguanta tu caja.` : '' }}
              Es la que guarda tus cajas en menos espacio; puedes cambiarla en el paso 3.
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
    <button v-if="p.sistema !== 'AR'" type="button" class="mt-3 block text-sm text-neutral-600 underline underline-offset-2" @click="verCajas = !verCajas">
      {{ conCajas ? 'Volver a mis pallets' : 'También guardo cajas a mano (ángulo ranurado)' }}
    </button>

    <!-- Antes de avanzar con el pallet de ejemplo, se pregunta (no se cotiza un ejemplo sin que lo sepa) -->
    <div v-if="preguntaEjemplo" class="mt-6 rounded-2xl bg-amber-50 p-4 text-amber-950 ring-1 ring-amber-200" role="alertdialog" aria-labelledby="fl-ejemplo-t">
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
import { armarPallet, orientaciones, demandaImportacion, CONTENEDORES } from '~/lib/tour/pallet.js';
import { mejorBandeja, resultadoModelo, palletsQueCaben } from '~/lib/flujo/calculos.js';

const emit = defineEmits<{ siguiente: []; atras: [] }>();
const p = useProyecto();
const dosColumnas = computed(() => !conCajas.value && p.pallets.some((t) => t.desdeCaja && t.caja));
const verCajas = ref(false);
const conCajas = computed(() => p.sistema === 'AR' || verCajas.value);

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
  const c = t.desdeCaja && t.caja ? `caja de ${cm(t.caja.largo)} × ${cm(t.caja.ancho)} × ${cm(t.caja.alto)} cm y ${n(t.caja.peso)} kg, ` : '';
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
function calcularBandeja(c: TipoCaja) {
  if (!(c.largo > 0 && c.ancho > 0 && c.alto > 0)) return null;
  const caja = { ...c, cantidad: Math.max(1, c.cantidad || 1) };
  const delModelo = p.modelos.find((m) => m.tipo === 'AR' && (m.cantidades?.[c.id] ?? 0) > 0);
  let modelo: any = delModelo ? { ...delModelo, cantidades: { [c.id]: caja.cantidad } } : null;
  if (!modelo) {
    const base = { id: 'b', nombre: 'AR', tipo: 'AR', doble: false, niveles: 5, bandeja: 0.4, frente: 0.92, cantidades: { [c.id]: caja.cantidad } };
    const b = mejorBandeja(base, { cajas: [caja], altura: p.bodega.altura });
    modelo = b ? { ...base, bandeja: b.bandeja, frente: b.frente, niveles: b.niveles, camasRepisa: b.camasRepisa } : base;
  }
  const r = resultadoModelo(modelo, { cajas: [caja] });
  return r.principal ? { ...r.principal, frente: r.m.frente, fondo: r.m.fondo } : null;
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
