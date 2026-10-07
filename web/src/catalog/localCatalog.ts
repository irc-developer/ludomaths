/** The optional local endpoint exists only in the development server, never the published build. */
export async function readLocalCatalog(): Promise<string | undefined> {
  if (!import.meta.env.DEV) return undefined;
  const response = await fetch(`${import.meta.env.BASE_URL}.__private/catalog`, { cache: 'no-store', credentials: 'omit' });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error('CATALOG_INVALID');
  return response.text();
}
