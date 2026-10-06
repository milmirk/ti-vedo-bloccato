/*
 * Lettura deterministica delle email di conferma.
 *
 * Un parser dedicato per ogni formato noto (Pago3, Rateo, DividiPay,
 * ElettroCasa: servizi di fantasia) e un parser generico a regole per i formati
 * sconosciuti. Ogni valore estratto porta con sé la frase ESATTA dell'email da
 * cui viene (`sources`): l'interfaccia la mostra accanto al valore.
 *
 * Nessuna AI qui. Se mancano dati essenziali, l'email resta "incompleta" e la
 * persona può provare l'estrazione con l'AI (se attiva) o compilare a mano.
 */
import { parseAmount, parseCount } from "./money.js";
import { parseDate } from "./dates.js";

export const REQUIRED = ["total", "count", "firstDate", "frequency"];
export const FIELD_LABELS = {
  provider: "Servizio",
  merchant: "Acquisto",
  total: "Totale",
  count: "Numero di rate",
  installmentAmount: "Importo della rata",
  firstDate: "Prima rata",
  frequency: "Ogni quanto",
  lateFee: "Ritardi",
};

/** Riga dell'email che contiene la posizione `index`, così com'è scritta. */
export function lineAt(text, index) {
  const start = text.lastIndexOf("\n", index - 1) + 1;
  const endNl = text.indexOf("\n", index);
  return text.slice(start, endNl === -1 ? text.length : endNl).trim();
}

/** Frase che contiene la posizione `index` (si ferma al punto seguito da spazio o a capo). */
export function sentenceAt(text, index) {
  const lineStart = text.lastIndexOf("\n", index - 1) + 1;
  const nl = text.indexOf("\n", index);
  const raw = text.slice(lineStart, nl === -1 ? text.length : nl);
  const rel = index - lineStart;
  let start = 0;
  for (const m of raw.matchAll(/[.!?](?=\s|$)/g)) {
    const end = m.index + 1;
    if (rel < end) return raw.slice(start, end).trim();
    start = end;
  }
  return raw.slice(start).trim();
}

/**
 * Cerca `re` nel testo e converte il gruppo catturato. Prova tutte le
 * occorrenze finché una dà un valore valido. Restituisce { value, source }.
 */
function grab(text, re, convert, { group = 1, sentence = false } = {}) {
  const all = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  for (const m of text.matchAll(all)) {
    const value = convert ? convert(m[group], m) : m[group].trim();
    if (value == null || value === "") continue;
    const at = m.index + Math.max(0, m[0].indexOf(m[group]));
    return { value, source: sentence ? sentenceAt(text, at) : lineAt(text, at) };
  }
  return null;
}

const amount = (s) => parseAmount(s);
const count = (s) => parseCount(s);
const date = (s) => parseDate(s);

function lateFee(text) {
  const m = /\b(penal[ei]|ritard\w*|mora)\b/i.exec(text);
  if (!m) return null;
  const s = sentenceAt(text, m.index);
  return { value: s, source: s };
}

function frequencyFrom(s) {
  const t = String(s || "").toLowerCase();
  if (/ogni\s+(2|due)\s+settimane|quindicinal|ogni\s+14\s+giorni/.test(t)) return "ogni_2_settimane";
  if (/ogni\s+(30|trenta)\s+giorni/.test(t)) return "ogni_30_giorni";
  if (/ogni\s+settimana|settimanal/.test(t)) return "settimanale";
  if (/mensil|ogni\s+mese|al\s+mese|cadenza\s+mensile/.test(t)) return "mensile";
  return null;
}

function headerProvider(text) {
  return grab(text, /^(?:Da|From):\s*([^<\n]+?)\s*(?:<|$)/m, (s) => s.trim().replace(/\s+Finanziamenti$/i, ""));
}

// ---- Parser dedicati ------------------------------------------------------

