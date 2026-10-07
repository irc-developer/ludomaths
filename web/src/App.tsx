import { CatalogProvider } from './catalog/CatalogContext';
import { CombatScenarioProvider } from './calculators/combat/CombatScenarioContext';
import { s } from './i18n/scenario';
import './styles/wh40k.css';
import { useState } from 'react';
import { HypergeometricCalculator } from './calculators/hypergeometric/HypergeometricCalculator';
import { ChargeCalculator } from './calculators/charge/ChargeCalculator';
import { CombatCalculator } from './calculators/combat/CombatCalculator';
import { RequiredAttacksCalculator } from './calculators/required-attacks/RequiredAttacksCalculator';
import { CombatBuffComparisonCalculator } from './calculators/buffs/CombatBuffComparisonCalculator';
import { LorcanaCalculator } from './calculators/lorcana/LorcanaCalculator';
import { SwissSimulator } from './calculators/swiss/SwissSimulator';
import { colors, sp } from './styles/tokens';

type TabId = 'hyper' | 'charge' | 'wh40k' | 'lorcana' | 'swiss';

interface Tab {
  id:    TabId;
  label: string;
}

/**
 * OCP: para añadir una nueva sección basta con agregar una entrada aquí
 * y renderizarla abajo. El componente App no necesita conocer los detalles
 * de ninguna calculadora.
 */
const TABS: Tab[] = [
  { id: 'hyper',  label: 'Hipergeometrica' },
  { id: 'charge', label: 'Carga WH40K' },
  { id: 'wh40k', label: 'WH40K' },
  { id: 'lorcana', label: 'Lorcana' },
  { id: 'swiss',   label: 'Swiss Melee' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('hyper');
  const [combatTab, setCombatTab] = useState<'combat' | 'required' | 'buffs'>('combat');

  return (
    <CatalogProvider><CombatScenarioProvider><div style={{ minHeight: '100vh', background: colors.bg, color: colors.text }}>

      <header
        style={{
          borderBottom: `1px solid ${colors.border}`,
          padding: `${sp.md} clamp(1rem, 4vw, 2rem)`,
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.primary, margin: 0 }}>
          LudoMaths
        </h1>
        <p style={{ fontSize: '0.8rem', color: colors.muted, margin: '0.25rem 0 0' }}>
          Probabilidades y estadísticas para juegos de mesa
        </p>
      </header>

      <nav
        style={{
          borderBottom: `1px solid ${colors.border}`,
          padding: '0 clamp(0.5rem, 2vw, 2rem)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: sp.xs,
          overflowX: 'auto',
        }}
      >
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              aria-pressed={isActive}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isActive ? colors.primary : 'transparent'}`,
                color: isActive ? colors.primary : colors.muted,
                padding: `${sp.sm} ${sp.md}`,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 400,
                whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(0.75rem, 3vw, 2rem)', minWidth: 0 }}>
        {activeTab === 'hyper'   && <HypergeometricCalculator />}
        {activeTab === 'charge'  && <ChargeCalculator />}
        {activeTab === 'wh40k' && <>
          <nav className="combat-navigation" aria-label={s('calculationMode')}>
            {(['combat', 'required', 'buffs'] as const).map(mode => <button key={mode} aria-pressed={combatTab === mode}
              onClick={() => setCombatTab(mode)}>{s(mode === 'combat' ? 'combatTab' : mode === 'required' ? 'requiredTab' : 'buffsTab')}</button>)}
          </nav>
          {combatTab === 'combat' && <CombatCalculator />}
          {combatTab === 'required' && <RequiredAttacksCalculator />}
          {combatTab === 'buffs' && <CombatBuffComparisonCalculator />}
        </>}
        {activeTab === 'lorcana' && <LorcanaCalculator />}
        {activeTab === 'swiss'   && <SwissSimulator />}
      </main>

    </div></CombatScenarioProvider></CatalogProvider>
  );
}
