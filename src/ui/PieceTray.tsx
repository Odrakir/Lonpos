import { useMemo, useState } from 'react';
import { PIECE_DEFS } from '../data/pieces';

type Cell = [row: number, column: number];

function normalizeShape(shape: Cell[]): Cell[] {
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

function orientShape(shape: Cell[], orientIndex: number): Cell[] {
  let current = normalizeShape(shape);

  for (let index = 0; index < orientIndex; index += 1) {
    current = normalizeShape(current.map((cell) => rotate90Clockwise(cell)));
  }

  return current;
}

function PieceTray() {
  const [orientByPieceId, setOrientByPieceId] = useState<Record<string, number>>(() =>
    Object.fromEntries(PIECE_DEFS.map((piece) => [piece.id, 0])),
  );

  const orientedShapes = useMemo(
    () =>
      Object.fromEntries(
        PIECE_DEFS.map((piece) => [
          piece.id,
          orientShape(piece.shape, orientByPieceId[piece.id] ?? 0),
        ]),
      ),
    [orientByPieceId],
  );

  return (
    <section aria-label="Piece tray" className="piece-tray">
      {PIECE_DEFS.map((piece) => {
        const shape = orientedShapes[piece.id] ?? [];
        const rows = Math.max(...shape.map(([row]) => row), 0) + 1;
        const columns = Math.max(...shape.map(([, column]) => column), 0) + 1;

        return (
          <article className="piece-preview" key={piece.id}>
            <header className="piece-preview-header">
              <span>{piece.name}</span>
              <button
                aria-label={`Rotate ${piece.name}`}
                onClick={() =>
                  setOrientByPieceId((current) => ({
                    ...current,
                    [piece.id]: ((current[piece.id] ?? 0) + 1) % 4,
                  }))
                }
                type="button"
              >
                ↻ 90°
              </button>
            </header>

            <div
              className="piece-preview-grid"
              style={{
                gridTemplateColumns: `repeat(${columns}, 0.55rem)`,
                gridTemplateRows: `repeat(${rows}, 0.55rem)`,
              }}
            >
              {shape.map(([row, column]) => (
                <div
                  className="piece-preview-cell"
                  key={`${piece.id}-${row}-${column}`}
                  style={{
                    backgroundColor: piece.color,
                    gridColumnStart: column + 1,
                    gridRowStart: row + 1,
                  }}
                />
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default PieceTray;
