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
| V3 | Su bodega: nombre de su producto, su logo/empresa en plano y PDF | 🟡 nombre de producto sí; empresa y logo (opcional, se sube en el paso 7) en PDF e imagen ✅; logo dentro del plano 2D en pantalla ⬜ |
| V4a | Paso 2: pallet que se arma caja por caja en 3D | ✅ |
| V4b | Paso 3: rack que se levanta nivel por nivel | ⬜ |
| V4c | Paso 5: "Llenar mi bodega" con racks repitiéndose entre pilares y contador que sube | ✅ racks que aparecen de a uno y contador que sube (ver "Botón Llenar mi bodega" más abajo); desde v3 es un atajo opcional con confirmación |
| V4d | Paso 6: recorrido 3D (planta → altura de operador), grúas y personas; antes/después (+X %) | ⬜ (grúa opera, cámara a la grúa: 🟡) |
| V5 | Lenguaje de beneficio ("Guardas 312 pallets, 38 % más…") | 🟡 "Guardas X" en paso 3; resto ⬜ |
| V6 | Confianza: "Tu diseño es viable ✓", "Revisado por un ingeniero Racklog", NCh2369 | 🟡 viable ✓ y NCh2369 en landing; sello de ingeniero ⬜ |
| V7 | Premio: PDF con su logo, imagen 3D compartible, link a su diseño | 🟡 tarjeta "Llévate tu diseño" en paso 7 (antes y después de enviar): PDF 3 págs. (portada 3D + sello, plano + KPI por rol, qué cotizar + accesorios), PNG 1200×630 con Descargar/Compartir, "Copiar link" (`lib/flujo/enlace.js`) ✅; abrir el link carga el diseño: falta conectarlo en `disena.vue` |
| V8 | CTA con contexto ("Cotizar mis 312 posiciones") | ✅ paso 7 ("Cotizar mis N posiciones/bandejas", racks nuevos); el formulario lleva adjuntos el plano PNG y el PDF |
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
  `equipos.js` deja `cargarGLB(url)` lista (no se usa sin URL); la grúa armada se mejoró (ruedas torneadas, luces, cilindros, luz azul).
- 🟡 Nº de grúas: `numeroGruas(movimientosHora, tipo)` = ceil(mov/h ÷ PRODUCTIVIDAD) en `flota.js` (PRODUCTIVIDAD provisoria);
  sin el dato: grúas dibujadas, o 2 si hay 2+ pasillos de carga, si no 1. ⬜ preguntar mov/h en el tour (`bodega.movimientosHora`).
- ✅ Personas a escala con chaleco y casco caminando por cada pasillo peatonal (preferencia sobre las grúas); sin peatonal, una quieta fuera del alcance.
- ✅ Flota (`rutas.js` + `flota.js`, sin three): grilla con holgura exacta, huella por orientación, giro solo con RADIO_GIRO (provisorio),
  ciclo andén → pasillo → hueco → sube/deja (y saca en la vuelta siguiente) → andén; cada grúa con su calle (una vía), reserva en el tiempo
  de lo compartido, prioridad al que planifica primero; no atraviesa racks, pilares, oficinas, barandas ni personas (peatonales solo se cruzan).
  `pasillosSinGiro()` para marcar en rojo (⬜ falta pintarlo en 2D). Prueba 2 y 3 grúas, 5 min a 0,1 s, 24×16×8 y 40×30×10: 0 choques, 0 trabadas.
- ✅ Pasillos demarcados; canilleras, protección de bastidor, barandas (ajuste en naranjo) y placas de capacidad en 3D.
- ✅ Cámaras: Planta, Isométrica, Operador (1,6 m en un pasillo), Recorrido (~12 s) y Grabar video (webm/mp4, evento `video_3d`).
  🟡 fps solo medidos en swiftshader (render por software): ver informe; falta medir en equipo real.

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
- 🟡 Exportables: PDF con plano, 3D, "qué cotizar" y KPI por rol ✅ (eventos pdf_download, compartir_3d, link_diseno); link al diseño en la URL ✅; aperturas del link en Kommo ⬜.

