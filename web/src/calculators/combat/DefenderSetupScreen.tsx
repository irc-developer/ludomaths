import { useId, useState } from 'react';
import { CatalogPanel } from '../../catalog/CatalogPanel';
import { useCatalog } from '../../catalog/CatalogContext';
import { InputField } from '../../components/InputField';
import { NumberDraftScope, useNumberDrafts } from '../../components/NumberDrafts';
import { useCombatScenario } from './CombatScenarioContext';
import { SquadCounter, SquadScenarioControls } from './SquadScenarioControls';
import { WizardScreen, type WizardError } from './WizardScreen';
import { resolveDefenderDraft, defenderErrors, validateReview } from './wizardValidation';
import { s, type ScenarioKey } from '../../i18n/scenario';
import type { CombatParams } from './presets';

export function DefenderSetupScreen({ mode = 'combat' }: { mode?: string }) {
  const { params: input, setParams, entryMode, setWizardStep, manualDefenderName, setManualDefenderName, woundedDefenderId, setWoundedDefenderId, reviewReturn, successPercent } = useCombatScenario();
  const { catalog, loading } = useCatalog();
  const drafts = useNumberDrafts();
  const id = useId(), [submitted, setSubmitted] = useState(0);
  const manual = entryMode === 'manual';
  let params = input, selectionValid = manual;
  try { params = resolveDefenderDraft(catalog, input); selectionValid = manual || !!input.catalogSelection?.defenderMiniatureId; }
  catch { selectionValid = false; }
  const errors: WizardError[] = [];
  if (!selectionValid) errors.push({ target: `${id}-selection`, message: s('wizardMissingDefender') });
  if (selectionValid) {
    errors.push(...defenderErrors(params).map(message => ({ target: `${id}-defenses`, message })));
    errors.push(...Object.entries(drafts.fields).filter(([key, field]) => key.startsWith('defender/') && field.invalid)
      .map(([, field]) => ({ target: field.id, message: `${field.label}: ${s('wizardCountError')}.` })));
  }
  const set = <K extends keyof CombatParams>(key: K, value: CombatParams[K]) => setParams({ ...params, [key]: value });
  const numeric = (key: keyof CombatParams, label: ScenarioKey, min: number, max: number, fallback = 0) =>
    <InputField label={s(label)} value={Number(params[key] ?? fallback)} min={min} max={max} onChange={value => set(key, value)} />;
  const optional = (key: 'invulnerableSave' | 'fnpThreshold', label: ScenarioKey) => <label>{s(label)}<select value={params[key] ?? ''}
    onChange={event => set(key, event.target.value ? Number(event.target.value) : undefined)}>
    <option value="">—</option>{[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}+</option>)}</select></label>;
  const groups = [{ id: 'primary', name: s('primaryDefender'), profile: params }, ...(params.defenderGroups ?? []).map((g, i) => ({
    id: g.id, name: `${s('defenderGroup')} ${i + 2}`, profile: g.profile }))];
  const wounded = woundedDefenderId ?? groups.find(g => g.profile.targetWounds < (g.profile.woundsMax ?? g.profile.targetWounds))?.id;
  const woundedGroup = groups.find(g => g.id === wounded) ?? groups[0];
  if (woundedDefenderId && woundedGroup.profile.targetWounds >= (woundedGroup.profile.woundsMax ?? woundedGroup.profile.targetWounds)) errors.push({
    target: `${id}-defenses`, message: s('wizardWoundsError'),
  });
  function changeWounded(next?: string) {
    for (const key of Object.keys(drafts.drafts)) if (key.startsWith('defender/') && (key.endsWith(`/${s('wounds')}`) || key.includes('/wounded-'))) drafts.clear(key);
    setWoundedDefenderId(next);
    const wounds = (p: CombatParams, groupId: string) => {
      const max = p.woundsMax ?? p.targetWounds;
      return { ...p, targetWounds: next === groupId ? Math.max(1, Math.min(p.targetWounds, max - 1)) : max };
    };
    setParams({ ...wounds(params, 'primary'), defenderGroups: params.defenderGroups?.map(g => ({ ...g, profile: wounds(g.profile, g.id) })) });
  }
  function updateWounds(value: number) {
    if (woundedGroup.id === 'primary') set('targetWounds', value);
    else setParams({ ...params, defenderGroups: params.defenderGroups?.map(g => g.id === woundedGroup.id ? { ...g, profile: { ...g.profile, targetWounds: value } } : g) });
  }
  return <NumberDraftScope name="defender" root><WizardScreen step={2} title={s('wizardDefenderTitle')} help={s('wizardDefenderHelp')}
    errors={errors} submitted={submitted} onBack={() => setWizardStep(1)} disabled={!manual && loading} action={s(reviewReturn ? 'wizardSaveReview' : 'wizardContinue')}
    onContinue={() => {
      setSubmitted(n => n + 1);
      if (!errors.length) {
        setParams(params);
        const review = reviewReturn ? validateReview(catalog, params, entryMode, mode, successPercent, undefined, woundedDefenderId) : undefined;
        const pendingAttack = Object.keys(drafts.pending).some(key => key.startsWith('attack/') && drafts.drafts[key] !== undefined && (mode === 'required' || !key.startsWith('attack/objective/')));
        setWizardStep(reviewReturn && !review?.issues.length && !pendingAttack ? 4 : 3);
      }
    }}>
    <div id={`${id}-selection`} tabIndex={-1}>
      {manual ? <label>{s('wizardDefenderName')}<input value={manualDefenderName} maxLength={100} onChange={event => setManualDefenderName(event.target.value)} /></label>
        : <CatalogPanel defenderStep params={input} onChange={next => { drafts.clear('defender/'); setWoundedDefenderId(undefined); setParams(next); }} />}
      {!!submitted && !selectionValid && <p className="scenario-error">{s('wizardMissingDefender')}</p>}
    </div>
    {selectionValid && <div id={`${id}-defenses`} tabIndex={-1} className="wizard-defenses">
      <SquadCounter label={s('defendingModels')} value={params.targetModelCount ?? 1} onChange={value => setParams({ ...params,
        targetModelCount: value, casualtyGoal: Math.min(params.casualtyGoal ?? value, value) })} />
      {manual && <fieldset><legend>{s('wizardDefenses')}</legend><div className="scenario-columns">
        {numeric('toughness', 'toughness', 1, 100)}{numeric('woundsMax', 'maxWounds', 1, 500, params.targetWounds)}{numeric('baseSave', 'save', 2, 6)}
        {optional('invulnerableSave', 'invul')}{optional('fnpThreshold', 'fnp')}
      </div></fieldset>}
      <div>{numeric('damageReduction', 'damageReduction', 0, 100)}
        <p className="scenario-caption">{s('damageReductionHelp')}</p></div>
      {(params.targetModelCount ?? 1) > 1 || params.defenderGroups?.length ? <fieldset><legend>{s('wounds')}</legend>
        <label className="touch-choice"><input type="checkbox" checked={!!wounded} onChange={event => changeWounded(event.target.checked ? 'primary' : undefined)} />{s('wizardWounded')}</label>
        <p className="scenario-caption">{s('wizardWoundedHelp')}</p>
        {wounded && <>
          <label>{s('wizardWoundedGroup')}<select value={woundedGroup.id} onChange={event => changeWounded(event.target.value)}>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
          <NumberDraftScope name={`wounded-${woundedGroup.id}`}><InputField label={s('wounds')} value={woundedGroup.profile.targetWounds} min={1}
            max={woundedGroup.profile.woundsMax ?? woundedGroup.profile.targetWounds} onChange={updateWounds} /></NumberDraftScope>
          <small>{s('maxWounds')}: {woundedGroup.profile.woundsMax ?? woundedGroup.profile.targetWounds}</small>
        </>}
      </fieldset> : <div>{numeric('targetWounds', 'wounds', 1, params.woundsMax ?? params.targetWounds)}
        <small>{s('maxWounds')}: {params.woundsMax ?? params.targetWounds}</small></div>}
      {!manual && <details className="wizard-characteristics"><summary>{s('wizardDefenses')}</summary>
        {groups.map(g => <p key={g.id}><strong>{g.name}</strong> · {s('toughness')}: {g.profile.toughness} · {s('save')}: {g.profile.baseSave}+ · {s('maxWounds')}: {g.profile.woundsMax}
          {g.profile.invulnerableSave !== undefined && ` · ${s('invul')}: ${g.profile.invulnerableSave}++`}
          {g.profile.fnpThreshold !== undefined && ` · FNP: ${g.profile.fnpThreshold}+`}</p>)}
      </details>}
      <SquadScenarioControls side="defender" params={params} onChange={setParams} />
    </div>}
  </WizardScreen></NumberDraftScope>;
}
