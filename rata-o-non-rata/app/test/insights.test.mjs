import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SAMPLE_EMAILS, SAMPLE_TODAY } from "../public/lib/samples.js";
import { parseEmail } from "../public/lib/parsers.js";
import { aggregateByMonth, sum } from "../public/lib/schedule.js";
import {
  monthNotes, formatPercent, thresholdAmount, whatIf, whatIfSentence, monthPhrase, incomeFor,
} from "../public/lib/insights.js";
import { buildQuiz, scoreQuiz } from "../public/lib/quiz.js";
import { buildGlossary } from "../public/lib/glossary.js";
import { containsAdvice } from "../public/lib/verify.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const purchases = SAMPLE_EMAILS.map((e) => parseEmail(e.text).purchase);
const months = aggregateByMonth(purchases, { fromMonth: "2026-10" });
const INCOME = 72000; // 720,00 € al mese, scritto dalla persona

test("quota sulle entrate e avviso scelto dalla persona, con la frase esatta", () => {
  const notes = monthNotes(months, { income: INCOME, threshold: 20, refYear: 2026 });
  const nov = notes.find((n) => n.key === "2026-11");
  assert.equal(nov.text, "A novembre le rate sono il 34% di quello che entra. Hai scelto un avviso sopra il 20%.");
  assert.equal(nov.over, true);
  const dic = notes.find((n) => n.key === "2026-12");
  assert.equal(dic.over, false);
  assert.equal(dic.text, "A dicembre le rate sono il 17% di quello che entra.");
  assert.equal(notes.find((n) => n.key === "2027-01").text.startsWith("A gennaio 2027"), true);
  assert.deepEqual(notes.filter((n) => n.over).map((n) => n.key), ["2026-10", "2026-11"]);
});

test("senza soglia scelta non c'è nessun avviso; senza entrate solo gli importi", () => {
  const noThr = monthNotes(months, { income: INCOME, threshold: null, refYear: 2026 });
  assert.ok(noThr.every((n) => !n.over && !n.text.includes("avviso")));
  const noInc = monthNotes(months, { income: null, threshold: 20, refYear: 2026 });
  assert.equal(noInc[1].text, "A novembre le rate sono 245,37 €.");
  assert.ok(noInc.every((n) => !n.over));
  assert.equal(thresholdAmount(INCOME, null), null);
  assert.equal(thresholdAmount(INCOME, 20), 14400);
});

test("percentuali: un decimale quando l'arrotondamento la farebbe sembrare uguale alla soglia", () => {
  assert.equal(formatPercent(34.08, 20), "34%");
  assert.equal(formatPercent(20.3, 20), "20,3%");
  assert.equal(formatPercent(20, 20), "20%");
  const n = monthNotes([{ key: "2026-11", total: 14616 }], { income: INCOME, threshold: 20, refYear: 2026 })[0];
  assert.equal(n.over, true);
  assert.match(n.text, /il 20,3% di quello che entra\. Hai scelto un avviso sopra il 20%\./);
});

test("entrate diverse da mese a mese e articolo giusto davanti ai mesi", () => {
  assert.equal(incomeFor("2026-12", INCOME, { "2026-12": 90000 }), 90000);
  assert.equal(incomeFor("2026-11", INCOME, { "2026-12": 90000 }), INCOME);
  assert.equal(monthPhrase("2027-04", 2026), "Ad aprile 2027");
  assert.equal(monthPhrase("2026-10", 2026), "A ottobre");
});

test("E se aggiungo questo acquisto? Differenza mese per mese, i mesi non toccati restano uguali", () => {
  const rows = whatIf(purchases, { total: 12000, count: 3, frequency: "mensile", firstDate: SAMPLE_TODAY }, { fromMonth: "2026-10" });
  const delta = Object.fromEntries(rows.filter((r) => r.delta).map((r) => [r.key, r.delta]));
  assert.deepEqual(delta, { "2026-10": 4000, "2026-11": 4000, "2026-12": 4000 });
  const nov = rows.find((r) => r.key === "2026-11");
  assert.equal(nov.before, 24537);
  assert.equal(nov.after, 28537);
  assert.equal(sum(rows.map((r) => r.delta)), 12000);
  assert.equal(whatIfSentence(nov, { income: INCOME, threshold: 20, refYear: 2026 }),
    "A novembre le rate sarebbero 285,37 € invece di 245,37 € (+40,00 €). Sarebbero il 40% di quello che entra. Hai scelto un avviso sopra il 20%.");
});

