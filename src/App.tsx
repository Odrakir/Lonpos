import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createBoardFromAscii } from './data/board';
import { PIECE_DEFS } from './data/pieces';
import { canPlace, flipShape, getOrientKey, getShapeOrientations, orientShape, rotateShape90, type Cell } from './game/placement';
import { solveBoard } from './solver';
import { buildSolveInputFromUi, getOrientIndexForSolvedPlacement } from './solver/uiState';
import BoardGrid from './ui/BoardGrid';
import PieceBuilder from './ui/PieceBuilder';
import PieceTray from './ui/PieceTray';

const BOARD_ASCII = `
..#.....#..#.....#..
.####.########.####.
..################..
.##################.
.##################.
####################
.##################.
.##################.
..################..
.##################.
.##################.
####################
.#.#####.##.#####.#.
.....#........#.....
`;

interface PlacedPieceState {
  pieceId: string;
  anchor: Cell;
  cells: Cell[];
}

interface DragState {
  pieceId: string;
  offset: Cell;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  source: 'tray' | 'board';
  isDragging: boolean;
}

const DRAG_THRESHOLD_PX = 8;

function App() {
  const board = useMemo(() => createBoardFromAscii(BOARD_ASCII), []);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [orientByPieceId, setOrientByPieceId] = useState<Record<string, number>>(() =>
    Object.fromEntries(PIECE_DEFS.map((piece) => [piece.id, 0])),
  );
  const [placedByPieceId, setPlacedByPieceId] = useState<Record<string, PlacedPieceState>>({});
  const [isSolving, setIsSolving] = useState(false);
  const [solveMessage, setSolveMessage] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragPointerPosition, setDragPointerPosition] = useState<{ clientX: number; clientY: number } | null>(null);
  const [ghostPreview, setGhostPreview] = useState<{ cells: Cell[]; isValid: boolean } | null>(null);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const boardElementRef = useRef<HTMLDivElement | null>(null);

  const isBuilderGateEnabled = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('builder') === '1';
  }, []);

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

  const occupied = useMemo(() => {
    const rows = board.length;
    const columns = board[0]?.length ?? 0;
    const next = Array.from({ length: rows }, () => Array.from({ length: columns }, () => false));

    for (const placed of Object.values(placedByPieceId)) {
      for (const [row, column] of placed.cells) {
        if (row >= 0 && row < rows && column >= 0 && column < columns) {
          next[row][column] = true;
        }
      }
    }

    return next;
  }, [board, placedByPieceId]);

  const resolveAnchor = useCallback((clientX: number, clientY: number, offset: Cell): Cell | null => {
    const boardElement = boardElementRef.current;
    if (!boardElement) {
      return null;
    }

    const rect = boardElement.getBoundingClientRect();
    if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) {
      return null;
    }

    const columns = board[0]?.length ?? 0;
    const rows = board.length;
    const column = Math.floor(((clientX - rect.left) / rect.width) * columns);
    const row = Math.floor(((clientY - rect.top) / rect.height) * rows);

    return [row - offset[0], column - offset[1]];
  }, [board]);

  const startDrag = useCallback((
    pieceId: string,
    offset: Cell,
    pointerId: number,
    pointerType: string,
    source: 'tray' | 'board',
    startClientX: number,
    startClientY: number,
  ) => {
    if (source === 'tray' && pointerType === 'touch') {
      boardElementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setDragState({
      pieceId,
      offset,
      pointerId,
      source,
      startClientX,
      startClientY,
      isDragging: false,
    });
    setDragPointerPosition({ clientX: startClientX, clientY: startClientY });
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    setDragState((currentDrag) => {
      if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
        return currentDrag;
      }

      setDragPointerPosition({ clientX: event.clientX, clientY: event.clientY });

      const deltaX = event.clientX - currentDrag.startClientX;
      const deltaY = event.clientY - currentDrag.startClientY;
      const moveDistance = Math.hypot(deltaX, deltaY);
      const hasReachedDragThreshold = moveDistance >= DRAG_THRESHOLD_PX;

      if (!currentDrag.isDragging && !hasReachedDragThreshold) {
        return currentDrag;
      }

      if (!currentDrag.isDragging) {
        if (currentDrag.source === 'board') {
          setPlacedByPieceId((current) => {
            const next = { ...current };
            delete next[currentDrag.pieceId];
            return next;
          });
        }
        document.body.classList.add('dragging');
      }

      event.preventDefault();

      const anchor = resolveAnchor(event.clientX, event.clientY, currentDrag.offset);
      const shape = orientedShapes[currentDrag.pieceId] ?? [];

      if (!anchor) {
        setGhostPreview(null);
        return {
          ...currentDrag,
          isDragging: true,
        };
      }

      const placement = canPlace(board, occupied, shape, anchor);
      const cells = placement ?? shape.map(([row, column]) => [anchor[0] + row, anchor[1] + column] as Cell);
      setGhostPreview({ cells, isValid: placement !== null });

      return {
        ...currentDrag,
        isDragging: true,
      };
    });
  }, [board, occupied, orientedShapes, resolveAnchor]);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    setDragState((currentDrag) => {
      if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
        return currentDrag;
      }

      if (!currentDrag.isDragging) {
        setGhostPreview(null);
        setDragPointerPosition(null);
        return null;
      }

      const shape = orientedShapes[currentDrag.pieceId] ?? [];
      const anchor = resolveAnchor(event.clientX, event.clientY, currentDrag.offset);
      const placement = anchor ? canPlace(board, occupied, shape, anchor) : null;

      if (placement && anchor) {
        setPlacedByPieceId((current) => ({
          ...current,
          [currentDrag.pieceId]: {
            pieceId: currentDrag.pieceId,
            anchor,
            cells: placement,
          },
        }));
      }

      setGhostPreview(null);
      setDragPointerPosition(null);
      return null;
    });
  }, [board, occupied, orientedShapes, resolveAnchor]);

  useEffect(() => {
    if (dragState?.isDragging) {
      document.body.classList.add('dragging');
      return;
    }

    document.body.classList.remove('dragging');
    return () => {
      document.body.classList.remove('dragging');
    };
  }, [dragState?.isDragging]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, handlePointerMove, handlePointerUp]);

  const handleSolve = useCallback(async () => {
    setSolveMessage(null);
    setIsSolving(true);

    await Promise.resolve();

    const solveInput = buildSolveInputFromUi(board, placedByPieceId);

    if ('error' in solveInput) {
      setSolveMessage(solveInput.error);
      setIsSolving(false);
      return;
    }

    const result = solveBoard(board, solveInput.remainingPieces, {
      prePlacedPieces: solveInput.prePlacedPieces,
    });

    if (!result.solved) {
      setSolveMessage('No solution from the current state.');
      setIsSolving(false);
      return;
    }

    const nextPlacedByPieceId: Record<string, PlacedPieceState> = {};
    const nextOrientByPieceId: Record<string, number> = {};

    for (const solvedPiece of result.placedPieces) {
      const piece = PIECE_DEFS.find((item) => item.id === solvedPiece.pieceId);
      if (!piece) {
        continue;
      }

      const anchor: Cell = [solvedPiece.anchor[0], solvedPiece.anchor[1]];
      const cells = solvedPiece.cells.map(([row, column]) => [row, column] as Cell);
      const orientIndex = getOrientIndexForSolvedPlacement(piece, anchor, cells);

      nextPlacedByPieceId[solvedPiece.pieceId] = {
        pieceId: solvedPiece.pieceId,
        anchor,
        cells,
      };
      nextOrientByPieceId[solvedPiece.pieceId] = orientIndex;
    }

    setPlacedByPieceId(nextPlacedByPieceId);
    setOrientByPieceId((current) => ({ ...current, ...nextOrientByPieceId }));
    setSolveMessage(null);
    setIsSolving(false);
  }, [board, placedByPieceId]);

  const handleClearBoard = useCallback(() => {
    setPlacedByPieceId({});
    setGhostPreview(null);
    setDragState(null);
    setDragPointerPosition(null);
    setSolveMessage(null);
  }, []);

  const dragPreview = useMemo(() => {
    if (!dragState?.isDragging || !dragPointerPosition) {
      return null;
    }

    const piece = PIECE_DEFS.find((item) => item.id === dragState.pieceId);
    const shape = orientedShapes[dragState.pieceId] ?? [];

    if (!piece || shape.length === 0) {
      return null;
    }

    const rows = Math.max(...shape.map(([row]) => row), 0) + 1;
    const columns = Math.max(...shape.map(([, column]) => column), 0) + 1;
    const previewCellSize = 14;
    const previewGap = 2;
    const previewUnit = previewCellSize + previewGap;

    return {
      pieceId: dragState.pieceId,
      color: piece.color,
      shape,
      rows,
      columns,
      style: {
        left: dragPointerPosition.clientX - dragState.offset[1] * previewUnit,
        top: dragPointerPosition.clientY - dragState.offset[0] * previewUnit,
      },
      previewCellSize,
    };
  }, [dragPointerPosition, dragState, orientedShapes]);



  const setPieceOrientationByKey = useCallback((pieceId: string, orientKey: string) => {
    const piece = PIECE_DEFS.find((item) => item.id === pieceId);
    if (!piece) {
      return;
    }

    const orientations = getShapeOrientations(piece.shape);
    const orientIndex = orientations.findIndex((orientation) => orientation.orientKey === orientKey);

    if (orientIndex < 0) {
      return;
    }

    setOrientByPieceId((current) => ({
      ...current,
      [pieceId]: orientIndex,
    }));
  }, []);

  const handleRotatePiece = useCallback((pieceId: string) => {
    const piece = PIECE_DEFS.find((item) => item.id === pieceId);
    if (!piece) {
      return;
    }

    const currentShape = orientedShapes[pieceId] ?? orientShape(piece.shape, 0);
    const rotatedShape = rotateShape90(currentShape);
    const orientKey = getOrientKey(rotatedShape);
    setPieceOrientationByKey(pieceId, orientKey);
  }, [orientedShapes, setPieceOrientationByKey]);

  const handleFlipPiece = useCallback((pieceId: string) => {
    const piece = PIECE_DEFS.find((item) => item.id === pieceId);
    if (!piece) {
      return;
    }

    const currentShape = orientedShapes[pieceId] ?? orientShape(piece.shape, 0);
    const flippedShape = flipShape(currentShape);
    const orientKey = getOrientKey(flippedShape);
    setPieceOrientationByKey(pieceId, orientKey);
  }, [orientedShapes, setPieceOrientationByKey]);

  const transformDragOffset = useCallback((pieceId: string, transformCell: (cell: Cell) => Cell) => {
    const shape = orientedShapes[pieceId] ?? [];
    if (shape.length === 0) {
      return;
    }

    setDragState((current) => {
      if (!current || current.pieceId !== pieceId) {
        return current;
      }

      const transformedShape = shape.map((cell) => transformCell(cell));
      const transformedOffset = transformCell(current.offset);
      const minRow = Math.min(...transformedShape.map(([row]) => row));
      const minColumn = Math.min(...transformedShape.map(([, column]) => column));

      return {
        ...current,
        offset: [transformedOffset[0] - minRow, transformedOffset[1] - minColumn],
      };
    });
  }, [orientedShapes]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const syncMediaQuery = () => {
      setIsCoarsePointer(mediaQuery.matches);
    };

    syncMediaQuery();
    mediaQuery.addEventListener('change', syncMediaQuery);
    return () => {
      mediaQuery.removeEventListener('change', syncMediaQuery);
    };
  }, []);

  useEffect(() => {
    if (!dragState?.isDragging) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'r') {
        handleRotatePiece(dragState.pieceId);
        transformDragOffset(dragState.pieceId, ([row, column]) => [column, -row]);
      } else if (key === 'f') {
        handleFlipPiece(dragState.pieceId);
        transformDragOffset(dragState.pieceId, ([row, column]) => [row, -column]);
      } else {
        return;
      }

      event.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dragState, handleFlipPiece, handleRotatePiece, transformDragOffset]);

  const isShowingDragControls = dragState?.isDragging && isCoarsePointer;

  return (
    <main className="app">
      <h1>Lonpos Cosmic Creature Solver</h1>
      <section className="app-controls">
        <button className="solve-button" disabled={isSolving} onClick={() => void handleSolve()} type="button">
          {isSolving ? 'Solving…' : 'Solve'}
        </button>
        <button className="clear-button" onClick={handleClearBoard} type="button">
          Clear board
        </button>
      </section>
      {solveMessage ? <p className="solve-message" role="status">{solveMessage}</p> : null}
      <section className="board-layout">
        <BoardGrid
          board={board}
          boardRef={(node) => {
            boardElementRef.current = node;
          }}
          ghostPreview={ghostPreview}
          onPointerDownPlacedCell={(pieceId, offset, pointerId, pointerType, clientX, clientY) => {
            startDrag(pieceId, offset, pointerId, pointerType, 'board', clientX, clientY);
          }}
          placedPieces={placedByPieceId}
        />
        <PieceTray
          onStartDragFromTray={(pieceId, offset, pointerId, pointerType, clientX, clientY) => {
            startDrag(pieceId, offset, pointerId, pointerType, 'tray', clientX, clientY);
          }}
          orientedShapes={orientedShapes}
          placedPieceIds={new Set(Object.keys(placedByPieceId))}
        />
      </section>

      {isShowingDragControls ? (
        <div className="drag-mobile-controls" role="group" aria-label="Dragged piece controls">
          <button onClick={() => {
            handleRotatePiece(dragState.pieceId);
            transformDragOffset(dragState.pieceId, ([row, column]) => [column, -row]);
          }} type="button">
            Rotate (R)
          </button>
          <button onClick={() => {
            handleFlipPiece(dragState.pieceId);
            transformDragOffset(dragState.pieceId, ([row, column]) => [row, -column]);
          }} type="button">
            Flip (F)
          </button>
        </div>
      ) : null}

      {isBuilderGateEnabled ? (
        <section className="builder-toggle">
          <label>
            <input
              type="checkbox"
              checked={isBuilderMode}
              onChange={(event) => setIsBuilderMode(event.target.checked)}
            />
            Builder Mode
          </label>
        </section>
      ) : null}

      {isBuilderGateEnabled && isBuilderMode ? <PieceBuilder /> : null}

      {dragPreview ? (
        <div
          aria-hidden="true"
          className="drag-piece-preview"
          style={{
            left: `${dragPreview.style.left}px`,
            top: `${dragPreview.style.top}px`,
            gridTemplateColumns: `repeat(${dragPreview.columns}, ${dragPreview.previewCellSize}px)`,
            gridTemplateRows: `repeat(${dragPreview.rows}, ${dragPreview.previewCellSize}px)`,
          }}
        >
          {dragPreview.shape.map(([row, column]) => (
            <span
              className="drag-piece-preview-cell"
              key={`${dragPreview.pieceId}-drag-preview-${row}-${column}`}
              style={{
                backgroundColor: dragPreview.color,
                gridColumnStart: column + 1,
                gridRowStart: row + 1,
              }}
            />
          ))}
        </div>
      ) : null}
    </main>
  );
}

export default App;
