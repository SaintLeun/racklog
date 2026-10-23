# Valores técnicos por confirmar

Archivo generado por `node scripts/valores-por-confirmar.mjs` a partir del código: **no editar a mano**.
Cada valor de esta lista se muestra en el flujo con la etiqueta **referencial**. Para confirmarlo, Técnica Racklog
corrige el valor en el archivo indicado, cambia `confirmado: false` por `confirmado: true` y se vuelve a correr el script.

Pendientes: **33**.

## Equipos (pasillo m, levante m, kg nominal, curva de capacidad residual)

`lib/rack3d/parametrosTecnicos.js` → `GRUAS`

| Dato | Valor actual | Confirmado por Racklog |
|---|---|---|
| transpaleta (Transpaleta) | pasillo: 2 · levante: 0.2 · kg: 2500 · curva: [[0.2,2500]] | ☐ |
| manual (Apilador manual) | pasillo: 2.4 · levante: 3 · kg: 1000 · curva: [[1.6,1000],[3,600]] | ☐ |
| apiladora (Apiladora eléctrica) | pasillo: 2.4 · levante: 4.5 · kg: 1200 · curva: [[3,1200],[4.5,900]] | ☐ |
| contrapeso (Grúa horquilla contrapeso) | pasillo: 3.5 · levante: 6 · kg: 2500 · curva: [[3.3,2500],[4.5,2200],[6,1800]] | ☐ |
| retractil (Grúa retráctil) | pasillo: 2.8 · levante: 10 · kg: 1600 · curva: [[6,1600],[8,1350],[10,1000]] | ☐ |

## Grúa dentro del drive-in (holgura y medidas típicas, m)

`lib/rack3d/parametrosTecnicos.js` → `GRUA_DRIVE_IN`

| Dato | Valor actual | Confirmado por Racklog |
|---|---|---|
| holgura | 0.15 | ☐ |
| equipos | contrapeso: {"techo":2.2,"mastil":2.4,"ancho":1.2,"driveIn":true} · retractil: {"techo":2.2,"mastil":2.5,"ancho":1.27,"driveIn":true} · apiladora: {"techo":2,"mastil":2,"ancho":0.8,"driveIn":true} · manual: {"driveIn":false,"motivo":"con apilador manual el operador tendría que entrar caminando a la calle, entre pallets en altura"} · transpaleta: {"driveIn":false,"motivo":"la transpaleta no levanta: no puede dejar pallets en los niveles de la calle"} | ☐ |

## Distancias de seguridad (m)

`lib/rack3d/parametrosTecnicos.js` → `DISTANCIAS`

| Dato | Valor actual | Confirmado por Racklog |
|---|---|---|
| rackMuro | 0.1 | ☐ |
| rackPilar | 0.1 | ☐ |
| pasilloPersona | 1.2 | ☐ |

## Capacidades por nivel (kg)

`lib/rack3d/parametrosTecnicos.js` → `CAPACIDADES`

| Dato | Valor actual | Confirmado por Racklog |
|---|---|---|
| selectivoParVigas | 2000 | ☐ |
| driveInPallet | 1000 | ☐ |

## Accesorios y seguridad

`lib/rack3d/accesorios.js` → `PARAMETROS_ACCESORIOS`

| Dato | Valor actual | Confirmado por Racklog |
|---|---|---|
| arcoBastidor | alto: 0.4 · tubo: 0.076 | ☐ |
| ajusteBaranda | paso: 0.1 | ☐ |
| aberturaBaranda | 1.2 | ☐ |
| separadoresPorMarco | hasta6m: 2 · mas6m: 3 | ☐ |
| toposPorPosicion | 2 | ☐ |
| holguraTopes | 0.3 | ☐ |
| mallaDistancia | 1 | ☐ |
| cabeceraLibre | 0.5 | ☐ |

## Radio de giro de cada equipo (m)

`lib/rack3d/rutas.js` → `RADIO_GIRO`

| Dato | Valor actual | Confirmado por Racklog |
|---|---|---|
| contrapeso | 1.7 | ☐ |
| retractil | 1.35 | ☐ |
| apiladora | 1.15 | ☐ |
| manual | 1.15 | ☐ |
| transpaleta | 0.95 | ☐ |

## Umbrales de la recomendación de sistema

`lib/flujo/recomendacion.js` → `UMBRALES`

| Dato | Valor actual | Confirmado por Racklog |
|---|---|---|
| selectivoHasta | 5 | ☐ |
| dobleProfundidadDesde | 6 | ☐ |
| dobleProfundidadSinEspacio | 4 | ☐ |
| driveInDesde | 11 | ☐ |
| fondoMinimoDI | 3 | ☐ |
| calleMinima | 0.5 | ☐ |
| muchos | 20 | ☐ |

## Capacidad por marco (kg)

`lib/rack3d/viabilidad.js` → `CAPACIDAD_MARCO_KG`

| Dato | Valor actual | Confirmado por Racklog |
|---|---|---|
| CAPACIDAD_MARCO_KG | 12000 | ☐ |
