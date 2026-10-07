import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { validateCatalog, type ProfileCatalog, type CatalogMode } from '@domain/profiles/catalog';
import { syntheticCatalog, syntheticTrust } from '@domain/profiles/catalogFixture';
import * as loader from './loadCatalog';
import * as storage from './catalogStorage';
import * as local from './localCatalog';

vi.mock('./catalogStorage', () => ({ readStoredCatalog: vi.fn(), writeStoredCatalog: vi.fn() }));
vi.mock('./localCatalog', () => ({ readLocalCatalog: vi.fn() }));
const id = (prefix: string, digit = '2') => `${prefix}_${digit.repeat(24)}`;
function fixture(): ProfileCatalog {
  const catalog = validateCatalog(syntheticCatalog(), syntheticTrust);
  const unit = catalog.units[0], miniature = catalog.miniatures[0];
  unit.name = 'Élite Unit';
  catalog.units.push({ ...unit, id: id('u'), name: 'Target Unit', miniatureIds: [id('m')], equipmentChoiceIds: [] });
  catalog.miniatures.push({ ...miniature, id: id('m'), unitId: id('u'), name: 'Target model',
    characteristics: { ...miniature.characteristics, woundsMax: { raw: '3', normalized: 3, status: 'parsed' } } });
  catalog.weapons.push({ id: id('w'), name: 'Synthetic weapon', modeIds: [id('wm'), id('wm', '3'), id('wm', '4')], ruleIds: [] });
  catalog.equipmentChoices.push({ id: id('eq'), unitId: unit.id, miniatureId: miniature.id, kind: 'default',
    weaponIds: [id('w')], min: 1, max: 1, allowDuplicates: false, conditionRuleIds: [] });
  const fixed = (value: number) => ({ raw: String(value), normalized: { kind: 'fixed' as const, value }, status: 'parsed' as const });
  const mode: CatalogMode = { id: id('wm'), weaponId: id('w'), name: 'Standard', type: 'ranged',
    range: { raw: '24"', normalized: { kind: 'inches', value: 24 }, status: 'parsed' },
    characteristics: { attacks: fixed(2), ballisticSkill: { raw: '3+', normalized: 3, status: 'parsed' },
      weaponSkill: { raw: null, normalized: null, status: 'not-applicable' }, strength: fixed(5),
      armourPenetration: { raw: '-1', normalized: 1, status: 'parsed' }, damage: fixed(2) },
    targetCondition: { state: 'not-applicable', match: null, keywordIds: [], ruleIds: [] }, ruleIds: [] };
  catalog.weaponModes.push(mode, { ...mode, id: id('wm', '3'), name: 'Heavy', ruleIds: [id('r')] },
    { ...mode, id: id('wm', '4'), name: 'Hunter', targetCondition: { state: 'reviewed', match: 'any', keywordIds: [id('k')], ruleIds: [] } });
  catalog.rules.push({ id: id('r'), name: 'Heavy', description: 'Requires context', reviewState: 'reviewed', reviewVersion: '1.0.0',
    capabilityId: 'heavy', parameters: {}, requiredContext: ['phase', 'engaged', 'setUpThisTurn', 'movedOverThree'] });
  return catalog;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(storage.readStoredCatalog).mockResolvedValue({ version: 1, text: 'synthetic' });
  vi.mocked(storage.writeStoredCatalog).mockResolvedValue();
  vi.mocked(local.readLocalCatalog).mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
async function start(catalog = fixture()) {
  vi.spyOn(loader, 'loadCatalog').mockResolvedValue(catalog);
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'WH40K' }));
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Buscar unidad atacante' })).toBeTruthy());
  return catalog;
}
function choose(label: string, name: string) {
  const input = screen.getByRole('combobox', { name: label });
  fireEvent.focus(input); fireEvent.change(input, { target: { value: name } });
  fireEvent.click(screen.getByRole('option', { name: `${name} Synthetic faction` }));
}
function selectProfiles(mode = id('wm')) {
  choose('Buscar unidad atacante', 'Élite Unit');
  fireEvent.change(screen.getByLabelText('Modo de arma'), { target: { value: mode } });
  choose('Buscar unidad defensora', 'Target Unit');
}

