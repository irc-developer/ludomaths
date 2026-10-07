import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../../App';
import { RequiredAttacksCalculator } from './RequiredAttacksCalculator';

afterEach(cleanup);

describe('required attacks calculator', () => {
  it('opens from the new tab and reports the minimum and the previous probability', async () => {
    await act(async () => { render(<App />); });
    fireEvent.click(screen.getByRole('button', { name: 'WH40K' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entrada manual' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ataques necesarios' }));
    const result = screen.getAllByRole('status').find(element => within(element).queryByText('34 ataques'))!;
    expect(within(result).getByText('34 ataques')).toBeTruthy();
    expect(within(result).getByText('90%')).toBeTruthy();
    expect(within(result).getByText('Con 33 ataques')).toBeTruthy();
    expect(result.textContent).toContain('90,4286%');
    expect(result.textContent).toContain('89,4886%');
  });

  it('recalculates for reliability, remaining wounds, and a different weapon', () => {
    render(<RequiredAttacksCalculator />);
    fireEvent.click(screen.getByRole('button', { name: '95%' }));
    expect(screen.getByRole('status').textContent).toContain('41 ataques');
    fireEvent.change(screen.getByLabelText('Heridas restantes'), { target: { value: '1' } });
    expect(screen.getByRole('status').textContent).toContain('26 ataques');
    fireEvent.change(screen.getByLabelText('Daño por ataque'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Heridas restantes'), { target: { value: '2' } });
    expect(screen.getByRole('status').textContent).toContain('26 ataques');
  });

  it('handles 100% and invalid percentages without showing a stale result', () => {
    render(<RequiredAttacksCalculator />);
    fireEvent.change(screen.getByLabelText('Fiabilidad deseada (%)'), { target: { value: '100' } });
    expect(screen.getByRole('status').textContent).toContain('No existe un número finito');
    expect(screen.queryByText('34 ataques')).toBeNull();
    fireEvent.change(screen.getByLabelText('Fiabilidad deseada (%)'), { target: { value: '0' } });
    expect(screen.getByRole('alert').textContent).toContain('La fiabilidad debe ser mayor que 0%');
  });

  it('loads variable-damage presets, preserves reliability and allows D3', () => {
    render(<RequiredAttacksCalculator />);
    fireEvent.click(screen.getByRole('button', { name: '99%' }));
    fireEvent.change(screen.getByLabelText('Ejemplo de arma y objetivo'), { target: { value: 'lascannon-vs-rhino' } });
    expect((screen.getByLabelText('Daño por ataque') as HTMLSelectElement).value).toBe('D6');
    expect((screen.getByLabelText('Fiabilidad deseada (%)') as HTMLInputElement).value).toBe('99');
    const d6Text = screen.getByRole('status').textContent;
    fireEvent.change(screen.getByLabelText('Daño por ataque'), { target: { value: 'D3' } });
    expect(screen.getByRole('status').textContent).not.toBe(d6Text);
    expect(screen.getByRole('status').textContent).toContain('Necesitas');
  });

  it('changes saves, FNP and rerolls and disables hit rerolls under Torrent', () => {
    render(<RequiredAttacksCalculator />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Salvación invulnerable (++)' }));
    fireEvent.change(screen.getByLabelText('Valor de salvación invulnerable'), { target: { value: '2' } });
    expect(screen.getByRole('status').textContent).not.toContain('34 ataques');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Feel No Pain (FNP)' }));
    const before = screen.getByRole('status').textContent;
    fireEvent.click(screen.getByText('Repeticiones y habilidades del arma'));
    const fishing = screen.getByRole('checkbox', { name: 'Repetir todo lo que no sean seises para impactar' }) as HTMLInputElement;
    fireEvent.click(fishing);
    expect(screen.getByRole('status').textContent).not.toBe(before);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Torrent: impactos automáticos' }));
    expect(fishing.disabled).toBe(true);
  });
});