test("la simulazione può allungare il calendario oltre l'ultima rata di oggi", () => {
  const rows = whatIf(purchases, { total: 30000, count: 2, frequency: "mensile", firstDate: "2027-08-15" }, { fromMonth: "2026-10" });
  assert.equal(rows.at(-1).key, "2027-09");
  assert.equal(rows.at(-1).before, 0);
  assert.equal(rows.at(-1).delta, 15000);
});

test("quiz: le risposte giuste sono calcolate dal calendario di Chiara", () => {
  const qs = buildQuiz(purchases, SAMPLE_TODAY);
  assert.equal(qs.length, 3);
  const [q1, q2, q3] = qs;
  assert.equal(q1.correct, "2026-11");
  assert.ok(q1.options.some((o) => o.value === "2026-11"));
  assert.equal(q2.text, "Quante rate paghi a dicembre?");
  assert.equal(q2.correct, 3);
  assert.equal(q3.correct, 23545);
  assert.equal(new Set(q3.options.map((o) => o.value)).size, 4);
  assert.ok(q3.options.some((o) => o.value === 12998), "tra le opzioni c'è la cifra che mostra una sola app (Rateo)");
  for (const q of qs) assert.ok(q.options.some((o) => String(o.value) === String(q.correct)), q.id);
});

test("quiz: punteggio prima e dopo, anche con risposte arrivate come stringhe dai radio", () => {
  const qs = buildQuiz(purchases, SAMPLE_TODAY);
  const before = scoreQuiz(qs, { mese_max: "2026-10", rate_mese: "5", totale_30: "12998" });
  const after = scoreQuiz(qs, { mese_max: "2026-11", rate_mese: "3", totale_30: "23545" });
  assert.equal(before.score, 0);
  assert.equal(after.score, 3);
  assert.equal(scoreQuiz(qs, {}).score, 0);
});

test("glossario: esempi dal calendario e penali solo come scritte nelle email", () => {
  const g = buildGlossary(purchases, SAMPLE_TODAY);
  assert.deepEqual(g.map((x) => x.id), ["rata", "bnpl", "piano", "penale"]);
  assert.match(g[0].example, /30,00 € per Sneakerama \(Rateo\), l'8 ottobre/);
  const fees = g[3].fees;
  const rateo = fees.find((f) => f.provider === "Rateo");
  const emailRateo = SAMPLE_EMAILS.find((e) => e.id === "es-rateo-sneakerama").text;
  assert.ok(rateo.quotes.every((q) => emailRateo.includes(q)));
  assert.deepEqual(fees.find((f) => f.provider === "DividiPay").quotes, []);
});

test("nessun consiglio: frasi generate, quiz, glossario e testi dell'interfaccia", () => {
  const texts = [
    ...monthNotes(months, { income: INCOME, threshold: 10, refYear: 2026 }).map((n) => n.text),
    ...whatIf(purchases, { total: 50000, count: 5, frequency: "ogni_2_settimane", firstDate: SAMPLE_TODAY }, { fromMonth: "2026-10" })
      .map((r) => whatIfSentence(r, { income: INCOME, threshold: 10, refYear: 2026 })),
    ...buildQuiz(purchases, SAMPLE_TODAY).flatMap((q) => [q.text, q.explain]),
    ...buildGlossary(purchases, SAMPLE_TODAY).flatMap((x) => [x.definition, x.example]),
  ];
  for (const t of texts) assert.equal(containsAdvice(t), null, t);
  const pub = path.join(here, "..", "public");
  for (const f of ["index.html", "app.js", ...readdirSync(path.join(pub, "lib")).map((x) => `lib/${x}`)]) {
    // Si controlla il testo che può arrivare alla persona: niente commenti né l'elenco dei divieti.
    const src = readFileSync(path.join(pub, f), "utf8")
      .replace(/const ADVICE = \[[\s\S]*?\];/, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    assert.equal(containsAdvice(src), null, f);
  }
  assert.equal(containsAdvice("Secondo noi ti conviene aspettare"), "ti conviene");
  assert.equal(containsAdvice("È meglio pagare subito"), "È meglio");
});
