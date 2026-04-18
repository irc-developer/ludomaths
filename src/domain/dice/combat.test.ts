import { chosenSaveThreshold, dieSuccessProbability, effectiveSaveThreshold, woundThreshold } from './combat';

describe('woundThreshold', () => {
  // Las cinco reglas de la tabla de heridas de Warhammer 40K.
  // Cada caso corresponde a una comparación entre fuerza (S) y resistencia (T).

  // f*2 >= r → 2+ (fuerza al menos el doble de la resistencia)
  it('returns 2 when S is at least double T', () => {
    expect(woundThreshold(8, 4)).toBe(2);
    expect(woundThreshold(10, 5)).toBe(2);
    expect(woundThreshold(4, 2)).toBe(2);
  });

  // f > r → 3+ (fuerza superior a la resistencia, sin llegar al doble)
  it('returns 3 when S is greater than T but less than double', () => {
    expect(woundThreshold(5, 4)).toBe(3);
    expect(woundThreshold(6, 4)).toBe(3);
    expect(woundThreshold(7, 5)).toBe(3);
  });

  // f === r → 4+ (fuerza igual a la resistencia)
  it('returns 4 when S equals T', () => {
    expect(woundThreshold(4, 4)).toBe(4);
    expect(woundThreshold(3, 3)).toBe(4);
  });

  // f < r, sin llegar a ser la mitad o menos → 5+
  it('returns 5 when S is less than T but greater than half T', () => {
    expect(woundThreshold(3, 4)).toBe(5);
    expect(woundThreshold(4, 5)).toBe(5);
    expect(woundThreshold(5, 6)).toBe(5);
  });

  // f*2 <= r → 6+ (fuerza la mitad o menos de la resistencia)
  // Nótese: f*2 <= r equivale a f <= r/2, que es lo contrario de f > r/2.
  it('returns 6 when S is at most half T', () => {
    expect(woundThreshold(2, 4)).toBe(6);
    expect(woundThreshold(1, 3)).toBe(6);
    expect(woundThreshold(3, 7)).toBe(6);
  });

  // ── Entradas inválidas ────────────────────────────────────────────────────
  it('throws when S or T are not positive integers', () => {
    expect(() => woundThreshold(0, 4)).toThrow(RangeError);
    expect(() => woundThreshold(4, 0)).toThrow(RangeError);
    expect(() => woundThreshold(-1, 4)).toThrow(RangeError);
    expect(() => woundThreshold(3.5, 4)).toThrow(RangeError);
  });
});

describe('effectiveSaveThreshold', () => {
  // ── Caso base: AP 0 no modifica la salvación ──────────────────────────────
  it('returns baseSave unchanged when ap is 0', () => {
    expect(effectiveSaveThreshold(3, 0)).toBe(3);
    expect(effectiveSaveThreshold(6, 0)).toBe(6);
  });

  // ── AP positivo penaliza la salvación ─────────────────────────────────────
  // AP-1 sube el umbral en 1 (3+ se vuelve 4+).
  it('adds ap to baseSave', () => {
    expect(effectiveSaveThreshold(3, 1)).toBe(4);
    expect(effectiveSaveThreshold(4, 2)).toBe(6);
  });

  // ── La salvación nunca puede ser mejor que 2+ ─────────────────────────────
  // (El 1 siempre falla en WH40K; 2+ es el máximo efectivo).
  // Esto no se fuerza en esta función; el límite inferior ya lo hace el dado.

  // ── Salvación imposible: umbral > 6 ──────────────────────────────────────
  // Si el resultado es > 6, ninguna tirada puede salvar. La función devuelve
  // el número aritmético (> 6); el caller decide cómo interpretarlo.
  it('can return values above 6 when ap is large', () => {
    expect(effectiveSaveThreshold(5, 3)).toBe(8);
    expect(effectiveSaveThreshold(6, 2)).toBe(8);
  });

  // ── Entradas inválidas ────────────────────────────────────────────────────
  it('throws when baseSave is outside [2, 6]', () => {
    expect(() => effectiveSaveThreshold(1, 0)).toThrow(RangeError);
    expect(() => effectiveSaveThreshold(7, 0)).toThrow(RangeError);
  });

  it('throws when baseSave is not an integer', () => {
    expect(() => effectiveSaveThreshold(3.5, 0)).toThrow(RangeError);
  });

  it('throws when ap is negative', () => {
    expect(() => effectiveSaveThreshold(4, -1)).toThrow(RangeError);
  });

  it('throws when ap is not an integer', () => {
    expect(() => effectiveSaveThreshold(4, 0.5)).toThrow(RangeError);
  });
});