## §5 Conversión y medición
- 🟡 Eventos: landing_view, cta_click, tour_start, tour_step, registro_ok, recomendacion, pallet_armado, rack_add, kpi_view, quote_open, quote_sent, whatsapp_click ✅; pdf_download ⬜; Meta Pixel y LinkedIn Insight ✅ (solo con consentimiento, apagados hasta poner los IDs: docs/ENVIRONMENT.md; quote_sent → Lead / conversión LinkedIn).
- ✅ UTM y fbclid/li_fat_id guardados y enviados con el lead (en el resumen).
- ✅ Kommo (api/utils/kommo_tour.php, pruebas `php api/tests/kommo_tour_test.php` contra Kommo falso): etiqueta tour-logistico; rol, industria, flags, puntaje y UTM en nota y como campos si se configuran los IDs (`$KOMMO_CAMPOS_TOUR`); tarea "Enviar cotización (promesa máximo 24 horas)" a 24 h para el responsable del lead; adjuntos subidos al Drive de Kommo y vinculados al lead. Falta probarlo con el token real.
- 🟡 A/B listos y apagados (composables/useVariante.ts): título y CTA conectados en la landing; `?v=` fuerza variante con noindex; registro: falta conectarlo en el flujo con `leerVariante('registro')`.
- ✅ SEO: usePageSeo ✅; OG propia 1200×630 (og-planifica-tu-bodega.png) con og:description y twitter:description propios ✅; noindex en el flujo y en `?v=` ✅.
- 🟡 Lighthouse móvil (build estático): accesibilidad 100 ✅; rendimiento 93–94 con CPU calibrada a la máquina (codespace cargado, benchmarkIndex ~200–370) y 62–68 con el 4× estándar (la portada da 56 en las mismas condiciones). Confirmar con PageSpeed Insights tras el deploy.

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
| 2+ grúas 5 min → 0 choques; nº de grúas por movimientos | ✅ prueba 2 y 3 grúas 0 choques/0 trabadas; `numeroGruas` ✅, dato mov/h en el tour ⬜ |
| PDF con logo + imagen 3D compartible; CTA con sus números | ✅ (prueba entregables.mjs en 390 y 1400 px: descarga PDF e imagen, link decodifica sin lead, modal con plano y PDF adjuntos) |
| Pasillo peatonal de 20 m → barandas a ambos lados con aberturas, en 2D, 3D y cotización | ✅ 2D, 3D (tubo 1,1 m, postes ~1,5 m, ajuste naranjo) y cotización |
| Ningún "bloquea" se puede enviar; cada aviso con su arreglo | ✅ |
| Usuario nuevo completa con valores por defecto < 5 min en celular | ✅ (~50 s en la prueba automática) |
| `quote_sent` crea tarea en Kommo a 24 h | ✅ con Kommo falso (pruebas); falta verificar con el token real |
| `quote_sent` llega a Kommo con UTM, rol, resumen y plano adjunto | 🟡 UTM, rol, industria, puntaje (nota/campos), etiqueta y archivos al Drive del lead ✅ en API; falta que el flujo adjunte el plano (`initial-files` de ContactModal) |
| Sin errores en consola; `npx nuxi typecheck` limpio | 🟡 consola ✅; typecheck ⬜ (falta instalar vue-tsc) |
| Lighthouse móvil ≥ 85 / ≥ 95 en la landing | 🟡 a11y 100; rendimiento 93–94 calibrado / 62–68 con 4× en codespace cargado; confirmar con PageSpeed en producción |

## Preguntas abiertas al dueño
0. Medidas: fondo de marco = pallet − 200 (CA22), viga por W (AS2), alturas CA23, drive-in del cotizador DI: ✅ aplicado.
1. ~~Sobrante de marco~~ ✅ 300 a 1.000 mm (dueño 21-10-2026).
2. ~~Luz entre marcos dobles~~ ✅ separador de bastidor 300 mm (ronda 2).
3. Revisar y corregir el borrador `docs/LOGICA-SELECCION-RACKS.md` (reglas ⚠).
4. R6: modelos GLB de grúas (comprar/encargar) y acceso al bucket R2.
5. Productividad (mov/h) y radio de giro por tipo de grúa (§7).

## Ronda 2 (21-10-2026, docs/PROMPT-CLAUDE-CODE.md pegado en el chat)
Parámetros confirmados por el dueño (`parametrosTecnicos.js`): perforación del bastidor cada 76,2 mm de eje a
eje, primera perforación a 25 mm del piso (toda viga calculada cae en una perforación), luz carga–viga 100 mm,
sobrante de marco 300–1.000 mm, 500 mm libres sobre el último pallet, separador de bastidor 300 mm.

