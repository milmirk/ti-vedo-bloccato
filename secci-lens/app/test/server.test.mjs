// Test del server su 127.0.0.1 con porta casuale e agente finto: nessuna rete esterna.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createAppServer } from "../server.mjs";

let server;
let base;
let origin;
const calls = [];
const fakeAgent = {
  async extract(text) { calls.push(["extract", text]); return { aiFields: { fields: {}, fees: [] }, found: [], rejected: [], source: "ai" }; },
  async explain(text) { calls.push(["explain", text]); return { items: [{ quote: "x", plain: "y", origin: "ai" }], dropped: [], source: "ai" }; },
};

before(async () => {
  server = createAppServer({ agent: fakeAgent, log: () => {} });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  base = `http://127.0.0.1:${port}`;
  origin = `http://localhost:${port}`;
});
after(() => new Promise((r) => server.close(r)));

// Richiesta "grezza": il percorso arriva al server così com'è, senza normalizzazione.
function raw(pathname, { method = "GET", headers = {}, body, to = base } = {}) {
  return new Promise((resolve, reject) => {
    const { hostname, port } = new URL(to);
    const req = http.request({ hostname, port, method, headers, path: pathname }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, text: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}
const post = (pathname, body, headers = { origin }) => raw(pathname, {
  method: "POST", body: typeof body === "string" ? body : JSON.stringify(body),
  headers: { "content-type": "application/json", ...headers },
});

test("serve l'app, le librerie condivise, la presentazione e lo stato", async () => {
  const home = await raw("/");
  assert.equal(home.status, 200);
  assert.match(home.text, /<html lang="it">/);
  assert.match(home.headers["content-security-policy"], /script-src 'self'/);
  const lib = await raw("/lib/finance.js");
  assert.equal(lib.status, 200);
  assert.match(lib.headers["content-type"], /text\/javascript/);
  assert.equal((await raw("/presentation/")).status, 200);
  assert.equal((await raw("/presentation")).status, 302);
  const health = JSON.parse((await raw("/api/health")).text);
  assert.equal(health.ok, true);
  assert.equal(health.ai, true);
});

test("nessun file fuori dalle cartelle pubbliche", async () => {
  for (const p of ["/../package.json", "/..%2fpackage.json", "/..%2f..%2fREADME.md", "/lib/..%2f..%2fserver.mjs", "/presentation/..%2f..%2fapp%2fserver.mjs", "/%00"]) {
    const r = await raw(p);
    assert.notEqual(r.status, 200, p);
    assert.doesNotMatch(r.text, /createAppServer|"name": "secci-lens"/, p);
  }
  assert.equal((await raw("/lib/")).status, 404);
});

test("le API AI accettano solo la pagina stessa", async () => {
  assert.equal((await post("/api/explain", { text: "x" }, {})).status, 403);
  assert.equal((await post("/api/explain", { text: "x" }, { origin: "https://evil.example" })).status, 403);
  const ok = await post("/api/explain", { text: "Documento" });
  assert.equal(ok.status, 200);
  assert.equal(JSON.parse(ok.text).items.length, 1);
  assert.equal((await post("/api/extract", { text: "Documento" }, { origin: base })).status, 200);
});

test("richieste sbagliate: risposta chiara, il server resta in piedi", async () => {
  assert.equal((await post("/api/explain", "{non json")).status, 400);
  assert.equal((await post("/api/explain", "null")).status, 400);
  assert.equal((await post("/api/explain", { text: 42 })).status, 400);
  assert.equal((await post("/api/explain", { text: "x", aiFields: "a" })).status, 400);
  assert.equal((await post("/api/explain", { text: "x".repeat(70 * 1024) })).status, 413);
  assert.equal((await raw("/api/explain")).status, 405);
  assert.equal((await raw("/api/nulla")).status, 404);
  assert.equal((await raw("/%E0%A4%A")).status, 400, "indirizzo con codifica rotta");
  assert.equal((await raw("/api/health")).status, 200, "dopo tutto questo il server risponde ancora");
});

test("senza agente AI le API rispondono 503 e l'app funziona lo stesso", async () => {
  const s = createAppServer({ agent: null, log: () => {} });
  await new Promise((r) => s.listen(0, "127.0.0.1", r));
  const to = `http://127.0.0.1:${s.address().port}`;
  try {
    const health = JSON.parse((await raw("/api/health", { to })).text);
    assert.equal(health.ai, false);
    const r = await raw("/api/explain", {
      to, method: "POST", headers: { "content-type": "application/json", origin: to }, body: JSON.stringify({ text: "x" }),
    });
    assert.equal(r.status, 503);
    assert.equal((await raw("/", { to })).status, 200);
  } finally {
    await new Promise((r) => s.close(r));
  }
});
