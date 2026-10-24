import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import App from "./App.jsx";

const emptyGame = (over = {}) => ({
  id: "g1",
  board: Array(9).fill(null),
  currentPlayer: "X",
  mode: "TwoPlayer",
  status: "InProgress",
  winner: null,
  winningCells: [],
  moves: [],
  canUndo: false,
  scoreboard: { xWins: 0, oWins: 0, draws: 0 },
  ...over,
});

const mockFetch = (...responses) => {
  const fn = vi.fn();
  responses.forEach((r) =>
    fn.mockResolvedValueOnce({ ok: true, json: async () => r }),
  );
  globalThis.fetch = fn;
  return fn;
};

describe("App", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates a game on load and renders 9 cells, turn, scoreboard", async () => {
    const f = mockFetch(emptyGame());
    render(<App />);
    expect(await screen.findByTestId("status")).toHaveTextContent("X's turn");
    expect(screen.getAllByRole("gridcell")).toHaveLength(9);
    expect(screen.getByTestId("draws")).toHaveTextContent("0");
    expect(f.mock.calls[0][0]).toBe("/api/games");
  });

  it("sends the move to the backend and renders the returned state", async () => {
    const f = mockFetch(
      emptyGame(),
      emptyGame({
        board: ["X", ...Array(8).fill(null)],
        currentPlayer: "O",
        canUndo: true,
        moves: [{ moveNumber: 1, player: "X", index: 0, row: 1, col: 1 }],
      }),
    );
    render(<App />);
    fireEvent.click((await screen.findAllByRole("gridcell"))[0]);
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("O's turn"),
    );
    expect(f.mock.calls[1][0]).toBe("/api/games/g1/moves");
    expect(screen.getByText("Row 1, Column 1")).toBeInTheDocument();
    expect(screen.getByText("Undo last move")).toBeEnabled();
  });

  it("highlights winning cells and locks the board", async () => {
    mockFetch(
      emptyGame({
        board: ["X", "X", "X", "O", "O", null, null, null, null],
        status: "Won",
        winner: "X",
        winningCells: [0, 1, 2],
        scoreboard: { xWins: 1, oWins: 0, draws: 0 },
      }),
    );
    render(<App />);
    expect(await screen.findByTestId("status")).toHaveTextContent("X wins");
    const cells = screen.getAllByRole("gridcell");
    expect(cells[0]).toHaveClass("win");
    expect(cells[5]).toBeDisabled();
  });

  it("disables Undo when there is nothing to undo", async () => {
    mockFetch(emptyGame());
    render(<App />);
    expect(await screen.findByText("Undo last move")).toBeDisabled();
  });
});
