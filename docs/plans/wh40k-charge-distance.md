# Plan de actualización de la calculadora de cargas WH40K

Fecha: 14 de octubre de 2026.
Estado: implementado y validado localmente tras la aprobación de Iván.

## Objetivo y alcance

Actualizar la pestaña «Carga WH40K» de LudoMaths y su caso de uso compartido conforme a las reglas confirmadas de la copia de la app oficial disponible en el MCP. El plan aprobado se ha aplicado al motor, adaptador, interfaz y documentación matemática.

Primera implementación: una carga estándar, un objetivo, distancia introducida manualmente, 2D6, modificador aditivo autorizado de la tirada y una repetición completa opcional. El jugador confirma que la unidad puede declarar la carga y que el movimiento es viable. No inferir viabilidad geométrica, coherencia, alturas, terreno, cargas múltiples ni excepciones de habilidades a partir de una única distancia.

Conservar como herramienta separada el cálculo condicionado a un 6 observado, identificándolo como una observación y no como una habilidad que concede un dado fijo.

## Reglas comprobadas y consecuencias

| Regla comprobada | Consecuencia para la calculadora |
| --- | --- |
| La secuencia es declarar carga, tirar 2D6 y después intentar el movimiento, seleccionando sus objetivos. | El resultado predice si la tirada permite alcanzar un objetivo concreto; no promete que ese objetivo ya se haya elegido al declarar. |
| El objetivo debe estar dentro de 12″ de la unidad y dentro de la distancia máxima disponible. | Comparar con la distancia medida completa. No restar el alcance de enfrentamiento. |
| Sin modificadores, un doble 1 no permite completar una carga. | Eliminar el caso «2″ = carga garantizada». En el caso estándar al mismo nivel, un objetivo a 2″ o menos implica enfrentamiento previo y queda fuera del escenario elegible. |
| El alcance de enfrentamiento es 2″ horizontal y 5″ vertical. | Explicar la condición de estar sin trabar. Una sola cifra no decide enfrentamiento en situaciones con alturas. |
| Una tirada modificada de carga no supera 12; una tirada reducida por debajo de 1 queda en 1. | Para el modificador aditivo soportado, usar clamp(2D6 + m, 1, 12). El doble 1 no es un fallo universal cuando existe un modificador positivo autorizado. |
| La unidad debe acabar trabada con todos sus objetivos y no con enemigos que no sean objetivos. Cada miniatura debe cumplir las condiciones del movimiento. | Mostrar alcance limitado: «Probabilidad de obtener distancia suficiente», condicionada a elegibilidad y movimiento viable. |
| Repetir una tirada de carga exige repetirla completa, una sola vez y antes de modificadores. | «Repetir la tirada completa si no alcanza», solo bajo permiso de una regla. Repetir fallos es una decisión del jugador, no un permiso concedido por LudoMaths. |
| La repetición de mando incluye cargas y cuesta 1 CP en el registro consultado. | Puede citarse como ejemplo de permiso; la calculadora no valida disponibilidad de CP ni uso de estratagemas. |
| La FAQ distingue modificar la tirada de modificar la distancia máxima del movimiento, como al alzar el vuelo. | No combinar esas dos clases de efectos en el mismo campo. La primera entrega solo soporta modificadores aditivos de la tirada. |

## Problemas encontrados en el código

- `CalculateChargeProbabilityUseCase.ts` acepta solo distancias enteras desde 2 y documenta éxito garantizado a 2″ y contacto de peanas como consecuencia automática.
- `ChargeCalculator.tsx` redondea la medición, ofrece 2″–13″ y llama al resultado «carga exitosa». Redondear 9,1″ a 9″ cambia incorrectamente la probabilidad.
- `useCharge.ts` genera la tabla 2″–13″ y mezcla la tirada estándar con el modo `lockedSix`.
- Con `lockedSix + reroll`, el motor vuelve a usar D6+6 en la repetición. Una repetición completa ordinaria debe perder ese 6 observado y volver a 2D6.
- Los tests actuales consolidan esos comportamientos y deben actualizarse junto con el contrato.

## Implementación propuesta

### 1. Contrato y motor compartido

