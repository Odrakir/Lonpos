import type { Board, BoardCell } from '../data/board';

const FILLED_CELL = '#';
const EMPTY_CELL = '.';

export function cellsFromAscii(lines: string[]): Array<[row: number, column: number]> {
  return lines.flatMap((line, row) =>
    Array.from(line).flatMap((cell, column) => {
      if (cell === FILLED_CELL) {
        return [[row, column] as [number, number]];
      }

      if (cell === EMPTY_CELL) {
        return [];
      }

      throw new Error(
        `Invalid ASCII board cell "${cell}" at row ${row}, column ${column}. Expected "${FILLED_CELL}" or "${EMPTY_CELL}".`,
      );
    }),
  );
}

export function boardFromAscii(lines: string[]): Board {
  return lines.map((line, row) =>
    Array.from(line).map((cell, column) => {
      if (cell === FILLED_CELL) {
        return 1 as BoardCell;
      }

      if (cell === EMPTY_CELL) {
        return 0 as BoardCell;
      }

      throw new Error(
        `Invalid ASCII board cell "${cell}" at row ${row}, column ${column}. Expected "${FILLED_CELL}" or "${EMPTY_CELL}".`,
      );
    }),
  );
}
