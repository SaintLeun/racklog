<template>
  <svg
    ref="svgRef"
    class="h-full w-full select-none"
    :class="dibujando || trazando || agregandoCruce || pincel || herramienta === 'medir' ? 'cursor-crosshair' : (paneo ? 'cursor-grabbing' : '')"
    :viewBox="`${vista.x} ${vista.y} ${vista.w} ${vista.h}`"
    preserveAspectRatio="xMidYMid meet"
    role="application"
    aria-roledescription="plano de bodega"
    :aria-label="dibujando
      ? 'Dibujo del contorno de la bodega: haz clic en cada esquina y termina en el primer punto. También puedes escribir el largo y el ángulo de cada muro en el panel.'
      : `Plano de la bodega con ${racks.length} racks. Selecciona un rack y muévelo con las flechas; R lo gira y Suprimir lo elimina.`"
    style="touch-action: none"
    @pointerdown.capture="pincelAbajo"
    @pointerdown.self="presionarFondo"
    @pointermove="moverPuntero"
    @pointerup="soltar"
    @pointercancel="soltar"
    @pointerleave="cursorPincel = null"
    @wheel="rueda"
  >
    <defs>
      <pattern :id="`${uid}-grilla`" :width="grillaFina" :height="grillaFina" patternUnits="userSpaceOnUse">
        <path :d="`M ${grillaFina} 0 L 0 0 0 ${grillaFina}`" fill="none" stroke="#e5e7eb" :stroke-width="0.02 * grillaFina" />
      </pattern>
      <pattern :id="`${uid}-grilla5`" width="5" height="5" patternUnits="userSpaceOnUse">
        <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#d1d5db" stroke-width="0.04" />
      </pattern>
    </defs>

    <!-- Dibujando: lienzo cuadriculado; cada clic agrega una esquina -->
    <template v-if="dibujando">
      <rect
        :x="marco.x0" :y="marco.y0" :width="marco.x1 - marco.x0" :height="marco.y1 - marco.y0"
        fill="#fff" @pointerdown="presionarFondo"
      />
      <image
        v-if="calco && !cotasTodas" :href="calco.url" x="0" y="0"
        :width="calco.w * calco.escala" :height="calco.h * calco.escala"
        :opacity="calco.opacidad" preserveAspectRatio="none" pointer-events="none"
      />
      <rect :x="marco.x0" :y="marco.y0" :width="marco.x1 - marco.x0" :height="marco.y1 - marco.y0" :fill="`url(#${uid}-grilla)`" pointer-events="none" />
      <rect :x="marco.x0" :y="marco.y0" :width="marco.x1 - marco.x0" :height="marco.y1 - marco.y0" :fill="`url(#${uid}-grilla5)`" pointer-events="none" />
      <!-- Guias de alineacion con otras esquinas -->
      <line
        v-for="(g, i) in guias" :key="`g${i}`"
        :x1="g.x1" :y1="g.y1" :x2="g.x2" :y2="g.y2"
        stroke="#0ea5e9" stroke-width="1" vector-effect="non-scaling-stroke" stroke-dasharray="4 3" pointer-events="none"
      />
      <polyline
        v-if="puntosDibujo.length"
        :points="[...puntosDibujo, ...(cursorDib ? [cursorDib] : [])].map((p) => `${p.x},${p.y}`).join(' ')"
        fill="rgba(234, 88, 12, 0.08)" stroke="#374151" stroke-width="0.15" stroke-linejoin="round" pointer-events="none"
      />
      <circle
        v-for="(p, i) in puntosDibujo" :key="i"
        :cx="p.x" :cy="p.y" :r="(i === 0 && puntosDibujo.length >= 3 ? 0.45 : 0.25) * k"
        :fill="i === 0 && puntosDibujo.length >= 3 ? '#ea580c' : '#374151'"
        @pointerdown.stop="i === 0 && puntosDibujo.length >= 3 ? emit('cerrar-contorno') : presionarFondo($event)"
      />
      <!-- Metros escritos: el muro queda de ese largo hacia donde apunta el cursor (Enter lo fija) -->
      <g v-if="cursorDib && largoEscrito && cursorDib !== cursor" pointer-events="none">
        <circle :cx="cursorDib.x" :cy="cursorDib.y" :r="0.25 * k" fill="#ea580c" />
        <text :x="cursorDib.x + 0.5 * k" :y="cursorDib.y - 0.5 * k" v-bind="TEXTO_COTA" :font-size="14 * mpp" fill="#c2410c" text-anchor="start">{{ formatoM(largoEscrito) }} m · Enter para fijar</text>
      </g>
      <template v-if="cursor">
        <circle :cx="cursor.x" :cy="cursor.y" :r="0.18 * k" fill="#ea580c" pointer-events="none" />
        <!-- Ajuste activo: esquina o punto medio -->
        <rect
          v-if="ajuste" :x="cursor.x - 0.35 * k" :y="cursor.y - 0.35 * k" :width="0.7 * k" :height="0.7 * k"
          fill="none" stroke="#0ea5e9" stroke-width="1.5" vector-effect="non-scaling-stroke" pointer-events="none"
          :transform="ajuste === 'medio' ? `rotate(45 ${cursor.x} ${cursor.y})` : ''"
        />
        <text
          v-if="textoCursor && !largoEscrito" :x="cursor.x + 0.5 * k" :y="cursor.y - 0.5 * k"
          v-bind="TEXTO_COTA" fill="#0369a1" text-anchor="start"
        >{{ textoCursor }}</text>
      </template>
      <!-- Largo de cada muro mientras se dibuja (el ultimo hasta el cursor) -->
      <text
        v-for="(m, i) in murosDibujo" :key="`md${i}`"
        :x="m.tx" :y="m.ty" :transform="`rotate(${m.ang} ${m.tx} ${m.ty})`"
        v-bind="TEXTO_COTA" text-anchor="middle" dominant-baseline="central"
      >{{ formatoM(m.largo) }} m</text>
    </template>

    <template v-else>
      <!-- Piso y muros -->
      <path :d="trazo" fill="#fff" @pointerdown="presionarFondo" />
      <image
        v-if="calco && !cotasTodas" :href="calco.url" x="0" y="0"
        :width="calco.w * calco.escala" :height="calco.h * calco.escala"
        :opacity="calco.opacidad * 0.6" preserveAspectRatio="none" pointer-events="none"
      />
      <path :d="trazo" :fill="`url(#${uid}-grilla)`" pointer-events="none" />
      <path :d="trazo" :fill="`url(#${uid}-grilla5)`" pointer-events="none" />
      <path :d="trazo" fill="none" stroke="#374151" stroke-width="0.2" stroke-linejoin="round" pointer-events="none" />
      <!-- Muro seleccionado para editar su largo -->
      <line
        v-if="muroSel !== null && muroSel !== undefined && ladoSel"
        :x1="ladoSel.a.x" :y1="ladoSel.a.y" :x2="ladoSel.b.x" :y2="ladoSel.b.y"
        stroke="#0ea5e9" stroke-width="0.35" stroke-linecap="round" pointer-events="none"
      />

      <!-- Pasillos: el espacio frente a cada cara de carga; en rojo si es mas angosto de lo que pide -->
      <rect
        v-for="p in dibujando ? [] : franjas" :key="`p-${p.id}`"
        :x="p.f.x0" :y="p.f.y0" :width="p.f.x1 - p.f.x0" :height="p.f.y1 - p.f.y0"
        :fill="p.ok ? '#14b8a6' : '#ef4444'" :fill-opacity="p.ok ? 0.08 : 0.16" pointer-events="none"
      />
      <!-- Qué es el área de color (dueño 27-10): "pasillo grúa 3,2 m"; si es angosto, cuánto pide y cuánto queda -->
      <template v-if="!dibujando && !cotasTodas">
        <text
          v-for="t in textosPasillo" :key="`pt-${t.id}`" :x="t.x" :y="t.y" v-bind="TEXTO_COTA" :fill="t.ok ? '#0f766e' : '#b91c1c'"
          text-anchor="middle" dominant-baseline="central" :transform="t.vertical ? `rotate(-90 ${t.x} ${t.y})` : undefined"
        >{{ t.texto }}</text>
      </template>

      <!-- Pilares, portones, andenes, oficinas y zonas bloqueadas -->
      <g
        v-for="el in bodega.elementos ?? []" :key="el.id"
        class="plan-rack outline-none" :class="herramienta === 'medir' ? '' : 'cursor-move'"
        style="touch-action: none" tabindex="0" role="button"
        :aria-label="`${ELEMENTOS[el.clase].nombre} de ${formatoM(el.ancho)} × ${formatoM(el.alto)} m`"
        :aria-pressed="elementoSel === el.id"
        @pointerdown.stop="herramienta === 'medir' || trazando ? presionarFondo($event) : agregandoCruce && el.clase === 'pasilloPeatonal' ? cruce($event, el) : iniciarArrastre($event, { tipo: 'elemento', id: el.id, x: el.x, y: el.y })"
        @keydown="tecladoElemento($event, el)"
        @focus="!trazando && !agregandoCruce && emit('seleccionar-elemento', el.id)"
      >
        <template v-for="d in [dibujoElemento(el)]" :key="d.clave">
          <!-- Pilar: es chico; se toma con el dedo desde un área invisible de ~28 px -->
          <rect
            v-if="el.clase === 'pilar'" :x="el.x - Math.max(el.ancho / 2, 14 * mpp)" :y="el.y - Math.max(el.alto / 2, 14 * mpp)"
            :width="Math.max(el.ancho, 28 * mpp)" :height="Math.max(el.alto, 28 * mpp)" fill="transparent"
          />
          <!-- Base -->
          <rect
            v-bind="rectSvg(el)"
            :fill="d.relleno" :fill-opacity="d.opacidad"
            :stroke="enSeleccion(el) ? '#0f172a' : d.borde"
            :stroke-width="enSeleccion(el) ? (el.clase === 'pilar' ? 3 * mpp : 0.12) : d.grosor"
            :stroke-dasharray="d.punteado"
          />
          <!-- Detalle por clase -->
          <path v-if="d.trazo" :d="d.trazo" :stroke="d.borde" :stroke-width="d.grosorTrazo" fill="none" pointer-events="none" :stroke-dasharray="d.trazoPunteado" />
          <path v-if="d.relleno2" :d="d.relleno2" :fill="d.color2" pointer-events="none" />
          <text
            v-if="d.etiqueta && Math.min(el.ancho, el.alto) >= 14 * mpp && Math.max(el.ancho, el.alto) >= d.etiqueta.length * 7 * mpp"
            :x="el.x" :y="el.y" v-bind="TEXTO_COTA"
            :fill="d.borde" text-anchor="middle" dominant-baseline="central"
            :transform="el.alto > el.ancho * 1.6 ? `rotate(-90 ${el.x} ${el.y})` : undefined"
          >{{ d.etiqueta }}</text>
        </template>
      </g>

      <!-- Cruces (aberturas) de los pasillos peatonales -->
      <template v-for="el in (bodega.elementos ?? []).filter((e) => e.clase === 'pasilloPeatonal' && e.aberturas?.length)" :key="`ab-${el.id}`">
        <rect v-for="(a, j) in el.aberturas" :key="j" v-bind="rectAbertura(el, a)" fill="#fff" fill-opacity="0.85" stroke="#16a34a" stroke-width="0.04" stroke-dasharray="0.15 0.1" pointer-events="none" />
      </template>
      <!-- Manillas del pasillo seleccionado: extremos (largo) y borde (ancho). Se ve un punto chico; el área
           que se toca es invisible y de 44 px para el dedo -->
      <g v-if="pasilloSel && !dibujando && !trazando && !agregandoCruce">
        <g
          v-for="h in manillas(pasilloSel)" :key="h.tipo"
          class="cursor-grab" style="touch-action: none" role="slider" :aria-label="h.tipo === 'ancho' ? 'Ancho del pasillo' : 'Extremo del pasillo'"
          @pointerdown.stop="tomarManilla($event, pasilloSel, h.tipo)"
        >
          <circle :cx="h.x" :cy="h.y" :r="radioManilla" fill="transparent" />
          <circle
            :cx="h.x" :cy="h.y" :r="radioManilla * 0.32"
            :fill="h.tipo === 'ancho' ? '#0ea5e9' : '#16a34a'" stroke="#fff" :stroke-width="radioManilla * 0.1" pointer-events="none"
          />
        </g>
      </g>

      <!-- Recorrido de la grúa: del andén o portón a cada pasillo de carga (punteado con flechas); en rojo los
           pasillos a los que no llega -->
      <g v-if="recorridos && !dibujando" pointer-events="none">
        <template v-for="ru in recorridos.rutas" :key="`ru-${ru.id}`">
          <template v-if="ru.llega && ru.puntos.length > 1">
            <polyline :points="ru.puntos.map((q) => `${q.x},${q.y}`).join(' ')" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity="0.8" />
            <polyline :points="ru.puntos.map((q) => `${q.x},${q.y}`).join(' ')" fill="none" stroke="#b45309" stroke-width="2.5" stroke-dasharray="7 5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
            <path v-for="(f, j) in flechasRuta(ru.puntos)" :key="j" :d="f" fill="#b45309" />
          </template>
          <rect
            v-else-if="!ru.llega && ru.franja" :x="ru.franja.x0" :y="ru.franja.y0" :width="ru.franja.x1 - ru.franja.x0" :height="ru.franja.y1 - ru.franja.y0"
            fill="#dc2626" fill-opacity="0.07" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"
          />
          <text
            v-if="!ru.llega && ru.franja && Math.max(ru.franja.x1 - ru.franja.x0, ru.franja.y1 - ru.franja.y0) > 3"
            :x="(ru.franja.x0 + ru.franja.x1) / 2" :y="(ru.franja.y0 + ru.franja.y1) / 2" v-bind="TEXTO_COTA" fill="#b91c1c" text-anchor="middle" dominant-baseline="central"
            :transform="ru.franja.y1 - ru.franja.y0 > ru.franja.x1 - ru.franja.x0 ? `rotate(-90 ${(ru.franja.x0 + ru.franja.x1) / 2} ${(ru.franja.y0 + ru.franja.y1) / 2})` : undefined"
          >La grúa no llega aquí</text>
        </template>
        <g v-for="(a, j) in recorridos.andenes" :key="`an-${j}`">
          <circle :cx="a.x" :cy="a.y" :r="9 * mpp" fill="#b45309" stroke="#fff" :stroke-width="2 * mpp" />
          <path :d="`M${a.x - 3.5 * mpp} ${a.y - 4 * mpp}l${7 * mpp} ${4 * mpp}l${-7 * mpp} ${4 * mpp}z`" fill="#fff" />
        </g>
      </g>

      <!-- Racks -->
      <g
        v-for="(r, i) in racks"
        :key="r.id"
        class="plan-rack cursor-move outline-none"
        style="touch-action: none"
        tabindex="0"
        :data-rack="r.id"
        role="button"
        :aria-label="`${i + 1}: ${describir(r)}${conflictos.has(r.id) ? ', superpuesto o fuera de la bodega' : ''}`"
        :aria-pressed="seleccion === r.id"
        @pointerdown.stop="herramienta === 'medir' || trazando ? presionarFondo($event) : iniciarArrastre($event, { tipo: 'rack', id: r.id, x: r.x, y: r.y })"
        @keydown="teclado($event, r)"
        @focus="!trazando && !agregandoCruce && enfocar($event, r.id)"
        @blur="focoTeclado = null"
      >
        <template v-for="f in [figura(r)]" :key="f.clave">
          <rect
            :x="f.x0" :y="f.y0" :width="f.ancho" :height="f.alto"
            :fill="conflictos.has(r.id) ? '#fee2e2' : (r.existente ? '#f1f5f9' : colorDe(r).fondo)"
            :stroke="conflictos.has(r.id) ? '#dc2626' : (seleccion === r.id ? '#0f172a' : (r.existente ? '#94a3b8' : colorDe(r).borde))"
            :stroke-dasharray="r.existente ? '0.25 0.15' : undefined"
            :stroke-width="seleccion === r.id ? 0.12 : 0.06"
          />
          <path v-if="f.tunel" :d="f.tunel" fill="#e0f2fe" stroke="#0284c7" stroke-width="0.03" pointer-events="none" />
          <!-- Vigas de túnel (reforzadas) en las dos caras del cuerpo túnel -->
          <line v-for="(l, j) in f.vigasTunel" :key="`vt${j}`" :x1="l[0]" :y1="l[1]" :x2="l[2]" :y2="l[3]" stroke="#0369a1" :stroke-width="Math.max(0.09, 3 * mpp)" stroke-linecap="square" pointer-events="none" />
          <path v-if="f.pallets" :d="f.pallets" fill="#fff" fill-opacity="0.85" :stroke="colorDe(r).linea" stroke-width="0.025" pointer-events="none" />
          <path v-if="f.vigas" :d="f.vigas" fill="none" :stroke="colorDe(r).borde" :stroke-width="Math.max(0.05, 1.5 * mpp)" pointer-events="none" />
          <path v-if="f.marcos" :d="f.marcos" :fill="colorDe(r).borde" pointer-events="none" />
          <!-- Posiciones que se pierden por un pilar (dentro o tapando la entrada): tachadas -->
          <path v-if="f.perdidos" :d="f.perdidos" fill="#e2e8f0" stroke="#64748b" stroke-width="0.025" pointer-events="none" />
          <path v-if="f.tachas" :d="f.tachas" fill="none" stroke="#64748b" :stroke-width="Math.max(0.03, 1.2 * mpp)" pointer-events="none" />
          <!-- Divisiones (cuerpos, calles o filas) -->
          <line
            v-for="(l, j) in f.lineas" :key="j"
            :x1="l[0]" :y1="l[1]" :x2="l[2]" :y2="l[3]"
            :stroke="colorDe(r).linea" stroke-width="0.03" pointer-events="none"
          />
          <line
            v-if="f.entrada"
            :x1="f.entrada[0]" :y1="f.entrada[1]" :x2="f.entrada[2]" :y2="f.entrada[3]"
            :stroke="COLOR[r.tipo].borde" stroke-width="0.14" stroke-dasharray="0.3 0.15" pointer-events="none"
          />
          <text
            v-if="Math.min(f.ancho, f.alto) >= 15 * mpp"
            :x="f.x0 + f.ancho / 2" :y="f.y0 + f.alto / 2"
            text-anchor="middle" dominant-baseline="central"
            :font-size="13 * mpp"
            font-weight="700" font-family="Inter, Arial, sans-serif" fill="#1f2937" pointer-events="none"
          >{{ etiquetas?.[r.modelo as string] ? `${etiquetas[r.modelo as string]}${i + 1}` : i + 1 }}</text>
          <!-- Foco de teclado: borde de 2 px de pantalla, sin importar el zoom del plano -->
          <rect
            v-if="focoTeclado === r.id"
            :x="f.x0 - 0.12" :y="f.y0 - 0.12" :width="f.ancho + 0.24" :height="f.alto + 0.24"
            fill="none" stroke="#ea580c" stroke-width="2" vector-effect="non-scaling-stroke" pointer-events="none"
          />
        </template>
      </g>

      <!-- Flechas del rack elegido: se tiran para alargarlo (extremos) o sumar filas (costados), sin números -->
      <g v-if="flechasSel" :aria-hidden="true">
        <g
          v-for="h in flechasSel" :key="h.tipo + h.s" :data-flecha="h.tipo + (h.s > 0 ? '+' : '-')"
          :class="h.tipo === 'largo' ? (h.ux ? 'cursor-ew-resize' : 'cursor-ns-resize') : (h.ux ? 'cursor-ns-resize' : 'cursor-ew-resize')"
          style="touch-action: none"
          @pointerdown.stop="tomarFlecha($event, h)"
        >
          <circle :cx="h.x" :cy="h.y" :r="22 * mpp" fill="transparent" />
          <circle :cx="h.x" :cy="h.y" :r="13 * mpp" :fill="h.tipo === 'largo' ? '#ea580c' : '#0f172a'" stroke="#fff" :stroke-width="2 * mpp" />
          <path :d="flechaManilla(h)" fill="#fff" pointer-events="none" />
        </g>
      </g>

      <!-- Guías del imán: el rack se pegó a esto -->
      <g v-if="guiasRack?.length" pointer-events="none">
        <line v-for="(g, j) in guiasRack" :key="`gi${j}`" :x1="g.x1" :y1="g.y1" :x2="g.x2" :y2="g.y2" stroke="#db2777" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-dasharray="6 4" />
      </g>

      <!-- Pilares dentro de un selectivo: se ven encima del rack (ahí se pierden esas posiciones) -->
      <g v-if="!dibujando" pointer-events="none">
        <template v-for="el in pilaresEnRacks" :key="`pr-${el.id}`">
          <rect v-bind="rectSvg(el)" fill="#475569" stroke="#fff" :stroke-width="Math.max(0.03, 1 * mpp)" />
        </template>
      </g>

      <!-- Lineal que se está dibujando con el pincel: el rack real, sus cuerpos y cuánto aporta -->
      <g v-if="previaPincel" pointer-events="none">
        <template v-for="f in [figura(previaPincel)]" :key="f.clave">
          <rect :x="f.x0" :y="f.y0" :width="f.ancho" :height="f.alto" :fill="colorDe(previaPincel).fondo" :fill-opacity="pintura ? 0.95 : 0.55" :stroke="colorDe(previaPincel).borde" :stroke-width="Math.max(0.06, 2 * mpp)" :stroke-dasharray="pintura ? undefined : `${6 * mpp} ${4 * mpp}`" />
          <path v-if="f.pallets" :d="f.pallets" fill="#fff" fill-opacity="0.85" :stroke="colorDe(previaPincel).linea" stroke-width="0.025" />
          <path v-if="f.marcos" :d="f.marcos" :fill="colorDe(previaPincel).borde" />
          <line v-for="(l, j) in f.lineas" :key="j" :x1="l[0]" :y1="l[1]" :x2="l[2]" :y2="l[3]" :stroke="colorDe(previaPincel).linea" stroke-width="0.03" />
        </template>
        <g v-if="pintura && previaPincel.texto">
          <rect :x="etiquetaPincel.x - 4 * mpp" :y="etiquetaPincel.y - 13 * mpp" :width="(previaPincel.texto.length * 7.2 + 8) * mpp" :height="26 * mpp" :rx="6 * mpp" fill="#0f172a" fill-opacity="0.9" />
          <text :x="etiquetaPincel.x" :y="etiquetaPincel.y" :font-size="13 * mpp" font-weight="700" font-family="Inter, Arial, sans-serif" fill="#fff" dominant-baseline="central">{{ previaPincel.texto }}</text>
        </g>
      </g>

      <!-- Accesorios propuestos (lib/rack3d/accesorios.js), a su tamaño real con un mínimo legible según el
           zoom (fm): canillera = pieza roja delante del pilar, por el lado del pasillo, protección de bastidor =
           arco de tubo amarillo con placas base, baranda = tubo amarillo (ajuste en naranjo) -->
      <g v-if="marcas?.length && !dibujando && !ocultarAccesorios" pointer-events="none">
        <template v-for="(mk, i) in marcas" :key="`mk-${i}`">
          <path
            v-if="mk.tipo === 'punto'" :transform="`translate(${mk.x} ${mk.y}) rotate(${anguloMarca(mk)}) scale(${fm})`"
            d="M-0.06 0.065H0.06" fill="none" stroke="#c81e1e" stroke-width="0.016" stroke-linecap="round"
          />
          <g v-else-if="mk.tipo === 'barra'">
            <line :x1="mk.x1" :y1="mk.y1" :x2="mk.x2" :y2="mk.y2" stroke="#a16207" :stroke-width="0.09 * fm" stroke-linecap="round" />
            <line :x1="mk.x1" :y1="mk.y1" :x2="mk.x2" :y2="mk.y2" stroke="#facc15" :stroke-width="0.06 * fm" stroke-linecap="round" />
          </g>
          <!-- Baranda: una linea por pieza; el ajuste en naranjo -->
          <line v-else :x1="mk.x1" :y1="mk.y1" :x2="mk.x2" :y2="mk.y2" :stroke="(mk as any).ajuste ? '#ea580c' : '#eab308'" :stroke-width="0.06 * fm" stroke-linecap="round" />
        </template>
      </g>

      <!-- Dónde conviene un túnel: un toque lo pone -->
      <g
        v-for="(t, j) in (dibujando || trazando ? [] : sugerenciasTunel ?? [])" :key="`st-${j}`"
        class="cursor-pointer" role="button" tabindex="0" :aria-label="`Poner un túnel aquí: ${textoSugerencia(t)}`"
        @pointerdown.stop @click.stop="emit('aplicar-tunel', t)" @keydown.enter.prevent="emit('aplicar-tunel', t)"
      >
        <title>Túnel aquí: {{ textoSugerencia(t) }}</title>
        <circle :cx="t.x" :cy="t.y" :r="12 * mpp" fill="transparent" />
        <circle :cx="t.x" :cy="t.y" :r="7 * mpp" fill="#fff" stroke="#0284c7" :stroke-width="1.5 * mpp" />
        <text :x="t.x" :y="t.y" :font-size="9 * mpp" font-weight="800" font-family="Inter, Arial, sans-serif" fill="#0284c7" text-anchor="middle" dominant-baseline="central" pointer-events="none">T</text>
      </g>

      <!-- Grúa elegida: su radio de giro y una manilla para girarla -->
      <g v-if="gruaSel && !trazando">
        <circle :cx="gruaSel.x" :cy="gruaSel.y" :r="radioGiroDe(gruaSel)" fill="#facc15" fill-opacity="0.08" stroke="#a16207" stroke-width="1.5" stroke-dasharray="5 4" vector-effect="non-scaling-stroke" pointer-events="none" />
        <text :x="gruaSel.x" :y="gruaSel.y - radioGiroDe(gruaSel) - 0.25 * k" v-bind="TEXTO_COTA" fill="#854d0e" text-anchor="middle">Giro: {{ formatoM(2 * radioGiroDe(gruaSel)) }} m</text>
        <g class="cursor-pointer" role="button" aria-label="Girar la grúa" style="touch-action: none" @pointerdown.stop @click.stop="emit('girar-elemento', gruaSel.id)">
          <circle :cx="manillaGiro(gruaSel).x" :cy="manillaGiro(gruaSel).y" :r="radioManilla" fill="transparent" />
          <circle :cx="manillaGiro(gruaSel).x" :cy="manillaGiro(gruaSel).y" :r="radioManilla * 0.5" fill="#fff" stroke="#a16207" :stroke-width="radioManilla * 0.08" />
          <path :d="flechaGiro(manillaGiro(gruaSel), radioManilla * 0.28)" fill="none" stroke="#a16207" :stroke-width="radioManilla * 0.09" stroke-linecap="round" />
        </g>
      </g>

      <!-- Vista previa de copias (repetir en bloque o pasillos en serie): punteado; en rojo las que no caben, con
           el motivo escrito encima -->
      <g v-if="fantasmas?.length" pointer-events="none">
        <template v-for="(g, i) in fantasmas" :key="`fa-${i}`">
          <rect
            :x="g.x0" :y="g.y0" :width="g.ancho" :height="g.alto" rx="0.05"
            :fill="g.ok ? 'rgba(234,88,12,.10)' : 'rgba(220,38,38,.10)'" :stroke="g.ok ? '#ea580c' : '#dc2626'"
            stroke-width="2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"
          />
          <text
            v-if="!g.ok && g.motivo" :x="g.x0 + g.ancho / 2" :y="g.y0 + g.alto / 2" text-anchor="middle" dominant-baseline="central"
            :font-size="12 * mpp" font-weight="700" fill="#b91c1c" paint-order="stroke" stroke="#fff" :stroke-width="3 * mpp"
          >No cabe: {{ g.motivo }}</text>
        </template>
      </g>

      <!-- Racks mas altos que la altura libre: borde ambar punteado -->
      <rect
        v-for="r in racks.filter((q) => altos?.has(q.id) && !conflictos.has(q.id))" :key="`alto-${r.id}`"
        v-bind="rectDe(r)" fill="none" stroke="#b45309" stroke-width="0.14" stroke-dasharray="0.35 0.2" pointer-events="none"
      />

      <!-- Largo de cada muro: un clic lo selecciona para escribir su medida -->
      <text
        v-for="m in muros" :key="`m${m.i}`"
        :x="m.tx" :y="m.ty" :transform="`rotate(${m.ang} ${m.tx} ${m.ty})`"
        v-bind="TEXTO_COTA" :font-size="13 * mpp" :fill="muroSel === m.i ? '#0369a1' : '#0f172a'"
        text-anchor="middle" dominant-baseline="central"
        :pointer-events="cotasTodas ? 'none' : 'all'" :class="cotasTodas ? '' : 'cursor-pointer'"
        role="button" :aria-label="`Muro ${m.i + 1}: ${formatoM(m.largo)} metros. Editar largo`"
        @pointerdown.stop
        @click.stop="emit('seleccionar-muro', m.i)"
      >{{ formatoM(m.largo) }} m</text>

      <!-- Cotas: medidas del rack y distancia a muros o al rack vecino (pasillo) -->
      <g v-for="(c, i) in cotas" :key="`c${i}`" pointer-events="none">
        <line :x1="c.x1" :y1="c.y1" :x2="c.x2" :y2="c.y2" :stroke="colorCota(c)" stroke-width="0.04" stroke-dasharray="0.18 0.1" />
        <text
          v-bind="TEXTO_COTA" :fill="colorCota(c)" dominant-baseline="central"
          :x="posCota(c).x" :y="posCota(c).y" :transform="posCota(c).rot" :text-anchor="posCota(c).anchor"
        >{{ pasilloDe(c) ? (esLibre(c) ? 'área libre ' : 'pasillo ') : c.a === 'elemento' ? 'libre ' : '' }}{{ formatoM(c.valor) }} m</text>
      </g>
      <!-- Medidas del rack en planta, sobre su esquina (lejos de las cotas, que salen del centro de cada lado) -->
      <text
        v-for="(d, i) in medidasRacks" :key="`d${i}`"
        :x="d.x0" :y="d.y0 - 0.3 * k" v-bind="TEXTO_COTA" fill="#0f172a" text-anchor="start"
      >{{ formatoM(d.ancho) }} × {{ formatoM(d.alto) }} m</text>

      <!-- Esquinas de una bodega de forma libre: se arrastran para ajustarla -->
      <template v-if="editarContorno && herramienta !== 'medir'">
        <circle
          v-for="(p, i) in bodega.forma" :key="`v${i}`"
          :cx="p.x" :cy="p.y" :r="0.35 * k"
          fill="#fff" stroke="#ea580c" :stroke-width="0.1 * k"
          class="cursor-grab" style="touch-action: none"
          role="button" :aria-label="`Esquina ${i + 1} de la bodega`"
          @pointerdown.stop="iniciarArrastre($event, { tipo: 'vertice', id: String(i), x: p.x, y: p.y })"
        />
      </template>
    </template>

    <!-- Trazando un pasillo peatonal: guías de ajuste, tramo en vista previa con su ancho real y su largo, y la manilla -->
    <g v-if="trazando" pointer-events="none">
      <line v-for="(g, i) in guiasTrazo" :key="`gt${i}`" :x1="g.x1" :y1="g.y1" :x2="g.x2" :y2="g.y2" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="4 3" vector-effect="non-scaling-stroke" />
      <polyline v-if="(trazoPeatonal?.puntos.length ?? 0) > 1" :points="trazoPeatonal!.puntos.map((q) => `${q.x},${q.y}`).join(' ')" fill="none" stroke="#15803d" stroke-width="1.5" vector-effect="non-scaling-stroke" />
      <template v-if="previaTramo">
        <rect v-bind="previaTramo.rect" fill="#22c55e" fill-opacity="0.3" stroke="#15803d" stroke-width="2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke" />
        <text :x="previaTramo.tx" :y="previaTramo.ty" v-bind="TEXTO_COTA" :font-size="13 * mpp" fill="#166534" text-anchor="middle" dominant-baseline="central">{{ formatoM(previaTramo.largo) }} m</text>
      </template>
      <circle v-for="(q, i) in trazoPeatonal?.puntos ?? []" :key="`tp${i}`" :cx="q.x" :cy="q.y" :r="5 * mpp" fill="#15803d" stroke="#fff" :stroke-width="1.5 * mpp" />
      <template v-if="cursorTrazo">
        <line :x1="cursorTrazo.x - 16 * mpp" :y1="cursorTrazo.y" :x2="cursorTrazo.x + 16 * mpp" :y2="cursorTrazo.y" stroke="#15803d" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        <line :x1="cursorTrazo.x" :y1="cursorTrazo.y - 16 * mpp" :x2="cursorTrazo.x" :y2="cursorTrazo.y + 16 * mpp" stroke="#15803d" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        <circle :cx="cursorTrazo.x" :cy="cursorTrazo.y" :r="9 * mpp" fill="#fff" fill-opacity="0.7" stroke="#15803d" :stroke-width="2.5 * mpp" />
      </template>
    </g>

    <!-- Grúa que se arrastra desde la paleta: huella real y radio de giro -->
    <g v-if="fantasmaGrua" pointer-events="none">
      <circle :cx="fantasmaGrua.x" :cy="fantasmaGrua.y" :r="fantasmaGrua.radio" fill="#facc15" fill-opacity="0.1" stroke="#a16207" stroke-width="1.5" stroke-dasharray="5 4" vector-effect="non-scaling-stroke" />
      <rect :x="fantasmaGrua.x - fantasmaGrua.ancho / 2" :y="fantasmaGrua.y - fantasmaGrua.alto / 2" :width="fantasmaGrua.ancho" :height="fantasmaGrua.alto" rx="0.1" fill="#fbbf24" fill-opacity="0.75" stroke="#a16207" stroke-width="2" vector-effect="non-scaling-stroke" />
    </g>

    <!-- Calibracion del calco: los dos puntos de una medida conocida -->
    <g v-if="puntosCalibracion?.length" pointer-events="none">
      <line
        v-if="puntosCalibracion.length === 2"
        :x1="puntosCalibracion[0].x" :y1="puntosCalibracion[0].y" :x2="puntosCalibracion[1].x" :y2="puntosCalibracion[1].y"
        stroke="#db2777" stroke-width="2" vector-effect="non-scaling-stroke"
      />
      <circle v-for="(q, i) in puntosCalibracion" :key="`cal${i}`" :cx="q.x" :cy="q.y" :r="0.2 * k" fill="#db2777" />
    </g>

    <!-- Cinta de medir -->
    <g v-if="medicion" pointer-events="none">
      <line
        :x1="medicion.a.x" :y1="medicion.a.y" :x2="medicion.b.x" :y2="medicion.b.y"
        stroke="#7c3aed" stroke-width="2" vector-effect="non-scaling-stroke"
      />
      <circle v-for="(q, i) in [medicion.a, medicion.b]" :key="`mc${i}`" :cx="q.x" :cy="q.y" :r="0.15 * k" fill="#7c3aed" />
      <text
        :x="(medicion.a.x + medicion.b.x) / 2 + 0.3 * k" :y="(medicion.a.y + medicion.b.y) / 2 - 0.3 * k"
        v-bind="TEXTO_COTA" :font-size="13 * mpp" fill="#6d28d9" text-anchor="start"
      >{{ formatoM(Math.hypot(medicion.b.x - medicion.a.x, medicion.b.y - medicion.a.y)) }} m</text>
    </g>
  </svg>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { rectangulo, rectElemento, medidasRack, describir, contorno, caja, cotasRack, cotasElemento, formatoM, PASO, ELEMENTOS, pilarDentro, perdidasPorPilares } from '~/lib/rack3d/planificador.js';
