import { useState } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { InputField } from '../../components/InputField';
import { ResultBox } from '../../components/ResultBox';
import { DistributionBar } from '../../components/DistributionBar';
import { WH40K_PRESETS } from './presets';
import type { CombatParams } from './presets';
import { useCombat } from './useCombat';
import { colors, sp } from '../../styles/tokens';

function pct(v: number): string { return (v * 100).toFixed(1) + '%'; }
function fmt(v: number): string { return v.toFixed(2); }

/**
 * Calculadora del pipeline de combate WH40K 10ª edición.
 *
 * OCP: para añadir nuevos presets basta con editar presets.ts.
 * Este componente no necesita modificarse.
 *
 * SRP: gestiona el estado de formulario + selección de preset.
 * El cálculo es responsabilidad de useCombat.
 */
export function CombatCalculator() {
  const [params, setParams] = useState<CombatParams>(WH40K_PRESETS[0].params);
  const [activePresetId, setActivePresetId] = useState(WH40K_PRESETS[0].id);

  const vm = useCombat(params);
  const activePreset = WH40K_PRESETS.find(p => p.id === activePresetId);

  function loadPreset(id: string): void {
    const preset = WH40K_PRESETS.find(p => p.id === id);
    if (!preset) return;
    setActivePresetId(preset.id);
    setParams(preset.params);
  }

  function setField<K extends keyof CombatParams>(key: K, value: CombatParams[K]): void {
    setParams(prev => ({ ...prev, [key]: value }));
    setActivePresetId('custom');
  }

  return (
    <SectionCard
      title="Combate Warhammer 40K — 10ª Edición"
      formula={
        'Pipeline (5 etapas):\n' +
        '  1. Impactar:   P(hit)   = P(D6 ≥ BH + mod)\n' +
        '  2. Herir:      P(wound) = P(D6 ≥ umbral(F, R))\n' +
        '  3. Salvar:     save_ef  = min(SA + FP, invul);  P(fail) = 1 − P(D6 ≥ save_ef)\n' +
        '  4. Daño:       D ~ dist(H + bonus)\n' +
        '  5. FNP:        cada punto de daño se niega con P(D6 ≥ FNP)'
      }
      explanation={
        'El daño pasa por cinco etapas en cadena. Habilidades especiales cortocircuitan etapas: ' +
        'Lethal Hits (6 al impactar = herida automática), ' +
        'Devastating Wounds (6 al herir = heridas mortales que ignoran la etapa 3), ' +
        'Sustained Hits X (6 al impactar = X impactos extra no críticos). ' +
        'La salvación invulnerable (++) ignora el FP — el pipeline elige la mejor opción entre SA+FP e invulnerable. ' +
        'El Feel No Pain se aplica a todo el daño recibido, incluidas heridas mortales. ' +
        'El bonificador al daño desplaza toda la distribución sumando una constante a cada tirada.'
      }
    >
      {/* Preset buttons */}
      <div style={{ marginBottom: sp.md }}>
        <div style={{ fontSize: '0.75rem', color: colors.muted, marginBottom: '0.5rem' }}>
          Presets de ejemplo
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.5rem' }}>
          {WH40K_PRESETS.map(p => {
            const isActive = activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => loadPreset(p.id)}
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
                {p.name}
              </button>
            );
          })}
        </div>
        {activePreset && (
          <p style={{ fontSize: '0.78rem', color: colors.muted, lineHeight: 1.5, margin: 0 }}>
            {activePreset.description}
            {activePreset.ability && (
              <>
                <br />
                <span style={{ color: colors.primary }}>{activePreset.ability}</span>
              </>
            )}
          </p>
        )}
      </div>

      {/* Inputs en dos columnas: arma | objetivo + habilidades */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: sp.lg,
          marginBottom: sp.md,
        }}
      >
        {/* Columna 1: perfil de arma */}
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: colors.primary,
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            Perfil de arma
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <InputField
              label={params.attacksD6 ? 'Ataques (A) — usando D6' : 'Ataques fijos (A)'}
              value={params.attacks}
              onChange={v => setField('attacks', Math.max(1, Math.round(v)))}
              min={1}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="attacksD6"
                checked={!!params.attacksD6}
                onChange={e => setField('attacksD6', e.target.checked)}
              />
              <label htmlFor="attacksD6" style={{ fontSize: '0.75rem', color: colors.muted }}>
                Ataques variables D6
              </label>
            </div>
            <InputField
              label={params.torrent ? 'Impactar (BH) — ignorado: Torrent' : 'Impactar (BH, ej: 3 = 3+)'}
              value={params.hitThreshold}
              onChange={v => setField('hitThreshold', Math.min(6, Math.max(2, Math.round(v))))}
              min={2}
              max={6}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="torrent"
                checked={!!params.torrent}
                onChange={e => setField('torrent', e.target.checked)}
              />
              <label htmlFor="torrent" style={{ fontSize: '0.75rem', color: colors.muted }}>
                Torrent (impactos automáticos)
              </label>
            </div>
            <InputField
              label="Fuerza (F)"
              value={params.strength}
              onChange={v => setField('strength', Math.max(1, Math.round(v)))}
              min={1}
            />
            <InputField
              label="Penetración de armadura (FP)"
              value={params.ap}
              onChange={v => setField('ap', Math.max(0, Math.round(v)))}
              min={0}
            />
            <InputField
              label={params.damageD6 ? 'Daño (H) — usando D6' : 'Daño fijo (H)'}
              value={params.damage}
              onChange={v => setField('damage', Math.max(1, Math.round(v)))}
              min={1}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="damageD6"
                checked={!!params.damageD6}
                onChange={e => setField('damageD6', e.target.checked)}
              />
              <label htmlFor="damageD6" style={{ fontSize: '0.75rem', color: colors.muted }}>
                Daño variable D6
              </label>
            </div>
            <InputField
              label="Bonificador al daño (+X)"
              value={params.damageBonus ?? 0}
              onChange={v => setField('damageBonus', Math.max(0, Math.round(v)))}
              min={0}
            />
          </div>
        </div>

        {/* Columna 2: objetivo + habilidades */}
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: colors.primary,
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            Objetivo
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <InputField
              label="Resistencia (R)"
              value={params.toughness}
              onChange={v => setField('toughness', Math.max(1, Math.round(v)))}
              min={1}
            />
            <InputField
              label="Heridas del objetivo (W)"
              value={params.targetWounds}
              onChange={v => setField('targetWounds', Math.max(1, Math.round(v)))}
              min={1}
            />
            <InputField
              label="Salvación base (SA, ej: 3 = 3+)"
              value={params.baseSave}
              onChange={v => setField('baseSave', Math.min(7, Math.max(2, Math.round(v))))}
              min={2}
              max={7}
            />
            {/* Salvación invulnerable */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="checkbox"
                id="invulnEnabled"
                checked={params.invulnerableSave !== undefined}
                onChange={e => setField('invulnerableSave', e.target.checked ? 4 : undefined)}
              />
              <label htmlFor="invulnEnabled" style={{ fontSize: '0.72rem', color: colors.muted }}>
                Salvación invulnerable (++)
              </label>
              {params.invulnerableSave !== undefined && (
                <input
                  type="number"
                  min={2}
                  max={6}
                  value={params.invulnerableSave}
                  onChange={e => setField('invulnerableSave', Math.min(6, Math.max(2, parseInt(e.target.value) || 4)))}
                  style={{
                    width: 48,
                    background: colors.surfaceAlt,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 4,
                    color: colors.text,
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.9rem',
                  }}
                />
              )}
            </div>
            {/* Feel No Pain */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="checkbox"
                id="fnpEnabled"
                checked={params.fnpThreshold !== undefined}
                onChange={e => setField('fnpThreshold', e.target.checked ? 5 : undefined)}
              />
              <label htmlFor="fnpEnabled" style={{ fontSize: '0.72rem', color: colors.muted }}>
                Feel No Pain (FNP)
              </label>
              {params.fnpThreshold !== undefined && (
                <input
                  type="number"
                  min={3}
                  max={6}
                  value={params.fnpThreshold}
                  onChange={e => setField('fnpThreshold', Math.min(6, Math.max(3, parseInt(e.target.value) || 5)))}
                  style={{
                    width: 48,
                    background: colors.surfaceAlt,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 4,
                    color: colors.text,
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.9rem',
                  }}
                />
              )}
            </div>
          </div>

          <div
            style={{
              fontSize: '0.75rem',
              color: colors.primary,
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            Habilidades especiales
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="lethalHits"
                checked={!!params.lethalHits}
                onChange={e => setField('lethalHits', e.target.checked)}
              />
              <label htmlFor="lethalHits" style={{ fontSize: '0.72rem', color: colors.muted }}>
                Lethal Hits (6 al impactar = herida automática)
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="devastatingWounds"
                checked={!!params.devastatingWounds}
                onChange={e => setField('devastatingWounds', e.target.checked)}
              />
              <label htmlFor="devastatingWounds" style={{ fontSize: '0.72rem', color: colors.muted }}>
                Devastating Wounds (6 al herir = heridas mortales)
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="checkbox"
                id="sustainedEnabled"
                checked={!!params.sustainedHits}
                onChange={e => setField('sustainedHits', e.target.checked ? 1 : undefined)}
              />
              <label htmlFor="sustainedEnabled" style={{ fontSize: '0.72rem', color: colors.muted }}>
                Sustained Hits
              </label>
              {!!params.sustainedHits && (
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={params.sustainedHits}
                  onChange={e => setField('sustainedHits', Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: 48,
                    background: colors.surfaceAlt,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 4,
                    color: colors.text,
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.9rem',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {vm.error ? (
        <div style={{ color: colors.error, fontSize: '0.8rem' }}>{vm.error}</div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              marginBottom: sp.md,
            }}
          >
            <ResultBox label={`P(eliminar objetivo de ${params.targetWounds}W)`} value={pct(vm.pEliminate)} highlight />
            <ResultBox label="Daño más probable" value={String(vm.mostLikelyDamage)} />
            <ResultBox label="Daño mediano" value={String(vm.medianDamage)} />
            <ResultBox label="Rango central (Q1–Q3)" value={`${vm.centralRange.low}–${vm.centralRange.high}`} />
            <ResultBox label="Daño esperado E[D]" value={fmt(vm.expectedDamage)} />
            <ResultBox label="P(≥ 1 herida)" value={pct(vm.pAtLeastOne)} />
          </div>
          <DistributionBar
            entries={vm.distribution}
            title="Distribución completa de daño total entero"
          />
        </>
      )}
    </SectionCard>
  );
}
