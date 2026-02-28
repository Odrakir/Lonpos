import { cellsFromAscii } from '../solver/ascii';

export interface Piece {
  id: string;
  name: string;
  shape: Array<[row: number, column: number]>;
}

export const pieces: Piece[] = [
  {
    id: 'placeholder-l',
    name: 'Placeholder L',
    shape: cellsFromAscii([
      '#.',
      '#.',
      '##',
    ]),
  },
];
