/*
 * Server locale di "Ti vedo bloccato".
 *
 *   GET  /                 → reindirizza alla demo
 *   GET  /demo/...         → replica dimostrativa di Agenda CIE
 *   GET  /extension/...    → file dell'estensione (usati dalla modalità demo)
 *   GET  /presentation/    → presentazione finale
 *   GET  /api/health       → stato dell'agente AI
 *   POST /api/hint         → { context } → un suggerimento validato
 *
 * La chiave Claude resta qui, mai nel browser. Il server ascolta solo su
 * 127.0.0.1 (non è raggiungibile dalla rete) e /api/hint accetta richieste
 * solo dalla pagina demo e dall'estensione, con un limite al minuto: così
 * nessun altro sito o computer può consumare la chiave.
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AuthenticationError, RateLimitError, APIConnectionError, APIError } from "@anthropic-ai/sdk";
import { createHintAgent, aiConfigured, HintRejected, MODEL } from "./hint-agent.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(here, "..");
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const MAX_BODY = 64 * 1024;
const MAX_HINTS_PER_MINUTE = 30;
// Facoltativo: accetta solo l'estensione con questo ID (chrome://extensions).
const EXTENSION_ID = process.env.TVB_EXTENSION_ID || "";

const STATIC = [
  ["/demo/", path.join(APP, "demo-site")],
  ["/extension/", path.join(APP, "extension")],
  ["/presentation/", path.resolve(APP, "..", "presentation")],
];
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

const useAi = aiConfigured();
const agent = useAi ? createHintAgent() : null;
let lastAiError = null;

function send(res, status, body, headers = {}) {
  const isJson = typeof body !== "string" && !Buffer.isBuffer(body);
  res.writeHead(status, {
    "content-type": isJson ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
    "cache-control": "no-store",
    ...headers,
  });
  res.end(isJson ? JSON.stringify(body) : body);
}

function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  if (origin.startsWith("chrome-extension://")) return !EXTENSION_ID || origin === `chrome-extension://${EXTENSION_ID}`;
  return origin === `http://localhost:${PORT}` || origin === `http://127.0.0.1:${PORT}`;
}

// Limite semplice a finestra mobile: protegge la chiave da cicli o abusi.
const recentHints = [];
function underRateLimit() {
  const now = Date.now();
  while (recentHints.length && now - recentHints[0] > 60000) recentHints.shift();
  if (recentHints.length >= MAX_HINTS_PER_MINUTE) return false;
  recentHints.push(now);
  return true;
}

function corsHeaders(req) {
  const origin = req.headers.origin;
  return origin && allowedOrigin(req)
    ? { "access-control-allow-origin": origin, "access-control-allow-headers": "content-type", vary: "origin" }
    : {};
}

async function serveStatic(req, res, prefix, root) {
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, "http://x").pathname.slice(prefix.length)) || "index.html";
  } catch {
    return send(res, 400, "Indirizzo non valido");
  }
  const file = path.resolve(root, rel);
  if (!file.startsWith(root + path.sep) && file !== root) return send(res, 403, "Vietato");
  try {
    const data = await readFile(file);
    send(res, 200, data, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  } catch {
    send(res, 404, "Non trovato");
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error("troppo grande")); req.destroy(); }
      else chunks.push(c);
    });
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function looksLikeContext(ctx) {
  return ctx && typeof ctx === "object" && ctx.signal && typeof ctx.signal.type === "string"
    && ctx.page && Array.isArray(ctx.candidates);
}

async function handleHint(req, res) {
  const cors = corsHeaders(req);
  if (!allowedOrigin(req)) return send(res, 403, { error: "origine_non_ammessa" });
  if (!agent) return send(res, 503, { error: "ai_non_configurata" }, cors);
  if (!underRateLimit()) return send(res, 429, { error: "troppe_richieste" }, cors);

  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { error: "json_non_valido" }, cors); }
  if (!body || typeof body !== "object" || !looksLikeContext(body.context)) {
    return send(res, 400, { error: "contesto_non_valido" }, cors);
  }

  const started = Date.now();
  try {
    const hint = await agent.hint(body.context);
    lastAiError = null;
    console.log(`[hint] ${body.context.signal.type} → ai in ${Date.now() - started} ms`);
    return send(res, 200, hint, cors);
  } catch (err) {
    let reason;
    if (err instanceof HintRejected) reason = err.reason;
    else if (err instanceof AuthenticationError) reason = "credenziali non valide";
    else if (err instanceof RateLimitError) reason = "limite di richieste raggiunto";
    else if (err instanceof APIConnectionError) reason = "rete non raggiungibile";
    else if (err instanceof APIError) reason = `errore API ${err.status}`;
    else reason = err.message;
    lastAiError = reason;
    console.log(`[hint] ${body.context.signal.type} → scartato (${reason}), l'estensione userà le regole`);
    return send(res, 502, { error: "suggerimento_non_disponibile", reason }, cors);
  }
}

async function route(req, res) {
  const { pathname } = new URL(req.url, "http://x");
  if (req.method === "OPTIONS") return send(res, allowedOrigin(req) ? 204 : 403, "", corsHeaders(req));
  if (pathname === "/") return send(res, 302, "", { location: "/demo/" });
  if (pathname === "/api/health") {
    return send(res, 200, { ok: true, ai: !!agent, model: agent ? MODEL : null, lastAiError }, corsHeaders(req));
  }
  if (pathname === "/api/hint" && req.method === "POST") return handleHint(req, res);
  for (const [prefix, root] of STATIC) {
    if (pathname === prefix.slice(0, -1)) return send(res, 302, "", { location: prefix });
    if (pathname.startsWith(prefix)) return serveStatic(req, res, prefix, root);
  }
  send(res, 404, "Non trovato");
}

// Una richiesta malformata non deve mai far cadere il server durante la demo.
const server = http.createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (err) {
    console.log(`[server] richiesta scartata: ${err.message}`);
    if (!res.headersSent) send(res, 400, "Richiesta non valida");
    else res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Ti vedo bloccato → http://localhost:${PORT}/demo/`);
  console.log(agent
    ? `Agente AI attivo (${MODEL}).`
    : "Agente AI non configurato: imposta ANTHROPIC_API_KEY. Intanto funzionano i suggerimenti a regole.");
});
