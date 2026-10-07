import type { WeaponGroup } from '@domain/dice/weapon';
import type { AttackTarget } from '@domain/dice/attackDamage';
import { singleAttackWoundCounts, combineWoundCounts, type WoundCountOutcome } from '@domain/dice/attackWoundCounts';
import { convolve, multiConvolve } from '@domain/math/convolution';
import { binomialDistribution } from '@domain/math/binomial';
import { applyStage } from '@domain/math/pipeline';
import { expectedValue, type Distribution } from '@domain/math/distribution';
import { dieSuccessProbability } from '@domain/dice/combat';

export const SQUAD_ENGINE_VERSION = 'lm-squad-1';
export interface SquadDefenderGroup extends AttackTarget {
  count: number;
  woundsMax: number;
  firstModelWounds?: number;
  isCharacter?: boolean;
  name?: string;
}
export interface SquadCombatInput { weaponGroups: WeaponGroup[]; defenders: SquadDefenderGroup[]; maxOperations?: number; activations?: number }
export interface SquadCombatResult {
  casualtiesDist: Distribution;
  woundsLostDist: Distribution;
  expectedCasualties: number;
  expectedSurvivors: number;
  expectedWoundsLost: number;
  pEliminate: number;
  modelCount: number;
  initialWounds: number;
  engineVersion: string;
}
type Mass = Map<number, number>;
const add = (mass: Mass, value: number, p: number) => { if (p > 0) mass.set(value, (mass.get(value) ?? 0) + p); };
const distribution = (mass: Mass): Distribution => [...mass].sort((a, b) => a[0] - b[0]).map(([value, probability]) => ({ value, probability }));
function integer(value: number, min: number, max: number) {
  if (!Number.isInteger(value) || value < min || value > max) throw new RangeError('SQUAD_INVALID_INPUT');
}

