# Selección sencilla de equipo en escuadras

Investigación y primera entrega implementada en la web el 8 de octubre de 2026.

## Estado de la primera entrega

La escuadra de exterminadores del catálogo local ampliado carga su composición inicial y el equipo de serie. «Otro equipo» añade filas independientes para ciclón + Storm Bolter, lanzallamas pesado o cañón de asalto. Las cantidades comparten el cupo revisado; el equipo restante se calcula automáticamente y un borrador inválido oculta el resumen y bloquea resultados. Se pueden separar portadores de ciclón para elegir Frag y Krak por grupo y ordenar las alternativas.

El resumen reúne las armas por modo sin sumar miniaturas de más. La composición conserva al sargento; las alternativas de disparo se ofrecen a exterminadores ordinarios. Cambiar a cuerpo a cuerpo conserva la selección y aplica el Power Fist de serie. Los cambios de armas de cuerpo a cuerpo y las variantes defensivas siguen usando «Editar grupos manualmente», que conserva el escenario generado.

La semántica se registra mediante una definición propia revisada y vinculada a la identidad y huella exactas del catálogo limpio. Esto permite completar el piloto sin cambiar el contrato v2 ni importar procedencia. No se deduce comportamiento de nombres o descripciones. Los demás catálogos mantienen sus controles existentes; el catálogo publicado no se amplía ni se despliega en esta entrega.

Verificación: pruebas unitarias de conservación de cantidades, sustituciones, cupo compartido, modos, perfiles individuales y equivalencia completa con una activación manual; pruebas de interfaz sobre las tres calculadoras, borradores inválidos, cambios de composición y aceptación de nuevas omisiones; suite web completa, tipos, revisión de código y compilación. Se comprobaron 56 combinaciones del catálogo real con huella validada, cantidades de armas correctas y conservación de probabilidad, y se verificó visualmente la selección y el cálculo en el navegador local.

La propuesta siguiente conserva el alcance de las futuras ampliaciones.

La recomendación es seleccionar una composición, cargar su equipo de serie y editar cantidades por alternativa de equipo. El perfil de miniatura se conserva cuando solo cambian armas. La aplicación convierte esa selección en los grupos que ya entiende el motor de escuadras.

## Ejemplo de uso

Para diez exterminadores, el usuario elige «Lanzamisiles ciclón + Storm Bolter», indica dos portadores y selecciona Frag o Krak. Ve un resumen de diez Storm Bolters y dos ciclones. No necesita crear grupos manualmente ni copiar perfiles. Los portadores de ciclón conservan su Storm Bolter.

| Control | Comportamiento propuesto |
| --- | --- |
| Composición | Carga las variantes y sus cantidades; aplica equipo de serie solo si está revisado y es inequívoco. |
| Equipo de serie | Se muestra ya seleccionado. La cantidad restante se calcula automáticamente. |
| Alternativa de equipo | Selector de una opción completa, por ejemplo «Ciclón + Storm Bolter», y cantidad de portadores. |
| Otra alternativa | Permite combinar distintos equipos en la misma escuadra, respetando sus restricciones compartidas. |
| Modo del arma | Se elige dentro del arma: Frag o Krak. Los modos alternativos no se suman. |
| Resumen | Muestra miniaturas participantes y cantidades de cada arma para el tipo de ataque seleccionado. |
| Edición avanzada | Mantiene los controles manuales actuales para excepciones. |

Disparo y combate cuerpo a cuerpo usan el mismo equipo guardado, pero resuelven solo las armas y elecciones que correspondan al ataque. Cambiar el tipo de ataque no debe borrar la configuración de la escuadra.

## Qué se ha comprobado en el proyecto

- `web/src/catalog/CatalogPanel.tsx` y `web/src/calculators/combat/SquadScenarioControls.tsx` obtienen disponibilidad mezclando las armas de todas las opciones de equipo de una variante. Esa lista permite elegir perfiles individuales, pero no aplica equipo de serie, sustituciones, paquetes ni restricciones compartidas.
- `src/application/dice/catalogComposition.ts` aplica cantidades de la composición; únicamente selecciona automáticamente un modo cuando solo existe uno o conserva uno ya seleccionado. Una composición con varias armas sigue requiriendo selección manual.
- `src/application/dice/squadScenario.ts` ya admite varias armas por grupo de miniaturas. Los grupos adicionales son subconjuntos disjuntos del total; el principal es el resto. Añadir una segunda arma a un grupo no añade miniaturas.
- El motor reúne ataques idénticos procedentes de distintos grupos. No es necesario cambiar las fórmulas para simplificar este flujo.
- `equipmentChoices` conserva opciones y reglas asociadas, pero el contrato actual no expresa de manera ejecutable e inequívoca qué armas sustituye cada alternativa, su equipo resultante ni todos los límites compartidos. El texto de una regla no debe convertirse automáticamente en comportamiento.

