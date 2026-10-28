# Avance: autollenado, asistente (robot) y barreras (27-10)

Rama `landing-tour-planificador`, sin subir a producción. `npx nuxt typecheck` sale limpio y las 34 pruebas de `node tests/flujo/<archivo>.mjs "$PWD"` pasan. Hay una prueba nueva: `prueba-autollenado.mjs`.

## 1. Barreras de protección (regresión)
- **Qué pasó:** al acortar las tarjetas del paso 6 se borró la fila "También puedes arrastrar al 3D", donde aparecía la baranda cuando no había pasillo peatonal. La baranda solo quedaba en la paleta chica al pie del 3D.
- **Arreglo:** volvió como tarjeta "Baranda de protección", con el motivo por el que no se propuso y el botón "+ Arrastrar al 3D". Igual para canilleras y protección de bastidor si no salieron. Está en `components/flujo/PasoAccesorios.vue` (bloque `faltantes`).

## 2. Autollenado ("Proponme un layout")
**Reglas que respeta:** pasillo de trabajo según la grúa (su radio de giro), pasillo de cabecera del mismo ancho, doble nunca contra el muro, simples perimetrales de espalda al muro y pilares dentro del rack (pierde solo esas posiciones). También pilares, oficinas, andenes y zonas nunca en un pasillo, sin choques y sin pasillos sin salida.

**Cómo elige:** prueba hasta 8 formas y se queda con la válida que más guarda:
- filas a lo ancho o a lo largo;
- con o sin simples perimetrales (en drive-in: bloques enfrentados compartiendo pasillo);
- cabecera de un lado u otro.

Archivo: `lib/flujo/autollenado.js`.

**Opciones en el paso 5:**
- Toda la bodega o solo un área: el cliente arrastra un rectángulo en el plano y lo de fuera no se toca.
- Con qué rack, si tiene varios modelos.
- Filas: la mejor, a lo ancho o a lo largo.
- Si hay racks puestos, pide confirmación; se puede deshacer.

**Corrección al algoritmo base** (`lib/flujo/calculos.js` `ubicarDesdeArriba`): antes solo esquivaba los pilares en los pasillos. Ahora, si una oficina, andén o zona cae en el pasillo de una fila, corta ese tramo del rack en vez de dejar el pasillo angosto.

**Resultado en bodegas de prueba** (todas cumplen las reglas):

| Bodega | Antes | Ahora |
|---|---|---|
| 24×36 libre, selectivo doble | 640 | 784 (+22 %) |
| 30×45 con pilares cada 6 m | 936 | 1.108 (+18 %) |
| 40×25 oficina + portón, retráctil | 768 *(con un pasillo angosto)* | 848 (válido) |
| 30×40 drive-in | 1.020 | 1.080 (+6 %) |

## 3. Asistente (el robot de Racklog)
- **Poses:** 15, recortadas con fondo transparente y guardadas en `public/assets/images/guia/`. Hoy vienen de `lib/tour/AVATAR RACKLOG.png` (ver sección 4); reemplazaron a las del robot anterior.
- **Componente:** `components/flujo/Asistente.vue`, montado en `pages/planifica-tu-bodega/disena.vue`. Es un botón con su cara en la esquina que el cliente abre cuando quiere.
  - La primera vez saluda y si lleva un rato sin avanzar ofrece ayuda (reemplaza la píldora de WhatsApp, que ahora va dentro del panel).
  - Primero muestra los avisos de su diseño y después el tutorial del paso, tema por tema.
- **Contenido:** `lib/flujo/asistente.js`, sacado de las mismas reglas y números del planificador.
  - **Tutorial:**
    - Qué sistema conviene.
    - Cómo medir la altura libre y el pallet (frente, fondo, alto con tarima, peso cargado).
    - Por qué la viga mide eso (n × frente + (n + 1) × 100 mm) y el fondo del marco (fondo del pallet − 200 mm).
    - Más alto, menos peso, y viga a piso para apiladores y retráctil (las patas entran bajo el rack).
    - Pasillo según la grúa, simple o doble, cabecera, rack sobre pilar (pierdes esas posiciones pero ganas la fila) y túneles.
    - Para qué sirve cada accesorio y qué pasa después de cotizar.
  - **Avisos según el diseño:** pallet de ejemplo, viga a piso de su equipo, pasillos angostos, racks en rojo, pasillo sin entrada, lo que quitan los pilares, "te queda poco", "¡perfecto, ya cumples!" y "te quedan ~X m² libres, ¿los aprovechamos?" (abre el autollenado por área).