import { pasilloEn, franjaPasillo } from '~/lib/rack3d/pasillos.js';
import { radioGiro } from '~/lib/rack3d/rutas.js';
import { hojasPorton } from '~/lib/flujo/calculos.js';

export interface RackPlano {
  id: string;
  tipo: 'RS' | 'AR' | 'DI';
  x: number;
  y: number;
  rot: 0 | 90 | 180 | 270;
  cuerpos: number;
  niveles: number;
  doble: boolean;
  existente?: boolean;
  modelo?: string;
  porViga?: number;
  sobrante?: number;
  planos?: (string | null)[];
  tunel?: { cuerpo: number; altoLibre: number } | null;
  mezcla?: (string | null)[];
  altos?: (number | null)[];
  colores?: (string | null)[];
  techoGrua?: number | null;
  mastilGrua?: number | null;
  anchoGrua?: number | null;
  fondos?: number;
  // Ángulo ranurado: cajas de una repisa vistas desde arriba
  cajasPlanta?: { cols: number; filas: number } | null;
}
export interface Punto { x: number; y: number }
export interface Elemento { forma?: 'cuadrado' | 'circular' | 'H'; aberturas?: number[]; grupo?: string; muro?: string; altoPorton?: number; abre?: 'batiente' | 'corredera' | 'cortina'; hacia?: 'adentro' | 'afuera'; padre?: string; esManiobra?: boolean; id: string; clase: 'pilar' | 'porton' | 'anden' | 'oficina' | 'zona' | 'zonaCarga' | 'pasilloGrua' | 'pasilloPeatonal' | 'grua'; x: number; y: number; ancho: number; alto: number; modelo?: string; nombre?: string }
// Calculado por lib/rack3d/pasillos.js
export interface Pasillo {
  id: string; x0: number; y0: number; x1: number; y1: number; eje: 'x' | 'y';
  libre: number; libreGeom?: number; angosta?: { clase: string; id: string | null; x: number; y: number; distancia: number } | null; minimo: number; ok: boolean; racks: string[]; vecino: string | null;
}

