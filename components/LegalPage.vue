<template>
  <div>
    <section class="page-hero">
      <div class="container-page">
        <div class="max-w-3xl">
          <span class="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300 ring-1 ring-white/10 ring-inset">
            Legal
          </span>
          <h1 class="page-hero__title mt-5">{{ title }}</h1>
          <p v-if="subtitle" class="page-hero__lead">{{ subtitle }}</p>
        </div>
      </div>
    </section>

    <section class="section section-muted">
      <div class="container-page">
        <article class="legal-content card mx-auto max-w-3xl p-6 sm:p-10 lg:p-12 text-base leading-relaxed text-neutral-700 sm:text-[17px]">
          <p class="!mb-8 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Última actualización: {{ updated }}
          </p>
          <slot />
        </article>
      </div>
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
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: #171717;
  margin: 2.75rem 0 1rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e5e5;
}
.legal-content :deep(h2:first-of-type) {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}
.legal-content :deep(h3) {
  font-size: 1.125rem;
  font-weight: 600;
  color: #171717;
  margin: 1.75rem 0 0.5rem;
}
.legal-content :deep(p) {
  margin-bottom: 1rem;
}
.legal-content :deep(strong) {
  font-weight: 600;
  color: #262626;
}
.legal-content :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin-bottom: 1.25rem;
}
.legal-content :deep(ol) {
  list-style: decimal;
  padding-left: 1.25rem;
  margin-bottom: 1.25rem;
}
.legal-content :deep(li) {
  margin-bottom: 0.5rem;
  padding-left: 0.25rem;
}
.legal-content :deep(li::marker) {
  color: #ea580c;
}
.legal-content :deep(a) {
  color: #c2410c;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.legal-content :deep(a:hover) {
  color: #9a3412;
}
.legal-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  font-size: 0.9375rem;
}
@media (max-width: 640px) {
  .legal-content :deep(table) {
    display: block;
    overflow-x: auto;
  }
}
.legal-content :deep(th),
.legal-content :deep(td) {
  border: 1px solid #e5e5e5;
  padding: 0.625rem 0.875rem;
  text-align: left;
  vertical-align: top;
}
.legal-content :deep(th) {
  background: #fafafa;
  font-weight: 600;
  color: #171717;
}
</style>
