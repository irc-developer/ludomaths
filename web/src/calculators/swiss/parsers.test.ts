/**
 * Tests del parser de CSVs de Melee.
 *
 * Contrato verificado:
 * - parseStandingsCsv extrae los 9 campos relevantes de cada fila.
 * - parseMatchesCsv extrae playerA/playerB del campo "Players" y los contadores
 *   de juegos de los índices 8/9/10 (Games Won by Winner/Loser/Drawn).
 * - splitCsvLine (indirectamente) maneja comillas que envuelven comas.
 *
 * Invariantes:
 *   parseStandingsCsv(csv).length === líneas − 1  (descarta cabecera)
 *   parseMatchesCsv(csv).length  === líneas − 1
 *   draw match → winner === ''
 *   deck name con coma entre comillas no desplaza las columnas siguientes
 */

import { describe, it, expect } from 'vitest';
import { parseStandingsCsv, parseMatchesCsv } from './parsers';

// ---------------------------------------------------------------------------
// Cabeceras exactas del export de Melee
// ---------------------------------------------------------------------------

const STANDINGS_HEADER =
  'User ID,User Event Status ID,Rank,Player,Game Name,Display Name,Email,' +
  'Registration Status,Legend,Deck Status,Record (W-L-D),Match Points,' +
  'MW%,Opponent Match Win %,Game Win %,Opponent Game Win %,Round Number';

const MATCHES_HEADER =
  'Match ID,Table Number,Status,Players,Winner,Is Bye,Is Feature Match,' +
  'Is Ghost Match,Games Won by Winner,Games Won by Loser,Games Drawn,' +
  'Time Extension (s),Is Intentional Draw,Deck Check Started,Deck Check Completed,' +
  'Created At,Updated At';

// ---------------------------------------------------------------------------
// parseStandingsCsv
// ---------------------------------------------------------------------------

describe('parseStandingsCsv', () => {
  it('parsea correctamente todos los campos de una fila de victoria', () => {
    const csv = [
      STANDINGS_HEADER,
      '9681,1300795,1,Rubén D,TS_RDurban,TS_RDurban,r@r.com,ELIMINATED,Deck,valid,1-0-0,3,1.0000,0.33,1.0,0.33,1',
    ].join('\n');

    const rows = parseStandingsCsv(csv);

    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.userId).toBe(9681);
    expect(row.rank).toBe(1);
    expect(row.player).toBe('Rubén D');
    expect(row.record).toBe('1-0-0');
    expect(row.matchPoints).toBe(3);
    expect(row.mwPct).toBeCloseTo(1.0);
    expect(row.omwPct).toBeCloseTo(0.33);
    expect(row.gwPct).toBeCloseTo(1.0);
    expect(row.ogwPct).toBeCloseTo(0.33);
    expect(row.roundNumber).toBe(1);
  });

  it('devuelve tantas filas como jugadores (sin contar la cabecera)', () => {
    const csv = [
      STANDINGS_HEADER,
      '1,1,1,Alice,A,A,a@a.com,OK,Deck,valid,1-0-0,3,1.0,0.33,1.0,0.33,1',
      '2,2,2,Bob,B,B,b@b.com,OK,Deck,valid,0-1-0,0,0.0,1.0,0.33,1.0,1',
    ].join('\n');

    const rows = parseStandingsCsv(csv);

    expect(rows).toHaveLength(2);
    expect(rows[0]!.player).toBe('Alice');
    expect(rows[1]!.player).toBe('Bob');
  });

  it('no desplaza columnas cuando el nombre de mazo contiene comas (entre comillas)', () => {
    // El nombre del mazo en col 8 tiene coma; sin protección de comillas
    // cols[10] y siguientes quedarían desplazados.
    const csv = [
      STANDINGS_HEADER,
      '1,1,1,Alice,A,A,a@a.com,OK,"Mazo, con coma",valid,1-0-0,3,1.0,0.33,1.0,0.33,1',
    ].join('\n');

    const rows = parseStandingsCsv(csv);
    const row  = rows[0]!;

    expect(row.record).toBe('1-0-0');
    expect(row.matchPoints).toBe(3);
    expect(row.roundNumber).toBe(1);
  });

  it('parsea correctamente matchPoints fraccionarios (empates dan 1 punto)', () => {
    const csv = [
      STANDINGS_HEADER,
      '5,5,5,Carlos,C,C,c@c.com,OK,Deck,valid,0-1-1,1,0.0000,0.66555556,0.33,0.59809524,2',
    ].join('\n');

    const row = parseStandingsCsv(csv)[0]!;

    expect(row.matchPoints).toBe(1);
    expect(row.record).toBe('0-1-1');
  });
});

