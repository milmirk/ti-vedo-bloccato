/*
 * SECCI Lens · lettura deterministica del modulo SECCI
 * («Informazioni europee di base sul credito ai consumatori»).
 *
 * Cerca le etichette standard del modulo (a inizio riga) e prende il valore
 * nelle righe subito dopo. Per ogni valore restituisce:
 *   - value   il numero (o testo) interpretato dal codice
 *   - raw     i caratteri esatti del documento ("600,00 €")
 *   - source  il brano esatto del documento da cui viene (etichetta + valore)
 *   - start / end, valueStart / valueEnd  posizioni nel testo, per evidenziarlo
 *
 * Nessuna AI: per i documenti standard basta questo. Per i testi non standard
 * il server può chiedere a Claude le citazioni, che passano da fromAiFields():
 * ogni citazione deve comparire nel documento e i numeri li interpreta il codice.
 */
import { parseItNumber, decimalsOf } from "./finance.js";

const NUM = String.raw`\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?`;
// Un numero non deve essere un pezzo di un numero più lungo: niente cifre
// attaccate prima o dopo (la virgola seguita da spazio è punteggiatura).
const NB = String.raw`(?<!\d|\d[.,])`;
const NA = String.raw`(?!\d|[.,]\d)`;
const AMOUNT = String.raw`(?:(?:€|EUR\b|Euro\b)\s*(${NUM})${NA}|${NB}(${NUM})\s*(?:€|EUR\b|euro\b))`;
const AMOUNT_RE = new RegExp(AMOUNT, "i");
const PCT_RE = new RegExp(NB + String.raw`(\d+(?:[.,]\d+)?)\s*%`);
const DURATION_RE = new RegExp(NB + String.raw`(\d+)\s*(mesi|mese|anni|anno)\b`, "i");
const FREQ = { mensili: 12, bimestrali: 6, trimestrali: 4, semestrali: 2, annuali: 1 };
const INST_RE = new RegExp(
  String.raw`(?:n\.\s*)?${NB}(\d+)\s+rate(?:\s+(mensili|bimestrali|trimestrali|semestrali|annuali))?(?:\s+costanti)?\s+(?:da|di)\s+` + AMOUNT,
  "i"
);

// Etichetta a inizio riga, con eventuale punto elenco davanti.
const L = (label) => new RegExp(String.raw`^[ \t]*(?:[-•*·][ \t]*)?(${label})`, "im");

export const LABELS = {
  lender: [L(String.raw`Finanziatore\b`)],
  intermediary: [L(String.raw`Intermediario del credito\b`)],
  productType: [L(String.raw`Tipo di contratto di credito`)],
  creditAmount: [L(String.raw`Importo totale del credito`)],
  duration: [L(String.raw`Durata del contratto di credito`), L(String.raw`Durata del (?:finanziamento|prestito)`)],
  installments: [L(String.raw`Rate ed,? eventualmente,? loro ordine di imputazione`), L(String.raw`(?:Numero e importo delle )?Rate\b`)],
  installmentCount: [L(String.raw`Numero (?:delle )?rate`)],
  installmentAmount: [L(String.raw`Importo (?:della |di ogni |di ciascuna )?rata`)],
  totalDue: [L(String.raw`Importo totale dovuto dal consumatore`), L(String.raw`Importo totale dovuto`)],
  goods: [L(String.raw`Beni o servizi`), L(String.raw`Bene finanziato`)],
  tan: [L(String.raw`Tasso di interesse`), L(String.raw`Tasso annuo nominale`), L(String.raw`TAN\b`)],
  taeg: [L(String.raw`Tasso annuo effettivo globale`), L(String.raw`TAEG\b`)],
  fee_istruttoria: [L(String.raw`Spese (?:di |per l['’])?istruttoria`)],
  fee_bollo: [L(String.raw`Imposta di bollo`)],
  fee_imposta: [L(String.raw`Imposta sostitutiva`)],
  fee_incasso: [L(String.raw`(?:Spese|Commission[ei]) (?:di |per (?:l['’])?)?incasso(?: della| delle| di ogni| per)? rat[ae]`)],
};

