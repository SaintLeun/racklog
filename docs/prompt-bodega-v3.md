# Prompt v3 para Claude Code — Mejorar "Tu bodega" + no negociables de producción
**Basado en el código real de la rama `landing-tour-planificador` al 22-10-2026 (commit 2d270ee).**

---

CONTEXTO
Repo racklog, rama landing-tour-planificador, landing /planifica-tu-bodega con stepper de 7 pasos.
Archivos clave: components/flujo/PasoBodega.vue, stores/proyecto.ts, components/planificador/Plano2D.vue, lib/rack3d/{bodega,pasillos,planificador,viabilidad}.js, lib/flujo/calculos.js.
Todo aplica a LOS 3 FLUJOS: rack selectivo, drive-in y ángulo ranurado.
Objetivo: la bodega se dibuja primero y se dibuja fácil (cuadrícula + cotas editables), el cliente arma SU layout (nunca se le borra), todo se valida en vivo, y NUNCA hay una pantalla en blanco.

0. NO NEGOCIABLES PARA SALIR A PRODUCCIÓN
Estos puntos bloquean el merge a main. Verificarlos al final y reportar cada uno con evidencia:
- Las 3 imágenes del paso 1 que dan 404 (gallery-rack-selectivo-1.webp, gallery-drive-in-1.webp, gallery-angulo-ranurado-1.webp): arreglar rutas o agregar archivos, con fallback y tamaño reservado.
- Circuito del lead completo probado de punta a punta: registro → quote_sent → lead en Kommo con etiqueta tour-logistico, UTM, rol, resumen, plano adjunto y TAREA con vencimiento a 24 h al vendedor. Dejar un script o checklist de prueba manual con un lead de prueba.
- Correo "Continúa tu diseño" (POST /api/continuar-diseno) enviándose de verdad: verificar configuración de envío en producción y qué pasa si falla (reintento o aviso).
- Resolver las vulnerabilidades de dependencias que marca GitHub en main (2 críticas, 4 altas): npm audit, actualizar, y documentar las que se ignoran con motivo.
- Todo valor técnico no confirmado por Racklog (capacidades de viga, perfiles, DISTANCIAS con confirmado:false, medidas de accesorios) debe mostrar la etiqueta "referencial" en la interfaz y listarse en un solo archivo para confirmación.
- Casos de aceptación pasando: CASATEC (5×10×5 m, apilador manual, 4 lotes → selectivo con drive-in como alternativa), importación 3×40' (83 posiciones hoy, 43 a crecer), pallets mezclados ("Acomodar solo" deja 1,2 m abajo y 1,7 m arriba).
- Flujo completo en celular 390 px: sin scroll horizontal, sin pantalla en blanco, con valores por defecto en menos de 5 minutos.
- npx nuxi typecheck limpio y sin errores en consola.

1. LA BODEGA VA PRIMERO (reordenar el stepper)
- Nuevo orden: 1 Tu operación → 2 Tu bodega (dibujo) → 3 Tus pallets → 4 Arma tu rack → 5 Arma tu layout (ubicar racks) → 6 Accesorios y seguridad → 7 Revisa y cotiza.
- El paso actual "Tu bodega" se parte en dos: el DIBUJO (medidas, forma, pilares, portones, andenes, oficinas, zonas) pasa al paso 2; el LAYOUT (ubicar racks, pasillos de grúa/peatonal) queda en el paso 5.
- Accesorios van DESPUÉS del layout porque canilleras, protecciones de bastidor y barandas dependen de pasillos y cabeceras reales.
- La altura de la bodega se pide en el paso 2 (hoy se pide en Arma tu rack); Arma tu rack la lee de ahí.
- Actualizar la landing: la sección "Cómo funciona" (pages/planifica-tu-bodega/index.vue, líneas ~321–325) debe calzar con el orden real.
- Todo lo que venga después del paso 2 se valida en vivo contra ESA bodega.

