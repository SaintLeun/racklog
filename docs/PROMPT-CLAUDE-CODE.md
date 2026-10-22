# Prompt para Claude Code — Tour logístico + Planificador Racklog como landing de conversión

> Pega todo este documento en Claude Code, con el repo `racklog` (Nuxt 3 + Tailwind 4 + three.js) abierto.
> Adjunta también `tour-planificador.patch`.

---

## 0. Contexto

Racklog fabrica racks industriales en Quilicura, Chile: rack selectivo, drive-in y ángulo ranurado. Trabaja con NCh2369 (sísmica) y ANSI MH16.1. No publica precios, fletes ni plazos.

Vamos a convertir `/tour` (asesoría guiada) y `/planificador` (dibujo 2D/3D de la bodega) en **una landing propia** para promocionar en LinkedIn, Facebook e Instagram. El objetivo único de la página es **que el visitante pida su cotización**. La promesa es: *"Nuestro equipo comercial te envía la cotización en **máximo 24 horas**"*. Usar siempre esa frase ("máximo 24 horas"), nunca "24 horas hábiles", en todos los textos, botones, correos y anuncios.

Hay tres públicos, y cada uno debe sentir que la herramienta le habla a él:

| Rol | Lo que busca | Lo que debe ver primero |
|---|---|---|
| Supply chain / gerencia | Capacidad, crecimiento, retorno | Posiciones hoy vs 1 y 2 años, m², etapas |
| Jefe de bodega / logística | ¿Caben? ¿Opera la grúa? | Posiciones a crecer, cuerpos, niveles, pasillos |
| Compras / dueño | Especificación para comparar | Lista "qué cotizar" (cuerpos, marcos, vigas, carga) |

Reglas de trabajo:
- **Todo paso a paso**: una decisión por pantalla y nada queda al azar.
- Textos en español de Chile, cortos y sin tecnicismos. Si hace falta un término técnico, se explica con un `?`.
- Mobile-first: la mayoría del tráfico viene de redes en celular.
- No citar ni mostrar el libro de Frazelle. Su lógica se usa solo internamente.
- **Todo lo que la herramienta muestre debe ser fabricable y montable.** Vamos a prometer mucho con esta página: si el cliente arma algo, tiene que existir. Lo inviable no se puede elegir y, si llega a pasar, se explica cómo arreglarlo (ver §2.4).
- **El cliente tiene que terminar contento y sin flojera.** Cotizar debe ser rápido y sencillo: pocos datos por pantalla, valores por defecto inteligentes, se puede saltar lo que no sabe ("no sé, usen lo típico") y el avance se guarda solo.

---

## 1. Aplicar lo que ya está hecho

```bash
git checkout -b landing-tour-planificador
git am tour-planificador.patch
npm install && npm run dev
```

El patch trae (revísalo antes de seguir):

**Tour (`pages/tour.vue`, `lib/tour/reglas.js`, `lib/tour/pallet.js`, `components/tour/ArmaPallet.vue`)**
- Registro obligatorio: nombre, empresa, RUT (módulo 11; RUT < 50.000.000 → flag `persona_natural_con_giro`), correo de empresa o Gmail (rechaza Hotmail/Outlook/Yahoo y desechables), celular, rol e industria.
- "¿Sabes qué cotizar?":
  - **Sí** → 3 tarjetas (Selectivo, Drive-in, Ángulo ranurado).
  - **No** → hasta 9 preguntas, una por pantalla, con tip "¿por qué te preguntamos esto?". Motor `recomendar()` con estas reglas:
    - Cajas a mano y ≤ 300 kg por repisa → ángulo ranurado.
    - 1–2 pallets por SKU → selectivo.
    - ≥ 6 pallets por SKU, rotación baja o media, sin FIFO estricto, con grúa (no apilador manual) y pocos SKU → drive-in.
    - Si no se cumple lo anterior → selectivo, con alternativa y flag `revisar_asesor`.
