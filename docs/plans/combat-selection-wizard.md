# Asistente de selección de unidades e informe

9 de octubre de 2026 · Investigación para Iván · Propuesta pendiente de valoración.

Especificación del recorrido: [plan por pantallas del wizard](combat-wizard-screens.md), con contenido, acciones, validaciones, estados y edición desde el informe.

## Recomendación

Usar cuatro pasos de preparación y una pantalla final de informe:

**Atacante → Defensor → Ataque → Revisar → Informe.**

Cada paso muestra solo sus decisiones y un resumen compacto del escenario. Separar las unidades visualmente, conservar un escenario común y validar sus dependencias. La selección de armas va después del defensor para poder comprobar modos condicionados al objetivo. «Generar informe» confirma los datos y ejecuta el cálculo.

El beneficio esperado es facilitar la configuración inicial y la lectura del resultado, especialmente en móvil. Hay un coste: más navegación para quien hace comparaciones rápidas. Los enlaces de edición desde el resumen y el informe son parte necesaria de la propuesta. Esta mejora de usabilidad es una hipótesis que debe contrastarse con un prototipo; no se ha probado todavía un asistente con usuarios.

## Qué se ha investigado

Se revisaron el formulario web común, los buscadores, composición y equipo, sesión compartida, tres calculadoras, ejecución del cálculo y sus pruebas existentes. También se consultó la pantalla nativa: usa perfiles guardados y navegación separada entre configuración y resultados. La propuesta inicial se centra en la web, donde están las incorporaciones recientes de catálogo y equipo.

Se abrió la web local de desarrollo, con los cambios presentes en el checkout. Se recorrió un combate de cinco exterminadores contra una composición de diez Beast Snagga Boyz, se completó la condición de mitad del alcance y se aceptaron las omisiones que exige actualmente el combate de escuadras. Se comprobó la aparición del informe. Se inspeccionó visualmente a tamaño de escritorio y a 375 × 812 px. En móvil, ese escenario con resultado tenía 3.991 px de alto, aproximadamente 4,9 alturas de ventana. Es una medida de este ejemplo, no de todos los escenarios.

Hallazgos:

- `CombatScenarioForm` reúne selección de ambas unidades, dos contadores, equipo sencillo, características, composición avanzada, condiciones y ajustes. El informe se añade debajo.
- `CatalogPanel` ofrece composición y variante en el mismo bloque. Tras aplicar una composición todavía aparece la variante principal: falta comunicar mejor la diferencia entre una escuadra completa y un perfil individual.
- El equipo sencillo y «Composición y equipo» comparten espacio; el segundo reúne controles avanzados de ambos lados. Es necesario separarlos para aislar los pasos.
- En el ejemplo de escuadras se repite el aviso de habilidades omitidas en el catálogo y en el formulario; el resultado añade además su etiqueta de cálculo parcial.
- Los tres modos comparten `CombatScenarioProvider`. Las selecciones ya sobreviven al cambio de calculadora durante la sesión; no se guardan actualmente como borrador persistente tras recargar la página.
- La condición `ready` comprueba selección general y un único indicador de borrador numérico. Las validaciones completas se resuelven además en catálogo y cálculo. No puede usarse como condición para avanzar en todos los pasos.
- Los hooks de cálculo reciben el escenario que se está editando. Ocultar las métricas durante la preparación no bastaría para posponer el cálculo.
- El cálculo de escuadras ya cancela trabajo anterior y descarta respuestas de otros escenarios. Conviene conservar esa protección.

No se modificó la interfaz ni el motor. No se ejecutaron suites de pruebas en esta investigación. La observación visual no incluye lector de pantalla, teclado móvil abierto ni todos los tamaños de pantalla.

## Recorrido propuesto

| Paso | Decisiones visibles | Cuándo se puede continuar |
| --- | --- | --- |
| 1. Atacante | Buscar unidad; elegir composición o perfil individual; cantidad participante cuando proceda. Cargar opciones únicas y equipo de serie revisado, con un resumen breve. | Identidad y composición del atacante válidas. Todavía no requiere defensor, arma condicionada ni contexto del ataque. |
| 2. Defensor | Buscar unidad; elegir composición o variante; miniaturas restantes; una miniatura herida; grupos defensivos y orden de asignación bajo edición avanzada. | Defensas, cantidades, heridas y grupos válidos para el alcance seleccionado. |
| 3. Ataque | Disparo/cuerpo a cuerpo; equipo, cantidades de portadores y modos; condiciones pertinentes; ajustes avanzados. Objetivo de bajas, fiabilidad y unidad de búsqueda cuando correspondan al modo de cálculo. | Equipo y condiciones válidos, incluidas compatibilidades con todos los grupos defensivos. |
| 4. Revisar | Resumen de ambos lados, armas resultantes, condiciones y ajustes activos; alcance y omisiones; enlaces «Cambiar» por sección. Botón «Generar informe». | Validación completa del escenario y política actual de omisiones satisfecha. |
| Informe | Resumen del escenario calculado, métricas y estadísticas existentes, distribuciones y compartir donde ya existe. Edición directa de cada sección. | Solo resultados correspondientes al escenario confirmado. |

