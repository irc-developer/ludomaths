import { CalculateCombatResultUseCase } from './CalculateCombatResultUseCase';
import { discreteProbability, Distribution } from '@domain/math/distribution';

// ── Perfiles de prueba ────────────────────────────────────────────────────────
// Marines espaciales básicos atacando a Guardia Imperial
// 4 ataques fijos, impactan en 3+, F4, FP-1, D1
// La unidad objetivo tiene R4, salvación 5+
const attacksDist   = [{ value: 4, probability: 1 }]; // 4 ataques fijos
const damageDist    = [{ value: 1, probability: 1 }]; // D1 (fijo)

describe('CalculateCombatResultUseCase', () => {
  const useCase = new CalculateCombatResultUseCase();

  // ── Las probabilidades suman 1 ─────────────────────────────────────────────
  it('produces a total damage distribution whose probabilities sum to 1', () => {
    const result = useCase.execute({
      attacksDist,
      hitThreshold: 3,
      strengthDist: [{ value: 4, probability: 1 }],
      ap: 1,
      damageDist,
      toughness: 4,
      baseSave: 5,
    });
    const total = result.totalDamageDist.reduce(
      (sum, e) => sum + e.probability,
      0,
    );
    expect(total).toBeCloseTo(1);
  });

  // ── Daño 0 siempre es posible (ningún ataque llega) ──────────────────────
  it('always includes damage 0 as a possible outcome', () => {
    const result = useCase.execute({
      attacksDist,
      hitThreshold: 3,
      strengthDist: [{ value: 4, probability: 1 }],
      ap: 1,
      damageDist,
      toughness: 4,
      baseSave: 5,
    });
    const zeroDamage = result.totalDamageDist.find(e => e.value === 0);
    expect(zeroDamage).toBeDefined();
    expect(zeroDamage!.probability).toBeGreaterThan(0);
  });

  // ── Salvación imposible aumenta el daño esperado ─────────────────────────
  // Con FP igual a la salvación (AP elimina la tirada), el daño esperado
  // debe ser mayor que con salvación efectiva.
  it('produces higher expected damage when save is negated', () => {
    const common = {
      attacksDist,
      hitThreshold: 3,
      strengthDist: [{ value: 4, probability: 1 }],
      damageDist,
      toughness: 4,
      baseSave: 5,
    };
    const withSave    = useCase.execute({ ...common, ap: 0 }); // 5+ sigue siendo efectiva
    const withoutSave = useCase.execute({ ...common, ap: 5 }); // FP+5 → umbral 10, imposible

    const ev = (dist: Distribution) =>
      dist.reduce((sum, e) => sum + e.value * e.probability, 0);

    expect(ev(withoutSave.totalDamageDist)).toBeGreaterThan(
      ev(withSave.totalDamageDist),
    );
  });

  // ── Umbral de impacto 7+ → nunca impacta → daño siempre 0 ────────────────
  it('results in zero damage when hit threshold is 7 (impossible roll)', () => {
    const result = useCase.execute({
      attacksDist,
      hitThreshold: 7,
      strengthDist: [{ value: 4, probability: 1 }],
      ap: 0,
      damageDist,
      toughness: 4,
      baseSave: 5,
    });
    expect(result.totalDamageDist).toHaveLength(1);
    expect(result.totalDamageDist[0].value).toBe(0);
    expect(result.totalDamageDist[0].probability).toBeCloseTo(1);
  });

  // ── Variable attacks: D6 ataques vs fijos ─────────────────────────────────
  // Con D6 ataques el daño esperado debería ser igual que con 3.5 ataques fijos
  // (valor esperado de D6 = 3.5). No es exactamente igual, pero el rango
  // de valores posibles es más amplio.
  it('produces a wider damage range with D6 attacks than with fixed 1 attack', () => {
    const d6Attacks = discreteProbability([
      { value: 1, weight: 1 }, { value: 2, weight: 1 }, { value: 3, weight: 1 },
      { value: 4, weight: 1 }, { value: 5, weight: 1 }, { value: 6, weight: 1 },
    ]);
    const singleAttack = [{ value: 1, probability: 1 }];

    const withD6 = useCase.execute({
      attacksDist: d6Attacks,
      hitThreshold: 3,
      strengthDist: [{ value: 4, probability: 1 }],
      ap: 0,
      damageDist,
      toughness: 4,
      baseSave: 6,
    });
    const withOne = useCase.execute({
      attacksDist: singleAttack,
      hitThreshold: 3,
      strengthDist: [{ value: 4, probability: 1 }],
      ap: 0,
      damageDist,
      toughness: 4,
      baseSave: 6,
    });

    const maxD6  = Math.max(...withD6.totalDamageDist.map(e => e.value));
    const maxOne = Math.max(...withOne.totalDamageDist.map(e => e.value));
    expect(maxD6).toBeGreaterThan(maxOne);
  });

  // ── Variable strength: distribución pondéra correctamente ─────────────────
  // S3 vs T4 = herida en 5+ (p=1/3). S5 vs T4 = herida en 3+ (p=2/3).
  // S en {3, 5} con igual peso → p_efectiva media entre 1/3 y 2/3 = 0.5.
  it('correctly weights wound probability across a variable strength distribution', () => {
    const variableStrength = discreteProbability([
      { value: 3, weight: 1 },
      { value: 5, weight: 1 },
    ]);
    const fixedStrengthMid = [{ value: 4, probability: 1 }]; // S4 vs T4 = 4+ (p=0.5)

    // Ambas configuraciones deben producir distribuciones similares de daño.
    const withVariable = useCase.execute({
      attacksDist: [{ value: 6, probability: 1 }],
      hitThreshold: 2, // siempre impactan para aislar el efecto de la herida
      strengthDist: variableStrength,
      ap: 5, // baseSave 6 + ap 5 = 11 → salvación imposible
      damageDist,
      toughness: 4,
      baseSave: 6,
    });
    const withMid = useCase.execute({
      attacksDist: [{ value: 6, probability: 1 }],
      hitThreshold: 2,
      strengthDist: fixedStrengthMid,
      ap: 5,
      damageDist,
      toughness: 4,
      baseSave: 6,
    });

    const ev = (dist: Distribution) =>
      dist.reduce((sum, e) => sum + e.value * e.probability, 0);

    // Ambas tienen p_wound = 0.5, así que E[daño] debe ser prácticamente igual.
    expect(ev(withVariable.totalDamageDist)).toBeCloseTo(ev(withMid.totalDamageDist), 1);
  });

  // ── Variable damage: D3 daño ──────────────────────────────────────────────
  it('produces a damage distribution spanning D×n values for D3 damage', () => {
    const d3Damage = discreteProbability([
      { value: 1, weight: 1 },
      { value: 2, weight: 1 },
      { value: 3, weight: 1 },
    ]);
    const result = useCase.execute({
      attacksDist: [{ value: 2, probability: 1 }], // exactamente 2 heridas
      hitThreshold: 2, // siempre impactan
      strengthDist: [{ value: 8, probability: 1 }], // S8 vs T1 → siempre hieren (2+)
      ap: 5, // baseSave 2 + ap 5 = 7 → salvación imposible
      damageDist: d3Damage,
      toughness: 1,
      baseSave: 2,
    });
    const maxDamage = Math.max(...result.totalDamageDist.map(e => e.value));
    expect(maxDamage).toBe(6); // 2 heridas × D3 máximo = 6
  });

  // ── Invulnerable save ─────────────────────────────────────────────────────
  describe('invulnerableSave', () => {
    const common = {
      attacksDist: [{ value: 4, probability: 1 }],
      hitThreshold: 3,
      strengthDist: [{ value: 4, probability: 1 }],
      damageDist: [{ value: 1, probability: 1 }],
      toughness: 4,
    };

    it('reduces damage when invulnerable is better than negated armor', () => {
      // AP-5 negates a 6+ save (effective 11+); invulnerable 4+ limits the damage
      const withInvuln = useCase.execute({
        ...common,
        baseSave: 6,
        ap: 5,
        invulnerableSave: 4,
      });
      const withoutInvuln = useCase.execute({
        ...common,
        baseSave: 6,
        ap: 5,
      });

      const ev = (dist: Distribution) =>
        dist.reduce((sum, e) => sum + e.value * e.probability, 0);

      expect(ev(withInvuln.totalDamageDist)).toBeLessThan(ev(withoutInvuln.totalDamageDist));
    });

    it('has no effect when armor is already better than invulnerable', () => {
      // AP-0 leaves 2+ intact; invulnerable 5+ is worse → no difference
      const withInvuln = useCase.execute({
        ...common,
        baseSave: 2,
        ap: 0,
        invulnerableSave: 5,
      });
      const withoutInvuln = useCase.execute({
        ...common,
        baseSave: 2,
        ap: 0,
      });

      const ev = (dist: Distribution) =>
        dist.reduce((sum, e) => sum + e.value * e.probability, 0);

      expect(ev(withInvuln.totalDamageDist)).toBeCloseTo(ev(withoutInvuln.totalDamageDist));
    });
  });

  // ── Feel No Pain ──────────────────────────────────────────────────────────
  describe('fnpThreshold (Feel No Pain)', () => {
    // AP-5 against baseSave 6 → effectiveSave 11 → save impossible (all wounds get through).
    // This isolates FNP as the only defensive mechanic.
    const fnpCommon = {
      attacksDist: [{ value: 4, probability: 1 }],
      hitThreshold: 3,
      strengthDist: [{ value: 4, probability: 1 }],
      damageDist: [{ value: 1, probability: 1 }],
      toughness: 4,
      baseSave: 6,
      ap: 5,
    };
    const ev = (dist: Distribution) =>
      dist.reduce((sum, e) => sum + e.value * e.probability, 0);

    it('FNP 5+ reduces expected damage compared to no FNP', () => {
      const eNoFNP = ev(useCase.execute(fnpCommon).totalDamageDist);
      const eFNP5  = ev(useCase.execute({ ...fnpCommon, fnpThreshold: 5 }).totalDamageDist);
      expect(eFNP5).toBeLessThan(eNoFNP);
    });

    it('absent fnpThreshold matches baseline without FNP field', () => {
      const eNoField    = ev(useCase.execute(fnpCommon).totalDamageDist);
      const eUndefined  = ev(useCase.execute({ ...fnpCommon, fnpThreshold: undefined }).totalDamageDist);
      expect(eUndefined).toBeCloseTo(eNoField);
    });
  });
});
