# Plan por pantallas del wizard de combate

9 de octubre de 2026 · Plan para Iván · Pantallas 1, 2, 3 y 4 implementadas localmente; revisión entregada el 11 de octubre.

Desarrolla la [investigación del asistente de selección](combat-selection-wizard.md). Alcance inicial: calculadora web de WH40K, con catálogo y entrada manual, conservando Combate, Ataques necesarios y Mejoras y las reglas del motor actual.

## Mapa del recorrido

**1. Atacante → 2. Defensor → 3. Ataque → 4. Revisar → Informe.**

El informe es una pantalla independiente, fuera del contador de cuatro pasos. No se calculan probabilidades durante la preparación.

| Pantalla | Pregunta principal | Acción principal |
| --- | --- | --- |
| Atacante | ¿Quién ataca y cuántas miniaturas participan? | Continuar |
| Defensor | ¿Quién recibe el ataque y en qué estado está? | Continuar |
| Ataque | ¿Con qué armas y en qué condiciones se ataca? | Revisar escenario |
| Revisar | ¿Es este el escenario que quieres calcular? | Generar informe |
| Informe | ¿Qué resultados cabe esperar? | Cambiar una sección o iniciar otro cálculo |

## Elementos comunes

En las cuatro pantallas de preparación:

1. Título del cálculo y selector **Combate / Ataques necesarios / Mejoras**. Cambiar de modo conserva el escenario y revalida las opciones específicas; no añade un paso.
2. Indicador textual **«Paso N de 4 · Nombre»** y acceso a pasos visitados. Los posteriores se habilitan cuando sus requisitos están satisfechos.
3. Encabezado de la pantalla, una frase de ayuda y un bloque principal de decisiones.
4. Resumen breve de lo ya elegido. En móvil, una línea con opción de expandir; en escritorio puede ocupar una columna lateral. No mostrar estadísticas durante la preparación.
5. Acciones al final del contenido. «Atrás» conserva datos y permite volver aunque haya una entrada incompleta. Las acciones deben seguir siendo accesibles con el teclado móvil abierto.

«Continuar» y «Revisar escenario» permiten intentar avanzar y muestran los errores de su pantalla cuando los haya. No depender de un botón deshabilitado sin explicación. Deshabilitar la acción solo durante operaciones que no admitan continuar, como la carga de perfiles imprescindible.

Al entrar en una pantalla, situar el foco en su encabezado. Al fallar la validación, mostrar un resumen con enlaces a los campos y mensajes junto a ellos. Conservar nombres y estados de los controles para teclado y lectores de pantalla.

## Pantalla 1 · Atacante

**Título:** «Elige quién ataca».

**Ayuda:** «Selecciona la unidad y las miniaturas que participan. Elegirás las armas después del defensor».

### Orden del contenido

1. **Buscar unidad atacante.** Buscador por nombre con nombre de unidad y facción en cada coincidencia. Facción opcional, sin selección previa obligatoria. Escribir o recorrer resultados no cambia la unidad aplicada; clic o Enter confirma.
2. **Unidad elegida.** Nombre, facción y acción «Cambiar unidad».
3. **Composición o perfil.** Si se usa una composición del catálogo, mostrar sus miembros y cantidades; resolver una opción única o el valor predeterminado revisado. Si hay varias composiciones, pedir elegir. La variante de miniatura no aparece como una segunda decisión obligatoria cuando la composición ya define los miembros. Para configurar un perfil individual, ofrecer una alternativa explícita y entonces mostrar sus variantes.
4. **Miniaturas que participan.** Cantidad actual, separada de la composición inicial. En escuadras, un ejemplo de resumen sería «Composición inicial: 10 · Participan: 8». No usar la cantidad actual para recalcular silenciosamente la legalidad del equipo inicial.
5. **Resumen de la selección.** Miembros de la composición y equipo de serie si está revisado. Las armas aún no se editan. «Ver características» conserva información bajo demanda.

**Entrada manual:** acceso discreto «Usar entrada manual» en esta pantalla para el escenario completo. Nombre del atacante opcional y cantidad cuando importe al cálculo. Los perfiles de armas se introducen en la pantalla 3; las defensas, en la 2. No introducir una ficha ofensiva obligatoria aquí.

**Acciones:** «Continuar» → Defensor.

### Condiciones para avanzar

