# Pipeline de combate WH40K (10.ª edición) — Matemáticas completas

## Introducción

El combate en WH40K se resuelve en una cadena de etapas. En cada etapa, los
dados de la etapa anterior se someten a una probabilidad de éxito, y solo los
éxitos avanzan. La salida final es una **distribución de probabilidad** sobre
el daño total infligido, no un número único.

El modelo matemático central es el **adelgazamiento binomial**: si entran $n$
intentos y cada uno tiene probabilidad $p$ de éxito, el número de éxitos sigue
una distribución $\text{Bin}(n, p)$.

---

## Notación y primitivas

### Distribución de probabilidad

Una *distribución discreta* es un conjunto de pares $\{(v_i, p_i)\}$ donde:
- $v_i \in \mathbb{Z}_{\geq 0}$ — valor posible (ataques, impactos, daño…).
- $p_i \in [0,1]$ — probabilidad de ese valor.
- $\sum_i p_i = 1$.

Una distribución *degenerada* en $n$ — denotada $\delta_n$ — tiene $p_n = 1$
y $p_k = 0$ para $k \neq n$. Modela valores fijos.

### Convolución de distribuciones

La suma de dos variables aleatorias independientes $X$ e $Y$ tiene distribución:

$$P(X + Y = k) = \sum_{j} P(X = j) \cdot P(Y = k - j)$$

Esta operación se denota $X \ast Y$ y es la **convolución discreta**.

Para la suma de $k$ copias independientes idénticamente distribuidas de $D$:

$$D^{\ast k} = \underbrace{D \ast D \ast \cdots \ast D}_{k}$$

### Adelgazamiento binomial — `applyStage`

Si el número de intentos sigue la distribución $N$ y cada intento tiene
probabilidad $p$ de éxito independientemente, el número de éxitos $S$ tiene
distribución:

$$P(S = s) = \sum_{n \geq s} P(N = n) \cdot \binom{n}{s} p^s (1-p)^{n-s}$$

Cuando $N = \delta_n$ (intentos fijos), esto reduce a $\text{Bin}(n, p)$ exacto.

**Propiedad de encadenamiento:** aplicar adelgazamientos sucesivos con
probabilidades $p_1, p_2, \ldots, p_k$ equivale a un único adelgazamiento con
$p = p_1 \cdot p_2 \cdots p_k$.

### Suma aleatoria — `applyDamage`

Si hay $K$ heridas sin salvar y cada herida inflige daño $D_i$ (i.i.d.), el
daño total es:

$$\text{DañoTotal} = \sum_{i=1}^{K} D_i$$

Su distribución es:

$$P(\text{DañoTotal} = d) = \sum_{k=0}^{\infty} P(K = k) \cdot P(D^{\ast k} = d)$$

donde $D^{\ast 0} = \delta_0$ (daño cero si no hay heridas).

La parte importante aquí es el `i.i.d.`: cada herida no salvada genera su
propia tirada de daño, independiente de las demás. Si entran 3 heridas con daño
D6, el modelo calcula la distribución de $D_1 + D_2 + D_3$ con $D_1, D_2, D_3$
independientes. No reutiliza un único resultado para todas las heridas.

Eso responde a una duda habitual: si una herida hace 1 de daño en su D6, eso no
obliga a que las otras heridas hagan también 1. Cada una tira su propio dado.

### Un dado de daño fijo en 6 natural

La calculadora también permite fijar un dado de daño en 6 natural. Si al menos
una herida llega a la etapa de daño, una de esas heridas aporta daño fijo y las
demás siguen usando tiradas independientes normales:

$$\text{DañoTotal} = 6 + \sum_{i=2}^{K} D_i \quad \text{si } K \geq 1$$

$$\text{DañoTotal} = 0 \quad \text{si } K = 0$$

Si además el perfil es, por ejemplo, D6+2, el dado fijo en 6 natural aporta 8,
porque el modificador constante se sigue aplicando a esa tirada.

---

## Probabilidad de éxito en un dado — `dieSuccessProbability`

Para un dado D6 con umbral base $T$, modificador $m$ (restringido a $[-1, +1]$
por reglas de WH40K) y política de repetición, la probabilidad de éxito es:

$$T_\text{ef} = \max(2,\ T - m)$$

$$p = \begin{cases} 0 & T_\text{ef} > 6 \\ \dfrac{7 - T_\text{ef}}{6} & T_\text{ef} \leq 6 \end{cases}$$

