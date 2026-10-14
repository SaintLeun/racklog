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

## Cola de leads para la intranet (cron)
Si al recibir un formulario Supabase falla (caída, timeout, token rechazado), el lead
no se pierde: queda en `api/storage/intranet_pendientes/<referencia>.json` y llega un
aviso `[Aviso API]` a contacto@. Un cron lo reintenta y avisa cuando queda guardado,
o una sola vez si lleva más de una hora sin poder guardarse.

Cron en cPanel (cada 5 minutos):

```
*/5 * * * * /usr/local/bin/php /home/racklog/public_html/api.racklog.cl/scripts/reintentar_intranet.php >/dev/null 2>&1
```

Si `/usr/local/bin/php` no es PHP 8, usar `/opt/cpanel/ea-php80/root/usr/bin/php`.
`/api/health` responde `degraded` con `intranet_atrasados > 0` si hay leads en cola
hace más de 30 minutos (la intranet sigue fallando o el cron no corre).
Reintentar no duplica: `registrar_lead_web` ignora una referencia que ya existe.

## Token hygiene
- Rotate API tokens every 6-12 months or after staff changes.
- Avoid storing secrets in git history.
