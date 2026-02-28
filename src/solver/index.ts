import type { Board } from '../data/board';
import type { Piece } from '../data/pieces';

export interface SolveResult {
  solved: boolean;
  board: Board;
  placedPieces: Piece[];
}

export function solveBoard(board: Board, availablePieces: Piece[]): SolveResult {
  void availablePieces;

  return {
    solved: false,
    board,
    placedPieces: [],
  };
}