const props = defineProps<{
  bodega: { ancho: number; largo: number; forma: Punto[] | null; elementos?: Elemento[] };
  racks: RackPlano[];
  seleccion: string | null;
  conflictos: Set<string>;
  dibujando?: boolean;
  puntosDibujo?: Punto[];
  // Al dibujar el contorno: muros solo horizontales o verticales (90°), como la mayoría de las bodegas
  soloRectos?: boolean;
  editarContorno?: boolean;
  // Racks mas altos que la altura libre (borde ambar)
  altos?: Set<string>;
  // Cotas de todos los racks (para el plano que se exporta); si no, solo las del seleccionado
  cotasTodas?: boolean;
  // Paso de la cuadricula en metros (0,5 / 1 / 5): tambien es el ajuste al dibujar
  grilla?: number;
  // 'mover' (racks y esquinas) o 'medir' (cinta de medir)
  herramienta?: 'mover' | 'medir';
  // Muro seleccionado (indice del lado del contorno) para editar su largo
  muroSel?: number | null;
  // Pasillos frente a las caras de carga (los angostos se marcan en rojo)
  pasillos?: Pasillo[];
  // Modos del flujo: trazar un pasillo peatonal por tramos (cada clic un punto) o agregar cruces
  trazando?: boolean;
  agregandoCruce?: boolean;
  // Encuadre (planta, m): muestra solo esa zona (lo diseñado) en vez de toda la bodega
  encuadre?: { x0: number; y0: number; x1: number; y1: number } | null;
  // Accesorios a dibujar en planta (m)
  marcas?: Array<{ tipo: 'punto'; x: number; y: number; nx?: number; ny?: number } | { tipo: 'barra' | 'linea'; x1: number; y1: number; x2: number; y2: number }>;
  // Configuraciones mixtas: color y letra por modelo de rack (si no, el color del sistema)
  colores?: Record<string, { fondo: string; borde: string; linea: string }>;
  etiquetas?: Record<string, string>;
  // Copias en vista previa: rectangulo en planta, si cabe y por que no
  fantasmas?: Array<{ x0: number; y0: number; ancho: number; alto: number; ok: boolean; motivo?: string | null }>;
  // Ocultar la capa de accesorios (interruptor del plano)
  ocultarAccesorios?: boolean;
  // Elemento seleccionado (pilar, porton, anden, oficina o zona)
  elementoSel?: string | null;
  // Plano o foto de referencia para calcar: url, tamano en px y metros por px
  calco?: { url: string; w: number; h: number; escala: number; opacidad: number } | null;
  // Calibrando el calco: los clics marcan dos puntos de una medida conocida
  calibrando?: boolean;
  puntosCalibracion?: Punto[];
  // Pasillo peatonal que se está trazando: sus quiebres y su ancho (m)
  trazoPeatonal?: { puntos: Punto[]; ancho: number } | null;
  // Recorrido de la grúa (lib/rack3d/rutas.js recorridosGrua) y túneles sugeridos (sugerirTuneles)
  recorridos?: { andenes: Punto[]; rutas: Array<{ id: string; puntos: Punto[]; largo: number; llega: boolean; franja?: { x0: number; y0: number; x1: number; y1: number } }> } | null;
  sugerenciasTunel?: Array<{ rackId: string; cuerpo: number; altoLibre: number; ahorro: number; nuevos: number; x: number; y: number }>;
  // Grúa que se arrastra desde la paleta (centro, huella y radio de giro, m)
  fantasmaGrua?: { x: number; y: number; ancho: number; alto: number; radio: number } | null;
  // Flechas sobre el rack elegido para alargarlo o sumar filas tirando de ellas (y el texto de lo que pasa)
  flechasRack?: boolean;
  // Flechas que no van (p. ej. 'filas+' si no cabe otra fila hacia ese lado)
  flechasNo?: string[];
  // Guías del imán mientras se arrastra un rack (a qué se pegó: muro, otro rack, pasillo exacto)
  guiasRack?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  // Dibujar un lineal arrastrando: arma el rack entre donde aprieta (a) y donde va el puntero (b), con su texto
  pincel?: ((a: Punto, b: Punto) => (RackPlano & { texto?: string }) | null) | null;
  // Dibujo del contorno: metros escritos para el muro que se está tirando (va hacia donde apunta el cursor)
  largoEscrito?: number | null;
  // Pilares de una grilla (mismo grupo): se eligen, se miden y se mueven juntos
  bloquePilares?: boolean;
}>();

