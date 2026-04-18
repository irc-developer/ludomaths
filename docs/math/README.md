# Documentación matemática — LudoMaths

Esta carpeta contiene la explicación de los módulos probabilísticos del proyecto, escritos para alguien con conocimientos de bachillerato. Cada documento explica el "para qué", la fórmula, un ejemplo resuelto a mano, y cómo encaja en el código.

---

## Índice

| Documento | Qué explica |
|---|---|
| [combinatorics.md](combinatorics.md) | Coeficiente binomial C(n, k): base de todo el resto |
| [binomial.md](binomial.md) | Distribución binomial: probabilidad de k éxitos en n tiradas |
| [hypergeometric.md](hypergeometric.md) | Distribución hipergeométrica: robar cartas de un mazo |
| [convolution.md](convolution.md) | Convolución discreta: distribución de la suma de varios dados |
| [pipeline.md](pipeline.md) | `applyStage` y `applyDamage`: las dos operaciones del combate WH40K |
| [weapon-abilities.md](weapon-abilities.md) | Sustained Hits, Lethal Hits, Devastating Wounds, Mortal Wounds |

---

## Orden de lectura recomendado

Si es la primera vez que llegas aquí, el orden natural es:

1. **[combinatorics.md](combinatorics.md)** — el coeficiente binomial es el bloque básico de todo lo demás.
2. **[binomial.md](binomial.md)** — distribución de éxitos en tiradas independientes. Usa el coeficiente binomial.
3. **[hypergeometric.md](hypergeometric.md)** — variante para robos de cartas. También usa el coeficiente binomial, pero el escenario es diferente.
4. **[convolution.md](convolution.md)** — distribución de la suma de dados. No depende de los anteriores pero complementa bien la imagen.
5. **[pipeline.md](pipeline.md)** — cómo se encadenan la distribución binomial y la convolución para modelar el combate de WH40K.
6. **[weapon-abilities.md](weapon-abilities.md)** — cómo las habilidades especiales del arma modifican el pipeline. Requiere entender el pipeline base.

---

## Glosario rápido

**Variable aleatoria discreta** — una magnitud cuyo valor no se puede predecir con certeza, pero cuyos posibles valores son contables: 0, 1, 2, 3… En juegos de mesa, casi siempre es el resultado de una o varias tiradas de dados.

**Distribución de probabilidad** — la lista completa de valores posibles junto con la probabilidad de cada uno. En el código es el tipo `Distribution`: un array de `{value, probability}`.

**Valor esperado $E[X]$** — el promedio que obtendríamos si repitiéramos el experimento infinitas veces. No es el valor más probable, sino el promedio ponderado por probabilidades: $E[X] = \sum_k k \cdot P(X=k)$.

**Distribución degenerada** — distribución con un único valor posible. Por ejemplo, un "dado" que siempre muestra 3 está representado como `[{value: 3, probability: 1}]`. Es el caso más simple: cero incertidumbre.

**Convolución** — operación que toma dos distribuciones independientes y produce la distribución de su suma.

**Adelgazamiento binomial** — operación que toma una distribución de intentos $N$ y una probabilidad de éxito $p$, y produce la distribución del número de éxitos. En el código es `applyStage`.
