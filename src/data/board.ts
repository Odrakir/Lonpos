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
