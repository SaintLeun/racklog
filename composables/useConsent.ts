// Consentimiento de cookies de analitica (GTM / GA4 y Microsoft Clarity).
// Mientras no haya una decision, no se carga ningun script de rastreo.

const STORAGE_KEY = 'racklog_consent';
const CONSENT_VERSION = 1;

export type ConsentState = 'unset' | 'granted' | 'denied';

interface StoredConsent {
  analytics: boolean;
  version: number;
  date: string;
}

function readStoredConsent(): ConsentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'unset';
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.version !== CONSENT_VERSION) return 'unset';
    return parsed.analytics ? 'granted' : 'denied';
  } catch {
    return 'unset';
  }
}

export function useConsent() {
  const analytics = useState<ConsentState>('consent-analytics', () => 'unset');
  const settingsOpen = useState<boolean>('consent-settings-open', () => false);

  function load() {
    if (import.meta.client) {
      analytics.value = readStoredConsent();
    }
  }

  function save(granted: boolean) {
    analytics.value = granted ? 'granted' : 'denied';
    settingsOpen.value = false;
    try {
      const value: StoredConsent = { analytics: granted, version: CONSENT_VERSION, date: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Sin almacenamiento la decision vale solo para esta visita
    }
  }

  function openSettings() {
    settingsOpen.value = true;
  }

  return {
    analytics,
    settingsOpen,
    load,
    accept: () => save(true),
    reject: () => save(false),
    openSettings,
  };
}
