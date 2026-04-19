/**
 * Tests del motor Swiss de simulación de posición en torneo.
 *
 * Contrato verificado:
 * - buildPlayerStates acumula gamesWon/gamesTotal correctamente desde los matches.
 * - projectStandings aumenta MP en 3/1/0 según el resultado W/D/L.
 * - Se aplica el suelo de 1/3 a GW% cuando los juegos ganados < total/3.
 * - Se aplica el suelo de 1/3 a la contribución de cada oponente en OMW%.
 * - El jugador con más MP ocupa el puesto 1 en ambos escenarios.
 * - El escenario best siempre tiene OMW% ≥ escenario worst para el ganador
 *   (sus oponentes históricos mejorarán o empeorarán según el caso).
 *
 * Fixture: torneo de 4 jugadores tras la Ronda 1.
 *
 *   Alpha (id=1) ganó a Gamma (id=3): 2-0
 *   Beta  (id=2) ganó a Delta (id=4): 2-1
 *
 *   Ronda 2 prevista: Alpha vs Beta (ganadores), Gamma vs Delta (perdedores)
 *
 * Valores calculados a mano para el escenario "Alpha gana (2-1) vs Beta":
 *
 *   gamesWon_Alpha  = 2 + 2 = 4,  gamesTotal_Alpha = 2 + 3 = 5
 *   GW%_Alpha = max(4/5, 1/3) = 0.8
 *
 *   Best case (Gamma gana la otra mesa):
 *     OMW%_Alpha = avg(MW%_Gamma=0.5, MW%_Beta=0.5) = 0.5
 *
 *   Worst case (Delta gana la otra mesa):
 *     OMW%_Alpha = avg(max(MW%_Gamma=0, 1/3), MW%_Beta=0.5) = avg(1/3, 0.5) ≈ 0.4167
 */

import { describe, it, expect } from 'vitest';
import { buildPlayerStates, projectStandings } from './engine';
import type { StandingRow, MatchRow } from './types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const r1Standings: StandingRow[] = [
  { userId: 1, rank: 1, player: 'Alpha', record: '1-0-0', matchPoints: 3, mwPct: 1.0,  omwPct: 1/3, gwPct: 1.0,  ogwPct: 1/3, roundNumber: 1 },
  { userId: 2, rank: 2, player: 'Beta',  record: '1-0-0', matchPoints: 3, mwPct: 1.0,  omwPct: 1/3, gwPct: 2/3,  ogwPct: 1/3, roundNumber: 1 },
  { userId: 3, rank: 3, player: 'Gamma', record: '0-1-0', matchPoints: 0, mwPct: 0.0,  omwPct: 1.0, gwPct: 1/3,  ogwPct: 1.0, roundNumber: 1 },
  { userId: 4, rank: 4, player: 'Delta', record: '0-1-0', matchPoints: 0, mwPct: 0.0,  omwPct: 1.0, gwPct: 1/3,  ogwPct: 2/3, roundNumber: 1 },
];

const r1Matches: MatchRow[] = [
  { matchId: 1, tableNumber: 1, playerA: 'Alpha', playerB: 'Gamma', winner: 'Alpha', gamesWonWinner: 2, gamesWonLoser: 0, gamesDrawn: 0 },
  { matchId: 2, tableNumber: 2, playerA: 'Beta',  playerB: 'Delta', winner: 'Beta',  gamesWonWinner: 2, gamesWonLoser: 1, gamesDrawn: 0 },
];

const r2Matchups = [
  { playerA: 'Alpha', playerB: 'Beta'  },
  { playerA: 'Gamma', playerB: 'Delta' },
];

// ---------------------------------------------------------------------------
// buildPlayerStates
// ---------------------------------------------------------------------------

describe('buildPlayerStates', () => {
  it('acumula gamesWon y gamesTotal desde los matches (victoria 2-0)', () => {
    const states = buildPlayerStates(r1Standings, r1Matches);

    const alpha = states.get('Alpha')!;
    expect(alpha.gamesWon).toBe(2);
    expect(alpha.gamesTotal).toBe(2);
  });

  it('acumula gamesWon y gamesTotal para el perdedor de un 2-0', () => {
    const states = buildPlayerStates(r1Standings, r1Matches);

    const gamma = states.get('Gamma')!;
    expect(gamma.gamesWon).toBe(0);
    expect(gamma.gamesTotal).toBe(2);
  });

  it('acumula gamesWon y gamesTotal para el ganador de un 2-1', () => {
    const states = buildPlayerStates(r1Standings, r1Matches);

    const beta = states.get('Beta')!;
    expect(beta.gamesWon).toBe(2);
    expect(beta.gamesTotal).toBe(3);
  });

  it('acumula gamesWon para el perdedor de un 2-1', () => {
    const states = buildPlayerStates(r1Standings, r1Matches);

    const delta = states.get('Delta')!;
    expect(delta.gamesWon).toBe(1);
    expect(delta.gamesTotal).toBe(3);
  });

  it('registra el userId del oponente en opponentIds', () => {
    const states = buildPlayerStates(r1Standings, r1Matches);

    // Alpha (id=1) jugó contra Gamma (id=3)
    expect(states.get('Alpha')!.opponentIds).toContain(3);
    // Beta (id=2) jugó contra Delta (id=4)
    expect(states.get('Beta')!.opponentIds).toContain(4);
  });
});

// ---------------------------------------------------------------------------
// projectStandings — Match Points por resultado
// ---------------------------------------------------------------------------