| Bugs de cálculo (primero, pedido del dueño) | Estado |
|---|---|
| Caja 40×40 en pallet 1,0×1,2 → 6 por cama (era 4 por redondeo 1,2/0,4 = 2,999…) + voladizo por parámetro | ✅ `prueba-cama.mjs` |
| Drive-in: primer carril ≥ grúa (techo protector / mástil, típicos por equipo si no midió) + 150 mm; contrapeso + pallet 1,35 → 2,35 m | ✅ `prueba-grua-di.mjs` |
| Drive-in con apilador manual o transpaleta → bloqueado con su motivo (pasos 1, 3 y revisión) | ✅ |
| Vista frontal del drive-in con carriles, grúa, operario y cota de holgura verde/rojo | ✅ `ElevacionDriveIn.vue` |
| Mapa de sistemas: 6–10 pallets por SKU → selectivo + doble profundidad/push-back (ingeniero); drive-in > 10; ≥ 3 de fondo | ✅ `prueba-r3.mjs`, LOGICA-SELECCION-RACKS.md |
| Recomendación: solo se dibuja el sistema recomendado (no aparece un selectivo junto al drive-in) | ✅ |
| Layout: sin tope de 10 cuerpos, filas cortadas solo por obstáculos, sin tramos de 1–2 sueltos, filas del mismo largo, filas corridas para que los pilares caigan en el pasillo | ✅ `prueba-layout.mjs` (30×45, pilares cada 6 m: antes 16 tramos de 2, ahora 4 filas de 10) |
| Registro: errores en cada campo al salir; al enviar solo el primero; RUT con "?" y persona natural con giro | ✅ |
| Adelanto antes del registro (3D sin controles + "Te caben X pallets") | ✅ |
| Un solo botón de cotizar dentro del flujo; "Cotizar" de arriba lleva al último paso | ✅ |
| Modo prueba `?prueba=1` (etiqueta PRUEBA, sin vendedor ni tarea, solo con correo +prueba@racklog.cl) | 🟡 API y pruebas ✅; falta publicar la API para enviar de verdad |
| Medidas típicas de grúa A/B/C por equipo (fichas de fabricantes, aprobadas por el dueño) → carril y calle; drive-in solo si gana m² | ✅ |
| Pilar entre filas espalda con espalda o entre cuerpos ajustando la viga del vano | ⬜ |
| **Bloque 1** · Entrada "¿Sabes qué rack necesitas?" (No, ayúdenme primero / Sí, ya sé) | ✅ |
| Bloque 1 · Resultado honesto con "No sé" (4+ = "partimos con lo más común") y lista de lo supuesto | ✅ |
| Bloque 1 · "Ya lo tengo" en el paso 5: dibujar lo que tiene (gris punteado en 2D, gris translúcido en 3D), interruptor Nuevo / Ya lo tengo, KPI Hoy · Nuevo · Total, lo nuevo se ubica alrededor con su pasillo | ✅ `prueba-layout.mjs` |
| Bloque 1 · Lenguaje: sin SKU, luz, ATC70, sección, "1.º eje", ■ ● H, "zona bloqueada", ANSI, "u"; "?" en calle y cuerpo; "14 cuerpos de selectivo · 112 posiciones" | ✅ (revisión automática de palabras en los 8 pantallazos, 390 y 1440 px) |
| Bloque 1 · Detalle técnico plegado (paso 2 densidad; paso 3 fórmulas, viga, cargas, corte) | ✅ |
| Bloque 1 · Datos de ejemplo marcados en el paso 2 (y van a "confirmar" del lead) · altura antes de la recomendación · interruptor de accesorios | ✅ |
| Bloques 2, 4–7 restantes | ⬜ |

## Ronda 3 (21-10-2026, revisión del flujo completo por perfil, pegada en el chat)
Recorrido de referencia: "No, ayúdenme" → pallets con grúa, pocos productos, más de 10 por producto, 1–5 veces por
semana, pallet completo, vence pronto (FIFO), grúa horquilla, falta espacio. Pruebas: `bash tests/flujo/correr.sh`.

