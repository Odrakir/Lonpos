import type { Board } from '../data/board';

export type Cell = [row: number, column: number];

export function normalizeShape(shape: Cell[]): Cell[] {
  if (shape.length === 0) {
    return [];
  }

  const minRow = Math.min(...shape.map(([row]) => row));
  const minColumn = Math.min(...shape.map(([, column]) => column));

  return shape
    .map(([row, column]) => [row - minRow, column - minColumn] as Cell)
    .sort(([rowA, columnA], [rowB, columnB]) => rowA - rowB || columnA - columnB);
}

function rotate90Clockwise([row, column]: Cell): Cell {
  return [column, -row];
}

export function orientShape(shape: Cell[], orientIndex: number): Cell[] {
  let current = normalizeShape(shape);

  for (let index = 0; index < orientIndex; index += 1) {
    current = normalizeShape(current.map((cell) => rotate90Clockwise(cell)));
  }

  return current;
}

function inBounds(row: number, column: number, rows: number, columns: number): boolean {
  return row >= 0 && row < rows && column >= 0 && column < columns;
}

export function canPlace(
  board: Board,
  occupied: boolean[][],
  orientedCells: Cell[],
  anchor: Cell,
): Cell[] | null {
  const rows = board.length;
  const columns = board[0]?.length ?? 0;

  const absoluteCells = orientedCells.map(
    ([row, column]) => [anchor[0] + row, anchor[1] + column] as Cell,
  );

  for (const [row, column] of absoluteCells) {
    if (
      !inBounds(row, column, rows, columns)
      || board[row][column] !== 1
      || occupied[row][column]
    ) {
      return null;
    }
  }

  return absoluteCells;
}
