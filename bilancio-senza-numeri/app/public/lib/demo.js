/*
 * L'esempio di Marco, per la demo: dati inventati, coerenti con la persona.
 * Il giorno di paga cade sempre tra undici giorni, qualunque sia la data.
 */
import { createState, recordSpend } from "./budget.js";
import { addDays, parts } from "./dates.js";

export const DEMO_START_CENTS = 18640; // 186,40 €
export const DEMO_DAYS_TO_PAYDAY = 11;

export function marcoDemo(todayISO, at = Date.now()) {
  const start = addDays(todayISO, -2);
  const payday = { type: "monthly", day: parts(addDays(todayISO, DEMO_DAYS_TO_PAYDAY)).d };
  let s = createState({
    startCents: DEMO_START_CENTS,
    todayISO: start,
    payday,
    units: [{ id: "caffe" }, { id: "pizza" }, { id: "pranzo" }, { id: "spesa" }],
  });
  const spends = [
    [-2, [{ unitId: "spesa" }]],
    [-2, [{ unitId: "caffe" }]],
    [-1, [{ unitId: "caffe" }]],
    [-1, [{ unitId: "pranzo" }]],
    [-1, [{ unitId: "pizza" }]],
    [0, [{ unitId: "caffe" }]],
  ];
  for (const [d, items] of spends) s = recordSpend(s, items, { dayISO: addDays(todayISO, d), at: at + d * 86400000, source: "esempio" });
  return s;
}
