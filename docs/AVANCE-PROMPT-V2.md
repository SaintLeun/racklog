# Avance del prompt v2 — Planifica tu bodega

Seguimiento de **todo** lo pedido en el prompt v2 (pegado el 21-10-2026), ítem por ítem.
Estados: ✅ hecho · 🟡 parcial · ⬜ pendiente · ⛔ bloqueado (falta un insumo).
Rama: `landing-tour-planificador`. Actualizar este archivo al cerrar cada etapa.

**Orden de trabajo (R7):** R2 → R1 → R3 → R4 → R5 → R6 → momentos "wow" (§V). Cada etapa se
prueba en celular (390 px) y escritorio con Playwright, revisando capturas, antes de darla por terminada.

**Fuentes de verdad**
- Fórmulas de medidas: cotizador de la intranet (`docs/planos-alturas.zip`: motor-rack-selectivo.js,
  altura-drive-in.js, driveIn.mjs, geometria-rs.mjs). Si el prompt y la intranet difieren, se pregunta.
- Reglas del dueño ya dadas en conversación: barandas en módulos de 6 m + 1 ajuste; protección de
  bastidor del mismo ancho que el bastidor (una por bastidor); perforación del pilar cada 3" (76,2 mm).

---

## §0 Forma de trabajo
- ✅ Probar como cliente (Playwright 390 px y escritorio, capturas revisadas) — se hace en cada etapa.
- 🟡 Calidad antes que rapidez: decir explícitamente lo que no se puede hacer bien (ver R6).
- ✅ Sin regresiones: pruebas en `tests/flujo/` (correr con `bash tests/flujo/correr.sh`).

## §V Norte: visual y conversión
| # | Pedido | Estado |
|---|---|---|
| V1 | Mostrar, no preguntar: cada dato cambia algo visible al instante | 🟡 pasos 3 y 5 sí; pasos 1, 2 y 4 no |
| V2 | Pantalla dividida, dibujo/3D ≥ 60 % (arriba en celular) en **todos** los pasos | 🟡 pasos 5 y 6 sí; paso 3 parcial; 1, 2, 4, 7 no |
| V3 | Su bodega: nombre de su producto, su logo/empresa en plano y PDF | 🟡 nombre de producto sí; logo/empresa ⬜ |
| V4a | Paso 2: pallet que se arma caja por caja en 3D | ✅ |
| V4b | Paso 3: rack que se levanta nivel por nivel | ⬜ |
| V4c | Paso 5: "Llenar mi bodega" con racks repitiéndose entre pilares y contador que sube | 🟡 ubicación automática sí; animación y contador ⬜ |
| V4d | Paso 6: recorrido 3D (planta → altura de operador), grúas y personas; antes/después (+X %) | ⬜ (grúa opera, cámara a la grúa: 🟡) |
| V5 | Lenguaje de beneficio ("Guardas 312 pallets, 38 % más…") | 🟡 "Guardas X" en paso 3; resto ⬜ |
| V6 | Confianza: "Tu diseño es viable ✓", "Revisado por un ingeniero Racklog", NCh2369 | 🟡 viable ✓ y NCh2369 en landing; sello de ingeniero ⬜ |
| V7 | Premio: PDF con su logo, imagen 3D compartible, link a su diseño | ⬜ |
| V8 | CTA con contexto ("Cotizar mis 312 posiciones") | ⬜ |
| V9 | Eventos en cada momento "wow" | 🟡 eventos base sí; por momento wow ⬜ |

