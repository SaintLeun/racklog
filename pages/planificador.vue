<template>
  <div>
    <section class="page-hero">
      <div class="container-page">
        <div class="max-w-3xl">
          <span class="eyebrow bg-white/5 text-brand-300 ring-white/10">Gratis y sin registro</span>
          <h1 class="page-hero__title mt-5">
            Planificador de <span class="text-brand-500">bodega</span>
          </h1>
          <p class="page-hero__lead">
            Indica las medidas de tu bodega, agrega racks y míralos en 3D. Cuando termines, pide tu cotización y un ejecutivo revisa tu diseño.
          </p>
        </div>
      </div>
    </section>

    <div class="border-b border-neutral-200">
      <div class="container-page">
        <Breadcrumbs :breadcrumbs="[{ label: 'Planificador', href: '/planificador' }]" />
      </div>
    </div>

    <section class="py-8 sm:py-10">
      <div class="container-page">
        <div class="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <!-- Panel -->
          <aside class="space-y-5 lg:order-1">
            <!-- 1. Bodega -->
            <div :class="['card p-5 transition', resaltar(0)]">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-600">1. Tu bodega</h2>
              <div role="group" aria-label="Forma de la bodega" class="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
                <button
                  v-for="op in [{ v: false, t: 'Rectangular' }, { v: true, t: 'Forma libre' }]" :key="op.t"
                  type="button" :aria-pressed="formaLibre === op.v"
                  :class="['h-10 rounded-lg text-sm font-semibold transition', formaLibre === op.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600 hover:text-neutral-900']"
                  @click="cambiarForma(op.v)"
                >{{ op.t }}</button>
              </div>
              <!-- Forma libre ya cerrada: las medidas reales del contorno (las mismas que van en la cotizacion) -->
              <dl v-if="bodega.forma && !dibujando" class="mt-4 grid grid-cols-2 gap-3">
                <div class="rounded-xl bg-neutral-50 px-3 py-2 ring-1 ring-neutral-200">
                  <dt class="text-xs font-medium text-neutral-500">Ancho total</dt>
                  <dd class="text-lg font-semibold tabular-nums text-neutral-900">{{ medidasContorno.ancho.toLocaleString('es-CL') }} m</dd>
                </div>
                <div class="rounded-xl bg-neutral-50 px-3 py-2 ring-1 ring-neutral-200">
                  <dt class="text-xs font-medium text-neutral-500">Largo total</dt>
                  <dd class="text-lg font-semibold tabular-nums text-neutral-900">{{ medidasContorno.largo.toLocaleString('es-CL') }} m</dd>
                </div>
              </dl>
              <div v-else class="mt-4 grid grid-cols-2 gap-3">
                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium text-neutral-700">{{ dibujando ? 'Área de dibujo: ancho (m)' : 'Ancho (m)' }}</span>
                  <input
                    v-model.number="bodegaEntrada.ancho"
                    type="number" inputmode="decimal" :min="LIMITES.bodega.min" :max="LIMITES.bodega.max" step="0.5"
                    class="plan-input" @change="aplicarBodega"
                  >
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium text-neutral-700">{{ dibujando ? 'Área de dibujo: largo (m)' : 'Largo (m)' }}</span>
                  <input
                    v-model.number="bodegaEntrada.largo"
                    type="number" inputmode="decimal" :min="LIMITES.bodega.min" :max="LIMITES.bodega.max" step="0.5"
                    class="plan-input" @change="aplicarBodega"
                  >
                </label>
              </div>
              <template v-if="formaLibre">
                <p class="mt-3 text-sm text-neutral-600">
                  <template v-if="dibujando">
                    Haz clic en cada esquina de tu bodega sobre la cuadrícula ({{ puntosDibujo.length }} {{ puntosDibujo.length === 1 ? 'esquina' : 'esquinas' }}). Para cerrar, haz clic en el primer punto (naranja).
                  </template>
                  <template v-else>
                    Arrastra las esquinas naranjas para ajustar la forma, o vuelve a dibujar el contorno.
                  </template>
                </p>
                <!-- Muro por teclado: largo y angulo desde la ultima esquina -->
                <form v-if="dibujando" class="mt-3 rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200" @submit.prevent="agregarMuroTeclado">
                  <p class="flex items-center text-sm font-medium text-neutral-800">
                    O escribe cada muro
                    <PlanificadorAyuda titulo="muros por teclado">Largo en metros y ángulo: 0° hacia la derecha, 90° hacia arriba, 180° a la izquierda y 270° hacia abajo. Al dibujar con el mouse, Shift fija 0° o 90°.</PlanificadorAyuda>
                  </p>
                  <div class="mt-2 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                    <label class="block text-xs text-neutral-600">Largo del muro (m)
                      <input v-model.number="muroTeclado.largo" type="number" inputmode="decimal" min="0.1" step="0.1" class="plan-input mt-1 !h-10" placeholder="12,5">
                    </label>
                    <label class="block text-xs text-neutral-600">Ángulo del muro (°)
                      <input v-model.number="muroTeclado.angulo" type="number" inputmode="numeric" step="1" class="plan-input mt-1 !h-10" placeholder="0">
                    </label>
                    <button type="submit" class="plan-accion h-10 px-3" :disabled="!(muroTeclado.largo > 0)">Agregar</button>
                  </div>
                </form>
                <div v-if="dibujando" class="mt-3 grid grid-cols-3 gap-2">
                  <button type="button" class="plan-accion" :disabled="!puntosDibujo.length" @click="puntosDibujo.pop()">Deshacer</button>
                  <button type="button" class="plan-accion" @click="cancelarDibujo">Cancelar</button>
                  <button type="button" class="plan-accion bg-brand-600 text-white hover:bg-brand-700" :disabled="puntosDibujo.length < 3" @click="cerrarContorno">Terminar</button>
                </div>
                <button v-else type="button" class="plan-accion mt-3 w-full" @click="empezarDibujo">Volver a dibujar el contorno</button>
              </template>
              <!-- Muro seleccionado (clic en su medida): se escribe el largo exacto -->
              <form v-if="muroSel !== null && !dibujando" class="mt-3 rounded-xl bg-sky-50 p-3 ring-1 ring-sky-200" @submit.prevent="aplicarMuro">
                <label for="plan-muro" class="block text-sm font-medium text-neutral-800">Largo del muro {{ muroSel + 1 }} (m)</label>
                <div class="mt-1.5 grid grid-cols-[1fr_auto_auto] gap-2">
                  <input id="plan-muro" ref="inputMuro" v-model.number="largoMuro" type="number" inputmode="decimal" min="1" step="0.1" class="plan-input !h-10">
                  <button type="submit" class="plan-accion h-10 bg-sky-600 px-3 text-white hover:bg-sky-700">Aplicar</button>
                  <button type="button" class="plan-accion h-10 px-3" @click="muroSel = null">Cerrar</button>
                </div>
              </form>
              <p v-else-if="!dibujando" class="mt-3 text-xs text-neutral-500">Toca la medida de un muro en el plano para escribir su largo exacto.</p>
              <div v-if="!dibujando" class="mt-4">
                <div class="mb-1.5 flex items-center text-sm font-medium text-neutral-700">
                  <label for="plan-altura">Altura libre (m)</label>
                  <PlanificadorAyuda titulo="altura libre">Mide hasta lo más bajo del techo: viga, cercha, luminaria o rociador. Con ella sabemos cuántos niveles caben.</PlanificadorAyuda>
                </div>
                <input
                  id="plan-altura"
                  v-model.number="alturaEntrada"
                  type="number" inputmode="decimal" min="2" max="40" step="0.1" placeholder="Ej.: 7,5"
                  class="plan-input" @change="aplicarAltura"
                >
              </div>
              <!-- Operacion: grua y peso de la carga (definen pasillos, niveles y el semaforo de carga) -->
              <div v-if="!dibujando" class="mt-4 rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200">
                <p class="flex items-center text-sm font-medium text-neutral-800">
                  Tu operación
                  <PlanificadorAyuda titulo="grúa y peso">La grúa define el ancho de pasillo y hasta qué altura se carga; el peso, si las vigas o bandejas lo resisten. Los valores son referenciales y los confirma Racklog.</PlanificadorAyuda>
                </p>
                <label for="plan-grua" class="mt-2 block text-xs font-medium text-neutral-600">Equipo que usas</label>
                <select id="plan-grua" v-model="bodega.grua" class="plan-input mt-1 !h-10 text-sm">
                  <option v-for="(g, k) in GRUAS" :key="k" :value="k">{{ g.nombre }} · pasillo {{ formatoM(g.pasillo) }} m · hasta {{ formatoM(g.levante) }} m</option>
                </select>
                <div class="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label for="plan-peso" class="block text-xs font-medium text-neutral-600">Peso por pallet (kg)</label>
                    <input id="plan-peso" v-model.number="bodega.pesoPallet" type="number" min="0" step="50" placeholder="1.000" class="plan-input mt-1 !h-10">
                  </div>
                  <div v-if="racks.some((r) => r.tipo === 'AR')">
                    <label for="plan-peso-bandeja" class="block text-xs font-medium text-neutral-600">Peso por bandeja (kg)</label>
                    <input id="plan-peso-bandeja" v-model.number="bodega.pesoBandeja" type="number" min="0" step="10" placeholder="150" class="plan-input mt-1 !h-10">
                  </div>
                </div>
                <p v-if="esProvisorio(gruaActual)" class="mt-2 text-xs text-neutral-500">Pasillos, alturas y capacidades provisorios: Racklog los confirma en la revisión.</p>
              </div>

              <!-- Pilares, portones, andenes, oficinas y zonas bloqueadas -->
              <div v-if="!dibujando" class="mt-4 rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200">
                <p class="flex items-center text-sm font-medium text-neutral-800">
                  Pilares, portones y zonas
                  <PlanificadorAyuda titulo="elementos de la bodega">Marca lo que no se puede mover: pilares, portones, andenes, oficinas o zonas que deben quedar libres. Si un rack queda encima, se pone rojo.</PlanificadorAyuda>
                </p>
                <div v-for="g in GRUPOS_ELEMENTOS" :key="g.t" class="mt-2">
                  <p class="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{{ g.t }}</p>
                  <div class="mt-1 grid grid-cols-2 gap-1.5">
                    <button v-for="cl in g.clases" :key="cl" type="button" class="plan-accion h-9 px-1 text-xs" @click="agregarElemento(cl)">+ {{ ELEMENTOS[cl].nombre }}</button>
                  </div>
                </div>
                <details class="mt-3 rounded-lg bg-white ring-1 ring-neutral-200">
                  <summary class="cursor-pointer px-2.5 py-2 text-xs font-semibold text-neutral-800">Grilla de pilares de la bodega</summary>
                  <form class="grid grid-cols-2 gap-2 px-2.5 pb-2.5 text-xs text-neutral-600" @submit.prevent="ponerGrillaPilares">
                    <label>Entre ejes, a lo ancho (m)<input v-model.number="gp.pasoX" type="number" min="2" max="40" step="0.5" class="plan-input mt-0.5 !h-8 !px-2 text-sm"></label>
                    <label>Entre ejes, a lo largo (m)<input v-model.number="gp.pasoY" type="number" min="2" max="40" step="0.5" class="plan-input mt-0.5 !h-8 !px-2 text-sm"></label>
                    <label>Primer eje desde muro izq. (m)<input v-model.number="gp.offX" type="number" min="0" max="40" step="0.5" class="plan-input mt-0.5 !h-8 !px-2 text-sm"></label>
                    <label>Primer eje desde muro sup. (m)<input v-model.number="gp.offY" type="number" min="0" max="40" step="0.5" class="plan-input mt-0.5 !h-8 !px-2 text-sm"></label>
                    <label>Pilar frente (cm)<input v-model.number="gp.ancho" type="number" min="10" max="150" step="5" class="plan-input mt-0.5 !h-8 !px-2 text-sm"></label>
                    <label>Pilar fondo (cm)<input v-model.number="gp.fondo" type="number" min="10" max="150" step="5" class="plan-input mt-0.5 !h-8 !px-2 text-sm"></label>
                    <p class="col-span-2 text-[11px] text-neutral-500">Mide de centro a centro de pilar (ejes). Reemplaza los pilares que ya pusiste.</p>
                    <button type="submit" class="plan-accion col-span-2 h-8 text-xs">Poner {{ vistaPreviaGrilla }} pilares</button>
                  </form>
                </details>
              </div>

              <!-- Calcar un plano o foto -->
              <div class="mt-4 rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200">
                <p class="flex items-center text-sm font-medium text-neutral-800">
                  Calcar un plano o foto
                  <PlanificadorAyuda titulo="calcar un plano">Sube una imagen de tu plano (si es PDF, una captura de pantalla). La calibras con una medida que conozcas y dibujas el contorno encima. Se adjunta a tu cotización; no queda guardada en esta página.</PlanificadorAyuda>
                </p>
                <template v-if="!calco">
                  <input ref="inputCalco" type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" @change="subirCalco">
                  <button type="button" class="plan-accion mt-2 w-full" @click="inputCalco?.click()">Subir plano o foto</button>
                </template>
                <template v-else-if="calibrando">
                  <p class="mt-2 text-sm text-pink-800" role="status">
                    {{ puntosCalibracion.length < 2 ? `Haz clic en los dos extremos de una medida que conozcas, por ejemplo un muro (${puntosCalibracion.length} de 2).` : '¿Cuánto mide esa línea en la realidad?' }}
                  </p>
                  <form v-if="puntosCalibracion.length === 2" class="mt-2 grid grid-cols-[1fr_auto] gap-2" @submit.prevent="calibrarCalco">
                    <label class="sr-only" for="plan-calibra">Medida real en metros</label>
                    <input id="plan-calibra" v-model.number="medidaCalibracion" type="number" inputmode="decimal" min="0.5" step="0.1" placeholder="Metros" class="plan-input !h-10">
                    <button type="submit" class="plan-accion h-10 bg-pink-600 px-3 text-white hover:bg-pink-700" :disabled="!(medidaCalibracion > 0)">Calibrar</button>
                  </form>
                  <div class="mt-2 flex gap-4 text-xs font-medium text-neutral-500">
                    <button v-if="puntosCalibracion.length" type="button" class="hover:text-neutral-800" @click="puntosCalibracion = []">Marcar de nuevo</button>
                    <button type="button" class="hover:text-neutral-800" @click="calco.calibrado ? (calibrando = false) : quitarCalco()">Cancelar</button>
                  </div>
                </template>
                <template v-else>
                  <label class="mt-2 flex items-center gap-3 text-xs text-neutral-600">
                    Transparencia
                    <input v-model.number="calco.opacidad" type="range" min="0.15" max="1" step="0.05" class="flex-1 accent-brand-600">
                  </label>
                  <div class="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" class="plan-accion" @click="calibrando = true; puntosCalibracion = []">Calibrar de nuevo</button>
                    <button type="button" class="plan-accion text-red-700 hover:bg-red-50" @click="quitarCalco">Quitar</button>
                  </div>
                  <button v-if="!dibujando" type="button" class="plan-accion mt-2 w-full bg-brand-600 text-white hover:bg-brand-700" @click="formaLibre ? empezarDibujo() : cambiarForma(true)">Dibujar el contorno encima</button>
                </template>
              </div>
              <p class="mt-3 text-xs text-neutral-500">{{ Math.round(area(contorno(bodega))) }} m² · cuadrícula de {{ formatoM(grilla) }} m</p>
            </div>

            <!-- Tipos de pallet del cliente (mezcla por nivel en selectivo) -->
            <PlanificadorTiposPallet
              v-model:tipos="bodega.pallets" :por-tipo="ubic.porTipo" :libres="ubic.libres"
              :hay-r-s="racks.some((r) => r.tipo === 'RS')" @acomodar="acomodarPallets"
            />

            <!-- 2. Agregar racks -->
            <div :class="['card p-5 transition', resaltar(1)]">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-600">2. Agrega racks</h2>
              <div class="mt-4 grid grid-cols-2 gap-3">
                <button
                  v-for="(t, clave) in TIPOS" :key="clave"
                  type="button" class="plan-add" :disabled="dibujando" @click="agregar(clave)"
                >
                  <img :src="t.imagen" alt="" width="160" height="90" loading="lazy" class="h-14 w-full rounded-lg object-cover">
                  <span class="mt-2 block text-sm font-semibold">{{ t.nombre }}</span>
                  <span class="block text-xs text-neutral-500">{{ t.uso }}</span>
                </button>
              </div>
            </div>

            <!-- Llenado automatico -->
            <div v-if="!dibujando" class="-mt-2 card p-4">
              <p class="flex items-center text-sm font-medium text-neutral-800">
                Llenar la bodega automáticamente
                <PlanificadorAyuda titulo="llenar la bodega">Pone filas del sistema elegido con el pasillo de tu grúa, los niveles que caben bajo el techo y esquivando pilares y zonas. Reemplaza los racks que tengas.</PlanificadorAyuda>
              </p>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button type="button" class="plan-accion" @click="llenar('RS')">Con selectivo</button>
                <button type="button" class="plan-accion" @click="llenar('DI')">Con drive-in</button>
              </div>
            </div>

            <!-- 3. Rack seleccionado -->
            <div :class="['card p-5 transition', resaltar(2)]">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-600">3. Ajusta el rack</h2>
              <template v-if="elementoActual">
                <p class="mt-3 font-semibold text-neutral-900">{{ ELEMENTOS[elementoActual.clase].nombre }}</p>
                <label v-if="['oficina', 'zona', 'anden', 'porton'].includes(elementoActual.clase)" class="mt-3 block text-sm font-medium text-neutral-700">Nombre
                  <input :value="elementoActual.nombre ?? ''" type="text" :placeholder="ELEMENTOS[elementoActual.clase].nombre" class="plan-input mt-1 !h-10" @change="cambiarElemento({ nombre: ($event.target as HTMLInputElement).value.trim() || undefined })">
                </label>
                <label v-if="elementoActual.clase === 'grua'" class="mt-3 block text-sm font-medium text-neutral-700">Tipo de equipo
                  <select :value="elementoActual.modelo ?? 'contrapeso'" class="plan-input mt-1 !h-10" @change="cambiarModeloGrua(($event.target as HTMLSelectElement).value)">
                    <option v-for="(g, k) in GRUAS" :key="k" :value="k">{{ g.nombre }}</option>
                  </select>
                </label>
                <p v-if="elementoActual.clase === 'grua'" class="mt-1 text-xs text-neutral-500">Pasillo que necesita: ~{{ formatoM(GRUAS[(elementoActual.modelo ?? 'contrapeso') as keyof typeof GRUAS].pasillo) }} m. Agrega un "Pasillo de grúa" para reservarlo.</p>
                <p class="mt-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Ubicación (desde los muros)</p>
                <div class="mt-1.5 grid grid-cols-2 gap-3">
                  <label class="block text-sm font-medium text-neutral-700">Desde la izquierda (m)
                    <input :value="formatoM(posElemento.izq).replace(',', '.')" type="number" step="0.05" class="plan-input mt-1 !h-10" @change="moverElementoA('x', Number(($event.target as HTMLInputElement).value))">
                  </label>
                  <label class="block text-sm font-medium text-neutral-700">Desde arriba (m)
                    <input :value="formatoM(posElemento.arriba).replace(',', '.')" type="number" step="0.05" class="plan-input mt-1 !h-10" @change="moverElementoA('y', Number(($event.target as HTMLInputElement).value))">
                  </label>
                </div>
                <p class="mt-1 text-xs text-neutral-500">Las cotas azules del plano muestran la distancia libre al muro o al elemento vecino.</p>
                <div class="mt-3 grid grid-cols-2 gap-3">
                  <label class="block text-sm font-medium text-neutral-700">Ancho (m)
                    <input :value="elementoActual.ancho" type="number" min="0.1" step="0.1" class="plan-input mt-1 !h-10" @change="cambiarElemento({ ancho: Number(($event.target as HTMLInputElement).value) })">
                  </label>
                  <label class="block text-sm font-medium text-neutral-700">Largo (m)
                    <input :value="elementoActual.alto" type="number" min="0.1" step="0.1" class="plan-input mt-1 !h-10" @change="cambiarElemento({ alto: Number(($event.target as HTMLInputElement).value) })">
                  </label>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" class="plan-accion" @click="cambiarElemento({ ancho: elementoActual.alto, alto: elementoActual.ancho })">Girar</button>
                  <button type="button" class="plan-accion text-red-700 hover:bg-red-50" @click="eliminarElemento(elementoActual.id)">Eliminar</button>
                </div>
              </template>
              <template v-else-if="rackSel">
                <p class="mt-3 font-semibold text-neutral-900">
                  {{ indiceSel + 1 }}. {{ NOMBRE[rackSel.tipo] }}
                </p>
                <div class="mt-4 space-y-4">
                  <div role="group" aria-label="Estado del rack" class="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
                    <button
                      v-for="op in [{ v: false, t: 'Nuevo (a cotizar)' }, { v: true, t: 'Ya lo tengo' }]" :key="op.t"
                      type="button" :aria-pressed="!!rackSel.existente === op.v"
                      :class="['h-10 rounded-lg text-sm font-semibold transition', !!rackSel.existente === op.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600 hover:text-neutral-900']"
                      @click="cambiar({ existente: op.v })"
                    >{{ op.t }}</button>
                  </div>
                  <p v-if="TIPOS[rackSel.tipo].doble" class="-mb-2 flex items-center text-sm font-medium text-neutral-700">
                    Tipo
                    <PlanificadorAyuda titulo="simple o doble">Doble son dos racks espalda con espalda: se carga por ambos lados y ahorra un pasillo.</PlanificadorAyuda>
                  </p>
                  <div v-if="TIPOS[rackSel.tipo].doble" role="group" aria-label="Tipo" class="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
                    <button
                      v-for="op in [{ v: false, t: 'Simple' }, { v: true, t: 'Doble' }]" :key="op.t"
                      type="button" :aria-pressed="rackSel.doble === op.v"
                      :class="['h-10 rounded-lg text-sm font-semibold transition', rackSel.doble === op.v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600 hover:text-neutral-900']"
                      @click="cambiar({ doble: op.v })"
                    >{{ op.t }}</button>
                  </div>

                  <template v-if="rackSel.tipo === 'RS'">
                    <p class="-mb-2 flex items-center text-sm font-medium text-neutral-700">
                      Pallets por nivel
                      <PlanificadorAyuda titulo="pallets por nivel">Cuántos pallets van uno al lado del otro en cada nivel de un cuerpo. Más pallets por nivel = viga más larga y más gruesa, y menos marcos.</PlanificadorAyuda>
                    </p>
                    <div role="group" aria-label="Pallets por nivel" class="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
                      <button
                        v-for="n in [1, 2, 3]" :key="n" type="button" :aria-pressed="(rackSel.porViga ?? 2) === n"
                        :class="['h-10 rounded-lg text-sm font-semibold transition', (rackSel.porViga ?? 2) === n ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600 hover:text-neutral-900']"
                        @click="cambiar({ porViga: n })"
                      >{{ n }} pallet{{ n > 1 ? 's' : '' }}</button>
                    </div>
                    <p class="-mt-2 text-xs text-neutral-500">Viga de {{ formatoM(medSel.viga) }} m · perfil ~{{ Math.round(medSel.altoViga * 1000) }} mm (referencial)</p>

                    <div class="grid grid-cols-2 gap-3">
                      <label class="block text-sm font-medium text-neutral-700">
                        <span class="flex items-center">Sobrante de marco
                          <PlanificadorAyuda titulo="sobrante de marco">Lo que sube el marco sobre la última viga: entre 300 y 1.000 mm. Si el pallet de arriba es más alto, sobresale del marco.</PlanificadorAyuda>
                        </span>
                        <select :value="rackSel.sobrante ?? 0.3" class="plan-input mt-1 !h-10" @change="cambiar({ sobrante: Number(($event.target as HTMLSelectElement).value) })">
                          <option v-for="v in [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]" :key="v" :value="v">{{ Math.round(v * 1000) }} mm</option>
                        </select>
                      </label>
                      <div class="text-xs text-neutral-600">
                        <p class="mt-6">Marco de <b>{{ formatoM(medSel.alto) }} m</b></p>
                        <p v-if="medSel.sobresaleCarga > 0">La carga de arriba sobresale {{ formatoM(medSel.sobresaleCarga) }} m</p>
                      </div>
                    </div>

                    <div class="rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200">
                      <p class="flex items-center text-sm font-semibold text-neutral-900">Planos de carga
                        <PlanificadorAyuda titulo="planos de carga">Una superficie sobre las vigas para dejar cajas sin pallet o pallets cuya carga sobresale. Se pone por nivel.</PlanificadorAyuda>
                      </p>
                      <div class="mt-2 space-y-1.5">
                        <div v-for="i in rackSel.niveles" :key="i" class="flex items-center justify-between gap-2 text-xs">
                          <span class="font-medium text-neutral-700">Nivel {{ rackSel.niveles + 1 - i }}</span>
                          <select :value="medSel.planos?.[rackSel.niveles + 1 - i] ?? ''" class="h-8 rounded-md border border-neutral-200 bg-white px-1.5 text-xs" @change="cambiarPlano(rackSel.niveles + 1 - i, ($event.target as HTMLSelectElement).value || null)">
                            <option value="">Sin plano</option>
                            <option value="malla">Malla electrosoldada</option>
                            <option value="madera">Madera (terciado)</option>
                            <option value="metal">Bandeja metálica</option>
                          </select>
                        </div>
                      </div>
                      <button type="button" class="mt-2 w-full rounded-md py-1 text-[11px] font-semibold text-brand-800 hover:bg-brand-50" @click="cambiar({ planos: Array.from({ length: rackSel.niveles + 1 }, (_, j) => (j > 0 ? 'malla' : null)) })">Malla en todos los niveles</button>
                    </div>

                    <div class="rounded-xl bg-sky-50/60 p-3 ring-1 ring-sky-200">
                      <label class="flex items-center justify-between gap-3 text-sm font-semibold text-neutral-900">
                        <span class="flex items-center">Cuerpo túnel
                          <PlanificadorAyuda titulo="cuerpo túnel">Un cuerpo sin pallets abajo para que pase la grúa o la gente de un pasillo a otro. Su primera viga queda sobre el paso libre y es más gruesa.</PlanificadorAyuda>
                        </span>
                        <input type="checkbox" class="h-5 w-5 accent-orange-600" :checked="!!rackSel.tunel" @change="cambiar({ tunel: ($event.target as HTMLInputElement).checked ? { cuerpo: Math.floor(rackSel.cuerpos / 2), altoLibre: 2.5 } : null })">
                      </label>
                      <div v-if="rackSel.tunel" class="mt-2 grid grid-cols-2 gap-2">
                        <label class="block text-xs font-medium text-neutral-700">¿Qué cuerpo?
                          <select :value="rackSel.tunel.cuerpo" class="plan-input mt-1 !h-9" @change="cambiar({ tunel: { ...rackSel.tunel, cuerpo: Number(($event.target as HTMLSelectElement).value) } })">
                            <option v-for="i in rackSel.cuerpos" :key="i" :value="i - 1">Cuerpo {{ i }}</option>
                          </select>
                        </label>
                        <label class="block text-xs font-medium text-neutral-700">Paso libre (m)
                          <select :value="rackSel.tunel.altoLibre" class="plan-input mt-1 !h-9" @change="cambiar({ tunel: { ...rackSel.tunel, altoLibre: Number(($event.target as HTMLSelectElement).value) } })">
                            <option :value="2.2">2,2 · personas</option>
                            <option :value="2.5">2,5 · personas y carro</option>
                            <option :value="3.5">3,5 · grúa</option>
                            <option :value="4.5">4,5 · grúa con carga</option>
                          </select>
                        </label>
                        <p v-if="medSel.tunel" class="col-span-2 text-xs text-neutral-600">
                          Quita {{ medSel.tunel.quitadas }} altura{{ medSel.tunel.quitadas > 1 ? 's' : '' }} de ese cuerpo ({{ medSel.tunel.quitadas * medSel.palletsPorViga * (rackSel.doble ? 2 : 1) }} posiciones).
                          Paso real bajo la viga: <b>{{ medSel.tunel.libreReal != null ? `${formatoM(medSel.tunel.libreReal)} m` : 'todo el alto' }}</b>.
                        </p>
                      </div>
                    </div>
                  </template>

                  <div v-for="(def, campo) in TIPOS[rackSel.tipo].campos" :key="campo" class="flex items-center justify-between gap-3">
                    <span class="flex items-center text-sm font-medium text-neutral-700">
                      {{ def[0] }}
                      <PlanificadorAyuda :titulo="def[0]">{{ ayudaCampo(rackSel.tipo, String(campo)) }}</PlanificadorAyuda>
                    </span>
                    <div class="flex items-center gap-2">
                      <button type="button" class="plan-step" :aria-label="`${def[0]}: quitar uno`" :disabled="valor(campo) <= def[1]" @click="cambiar({ [campo]: valor(campo) - 1 })">−</button>
                      <span class="w-8 text-center text-lg font-bold tabular-nums" aria-live="polite">{{ valor(campo) }}</span>
                      <button type="button" class="plan-step" :aria-label="`${def[0]}: agregar uno`" :disabled="valor(campo) >= def[2]" @click="cambiar({ [campo]: valor(campo) + 1 })">+</button>
                    </div>
                  </div>

                  <PlanificadorGruaDriveIn v-if="rackSel.tipo === 'DI'" :rack="rackSel" :abierto="true" @cambio="cambiar" />

                  <p class="text-xs text-neutral-500">
                    {{ formatoM(rectSel.ancho) }} × {{ formatoM(rectSel.alto) }} m en planta · {{ formatoM(altoRack(rackSel)) }} m de alto
                    <span v-if="altos.has(rackSel.id)" class="font-semibold text-amber-700">· más alto que la bodega</span>
                  </p>

                  <p v-if="semaforoSel" :class="['rounded-lg px-3 py-2 text-sm', SEMAFORO[semaforoSel.color]]" role="status">
                    Carga por nivel: {{ semaforoSel.carga.toLocaleString('es-CL') }} de {{ semaforoSel.capacidad.toLocaleString('es-CL') }} kg ({{ Math.round(semaforoSel.uso * 100) }} %)
                    <template v-if="semaforoSel.color === 'rojo'"> · requiere revisión de ingeniería</template>
                  </p>
                  <p v-else-if="rackSel.tipo !== 'AR'" class="text-xs text-neutral-500">Indica el peso por pallet en "Tu operación" para ver si las vigas lo resisten.</p>
                  <p v-if="avisos.levante.has(rackSel.id)" class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    El nivel más alto ({{ formatoM(alturaUltimoNivel(rackSel)) }} m) supera lo que alcanza tu equipo (~{{ formatoM(avisos.levanteMax) }} m).
                  </p>

                  <PlanificadorMezclaNiveles
                    v-if="rackSel.tipo === 'RS'" :rack="rackSel" :tipos="bodega.pallets"
                    @asignar="(mz) => cambiar({ mezcla: mz })" @todos="aplicarAlturaATodos"
                  />
                  <PlanificadorCorteRack :rack="rackSel" :altura="bodega.altura" />

                  <details class="rounded-xl bg-neutral-50 text-sm ring-1 ring-neutral-200">
                    <summary class="cursor-pointer px-3 py-2.5 font-semibold text-neutral-800">¿Este sistema te conviene?</summary>
                    <dl class="space-y-2 px-3 pb-3 text-neutral-600">
                      <div v-for="(etq, k) in ASESORIA_ETIQUETAS" :key="k">
                        <dt class="font-medium text-neutral-800">{{ etq }}</dt>
                        <dd>{{ TIPOS[rackSel.tipo].asesoria[k] }}</dd>
                      </div>
                    </dl>
                  </details>

                  <div class="grid grid-cols-2 gap-2">
                    <button type="button" class="plan-accion" @click="girar(rackSel.id)">Girar</button>
                    <button type="button" class="plan-accion" @click="duplicar(rackSel.id)">Duplicar</button>
                    <button type="button" class="plan-accion" :title="`Copia separada por un pasillo de ${formatoM(rackSel.tipo === 'AR' ? 1.2 : avisos.pasilloMin)} m`" @click="filaParalelaSel">Fila paralela</button>
                    <button type="button" class="plan-accion text-red-700 hover:bg-red-50" @click="eliminar(rackSel.id)">Eliminar</button>
                  </div>
                  <p v-if="avisoFila" class="text-xs text-amber-800" role="status">{{ avisoFila }}</p>
                </div>
              </template>
              <p v-else class="mt-3 text-sm text-neutral-600">
                {{ racks.length ? 'Toca un rack en el plano o en 3D para ajustarlo o moverlo.' : 'Agrega tu primer rack para empezar.' }}
              </p>
            </div>

            <PlanificadorAsesoria
              @agregar="agregar"
              @whatsapp="marcar('planner_whatsapp', {})"
              @guia="(g) => marcar('planner_guide', { guia: g })"
            />
          </aside>

          <!-- Plano / 3D -->
          <div class="min-w-0 lg:order-2">
            <div class="card overflow-hidden">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
                <div role="tablist" aria-label="Vista" class="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
                  <button
                    v-for="v in (['2d', '3d'] as const)" :key="v"
                    type="button" role="tab" :aria-selected="vista === v"
                    :class="['h-9 rounded-lg px-5 text-sm font-semibold transition', vista === v ? 'bg-white text-brand-800 shadow-sm' : 'text-neutral-600 hover:text-neutral-900']"
                    :disabled="dibujando && v === '3d'"
                    @click="vista = v"
                  >{{ v === '2d' ? 'Plano 2D' : 'Vista 3D' }}</button>
                </div>
                <p class="text-sm text-neutral-600">
                  <span class="font-semibold text-neutral-900">{{ racks.length }}</span> rack{{ racks.length === 1 ? '' : 's' }}
                  <template v-if="total.pallets"> · <span class="font-semibold text-neutral-900">{{ total.pallets }}</span> posiciones de pallet</template>
                  <template v-if="total.bandejas"> · <span class="font-semibold text-neutral-900">{{ total.bandejas }}</span> bandejas</template>
                </p>
              </div>
              <dl v-if="racks.length" class="flex flex-wrap gap-x-5 gap-y-1 border-b border-neutral-100 px-4 py-2 text-xs text-neutral-600">
                <div class="flex gap-1"><dt>Piso ocupado:</dt><dd class="font-semibold text-neutral-900">{{ porcentaje(ind.ocupacion) }}</dd></div>
                <div v-if="total.pallets" class="flex gap-1"><dt>Posiciones por m²:</dt><dd class="font-semibold text-neutral-900">{{ ind.posicionesM2.toLocaleString('es-CL', { maximumFractionDigits: 2 }) }}</dd></div>
                <div v-if="recorrido !== null" class="flex gap-1"><dt>Recorrido promedio desde el portón:</dt><dd class="font-semibold text-neutral-900">{{ formatoM(recorrido) }} m</dd></div>
                <div class="flex gap-1">
                  <dt>Uso de la altura:</dt>
                  <dd class="font-semibold text-neutral-900">{{ ind.usoAltura === null ? 'indica la altura libre' : porcentaje(ind.usoAltura) }}</dd>
                </div>
              </dl>

              <!-- KPI por sistema: lo que ya tiene + lo nuevo = total -->
              <div v-if="racks.length" class="overflow-x-auto border-b border-neutral-100 px-4 py-3">
                <table class="w-full min-w-[520px] text-xs">
                  <thead>
                    <tr class="text-left text-neutral-500">
                      <th class="pb-1.5 font-medium">Sistema</th>
                      <th class="pb-1.5 font-medium">Indicador</th>
                      <th class="pb-1.5 text-right font-medium">Ya tienes</th>
                      <th class="pb-1.5 text-right font-medium">Nuevo</th>
                      <th class="pb-1.5 text-right font-semibold text-neutral-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="(s, k) in kpi.porSistema" :key="k">
                      <tr v-for="(f, i) in filasKpi(String(k), s)" :key="f.t" :class="i === 0 ? 'border-t border-neutral-200' : ''">
                        <td class="py-1 font-semibold text-neutral-900">{{ i === 0 ? s.nombre : '' }}</td>
                        <td class="py-1 text-neutral-600">{{ f.t }}</td>
                        <td class="py-1 text-right tabular-nums text-neutral-500">{{ f.e }}</td>
                        <td class="py-1 text-right tabular-nums text-brand-800">{{ f.n }}</td>
                        <td class="py-1 text-right font-semibold tabular-nums text-neutral-900">{{ f.tt }}</td>
                      </tr>
                    </template>
                    <tr v-if="Object.keys(kpi.porSistema).length > 1" class="border-t-2 border-neutral-300 font-semibold text-neutral-900">
                      <td class="py-1.5">Global</td><td class="py-1.5">Posiciones de pallet</td>
                      <td class="py-1.5 text-right tabular-nums">{{ n(kpi.global.existente.posiciones) }}</td>
                      <td class="py-1.5 text-right tabular-nums text-brand-800">{{ n(kpi.global.nuevo.posiciones) }}</td>
                      <td class="py-1.5 text-right tabular-nums">{{ n(kpi.global.total.posiciones) }}</td>
                    </tr>
                  </tbody>
                </table>
                <p class="mt-1.5 text-[11px] text-neutral-500">Marca cada rack como "Ya lo tengo" o "Nuevo" en "Ajusta el rack". Solo lo nuevo va a la cotización.</p>
              </div>

              <!-- Herramientas del plano -->
              <div v-show="vista === '2d'" class="flex flex-wrap gap-1.5 border-b border-neutral-100 bg-neutral-50 px-3 py-2" role="toolbar" aria-label="Herramientas del plano">
                <div class="plan-barra">
                  <button type="button" :class="['plan-herr', herramienta === 'mover' && 'plan-herr--on']" :aria-pressed="herramienta === 'mover'" title="Mover racks y esquinas" @click="herramienta = 'mover'">Mover</button>
                  <button type="button" :class="['plan-herr', herramienta === 'medir' && 'plan-herr--on']" :aria-pressed="herramienta === 'medir'" title="Cinta de medir: clic en dos puntos" :disabled="dibujando" @click="herramienta = 'medir'">Medir</button>
                </div>
                <div class="plan-barra">
                  <button type="button" class="plan-herr" aria-label="Alejar" @click="planoRef?.acercar(1 / 1.3)">−</button>
                  <button type="button" class="plan-herr" aria-label="Acercar" @click="planoRef?.acercar(1.3)">+</button>
                  <button type="button" class="plan-herr" title="Ver toda la bodega" @click="planoRef?.restablecerVista()">Ajustar</button>
                </div>
                <div class="plan-barra">
                  <button type="button" class="plan-herr" aria-label="Deshacer (Ctrl+Z)" title="Deshacer (Ctrl+Z)" :disabled="!puedeDeshacer" @click="deshacer">↶</button>
                  <button type="button" class="plan-herr" aria-label="Rehacer (Ctrl+Y)" title="Rehacer (Ctrl+Y)" :disabled="!puedeRehacer" @click="rehacer">↷</button>
                </div>
                <label class="plan-barra px-2 text-xs font-medium text-neutral-600">
                  Cuadrícula
                  <select v-model.number="grilla" class="ml-1 h-8 rounded-md bg-transparent text-xs font-semibold text-neutral-900 focus:outline-none">
                    <option :value="0.5">0,5 m</option>
                    <option :value="1">1 m</option>
                    <option :value="5">5 m</option>
                  </select>
                </label>
              </div>
              <div :class="['relative h-[60vh] min-h-[360px] bg-neutral-50 transition sm:h-[65vh]', resaltar(2)]">
                <p v-if="herramienta === 'medir' && vista === '2d'" class="absolute bottom-3 left-3 z-10 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white">
                  Clic en dos puntos para medir · Esc para salir
                </p>
                <ClientOnly>
                  <PlanificadorPerfil v-if="mostrarPerfil" @elegir="elegirPerfil" />
                  <div v-else-if="pasoRecorrido !== null" class="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center lg:absolute lg:bottom-4 lg:z-20">
                    <PlanificadorRecorrido :paso="pasoRecorrido" @paso="pasoRecorrido = $event" @cerrar="cerrarRecorrido" />
                  </div>
                </ClientOnly>
                <PlanificadorPlano2D
                  v-show="vista === '2d'"
                  ref="planoRef"
                  :bodega="bodega"
                  :racks="racks"
                  :seleccion="seleccion"
                  :conflictos="malos"
                  :dibujando="dibujando"
                  :puntos-dibujo="puntosDibujo"
                  :editar-contorno="formaLibre && !dibujando"
                  :altos="altos"
                  :cotas-todas="exportando"
                  :grilla="grilla"
                  :herramienta="herramienta"
                  :muro-sel="muroSel"
                  :calco="calco"
                  :calibrando="calibrando"
                  :puntos-calibracion="puntosCalibracion"
                  class="p-3"
                  :elemento-sel="elementoSel"
                  :pasillo-min="avisos.pasilloMin"
                  @seleccionar-elemento="seleccionarElemento"
                  @mover-elemento="(id, x, y) => cambiarElemento({ x, y }, id)"
                  @eliminar-elemento="eliminarElemento"
                  @punto-calibracion="(q) => puntosCalibracion.length < 2 && puntosCalibracion.push(q)"
                  @seleccionar-muro="seleccionarMuro"
                  @seleccionar="seleccion = $event; if ($event) elementoSel = null"
                  @mover="mover"
                  @girar="girar"
                  @eliminar="eliminar"
                  @agregar-punto="puntosDibujo.push($event)"
                  @cerrar-contorno="cerrarContorno"
                  @mover-vertice="moverVertice"
                />
                <ClientOnly v-if="vista === '3d'">
                  <Visor3D
                    ref="visorRef"
                    :bodega="bodega" :racks="racks" etiqueta="Vista 3D de la bodega con los racks dibujados"
                    @seleccionar="seleccion = $event; if ($event) elementoSel = null" @mover="mover"
                  />
                </ClientOnly>
              </div>

              <div v-if="malos.size" class="border-t border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-800" role="status">
                Hay racks superpuestos, sobre un pilar o una zona, o fuera de la bodega (en rojo). Muévelos para separarlos.
              </div>
              <div v-if="altos.size" class="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-900" role="status">
                {{ altos.size === 1 ? 'Un rack queda' : `${altos.size} racks quedan` }} sin los {{ formatoM(DISTANCIAS.holguraTecho.valor) }} m libres bajo el techo ({{ formatoM(bodega.altura || 0) }} m), marcados con borde ámbar. Quítales niveles o revisa la altura.
              </div>
              <div v-if="avisos.pasillos.length" class="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-900" role="status">
                {{ avisos.pasillos.length === 1 ? 'Hay un pasillo más angosto' : `Hay ${avisos.pasillos.length} pasillos más angostos` }} que los ~{{ formatoM(avisos.pasilloMin) }} m que necesita tu {{ gruaActual.nombre.toLowerCase() }}
                ({{ avisos.pasillos.map((p) => `${numeroRack(p.a)}–${numeroRack(p.b)}: ${formatoM(p.ancho)} m`).join(', ') }}). Usa "Fila paralela" para separarlos al pasillo justo.
              </div>
              <div v-if="avisos.levante.size" class="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-900" role="status">
                {{ avisos.levante.size === 1 ? 'Un rack tiene' : `${avisos.levante.size} racks tienen` }} el nivel más alto sobre lo que alcanza tu equipo (~{{ formatoM(avisos.levanteMax) }} m).
              </div>
              <p v-if="!malos.size && !altos.size && !avisos.pasillos.length && !avisos.levante.size && vista === '2d' && racks.length" class="border-t border-neutral-100 px-4 py-2.5 text-xs text-neutral-500">
                Arrastra los racks para moverlos. Con teclado: flechas para mover, R para girar y Suprimir para eliminar.
              </p>
            </div>

            <!-- Evaluacion del proyecto y escenarios -->
            <ClientOnly>
              <div class="mt-5 space-y-5">
                <PlanificadorEvaluacion
                  ref="evaluacionRef"
                  :bodega="bodega" :posiciones="total.pallets" :abierto="perfil === 'supply'" :pasillo="avisos.pasilloMin" :grua="gruaActual.nombre"
                  @resumen="resumenEvaluacion = $event"
                  @abrir="marcar('planner_evaluation_open', {})"
                />
                <div class="card p-5">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-600">Escenarios</h2>
                      <p class="mt-1 text-sm text-neutral-600">Guarda versiones de tu diseño (un nivel más, otro sistema…) y compáralas.</p>
                    </div>
                    <form class="flex gap-2" @submit.prevent="guardarEscenario">
                      <label class="sr-only" for="plan-escenario">Nombre del escenario</label>
                      <input id="plan-escenario" v-model="nombreEscenario" type="text" maxlength="40" :placeholder="`Escenario ${escenarios.length + 1}`" class="plan-input !h-10 w-44">
                      <button type="submit" class="plan-accion h-10 px-3" :disabled="!racks.length || escenarios.length >= 8">Guardar</button>
                    </form>
                  </div>
                  <ul v-if="escenarios.length" class="mt-3 divide-y divide-neutral-100 rounded-xl ring-1 ring-neutral-200">
                    <li v-for="(esc, i) in escenarios" :key="esc.fecha" class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span class="min-w-0">
                        <span class="font-semibold text-neutral-900">{{ esc.nombre }}</span>
                        <span class="text-neutral-600"> · {{ esc.racks }} racks · {{ esc.pallets }} posiciones<template v-if="esc.bandejas"> · {{ esc.bandejas }} bandejas</template></span>
                        <span v-if="esc.pallets !== total.pallets" :class="['ml-1 font-semibold', esc.pallets > total.pallets ? 'text-green-700' : 'text-red-700']">({{ esc.pallets > total.pallets ? '+' : '' }}{{ esc.pallets - total.pallets }} vs. el actual)</span>
                      </span>
                      <span class="flex gap-2">
                        <button type="button" class="text-xs font-semibold text-brand-700 hover:underline" @click="cargarEscenario(i)">Cargar</button>
                        <button type="button" class="text-xs font-semibold text-neutral-500 hover:text-red-700" @click="borrarEscenario(i)">Borrar</button>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </ClientOnly>

            <!-- Cotizar -->
            <div :class="['mt-5 flex flex-col gap-4 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100 transition lg:flex-row lg:items-center lg:justify-between', resaltar(3)]">
              <div>
                <p class="font-semibold text-neutral-900">¿Listo tu diseño?</p>
                <p class="text-sm text-neutral-600">{{ textoEntregable }} Un ejecutivo lo revisa sin costo.</p>
                <p v-if="pdfListo" class="mt-1 text-sm font-medium text-green-700" role="status">Tu plano se descargó. También te llegará la confirmación por correo.</p>
              </div>
              <div class="flex flex-shrink-0 flex-wrap gap-3">
                <button v-if="racks.length" type="button" class="btn h-12 px-4 text-sm text-neutral-600 hover:text-neutral-900" @click="reiniciar">Empezar de nuevo</button>
                <button type="button" class="btn btn-secondary h-12 px-5" :disabled="!racks.length || preparando || dibujando" @click="pedir('pdf')">
                  {{ preparando && modo === 'pdf' ? 'Preparando…' : 'Descargar plano PDF' }}
                </button>
                <button type="button" class="btn btn-primary h-12 px-6" :disabled="!racks.length || preparando || dibujando" @click="pedir('cotizar')">
                  {{ preparando && modo === 'cotizar' ? 'Preparando…' : 'Cotizar · máximo 24 h' }}
                </button>
              </div>
            </div>
            <p class="mt-2 text-center text-xs text-neutral-500">Nuestro equipo comercial te envía la cotización en máximo 24 horas. Sin costo ni compromiso.</p>
          </div>
        </div>
      </div>
    </section>

    <CtaCotizacion24
      :visible="racks.length > 0 && !formularioAbierto"
      :titulo="`Tu cotización en máximo 24 horas · ${total.pallets ? `${total.pallets} posiciones` : `${racks.length} racks`}`"
      :deshabilitado="preparando || dibujando" @cotizar="pedir('cotizar')"
    />
    <ContactModal
      :is-visible="formularioAbierto"