- En catálogo, unidad y composición o variante coherentes. No exigir arma, defensor ni contexto del ataque.
- Cantidad válida cuando proceda, sin vacíos ni cantidades incompatibles con la configuración seleccionada.
- En entrada manual, no exigir un nombre ni una unidad del catálogo.
- Si el modo inverso de un perfil individual va a buscar ataques, no pedir aquí una cantidad de ataques ni de portadores que no utilice. Determinar su pertinencia cuando se conozca el alcance del escenario.

### Estados y mensajes

| Estado | Respuesta de pantalla |
| --- | --- |
| Carga | «Cargando perfiles…»; entrada manual accesible. |
| Sin coincidencias | «Sin coincidencias en este catálogo»; permitir modificar búsqueda o entrada manual. |
| Sin catálogo o fallo de carga | Explicación breve, reintento si está disponible y entrada manual. |
| Falta composición o variante | «Elige la composición o el perfil que va a atacar». |
| Cantidad incompleta | «Indica cuántas miniaturas participan». |

**Al cambiar unidad:** restablecer composición, equipo y condiciones ofensivas dependientes. Conservar defensor. Mostrar en el resumen qué elección requiere completarse de nuevo; no ejecutar el cálculo.

## Pantalla 2 · Defensor

**Título:** «Elige quién recibe el ataque».

**Ayuda:** «Configura las miniaturas restantes y sus heridas».

### Orden del contenido

1. **Resumen del atacante**, con «Cambiar atacante».
2. **Buscar unidad defensora**, independiente del buscador atacante.
3. **Unidad elegida, composición o perfil.** Aplicar el mismo criterio de la pantalla 1: la composición define sus variantes; un perfil individual pide una variante cuando hay varias.
4. **Miniaturas restantes.** Cantidad total defensora, con resumen de los grupos cuando exista más de un perfil.
5. **Estado de heridas.** En un perfil individual, mostrar directamente heridas restantes y máximo. En escuadras, mostrar «¿Hay una miniatura herida?»; al activarlo, elegir el grupo/variante correspondiente e indicar sus heridas restantes. Las demás empiezan completas; conservar el límite actual de una sola miniatura inicialmente herida.
6. **Ver defensas.** Resistencia, salvación, invulnerable y otras defensas aplicables del catálogo como consulta. No presentar campos deshabilitados que parezcan editables.
7. **Editar grupos defensivos**, bajo demanda: variante, cantidad, personaje, heridas cuando corresponda y orden de asignación. Mostrar que los grupos forman parte del total.

**Entrada manual:** resistencia, heridas máximas y restantes, salvación y defensas opcionales editables. Añadir perfiles defensivos distintos mediante el mismo apartado de grupos.

**Acciones:** «Atrás» → Atacante; «Continuar» → Ataque.

### Condiciones para avanzar

- Identidad, composición o variante y características defensivas básicas disponibles.
- Cantidades y reparto de grupos coherentes; heridas dentro del máximo de su variante.
- Personajes y miniatura herida respetan las restricciones actuales del escenario.
- Las dependencias que necesiten conocer el arma o el tipo de ataque quedan pendientes para la pantalla 3. No bloquear aquí porque todavía no se ha elegido un modo ofensivo.

**Errores:** señalar la cantidad o el grupo concreto, por ejemplo «Las heridas restantes superan el máximo de esta miniatura» o «Revisa el reparto de miniaturas entre los grupos». No sustituir errores por valores de defensa inventados.

**Al cambiar defensor:** conservar al atacante y su equipo. Restablecer datos defensivos que pertenecían a la unidad anterior, aplicar las heridas iniciales de la nueva selección y revalidar las armas y defensas condicionadas. Los conflictos cruzados se resuelven en Ataque, con un enlace al modo o grupo afectado.

## Pantalla 3 · Ataque

**Título:** «Configura el ataque».

**Ayuda:** «Elige las armas que se usan y completa las condiciones relevantes».

### Orden del contenido

1. **Resumen del enfrentamiento**, con enlaces para cambiar cada lado.
2. **Tipo de ataque:** «A distancia» o «Cuerpo a cuerpo». Determina las armas y condiciones que se muestran. Conservar el equipo guardado al alternar el tipo y comprobar defensas condicionadas.
3. **Armas y equipo.**
4. **Situación del ataque.**
5. **Objetivo del cálculo**, cuando el modo elegido lo requiera.
6. **Ajustes avanzados**, opcionales, con indicador cuando estén activos.

