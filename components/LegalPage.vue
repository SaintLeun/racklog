<template>
  <div>
    <section class="bg-gradient-to-r from-orange-600 to-orange-800 py-14">
      <div class="container mx-auto px-4 max-w-4xl text-center">
        <h1 class="text-white text-4xl md:text-5xl font-bold mb-4">{{ title }}</h1>
        <p v-if="subtitle" class="text-white text-lg md:text-xl">{{ subtitle }}</p>
      </div>
    </section>

    <section class="bg-gray-50 py-12">
      <article class="legal-content container mx-auto px-4 max-w-4xl bg-white rounded-lg shadow p-6 md:p-10 text-gray-800 text-base leading-relaxed">
        <p class="text-sm text-gray-600 mb-8">Última actualización: {{ updated }}</p>
        <slot />
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  updated: string;
}>();
</script>

<style scoped>
.legal-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 2.5rem 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #fed7aa;
}
.legal-content :deep(h2:first-of-type) {
  margin-top: 0;
}
.legal-content :deep(h3) {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 1.5rem 0 0.5rem;
}
.legal-content :deep(p) {
  margin-bottom: 1rem;
}
.legal-content :deep(ul) {
  list-style: disc;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}
.legal-content :deep(li) {
  margin-bottom: 0.4rem;
}
.legal-content :deep(a) {
  color: #c2410c;
  text-decoration: underline;
}
.legal-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}
.legal-content :deep(th),
.legal-content :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  text-align: left;
  vertical-align: top;
}
.legal-content :deep(th) {
  background: #f9fafb;
  font-weight: 600;
}
</style>
