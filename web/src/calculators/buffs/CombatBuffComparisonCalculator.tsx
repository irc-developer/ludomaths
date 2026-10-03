import { useState } from 'react';
import { InputField } from '../../components/InputField';
import { ResultBox } from '../../components/ResultBox';
import { SectionCard } from '../../components/SectionCard';
import { colors, sp } from '../../styles/tokens';
import { WH40K_PRESETS, type CombatParams } from '../combat/presets';
import { useCombatBuffComparison } from './useCombatBuffComparison';
import { RerollControls } from '../combat/RerollControls';
import { updateRerollSelection, type RerollSelection, type RerollStage } from '../combat/rerollPolicy';

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function fmt(value: number): string {
  return value.toFixed(2);
}

export function CombatBuffComparisonCalculator() {
  const [params, setParams] = useState<CombatParams>(WH40K_PRESETS[0].params);
  const [activePresetId, setActivePresetId] = useState(WH40K_PRESETS[0].id);
  const vm = useCombatBuffComparison(params);

  function loadPreset(id: string): void {
    const preset = WH40K_PRESETS.find(entry => entry.id === id);
    if (!preset) {
      return;
    }

    setActivePresetId(preset.id);
    setParams(preset.params);
  }

  function setField<K extends keyof CombatParams>(key: K, value: CombatParams[K]): void {
    setParams(prev => ({ ...prev, [key]: value }));
    setActivePresetId('custom');
  }

  function setReroll(stage: RerollStage, selection: RerollSelection, checked: boolean): void {
    setParams(prev => updateRerollSelection(prev, stage, selection, checked));
    setActivePresetId('custom');
  }

  const recommendationLabel =
    vm.recommendedOption === 'ballisticSkill'
      ? '+1 BS'
      : vm.recommendedOption === 'save'
        ? '+1 Salvación'
        : vm.recommendedOption === 'armorPenetration'
          ? '+1 FP'
          : vm.recommendedOption === 'damage'
            ? '+1 Daño'
        : 'Empate';

  return (
    <SectionCard
      title="Comparador WH40K — +1 BS / +1 Salvación / +1 FP / +1 Daño"
      formula={
        'Se compara el mismo perfil cinco veces:\n' +
        '  base\n' +
        '  +1 BS      => hitThreshold = max(2, BH - 1)\n' +
        '  +1 Salv.   => SA = max(2, SA - 1)\n' +
        '  +1 FP      => AP = AP + 1\n' +
        '  +1 Daño    => cada resultado de daño suma +1\n\n' +
        'Criterio principal: mayor daño esperado por ronda.\n' +
        'Desempate: menos rondas esperadas para matar.'
      }
      explanation={
        'Esta pestaña sirve para resolver breakpoints. +1 Salvación modela un objetivo más resistente y reduce el daño que le entra; ' +
        '+1 FP solo importa si empeora de verdad la salvación rival; +1 Daño solo importa si ya estás metiendo heridas con cierta regularidad. ' +
        'La comparación evita intuiciones engañosas y te dice qué buff mueve más el daño esperado en esa situación exacta.'
      }
    >
      <div style={{ marginBottom: sp.md }}>
        <div style={{ fontSize: '0.75rem', color: colors.muted, marginBottom: '0.5rem' }}>
          Presets de ejemplo
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {WH40K_PRESETS.map(preset => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset.id)}
                style={{
                  padding: '0.35rem 0.7rem',
                  borderRadius: 6,
                  border: `1px solid ${isActive ? colors.primary : colors.border}`,
                  background: isActive ? colors.primary : colors.surfaceAlt,
                  color: isActive ? colors.bg : colors.text,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: sp.lg,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'grid', gap: sp.lg }}>
          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Perfil atacante</div>
            <div style={fieldGridStyle}>
              <InputField label="Ataques" value={params.attacks} onChange={value => setField('attacks', Math.max(1, Math.round(value)))} min={1} />
              <InputField label="Impacta en" value={params.hitThreshold} onChange={value => setField('hitThreshold', Math.max(2, Math.min(6, Math.round(value))))} min={2} max={6} />
              <InputField label="Fuerza" value={params.strength} onChange={value => setField('strength', Math.max(1, Math.round(value)))} min={1} />
              <InputField label="FP" value={params.ap} onChange={value => setField('ap', Math.max(0, Math.round(value)))} min={0} />
              <InputField label={params.damageD6 ? 'Daño base (ignorado por D6)' : 'Daño fijo'} value={params.damage} onChange={value => setField('damage', Math.max(1, Math.round(value)))} min={1} />
              <InputField label="Bonus daño" value={params.damageBonus ?? 0} onChange={value => setField('damageBonus', Math.max(0, Math.round(value)))} min={0} />
              <InputField label="Sustained Hits" value={params.sustainedHits ?? 0} onChange={value => setField('sustainedHits', Math.max(0, Math.round(value)) || undefined)} min={0} />
              <InputField label="Mortales por impacto" value={params.mortalWoundsPerHit ?? 0} onChange={value => setField('mortalWoundsPerHit', Math.max(0, Math.round(value)) || undefined)} min={0} />
            </div>
            <div style={toggleGridStyle}>
              {renderCheckbox('Ataques D6', !!params.attacksD6, checked => setField('attacksD6', checked))}
              <RerollControls idPrefix="buffs" stage="hit" failures={params.hitRerollAll}
                nonSixes={params.hitRerollNonSixes} disabled={!!params.torrent}
                onChange={(selection, checked) => setReroll('hit', selection, checked)} />
              {renderCheckbox('1 impacto natural en 6', !!params.guaranteedHitSix, checked => setField('guaranteedHitSix', checked))}
              <RerollControls idPrefix="buffs" stage="wound" failures={params.woundRerollAll}
                nonSixes={params.woundRerollNonSixes}
                onChange={(selection, checked) => setReroll('wound', selection, checked)} />
              {renderCheckbox('1 herida natural en 6', !!params.guaranteedWoundSix, checked => setField('guaranteedWoundSix', checked))}
              {renderCheckbox('Daño D6', !!params.damageD6, checked => setField('damageD6', checked))}
              {renderCheckbox('1 daño fijo en 6', !!params.guaranteedDamageSix, checked => setField('guaranteedDamageSix', checked))}
              {renderCheckbox('Torrent', !!params.torrent, checked => setField('torrent', checked))}
              {renderCheckbox('Lethal Hits', !!params.lethalHits, checked => setField('lethalHits', checked))}
              {renderCheckbox('Devastating Wounds', !!params.devastatingWounds, checked => setField('devastatingWounds', checked))}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Objetivo</div>
            <div style={fieldGridStyle}>
              <InputField label="Resistencia" value={params.toughness} onChange={value => setField('toughness', Math.max(1, Math.round(value)))} min={1} />
              <InputField label="Heridas objetivo" value={params.targetWounds} onChange={value => setField('targetWounds', Math.max(1, Math.round(value)))} min={1} />
              <InputField label="Salvación" value={params.baseSave} onChange={value => setField('baseSave', Math.max(2, Math.min(6, Math.round(value))))} min={2} max={6} />
              <InputField label="Invulnerable (0 = no)" value={params.invulnerableSave ?? 0} onChange={value => setField('invulnerableSave', Math.max(0, Math.min(6, Math.round(value))) || undefined)} min={0} max={6} />
              <InputField label="FNP (0 = no)" value={params.fnpThreshold ?? 0} onChange={value => setField('fnpThreshold', Math.max(0, Math.min(6, Math.round(value))) || undefined)} min={0} max={6} />
            </div>
            <div style={toggleGridStyle}>
              {renderCheckbox('1 salvación fija en 6', !!params.guaranteedSaveSix, checked => setField('guaranteedSaveSix', checked))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: sp.md }}>
          <div style={{ ...panelStyle, borderColor: vm.error ? colors.error : colors.primary }}>
            <div style={sectionTitleStyle}>Recomendación</div>
            {vm.error ? (
              <div style={{ color: colors.error, fontSize: '0.9rem', lineHeight: 1.5 }}>{vm.error}</div>
            ) : (
              <>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.primaryLight, marginBottom: '0.35rem' }}>
                  {recommendationLabel}
                </div>
                <div style={{ fontSize: '0.82rem', color: colors.muted, lineHeight: 1.5 }}>
                  {vm.recommendedOption === 'equal'
                    ? 'En este caso ambos buffs producen prácticamente el mismo resultado.'
                    : 'La recomendación se basa primero en el daño esperado por ronda y, si empatan, en las rondas esperadas para matar.'}
                </div>
              </>
            )}
          </div>

          {!vm.error && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: sp.sm }}>
                <ResultBox label="Base E[Daño]" value={fmt(vm.baseline.expectedDamage)} />
                <ResultBox label="+1 BS E[Daño]" value={fmt(vm.plusBallisticSkill.expectedDamage)} highlight={vm.recommendedOption === 'ballisticSkill'} />
                <ResultBox label="+1 Salv. E[Daño]" value={fmt(vm.plusSave.expectedDamage)} highlight={vm.recommendedOption === 'save'} />
                <ResultBox label="+1 FP E[Daño]" value={fmt(vm.plusArmorPenetration.expectedDamage)} highlight={vm.recommendedOption === 'armorPenetration'} />
                <ResultBox label="+1 Daño E[Daño]" value={fmt(vm.plusDamage.expectedDamage)} highlight={vm.recommendedOption === 'damage'} />
              </div>

              <div style={{ display: 'grid', gap: sp.sm }}>
                {renderScenarioRow('Base', vm.baseline, vm.baseline, false)}
                {renderScenarioRow('+1 BS', vm.plusBallisticSkill, vm.baseline, vm.recommendedOption === 'ballisticSkill')}
                {renderScenarioRow('+1 Salvación', vm.plusSave, vm.baseline, vm.recommendedOption === 'save')}
                {renderScenarioRow('+1 FP', vm.plusArmorPenetration, vm.baseline, vm.recommendedOption === 'armorPenetration')}
                {renderScenarioRow('+1 Daño', vm.plusDamage, vm.baseline, vm.recommendedOption === 'damage')}
              </div>
            </>
          )}
        </div>
      </div>
    </SectionCard>
  );

  function renderCheckbox(label: string, checked: boolean, onChange: (checked: boolean) => void) {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: colors.muted }}>
        <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
        {label}
      </label>
    );
  }
}

