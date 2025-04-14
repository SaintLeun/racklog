<template>
  <div class="flex flex-col min-h-screen">
    <Header />
    <main class="flex-grow">
      <NuxtPage />
    </main>
    <Footer />
  </div>
</template>

<script setup>
</script>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>