# Distancia de carga en WH40K

La calculadora estima la probabilidad de obtener distancia suficiente para un objetivo en una carga estándar de 11.ª edición. El jugador comprueba que la unidad puede declarar la carga y que existe un movimiento viable.

## Distancia medida y tirada

La unidad declara la carga y tira 2D6. Después selecciona los objetivos del movimiento: cada objetivo debe estar dentro de 12″ de la unidad y dentro de la distancia máxima obtenida. El resultado no obliga a intentar el movimiento.

Usamos la distancia medida completa **d**. No descontamos las 2″ del alcance de enfrentamiento. Llegar a una distancia que permitiría terminar trabado no basta para seleccionar un objetivo que esté fuera de la distancia máxima de la carga.

Los 36 pares de resultados de 2D6 son equiprobables. Por ejemplo:

| Distancia | Pares que alcanzan | Probabilidad |
| --- | --- | --- |
| 3″ | 35 de 36 | 97,22% |
| 7″ | 21 de 36 | 58,33% |
| 9″ | 10 de 36 | 27,78% |
| 9,1″ | 6 de 36: hace falta 10 o más | 16,67% |
| 12″ | 1 de 36 | 2,78% |

La medición no se redondea. En el formulario se puede escribir 9,1 o 9.1.

## Elegibilidad y movimiento

El alcance de enfrentamiento es 2″ horizontal y 5″ vertical. Una unidad trabada no puede declarar una carga estándar; avanzar o retirarse normalmente también lo impide, salvo una excepción aplicable.

A 2″ o menos y al mismo nivel ya habría enfrentamiento. La calculadora pide revisar ese contexto y no muestra un éxito garantizado. Las situaciones con alturas requieren un modelo de movimiento que esta herramienta no implementa. Un objetivo a más de 12″ queda fuera del alcance para seleccionarlo, aunque se añada un bonus a la tirada.

El porcentaje está condicionado a que la carga sea legal y el movimiento viable. El jugador debe comprobar terreno, coherencia y las condiciones de cada miniatura. La unidad debe terminar trabada con todos los objetivos seleccionados y con ningún enemigo adicional. La calculadora no resuelve esa geometría ni cargas múltiples.

## Modificador de la tirada

El campo de modificador admite un entero aditivo **m**, autorizado por una regla. Se aplica después de cualquier repetición y limita el resultado a 1–12:

```text
distancia de la tirada = min(12, max(1, 2D6 + m))
p = P(distancia de la tirada ≥ d)
```

Con +1, un doble 1 alcanza 3″. Por eso el doble 1 es insuficiente sin modificadores en una carga estándar, pero no se trata como un fallo natural universal.

Con +2 y una medición de 12″, los resultados naturales 10, 11 y 12 alcanzan: p = 6/36 = 16,67%. Los valores modificados superiores a 12 se agrupan en 12.

El límite ±1 de los modificadores de impacto y herida no se aplica a esta tirada.

Modificar la tirada y modificar la distancia máxima del movimiento son efectos distintos. El campo no representa penalizaciones del movimiento, como alzar el vuelo, ni sustituciones, multiplicaciones o divisiones de resultados. Esos casos requieren una ampliación específica.

## Repetición completa

La opción de repetir necesita permiso de una regla. El jugador decide repetir solo si la primera tirada no alcanza. Se repiten ambos dados una sola vez, antes de aplicar el modificador de nuevo:

```text
p con repetición = p + (1 − p) × p
```

A 9″ sin modificadores, p = 10/36. Con una repetición completa de las tiradas insuficientes, la probabilidad es 155/324 = 47,84%.

La repetición de mando es un ejemplo de permiso, sujeto a su disponibilidad. La calculadora no comprueba CP ni otras restricciones de uso.

## Un 6 observado

Este modo responde a una pregunta condicionada: un dado ya se ha observado como 6 y el otro todavía es desconocido. La primera tirada se modela como D6+6. No concede permiso para fijar un dado mediante una habilidad.

Si se repite la carga, el 6 observado se pierde y se vuelve a 2D6:

```text
p6 = P(D6+6 modificada alcanza d)
p2 = P(2D6 modificada alcanza d)
p con repetición = p6 + (1 − p6) × p2
```

A 9″ sin modificadores, p6 = 4/6 y p2 = 10/36. El resultado es 41/54 = 75,93%. Repetir solo el dado desconocido daría 88,89%, pero no representa una repetición completa ordinaria.

## Contrato del código

- `CalculateChargeProbabilityUseCase` recibe `distance`, `chargeRollModifier`, `reroll` y `observedSix`.
- `status: ready` devuelve una probabilidad de distancia suficiente; no certifica legalidad del movimiento.
- `outsideRange` y `checkEngagement` devuelven `probability: null`. No equivalen a una tirada válida con probabilidad cero.
- Entradas no finitas, distancia no positiva y modificadores que no sean enteros seguros producen un error.
- `rollDist` conserva la distribución natural inicial. `modifiedRollDist` contiene esa distribución tras el modificador y los límites. Ninguna representa la distribución final de una política de repetición.
- `useCharge` construye la referencia 3″–12″ según el modo, modificador y repetición elegidos. Una entrada inválida borra el resultado y la tabla.
- La interfaz conserva los borradores vacíos o incompletos, incluidos al salir del campo, y oculta los porcentajes hasta corregirlos.
- La pantalla muestra el resultado directamente bajo el supuesto de una carga legal y un recorrido viable, sin una casilla de confirmación. Distancia y repetición quedan a la vista; modificador y dado observado se agrupan en «Opciones». Su resumen indica las opciones activas incluso al cerrarlo. Las explicaciones están en «Reglas y cálculo» y la tabla muestra porcentajes redondeados.

La evidencia original del MCP queda en el registro privado local. El motor y la web funcionan sin consultar el MCP.
