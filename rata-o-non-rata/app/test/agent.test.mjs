import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createExtractAgent, loadSystemPrompt, EXTRACT_SCHEMA, aiConfigured, ExtractionRejected,
} from "../server/agent.mjs";
import { verifyExtraction, containsAdvice } from "../public/lib/verify.js";
import { UNKNOWN_SAMPLE, SAMPLE_EMAILS } from "../public/lib/samples.js";
import { buildSchedule } from "../public/lib/schedule.js";

const f = (value = "", quote = "") => ({ value, quote });
// Quello che un modello potrebbe rispondere per l'email di PagaPoi (formato sconosciuto).
const good = {
  is_installment_plan: true,
  provider: f("PagaPoi", "Grazie da PagaPoi"),
  merchant: f("CasaDeco", "Abbiamo diviso la tua spesa da CasaDeco: 75,00 euro in tutto."),
  total: f("75,00 euro", "Abbiamo diviso la tua spesa da CasaDeco: 75,00 euro in tutto."),
  count: f("tre", "Paghi tre quote da 25,00 euro, una al mese."),
  installment_amount: f("25,00 euro", "Paghi tre quote da 25,00 euro, una al mese."),
  first_date: f("15 ottobre 2026", "Si comincia giovedì 15 ottobre 2026."),
  frequency: { kind: "mensile", quote: "una al mese" },
  late_fee: f(),
  note: "",
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
  assert.ok(p.startsWith("Sei il lettore di email"));
  assert.ok(!p.includes("<!--"));
  assert.match(p, /Copia, non calcolare/);
});

test("richiesta: modello, structured output, effort basso, fallback lato server", async () => {
  const client = fakeClient(good);
  const agent = createExtractAgent({ client, systemPrompt: "prompt" });
  const out = await agent.extract(UNKNOWN_SAMPLE);
  const req = client.calls[0];
  assert.equal(req.model, "claude-opus-5-5");
  assert.deepEqual(req.betas, ["server-side-fallback-2026-07-01"]);
  assert.equal(req.fallbacks, "default");
  assert.equal(req.output_config.effort, "low");
  assert.deepEqual(req.output_config.format, { type: "json_schema", schema: EXTRACT_SCHEMA });
  assert.equal(JSON.parse(req.messages[0].content).email, UNKNOWN_SAMPLE);
  assert.equal(out.source, "ai");
  assert.equal(out.status, "da_controllare");
  assert.equal(out.purchase.total, 7500);
  assert.equal(out.purchase.count, 3);
  assert.equal(out.purchase.firstDate, "2026-10-15");
  assert.deepEqual(out.rejected, []);
});

test("l'AI estrae, il codice calcola: il calendario viene da schedule.js", async () => {
  const out = await createExtractAgent({ client: fakeClient(good), systemPrompt: "p" }).extract(UNKNOWN_SAMPLE);
  assert.deepEqual(buildSchedule(out.purchase).map((i) => [i.date, i.amount]), [
    ["2026-10-15", 2500], ["2026-11-15", 2500], ["2026-12-15", 2500],
  ]);
  for (const src of Object.values(out.purchase.sources)) assert.ok(UNKNOWN_SAMPLE.includes(src), src);
});

