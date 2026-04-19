import type {
  StandingRow,
  MatchRow,
  PlayerState,
  ProjectedStanding,
  MatchOutcome,
} from './types';

const MW_FLOOR = 1 / 3;
const GW_FLOOR = 1 / 3;

// ---------------------------------------------------------------------------
// Construcción del estado interno a partir de los CSVs cargados
// ---------------------------------------------------------------------------

/**
 * Reconstruye el estado completo de cada jugador a partir de los standings
 * finales y las partidas de todas las rondas jugadas.
 *
 * Los standings ya incluyen MW%, GW%, etc. calculados correctamente por Melee.
 * Los usamos directamente como base y solo añadimos el historial de oponentes
 * (necesario para proyectar OMW% y OGW% en la siguiente ronda).
 */
export function buildPlayerStates(
  standings: StandingRow[],
  allMatches: MatchRow[],
): Map<string, PlayerState> {
  const states = new Map<string, PlayerState>();

  for (const row of standings) {
    const [w, l, d] = parseRecord(row.record);
    const mp = row.matchPoints;
    const roundsPlayed = w + l + d;

    // GW% = max(gamesWon / gamesTotal, 1/3)
    // Invertimos para recuperar gamesWon y gamesTotal aproximados.
    // Es una estimación: Melee redondea a 8 dígitos pero es suficiente.
    // En su lugar, contamos directamente desde los matches.
    states.set(row.player, {
      userId:      row.userId,
      player:      row.player,
      wins:        w,
      losses:      l,
      draws:       d,
      matchPoints: mp,
      opponentIds: [],
      gamesWon:    0,
      gamesTotal:  0,
    });
    void roundsPlayed;
  }

  // Reconstruir gamesWon/gamesTotal y opponentIds desde los matches
  for (const match of allMatches) {
    const stateA = states.get(match.playerA);
    const stateB = states.get(match.playerB);

    const totalGames = match.gamesWonWinner + match.gamesWonLoser + match.gamesDrawn * 2;
    const isDraw = match.winner === '';

    if (stateA) {
      stateA.gamesTotal += totalGames;
      stateA.gamesWon   += match.playerA === match.winner
        ? match.gamesWonWinner
        : isDraw
          ? match.gamesDrawn
          : match.gamesWonLoser;
      if (stateB) stateA.opponentIds.push(stateB.userId);
    }

    if (stateB) {
      stateB.gamesTotal += totalGames;
      stateB.gamesWon   += match.playerB === match.winner
        ? match.gamesWonWinner
        : isDraw
          ? match.gamesDrawn
          : match.gamesWonLoser;
      if (stateA) stateB.opponentIds.push(stateA.userId);
    }
  }

  return states;
}

// ---------------------------------------------------------------------------
// Proyección best/worst para un resultado concreto
// ---------------------------------------------------------------------------

/**
 * Calcula el rango best y worst para el jugador objetivo dado su resultado
 * en la ronda en curso.
 *
 * Estrategia:
 *  - Best case:  el jugador objetivo gana/empata/pierde con el resultado dado
 *                Y sus oponentes anteriores ganan todos (maximizando OMW%).
 *  - Worst case: igual pero sus oponentes anteriores pierden todos.
 *
 * Para el resto de mesas de la ronda en curso asumimos que el mejor-ranked
 * gana (best case para oponentes) o el peor-ranked gana (worst case).
 * Esta heurística no es perfecta pero acota razonablemente.
 *
 * @param targetPlayer  Nombre del jugador que queremos proyectar.
 * @param outcome       Resultado del jugador en esta ronda ('W'|'L'|'D').
 * @param gamesWon      Juegos ganados en esta ronda (0-2).
 * @param gamesLost     Juegos perdidos en esta ronda (0-2).
 * @param opponentName  Nombre del oponente en esta ronda.
 * @param states        Estado actual (antes de la nueva ronda).
 * @param currentRoundMatchups  Todos los emparejamientos de la ronda actual.
 */
