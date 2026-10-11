import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { equipmentFixture } from '@application/dice/catalogEquipmentFixture';
import { EQUIPMENT_REVIEWS, type EquipmentReview } from '@domain/profiles/catalogEquipment';
import { CalculateUnitCombatUseCase } from '@application/dice/CalculateUnitCombatUseCase';
import { CalculateSquadCombatUseCase } from '@application/dice/CalculateSquadCombatUseCase';
import * as loader from '../../catalog/loadCatalog';
import * as storage from '../../catalog/catalogStorage';
import * as local from '../../catalog/localCatalog';
import { calculateSquad } from './squadCalculations';
import type { SquadRequest } from './squadCalculations';

vi.mock('../../catalog/catalogStorage', () => ({ readStoredCatalog: vi.fn(), writeStoredCatalog: vi.fn() }));
vi.mock('../../catalog/localCatalog', () => ({ readLocalCatalog: vi.fn() }));
vi.mock('@domain/profiles/catalogEquipment', async original => ({ ...await original<typeof import('@domain/profiles/catalogEquipment')>(), EQUIPMENT_REVIEWS: [] }));
beforeEach(() => {
  vi.clearAllMocks(); (EQUIPMENT_REVIEWS as EquipmentReview[]).splice(0);
  vi.mocked(storage.readStoredCatalog).mockResolvedValue({ version: 1, text: 'fixture' });
  vi.mocked(local.readLocalCatalog).mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const change = (name: string, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } });
async function start(manual = true, partial = false) {
  const f = equipmentFixture(); (EQUIPMENT_REVIEWS as EquipmentReview[]).push(f.review);
  if (partial) { f.catalog.rules.push({ id: 'omitted', name: 'Pending ability', description: 'Omitted effect', reviewState: 'pending', reviewVersion: null, capabilityId: null, parameters: {}, requiredContext: [] }); f.catalog.units[0].ruleIds.push('omitted'); }
  vi.spyOn(loader, 'loadCatalog').mockResolvedValue(f.catalog);
  await act(async () => { render(<App />); }); click('WH40K');
  if (manual) click('Entrada manual');
}
function choose(label: string) {
  change(label, 'Synthetic unit'); clickOption();
}
function clickOption() { fireEvent.click(screen.getByRole('option', { name: 'Synthetic unit Synthetic faction' })); }
function prepare(manual = true) {
  if (!manual) choose('Buscar unidad atacante'); click('Continuar');
  if (!manual) choose('Buscar unidad defensora'); click('Continuar');
}
function confirm() { click('Revisar escenario'); click('Generar informe'); }

