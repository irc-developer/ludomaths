import { useEffect, useRef, useState } from 'react';
import type { ProfileCatalog } from '@domain/profiles/catalog';
import type { CombatScenarioInput } from '@application/dice/combatScenario';
import { equipmentReview } from '@application/dice/catalogEquipment';
import { UnitSearch } from './UnitSearch';
import { s } from '../i18n/scenario';

interface Props {
  catalog: ProfileCatalog;
  params: CombatScenarioInput;
  onChooseUnit: (id: string) => void;
  onComposition: (id: string) => void;
  onMiniature: (id: string) => void;
  onIndividualProfile: () => void;
  side?: 'attacker' | 'defender';
}

/** Identity and composition only; weapon choices belong to the later attack screen. */
export function AttackerCatalogFields({ catalog, params, onChooseUnit, onComposition, onMiniature, onIndividualProfile, side = 'attacker' }: Props) {
  const selection = params.catalogSelection;
  const unit = catalog.units.find(u => u.id === (side === 'attacker' ? selection?.attackerUnitId : selection?.defenderUnitId));
  const variants = catalog.miniatures.filter(m => m.unitId === unit?.id);
  const compositions = catalog.compositions.filter(c => c.unitId === unit?.id && !c.conditionRuleIds.length);
  const composition = compositions.find(c => c.id === (side === 'attacker' ? selection?.attackerCompositionId : selection?.defenderCompositionId));
  const miniature = variants.find(m => m.id === (side === 'attacker' ? selection?.attackerMiniatureId : selection?.defenderMiniatureId));
  const [changing, setChanging] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (changing) searchRef.current?.querySelector('input')?.focus();
    else if (unit) unitRef.current?.focus();
  }, [changing, unit?.id]);
  const review = equipmentReview(catalog, unit?.id);
  return <div className="attacker-catalog-fields">
    {(!unit || changing) && <div ref={searchRef}>
      <UnitSearch label={s(side === 'attacker' ? 'searchAttacker' : 'searchDefender')} selectedId={unit?.id}
        options={catalog.units.map(u => ({ id: u.id, name: u.name,
          detail: u.factionIds.map(id => catalog.factions.find(f => f.id === id)?.name).filter(Boolean).join(' · ') }))}
        onSelect={id => { onChooseUnit(id); setChanging(false); }} />
      {unit && <button type="button" className="wizard-text-button" onClick={() => setChanging(false)}>{s('wizardCancelSearch')}</button>}
    </div>}
    {unit && <>
      <div className="wizard-unit-card">
        <div><p className="wizard-eyebrow">{unit.factionIds.map(id => catalog.factions.find(f => f.id === id)?.name).filter(Boolean).join(' · ')}</p>
          <h3 ref={unitRef} tabIndex={-1}>{unit.name}</h3></div>
        <button type="button" className="wizard-text-button" onClick={() => setChanging(true)}>{s('wizardChangeUnit')}</button>
      </div>
      {compositions.length > 0 && <label>{s('wizardComposition')}
        <select aria-label={`${s(side)} · ${s('applyComposition')}`} value={composition?.id ?? ''}
          onChange={event => { if (event.target.value) onComposition(event.target.value); }}>
          <option value="" disabled>{s('select')}</option>
          {compositions.map(c => <option key={c.id} value={c.id}>{c.members.map(m =>
            `${m.min === m.max ? m.min : `${m.min}–${m.max}`} ${catalog.miniatures.find(v => v.id === m.miniatureId)?.name ?? s('modelsWord')}`).join(' + ')}</option>)}
        </select>
      </label>}
      {composition ? <>
        <p className="scenario-caption">{s(side === 'defender' ? 'wizardDefenderCompositionHelp' : 'wizardCompositionHelp')}</p>
        <button type="button" className="wizard-text-button" onClick={onIndividualProfile}>{s('wizardIndividualProfile')}</button>
      </> : variants.length > 1 ? <label>{s('miniature')}
        <select value={miniature?.id ?? ''} onChange={event => onMiniature(event.target.value)}>
          <option value="">{s('select')}</option>{variants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label> : miniature && <p className="wizard-profile-name">{miniature.name}</p>}
      {side === 'attacker' && review && composition && <p className="wizard-default-equipment"><strong>{s('defaultEquipment')}</strong><br />
        {review.defaultWeaponIds.map(id => catalog.weapons.find(w => w.id === id)?.name).filter(Boolean).join(' + ')}
      </p>}
      {side === 'attacker' && <details className="wizard-characteristics"><summary>{s('characteristics')}</summary>
        <ul>{(composition ? composition.members.map(m => variants.find(v => v.id === m.miniatureId)) : [miniature]).map(m => m && <li key={m.id}>
          <strong>{m.name}</strong> · {s('toughness')}: {m.characteristics.toughness.raw ?? '—'} · {s('save')}: {m.characteristics.save.raw ?? '—'} · {s('maxWounds')}: {m.characteristics.woundsMax.raw ?? '—'}
        </li>)}</ul>
      </details>}
    </>}
  </div>;
}
