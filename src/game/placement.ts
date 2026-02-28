import type { Board } from '../data/board';

export type Cell = [row: number, column: number];

export interface ShapeOrientation {
  orientKey: string;
  cells: Cell[];
}

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

function reflectAcrossVerticalAxis([row, column]: Cell): Cell {
  return [row, -column];
}

export function getOrientKey(shape: Cell[]): string {
  return normalizeShape(shape).map(([row, column]) => `${row},${column}`).join('|');
}

export function getShapeOrientations(shape: Cell[]): ShapeOrientation[] {
  const orientations: ShapeOrientation[] = [];
  const seen = new Set<string>();
  const candidates = [normalizeShape(shape), normalizeShape(shape.map((cell) => reflectAcrossVerticalAxis(cell)))];

  for (const candidate of candidates) {
    let current = candidate;

    for (let index = 0; index < 4; index += 1) {
      const cells = normalizeShape(current);
      const orientKey = getOrientKey(cells);

      if (!seen.has(orientKey)) {
        seen.add(orientKey);
        orientations.push({ orientKey, cells });
      }

      current = normalizeShape(current.map((cell) => rotate90Clockwise(cell)));
    }
  }

  return orientations;
}

export function orientShape(shape: Cell[], orientIndex: number): Cell[] {
  const orientations = getShapeOrientations(shape);
  if (orientations.length === 0) {
    return [];
  }

  const normalizedIndex = ((orientIndex % orientations.length) + orientations.length) % orientations.length;
  return orientations[normalizedIndex].cells;
}

export function rotateShape90(shape: Cell[]): Cell[] {
  return normalizeShape(shape.map((cell) => rotate90Clockwise(cell)));
}

export function flipShape(shape: Cell[]): Cell[] {
  return normalizeShape(shape.map((cell) => reflectAcrossVerticalAxis(cell)));
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
