/*
 * Gli oggetti quotidiani che prendono il posto dei numeri.
 *
 * Tutti gli importi sono in centesimi (interi): niente virgole mobili,
 * niente arrotondamenti a sorpresa. Il prezzo è indicativo e la persona lo
 * può cambiare una volta, durante l'impostazione.
 *
 * Modulo ES condiviso: lo usano il browser (public/app.js), il server e i test.
 */

/**
 * @typedef {Object} Unit
 * @property {string} id
 * @property {string} icon     emoji decorativa, sempre accompagnata dal testo
 * @property {string} one      "un caffè": forma al singolare con articolo
 * @property {string} plural   "caffè": forma plurale senza articolo
 * @property {"m"|"f"} g       genere, per "uno"/"una"
 * @property {number} cents    prezzo indicativo in centesimi
 * @property {string[]} words  parole con cui la persona lo può scrivere (senza accenti)
 */

/** @type {Unit[]} */
export const CATALOG = [
  { id: "caffe", icon: "☕", one: "un caffè", plural: "caffè", g: "m", cents: 120, words: ["caffe", "caffè", "espresso", "espressi"] },
  { id: "bus", icon: "🚌", one: "un biglietto del bus", plural: "biglietti del bus", g: "m", cents: 200, words: ["biglietto del bus", "biglietti del bus", "biglietto bus", "autobus", "bus", "metro", "tram"] },
  { id: "colazione", icon: "🥐", one: "una colazione al bar", plural: "colazioni al bar", g: "f", cents: 300, words: ["colazione al bar", "colazioni al bar", "colazione", "colazioni", "cornetto", "cornetti", "brioche"] },
  { id: "gelato", icon: "🍦", one: "un gelato", plural: "gelati", g: "m", cents: 300, words: ["gelato", "gelati"] },
  { id: "panino", icon: "🥪", one: "un panino", plural: "panini", g: "m", cents: 500, words: ["panino", "panini", "tramezzino", "tramezzini", "toast"] },
  { id: "pizza", icon: "🍕", one: "una pizza", plural: "pizze", g: "f", cents: 800, words: ["pizza", "pizze"] },
  { id: "cinema", icon: "🎬", one: "un biglietto del cinema", plural: "biglietti del cinema", g: "m", cents: 900, words: ["biglietto del cinema", "biglietti del cinema", "cinema", "film"] },
  { id: "ricarica", icon: "📱", one: "una ricarica del telefono", plural: "ricariche del telefono", g: "f", cents: 1000, words: ["ricarica del telefono", "ricariche del telefono", "ricarica", "ricariche"] },
  { id: "pranzo", icon: "🍝", one: "un pranzo fuori", plural: "pranzi fuori", g: "m", cents: 1200, words: ["pranzo fuori", "pranzi fuori", "pranzo", "pranzi", "ristorante", "trattoria"] },
  { id: "spesa", icon: "🛒", one: "una spesa piccola", plural: "spese piccole", g: "f", cents: 2500, words: ["spesa piccola", "spese piccole", "spesa", "spese", "supermercato", "alimentari"] },
  { id: "pieno", icon: "⛽", one: "un pieno di benzina", plural: "pieni di benzina", g: "m", cents: 6000, words: ["pieno di benzina", "pieni di benzina", "pieno", "pieni", "benzina", "gasolio", "carburante"] },
  { id: "spesagrande", icon: "🧺", one: "una spesa grande", plural: "spese grandi", g: "f", cents: 8000, words: ["spesa grande", "spese grandi", "spesa della settimana", "spesona"] },
];

/** La voce generica per una spesa che non corrisponde a nessun oggetto. */
export const OTHER = { id: "altro", icon: "🧾", one: "un'altra spesa", plural: "altre spese", g: "f", cents: 0, words: [] };

/** Proposta iniziale (la persona la cambia con un tocco). */
export const DEFAULT_CHOICE = ["caffe", "pizza", "pranzo", "spesa"];

export const MIN_UNITS = 3;
export const MAX_UNITS = 5;
export const MIN_PRICE_CENTS = 10;
export const MAX_PRICE_CENTS = 50000;

const BY_ID = new Map(CATALOG.map((u) => [u.id, u]));

export function catalogUnit(id) {
  if (id === OTHER.id) return OTHER;
  return BY_ID.get(id) || null;
}

/**
 * Le unità scelte, con il prezzo della persona al posto di quello indicativo.
 * @param {{id: string, cents?: number}[]} choice
 * @returns {Unit[]}
 */
export function resolveUnits(choice) {
  const out = [];
  for (const c of choice || []) {
    const base = BY_ID.get(c && c.id);
    if (!base || out.some((u) => u.id === base.id)) continue;
    const cents = Number.isInteger(c.cents) && c.cents >= MIN_PRICE_CENTS && c.cents <= MAX_PRICE_CENTS ? c.cents : base.cents;
    out.push({ ...base, cents });
  }
  return out;
}

/** Tutto il catalogo, con i prezzi della persona dove li ha cambiati. */
export function allUnits(choice) {
  const mine = new Map(resolveUnits(choice).map((u) => [u.id, u]));
  return CATALOG.map((u) => mine.get(u.id) || u);
}

export function byPriceDesc(units) {
  return [...units].filter((u) => u.cents > 0).sort((a, b) => b.cents - a.cents || a.id.localeCompare(b.id));
}

/**
 * Scompone una cifra negli oggetti scelti: deterministico, dal più grande al
 * più piccolo (greedy). Quello che avanza, più piccolo dell'oggetto più
 * piccolo, è il resto ("qualche spicciolo").
 *
 * @param {number} cents
 * @param {Unit[]} units
 * @param {number} [maxParts] se indicato, si ferma dopo tanti tipi di oggetto (per i "circa")
 * @returns {{parts: {unit: Unit, count: number}[], rest: number}}
 */
export function decompose(cents, units, maxParts = Infinity) {
  let rest = Math.max(0, Math.floor(Number(cents) || 0));
  const parts = [];
  for (const unit of byPriceDesc(units)) {
    if (parts.length >= maxParts) break;
    const count = Math.floor(rest / unit.cents);
    if (count > 0) {
      parts.push({ unit, count });
      rest -= count * unit.cents;
    }
  }
  return { parts, rest };
}

/** Somma di una scomposizione: serve ai test e ai controlli. */
export function partsCents(parts) {
  return parts.reduce((s, p) => s + p.unit.cents * p.count, 0);
}

/**
 * Le unità usate da una rappresentazione.
 *  - "grandi": tutte quelle scelte.
 *  - le altre: quelle piccole e familiari. Si toglie sempre l'oggetto più
 *    caro e ogni oggetto che costa più di quanto c'è per un giorno, ma ne
 *    restano almeno due (i più piccoli).
 *
 * @param {string} rep
 * @param {Unit[]} units
 * @param {number} dailyCents
 */
export function unitsFor(rep, units, dailyCents) {
  const asc = [...units].filter((u) => u.cents > 0).sort((a, b) => a.cents - b.cents || a.id.localeCompare(b.id));
  if (rep === "grandi" || asc.length <= 2) return asc;
  const withoutBiggest = asc.slice(0, -1);
  const limit = Math.max(dailyCents || 0, asc[1].cents);
  const small = withoutBiggest.filter((u) => u.cents <= limit);
  return small.length >= 2 ? small : asc.slice(0, 2);
}
