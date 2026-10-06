import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { InputField } from './InputField';

afterEach(cleanup);

function EditableField({ initial = 60, min = 1, max = 100, step = 1 }) {
  const [value, setValue] = useState(initial);
  return <>
    <InputField label="Número" value={value} min={min} max={max} step={step}
      onChange={next => setValue(Math.max(min, Math.min(max, next)))} />
    <output data-testid="value">{value}</output>
    <button onClick={() => setValue(40)}>Cargar ejemplo</button>
  </>;
}

describe('InputField editing', () => {
  it('allows clearing and replacing a number without sending an empty value to the calculator', () => {
    render(<EditableField />);
    const input = screen.getByLabelText('Número') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    expect(screen.getByTestId('value').textContent).toBe('60');
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.change(input, { target: { value: '25' } });
    expect(input.value).toBe('25');
    expect(screen.getByTestId('value').textContent).toBe('25');
  });

  it('keeps intermediate digits even when the calculator clamps them', () => {
    render(<EditableField initial={90} min={20} />);
    const input = screen.getByLabelText('Número') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.change(input, { target: { value: '3' } });
    expect(input.value).toBe('3');
    fireEvent.change(input, { target: { value: '35' } });
    expect(input.value).toBe('35');
    expect(screen.getByTestId('value').textContent).toBe('35');
  });

  it('restores the accepted value on blur and responds to external changes', () => {
    render(<EditableField />);
    const input = screen.getByLabelText('Número') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(input.value).toBe('60');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '101' } });
    expect(input.value).toBe('101');
    fireEvent.blur(input);
    expect(input.value).toBe('100');
    fireEvent.click(screen.getByText('Cargar ejemplo'));
    expect(input.value).toBe('40');
  });

  it('requests a numeric keyboard for integers and a decimal keyboard for percentages', () => {
    const { rerender } = render(<InputField label="Número" value={6} onChange={() => {}} />);
    expect(screen.getByLabelText('Número').getAttribute('inputmode')).toBe('numeric');
    rerender(<InputField label="Número" value={90.5} onChange={() => {}} step={0.1} />);
    expect(screen.getByLabelText('Número').getAttribute('inputmode')).toBe('decimal');
  });

  it('updates decimal values and finishes editing with Enter', () => {
    render(<EditableField initial={90} step={0.1} />);
    const input = screen.getByLabelText('Número') as HTMLInputElement;
    act(() => input.focus());
    fireEvent.change(input, { target: { value: '95.5' } });
    expect(screen.getByTestId('value').textContent).toBe('95.5');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(document.activeElement).not.toBe(input);
    expect(input.value).toBe('95.5');
  });
});
