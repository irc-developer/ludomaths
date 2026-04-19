import { useState } from 'react';
import { HypergeometricCalculator } from './calculators/hypergeometric/HypergeometricCalculator';
import { ChargeCalculator } from './calculators/charge/ChargeCalculator';
import { CombatCalculator } from './calculators/combat/CombatCalculator';
import { LorcanaCalculator } from './calculators/lorcana/LorcanaCalculator';
import { colors, sp } from './styles/tokens';

type TabId = 'hyper' | 'charge' | 'combat' | 'lorcana';

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
  { id: 'combat', label: 'Combate WH40K' },
  { id: 'lorcana', label: 'Lorcana' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('hyper');

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text }}>

      <header
        style={{
          borderBottom: `1px solid ${colors.border}`,
          padding: `${sp.md} ${sp.xl}`,
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
          padding: `0 ${sp.xl}`,
          display: 'flex',
          gap: sp.xs,
          overflowX: 'auto',
        }}
      >
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
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

      <main style={{ maxWidth: 860, margin: '0 auto', padding: sp.xl }}>
        {activeTab === 'hyper'   && <HypergeometricCalculator />}
        {activeTab === 'charge'  && <ChargeCalculator />}
        {activeTab === 'combat'  && <CombatCalculator />}
        {activeTab === 'lorcana' && <LorcanaCalculator />}
      </main>

    </div>
  );
}
