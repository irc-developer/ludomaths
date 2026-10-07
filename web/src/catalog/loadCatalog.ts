import { canonicalCatalog, validateCatalog, type ProfileCatalog } from '@domain/profiles/catalog';
import type { TrustedCatalog } from '@domain/profiles/catalogTrust';

const MAX_BYTES = 10 * 1024 * 1024;
export async function browserDigest(text: string): Promise<string> {
  const result = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** File contents and parse errors never enter UI, history, telemetry or logs. */
export async function loadCatalog(text: string, options: { digest?: (text: string) => Promise<string>; registry?: readonly TrustedCatalog[] } = {}): Promise<ProfileCatalog> {
  try {
    if (text.length > MAX_BYTES || new TextEncoder().encode(text).byteLength > MAX_BYTES) throw new RangeError();
    const parsed: unknown = JSON.parse(text);
    // Structure and bounded traversal precede canonicalization and hashing.
    const catalog = validateCatalog(parsed, options.registry);
    const digest = await (options.digest ?? browserDigest)(canonicalCatalog(catalog));
    if (digest !== catalog.payloadSha256) throw new RangeError();
    return catalog;
  } catch { throw new RangeError('CATALOG_INVALID'); }
}

export async function loadCatalogFile(file: File): Promise<ProfileCatalog> {
  if (file.size > MAX_BYTES) throw new RangeError('CATALOG_INVALID');
  return loadCatalog(await file.text());
}