| Bloque | Estado |
|---|---|
| **A** · Medidas distintas entre pasos: los racks del plano eran copias que no seguían al modelo (pallet de ejemplo de 1,2 m → marco 4.440 mm en vez de 5.811). `racksAlDia` (calculos.js) los rearma desde el modelo con la misma función del paso 3 cada vez que cambian pallets, modelos o equipo; si cambia la huella, se vuelven a ubicar | ✅ `prueba-medidas.mjs` (paso 3 = plano = Qué cotizar = nivel más alto) |
| **B** · Canillera 500 mm por defecto o 1.000 mm (chips en el paso 4, 2D/3D con su alto); protección de bastidor en doble = una pieza de 2 × fondo + 300 = 2.300 mm; recomendados parten incluidos. Causa del "No lo incluyo": el flujo nunca se reiniciaba y arrastraba lo quitado en un recorrido anterior → botón "Empezar de nuevo" | ✅ `prueba-libs.mjs` |
| **C** · Paso 2 precargado con el paso 1 ("Lo que nos dijiste", editable: productos, pallets por producto, rotación); datos de ejemplo en gris y "Usamos un pallet de ejemplo. ¿Lo cambiamos por el tuyo?" antes de avanzar | ✅ |
| **D** · Paso 1: foto chica y recién desde la pregunta 4 · Paso 2: 3D arriba con "De lado / Desde arriba", "Ajustar vista" y cotas (reemplaza la tarima naranja) · Paso 3: altura en una línea, dibujo antes del texto, alternativa que rompe un filtro duro no se muestra ("No cumple tu FIFO"), la válida va dibujada · Paso 5: plano arriba y fijo en celular, controles en pestañas (Medidas · Pilares · Portones y andenes · Lo que ya tengo), racks junto al portón/andén, encuadre a lo diseñado en 2D y 3D (grúa operando), "Te quedan X m² libres para crecer" · Ayuda solo tras 60 s sin actividad, en una esquina y nunca sobre un resultado · "Un ingeniero…" una vez por paso | ✅ `prueba-r3.mjs`, `prueba-layout.mjs` |
| **E** · Pestañas por perfil y PDF desde una sola cuenta (`lib/flujo/perfiles.js`): Gerencia = hoy vs Racklog, crecimiento a 1–2 años (0/10/20/30 %), bodega usada y m² libres, plazo; Bodega = dónde queda cada producto, alturas de nivel, pasillos, alcance de la grúa; Compras = viga explicada ("TC70 (perfil de 70 mm, 2.300 mm de largo)" con ?), accesorios con medida y cantidad, NCh2369, "Descargar especificación" (PDF de 1 página) | ✅ `prueba-perfiles.mjs` · peso de acero ⬜ (falta tabla kg/m) |
| **F** · Link de "Copiar link": solo lectura con "Cotizar este diseño", vence a los 30 días (el de "Guardar y seguir después" sigue editable). Imagen del paso 7 con barra de progreso y reintento; evento `imagen_lista` con los ms | ✅ `prueba-enlace.mjs` (vencimiento en el cliente: un link editado a mano podría saltárselo; para hacerlo inviolable hay que guardar el diseño en el servidor) |

Preguntas abiertas de la ronda 3:
6. Peso de acero aproximado para compras: necesito la tabla kg/m de pilares (TX…) y vigas (TC70 … 2BTC150) del cotizador. Mientras tanto dice "lo entrega tu ejecutivo con la cotización".
7. Pallets por producto del paso 1 a número: uso pocos = 5 productos, 10 a 50 = 30, más de 50 = 60 y 1–2 = 2, 3–5 = 4, 6–10 = 8, más de 10 = 15 pallets por producto (el cliente lo ve y lo puede cambiar). ¿Te sirven esos valores?

## Correcciones 22-10-2026 (verificadas en el navegador, pegadas en el chat)
Pruebas: `bash tests/flujo/correr.sh` (nueva `prueba-bloques-previa.mjs`) + recorridos Playwright en 1400 y 390 px.

