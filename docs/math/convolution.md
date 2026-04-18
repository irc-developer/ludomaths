# Convolución discreta — `convolve` y `multiConvolve`

## Qué pregunta responde

> Tengo dos variables aleatorias independientes, $X$ e $Y$. **¿Cómo se distribuye su suma $Z = X + Y$?**

El caso más inmediato: si lanzo dos dados de seis caras (D6), ¿cuál es la probabilidad de que sumen 7? ¿De que sumen 2? La convolución es la operación que transforma "distribución de dado 1" + "distribución de dado 2" en "distribución de la suma".

---

## La idea a mano

Imagina que el dado 1 muestra el valor $a$ (con probabilidad $P_A(a)$) y el dado 2 muestra el valor $b$ (con probabilidad $P_B(b)$). Como los dados son independientes, la probabilidad de que ocurran ambas cosas a la vez es:

$$P(A=a \text{ y } B=b) = P_A(a) \cdot P_B(b)$$

Y si queremos la probabilidad de que la suma sea un valor concreto $z$:

$$P(Z = z) = \sum_{\substack{a,b \\ a+b=z}} P_A(a) \cdot P_B(b)$$

Es decir: sumamos las probabilidades de todas las parejas $(a, b)$ cuya suma da exactamente $z$.

---

## Ejemplo: dos D6 justos

Cada cara tiene probabilidad $\frac{1}{6}$. ¿Cuántas parejas suman 7?

$(1,6),\ (2,5),\ (3,4),\ (4,3),\ (5,2),\ (6,1)$ → 6 parejas.

$$P(Z = 7) = 6 \cdot \left(\tfrac{1}{6}\right)^2 = \tfrac{6}{36} \approx 0{,}167$$

¿Cuántas parejas suman 2? Solo $(1,1)$ → 1 pareja.

$$P(Z = 2) = 1 \cdot \left(\tfrac{1}{6}\right)^2 = \tfrac{1}{36} \approx 0{,}028$$

La distribución de 2D6 tiene forma de campana: el 7 es el resultado más probable porque tiene más combinaciones que llevan a él.

---

## De dos dados a varios: `multiConvolve`

Lanzar 3D6 es el mismo problema aplicado dos veces: primero convolucionar dos D6, y luego convolucionar el resultado con el tercer D6.

En general, convolucionar una distribución consigo misma $t$ veces da la distribución de la suma de $t$ copias independientes de esa variable:

$$Z = X_1 + X_2 + \cdots + X_t \quad\Rightarrow\quad P_Z = \underbrace{P_X \star P_X \star \cdots \star P_X}_{t \text{ veces}}$$

donde $\star$ es el operador de convolución.

`multiConvolve(dist, 0)` devuelve la distribución degenerada en 0 ("la suma de nada es cero"), que actúa como el elemento neutro de la suma — el equivalente probabilístico del 0 en la suma de números.

---

## Para qué se usa en el pipeline de WH40K

En el pipeline de combate, `multiConvolve` aparece en dos momentos:

**Inflado de ataques por modelo:** si un grupo tiene `modelCount = 3` modelos y cada uno lanza `attacksDist` dados de ataque, el total de ataques del grupo es la suma de 3 copias independientes de `attacksDist`. Eso es exactamente `multiConvolve(attacksDist, 3)`.

**Daño por heridas múltiples (`applyDamage`):** si un arma hace 2D3 de daño y consigue 4 heridas sin salvación, el daño total es la suma de 4 variables independientes, cada una distribuida como 2D3. La función `applyDamage` usa `multiConvolve` internamente para calcular esto para cada posible número de heridas.

---

## Propiedad clave: conmutatividad y asociatividad

La convolución es conmutativa ($A \star B = B \star A$) y asociativa ($(A \star B) \star C = A \star (B \star C)$), igual que la suma de números. Esto significa que el orden en que se convolucionen los grupos de armas no afecta al resultado final, y que se pueden combinar en cualquier orden sin perder corrección.

---

## Coste computacional

Convolucionar dos distribuciones de tamaños $|A|$ y $|B|$ requiere $O(|A| \cdot |B|)$ operaciones. Para un D6 ($|A| = 6$) convolucionado con otro D6 ($|B| = 6$): 36 operaciones. Para 3D6: primero 36 (2D6, resultado con 11 entradas), luego 66 (11 × 6). Crece con el número de dados pero se mantiene manejable para los tamaños habituales en un juego de mesa.

---

## Dónde vive en la arquitectura

`src/domain/math/convolution.ts` — capa de matemáticas puras. No sabe nada de dados, ataques ni juegos: opera sobre distribuciones abstractas. Cualquier módulo del proyecto que necesite sumar variables aleatorias independientes importa de aquí.
