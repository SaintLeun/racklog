# API Reference

Base URL (current): `https://api.racklog.cl/api`

## POST /send-email
Sends email(s) and creates a CRM lead.

Request body (JSON):
```json
{
  "to": "client@example.com",
  "data": {
    "name": "Jane Doe",
    "email": "client@example.com",
    "phone": "+56 9 1234 5678",
    "subject": "Contact request",
    "message": "I want more info",
    "serviceInfo": "General"
  },
  "type": "contact"
}
```

For quote requests:
```json
{
  "to": "client@example.com",
  "data": {
    "customerName": "Jane Doe",
    "customerEmail": "client@example.com",
    "customerPhone": "+56 9 1234 5678",
    "customerCompany": "Acme",
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
  "message": "Email sent successfully",
  "reference": "CT-20250301-1a2b",
  "type": "contact",
  "internal_result": { "success": true },
  "client_result": { "success": true }
}
```

Notes:
- Types: `contact` or `quote`.
- The endpoint also creates a Kommo lead.

## POST /create-lead
Creates a CRM lead directly.

Request body (JSON):
```json
{
  "type": "Cotizacion",
  "customerName": "Jane Doe",
  "customerEmail": "client@example.com"
}
```

Response:
```json
{
  "status": 200,
  "response": { "_embedded": { "leads": [] } }
}
```

## CORS
CORS headers are set in [api/config/cors.php](api/config/cors.php).