Modificar `src/application/dice/CalculateChargeProbabilityUseCase.ts`:

- Aceptar distancia decimal finita positiva; conservar la medición sin redondearla.
- Distinguir entrada inválida, objetivo fuera de 12″ y escenario que requiere comprobar elegibilidad. No confundir un escenario no elegible con una tirada válida de probabilidad cero.
- Incorporar `chargeRollModifier` aditivo, entero y con valor inicial 0. Los modificadores de otra clase quedan fuera del contrato inicial.
- Enumerar los 36 resultados equiprobables de 2D6, aplicar el modificador y los límites, y sumar las ramas cuya distancia final alcanza la medición.
- Para una medición d y un modificador m, el cálculo base es P(clamp(2D6 + m, 1, 12) ≥ d), condicionado a que la carga sea legal y el recorrido viable. Sin modificadores, una distancia decimal exige el siguiente resultado entero.
- Con repetición completa de las tiradas insuficientes, usar p + (1-p)p. No interpretar la repetición como un segundo movimiento ni repetir dados más de una vez.
- Mantener explícita la distribución natural de la tirada y, si se expone, la distribución modificada; evitar un campo que cambie silenciosamente de significado.

El motor debe conservar un contrato claro: calcula distancia suficiente, no determina por sí solo si una unidad puede cargar. La interfaz gestionará la confirmación del contexto y no mostrará un resultado de carga legal cuando falte.

### 2. Adaptador e interfaz web

Modificar `web/src/calculators/charge/useCharge.ts` y `ChargeCalculator.tsx`:

- Identificar la sección como 11.ª edición y sustituir la explicación y la etiqueta del resultado por el alcance real del cálculo.
- Entrada «Distancia medida al objetivo (″)» con decimales, sin `Math.round`, y modificador de tirada con ayuda sobre su permiso y alcance.
- Confirmación de que la unidad está sin trabar, puede declarar la carga y dispone de un movimiento viable. Indicar que avanzar o retirarse normalmente impide cargar salvo una excepción aplicable.
- Si la medida supera 12″, mostrar «Objetivo fuera del alcance para seleccionarlo»; un bonus a la tirada no amplía ese límite.
- Para 2″ o menos, avisar que hay que comprobar enfrentamiento y alturas; no presentar una carga estándar al mismo nivel como garantizada.
- Tabla principal de referencia 3″–12″. Debe reflejar modificador y repetición seleccionados y estar rotulada como probabilidad condicionada al contexto.
- Resultado y errores asociados a los controles de forma accesible; no mostrar un porcentaje anterior como válido cuando haya una entrada incompleta o inválida.
- Explicar que una distancia suficiente no certifica superar terreno, cumplir coherencia ni terminar trabado con los objetivos.

### 3. Cálculo condicionado a un 6 observado

Preservar esta utilidad en un modo claramente separado:

- «Un dado observado es 6; falta conocer el otro»: distribución inicial D6+6.
- No afirmar que observar un 6 otorga permiso para fijarlo o conservarlo.
- Si una repetición completa está permitida y la primera tirada no alcanza, volver a 2D6.
- Con p6 = P(D6+6 modificada alcanza d) y p2 = P(2D6 modificada alcanza d), usar p6 + (1-p6)p2.
- A 9″ sin modificadores, el modo condicionado da 66,67%; con repetición completa da 75,93%, frente al 88,89% que produce ahora conservar el 6.
- Habilidades que sustituyan dados o permitan conservarlos requieren revisión de su texto y condiciones antes de incorporarlas.

### 4. Documentación

Añadir `docs/math/wh40k-charge.md` y enlazarlo desde el índice matemático. Explicar la distribución, mediciones decimales, modificadores, repetición completa y condicionamiento por un dado observado.

Los textos originales, UUID y procedencia del MCP permanecen en el registro privado de revisión. La documentación distribuible y el producto usan explicaciones propias. No añadir una dependencia del MCP al navegador.

## Validación y criterios de aceptación

Actualizar los tests del caso de uso y del hook; añadir pruebas de interacción de `ChargeCalculator`.

