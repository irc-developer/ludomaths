# LudoMaths

**LudoMaths** is a mobile application built with React Native (bare) and TypeScript that calculates combat probabilities and statistics for board games — currently focused on **Warhammer 40,000 (10th edition)**.

It models the full combat pipeline step by step (attacks → hits → wounds → saves → damage) and supports special weapon abilities (Sustained Hits, Lethal Hits, Devastating Wounds, Mortal Wounds), feel-no-pain rolls, reroll policies, and multi-unit profiles. The goal is to give players accurate expected-damage numbers and full probability distributions so they can make better tactical decisions at the table.

---

## Features

- **WH40K combat calculator** — full pipeline with weapon abilities, save pools, feel-no-pain.
- **Unit profiles** — save attacker and defender profiles (name, toughness, armor save, weapon groups) for quick reuse.
- **Rounds-to-kill** — calculates cumulative kill probability per round for any attacker/defender pair.
- **Combat history** — save and review past combat calculations.
- **Card calculator** *(hypergeometric)* — probability of drawing specific cards from a deck (exact, cumulative, and combo).
- **Full distribution view** — complete P(X = k) table for any scenario, not just the expected value.
- **Multilingual** — English and Spanish, auto-detected from device locale.

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile framework | React Native 0.85 (bare, no Expo) |
| Language | TypeScript (strict) |
| Architecture | Clean Architecture (domain → application → infrastructure → presentation) |
| State management | Zustand |
| Navigation | React Navigation (bottom tabs + stack) |
| Persistence | AsyncStorage |
| Testing | Jest + @testing-library/react-native |
| i18n | i18next + react-i18next + react-native-localize |

---

## Architecture

```
src/
├── domain/          # Pure TypeScript entities, value objects, game rules.
│   ├── math/        #   Generic probability primitives (binomial, hypergeometric, convolution, pipeline)
│   └── dice/        #   WH40K-specific rules (wound table, save table, weapon/save-pool types)
├── application/     # Use case implementations. Orchestrates domain; no React, no AsyncStorage.
├── infrastructure/  # AsyncStorage repositories, i18n setup.
└── presentation/    # React Native screens, components, UI hooks (Zustand, navigation).
```

**Dependency rule**: inner layers never import from outer layers. `domain` knows nothing about React, AsyncStorage, or use cases.

The mathematical core (`domain/math/`) is framework-agnostic pure TypeScript. Every function there can be extracted and used in any JavaScript/TypeScript environment.

---

## Mathematical core

The probability engine is built from four composable primitives:

| Module | What it models |
|---|---|
| `domain/math/combinatorics` | Binomial coefficient C(n, k) — foundation of all counting |
| `domain/math/binomial` | P(X = k) for repeated independent trials with constant success probability |
| `domain/math/hypergeometric` | P(X = k) for drawing from a finite deck without replacement |
| `domain/math/convolution` | Distribution of the sum of two or more independent random variables |
| `domain/math/pipeline` | Two-step combat primitives: binomial thinning (`applyStage`) and randomly stopped sum (`applyDamage`) |
| `domain/math/distribution` | Types and utilities: `Distribution`, `expectedValue`, `cumulativeProbability` |

The WH40K combat pipeline in `application/dice/CalculateUnitCombatUseCase` composes these primitives into the full attack sequence, including all special abilities.

See [`docs/math/`](docs/math/) for detailed explanations of each module.

---

## Getting started

```bash
# Install dependencies
npm install

# Run on Android (requires Android SDK + emulator or device)
npx react-native run-android

# Run on iOS (macOS only, requires Xcode + CocoaPods)
npx react-native run-ios

# Run all tests
npx jest --watchAll

# TypeScript type check (no build output)
npx tsc --noEmit
```

---

## Project status

| Area | Status |
|---|---|
| Math core (binomial, hypergeometric, convolution, pipeline) | ✅ Complete, 340 tests |
| WH40K combat pipeline (all 4 weapon abilities + FNP) | ✅ Complete |
| Unit profiles (save, edit, delete) | ✅ Complete |
| Combat setup & result screen | ✅ Complete |
| Combat history | ✅ Complete |
| Card (hypergeometric) calculator UI | 🔲 Planned |
| Dice roll history tracker | 🔲 Planned |

---

## Documentation

- [`docs/math/`](docs/math/) — mathematical explanation of each probability module, written for readers with high-school level maths.
- [`docs/math/weapon-abilities.md`](docs/math/weapon-abilities.md) — detailed breakdown of Sustained Hits, Lethal Hits, Devastating Wounds and Mortal Wounds models.
- [`.github/skills/wh40k/SKILL.md`](.github/skills/wh40k/SKILL.md) — developer guide for adding new WH40K mechanics (for contributors / AI agents).
- [`.github/skills/code-review/SKILL.md`](.github/skills/code-review/SKILL.md) — code review checklist (Clean Architecture, SOLID, DRY).

---

## License

MIT

```

### Development workflow (TDD)

1. **Red** — write a failing test.
2. **Green** — write the minimum code to make it pass.
3. **Refactor** — remove duplication without breaking tests.

Every use case and mathematical function has its own test file with ≥ 90% coverage.

---

## Español

**LudoMaths** es una aplicación móvil desarrollada con React Native (bare) y TypeScript que calcula probabilidades y estadísticas para juegos de mesa. Ayuda a los jugadores a tomar mejores decisiones calculando distribuciones de dados, probabilidades de robo de cartas y cualquier cálculo combinatorio útil durante una partida.

### Funcionalidades

- **Calculadora de dados** — probabilidad de obtener exactamente / al menos / como máximo *k* éxitos en *N* tiradas buscando un valor objetivo.
- **Calculadora de cartas** — distribución hipergeométrica para calcular la probabilidad de robar cartas concretas de un mazo (exacta, acumulada y de combos).
- **Historial de tiradas** — registra tus tiradas reales para consultar la media, varianza y desviación típica acumuladas.
- **Vista de distribución completa** — tablas y gráficos con la distribución de probabilidades para cualquier escenario.
- **Multiidioma** — inglés y español, detectado automáticamente desde el idioma del dispositivo.

### Tecnología

| Capa | Tecnología |
|---|---|
| Framework móvil | React Native 0.85 (bare) |
| Lenguaje | TypeScript (strict) |
| Arquitectura | Clean Architecture |
| Estado global | Zustand |
| Navegación | React Navigation |
| Testing | Jest + @testing-library/react-native |
| i18n | i18next + react-i18next + react-native-localize |

### Arquitectura

```
src/
├── domain/          # Entidades y value objects en TypeScript puro, interfaces de use cases
├── application/     # Implementaciones de use cases, orquestación
├── infrastructure/  # Adaptadores: AsyncStorage, configuración i18n, APIs externas
└── presentation/    # Pantallas, componentes y hooks de React Native
```

**Regla de dependencias**: las capas internas (`domain`) no importan nada de las capas externas. `domain` no conoce React ni AsyncStorage.

### Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en Android (requiere Android SDK + emulador o dispositivo)
npx react-native run-android

# Ejecutar tests
npx jest --watchAll

# Verificar TypeScript
npx tsc --noEmit
```

### Flujo de desarrollo (TDD)

1. **Rojo** — escribe un test que falla.
2. **Verde** — código mínimo para que pase.
3. **Refactor** — elimina duplicación sin romper tests.

Cada use case y función matemática tiene su propio archivo de test con cobertura ≥ 90 %.


> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
