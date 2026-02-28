export const BOARD_COLUMNS = 20;
export const BOARD_ROWS = 14;

export type BoardCell = 0 | 1;
export type Board = BoardCell[][];

export function createEmptyBoard(
  rows: number = BOARD_ROWS,
  columns: number = BOARD_COLUMNS,
): Board {
  return Array.from({ length: rows }, () => Array.from({ length: columns }, () => 0 as BoardCell));
}

export function createBoardFromAscii(ascii: string): Board {
  const rows = ascii
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const columns = Math.max(...rows.map((line) => line.length));

  return rows.map((line) => {
    const padded = line.padEnd(columns, '.');
    return Array.from(padded, (character) => (character === '#' ? 1 : 0) as BoardCell);
  });
}
