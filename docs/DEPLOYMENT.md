# Deployment

This project is deployed as:
- Static frontend built by Nuxt.
- PHP API for forms and CRM integration.

## Frontend deployment (static)
1) Build the site

```bash
npm install
npm run generate
```

2) Upload the contents of `.output/public` to the web root (example: `public_html/`).

3) Verify:
- Homepage loads.
- Assets load without 404s.
- Internal navigation works.

## API deployment (PHP)
1) Upload the `api/` folder to the server (example: `api.racklog.cl`).
2) Ensure PHP is enabled and `mail()` is configured on the host.
3) Confirm CORS settings in [api/config/cors.php](api/config/cors.php).

## DNS and routing
- Frontend domain: `https://www.example.com/` (or root domain).
- API domain: `https://api.example.com/`.

Update the frontend to point to the API domain if it changes:
- [components/ContactModal.vue](components/ContactModal.vue)
- [components/Cta.vue](components/Cta.vue)
- [pages/carrito.vue](pages/carrito.vue)

## Post-deploy checks
- Submit a contact form and confirm email delivery.
- Submit a quote request and confirm:
  - Internal email is received.
  - CRM lead is created.
- Verify analytics events (GTM) are firing.
