/*
 * SECCI Lens · agente AI facoltativo, con Claude.
 *
 * Due compiti, due prompt (agents/prompts/, letti all'avvio):
 *   extract  testo non standard → CITAZIONI dei dati (mai numeri calcolati)
 *   explain  "Spiegamelo in parole semplici": frase originale → frase semplice
 *
 * La risposta del modello non arriva mai alla persona senza controlli:
 *   - formato JSON vincolato da schema (structured outputs)
 *   - estrazione: ogni citazione deve comparire nel documento e ogni valore
 *     dentro la sua citazione; i numeri li interpreta il codice (fromAiFields)
 *   - spiegazione: la citazione deve comparire nel documento; ogni numero della
 *     frase semplice deve comparire nel documento o nei calcoli del codice;
 *     una frase che suona come un consiglio fa scartare tutta la risposta
 * Se qualcosa non passa, il server risponde con errore e l'app resta sulle
 * regole deterministiche, che funzionano sempre.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSecci, fromAiFields, mergeParsed, toCredit, normalizeText, locate, FEE_NAMES } from "../public/lib/parser.js";
import { analyze, formatEuro, formatPercent, formatMonths } from "../public/lib/finance.js";
import { findAdvice, allowedNumbers, checkNumbers } from "../public/lib/guards.js";
import { coherenceMessage, rataInfo, timingText } from "../public/lib/explain.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PROMPTS_DIR = path.resolve(here, "../../agents/prompts");
export const MODEL = process.env.SECCI_MODEL || "claude-opus-5-5";
export const MAX_DOC_CHARS = 30000;
const MAX_ITEMS = 10;
const MAX_PLAIN_CHARS = 400;

const QUOTED = {
  type: "object",
  properties: { quote: { type: "string" }, value_text: { type: "string" } },
  required: ["quote", "value_text"],
  additionalProperties: false,
};

export const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    fields: {
      type: "object",
      properties: {
        lender: QUOTED,
        creditAmount: QUOTED,
        duration: QUOTED,
        installments: {
          type: "object",
          properties: { quote: { type: "string" }, count_text: { type: "string" }, amount_text: { type: "string" } },
          required: ["quote", "count_text", "amount_text"],
          additionalProperties: false,
        },
        totalDue: QUOTED,
        tan: QUOTED,
        taeg: QUOTED,
      },
      required: ["lender", "creditAmount", "duration", "installments", "totalDue", "tan", "taeg"],
      additionalProperties: false,
    },
    fees: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: Object.keys(FEE_NAMES) },
          label: { type: "string" },
          amount_text: { type: "string" },
          quote: { type: "string" },
        },
        required: ["kind", "label", "amount_text", "quote"],
        additionalProperties: false,
      },
    },
  },
  required: ["fields", "fees"],
  additionalProperties: false,
};

export const EXPLAIN_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { quote: { type: "string" }, plain: { type: "string" } },
        required: ["quote", "plain"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};

export function loadPrompt(name) {
  return readFileSync(path.join(PROMPTS_DIR, name), "utf8").replace(/<!--[\s\S]*?-->/g, "").trim();
}

// Credenziali: variabili d'ambiente o profilo creato con `ant auth login`.
export function aiConfigured(env = process.env) {
  if (env.SECCI_AI === "off") return false;
  if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_PROFILE) return true;
  return existsSync(path.join(os.homedir(), ".config", "anthropic"));
}

export class AgentRejected extends Error {
  constructor(reason) {
    super("Risposta AI scartata: " + reason);
    this.reason = reason;
  }
}

/** Errore nei dati inviati dalla pagina: non è colpa dell'AI, il server risponde 400. */
export class InputError extends Error {}

export function validateExtraction(text, raw) {
  const parsed = fromAiFields(text, raw);
  const usable = Object.keys(parsed.fields).length + parsed.fees.length;
  if (!usable) throw new AgentRejected(parsed.rejected[0]?.reason || "nessun dato verificabile nel documento");
  return parsed;
}

/** I fatti che l'AI può usare: tutti già formattati dal codice. */
export function factsFor(parsed, analysis) {
  const f = parsed.fields;
  const r = rataInfo(analysis);
  return {
    finanziatore: f.lender?.value || "",
    importo_totale_del_credito: formatEuro(analysis.creditAmount),
    durata: formatMonths(analysis.durationMonths),
    numero_rate: String(analysis.installments.count),
    importo_rata_senza_spese: formatEuro(analysis.installments.amount),
    prima_rata_con_spese: formatEuro(r.first),
    rata_con_spese_dal_secondo_mese: formatEuro(r.regular),
    importo_totale_dovuto_calcolato: formatEuro(analysis.totalDue),
    costo_totale_del_credito: formatEuro(analysis.totalCost),
    interessi_totali: formatEuro(analysis.interestTotal),
    spese_totali: formatEuro(analysis.feesTotal),
    tan_scritto_nel_documento: f.tan?.raw || "non indicato",
    taeg_scritto_nel_documento: f.taeg?.raw || "non indicato",
    taeg_calcolato_dai_dati: formatPercent(analysis.taegRounded),
    spese: analysis.fees.map((x) => ({ nome: x.label, importo: formatEuro(x.amount), quando: timingText(x), totale: formatEuro(x.total) })),
    controlli: analysis.checks.map((c) => coherenceMessage(c).text),
  };
}

