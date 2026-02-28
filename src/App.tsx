import { useMemo, useState } from 'react';
import { createBoardFromAscii } from './data/board';
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
.....#......#.....
`;

function App() {
  const board = createBoardFromAscii(BOARD_ASCII);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const isBuilderGateEnabled = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('builder') === '1';
  }, []);

  return (
    <main className="app">
      <h1>Lonpos Solver</h1>
      <p className="subtitle">Board loaded from ASCII input.</p>
      <section className="board-layout">
        <BoardGrid board={board} />
        <PieceTray />
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