**Modificación por repetición:**

| Política | Fórmula |
|---|---|
| `none` | $p$ |
| `ones` (repetir 1s) | $p \cdot \dfrac{7}{6}$ |
| `failures` (repetir fallos) | $p \cdot (2 - p)$ |
| `nonSixes` (repetir resultados 1–5) | $\mathbb{1}(T_\text{ef}\leq 6)/6 + 5p/6$ |

Derivación de `failures`: la primera tirada falla con $1 - p$; la repetición
tiene éxito con $p$. El total es $p + (1-p) \cdot p = p(2-p)$.

### Cómo se usa ahora en la calculadora de combate

La calculadora web y el comparador de buffs exponen dos políticas por etapa,
mutuamente excluyentes dentro de cada etapa:

- Repetir todos los fallos para impactar.
- Repetir todos los fallos para herir.
- Repetir todo lo que no sean seises para impactar.
- Repetir todo lo que no sean seises para herir.

`nonSixes` conserva los 6 naturales de la primera tirada y repite una sola vez
los resultados 1–5, incluidos los éxitos. El resultado de la repetición se acepta
sin volver a repetirlo. Torrent desactiva los controles de repetición de impacto;
los seises garantizados quedan fuera de las tiradas aleatorias.

Y tres controles de dado ya resuelto a 6 natural:

- 1 dado de impactar fijo en 6 natural.
- 1 dado de herir fijo en 6 natural.
- 1 dado de daño fijo en 6 natural.

El motor usa `combatRollProbabilities(umbral, modificador, política)` para obtener
las probabilidades de éxito total, crítico y éxito normal con el mismo contexto
de repetición. Un 1 natural siempre falla y un 6 natural siempre impacta/hiere
con umbrales de combate 2+–6+, incluso con modificador −1. `dieSuccessProbability`
conserva el comportamiento genérico de salvaciones: una salvación imposible no
se vuelve posible por conservar el 6.

En concreto:

$$p_\text{hit} = \texttt{combatRollProbabilities}(T_\text{hit},\ m_\text{hit},\ \texttt{'failures'}).\texttt{success}$$

$$p_\text{wound} = \texttt{combatRollProbabilities}(T_\text{wound},\ m_\text{wound},\ \texttt{'failures'}).\texttt{success}$$

Sea $p$ la probabilidad de éxito sin repetición de la tirada original. Para repetir
fallos, la probabilidad de crítico depende de los fallos de esa misma tirada:

$$p_\text{crit,failures} = \frac{1}{6} + (1-p)\frac{1}{6}$$

Por ejemplo, al impactar en 3+ repitiendo fallos, solo se repiten 1–2: el crítico
tiene probabilidad $8/36$, no $11/36$. Cambiar artificialmente el umbral a 6
para calcular críticos cambiaría también las caras elegibles para repetición.

Para buscar seises, la probabilidad de repetir es siempre $5/6$:

$$p_\text{success,nonSixes}=\frac{1}{6}+\frac{5}{6}p,\qquad
p_\text{crit,nonSixes}=\frac{11}{36}$$

| Umbral | Repetir fallos: éxito / crítico | Repetir no seises: éxito / crítico |
|---|---|---|
| 2+ | 35/36 / 7/36 | 31/36 / 11/36 |
| 3+ | 32/36 / 8/36 | 26/36 / 11/36 |
| 4+ | 27/36 / 9/36 | 21/36 / 11/36 |
| 5+ | 20/36 / 10/36 | 16/36 / 11/36 |
| 6+ | 11/36 / 11/36 | 11/36 / 11/36 |

Buscar seises puede reducir los éxitos totales respecto a repetir fallos, aunque
aumente los críticos. Su efecto en el daño depende de las habilidades y el objetivo.

Los checks de 6 natural fijo no cambian una probabilidad: reservan una tirada ya
resuelta en esa etapa. En impacto y herida, ese dado fijo cuenta como crítico
real, no como simple éxito. Por eso activa *Lethal Hits*, *Sustained Hits* o
*Devastating Wounds* exactamente igual que un 6 natural obtenido al tirar.

---

## Tabla de heridas — `woundThreshold`

El umbral mínimo para herir depende de la Fuerza del arma $S$ y la Resistencia
del objetivo $T$:

| Condición | Umbral |
|---|---|
| $S \geq 2T$ | 2+ |
| $T < S < 2T$ | 3+ |
| $S = T$ | 4+ |
| $\tfrac{T}{2} < S < T$ | 5+ |
| $S \leq \tfrac{T}{2}$ | 6+ |

---

## Salvación efectiva — `chosenSaveThreshold`

La salvación de armadura se degrada con la Penetración de Armadura $\text{AP}$:

$$S_\text{armadura} = S_\text{base} + \text{AP}$$

Si el objetivo tiene salvación invulnerable $S_\text{inv}$ (no afectada por AP):

$$S_\text{ef} = \min(S_\text{armadura},\ S_\text{inv})$$

Si $S_\text{ef} > 6$, la salvación es imposible: $p_{\text{fallo-save}} = 1$.

---

## Pipeline completo por grupo de arma

Dado un grupo de $M$ modelos idénticos con perfil de arma, el daño por asalto
se calcula en cinco etapas consecutivas más una etapa de heridas mortales.

### Paso previo: ataques totales

$$\text{AtaquesDist} = \underbrace{A \ast A \ast \cdots \ast A}_{M}$$

donde $A$ es la distribución de ataques por modelo. Si los ataques son fijos
$a$, entonces $\text{AtaquesDist} = \delta_{aM}$.

---

### Etapa 1: Ataques → Impactos

$$p_\text{hit} = \texttt{combatRollProbabilities}(T_\text{hit},\ m_\text{hit},\ \text{reroll}_\text{hit}).\texttt{success}$$

$$\text{ImpactosDist} = \text{applyStage}(\text{AtaquesDist},\ p_\text{hit})$$

#### [TORRENT] — impacto automático

Si el arma tiene Torrente, todos los ataques impactan sin tirada:

$$\text{ImpactosDist} = \text{AtaquesDist}$$

No puede activarse ninguna habilidad de impacto crítico.

#### [SUSTAINED HITS X] — impactos críticos generan extras

Un impacto crítico es un resultado no modificado de 6. Su probabilidad (con
posible repetición, conservando el contexto de éxito original):

$$p_\text{crit} = \texttt{combatRollProbabilities}(T_\text{hit},\ m_\text{hit},\ \text{reroll}_\text{hit}).\texttt{critical}$$

$$p_\text{norm} = \max(0,\ p_\text{hit} - p_\text{crit})$$

El pipeline aproxima los impactos mediante dos corrientes independientes.
Los conteos originales comparten dados y están correlacionados; esta aproximación
mantiene sus medias, pero puede alterar la distribución final y la probabilidad
de eliminación. La nueva política no corrige esa limitación previa.

$$\text{ImpactosCrit} = \text{applyStage}(\text{AtaquesDist},\ p_\text{crit})$$
$$\text{ImpactosNorm} = \text{applyStage}(\text{AtaquesDist},\ p_\text{norm})$$

Cada impacto crítico genera $X$ impactos extra (no críticos):

$$\text{ImpactosExtra} = \text{applyDamage}(\text{ImpactosCrit},\ \delta_X)$$

El total de impactos que pasan a herir:

$$\text{ImpactosDist} = (\text{ImpactosNorm} \ast \text{ImpactosExtra}) \ast \text{ImpactosCrit}$$

> Los impactos extra generados por Sustained Hits **no son críticos** y no
> pueden desencadenar Lethal Hits ni Devastating Wounds.

#### [LETHAL HITS] — impactos críticos hieren automáticamente

$$\text{ImpactosCrit} = \text{applyStage}(\text{AtaquesDist},\ p_\text{crit})$$

Los impactos críticos se convierten directamente en heridas (saltan la etapa 2).
Los impactos normales siguen el camino habitual:

$$\text{HeridasAuto} = \text{ImpactosCrit}$$
$$\text{AEtapa2} = \text{ImpactosNorm} \quad (\text{o } \text{ImpactosNorm} \ast \text{ImpactosExtra si también hay Sustained})$$

El incremento en daño esperado respecto al pipeline estándar es:

$$\Delta E = E[\text{AtaquesDist}] \cdot p_\text{crit} \cdot (1 - p_\text{wound})$$

---

### Etapa 2: Impactos → Heridas

La probabilidad de herir integra el caso de Fuerza variable:

$$p_\text{wound} = \sum_s P(S = s) \cdot \texttt{combatRollProbabilities}(\texttt{woundThreshold}(s, T),\ m_\text{wound},\ \text{reroll}_\text{wound}).\texttt{success}$$

