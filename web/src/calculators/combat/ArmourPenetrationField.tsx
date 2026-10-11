import { useId } from 'react';
import { NumberInput } from '../../components/NumberInput';
import { s } from '../../i18n/scenario';

/** AP is stored as a magnitude; its negative sign is supplied by the interface. */
export function ArmourPenetrationField({ value, onChange, onDraftValidityChange }: {
  value: number;
  onChange: (value: number) => void;
  onDraftValidityChange?: (invalid: boolean) => void;
}) {
  const id = useId();
  return <div className="armour-penetration-field">
    <label htmlFor={id}>{s('ap')}</label>
    <NumberInput id={id} draftKey={s('ap')} draftLabel={s('ap')} value={value} min={0} max={100}
      prefix={value === 0 ? '' : '−'} aria-describedby={`${id}-help`}
      onChange={onChange} onDraftValidityChange={onDraftValidityChange} />
    <small id={`${id}-help`}>{s('apHelp')}</small>
  </div>;
}
