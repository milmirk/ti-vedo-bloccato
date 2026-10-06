/*
 * Server locale di SECCI Lens.
 *
 *   GET  /                 → l'app (file statici da public/)
 *   GET  /presentation/    → presentazione per la commissione (../presentation)
 *   GET  /api/health       → stato dell'agente AI
 *   POST /api/extract      → { text }            → citazioni dei dati, verificate
 *   POST /api/explain      → { text, aiFields? } → frasi semplici, verificate
 *
 * Tutti i calcoli avvengono nel browser con public/lib: il server serve solo
 * per l'AI facoltativa. La chiave Claude resta qui, mai nel browser. Il server
 * ascolta solo su 127.0.0.1, le API accettano richieste solo dalla pagina
 * stessa (controllo dell'origine), con corpo massimo di 64 KB e un limite al
 * minuto. Una richiesta malformata non fa mai cadere il server.
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AuthenticationError, RateLimitError, APIConnectionError, APIError } from "@anthropic-ai/sdk";
import { createAgent, aiConfigured, AgentRejected, InputError, MODEL } from "./server/agent.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, "public");
const PRESENTATION = path.resolve(here, "..", "presentation");
const MAX_BODY = 64 * 1024;
const MAX_AI_PER_MINUTE = 20;

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
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
};
// L'app non usa script o stili in linea: la CSP lo garantisce. La presentazione
// è un file unico con stile e script interni, quindi ha una regola sua.
const CSP_APP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
const CSP_DECK = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";

class TooLarge extends Error {}

function send(res, status, body, headers = {}) {
  const isJson = typeof body !== "string" && !Buffer.isBuffer(body);
  res.writeHead(status, {
    "content-type": isJson ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    ...headers,
  });
  res.end(isJson ? JSON.stringify(body) : body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"] || 0);
    if (declared > MAX_BODY) { reject(new TooLarge()); req.resume(); return; }
    let size = 0;
    let tooBig = false;
    const chunks = [];
    // Oltre il limite smetto di conservare i dati ma li leggo fino in fondo, così
    // la pagina riceve un 413 pulito; solo un invio enorme chiude la connessione.
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        tooBig = true;
        chunks.length = 0;
        if (size > 16 * MAX_BODY) { reject(new TooLarge()); req.destroy(); }
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (tooBig) return reject(new TooLarge());
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function reasonOf(err) {
  if (err instanceof AgentRejected) return err.reason;
  if (err instanceof AuthenticationError) return "credenziali non valide";
  if (err instanceof RateLimitError) return "limite di richieste raggiunto";
  if (err instanceof APIConnectionError) return "rete non raggiungibile";
  if (err instanceof APIError) return `errore API ${err.status}`;
  return err?.message || "errore sconosciuto";
}

export function createAppServer({ agent = null, model = MODEL, log = console.log } = {}) {
  let lastAiError = null;
  const recent = [];

  // Stessa origine: solo la pagina servita da questo server (localhost o 127.0.0.1, stessa porta).
  const allowedOrigin = (req) => {
    const origin = req.headers.origin;
    const port = req.socket.localPort;
    return origin === `http://localhost:${port}` || origin === `http://127.0.0.1:${port}`;
  };

  // Limite semplice a finestra mobile: protegge la chiave da cicli o abusi.
  const underRateLimit = () => {
    const now = Date.now();
    while (recent.length && now - recent[0] > 60000) recent.shift();
    if (recent.length >= MAX_AI_PER_MINUTE) return false;
    recent.push(now);
    return true;
  };

  async function serveStatic(req, res, prefix, root) {
    let rel;
    try {
      rel = decodeURIComponent(new URL(req.url, "http://x").pathname.slice(prefix.length));
    } catch {
      return send(res, 400, "Indirizzo non valido");
    }
    if (!rel || rel.endsWith("/")) rel += "index.html";
    if (rel.includes("\0")) return send(res, 400, "Indirizzo non valido");
    const file = path.resolve(root, rel);
    if (!file.startsWith(root + path.sep)) return send(res, 403, "Vietato");
    try {
      const data = await readFile(file);
      const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
      const headers = { "content-type": type, "cache-control": "no-cache" };
      if (type.startsWith("text/html")) headers["content-security-policy"] = root === PRESENTATION ? CSP_DECK : CSP_APP;
      send(res, 200, data, headers);
    } catch {
      send(res, 404, "Non trovato");
    }
  }

  async function handleAi(req, res, kind) {
    if (!allowedOrigin(req)) return send(res, 403, { error: "origine_non_ammessa" });
    if (!agent) return send(res, 503, { error: "ai_non_configurata" });

    let body;
    try {
      body = await readJson(req);
    } catch (e) {
      return send(res, e instanceof TooLarge ? 413 : 400, { error: e instanceof TooLarge ? "richiesta_troppo_grande" : "json_non_valido" });
    }
    if (!body || typeof body !== "object" || typeof body.text !== "string" || !body.text.trim()) {
      return send(res, 400, { error: "testo_mancante" });
    }
    if (body.aiFields != null && typeof body.aiFields !== "object") return send(res, 400, { error: "dati_non_validi" });
    if (!underRateLimit()) return send(res, 429, { error: "troppe_richieste" });

    const started = Date.now();
    try {
      const out = kind === "extract" ? await agent.extract(body.text) : await agent.explain(body.text, body.aiFields || null);
      lastAiError = null;
      log(`[${kind}] ai in ${Date.now() - started} ms`);
      return send(res, 200, out);
    } catch (err) {
      if (err instanceof InputError) return send(res, 400, { error: "dati_insufficienti", reason: err.message });
      const reason = reasonOf(err);
      lastAiError = reason;
      log(`[${kind}] scartato (${reason}): la pagina resta sulle regole`);
      return send(res, 502, { error: "risposta_ai_non_disponibile", reason });
    }
  }

  async function route(req, res) {
    const { pathname } = new URL(req.url, "http://x");
    if (pathname === "/api/health") {
      return send(res, 200, { ok: true, ai: !!agent, model: agent ? model : null, lastAiError });
    }
    if (pathname === "/api/extract" || pathname === "/api/explain") {
      if (req.method !== "POST") return send(res, 405, { error: "metodo_non_ammesso" }, { allow: "POST" });
      return handleAi(req, res, pathname === "/api/extract" ? "extract" : "explain");
    }
    if (pathname.startsWith("/api/")) return send(res, 404, { error: "non_trovato" });
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Metodo non ammesso", { allow: "GET" });
    if (pathname === "/presentation") return send(res, 302, "", { location: "/presentation/" });
    for (const [prefix, root] of STATIC) {
      if (pathname.startsWith(prefix)) return serveStatic(req, res, prefix, root);
    }
    send(res, 404, "Non trovato");
  }

  return http.createServer(async (req, res) => {
    try {
      await route(req, res);
    } catch (err) {
      log(`[server] richiesta scartata: ${err.message}`);
      if (!res.headersSent) send(res, 400, "Richiesta non valida");
      else res.end();
    }
  });
}

const isMain = (() => {
  if (!process.argv[1]) return false;
  const a = path.resolve(fileURLToPath(import.meta.url));
  const b = path.resolve(process.argv[1]);
  return process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
})();

if (isMain) {
  const PORT = Number(process.env.PORT || 8801);
  const HOST = "127.0.0.1"; // mai sulla rete: solo questo computer
  const agent = aiConfigured() ? createAgent() : null;
  createAppServer({ agent }).listen(PORT, HOST, () => {
    console.log(`SECCI Lens → http://localhost:${PORT}/`);
    console.log(`Presentazione → http://localhost:${PORT}/presentation/`);
    console.log(agent
      ? `Agente AI attivo (${MODEL}). Ogni risposta passa dai controlli prima di arrivare alla pagina.`
      : "Agente AI non configurato (ANTHROPIC_API_KEY): l'app funziona con le regole deterministiche.");
  });
}
