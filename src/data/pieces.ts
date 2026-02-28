import { cellsFromAscii } from '../solver/ascii';

export interface Piece {
  id: string;
  name: string;
  color: string;
  shape: Array<[row: number, column: number]>;
}

export const pieces: Piece[] = [
  {
    id: 'P1',
    name: 'Piece 1',
    color: '#ffed29',
    shape: cellsFromAscii(['..#..', '.###.', '..###', '.###.', '.###.', '###..', '.###.', '..#..']),
  },
  {
    id: 'P2',
    name: 'Piece 2',
    color: '#ffa500',
    shape: cellsFromAscii(['.#.#.', '..#..', '.###.', '.###.', '#####', '.#.#.']),
  },
  {
    id: 'P3',
    name: 'Piece 3',
    color: '#000080',
    shape: cellsFromAscii(['..#..#..', '.######.', '########', '.#.##.#.']),
  },
  {
    id: 'P4',
    name: 'Piece 4',
    color: '#ff0000',
    shape: cellsFromAscii(['.#..#.', '######', '.####.', '#.##.#']),
  },
  {
    id: 'P5',
    name: 'Piece 5',
    color: '#b2ffff',
    shape: cellsFromAscii(['.#.#.', '..###', '.###.', '.###.', '###..', '.#.#.']),
  },
  {
    id: 'P6',
    name: 'Piece 6',
    color: '#88e788',
    shape: cellsFromAscii(['.#.#.', '..###', '.###.', '.###.', '#####', '.#.#.']),
  },
  {
    id: 'P7',
    name: 'Piece 7',
    color: '#6c3baa',
    shape: cellsFromAscii(['.#..', '###.', '.###', '###.', '###.', '.###', '#.#.']),
  },
  {
    id: 'P8',
    name: 'Piece 8',
    color: '#ffd1df',
    shape: cellsFromAscii(['.#..', '###.', '.###', '###.', '###.', '.#..', '###.', '.#..']),
  },
  {
    id: 'P9',
    name: 'Piece 9',
    color: '#06402b',
    shape: cellsFromAscii(['..#..', '.###.', '..#..', '.###.', '.###.', '#####', '.#.#.']),
  },
  {
    id: 'P10',
    name: 'Piece 10',
    color: '#aaaaaa',
    shape: cellsFromAscii(['..#..', '.###.', '#####', '.###.', '.###.', '..#..', '.###.', '..#..']),
  },
  {
    id: 'P11',
    name: 'Piece 11',
    color: '#c11c84',
    shape: cellsFromAscii(['..#..', '.###.', '#####', '.###.', '.###.', '..#..', '.#.#.']),
  },
  {
    id: 'P12',
    name: 'Piece 12',
    color: '#c4c4c4',
    shape: cellsFromAscii(['..#..', '.###.', '###..', '.###.', '.###.', '..###', '.#.#.']),
  },
];

export const PIECE_DEFS = pieces;
