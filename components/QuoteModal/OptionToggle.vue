<template>
  <div class="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
    <button
      v-for="option in options"
      :key="option"
      type="button"
      :aria-pressed="modelValue === option"
      :class="[
        'min-h-11 rounded-lg px-3 text-sm font-semibold capitalize transition-all duration-200',
        modelValue === option
          ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-600/40'
          : 'text-neutral-600 hover:bg-white/60 hover:text-neutral-900'
      ]"
      @click="$emit('update:modelValue', option)"
    >
      {{ option }}
    </button>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  options: string[]
  modelValue: string
}>()

defineEmits(['update:modelValue'])
</script>