// Righe che chiudono la ricerca di un valore: non sono dati che leggiamo, ma
// non vogliamo che un valore venga preso da lì (per esempio le spese di sollecito).
const STOPS = [
  L(String.raw`Condizioni di prelievo`), L(String.raw`Garanzie richieste`), L(String.raw`Costi connessi`),
  L(String.raw`Costi in caso di ritardo`), L(String.raw`Tasso di mora`), L(String.raw`Interessi di mora`),
  L(String.raw`Diritto di recesso`), L(String.raw`Rimborso anticipato`), L(String.raw`Spese per (?:le )?comunicazioni`),
  L(String.raw`Altri (?:importanti )?aspetti`), L(String.raw`Per ottenere il credito`), L(String.raw`\d+\.\s+\S`),
];

export const FEE_NAMES = {
  istruttoria: "Spese di istruttoria",
  bollo: "Imposta di bollo",
  imposta: "Imposta sostitutiva",
  incasso: "Spese di incasso rata",
  altro: "Altre spese",
};

export const FIELD_NAMES = {
  creditAmount: "Importo totale del credito",
  duration: "Durata del contratto di credito",
  installments: "Rate",
  totalDue: "Importo totale dovuto dal consumatore",
  tan: "Tasso di interesse (TAN)",
  taeg: "Tasso annuo effettivo globale (TAEG)",
  lender: "Finanziatore",
};

export const IMPORTANT = ["creditAmount", "installments", "duration", "totalDue", "tan", "taeg"];

export function normalizeText(text) {
  return String(text ?? "").replace(/\r\n?/g, "\n");
}

const lineEnd = (text, pos) => {
  const i = text.indexOf("\n", pos);
  return i === -1 ? text.length : i;
};

function findFirst(text, regexes) {
  for (const re of regexes) {
    const m = re.exec(text);
    if (m) {
      const start = m.index + m[0].length - m[1].length;
      return { start, end: m.index + m[0].length };
    }
  }
  return null;
}

/** Quando si paga una spesa, letto dalle parole del documento. */
export function detectTiming(snippet, kind) {
  const s = String(snippet || "").toLowerCase();
  if (/prima rata/.test(s)) return { timing: "first", assumed: false };
  if (/(ogni|ciascuna|per) rata|ogni pagamento|ciascun pagamento|al mese\b|mensil/.test(s.replace(/incasso( della| delle)? rat[ae]/, ""))) {
    return { timing: "each", assumed: false };
  }
  if (/firma|stipula|sottoscrizione|erogazione|conclusione del contratto|trattenut/.test(s)) return { timing: "start", assumed: false };
  if (kind === "incasso") return { timing: "each", assumed: false };
  return { timing: "start", assumed: true };
}

function amountIn(window) {
  const m = AMOUNT_RE.exec(window);
  if (!m) return null;
  const numRaw = m[1] ?? m[2];
  return { value: parseItNumber(numRaw), raw: m[0], index: m.index, length: m[0].length };
}

/**
 * Legge il testo di un SECCI. Restituisce i campi trovati con il brano di
 * origine, le spese, l'elenco dei campi importanti non trovati.
 */
