import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";

const MODES = [
  { value: "TwoPlayer", label: "Two players" },
  { value: "Computer", label: "Vs computer" },
];

function statusText(game) {
  if (game.status === "Won") return `${game.winner} wins`;
  if (game.status === "Draw") return "It's a draw";
  return `${game.currentPlayer}'s turn`;
}

export default function App() {
  const [game, setGame] = useState(null);
  const [mode, setMode] = useState("TwoPlayer");
  const [error, setError] = useState("");

  // Run an API call, store the returned state, surface errors in the UI.
  const run = useCallback(async (fn) => {
    try {
      setError("");
      setGame(await fn());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    run(() => api.createGame("TwoPlayer"));
  }, [run]);

  const changeMode = (value) => {
    setMode(value);
    run(() => api.createGame(value)); // new session in the chosen mode; scoreboard is global
  };

  if (!game)
    return (
      <main className="page">
        <p>{error || "Loading…"}</p>
      </main>
    );

  const over = game.status !== "InProgress";
  const humanTurn = game.mode === "TwoPlayer" || game.currentPlayer === "X";

  return (
    <main className="page">
      <header>
        <h1>Tic Tac Toe</h1>
        <div className="modes" role="group" aria-label="Game mode">
          {MODES.map((m) => (
            <button
              key={m.value}
              className={mode === m.value ? "on" : ""}
              aria-pressed={mode === m.value}
              onClick={() => changeMode(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </header>

      <section className="play">
        <div>
          <p
            className={`status ${over ? "over" : game.currentPlayer.toLowerCase()}`}
            role="status"
            data-testid="status"
          >
            {statusText(game)}
          </p>
          <div className="board" role="grid" aria-label="Game board">
            {game.board.map((cell, i) => {
              const win = game.winningCells.includes(i);
              return (
                <button
                  key={i}
                  role="gridcell"
                  className={`cell ${cell ? cell.toLowerCase() : ""} ${win ? "win" : ""}`}
                  disabled={Boolean(cell) || over || !humanTurn}
                  aria-label={`Row ${Math.floor(i / 3) + 1}, Column ${(i % 3) + 1}${cell ? `, ${cell}` : ", empty"}`}
                  onClick={() =>
                    run(() => api.move(game.id, game.currentPlayer, i))
                  }
                >
                  {cell}
                </button>
              );
            })}
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="actions">
            <button
              onClick={() => run(() => api.undo(game.id))}
              disabled={!game.canUndo}
            >
              Undo last move
            </button>
            <button onClick={() => run(() => api.reset(game.id))}>
              Reset game
            </button>
          </div>
        </div>

        <aside>
          <section aria-label="Scoreboard">
            <h2>Scoreboard</h2>
            <dl className="score">
              <div>
                <dt>X wins</dt>
                <dd className="x" data-testid="x-wins">
                  {game.scoreboard.xWins}
                </dd>
              </div>
              <div>
                <dt>O wins</dt>
                <dd className="o" data-testid="o-wins">
                  {game.scoreboard.oWins}
                </dd>
              </div>
              <div>
                <dt>Draws</dt>
                <dd data-testid="draws">{game.scoreboard.draws}</dd>
              </div>
            </dl>
            <button
              className="link"
              onClick={() =>
                run(async () => {
                  await api.resetScoreboard();
                  return api.getGame(game.id);
                })
              }
            >
              Reset scoreboard
            </button>
          </section>

          <section aria-label="Move history">
            <h2>Move history</h2>
            {game.moves.length === 0 ? (
              <p className="muted">No moves yet. Pick a cell to start.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Move</th>
                    <th>Player</th>
                    <th>Position</th>
                  </tr>
                </thead>
                <tbody>
                  {game.moves.map((m) => (
                    <tr key={m.moveNumber}>
                      <td>{m.moveNumber}</td>
                      <td>{m.player}</td>
                      <td>
                        Row {m.row}, Column {m.col}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}
