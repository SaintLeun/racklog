<template>
  <div>
    <h1 class="fl-titulo">{{ mod?.tipo === 'AR' ? 'Arma tu estante' : 'Arma tu rack' }}</h1>
    <p class="fl-bajada">{{ mod?.tipo === 'AR' ? 'Pon tu caja y mira cuántas caben por estante.' : 'Te proponemos uno para tus pallets. Cámbialo a tu gusto.' }}</p>

    <!-- Altura de la bodega primero: la recomendación y los niveles dependen de ella. En una sola línea
         para que el dibujo del rack quede en la primera pantalla del celular -->
    <div class="fl-card mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 !py-2">
      <label for="fl-altura" class="flex-1 text-[15px] font-medium text-neutral-700">Altura de tu bodega (m) <FlujoInfo>Del piso a lo más bajo del techo (viga, lámpara o rociador). Si no sabes, usamos 8 m.</FlujoInfo></label>
      <div class="flex gap-2">
        <input id="fl-altura" :value="p.bodega.altura ?? ''" type="number" min="2.5" max="40" step="0.1" inputmode="decimal" class="form-input !h-10 !w-24" placeholder="8" @change="cambiarAltura($event)">
        <button type="button" :class="['fl-nose', p.flags.includes('no_se:altura') && 'fl-nose--sel']" @click="alturaNoSe">No sé</button>
      </div>
      <!-- La grúa limita la altura del rack: hasta dónde sube y cuánto levanta allá arriba (capacidad residual) -->
      <div v-if="conGruaRack" class="flex w-full flex-wrap items-center gap-x-3 gap-y-2 border-t border-neutral-100 pt-2">
        <span class="flex-1 text-[15px] font-medium text-neutral-700">Tu grúa levanta<FlujoReferencial v-if="!(p.bodega as any).gruaKg" :de="eqTipico" /> <FlujoInfo>Está en la placa de la grúa: altura máxima y kg. Mientras más sube, menos levanta.</FlujoInfo></span>
        <label class="flex items-center gap-1.5 text-sm text-neutral-600"><span class="sr-only">Altura máxima de la grúa</span><input :value="(p.bodega as any).gruaLevante ?? ''" type="number" min="1" max="15" step="0.1" inputmode="decimal" class="form-input !h-10 !w-20" :placeholder="String(eqTipico.levante).replace('.', ',')" @change="placa('gruaLevante', $event)">m</label>
        <label class="flex items-center gap-1.5 text-sm text-neutral-600"><span class="sr-only">Capacidad de la grúa</span><input :value="(p.bodega as any).gruaKg ?? ''" type="number" min="300" max="10000" step="50" inputmode="numeric" class="form-input !h-10 !w-24" :placeholder="eqTipico.kg.toLocaleString('es-CL')" @change="placa('gruaKg', $event)">kg</label>
        <button type="button" :class="['fl-nose !min-h-10', p.flags.includes('no_se:grua') && 'fl-nose--sel']" :aria-pressed="p.flags.includes('no_se:grua')" @click="gruaNoSe">No sé</button>
        <p v-if="p.flags.includes('no_se:grua')" class="w-full text-xs text-neutral-600">Usamos la típica: {{ fm(eqTipico.levante) }} m y {{ eqTipico.kg.toLocaleString('es-CL') }} kg.</p>
      </div>
    </div>

    <!-- El sistema que el cliente configura manda. Si para sus productos sugerimos otro, va como una línea
         secundaria y plegada con la comparación; nunca como "recomendado" encima de lo que eligió (R3) -->
    <details v-if="mod && recModelo.productos.length && !soloSelectivo" class="fl-sugerencia mt-3">
      <summary>
        <span v-if="sugerido" class="text-neutral-800"><span class="mr-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-900">Sugerencia</span>{{ sugerido.texto }}</span>
        <span v-else class="text-neutral-700"><span class="mr-1 text-brand-600" aria-hidden="true">✓</span>{{ TIPOS[mod.tipo].nombre }} es lo que recomendamos para estos productos</span>
        <span class="ml-1 whitespace-nowrap font-semibold text-brand-700">{{ sugerido ? 'Ver comparación' : 'Ver por qué' }}</span>
      </summary>
      <div class="mt-3">
        <FlujoRecomendacion :rec="recModelo" :actual="mod.tipo" />
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button v-if="sugerido" type="button" class="fl-btn !min-h-10 !px-4 !text-sm" @click="usarSugerido">Cambiar a {{ TIPOS[sugerido.tipo].nombre.toLowerCase() }}</button>
          <span class="text-sm text-neutral-500">Ingeniería Racklog lo valida antes de cotizar.</span>
        </div>
      </div>
    </details>

    <!-- Modelos (si tiene mas de uno) -->
    <div v-if="p.modelos.length > 1" class="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Modelos de rack">
      <button
        v-for="m in p.modelos" :key="m.id" type="button" role="tab" :aria-selected="m.id === mod?.id"
        :class="['fl-chip !min-h-10 !w-auto !px-4 !text-sm', m.id === mod?.id && 'fl-chip--sel']" @click="p.modeloSel = m.id"
      >{{ m.nombre }}</button>
    </div>

    <p v-if="copiaDe && copiaDe.id === mod?.id" class="mt-2 text-sm text-neutral-600" role="status">Copia de {{ copiaDe.de }}: repartimos tus {{ mod?.tipo === 'AR' ? 'cajas' : 'pallets' }} mitad y mitad. Cambia lo que quieras; el original no se toca.</p>

    <!-- Estantería recién agregada desde Revisa (sin cantidades): lo primero es decir qué va en ella -->
    <section v-if="mod && mod.tipo !== 'AR' && p.modelos.length > 1 && catalogo.length && !totalModelo" class="fl-card mt-4 bg-brand-50/60 !outline-brand-200" aria-live="polite">
      <p class="font-semibold text-neutral-900">¿Cuántos pallets van en el {{ mod.nombre.toLowerCase() }}?</p>
      <div class="mt-2 grid gap-2 sm:grid-cols-2">
        <label v-for="t in catalogo" :key="t.id" class="flex items-center justify-between gap-3 text-sm text-neutral-800">
          <span class="truncate">{{ t.nombre }}</span>
          <input :value="mod.cantidades[t.id] || ''" type="number" min="0" step="1" inputmode="numeric" placeholder="0" class="form-input !h-10 !w-24 text-right" @change="cambiarCantidad(t.id, $event)">
        </label>
      </div>
      <p class="mt-2 text-sm text-neutral-600">¿Es otro pallet? <button type="button" class="font-semibold text-brand-700 underline" @click="emit('atras')">Agrégalo en el paso anterior</button>.</p>
    </section>

    <!-- Ángulo ranurado: configurador propio (estante → caja → cuántas caben por módulo) -->
    <template v-if="mod && res && mod.tipo === 'AR'">
      <!-- Con selectivo elegido (o un ángulo agregado desde Revisa) no se cambia de sistema aquí -->
      <div v-if="!soloSelectivo && p.modelos.length === 1" class="mt-3 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
        <span>Sistema:</span>
        <span class="inline-flex rounded-lg bg-neutral-100 p-0.5" role="group" aria-label="Sistema">
          <button v-for="(t, k) in TIPOS" :key="k" type="button" :class="['h-8 rounded-md px-2.5 text-sm font-semibold', mod.tipo === k ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" :aria-pressed="mod.tipo === k" @click="cambiarSistema(k as Sistema)">{{ t.nombre }}</button>
        </span>
      </div>
      <FlujoConfiguradorAR :modelo="mod" @cambio="cambiar" />
    </template>

    <!-- Si su pallet es el de ejemplo (llegó desde cajas o no lo definió), se dice y se le lleva a definirlo -->
    <p v-if="mod && mod.tipo !== 'AR' && palletEjemplo" class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-950 ring-1 ring-amber-200" role="status">
      <span class="min-w-0 flex-1"><b>Pallet de ejemplo</b>: {{ fm(palletEjemplo.frente) }} × {{ fm(palletEjemplo.fondo) }} m, {{ fm(palletEjemplo.alto) }} m de alto, {{ n(palletEjemplo.peso) }} kg.</span>
      <button type="button" class="rounded-lg bg-white px-3 py-1.5 font-semibold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100" @click="emit('atras')">Definir mi pallet</button>
    </p>

    <!-- El rack es lo principal (grande, a la izquierda) y se arma tocándolo; la configuración va al costado -->
    <div v-if="mod && res && mod.tipo !== 'AR'" class="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section class="fl-card">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-lg font-bold text-neutral-900">Tu {{ TIPOS[mod.tipo].nombre.toLowerCase() }}</p>
          <div class="flex gap-1 rounded-lg bg-neutral-100 p-0.5" role="tablist" aria-label="Vista del rack">
            <button v-for="v in VISTAS_RACK" :key="v.v" type="button" role="tab" :aria-selected="vistaRack === v.v" :class="['rounded-md px-2.5 py-1.5 text-sm font-medium', vistaRack === v.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600']" @click="vistaRack = v.v as typeof vistaRack">{{ v.t }}</button>
          </div>
        </div>
        <!-- Lo básico siempre a la vista, sobre el dibujo -->
        <dl class="mt-3 grid grid-cols-3 gap-2">
          <div v-if="mod.tipo !== 'DI'" class="fl-dato"><dt>Pallets por cuerpo <FlujoInfo>Cuerpo: el espacio entre dos marcos, con sus niveles.</FlujoInfo></dt><dd><FlujoContador :valor="res.porCuerpo" /></dd></div>
          <div v-if="mod.tipo !== 'DI'" class="fl-dato">
            <dt>Cuerpos que necesitas</dt>
            <dd><FlujoContador :valor="res.cuerpos" /></dd>
            <p class="text-xs text-neutral-500">{{ mod.doble ? `${res.modulos} por lado · ` : '' }}guardan {{ n(res.capacidad) }} de {{ n(res.total) }}</p>
          </div>
          <div class="fl-dato"><dt>Alto con la carga</dt><dd>{{ fm(res.alto) }} m</dd><p class="text-xs text-neutral-500">marco {{ fm(res.m.alto) }} m</p></div>
        </dl>
        <FlujoRackInteractivo
          v-if="vistaRack === 'frente' && mod.tipo === 'RS'" class="mt-3"
          :m="res.m" :mezcla="res.r.mezcla" :tipos="tiposModelo" :niveles="mod.niveles" :max-niveles="maxNiveles" :limite="limite"
          :techo="p.bodega.altura" :levante="equipoCliente.levante" :vigas-manuales="!!mod.vigasY?.length"
          @mezcla="cambiar({ mezcla: $event })" @vigas="cambiar({ vigasY: $event })" @niveles="cambiar({ niveles: $event, mezcla: [], vigasY: null })" @acomodar="acomodar"
        />
        <FlujoElevacionDriveIn v-if="vistaRack === 'frente' && mod.tipo === 'DI'" :m="res.m" class="mx-auto mt-3 max-w-md" />
        <!-- Lo que levanta la grúa en el nivel más alto (capacidad residual): mientras más sube, menos kg -->
        <p v-if="gruaArriba" :class="['mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-xl px-3 py-2 text-sm ring-1', gruaArriba.ok ? 'bg-teal-50/70 text-teal-950 ring-teal-100' : 'bg-red-50 text-red-950 ring-red-200']" role="status">
          <span>A <b>{{ fm(gruaArriba.y) }} m</b> (tu nivel más alto) tu grúa levanta <b class="text-base tabular-nums">~{{ n(gruaArriba.puede) }} kg</b>{{ gruaArriba.puede < gruaArriba.nominal ? `, no los ${n(gruaArriba.nominal)} kg de placa` : ' (su máximo)' }}.</span>
          <span v-if="gruaArriba.kg" :class="gruaArriba.ok ? 'text-teal-800' : 'font-semibold'">Tu pallet: {{ n(gruaArriba.kg) }} kg{{ gruaArriba.ok ? '' : ' (no lo levanta: deja los pesados abajo o baja un nivel)' }}</span>
        </p>
        <FlujoLateralRack v-if="vistaRack === 'lado' && mod.tipo === 'RS'" :m="res.m" class="mx-auto mt-3 max-w-md" />
        <FlujoPlantaRack v-if="(vistaRack === 'planta' || (vistaRack === 'lado' && mod.tipo !== 'RS'))" :m="mod.tipo === 'DI' ? { ...res.m, calles: res.cuerpos } : res.m" class="mx-auto mt-3 max-w-md" />
        <!-- Drive-in: un solo resultado claro (por calle, calles y ancho total) y la regla de un producto por calle -->
        <div v-if="mod.tipo === 'DI'" class="mt-3 rounded-xl bg-orange-50/70 px-3 py-2.5 ring-1 ring-orange-100" aria-live="polite">
          <p class="text-[15px] text-neutral-700">Caben <b class="text-3xl font-extrabold tabular-nums text-neutral-900"><FlujoContador :valor="res.porCuerpo" /></b> pallets por calle</p>
          <p class="mt-1 text-sm text-neutral-600">{{ res.m.fondos }} de fondo × {{ mod.niveles }} {{ mod.niveles === 1 ? 'nivel' : 'niveles' }} (con el piso)</p>
          <p class="mt-1.5 text-sm text-neutral-800"><b>{{ n(res.cuerpos) }} {{ res.cuerpos === 1 ? 'calle' : 'calles' }}</b> para tus {{ n(res.total) }} pallets · bloque de <b>{{ fm(anchoBloque) }} m</b> de ancho × {{ fm(res.m.fondoBloque) }} m de fondo</p>
        </div>
        <p v-if="mod.tipo === 'DI' && skus.total > 0" :class="['mt-2 rounded-xl px-3 py-2 text-sm', skus.total > res.cuerpos ? 'bg-amber-50 text-amber-950' : 'bg-neutral-50 text-neutral-700']">
          <b>Un producto por calle.</b>
          <template v-if="skus.total > res.cuerpos">{{ n(skus.total) }} productos y {{ n(res.cuerpos) }} calles: no alcanzan. <button type="button" class="font-semibold underline" @click="cambiarSistema('RS')">Ver con rack selectivo</button></template>
          <template v-else>{{ n(skus.total) }} de {{ n(res.cuerpos) }} calles ocupadas.</template>
          <template v-if="!skus.sabe"> <button type="button" class="font-semibold text-brand-700 underline" @click="emit('atras')">¿Cuántos productos distintos tienes?</button></template>
        </p>
        <p v-if="res.carga && res.carga.color !== 'verde'" :class="['mt-3 rounded-xl px-3 py-2.5 text-sm', SEMAFORO[res.carga.color as keyof typeof SEMAFORO]]">
          Tus pallets son pesados para {{ mod.tipo === 'RS' ? 'un nivel con la viga estándar' : 'cada posición' }}: ingeniería Racklog lo revisa antes de cotizar.
        </p>
        <ul v-if="avisos.length" class="mt-3 space-y-1.5 text-sm text-amber-900">
          <li v-for="(a, i) in avisos" :key="i" class="rounded-lg bg-amber-50 px-3 py-2">{{ a }}</li>
        </ul>
      </section>

      <aside class="fl-card fl-secciones lg:self-start">
        <!-- Sistema: si eligió selectivo no se ofrecen drive-in ni ángulo ranurado (revisión 27-10) -->
        <fieldset v-if="!soloSelectivo">
          <legend class="fl-leyenda">Sistema</legend>
          <div class="mt-2 grid grid-cols-3 gap-2">
            <button v-for="(t, k) in TIPOS" :key="k" type="button" :class="['fl-chip !text-sm', mod.tipo === k && 'fl-chip--sel']" :aria-pressed="mod.tipo === k" @click="cambiarSistema(k as Sistema)">{{ t.nombre }}</button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="fl-leyenda">Pallets en este rack</legend>
          <div class="mt-2 space-y-2">
            <label v-for="t in catalogo" :key="t.id" class="flex items-center justify-between gap-3">
              <span class="flex min-w-0 items-center gap-2 text-neutral-800">
                <span v-if="'color' in t" class="h-3 w-3 flex-shrink-0 rounded" :style="{ background: (t as any).color }" aria-hidden="true" />
                <span class="truncate">{{ t.nombre }}</span>
                <span class="flex-shrink-0 text-sm text-neutral-500">· {{ fm((t as any).alto) }} m</span>
              </span>
              <input :value="mod.cantidades[t.id] ?? 0" type="number" min="0" step="1" inputmode="numeric" class="form-input !h-10 !w-24 text-right" @change="cambiarCantidad(t.id, $event)">
            </label>
            <p v-if="!catalogo.length" class="text-sm text-neutral-600">
              Primero agrega tus pallets en el paso anterior.
              <button type="button" class="font-semibold text-brand-700 underline" @click="emit('atras')">Volver</button>
            </p>
          </div>
        </fieldset>

        <fieldset>
          <legend class="fl-leyenda">Cómo lo armas</legend>
          <div class="mt-2 space-y-4">
            <div v-if="mod.tipo === 'RS'">
              <p class="fl-sub">Pallets por nivel</p>
              <div class="mt-2 grid grid-cols-3 gap-2">
                <button v-for="k in [1, 2, 3]" :key="k" type="button" :class="['fl-chip', (mod.porViga ?? 2) === k && 'fl-chip--sel']" :aria-pressed="(mod.porViga ?? 2) === k" @click="cambiar({ porViga: k })">{{ k }}</button>
              </div>
            </div>
            <div v-if="mod.tipo !== 'DI'">
              <p class="fl-sub">Simple o doble <FlujoInfo>Doble = dos racks espalda con espalda: comparten el pasillo y ganas posiciones.</FlujoInfo></p>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button type="button" :class="['fl-chip', !mod.doble && 'fl-chip--sel']" :aria-pressed="!mod.doble" @click="cambiar({ doble: false })">Simple</button>
                <button type="button" :class="['fl-chip', mod.doble && 'fl-chip--sel']" :aria-pressed="mod.doble" @click="cambiar({ doble: true })">Doble</button>
              </div>
            </div>
            <!-- Viga a piso: la pide el equipo (apiladores, retráctil; por confirmar), el cliente puede cambiarla -->
            <div v-if="mod.tipo === 'RS'">
              <p class="fl-sub">Primer nivel <FlujoInfo>Con apilador o grúa retráctil las patas del equipo pasan bajo el primer nivel, así que no va al piso: va sobre una viga a unos 30 cm. Ingeniería Racklog lo confirma con tu equipo.</FlujoInfo></p>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button type="button" :class="['fl-chip !text-sm', !res.m.vigaPiso && 'fl-chip--sel']" :aria-pressed="!res.m.vigaPiso" @click="cambiar({ vigaPiso: false, vigasY: null })">En el piso</button>
                <button type="button" :class="['fl-chip !text-sm', res.m.vigaPiso && 'fl-chip--sel']" :aria-pressed="res.m.vigaPiso" @click="cambiar({ vigaPiso: true, vigasY: null })">Viga a piso</button>
              </div>
              <p v-if="vigaPisoEquipo" class="mt-1 text-xs text-neutral-500">Con tu {{ eqTipico.nombre.toLowerCase() }} va viga a piso<FlujoReferencial /></p>
            </div>
            <div v-if="mod.tipo === 'DI'">
              <p class="fl-sub">Pallets uno detrás de otro <span class="font-normal text-neutral-500">(fondo de la calle)</span> <FlujoInfo>En un drive-in la grúa entra a un pasillo interno, la "calle", y deja los pallets uno detrás de otro sobre los "carriles" (los rieles de cada lado).</FlujoInfo></p>
              <FlujoNumero :valor="mod.fondos ?? 5" :min="2" :max="12" etiqueta="Pallets de fondo" @cambio="cambiar({ fondos: $event })" />
            </div>
            <div v-if="mod.tipo === 'DI'">
              <p class="fl-sub">Niveles, contando el piso <FlujoInfo>En drive-in el piso también guarda: la grúa deja los pallets de atrás hacia adelante. Con 3 niveles son el piso y 2 carriles.</FlujoInfo></p>
              <FlujoNumero :valor="mod.niveles" :min="1" :max="maxNiveles" etiqueta="Niveles" @cambio="cambiar({ niveles: $event, mezcla: [], vigasY: null })" />
              <p class="mt-1 text-xs text-neutral-500">Máximo {{ maxNiveles }} por {{ limite }}.</p>
            </div>
          </div>

          <details class="fl-mas mt-3">
            <summary>Más opciones</summary>
            <div v-if="mod.tipo === 'RS'" class="mt-4 space-y-5">
              <label class="fl-campo">
                <span>Marco sobre la última viga: {{ Math.round((mod.sobrante ?? 0.3) * 1000) }} mm</span>
                <input :value="mod.sobrante ?? 0.3" type="range" min="0.3" max="1" step="0.05" class="w-full accent-brand-600" @input="cambiar({ sobrante: Number(($event.target as HTMLInputElement).value) })">
                <em class="text-sm not-italic text-neutral-500">De 300 a 1.000 mm.</em>
              </label>
              <div>
                <label class="flex items-center gap-2 text-neutral-800">
                  <!-- Al medio de cada fila (en la punta no sirve) y con el paso que pide el equipo de la bodega -->
                  <input type="checkbox" :checked="!!mod.tunel" class="h-4 w-4 accent-brand-600" @change="cambiar({ tunel: ($event.target as HTMLInputElement).checked ? { cuerpo: null, altoLibre: altoTunelGrua(p.bodega.grua) } : null })">
                  Cuerpo túnel (para pasar por debajo)
                </label>
                <template v-if="mod.tunel">
                  <p class="mt-2 text-sm text-neutral-700">¿Quién pasa por debajo?</p>
                  <div class="mt-1 grid grid-cols-2 gap-2">
                    <button v-for="a in ALTOS_TUNEL" :key="a.v" type="button" :class="['fl-chip !min-h-11 !flex-col !gap-0 !text-sm leading-tight', Math.abs(mod.tunel.altoLibre - a.v) < 0.01 && 'fl-chip--sel']" :aria-pressed="Math.abs(mod.tunel.altoLibre - a.v) < 0.01" @click="cambiar({ tunel: { ...mod.tunel, altoLibre: a.v } })"><b>{{ a.t }}</b><span class="text-xs font-normal">paso {{ fm(a.v) }} m</span></button>
                  </div>
                  <p class="mt-2 text-xs text-neutral-500">Va al medio de la fila; en el paso 5 lo mueves.</p>
                  <p v-if="res && res.m.tunel && (res.m.tunel.libreReal ?? res.m.tunel.altoLibre) < altoTunelGrua(p.bodega.grua) - 0.01" class="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
                    Bajo la viga quedan {{ fm(res.m.tunel.libreReal ?? res.m.tunel.altoLibre) }} m: pasan personas, pero tu {{ (GRUAS as any)[p.bodega.grua]?.nombre?.toLowerCase() ?? 'equipo' }} necesita ~{{ fm(altoTunelGrua(p.bodega.grua)) }} m.
                    <button type="button" class="font-semibold underline" @click="cambiar({ tunel: { ...mod.tunel, altoLibre: altoTunelGrua(p.bodega.grua) } })">Usar {{ fm(altoTunelGrua(p.bodega.grua)) }} m</button>
                  </p>
                  <p v-if="res && res.m.tunel" class="mt-1 text-xs text-neutral-500">El túnel quita {{ res.m.tunel.quitadas * res.m.palletsPorViga * (mod.doble ? 2 : 1) }} posiciones por fila.</p>
                </template>
              </div>
              <div>
                <p class="fl-sub">Plano de carga por nivel</p>
                <ol class="mt-2 space-y-2">
                  <li v-for="i in mod.niveles" :key="i" class="flex items-center gap-3">
                    <span class="w-16 text-sm text-neutral-600">Nivel {{ i }}</span>
                    <select :value="res.r.planos?.[i] ?? ''" class="form-input" @change="plano(i, ($event.target as HTMLSelectElement).value)">
                      <option value="">Sin plano (pallet sobre vigas)</option>
                      <option value="malla">Malla</option>
                      <option value="madera">Madera</option>
                      <option value="metal">Bandeja metálica</option>
                    </select>
                  </li>
                </ol>
              </div>
            </div>
            <div v-else class="mt-4">
              <PlanificadorGruaDriveIn :rack="res.r" :abierto="true" @cambio="cambiar($event as any)" />
            </div>
          </details>
        </fieldset>

        <details class="fl-mas">
          <summary>Ver detalle técnico</summary>
          <!-- La cuenta a la vista: de dónde salen viga y marco (sin perfiles internos ni capacidades por par) -->
          <p v-if="mod.tipo === 'RS'" class="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm leading-relaxed text-neutral-600">
            Viga = {{ res.m.palletsPorViga }} × {{ fm(res.m.pallet.frente) }} + {{ res.m.palletsPorViga + 1 }} × {{ fm(RACK.holguraViga.valor) }} = <b class="text-neutral-800">{{ fm(res.m.viga) }} m</b><br>
            Fondo del marco = {{ fm(res.m.pallet.fondo) }} − 2 × {{ fm(RACK.voladizoPallet.valor) }} = <b class="text-neutral-800">{{ fm(res.m.fondo) }} m</b><br>
            Ingeniería Racklog define la viga final para {{ n(res.m.kgPallet) }} kg por pallet.
            <span class="block text-xs text-neutral-500">Niveles de a {{ Math.round(RACK.pasoPerforado.valor * 10000) / 10 }} mm.</span>
          </p>
          <p v-if="res.carga" class="mt-3 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
            <b>Peso por nivel:</b> {{ n(res.carga.kg) }} kg{{ mod.tipo === 'RS' ? ` (${res.m.palletsPorViga} × ${n(res.carga.kg / res.m.palletsPorViga)} kg)` : '' }}
          </p>
          <!-- Corte contra el techo: holgura y si cabe un nivel más (componente del planificador) -->
          <PlanificadorCorteRack :rack="res.r" :altura="p.bodega.altura" class="mt-3" />
          <p class="mt-2 text-xs text-neutral-500">Preliminar: lo valida ingeniería Racklog (NCh2369 · ANSI MH16.1).</p>
        </details>
      </aside>
    </div>

    <div class="mt-6 flex flex-wrap gap-2">
      <button type="button" class="fl-agregar !w-auto px-4" @click="nuevo">+ Otro modelo de rack</button>
      <!-- Copia editable del modelo (p. ej. el mismo rack con marcos más bajos donde el techo baja) -->
      <button v-if="mod" type="button" class="fl-agregar !w-auto px-4" @click="duplicar">Duplicar este modelo</button>
      <button v-if="mod && p.modelos.length > 1" type="button" class="fl-agregar !w-auto px-4 !text-red-700" @click="p.quitarModelo(mod.id)">Quitar este modelo</button>
    </div>


    <FlujoAcciones :deshabilitado="!valido || diSinEquipo" :motivo="diSinEquipo ? 'Tu equipo no puede trabajar en un drive-in: cambia el sistema o el equipo.' : 'Indica cuántos pallets o cajas van en el rack.'" @atras="emit('atras')" @siguiente="emit('siguiente')" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useProyecto, type Sistema, type Modelo } from '~/stores/proyecto';