describe('projectStandings — match points', () => {
  const states = buildPlayerStates(r1Standings, r1Matches);

  it('W incrementa MP en 3 (de 3 a 6)', () => {
    const { best } = projectStandings('Alpha', 'W', 2, 1, 'Beta', states, r2Matchups);
    const alpha = best.find(r => r.player === 'Alpha')!;

    expect(alpha.matchPoints).toBe(6);
    expect(alpha.record).toBe('2-0-0');
  });

  it('D incrementa MP en 1 (de 3 a 4)', () => {
    const { best } = projectStandings('Alpha', 'D', 0, 0, 'Beta', states, r2Matchups);
    const alpha = best.find(r => r.player === 'Alpha')!;

    expect(alpha.matchPoints).toBe(4);
    expect(alpha.record).toBe('1-0-1');
  });

  it('L incrementa MP en 0 (permanece en 3)', () => {
    const { best } = projectStandings('Alpha', 'L', 0, 2, 'Beta', states, r2Matchups);
    const alpha = best.find(r => r.player === 'Alpha')!;

    expect(alpha.matchPoints).toBe(3);
    expect(alpha.record).toBe('1-1-0');
  });
});

// ---------------------------------------------------------------------------
// projectStandings — GW% y OMW% con suelo 1/3
// ---------------------------------------------------------------------------

describe('projectStandings — tiebreakers con suelo 1/3', () => {
  const states = buildPlayerStates(r1Standings, r1Matches);

  it('GW%_Alpha = 0.8 en ambos escenarios tras ganar 2-1 (4 juegos de 5)', () => {
    // GW% = max(4/5, 1/3) = 0.8
    const { best, worst } = projectStandings('Alpha', 'W', 2, 1, 'Beta', states, r2Matchups);

    expect(best.find(r => r.player === 'Alpha')!.gwPct).toBeCloseTo(0.8, 5);
    expect(worst.find(r => r.player === 'Alpha')!.gwPct).toBeCloseTo(0.8, 5);
  });

  it('OMW%_Alpha (best) ≥ OMW%_Alpha (worst)', () => {
    // Best: Gamma gana → MW%_Gamma=0.5 → contribución=0.5
    // Worst: Gamma pierde → MW%_Gamma=0 → contribución=1/3 (suelo)
    const { best, worst } = projectStandings('Alpha', 'W', 2, 1, 'Beta', states, r2Matchups);

    const omwBest  = best.find(r => r.player === 'Alpha')!.omwPct;
    const omwWorst = worst.find(r => r.player === 'Alpha')!.omwPct;

    expect(omwBest).toBeGreaterThanOrEqual(omwWorst - 1e-9);
  });

  it('OMW%_Alpha (best) = 0.5 — ambos oponentes acaban 1-1 (MW%=0.5)', () => {
    // Gamma gana R2 (best case): MW%_Gamma=1/2, MW%_Beta=1/2 → OMW%=0.5
    const { best } = projectStandings('Alpha', 'W', 2, 1, 'Beta', states, r2Matchups);
    const alpha = best.find(r => r.player === 'Alpha')!;

    expect(alpha.omwPct).toBeCloseTo(0.5, 5);
  });

  it('OMW%_Alpha (worst) ≈ 0.4167 — suelo 1/3 aplicado al oponente que pierde dos veces', () => {
    // Delta gana R2 (worst case): Gamma queda 0-2, MW%_Gamma=0 → suelo 1/3
    // avg(1/3, 0.5) = 5/12 ≈ 0.4167
    const { worst } = projectStandings('Alpha', 'W', 2, 1, 'Beta', states, r2Matchups);
    const alpha = worst.find(r => r.player === 'Alpha')!;

    expect(alpha.omwPct).toBeCloseTo(5 / 12, 4);
  });
});

// ---------------------------------------------------------------------------
// projectStandings — ordenación
// ---------------------------------------------------------------------------

describe('projectStandings — ranking', () => {
  const states = buildPlayerStates(r1Standings, r1Matches);

  it('el jugador con más MP ocupa el puesto 1 en best y worst', () => {
    const { best, worst } = projectStandings('Alpha', 'W', 2, 1, 'Beta', states, r2Matchups);

    // Alpha gana → MP=6, nadie más puede alcanzar 6
    expect(best.find(r => r.player === 'Alpha')!.rankBest).toBe(1);
    expect(worst.find(r => r.player === 'Alpha')!.rankBest).toBe(1);
  });

  it('el perdedor absoluto (0 victorias) ocupa el último puesto', () => {
    // Tras una victoria de Alpha, en worst case Gamma pierde dos veces → MP=0
    // → Gamma debe estar en el puesto más bajo del ranking worst
    const { worst } = projectStandings('Alpha', 'W', 2, 1, 'Beta', states, r2Matchups);
    const sorted = [...worst].sort((a, b) => a.rankBest - b.rankBest);
    const last = sorted[sorted.length - 1]!;

    expect(last.matchPoints).toBe(0);
  });

  it('MP desempata antes que OMW%: Beta y Gamma con MP=3 van por encima de Delta con MP=0 (best case)', () => {
    const { best } = projectStandings('Alpha', 'W', 2, 1, 'Beta', states, r2Matchups);
    const delta = best.find(r => r.player === 'Delta')!;
    const beta  = best.find(r => r.player === 'Beta')!;

    expect(delta.matchPoints).toBe(0);
    expect(beta.matchPoints).toBe(3);
    expect(delta.rankBest).toBeGreaterThan(beta.rankBest);
  });
});