| # | Corrección | Estado |
|---|---|---|
| 1 | Paso 3: el sistema que se configura es el protagonista; otro sistema solo como "Sugerencia" plegada ("Con drive-in guardarías 49 % más pallets en el mismo piso — Ver comparación", "Cambiar a drive-in"); si coincide, "✓ es lo que recomendamos". Probado RS, DI y AR | ✅ |
| 2 | Canillera = perfil plegado en U, rojo, 120 mm (pilar 100), 500/1.000 mm, apernada, orientada al pasillo (card, 2D, 3D) · Protección de bastidor = arco de tubo con placas base · Baranda = tubo circular 1 m con placas base; card con resumen "56 m — módulos y ajustes los confirma Técnica Racklog" y desglose plegado · Separador sin interruptor ("Incluido: 28 separadores…", no se puede quitar) · Placa de capacidad eliminada | ✅ (medidas del arco 400 mm y tubo 76 mm por confirmar) |
| 3 | Panel de propiedades a la derecha del plano (rack, pilar, pasillo, portón, andén, muro), alto del plano, acciones al pie siempre visibles; en celular bajo el plano con alto acotado | ✅ |
| 4 | 3D: encuadre real a las 8 esquinas de la bodega (deja libre la franja de botones) al entrar, "Centrar vista", "Planta" (cenital) e "Isométrica"; accesorios del paso 4 aplicados en el 3D | ✅ |
| 5 | Plano 2D de alto fijo según pantalla, siempre toda la bodega; vuelve solo al soltar la selección; "Ajustar a la bodega" con zoom; accesorios a escala real con mínimo legible e interruptor "Accesorios" | ✅ |
| 6 | Repetir en bloque con vista previa punteada y motivo en rojo ("3 por muro y 1 por otro rack"); pasillos en serie (cantidad, separación, "Alinear con tus filas"); cobertura "Con estos cuerpos cubres X de tus Y pallets — te faltan/sobran N cuerpos" y por producto con sus niveles | ✅ |
| 7 | Forma de bodega: Rectángulo, En L, En T, Libre; esquinas arrastrables; muro → largo, + esquina, quitar esquina; racks se reubican dentro; 3D con la forma | ✅ |
| 8 | "Hoy vs propuesta": se dibuja el layout de hoy (aparte, no se cotiza), Hoy/Propuesta en el plano, tabla posiciones / m² ocupados / posiciones cada 100 m² y % de mejora; alimenta "hoy vs Racklog" de gerencia | ✅ |
| 9 | Configuraciones mixtas: modelos A, B… del paso 3 ("Selectivo B"), color y letra por modelo en el plano, asignar configuración por rack desde el panel (sin reubicar todo), cobertura por producto al reasignar, paso 7 cotiza por configuración | ✅ |

## Modelador web de la intranet (22-10-2026, `docs/modelador-web.zip`)
La web tiene muchas menos entradas que el cotizador de los vendedores: se tomó del zip solo lo que aplica y se
mantuvo lo que el dueño ya confirmó. Pruebas: `prueba-intranet.mjs` (2 nuevas) + recorrido Playwright pasos 3 y 5 (2D y 3D).

| Tema | Decisión | Estado |
|---|---|---|
| Selectivo: cuerpos de **eje a eje de pilar** (viga 2.300 = paso entre cuerpos; pallets entre las caras, 2.200) | Del zip (dueño 22-10). Huella = cuerpos × viga + 100. 3D, planta, elevación, flota y marcos de accesorios al día | ✅ |
| Selectivo: pallet a piso, vigas en la perforación de 76,2 mm, sobrante 300–1.000, separador de doble 300 | Se mantiene (dueño 21-10); el zip usa 1.ª viga a 250, sobrante 200 y 81 + 200 | ✅ sin cambio |
| Drive-in: fondos estándar v2 (2.050 … 15.700) | Se mantiene (dueño 19-10); el zip trae los v1 | ✅ sin cambio |
| Ángulo ranurado: frente 900/920 (930 no existe en el cotizador), fondo 300/400/460/600, 2–8 repisas, altura cada 20 mm hasta 3 m, +4 mm de ángulo por cuerpo (920 → 924), bandejas repartidas como la intranet (40/520/1.000/1.480/1.960) | Del zip. Con la caja, el ángulo justo en la grilla de 20 mm; si pasa de 3 m esas repisas no se ofrecen | ✅ |
| Pasillos por equipo (zip: retráctil 2,9, contrabalanceada 3,8) | Sin cambio: siguen los provisorios de `parametrosTecnicos.js` hasta que Técnica confirme | ⬜ pregunta |

## Revisión del flujo completo (22-10-2026, tarde)
Pruebas: `bash tests/flujo/correr.sh` (nuevas: prueba-auditoria, prueba-angulo-cajas, prueba-tunel-rack, prueba-accesorios-manuales) + recorridos Playwright 1400 y 390 px.

