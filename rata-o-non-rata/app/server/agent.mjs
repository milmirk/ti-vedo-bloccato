/*
 * Extraction agent: da un'email in un formato sconosciuto ai campi di un
 * acquisto a rate, con Claude. È FACOLTATIVO: senza chiave l'app funziona con
 * i parser deterministici e il modulo "Aggiungi a mano".
 *
 * La risposta del modello non arriva mai alla persona senza controlli:
 *  - formato JSON vincolato da schema (structured outputs)
 *  - l'AI riporta i valori COME SONO SCRITTI; li converte il codice
 *  - ogni importo, data e numero di rate deve comparire nell'email
 *    (verifyExtraction in public/lib/verify.js, condiviso con i test)
 *  - nessun consiglio: "ti conviene", "ti consiglio", "è meglio", "dovresti"
 *    fanno scartare tutta la risposta
 * L'AI non calcola mai date delle rate né totali: lo fa schedule.js.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyExtraction, ExtractionRejected } from "../public/lib/verify.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PROMPT_PATH = path.resolve(here, "../../agents/prompts/extract-agent.md");
export const MODEL = process.env.RNR_MODEL || "claude-opus-5-5";
export const MAX_EMAIL_CHARS = 20000;
export { ExtractionRejected };

const field = {
  type: "object",
  properties: {
    value: { type: "string" },
    quote: { type: "string" },
  },
  required: ["value", "quote"],
  additionalProperties: false,
};

export const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    is_installment_plan: { type: "boolean" },
    provider: field,
    merchant: field,
    total: field,
    count: field,
    installment_amount: field,
    first_date: field,
    frequency: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["mensile", "ogni_2_settimane", "ogni_30_giorni", "settimanale", "altro", "non_indicata"] },
        quote: { type: "string" },
      },
      required: ["kind", "quote"],
      additionalProperties: false,
    },
    late_fee: field,
    note: { type: "string" },
  },
  required: [
    "is_installment_plan", "provider", "merchant", "total", "count", "installment_amount",
    "first_date", "frequency", "late_fee", "note",
  ],
  additionalProperties: false,
};

export function loadSystemPrompt(file = PROMPT_PATH) {
  return readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "").trim();
}

// Credenziali: variabili d'ambiente o profilo creato con `ant auth login`.
export function aiConfigured(env = process.env) {
  if (env.RNR_AI === "off") return false;
  if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_PROFILE) return true;
  return existsSync(path.join(os.homedir(), ".config", "anthropic"));
}

export function createExtractAgent({ client, systemPrompt, model = MODEL } = {}) {
  const anthropic = client || new Anthropic({ timeout: 20000, maxRetries: 1 });
  const system = systemPrompt || loadSystemPrompt();

  async function extract(emailText) {
    const text = String(emailText || "").slice(0, MAX_EMAIL_CHARS);
    const response = await anthropic.beta.messages.create({
      model,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: EXTRACT_SCHEMA },
      },
      messages: [{ role: "user", content: JSON.stringify({ email: text }) }],
    });

    if (response.stop_reason === "refusal") throw new ExtractionRejected("richiesta rifiutata dal modello");
    if (response.stop_reason === "max_tokens") throw new ExtractionRejected("risposta troncata");
    const out = response.content.find((b) => b.type === "text")?.text;
    if (!out) throw new ExtractionRejected("nessun testo nella risposta");

    let raw;
    try {
      raw = JSON.parse(out);
    } catch {
      throw new ExtractionRejected("JSON non valido");
    }
    const result = verifyExtraction(raw, text);
    delete result.purchase.emailText; // il browser ha già il testo
    return { ...result, source: "ai", model: response.model };
  }

  return { extract, model };
}
