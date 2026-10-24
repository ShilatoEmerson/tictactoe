// In-memory session store + scoreboard. Orchestrates rules from gameLogic.
import { randomUUID } from 'node:crypto';
import {
  GameError, MODES, STATUS, createGame, makeMove, undo as undoMove,
  resetGame as resetLogic, canUndo, chooseComputerMove,
} from './gameLogic.js';

export function createGameService() {
  const games = new Map();
  const scoreboard = { xWins: 0, oWins: 0, draws: 0 };

  const recordResult = (game) => {
    if (game.status === STATUS.IN_PROGRESS || game.resultRecorded) return;
    if (game.status === STATUS.DRAW) scoreboard.draws += 1;
    else if (game.winner === 'X') scoreboard.xWins += 1;
    else scoreboard.oWins += 1;
    game.resultRecorded = true;
  };

  const find = (id) => {
    const game = games.get(id);
    if (!game) throw new GameError('GAME_NOT_FOUND', 'Game not found', 404);
    return game;
  };

  const toDto = (game) => ({
    id: game.id,
    board: game.board,
    currentPlayer: game.currentPlayer,
    mode: game.mode,
    status: game.status,
    winner: game.winner,
    winningCells: game.winningCells,
    moves: game.moves,
    canUndo: canUndo(game),
    scoreboard: { ...scoreboard },
  });

  return {
    create(mode) {
      const game = createGame(randomUUID(), mode);
      games.set(game.id, game);
      return toDto(game);
    },
    get: (id) => toDto(find(id)),
    move(id, { player, index, row, col }) {
      const game = find(id);
      // Accept either a 0-8 cell index or 0-based row/col.
      let cell = index;
      if (cell === undefined && Number.isInteger(row) && Number.isInteger(col)) {
        if (row < 0 || row > 2 || col < 0 || col > 2) throw new GameError('OUT_OF_BOUNDS', 'Cell must be within the 3x3 board');
        cell = row * 3 + col;
      }
      if (game.mode === MODES.COMPUTER && player === 'O') {
        throw new GameError('WRONG_PLAYER', 'O is controlled by the computer', 409);
      }
      makeMove(game, player, cell);
      if (game.mode === MODES.COMPUTER && game.status === STATUS.IN_PROGRESS) {
        makeMove(game, 'O', chooseComputerMove(game.board, 'O'));
      }
      recordResult(game);
      return toDto(game);
    },
    undo(id) {
      const game = find(id);
      undoMove(game);
      return toDto(game);
    },
    reset(id) {
      const game = find(id);
      resetLogic(game);
      return toDto(game);
    },
    getScoreboard: () => ({ ...scoreboard }),
    resetScoreboard() {
      scoreboard.xWins = scoreboard.oWins = scoreboard.draws = 0;
      return { ...scoreboard };
    },
  };
}
