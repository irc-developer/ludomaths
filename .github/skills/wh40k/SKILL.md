---
name: wh40k
description: "Add or modify a Warhammer 40K combat pipeline stage in LudoMaths. Use when: implementing weapon abilities (Sustained Hits, Lethal Hits, Devastating Wounds, Mortal Wounds, Feel No Pain), adjusting any pipeline stage, or extending WeaponProfile / SavePool with new modifiers or reroll policies."
argument-hint: "Describe the WH40K mechanic to add, e.g. 'Anti-[keyword] X+ ability' or 'Torrent (auto-hit)'"
---

# WH40K Combat Pipeline — Skill

## Pipeline overview (10th edition)

```
N × modelCount attacks
  │
  ├─ Stage 1: Attacks → Hits
  │     pHit = dieSuccessProbability(hitThreshold, hitModifier, hitReroll)
  │     [SUSTAINED HITS X] → critical hit (unmod. 6) generates X extra hits
  │     [LETHAL HITS]      → critical hit (unmod. 6) auto-wounds (skip Stage 2)
  │
  ├─ Stage 2: Hits → Wounds
  │     pWound = Σ_s P(S=s) × dieSuccessProbability(woundThreshold(s,T), mod, reroll)
  │     [DEVASTATING WOUNDS] → critical wound (unmod. 6) bypasses Stage 3
  │
  ├─ Stage 3: Wounds split by save pool fraction
  │
  ├─ Stage 4: Wounds → Save roll → Unsaved wounds → Damage
  │     effectiveSave = min(baseSave + AP, invulnerableSave)
  │     failSave = 1 − dieSuccessProbability(effectiveSave, saveModifier, saveReroll)
  │
  ├─ Stage 5 (optional): Damage → Feel No Pain
  │     pFailFNP = 1 − dieSuccessProbability(fnpThreshold)
  │     Applies to ALL damage including devastating wounds
  │
  └─ Post:  [MORTAL WOUNDS per hit] → each hit → Y extra mortal wounds
              bypass saves, still subject to FNP of first pool
```

## Key invariants (from WH40K 10th edition rules)

| Mechanic | Trigger | Effect | Saves bypass? | FNP bypass? |
|---|---|---|---|---|
| Sustained Hits X | Unmod. hit roll = 6 | X extra hits | No | No |
| Lethal Hits | Unmod. hit roll = 6 | Auto-wound | No | No |
| Devastating Wounds | Unmod. wound roll = 6 | Bypass save | **Yes** | No |
| Mortal Wounds per hit | Each hit | Y mortal wounds | **Yes** | No |
| Feel No Pain | Each damage point | Negate on ≥ threshold | — | — |

> **Critical roll = unmodified 6**: modifiers never affect whether a roll is "critical".
> Reroll policies DO affect the probability of rolling a 6 (a rerolled 6 counts as a critical).

## Critical probability formula

For any critical roll (threshold = 6) subject to rerolls but NOT to modifiers:

$$P(\text{crit}) = \texttt{dieSuccessProbability}(6,\ 0,\ \textit{rerollPolicy})$$

For normal wounds/hits probability (subtract crit probability from total):

$$P(\text{normal}) = \max\!\left(0,\ P(\text{all}) - P(\text{crit})\right)$$

## Layer placement

| New mechanic type | Where it lives |
|---|---|
| New probability function (pure math) | `src/domain/math/` |
| New weapon keyword (e.g., Anti, Torrent) | `src/domain/dice/weapon.ts` + pipeline in `CalculateUnitCombatUseCase.ts` |
| New save pool property | `src/domain/dice/savePool.ts` + pipeline Stage 3–5 |
| New use case (new input/output shape) | `src/application/dice/` |

## Adding a new weapon ability — step by step (TDD)

### 1. Identify the stage

Ask: "At which stage of the pipeline does this mechanic intervene?"
- Hits stage (Stage 1): new hit-roll variant
- Wound stage (Stage 2): new wound-roll variant
- Save stage (Stage 3–4): new save-bypass variant
- Damage step (Stage 4–5): new damage modifier or FNP variant

### 2. Add the field to `WeaponProfile` or `SavePool`

In `src/domain/dice/weapon.ts` or `src/domain/dice/savePool.ts`.
Always optional (`?:`) to keep backward compatibility.
Add JSDoc explaining the WH40K rule precisely (trigger + effect + game edition note if relevant).

