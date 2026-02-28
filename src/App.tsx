import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createBoardFromAscii } from './data/board';
import { PIECE_DEFS } from './data/pieces';
import { canPlace, flipShape, getOrientKey, getShapeOrientations, orientShape, type Cell } from './game/placement';
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
}

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
  const [ghostPreview, setGhostPreview] = useState<{ cells: Cell[]; isValid: boolean } | null>(null);
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

  const startDrag = useCallback((pieceId: string, offset: Cell, pointerId: number, source: 'tray' | 'board') => {
    setDragState({ pieceId, offset, pointerId });

    if (source === 'board') {
      setPlacedByPieceId((current) => {
        const next = { ...current };
        delete next[pieceId];
        return next;
      });
    }
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    setDragState((currentDrag) => {
      if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
        return currentDrag;
      }

      const anchor = resolveAnchor(event.clientX, event.clientY, currentDrag.offset);
      const shape = orientedShapes[currentDrag.pieceId] ?? [];

      if (!anchor) {
        setGhostPreview(null);
        return currentDrag;
      }

      const placement = canPlace(board, occupied, shape, anchor);
      const cells = placement ?? shape.map(([row, column]) => [anchor[0] + row, anchor[1] + column] as Cell);
      setGhostPreview({ cells, isValid: placement !== null });

      return currentDrag;
    });
  }, [board, occupied, orientedShapes, resolveAnchor]);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    setDragState((currentDrag) => {
      if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
        return currentDrag;
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
      return null;
    });
  }, [board, occupied, orientedShapes, resolveAnchor]);

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

    const orientations = getShapeOrientations(piece.shape);

    setOrientByPieceId((current) => ({
      ...current,
      [pieceId]: ((current[pieceId] ?? 0) + 1) % orientations.length,
    }));
  }, []);

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
  return (
    <main className="app">
      <h1>Lonpos Solver</h1>
      <p className="subtitle">Board loaded from ASCII input.</p>
      <section className="app-controls">
        <button className="solve-button" disabled={isSolving} onClick={() => void handleSolve()} type="button">
          {isSolving ? 'Solving…' : 'Solve'}
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
          onPointerDownPlacedCell={(pieceId, offset, pointerId) => {
            startDrag(pieceId, offset, pointerId, 'board');
          }}
          placedPieces={placedByPieceId}
        />
        <PieceTray
          onFlipPiece={handleFlipPiece}
          onRotatePiece={handleRotatePiece}
          onStartDragFromTray={(pieceId, offset, pointerId) => {
            startDrag(pieceId, offset, pointerId, 'tray');
          }}
          orientByPieceId={orientByPieceId}
          orientedShapes={orientedShapes}
          placedPieceIds={new Set(Object.keys(placedByPieceId))}
        />
      </section>

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
    </main>
  );
}

export default App;
