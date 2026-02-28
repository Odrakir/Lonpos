import { PIECE_DEFS, type Piece } from '../data/pieces';
import { canPlace, getOrientKey, getShapeOrientations, type Cell } from '../game/placement';
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

function getOrientationByKey(piece: Piece): Map<string, number> {
  const orientationByKey = new Map<string, number>();
  const orientations = getShapeOrientations(piece.shape);

  for (let orientIndex = 0; orientIndex < orientations.length; orientIndex += 1) {
    orientationByKey.set(orientations[orientIndex].orientKey, orientIndex);
  }

  return orientationByKey;
}

function getOrientFromPlacement(piece: Piece, placement: UiPlacedPiece): { orientIndex: number; orientKey: string } | null {
  const relativeCells = placement.cells.map(
    ([row, column]) => [row - placement.anchor[0], column - placement.anchor[1]] as Cell,
  );
  const orientKey = getOrientKey(relativeCells);
  const orientIndex = getOrientationByKey(piece).get(orientKey);

  if (orientIndex === undefined) {
    return null;
  }

  return { orientIndex, orientKey };
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

    const orientation = getOrientFromPlacement(piece, placedPiece);

    if (!orientation) {
      return { error: 'Current placement is invalid.' };
    }

    const orientedShape = getShapeOrientations(piece.shape)[orientation.orientIndex]?.cells ?? [];
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
      orientIndex: orientation.orientIndex,
      orientKey: orientation.orientKey,
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
  const orientKey = getOrientKey(relativeCells);
  return getOrientationByKey(piece).get(orientKey) ?? 0;
}
