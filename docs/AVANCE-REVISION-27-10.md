# Avance — Revisión del dueño probando el flujo completo (27-10)

Rama `landing-tour-planificador`, sin commit todavía. Los números 1-40 son la lista del prompt en orden (el prompt decía 1-37; al separar cada pedido salen 40).
Estados: **Hecho** · **A medias** · **Pendiente** · **Decide el dueño**.

Verificación del 27-10 (tarde):
- `npx nuxt typecheck`: limpio.
- `node tests/flujo/<archivo>.mjs "$PWD"`: 31 de 31 pasan. Nuevas: `prueba-guion.mjs`, `prueba-pilar.mjs`, `prueba-maniobras.mjs`, `prueba-alinear.mjs`.
- Navegador (Chromium headless, `nuxt dev`):
  - portada en 1280 y 390 px;
  - Revisa con el tour grabado (video descargado y revisado cuadro a cuadro);
  - formulario final en 1280 y 390 px.
- **Falta** recorrer el flujo completo paso a paso en escritorio y en 390 px.

## Nueva regla del dueño (27-10, durante la revisión)
- **Viga: solo el largo.** Nada de "100×50", 2TC70, "perfil de 70 mm" ni kg por par, en ningún lado. Dónde se aplicó:
  - `lib/flujo/calculos.js:569` ("N pares de vigas de 2,7 m"; de aquí salen resumen, PDF y correo)
  - `lib/flujo/auditoria.js:63`
  - `lib/flujo/guion.js:232`
  - `lib/rack3d/pdfPlano.js:589` (se quitó la nota "Código de viga…")
  - `components/flujo/RackInteractivo.vue:118`
  - `components/flujo/PasoRack.vue:231`
  - `components/tour/ArmaPallet.vue:230-231,325-330` (página pública `/tour`: se quitó "Carga por par de vigas")
- **Marca de agua en el video:** logo gigante en diagonal, al 7 %, solo en el video grabado, debajo de los textos.
  - `lib/rack3d/visor.js:11` (constante `MARCA_DE_AGUA`)
  - `lib/rack3d/visor.js:644` (dibujo)
  - `lib/rack3d/visor.js:826` (carga del logo)

## 0. Entrada / landing
| # | Punto | Estado | Evidencia |
|---|---|---|---|
| 1 | Botón amarillo "lo diseño yo" no funcionaba | **Hecho** | La franja transparente del aviso de cookies tapaba los botones del hero y se tragaba el clic. Ahora solo la tarjeta recibe clics: `components/CookieBanner.vue:14,17`. Probado en el navegador: el botón del hero y el del final llevan a `/disena` (1280 y 390 px). |
| 2 | Sacar la disyuntiva "¿2 min o 10 min?" | **Hecho** | Un botón principal y la otra vía en una línea: `pages/planifica-tu-bodega/index.vue:18-38`. |

## 1. Paso Operación
| # | Punto | Estado | Evidencia |
|---|---|---|---|
| 3 | Fotos reales de los apiladores, fondo blanco | **Pendiente: fotos del dueño** | `public/assets/images/equipos/apiladora.webp` y `manual.webp` son fotos reales (Wikimedia), pero tomadas en bodega y no sobre fondo blanco. El componente ya usa fondo blanco: `components/flujo/FotoEquipo.vue:12`; créditos en `:59-65`. Se necesitan 2 fotos de catálogo sobre blanco: apilador eléctrico y apilador manual. |
| 4 | Viga a piso por equipo (por confirmar) | **Hecho** | Flag: `lib/rack3d/parametrosTecnicos.js:11-20` (`vigaPiso`, `confirmado:false`, 0,30 m). Se refleja en: cálculo `lib/flujo/calculos.js:64-65`, medidas `lib/rack3d/medidas.js:45-65`, 3D `lib/rack3d/construir.js:214-215`, corte `components/planificador/CorteRack.vue:64-65`, frente `components/flujo/RackInteractivo.vue:234,248`, qué cotizar `lib/flujo/calculos.js:570-572`, interfaz `components/flujo/PasoRack.vue:157-165`. Detalle: `Elevacion.vue:150` no lo usa, pero hoy solo dibuja ángulo ranurado. |
| 5 | Elegido destacado, no elegidos en gris, leyenda a la derecha | **Hecho** | `components/flujo/PasoOperacion.vue:24-49`; textos en `:232-248`. |
| 6 | Sin "No, ayúdenme" con producto elegido | **Hecho** | `components/flujo/PasoOperacion.vue:64,196`. |
| 7 | Siguiente siempre a la vista | **Hecho** | Barra fija abajo: `components/flujo/Acciones.vue:4`, `assets/css/flujo.css:125-129`, `pages/planifica-tu-bodega/disena.vue:2`. |

