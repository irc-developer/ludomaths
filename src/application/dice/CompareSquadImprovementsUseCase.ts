import { CalculateSquadCombatUseCase, type SquadCombatInput, type SquadCombatResult } from './CalculateSquadCombatUseCase';
export interface SquadImprovementResult {
  baseline: SquadCombatResult; plusBallisticSkill: SquadCombatResult; plusHitRoll: SquadCombatResult;
  plusArmorPenetration: SquadCombatResult; plusDamage: SquadCombatResult; plusSave: SquadCombatResult;
  recommendedOption: 'ballisticSkill' | 'hitRoll' | 'armorPenetration' | 'damage' | 'equal';
}
export class CompareSquadImprovementsUseCase {
  execute(input: SquadCombatInput): SquadImprovementResult {
    const engine = new CalculateSquadCombatUseCase();
    const baseline = engine.execute(input);
    const plusBallisticSkill = engine.execute({ ...input, weaponGroups: input.weaponGroups.map(w => w.torrent ? w : { ...w, hitThreshold: Math.max(2, w.hitThreshold - 1) }) });
    const plusHitRoll = engine.execute({ ...input, weaponGroups: input.weaponGroups.map(w => w.torrent ? w : { ...w, hitModifier: (w.hitModifier ?? 0) + 1 }) });
    const plusArmorPenetration = engine.execute({ ...input, weaponGroups: input.weaponGroups.map(w => ({ ...w, ap: w.ap + 1 })) });
    const plusDamage = engine.execute({ ...input, weaponGroups: input.weaponGroups.map(w => ({ ...w,
      damageDist: w.damageDist.map(e => ({ ...e, value: e.value + 1 })) })) });
    const plusSave = engine.execute({ ...input, defenders: input.defenders.map(g => ({ ...g, baseSave: Math.max(2, g.baseSave - 1) })) });
    const candidates = [{ option: 'ballisticSkill' as const, result: plusBallisticSkill }, { option: 'hitRoll' as const, result: plusHitRoll },
      { option: 'armorPenetration' as const, result: plusArmorPenetration }, { option: 'damage' as const, result: plusDamage }];
    candidates.sort((a, b) => {
      const delta = b.result.expectedCasualties - a.result.expectedCasualties;
      return Math.abs(delta) > 1e-10 ? delta : b.result.pEliminate - a.result.pEliminate;
    });
    const best = candidates[0];
    const recommendedOption = best.result.expectedCasualties - baseline.expectedCasualties > 1e-10 || best.result.pEliminate - baseline.pEliminate > 1e-10 ? best.option : 'equal';
    return { baseline, plusBallisticSkill, plusHitRoll, plusArmorPenetration, plusDamage, plusSave, recommendedOption };
  }
}
