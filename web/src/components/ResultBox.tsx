import { colors } from '../styles/tokens';

export interface ResultBoxProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export function ResultBox({ label, value, highlight = false }: ResultBoxProps) {
  return (
    <div
      style={{
        background: colors.surfaceAlt,
        borderRadius: 8,
        padding: '0.75rem',
        textAlign: 'center',
        border: `1px solid ${highlight ? colors.primary : colors.border}`,
      }}
    >
      <div style={{ fontSize: '0.7rem', color: colors.muted, marginBottom: '0.25rem' }}>{label}</div>
      <div
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: highlight ? colors.primary : colors.primaryLight,
        }}
      >
        {value}
      </div>
    </div>
  );
}
