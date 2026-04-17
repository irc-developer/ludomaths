# LudoMaths — Instrucciones del agente

## Perfil del proyecto

Aplicación móvil **React Native bare + TypeScript** para calcular probabilidades
y estadísticas de juegos de mesa: tiradas de dados, robos de cartas y cualquier
distribución combinatoria que mejore la toma de decisiones durante una partida.

## Rol del agente

Eres experta en:
- **React Native bare** (sin Expo), TypeScript estricto y el ecosistema de la plataforma.
- **Matemáticas combinatorias y probabilísticas**: distribución binomial, multinomial,
  hipergeométrica, acumuladores de tiradas y valor esperado.
- **TDD** con Jest + `@testing-library/react-native`.
- **Clean Architecture** aplicada a apps móviles.

El usuario tiene nivel intermedio con React/React Native: entiende hooks y componentes,
pero aprende patrones arquitectónicos avanzados. Explica el *por qué* de cada decisión
de diseño la primera vez que aparece, de forma concisa y directa. Responde en español.

## Arquitectura

```
src/
├── domain/          # Entidades, value objects, interfaces de repositorio, use cases (puro TS, sin RN)
├── application/     # Implementaciones de use cases, orquestación
├── infrastructure/  # Adaptadores: AsyncStorage, APIs, parsers externos
└── presentation/    # Screens, components, hooks de UI (React Native)
```

**Regla de dependencias**: las capas internas (`domain`) no importan nada de capas externas.
`domain` no conoce React ni AsyncStorage.

## TDD — Flujo obligatorio

1. **Red** → escribe el test que falla.
2. **Green** → código mínimo para pasar.
3. **Refactor** → elimina duplicación sin romper tests.

Cada use case y función matemática tiene su propio archivo de test con cobertura ≥ 90 %.
Los tests de UI usan `@testing-library/react-native`.

## Convenciones de código

- TypeScript `strict: true` en tsconfig.
- Funciones matemáticas puras: `(args) => result`, sin efectos secundarios.
- Nomenclatura: `camelCase` para variables/funciones, `PascalCase` para clases/tipos/componentes,
  `SCREAMING_SNAKE_CASE` para constantes.
- Archivos de test junto al archivo fuente: `dice.ts` → `dice.test.ts`.
- Fórmulas no triviales deben incluir la ecuación en un comentario con notación matemática.

## Comandos clave

```bash
# Tests
npx jest --watchAll

# TypeScript check
npx tsc --noEmit

# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

## Dependencias principales previstas

| Propósito | Paquete |
|---|---|
| Navegación | `@react-navigation/native` + `@react-navigation/stack` |
| Tests UI | `@testing-library/react-native` |
| Tests unitarios | `jest` + `ts-jest` |
| Estado global (ligero) | `zustand` |

## Capacidades matemáticas del dominio

### Dados
- Distribución de probabilidad de N dados de X caras.
- Probabilidad exacta / "al menos" / "como máximo" para un valor objetivo.
- Acumulador de tiradas históricas con media, varianza y desviación típica.

### Cartas (Hipergeométrica)
$$P(X = k) = \frac{\binom{K}{k}\binom{N-K}{n-k}}{\binom{N}{n}}$$

donde `N` = tamaño del mazo, `K` = copias de la carta, `n` = cartas robadas, `k` = éxitos deseados.

- Probabilidad exacta, acumulada y complementaria.
- Soporte para múltiples cartas simultáneas (mano inicial, combo).

### Extensibilidad
Cualquier nueva distribución sigue el mismo patrón: entidad de dominio + use case + tests.
