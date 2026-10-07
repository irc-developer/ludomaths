# Revisión de usabilidad de WH40K

7 de octubre de 2026 · Plan e implementación para Iván · Cambios locales, sin despliegue.

## Propuesta y diagnóstico

Recorrido principal: **buscar atacante y defensor → elegir arma/modo y variante → completar contexto pertinente → leer resultado**. Catálogo disponible al abrir cuando su integración local lo proporciona. Por indicación posterior de Iván se retiran los controles de importación y gestión del catálogo. Se conserva el alcance: un grupo con un arma/modo contra **una miniatura**.

[La migración](wh40k-11th-web-migration.md) y [la integración de reglas](warhammer-rule-effects-integration.md) ya piden simplificar avisos y controles, pero no detallan búsqueda, jerarquía ni accesibilidad. Este plan las complementa y actualiza el recorrido habitual por indicación de Iván. La distribución y privacidad del catálogo siguen bajo responsabilidad de su integración y del [contrato v2](warhammer-profile-json-export.md).

Revisión: código de App, CatalogPanel, formulario común, tres calculadoras y componentes; build local existente en escritorio y a 320 px. La selección con catálogo se inspeccionó en código, sin importar JSON ni reconstruir la web. Hallazgos:

- Importador, explicaciones, ejemplos y campos manuales dominan el recorrido. Los perfiles cargados siguen mostrándose como campos deshabilitados.
- Selección con desplegables encadenados y botones «Aplicar»; contexto obligatorio de Heavy/Rapid Fire dentro de un plegable.
- Combate muestra siete métricas, distribución y tarjeta compartida con contexto repetido. La gráfica filtra entradas, aunque se llama «distribución completa».
- A 320 px quedan unos 193 px útiles: resultados conservan tres columnas y el comparador exige desplazamiento horizontal. Cambiar de calculadora desmonta el escenario.

## Información visible y bajo demanda

| Visible en el recorrido con catálogo | Bajo demanda |
| --- | --- |
| Título, edición, «Contra una miniatura» y modo Combate / Ataques necesarios / Mejoras. | «Cómo se calcula»: fórmulas y supuestos. Cargas conserva alcance separado. |
| Tarjetas Atacante/Defensor: buscador propio, selección resumida y «Cambiar». | «Ver características»: cifras y efectos aplicados/inactivos; sin IDs, hashes o revisiones técnicas. |
| Portadores en Combate/Mejoras; heridas restantes con máximo; fiabilidad en Ataques necesarios. | «Ajustes avanzados»: modificadores externos y repeticiones permitidas; indicador visible si hay ajustes activos. |
| Condiciones relevantes, aviso parcial si procede y resultado prioritario. | Habilidades omitidas, más estadísticas, compartir y ejemplos. |

«Entrada manual» abre las características básicas editables y defensas aplicables. No plegar sus datos imprescindibles ni usar soporte manual para anunciar como integrada una habilidad pendiente del catálogo.

## Buscadores independientes

1. **«Buscar unidad atacante»** y **«Buscar unidad defensora»**: coincidencia parcial sin distinguir mayúsculas/tildes; ordenar nombre exacto, comienzo y resto. Nombre y facción desambiguarán resultados; facción como filtro opcional, sin paso obligatorio.
2. Al enfocar sin texto, lista breve de unidades disponibles; al escribir, hasta ocho coincidencias y petición de refinar si hay más. «Sin coincidencias» ofrece borrar búsqueda o entrada manual; no afirma que la unidad no exista en el juego.
3. Clic/Enter confirma; escribir o navegar no cambia el perfil aplicado. Escape conserva la selección anterior. No confirmar automáticamente al perder foco ni identificar entidades solo por nombre.
4. Atacante: variante → arma/modo; defensor: variante. Resolver automáticamente una única opción válida y mostrarla; pedir elección si hay varias. Los selectores cortos de variante/modo pueden conservarse. Nunca sumar modos alternativos.
5. Aplicar al completar las elecciones válidas, sin otro botón «Aplicar». Un modo condicionado pide defensor para comprobarlo; si es incompatible, explica la condición y ofrece cambiar modo. Resultado pendiente mientras sea inválido.
6. Cambiar un lado limpia solo sus dependencias y revalida las condiciones cruzadas. Cambiar defensor puede invalidar el modo atacante, sin sustituir su unidad. Nueva miniatura: heridas restantes al máximo; nuevo atacante: conservar heridas validadas.
7. Conservar escenario entre las tres calculadoras; fiabilidad propia de Ataques necesarios. Reevaluar contexto/omisiones e invalidar resultados anteriores ante cambios relevantes; no arrastrar respuestas de otro perfil.

