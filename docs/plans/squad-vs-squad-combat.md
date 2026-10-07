# Cálculo de escuadra contra escuadra

Plan autorizado e implementado en la web el 7 de octubre de 2026. Se conserva la propuesta original como referencia de alcance.

## Estado de la entrega

Las cinco entregas están implementadas: contadores visibles, composición y varias armas por grupo, defensores mixtos y heridos, resultados por bajas, Ataques necesarios, Mejoras y resumen compartido. Los cálculos de escuadra se ejecutan fuera del hilo de la pantalla y se cancelan al cambiar el escenario.

Las composiciones inequívocas del catálogo sugieren cantidades mínimas; las cantidades actuales siguen siendo editables. Los perfiles de todos los grupos se revisan conjuntamente y las reglas omitidas requieren aceptación explícita. La pantalla permite ordenar grupos; aplica primero las prioridades obligatorias de asignación y reúne los ataques idénticos en su primera posición.

El nuevo motor calcula distribuciones exactas dentro de un presupuesto explícito: hasta 100 miniaturas por lado, 500 heridas iniciales, 20 grupos de armas y 20 grupos defensores; hasta 300 impactos posibles y 20 activaciones. El coste de estados también puede limitar escenarios menores. Se admite una miniatura inicialmente herida. Las mortales adicionales genéricas, los dados observados, las repeticiones de salvación y las unidades adjuntas requieren soporte posterior. El caso simple contra una miniatura conserva su recorrido existente.

Verificación: enumeración exhaustiva independiente de casos pequeños, conservación de probabilidad, comparación con el caso de una miniatura, cantidades compartidas entre vistas, búsquedas mínimas, cancelación de resultados obsoletos y comprobación visual en móvil y escritorio. La interfaz nativa sigue fuera de esta entrega.

## Objetivo y alcance

Poder plantear «atacan mis 10 miniaturas a esas 5» sin calcular ataques ni heridas totales fuera de la aplicación. Configurar la composición y el armamento del atacante, las miniaturas vivas del defensor y su estado, y obtener bajas y probabilidad de eliminar la escuadra.

El recorrido principal será la pantalla web de Combate. El núcleo matemático quedará reutilizable por la aplicación nativa, cuya interfaz se adaptaría en una entrega posterior. El cálculo representará una activación de disparo o combate, con un solo objetivo declarado; las respuestas del enemigo y la simulación de turnos completos quedan fuera de este plan.

## Situación actual comprobada en el código

- `CombatScenarioForm` permite declarar «Portadores del arma», pero representa un único perfil y modo de arma. El campo desaparece en Ataques necesarios.
- `CalculateUnitCombatUseCase` admite varios grupos de armas. Su ruta exacta actual produce una distribución de daño contra una miniatura homogénea; no sigue bajas ni heridas por miniatura.
- `singleAttackDamage` suma el daño del ataque original, sus impactos adicionales y otros efectos. Para repartir bajas hará falta conservar la separación y el orden de los eventos, además de sus dependencias probabilísticas.
- `useCombat` calcula la eliminación comparando el daño acumulado con las heridas de una miniatura. Ese umbral no describe por sí solo una escuadra.
- `UnitProfile.wounds` y los porcentajes de `savePools` no identifican qué miniatura recibe cada herida. No bastan como representación del nuevo defensor.
- El catálogo ya contiene variantes, composiciones con cantidades mínimas/máximas y opciones de equipo. Su aplicación al escenario y la sesión compartida siguen seleccionando una sola variante por lado y un modo de arma.
- Combate, Ataques necesarios y Mejoras comparten escenario. El cambio debe contemplar las tres vistas para evitar interpretar una escuadra como una sola miniatura.

## Recorrido propuesto

### Atacante

1. Elegir unidad y declarar **Miniaturas que atacan** en un campo visible, con entrada directa y botones de aumentar/disminuir.
2. Usar «Todas con el mismo equipo» como recorrido sencillo. La cantidad del arma se sincroniza con la cantidad de miniaturas.
3. Ofrecer «Equipo diferente» para crear grupos de miniaturas: por ejemplo, 8 con equipo básico y 2 con equipo especial.
4. Dentro de cada grupo, elegir las armas y modos que se emplean en esta activación. Una miniatura puede tener varias armas; no se debe validar la composición sumando todos los portadores de todas las armas.
5. Mostrar un resumen de miniaturas participantes y ataques por arma. Para ataques variables, mostrar la expresión y su media identificada como tal, no una cifra fija.

El número indica las miniaturas que participan en la activación. No se deduce automáticamente del tamaño original de la unidad ni de condiciones espaciales que la aplicación no conoce.

### Defensor

