import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ChargeCalculator } from './ChargeCalculator';

afterEach(cleanup);
function confirmContext() {
  fireEvent.click(screen.getByRole('checkbox', { name: /He comprobado/ }));
}
function result() {
  return within(screen.getByRole('region', { name: 'Resultado de distancia de carga' }));
}
function changeDistance(value: string) {
  fireEvent.change(screen.getByLabelText('Distancia medida al objetivo (″)'), { target: { value } });
}

describe('ChargeCalculator', () => {
  it('requires a checked legal context and hides results when that confirmation is removed', () => {
    render(<ChargeCalculator />);
    expect(screen.getByRole('heading', { name: /11.ª edición/ })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Resultado de distancia de carga' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Tabla de distancia de carga' })).toBeNull();
    confirmContext();
    expect(result().getByText('27,78 %')).toBeTruthy();
    confirmContext();
    expect(screen.queryByRole('region', { name: 'Resultado de distancia de carga' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Tabla de distancia de carga' })).toBeNull();
  });

  it('accepts both decimal separators and never rounds a 9.1-inch measurement down', () => {
    render(<ChargeCalculator />);
    confirmContext();
    for (const value of ['9,1', '9.1']) {
      changeDistance(value);
      expect(result().getByText('16,67 %')).toBeTruthy();
      expect((screen.getByLabelText('Distancia medida al objetivo (″)') as HTMLInputElement).value).toBe(value);
    }
  });

  it('keeps incomplete or invalid drafts hidden after blur and recovers when corrected', () => {
    render(<ChargeCalculator />);
    confirmContext();
    const input = screen.getByLabelText('Distancia medida al objetivo (″)');
    for (const value of ['', '9,', '-1', 'Infinity', 'NaN']) {
      changeDistance(value);
      fireEvent.blur(input);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByRole('alert').textContent).toContain('distancia');
      expect(screen.queryByRole('region', { name: 'Resultado de distancia de carga' })).toBeNull();
      expect(screen.queryByRole('region', { name: 'Tabla de distancia de carga' })).toBeNull();
    }
    changeDistance('9');
    expect(result().getByText('27,78 %')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('rejects incomplete and fractional modifiers without leaving an old result', () => {
    render(<ChargeCalculator />);
    confirmContext();
    const modifier = screen.getByLabelText('Modificador de la tirada');
    for (const value of ['', '-', '0.5']) {
      fireEvent.change(modifier, { target: { value } });
      fireEvent.blur(modifier);
      expect(modifier.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByRole('alert').textContent).toContain('modificador');
      expect(screen.queryByRole('region', { name: 'Resultado de distancia de carga' })).toBeNull();
    }
    fireEvent.change(modifier, { target: { value: '-2' } });
    expect(result().getByText('8,33 %')).toBeTruthy();
  });

  it('checks target eligibility independently of a positive modifier', () => {
    render(<ChargeCalculator />);
    confirmContext();
    fireEvent.change(screen.getByLabelText('Modificador de la tirada'), { target: { value: '+2' } });
    changeDistance('12.01');
    expect(screen.getByRole('status').textContent).toContain('fuera del alcance');
    expect(screen.queryByRole('region', { name: 'Resultado de distancia de carga' })).toBeNull();
    changeDistance('2');
    expect(screen.getByRole('status').textContent).toContain('enfrentamiento y alturas');
    expect(screen.queryByRole('region', { name: 'Resultado de distancia de carga' })).toBeNull();
    changeDistance('3');
    expect(result().getByText('100,00 %')).toBeTruthy();
  });

  it('re-rolls both dice after an observed six and updates when modes change', () => {
    render(<ChargeCalculator />);
    confirmContext();
    fireEvent.change(screen.getByLabelText('Modo de cálculo'), { target: { value: 'observedSix' } });
    expect(result().getByText('66,67 %')).toBeTruthy();
    expect(screen.getByText(/no concede permiso para fijarlo o conservarlo/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Repetición de carga'), { target: { value: 'failures' } });
    expect(result().getByText('75,93 %')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Modo de cálculo'), { target: { value: 'standard' } });
    expect(result().getByText('47,84 %')).toBeTruthy();
    expect(screen.queryByText(/no concede permiso para fijarlo o conservarlo/)).toBeNull();
  });

  it('the reference table follows modifiers, and selecting a row changes the measured distance', () => {
    render(<ChargeCalculator />);
    confirmContext();
    const table = within(screen.getByRole('region', { name: 'Tabla de distancia de carga' }));
    expect(table.getAllByRole('button')).toHaveLength(10);
    fireEvent.change(screen.getByLabelText('Modificador de la tirada'), { target: { value: '2' } });
    expect(table.getByRole('button', { name: 'Elegir distancia de 12 pulgadas' }).textContent).toContain('16,67 %');
    fireEvent.click(table.getByRole('button', { name: 'Elegir distancia de 12 pulgadas' }));
    expect(result().getByText('16,67 %')).toBeTruthy();
    expect(table.getByRole('button', { name: 'Elegir distancia de 12 pulgadas' }).getAttribute('aria-pressed')).toBe('true');
    expect((screen.getByLabelText('Distancia medida al objetivo (″)') as HTMLInputElement).value).toBe('12');
  });
});
