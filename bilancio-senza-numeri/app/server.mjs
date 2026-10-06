/*
 * Server locale di "Bilancio senza numeri".
 *
 *   GET  /                  → l'app (public/index.html)
 *   GET  /lib/…, /app.js …  → file dell'app (moduli ES condivisi con i test)
 *   GET  /presentation/     → presentazione per la commissione
 *   GET  /api/health        → stato dell'interprete AI
 *   POST /api/interpreta    → { text, units } → voci di spesa validate
 *
 * L'app funziona del tutto senza AI: la chiave serve solo per capire frasi
 * libere che l'interprete a regole non riconosce. La chiave resta qui, mai
 * nel browser. Il server ascolta solo su 127.0.0.1 e /api/interpreta accetta
 * richieste solo dalla pagina stessa (stessa origine), con un limite al minuto.
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AuthenticationError, RateLimitError, APIConnectionError, APIError } from "@anthropic-ai/sdk";
import { createSpendAgent, aiConfigured, SpendRejected, MODEL, MAX_TEXT_CHARS, unitsFromRequest } from "./server/agent.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, "public");
const PRESENTATION = path.resolve(here, "..", "presentation");
const MAX_BODY = 64 * 1024;
const MAX_REQUESTS_PER_MINUTE = 30;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

// L'app non ha script o stili esterni: la CSP lo rende esplicito.
const APP_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const SECURITY = { "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };

function send(res, status, body, headers = {}) {
  const isJson = typeof body !== "string" && !Buffer.isBuffer(body);
  res.writeHead(status, {
    "content-type": isJson ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
    "cache-control": "no-store",
    ...SECURITY,
    ...headers,
  });
  res.end(isJson ? JSON.stringify(body) : body);
}

/** Solo la pagina servita da questo stesso server. */
export function allowedOrigin(origin, port) {
  if (!origin) return false;
  return origin === `http://localhost:${port}` || origin === `http://127.0.0.1:${port}`;
}

/** Limite semplice a finestra mobile: protegge la chiave da cicli o abusi. */
export function createRateLimiter(max = MAX_REQUESTS_PER_MINUTE, windowMs = 60000, now = () => Date.now()) {
  const recent = [];
  return () => {
    const t = now();
    while (recent.length && t - recent[0] > windowMs) recent.shift();
    if (recent.length >= max) return false;
    recent.push(t);
    return true;
  };
}

/** Risolve un percorso dentro una cartella; null se prova a uscirne. */
export function safeResolve(root, rel) {
  const file = path.resolve(root, "." + path.sep + rel);
  if (file !== root && !file.startsWith(root + path.sep)) return null;
  return file;
}

async function serveStatic(req, res, prefix, root, extraHeaders = {}) {
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, "http://x").pathname.slice(prefix.length));
  } catch {
    return send(res, 400, "Indirizzo non valido");
  }
  if (rel.includes("\0")) return send(res, 400, "Indirizzo non valido");
  if (!rel || rel.endsWith("/")) rel += "index.html";
  const file = safeResolve(root, rel);
  if (!file) return send(res, 403, "Vietato");
  try {
    const data = await readFile(file);
    send(res, 200, data, { "content-type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", ...extraHeaders });
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

/**
 * @param {{agent?: object|null, port?: () => number, log?: (s: string) => void}} [opt]
 */
export function createAppServer({ agent = null, log = console.log } = {}) {
  const underRateLimit = createRateLimiter();
  let lastAiError = null;
  let server;
  const port = () => server.address()?.port;

  async function handleInterpret(req, res) {
    if (!allowedOrigin(req.headers.origin, port())) return send(res, 403, { error: "origine_non_ammessa" });
    if (!agent) return send(res, 503, { error: "ai_non_configurata" });
    if (!underRateLimit()) return send(res, 429, { error: "troppe_richieste" });

    let body;
    try { body = await readJson(req); } catch { return send(res, 400, { error: "json_non_valido" }); }
    if (!body || typeof body !== "object" || typeof body.text !== "string") return send(res, 400, { error: "testo_mancante" });
    const text = body.text.trim();
    if (!text || text.length > MAX_TEXT_CHARS) return send(res, 400, { error: "testo_non_valido" });
    const units = unitsFromRequest(body.units);

    const started = Date.now();
    try {
      const out = await agent.interpret(text, units);
      lastAiError = null;
      log(`[interpreta] ${out.items.length} voci dall'AI in ${Date.now() - started} ms`);
      return send(res, 200, out);
    } catch (err) {
      let reason;
      if (err instanceof SpendRejected) reason = err.reason;
      else if (err instanceof AuthenticationError) reason = "credenziali non valide";
      else if (err instanceof RateLimitError) reason = "limite di richieste raggiunto";
      else if (err instanceof APIConnectionError) reason = "rete non raggiungibile";
      else if (err instanceof APIError) reason = `errore API ${err.status}`;
      else reason = err.message;
      lastAiError = reason;
      log(`[interpreta] scartata (${reason}): l'app userà le regole e i pulsanti`);
      return send(res, 502, { error: "interpretazione_non_disponibile", reason });
    }
  }

  async function route(req, res) {
    const { pathname } = new URL(req.url, "http://x");
    if (pathname === "/api/health") {
      return send(res, 200, { ok: true, ai: !!agent, model: agent ? agent.model || MODEL : null, lastAiError });
    }
    if (pathname === "/api/interpreta") {
      if (req.method !== "POST") return send(res, 405, { error: "metodo_non_ammesso" }, { allow: "POST" });
      return handleInterpret(req, res);
    }
    if (pathname.startsWith("/api/")) return send(res, 404, { error: "non_trovato" });
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Metodo non ammesso", { allow: "GET, HEAD" });
    if (pathname === "/presentation") return send(res, 302, "", { location: "/presentation/" });
    if (pathname.startsWith("/presentation/")) return serveStatic(req, res, "/presentation/", PRESENTATION);
    return serveStatic(req, res, "/", PUBLIC, { "content-security-policy": APP_CSP });
  }

  // Una richiesta malformata non deve mai far cadere il server durante la demo.
  server = http.createServer(async (req, res) => {
    try {
      await route(req, res);
    } catch (err) {
      log(`[server] richiesta scartata: ${err.message}`);
      if (!res.headersSent) send(res, 400, "Richiesta non valida");
      else res.end();
    }
  });
  return server;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const PORT = Number(process.env.PORT || 8802);
  const agent = aiConfigured() ? createSpendAgent() : null;
  // Solo 127.0.0.1: il server non è raggiungibile da altri computer.
  createAppServer({ agent }).listen(PORT, "127.0.0.1", () => {
    console.log(`Bilancio senza numeri → http://localhost:${PORT}/`);
    console.log(`Presentazione → http://localhost:${PORT}/presentation/`);
    console.log(agent
      ? `Interprete AI attivo (${MODEL}).`
      : "Interprete AI non configurato (ANTHROPIC_API_KEY assente): l'app funziona con le regole e i pulsanti.");
  });
}