- "Arma tu pallet": caja → pallet. Prueba 2 orientaciones y limita por cuánto aguanta la caja apilada o por 1,8 m de alto.
- Demanda por importación: contenedor 20'/40'/40'HC, cuántos llegan, cada cuánto y cuánto tarda en salir. Calcula cuántas llegadas conviven en bodega y suma margen y crecimiento anual.
- Resultado "posiciones a crecer" con tres vistas por rol: supply, bodega, compras.
- Barra fija "Tu cotización en máximo 24 horas · Cotizar ahora". Abre `ContactModal` con los datos del registro precargados (prop nueva `prefill`) y el resumen del tour.

**Planificador (`pages/planificador.vue`, `components/planificador/*`, `lib/rack3d/*`)**
- Racks "Ya lo tengo" (gris punteado) vs "Nuevo (a cotizar)". Tabla de KPI por sistema (`lib/rack3d/kpis.js`) con columnas ya tienes / nuevo / total. Solo lo nuevo se cotiza.
- **Drive-in**: el cliente mide su grúa (A techo protector, B mástil bajado, C ancho).
  - Primer nivel = máx(alto pallet + 0,10; máx(A, B) + 0,15).
  - Ancho de calle = máx(pallet + 2×0,075; C + 0,20) + 0,10 de pilar.
- **Selectivo**:
  - 1, 2 o 3 pallets por nivel. Viga = n·frente + (n+1)·0,10. Perfil 100 mm (120 mm con 3 pallets, provisorio).
  - Cuerpo túnel con paso libre de 2,2 / 2,5 / 3,5 / 4,5 m. Quita las alturas de ese cuerpo y usa viga más gruesa.
  - Sobrante de marco ajustable: alto marco = última viga + sobrante, **entre 300 y 1.000 mm** (más de 1.000 es irreal). Si la carga sobresale del marco, se avisa, y el chequeo de techo usa la punta de la carga.
  - Planos de carga por nivel: malla, madera o bandeja metálica.
  - **Pallets mezclados**: catálogo "Tus pallets" con nombre, alto, peso, cantidad, rotación, sin pallet y sobresale. Cada nivel de cada rack se asigna a un tipo y la viga se ajusta sola. Botones "Aplicar a todos" y "Acomodar solo" (zona de oro: lo que rota más va en los niveles bajos; lo alto y lento, arriba o al piso). Contador "X de Y ubicados".
- **Elementos**:
  - Grilla de pilares por distancia entre ejes X/Y, con offset y medida en cm.
  - Cotas azules a muros y al vecino, y posición editable desde los muros.
  - Oficina (muros y puerta), andén (nivelador y franja), portón, zona.
  - **Pasillo de grúa**, **pasillo peatonal** y **grúas** por tipo (varias; no bloquean racks).
- **3D (en progreso)**: `lib/rack3d/equipos.js` con grúas y personas más detalladas, cámara con inercia y botón "Centrar vista". Revisar y terminar (ver §4).

---

## 2. La landing (nuevo): `/planifica-tu-bodega`

Página independiente, sin el menú completo del sitio: logo, un link "Ver productos" y un botón "Cotizar". Pensada para recibir tráfico pagado y orgánico de redes.

### 2.1 Estructura, en este orden

1. **Hero**
   - Título: "Diseña tu bodega en 5 minutos y recibe tu cotización en máximo 24 horas".
   - Bajada de una línea: gratis, sin instalar nada, un ingeniero revisa tu diseño.
   - CTA primario "Empezar gratis" (va al paso 1 del flujo). CTA secundario "Hablar por WhatsApp".
   - A la derecha (abajo en celular): video o loop en bucle de 6–10 s del planificador 3D. Es un `<video muted autoplay playsinline loop>` con poster, no el canvas real, para cargar rápido.
