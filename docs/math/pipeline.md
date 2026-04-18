# Pipeline de combate WH40K — `applyStage` y `applyDamage`

## De qué trata este documento

En WH40K lanzas dados en varias etapas seguidas: primero para impactar, luego para herir, luego para salvar. En cada etapa, el número de dados que entran se "afina" según una probabilidad de éxito. Al final, las heridas que pasan la salvación hacen daño variable.

Este documento explica las dos operaciones matemáticas que modelan ese proceso, y por qué el resultado es correcto aunque a primera vista parezca un atajo.

---

## El problema: etapas encadenadas

Supón que lanzas 6 dados de ataque y cada uno impacta con probabilidad $p_1 = \frac{4}{6}$. Los impactos hacen tirada de herida con $p_2 = \frac{3}{6}$. Las heridas pasan la salvación con $p_3 = \frac{4}{6}$ (probabilidad de *fallar* la tirada de salvación). ¿Cuántas heridas sin salvación hay?

El número de heridas sin salvación no es determinista: depende de cuántos dados siguieron el camino éxito-éxito-éxito. La respuesta no es un número sino una distribución: P(0 heridas sin salvación), P(1 herida sin salvación), etc.

---

## `applyStage` — adelgazar una distribución

La función `applyStage(dist, p)` responde a:

> Tengo una distribución de "número de intentos" `dist`. Cada intento tiene probabilidad `p` de éxito. **¿Cómo se distribuye el número de éxitos?**

Matemáticamente es una suma de variables binomiales con parámetro aleatorio. Si el número de intentos es $n$ con probabilidad $P_N(n)$, y dado $n$ el número de éxitos sigue una $\text{Bin}(n, p)$:

$$P(S = s) = \sum_n P_N(n) \cdot P(\text{Bin}(n, p) = s)$$

Esto se llama **distribución binomial compuesta** o **adelgazamiento de Poisson**.

**Caso simple:** si la distribución de entrada es degenerada en $n$ (exactamente $n$ intentos), el resultado es simplemente $\text{Bin}(n, p)$: la distribución binomial estándar. La función se reduce a lo ya conocido.

**Caso general:** si los intentos son variables (por ejemplo, la distribución de dados de un arma con ataques variables como "D6"), se promedia sobre todos los posibles valores de $n$.

---

## Encadenar etapas es correcto

La propiedad más importante del adelgazamiento binomial: **se puede aplicar en secuencia** y el resultado es el mismo que calcular todo de una vez.

Si empezamos con $N$ ataques y application etapas con probabilidades $p_1, p_2, p_3$, el resultado de aplicar `applyStage` tres veces seguidas es idéntico al de aplicar `applyStage` una sola vez con $p = p_1 \cdot p_2 \cdot p_3$.

En WH40K: $P(\text{herida sin salvar}) = p_\text{hit} \cdot p_\text{wound} \cdot p_\text{fail\_save}$. 

El código aplica las tres etapas por separado (para poder insertar modificadores, rerolls y habilidades especiales en medio), pero el resultado final es el mismo que si se multiplicaran directamente las tres probabilidades.

---

## `applyDamage` — daño variable por herida

Cuando una herida sin salvación hace daño variable (por ejemplo, D3), el daño total de $k$ heridas es la **suma aleatoria de $k$ copias independientes del daño**.

La función `applyDamage(woundDist, damageDist)` calcula:

$$P(\text{daño total} = d) = \sum_k P(\text{heridas} = k) \cdot P\!\left(\sum_{i=1}^k D_i = d\right)$$

donde cada $D_i$ es independiente e idénticamente distribuida según `damageDist`.

La segunda probabilidad es `multiConvolve(damageDist, k)`: la distribución de la suma de $k$ copias de la distribución de daño, calculada mediante convoluciones sucesivas.

Para $k = 0$ (ninguna herida), el daño total es siempre 0 — no hay nada que sumar.

---

## Ejemplo concreto de todo el pipeline

**Arma:** 6 ataques, impacta en 3+ ($p_\text{hit} = \frac{4}{6}$), S4 vs T4 → hiere en 4+ ($p_\text{wound} = \frac{3}{6}$), AP-2 contra salvación de 3+ → efectiva 5+ → falla salvación en $p_\text{fail} = \frac{4}{6}$. Daño: 1 punto fijo.

1. `applyStage([{value:6, prob:1}], 4/6)` → distribución de impactos ~ $\text{Bin}(6, \tfrac{4}{6})$
2. `applyStage(hitDist, 3/6)` → distribución de heridas
3. `applyStage(woundDist, 4/6)` → distribución de heridas sin salvación
4. `applyDamage(unsavedDist, [{value:1, prob:1}])` → idéntico a unsavedDist (daño fijo = 1)

Valor esperado:

$$E[\text{daño}] = 6 \cdot \tfrac{4}{6} \cdot \tfrac{3}{6} \cdot \tfrac{4}{6} = \tfrac{8}{9} \approx 0{,}89$$

---

## Por qué separar las dos funciones

`applyStage` modela la etapa de "tiradas de éxito": muchos dados, cada uno pasa o no. `applyDamage` modela "cada dado que pasa genera una cantidad variable de daño adicional". Son conceptualmente distintos:

- En `applyStage`, el éxito es un sí/no (impactar, herir, fallar salvación).
- En `applyDamage`, el resultado es una cantidad positiva variable (daño por herida).

Mantenerlas separadas también permite insertar Feel No Pain entre la etapa de daño y el resultado final: FNP niega puntos de daño individuales uno a uno, que matemáticamente es otro `applyStage` aplicado sobre la distribución de daño.

---

## Dónde viven en la arquitectura

`src/domain/math/pipeline.ts` — capa de matemáticas puras. Las funciones no conocen el concepto de "ataque", "herida" ni "dado de 6 caras": trabajan con distribuciones abstractas y probabilidades en $[0, 1]$. El módulo de WH40K (`CalculateUnitCombatUseCase`) es el que decide qué significa cada probabilidad en el contexto del juego.
