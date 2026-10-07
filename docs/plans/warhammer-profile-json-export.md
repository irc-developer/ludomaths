# Plan de exportación JSON de perfiles para LudoMaths

Fecha: 7 de octubre de 2026. Estado: contrato v2 y preparación local del piloto implementados y validados; archivos enviados al chat web para integrar después de sus cambios de motor y formularios. Sin publicación de catálogos ni despliegue. Complementa el [plan web](wh40k-11th-web-migration.md). La evaluación anterior es histórica y no define el intercambio vigente.

## Decisión y restricciones

Preparar un proceso local que seleccione los perfiles necesarios y produzca **paquetes pequeños privados**. LudoMaths los abrirá mediante un selector de archivo; la web publicada contiene el cálculo y el importador, sin un catálogo grande incorporado.

Restricción acordada: **ninguna referencia a la fuente original en el JSON que reciba LudoMaths, la interfaz, resultados compartidos, historial ni archivos publicados**. Esto modifica el contrato inicial: el contrato limpio v2 sustituye al v1 con procedencia embebida. Ocultar campos en pantalla no basta; esos campos no entran en el navegador.

La trazabilidad para comprobar cambios se mantiene en un registro privado separado del proceso local. Conserva identidad y edición de la fuente, publicación y versión de codex, versión de importación, originales, relaciones y evidencia. Esos conceptos permanecen separados internamente, pero el archivo de producto solo contiene la edición del juego y versiones propias de LudoMaths.

Tres piezas independientes:

1. Preparación local privada: consultas, verificación, correspondencias y evidencia.
2. Paquete de perfiles: características, opciones y estados necesarios, con identificadores propios.
3. Web: lectura local, selección y adaptación al motor compartido.

El proceso específico de extracción, sus registros y evidencias no se incluyen en el build, repositorio publicado, registros públicos, telemetría ni mapas de código de la web. Este plan revisado no conserva localizadores originales listos para copiar al producto. La preparación y el mapa privado del piloto se han creado fuera del repositorio y permanecen separados de los paquetes limpios.

## Alcance y datos comprobados

Primero se adapta y verifica el cálculo de 11.ª con entrada manual. Después se prueba **Beast Snagga Boyz** de Orks e **Intercessor Squad** de Adeptus Astartes. Un grupo de portadores, un arma y un modo, contra una miniatura concreta. Cantidad de portadores y heridas actuales se eligen en el escenario; no se deducen de una composición.

Orks y Adeptus Astartes son las únicas facciones iniciales. Adeptus Custodes se incorpora después de la siguiente actualización y revisión. El proceso privado conserva la lista de selección original; el navegador reconoce únicamente los IDs propios de facciones admitidas.

Consultas de muestras ya realizadas: fuente disponible, catálogo directo estándar con 55 unidades Orks y 163 Astartes. Se comprobaron primera página, avance y cierre de paginación, los grafos de las dos unidades piloto y lecturas individuales de características/publicaciones. No se recorrió ni exportó el catálogo completo. La evidencia exacta de esas consultas pertenece a la preparación privada; estos totales no certifican legalidad ni soporte integral de todas las reglas.

| Muestra comprobada | Valores y relaciones útiles | Tratamiento |
| --- | --- | --- |
| Beast Snagga Boy | T 5, Sv 5+, W máxima 1 | Variante independiente |
| Nob de esa unidad | T 5, Sv 5+, W máxima 3 | No aplanar la unidad a una miniatura uniforme |
| Defensa de Beast Snagga Boyz | InSv general 6+; campos por tipo vacíos | Preservar alcance/condiciones, no inventar umbrales específicos |
| Choppa Hunter | A 3, WS 3+, S 6, AP -2, D 1; condición Monster/Vehicle | Un modo condicionado |
| Choppa Standard | A 3, WS 3+, S 5, AP -1, D 1 | Alternativa del mismo arma |
| Intercessor | T 5, Sv 3+, W máxima 2 | Sergeant mantiene identidad separada |
| Bolt Rifle Focused Fire | Alcance 24 pulgadas, A 1, BS 3+, S 6, AP -1, D 2 | Un modo, con efectos pendientes de verificar |
| Bolt Rifle Saturation | A 2, BS 3+, S 5, AP -1, D 1 | No sumar con Focused Fire |
| Hand Flamer | A 3, BS -, S 4, AP 0, D 1; regla de autoimpacto relacionada | El guion no se convierte en umbral ni autoimpacto sin capacidad validada |

