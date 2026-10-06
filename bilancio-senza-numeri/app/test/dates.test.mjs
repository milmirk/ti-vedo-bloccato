import { test } from "node:test";
import assert from "node:assert/strict";
import { nextPayday, daysBetween, spendDays, addDays, daysInMonth, monthGrid, isISODate, weekday } from "../public/lib/dates.js";

test("il 27 di ogni mese: prima del 27 è questo mese, dal 27 in poi è il mese dopo", () => {
  assert.equal(nextPayday("2026-10-06", { type: "monthly", day: 27 }), "2026-10-27");
  assert.equal(nextPayday("2026-10-27", { type: "monthly", day: 27 }), "2026-11-27", "il giorno di paga i soldi sono appena arrivati");
  assert.equal(nextPayday("2026-10-28", { type: "monthly", day: 27 }), "2026-11-27");
});

test("cambio d'anno: da dicembre a gennaio", () => {
  assert.equal(nextPayday("2026-12-28", { type: "monthly", day: 27 }), "2027-01-27");
  assert.equal(daysBetween("2026-12-28", "2027-01-27"), 30);
});

test("mesi corti: il 31 diventa l'ultimo giorno del mese (anche negli anni bisestili)", () => {
  assert.equal(nextPayday("2027-02-10", { type: "monthly", day: 31 }), "2027-02-28");
  assert.equal(nextPayday("2028-02-10", { type: "monthly", day: 31 }), "2028-02-29");
  assert.equal(nextPayday("2026-11-30", { type: "monthly", day: 31 }), "2026-12-31", "a novembre il 31 è il 30: arrivati lì, tocca a dicembre");
  assert.equal(nextPayday("2026-01-31", { type: "monthly", day: 30 }), "2026-02-28");
  assert.equal(daysInMonth(2026, 2), 28);
});

test("data precisa e giorni da coprire (oggi compreso, giorno di paga escluso)", () => {
  assert.equal(nextPayday("2026-10-12", { type: "date", date: "2026-10-17" }), "2026-10-17");
  assert.equal(spendDays("2026-10-12", "2026-10-17"), 5);
  assert.equal(spendDays("2026-10-17", "2026-10-17"), 1, "mai meno di un giorno");
  assert.throws(() => nextPayday("2026-10-12", { type: "date", date: "2026-02-30" }));
});

test("l'ora legale non sposta i giorni", () => {
  // In Italia l'ora legale finisce il 25 ottobre 2026 e ricomincia il 28 marzo 2027.
  assert.equal(daysBetween("2026-10-24", "2026-10-26"), 2);
  assert.equal(daysBetween("2027-03-27", "2027-03-29"), 2);
  assert.equal(addDays("2026-10-25", 1), "2026-10-26");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("calendario: settimane dal lunedì, caselle vuote fuori dal mese", () => {
  const weeks = monthGrid(2026, 10); // 1 ottobre 2026 è giovedì
  assert.equal(weekday("2026-10-01"), 4);
  assert.deepEqual(weeks[0].slice(0, 4), [null, null, null, "2026-10-01"]);
  assert.ok(weeks.every((w) => w.length === 7));
  assert.equal(weeks.flat().filter(Boolean).length, 31);
  assert.ok(isISODate("2028-02-29") && !isISODate("2027-02-29") && !isISODate("17/10/2026"));
});
