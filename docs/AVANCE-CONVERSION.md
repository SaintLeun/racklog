# Avance prompt de conversión (adicional al prompt v3)

Rama `landing-tour-planificador`. Solo se marca ✅ lo que el código respalda (archivo:línea) y lo que se probó.
Leyenda: ✅ hecho y probado · 🟡 parcial · ⬜ pendiente · 🔒 requiere acción del dueño.

**Regla dura (sin precios):** `tests/flujo/prueba-lead-expres.mjs` revisa que el lead y los textos de
`lib/flujo/conversion.js` no lleven `$`, `CLP`, `UF`, "precio" ni "valor ref", y que el texto de ingeniería no
diga "resiste". Las páginas nuevas no muestran montos.

## Pruebas

| Comando | Resultado (23-10-2026) |
|---|---|
| `npx nuxt typecheck` | limpio (exit 0) |
| `node tests/flujo/<archivo>.mjs "$PWD"` (25 archivos) | todos pasan |
| `node tests/flujo/prueba-lead-expres.mjs "$PWD"` | 9 pruebas; incluye correr `api/tests/lead_expres_test.php` con el payload real que arma la web |
| `node tests/flujo/prueba-registro-final.mjs "$PWD"` | 8 pruebas |
| `node tests/flujo/prueba-casatec-tour.mjs "$PWD"` | 2 pruebas |
| `php api/tests/lead_expres_test.php` | todas pasan (Kommo falso local) |
| `php api/tests/kommo_tour_test.php` · `php api/tests/continuar_test.php` | siguen pasando |
| Playwright 390 px (vía exprés completa, envío interceptado) | sin errores de consola, `scrollWidth` 390, rescate visible con 2 "No lo sé" + Quilicura |
| Playwright 1366 px (vía diseño: llenar → Revisa sin registro → Cotiza → envío → PDF) | sin errores; lead multipart con plano + correo `continuar-diseno`; PDF de 5 páginas con la ejecutiva primero |

## A. Restaurar lo eliminado

| Punto | Estado | Evidencia |
|---|---|---|
| "Llenar mi bodega" opcional, con confirmación si hay racks puestos | ✅ | `components/flujo/PasoBodega.vue:219` (botón), `:215` ("Conservar mi layout"), `:1224` `llenar()` |
| "Ubicar los que faltan" | ✅ | `PasoBodega.vue:285` (barra de demanda), `:1260` `ubicarLosQueFaltan()` (usa `ubicarFaltantes`, no mueve lo puesto) |
| "Reubicar solo los racks en conflicto" junto a "Ver el primero en rojo" | ✅ | `PasoBodega.vue:599-600`, `:1251` `reubicarConflictos()`; probado en `tests/flujo/prueba-rearmar.mjs` |
| Nada se reubica solo | ✅ | `pages/planifica-tu-bodega/disena.vue` `racksAlDiaConModelo()` sigue sin ubicar (no se restauró la reubicación automática de 205b751, que el prompt no pide) |
| CASATEC en casos de aceptación + prueba en el tour | ✅ | `tests/flujo/prueba-casatec-tour.mjs` (`lib/tour/reglas.js` → selectivo, alternativa drive-in); `docs/AVANCE-PROMPT-V3.md:14` corregido |

## B. Dos puertas: vía exprés y vía diseño