La ausencia de filas inspeccionadas no anula efectos externos. Una variante con características ocultas en la presentación conserva sus cifras si existen; si faltan, no se heredan de otra variante sin evidencia revisada.

Se excluyen ambientación, imágenes/URL, puntos, misiones, construcción de listas, destacamentos, estratagemas, mejoras y adjuntos de líderes. Se retienen composición mínima, opciones de equipo, keywords y efectos relevantes para los cálculos. Una relación de disponibilidad no certifica legalidad.

## Entrega y tamaño

| Opción | Encaje con lo solicitado |
| --- | --- |
| Archivo privado por selección de unidades | Recomendado. Paquetes pequeños, carga local, web estática ligera, sin backend |
| Archivo privado por facción | Ampliación opcional tras medir tamaño/uso; no obliga a cargar todas las facciones |
| Catálogo servido con la web | Implementado después para los tres paquetes piloto limpios, con autorización expresa de Iván |
| Servicio externo de consulta por unidad | Alternativa futura si se quiere seleccionar sin importar archivos; requiere un servicio adicional y el mismo contrato limpio |

El despliegue actual publica archivos estáticos de `web/dist`. GitHub Pages sirve contenido estático ([documentación oficial](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)). La lectura local del archivo no añade un servidor ni una conexión directa con el proceso de extracción.

El importador usa memoria inicialmente, sin enviar el archivo a un servidor. Persistencia local opcional posterior, con borrado explícito. No cargar URL, HTML ni recursos incluidos en datos. El límite inicial propuesto es 10 MiB; es un límite de producto pendiente de medición, no el tamaño demostrado del piloto. Formalizar también límites de entidades, texto, profundidad, dados y operaciones.

La expansión a facciones completas es optativa. Incluso entonces, el catálogo sigue fuera del build y puede dividirse en paquetes independientes que incluyan sus dependencias necesarias.

Medición del piloto preparado, UTF-8 con formato legible: Orks 33.048 bytes (una unidad, dos variantes, cinco modos), Astartes 86.267 bytes (una unidad, dos variantes, trece modos), combinado 117.774 bytes (dos unidades, cuatro variantes, dieciocho modos). El combinado deduplica dependencias compartidas y permite seleccionar atacante/defensor de ambas facciones sin fusionar archivos en la web. No extrapolar estos tamaños a facciones completas.

## Preparación privada: selección, paginación y relaciones

1. Comprobar disponibilidad, capacidades e identidad exacta de la instantánea; conservarlas únicamente en el registro local. Si la identidad no está disponible, detener el intento.
2. Descubrir unidades por facción, perfil estándar y vínculo directo. El catálogo consultado admite páginas de 1–50 elementos. Empezar en offset 0 y seguir el siguiente offset devuelto hasta null. Comprobar avance, total estable, unicidad y huellas idénticas entre respuestas; una página corta no basta como condición de cierre.
3. Extraer solamente las unidades seleccionadas y su grafo. En el piloto son las dos unidades anteriores. Candidatos aliados/heredados no amplían la selección.
4. Construir un modelo intermedio privado mediante una lista positiva de campos. No copiar el grafo completo; contiene material excluido. Distinguir registros propios de unidad de definiciones alcanzadas por claves foráneas; no recorrer inversamente todas las unidades que reutilicen una definición.
5. Cerrar referencias necesarias a facciones, variantes, palabras clave, composición, equipo, armas, modos, habilidades y componentes de reglas. Contrastarlas individualmente si faltan. Una búsqueda por nombre solo descubre candidatos: no rellena huecos ni resuelve identidad por parecido.
6. Guardar cobertura y claves originales privadamente. Deduplicar por tipo/clave original en la misma instantánea; una discrepancia es error. Las relaciones sin identificador original usan clave compuesta solo en ese registro privado.
7. Revisar condiciones y texto útil privadamente. Un marcador de texto puede remitir a una regla de facción: seguir sus componentes, sin interpretarlo como ausencia. No usar reglas de otra edición para completar lagunas. El navegador recibe condiciones revisadas y descripciones propias, sin pasajes de evidencia ni citas.
8. Vincular la revisión del significado a la instantánea exacta y al efecto seleccionado. La revisión de equipo/listas no prueba semántica de combate. Las revisiones existentes se consultan de forma acotada y paginada si procede.
9. Remapear todas las entidades/extremos a IDs propios persistentes. Proyectar un objeto nuevo del contrato v2 y aplicar la revisión de ausencia de referencias a origen.
10. Volver a comprobar identidad al terminar. Si cambió, invalidar intento y repetir. Generar catálogo UTF-8, reporte neutro y escritura atómica; guardar por separado su correspondencia privada. Un intento incompleto no declara cobertura completa.