:encabezado="modo === 'pdf' ? { etiqueta: 'Gratis', titulo: 'Descarga tu plano', texto: 'Déjanos tus datos y el PDF se descarga al enviar. Un ejecutivo revisa tu diseño sin costo.' } : { etiqueta: 'Respuesta en máximo 24 h', titulo: 'Recibe tu cotización en máximo 24 horas', texto: 'Nuestro equipo comercial revisa tu diseño y te envía la cotización en máximo 24 horas.' }"
      :quote-item="itemCotizacion"
      :initial-files="archivosPlano"
      require-project
      :config-extra="configAlEnviar"
      @sent="alEnviar"
      @close="formularioAbierto = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import {
  LIMITES, NOMBRE, TIPOS, PERFILES, dentroDeBodega, conflictos, lugarLibre, totales, resumenCotizacion, normalizar, contorno, area, caja,
  altoRack, indicadores, rectangulo, medidasRack, describir, formatoM, ELEMENTOS, grillaPilares, grillaPilaresXY, rectElemento,
} from '~/lib/rack3d/planificador.js';
import { capacidad } from '~/lib/rack3d/medidas.js';
import { kpisPorSistema, derivados } from '~/lib/rack3d/kpis.js';
import { ubicados, resolverMezcla, acomodar } from '~/lib/rack3d/mezcla.js';
import { GRUAS, DISTANCIAS, esProvisorio } from '~/lib/rack3d/parametrosTecnicos.js';
import {
  gruaDe, avisosOperacion, semaforoCarga, racksSinHolgura, filaParalela, llenarBodega, recorridoPromedio, puntajeLead, materiales, alturaUltimoNivel,
} from '~/lib/rack3d/operacion.js';
import type { RackPlano, Punto, Elemento } from '~/components/planificador/Plano2D.vue';
import type { QuoteItem } from '~/components/QuoteModal/ProductConfig';

