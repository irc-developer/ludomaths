import { useState } from 'react';
import { useCatalog } from './CatalogContext';
import { resolveCatalogScenario, type CatalogSelection } from '@application/dice/catalogScenario';
import type { CombatScenarioInput } from '@application/dice/combatScenario';
import { scenarioInput, scenarioPanel } from '../calculators/combat/scenarioStyles';
import { useCombatScenario } from '../calculators/combat/CombatScenarioContext';
import { UnitSearch } from './UnitSearch';
import { catalogOmissions } from './catalogReview';
import { s } from '../i18n/scenario';
import { applyCatalogComposition } from '@application/dice/catalogComposition';
import { equipmentReview } from '@application/dice/catalogEquipment';
import { AttackerCatalogFields } from './AttackerCatalogFields';

interface Props { params: CombatScenarioInput; onChange: (params: CombatScenarioInput) => void; attackerStep?: boolean; defenderStep?: boolean; attackStep?: boolean }
export function CatalogPanel({ params, onChange, attackerStep = false, defenderStep = false, attackStep = false }: Props) {
  const { catalog, error, loading, storageNotice } = useCatalog();
  const { entryMode } = useCombatScenario();
  const selection = params.catalogSelection;
  const [compositionError, setCompositionError] = useState('');
  const options = catalog?.units.map(unit => ({ id: unit.id, name: unit.name,
    detail: unit.factionIds.map(id => catalog.factions.find(faction => faction.id === id)?.name).filter(Boolean).join(' · ') })) ?? [];
  const variants = (unitId?: string) => catalog?.miniatures.filter(miniature => miniature.unitId === unitId) ?? [];
  function modes(miniatureId?: string) {
    const weaponIds = catalog?.equipmentChoices.filter(choice => choice.miniatureId === miniatureId).flatMap(choice => choice.weaponIds) ?? [];
    return catalog?.weaponModes.filter(mode => weaponIds.includes(mode.weaponId)) ?? [];
  }
  const modeName = (mode: { weaponId: string; name: string }) =>
    [catalog?.weapons.find(weapon => weapon.id === mode.weaponId)?.name, mode.name].filter(Boolean).join(' · ');
  let review;
  let selectionIssue = '';
  if (catalog && selection) {
    try { review = resolveCatalogScenario(catalog, selection, params); }
    catch (failure) {
      const code = failure instanceof Error ? failure.message : '';
      selectionIssue = s(code === 'CATALOG_TARGET_CONTEXT_REQUIRED' ? 'modeTargetRequired' :
        code === 'CATALOG_TARGET_NOT_ELIGIBLE' ? 'modeTargetInvalid' : 'selectionInvalid');
    }
  }
  function update(patch: Partial<CatalogSelection>, side: 'attacker' | 'defender', source = params) {
    if (!catalog) return;
    setCompositionError('');
    const same = selection?.catalogId === catalog.catalogId && selection.catalogVersion === catalog.catalogVersion && selection.payloadSha256 === catalog.payloadSha256;
    const nextSelection: CatalogSelection = { ...(same ? selection : {}), catalogId: catalog.catalogId,
      catalogVersion: catalog.catalogVersion, payloadSha256: catalog.payloadSha256, ...patch };
    const target = catalog.miniatures.find(miniature => miniature.id === nextSelection.defenderMiniatureId);
    const changedTarget = side === 'defender' && selection?.defenderMiniatureId !== nextSelection.defenderMiniatureId;
    const remaining = changedTarget && typeof target?.characteristics.woundsMax.normalized === 'number'
      ? target.characteristics.woundsMax.normalized : params.targetWounds;
    const unitChanged = side === 'attacker' ? selection?.attackerUnitId !== nextSelection.attackerUnitId : selection?.defenderUnitId !== nextSelection.defenderUnitId;
    if (unitChanged) {
      if (side === 'attacker') nextSelection.attackerCompositionId = undefined;
      else nextSelection.defenderCompositionId = undefined;
    }
    const base = { ...source, targetWounds: remaining, partialCalculation: false,
      ...(unitChanged ? side === 'attacker' ? { squadEquipment: undefined, attackerEquipmentGroups: [], primaryExtraWeapons: [] } : { defenderGroups: [], primaryIsCharacter: false, ...(defenderStep ? { targetModelCount: 1, casualtyGoal: 1 } : {}) } : {}),
      ...(side === 'attacker' ? { damageBonus: 0, hitModifier: 0, woundModifier: 0, hitRerollAll: false,
        hitRerollNonSixes: false, woundRerollAll: false, woundRerollNonSixes: false,
        phase: undefined, withinHalfRange: undefined, engaged: undefined, setUpThisTurn: undefined, movedOverThree: undefined } : {}) };
    try {
      const next = resolveCatalogScenario(catalog, defenderStep ? { ...nextSelection, modeId: undefined } : nextSelection, base);
      const omitted = catalogOmissions(next);
      onChange({ ...next.params, catalogSelection: nextSelection, partialCalculation: omitted.length > 0,
        calculationBlocked: !nextSelection.modeId || !nextSelection.defenderMiniatureId,
        calculationLimitations: omitted.map(rule => `${rule.name}: ${rule.description}`) });
    } catch {
      // Keep invalid drafts visible and pending, so changing the opposite side can resolve them.
      onChange({ ...base, catalogSelection: nextSelection, calculationBlocked: true, calculationLimitations: [] });
    }
  }
  function chooseUnit(side: 'attacker' | 'defender', unitId: string) {
    setCompositionError('');
    const miniatures = variants(unitId);
    const miniatureId = miniatures.length === 1 ? miniatures[0].id : undefined;
    const available = modes(miniatureId);
    const patch = side === 'attacker' ? { attackerUnitId: unitId, attackerMiniatureId: miniatureId, modeId: available.length === 1 ? available[0].id : undefined }
      : { defenderUnitId: unitId, defenderMiniatureId: miniatureId };
    const compositions = catalog?.compositions.filter(c => c.unitId === unitId && !c.conditionRuleIds.length) ?? [];
    const automatic = compositions.length === 1 ? compositions[0] : catalog && side === 'attacker' && equipmentReview(catalog, unitId)
      ? compositions.find(c => c.isDefault) : undefined;
    if (catalog && automatic) {
      const nextSelection = { ...selection, catalogId: catalog.catalogId, catalogVersion: catalog.catalogVersion, payloadSha256: catalog.payloadSha256, ...patch };
      const base = { ...params, catalogSelection: nextSelection,
        ...(side === 'attacker' ? { damageBonus: 0, hitModifier: 0, woundModifier: 0, hitRerollAll: false,
          hitRerollNonSixes: false, woundRerollAll: false, woundRerollNonSixes: false,
          phase: undefined, withinHalfRange: undefined, engaged: undefined, setUpThisTurn: undefined, movedOverThree: undefined } : {}) };
      try { onChange(applyCatalogComposition(catalog, base, side, automatic.id, { deferEquipment: attackerStep })); return; }
      catch { /* An incomplete composition leaves the regular profile selection available. */ }
    }
    update(patch, side);
  }
  const omitted = review ? catalogOmissions(review) : [];
  if (attackStep) {
    const available = modes(selection?.attackerMiniatureId).filter(m => m.type === (params.attackType ?? 'ranged'));
    return <div className="catalog-panel">
      {!params.squadEquipment && <label>{s('mode')}<select style={scenarioInput} value={available.some(m => m.id === selection?.modeId) ? selection?.modeId ?? '' : ''}
        onChange={event => update({ modeId: event.target.value || undefined }, 'attacker')}>
        <option value="">{s('select')}</option>{available.map(m => <option key={m.id} value={m.id}>{modeName(m)}</option>)}
      </select></label>}
      {!params.squadEquipment && available.length === 0 && <p className="scenario-error">{s('noWeapons')}</p>}
      {selectionIssue && <p className="scenario-error" role="alert">{selectionIssue}</p>}
    </div>;
  }
  if (defenderStep) return <div className="catalog-panel">
    {loading && <p role="status">{s('catalogLoading')}</p>}
    {!catalog && !loading && <p className="scenario-caption">{s('noCatalog')}</p>}
    {catalog && <AttackerCatalogFields side="defender" catalog={catalog} params={params}
      onChooseUnit={id => chooseUnit('defender', id)}
      onComposition={id => {
        setCompositionError('');
        try { onChange(applyCatalogComposition(catalog, params, 'defender', id)); }
        catch { setCompositionError(s('compositionFailed')); }
      }}
      onMiniature={id => update({ defenderMiniatureId: id || undefined }, 'defender')}
      onIndividualProfile={() => update({ defenderCompositionId: undefined }, 'defender',
        { ...params, defenderGroups: [], primaryIsCharacter: false, targetModelCount: 1 })} />}
    {compositionError && <p role="alert" className="scenario-error">{compositionError}</p>}
    {storageNotice && <p role="status">{storageNotice}</p>}
    {error && <p role="alert" className="scenario-error">{error}</p>}
  </div>;
  if (attackerStep) return <div className="catalog-panel">
    {loading && <p role="status">{s('catalogLoading')}</p>}
    {!catalog && !loading && <p className="scenario-caption">{s('noCatalog')}</p>}
    {catalog && <AttackerCatalogFields catalog={catalog} params={params}
      onChooseUnit={id => chooseUnit('attacker', id)}
      onComposition={id => {
        setCompositionError('');
        try { onChange(applyCatalogComposition(catalog, params, 'attacker', id, { deferEquipment: true })); }
        catch { setCompositionError(s('compositionFailed')); }
      }}
      onMiniature={id => {
        const available = modes(id);
        update({ attackerMiniatureId: id || undefined, modeId: available.length === 1 ? available[0].id : undefined }, 'attacker');
      }}
      onIndividualProfile={() => update({ attackerCompositionId: undefined, modeId: undefined }, 'attacker',
        { ...params, squadEquipment: undefined, primaryExtraWeapons: [], attackerEquipmentGroups: [], modelCount: 1 })} />}
    {compositionError && <p role="alert" className="scenario-error">{compositionError}</p>}
    {storageNotice && <p role="status">{storageNotice}</p>}
    {error && <p role="alert" className="scenario-error">{error}</p>}
  </div>;
  return <div className="catalog-panel">
    {entryMode === 'catalog' && <>
      {loading && <p role="status">{s('catalogLoading')}</p>}
      {!catalog && !loading && <p>{s('noCatalog')}</p>}
      {catalog && <div className="scenario-columns">
        {(['attacker', 'defender'] as const).map(side => {
          const unitId = side === 'attacker' ? selection?.attackerUnitId : selection?.defenderUnitId;
          const miniatureId = side === 'attacker' ? selection?.attackerMiniatureId : selection?.defenderMiniatureId;
          const availableVariants = variants(unitId);
          const availableModes = modes(miniatureId);
          const compositions = catalog.compositions.filter(c => c.unitId === unitId && !c.conditionRuleIds.length);
          const appliedComposition = side === 'attacker' ? selection?.attackerCompositionId : selection?.defenderCompositionId;
          const compositionSelected = compositions.some(c => c.id === appliedComposition);
          return <fieldset key={side} style={scenarioPanel}><legend>{s(side)}</legend>
            <UnitSearch label={s(side === 'attacker' ? 'searchAttacker' : 'searchDefender')}
              options={options} selectedId={unitId} onSelect={value => chooseUnit(side, value)} />
            {compositions.length > 0 && <label>{s(side)} · {s('applyComposition')}<select style={scenarioInput} value={compositionSelected ? appliedComposition : ''}
              onChange={event => { if (!event.target.value) return; setCompositionError('');
                try { onChange(applyCatalogComposition(catalog, params, side, event.target.value)); }
                catch { setCompositionError(s('compositionFailed')); } }}>
              <option value="" disabled>{s('select')}</option>{compositions.map(c => <option key={c.id} value={c.id}>{c.members.map(m =>
                `${m.min === m.max ? m.min : m.min + '–' + m.max} ${catalog.miniatures.find(v => v.id === m.miniatureId)?.name ?? s('modelsWord')}`).join(' + ')}</option>)}</select></label>}
            {compositionSelected && <p role="status" className="scenario-caption">{s('compositionApplied')}</p>}
            {!(side === 'attacker' && params.squadEquipment) && (availableVariants.length > 1 ? <label>{s(side)} · {s('miniature')}
              <select style={scenarioInput} value={miniatureId ?? ''} onChange={event => {
                const nextModes = modes(event.target.value);
                update(side === 'attacker' ? { attackerMiniatureId: event.target.value,
                  modeId: nextModes.length === 1 ? nextModes[0].id : undefined } : { defenderMiniatureId: event.target.value }, side);
              }}><option value="">{s('select')}</option>{availableVariants.map(miniature => <option key={miniature.id} value={miniature.id}>{miniature.name}</option>)}</select>
            </label> : miniatureId && <p>{availableVariants.find(miniature => miniature.id === miniatureId)?.name}</p>)}
            {side === 'attacker' && !params.squadEquipment && miniatureId && (availableModes.length === 0 ? <p>{s('noWeapons')}</p> : availableModes.length === 1 ? <p>{modeName(availableModes[0])}</p> :
              <label>{s('mode')}<select style={scenarioInput} value={selection?.modeId ?? ''}
                onChange={event => update({ modeId: event.target.value || undefined }, side)}>
                <option value="">{s('select')}</option>{availableModes.map(mode => <option key={mode.id} value={mode.id}>{modeName(mode)}</option>)}
              </select></label>)}
          </fieldset>;
        })}
      </div>}
      {selectionIssue && <p role="alert" className="scenario-error">{selectionIssue}</p>}
      {compositionError && <p role="alert" className="scenario-error">{compositionError}</p>}
      {omitted.length > 0 && <div className="scope-notice">
        <p>{s('profilePartialNotice')}</p>
        <details><summary>{s('pendingDetails')}</summary><ul>{omitted.map(rule => <li key={rule.id}>{rule.name}: {rule.description}</li>)}</ul></details>
      </div>}
    </>}
    {storageNotice && <p role="status">{storageNotice}</p>}
    {error && <p role="alert" className="scenario-error">{error}</p>}
  </div>;
}