Los bloques aparecen dentro de la misma pantalla; no crear un paso obligatorio por cada arma o casilla. Los editores avanzados pueden expandirse sin cambiar el recorrido.

### Armas y equipo

| Caso | Contenido |
| --- | --- |
| Equipo sencillo revisado | Equipo de serie, alternativas por cantidad de portadores, modos por arma, cupo compartido y resumen de armas resultantes. |
| Perfil del catálogo sin equipo sencillo | Selector de arma/modo y cantidad pertinente. Resolver y mostrar opciones únicas. |
| Equipo avanzado | Grupos de portadores, sus armas y orden de resolución; una segunda arma del mismo grupo no añade miniaturas. |
| Entrada manual | Ataques, habilidad, fuerza, penetración y daño; habilidades soportadas y grupos adicionales si hacen falta. |

Mostrar alternativas como paquetes completos cuando así están revisadas, por ejemplo «Ciclón + Storm Bolter». El resumen cuenta portadores y armas, sin duplicar miniaturas. Los modos alternativos de una misma arma son excluyentes.

Cambiar portadores o supervivientes mantiene una configuración que deja de caber como borrador pendiente. Mensaje: «Este equipo necesita más portadores de los que participan. Revisa sus cantidades». No retirar armas automáticamente.

### Situación del ataque

- Preguntar solo condiciones necesarias para las armas efectivamente seleccionadas: mitad del alcance para Rapid Fire/Melta; contexto completo soportado para Heavy; cobertura cuando proceda; decisiones de Lethal cuando correspondan.
- Las preguntas obligatorias empiezan sin respuesta. «Desconocido» no equivale a «No». Los valores predeterminados existentes que sean supuestos deben ser visibles en la revisión.
- Para grupos con contextos distintos, identificar qué armas o grupo afecta cada respuesta. Compartir una pregunta solo si su respuesta se aplica a todo ese conjunto.
- Mostrar reglas automáticas del catálogo como información. No ofrecer casillas para desactivar arbitrariamente reglas ya aplicadas ni controles para habilidades pendientes que el motor no soporta.
- Si el modo no es compatible con algún defensor, indicar el modo y grupo afectado y ofrecer cambiar el modo o el defensor.

### Objetivo del cálculo

| Modo | Contenido específico |
| --- | --- |
| Combate | Una activación con el equipo seleccionado. En escuadras, el objetivo de bajas puede consultarse en el informe a partir de la distribución calculada. |
| Ataques necesarios contra una miniatura | Fiabilidad deseada; se busca la cantidad de ataques individuales. No pedir esa cantidad como entrada. |
| Ataques necesarios contra escuadras | Objetivo de bajas, fiabilidad y unidad de búsqueda compatible: ataques, miniaturas o activaciones según permita el escenario actual. Equipo mixto conserva la búsqueda por activaciones. |
| Mejoras | Mostrar el alcance de la comparación actual y sus opciones soportadas; no pedir configurar manualmente cada resultado de la comparación. |

**Ajustes avanzados:** modificadores externos, repeticiones y habilidades manuales permitidas. Respetar exclusiones de las políticas de repetición y condiciones de aplicación. Mantener diferencias entre perfiles si el escenario las contiene.

**Acciones:** «Atrás» → Defensor; «Revisar escenario» → Revisar.

### Condiciones para avanzar

- Toda arma tiene perfil y modo válidos y pertenece a la configuración seleccionada.
- Cantidades, alternativas, cupos y grupos son coherentes.
- Contexto obligatorio completo para cada arma pertinente.
- Compatibilidad comprobada con todos los grupos defensivos, incluidas defensas condicionadas.
- Opciones del cálculo inverso válidas, cuando existan.
- Una omisión admitida por la política actual no impide llegar a revisión: allí se muestra y, si corresponde, se acepta antes de calcular.

## Pantalla 4 · Revisar

**Título:** «Revisa el escenario».

**Ayuda:** «Comprueba las selecciones antes de generar el informe».

### Orden del contenido

