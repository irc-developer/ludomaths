# Plan de migración de LudoMaths a 11.ª: web y motor compartido

Fecha: 7 de octubre de 2026. Estado: H1 y H2 implementados y validados localmente. Sin publicación ni despliegue. La revisión cruzada se registra al final.

## Decisión y alcance

Primero verificar el motor compartido y las tres calculadoras web con entrada manual; después añadir una importación privada de JSON para un piloto Orks/Adeptus Astartes. No basta cambiar la etiqueta de edición: cada capacidad anunciada necesita evidencia vigente y una prueba del comportamiento implementado. «11.ª» es el objetivo solicitado y la edición legible que puede mostrar el producto. La identidad técnica y las evidencias quedan únicamente en el registro privado del exportador y de revisión del motor.

El primer hito calcula un grupo de armas idénticas, con un único modo seleccionado y cantidad explícita de portadores, contra **una miniatura**, con heridas máximas y restantes separadas. Combate, ataques necesarios y comparación de mejoras consumen las mismas reglas y conversiones. El cálculo de unidades completas con grupos defensivos diferentes queda fuera de ese hito. Las otras calculadoras de LudoMaths no se migran por este trabajo. Cargas requiere una revisión específica antes de anunciar que toda la sección Warhammer es compatible.

El segundo hito acepta archivos del contrato limpio v2 descrito en [el plan de exportación](warhammer-profile-json-export.md). La exportación por selección pequeña es el comportamiento predeterminado; facción completa requiere elección expresa y queda fuera del piloto. Piloto acordado: Beast Snagga Boyz e Intercessor Squad, ámbito estándar y vínculos directos verificados privadamente. Un perfil/modo atacante y una variante de miniatura defensora en cada selección; invertir las facciones para comprobar ambos lados. La presencia de la unidad en el archivo no promete aplicar todas sus habilidades.

Facciones iniciales: Orks y Adeptus Astartes, con IDs propios opacos de LudoMaths. Adeptus Custodes se habilitará **después de la siguiente actualización y revisión interna**; no exportar ni admitirlo en el piloto. No incluir constructor de listas, puntos, destacamentos, misiones, imágenes, Legends, Combat Patrol, aliados o catálogo público en este trabajo.

## Verificación interna y separación del producto

Se consultó realmente la instantánea autorizada disponible y se leyó el contenido de las mecánicas de la matriz. El corpus es incompleto: una FAQ incompleta, 55 registros de daños sin texto y 121 imágenes remotas no consolidadas. Esos 55 registros no equivalen a 55 armas sin característica D. Vacíos, guiones y títulos sin contenido no completan una regla. El código anterior se inspeccionó como implementación que hay que revisar, nunca como evidencia de reglas vigentes.

La indicación posterior de Iván es: «y sobre todo nada que haga referencia a la fuente de datos original, claro». Sustituye el contrato anterior en todos los datos que recibe LudoMaths y en interfaz, resultados compartidos y almacenamiento del producto. No basta ocultar una sección de procedencia: esos datos no deben llegar al navegador. Los localizadores, versiones originales, huellas, publicación y mapeo de IDs quedan en un **registro privado separado del exportador**, fuera del repositorio/artefactos publicados y sin importación desde código web.

Este plan no crea ese registro ni genera un JSON. Las consultas y evidencias detalladas ya obtenidas siguen siendo documentación interna de investigación; al implementar se vincularán privadamente con las referencias E01–E24. Se retiraron de este documento los identificadores y metadatos originales para que no se copien al producto. La verificación sigue siendo necesaria; las referencias del origen no se presentan al usuario de la web.

La web usa Vite/React y alias hacia `src/domain`/`src/application`; `.github/workflows/deploy.yml` construye y publica archivos en GitHub Pages. El hito manual y la importación por archivo no requieren API. El proceso de extracción permanece local; GitHub Actions no tiene acceso automático al registro privado.

### Índice interno de evidencia de mecánicas

E01–E24 son referencias propias de este plan para lecturas efectuadas, no IDs que se incluyan en el JSON o la interfaz. Los localizadores completos se conservarán solo en el registro privado de revisión.

| Ref. | Mecánica revisada |
| --- | --- |
| E01 | Impactar |
| E02 | Herir |
| E03 | Salvaciones y grupos |
| E04 | Infligir daño |
| E05 | Repeticiones |
| E06 | Modificadores |
| E07 | Características aleatorias |
| E08 | Lethal Hits |
| E09 | Sustained Hits |
| E10 | Devastating Wounds |
| E11 | Feel No Pain |
| E12 | Heridas mortales |
| E13 | Anti |
| E14 | Torrent |
| E15 | Rapid Fire |
| E16 | Heavy |
| E17 | Cobertura |
| E18 | Ignores Cover |
| E19 | Melta |
| E20 | Twin-linked |
| E21 | Grupo actual de asignación |
| E22 | Modos de arma |
| E23 | Blast |
| E24 | Cleave |

También se leyeron éxito automático, críticos, selección de armas y secuencia de ataques. Un éxito automático no dispara reglas de resultados de dados. La secuencia exige tirar simultáneamente los dados de cada etapa y resolver los grupos de ataques antes de pasar a las otras armas. Esas evidencias complementarias quedan en el registro privado con el mismo criterio.

### Matriz de migración

«Compatible candidata» significa que la inspección coincide para el caso acotado; aún necesita pruebas. «Cambio» describe una diferencia entre fuente vigente y código actual, sin utilizar otra edición como comparación. H1 = motor manual; H2 = importación piloto; A = ampliación posterior.

