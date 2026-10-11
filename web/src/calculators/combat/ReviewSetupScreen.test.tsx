import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { CatalogProvider, useCatalog } from '../../catalog/CatalogContext';
import { CombatScenarioProvider, useCombatScenario } from './CombatScenarioContext';
import { CombatWorkspace } from './CombatWorkspace';
import { validateReview, orderReviewDefenders } from './wizardValidation';
import { equipmentFixture } from '@application/dice/catalogEquipmentFixture';
import { EQUIPMENT_REVIEWS, type EquipmentReview } from '@domain/profiles/catalogEquipment';
import { CalculateUnitCombatUseCase } from '@application/dice/CalculateUnitCombatUseCase';
import { CalculateSquadCombatUseCase } from '@application/dice/CalculateSquadCombatUseCase';
import * as loader from '../../catalog/loadCatalog';
import * as storage from '../../catalog/catalogStorage';
import * as local from '../../catalog/localCatalog';

vi.mock('../../catalog/catalogStorage', () => ({ readStoredCatalog: vi.fn(), writeStoredCatalog: vi.fn() }));
vi.mock('../../catalog/localCatalog', () => ({ readLocalCatalog: vi.fn() }));
vi.mock('@domain/profiles/catalogEquipment', async original => ({ ...await original<typeof import('@domain/profiles/catalogEquipment')>(), EQUIPMENT_REVIEWS: [] }));
beforeEach(() => {
  vi.clearAllMocks(); (EQUIPMENT_REVIEWS as EquipmentReview[]).splice(0);
  vi.mocked(storage.readStoredCatalog).mockResolvedValue({ version: 1, text: 'fixture' });
  vi.mocked(local.readLocalCatalog).mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
function Probe() {
  const { clear } = useCatalog();
  const { setParams, confirmedScenario } = useCombatScenario();
  return <><button onClick={clear}>Retirar catálogo en prueba</button>
    <button onClick={() => setParams(p => ({ ...p, damage: 12, defenderGroups: p.defenderGroups?.map(g => ({ ...g, count: 2 })) }))}>Modificar borrador en prueba</button>
    <output data-testid="confirmed">{JSON.stringify(confirmedScenario)}</output></>;
}
async function start(configure?: (f: ReturnType<typeof equipmentFixture>) => void, probe = false) {
  const f = equipmentFixture(); configure?.(f); (EQUIPMENT_REVIEWS as EquipmentReview[]).push(f.review);
  vi.spyOn(loader, 'loadCatalog').mockResolvedValue(f.catalog);
  await act(async () => { render(probe ? <CatalogProvider><CombatScenarioProvider><CombatWorkspace mode="combat" /><Probe /></CombatScenarioProvider></CatalogProvider> : <App />); });
  if (!probe) click('WH40K');
  return f;
}
function choose(label: string) {
  const input = screen.getByLabelText(label); fireEvent.focus(input); fireEvent.change(input, { target: { value: 'Synthetic unit' } });
  fireEvent.click(screen.getByRole('option', { name: 'Synthetic unit Synthetic faction' }));
}
function prepare() { choose('Buscar unidad atacante'); click('Continuar'); choose('Buscar unidad defensora'); click('Continuar'); }
function pendingRule(f: ReturnType<typeof equipmentFixture>, id = 'pending') {
  f.catalog.rules.push({ id, name: id, description: 'Omitted effect', reviewState: 'pending', reviewVersion: null, capabilityId: null, parameters: {}, requiredContext: [] });
}

describe('review and confirmation', () => {
  it('shows composition, disjoint carriers, wound priority and the required report objective without calculating', async () => {
    const execute = vi.spyOn(CalculateSquadCombatUseCase.prototype, 'execute');
    await start(); choose('Buscar unidad atacante'); click('Continuar'); choose('Buscar unidad defensora');
    fireEvent.click(screen.getByRole('checkbox', { name: '¿Hay una miniatura herida?' }));
    change('Grupo de la miniatura herida', screen.getByLabelText('Grupo de la miniatura herida').querySelectorAll('option')[1].value);
    click('Continuar'); click('Otro equipo');
    fireEvent.change(within(screen.getByRole('group', { name: 'Equipo 1' })).getByLabelText('Portadores'), { target: { value: '1' } });
    change('cyclone · Modo de arma', 'frag'); click('Ataques necesarios'); click('95%'); change('Objetivo de bajas', '2'); click('Revisar escenario');
    const attacker = screen.getByRole('region', { name: 'Atacante' });
    expect(attacker.textContent).toContain('Composición inicial10'); expect(attacker.textContent).toContain('Participan10');
    const defender = screen.getByRole('region', { name: 'Defensor' });
    expect(within(defender).getAllByRole('listitem')[0].textContent).toContain('1 × Sergeant');
    expect(defender.textContent).toContain('Una miniatura empieza con 1 herida de 2');
    const attack = screen.getByRole('region', { name: 'Ataque' });
    const weapons = within(attack).getByRole('list').children;
    expect(weapons.length).toBe(4); expect(attack.textContent).toContain('cyclone · frag');
    expect(Array.from(weapons).map(w => w.querySelector('.wizard-review-weapon-heading > span')?.textContent)).toEqual(['Portadores: 8', 'Portadores: 1', 'Portadores: 1', 'Portadores: 1']);
    const objective = screen.getByRole('region', { name: 'Objetivo del cálculo' });
    expect(objective.textContent).toContain('95%'); expect(objective.textContent).toContain('Objetivo de bajas2'); expect(objective.textContent).toContain('Activaciones');
    expect(execute).not.toHaveBeenCalled();
    click('Cambiar objetivo'); expect(document.activeElement?.id).toBe('wizard-attack-objective');
    click('Guardar y revisar'); expect(execute).not.toHaveBeenCalled();
  });

  it('offers direct edits and returns to review after a valid quantity change', async () => {
    const execute = vi.spyOn(CalculateUnitCombatUseCase.prototype, 'execute');
    await start(); click('Entrada manual'); click('Continuar'); click('Continuar'); click('Revisar escenario');
    click('Cambiar atacante'); change('Miniaturas que atacan', '2'); click('Guardar y revisar');
    expect(screen.getByRole('heading', { name: 'Revisa el escenario' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Atacante' }).textContent).toContain('Participan2');
    expect(execute).not.toHaveBeenCalled(); click('Generar informe'); expect(execute).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Ataques por portador')).toBeNull();
    click('← Cambiar defensor'); change('Heridas restantes', '1'); click('Guardar y revisar');
    expect(execute).toHaveBeenCalledTimes(1); click('Generar informe'); expect(execute).toHaveBeenCalledTimes(2);
  });

  it('remembers an incomplete attack field when a different section is edited', async () => {
    const execute = vi.spyOn(CalculateUnitCombatUseCase.prototype, 'execute');
    await start(); click('Entrada manual'); click('Continuar'); click('Continuar'); click('Revisar escenario');
    click('Cambiar ataque'); change('Fuerza (F)', ''); click('Cambiar defensor');
    change('Heridas restantes', '1'); click('Guardar y revisar');
    // A dependent unfinished section is reopened instead of treating its last accepted value as complete.
    expect(screen.getByRole('heading', { name: 'Configura el ataque' })).toBeTruthy();
    expect((screen.getByLabelText('Fuerza (F)') as HTMLInputElement).value).toBe('');
    click('Guardar y revisar'); expect(screen.getByRole('alert').textContent).toContain('Fuerza');
    expect(execute).not.toHaveBeenCalled(); change('Fuerza (F)', '4'); click('Guardar y revisar');
    expect(screen.getByRole('heading', { name: 'Revisa el escenario' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('aggregates omitted rules once and blocks squad confirmation until explicitly accepted', async () => {
    const execute = vi.spyOn(CalculateSquadCombatUseCase.prototype, 'execute');
    await start(f => { pendingRule(f); f.catalog.units[0].ruleIds.push('pending'); }); prepare(); click('Revisar escenario');
    expect(screen.getAllByText('pending: Omitted effect')).toHaveLength(1);
    click('Generar informe'); expect(screen.getByRole('alert').textContent).toContain('Acepta las omisiones'); expect(execute).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBe(document.activeElement);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Calcular la escuadra omitiendo las habilidades indicadas' }));
    click('Cambiar defensor'); change('Miniaturas restantes', '3'); click('Guardar y revisar');
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
    click('Generar informe'); expect(execute).toHaveBeenCalledTimes(1); expect(screen.getByText('Cálculo parcial')).toBeTruthy();
    const before = execute.mock.calls.length;
    change('Objetivo de bajas', '1'); expect(execute.mock.calls.length).toBe(before);
  });

  it('invalidates acceptance after the effective omitted set changes, even when returning to the previous weapon', async () => {
    const execute = vi.spyOn(CalculateSquadCombatUseCase.prototype, 'execute');
    await start(f => { pendingRule(f); pendingRule(f, 'frag-only'); f.catalog.units[0].ruleIds.push('pending'); f.catalog.weaponModes.find(m => m.id === 'frag')!.ruleIds.push('frag-only'); });
    prepare(); click('Otro equipo');
    fireEvent.change(within(screen.getByRole('group', { name: 'Equipo 1' })).getByLabelText('Portadores'), { target: { value: '1' } });
    click('Revisar escenario'); fireEvent.click(screen.getByRole('checkbox')); click('Cambiar ataque'); change('cyclone · Modo de arma', 'frag'); click('Guardar y revisar');
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
    click('Generar informe'); expect(execute).not.toHaveBeenCalled();
    click('Cambiar ataque'); change('cyclone · Modo de arma', 'krak'); click('Guardar y revisar');
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  });

  it('automatically applies individual omissions without adding an acceptance checkbox', async () => {
    const execute = vi.spyOn(CalculateUnitCombatUseCase.prototype, 'execute');
    await start(f => { pendingRule(f); f.catalog.units[0].ruleIds.push('pending'); });
    choose('Buscar unidad atacante'); click('Configurar un perfil individual'); click('Continuar');
    choose('Buscar unidad defensora'); click('Configurar un perfil individual'); click('Continuar'); change('Modo de arma', 'bolter-mode'); click('Revisar escenario');
    expect(screen.queryByRole('checkbox')).toBeNull(); expect(screen.getByText('Las omisiones se aplican automáticamente al cálculo individual.')).toBeTruthy();
    click('Generar informe'); expect(execute).toHaveBeenCalledTimes(1);
  });

  it('revalidates the current catalog at confirmation and links expired selections to their screens', async () => {
    const execute = vi.spyOn(CalculateSquadCombatUseCase.prototype, 'execute');
    await start(undefined, true); prepare(); click('Revisar escenario'); click('Retirar catálogo en prueba'); click('Generar informe');
    const alert = screen.getByRole('alert'); expect(alert.textContent).toContain('otro catálogo'); expect(execute).not.toHaveBeenCalled();
    fireEvent.click(within(alert).getAllByRole('button')[0]); expect(screen.getByRole('heading', { name: 'Elige quién ataca' })).toBeTruthy();
  });

  it('keeps the confirmed effective scenario independent of later draft and catalog changes', async () => {
    const execute = vi.spyOn(CalculateSquadCombatUseCase.prototype, 'execute');
    await start(undefined, true); prepare(); click('Revisar escenario'); click('Generar informe');
    const captured = screen.getByTestId('confirmed').textContent;
    expect(execute).toHaveBeenCalledTimes(1); expect(screen.getByText('Bajas medias')).toBeTruthy();
    click('Modificar borrador en prueba'); click('Retirar catálogo en prueba');
    expect(screen.getByTestId('confirmed').textContent).toBe(captured); expect(screen.getByText('Bajas medias')).toBeTruthy(); expect(execute).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/^El catálogo ha cambiado/)).toBeTruthy();
    click('Revisar escenario'); click('Generar informe'); expect(screen.getByRole('alert')).toBeTruthy(); expect(execute).toHaveBeenCalledTimes(1);
  });

  it('rejects expired identities and unsupported squad inputs without executing probability engines', () => {
    const f = equipmentFixture(); const params = { ...f.base, catalogSelection: { ...f.base.catalogSelection!, modeId: 'bolter-mode' } };
    const expired = validateReview({ ...f.catalog, catalogVersion: 'next' }, params, 'catalog', 'combat', 90);
    expect(expired.issues.some(issue => issue.step === 1)).toBe(true);
    const unsupported = validateReview(null, { ...params, catalogSelection: undefined, guaranteedHitSix: true }, 'manual', 'combat', 90);
    expect(unsupported.issues.some(issue => issue.message.includes('dados observados'))).toBe(true);
    const p = { ...params, catalogSelection: undefined };
    const groups = [{ id: 'a', profile: p }, { id: 'b', profile: { ...p, baseSave: 4 } }, { id: 'c', profile: p }, { id: 'character', profile: { ...p, targetWounds: 1, woundsMax: 2 }, isCharacter: true }];
    expect(orderReviewDefenders(groups).map(g => g.id)).toEqual(['a', 'c', 'b', 'character']);
  });
});
