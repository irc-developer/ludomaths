import { useState } from 'react';
import { colors } from '../styles/tokens';

export interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  'aria-label'?: string;
  compact?: boolean;
}

/** Keep the editing text separate from the number accepted by the calculator. */
export function NumberInput({ value, onChange, min = 0, max, step = 1, id,
  'aria-label': ariaLabel, compact = false }: NumberInputProps) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);

  return (
    <input
      id={id}
      aria-label={ariaLabel}
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
        // Empty and incomplete input must not replace the last accepted number.
        if (text.trim() === '') return;
        const next = Number(text);
        if (Number.isFinite(next)) onChange(next);
      }}
      onBlur={() => setEditing(false)}
      onKeyDown={event => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
      style={{
        width: compact ? 72 : '100%',
        minWidth: 0,
        minHeight: 44,
        flexShrink: compact ? 0 : undefined,
        background: colors.surfaceAlt,
        border: `1px solid ${colors.border}`,
        borderRadius: 6,
        color: colors.text,
        padding: compact ? '0.5rem' : '0.5rem 0.75rem',
        fontSize: '1rem',
        boxSizing: 'border-box',
      }}
    />
  );
}