Combate, Ataques necesarios y Mejoras siguen siendo elecciones del tipo de informe. No añadir otro paso obligatorio para elegirlos. Compartir la preparación y adaptar las preguntas pertinentes: el cálculo inverso de un perfil individual no necesita introducir una cantidad de ataques que precisamente va a resolver; las escuadras sí pueden necesitar cantidades, equipo y unidad de búsqueda.

Entrada manual sigue disponible con el mismo recorrido: atacante y cantidades en el primer paso, defensa en el segundo, perfiles de armas y contexto en el tercero. Conservar los ejemplos actuales como ayuda opcional.

La búsqueda no obliga a elegir primero facción. Las opciones únicas se resuelven automáticamente y quedan identificadas. Elegir una unidad no avanza automáticamente de pantalla: permite revisar composición y cantidad antes de «Continuar».

## Navegación y correcciones

- Indicador sencillo del paso actual; «Atrás» y «Continuar», con nombres claros de las etapas. Los pasos visitados permiten volver y conservan datos. Las etapas posteriores solo se abren si sus requisitos están satisfechos.
- En móvil, una columna y acciones fáciles de alcanzar que no oculten campos, errores ni el contenido al abrir el teclado. En escritorio, resumen lateral compacto; un único bloque principal de edición.
- Al cambiar de paso, foco en su encabezado. Al intentar continuar con errores, resumen de errores y enlaces a sus campos. Conservar interacción de los buscadores por teclado.
- «Cambiar defensor» desde el informe abre su paso conservando al atacante. Al guardar, revisar compatibilidades y pasar a revisión; si hay conflictos, llevar al apartado del ataque que necesita corrección.
- Cambiar de unidad limpia solo los datos dependientes de ese lado. Revalidar condiciones cruzadas, defensas condicionadas por el tipo de ataque y todas las armas de los grupos.
- Reducir participantes conserva el equipo que deja de caber como borrador pendiente. Mostrar la discrepancia y pedir corregirla; no retirar armas ni redistribuir grupos silenciosamente.
- Un cambio de composición inicial puede reconstruir el equipo de serie según el comportamiento actual. Distinguirlo de ajustar los supervivientes.
- «Nuevo cálculo» inicia la preparación; las modificaciones de un escenario existente usan «Cambiar». No introducir en esta primera entrega un historial nuevo ni almacenamiento permanente de borradores.

La preparación debe conservar también el texto de campos temporalmente vacíos o inválidos. Desmontar un paso no debe convertir una entrada incompleta en su último valor válido ni permitir avanzar. Registrar la validez por campo o sección y conservar el borrador necesario, en vez de depender exclusivamente del booleano global actual.

## Informe y ejecución

Separar el borrador editable del escenario confirmado. Al pulsar «Generar informe», resolver y validar todo el escenario, capturar sus parámetros efectivos, identidad/revisión del catálogo, modo de cálculo y opciones específicas, y ejecutar sobre esa copia.

Durante la preparación solo se resuelven perfiles y validaciones necesarias. Posponer tanto el cálculo de escuadras como el de una miniatura; montar el componente que ejecuta el informe al confirmar, o añadir una activación explícita a los hooks. La solución debe cubrir también los entornos sin Worker.

Estados del informe: calculando, resultado disponible, resultado parcial, imposible, límite alcanzado y error. Los conflictos de entrada llevan a su paso. Una respuesta de un cálculo anterior no debe reemplazar el informe actual, y un error no se presenta como resultado cero.

Al editar, indicar que se está preparando otro informe y ocultar las cifras anteriores de la vista activa. Compartir siempre los datos del escenario calculado y sus omisiones. Cambiar de tipo de informe reutiliza las selecciones; si necesita opciones adicionales, pedirlas en el paso pertinente.

