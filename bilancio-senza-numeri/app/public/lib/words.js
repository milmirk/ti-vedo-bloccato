/*
 * Dai centesimi alle parole.
 *
 * Regola del prodotto: con «Mostra anche gli euro» spento, nessuna stringa
 * prodotta qui contiene cifre, il simbolo € o la parola "euro". Le quantità
 * di oggetti si scrivono in lettere ("due pizze") e le date con il nome del
 * giorno. Il test words.test.mjs lo verifica su molte situazioni diverse.
 */
import { decompose } from "./units.js";
import { WEEKDAYS, MONTHS, weekday, parts as dateParts, daysBetween } from "./dates.js";

const SMALL = ["zero", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci",
  "undici", "dodici", "tredici", "quattordici", "quindici", "sedici", "diciassette", "diciotto", "diciannove"];
const TENS = ["", "", "venti", "trenta", "quaranta", "cinquanta", "sessanta", "settanta", "ottanta", "novanta"];

function below100(n) {
  if (n < 20) return SMALL[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  let w = TENS[t];
  if (u === 0) return w;
  if (u === 1 || u === 8) w = w.slice(0, -1); // ventuno, ventotto
  return w + (u === 3 ? "tré" : SMALL[u]);
}

function below1000(n) {
  if (n < 100) return below100(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  const hw = h === 1 ? "cento" : SMALL[h] + "cento";
  if (r === 0) return hw;
  const rw = r === 3 ? "tré" : below100(r);
  return Math.floor(r / 10) === 8 ? hw.slice(0, -1) + rw : hw + rw; // centottanta
}

/**
 * Un numero intero in lettere: 1 → "uno"/"una", 23 → "ventitré".
 * @param {number} n
 * @param {"m"|"f"} [g]
 */
export function numberWord(n, g = "m") {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (n === 1) return g === "f" ? "una" : "uno";
  if (n < 1000) return below1000(n);
  if (n < 1000000) {
    const th = Math.floor(n / 1000);
    const r = n % 1000;
    const tw = th === 1 ? "mille" : below1000(th) + "mila";
    return r ? tw + (r === 3 ? "tré" : below1000(r)) : tw;
  }
  return "moltissimi";
}

/** Il giorno del mese in lettere: il primo si dice «primo». */
export function dayWord(d) {
  return d === 1 ? "primo" : numberWord(d);
}

/** "un caffè", "due pizze", "ventuno pranzi fuori" */
export function countPhrase(count, unit) {
  if (count === 1) return unit.one;
  return `${numberWord(count, unit.g)} ${unit.plural}`;
}

/** ["a", "b", "c"] → "a, b e c" */
export function listPhrase(items) {
  const xs = items.filter(Boolean);
  if (xs.length <= 1) return xs[0] || "";
  return `${xs.slice(0, -1).join(", ")} e ${xs[xs.length - 1]}`;
}

/** 18640 → "186,40 €"; i numeri compaiono solo quando la persona li chiede. */
export function formatEuro(cents) {
  const neg = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const intPart = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${neg ? "−" : ""}${intPart},${String(abs % 100).padStart(2, "0")} €`;
}

/**
 * Il verbo va al singolare? Sì per un oggetto solo ("ti resta un caffè"),
 * per i soli spiccioli e per il niente; no per tutto il resto.
 */
export function isSingular(dec, { spiccioli = true } = {}) {
  if (!dec.parts.length) return true;
  return dec.parts.length === 1 && dec.parts[0].count === 1 && !(spiccioli && dec.rest > 0);
}

/**
 * Una scomposizione in parole.
 * @param {{parts: {unit: object, count: number}[], rest: number}} dec
 * @param {{spiccioli?: boolean}} [opt]
 */
export function partsPhrase(dec, { spiccioli = true } = {}) {
  const words = dec.parts.map((p) => countPhrase(p.count, p.unit));
  if (spiccioli && dec.rest > 0) {
    if (!words.length) return "solo qualche spicciolo";
    words.push("qualche spicciolo");
  }
  return words.length ? listPhrase(words) : "niente";
}

/**
 * Una cifra raccontata con gli oggetti scelti, con gli euro solo se richiesti.
 * @param {number} cents
 * @param {object[]} units
 * @param {{euro?: boolean, maxParts?: number, spiccioli?: boolean}} [opt]
 */
export function amountPhrase(cents, units, { euro = false, maxParts = Infinity, spiccioli = true } = {}) {
  const text = partsPhrase(decompose(cents, units, maxParts), { spiccioli: spiccioli && maxParts === Infinity });
  return euro ? `${text} (${formatEuro(cents)})` : text;
}

/** "tra cinque giorni", "domani", "oggi" */
export function distancePhrase(days, { euro = false } = {}) {
  if (days <= 0) return "oggi";
  if (days === 1) return "domani";
  return `tra ${euro ? days : numberWord(days)} giorni`;
}

/**
 * Il nome di un giorno: entro una settimana basta il giorno della settimana
 * ("venerdì"), più in là serve anche il giorno del mese, in lettere.
 */
export function dayName(isoDate, todayISO, { euro = false } = {}) {
  const diff = daysBetween(todayISO, isoDate);
  const wd = WEEKDAYS[weekday(isoDate)];
  if (diff === 0) return "oggi";
  if (diff === 1) return "domani";
  if (diff === -1) return "ieri";
  if (diff > 1 && diff <= 6) return wd;
  if (diff < -1 && diff >= -6) return wd;
  const { d, m } = dateParts(isoDate);
  return `${wd} ${euro ? d : dayWord(d)} ${MONTHS[m - 1]}`;
}

/** "martedì sei ottobre", "domenica primo novembre" */
export function dateWords(isoDate) {
  const { d, m } = dateParts(isoDate);
  return `${WEEKDAYS[weekday(isoDate)]} ${dayWord(d)} ${MONTHS[m - 1]}`;
}

/** "Fino a venerdì · tra cinque giorni" */
export function paydayPhrase(todayISO, paydayISO, { euro = false } = {}) {
  const days = daysBetween(todayISO, paydayISO);
  if (days <= 0) return "Oggi è il giorno di paga";
  if (days === 1) return "Fino a domani: domani è il giorno di paga";
  const wd = WEEKDAYS[weekday(paydayISO)];
  const { d, m } = dateParts(paydayISO);
  const when = euro ? `${wd} ${d} ${MONTHS[m - 1]}` : days <= 6 ? wd : `${wd} ${dayWord(d)} ${MONTHS[m - 1]}`;
  return `Fino a ${when} · ${distancePhrase(days, { euro })}`;
}

/** Controllo usato dai test: una stringa "senza numeri" non ha cifre né euro. */
export function hasNumbers(s) {
  return /\d|€|\beuro\b/i.test(String(s));
}

/** Prima lettera maiuscola. */
export function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
