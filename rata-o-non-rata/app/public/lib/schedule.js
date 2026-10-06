/*
 * Calendario deterministico delle rate.
 *
 * Da un acquisto (totale, numero di rate, frequenza, prima data) a un elenco
 * di rate con data e importo. La somma delle rate è SEMPRE uguale al totale:
 * l'ultima rata assorbe i centesimi dell'arrotondamento. Poi aggrega per mese
 * e per servizio. Nessuna AI: è solo aritmetica, coperta dai test.
 */
import { addDays, addMonthsClamped, parts, monthKey, addMonthsToKey, isValidIso } from "./dates.js";

export const FREQUENCIES = {
  mensile: { label: "ogni mese", step: { months: 1 } },
  ogni_2_settimane: { label: "ogni 2 settimane", step: { days: 14 } },
  ogni_30_giorni: { label: "ogni 30 giorni", step: { days: 30 } },
  settimanale: { label: "ogni settimana", step: { days: 7 } },
};

export const frequencyLabel = (code) => FREQUENCIES[code]?.label || "frequenza non indicata";

/** Data della rata numero i (da 0), partendo dalla prima. */
export function installmentDate(firstDate, frequency, i) {
  const f = FREQUENCIES[frequency];
  if (!f) throw new Error("frequenza sconosciuta: " + frequency);
  if (f.step.months) return addMonthsClamped(firstDate, i * f.step.months, parts(firstDate).d);
  return addDays(firstDate, i * f.step.days);
}

/**
 * Divide il totale in `count` rate (centesimi interi).
 * Se l'email indica l'importo della rata, lo usa per tutte tranne l'ultima,
 * che porta la differenza; se i due numeri non tornano, divide in parti uguali
 * e lo segnala con `note`. In ogni caso la somma è uguale al totale.
 */
export function splitAmounts(total, count, installmentAmount = null) {
  if (!Number.isInteger(total) || total <= 0) throw new Error("totale non valido");
  if (!Number.isInteger(count) || count < 1) throw new Error("numero di rate non valido");
  if (installmentAmount != null && Number.isInteger(installmentAmount) && installmentAmount > 0) {
    const last = total - installmentAmount * (count - 1);
    if (last > 0 && Math.abs(last - installmentAmount) < Math.max(count, 2)) {
      return { amounts: [...Array(count - 1).fill(installmentAmount), last], note: null };
    }
    const base = Math.floor(total / count);
    return {
      amounts: [...Array(count - 1).fill(base), total - base * (count - 1)],
      note: "importi_non_coerenti",
    };
  }
  const base = Math.floor(total / count);
  return { amounts: [...Array(count - 1).fill(base), total - base * (count - 1)], note: null };
}

export function isComplete(p) {
  return p && Number.isInteger(p.total) && p.total > 0 && Number.isInteger(p.count) && p.count >= 1
    && p.count <= 120 && isValidIso(p.firstDate) && !!FREQUENCIES[p.frequency];
}

/** Elenco delle rate di un acquisto. */
export function buildSchedule(p) {
  if (!isComplete(p)) return [];
  const { amounts } = splitAmounts(p.total, p.count, p.installmentAmount);
  return amounts.map((amount, i) => ({
    purchaseId: p.id,
    provider: p.provider,
    merchant: p.merchant,
    n: i + 1,
    of: p.count,
    date: installmentDate(p.firstDate, p.frequency, i),
    amount,
    ghost: !!p.ghost,
  }));
}

export function allInstallments(purchases) {
  return purchases.flatMap(buildSchedule).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Elenco dei servizi in ordine stabile (prima i servizi noti, poi gli altri
 * nell'ordine in cui compaiono): il colore segue il servizio, non la posizione.
 */
export function providerOrder(purchases, known = []) {
  const seen = new Set(purchases.map((p) => p.provider));
  const out = known.filter((k) => seen.has(k));
  for (const p of purchases) if (!out.includes(p.provider)) out.push(p.provider);
  return out;
}

/**
 * Totali per mese da `fromMonth` all'ultimo mese con una rata (mesi vuoti inclusi).
 * Ogni mese: { key, total, count, byProvider: {servizio: centesimi}, items }.
 */
export function aggregateByMonth(purchases, { fromMonth, toMonth = null } = {}) {
  const items = allInstallments(purchases).filter((it) => monthKey(it.date) >= fromMonth);
  let last = toMonth || fromMonth;
  for (const it of items) if (monthKey(it.date) > last) last = monthKey(it.date);
  if (toMonth) last = toMonth;
  const months = [];
  for (let k = fromMonth; k <= last; k = addMonthsToKey(k, 1)) {
    months.push({ key: k, total: 0, count: 0, byProvider: {}, items: [] });
    if (months.length > 240) break;
  }
  const byKey = new Map(months.map((m) => [m.key, m]));
  for (const it of items) {
    const m = byKey.get(monthKey(it.date));
    if (!m) continue;
    m.total += it.amount;
    m.count += 1;
    m.byProvider[it.provider] = (m.byProvider[it.provider] || 0) + it.amount;
    m.items.push(it);
  }
  return months;
}

/** Quanto si paga in un mese e con quali rate. */
export function monthSummary(purchases, key) {
  const [m] = aggregateByMonth(purchases, { fromMonth: key, toMonth: key });
  const providers = new Set(m.items.map((it) => it.provider));
  return { ...m, providerCount: providers.size };
}

/** Il mese dopo quello di `today`. */
export const nextMonthKey = (today) => addMonthsToKey(monthKey(today), 1);

/** Rate da oggi (compreso) ai prossimi `days` giorni. */
export function upcoming(purchases, today, days = 30) {
  const end = addDays(today, days);
  return allInstallments(purchases).filter((it) => it.date >= today && it.date <= end);
}

/** Quanto resta da pagare per servizio, da oggi in poi. */
export function remainingByProvider(purchases, today) {
  const out = {};
  for (const it of allInstallments(purchases)) {
    if (it.date >= today) out[it.provider] = (out[it.provider] || 0) + it.amount;
  }
  return out;
}

export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
