# Plan de integración de reglas: primera aproximación

Revisado el 7 de octubre de 2026. Estado: alcance reducido aprobado por Iván; implementación inicial cerrada según la entrega del chat «Plan de migración de LudoMaths a 11.ª». Este documento registra la coordinación y mantiene las ampliaciones pospuestas.

## Decisión de producto

La primera entrega debe permitir **seleccionar un arma y una miniatura, cargar sus características y calcular**. Se aprovechan las reglas que la migración ya sabe aplicar, con el mínimo contexto necesario para la selección. No es requisito integrar todas las habilidades de las fichas.

Iván ha pedido evitar la sobrecarga de reglas en esta aproximación. Por tanto, este documento sustituye la prioridad anterior de implementar primero Bolter Discipline y Waaagh!: esas habilidades, Anti, Blast y Lethal condicionado pasan a ampliaciones posteriores. No se crea ahora un resolver general, un nuevo sistema de acumulación ni una versión adicional del esquema.

Se reutilizan [el plan de migración](wh40k-11th-web-migration.md) y [el contrato de exportación](warhammer-profile-json-export.md). El alcance sigue siendo una miniatura objetivo, un modo de arma por grupo y los perfiles piloto de Beast Snagga Boyz e Intercessor Squad. El resultado describe el ataque y las capacidades incluidas; no certifica la ficha completa ni la legalidad de la unidad/equipo.

## Qué tenemos y qué falta

El paquete combinado ya entregado contiene dos unidades, cuatro perfiles de miniatura, 18 modos y 24 reglas; ocupa 117.774 bytes y usa el esquema v2. De las reglas, ocho están revisadas, una pendiente y quince fuera del alcance declarado. Los cuatro perfiles de miniatura no tienen reglas propias en este piloto; las habilidades presentes están vinculadas a unidades y armas/modos.

**El JSON ya incluye efectos parametrizados.** Sus reglas tienen capacidad, parámetros, revisión y contexto requerido. No hace falta duplicar esa información ni completar todos sus automatismos para probar la selección de perfiles y el cálculo.

Según la frontera confirmada por el chat de migración:

| Capacidad del catálogo | Primera aproximación |
| --- | --- |
| Torrent | Reutilizar el autoimpacto ya implementado |
| Heavy | Reutilizar el efecto y solicitar únicamente su contexto pertinente |
| Rapid Fire | Reutilizar el incremento de ataques y la condición de mitad de alcance |
| Devastating Wounds | Reutilizar su resolución en el núcleo compartido |
| Bolter Discipline / `hitBonus` | Conservar en el catálogo y explicar su omisión; posponer automatización |
| Waaagh! / `riledUp` | Conservar en el catálogo y explicar su omisión; posponer automatización |
| Anti y Blast | Conservar datos y limitaciones; posponer nuevos controles y lógica |
| Lethal Hits condicionado | Mantener pendiente; no activarlo por su nombre ni por existir soporte manual |

El soporte manual adicional que ya tiene la migración puede mantenerse disponible en opciones avanzadas. No se usa para afirmar que una habilidad importada pendiente está revisada.

`reviewed` y `coverage: complete` describen revisión/cobertura del catálogo; no prueban que todos los efectos estén implementados o activos en el motor. La tabla no anuncia pruebas nuevas: se contrastará con la entrega final de la migración.

## Entrega inicial

### 1. Recibir y aprovechar la migración

Comprobar la entrega del núcleo compartido, importador v2 y selección independiente de atacante/defensor. Mantener el paquete como archivo local, fuera de `web/public` y del bundle.

Reutilizar `resolveCatalogScenario`, `CombatScenarioInput` y las tres calculadoras existentes. No reexportar los paquetes ni duplicar validación, fórmulas o los cuatro bindings iniciales. Retirar de las tareas cualquier punto ya resuelto por la migración.

### 2. Presentar un recorrido sencillo

El recorrido principal es: seleccionar arma/modo y miniatura objetivo, revisar características, completar contexto pertinente y calcular. Se mantiene la entrada manual existente.

- Mostrar solo condiciones de las habilidades soportadas que afecten al arma elegida.
- No pedir ahora proximidad a objetivos para Bolter Discipline, estado Waaagh!, tipos Anti ni tamaño de unidad para Blast.
- Agrupar los ajustes manuales adicionales en opciones avanzadas, evitando que dominen el recorrido de selección.
- No presentar por defecto un listado de todas las reglas de la ficha.

Si falta contexto necesario para una habilidad incluida, no asumir una respuesta: pedir ese dato concreto. Elegir un modo condicionado exige validar su elegibilidad con la información disponible; simplificar la interfaz no permite tratar un modo inválido como válido.

### 3. Mostrar el alcance sin llenar la pantalla de reglas

Cuando haya habilidades relevantes omitidas, usar el aviso:

> Este cálculo no incluye todas las habilidades del perfil.

Ofrecer el detalle en un desplegable «Ver habilidades no incluidas». Mostrar allí las reglas pertinentes a la selección y sus motivos; las reglas informativas o ajenas a la métrica pueden permanecer en el detalle existente.

Conservar la elección explícita de cálculo parcial cuando proceda. Una única aceptación para la selección y su alcance basta; no pedir confirmación por cada habilidad. Conservar las omisiones en resultados, historial y texto/imagen compartidos. No llamar completo al resultado si faltan efectos relevantes.

Cambiar selección, contexto o revisión obliga a reevaluar ese alcance. No arrastrar una aceptación previa si aparecen otras omisiones relevantes. El aviso resumido sustituye la exposición extensa, sin ocultar información necesaria para interpretar el resultado.

