/*
 * Date senza sorprese: tutte le date sono stringhe "AAAA-MM-GG" e i conti si
 * fanno in UTC, così il cambio dell'ora legale non sposta mai un giorno.
 */

const DAY_MS = 86400000;

export const WEEKDAYS = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
export const WEEKDAYS_SHORT = ["D", "L", "M", "M", "G", "V", "S"];
export const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

const pad = (n) => String(n).padStart(2, "0");

export function isISODate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

export function iso(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parts(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return { y, m, d };
}

function toMs(isoDate) {
  const { y, m, d } = parts(isoDate);
  return Date.UTC(y, m - 1, d);
}

function fromMs(ms) {
  const dt = new Date(ms);
  return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** Il giorno di oggi secondo l'orologio locale della persona. */
export function localTodayISO(date = new Date()) {
  return iso(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function addDays(isoDate, n) {
  return fromMs(toMs(isoDate) + n * DAY_MS);
}

/** Giorni di calendario da `from` a `to` (negativo se `to` è prima). */
export function daysBetween(from, to) {
  return Math.round((toMs(to) - toMs(from)) / DAY_MS);
}

/** @param {number} m mese 1..12 */
export function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 0 = domenica … 6 = sabato */
export function weekday(isoDate) {
  return new Date(toMs(isoDate)).getUTCDay();
}

/**
 * Il prossimo giorno di paga.
 *  - { type: "date", date }   una data precisa
 *  - { type: "monthly", day } "il 27 di ogni mese": se il mese è più corto
 *    si usa l'ultimo giorno (il 31 a febbraio diventa il 28 o il 29).
 * Se oggi è proprio il giorno di paga, i soldi sono appena arrivati e il
 * prossimo è quello del mese dopo.
 */
export function nextPayday(todayISO, rule) {
  if (!rule) throw new Error("regola del giorno di paga mancante");
  if (rule.type === "date") {
    if (!isISODate(rule.date)) throw new Error("data non valida");
    return rule.date;
  }
  const day = Math.min(31, Math.max(1, Math.floor(Number(rule.day) || 1)));
  const { y, m, d } = parts(todayISO);
  const thisMonth = Math.min(day, daysInMonth(y, m));
  if (d < thisMonth) return iso(y, m, thisMonth);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return iso(ny, nm, Math.min(day, daysInMonth(ny, nm)));
}

/**
 * Quanti giorni devono bastare i soldi: oggi compreso, il giorno di paga
 * escluso (quel giorno arrivano quelli nuovi). Mai meno di uno.
 */
export function spendDays(todayISO, paydayISO) {
  return Math.max(1, daysBetween(todayISO, paydayISO));
}

/**
 * Le settimane di un mese per il calendario, dal lunedì alla domenica.
 * Le caselle fuori dal mese sono null.
 */
export function monthGrid(y, m) {
  const first = weekday(iso(y, m, 1));
  const lead = (first + 6) % 7; // lunedì = 0
  const cells = Array(lead).fill(null);
  for (let d = 1; d <= daysInMonth(y, m); d++) cells.push(iso(y, m, d));
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