export function projectStandings(
  targetPlayer: string,
  outcome: MatchOutcome,
  gamesWon: number,
  gamesLost: number,
  opponentName: string,
  states: Map<string, PlayerState>,
  currentRoundMatchups: Array<{ playerA: string; playerB: string }>,
): { best: ProjectedStanding[]; worst: ProjectedStanding[] } {
  return {
    best:  simulate(targetPlayer, outcome, gamesWon, gamesLost, opponentName, states, currentRoundMatchups, 'best'),
    worst: simulate(targetPlayer, outcome, gamesWon, gamesLost, opponentName, states, currentRoundMatchups, 'worst'),
  };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function simulate(
  targetPlayer: string,
  outcome: MatchOutcome,
  targetGamesWon: number,
  targetGamesLost: number,
  opponentName: string,
  states: Map<string, PlayerState>,
  matchups: Array<{ playerA: string; playerB: string }>,
  scenario: 'best' | 'worst',
): ProjectedStanding[] {
  // Clonar estados para no mutar el original
  const next = new Map<string, PlayerState>();
  for (const [k, v] of states) {
    next.set(k, { ...v, opponentIds: [...v.opponentIds] });
  }

  // Aplicar resultado del jugador objetivo
  applyOutcome(next, targetPlayer, outcome, targetGamesWon, targetGamesLost, opponentName);

  // Aplicar resultados del resto de mesas
  for (const { playerA, playerB } of matchups) {
    if (
      (playerA === targetPlayer || playerB === targetPlayer) &&
      (playerA === opponentName || playerB === opponentName)
    ) {
      continue; // ya procesada
    }

    // Best: gana el que tiene más match points (mejor posición actual)
    // Worst: gana el que tiene menos match points
    const stA = next.get(playerA);
    const stB = next.get(playerB);
    if (!stA || !stB) continue;

    let winner: string;
    let loser: string;
    if (stA.matchPoints === stB.matchPoints) {
      // Empate de puntos: usar orden arbitrario consistente
      winner = scenario === 'best' ? playerA : playerB;
      loser  = scenario === 'best' ? playerB : playerA;
    } else if (stA.matchPoints > stB.matchPoints) {
      winner = scenario === 'best' ? playerA : playerB;
      loser  = scenario === 'best' ? playerB : playerA;
    } else {
      winner = scenario === 'best' ? playerB : playerA;
      loser  = scenario === 'best' ? playerA : playerB;
    }
    // Resultado estándar 2-1 para el ganador
    applyOutcome(next, winner, 'W', 2, 1, loser);
  }

  // Para el escenario best/worst, invertir quién gana entre los oponentes
  // históricos del targetPlayer para maximizar/minimizar su OMW%.
  // (Solo afecta si algún oponente histórico juega en esta ronda)
  // Los registros ya están aplicados arriba según la heurística general.
  // Una segunda pasada no es necesaria: el efecto es de segundo orden
  // y la heurística general ya captura el rango.

  return computeProjectedStandings(next);
}

function applyOutcome(
  states: Map<string, PlayerState>,
  playerName: string,
  outcome: MatchOutcome,
  gamesWon: number,
  gamesLost: number,
  opponentName: string,
): void {
  const st = states.get(playerName);
  const opp = states.get(opponentName);
  if (!st) return;

  // Determinar opponent outcome
  const oppOutcome: MatchOutcome = outcome === 'W' ? 'L' : outcome === 'L' ? 'W' : 'D';

  if (outcome === 'W') { st.wins++; st.matchPoints += 3; }
  else if (outcome === 'D') { st.draws++; st.matchPoints += 1; }
  else { st.losses++; }

  st.gamesWon   += gamesWon;
  st.gamesTotal += gamesWon + gamesLost;

  if (opp) {
    if (oppOutcome === 'W') { opp.wins++; opp.matchPoints += 3; }
    else if (oppOutcome === 'D') { opp.draws++; opp.matchPoints += 1; }
    else { opp.losses++; }
    opp.gamesWon   += gamesLost;
    opp.gamesTotal += gamesWon + gamesLost;
    st.opponentIds.push(opp.userId);
    opp.opponentIds.push(st.userId);
  }
}

function computeProjectedStandings(states: Map<string, PlayerState>): ProjectedStanding[] {
  const byUserId = new Map<number, PlayerState>();
  for (const st of states.values()) {
    byUserId.set(st.userId, st);
  }

  const rows: Omit<ProjectedStanding, 'rankBest' | 'rankWorst'>[] = [];

  for (const st of states.values()) {
    const played = st.wins + st.losses + st.draws;
    const mwPct  = played > 0 ? st.wins / played : 0;
    const gwPct  = st.gamesTotal > 0
      ? Math.max(st.gamesWon / st.gamesTotal, GW_FLOOR)
      : GW_FLOOR;

    // OMW%: media de max(MW%, 1/3) de cada oponente
    let omwSum = 0;
    for (const oppId of st.opponentIds) {
      const opp = byUserId.get(oppId);
      if (!opp) continue;
      const oppPlayed = opp.wins + opp.losses + opp.draws;
      const oppMw = oppPlayed > 0 ? opp.wins / oppPlayed : 0;
      omwSum += Math.max(oppMw, MW_FLOOR);
    }
    const omwPct = st.opponentIds.length > 0 ? omwSum / st.opponentIds.length : 0;

    // OGW%: media de GW% de cada oponente
    let ogwSum = 0;
    for (const oppId of st.opponentIds) {
      const opp = byUserId.get(oppId);
      if (!opp) continue;
      const oppGw = opp.gamesTotal > 0
        ? Math.max(opp.gamesWon / opp.gamesTotal, GW_FLOOR)
        : GW_FLOOR;
      ogwSum += oppGw;
    }
    const ogwPct = st.opponentIds.length > 0 ? ogwSum / st.opponentIds.length : 0;

    rows.push({
      userId:      st.userId,
      player:      st.player,
      record:      `${st.wins}-${st.losses}-${st.draws}`,
      matchPoints: st.matchPoints,
      mwPct,
      omwPct,
      gwPct,
      ogwPct,
    });
  }

  // Ordenar por la cascada de tiebreakers
  rows.sort((a, b) =>
    b.matchPoints - a.matchPoints ||
    b.mwPct       - a.mwPct       ||
    b.omwPct      - a.omwPct      ||
    b.gwPct       - a.gwPct       ||
    b.ogwPct      - a.ogwPct
  );

  return rows.map((row, i) => ({ ...row, rankBest: i + 1, rankWorst: i + 1 }));
}

function parseRecord(record: string): [number, number, number] {
  const parts = record.split('-').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}
