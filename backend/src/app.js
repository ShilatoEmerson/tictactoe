import express from 'express';
import cors from 'cors';
import { createGameService } from './gameService.js';
import { GameError } from './gameLogic.js';

export function createApp(service = createGameService()) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post('/api/games', (req, res) => res.status(201).json(service.create(req.body?.mode)));
  app.get('/api/games/:id', (req, res) => res.json(service.get(req.params.id)));
  app.post('/api/games/:id/moves', (req, res) => res.json(service.move(req.params.id, req.body ?? {})));
  app.post('/api/games/:id/undo', (req, res) => res.json(service.undo(req.params.id)));
  app.post('/api/games/:id/reset', (req, res) => res.json(service.reset(req.params.id)));
  app.get('/api/scoreboard', (req, res) => res.json(service.getScoreboard()));
  app.post('/api/scoreboard/reset', (req, res) => res.json(service.resetScoreboard()));

  // Centralised error handling: rule violations -> clean JSON
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof GameError) {
      return res.status(err.httpStatus).json({ error: { code: err.code, message: err.message } });
    }
    console.error(err);
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Unexpected error' } });
  });
  return app;
}