1. Elegir unidad y declarar **Miniaturas restantes** en otro campo visible.
2. Mostrar heridas por miniatura y permitir indicar una miniatura ya herida, con sus heridas restantes. Las demás comienzan completas.
3. En la entrega de perfiles mixtos, permitir grupos con características distintas e identificar la miniatura herida y el orden de asignación.
4. Mantener las características del catálogo como referencia y ofrecer el mismo recorrido con entrada manual.

### Resultado

Priorizar **bajas medias**, **probabilidad de eliminar toda la escuadra** y una distribución de bajas de 0 a N. Añadir probabilidad de conseguir al menos una cantidad elegida de bajas, miniaturas supervivientes medias y heridas efectivamente perdidas. Presentar el daño potencial como información secundaria.

El encabezado del resultado debe describir el escenario: «10 atacantes contra 5 defensores», armas empleadas y contexto relevante. Compartir el resultado conservará cantidades, estado inicial, orden y limitaciones del cálculo.

## Entregas y dependencias

| Entrega | Trabajo | Criterio para considerarla terminada |
| --- | --- | --- |
| 1. Diseño y contrato | Boceto de la pantalla, ejemplos de uso y especificación de reglas de asignación | Se puede recorrer un caso sencillo y otro con armas distintas sin hacer cuentas externas; cada regla matemática tiene una fuente y un caso de prueba |
| 2. Motor de escuadras | Estado de miniaturas y resolución secuencial de eventos contra defensor homogéneo | Calcula bajas y heridas restantes, conserva probabilidades y coincide con casos pequeños comprobables |
| 3. Pantalla de Combate | Contadores por lado, grupos de equipo, catálogo/manual y nuevos resultados | Caso de 10 contra 5 completo y utilizable en móvil; varias armas y una miniatura herida funcionan |
| 4. Defensores mixtos | Distintos perfiles defensivos y política explícita de asignación | Puede resolver una escuadra con dos perfiles distintos sin usar porcentajes de salvación como sustituto |
| 5. Otras calculadoras | Adaptar Ataques necesarios y Mejoras, compartir y cerrar regresiones | Las tres vistas interpretan el mismo escenario y muestran métricas de escuadra coherentes |

Las entregas 2 y 3 forman la primera versión utilizable. Las entregas 4 y 5 completan el alcance del plan. Los defensores mixtos no se convertirán silenciosamente en un perfil medio mientras se desarrolla su soporte.

### 1. Diseño y contrato de reglas

- Preparar un boceto para pantalla estrecha y escritorio: atacante, defensor, situación y resultado. Las cantidades principales deben estar visibles sin abrir ajustes avanzados.
- Verificar contra fuentes oficiales de la edición y versión del catálogo utilizadas: asignación a miniaturas heridas, exceso de daño, eventos que puedan pasar a otra miniatura, mortales, devastadoras, impactos adicionales y orden de resolución.
- Documentar cómo se fija el orden de los grupos de armas. Ofrecer un orden explícito y reproducible; no anunciar un orden óptimo si no se ha calculado.
- Revisar las reglas cuya relevancia cambia con el tamaño de la escuadra. Cuando una habilidad requiera el número de objetivos, el contexto debe proporcionarlo; las habilidades sin soporte seguirán identificadas como omisiones o bloqueos según su impacto.
- Separar validación del escenario de validación de lista: comprobar cantidades y referencias, y aplicar restricciones de composición/equipo solo cuando los datos y reglas revisados permitan verificarlas. No certificar una lista legal por haber podido calcularla.

Esta fase determina el comportamiento normativo. La lectura del código actual no se toma como una verificación de las reglas del juego.

### 2. Modelo y motor

- Introducir un escenario de escuadras con grupos de miniaturas atacantes, sus armas elegidas y cantidades; grupos defensores con cantidad, heridas máximas, perfil y estado inicial; contexto y orden de resolución.
- Mantener un adaptador del escenario de una miniatura para comprobar compatibilidad con las calculadoras existentes.
- Crear una resolución de eventos que conserve cada paquete de daño y sus efectos asociados. No reutilizar directamente la suma de `singleAttackDamage` para decidir bajas.
- Propagar una distribución de estados: miniaturas eliminadas, heridas de la miniatura activa y, cuando corresponda, grupo defensor activo. La eliminación completa será un estado absorbente.
- Conservar las dependencias entre resultado crítico, impactos adicionales y efectos asociados; no multiplicar probabilidades como si fueran sucesos independientes.
- Obtener la distribución de bajas y heridas perdidas del estado final. Cualquier métrica de daño potencial tendrá una definición separada y visible.
- Agrupar estados equivalentes y reutilizar transiciones para limitar el coste. Establecer presupuestos de cálculo medidos con casos representativos; al superarlos, devolver un límite explícito.
- Medir la respuesta con escuadras de 5, 10 y 20 miniaturas y varias armas. Si el cálculo afecta a la interacción, ejecutarlo fuera del hilo de la interfaz y descartar resultados anteriores cuando cambie el escenario.

### 3. Integración con la pantalla y el catálogo

