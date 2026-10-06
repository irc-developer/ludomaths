import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CombatCalculator } from './CombatCalculator';

afterEach(cleanup);

describe('combat optional number editing', () => {
  it.each([
    ['Salvación invulnerable (++)', 'Valor de salvación invulnerable', '6'],
    ['Feel No Pain (FNP)', 'Umbral de Feel No Pain', '4'],
    ['Sustained Hits', 'Valor de Sustained Hits', '3'],
  ])('allows clearing and replacing %s', (toggleLabel, inputLabel, replacement) => {
    render(<CombatCalculator />);
    const toggle = screen.getByRole('checkbox', { name: toggleLabel }) as HTMLInputElement;
    if (!toggle.checked) fireEvent.click(toggle);
    const input = screen.getByLabelText(inputLabel) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    expect(toggle.checked).toBe(true);
    fireEvent.change(input, { target: { value: replacement } });
    fireEvent.blur(input);
    expect(input.value).toBe(replacement);
  });
});