const PARSERS = [
  {
    id: "pago3",
    provider: "Pago3",
    kind: "bnpl",
    detect: (t) => /Pago3/.test(t) && /Piano:\s*\d+\s+rate/i.test(t),
    fields: (t) => ({
      merchant: grab(t, /acquisto su (.+?) è confermato/i),
      total: grab(t, /Importo totale:\s*([\d.,]+\s*€)/i, amount),
      count: grab(t, /Piano:\s*(\d+)\s+rate/i, count),
      frequency: grab(t, /Piano:\s*\d+\s+rate\s+(mensili)/i, frequencyFrom),
      installmentAmount: grab(t, /rate mensili da\s*([\d.,]+\s*€)/i, amount),
      firstDate: grab(t, /1ª rata:[^\n]*?(\d{2}\/\d{2}\/\d{4})/i, date),
      lateFee: lateFee(t),
    }),
  },
  {
    id: "rateo",
    provider: "Rateo",
    kind: "bnpl",
    detect: (t) => /Rateo/.test(t) && /rate da\s*€/i.test(t),
    fields: (t) => ({
      merchant: grab(t, /Hai acquistato da (.+?) per\s*€/i, null, { sentence: true }),
      total: grab(t, /Hai acquistato da .+? per\s*(€\s*[\d.,]+\d)/i, amount, { sentence: true }),
      count: grab(t, /in (\d+|[a-z]+) rate da/i, count, { sentence: true }),
      frequency: grab(t, /(una ogni (?:2|due) settimane)/i, frequencyFrom, { sentence: true }),
      installmentAmount: grab(t, /rate da\s*(€\s*[\d.,]+\d)/i, amount, { sentence: true }),
      firstDate: grab(t, /Prima rata:\s*([^\n(]+)/i, date),
      lateFee: lateFee(t),
    }),
  },
  {
    id: "dividipay",
    provider: "DividiPay",
    kind: "bnpl",
    detect: (t) => /DividiPay/.test(t) && /Numero pagamenti:/i.test(t),
    fields: (t) => ({
      merchant: grab(t, /Negozio:\s*(.+)/i),
      total: grab(t, /Totale ordine:\s*(EUR\s*[\d.,]+\d)/i, amount),
      count: grab(t, /Numero pagamenti:\s*(\d+)/i, count),
      frequency: grab(t, /Frequenza:\s*(.+)/i, frequencyFrom),
      installmentAmount: grab(t, /Importo di ogni pagamento:\s*(EUR\s*[\d.,]+\d)/i, amount),
      firstDate: grab(t, /Primo addebito:\s*(\d{4}-\d{2}-\d{2})/i, date),
      lateFee: lateFee(t),
    }),
  },
  {
    id: "elettrocasa",
    provider: "ElettroCasa",
    kind: "finanziamento",
    detect: (t) => /ElettroCasa/.test(t) && /finanziament/i.test(t),
    fields: (t) => ({
      merchant: grab(t, /Bene acquistato:\s*(.+)/i),
      total: grab(t, /Importo totale dovuto:\s*(€\s*[\d.,]+\d)/i, amount)
        || grab(t, /Importo finanziato:\s*(€\s*[\d.,]+\d)/i, amount),
      count: grab(t, /Numero di rate:\s*(\d+)/i, count),
      frequency: grab(t, /Numero di rate:[^\n]*?(cadenza mensile|mensili)/i, frequencyFrom),
      installmentAmount: grab(t, /Importo della rata:\s*(€\s*[\d.,]+\d)/i, amount),
      firstDate: grab(t, /Scadenza della prima rata:\s*(.+)/i, date),
      lateFee: lateFee(t),
    }),
  },
];

// ---- Parser generico ------------------------------------------------------

const MONEY = "((?:€|EUR)\\s*\\d[\\d.,]*\\d|\\d[\\d.,]*\\d\\s*(?:€|EUR|euro))";

function genericFields(t) {
  const prov = headerProvider(t);
  return {
    provider: prov,
    merchant: grab(t, /(?:Negozio|Esercente|Venditore):\s*(.+)/i)
      || grab(t, /(?:acquisto|ordine|spesa)\s+(?:da|su|presso)\s+([A-Z][\w&'.-]*(?:\s[A-Z][\w&'.-]*)?)/),
    total: grab(t, new RegExp(`(?:importo totale(?: dovuto)?|totale(?: ordine)?|importo finanziato|prezzo)\\b[^\\n]*?${MONEY}`, "i"), amount),
    count: grab(t, /\bin\s+(\d{1,2}|[a-z]+)\s+(?:rate|pagamenti|quote|addebiti)\b/i, count)
      || grab(t, /numero (?:di )?(?:rate|pagamenti|quote):\s*(\d{1,2})\b/i, count)
      || grab(t, /\b(\d{1,2}|due|tre|quattro|cinque|sei|dieci|dodici)\s+(?:rate|pagamenti|quote)\s+(?:da|di)\b/i, count),
    frequency: grab(t, /(ogni\s+(?:2|due)\s+settimane|quindicinal\w*|ogni\s+14\s+giorni|ogni\s+(?:30|trenta)\s+giorni|mensil\w*|ogni\s+mese|al\s+mese|settimanal\w*)/i, frequencyFrom, { sentence: true }),
    installmentAmount: grab(t, new RegExp(`(?:rat[ae]|quot[ae]|pagamenti)\\s+(?:da|di)\\s+${MONEY}`, "i"), amount, { sentence: true }),
    firstDate: grab(t, /prim[aoe]\s+(?:rata|pagamento|addebito|scadenza)[^\n]*?((?:\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})|(?:\d{4}-\d{2}-\d{2})|(?:\d{1,2}°?\s+[a-z]+\s+\d{4}))/i, date),
    lateFee: lateFee(t),
  };
}

