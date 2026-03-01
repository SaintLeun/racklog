# Entrega al Cliente

## Resumen del proyecto
Sitio web de Racklog construido como sitio estatico en Nuxt 3 con una API PHP pequena para formularios de contacto y cotizacion. El sitio esta optimizado para renderizado en cliente y se despliega subiendo archivos estaticos por FTP.

## Alcance entregado
- Sitio web corporativo con paginas de productos y servicios.
- Configurador de productos y flujo de cotizacion.
- Formularios de contacto y cotizacion que envian correos y crean leads en CRM.
- Analitica mediante Google Tag Manager y Microsoft Clarity.

## Que incluye esta entrega
- Codigo fuente completo (frontend + API).
- Documentacion (esta carpeta).
- Instrucciones de despliegue.
- Referencia de API y notas de mantenimiento.

## Que puede actualizar el cliente
- Textos y estructura: paginas Vue en `pages/` y UI reutilizable en `components/`.
- Datos de productos y servicios: archivos JSON en `stores/`.
- Imagenes y medios: `public/assets/` y `assets/`.

## Servicios de terceros en uso
- Google Tag Manager (analitica y conversiones).
- Microsoft Clarity (analitica de sesiones).
- Kommo CRM (creacion de leads).
- Sketchfab (busqueda/incrustacion de modelos 3D para el configurador).

## Resumen de despliegue (alto nivel)
- El frontend es un build estatico subido a la raiz del sitio.
- La API es una carpeta PHP desplegada en un servidor (a menudo en un subdominio como `api.example.com`).

Ver instrucciones completas en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