## Contrato limpio v2

`format="ludomaths-profile-catalog"`, `schemaVersion="2.0.0"`. La ruptura de versión señala que ya no existe procedencia embebida. No se ha implementado ni distribuido v1; la nueva planificación del importador lo rechaza.

| Bloque | Campos |
| --- | --- |
| Identidad de producto | `catalogId`, `catalogVersion`, `generatedAt`, `payloadSha256`, `edition="11"`, `capabilityReviewVersion` |
| `scope` | `factionIds`, `profile="standard"`, `eligibility="direct"`, `coverage` (pilot/selected/full-faction), `selectedUnitIds` |
| `factions` | `id,name,parentId` |
| `units` | `id,name,factionIds,miniatureIds,compositionIds,equipmentChoiceIds,ruleIds` |
| `miniatures` | `id,unitId,name,characteristics:{toughness,save,woundsMax},keywordIds,invulnerableSaves,ruleIds` |
| `weapons` | `id,name,modeIds,ruleIds` |
| `weaponModes` | `id,weaponId,name,type,range,characteristics:{attacks,ballisticSkill,weaponSkill,strength,armourPenetration,damage},targetCondition,ruleIds` |
| `keywords` | `id,name`; enlaces por variante/unidad según alcance revisado |
| `compositions` | `id,unitId,isDefault,members:[{miniatureId,min,max}],conditionRuleIds` |
| `equipmentChoices` | `id,unitId,miniatureId,kind,weaponIds,min,max,allowDuplicates,conditionRuleIds`; variantes según kind |
| `rules` | `id,name,description,reviewState,capabilityId,parameters,reviewVersion,requiredContext` |
| `relations` | `id,kind,fromId,toId,quantity,conditionRuleIds`; variantes según kind |
| `issues` | `code,severity,entityId,field,affects,messageCode` |
| `coverage` | `entityId,component,state,issueCodes`; component characteristics/equipment/abilities/defence, state complete/partial/not-included |

Todas las colecciones existen, aunque estén vacías. Los campos por variante se formalizan mediante tipos discriminados, sin bolsas de propiedades arbitrarias. El esquema usa **lista positiva estricta, con propiedades adicionales prohibidas incluso en objetos anidados**; no hay passthrough ni extensiones libres.

Se eliminan por completo fuente, procedencia, tablas/campos originales, identificadores originales, publicaciones, productos, versiones/fechas de origen, claves técnicas de edición, hashes de origen, rutas, URL, evidencias y comentarios. No existen `source`, `origin`, `publications`, `export`, `sourceField`, `evidenceRefs` ni `originalText`.

Los IDs son propios, opacos y aleatorios, prefijados por el tipo de producto: f_/u_/m_/w_/wm_/k_/c_/eq_/r_/rel_. Se asignan una vez y se mantienen con el mapa privado. No son el UUID original, un alias de tabla, un hash del original ni un nombre de unidad. Dos entidades de tipos diferentes mantienen IDs distintos aunque compartan clave original. El navegador admite solo los IDs propios previstos en su allowlist de facciones.

