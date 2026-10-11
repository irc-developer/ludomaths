import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { equipmentFixture } from '@application/dice/catalogEquipmentFixture';
import { EQUIPMENT_REVIEWS, type EquipmentReview } from '@domain/profiles/catalogEquipment';
import { CalculateUnitCombatUseCase } from '@application/dice/CalculateUnitCombatUseCase';
import { CalculateSquadCombatUseCase } from '@application/dice/CalculateSquadCombatUseCase';
import { CalculateRequiredAttacksUseCase } from '@application/dice/CalculateRequiredAttacksUseCase';
import * as loader from '../../catalog/loadCatalog';
import * as storage from '../../catalog/catalogStorage';
import * as local from '../../catalog/localCatalog';

vi.mock('../../catalog/catalogStorage', () => ({ readStoredCatalog: vi.fn(), writeStoredCatalog: vi.fn() }));
vi.mock('../../catalog/localCatalog', () => ({ readLocalCatalog: vi.fn() }));
vi.mock('@domain/profiles/catalogEquipment', async original => ({ ...await original<typeof import('@domain/profiles/catalogEquipment')>(), EQUIPMENT_REVIEWS: [] }));
beforeEach(() => {
  vi.clearAllMocks();
  (EQUIPMENT_REVIEWS as EquipmentReview[]).splice(0);
  vi.mocked(storage.readStoredCatalog).mockResolvedValue({ version: 1, text: 'fixture' });
  vi.mocked(local.readLocalCatalog).mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
async function start(manual = true, configure?: (fixture: ReturnType<typeof equipmentFixture>) => void) {
  const fixture = equipmentFixture(); configure?.(fixture);
  (EQUIPMENT_REVIEWS as EquipmentReview[]).push(fixture.review);
  vi.spyOn(loader, 'loadCatalog').mockResolvedValue(fixture.catalog);
  await act(async () => { render(<App />); }); click('WH40K');
  if (manual) click('Entrada manual');
  else await waitFor(() => expect(screen.getByLabelText('Buscar unidad atacante')).toBeTruthy());
  return fixture;
}
function choose(label: string) {
  const search = screen.getByLabelText(label);
  fireEvent.focus(search); fireEvent.change(search, { target: { value: 'Synthetic unit' } });
  fireEvent.click(screen.getByRole('option', { name: 'Synthetic unit Synthetic faction' }));
}
function catalogAttack() {
  choose('Buscar unidad atacante'); click('Continuar'); choose('Buscar unidad defensora'); click('Continuar');
}

describe('defender and attack wizard screens', () => {
  it('isolates decisions and never calculates during preparation, including mode switches and the handoff', async () => {
    const unit = vi.spyOn(CalculateUnitCombatUseCase.prototype, 'execute');
    const squad = vi.spyOn(CalculateSquadCombatUseCase.prototype, 'execute');
    const inverse = vi.spyOn(CalculateRequiredAttacksUseCase.prototype, 'execute');
    await start(); click('Continuar');
    expect(screen.getByRole('heading', { name: 'Elige quién recibe el ataque' })).toBeTruthy();
    expect(screen.queryByLabelText('Fuerza (F)')).toBeNull();
    expect(screen.queryByLabelText('Miniaturas que atacan')).toBeNull();
    change('Heridas restantes', '1'); click('Continuar');
    expect(screen.getByRole('heading', { name: 'Configura el ataque' })).toBeTruthy();
    expect(screen.queryByLabelText('Resistencia del objetivo (R)')).toBeNull();
    click('Ataques necesarios'); expect(screen.queryByLabelText('Ataques por portador')).toBeNull();
    click('95%'); click('Mejoras'); click('Ataques necesarios');
    expect((screen.getByLabelText('Fiabilidad deseada (%)') as HTMLInputElement).value).toBe('95');
    click('Revisar escenario');
    expect(screen.getByRole('heading', { name: 'Revisa el escenario' })).toBeTruthy();
    expect(unit).not.toHaveBeenCalled(); expect(squad).not.toHaveBeenCalled(); expect(inverse).not.toHaveBeenCalled();
    click('Generar informe'); expect(inverse).toHaveBeenCalled();
    expect(screen.queryByLabelText('Heridas restantes')).toBeNull();
  });

  it('keeps empty defensive drafts across blur, back, app tabs and modes; another valid field does not clear their errors', async () => {
    await start(); click('Continuar');
    const wounds = screen.getByLabelText('Heridas restantes');
    fireEvent.focus(wounds); fireEvent.change(wounds, { target: { value: '' } }); fireEvent.blur(wounds);
    change('Salvación de armadura', '4'); click('Ataques necesarios'); click('Continuar');
    expect(screen.getByRole('alert').textContent).toContain('Heridas restantes');
    expect(screen.getByRole('heading', { name: 'Elige quién recibe el ataque' })).toBeTruthy();
    click('← Atrás'); click('Continuar');
    click('Hipergeometrica'); click('WH40K');
    expect((screen.getByLabelText('Heridas restantes') as HTMLInputElement).value).toBe('');
    change('Heridas restantes', '1'); click('Continuar');
    expect(screen.getByRole('heading', { name: 'Configura el ataque' })).toBeTruthy();
  });

  it('requires Heavy context explicitly and retains an empty attack field when revisiting it', async () => {
    await start(); click('Continuar'); click('Continuar');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Heavy' }));
    click('Revisar escenario'); expect(screen.getByRole('alert').textContent).toContain('condiciones');
    change('Fase', 'shooting');
    for (const label of ['Unidad trabada', 'Desplegada este turno', 'Alguna miniatura movió más de 3 pulgadas']) change(label, 'false');
    change('Fuerza (F)', ''); change('Habilidad para impactar', '3');
    click('← Atrás'); click('Continuar'); click('Mejoras');
    expect((screen.getByLabelText('Fuerza (F)') as HTMLInputElement).value).toBe('');
    click('Revisar escenario'); expect(screen.getByRole('alert').textContent).toContain('Fuerza');
    change('Fuerza (F)', '4'); click('Revisar escenario');
    expect(screen.getByRole('heading', { name: 'Revisa el escenario' })).toBeTruthy();
  });

  it('handles a wounded model in a selected group and rejects multiple wounded models and inconsistent totals', async () => {
    await start(false); choose('Buscar unidad atacante'); click('Continuar'); choose('Buscar unidad defensora');
    fireEvent.click(screen.getByRole('checkbox', { name: '¿Hay una miniatura herida?' }));
    change('Grupo de la miniatura herida', screen.getByLabelText('Grupo de la miniatura herida').querySelectorAll('option')[1].value);
    const defense = screen.getByText('Editar grupos defensivos').closest('details')!;
    fireEvent.click(screen.getByText('Editar grupos defensivos'));
    const group = within(defense).getByRole('group', { name: 'Grupo defensor 2' });
    expect((within(group).getByLabelText('Heridas restantes') as HTMLInputElement).value).toBe('1');
    // Making the main group wounded as well is rejected, without running any combat calculation.
    change('Grupo de la miniatura herida', 'primary');
    fireEvent.change(within(group).getByLabelText('Heridas restantes'), { target: { value: '1' } });
    click('Continuar'); expect(screen.getByRole('alert').textContent).toContain('Solo una miniatura');
    fireEvent.change(within(group).getByLabelText('Heridas restantes'), { target: { value: '2' } });
    change('Miniaturas restantes', '1'); click('Continuar');
    expect(screen.getByRole('alert').textContent).toContain('cantidades');
    change('Miniaturas restantes', '3'); click('Continuar');
    expect(screen.getByRole('heading', { name: 'Configura el ataque' })).toBeTruthy();
  });

  it('defers target compatibility to attack and retains equipment after changing the defender', async () => {
    await start(false, ({ catalog }) => {
      catalog.weaponModes.find(m => m.id === 'krak')!.targetCondition = { state: 'reviewed', match: 'any', keywordIds: ['absent'], ruleIds: [] };
    });
    catalogAttack(); click('Otro equipo');
    const carriers = within(screen.getByRole('group', { name: 'Equipo 1' })).getByLabelText('Portadores');
    fireEvent.change(carriers, { target: { value: '1' } });
    expect(screen.getByRole('alert').textContent).toContain('no es compatible');
    click('Cambiar defensor');
    click('Configurar un perfil individual');
    change('Variante de miniatura', 'sergeant'); click('Continuar');
    expect((within(screen.getByRole('group', { name: 'Equipo 1' })).getByLabelText('Portadores') as HTMLInputElement).value).toBe('1');
    click('Revisar escenario');
    expect(screen.getAllByRole('alert').some(alert => alert.textContent?.includes('no es compatible'))).toBe(true);
    change('cyclone · Modo de arma', 'frag'); click('Revisar escenario');
    expect(screen.getByRole('heading', { name: 'Revisa el escenario' })).toBeTruthy();
  });

  it('preserves mixed equipment across attack types, searches activations, and allows omitted rules to reach review', async () => {
    await start(false, ({ catalog }) => {
      catalog.rules.push({ id: 'pending', name: 'Pending', description: 'Omitted effect', reviewState: 'pending', reviewVersion: null, capabilityId: null, parameters: {}, requiredContext: [] });
      catalog.units[0].ruleIds.push('pending');
    });
    catalogAttack(); click('Otro equipo');
    fireEvent.change(within(screen.getByRole('group', { name: 'Equipo 1' })).getByLabelText('Portadores'), { target: { value: '1' } });
    change('cyclone · Modo de arma', 'frag'); change('Tipo de ataque', 'melee'); change('Tipo de ataque', 'ranged');
    expect((screen.getByLabelText('cyclone · Modo de arma') as HTMLSelectElement).value).toBe('frag');
    click('Ataques necesarios');
    const inverse = screen.getByLabelText('Buscar cantidad de') as HTMLSelectElement;
    expect(inverse.value).toBe('activations'); expect(inverse.options.length).toBe(1);
    change('Objetivo de bajas', '11'); click('Revisar escenario'); expect(screen.getByRole('heading', { name: 'Configura el ataque' })).toBeTruthy();
    change('Objetivo de bajas', '2'); click('Revisar escenario');
    expect(screen.getByRole('heading', { name: 'Revisa el escenario' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Calcular la escuadra omitiendo las habilidades indicadas' })).toBeTruthy();
  });

  it('restores an individual weapon when switching back to its attack type', async () => {
    await start(false); choose('Buscar unidad atacante'); click('Configurar un perfil individual'); click('Continuar');
    choose('Buscar unidad defensora'); click('Continuar');
    change('Modo de arma', 'frag'); change('Tipo de ataque', 'melee');
    expect((screen.getByLabelText('Modo de arma') as HTMLSelectElement).value).toBe('fist-mode');
    change('Tipo de ataque', 'ranged');
    expect((screen.getByLabelText('Modo de arma') as HTMLSelectElement).value).toBe('frag');
    click('Revisar escenario'); expect(screen.getByRole('heading', { name: 'Revisa el escenario' })).toBeTruthy();
  });

  it('asks for shared Heavy conditions when only an alternative weapon needs them', async () => {
    await start(false, ({ catalog }) => {
      catalog.rules.push({ id: 'heavy', name: 'Heavy', description: 'Heavy context', reviewState: 'reviewed', reviewVersion: '1.0.0',
        capabilityId: 'heavy', parameters: {}, requiredContext: ['phase', 'engaged', 'setUpThisTurn', 'movedOverThree'] });
      catalog.weaponModes.find(m => m.id === 'krak')!.ruleIds.push('heavy');
    });
    catalogAttack(); click('Otro equipo');
    fireEvent.change(within(screen.getByRole('group', { name: 'Equipo 1' })).getByLabelText('Portadores'), { target: { value: '1' } });
    expect((screen.getByLabelText('Fase') as HTMLSelectElement).value).toBe('');
    click('Revisar escenario'); expect(screen.getByRole('alert').textContent).toContain('condiciones');
    change('Fase', 'shooting');
    for (const label of ['Unidad trabada', 'Desplegada este turno', 'Alguna miniatura movió más de 3 pulgadas']) change(label, 'false');
    click('Revisar escenario'); expect(screen.getByRole('heading', { name: 'Revisa el escenario' })).toBeTruthy();
  });

  it('preserves empty AP and reliability drafts and lets a reliability shortcut correct its own field', async () => {
    await start(); click('Continuar'); click('Continuar'); click('Ataques necesarios');
    change('FP (0 o valor negativo)', ''); change('Fiabilidad deseada (%)', '');
    click('← Atrás'); click('Continuar');
    expect((screen.getByLabelText('FP (0 o valor negativo)') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Fiabilidad deseada (%)') as HTMLInputElement).value).toBe('');
    click('95%'); click('Revisar escenario');
    expect(screen.getByRole('alert').textContent).toContain('FP');
    change('FP (0 o valor negativo)', '-1'); click('Revisar escenario');
    expect(screen.getByRole('heading', { name: 'Revisa el escenario' })).toBeTruthy();
  });
});
