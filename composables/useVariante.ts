// Pruebas A/B de "Planifica tu bodega" (§5). Apagadas por defecto: mientras no se activen,
// useVariante() devuelve null y cada pagina muestra su texto de siempre.
//
// Activar:
//   - EXPERIMENTOS_ACTIVOS = true aqui, o
//   - runtimeConfig.public.experimentos = '1' en nuxt.config.ts (NUXT_PUBLIC_EXPERIMENTOS=1 al generar).
// Forzar una variante (avisos, revision): ?v=costo  o  ?v=titulo:costo,cta:recibir
//   (funciona aunque los experimentos esten apagados; esas URLs llevan noindex, ver usaVarianteEnUrl()).
//
// Cada visitante recibe al azar una variante por experimento y la conserva (localStorage).
// Al leerla se empuja al dataLayer: { event: 'experimento', experimento, variante } (una vez por pagina),
// para cruzarla en GA4 con cta_click, registro_ok y quote_sent.
//
// Experimento 'registro' (para el flujo, components/flujo/*):
//   import { leerVariante } from '~/composables/useVariante';
//   const registro = leerVariante('registro');   // 'inicio' | 'resultado' | null (null = comportamiento actual)
//   Llamarla en el cliente (onMounted o un handler): en el servidor siempre devuelve null.

export const EXPERIMENTOS = {
  registro: ['inicio', 'resultado'],
  titulo: ['minutos', 'costo'],
  cta: ['cotizar', 'recibir'],
} as const;

export type Experimento = keyof typeof EXPERIMENTOS;
export type Variante<E extends Experimento> = (typeof EXPERIMENTOS)[E][number];

const EXPERIMENTOS_ACTIVOS = false;
const STORAGE_KEY = 'racklog_ab';

function activos(): boolean {
  try {
    const v = (useRuntimeConfig().public as Record<string, unknown>).experimentos;
    if (v !== undefined && v !== '') return v === true || v === '1' || v === 'true';
  } catch {
    // Fuera de un contexto de Nuxt: solo la constante
  }
  return EXPERIMENTOS_ACTIVOS;
}

/** Variantes pedidas en ?v= (p. ej. "costo" o "titulo:costo,cta:recibir") */
function forzadas(): Partial<Record<Experimento, string>> {
  const v = new URLSearchParams(location.search).get('v');
  const out: Partial<Record<Experimento, string>> = {};
  if (!v) return out;
  for (const parte of v.split(',')) {
    const [a, b] = parte.split(':').map((s) => s.trim());
    if (b !== undefined) {
      if (a in EXPERIMENTOS && (EXPERIMENTOS[a as Experimento] as readonly string[]).includes(b)) out[a as Experimento] = b;
    } else {
      // Solo el nombre de la variante: se busca en que experimento esta
      for (const e of Object.keys(EXPERIMENTOS) as Experimento[]) {
        if ((EXPERIMENTOS[e] as readonly string[]).includes(a)) out[e] = a;
      }
    }
  }
  return out;
}

function leerGuardadas(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

const empujados = new Set<string>();

/**
 * Variante del visitante para un experimento, o null si no participa (experimentos apagados
 * y sin ?v=, o en el servidor). Solo en el cliente.
 */
export function leerVariante<E extends Experimento>(experimento: E): Variante<E> | null {
  if (typeof window === 'undefined') return null;
  const opciones = EXPERIMENTOS[experimento] as readonly string[];
  let variante: string | undefined = forzadas()[experimento];
  const forzada = variante !== undefined;

  if (!forzada) {
    if (!activos()) return null;
    const guardadas = leerGuardadas();
    variante = opciones.includes(guardadas[experimento]) ? guardadas[experimento] : undefined;
    if (!variante) {
      variante = opciones[Math.floor(Math.random() * opciones.length)];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...guardadas, [experimento]: variante }));
      } catch {
        // Sin almacenamiento: la variante vale solo para esta visita
      }
    }
  }

  const clave = `${location.pathname}|${experimento}`;
  if (!empujados.has(clave)) {
    empujados.add(clave);
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: 'experimento', experimento, variante, forzada });
  }
  return variante as Variante<E>;
}

/**
 * Version reactiva para componentes: null en el servidor y en la hidratacion (el HTML estatico
 * es siempre el de control) y la variante despues de montar.
 */
export function useVariante<E extends Experimento>(experimento: E): Ref<Variante<E> | null> {
  const variante = ref<Variante<E> | null>(null) as Ref<Variante<E> | null>;
  onMounted(() => { variante.value = leerVariante(experimento); });
  return variante;
}

/** true si la URL fuerza una variante (?v=): esas paginas no deben indexarse */
export function usaVarianteEnUrl(): ComputedRef<boolean> {
  const route = useRoute();
  return computed(() => route.query.v !== undefined);
}