usePageSeo({
  title: 'Planificador de bodega 3D',
  description: 'Dibuja tu bodega, agrega rack selectivo, drive-in o ángulo ranurado, míralos en 3D y pide tu cotización a Racklog. Gratis y sin registro.',
});

const GUARDADO = 'racklog-planificador-v1';
const GUARDADO_PERFIL = 'racklog-planificador-perfil';
const GUARDADO_RECORRIDO = 'racklog-planificador-recorrido';
const route = useRoute();
const router = useRouter();

const bodega = reactive<{
  ancho: number; largo: number; forma: Punto[] | null; altura: number | null; elementos: Elemento[];
  grua: keyof typeof GRUAS; pesoPallet: number | null; pesoBandeja: number | null; pallets: any[];
}>({ ancho: 20, largo: 30, forma: null, altura: null, elementos: [], grua: 'contrapeso', pesoPallet: null, pesoBandeja: null, pallets: [] });
const alturaEntrada = ref<number | null>(null);
const bodegaEntrada = reactive({ ancho: bodega.ancho, largo: bodega.largo });
const formaLibre = computed(() => !!bodega.forma || dibujando.value);
const dibujando = ref(false);
const puntosDibujo = ref<Punto[]>([]);
const racks = ref<RackPlano[]>([]);
const seleccion = ref<string | null>(null);
const vista = ref<'2d' | '3d'>('2d');
const planoRef = ref<{ $el: SVGSVGElement; restablecerVista: () => void; acercar: (f: number) => void } | null>(null);
const visorRef = ref<{ captura: () => string | null } | null>(null);

