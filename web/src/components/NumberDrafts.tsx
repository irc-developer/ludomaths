import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface Field { label: string; invalid: boolean; id?: string }
const Store = createContext<{
  drafts: Record<string, string>; set: (key: string, text: string) => void;
  fields: Record<string, Field>; register: (key: string, field?: Field) => void;
  clear: (prefix?: string) => void;
  pending: Record<string, Field>; remember: (prefix: string) => void;
} | null>(null);
const Scope = createContext('');

/** Optional persistent editing policy for wizard controls. Legacy calculators keep their policy. */
export function NumberDraftProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<Record<string, Field>>({});
  const [pending, setPending] = useState<Record<string, Field>>({});
  const fieldsRef = useRef(fields); fieldsRef.current = fields;
  const [actions] = useState(() => ({
    set: (key: string, text: string) => setDrafts(old => ({ ...old, [key]: text })),
    register: (key: string, field?: Field) => setFields(old => {
      if (field && old[key]?.invalid === field.invalid && old[key]?.id === field.id && old[key]?.label === field.label || !field && !old[key]) return old;
      const next = { ...old }; if (field) next[key] = field; else delete next[key]; return next;
    }),
    clear: (prefix = '') => {
      setDrafts(old => Object.fromEntries(Object.entries(old).filter(([key]) => !key.startsWith(prefix))));
      setPending(old => Object.fromEntries(Object.entries(old).filter(([key]) => !key.startsWith(prefix))));
    },
    remember: (prefix: string) => setPending(old => ({
      ...Object.fromEntries(Object.entries(old).filter(([key]) => !key.startsWith(prefix))),
      ...Object.fromEntries(Object.entries(fieldsRef.current).filter(([key, field]) => key.startsWith(prefix) && field.invalid)),
    })),
  }));
  return <Store.Provider value={{ drafts, fields, pending, ...actions }}>{children}</Store.Provider>;
}
export function NumberDraftScope({ name, children, root = false }: { name: string; children: ReactNode; root?: boolean }) {
  const parent = useContext(Scope);
  const remember = useContext(Store)?.remember;
  // Preserve only errors of controls present when leaving a screen, not hidden optional controls.
  useLayoutEffect(() => () => { if (root) remember?.(`${name}/`); }, [root, name, remember]);
  return <Scope.Provider value={parent || root ? `${parent}${name}/` : ''}>{children}</Scope.Provider>;
}
export function useNumberDrafts() {
  const store = useContext(Store);
  if (!store) throw new Error('NUMBER_DRAFT_PROVIDER_REQUIRED');
  return store;
}
export function useResetNumberDraft(key: string) {
  const store = useContext(Store), prefix = useContext(Scope);
  return () => { if (store && prefix) store.clear(`${prefix}${key}`); };
}
export function usePersistentNumber(key: string | undefined, label: string, id: string | undefined, value: number, min: number, max: number | undefined, step: number) {
  const store = useContext(Store), prefix = useContext(Scope);
  const fullKey = prefix && key ? `${prefix}${key}` : undefined;
  const text = fullKey ? store?.drafts[fullKey] ?? String(value) : String(value);
  const numeric = Number(text);
  const invalid = !text.trim() || !Number.isFinite(numeric) || numeric < min || max !== undefined && numeric > max || Number.isInteger(step) && !Number.isInteger(numeric);
  const register = store?.register;
  const clear = store?.clear, saved = fullKey ? store?.drafts[fullKey] : undefined;
  useEffect(() => {
    // A programmatic profile change replaces complete text, while incomplete drafts survive navigation.
    if (fullKey && saved !== undefined && !invalid && numeric !== value && Number.isFinite(value)) clear?.(fullKey);
  }, [fullKey, saved, invalid, numeric, value, clear]);
  useEffect(() => {
    if (!fullKey || !register) return;
    register(fullKey, { label, invalid, id });
    return () => register(fullKey);
  }, [fullKey, register, invalid, label, id]);
  return fullKey && store ? { text, invalid, set: (next: string) => store.set(fullKey, next) } : undefined;
}
