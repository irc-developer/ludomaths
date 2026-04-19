import { useRef, useState } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { colors, sp } from '../../styles/tokens';
import { useSwissSimulator } from './useSwissSimulator';
import type { MatchOutcome, ProjectedStanding } from './types';
import type { RankRange, SwissComparison } from './useSwissSimulator';

function pct(v: number): string { return (v * 100).toFixed(1) + '%'; }

// ---------------------------------------------------------------------------
// Objetivo de clasificación (cut)
// ---------------------------------------------------------------------------

type CutTarget = 8 | 16 | 0;   // 0 = sin objetivo

// ---------------------------------------------------------------------------
// Lógica de veredicto
// ---------------------------------------------------------------------------

interface Verdict {
  text:   string;
  detail: string;
  color:  string;
}

/**
 * Compara los escenarios D y W para responder "¿me compensa el empate?".
 *
 * Convención: puesto 1 = mejor posición (menor número = mejor clasificado).
 *  - drawSaferFloor: peor caso de D ≤ peor caso de W → empatar protege el suelo.
 *  - winHigherCeil:  mejor caso de W < mejor caso de D → ganar mejora el techo.
 *
 * @param cut  Umbral de clasificación (8, 16) o 0 si no hay objetivo.
 */
function getVerdict(cmp: SwissComparison, cut: CutTarget): Verdict {
  const { W, D } = cmp;
  const drawSaferFloor = D.worstRank <= W.worstRank;
  const winHigherCeil  = W.bestRank  <  D.bestRank;

  // Con objetivo de cut: razonar en términos de "garantizas/arriesgas el top N"
  if (cut > 0) {
    const drawGuaranteesCut  = D.worstRank <= cut;   // empate mete en top N incluso en peor caso
    const winGuaranteesCut   = W.worstRank <= cut;
    const drawPossibleCut    = D.bestRank  <= cut;   // empate puede meter en top N en mejor caso
    const winPossibleCut     = W.bestRank  <= cut;

    if (drawGuaranteesCut && !winGuaranteesCut) {
      return {
        text:   'PACTA EL EMPATE',
        detail: `Empatar garantiza el top ${cut} (peor caso: puesto ${D.worstRank}). Ganar no lo asegura: en el peor caso quedarías ${W.worstRank}°, fuera del top ${cut}.`,
        color:  colors.success,
      };
    }
    if (winGuaranteesCut && !drawGuaranteesCut) {
      return {
        text:   'JUEGA A GANAR',
        detail: `Solo ganar garantiza el top ${cut} (peor caso: puesto ${W.worstRank}). Empatando podrías quedarte en el ${D.worstRank}°, fuera del cut.`,
        color:  '#fb923c',
      };
    }
    if (winPossibleCut && !drawPossibleCut) {
      return {
        text:   'JUEGA A GANAR',
        detail: `Solo una victoria puede alcanzar el top ${cut} (mejor caso: puesto ${W.bestRank}). Empatando, el mejor resultado posible es el ${D.bestRank}°.`,
        color:  '#fb923c',
      };
    }
    if (!winPossibleCut && !drawPossibleCut) {
      return {
        text:   'SIN DIFERENCIA RELEVANTE',
        detail: `Ninguna opción puede alcanzar el top ${cut}. Ganar: ${W.bestRank}°–${W.worstRank}°. Empatar: ${D.bestRank}°–${D.worstRank}°.`,
        color:  colors.muted,
      };
    }
    // Ambas opciones tienen al menos posibilidad de entrar en el cut
    if (drawSaferFloor && !winHigherCeil) {
      return {
        text:   'PACTA EL EMPATE',
        detail: `Empatar protege mejor tu posición (peor caso ${D.worstRank}° vs ${W.worstRank}° ganando) sin perder opciones de top ${cut}.`,
        color:  colors.success,
      };
    }
    if (!drawSaferFloor && winHigherCeil) {
      return {
        text:   'JUEGA A GANAR',
        detail: `Ganar mejora el techo (puesto ${W.bestRank} vs ${D.bestRank} empatando) y no empeora el suelo. Merece la pena intentarlo.`,
        color:  '#fb923c',
      };
    }
    // drawSaferFloor && winHigherCeil → riesgo real
    const floorDiff = W.worstRank - D.worstRank;
    const ceilGain  = D.bestRank  - W.bestRank;
    return {
      text:   'DECISIÓN DE RIESGO',
      detail:
        `Ganar mejora el techo ${ceilGain} puesto${ceilGain !== 1 ? 's' : ''} (hasta el ${W.bestRank}°) ` +
        `pero en el peor caso te deja en el ${W.worstRank}° — ${floorDiff > 0 ? `${floorDiff} puesto${floorDiff !== 1 ? 's' : ''} peor` : 'mismo suelo'} que empatando (${D.worstRank}°).`,
      color:  '#facc15',
    };
  }

  // Sin objetivo de cut: comparativa genérica
  if (drawSaferFloor && !winHigherCeil) {
    const floorSame = D.worstRank === W.worstRank;
    return {
      text:   'PACTA EL EMPATE',
      detail: floorSame
        ? `Mismo suelo (puesto ${D.worstRank}) en ambas opciones, pero empatar asegura también el techo (puesto ${D.bestRank}).`
        : `Empatar te deja como mínimo en el ${D.worstRank}° incluso en el peor caso. Ganar arriesga el ${W.worstRank}°. Sin pérdida de techo.`,
      color:  colors.success,
    };
  }
  if (!drawSaferFloor && winHigherCeil) {
    return {
      text:   'JUEGA A GANAR',
      detail: `Ganar puede llevarte al ${W.bestRank}° y en el peor caso acabas en el ${W.worstRank}°. Empatando, el mejor caso posible es ya el ${D.bestRank}°.`,
      color:  '#fb923c',
    };
  }
  if (drawSaferFloor && winHigherCeil) {
    const floorDiff = W.worstRank - D.worstRank;
    const ceilGain  = D.bestRank  - W.bestRank;
    return {
      text:   'DECISIÓN DE RIESGO',
      detail:
        `Ganar mejora el techo ${ceilGain} puesto${ceilGain !== 1 ? 's' : ''} (hasta el ${W.bestRank}°) ` +
        `pero en el peor caso te deja en el ${W.worstRank}° — ${floorDiff > 0 ? `${floorDiff} puesto${floorDiff !== 1 ? 's' : ''} peor` : 'mismo suelo'} que empatando (${D.worstRank}°).`,
      color:  '#facc15',
    };
  }
  return {
    text:   'SIN DIFERENCIA RELEVANTE',
    detail: `Ganar y empatar producen resultados casi idénticos: ${W.bestRank}°–${W.worstRank}° vs ${D.bestRank}°–${D.worstRank}°.`,
    color:  colors.muted,
  };
}

