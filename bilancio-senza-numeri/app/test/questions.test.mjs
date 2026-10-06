import { test } from "node:test";
import assert from "node:assert/strict";
import { makeQuestion, evaluateAnswer, nearCombos, feedbackText, approxPhrase } from "../public/lib/questions.js";
import { resolveUnits } from "../public/lib/units.js";
import { dailyPlan } from "../public/lib/budget.js";
import { buildView } from "../public/lib/view.js";
import { marcoDemo } from "../public/lib/demo.js";
import { LADDER } from "../public/lib/adapt.js";

const TODAY = "2026-10-06";
const units = resolveUnits([{ id: "caffe" }, { id: "pizza" }, { id: "pranzo" }, { id: "spesa" }]);

/** Ricalcola la risposta giusta da zero, indipendentemente dal generatore. */
function expected(q, plan) {
  if (q.kind === "basta") return q.costCents <= plan.remaining ? "si" : "no";
  if (q.kind === "oggi") return q.costCents <= plan.todayLeft ? "si" : "no";
  if (q.kind === "dopo") return plan.remaining - q.itemCents >= q.costCents ? "si" : "no";
  throw new Error(q.kind);
}

test("la domanda dell'esempio di Marco ha la risposta giusta calcolata dai suoi dati", () => {
  const s = marcoDemo(TODAY);
  const v = buildView(s, TODAY);
  const q = makeQuestion({ plan: v.plan, units: v.repUnits, todayISO: TODAY, rep: "grandi", index: 0 });
  assert.equal(q.kind, "basta");
  assert.equal(q.text, "Se prima di sabato diciassette ottobre prendi sei spese piccole, bastano i soldi che ti restano?");
  assert.equal(q.answer, "no"); // 150 € contro 137,80 €
  assert.equal(q.fact, "Non bastano: mancherebbero soldi per circa un pranzo fuori.");
  assert.equal(feedbackText(q, "giusta"), "Esatto, la risposta è no. Non bastano: mancherebbero soldi per circa un pranzo fuori.");
  assert.equal(feedbackText(q, "nonso"), "Nessun problema. La risposta è no. Non bastano: mancherebbero soldi per circa un pranzo fuori.");
});

test("in centinaia di situazioni la risposta giusta è sempre coerente con i dati", () => {
  let checked = 0;
  for (const remaining of [500, 1300, 4000, 9000, 13780, 25000, 60000]) {
    for (const spentToday of [0, 300, 2000]) {
      for (const days of [2, 3, 7, 15]) {
        const s = { setup: { startCents: remaining + spentToday, paydayISO: "2026-10-" + String(6 + days).padStart(2, "0") }, spends: spentToday ? [{ day: TODAY, cents: spentToday }] : [] };
        const plan = dailyPlan(s, TODAY);
        for (const rep of LADDER) {
          for (let index = 0; index < 4; index++) {
            const q = makeQuestion({ plan, units, todayISO: TODAY, rep, index });
            if (!q) continue;
            checked++;
            assert.equal(q.answer, expected(q, plan), `${q.kind}: ${q.text}`);
            assert.ok(q.combo.count >= 1 && q.combo.count <= 6, "mai più di sei oggetti in una domanda");
          }
        }
      }
    }
  }
  assert.ok(checked > 200, `domande controllate: ${checked}`);
});

test("niente tranelli: il costo non è mai a pochi centesimi dalla soglia", () => {
  for (const target of [500, 1263, 4000, 13780]) {
    for (const wantYes of [true, false]) {
      for (const c of nearCombos(target, units, wantYes)) {
        assert.ok(Math.abs(c.cents - target) >= 120, `${c.count}×${c.unit.id} contro ${target}`);
        assert.equal(c.cents <= target, wantYes);
      }
    }
  }
});

test("la stessa situazione dà la stessa domanda (seme deterministico)", () => {
  const plan = dailyPlan(marcoDemo(TODAY), TODAY);
  const a = makeQuestion({ plan, units, todayISO: TODAY, rep: "giorni", index: 2 });
  const b = makeQuestion({ plan, units, todayISO: TODAY, rep: "giorni", index: 2 });
  assert.deepEqual(a, b);
  assert.equal(a.rep, "giorni");
});

test("con le rappresentazioni concrete si chiede soprattutto della parte di oggi", () => {
  const plan = dailyPlan(marcoDemo(TODAY), TODAY);
  assert.equal(makeQuestion({ plan, units, todayISO: TODAY, rep: "oggi", index: 0 }).kind, "oggi");
  assert.equal(makeQuestion({ plan, units, todayISO: TODAY, rep: "giorni", index: 0 }).kind, "oggi");
});

test("nessuna domanda quando non ha senso farla", () => {
  const ended = dailyPlan({ setup: { startCents: 5000, paydayISO: TODAY }, spends: [] }, TODAY);
  assert.equal(makeQuestion({ plan: ended, units, todayISO: TODAY, rep: "grandi" }), null);
  const empty = dailyPlan({ setup: { startCents: 50, paydayISO: "2026-10-10" }, spends: [] }, TODAY);
  assert.equal(makeQuestion({ plan: empty, units, todayISO: TODAY, rep: "grandi" }), null);
});

test("valutazione della risposta e riscontro senza giudizi", () => {
  const q = { answer: "no", fact: "Non bastano: mancherebbero soldi per circa un pranzo fuori." };
  assert.equal(evaluateAnswer(q, "no"), "giusta");
  assert.equal(evaluateAnswer(q, "si"), "sbagliata");
  assert.equal(evaluateAnswer(q, "nonso"), "nonso");
  assert.throws(() => evaluateAnswer(q, "forse"));
  for (const o of ["giusta", "sbagliata", "nonso"]) {
    const t = feedbackText(q, o);
    assert.ok(t.endsWith(q.fact));
    assert.doesNotMatch(t, /sbagliat|dovresti|errore|attenzione/i, "mai colpevolizzare o fare la morale");
  }
  assert.equal(approxPhrase(0, units), "niente");
  assert.equal(approxPhrase(100, units), "solo qualche spicciolo");
});

test("il verbo si accorda con gli oggetti: «resta un caffè», «restano due pizze»", () => {
  const caffeEPizza = units.slice(0, 2); // caffè, pizza
  const plan = { remaining: 1000, todayLeft: 1000, paydayISO: "2026-10-10", daysLeft: 4, ended: false };
  const all = [];
  for (let index = 0; index < 12; index++) {
    for (const rep of LADDER) {
      const q = makeQuestion({ plan, units: caffeEPizza, todayISO: TODAY, rep, index, seed: index * 7 + 1 });
      if (q) all.push(q.text, q.fact);
    }
  }
  assert.ok(all.length > 0);
  for (const t of all) {
    assert.doesNotMatch(t, /restano (un|una) [a-zà-ù ]+[?.]/, t);
    assert.doesNotMatch(t, /resta (due|tre|quattro|cinque|sei) /, t);
    assert.doesNotMatch(t, /resterebbe ancora circa (due|tre|quattro|cinque|sei) /, t);
  }
});
