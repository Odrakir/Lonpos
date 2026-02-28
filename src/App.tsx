import { useState } from 'react';
import { createBoardFromAscii } from './data/board';
import BoardGrid from './ui/BoardGrid';
import PieceBuilder from './ui/PieceBuilder';

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

  return (
    <main className="app">
      <h1>Lonpos Solver</h1>
      <p className="subtitle">Board loaded from ASCII input.</p>
      <BoardGrid board={board} />

      {import.meta.env.DEV ? (
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

      {import.meta.env.DEV && isBuilderMode ? <PieceBuilder /> : null}
    </main>
  );
}

export default App;
