import type { Board } from '../data/board';
import { PIECE_DEFS } from '../data/pieces';
import type { Cell } from '../game/placement';

interface PlacedPieceView {
  pieceId: string;
  cells: Cell[];
  anchor: Cell;
}

interface GhostPreview {
  cells: Cell[];
  isValid: boolean;
}

interface BoardGridProps {
  board: Board;
  placedPieces: Record<string, PlacedPieceView>;
  ghostPreview: GhostPreview | null;
  boardRef: (node: HTMLDivElement | null) => void;
  onPointerDownPlacedCell: (
    pieceId: string,
    offset: Cell,
    pointerId: number,
    pointerType: string,
    clientX: number,
    clientY: number,
  ) => void;
}

function BoardGrid({
  board,
  placedPieces,
  ghostPreview,
  boardRef,
  onPointerDownPlacedCell,
}: BoardGridProps) {
  const rows = board.length;
  const columns = board[0]?.length ?? 0;
  const pieceByCell = new Map<string, { pieceId: string; offset: Cell; color: string }>();

  for (const piece of Object.values(placedPieces)) {
    const color = PIECE_DEFS.find((item) => item.id === piece.pieceId)?.color ?? '#0ea5e9';

    for (const [row, column] of piece.cells) {
      const offset: Cell = [row - piece.anchor[0], column - piece.anchor[1]];
      pieceByCell.set(`${row},${column}`, { pieceId: piece.pieceId, offset, color });
    }
  }

  const ghostByCell = new Map<string, { isValid: boolean }>();
  if (ghostPreview) {
    for (const [row, column] of ghostPreview.cells) {
      ghostByCell.set(`${row},${column}`, { isValid: ghostPreview.isValid });
    }
  }

  return (
    <section aria-label="Puzzle board" className="board-wrapper">
      <div
        className="board-grid"
        ref={boardRef}
        role="grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {board.flatMap((row, rowIndex) =>
          row.map((cell, columnIndex) => {
            const cellKey = `${rowIndex},${columnIndex}`;
            const placed = pieceByCell.get(cellKey);
            const ghost = ghostByCell.get(cellKey);

            return (
              <button
                aria-label={`Row ${rowIndex + 1}, Column ${columnIndex + 1}`}
                className={`board-cell ${cell ? 'board-cell-filled' : ''} ${ghost ? (ghost.isValid ? 'board-cell-ghost-valid' : 'board-cell-ghost-invalid') : ''}`}
                disabled={!placed}
                key={`${rowIndex}-${columnIndex}`}
                onPointerDown={(event) => {
                  if (!placed) {
                    return;
                  }

                  onPointerDownPlacedCell(placed.pieceId, placed.offset, event.pointerId, event.pointerType, event.clientX, event.clientY);
                }}
                role="gridcell"
                style={placed ? { backgroundColor: placed.color } : undefined}
                type="button"
              />
            );
          }),
        )}
      </div>
      <p className="board-dimensions">{columns} × {rows} board</p>
    </section>
  );
}

export default BoardGrid;
