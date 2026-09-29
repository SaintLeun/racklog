# Environment and Secrets

## Kommo (servidor)
- El bearer token de Kommo vive solo en `api/config/token.php`, que **no** está en git (ver `api/config/token.example.php`).
- El frontend ya no usa ningún token de Kommo ni variables `VITE_*`.
- Los tokens anteriores estuvieron en el historial de git y fueron revocados/rotados.

## Valores públicos en el frontend (no son secretos, pero quedan visibles en el bundle)
- Sketchfab API token: [components/QuoteModal/QuoteModal.vue](components/QuoteModal/QuoteModal.vue) (búsqueda de modelos, solo lectura). Conviene rotarlo si se sospecha abuso.
- Google Tag Manager ID: [plugins/gtag.client.ts](plugins/gtag.client.ts)
- Microsoft Clarity tag ID: [nuxt.config.ts](nuxt.config.ts)

## Recomendaciones
- Rotar cualquier token si se comparte el repositorio con terceros.
- Nunca commitear `api/config/token.php` ni archivos `.env`.
