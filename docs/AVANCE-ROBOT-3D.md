# RACKLOG en 3D (28-10)

Pedido del dueño: el mono de la hoja de poses en 3D, explicando la herramienta y cómo calcula.

## Decisiones del dueño (preguntas del 28-10)
- 3D armado en código (Three.js), sin modelo externo.
- Interviene en: inicio/landing, cada paso, avisos y errores, logros y final.
- Llega caminando, explica en grande y se achica a la esquina; al tocarlo vuelve.
- "Cómo funciona el código" = cómo calcula, en simple: botón "¿Por qué?" con los números del cliente.

## Qué quedó
- `lib/guia3d/robot.js`: el robot (cuerpo, pilares perforados, casco con la R, guantes, zapatillas, caja,
  tablet, pilar) con las 15 poses del asistente. Dibuja solo mientras se mueve (sin bucles); la boca se mueve
  mientras habla la voz. `components/flujo/Robot3D.vue` lo monta (sin WebGL muestra la imagen de la pose).
- `components/flujo/Asistente.vue`: usa el robot 3D; chico en la esquina cuando no explica; salta solo con
  alertas nuevas (y con "ya cumples" / "tu diseño está listo" cuando termina de explicar); celebra al pasar de
  paso; al enviar la cotización cuenta lo que sigue (`FIN`). Espera el aviso de cookies.
- `components/flujo/GuiaInicio.vue`: en `/` y `/planifica-tu-bodega`; se presenta y explica en 3 temas
  (`INICIO` en `lib/flujo/asistente.js`) con botón "Diseñar mi bodega".
- `components/flujo/PorQue.vue` + `porQueDe()`: viga y niveles (paso 4), posiciones necesarias y pasillo (paso 5).

## Pendiente / por confirmar con el dueño
- Afinar el parecido con la hoja (proporciones, casco) según lo que diga al verlo.
- Más "¿Por qué?" si los pide (p. ej. sistema recomendado en el paso 1, fondo del marco).