## §R1 Regresiones (volver a lo que traía el patch, sin simplificar) — ✅ terminado
| Pedido | Estado |
|---|---|
| Paso 2 con "Arma tu pallet" en **3D**: caja (medidas, peso, cuántas apiladas), 2 orientaciones, camas, alto, peso total, **densidad kg/m³**; una tipología por mercadería | ✅ pallet se arma caja por caja en 3D; + cantidad desde importaciones (1 y 2 años) |
| Catálogo "Tus pallets" (alto, peso, cantidad, rotación) pasa por `useProyecto` al paso 3 | ✅ |
| Mezcla de niveles / "Acomodar solo" con los componentes del patch (`MezclaNiveles`) | ✅ (`TiposPallet` reemplazado por el paso 2 con cajas) |
| `CorteRack`, `GruaDriveIn` dentro del stepper | ✅ |
| Grilla de pilares, pasillo de grúa, peatonal, grúas | ✅ paso 5 |
| Volver a cualquier paso sin perder nada (incluido el 3D) | ✅ stepper + 3D en paso 5 |

## §R2 Bugs de cálculo — ✅ terminado (y medidas iguales al cotizador de la intranet: prueba-intranet)
- ✅ Una sola cuenta (cuerpo = vano de un lado) en pasos 3, 5, 6 y cotización (`conteoRack`).
- ✅ Frente y fondo del pallet como inputs, presets, "Girar pallet", dibujo con viga y marco, cálculo a la vista.
- ✅ Fondo de marco y viga con fórmulas del cotizador (CA22/CA29/CA30/CA23).
- ✅ Protección de bastidor del ancho del bastidor, una por bastidor (regla del dueño).
- ✅ Accesorios con dibujo y cota real.
- ✅ Planta: pasillo = franja que pide el equipo; lo demás "área libre".
- ✅ Sin pantalla en blanco al cambiar de paso.

## §R3 Recomendación con base — ✅ hecho con un BORRADOR de la lógica (por confirmar)
- 🟡 `docs/LOGICA-SELECCION-RACKS.md` original no llegó: se redactó un **borrador** (reglas ⚠ por confirmar) y
  el motor `lib/flujo/recomendacion.js` lo sigue (umbrales en `UMBRALES`). Si llega el original, se reemplaza.
- ✅ Por producto: filtros duros (FIFO/lote, apilador manual, calles vs pallets por SKU), mapa pallets/SKU ×
  rotación, mezcla de sistemas (selectivo + drive-in por alto + ángulo para cajas).
- ✅ Paso 1 empieza con las preguntas; "Ya sé lo que quiero" como atajo.
- ✅ Cada recomendación: producto y números, configuración concreta, por qué, qué ganó a la alternativa, qué confirmar.
- ✅ Recomendado y alternativa dibujados lado a lado con posiciones y m² (paso 3).
- ✅ Tests: CASATEC + logística + minería + alimentos con vencimiento + mezcla (`tests/flujo/prueba-r3.mjs`).
- ✅ Pallets por SKU: campo por tipo de pallet; si falta, se estima desde el paso 1 y queda "a confirmar".

## §R4 Arma tu rack — ✅ terminado
- ✅ Mover vigas dentro del bastidor de a una perforación (76,2 mm), luz validada (carga + 100 mm).
- ✅ Niveles con alturas distintas: por mezcla de pallets y moviendo vigas.
- ✅ Vista frontal, lateral y en planta acotadas.
- ✅ Carga por par de vigas y por marco en el paso 3.

## §R5 Tu bodega (planta)
| Pedido | Estado |
|---|---|
| Repetir en fila (N cuerpos), repetir filas (N con pasillo X), espejo espalda con espalda | ✅ "Repetir en bloque" N × M y espalda con espalda |
| Botón "Llenar mi bodega" | ✅ racks que aparecen de a uno y contador que sube |
| Pasillos tipificados (grúa con mínimo del equipo, peatonal, cruces) con validación en vivo en rojo | 🟡 grúa con ancho del equipo y aviso; cruces ⬜ |
| Pasillos peatonales de varios tramos (clic-clic, en L/U), ancho por input y arrastrando el borde, extremos arrastrables, snap 0,05 m a racks/muros, aberturas con un clic, duplicar/girar/borrar, manillas ≥ 44 px | ✅ |
| Barandas automáticas donde colinda con grúas; en lista, 2D y 3D | 🟡 lista y 2D sí (módulos 6 m + ajuste); 3D ⬜; colindancia automática ⬜ |
| Portones: ancho, alto, muro, distancia a esquina, zona libre delante | ✅ (alto del portón en 3D: agente R6) |
| Pilares: sección y forma (cuadrado/circular/H), array N × M con ejes X/Y y offset al muro, editar o borrar uno | ✅ (forma en 3D pendiente) |
| Andenes: ancho, fondo, alto, cantidad en array, muro, zona de maniobra | ✅ |
| Racks no chocan con pilares ni tapan portones/andenes; layout entre pilares | ✅ zona de maniobra como elemento hijo |
| Todo en 3D con su altura real | 🟡 |

