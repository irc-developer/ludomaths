---
name: wh40k
description: "Implement or correct the bounded WH40K 11th edition single-miniature calculation and private catalog adapter."
---

# WH40K calculation workflow

Follow workspace layer boundaries, English code/comments/tests, translation-only UI strings and mandatory TDD.

## Verified scope

One group of identical weapons, one selected mode, explicit carriers, one target miniature. Maximum and remaining wounds are separate. Do not call total unit wounds a verified unit-elimination model. Mixed save pools and observed dice remain explicitly legacy approximations.

The shared per-attack kernel is src/domain/dice/attackDamage.ts. Combat, required attacks and improvement comparison must use it. Condition on the hit outcome; original critical hits and Sustained extras share their branch. Never convolve independent normal/critical counts drawn from the same roll.

- Hit and wound rolls: natural one fails, natural six is critical; net roll modifier capped at plus/minus one. Preserve natural faces and once-only reroll decisions.
- Lethal Hits: explicit choice of automatic wound or wound roll. Automatic wounds cannot trigger Devastating Wounds.
- Torrent: no hit roll, no critical hits.
- Sustained X: fixed X only in this milestone; extras are normal hits.
- Devastating Wounds: critical wound damage packet bypasses saves; FNP applies. For the supported single miniature, excess damage is capped only in the actual-loss metric.
- Armor and invulnerable saves: calculate separately and choose the better probability. AP and armor modifiers never modify invulnerable saves. Natural six is not an automatic save; save modifiers do not use the hit/wound cap.
- FNP: one independent roll per potential lost wound. Show potential damage and actual loss capped at remaining wounds separately.
- Cover worsens ranged BS by one; Ignores Cover prevents that change. It does not improve armor.
- Heavy requires Shooting phase, unengaged unit, no arrival this turn and no model moving over three inches. Do not infer missing context as false.
- Rapid Fire and Melta use explicit half-range context at target selection. Keep intrinsic dice constants separate from external bonuses.
- Twin-linked permits wound rerolls; the user chooses failures/non-sixes. A UI option alone never grants a reroll rule.

## Catalog contract

Use the closed clean v2 schema, own catalog identity/digest/review registry and complete raw-token normalization. Reject unknown nested keys without echoing keys, payloads, parser errors or paths. No original locators, versions, hashes, publications, URLs or provenance enter product data. Raw exports and source provenance stay outside the repository and bundle. Iván authorized publishing the three clean pilot catalogs in web/public/catalogs; the combined pilot loads automatically in production. Tests use synthetic fixtures.

The current pilot binds torrent, heavy, rapidFire and devastatingWounds only. reviewed is not synonymous with engine support. Relevant pending/unsupported effects require explicit partial acceptance or block calculation. Out-of-scope effects remain visible limitations. Keep a brief notice and expandable detail; never activate effects from rule names.

Anti, Blast, conditional hit bonuses, riled-up effects and the pending Lethal condition belong to later explicitly authorized work. Do not build a generic effects resolver for this first milestone. See docs/plans/warhammer-rule-effects-integration.md.

## Mathematics and records

Compute round expectation with absorption recurrence over remaining wounds, not the truncated weighted sum of displayed rounds. Report residual survival and the actual horizon; impossible progress has infinite expectation. Distinguish offensive skill improvement from adding to the hit die; defender save improvement is a separate defensive comparison.

Enforce resource limits before distribution allocation. A bounded inverse search returns limit/impossible distinctly; never silently discard probability mass. Version new snapshots with the own engine revision. Old or mismatched revisions must not automatically recompute as current calculations.

## Checks

Write a failing regression next to the changed domain/use case, implement, run the focused tests, then required type/build/integration checks. Verify full distribution/mass and cross-calculator agreement, not just means. Do not publish or deploy during local implementation.