1. **Tipo de informe y alcance:** Combate / Ataques necesarios / Mejoras; contra una miniatura o escuadra; una activación u horizonte que corresponda.
2. **Atacante:** unidad, composición inicial y participantes; «Cambiar atacante».
3. **Defensor:** unidad, variantes, miniaturas restantes, herida inicial y orden de asignación relevante; «Cambiar defensor».
4. **Ataque:** tipo, armas/modos y portadores, orden de resolución, condiciones y ajustes activos; «Cambiar ataque».
5. **Objetivo:** fiabilidad, bajas y unidad de búsqueda si corresponden; «Cambiar objetivo» abre el apartado pertinente de Ataque.
6. **Alcance y habilidades omitidas:** un único aviso agregado, con detalle por perfil o regla. No repetir las mismas omisiones en varias tarjetas.
7. **Acción final:** «Generar informe».

**Texto de omisiones:** «Este cálculo omite habilidades del perfil». El informe llevará «Cálculo parcial» si procede. Mantener la política actual: omisión automática para una miniatura y aceptación expresa para escuadras. Trasladar a esta pantalla la aceptación que ya existe; no añadir otra confirmación general ni cambiar esta política como parte del wizard.

La aceptación de escuadras se conserva solo mientras el conjunto efectivo de omisiones siga siendo el aceptado. Si cambia, mostrar el nuevo conjunto y pedir la aceptación exigida por el comportamiento actual.

**Acciones:** «Atrás» → Ataque; enlaces «Cambiar» → pantalla correspondiente; «Generar informe» → Informe.

### Al generar el informe

1. Validar de nuevo el escenario completo contra la revisión actual del catálogo.
2. Si falta algo, enlazar el error con su pantalla; no iniciar el motor.
3. Capturar el escenario efectivo y las opciones del informe como una copia independiente del borrador.
4. Ejecutar el cálculo y abrir la pantalla de informe con su estado de carga.

El botón permite mostrar los errores pendientes al pulsarlo; evitar bloqueos sin explicación. Durante la generación, impedir solicitudes duplicadas.

## Pantalla 5 · Informe

**Título:** «Informe de combate», «Informe de ataques necesarios» o «Informe de mejoras».

Se presenta como resultado del recorrido, sin «Paso 5 de 4» ni formulario de configuración completo encima.

### Orden del contenido

1. **Escenario calculado:** ambos lados, cantidades y tipo de ataque. Accesos «Cambiar atacante», «Cambiar defensor» y «Cambiar ataque».
2. **Alcance:** etiqueta de cálculo parcial y acceso a las omisiones cuando corresponda.
3. **Resultado principal** según el tipo de informe.
4. **Estadísticas y distribuciones existentes**, conservando su contenido y significado.
5. **Cómo se calcula y supuestos**, bajo demanda.
6. **Compartir resultado**, en los informes que ya lo soportan; compartir la misma copia calculada, con sus límites.
7. **Nuevo cálculo**, como acción secundaria para iniciar un escenario nuevo.

| Informe | Resultado principal | Información adicional |
| --- | --- | --- |
| Combate contra una miniatura | Probabilidad de eliminar y heridas perdidas esperadas. | Daño potencial, moda, mediana, rango central, alguna herida y distribución actuales. |
| Combate contra escuadra | Bajas medias y probabilidad de eliminar la escuadra. | Supervivientes, heridas perdidas, objetivo de bajas y distribución. |
| Ataques necesarios | Cantidad mínima y fiabilidad alcanzada, con la unidad de búsqueda identificada. | Probabilidad con una cantidad menos, objetivo y límites; estados de imposibilidad o límite conservan su significado. |
| Mejoras | Comparación ofensiva con la base y recomendación actual. | Defensa separada, diferencias y detalle disponible para el alcance actual. |

Consultar otro objetivo de bajas en Combate usa la distribución ya calculada; no cambia el equipo ni necesita ejecutar de nuevo el motor. En Ataques necesarios, cambiar el objetivo sí requiere confirmar otro cálculo.

### Estados del informe

| Estado | Pantalla y acciones |
| --- | --- |
| Calculando | «Generando informe…», resumen del escenario y posibilidad de volver a revisar. No mostrar cifras del informe anterior. |
| Disponible | Métricas, estadísticas y acciones de edición. |
| Parcial | Resultado disponible con etiqueta y detalle de omisiones. |
| Imposible | Explicación específica y acceso para cambiar el ataque u objetivo. |
| Límite alcanzado | Mostrar solo lo obtenido y el límite; no anunciar una solución mínima que no se ha demostrado. |
| Error de ejecución | Explicación y «Reintentar» cuando proceda, además de «Revisar escenario». No presentar daño cero. |
| Selección caducada por cambio de catálogo | Solicitar revisar las selecciones afectadas; conservar el resto y no recalcular silenciosamente con otro perfil. |