## §R6 3D realista
- ⛔ Grúas GLB realistas por tipo, optimizadas con `gltf-transform`, servidas desde R2 (faltan modelos y acceso al bucket).
- ⬜ Nº de grúas = movimientos/hora ÷ productividad (dato a preguntar en el tour).
- 🟡 Personas a escala con chaleco y casco (hay una; varias ⬜).
- 🟡 Grúa que se mueve: hoy recorre un pasillo y carga/descarga. ⬜ Ruta A* por grafo de pasillos con radio de giro,
  ciclo andén → rack → andén, varias grúas sin choques (reserva de tramos, prioridad en cruces, una vía),
  sin atravesar racks/pilares/personas, test 2+ grúas 5 min → 0 choques.
- 🟡 Pasillos demarcados ✅; protecciones y placas en 3D ⬜.
- ⬜ Cámaras: planta, isométrica, altura de operador, recorrido automático y video exportable.

## §2 Landing y flujo
- ✅ Landing `/planifica-tu-bodega` (§2.1) — ⬜ video del hero (no hay video).
- ✅ Flujo de 7 pasos con stepper, autoguardado, panel por paso. ⬜ "Continuar donde quedé" por correo.
- ✅ Paso 3 y 4 (§2.3); 🟡 accesorios en 3D ⬜.
- ✅ Motor de viabilidad (§2.4) con arreglos.
- ✅ §2.5 opciones acotadas, tipografía, "No sé", WhatsApp a los 60 s, tiempo por paso.

## §3 Estilo y 3D
- ✅ Transiciones, conteo animado, reduced-motion, botones con feedback.
- ⬜ Viga que sube/baja animada al asignar pallet (elevación y 3D).
- ⬜ Ilustración SVG de grúa con cotas A/B/C (revisar `GruaDriveIn`).
- ⬜ Ficha del resultado descargable y compartible (imagen OG generada).
- 🟡 3D: cámara con inercia, zoom al cursor, centrar ✅; accesorios en 3D ⬜.
- ⬜ Rendimiento: medir 50+ fps con 30 racks y carga < 2 s en 4G.

## §4 Pendientes funcionales
- 🟡 Ángulo ranurado con cajas: cajas por bandeja, 250 kg, aviso de escalera ✅; pasillo por carro (ancho + 0,3) ⬜; altura entre repisas según la caja ⬜.
- ✅ Drive-in: un solo alto de pallet por bloque (aviso).
- 🟡 Viga por carga ✅ (motor); pilar por carga → medida real del pilar → largo exacto de fila ⬜ (falta tabla de pilares).
- ⬜ Exportables: PDF con plano, 3D, "qué cotizar" y KPI por rol; link único con aperturas en Kommo.