| Mecánica / evidencia | Comportamiento requerido | Situación del código y actuación | Alcance / laguna |
| --- | --- | --- | --- |
| Impactar y críticos, E01 | D6 por ataque; 1 natural falla; 6 natural crítico; resto compara BS/WS. | Compatible candidata en `combatRollProbabilities` para 2+–6+; conservar separación cara natural/resultado modificado. No usar umbral >6 como sustituto de característica ausente. | H1; habilidades que alteran críticos requieren binding propio. |
| Herir, E02 | S frente a T determina 2+/3+/4+/5+/6+; 1 falla y 6 crítico. | `woundThreshold` candidata compatible; comprobar bordes doble/mitad y positivos. | H1; T de unidades mezcladas no se infiere de una media. |
| Repeticiones, E05 | Una sola repetición, antes de modificadores; una suma 2D6/3D6 se repite completa cuando la regla permite repetir la tirada. | Políticas actuales reutilizables; `nonSixes` es decisión bajo permiso de repetir la tirada, no permiso otorgado por la calculadora. No extender repetición de fallos a éxitos. | H1 impactar/herir; repetición de A/D requiere regla verificada adicional. |
| Modificadores, E06 | Acumular y aplicar reemplazo, multiplicación, suma, división, resta y redondeo hacia arriba; límites por característica. ±1 solo para tiradas de impacto/herida. | Cambio: no reutilizar el clamp ±1 de `dieSuccessProbability` como regla general de salvación/FNP. Separar mejorar BS/Sv de sumar al dado. | H1 mejoras simples y tiradas; operadores no implementados se bloquean. |
| FP / AP, E04/E06 | AP firmado modifica la tirada de salvación; mejorar AP -1 por 1 produce -2; empeorar no supera 0. | Conservar AP original firmado; adaptador convierte -n a magnitud n solo para API interna documentada. Positivo original ambiguo; nunca `abs`. | H1 manual firmado; H2 incidente por original positivo. |
| Salvación / InSv, E03/E04 | 1 natural inflige daño; comprobar InSv y Sv con AP para el grupo actual. No hay salvación automática por 6. | Cambio: `CalculateUnitCombat` aplica `saveModifier` después de elegir mínimo entre Sv e InSv. Un modificador puede afectar erróneamente InSv. Evaluar éxito por cara y efecto autorizado, con InSv separado. | H1 una miniatura; efectos particulares sobre InSv necesitan evidencia específica. |
| Dados ya observados, E01/E02/E04 | Un dado observado se resuelve con sus condiciones reales. Un 6 de salvación puede fallar por AP. | Cambio: `guaranteedSaves` resta una herida automáticamente; no sirve como 6 natural. Repetir controles de dado observado ≠ habilidad oficial. | H1 retirar de cálculo oficial inicialmente o modelar cara/etapa explícitas; no trasladar booleanos sin revisión. |
| Ataques y daño aleatorios, E07 | A se determina por arma individual; D por ataque que daña tras elegir miniatura. D6+1 es característica, no modificador externo. | Cambio en formularios fijos/D6: expresión común y distribuciones completas. Nunca sustituir por media; repetir n armas aleatorias usa convolución independiente, no multiplicar un único resultado de D6 por n. | H1 fijos, D3, D6, nD3/nD6+k acotados; otros formatos pendientes. |
| Torrent, E14 y éxito automático | Impacto automático sin resultado crítico. | Compatible candidata; desactivar controles de repetir/observar impacto y no disparar Lethal/Sustained. BS `-` solo se admite si ese binding confirma autoimpacto. | H1. |
| Lethal Hits, E08 | En crítico se puede elegir herida automática o efectuar tirada para herir. Herida automática no es crítica. | Cambio: booleano actual aplica siempre autoherida. Añadir decisión `autoWound|rollToWound`; la presencia de habilidad y la decisión son campos distintos. | H1, especialmente junto a Devastating. Optimización automática de decisión queda fuera. |
| Sustained Hits, E09 | Crítico y X extras dependen del mismo ataque; extras no son nuevos críticos de impacto. | Cambio necesario de distribución: las ramas críticas no son sumas de binomiales independientes. El parámetro X fijo actual no cubre X aleatorio. | H1 X fijo; X aleatorio solo cuando se pruebe su distribución y alcance. |
| Devastating, E10 | Crítico termina ese ataque; D mortales tras daño normal, máximo una miniatura por crítico; exceso perdido. | Cambio: conservar tipo/paquete de daño y orden; sumar daño sin identidad pierde la regla de una miniatura. | H1 una miniatura; A/asignación para unidades. |
| FNP, E11 | D6 por herida que perdería una miniatura, X+ evita esa pérdida. | Compatible candidata en único objetivo y FNP aplicable; un campo global no representa condiciones por tipo/origen ni grupos distintos. | H1 FNP incondicional; H2 condiciones revisadas o bloqueo explícito. |
| Mortales, E12 | Una herida por vez; prioridad no-CHARACTER herido, no-CHARACTER, CHARACTER herido, CHARACTER; normales antes de mortales. | Cambio: mortales correlacionadas con impacto no se suman como distribución independiente. El FNP del primer pool es aproximación documentada en el código. | H1 no activar `mortalWoundsPerHit` como regla genérica oficial sin referencia de habilidad; simulación pedagógica separada. |
| Grupos y miniaturas, E03/E04/E21 | Agrupar por W/Sv/InSv, CHARACTER individual, orden declarado con prioridades; dados de salvación de menor a mayor; modelo herido primero; pasar de grupo cuando muere entero. | Cambio estructural: `SavePool.fraction` y W total no equivalen a asignación. Necesita estado, orden, caras de salvación ordenadas y paquetes de daño; no basta convolucionar pools. | A; H1/H2 impiden eliminar unidad completa como resultado exacto. |
| Modos y armas, E22/Select Weapons | Un perfil por arma seleccionada; Hunter exige keyword del objetivo. Distintos portadores pueden elegir distinto modo. | Cambio: `WeaponProfile` no guarda identidad/tipo/modo; el formulario escalar pierde esa selección. No sumar perfiles alternativos. | H2 modo único por grupo; varios modos/armas/objetivos en A. |
| Cover e Ignores Cover, E17/E18 | En ataque ranged cobertura empeora BS por 1; Ignores Cover la anula. La situación de terreno/visibilidad corresponde al jugador. | Nuevo contexto; no convertir cobertura en mejora Sv ni confundir cambio BS con modificador de tirada. | H1 control de cobertura declarada; no calcular geometría. |
| Heavy, E16 | Shooting phase, unidad unengaged, no desplegada este turno y ningún modelo movió >3 pulgadas: +1 a impacto. | Nuevo contexto. «No movió» por sí solo no expresa todas las condiciones verificadas. Conservar erratas/texto original sin corregirlo silenciosamente. | H1 condiciones explícitas o efecto pendiente, nunca supuesto. |
| Rapid Fire / Melta, E15/E19 | Mitad de alcance al seleccionar objetivos: sumar X ataques o X a D respectivamente. | Nuevo contexto y efecto sobre distribución por portador; evitar duplicar el bonus si el jugador ya introdujo cifras modificadas. | H1 X fijo; dados como parámetro requieren prueba propia. |
| Twin-linked, E20 | Permite repetir la tirada para herir. | Binding a política de decisión elegida, incluidas repetir fallos o buscar críticos si procede. | H1; no forzar `failures` cuando jugador eligió otra política permitida. |
| Anti-X Y+, E13 | Keyword X del objetivo convierte Y+ natural en crítico de herida. | Cambio: crítico ya no queda fijado universalmente en 6. Resolver prioridad con 1 natural y cara crítica; probar junto a Devastating. | A o ampliación H1 explícita; importación muestra pendiente hasta pruebas. |
| Blast / Cleave, E23/E24 | Ataques adicionales por cada 5 modelos al seleccionar objetivos; Cleave exige único objetivo para todos los ataques de esa arma. | Nuevo tamaño de unidad contextual, distinto de W restantes y distinto de «una miniatura calculada». | A. Piloto bloquea aplicación automática, no pone tamaño 1 por defecto. |
| Otras reglas de unidad/facción/FAQ | Solo automatizar efecto, condición y alcance leídos y revisados. | No hay prueba de soporte integral de Bolter Discipline, habilidades del piloto ni todas las FAQ. Textos y referencias originales solo en registro privado; producto recibe condiciones/limitaciones propias curadas. | H2 conserva estados útiles; elegir cálculo parcial explícito o completar binding antes de prometer perfil completo. |

