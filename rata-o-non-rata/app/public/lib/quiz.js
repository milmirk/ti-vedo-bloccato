/*
 * Quiz di 3 domande sul calendario della persona: le risposte giuste sono
 * calcolate dai suoi dati, non scritte a mano. Serve come prova di
 * comprensione: punteggio del primo tentativo e di quello dopo.
 */
import { aggregateByMonth, upcoming, sum } from "./schedule.js";
import { monthKey, monthLabel, addMonthsToKey, withArticle } from "./dates.js";
import { formatEuro } from "./money.js";
import { monthPhrase } from "./insights.js";

const roundEuro = (cents) => Math.max(100, Math.round(cents / 100) * 100);

function distinctAmounts(correct, candidates) {
  const out = [correct];
  for (const c of candidates) {
    if (c > 0 && out.every((o) => Math.abs(o - c) >= 500)) out.push(c);
    if (out.length === 4) break;
  }
  let step = 1;
  while (out.length < 4) {
    const c = roundEuro(correct + step * 2500);
    if (out.every((o) => Math.abs(o - c) >= 500)) out.push(c);
    step += 1;
  }
  return out.sort((a, b) => a - b);
}

export function buildQuiz(purchases, today) {
  const from = monthKey(today);
  const refYear = Number(today.slice(0, 4));
  const months = aggregateByMonth(purchases, { fromMonth: from });
  if (!months.some((m) => m.total > 0)) return [];
  const questions = [];

  // 1 · Il mese più pesante
  const withRate = months.filter((m) => m.total > 0);
  const max = withRate.reduce((a, m) => (m.total > a.total ? m : a), withRate[0]);
  let opts = withRate.slice(0, 4).map((m) => m.key);
  if (!opts.includes(max.key)) opts = [...opts.slice(0, 3), max.key];
  opts.sort();
  questions.push({
    id: "mese_max",
    text: "In quale mese paghi di più di rate?",
    options: opts.map((k) => ({ value: k, label: monthLabel(k) })),
    correct: max.key,
    explain: `Il mese con più rate è ${monthLabel(max.key)}: ${formatEuro(max.total)} in ${max.count} rate.`,
  });

  // 2 · Quante rate fra due mesi
  const key2 = addMonthsToKey(from, 2);
  const m2 = months.find((m) => m.key === key2) || { key: key2, count: 0, items: [] };
  const start = Math.max(0, m2.count - 1);
  const list = m2.items.map((it) => `${it.merchant} (${it.provider}) ${withArticle(it.date, refYear)}`);
  questions.push({
    id: "rate_mese",
    text: `Quante rate paghi ${monthPhrase(key2, refYear).toLowerCase()}?`,
    options: [start, start + 1, start + 2, start + 3].map((n) => ({ value: n, label: String(n) })),
    correct: m2.count,
    explain: m2.count
      ? `${monthPhrase(key2, refYear)} le rate sono ${m2.count}: ${list.join("; ")}.`
      : `${monthPhrase(key2, refYear)} non ci sono rate.`,
  });

  // 3 · Quanto nei prossimi 30 giorni, sommando tutti i servizi
  const up = upcoming(purchases, today, 30);
  const total = sum(up.map((it) => it.amount));
  const byProv = {};
  for (const it of up) byProv[it.provider] = (byProv[it.provider] || 0) + it.amount;
  const [topProv, topAmount] = Object.entries(byProv).sort((a, b) => b[1] - a[1])[0] || ["", 0];
  const amounts = distinctAmounts(total, [topAmount, roundEuro(total * 0.6), roundEuro(total * 1.3)]);
  questions.push({
    id: "totale_30",
    text: "Quanto paghi in tutto nei prossimi 30 giorni, sommando tutti i servizi?",
    options: amounts.map((a) => ({ value: a, label: formatEuro(a) })),
    correct: total,
    explain: up.length
      ? `Nei prossimi 30 giorni paghi ${formatEuro(total)} in ${up.length} rate, su ${Object.keys(byProv).length} servizi. ${topProv} da solo ne chiede ${formatEuro(topAmount)}: è la cifra che vedresti nella sua app.`
      : "Nei prossimi 30 giorni non ci sono rate.",
  });

  return questions;
}

/** Confronta le risposte (anche stringhe, come arrivano dai radio) con quelle giuste. */
export function scoreQuiz(questions, answers) {
  const results = questions.map((q) => {
    const given = answers?.[q.id];
    const ok = given != null && String(given) === String(q.correct);
    return { id: q.id, given, ok, explain: q.explain };
  });
  return { score: results.filter((r) => r.ok).length, total: questions.length, results };
}
