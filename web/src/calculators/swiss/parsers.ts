import type { StandingRow, MatchRow } from './types';

/**
 * Parsea el contenido de un CSV de standings de Melee (formato Melee.gg export).
 *
 * Cabecera esperada:
 * User ID,User Event Status ID,Rank,Player,Game Name,Display Name,Email,
 * Registration Status,Legend,Deck Status,Record (W-L-D),Match Points,
 * MW%,Opponent Match Win %,Game Win %,Opponent Game Win %,Round Number
 */
export function parseStandingsCsv(csv: string): StandingRow[] {
  const lines = csv.trim().split('\n');
  // skip header
  return lines.slice(1).map(line => {
    const cols = splitCsvLine(line);
    const record = cols[10] ?? '0-0-0';
    return {
      userId:      parseInt(cols[0] ?? '0', 10),
      rank:        parseInt(cols[2] ?? '0', 10),
      player:      (cols[3] ?? '').trim(),
      record,
      matchPoints: parseFloat(cols[11] ?? '0'),
      mwPct:       parseFloat(cols[12] ?? '0'),
      omwPct:      parseFloat(cols[13] ?? '0'),
      gwPct:       parseFloat(cols[14] ?? '0'),
      ogwPct:      parseFloat(cols[15] ?? '0'),
      roundNumber: parseInt(cols[16] ?? '0', 10),
    };
  });
}

/**
 * Parsea el contenido de un CSV de partidas de Melee.
 *
 * Cabecera esperada:
 * Match ID,Table Number,Status,Players,Winner,Is Bye,...,
 * Games Won by Winner,Games Won by Loser,Games Drawn,...
 */
export function parseMatchesCsv(csv: string): MatchRow[] {
  const lines = csv.trim().split('\n');
  return lines.slice(1).map(line => {
    const cols = splitCsvLine(line);
    const players = (cols[3] ?? '').split(' vs ');
    const playerA = (players[0] ?? '').trim();
    const playerB = (players[1] ?? '').trim();
    return {
      matchId:        parseInt(cols[0] ?? '0', 10),
      tableNumber:    parseInt(cols[1] ?? '0', 10),
      playerA,
      playerB,
      winner:         (cols[4] ?? '').trim(),
      gamesWonWinner: parseInt(cols[8] ?? '0', 10),
      gamesWonLoser:  parseInt(cols[9] ?? '0', 10),
      gamesDrawn:     parseInt(cols[10] ?? '0', 10),
    };
  });
}

/**
 * Divide una línea CSV respetando comillas dobles.
 * Melee usa comas como separador y puede incluir comas dentro de comillas
 * (e.g. nombres de mazo largos).
 */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
