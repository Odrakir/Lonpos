import { createBoardFromAscii } from './data/board';
import BoardGrid from './ui/BoardGrid';

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

  return (
    <main className="app">
      <h1>Lonpos Solver</h1>
      <p className="subtitle">Board loaded from ASCII input.</p>
      <BoardGrid board={board} />
    </main>
  );
}

export default App;