import { TIPOS, gruaDriveIn } from '~/lib/rack3d/planificador.js';
import { resultadoModelo, nivelesMaximos, mezclaPorDefecto, mejorBandeja, firmaCajasAR } from '~/lib/flujo/calculos.js';
import { recomendarProductos } from '~/lib/flujo/recomendacion.js';
import { RACK, GRUAS, equipoDe, capacidadEnAltura } from '~/lib/rack3d/parametrosTecnicos.js';
import { ANRA_ANGULO_DEFECTO, huella } from '~/lib/rack3d/medidas.js';
import { ALTOS_TUNEL, altoTunelGrua } from '~/lib/rack3d/rutas.js';

const emit = defineEmits<{ siguiente: []; atras: [] }>();
const p = useProyecto();
const vistaRack = ref<'frente' | 'lado' | 'planta'>('frente');
const VISTAS_RACK = computed(() => [{ v: 'frente', t: 'Frente' }, ...(mod.value?.tipo === 'RS' ? [{ v: 'lado', t: 'Lado' }] : []), { v: 'planta', t: 'Planta' }] as const);
const SEMAFORO = { verde: 'bg-green-50 text-green-900', amarillo: 'bg-amber-50 text-amber-900', rojo: 'bg-red-50 text-red-900' } as const;
const fm = (v: number) => (+(+v).toFixed(2)).toLocaleString('es-CL');
const cm = (v: number) => Math.round(v * 100);
const n = (v: number) => Math.round(v).toLocaleString('es-CL');

