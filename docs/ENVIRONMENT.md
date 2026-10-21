# Environment and Secrets

## Kommo (servidor)
- El bearer token de Kommo vive solo en `api/config/token.php`, que **no** está en git (ver `api/config/token.example.php`).
- El frontend ya no usa ningún token de Kommo ni variables `VITE_*`.
- Los tokens anteriores estuvieron en el historial de git y fueron revocados/rotados.
- Leads del tour "Planifica tu bodega" (opcional, en el mismo `token.php` o como variables de entorno;
  ver [API.md](API.md#leads-del-tour-planifica-tu-bodega)):
  ```php
  // IDs de campos de texto creados en Kommo (Ajustes > Leads > Campos). Sin esto, todo va en una nota.
  $KOMMO_CAMPOS_TOUR = ['rol' => 0, 'industria' => 0, 'flags' => 0, 'puntaje' => 0,
                        'utm_source' => 0, 'utm_medium' => 0, 'utm_campaign' => 0];
  $KOMMO_RESPONSABLE_TOUR = null; // id de usuario Kommo; sin él la tarea va al responsable del lead
  $KOMMO_ADJUNTOS = true;         // false: el plano queda solo en el correo a contacto@
  ```
  Variables de entorno equivalentes: `KOMMO_CAMPOS_TOUR` (JSON), `KOMMO_RESPONSABLE_TOUR`, `KOMMO_ADJUNTOS=0`.
  La tarea "Enviar cotización (promesa máximo 24 horas)" y la etiqueta `tour-logistico` no necesitan configuración.

## Supabase de la intranet (servidor)
- Cada formulario también se guarda en la tabla `leads_web` del proyecto Supabase `cierre-mes-intranet`.
- Configuración solo en `api/config/supabase.php` (no está en git; ver `api/config/supabase.example.php`): URL, clave publicable (anon) y el token que genera [docs/supabase_leads_web.sql](supabase_leads_web.sql). Nunca la clave `service_role`.
- Rotar el token: volver a ejecutar el último bloque del SQL y actualizar `supabase.php`.
- Sin `supabase.php` la API sigue enviando correo y creando el lead en Kommo; el log marca `intranet_error: not_configured`.

## Valores públicos en el frontend (no son secretos, pero quedan visibles en el bundle)
- Google Tag Manager ID: [plugins/gtag.client.ts](plugins/gtag.client.ts)
- Microsoft Clarity tag ID: [nuxt.config.ts](nuxt.config.ts)
- Meta Pixel y LinkedIn Insight Tag: [plugins/analytics.client.ts](../plugins/analytics.client.ts). Vacíos por defecto
  (no se carga nada). Igual que GTM y Clarity, solo se cargan después de aceptar las cookies de analítica.
  Dos formas de activarlos:
  1. Poner el ID en las constantes `META_PIXEL_ID`, `LINKEDIN_PARTNER_ID` y `LINKEDIN_CONVERSION_ID` del plugin, o
  2. declarar en `nuxt.config.ts` → `runtimeConfig.public` las claves `metaPixelId`, `linkedinPartnerId` y
     `linkedinConversionId` (con valor `''`) y definir al generar el sitio `NUXT_PUBLIC_META_PIXEL_ID`,
     `NUXT_PUBLIC_LINKEDIN_PARTNER_ID` y `NUXT_PUBLIC_LINKEDIN_CONVERSION_ID` (el sitio es estático: el valor queda
     fijo en el build).
  Eventos que se reenvían desde el `dataLayer`: `quote_sent` → Meta `Lead` y conversión de LinkedIn
  (`LINKEDIN_CONVERSION_ID`); `registro_ok` → `CompleteRegistration`; `whatsapp_click` → `Contact`;
  `quote_open`, `tour_start`, `recomendacion`, `kpi_view`, `pdf_download` → eventos personalizados de Meta.
  Cada cambio de ruta suma un `PageView` de Meta.

## Recomendaciones
- Rotar cualquier token si se comparte el repositorio con terceros.
- Nunca commitear `api/config/token.php` ni archivos `.env`.
