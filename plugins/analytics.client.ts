// Carga Google Tag Manager y Microsoft Clarity solo despues de que el usuario
// acepta las cookies de analitica. Si las rechaza, no se inyecta nada.

const GTM_ID = 'GTM-KBNCKG7J';
const CLARITY_ID = 'u2i8dmi3pu';

function loadGtm() {
  if (document.getElementById('gtm-script')) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const script = document.createElement('script');
  script.id = 'gtm-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);
}

function loadClarity() {
  if (document.getElementById('clarity-script')) return;
  const w = window as any;
  w.clarity = w.clarity || function (...args: unknown[]) {
    (w.clarity.q = w.clarity.q || []).push(args);
  };
  const script = document.createElement('script');
  script.id = 'clarity-script';
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
  document.head.appendChild(script);
}

function removeAnalyticsCookies() {
  const names = document.cookie.split(';').map((c) => c.split('=')[0].trim());
  const domains = ['', `; domain=${location.hostname}`, `; domain=.${location.hostname.replace(/^www\./, '')}`];
  for (const name of names) {
    if (/^(_ga|_gid|_gat|_gcl|_clck|_clsk|CLID|MUID)/.test(name)) {
      for (const domain of domains) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
      }
    }
  }
}

export default defineNuxtPlugin(() => {
  const { analytics, load } = useConsent();
  load();

  // Los eventos que se empujen antes del consentimiento quedan en dataLayer
  // y GTM los procesa al cargar; si no hay consentimiento, nunca salen.
  window.dataLayer = window.dataLayer || [];

  watch(analytics, (state, previous) => {
    if (state === 'granted') {
      loadGtm();
      loadClarity();
    } else if (state === 'denied' && previous === 'granted') {
      // Revoco el permiso: borrar cookies de analitica y recargar sin los scripts
      removeAnalyticsCookies();
      window.location.reload();
    }
  }, { immediate: true });
});

declare global {
  interface Window {
    dataLayer?: any[];
  }
}
