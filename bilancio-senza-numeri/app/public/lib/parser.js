/*
 * Dalle parole alla spesa, senza AI.
 *
 * Capisce le frasi semplici: "un caffè", "2 pizze", "spesa 30",
 * "ho fatto la spesa, circa 30 euro", "due caffè e un panino",
 * "benzina 50 euro", "tre caffè da 1,50". Quello che non capisce lo
 * restituisce in `unknown`: il browser può allora chiedere all'AI (se c'è)
 * o invitare a usare i pulsanti. I conti li fa sempre questo codice.
 */
import { CATALOG, OTHER } from "./units.js";
import { numberWord, countPhrase, listPhrase } from "./words.js";

export const MAX_COUNT = 20;
export const MAX_AMOUNT_CENTS = 200000;

/** minuscole, senza accenti né punteggiatura (tranne virgola e punto nei numeri) */
export function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/€/g, " euro ")
    .replace(/(\d)\s*(euro|eur)\b/g, "$1 euro")
    .replace(/[^a-z0-9,. ]+/g, " ")
    .replace(/(?<!\d)[,.]|[,.](?!\d)/g, " , ")
    .replace(/\s+/g, " ")
    .trim();
}

// Numeri in lettere: costruiti dalla stessa funzione che li scrive, così
// lettura e scrittura non possono divergere.
const WORD_TO_NUM = new Map();
for (let n = 2; n <= 999; n++) WORD_TO_NUM.set(normalize(numberWord(n)), n);
for (const w of ["un", "uno", "una"]) WORD_TO_NUM.set(w, 1);
WORD_TO_NUM.set("centotto", 108);
WORD_TO_NUM.set("paio", 2); // "un paio di caffè"

/** "trentacinque" → 35; null se non è un numero in lettere */
export function wordToNumber(word) {
  const v = WORD_TO_NUM.get(normalize(word));
  return Number.isInteger(v) ? v : null;
}

const DIGITS = /^(\d+(?:\.\d{3})*)(?:[,.](\d{1,2}))?$/;

/** "2,50" → 250, "30" → 3000, "trenta" → 3000 (centesimi); null se non è un importo */
export function parseNumberToken(token) {
  const m = DIGITS.exec(token);
  if (m) {
    const int = Number(m[1].replace(/\./g, ""));
    const dec = m[2] ? Number(m[2].padEnd(2, "0")) : 0;
    return { value: int + dec / 100, cents: int * 100 + dec, isInt: !m[2], digits: true };
  }
  const w = wordToNumber(token);
  return w ? { value: w, cents: w * 100, isInt: true, digits: false } : null;
}

/** Il primo importo in un testo ("circa 30 euro" → 3000), o null. */
export function parseAmount(text) {
  for (const tok of normalize(text).split(" ")) {
    const n = parseNumberToken(tok);
    if (n && n.cents > 0) return n.cents;
  }
  return null;
}

/** Il testo contiene esattamente questo importo (in centesimi), in cifre o in lettere? */
export function textHasAmount(text, cents) {
  return normalize(text).split(" ").some((tok) => {
    const v = parseNumberToken(tok);
    return v && v.cents === cents;
  });
}

/** Il testo contiene il numero n, in cifre o in lettere? */
export function textHasNumber(text, n) {
  return normalize(text).split(" ").some((tok) => {
    const v = parseNumberToken(tok);
    return v && v.isInt && v.value === n;
  });
}

const FILLERS = new Set(("ho hai ha preso presa presi prese fatto fatta fatti comprato comprata comprati speso pagato pagata " +
  "circa quasi tipo sui sugli intorno verso la il lo le i gli l un una uno di del della dello dei delle al alla allo ai " +
  "per oggi stamattina stasera stanotte ieri anche poi e ed o meno piu sono stato stata andato andata a in mi me si " +
  "euro eur da , qualcosa roba un po").split(" "));

// Soldi ricevuti o restituiti non sono spese: meglio non indovinare.
const RECEIVED = new Set("ridato ridati ridata restituito restituiti restituita rimborso rimborsato rimborsati ricevuto ricevuti incassato guadagnato vinto".split(" "));

function synonymIndex(units) {
  const list = [];
  for (const u of units) {
    for (const w of u.words || []) list.push({ unit: u, tokens: normalize(w).split(" ") });
  }
  return list.sort((a, b) => b.tokens.length - a.tokens.length || b.tokens.join(" ").length - a.tokens.join(" ").length);
}

