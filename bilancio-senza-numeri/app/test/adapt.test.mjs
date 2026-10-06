import { test } from "node:test";
import assert from "node:assert/strict";
import { decideAdaptation, answerPending, shouldAsk, postpone, chooseRepresentation, evidence, correctStreak, LADDER } from "../public/lib/adapt.js";
import { makeQuestion } from "../public/lib/questions.js";
import { recordSpend } from "../public/lib/budget.js";
import { buildView } from "../public/lib/view.js";
import { marcoDemo } from "../public/lib/demo.js";

const TODAY = "2026-10-06";
const c = (rep, outcome) => ({ rep, outcome });

test("risposta sbagliata o «Non so»: un gradino più concreto", () => {
  assert.deepEqual(decideAdaptation("grandi", [c("grandi", "sbagliata")]), { to: "piccoli", changed: true, reason: "sbagliata" });
  assert.deepEqual(decideAdaptation("piccoli", [c("grandi", "sbagliata"), c("piccoli", "nonso")]), { to: "giorni", changed: true, reason: "nonso" });
  assert.deepEqual(decideAdaptation("giorni", [c("giorni", "nonso")]), { to: "oggi", changed: true, reason: "nonso" });
});

test("all'ultimo gradino si resta lì; una risposta giusta non cambia nulla", () => {
  assert.equal(decideAdaptation("oggi", [c("oggi", "sbagliata")]).changed, false);
  assert.equal(decideAdaptation("oggi", [c("oggi", "sbagliata")]).reason, "gia-concreta");
  assert.deepEqual(decideAdaptation("grandi", [c("grandi", "giusta")]), { to: "grandi", changed: false, reason: "giusta" });
});

test("dopo tre risposte giuste di fila un singolo errore è tollerato", () => {
  const three = [c("giorni", "giusta"), c("giorni", "giusta"), c("giorni", "giusta")];
  assert.equal(decideAdaptation("giorni", three).reason, "funziona");
  assert.equal(correctStreak(three, "giorni"), 3);
  assert.deepEqual(decideAdaptation("giorni", [...three, c("giorni", "sbagliata")]), { to: "giorni", changed: false, reason: "tollerata" });
  // Le risposte giuste con un'altra rappresentazione non contano.
  const mixed = [c("grandi", "giusta"), c("grandi", "giusta"), c("piccoli", "giusta"), c("piccoli", "sbagliata")];
  assert.equal(decideAdaptation("piccoli", mixed).changed, true);
});

test("il ciclo completo: domanda, «Non so», la rappresentazione cambia e il cambio resta registrato", () => {
  let s = marcoDemo(TODAY);
  assert.equal(shouldAsk(s, TODAY), true, "prima domanda dopo le prime spese");
  const v = buildView(s, TODAY);
  s = { ...s, pending: makeQuestion({ plan: v.plan, units: v.repUnits, todayISO: TODAY, rep: s.rep, index: 0 }) };
  assert.equal(shouldAsk(s, TODAY), false, "una domanda alla volta");

  const r = answerPending(s, "nonso", { todayISO: TODAY, at: 1 });
  assert.equal(r.outcome, "nonso");
  assert.equal(r.state.rep, "piccoli");
  assert.equal(r.state.pending, null);
  assert.deepEqual(r.state.adaptations, [{ day: TODAY, at: 1, from: "grandi", to: "piccoli", reason: "nonso" }]);
  assert.equal(r.state.checks[0].rep, "grandi", "la risposta resta legata alla rappresentazione con cui è stata data");
  assert.throws(() => answerPending(r.state, "si", { todayISO: TODAY }), /nessuna domanda in sospeso/);
});