// Caja del contorno dibujado: es lo que se informa en la cotizacion
const medidasContorno = computed(() => {
  const c = caja(contorno(bodega));
  return { ancho: +(c.x1 - c.x0).toFixed(1), largo: +(c.y1 - c.y0).toFixed(1) };
});
const malos = computed(() => conflictos(racks.value, bodega) as Set<string>);
const total = computed(() => totales(racks.value));
const indiceSel = computed(() => racks.value.findIndex((r) => r.id === seleccion.value));
const rackSel = computed(() => racks.value[indiceSel.value] ?? null);
const rectSel = computed(() => (rackSel.value ? rectangulo(rackSel.value) : { ancho: 0, alto: 0 }));
// Sin la holgura al techo (incluye los que derechamente no caben)
const altos = computed(() => racksSinHolgura(racks.value, bodega.altura) as Set<string>);
const gruaActual = computed(() => gruaDe(bodega));
const avisos = computed(() => avisosOperacion(racks.value, bodega) as { pasillos: { a: string; b: string; ancho: number }[]; levante: Set<string>; pasilloMin: number; levanteMax: number });
const recorrido = computed(() => recorridoPromedio(racks.value, bodega) as number | null);
const SEMAFORO = { verde: 'bg-green-50 text-green-900', amarillo: 'bg-amber-50 text-amber-900', rojo: 'bg-red-50 text-red-900' } as const;
const semaforoSel = computed(() => (rackSel.value ? semaforoCarga(rackSel.value, bodega.pesoPallet, bodega.pesoBandeja) as { uso: number; carga: number; capacidad: number; color: keyof typeof SEMAFORO } | null : null));
const numeroRack = (id: string) => racks.value.findIndex((r) => r.id === id) + 1;
const avisoFila = ref('');

