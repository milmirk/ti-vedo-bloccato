/*
 * Server locale di "Rata o non rata".
 *
 *   GET  /                 → l'app (file statici da public/)
 *   GET  /lib/...          → moduli ES condivisi con i test
 *   GET  /presentation/    → presentazione per la commissione
 *   GET  /api/health       → stato dell'agente AI facoltativo
 *   POST /api/extract      → { text } → campi estratti e verificati
 *
 * La chiave Claude resta qui, mai nel browser. Il server ascolta solo su
 * 127.0.0.1 (non è raggiungibile dalla rete); /api/extract accetta solo
 * richieste dalla pagina stessa (stessa origine), con un limite al minuto e
 * un corpo di al massimo 64 KB. Una richiesta malformata non lo fa cadere.
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AuthenticationError, RateLimitError, APIConnectionError, APIError } from "@anthropic-ai/sdk";
import { createExtractAgent, aiConfigured, ExtractionRejected, MODEL, MAX_EMAIL_CHARS } from "./server/agent.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, "public");
const PRESENTATION = path.resolve(here, "..", "presentation");
export const MAX_BODY = 64 * 1024;
const MAX_EXTRACT_PER_MINUTE = 20;

const STATIC = [
  ["/presentation/", PRESENTATION],
  ["/", PUBLIC],
];
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
// L'app non ha script inline: la CSP blocca codice iniettato. La presentazione
// ha uno script inline, quindi la CSP stretta vale solo per l'app.
const APP_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
  + "connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
const BASE_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-frame-options": "DENY",
};

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

function readJson(req, limit = MAX_BODY) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let failed = false;
    const chunks = [];
    // Oltre il limite il resto del corpo viene letto e buttato (mai tenuto in
    // memoria), poi si risponde 413: così il client riceve sempre la risposta.
    req.on("data", (c) => {
      size += c.length;
      if (size > limit * 16) { req.destroy(); return; } // chi insiste viene chiuso
      if (failed) return;
      if (size > limit) {
        failed = true;
        chunks.length = 0;
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (failed) {
        const e = new Error("corpo troppo grande");
        e.code = "too_large";
        return reject(e);
      }
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch (e) { reject(e); }
    });
    req.on("error", reject);
    // Connessione chiusa prima della fine: la promessa non resta mai appesa
    // (reject dopo resolve non ha effetto).
    req.on("close", () => reject(Object.assign(new Error("connessione chiusa"), { code: "closed" })));
  });
}

async function serveStatic(req, res, prefix, root) {
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, "http://x").pathname.slice(prefix.length));
  } catch {
    return send(res, 400, "Indirizzo non valido");
  }
  if (rel === "" || rel.endsWith("/")) rel += "index.html";
  if (rel.includes("\0")) return send(res, 400, "Indirizzo non valido");
  const file = path.resolve(root, rel);
  // Protezione dal path traversal: il file deve stare dentro la cartella servita.
  if (!file.startsWith(root + path.sep) && file !== root) return send(res, 403, "Vietato");
  try {
    const data = await readFile(file);
    const ext = path.extname(file).toLowerCase();
    const headers = { "content-type": TYPES[ext] || "application/octet-stream" };
    if (root === PUBLIC && ext === ".html") headers["content-security-policy"] = APP_CSP;
    if (req.method === "HEAD") {
      res.writeHead(200, { "cache-control": "no-store", ...BASE_HEADERS, ...headers, "content-length": data.length });
      return res.end();
    }
    send(res, 200, data, headers);
  } catch {
    send(res, 404, "Non trovato");
  }
}

/**
 * Crea il server (senza metterlo in ascolto): così i test possono usarlo con
 * un agente finto e una porta qualsiasi.
 */
