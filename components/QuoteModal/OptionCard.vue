<template>
  <div class="bg-white rounded-xl border border-gray-100 shadow-sm">
    <div class="px-5 py-2 border-b border-gray-100">
      <h3 class="font-medium text-gray-900">{{ title }}</h3>
    </div>
    <div class="px-5 py-4">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{ title: string }>()
</script>
