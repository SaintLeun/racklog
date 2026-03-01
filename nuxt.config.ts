import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  
  // Disable SSR completely
  ssr: false,
  
  // Set rendering mode explicitly to client-side only
  routeRules: {
    '/**': { ssr: false }
  },
  
  // Configure app behavior for CSR
  app: {
    baseURL: '/',  // Ensure proper base URL
    buildAssetsDir: '/_nuxt/', // Default directory for assets
    head: {
      title: 'Racklog',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      script: [
        {
          type: 'text/javascript',
          children: `(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "u2i8dmi3pu");`
        }
      ]
    }
  },
  
  // Important: This forces static HTML generation
  nitro: {
    output: {
      publicDir: '.output/public'
    },
    preset: 'static'  // This is key for pure client-side rendering
  },
  
  // Disable features that depend on SSR
  modules: [
    // Remove any modules that require SSR
  ],
  
  // Optimize Vite for client-side rendering
  vite: {
    plugins: [
      tailwindcss(),
    ],
    build: {
      // Optimize chunks for client-side loading
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              return id.split('node_modules/')[1].split('/')[0].toString();
            }
          }
        }
      }
    }
  },
  
  plugins: [
    '~/plugins/pinia.ts',
    '~/plugins/gtag.client.ts',
  ],
});