function filaParalelaSel() {
  const r = rackSel.value;
  if (!r) return;
  const n = filaParalela(r, racks.value, bodega, nuevoId()) as RackPlano | null;
  avisoFila.value = n ? '' : 'No cabe otra fila al pasillo justo: mueve el rack o achica la fila.';
  if (!n) return;
  racks.value.push(n);
  seleccion.value = n.id;
  marcar('planner_parallel_row', { rack_type: r.tipo });
}

function llenar(tipo: 'RS' | 'DI') {
  if (racks.value.length && !confirm('Esto reemplaza los racks que tienes por filas automáticas. ¿Seguir?')) return;
  racks.value = llenarBodega(bodega, tipo, nuevoId) as RackPlano[];
  seleccion.value = null;
  vista.value = '2d';
  marcar('planner_autofill', { rack_type: tipo, racks: racks.value.length, posiciones: total.value.pallets });
}

// Al enviar: puntaje del lead (con la fecha y el telefono del formulario) y materiales para el vendedor
function configAlEnviar({ plazo, telefono }: { plazo: string; telefono: string }) {
  const lista = materiales(racks.value);
  return {
    'Puntaje del lead': `${puntajeLead({ bodega, racks: racks.value, perfil: perfil.value, plazo, telefono })}/100`,
    ...(lista ? { 'Materiales (preliminar)': lista } : {}),
  };
}
const ind = computed(() => indicadores(bodega, racks.value));
const kpi = computed(() => kpisPorSistema(racks.value));
const n = (v: number) => Math.round(v).toLocaleString('es-CL');
const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);
const d2 = (v: number) => v.toLocaleString('es-CL', { maximumFractionDigits: 2 });
// Filas de KPI según el sistema (existente / nuevo / total)
function filasKpi(tipo: string, s: any) {
  const g = ['existente', 'nuevo', 'total'].map((k) => ({ ...s[k], ...derivados(s[k]) }));
  const fila = (t: string, f: (x: any) => string) => ({ t, e: f(g[0]), n: f(g[1]), tt: f(g[2]) });
  if (tipo === 'AR') return [
    fila('Bandejas', (x) => n(x.bandejas)),
    fila('Cuerpos', (x) => n(x.cuerpos)),
    fila('Carga total (kg)', (x) => n(x.kg)),
  ];
  if (tipo === 'DI') return [
    fila('Posiciones de pallet', (x) => n(x.posiciones)),
    fila('Calles', (x) => n(x.calles)),
    fila('Pallets por calle', (x) => (x.palletsPorCalle ? d2(x.palletsPorCalle) : '—')),
    fila('Acceso directo', (x) => pct(x.selectividad)),
    fila('Posiciones por m² de rack', (x) => d2(x.posicionesM2Piso)),
  ];
  return [
    fila('Posiciones de pallet', (x) => n(x.posiciones)),
    fila('Cuerpos', (x) => n(x.cuerpos)),
    fila('Acceso directo', (x) => pct(x.selectividad)),
    fila('Posiciones por m² de rack', (x) => d2(x.posicionesM2Piso)),
  ];
}
const porcentaje = (v: number) => `${Math.round(v * 100)} %`;

// Altura libre (m): con ella se avisa si un rack no cabe y se calcula el uso de la altura
function aplicarAltura() {
  const v = Number(alturaEntrada.value);
  bodega.altura = Number.isFinite(v) && v >= 2 ? Math.min(40, Math.round(v * 10) / 10) : null;
  alturaEntrada.value = bodega.altura;
  if (bodega.altura) marcar('planner_height', { altura: bodega.altura });
}

// ─── Herramientas del plano: cuadricula, cinta de medir, muros con medida exacta ───
const grilla = ref(1);
const herramienta = ref<'mover' | 'medir'>('mover');
const muroSel = ref<number | null>(null);
const largoMuro = ref<number | null>(null);
const inputMuro = ref<HTMLInputElement | null>(null);
const muroTeclado = reactive<{ largo: number | null; angulo: number | null }>({ largo: null, angulo: 0 });

function seleccionarMuro(i: number | null) {
  muroSel.value = i;
  if (i === null) return;
  const poly = contorno(bodega), a = poly[i], b = poly[(i + 1) % poly.length];
  largoMuro.value = +Math.hypot(b.x - a.x, b.y - a.y).toFixed(2);
  nextTick(() => inputMuro.value?.select());
}