/** Exact stage-wise attack resolution with sorted save faces and per-model damage caps. */
export class CalculateSquadCombatUseCase {
  execute(input: SquadCombatInput): SquadCombatResult {
    const { weaponGroups, defenders } = input;
    if (!weaponGroups.length || weaponGroups.length > 20 || !defenders.length || defenders.length > 20) throw new RangeError('SQUAD_INVALID_INPUT');
    let characterSeen = false;
    let woundedSeen = false;
    for (const [i, g] of defenders.entries()) {
      integer(g.count, 1, 100); integer(g.woundsMax, 1, 100); integer(g.toughness, 1, 100); integer(g.baseSave, 2, 6);
      integer(g.firstModelWounds ?? g.woundsMax, 1, g.woundsMax);
      for (const n of [g.invulnerableSave, g.fnpThreshold]) if (n !== undefined) integer(n, 2, 6);
      integer(g.saveModifier ?? 0, -100, 100);
      if (g.saveReroll && g.saveReroll !== 'none') throw new RangeError('SQUAD_SAVE_REROLL_UNSUPPORTED');
      if (g.isCharacter) { integer(g.count, 1, 1); characterSeen = true; }
      else if (characterSeen) throw new RangeError('SQUAD_ALLOCATION_ORDER');
      if ((g.firstModelWounds ?? g.woundsMax) < g.woundsMax) {
        if (woundedSeen || (!g.isCharacter && i !== 0) || (g.isCharacter && defenders.slice(0, i).some(x => x.isCharacter))) throw new RangeError('SQUAD_ALLOCATION_ORDER');
        woundedSeen = true;
      }
    }
    // Non-character models with equal W/Sv/InSv belong to one allocation group.
    const allocationGroups: SquadDefenderGroup[][] = [];
    const groupBySave = new Map<string, SquadDefenderGroup[]>();
    for (const g of defenders) {
      const key = `${g.woundsMax}:${g.baseSave}:${g.invulnerableSave ?? 0}`;
      const existing = !g.isCharacter && groupBySave.get(key);
      if (existing) existing.push(g);
      else { const group = [g]; allocationGroups.push(group); if (!g.isCharacter) groupBySave.set(key, group); }
    }
    const models = allocationGroups.flat().flatMap(g => Array.from({ length: g.count }, (_, i) => ({ ...g,
      initial: i === 0 ? g.firstModelWounds ?? g.woundsMax : g.woundsMax })));
    if (models.length > 100) throw new RangeError('SQUAD_INVALID_INPUT');
    const ends: number[] = []; let initialWounds = 0;
    for (const m of models) { initialWounds += m.initial; ends.push(initialWounds); }
    if (initialWounds > 500) throw new RangeError('SQUAD_COMPLEXITY_LIMIT');
    const indexAt = Array.from({ length: initialWounds + 1 }, (_, lost) => {
      const i = ends.findIndex(end => end > lost); return i < 0 ? models.length : i;
    });
    let operations = 0; const budget = input.maxOperations ?? 20_000_000;
    integer(budget, 1, 100_000_000);
    const spend = (count = 1) => { operations += count; if (operations > budget) throw new RangeError('SQUAD_COMPLEXITY_LIMIT'); };
    let maxHits = 0;
    for (const w of weaponGroups) {
      integer(w.modelCount, 1, 100); integer(w.hitThreshold, 2, 6); integer(w.ap, 0, 100);
      integer(w.sustainedHits ?? 0, 0, 10);
      for (const n of [w.hitModifier ?? 0, w.woundModifier ?? 0]) integer(n, -100, 100);
      if (w.guaranteedHitSixes || w.guaranteedWoundSixes || w.guaranteedDamageValue !== undefined || w.mortalWoundsPerHit) throw new RangeError('SQUAD_OBSERVED_UNSUPPORTED');
      for (const dist of [w.attacksDist, w.damageDist, w.strengthDist]) {
        if (!dist.length || dist.length > 101 || dist.some(e => !Number.isInteger(e.value) || e.value < 1 || e.value > (dist === w.attacksDist ? 300 : 100) ||
          !Number.isFinite(e.probability) || e.probability < 0) || Math.abs(dist.reduce((sum, e) => sum + e.probability, 0) - 1) > 1e-9) throw new RangeError('SQUAD_INVALID_INPUT');
      }
      maxHits += Math.max(...w.attacksDist.map(e => e.value)) * w.modelCount * (1 + (w.torrent ? 0 : w.sustainedHits ?? 0));
    }
    const activations = input.activations ?? 1; integer(activations, 1, 20);
    if (maxHits * activations > 300) throw new RangeError('SQUAD_COMPLEXITY_LIMIT');
    const batches = new Map<string, WeaponGroup>();
    for (const w of weaponGroups) {
      const key = JSON.stringify([w.hitThreshold, w.hitModifier ?? 0, w.hitReroll ?? 'none', w.strengthDist,
        w.woundModifier ?? 0, w.woundReroll ?? 'none', w.ap, w.damageDist, w.torrent ?? false,
        w.sustainedHits ?? 0, w.lethalHits ?? false, w.lethalChoice ?? 'autoWound', w.devastatingWounds ?? false]);
      spend(Math.max(...w.attacksDist.map(e => e.value)) * w.modelCount);
      const attacks = multiConvolve(w.attacksDist, w.modelCount);
      const old = batches.get(key);
      if (old) { spend(old.attacksDist.length * attacks.length); old.attacksDist = convolve(old.attacksDist, attacks); }
      else batches.set(key, { ...w, modelCount: 1, attacksDist: attacks });
    }
    let states: Mass = new Map([[0, 1]]);
    for (const weapon of Array.from({ length: activations }, () => [...batches.values()]).flat()) {
      const damageCache = new Map<number, Distribution>();
      const packet = (start: number): Distribution => {
        const cached = damageCache.get(start); if (cached) return cached;
        if (start === initialWounds) return [{ value: start, probability: 1 }];
        const model = models[indexAt[start]];
        const damage = model.fnpThreshold === undefined ? weapon.damageDist : applyStage(weapon.damageDist, 1 - dieSuccessProbability(model.fnpThreshold));
        const mass: Mass = new Map();
        for (const d of damage) { spend(); add(mass, Math.min(ends[indexAt[start]], start + d.value), d.probability); }
        const result = distribution(mass); damageCache.set(start, result); return result;
      };
      const repeatCache = new Map<string, Distribution>();
      const repeatPackets = (start: number, count: number, face?: number): Distribution => {
        const key = `${start}:${count}:${face ?? 0}`; const cached = repeatCache.get(key); if (cached) return cached;
        let mass: Mass = new Map([[start, 1]]);
        for (let i = 0; i < count; i++) {
          const partial = repeatCache.get(`${start}:${i + 1}:${face ?? 0}`);
          if (partial) { mass = new Map(partial.map(e => [e.value, e.probability])); continue; }
          const next: Mass = new Map();
          for (const [lost, p] of mass) {
            spend(); const model = models[indexAt[lost]];
            const saves = model && face !== undefined && face !== 1 &&
              (face >= (model.invulnerableSave ?? Infinity) || face - weapon.ap + (model.saveModifier ?? 0) >= model.baseSave);
            if (!model || saves) add(next, lost, p);
            else for (const e of packet(lost)) add(next, e.value, p * e.probability);
          }
          mass = next;
          repeatCache.set(`${start}:${i + 1}:${face ?? 0}`, distribution(mass));
        }
        const result = distribution(mass); repeatCache.set(key, result); return result;
      };
      const savesCache = new Map<string, Distribution>();
      const sameSave = models.every(m => m.baseSave === models[0].baseSave && m.invulnerableSave === models[0].invulnerableSave &&
        (m.saveModifier ?? 0) === (models[0].saveModifier ?? 0));
      const sortedSaves = (start: number, count: number, face = 1): Distribution => {
        if (!count || start === initialWounds) return [{ value: start, probability: 1 }];
        const key = `${start}:${count}:${face}`; const cached = savesCache.get(key); if (cached) return cached;
        const mass: Mass = new Map();
        if (sameSave) {
          const m = models[0];
          const fail = Array.from({ length: 6 }, (_, i) => i + 1).filter(f => f === 1 ||
            (f < (m.invulnerableSave ?? Infinity) && f - weapon.ap + (m.saveModifier ?? 0) < m.baseSave)).length / 6;
          spend(count + 1);
          for (const failures of binomialDistribution(count, fail)) for (const e of repeatPackets(start, failures.value)) add(mass, e.value, failures.probability * e.probability);
        } else {
          // Conditional multinomial: among remaining dice, this face has probability 1/(7-face).
          spend(count + 1);
          for (const rolls of binomialDistribution(count, 1 / (7 - face))) {
            for (const after of repeatPackets(start, rolls.value, face)) {
              const tail = face === 6 ? [{ value: after.value, probability: 1 }] : sortedSaves(after.value, count - rolls.value, face + 1);
              for (const e of tail) { spend(); add(mass, e.value, rolls.probability * after.probability * e.probability); }
            }
          }
        }
        const result = distribution(mass); savesCache.set(key, result); return result;
      };
      const woundCache = new Map<number, WoundCountOutcome[]>();
      const groupWounds = (toughness: number) => {
        const cached = woundCache.get(toughness); if (cached) return cached;
        const one = singleAttackWoundCounts(weapon, toughness);
        const totalAttacks = multiConvolve(weapon.attacksDist, weapon.modelCount);
        const mixtures = new Map<string, WoundCountOutcome>();
        let joint: WoundCountOutcome[] = [{ normal: 0, devastating: 0, probability: 1 }];
        const max = Math.max(...totalAttacks.map(e => e.value));
        for (let n = 0; n <= max; n++) {
          const weight = totalAttacks.find(e => e.value === n)?.probability ?? 0;
          if (weight) for (const e of joint) {
            spend(); const key = `${e.normal},${e.devastating}`; const p = e.probability * weight;
            const prior = mixtures.get(key); if (prior) prior.probability += p; else mixtures.set(key, { ...e, probability: p });
          }
          if (n < max) { spend(joint.length * one.length); joint = combineWoundCounts(joint, one); }
        }
        const result = [...mixtures.values()]; woundCache.set(toughness, result); return result;
      };
      const next: Mass = new Map();
      for (const [lost, mass] of states) {
        if (lost === initialWounds) { add(next, lost, mass); continue; }
        const toughness = Math.max(...models.slice(indexAt[lost]).map(m => m.toughness));
        for (const wounds of groupWounds(toughness)) {
          for (const normal of sortedSaves(lost, wounds.normal)) {
            // Devastating wounds follow normal damage and remain separate capped packets.
            for (const dev of repeatPackets(normal.value, wounds.devastating)) {
              spend(); add(next, dev.value, mass * wounds.probability * normal.probability * dev.probability);
            }
          }
        }
      }
      states = next;
    }
    const casualties: Mass = new Map();
    for (const [lost, p] of states) add(casualties, indexAt[lost], p);
    const casualtiesDist = distribution(casualties); const woundsLostDist = distribution(states);
    const mass = woundsLostDist.reduce((sum, e) => sum + e.probability, 0);
    if (!Number.isFinite(mass) || Math.abs(mass - 1) > 1e-8) throw new RangeError('SQUAD_NUMERICAL_LIMIT');
    const expectedCasualties = expectedValue(casualtiesDist);
    return { casualtiesDist, woundsLostDist, expectedCasualties, expectedSurvivors: models.length - expectedCasualties,
      expectedWoundsLost: expectedValue(woundsLostDist), pEliminate: states.get(initialWounds) ?? 0,
      modelCount: models.length, initialWounds, engineVersion: SQUAD_ENGINE_VERSION };
  }
}