## 2. Paso Tu bodega
| # | Punto | Estado | Evidencia |
|---|---|---|---|
| 8 | Solo Rectángulo y Libre; Libre protagonista | **Hecho** | `components/flujo/PasoBodega.vue:47-58`. |
| 9 | Escribir los metros de cada línea | **Hecho** | Teclado: `PasoBodega.vue:1158-1174`. Punta de largo fijo: `components/planificador/Plano2D.vue:729-737`. Indicador: `Plano2D.vue:62-64`. Límite: en el celular (sin teclado físico) se corrige en la lista de muros, `PasoBodega.vue:67-76`. |
| 10 | Cerrar en el punto inicial termina; Escape cancela | **Hecho** | `Plano2D.vue:59` → `PasoBodega.vue:417,1137`; Escape en `PasoBodega.vue:1159`. |
| 11 | Altura libre destacada | **Hecho** | `PasoBodega.vue:125-140`. |
| 12 | Pilares arrastrables, en bloque, cotas, eliminar | **A medias** | Arrastre: `Plano2D.vue:131-137`. En bloque: `Plano2D.vue:787-798`. Cotas a muros: `Plano2D.vue:984-987`. Quitar uno o todos: `PasoBodega.vue:725,2079-2083`. **Falta:** seleccionar varios para borrar, y la cota al muro de un pilar suelto (hoy mide al pilar vecino). |
| 13 | Presets de tamaño + "no lo sé" | **Hecho** | `PasoBodega.vue:831-836,166-180`. |
| 14 | Pilares como opción secundaria | **Hecho** | `PasoBodega.vue:155-186`. |
| 15 | Portón batiente/corredera, adentro/afuera, dibujado | **Hecho** | Panel: `PasoBodega.vue:650-664`. Dibujo: `Plano2D.vue:810-836,872-875`. |
| 16 | Maniobra del portón con cota y explicación | **Hecho** | Achurado con la profundidad escrita: `Plano2D.vue:877-890`. Explicación: `PasoBodega.vue:146-151`. |
| 17 | Andén: maniobra mínima y cotas reales | **Hecho (medidas por confirmar)** | Medidas: `lib/rack3d/parametrosTecnicos.js:77-89` (vano 3,0 m, nivelador 2,5 m, maniobra mínima 2,0 m). Maniobra = pasillo de la grúa: `lib/flujo/calculos.js:841-846`. Nuevo: la cota dice "X m maniobra · Y m hacia adentro", `Plano2D.vue:891`. Tamaño por defecto alineado (3 × 2,5): `lib/rack3d/planificador.js:195`. Las medidas las debe confirmar Técnica. |

## 3. Paso Tus pallets
| # | Punto | Estado | Evidencia |
|---|---|---|---|
| 18 | Mejor 3D del pallet y sus cajas | **Hecho** | `components/flujo/Pallet3D.vue:165-252,271-273`. |
| 19 | Frente/fondo en lista + "otra" | **Hecho** | `components/flujo/PasoPallets.vue:57-64,384,398-413`. |
| 20 | Validación de la caja con mensaje y rangos | **A medias** | "Esa caja no cabe… cabe hasta N mm": `PasoPallets.vue:425-453`, se muestra en `:44,98-99,113`. Rangos del pallet: `:548-558`. **Falta:** que la caja del ángulo ranurado (`:281-288`), el "sobresale" (`:244`) y los campos de importación (`:182-191`) avisen en vez de ajustar en silencio. |
| 21 | Preguntas con su para qué / asistente | **Hecho** | `PasoPallets.vue:159,167,211-226,175-200`. |

