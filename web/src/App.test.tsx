import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('muestra la pestaña de comparación de buffs WH40K', () => {
    render(<App />);

    expect(screen.getByText('Buffs WH40K')).toBeTruthy();
  });
});