/*
 * Hint agent: dal contesto della pagina a UN suggerimento, con Claude.
 *
 * La risposta del modello non arriva mai all'utente senza controlli:
 *  - formato JSON vincolato da schema (structured outputs)
 *  - lunghezza massima del suggerimento
 *  - ogni nome citato tra «» deve esistere davvero nella pagina
 *  - la citazione "testo originale" deve comparire nella pagina
 *  - il bersaglio deve essere uno degli elementi passati
 * Se un controllo fallisce, il server risponde con errore e l'estensione usa
 * i suggerimenti a regole (fallback-hints.js).
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PROMPT_PATH = path.resolve(here, "../../agents/prompts/hint-agent.md");
export const MODEL = process.env.TVB_MODEL || "claude-opus-5-5";
const MAX_HINT_CHARS = 280;
const MAX_WHY_CHARS = 200;

export const HINT_SCHEMA = {
  type: "object",
  properties: {
    hint: { type: "string" },
    target_ref: { type: "string" },
    why: { type: "string" },
    original_quote: { type: "string" },
  },
  required: ["hint", "target_ref", "why", "original_quote"],
  additionalProperties: false,
};

export function loadSystemPrompt(file = PROMPT_PATH) {
  return readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "").trim();
}

// Credenziali: variabili d'ambiente o profilo creato con `ant auth login`.
export function aiConfigured(env = process.env) {
  if (env.TVB_AI === "off") return false;
  if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_PROFILE) return true;
  return existsSync(path.join(os.homedir(), ".config", "anthropic"));
}

export class HintRejected extends Error {
  constructor(reason) {
    super("Suggerimento scartato: " + reason);
    this.reason = reason;
  }
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[«»"“”*:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Tutti i testi che la pagina mostra davvero: è la base dei controlli.
export function pageCorpus(ctx) {
  const items = [ctx.page?.title, ctx.page?.heading, ctx.page?.step, ctx.signal?.detail?.message];
  if (ctx.target) items.push(ctx.target.label, ctx.target.error);
  for (const c of ctx.candidates || []) items.push(c.label, c.error);
  for (const m of ctx.missing || []) items.push(m.label);
  for (const t of ctx.texts || []) items.push(t);
  return items.filter(Boolean).map(norm);
}

function appearsInPage(text, corpus) {
  const n = norm(String(text || "").replace(/(…|\.\.\.)\s*$/, ""));
  return n.length >= 2 && corpus.some((c) => c.includes(n));
}

export function validateHint(raw, ctx) {
  const out = {
    hint: String(raw.hint || "").trim(),
    target_ref: String(raw.target_ref || "").trim(),
    why: String(raw.why || "").trim(),
    original_quote: String(raw.original_quote || "").trim(),
  };
  if (!out.hint) throw new HintRejected("suggerimento vuoto");
  if (out.hint.length > MAX_HINT_CHARS) throw new HintRejected("suggerimento troppo lungo");

  const corpus = pageCorpus(ctx);
  // Semplificare senza tradire: ogni elemento nominato deve esistere nella pagina.
  for (const [, name] of out.hint.matchAll(/«([^»]+)»/g)) {
    if (!appearsInPage(name, corpus)) throw new HintRejected("nomina «" + name + "», che non è nella pagina");
  }
  if (out.original_quote && !appearsInPage(out.original_quote, corpus)) out.original_quote = "";
  // Anche il "perché" è mostrato alla persona: stessi controlli, ma se non li
  // passa lo tolgo invece di scartare tutto il suggerimento.
  const whyNames = [...out.why.matchAll(/«([^»]+)»/g)].map((m) => m[1]);
  if (out.why.length > MAX_WHY_CHARS || whyNames.some((n) => !appearsInPage(n, corpus))) out.why = "";

  const refs = new Set((ctx.candidates || []).map((c) => c.ref));
  if (ctx.target?.ref) refs.add(ctx.target.ref);
  if (out.target_ref && !refs.has(out.target_ref)) out.target_ref = "";

  return out;
}

export function createHintAgent({ client, systemPrompt, model = MODEL } = {}) {
  const anthropic = client || new Anthropic({ timeout: 15000, maxRetries: 1 });
  const system = systemPrompt || loadSystemPrompt();

  async function hint(ctx) {
    const response = await anthropic.beta.messages.create({
      model,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: HINT_SCHEMA },
      },
      messages: [{ role: "user", content: JSON.stringify(ctx) }],
    });

    if (response.stop_reason === "refusal") throw new HintRejected("richiesta rifiutata dal modello");
    if (response.stop_reason === "max_tokens") throw new HintRejected("risposta troncata");
    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) throw new HintRejected("nessun testo nella risposta");

    let raw;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new HintRejected("JSON non valido");
    }
    return { ...validateHint(raw, ctx), source: "ai", model: response.model };
  }

  return { hint, model };
}
