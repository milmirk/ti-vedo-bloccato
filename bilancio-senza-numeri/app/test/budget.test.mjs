import { test } from "node:test";
import assert from "node:assert/strict";
import { createState, recordSpend, undoLast, remainingCents, dailyPlan, loadState, newPeriod } from "../public/lib/budget.js";
import { marcoDemo } from "../public/lib/demo.js";

const base = () => createState({
  startCents: 10000, // 100 €
  todayISO: "2026-10-12",
  payday: { type: "date", date: "2026-10-17" },
  units: [{ id: "caffe" }, { id: "pizza" }, { id: "pranzo" }, { id: "spesa" }],
});

test("impostazione: servono da tre a cinque oggetti e un giorno di paga futuro", () => {
  const ok = base();
  assert.equal(ok.setup.paydayISO, "2026-10-17");
  assert.equal(ok.rep, "grandi");
  assert.equal(ok.showEuro, false, "gli euro sono nascosti all'inizio");
  const args = { startCents: 1000, todayISO: "2026-10-12", payday: { type: "date", date: "2026-10-17" } };
  assert.throws(() => createState({ ...args, units: [{ id: "caffe" }, { id: "pizza" }] }));
  assert.throws(() => createState({ ...args, units: ["caffe", "pizza", "pranzo", "spesa", "bus", "gelato"].map((id) => ({ id })) }));
  assert.throws(() => createState({ ...args, payday: { type: "date", date: "2026-10-12" }, units: [{ id: "caffe" }, { id: "pizza" }, { id: "spesa" }] }));
  assert.throws(() => createState({ ...args, startCents: 12.5, units: [{ id: "caffe" }, { id: "pizza" }, { id: "spesa" }] }));
});

test("registrare una spesa toglie il prezzo dell'oggetto; annullare la rimette", () => {
  let s = recordSpend(base(), [{ unitId: "pizza" }], { dayISO: "2026-10-12", at: 1 });
  assert.equal(remainingCents(s), 9200);
  s = recordSpend(s, [{ unitId: "caffe", count: 2 }, { unitId: "panino" }], { dayISO: "2026-10-12", at: 2, source: "altro" });
  assert.equal(s.spends[1].cents, 740, "anche oggetti del catalogo non scelti, al loro prezzo");
  assert.equal(remainingCents(s), 8460);
  const u1 = undoLast(s);
  assert.equal(u1.removed.cents, 740);
  assert.equal(remainingCents(u1.state), 9200);
  const u2 = undoLast(undoLast(u1.state).state);
  assert.equal(u2.removed, null, "niente da annullare: nessun errore");
  assert.equal(remainingCents(u2.state), 10000);
});

test("le voci non valide vengono rifiutate", () => {
  const s = base();
  const when = { dayISO: "2026-10-12" };
  assert.throws(() => recordSpend(s, [], when));
  assert.throws(() => recordSpend(s, [{ unitId: "yacht" }], when));
  assert.throws(() => recordSpend(s, [{ unitId: "caffe", count: 0 }], when));
  assert.throws(() => recordSpend(s, [{ unitId: "caffe", count: 2.5 }], when));
  assert.throws(() => recordSpend(s, [{ unitId: "altro" }], when), "una spesa 'altro' senza importo");
  assert.equal(remainingCents(recordSpend(s, [{ unitId: "altro", cents: 1500 }], when)), 8500);
});

test("parte di oggi: calcolata su quello che c'era a inizio giornata", () => {
  // 100 € per 5 giorni = 20 € al giorno. Oggi una pizza (8 €): restano 12 € per oggi.
  const s = recordSpend(base(), [{ unitId: "pizza" }], { dayISO: "2026-10-12" });
  const p = dailyPlan(s, "2026-10-12");
  assert.equal(p.spendDays, 5);
  assert.equal(p.dailyShare, 2000);
  assert.equal(p.todayLeft, 1200);
  assert.equal(p.futureDaily, 2000, "i giorni dopo hanno ancora la loro parte");
});

test("se oggi si supera la propria parte, i giorni dopo ne hanno un po' meno", () => {
  const s = recordSpend(base(), [{ unitId: "spesa" }], { dayISO: "2026-10-12" }); // 25 € su 20
  const p = dailyPlan(s, "2026-10-12");
  assert.equal(p.todayLeft, -500);
  assert.equal(p.futureDaily, Math.floor(7500 / 4));
});

test("le spese dei giorni prima non contano come spese di oggi", () => {
  const s = recordSpend(base(), [{ unitId: "spesa" }], { dayISO: "2026-10-12" });
  const p = dailyPlan(s, "2026-10-13"); // il giorno dopo: 75 € per 4 giorni
  assert.equal(p.spentToday, 0);
  assert.equal(p.dailyShare, 1875);
  assert.equal(p.todayLeft, 1875);
});

test("periodo finito e soldi finiti", () => {
  const s = recordSpend(base(), [{ unitId: "altro", cents: 12000 }], { dayISO: "2026-10-12" });
  const p = dailyPlan(s, "2026-10-12");
  assert.equal(p.remaining, -2000);
  assert.equal(p.todayLeft, -10000, "la parte di oggi era di venti euro, ne sono stati usati centoventi");
  assert.equal(p.futureDaily, 0, "per i giorni dopo non resta niente");
  assert.equal(dailyPlan(s, "2026-10-13").dailyShare, 0, "il giorno dopo si parte già sotto zero");
  assert.equal(dailyPlan(base(), "2026-10-17").ended, true);
});

test("stato salvato: si ricarica, e uno rovinato non blocca l'app", () => {
  const s = marcoDemo("2026-10-06");
  const again = loadState(JSON.stringify(s));
  assert.equal(remainingCents(again), remainingCents(s));
  assert.equal(loadState("{non json"), null);
  assert.equal(loadState(JSON.stringify({ v: 2 })), null);
  assert.equal(loadState(JSON.stringify({ ...s, setup: { ...s.setup, units: [] } })), null);
});

test("nuovo periodo: nuove cifre, ma restano rappresentazione e storico delle domande", () => {
  const s = { ...marcoDemo("2026-10-06"), rep: "giorni", checks: [{ rep: "grandi", outcome: "nonso", day: "2026-10-06" }] };
  const n = newPeriod(s, { startCents: 120000, todayISO: "2026-10-17" });
  assert.equal(n.spends.length, 0);
  assert.equal(remainingCents(n), 120000);
  assert.equal(n.rep, "giorni");
  assert.equal(n.checks.length, 1);
  assert.equal(n.setup.paydayISO, "2026-11-17");
});

test("l'esempio di Marco: giorno di paga tra undici giorni, qualunque sia la data", () => {
  for (const d of ["2026-10-06", "2026-01-25", "2026-12-28", "2028-02-20"]) {
    const s = marcoDemo(d);
    assert.equal(dailyPlan(s, d).daysLeft, 11, d);
    assert.equal(remainingCents(s), 13780);
  }
});
