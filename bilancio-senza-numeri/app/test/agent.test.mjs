import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createSpendAgent, validateInterpretation, loadSystemPrompt, SpendRejected, SPEND_SCHEMA, aiConfigured, buildUserMessage, unitsFromRequest,
} from "../server/agent.mjs";

const units = unitsFromRequest([{ id: "caffe" }, { id: "pizza" }, { id: "pranzo" }, { id: "spesa" }]);
const item = (o) => ({ unit_id: "caffe", count: 1, amount_text: "", per_piece: false, quote: "", ...o });

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
  assert.ok(p.startsWith("Sei l'interprete delle spese"));
  assert.ok(!p.includes("<!--"));
  assert.match(p, /Non fare calcoli/);
});

test("richiesta: modello, structured output, effort basso, fallback lato server, niente prezzi al modello", async () => {
  const text = "due caffè e un panino";
  const client = fakeClient({ items: [item({ count: 2, quote: "due caffè" }), item({ unit_id: "panino", quote: "un panino" })], not_understood: "" });
  const agent = createSpendAgent({ client, systemPrompt: "prompt" });
  const out = await agent.interpret(text, units);
  const req = client.calls[0];
  assert.equal(req.model, "claude-opus-5-5");
  assert.deepEqual(req.betas, ["server-side-fallback-2026-07-01"]);
  assert.equal(req.fallbacks, "default");
  assert.equal(req.output_config.effort, "low");
  assert.deepEqual(req.output_config.format, { type: "json_schema", schema: SPEND_SCHEMA });
  assert.doesNotMatch(req.messages[0].content, /cents|€|"prezzo"/, "il modello non riceve prezzi: non può fare conti");
  assert.equal(out.source, "ai");
  assert.equal(out.totalCents, 240 + 500, "il totale lo calcola il codice");
  assert.deepEqual(out.items.map((i) => i.priced), ["oggetto", "oggetto"]);
});

test("importo scritto dalla persona: accettato e letto dal codice", () => {
  const out = validateInterpretation({ items: [item({ unit_id: "spesa", amount_text: "circa 30 euro", quote: "ho fatto la spesa" })], not_understood: "" }, "ho fatto la spesa, circa 30 euro", units);
  assert.deepEqual(out.items, [{ unitId: "spesa", count: 1, cents: 3000, priced: "testo" }]);
  const each = validateInterpretation({ items: [item({ count: 3, amount_text: "1,50", per_piece: true, quote: "tre caffè" })], not_understood: "" }, "tre caffè da 1,50", units);
  assert.equal(each.totalCents, 450);
});

test("scarta un importo che non compare nel testo (anche se è un pezzo di un numero vero)", () => {
  const text = "ho fatto la spesa, circa 30 euro";
  for (const amount_text of ["35 euro", "3", "300"]) {
    assert.throws(
      () => validateInterpretation({ items: [item({ unit_id: "spesa", amount_text, quote: "ho fatto la spesa" })], not_understood: "" }, text, units),
      (e) => e instanceof SpendRejected && /non compare nel testo/.test(e.reason),
      amount_text,
    );
  }
});

test("scarta oggetti sconosciuti, «altro» senza importo, quantità inventate e citazioni false", () => {
  const text = "un caffè al bar";
  const bad = [
    [item({ unit_id: "yacht", quote: "un caffè" }), /oggetto sconosciuto/],
    [item({ unit_id: "altro", quote: "un caffè" }), /senza importo/],
    [item({ count: 4, quote: "un caffè" }), /quantità 4 non compare/],
    [item({ count: 0, quote: "un caffè" }), /quantità non valida/],
    [item({ quote: "due cappuccini" }), /citazione/],
  ];
  for (const [it, re] of bad) {
    assert.throws(() => validateInterpretation({ items: [it], not_understood: "" }, text, units), (e) => e instanceof SpendRejected && re.test(e.reason));
  }
  assert.throws(() => validateInterpretation({ items: [], not_understood: "" }, text, units), SpendRejected);
  assert.throws(() => validateInterpretation({ foo: 1 }, text, units), SpendRejected);
});

test("«non capito»: tenuto solo se è davvero un pezzo del testo", () => {
  const text = "un caffè e poi il parcheggio";
  const ok = validateInterpretation({ items: [item({ quote: "un caffè" })], not_understood: "il parcheggio" }, text, units);
  assert.equal(ok.notUnderstood, "il parcheggio");
  const no = validateInterpretation({ items: [item({ quote: "un caffè" })], not_understood: "ha speso troppo" }, text, units);
  assert.equal(no.notUnderstood, "");
});

test("rifiuto, risposta troncata e JSON rotto non arrivano mai alla persona", async () => {
  const cases = [
    [fakeClient("{}", { stop_reason: "refusal" }), /rifiutata/],
    [fakeClient("{}", { stop_reason: "max_tokens" }), /troncata/],
    [fakeClient("non è json"), /JSON non valido/],
  ];
  for (const [client, re] of cases) {
    const agent = createSpendAgent({ client, systemPrompt: "p" });
    await assert.rejects(agent.interpret("un caffè", units), (e) => e instanceof SpendRejected && re.test(e.reason));
  }
});

test("configurazione: senza chiave niente AI, BSN_AI=off la spegne; il messaggio porta solo id e parole", () => {
  assert.equal(aiConfigured({ ANTHROPIC_API_KEY: "x", BSN_AI: "off" }), false);
  assert.equal(aiConfigured({ ANTHROPIC_API_KEY: "x" }), true);
  const msg = JSON.parse(buildUserMessage("due caffè", units));
  assert.equal(msg.testo, "due caffè");
  assert.deepEqual(Object.keys(msg.oggetti[0]).sort(), ["id", "nome", "parole"]);
  assert.equal(unitsFromRequest([{ id: "caffe", cents: 150 }, { id: "<script>" }]).find((u) => u.id === "caffe").cents, 150);
});

test("«un paio di caffè» con count 2 è accettato; un totale «altro» con la frase intera pure", () => {
  const two = validateInterpretation({ items: [item({ count: 2, quote: "un paio di caffè" })], not_understood: "" }, "un paio di caffè", units);
  assert.equal(two.totalCents, 240);
  const text = "due caffè e un panino, 8 euro in tutto";
  const tot = validateInterpretation({ items: [item({ unit_id: "altro", amount_text: "8 euro", quote: text })], not_understood: "" }, text, units);
  assert.deepEqual(tot.items, [{ unitId: "altro", count: 1, cents: 800, priced: "testo" }]);
});