2. DIBUJO DE LA BODEGA: CUADRÍCULA Y COTAS EDITABLES A MANO (rehacer la experiencia de dibujo)
El dibujo actual de formas L/T/libre arrastrando esquinas a ojo no convence. Reemplazar por un dibujo guiado por NÚMEROS:
- **Cuadrícula visible** en el plano: 1 m por defecto, selector 0,5 / 1 / 5 m, se puede ocultar. Snap a la cuadrícula al dibujar y al mover esquinas y elementos.
- **Todas las cotas son editables a mano**: cada muro muestra su cota; al tocarla se abre un input numérico en metros (acepta coma y punto decimal), Enter confirma y el muro se ajusta a esa medida exacta manteniendo el resto de la figura; Esc cancela. Lo mismo para las cotas de posición de portones, andenes, oficinas y pilares.
- **Formas L y T por medidas, no a ojo**: al elegir L o T, pedir las medidas de cada tramo (ej. L: 20×30 m con un recorte de 8×12 m en qué esquina) con vista previa en vivo. El dibujo libre tocando esquinas queda como opción avanzada bajo "Dibujo libre".
- **Modo "escribir mi bodega"**: la lista de muros con dirección y metros (que ya existe en la forma libre) se hace protagonista: una tabla simple muro por muro donde se escriben los metros y el plano se dibuja solo, siempre sincronizada con el dibujo.
- Al cerrar el contorno, validar que cierra (suma de muros) y, si no cierra, decir cuánto falta y en qué dirección.

3. EL CLIENTE ARMA SU LAYOUT — ELIMINAR EL AUTO-LAYOUT IMPUESTO
- Bandeja de módulos: lineal SIMPLE y lineal DOBLE de cada modelo configurado, que el cliente arrastra al plano. Mantener el contador que ya existe ("tu demanda: N pallets → M cuerpos · en el plano X · faltan Y") y "Ubicar los que faltan" (conservar la lógica de ubicarFaltantes, que ya respeta lo manual).
- ubicar() NUNCA corre solo ni borra el layout del cliente. Hoy se dispara y reubica todo al montar el paso, al cambiar medidas, forma, largo de muro, esquinas, pasillos, zonas o pilares (watch firmaCirculacion con reacomodar=true por defecto). Cambiar a: los racks colocados SE CONSERVAN; si un cambio de bodega los deja en conflicto, se marcan en rojo con aviso y botón "Reubicar solo los racks en conflicto".
- "Llenar mi bodega" queda como atajo OPCIONAL; si hay racks puestos a mano, pide confirmación antes de tocarlos.
- Conversión simple↔doble por lineal colocado, también para racks NUEVOS (hoy solo existe en "ya tengo"/"hoy"). Al convertir se recalculan posiciones, demanda y accesorios.
- Eliminar la casilla "Volver a ubicar mis racks cuando cambio un pasillo" (deja de tener sentido).

4. SNAP Y PASILLOS
- Snap al arrastrar un rack: alinear bordes con racks vecinos y muros, e imán a la separación = pasillo estándar del equipo del cliente (hoy solo hay grilla de 10 cm).
- Pasillo angosto: mantener el aviso actual, pero resolver en el momento (botón "Separar a X m"), no "lo revisamos en el paso siguiente".
- Pasillo GIGANTE: avisar cuando el pasillo supere ~1,5× lo que pide el equipo: "este pasillo mide X m y tu grúa necesita Y — acercando las filas ganas ~Z posiciones". (Hoy al arrastrar quedó un pasillo de 10,54 m sin aviso.)
- Auto-layout y ubicarFaltantes: tratar los pasillos de grúa VERTICALES igual que los horizontales (hoy los verticales solo cuentan como obstáculo).

5. GEOMETRÍA REAL DE LA BODEGA
- dentroDeBodega: restringir los racks al POLÍGONO real (L, T, libre), no al rectángulo envolvente. Hoy en una bodega en L un rack puede caer en la parte que no existe.
- Conectar el calco de plano (ya implementado en Plano2D.vue, ~línea 459, usado solo por pages/planificador.vue) al paso 2 del flujo: "¿Tienes un plano? Súbelo y cálcalo".