## §5 Conversión y medición
- 🟡 Eventos: landing_view, cta_click, tour_start, tour_step, registro_ok, recomendacion, pallet_armado, rack_add, kpi_view, quote_open, quote_sent, whatsapp_click ✅; pdf_download ⬜; Meta Pixel y LinkedIn Insight ⬜.
- ✅ UTM y fbclid/li_fat_id guardados y enviados con el lead (en el resumen).
- ⬜ Kommo: etiqueta, rol, industria, flags, puntaje como campos; tarea con vencimiento 24 h al vendedor.
- ⬜ A/B (registro al inicio vs antes del resultado, título, CTA).
- 🟡 SEO: usePageSeo ✅; OG propia 1200×630 por red ⬜; noindex en el flujo ✅.
- ⬜ Lighthouse móvil ≥ 85 rendimiento / ≥ 95 accesibilidad.

## §6 Criterios de aceptación
| Criterio | Estado |
|---|---|
| Flujo completo en 390 px sin scroll horizontal, CTA a mano | ✅ |
| CASATEC → selectivo, drive-in alternativa calculada, revisar_asesor | ✅ (prueba-r3, con lógica borrador) |
| Caso importación (1.500 cajas, 75 pallets, 83 hoy, 43 a crecer) | ✅ (prueba-importacion) |
| Pallets mezclados → 1,2 m piso y niveles 1–2; 1,7 m nivel 3 | ✅ (prueba) |
| Sobrante siempre 300–1.000 mm; techo con punta de la carga | ✅ (ver pregunta: cotizador usa 200) |
| Protecciones de bastidor en doble de 3 filas | ✅ con regla del dueño (12 de 1.000 mm, una por bastidor) |
| Mismos datos → mismos cuerpos, posiciones y marcos en 3, 5, 6 y cotización | ✅ (prueba) |
| Pallet 1,2 × 1,0 frente 1,0 → viga 2,3; girado → 2,7, y cambia el marco | ✅ (prueba) |
| Toda recomendación con por qué y alternativa dibujada | ✅ |
| Cada input cambia el dibujo al instante; visual ≥ 60 % en cada paso | 🟡 (V2) |
| Paso 2 con pallet en 3D y densidad | ✅ |
| Vigas se arrastran (paso de perforación) y se valida la luz | ✅ 76,2 mm |
| Pilares N × M equidistantes; portones y andenes editables; ningún rack sobre ellos | ✅ |
| 2+ grúas 5 min → 0 choques; nº de grúas por movimientos | ⬜ (R6) |
| PDF con logo + imagen 3D compartible; CTA con sus números | ⬜ (V7, V8) |
| Pasillo peatonal de 20 m → barandas a ambos lados con aberturas, en 2D, 3D y cotización | 🟡 2D y cotización ✅; 3D ⬜ |
| Ningún "bloquea" se puede enviar; cada aviso con su arreglo | ✅ |
| Usuario nuevo completa con valores por defecto < 5 min en celular | ✅ (~50 s en la prueba automática) |
| `quote_sent` crea tarea en Kommo a 24 h | ⬜ |
| `quote_sent` llega a Kommo con UTM, rol, resumen y plano adjunto | 🟡 resumen y UTM en el texto; plano adjunto ⬜ |
| Sin errores en consola; `npx nuxi typecheck` limpio | 🟡 consola ✅; typecheck ⬜ (falta instalar vue-tsc) |
| Lighthouse móvil ≥ 85 / ≥ 95 en la landing | ⬜ |

## Preguntas abiertas al dueño
0. Medidas: fondo de marco = pallet − 200 (CA22), viga por W (AS2), alturas CA23, drive-in del cotizador DI: ✅ aplicado.
1. Sobrante de marco: el cotizador usa 200 mm por defecto; el v2 pide 300–1.000. ¿Mínimo 200 o 300?
2. Luz entre marcos dobles: catálogo 0/200/300, motor 0 por defecto; con pallets que sobresalen 100 mm, 0 hace chocar los pallets. Hoy 200. ¿Correcto?
3. Revisar y corregir el borrador `docs/LOGICA-SELECCION-RACKS.md` (reglas ⚠).
4. R6: modelos GLB de grúas (comprar/encargar) y acceso al bucket R2.
5. Productividad (mov/h) y radio de giro por tipo de grúa (§7).
