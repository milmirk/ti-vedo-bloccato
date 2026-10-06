import { test } from "node:test";
import assert from "node:assert/strict";
import { findAdvice, findRanking, checkNumbers, allowedNumbers, numbersIn } from "../public/lib/guards.js";
import { SAMPLES } from "../public/lib/samples.js";
import { parseSecci, toCredit } from "../public/lib/parser.js";
import { analyze } from "../public/lib/finance.js";
import { plainSentences, coherenceMessage, buildQuiz, compareOffers, summaryLine, costParts } from "../public/lib/explain.js";

const models = SAMPLES.map((s) => {
  const parsed = parseSecci(s.text);
  const { credit, declared } = toCredit(parsed);
  return { s, parsed, analysis: analyze(credit, declared) };
});

test("il filtro dei consigli blocca le frasi che dicono cosa fare o cosa scegliere", () => {
  for (const t of [
    "Ti conviene firmare oggi.",
    "Ti consiglio la seconda offerta.",
    "È meglio un prestito più breve.",
    "Scegli l'offerta con la rata più bassa.",
    "Dovresti chiedere uno sconto.",
    "Questa è l'offerta migliore.",
    "Conviene pagare in contanti.",
    "Un affare: firma subito!",
    "Ti suggerisco di aspettare.",
  ]) {
    assert.ok(findAdvice(t), `dovrebbe bloccare: ${t}`);
  }
});

test("il filtro dei consigli lascia passare le spiegazioni neutre", () => {
  for (const t of [
    "Il TAEG è 14,19%: mette insieme interessi e spese.",
    "Puoi chiedere chiarimenti al finanziatore.",
    "In tutto restituisci 636,00 €.",
    "Il TAN è 0,00%, quindi non paghi interessi.",
  ]) {
    assert.equal(findAdvice(t), null, t);
  }
});

test("controllo dei numeri: ammette le varianti di formato, scarta i numeri inventati", () => {
  const { s, analysis } = models[0];
  const allowed = allowedNumbers(s.text, analysis);
  assert.equal(checkNumbers("In tutto restituisci 636,00 €, cioè 636 euro.", allowed).ok, true);
  assert.equal(checkNumbers("Il TAEG è 14,19% (circa 14,2%).", allowed).ok, true);
  assert.equal(checkNumbers("La prima rata è 87,00 € e il credito costa 36 €.", allowed).ok, true, "valori calcolati dal codice");
  const bad = checkNumbers("In tutto restituisci 640,00 € in 12 mesi.", allowed);
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.unknown, ["640,00"]);
  const big = allowedNumbers(models[1].s.text, models[1].analysis);
  assert.equal(checkNumbers("Il credito costa 1.145,62 € (1145,62 €).", big).ok, true);
  assert.deepEqual(numbersIn("Rate: 10. Totale 1.234,56 €").map((n) => n.raw), ["10", "1.234,56"]);
});

test("nessun testo a regole contiene consigli, per tutti e tre gli esempi", () => {
  for (const { parsed, analysis } of models) {
    const texts = [
      summaryLine(parsed, analysis),
      ...plainSentences(parsed, analysis).map((x) => x.plain),
      ...analysis.checks.map((c) => coherenceMessage(c).text),
      ...buildQuiz(parsed, analysis).flatMap((q) => [q.text, q.explain, ...q.options]),
      ...costParts(analysis).map((p) => p.note),
    ];
    for (const t of texts) assert.equal(findAdvice(t), null, t);
  }
});

test("i testi a regole usano solo numeri del documento o dei calcoli", () => {
  for (const { s, parsed, analysis } of models) {
    const allowed = allowedNumbers(s.text, analysis);
    for (const { plain } of plainSentences(parsed, analysis)) {
      assert.deepEqual(checkNumbers(plain, allowed).unknown, [], plain);
    }
  }
});

test("le frasi a regole citano sempre un brano vero del documento", () => {
  for (const { s, parsed, analysis } of models) {
    const items = plainSentences(parsed, analysis);
    assert.ok(items.length >= 8, `${s.id}: ${items.length} frasi`);
    for (const it of items) assert.ok(s.text.includes(it.quote), it.quote);
  }
});

test("messaggio di coerenza neutro, con la frase richiesta", () => {
  const m3 = models[2].analysis.checks.map(coherenceMessage).find((m) => m.name === "TAEG");
  assert.equal(m3.text, "Il TAEG calcolato dai dati del documento è 17,19%, il documento dice 6,08%. Puoi chiedere chiarimenti al finanziatore.");
  assert.equal(findRanking(m3.text), null);
});
