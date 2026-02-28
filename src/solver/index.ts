import type { Board } from '../data/board';
import type { Piece } from '../data/pieces';
import { canPlace, normalizeShape, type Cell } from '../game/placement';

export interface PlacedPiece {
  pieceId: string;
  rotation: number;
  anchor: [row: number, column: number];
  cells: Array<[row: number, column: number]>;
}

export interface PrePlacedPiece {
  piece: Piece;
  anchor: [row: number, column: number];
  rotation?: number;
}

export interface SolveOptions {
  prePlacedPieces?: PrePlacedPiece[];
}

export interface SolveResult {
  solved: boolean;
  board: Board;
  placedPieces: PlacedPiece[];
}

interface Orientation {
  rotation: number;
  shape: Cell[];
}

function rotate90Clockwise(cell: Cell): Cell {
  return [cell[1], -cell[0]];
}

function getOrientations(piece: Piece): Orientation[] {
  const orientations: Orientation[] = [];
  const seen = new Set<string>();

  let current = normalizeShape(piece.shape);

  for (let rotation = 0; rotation < 4; rotation += 1) {
    const key = current.map(([row, column]) => `${row},${column}`).join('|');

    if (!seen.has(key)) {
      seen.add(key);
      orientations.push({
        rotation,
        shape: current,
      });
    }

    current = normalizeShape(current.map((cell) => rotate90Clockwise(cell)));
  }

  return orientations;
}

function createBoardMask(mask: Board): boolean[][] {
  return mask.map((row) => row.map((cell) => cell === 1));
}

function cloneBoard(mask: Board): Board {
  return mask.map((row) => [...row]);
}

function isRectangular(board: Board): boolean {
  if (board.length === 0) {
    return false;
  }

  const width = board[0].length;
  return width > 0 && board.every((row) => row.length === width);
}

export function solveBoard(
  boardMask: Board,
  availablePieces: Piece[],
  options: SolveOptions = {},
): SolveResult {
  if (!isRectangular(boardMask)) {
    return { solved: false, board: boardMask, placedPieces: [] };
  }

  const rows = boardMask.length;
  const columns = boardMask[0].length;
  const allowedMask = createBoardMask(boardMask);
  const solutionBoard = cloneBoard(boardMask).map((row) => row.map(() => 0 as 0 | 1));

  const occupied = Array.from({ length: rows }, () => Array.from({ length: columns }, () => false));
  const targetCells: Cell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (allowedMask[row][column]) {
        targetCells.push([row, column]);
      }
    }
  }

  const placedPieces: PlacedPiece[] = [];
  const prePlacedPieces = options.prePlacedPieces ?? [];

  for (const prePlaced of prePlacedPieces) {
    const orientations = getOrientations(prePlaced.piece);
    const orientation = orientations.find((item) => item.rotation === (prePlaced.rotation ?? 0));

    if (!orientation) {
      return { solved: false, board: boardMask, placedPieces: [] };
    }

    const absoluteCells = orientation.shape.map(
      ([row, column]) => [prePlaced.anchor[0] + row, prePlaced.anchor[1] + column] as Cell,
    );

    for (const [row, column] of absoluteCells) {
      if (
        row < 0
        || row >= rows
        || column < 0
        || column >= columns
        || !allowedMask[row][column]
        || occupied[row][column]
      ) {
        return { solved: false, board: boardMask, placedPieces: [] };
      }
    }

    for (const [row, column] of absoluteCells) {
      occupied[row][column] = true;
      solutionBoard[row][column] = 1;
    }

    placedPieces.push({
      pieceId: prePlaced.piece.id,
      rotation: orientation.rotation,
      anchor: prePlaced.anchor,
      cells: absoluteCells,
    });
  }

  const pieceOrientations = availablePieces.map((piece) => ({
    piece,
    orientations: getOrientations(piece),
  }));

  const totalTargetCount = targetCells.length;
  const preOccupiedCount = occupied.flat().filter(Boolean).length;

  function findNextTargetCell(): Cell | null {
    for (const [row, column] of targetCells) {
      if (!occupied[row][column]) {
        return [row, column];
      }
    }

    return null;
  }

  function backtrack(
    remaining: Array<{ piece: Piece; orientations: Orientation[] }>,
    occupiedCount: number,
  ): boolean {
    if (remaining.length === 0) {
      return occupiedCount === totalTargetCount;
    }

    const target = findNextTargetCell();

    if (!target) {
      return false;
    }

    for (let pieceIndex = 0; pieceIndex < remaining.length; pieceIndex += 1) {
      const candidate = remaining[pieceIndex];

      for (const orientation of candidate.orientations) {
        const triedAnchors = new Set<string>();

        for (const [shapeRow, shapeColumn] of orientation.shape) {
          const anchor: Cell = [target[0] - shapeRow, target[1] - shapeColumn];
          const anchorKey = `${anchor[0]},${anchor[1]}`;

          if (triedAnchors.has(anchorKey)) {
            continue;
          }
          triedAnchors.add(anchorKey);

          const absoluteCells = canPlace(boardMask, occupied, orientation.shape, anchor);

          if (!absoluteCells) {
            continue;
          }

          for (const [row, column] of absoluteCells) {
            occupied[row][column] = true;
            solutionBoard[row][column] = 1;
          }

          placedPieces.push({
            pieceId: candidate.piece.id,
            rotation: orientation.rotation,
            anchor,
            cells: absoluteCells,
          });

          const nextRemaining = remaining.filter((_, index) => index !== pieceIndex);
          const solved = backtrack(nextRemaining, occupiedCount + absoluteCells.length);

          if (solved) {
            return true;
          }

          placedPieces.pop();
          for (const [row, column] of absoluteCells) {
            occupied[row][column] = false;
            solutionBoard[row][column] = 0;
          }
        }
      }
    }

    return false;
  }

  const solved = backtrack(pieceOrientations, preOccupiedCount);

  return {
    solved,
    board: solved ? solutionBoard : boardMask,
    placedPieces: solved ? placedPieces : [],
  };
}
