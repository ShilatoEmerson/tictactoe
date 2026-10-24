import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

let server, base;
before(async () => {
  server = createApp().listen(0);
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

const call = async (path, method = 'GET', body) => {
  const res = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
};

test('create game -> move -> invalid move -> undo -> reset', async () => {
  const created = await call('/api/games', 'POST', { mode: 'TwoPlayer' });
  assert.equal(created.status, 201);
  const id = created.data.id;

  let r = await call(`/api/games/${id}/moves`, 'POST', { player: 'X', index: 4 });
  assert.equal(r.data.board[4], 'X');

  r = await call(`/api/games/${id}/moves`, 'POST', { player: 'O', index: 4 });
  assert.equal(r.status, 409);
  assert.equal(r.data.error.code, 'CELL_OCCUPIED');

  r = await call(`/api/games/${id}/undo`, 'POST');
  assert.equal(r.data.moves.length, 0);

  r = await call(`/api/games/${id}/reset`, 'POST');
  assert.equal(r.data.currentPlayer, 'X');
});

test('unknown game returns 404; scoreboard endpoints work', async () => {
  assert.equal((await call('/api/games/nope')).status, 404);
  assert.deepEqual((await call('/api/scoreboard')).data, { xWins: 0, oWins: 0, draws: 0 });
  assert.equal((await call('/api/scoreboard/reset', 'POST')).status, 200);
});