function findUnit(tokens, index) {
  for (const s of index) {
    for (let i = 0; i + s.tokens.length <= tokens.length; i++) {
      if (s.tokens.every((t, k) => tokens[i + k] === t)) return { unit: s.unit, start: i, end: i + s.tokens.length };
    }
  }
  return null;
}

function parseChunk(chunk, index) {
  const tokens = chunk.split(" ").filter((t) => t && t !== ",");
  const found = findUnit(tokens, index);
  let count = null;
  let amount = null;
  let perPiece = false;
  tokens.forEach((tok, p) => {
    if (found && p >= found.start && p < found.end) return;
    const n = parseNumberToken(tok);
    if (!n) return;
    const euroNear = tokens[p + 1] === "euro" || tokens[p - 1] === "euro";
    if (euroNear || (found && p >= found.end && n.digits)) {
      if (amount === null) {
        amount = n.cents;
        perPiece = tokens[p - 1] === "da" && !!found;
      }
    } else if (found && p < found.start && found.start - p <= 2 && n.isInt && count === null) {
      count = n.value;
    } else if (!found && n.digits && amount === null) {
      amount = n.cents;
    }
  });
  const meaningful = tokens.some((t) => !FILLERS.has(t) && !parseNumberToken(t));
  const received = tokens.some((t) => RECEIVED.has(t));
  return { unit: found ? found.unit : null, count, amount, perPiece, meaningful, received };
}

/**
 * @param {string} text
 * @param {object[]} [units] oggetti noti, con i prezzi della persona
 * @returns {{items: {unitId: string, count: number, cents: number, priced: "testo"|"oggetto"}[], unknown: string[], totalCents: number}}
 */
export function parseSpendText(text, units = CATALOG) {
  const t = normalize(text).slice(0, 400);
  const index = synonymIndex(units);
  const chunks = t.split(/\s*(?:\s,\s|;|\+|\be\b|\bed\b|\bpoi\b|\banche\b)\s*/).map((s) => s.trim()).filter(Boolean);
  const items = [];
  const unknown = [];
  let lastWithoutAmount = null;
  let unpricedRun = []; // voci di fila senza importo: un importo da solo dopo due o più è il loro totale

  for (const chunk of chunks) {
    const c = parseChunk(chunk, index);
    if (c.received) {
      unknown.push(chunk);
      continue;
    }
    const count = c.count ?? 1;
    if (count < 1 || count > MAX_COUNT || (c.amount !== null && (c.amount <= 0 || c.amount > MAX_AMOUNT_CENTS))) {
      unknown.push(chunk);
      continue;
    }
    if (c.unit) {
      const item = c.amount !== null
        ? { unitId: c.unit.id, count, cents: c.perPiece ? c.amount * count : c.amount, priced: "testo" }
        : { unitId: c.unit.id, count, cents: count * c.unit.cents, priced: "oggetto" };
      items.push(item);
      lastWithoutAmount = c.amount === null ? item : null;
      unpricedRun = c.amount === null ? [...unpricedRun, { item, unit: c.unit }] : [];
    } else if (c.amount !== null) {
      if (unpricedRun.length >= 2) {
        // "due caffè e un panino, 8 euro": 8 euro in tutto, non 8 euro il panino.
        const label = listPhrase(unpricedRun.map((r) => countPhrase(r.item.count, r.unit)));
        for (const r of unpricedRun) items.splice(items.indexOf(r.item), 1);
        items.push({ unitId: OTHER.id, count: 1, cents: c.amount, priced: "testo", label });
        unpricedRun = [];
        lastWithoutAmount = null;
      } else if (lastWithoutAmount) {
        // "ho fatto la spesa, circa 30 euro": l'importo da solo va alla voce prima.
        lastWithoutAmount.cents = c.amount;
        lastWithoutAmount.priced = "testo";
        lastWithoutAmount = null;
        unpricedRun = [];
      } else {
        items.push({ unitId: OTHER.id, count: 1, cents: c.amount, priced: "testo" });
      }
    } else if (c.meaningful) {
      unknown.push(chunk);
    }
  }
  return { items, unknown, totalCents: items.reduce((s, x) => s + x.cents, 0) };
}
