// Thin REST client. The backend is the source of truth; every call returns fresh state.
const BASE = import.meta.env?.VITE_API_URL ?? "";

async function request(path, method = "GET", body) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? "Request failed");
  return data;
}

export const api = {
  createGame: (mode) => request("/games", "POST", { mode }),
  getGame: (id) => request(`/games/${id}`),
  move: (id, player, index) =>
    request(`/games/${id}/moves`, "POST", { player, index }),
  undo: (id) => request(`/games/${id}/undo`, "POST"),
  reset: (id) => request(`/games/${id}/reset`, "POST"),
  getScoreboard: () => request("/scoreboard"),
  resetScoreboard: () => request("/scoreboard/reset", "POST"),
};