## 4. Paso Arma tu rack
| # | Punto | Estado | Evidencia |
|---|---|---|---|
| 22 | Con selectivo, no mostrar drive-in ni ángulo | **Hecho en el paso 4; falta decidir en el paso 5** | Paso 4: `components/flujo/PasoRack.vue:26,116,329`. En el paso 5 los botones RS/DI/AR de `PasoBodega.vue:195,222` son para dibujar los racks **que el cliente ya tiene hoy**, que pueden ser drive-in aunque compre selectivo. Los dejé así; si el dueño quiere ocultarlos también, es un cambio de una línea. |
| 23 | Mejor dibujo del rack + cota con carga + datos básicos | **Hecho** | Cotas "marco" y "con carga": `components/flujo/RackInteractivo.vue:106-115`. Datos a la vista: `PasoRack.vue:76-90`. |
| 24 | Nomenclatura de la viga | **Hecho** (regla nueva: solo el largo, ver arriba) | |
| 25 | El corte refleja los pallets por nivel | **Hecho** | `components/planificador/CorteRack.vue:22-27,58`. |

## 5. Paso Arma tu layout
| # | Punto | Estado | Evidencia |
|---|---|---|---|
| 26 | Los globos no tapan el campo activo | **Hecho** | `composables/useGlobo.ts:28-47`; uso en `components/flujo/Info.vue:17-18` y `components/flujo/Referencial.vue:20-23`. |
| 27 | Encabezado del paso 5 sin sticky | **Hecho** | `pages/planifica-tu-bodega/disena.vue:6,133`. |
| 28 | Rack sobre pilar pierde solo esas posiciones | **Hecho** | Cálculo: `lib/rack3d/planificador.js:229-292,302`. Descuento: `lib/flujo/calculos.js:971-980`. En pantalla: `PasoBodega.vue:35,352,496` y `Plano2D.vue:231-233,1095-1099`. Prueba: `tests/flujo/prueba-pilar.mjs`. |
| 29 | Pasillo etiquetado "pasillo grúa X m" | **Hecho** | `Plano2D.vue:111-117,964-965`. |
| 30 | "Tu grúa necesita X m, aquí quedan Y m" | **A medias** | `PasoBodega.vue:733-736`, `Plano2D.vue:965`. **Falta:** se oculta cuando hay racks en rojo (`PasoBodega.vue:733`), y los avisos de choque y de arrastre (`:453,1405,1475`) no dan la cifra. |
| 31 | Renombrar "Abrir pasos de conexión" | **Hecho** | "Acortar filas para que entre la grúa": `PasoBodega.vue:449-450`. |
| 32 | Cumplimiento fijo junto al plano | **Hecho** | `PasoBodega.vue:14-36` (fijo en escritorio) y `:324-332` (barra en el celular). |

## 6. Accesorios
| # | Punto | Estado | Evidencia |
|---|---|---|---|
| 33 | Canilleras en el pasillo; posiciones tapadas por pilares | **A medias** | Canilleras: `lib/rack3d/accesorios.js:156-193`. Posiciones perdidas descontadas y tachadas en el 2D: `lib/flujo/calculos.js:136-144`, `Plano2D.vue:1095-1103`. **Falta:** el 3D sigue dibujando pallets donde cae el pilar, y el paso Accesorios no lo marca. |
| 34 | Protección de bastidor solo en caras expuestas | **Hecho** | `lib/rack3d/accesorios.js:97-122,206`. El umbral de 0,5 m está por confirmar (`:29`). |
| 35 | Sin malla anticaída en rack doble | **Hecho** | `lib/rack3d/accesorios.js:423,439`: queda solo en selectivo simple. |
| 36 | Protecciones y canilleras arrastrables y más chicas | **A medias** | Se arrastran al 3D con fichas chicas: `components/Visor3D.vue:56-75`. **Falta:** quitar los botones repetidos de cada tarjeta, `components/flujo/PasoAccesorios.vue:82-106`. |

