# Plan: repetir todos los resultados distintos de 6 al impactar y herir

Estado: implementado y verificado. Fecha: 3 de octubre de 2026.

## Resultado de la implementación

Los controles de `nonSixes` están disponibles en la calculadora web y el comparador
de buffs. Comparten componente, conversión de políticas y actualización atómica
de las selecciones. El texto y el SVG compartidos reflejan la política efectiva.
El motor distingue críticos de repetir fallos y buscar seises, pondera fuerza
variable y conserva los seises naturales al impactar/herir con modificador negativo.

Validación final: **492 pruebas Jest**, **109 pruebas Vitest**, `tsc --noEmit` y
build web de producción correctos. Se comprobaron ambas interfaces en el navegador.
La secuencia de abajo queda como registro del plan seguido.

Dos ajustes pequeños permitieron completar la compilación: el `tsconfig.json`
de React Native excluye `web/`, que tiene su propia configuración con tipos DOM;
y el tipo de comprobación del portapapeles admite también `writeText`, como ya
utilizaba una prueba existente. Se mantiene el perfil legado con umbral de impacto
superior a 6 como tirada imposible; el éxito automático del 6 natural se aplica
a los umbrales habituales de combate 2+–6+.

La limitación previa de correlación en las distribuciones con habilidades de
crítico continúa pendiente, tal como se delimitó en el plan.

## Objetivo y alcance

Añadir «Repetir todo lo que no sean seises» por separado al impactar y al herir. Se conserva cualquier **6 natural** de la primera tirada y se repiten una sola vez los resultados 1–5, incluidos los que ya eran éxitos. La segunda tirada se acepta aunque vuelva a mostrar 1–5.

El alcance propuesto es la calculadora web de combate, el comparador web de buffs y el motor compartido con React Native. Esta elección se basa en que los controles actuales de impactar/herir y repetir fallos están en la web. La pantalla móvil de preparación de combate selecciona perfiles; su formulario de armas no expone actualmente políticas de repetición. Añadir esos controles móviles exigiría ampliar también la edición y conversión de perfiles y queda como trabajo posterior.

Esta opción modela una decisión al disponer de permiso para repetir la tirada completa. No debe presentarse como una facultad concedida por una regla que solo permite repetir fallos. No se añaden controles a salvaciones, cargas, daño ni FNP.

## Hallazgos de la revisión

| Archivo | Situación actual y cambio previsto |
| --- | --- |
| `src/domain/dice/combat.ts` | `DieRerollPolicy` admite `none`, `ones` y `failures`. Añadir `nonSixes` y calcular correctamente las probabilidades de éxito y crítico. |
| `src/domain/dice/weapon.ts` | `hitReroll` y `woundReroll` ya usan ese tipo: no hacen falta propiedades nuevas en el arma. |
| `src/application/dice/CalculateUnitCombatUseCase.ts` | Consume las políticas en ambas etapas; sustituir el cálculo de críticos por uno que conserve el contexto de la tirada original. |
| `src/application/dice/CalculateCombatResultUseCase.ts` | Ya transmite ambas políticas al caso de uso de unidad; verificar la nueva variante sin duplicar lógica. |
| `web/src/calculators/combat/presets.ts` | `CombatParams` representa repetir fallos con dos booleanos opcionales. Extenderlo de forma compatible. |
| `web/src/calculators/combat/useCombat.ts` | Traduce esos booleanos a `failures`; incorporar el nuevo modo y las dependencias de `useMemo`. |
| `web/src/calculators/combat/CombatCalculator.tsx` | Añadir controles junto a los de repetir fallos y mantener una sola política activa por etapa. |
| `web/src/calculators/combat/share.ts` | Incluir la política efectiva en los resultados compartidos. |
| `web/src/calculators/combat/shareImage.ts` | La imagen consume `buildCombatShareContent`; verificar el texto nuevo y su ajuste sin duplicar reglas. |
| `web/src/calculators/buffs/useCombatBuffComparison.ts` y `CombatBuffComparisonCalculator.tsx` | Usan el mismo `CombatParams`, pero convierten y editan los controles por separado. Mantener ambas herramientas coherentes. |

Hay un error previo directamente relacionado: el pipeline usa `dieSuccessProbability(6, 0, 'failures')` para calcular críticos. Al cambiar el umbral a 6, pasa a repetir 1–5 aunque la tirada original solo repitiera fallos. Así obtiene siempre **11/36**, que corresponde a buscar seises. Al impactar en 3+ repitiendo fallos, el valor correcto es **8/36**: se conserva el 6 inicial y solo los resultados 1–2 dan otra oportunidad de obtenerlo. La documentación y la skill WH40K también reproducen la fórmula incorrecta.

Otro caso a contemplar al separar contextos: la función genérica devuelve cero para un umbral 6 con modificador −1, pero un 6 natural al impactar o herir sigue siendo éxito. No se puede corregir esto indiscriminadamente en las salvaciones, porque una salvación anulada puede ser imposible.

