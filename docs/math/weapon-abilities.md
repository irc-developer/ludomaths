# Combate acotado de WH40K 11.ª

El cálculo verificado de esta migración usa un grupo de armas idénticas, un modo seleccionado, portadores explícitos y una miniatura objetivo. Los ejemplos son pedagógicos; no son perfiles oficiales. La legalidad completa del equipo, otras unidades y habilidades sin soporte quedan fuera del resultado.

## Un ataque, ramas excluyentes

El núcleo compartido es `src/domain/dice/attackDamage.ts`. Si Z es el daño de un impacto normal, C el del impacto original crítico y X la cantidad fija de Sustained Hits:

P(D=d) = P(fallo) · I(d=0) + P(normal) · P(Z=d) + P(crítico) · P(C+Z1+…+ZX=d).

La suma dentro de la última rama conserva la relación entre el crítico y sus extras. Para impactar a 6+, herir a 2+, sin salvación y Sustained 1 de daño 1, P(D=2)=1/6·(5/6)^2=25/216. Separar los conteos de críticos y normales como binomiales independientes da una distribución incorrecta.

Lethal permite elegir herida automática o tirar para herir. La herida automática se salva normalmente y no puede generar Devastating. Torrent evita la tirada de impacto y sus críticos. Devastating evita las salvaciones, pero conserva FNP. Cada punto de daño pasa por FNP una vez.

La armadura compara su umbral tras AP y su modificador. La invulnerable ignora ambos; se elige la probabilidad más favorable. Un 1 natural falla, y un 6 natural no salva automáticamente. El límite neto ±1 corresponde a impactar/herir, no a la salvación.

## Características y contexto

Se conserva la distribución completa de A y D: número fijo, D3, D6 y nD3/nD6+k. Cada portador tira sus ataques independientemente. El sumando intrínseco de una expresión no es el bonificador externo. No se reemplazan dados por su media.

Cobertura empeora BS a distancia; Ignores Cover lo impide. Heavy exige todos sus estados explícitos. Rapid Fire y Melta dependen de la mitad del alcance al seleccionar objetivo. Twin-linked concede permiso para repetir al herir; la decisión de conservar éxitos/seises es separada.

## Pérdidas y rondas

El daño potencial D puede superar las heridas restantes W. La pérdida real de una miniatura es min(D,W), y su eliminación es P(D≥W). No se interpreta como probabilidad exacta de eliminar una unidad completa.

Con E(0)=0, la media completa de rondas independientes de perfil/contexto constante es:

E(w) = [1 + suma_(d>0) P(D=d)·E(max(0,w-d))] / P(D>0).

Si P(D>0)=0, la media es infinita. La tabla muestra un horizonte finito con probabilidad residual de sobrevivir; esa tabla no recorta la media. Los límites de coste pueden acortar explícitamente el horizonte mostrado o detener la búsqueda inversa, sin certificar un éxito.

## Soporte y límites

La entrada común valida hasta 100 portadores, 500 heridas, 10 dados D3/D6 y soporte de A/S/D hasta 100. Un límite conjunto de soporte/coste puede rechazar combinaciones de límites individuales. La búsqueda inversa tiene tope de 10.000 ataques y presupuesto de operaciones.

El piloto JSON ejecuta únicamente Torrent, Heavy, Rapid Fire y Devastating validados por identidad, revisión y huella propias. Otras habilidades se declaran pendientes u omitidas y exigen aceptación parcial cuando afectan al cálculo. Los conteos y dados observados del motor anterior y la asignación mediante fracciones siguen siendo aproximaciones anteriores; no se anuncian como 11.ª exacta.

Los registros llevan revisión propia del motor. Un historial antiguo o de otra revisión no se recalcula automáticamente. Los paquetes privados no forman parte del código, las pruebas públicas ni la web compilada.
