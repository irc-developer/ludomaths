import { useRef, useState } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { InputField } from '../../components/InputField';
import { ResultBox } from '../../components/ResultBox';
import { DistributionBar } from '../../components/DistributionBar';
import { WH40K_PRESETS } from './presets';
import type { CombatParams } from './presets';
import { useCombat } from './useCombat';
import { buildCombatShareContent, formatCombatShareText } from './share';
import { buildCombatShareSvg, copyCombatShareImage, isCombatShareImageSupported } from './shareImage';
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
  const [copyStatus, setCopyStatus] = useState<'idle' | 'text' | 'image' | 'fallback' | 'manual'>('idle');
  const shareTextareaRef = useRef<HTMLTextAreaElement>(null);

  const vm = useCombat(params);
  const activePreset = WH40K_PRESETS.find(p => p.id === activePresetId);
  const sharePayload = {
    params,
    vm,
    presetName: activePresetId === 'custom' ? undefined : activePreset?.name,
  };
  const shareText = vm.error ? '' : formatCombatShareText(sharePayload);
  const shareContent = vm.error ? null : buildCombatShareContent(sharePayload);
  const shareContextSections = shareContent?.sections.filter(
    section => section.title === 'PERFIL' || section.title === 'OBJETIVO' || section.title === 'REGLAS',
  ) ?? [];
  const shareImageUrl = vm.error
    ? ''
    : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildCombatShareSvg(sharePayload))}`;
  const canCopyImage = isCombatShareImageSupported();

  function loadPreset(id: string): void {
    const preset = WH40K_PRESETS.find(p => p.id === id);
    if (!preset) return;
    setActivePresetId(preset.id);
    setParams(preset.params);
  }

  function setField<K extends keyof CombatParams>(key: K, value: CombatParams[K]): void {
    setParams(prev => ({ ...prev, [key]: value }));
    setActivePresetId('custom');
    setCopyStatus('idle');
  }

  async function copyShareText(nextStatus: 'text' | 'fallback' = 'text'): Promise<void> {
    if (!shareText) return;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopyStatus(nextStatus);
      return;
    } catch {
      setCopyStatus('manual');
      requestAnimationFrame(() => {
        shareTextareaRef.current?.focus();
        shareTextareaRef.current?.select();
      });
    }
  }

  async function copyShareCard(): Promise<void> {
    if (!shareText) return;

    const result = await copyCombatShareImage(sharePayload);
    if (result === 'copied') {
      setCopyStatus('image');
      return;
    }

    await copyShareText('fallback');
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
                id="hitRerollAll"
                checked={!!params.hitRerollAll}
                onChange={e => setField('hitRerollAll', e.target.checked)}
              />
              <label htmlFor="hitRerollAll" style={{ fontSize: '0.75rem', color: colors.muted }}>
                Repetir todos los fallos para impactar
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="guaranteedHitSix"
                checked={!!params.guaranteedHitSix}
                onChange={e => setField('guaranteedHitSix', e.target.checked)}
              />
              <label htmlFor="guaranteedHitSix" style={{ fontSize: '0.75rem', color: colors.muted }}>
                1 dado de impactar fijo en 6 natural
              </label>
            </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="woundRerollAll"
                checked={!!params.woundRerollAll}
                onChange={e => setField('woundRerollAll', e.target.checked)}
              />
              <label htmlFor="woundRerollAll" style={{ fontSize: '0.75rem', color: colors.muted }}>
                Repetir todos los fallos para herir
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="guaranteedWoundSix"
                checked={!!params.guaranteedWoundSix}
                onChange={e => setField('guaranteedWoundSix', e.target.checked)}
              />
              <label htmlFor="guaranteedWoundSix" style={{ fontSize: '0.75rem', color: colors.muted }}>
                1 dado de herir fijo en 6 natural
              </label>
            </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: params.damageD6 ? 1 : 0.55 }}>
              <input
                type="checkbox"
                id="guaranteedDamageSix"
                checked={!!params.guaranteedDamageSix && !!params.damageD6}
                onChange={e => setField('guaranteedDamageSix', e.target.checked)}
                disabled={!params.damageD6}
              />
              <label htmlFor="guaranteedDamageSix" style={{ fontSize: '0.75rem', color: colors.muted }}>
                1 dado de daño fijo en 6 natural
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
            {/* Guaranteed save die */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="guaranteedSaveSix"
                checked={!!params.guaranteedSaveSix}
                onChange={e => setField('guaranteedSaveSix', e.target.checked)}
              />
              <label htmlFor="guaranteedSaveSix" style={{ fontSize: '0.72rem', color: colors.muted }}>
                Dado de salvación fijo en 6 (1 herida auto-salvada)
              </label>
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
          <div
            style={{
              marginTop: sp.lg,
              padding: sp.md,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              background: colors.surfaceAlt,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: sp.md,
                flexWrap: 'wrap',
                marginBottom: sp.sm,
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', color: colors.primaryLight, fontWeight: 600 }}>
                  Resumen para compartir
                </div>
                <div style={{ fontSize: '0.74rem', color: colors.muted, lineHeight: 1.5 }}>
                  La tarjeta replica el bloque de resultados y debajo deja solo el contexto útil para no repetir datos.
                </div>
              </div>
              <div style={{ display: 'flex', gap: sp.sm, flexWrap: 'wrap' }}>
                <button
                  onClick={() => { void copyShareCard(); }}
                  style={{
                    padding: '0.45rem 0.8rem',
                    borderRadius: 8,
                    border: `1px solid ${colors.primary}`,
                    background: colors.primary,
                    color: colors.bg,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Copiar imagen
                </button>
                <button
                  onClick={() => { void copyShareText(); }}
                  style={{
                    padding: '0.45rem 0.8rem',
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                    color: colors.text,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Copiar texto
                </button>
              </div>
            </div>
            {!canCopyImage && (
              <div style={{ marginBottom: sp.sm, fontSize: '0.74rem', color: colors.muted }}>
                Tu navegador no expone copiado de PNG al portapapeles; el botón de imagen hará fallback a texto.
              </div>
            )}
            <div
              style={{
                width: '100%',
                overflow: 'hidden',
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                boxSizing: 'border-box',
              }}
            >
              <img
                src={shareImageUrl}
                alt="Vista previa de la tarjeta para compartir"
                style={{ display: 'block', width: '100%', height: 'auto', background: colors.bg }}
              />
            </div>
            <div
              style={{
                marginTop: sp.md,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: sp.sm,
              }}
            >
              {shareContextSections.map(section => (
                <div
                  key={section.title}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: colors.primaryLight, fontWeight: 700, marginBottom: '0.35rem' }}>
                    {section.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {section.lines.map(line => (
                      <div key={line} style={{ fontSize: '0.74rem', color: colors.text, lineHeight: 1.45 }}>
                        {section.style === 'list' ? `• ${line}` : line}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {copyStatus === 'manual' && (
              <>
                <div style={{ marginTop: sp.md, fontSize: '0.74rem', color: colors.muted }}>
                  Texto de respaldo listo para copiar manualmente.
                </div>
                <textarea
                  ref={shareTextareaRef}
                  readOnly
                  value={shareText}
                  rows={10}
                  style={{
                    width: '100%',
                    marginTop: sp.sm,
                    resize: 'vertical',
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                    color: colors.text,
                    padding: '0.75rem',
                    lineHeight: 1.45,
                    fontSize: '0.78rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </>
            )}
            <div
              style={{
                marginTop: sp.sm,
                fontSize: '0.74rem',
                color: copyStatus === 'idle' || copyStatus === 'manual' ? colors.muted : colors.success,
              }}
            >
              {copyStatus === 'image'
                ? 'Imagen PNG copiada al portapapeles.'
                : copyStatus === 'text'
                  ? 'Texto copiado al portapapeles.'
                  : copyStatus === 'fallback'
                    ? 'No se pudo copiar la imagen; se ha copiado el texto como respaldo.'
                : copyStatus === 'manual'
                  ? 'No se pudo copiar automáticamente. El texto queda seleccionado para copiar manualmente.'
                  : 'Puedes compartir la imagen o copiar el texto tal cual.'}
            </div>
          </div>
        </>
      )}
    </SectionCard>
  );
}