test("validatore: un importo che non è nell'email viene scartato (il ciclo di controllo)", () => {
  const r = verifyExtraction({ ...good, total: f("98,90 €", "75,00 euro in tutto") }, UNKNOWN_SAMPLE);
  assert.equal(r.purchase.total, null);
  assert.equal(r.status, "incompleta");
  assert.deepEqual(r.missing, ["total"]);
  assert.equal(r.rejected[0].field, "total");
  assert.match(r.rejected[0].reason, /98,90.€ non compare nell'email/);
});

test("validatore: totale calcolato dall'AI (3 × 25) non accettato se non è scritto", () => {
  const text = "Da: PagaPoi\nPaghi tre quote da 25,00 euro, una al mese. Si comincia il 15 ottobre 2026.";
  const r = verifyExtraction({ ...good, total: f("75,00 €", "") }, text);
  assert.equal(r.purchase.total, null);
  assert.equal(r.rejected[0].field, "total");
});

test("validatore: varianti di scrittura ammesse (EUR 64.50 = 64,50 €, 2026-09-20 = 20 settembre 2026, 3 = tre)", () => {
  const email = SAMPLE_EMAILS.find((e) => e.id === "es-dividipay-librilab").text;
  const r = verifyExtraction({
    ...good,
    provider: f("DividiPay", ""), merchant: f("LibriLab", ""),
    total: f("64,50 €", ""), count: f("3", ""), installment_amount: f("21,50 €", ""),
    first_date: f("20 settembre 2026", ""), frequency: { kind: "ogni_30_giorni", quote: "" },
  }, email);
  assert.deepEqual(r.rejected, []);
  assert.equal(r.purchase.total, 6450);
  assert.equal(r.purchase.firstDate, "2026-09-20");
  assert.equal(r.purchase.sources.total, "Totale ordine: EUR 64.50");
});

test("validatore: data, numero di rate e frequenza inventati vengono scartati", () => {
  const r = verifyExtraction({
    ...good, count: f("4", ""), first_date: f("16 ottobre 2026", ""), frequency: { kind: "ogni_2_settimane", quote: "" },
  }, UNKNOWN_SAMPLE);
  assert.deepEqual(r.rejected.map((x) => x.field).sort(), ["count", "firstDate", "frequency"]);
  assert.deepEqual(r.missing.sort(), ["count", "firstDate", "frequency"]);
});

test("validatore: un consiglio fa scartare tutta la risposta", () => {
  for (const note of ["Ti conviene pagare in un'unica soluzione.", "Dovresti evitare altre rate.", "È meglio aspettare.", "Ti consiglio di controllare."]) {
    assert.throws(() => verifyExtraction({ ...good, note }, UNKNOWN_SAMPLE), ExtractionRejected, note);
  }
  assert.throws(() => verifyExtraction({ ...good, merchant: f("CasaDeco, ti conviene", "") }, UNKNOWN_SAMPLE), ExtractionRejected);
  assert.equal(containsAdvice("A novembre le rate sono il 34% di quello che entra."), null);
});

test("risposte del modello non utilizzabili: rifiuto, troncata, JSON rotto, non è un piano a rate", async () => {
  await assert.rejects(createExtractAgent({ client: fakeClient(good, { stop_reason: "refusal" }), systemPrompt: "p" }).extract("x"), ExtractionRejected);
  await assert.rejects(createExtractAgent({ client: fakeClient(good, { stop_reason: "max_tokens" }), systemPrompt: "p" }).extract("x"), ExtractionRejected);
  await assert.rejects(createExtractAgent({ client: fakeClient("{non json", {}), systemPrompt: "p" }).extract("x"), /JSON non valido/);
  await assert.rejects(createExtractAgent({ client: fakeClient({ ...good, is_installment_plan: false }), systemPrompt: "p" }).extract(UNKNOWN_SAMPLE), /non sembra la conferma/);
});

test("senza chiave l'AI resta spenta; RNR_AI=off la spegne sempre", () => {
  assert.equal(aiConfigured({ RNR_AI: "off", ANTHROPIC_API_KEY: "sk-ant-x" }), false);
  assert.equal(aiConfigured({ ANTHROPIC_API_KEY: "sk-ant-x" }), true);
});

test("validatore: la frase sulle penali deve essere copiata dall'email, non riassunta", () => {
  const email = SAMPLE_EMAILS.find((e) => e.id === "es-rateo-sneakerama").text;
  const copied = verifyExtraction({ ...good, late_fee: f("", "in caso di ritardo applichiamo una penale di € 5,00") }, email);
  assert.equal(copied.purchase.lateFee, "Ricorda: in caso di ritardo applichiamo una penale di € 5,00 per ogni rata non pagata.");
  const invented = verifyExtraction({ ...good, late_fee: f("", "Se paghi in ritardo paghi 5 euro in più.") }, email);
  assert.equal(invented.purchase.lateFee, null);
  assert.equal(invented.rejected.find((r) => r.field === "lateFee").reason, "la frase non compare nell'email");
});