Conservar las estadísticas existentes. En escuadras, priorizar bajas medias y probabilidad de eliminación, con supervivientes, heridas perdidas y distribución. Para una miniatura, probabilidad de eliminación y heridas perdidas, con las estadísticas actuales. Mantener las particularidades del informe inverso y del comparador, incluidos límites e imposibilidad.

Unificar las omisiones en un resumen de revisión, detalles desplegables y una etiqueta visible en el informe. En el checkout actual, una miniatura omite automáticamente habilidades pendientes y las escuadras requieren aceptación expresa; trasladar esa aceptación a revisión conserva la política existente. El rediseño no decide por sí solo cambiarla.

## Implementación propuesta

1. Preparar un prototipo navegable con un escenario sencillo y otro de equipo mixto. Valorar número de pasos, claridad de composición/perfil y edición desde el informe.
2. Extraer controles por responsabilidad: atacante, defensor, equipo del ataque, contexto y revisión. Separar los dos lados del editor avanzado; conservar las funciones de catálogo y el motor.
3. Añadir estado del recorrido, validación por paso, conservación de borradores y escenario confirmado sobre la sesión compartida.
4. Integrar primero Combate y después los informes de Ataques necesarios y Mejoras en el mismo recorrido, manteniendo sus opciones y la conservación del escenario.
5. Comprobar navegación, cancelación, accesibilidad y equivalencia de resultados. Revisar visualmente en móvil y escritorio antes de dar la implementación por terminada.

El esfuerzo es moderado: hay componentes y estado común reutilizables, pero no basta con ocultar fragmentos del formulario. Los principales trabajos son separar controles acoplados, validar etapas incompletas, conservar borradores y cambiar el disparador del cálculo. No se propone modificar las fórmulas ni ampliar el catálogo o la compatibilidad de reglas.

## Criterios de aceptación

- Primera configuración: seleccionar ambos lados, preparar ataque, revisar y generar; ninguna cifra aparece durante la preparación ni se ejecuta el cálculo completo antes de confirmar.
- Atacante condicionado al objetivo: se puede completar su identidad sin defensor y se comprueba su modo tras elegir el objetivo.
- Edición desde informe: cambiar defensor conserva atacante y equipo compatible; un modo incompatible queda pendiente y tiene una ruta clara de corrección.
- Borradores: vaciar dos campos, cambiar de paso y corregir solo uno no da por válida toda la sección. Volver restaura lo escrito.
- Equipo mixto: portadores y miniaturas no se duplican; modos exclusivos, cupo compartido, armas conservadas en paquetes y supervivientes mantienen la semántica actual.
- Grupos: validar todas sus armas, contextos y variantes defensivas; conservar orden de resolución/asignación y miniatura inicialmente herida.
- Omisiones: aviso de revisión sin duplicados, política actual aplicada y etiqueta/detalles conservados en informe y compartidos.
- Informes: para el mismo escenario, los resultados coinciden con las calculadoras actuales. Los límites, resultados imposibles y errores mantienen su significado.
- Cambio de calculadora: conserva ambos lados y equipo; solicita únicamente las opciones adicionales necesarias.
- Navegación: teclado, foco y lectores de pantalla; revisar 320/375/768/1280 px y zoom, incluido teclado móvil. Los botones no ocultan entradas ni errores.

Validación prevista al implementar: pruebas focalizadas de navegación, dependencias, borradores, confirmación y respuestas tardías; suites web existentes, tipos y compilación. Repetir pruebas del motor si se cambia su lógica. No añadir tests que solo reproduzcan la estructura visual de las etapas.

## Referencias

- [W3C: formularios de varios pasos](https://www.w3.org/WAI/tutorials/forms/multi-page/): agrupar controles relacionados, indicar progreso y conservar entradas al volver a etapas anteriores.
- [GOV.UK: páginas de preguntas](https://design-system.service.gov.uk/patterns/question-pages/): empezar con decisiones enfocadas y ajustar agrupaciones mediante investigación. Aplicación aquí: un asunto por paso, sin crear una pantalla por cada cifra.
- [GOV.UK: revisar respuestas](https://design-system.service.gov.uk/patterns/check-answers/): resumen antes de confirmar, con enlaces para cambiar secciones. Su adaptación a una calculadora es una propuesta de diseño, no una exigencia de esa guía.
- [Revisión anterior de usabilidad](wh40k-usability-review.md) y [selección sencilla de equipo](squad-equipment-selection.md): contexto del proyecto y comportamientos que debe conservar el recorrido.
