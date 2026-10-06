/*
 * SECCI Lens · controlli sui testi che arrivano alla persona.
 *
 *  - findAdvice:    trova frasi che suonano come un consiglio ("ti conviene",
 *                   "ti consiglio", "è meglio", "scegli", "dovresti"…).
 *                   Il tema vieta consulenza e indicazioni su cosa scegliere.
 *  - findRanking:   parole che mettono in classifica due offerte.
 *  - checkNumbers:  ogni numero di un testo deve comparire nei dati del
 *                   documento o nei calcoli del codice (con le varianti di
 *                   formato italiane: 600 = 600,00; 1.145,62 = 1145,62).
 *
 * Usati dal server sulle risposte dell'AI e dai test sui testi a regole.
 */
import { roundTo } from "./finance.js";

const fold = (s) => String(s ?? "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[’`]/g, "'")
  .toLowerCase();

export const ADVICE_PATTERNS = [
  /\bti conviene\b/, /\bconvien[ea]\b/, /\bconvenient[ei]\b/, /\bconvenienza\b/,
  /\bti consiglio\b/, /\bconsigli(?:o|amo|ato|ata|ati|abile|abili)\b/, /\bti suggerisco\b/, /\bsuggeriamo\b/, /\braccomand/,
  /\b(?:e|sarebbe|e' sempre) meglio\b/, /\bmeglio (?:scegliere|prendere|firmare|evitare|aspettare|rinunciare)\b/,
  /\bmigliore\b/, /\bmigliori\b/, /\bpeggiore\b/, /\bpeggiori\b/,
  /\bscegli\b/, /\bscegliere\b/, /\bscegliete\b/, /\bdovresti\b/, /\bdovreste\b/,
  /\bdevi (?:firmare|scegliere|prendere|accettare|rifiutare|chiedere)\b/,
  /\bfirma (?:pure|subito|tranquill)/, /\bnon firmare\b/, /\bevita\b/, /\bevitalo\b/,
  /\bvantaggios[oaie]\b/, /\baffare\b/, /\bprendi (?:questa|quella|l'offerta)\b/,
];

/** Restituisce la frase che suona come un consiglio, o null. */
export function findAdvice(text) {
  const t = fold(text);
  for (const re of ADVICE_PATTERNS) {
    const m = re.exec(t);
    if (m) return m[0];
  }
  return null;
}

export const RANKING_RE = /migliore|migliori|peggiore|peggiori|convien|convenient|vantaggi|meglio|peggio|scegli|consigli|affare|risparmi|preferibil|raccomand|vincente|perdente/;
export const findRanking = (text) => RANKING_RE.exec(fold(text))?.[0] ?? null;

// ── Numeri ──────────────────────────────────────────────────────────────

const NUM_IN_TEXT = /(?<!\d|\d[.,])(?:\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?)(?!\d|[.,]\d)/g;

/** Tutte le letture possibili di un numero scritto: "1.234" può essere 1234 o 1,234. */
export function readings(raw) {
  const s = String(raw);
  const out = new Set();
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) out.add(Number(s.replace(/\./g, "").replace(",", ".")));
  if (/^\d+,\d+$/.test(s)) out.add(Number(s.replace(",", ".")));
  if (/^\d+\.\d+$/.test(s)) out.add(Number(s));
  if (/^\d+$/.test(s)) out.add(Number(s));
  return [...out].filter(Number.isFinite);
}

export function numbersIn(text) {
  return [...String(text ?? "").matchAll(NUM_IN_TEXT)].map((m) => ({ raw: m[0], values: readings(m[0]) }));
}

const keyOf = (n) => Math.round(roundTo(n, 2) * 100);

// Conversioni di tempo sempre ammesse ("1 anno", "12 mesi").
const ALWAYS = [1, 12];

/**
 * Insieme dei numeri ammessi: tutti quelli scritti nel documento più quelli
 * calcolati dal codice (analysis di finance.js), arrotondati come li mostriamo.
 */
export function allowedNumbers(docText, analysis) {
  const set = new Set(ALWAYS.map(keyOf));
  const add = (n) => { if (Number.isFinite(n)) set.add(keyOf(n)); };
  for (const { values } of numbersIn(docText)) values.forEach(add);
  if (analysis) {
    const a = analysis;
    [a.creditAmount, a.totalDue, a.totalCost, a.interestTotal, a.feesTotal, a.upfront,
      a.installments?.count, a.installments?.amount, a.durationMonths].forEach(add);
    // "16 mesi (1 anno e 4 mesi)": anni e mesi restanti, come li scrive formatMonths.
    if (a.durationMonths >= 12) { add(Math.floor(a.durationMonths / 12)); add(a.durationMonths % 12); }
    add(roundTo(a.taeg, 2)); add(roundTo(a.taeg, 1));
    for (const f of a.fees || []) { add(f.amount); add(f.total); }
    for (const r of a.schedule || []) add(roundTo(r.total, 2));
    for (const c of a.checks || []) { add(c.computed); add(c.declared); }
  }
  return set;
}

/** { ok, unknown } — unknown sono i numeri del testo che non hanno riscontro. */
export function checkNumbers(text, allowed) {
  const unknown = numbersIn(text)
    .filter(({ values }) => !values.some((v) => allowed.has(keyOf(v))))
    .map(({ raw }) => raw);
  return { ok: unknown.length === 0, unknown };
}