2. **Barra de confianza**: años en el mercado, proyectos instalados, logos de clientes (con permiso), "Diseño sísmico NCh2369".
3. **Cómo funciona en 3 pasos**, con íconos: Dibuja tu bodega → Arma tus pallets → Recibe tu cotización en máximo 24 h.
4. **Elige tu camino** (tarjetas por rol): "Soy supply chain", "Soy jefe de bodega", "Soy compras / dueño". Cada una abre el flujo con `?rol=` y precarga el rol en el registro.
5. **Demo interactiva liviana**: un mini configurador (alto de pallet + cantidad → posiciones y cuerpos) que muestra valor **antes** del registro.
6. **Casos** (2–3): problema → solución → número. Ejemplo: "+38 % posiciones en la misma bodega".
7. **FAQ**: ¿tiene costo?, ¿qué datos necesito?, ¿en cuánto tiempo responden?, ¿instalan en regiones?, ¿cumplen norma sísmica?
8. **CTA final** a pantalla completa con el mismo botón.

Además:
- Barra CTA fija (`components/CtaCotizacion24.vue`), visible después del hero en toda la landing, el tour y el planificador.
- **El registro se pide cuando el cliente ya vio valor**, no al entrar. Puede responder el tour y ver la recomendación; el registro aparece antes de mostrar el resultado detallado ("posiciones a crecer", plano, PDF). Medir con A/B contra registro al inicio (ver §5).

### 2.2 Flujo unificado, paso a paso (stepper global)

Un solo flujo con barra de progreso y 6 pasos con nombre visible:

```
1 Tu operación (tour) → 2 Tus pallets → 3 Arma tu rack → 4 Accesorios y seguridad → 5 Tu bodega (dibujo) → 6 Revisa (KPI + 3D) → 7 Cotiza (máx. 24 h)
```

**Primero se define el rack y después se dibuja la bodega.** El cliente llega al plano con "su" rack ya armado. El plano solo lo ubica y repite; no se diseña el rack sobre el plano.

- Cada paso tiene un objetivo, una acción principal y "Atrás".
- No se avanza con datos inválidos; el error se explica en línea.
- El estado se guarda (localStorage + id de sesión) y el link "Continuar donde quedé" llega al correo.
- Los pallets definidos en el tour (paso 2) **pasan al planificador** como el catálogo "Tus pallets", y el sistema recomendado queda preseleccionado. Hoy el tour solo manda `?rack=XX`; reemplazarlo por estado compartido (Pinia store `useProyecto`).
- En el planificador, mostrar solo el panel del paso actual (no todo el sidebar a la vez). El resto queda en "Opciones avanzadas".

### 2.3 Paso 3 y 4 — Arma tu rack y sus accesorios (nuevo, prioridad alta)

**Paso 3 · Arma tu rack** (por cada "modelo de rack" que el cliente quiera; puede tener varios):

1. **Sistema**: viene recomendado del tour, y se puede cambiar.
2. **Tipologías de pallet y cantidades**: cuántos pallets de cada tipo van en este modelo (sale del paso 2). Ej.: "120 de 1,2 m + 40 de 1,7 m".
3. **Configuración del módulo**:
   - Pallets por nivel (1, 2 o 3).
   - Simple o doble.
   - Niveles, con el tipo de pallet en cada nivel. Opción "Acomodar solo".
   - Sobrante de marco, entre 300 y 1.000 mm.
   - Cuerpo túnel, si se necesita paso.
4. **Resultado inmediato** en una tarjeta:
   - Dibujo frontal del módulo con medidas: alto de marco, distancia entre vigas, largo de viga.
   - Posiciones por cuerpo.
   - **Cuántos cuerpos necesita para sus cantidades.**
   - Carga por par de vigas, con semáforo.

**Paso 4 · Accesorios y seguridad**: el sistema propone lo necesario y el cliente acepta, quita o agrega. Cada accesorio tiene foto, una línea de "para qué sirve" y cantidad calculada.

