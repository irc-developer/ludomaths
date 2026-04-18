This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

---

# LudoMaths

> 🇬🇧 [English](#english) · 🇪🇸 [Español](#español)

---

## English

**LudoMaths** is a mobile application built with React Native (bare) and TypeScript that calculates probabilities and statistics for board games. It helps players make better decisions by computing dice roll distributions, card draw probabilities, and any combinatorial calculation useful during a game.

### Features

- **Dice calculator** — probability of getting exactly / at least / at most *k* successes in *N* dice rolls looking for a target value.
- **Card calculator** — hypergeometric distribution to calculate the probability of drawing specific cards from a deck (exact, cumulative, and combo probabilities).
- **Roll history** — log your real rolls to track mean, variance, and standard deviation over time.
- **Full distribution view** — tables and charts showing the complete probability distribution for any scenario.
- **Multilingual** — English and Spanish, auto-detected from device locale.

### Tech stack

| Layer | Technology |
|---|---|
| Mobile framework | React Native 0.85 (bare) |
| Language | TypeScript (strict) |
| Architecture | Clean Architecture |
| State management | Zustand |
| Navigation | React Navigation |
| Testing | Jest + @testing-library/react-native |
| i18n | i18next + react-i18next + react-native-localize |

### Architecture

```
src/
├── domain/          # Pure TypeScript entities, value objects, use case interfaces
├── application/     # Use case implementations, orchestration
├── infrastructure/  # AsyncStorage adapters, i18n setup, external APIs
└── presentation/    # React Native screens, components, UI hooks
```

**Dependency rule**: inner layers (`domain`) never import from outer layers. `domain` knows nothing about React or AsyncStorage.

### Getting started

```bash
# Install dependencies
npm install

# Run on Android (requires Android SDK + emulator or device)
npx react-native run-android

# Run tests
npx jest --watchAll

# TypeScript check
npx tsc --noEmit
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