| Punto | Estado | Evidencia |
|---|---|---|
| Pregunta inicial "¿Lo diseñamos nosotros (2 min) o lo diseñas tú (10 min)?" | ✅ | `pages/planifica-tu-bodega/index.vue:20`; también en el CTA final |
| Vía exprés: qué guardas, cuántos, medidas (con "no las tengo exactas"), equipo por foto | ✅ | `pages/planifica-tu-bodega/expres.vue:18, :33, :64, :93` |
| Foto o plano opcional | ✅ | `expres.vue:101` (hasta 3, fotos achicadas a 1.600 px para no pasar los 5 MB de la API) |
| Registro al final → "cotización formal en máximo 24 h" | ✅ | `expres.vue:119`, envío `:277` |
| Mismo circuito Kommo con etiqueta `via-expres` | ✅ | `api/utils/kommo_tour.php:180` `etiquetasTour()`; `api/tests/lead_expres_test.php` |
| Vía diseño = flujo de 8 pasos | ✅ | `stores/proyecto.ts` (PASOS), comprobado en `prueba-registro-final.mjs` |
| Móvil (<1024 px): exprés por defecto | ✅ | Landing: botón principal "Lo diseñan ustedes" con `lg:hidden` (`index.vue:22`); Playwright: 390 px → exprés, 1280 px → diseño. En `/disena`: aviso `disena.vue:38` |
| Móvil: "te mandamos el link por correo para seguir en el computador" (reusa `/api/continuar-diseno`) | ✅🔒 | `disena.vue:42` abre el mismo formulario "Guardar y seguir después". 🔒 En producción `continuar-diseno` daba 404 el 22-10 (`docs/PRUEBA-LEAD-PRODUCCION.md`) |
| Fotos reales de los equipos | 🔒 | `components/flujo/FotoEquipo.vue:65` `FOTOS_REALES` está vacío: se ven dibujos. Subir `public/assets/images/equipos/{contrapeso,retractil,apiladora,manual,transpaleta}.webp` y agregar su nombre a la lista (así nunca hay 404) |

## C. Registro al final

| Punto | Estado | Evidencia |
|---|---|---|
| Dibujar, armar el rack y ver el 3D sin registro | ✅ | `components/flujo/PasoRevisa.vue:3` (sin compuerta); `prueba-registro-final.mjs` revisa que ningún paso mire `registrado` y que el control no pida registro en ningún paso. Playwright: Revisa abre sin formulario |
| Registro (correo de empresa + nombre; RUT opcional) a cambio de PDF, link y cotización | ✅ | `components/flujo/RegistroFinal.vue:6` ("Lo que recibes"), `:27` (RUT opcional); `PasoCotiza.vue:28`, `:131` envío, `:169` link por correo, `:184` PDF |
| Vía exprés: registro al final de las 4 preguntas | ✅ | `expres.vue:119` |
| A/B: registro al final como control | ✅ | `composables/useVariante.ts:21` (`['inicio', 'final']`); `lib/flujo/conversion.js:150` `pideRegistroAntes()`; `disena.vue:231` |
| Comuna con búsqueda | ✅ | `RegistroFinal.vue:23` (`datalist` con las 52 comunas de la RM y las principales de regiones + "Otra comuna (fuera de la RM)"); `conversion.js:88` |

Nota: el registro único reemplaza en Cotiza al `ContactModal` (que exigía RUT y razón social). El formulario de la
variante "inicio" (`components/flujo/Registro.vue`) también deja el RUT opcional.

## D. "No lo sé" en cada dato difícil

| Dato | Estado | Evidencia |
|---|---|---|
| Peso del pallet → liviano ~500 / medio ~1.000 / pesado ~1.500 | ✅ | `conversion.js:28`; `PasoPallets.vue:140`; `expres.vue:55` |
| Medidas de bodega → aproximadas (±1 m) | ✅ | `PasoBodega.vue:83` (flag `no_se:medidas`); `expres.vue` casilla "No las tengo exactas" |
| Grúa → elegir por foto | ✅ | `FotoEquipo.vue:40` (+ "No lo sé"); `PasoOperacion.vue:42, :74`; `expres.vue:93` |
| Altura de techo → valores típicos | ✅ | `conversion.js:33`; `PasoBodega.vue:79`; `expres.vue` |
| Valor asumido marcado "estimado — tu ejecutivo lo confirma" | ✅ | `conversion.js` `ESTIMADO`, mostrado junto a cada "No lo sé" |
| Viaja a Kommo como lista "datos por confirmar" en la nota | ✅ | `api/utils/kommo_tour.php:216`; probado en `lead_expres_test.php` (una línea `- dato` por cada uno) |

## E. Ingeniería como garantía

