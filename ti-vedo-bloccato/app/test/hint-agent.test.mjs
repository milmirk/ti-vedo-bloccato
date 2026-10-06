import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  createHintAgent, validateHint, loadSystemPrompt, HintRejected, HINT_SCHEMA, aiConfigured,
} from "../server/hint-agent.mjs";

const require = createRequire(import.meta.url);
const { fallbackHint } = require("../extension/content/fallback-hints.js");

// Contesto come lo produce context.js al passo 4 della demo.
const ctx = {
  signal: { type: "dead_click", detail: { count: 2 } },
  page: { title: "Agenda CIE", site: "localhost", heading: "Riepilogo e conferma", step: "Riepilogo" },
  target: { ref: "r9", kind: "pulsante", label: "Conferma prenotazione", disabled: true },
  missing: [{ ref: "r7", kind: "casella", label: "Dichiaro di aver preso visione dell'informativa ai sensi dell'art. 13 del Reg. UE 2016/679" }],
  candidates: [
    { ref: "r7", kind: "casella", label: "Dichiaro di aver preso visione dell'informativa ai sensi dell'art. 13 del Reg. UE 2016/679", required: true, filled: false },
    { ref: "r8", kind: "pulsante", label: "Indietro" },
    { ref: "r9", kind: "pulsante", label: "Conferma prenotazione", disabled: true },
  ],
  texts: ["Il conferimento dei dati è obbligatorio ai fini della prenotazione."],
};

function fakeClient(payload, extra = {}) {
  const calls = [];
  return {
    calls,
    beta: {
      messages: {
        async create(params) {
          calls.push(params);
          return {
            model: "claude-opus-5-5",
            stop_reason: extra.stop_reason || "end_turn",
            content: [{ type: "text", text: typeof payload === "string" ? payload : JSON.stringify(payload) }],
          };
        },
      },
    },
  };
}

test("il system prompt viene letto da agents/prompts senza il commento iniziale", () => {
  const p = loadSystemPrompt();
  assert.ok(p.startsWith("Sei \"Ti vedo bloccato\""));
  assert.ok(!p.includes("<!--"));
});

test("richiesta: modello, structured output, effort basso, fallback lato server", async () => {
  const client = fakeClient({ hint: "Spunta «Dichiaro di aver preso visione».", target_ref: "r7", why: "Hai cliccato più volte.", original_quote: "Conferma prenotazione" });
  const agent = createHintAgent({ client, systemPrompt: "prompt" });
  const out = await agent.hint(ctx);
  const req = client.calls[0];
  assert.equal(req.model, "claude-opus-5-5");
  assert.deepEqual(req.output_config.format, { type: "json_schema", schema: HINT_SCHEMA });
  assert.equal(req.output_config.effort, "low");
  assert.equal(req.fallbacks, "default");
  assert.deepEqual(req.betas, ["server-side-fallback-2026-07-01"]);
  assert.equal(out.source, "ai");
  assert.equal(out.target_ref, "r7");
});

test("scarta un suggerimento che nomina un elemento inesistente", () => {
  assert.throws(
    () => validateHint({ hint: "Premi «Invia domanda».", target_ref: "", why: "", original_quote: "" }, ctx),
    (e) => e instanceof HintRejected && /Invia domanda/.test(e.reason)
  );
});

test("accetta nomi abbreviati che compaiono nella pagina", () => {
  const out = validateHint({ hint: "Prima spunta «Dichiaro di aver preso visione dell'informativa».", target_ref: "r7", why: "x", original_quote: "" }, ctx);
  assert.equal(out.target_ref, "r7");
});

test("toglie una citazione che non compare nella pagina e un bersaglio sconosciuto", () => {
  const out = validateHint({ hint: "Spunta la casella in fondo.", target_ref: "r999", why: "x", original_quote: "Testo inventato" }, ctx);
  assert.equal(out.original_quote, "");
  assert.equal(out.target_ref, "");
});

