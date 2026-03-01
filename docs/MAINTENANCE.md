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
- Mailer debug log (if enabled): `api/utils/mail_debug.log`.

## Token hygiene
- Rotate API tokens every 6-12 months or after staff changes.
- Avoid storing secrets in git history.
