# Distribución binomial — `binomialProbability` y `binomialDistribution`

## Qué pregunta responde

> Hago el mismo experimento N veces y cada vez puede salir bien (con probabilidad p) o mal. **¿Cuántas veces sale bien, y con qué probabilidad?**

Ejemplos de juego: lanzas 6 dados y buscas un 3+. ¿Cuál es la probabilidad de conseguir exactamente 4 impactos? ¿Al menos 3? Eso es la distribución binomial.

---

## Por qué se llama "binomial"

"Binomial" significa "dos nombres": el experimento tiene exactamente dos resultados posibles, éxito o fracaso. Si el experimento tiene más resultados, los agrupamos (por ejemplo, "1, 2 = fallo; 3, 4, 5, 6 = éxito") para reducirlo a dos.

La condición importante es que cada repetición es **independiente**: el resultado del dado anterior no afecta al siguiente. En la tirada de dados esto se cumple; en robar cartas de un mazo, no (por eso existe la distribución hipergeométrica).

---

## La fórmula

Si lanzamos $n$ dados con probabilidad $p$ de éxito en cada uno, la probabilidad de obtener **exactamente $k$ éxitos** es:

$$P(X = k) = \binom{n}{k} \cdot p^k \cdot (1-p)^{n-k}$$

Desglosada pieza a pieza:

- $\binom{n}{k}$ (coeficiente binomial, "n sobre k") — cuenta de cuántas formas distintas podemos elegir qué $k$ dados de los $n$ totales salen bien. No importa cuáles, solo cuántos.
- $p^k$ — probabilidad de que esos $k$ dados elegidos salgan bien.
- $(1-p)^{n-k}$ — probabilidad de que los $n-k$ dados restantes salgan mal.

**Ejemplo concreto:** 4 dados, cada uno acierta con $p = \frac{2}{3}$ (dado con "éxito" en los valores 3, 4, 5, 6). ¿Probabilidad de exactamente 2 éxitos?

$$P(X=2) = \binom{4}{2} \cdot \left(\tfrac{2}{3}\right)^2 \cdot \left(\tfrac{1}{3}\right)^2 = 6 \cdot \tfrac{4}{9} \cdot \tfrac{1}{9} = \tfrac{24}{81} \approx 0{,}296$$

---

## La distribución completa

La función `binomialDistribution(n, p)` no devuelve un único número: devuelve **todas las probabilidades** para $k = 0, 1, 2, \ldots, n$. Esto permite calcular después probabilidades acumuladas, valor esperado o representar una gráfica completa.

La suma de todas las probabilidades siempre es exactamente 1, porque alguien tiene que ganar (incluyendo el caso de 0 éxitos). Esto lo usan los tests para verificar que ningún cálculo pierde o gana probabilidad por errores de coma flotante.

---

## Valor esperado y varianza

Dos resultados clásicos de la distribución binomial que no hay que demostrar, solo recordar:

$$E[X] = n \cdot p \qquad \text{(número esperado de éxitos)}$$

$$\text{Var}(X) = n \cdot p \cdot (1-p)$$

Con $n=6$ dados y $p=\frac{4}{6}$ (dados que aciertan en 3+):

$$E[X] = 6 \cdot \tfrac{4}{6} = 4 \quad\text{impactos esperados}$$

---

## Casos límite que valen la pena entender

| Situación | Resultado |
|---|---|
| $k = 0$ | $P = (1-p)^n$ — probabilidad de que todos fallen |
| $k = n$ | $P = p^n$ — probabilidad de que todos acierten |
| $p = 0$ | Solo $P(X=0) = 1$ — nada puede acertar |
| $p = 1$ | Solo $P(X=n) = 1$ — todos aciertan |

Estos son los casos frontera que los tests verifican primero, porque si la fórmula falla en los extremos suele revelar errores de lógica básica.

---

## Dónde vive en la arquitectura

`src/domain/math/binomial.ts` — capa de matemáticas puras. No sabe nada de dados, tableros ni juegos: recibe $(n, k, p)$ y devuelve una probabilidad. Los módulos de juego (WH40K, dados genéricos) son los que deciden qué vale $p$ en su contexto.
