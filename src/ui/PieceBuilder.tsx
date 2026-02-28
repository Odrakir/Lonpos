import { useMemo, useState } from 'react';

interface CellCoord {
  x: number;
  y: number;
}

const DEFAULT_SIZE = 8;

function createGrid(rows: number, columns: number): boolean[][] {
  return Array.from({ length: rows }, () => Array.from({ length: columns }, () => false));
}

function resizeGrid(grid: boolean[][], nextRows: number, nextColumns: number): boolean[][] {
  return Array.from({ length: nextRows }, (_, rowIndex) =>
    Array.from({ length: nextColumns }, (_, columnIndex) => grid[rowIndex]?.[columnIndex] ?? false),
  );
}

function getBoundingBox(grid: boolean[][]) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  grid.forEach((row, y) => {
    row.forEach((isFilled, x) => {
      if (!isFilled) {
        return;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  });

  if (!Number.isFinite(minX)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function exportAscii(grid: boolean[][]): string[] {
  const bounds = getBoundingBox(grid);
  if (!bounds) {
    return [];
  }

  const lines: string[] = [];

  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    let line = '';
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      line += grid[y][x] ? '#' : '.';
    }
    lines.push(line);
  }

  return lines;
}

function exportCoords(grid: boolean[][]): CellCoord[] {
  const bounds = getBoundingBox(grid);
  if (!bounds) {
    return [];
  }

  const coords: CellCoord[] = [];

  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      if (grid[y][x]) {
        coords.push({ x: x - bounds.minX, y: y - bounds.minY });
      }
    }
  }

  return coords;
}

function PieceBuilder() {
  const [rows, setRows] = useState(DEFAULT_SIZE);
  const [columns, setColumns] = useState(DEFAULT_SIZE);
  const [pieceId, setPieceId] = useState('P1');
  const [pieceColor, setPieceColor] = useState('#0ea5e9');
  const [grid, setGrid] = useState<boolean[][]>(() => createGrid(DEFAULT_SIZE, DEFAULT_SIZE));
  const [exportText, setExportText] = useState('');

  const filledCount = useMemo(
    () => grid.reduce((total, row) => total + row.filter(Boolean).length, 0),
    [grid],
  );

  const onRowsChange = (value: number) => {
    const nextRows = Math.max(1, value);
    setRows(nextRows);
    setGrid((current) => resizeGrid(current, nextRows, columns));
  };

  const onColumnsChange = (value: number) => {
    const nextColumns = Math.max(1, value);
    setColumns(nextColumns);
    setGrid((current) => resizeGrid(current, rows, nextColumns));
  };

  const toggleCell = (rowIndex: number, columnIndex: number) => {
    setGrid((current) =>
      current.map((row, y) =>
        row.map((isFilled, x) => (y === rowIndex && x === columnIndex ? !isFilled : isFilled)),
      ),
    );
  };

  const onClear = () => {
    setGrid(createGrid(rows, columns));
    setExportText('');
  };

  const onExportAscii = () => {
    const ascii = exportAscii(grid);
    const payload = {
      id: pieceId,
      color: pieceColor,
      shape: ascii,
    };

    setExportText(JSON.stringify(payload, null, 2));
  };

  const onExportCoords = () => {
    const coords = exportCoords(grid);
    const payload = {
      id: pieceId,
      color: pieceColor,
      cells: coords,
    };

    setExportText(JSON.stringify(payload, null, 2));
  };

  return (
    <section className="piece-builder" aria-label="Piece builder">
      <h2>Piece Builder (Dev)</h2>
      <div className="piece-builder-fields">
        <label>
          Piece ID
          <input value={pieceId} onChange={(event) => setPieceId(event.target.value)} />
        </label>
        <label>
          Color
          <input value={pieceColor} onChange={(event) => setPieceColor(event.target.value)} />
        </label>
        <label>
          Rows
          <input
            type="number"
            min={1}
            value={rows}
            onChange={(event) => onRowsChange(event.target.valueAsNumber || 1)}
          />
        </label>
        <label>
          Columns
          <input
            type="number"
            min={1}
            value={columns}
            onChange={(event) => onColumnsChange(event.target.valueAsNumber || 1)}
          />
        </label>
      </div>

      <div
        className="piece-builder-grid"
        role="grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {grid.flatMap((row, rowIndex) =>
          row.map((isFilled, columnIndex) => (
            <button
              type="button"
              className={`piece-builder-cell ${isFilled ? 'piece-builder-cell-filled' : ''}`}
              key={`${rowIndex}-${columnIndex}`}
              aria-label={`Cell ${rowIndex + 1}, ${columnIndex + 1}`}
              onClick={() => toggleCell(rowIndex, columnIndex)}
            />
          )),
        )}
      </div>

      <p className="piece-builder-meta">Filled cells: {filledCount}</p>

      <div className="piece-builder-actions">
        <button type="button" onClick={onClear}>
          Clear
        </button>
        <button type="button" onClick={onExportAscii}>
          Export ASCII
        </button>
        <button type="button" onClick={onExportCoords}>
          Export Coords
        </button>
      </div>

      <textarea
        className="piece-builder-output"
        readOnly
        rows={10}
        value={exportText}
        placeholder="Export output will appear here"
      />
    </section>
  );
}

export default PieceBuilder;