/**
 * Color del puesto. Si hay objetivo de cut, verde = dentro / rojo = fuera.
 * Sin objetivo, escala por cuartiles relativos al total de jugadores.
 */
function rankColor(rank: number, total: number, cut: CutTarget): string {
  if (cut > 0) {
    if (rank <= cut)       return colors.success;
    if (rank <= cut * 1.5) return '#fb923c';
    return colors.error;
  }
  const ratio = rank / total;
  if (ratio <= 0.25) return colors.success;
  if (ratio <= 0.50) return '#86efac';
  if (ratio <= 0.75) return '#fb923c';
  return colors.error;
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function SwissSimulator() {
  const vm = useSwissSimulator();
  const standingsRef = useRef<HTMLInputElement>(null);
  const matchesRef   = useRef<HTMLInputElement>(null);
  const [cut, setCut] = useState<CutTarget>(0);

  function readFile(file: File, cb: (csv: string) => void) {
    const reader = new FileReader();
    reader.onload = e => cb((e.target?.result as string) ?? '');
    reader.readAsText(file);
  }

  const totalPlayers = vm.players.length || 16;
  const verdict = vm.comparison ? getVerdict(vm.comparison, cut) : null;

  // Dynamic styles — depend on verdict.color (unknown at module level)
  const verdictBannerStyle: React.CSSProperties = verdict ? {
    borderRadius: 10,
    border:       `2px solid ${verdict.color}`,
    background:   `${verdict.color}18`,
    padding:      `${sp.md} ${sp.lg}`,
    marginBottom: sp.md,
  } : {};
  const verdictTitleStyle: React.CSSProperties = verdict ? {
    fontSize:      '1.4rem',
    fontWeight:    800,
    color:         verdict.color,
    letterSpacing: '0.03em',
  } : {};

  return (
    <SectionCard
      title="Simulador Swiss — ¿Me compensa el empate?"
      formula={
        'OMW% = (1/n) Σ max(MW%_i, 1/3)\n' +
        'GW%  = max(gamesWon / gamesTotal, 1/3)\n' +
        'Orden desempate: MP → MW% → OMW% → GW% → OGW%'
      }
      explanation={
        'Carga los standings de la última ronda terminada y los emparejamientos de la ronda en curso. ' +
        'Selecciona tu jugador y el simulador muestra simultáneamente dónde acabarías en el mejor y peor ' +
        'caso para cada resultado posible (ganar, empatar o perder), respondiendo directamente si merece ' +
        'la pena pactar el empate.'
      }
    >
      {/* ---- Upload ---- */}
      <div style={grid2col}>
        <div style={uploadBox}>
          <div style={uploadLabel}>Standings CSV</div>
          <div style={fileHint}>standings-round-XXXX.csv</div>
          <input ref={standingsRef} type="file" accept=".csv" style={hiddenInput}
            onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, vm.loadStandings); }} />
          <button style={vm.players.length > 0 ? uploadBtnDone : uploadBtn}
            onClick={e => { e.stopPropagation(); standingsRef.current?.click(); }}>
            {vm.players.length > 0 ? `✓ ${vm.players.length} jugadores` : 'Seleccionar archivo…'}
          </button>
        </div>

        <div style={uploadBox}>
          <div style={uploadLabel}>Matches CSV (ronda actual)</div>
          <div style={fileHint}>matches-event-XXXX-round-Y.csv</div>
          <input ref={matchesRef} type="file" accept=".csv" style={hiddenInput}
            onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, vm.loadMatches); }} />
          <button style={vm.matchups.length > 0 ? uploadBtnDone : uploadBtn}
            onClick={e => { e.stopPropagation(); matchesRef.current?.click(); }}>
            {vm.matchups.length > 0 ? `✓ ${vm.matchups.length} mesas` : 'Seleccionar archivo…'}
          </button>
        </div>
      </div>

      {/* ---- Selección de jugador + objetivo ---- */}
      {vm.players.length > 0 && (
        <div style={grid3col}>
          <div style={fieldWrap}>
            <label style={fieldLabel}>Tu jugador</label>
            <select style={selectStyle} value={vm.targetPlayer}
              onChange={e => vm.setTargetPlayer(e.target.value)}>
              <option value="">— seleccionar —</option>
              {vm.players.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={fieldLabel}>Oponente esta ronda</label>
            <select style={selectStyle} value={vm.opponentName}
              onChange={e => vm.setOpponentName(e.target.value)}>
              <option value="">— auto-detectar —</option>
              {vm.players.filter(p => p !== vm.targetPlayer)
                .map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {vm.opponentName && (
              <span style={opponentConfirm}>✓ {vm.opponentName}</span>
            )}
          </div>
          <div style={fieldWrap}>
            <label style={fieldLabel}>Objetivo de clasificación</label>
            <select style={selectStyle} value={cut}
              onChange={e => setCut(Number(e.target.value) as CutTarget)}>
              <option value={0}>Sin objetivo</option>
              <option value={8}>Top 8</option>
              <option value={16}>Top 16</option>
            </select>
          </div>
        </div>
      )}

      {/* ---- Error ---- */}
      {vm.error && <p style={errorMsg}>⚠ {vm.error}</p>}

      {/* ---- Veredicto + comparativa (solo si hay datos) ---- */}
      {verdict && vm.comparison && (
        <>
          {/* Banner veredicto */}
          <div style={verdictBannerStyle}>
            <div style={verdictTitleStyle}>{verdict.text}</div>
            <div style={verdictDetailText}>{verdict.detail}</div>
          </div>

          {/* 3 tarjetas comparativas */}
          <div style={cardsGrid}>
            {(['W', 'D', 'L'] as MatchOutcome[]).map(o => (
              <OutcomeCard
                key={o}
                outcome={o}
                range={vm.comparison![o]}
                total={totalPlayers}
                cut={cut}
                selected={vm.selectedOutcome === o}
                onClick={() => vm.setSelectedOutcome(o)}
              />
            ))}
          </div>
          {/* Leyenda de dirección */}
          <div style={rankLegend}>
            Puesto 1 = 1° clasificado · cuanto más bajo el número, mejor
          </div>

          {/* Tabla de detalle del escenario seleccionado */}
          {vm.bestCase && vm.worstCase && (
            <>
              <div style={scenarioHeader}>
                Clasificación proyectada — escenario:{' '}
                <strong style={scenarioBold}>
                  {vm.selectedOutcome === 'W' ? 'Victoria' : vm.selectedOutcome === 'D' ? 'Empate' : 'Derrota'}
                </strong>
                {' '}(mejor caso / peor caso según otras mesas)
              </div>
              <StandingsTable
                best={vm.bestCase}
                worst={vm.worstCase}
                targetPlayer={vm.targetPlayer}
                total={totalPlayers}
                cut={cut}
              />
            </>
          )}
        </>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Tarjeta de resultado individual
// ---------------------------------------------------------------------------

const OUTCOME_META: Record<MatchOutcome, { label: string; games: string }> = {
  W: { label: 'GANAR',    games: '(2-1 est.)' },
  D: { label: 'EMPATAR',  games: '(0-0 int.)' },
  L: { label: 'PERDER',   games: '(0-2 est.)' },
};

function OutcomeCard({
  outcome, range, total, cut, selected, onClick,
}: {
  outcome:  MatchOutcome;
  range:    RankRange;
  total:    number;
  cut:      CutTarget;
  selected: boolean;
  onClick:  () => void;
}) {
  const meta       = OUTCOME_META[outcome];
  const bestColor  = rankColor(range.bestRank,  total, cut);
  const worstColor = rankColor(range.worstRank, total, cut);
  const sameRank   = range.bestRank === range.worstRank;

  // Dynamic styles — depend on selected / computed colors
  const btnStyle: React.CSSProperties = {
    background:   selected ? `${colors.primary}22` : colors.surfaceAlt,
    border:       `2px solid ${selected ? colors.primary : colors.border}`,
    borderRadius: 10,
    padding:      sp.md,
    cursor:       'pointer',
    textAlign:    'left',
    transition:   'border-color 0.15s, background 0.15s',
    width:        '100%',
  };
  const labelDivStyle: React.CSSProperties = {
    fontSize:      '0.7rem',
    fontWeight:    700,
    color:         selected ? colors.primary : colors.muted,
    letterSpacing: '0.08em',
    marginBottom:  '0.6rem',
  };
  const fixedRankNumStyle: React.CSSProperties = {
    fontSize:   '2.2rem',
    fontWeight: 800,
    color:      rankColor(range.bestRank, total, cut),
  };
  const bestNumStyle: React.CSSProperties = {
    fontSize:   '2rem',
    fontWeight: 800,
    lineHeight: 1,
    color:      bestColor,
  };
  const worstNumStyle: React.CSSProperties = {
    fontSize:   '2rem',
    fontWeight: 800,
    lineHeight: 1,
    color:      worstColor,
  };
  const selectionIndicatorStyle: React.CSSProperties = {
    marginTop:  '0.6rem',
    fontSize:   '0.68rem',
    color:      selected ? colors.primary : 'transparent',
    fontWeight: 600,
    textAlign:  'center',
  };

  return (
    <button onClick={onClick} style={btnStyle}>
      {/* Label */}
      <div style={labelDivStyle}>
        {meta.label}
        <span style={cardGameSpan}>{meta.games}</span>
      </div>

      {sameRank ? (
        /* Puesto fijo */
        <div style={rankFixedBox}>
          <span style={rankFixedLabel}>puesto</span>
          <span style={fixedRankNumStyle}>{range.bestRank}</span>
        </div>
      ) : (
        /* Rango */
        <div style={rankRangeBox}>
          <div style={rankSideBox}>
            <div style={rankSideLabel}>mejor</div>
            <div style={bestNumStyle}>{range.bestRank}°</div>
          </div>
          <div style={rankDivider}>–</div>
          <div style={rankSideBox}>
            <div style={rankSideLabel}>peor</div>
            <div style={worstNumStyle}>{range.worstRank}°</div>
          </div>
        </div>
      )}

      {/* Indicador de selección */}
      <div style={selectionIndicatorStyle}>ver clasificación ▾</div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tabla de standings proyectados
// ---------------------------------------------------------------------------

function StandingsTable({
  best, worst, targetPlayer, total, cut,
}: {
  best:         ProjectedStanding[];
  worst:        ProjectedStanding[];
  targetPlayer: string;
  total:        number;
  cut:          CutTarget;
}) {
  const merged = best.map(b => {
    const w = worst.find(x => x.userId === b.userId);
    return { ...b, rankWorst: w?.rankBest ?? b.rankBest };
  });
  merged.sort((a, b) => a.rankBest - b.rankBest);

  return (
    <div style={tableWrapper}>
      <table style={tableStyle}>
        <thead>
          <tr style={theadRow}>
            <th style={th}>Puesto</th>
            <th style={thLeft}>Jugador</th>
            <th style={th}>Record</th>
            <th style={th}>MP</th>
            <th style={th}>MW%</th>
            <th style={th}>OMW%</th>
            <th style={th}>GW%</th>
            <th style={th}>OGW%</th>
          </tr>
        </thead>
        <tbody>
          {merged.map(row => {
            const isTarget = row.player === targetPlayer;
            const sameRank = row.rankBest === row.rankWorst;
            const rankStr  = sameRank ? `${row.rankBest}` : `${row.rankBest}–${row.rankWorst}`;
            const rankCol  = rankColor(row.rankBest, total, cut);
            const isCutLine = cut > 0 && row.rankBest === cut;   // resaltar última fila del top N
            const trStyle: React.CSSProperties = {
              background:   isTarget ? `${colors.primary}22` : 'transparent',
              borderBottom: isCutLine
                ? `2px dashed ${colors.primary}`
                : `1px solid ${colors.border}`,
              fontWeight:   isTarget ? 700 : 400,
            };
            const rankTdStyle: React.CSSProperties = {
              ...td,
              textAlign:  'center',
              color:      isTarget ? rankCol : colors.muted,
              fontWeight: 700,
            };
            const playerTdStyle: React.CSSProperties = {
              ...td,
              color: isTarget ? colors.primary : colors.text,
            };
            return (
              <tr key={row.userId} style={trStyle}>
                <td style={rankTdStyle}>{rankStr}</td>
                <td style={playerTdStyle}>{isTarget ? `▶ ${row.player}` : row.player}</td>
                <td style={tdCenter}>{row.record}</td>
                <td style={tdCenter}>{row.matchPoints}</td>
                <td style={tdCenter}>{pct(row.mwPct)}</td>
                <td style={tdCenter}>{pct(row.omwPct)}</td>
                <td style={tdCenter}>{pct(row.gwPct)}</td>
                <td style={tdCenter}>{pct(row.ogwPct)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------

const uploadBox: React.CSSProperties = {
  background:   colors.surfaceAlt,
  border:       `1px solid ${colors.border}`,
  borderRadius: 8,
  padding:      sp.md,
};

const uploadLabel: React.CSSProperties = {
  fontSize:     '0.75rem',
  fontWeight:   600,
  color:        colors.primaryLight,
  marginBottom: '0.2rem',
};

const uploadBtn: React.CSSProperties = {
  background:   'none',
  border:       `1px dashed ${colors.border}`,
  borderRadius: 6,
  color:        colors.muted,
  padding:      '0.4rem 0.8rem',
  cursor:       'pointer',
  fontSize:     '0.8rem',
  width:        '100%',
};

const uploadBtnDone: React.CSSProperties = {
  ...uploadBtn,
  border: `1px solid ${colors.success}`,
  color:  colors.success,
};

const fieldWrap: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           '0.25rem',
};

const fieldLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  color:    colors.muted,
};

const selectStyle: React.CSSProperties = {
  background:   colors.surfaceAlt,
  border:       `1px solid ${colors.border}`,
  borderRadius: 6,
  color:        colors.text,
  padding:      '0.45rem 0.75rem',
  fontSize:     '0.9rem',
};

const th: React.CSSProperties = {
  padding:    '0.4rem 0.6rem',
  fontWeight: 600,
  textAlign:  'center',
};

const td: React.CSSProperties = {
  padding: '0.4rem 0.6rem',
  color:   colors.text,
};

// Derived from th / td — must be declared after them
const thLeft:   React.CSSProperties = { ...th, textAlign: 'left'   };
const tdCenter: React.CSSProperties = { ...td, textAlign: 'center' };

// Static layout / utility
const grid2col: React.CSSProperties = {
  display:             'grid',
  gridTemplateColumns: '1fr 1fr',
  gap:                 sp.md,
  marginBottom:        sp.lg,
};

const grid3col: React.CSSProperties = {
  display:             'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap:                 sp.md,
  marginBottom:        sp.lg,
};

const fileHint: React.CSSProperties = {
  fontSize:     '0.7rem',
  color:        colors.muted,
  marginBottom: '0.4rem',
};

const hiddenInput: React.CSSProperties = { display: 'none' };

const opponentConfirm: React.CSSProperties = {
  fontSize: '0.7rem',
  color:    colors.success,
};

const errorMsg: React.CSSProperties = {
  color:        colors.error,
  fontSize:     '0.85rem',
  marginBottom: sp.md,
};

const verdictDetailText: React.CSSProperties = {
  fontSize:  '0.85rem',
  color:     colors.text,
  marginTop: '0.3rem',
};

const cardsGrid: React.CSSProperties = {
  display:             'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap:                 sp.md,
  marginBottom:        '0.3rem',
};

const rankLegend: React.CSSProperties = {
  fontSize:     '0.68rem',
  color:        colors.muted,
  textAlign:    'right',
  marginBottom: sp.lg,
};

const scenarioHeader: React.CSSProperties = {
  fontSize:     '0.75rem',
  color:        colors.muted,
  marginBottom: '0.5rem',
  borderTop:    `1px solid ${colors.border}`,
  paddingTop:   sp.sm,
};

const scenarioBold: React.CSSProperties = { color: colors.primaryLight };

const cardGameSpan: React.CSSProperties = {
  fontWeight: 400,
  marginLeft: '0.4rem',
  color:      colors.muted,
};

const rankFixedBox: React.CSSProperties = {
  textAlign: 'center',
  padding:   '0.4rem 0',
};

const rankFixedLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  color:    colors.muted,
  display:  'block',
};

const rankRangeBox: React.CSSProperties = {
  display:        'flex',
  justifyContent: 'space-around',
  alignItems:     'flex-end',
  gap:            '0.2rem',
};

const rankSideBox: React.CSSProperties = { textAlign: 'center' };

const rankSideLabel: React.CSSProperties = {
  fontSize: '0.65rem',
  color:    colors.muted,
};

const rankDivider: React.CSSProperties = {
  color:         colors.border,
  fontSize:      '1.2rem',
  paddingBottom: '0.3rem',
};

const tableWrapper: React.CSSProperties = { overflowX: 'auto' };

const tableStyle: React.CSSProperties = {
  width:          '100%',
  borderCollapse: 'collapse',
  fontSize:       '0.8rem',
};

const theadRow: React.CSSProperties = {
  borderBottom: `1px solid ${colors.border}`,
  color:        colors.muted,
};