| Lugar | Estado | Evidencia |
|---|---|---|
| Texto único | ✅ | `conversion.js:8` `TEXTO_INGENIERIA` |
| Pie del plano | ✅ | `PasoBodega.vue:607` |
| Paso Revisa | ✅ | `PasoRevisa.vue:16` |
| PDF | ✅ | `lib/rack3d/pdfPlano.js:515` (pie de cada página) y la página ejecutiva |
| Correo | ✅ | `api/partials/template_continuar.php:28`; `api/partials/template_quote_confirmation.php:141` (solo leads del tour) |
| Etiqueta "referencial" → "ingeniería lo valida" | ✅ | `components/flujo/Referencial.vue:8`; `PasoRack.vue:247`; `PasoAccesorios.vue`; landing |

## F. Certezas sin precio

| Punto | Estado | Evidencia |
|---|---|---|
| Posiciones exactas que gana, qué incluye (fabricación, montaje, ingeniería), 24 h, Quilicura | ✅ | `RegistroFinal.vue:6-11` (lo usan Cotiza y la vía exprés) |

## G. PDF con página ejecutiva

| Punto | Estado | Evidencia |
|---|---|---|
| Primera página: hoy X → Y (+Z %), m² recuperados, años de crecimiento cubiertos, normas, datos por confirmar | ✅ | `pdfPlano.js:264` `paginaEjecutiva()`, llamada en `:373` antes de la portada; datos en `lib/flujo/perfiles.js:136` `resumenEjecutivo()` y `lib/flujo/exportar.js:243` |
| Plano técnico y cotas después | ✅ | Páginas siguientes de `crearPdfDiseno` (portada 3D, plano, qué cotizar) |
| Descarga tras el registro | ✅ | `PasoCotiza.vue:184` |

"m² recuperados" = posiciones nuevas × huella media del pallet − m² que ocupan los racks con su pasillo
(lo que se libera frente a guardar los mismos pallets a piso); el PDF lo dice bajo la cifra.

## H. Más información = mejor te ayudamos

| Punto | Estado | Evidencia |
|---|---|---|
| Mensaje al inicio de cada vía | ✅ | `conversion.js` `MENSAJE_INICIO`; `PasoOperacion.vue:8`, `expres.vue:18`, landing |
| Porqué de cada dato, en beneficio del cliente | ✅ | `conversion.js:13` `PORQUE` (pallets, peso, medidas, altura, grúa, archivo); mostrado en PasoPallets, PasoBodega, PasoOperacion y exprés |
| Indicador de precisión (sube con datos reales, baja con "No lo sé") | ✅ | `conversion.js:59` `precision()`; `components/flujo/Precision.vue`; cabecera `disena.vue:11`, cabecera de la exprés y resumen final |
| "Con esta información tu ejecutivo cotiza directo, sin visita previa" | ✅ | `RegistroFinal.vue:15` (cuando medidas, cantidad, peso y grúa son reales) |
| Cada "No lo sé" dice lo que se pierde | ✅ | `conversion.js` `PIERDE` junto a cada "No lo sé" |

## I. Visita técnica solo como rescate

| Punto | Estado | Evidencia |
|---|---|---|
| Solo con 2+ "No lo sé" en datos clave (medidas, pallets, grúa) o abandono de medidas | ✅ | `conversion.js:83` `pideRescate()`; `RegistroFinal.vue:33`. Abandono = "No tengo las medidas" en la exprés (`expres.vue:89`) o volver atrás desde "Tu bodega" sin haberla pasado (`disena.vue:131`) |
| RM: visita técnica gratuita; Kommo con `visita-tecnica` + tarea 24 h "Coordinar visita técnica" | ✅ | `conversion.js:135`; `kommo_tour.php:39, :357`; `lead_expres_test.php` |
| Fuera de la RM: videollamada o fotos/plano | ✅ | `conversion.js:135`; tarea "Validar medidas por videollamada o fotos" (sin etiqueta visita-tecnica) |
| Nunca promete fecha | ✅ | Textos de `ofertaRescate`; pruebas JS y PHP buscan días/horas en el texto y la nota |

## J. Entrega

