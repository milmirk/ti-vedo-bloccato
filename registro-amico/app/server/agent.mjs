/*
 * Agente "Spiegami questa comunicazione": da una comunicazione della
 * bacheca a una spiegazione semplice in arabo, inglese o italiano semplice.
 *
 * La risposta del modello non arriva mai alla persona senza controlli:
 *  - formato JSON vincolato da schema (structured outputs);
 *  - lunghezza massima;
 *  - OGNI data, orario, numero, mese e giorno della settimana deve essere
 *    nella comunicazione originale (public/lib/facts.js);
 *  - ogni parola tra «» deve esistere nell'originale o nel registro;
 *  - la lingua deve essere quella chiesta;
 *  - le citazioni in italiano devono essere copiate dall'originale.
 * Se un controllo fallisce, il server risponde con errore e la pagina mostra
 * la spiegazione già pronta. Il testo originale resta sempre visibile.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unsupportedFacts, normalizeText } from "../public/lib/facts.js";
import { noticeText, registerLabels, SCHOOL } from "../public/lib/data.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PROMPT_PATH = path.resolve(here, "../../agents/prompts/spiega-comunicazione.md");
export const MODEL = process.env.RA_MODEL || "claude-opus-5-5";
export const MAX_EXPLANATION_CHARS = 700;
export const MAX_TODO_CHARS = 320;
export const MAX_QUOTES = 4;

export const LANGUAGE_NAMES = {
  ar: "arabo standard moderno, semplice (livello A2)",
  en: "inglese semplice (livello A2)",
  it: "italiano semplice (livello A2)",
};

export const EXPLAIN_SCHEMA = {
  type: "object",
  properties: {
    explanation: { type: "string" },
    what_to_do: { type: "string" },
    quotes: { type: "array", items: { type: "string" } },
  },
  required: ["explanation", "what_to_do", "quotes"],
  additionalProperties: false,
};

export function loadSystemPrompt(file = PROMPT_PATH) {
  return readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "").trim();
}

// Credenziali: variabili d'ambiente o profilo creato con `ant auth login`.
export function aiConfigured(env = process.env) {
  if (env.RA_AI === "off") return false;
  if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_PROFILE) return true;
  return existsSync(path.join(os.homedir(), ".config", "anthropic"));
}

export class ExplanationRejected extends Error {
  constructor(reason) {
    super("Spiegazione scartata: " + reason);
    this.reason = reason;
  }
}

// Il contesto che il modello riceve (e che i controlli considerano "vero").
function originalCorpus(notice) {
  return `${noticeText(notice)}\n${SCHOOL.student}, classe ${SCHOOL.className}`;
}

const squash = (s) => normalizeText(s).replace(/[«»"“”'’]/g, " ").replace(/\s+/g, " ").trim();

function appearsIn(text, haystacks) {
  const n = squash(String(text).replace(/(…|\.\.\.)\s*$/, ""));
  return n.length >= 2 && haystacks.some((h) => squash(h).includes(n));
}

function arabicShare(text) {
  const plain = String(text).replace(/«[^»]*»/g, " ");
  const arabic = (plain.match(/[؀-ۿ]/g) || []).length;
  const latin = (plain.match(/[A-Za-zÀ-ÿ]/g) || []).length;
  return arabic + latin === 0 ? 0 : arabic / (arabic + latin);
}

export function validateExplanation(raw, notice, lang) {
  if (!LANGUAGE_NAMES[lang]) throw new ExplanationRejected("lingua non supportata");
  if (!raw || typeof raw !== "object") throw new ExplanationRejected("risposta vuota");
  const out = {
    explanation: String(raw.explanation ?? "").trim(),
    what_to_do: String(raw.what_to_do ?? "").trim(),
    quotes: Array.isArray(raw.quotes) ? raw.quotes.map((q) => String(q ?? "").trim()).filter(Boolean) : [],
  };
  if (!out.explanation) throw new ExplanationRejected("spiegazione vuota");
  if (out.explanation.length > MAX_EXPLANATION_CHARS) throw new ExplanationRejected("spiegazione troppo lunga");
  if (out.what_to_do.length > MAX_TODO_CHARS) throw new ExplanationRejected("«cosa fare» troppo lungo");

  const original = originalCorpus(notice);
  const shown = `${out.explanation}\n${out.what_to_do}`;

  // Semplificare senza tradire: niente date, orari o numeri inventati.
  const problems = unsupportedFacts(shown, original);
  if (problems.length) throw new ExplanationRejected("non presenti nell'originale: " + problems.join(", "));

  // Le parole tra «» devono esistere nella comunicazione o nel registro.
  const labels = registerLabels();
  for (const [, q] of shown.matchAll(/«([^»]+)»/g)) {
    if (!appearsIn(q, [original, ...labels])) throw new ExplanationRejected("cita «" + q + "», che non c'è");
  }

  // La lingua deve essere quella chiesta.
  const share = arabicShare(shown);
  if (lang === "ar" && share < 0.6) throw new ExplanationRejected("non è in arabo");
  if (lang !== "ar" && share > 0.05) throw new ExplanationRejected("lingua sbagliata");

  // Le citazioni in italiano: solo quelle copiate davvero dall'originale.
  out.quotes = out.quotes.filter((q) => q.length <= 120 && appearsIn(q, [original])).slice(0, MAX_QUOTES);
  return out;
}

export function buildRequest(notice, lang) {
  return {
    language: lang,
    language_name: LANGUAGE_NAMES[lang],
    student: { name: SCHOOL.student, class: SCHOOL.className },
    notice: { title: notice.title, date: notice.date, from: notice.from, text: notice.body.join("\n") },
  };
}

export function createExplainAgent({ client, systemPrompt, model = MODEL } = {}) {
  const anthropic = client || new Anthropic({ timeout: 15000, maxRetries: 1 });
  const system = systemPrompt || loadSystemPrompt();

  async function explain(notice, lang) {
    const response = await anthropic.beta.messages.create({
      model,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: EXPLAIN_SCHEMA },
      },
      messages: [{ role: "user", content: JSON.stringify(buildRequest(notice, lang)) }],
    });

    if (response.stop_reason === "refusal") throw new ExplanationRejected("richiesta rifiutata dal modello");
    if (response.stop_reason === "max_tokens") throw new ExplanationRejected("risposta troncata");
    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) throw new ExplanationRejected("nessun testo nella risposta");

    let raw;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new ExplanationRejected("JSON non valido");
    }
    return { ...validateExplanation(raw, notice, lang), source: "ai", model: response.model };
  }

  return { explain, model };
}
