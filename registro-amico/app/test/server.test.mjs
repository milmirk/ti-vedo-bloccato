// Server: file statici, protezioni e /api/explain. Solo 127.0.0.1, nessuna rete esterna.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { createAppServer, safeResolve, PUBLIC_DIR, MAX_BODY } from "../server.mjs";
import { ExplanationRejected } from "../server/agent.mjs";

let server;
let base;
let origin;
let calls = 0;
const agent = {
  model: "claude-opus-5-5",
  async explain(notice, lang) {
    calls += 1;
    if (notice.id === "n-sciopero") throw new ExplanationRejected("non presenti nell'originale: numero 15");
    return { ...notice.explanations[lang], source: "ai", model: "claude-opus-5-5" };
  },
};

before(async () => {
  server = createAppServer({ agent, maxPerMinute: 50, log: () => {} });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  base = `http://127.0.0.1:${port}`;
  origin = `http://localhost:${port}`;
});
after(() => new Promise((r) => { server.closeAllConnections(); server.close(r); }));

// Richiesta "grezza": fetch normalizza i ".." nell'indirizzo, qui no.
function raw(pathname, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${base}${pathname}`, { method, headers }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

const explain = (body, headers = {}) => raw("/api/explain", {
  method: "POST",
  headers: { "content-type": "application/json", origin, ...headers },
  body: typeof body === "string" ? body : JSON.stringify(body),
});

test("serve la palestra, i moduli condivisi e la salute del server", async () => {
  const home = await raw("/");
  assert.equal(home.status, 200);
  assert.match(home.headers["content-type"], /text\/html/);
  assert.match(home.headers["content-security-policy"], /default-src 'self'/);
  const lib = await raw("/lib/tasks.js");
  assert.equal(lib.status, 200);
  assert.match(lib.headers["content-type"], /javascript/);
  const health = JSON.parse((await raw("/api/health")).body);
  assert.deepEqual({ ok: health.ok, ai: health.ai }, { ok: true, ai: true });
});

test("blocca l'uscita dalla cartella pubblica (path traversal)", async () => {
  for (const p of ["/%2e%2e/server.mjs", "/..%2fpackage.json", "/lib/%2e%2e%2f%2e%2e%2fserver.mjs", "/%2e%2e%5cserver.mjs"]) {
    const r = await raw(p);
    assert.ok(r.status === 403 || r.status === 404, `${p} → ${r.status}`);
    assert.ok(!r.body.includes("createAppServer"), `${p} non deve mostrare il server`);
  }
  assert.equal((await raw("/%E0%A4%A")).status, 400, "codifica non valida");
  assert.equal(safeResolve(PUBLIC_DIR, "../server.mjs"), null);
  assert.equal(safeResolve(PUBLIC_DIR, "lib/data.js"), path.join(PUBLIC_DIR, "lib", "data.js"));
});

test("/api/explain accetta solo la stessa origine e solo JSON", async () => {
  assert.equal((await explain({ noticeId: "n-uscita", lang: "ar" }, { origin: "https://evil.example" })).status, 403);
  const noOrigin = await raw("/api/explain", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  assert.equal(noOrigin.status, 403);
  assert.equal((await explain("{}", { "content-type": "text/plain" })).status, 415);
  assert.equal((await raw("/api/explain")).status, 405);
});

test("/api/explain rifiuta corpi oltre 64 KB, JSON rotto e richieste non valide senza cadere", async () => {
  assert.equal((await explain("x".repeat(MAX_BODY + 10))).status, 413);
  assert.equal((await explain("{non json")).status, 400);
  assert.equal((await explain("null")).status, 400);
  assert.equal((await explain({ noticeId: "n-inventata", lang: "ar" })).status, 400);
  assert.equal((await explain({ noticeId: "n-uscita", lang: "fr" })).status, 400);
  assert.equal((await raw("/api/health")).status, 200, "il server è ancora in piedi");
});

test("/api/explain restituisce la spiegazione dell'agente e la tiene in memoria", async () => {
  const before = calls;
  const a = await explain({ noticeId: "n-uscita", lang: "en" });
  assert.equal(a.status, 200);
  assert.equal(JSON.parse(a.body).source, "ai");
  const b = JSON.parse((await explain({ noticeId: "n-uscita", lang: "en" })).body);
  assert.equal(b.cached, true);
  assert.equal(calls, before + 1, "la seconda volta non richiama il modello");
});

test("se l'agente scarta la spiegazione risponde 502 con il motivo (la pagina usa quella pronta)", async () => {
  const r = await explain({ noticeId: "n-sciopero", lang: "it" });
  assert.equal(r.status, 502);
  assert.match(JSON.parse(r.body).reason, /numero 15/);
});

test("senza AI configurata /api/explain risponde 503, ma la palestra funziona", async () => {
  const off = createAppServer({ agent: null, log: () => {} });
  await new Promise((r) => off.listen(0, "127.0.0.1", r));
  const { port } = off.address();
  const res = await new Promise((resolve) => {
    const req = http.request(`http://127.0.0.1:${port}/api/explain`, {
      method: "POST", headers: { "content-type": "application/json", origin: `http://127.0.0.1:${port}` },
    }, (r) => { r.resume(); r.on("end", () => resolve(r.statusCode)); });
    req.end(JSON.stringify({ noticeId: "n-uscita", lang: "ar" }));
  });
  const health = await fetch(`http://127.0.0.1:${port}/api/health`).then((r) => r.json());
  off.closeAllConnections();
  await new Promise((r) => off.close(r));
  assert.equal(res, 503);
  assert.equal(health.ai, false);
});

test("limite al minuto sulle richieste all'AI", async () => {
  const limited = createAppServer({ agent: { model: "m", explain: async (n, l) => n.explanations[l] }, maxPerMinute: 2, log: () => {} });
  await new Promise((r) => limited.listen(0, "127.0.0.1", r));
  const { port } = limited.address();
  const post = (lang) => fetch(`http://127.0.0.1:${port}/api/explain`, {
    method: "POST", headers: { "content-type": "application/json", origin: `http://127.0.0.1:${port}` },
    body: JSON.stringify({ noticeId: "n-assemblea", lang }),
  }).then((r) => r.status);
  const statuses = [await post("ar"), await post("en"), await post("it")];
  limited.closeAllConnections();
  await new Promise((r) => limited.close(r));
  assert.deepEqual(statuses, [200, 200, 429]);
});
