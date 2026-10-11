import { useState } from 'react';
import { CatalogProvider } from '../catalog/CatalogContext';
import { CombatScenarioProvider } from '../calculators/combat/CombatScenarioContext';
import { CombatCalculator } from '../calculators/combat/CombatCalculator';
import { RequiredAttacksCalculator } from '../calculators/required-attacks/RequiredAttacksCalculator';
import { CombatBuffComparisonCalculator } from '../calculators/buffs/CombatBuffComparisonCalculator';

/** Tests the retained calculator/catalog controls independently from wizard navigation. */
export function LegacyCombatHarness() {
  const [mode, setMode] = useState('Combate');
  return <CatalogProvider><CombatScenarioProvider>
    <button type="button">WH40K</button>
    {['Combate', 'Ataques necesarios', 'Mejoras'].map(name => <button type="button" key={name} onClick={() => setMode(name)}>{name}</button>)}
    {mode === 'Combate' ? <CombatCalculator /> : mode === 'Ataques necesarios' ? <RequiredAttacksCalculator /> : <CombatBuffComparisonCalculator />}
  </CombatScenarioProvider></CatalogProvider>;
}
