import { colors } from '../styles/tokens';

export interface DistributionEntry {
  value: number;
  probability: number;
}

export interface DistributionBarProps {
  entries: DistributionEntry[];
  title?: string;
  /** Entradas con probabilidad < threshold se omiten. Por defecto 0.001 (0.1%). */
  minProbability?: number;
  maxEntries?: number;
}

/**
 * Gráfico de barras horizontales para una distribución discreta.
 *
 * La barra más larga representa siempre el 100% del ancho visual.
 * El resto se escalan relativamente, lo que facilita comparar la forma
 * de la distribución sin necesidad de un eje Y explícito.
 */
export function DistributionBar({
  entries,
  title,
  minProbability = 0.001,
  maxEntries = 20,
}: DistributionBarProps) {
  const visible = entries
    .filter(e => e.probability >= minProbability)
    .slice(0, maxEntries);

  if (visible.length === 0) return null;

  const maxProb = Math.max(...visible.map(e => e.probability));

  return (
    <div>
      {title && (
        <div style={{ fontSize: '0.75rem', color: colors.muted, marginBottom: '0.5rem' }}>
          {title}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visible.map(({ value, probability }) => (
          <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 28,
                textAlign: 'right',
                fontSize: '0.75rem',
                color: colors.muted,
                flexShrink: 0,
              }}
            >
              {value}
            </span>
            <div
              style={{
                flex: 1,
                background: colors.border,
                borderRadius: 4,
                height: 16,
              }}
            >
              <div
                style={{
                  width: `${(probability / maxProb) * 100}%`,
                  background: colors.primary,
                  height: '100%',
                  borderRadius: 4,
                  transition: 'width 0.2s',
                }}
              />
            </div>
            <span
              style={{ width: 48, fontSize: '0.75rem', color: colors.muted, flexShrink: 0 }}
            >
              {(probability * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