// Recomendacion por producto (lib/flujo/recomendacion.js)
const rec = computed(() => recomendarProductos({ pallets: p.pallets, cajas: p.cajas, respuestas: p.respuestas, bodega: p.bodega, flags: p.flags }) as any);
const recAplicada = ref(false);
// Comparación solo de los productos de este modelo (el ángulo ranurado no compite con los de pallet)
const recModelo = computed(() => {
  if (!mod.value || mod.value.tipo === 'AR') return { productos: [] };
  const ids = Object.entries(mod.value.cantidades ?? {}).filter(([, v]) => v > 0).map(([k]) => k);
  return { productos: rec.value.productos.filter((x: any) => ids.includes(x.id)) };
});
// Otro sistema sugerido para la mayoría de los productos de este modelo: una línea con lo que ganaría
const sugerido = computed(() => {
  const otros = recModelo.value.productos.filter((x: any) => x.sistema !== mod.value?.tipo);
  if (!otros.length || otros.length * 2 < recModelo.value.productos.length) return null;
  const x = otros[0], tipo = x.sistema as Sistema;
  if (tipo === 'DI' && x.elegido && x.otra) {
    const pct = Math.round(((x.elegido.posiciones / x.elegido.m2) / (x.otra.posiciones / x.otra.m2) - 1) * 100);
    if (pct > 0) return { tipo, texto: `Con drive-in guardarías ${pct} % más pallets en el mismo piso.` };
  }
  return { tipo, texto: tipo === 'RS' ? 'Con rack selectivo llegas directo a cada pallet, sin mover otros.' : `Para estos productos sugerimos ${TIPOS[tipo].nombre.toLowerCase()}.` };
});
// Cambia este modelo al sistema sugerido (no toca los otros modelos ni lo que ya configuró en ellos)
function usarSugerido() {
  if (!sugerido.value) return;
  cambiarSistema(sugerido.value.tipo);
  marcar('recomendacion', { sistemas: sugerido.value.tipo, por_producto: true, desde: 'sugerencia' });
}
function usarRecomendacion(modelos: any[]) {
  const id = () => 'm' + Math.random().toString(36).slice(2, 9);
  p.modelos = modelos.map((m) => ({ ...JSON.parse(JSON.stringify(m)), id: id() }));
  p.modeloSel = p.modelos[0]?.id ?? null;
  p.racks = [];
  p.flags = [...new Set([...p.flags, ...rec.value.flags])];
  recAplicada.value = true;
  sincronizarCantidades();
  marcar('recomendacion', { sistemas: p.modelos.map((m) => m.tipo).join(','), por_producto: true });
}
function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planifica tu bodega', ...datos });
}