Volver a revisión mientras se calcula cancela el trabajo o descarta su respuesta. Una respuesta tardía nunca reemplaza otro escenario confirmado.

## Recorridos de edición

| Acción desde revisión o informe | Destino | Regreso |
| --- | --- | --- |
| Cambiar atacante | Pantalla 1, con la selección actual. | Si solo cambia cantidad y el equipo sigue válido, volver a revisión; si cambia unidad o quedan conflictos, completar las secciones afectadas. |
| Cambiar defensor | Pantalla 2, conservando atacante y equipo. | Volver a revisión si todo sigue válido; abrir Ataque si algún modo o defensa condicionada necesita corregirse. |
| Cambiar ataque u objetivo | Pantalla 3, con sus valores actuales. | Revisar → Generar informe. |
| Cancelar edición | Acción disponible al editar desde un informe confirmado. | Restaurar la copia confirmada y volver al informe correspondiente. |
| Nuevo cálculo | Pantalla 1. | Preparación completa; conservar la disponibilidad del catálogo y el tipo de informe elegido. |

Cuando se edita desde el informe, la acción principal pasa a **«Guardar y revisar»**. Permite regresar a revisión sin atravesar pantallas válidas; si hay dependencias incompletas, indica a cuál se debe ir. El progreso de la edición no modifica la copia confirmada.

Mientras se edita, indicar «Preparando cambios» y no mostrar resultados anteriores como si pertenecieran al borrador. Si se cancela, vuelve el informe anterior. «Nuevo cálculo» inicia un borrador vacío para catálogo o con valores manuales explícitos; no hereda silenciosamente armas, cantidades, condiciones ni aceptación de omisiones del combate anterior.

## Dependencias y conservación de datos

| Cambio | Se conserva | Se revisa o restablece |
| --- | --- | --- |
| Unidad atacante | Defensor y opciones generales pertinentes. | Composición y equipo atacante, modos y contexto ofensivo dependiente. |
| Composición inicial atacante | Defensor. | Equipo de serie y límites de la nueva composición. |
| Participantes atacantes | Equipo elegido como borrador. | Reparto de portadores; no eliminar alternativas que dejan de caber. |
| Unidad defensora | Atacante y equipo. | Composición defensora, variantes, heridas y compatibilidad cruzada. |
| Miniaturas defensoras restantes | Perfiles elegidos. | Cantidades de grupos, herida inicial y objetivo de bajas. |
| Tipo de ataque | Equipo guardado y unidades. | Armas activas, contextos y defensas condicionadas. |
| Modo de un arma | Otros modos, portadores y ambos lados. | Elegibilidad, contexto pertinente y omisiones efectivas de esa arma. |
| Tipo de informe | Selecciones compartidas. | Opciones y validez específicas del nuevo informe. |

No perder el texto de una entrada vacía o inválida al cambiar de pantalla. Registrar errores por campo y conservar los borradores necesarios; corregir un campo no da por válida toda la sección. Separar errores locales de dependencias que todavía no pueden evaluarse.

## Entrega y comprobación por pantalla

| Entrega | Trabajo | Comprobación de aceptación |
| --- | --- | --- |
| Estructura del recorrido | Navegación, resumen, borrador y copia confirmada. | Atrás conserva datos; acceso a pasos visitados; preparación sin ejecutar probabilidades. |
| Atacante | Separar buscador, composición y cantidad del equipo ofensivo. | Se completa sin defensor ni arma; opciones únicas visibles; cambio de unidad conserva defensor. |
| Defensor | Separar selección, cantidades, herida inicial y grupos defensivos. | Composición sin variante redundante; límites de heridas y grupos; conservar atacante. |
| Ataque | Reunir equipo, modos, condiciones y opciones específicas. | Equipo mixto sin duplicación, cupo y exclusión de modos; contexto por arma; compatibilidad con todos los defensores. |
| Revisar | Resumen, edición directa y omisiones. | Una omisión por regla/perfil efectivo; aceptación vigente cuando corresponda; validación completa antes de confirmar. |
| Informe | Presentación separada y ejecución sobre escenario confirmado. | Resultados equivalentes a los actuales; estados de límite/error; cancelación y respuestas tardías; compartir coherente. |
| Integración final | Tres tipos de informe, entrada manual, móvil y accesibilidad. | Cambios de calculadora conservan selecciones; teclado y foco; 320/375/768/1280 px, zoom y teclado móvil. |

