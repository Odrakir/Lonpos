import { createEmptyBoard } from './data/board';
import BoardGrid from './ui/BoardGrid';

function App() {
  const board = createEmptyBoard();

  return (
    <main className="app">
      <h1>Lonpos Solver</h1>
      <p className="subtitle">Architecture scaffold for board, solver, and UI modules.</p>
      <BoardGrid board={board} />
    </main>
  );
}

export default App;
