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
  it('keeps damage reduction through mode switches, review edits and report calculation', async () => {
    const unit = vi.spyOn(CalculateUnitCombatUseCase.prototype, 'execute');
    await start(); click('Continuar');
    change('Reducción de daño', '1');
    click('Ataques necesarios'); click('Mejoras'); click('Combate');
    expect((screen.getByLabelText('Reducción de daño') as HTMLInputElement).value).toBe('1');
    click('Continuar'); change('Daño por ataque', '3'); click('Revisar escenario');
    expect(screen.getByText('Reducción de daño: −1')).toBeTruthy();
    click('Cambiar defensor');
    expect((screen.getByLabelText('Reducción de daño') as HTMLInputElement).value).toBe('1');
    change('Reducción de daño', '2'); click('Guardar y revisar');
    expect(screen.getByText('Reducción de daño: −2')).toBeTruthy();
    click('Generar informe');
    expect(unit.mock.calls.some(([input]) => input.savePools[0].damageReduction === 2)).toBe(true);
  });

  it('offers explicit damage reduction for catalog defenders and preserves it during resolution', async () => {
    const squad = vi.spyOn(CalculateSquadCombatUseCase.prototype, 'execute');
    await start(false); choose('Buscar unidad atacante'); click('Continuar'); choose('Buscar unidad defensora');
    fireEvent.change(screen.getAllByLabelText('Reducción de daño')[0], { target: { value: '1' } });
    click('Continuar'); click('Revisar escenario');
    expect(screen.getByText('Reducción de daño: −1')).toBeTruthy();
    click('Generar informe');
    await waitFor(() => expect(squad.mock.calls.some(([input]) => input.defenders[0].damageReduction === 1)).toBe(true));
  });

  it('blocks invalid damage reduction drafts and accepts zero to disable it', async () => {
    await start(); click('Continuar'); change('Reducción de daño', '-1'); click('Continuar');
    expect(screen.getByRole('alert').textContent).toContain('Reducción de daño');
    expect(screen.getByRole('heading', { name: 'Elige quién recibe el ataque' })).toBeTruthy();
    change('Reducción de daño', '0'); click('Continuar');
    expect(screen.getByRole('heading', { name: 'Configura el ataque' })).toBeTruthy();
  });
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
    click('Revisar escenario');
    let links = within(screen.getByRole('alert')).getAllByRole('link');
    expect(links.map(link => link.textContent)).toEqual([
      'Arma manual (Heavy): elige la fase en la que se realiza el ataque.',
      'Arma manual (Heavy): indica si la unidad atacante está trabada.',
      'Arma manual (Heavy): indica si la unidad atacante se ha desplegado este turno.',
      'Arma manual (Heavy): indica si alguna miniatura atacante ha movido más de 3 pulgadas.',
    ]);
    fireEvent.click(links[0]); expect(document.activeElement).toBe(screen.getByLabelText('Fase'));
    change('Fase', 'shooting');
    expect(document.activeElement).toBe(screen.getByLabelText('Fase'));
    links = within(screen.getByRole('alert')).getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(screen.getByRole('alert').textContent).not.toContain('elige la fase');
    fireEvent.click(links[0]); expect(document.activeElement).toBe(screen.getByLabelText('Unidad trabada'));
    for (const label of ['Unidad trabada', 'Desplegada este turno', 'Alguna miniatura movió más de 3 pulgadas']) change(label, 'false');
    expect(screen.queryByRole('alert')).toBeNull();
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

  it('links missing context to the weapon in an independent equipment group', async () => {
    await start(); change('Miniaturas que atacan', '2'); click('Continuar'); click('Continuar');
    fireEvent.click(screen.getByText('Editar grupos de armas'));
    click('Añadir grupo con otro equipo');
    const group = within(screen.getByRole('group', { name: 'Grupo atacante 2' }));
    fireEvent.click(group.getByText('Ajustes avanzados'));
    fireEvent.click(group.getByRole('checkbox', { name: 'Heavy' }));
    fireEvent.click(screen.getByText('Editar grupos de armas'));
    click('Revisar escenario');
    const links = within(screen.getByRole('alert')).getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(links.every(link => link.textContent?.startsWith('Grupo atacante 2 · Arma y modo 1: Arma manual (Heavy):'))).toBe(true);
    const context = within(screen.getByRole('group', { name: 'Grupo atacante 2 · Arma y modo 1' }));
    fireEvent.click(links[0]); expect(document.activeElement).toBe(context.getByLabelText('Fase'));
    fireEvent.change(context.getByLabelText('Fase'), { target: { value: 'shooting' } });
    for (const label of ['Unidad trabada', 'Desplegada este turno', 'Alguna miniatura movió más de 3 pulgadas'])
      fireEvent.change(context.getByLabelText(label), { target: { value: 'false' } });
    expect(screen.queryByRole('alert')).toBeNull();
    click('Revisar escenario'); expect(screen.getByRole('heading', { name: 'Revisa el escenario' })).toBeTruthy();
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
    click('Revisar escenario');
    const links = within(screen.getByRole('alert')).getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(links.every(link => link.textContent?.startsWith('cyclone · krak (Heavy):'))).toBe(true);
    fireEvent.click(links[0]); expect(document.activeElement).toBe(screen.getByLabelText('Fase'));
    change('Fase', 'shooting');
    for (const label of ['Unidad trabada', 'Desplegada este turno', 'Alguna miniatura movió más de 3 pulgadas']) change(label, 'false');
    click('Revisar escenario'); expect(screen.getByRole('heading', { name: 'Revisa el escenario' })).toBeTruthy();
  });

  it('identifies the weapon needing half-range and accepts an explicit outside-half-range answer', async () => {
    await start(false, ({ catalog }) => {
      catalog.rules.push({ id: 'rapid', name: 'Rapid Fire 1', description: 'Range context', reviewState: 'reviewed', reviewVersion: '1.0.0',
        capabilityId: 'rapidFire', parameters: { additionalAttacks: 1 }, requiredContext: ['withinHalfRange'] });
      catalog.weaponModes.find(m => m.id === 'krak')!.ruleIds.push('rapid');
    });
    catalogAttack(); click('Otro equipo');
    fireEvent.change(within(screen.getByRole('group', { name: 'Equipo 1' })).getByLabelText('Portadores'), { target: { value: '1' } });
    click('Revisar escenario');
    const link = within(screen.getByRole('alert')).getByRole('link');
    expect(link.textContent).toBe('cyclone · krak (Rapid Fire): indica si el objetivo está dentro o fuera de la mitad del alcance.');
    fireEvent.click(link);
    const range = screen.getByLabelText('Dentro de la mitad del alcance al elegir objetivo');
    expect(document.activeElement).toBe(range);
    fireEvent.change(range, { target: { value: 'false' } });
    expect(screen.queryByRole('alert')).toBeNull();
    click('Revisar escenario'); expect(screen.getByRole('heading', { name: 'Revisa el escenario' })).toBeTruthy();
  });

  it('enters AP using digits, retains it across navigation, and calculates with its magnitude', async () => {
    const inverse = vi.spyOn(CalculateRequiredAttacksUseCase.prototype, 'execute');
    await start(); click('Continuar'); click('Continuar'); click('Ataques necesarios');
    const input = screen.getByLabelText('FP') as HTMLInputElement;
    expect(input.inputMode).toBe('numeric');
    change('FP', '0');
    expect(input.closest('.number-input-with-prefix')?.querySelector('.number-input-prefix')?.textContent).toBe('');
    for (const invalid of ['-1', '1.5', '101']) {
      change('FP', invalid); click('Revisar escenario');
      expect(screen.getByRole('alert').textContent).toContain('FP');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(inverse).not.toHaveBeenCalled();
    }
    change('FP', '2');
    expect(input.closest('.number-input-with-prefix')?.querySelector('.number-input-prefix')?.textContent).toBe('−');
    click('← Atrás'); click('Continuar');
    expect((screen.getByLabelText('FP') as HTMLInputElement).value).toBe('2');
    click('Revisar escenario');
    expect(screen.getByText(/FP -2/)).toBeTruthy();
    click('Generar informe');
    expect(inverse).toHaveBeenCalledWith(expect.objectContaining({ weapon: expect.objectContaining({ ap: 2 }) }));
  });

  it('uses AP magnitudes independently for the main weapon, extra weapons and equipment groups', async () => {
    await start(); click('Continuar'); click('Continuar');
    fireEvent.click(screen.getByText('Editar grupos de armas'));
    click('Añadir otra arma a este grupo'); click('Añadir grupo con otro equipo');
    const fields = screen.getAllByLabelText('FP') as HTMLInputElement[];
    expect(fields).toHaveLength(3);
    fields.forEach((field, index) => fireEvent.change(field, { target: { value: String(index + 1) } }));
    click('Revisar escenario');
    for (const ap of [1, 2, 3]) expect(screen.getByText(new RegExp(`FP -${ap}`))).toBeTruthy();
  });

  it('preserves empty AP and reliability drafts and lets a reliability shortcut correct its own field', async () => {
    await start(); click('Continuar'); click('Continuar'); click('Ataques necesarios');
    change('FP', ''); change('Fiabilidad deseada (%)', '');
    click('← Atrás'); click('Continuar');
    expect((screen.getByLabelText('FP') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Fiabilidad deseada (%)') as HTMLInputElement).value).toBe('');
    click('95%'); click('Revisar escenario');
    expect(screen.getByRole('alert').textContent).toContain('FP');
    change('FP', '1'); click('Revisar escenario');
    expect(screen.getByRole('heading', { name: 'Revisa el escenario' })).toBeTruthy();
  });
});
