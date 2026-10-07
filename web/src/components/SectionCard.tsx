import type { ReactNode } from 'react';
import { colors, sp } from '../styles/tokens';
import { s } from '../i18n/scenario';

export interface SectionCardProps {
  title: string;
  /** Fórmula matemática principal en texto plano (monospace). */
  formula: string;
  /** Explicación pedagógica del concepto para enseñar a amigos. */
  explanation: string;
  children: ReactNode;
  compact?: boolean;
  scopeLabel?: string;
}

/**
 * Wrapper de sección con título, fórmula y explicación matemática.
 *
 * SRP: su única responsabilidad es la presentación del encuadre educativo.
 * Los detalles de cálculo son responsabilidad de los componentes hijos.
 */
export function SectionCard({ title, formula, explanation, children, compact = false, scopeLabel }: SectionCardProps) {
  return (
    <section
      style={{
        background: colors.surface,
        borderRadius: 12,
        padding: compact ? 'clamp(0.75rem, 3vw, 1.5rem)' : sp.lg,
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

      {compact && <p className="scope-label">{scopeLabel ?? s('scopeShort')}</p>}
      {compact ? <details className="calculation-help"><summary>{s('calculationHelp')}</summary><p>{formula}</p><p>{explanation}</p></details> : <><pre
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
      </p></>}

      {children}
    </section>
  );
}
