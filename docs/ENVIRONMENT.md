# Environment and Secrets

## Kommo (servidor)
- El bearer token de Kommo vive solo en `api/config/token.php`, que **no** está en git (ver `api/config/token.example.php`).
- El frontend ya no usa ningún token de Kommo ni variables `VITE_*`.
- Los tokens anteriores estuvieron en el historial de git y fueron revocados/rotados.

## Supabase de la intranet (servidor)
- Cada formulario también se guarda en la tabla `leads_web` del proyecto Supabase `cierre-mes-intranet`.
- Configuración solo en `api/config/supabase.php` (no está en git; ver `api/config/supabase.example.php`): URL, clave publicable (anon) y el token que genera [docs/supabase_leads_web.sql](supabase_leads_web.sql). Nunca la clave `service_role`.
- Rotar el token: volver a ejecutar el último bloque del SQL y actualizar `supabase.php`.
- Sin `supabase.php` la API sigue enviando correo y creando el lead en Kommo; el log marca `intranet_error: not_configured`.

## Valores públicos en el frontend (no son secretos, pero quedan visibles en el bundle)
- Sketchfab API token: [components/QuoteModal/QuoteModal.vue](components/QuoteModal/QuoteModal.vue) (búsqueda de modelos, solo lectura). Conviene rotarlo si se sospecha abuso.
- Google Tag Manager ID: [plugins/gtag.client.ts](plugins/gtag.client.ts)
- Microsoft Clarity tag ID: [nuxt.config.ts](nuxt.config.ts)

## Recomendaciones
- Rotar cualquier token si se comparte el repositorio con terceros.
- Nunca commitear `api/config/token.php` ni archivos `.env`.