export function parseSecci(input) {
  const text = normalizeText(input);
  const found = {};
  for (const [key, regexes] of Object.entries(LABELS)) {
    const hit = findFirst(text, regexes);
    if (hit) found[key] = hit;
  }
  const bounds = Object.values(found).map((h) => h.start);
  for (const re of STOPS) {
    const g = new RegExp(re.source, "gim");
    let m;
    while ((m = g.exec(text))) {
      bounds.push(m.index + m[0].length - m[1].length);
      if (m[0].length === 0) g.lastIndex++;
    }
  }
  bounds.sort((a, b) => a - b);

  // Il valore va cercato nella riga dell'etichetta e nelle tre successive,
  // senza superare l'etichetta seguente.
  const windowOf = (hit) => {
    const next = bounds.find((b) => b > hit.start) ?? text.length;
    let e = lineEnd(text, hit.end);
    for (let i = 0; i < 3 && e < text.length; i++) e = lineEnd(text, e + 1);
    const end = Math.min(next, e, hit.end + 600);
    return { from: hit.end, text: text.slice(hit.end, Math.max(hit.end, end)) };
  };
  const make = (hit, valueStart, valueLen, extra) => {
    const valueEnd = valueStart + valueLen;
    const end = Math.max(lineEnd(text, valueEnd), valueEnd);
    return { ...extra, source: text.slice(hit.start, end).trimEnd(), start: hit.start, end, valueStart, valueEnd, origin: "regole" };
  };

  const fields = {};
  const amountField = (key) => {
    if (!found[key]) return;
    const w = windowOf(found[key]);
    const a = amountIn(w.text);
    if (a && Number.isFinite(a.value)) fields[key] = make(found[key], w.from + a.index, a.length, { value: a.value, raw: a.raw });
  };
  const pctField = (key) => {
    if (!found[key]) return;
    const w = windowOf(found[key]);
    const m = PCT_RE.exec(w.text);
    if (m) fields[key] = make(found[key], w.from + m.index, m[0].length, { value: parseItNumber(m[1]), raw: m[0], decimals: decimalsOf(m[0]) });
  };
  const textField = (key) => {
    if (!found[key]) return;
    const w = windowOf(found[key]);
    const m = /^[ \t]*[:\-–][ \t]*([^\n]*\S)/.exec(w.text) || /^[ \t]+([^\n]*\S)/.exec(w.text) || /^[ \t]*\n[ \t]*([^\n]*\S)/.exec(w.text);
    if (m) {
      const value = m[1].trim();
      fields[key] = make(found[key], w.from + m.index + m[0].length - m[1].length, m[1].length, { value, raw: value });
    }
  };

  textField("lender");
  textField("intermediary");
  textField("productType");
  textField("goods");
  amountField("creditAmount");
  amountField("totalDue");
  pctField("tan");
  pctField("taeg");

  // Il TAN a volte è scritto solo come "TAN fisso 0,00%" dentro un'altra riga.
  if (!fields.tan) {
    const m = new RegExp(String.raw`\bTAN\b[^%\n]{0,40}?` + PCT_RE.source).exec(text);
    if (m) {
      const vs = m.index + m[0].lastIndexOf(m[1]);
      const hit = { start: m.index, end: m.index + 3 };
      fields.tan = make(hit, vs, m[0].length - (vs - m.index), { value: parseItNumber(m[1]), raw: text.slice(vs, m.index + m[0].length), decimals: decimalsOf(m[0]) });
    }
  }

  if (found.duration) {
    const w = windowOf(found.duration);
    const m = DURATION_RE.exec(w.text);
    if (m) {
      const n = Number(m[1]);
      const months = /ann/i.test(m[2]) ? n * 12 : n;
      fields.duration = make(found.duration, w.from + m.index, m[0].length, { months, raw: m[0] });
    }
  }

  if (found.installments) {
    const w = windowOf(found.installments);
    const m = INST_RE.exec(w.text);
    if (m) {
      const amount = parseItNumber(m[3] ?? m[4]);
      fields.installments = make(found.installments, w.from + m.index, m[0].length, {
        count: Number(m[1]), amount, periodsPerYear: FREQ[(m[2] || "mensili").toLowerCase()] || 12, raw: m[0],
      });
    }
  }
  // Variante con due righe separate: «Numero rate: 10» e «Importo rata: 60,00 €».
  if (!fields.installments && found.installmentCount && found.installmentAmount) {
    const wc = windowOf(found.installmentCount);
    const mc = new RegExp(NB + String.raw`(\d+)` + NA).exec(wc.text);
    const wa = windowOf(found.installmentAmount);
    const a = amountIn(wa.text);
    if (mc && a) {
      const f = make(found.installmentAmount, wa.from + a.index, a.length, { count: Number(mc[1]), amount: a.value, periodsPerYear: 12, raw: a.raw });
      f.countSource = make(found.installmentCount, wc.from + mc.index, mc[0].length, {}).source;
      fields.installments = f;
    }
  }

  const fees = [];
  for (const kind of ["istruttoria", "bollo", "imposta", "incasso"]) {
    const hit = found["fee_" + kind];
    if (!hit) continue;
    const w = windowOf(hit);
    const a = amountIn(w.text);
    if (!a || !Number.isFinite(a.value)) continue;
    const f = make(hit, w.from + a.index, a.length, { kind, label: FEE_NAMES[kind], amount: a.value, raw: a.raw });
    Object.assign(f, detectTiming(f.source, kind));
    fees.push(f);
  }
  fees.sort((a, b) => a.start - b.start);

  const missing = IMPORTANT.filter((k) => !fields[k]);
  const labelsFound = Object.keys(found).length;
  return {
    text,
    fields,
    fees,
    missing,
    isSecci: labelsFound >= 3 || /credito ai consumatori/i.test(text),
    complete: !!(fields.creditAmount && fields.installments),
    origin: "regole",
  };
}