describe('chosenSaveThreshold', () => {
  // chosenSaveThreshold picks the best (lowest) threshold available to the
  // defender, choosing between the armor save (modified by AP) and the
  // unmodifiable invulnerable save.

  // ── No invulnerable: behaves exactly like effectiveSaveThreshold ──────────
  it('returns effectiveSaveThreshold when invulnerableSave is not provided', () => {
    expect(chosenSaveThreshold(3, 1)).toBe(4);
    expect(chosenSaveThreshold(6, 0)).toBe(6);
  });

  // ── Invulnerable is better than modified armor ────────────────────────────
  // AP makes the armor save worse; invulnerable takes over.
  it('returns invulnerableSave when it is better than the modified armor save', () => {
    // armor 4+, AP-2 → effective 6+; invulnerable 5+ → 5 < 6, use invulnerable
    expect(chosenSaveThreshold(4, 2, 5)).toBe(5);
    // armor 3+, AP-3 → effective 6+; invulnerable 4+ → use invulnerable
    expect(chosenSaveThreshold(3, 3, 4)).toBe(4);
  });

  // ── AP negates armor: invulnerable is the only save ───────────────────────
  it('returns invulnerableSave when AP negates armor entirely', () => {
    // armor 5+, AP-3 → effective 8+ (impossible); invulnerable 4+
    expect(chosenSaveThreshold(5, 3, 4)).toBe(4);
    // armor 6+, AP-5 → effective 11+ (impossible); invulnerable 6+
    expect(chosenSaveThreshold(6, 5, 6)).toBe(6);
  });

  // ── Armor is better than invulnerable ────────────────────────────────────
  // Low AP leaves armor better than the invulnerable.
  it('returns effectiveSaveThreshold when armor is better than invulnerableSave', () => {
    // armor 2+, AP-0 → effective 2+; invulnerable 5+ → 2 < 5, use armor
    expect(chosenSaveThreshold(2, 0, 5)).toBe(2);
    // armor 3+, AP-1 → effective 4+; invulnerable 5+ → 4 < 5, use armor
    expect(chosenSaveThreshold(3, 1, 5)).toBe(4);
  });

  // ── Tie: same threshold → use either (result is the same) ────────────────
  it('returns the shared threshold when armor and invulnerable are equal', () => {
    expect(chosenSaveThreshold(4, 1, 5)).toBe(5);
  });

  // ── Validation: delegates to effectiveSaveThreshold ──────────────────────
  it('throws when baseSave is out of range', () => {
    expect(() => chosenSaveThreshold(1, 0)).toThrow(RangeError);
    expect(() => chosenSaveThreshold(7, 0)).toThrow(RangeError);
  });

  it('throws when invulnerableSave is outside [2, 6]', () => {
    expect(() => chosenSaveThreshold(4, 0, 1)).toThrow(RangeError);
    expect(() => chosenSaveThreshold(4, 0, 7)).toThrow(RangeError);
  });

  it('throws when invulnerableSave is not an integer', () => {
    expect(() => chosenSaveThreshold(4, 0, 3.5)).toThrow(RangeError);
  });
});

