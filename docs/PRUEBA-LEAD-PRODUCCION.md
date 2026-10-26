# Puesta en producción y prueba del lead (prompt v3 §0)

## 1. Antes de probar: subir la API

**Estado al 22-10-2026:** en `api.racklog.cl`, `GET /api/health` responde ok (Kommo, token, intranet,
`mail()` y almacenamiento), pero `POST /api/continuar-diseno` responde **404 "Endpoint not found"**. La API
publicada es la de `main`. Los commits de esta rama `6f0ca48` (Kommo: etiqueta `tour-logistico`, nota, tarea
a 24 h y plano adjunto) y `34782f1` (correo "Continúa tu diseño") **no están en el servidor**.

Para salir a producción, sube la carpeta `api/` de esta rama a `api.racklog.cl` (ver `docs/DEPLOYMENT.md`),
sin pisar `api/config/token.php` ni `api/config/supabase.php`, y revisa que `$KOMMO_CAMPOS_TOUR`
(`api/utils/kommo_tour.php`) tenga los id de los campos propios de Kommo.

Comprobación (sin enviar correos; un dato inválido debe responder 422, no 404):

```bash
curl -s -X POST -H "Origin: https://racklog.cl" -H "Content-Type: application/json" \
  -d '{"email":"x","link":"y"}' https://api.racklog.cl/api/continuar-diseno
# esperado: {"error":"Datos inválidos"}
```

## 2. Pruebas automáticas (locales, Kommo simulado)

```bash
php api/tests/kommo_tour_test.php    # etiqueta, UTM, rol, resumen, plano, tarea 24 h, modo PRUEBA
php api/tests/continuar_test.php     # validación del link y del correo
bash tests/flujo/correr.sh           # lógica del flujo
npx nuxi typecheck
```

## 3. Lead de prueba de punta a punta (manual, en producción)

El modo prueba marca el lead con la etiqueta **PRUEBA**, no le asigna vendedor ni crea la tarea de 24 h.
Para probar **también la tarea**, usa un correo real del equipo, sin `?prueba=1`, y luego borra el lead en Kommo.

1. Abre `https://racklog.cl/planifica-tu-bodega/?utm_source=prueba&utm_medium=checklist&utm_campaign=v3`
   y entra al flujo.
2. Recorre los 7 pasos con los valores por defecto (celular de 390 px o DevTools). Cronometra: menos de 5 min.
3. Regístrate como "Jefe de bodega" con un correo del equipo.
4. "Guardar y seguir después" → "Envíame el link": debe decir "Listo, revisa tu correo" y llegar el correo
   **"Tu diseño de bodega quedó guardado - Racklog"** con el link (revisa también spam). Abre el link en otro
   navegador: el diseño se carga.
5. En "Revisa y cotiza" envía la cotización.
6. En GA4 (DebugView) debe aparecer `quote_sent` con rol y UTM.
7. En Kommo, el lead nuevo debe tener:
   - [ ] etiqueta `tour-logistico`
   - [ ] UTM (`utm_source=prueba`…) en la nota
   - [ ] rol "Jefe de bodega"
   - [ ] resumen del diseño (sistema, posiciones, pallets)
   - [ ] plano PNG adjunto
   - [ ] TAREA "Enviar cotización (promesa máximo 24 horas)" del vendedor, con vencimiento a 24 h
8. Si algo falla: `GET https://api.racklog.cl/api/health` (`leads_atrasados` > 0 = Kommo no recibió y el lead
   quedó en la cola; `api/scripts/reintentar_leads.php` lo reenvía).

## 4. Si falla el correo "Continúa tu diseño"

El navegador reintenta una vez ante un error del servidor (5xx o red). Si vuelve a fallar, muestra
"No se pudo enviar" con el link para abrirlo/copiarlo, así que el cliente nunca pierde su diseño. El servidor
registra cada envío en el log (`continuar_diseno`, `enviado: true|false`).