- Sustituir los parámetros planos como representación principal de la nueva sesión por el escenario de escuadras, conservando la conversión de los casos antiguos.
- Resolver cada grupo de equipo y cada perfil defensor contra la misma versión del catálogo. Revisar habilidades y compatibilidad de objetivos por grupo, sin perder las omisiones agregadas.
- Usar la composición del catálogo como ayuda cuando sea inequívoca. Pedir selección entre composiciones si hay alternativas; permitir declarar cantidades actuales tras bajas.
- Al cambiar cantidad o unidad, reconciliar grupos y equipo de forma visible: no aumentar armas especiales ni eliminar decisiones del usuario sin indicarlo.
- Validar enteros, cantidades positivas y heridas restantes dentro de sus máximos. Ofrecer retirar un grupo; un grupo vacío no será una selección incompleta invisible.
- Actualizar resúmenes, textos en español/inglés, ejemplos y tarjeta de compartir. Conservar cantidades al alternar calculadoras dentro de la sesión.
- Hasta la entrega 5, las calculadoras aún no adaptadas indicarán su alcance y no consumirán el escenario de escuadra como si fuera de una miniatura.

### 4. Perfiles defensivos distintos

- Extender el estado a grupos con salvaciones, heridas y otras características distintas.
- Permitir elegir un orden fijo de asignación compatible con las reglas revisadas y respetar la miniatura ya herida.
- Recalcular las probabilidades aplicables cuando cambie el perfil que recibe el evento, según la etapa y el momento definidos por las reglas.
- Identificar el orden como un supuesto del resultado. La optimización automática de decisiones del defensor, unidades adjuntas y reglas de asignación especial requieren soporte adicional; no quedan implícitas en esta entrega.

### 5. Ataques necesarios y Mejoras

- Para un arma homogénea, permitir buscar ataques individuales necesarios para conseguir al menos K bajas o eliminar la escuadra con una fiabilidad elegida, usando el nuevo motor.
- Ofrecer también «Miniaturas necesarias» cuando se mantiene un único equipo por atacante: buscar el mínimo de participantes completos, incluyendo ataques variables. Comprobar la probabilidad del número anterior.
- Para armamento mixto, evitar una cifra ambigua de «miniaturas necesarias»: mantener la composición declarada y ofrecer, si se incorpora esta búsqueda, activaciones completas del mismo conjunto como unidad de repetición claramente definida. No buscar una mezcla óptima de armas en esta entrega.
- Comparar mejoras sobre el mismo escenario y con bajas, heridas perdidas y probabilidad de eliminación. Explicitar a qué grupos se aplica cada mejora.
- Cualquier repetición debe definir sus supuestos de contexto y evolución del defensor; no representar automáticamente rondas completas ni bajas del atacante.

## Verificación y aceptación

- Casos deterministas que distingan paquetes de daño de daño sumado, con resultados esperados derivados de las reglas verificadas en la entrega 1.
- Una miniatura herida y varias completas; armas de distinto daño y órdenes distintos; ataques variables; FNP y habilidades críticas admitidas.
- Enumeración exhaustiva de casos pequeños como referencia independiente. Probabilidades no negativas que suman 1 dentro de tolerancia, bajas limitadas por miniaturas vivas y heridas perdidas limitadas por el estado inicial.
- Regresión con un defensor de una miniatura. Investigar diferencias respecto al motor actual: documentar correcciones de reglas cuando proceda, en lugar de preservar un resultado incorrecto para que pase la prueba.
- Pruebas de catálogo con datos sintéticos: cantidades, varios modos, selecciones incompatibles, revisión parcial y cambio de versión sin reutilizar selecciones inválidas.
- Pruebas de interfaz: recorrido de 10 contra 5, equipo mixto, cambio de cantidad, miniatura herida, campos incompletos, cambio de calculadora y resultado compartido.
- Verificación visual en móvil y escritorio, uso de teclado y etiquetas comprensibles; sin saltos ni resultados obsoletos durante el cálculo.
- Pruebas pertinentes del núcleo y la web, comprobación de tipos y compilación. Documentar los límites de rendimiento medidos y los supuestos de asignación.

## Decisiones propuestas para revisar

1. Empezar por la web y una activación de ataque, con todos los ataques dirigidos a la escuadra seleccionada.
2. Entregar pronto atacante con varias armas contra defensor homogéneo; después añadir defensores mixtos.
3. Mostrar bajas y probabilidad de eliminar la escuadra como resultados principales.
4. Mantener cantidades visibles y un recorrido sencillo para equipo uniforme, con grupos editables para equipo distinto.
5. Dejar reparto entre varios objetivos, selección automática del mejor orden, simulación de batalla, persistencia de listas y adaptación de la interfaz nativa para planes posteriores.

La implementación y los supuestos del motor se describen en `docs/math/squad-combat.md`.