- **Estado del paso 5:** se le pasa al asistente con `composables/useAsistente.ts`.

## Para afinar el autollenado: lo que necesito de Racklog
1. **Pasillos por equipo:** confirmar 3,5 m contrapeso, 2,8 m retráctil, 2,4 m apilador. ¿Varían por marca o modelo?
2. **Pasillo de cabecera:** ¿el mismo ancho que el de trabajo, o puede ser menor? ¿Una o las dos puntas en filas largas?
3. **Distancia al muro:** hoy 100 mm entre la espalda del rack y el muro. ¿Es la que usan?
4. **Portón:** ¿cuánto espacio libre delante de un portón o andén, además del pasillo de la grúa?
5. **Drive-in:** ¿se aceptan dos bloques enfrentados compartiendo pasillo? ¿Fondo máximo de calle por equipo?
6. **Planos reales de clientes** (2 o 3) con el layout que hizo ingeniería, para comparar posiciones contra el autollenado.
7. **Nombre del robot:** hoy es "el asistente de Racklog".

## 4. RACKLOG, el avatar nuevo (28-10)
- **Avatar:** el rack con cara de `lib/tour/AVATAR RACKLOG.png` reemplaza al robot. Sus 15 poses están recortadas con fondo transparente en `public/assets/images/guia/` (mismos nombres de archivo).
- **Dónde:** encima de todo (`z-[70]`, sobre el aviso de cookies y los modales). En pantallas de 1024 px o más se para en el margen izquierdo, a la altura del título del paso (mide `main h1.fl-titulo` en cada paso y al cambiar el tamaño de la ventana), con la burbuja debajo. Si no cabe (celular, tablet), va abajo a la izquierda.
- **Saludo:** al entrar con "Diseñar mi bodega" dice "Hola, soy RACKLOG y estoy aquí para ayudarte a diseñar tu bodega." Sale una vez por visita.
- **Guía:** con "¡Vamos!" pasa a los temas del paso, uno a uno ("Siguiente" / "Entendido"). Cada vez que el cliente cambia de paso, vuelve a guiar desde el primer tema. "Más ayuda" o tocar a RACKLOG abre el panel con los avisos del diseño y el tutorial.
- **Voz:** parte apagada (parlante tachado al inicio del texto). Al tocarlo habla con voz de niño juvenil: toma una voz de hombre en español del navegador (Lorenzo es-CL en Edge, Jorge, Pablo, Diego…; se reconoce por el nombre) con tono alegre y tierno (1,55; con voz de mujer 1,35) y algo pausada (0,98). Lo hablado lleva exclamaciones para que la voz lo entone: "¡Hola! ¡Soy Racklog!…" y los títulos de cada tema entre ¡! y sigue leyendo cada mensaje hasta que se apague. Si el navegador no tiene voces en español, no suena.
- **Entrada y tamaño (28-10):** RACKLOG mide hasta 240 px en el computador: lo más grande que cabe en el margen, la cara a la altura del título y nunca encima de la barra de pasos. En el celular mide 128 px. Al abrir la página llega caminando desde el fondo, una sola vez, y al llegar saluda. Con "reducir movimiento" aparece directo.
  - **La caminata es de verdad:** usa los cuadros de frente de `lib/tour/Racklog caminando.png` (`public/assets/images/guia/camina-1.webp` y `camina-3.webp`, misma escala). Se turnan cada 0,17 s en el orden 1, 3, 1 en espejo y 3 en espejo, así cambia el pie que va adelante, y el cuerpo sube en el paso. Todo mientras se acerca de chico a grande, en 2,4 s. Los cuadros de lado (4 y 5) no se usan: sirven si algún día entra caminando de costado.
- **Voz menos robótica (28-10):** primero las voces neuronales (Microsoft "Online (Natural)" en Edge, Google en Chrome) y, entre ellas, la de hombre. El tono quedó en 1,3 (1,15 con voz de mujer) y la velocidad normal: forzar el tono era lo que la hacía sonar a robot. Lee frase por frase, con pausas naturales.
