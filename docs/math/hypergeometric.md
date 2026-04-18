# Distribución hipergeométrica — `hypergeometricProbability`

## Qué pregunta responde

> Tengo un mazo de $N$ cartas, de las cuales $K$ son de un tipo concreto. Robo $n$ cartas. **¿Cuál es la probabilidad de que exactamente $k$ de las que robo sean del tipo que busco?**

La diferencia clave con la distribución binomial: aquí cada carta que robo **cambia el mazo**. Si robo un ás, ya no está, y la probabilidad de que la siguiente sea un ás es menor. Las tiradas no son independientes.

---

## Cuándo usarla (y cuándo no)

Usa la hipergeométrica cuando **robas sin reemplazar**: cartas de un mazo, bolas de una urna, muestras sin devolución.

Usa la binomial cuando **los intentos son independientes**: lanzar dados, lanzar una moneda varias veces, ataques en WH40K (cada dado no modifica el siguiente).

---

## La fórmula

$$P(X = k) = \frac{\dbinom{K}{k} \cdot \dbinom{N-K}{n-k}}{\dbinom{N}{n}}$$

Donde:
- $N$ — tamaño total del mazo.
- $K$ — número de cartas del tipo buscado en el mazo.
- $n$ — número de cartas robadas.
- $k$ — número de cartas del tipo buscado que queremos tener en la mano.

**Cómo leerla:** el denominador $\binom{N}{n}$ es el número total de manos posibles de $n$ cartas. El numerador cuenta las manos favorables: elegimos $k$ cartas "buenas" de las $K$ disponibles ($\binom{K}{k}$) y completamos con $n-k$ cartas "malas" de las $N-K$ restantes ($\binom{N-K}{n-k}$). La fracción es la proporción de manos favorables sobre el total.

---

## Ejemplo paso a paso

Mazo de 60 cartas, con 4 copias de una carta clave. Robo una mano inicial de 7 cartas. ¿Probabilidad de tener **al menos una** copia?

El camino más sencillo es calcular el complementario: $P(\text{al menos 1}) = 1 - P(k=0)$.

$$P(X=0) = \frac{\binom{4}{0} \cdot \binom{56}{7}}{\binom{60}{7}} = \frac{1 \cdot 231627540}{386206920} \approx 0{,}600$$

$$P(\text{al menos 1}) \approx 1 - 0{,}600 = 0{,}400$$

Con 4 copias en un mazo de 60, tienes aproximadamente un 40% de probabilidad de encontrar la carta en los primeros 7 robos.

---

## Cómo cambia la probabilidad con el mazo

La hipergeométrica hace visible algo que la intuición a veces falla: **ir a más copias tiene rendimientos decrecientes**.

Con 4 copias en 60, P(al menos 1 en 7) ≈ 40%.  
Con 8 copias en 60, P(al menos 1 en 7) ≈ 65%.  
Con 12 copias en 60, P(al menos 1 en 7) ≈ 80%.

Doblar las copias no dobla la probabilidad.

---

## Probabilidad acumulada

En la mayoría de los escenarios de juego no queremos $P(X = k)$ exacto sino "$P(X \geq k)$" (al menos $k$ cartas) o "$P(X \leq k)$" (como mucho $k$ cartas). Estas se calculan sumando la PMF:

$$P(X \geq k) = \sum_{j=k}^{\min(n,K)} P(X = j)$$

$$P(X = 0) \text{ calculado primero, luego } P(X \geq 1) = 1 - P(X=0)$$

El segundo es más eficiente cuando $k=1$ porque solo requiere una evaluación de la fórmula.

---

## Valor esperado

$$E[X] = n \cdot \frac{K}{N}$$

Es la misma forma que para la binomial ($E = n \cdot p$) con $p = K/N$. La diferencia es que la hipergeométrica tiene **menos varianza** que la binomial con la misma $p$, porque al robar sin reposición el resultado está más "concentrado": si ya robaste una copia buena, es menos probable que salga otra. Esto se nota en manos grandes.

---

## Dónde vive en la arquitectura

`src/domain/math/hypergeometric.ts` — capa de matemáticas puras. Delega el cálculo de coeficientes binomiales a `combinatorics.ts` en vez de recalcularlos, porque la fórmula usa tres coeficientes distintos y tiene sentido reutilizar la función ya validada.