// Cambia el largo del muro moviendo su esquina final en la misma direccion
function aplicarMuro() {
  const i = muroSel.value, L = Number(largoMuro.value);
  if (i === null || !(L >= 1)) return;
  if (!bodega.forma) {
    if (i % 2 === 0) bodegaEntrada.ancho = L; else bodegaEntrada.largo = L;
    aplicarBodega();
  } else {
    // Se estira como en un CAD: la esquina final y la siguiente se mueven juntas, asi el muro vecino
    // queda paralelo y con su largo (cambia el que viene despues)
    const poly = bodega.forma.map((p) => ({ ...p })), n = poly.length, j = (i + 1) % n;
    const a = poly[i], b = poly[j], l0 = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const dx = ((b.x - a.x) * (L - l0)) / l0, dy = ((b.y - a.y) * (L - l0)) / l0;
    const mover = n >= 4 ? [j, (j + 1) % n] : [j];
    mover.forEach((m) => { poly[m] = { x: +(poly[m].x + dx).toFixed(2), y: +(poly[m].y + dy).toFixed(2) }; });
    fijarForma(poly);
  }
  marcar('planner_wall_edit', { largo: L });
}

// Contorno en coordenadas positivas y lienzo que lo contiene
function fijarForma(poly: Punto[]) {
  const c = caja(poly);
  const pts = poly.map((p) => ({ x: +(p.x - Math.min(0, c.x0)).toFixed(2), y: +(p.y - Math.min(0, c.y0)).toFixed(2) }));
  const c2 = caja(pts);
  bodega.ancho = bodegaEntrada.ancho = Math.min(LIMITES.bodega.max, Math.max(bodega.ancho, Math.ceil(c2.x1)));
  bodega.largo = bodegaEntrada.largo = Math.min(LIMITES.bodega.max, Math.max(bodega.largo, Math.ceil(c2.y1)));
  bodega.forma = pts;
  racks.value = racks.value.map((r) => dentroDeBodega(r, bodega) as RackPlano);
}

function agregarMuroTeclado() {
  const L = Number(muroTeclado.largo), ang = Number(muroTeclado.angulo) || 0;
  if (!(L > 0)) return;
  if (!puntosDibujo.value.length) puntosDibujo.value.push({ x: 0, y: 0 });
  const u = puntosDibujo.value[puntosDibujo.value.length - 1], rad = (ang * Math.PI) / 180;
  puntosDibujo.value.push({ x: +(u.x + L * Math.cos(rad)).toFixed(2), y: +(u.y - L * Math.sin(rad)).toFixed(2) });
  // Siguiente muro: girando 90° a la derecha, lo mas comun en una bodega
  muroTeclado.largo = null;
  muroTeclado.angulo = ((ang - 90) % 360 + 360) % 360;
}

// ─── Pilares, portones, andenes, oficinas y zonas bloqueadas ───
const elementoSel = ref<string | null>(null);
const elementoActual = computed(() => bodega.elementos.find((e) => e.id === elementoSel.value) ?? null);

function seleccionarElemento(id: string | null) {
  elementoSel.value = id;
  if (id) seleccion.value = null;
}

function agregarElemento(clase: Elemento['clase']) {
  const def = ELEMENTOS[clase], c = caja(contorno(bodega)), n = bodega.elementos.length;
  // Porton y anden junto al muro de abajo; lo demas cerca del centro, sin apilarse
  const junto = clase === 'porton' || clase === 'anden';
  const x = +((c.x0 + c.x1) / 2 + (n % 4) * 1.5).toFixed(1);
  const y = junto ? +(c.y1 - def.alto / 2).toFixed(2) : +((c.y0 + c.y1) / 2 + (n % 3) * 1.5).toFixed(1);
  const el: Elemento = { id: nuevoId(), clase, x, y, ancho: def.ancho, alto: def.alto, ...(clase === 'grua' ? { modelo: bodega.grua } : {}) };
  bodega.elementos = [...bodega.elementos, el];
  seleccionarElemento(el.id);
  vista.value = '2d';
  marcar('planner_add_element', { clase });
}

function cambiarElemento(cambio: Partial<Elemento>, id = elementoSel.value) {
  bodega.elementos = bodega.elementos.map((e) => {
    if (e.id !== id) return e;
    const n = { ...e, ...cambio };
    n.ancho = Math.min(60, Math.max(0.1, +Number(n.ancho).toFixed(2) || e.ancho));
    n.alto = Math.min(60, Math.max(0.1, +Number(n.alto).toFixed(2) || e.alto));
    return n;
  });
}

function eliminarElemento(id: string) {
  bodega.elementos = bodega.elementos.filter((e) => e.id !== id);
  if (elementoSel.value === id) elementoSel.value = null;
}

const GRUPOS_ELEMENTOS = [
  { t: 'Estructura y accesos', clases: ['pilar', 'porton', 'anden'] },
  { t: 'Áreas', clases: ['oficina', 'zona'] },
  { t: 'Circulación y equipos', clases: ['pasilloGrua', 'pasilloPeatonal', 'grua'] },
] as const;
const gp = reactive({ pasoX: 6, pasoY: 6, offX: 6, offY: 6, ancho: 40, fondo: 40 });
const vistaPreviaGrilla = computed(() => (gp.pasoX >= 2 && gp.pasoY >= 2 ? grillaPilaresXY(bodega, gp).length : 0));

function ponerGrillaPilares() {
  if (!(gp.pasoX >= 2 && gp.pasoY >= 2)) return;
  const nuevos = grillaPilaresXY(bodega, gp).map((q: Punto) => ({ id: nuevoId(), clase: 'pilar' as const, x: q.x, y: q.y, ancho: gp.ancho / 100, alto: gp.fondo / 100 }));
  bodega.elementos = [...bodega.elementos.filter((e) => e.clase !== 'pilar'), ...nuevos];
  marcar('planner_pillar_grid', { paso_x: gp.pasoX, paso_y: gp.pasoY, pilares: nuevos.length });
}

// Posición del elemento seleccionado medida desde los muros (borde del elemento al muro)
const posElemento = computed(() => {
  const e = elementoActual.value;
  if (!e) return { izq: 0, arriba: 0 };
  const c = caja(contorno(bodega)), p = rectElemento(e);
  return { izq: p.x0 - c.x0, arriba: p.y0 - c.y0 };
});
function moverElementoA(eje: 'x' | 'y', v: number) {
  const e = elementoActual.value;
  if (!e || !Number.isFinite(v)) return;
  const c = caja(contorno(bodega));
  if (eje === 'x') cambiarElemento({ x: +(c.x0 + v + e.ancho / 2).toFixed(3) });
  else cambiarElemento({ y: +(c.y0 + v + e.alto / 2).toFixed(3) });
}
function cambiarModeloGrua(modelo: string) {
  // La huella cambia con el equipo: transpaleta chica, retráctil más larga
  const huellas: Record<string, [number, number]> = { transpaleta: [0.7, 1.9], apiladora: [0.9, 2.0], contrapeso: [1.2, 2.8], retractil: [1.3, 2.5] };
  const [a, l] = huellas[modelo] ?? [1.2, 2.8];
  const e = elementoActual.value!;
  const acostada = e.ancho > e.alto;
  cambiarElemento({ modelo, ancho: acostada ? l : a, alto: acostada ? a : l });
}

// ─── Calcar un plano o foto: se sube, se calibra con una medida conocida y se dibuja encima ───
const calco = ref<{ url: string; w: number; h: number; escala: number; opacidad: number; calibrado: boolean; archivo: File } | null>(null);
const calibrando = ref(false);
const puntosCalibracion = ref<Punto[]>([]);
const medidaCalibracion = ref<number | null>(null);
const inputCalco = ref<HTMLInputElement | null>(null);

async function subirCalco(e: Event) {
  const archivo = (e.target as HTMLInputElement).files?.[0];
  (e.target as HTMLInputElement).value = '';
  if (!archivo || !archivo.type.startsWith('image/')) return;
  const url = await new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(r.result as string); r.readAsDataURL(archivo); });
  const img = new Image();
  await new Promise((ok) => { img.onload = ok; img.onerror = ok; img.src = url; });
  if (!img.naturalWidth) return;
  // Hasta calibrar, la imagen ocupa el ancho de la bodega
  calco.value = { url, w: img.naturalWidth, h: img.naturalHeight, escala: bodega.ancho / img.naturalWidth, opacidad: 0.6, calibrado: false, archivo };
  calibrando.value = true;
  puntosCalibracion.value = [];
  medidaCalibracion.value = null;
  vista.value = '2d';
  planoRef.value?.restablecerVista();
  marcar('planner_trace_upload', { mb: +(archivo.size / 1048576).toFixed(1) });
}

function calibrarCalco() {
  const c = calco.value, [a, b] = puntosCalibracion.value, D = Number(medidaCalibracion.value);
  if (!c || !a || !b || !(D > 0)) return;
  const d0 = Math.hypot(b.x - a.x, b.y - a.y);
  if (d0 < 0.01) return;
  c.escala *= D / d0;
  c.calibrado = true;
  calibrando.value = false;
  puntosCalibracion.value = [];
  // Lienzo del tamano del plano calibrado y a dibujar el contorno encima
  bodega.ancho = bodegaEntrada.ancho = Math.min(LIMITES.bodega.max, Math.max(LIMITES.bodega.min, Math.ceil(c.w * c.escala)));
  bodega.largo = bodegaEntrada.largo = Math.min(LIMITES.bodega.max, Math.max(LIMITES.bodega.min, Math.ceil(c.h * c.escala)));
  planoRef.value?.restablecerVista();
  if (formaLibre.value) empezarDibujo(); else cambiarForma(true);
  marcar('planner_trace_calibrated', { ancho: bodega.ancho, largo: bodega.largo });
}

function quitarCalco() {
  calco.value = null;
  calibrando.value = false;
  puntosCalibracion.value = [];
}

// ─── Deshacer / rehacer (Ctrl+Z / Ctrl+Y) ───
const historial: string[] = [];
let posHistorial = -1;
let restaurando = false;
const versionHistorial = ref(0);
const estado = () => JSON.stringify({ bodega: { ...bodega }, racks: racks.value });
let temporizador: ReturnType<typeof setTimeout> | null = null;
function registrar() {
  if (restaurando) return;
  if (temporizador) clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    const e = estado();
    if (historial[posHistorial] === e) return;
    historial.splice(posHistorial + 1);
    historial.push(e);
    if (historial.length > 60) historial.shift();
    posHistorial = historial.length - 1;
    versionHistorial.value++;
  }, 350);
}
function restaurar(i: number) {
  const g = JSON.parse(historial[i]);
  restaurando = true;
  Object.assign(bodega, g.bodega);
  bodegaEntrada.ancho = bodega.ancho;
  bodegaEntrada.largo = bodega.largo;
  alturaEntrada.value = bodega.altura;
  racks.value = g.racks;
  posHistorial = i;
  versionHistorial.value++;
  nextTick(() => { restaurando = false; });
}
const puedeDeshacer = computed(() => (versionHistorial.value, dibujando.value ? puntosDibujo.value.length > 0 : posHistorial > 0));
const puedeRehacer = computed(() => (versionHistorial.value, !dibujando.value && posHistorial < historial.length - 1));
function deshacer() {
  if (dibujando.value) { puntosDibujo.value.pop(); return; }
  if (posHistorial > 0) restaurar(posHistorial - 1);
}
function rehacer() {
  if (!dibujando.value && posHistorial < historial.length - 1) restaurar(posHistorial + 1);
}
watch([racks, () => ({ ...bodega })], registrar, { deep: true });

function atajos(e: KeyboardEvent) {
  const t = e.target as HTMLElement;
  if (t.closest('input, textarea, select, [contenteditable]') || formularioAbierto.value) return;
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); deshacer(); }
  else if (ctrl && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); rehacer(); }
  else if (e.key === 'Escape') { herramienta.value = 'mover'; muroSel.value = null; }
}
onMounted(() => window.addEventListener('keydown', atajos));
onBeforeUnmount(() => window.removeEventListener('keydown', atajos));