## Problemas concretos que debe resolver H1

1. **Correlación:** `CalculateUnitCombatUseCase.ts` separa críticos y normales mediante `applyStage` y luego los convoluciona; también suma extra hits con el impacto que los generó como si fueran independientes. `CalculateRequiredAttacksUseCase.ts` ya condiciona por fallo/impacto normal/crítico, pero tiene una implementación privada separada. Extraer un núcleo común de ramas excluyentes y conservar variables compartidas cuando hay varios resultados del mismo ataque. Las medias correctas no garantizan probabilidades de eliminación correctas.
2. **Resultado de salvación:** `chosenSaveThreshold` seguido de un modificador a toda la salvación diverge del camino de ataques necesarios, que compara las probabilidades de armadura e invulnerable separadas. Sustituir la duplicación por resolución por cara y efectos soportados. Comprobar con InSv 4+, Sv 3+, AP -3 y modificación autorizada solo de armadura: InSv no mejora por ese efecto.
3. **Daño y objetivos:** `useCombat` calcula P(daño >= targetWounds), y `UnitProfile.wounds` significa W total de unidad. Esa cola sirve para una miniatura en el alcance homogéneo verificado; no certifica eliminar muchas miniaturas. Mostrar por separado daño potencial, heridas realmente perdidas (limitadas a heridas restantes) y P(eliminar miniatura). No llamar daño perdido al exceso que se desperdicia.
4. **Comparación de mejoras:** `CompareCombatBuffUseCase` compite +1 Sv del defensor junto con mejoras ofensivas, eligiendo mayor daño. Separar tabla ofensiva (mejor BS/WS, AP, D) y defensiva (mejor Sv del objetivo); en defensa menor daño/P(eliminación) es mejor. La mejora de característica debe aplicar E06, no simularse indiscriminadamente con un +1 al dado. Torrent no obtiene mejora BS/WS.
5. **Rondas:** `CalculateRoundsToKillUseCase` devuelve suma truncada de `n*P(T=n)` hasta 20 por defecto; la pantalla la llama rondas esperadas. Para una miniatura y contexto constante, usar proceso absorbente, indicar horizonte y masa superviviente y no presentar la suma truncada como E[T] completa. Caso sin daño: E[T] infinita/imposible, nunca cero como resultado favorable. Una «activación repetida con el mismo contexto» no equivale a predecir turnos reales con cambios de estado.
6. **Historial móvil:** `CombatRecord` guarda perfiles sin versión y propone recalcular al cargar. Una corrección de reglas puede cambiar un resultado histórico. Versionar la envoltura almacenada, conservar snapshot de entradas/contexto y versión exacta del cálculo; registros sin versión quedan como legado no verificado y requieren revisión para recalcular con reglas nuevas.

