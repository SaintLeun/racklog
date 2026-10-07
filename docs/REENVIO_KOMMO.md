# Reenviar a Kommo los leads que no llegaron

Uso único, para los leads guardados en `leads_web` con `kommo_lead_id` vacío (token de Kommo
vencido desde al menos el 2026-10-01). El script es `api/scripts/reenviar_kommo.php`: solo se
puede ejecutar por terminal, no por web.

Antes de empezar: el token nuevo de Kommo ya tiene que estar en `api/config/token.php` del
servidor y `https://api.racklog.cl/health` tiene que mostrar `kommo_auth: true`.

## 1. Exportar los pendientes desde Supabase

En Supabase > SQL Editor ejecutar:

```sql
select coalesce(json_agg(json_build_object(
  'referencia', referencia, 'tipo', tipo, 'creado_en', creado_en,
  'ip', ip, 'user_agent', user_agent, 'datos', datos
) order by creado_en), '[]'::json) as pendientes
from public.leads_web
where kommo_lead_id is null;
```

Copiar el valor completo de la celda `pendientes` en un archivo `pendientes.json`.

## 2. Subirlo al servidor fuera de la web

Contiene datos personales: dejarlo **fuera** de `public_html`, por ejemplo en
`/home/racklog/reenvio/pendientes.json` (crear la carpeta con el Administrador de archivos de cPanel).

## 3. Ejecutar el script

En cPanel > Terminal:

```bash
cd /home/racklog/public_html/api.racklog.cl
php scripts/reenviar_kommo.php /home/racklog/reenvio/pendientes.json            # solo muestra la lista
php scripts/reenviar_kommo.php /home/racklog/reenvio/pendientes.json --enviar   # crea los leads
```

- Si Kommo rechaza el token, se detiene sin enviar nada.
- Si algún lead falla, volver a ejecutar el mismo comando: los ya creados se omiten
  (quedan anotados en `pendientes.resultado.json`), así que no se duplican.
- En Kommo cada lead lleva su referencia original y, en `ORIGEN`, la fecha, IP y navegador del formulario original.

## 4. Guardar los IDs en la intranet

El script deja `pendientes.update.sql` junto al JSON. Abrirlo, copiar su contenido y ejecutarlo en
Supabase > SQL Editor. Luego verificar que no quede ninguno:

```sql
select referencia, kommo_estado from public.leads_web where kommo_lead_id is null;
```

## 5. Limpiar

Borrar la carpeta `/home/racklog/reenvio/` (el JSON tiene datos personales).

## Leads del 1 al 4 de octubre

Llegaron antes de que existiera `leads_web`, así que solo están en el correo de contacto@racklog.cl
y este script no los cubre: cargarlos a mano en Kommo.