test("il 'perché' con nomi inventati o troppo lungo viene tolto, il suggerimento resta", () => {
  const base = { hint: "Spunta la casella in fondo.", target_ref: "r7", original_quote: "" };
  assert.equal(validateHint({ ...base, why: "Hai cliccato «Invia domanda»." }, ctx).why, "");
  assert.equal(validateHint({ ...base, why: "x".repeat(250) }, ctx).why, "");
  assert.equal(validateHint({ ...base, why: "Hai cliccato più volte «Conferma prenotazione»." }, ctx).why,
    "Hai cliccato più volte «Conferma prenotazione».");
});

test("scarta suggerimenti vuoti o troppo lunghi", () => {
  assert.throws(() => validateHint({ hint: "  ", target_ref: "", why: "", original_quote: "" }, ctx), HintRejected);
  assert.throws(() => validateHint({ hint: "a".repeat(300), target_ref: "", why: "", original_quote: "" }, ctx), HintRejected);
});

test("rifiuto del modello e JSON non valido diventano HintRejected", async () => {
  const refused = createHintAgent({ client: fakeClient("{}", { stop_reason: "refusal" }), systemPrompt: "p" });
  await assert.rejects(refused.hint(ctx), HintRejected);
  const broken = createHintAgent({ client: fakeClient("non è json"), systemPrompt: "p" });
  await assert.rejects(broken.hint(ctx), HintRejected);
});

test("TVB_AI=off forza i suggerimenti a regole", () => {
  assert.equal(aiConfigured({ TVB_AI: "off", ANTHROPIC_API_KEY: "x" }), false);
  assert.equal(aiConfigured({ ANTHROPIC_API_KEY: "x" }), true);
});

test("regole: pulsante disattivato → indica il campo obbligatorio mancante", () => {
  const h = fallbackHint(ctx);
  assert.equal(h.source, "regole");
  assert.equal(h.target_ref, "r7");
  assert.match(h.hint, /^«Conferma prenotazione» si attiva solo dopo che spunti la casella «Dichiaro di aver preso visione dell'informativa…»\.$/);
  // anche i suggerimenti a regole passano i controlli di fedeltà
  assert.doesNotThrow(() => validateHint(h, ctx));
});

test("regole: giorno senza disponibilità → indica «Mese successivo»", () => {
  const cal = {
    signal: { type: "dead_click", detail: {} },
    page: { heading: "Scegli data e sede", step: "Data e sede" },
    target: { ref: "d12", kind: "pulsante", label: "12 ottobre: nessuna disponibilità", disabled: true },
    missing: [],
    candidates: [
      { ref: "s1", kind: "menu", label: "Sede", required: true, filled: true },
      { ref: "n1", kind: "pulsante", label: "Mese successivo" },
      { ref: "d12", kind: "pulsante", label: "12 ottobre: nessuna disponibilità", disabled: true },
      { ref: "a3", kind: "pulsante", label: "Avanti", disabled: true },
    ],
    texts: [],
  };
  const h = fallbackHint(cal);
  assert.equal(h.target_ref, "n1");
  assert.match(h.hint, /«Mese successivo»/);
});

test("regole: errore sul codice fiscale → spiega il formato", () => {
  const cf = {
    signal: { type: "field_error", detail: { count: 1, message: "Valore non conforme (ERR_CF_016)" } },
    page: { heading: "Dati del richiedente", step: "Dati del richiedente" },
    target: { ref: "cf", kind: "campo", label: "Codice fiscale *", required: true, filled: true, error: "Valore non conforme (ERR_CF_016)" },
    missing: [],
    candidates: [{ ref: "cf", kind: "campo", label: "Codice fiscale *" }],
    texts: [],
  };
  const h = fallbackHint(cf);
  assert.match(h.hint, /16 caratteri/);
  assert.equal(h.original_quote, "Valore non conforme (ERR_CF_016)");
});

test("regole: rientro dopo una distrazione → dove eri e cosa manca", () => {
  const back = {
    ...ctx,
    signal: { type: "return_after_away", detail: { awayMs: 30000 } },
    target: null,
  };
  const h = fallbackHint(back);
  assert.equal(h.hint, "Eccoti di nuovo! Eri a «Riepilogo». Ora spunta la casella «Dichiaro di aver preso visione dell'informativa…».");
  assert.equal(h.target_ref, "r7");
});
