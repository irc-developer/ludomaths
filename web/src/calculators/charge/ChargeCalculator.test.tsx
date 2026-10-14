import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ChargeCalculator } from './ChargeCalculator';

afterEach(cleanup);
function result() {
  return within(screen.getByRole('region', { name: 'Resultado de distancia de carga' }));
}
function changeDistance(value: string) {
  fireEvent.change(screen.getByLabelText('Distancia (″)'), { target: { value } });
}
function openOptions() {
  fireEvent.click(screen.getByText('Opciones', { exact: true }));
}

describe('ChargeCalculator', () => {
  it('shows the result immediately with only distance and a re-roll toggle visible', () => {
    render(<ChargeCalculator />);
    expect(screen.getByRole('heading', { name: 'Carga WH40K' })).toBeTruthy();
    expect(result().getByText('27,78 %')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Distancia (″)' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Repetir carga' })).toBeTruthy();
    const options = screen.getByText('Opciones', { exact: true }).closest('details');
    expect(options?.open).toBe(false);
    expect(screen.getByLabelText('Modificador').closest('details')).toBe(options);
    expect(screen.getByLabelText('Un dado ya es 6').closest('details')).toBe(options);
    expect(screen.getByText('Reglas y cálculo').closest('details')?.open).toBe(false);
  });

  it('accepts both decimal separators without rounding measurements down', () => {
    render(<ChargeCalculator />);
    for (const value of ['9,1', '9.1']) {
      changeDistance(value);
      expect(result().getByText('16,67 %')).toBeTruthy();
      expect((screen.getByLabelText('Distancia (″)') as HTMLInputElement).value).toBe(value);
    }
  });

  it('keeps invalid drafts hidden after blur and recovers when corrected', () => {
    render(<ChargeCalculator />);
    const input = screen.getByLabelText('Distancia (″)');
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
  });

  it('keeps invalid modifier drafts visible in the options summary even when collapsed', () => {
    render(<ChargeCalculator />);
    openOptions();
    const modifier = screen.getByLabelText('Modificador');
    for (const value of ['', '-', '0.5']) {
      fireEvent.change(modifier, { target: { value } });
      fireEvent.blur(modifier);
      expect(modifier.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByRole('alert').textContent).toContain('modificador');
      expect(screen.queryByRole('region', { name: 'Resultado de distancia de carga' })).toBeNull();
      expect(screen.getByText('Opciones · revisa el modificador')).toBeTruthy();
    }
    fireEvent.click(screen.getByText('Opciones · revisa el modificador'));
    expect(screen.getByText('Opciones · revisa el modificador').closest('details')?.open).toBe(false);
    expect(screen.getByRole('alert').textContent).toContain('modificador');
    fireEvent.click(screen.getByText('Opciones · revisa el modificador'));
    fireEvent.change(modifier, { target: { value: '-2' } });
    expect(result().getByText('8,33 %')).toBeTruthy();
  });

  it('keeps range and engagement checks despite the shorter interface', () => {
    render(<ChargeCalculator />);
    openOptions();
    fireEvent.change(screen.getByLabelText('Modificador'), { target: { value: '+2' } });
    changeDistance('12.01');
    expect(screen.getByRole('status').textContent).toContain('Fuera de alcance');
    expect(screen.queryByRole('region', { name: 'Resultado de distancia de carga' })).toBeNull();
    changeDistance('2');
    expect(screen.getByRole('status').textContent).toContain('trabado');
    expect(screen.queryByRole('region', { name: 'Resultado de distancia de carga' })).toBeNull();
    changeDistance('3');
    expect(result().getByText('100,00 %')).toBeTruthy();
  });

  it('re-rolls both dice after an observed six and shows active options when collapsed', () => {
    render(<ChargeCalculator />);
    openOptions();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Un dado ya es 6' }));
    expect(result().getByText('66,67 %')).toBeTruthy();
    fireEvent.click(screen.getByText('Opciones · un 6 observado'));
    expect(screen.getByText('Opciones · un 6 observado').closest('details')?.open).toBe(false);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Repetir carga' }));
    expect(result().getByText('75,93 %')).toBeTruthy();
    fireEvent.click(screen.getByText('Opciones · un 6 observado'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Un dado ya es 6' }));
    expect(result().getByText('47,84 %')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Repetir carga' }));
    expect(result().getByText('27,78 %')).toBeTruthy();
  });

  it('keeps the clickable reference table in sync with the active modifier', () => {
    render(<ChargeCalculator />);
    const table = within(screen.getByRole('region', { name: 'Tabla de distancia de carga' }));
    expect(table.getAllByRole('button')).toHaveLength(10);
    openOptions();
    fireEvent.change(screen.getByLabelText('Modificador'), { target: { value: '2' } });
    expect(screen.getByText('Opciones · +2')).toBeTruthy();
    expect(table.getByRole('button', { name: 'Elegir distancia de 12 pulgadas' }).textContent).toContain('17 %');
    fireEvent.click(table.getByRole('button', { name: 'Elegir distancia de 12 pulgadas' }));
    expect(result().getByText('16,67 %')).toBeTruthy();
    expect((screen.getByLabelText('Distancia (″)') as HTMLInputElement).value).toBe('12');
  });
});