## Contexto y omisiones

«Situación del ataque» muestra solo condiciones soportadas pertinentes: mitad de alcance para Rapid Fire; fase, unidad trabada, desplegada este turno y movimiento mayor de 3 pulgadas para Heavy. No reducir Heavy a «No movió». Cobertura solo cuando pueda afectar al ataque a distancia. Torrent/Devastating automáticos como resumen, sin casillas para desactivarlos en catálogo. Decisiones de repetición/Lethal solo cuando estén permitidas y soportadas; sin preguntas para Anti, Blast, Waaagh! o reglas pendientes.

Por indicación posterior de Iván se elimina la casilla de aceptación parcial. Las habilidades pendientes o fuera del alcance se omiten automáticamente: aviso **«Este cálculo omite habilidades del perfil»**, detalle **«Ver habilidades omitidas»** y **«Cálculo parcial»** junto a las métricas, con omisiones conservadas en compartidos. La selección inválida y las condiciones obligatorias siguen impidiendo calcular.

Una omisión que pueda cambiar ataques, daño o defensa sigue siendo relevante aunque figure `out-of-scope`. Solo retirar avisos de reglas acreditadas como ajenas a la métrica; ante duda, conservar la omisión. Revisar esa clasificación antes de simplificar avisos. La aceptación se renueva si selección, contexto o revisión cambian el alcance, no por abrir/cerrar paneles.

Contexto desconocido necesario, característica ausente o modo incompatible bloquean el cálculo; omitir habilidades pendientes no los sustituye ni permite inventar valores.

## Resultados y estados

| Cálculo | Principal | Bajo demanda |
| --- | --- | --- |
| Combate | Probabilidad de eliminar y heridas perdidas esperadas. | Daño potencial, mediana, moda, rango central, alguna herida y distribución; explicar exceso de daño. |
| Ataques necesarios | N ataques individuales para X% y fiabilidad obtenida. | Probabilidad con N−1 y límite de búsqueda. Sin portadores ni ataques por portador. |
| Mejoras | Opción ofensiva y comparación con Base en heridas perdidas/probabilidad de eliminación; defensa separada. | Daño potencial, desempates y activaciones repetidas con contexto constante; conservar horizonte/cola cuando se muestren. |

Estados: **sin selección, cargando, faltan datos/condiciones, válido, parcial, imposible, límite alcanzado y error**. Errores junto al campo; al editar, no presentar cifras anteriores como vigentes. Un error nunca es daño cero. Un límite conserva lo calculado plenamente y su alcance, sin anunciar éxito/imposibilidad. Fallo de catálogo: reintento y entrada manual.

Mantener actualización automática con entradas válidas y mensajes tras estabilizar la edición. Compartir solo resultados vigentes: botones compactos, vista previa al abrir «Compartir» y las mismas limitaciones de pantalla. Distribución filtrada correctamente etiquetada; no llamar turnos reales a activaciones con contexto constante.

## Accesibilidad y móvil

