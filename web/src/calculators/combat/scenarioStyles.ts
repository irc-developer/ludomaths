import type { CSSProperties } from 'react';
import { colors, sp } from '../../styles/tokens';

export const scenarioPanel: CSSProperties = { border: `1px solid ${colors.border}`, borderRadius: 10, padding: sp.md,
  minWidth: 0, display: 'grid', alignContent: 'start', gap: sp.sm, background: colors.surfaceAlt };
export const scenarioInput: CSSProperties = { width: '100%', minHeight: 44, boxSizing: 'border-box', padding: '0.5rem', fontSize: '1rem',
  borderRadius: 6, background: colors.surfaceAlt, color: colors.text, border: `1px solid ${colors.controlBorder}` };
