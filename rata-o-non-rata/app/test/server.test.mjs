import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createAppServer, MAX_BODY } from "../server.mjs";

// Agente finto: nessuna rete. Restituisce un esito già "verificato".
const fakeAgent = {
  model: "finto",
  calls: 0,
  async extract(text) {
    this.calls++;
    if (text.includes("ERRORE")) throw new Error("boom");
    return { status: "incompleta", parser: "ai", purchase: { provider: "X" }, missing: ["total"], rejected: [], note: "" };
  },
};

let server;
let noAi;
let base;
let baseNoAi;
const quiet = () => {};

before(async () => {
  server = createAppServer({ agent: fakeAgent, perMinute: 3, log: quiet });
  noAi = createAppServer({ agent: null, log: quiet });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  await new Promise((r) => noAi.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
  baseNoAi = `http://127.0.0.1:${noAi.address().port}`;
});
after(() => { server.close(); noAi.close(); });

// Richiesta HTTP grezza: permette percorsi con ".." non normalizzati.
function raw(url, { method = "GET", path: p, headers = {}, body } = {}) {
  const u = new URL(url);
  return new Promise((resolve, reject) => {
    const req = http.request({ host: u.hostname, port: u.port, method, path: p ?? u.pathname, headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, text: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

test("serve l'app, i moduli condivisi, la presentazione e /api/health", async () => {
  const home = await raw(base, { path: "/" });
  assert.equal(home.status, 200);
  assert.match(home.text, /<html lang="it">/);
  assert.match(home.headers["content-security-policy"], /script-src 'self'/);
  const lib = await raw(base, { path: "/lib/schedule.js" });
  assert.equal(lib.status, 200);
  assert.match(lib.headers["content-type"], /text\/javascript/);
  assert.equal((await raw(base, { path: "/presentation" })).status, 302);
  assert.equal((await raw(base, { path: "/presentation/" })).status, 200);
  const health = JSON.parse((await raw(baseNoAi, { path: "/api/health" })).text);
  assert.deepEqual(health, { ok: true, ai: false, model: null, lastAiError: null });
});

test("path traversal bloccato, file inesistenti e indirizzi malformati non fanno cadere il server", async () => {
  for (const p of ["/../server.mjs", "/lib/..%2f..%2fserver.mjs", "/..%5c..%5cpackage.json", "/presentation/..%2f..%2fapp%2fserver.mjs"]) {
    const r = await raw(base, { path: p });
    assert.ok([403, 404].includes(r.status), `${p} → ${r.status}`);
    assert.ok(!r.text.includes("createAppServer"), p);
  }
  assert.equal((await raw(base, { path: "/%E0%A4%A" })).status, 400);
  assert.equal((await raw(base, { path: "/non-esiste.js" })).status, 404);
  assert.equal((await raw(base, { path: "/api/health" })).status, 200);
});

test("/api/extract: solo stessa origine, solo JSON, corpo massimo 64 KB", async () => {
  const origin = base;
  const json = { "content-type": "application/json" };
  assert.equal((await raw(base, { method: "POST", path: "/api/extract", headers: json, body: '{"text":"x"}' })).status, 403);
  assert.equal((await raw(base, { method: "POST", path: "/api/extract", headers: { ...json, origin: "https://altro.example" }, body: '{"text":"x"}' })).status, 403);
  assert.equal((await raw(base, { method: "POST", path: "/api/extract", headers: { origin, "content-type": "text/plain" }, body: "x" })).status, 415);
  const big = JSON.stringify({ text: "a".repeat(MAX_BODY + 10) });
  assert.equal((await raw(base, { method: "POST", path: "/api/extract", headers: { ...json, origin }, body: big })).status, 413);
  assert.equal((await raw(base, { method: "GET", path: "/api/extract" })).status, 405);
  assert.equal((await raw(baseNoAi, { method: "POST", path: "/api/extract", headers: { ...json, origin: baseNoAi }, body: '{"text":"x"}' })).status, 503);
});

test("/api/extract: JSON rotto → 400, errore dell'agente → 502, poi limite al minuto → 429", async () => {
  const headers = { "content-type": "application/json", origin: base };
  // il limite è 3 al minuto in questo server di test (il 413 sopra ne ha già usata una)
  assert.equal((await raw(base, { method: "POST", path: "/api/extract", headers, body: "{rotto" })).status, 400);
  const fail = await raw(base, { method: "POST", path: "/api/extract", headers, body: JSON.stringify({ text: "ERRORE" }) });
  assert.equal(fail.status, 502);
  assert.equal(JSON.parse(fail.text).reason, "boom");
  assert.equal((await raw(base, { method: "POST", path: "/api/extract", headers, body: JSON.stringify({ text: "x" }) })).status, 429);
  const health = JSON.parse((await raw(base, { path: "/api/health" })).text);
  assert.equal(health.ai, true);
  assert.equal(health.lastAiError, "boom");
});
