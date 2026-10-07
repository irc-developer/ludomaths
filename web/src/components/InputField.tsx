import { useId } from 'react';
import { colors } from '../styles/tokens';
import { NumberInput } from './NumberInput';

export interface InputFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  onDraftValidityChange?: (invalid: boolean) => void;
}

export function InputField({ label, value, onChange, disabled = false, min = 0, max, step = 1, onDraftValidityChange }: InputFieldProps) {
  const id = useId();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
      <label htmlFor={id} style={{ fontSize: '0.75rem', color: colors.muted }}>{label}</label>
      <NumberInput
        id={id}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        onDraftValidityChange={onDraftValidityChange}
      />
    </div>
  );
}