## 7. Revisa y cotiza
| # | Punto | Estado | Evidencia |
|---|---|---|---|
| 37 | Tour guiado de calidad (el enganche) | **Hecho** (falta subir el backend a producción) | Guion de 6 escenas, unos 50 s: bodega con cotas → lo que ya tiene → carga por tipo con módulos destacados → altura libre con el número → maquinaria + aviso de ingeniería → cierre con hoy vs propuesta y CTA (`lib/flujo/guion.js:59-246`; prueba en `tests/flujo/prueba-guion.mjs`). El cliente lo ve en pantalla en Revisa (`components/flujo/PasoRevisa.vue:76-95`). **El video lo envía una persona de Racklog (dueño 27-10):** el lead trae un link al diseño con `recorrido=1` (`lib/flujo/enlace.js` `enlaceRecorrido`; `components/flujo/PasoCotiza.vue` → `payloadLead(..., { linkDiseno })`). Ese link aparece en el correo interno con el botón "Abrir diseño y grabar el recorrido" (`api/partials/template_quote.php` `recorridoSection`) y en la nota de Kommo (`api/utils/kommo_tour.php` `textoNotaTour`). Validación solo para links de racklog.cl: `linkDeDiseno` en `api/utils/validation.php`. Al abrirlo, el ejecutivo cae en Revisa con "Descargar video" (`pages/planifica-tu-bodega/disena.vue:215-221`), graba el mp4 con marca de agua y le manda el link al cliente. Al cliente se le avisa que el video llega con la cotización (`PasoCotiza.vue`). Probado en el navegador: el link del ejecutivo muestra la descarga y el del cliente no. |
| 38 | "Alinear los racks" fácil de usar | **A medias** | Imán con guías al arrastrar: `PasoBodega.vue:1272-1281`. "Alinear mis filas" está escondido en el menú "Más": `PasoBodega.vue:372,1358-1364`. Conviene sacarlo a la vista. |
| 39 | RUT obligatorio; sin RUT no hay cotización ni diseño por correo | **Hecho** | Front: `components/flujo/RegistroFinal.vue:23,88,95`, `lib/flujo/conversion.js:159-165,279`. Back: `api/utils/validation.php` (`RUT requerido`) vía `api/endpoints/send_email.php:80`. Se quitaron, por decisión del dueño, "Guardar y seguir después" y "Envíame el link para seguir en el computador" (`pages/planifica-tu-bodega/disena.vue:10-16,44-50`): el diseño solo sale por correo después del registro con RUT. |
| 40 | Formulario final alineado | **Hecho** | `RegistroFinal.vue:20-31` (grilla de 2 columnas). Revisado en pantalla a 1280 y 390 px. |

## 8. Entrega
- Typecheck y pruebas: ver arriba.
- Flujo completo a mano en escritorio y en 390 px: **pendiente**.

## Decisiones que necesito del dueño
1. **Fotos (punto 3):** foto de catálogo, fondo blanco, del apilador eléctrico y del apilador manual.
2. **Paso 5 (punto 22):** ¿ocultar drive-in y ángulo también en "los racks que ya tienes hoy"?
3. **Por confirmar con Técnica:** viga a piso por equipo, medidas del andén (3,0 / 2,5 / 2,0 m) y el umbral de 0,5 m de la protección de bastidor.
4. **Número del tour para revisar:** la escena de altura dice "sumas 20 posiciones… es como sumar 20 m²". Hay que revisar la equivalencia posiciones → m² antes de mostrarla.

Resueltas el 27-10:
- Video: lo envía una persona de Racklog con un link, no la web.
- "Guardar y seguir después": eliminado.

## Para producción
- Subir `api/` (validation.php, continuar.php, kommo_tour.php, partials/template_quote.php). Sin eso, el link del recorrido no llega al correo interno ni a Kommo. El lead igual se recibe: el servidor viejo ignora el campo.