## Fuera de la primera entrega

No son requisitos de cierre:

- Implementar Bolter Discipline, Waaagh!, Anti, Blast o la condición pendiente de Lethal Hits.
- Completar todas las habilidades del piloto o auditar todas las reglas generales del juego.
- Crear nuevos predicados de condiciones, un registro genérico de efectos o un informe exhaustivo de reglas aplicadas/inactivas.
- Ampliar el esquema, reexportar paquetes, añadir facciones o distribuir un catálogo masivo.
- Simular auras, estratagemas, turnos cambiantes, legalidad completa de equipo o eliminación de unidades con asignación entre miniaturas.

Se conservan los datos actuales para futuras ampliaciones. No se eliminan reglas del JSON para simplificar el producto.

## Comprobaciones de cierre inicial

| Comprobación | Criterio |
| --- | --- |
| Selección de perfiles | Arma/modo y objetivo cargan características correctas, con selecciones independientes |
| Capacidades soportadas | Se reutilizan los cuatro bindings iniciales y sus pruebas; no se duplican bonificaciones |
| Contexto | Solo se solicitan datos pertinentes; un dato desconocido necesario no se convierte en falso |
| Habilidades pospuestas | No se activan automáticamente ni generan controles nuevos |
| Cálculo parcial | Aviso breve, detalle accesible y aceptación explícita cuando corresponda |
| Cambio de selección | Se revisan efectos/limitaciones y aceptación, sin conservar datos de un modo anterior |
| Tres calculadoras | Usan el mismo escenario/núcleo y mantienen el alcance declarado |
| Historial y compartidos | Conservan contexto, versión propia y omisiones relevantes |
| Uso en móvil | El recorrido principal permite seleccionar y calcular sin atravesar controles de todas las reglas |
| Tamaño y privacidad | Archivo local fuera del bundle; producto sin referencias al origen |

Estas comprobaciones aprovechan las pruebas de la migración. Si se realizan cambios de presentación, verificar el recorrido y las pruebas de interfaz afectadas; si cambia lógica de dominio/aplicación, seguir TDD y ejecutar sus pruebas focalizadas. No se necesita ejecutar tests del motor para una revisión exclusivamente documental.

La entrega se considera suficiente cuando seleccionar perfiles y calcular es cómodo y el resultado deja claro su alcance. **Integrar todas las reglas no es condición para cerrar la primera aproximación.**

## Ampliaciones posteriores, según uso real

Después de probar la entrega, priorizar las habilidades que Iván necesite para sus comparaciones. Una petición concreta o una omisión recurrente justifica el siguiente incremento; este documento no inicia una implementación automática de todo el backlog.

| Ampliación posible | Trabajo y requisito previo |
| --- | --- |
| Bolter Discipline y Waaagh! | Contexto y lado beneficiario revisados; combinación con efectos existentes sin duplicación |
| Anti y Blast | Keywords/tamaño del objetivo y cambios puntuales en el núcleo compartido; casos de referencia independientes |
| Lethal condicionado | Revisar la restricción del perfil; acordar binding y variante de esquema antes de habilitarlo |
| Otras habilidades | Añadir únicamente las que aparezcan en perfiles útiles, con permiso, condición, beneficiario y efecto comprobados |

Cada incremento reutiliza la base del catálogo y reconstruye efectos al cambiar selección/contexto. No ejecutar reglas por nombre o descripción. Mantener evidencia exacta en el registro privado y usar únicamente IDs, versiones y explicaciones propios en el producto.

Los detalles de acumulación, defensas condicionales, decisiones de repetición y futuros formatos se diseñan cuando se elija la habilidad correspondiente. No anticipar infraestructura para reglas que todavía no necesitamos.

## Coordinación y reparto

- El chat de migración implementa el núcleo, entrada manual, tres calculadoras, importación/selección v2, los cuatro bindings iniciales y estados de cálculo parcial; también historial y compartidos.
- El chat de exportación conserva la propiedad del contrato y los paquetes locales.
- Este chat revisa el alcance, documenta el recorrido inicial y comunica prioridades y criterios de cierre. Solo modifica este documento durante el trabajo compartido.

La frontera inicial fue confirmada por el chat de migración: no añadirá habilidades de unidad/miniatura ni cambios de esquema en su turno actual. Iván ha aprobado después la reducción del plan a la primera aproximación descrita aquí y ha autorizado llevar a cabo esta parte.

El chat de migración ha confirmado recepción y alineación con este alcance reducido. Ajustará su interfaz al aviso breve de perfil parcial, detalles desplegables y aceptación explícita de omisiones, conservadas también en compartidos. Solo pedirá el contexto que usan los bindings soportados y no ampliará capacidades.

La coordinación de esta primera aproximación queda cerrada; los incrementos posteriores quedan pospuestos.

### Entrega inicial comunicada por el chat de migración

El chat de migración ha comunicado el cierre de la implementación con Torrent, Heavy, Rapid Fire y Devastating Wounds. Confirma el aviso breve de perfil parcial, detalle desplegable, aceptación explícita y conservación de omisiones en resultados/compartidos. Anti, Blast, Bolter Discipline, Waaagh! y Lethal condicionado permanecen pospuestos.

Validación comunicada por aquel chat: 543 pruebas del núcleo y 127 de web aprobadas, comprobación de tipos y build correctos, y 510 acuerdos de cálculo con los paquetes limpios. Este chat registra ese resultado; no ha repetido las pruebas ni realizado una validación independiente de la implementación.

No queda una dependencia de implementación pendiente para esta primera aproximación. Las posibles ampliaciones se seleccionarán según el uso real y las necesidades de Iván.