`catalogVersion` y `capabilityReviewVersion` son revisiones de LudoMaths; no codifican versiones de origen. `generatedAt` describe creación del paquete; no fecha de importación original. `payloadSha256` describe únicamente el catálogo limpio. Una huella de contenido detecta incoherencia; no demuestra autenticidad.

Los nombres de unidades/armas y características son contenido útil del juego. Los nombres/descripciones se revisan como texto de producto: sin encabezados de extracción, citas, URL, instrucciones, localizadores ni metadatos de publicación. Las reglas usan explicaciones propias mínimas; la evidencia textual exacta queda privada. Los mensajes se crean en la web a partir de `messageCode` de una lista local, sin texto libre de errores del extractor.

### Valores y soporte

Cada valor es `{raw,normalized,status}`. `raw` conserva exclusivamente la característica: cifra, umbral, expresión de dados o null; no conserva el registro ni la ruta del campo. Estado: parsed/missing/not-applicable/ambiguous/unsupported. Diferenciar valor ausente, null y campo no pertinente durante la preparación; transmitir su estado e incidencia neutros.

| Valor | Normalización y tratamiento |
| --- | --- |
| A/S/D fijo | `{kind:"fixed",value:n}`; parseo completo, sin restos |
| D3/D6/2D6/D6+2 | `{kind:"dice",count,sides,modifier}`; no sustituir por media |
| Umbral 3+ | 3, conservando raw |
| AP -1 o 0 | Magnitud 1 o 0 según contrato del dominio |
| AP 1 o +1 | null/ambiguous; no aplicar valor absoluto ni corregir silenciosamente |
| BS nulo de melee / WS nulo de ranged | not-applicable solo tras comprobar tipo/campo |
| BS - | unsupported; autoimpacto requiere capacidad local validada |
| Vacío/null/expresión desconocida en campo necesario | missing/unsupported e incidencia; sin valores por defecto |
| Alcance en pulgadas / Melee | `{kind:"inches",value}` / `{kind:"melee"}` |

La gramática de dados admite count entero positivo, sides 3/6 y modifier entero firmado. El consumidor define límites/aplicabilidad por característica; los formatos fuera de gramática conservan raw con unsupported. Nunca evaluar expresiones como código.

Parsed significa conversión, no soporte del motor. Un valor normalizado puede seguir bloqueado por una regla o condición pendiente.

### Variantes, equipo y condiciones

Composición conserva min/max de cada variante y alternativas discretas. No convertir 9 Boy + 1 Nob y 18 + 2 en cualquier combinación de 10–20 ni deducir portadores. Equipo conserva alternativas y requisitos pertinentes como entidades propias; no legalidad global.

Invulnerables mantienen ID propio, alcance unidad/variante, umbral general y por tipo, estados y reglas de condición. FNP y modificadores defensivos permanecen como efectos pendientes hasta que su extracción/significado tengan revisión. No inferirlos por nombre.

Keywords conservan identidad propia y alcance revisado. El objetivo miniatura puede necesitar contexto de su unidad y tamaño; no asumir automáticamente que cuenta como unidad de una miniatura para todas las reglas.

`targetCondition` de un modo utiliza keywords/condiciones propias y estado; Hunter y Standard son alternativas exclusivas. No sumar modos ni elegir el primero automáticamente.

`reviewState` indica pending/reviewed/out-of-scope. `capabilityId`, parameters y reviewVersion son nombres/versiones propios reconocidos por la aplicación; jamás código descargado. Las condiciones estructuradas solo se producen tras revisión privada. Lo pendiente mantiene una descripción propia, estado e incidencia; ninguna activación por nombre o regex.

El consumidor no confía en reviewed declarado por un archivo. Su registro local controla capacidad, parámetros permitidos, edición y revisión propia. Para automatizar un catálogo revisado debe reconocer su catalogId/catalogVersion/huella limpia y la revisión de capacidades; un archivo no reconocido se revisa o queda limitado a datos/entrada manual, sin convertir una afirmación del productor en soporte verificado.

## Ejemplo mínimo revisable

