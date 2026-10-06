import { test } from "node:test";
import assert from "node:assert/strict";
import { SAMPLES } from "../public/lib/samples.js";
import { parseSecci, toCredit } from "../public/lib/parser.js";
import { analyze, formatEuro } from "../public/lib/finance.js";
import { compareOffers, everyday, countPhrase, UNITS, buildQuiz, scoreQuiz, rataInfo } from "../public/lib/explain.js";
import { findRanking, findAdvice } from "../public/lib/guards.js";

const offers = SAMPLES.map((s) => {
  const parsed = parseSecci(s.text);
  const { credit, declared } = toCredit(parsed);
  return { id: s.id, name: s.lender, parsed, analysis: analyze(credit, declared), declaredTaeg: parsed.fields.taeg?.value };
});
const byId = (id) => offers.find((o) => o.id === id);
const unit = (id) => UNITS.find((u) => u.id === id);

test("confronto: per ogni coppia di offerte, nessuna parola da classifica o consiglio", () => {
  for (const a of offers) {
    for (const b of offers) {
      if (a === b) continue;
      const cmp = compareOffers(a, b);
      const all = [...cmp.facts, cmp.note, ...cmp.rows.flatMap((r) => [r.label, r.a, r.b])];
      for (const t of all) {
        assert.equal(findRanking(t), null, `${a.id} vs ${b.id}: «${t}»`);
        assert.equal(findAdvice(t), null, `${a.id} vs ${b.id}: «${t}»`);
      }
    }
  }
});

test("confronto tra le due lavatrici: solo fatti, con le differenze giuste", () => {
  const cmp = compareOffers(byId("lavatrice-tasso-zero"), byId("lavatrice-16-rate"));
  assert.ok(cmp.facts.includes("Il credito di Faro Finanziaria costa 31,44 € in più di quello di Aurora Credito."));
  assert.ok(cmp.facts.includes("L'offerta di Faro Finanziaria dura 6 mesi in più di quella di Aurora Credito."));
  assert.ok(cmp.facts.includes("La rata di Faro Finanziaria è di 20,91 € più bassa di quella di Aurora Credito (spese escluse)."));
  assert.ok(cmp.facts.some((f) => /TAEG scritto nel documento \(6,08%\) è diverso/.test(f)), "segnala anche il TAEG che non torna");
  // Simmetria: invertendo A e B cambia solo il verso.
  const inv = compareOffers(byId("lavatrice-16-rate"), byId("lavatrice-tasso-zero"));
  assert.ok(inv.facts.includes("Il credito di Aurora Credito costa 31,44 € in meno di quello di Faro Finanziaria."));
});

test("confronto tra somme diverse: lo dice prima di tutto", () => {
  const cmp = compareOffers(byId("lavatrice-tasso-zero"), byId("prestito-personale"));
  assert.match(cmp.facts[0], /non riguardano la stessa somma \(600,00 € e 5\.000,00 €\)/);
});

test("il costo in cose di tutti i giorni", () => {
  const cost = byId("lavatrice-tasso-zero").analysis.totalCost;
  assert.equal(everyday(cost, unit("caffe")).phrase, "30 caffè al bar");
  assert.equal(everyday(cost, unit("pizza")).phrase, "4 pizze e mezza");
  assert.equal(everyday(cost, unit("pieno")).phrase, "mezzo pieno di benzina");
  assert.equal(countPhrase(1, unit("pizza")), "1 pizza");
  assert.equal(countPhrase(0.1, unit("spesa")), "meno di una spesa piccola");
  const big = everyday(byId("prestito-personale").analysis.totalCost, unit("caffe"));
  assert.equal(big.per, 10, "oltre 100 simboli, ogni simbolo vale 10");
  assert.equal(big.phrase, "circa 955 caffè al bar");
  assert.equal(everyday(cost, { ...unit("caffe"), price: 0 }), null);
});

test("prima rata e rata normale, spese comprese", () => {
  assert.deepEqual(rataInfo(byId("lavatrice-tasso-zero").analysis), { first: 87, regular: 61, differs: true });
  assert.deepEqual(rataInfo(byId("prestito-personale").analysis), { first: 125.69, regular: 125.69, differs: false });
});

test("quiz: domande sui numeri del documento, risposte giuste coerenti con i calcoli", () => {
  for (const o of offers) {
    const quiz = buildQuiz(o.parsed, o.analysis);
    assert.equal(quiz.length, 4, o.id);
    for (const q of quiz) assert.equal(new Set(q.options).size, q.options.length, "opzioni tutte diverse");
    const tot = quiz.find((q) => q.id === "totale");
    assert.equal(tot.options[tot.correct], formatEuro(o.analysis.totalDue));
    const cost = quiz.find((q) => q.id === "costo");
    assert.equal(cost.options[cost.correct], formatEuro(o.analysis.totalCost));
    assert.match(quiz.find((q) => q.id === "tan-taeg").options[1], /^Il TAEG/);
    const allRight = Object.fromEntries(quiz.map((q) => [q.id, q.correct]));
    assert.equal(scoreQuiz(quiz, allRight), 4);
    assert.equal(scoreQuiz(quiz, {}), 0);
  }
});
