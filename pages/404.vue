<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-white">
      <img src="/assets/images/404.png" alt="404 Error" class="w-1/2 mb-8" /> 
      <h1 class="text-4xl font-bold text-gray-800 mb-4">Page Not Found</h1>
      <p class="text-lg text-gray-600 mb-8">
        Oops! The page you're looking for seems to be missing.
      </p>
      <NuxtLink to="/" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Return to Homepage
      </NuxtLink>
    </div>
  </template>
  
  <script>
  export default {
    // You can add any component-specific logic here if needed
  }
  </script>