// Agente "Spiegami questa comunicazione" e controllo dei fatti.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createExplainAgent, validateExplanation, loadSystemPrompt, ExplanationRejected, EXPLAIN_SCHEMA, aiConfigured,
} from "../server/agent.mjs";
import { unsupportedFacts, extractFacts, normalizeText } from "../public/lib/facts.js";
import { NOTICES, noticeById, noticeText } from "../public/lib/data.js";

const uscita = noticeById("n-uscita");
const original = noticeText(uscita);

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

// ---------------------------------------------------------------- fatti
test("fatti: cifre arabe, orari con punto o due punti e mesi in tre lingue", () => {
  const f = extractFacts("يوم الثلاثاء ٢٠ أكتوبر 2026 الساعة ٨:٠٠");
  assert.ok(f.numbers.has("20") && f.numbers.has("2026"));
  assert.ok(f.pairs.has("8:00"));
  assert.ok(f.months.has(10));
  assert.ok(f.dayMonths.has("20-10"));
  assert.ok(f.weekdays.has(2));
  assert.ok(extractFacts("ore 8.00").pairs.has("8:00"));
  assert.ok(extractFacts("October 20, 2026").dayMonths.has("20-10"));
  assert.equal(normalizeText("إبريل"), "ابريل");
});

test("fatti: accetta una spiegazione con le stesse date e gli stessi orari", () => {
  assert.deepEqual(unsupportedFacts("Il 20 ottobre 2026, ritrovo alle 8:00, rientro alle 13.30, costo 12 euro.", original), []);
  assert.deepEqual(unsupportedFacts("يوم الثلاثاء ٢٠ أكتوبر ٢٠٢٦ الساعة 8:00", original), []);
});

test("fatti: scarta un giorno cambiato, un orario cambiato, un importo inventato", () => {
  assert.ok(unsupportedFacts("La gita è il 21 ottobre 2026.", original).length > 0);
  assert.ok(unsupportedFacts("Meet at 8:30.", original).some((p) => p.includes("8:30")));
  assert.ok(unsupportedFacts("It costs 15 euros.", original).some((p) => p.includes("15")));
  assert.ok(unsupportedFacts("La gita è il 14 ottobre.", original).length === 0, "14 ottobre è nell'originale (scadenza)");
});

test("fatti: scarta un mese sbagliato e un giorno della settimana sbagliato", () => {
  assert.ok(unsupportedFacts("The trip is on 20 November 2026.", original).some((p) => p.startsWith("mese")));
  assert.ok(unsupportedFacts("On Wednesday 20 October 2026.", original).length > 0, "il 20 è martedì");
  assert.ok(unsupportedFacts("الرحلة يوم الأحد", original).length > 0);
});

test("fatti: «may» in inglese non è un mese; una data numerica deve coincidere", () => {
  assert.deepEqual(unsupportedFacts("Lessons may end earlier.", noticeText(noticeById("n-sciopero"))), []);
  assert.deepEqual(unsupportedFacts("Pubblicata il 06/10/2026.", original), []);
  assert.ok(unsupportedFacts("Entro il 15/10/2026.", original).length > 0);
});

// ---------------------------------------------------------------- spiegazioni già pronte
test("ogni spiegazione già pronta, in ogni lingua, passa gli stessi controlli dell'AI", () => {
  for (const n of NOTICES) {
    for (const lang of ["it", "ar", "en"]) {
      const out = validateExplanation(n.explanations[lang], n, lang);
      assert.equal(out.quotes.length, n.explanations[lang].quotes.length, `${n.id}/${lang}: citazioni copiate dall'originale`);
    }
  }
});

// ---------------------------------------------------------------- validatore
const good = {
  explanation: "On Tuesday 20 October 2026 Youssef's class goes to the museum. Meet at 8:00.",
  what_to_do: "By Wednesday 14 October 2026 press «Presa visione».",
  quotes: ["uscita didattica", "parola inventata"],
};

test("validatore: accetta una spiegazione fedele e toglie le citazioni non copiate", () => {
  const out = validateExplanation(good, uscita, "en");
  assert.deepEqual(out.quotes, ["uscita didattica"]);
});

test("validatore: scarta date inventate, parole tra «» che non esistono e la lingua sbagliata", () => {
  const reject = (raw, lang, re) => assert.throws(() => validateExplanation(raw, uscita, lang),
    (e) => e instanceof ExplanationRejected && re.test(e.reason));
  reject({ ...good, what_to_do: "By 16 October 2026." }, "en", /non presenti/);
  reject({ ...good, what_to_do: "Press «Invia adesione»." }, "en", /Invia adesione/);
  reject(good, "ar", /arabo/);
  reject({ ...good, explanation: "" }, "en", /vuota/);
  reject({ ...good, explanation: "x".repeat(800) }, "en", /lunga/);
});

// ---------------------------------------------------------------- chiamata a Claude
test("il system prompt viene letto da agents/prompts senza il commento iniziale", () => {
  const p = loadSystemPrompt();
  assert.ok(p.startsWith("Sei \"Registro amico\""));
  assert.ok(!p.includes("<!--"));
});

test("richiesta: modello, structured output, effort basso, fallback lato server", async () => {
  const ar = NOTICES[0].explanations.ar;
  const client = fakeClient(ar);
  const agent = createExplainAgent({ client, systemPrompt: "prompt" });
  const out = await agent.explain(uscita, "ar");
  const req = client.calls[0];
  assert.equal(req.model, "claude-opus-5-5");
  assert.deepEqual(req.betas, ["server-side-fallback-2026-07-01"]);
  assert.equal(req.fallbacks, "default");
  assert.equal(req.output_config.effort, "low");
  assert.deepEqual(req.output_config.format, { type: "json_schema", schema: EXPLAIN_SCHEMA });
  const sent = JSON.parse(req.messages[0].content);
  assert.equal(sent.language, "ar");
  assert.equal(sent.notice.title, uscita.title);
  assert.equal(out.source, "ai");
  assert.equal(out.explanation, ar.explanation);
});

test("rifiuto, risposta troncata e JSON non valido diventano errori gestiti", async () => {
  const cases = [
    [fakeClient(good, { stop_reason: "refusal" }), /rifiutata/],
    [fakeClient(good, { stop_reason: "max_tokens" }), /troncata/],
    [fakeClient("non è json"), /JSON/],
  ];
  for (const [client, re] of cases) {
    const agent = createExplainAgent({ client, systemPrompt: "p" });
    await assert.rejects(agent.explain(uscita, "en"), (e) => e instanceof ExplanationRejected && re.test(e.reason));
  }
});

test("AI attiva solo con credenziali, e spegnibile con RA_AI=off", () => {
  assert.equal(aiConfigured({ ANTHROPIC_API_KEY: "sk-x", RA_AI: "off" }), false);
  assert.equal(aiConfigured({ ANTHROPIC_API_KEY: "sk-x" }), true);
});