## Modelo común y fronteras

Mantener cuatro piezas independientes:

| Pieza propuesta | Contenido / responsabilidad |
| --- | --- |
| `CalculationRuleset` | `rulesetVersion` propia, edición legible aceptada y capacidades `supported|conditional|unsupported` propias, con condiciones/parametrización permitidas. Evidencias y huellas originales permanecen en revisión privada, nunca en configuración distribuida. |
| Catálogo de perfiles | Entidades con IDs propios, características originales de juego y normalizadas, relaciones propias e incidencias curadas. Sin procedencia, publicaciones originales ni dependencia del dominio sobre el proceso de extracción. |
| `CombatScenario` | Arma/mode seleccionado, atributos base, variantes defensivas y heridas máximas; binding revisado de efectos. Un constructor manual y un adaptador de catálogo crean el mismo escenario. |
| `CombatContext` | Portadores, heridas restantes, tipo/fase de ataque, distancia/mitad de alcance, cobertura declarada, unengaged, desplegada este turno, movimiento máximo de la unidad, keywords objetivo, decisión Lethal, permiso y elección de reroll y efectos activos. En ampliaciones: tamaño objetivo, orden de armas/grupos y reparto de portadores. |

El contexto registra `true|false|unknown` donde una condición es necesaria. Unknown no se transforma en false. Por defecto, falta de contexto/evidencia relevante bloquea el cálculo completo; se puede ofrecer «cálculo parcial» con elección explícita y lista de efectos omitidos, también en compartidos. No atribuirle soporte oficial completo a una entrada manual: muestra «características introducidas manualmente» y las capacidades efectivas del motor.

Usar características base y pipeline de efectos para evitar aplicar dos veces Heavy/Rapid Fire/Melta/cobertura o un bonus manual. Diferenciar constante intrínseca de D6+k, modificador de característica y resultado observado. Representar autoimpacto con tipo propio; no inventar BS/WS 2+ cuando fuente dice `-`.

El núcleo compartido resuelve una distribución conjunta de resultados de un ataque y sus efectos asociados. La aplicación compone ataques independientes y activa un estado absorbente en las heridas restantes. El cálculo de ataques necesarios reutiliza ese núcleo, mientras combate añade distribución A por arma y portadores. Comparación modifica características sobre copias del mismo escenario y vuelve al mismo cálculo. Primitivas de probabilidad en `domain/math`; reglas y validación en dominio; orquestación en `application`; lectura de catálogo/conversión externa en adaptadores; hooks solo construyen view models.

En la ampliación de unidades, resolver lotes de caras de salvación ordenadas y estados `(grupo actual, miniaturas vivas, heridas del modelo actual, paquetes normales/mortales pendientes)`. Prioridades CHARACTER, modelos heridos, destrucción, Devastating de una miniatura y mortales ordinarias se verifican por separado. La pérdida de información de la suma de daño actual impide obtener esas reglas simplemente añadiendo un número de miniaturas.

## Contrato con el exportador y tratamiento en la web

El documento de exportación es propietario del formato. El contrato v2 reemplaza al anterior por indicación de Iván: el consumidor **rechaza v1**, no lo migra copiando metadatos y no acepta extensiones ni campos desconocidos. Solo se admite una lista positiva estricta de campos, también en cada objeto anidado.

| Campo del contrato v2 | Uso del consumidor |
| --- | --- |
| `format='ludomaths-profile-catalog'`, `schemaVersion='2.0.0'` | Validación estructural estricta; formato anterior/incompatible rechazado sin perder catálogo anterior. |
| `catalogId`, `catalogVersion`, `generatedAt`, `payloadSha256` | Identidad, revisión, fecha de generación e integridad del catálogo limpio de LudoMaths. El digest solo cubre este payload; no deriva de la fuente y no certifica autenticidad. UI muestra versión propia, no hashes técnicos. |
| `edition='11'`, `capabilityReviewVersion` | Edición legible y revisión propia de capacidades. Registro de capacidades local reconoce catálogo/revisión/digest propios y parámetros, sin recibir ni consultar metadatos del origen. |
| `scope.{factionIds,profile,eligibility,coverage,selectedUnitIds}` | IDs propios de facción/unidad; alcance standard/direct, pilot/selected por defecto. Full-faction solo por elección expresa y tras mediciones; no se activa por un campo inesperado. |
| `factions`, `units`, `miniatures`, `weapons`, `weaponModes`, `keywords`, `compositions`, `equipmentChoices` | Grafo de juego con IDs propios opacos prefijados `f_`, `u_`, `m_`, `w_`, `wm_`, `k_`, `c_`, `eq_`. Variantes/modos/armas distintos; `woundsMax` no es heridas restantes. |
| `Value {raw, normalized, status}` | Estado `parsed|missing|not-applicable|ambiguous|unsupported`; `raw` solo contiene el valor de la característica, sin campo/localizador del origen. Fixed/dice(count,sides,modifier), umbrales y alcance tipados. `parsed` no significa calculable con este motor. |
| `weaponModes[].targetCondition` | Condición propia con keywords/estado de revisión propios; permite validar un modo condicionado sin incluir nombres de campos técnicos originales. |
| `rules {id,name,description,reviewState,capabilityId,parameters,reviewVersion,requiredContext}` | ID `r_`, estado `pending|reviewed|out-of-scope`, descripción propia curada, binding/capacidad allowlist y parámetros/contexto tipados. Un `reviewState` aportado por archivo no habilita código ni certifica cálculo completo. |
| `relations {id,kind,fromId,toId,quantity,conditionRuleIds}` | ID `rel_`; discriminación por tipo de relación de juego. Sin tablas, claves/campos originales ni rutas de origen. |
| `issues {code,severity,entityId,field,affects,messageCode}` | ID y campo propios; bloqueos acotados a selección/cálculo/información. Renderizar mensajes desde i18n local; no recibir ni copiar diagnóstico libre del productor. |
| `coverage {entityId,component,state,issueCodes}` | Componentes `characteristics|equipment|abilities|defence`, estado `complete|partial|not-included`; cobertura semántica útil sin detalle de tablas originales. |

