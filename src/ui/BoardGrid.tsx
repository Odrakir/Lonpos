import type { Board } from '../data/board';

interface BoardGridProps {
  board: Board;
}

function BoardGrid({ board }: BoardGridProps) {
  const rows = board.length;
  const columns = board[0]?.length ?? 0;

  return (
    <section aria-label="Puzzle board" className="board-wrapper">
      <div
        className="board-grid"
        role="grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {board.flatMap((row, rowIndex) =>
          row.map((cell, columnIndex) => (
            <div
              aria-label={`Row ${rowIndex + 1}, Column ${columnIndex + 1}`}
              className={`board-cell ${cell ? 'board-cell-filled' : ''}`}
              key={`${rowIndex}-${columnIndex}`}
              role="gridcell"
            />
          )),
        )}
      </div>
      <p className="board-dimensions">{columns} × {rows} board</p>
    </section>
  );
}

export default BoardGrid;
