import { createApp } from './app.js';

const PORT = process.env.PORT || 4000;
createApp().listen(PORT, () => console.log(`Tic Tac Toe API running on http://localhost:${PORT}`));
