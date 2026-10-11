import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { equipmentFixture } from '@application/dice/catalogEquipmentFixture';
import { CalculateUnitCombatUseCase } from '@application/dice/CalculateUnitCombatUseCase';
import { EQUIPMENT_REVIEWS, type EquipmentReview } from '@domain/profiles/catalogEquipment';
import * as loader from '../../catalog/loadCatalog';
import * as storage from '../../catalog/catalogStorage';
import * as local from '../../catalog/localCatalog';
import * as published from '../../catalog/publishedCatalog';

vi.mock('../../catalog/catalogStorage', () => ({ readStoredCatalog: vi.fn(), writeStoredCatalog: vi.fn() }));
vi.mock('../../catalog/localCatalog', () => ({ readLocalCatalog: vi.fn() }));
vi.mock('../../catalog/publishedCatalog', () => ({ readPublishedCatalog: vi.fn() }));
vi.mock('@domain/profiles/catalogEquipment', async importOriginal => ({
  ...await importOriginal<typeof import('@domain/profiles/catalogEquipment')>(), EQUIPMENT_REVIEWS: [],
}));

beforeEach(() => {
  vi.clearAllMocks();
  (EQUIPMENT_REVIEWS as EquipmentReview[]).splice(0);
  vi.mocked(storage.readStoredCatalog).mockResolvedValue(undefined);
  vi.mocked(local.readLocalCatalog).mockResolvedValue('fixture');
  vi.mocked(published.readPublishedCatalog).mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function start(configure?: (fixture: ReturnType<typeof equipmentFixture>) => void) {
  const fixture = equipmentFixture();
  configure?.(fixture);
  (EQUIPMENT_REVIEWS as EquipmentReview[]).push(fixture.review);
  vi.spyOn(loader, 'loadCatalog').mockResolvedValue(fixture.catalog);
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'WH40K' }));
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Buscar unidad atacante' })).toBeTruthy());
  await waitFor(() => expect(screen.queryByText('Cargando perfiles…')).toBeNull());
  return fixture;
}
function chooseAttacker() {
  const search = screen.getByRole('combobox', { name: 'Buscar unidad atacante' });
  fireEvent.focus(search);
  fireEvent.keyDown(search, { key: 'ArrowDown' });
  fireEvent.keyDown(search, { key: 'Enter' });
}

describe('first wizard screen', () => {
  it('starts with a compact summary on mobile and lets it expand without changing the selection', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    await start(); chooseAttacker();
    const summary = screen.getByText('Tu selección', { selector: 'summary' });
    const disclosure = summary.closest('details')!;
    expect(disclosure.open).toBe(false);
    fireEvent.click(summary);
    expect(disclosure.open).toBe(true);
    fireEvent.click(summary);
    expect(disclosure.open).toBe(false);
    expect((screen.getByLabelText('Miniaturas que atacan') as HTMLInputElement).value).toBe('10');
  });
  it('accepts the composition when a default weapon requires a defender that has not been chosen yet', async () => {
    await start(({ catalog }) => {
      catalog.weaponModes.find(mode => mode.id === 'bolter-mode')!.targetCondition = {
        state: 'reviewed', match: 'any', keywordIds: ['target-keyword'], ruleIds: [],
      };
    });
    chooseAttacker();
    expect((screen.getByLabelText('Miniaturas que atacan') as HTMLInputElement).value).toBe('10');
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText('Buscar unidad defensora')).toBeTruthy();
    expect(screen.queryByText('Bajas medias')).toBeNull();
  });
  it('loads a composition without requesting a weapon or defender, and defers calculations', async () => {
    const execute = vi.spyOn(CalculateUnitCombatUseCase.prototype, 'execute');
    await start(); chooseAttacker();
    expect(screen.getByRole('heading', { name: 'Elige quién ataca' })).toBeTruthy();
    expect((screen.getByLabelText('Miniaturas que atacan') as HTMLInputElement).value).toBe('10');
    expect(screen.queryByLabelText('Variante de miniatura')).toBeNull();
    expect(screen.queryByLabelText('Modo de arma')).toBeNull();
    expect(screen.queryByLabelText('Buscar unidad defensora')).toBeNull();
    expect(screen.queryByText('Bajas medias')).toBeNull();
    expect(screen.getByText('bolter + fist')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mejoras' }));
    expect(screen.getByRole('heading', { name: 'Elige quién ataca' })).toBeTruthy();
    expect(execute).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('combobox', { name: 'Buscar unidad defensora' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Elige quién ataca' })).toBeNull();
  });

  it('keeps an empty quantity on blur and mode changes, and blocks continuation until corrected', async () => {
    await start(); chooseAttacker();
    const quantity = screen.getByLabelText('Miniaturas que atacan') as HTMLInputElement;
    fireEvent.change(quantity, { target: { value: '' } }); fireEvent.blur(quantity);
    fireEvent.click(screen.getByRole('button', { name: 'Ataques necesarios' }));
    expect((screen.getByLabelText('Miniaturas que atacan') as HTMLInputElement).value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('alert').textContent).toContain('cantidad entera');
    expect(screen.queryByLabelText('Buscar unidad defensora')).toBeNull();
    fireEvent.change(quantity, { target: { value: '11' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('heading', { name: 'Elige quién ataca' })).toBeTruthy();
    fireEvent.change(quantity, { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('heading', { name: 'Elige quién recibe el ataque' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Cambiar atacante/ }));
    expect((screen.getByLabelText('Miniaturas que atacan') as HTMLInputElement).value).toBe('8');
  });

  it('requires a unit but lets a manual attacker proceed without a name', async () => {
    await start();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('alert').textContent).toContain('Elige una unidad atacante');
    fireEvent.click(screen.getByRole('button', { name: 'Entrada manual' }));
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('heading', { name: 'Elige quién recibe el ataque' })).toBeTruthy();
  });

  it('separates an individual profile from the composition and preserves the defender when changing attacker', async () => {
    await start(); chooseAttacker();
    fireEvent.click(screen.getByRole('button', { name: 'Configurar un perfil individual' }));
    expect(screen.getByLabelText('Variante de miniatura')).toBeTruthy();
    expect((screen.getByLabelText('Miniaturas que atacan') as HTMLInputElement).value).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    const defender = screen.getByRole('combobox', { name: 'Buscar unidad defensora' });
    fireEvent.focus(defender); fireEvent.keyDown(defender, { key: 'ArrowDown' }); fireEvent.keyDown(defender, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: /Cambiar atacante/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar unidad' }));
    chooseAttacker();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getAllByRole('heading', { name: 'Synthetic unit' }).length).toBe(2);
  });

  it('preserves equipped alternatives when changing participating models and leaves their correction to the attack setup', async () => {
    await start(); chooseAttacker();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    const defender = screen.getByRole('combobox', { name: 'Buscar unidad defensora' });
    fireEvent.focus(defender); fireEvent.keyDown(defender, { key: 'ArrowDown' }); fireEvent.keyDown(defender, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Otro equipo' }));
    fireEvent.change(within(screen.getByRole('group', { name: 'Equipo 1' })).getByLabelText('Portadores'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /Cambiar atacante/ }));
    fireEvent.change(screen.getByLabelText('Miniaturas que atacan'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect((within(screen.getByRole('group', { name: 'Equipo 1' })).getByLabelText('Portadores') as HTMLInputElement).value).toBe('2');
    expect(screen.getByRole('alert').textContent).toContain('No caben los portadores');
  });
});
