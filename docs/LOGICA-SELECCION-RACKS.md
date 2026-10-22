# Lógica de selección de racks — BORRADOR (por confirmar por Racklog)

> No llegó el documento original pedido en el prompt v2 (§R3). Este borrador lo redactó Claude a partir
> de las reglas del tour del patch (`lib/tour/reglas.js`), lo que pide el prompt v2 y práctica habitual de
> la industria. **Cada regla marcada ⚠ debe confirmarla Racklog.** El motor que la implementa es
> `lib/flujo/recomendacion.js`; sus umbrales están en `UMBRALES` al inicio del archivo para cambiarlos
> sin tocar la lógica. Si el documento original aparece, reemplaza este y se ajusta el motor.

Sistemas que vende Racklog: **rack selectivo** (simple o doble), **drive-in** y **ángulo ranurado**.

## 1. Datos que se usan (y de dónde salen)
| Dato | Pregunta / campo | Paso |
|---|---|---|
| Unidad de manejo (pallet / cajas a mano) | "¿Cómo mueves tu mercadería?" | 1 |
| Equipo (apilador manual, eléctrico, grúa horquilla, retráctil) | "¿Con qué equipo mueves los pallets?" | 1 |
| FIFO / vencimiento / lote | "¿Tu producto vence o despachas por lote?" | 1 |
| Espacio (sobra / justo / falta) | "¿Cómo estás de espacio?" | 1 |
| Por producto: pallets (cantidad), nº de SKU que comparten ese pallet, rotación (veces/semana), alto, peso, si la caja aguanta apilada | tarjeta de cada tipo de pallet | 2 |
| Altura libre, levante y pasillo del equipo | paso 3 y parámetros | 3 |

**Pallets por SKU** = pallets del tipo ÷ nº de SKU de ese tipo. **Rotación** en veces por semana:
"Rota poco" < 1, "Rota normal" 1–5, "Rota harto" > 5.

## 2. Filtros duros (descartan un sistema para ese producto)
1. **FIFO estricto o despacho por lote** → descarta **drive-in** (entrega lo último que entró). ⚠
2. **Apilador manual o sin equipo** → descarta **drive-in** (el operador tendría que entrar caminando a la calle). ⚠
3. **Cajas a mano y ≤ 250 kg por repisa** → **ángulo ranurado**; si pesa más, rack selectivo con planos de carga.
4. **Geometría de calles**: una calle de drive-in guarda un solo SKU. Si los pallets por SKU no llenan al
   menos la mitad de una calle (fondos × niveles × 50 %), descarta **drive-in** (calles a medio usar). ⚠
5. **Alcance del equipo y techo**: los niveles se limitan por el levante del equipo y la altura libre
   menos 0,5 m (se aplica al configurar, no descarta sistemas).
6. **Caja que no aguanta apilada**: no cambia el sistema (en rack cada pallet va en su posición), pero
   descarta soluciones de piso apilado y se anota para el ejecutivo. ⚠

## 3. Mapa de decisión (si el producto pasó los filtros)
| Pallets por SKU \ Rotación | < 1 vez/semana | 1–5 veces/semana | > 5 veces/semana |
|---|---|---|---|
| 1 a 5 | Selectivo | Selectivo | Selectivo |
| 6 a 10 | Doble profundidad / push-back → selectivo + `revisar_asesor` | Doble profundidad / push-back → selectivo + `revisar_asesor` | Selectivo ⚠ (mucho movimiento: acceso directo) |
| 11 a 20 | **Drive-in** | **Drive-in** | Selectivo ⚠ (mucho movimiento: acceso directo) |
| Más de 20 | **Drive-in** | **Drive-in** | Drive-in con calles cortas ⚠ |

- Ronda 2 (dueño, 21-10-2026): drive-in es para **más de 10 pallets por SKU** con rotación baja o media. De 6 a
  10 conviene doble profundidad o push-back; el planificador no los dibuja: diseña selectivo y un ingeniero evalúa.
- Un drive-in lleva **al menos 3 pallets de fondo** por calle (una calle de 2 no es drive-in) y solo se recomienda si guarda más pallets por m² que el selectivo. ⚠
- Si el espacio "falta", el umbral de doble profundidad / push-back baja de 6 a 4 pallets por SKU. ⚠
- Si drive-in queda descartado por un filtro duro y el producto cae en zona drive-in del mapa → selectivo
  **y** flag `revisar_asesor` (un ingeniero evalúa otra alta densidad: push-back, doble profundidad). ⚠

## 4. Alternativa calculada
Para cada producto se calcula también el **otro** sistema (selectivo ↔ drive-in) con sus posiciones,
cuerpos o calles y m² de piso (huella + medio pasillo), y se muestra lado a lado. La recomendación dice qué
ganó: más posiciones por m² (drive-in) o acceso directo / FIFO (selectivo).

## 5. Mezcla de sistemas
Los productos se agrupan por sistema recomendado: un modelo de **selectivo** con todos los productos que
van a selectivo (pallets mezclados por nivel), un **drive-in por cada alto de pallet** (un solo alto por
bloque), y **ángulo ranurado** para las cajas a mano.

## 6. Qué debe decir cada recomendación (§R3)
1. Nombre del producto y sus números (pallets, SKU, rotación, alto, peso).
2. Sistema y configuración concreta ("Selectivo doble, 3 niveles + piso, viga 2,3 m, 2 pallets por nivel → 112 posiciones").
3. Por qué, en una frase, y qué ganó frente a la alternativa.
4. Qué falta confirmar con el ingeniero (los "No sé").
Solo se muestran preguntas y avisos que aplican al sistema en evaluación.

## 7. Casos de prueba (resultado esperado)
| Caso | Datos | Esperado |
|---|---|---|
| CASATEC | Bodega 5 × 10 × 5 m, apilador manual, 4 lotes de 29 / 16 / 46 / 18 pallets, cajas que no se apilan | **Selectivo** (filtro: apilador manual); alternativa drive-in calculada; `revisar_asesor` (lotes grandes en zona drive-in) |
| Logística (retail) | 300 SKU, 1–2 pallets por SKU, rota harto, grúa contrapeso | **Selectivo** |
| Minería (repuestos pesados) | 40 SKU, 8 pallets por SKU, rota poco, grúa contrapeso, sin vencimiento | **Selectivo**; alternativa doble profundidad / push-back; `revisar_asesor` (ronda 2) |
| Juan (alimentos) | 12 SKU, 100 pallets (8,3 por SKU), rota normal | **Selectivo**; alternativa doble profundidad / push-back |
| Repuestos | 20 SKU, 30 pallets por SKU, rota poco | **Drive-in** con 3 o más de fondo; alternativa selectivo |
| Repuestos (pocos) | 20 SKU, 16 pallets por SKU, contrapeso | **Selectivo**: calles de 3 con calle de 1,5 m no ganan espacio (`revisar_asesor`) |
| Alimentos con vencimiento | 10 SKU, 30 pallets por SKU, rota normal, FIFO estricto, grúa | **Selectivo** (filtro FIFO) + `revisar_asesor` |