- Buscador según [combobox WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/): etiqueta persistente, lista asociada, estados expandido/seleccionado y opción activa; flechas, Enter, Escape y Tab sin confirmar otra unidad. Anunciar coincidencias sin leer toda la lista por tecla.
- Foco: atacante → defensor → contexto → resultado; errores asociados, estados con texto además de color y anuncio cortés sin mover foco. Plegables con teclado, nombres únicos por lado y foco visible. Si hay pestañas, roles y navegación correspondientes.
- Verificar 320/375/768/1280 px y zoom. Una columna y márgenes reducidos en móvil; información esencial sin desplazamiento horizontal, conforme al criterio de [reflujo WCAG](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). Listas utilizables con teclado móvil abierto.
- Controles/filas tocables de 44 px como objetivo de producto, por encima del [mínimo WCAG de 24 px y sus excepciones](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Comprobar contraste; evitar reducir tipografía para encajar columnas.
- Mejoras: tarjetas con Base y diferencias en móvil, tabla ampliada opcional con cabeceras accesibles. Métricas de Combate en una/dos columnas según espacio. Cifras legibles para gráficos y alternativa textual a imágenes.

Son criterios propuestos, no certificación de accesibilidad; no se probaron lectores de pantalla en esta revisión.

## Implementación y aceptación

Orden: disponibilidad/carga del catálogo con el otro chat → buscadores y escenario compartido → contexto/omisiones → resultados/detalles → móvil/accesibilidad. Sin ampliar motor ni decidir aquí almacenamiento o distribución de datos privados; este plan no autoriza publicar paquetes o referencias al origen.

Aceptar cuando «Intercessor» y «Beast Snagga» se puedan seleccionar en ambos sentidos, resolver arma/modo/variante y calcular con solo el contexto relevante, sin abrir ajustes avanzados. Comprobar nombres duplicados, búsqueda vacía/sin coincidencias, Escape, independencia de lados, invalidación de modo condicionado y actualización automática de omisiones. Teclado/móvil y compartidos deben conservar el mismo alcance.

Validación prevista: pruebas focalizadas de interacción, teclado/lector de pantalla, tamaños indicados, tipos y build web. Repetir pruebas del motor si cambia su lógica. Los 543/127 resultados anteriores son contexto, no pruebas repetidas aquí.

### Resultado de la implementación

Iván autorizó implementar el plan con «Hazlo». Se añadieron buscadores independientes con confirmación explícita, resolución automática de opciones únicas y un escenario compartido entre Combate, Ataques necesarios y Mejoras. El contexto pertinente queda visible; fórmulas, características, comparación técnica y compartir quedan bajo demanda. Tras la revisión posterior, las estadísticas de Combate vuelven a mostrarse directamente. Los resultados se ocultan mientras falta selección, contexto o una entrada numérica está vacía durante la edición.

Las omisiones pendientes y excluidas se reúnen sin duplicados. Inicialmente requerían aceptación explícita; por indicación posterior de Iván se omiten automáticamente y se muestran resultados parciales sin checkbox. Los avisos se actualizan al cambiar selección o contexto; los compartidos conservan el escenario efectivo y sus límites. Se mantienen las reglas y el alcance del motor existente. Se conservan los cambios de los otros chats, incluida la retirada de importar/borrar catálogo solicitada durante esta implementación.

Comprobaciones realizadas sobre la implementación inicial:

- Suite web completa: **23 archivos y 159 pruebas aprobadas**, incluyendo búsquedas por teclado, nombres duplicados, selección independiente, modos incompatibles, contexto obligatorio, aceptación parcial y conservación del escenario entre calculadoras.
- Tipos y compilación de producción aprobados. Compilación temporal separada del directorio publicado; sin perfiles privados, configuración privada ni ruta del servicio local en el paquete generado.
- Selección real del catálogo por teclado y recorrido entre las tres calculadoras en la vista previa local. Reflujo comprobado a **320, 375, 768 y 1280 px**, sin desbordamiento horizontal en el contenido visible. Capturas de escritorio y móvil inspeccionadas.
- Sin prueba física con lector de pantalla ni certificación de accesibilidad. No se repitieron las pruebas del motor porque esta implementación no modifica su lógica. No se publicó ni desplegó.

Revisión posterior sin checkbox: **24 archivos y 162 pruebas web aprobadas**, tipos y compilación correctos. Se comprueba el cálculo automático con reglas pendientes y fuera del alcance, la conservación del aviso parcial entre las tres calculadoras y los cambios de contexto, y la retirada del aviso cuando desaparecen las omisiones. Los modos incompatibles y el contexto obligatorio siguen bloqueando el resultado.
