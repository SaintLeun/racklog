# Technical Handover

## Stack
- Nuxt 3 (client-side rendering, static generation)
- Vue 3 + Pinia
- Tailwind CSS
- PHP API for email + CRM lead creation

## Repository structure (high level)
- `pages/`: Site routes
- `components/`: UI components and forms
- `stores/`: JSON data + Pinia stores
- `public/`: Static assets copied to output
- `api/`: PHP endpoints (email + CRM)

## Local development
1) Install dependencies

```bash
npm install
```

2) Run dev server

```bash
npm run dev
```

## Production build (static)

```bash
npm run generate
```

Output folder: `.output/public`

## Deployment
- Frontend: upload `.output/public` contents to the web root.
- API: upload the `api/` folder to a PHP-enabled host (example: `https://api.racklog.cl/`).

Full steps: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Environment and secrets
See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for tokens and configuration locations.

## API reference
See [docs/API.md](docs/API.md) for endpoint payloads.

## Maintenance
See [docs/MAINTENANCE.md](docs/MAINTENANCE.md).

## Known risks / tech debt
- Several secrets are hardcoded in the repo (GTM ID, Clarity tag ID, Sketchfab token, Kommo tokens). Rotate and move to environment variables if possible.
- The PHP API relies on `mail()`; ensure server mail is configured to avoid delivery failures.
