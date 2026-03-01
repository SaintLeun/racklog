<template>
  <!-- A/B Test Hero Section -->
  <!-- <Carousel v-if="isOriginalVariant" /> -->
  <HeroVariantNew/>
  
  <LandingCards />
  <Cta />
  <ProductsSection />
  <Gallery />
</template>

<script setup>
import { onMounted } from 'vue'
import { useHeroABTest } from '~/composables/useHeroABTest'
import Carousel from '~/components/Carousel.vue'
import HeroVariantNew from '~/components/HeroVariantNew.vue'

// Initialize A/B test
const { initializeTest, isOriginalVariant, isNewVariant } = useHeroABTest()

onMounted(() => {
  initializeTest()
})
</script>

<style scoped>
h1 {
  color: #333;
}
</style>