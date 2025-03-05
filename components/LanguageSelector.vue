<template>
  <div>
    <select name="lang" v-model="selectedLocale" @change="changeLocale" class="text-white bg-neutral-800 border border-gray-700 rounded px-2 py-1">
      <option value="en">English</option>
      <option value="es">Español</option>
    </select>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const selectedLocale = ref('en');

const changeLocale = () => {
  // Handle locale change logic here if needed
};
</script>

<style scoped>
/* Add any additional styles if needed */
</style>