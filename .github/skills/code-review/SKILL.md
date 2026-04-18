# Code Review — LudoMaths

Skill para ejecutar una code review completa antes de añadir nueva funcionalidad.
Cubre: arquitectura hexagonal, SOLID, DRY, convenciones del proyecto y anti-patrones
específicos de React Native + hooks + use cases.

---

## Cuándo usar esta skill

- Antes de comenzar un bloque de trabajo nuevo (nueva feature, nueva distribución).
- Cuando aparezcan errores difíciles de localizar y se sospeche deuda técnica.
- Cuando el usuario pida explícitamente "code review", "revisar DRY/SOLID" o "limpiar código".

---

## 1. Comandos de verificación rápida

Ejecutar siempre en este orden antes de cualquier análisis manual:

```bash
# 1. Compila sin emitir — detecta errores de tipo sin build
npx tsc --noEmit

# 2. Tests completos — regresión sobre toda la suite
npx jest --no-coverage
```

Si cualquiera falla, parar y corregirlo antes de continuar el review.

---

## 2. Checklist de arquitectura hexagonal

### 2.1 Regla de dependencias (no negociable)

Verificar con grep que ninguna capa importa de una capa exterior:

```bash
# domain NO debe importar nada de application / infrastructure / presentation
grep -r "from '@application\|from '@infrastructure\|from '@presentation" src/domain/

# application NO debe importar de infrastructure / presentation
grep -r "from '@infrastructure\|from '@presentation" src/application/

# infrastructure / presentation SÍ pueden importar de capas internas
```

Resultado esperado: ningún match. Cualquier match es una violación crítica.

### 2.2 Puertos (interfaces de repositorio)

- Las interfaces `IProfileRepository`, `ICombatRecordRepository`, etc. deben vivir
  en `src/application/`, no en `src/infrastructure/`.
- Las implementaciones concretas (`AsyncStorage*`) viven en `src/infrastructure/storage/`.
- Los casos de uso dependen de la *interfaz*, nunca de la *implementación* concreta.

### 2.3 Inyección de dependencias

- Todos los use cases reciben el repositorio vía constructor o parámetro de función.
- Ningún use case importa `repositoryInstances` directamente — eso es
  responsabilidad de la capa de presentación (hooks) o de los tests.

---

## 3. Checklist SOLID

### S — Single Responsibility

Señales de violación:
- Un hook > ~150 líneas con lógica de conversión/validación mezclada con estado React.
  → Extraer helpers a un archivo `*Conversion.ts` o `*Validation.ts` hermano.
- Una pantalla que contiene lógica de negocio (cálculos, validación de dominio).
  → Mover a un use case o a un hook.
- Un use case que hace más de una operación de dominio no relacionada.

### O — Open/Closed

- Las nuevas distribuciones matemáticas se añaden como entidades nuevas, no modificando
  las existentes.
- El pipeline de combate (`src/domain/math/pipeline.ts`) se extiende añadiendo stages,
  no editando `applyStage`.

### L — Liskov Substitution

- Cualquier `IProfileRepository` o `ICombatRecordRepository` concreto debe ser
  intercambiable en tests usando el mock in-memory.
- `JSONStorageRepository` subclasses no deben romper el contrato de las operaciones
  heredadas (`findAll`, `findById`, `delete`).

### I — Interface Segregation

- Un use case sólo recibe el repositorio mínimo necesario (no un "god repository").
- Si se añade una interfaz nueva, dividirla si tiene métodos que algunos clientes
  no necesitan.

### D — Dependency Inversion

- Los use cases dependen de interfaces (`IProfileRepository`), no de clases concretas.
- Los hooks usan la implementación por defecto como parámetro opcional con valor por
  defecto (`repo: IProfileRepository = profileRepository`) para permitir inyección en
  tests.

---

## 4. Checklist DRY

### 4.1 Repositorios de persistencia

Todos los repositorios AsyncStorage deben extender `JSONStorageRepository<TStored>`.
Los métodos `generateId`, `readAll`, `writeAll`, `findAll`, `findById` y `delete` son
heredados — **no reimplementar**.

