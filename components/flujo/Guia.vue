<template>
  <!-- Guía de marca (mascota que definirá el dueño). Hoy apagado: no dibuja nada ni ocupa espacio.
       Dónde se enchufa (lugar):
       - 'globo': esquina superior izquierda de cada globo de ayuda (FlujoInfo y FlujoReferencial, ambos con useGlobo).
         Va por fuera del globo (absoluto), así no cambia su alto ni el cálculo que lo aleja de los campos.
       - 'tour': a la izquierda del título "Recorrido de tu bodega" en Revisa (PasoRevisa), la tarjeta del recorrido.
         Los textos del recorrido van dibujados en el lienzo 3D (lib/rack3d/visor.js, tarjeta del tour): si el guía
         tiene que salir dentro del video, ahí hay que dejar el hueco a la izquierda de cada tarjeta.
       Para activarlo: poner ACTIVO en true y reemplazar el marcador por la imagen o SVG del personaje (48 × 48 px,
       sin animaciones en bucle). El slot permite pasarle un texto corto ("Te explico…") si se usa como bocadillo. -->
  <span
    v-if="ACTIVO" data-guia :data-lugar="lugar" aria-hidden="true"
    :class="['pointer-events-none flex-shrink-0', lugar === 'globo' ? 'absolute -left-4 -top-4 h-8 w-8' : 'inline-block h-12 w-12']"
  >
    <slot><span class="block h-full w-full rounded-full bg-brand-100 ring-2 ring-white" /></slot>
  </span>
</template>

<script lang="ts" setup>
// Apagado hasta que el dueño entregue el personaje (prepararlo no cambia nada de lo que ve el cliente)
const ACTIVO = false;
defineProps<{ lugar: 'globo' | 'tour' }>();
</script>