describe('squad catalog selection', () => {
  it('keeps applied compositions visible on both sides before choosing weapons', async () => {
    const catalog = fixture();
    const first = catalog.miniatures[0];
    const alternateId = id('m', '5');
    catalog.miniatures.push({ ...first, id: alternateId, name: 'Alternate model' });
    const compositions = [
      { id: id('c'), unitId: catalog.units[0].id, isDefault: true,
        members: [{ miniatureId: first.id, min: 9, max: 9 }, { miniatureId: alternateId, min: 1, max: 1 }], conditionRuleIds: [] },
      { id: id('c', '3'), unitId: catalog.units[0].id, isDefault: false,
        members: [{ miniatureId: first.id, min: 18, max: 18 }, { miniatureId: alternateId, min: 2, max: 2 }], conditionRuleIds: [] },
    ];
    catalog.compositions.push(...compositions);
    await start(catalog);
    choose('Buscar unidad atacante', 'Élite Unit');
    const attacker = screen.getByRole('combobox', { name: 'Atacante · Aplicar composición del catálogo' }) as HTMLSelectElement;
    fireEvent.change(attacker, { target: { value: compositions[1].id } });
    expect(attacker.value).toBe(compositions[1].id);
    expect((screen.getByLabelText('Miniaturas que atacan') as HTMLInputElement).value).toBe('20');
    expect(screen.getByText('Composición y equipo')).toBeTruthy();
    expect(screen.getByText('Composición aplicada. Puedes ajustar las cantidades actuales y el equipo.')).toBeTruthy();
    fireEvent.change(attacker, { target: { value: compositions[0].id } });
    expect(attacker.value).toBe(compositions[0].id);
    choose('Buscar unidad defensora', 'Élite Unit');
    const defender = screen.getByRole('combobox', { name: 'Defensor · Aplicar composición del catálogo' }) as HTMLSelectElement;
    fireEvent.change(defender, { target: { value: compositions[0].id } });
    expect(defender.value).toBe(compositions[0].id);
    expect((screen.getByLabelText('Miniaturas restantes') as HTMLInputElement).value).toBe('10');
    fireEvent.click(screen.getByRole('button', { name: 'Ataques necesarios' }));
    expect((screen.getByRole('combobox', { name: 'Atacante · Aplicar composición del catálogo' }) as HTMLSelectElement).value).toBe(compositions[0].id);
    expect((screen.getByRole('combobox', { name: 'Defensor · Aplicar composición del catálogo' }) as HTMLSelectElement).value).toBe(compositions[0].id);
    choose('Buscar unidad defensora', 'Target Unit');
    expect(screen.queryByRole('combobox', { name: 'Defensor · Aplicar composición del catálogo' })).toBeNull();
    expect((screen.getByLabelText('Miniaturas que atacan') as HTMLInputElement).value).toBe('10');
  });

  it('applies the defender independently of a pending conditional attacking mode', async () => {
    const catalog = fixture();
    const composition = { id: id('c'), unitId: catalog.units[1].id, isDefault: true,
      members: [{ miniatureId: catalog.miniatures[1].id, min: 5, max: 5 }], conditionRuleIds: [] };
    catalog.compositions.push(composition, { ...composition, id: id('c', '3'), isDefault: false,
      members: [{ miniatureId: catalog.miniatures[1].id, min: 10, max: 10 }] });
    await start(catalog); selectProfiles(id('wm', '4'));
    const defender = screen.getByRole('combobox', { name: 'Defensor · Aplicar composición del catálogo' }) as HTMLSelectElement;
    fireEvent.change(defender, { target: { value: composition.id } });
    expect(defender.value).toBe(composition.id);
    expect((screen.getByLabelText('Miniaturas restantes') as HTMLInputElement).value).toBe('5');
    expect(screen.getByText(/Este modo no es compatible/)).toBeTruthy();
    expect(screen.queryByText('Bajas medias')).toBeNull();
  });

  it('resolves additional equipment and requires explicit acceptance of omitted squad effects', async () => {
    const catalog = fixture();
    const ruleId = id('r', '7');
    catalog.rules.push({ id: ruleId, name: 'Synthetic pending rule', description: 'Omitted effect', reviewState: 'pending',
      reviewVersion: null, capabilityId: null, parameters: {}, requiredContext: [] });
    catalog.units[0].ruleIds = [...catalog.units[0].ruleIds, ruleId];
    await start(catalog); selectProfiles();
    fireEvent.change(screen.getByLabelText('Miniaturas que atacan'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Miniaturas restantes'), { target: { value: '5' } });
    expect(screen.queryByText('Bajas medias')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Calcular la escuadra omitiendo las habilidades indicadas' }));
    expect(screen.getByText('Bajas medias')).toBeTruthy();
    fireEvent.click(screen.getByText('Composición y equipo'));
    fireEvent.click(screen.getByRole('button', { name: 'Añadir grupo con otro equipo' }));
    expect(screen.getByText('Grupo principal: 9 miniaturas')).toBeTruthy();
    expect(screen.getByText('Bajas medias')).toBeTruthy();
  });
});
describe('catalog selection workflow', () => {
  it('selects independent sides automatically and keeps selections across calculators', async () => {
    await start(); selectProfiles();
    expect(screen.queryByText('Aplicar arma')).toBeNull();
    expect(screen.getByText('Probabilidad de eliminar la miniatura')).toBeTruthy();
    expect(screen.queryByRole('spinbutton', { name: 'Fuerza (F)' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Heridas restantes'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ataques necesarios' }));
    expect((screen.getByRole('combobox', { name: 'Buscar unidad atacante' }) as HTMLInputElement).value).toBe('Élite Unit');
    expect((screen.getByLabelText('Heridas restantes') as HTMLInputElement).value).toBe('1');
    choose('Buscar unidad defensora', 'Élite Unit');
    expect((screen.getByLabelText('Heridas restantes') as HTMLInputElement).value).toBe('2');
    expect((screen.getByLabelText('Modo de arma') as HTMLSelectElement).value).toBe(id('wm'));
  });
  it('keeps Heavy context visible and does not interpret unknown as false', async () => {
    await start(); selectProfiles(id('wm', '3'));
    expect(screen.getByLabelText('Fase').closest('details')).toBeNull();
    expect(screen.queryByText('Probabilidad de eliminar la miniatura')).toBeNull();
    fireEvent.change(screen.getByLabelText('Fase'), { target: { value: 'shooting' } });
    for (const label of ['Unidad trabada', 'Desplegada este turno', 'Alguna miniatura movió más de 3 pulgadas']) {
      fireEvent.change(screen.getByLabelText(label), { target: { value: 'false' } });
    }
    expect(screen.getByText('Probabilidad de eliminar la miniatura')).toBeTruthy();
  });
  it('keeps an incompatible mode pending until a valid mode is chosen', async () => {
    await start(); selectProfiles(id('wm', '4'));
    expect(screen.getByText(/Este modo no es compatible/)).toBeTruthy();
    expect(screen.queryByText('Probabilidad de eliminar la miniatura')).toBeNull();
    fireEvent.change(screen.getByLabelText('Modo de arma'), { target: { value: id('wm') } });
    expect(screen.getByText('Probabilidad de eliminar la miniatura')).toBeTruthy();
  });
  it.each(['pending', 'out-of-scope'] as const)('calculates automatically with %s effects and retains partial notices across calculators and context changes', async reviewState => {
    const catalog = fixture();
    catalog.rules.push({ id: id('r', '3'), name: 'Omitted effect', description: 'May affect damage',
      reviewState, reviewVersion: null, capabilityId: null, parameters: {}, requiredContext: [] });
    catalog.weaponModes[0].ruleIds.push(id('r', '3'));
    await start(catalog); selectProfiles();
    expect(screen.queryByRole('checkbox', { name: 'Calcular sin estas habilidades' })).toBeNull();
    expect(screen.getByText('Este cálculo omite habilidades del perfil.')).toBeTruthy();
    expect(screen.getByText('Omitted effect: May affect damage')).toBeTruthy();
    expect(screen.getByText('Cálculo parcial')).toBeTruthy();
    expect(screen.getByText('Probabilidad de eliminar la miniatura')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Objetivo en cobertura' }));
    expect(screen.getByText('Cálculo parcial')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Estadísticas resultantes' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ataques necesarios' }));
    expect(screen.getByText('Cálculo parcial')).toBeTruthy();
    expect(screen.getByText('Necesitas', { exact: false })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mejoras' }));
    expect(screen.getByText('Cálculo parcial')).toBeTruthy();
    expect(screen.getByText('Mejor opción ofensiva:')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Combate$/ }));
    choose('Buscar unidad defensora', 'Élite Unit');
    expect(screen.queryByRole('checkbox', { name: 'Calcular sin estas habilidades' })).toBeNull();
    expect(screen.getByText('Cálculo parcial')).toBeTruthy();
    expect(screen.getByText('Probabilidad de eliminar la miniatura')).toBeTruthy();
    choose('Buscar unidad atacante', 'Target Unit');
    expect(screen.queryByText('Cálculo parcial')).toBeNull();
    expect(screen.queryByText('Este cálculo omite habilidades del perfil.')).toBeNull();
    expect(screen.queryByText('Probabilidad de eliminar la miniatura')).toBeNull();
  });
});
