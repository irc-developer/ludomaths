import { useState } from 'react';
import { colors } from '../styles/tokens';

export interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  'aria-label'?: string;
  compact?: boolean;
  onDraftValidityChange?: (invalid: boolean) => void;
}

/** Keep the editing text separate from the number accepted by the calculator. */
export function NumberInput({ value, onChange, disabled = false, min = 0, max, step = 1, id,
  'aria-label': ariaLabel, compact = false, onDraftValidityChange }: NumberInputProps) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);

  return (
    <input
      id={id}
      aria-label={ariaLabel}
      disabled={disabled}
      type="number"
      inputMode={Number.isInteger(step) ? 'numeric' : 'decimal'}
      min={min}
      max={max}
      step={step}
      value={editing ? draft : value}
      onFocus={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      onChange={event => {
        const text = event.target.value;
        setDraft(text);
        onDraftValidityChange?.(text.trim() === '');
        // Empty and incomplete input must not replace the last accepted number.
        if (text.trim() === '') return;
        const next = Number(text);
        if (Number.isFinite(next)) onChange(next);
      }}
      onBlur={() => { setEditing(false); onDraftValidityChange?.(false); }}
      onKeyDown={event => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
      style={{
        width: compact ? 72 : '100%',
        minWidth: 0,
        minHeight: 44,
        flexShrink: compact ? 0 : undefined,
        background: colors.surfaceAlt,
        border: `1px solid ${colors.controlBorder}`,
        borderRadius: 6,
        color: colors.text,
        padding: compact ? '0.5rem' : '0.5rem 0.75rem',
        fontSize: '1rem',
        boxSizing: 'border-box',
      }}
    />
  );
}
