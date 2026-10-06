import { useId } from 'react';
import { colors } from '../styles/tokens';
import { NumberInput } from './NumberInput';

export interface InputFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function InputField({ label, value, onChange, min = 0, max, step = 1 }: InputFieldProps) {
  const id = useId();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
      <label htmlFor={id} style={{ fontSize: '0.75rem', color: colors.muted }}>{label}</label>
      <NumberInput
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
