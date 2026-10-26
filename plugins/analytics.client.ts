// Carga Google Tag Manager, Microsoft Clarity y (si tienen ID) Meta Pixel y LinkedIn Insight Tag
// solo despues de que el usuario acepta las cookies de analitica. Si las rechaza, no se inyecta nada.

const GTM_ID = 'GTM-KBNCKG7J';
const CLARITY_ID = 'u2i8dmi3pu';
// Vacios = no se carga nada. Se pueden fijar aqui o en runtimeConfig.public (ver docs/ENVIRONMENT.md)
const META_PIXEL_ID = '';
const LINKEDIN_PARTNER_ID = '';
const LINKEDIN_CONVERSION_ID = ''; // conversion "Lead" creada en LinkedIn Campaign Manager

// Eventos del dataLayer (§5 del tour) que se reenvian a Meta: estandar o personalizados
const META_EVENTOS: Record<string, { estandar?: string; propio?: string }> = {
  quote_sent: { estandar: 'Lead' },
  registro_ok: { estandar: 'CompleteRegistration' },
  whatsapp_click: { estandar: 'Contact' },
  quote_open: { propio: 'QuoteOpen' },
  tour_start: { propio: 'TourStart' },
  recomendacion: { propio: 'Recomendacion' },
  kpi_view: { propio: 'KpiView' },
  pdf_download: { propio: 'PdfDownload' },
};

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

function loadMetaPixel(id: string) {
  const w = window as any;
  if (w.fbq) return;
  const fbq: any = function (...args: unknown[]) {
    fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  w.fbq = fbq;
  w._fbq = fbq;
  const script = document.createElement('script');
  script.id = 'meta-pixel-script';
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
  fbq('init', id);
  fbq('track', 'PageView');
}

function loadLinkedIn(id: string) {
  const w = window as any;
  if (w.lintrk) return;
  w._linkedin_partner_id = id;
  w._linkedin_data_partner_ids = [...(w._linkedin_data_partner_ids || []), id];
  const lintrk: any = function (a: unknown, b: unknown) { lintrk.q.push([a, b]); };
  lintrk.q = [];
  w.lintrk = lintrk;
  const script = document.createElement('script');
  script.id = 'linkedin-insight-script';
  script.async = true;
  script.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
  document.head.appendChild(script);
}

/** Reenvia a Meta y LinkedIn los eventos que la pagina empuja al dataLayer (los ya empujados tambien) */
function forwardDataLayer(meta: boolean, linkedinConversion: string) {
  const w = window as any;
  const dl: any[] = (w.dataLayer = w.dataLayer || []);
  if ((dl as any).__pixeles) return;
  (dl as any).__pixeles = true;
  const enviar = (item: any) => {
    const evento = item && typeof item === 'object' ? item.event : undefined;
    if (typeof evento !== 'string') return;
    const m = META_EVENTOS[evento];
    if (meta && m && w.fbq) {
      const datos = { content_name: item.event_category, rol: item.rol, industria: item.industria };
      if (m.estandar) w.fbq('track', m.estandar, datos);
      else if (m.propio) w.fbq('trackCustom', m.propio, datos);
    }
    if (linkedinConversion && evento === 'quote_sent' && w.lintrk) {
      w.lintrk('track', { conversion_id: Number(linkedinConversion) });
    }
  };
  dl.forEach(enviar);
  const original = dl.push.bind(dl);
  dl.push = (...items: any[]) => {
    const r = original(...items);
    items.forEach(enviar);
    return r;
  };
}

function removeAnalyticsCookies() {
  const names = document.cookie.split(';').map((c) => c.split('=')[0].trim());
  const domains = ['', `; domain=${location.hostname}`, `; domain=.${location.hostname.replace(/^www\./, '')}`];
  for (const name of names) {
    if (/^(_ga|_gid|_gat|_gcl|_clck|_clsk|CLID|MUID|_fbp|_fbc|li_|lms_)/.test(name)) {
      for (const domain of domains) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
      }
    }
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const { analytics, load } = useConsent();
  const pub = useRuntimeConfig().public as Record<string, unknown>;
  const metaId = String(pub.metaPixelId || META_PIXEL_ID || '').trim();
  const linkedinId = String(pub.linkedinPartnerId || LINKEDIN_PARTNER_ID || '').trim();
  const linkedinConversion = String(pub.linkedinConversionId || LINKEDIN_CONVERSION_ID || '').trim();
  load();

  // Los eventos que se empujen antes del consentimiento quedan en dataLayer
  // y GTM los procesa al cargar; si no hay consentimiento, nunca salen.
  window.dataLayer = window.dataLayer || [];

  watch(analytics, (state, previous) => {
    if (state === 'granted') {
      loadGtm();
      loadClarity();
      if (metaId) loadMetaPixel(metaId);
      if (linkedinId) loadLinkedIn(linkedinId);
      if (metaId || (linkedinId && linkedinConversion)) forwardDataLayer(!!metaId, linkedinId ? linkedinConversion : '');
    } else if (state === 'denied' && previous === 'granted') {
      // Revoco el permiso: borrar cookies de analitica y recargar sin los scripts
      removeAnalyticsCookies();
      window.location.reload();
    }
  }, { immediate: true });

  // Navegacion interna (SPA): PageView de Meta en cada pagina nueva
  if (metaId) {
    let ultima = location.pathname;
    (nuxtApp.$router as any).afterEach((to: any) => {
      // La carga inicial ya conto su PageView en loadMetaPixel; solo los cambios de ruta suman
      if (to.path === ultima) return;
      ultima = to.path;
      if (analytics.value === 'granted') (window as any).fbq?.('track', 'PageView');
    });
  }
});

declare global {
  interface Window {
    dataLayer?: any[];
  }
}
