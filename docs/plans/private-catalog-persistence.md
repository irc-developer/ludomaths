# Catálogos disponibles al abrir LudoMaths

Implementación del 7 de octubre de 2026, a petición de Iván. La entrega inicial era local; Iván ha autorizado después publicar los tres catálogos limpios para que la web cargue perfiles en cualquier navegador.

## Funcionamiento

El proveedor común de Combate, Ataques necesarios y Buffs recupera el catálogo desde IndexedDB al abrir la aplicación. Antes de usarlo repite la validación v2, referencias, normalizaciones, registro de confianza propio y SHA-256 canónica. No se guardan selecciones, contexto ni aceptación parcial con el catálogo.

Cuando no hay copia guardada ni retirada explícita, el desarrollo local intenta primero el archivo limpio configurado en `web/.env.local`. Si no hay archivo configurado, y en producción, carga `catalogs/pilot-combined.json` desde la ruta base de la web. La primera carga validada también se guarda en el navegador. Los tres paquetes limpios están en `web/public/catalogs` y se copian como archivos estáticos al build. El combinado incluye Orks y Astartes; los paquetes individuales también están disponibles. Los volcados originales y su procedencia permanecen fuera del repositorio.

Iván ha pedido después retirar la importación del recorrido visible. La interfaz ya no muestra el selector de archivo, su explicación ni el botón de retirada asociado; conserva la carga automática y la selección de perfiles. El adaptador interno de importación/retirada se conserva para futuras necesidades y para sus pruebas de persistencia. Solo se escribe una copia después de validar el contenido. Una importación rechazada conserva el catálogo válido anterior en memoria y en almacenamiento. Las escrituras y retiradas se ordenan; una respuesta tardía no sustituye una selección de catálogo más reciente.

La retirada interna borra el payload guardado y mantiene un marcador vacío para evitar recargar automáticamente el archivo local al reabrir. Este control ya no se ofrece en la interfaz. Si el navegador impide guardar datos, la aplicación muestra un aviso propio sin contenido del archivo ni errores internos.

## Configuración y privacidad

Para configurar otro equipo local, crear `web/.env.local` con `LUDOMATHS_PRIVATE_CATALOG_FILE` apuntando al archivo limpio combinado, usando una ruta absoluta con barras `/`, y arrancar o reiniciar el servidor habitual de desarrollo. No usar prefijo `VITE_`. Este archivo de configuración está ignorado por Git; nunca debe contener el catálogo ni datos del proceso de preparación.

El endpoint de desarrollo solo admite lectura GET desde loopback y un host local. Rechaza peticiones entre orígenes y no envía cabeceras CORS. Sus respuestas no se cachean, no exponen rutas y limitan el archivo a 10 MiB. No existe en la vista previa estática ni en producción; el build elimina también la petición del cliente.

El almacenamiento pertenece al origen del navegador: cambiar de dominio, puerto, navegador o dispositivo crea otro almacenamiento. Un navegador nuevo recibe el piloto combinado publicado automáticamente, sin importar un archivo ni configurar un servicio privado. Los tres paquetes limpios son accesibles como archivos estáticos; no hay sincronización entre dispositivos. Borrar los datos del sitio elimina la copia guardada, y el modo privado puede no conservarla al cerrar.

Se conserva la revisión propia guardada; actualizar un paquete o el registro no mezcla revisiones ni actualiza silenciosamente el catálogo. Las revisiones no admitidas se rechazan y requieren sustituir el archivo.

## Reglas y alcance

Se reutilizan `resolveCatalogScenario` y los cuatro bindings existentes: Torrent, Heavy, Rapid Fire y Devastating Wounds. Cargar o recuperar el catálogo no ejecuta efectos por nombre. Anti, Blast, hitBonus, riledUp y la condición pendiente de Lethal siguen sin activarse automáticamente. Se mantienen las condiciones necesarias, la aceptación de cálculo parcial y sus omisiones en resultados compartidos.

El piloto contiene dos unidades, cuatro variantes y 18 modos. Se usa también en la pantalla de escuadras, cuyo alcance y límites están en `docs/math/squad-combat.md`. La disponibilidad del catálogo no certifica soporte de todas las habilidades ni legalidad de equipo. La aplicación nativa no recibe este almacenamiento web.

## Verificación

Pruebas sintéticas de recuperación, importación, retirada persistente, validación rechazada, almacenamiento no disponible, sustitución atómica y respuestas tardías. Pruebas de transacciones abortadas/ordenadas y del endpoint local: límites, ruta base, origen/host/método, ausencia de configuración y fallos sin eco de rutas. Comprobación de que producción no solicita el endpoint privado.

Los tres paquetes limpios pasan de nuevo el validador y mantienen 510 acuerdos entre calculadoras y 12 selecciones incompatibles rechazadas. La suite web final pasa 21 archivos/152 pruebas, 25 pruebas más que la entrega anterior, sin avisos de actualizaciones asíncronas fuera de las pruebas. La comprobación de tipos y el build de producción pasan; este último se generó en un directorio temporal independiente para no sustituir el build del otro chat y se retiró tras verificar cero IDs privados de entidades, endpoint, configuración/ruta del archivo o source maps.

La comprobación en navegador local mostró las dos unidades y los 18 modos al abrir y tras recargar, sin usar el selector de archivos. No se alteró el núcleo matemático, no se repitió la suite anterior de 543 pruebas del núcleo y no se modificaron los documentos de los otros chats.
