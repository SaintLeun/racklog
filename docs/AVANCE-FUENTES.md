# Avance: texto que cambia de tamaño al cargar (fuente Inter)

27-10-2026. Bug: en conexiones lentas el texto cambiaba de tamaño y se corría cuando llegaba Inter.

## Causa (antes)
- `assets/css/main.css:1` importaba `@fontsource-variable/inter` completo: 7 `@font-face`
  (cirílico, griego, vietnamita, latin-ext, latin…). Cada subset que llegaba podía reflujar.
- El preload existía solo en `pages/planifica-tu-bodega/index.vue` (líneas 298 y 311).
- Sin fallback ajustado: mientras cargaba se veía la fuente del sistema con otro ancho y alto.
- `public/.htaccess`: la regla de 30 días para `woff2` iba **después** de la de `/_nuxt/` y le
  ganaba, así que la fuente (que vive en `/_nuxt/`) quedaba sin `immutable`.
- Google Fonts: no se usa en ninguna parte (revisado en código y en `.output/public`).

## Arreglo
| Qué | Dónde |
|---|---|
| Un solo woff2 (variable, subset latin, `font-display: swap`) | `assets/css/main.css:5` |
| Alias `"Inter"` al mismo archivo para SVG y canvas (`font-family="Inter, …"`) | `assets/css/main.css:14` |
| `Inter Fallback` sobre Arial / Liberation Sans / Arimo / Roboto con `size-adjust: 106.66%`, `ascent-override: 90.83%`, `descent-override: 22.62%`, `line-gap-override: 0%` | `assets/css/main.css:26` |
| Fallback en la pila de `--font-sans` | `assets/css/main.css:43` |
| Preload global (misma URL con hash que el CSS) | `app.vue:10`, `app.vue:25` |
| Quitado el preload duplicado de la landing | `pages/planifica-tu-bodega/index.vue` |
| `/_nuxt/` (incluye la fuente) con `max-age=31536000, immutable` | `public/.htaccess:62` |

Las métricas se midieron con fontTools sobre el woff2 de Inter (wght 400) contra Liberation Sans
(métricas de Arial) y Roboto, ponderando con la frecuencia de letras del español: ambas dan
106,7 %, por eso sirve un solo bloque de fallback. Las flechas y símbolos (→ ✓ ≈) no están en
ningún subset de Inter, así que quitar los subsets no cambia cómo se ven.

Build verificado: `.output/public/_nuxt/` tiene un solo `inter-latin-wght-normal.<hash>.woff2` y
todas las páginas lo precargan con la misma URL que usa el `@font-face`.

## Medición (antes → después)
Chromium headless, viewport 390×844, Slow 3G (2 s RTT, 400 kbps), caché desactivada, analítica
bloqueada. CLS = suma de `layout-shift` sin input; todos los movimientos ocurrieron al llegar la fuente.

| Página | CLS antes | CLS después | Fuente lista antes | Fuente lista después |
|---|---|---|---|---|
| `/` | **0,160** | **0,001** | 13,0 s | 7,5 s |
| `/planifica-tu-bodega/` | 0,0026 | 0,0003 | 8,5 s | 8,4 s |
| `/planificador/` | 0,0008 | 0,0000 | 13,0 s | 9,4 s |
| `/productos/rack-selectivo/` | 0 | 0 | 12,8 s | 7,5 s |

Pendiente: repetir en un celular Android real con DevTools remoto una vez desplegado, y revisar
en PageSpeed que el CLS de campo baje en las próximas semanas.
