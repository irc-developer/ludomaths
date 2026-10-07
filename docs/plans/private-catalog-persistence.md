# Catálogo privado disponible al abrir LudoMaths

Implementación local del 7 de octubre de 2026, a petición de Iván. No se publica ni despliega.

## Funcionamiento

El proveedor común de Combate, Ataques necesarios y Buffs recupera el catálogo desde IndexedDB al abrir la aplicación. Antes de usarlo repite la validación v2, referencias, normalizaciones, registro de confianza propio y SHA-256 canónica. No se guardan selecciones, contexto ni aceptación parcial con el catálogo.

En el entorno de desarrollo local, cuando no hay copia guardada ni retirada explícita, carga automáticamente el piloto combinado desde el archivo limpio configurado en `web/.env.local`. En este equipo ya está configurado. La primera carga también se guarda en el navegador. No se ha copiado el paquete privado al repositorio, a `web/public`, a `web/dist` ni a un módulo importado por el cliente.

Iván ha pedido después retirar la importación del recorrido visible. La interfaz ya no muestra el selector de archivo, su explicación ni el botón de retirada asociado; conserva la carga automática y la selección de perfiles. El adaptador interno de importación/retirada se conserva para futuras necesidades y para sus pruebas de persistencia. Solo se escribe una copia después de validar el contenido. Una importación rechazada conserva el catálogo válido anterior en memoria y en almacenamiento. Las escrituras y retiradas se ordenan; una respuesta tardía no sustituye una selección de catálogo más reciente.

La retirada interna borra el payload guardado y mantiene un marcador vacío para evitar recargar automáticamente el archivo local al reabrir. Este control ya no se ofrece en la interfaz. Si el navegador impide guardar datos, la aplicación muestra un aviso propio sin contenido del archivo ni errores internos.

## Configuración y privacidad

Para configurar otro equipo local, crear `web/.env.local` con `LUDOMATHS_PRIVATE_CATALOG_FILE` apuntando al archivo limpio combinado, usando una ruta absoluta con barras `/`, y arrancar o reiniciar el servidor habitual de desarrollo. No usar prefijo `VITE_`. Este archivo de configuración está ignorado por Git; nunca debe contener el catálogo ni datos del proceso de preparación.

El endpoint de desarrollo solo admite lectura GET desde loopback y un host local. Rechaza peticiones entre orígenes y no envía cabeceras CORS. Sus respuestas no se cachean, no exponen rutas y limitan el archivo a 10 MiB. No existe en la vista previa estática ni en producción; el build elimina también la petición del cliente.

El almacenamiento pertenece al origen del navegador: cambiar de dominio, puerto, navegador o dispositivo crea otro almacenamiento. Una web publicada sin servicio privado puede recuperar una copia previamente guardada, pero ya no ofrece importación para un navegador nuevo; su disponibilidad automática fuera del entorno local requiere otro mecanismo privado de provisión. No se ofrece distribución pública del catálogo ni sincronización entre dispositivos. Borrar los datos del sitio elimina la copia, y el modo privado puede no conservarla al cerrar.

Se conserva la revisión propia guardada; actualizar un paquete o el registro no mezcla revisiones ni actualiza silenciosamente el catálogo. Las revisiones no admitidas se rechazan y requieren sustituir el archivo.

## Reglas y alcance

Se reutilizan `resolveCatalogScenario` y los cuatro bindings existentes: Torrent, Heavy, Rapid Fire y Devastating Wounds. Cargar o recuperar el catálogo no ejecuta efectos por nombre. Anti, Blast, hitBonus, riledUp y la condición pendiente de Lethal siguen sin activarse automáticamente. Se mantienen las condiciones necesarias, la aceptación de cálculo parcial y sus omisiones en resultados compartidos.

El alcance sigue siendo una miniatura objetivo, un modo de arma por grupo y el piloto de dos unidades/cuatro variantes/18 modos. La disponibilidad del catálogo no certifica soporte de todas las habilidades ni legalidad de equipo. La aplicación nativa no recibe este almacenamiento web.

## Verificación

Pruebas sintéticas de recuperación, importación, retirada persistente, validación rechazada, almacenamiento no disponible, sustitución atómica y respuestas tardías. Pruebas de transacciones abortadas/ordenadas y del endpoint local: límites, ruta base, origen/host/método, ausencia de configuración y fallos sin eco de rutas. Comprobación de que producción no solicita el endpoint privado.

Los tres paquetes limpios pasan de nuevo el validador y mantienen 510 acuerdos entre calculadoras y 12 selecciones incompatibles rechazadas. La suite web final pasa 21 archivos/152 pruebas, 25 pruebas más que la entrega anterior, sin avisos de actualizaciones asíncronas fuera de las pruebas. La comprobación de tipos y el build de producción pasan; este último se generó en un directorio temporal independiente para no sustituir el build del otro chat y se retiró tras verificar cero IDs privados de entidades, endpoint, configuración/ruta del archivo o source maps.

La comprobación en navegador local mostró las dos unidades y los 18 modos al abrir y tras recargar, sin usar el selector de archivos. No se alteró el núcleo matemático, no se repitió la suite anterior de 543 pruebas del núcleo y no se modificaron los documentos de los otros chats.
