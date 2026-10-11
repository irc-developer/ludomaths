import { applyCatalogEquipment, createCatalogEquipment, equipmentSummary } from './catalogEquipment';
import { equipmentFixture } from './catalogEquipmentFixture';
import { buildSquadScenario, individualProfile } from './squadScenario';
import { CalculateSquadCombatUseCase } from './CalculateSquadCombatUseCase';
import { resolveCatalogScenario } from './catalogScenario';
import { buildCombatScenario } from './combatScenario';

describe('reviewed squad equipment', () => {
  it('loads defaults and preserves roles while adding two bundled weapons', () => {
    const { catalog, review, base } = equipmentFixture();
    const draft = createCatalogEquipment(catalog, base, [review])!;
    draft.rows = [{ id: 'row-a', optionId: 'cyclone', count: 2, modeIds: {} }];
    const result = applyCatalogEquipment(catalog, { ...base, squadEquipment: draft }, [review]);
    expect(equipmentSummary(catalog, result)).toEqual([
      { weaponId: 'bolter', modeId: 'bolter-mode', count: 10 },
      { weaponId: 'cyclone', modeId: 'krak', count: 2 },
    ]);
    expect(result.attackerEquipmentGroups!.map(g => g.count).reduce((a, b) => a + b, 0)).toBe(3);
    expect(result.attackerEquipmentGroups!.some(g => g.weapons[0].catalogSelection?.attackerMiniatureId === 'sergeant')).toBe(true);
    expect(buildSquadScenario(result).weaponGroups.map(g => g.modelCount)).toEqual([7, 1, 2, 2]);
  });

  it('mixes additions and replacements without duplicate models or modes', () => {
    const { catalog, review, base } = equipmentFixture();
    const draft = createCatalogEquipment(catalog, base, [review])!;
    draft.rows = [{ id: 'a', optionId: 'cyclone', count: 1, modeIds: { cyclone: 'frag' } },
      { id: 'b', optionId: 'flamer', count: 1, modeIds: {} }];
    const result = applyCatalogEquipment(catalog, { ...base, squadEquipment: draft }, [review]);
    expect(equipmentSummary(catalog, result)).toEqual([
      { weaponId: 'bolter', modeId: 'bolter-mode', count: 9 },
      { weaponId: 'cyclone', modeId: 'frag', count: 1 },
      { weaponId: 'flamer', modeId: 'flamer-mode', count: 1 },
    ]);
    draft.rows.push({ id: 'c', optionId: 'flamer', count: 1, modeIds: {} });
    expect(() => applyCatalogEquipment(catalog, { ...base, squadEquipment: draft }, [review])).toThrow('EQUIPMENT_SHARED_LIMIT');
  });

  it('retains choices across attack types and counts only surviving carriers', () => {
    const { catalog, review, base } = equipmentFixture();
    const draft = createCatalogEquipment(catalog, base, [review])!;
    draft.rows = [{ id: 'a', optionId: 'cyclone', count: 2, modeIds: { cyclone: 'frag' } }];
    const result = applyCatalogEquipment(catalog, { ...base, modelCount: 3, squadEquipment: draft, attackType: 'melee' }, [review]);
    expect(equipmentSummary(catalog, result)).toEqual([{ weaponId: 'fist', modeId: 'fist-mode', count: 3 }]);
    expect(result.squadEquipment).toBe(draft);
    expect(equipmentSummary(catalog, applyCatalogEquipment(catalog, { ...result, attackType: 'ranged' }, [review]))[1].modeId).toBe('frag');
    expect(() => applyCatalogEquipment(catalog, { ...base, modelCount: 2, squadEquipment: draft }, [review])).toThrow('EQUIPMENT_COUNTS');
  });

  it('rejects stale reviews, unavailable modes and incompatible target conditions', () => {
    const { catalog, review, base } = equipmentFixture();
    const draft = createCatalogEquipment(catalog, base, [review])!;
    draft.rows = [{ id: 'a', optionId: 'cyclone', count: 1, modeIds: { cyclone: 'flamer-mode' } }];
    expect(() => applyCatalogEquipment(catalog, { ...base, squadEquipment: draft }, [review])).toThrow('EQUIPMENT_MODE');
    draft.rows[0].modeIds.cyclone = 'frag';
    catalog.weaponModes.find(m => m.id === 'frag')!.targetCondition = { state: 'reviewed', match: 'any', keywordIds: ['vehicle'], ruleIds: [] };
    expect(() => applyCatalogEquipment(catalog, { ...base, squadEquipment: draft }, [review])).toThrow('CATALOG_TARGET_NOT_ELIGIBLE');
    catalog.payloadSha256 = 'b'.repeat(64);
    expect(() => applyCatalogEquipment(catalog, { ...base, squadEquipment: draft }, [review])).toThrow('EQUIPMENT_REVIEW_UNAVAILABLE');
  });

  it('permits zero counts and a fully equipped ordinary role without an empty primary group', () => {
    const { catalog, review, base } = equipmentFixture();
    const draft = createCatalogEquipment(catalog, base, [review])!;
    draft.rows = [{ id: 'a', optionId: 'cyclone', count: 2, modeIds: {} }, { id: 'b', optionId: 'flamer', count: 0, modeIds: {} }];
    const result = applyCatalogEquipment(catalog, { ...base, modelCount: 3, squadEquipment: draft }, [review]);
    expect(buildSquadScenario(result).weaponGroups).toHaveLength(3);
    expect(equipmentSummary(catalog, result)[0].count).toBe(3);
    draft.rows[0].count = -1;
    expect(() => applyCatalogEquipment(catalog, { ...base, squadEquipment: draft }, [review])).toThrow('EQUIPMENT_COUNTS');
  });

  it('matches a manually configured mixed activation, including the full casualty distribution', () => {
    const { catalog, review, base } = equipmentFixture();
    const draft = createCatalogEquipment(catalog, base, [review])!;
    draft.rows = [{ id: 'a', optionId: 'cyclone', count: 1, modeIds: {} }, { id: 'b', optionId: 'flamer', count: 1, modeIds: {} }];
    const automatic = buildSquadScenario(applyCatalogEquipment(catalog, { ...base, squadEquipment: draft }, [review]));
    // Independently declare nine ordinary attacks, one two-shot damage-2 weapon and one variable D3 weapon.
    const manualWeapons = [['bolter-mode', 9], ['krak', 1], ['flamer-mode', 1]] as const;
    const manual = { ...automatic, weaponGroups: manualWeapons.map(([modeId, count]) => {
      const profile = resolveCatalogScenario(catalog, { ...base.catalogSelection!, modeId }, base).params;
      return buildCombatScenario({ ...profile, modelCount: count }).weapon;
    }) };
    const engine = new CalculateSquadCombatUseCase();
    expect(engine.execute(automatic)).toEqual(engine.execute(manual));
  });

  it('does not copy the enclosing equipment draft into individual weapon profiles', () => {
    const { catalog, review, base } = equipmentFixture();
    const draft = createCatalogEquipment(catalog, base, [review])!;
    const input = { ...base, squadEquipment: draft };
    expect(individualProfile(input).squadEquipment).toBeUndefined();
    expect(individualProfile(input).targetModelCount).toBeUndefined();
    expect(input.squadEquipment).toBe(draft);
    expect(input.targetModelCount).toBe(2);
  });
});
