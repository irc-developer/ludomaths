import type { ReactNode } from 'react';
import { colors, sp } from '../styles/tokens';

export interface SectionCardProps {
  title: string;
  /** Fórmula matemática principal en texto plano (monospace). */
  formula: string;
  /** Explicación pedagógica del concepto para enseñar a amigos. */
  explanation: string;
  children: ReactNode;
}

/**
 * Wrapper de sección con título, fórmula y explicación matemática.
 *
 * SRP: su única responsabilidad es la presentación del encuadre educativo.
 * Los detalles de cálculo son responsabilidad de los componentes hijos.
 */
export function SectionCard({ title, formula, explanation, children }: SectionCardProps) {
  return (
    <section
      style={{
        background: colors.surface,
        borderRadius: 12,
        padding: sp.lg,
        marginBottom: sp.lg,
      }}
    >
      <h2
        style={{
          fontWeight: 600,
          fontSize: '1.1rem',
          color: colors.primaryLight,
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </h2>

      <pre
        style={{
          background: colors.surfaceAlt,
          borderRadius: 6,
          padding: '0.5rem 1rem',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          color: colors.primary,
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          margin: `0 0 ${sp.sm}`,
        }}
      >
        {formula}
      </pre>

      <p
        style={{
          fontSize: '0.8rem',
          color: colors.muted,
          marginBottom: sp.lg,
          lineHeight: 1.6,
        }}
      >
        {explanation}
      </p>

      {children}
    </section>
  );
}