| Accesorio | Regla de cantidad / medida | ¿Cuándo se propone solo? |
|---|---|---|
| **Canilleras** (protector de pie de pilar) | 1 por cada pilar que da a un pasillo de grúa. Ambos pilares del marco de cabecera, y cada pilar del lado de pasillo | Siempre que el equipo sea grúa o apilador. Obligatorias en cabeceras, túneles y cruces |
| **Protección de bastidor** (de cabecera) | 1 por cada extremo de fila que da a un pasillo o cruce. **Mide lo mismo que el fondo del marco: marco simple = 1.000 mm, marco doble (espalda con espalda) = 2.300 mm** | Siempre en cabeceras expuestas al tránsito de grúa. No va si la cabecera está contra un muro |
| **Barandas de protección** | Delimitan pasillos peatonales: tramos a ambos lados del pasillo, con aberturas en cruces y puertas. Metros = largo del pasillo × 2 − aberturas, redondeado a módulos de baranda | Cuando el cliente dibuja un pasillo peatonal, o cuando hay oficina, baño o andén con circulación de personas junto a pasillos de grúa |
| **Planos de carga** (malla / madera / bandeja) | 1 por cuerpo y nivel marcado, por fila | Si un tipo de pallet es "cajas sin pallet" o "sobresale" |
| Separadores de fila (espalda con espalda) | 2 por marco en rack doble, según altura | Siempre en rack doble |
| Topes / travesaños de apoyo | 2 por posición, si el pallet no apoya bien en las vigas o va de lado | Si el fondo del pallet no calza con el marco |
| Placa de capacidad (letrero de carga) | 1 por fila | Siempre (exigencia ANSI MH16.1) |
| Malla anticaída (posterior) | m² del fondo de la fila | Si la fila da a un pasillo peatonal o zona de trabajo por detrás |

- En 2D, los accesorios se ven: canilleras como un punto amarillo en el pilar, protección de bastidor como una barra amarilla y negra en la cabecera, baranda como línea amarilla gruesa. En 3D se modelan.
- Todo va a la cotización como lista de materiales: "28 canilleras · 6 protecciones de bastidor de 2.300 mm · 42 m de baranda…".
- Las medidas de canilleras, barandas y separadores se toman del catálogo Racklog. Dejarlas en `lib/rack3d/accesorios.js` como provisorias hasta que Racklog las confirme.

### 2.4 Motor de viabilidad (nada inviable)

Crear `lib/rack3d/viabilidad.js`. Revisa el diseño completo en cada cambio y devuelve una lista de `{ nivel: 'bloquea' | 'advierte', mensaje, comoArreglar, idsAfectados }`.

- Lo que **bloquea** no deja avanzar al paso de cotizar.
- El aviso dice qué pasa y trae un botón que lo arregla (por ejemplo "Bajar a 4 niveles" o "Ensanchar pasillo a 3,5 m").
- Los controles nunca ofrecen valores fuera de rango.

Reglas mínimas (los valores son provisorios y se confirman con Técnica Racklog, NCh2369 y ANSI MH16.1):