Todos los IDs propios se asignan aleatoriamente por tipo y se conservan estables mediante un mapeo **solo privado** del exportador. No son UUID originales, truncamientos, codificaciones ni hashes deterministas del identificador original. Dos entidades de tipos diferentes mantienen IDs diferentes aunque sus identificadores de origen coincidan. Bajas y cambios se comunican por IDs/versiones propios; no remapear por nombre.

Quedan excluidos del payload y de todas sus proyecciones: identificadores de fuente y UUID originales, tablas/campos/rutas originales, versiones de app/datos/publicación/codex, URLs/productId, claves técnicas de edición, huellas del origen, textos originales con referencias y evidencia/procedencia. El registro privado conserva la separación de versiones y revisión de evidencia; ninguna copia acompañante de ese registro se importa ni se incluye en el build. La restricción no borra cifras de juego como AP -1, BS 3+, D6+2 ni nombres de unidad/arma/modo.

Recalcular cada normalización desde `raw` y contrastarla con el valor declarado. No ejecutar texto/HTML. Validar forma, límites, allowlist de IDs/capacidades, referencias propias, edición y revisión de catálogo antes de construir un estado nuevo; reemplazar catálogo solo tras éxito. Mensajes de error usan códigos propios y no imprimen campos desconocidos, rutas ni fragmentos del archivo. No guardar el objeto externo completo por propagación de propiedades: reconstruir exclusivamente las estructuras admitidas. No mutar entrada manual, selección contraria ni perfiles guardados por cargar archivo nuevo.

La canonización del catálogo limpio se formalizará antes de implementar. Las variantes incompletas siguen incompletas: ninguna ocultación de ficha ni ausencia de campo autoriza a copiar valores de otra variante sin relación/semántica revisada privadamente. BS `-` puede resolverse como autoimpacto solo mediante capacidad local verificada, conservando su valor original de juego y el estado sintáctico del archivo.

Los resultados y snapshots propios guardan `catalogId/catalogVersion`, `rulesetVersion`, IDs propios, características empleadas, overrides manuales, contexto y limitaciones. No necesitan procedencia original para reproducir el cálculo con el mismo motor. Si el registro privado detecta cambios del origen que invalidan semántica, el exportador/revisor publica nueva revisión **propia** de catálogo/capacidades; el navegador valida esa revisión, sin recibir la razón identificativa del origen. Rechazar una revisión desconocida hasta adaptación explícita.

Ejemplo de características releídas para el piloto: Intercessor T `5`, Sv `3+`, W `2`; Bolt Rifle/Focused Fire, range `24"`, A `1`, BS `3+`, S `6`, AP `-1`, D `2`, type `ranged`. Esos son datos de juego conservados; los metadatos de extracción y sus identificadores no se trasladan. Las cifras no certifican que se hayan implementado todas las habilidades.

## Interfaz y archivos que se tocarán al implementar