Primero preparar un prototipo navegable con dos recorridos: un perfil individual sencillo y una escuadra con equipo mixto. Valorar claridad de los cuatro pasos y rapidez de edición desde el informe antes de implementar el cambio completo.

La implementación seguirá con Combate y después integrará Ataques necesarios y Mejoras en la misma estructura. Verificar pruebas de interacción, tipos y compilación, y conservar las suites existentes. No ampliar catálogo, fórmulas, historial o persistencia como requisito de este recorrido.

## Estado de la entrega de la pantalla 1

La pantalla del atacante está implementada localmente por indicación de Iván. WH40K abre con su buscador, selección de composición o perfil individual, cantidad participante, consulta de características y resumen. En móvil, el resumen comienza plegado; las entradas numéricas incompletas se conservan al perder foco o cambiar de calculadora y bloquean «Continuar».

La composición puede seleccionarse antes del defensor aunque sus armas tengan condiciones de objetivo. No se ejecuta el motor de probabilidades mientras esta pantalla está abierta. El equipo de serie revisado se muestra como información y las alternativas guardadas se conservan al modificar participantes; las incompatibilidades de portadores se corrigen en la configuración posterior.

La entrega inicial enlazaba «Continuar» con el formulario existente. Ahora enlaza con las pantallas 2 y 3 descritas a continuación.

Validación realizada: pruebas de interacción del primer paso y de integración con las calculadoras, pruebas de composición/equipo compartidas, tipos y compilación web. Revisión visual e interacción real en escritorio y móvil: selección, cantidades vacías, continuación y regreso. Las capturas de revisión se guardan localmente en `.codex_tmp/wizard-attacker`.

## Estado de la entrega de las pantallas 2 y 3

Por indicación de Iván, «Continuar» abre ahora Defensor y después Ataque. El defensor reúne búsqueda, composición o perfil individual, miniaturas restantes, una miniatura herida y edición de grupos. Se resuelve sin exigir un arma; las condiciones cruzadas se comprueban en Ataque. Cambiar defensor conserva al atacante y su equipo.

Ataque muestra tipo de ataque, armas y equipo, modos, condiciones pertinentes, grupos ofensivos y ajustes avanzados. Las alternativas de equipo conservan sus portadores, paquetes y cupos; alternar disparo y cuerpo a cuerpo conserva las alternativas. Un perfil individual recuerda el modo elegido para cada tipo. Las condiciones comunes del equipo sencillo se solicitan también si solo las necesita un arma alternativa; los grupos avanzados conservan condiciones por arma.

Combate, Ataques necesarios y Mejoras comparten el recorrido. Ataques necesarios muestra fiabilidad y, en escuadras, bajas y unidad de búsqueda; el equipo mixto mantiene la búsqueda por activaciones. Las omisiones permitidas llegan a revisión sin pedir aceptación anticipada.

Los campos numéricos conservan sus borradores incompletos al perder foco, volver atrás o cambiar de calculadora. La validación registra cada campo activo: corregir otro campo no elimina un error pendiente. Los pasos anteriores son accesibles desde el indicador; los encabezados y resúmenes de error reciben foco.

La entrega de las pantallas 2 y 3 incluía un enlace provisional «Escenario preparado» → «Abrir cálculo». La pantalla 4 lo sustituye ahora por la revisión completa descrita a continuación. No se ejecuta el motor durante las cuatro pantallas de preparación; no se han añadido persistencia de escenarios ni nuevas fórmulas.

Validación: pruebas de interacción del wizard, conservación de las suites de las calculadoras y del catálogo, tipos y compilación web. Capturas de escritorio y móvil en `.codex_tmp/wizard-defender-attack`.

## Estado de la entrega de la pantalla 4

Por indicación de Iván, «Revisar escenario» abre ahora «Revisa el escenario». Incluye tipo de informe y alcance, atacante con composición inicial y participantes, defensor con grupos, heridas y orden efectivo de asignación, armas y modos con portadores y orden, condiciones relevantes, consulta de ajustes y objetivo específico de Ataques necesarios. Las armas del mismo grupo identifican sus portadores compartidos.