| Punto | Estado | Evidencia |
|---|---|---|
| Aplica a selectivo, drive-in, ángulo ranurado y exprés | 🟡 | Los textos, "No lo sé", precisión, registro y Kommo son comunes a los tres sistemas (no dependen del tipo). La exprés de cajas salta la pregunta de equipo. Recorrido en navegador hecho solo con selectivo |
| Prueba: lead de la vía exprés (etiqueta + datos por confirmar en la nota) | ✅ | `tests/flujo/prueba-lead-expres.mjs` + `api/tests/lead_expres_test.php` |
| Prueba: registro al final sin bloquear el dibujo | ✅ | `tests/flujo/prueba-registro-final.mjs` |
| `npx nuxt typecheck` limpio | ✅ | exit 0 |

## Pendiente / requiere al dueño

- 🔒 Subir `api/` a producción: etiquetas `via-expres`/`visita-tecnica`, la nota con datos por confirmar y la
  segunda tarea viven en `api/utils/kommo_tour.php`; `continuar-diseno` sigue dando 404 el 26-10 (el endpoint
  está en `api/endpoints/continuar.php`, falta desplegarlo). Mientras tanto "Guardar y seguir después" copia el
  link y ofrece mandarlo por WhatsApp si el correo falla.
- ✅ Fotos reales de los equipos (26-10): Wikimedia Commons, CC BY-SA, con crédito visible bajo las fotos
  (`components/flujo/FotoEquipo.vue`, `public/assets/images/equipos/`). Mejor aún: fotos propias o del fabricante.
- ⬜ Prueba en navegador de drive-in y ángulo ranurado de punta a punta.
- ⬜ La captura del 3D en Revisa cuelga Chromium sin GPU (headless); no se pudo fotografiar esa pantalla en la prueba automática.
- Cambio adicional: el correo de confirmación al cliente ya no muestra campos internos (puntaje, flags, etiqueta,
  campaña, precisión): `template_quote_confirmation.php:35`.

## 26-10: veredicto del abogado del diablo

| Punto | Estado | Dónde |
|---|---|---|
| La landing promete lo que el flujo cumple ("Cuatro pasos, unos 10 minutos" + vía exprés de 4 preguntas) | ✅ | `pages/planifica-tu-bodega/index.vue` |
| "Guardar y seguir" no se pierde si el correo falla (copiar link + WhatsApp) | ✅ | `pages/planifica-tu-bodega/disena.vue` |
| Bodega de ejemplo (20 × 30 sin tocar) y pallet de ejemplo cuentan como estimados | ✅ | `lib/flujo/conversion.js` `estadosDiseño` |
| "No sé" en la cantidad + "caben ~N pallets en tu bodega"; "No sé las medidas" → medidas desde los pallets | ✅ | `palletsQueCaben`, `bodegaParaPallets` (`lib/flujo/calculos.js`, `APROVECHAMIENTO_PISO` provisorio 0,7) |
| Una sola cantidad por producto: el rack sigue a "Tus pallets" y al revés | ✅ | `cantidadesAlDia`, `tests/flujo/prueba-cantidades.mjs` |
| Túnel: al medio de la fila, paso según el equipo, aviso si la grúa no pasa, revisión con el paso real bajo la viga | ✅ | `PasoRack.vue`, `lib/rack3d/medidas.js`, `lib/rack3d/rutas.js` |
| Ocupación solo en selectivo y drive-in | ✅ | `resultadoModelo`, `tests/flujo/prueba-ocupacion.mjs` |
| Plano: letras de tamaño fijo en pantalla, sin reencuadre solo; pasillo en L se arrastra entero y no sale de la bodega | ✅ | `Plano2D.vue`, `PasoBodega.vue` (`moverElemento`) |
| Simple vs doble: tabla para que el cliente compare (sin layout automático) | ✅ | `PasoBodega.vue` (`opcionesLineal`) |
| Recorrido en Chromium (landing, equipos, pallets, rack/túnel, bodega, layout, celular): sin errores de consola | ✅ | 26-10 |
| Viga de túnel calculada por el motor y revisión del marco sin vigas | ⬜ | ingeniería |
| Embudo por paso (GTM `tour_step`) y prueba con 5 jefes de bodega | ⬜ | dueño |

