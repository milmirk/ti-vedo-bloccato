import { test } from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_EMAILS, SAMPLE_TODAY } from "../public/lib/samples.js";
import { parseEmail } from "../public/lib/parsers.js";
import {
  buildSchedule, splitAmounts, aggregateByMonth, monthSummary, nextMonthKey, upcoming, remainingByProvider, sum, providerOrder,
} from "../public/lib/schedule.js";
import { addMonthsClamped } from "../public/lib/dates.js";

const purchases = SAMPLE_EMAILS.map((e) => parseEmail(e.text).purchase);
const byMerchant = (m) => purchases.find((p) => p.merchant === m);
const plan = (o) => ({ id: "t", provider: "Test", merchant: "Prova", total: 10000, count: 3, firstDate: "2026-01-31", frequency: "mensile", ...o });
const dates = (p) => buildSchedule(p).map((i) => i.date);

test("mensile: dal 31 gennaio a fine febbraio e poi di nuovo il 31", () => {
  assert.deepEqual(dates(plan({ count: 4 })), ["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
});

test("mensile in anno bisestile: 31 gennaio 2028 → 29 febbraio 2028", () => {
  assert.deepEqual(dates(plan({ firstDate: "2028-01-31", count: 2 })), ["2028-01-31", "2028-02-29"]);
  assert.equal(addMonthsClamped("2027-12-30", 2), "2028-02-29");
});

test("mensile a cavallo dell'anno", () => {
  assert.deepEqual(dates(plan({ firstDate: "2026-11-30", count: 4 })), ["2026-11-30", "2026-12-30", "2027-01-30", "2027-02-28"]);
});

test("ogni 2 settimane: +14 giorni anche a cavallo del mese", () => {
  assert.deepEqual(dates(byMerchant("Sneakerama")), ["2026-09-24", "2026-10-08", "2026-10-22", "2026-11-05"]);
});

test("ogni 30 giorni: non è 'ogni mese' (4 ottobre → 3 novembre → 3 dicembre → 2 gennaio)", () => {
  assert.deepEqual(dates(byMerchant("SuonaLive")), ["2026-10-04", "2026-11-03", "2026-12-03", "2027-01-02"]);
});

test("le date del calendario coincidono con quelle scritte nelle email", () => {
  assert.deepEqual(dates(byMerchant("ModaVia")), ["2026-09-28", "2026-10-28", "2026-11-28"]);
  assert.deepEqual(dates(byMerchant("PixelPlay")), ["2026-10-05", "2026-10-19", "2026-11-02", "2026-11-16"]);
});

test("centesimi: l'ultima rata assorbe l'arrotondamento e la somma è il totale", () => {
  assert.deepEqual(splitAmounts(10000, 3).amounts, [3333, 3333, 3334]);
  assert.deepEqual(splitAmounts(8990, 3, 2997).amounts, [2997, 2997, 2996]);
  assert.deepEqual(splitAmounts(7999, 4, 1999).amounts, [1999, 1999, 1999, 2002]);
  for (const [t, n] of [[1, 1], [101, 4], [69900, 10], [99999, 7], [5, 3]]) {
    assert.equal(sum(splitAmounts(t, n).amounts), t, `${t} in ${n}`);
  }
});

test("importo rata incoerente col totale: parti uguali e segnalazione, somma sempre giusta", () => {
  const r = splitAmounts(10000, 4, 4000);
  assert.equal(r.note, "importi_non_coerenti");
  assert.equal(sum(r.amounts), 10000);
});

test("ogni piano di esempio somma esattamente al suo totale", () => {
  for (const p of purchases) assert.equal(sum(buildSchedule(p).map((i) => i.amount)), p.total, p.merchant);
});

test("aggregazione per mese e per servizio sui dati di Chiara", () => {
  const months = aggregateByMonth(purchases, { fromMonth: "2026-10" });
  assert.equal(months[0].key, "2026-10");
  assert.equal(months.at(-1).key, "2027-08");
  assert.equal(months.length, 11);
  const nov = months.find((m) => m.key === "2026-11");
  assert.equal(nov.total, 24537);
  assert.equal(nov.count, 8);
  assert.deepEqual(nov.byProvider, { Pago3: 4496, Rateo: 7001, DividiPay: 6050, ElettroCasa: 6990 });
  assert.equal(sum(Object.values(nov.byProvider)), nov.total);
  const dic = months.find((m) => m.key === "2026-12");
  assert.equal(dic.count, 3);
});

test("il mese prossimo e i prossimi 30 giorni, rispetto a oggi", () => {
  assert.equal(nextMonthKey(SAMPLE_TODAY), "2026-11");
  assert.equal(nextMonthKey("2026-12-15"), "2027-01");
  const nm = monthSummary(purchases, "2026-11");
  assert.equal(nm.total, 24537);
  assert.equal(nm.providerCount, 4);
  const up = upcoming(purchases, SAMPLE_TODAY, 30);
  assert.equal(up[0].date, "2026-10-08");
  assert.equal(up.at(-1).date, "2026-11-05");
  assert.equal(sum(up.map((i) => i.amount)), 23545);
});

test("quanto resta per servizio e ordine stabile dei servizi (il colore segue il servizio)", () => {
  const rest = remainingByProvider(purchases, SAMPLE_TODAY);
  assert.equal(rest.ElettroCasa, 69900);
  assert.equal(rest.Rateo, 3 * 3000 + (1999 + 1999 + 2002)); // Sneakerama + PixelPlay dal 6 ottobre
  assert.deepEqual(providerOrder([...purchases].reverse(), ["Pago3", "Rateo", "DividiPay", "ElettroCasa"]), ["Pago3", "Rateo", "DividiPay", "ElettroCasa"]);
});

test("dati incompleti o assurdi non producono rate (niente calendario inventato)", async () => {
  const { isComplete } = await import("../public/lib/schedule.js");
  assert.deepEqual(buildSchedule(plan({ total: null })), []);
  assert.deepEqual(buildSchedule(plan({ firstDate: "2026-02-30" })), []);
  assert.deepEqual(buildSchedule(plan({ frequency: "a volte" })), []);
  assert.equal(isComplete(plan({ count: 0 })), false);
  assert.deepEqual(dates(plan({ frequency: "settimanale", firstDate: "2026-12-29", count: 2 })), ["2026-12-29", "2027-01-05"]);
});
