import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogProvider, useCatalog } from './CatalogContext';
import { validateCatalog, type ProfileCatalog } from '@domain/profiles/catalog';
import { syntheticCatalog, syntheticTrust } from '@domain/profiles/catalogFixture';
import * as loader from './loadCatalog';
import * as storage from './catalogStorage';
import * as local from './localCatalog';

vi.mock('./catalogStorage', () => ({ readStoredCatalog: vi.fn(), writeStoredCatalog: vi.fn() }));
vi.mock('./localCatalog', () => ({ readLocalCatalog: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(storage.readStoredCatalog).mockResolvedValue(undefined);
  vi.mocked(storage.writeStoredCatalog).mockResolvedValue();
  vi.mocked(local.readLocalCatalog).mockResolvedValue(undefined);
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function Probe() {
  const { catalog, importFile, clear, error, storageNotice } = useCatalog();
  return <><button onClick={() => void importFile(new File([], 'catalog.json'))}>load</button>
    <button onClick={clear}>clear</button><output>{catalog?.catalogVersion ?? 'empty'}</output><p>{error}</p><p>{storageNotice}</p></>;
}

describe('persistent private catalog', () => {
  const catalog = validateCatalog(syntheticCatalog(), syntheticTrust);
  const text = JSON.stringify(catalog);
  it('revalidates a saved catalog on opening without a local request', async () => {
    vi.mocked(storage.readStoredCatalog).mockResolvedValue({ version: 1, text });
    const validate = vi.spyOn(loader, 'loadCatalog').mockResolvedValue(catalog);
    render(<CatalogProvider><Probe /></CatalogProvider>);
    await waitFor(() => expect(screen.getByText('test-1')).toBeTruthy());
    expect(validate).toHaveBeenCalledWith(text);
    expect(local.readLocalCatalog).not.toHaveBeenCalled();
  });
  it('loads and saves the configured local catalog automatically on first opening', async () => {
    vi.mocked(local.readLocalCatalog).mockResolvedValue(text);
    vi.spyOn(loader, 'loadCatalog').mockResolvedValue(catalog);
    render(<CatalogProvider><Probe /></CatalogProvider>);
    await waitFor(() => expect(screen.getByText('test-1')).toBeTruthy());
    expect(storage.writeStoredCatalog).toHaveBeenCalledWith(text);
  });
  it('persists a validated import and restores it on reopening', async () => {
    vi.spyOn(loader, 'loadCatalogFile').mockResolvedValue(catalog);
    vi.spyOn(loader, 'loadCatalog').mockResolvedValue(catalog);
    const view = render(<CatalogProvider><Probe /></CatalogProvider>);
    fireEvent.click(screen.getByText('load'));
    await waitFor(() => expect(storage.writeStoredCatalog).toHaveBeenCalledWith(text));
    view.unmount();
    vi.mocked(storage.readStoredCatalog).mockResolvedValue({ version: 1, text });
    render(<CatalogProvider><Probe /></CatalogProvider>);
    await waitFor(() => expect(screen.getByText('test-1')).toBeTruthy());
  });
  it('rejects a corrupt or untrusted saved catalog without echoing its contents', async () => {
    vi.mocked(storage.readStoredCatalog).mockResolvedValue({ version: 1, text: 'private payload' });
    vi.spyOn(loader, 'loadCatalog').mockRejectedValue(new Error('private payload'));
    render(<CatalogProvider><Probe /></CatalogProvider>);
    await waitFor(() => expect(screen.getByText(/No se puede admitir/)).toBeTruthy());
    expect(screen.getByText('empty')).toBeTruthy();
    expect(screen.queryByText('private payload')).toBeNull();
    expect(local.readLocalCatalog).not.toHaveBeenCalled();
  });
  it('remembers removal so opening does not reload the local file', async () => {
    vi.mocked(storage.readStoredCatalog).mockResolvedValue({ version: 1, text: null });
    render(<CatalogProvider><Probe /></CatalogProvider>);
    await waitFor(() => expect(storage.readStoredCatalog).toHaveBeenCalled());
    expect(local.readLocalCatalog).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('clear'));
    expect(storage.writeStoredCatalog).toHaveBeenCalledWith(null);
  });
  it('keeps a valid catalog usable and reports when browser persistence fails', async () => {
    vi.mocked(storage.writeStoredCatalog).mockRejectedValue(new Error('private path'));
    vi.spyOn(loader, 'loadCatalogFile').mockResolvedValue(catalog);
    render(<CatalogProvider><Probe /></CatalogProvider>);
    fireEvent.click(screen.getByText('load'));
    await waitFor(() => expect(screen.getByText(/solo durante esta sesión/)).toBeTruthy());
    expect(screen.getByText('test-1')).toBeTruthy();
    expect(screen.queryByText('private path')).toBeNull();
  });
  it('does not replace a newer import with a slow startup restore', async () => {
    let complete: (value: storage.StoredCatalog) => void = () => {};
    vi.mocked(storage.readStoredCatalog).mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    vi.spyOn(loader, 'loadCatalogFile').mockResolvedValue(catalog);
    const validate = vi.spyOn(loader, 'loadCatalog');
    render(<CatalogProvider><Probe /></CatalogProvider>);
    fireEvent.click(screen.getByText('load'));
    await waitFor(() => expect(screen.getByText('test-1')).toBeTruthy());
    complete({ version: 1, text: 'stale' });
    await waitFor(() => expect(screen.getByText('test-1')).toBeTruthy());
    expect(validate).not.toHaveBeenCalled();
  });
  it('does not reinstate or save a local bootstrap after removal', async () => {
    let complete: (value: string) => void = () => {};
    vi.mocked(local.readLocalCatalog).mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    const validate = vi.spyOn(loader, 'loadCatalog').mockResolvedValue(catalog);
    render(<CatalogProvider><Probe /></CatalogProvider>);
    await waitFor(() => expect(local.readLocalCatalog).toHaveBeenCalled());
    fireEvent.click(screen.getByText('clear'));
    complete(text);
    await waitFor(() => expect(screen.getByText('empty')).toBeTruthy());
    expect(validate).not.toHaveBeenCalled();
    expect(storage.writeStoredCatalog).not.toHaveBeenCalledWith(text);
  });
});
describe('atomic catalog replacement', () => {
  it('keeps the previous catalog when another file fails validation', async () => {
    const catalog = validateCatalog(syntheticCatalog(), syntheticTrust);
    vi.spyOn(loader, 'loadCatalogFile').mockResolvedValueOnce(catalog).mockRejectedValueOnce(new Error('private payload'));
    render(<CatalogProvider><Probe /></CatalogProvider>);
    fireEvent.click(screen.getByText('load'));
    await waitFor(() => expect(screen.getByText('test-1')).toBeTruthy());
    fireEvent.click(screen.getByText('load'));
    await waitFor(() => expect(screen.getByText(/No se puede admitir/)).toBeTruthy());
    expect(screen.getByText('test-1')).toBeTruthy();
    expect(screen.queryByText('private payload')).toBeNull();
    expect(storage.writeStoredCatalog).toHaveBeenCalledTimes(1);
  });
  it('does not reinstate a catalog after clearing an in-flight import', async () => {
    let complete: (value: ProfileCatalog) => void = () => {};
    vi.spyOn(loader, 'loadCatalogFile').mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    render(<CatalogProvider><Probe /></CatalogProvider>);
    fireEvent.click(screen.getByText('load')); fireEvent.click(screen.getByText('clear'));
    complete(validateCatalog(syntheticCatalog(), syntheticTrust));
    await waitFor(() => expect(screen.getByText('empty')).toBeTruthy());
    expect(screen.queryByText('test-1')).toBeNull();
  });
});