// ─── Evaluacion y escenarios ───
const evaluacionRef = ref<{ comparacion: { nombre: string; posiciones: number; detalle: string }[] } | null>(null);
const resumenEvaluacion = ref('');
const GUARDADO_ESCENARIOS = 'racklog-planificador-escenarios';
const escenarios = ref<{ nombre: string; fecha: number; racks: number; pallets: number; bandejas: number; estado: string }[]>([]);
const nombreEscenario = ref('');

function persistirEscenarios() {
  try { localStorage.setItem(GUARDADO_ESCENARIOS, JSON.stringify(escenarios.value)); } catch { /* sin almacenamiento */ }
}
function guardarEscenario() {
  if (!racks.value.length || escenarios.value.length >= 8) return;
  escenarios.value.push({
    nombre: nombreEscenario.value.trim() || `Escenario ${escenarios.value.length + 1}`,
    fecha: Date.now(),
    racks: racks.value.length,
    pallets: total.value.pallets,
    bandejas: total.value.bandejas,
    estado: estado(),
  });
  nombreEscenario.value = '';
  persistirEscenarios();
  marcar('planner_scenario_save', { escenarios: escenarios.value.length });
}
function cargarEscenario(i: number) {
  const g = JSON.parse(escenarios.value[i].estado);
  Object.assign(bodega, g.bodega);
  bodegaEntrada.ancho = bodega.ancho;
  bodegaEntrada.largo = bodega.largo;
  alturaEntrada.value = bodega.altura;
  racks.value = g.racks;
  seleccion.value = null;
  elementoSel.value = null;
}
function borrarEscenario(i: number) {
  escenarios.value.splice(i, 1);
  persistirEscenarios();
}

// ─── Perfil y recorrido inicial ───
const perfil = ref<string | null>(null);
const mostrarPerfil = ref(false);
const pasoRecorrido = ref<number | null>(null);
const textoEntregable = computed(() => PERFILES.find((p) => p.v === perfil.value)?.entregable ?? 'Descarga tu plano con medidas o pide tu cotización.');

function guardarLocal(clave: string, valor: string) {
  try { localStorage.setItem(clave, valor); } catch { /* sin almacenamiento */ }
}

function elegirPerfil(v: string | null) {
  perfil.value = v;
  mostrarPerfil.value = false;
  guardarLocal(GUARDADO_PERFIL, v ?? 'sin_perfil');
  marcar('planner_profile', { perfil: v ?? 'sin_perfil' });
  let visto = false;
  try { visto = !!localStorage.getItem(GUARDADO_RECORRIDO); } catch { /* */ }
  if (!visto) pasoRecorrido.value = 0;
}

function cerrarRecorrido() {
  marcar('planner_tour', { hasta_paso: (pasoRecorrido.value ?? 0) + 1 });
  pasoRecorrido.value = null;
  guardarLocal(GUARDADO_RECORRIDO, '1');
}

// Seccion que el recorrido esta explicando
const resaltar = (paso: number) => (pasoRecorrido.value === paso ? 'ring-2 ring-brand-500 ring-offset-2' : '');

const ASESORIA_ETIQUETAS = { sirve: 'Para qué sirve', conviene: 'Te conviene si…', noConviene: 'No te conviene si…', impacto: 'Impacto en tu bodega', datos: 'Qué necesitamos saber' };

function ayudaCampo(tipo: string, campo: string) {
  if (campo === 'cuerpos') return tipo === 'DI' ? 'Pasillos por donde entra la grúa a dejar los pallets.' : 'Cada cuerpo es un módulo entre dos marcos. Más cuerpos, rack más largo.';
  if (campo === 'fondos') return 'Cuántos pallets quedan uno detrás de otro en cada calle.';
  if (campo === 'niveles') {
    if (tipo === 'AR') return 'Bandejas por cuerpo, de abajo hacia arriba.';
    if (tipo === 'DI') return 'Niveles de pallets, contando el que va en el piso.';
    return 'Niveles con vigas. Además va un nivel de pallets en el piso: 3 niveles son 4 alturas de pallet.';
  }
  return '';
}

const nuevoId = () => Math.random().toString(36).slice(2, 9);

function aplicarBodega() {
  const lim = (v: number, actual: number) => (Number.isFinite(v) ? Math.min(LIMITES.bodega.max, Math.max(LIMITES.bodega.min, Math.round(v * 2) / 2)) : actual);
  bodega.ancho = lim(bodegaEntrada.ancho, bodega.ancho);
  bodega.largo = lim(bodegaEntrada.largo, bodega.largo);
  bodegaEntrada.ancho = bodega.ancho;
  bodegaEntrada.largo = bodega.largo;
  // En forma libre, ancho y largo son el lienzo: el contorno no puede quedar fuera
  if (bodega.forma) bodega.forma = bodega.forma.map((p) => ({ x: Math.min(p.x, bodega.ancho), y: Math.min(p.y, bodega.largo) }));
  racks.value = racks.value.map((r) => dentroDeBodega(r, bodega) as RackPlano);
}

// ─── Forma libre: se dibuja el contorno haciendo clic en cada esquina ───
function cambiarForma(libre: boolean) {
  if (libre === formaLibre.value) return;
  if (libre) {
    empezarDibujo();
  } else {
    dibujando.value = false;
    bodega.forma = null;
    racks.value = racks.value.map((r) => dentroDeBodega(r, bodega) as RackPlano);
  }
}

function empezarDibujo() {
  dibujando.value = true;
  puntosDibujo.value = [];
  seleccion.value = null;
  vista.value = '2d';
}

function cancelarDibujo() {
  dibujando.value = false;
  puntosDibujo.value = [];
}

