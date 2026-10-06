import { test } from "node:test";
import assert from "node:assert/strict";
import { numberWord, countPhrase, partsPhrase, amountPhrase, formatEuro, paydayPhrase, dayName, dateWords, hasNumbers } from "../public/lib/words.js";
import { decompose, resolveUnits } from "../public/lib/units.js";
import { createState, recordSpend } from "../public/lib/budget.js";
import { buildView, evidenceView, recentSpends, itemText } from "../public/lib/view.js";
import { makeQuestion, feedbackText } from "../public/lib/questions.js";
import { LADDER } from "../public/lib/adapt.js";
import { marcoDemo } from "../public/lib/demo.js";
import { addDays } from "../public/lib/dates.js";

const units = resolveUnits([{ id: "caffe" }, { id: "pizza" }, { id: "pranzo" }, { id: "spesa" }]);
const [caffe, pizza] = units;

test("numeri in lettere, con le regole dell'italiano", () => {
  assert.equal(numberWord(1), "uno");
  assert.equal(numberWord(1, "f"), "una");
  assert.equal(numberWord(21), "ventuno");
  assert.equal(numberWord(23), "ventitré");
  assert.equal(numberWord(28), "ventotto");
  assert.equal(numberWord(183), "centottantatré");
  assert.equal(numberWord(1203), "milleduecentotré");
  assert.equal(numberWord(2026), "duemilaventisei");
});

test("quantità di oggetti: articolo al singolare, plurale in lettere", () => {
  assert.equal(countPhrase(1, caffe), "un caffè");
  assert.equal(countPhrase(1, pizza), "una pizza");
  assert.equal(countPhrase(3, caffe), "tre caffè");
  assert.equal(countPhrase(2, pizza), "due pizze");
});

test("scomposizione in parole, con il resto come «qualche spicciolo»", () => {
  assert.equal(partsPhrase(decompose(13780, units)), "cinque spese piccole, un pranzo fuori e qualche spicciolo");
  assert.equal(partsPhrase(decompose(2400, units)), "due pranzi fuori");
  // Greedy, dal più grande: sedici euro sono un pranzo e tre caffè, non due pizze.
  assert.equal(partsPhrase(decompose(1600, units)), "un pranzo fuori, tre caffè e qualche spicciolo");
  assert.equal(partsPhrase(decompose(50, units)), "solo qualche spicciolo");
  assert.equal(partsPhrase(decompose(0, units)), "niente");
  assert.equal(amountPhrase(13780, units, { maxParts: 1 }), "cinque spese piccole");
});

test("gli euro compaiono solo se la persona li chiede", () => {
  assert.equal(formatEuro(18640), "186,40 €");
  assert.equal(formatEuro(123456), "1.234,56 €");
  assert.equal(formatEuro(-500), "−5,00 €");
  assert.equal(amountPhrase(2400, units, { euro: true }), "due pranzi fuori (24,00 €)");
  assert.ok(!hasNumbers(amountPhrase(2400, units)));
});

test("giorni e giorno di paga in parole", () => {
  assert.equal(paydayPhrase("2026-10-12", "2026-10-17"), "Fino a sabato · tra cinque giorni");
  assert.equal(paydayPhrase("2026-10-06", "2026-10-27"), "Fino a martedì ventisette ottobre · tra ventuno giorni");
  assert.equal(paydayPhrase("2026-10-06", "2026-10-27", { euro: true }), "Fino a martedì 27 ottobre · tra 21 giorni");
  assert.equal(paydayPhrase("2026-10-16", "2026-10-17"), "Fino a domani: domani è il giorno di paga");
  assert.equal(dayName("2026-10-11", "2026-10-12"), "ieri");
  assert.equal(dayName("2026-10-09", "2026-10-12"), "venerdì");
});

