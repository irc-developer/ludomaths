import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CombatCalculator } from './CombatCalculator';
import { CombatScenarioProvider } from './CombatScenarioContext';
import { RequiredAttacksCalculator } from '../required-attacks/RequiredAttacksCalculator';
import { CombatBuffComparisonCalculator } from '../buffs/CombatBuffComparisonCalculator';

afterEach(cleanup);
describe('squad combat screen', () => {
  it('configures ten against five and displays casualty statistics', () => {
    render(<CombatCalculator />);
    fireEvent.change(screen.getByLabelText('Miniaturas que atacan'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Miniaturas restantes'), { target: { value: '5' } });
    expect(screen.getByText('10 atacantes contra 5 defensores')).toBeTruthy();
    expect(screen.getByText('Bajas medias')).toBeTruthy();
    expect(screen.getByText('Probabilidad de eliminar la escuadra')).toBeTruthy();
    expect(screen.getByText('Distribución de bajas')).toBeTruthy();
    expect(screen.queryByText('Probabilidad de eliminar la miniatura')).toBeNull();
  });
  it('shares the defender count with required attacks', () => {
    const { rerender } = render(<CombatScenarioProvider initialEntryMode="manual"><CombatCalculator /></CombatScenarioProvider>);
    fireEvent.change(screen.getByLabelText('Miniaturas restantes'), { target: { value: '5' } });
    rerender(<CombatScenarioProvider initialEntryMode="manual"><RequiredAttacksCalculator /></CombatScenarioProvider>);
    expect((screen.getByLabelText('Miniaturas restantes') as HTMLInputElement).value).toBe('5');
    expect(screen.getByLabelText('Objetivo de bajas')).toBeTruthy();
  });
  it('allows equipment groups without double counting another weapon on the same models', () => {
    render(<CombatCalculator />);
    fireEvent.change(screen.getByLabelText('Miniaturas que atacan'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir grupo con otro equipo' }));
    const group = screen.getByRole('group', { name: 'Grupo atacante 2' });
    fireEvent.change(within(group).getByLabelText('Miniaturas del grupo'), { target: { value: '2' } });
    fireEvent.click(within(group).getByRole('button', { name: 'Añadir otra arma a este grupo' }));
    expect(screen.getByText('Grupo principal: 8 miniaturas')).toBeTruthy();
    expect(screen.getByText('10 atacantes contra 1 defensores')).toBeTruthy();
    const orderButtons = within(group).getAllByRole('button', { name: 'Resolver antes' });
    fireEvent.click(orderButtons[orderButtons.length - 1]);
    expect(screen.getByText('Grupo principal: 2 miniaturas')).toBeTruthy();
    expect((within(group).getByLabelText('Miniaturas del grupo') as HTMLInputElement).value).toBe('8');
    expect(screen.getByText('10 atacantes contra 1 defensores')).toBeTruthy();
  });
  it('compares squad improvements and shares a complete squad summary', async () => {
    const { rerender } = render(<CombatScenarioProvider initialEntryMode="manual"><CombatCalculator /></CombatScenarioProvider>);
    fireEvent.change(screen.getByLabelText('Miniaturas que atacan'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Miniaturas restantes'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Compartir resultado'));
    expect((await screen.findByAltText('Vista previa de la tarjeta para compartir')).getAttribute('src')).toContain('Bajas%20medias');
    expect(screen.getByAltText('Vista previa de la tarjeta para compartir').getAttribute('src')).not.toContain('P(eliminar%20objetivo');
    rerender(<CombatScenarioProvider initialEntryMode="manual"><CombatBuffComparisonCalculator /></CombatScenarioProvider>);
    expect(screen.getAllByText('Bajas medias').length).toBe(7);
    expect(screen.queryByText('Rondas esperadas para eliminar')).toBeNull();
  });
});
