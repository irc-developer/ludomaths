import { useState, useMemo } from 'react';
import { parseStandingsCsv, parseMatchesCsv } from './parsers';
import { buildPlayerStates, projectStandings } from './engine';
import type { MatchOutcome, PlayerState, ProjectedStanding } from './types';

export interface TableMatchup {
  playerA: string;
  playerB: string;
}

export interface RankRange {
  /** Mejor puesto posible (más bajo = mejor). */
  bestRank:  number;
  /** Peor puesto posible. */
  worstRank: number;
}

export interface SwissComparison {
  W: RankRange;
  D: RankRange;
  L: RankRange;
}

export interface SwissViewModel {
  players:         string[];
  matchups:        TableMatchup[];
  targetPlayer:    string;
  opponentName:    string;
  /** Outcome seleccionado para ver el detalle de la tabla. */
  selectedOutcome: MatchOutcome;
  /** Comparación de los 3 escenarios (null si faltan datos). */
  comparison:      SwissComparison | null;
  /** Standings proyectados del escenario seleccionado. */
  bestCase:        ProjectedStanding[] | null;
  worstCase:       ProjectedStanding[] | null;
  error:           string | null;
  loadStandings:      (csv: string) => void;
  loadMatches:        (csv: string) => void;
  setTargetPlayer:    (p: string) => void;
  setOpponentName:    (p: string) => void;
  setSelectedOutcome: (o: MatchOutcome) => void;
}

/**
 * Puntuaciones estándar usadas para la comparativa W/D/L.
 *  W = victoria habitual 2-1
 *  D = empate intencional 0-0 (sin juegos)
 *  L = derrota limpia 0-2
 */
const STANDARD_GAMES: Record<MatchOutcome, [number, number]> = {
  W: [2, 1],
  D: [0, 0],
  L: [0, 2],
};

export function useSwissSimulator(): SwissViewModel {
  const [standingsCsv, setStandingsCsv] = useState<string>('');
  const [matchesCsv,   setMatchesCsv]   = useState<string>('');
  const [targetPlayer, setTargetPlayer] = useState<string>('');
  const [opponentName, setOpponentName] = useState<string>('');
  const [selectedOutcome, setSelectedOutcome] = useState<MatchOutcome>('D');
  const [error, setError] = useState<string | null>(null);

  function loadStandings(csv: string) { setStandingsCsv(csv); setError(null); }
  function loadMatches(csv: string)   { setMatchesCsv(csv);   setError(null); }

  const players = useMemo(() => {
    if (!standingsCsv) return [];
    try { return parseStandingsCsv(standingsCsv).map(r => r.player); }
    catch { return []; }
  }, [standingsCsv]);

  const matchups = useMemo<TableMatchup[]>(() => {
    if (!matchesCsv) return [];
    try {
      return parseMatchesCsv(matchesCsv).map(m => ({ playerA: m.playerA, playerB: m.playerB }));
    } catch { return []; }
  }, [matchesCsv]);

  const resolvedOpponent = useMemo(() => {
    if (opponentName) return opponentName;
    if (!targetPlayer) return '';
    const match = matchups.find(m => m.playerA === targetPlayer || m.playerB === targetPlayer);
    if (!match) return '';
    return match.playerA === targetPlayer ? match.playerB : match.playerA;
  }, [targetPlayer, opponentName, matchups]);

  /** Estado base (antes de la ronda) memoizado para reutilizarlo en los 3 escenarios. */
  const states = useMemo<Map<string, PlayerState> | null>(() => {
    if (!standingsCsv || !matchesCsv) return null;
    try {
      const standings = parseStandingsCsv(standingsCsv);
      const matches   = parseMatchesCsv(matchesCsv);
      return buildPlayerStates(standings, matches);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      return null;
    }
  }, [standingsCsv, matchesCsv]);

  /** Comparativa de los 3 escenarios con puntuaciones estándar. */
  const comparison = useMemo<SwissComparison | null>(() => {
    if (!states || !targetPlayer || !resolvedOpponent) return null;
    try {
      const ranges = (['W', 'D', 'L'] as MatchOutcome[]).map(outcome => {
        const [gw, gl] = STANDARD_GAMES[outcome];
        const { best, worst } = projectStandings(
          targetPlayer, outcome, gw, gl, resolvedOpponent, states, matchups,
        );
        const bestRow  = best.find(r => r.player === targetPlayer);
        const worstRow = worst.find(r => r.player === targetPlayer);
        const r1 = bestRow?.rankBest  ?? Infinity;
        const r2 = worstRow?.rankBest ?? Infinity;
        return {
          outcome,
          bestRank:  Math.min(r1, r2),   // menor número = mejor posición
          worstRank: Math.max(r1, r2),
        };
      });
      return {
        W: { bestRank: ranges[0]!.bestRank,  worstRank: ranges[0]!.worstRank },
        D: { bestRank: ranges[1]!.bestRank,  worstRank: ranges[1]!.worstRank },
        L: { bestRank: ranges[2]!.bestRank,  worstRank: ranges[2]!.worstRank },
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      return null;
    }
  }, [states, targetPlayer, resolvedOpponent, matchups]);

  /** Detalle completo del escenario seleccionado. */
  const projection = useMemo(() => {
    if (!states || !targetPlayer || !resolvedOpponent) return null;
    try {
      const [gw, gl] = STANDARD_GAMES[selectedOutcome];
      return projectStandings(
        targetPlayer, selectedOutcome, gw, gl, resolvedOpponent, states, matchups,
      );
    } catch { return null; }
  }, [states, targetPlayer, resolvedOpponent, selectedOutcome, matchups]);

  return {
    players,
    matchups,
    targetPlayer,
    opponentName:    resolvedOpponent,
    selectedOutcome,
    comparison,
    bestCase:        projection?.best  ?? null,
    worstCase:       projection?.worst ?? null,
    error,
    loadStandings,
    loadMatches,
    setTargetPlayer,
    setOpponentName,
    setSelectedOutcome,
  };
}
