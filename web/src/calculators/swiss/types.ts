/**
 * Tipos del dominio Swiss para el simulador de posición en torneo Melee/Lorcana.
 *
 * Terminología alineada con los CSV de Melee:
 *   MW%  = Match Win %
 *   OMW% = Opponent Match Win %
 *   GW%  = Game Win %
 *   OGW% = Opponent Game Win %
 */

export type MatchOutcome = 'W' | 'L' | 'D';

/** Una fila del standings CSV de Melee. */
export interface StandingRow {
  userId:       number;
  rank:         number;
  player:       string;
  record:       string;   // "2-1-0"
  matchPoints:  number;
  mwPct:        number;
  omwPct:       number;
  gwPct:        number;
  ogwPct:       number;
  roundNumber:  number;
}

/** Una fila del matches CSV de Melee. */
export interface MatchRow {
  matchId:       number;
  tableNumber:   number;
  playerA:       string;
  playerB:       string;
  winner:        string;   // nombre del ganador, "" si empate
  gamesWonWinner: number;
  gamesWonLoser:  number;
  gamesDrawn:     number;
}

/** Registro interno de un jugador con todo el historial calculado. */
export interface PlayerState {
  userId:       number;
  player:       string;
  wins:         number;
  losses:       number;
  draws:        number;
  matchPoints:  number;
  /** Lista de userId de oponentes jugados, en orden de ronda. */
  opponentIds:  number[];
  /** Juegos ganados acumulados. */
  gamesWon:     number;
  /** Juegos totales acumulados (partidos × 2 o 3). */
  gamesTotal:   number;
}

/** Resultado proyectado de un jugador tras simular la ronda siguiente. */
export interface ProjectedStanding {
  userId:       number;
  player:       string;
  record:       string;
  matchPoints:  number;
  mwPct:        number;
  omwPct:       number;
  gwPct:        number;
  ogwPct:       number;
  rankBest:     number;
  rankWorst:    number;
}
