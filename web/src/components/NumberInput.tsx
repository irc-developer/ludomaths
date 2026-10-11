import { useState } from 'react';
import { colors } from '../styles/tokens';
import { usePersistentNumber } from './NumberDrafts';

export interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  prefix?: string;
  compact?: boolean;
  draftKey?: string;
  draftLabel?: string;
  onDraftValidityChange?: (invalid: boolean) => void;
}

/** Keep the editing text separate from the number accepted by the calculator. */
export function NumberInput({ value, onChange, disabled = false, min = 0, max, step = 1, id,
  'aria-label': ariaLabel, 'aria-describedby': ariaDescribedBy, prefix, compact = false, draftKey, draftLabel, onDraftValidityChange }: NumberInputProps) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const persistent = usePersistentNumber(draftKey ?? ariaLabel, draftLabel ?? ariaLabel ?? draftKey ?? '', id, value, min, max, step);

  const input = (
    <input
      id={id}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-invalid={persistent?.invalid || undefined}
      disabled={disabled}
      type="number"
      inputMode={Number.isInteger(step) ? 'numeric' : 'decimal'}
      min={min}
      max={max}
      step={step}
      value={persistent ? persistent.text : editing ? draft : value}
      onFocus={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      onChange={event => {
        const text = event.target.value;
        setDraft(text);
        if (persistent) persistent.set(text);
        else onDraftValidityChange?.(text.trim() === '');
        // Empty and incomplete input must not replace the last accepted number.
        if (text.trim() === '') return;
        const next = Number(text);
        if (Number.isFinite(next)) onChange(next);
      }}
      onBlur={() => { setEditing(false); if (!persistent) onDraftValidityChange?.(false); }}
      onKeyDown={event => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
      style={{
        width: compact ? 72 : '100%',
        minWidth: 0,
        minHeight: 44,
        flexShrink: compact ? 0 : undefined,
        background: colors.surfaceAlt,
        border: `1px solid ${persistent?.invalid ? '#f87171' : colors.controlBorder}`,
        borderRadius: 6,
        color: colors.text,
        padding: compact ? '0.5rem' : '0.5rem 0.75rem',
        fontSize: '1rem',
        boxSizing: 'border-box',
      }}
    />
  );
  return prefix === undefined ? input : <span className="number-input-with-prefix">
    <span className="number-input-prefix" aria-hidden="true">{prefix}</span>
    {input}
  </span>;
}