Proyección documental de Focused Fire, con cifras comprobadas e IDs ilustrativos propios. No es un archivo importable: faltan unidad, arma, relaciones y reglas, indicado por una incidencia. Un archivo real debe incluir las colecciones obligatorias y referencias cerradas. Los paquetes piloto preparados cumplen ese cierre y utilizan IDs propios persistentes; el ejemplo continúa siendo únicamente documental.

```json
{
  "format": "ludomaths-profile-catalog",
  "schemaVersion": "2.0.0",
  "catalogId": "lm_demo_01",
  "catalogVersion": "example-1",
  "generatedAt": "2026-10-07T00:00:00Z",
  "payloadSha256": null,
  "edition": "11",
  "capabilityReviewVersion": "pending",
  "scope": {
    "factionIds": ["f_demo_01"],
    "profile": "standard",
    "eligibility": "direct",
    "coverage": "selected",
    "selectedUnitIds": ["u_demo_01"]
  },
  "weaponModes": [{
    "id": "wm_demo_01",
    "weaponId": "w_demo_01",
    "name": "Focused Fire",
    "type": "ranged",
    "range": {"raw": "24\"", "normalized": {"kind": "inches", "value": 24}, "status": "parsed"},
    "characteristics": {
      "attacks": {"raw": "1", "normalized": {"kind": "fixed", "value": 1}, "status": "parsed"},
      "ballisticSkill": {"raw": "3+", "normalized": 3, "status": "parsed"},
      "weaponSkill": {"raw": null, "normalized": null, "status": "not-applicable"},
      "strength": {"raw": "6", "normalized": {"kind": "fixed", "value": 6}, "status": "parsed"},
      "armourPenetration": {"raw": "-1", "normalized": 1, "status": "parsed"},
      "damage": {"raw": "2", "normalized": {"kind": "fixed", "value": 2}, "status": "parsed"}
    },
    "targetCondition": {"state": "not-applicable", "keywordIds": []},
    "ruleIds": ["r_demo_01", "r_demo_02"]
  }],
  "issues": [{
    "code": "INCOMPLETE_EXAMPLE",
    "severity": "error",
    "entityId": "wm_demo_01",
    "field": "dependencies",
    "affects": "calculation",
    "messageCode": "catalog.incompleteExample"
  }]
}
```

El ejemplo debe parsear y carecer de metadatos de origen. Su hash null y colecciones ausentes son excepciones documentales, rechazadas en un archivo de producto.

## Consumidor y validación

Exportador: verifica privadamente evidencia/identidad, proyecta y remapea. Importador: valida contrato limpio y normalización. Adaptador compartido: comprueba capacidades/revisión propias y produce entradas del cálculo. El dominio no conoce consultas, procedencia ni navegador.

CombatContext contiene portadores, modo, distancia, fase, engagement, movimiento, colocación, cobertura, objetivos, keywords/tamaño del objetivo, heridas actuales y efectos/decisiones. W máxima pertenece al perfil. Nada se activa por defecto por aparecer en la ficha.

Validación:

1. Bytes/tamaño, JSON y schemaVersion 2.x conocido; tipos y lista positiva estricta. Rechazar v1, campos adicionales y estructura no admitida antes de sustituir catálogo.
2. IDs propios por tipo, duplicados, referencias, facciones permitidas, perfil estándar/directo y alcance seleccionado. Mantener el catálogo anterior ante cualquier error.
3. Recalcular normalized desde raw. Validar gramática/rangos, cobertura, condiciones y estados. Canonización y digest solo sobre contenido limpio, excluyendo payloadSha256; fijar algoritmo antes de implementar.
4. Comprobar ausencia de referencias originales en todos los campos, incluidos nombres/descripciones. Es un paso privado del exportador y una defensa adicional del consumidor: el browser usa códigos/mensajes propios, no listas de identificadores de origen para detectarlos.
5. Contrastar edición del juego y revisión con registro local de capacidades. El proceso privado mantiene la correspondencia exacta con fuentes; el navegador reconoce únicamente revisión semántica de LudoMaths.
6. Mostrar resumen de facciones/unidades, catalogVersion, edición, cobertura e incidencias neutras. Carga atómica y selecciones atacante/defensor independientes.
7. Para calcular, bloquear dato necesario ausente, AP ambiguo, referencia relevante no resuelta o capacidad/condición pendiente. Una incidencia de un modo no elegido no bloquea otros modos válidos.