function renderScenarioRow(
  label: string,
  scenario: {
    expectedDamage: number;
    expectedRoundsToKill: number;
    firstRoundKillProbability: number;
  },
  baseline: {
    expectedDamage: number;
    expectedRoundsToKill: number;
  },
  highlight: boolean,
) {
  return (
    <div
      style={{
        background: highlight ? 'rgba(129, 140, 248, 0.12)' : colors.surfaceAlt,
        border: `1px solid ${highlight ? colors.primary : colors.border}`,
        borderRadius: 10,
        padding: sp.md,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: sp.sm, alignItems: 'baseline', marginBottom: '0.5rem' }}>
        <strong style={{ color: highlight ? colors.primaryLight : colors.text }}>{label}</strong>
        <span style={{ color: colors.muted, fontSize: '0.8rem' }}>Kill T1: {pct(scenario.firstRoundKillProbability)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: sp.sm }}>
        <div style={{ fontSize: '0.82rem', color: colors.text }}>
          Daño esperado: <strong>{fmt(scenario.expectedDamage)}</strong>
          <div style={{ color: colors.muted }}>Delta: {formatSigned(scenario.expectedDamage - baseline.expectedDamage)}</div>
        </div>
        <div style={{ fontSize: '0.82rem', color: colors.text }}>
          Rondas esperadas: <strong>{fmt(scenario.expectedRoundsToKill)}</strong>
          <div style={{ color: colors.muted }}>Delta: {formatSigned(scenario.expectedRoundsToKill - baseline.expectedRoundsToKill)}</div>
        </div>
      </div>
    </div>
  );
}

function formatSigned(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}`;
}

const panelStyle = {
  background: colors.surfaceAlt,
  borderRadius: 12,
  padding: sp.md,
  border: `1px solid ${colors.border}`,
};

const sectionTitleStyle = {
  fontSize: '0.82rem',
  fontWeight: 700,
  color: colors.primaryLight,
  marginBottom: sp.sm,
};

const fieldGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: sp.sm,
  marginBottom: sp.sm,
};

const toggleGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: sp.xs,
};
