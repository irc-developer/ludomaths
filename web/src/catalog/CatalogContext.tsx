import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ProfileCatalog } from '@domain/profiles/catalog';
import { resolveCatalogScenario } from '@application/dice/catalogScenario';
import type { CombatScenarioInput } from '@application/dice/combatScenario';
import { loadCatalog, loadCatalogFile } from './loadCatalog';
import { readStoredCatalog, writeStoredCatalog } from './catalogStorage';
import { readLocalCatalog } from './localCatalog';
import { readPublishedCatalog } from './publishedCatalog';
import { s } from '../i18n/scenario';
import { catalogOmissions } from './catalogReview';
import { isSquadScenario } from '@application/dice/squadScenario';

interface CatalogSession { catalog: ProfileCatalog | null; error: string | null; loading: boolean; storageNotice: string | null;
  importFile: (file: File) => Promise<void>; clear: () => void }
const CatalogContext = createContext<CatalogSession>({ catalog: null, error: null, loading: false, storageNotice: null,
  importFile: async () => {}, clear: () => {} });
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<ProfileCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const request = useRef(0);
  async function persist(text: string | null, current: number) {
    try {
      await writeStoredCatalog(text);
      if (request.current === current) setStorageNotice(null);
    } catch {
      if (request.current === current) setStorageNotice(s(text === null ? 'catalogRemovalFailed' : 'catalogSessionOnly'));
    }
  }
  useEffect(() => {
    let active = true;
    const current = request.current;
    const isCurrent = () => active && request.current === current;
    setLoading(true);
    void (async () => {
      try {
        let stored;
        try { stored = await readStoredCatalog(); }
        catch (failure) {
          if (failure instanceof Error && failure.message === 'CATALOG_STORAGE_INVALID') throw failure;
          if (isCurrent()) setStorageNotice(s('catalogSessionOnly'));
        }
        if (!isCurrent() || stored?.text === null) return;
        let text = stored?.text ?? await readLocalCatalog();
        if (!isCurrent()) return;
        if (text === undefined) text = await readPublishedCatalog();
        if (!isCurrent() || text === undefined) return;
        const next = await loadCatalog(text);
        if (!isCurrent()) return;
        setCatalog(next);
        if (!stored) await persist(JSON.stringify(next), current);
      } catch { if (isCurrent()) setError(s('invalidCatalog')); }
      finally { if (isCurrent()) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  async function importFile(file: File) {
    const current = ++request.current;
    setLoading(true); setError(null);
    try {
      const next = await loadCatalogFile(file);
      if (request.current !== current) return;
      setCatalog(next);
      await persist(JSON.stringify(next), current);
    }
    catch { if (request.current === current) setError(s('invalidCatalog')); }
    finally { if (request.current === current) setLoading(false); }
  }
  function clear() {
    const current = ++request.current;
    setCatalog(null); setError(null); setLoading(false);
    void persist(null, current);
  }
  return <CatalogContext.Provider value={{ catalog, error, loading, storageNotice, importFile, clear }}>{children}</CatalogContext.Provider>;
}
export const useCatalog = () => useContext(CatalogContext);
export function useCatalogInput(params: CombatScenarioInput): CombatScenarioInput {
  const { catalog } = useCatalog();
  return useMemo(() => {
    if (!params.catalogSelection) return params;
    if (!catalog) return { ...params, calculationBlocked: true };
    try {
      const review = resolveCatalogScenario(catalog, params.catalogSelection, params);
      const omitted = catalogOmissions(review);
      const incomplete = !params.catalogSelection.modeId || !params.catalogSelection.defenderMiniatureId;
      const resolve = (profile: CombatScenarioInput, side: 'attacker' | 'defender') => {
        const saved = profile.catalogSelection;
        if (!saved || saved.catalogId !== catalog.catalogId || saved.catalogVersion !== catalog.catalogVersion || saved.payloadSha256 !== catalog.payloadSha256) throw new RangeError('CATALOG_SELECTION_EXPIRED');
        if (side === 'attacker' && (!saved.modeId || !saved.attackerMiniatureId || saved.attackerUnitId !== params.catalogSelection!.attackerUnitId) ||
          side === 'defender' && (!saved.defenderMiniatureId || saved.defenderUnitId !== params.catalogSelection!.defenderUnitId)) throw new RangeError('CATALOG_SELECTION_INVALID');
        const selection = side === 'attacker' ? { ...saved, defenderUnitId: params.catalogSelection!.defenderUnitId,
          defenderMiniatureId: params.catalogSelection!.defenderMiniatureId } : { ...params.catalogSelection!,
          defenderMiniatureId: saved.defenderMiniatureId };
        const next = resolveCatalogScenario(catalog, selection, profile);
        omitted.push(...catalogOmissions(next));
        return { ...next.params, catalogSelection: selection, calculationBlocked: false };
      };
      const primaryExtraWeapons = params.primaryExtraWeapons?.map(p => resolve(p, 'attacker'));
      const attackerEquipmentGroups = params.attackerEquipmentGroups?.map(g => ({ ...g, weapons: g.weapons.map(p => resolve(p, 'attacker')) }));
      const defenderGroups = params.defenderGroups?.map(g => ({ ...g, profile: resolve(g.profile, 'defender') }));
      // Every selected weapon must be eligible for every defender variant.
      for (const p of [review.params, ...(primaryExtraWeapons ?? []), ...(attackerEquipmentGroups ?? []).flatMap(g => g.weapons)]) {
        for (const g of defenderGroups ?? []) {
          const pair = resolveCatalogScenario(catalog, { ...p.catalogSelection ?? params.catalogSelection!,
            defenderMiniatureId: g.profile.catalogSelection!.defenderMiniatureId }, p);
          omitted.push(...catalogOmissions(pair));
        }
      }
      const limitations = [...new Set(omitted.map(rule => rule.name + ': ' + rule.description))].sort();
      const accepted = JSON.stringify(params.acceptedSquadOmissions ?? []) === JSON.stringify(limitations);
      return { ...review.params, calculationBlocked: incomplete || isSquadScenario(params) && limitations.length > 0 && !accepted, partialCalculation: omitted.length > 0,
        primaryExtraWeapons, attackerEquipmentGroups, defenderGroups,
        calculationLimitations: limitations };
    } catch { return { ...params, calculationBlocked: true }; }
  }, [catalog, params]);
}