describe('confirmed report lifecycle', () => {
  it('shows the calculated summary, restores empty edits and the report mode without recalculating', async () => {
    const execute = vi.spyOn(CalculateUnitCombatUseCase.prototype, 'execute');
    await start(); change('Nombre del atacante (opcional)', 'Equipo A'); click('Continuar');
    change('Nombre del defensor (opcional)', 'Equipo B'); click('Continuar'); confirm();
    const summary = screen.getByRole('region', { name: 'Escenario calculado' });
    expect(summary.textContent).toContain('Equipo A'); expect(summary.textContent).toContain('Equipo B');
    expect(screen.getByRole('heading', { name: 'Informe de combate' })).toBe(document.activeElement);
    expect(screen.queryByRole('navigation', { name: 'Preparación del escenario' })).toBeNull();
    expect(execute).toHaveBeenCalledTimes(1);
    click('← Cambiar ataque'); change('Fuerza (F)', ''); click('Ataques necesarios');
    expect(screen.queryByText('Probabilidad de eliminar la miniatura')).toBeNull();
    expect(screen.getByText('Preparando cambios')).toBeTruthy(); click('Cancelar edición');
    expect(screen.getByRole('heading', { name: 'Informe de combate' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Combate' }).getAttribute('aria-pressed')).toBe('true');
    expect(execute).toHaveBeenCalledTimes(1);
    click('← Cambiar ataque'); expect((screen.getByLabelText('Fuerza (F)') as HTMLInputElement).value).toBe('4');
    click('Guardar y revisar'); expect(screen.queryByRole('alert')).toBeNull();
  });

  it('starts a clean manual draft, retaining the selected report mode', async () => {
    await start(); change('Nombre del atacante (opcional)', 'Anterior'); prepare(); click('Ataques necesarios'); click('95%'); confirm();
    click('Nuevo cálculo');
    expect(screen.getByRole('heading', { name: 'Elige quién ataca' })).toBeTruthy();
    expect((screen.getByLabelText('Nombre del atacante (opcional)') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Miniaturas que atacan') as HTMLInputElement).value).toBe('1');
    expect(screen.getByRole('button', { name: 'Ataques necesarios' }).getAttribute('aria-pressed')).toBe('true');
    prepare(); expect((screen.getByLabelText('Fiabilidad deseada (%)') as HTMLInputElement).value).toBe('90');
    confirm(); expect(screen.getByRole('heading', { name: 'Informe de ataques necesarios' })).toBeTruthy();
  });

  it('retains the loaded catalog but clears all selected units and equipment for a new calculation', async () => {
    await start(false); prepare(false); confirm(); click('Nuevo cálculo');
    expect((screen.getByLabelText('Buscar unidad atacante') as HTMLInputElement).value).toBe('');
    click('Continuar'); expect(screen.getByRole('alert')).toBeTruthy();
    choose('Buscar unidad atacante'); click('Continuar');
    expect((screen.getByLabelText('Buscar unidad defensora') as HTMLInputElement).value).toBe('');
  });

  it('does not display zero results on execution failure and retries the same confirmed scenario', async () => {
    const execute = vi.spyOn(CalculateUnitCombatUseCase.prototype, 'execute').mockImplementationOnce(() => { throw new Error('COMBAT_COMPLEXITY_LIMIT'); });
    await start(); prepare(); confirm();
    expect(screen.getByRole('alert').textContent).toContain('No se pudo completar el informe');
    expect(screen.queryByText('Probabilidad de eliminar la miniatura')).toBeNull();
    click('Reintentar informe'); expect(execute).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Probabilidad de eliminar la miniatura')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('explains impossible inverse results and returns directly to the objective for correction', async () => {
    await start(); prepare(); click('Ataques necesarios'); change('Fiabilidad deseada (%)', '100'); confirm();
    expect(screen.getByText(/Elige una fiabilidad inferior al 100%/)).toBeTruthy();
    expect(screen.queryByText('Con 0 ataques')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Cambiar objetivo' })[0]);
    expect(document.activeElement?.id).toBe('wizard-attack-objective'); click('95%'); click('Guardar y revisar'); click('Generar informe');
    expect(screen.getByText('Necesitas', { exact: false })).toBeTruthy();
  });

  it('presents offensive improvements and defense separately, with calculation details after the results', async () => {
    await start(); prepare(); click('Mejoras'); confirm();
    expect(screen.getByRole('heading', { name: 'Informe de mejoras' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { name: 'Mejoras ofensivas' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: 'Mejora defensiva del objetivo' }).length).toBeGreaterThan(0);
    expect(screen.getByText('Mejor opción ofensiva:')).toBeTruthy();
    expect(screen.queryByLabelText('Fuerza (F)')).toBeNull();
    expect(screen.getByText('Cómo se calcula')).toBeTruthy();
  });

  it('labels a bounded squad search as a checked amount, without claiming a minimum', async () => {
    const workers: FakeWorker[] = [];
    class FakeWorker { onmessage?: (event: { data: unknown }) => void; onerror?: () => void; terminate = vi.fn(); postMessage = vi.fn(); constructor() { workers.push(this); } }
    vi.stubGlobal('Worker', FakeWorker);
    await start(false); prepare(false); click('Ataques necesarios'); vi.useFakeTimers(); confirm();
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    act(() => workers[0].onmessage?.({ data: { result: { status: 'limit', reason: 'search', count: 20, unit: 'activations', probability: .8, previousProbability: .7 } } }));
    expect(screen.getByText('Cantidad comprobada dentro del límite')).toBeTruthy();
    expect(screen.queryByText('Cantidad necesaria')).toBeNull();
    expect(screen.queryByText('Con una menos')).toBeNull();
  });

  it('cancels pending work on review and discards its late response after another confirmation', async () => {
    const workers: FakeWorker[] = [];
    class FakeWorker { onmessage?: (event: { data: unknown }) => void; onerror?: () => void; request!: SquadRequest;
      terminate = vi.fn(); postMessage(request: SquadRequest) { this.request = request; } constructor() { workers.push(this); } }
    vi.stubGlobal('Worker', FakeWorker);
    await start(false); prepare(false); vi.useFakeTimers(); confirm();
    expect(screen.getByText('Generando informe…')).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    const old = workers[0]; click('Revisar escenario'); expect(old.terminate).toHaveBeenCalled();
    click('Cambiar atacante'); change('Miniaturas que atacan', '2'); click('Guardar y revisar'); click('Generar informe');
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    act(() => old.onmessage?.({ data: { result: calculateSquad(old.request) } }));
    expect(screen.getByText('Generando informe…')).toBeTruthy(); expect(screen.queryByText('Bajas medias')).toBeNull();
    const current = workers[1]; act(() => current.onmessage?.({ data: { result: calculateSquad(current.request) } }));
    expect(screen.getByText('Bajas medias')).toBeTruthy();
    const summary = screen.getByRole('region', { name: 'Escenario calculado' }); expect(summary.textContent).toContain('2 · Participan');
    click('← Cambiar defensor'); change('Miniaturas restantes', ''); click('Cancelar edición');
    expect(screen.getByText('Bajas medias')).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(100); }); expect(workers).toHaveLength(2);
  });

  it('uses the confirmed names and casualty query in a shared partial report without rerunning it', async () => {
    const execute = vi.spyOn(CalculateSquadCombatUseCase.prototype, 'execute');
    await start(false, true); prepare(false); click('Revisar escenario');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Calcular la escuadra omitiendo las habilidades indicadas' })); click('Generar informe');
    const share = screen.getByText('Compartir resultado'); fireEvent.click(share);
    await waitFor(() => expect(screen.getByRole('img')).toBeTruthy());
    change('Objetivo de bajas', '1');
    const image = screen.getByRole('img'); const svg = decodeURIComponent(image.getAttribute('src')!.split(',').slice(1).join(','));
    expect(svg).toContain('Synthetic unit'); expect(svg).toContain('Objetivo: 1 bajas');
    expect(svg).toContain('CÁLCULO PARCIAL'); expect(svg).toContain('Pending ability: Omitted effect');
    expect(execute).toHaveBeenCalledTimes(1);
    click('← Cambiar defensor'); click('Cancelar edición');
    expect((screen.getByLabelText('Objetivo de bajas') as HTMLInputElement).value).toBe('1'); expect(execute).toHaveBeenCalledTimes(1);
    expect(within(screen.getByRole('region', { name: 'Escenario calculado' })).getAllByText('Synthetic unit', { exact: true })).toHaveLength(2);
  });
});
