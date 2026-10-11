import { useId } from 'react';
import type { CombatScenarioInput } from '@application/dice/combatScenario';
import { applyCatalogEquipment, equipmentReview, equipmentSummary } from '@application/dice/catalogEquipment';
import type { CatalogEquipmentDraft } from '@domain/profiles/catalogEquipment';
import { useCatalog } from './CatalogContext';
import { NumberInput } from '../components/NumberInput';
import { useCombatScenario } from '../calculators/combat/CombatScenarioContext';
import { scenarioInput, scenarioPanel } from '../calculators/combat/scenarioStyles';
import { s } from '../i18n/scenario';

interface Props { params: CombatScenarioInput; onChange: (next: CombatScenarioInput) => void; participantsHelp?: string }
const summaryStyle = { width: '100%', overflowWrap: 'anywhere' } as const;
export function CatalogEquipmentPanel({ params, onChange, participantsHelp }: Props) {
  const { catalog } = useCatalog();
  const { setDraftInvalid } = useCombatScenario();
  const id = useId();
  const draft = params.squadEquipment;
  if (!catalog || !draft) return null;
  const review = equipmentReview(catalog, params.catalogSelection?.attackerUnitId);
  const weaponName = (weaponId: string) => catalog.weapons.find(w => w.id === weaponId)?.name ?? s('weapon');
  let resolved: CombatScenarioInput | undefined;
  let error = '';
  try { resolved = applyCatalogEquipment(catalog, params); }
  catch (failure) {
    const code = failure instanceof Error ? failure.message : '';
    error = s(code === 'EQUIPMENT_SHARED_LIMIT' ? 'equipmentSharedLimit' : code === 'EQUIPMENT_COUNTS' ? 'equipmentCountError' :
      code === 'CATALOG_TARGET_NOT_ELIGIBLE' ? 'modeTargetInvalid' : code === 'CATALOG_TARGET_CONTEXT_REQUIRED' ? 'modeTargetRequired' : 'equipmentUnavailable');
  }
  function update(nextDraft: CatalogEquipmentDraft, patch: Partial<CombatScenarioInput> = {}) {
    const next = { ...params, ...patch, squadEquipment: nextDraft };
    try { onChange(applyCatalogEquipment(catalog!, next)); }
    catch { onChange({ ...next, calculationBlocked: true }); }
  }
  const summary = resolved ? equipmentSummary(catalog, resolved) : [];
  return <fieldset style={scenarioPanel}><legend>{s('simpleEquipment')}</legend>
    <p className="scenario-caption">{s('equipmentInitialSize')}: {draft.initialModelCount} {s('modelsWord')}. {participantsHelp ?? s('equipmentSurvivorsHelp')}</p>
    <label>{s('type')}<select style={scenarioInput} value={params.attackType ?? 'ranged'}
      onChange={event => update(draft, { attackType: event.target.value as 'ranged' | 'melee', phase: undefined })}>
      <option value="ranged">{s('ranged')}</option><option value="melee">{s('melee')}</option>
    </select></label>
    {review && <>
      <p>{s('defaultEquipment')}: {review.defaultWeaponIds.map(weaponName).join(' + ')}
        {resolved && ` · ${(params.modelCount ?? draft.initialModelCount) - draft.rows.reduce((sum, row) => sum + row.count, 0)} ${s('modelsWord')}`}</p>
      <p className="scenario-caption">{s('equipmentSharedSlots')}: {Math.floor(draft.initialModelCount / review.modelsPerSpecial)}. {s('equipmentMeleeHelp')}</p>
      {draft.rows.map((row, index) => {
        const option = review.options.find(o => o.id === row.optionId);
        const changeRow = (patch: Partial<typeof row>) => update({ ...draft, rows: draft.rows.map(old => old.id === row.id ? { ...old, ...patch } : old) });
        return <fieldset key={row.id} style={scenarioPanel}><legend>{s('equipmentRow')} {index + 1}</legend>
          <div className="scenario-columns">
            <label>{s('equipmentAlternative')}<select style={scenarioInput} value={row.optionId}
              onChange={event => changeRow({ optionId: event.target.value, modeIds: {} })}>
              {review.options.map(o => <option key={o.id} value={o.id}>{o.weaponIds.map(weaponName).join(' + ')}</option>)}
            </select></label>
            <label htmlFor={`${id}-${row.id}`}>{s('equipmentCarriers')}
              <NumberInput id={`${id}-${row.id}`} draftKey={`carriers-${row.id}`} draftLabel={`${s('equipmentCarriers')} · ${s('equipmentRow')} ${index + 1}`} value={row.count} min={0} max={draft.initialModelCount - 1}
                onChange={count => changeRow({ count })} onDraftValidityChange={setDraftInvalid} />
            </label>
          </div>
          {option?.weaponIds.map(weaponId => {
            const modes = catalog.weaponModes.filter(m => m.weaponId === weaponId);
            if (modes.length <= 1) return null;
            return <label key={weaponId}>{weaponName(weaponId)} · {s('mode')}
              <select style={scenarioInput} value={row.modeIds[weaponId] ?? review.defaultModeIds[weaponId]}
                onChange={event => changeRow({ modeIds: { ...row.modeIds, [weaponId]: event.target.value } })}>
                {modes.map(mode => <option key={mode.id} value={mode.id}>{mode.name}</option>)}
              </select>
            </label>;
          })}
          <div className="entry-options"><button type="button" onClick={() => update({ ...draft, rows: draft.rows.filter(old => old.id !== row.id) })}>{s('removeEquipmentRow')}</button>
            {index > 0 && <button type="button" onClick={() => {
              const rows = [...draft.rows]; [rows[index - 1], rows[index]] = [rows[index], rows[index - 1]]; update({ ...draft, rows });
            }}>{s('earlier')}</button>}
          </div>
        </fieldset>;
      })}
      <div className="entry-options"><button type="button" disabled={draft.rows.length >= 12} onClick={() => {
        const option = review.options.find(o => !draft.rows.some(row => row.optionId === o.id)) ?? review.options[0];
        update({ ...draft, rows: [...draft.rows, { id: `${id}-${Date.now()}-${draft.rows.length}`, optionId: option.id, count: 0, modeIds: {} }] });
      }}>{s('anotherEquipment')}</button></div>
    </>}
    {error && <p className="scenario-error" role="alert">{error}</p>}
    {resolved && <table aria-label={s('equipmentSummary')} style={summaryStyle}>
      <caption>{s('equipmentSummary')}</caption><thead><tr><th scope="col">{s('weapon')}</th><th scope="col">{s('equipmentCarriers')}</th></tr></thead>
      <tbody>{summary.map(item => {
        const name = weaponName(item.weaponId), modeName = catalog.weaponModes.find(m => m.id === item.modeId)?.name;
        return <tr key={item.modeId}><td>{name}{modeName && modeName !== name && ` · ${modeName}`}</td><td>{item.count}</td></tr>;
      })}</tbody>
    </table>}
    <div className="entry-options"><button type="button" disabled={!resolved} onClick={() => onChange({ ...resolved!, squadEquipment: undefined })}>{s('manualEquipmentGroups')}</button></div>
  </fieldset>;
}
