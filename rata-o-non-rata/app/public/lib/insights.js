/*
 * Fatti sul calendario, scritti in modo neutro.
 *
 * - quota delle rate su quello che entra, mese per mese
 * - avviso SOLO se la persona ha scelto una soglia (l'app non ne suggerisce)
 * - "E se aggiungo questo acquisto?": differenza mese per mese
 *
 * Nessuna frase dice cosa fare: niente "ti conviene", "dovresti", "è meglio".
 * Un test controlla tutte le frasi prodotte qui.
 */
import { formatEuro } from "./money.js";
import { monthName, monthLabel } from "./dates.js";
import { aggregateByMonth } from "./schedule.js";

/** "A novembre" (stesso anno di riferimento) oppure "A gennaio 2027". */
export function monthPhrase(key, refYear) {
  const name = Number(key.slice(0, 4)) === refYear ? monthName(key) : monthLabel(key);
  return name.startsWith("a") ? `Ad ${name}` : `A ${name}`; // "Ad aprile", "Ad agosto"
}

/** Quota percentuale (numero, non arrotondato). Null se non c'è un'entrata. */
export function share(amount, income) {
  if (!Number.isFinite(income) || income <= 0) return null;
  return (amount / income) * 100;
}

/**
 * Percentuale leggibile: intera ("34%"), ma con un decimale quando
 * l'arrotondamento la farebbe sembrare uguale alla soglia ("20,3%").
 */
export function formatPercent(pct, threshold = null) {
  const r = Math.round(pct);
  if (threshold != null && r === threshold && pct !== threshold) {
    return `${(Math.round(pct * 10) / 10).toFixed(1).replace(".", ",")}%`;
  }
  return `${r}%`;
}

/** Entrata del mese: valore specifico del mese se indicato, altrimenti quello abituale. */
export function incomeFor(key, income, overrides = {}) {
  const o = overrides?.[key];
  return Number.isInteger(o) && o > 0 ? o : income;
}

/** La soglia scelta: numero tra 1 e 100, oppure null (nessun avviso). */
export function normalizeThreshold(t) {
  const n = Number(t);
  return Number.isFinite(n) && n > 0 && n <= 100 ? n : null;
}

/**
 * Una nota per mese: quota sulle entrate e, se la persona ha scelto un avviso,
 * se il mese è sopra la soglia. Testo neutro, nessun consiglio.
 */
export function monthNotes(months, { income = null, overrides = {}, threshold = null, refYear }) {
  const thr = normalizeThreshold(threshold);
  return months.map((m) => {
    const inc = incomeFor(m.key, income, overrides);
    const pct = share(m.total, inc);
    const phrase = monthPhrase(m.key, refYear);
    const over = thr != null && pct != null && pct > thr;
    let text;
    if (m.total === 0) text = `${phrase} non ci sono rate.`;
    else if (pct == null) text = `${phrase} le rate sono ${formatEuro(m.total)}.`;
    else text = `${phrase} le rate sono il ${formatPercent(pct, thr)} di quello che entra.`;
    if (over) text += ` Hai scelto un avviso sopra il ${String(thr).replace(".", ",")}%.`;
    return { key: m.key, total: m.total, income: inc, pct, over, text };
  });
}

/** La linea dell'avviso nel grafico, in centesimi (null se non c'è avviso o entrata). */
export function thresholdAmount(income, threshold) {
  const thr = normalizeThreshold(threshold);
  if (thr == null || !Number.isFinite(income) || income <= 0) return null;
  return Math.round((income * thr) / 100);
}

/**
 * "E se aggiungo questo acquisto?": confronta il calendario di oggi con quello
 * che avrebbe anche l'acquisto simulato. Restituisce un riga per mese.
 */
export function whatIf(purchases, hypothetical, { fromMonth }) {
  const ghost = { ...hypothetical, id: "simulazione", provider: hypothetical.provider || "Simulazione", ghost: true };
  const after = aggregateByMonth([...purchases, ghost], { fromMonth });
  const before = aggregateByMonth(purchases, { fromMonth, toMonth: after.length ? after[after.length - 1].key : fromMonth });
  const beforeBy = new Map(before.map((m) => [m.key, m.total]));
  return after.map((m) => {
    const b = beforeBy.get(m.key) || 0;
    return { key: m.key, before: b, after: m.total, delta: m.total - b };
  });
}

/** Frase neutra per un mese della simulazione. */
export function whatIfSentence(row, { income = null, overrides = {}, threshold = null, refYear }) {
  const phrase = monthPhrase(row.key, refYear);
  let text = `${phrase} le rate sarebbero ${formatEuro(row.after)} invece di ${formatEuro(row.before)} (${formatEuro(row.delta, { sign: true })}).`;
  const inc = incomeFor(row.key, income, overrides);
  const pct = share(row.after, inc);
  const thr = normalizeThreshold(threshold);
  if (pct != null) {
    text += ` Sarebbero il ${formatPercent(pct, thr)} di quello che entra.`;
    if (thr != null && pct > thr) text += ` Hai scelto un avviso sopra il ${String(thr).replace(".", ",")}%.`;
  }
  return text;
}
