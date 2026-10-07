import type { AttackWeapon } from './attackDamage';
import { attackRollProbabilities } from './attackDamage';

export interface WoundCountOutcome { normal: number; devastating: number; probability: number }

/** Joint counts preserve the dependence of a critical original and its sustained hits. */
export function singleAttackWoundCounts(weapon: AttackWeapon, toughness: number): WoundCountOutcome[] {
  const { hit, wound } = attackRollProbabilities(weapon, toughness);
  const critical = weapon.devastatingWounds ? wound.critical : 0;
  const ordinary: WoundCountOutcome[] = [
    { normal: 0, devastating: 0, probability: 1 - wound.success },
    { normal: 1, devastating: 0, probability: wound.success - critical },
    { normal: 0, devastating: 1, probability: critical },
  ].filter(e => e.probability > 0);
  if (weapon.torrent) return ordinary;
  let extras: WoundCountOutcome[] = [{ normal: 0, devastating: 0, probability: 1 }];
  for (let i = 0; i < (weapon.sustainedHits ?? 0); i++) extras = combineWoundCounts(extras, ordinary);
  const original = weapon.lethalHits && weapon.lethalChoice !== 'rollToWound'
    ? [{ normal: 1, devastating: 0, probability: 1 }] : ordinary;
  return merge([
    { normal: 0, devastating: 0, probability: 1 - hit.success },
    ...ordinary.map(e => ({ ...e, probability: e.probability * hit.normal })),
    ...combineWoundCounts(original, extras).map(e => ({ ...e, probability: e.probability * hit.critical })),
  ]);
}

function merge(entries: WoundCountOutcome[]): WoundCountOutcome[] {
  const result = new Map<string, WoundCountOutcome>();
  for (const e of entries) {
    if (e.probability === 0) continue;
    const key = `${e.normal},${e.devastating}`;
    const old = result.get(key);
    if (old) old.probability += e.probability;
    else result.set(key, { ...e });
  }
  return [...result.values()];
}

export function combineWoundCounts(a: WoundCountOutcome[], b: WoundCountOutcome[]): WoundCountOutcome[] {
  return merge(a.flatMap(x => b.map(y => ({ normal: x.normal + y.normal,
    devastating: x.devastating + y.devastating, probability: x.probability * y.probability }))));
}