// La garanzia del prodotto: con gli euro spenti, nessun testo mostrato ha numeri.
test("modalità «senza numeri»: nessuna cifra, € o «euro» nei testi, in tante situazioni", () => {
  const all = [];
  const payday = (d) => addDays("2026-10-06", d);
  for (const start of [0, 90, 1999, 13780, 18640, 45000, 260000]) {
    for (const days of [1, 2, 5, 11, 21, 30]) {
      let s = createState({ startCents: start, todayISO: "2026-10-06", payday: { type: "date", date: payday(days) }, units: [{ id: "caffe" }, { id: "pizza" }, { id: "pranzo" }, { id: "spesa" }, { id: "pieno" }] });
      for (const spend of [[], [{ unitId: "pranzo" }], [{ unitId: "altro", cents: 30000 }]]) {
        const st = spend.length ? recordSpend(s, spend, { dayISO: "2026-10-06" }) : s;
        for (const rep of LADDER) {
          const v = buildView({ ...st, rep }, "2026-10-06");
          all.push(...Object.values(v.texts), ...v.dots.map((d) => d.name), ...v.dayRows.map((r) => r.text + r.name));
          for (let i = 0; i < 3; i++) {
            const q = makeQuestion({ plan: v.plan, units: v.repUnits, todayISO: "2026-10-06", rep, index: i });
            if (q) all.push(q.text, q.fact, feedbackText(q, "giusta"), feedbackText(q, "nonso"), feedbackText(q, "sbagliata"));
          }
        }
        all.push(...recentSpends(st, "2026-10-06").flatMap((r) => [r.text, r.when]));
      }
    }
  }
  const s = { ...marcoDemo("2026-10-06"), checks: [
    { day: "2026-10-05", rep: "grandi", outcome: "nonso", text: "x" },
    { day: "2026-10-06", rep: "piccoli", outcome: "giusta", text: "y" },
    { day: "2026-10-06", rep: "piccoli", outcome: "giusta", text: "z" },
  ], adaptations: [{ day: "2026-10-05", from: "grandi", to: "piccoli", reason: "nonso" }] };
  const e = evidenceView(s, "2026-10-06");
  all.push(e.intro, e.totals, e.best, ...e.rows.map((r) => r.text + r.label), ...e.timeline.map((t) => t.when + t.rep + t.label), ...e.changes);

  assert.ok(all.length > 1000, `testi controllati: ${all.length}`);
  const bad = all.filter((t) => hasNumbers(t));
  assert.deepEqual(bad, []);
});

test("con «Mostra anche gli euro» i numeri compaiono accanto agli oggetti", () => {
  const s = { ...marcoDemo("2026-10-06"), showEuro: true };
  const v = buildView(s, "2026-10-06");
  assert.match(v.texts.remaining, /\(137,80 €\)$/);
  assert.match(v.texts.header, /17 ottobre · tra 11 giorni/);
});

test("una spesa con l'importo scritto dalla persona dice quanto vale in oggetti", () => {
  const s = recordSpend(marcoDemo("2026-10-06"), [{ unitId: "spesa", cents: 3000 }], { dayISO: "2026-10-06" });
  const it = s.spends[s.spends.length - 1].items[0];
  assert.equal(itemText(it, s), "una spesa piccola (più cara del solito: circa una spesa piccola e quattro caffè)");
  assert.equal(itemText(it, s, { euro: true }), "una spesa piccola (più cara del solito: circa una spesa piccola e quattro caffè, 30,00 €)");
  assert.equal(itemText({ unitId: "altro", count: 1, cents: 1500 }, s), "un'altra spesa (circa un pranzo fuori e due caffè)");
  assert.equal(itemText({ unitId: "caffe", count: 2, cents: 240 }, s), "due caffè");
  assert.equal(itemText({ unitId: "caffe", count: 3, cents: 450 }, s), "tre caffè (più cari del solito)");
  assert.equal(itemText({ unitId: "altro", count: 1, cents: 800, label: "due caffè e un panino" }, s), "due caffè e un panino (in tutto circa una pizza)");
});

test("il primo del mese si dice «primo», e la data di prova è in lettere", () => {
  assert.equal(paydayPhrase("2026-10-20", "2026-11-01"), "Fino a domenica primo novembre · tra dodici giorni");
  assert.equal(dateWords("2026-10-06"), "martedì sei ottobre");
  assert.ok(!hasNumbers(dateWords("2026-11-01")));
});

test("«Ti resta» o «Ti restano», e mai «circa meno di»", () => {
  const mk = (startCents, spend) => {
    const s = createState({ startCents, todayISO: "2026-10-06", payday: { type: "date", date: "2026-10-09" }, units: [{ id: "caffe" }, { id: "pizza" }, { id: "spesa" }] });
    return spend ? recordSpend(s, [{ unitId: "altro", cents: spend }], { dayISO: "2026-10-06" }) : s;
  };
  assert.equal(buildView(mk(120), "2026-10-06").texts.remainingTitle, "Ti resta");
  assert.equal(buildView(mk(240), "2026-10-06").texts.remainingTitle, "Ti restano");
  assert.equal(buildView(mk(50), "2026-10-06").texts.summary.includes("Ti resta solo qualche spicciolo."), true);
  const zero = buildView(mk(1000, 1000), "2026-10-06");
  assert.equal(zero.texts.remainingTitle, "Non ti resta niente");
  assert.match(zero.texts.summary, /Non ti resta niente\./);
  assert.match(buildView(mk(1000, 1120), "2026-10-06").texts.remaining, /: manca circa un caffè\.$/);
  const little = buildView(mk(300), "2026-10-06"); // un euro al giorno: meno di un caffè
  assert.equal(little.texts.todayTitle, "Oggi puoi usare");
  assert.equal(little.texts.today, "meno di un caffè");
  assert.equal(little.texts.future, "Da domani, ogni giorno: meno di un caffè.");
  assert.doesNotMatch(little.texts.summary, /circa meno/);
  assert.match(buildView({ ...mk(30000), rep: "giorni" }, "2026-10-06").dayRows[1].text, /^circa /);
});