export function createAppServer({ agent = null, perMinute = MAX_EXTRACT_PER_MINUTE, log = console.log } = {}) {
  let lastAiError = null;
  const recent = [];

  // Solo la pagina servita da questo stesso server può chiamare /api/extract.
  function allowedOrigin(req) {
    const origin = req.headers.origin;
    const port = server.address()?.port;
    if (!origin || !port) return false;
    return origin === `http://localhost:${port}` || origin === `http://127.0.0.1:${port}`;
  }

  // Limite semplice a finestra mobile: protegge la chiave da cicli o abusi.
  function underRateLimit() {
    const now = Date.now();
    while (recent.length && now - recent[0] > 60000) recent.shift();
    if (recent.length >= perMinute) return false;
    recent.push(now);
    return true;
  }

  async function handleExtract(req, res) {
    if (!allowedOrigin(req)) return send(res, 403, { error: "origine_non_ammessa" });
    if (!agent) return send(res, 503, { error: "ai_non_configurata" });
    if (!String(req.headers["content-type"] || "").startsWith("application/json")) {
      return send(res, 415, { error: "serve_json" });
    }
    if (!underRateLimit()) return send(res, 429, { error: "troppe_richieste" });

    let body;
    try {
      body = await readJson(req);
    } catch (e) {
      if (e.code === "too_large") return send(res, 413, { error: "testo_troppo_lungo" }, { connection: "close" });
      return send(res, 400, { error: "json_non_valido" });
    }
    if (!body || typeof body !== "object" || typeof body.text !== "string" || !body.text.trim()) {
      return send(res, 400, { error: "testo_mancante" });
    }
    if (body.text.length > MAX_EMAIL_CHARS) return send(res, 413, { error: "testo_troppo_lungo" });

    const started = Date.now();
    try {
      const result = await agent.extract(body.text);
      lastAiError = null;
      log(`[extract] ai in ${Date.now() - started} ms · ${result.status} · scartati ${result.rejected.length}`);
      return send(res, 200, result);
    } catch (err) {
      let reason;
      if (err instanceof ExtractionRejected) reason = err.reason;
      else if (err instanceof AuthenticationError) reason = "credenziali non valide";
      else if (err instanceof RateLimitError) reason = "limite di richieste raggiunto";
      else if (err instanceof APIConnectionError) reason = "rete non raggiungibile";
      else if (err instanceof APIError) reason = `errore API ${err.status}`;
      else reason = err.message;
      lastAiError = reason;
      log(`[extract] scartata (${reason}): resta il modulo a mano`);
      return send(res, 502, { error: "estrazione_non_disponibile", reason });
    }
  }

  async function route(req, res) {
    const { pathname } = new URL(req.url, "http://x");
    if (pathname === "/api/health") {
      return send(res, 200, { ok: true, ai: !!agent, model: agent ? agent.model || MODEL : null, lastAiError });
    }
    if (pathname === "/api/extract") {
      if (req.method !== "POST") return send(res, 405, { error: "metodo_non_ammesso" }, { allow: "POST" });
      return handleExtract(req, res);
    }
    if (pathname.startsWith("/api/")) return send(res, 404, { error: "non_trovato" });
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Metodo non ammesso", { allow: "GET, HEAD" });
    for (const [prefix, root] of STATIC) {
      if (prefix !== "/" && pathname === prefix.slice(0, -1)) return send(res, 302, "", { location: prefix });
      if (pathname.startsWith(prefix)) return serveStatic(req, res, prefix, root);
    }
    send(res, 404, "Non trovato");
  }

  const server = http.createServer(async (req, res) => {
    try {
      await route(req, res);
    } catch (err) {
      log(`[server] richiesta scartata: ${err.message}`);
      if (!res.headersSent) send(res, 400, "Richiesta non valida");
      else res.end();
    }
  });
  server.on("clientError", (err, socket) => {
    if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
  });
  return server;
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();

if (isMain) {
  const PORT = Number(process.env.PORT || 8804);
  const HOST = "127.0.0.1"; // mai sulla rete
  const agent = aiConfigured() ? createExtractAgent() : null;
  const server = createAppServer({ agent });
  server.listen(PORT, HOST, () => {
    console.log(`Rata o non rata → http://localhost:${PORT}/`);
    console.log(`Presentazione → http://localhost:${PORT}/presentation/`);
    console.log(agent
      ? `Estrazione con l'AI attiva (${agent.model}).`
      : "Estrazione con l'AI non configurata (ANTHROPIC_API_KEY): funzionano i parser deterministici e il modulo a mano.");
  });
}
