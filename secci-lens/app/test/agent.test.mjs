import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createAgent, validateExplanation, validateExtraction, loadPrompt, prepare, aiConfigured,
  AgentRejected, InputError, EXTRACT_SCHEMA, EXPLAIN_SCHEMA,
} from "../server/agent.mjs";
import { sampleById } from "../public/lib/samples.js";

const S1 = sampleById("lavatrice-tasso-zero").text;

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
const agentWith = (payload, extra) => {
  const client = fakeClient(payload, extra);
  return { client, agent: createAgent({ client, extractPrompt: "p", explainPrompt: "p" }) };
};

const GOOD = {
  items: [
    { quote: "Tasso fisso. TAN (tasso annuo nominale): 0,00%", plain: "Non paghi interessi: il TAN è 0,00%. Le spese però ci sono, in tutto 36,00 €." },
    { quote: "Spese di incasso rata: 1,00 € per ogni rata", plain: "Ogni volta che paghi una rata, paghi anche 1,00 € di spese di incasso." },
  ],
};

test("i prompt vengono letti da agents/prompts senza il commento iniziale", () => {
  for (const name of ["extract-agent.md", "explain-agent.md"]) {
    const p = loadPrompt(name);
    assert.ok(p.startsWith("Sei "), name);
    assert.ok(!p.includes("<!--"), name);
  }
});

test("richiesta: modello, structured output, effort basso, fallback lato server", async () => {
  const { client, agent } = agentWith(GOOD);
  const out = await agent.explain(S1);
  const req = client.calls[0];
  assert.equal(req.model, "claude-opus-5-5");
  assert.deepEqual(req.betas, ["server-side-fallback-2026-07-01"]);
  assert.equal(req.fallbacks, "default");
  assert.equal(req.output_config.effort, "low");
  assert.deepEqual(req.output_config.format, { type: "json_schema", schema: EXPLAIN_SCHEMA });
  const sent = JSON.parse(req.messages[0].content);
  assert.equal(sent.dati.costo_totale_del_credito, "36,00 €", "i numeri li calcola il codice e li passa già pronti");
  assert.equal(out.items.length, 2);
  assert.equal(out.source, "ai");
});

test("spiegazione: una frase con un numero inventato viene scartata, le altre restano", () => {
  const { analysis, text } = prepare(S1);
  const out = validateExplanation({
    items: [...GOOD.items, { quote: "Durata del contratto di credito: 10 mesi", plain: "Il contratto dura 10 mesi e costa 42,00 € in tutto." }],
  }, { text, analysis });
  assert.equal(out.items.length, 2);
  assert.match(out.dropped[0].reason, /42,00/);
});

test("spiegazione: una frase che consiglia fa scartare tutta la risposta", () => {
  const { analysis, text } = prepare(S1);
  assert.throws(
    () => validateExplanation({ items: [...GOOD.items, { quote: "TAEG: 14,19%", plain: "Con un TAEG di 14,19% ti conviene pagare in contanti." }] }, { text, analysis }),
    (e) => e instanceof AgentRejected && /consiglio/.test(e.reason),
  );
});

test("spiegazione: la frase originale deve comparire nel documento", () => {
  const { analysis, text } = prepare(S1);
  assert.throws(
    () => validateExplanation({ items: [{ quote: "Il finanziamento è gratuito.", plain: "Non paghi nulla in più." }] }, { text, analysis }),
    AgentRejected,
  );
});

test("estrazione: le citazioni passano dal controllo, il risultato grezzo resta da rivalidare", async () => {
  const doc = "Preventivo Aurora Credito\nTi finanziamo 900 euro.\nPagherai 18 rate mensili da 52,50 euro.\n";
  const payload = {
    fields: {
      lender: { quote: "Preventivo Aurora Credito", value_text: "Aurora Credito" },
      creditAmount: { quote: "Ti finanziamo 900 euro.", value_text: "900 euro" },
      duration: { quote: "", value_text: "" },
      installments: { quote: "Pagherai 18 rate mensili da 52,50 euro.", count_text: "18", amount_text: "52,50 euro" },
      totalDue: { quote: "", value_text: "" },
      tan: { quote: "", value_text: "" },
      taeg: { quote: "", value_text: "" },
    },
    fees: [],
  };
  const { client, agent } = agentWith(payload);
  const out = await agent.extract(doc);
  assert.deepEqual(client.calls[0].output_config.format.schema, EXTRACT_SCHEMA);
  assert.deepEqual(out.found.sort(), ["creditAmount", "installments", "lender"]);
  assert.throws(() => validateExtraction(doc, { fields: { creditAmount: { quote: "Ti regaliamo 900 euro.", value_text: "900 euro" } }, fees: [] }), AgentRejected);
});

test("rifiuto del modello, risposta troncata e JSON non valido diventano AgentRejected", async () => {
  await assert.rejects(agentWith("{}", { stop_reason: "refusal" }).agent.explain(S1), AgentRejected);
  await assert.rejects(agentWith("{}", { stop_reason: "max_tokens" }).agent.explain(S1), AgentRejected);
  await assert.rejects(agentWith("non è json").agent.explain(S1), AgentRejected);
});

test("senza i dati minimi non si chiama nemmeno l'AI", async () => {
  const { client, agent } = agentWith(GOOD);
  await assert.rejects(agent.explain("Ciao, un preventivo qualsiasi."), InputError);
  assert.equal(client.calls.length, 0);
});

test("SECCI_AI=off forza le regole anche con la chiave", () => {
  assert.equal(aiConfigured({ SECCI_AI: "off", ANTHROPIC_API_KEY: "x" }), false);
  assert.equal(aiConfigured({ ANTHROPIC_API_KEY: "x" }), true);
});