const emit = defineEmits<{
  seleccionar: [id: string | null];
  mover: [id: string, x: number, y: number];
  girar: [id: string];
  eliminar: [id: string];
  'agregar-punto': [p: Punto];
  'cerrar-contorno': [];
  'mover-vertice': [i: number, p: Punto];
  'seleccionar-muro': [i: number | null];
  // Fin de un arrastre de rack o esquina: la pagina lo guarda en el historial (deshacer)
  'fin-cambio': [];
  // Tirando de una flecha del rack elegido: `metros` hacia afuera desde donde apretó (negativo = hacia adentro),
  // siempre sobre el rack como estaba al apretar; `fin` al soltar
  'estirar-rack': [orig: RackPlano, tipo: 'largo' | 'filas', s: number, metros: number, fin: boolean];
  'punto-calibracion': [p: Punto];
  'seleccionar-elemento': [id: string | null];
  'mover-elemento': [id: string, x: number, y: number];
  // Largo o ancho de un pasillo cambiado con sus manillas, o un punto al trazar/un cruce
  'cambiar-elemento': [id: string, cambio: Partial<Elemento>];
  'punto-trazo': [p: Punto];
  'cruce-elemento': [id: string, pos: number];
  'eliminar-elemento': [id: string];
  // Trazado de un pasillo peatonal: un tramo recto (a → b), terminar o deshacer el último
  'tramo-trazo': [a: Punto, b: Punto];
  'terminar-trazo': [];
  'aplicar-tunel': [s: { rackId: string; cuerpo: number; altoLibre: number; ahorro: number; nuevos: number; x: number; y: number }];
  'girar-elemento': [id: string];
  // Lineal dibujado con el pincel (al soltar)
  pintar: [r: RackPlano];
}>();

const MARGEN = 1.8;   // deja lugar a las medidas de los muros (se multiplica por k)
const COLOR = {
  RS: { fondo: '#ffedd5', borde: '#ea580c', linea: '#fb923c' },
  DI: { fondo: '#fef3c7', borde: '#d97706', linea: '#f59e0b' },
  AR: { fondo: '#e0e7ff', borde: '#4f46e5', linea: '#818cf8' },
};
const colorDe = (r: any) => props.colores?.[r.modelo] ?? (COLOR as any)[r.tipo];
const uid = useId();
const svgRef = ref<SVGSVGElement | null>(null);
const cursor = ref<Punto | null>(null);
const ajuste = ref<'esquina' | 'medio' | null>(null);
const textoCursor = ref('');
const guias = ref<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
// Rack con foco de teclado (no de clic): lleva el anillo naranjo
const focoTeclado = ref<string | null>(null);
const paso = computed(() => props.grilla ?? 1);
const grillaFina = computed(() => paso.value);

function enfocar(e: FocusEvent, id: string) {
  emit('seleccionar', id);
  focoTeclado.value = (e.target as Element).matches(':focus-visible') ? id : null;
}
const puntosDibujo = computed(() => props.puntosDibujo ?? []);

// Area de la bodega: al dibujar, el lienzo (ancho × largo); si no, la caja del contorno
const marco = computed(() => {
  const c = caja(contorno(props.bodega));
  if (!props.dibujando) return c;
  // Al dibujar: el lienzo, ampliado si un muro escrito por teclado sale de el
  const pts = puntosDibujo.value, xs = pts.map((q) => q.x), ys = pts.map((q) => q.y);
  const cw = props.calco ? props.calco.w * props.calco.escala : 0, ch = props.calco ? props.calco.h * props.calco.escala : 0;
  return { x0: Math.min(0, ...xs), y0: Math.min(0, ...ys), x1: Math.max(props.bodega.ancho, cw, ...xs), y1: Math.max(props.bodega.largo, ch, ...ys) };
});
// Crece con la bodega para que se lea igual en una de 10 m que en una de 80 m
const k = computed(() => { const c = marco.value; return Math.max(1, Math.max(c.x1 - c.x0, c.y1 - c.y0) / 25); });