// ---- Assemblaggio --------------------------------------------------------

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function purchaseId(p) {
  return "p-" + hash([p.provider, p.merchant, p.total, p.count, p.firstDate, p.frequency].join("|"));
}

/**
 * Da campi {value, source} a un acquisto. `missing` elenca i campi essenziali assenti.
 */
export function assemble(fields, { provider, kind = "bnpl", origin }) {
  const values = {};
  const sources = {};
  for (const [k, f] of Object.entries(fields)) {
    if (f && f.value != null && f.value !== "") {
      values[k] = f.value;
      sources[k] = f.source;
    }
  }
  if (provider && !values.provider) values.provider = provider;
  const missing = REQUIRED.filter((k) => values[k] == null);
  const purchase = {
    provider: values.provider || "Altro servizio",
    merchant: values.merchant || "Acquisto",
    kind,
    total: values.total ?? null,
    count: values.count ?? null,
    installmentAmount: values.installmentAmount ?? null,
    firstDate: values.firstDate ?? null,
    frequency: values.frequency ?? null,
    lateFee: values.lateFee ?? null,
    sources,
    origin,
  };
  purchase.id = purchaseId(purchase);
  return { purchase, missing };
}

/**
 * Legge una email. Esito:
 *  - "riconosciuta": formato noto, tutti i dati essenziali trovati
 *  - "da_controllare": formato sconosciuto, regole generiche hanno trovato tutto
 *  - "incompleta": mancano dati essenziali (vedi `missing`)
 */
export function parseEmail(text) {
  const t = String(text || "").replace(/\r\n?/g, "\n");
  const known = PARSERS.find((p) => p.detect(t));
  if (known) {
    const fields = known.fields(t);
    // Il nome del servizio viene dalla riga dell'email in cui compare (di solito il mittente).
    const at = t.indexOf(known.provider);
    if (!fields.provider && at >= 0) fields.provider = { value: known.provider, source: lineAt(t, at) };
    const { purchase, missing } = assemble(fields, { provider: known.provider, kind: known.kind, origin: known.id });
    purchase.emailText = t;
    return { status: missing.length ? "incompleta" : "riconosciuta", parser: known.id, purchase, missing };
  }
  const { purchase, missing } = assemble(genericFields(t), { origin: "generico" });
  purchase.emailText = t;
  const found = Object.keys(purchase.sources).filter((k) => k !== "provider");
  if (!found.length) return { status: "non_riconosciuta", parser: "generico", purchase, missing };
  return { status: missing.length ? "incompleta" : "da_controllare", parser: "generico", purchase, missing };
}

/**
 * Divide un testo incollato in più email: una nuova email inizia con una riga
 * "Da:" / "From:" oppure dopo una riga di soli trattini o uguali.
 */
export function splitEmails(text) {
  const t = String(text || "").replace(/\r\n?/g, "\n");
  const chunks = t.split(/\n\s*[-=_]{3,}\s*\n|\n(?=(?:Da|From):\s)/);
  return chunks.map((c) => c.trim()).filter((c) => c.length > 0);
}

export const KNOWN_PROVIDERS = PARSERS.map((p) => p.provider);
