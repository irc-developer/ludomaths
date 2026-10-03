import { colors } from '../../styles/tokens';
import { t } from '../../i18n/combat';
import { resolveRerollPolicy, type RerollSelection, type RerollStage } from './rerollPolicy';

interface RerollControlsProps {
  idPrefix: string;
  stage: RerollStage;
  failures?: boolean;
  nonSixes?: boolean;
  disabled?: boolean;
  onChange: (selection: RerollSelection, checked: boolean) => void;
}

/** Shared controls for combat and buff comparison, preserving the stored Torrent selection. */
export function RerollControls({ idPrefix, stage, failures, nonSixes, disabled, onChange }: RerollControlsProps) {
  const policy = resolveRerollPolicy(failures, nonSixes);
  const helpId = `${idPrefix}-${stage}-reroll-help`;
  return (
    <div style={{ display: 'grid', gap: '0.5rem', opacity: disabled ? 0.55 : 1 }}>
      {(['failures', 'nonSixes'] as const).map(selection => {
        const id = `${idPrefix}-${stage}-${selection}`;
        const label = stage === 'hit'
          ? t(selection === 'failures' ? 'combat.hitRerollFailures' : 'combat.hitRerollNonSixes')
          : t(selection === 'failures' ? 'combat.woundRerollFailures' : 'combat.woundRerollNonSixes');
        return (
          <div key={selection} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input id={id} type="checkbox" checked={policy === selection} disabled={disabled}
              aria-describedby={selection === 'nonSixes' ? helpId : undefined}
              onChange={event => onChange(selection, event.target.checked)} />
            <label htmlFor={id} style={{ fontSize: '0.75rem', color: colors.muted }}>{label}</label>
          </div>
        );
      })}
      <p id={helpId} style={{ margin: 0, fontSize: '0.72rem', color: colors.muted, lineHeight: 1.5 }}>
        {t('combat.rerollHelp')}
      </p>
    </div>
  );
}