## Agregado el 27-10 (tarde, pedidos del dueño durante la revisión)
| Pedido | Estado | Evidencia |
|---|---|---|
| Al final de cada flujo, agregar estanterías de los otros productos | **Hecho** | Diseño: tarjeta en Revisa con elección de carga. Drive-in/selectivo: "el mismo pallet" o "configurar uno nuevo". Ángulo: "usar las mismas cajas" o "cambiarlas" (`components/flujo/PasoRevisa.vue`, funciones `conPallet`/`conCajas`). Cantidad de la estantería nueva: `components/flujo/PasoRack.vue` (tarjeta "¿Cuántos pallets van en el…?"). Drive-in con un equipo que no sirve: no se ofrece. Exprés: "¿Te cotizamos también otra estantería?" → lead "También cotizar" (`pages/planifica-tu-bodega/expres.vue`). |
| Video: lo envía una persona de Racklog | **Hecho** | Ver punto 37. |
| Sacar "Guardar y seguir después" | **Hecho** | Ver punto 39. |
| Siguiente siempre a la vista / nada alejado | **Hecho** | Causa: animación con `fill-mode: both` y `translate` en Accesorios anclaban la barra fija a la sección (`assets/css/flujo.css:109`, `components/flujo/PasoAccesorios.vue:2`). La pregunta del pallet de ejemplo pasó a un panel fijo sobre la barra (`PasoPallets.vue`). El campo con error se centra bajo la cabecera (`RegistroFinal.vue`, `Registro.vue`). En el celular, el motivo de bloqueo va en su propia línea (`Acciones.vue`). Medido: Siguiente a la vista en los 7 pasos (1280 y 390 px); en Cotiza el botón es el del formulario. |
| Grilla de pilares | **Hecho** | Centrada (mismo margen a cada muro), vista previa en vivo, "N × M = X pilares" y en el celular la vista va al plano (`lib/rack3d/planificador.js` `grillaPilaresXY`, `PasoBodega.vue`). |
| **Pasillo de la grúa con pilares (asesoría)** | **Hecho** | El pasillo verde agua es el que exige la grúa elegida. Ahora un pilar, oficina, andén o zona dentro del pasillo lo angosta: el ancho útil es el lado más ancho que queda (`lib/rack3d/pasillos.js`, `ANGOSTAN`). El aviso dice la causa y propone "Correr la fila X m: el pilar queda dentro del rack" (`lib/rack3d/viabilidad.js`, arreglo `racks`). El armado automático ya no deja pilares en los pasillos: los deja dentro de los racks, sin cortar la fila (`lib/flujo/calculos.js` `ubicarModelos`, `lib/rack3d/operacion.js` `libre`). Pruebas: `tests/flujo/prueba-pilar.mjs`, `tests/flujo/prueba-layout.mjs` (30 × 45 m con pilares cada 6 m → 6 filas de 11 cuerpos, ningún pasillo angosto). |
| Personas 3D más realistas y en movimiento | **Hecho** | Cara sin "antifaz", pelo atrás, mentón, extremidades que se afinan y ropa de trabajo (`lib/rack3d/equipos.js`). Al caminar: giro del torso, inclinación, giro suave en los extremos y parada sin congelarse (`lib/rack3d/operar3d.js`). Cada una con su ritmo. Sin pasillo peatonal dibujado igual caminan, por una franja segura fuera del alcance de las grúas (`lib/rack3d/flota.js`). |
| Zona de carga (solo si el cliente la agrega) | **Hecho** | "+ Zona de carga (armado de pallets)" en el paso 2 y en "+ Agregar" del layout. Se arrastra y se cambia de tamaño como una oficina. Ni racks ni grúas encima. En 3D, dos operarios llevan cajas de la ruma al pallet, que se arma caja por caja y al llenarse sale (`lib/rack3d/zonaCarga.js`, `lib/rack3d/bodega.js`). |
| Revisión de código (2 revisores) | **Corregido** | Racks rearmados ya no pierden lo que quitan los pilares (`disena.vue` `watchEffect` + `racksAlDia`). Vigas del túnel con viga a piso. Vigas movidas a mano con viga a piso. Grabador del video sin `try`. Link del diseño: ruta exacta, sin puertos y sin localhost en producción. Revisa ya no bloquea la cotización ("Cotizar igual"). Cajas en diseños mixtos. Táctil del dibujo del rack. Cantidad de cajas con 2 ángulos ranurados. Selector de sistema del ángulo. Un solo botón para detener el recorrido. |

Verificación final: typecheck limpio; 31 pruebas JS y 3 PHP pasan. Recorrido completo como cliente (portada → Cotiza, sin enviar a la API) con selectivo, drive-in y ángulo ranurado en 1280 y 390 px, sin errores de consola. Los 4 caminos de "agregar otra estantería" funcionan.