Cobertura complete/partial/not-included se distingue de ausencia comprobada de habilidad. Una regla informativa revisada ajena a la métrica permite alcance parcial explícito; una regla que pueda cambiar el resultado no se omite silenciosamente. Unknown en contexto no pasa a false.

Overrides manuales conservan la característica importada y el cambio propio, sin modificar catálogo. Historial/compartidos guardan solo catalogId/catalogVersion/huella limpia, rulesetVersion, IDs propios, escenario y limitaciones. No fuente, publicaciones ni evidencia. Una nueva importación no sustituye automáticamente selecciones ni cálculos guardados.

## Actualizaciones y mapa privado

El mapa privado liga tipo/clave original a ID propio persistente, y paquete/revisión a identidad original, edición, publicación/versiones, originales, evidencia y derivaciones. Una fila sin clave propia usa la composición canónica interna, jamás expuesta. Conservar separado de catálogos y de directorios publicados.

Después de una nueva importación autorizada, consultar estado y diferencias privadamente; paginar y filtrar por unidades/dependencias seleccionadas. Cambios de regla compartida afectan a todos sus dependientes; alta/baja de relación exige revisar opciones aunque no cambien cifras.

Regenerar el paquete del alcance seleccionado completo, usando diferencias para revisión. En v2 no aplicar parches directamente en el navegador. Mantener IDs propios cuando la identidad original sea la misma; una identidad nueva recibe otro ID y la antigua queda obsoleta. No emparejar automáticamente por nombre.

La nueva instantánea invalida evidencia/revisión privada dependiente. Revalidar bindings y producir nueva catalogVersion/capabilityReviewVersion propias antes de rehabilitar automatismos. Al abrir el nuevo paquete, la web muestra cambio de versión propia, sin revelar qué importación/publicación lo causó. Versionar cálculo, catálogo y esquema por separado.

Custodes se incorpora después de la siguiente actualización, con una unidad piloto y revisión de variantes/salvaciones/condiciones; el mapa le asigna IDs propios. No se consultó ni exportó ahora su catálogo.

## Entregas y aceptación

| Paso | Entrega / cierre |
| --- | --- |
| 1. Contrato v2 | Esquema estricto ejecutable, tipos discriminados, canonización e IDs/mapa privado definidos |
| 2. Preparación local | Solo selección piloto; cierre de dependencias y evidencia privada; paquete limpio pequeño |
| 3. Importador | Validación atómica, índices y lados independientes; sin acceso a fuente ni publicación de paquetes |
| 4. Adaptador | Mismas entradas que manual, capacidades de 11.ª revisadas y bloqueo de pendientes |
| 5. Piloto | Boy/Nob, Choppa Hunter/Standard, Bolt Rifle Focused Fire/Saturation; originales de características y reglas necesarias tratados |
| 6. Ampliación opcional | Más selecciones o facción completa, solo tras medir; paquetes separados y privados |
| 7. Nueva importación/Custodes | Diferencias privadas, revisión nueva y tercer piloto sin cambiar contrato |

Pruebas futuras: paginación/cambio de instantánea; duplicados y cierre; selección estándar/directa; Custodes excluido; proyección sin puntos/lore/imágenes; parseo completo, AP negativo/cero/positivo y dados; BS -; vacío/null/no pertinente; W1/W3; modos exclusivos; InSv por alcance/condición; referencias/capacidades pendientes; independencia de lados; rollback; overrides e historial; esquema mayor desconocido/campos extra; límites de recursos.

Pruebas específicas de la restricción acordada: UUID/tablas/campos/versiones/huellas/rutas/URL originales ausentes de JSON y archivos publicados; campos adicionales rechazados incluso anidados; descripciones curadas; diagnósticos exclusivamente messageCode local; IDs propios no derivados del original; dos paquetes sucesivos mantienen IDs por mapa privado; bundle/mapas de código/logs/resultados sin materiales de extracción. Utilizar fixtures sintéticos de fuga en pruebas privadas; no incluir identificadores reales de origen en tests públicos.