| Regla | Nivel |
|---|---|
| Sobrante de marco entre 300 y 1.000 mm | Bloquea (no se puede elegir fuera) |
| Punta de la carga + 0,5 m ≤ altura libre de la bodega | Bloquea |
| Altura de la última viga ≤ alcance del equipo | Bloquea |
| Pasillo entre racks ≥ pasillo mínimo del equipo | Bloquea |
| Carga por par de vigas ≤ capacidad del perfil; si no, se propone perfil reforzado | Advierte → propone |
| Peso por marco ≤ capacidad del marco | Bloquea |
| Esbeltez: alto de marco / fondo de marco ≤ 6 en rack simple (si no, rack doble o anclaje especial) | Advierte |
| Drive-in: primer nivel ≥ grúa medida (A/B) + 0,15 m; ancho de calle ≥ grúa + 0,20 m; un solo alto de pallet por bloque | Bloquea |
| Túnel: paso libre ≥ alto del equipo o persona que pasa | Bloquea |
| Rack sobre pilar, pasillo, zona, portón o andén | Bloquea |
| Distancia rack–muro ≥ 0,10 m; rack–pilar ≥ 0,10 m | Bloquea |
| Pasillo peatonal ≥ 1,2 m, con baranda cuando es paralelo a un pasillo de grúa | Advierte |
| Pallet que sobresale o cajas sin pallet sin plano de carga | Bloquea (se agrega solo) |
| Cabecera expuesta sin protección de bastidor, o pilar de pasillo sin canillera | Advierte (se agrega solo) |
| Ángulo ranurado: kg por bandeja ≤ 250; repisa superior > 1,9 m → aviso de escalera | Bloquea / advierte |

Un panel "Revisión del diseño" muestra el resumen con semáforo. El cliente ve **"Tu diseño es viable ✓"** antes del botón de cotizar. Ese mensaje es parte de la promesa.

### 2.5 Experiencia: que no abandone

- **Máximo 3–5 opciones por pantalla.** Si hay más, va a "Más opciones" plegado. Nunca muestres todas las paletas de opciones juntas.
- **Tipografía con aire**: cuerpo 16 px en celular, interlineado 1,5, títulos de paso 22–24 px, 16–24 px de separación entre bloques, botones de al menos 44 px de alto. Nada apretado ni en 11 px salvo notas.
- Cada paso indica **cuánto falta** ("Paso 3 de 7 · ~1 min") y tiene **un solo botón principal**.
- **Valores por defecto inteligentes**, para que el cliente pueda avanzar con "Siguiente" sin tocar nada: pallet 1,2 × 1,0 m, grúa contrapeso, sobrante 300 mm, accesorios propuestos.
- "No sé" siempre disponible: usa el valor típico y queda marcado para que el ejecutivo lo confirme.
- Autoguardado y "Continuar donde quedé" por correo.
- Si el cliente lleva más de 60 s sin avanzar en un paso, ofrecer ayuda por WhatsApp de forma no intrusiva.
- Meta: **cotización enviada en menos de 5 minutos** desde el primer clic. Medir el tiempo por paso con eventos y atacar el paso con más abandono.

---

## 3. Estilo visual y movimiento ("más pro")

Sistema de diseño existente: Inter, neutros cálidos, naranjo de marca `brand-*` (ver `assets/css/main.css`).

**Movimiento**
- Transición entre pasos: fade + desplazamiento de 8–12 px, 200–250 ms, `cubic-bezier(.2,.8,.2,1)`.
- Barra de progreso animada.
- Los números que cambian (posiciones, cuerpos, m²) se animan contando, ~400 ms.
- Al asignar un pallet a un nivel, la viga "sube o baja" animada en la elevación y en el 3D.
- Feedback inmediato en botones (estado presionado; `scale(.98)`), y skeletons al cargar el 3D.
- Respetar `prefers-reduced-motion`: sin animaciones de desplazamiento ni conteo.

**Visual**
- Más aire y jerarquía: una idea por tarjeta, títulos 20–24 px, cuerpo 15–16 px.
- Íconos de línea consistentes (un set).
- Ilustraciones SVG propias: pallet, grúa con cotas A/B/C, corte de rack. Nada de clipart.
- Resultado del tour como "ficha" descargable y compartible (imagen OG generada) con el logo Racklog.