6. FACTOR DE OCUPACIÓN
- Input 60–85 %, default 80 %, en el cálculo de demanda: posiciones necesarias = pallets ÷ factor. Nadie guarda el 100 %.
- Visible y editable en la barra de demanda del paso de layout, con tip "¿por qué?".

7. VALIDACIÓN CONTINUA EN EL LAYOUT
- Correr revisarDiseno (lib/rack3d/viabilidad.js) EN VIVO en el paso de layout, no recién en Revisa: distancia a muro/pilar (0,10 m), cara de carga sin pasillo, peatonal < 1,2 m, además de los conflictos que ya corren.
- "Faltan N cuerpos" siempre con el equivalente en m² (≈ N × área por cuerpo incluida su cuota de pasillo) y sugerencias con BOTÓN que las aplica (subir un nivel, pasar filas a doble, achicar pasillo sobrado), no texto fijo.
- Nunca llegar al final con "no hay espacio" sin solución.

8. NUNCA UNA PANTALLA EN BLANCO (cascada de carga)
Auditar TODO el flujo con red lenta (throttling 4G) y en celular, listar cada punto donde hoy aparece una pantalla en blanco o un salto de contenido, y eliminarlos:
- Entrada a /planifica-tu-bodega, cambio de paso, apertura del 3D, generación del PDF y "Continuar donde quedé": cada uno con skeleton o placeholder que ocupa el mismo espacio que el contenido final (cero CLS), nunca blanco.
- El 3D se carga con poster + barra de progreso ("cargando tu bodega en 3D…") y se PRECARGA al llegar al paso anterior, para que al abrirlo ya esté listo.
- La información aparece en cascada ordenada: primero la estructura del paso, luego el plano, luego las capas y números; los números pendientes muestran "—" o un pulso, nunca saltan de 0 al valor.
- Transición entre pasos: fade + 8–12 px, 200–250 ms, respetando prefers-reduced-motion.
- Si una carga tarda más de 3 s, mostrar un mensaje con lo que está pasando (no un spinner mudo).

9. UX Y MÓVIL
- Una acción principal por pantalla: paso 2 "Continuar con esta bodega"; layout con un solo botón primario según estado ("Ubicar los que faltan" si faltan → "Revisar mi diseño" si está completo). "Llenar mi bodega", "Agregar racks" y el resto, secundarios o en "Más opciones".
- Fusionar las pestañas "Lo que ya tengo" y "Hoy vs propuesta" (repiten casi el mismo formulario).
- Zoom táctil en el plano: pellizco para zoom, dos dedos para desplazar, botones +/− visibles. Hoy solo funciona la rueda del mouse.
- Mostrar el texto "N × M pilares" en la grilla (hoy se calcula en nxm y nunca se muestra).

10. BUGS PUNTUALES
- El aviso de conflicto dice tocar "Volver a ubicar" pero ese botón no existe (PasoBodega.vue ~línea 541); apuntar al botón real.
- partirRack: separación fija de 1,2 m → usar el pasillo peatonal mínimo como parámetro; limpiar la variable sin uso (void q).
- docs/AVANCE-PROMPT-V2.md se contradice (línea 31 marca pendiente lo que la 79 marca listo): corregir.
- El commit 2d270ee solo agrega docs/tour-planificador.patch sin aplicar: confirmar si ese patch ya está integrado; si sí, borrar el archivo.

11. ENTREGA
- Implementar en los 3 flujos: selectivo, drive-in y ángulo ranurado.
- Actualizar tests/flujo/prueba-rearmar.mjs a la nueva lógica (conservar lo manual) y agregar pruebas del factor de ocupación y del cierre del contorno.
- Resumen por punto (0-10) de qué se hizo + archivos modificados, partiendo por la evidencia de los no negociables del punto 0.