/**
 * Tiene solo le frasi verificate. Un consiglio in una qualsiasi frase fa
 * scartare tutta la risposta: è il divieto più importante del tema.
 */
export function validateExplanation(raw, { text, analysis }) {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  const allowed = allowedNumbers(text, analysis);
  const kept = [];
  const dropped = [];
  for (const it of items) {
    const advice = findAdvice(it?.plain);
    if (advice) throw new AgentRejected(`contiene un consiglio («${advice}»)`);
  }
  for (const it of items.slice(0, MAX_ITEMS)) {
    const plain = String(it?.plain ?? "").trim();
    const quote = String(it?.quote ?? "").trim();
    if (!plain) continue;
    if (plain.length > MAX_PLAIN_CHARS) { dropped.push({ reason: "frase troppo lunga" }); continue; }
    const loc = locate(text, quote);
    if (!loc) { dropped.push({ reason: "la frase originale non compare nel documento" }); continue; }
    const nums = checkNumbers(plain, allowed);
    if (!nums.ok) { dropped.push({ reason: `numero che non compare nei dati: ${nums.unknown.join(", ")}` }); continue; }
    kept.push({ quote: text.slice(loc.start, loc.end), plain, origin: "ai" });
  }
  if (!kept.length) throw new AgentRejected(dropped[0]?.reason || "nessuna frase utilizzabile");
  return { items: kept, dropped };
}

/** Dal testo (ed eventuali citazioni AI già ottenute) ai dati verificati. */
export function prepare(docText, aiFields) {
  const text = normalizeText(docText).slice(0, MAX_DOC_CHARS);
  let parsed = parseSecci(text);
  if (!parsed.complete && aiFields) parsed = mergeParsed(parsed, fromAiFields(text, aiFields));
  const model = toCredit(parsed);
  if (!model) throw new InputError("mancano importo del credito e rate");
  return { text, parsed, analysis: analyze(model.credit, model.declared) };
}

export function createAgent({ client, extractPrompt, explainPrompt, model = MODEL } = {}) {
  const anthropic = client || new Anthropic({ timeout: 20000, maxRetries: 1 });
  const extractSystem = extractPrompt || loadPrompt("extract-agent.md");
  const explainSystem = explainPrompt || loadPrompt("explain-agent.md");

  async function call(system, schema, content) {
    const response = await anthropic.beta.messages.create({
      model,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema },
      },
      messages: [{ role: "user", content }],
    });

    if (response.stop_reason === "refusal") throw new AgentRejected("richiesta rifiutata dal modello");
    if (response.stop_reason === "max_tokens") throw new AgentRejected("risposta troncata");
    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) throw new AgentRejected("nessun testo nella risposta");
    try {
      return { raw: JSON.parse(text), model: response.model };
    } catch {
      throw new AgentRejected("JSON non valido");
    }
  }

  /** Testo non standard → citazioni verificate. Restituisce anche la risposta grezza, che la pagina rivalida. */
  async function extract(docText) {
    const text = normalizeText(docText).slice(0, MAX_DOC_CHARS);
    if (text.trim().length < 20) throw new InputError("testo troppo corto");
    const { raw, model: used } = await call(extractSystem, EXTRACT_SCHEMA, text);
    const parsed = validateExtraction(text, raw);
    return {
      aiFields: raw,
      found: [...Object.keys(parsed.fields), ...parsed.fees.map((f) => "fee_" + f.kind)],
      rejected: parsed.rejected,
      source: "ai",
      model: used,
    };
  }

  /** "Spiegamelo in parole semplici": frasi del documento → frasi semplici verificate. */
  async function explain(docText, aiFields) {
    const { text, parsed, analysis } = prepare(docText, aiFields);
    const content = JSON.stringify({ documento: text, dati: factsFor(parsed, analysis) });
    const { raw, model: used } = await call(explainSystem, EXPLAIN_SCHEMA, content);
    return { ...validateExplanation(raw, { text, analysis }), source: "ai", model: used };
  }

  return { extract, explain, model };
}