// ─── Zoom (rueda) y desplazamiento (arrastrar el piso) ───
const zoom = ref(1);
const centro = ref<Punto | null>(null);   // null = centrado en la bodega
const base = computed(() => {
  const m = props.encuadre && !props.dibujando ? props.encuadre : marco.value, g = MARGEN * k.value;
  return { x: m.x0 - g, y: m.y0 - g, w: m.x1 - m.x0 + 2 * g, h: m.y1 - m.y0 + 2 * g };
});
const vista = computed(() => {
  const b = base.value, w = b.w / zoom.value, h = b.h / zoom.value;
  const c = centro.value ?? { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  return { x: c.x - w / 2, y: c.y - h / 2, w, h };
});
watch(() => [props.dibujando, props.bodega.forma?.length, JSON.stringify(props.encuadre ?? null)], () => restablecerVista());

function restablecerVista() {
  zoom.value = 1;
  centro.value = null;
}
function acercar(factor: number, foco?: Punto) {
  const z = Math.min(8, Math.max(1, zoom.value * factor));
  const v = vista.value, c = { x: v.x + v.w / 2, y: v.y + v.h / 2 };
  const f = foco ?? c;
  centro.value = z === 1 ? null : { x: f.x + (c.x - f.x) * (zoom.value / z), y: f.y + (c.y - f.y) * (zoom.value / z) };
  zoom.value = z;
}
// La rueda sola baja la página (como el plano de producción: no se descuadra). Solo con Ctrl (o el pellizco
// del trackpad, que llega con Ctrl) acerca o aleja; para el resto están los botones + / − / Ajustar
function rueda(e: WheelEvent) {
  if (!e.ctrlKey && !e.metaKey) return;
  e.preventDefault();
  acercar(e.deltaY < 0 ? 1.15 : 1 / 1.15, aPlano(e));
}
// Punto de la pantalla (clientX/Y) en metros del plano, o null si cae fuera del plano (paleta → plano)
function aPlanoCliente(x: number, y: number): Punto | null {
  const r = svgRef.value?.getBoundingClientRect();
  if (!r || x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
  const q = aPlano({ clientX: x, clientY: y });
  return { x: q.x, y: q.y };
}

// ─── Capa de accesorios: tamaño real, con un mínimo de ~4 px de pantalla para que se vean sin zoom ───
const anchoPx = ref(800);
const altoPx = ref(600);
const relleno = ref({ x: 0, y: 0 });
let obs: ResizeObserver | null = null;
onMounted(() => {
  if (!svgRef.value || typeof ResizeObserver === 'undefined') return;
  const cs = getComputedStyle(svgRef.value);
  relleno.value = { x: parseFloat(cs.paddingLeft) || 0, y: parseFloat(cs.paddingTop) || 0 };
  let cuadro = 0;
  obs = new ResizeObserver(([e]) => {
    const w = Math.round(e.contentRect.width || 800), h = Math.round(e.contentRect.height || 600);
    if (Math.abs(w - anchoPx.value) < 3 && Math.abs(h - altoPx.value) < 3) return;   // sin vaivén de letras por 1–2 px
    cancelAnimationFrame(cuadro);
    cuadro = requestAnimationFrame(() => { anchoPx.value = w; altoPx.value = h; });
  });
  obs.observe(svgRef.value);
});
onBeforeUnmount(() => obs?.disconnect());
const fm = computed(() => Math.max(1, (vista.value.w / Math.max(200, anchoPx.value)) * 4 / 0.06));
// Metros por pixel de pantalla (para dibujar a tamaño fijo en pantalla: flechas, manillas, textos mínimos)
// Del tamaño medido (no del que tenga el lienzo en cada instante): las letras no cambian mientras nada cambia
const mpp = computed(() => {
  const v = vista.value;
  return Math.max(v.w / Math.max(50, anchoPx.value), v.h / Math.max(50, altoPx.value));
});
// ─── Flechas del rack elegido ───
const rackElegido = computed(() => props.racks.find((r) => r.id === props.seleccion) ?? null);
const estiro = ref<{ h: any; orig: RackPlano; inicio: Punto; puntero: number } | null>(null);
const moviendo = ref(false);
// Extremos (largo) y costados (filas), 18 px por fuera del rack; d = hacia afuera
const flechasSel = computed(() => {
  const r = rackElegido.value;
  if (!props.flechasRack || !r || props.pincel || props.dibujando || props.trazando || props.agregandoCruce) return null;
  const q = rectangulo(r), ux = !(r.rot === 90 || r.rot === 270), g = 20 * mpp.value;
  const cx = q.x0 + q.ancho / 2, cy = q.y0 + q.alto / 2;
  const enX = (s: number) => ({ x: s < 0 ? q.x0 - g : q.x0 + q.ancho + g, y: cy, dx: s, dy: 0 });
  const enY = (s: number) => ({ x: cx, y: s < 0 ? q.y0 - g : q.y0 + q.alto + g, dx: 0, dy: s });
  return [-1, 1].flatMap((s) => [
    { tipo: 'largo', s, ux, ...(ux ? enX(s) : enY(s)) },
    { tipo: 'filas', s, ux, ...(ux ? enY(s) : enX(s)) },
  ]).filter((h) => !props.flechasNo?.includes(h.tipo + (h.s > 0 ? '+' : '-')));
});
function flechaManilla(h: { x: number; y: number; dx: number; dy: number }) {
  const k = mpp.value, t = { x: h.x + h.dx * 7 * k, y: h.y + h.dy * 7 * k }, b = { x: h.x - h.dx * 5 * k, y: h.y - h.dy * 5 * k };
  const n = { x: -h.dy * 6 * k, y: h.dx * 6 * k };
  return `M${t.x} ${t.y}L${b.x + n.x} ${b.y + n.y}L${b.x - n.x} ${b.y - n.y}Z`;
}
function tomarFlecha(e: PointerEvent, h: any) {
  if (e.button !== 0 || !rackElegido.value) return;
  const p = aPlano(e);
  estiro.value = { h, orig: { ...rackElegido.value }, inicio: { x: p.x, y: p.y }, puntero: e.pointerId };
  moviendo.value = true;
  svgRef.value?.setPointerCapture(e.pointerId);
}
function moverFlecha(e: PointerEvent, fin = false) {
  const st = estiro.value!, p = aPlano(e);
  const metros = (p.x - st.inicio.x) * st.h.dx + (p.y - st.inicio.y) * st.h.dy;
  emit('estirar-rack', st.orig, st.h.tipo, st.h.s, metros, fin);
}
// Caja del rack elegido en px, desde la esquina del lienzo (para el menú que flota sobre él)
const cajaRack = computed(() => {
  const r = rackElegido.value;
  if (!r) return null;
  const q = rectangulo(r), v = vista.value, W = anchoPx.value, H = altoPx.value, k = Math.min(W / v.w, H / v.h);
  const ox = relleno.value.x + (W - v.w * k) / 2, oy = relleno.value.y + (H - v.h * k) / 2;
  return { x: ox + (q.x0 - v.x) * k, y: oy + (q.y0 - v.y) * k, w: q.ancho * k, h: q.alto * k, W: W + 2 * relleno.value.x, H: H + 2 * relleno.value.y };
});
// Punta del muro que se está tirando: el cursor o, con metros escritos, ese largo hacia el cursor
const cursorDib = computed(() => {
  const c = cursor.value, pts = puntosDibujo.value, L = props.largoEscrito;
  if (!c || !pts.length || !(L && L > 0)) return c;
  const u = pts[pts.length - 1], d = Math.hypot(c.x - u.x, c.y - u.y);
  if (d < 1e-6) return c;
  return { x: +(u.x + ((c.x - u.x) / d) * L).toFixed(2), y: +(u.y + ((c.y - u.y) / d) * L).toFixed(2) };
});
defineExpose({ restablecerVista, acercar, zoom, aPlanoCliente, cajaRack, moviendo, cursorDibujo: cursorDib });
// La U de la canillera mira hacia el pasillo (n); sin dirección, hacia arriba
const anguloMarca = (mk: any) => (Math.atan2(-(mk.nx ?? 0), mk.ny ?? -1) * 180) / Math.PI;

// Medida de cada lado de un poligono, escrita por fuera y siempre legible (sin quedar de cabeza)
function medidasLados(pts: Punto[], cerrado: boolean) {
  const n = pts.length, cx = pts.reduce((t, p) => t + p.x, 0) / n, cy = pts.reduce((t, p) => t + p.y, 0) / n;
  const out = [];
  for (let i = 0; i < (cerrado ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const largo = Math.hypot(b.x - a.x, b.y - a.y);
    if (largo < 0.3) continue;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    let nx = -(b.y - a.y) / largo, ny = (b.x - a.x) / largo;
    if (nx * (mx - cx) + ny * (my - cy) < 0) { nx = -nx; ny = -ny; }   // hacia afuera
    let ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    if (ang > 90) ang -= 180; else if (ang < -90) ang += 180;
    out.push({ i, largo, tx: mx + nx * 0.75 * k.value, ty: my + ny * 0.75 * k.value, ang: +ang.toFixed(2) });
  }
  return out;
}
const muros = computed(() => medidasLados(contorno(props.bodega), true));
const ladoSel = computed(() => {
  const poly = contorno(props.bodega), i = props.muroSel;
  if (i === null || i === undefined || !poly[i]) return null;
  return { a: poly[i], b: poly[(i + 1) % poly.length] };
});
const murosDibujo = computed(() => {
  const pts = [...puntosDibujo.value, ...(cursorDib.value ? [cursorDib.value] : [])];
  return pts.length >= 2 ? medidasLados(pts, false) : [];
});

// Estilo de las cotas como atributos (no CSS): el plano se exporta copiando el SVG
// Siempre ~12 px en pantalla: no crecen ni se achican con el zoom ni con el tamaño de lo que rotulan
const TEXTO_COTA = computed((): Record<string, any> => ({
  'font-size': +(12 * mpp.value).toFixed(4), 'font-weight': 600, 'font-family': 'Inter, Arial, sans-serif', fill: '#334155',
  'paint-order': 'stroke', stroke: '#fff', 'stroke-width': +(3 * mpp.value).toFixed(4), 'stroke-linejoin': 'round', 'pointer-events': 'none',
}));

// Donde va el numero de una cota: al centro de la linea, o al costado si la linea es corta
function posCota(c: { x1: number; y1: number; x2: number; y2: number; valor: number }) {
  const mx = (c.x1 + c.x2) / 2, my = (c.y1 + c.y2) / 2, horizontal = c.y1 === c.y2;
  const corta = c.valor < 2.6 * k.value;
  if (corta) return horizontal ? { x: mx, y: my - 0.3 * k.value, rot: '', anchor: 'middle' } : { x: mx + 0.25 * k.value, y: my, rot: '', anchor: 'start' };
  return { x: mx, y: my, rot: horizontal ? '' : `rotate(-90 ${mx} ${my})`, anchor: 'middle' };
}

// Símbolo de cada elemento en planta (en metros, como el resto del plano)
const MODELOS: Record<string, string> = { transpaleta: 'Transpaleta', apiladora: 'Apiladora', contrapeso: 'Contrapeso', retractil: 'Retráctil' };
const circulo = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
// Pilares de la misma grilla que el elegido (si se mueven en bloque): ids y caja que los encierra
const grupoPilaresSel = computed(() => {
  const els = props.bodega.elementos ?? [], e = els.find((x) => x.id === props.elementoSel);
  if (!props.bloquePilares || !e || e.clase !== 'pilar' || !e.grupo) return null;
  const g = els.filter((x) => x.clase === 'pilar' && x.grupo === e.grupo);
  if (g.length < 2) return null;
  const rs = g.map((x) => rectElemento(x));
  const x0 = Math.min(...rs.map((r) => r.x0)), y0 = Math.min(...rs.map((r) => r.y0));
  const x1 = Math.max(...rs.map((r) => r.x0 + r.ancho)), y1 = Math.max(...rs.map((r) => r.y0 + r.alto));
  return { ids: new Set(g.map((x) => x.id)), caja: { id: '_bloque', clase: 'zona', x: (x0 + x1) / 2, y: (y0 + y1) / 2, ancho: x1 - x0, alto: y1 - y0 } };
});
const enSeleccion = (el: Elemento) => el.id === props.elementoSel || !!grupoPilaresSel.value?.ids.has(el.id);
// Muro en que está un portón o andén y su vano: inicio en la línea del muro, sentido a lo largo y normal hacia adentro
function vanoEn(el: Elemento) {
  const c = caja(contorno(props.bodega)), p = rectElemento(el);
  const d: Record<string, number> = { arriba: el.y - c.y0, abajo: c.y1 - el.y, izquierda: el.x - c.x0, derecha: c.x1 - el.x };
  const muro = el.muro ?? Object.entries(d).sort((a, b) => a[1] - b[1])[0][0];
  const x1 = p.x0 + p.ancho, y1 = p.y0 + p.alto;
  if (muro === 'abajo') return { muro, s: { x: p.x0, y: y1 }, t: { x: 1, y: 0 }, n: { x: 0, y: -1 }, ancho: p.ancho, fondo: p.alto, largoMuro: c.x1 - c.x0, dist: p.x0 - c.x0 };
  if (muro === 'arriba') return { muro, s: { x: p.x0, y: p.y0 }, t: { x: 1, y: 0 }, n: { x: 0, y: 1 }, ancho: p.ancho, fondo: p.alto, largoMuro: c.x1 - c.x0, dist: p.x0 - c.x0 };
  if (muro === 'izquierda') return { muro, s: { x: p.x0, y: p.y0 }, t: { x: 0, y: 1 }, n: { x: 1, y: 0 }, ancho: p.alto, fondo: p.ancho, largoMuro: c.y1 - c.y0, dist: p.y0 - c.y0 };
  return { muro, s: { x: x1, y: p.y0 }, t: { x: 0, y: 1 }, n: { x: -1, y: 0 }, ancho: p.alto, fondo: p.ancho, largoMuro: c.y1 - c.y0, dist: p.y0 - c.y0 };
}
// Portón en planta según cómo abre: batiente (hojas y su barrido), corredera (hoja corrida junto al muro) o cortina
function dibujoPorton(el: Elemento) {
  const v = vanoEn(el), sg = el.hacia === 'afuera' ? -1 : 1, nx = v.n.x * sg, ny = v.n.y * sg;
  const P = (a: number, b = 0) => ({ x: v.s.x + v.t.x * a + nx * b, y: v.s.y + v.t.y * a + ny * b });
  if (el.abre === 'batiente') {
    let arcos = '', hojas = '';
    hojasPorton(v.ancho).forEach((h) => {
      const H = P(h.desde), C = P(h.desde === 0 ? h.largo : h.desde - h.largo), O = P(h.desde, h.largo);
      const cruz = (O.x - H.x) * (C.y - H.y) - (O.y - H.y) * (C.x - H.x);
      arcos += `M${O.x} ${O.y}A${h.largo} ${h.largo} 0 0 ${cruz > 0 ? 1 : 0} ${C.x} ${C.y}`;
      // Hoja abierta: rectángulo delgado desde la bisagra
      const e = 0.05, ax = v.t.x * e, ay = v.t.y * e;
      hojas += `M${H.x - ax} ${H.y - ay}L${O.x - ax} ${O.y - ay}L${O.x + ax} ${O.y + ay}L${H.x + ax} ${H.y + ay}Z`;
    });
    return { arcos, hojas };
  }
  if (el.abre === 'corredera') {
    // La hoja queda al lado del vano (a la derecha o abajo; si no cabe, al otro lado), pegada al muro
    const lado = v.dist + 2 * v.ancho <= v.largoMuro + 1e-6 ? 1 : -1;
    const a0 = lado > 0 ? v.ancho : -v.ancho, a1 = lado > 0 ? 2 * v.ancho : 0;
    const q0 = P(a0, 0.12), q1 = P(a1, 0.12), m = P(v.ancho / 2, 0.12), f = P(v.ancho / 2 + lado * 0.6, 0.12);
    const flecha = `M${m.x} ${m.y}L${f.x} ${f.y}M${f.x - v.t.x * lado * 0.25 + nx * 0.18} ${f.y - v.t.y * lado * 0.25 + ny * 0.18}L${f.x} ${f.y}L${f.x - v.t.x * lado * 0.25 - nx * 0.18} ${f.y - v.t.y * lado * 0.25 - ny * 0.18}`;
    const e = 0.06;
    const hojas = `M${q0.x - nx * e} ${q0.y - ny * e}L${q1.x - nx * e} ${q1.y - ny * e}L${q1.x + nx * e} ${q1.y + ny * e}L${q0.x + nx * e} ${q0.y + ny * e}Z`;
    return { arcos: flecha, hojas };
  }
  return null;
}
function dibujoElemento(el: Elemento) {
  const p = rectElemento(el), def = ELEMENTOS[el.clase];
  const x0 = p.x0, y0 = p.y0, x1 = p.x0 + p.ancho, y1 = p.y0 + p.alto, w = p.ancho, h = p.alto;
  const base = { clave: el.clase, relleno: def.relleno, opacidad: 0.8, borde: def.color, grosor: 0.06, punteado: undefined as string | undefined,
    trazo: '', grosorTrazo: 0.04, trazoPunteado: undefined as string | undefined, relleno2: '', color2: '', etiqueta: el.nombre || def.nombre };
  const largoV = h >= w;   // eje largo vertical
  switch (el.clase) {
    case 'pilar':
      // Símbolo estructural: sección llena con cruz; circular o perfil H segun su forma
      if (el.forma === 'circular') return { ...base, relleno: '#475569', opacidad: 0, borde: 'transparent', relleno2: circulo(el.x, el.y, Math.min(w, h) / 2), color2: '#475569', etiqueta: '' };
      if (el.forma === 'H') {
        const a = Math.min(w, h) * 0.18;
        return { ...base, relleno: '#cbd5e1', opacidad: 0.25, borde: '#94a3b8', grosor: 0.01, relleno2: `M${x0} ${y0}h${w}v${a}h${-(w - a) / 2}v${h - 2 * a}h${(w - a) / 2}v${a}h${-w}v${-a}h${(w - a) / 2}v${-(h - 2 * a)}h${-(w - a) / 2}Z`, color2: '#475569', etiqueta: '' };
      }
      return { ...base, relleno: '#475569', opacidad: 1, borde: '#1e293b', trazo: `M${x0} ${y0}L${x1} ${y1}M${x1} ${y0}L${x0} ${y1}`, grosorTrazo: 0.03, etiqueta: '' };
    case 'oficina': {
      // Muros dobles y puerta con su abatimiento en el lado de abajo
      const t = 0.15, pw = Math.min(0.9, w * 0.3), px = x0 + w * 0.25;
      return { ...base, opacidad: 0.6, grosor: 0.05,
        trazo: `M${x0 + t} ${y0 + t}H${x1 - t}V${y1 - t}H${px + pw}M${px} ${y1 - t}H${x0 + t}Z` +
          `M${px} ${y1}L${px} ${y1 - pw}A${pw} ${pw} 0 0 1 ${px + pw} ${y1}`,
        grosorTrazo: 0.035,
        relleno2: `M${px} ${y1 - 0.02}h${pw}v${-t + 0.02}h${-pw}Z`, color2: '#ffffff' };
    }
    case 'anden': {
      // Plataforma con nivelador (rectángulo interior) y borde de seguridad hacia el lado de abajo
      const s2 = 0.25, nx = x0 + w * 0.2, nw = w * 0.6, ny = y1 - h * 0.45;
      const franjas = Array.from({ length: Math.max(2, Math.floor(w / 0.35)) }, (_, i) => {
        const fx = x0 + i * 0.35;
        return `M${fx} ${y1}l${Math.min(0.2, x1 - fx)} ${-s2}h0.12l${-Math.min(0.2, x1 - fx)} ${s2}Z`;
      }).join('');
      return { ...base, opacidad: 0.7, trazo: `M${nx} ${ny}h${nw}v${h * 0.45 - s2}h${-nw}Z M${el.x} ${ny - 0.6}l-0.35 0.4m0.35 -0.4l0.35 0.4m-0.35 -0.4v1.1`, grosorTrazo: 0.04,
        relleno2: franjas, color2: '#111827' };
    }
    case 'porton': {
      const pt = dibujoPorton(el);
      if (pt) return { ...base, opacidad: 0.9, trazo: pt.arcos, grosorTrazo: 0.05, trazoPunteado: el.abre === 'batiente' ? '0.25 0.15' : undefined, relleno2: pt.hojas, color2: def.color, etiqueta: '' };
      return { ...base, opacidad: 0.9, trazo: largoV ? `M${el.x} ${y0}V${y1}` : `M${x0} ${el.y}H${x1}`, grosorTrazo: 0.06, trazoPunteado: '0.4 0.2' };
    }
    case 'zona':
      if (el.padre) {
        // Franja libre delante de un portón o andén: achurado suave, con su profundidad escrita (no bloquea a la vista)
        const padre = (props.bodega.elementos ?? []).find((x) => x.id === el.padre);
        const v = padre ? vanoEn(padre) : null, enY = v ? v.n.y !== 0 : h <= w;
        const prof = enY ? h : w, paso = 0.7;
        let achurado = '';
        for (let t = paso; t < w + h; t += paso) {
          const ax = x0 + Math.min(t, w), ay = y0 + Math.max(0, t - w), bx = x0 + Math.max(0, t - h), by = y0 + Math.min(t, h);
          achurado += `M${ax} ${ay}L${bx} ${by}`;
        }
        if (!el.esManiobra) return { ...base, relleno: '#94a3b8', opacidad: 0.12, borde: 'transparent', grosor: 0, trazo: achurado, grosorTrazo: 0.02, etiqueta: '' };
        return { ...base, relleno: '#f8fafc', opacidad: 0.6, borde: '#64748b', grosor: 0.04, punteado: '0.25 0.15', trazo: achurado, grosorTrazo: 0.02,
          // Andén: además de la maniobra, cuánto ocupa en total hacia adentro (rampa niveladora + maniobra)
          etiqueta: padre?.clase === 'anden' ? `${formatoM(prof)} m maniobra · ${formatoM(prof + (enY ? padre.alto : padre.ancho))} m hacia adentro` : `${formatoM(prof)} m`, clave: 'maniobra' };
      }
      return { ...base, punteado: '0.3 0.15', trazo: `M${x0} ${y0}L${x1} ${y1}M${x1} ${y0}L${x0} ${y1}` };
    case 'pasilloGrua': {
      // Líneas de borde amarillas y flechas de sentido por el centro
      const n = Math.max(1, Math.floor((largoV ? h : w) / 3));
      const flechas = Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        return largoV ? `M${el.x - 0.35} ${y0 + t * h - 0.2}l0.35 0.4l0.35 -0.4` : `M${x0 + t * w - 0.2} ${el.y - 0.35}l0.4 0.35l-0.4 0.35`;
      }).join('');
      const bordes = largoV ? `M${x0 + 0.08} ${y0}V${y1}M${x1 - 0.08} ${y0}V${y1}` : `M${x0} ${y0 + 0.08}H${x1}M${x0} ${y1 - 0.08}H${x1}`;
      return { ...base, opacidad: 0.45, grosor: 0, trazo: bordes + flechas, grosorTrazo: 0.1 };
    }
    case 'pasilloPeatonal': {
      // Cebra perpendicular al sentido de marcha
      const paso = 0.5, n = Math.floor((largoV ? h : w) / paso);
      const cebra = Array.from({ length: n }, (_, i) => (i % 2 ? '' : largoV
        ? `M${x0} ${y0 + i * paso}h${w}v${paso}h${-w}Z` : `M${x0 + i * paso} ${y0}v${h}h${paso}v${-h}Z`)).join('');
      return { ...base, opacidad: 0.5, grosor: 0.05, relleno2: cebra, color2: '#86efac' };
    }
    case 'grua': {
      // Silueta: chasis, contrapeso y horquillas hacia arriba (o hacia la izquierda si está acostada)
      const fl = largoV ? h * 0.3 : w * 0.3;
      const horq = largoV
        ? `M${x0 + w * 0.25} ${y0}v${fl}M${x1 - w * 0.25} ${y0}v${fl}M${x0 + w * 0.1} ${y0 + fl}h${w * 0.8}`
        : `M${x0} ${y0 + h * 0.25}h${fl}M${x0} ${y1 - h * 0.25}h${fl}M${x0 + fl} ${y0 + h * 0.1}v${h * 0.8}`;
      const cuerpo = largoV ? `M${x0} ${y0 + fl}h${w}v${h - fl}h${-w}Z` : `M${x0 + fl} ${y0}h${w - fl}v${h}h${-(w - fl)}Z`;
      return { ...base, relleno: 'transparent', opacidad: 1, grosor: 0, trazo: horq, grosorTrazo: 0.08,
        relleno2: cuerpo, color2: '#fbbf24', etiqueta: MODELOS[el.modelo ?? 'contrapeso'] ?? 'Grúa' };
    }
  }
  return base;
}

// ─── Recorrido de la grúa: flechas (chevrones de tamaño fijo en pantalla) cada ~4 m de cada tramo ───
function flechasRuta(pts: Punto[]) {
  const out: string[] = [], t = 6 * mpp.value, cada = Math.max(4, 70 * mpp.value);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.y - a.y);
    if (L < 1e-6) continue;
    const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
    const n = Math.max(1, Math.floor(L / cada));
    for (let j = 0; j < n; j++) {
      const d = (L * (j + 0.5)) / n, x = a.x + ux * d, y = a.y + uy * d;
      out.push(`M${x + ux * t} ${y + uy * t}L${x - ux * t - uy * t} ${y - uy * t + ux * t}L${x - ux * t * 0.4} ${y - uy * t * 0.4}L${x - ux * t + uy * t} ${y - uy * t - ux * t}Z`);
    }
  }
  return out;
}
const textoSugerencia = (t: { ahorro: number; nuevos: number }) => (t.nuevos ? `la grúa llega a ${t.nuevos} ${t.nuevos === 1 ? 'pasillo' : 'pasillos'} más` : `ahorras ${t.ahorro} m de recorrido`);
// Grúa elegida (elemento): radio de giro de su modelo y manilla para girarla 90°
const gruaSel = computed(() => (props.bodega.elementos ?? []).find((e) => e.id === props.elementoSel && e.clase === 'grua') ?? null);
const radioGiroDe = (el: Elemento) => radioGiro(el.modelo ?? 'contrapeso');
const manillaGiro = (el: Elemento) => ({ x: el.x + el.ancho / 2 + radioManilla.value * 0.7, y: el.y - el.alto / 2 - radioManilla.value * 0.7 });
function flechaGiro(c: Punto, r: number) {
  // Arco de 270° con su punta: el símbolo de girar
  const a0 = -Math.PI / 2, a1 = Math.PI;
  const p0 = { x: c.x + r * Math.cos(a0), y: c.y + r * Math.sin(a0) }, p1 = { x: c.x + r * Math.cos(a1), y: c.y + r * Math.sin(a1) };
  return `M${p0.x} ${p0.y}A${r} ${r} 0 1 1 ${p1.x} ${p1.y}M${p0.x} ${p0.y}l${r * 0.5} ${-r * 0.35}M${p0.x} ${p0.y}l${r * 0.45} ${r * 0.45}`;
}

