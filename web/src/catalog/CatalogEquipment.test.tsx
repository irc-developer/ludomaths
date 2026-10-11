import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LegacyCombatHarness } from '../test/LegacyCombatHarness';
import { equipmentFixture } from '@application/dice/catalogEquipmentFixture';
import { EQUIPMENT_REVIEWS, type EquipmentReview } from '@domain/profiles/catalogEquipment';
import * as loader from './loadCatalog';
import * as storage from './catalogStorage';
import * as local from './localCatalog';
import * as published from './publishedCatalog';

vi.mock('./catalogStorage', () => ({ readStoredCatalog: vi.fn(), writeStoredCatalog: vi.fn() }));
vi.mock('./localCatalog', () => ({ readLocalCatalog: vi.fn() }));
vi.mock('./publishedCatalog', () => ({ readPublishedCatalog: vi.fn() }));
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
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
async function start(pending = false) {
  const { catalog, review } = equipmentFixture();
  if (pending) {
    for (const id of ['unit-pending', 'frag-pending']) catalog.rules.push({ id, name: id, description: 'Synthetic omitted effect',
      reviewState: 'pending', reviewVersion: null, capabilityId: null, parameters: {}, requiredContext: [] });
    catalog.units[0].ruleIds.push('unit-pending');
    catalog.weaponModes.find(mode => mode.id === 'frag')!.ruleIds.push('frag-pending');
  }
  catalog.compositions.push({ ...catalog.compositions[0], id: 'five', isDefault: false,
    members: [{ miniatureId: 'ordinary', min: 4, max: 4 }, { miniatureId: 'sergeant', min: 1, max: 1 }] });
  (EQUIPMENT_REVIEWS as EquipmentReview[]).push(review);
  vi.spyOn(loader, 'loadCatalog').mockResolvedValue(catalog);
  render(<LegacyCombatHarness />);
  fireEvent.click(screen.getByRole('button', { name: 'WH40K' }));
  await waitFor(() => expect(screen.getByLabelText('Buscar unidad atacante')).toBeTruthy());
  function choose(label: string) {
    const input = screen.getByLabelText(label);
    fireEvent.focus(input); fireEvent.change(input, { target: { value: 'Synthetic unit' } });
    fireEvent.click(screen.getByRole('option', { name: 'Synthetic unit Synthetic faction' }));
  }
  choose('Buscar unidad atacante');
  choose('Buscar unidad defensora');
  fireEvent.change(screen.getByLabelText('Defensor · Aplicar composición del catálogo'), { target: { value: 'ten' } });
  return catalog;
}
const summary = () => within(screen.getByRole('table', { name: 'Armas resultantes' }));
const add = () => fireEvent.click(screen.getByRole('button', { name: 'Otro equipo' }));
const carriers = (index: number, count: number) => fireEvent.change(within(screen.getByRole('group', { name: `Equipo ${index}` })).getByLabelText('Portadores'), { target: { value: String(count) } });

describe('simple mixed equipment selection', () => {
  it('loads defaults, mixes two alternatives and shares their quantities across calculators', async () => {
    await start();
    expect(summary().getByText('10')).toBeTruthy();
    add(); carriers(1, 1);
    add(); carriers(2, 1);
    expect(summary().getByText('9')).toBeTruthy();
    expect(summary().getByText('cyclone · krak')).toBeTruthy();
    expect(summary().getByText('flamer · flamer-mode')).toBeTruthy();
    expect(screen.getByText('Bajas medias')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ataques necesarios' }));
    expect(summary().getByText('9')).toBeTruthy();
    expect((within(screen.getByRole('group', { name: 'Equipo 2' })).getByLabelText('Portadores') as HTMLInputElement).value).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Mejoras' }));
    expect(summary().getByText('9')).toBeTruthy();
  });

  it('retains an invalid draft and blocks stale results until the shared limit is corrected', async () => {
    await start(); add(); carriers(1, 2); add(); carriers(2, 1);
    expect(screen.getByText(/Las alternativas comparten/)).toBeTruthy();
    expect(screen.queryByText('Bajas medias')).toBeNull();
    expect(screen.queryByRole('table', { name: 'Armas resultantes' })).toBeNull();
    carriers(2, 0);
    expect(summary().getByText('10')).toBeTruthy();
    expect(screen.getByText('Bajas medias')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Miniaturas que atacan'), { target: { value: '2' } });
    expect(screen.getByText(/No caben los portadores/)).toBeTruthy();
    carriers(1, 1);
    expect(summary().getByText('2')).toBeTruthy();
  });

  it('keeps exclusive modes and equipment on attack-type switches and allows manual editing', async () => {
    await start(); add(); carriers(1, 2);
    fireEvent.change(screen.getByLabelText('cyclone · Modo de arma'), { target: { value: 'frag' } });
    expect(summary().getByText('cyclone · frag')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Tipo de ataque' }), { target: { value: 'melee' } });
    expect(summary().getByText('fist · fist-mode')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Tipo de ataque' }), { target: { value: 'ranged' } });
    expect(summary().getByText('cyclone · frag')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Editar grupos manualmente' }));
    expect(screen.queryByRole('table', { name: 'Armas resultantes' })).toBeNull();
    fireEvent.click(screen.getByText('Composición y equipo'));
    expect(screen.getByRole('button', { name: 'Añadir grupo con otro equipo' })).toBeTruthy();
  });

  it('reinitializes the loadout when a different initial composition is selected', async () => {
    await start(); add(); carriers(1, 2);
    fireEvent.change(screen.getByLabelText('Atacante · Aplicar composición del catálogo'), { target: { value: 'five' } });
    expect(summary().getByText('5')).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Equipo 1' })).toBeNull();
  });

  it('retains acceptance for unchanged omissions and requires review when a mode adds an omission', async () => {
    await start(true);
    const acceptance = () => screen.getByRole('checkbox', { name: 'Calcular la escuadra omitiendo las habilidades indicadas' }) as HTMLInputElement;
    fireEvent.click(acceptance());
    add(); carriers(1, 1);
    expect(acceptance().checked).toBe(true);
    expect(screen.getByText('Bajas medias')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('cyclone · Modo de arma'), { target: { value: 'frag' } });
    expect(acceptance().checked).toBe(false);
    expect(screen.queryByText('Bajas medias')).toBeNull();
    fireEvent.click(acceptance());
    expect(screen.getByText('Bajas medias')).toBeTruthy();
  });
});
