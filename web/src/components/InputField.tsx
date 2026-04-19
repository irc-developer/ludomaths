import { colors } from '../styles/tokens';

export interface InputFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function InputField({ label, value, onChange, min = 0, max, step = 1 }: InputFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label style={{ fontSize: '0.75rem', color: colors.muted }}>{label}</label>
      <input
        type="number"
        style={{
          width: '100%',
          background: colors.surfaceAlt,
          border: `1px solid ${colors.border}`,
          borderRadius: 6,
          color: colors.text,
          padding: '0.5rem 0.75rem',
          fontSize: '1rem',
          boxSizing: 'border-box',
        }}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => {
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
    </div>
  );
}