Los accesos «Cambiar» abren directamente su sección. «Guardar y revisar» regresa a revisión cuando los datos y sus dependencias siguen válidos; si queda una sección pendiente, abre Defensor o Ataque para completarla. «Cambiar objetivo» sitúa el foco en el objetivo de Ataque. Los borradores numéricos incompletos de otras pantallas se conservan y no se sustituyen por su último valor válido al confirmar.

Las omisiones aparecen en un único aviso con detalle por regla. Se mantienen las políticas existentes: aceptación automática para un cálculo individual y casilla explícita para escuadras. Cambiar el conjunto efectivo de omisiones invalida la aceptación anterior; cambiar cantidades sin modificar ese conjunto la conserva.

«Generar informe» valida otra vez las identidades contra el catálogo actual, defensas, grupos, perfiles, condiciones y opciones. Los errores enlazan con la pantalla que los corrige. Solo después captura una copia independiente del escenario efectivo, modo y fiabilidad y monta la calculadora correspondiente. Cambiar el borrador o retirar el catálogo después no altera esa copia ni recalcula el informe confirmado. La consulta de otro objetivo de bajas en Combate utiliza la distribución calculada.

La conexión reutiliza los resultados existentes sin el formulario editable encima. La presentación completa de Informe, resumen del escenario calculado, cancelar edición, nuevo cálculo y sus estados y acciones siguen siendo la siguiente entrega del plan.

Validación: 207 pruebas web, incluidas nueve nuevas de revisión y confirmación; tipos y compilación. Comprobación real con exterminadores, equipo mixto e intercesores con una miniatura herida: confirmación de omisiones, informe y regreso directo tras editar participantes. Revisión visual a 1280 px y móvil a 375/320 px, sin desbordamiento horizontal y con acciones de al menos 44 px. Capturas en `.codex_tmp/wizard-review`.

## Estado de la entrega de Informe

Por indicación de Iván, Informe completa el wizard: encabezado propio por modo, resumen del escenario confirmado con nombres y cantidades, accesos directos a las selecciones y resultados sin formulario ni indicador de pasos. Las omisiones aparecen antes del resultado con detalle desplegable; las estadísticas y distribuciones existentes se mantienen, y los supuestos de cálculo se consultan después.

La consulta de bajas en Combate utiliza la distribución confirmada sin repetir el motor. Compartir conserva nombres, objetivo consultado, perfiles efectivos, alcance y omisiones tanto en texto como en imagen. Ataques necesarios distingue éxito, imposible y límite; una búsqueda limitada muestra la cantidad comprobada sin presentarla como mínimo demostrado. Mejoras mantiene la comparación ofensiva y la defensa por separado.

Durante la edición se muestra «Preparando cambios». «Cancelar edición» restaura selecciones, entradas numéricas, condiciones, nombres, objetivo y modo confirmados y recupera el resultado anterior. «Nuevo cálculo» abre Atacante con selecciones y aceptación vacías, conserva el catálogo disponible y el modo de informe, y vuelve al recorrido normal. La entrada manual comienza con valores educativos explícitos.

El trabajo pendiente se cancela al volver a revisión; las respuestas tardías se descartan. Los errores no muestran estadísticas cero y permiten reintentar el escenario confirmado. Si cambia el catálogo, el informe conserva sus perfiles originales y avisa de que las selecciones requieren revisión antes de otra confirmación.

Validación: pruebas de ciclo completo, edición y cancelación, nuevo cálculo manual y de catálogo, error y reintento, estados inversos imposible y limitado, respuestas tardías y exportación parcial. Los motores compartidos pasan 574 pruebas. Compilación de producción con base `/ludomaths/` y comprobación de los catálogos piloto publicados. Las capturas del informe se guardan localmente en `.codex_tmp/wizard-report`.

Cierre de validación: 216 pruebas web correctas y 574 pruebas compartidas correctas. Recorrido real de los tres informes con equipo mixto; cancelación de una cantidad incompleta; revisión visual a 320, 375, 768 y 1280 px sin desbordamiento horizontal y con acciones de al menos 44 px. No se publican datos del catálogo local ampliado: GitHub Pages mantiene los tres catálogos piloto ya autorizados.