### 3. Write the failing test (Red)

Add a new `describe` block in `CalculateUnitCombatUseCase.test.ts`.
Include a table comment with the manual calculation (see existing tests as model).
Run with `npx jest --testPathPattern=CalculateUnitCombatUseCase` — must fail.

#### Test fixture pattern
```ts
const BASE: WeaponGroup = {
  attacksDist: fixed(6),
  hitThreshold: 3,       // pHit=4/6, pCrit=1/6, pNormHit=3/6
  strengthDist: fixed(4),// S=T=4 → wound 4+ → pWound=3/6, pCritWound=1/6
  ap: 2,
  damageDist: fixed(1),
  modelCount: 1,
};
// POOL_IMPOSSIBLE: baseSave=5, AP2 → effective 7 → failSave=1
// POOL_SAVE:       baseSave=3, AP2 → effective 5 → failSave=4/6
```

Always verify at least: expected value matches manual formula, probabilities sum to 1.

### 4. Implement in `CalculateUnitCombatUseCase.ts` (Green)

Edit the per-group loop inside `execute()`. Add the new ability field to the
destructuring and insert the stage logic in the correct place.

Re-use existing helpers:
- `applyStage(dist, p)` — binomial thinning (hits/wounds/saves)
- `applyDamage(woundDist, damageDist)` — randomly stopped sum (also used for scaling)
- `dieSuccessProbability(threshold, modifier, rerollPolicy)` — P(D6 roll succeeds)
- `convolve(a, b)` — sum of two independent distributions
- `DEGENERATE_ZERO` — identity element for convolution

#### Scaling trick for variable-multiplier extra hits/wounds
```ts
// k crits each producing X extra hits — equivalent to scaling the crit distribution
const extraHitsDist = applyDamage(critHitsDist, [{ value: X, probability: 1 }]);
```

### 5. Update `CalculateCombatResultUseCase.ts`

Add the new field to the destructuring and pass it through to `weaponGroups[0]`.

### 6. Verify (Refactor)

```bash
npx tsc --noEmit
npx jest --no-coverage
```

Both must be green before continuing.

## Common mistakes to avoid

| Mistake | Correct approach |
|---|---|
| Using `hitModifier` to reduce crit threshold | Crits always trigger on **unmodified** 6 — call `dieSuccessProbability(6, 0, reroll)` |
| Forgetting to split crits only when an ability requires it | Only enable the crit-split path when `lethalHits` or `sustainedHits` are active (performance) |
| Applying FNP twice to devastating wounds | FNP is applied in Stage 5 via the pool loop — devastating wounds enter the same pool damage path |
| Convolving mortal wounds inside the pool loop | Mortal wounds bypass saves → compute outside the pool loop and convolve into `groupDamageDist` |
| Extra Sustained hits becoming crits themselves | WH40K rule: Sustained extra hits are **not** critical hits — they do NOT trigger further Lethal Hits or Devastating Wounds |

## i18n keys to add when exposing a new ability in the UI

Add to both `src/infrastructure/i18n/locales/en.ts` and `es.ts`:
```ts
profile: {
  fieldSustainedHits:       'Sustained Hits',
  fieldLethalHits:          'Lethal Hits',
  fieldDevastatingWounds:   'Devastating Wounds',
  fieldMortalWoundsPerHit:  'Mortal Wounds per hit',
}
```

## Related files

| File | Role |
|---|---|
| `src/domain/dice/weapon.ts` | `WeaponProfile` + `WeaponGroup` interfaces |
| `src/domain/dice/savePool.ts` | `SavePool` interface |
| `src/domain/dice/combat.ts` | `dieSuccessProbability`, `woundThreshold`, `chosenSaveThreshold` |
| `src/domain/math/pipeline.ts` | `applyStage`, `applyDamage` |
| `src/domain/math/convolution.ts` | `convolve`, `multiConvolve` |
| `src/application/dice/CalculateUnitCombatUseCase.ts` | Full pipeline orchestration |
| `src/application/dice/CalculateCombatResultUseCase.ts` | Single-weapon facade |
| `src/application/dice/CalculateUnitCombatUseCase.test.ts` | All pipeline tests |
