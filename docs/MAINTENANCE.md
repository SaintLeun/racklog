# Maintenance

## Routine checks (monthly)
- Submit a test contact form and quote request.
- Verify email delivery for internal and client confirmations.
- Confirm CRM leads are created.
- Review analytics events in GTM.

## Dependency updates (quarterly)
- Update Node dependencies and run a full build.
- Check for breaking changes in Nuxt and Tailwind.

## Backups
- Keep a copy of the deployed static files.
- Backup the `api/` folder after any edits.

## Monitoring and logs
- PHP `error_log` for API errors.
- El log de depuración del mailer (`mail_debug.log`) fue eliminado; los errores de PHP quedan en el log del servidor.

## Cola de reintento de leads (cron)
Si al recibir un formulario falla Kommo o la intranet (p. ej. el 14-10-2026 el servidor
estuvo ~10 min sin salida a internet: `Connection timed out`), el lead no se pierde:
queda en `api/storage/leads_pendientes/<referencia>.json` y llega un aviso
`[Aviso API]` a contacto@. Un cron lo reintenta (primero Kommo, después la intranet,
para que la intranet guarde el id de Kommo) y avisa cuando queda registrado, o una
sola vez si lleva más de una hora pendiente.

Kommo solo se reintenta cuando es seguro que el lead no se creó (sin conexión, 401/403
o 429). Si la respuesta es ambigua (corte a mitad de respuesta, 5xx, 2xx sin id) no se
reintenta para no duplicar: llega el aviso "Revisar lead … en Kommo".

Cron en cPanel (cada 5 minutos):

```
*/5 * * * * /usr/local/bin/php /home/racklog/public_html/api.racklog.cl/scripts/reintentar_leads.php >/dev/null 2>&1
```

Si `/usr/local/bin/php` no es PHP 8, usar `/opt/cpanel/ea-php80/root/usr/bin/php`.
`/api/health` responde `degraded` con `leads_atrasados > 0` si hay leads en cola hace
más de 30 minutos (Kommo o la intranet siguen fallando, o el cron no corre).
Reintentar no duplica en la intranet: `registrar_lead_web` no vuelve a insertar una
referencia que ya existe (solo completa el `kommo_lead_id` si faltaba). Un lead que no
deba reintentarse más se saca borrando su archivo de la cola.

## Token hygiene
- Rotate API tokens every 6-12 months or after staff changes.
- Avoid storing secrets in git history.
