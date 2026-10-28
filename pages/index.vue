<template>
  <HeroVariantNew />
  <PlanificadorPromo />
  <LandingCards />
  <Cta />
  <ProductsSection />
  <Gallery />
  <!-- RACKLOG se presenta y cuenta cómo funciona el planificador (dueño 28-10) -->
  <ClientOnly><FlujoGuiaInicio destino="/planifica-tu-bodega" /></ClientOnly>
</template>

<script setup lang="ts">
usePageSeo({
  title: 'Racks y estanterías industriales en Chile',
  description: 'Fabricamos e instalamos racks selectivos, ángulo ranurado, mini racks y entreplantas. Configura y cotiza en línea tu solución de almacenaje.',
});
</script>
