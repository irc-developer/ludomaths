/* Local validation only. Pass a clean package directory; no private payload is emitted. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request.startsWith('@domain/')) request = path.join(root, 'src/domain', request.slice(8));
  if (request.startsWith('@application/')) request = path.join(root, 'src/application', request.slice(13));
  return originalResolve.call(this, request, ...args);
};
require.extensions['.ts'] = function (module, filename) {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText;
  module._compile(output, filename);
};
const { validateCatalog, canonicalCatalog } = require('../src/domain/profiles/catalog.ts');
const { resolveCatalogScenario } = require('../src/application/dice/catalogScenario.ts');
const { buildCombatScenario } = require('../src/application/dice/combatScenario.ts');
const { CalculateUnitCombatUseCase } = require('../src/application/dice/CalculateUnitCombatUseCase.ts');
const { CalculateRequiredAttacksUseCase } = require('../src/application/dice/CalculateRequiredAttacksUseCase.ts');
const { CompareCombatBuffUseCase } = require('../src/application/dice/CompareCombatBuffUseCase.ts');
const folder = process.argv[2];
if (!folder) throw new Error('Pass the clean package directory');
const engine = new CalculateUnitCombatUseCase();
const inverse = new CalculateRequiredAttacksUseCase();
const comparison = new CompareCombatBuffUseCase();
for (const filename of ['orks-pilot.json', 'astartes-pilot.json', 'pilot-combined.json']) {
  const catalog = validateCatalog(JSON.parse(fs.readFileSync(path.join(folder, filename), 'utf8')));
  const digest = crypto.createHash('sha256').update(canonicalCatalog(catalog)).digest('hex');
  if (digest !== catalog.payloadSha256) throw new Error('Digest mismatch');
  let accepted = 0, pending = 0, ineligible = 0;
  let slowestMs = 0, agreements = 0;
  for (const miniature of catalog.miniatures) for (const choice of catalog.equipmentChoices.filter(c => c.miniatureId === miniature.id)) {
    for (const mode of catalog.weaponModes.filter(m => choice.weaponIds.includes(m.weaponId))) for (const defender of catalog.miniatures) {
      const selection = { catalogId: catalog.catalogId, catalogVersion: catalog.catalogVersion, payloadSha256: catalog.payloadSha256,
        attackerUnitId: miniature.unitId, attackerMiniatureId: miniature.id, modeId: mode.id,
        defenderUnitId: defender.unitId, defenderMiniatureId: defender.id };
      const input = { attacks: 1, hitThreshold: 3, strength: 4, ap: 0, damage: 1, toughness: 4, targetWounds: 1, baseSave: 3,
        modelCount: 1, withinHalfRange: false, phase: 'shooting', engaged: false, setUpThisTurn: false, movedOverThree: false };
      let review;
      try { review = resolveCatalogScenario(catalog, selection, input); }
      catch (error) { if (error.message === 'CATALOG_TARGET_NOT_ELIGIBLE') { ineligible++; continue; } throw error; }
      if (review.pending.length) pending++;
      const scenario = buildCombatScenario(review.params);
      const started = performance.now();
      const result = engine.execute({ weaponGroups: [scenario.weapon], toughness: scenario.target.toughness,
        savePools: [{ ...scenario.target, fraction: 1 }] });
      const mass = result.totalDamageDist.reduce((sum, entry) => sum + entry.probability, 0);
      if (Math.abs(mass - 1) > 1e-9) throw new Error('Probability mass mismatch');
      const required = inverse.execute({ weapon: scenario.weapon, target: scenario.target, targetWounds: scenario.remainingWounds,
        successProbability: 0.9 });
      if (required.status !== 'success' || required.previousProbability >= 0.9 || required.probability < 0.9) throw new Error('Minimum attacks mismatch');
      const profiles = { attacker: { name: 'Attacker', wounds: 1, toughness: 1, savePools: [{ fraction: 1, baseSave: 6 }], weaponGroups: [scenario.weapon] },
        defender: { name: 'Defender', wounds: scenario.remainingWounds, toughness: scenario.target.toughness, savePools: [{ ...scenario.target, fraction: 1 }], weaponGroups: [] } };
      const buffs = comparison.execute(profiles);
      const kill = result.totalDamageDist.filter(e => e.value >= scenario.remainingWounds).reduce((sum, e) => sum + e.probability, 0);
      if (Math.abs(kill - buffs.baseline.firstRoundKillProbability) > 1e-9) throw new Error('Calculator agreement mismatch');
      agreements++; accepted++;
      slowestMs = Math.max(slowestMs, performance.now() - started);
    }
  }
  console.log(JSON.stringify({ package: filename, units: catalog.units.length, modes: catalog.weaponModes.length,
    accepted, pending, ineligible, agreements, slowestMs: Number(slowestMs.toFixed(2)), digestVerified: true }));
}