Señal de violación: dos clases con `private generateId()` idéntico o con `readAll` /
`writeAll` que leen/escriben a AsyncStorage con la misma lógica.

### 4.2 Lógica de conversión de formularios

Helpers de conversión (dominio → campos de formulario y viceversa) y validadores
de pasos del wizard deben vivir en archivos `*Conversion.ts` separados del hook.

Señal de violación: funciones `profileToFields`, `fieldsToProfile`, `fixedDist`,
`validateStep*` definidas dentro del archivo del hook.

### 4.3 Funciones matemáticas

Ninguna distribución (binomial, hipergeométrica, convolución...) se reimplementa en
dos sitios. Siempre importar desde `src/domain/math/`.

---

## 5. Anti-patrones específicos de React Native + hooks

### 5.1 Instancias de use case a nivel de módulo

```typescript
// ❌ Mal — instancia creada una vez para todo el módulo
const loader = new LoadCombatRecordsUseCase(combatRecordRepository);

export function MyScreen() { ... }
```

```typescript
// ✅ Bien — instancia ligada al ciclo de vida del componente
export function MyScreen() {
  const loader = useMemo(() => new LoadCombatRecordsUseCase(combatRecordRepository), []);
  ...
}
```

> **Por qué importa**: una instancia de módulo sobrevive a todos los renders y no puede
> recibir un repositorio alternativo en tests. `useMemo` con `[]` crea la instancia una
> vez por montaje y permite que los tests inyecten dependencias.

### 5.2 Lógica de negocio en pantallas

Las pantallas (`*Screen.tsx`) no deben contener:
- Llamadas directas a use cases (deben hacerse en hooks).
- Cálculos matemáticos o transformaciones de dominio.
- Validaciones de campos de formulario.

Señal de violación: un Screen con > ~80 líneas de lógica fuera del JSX.

### 5.3 Strings literales en JSX

```typescript
// ❌ Mal
<Text>Guardar perfil</Text>

// ✅ Bien
<Text>{t('profile.save')}</Text>
```

Todo texto visible al usuario debe usar `t('clave')`.

### 5.4 Ausencia de `any` en código de producción

```bash
grep -r ": any\|as any" src/domain src/application src/infrastructure/storage src/presentation
```

Resultado esperado: ningún match fuera de archivos `*.test.ts`.

### 5.5 `console.log` / `debugger` en producción

```bash
grep -r "console\.log\|debugger" src/domain src/application src/infrastructure src/presentation
```

Resultado esperado: ningún match.

---

## 6. Checklist de convenciones del proyecto

| Ítem | Comando de verificación |
|---|---|
| Archivos de test junto al fuente | `find src -name "*.test.ts" -not -name "*.test.ts"` (no existe carpeta `__tests__` en `src/`) |
| Claves i18n en `en.ts` y `es.ts` sincronizadas | Revisar manualmente si se añaden claves nuevas |
| Fórmulas no triviales comentadas | Revisar funciones en `domain/math/` |
| Nombres en inglés (excepto `locales/`) | `grep -r "[áéíóúñÁÉÍÓÚÑ]" src/ --include="*.ts" --exclude-dir=locales` |

---

## 7. Proceso de fix

Para cada problema encontrado, aplicar el ciclo:

1. **Identificar** — archivo, línea y tipo de violación.
2. **Arreglar** — mínimo cambio necesario, sin refactors especulativos.
3. **Verificar** — `npx tsc --noEmit` + `npx jest --no-coverage` deben pasar en verde.
4. **Documentar** — si el problema puede repetirse, actualizar esta skill o las
   instrucciones del agente.

---

## 8. Orden de severidad

| Severidad | Descripción | Acción |
|---|---|---|
| 🔴 Crítico | Violación de la regla de dependencias / tests rojos | Bloquea cualquier nueva feature |
| 🟡 Medio | SRP, DRY, anti-patrón de hook | Corregir antes de continuar |
| 🟢 Trivial | Comentario faltante, nombre mejorable | Corregir de paso o en PR separado |
