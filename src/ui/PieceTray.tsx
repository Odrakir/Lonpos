import { PIECE_DEFS } from '../data/pieces';
import type { Cell } from '../game/placement';

interface PieceTrayProps {
  placedPieceIds: Set<string>;
  orientedShapes: Record<string, Cell[]>;
  onStartDragFromTray: (
    pieceId: string,
    dragOffset: Cell,
    pointerId: number,
    pointerType: string,
    clientX: number,
    clientY: number,
  ) => void;
}

function PieceTray({
  placedPieceIds,
  orientedShapes,
  onStartDragFromTray,
}: PieceTrayProps) {
  return (
    <section aria-label="Piece tray" className="piece-tray">
      {PIECE_DEFS.map((piece) => {
        const shape = orientedShapes[piece.id] ?? [];
        const rows = Math.max(...shape.map(([row]) => row), 0) + 1;
        const columns = Math.max(...shape.map(([, column]) => column), 0) + 1;
        const isPlaced = placedPieceIds.has(piece.id);

        return (
          <article className={`piece-preview ${isPlaced ? 'piece-preview-placed' : ''}`} key={piece.id}>
            <header className="piece-preview-header">
              <span>{piece.name}</span>
            </header>

            <div
              className={`piece-preview-grid ${isPlaced ? 'piece-preview-grid-disabled' : ''}`}
              style={{
                gridTemplateColumns: `repeat(${columns}, 0.55rem)`,
                gridTemplateRows: `repeat(${rows}, 0.55rem)`,
              }}
            >
              {shape.map(([row, column]) => (
                <button
                  className="piece-preview-cell"
                  disabled={isPlaced}
                  key={`${piece.id}-${row}-${column}`}
                  onPointerDown={(event) => {
                    if (isPlaced) {
                      return;
                    }

                    onStartDragFromTray(piece.id, [row, column], event.pointerId, event.pointerType, event.clientX, event.clientY);
                  }}
                  style={{
                    backgroundColor: piece.color,
                    gridColumnStart: column + 1,
                    gridRowStart: row + 1,
                  }}
                  type="button"
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