$$\text{HeridasDist} = \text{applyStage}(\text{AEtapa2},\ p_\text{wound})$$

Si hay heridas automáticas de Lethal Hits, se convolven:

$$\text{HeridasNorm} = \text{HeridasDist} \ast \text{HeridasAuto}$$

#### [DEVASTATING WOUNDS] — heridas críticas saltan la salvación

$$p_{\text{crit-wound}} = \sum_s P(S=s)\cdot\texttt{combatRollProbabilities}(\texttt{woundThreshold}(s,T),\ m_\text{wound},\ \text{reroll}_\text{wound}).\texttt{critical}$$
$$p_{\text{norm-wound}} = \max(0,\ p_\text{wound} - p_{\text{crit-wound}})$$

$$\text{HeridasCrit} = \text{applyStage}(\text{ImpactosDist},\ p_{\text{crit-wound}})$$
$$\text{HeridasNorm} = \text{applyStage}(\text{ImpactosDist},\ p_{\text{norm-wound}}) \ast \text{HeridasAuto}$$

Las heridas críticas (devastadoras) no pasan por la salvación y tratan su daño
como heridas mortales. FNP sí aplica.

El daño esperado total con Devastating Wounds:

$$E[\text{daño}] = E[\text{impactos}] \cdot \bigl[p_{\text{crit-wound}} + (p_\text{wound} - p_{\text{crit-wound}}) \cdot p_{\text{fallo-save}}\bigr]$$

---

### Etapa 3: División por pools de salvación

Una unidad puede tener varios grupos de modelos con salvaciones distintas.
Cada pool $k$ recibe una fracción $f_k$ de las heridas, con $\sum_k f_k = 1$.

$$\text{HeridasPool}_{k,\text{norm}} = \text{applyStage}(\text{HeridasNorm},\ f_k)$$
$$\text{HeridasPool}_{k,\text{crit}} = \text{applyStage}(\text{HeridasCrit},\ f_k)$$

El adelgazamiento es una operación lineal, por lo que distribuir primero y
adelgazar después (o al revés) produce el mismo resultado esperado.

---

### Etapa 4: Heridas → Salvaciones → Daño

Para cada pool $k$:

$$S_k = \texttt{chosenSaveThreshold}(S_\text{base}, \text{AP}, S_\text{inv})$$

$$p_{\text{fallo-save},k} = 1 - \texttt{dieSuccessProbability}(S_k,\ m_\text{save,k},\ \text{reroll}_\text{save,k})$$

#### [GUARANTEED SAVES] — salvaciones garantizadas

Si el pool tiene $g$ salvaciones garantizadas (dados que muestran 6 de
antemano), se eliminan $g$ heridas del pool antes de los lanzamientos normales.
Formalmente, la distribución de heridas se desplaza:

$$P(\text{HeridasEf} = \max(0, v - g)) = \sum_{v'=v+g}^{\infty} P(\text{HeridasPool} = v')$$

$$\text{HeridasSinSalvar}_k = \text{applyStage}(\text{HeridasEf},\ p_{\text{fallo-save},k})$$

Las heridas críticas (devastadoras) no pasan por este filtro:

$$\text{TodasHeridas}_k = \text{HeridasPool}_{k,\text{crit}} \ast \text{HeridasSinSalvar}_k$$

Daño del pool:

$$\text{DañoPool}_k = \text{applyDamage}(\text{TodasHeridas}_k,\ D_\text{daño})$$

---

### Etapa 5: Feel No Pain

Si el pool $k$ tiene umbral de FNP $T_\text{fnp}$, cada punto de daño se niega
individualmente con probabilidad $p_\text{fnp}$:

$$p_\text{fnp} = \texttt{dieSuccessProbability}(T_\text{fnp})$$

$$p_{\text{fallo-fnp}} = 1 - p_\text{fnp}$$

$$\text{DañoFinal}_k = \text{applyStage}(\text{DañoPool}_k,\ p_{\text{fallo-fnp}})$$

FNP aplica a **todo** el daño, incluido el de las heridas críticas devastadoras.

---

### Consolidación de pools y grupos

El daño total del grupo de arma es la convolución de los daños de todos los
pools:

$$\text{DañoGrupo} = \text{DañoFinal}_1 \ast \text{DañoFinal}_2 \ast \cdots \ast \text{DañoFinal}_K$$

