import { useState, type CSSProperties } from 'react';
import { InputField } from '../../components/InputField';
import { SectionCard } from '../../components/SectionCard';
import { ResultBox } from '../../components/ResultBox';
import { colors, sp } from '../../styles/tokens';
import { WH40K_PRESETS, type CombatParams } from '../combat/presets';
import { RerollControls } from '../combat/RerollControls';
import { updateRerollSelection, type RerollStage, type RerollSelection } from '../combat/rerollPolicy';
import { useRequiredAttacks, type RequiredAttacksParams } from './useRequiredAttacks';

function fromPreset(params: CombatParams, successPercent: number): RequiredAttacksParams {
  return { ...params, damageType: params.damageD6 ? 'D6' : 'fixed', successPercent };
}

function pct(probability: number): string {
  if (probability < 1 && probability * 100 > 99.9999) return '> 99,9999%';
  return `${(probability * 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`;
}

export function RequiredAttacksCalculator() {
  const [params, setParams] = useState<RequiredAttacksParams>(() => fromPreset(WH40K_PRESETS[0].params, 90));
  const [presetId, setPresetId] = useState(WH40K_PRESETS[0].id);
  const { result, error } = useRequiredAttacks(params);

  function setField<K extends keyof RequiredAttacksParams>(key: K, value: RequiredAttacksParams[K]) {
    setParams(previous => ({ ...previous, [key]: value }));
    if (key !== 'successPercent') setPresetId('custom');
  }

  function setReroll(stage: RerollStage, selection: RerollSelection, checked: boolean) {
    setParams(previous => updateRerollSelection(previous, stage, selection, checked));
    setPresetId('custom');
  }

  function numeric(key: 'strength' | 'damage' | 'damageBonus' | 'ap' | 'hitThreshold' | 'toughness' | 'targetWounds' | 'baseSave' | 'sustainedHits' | 'mortalWoundsPerHit', label: string, min: number, max: number) {
    return <InputField label={label} value={params[key] ?? 0} min={min} max={max}
      onChange={value => setField(key, Math.max(min, Math.min(max, Math.round(value))))} />;
  }

  function optionalSave(key: 'invulnerableSave' | 'fnpThreshold', label: string) {
    return (
      <label style={labelStyle}>
        {label}
        <select style={selectStyle} value={params[key] ?? 0} onChange={event => setField(key, Number(event.target.value) || undefined)}>
          <option value={0}>Sin {key === 'invulnerableSave' ? 'invulnerable' : 'No hay dolor'}</option>
          {[2, 3, 4, 5, 6].map(value => <option key={value} value={value}>{value}+</option>)}
        </select>
      </label>
    );
  }

  function toggle(key: 'torrent' | 'lethalHits' | 'devastatingWounds', label: string) {
    return <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center' }}>
      <input type="checkbox" checked={!!params[key]} onChange={event => setField(key, event.target.checked)} />{label}
    </label>;
  }

  return (
    <SectionCard title="Ataques necesarios WH40K"
      formula="El mínimo de ataques que alcanza tu porcentaje de eliminación."
      explanation="Introduce las características de una miniatura, el arma y la fiabilidad deseada. Calculamos la probabilidad de quitar todas sus heridas restantes, incluyendo impactar, herir, salvaciones y daño. Cada ataque usa el mismo perfil de arma; el resultado cuenta ataques individuales antes de tirar para impactar.">
      <label style={{ ...labelStyle, marginBottom: sp.lg }}>
        Ejemplo de arma y objetivo
        <select style={selectStyle} value={presetId} onChange={event => {
          const preset = WH40K_PRESETS.find(entry => entry.id === event.target.value);
          if (preset) {
            setParams(fromPreset(preset.params, params.successPercent));
            setPresetId(preset.id);
          }
        }}>
          <option value="custom" disabled>Personalizado</option>
          {WH40K_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
        </select>
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: sp.lg }}>
        <fieldset style={panelStyle}>
          <legend style={legendStyle}>Miniatura objetivo</legend>
          <div style={fieldGridStyle}>
            {numeric('toughness', 'Resistencia (R)', 1, 100)}
            {numeric('targetWounds', 'Heridas restantes', 1, 500)}
            {numeric('baseSave', 'Salvación (SA+)', 2, 6)}
            {optionalSave('invulnerableSave', 'Salvación invulnerable')}
            {optionalSave('fnpThreshold', 'No hay dolor (FNP)')}
          </div>
        </fieldset>
        <fieldset style={panelStyle}>
          <legend style={legendStyle}>Perfil del arma</legend>
          <div style={fieldGridStyle}>
            {numeric('hitThreshold', 'Impacta en (BH/HA+)', 2, 6)}
            {numeric('strength', 'Fuerza (F)', 1, 100)}
            {numeric('ap', 'FP (0 = sin FP; 2 = FP−2)', 0, 100)}
            <label style={labelStyle}>Tipo de daño
              <select style={selectStyle} value={params.damageType} onChange={event => setField('damageType', event.target.value as RequiredAttacksParams['damageType'])}>
                <option value="fixed">Fijo</option><option value="D3">D3</option><option value="D6">D6</option>
              </select>
            </label>
            {params.damageType === 'fixed' && numeric('damage', 'Daño fijo', 1, 50)}
            {numeric('damageBonus', 'Bonificador al daño', 0, 50)}
          </div>
          <div style={{ marginTop: sp.sm }}>{toggle('torrent', 'Torrent: impactos automáticos')}</div>
        </fieldset>
      </div>

      <details style={{ ...panelStyle, marginTop: sp.md }}>
        <summary style={{ color: colors.primaryLight, cursor: 'pointer' }}>Repeticiones y habilidades del arma</summary>
        <div style={{ ...fieldGridStyle, marginTop: sp.md }}>
          <RerollControls idPrefix="required-attacks" stage="hit" failures={params.hitRerollAll} nonSixes={params.hitRerollNonSixes} disabled={!!params.torrent}
            onChange={(selection, checked) => setReroll('hit', selection, checked)} />
          <RerollControls idPrefix="required-attacks" stage="wound" failures={params.woundRerollAll} nonSixes={params.woundRerollNonSixes}
            onChange={(selection, checked) => setReroll('wound', selection, checked)} />
          {numeric('sustainedHits', 'Impactos sostenidos', 0, 10)}
          {numeric('mortalWoundsPerHit', 'Mortales por impacto', 0, 100)}
          {toggle('lethalHits', 'Impactos letales')}
          {toggle('devastatingWounds', 'Heridas devastadoras')}
        </div>
        {params.torrent && <p style={captionStyle}>Torrent no tira para impactar: las repeticiones al impactar, impactos letales e impactos sostenidos no se activan.</p>}
      </details>

      <div style={{ ...panelStyle, marginTop: sp.lg }}>
        <InputField label="Fiabilidad deseada (%)" value={params.successPercent} min={0.01} max={100} step={0.1}
          onChange={value => setField('successPercent', value)} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.sm, marginTop: sp.sm }}>
          {[50, 75, 90, 95, 99].map(value => <button key={value} onClick={() => setField('successPercent', value)}
            style={{ ...selectStyle, width: 'auto', cursor: 'pointer', borderColor: params.successPercent === value ? colors.primary : colors.border }}>{value}%</button>)}
        </div>
      </div>

      <div role="status" aria-live="polite" style={{ ...panelStyle, marginTop: sp.lg, borderColor: error ? colors.error : colors.primary }}>
        {error ? <p style={{ color: colors.error }}>{error}</p> : result?.status === 'success' ? <>
          <p style={{ color: colors.primaryLight, fontSize: '1.2rem', lineHeight: 1.6, marginTop: 0 }}>
            Necesitas <strong>{result.attacks} {result.attacks === 1 ? 'ataque' : 'ataques'}</strong> para tener al menos un <strong>{params.successPercent.toLocaleString('es-ES')}%</strong> de fiabilidad para eliminarla.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: sp.md }}>
            <ResultBox label={`Con ${result.attacks} ${result.attacks === 1 ? 'ataque' : 'ataques'}`} value={pct(result.probability)} highlight />
            <ResultBox label={`Con ${result.attacks - 1} ${result.attacks - 1 === 1 ? 'ataque' : 'ataques'}`} value={pct(result.previousProbability)} />
          </div>
          <p style={captionStyle}>Con un ataque menos no alcanzas el porcentaje solicitado. La fiabilidad real puede superarlo porque los ataques se cuentan en números enteros.</p>
        </> : result?.status === 'limit' ? <>
          <p>No se alcanza el {params.successPercent}% dentro del límite de {result.attacks.toLocaleString('es-ES')} ataques.</p>
          <p style={captionStyle}>Con esa cantidad, la probabilidad de eliminarla es {pct(result.probability)}. Necesitarías más ataques o un arma más eficaz.</p>
        </> : result?.reason === 'noFiniteGuarantee' ?
          <p>No existe un número finito de ataques que garantice el 100% con este perfil: los ataques pueden no causar daño. Elige una fiabilidad inferior al 100%.</p> :
          <p>Este perfil no puede causar daño a la miniatura; no es posible eliminarla.</p>}
      </div>
      <p style={captionStyle}>Se calcula contra una sola miniatura, acumulando daño hasta quitar sus heridas restantes. Búsqueda de hasta 10.000 ataques; sin simulación aleatoria.</p>
    </SectionCard>
  );
}

const labelStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: colors.muted };
const selectStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.text, padding: '0.5rem 0.75rem', fontSize: '0.9rem' };
const panelStyle: CSSProperties = { minWidth: 0, margin: 0, padding: sp.md, border: `1px solid ${colors.border}`, borderRadius: 10, background: colors.surfaceAlt };
const legendStyle: CSSProperties = { color: colors.primaryLight, fontWeight: 600, fontSize: '0.9rem', padding: '0 0.4rem' };
const fieldGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: sp.md };
const captionStyle: CSSProperties = { color: colors.muted, fontSize: '0.8rem', lineHeight: 1.6 };
