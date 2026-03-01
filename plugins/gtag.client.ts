// plugins/gtm.client.ts
import { defineNuxtPlugin } from '#app';

const GTM_ID = 'GTM-KBNCKG7J';

export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    // Inject GTM script into <head>
    if (!document.getElementById('gtm-script')) {
      const script = document.createElement('script');
      script.id = 'gtm-script';
      script.innerHTML = `
        (function(w,d,s,l,i){
          w[l]=w[l]||[];
          w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
          j.async=true;
          j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
          f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');
      `;
      document.head.appendChild(script);
      console.log('[GTM] GTM script injected');
    }

    // Optionally inject <noscript> fallback into <body>
    if (!document.getElementById('gtm-noscript')) {
      const noscript = document.createElement('noscript');
      noscript.id = 'gtm-noscript';
      noscript.innerHTML = `<iframe src='https://www.googletagmanager.com/ns.html?id=${GTM_ID}' height='0' width='0' style='display:none;visibility:hidden'></iframe>`;
      document.body.appendChild(noscript);
      console.log('[GTM] GTM noscript fallback injected');
    }

    // Provide $gtmEvent for pushing events to dataLayer
    nuxtApp.provide('gtmEvent', (event: string, params: Record<string, any> = {}) => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event, ...params });
      console.log('[GTM] Event pushed:', event, params);
    });

    // Helper function for conversion tracking
    nuxtApp.provide('trackConversion', (eventLabel: string, value?: number, additionalParams?: Record<string, any>) => {
      window.dataLayer = window.dataLayer || [];
      const conversionData = {
        event: 'purchase', // Standard GA4 purchase event
        event_category: 'Conversion',
        event_label: eventLabel,
        currency: 'CLP',
        value: value || 0,
        ...additionalParams
      };
      window.dataLayer.push(conversionData);
      console.log('[GTM] Conversion event pushed:', conversionData);
    });

    console.log('[GTM] GTM plugin initialized');
  }
});

// TypeScript: declare dataLayer on window for type safety
declare global {
  interface Window {
    dataLayer?: any[];
  }
}

// TypeScript: declare dataLayer on window for type safety
declare global {
  interface Window {
    dataLayer?: any[];
  }
}