const rectSvg = (el: Elemento) => { const p = rectElemento(el); return { x: p.x0, y: p.y0, width: p.ancho, height: p.alto }; };
const diagonal = (el: Elemento) => { const p = rectElemento(el); return { x1: p.x0, y1: p.y0, x2: p.x0 + p.ancho, y2: p.y0 + p.alto }; };

// Una cota es de pasillo si cae dentro de uno (las de costado o espalda no lo son)
type Cota = { a: string; x1: number; y1: number; x2: number; y2: number };
const pasilloDe = (c: Cota) => (c.a !== 'elemento' && props.pasillos ? pasilloEn(props.pasillos, (c.x1 + c.x2) / 2, (c.y1 + c.y2) / 2) as Pasillo | null : null);
// Pasillo dibujado solo en el ancho que pide el equipo; lo demas hasta el muro es area libre
const franjas = computed(() => (props.pasillos ?? []).map((p) => ({ ...p, f: franjaPasillo(p) })));
// Etiqueta dentro de cada pasillo, a lo largo y solo si cabe en pantalla (~6,5 px por letra)
const textosPasillo = computed(() => franjas.value.map((p) => {
  const ancho = p.f.x1 - p.f.x0, alto = p.f.y1 - p.f.y0, vertical = alto > ancho;
  const largo = Math.max(ancho, alto), corto = Math.min(ancho, alto);
  const ar = p.racks.some((id) => props.racks.find((r) => r.id === id)?.tipo === 'AR');
  const que = ar ? 'pasillo' : 'pasillo grúa';
  const texto = p.ok ? `${que} ${formatoM(p.minimo)} m` : `${ar ? 'necesita' : 'tu grúa necesita'} ${formatoM(p.minimo)} m · ${p.angosta?.clase === 'pilar' ? 'por un pilar quedan' : 'aquí quedan'} ${formatoM(p.libre)} m`;
  const cabe = texto.length * 6.5 * mpp.value < largo - 0.4 && corto >= 12 * mpp.value;
  return cabe ? { id: p.id, x: (p.f.x0 + p.f.x1) / 2, y: (p.f.y0 + p.f.y1) / 2, vertical, ok: p.ok, texto } : null;
}).filter((t): t is NonNullable<typeof t> => !!t));
const esLibre = (c: Cota) => (franjaPasillo(pasilloDe(c) as any).libreSobrante ?? 0) > 0.01;
const colorCota = (c: Cota) => {
  if (c.a === 'elemento') return '#0369a1';
  const p = pasilloDe(c);
  return !p ? '#334155' : !p.ok ? '#dc2626' : esLibre(c) ? '#64748b' : '#0f766e';
};

const rectDe = (r: RackPlano) => { const p = rectangulo(r); return { x: p.x0, y: p.y0, width: p.ancho, height: p.alto }; };

// Racks con cotas: el seleccionado o, al exportar, todos (sin repetir la misma cota entre vecinos)
const conCotas = computed(() => (props.cotasTodas ? props.racks : props.racks.filter((r) => r.id === props.seleccion)));
const cotas = computed(() => {
  if (props.dibujando) return [];
  const vistas = new Set<string>();
  const sel = props.cotasTodas ? [] : (props.bodega.elementos ?? []).filter((e: Elemento) => e.id === props.elementoSel);
  // Grilla de pilares elegida en bloque: cotas del bloque entero a los muros
  const g = grupoPilaresSel.value;
  const deElementos = g
    ? cotasElemento(g.caja, { ...props.bodega, elementos: (props.bodega.elementos ?? []).filter((e) => !g.ids.has(e.id)) })
    : sel.flatMap((e: Elemento) => cotasElemento(e, props.bodega));
  return [...conCotas.value.flatMap((r) => cotasRack(r, props.racks, props.bodega)), ...deElementos].filter((c): c is NonNullable<typeof c> => {
    if (!c) return false;
    const clave = [c.x1, c.y1, c.x2, c.y2].map((v) => v.toFixed(2)).sort().join();
    if (vistas.has(clave)) return false;
    vistas.add(clave);
    return true;
  });
});
const medidasRacks = computed(() => (props.dibujando ? [] : conCotas.value.map((r) => {
  const p = rectangulo(r);
  return { x0: p.x0, y0: p.y0, ancho: p.ancho, alto: p.alto, x: p.x0 + p.ancho / 2, y: p.y0 + p.alto / 2 };
})));

