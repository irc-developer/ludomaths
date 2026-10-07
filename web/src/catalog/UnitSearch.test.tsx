import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UnitSearch } from './UnitSearch';

afterEach(cleanup);
const options = [
  { id: 'one', name: 'Intercessor Squad', detail: 'Astartes' },
  { id: 'two', name: 'Intercessor Squad', detail: 'Other faction' },
  { id: 'three', name: 'Élite Guard', detail: 'Synthetic' },
];
describe('independent unit search', () => {
  it('filters accents and commits only an explicit choice', () => {
    const onSelect = vi.fn();
    render(<UnitSearch label="Attacker" options={options} selectedId="one" onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: 'Attacker' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'elite' } });
    expect(screen.getByRole('option', { name: 'Élite Guard Synthetic' })).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('three');
  });
  it('preserves a prior selection on Escape and blur, and disambiguates names', () => {
    const onSelect = vi.fn();
    render(<UnitSearch label="Defender" options={options} selectedId="one" onSelect={onSelect} />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'inter' } });
    expect(screen.getAllByRole('option')).toHaveLength(2);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect((input as HTMLInputElement).value).toBe('Intercessor Squad');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'missing' } });
    expect(screen.getByText('Sin coincidencias en este catálogo.')).toBeTruthy();
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.getAttribute('aria-activedescendant')).toBeNull();
    fireEvent.blur(input);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
