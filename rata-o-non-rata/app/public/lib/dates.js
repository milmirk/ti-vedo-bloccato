/*
 * Date come stringhe ISO "AAAA-MM-GG", calcolate in UTC: niente sorprese
 * con fusi orari o ora legale. Modulo ES puro, condiviso con i test.
 */

export const MONTHS = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];
const SHORT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const MONTH_PREFIX = { gen: 1, feb: 2, mar: 3, apr: 4, mag: 5, giu: 6, lug: 7, ago: 8, set: 9, ott: 10, nov: 11, dic: 12 };

const pad = (n) => String(n).padStart(2, "0");

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isoFromParts(y, m, d) {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parts(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

export function isValidIso(iso) {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const { y, m, d } = parts(iso);
  return isoFromParts(y, m, d) === iso;
}

export function addDays(iso, n) {
  const { y, m, d } = parts(iso);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/**
 * Aggiunge n mesi tenendo il giorno di partenza ("ancora"). Se il mese è più
 * corto, usa l'ultimo giorno: 31 gennaio → 28 (o 29) febbraio → 31 marzo.
 */
export function addMonthsClamped(iso, n, anchorDay = parts(iso).d) {
  const { y, m } = parts(iso);
  const idx = (m - 1) + n;
  const ny = y + Math.floor(idx / 12);
  const nm = ((idx % 12) + 12) % 12 + 1;
  return isoFromParts(ny, nm, Math.min(anchorDay, daysInMonth(ny, nm)));
}

export function diffDays(a, b) {
  const pa = parts(a);
  const pb = parts(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000);
}

export const monthKey = (iso) => iso.slice(0, 7);

export function addMonthsToKey(key, n) {
  const [y, m] = key.split("-").map(Number);
  const idx = (m - 1) + n;
  return `${y + Math.floor(idx / 12)}-${pad(((idx % 12) + 12) % 12 + 1)}`;
}

export function monthName(key) {
  return MONTHS[Number(key.slice(5, 7)) - 1];
}

/** "2026-11" → "novembre 2026" */
export function monthLabel(key) {
  return `${monthName(key)} ${key.slice(0, 4)}`;
}

/** "2026-11" → "nov", "2027-01" → "gen '27" se l'anno è diverso da quello di riferimento. */
export function monthShort(key, refYear) {
  const s = SHORT[Number(key.slice(5, 7)) - 1];
  return refYear && Number(key.slice(0, 4)) !== refYear ? `${s} '${key.slice(2, 4)}` : s;
}

/** "2026-11-28" → "28 novembre 2026" (senza anno se uguale a refYear). */
export function formatDateLong(iso, refYear) {
  const { y, m, d } = parts(iso);
  return refYear && y === refYear ? `${d} ${MONTHS[m - 1]}` : `${d} ${MONTHS[m - 1]} ${y}`;
}

/**
 * Data con l'articolo giusto: "il 2 dicembre", "l'8 ottobre", "dall'11 maggio".
 * `prep`: "" (il), "dal", "al".
 */
export function withArticle(iso, refYear, prep = "") {
  const d = parts(iso).d;
  const elided = d === 8 || d === 11;
  const art = { "": elided ? "l'" : "il ", dal: elided ? "dall'" : "dal ", al: elided ? "all'" : "al " }[prep] ?? "il ";
  return art + formatDateLong(iso, refYear);
}

/** Data locale di oggi in ISO (nel browser è la data del dispositivo). */
export function todayIso(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const MONTH_WORD = "(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)\\.?";
const DATE_PATTERNS = [
  // 2026-10-04
  { re: /(?<!\d)(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/g, f: (m) => [m[1], m[2], m[3]] },
  // 28/10/2026 · 28-10-2026 · 28.10.2026 · 28/10/26
  { re: /(?<![\d.,])(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})(?![\d])/g, f: (m) => [m[3], m[2], m[1]] },
  // 1° ottobre 2026 · 24 settembre 2026 · 3 nov 2026
  { re: new RegExp(`(?<!\\d)(\\d{1,2})(?:°|º)?\\s+${MONTH_WORD}\\s+(\\d{4})(?!\\d)`, "gi"), f: (m) => [m[3], m[2], m[1]] },
];

function toIso([y, m, d]) {
  let year = Number(y);
  if (String(y).length === 2) year += 2000;
  const month = /^\d+$/.test(m) ? Number(m) : MONTH_PREFIX[String(m).toLowerCase().slice(0, 3)];
  return isoFromParts(year, month, Number(d));
}

/** Legge una data in uno dei formati comuni nelle email. Null se non è una data valida. */
export function parseDate(raw) {
  const s = String(raw || "");
  for (const p of DATE_PATTERNS) {
    p.re.lastIndex = 0;
    const m = p.re.exec(s);
    if (m) {
      const iso = toIso(p.f(m));
      if (iso) return iso;
    }
  }
  return null;
}

/** Tutte le date (con anno) che compaiono nel testo. */
export function datesInText(text) {
  const s = String(text || "");
  const out = [];
  for (const p of DATE_PATTERNS) {
    for (const m of s.matchAll(p.re)) {
      const iso = toIso(p.f(m));
      if (iso) out.push({ iso, text: m[0], index: m.index });
    }
  }
  return out.sort((a, b) => a.index - b.index);
}
