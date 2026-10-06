/*
 * Importi: sempre in centesimi interi, mai numeri decimali nei calcoli.
 * Modulo ES puro: lo usano il browser, il server e i test in Node.
 */

const CURRENCY = /€|\bEUR\b|\beuro\b/i;

/**
 * Legge un importo scritto all'italiana o all'inglese e lo restituisce in centesimi.
 *   "89,90 €" → 8990 · "€ 1.234,50" → 123450 · "EUR 64.50" → 6450 · "120" → 12000
 * Restituisce null se il testo non è un importo leggibile.
 */
export function parseAmount(raw) {
  if (raw == null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) && raw >= 0 ? Math.round(raw * 100) : null;
  const m = String(raw).replace(/[  ]/g, " ").match(/\d[\d.,' ]*/);
  if (!m) return null;
  let s = m[0].replace(/[ ']/g, "").replace(/[.,]+$/, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let intPart = s;
  let decPart = "";
  if (lastComma >= 0 && lastDot >= 0) {
    const idx = Math.max(lastComma, lastDot);
    intPart = s.slice(0, idx).replace(/[.,]/g, "");
    decPart = s.slice(idx + 1);
  } else if (lastComma >= 0 || lastDot >= 0) {
    const parts = s.split(lastComma >= 0 ? "," : ".");
    const last = parts[parts.length - 1];
    if (parts.length === 2 && last.length >= 1 && last.length <= 2) {
      intPart = parts[0];
      decPart = last;
    } else if (parts.slice(1).every((p) => p.length === 3)) {
      intPart = parts.join(""); // separatore delle migliaia
    } else {
      return null;
    }
  }
  if (!/^\d+$/.test(intPart) || (decPart && !/^\d{1,2}$/.test(decPart))) return null;
  return Number(intPart) * 100 + Number((decPart + "00").slice(0, 2));
}

/** 8990 → "89,90 €" (con spazio unificatore prima di €). */
export function formatEuro(cents, { sign = false } = {}) {
  const n = Math.round(Number(cents) || 0);
  const abs = Math.abs(n);
  const euros = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const dec = String(abs % 100).padStart(2, "0");
  const pre = n < 0 ? "−" : sign && n > 0 ? "+" : "";
  return `${pre}${euros},${dec} €`;
}

/** Importo arrotondato all'euro, per le etichette dei grafici: 24537 → "245 €". */
export function formatEuroShort(cents) {
  const euros = String(Math.round((Number(cents) || 0) / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${euros} €`;
}

// Un numero che non fa parte di una data (28/10/2026, 2026-10-04, 28.10.2026) né di un numero più lungo.
const MONEY_TOKEN = /(?<![\d.,/\-])(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?![\d]|[.,/\-]\d)/g;

/**
 * Tutti gli importi che compaiono nel testo, in centesimi.
 * Vale come importo solo un numero con i decimali (89,90) o con il simbolo
 * della valuta accanto (€ 120, 120 euro): così "28" di una data non conta.
 */
export function amountsInText(text) {
  const s = String(text || "").replace(/[  ]/g, " ");
  const out = [];
  for (const m of s.matchAll(MONEY_TOKEN)) {
    const before = s.slice(Math.max(0, m.index - 6), m.index);
    const after = s.slice(m.index + m[0].length, m.index + m[0].length + 7);
    const hasDecimals = /[.,]\d{1,2}$/.test(m[0]) && !/^\d{1,3}(\.\d{3})+$/.test(m[0]);
    if (!hasDecimals && !CURRENCY.test(before) && !CURRENCY.test(after)) continue;
    const cents = parseAmount(m[0]);
    if (cents != null) out.push({ cents, text: m[0], index: m.index });
  }
  return out;
}

const WORDS = {
  una: 1, uno: 1, un: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9,
  dieci: 10, undici: 11, dodici: 12, diciotto: 18, ventiquattro: 24, trentasei: 36,
};

/** "3", "tre", "3 rate" → 3. Null se non è un numero intero da 1 a 99. */
export function parseCount(raw) {
  if (raw == null) return null;
  if (typeof raw === "number") return Number.isInteger(raw) && raw > 0 && raw < 100 ? raw : null;
  const s = String(raw).trim().toLowerCase();
  const d = s.match(/^\d{1,2}(?!\d)/);
  if (d) return Number(d[0]) > 0 ? Number(d[0]) : null;
  const w = s.match(/^[a-zà]+/);
  return w && WORDS[w[0]] ? WORDS[w[0]] : null;
}

/**
 * Il numero di rate compare davvero nel testo, vicino a una parola come
 * "rate", "pagamenti", "addebiti"? Accetta cifre ("4 rate") e lettere ("quattro rate").
 */
export function countAppears(text, n) {
  return countIndex(text, n) >= 0;
}

/** Posizione nel testo in cui compare il numero di rate (o -1). */
export function countIndex(text, n) {
  const s = String(text || "").toLowerCase();
  const forms = [String(n), ...Object.entries(WORDS).filter(([, v]) => v === n).map(([k]) => k)];
  const unit = "(?:rat[ae]|pagament[io]|addebit[io]|quot[ae]|mensilit[aà])";
  let best = -1;
  for (const f of forms) {
    const word = `(?<![\\w.,/-])(${f})(?![\\w]|[.,/-]\\d)`;
    const patterns = [[new RegExp(`${word}[^.\\n]{0,24}?${unit}`), "first"], [new RegExp(`${unit}[^.\\n]{0,24}?${word}`), "last"]];
    for (const [re, where] of patterns) {
      const m = re.exec(s);
      if (m) {
        const at = m.index + (where === "first" ? m[0].indexOf(m[1]) : m[0].lastIndexOf(m[1]));
        if (best < 0 || at < best) best = at;
      }
    }
  }
  return best;
}
