/*
 * Server locale di "Registro amico".
 *
 *   GET  /                 → la palestra (app/public/index.html)
 *   GET  /lib/...          → moduli condivisi tra browser e test
 *   GET  /presentation/    → presentazione per la commissione (../presentation)
 *   GET  /api/health       → stato dell'agente AI
 *   POST /api/explain      → { noticeId, lang } → spiegazione validata
 *
 * La chiave Claude resta qui, mai nel browser. Il server ascolta solo su
 * 127.0.0.1, /api/explain accetta solo richieste dalla pagina stessa
 * (stessa origine), con corpo massimo 64 KB e un limite al minuto. Il testo
 * da spiegare non arriva dal browser: il server prende la comunicazione dai
 * suoi dati, così nessuno può usare la chiave per altro.
 * Senza chiave l'app funziona lo stesso: le spiegazioni sono già pronte.
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { AuthenticationError, RateLimitError, APIConnectionError, APIError } from "@anthropic-ai/sdk";
import { createExplainAgent, aiConfigured, ExplanationRejected, MODEL } from "./server/agent.mjs";
import { noticeById } from "./public/lib/data.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PUBLIC_DIR = path.join(here, "public");
export const PRESENTATION_DIR = path.resolve(here, "..", "presentation");
const PORT = Number(process.env.PORT || 8805);
const HOST = process.env.HOST || "127.0.0.1";
export const MAX_BODY = 64 * 1024;
const LANGS = new Set(["ar", "en", "it"]);

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

const BASE_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-frame-options": "DENY",
};
// La palestra non usa script inline: CSP stretta. La presentazione sì (stile e
// motore in un solo file, come richiesto), quindi lì la CSP è più larga.
const CSP_APP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
const CSP_DECK = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'";

class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function send(res, status, body, headers = {}) {
  const isJson = typeof body !== "string" && !Buffer.isBuffer(body);
  res.writeHead(status, {
    "content-type": isJson ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
    "cache-control": "no-store",
    ...BASE_HEADERS,
    ...headers,
  });
  res.end(isJson ? JSON.stringify(body) : body);
}

// Risolve un percorso dentro `root`; null se prova a uscirne.
export function safeResolve(root, rel) {
  if (rel.includes("\0")) return null;
  const file = path.resolve(root, "." + path.sep + rel);
  return file === root || file.startsWith(root + path.sep) ? file : null;
}

async function serveStatic(req, res, pathname, prefix, root, csp) {
  let rel;
  try {
    rel = decodeURIComponent(pathname.slice(prefix.length));
  } catch {
    return send(res, 400, "Indirizzo non valido");
  }
  if (!rel || rel.endsWith("/")) rel += "index.html";
  const file = safeResolve(root, rel);
  if (!file) return send(res, 403, "Vietato");
  try {
    const data = await readFile(file);
    const headers = { "content-type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" };
    if (headers["content-type"].startsWith("text/html")) headers["content-security-policy"] = csp;
    if (req.method === "HEAD") {
      res.writeHead(200, { ...BASE_HEADERS, "cache-control": "no-store", ...headers });
      return res.end();
    }
    send(res, 200, data, headers);
  } catch {
    send(res, 404, "Non trovato");
  }
}

function readJson(req, limit = MAX_BODY) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"] || 0);
    if (declared > limit) {
      reject(new HttpError(413, "corpo_troppo_grande"));
      return;
    }
    let size = 0;
    let failed = false;
    const chunks = [];
    req.on("data", (c) => {
      if (failed) return;
      size += c.length;
      if (size > limit) {
        failed = true;
        reject(new HttpError(413, "corpo_troppo_grande"));
      } else chunks.push(c);
    });
    req.on("end", () => {
      if (failed) return;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(new HttpError(400, "json_non_valido")); }
    });
    req.on("error", () => { if (!failed) reject(new HttpError(400, "richiesta_interrotta")); });
  });
}

export function createAppServer({ agent = null, maxPerMinute = 20, log = console.log } = {}) {
  let lastAiError = null;
  const cache = new Map(); // "n-uscita:ar" → spiegazione già validata
  const recent = [];

  function port() {
    const a = server.address();
    return a && typeof a === "object" ? a.port : PORT;
  }

  // Stessa origine: la richiesta deve venire da questa pagina.
  function sameOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return false;
    return origin === `http://localhost:${port()}` || origin === `http://127.0.0.1:${port()}`;
  }

  // Limite semplice a finestra mobile: protegge la chiave da cicli o abusi.
  function underRateLimit() {
    const now = Date.now();
    while (recent.length && now - recent[0] > 60000) recent.shift();
    if (recent.length >= maxPerMinute) return false;
    recent.push(now);
    return true;
  }

  async function handleExplain(req, res) {
    if (!sameOrigin(req)) return send(res, 403, { error: "origine_non_ammessa" });
    if (!String(req.headers["content-type"] || "").includes("application/json")) {
      return send(res, 415, { error: "serve_json" });
    }
    let body;
    try {
      body = await readJson(req);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 400;
      if (status === 413) res.setHeader("connection", "close");
      return send(res, status, { error: err.code || "json_non_valido" });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return send(res, 400, { error: "richiesta_non_valida" });
    const notice = typeof body.noticeId === "string" ? noticeById(body.noticeId) : null;
    if (!notice) return send(res, 400, { error: "comunicazione_sconosciuta" });
    if (!LANGS.has(body.lang)) return send(res, 400, { error: "lingua_non_supportata" });
    if (!agent) return send(res, 503, { error: "ai_non_configurata" });

    const key = `${notice.id}:${body.lang}`;
    if (cache.has(key)) return send(res, 200, { ...cache.get(key), cached: true });
    if (!underRateLimit()) return send(res, 429, { error: "troppe_richieste" });

    const started = Date.now();
    try {
      const out = await agent.explain(notice, body.lang);
      cache.set(key, out);
      lastAiError = null;
      log(`[explain] ${key} → ai in ${Date.now() - started} ms`);
      return send(res, 200, out);
    } catch (err) {
      let reason;
      if (err instanceof ExplanationRejected) reason = err.reason;
      else if (err instanceof AuthenticationError) reason = "credenziali non valide";
      else if (err instanceof RateLimitError) reason = "limite di richieste raggiunto";
      else if (err instanceof APIConnectionError) reason = "rete non raggiungibile";
      else if (err instanceof APIError) reason = `errore API ${err.status}`;
      else reason = String(err && err.message ? err.message : err);
      lastAiError = reason;
      log(`[explain] ${key} → scartata (${reason}): la pagina usa la spiegazione già pronta`);
      return send(res, 502, { error: "spiegazione_non_disponibile", reason });
    }
  }

  async function route(req, res) {
    const { pathname } = new URL(req.url, "http://x");
    if (pathname === "/api/health") {
      return send(res, 200, { ok: true, ai: !!agent, model: agent ? agent.model || MODEL : null, lastAiError });
    }
    if (pathname === "/api/explain") {
      if (req.method !== "POST") return send(res, 405, { error: "metodo_non_ammesso" }, { allow: "POST" });
      return handleExplain(req, res);
    }
    if (pathname.startsWith("/api/")) return send(res, 404, { error: "non_trovato" });
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Metodo non ammesso", { allow: "GET, HEAD" });
    if (pathname === "/presentation") return send(res, 302, "", { location: "/presentation/" });
    if (pathname.startsWith("/presentation/")) {
      return serveStatic(req, res, pathname, "/presentation/", PRESENTATION_DIR, CSP_DECK);
    }
    return serveStatic(req, res, pathname, "/", PUBLIC_DIR, CSP_APP);
  }

  // Una richiesta malformata non deve mai far cadere il server durante la demo.
  const server = http.createServer(async (req, res) => {
    try {
      await route(req, res);
    } catch (err) {
      log(`[server] richiesta scartata: ${err && err.message}`);
      if (!res.headersSent) send(res, 400, "Richiesta non valida");
      else res.end();
    }
  });
  server.on("clientError", (err, socket) => {
    if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\nconnection: close\r\n\r\n");
  });
  return server;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const agent = aiConfigured() ? createExplainAgent() : null;
  createAppServer({ agent }).listen(PORT, HOST, () => {
    console.log(`Registro amico → http://localhost:${PORT}/`);
    console.log(`Presentazione  → http://localhost:${PORT}/presentation/`);
    console.log(agent
      ? `Agente AI attivo (${MODEL}) per «Spiegami questa comunicazione».`
      : "Agente AI non configurato (ANTHROPIC_API_KEY assente): si usano le spiegazioni già pronte.");
  });
}