const trazo = computed(() => contorno(props.bodega).map((p: Punto, i: number) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') + ' Z');

const hayPilares = computed(() => (props.bodega.elementos ?? []).some((el) => el.clase === 'pilar'));
const pilaresEnRacks = computed(() => (props.bodega.elementos ?? []).filter((el) => el.clase === 'pilar' && props.racks.some((r) => (r as any).pilares && pilarDentro(r, el))));

function figura(r: RackPlano) {
  const p = rectangulo(r);
  const m = medidasRack(r) as Record<string, any>;
  const lado = r.rot === 90 || r.rot === 270;
  // Coordenadas locales (u a lo largo desde la izquierda, v desde el frente) → plano, igual que el giro 3D
  const L = lado ? p.alto : p.ancho, F = lado ? p.ancho : p.alto;
  const aPlanoLocal = (u: number, v: number) => ({
    0: [p.x0 + u, p.y0 + v],
    90: [p.x0 + F - v, p.y0 + u],
    180: [p.x0 + L - u, p.y0 + F - v],
    270: [p.x0 + v, p.y0 + L - u],
  })[r.rot];
  const seg = (u0: number, v0: number, u1: number, v1: number) => [...aPlanoLocal(u0, v0), ...aPlanoLocal(u1, v1)];
  const lineas: number[][] = [];
  // Lado por donde entra la grua en el drive-in
  const entrada = r.tipo === 'DI' ? seg(0, 0.06, L, 0.06) : null;
  const n = r.cuerpos, pasoCuerpo = L / n;
  for (let j = 1; j < n; j++) lineas.push(seg(j * pasoCuerpo, 0, j * pasoCuerpo, F));
  if (r.doble) lineas.push(seg(0, F / 2, L, F / 2));
  // Cuerpo túnel: rayado y flecha de paso de lado a lado
  let tunel = '';
  const vigasTunel: number[][] = [];
  if (m.tunel) {
    const u0 = m.tunel.indice * pasoCuerpo, u1 = u0 + pasoCuerpo;
    const pt = (u: number, v: number) => aPlanoLocal(u, v).join(' ');
    tunel = `M${pt(u0, 0)}L${pt(u1, 0)}L${pt(u1, F)}L${pt(u0, F)}Z`;
    for (let k = 0.3; k < pasoCuerpo + F; k += 0.35) {
      const ua = u0 + Math.min(k, pasoCuerpo), va = Math.max(0, k - pasoCuerpo);
      const ub = u0 + Math.max(0, k - F), vb = Math.min(k, F);
      tunel += `M${pt(ua, va)}L${pt(ub, vb)}`;
    }
    // Viga de túnel en cada cara de carga (frente y, si es doble, atrás)
    vigasTunel.push(seg(u0, 0.03, u1, 0.03));
    if (r.doble) vigasTunel.push(seg(u0, F - 0.03, u1, F - 0.03));
  }
  // Detalle legible: vigas en las caras de carga, marcos en cada division y los pallets de cada cuerpo (en el
  // drive-in, cada calle con sus fondos). Se omite cuando el pallet mide menos de 4 px en pantalla
  let vigas = '', marcos = '', pallets = '';
  const ps = (u0: number, v0: number, u1: number, v1: number) => {
    const a = aPlanoLocal(u0, v0), b = aPlanoLocal(u1, v1);
    return `M${a[0]} ${a[1]}H${b[0]}V${b[1]}H${a[0]}Z`;
  };
  const caras = r.doble ? [[0, F / 2], [F / 2, F]] : [[0, F]];
  if (r.tipo === 'RS') {
    const marco = Math.min(0.1, pasoCuerpo * 0.08), ppv = m.palletsPorViga || 2;
    const anchoP = (pasoCuerpo - marco) / ppv;
    for (const [v0, v1] of caras) {
      const fr = v0 === 0 ? v0 : v1;   // cara de carga de este lado
      vigas += `M${seg(0, fr, L, fr).slice(0, 2).join(' ')}L${seg(0, fr, L, fr).slice(2).join(' ')}`;
      for (let j = 0; j <= n; j++) marcos += ps(j * pasoCuerpo - marco / 2, v0 + 0.02, j * pasoCuerpo + marco / 2, v1 - 0.02);
      if (anchoP / mpp.value >= 4) {
        for (let j = 0; j < n; j++) {
          if (m.tunel && j === m.tunel.indice) continue;
          for (let q = 0; q < ppv; q++) {
            const u0 = j * pasoCuerpo + marco / 2 + q * anchoP + anchoP * 0.08;
            pallets += ps(u0, v0 + (v1 - v0) * 0.1, u0 + anchoP * 0.84, v1 - (v1 - v0) * 0.1);
          }
        }
      }
    }
  } else if (r.tipo === 'AR') {
    // Planta de una estantería: poste de ángulo en cada esquina de cada cuerpo, borde de la repisa al frente
    // y atrás, y las cajas de la repisa como quedan vistas desde arriba (columnas × filas). No son pallets:
    // sin el dato de la caja, la repisa queda lisa
    const poste = Math.min(pasoCuerpo * 0.18, Math.max(0.05, 3 * mpp.value));
    const cols = Math.max(0, Math.round(r.cajasPlanta?.cols ?? 0)), filas = Math.max(0, Math.round(r.cajasPlanta?.filas ?? 0));
    for (const [v0, v1] of caras) {
      vigas += `M${seg(0, v0, L, v0).slice(0, 2).join(' ')}L${seg(0, v0, L, v0).slice(2).join(' ')}M${seg(0, v1, L, v1).slice(0, 2).join(' ')}L${seg(0, v1, L, v1).slice(2).join(' ')}`;
      for (let j = 0; j <= n; j++) {
        const u = Math.min(L - poste, Math.max(0, j * pasoCuerpo - poste / 2));
        marcos += ps(u, v0, u + poste, v0 + poste) + ps(u, v1 - poste, u + poste, v1);
      }
      const ancho = (pasoCuerpo - poste) / Math.max(1, cols), hondo = (v1 - v0 - 2 * poste) / Math.max(1, filas);
      if (cols && filas && Math.min(ancho, hondo) / mpp.value >= 4) {
        for (let j = 0; j < n; j++) for (let c = 0; c < cols; c++) for (let f = 0; f < filas; f++) {
          const u0 = j * pasoCuerpo + poste / 2 + c * ancho + ancho * 0.08, w0 = v0 + poste + f * hondo + hondo * 0.08;
          pallets += ps(u0, w0, u0 + ancho * 0.84, w0 + hondo * 0.84);
        }
      }
    }
  } else if (r.tipo === 'DI' && m.fondos > 0) {
    const fondo = F / m.fondos;
    if (pasoCuerpo / mpp.value >= 6) {
      for (let j = 0; j < n; j++) for (let q = 0; q < m.fondos; q++) {
        pallets += ps(j * pasoCuerpo + pasoCuerpo * 0.12, q * fondo + fondo * 0.1, (j + 1) * pasoCuerpo - pasoCuerpo * 0.12, (q + 1) * fondo - fondo * 0.1);
      }
    }
  }
  // Rack sobre pilar (dueño 27-10): los huecos donde cae un pilar o cuya entrada tapa quedan tachados (no
  // guardan pallets); el resto del rack sigue igual
  let perdidos = '', tachas = '';
  if (r.tipo === 'RS' && hayPilares.value) {
    for (const h of perdidasPorPilares(r, props.bodega).huecos) {
      perdidos += ps(h.u0, h.v0 + 0.03, h.u1, h.v1 - 0.03);
      const a = aPlanoLocal(h.u0, h.v0 + 0.03), b = aPlanoLocal(h.u1, h.v1 - 0.03), c = aPlanoLocal(h.u0, h.v1 - 0.03), d = aPlanoLocal(h.u1, h.v0 + 0.03);
      tachas += `M${a[0]} ${a[1]}L${b[0]} ${b[1]}M${c[0]} ${c[1]}L${d[0]} ${d[1]}`;
    }
  }
  return { ...p, lineas, entrada, tunel, vigasTunel, vigas, marcos, pallets, perdidos, tachas, clave: `${r.id}-${m.tipo}` };
}

// Coordenadas del puntero en metros de la bodega
function aPlano(e: { clientX: number; clientY: number }) {
  const svg = svgRef.value!;
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM()!.inverse());
}

const redondear = (v: number, p: number) => Math.round(v / p) * p;
const aGrilla = (p: Punto) => {
  const m = marco.value;
  return {
    x: Math.min(m.x1, Math.max(m.x0, redondear(p.x, paso.value))),
    y: Math.min(m.y1, Math.max(m.y0, redondear(p.y, paso.value))),
  };
};

// ─── Ajustes al dibujar: esquina o punto medio cercano, angulo (15° o, con Shift, 0/90°), alineacion ───
function ajustarDibujo(p: Punto, e: { shiftKey: boolean }): Punto {
  const pts = puntosDibujo.value, tol = 0.45 * k.value;
  ajuste.value = null;
  guias.value = [];
  textoCursor.value = '';
  const medios = pts.slice(1).map((q, i) => ({ x: (q.x + pts[i].x) / 2, y: (q.y + pts[i].y) / 2 }));
  const cerca = (arr: Punto[]) => arr.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < tol);
  const esquina = cerca(pts), medio = cerca(medios);
  let q: Punto;
  if (esquina) { q = { ...esquina }; ajuste.value = 'esquina'; }
  else if (medio) { q = { x: +medio.x.toFixed(2), y: +medio.y.toFixed(2) }; ajuste.value = 'medio'; }
  else if (pts.length) {
    const u = pts[pts.length - 1];
    const dx = p.x - u.x, dy = p.y - u.y, largo = Math.hypot(dx, dy);
    let ang = (Math.atan2(-dy, dx) * 180) / Math.PI;   // 0° a la derecha, 90° hacia arriba
    const a15 = Math.round(ang / 15) * 15;
    const recto = e.shiftKey || !!props.soloRectos;
    const conAngulo = recto || Math.abs(ang - a15) <= 4;
    if (conAngulo) {
      ang = recto ? Math.round(ang / 90) * 90 : a15;
      const l = redondear(largo, 0.1), rad = (ang * Math.PI) / 180;
      q = { x: +(u.x + l * Math.cos(rad)).toFixed(2), y: +(u.y - l * Math.sin(rad)).toFixed(2) };
      // Muro recto: su punta se alinea con otra esquina (p. ej. para cerrar en la primera)
      if (recto) {
        const horizontal = Math.abs(q.y - u.y) < 1e-6;
        pts.slice(0, -1).forEach((v) => {
          if (horizontal && Math.abs(v.x - q.x) < tol) { q.x = v.x; guias.value.push({ x1: v.x, y1: v.y, x2: v.x, y2: q.y }); }
          if (!horizontal && Math.abs(v.y - q.y) < tol) { q.y = v.y; guias.value.push({ x1: v.x, y1: v.y, x2: q.x, y2: v.y }); }
        });
      }
    } else q = aGrilla(p);
    // Guias: alinear con la x o la y de otra esquina
    pts.slice(0, -1).forEach((v) => {
      if (Math.abs(v.x - q.x) < tol && !conAngulo) { q.x = v.x; guias.value.push({ x1: v.x, y1: v.y, x2: v.x, y2: q.y }); }
      if (Math.abs(v.y - q.y) < tol && !conAngulo) { q.y = v.y; guias.value.push({ x1: v.x, y1: v.y, x2: q.x, y2: v.y }); }
    });
    const l2 = Math.hypot(q.x - u.x, q.y - u.y);
    const a2 = (((Math.atan2(-(q.y - u.y), q.x - u.x) * 180) / Math.PI) + 360) % 360;
    if (l2 > 0.05) textoCursor.value = `${formatoM(l2)} m · ${Math.round(a2)}°`;
  } else q = aGrilla(p);
  return q;
}

// ─── Cinta de medir ───
const medicion = ref<{ a: Punto; b: Punto; fija: boolean } | null>(null);
watch(() => props.herramienta, () => { medicion.value = null; });

// Esquinas de racks y de la bodega a las que se pega la cinta
function ajustarMedida(p: Punto): Punto {
  const tol = 0.4 * k.value;
  const puntos = [...contorno(props.bodega), ...props.racks.flatMap((r) => {
    const q = rectangulo(r);
    return [{ x: q.x0, y: q.y0 }, { x: q.x0 + q.ancho, y: q.y0 }, { x: q.x0, y: q.y0 + q.alto }, { x: q.x0 + q.ancho, y: q.y0 + q.alto }];
  })];
  const c = puntos.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < tol);
  return c ? { x: c.x, y: c.y } : { x: redondear(p.x, 0.1), y: redondear(p.y, 0.1) };
}

// ─── Puntero ───
let arrastre: { tipo: 'rack' | 'vertice' | 'elemento'; id: string; dx: number; dy: number; puntero: number } | null = null;
let paneoInicio: { x: number; y: number; c: Punto; puntero: number; movio: boolean } | null = null;
const paneo = ref(false);

function presionarFondo(e: PointerEvent) {
  if (props.trazando) { if (e.button === 0) presionarTrazo(e); return; }
  if (e.button === 1 || (e.button === 0 && !props.dibujando && !props.calibrando && props.herramienta !== 'medir')) {
    // Arrastrar el piso desplaza el plano (con zoom); un clic sin mover deselecciona
    const v = vista.value;
    paneoInicio = { x: e.clientX, y: e.clientY, c: { x: v.x + v.w / 2, y: v.y + v.h / 2 }, puntero: e.pointerId, movio: false };
    svgRef.value?.setPointerCapture(e.pointerId);
    return;
  }
  if (e.button !== 0) return;
  if (props.calibrando) {
    const q = aPlano(e);
    emit('punto-calibracion', { x: +q.x.toFixed(3), y: +q.y.toFixed(3) });
    return;
  }
  if (props.herramienta === 'medir' && !props.dibujando) {
    const p = ajustarMedida(aPlano(e));
    medicion.value = !medicion.value || medicion.value.fija ? { a: p, b: p, fija: false } : { ...medicion.value, b: p, fija: true };
    return;
  }
  if (props.dibujando) emit('agregar-punto', ajustarDibujo(aPlano(e), e));
}

// ─── Trazado de un pasillo peatonal ───
// Tocar (o hacer clic) marca donde empieza; arrastrar o tocar otra vez marca donde termina el tramo. Cada
// tramo es recto (horizontal o vertical) y se ajusta a 0,05 m, a los muros y a los bordes de racks y
// elementos (el borde del pasillo queda pegado a ellos). Doble toque, Esc o "Listo" terminan.
const cursorTrazo = ref<Punto | null>(null);
const guiasTrazo = ref<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
let trazoPresion: { puntero: number; inicio: Punto; x: number; y: number; movio: boolean; nuevo: boolean } | null = null;
let ultimoToque = { t: 0, x: 0, y: 0 };
watch(() => props.trazando, (v) => { if (!v) { cursorTrazo.value = null; guiasTrazo.value = []; trazoPresion = null; } });
const ultimoTrazo = computed(() => { const pts = props.trazoPeatonal?.puntos ?? []; return pts.length ? pts[pts.length - 1] : null; });
// Líneas a las que se pega el eje del pasillo: muros, racks y elementos (justo encima o con el pasillo al lado)
function lineasAjuste() {
  const w = props.trazoPeatonal?.ancho ?? 1.2, xs: number[] = [], ys: number[] = [];
  const borde = (x0: number, y0: number, x1: number, y1: number, dentro: boolean) => {
    // Muro: el pasillo va por dentro; rack o elemento: por fuera, pegado a su borde
    const s = dentro ? 1 : -1;
    xs.push(x0 + s * w / 2, x1 - s * w / 2, x0, x1); ys.push(y0 + s * w / 2, y1 - s * w / 2, y0, y1);
  };
  contorno(props.bodega).forEach((q: Punto) => { xs.push(q.x + w / 2, q.x - w / 2); ys.push(q.y + w / 2, q.y - w / 2); });
  const c = caja(contorno(props.bodega));
  borde(c.x0, c.y0, c.x1, c.y1, true);
  props.racks.forEach((r) => { const q = rectangulo(r); borde(q.x0, q.y0, q.x0 + q.ancho, q.y0 + q.alto, false); });
  (props.bodega.elementos ?? []).filter((e) => e.clase !== 'grua' && e.clase !== 'pasilloPeatonal').forEach((e) => {
    const q = rectElemento(e); borde(q.x0, q.y0, q.x0 + q.ancho, q.y0 + q.alto, false);
  });
  (props.trazoPeatonal?.puntos ?? []).forEach((q) => { xs.push(q.x); ys.push(q.y); });
  return { xs, ys };
}
function ajustarTrazo(p: Punto, desde: Punto | null): Punto {
  const tol = 12 * mpp.value, { xs, ys } = lineasAjuste();
  const cerca = (v: number, lista: number[]) => lista.reduce((m, w) => (Math.abs(w - v) < Math.abs(m - v) ? w : m), Infinity);
  let q = { x: redondear(p.x, 0.05), y: redondear(p.y, 0.05) };
  // Recto: horizontal o vertical desde el punto anterior
  let horizontal = true;
  if (desde) {
    horizontal = Math.abs(p.x - desde.x) >= Math.abs(p.y - desde.y);
    q = horizontal ? { x: q.x, y: desde.y } : { x: desde.x, y: q.y };
  }
  const guias: typeof guiasTrazo.value = [], c = caja(contorno(props.bodega));
  const ax = cerca(p.x, xs), ay = cerca(p.y, ys);
  if ((!desde || horizontal) && Math.abs(ax - p.x) <= tol) { q.x = +ax.toFixed(3); guias.push({ x1: q.x, y1: c.y0, x2: q.x, y2: c.y1 }); }
  if ((!desde || !horizontal) && Math.abs(ay - p.y) <= tol) { q.y = +ay.toFixed(3); guias.push({ x1: c.x0, y1: q.y, x2: c.x1, y2: q.y }); }
  guiasTrazo.value = guias;
  // Dentro de la bodega
  q.x = Math.min(c.x1, Math.max(c.x0, q.x)); q.y = Math.min(c.y1, Math.max(c.y0, q.y));
  return q;
}
// Tramo en vista previa: del último punto (o de donde empezó el arrastre) al cursor, con su ancho real
const previaTramo = computed(() => {
  const a = trazoPresion?.nuevo ? trazoPresion.inicio : ultimoTrazo.value, b = cursorTrazo.value;
  if (!props.trazando || !a || !b) return null;
  const largo = Math.hypot(b.x - a.x, b.y - a.y);
  if (largo < 0.05) return null;
  const w = props.trazoPeatonal?.ancho ?? 1.2, h = Math.abs(b.y - a.y) < 1e-6;
  const rect = h
    ? { x: Math.min(a.x, b.x) - w / 2, y: a.y - w / 2, width: largo + w, height: w }
    : { x: a.x - w / 2, y: Math.min(a.y, b.y) - w / 2, width: w, height: largo + w };
  const off = (w / 2 + 0.45 * k.value);
  return { rect, largo, tx: h ? (a.x + b.x) / 2 : a.x + off + 0.3 * k.value, ty: h ? a.y - off : (a.y + b.y) / 2 };
});
function presionarTrazo(e: PointerEvent) {
  const p = aPlano(e), ahora = performance.now();
  // Doble toque (o doble clic) cerca del anterior: termina
  if (ahora - ultimoToque.t < 380 && Math.hypot(e.clientX - ultimoToque.x, e.clientY - ultimoToque.y) < 28 && (props.trazoPeatonal?.puntos.length ?? 0) > 0) {
    ultimoToque = { t: 0, x: 0, y: 0 };
    emit('terminar-trazo');
    return;
  }
  ultimoToque = { t: ahora, x: e.clientX, y: e.clientY };
  const desde = ultimoTrazo.value;
  const q = ajustarTrazo(p, desde);
  cursorTrazo.value = q;
  // Sin punto de partida: este es el inicio (si se arrastra, el tramo sale de aquí)
  if (!desde) emit('punto-trazo', q);
  trazoPresion = { puntero: e.pointerId, inicio: desde ?? q, x: e.clientX, y: e.clientY, movio: false, nuevo: !desde };
  svgRef.value?.setPointerCapture(e.pointerId);
}
function moverTrazo(e: PointerEvent, p: Punto) {
  if (trazoPresion && e.pointerId === trazoPresion.puntero && Math.hypot(e.clientX - trazoPresion.x, e.clientY - trazoPresion.y) > 6) trazoPresion.movio = true;
  // En el celular no hay cursor: la manilla aparece solo mientras el dedo está apoyado
  if (e.pointerType === 'touch' && !trazoPresion) return;
  cursorTrazo.value = ajustarTrazo(p, trazoPresion?.nuevo ? trazoPresion.inicio : ultimoTrazo.value);
}
function soltarTrazo(e: PointerEvent) {
  const pr = trazoPresion!;
  trazoPresion = null;
  const b = cursorTrazo.value ?? ajustarTrazo(aPlano(e), pr.inicio);
  if (e.pointerType === 'touch') { cursorTrazo.value = null; guiasTrazo.value = []; }
  // Solo un toque para marcar el inicio: espera el siguiente
  if (pr.nuevo && !pr.movio) return;
  if (Math.hypot(b.x - pr.inicio.x, b.y - pr.inicio.y) >= 0.5) emit('tramo-trazo', pr.inicio, b);
}