/** Dal risultato della lettura ai dati per i calcoli (finance.js). */
export function toCredit(parsed) {
  const f = parsed?.fields || {};
  if (!f.creditAmount || !f.installments) return null;
  return {
    credit: {
      creditAmount: f.creditAmount.value,
      installments: { count: f.installments.count, amount: f.installments.amount, periodsPerYear: f.installments.periodsPerYear || 12 },
      durationMonths: f.duration?.months,
      fees: (parsed.fees || []).map(({ kind, label, amount, timing }) => ({ kind, label, amount, timing })),
    },
    declared: {
      taeg: f.taeg?.value,
      taegDecimals: f.taeg?.decimals,
      totalDue: f.totalDue?.value,
      tan: f.tan?.value,
    },
  };
}

// ── Citazioni dell'AI: verificate sul documento ────────────────────────

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Trova `needle` nel testo tollerando spazi, a capo e apostrofi diversi. Restituisce la posizione esatta. */
export function locate(text, needle) {
  const n = String(needle ?? "").trim();
  if (n.length < 2) return null;
  const pattern = n
    .split(/\s+/)
    .map((part) => esc(part).replace(/['’`]/g, "['’`]").replace(/€/g, "€"))
    .join(String.raw`\s+`);
  const m = new RegExp(pattern, "i").exec(text);
  return m ? { start: m.index, end: m.index + m[0].length } : null;
}

const squash = (s) => String(s ?? "").replace(/[’`]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
export const appearsIn = (needle, hay) => squash(needle).length > 0 && squash(hay).includes(squash(needle));

const firstNumber = (s) => {
  const m = new RegExp(NB + String.raw`(${NUM}|\d+[.,]\d+)`).exec(String(s ?? ""));
  return m ? parseItNumber(m[1]) : NaN;
};

/**
 * Converte la risposta dell'AI (solo citazioni e testi copiati dal documento)
 * nello stesso formato di parseSecci. Ogni citazione deve comparire nel
 * documento, ogni valore dentro la sua citazione; i numeri li legge il codice.
 * Quello che non passa i controlli finisce in `rejected` e non viene usato.
 */
export function fromAiFields(input, ai) {
  const text = normalizeText(input);
  const fields = {};
  const fees = [];
  const rejected = [];
  const src = ai && typeof ai === "object" ? ai : {};
  const F = src.fields && typeof src.fields === "object" ? src.fields : {};

  const verify = (key, quote, ...values) => {
    if (!quote || values.some((v) => !String(v ?? "").trim())) return null;
    const loc = locate(text, quote);
    if (!loc) { rejected.push({ key, reason: "la citazione non compare nel documento" }); return null; }
    const verbatim = text.slice(loc.start, loc.end);
    for (const v of values) {
      if (!appearsIn(v, verbatim)) { rejected.push({ key, reason: `«${v}» non compare nella citazione` }); return null; }
    }
    const vloc = locate(verbatim, values[values.length - 1]) || { start: 0, end: verbatim.length };
    return {
      source: verbatim, start: loc.start, end: loc.end,
      valueStart: loc.start + vloc.start, valueEnd: loc.start + vloc.end, origin: "ai",
    };
  };
  const num = (key, v) => {
    const n = firstNumber(v);
    if (!Number.isFinite(n)) rejected.push({ key, reason: `«${v}» non è un numero` });
    return n;
  };

  for (const key of ["creditAmount", "totalDue"]) {
    const f = F[key];
    const ok = f && verify(key, f.quote, f.value_text);
    if (!ok) continue;
    const value = num(key, f.value_text);
    if (Number.isFinite(value)) fields[key] = { ...ok, value, raw: String(f.value_text).trim() };
  }
  for (const key of ["tan", "taeg"]) {
    const f = F[key];
    const ok = f && verify(key, f.quote, f.value_text);
    if (!ok) continue;
    const value = num(key, f.value_text);
    if (Number.isFinite(value)) fields[key] = { ...ok, value, raw: String(f.value_text).trim(), decimals: decimalsOf(f.value_text) };
  }
  {
    const f = F.duration;
    const ok = f && verify("duration", f.quote, f.value_text);
    const m = ok && DURATION_RE.exec(String(f.value_text));
    if (ok && m) fields.duration = { ...ok, months: /ann/i.test(m[2]) ? Number(m[1]) * 12 : Number(m[1]), raw: String(f.value_text).trim() };
    else if (ok) rejected.push({ key: "duration", reason: `«${f.value_text}» non è una durata` });
  }
  {
    const f = F.installments;
    const ok = f && verify("installments", f.quote, f.count_text, f.amount_text);
    if (ok) {
      const count = Math.round(num("installments", f.count_text));
      const amount = num("installments", f.amount_text);
      if (Number.isFinite(count) && count > 0 && Number.isFinite(amount)) {
        const freq = /(bimestral|trimestral|semestral|annual)/i.exec(ok.source);
        const ppy = freq ? { bimestral: 6, trimestral: 4, semestral: 2, annual: 1 }[freq[1].toLowerCase()] : 12;
        fields.installments = { ...ok, count, amount, periodsPerYear: ppy, raw: String(f.amount_text).trim() };
      }
    }
  }
  {
    const f = F.lender;
    const ok = f && verify("lender", f.quote, f.value_text);
    if (ok) fields.lender = { ...ok, value: String(f.value_text).trim(), raw: String(f.value_text).trim() };
  }
  for (const fee of Array.isArray(src.fees) ? src.fees : []) {
    const kind = Object.hasOwn(FEE_NAMES, fee?.kind) ? fee.kind : "altro";
    const ok = fee && verify("fee", fee.quote, fee.label, fee.amount_text);
    if (!ok) continue;
    const amount = num("fee", fee.amount_text);
    if (!Number.isFinite(amount)) continue;
    const label = kind === "altro" ? String(fee.label).trim() : FEE_NAMES[kind];
    fees.push({ ...ok, kind, label, amount, raw: String(fee.amount_text).trim(), ...detectTiming(ok.source, kind) });
  }

  return {
    text, fields, fees, rejected,
    missing: IMPORTANT.filter((k) => !fields[k]),
    isSecci: true,
    complete: !!(fields.creditAmount && fields.installments),
    origin: "ai",
  };
}

/** Unisce lettura a regole e lettura AI: i valori delle regole hanno sempre la precedenza. */
export function mergeParsed(rules, ai) {
  if (!ai) return rules;
  const fields = { ...ai.fields, ...rules.fields };
  const kinds = new Set(rules.fees.map((f) => f.kind));
  const fees = [...rules.fees, ...ai.fees.filter((f) => f.kind === "altro" || !kinds.has(f.kind))].sort((a, b) => a.start - b.start);
  return {
    ...rules, fields, fees,
    missing: IMPORTANT.filter((k) => !fields[k]),
    complete: !!(fields.creditAmount && fields.installments),
    origin: Object.values(fields).some((f) => f.origin === "ai") || fees.some((f) => f.origin === "ai") ? "regole+ai" : "regole",
  };
}