El daño total de la unidad (todos los grupos de arma) es:

$$\text{DañoTotal} = \text{DañoGrupo}_1 \ast \text{DañoGrupo}_2 \ast \cdots \ast \text{DañoGrupo}_G$$

---

### [MORTAL WOUNDS per hit] — heridas mortales adicionales

Cada impacto (incluidos los críticos y los extras de Sustained Hits) inflige
$Y$ heridas mortales adicionales que eluden todas las salvaciones:

$$\text{HeridasMortalesDist} = \text{applyDamage}(\text{TodosImpactosDist},\ \delta_Y)$$

Si el primer pool tiene FNP:

$$\text{HeridasMortalesFinal} = \text{applyStage}(\text{HeridasMortalesDist},\ p_{\text{fallo-fnp},1})$$

El daño mortal se convolve con el daño del pipeline normal:

$$\text{DañoGrupo} = \text{DañoGrupo}_\text{normal} \ast \text{HeridasMortalesFinal}$$

> Para unidades con varios pools de FNP distintos, se usa el FNP del primer
> pool como aproximación. La aproximación es exacta cuando todos los pools
> comparten el mismo umbral de FNP.

---

## Interacciones entre abilities

| Combinación | Comportamiento |
|---|---|
| Sustained + Lethal | Los críticos auto-hieren **y** generan X impactos extra que van a tirada de herida. Los extras **no son críticos**. |
| Sustained + Devastating | Los impactos extra pasan por la tirada de herida con posibilidad de herida crítica. |
| Lethal + Devastating | Los críticos de impacto auto-hieren (saltan herida); las heridas que sí tiran pueden sacar 6 y ser devastadoras. |
| Cualquier ability + FNP | FNP siempre aplica al daño final, incluyendo devastadoras y mortales. |
| Torrent + Lethal/Sustained | Imposible: Torrent elimina la tirada de impacto, por lo que nunca hay resultado de 6. |

---

## Cálculo de rondas para matar — `CalculateRoundsToKillUseCase`

Sea $D$ la distribución de daño en una sola ronda de disparo. El daño acumulado
tras $n$ rondas es:

$$D_n = \underbrace{D \ast D \ast \cdots \ast D}_{n}$$

La probabilidad de haber eliminado un objetivo con $W$ heridas antes del final
de la ronda $n$ es:

$$P(\text{eliminar en} \leq n) = P(D_n \geq W) = 1 - \sum_{d=0}^{W-1} P(D_n = d)$$

La probabilidad de eliminarlo exactamente en la ronda $n$:

$$P(\text{eliminar en } n) = P(\text{en} \leq n) - P(\text{en} \leq n-1)$$

El número esperado de rondas para matar:

$$E[T] \approx \sum_{n=1}^{N_\text{max}} n \cdot P(\text{eliminar en } n)$$

Esta suma es exacta cuando $\sum_{n=1}^{N_\text{max}} P(\text{eliminar en }n) = 1$,
es decir, cuando la probabilidad de no haber matado tras $N_\text{max}$ rondas
es despreciable. El cálculo termina anticipadamente cuando
$P(\text{en} \leq n) \geq 1 - 10^{-9}$.

---

## Ejemplo numérico de referencia

**Configuración:** 1 modelo, 6 ataques fijos, impacta en 3+ ($p_\text{hit} = \tfrac{4}{6}$),
$S = T = 4$ (hiere en 4+, $p_\text{wound} = \tfrac{3}{6}$), AP 2 contra
salvación 3+ → efectiva 5+ ($p_{\text{fallo-save}} = \tfrac{4}{6}$), daño 1 fijo.
Sin abilities. Sin FNP.

$$E[\text{impactos}] = 6 \cdot \frac{4}{6} = 4$$

$$E[\text{heridas}] = 4 \cdot \frac{3}{6} = 2$$

$$E[\text{heridas sin salvar}] = 2 \cdot \frac{4}{6} = \frac{4}{3}$$

$$E[\text{daño}] = \frac{4}{3} \approx 1{,}33$$

Equivalentemente:

$$E[\text{daño}] = 6 \cdot \frac{4}{6} \cdot \frac{3}{6} \cdot \frac{4}{6} = \frac{8}{9} \cdot \frac{3}{2} = \frac{4}{3}$$

La distribución completa (no solo el valor esperado) es la que el pipeline
proporciona y la que se muestra en la pantalla de combate.