| Zona actual | Trabajo previsto |
| --- | --- |
| `src/domain/dice/combat.ts`, `weapon.ts`, `savePool.ts` | Separar tiradas/características, decisión Lethal, daño tipado, condición de efecto y validación. Resolver críticos correlacionados y salvación por cara. Pools por fracción quedan fuera de soporte exacto vigente. |
| `src/application/dice/CalculateCombatResultUseCase.ts`, `CalculateUnitCombatUseCase.ts`, `CalculateRequiredAttacksUseCase.ts` | Sustituir caminos divergentes por núcleo común y añadir metadatos de soporte/resultados. API de una miniatura primero; nombres existentes no prometen unidad completa. |
| `CalculateRoundsToKillUseCase.ts`, `CompareCombatBuffUseCase.ts` | Absorción/cola, imposible/limitado explícitos, separación ofensiva/defensiva y mismos efectos/contexto. |
| `web/src/calculators/combat/presets.ts`, `useCombat.ts`, `CombatCalculator.tsx` | Extraer modelo común de formulario fuera de presets; selector de dados y portadores, heridas restantes y contexto. Ejemplos etiquetados «pedagógicos», con nombres genéricos o procedencia manual. |
| `web/src/calculators/required-attacks/useRequiredAttacks.ts`, `RequiredAttacksCalculator.tsx` | Mismos dados/modelo/capacidades; explicar «ataques individuales», no portadores/activaciones. Conservar resultado `success|impossible|limit`, P(n) y P(n-1). |
| `web/src/calculators/buffs/useCombatBuffComparison.ts`, `CombatBuffComparisonCalculator.tsx` | Un solo adaptador; BS/WS según tipo; métricas y sentido de mejora claros; horizonte/cola visible. |
| `web/src/calculators/combat/share.ts`, `shareImage.ts` | Edición legible, versiones propias de cálculo/catálogo, perfil/modo/contexto y reglas/limitaciones propias curadas; ninguna procedencia en texto, imagen, nombre de archivo o metadata. FP -1 y daño fijo 2 sin confundir con D2. |
| Nueva zona de adaptadores de catálogo y selector web | Contrato v2/validación fuera de domain; cargar/buscar datos por IDs propios y modo; atacante/defensor independientes; selección del modo Hunter condicionada a keyword. |
| `src/domain/profiles/unitProfile.ts`, `combat/combatRecord.ts`, repositorios y hooks móviles | Versionar envolturas de almacenamiento y revisar significado W total/pools; impedir recalcular datos legados como si fueran perfiles vigentes completos. No ampliar pantallas móviles al catálogo en H2. |
| `web/src/i18n/combat.ts`, traducciones móviles y pantallas compartidas | Todas las cadenas nuevas en es/en; estado de soporte y límites legibles. El módulo web actual solo cubre parte de los textos. |
| `README.md`, `docs/math/wh40k-combat.md`, `docs/math/weapon-abilities.md`, `.github/skills/wh40k/SKILL.md` | Revisar las afirmaciones que asumen otra edición. Documentar reglas/capacidades y límites propios sin trasladar procedencia a archivos publicados; evidencia detallada solo en revisión privada. No actualizar ejemplos por simple renombre ni reescribir la evaluación previa. |
| `.github/copilot-instructions.md`, `.github/instructions/{domain-math,testing,presentation}.instructions.md` | Conservar pureza, capas, nombres/código/pruebas en inglés, fórmula comentada y TDD. Añadir puerta de evidencia/versionado al flujo de reglas; retirar de skill WH40K supuestos no demostrados. |
| `.github/workflows/deploy.yml` | Antes de publicación futura, añadir pruebas del motor y comprobación de ausencia de procedencia original en activos, fixtures distribuidos, comentarios y source maps. La ejecución actual de Vitest incluye solo `web/src`. Mantener corpus, registro privado y JSON privados fuera del artefacto público. |

Experiencia H1: entrada manual visible desde el inicio, aviso de alcance «una miniatura», controles contextuales solo cuando una capacidad los necesita, decisión Lethal y política de repetición explícitas. Presets pedagógicos no son una ficha oficial aunque sus nombres recuerden armas o unidades. Resultados muestran soporte realmente aplicado; un error o caso pendiente no aparece como daño cero válido.

Experiencia H2: «Importar catálogo» → versión propia/facciones/cobertura/limitaciones → elegir lado atacante o defensor → unidad/variante/arma/modo → revisar cifras de juego y decisiones faltantes → calcular. El resumen y los errores nunca identifican la fuente original. Cambiar a modo manual crea una copia editable con overrides señalados; nunca modifica el catálogo. Nueva importación presenta cambio de `catalogVersion` y conserva snapshots propios existentes para revisión. Persistencia local del catálogo es optativa posterior, no condición del piloto.

## Entregas en orden

| Entrega | Trabajo y condición de salida |
| --- | --- |
| H1.1 Evidencia y contrato interno | Congelar referencias en registro privado de revisión y generar allowlist propia edición/capacidades sin metadatos originales. Resolver discrepancias antes de cambiar etiquetas. |
| H1.2 Núcleo y casos de uso | Correlación, decisión Lethal, salvaciones, dados/efectos/contexto, absorción y comparación. Pruebas de referencia rojas primero; los tres cálculos coinciden para la misma situación. |
| H1.3 Formulario y documentación | Entrada manual común, ejemplos pedagógicos, metadatos/resultados compartidos y revisión de instrucciones. Verificación web y regresión móvil; anunciar solo capacidades probadas. **Cierre del primer hito sin catálogo.** |
| H2.1 Importador privado | Consumir solo v2 limpio, validación estricta/transaccional de edición legible, revisiones propias y alcance; selección pequeña por defecto. No servir JSON privado desde `web/public`. |
| H2.2 Piloto | Intercessor y Beast Snagga Boyz; variantes/mode/invulnerable/keywords/originales, independencia de lados y reglas pendientes. Cifras manuales y adaptación idénticas con mismos efectos y contexto. **Cierre del segundo hito con importación limitada.** |
| A Ampliaciones | Unidades homogéneas y luego grupos distintos/CHARACTER con estado y salvaciones ordenadas; varias armas/modos/objetivos; capacidades pendientes; catálogo más amplio. Custodes solo tras actualización. Cada ampliación tiene evidencia y pruebas propias. |

## Pruebas y aceptación

No se ejecutaron suites de producto para esta tarea documental. Las siguientes pruebas son requisitos de implementación, no resultados ya obtenidos:

| Grupo | Casos de referencia y resultado que debe comprobarse |
| --- | --- |
| Dados/umbrales | Tabla S/T en límites; caras naturales 1/6 con modificadores; D3, D6, 2D6, D6+2, D3+1 y n portadores. Normalización de 2D6: P(2)=1/36, P(7)=6/36, P(12)=1/36, media 7. D6+2: soporte 3–8/media 5,5. Gramática desconocida se conserva y bloquea. |
| Repeticiones | BS3+ sin repetición éxito 4/6/crítico 1/6; repetir fallos éxito 8/9/crítico 8/36; repetir no-seises éxito 13/18/crítico 11/36. Autorización de política y cara final antes de modificadores, Torrent sin críticos. |
| Correlación | Un ataque BS6+, Sustained1, S>=2T, D1 y ninguna salvación posible, sin FNP: crítico (1/6) produce dos tiradas de herida 2+. P(daño=2)=25/216; no 25/1296 que resulta al independizar impactos. Verificar toda distribución, no solo media. |
| Lethal/Devastating | Con y sin elección autoherida; rama automática no crítica; extras Sustained conservan dependencia del crítico original. Una regla Anti revisada cambia caras críticas; no se activa mientras pendiente. |
| Salvación y FP | AP `-1`, `0`, original `1` ambiguo; Sv anulada con 6 observado no salva automáticamente; InSv no cambia por efecto restringido a armadura. Reroll/condición validada por cara. |
| Contexto | Cover empeora BS solo ranged; Ignores Cover lo elimina; Heavy requiere las cuatro condiciones E16; Rapid Fire/Melta prueban exactamente mitad de alcance y fuera; condición unknown no se decide silenciosamente. BS mejorada ≠ +1 al dado. |
| Objetivo/daño | Heridas actuales 1 contra W máxima 2; D3 mortal Devastating contra modelo W2 pierde exceso; FNP por punto; daño potencial frente a pérdida real. Solicitud de unidad completa rechazada en H1/H2. Mortales vinculadas conservan correlación. |
| Paridad | Para mismos datos/contexto, combate con A=n da P(eliminar) igual a la recurrencia de ataques necesarios para n. Baseline de comparación coincide con combate; +1Sv defensivo reduce daño o empata, nunca se recomienda por aumentar daño. |
| Fiabilidad y rondas | Sin daño -> impossible; P=100% con posible daño cero no tiene garantía finita; `limit` distinto de imposible; P(n-1)<objetivo<=P(n) en éxito. Para activación Bernoulli de éxito p y W1, E[T]=1/p; si p=0, infinita. Horizonte 20 conserva y muestra P(T>20). |
| Importación/selección | Contrato inválido/ID duplicado/referencia ausente/edición ajena/Custodes/Legends no alteran estado válido anterior. Importar no cambia lado contrario. Cambiar Standard/Hunter no suma modos. Campo ausente no se convierte en 0; relación parcial no es ausencia de habilidad. |
| Versionado propio y separación | Versión propia del catálogo/cálculo e IDs opacos llegan al snapshot; revisión desconocida exige adaptación. Perfil editado conserva override y valor de juego original; registro histórico no cambia de cálculo silenciosamente. Datos de publicación y origen permanecen fuera del producto. |
| Ausencia de referencias al origen | Payload final, estado del importador, índice/búsqueda, IndexedDB si se añade, historial, errores, consola/telemetría, texto/imagen compartidos, metadata, fixtures distribuidos y build/source maps no contienen identificadores, rutas, hashes, versiones ni publicaciones originales. Fixtures privados con marcadores de origen verifican rechazo sin eco del contenido. Campos desconocidos anidados y v1 se rechazan con código local. |
| UI y compartidos | Teclado/móvil web, errores legibles, controles de contexto, edición/capacidades y reglas omitidas presentes también en texto/imagen; ejemplo pedagógico nunca etiquetado ficha oficial. |
| Ampliación de unidades | 2 modelos W2, dos ataques D3 que dañan sin FNP destruyen 2 modelos y pierden 2 puntos; un único paquete D6 no equivale a tres miniaturas W2. Normales antes de mortales, Devastating máximo un modelo, orden grupos y caras menor→mayor según E03/E04/E21. Estas pruebas bloquean anunciar unidad exacta. |

Cada fórmula/caso de uso nuevo sigue TDD según instrucciones del proyecto: prueba focalizada de Jest junto al dominio/aplicación, luego revisión de tipos; Vitest para hooks/adaptadores/componentes web; suites afectadas del motor y móvil y build web al cerrar hito. Checks previstos: `npx jest --testPathPattern=<slice> --no-coverage`, `npx tsc --noEmit`, `npm test` y `npm run build` desde `web`. Un resultado verde de UI no valida reglas que no tengan prueba de fuente/caso de referencia.

### Rendimiento y límites propuestos

Los límites son decisiones de producto que deben medirse, no características del juego. H1 empieza con máximo 100 portadores, 1–500 heridas restantes de una miniatura y expresiones hasta 10D3/10D6 con constante 0–100; imponer además límite conjunto de soporte y operaciones estimadas para que no se multiplique sin control una combinación de máximos. Ataques necesarios ya limita a 10.000 ataques, W500 y valores S/D hasta 100; conservar estas validaciones inicialmente y exigir que cada resultado posible de S/D permanezca en ese rango para las tres calculadoras. El parser puede representar una expresión que no cumpla esos límites: se rechaza como cálculo fuera de capacidad, conservando original. No truncar probabilidades silenciosamente para cumplir un presupuesto.

Mantener estado absorbente O(W) para búsqueda contra una miniatura; complejidad aproximada O(n*W*K) con K soporte del daño por ataque. El núcleo con críticos también depende del máximo X/expansión: añadir guardia antes de cálculo. Cachear conversiones/distribuciones por inputs+rulesetVersion, y usar worker/cancelación si la medición excede la respuesta interactiva. Propuesta de presupuesto: feedback visible <100 ms, tareas habituales <500 ms y ninguna tarea permitida bloqueando el hilo principal >100 ms; validarlo con dispositivo de referencia documentado. `limit` incluye motivo, presupuesto y resultado hasta donde sea correcto.

H2: archivo inicial máximo 10 MiB, conteos acotados por tipo, validación antes de construir índices y rechazo sin sustitución del catálogo. Medir el piloto real antes de ampliar; búsqueda por ID propio/nombre preindexada y no releer/parsear todo archivo en cada render. Si esos presupuestos no bastan, diseñar fragmentación por unidad/facción y recalibrar límites con mediciones; no prometer rendimiento ni tamaño del catálogo completo.