**3D (terminar lo que trae el patch)**
- Cámara con inercia (OrbitControls con damping), zoom al cursor y transición animada a "Centrar vista".
- Render bajo demanda que sigue mientras hay inercia. DPR máximo 1,75. Reutilizar geometrías y materiales y liberar (`dispose`) al reconstruir.
- Calidad: ACES tone mapping, salida sRGB, sombras PCFSoft, luz hemisférica + direccional, piso de hormigón claro con grilla tenue.
- **Grúas y personas sin aspecto "Lego"**:
  - Grúas con carrocería redondeada (RoundedBox o Extrude con bisel), neumáticos con llanta, techo protector tubular, mástil en canales, horquillas en cuña y PBR amarillo seguridad. Varían por tipo (transpaleta, apiladora, contrapeso, retráctil).
  - Persona tipo maniquí de 1,75 m (CapsuleGeometry), con chaleco reflectante y casco.
- Selectivo en 3D: alto de carga por nivel (`m.altosCarga`, `m.coloresCarga`), 1–3 pallets por viga (`m.palletsPorViga`), perfil `m.altoViga`, cuerpo túnel (`m.tunel`), planos de carga (`m.planos`: malla con textura de alambre, madera, metal) y marco a `m.alto` con la carga que puede sobresalir.
- Accesorios en 3D: canilleras amarillas en la base de los pilares, protección de bastidor amarilla/negra en cabeceras (largo = fondo del marco), barandas amarillas de tubo en pasillos peatonales, separadores, planos de carga.
- Elementos: oficina con muros, puerta y ventanas; andén elevado de 1,2 m con nivelador y franja amarilla/negra; portón seccional; pilar de hormigón; pasillos como demarcación de piso.
- Rendimiento objetivo: 50+ fps con 30 racks en un notebook medio; carga inicial del 3D < 2 s en 4G (code-split de three.js).

---

## 4. Pendientes funcionales

1. **Ángulo ranurado con cajas**:
   - El cliente modela cajas (zapatillas, pernos, amortiguadores) en repisas, simples o dobles.
   - Calcula cajas por repisa (con orientación) y kg contra 250 kg por bandeja.
   - Altura entre repisas según la caja.
   - Pasillo según el carro de carga (ancho del carro + 0,3 m) y alcance del operario: repisa superior útil ≤ 1,9 m sin escalera, con aviso si hay que usar escalera.
2. **Drive-in**: una sola altura de pallet por bloque (la del tipo asignado), con aviso si el cliente intenta mezclar.
3. **Viga y marco por carga**: tabla de perfiles de Racklog (pendiente que Racklog la entregue). Con ella: carga del nivel → perfil de viga, y carga del marco → perfil de pilar → medida real del pilar (hoy 100 × 105 mm) → largo exacto de fila.
4. **Exportables**: PDF con plano, 3D, tabla "qué cotizar" y KPI por rol; link único al diseño con registro de aperturas en Kommo.

---

## 5. Conversión y medición

**Eventos** (GA4 + Meta Pixel + LinkedIn Insight Tag, solo con consentimiento; ya existe `useConsent`):

`landing_view` · `cta_click{ubicacion}` · `tour_start` · `tour_step{n}` · `registro_ok{rol,industria}` · `recomendacion{sistema}` · `pallet_armado` · `planner_open` · `rack_add{tipo}` · `kpi_view` · `quote_open` · `quote_sent` (conversión principal) · `pdf_download` · `whatsapp_click`

**Atribución**
- Guardar `utm_source/medium/campaign/content` y `fbclid/li_fat_id` al entrar.
- Enviarlos con el lead a Kommo, junto con la etiqueta `tour-logistico`, rol, industria, flags y puntaje del lead.

**A/B listos para activar**
- Registro al inicio vs registro antes del resultado.
- Título del hero: "5 minutos" vs "sin costo".
- Color o texto del CTA: "Cotizar ahora" vs "Recibir mi cotización en máximo 24 h".

**Embudo objetivo** (a validar con datos):

| Tramo | Meta |
|---|---|
| Landing → inicio de flujo | 35 % |
| Inicio → registro | 50 % |
| Registro → cotización | 25 % |

**SEO y social**
- `usePageSeo` con OG image propia (1200×630) y texto específico por red.
- `noindex` en variantes A/B.

