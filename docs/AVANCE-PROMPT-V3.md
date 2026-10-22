# Avance prompt v3 (docs/prompt-bodega-v3.md)

Leyenda: ✅ hecho y probado · 🟡 parcial · ⬜ pendiente · 🔒 requiere acción del dueño

## 0. No negociables

| Punto | Estado | Evidencia |
|---|---|---|
| Imágenes del paso 1 (404) | ✅ | Las 3 existen en el repo y en `main`, y responden 200 en local y en racklog.cl. En dev no hay 404 en `/planifica-tu-bodega/` ni en `/disena/`. Se agregó tamaño reservado (`width`/`height` + `aspect-*`), fondo gris y respaldo `@error` (`PasoOperacion.vue`) |
| Circuito del lead | 🟡🔒 | `php api/tests/kommo_tour_test.php` pasa (etiqueta, UTM, rol, resumen, plano, tarea 24 h). **La API de producción no tiene esta rama**: hay que subir `api/`. Checklist: `docs/PRUEBA-LEAD-PRODUCCION.md` |
| Correo "Continúa tu diseño" | 🟡🔒 | Producción: `POST /api/continuar-diseno` → 404 (no desplegado); `health` ok con `mail: true`. Cliente: un reintento ante 5xx o red y aviso con el link si falla (`disena.vue`) |
| Vulnerabilidades | 🟡 | `npm audit fix`: se fueron las 2 críticas (simple-git) y quedan 11 altas y 1 moderada, todas de herramientas de compilación/dev de Nuxt 3 (nuxt, nitropack, @nuxt/cli → listhen → node-forge; globby → micromatch → braces). Sin parche en Nuxt 3; el arreglo es Nuxt 4 (cambio mayor). Ver "Ignoradas" abajo |
| Valores "referencial" | ✅ | `docs/VALORES-POR-CONFIRMAR.md` (33 valores) generado desde el código con `node scripts/valores-por-confirmar.mjs` (`--check` para CI). Etiqueta `FlujoReferencial` en pasillo/equipo (paso bodega y revisa), levante de la grúa y carga por nivel/marco (paso rack) y accesorios con medidas sin confirmar; desaparece sola al marcar `confirmado: true` |
| Casos de aceptación | 🟡 | Importación 3×40' (83 hoy, 43 a crecer) ✅ `prueba-importacion.mjs`. Pallets mezclados: ⬜ falta prueba dedicada. CASATEC: descartado por el dueño (22-10) |
| Celular 390 px | 🟡 | Recorrido automático hasta el layout: sin scroll horizontal (scrollWidth 390), sin errores de consola, ~20 s con valores por defecto. Falta la auditoría con red lenta (§8) |
| `npx nuxi typecheck` | ✅ | Limpio (eran 34 errores: `.d.ts` desactualizados de `calculos.js` y `visor.js`). Se agregaron `typescript` y `vue-tsc` como devDependencies |

### Vulnerabilidades ignoradas (con motivo)

El sitio se publica como **HTML estático** (`nitro.preset = "static"`): nada de Nuxt, Nitro ni del CLI corre en
el servidor. Todas las alertas que quedan son de esas herramientas:

- GHSA-vjh5-4x84-xrqp (nuxt, route rules en servidor): no hay servidor Nuxt en producción.
- GHSA-xfq5-w38q-pc2x (server islands): no se usan.
- GHSA-jjm6-p2m9-9w4x (NuxtLink con `pages` desactivado): `pages` está activo.
- GHSA-86w9-cpqp-85rv (node-forge vía listhen): certificados HTTPS solo del `nuxi dev`.
- GHSA-vfj7-8cjw-p6xm (braces vía globby): solo patrones del build.

Plan: migrar a Nuxt 4 después de la salida a producción.

## 1–11

| Punto | Estado | Notas |
|---|---|---|
| 1 Bodega primero (reordenar stepper) | ⬜ | |
| 2 Cuadrícula y cotas editables | ⬜ | |
| 3 El cliente arma su layout | 🟡 | ✅ `ubicar()` ya no corre solo (ni al montar, ni al cambiar medidas, forma, muros, esquinas, pasillos, zonas o pilares); los racks se conservan y, en conflicto, quedan en rojo con "Reubicar solo los racks en conflicto". ✅ "Llenar mi bodega" es secundario y pide confirmación si hay racks puestos. ✅ Se eliminó la casilla "Volver a ubicar…". ⬜ bandeja de módulos arrastrable, conversión simple↔doble para racks nuevos |
| 4 Snap y pasillos | ⬜ | |
| 5 Geometría real (polígono, calco) | ⬜ | |
| 6 Factor de ocupación | ⬜ | |
| 7 Validación continua | ⬜ | |
| 8 Nunca pantalla en blanco | ⬜ | |
| 9 UX y móvil | ⬜ | |
| 10 Bugs puntuales | ✅ | Aviso de conflicto apunta al botón real · `partirRack` usa `DISTANCIAS.pasilloPersona` y se quitó `void q` · `AVANCE-PROMPT-V2.md` línea 31 corregida · `docs/tour-planificador.patch` integrado (commit 22d46c9, ~90 % de sus líneas siguen igual; lo demás lo reemplazaron las fórmulas de la intranet) → borrado |
| 11 Entrega | 🟡 | `prueba-rearmar.mjs`: conserva lo manual, reubica solo los conflictos y prueba la separación peatonal. ⬜ pruebas del factor y del cierre del contorno |
