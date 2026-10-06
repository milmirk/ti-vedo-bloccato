/*
 * Il server su una porta casuale di 127.0.0.1: nessuna rete esterna, nessuna chiave.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { createAppServer, safeResolve, allowedOrigin, createRateLimiter } from "../server.mjs";

let server;
let port;
const logs = [];

function request(pathname, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path: pathname, method, headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

const fakeAgent = {
  model: "finto",
  async interpret(text) {
    if (text === "rompi") throw new Error("guasto");
    return { items: [{ unitId: "caffe", count: 1, cents: 120, priced: "oggetto" }], notUnderstood: "", totalCents: 120, source: "ai" };
  },
};

before(async () => {
  server = createAppServer({ agent: fakeAgent, log: (s) => logs.push(s) });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  port = server.address().port;
});
after(() => new Promise((r) => server.close(r)));

test("serve l'app, i moduli condivisi e la presentazione", async () => {
  const home = await request("/");
  assert.equal(home.status, 200);
  assert.match(home.headers["content-type"], /text\/html/);
  assert.match(home.headers["content-security-policy"], /script-src 'self'/);
  assert.match(home.body, /<html lang="it">/);
  const lib = await request("/lib/units.js");
  assert.equal(lib.status, 200);
  assert.match(lib.headers["content-type"], /javascript/);
  const pres = await request("/presentation/");
  assert.equal(pres.status, 200);
  assert.equal((await request("/presentation")).status, 302);
  const health = JSON.parse((await request("/api/health")).body);
  assert.deepEqual({ ok: health.ok, ai: health.ai }, { ok: true, ai: true });
});

test("niente uscite dalla cartella, anche con percorsi codificati", async () => {
  for (const p of ["/..%2Fserver.mjs", "/lib/..%2F..%2Fpackage.json", "/..%5C..%5Cserver.mjs", "/presentation/..%2F..%2FREADME.md"]) {
    const r = await request(p);
    assert.ok([403, 404].includes(r.status), `${p} → ${r.status}`);
    assert.doesNotMatch(r.body, /createAppServer|"dependencies"|# Bilancio/);
  }
  assert.equal((await request("/%E0%A4%A")).status, 400, "codifica rotta: 400, non un crash");
  const root = path.resolve("/tmp/x");
  assert.equal(safeResolve(root, "../y"), null);
  assert.equal(safeResolve(root, "a/b.js"), path.join(root, "a", "b.js"));
});

test("/api/interpreta: solo dalla stessa origine, solo POST, JSON valido e testo breve", async () => {
  const ok = { "content-type": "application/json", origin: `http://localhost:${port}` };
  const body = JSON.stringify({ text: "un caffè", units: [{ id: "caffe" }] });
  assert.equal((await request("/api/interpreta", { method: "POST", headers: { "content-type": "application/json" }, body })).status, 403, "senza Origin");
  assert.equal((await request("/api/interpreta", { method: "POST", headers: { ...ok, origin: "https://altro.example" }, body })).status, 403);
  assert.equal((await request("/api/interpreta")).status, 405);
  assert.equal((await request("/api/interpreta", { method: "POST", headers: ok, body: "{rotto" })).status, 400);
  assert.equal((await request("/api/interpreta", { method: "POST", headers: ok, body: "null" })).status, 400);
  assert.equal((await request("/api/interpreta", { method: "POST", headers: ok, body: JSON.stringify({ text: "x".repeat(301) }) })).status, 400);
  const good = await request("/api/interpreta", { method: "POST", headers: ok, body });
  assert.equal(good.status, 200);
  assert.equal(JSON.parse(good.body).totalCents, 120);
  const broken = await request("/api/interpreta", { method: "POST", headers: ok, body: JSON.stringify({ text: "rompi" }) });
  assert.equal(broken.status, 502, "un errore dell'AI diventa una risposta, non un crash");
  assert.equal((await request("/api/health")).status, 200, "il server è ancora vivo");
});

test("corpo oltre 64 KB rifiutato", async () => {
  const r = await request("/api/interpreta", {
    method: "POST",
    headers: { "content-type": "application/json", origin: `http://127.0.0.1:${port}` },
    body: JSON.stringify({ text: "a", pad: "x".repeat(70 * 1024) }),
  }).catch(() => ({ status: "chiusa" }));
  assert.ok(r.status === 400 || r.status === "chiusa");
  assert.equal((await request("/api/health")).status, 200);
});

test("limite al minuto e origini ammesse", () => {
  let t = 0;
  const limit = createRateLimiter(2, 60000, () => t);
  assert.equal(limit(), true);
  assert.equal(limit(), true);
  assert.equal(limit(), false);
  t = 61000;
  assert.equal(limit(), true, "dopo un minuto si riparte");
  assert.equal(allowedOrigin("http://localhost:8802", 8802), true);
  assert.equal(allowedOrigin("http://localhost:8803", 8802), false);
  assert.equal(allowedOrigin(undefined, 8802), false);
});
