// Consulta (?d=…, ?prueba=1, ?rack=RS, UTM…) con la que llegó el visitante. En el sitio compilado (SSG), al hidratar,
// vue-router navega un instante a la ruta SIN la consulta y después la devuelve: lo que la leía al montar (link del
// diseño, link del ejecutivo, demo, UTM) la encontraba vacía. Un script en el <head> (nuxt.config.ts) la guarda antes
// de que corra la app; aquí se lee la actual o, si está vacía por eso, la guardada (solo en la misma página)

/** Texto de la consulta (`?…`) de la página actual */
export function consulta() {
  if (typeof window === 'undefined') return '';
  const ahora = window.location.search;
  if (ahora) return ahora;
  const ini = window.__consultaInicial;
  return ini && ini.ruta === window.location.pathname ? ini.q : '';
}

/** Ya se usó (p. ej. se aplicó el diseño del link): no se vuelve a leer al volver a la página */
export function olvidarConsultaInicial() {
  if (typeof window !== 'undefined') window.__consultaInicial = null;
}

/** Script del <head> que la guarda (corre antes que la app) */
export const SCRIPT_CONSULTA = 'window.__consultaInicial={ruta:location.pathname,q:location.search}';