onMounted(() => {
  // Llega sin racks armados: parte con la mezcla recomendada para sus productos (si la hay)
  if (!p.modelos.length && p.respuestas && Object.keys(p.respuestas).length && rec.value.modelos.length && !p.sabe) {
    usarRecomendacion(rec.value.modelos);
    recAplicada.value = false;
  }
  if (!p.modelos.length) {
    p.agregarModelo(p.sistema ?? 'RS');
    // Si tambien guarda cajas, un ángulo ranurado aparte
    if (p.sistema !== 'AR' && p.sistema !== 'RS' && p.cajas.length) { p.agregarModelo('AR'); p.modeloSel = p.modelos[0].id; }
  }
  sincronizarCantidades();
});

const mod = computed(() => p.modeloActual as Modelo | null);
const totalModelo = computed(() => Object.values(mod.value?.cantidades ?? {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0));
// Eligió rack selectivo: en este paso (y en el 5) no se ofrecen drive-in ni ángulo ranurado
const soloSelectivo = computed(() => p.sistema === 'RS');
// Lo que alcanza su grúa (placa o típica) para la línea "tu grúa llega a" del dibujo
const equipoCliente = computed(() => equipoDe({ grua: p.bodega.grua, ...gruaDatos.value }));
const vigaPisoEquipo = computed(() => !!(GRUAS as any)[p.bodega.grua]?.vigaPiso);
const catalogo = computed(() => (mod.value?.tipo === 'AR' ? p.cajas : p.pallets) as any[]);
const tiposModelo = computed(() => p.pallets.filter((t) => (mod.value?.cantidades[t.id] ?? 0) > 0));
const res = computed(() => (mod.value ? resultadoModelo(mod.value, { pallets: p.pallets, cajas: p.cajas, grua: p.bodega.grua, gruaDatos: gruaDatos.value, ocupacion: p.bodega.ocupacion }) as any : null));
const maxNiveles = computed(() => (mod.value ? nivelesMaximos(mod.value, { pallets: p.pallets, cajas: p.cajas, altura: p.bodega.altura, grua: p.bodega.grua, gruaDatos: gruaDatos.value }) : 1));
const limite = computed(() => (mod.value?.tipo === 'AR' ? `tus cajas en un ángulo de ${fm(altoAngulo.value)} m` : p.bodega.altura ? 'tu techo y lo que levanta tu grúa (altura y peso)' : 'lo que levanta tu grúa (altura y peso)'));
// Grua del cliente: lo que dice su placa (si no la sabe, la típica de su tipo de equipo)
const gruaDatos = computed(() => ({ gruaLevante: (p.bodega as any).gruaLevante ?? null, gruaKg: (p.bodega as any).gruaKg ?? null }));
const eqTipico = computed(() => (GRUAS as any)[p.bodega.grua] ?? GRUAS.contrapeso);
const conGruaRack = computed(() => mod.value?.tipo !== 'AR' && !['transpaleta'].includes(p.bodega.grua));
function placa(campo: 'gruaLevante' | 'gruaKg', e: Event) {
  const v = Number((e.target as HTMLInputElement).value);
  (p.bodega as any)[campo] = v > 0 ? v : null;
  if (v > 0) p.flags = p.flags.filter((f) => f !== 'no_se:grua');
}
// No sabe su grúa: la típica de su tipo de equipo, marcada para que ingeniería la confirme
function gruaNoSe() {
  (p.bodega as any).gruaLevante = null; (p.bodega as any).gruaKg = null;
  p.flags = p.flags.includes('no_se:grua') ? p.flags.filter((f) => f !== 'no_se:grua') : [...p.flags, 'no_se:grua'];
}
// Drive-in: ancho total del bloque (todas las calles) y productos distintos (un producto por calle)
const anchoBloque = computed(() => (res.value && mod.value?.tipo === 'DI' ? huella({ ...res.value.m, calles: res.value.cuerpos }).largo : 0));
const skus = computed(() => {
  const tipos = p.pallets.filter((t) => (mod.value?.cantidades[t.id] ?? 0) > 0);
  return { total: tipos.reduce((a, t) => a + Math.max(1, Math.round(t.skus || 1)), 0), sabe: tipos.every((t) => t.skus && t.skus > 0) };
});
// Pallet de ejemplo (no lo definió): se muestra para que vaya a poner el suyo
const palletEjemplo = computed(() => p.pallets.find((t) => t.ejemplo && (mod.value?.cantidades[t.id] ?? 0) > 0) ?? null);
// Angulo ranurado: el alto del angulo (para el limite de niveles)
const altoAngulo = computed(() => Number((mod.value as any)?.altoAngulo) || ANRA_ANGULO_DEFECTO);
const diSinEquipo = computed(() => p.modelos.some((m) => m.tipo === 'DI') && !gruaDriveIn({ grua: p.bodega.grua }).puede);
const valido = computed(() => p.modelos.length > 0 && p.modelos.every((m) => Object.values(m.cantidades).some((v) => v > 0)));

// Tipos nuevos del catalogo: entran con su cantidad al unico modelo de su clase
function sincronizarCantidades() {
  p.modelos.forEach((m) => {
    const lista = m.tipo === 'AR' ? p.cajas : p.pallets;
    const mismos = p.modelos.filter((o) => (o.tipo === 'AR') === (m.tipo === 'AR'));
    const cantidades = { ...m.cantidades };
    lista.forEach((t) => { if (!(t.id in cantidades)) cantidades[t.id] = mismos[0].id === m.id ? t.cantidad : 0; });
    Object.keys(cantidades).forEach((k) => { if (!lista.some((t) => t.id === k)) delete cantidades[k]; });
    p.cambiarModelo(m.id, { cantidades });
    // Angulo ranurado: con cajas nuevas (o cambiadas) se propone el estante (bandeja de 400 si cabe)
    if (m.tipo === 'AR') {
      const firma = firmaCajasAR({ ...m, cantidades }, p.cajas);
      if ((m as any).propuestaAR !== firma) {
        const b = mejorBandeja({ ...m, cantidades }, { cajas: p.cajas, altura: p.bodega.altura });
        p.cambiarModelo(m.id, { ...(b ? { bandeja: b.bandeja, frente: b.frente, niveles: b.niveles, altoAngulo: b.altoAngulo, largoEnFrente: null, altoEntre: null } : {}), propuestaAR: firma });
      }
    }
  });
  // Niveles dentro de lo posible desde el inicio
  p.modelos.forEach((m) => {
    const max = nivelesMaximos(m, { pallets: p.pallets, altura: p.bodega.altura, grua: p.bodega.grua, gruaDatos: gruaDatos.value });
    if (m.niveles > max) p.cambiarModelo(m.id, { niveles: max, mezcla: [] });
  });
}

function cambiar(c: Partial<Modelo>) {
  if (!mod.value) return;
  // Si cambia lo que va en cada nivel, las vigas movidas a mano vuelven a las calculadas (la luz cambia)
  if (('mezcla' in c || 'cantidades' in c || 'porViga' in c) && !('vigasY' in c)) c = { ...c, vigasY: null };
  p.cambiarModelo(mod.value.id, c);
}
function cambiarSistema(t: Sistema) {
  if (!mod.value || mod.value.tipo === t) return;
  // Con un solo modelo, el sistema del proyecto es ese: el paso 3 pide pallets o cajas según corresponda
  if (p.modelos.length === 1) p.sistema = t;
  const lista = t === 'AR' ? p.cajas : p.pallets;
  const base = t === 'RS' ? { porViga: 2, sobrante: 0.3, doble: true, niveles: 3 } : t === 'DI' ? { fondos: 5, doble: false, niveles: 3 } : { bandeja: 0.4, frente: 0.9, altoAngulo: 2, doble: false, niveles: 4, propuestaAR: null };
  cambiar({ tipo: t, ...(base as any), mezcla: [], nombre: TIPOS[t].nombre, cantidades: Object.fromEntries(lista.map((x) => [x.id, x.cantidad])) });
  if (t === 'AR' && !p.cajas.length) { p.agregarCaja(); sincronizarCantidades(); }
  // Sin pallets: uno de ejemplo con alto y peso directos (1,2 m, 800 kg), el mismo que se avisa aquí y en el paso 3
  if (t !== 'AR' && !p.pallets.length) { p.agregarPallet({ desdeCaja: false }); sincronizarCantidades(); }
  sincronizarCantidades();
}
function cambiarCantidad(id: string, e: Event) {
  if (!mod.value) return;
  const v = Math.max(0, Math.round(Number((e.target as HTMLInputElement).value) || 0));
  cambiar({ cantidades: { ...mod.value.cantidades, [id]: v }, mezcla: [] });
  // El producto queda con lo que suman sus modelos (una sola cantidad en todo el flujo)
  const ar = mod.value.tipo === 'AR';
  const t = (ar ? p.cajas : p.pallets).find((x) => x.id === id);
  const suma = p.modelos.filter((m) => (m.tipo === 'AR') === ar).reduce((s, m) => s + (m.cantidades?.[id] ?? 0), 0);
  if (t && suma > 0) t.cantidad = suma;
}
function cambiarAltura(e: Event) {
  const v = Number((e.target as HTMLInputElement).value);
  p.bodega.altura = v >= 2.5 ? Math.min(40, v) : null;
  p.flags = p.flags.filter((f) => f !== 'no_se:altura');
  sincronizarCantidades();
}
function alturaNoSe() {
  p.bodega.altura = 8;
  p.flags = [...new Set([...p.flags, 'no_se:altura'])];
  sincronizarCantidades();
}
function acomodar() {
  if (!mod.value) return;
  cambiar({ mezcla: mezclaPorDefecto({ ...mod.value, mezcla: [] }, p.pallets) });
}
function plano(i: number, tipo: string) {
  const planos = Array.from({ length: (mod.value?.niveles ?? 0) + 1 }, (_, j) => (j === i ? tipo || null : res.value.r.planos?.[j] ?? null));
  cambiar({ planos });
}
// Nivel más alto del rack: lo que la grúa levanta ahí (curva de su placa o la típica) contra el pallet de ese nivel
const gruaArriba = computed(() => {
  if (!res.value || !mod.value || mod.value.tipo === 'AR' || !conGruaRack.value) return null;
  const m = res.value.m, alturas: number[] = (mod.value.tipo === 'DI' ? m.cartelasY : m.nivelesY) ?? [];
  if (!alturas.length) return null;
  const k = alturas.length - 1, y = alturas[k], eq = equipoCliente.value, puede = capacidadEnAltura(eq, y);
  // Con viga a piso la carga k va sobre la viga k; si no, sobre la viga k-1 (la carga 0 es el piso)
  const id = mod.value.tipo === 'RS' ? res.value.r.mezcla?.[m.piso === false ? k : k + 1] : null;
  const kg = p.pallets.find((t) => t.id === id)?.peso || Math.max(0, ...tiposModelo.value.map((t) => t.peso || 0));
  if (!(puede > 0)) return null;
  return { y, puede, kg, nominal: eq.kg, ok: !kg || kg <= puede };
});
// Si el nivel más alto no se levanta, la línea de la grúa ya lo dice: no se repite el aviso
const avisos = computed(() => ((res.value?.avisos ?? []) as string[]).filter((a) => !(gruaArriba.value && !gruaArriba.value.ok && a.includes('tu equipo levanta'))));

// Duplicar: copia independiente del modelo (otro id y nombre) con la mitad de cada producto, así la suma no cambia
const copiaDe = ref<{ id: string; de: string } | null>(null);
function duplicar() {
  const o = mod.value;
  if (!o) return;
  const base = { RS: 'Selectivo', DI: 'Drive-in', AR: 'Ángulo ranurado' }[o.tipo];
  const usados = new Set(p.modelos.map((m) => m.nombre));
  let k = p.modelos.filter((m) => m.tipo === o.tipo).length + 1, nombre = '';
  do { nombre = `${base} ${String.fromCharCode(64 + k++)}`; } while (usados.has(nombre));
  const mitad: Record<string, number> = {}, resto: Record<string, number> = {};
  Object.entries(o.cantidades).forEach(([t, v]) => { const c = Math.floor((Number(v) || 0) / 2); mitad[t] = c; resto[t] = (Number(v) || 0) - c; });
  const copia: Modelo = { ...JSON.parse(JSON.stringify(o)), id: 'm' + Math.random().toString(36).slice(2, 9), nombre, cantidades: mitad };
  // Ángulo ranurado: con la firma al día no se vuelve a proponer el estante (se pierde lo que armó)
  if (o.tipo === 'AR') copia.propuestaAR = firmaCajasAR(copia, p.cajas);
  p.cambiarModelo(o.id, { cantidades: resto, ...(o.tipo === 'AR' ? { propuestaAR: firmaCajasAR({ ...o, cantidades: resto }, p.cajas) } : {}) });
  p.modelos.splice(p.modelos.findIndex((m) => m.id === o.id) + 1, 0, copia);
  p.modeloSel = copia.id;
  copiaDe.value = { id: copia.id, de: o.nombre };
  marcar('duplicar_modelo', { sistema: o.tipo });
}
function nuevo() {
  const tipo = soloSelectivo.value ? 'RS' : mod.value?.tipo === 'RS' && p.cajas.length ? 'AR' : (mod.value?.tipo ?? 'RS');
  p.agregarModelo(tipo);
  sincronizarCantidades();
}
</script>