## Decisiones confirmadas y pendientes

Confirmadas por Iván y coordinación: manual antes de JSON; un objetivo miniatura; Orks/Astartes standard/direct; Custodes tras siguiente actualización; selección pequeña por defecto/facción completa solo por elección expresa; catálogo privado por archivo; grafo con IDs propios y valores de juego originales; versiones propias de esquema/catálogo/revisión de capacidades/cálculo separadas. Versiones de publicación/codex/importación del origen quedan exclusivamente en registro privado. Semántica y contexto no se infieren de un nombre; contrato v2 limpio propiedad del plan de exportación; los chats editan solo su documento. No hay referencia al origen en el JSON ni en ninguna superficie del producto.

Pendientes de implementación/evidencia, sin impedir terminar este plan: semántica concreta de todas las habilidades de las dos unidades piloto, integración de InSv/FNP condicionales, X aleatorio, reglas Anti/Blast/Cleave y selección Hunter en cálculos soportados; casos de modificadores excepcionales/repeticiones de salvación/daño; protocolo exacto para dados observados; mediciones de tamaño/latencia; asignación por unidades y compatibilidad de todo el historial móvil. Cada punto se bloquea o se presenta como omitido antes de emitir un cálculo completo; ninguno se rellena con reglas de otra edición.

### Revisión cruzada de los chats

Los dos chats se comunicaron directamente con autorización expresa de Iván y editaron solo su documento. La revisión inicial quedó cerrada; la nueva restricción reemplaza su contrato. Se recibió y aceptó el envelope v2 con IDs opacos, valores sin localizador, mensajes locales, cobertura propia, condiciones propias y capacidades permitidas. El plan web incorporó la restricción también en historial, compartidos, validación y activos distribuidos.

**Revisión del consumidor del documento v2:** se leyó el contrato revisado y se aceptaron sus nombres/campos, IDs, gramática, cobertura y revisión propia de capacidades. No se detectó discrepancia de integración; ambas propuestas mantienen las cifras de juego y excluyen datos identificativos del origen. El límite 10 MiB sigue siendo propuesta compartida pendiente de medir.

**Cierre recíproco de la revisión v2:** ambos documentos han sido leídos y aceptados por el chat compañero, sin discrepancias de integración. El documento de exportación confirma expresamente la lectura y coherencia del plan web revisado. Tras autorización directa de Iván en este chat, el mensaje de cierre del consumidor se envió correctamente al chat de exportación. La revisión automática había bloqueado ese envío por no reconocer la autorización procedente de la conversación original; ese bloqueo de envío quedó resuelto mediante la autorización directa. No queda pendiente ninguna decisión de contrato ni la revisión local de ambos documentos.

El chat de exportación revisa contrato y alcance, no revalida todas las fórmulas de la matriz; esas siguen bajo responsabilidad de este plan y las pruebas futuras. Pendientes de implementación: esquema/canonización ejecutables, registro privado de revisión, bindings propios con evidencia, mediciones y cobertura de reglas del piloto. No se ha creado registro privado, exportador ni catálogo durante esta tarea documental.

Base de contexto preservada: [evaluación previa](warhammer-mcp-profile-integration.md). Este documento la desarrolla sin modificarla y no presupone que el código actual esté migrado.


## Implementación local — 7 de octubre de 2026

Se implementó el núcleo por ataque compartido y se corrigió la correlación de críticos, la invulnerable, la decisión Lethal y la expectativa completa de rondas. Las tres calculadoras utilizan CombatScenarioInput, parser de dados común y un formulario compartido. La comparación distingue característica y tirada, separa la defensa y muestra pérdida real y supervivencia al horizonte.

El importador local usa el esquema limpio v2, normalización repetida, referencias/propietarios, registro propio de confianza y comprobación SHA-256 del payload limpio. La sustitución es atómica y no guarda ni sube el archivo. El producto contiene contrato y huellas propias; ningún paquete privado se copia al repositorio ni al build. Se probaron los tres archivos entregados localmente: 510 combinaciones con acuerdo entre calculadoras y 12 selecciones Hunter incompatibles rechazadas. Las combinaciones pendientes se evaluaron solo como prueba explícita de alcance parcial, nunca como perfiles completos.

La primera aproximación mantiene cuatro bindings del piloto: Torrent, Heavy, Rapid Fire y Devastating. Las demás habilidades quedan visibles y requieren revisión o aceptación parcial; aviso breve y detalle desplegable, también en resultados compartidos. La planificación de ampliaciones pertenece a warhammer-rule-effects-integration.md y no añade implementación a este cierre.

Las pantallas nativas declaran sus supuestos de unidades anteriores. El historial no recalcula silenciosamente registros sin revisión o con revisión diferente. Hay límites deterministas de complejidad y búsqueda; detenerse no se presenta como éxito ni recorta masa para obtener resultados favorables.

Validación de cierre: 40 suites / 543 pruebas del núcleo y 18 archivos / 127 pruebas web aprobadas; comprobación de tipos y build web correctos. Los tres paquetes limpios pasan esquema, huella y 510 acuerdos de cálculo, con 12 selecciones incompatibles rechazadas. Verificación visual local: Bolt Rifle Saturation contra Beast Snagga Boy, un portador fuera de mitad de alcance y aceptación parcial, P(eliminar)=47,8%, daño potencial=0,56 y heridas perdidas=0,48. No se publica el sitio ni el catálogo.
