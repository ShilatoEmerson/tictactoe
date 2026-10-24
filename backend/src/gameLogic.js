// Pure game rules. No Express, no storage - easy to unit test.
export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];
export const MODES = { TWO_PLAYER: 'TwoPlayer', COMPUTER: 'Computer' };
export const STATUS = { IN_PROGRESS: 'InProgress', WON: 'Won', DRAW: 'Draw' };

export class GameError extends Error {
  constructor(code, message, httpStatus = 400) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export function createGame(id, mode = MODES.TWO_PLAYER) {
  if (!Object.values(MODES).includes(mode)) {
    throw new GameError('INVALID_MODE', `Mode must be one of: ${Object.values(MODES).join(', ')}`);
  }
  return {
    id, mode,
    board: Array(9).fill(null),
    currentPlayer: 'X',
    status: STATUS.IN_PROGRESS,
    winner: null,
    winningCells: [],
    moves: [],
    resultRecorded: false, // guards "scoreboard updates only once per game"
  };
}

export function evaluateBoard(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { status: STATUS.WON, winner: board[a], winningCells: line };
    }
  }
  if (board.every(Boolean)) return { status: STATUS.DRAW, winner: null, winningCells: [] };
  return { status: STATUS.IN_PROGRESS, winner: null, winningCells: [] };
}

// Board, turn and status are always derived from the move list -> history never drifts.
export function rebuildFromMoves(game) {
  const board = Array(9).fill(null);
  game.moves.forEach((m) => { board[m.index] = m.player; });
  game.board = board;
  Object.assign(game, evaluateBoard(board));
  game.currentPlayer = game.moves.length % 2 === 0 ? 'X' : 'O';
  return game;
}

export function makeMove(game, player, index) {
  if (player !== 'X' && player !== 'O') throw new GameError('INVALID_PLAYER', 'Player must be X or O');
  if (game.status !== STATUS.IN_PROGRESS) throw new GameError('GAME_OVER', 'Game is already completed', 409);
  if (!Number.isInteger(index) || index < 0 || index > 8) throw new GameError('OUT_OF_BOUNDS', 'Cell must be within the 3x3 board');
  if (player !== game.currentPlayer) throw new GameError('WRONG_PLAYER', `It is ${game.currentPlayer}'s turn`, 409);
  if (game.board[index] !== null) throw new GameError('CELL_OCCUPIED', 'Cell is already taken', 409);

  game.moves.push({
    moveNumber: game.moves.length + 1,
    player,
    index,
    row: Math.floor(index / 3) + 1,
    col: (index % 3) + 1,
  });
  return rebuildFromMoves(game);
}

// Option A: undo is disabled once the game is Won/Draw, so the scoreboard never needs rolling back.
export function canUndo(game) {
  return game.status === STATUS.IN_PROGRESS && game.moves.length > 0;
}

export function undo(game) {
  if (!canUndo(game)) throw new GameError('NOTHING_TO_UNDO', 'Nothing to undo', 409);
  const count = game.mode === MODES.COMPUTER ? Math.min(2, game.moves.length) : 1;
  game.moves.splice(game.moves.length - count, count);
  return rebuildFromMoves(game);
}

export function resetGame(game) {
  game.moves = [];
  game.resultRecorded = false;
  return rebuildFromMoves(game);
}

function findLineMove(board, player) {
  for (const line of WIN_LINES) {
    const marks = line.map((i) => board[i]);
    if (marks.filter((m) => m === player).length === 2 && marks.includes(null)) {
      return line[marks.indexOf(null)];
    }
  }
  return null;
}

// Priority: win -> block -> center -> corner -> any
export function chooseComputerMove(board, computer = 'O') {
  const human = computer === 'O' ? 'X' : 'O';
  const win = findLineMove(board, computer);
  if (win !== null) return win;
  const block = findLineMove(board, human);
  if (block !== null) return block;
  if (board[4] === null) return 4;
  const corner = [0, 2, 6, 8].find((i) => board[i] === null);
  if (corner !== undefined) return corner;
  const any = board.findIndex((c) => c === null);
  return any === -1 ? null : any;
}
