/*
 * Validatore dell'estrazione fatta dall'AI. "Semplificare senza tradire":
 *
 *  - ogni importo, data e numero di rate proposto dall'AI deve comparire
 *    davvero nel testo dell'email (sono ammesse le varianti di scrittura:
 *    89,90 € = EUR 89.90; 28/10/2026 = 28 ottobre 2026; 3 = tre);
 *  - la frase sorgente mostrata alla persona la ritaglia il codice
 *    dall'email, non la scrive l'AI;
 *  - se un valore non si trova, quel campo viene scartato e la persona lo
 *    vede ("l'AI ha proposto X, ma nell'email non c'è");
 *  - se l'AI scrive un consiglio ("ti conviene", "dovresti"…), l'intera
 *    risposta viene scartata.
 *
 * L'AI non calcola mai date, rate o totali: lo fa schedule.js.
 * Modulo ES puro: lo usa il server (server/agent.mjs) e lo coprono i test.
 */
import { parseAmount, amountsInText, parseCount, countIndex, formatEuro } from "./money.js";
import { parseDate, datesInText, formatDateLong } from "./dates.js";
import { lineAt, sentenceAt, assemble } from "./parsers.js";
import { FREQUENCIES, frequencyLabel } from "./schedule.js";

const ADVICE = [
  /\bti\s+conviene\b/i,
  /\bti\s+consiglio\b/i,
  /\bti\s+consigliamo\b/i,
  /(?<!\p{L})(?:è|e'|e’)\s+meglio(?!\p{L})/iu,
  /\bdovresti\b/i,
];

/** La prima espressione di consiglio trovata nel testo, oppure null. */
export function containsAdvice(text) {
  const s = String(text || "");
  for (const re of ADVICE) {
    const m = re.exec(s);
    if (m) return m[0];
  }
  return null;
}

export class ExtractionRejected extends Error {
  constructor(reason) {
    super("Estrazione scartata: " + reason);
    this.reason = reason;
  }
}

const FREQ_WORDING = {
  mensile: /mensil\w*|ogni\s+mese|al\s+mese|cadenza\s+mensile|ogni\s+(?:1|un)\s+mese/i,
  ogni_2_settimane: /(?:2|due)\s+settimane|quindicinal\w*|(?:14|quattordici)\s+giorni/i,
  ogni_30_giorni: /(?:30|trenta)\s+giorni/i,
  settimanale: /ogni\s+settimana|settimanal\w*/i,
};

function findInsensitive(text, needle) {
  const n = String(needle || "").trim();
  if (n.length < 2) return -1;
  const i = text.indexOf(n);
  return i >= 0 ? i : text.toLowerCase().indexOf(n.toLowerCase());
}

/** Tra più occorrenze, preferisce quella dentro la citazione proposta dall'AI. */
function pick(matches, text, quote) {
  if (!matches.length) return null;
  const q = findInsensitive(text, quote);
  if (q >= 0) {
    const inside = matches.find((m) => m.index >= q && m.index <= q + String(quote).trim().length);
    if (inside) return inside;
  }
  return matches[0];
}

const str = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

/**
 * Controlla la risposta dell'AI contro il testo dell'email.
 * Restituisce lo stesso formato di parseEmail(), più `rejected` e `note`.
 */
export function verifyExtraction(raw, emailText) {
  if (!raw || typeof raw !== "object") throw new ExtractionRejected("risposta non valida");
  const text = String(emailText || "").replace(/\r\n?/g, "\n");

  // Nessun consiglio, né nella nota né in valori che non vengono dall'email.
  const note = str(raw.note);
  const adviceNote = containsAdvice(note);
  if (adviceNote) throw new ExtractionRejected(`contiene un consiglio («${adviceNote}»)`);
  for (const f of Object.values(raw)) {
    if (!f || typeof f !== "object") continue;
    for (const v of [f.value, f.quote]) {
      const a = containsAdvice(v);
      if (a && findInsensitive(text, v) < 0) throw new ExtractionRejected(`contiene un consiglio («${a}»)`);
    }
  }
  if (raw.is_installment_plan === false) {
    throw new ExtractionRejected("l'email non sembra la conferma di un acquisto a rate");
  }

  const accepted = {};
  const rejected = [];
  const reject = (field, value, reason) => rejected.push({ field, value: str(value), reason });
  const amounts = amountsInText(text);
  const dates = datesInText(text);

  for (const field of ["total", "installment_amount"]) {
    const v = str(raw[field]?.value);
    if (!v) continue;
    const key = field === "total" ? "total" : "installmentAmount";
    const cents = parseAmount(v);
    if (cents == null || cents <= 0) { reject(key, v, "non è un importo"); continue; }
    const m = pick(amounts.filter((a) => a.cents === cents), text, raw[field]?.quote);
    if (!m) { reject(key, v, `${formatEuro(cents)} non compare nell'email`); continue; }
    accepted[key] = { value: cents, source: lineAt(text, m.index) };
  }
  if (accepted.total && accepted.installmentAmount && accepted.installmentAmount.value > accepted.total.value) {
    reject("installmentAmount", formatEuro(accepted.installmentAmount.value), "la rata è più grande del totale");
    delete accepted.installmentAmount;
  }

  const c = str(raw.count?.value);
  if (c) {
    const n = parseCount(c);
    const at = n ? countIndex(text, n) : -1;
    if (!n || n > 60) reject("count", c, "non è un numero di rate");
    else if (at < 0) reject("count", c, `«${n} rate» non compare nell'email`);
    else accepted.count = { value: n, source: lineAt(text, at) };
  }

  const d = str(raw.first_date?.value);
  if (d) {
    const iso = parseDate(d);
    const m = iso ? pick(dates.filter((x) => x.iso === iso), text, raw.first_date?.quote) : null;
    if (!iso) reject("firstDate", d, "non è una data");
    else if (!m) reject("firstDate", d, `${formatDateLong(iso)} non compare nell'email`);
    else accepted.firstDate = { value: iso, source: lineAt(text, m.index) };
  }

  const kind = str(raw.frequency?.kind);
  if (kind && kind !== "non_indicata" && kind !== "altro") {
    const wording = FREQ_WORDING[kind];
    const m = wording ? wording.exec(text) : null;
    if (!FREQUENCIES[kind]) reject("frequency", kind, "frequenza non prevista");
    else if (!m) reject("frequency", frequencyLabel(kind), "nell'email non c'è scritto");
    else accepted.frequency = { value: kind, source: sentenceAt(text, m.index) };
  }

  for (const [field, key] of [["provider", "provider"], ["merchant", "merchant"]]) {
    const v = str(raw[field]?.value);
    if (!v) continue;
    const at = v.length <= 80 ? findInsensitive(text, v) : -1;
    if (at < 0) reject(key, v, "non compare nell'email");
    else accepted[key] = { value: text.slice(at, at + v.length), source: lineAt(text, at) };
  }

  const fee = str(raw.late_fee?.quote) || str(raw.late_fee?.value);
  if (fee) {
    const at = findInsensitive(text, fee);
    if (at < 0) reject("lateFee", fee, "la frase non compare nell'email");
    else {
      const s = sentenceAt(text, at);
      accepted.lateFee = { value: s, source: s };
    }
  }

  const { purchase, missing } = assemble(accepted, { origin: "ai" });
  purchase.emailText = text;
  return {
    status: missing.length ? "incompleta" : "da_controllare",
    parser: "ai",
    purchase,
    missing,
    rejected,
    note: note.length <= 240 ? note : "",
  };
}