test("quando chiedere: dopo tre spese, una volta al giorno, mai più di tre al giorno, e «Non ora» rimanda", () => {
  let s = marcoDemo(TODAY);
  s = { ...s, checks: [{ day: TODAY, rep: "grandi", outcome: "giusta" }], lastCheckSeq: s.seq };
  assert.equal(shouldAsk(s, TODAY), false, "appena risposto");
  for (let i = 0; i < 3; i++) s = recordSpend(s, [{ unitId: "caffe" }], { dayISO: TODAY });
  assert.equal(shouldAsk(s, TODAY), true, "dopo tre spese");
  assert.equal(shouldAsk(postpone(s, TODAY), TODAY), false, "«Non ora»");
  assert.equal(shouldAsk(postpone(s, TODAY), "2026-10-07"), true, "il giorno dopo si può chiedere di nuovo");
  const full = { ...s, checks: [1, 2, 3].map(() => ({ day: TODAY, rep: "grandi", outcome: "giusta" })) };
  assert.equal(shouldAsk(full, TODAY), false, "già tre domande oggi");
});

test("la scelta manuale vale e viene registrata", () => {
  const s = chooseRepresentation(marcoDemo(TODAY), "oggi", { todayISO: TODAY, at: 5 });
  assert.equal(s.rep, "oggi");
  assert.equal(s.adaptations[0].reason, "scelta");
  assert.equal(chooseRepresentation(s, "inventata", { todayISO: TODAY }), s);
});

test("evidenza: il modo che funziona meglio, con almeno due risposte", () => {
  const checks = [c("grandi", "sbagliata"), c("grandi", "nonso"), c("piccoli", "sbagliata"), c("giorni", "giusta"), c("giorni", "giusta"), c("giorni", "giusta")];
  const e = evidence(checks);
  assert.equal(e.best, "giorni");
  assert.equal(e.total, 6);
  assert.equal(e.right, 3);
  assert.deepEqual(e.byRep.find((r) => r.rep === "grandi"), { rep: "grandi", asked: 2, right: 0, wrong: 1, nonso: 1, lastIndex: 1 });
  assert.equal(evidence([c("giorni", "giusta")]).best, null, "una sola risposta non basta");
  assert.equal(evidence([c("grandi", "nonso"), c("grandi", "nonso")]).best, null, "nessuna risposta giusta: nessun «migliore»");
  assert.deepEqual(LADDER, ["grandi", "piccoli", "giorni", "oggi"]);
});

// L'esecuzione interna mostrata nella presentazione (slide «Evidenza»): risposte
// scelte da noi per mostrare il meccanismo, non un test con persone.
test("esecuzione interna della demo: «Non so», poi una risposta che non torna, poi tre giuste", () => {
  let s = marcoDemo(TODAY);
  const script = [
    ["2026-10-06", [], "nonso"],
    ["2026-10-06", [], "opposta"],
    ["2026-10-07", [{ unitId: "pranzo" }, { unitId: "caffe" }], "giusta"],
    ["2026-10-08", [{ unitId: "pizza" }], "giusta"],
    ["2026-10-08", [], "giusta"],
  ];
  const reps = [];
  for (const [day, spends, how] of script) {
    for (const it of spends) s = recordSpend(s, [it], { dayISO: day, at: 0 });
    const v = buildView(s, day);
    const q = makeQuestion({ plan: v.plan, units: v.repUnits, todayISO: day, rep: s.rep, index: s.checks.length });
    const a = how === "nonso" ? "nonso" : how === "giusta" ? q.answer : q.answer === "si" ? "no" : "si";
    s = answerPending({ ...s, pending: q }, a, { todayISO: day, at: 0 }).state;
    reps.push(s.rep);
  }
  assert.deepEqual(reps, ["piccoli", "giorni", "giorni", "giorni", "giorni"]);
  const e = evidence(s.checks);
  assert.equal(e.best, "giorni");
  assert.equal(e.total, 5);
  assert.equal(e.right, 3);
  assert.deepEqual(s.adaptations.map((x) => `${x.from}>${x.to}:${x.reason}`), ["grandi>piccoli:nonso", "piccoli>giorni:sbagliata"]);
});
