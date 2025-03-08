<template>
  <section class="text-gray-600 body-font overflow-hidden">
    <div class="container p-5 mx-auto">
      <Breadcrumbs :breadcrumbs="[{ label: 'Rack Selectivo' }]" />
    </div>
  </section>
  <section class="text-gray-600 body-font overflow-hidden">
    <div class="container px-5 py-10 mx-auto">
      <div class="lg:w-4/5 mx-auto flex flex-wrap">
        <div class="lg:w-1/2 w-full lg:h-auto h-64 object-cover object-center rounded">
          <iframe title="Modelo_RS_Ejemplo" class="w-full h-full" frameborder="0" allowfullscreen
            mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking"
            xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share
            src="https://sketchfab.com/models/1d90e83ff7704eaa9d7b0cc5f0f6a804/embed">
          </iframe>
        </div>
        <div class="lg:w-1/2 w-full lg:pl-10 lg:py-6 mt-6 lg:mt-0">
          <h2 class="text-sm title-font text-gray-500 tracking-widest">FLUJO CONTINUO: ALMACENAJE FIFO EFICIENTE</h2>
          <h1 class="text-gray-900 text-3xl title-font font-medium mb-1 uppe">RACK DINÁMICO</h1>

          <p class="leading-relaxed text-justify pt-3">El Rack Dinámico de Racklog es una solución de almacenamiento
            avanzada para pallets, que opera bajo el principio FIFO (First In, First Out). Este sistema innovador
            permite la entrada de pallets por la parte posterior, desplazándose por gravedad mediante polines o ruedas,
            y su salida por la parte frontal. Optimiza la rotación y eficiencia del almacén.
          </p>
          <h3 class="text-2xl text-black py-3">Ventajas del Rack Dinámico</h3>
          <ul class="list-disc pl-10">
            <li><b>Rápida Operación: </b> Agiliza la carga y descarga de pallets.</li>
            <li><b>Menor Riesgo de Impactos:</b> Reduce el riesgo de daños a la estructura y los productos.</li>
            <li><b>Almacenamiento Ilimitado en Profundidad: </b> Maximiza el uso del espacio disponible.</li>
            <li><b>Sistema FIFO Eficiente: </b> Asegura la rotación adecuada de los productos.</li>
            <li><b>Acceso Directo:</b> Facilita la recuperación rápida de pallets.</li>
            <li><b>Operación Segura:</b> Elimina la necesidad de ingreso de grúa a la calle de almacenamiento.
            </li>
          </ul>
          <div class="mt-10">
            <button
              class="flex w-full bg-orange-400 hover:bg-orange-500 text-white border-0 py-2 px-6 focus:outline-none rounded mt-2 transition-colors">Arma
              tu Ángulo Ranurado </button>
            <button
              class="flex w-full bg-orange-400 hover:bg-orange-500 text-white border-0 py-2 px-6 focus:outline-none rounded mt-2 transition-colors">Solicitar
              Cotización</button>
          </div>
        </div>
      </div>
    </div>
  </section>


  <section class="text-gray-600 body-font">
    <div class="container px-5 py-24 mx-auto">
      <div class="flex flex-wrap -m-4">
        <div class="p-4 md:w-1/2 w-full">
          <div class="h-full bg-gray-100 text-gray-700 text-lg p-8 rounded">
            <h3 class="text-2xl mb-4">¿Cómo funciona?</h3>
            <p class="leading-relaxed mb-6">Utiliza la gravedad para mover los pallets a lo largo de
              carriles con polines o ruedas. Los pallets se cargan por la parte posterior y se desplazan automáticamente
              hacia el frente, donde se retiran. Este sistema asegura que los productos más antiguos salgan primero,
              garantizando una gestión de inventario óptima.</p>
          </div>
        </div>
        <div class="p-4 md:w-1/2 w-full">
          <div class="h-full bg-gray-100 text-gray-700 text-lg p-8 rounded">
            <h3 class="text-2xl mb-4">Usos</h3>
            <p class="leading-relaxed mb-6">El Rack Dinámico de Racklog es ideal para: </p>
            <ul class="list-disc pl-10">
              <li>Almacenes de productos perecederos.</li>
              <li>Centros de distribución de alta rotación.</li>
              <li>Industrias con gestión de inventario FIFO.</li>
              <li>Almacenes con espacio limitado que requieren alta densidad.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>

</script>

<style></style>