## Representación recomendada

Guardar grupos de portadores con variante de miniatura, cantidad, opciones de equipo elegidas y modos seleccionados por arma. Derivar las armas efectivas a partir de una definición de equipo revisada. La selección de modo pertenece a una activación; no modifica qué armas posee la miniatura.

En el ejemplo, conservar los roles de la composición: un sargento con equipo de serie, siete exterminadores con equipo de serie y dos exterminadores con ciclón + Storm Bolter. Para disparar, el motor recibe diez portadores de Storm Bolter y dos de un modo de ciclón. El sargento mantiene su identidad y sus opciones disponibles aunque su perfil defensivo coincida con el de los demás.

La identidad del grupo sirve para aplicar correctamente opciones y reglas. Agrupar perfiles idénticos para resolver ataques no autoriza a ofrecer a un sargento opciones exclusivas de los exterminadores ordinarios.

Usar grupos de equipo permite añadir más adelante elecciones diferentes para portadores de la misma arma. Si los dos ciclones usan modos distintos, la edición avanzada puede separar sus grupos; cada portador sigue usando un solo modo de esa arma por activación.

## Datos de equipo que faltan

Ampliar el contrato limpio, con versión y migración explícitas, para describir:

1. Equipo de serie inequívoco por variante.
2. Alternativas con armas retiradas y armas incorporadas; el resultado completo permite representar paquetes como ciclón + Storm Bolter.
3. Variante resultante cuando el equipo cambia heridas, salvaciones o reglas de miniatura.
4. Elegibilidad por variante, incompatibilidades y restricciones compartidas entre alternativas.
5. Límites estructurados revisados, incluidos límites por bloques de tamaño de unidad.

Mantener IDs propios y explicaciones breves de producto. La evidencia y los identificadores de origen permanecen fuera del catálogo y del repositorio. No inferir sustituciones por nombres, posición de las armas ni análisis automático de descripciones.

Un piloto pequeño puede limitarse a opciones cuyo significado se haya revisado. Las opciones incompletas siguen disponibles por edición manual, sin presentarlas como configuraciones automáticas verificadas.

## Límites y excepciones

Los exterminadores comparten un cupo de arma especial: una por cada cinco miniaturas en la composición inicial. Ciclón, cañón de asalto y lanzallamas pesado consumen ese mismo cupo. No basta con comprobar el máximo de cada alternativa por separado. Dos ciclones corresponden al ejemplo de diez miniaturas.

Separar composición inicial de miniaturas actuales/participantes cuando se reutiliza una escuadra tras bajas: perder miniaturas no debe quitar armas silenciosamente ni recalcular la legalidad de su equipamiento de partida. Para calcular, importan los portadores que aún participan. Al reducir cantidades, conservar una selección que deja de caber como borrador pendiente y pedir corregir sus cantidades; no redistribuirla arbitrariamente.

Si un escudo modifica heridas, conservar la variante defensiva correspondiente. El catálogo local ya contempla variantes de exterminadores de asalto con escudo. Coincidir en resistencia o salvación no basta para fusionar miniaturas: también cuentan heridas, invulnerables, reglas y prioridad de asignación.

Ordenar armas por defecto de forma estable y mantener la posibilidad de cambiar el orden de resolución. No presentar esta selección como un validador completo de listas ni como soporte de reglas de combate que el motor todavía omite.

## Primera entrega recomendada

Implementar primero el flujo de la escuadra de exterminadores: equipo inicial, alternativas de disparo por cantidad, conservación del bolter en el paquete ciclón, modos exclusivos y resumen. Mantener la composición por roles y traducir al escenario actual en la capa de aplicación. Después incorporar cambios de cuerpo a cuerpo y variantes defensivas con escudo.

Antes de implementar, formalizar y revisar la semántica de equipo. Las pruebas deberán cubrir conservación de miniaturas, diez bolters + dos ciclones, sustitución real del bolter por otras armas, cupo compartido, elegibilidad del sargento, exclusión de modos simultáneos, cambios de tipo de ataque, cambios de tamaño y equivalencia con el escenario manual. Los casos con escudo deberán conservar las heridas de la variante.

La primera entrega modifica la calculadora web; conserva el catálogo actual y su contrato.