**Rendimiento**: LCP < 2,5 s en 4G, CLS < 0,1. Imágenes WebP/AVIF con `srcset`; three.js solo se carga al entrar al paso 3.

---

## 6. Criterios de aceptación

- [ ] Recorrer el flujo completo en celular (390 px) sin scroll horizontal y con el CTA siempre a mano.
- [ ] Caso CASATEC (bodega 5×10×5 m, apilador manual, 4 lotes de 29/16/46/18 pallets, cajas que no se apilan) → recomienda **selectivo**. Debe mostrar drive-in como alternativa calculada y el `revisar_asesor` correspondiente.
- [ ] Caso importación: 3 × 40' cada 2 meses, caja 60×40×30 cm de 20 kg que apila 5, 40 posiciones actuales, 10 % de margen, 20 % de crecimiento → 1.500 cajas, 75 pallets, 83 posiciones hoy, 43 a crecer.
- [ ] Pallets mezclados: 180 de 1,2 m que rotan harto y 50 de 1,7 m que rotan poco, en 3 selectivos de 6 cuerpos y 3 niveles, doble → "Acomodar solo" deja 1,2 m en piso y niveles 1–2, y 1,7 m en el nivel 3.
- [ ] Sobrante de marco: siempre entre 300 y 1.000 mm. El chequeo de techo usa la punta de la carga.
- [ ] Rack doble de 3 filas con cabeceras a pasillo → propone 6 protecciones de bastidor de 2.300 mm y canilleras en todos los pilares de pasillo. Rack simple → protecciones de 1.000 mm.
- [ ] Pasillo peatonal de 20 m dibujado → propone barandas a ambos lados con sus aberturas, y aparecen en 2D, 3D y en la cotización.
- [ ] Ningún diseño con un aviso "bloquea" puede enviarse. Cada aviso tiene un botón que lo arregla.
- [ ] Un usuario nuevo completa el flujo con los valores por defecto en menos de 5 minutos, en celular.
- [ ] Cada `quote_sent` crea en Kommo una tarea con vencimiento a 24 h para el vendedor asignado, para cumplir la promesa.
- [ ] `quote_sent` llega a Kommo con UTM, rol, resumen y plano adjunto.
- [ ] Sin errores en consola; `npx nuxi typecheck` limpio.
- [ ] Lighthouse móvil ≥ 85 en rendimiento y ≥ 95 en accesibilidad para la landing.

---

## 7. Valores provisorios que Racklog debe confirmar

Están en `lib/rack3d/parametrosTecnicos.js`, `lib/tour/pallet.js` y `lib/rack3d/medidas.js`. Hasta confirmarlos, mostrar "referencial" en la interfaz.

| Valor | Hoy |
|---|---|
| Alcance apilador manual | 3,0 m |
| Holgura carga → viga | 200 mm |
| Capacidad par de vigas | 2.000 kg |
| Bandeja ángulo ranurado | 250 kg (confirmado) |
| Holgura techo | 0,5 m |
| Holgura sobre grúa en drive-in | 150 mm |
| Perfil viga 2 / 3 pallets | 100 / 120 mm |
| Pilar selectivo | 100 × 105 mm |
| Contenedores (medida interior / carga útil) | 20': 5,90 × 2,35 × 2,39 m / 28.000 kg · 40': 12,03 × 2,35 × 2,39 m / 26.500 kg · 40'HC: 2,69 m de alto |
| Marcos | Filas de hasta 10 cuerpos |
| Sobrante de marco | 300 a 1.000 mm |
| Protección de bastidor | Marco simple 1.000 mm · marco doble 2.300 mm |
| Canilleras, barandas, separadores, malla anticaída | Medidas y módulos del catálogo Racklog (por confirmar) |
| Esbeltez máxima marco simple | Alto / fondo ≤ 6 (por confirmar con cálculo sísmico) |
| Pasillo peatonal mínimo | 1,2 m |
