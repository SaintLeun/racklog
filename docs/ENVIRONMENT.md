# Environment and Secrets

This project currently stores several tokens in code. For production, rotate and store them securely.

## Frontend (Nuxt)
- `VITE_KOMMO_API_TOKEN`
  - Used in [stores/productStore.ts](stores/productStore.ts) for Kommo catalog fetch.
  - Set via `.env` at build time.

## Hardcoded tokens (should be rotated)
- Kommo bearer token
  - [api/config/token.php](api/config/token.php)
  - [api/utils/kommo.php](api/utils/kommo.php)
- Sketchfab API token
  - [components/QuoteModal/QuoteModal.vue](components/QuoteModal/QuoteModal.vue)
- Google Tag Manager ID
  - [plugins/gtag.client.ts](plugins/gtag.client.ts)
- Microsoft Clarity tag ID
  - [nuxt.config.ts](nuxt.config.ts)

## Suggested improvements
- Move all tokens to environment variables.
- Add `.env.example` with placeholders.
- Rotate keys after handover.
