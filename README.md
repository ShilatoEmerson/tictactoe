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

### Approach
This project was built with **AI-assisted development**. I used Claude (Anthropic) as a pair-programming tool, and I made the technical decisions, ran and tested the application, debugged issues and reviewed the core logic.

### Share of AI involvement
- **Backend (Node.js/Express): roughly 80% of the code was AI-generated** as a first draft from my requirements. The remaining ~20% is my own work.
- **Frontend (React):** AI-generated first draft of the components and styling. I tested it in the browser, debugged the touch-emulation flicker, and chose and verified the UI direction.
- **Everything was run and verified by me**, not accepted on trust.

### My role
- **Specification and stack decision:** I took the assignment (originally Angular + .NET) and decided to implement it with **React + Node.js/Express**, keeping all functional requirements and the REST contract.
- **Design choices:** Undo Option A, backend-owned state, in-memory storage, and a CSS-only restyle (neon arcade theme) kept separate from the logic.
- **Verification:** I ran both servers locally and manually tested every acceptance criterion in the browser: win, draw, reset, undo in both modes, scoreboard, computer mode. I confirmed the REST calls in the Network tab and ran the backend and frontend test suites.
- **Debugging:** I resolved a port conflict (`EADDRINUSE` on 4000) and a cell flicker seen in touch emulation, fixed by scoping hover styles to devices with a mouse.

### Prompts (summary)
1. *Spec and stack:* Shared the full assignment document and asked for one change: "Frontend: React.js, Backend: Node.js/Express. Need full steps from scratch to create the project."
2. *Understanding:* Asked how the solution works for an interview, with likely panel questions.
3. *Code review:* Asked whether the React app uses functional components and the latest form.
4. *Frontend walkthrough:* Asked for a line-by-line flow of the whole frontend code.
5. *Debugging:* Pasted the `EADDRINUSE` port 4000 error and asked for a fix.
6. *Requirements check:* Asked whether every requirement was met, then ran the suggested smoke test myself.
7. *UI direction:* Asked whether to restyle the UI to be more gaming, and chose the neon arcade direction.
8. *Bug report:* Reported a square flickering in the phone emulator and applied the CSS fix.
9. *Delivery:* Asked for steps to push to GitHub and for help drafting this section.

### Parts I reviewed most carefully
- **Win/draw detection:** all 8 lines, with the win checked before the draw.
- **Undo:** state is rebuilt from the move list; 1 move in two-player mode, 2 in computer mode.
- **Scoreboard:** a `resultRecorded` flag gives one update per game; Reset Game leaves it unchanged; Undo is disabled after completion.
- **Move validation:** invalid moves return typed errors and never change the turn.
- **Computer move priority:** win, block, centre, corner, any.

### Assumptions and trade-offs
- Undo Option A (disabled after completion) keeps the scoreboard final.
- The backend is the source of truth; the frontend renders returned state only.
- The computer follows the specified priority order rather than minimax.
- Storage is in-memory, so data is lost on restart.

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

## 13. Look and feel

<img width="1047" height="616" alt="image" src="https://github.com/user-attachments/assets/94e809a9-b16b-4004-89f0-8c84c6f1f6a3" />
<img width="1015" height="598" alt="image" src="https://github.com/user-attachments/assets/e621f33a-55db-475b-9463-a73f3a9ddbdd" />
<img width="1014" height="615" alt="image" src="https://github.com/user-attachments/assets/daf09341-4d32-4d0c-af12-00c1913bfbb6" />



