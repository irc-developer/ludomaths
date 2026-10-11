import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

afterEach(cleanup);
function finishWizard() {
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Revisar escenario' }));
  fireEvent.click(screen.getByRole('button', { name: 'Generar informe' }));
}
describe('shared WH40K workspace', () => {
  it('starts with profile selection and keeps a manual scenario across calculators', async () => {
    await act(async () => { render(<App />); });
    fireEvent.click(screen.getByRole('button', { name: 'WH40K' }));
    expect(screen.queryByText('Probabilidad de eliminar la miniatura')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Elige quién ataca' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Entrada manual' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    finishWizard();
    const statistics = within(screen.getByRole('region', { name: 'Estadísticas resultantes' }));
    expect(statistics.getByRole('heading', { name: 'Estadísticas resultantes' })).toBeTruthy();
    expect(statistics.getByText('Daño potencial esperado')).toBeTruthy();
    expect(statistics.getByText('Daño más probable')).toBeTruthy();
    expect(statistics.getByText('Daño mediano')).toBeTruthy();
    expect(statistics.getByText('Rango central (Q1–Q3)')).toBeTruthy();
    expect(statistics.getByText('Probabilidad de causar alguna herida')).toBeTruthy();
    expect(statistics.getByText('Distribución de daño: resultados destacados')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '← Cambiar defensor' }));
    fireEvent.change(screen.getByLabelText('Heridas restantes'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y revisar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ataques necesarios' }));
    expect(screen.getByRole('heading', { name: 'Configura el ataque' })).toBeTruthy();
    expect(screen.queryByLabelText('Portadores del arma')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '95%' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mejoras' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y revisar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generar informe' }));
    expect(screen.getByText('Mejor opción ofensiva:')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ataques necesarios' }));
    expect((screen.getByLabelText('Fiabilidad deseada (%)') as HTMLInputElement).value).toBe('95');
  });
  it('requires review and confirmation after editing an incomplete numeric draft', async () => {
    await act(async () => { render(<App />); });
    fireEvent.click(screen.getByRole('button', { name: 'WH40K' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entrada manual' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    finishWizard();
    fireEvent.click(screen.getByRole('button', { name: '← Cambiar defensor' }));
    const input = screen.getByLabelText('Heridas restantes');
    fireEvent.focus(input); fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y revisar' }));
    expect(screen.getByRole('alert').textContent).toContain('Heridas restantes');
    expect(screen.queryByText('Probabilidad de eliminar la miniatura')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Estadísticas resultantes' })).toBeNull();
    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y revisar' }));
    expect(screen.queryByText('Probabilidad de eliminar la miniatura')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Generar informe' }));
    expect(screen.getByText('Probabilidad de eliminar la miniatura')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Estadísticas resultantes' })).toBeTruthy();
  });
  it('explains missing attack context before confirming another report', async () => {
    await act(async () => { render(<App />); });
    fireEvent.click(screen.getByRole('button', { name: 'WH40K' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entrada manual' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    finishWizard();
    fireEvent.click(screen.getByRole('button', { name: '← Cambiar ataque' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /^Heavy$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y revisar' }));
    expect(screen.queryByRole('region', { name: 'Estadísticas resultantes' })).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('Arma manual (Heavy): elige la fase');
    expect(screen.getByRole('alert').querySelectorAll('li')).toHaveLength(4);
    fireEvent.change(screen.getByLabelText('Fase'), { target: { value: 'shooting' } });
    for (const label of ['Unidad trabada', 'Desplegada este turno', 'Alguna miniatura movió más de 3 pulgadas']) {
      fireEvent.change(screen.getByLabelText(label), { target: { value: 'false' } });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y revisar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generar informe' }));
    expect(screen.getByRole('region', { name: 'Estadísticas resultantes' })).toBeTruthy();
  });
});