function cerrarContorno() {
  // Sin puntos repetidos seguidos ni esquinas en linea recta
  const pts = puntosDibujo.value.filter((p, i, a) => i === 0 || p.x !== a[i - 1].x || p.y !== a[i - 1].y);
  if (pts.length > 1 && pts[0].x === pts[pts.length - 1].x && pts[0].y === pts[pts.length - 1].y) pts.pop();
  const limpios = pts.filter((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
    return Math.abs((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) > 1e-6;
  });
  if (limpios.length < 3 || area(limpios) < 1) return;
  fijarForma(limpios);
  dibujando.value = false;
  puntosDibujo.value = [];
  racks.value = racks.value.map((r) => dentroDeBodega(r, bodega) as RackPlano);
  marcar('planner_custom_shape', { esquinas: limpios.length });
}

function moverVertice(i: number, p: Punto) {
  if (!bodega.forma) return;
  const q = { x: Math.min(bodega.ancho, Math.max(0, p.x)), y: Math.min(bodega.largo, Math.max(0, p.y)) };
  bodega.forma = bodega.forma.map((v, k) => (k === i ? q : v));
}

function valor(campo: string) {
  return Number((rackSel.value as unknown as Record<string, number>)?.[campo] ?? 0);
}

function agregar(tipo: RackPlano['tipo']) {
  const rack = lugarLibre(normalizar({ id: nuevoId(), tipo, rot: 0, x: 0, y: 0 }), racks.value, bodega) as RackPlano;
  racks.value.push(rack);
  seleccion.value = rack.id;
  vista.value = '2d';
  marcar('planner_add_rack', { rack_type: tipo });
}

function actualizar(id: string, cambio: Partial<RackPlano>) {
  racks.value = racks.value.map((r) => (r.id === id ? dentroDeBodega(conMezcla(normalizar({ ...r, ...cambio })), bodega) as RackPlano : r));
}

// ─── Pallets mezclados por nivel (selectivo) ───
const ubic = computed(() => ubicados(racks.value, bodega.pallets));
const medSel = computed(() => (rackSel.value ? medidasRack(rackSel.value) as any : {}));
// Planos de carga para la cotización: uno por cuerpo y nivel (por fila)
const planosTotales = computed(() => {
  const c: Record<string, number> = {};
  racks.value.filter((r: any) => r.tipo === 'RS' && !r.existente).forEach((r: any) => {
    (medidasRack(r) as any).planos?.forEach((t: string | null) => { if (t) c[t] = (c[t] ?? 0) + r.cuerpos * (r.doble ? 2 : 1); });
  });
  const nombre: Record<string, string> = { malla: 'malla electrosoldada', madera: 'madera', metal: 'bandeja metálica' };
  return Object.entries(c).map(([t, n]) => `${n} de ${nombre[t]}`).join(', ');
});
function cambiarPlano(i: number, tipo: string | null) {
  const r = rackSel.value as any;
  if (!r) return;
  const planos = Array.from({ length: r.niveles + 1 }, (_, j) => (j === i ? tipo : r.planos?.[j] ?? null));
  cambiar({ planos } as any);
}
// Alto y color de cada altura salen del catálogo de tipos
function conMezcla(r: any) {
  if (r.tipo !== 'RS' || !r.mezcla) return r;
  return { ...r, ...resolverMezcla(r, bodega.pallets) };
}
function acomodarPallets() {
  racks.value = acomodar(racks.value, bodega.pallets, bodega.altura).map((r: any) => dentroDeBodega(normalizar(r), bodega) as RackPlano);
  marcar('planner_pallets_auto', { tipos: bodega.pallets.length });
}
function aplicarAlturaATodos(i: number, id: string | null) {
  racks.value = racks.value.map((r: any) => {
    if (r.tipo !== 'RS' || r.niveles < i) return r;
    const mezcla = Array.from({ length: r.niveles + 1 }, (_, j) => (j === i ? id : r.mezcla?.[j] ?? null));
    return dentroDeBodega(conMezcla({ ...r, mezcla }), bodega) as RackPlano;
  });
}
// Si cambia un tipo (alto, color) o se borra, los racks se recalculan
watch(() => bodega.pallets, () => {
  const ids = new Set(bodega.pallets.map((t: any) => t.id));
  racks.value = racks.value.map((r: any) => (r.tipo === 'RS' && r.mezcla
    ? conMezcla({ ...r, mezcla: r.mezcla.map((id: string | null) => (id && ids.has(id) ? id : null)) }) : r));
}, { deep: true });

function cambiar(cambio: Partial<RackPlano>) {
  if (rackSel.value) actualizar(rackSel.value.id, cambio);
}

function mover(id: string, x: number, y: number) {
  actualizar(id, { x, y });
}

function girar(id: string) {
  const r = racks.value.find((q) => q.id === id);
  if (r) actualizar(id, { rot: ((r.rot + 90) % 360) as RackPlano['rot'] });
}

function duplicar(id: string) {
  const r = racks.value.find((q) => q.id === id);
  if (!r) return;
  const copia = lugarLibre({ ...r, id: nuevoId() }, racks.value, bodega) as RackPlano;
  racks.value.push(copia);
  seleccion.value = copia.id;
}

function eliminar(id: string) {
  racks.value = racks.value.filter((r) => r.id !== id);
  if (seleccion.value === id) seleccion.value = null;
}

function reiniciar() {
  if (!confirm('¿Borrar todos los racks y empezar de nuevo?')) return;
  racks.value = [];
  seleccion.value = null;
}

// ─── Cotizar: resumen para el vendedor y el plano como imagen adjunta ───
const formularioAbierto = ref(false);
const preparando = ref(false);
const archivosPlano = ref<File[]>([]);
const itemCotizacion = computed<QuoteItem>(() => ({
  name: 'Diseño del planificador de bodega',
  config: {
    ...resumenCotizacion(bodega, racks.value),
    ...(bodega.altura ? { 'Altura libre': `${formatoM(bodega.altura)} m` } : {}),
    'Operación': `${gruaActual.value.nombre}${bodega.pesoPallet ? ` · pallet de ${bodega.pesoPallet.toLocaleString('es-CL')} kg` : ''}${bodega.pesoBandeja ? ` · bandeja de ${bodega.pesoBandeja} kg` : ''}`,
    ...(perfil.value ? { 'Perfil': PERFILES.find((p) => p.v === perfil.value)?.t ?? perfil.value } : {}),
    ...(resumenEvaluacion.value ? { 'Evaluación': resumenEvaluacion.value } : {}),
    ...(planosTotales.value ? { 'Planos de carga': planosTotales.value } : {}),
    ...(kpi.value.global.existente.racks ? { 'Existente / nuevo': `${kpi.value.global.existente.posiciones} posiciones que ya tiene + ${kpi.value.global.nuevo.posiciones} nuevas = ${kpi.value.global.total.posiciones}` } : {}),
    'Solicitud': modo.value === 'pdf' ? 'Descargó el plano en PDF' : 'Cotización',
  },
  analytics: {
    lead_origin: 'planificador',
    sistemas: [...new Set(racks.value.map((r) => r.tipo))].join(','),
    m2: Math.round(area(contorno(bodega))),
    posiciones: total.value.pallets,
    bandejas: total.value.bandejas,
    racks: racks.value.length,
    perfil: perfil.value ?? 'sin_perfil',
    entregable: modo.value,
  },
}));

async function imagenPlano(): Promise<File | null> {
  const svg = planoRef.value?.$el;
  if (!svg) return null;
  const copia = svg.cloneNode(true) as SVGSVGElement;
  const vb = svg.viewBox.baseVal;
  const escala = Math.min(4000 / vb.width, 4000 / vb.height, 60);   // ~60 px por metro
  const ancho = Math.round(vb.width * escala), alto = Math.round(vb.height * escala);
  copia.setAttribute('width', String(ancho));
  copia.setAttribute('height', String(alto));
  copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copia)], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise((ok, mal) => { img.onload = ok; img.onerror = mal; img.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/png'));
    return blob ? new File([blob], 'plano-bodega.png', { type: 'image/png' }) : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// "cotizar" o "pdf": los dos piden los datos del cliente (peaje); el PDF se descarga despues del envio
const modo = ref<'cotizar' | 'pdf'>('cotizar');
const exportando = ref(false);
const pdfListo = ref(false);

async function pedir(m: 'cotizar' | 'pdf') {
  modo.value = m;
  preparando.value = true;
  pdfListo.value = false;
  seleccion.value = null;   // el plano sale sin el rack resaltado, sin zoom y con todas las cotas
  muroSel.value = null;
  herramienta.value = 'mover';
  planoRef.value?.restablecerVista();
  exportando.value = true;
  await nextTick();
  try {
    const plano = await imagenPlano();
    // El plano o foto que calco el cliente tambien le sirve al vendedor
    archivosPlano.value = [plano, calco.value?.archivo].filter(Boolean) as File[];
  } finally {
    exportando.value = false;
    preparando.value = false;
  }
  marcar(m === 'pdf' ? 'planner_pdf_click' : 'planner_quote_click', { racks: racks.value.length });
  formularioAbierto.value = true;
}

// Vista 3D para el PDF: si se esta en el plano, se abre el 3D un momento y se captura
async function capturar3D(): Promise<string | null> {
  const antes = vista.value;
  vista.value = '3d';
  let img: string | null = null;
  for (let i = 0; i < 40 && !img; i++) {
    await new Promise((ok) => setTimeout(ok, 150));
    img = visorRef.value?.captura() ?? null;
  }
  vista.value = antes;
  return img;
}

const aDataUrl = (f: File) => new Promise<string>((ok, mal) => {
  const r = new FileReader();
  r.onload = () => ok(r.result as string);
  r.onerror = mal;
  r.readAsDataURL(f);
});

async function alEnviar(cliente: { reference: string; name: string; email: string; company: string; rut: string; comuna: string }) {
  if (modo.value !== 'pdf') return;
  const plano = archivosPlano.value[0];
  if (!plano) return;
  const [{ crearPdfPlano }, planoUrl, vista3d] = await Promise.all([import('~/lib/rack3d/pdfPlano.js'), aDataUrl(plano), capturar3D()]);
  const filas = racks.value.map((r, i) => {
    const p = rectangulo(r), c = capacidad(medidasRack(r));
    const [sistema, ...resto] = describir(r).split(' · ');
    const sem = semaforoCarga(r, bodega.pesoPallet, bodega.pesoBandeja) as { uso: number; color: string } | null;
    const carga = sem ? `${Math.round(sem.uso * 100)} %${sem.color === 'rojo' ? ' · revisar' : ''}` : 'Sin peso';
    return [String(i + 1), sistema, resto.join(' · '), `${formatoM(p.ancho)} × ${formatoM(p.alto)} × ${formatoM(altoRack(r))} m`, c.pallets ? `${c.pallets} posiciones` : `${c.bandejas} bandejas`, carga];
  });
  const i = ind.value;
  const blob = await crearPdfPlano({
    cliente,
    plano: planoUrl,
    vista3d,
    bodega: resumenCotizacion(bodega, racks.value).Bodega + (bodega.altura ? ` · altura libre ${formatoM(bodega.altura)} m` : '') + ` · ${gruaActual.value.nombre.toLowerCase()}${bodega.pesoPallet ? `, pallet de ${bodega.pesoPallet.toLocaleString('es-CL')} kg` : ''}`,
    filas,
    // Lo que lleno el cliente va primero: si no cabe todo, se corta el comparador
    evaluacion: [
      ...(resumenEvaluacion.value ? [`Tu proyecto: ${resumenEvaluacion.value}.`] : []),
      ...(evaluacionRef.value?.comparacion ?? []).map((c) => `${c.nombre}: ${c.posiciones.toLocaleString('es-CL')} posiciones estimadas (${c.detalle}).`),
    ],
    indicadores: [
      ['Racks', String(racks.value.length)],
      ...(total.value.pallets ? [['Posiciones de pallet', String(total.value.pallets)] as [string, string]] : []),
      ...(total.value.bandejas ? [['Niveles de bandeja', String(total.value.bandejas)] as [string, string]] : []),
      ['Piso ocupado por racks', porcentaje(i.ocupacion)],
      ...(total.value.pallets ? [['Posiciones por m²', i.posicionesM2.toLocaleString('es-CL', { maximumFractionDigits: 2 })] as [string, string]] : []),
      ['Uso de la altura', i.usoAltura === null ? 'Sin altura libre' : porcentaje(i.usoAltura)],
    ],
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plano-racklog-${cliente.company.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bodega'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  pdfListo.value = true;
  marcar('planner_pdf_download', { racks: racks.value.length, perfil: perfil.value ?? 'sin_perfil' });
}

function marcar(event: string, datos: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_category: 'Planificador', ...datos });
}

// ─── El diseño se guarda en este navegador (si se recarga la pagina no se pierde) ───
onMounted(() => {
  try {
    const g = JSON.parse(localStorage.getItem(GUARDADO) || 'null');
    if (g?.bodega && Array.isArray(g.racks)) {
      bodegaEntrada.ancho = g.bodega.ancho;
      bodegaEntrada.largo = g.bodega.largo;
      aplicarBodega();
      bodega.altura = Number(g.bodega.altura) >= 2 ? Number(g.bodega.altura) : null;
      bodega.grua = g.bodega.grua in GRUAS ? g.bodega.grua : 'contrapeso';
      bodega.pesoPallet = Number(g.bodega.pesoPallet) > 0 ? Number(g.bodega.pesoPallet) : null;
      bodega.pesoBandeja = Number(g.bodega.pesoBandeja) > 0 ? Number(g.bodega.pesoBandeja) : null;
      bodega.pallets = Array.isArray(g.bodega.pallets) ? g.bodega.pallets.filter((t: any) => t && t.id && Number(t.alto) > 0) : [];
      bodega.elementos = Array.isArray(g.bodega.elementos)
        ? g.bodega.elementos.filter((e: Elemento) => e && e.clase in ELEMENTOS && [e.x, e.y, e.ancho, e.alto].every(Number.isFinite))
        : [];
      alturaEntrada.value = bodega.altura;
      const forma = Array.isArray(g.bodega.forma) && g.bodega.forma.length >= 3 ? g.bodega.forma : null;
      bodega.forma = forma && forma.every((p: Punto) => Number.isFinite(p?.x) && Number.isFinite(p?.y)) ? forma : null;
      racks.value = g.racks.filter((r: RackPlano) => r && r.tipo in TIPOS).map((r: RackPlano) => dentroDeBodega(normalizar(r), bodega) as RackPlano);
    }
  } catch { /* sin almacenamiento: se empieza vacio */ }
  // Desde la ficha de un producto (?rack=RS): ese rack ya puesto en la bodega
  const pedido = route.query.rack;
  if (typeof pedido === 'string' && pedido in TIPOS) {
    agregar(pedido as RackPlano['tipo']);
    router.replace({ query: {} });   // al recargar no se vuelve a agregar
  }
  try {
    const e = JSON.parse(localStorage.getItem(GUARDADO_ESCENARIOS) || '[]');
    if (Array.isArray(e)) escenarios.value = e.filter((x) => x && typeof x.estado === 'string').slice(0, 8);
  } catch { /* sin almacenamiento */ }
  try {
    const p = localStorage.getItem(GUARDADO_PERFIL);
    if (p) perfil.value = p === 'sin_perfil' ? null : p;
    else mostrarPerfil.value = true;
  } catch { mostrarPerfil.value = true; }
  marcar('planner_open', { desde_producto: typeof pedido === 'string' ? pedido : '' });
});

watch([racks, () => ({ ...bodega })], () => {
  try {
    localStorage.setItem(GUARDADO, JSON.stringify({ bodega, racks: racks.value }));
  } catch { /* sin almacenamiento */ }
}, { deep: true });
</script>

<style scoped>
.plan-barra {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  border-radius: 0.625rem;
  background: rgb(255 255 255 / 0.95);
  padding: 0.1875rem;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.12), inset 0 0 0 1px #e5e5e5;
}
.plan-herr {
  min-width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  padding: 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #404040;
}
.plan-herr:hover:not(:disabled) {
  background: #f5f5f5;
}
.plan-herr:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.plan-herr--on {
  background: #fff7ed;
  color: #9a3412;
  box-shadow: inset 0 0 0 1px #fdba74;
}
.plan-input {
  display: block;
  width: 100%;
  height: 2.75rem;
  padding: 0 0.75rem;
  border: 1px solid #e5e5e5;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}
.plan-input:focus {
  outline: none;
  border-color: #ea580c;
  box-shadow: 0 0 0 4px rgb(234 88 12 / 0.15);
}
.plan-add {
  border-radius: 0.75rem;
  padding: 0.875rem 0.5rem;
  text-align: center;
  background: #fff;
  box-shadow: inset 0 0 0 1px #e5e5e5;
  transition: box-shadow 0.15s ease, background-color 0.15s ease;
}
.plan-add:hover {
  background: #fff7ed;
  box-shadow: inset 0 0 0 2px #ea580c;
}
.plan-add:disabled,
.plan-accion:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.plan-step {
  display: inline-flex;
  height: 2.75rem;
  width: 2.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: #fff;
  font-size: 1.25rem;
  font-weight: 600;
  color: #404040;
  box-shadow: inset 0 0 0 1px #e5e5e5;
}
.plan-step:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.plan-accion {
  height: 2.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #404040;
  box-shadow: inset 0 0 0 1px #e5e5e5;
}
.plan-accion:hover {
  background: #f5f5f5;
}
</style>