describe('dieSuccessProbability', () => {
  // dieSuccessProbability computes P(D6 ≥ effectiveThreshold) where:
  //   effectiveThreshold = clamp(baseThreshold - modifier, 2, ∞)
  //   modifier is clamped to [-1, +1] (WH40K rule)
  //   reroll policy adjusts the probability after the first roll

  // ── Base probability: no modifier, no reroll ─────────────────────────────
  it('returns (7-T)/6 with no modifier or reroll', () => {
    expect(dieSuccessProbability(2, 0, 'none')).toBeCloseTo(5 / 6);
    expect(dieSuccessProbability(4, 0, 'none')).toBeCloseTo(3 / 6);
    expect(dieSuccessProbability(6, 0, 'none')).toBeCloseTo(1 / 6);
  });

  it('supports default parameters (modifier=0, reroll=none)', () => {
    expect(dieSuccessProbability(4)).toBeCloseTo(3 / 6);
    expect(dieSuccessProbability(4, 0)).toBeCloseTo(3 / 6);
  });

  // ── Modifier ─────────────────────────────────────────────────────────────
  it('+1 modifier reduces the threshold by 1 (easier roll)', () => {
    // 4+ with +1 → effective 3+ → p = 4/6
    expect(dieSuccessProbability(4, 1, 'none')).toBeCloseTo(4 / 6);
  });

  it('-1 modifier increases the threshold by 1 (harder roll)', () => {
    // 4+ with -1 → effective 5+ → p = 2/6
    expect(dieSuccessProbability(4, -1, 'none')).toBeCloseTo(2 / 6);
  });

  it('modifier is clamped to +1 (WH40K: maximum +1)', () => {
    expect(dieSuccessProbability(4, 3, 'none')).toBeCloseTo(dieSuccessProbability(4, 1, 'none'));
  });

  it('modifier is clamped to -1 (WH40K: maximum -1)', () => {
    expect(dieSuccessProbability(4, -3, 'none')).toBeCloseTo(dieSuccessProbability(4, -1, 'none'));
  });

  it('effective threshold is floored at 2 (roll of 1 always fails)', () => {
    // 2+ with +1 modifier → effective 1+, clamped to 2+
    expect(dieSuccessProbability(2, 1, 'none')).toBeCloseTo(5 / 6);
  });

  it('effective threshold > 6 gives probability 0 (impossible)', () => {
    // 6+ with -1 modifier → effective 7+
    expect(dieSuccessProbability(6, -1, 'none')).toBeCloseTo(0);
  });

  it('+1 modifier rescues a negated save (threshold 7 → effective 6)', () => {
    // AP negated a 5+ save to 7+; a +1 modifier brings it back to 6+
    expect(dieSuccessProbability(7, 1, 'none')).toBeCloseTo(1 / 6);
  });

  // ── Reroll policies ──────────────────────────────────────────────────────

  // reroll 'ones':
  //   Only dice showing 1 on the first roll are rerolled.
  //   Since the effective threshold is always ≥ 2, rolling 1 always fails.
  //   P = p + P(rolled 1) · p = p + (1/6) · p = p · (7/6)
  it("reroll 'ones': P = p * (7/6)", () => {
    const p = 3 / 6; // 4+
    expect(dieSuccessProbability(4, 0, 'ones')).toBeCloseTo(p * (7 / 6));
  });

  // reroll 'failures':
  //   All failed dice are rerolled once.
  //   P = p + (1−p) · p = p · (2−p)
  it("reroll 'failures': P = p * (2 - p)", () => {
    const p = 3 / 6; // 4+
    expect(dieSuccessProbability(4, 0, 'failures')).toBeCloseTo(p * (2 - p));
  });

  it("reroll 'failures' is strictly better than reroll 'ones' when p < 5/6", () => {
    // At t=2, p=5/6: p*(2-p) = p*(7/6) — they are equal because (2-5/6)=(7/6).
    // For all other thresholds (t≥3, p≤4/6) failures strictly dominates ones.
    for (let t = 3; t <= 5; t++) {
      expect(dieSuccessProbability(t, 0, 'failures')).toBeGreaterThan(
        dieSuccessProbability(t, 0, 'ones'),
      );
    }
  });

  it('modifier is applied before judging the reroll (modified threshold determines failures)', () => {
    // 4+ with +1 modifier → effective 3+ → p = 4/6
    // reroll 'failures': p*(2-p) = (4/6)*(8/6)
    const p = 4 / 6;
    expect(dieSuccessProbability(4, 1, 'failures')).toBeCloseTo(p * (2 - p));
  });

  it("reroll 'ones' with impossible roll (p=0) stays 0", () => {
    // 6+ with -1 → effective 7+ → p = 0 → reroll still gives 0
    expect(dieSuccessProbability(6, -1, 'ones')).toBeCloseTo(0);
  });

  it("reroll 'failures' with impossible roll (p=0) stays 0", () => {
    expect(dieSuccessProbability(6, -1, 'failures')).toBeCloseTo(0);
  });
});
