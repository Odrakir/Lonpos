import { PIECE_DEFS, type Piece } from '../data/pieces';
import { canPlace, normalizeShape, orientShape, type Cell } from '../game/placement';
import type { Board } from '../data/board';
import type { PrePlacedPiece } from './index';

interface UiPlacedPiece {
  pieceId: string;
  anchor: Cell;
  cells: Cell[];
}

export interface SolveInputFromUi {
  prePlacedPieces: PrePlacedPiece[];
  remainingPieces: Piece[];
}

export interface SolveInputError {
  error: string;
}

function cellsKey(cells: Cell[]): string {
  return normalizeShape(cells).map(([row, column]) => `${row},${column}`).join('|');
}

function getOrientationIndexByKey(piece: Piece): Map<string, number> {
  const orientationByKey = new Map<string, number>();

  for (let orientIndex = 0; orientIndex < 4; orientIndex += 1) {
    const key = cellsKey(orientShape(piece.shape, orientIndex));

    if (!orientationByKey.has(key)) {
      orientationByKey.set(key, orientIndex);
    }
  }

  return orientationByKey;
}

function getOrientIndexFromPlacement(piece: Piece, placement: UiPlacedPiece): number | null {
  const relativeCells = placement.cells.map(
    ([row, column]) => [row - placement.anchor[0], column - placement.anchor[1]] as Cell,
  );
  const key = cellsKey(relativeCells);
  return getOrientationIndexByKey(piece).get(key) ?? null;
}

export function buildSolveInputFromUi(
  board: Board,
  placedByPieceId: Record<string, UiPlacedPiece>,
): SolveInputFromUi | SolveInputError {
  const rows = board.length;
  const columns = board[0]?.length ?? 0;
  const occupied = Array.from({ length: rows }, () => Array.from({ length: columns }, () => false));

  const prePlacedPieces: PrePlacedPiece[] = [];

  for (const placedPiece of Object.values(placedByPieceId)) {
    const piece = PIECE_DEFS.find((item) => item.id === placedPiece.pieceId);
    if (!piece) {
      return { error: 'Current placement is invalid.' };
    }

    const orientIndex = getOrientIndexFromPlacement(piece, placedPiece);

    if (orientIndex === null) {
      return { error: 'Current placement is invalid.' };
    }

    const orientedShape = orientShape(piece.shape, orientIndex);
    const validatedCells = canPlace(board, occupied, orientedShape, placedPiece.anchor);

    if (!validatedCells) {
      return { error: 'Current placement is invalid.' };
    }

    for (const [row, column] of validatedCells) {
      occupied[row][column] = true;
    }

    prePlacedPieces.push({
      piece,
      anchor: placedPiece.anchor,
      rotation: orientIndex,
    });
  }

  const fixedPieceIds = new Set(prePlacedPieces.map((item) => item.piece.id));
  const remainingPieces = PIECE_DEFS.filter((piece) => !fixedPieceIds.has(piece.id));

  return {
    prePlacedPieces,
    remainingPieces,
  };
}

export function getOrientIndexForSolvedPlacement(piece: Piece, anchor: Cell, cells: Cell[]): number {
  const relativeCells = cells.map(([row, column]) => [row - anchor[0], column - anchor[1]] as Cell);
  const key = cellsKey(relativeCells);
  return getOrientationIndexByKey(piece).get(key) ?? 0;
}