// ---------------------------------------------------------------------------
// parseMatchesCsv
// ---------------------------------------------------------------------------

describe('parseMatchesCsv', () => {
  it('parsea correctamente una partida ganada (2-0)', () => {
    const csv = [
      MATCHES_HEADER,
      '2280150,1,COMPLETE,Jonathan R vs Juan Elías L,Jonathan R,False,False,False,2,0,0,0,False,False,False,2026-01-17T10:08:28+00:00,2026-01-17T10:43:11+00:00',
    ].join('\n');

    const rows = parseMatchesCsv(csv);

    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.matchId).toBe(2280150);
    expect(row.tableNumber).toBe(1);
    expect(row.playerA).toBe('Jonathan R');
    expect(row.playerB).toBe('Juan Elías L');
    expect(row.winner).toBe('Jonathan R');
    expect(row.gamesWonWinner).toBe(2);
    expect(row.gamesWonLoser).toBe(0);
    expect(row.gamesDrawn).toBe(0);
  });

  it('parsea un empate de partida: winner vacío, gamesDrawn ≥ 1', () => {
    // Match ID 2281266: Juan I vs Misterio G → empate 1-1
    const csv = [
      MATCHES_HEADER,
      '2281266,5,COMPLETE,Juan I vs Misterio G,,False,False,False,1,1,1,0,False,False,False,2026-01-17T10:49:52+00:00,2026-01-17T11:38:09+00:00',
    ].join('\n');

    const row = parseMatchesCsv(csv)[0]!;

    expect(row.winner).toBe('');
    expect(row.gamesWonWinner).toBe(1);
    expect(row.gamesWonLoser).toBe(1);
    expect(row.gamesDrawn).toBe(1);
  });

  it('extrae playerA y playerB del campo Players separado por " vs "', () => {
    const csv = [
      MATCHES_HEADER,
      '1,1,COMPLETE,TS_Gallonet🍊 vs TS_Falconeti,TS_Gallonet🍊,False,False,False,2,1,0,0,False,False,False,2026-01-17T00:00:00+00:00,2026-01-17T00:00:00+00:00',
    ].join('\n');

    const row = parseMatchesCsv(csv)[0]!;

    expect(row.playerA).toBe('TS_Gallonet🍊');
    expect(row.playerB).toBe('TS_Falconeti');
  });

  it('lee los contadores de juegos desde las columnas correctas (8, 9, 10)', () => {
    // Verifica que cols[7]="Is Ghost Match" no se confunde con gamesWonWinner.
    // Una victoria 2-1: gamesWonWinner=2, gamesWonLoser=1, gamesDrawn=0.
    const csv = [
      MATCHES_HEADER,
      '99,2,COMPLETE,Alpha vs Beta,Alpha,False,False,False,2,1,0,0,False,False,False,2026-01-01T00:00:00+00:00,2026-01-01T00:01:00+00:00',
    ].join('\n');

    const row = parseMatchesCsv(csv)[0]!;

    expect(row.gamesWonWinner).toBe(2);
    expect(row.gamesWonLoser).toBe(1);
    expect(row.gamesDrawn).toBe(0);
  });
});
