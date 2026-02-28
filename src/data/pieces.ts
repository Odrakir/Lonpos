export interface Piece {
  id: string;
  name: string;
  shape: Array<[row: number, column: number]>;
}

export const pieces: Piece[] = [];
