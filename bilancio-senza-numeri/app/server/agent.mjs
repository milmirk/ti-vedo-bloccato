/*
 * Interprete delle spese scritte a parole, con Claude (facoltativo).
 *
 * "ho fatto la spesa, circa 30 euro" o "due caffè e un panino" diventano
 * voci strutturate. L'AI legge e basta: non fa conti e non inventa importi.
 *  - formato JSON vincolato da schema (structured outputs)
 *  - ogni oggetto deve essere uno di quelli noti (o "altro")
 *  - ogni importo deve comparire nel testo della persona; se manca, si usa
 *    il prezzo noto dell'oggetto; altrimenti la risposta viene scartata
 *  - ogni quantità maggiore di uno deve comparire nel testo, in cifre o in lettere
 *  - la citazione deve comparire nel testo
 *  - il totale lo calcola il codice
 * Se un controllo fallisce, il browser resta sull'interprete a regole
 * (public/lib/parser.js) e sui pulsanti.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OTHER, allUnits } from "../public/lib/units.js";
import { normalize, parseAmount, textHasAmount, textHasNumber, MAX_COUNT, MAX_AMOUNT_CENTS } from "../public/lib/parser.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PROMPT_PATH = path.resolve(here, "../../agents/prompts/interpreta-spesa.md");
export const MODEL = process.env.BSN_MODEL || "claude-opus-5-5";
export const MAX_TEXT_CHARS = 300;
const MAX_ITEMS = 10;

export const SPEND_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          unit_id: { type: "string" },
          count: { type: "integer" },
          amount_text: { type: "string" },
          per_piece: { type: "boolean" },
          quote: { type: "string" },
        },
        required: ["unit_id", "count", "amount_text", "per_piece", "quote"],
        additionalProperties: false,
      },
    },
    not_understood: { type: "string" },
  },
  required: ["items", "not_understood"],
  additionalProperties: false,
};

export function loadSystemPrompt(file = PROMPT_PATH) {
  return readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "").trim();
}

// Credenziali: variabili d'ambiente o profilo creato con `ant auth login`.
export function aiConfigured(env = process.env) {
  if (env.BSN_AI === "off") return false;
  if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_PROFILE) return true;
  return existsSync(path.join(os.homedir(), ".config", "anthropic"));
}

export class SpendRejected extends Error {
  constructor(reason) {
    super("Interpretazione scartata: " + reason);
    this.reason = reason;
  }
}

/** Il messaggio per il modello: il testo e gli oggetti noti, senza prezzi (l'AI non deve fare conti). */
export function buildUserMessage(text, units) {
  return JSON.stringify({
    testo: text,
    oggetti: units.map((u) => ({ id: u.id, nome: u.one, parole: u.words })),
  });
}

/**
 * Controlla l'output del modello e calcola gli importi.
 * @param {object} raw JSON del modello
 * @param {string} text testo scritto dalla persona
 * @param {object[]} units oggetti noti, con i prezzi della persona
 */
export function validateInterpretation(raw, text, units) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.items)) throw new SpendRejected("formato non valido");
  if (!raw.items.length) throw new SpendRejected("nessuna spesa riconosciuta");
  if (raw.items.length > MAX_ITEMS) throw new SpendRejected("troppe voci");
  const byId = new Map(units.map((u) => [u.id, u]));
  const normText = normalize(text);
  const items = [];

  for (const it of raw.items) {
    const unitId = String(it.unit_id || "").trim();
    const unit = byId.get(unitId) || (unitId === OTHER.id ? OTHER : null);
    if (!unit) throw new SpendRejected(`oggetto sconosciuto «${unitId}»`);

    const count = it.count;
    if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) throw new SpendRejected("quantità non valida");
    if (count > 1 && !textHasNumber(text, count)) throw new SpendRejected(`la quantità ${count} non compare nel testo`);

    const quote = normalize(it.quote);
    if (!quote || !normText.includes(quote)) throw new SpendRejected("la citazione non compare nel testo");

    const amountText = String(it.amount_text || "").trim();
    let cents;
    let priced;
    if (amountText) {
      // L'importo deve essere scritto dalla persona: lo legge il codice, non
      // l'AI, e deve corrispondere a un numero intero del testo (non a un pezzo:
      // "3" non vale se il testo dice "30").
      const amount = parseAmount(amountText);
      if (!amount || amount > MAX_AMOUNT_CENTS) throw new SpendRejected("importo non leggibile");
      if (!textHasAmount(text, amount)) throw new SpendRejected(`l'importo «${amountText}» non compare nel testo`);
      cents = it.per_piece === true ? amount * count : amount;
      priced = "testo";
    } else {
      if (unit === OTHER) throw new SpendRejected("spesa senza importo e senza oggetto noto");
      cents = count * unit.cents;
      priced = "oggetto";
    }
    if (cents > MAX_AMOUNT_CENTS) throw new SpendRejected("importo troppo alto");
    items.push({ unitId: unit.id, count, cents, priced });
  }

  const nu = String(raw.not_understood || "").trim().slice(0, 200);
  const notUnderstood = nu && normText.includes(normalize(nu)) ? nu : "";
  return { items, notUnderstood, totalCents: items.reduce((s, x) => s + x.cents, 0) };
}

/** Gli oggetti noti per una richiesta: il catalogo con i prezzi della persona (solo id noti). */
export function unitsFromRequest(list) {
  const choice = Array.isArray(list)
    ? list.slice(0, 20).filter((u) => u && typeof u.id === "string").map((u) => ({ id: u.id, cents: u.cents }))
    : [];
  return allUnits(choice);
}

export function createSpendAgent({ client, systemPrompt, model = MODEL } = {}) {
  const anthropic = client || new Anthropic({ timeout: 15000, maxRetries: 1 });
  const system = systemPrompt || loadSystemPrompt();

  async function interpret(text, units) {
    const response = await anthropic.beta.messages.create({
      model,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SPEND_SCHEMA },
      },
      messages: [{ role: "user", content: buildUserMessage(text, units) }],
    });

    if (response.stop_reason === "refusal") throw new SpendRejected("richiesta rifiutata dal modello");
    if (response.stop_reason === "max_tokens") throw new SpendRejected("risposta troncata");
    const out = response.content.find((b) => b.type === "text")?.text;
    if (!out) throw new SpendRejected("nessun testo nella risposta");

    let raw;
    try {
      raw = JSON.parse(out);
    } catch {
      throw new SpendRejected("JSON non valido");
    }
    return { ...validateInterpretation(raw, text, units), source: "ai", model: response.model };
  }

  return { interpret, model };
}