| Caso | Resultado esperado |
| --- | --- |
| 3″, sin modificadores | 35/36 = 97,22%; doble 1 insuficiente. |
| 7″, sin modificadores | 21/36 = 58,33%. |
| 9″, sin modificadores | 10/36 = 27,78%. |
| 9,1″, sin modificadores | 6/36 = 16,67%; no redondear a 9″. |
| 12″, sin modificadores | 1/36 = 2,78%. |
| Más de 12″ | Objetivo fuera del alcance de selección, también con bonus. |
| 3″, modificador +1 autorizado | 100% condicionado a legalidad y movimiento viable; doble 1 modificado alcanza 3. |
| 12″, modificador +2 autorizado | 6/36 = 16,67%; distribución modificada nunca supera 12. |
| 9″, repetición completa | 155/324 = 47,84%. |
| 9″, un 6 observado y repetición completa | 41/54 = 75,93%; no conservar el dado observado. |
| Entrada vacía, NaN, infinito o negativa | Error claro, sin resultado válido visible. |
| Objetivo a 2″ al mismo nivel, unidad ya trabada, avance o retirada sin excepción | La interfaz no presenta el cálculo como una carga estándar elegible. |

Comprobar además normalización de distribuciones, límites 1–12 tras modificadores, probabilidades entre 0 y 1, cambios de modo y actualización de la tabla. Las pruebas de monotonía se aplican solo a distancias y escenarios elegibles.

Validación prevista: Jest del caso de uso compartido; Vitest del hook, componente y navegación de la pestaña; compilación web y revisión visual en anchura móvil y escritorio. No ampliar a otras calculadoras si no cambia una dependencia compartida.

## Fuera de la primera implementación

- Resolver geometría, alturas, terreno, coherencia y cargas múltiples.
- Aplicar automáticamente reglas de facción o habilidades por nombre.
- Modificar la distancia máxima del movimiento, incluida la penalización por alzar el vuelo, como si fuera un modificador de la tirada.
- Tiradas distintas de 2D6, sustitución de resultados, multiplicaciones o divisiones sin una ampliación revisada.
- Publicar, desplegar o modificar la aplicación móvil: no hay una pantalla de carga móvil localizada en esta revisión.

## Registro de revisión

Evidencia consultada mediante `buscar_app` y `leer_registro_app`, de la app oficial importada 2.7.1, datos 972. La confirmación corresponde a esa copia del MCP, no certifica versiones posteriores.

Registro local privado: `.codex_tmp/charge-rules/evidence-2026-10-14.json`, cubierto por la exclusión existente de `.codex_tmp/`.

Validación completada el 14 de octubre de 2026:

- Jest: 32 pruebas del caso de uso compartido aprobadas.
- Vitest: 16 pruebas aprobadas entre hook (5), componente de carga (7) y navegación/escenario de la aplicación (4).
- Compilación web: TypeScript y Vite completados correctamente.
- Revisión visual de la vista previa en escritorio y anchura móvil de 390 px: controles apilados y tabla de dos columnas en móvil, sin desbordamiento horizontal (375 px de contenido y 375 px de ancho desplazable).
- Borradores vacíos/incompletos siguen visibles tras perder foco; el resultado y la tabla se ocultan hasta corregirlos.

El contrato usa `observedSix` en lugar de `lockedSix` para expresar la observación sin atribuir permiso para fijar dados. No quedan consumidores de `lockedSix` en el código revisado. Las distribuciones devueltas describen la primera tirada, natural y modificada; la probabilidad incorpora la política de repetición.

La evidencia original permanece excluida de Git. La primera implementación se publicó en el commit `a07b263`, con despliegue de GitHub Pages y comprobación de decimales y repetición en producción.

### Revisión de usabilidad solicitada por Iván

Se simplifica la pantalla para priorizar el uso: resultado inmediato, entrada de distancia y casilla «Repetir carga». Se retira la confirmación previa de contexto y se conserva una única nota que explicita el supuesto de carga legal y recorrido viable. Modificador y dado observado pasan a «Opciones», con indicador de ajustes activos al cerrar el desplegable. Las reglas y fórmulas se agrupan al final; la tabla de otras distancias conserva sus accesos directos y redondea los porcentajes para facilitar la lectura. El motor y sus restricciones no cambian.
