<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const route = useRoute();
const { siteUrl } = useRuntimeConfig().public;

// URL canonica sin parametros y con barra final (el hosting redirige
// /productos -> /productos/ porque cada pagina es una carpeta), igual para www y sin www
const canonical = computed(() => siteUrl + route.path.replace(/\/?$/, '/'));

useHead(() => ({
  link: [{ rel: 'canonical', href: canonical.value }],
  meta: [{ property: 'og:url', content: canonical.value }],
}));

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${siteUrl}/#organization`,
        name: 'Racklog SpA',
        url: siteUrl,
        logo: `${siteUrl}/assets/images/logo.png`,
        image: `${siteUrl}/assets/images/og-racklog.jpg`,
        description: 'Fabricación e instalación de racks y estanterías industriales en Chile.',
        email: 'contacto@racklog.cl',
        telephone: '+56932403819',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'El Juncal 161-C',
          addressLocality: 'Quilicura',
          addressRegion: 'Región Metropolitana',
          addressCountry: 'CL',
        },
        areaServed: 'CL',
      }),
    },
  ],
});
</script>
