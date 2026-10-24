# Tic Tac Toe — React + Node.js/Express

## 1. Project overview
Browser-based Tic Tac Toe. A React frontend talks to an Express backend over REST. The backend owns all game state (board, turn, status, move history, scoreboard); the frontend only renders what the API returns.

## 2. Tech stack
- Frontend: React 18 + Vite, Vitest + React Testing Library
- Backend: Node.js (18+) + Express 4, built-in `node:test` runner
- API style: REST/JSON. Storage: in-memory. Source control: Git/GitHub

## 3. Features
Two Player and Vs Computer modes, turn display, win/draw detection with highlighted cells, move history, mode-aware Undo, session scoreboard (updated once per game), Reset Game, Reset Scoreboard, server-side move validation.

## 4. Run the backend
```bash
cd backend && npm install && npm start    # http://localhost:4000
```
## 5. Run the frontend
```bash
cd frontend && npm install && npm run dev  # http://localhost:5173 (proxies /api to :4000)
```
Set `VITE_API_URL` to call a different backend origin.

## 6. API summary
| Method | Endpoint | Body | Purpose |
|---|---|---|---|
| POST | /api/games | `{ "mode": "TwoPlayer" \| "Computer" }` | Create game (201) |
| GET | /api/games/:id | – | Current state |
| POST | /api/games/:id/moves | `{ "player": "X", "index": 0 }` (or 0-based `row`,`col`) | Submit move |
| POST | /api/games/:id/undo | – | Undo (1 move, or 2 in Computer mode) |
| POST | /api/games/:id/reset | – | Reset game, keep scoreboard |
| GET | /api/scoreboard | – | `{ xWins, oWins, draws }` |
| POST | /api/scoreboard/reset | – | Zero the scoreboard |

Game state: `id, board[9], currentPlayer, mode, status (InProgress|Won|Draw), winner, winningCells, moves[{moveNumber, player, index, row, col}], canUndo, scoreboard`.

Errors: `{ "error": { "code", "message" } }` — `OUT_OF_BOUNDS` (400), `INVALID_PLAYER` (400), `CELL_OCCUPIED` / `WRONG_PLAYER` / `GAME_OVER` / `NOTHING_TO_UNDO` (409), `GAME_NOT_FOUND` (404).

## 7. Tests
```bash
cd backend && npm test     # rules, undo, computer AI, scoreboard, REST API
cd frontend && npm test    # rendering, API integration, win highlight, undo state
```

## 8. AI tools and prompt summary
_Fill in before submission:_ tool used, the spec prompt (requirements -> API contract + rules), what was generated, what you changed by hand, which parts you reviewed closely (win/undo/scoreboard logic).

## 9. Design decisions
- Rules live in pure functions (`gameLogic.js`), separate from Express and storage -> unit-testable.
- Board, turn and status are **rebuilt from the move list** after every move/undo, so history can never disagree with the board.
- Computer replies inside the same POST /moves request (priority: win, block, center, corner, any).
- Changing mode creates a new game; the scoreboard is global to the server session.

## 10. Clarifications and assumptions
- **Undo uses Option A**: disabled once a game is Won/Draw, so the scoreboard is final for that game.
- Each game records its result once (`resultRecorded` flag).
- Reset Game reuses the same game id and mode.
- Computer mode: human is X, O moves from the client are rejected.

## 11. Known limitations
In-memory only (data lost on restart, single server instance); no auth; no websockets; basic non-minimax AI.

## 12. Future improvements
SQLite persistence, minimax AI, Option B undo with scoreboard rollback, Docker compose, e2e tests (Playwright).
