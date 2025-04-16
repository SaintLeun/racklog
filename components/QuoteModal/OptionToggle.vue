<template>
  <div class="grid grid-cols-2 gap-3">
    <button
      v-for="option in options"
      :key="option"
      :class="[
        'px-4 py-2 rounded-lg border text-center transition-all',
        modelValue === option
          ? 'bg-orange-100 border-orange-400 text-orange-800 font-medium'
          : 'bg-white border-gray-300 hover:bg-gray-50'
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