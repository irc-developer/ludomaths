/** The approved clean pilot is available with the static application. */
export async function readPublishedCatalog(): Promise<string | undefined> {
  const response = await fetch(`${import.meta.env.BASE_URL}catalogs/pilot-combined.json`, { cache: 'no-cache', credentials: 'omit' });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error('CATALOG_INVALID');
  return response.text();
}
