# Squad combat

The web squad calculators resolve one declared attack activation against one defending squad. They do not simulate retaliation, moving models, target splitting or a complete battle round. The core is reusable independently of React; the native screen has not been adapted.

## Counts and equipment

Attacking and defending counts are current participating/surviving miniatures. Additional equipment groups are disjoint subsets of the total; the primary group contains the remainder. Adding another weapon to a group does not add miniatures. Catalog compositions suggest minimum quantities only, and do not certify list legality. Conditional compositions need further support.

All profiles are resolved against the same clean catalog identity and review. Omitted effects are aggregated across groups and require explicit acceptance for a squad result. Changing the omissions invalidates that acceptance.

## Exact resolution

Identical attack profiles form a single batch, including attacks from different equipment groups. Their first occurrence sets batch order. Attack counts from independent weapons are convolved. Variable attacks are rolled independently for each carrier. Distinct batches follow the declared order.

Each batch resolves hits and wounds before applying damage. The original critical hit and its Sustained extras remain in one joint outcome; Lethal automatic wounds cannot become Devastating Wounds. Wound probabilities use the highest toughness among living defenders at the start of the batch. Attached-unit toughness exceptions are outside this model.

Defensive allocation groups contain non-character miniatures with the same maximum wounds, armor save and invulnerable save. Each character forms its own group. Mandatory priority puts an injured non-character first, then other non-characters, then characters, with an injured character first among characters. Declared order selects among otherwise equal priorities. One initially injured miniature is supported. Identical defensive allocation groups are gathered together.

Normal save dice are resolved from lowest natural face to highest, using the current defending miniature as allocation advances. For uniform saves, a binomial failed-save distribution is equivalent and faster. A mixed defender uses a conditional multinomial recursion over save faces. Invulnerable saves ignore AP and armor modifiers; a natural one fails.

Each failed save creates a separate damage packet. Feel No Pain rolls occur before capping that packet at the miniature's remaining wounds. Excess damage is lost. Devastating packets bypass saves, resolve after normal damage, apply Feel No Pain and remain separately capped per miniature. Additional generic mortal-wound effects require further support.

The state is actual cumulative wounds lost along a fixed allocation order. That value identifies the current miniature and its remaining wounds. Complete elimination is absorbing. Equivalent states and packet transitions are merged and cached without dropping probability mass. Outputs are distributions of casualties and actual lost wounds, expected casualties/survivors/lost wounds, and the probability of eliminating the whole squad.

## Required amounts and improvements

A homogeneous weapon supports minimum individual attacks or complete attacking miniatures. Mixed equipment supports repetitions of the entire declared activation, with the same attacker and attack context and the evolving defender state. These repetitions do not imply complete game rounds. Exponential and binary searches check the previous amount and respect the maximum possible hit budget. A finite 100% guarantee is impossible for the supported wound-roll profiles.

Improvements affect all attacking weapons, or all defensive armor saves for the defensive comparison. Offensive recommendations rank expected casualties, then squad elimination probability. They do not compare offensive gains with the defender's save improvement.

## Limits and interface

The engine revision is `lm-squad-1`. Limits are 100 defenders, 100 carriers per weapon, 500 initial wounds, 20 input weapon groups, 20 input defender groups, 300 possible hits across all activations and 20 activations. Each execution also has a default budget of 20 million state operations. Save rerolls and observed dice are rejected explicitly. Larger or more complex cases return a limit; probability distributions are never silently truncated.

Browser calculations run in a worker after a short input debounce. Changes terminate older work; an older response cannot replace the current scenario's result. The simple existing single-defender route remains available. Tests check independent exhaustive enumeration, probability mass, packet caps, critical-hit dependence, mixed saves, wounded priority, gathered identical attacks, inverse minima, worker cancellation and cross-view quantities.
