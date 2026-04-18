# Weapon abilities de WH40K en el pipeline de combate

## Qué son y por qué necesitan tratamiento especial

El pipeline estándar de WH40K (ataques → impactos → heridas → tirada de salvación → daño) asume que cada dados de ataque pasa por todas las etapas de manera uniforme. Las *weapon abilities* rompen este flujo: algunas dados de impacto generan impactos adicionales, otras obligan a herir sin tirada, y ciertas heridas se saltan la salvación. Ninguno de estos comportamientos puede modelarse con la función `applyStage` por sí sola, porque esa función aplica una probabilidad **uniforme** a toda la distribución de éxitos.

El problema central es que cada *ability* depende de si un dado mostró exactamente 6 (un **impacto / herida crítica**). Para modelarlo correctamente hay que separar la contribución de los 6 del resto de la distribución, calcular los efectos especiales de esa fracción, y luego reunir ambas corrientes al final.

---

## Las cuatro abilities implementadas

### 1. [SUSTAINED HITS X]

**Regla (10.ª ed.):** cada vez que un dado de ataque muestra un 6 sin modificar (impacto crítico), ese ataque genera X impactos adicionales que se resuelven como impactos normales.

**Modelo matemático:**

Sea $N$ el total de dados de ataque, $p_\text{crit} = P(D6 \geq 6) = \frac{1}{6}$ (ajustado por *reroll* si aplica), y $p_\text{hit}$ la probabilidad total de impacto.

El número de impactos se descompone en dos corrientes independientes (cada dado decide de forma independiente su resultado):

$$\text{HitsDist} = \underbrace{\text{Bin}(N,\ p_\text{hit})}_{\text{impactos regulares}} \;+\; \underbrace{X \cdot \text{Bin}(N,\ p_\text{crit})}_{\text{impactos extra}}$$

Donde $+$ denota la convolución de las dos distribuciones. Los impactos extra se distribuyen idénticamente a los normales desde ese punto — no son críticos y no desencadenan nuevas habilidades.

**Implementación:** se usa `applyDamage(critHitsDist, [{value: X, probability: 1}])` para obtener la distribución de $X \cdot \text{Bin}(N, p_\text{crit})$. Esto explota que `applyDamage` con daño fijo $X$ es equivalente a multiplicar cada valor de la distribución por $X$.

---

### 2. [LETHAL HITS]

**Regla:** cada impacto crítico (6 sin modificar) hiere automáticamente al objetivo. La tirada de herida se omite para ese impacto. La herida automática **sí** realiza tirada de salvación.

**Modelo matemático:**

Se divide la distribución de dados de ataque en dos grupos independientes:

- **Impactos críticos:** $k_\text{crit} \sim \text{Bin}(N, p_\text{crit})$ → pasan directamente a la etapa de salvación como heridas automáticas.
- **Impactos normales:** $k_\text{norm} \sim \text{Bin}(N, p_\text{hit} - p_\text{crit})$ → pasan por la tirada de herida normal.

El valor esperado total de heridas es:

$$E[\text{heridas}] = N p_\text{crit} + N(p_\text{hit} - p_\text{crit}) \cdot p_\text{wound}$$

Comparado con el pipeline estándar ($E = N p_\text{hit} p_\text{wound}$), la diferencia es:

$$\Delta E = N p_\text{crit}(1 - p_\text{wound}) \geq 0$$

Es decir, *Lethal Hits* siempre aumenta el daño esperado, y el incremento es mayor cuanto más difícil es herir ($p_\text{wound}$ pequeño).

---

### 3. [DEVASTATING WOUNDS]

**Regla:** cada vez que un dado de herida muestra un 6 sin modificar (herida crítica), esa herida se convierte en heridas mortales iguales al daño del arma. Ninguna tirada de salvación tiene efecto sobre las heridas críticas. El Feel No Pain **sí** aplica.

**Modelo matemático:**

A partir de la distribución de impactos $\text{HitsDist}$, la etapa de heridas se descompone:

$$\text{CritWoundsDist} = \text{applyStage}(\text{HitsDist},\ p_\text{crit\_wound})$$

$$\text{NormWoundsDist} = \text{applyStage}(\text{HitsDist},\ \max(0,\ p_\text{wound} - p_\text{crit\_wound}))$$

donde $p_\text{crit\_wound} = \texttt{dieSuccessProbability}(6,\ 0,\ \text{woundReroll})$.

Las heridas críticas se separan **antes** de la etapa de salvación y se incorporan directamente al cálculo de daño. Las heridas normales siguen el camino habitual.

El daño esperado total es:

$$E[\text{daño}] = E[\text{impactos}]\cdot\left[p_\text{crit\_wound} + (p_\text{wound} - p_\text{crit\_wound}) \cdot p_\text{fail\_save}\right]$$

Cuando la salvación es imposible ($p_\text{fail\_save} = 1$), los términos se reducen a $E[\text{impactos}] \cdot p_\text{wound}$, idéntico al caso sin *Devastating Wounds* — lo que confirma que la habilidad no tiene utilidad contra una salvación nula.

---

### 4. [MORTAL WOUNDS per hit] — $Y$ heridas mortales por impacto

**Regla (interpretación del proyecto):** cada impacto (incluyendo impactos críticos y los extras de *Sustained Hits*) inflige $Y$ heridas mortales adicionales que eluden las salvaciones. El Feel No Pain sigue aplicando.

**Modelo matemático:**

El número de heridas mortales adicionales es una transformación lineal de la distribución total de impactos:

$$\text{MortalDamageDist} = \text{applyDamage}(\text{AllHitsDist},\ [\{Y, 1\}])$$

Esta distribución se convuelve con el daño del pipeline normal **después** del bucle de pools de salvación, ya que las heridas mortales no participan en ningún pool.

Si existe un umbral de Feel No Pain, se aplica a la distribución de daño mortal con el FNP del primer pool de salvación. Para unidades con un solo pool (la mayoría de los casos prácticos) esto es exacto. Para unidades con varios pools distintos es una aproximación; si todos los pools tienen el mismo FNP, la aproximación es exacta.

---

## Interacciones entre abilities

Las cuatro habilidades pueden coexistir en el mismo arma:

| Combinación | Efecto |
|---|---|
| Sustained + Lethal | Los impactos críticos auto-hieren **y** generan X impactos extra que van a tirada de herida. Los impactos extra **no** son críticos. |
| Lethal + Devastating | Los impactos críticos auto-hieren (van a tirada de salvación). Los impactos normales hacen tirada de herida; si salen 6, eluden la salvación. |
| Devastating + Mortal Wounds | Las heridas críticas eluden salvación; adicionalmente, cada impacto genera Y heridas mortales independientes del resultado de herida. |

**Regla invariante de implementación:** los impactos *extra* generados por Sustained Hits son impactos ordinarios. Nunca activan Lethal Hits ni producen heridas críticas para Devastating Wounds.

---

## Dónde vive en la arquitectura

- **`src/domain/dice/weapon.ts`** — campos `sustainedHits`, `lethalHits`, `devastatingWounds`, `mortalWoundsPerHit` en `WeaponProfile`. Esta capa modela el concepto de juego puro, sin saber nada de use cases ni infraestructura.

- **`src/application/dice/CalculateUnitCombatUseCase.ts`** — toda la lógica de orquestación. Cada ability añade ramas condicionales al bucle de grupo dentro de `execute()`. La regla de dependencias es respetada: esta capa importa de `domain/`, nunca al revés.

- **`src/application/dice/CalculateCombatResultUseCase.ts`** — fachada de arma única. Solo delega los nuevos campos al use case de unidad sin lógica propia.
