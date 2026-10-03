# LudoMaths — Instrucciones del agente

## Perfil del proyecto

Aplicación React Native bare + TypeScript para calcular probabilidades y estadísticas
de juegos de mesa. El dominio mezcla combinatoria general, tiradas de dados, robo de
cartas y simulación analítica de perfiles de combate.

Responde en español. El usuario tiene nivel intermedio y conviene explicar el porqué de
las decisiones cuando aparezca un patrón nuevo o una corrección importante.

## Prioridades permanentes

- Sé crítica y concreta: si una propuesta rompe arquitectura, TDD o reglas del juego,
  corrígela y explica la alternativa.
- Mantén las capas limpias y el alcance pequeño. Arregla la causa, no el síntoma.
- Todo el código, nombres, comentarios y tests se escriben en inglés, salvo los archivos
  de traducción en `src/infrastructure/i18n/locales/`.

## Arquitectura

```
src/
├── domain/          # Reglas de negocio puras y primitivas matemáticas
├── application/     # Use cases y orquestación
├── infrastructure/  # Adaptadores externos
└── presentation/    # Pantallas, componentes y hooks de UI
```

Regla no negociable: las dependencias fluyen hacia dentro.

- `domain` no importa React, React Native, AsyncStorage ni detalles de infraestructura.
- `application` coordina dominio; no contiene lógica de UI.
- `presentation` consume use cases y traducciones; no redefine reglas de negocio.

## Flujo de trabajo

- TDD obligatorio para lógica de dominio y use cases: Red, Green, Refactor.
- Después de cada cambio relevante, valida con la comprobación más pequeña posible antes
  de seguir ampliando el alcance.
- Si editas una zona con reglas especializadas, apóyate en las instrucciones de archivo y
  skills del workspace en lugar de duplicar normas aquí.

## Recordatorios de producto

- Las funciones matemáticas deben ser puras y deterministas.
- Las fórmulas no triviales llevan un comentario con la ecuación.
- Nunca uses textos literales en JSX; toda cadena visible pasa por i18n.
- Las claves de traducción siguen la forma `screen.element`.

## Comandos base

```bash
npx jest --watchAll
npx tsc --noEmit
npx react-native run-android
npx react-native run-ios
```