## Comportamiento y valores de referencia

Para impactar/herir, sea `p` la probabilidad de éxito sin repetición, incluyendo que el 1 natural falla y el 6 natural tiene éxito. Con el nuevo modo:

```text
P(éxito)  = 1/6 + (5/6) × p
P(crítico) = 1/6 + (5/6) × (1/6) = 11/36
P(normal) = P(éxito) − P(crítico)
```

Se mantiene el umbral de crítico actual del proyecto: 6 natural. Modificadores y éxitos normales no convierten otras caras en críticos.

| Umbral sin modificadores | Sin repetir: éxito | Repetir fallos: éxito / crítico | Repetir no seises: éxito / crítico |
| --- | --- | --- | --- |
| 2+ | 5/6 | 35/36 / 7/36 | 31/36 / 11/36 |
| 3+ | 4/6 | 32/36 / 8/36 | 26/36 / 11/36 |
| 4+ | 3/6 | 27/36 / 9/36 | 21/36 / 11/36 |
| 5+ | 2/6 | 20/36 / 10/36 | 16/36 / 11/36 |
| 6+ | 1/6 | 11/36 / 11/36 | 11/36 / 11/36 |

Buscar seises aumenta los críticos, pero puede reducir los éxitos totales respecto a repetir fallos. El daño no tiene por qué aumentar: depende de las habilidades y del objetivo.

## Secuencia de implementación

### 1. Dominio: una política y un cálculo contextual

Seguir Red–Green–Refactor en `src/domain/dice/combat.test.ts`.

- Ampliar `DieRerollPolicy` con `nonSixes`.
- Introducir una función pura `combatRollProbabilities(baseThreshold, modifier, reroll)` que devuelva `success`, `critical` y `normal` para impactar/herir.
- Calcular las probabilidades a partir de las seis caras iniciales: cada cara se conserva o reparte su probabilidad entre las seis caras de una única repetición. Usar el mismo criterio de repetición para éxito total y crítico.
- Para `failures`, decidir qué caras se repiten según el umbral y modificador de la tirada original; para `nonSixes`, repetir exactamente las caras 1–5. Para `ones`, repetir solo el 1.
- Garantizar el éxito del 6 natural y el fallo del 1 natural en impactar/herir; limitar sus modificadores a ±1.
- Mantener el contrato de `dieSuccessProbability` para sus consumidores actuales de salvación/FNP. Si comparte el cálculo por caras, separar explícitamente el criterio de éxito de cada contexto. Para `nonSixes`, una salvación imposible continúa teniendo probabilidad cero.

No introducir cálculos de probabilidad en los componentes ni en los hooks web.

### 2. Pipeline: integrar ambas etapas

En `CalculateUnitCombatUseCase.ts`, usar el nuevo resultado contextual tanto para `pAllHits` y `pCritHit` como para heridas normales y críticas. Para fuerza variable, ponderar las probabilidades por cada valor de `strengthDist`.

Conservar los comportamientos existentes:

- Los seises garantizados quedan fuera de las tiradas aleatorias y no se repiten.
- Torrent omite la tirada de impactar y no genera críticos por esa etapa.
- Los críticos activan Lethal Hits y Sustained Hits donde corresponda; los impactos extra siguen siendo normales.
- Las heridas automáticas de Lethal Hits no realizan tirada de herir ni se convierten en Devastating Wounds.
- Devastating Wounds usa los críticos de las tiradas de herir efectivamente realizadas; FNP sigue aplicándose al daño.

Probar también la fachada `CalculateCombatResultUseCase` y el comparador de buffs, que reutilizan este motor. Los resultados con `failures` y habilidades de crítico pueden cambiar como consecuencia de corregir el error previo; documentar los valores nuevos.

### 3. Parámetros y controles web

- Añadir `hitRerollNonSixes?: boolean` y `woundRerollNonSixes?: boolean` a `CombatParams`. Mantener `hitRerollAll` y `woundRerollAll` para no migrar los consumidores y presets actuales.
- Crear un adaptador compartido, por ejemplo `web/src/calculators/combat/rerollPolicy.ts`, que convierta los controles en una política de dominio. Prioridad defensiva si llegan ambos booleanos activos: `nonSixes`, después `failures`, después `none`; nunca efectuar dos repeticiones.
- Usar ese adaptador en `useCombat`, `useCombatBuffComparison` y el resumen compartido.
- Añadir dos casillas, una en cada etapa, con etiquetas equivalentes a «Repetir todo lo que no sean seises para impactar/herir». Al activar una casilla de repetición, desactivar la alternativa de esa etapa en una única actualización de estado. Impactar y herir permanecen independientes.
- Incorporar ayuda breve: «Conserva los 6 naturales y repite una vez los resultados 1–5, incluidos los éxitos».
- Con Torrent, deshabilitar los controles de repetición al impactar y omitir esa política del resumen efectivo. Conservar la elección para recuperarla al desactivar Torrent.
- Añadir las dependencias nuevas de `useMemo`, conservar el comportamiento de perfil personalizado y limpiar el estado de copia al cambiar la selección.
- Aplicar lo mismo al comparador de buffs. Cargar un preset reemplaza los parámetros y elimina las selecciones anteriores que no estén en él.

