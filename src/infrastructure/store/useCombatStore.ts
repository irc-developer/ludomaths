import { create } from 'zustand';
import type { StoredUnitProfile } from '@application/profiles/IProfileRepository';

interface CombatState {
  attacker: StoredUnitProfile | null;
  defender: StoredUnitProfile | null;
  setAttacker: (profile: StoredUnitProfile) => void;
  setDefender: (profile: StoredUnitProfile) => void;
  clearCombat: () => void;
}

export const useCombatStore = create<CombatState>(set => ({
  attacker: null,
  defender: null,
  setAttacker: profile => set({ attacker: profile }),
  setDefender: profile => set({ defender: profile }),
  clearCombat: () => set({ attacker: null, defender: null }),
}));
