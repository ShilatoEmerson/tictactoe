import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, makeMove, undo, resetGame, chooseComputerMove, GameError, STATUS, MODES,
} from '../src/gameLogic.js';
import { createGameService } from '../src/gameService.js';

const play = (game, cells) => cells.forEach((c, i) => makeMove(game, i % 2 === 0 ? 'X' : 'O', c));
const code = (c) => (e) => e instanceof GameError && e.code === c;

describe('moves & turns', () => {
  test('valid move places mark and switches turn', () => {
    const g = createGame('1');
    makeMove(g, 'X', 0);
    assert.equal(g.board[0], 'X');
    assert.equal(g.currentPlayer, 'O');
    assert.deepEqual(g.moves[0], { moveNumber: 1, player: 'X', index: 0, row: 1, col: 1 });
  });
  test('invalid moves are rejected and do not change turn', () => {
    const g = createGame('1');
    makeMove(g, 'X', 0);
    assert.throws(() => makeMove(g, 'O', 0), code('CELL_OCCUPIED'));
    assert.throws(() => makeMove(g, 'O', 9), code('OUT_OF_BOUNDS'));
    assert.throws(() => makeMove(g, 'X', 1), code('WRONG_PLAYER'));
    assert.equal(g.currentPlayer, 'O');
    assert.equal(g.moves.length, 1);
  });
});

describe('win / draw', () => {
  test('row win', () => {
    const g = createGame('1'); play(g, [0, 3, 1, 4, 2]);
    assert.equal(g.status, STATUS.WON); assert.equal(g.winner, 'X'); assert.deepEqual(g.winningCells, [0, 1, 2]);
  });
  test('column win', () => {
    const g = createGame('1'); play(g, [0, 1, 3, 2, 6]);
    assert.deepEqual(g.winningCells, [0, 3, 6]);
  });
  test('diagonal win', () => {
    const g = createGame('1'); play(g, [0, 1, 4, 2, 8]);
    assert.deepEqual(g.winningCells, [0, 4, 8]);
  });
  test('draw', () => {
    const g = createGame('1'); play(g, [0, 1, 2, 4, 3, 5, 7, 6, 8]);
    assert.equal(g.status, STATUS.DRAW); assert.equal(g.winner, null);
  });
  test('move after completion is rejected', () => {
    const g = createGame('1'); play(g, [0, 3, 1, 4, 2]);
    assert.throws(() => makeMove(g, 'O', 8), code('GAME_OVER'));
  });
});

describe('reset & undo', () => {
  test('reset clears everything and returns to X', () => {
    const g = createGame('1'); play(g, [0, 3, 1, 4, 2]);
    resetGame(g);
    assert.deepEqual(g.board, Array(9).fill(null));
    assert.equal(g.moves.length, 0); assert.equal(g.status, STATUS.IN_PROGRESS); assert.equal(g.currentPlayer, 'X');
  });
  test('undo in two-player mode removes only the last move', () => {
    const g = createGame('1'); play(g, [0, 4]);
    undo(g);
    assert.equal(g.moves.length, 1); assert.equal(g.board[4], null); assert.equal(g.currentPlayer, 'O');
  });
  test('undo with no moves throws', () => {
    assert.throws(() => undo(createGame('1')), code('NOTHING_TO_UNDO'));
  });
  test('undo is disabled after completion (Option A)', () => {
    const g = createGame('1'); play(g, [0, 3, 1, 4, 2]);
    assert.throws(() => undo(g), code('NOTHING_TO_UNDO'));
  });
});

describe('computer move selection', () => {
  const b = (s) => s.split('').map((c) => (c === '.' ? null : c));
  test('wins when it can', () => assert.equal(chooseComputerMove(b('OO.XX....')), 2));
  test('blocks X', () => assert.equal(chooseComputerMove(b('XX.O.....')), 2));
  test('takes center', () => assert.equal(chooseComputerMove(b('X........')), 4));
  test('takes a corner when center is taken', () => assert.equal(chooseComputerMove(b('....X....')), 0));
  test('takes any cell as last resort', () => assert.equal(chooseComputerMove(b('X.O.O.O.X')), 1));
});

describe('service: computer mode & scoreboard', () => {
  test('computer replies automatically; undo removes both moves', () => {
    const s = createGameService();
    const { id } = s.create(MODES.COMPUTER);
    let g = s.move(id, { player: 'X', index: 0 });
    assert.equal(g.moves.length, 2); assert.equal(g.moves[1].player, 'O'); assert.equal(g.moves[1].index, 4);
    g = s.undo(id);
    assert.equal(g.moves.length, 0); assert.equal(g.currentPlayer, 'X');
  });
  test('human cannot play O in computer mode', () => {
    const s = createGameService(); const { id } = s.create(MODES.COMPUTER);
    assert.throws(() => s.move(id, { player: 'O', index: 0 }), code('WRONG_PLAYER'));
  });
  test('scoreboard updates once, survives reset, clears on scoreboard reset', () => {
    const s = createGameService(); const { id } = s.create(MODES.TWO_PLAYER);
    [[ 'X', 0 ], [ 'O', 3 ], [ 'X', 1 ], [ 'O', 4 ], [ 'X', 2 ]].forEach(([player, index]) => s.move(id, { player, index }));
    assert.throws(() => s.move(id, { player: 'O', index: 8 }), code('GAME_OVER'));
    assert.deepEqual(s.getScoreboard(), { xWins: 1, oWins: 0, draws: 0 });
    s.reset(id);
    assert.equal(s.getScoreboard().xWins, 1);
    assert.deepEqual(s.resetScoreboard(), { xWins: 0, oWins: 0, draws: 0 });
  });
  test('row/col request format is supported', () => {
    const s = createGameService(); const { id } = s.create();
    const g = s.move(id, { player: 'X', row: 1, col: 1 });
    assert.equal(g.board[4], 'X');
  });
});