// ─── Pasillos editables: manillas, trazado por tramos y cruces ───
const pasilloSel = computed(() => (props.bodega.elementos ?? []).find((e) => e.id === props.elementoSel && (e.clase === 'pasilloPeatonal' || e.clase === 'pasilloGrua')) ?? null);
// Radio de ~22 px en pantalla (44 px de diametro para el dedo)
const radioManilla = computed(() => {
  void anchoPx.value;
  const r = svgRef.value?.getBoundingClientRect(), v = vista.value;
  return r && r.width ? Math.max(0.15, 22 * Math.max(v.w / r.width, v.h / r.height)) : 0.3;
});
const vertical = (el: Elemento) => el.alto >= el.ancho;
function manillas(el: Elemento) {
  const v = vertical(el), L = v ? el.alto : el.ancho, A = v ? el.ancho : el.alto;
  return v
    ? [{ tipo: 'ini', x: el.x, y: el.y - L / 2 }, { tipo: 'fin', x: el.x, y: el.y + L / 2 }, { tipo: 'ancho', x: el.x + A / 2, y: el.y }]
    : [{ tipo: 'ini', x: el.x - L / 2, y: el.y }, { tipo: 'fin', x: el.x + L / 2, y: el.y }, { tipo: 'ancho', x: el.x, y: el.y + A / 2 }];
}
// Bordes de muros y racks cercanos (10 cm): el pasillo se pega a ellos
function ajustarBorde(p: Punto): Punto {
  const tol = 0.12, c = marco.value, xs = [c.x0, c.x1], ys = [c.y0, c.y1];
  props.racks.forEach((r) => { const q = rectangulo(r); xs.push(q.x0, q.x0 + q.ancho); ys.push(q.y0, q.y0 + q.alto); });
  const cerca = (v: number, lista: number[]) => lista.reduce((m, w) => (Math.abs(w - v) < Math.abs(m - v) ? w : m), v);
  const x = cerca(p.x, xs), y = cerca(p.y, ys);
  return { x: Math.abs(x - p.x) <= tol ? x : p.x, y: Math.abs(y - p.y) <= tol ? y : p.y };
}
let manilla: { id: string; tipo: string; puntero: number } | null = null;
function tomarManilla(e: PointerEvent, el: Elemento, tipo: string) {
  manilla = { id: el.id, tipo, puntero: e.pointerId };
  svgRef.value?.setPointerCapture(e.pointerId);
}
function moverManilla(e: PointerEvent) {
  const el = (props.bodega.elementos ?? []).find((x) => x.id === manilla!.id);
  if (!el) return;
  const q = aPlano(e), p = ajustarBorde({ x: redondear(q.x, 0.05), y: redondear(q.y, 0.05) });
  const v = vertical(el), L = v ? el.alto : el.ancho;
  if (manilla!.tipo === 'ancho') {
    const A = Math.max(0.6, +(2 * Math.abs(v ? p.x - el.x : p.y - el.y)).toFixed(2));
    emit('cambiar-elemento', el.id, v ? { ancho: A } : { alto: A });
    return;
  }
  // Un extremo se mueve y el otro queda fijo
  const fijo = (v ? el.y : el.x) + (manilla!.tipo === 'ini' ? L / 2 : -L / 2);
  const movil = v ? p.y : p.x;
  const largo = Math.max(1, +Math.abs(movil - fijo).toFixed(2)), centro = +((movil + fijo) / 2).toFixed(3);
  emit('cambiar-elemento', el.id, v ? { alto: largo, y: centro } : { ancho: largo, x: centro });
}
function cruce(e: PointerEvent, el: Elemento) {
  const q = aPlano(e), v = vertical(el), L = v ? el.alto : el.ancho;
  const pos = +((v ? q.y - (el.y - L / 2) : q.x - (el.x - L / 2))).toFixed(2);
  emit('cruce-elemento', el.id, Math.max(0, Math.min(L, pos)));
}
// Abertura de 1,2 m centrada en `pos` (a lo largo del pasillo), dibujada sobre sus dos bordes
function rectAbertura(el: Elemento, pos: number) {
  const v = vertical(el), L = v ? el.alto : el.ancho, A = v ? el.ancho : el.alto, ab = 1.2;
  const a = (v ? el.y : el.x) - L / 2 + pos - ab / 2;
  return v ? { x: el.x - A / 2 - 0.1, y: a, width: A + 0.2, height: ab } : { x: a, y: el.y - A / 2 - 0.1, width: ab, height: A + 0.2 };
}

// ─── Pincel: el cliente arrastra por donde quiere el lineal; el largo son los cuerpos ───
// Un clic sin arrastrar no dibuja: si fue sobre un rack, lo elige (para girarlo, repetirlo o quitarlo)
const pintura = ref<{ a: Punto; b: Punto; puntero: number; px: number; py: number; movio: boolean; rack: string | null } | null>(null);
const cursorPincel = ref<Punto | null>(null);
const previaPincel = computed(() => {
  if (!props.pincel || props.dibujando) return null;
  if (pintura.value) return pintura.value.movio ? props.pincel(pintura.value.a, pintura.value.b) : null;
  return cursorPincel.value ? props.pincel(cursorPincel.value, cursorPincel.value) : null;
});
const etiquetaPincel = computed(() => {
  const b = pintura.value?.b ?? { x: 0, y: 0 };
  return { x: b.x + 14 * mpp.value, y: b.y - 18 * mpp.value };
});
const enCuadro = (q: Punto) => ({ x: Math.round(q.x * 10) / 10, y: Math.round(q.y * 10) / 10 });
function pincelAbajo(e: PointerEvent) {
  if (!props.pincel || props.dibujando || e.button !== 0) return;
  e.stopPropagation();
  e.preventDefault();
  const q = enCuadro(aPlano(e));
  const rack = (e.target as Element | null)?.closest?.('[data-rack]')?.getAttribute('data-rack') ?? null;
  pintura.value = { a: q, b: q, puntero: e.pointerId, px: e.clientX, py: e.clientY, movio: false, rack };
  svgRef.value?.setPointerCapture(e.pointerId);
}
watch(() => props.pincel, (v) => { if (!v) { pintura.value = null; cursorPincel.value = null; } });

function iniciarArrastre(e: PointerEvent, o: { tipo: 'rack' | 'vertice' | 'elemento'; id: string; x: number; y: number }) {
  if (e.button !== 0) return;
  if (o.tipo === 'rack') emit('seleccionar', o.id);
  if (o.tipo === 'elemento') emit('seleccionar-elemento', o.id);
  const p = aPlano(e);
  arrastre = { tipo: o.tipo, id: o.id, dx: o.x - p.x, dy: o.y - p.y, puntero: e.pointerId };
  svgRef.value?.setPointerCapture(e.pointerId);
}

function moverPuntero(e: PointerEvent) {
  if (paneoInicio && e.pointerId === paneoInicio.puntero) {
    const svg = svgRef.value!, r = svg.getBoundingClientRect(), v = vista.value;
    const metrosPorPx = Math.max(v.w / r.width, v.h / r.height);
    const dx = e.clientX - paneoInicio.x, dy = e.clientY - paneoInicio.y;
    if (Math.hypot(dx, dy) > 4) paneoInicio.movio = true;
    if (paneoInicio.movio && zoom.value > 1) {
      paneo.value = true;
      centro.value = { x: paneoInicio.c.x - dx * metrosPorPx, y: paneoInicio.c.y - dy * metrosPorPx };
    }
    return;
  }
  const p = aPlano(e);
  if (pintura.value && e.pointerId === pintura.value.puntero) {
    const movio = pintura.value.movio || Math.hypot(e.clientX - pintura.value.px, e.clientY - pintura.value.py) > 6;
    pintura.value = { ...pintura.value, b: enCuadro(p), movio };
    return;
  }
  if (props.pincel && !props.dibujando) { cursorPincel.value = e.pointerType === 'mouse' ? enCuadro(p) : null; return; }
  if (props.trazando) { moverTrazo(e, p); return; }
  if (props.dibujando) {
    cursor.value = ajustarDibujo(p, e);
    return;
  }
  if (props.herramienta === 'medir' && medicion.value && !medicion.value.fija) {
    medicion.value = { ...medicion.value, b: ajustarMedida(p) };
    return;
  }
  if (manilla && e.pointerId === manilla.puntero) { moverManilla(e); return; }
  if (estiro.value && e.pointerId === estiro.value.puntero) { moverFlecha(e); return; }
  if (!arrastre || e.pointerId !== arrastre.puntero) return;
  if (arrastre.tipo === 'rack') moviendo.value = true;
  const destino = { x: p.x + arrastre.dx, y: p.y + arrastre.dy };
  if (arrastre.tipo === 'rack') emit('mover', arrastre.id, destino.x, destino.y);
  else if (arrastre.tipo === 'elemento') emit('mover-elemento', arrastre.id, redondear(destino.x, PASO), redondear(destino.y, PASO));
  else emit('mover-vertice', Number(arrastre.id), { x: redondear(destino.x, Math.min(paso.value, 0.5)), y: redondear(destino.y, Math.min(paso.value, 0.5)) });
}

function soltar(e: PointerEvent) {
  if (pintura.value && e.pointerId === pintura.value.puntero) {
    const r = previaPincel.value, { movio, rack } = pintura.value;
    pintura.value = null;
    if (e.type !== 'pointerup') return;
    if (movio && r) emit('pintar', r);
    else if (!movio) emit('seleccionar', rack);
    return;
  }
  if (trazoPresion && e.pointerId === trazoPresion.puntero) { soltarTrazo(e); return; }
  if (paneoInicio && e.pointerId === paneoInicio.puntero) {
    if (!paneoInicio.movio) { emit('seleccionar', null); emit('seleccionar-muro', null); emit('seleccionar-elemento', null); }
    paneoInicio = null;
    paneo.value = false;
    return;
  }
  if (estiro.value && e.pointerId === estiro.value.puntero) {
    if (e.type === 'pointerup') moverFlecha(e, true);
    else emit('estirar-rack', estiro.value.orig, estiro.value.h.tipo, estiro.value.h.s, 0, true);
    estiro.value = null;
  }
  if (arrastre || manilla) emit('fin-cambio');
  arrastre = null;
  manilla = null;
  moviendo.value = false;
}

function teclado(e: KeyboardEvent, r: RackPlano) {
  focoTeclado.value = r.id;
  const d = e.shiftKey ? 1 : PASO;
  const mov: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
  if (mov[e.key]) {
    e.preventDefault();
    emit('mover', r.id, r.x + mov[e.key][0], r.y + mov[e.key][1]);
    emit('fin-cambio');
  } else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    emit('girar', r.id);
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    emit('eliminar', r.id);
  }
}

function tecladoElemento(e: KeyboardEvent, el: Elemento) {
  const d = e.shiftKey ? 1 : PASO;
  const mov: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
  if (mov[e.key]) {
    e.preventDefault();
    emit('mover-elemento', el.id, +(el.x + mov[e.key][0]).toFixed(2), +(el.y + mov[e.key][1]).toFixed(2));
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    emit('eliminar-elemento', el.id);
  }
}
</script>

<style scoped>
.plan-pulso { transform-box: fill-box; transform-origin: center; animation: plan-pulso 1.6s ease-out infinite; }
@keyframes plan-pulso { 0% { transform: scale(0.6); opacity: 0.9; } 100% { transform: scale(1.4); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .plan-pulso { animation: none; } }
</style>