Validación de la entrega ejecutada: 2.595 comprobaciones privadas de esquema estricto, referencias/propietarios, características preservadas, composiciones discretas, bundles/cantidades, exclusión de referencias de origen, casos límite de conversión, deduplicación y regeneración idéntica. La identidad de la instantánea y revisión privada permaneció estable entre preparación y cierre. Las huellas de los tres paquetes se verificaron también en JavaScript. Esto valida el intercambio, sin certificar legalidad completa ni soporte de todas las capacidades del motor. Las pruebas de importación, interfaz y adaptación pertenecen al chat web.

Esquema ejecutable: JSON Schema 2020-12, propiedades adicionales prohibidas en todos los objetos, reglas/capacidades y relaciones discriminadas. Canonización para payloadSha256: eliminar solo la propiedad raíz payloadSha256, ordenar claves de todos los objetos lexicográficamente, conservar orden de arrays publicados, JSON compacto sin escapar Unicode, SHA-256 sobre UTF-8. IDs propios de salvación usan prefijo sv_ con 24 caracteres hexadecimales, como el resto de entidades.

## Coordinación y pendientes

Ambos chats mantienen propiedad de su documento y se coordinan según la petición de Iván. El plan web es propietario de reglas/fórmulas/capacidades; este plan es propietario del contrato de intercambio. La revisión inicial v1 quedó cerrada, pero la nueva restricción la sustituye por v2 limpio.

Acuerdos: manual primero, piloto Beast Snagga Boyz + Intercessor Squad, un objetivo miniatura, catálogo privado pequeño por selección, facciones completas opcionales, Custodes posterior, semántica de extracción separada del cálculo, valores de características preservados y origen fuera del navegador. El consumidor pidió esquema estricto, textos curados, mensajes locales e IDs no derivados del origen; se incorporaron.

El consumidor ha aceptado el contrato v2 y sus subtipos. Este chat ha leído el plan web revisado y confirma coherencia de contrato, selección pequeña, privacidad del registro y estados de soporte. Iván autorizó directamente continuar la preparación y enviar los JSON al otro chat para integrar una vez finalice sus cambios. La entrega se ha enviado con los tres paquetes, esquema estricto, manifiesto de IDs/huellas propias, reporte de validación y guía de integración; la coordinación ya no está bloqueada.

La entrega local está en la carpeta de artefactos de este chat, fuera del repositorio: profile-catalogs, con packages/orks-pilot.json, packages/astartes-pilot.json, packages/pilot-combined.json, catalog-schema-v2.json, integration-manifest.json, validation-report.json y README.md. El chat web tiene la ruta absoluta y debe consumir solo estos archivos limpios. No debe incorporar paquetes ni preparación a web/public, web/dist o al bundle. Las pruebas públicas usan fixtures sintéticos.

El chat web confirmó lectura de la guía, manifiesto y cabecera del esquema y aceptó la entrega. Tras cerrar resultados compartidos y protección del historial, realizará lectura atómica y verificará los tres paquetes desde sus rutas locales. La integración todavía está pendiente; no se afirma completada por haber enviado archivos. Los siete archivos entregados han pasado además una auditoría final de ausencia de localizadores/huellas y vocabulario privado.

Revisiones propias: catalogVersion pilot-1, capabilityReviewVersion lm-pilot-1 y reviewVersion 1.0.0 para reglas revisadas o fuera de alcance. Capacidades presentes: rapidFire, heavy, torrent, devastatingWounds, anti, blast, hitBonus y riledUp. reviewed no implica soporte del motor: las capacidades relevantes no implementadas o sin contexto deben bloquear o exigir alcance parcial explícito. La condición de Lethal Hits queda pending, con capabilityId/reviewVersion null; no deducirla del título. La legalidad del equipo queda fuera del cálculo y señalada como cobertura parcial.

Pendientes del consumidor: finalizar motor/formularios, implementar y probar carga local y adaptación, registro confiable de revisiones/huellas propias, validación semántica, contexto y soporte de capacidades. Este piloto no certifica compatibilidad integral ni tamaño del catálogo completo. Custodes permanece para una siguiente actualización autorizada.