Los nuevos textos deben pasar por claves de traducción. La web actualmente usa literales y no tiene infraestructura i18n: introducir un catálogo mínimo ES/EN y una función `t` para los textos del bloque afectado, sin convertir toda la web como parte de esta función. La interfaz de presentación de `CombatParams` sigue usando tipos primitivos; el adaptador puede importar el tipo del dominio.

### 4. Compartir y documentar

Actualizar `share.ts` para distinguir «Repetir fallos» de «Repetir todo lo que no sean seises» en cada etapa. El texto, la vista previa y el SVG deben reflejar la misma política efectiva, incluso si un consumidor proporciona ambos booleanos.

Actualizar `docs/math/wh40k-combat.md`, las referencias relevantes de `docs/math/weapon-abilities.md` y la fórmula de críticos de `.github/skills/wh40k/SKILL.md`. Explicar que `P(crítico)` con repetir fallos depende de los fallos de la tirada original. Estos archivos contienen cambios locales previos: integrar solo los ajustes necesarios y conservar el trabajo existente.

## Pruebas y aceptación

1. **Dominio:** tabla completa de umbrales 2+–6+; modificadores ±1 y límites; 6+ con −1; políticas previas; nueva política; normal + crítico = éxito; probabilidades válidas; salvaciones imposibles no pasan a ser posibles.
2. **Pipeline:** política en impacto, en herida y en ambas; fuerzas variables; Lethal Hits, Sustained Hits y Devastating Wounds; Torrent; seises garantizados; ataques cero; FNP. Comprobar medias manuales y normalización, además de probabilidades exactas en casos donde el pipeline es exacto.
3. **Adaptadores y UI:** exclusión mutua en ambas direcciones; independencia entre etapas; prioridad defensiva de parámetros inconsistentes; actualización al cambiar controles; cambio de preset; controles de Torrent; misma conversión en combate y buffs.
4. **Compartir:** etiquetas de ambas políticas por etapa, coherencia texto/SVG y ausencia de repetición de impacto efectiva con Torrent.

Ejecutar primero los tests concretos de cada cambio. Al cerrar la implementación:

```powershell
# Desde la raíz
npm.cmd test -- --runInBand --watch=false --no-coverage
npx.cmd tsc --noEmit

# Desde web/
npm.cmd test
npm.cmd run build
```

La implementación estará terminada cuando los controles calculen y compartan la política correcta, la tabla de referencia esté cubierta, la corrección de críticos de `failures` tenga pruebas y los checks anteriores pasen o cualquier fallo previo se identifique explícitamente.

## Límites y comprobaciones ya realizadas

- Pasaron **94 tests Jest** de `combat`, `CalculateUnitCombatUseCase` y `CalculateCombatResultUseCase`.
- Pasaron **46 tests Vitest** de `useCombat`, presets, texto e imagen compartidos y `useCombatBuffComparison`.
- Estas pruebas verifican el estado actual; no cubren la nueva política ni detectan el error contextual de críticos descrito arriba. No se han ejecutado en esta revisión el build ni las suites completas.
- Vitest necesitó ejecutarse fuera del sandbox: esbuild no podía leer los directorios padre. No fue un fallo de los tests.
- Existe una limitación matemática previa adicional: el pipeline combina por convolución algunos conteos de críticos y normales que proceden de los mismos dados, tratándolos como independientes. Esto puede alterar las distribuciones y probabilidades de eliminación aunque las medias sean correctas. Corregir ese modelado conjunto requiere un plan aparte; añadir `nonSixes` no debe presentarse como una solución a esa limitación.
- En la revisión inicial solo se creó este plan. La implementación posterior conserva los cambios locales anteriores y añade los ajustes descritos arriba.

## Referencia de reglas

El proyecto declara Warhammer 40,000 **10.ª edición**. Se conserva ese alcance, sin cambiar de edición. Las reglas básicas establecen una sola repetición por dado y definen el crítico de impacto mediante el 6 sin modificar: [Core Rules de Games Workshop](https://www.warhammer-community.com/wp-content/uploads/2023/06/dLZIlatQJ3qOkGP7.pdf) y [reglas básicas de 10.ª edición](https://assets.warhammer-community.com/warhammer40000_core%26key_corerules_eng_24.09-5xfayxjekm.pdf). Las fórmulas y la tabla de este plan son cálculos propios para la política solicitada.
