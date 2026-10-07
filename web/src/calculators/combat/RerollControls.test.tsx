import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CombatCalculator } from './CombatCalculator';
import { CombatBuffComparisonCalculator } from '../buffs/CombatBuffComparisonCalculator';

afterEach(cleanup);

describe.each([
  ['combat', CombatCalculator], ['buffs', CombatBuffComparisonCalculator],
] as const)('%s reroll controls', (_name, Calculator) => {
  function checkbox(name: string | RegExp) {
    return screen.getByRole('checkbox', { name }) as HTMLInputElement;
  }

  it('keeps the stages independent and makes their two policies mutually exclusive', () => {
    render(<Calculator />);
    const hitFailures = checkbox('Repetir todos los fallos para impactar');
    const hitFishing = checkbox('Repetir todo lo que no sean seises para impactar');
    const woundFailures = checkbox('Repetir todos los fallos para herir');
    const woundFishing = checkbox('Repetir todo lo que no sean seises para herir');
    fireEvent.click(hitFailures);
    fireEvent.click(woundFailures);
    fireEvent.click(hitFishing);
    expect(hitFailures.checked).toBe(false);
    expect(hitFishing.checked).toBe(true);
    expect(woundFailures.checked).toBe(true);
    fireEvent.click(hitFailures);
    expect(hitFishing.checked).toBe(false);
    fireEvent.click(woundFishing);
    expect(woundFailures.checked).toBe(false);
    fireEvent.click(woundFailures);
    expect(woundFishing.checked).toBe(false);
    fireEvent.click(hitFailures);
    expect(hitFailures.checked).toBe(false);
  });

  it('disables hit rerolls under Torrent, preserves them when toggled off and resets presets', () => {
    render(<Calculator />);
    const hitFishing = checkbox('Repetir todo lo que no sean seises para impactar');
    fireEvent.click(hitFishing);
    fireEvent.click(checkbox(/Torrent/));
    expect(hitFishing.disabled).toBe(true);
    expect(checkbox('Repetir todos los fallos para impactar').disabled).toBe(true);
    expect(checkbox('Repetir todo lo que no sean seises para herir').disabled).toBe(false);
    expect(hitFishing.checked).toBe(true);
    fireEvent.click(checkbox(/Torrent/));
    expect(hitFishing.disabled).toBe(false);
    expect(hitFishing.checked).toBe(true);
    fireEvent.change(screen.getByLabelText('Ejemplo de arma y objetivo'), { target: { value: 'bolter-vs-marine' } });
    expect(hitFishing.checked).toBe(false);
  });
});
