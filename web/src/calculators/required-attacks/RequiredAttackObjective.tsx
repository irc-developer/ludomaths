import { InputField } from '../../components/InputField';
import { useNumberDrafts } from '../../components/NumberDrafts';
import { useCombatScenario } from '../combat/CombatScenarioContext';
import { SquadCounter } from '../combat/SquadScenarioControls';
import { scenarioInput, scenarioPanel } from '../combat/scenarioStyles';
import { s } from '../../i18n/scenario';
import type { CombatParams } from '../combat/presets';

export function RequiredAttackObjective({ params, squadMode }: { params: CombatParams; squadMode: boolean }) {
  const { setParams, successPercent, setSuccessPercent, setDraftInvalid } = useCombatScenario();
  const drafts = useNumberDrafts();
  const mixed = !!params.attackerEquipmentGroups?.length || !!params.primaryExtraWeapons?.length;
  return <>
    {squadMode && <div style={scenarioPanel}>
      <SquadCounter label={s('casualtyGoal')} value={params.casualtyGoal ?? params.targetModelCount ?? 1} max={params.targetModelCount ?? 1}
        onChange={value => setParams({ ...params, casualtyGoal: value })} />
      <label>{s('inverseUnit')}<select style={scenarioInput} value={mixed ? 'activations' : params.requiredSquadUnit ?? 'attacks'}
        onChange={event => setParams({ ...params, requiredSquadUnit: event.target.value as 'attacks' | 'models' | 'activations' })}>
        {!mixed && <><option value="attacks">{s('individualAttackUnit')}</option><option value="models">{s('modelUnit')}</option></>}
        <option value="activations">{s('activationUnit')}</option></select></label>
    </div>}
    <div style={scenarioPanel}>
      <InputField label={s('reliability')} value={successPercent} min={0.01} max={100} step={0.1} onChange={setSuccessPercent} onDraftValidityChange={setDraftInvalid} />
      <div className="entry-options">{[50, 75, 90, 95, 99].map(value => <button type="button" key={value} onClick={() => {
        drafts.clear(`attack/objective/${s('reliability')}`); setSuccessPercent(value);
      }} aria-pressed={successPercent === value}>{value}%</button>)}</div>
    </div>
  </>;
}
