# API Reference

Base URL (current): `https://api.racklog.cl/api`

## POST /send-email
Sends email(s) and creates a CRM lead. Requires `Content-Type: application/json`
(other content types get `415`, which blocks cross-site form posts).

The confirmation email always goes to the email inside `data` (`email` for
contact, `customerEmail` for quote). A `to` field is ignored if sent.

Request body (JSON):
```json
{
  "data": {
    "name": "Jane Doe",
    "email": "client@example.com",
    "phone": "+56 9 1234 5678",
    "subject": "Contact request",
    "company": "Acme SpA",
    "rut": "",
    "message": "I want more info",
    "serviceInfo": "General"
  },
  "type": "contact"
}
```

For quote requests:
```json
{
  "data": {
    "customerName": "Jane Doe",
    "customerEmail": "client@example.com",
    "customerPhone": "+56 9 1234 5678",
    "customerCompany": "Acme SpA",
    "customerRut": "76.123.456-0",
    "customerComments": "Please call me",
    "products": [
      {
        "name": "Rack Selectivo",
        "quantity": 1,
        "price": 0,
        "quoteOnly": true,
        "config": {
          "alto": "4m",
          "largo": "10m"
        }
      }
    ],
    "cartTotal": 0
  },
  "type": "quote"
}
```

Response (success):
```json
{
  "status": "success",
  "reference": "CT-20250301-1a2b",
  "confirmation_sent": true
}
```

Errors (always JSON, never internal details):

| Code | Cause |
| --- | --- |
| 400 | Invalid JSON or unknown `type` |
| 405 | Method other than POST |
| 413 | Body larger than 20 KB |
| 415 | Content-Type is not `application/json` |
| 422 | Validation failed (email, name, product quantity/price) |
| 429 | Rate limit (5 per IP / 10 min, 3 per recipient / hour, 200 global / hour) |
| 500 | Unexpected error; the response includes `request_id` to find it in the log |
| 502 | Neither the internal email nor the Kommo lead could be created |

Notes:
- Types: `contact` or `quote`.
- The endpoint also creates a Kommo lead (10 s timeout).
- Field lengths are capped (name 100, message/comments 5000, up to 50 products).
- Each submission is logged as one JSON line (`form_submission`) with a `request_id`.

## GET /health
Uptime probe. Returns `200 {"status":"ok"}` when at least one lead destination
(Kommo token or intranet Supabase config), `mail()` and rate-limit storage are
available, or `503 {"status":"degraded"}` with the failing check. Point the uptime
monitor here.

When a Kommo token is configured, `kommo_auth` checks it against Kommo
(`GET /api/v4/account`, result cached 10 minutes per token): `false` means Kommo
rejected it (401/403, expired or revoked token) and the probe returns 503; `null`
means no token or no answer from Kommo, which does not degrade the probe.

Kommo is optional: without `api/config/token.php` (or with its placeholder value) the
API skips Kommo and stores leads only in the intranet (`leads_web`, see
[ENVIRONMENT.md](ENVIRONMENT.md)). When both are configured, the intranet row
gets the Kommo lead id in `kommo_lead_id` and the Kommo outcome in `kommo_estado`
(`creado`, `no_configurado`, `sin_respuesta`, `sin_id` or `http_<code>`; `http_401` =
expired token).

## CORS
CORS headers are set in [api/config/cors.php](api/config/cors.php). Only
`https://racklog.cl` and `https://www.racklog.cl` are allowed; `http://localhost:3000`
is added only when the server sets `APP_ENV=development`.

## Local testing
`KOMMO_API_URL` overrides the Kommo endpoint so the API can be tested without
creating real leads.
