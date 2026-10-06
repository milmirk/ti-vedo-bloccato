import { test } from "node:test";
import assert from "node:assert/strict";
import { SAMPLES, sampleById } from "../public/lib/samples.js";
import { parseSecci, toCredit } from "../public/lib/parser.js";
import { analyze, computeTaeg, roundTo } from "../public/lib/finance.js";

const load = (id) => {
  const parsed = parseSecci(sampleById(id).text);
  const { credit, declared } = toCredit(parsed);
  return { parsed, credit, declared, a: analyze(credit, declared) };
};

test("esempio 1 (tasso zero): il TAEG scritto è uguale a quello calcolato dai flussi", () => {
  const { declared, a } = load("lavatrice-tasso-zero");
  assert.equal(declared.tan, 0);
  assert.equal(declared.taeg, 14.19);
  assert.equal(roundTo(a.taeg, 2), declared.taeg);
  assert.equal(a.totalDue, 636);
  assert.equal(a.totalCost, 36);
  assert.equal(a.interestTotal, 0, "a tasso zero gli interessi sono zero…");
  assert.equal(a.feesTotal, 36, "…ma le spese no");
  assert.ok(a.checks.every((c) => c.match));
});

test("esempio 2 (prestito personale): TAEG e totale dovuto coincidono con il calcolo", () => {
  const { declared, a } = load("prestito-personale");
  assert.equal(declared.taeg, 11.28);
  assert.equal(roundTo(a.taeg, 2), declared.taeg);
  assert.equal(a.installments.amount, 124.19);
  assert.equal(a.totalDue, 6145.62);
  assert.equal(a.totalCost, 1145.62);
  assert.equal(a.upfront, 112.5, "istruttoria e imposta sostitutiva si pagano alla firma");
  assert.ok(a.checks.every((c) => c.match));
});

test("esempio 3: il controllo trova il TAEG che non torna, e il totale che invece torna", () => {
  const { credit, declared, a } = load("lavatrice-16-rate");
  const taeg = a.checks.find((c) => c.key === "taeg");
  assert.equal(taeg.match, false);
  assert.equal(taeg.declared, 6.08);
  assert.equal(taeg.computed, 17.19);
  assert.equal(a.checks.find((c) => c.key === "totalDue").match, true);
  // Il valore scritto è il calcolo fatto senza spese.
  assert.equal(roundTo(computeTaeg({ ...credit, fees: [] }), 2), declared.taeg);
});

test("tutti gli esempi hanno i dati che servono e un finanziatore di fantasia", () => {
  assert.equal(SAMPLES.length, 3);
  for (const s of SAMPLES) {
    const p = parseSecci(s.text);
    assert.deepEqual(p.missing, [], s.id);
    assert.ok(p.complete && p.isSecci);
    assert.match(s.text, /\.example\b/, "contatti su domini di esempio");
    assert.match(s.text, /^INFORMAZIONI EUROPEE DI BASE SUL CREDITO AI CONSUMATORI/);
  }
});
