# Coeficiente binomial — `binomialCoefficient(n, k)`

## Qué es

El coeficiente binomial C(n, k) responde a una pregunta concreta:

> **¿De cuántas formas distintas puedo elegir k elementos de un conjunto de n, si el orden no importa?**

Por ejemplo: ¿cuántas manos de 5 cartas distintas se pueden repartir de una baraja de 52? La respuesta es C(52, 5) = 2.598.960. No importa si te llegan en un orden u otro; lo que cuenta es qué cartas tienes.

En LudoMaths esta función es la base de casi todo: la distribución hipergeométrica la usa para calcular probabilidades de robar cartas, la binomial la usa para calcular probabilidades de éxito en múltiples tiradas, y la convolución de dados también descansa sobre ella.

---

## La fórmula clásica

$$C(n, k) = \frac{n!}{k! \cdot (n - k)!}$$

Fácil de entender, pero problemática en código: para C(52, 5) necesitas calcular 52!, que es un número de 68 dígitos. Los enteros de JavaScript solo son exactos hasta 2^53 − 1 (unos 9 × 10^15). Si usas la fórmula directamente con `n!`, pierdes precisión antes de llegar a resultados razonables.

---

## La fórmula multiplicativa

Hay una forma equivalente que evita calcular factoriales enormes:

$$C(n, k) = \prod_{i=1}^{k} \frac{n - k + i}{i}$$

En código:

```ts
let result = 1;
for (let i = 1; i <= k; i++) {
  result = (result * (n - k + i)) / i;
}
```

¿Por qué esto funciona y no pierde precisión? Cada vez que divides entre `i`, el resultado siempre es un entero exacto. Esto es un resultado de teoría de números: el producto de cualquier `k` enteros consecutivos es siempre divisible por `k!`. En otras palabras, en cada paso del bucle estás calculando un coeficiente binomial parcial, que es siempre entero. Nunca acumulas decimales.

---

## La optimización por simetría

El coeficiente binomial tiene una propiedad importante:

$$C(n, k) = C(n, n - k)$$

Esto significa que C(52, 50) es lo mismo que C(52, 2), y ambos se calculan en 2 iteraciones en lugar de 50. La implementación fuerza siempre el camino más corto antes de entrar al bucle:

```ts
const kk = k > n - k ? n - k : k;
```

El coste final es O(min(k, n−k)) en tiempo y O(1) en memoria.

---

## Validación de entradas

La función lanza `RangeError` en tres situaciones:

- `n` o `k` no son enteros (incluso si son números válidos en JS como `5.5`).
- `n` o `k` son negativos.
- `k > n` (no puedes elegir más elementos de los que hay).

Esto es validación en la frontera del dominio: cualquier uso incorrecto falla de forma explícita y ruidosa en lugar de devolver un resultado silenciosamente erróneo.

---

## Los tests: qué comprobamos y por qué

El archivo `combinatorics.test.ts` organiza los tests en cuatro bloques, cada uno con un propósito diferente.

### 1. Identidades base

```ts
expect(binomialCoefficient(5, 0)).toBe(1);
expect(binomialCoefficient(5, 5)).toBe(1);
```

C(n, 0) = 1 siempre: no hay opciones distintas para elegir _nada_. C(n, n) = 1 siempre: solo hay una forma de elegir _todo_. Estos son los límites del rango válido y el punto de partida de la recurrencia de Pascal.

### 2. Resultados conocidos

```ts
expect(binomialCoefficient(5, 2)).toBe(10);
expect(binomialCoefficient(52, 5)).toBe(2598960);
```

Comprobamos contra valores que se pueden verificar a mano o con una calculadora independiente. C(52, 5) es especialmente útil: es un número grande que ejercita la ruta de la fórmula multiplicativa y confirma que no hay pérdida de precisión.

### 3. Propiedades matemáticas

```ts
// Simetría
expect(binomialCoefficient(8, 3)).toBe(binomialCoefficient(8, 5));

// Regla de Pascal
expect(binomialCoefficient(7, 3)).toBe(
  binomialCoefficient(6, 2) + binomialCoefficient(6, 3)
);
```

No estamos comprobando un resultado concreto, sino que la función se comporta de acuerdo con las leyes matemáticas. Si alguna optimización futura rompe la simetría o la recurrencia, estos tests lo detectarán aunque los valores numéricos individuales sigan pasando.

### 4. Entradas inválidas

```ts
expect(() => binomialCoefficient(3, 5)).toThrow(RangeError);
expect(() => binomialCoefficient(5.5, 2)).toThrow(RangeError);
```

Verificamos que los errores se lanzan con el tipo correcto (`RangeError`, no un `Error` genérico) y en todos los casos límite: k > n, negativo en n, negativo en k, y no-entero en cualquiera de los dos.

---

## Dónde vive en la arquitectura

```
src/domain/math/combinatorics.ts       ← implementación
src/domain/math/combinatorics.test.ts  ← tests
```

Está en `domain/math` porque no sabe nada de dados, cartas ni de ningún juego. Es una función matemática pura. Las capas superiores (casos de uso, pantallas) dependen de ella; ella no depende de nadie.
