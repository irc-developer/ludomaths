import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

afterEach(cleanup);
describe('shared WH40K workspace', () => {
  it('starts with profile selection and keeps a manual scenario across calculators', async () => {
    await act(async () => { render(<App />); });
    fireEvent.click(screen.getByRole('button', { name: 'WH40K' }));
    expect(screen.queryByText('Probabilidad de eliminar la miniatura')).toBeNull();
    expect(screen.getByText('Elige un arma y una miniatura objetivo para ver el resultado.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Entrada manual' }));
    const statistics = within(screen.getByRole('region', { name: 'Estadísticas resultantes' }));
    expect(statistics.getByRole('heading', { name: 'Estadísticas resultantes' })).toBeTruthy();
    expect(statistics.getByText('Daño potencial esperado')).toBeTruthy();
    expect(statistics.getByText('Daño más probable')).toBeTruthy();
    expect(statistics.getByText('Daño mediano')).toBeTruthy();
    expect(statistics.getByText('Rango central (Q1–Q3)')).toBeTruthy();
    expect(statistics.getByText('Probabilidad de causar alguna herida')).toBeTruthy();
    expect(statistics.getByText('Distribución de daño: resultados destacados')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Heridas restantes'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ataques necesarios' }));
    expect((screen.getByLabelText('Heridas restantes') as HTMLInputElement).value).toBe('1');
    expect(screen.queryByLabelText('Portadores del arma')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '95%' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mejoras' }));
    expect(screen.getByText('Mejor opción ofensiva:')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ataques necesarios' }));
    expect((screen.getByLabelText('Fiabilidad deseada (%)') as HTMLInputElement).value).toBe('95');
  });
  it('hides stale results while a numeric draft is empty', async () => {
    await act(async () => { render(<App />); });
    fireEvent.click(screen.getByRole('button', { name: 'WH40K' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entrada manual' }));
    const input = screen.getByLabelText('Heridas restantes');
    fireEvent.focus(input); fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('Completa el campo que estás editando para actualizar el resultado.')).toBeTruthy();
    expect(screen.queryByText('Probabilidad de eliminar la miniatura')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Estadísticas resultantes' })).toBeNull();
    fireEvent.change(input, { target: { value: '1' } });
    expect(screen.getByText('Probabilidad de eliminar la miniatura')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Estadísticas resultantes' })).toBeTruthy();
  });
  it('explains missing attack context where the results would appear', async () => {
    await act(async () => { render(<App />); });
    fireEvent.click(screen.getByRole('button', { name: 'WH40K' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entrada manual' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /^Heavy$/ }));
    expect(screen.queryByRole('region', { name: 'Estadísticas resultantes' })).toBeNull();
    expect(screen.getAllByRole('status').map(notice => notice.textContent)).toContain('Completa las condiciones que necesita la regla antes de calcular.');
    fireEvent.change(screen.getByLabelText('Fase'), { target: { value: 'shooting' } });
    for (const label of ['Unidad trabada', 'Desplegada este turno', 'Alguna miniatura movió más de 3 pulgadas']) {
      fireEvent.change(screen.getByLabelText(label), { target: { value: 'false' } });
    }
    expect(screen.getByRole('region', { name: 'Estadísticas resultantes' })).toBeTruthy();
    expect(screen.queryByText('Completa las condiciones que necesita la regla antes de calcular.')).toBeNull();
  });
});