| Pedido del dueño | Estado |
|---|---|
| Pantallas blancas al cargar | ✅ esqueleto con forma del paso (stepper, dibujo, tarjetas) con brillo y entrada en cascada; 3D con "Armando tu bodega en 3D…" hasta el primer cuadro. Causa de una pantalla blanca al avanzar: comentario HTML en la raíz de un paso (fragmento en dev rompe la Transition) → corregido en PasoPallets, PasoAccesorios, Registro y Compartido |
| Ángulo ranurado: cubicación de cajas clara | ✅ bandeja en 3D con las cajas (a × b × c, kg de 250), cajas dibujadas en cada repisa (frente y planta); propuesta de menos piso (60×40×30, 500 cajas: 100 → 25 cuerpos); KPI en cajas |
| Pallet del paso 2 claro | ✅ 3D grande fijo a la izquierda en escritorio, pasos 1–4 numerados, resumen "4 por cama × 5 camas = 20 cajas" |
| Humanos "lego" | ✅ anatomía con articulaciones (rodilla, codo), cara, EPP; caminata natural |
| Selectivo doble = rombo | ✅ diagonales en espejo y separadores de bastidor a la vista (3D y lateral) |
| Accesorios en el 3D y arrastrables | ✅ paso 4 con 3D + paleta (canillera, protección, baranda) que se pega al lugar válido; manuales suman en lo que se cotiza; quitar con un toque. ⬜ arrastre en el 3D del paso 5 |
| Peatonal y grúa fáciles de dibujar | ✅ trazo arrastrando con ajuste a muros/racks, plantillas de un toque, grúa arrastrable y girable con su radio |
| Recorrido de la grúa y vigas de túnel | ✅ recorrido dibujado en 2D; pasillos sin acceso en rojo; túnel sugerido y aplicable por rack (alto según quién pasa); viga de túnel en 2D/3D/cotización. Llenar mi bodega deja pasillo de cabecera (la grúa llega a todos los pasillos) |
| KPI: ¿el dibujo cumple con pallets y cantidades? | ✅ auditoría en Revisa (`lib/flujo/auditoria.js`): frente/fondo/alto/peso por producto, posiciones por producto y total, plano = cotización, pasillos y alcance. Cobertura descuenta el túnel |
| Información compacta | ✅ pasos 2 y 3 (una tarjeta con secciones), controles de 40 px con mouse (44 con dedo), ayuda como píldora chica |
| El cliente se lleva solo el link | ✅ sin PDF, imagen, logo ni especificación; "Copiar link" y "Compartir"; a Kommo va solo el plano PNG para el ejecutivo |

Preguntas abiertas nuevas:
8. Ángulo ranurado: ¿la propuesta debe quedar a altura de mano (≤ 1,9 m) aunque use más cuerpos? Hoy minimiza piso y puede pedir escalera.
9. Alturas de túnel por quién pasa (2,2 / 2,5 / 3,5 / 4,5 m) y que la grúa cruce solo con ≥ 3,5 m: provisorio, confirmar con Técnica.

### Demanda y layout a gusto del cliente (22-10-2026)
| Pedido | Estado |
|---|---|
| Cuántos módulos necesita para su demanda, siempre a la vista | ✅ barra sobre el plano: "Tu demanda: N pallets → M cuerpos · en el plano: X cuerpos, Y posiciones" (verde si cubre, ámbar con "faltan N") |
| Mover los racks al layout que quiere el cliente sin perder la demanda | ✅ mover, girar, duplicar, quitar (ya estaban) + largo de la fila (cuerpos), "Partir en dos tramos" y "Ubicar los que faltan" (primero alarga sus filas, después filas nuevas; nada de lo puesto se mueve). `prueba-rearmar.mjs` |

### La grúa limita la altura del rack: altura y peso (22-10-2026)
| Pedido | Estado |
|---|---|
| Capacidad de la grúa en altura y en peso | ✅ curva de capacidad residual por equipo (`GRUAS.*.kg/curva`, `equipoDe`, `capacidadEnAltura` en parametrosTecnicos.js; típicos PROVISORIOS); el cliente puede poner su placa (m y kg) en el paso 3 y la curva se escala. Paso 3 no ofrece niveles que la grúa no levanta por peso; revisión bloquea (`pesoGrua`) con arreglo; auditoría con "Peso que levanta la grúa arriba". `prueba-grua-peso.mjs` |
