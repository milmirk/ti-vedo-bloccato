/*
 * Service worker: inoltra le richieste di suggerimento al server locale.
 * Il content script non chiama direttamente il server perché sulle pagine
 * https una richiesta verso http://localhost verrebbe bloccata.
 */
const DEFAULT_SERVER = "http://localhost:8787";
const HEALTH_TTL_MS = 60000;
let health = { at: 0, ai: false };

async function aiAvailable(base) {
  if (Date.now() - health.at < HEALTH_TTL_MS) return health.ai;
  try {
    const h = await (await fetch(base + "/api/health")).json();
    health = { at: Date.now(), ai: !!h.ai };
  } catch (_) {
    health = { at: Date.now(), ai: false };
  }
  return health.ai;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "tvb:hint") return false;
  chrome.storage.local.get({ serverUrl: DEFAULT_SERVER }, async ({ serverUrl }) => {
    const base = serverUrl.replace(/\/$/, "");
    try {
      if (!(await aiAvailable(base))) return sendResponse(null);
      const r = await fetch(base + "/api/hint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ context: msg.context }),
      });
      sendResponse(r.ok ? await r.json() : null);
    } catch (_) {
      sendResponse(null); // server spento: il content script userà le regole
    }
  });
  return true; // risposta asincrona
});
