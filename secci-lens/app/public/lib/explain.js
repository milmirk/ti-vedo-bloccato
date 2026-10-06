/*
 * SECCI Lens · testi a regole, senza AI.
 *
 * Ogni frase semplice nasce da un dato letto nel documento (con il suo brano
 * originale) o da un calcolo di finance.js. Nessuna frase dice cosa scegliere:
 * i test passano tutti questi testi da findAdvice() e findRanking().
 */
import { formatEuro, formatPercent, formatNumber, formatMonths, round2, roundTo } from "./finance.js";

const E = formatEuro;
const P = (n, d = 2) => formatPercent(n, d);

const TIMING_TEXT = {
  start: "da pagare alla firma",
  first: "aggiunte alla prima rata",
  each: "su ogni rata",
};

export function timingText(fee) {
  if (fee.assumed) return "il documento non dice quando si pagano: nel calcolo le consideriamo alla firma";
  const t = TIMING_TEXT[fee.timing] || "";
  if (fee.kind === "bollo" || fee.kind === "imposta") return t.replace("aggiunte", "aggiunta");
  return t;
}

const FEE_PLAIN = {
  istruttoria: (f) => `Le spese di istruttoria sono il costo per preparare la pratica: ${E(f.amount)}, ${timingText(f)}.`,
  bollo: (f) => `L'imposta di bollo è una tassa sul contratto: ${E(f.amount)}, ${timingText(f)}.`,
  imposta: (f) => `L'imposta sostitutiva è una tassa sul finanziamento: ${E(f.amount)}, ${timingText(f)}.`,
  incasso: (f, a) => `Le spese di incasso si pagano ogni volta che il finanziatore incassa una rata: ${E(f.amount)} per rata, ${E(f.total ?? f.amount * a.installments.count)} in tutto.`,
  altro: (f) => `«${f.label}»: ${E(f.amount)}, ${timingText(f)}. È un costo del credito.`,
};

/** Prima rata e rata "normale" (dal mese 2), spese comprese. */
export function rataInfo(analysis) {
  const rows = analysis.schedule.filter((r) => r.k > 0);
  const first = rows[0]?.total ?? 0;
  const regular = rows[1]?.total ?? first;
  return { first: round2(first), regular: round2(regular), differs: Math.abs(first - regular) > 0.005 };
}

/**
 * Frasi "Il documento dice → In parole semplici", una per dato letto.
 * quote è sempre il brano esatto del documento.
 */
export function plainSentences(parsed, analysis) {
  const f = parsed.fields;
  const a = analysis;
  const out = [];
  const push = (key, field, plain) => field && out.push({ key, quote: field.source, plain, origin: "regole" });

  push("creditAmount", f.creditAmount, `È la somma che il finanziatore ti presta: ${E(a.creditAmount)}.`);
  if (f.duration) push("duration", f.duration, `Il contratto dura ${formatMonths(f.duration.months)}: è il tempo in cui paghi le rate.`);
  if (f.installments) {
    const n = a.installments.count;
    const per = a.installments.periodsPerYear === 12 ? "una al mese" : "una a ogni scadenza";
    let s = `Paghi ${n} rate, ${per}, da ${E(a.installments.amount)}.`;
    const r = rataInfo(a);
    const each = a.fees.filter((x) => x.timing === "each");
    if (each.length) s += ` A ogni rata si aggiungono ${E(each.reduce((t, x) => t + x.amount, 0))} di spese, quindi paghi ${E(r.regular)}.`;
    if (r.differs) s += ` La prima rata è più alta, ${E(r.first)}, perché comprende anche altre spese.`;
    push("installments", f.installments, s);
  }
  push("totalDue", f.totalDue, `In tutto restituisci ${E(f.totalDue?.value ?? a.totalDue)}: la somma prestata più interessi e spese.`);
  if (f.tan) {
    const s = f.tan.value === 0
      ? `Il TAN è il tasso degli interessi: qui è ${P(0)}, quindi non paghi interessi.${a.feesTotal > 0 ? " Le spese però si pagano lo stesso." : ""}`
      : `Il TAN è il tasso degli interessi, in percentuale all'anno: qui è ${f.tan.raw.replace(/\s+/g, "")}. Non comprende le spese.`;
    push("tan", f.tan, s);
  }
  if (f.taeg) {
    let s = `Il TAEG mette insieme interessi e spese obbligatorie, in percentuale all'anno: il documento scrive ${f.taeg.raw.replace(/\s+/g, "")}.`;
    if (f.tan && f.taeg.value > f.tan.value) s += " Per questo è più alto del TAN.";
    push("taeg", f.taeg, s);
  }
  for (const fee of parsed.fees) {
    const withTotal = a.fees.find((x) => x.kind === fee.kind && x.amount === fee.amount) || fee;
    out.push({ key: "fee_" + fee.kind, quote: fee.source, plain: (FEE_PLAIN[fee.kind] || FEE_PLAIN.altro)(withTotal, a), origin: "regole" });
  }
  return out;
}

// ── Il costo in cose di tutti i giorni ─────────────────────────────────

export const UNITS = [
  { id: "caffe", one: "caffè al bar", many: "caffè al bar", price: 1.2, gender: "m" },
  { id: "bus", one: "biglietto dell'autobus", many: "biglietti dell'autobus", price: 2, gender: "m" },
  { id: "pizza", one: "pizza", many: "pizze", price: 8, gender: "f" },
  { id: "spesa", one: "spesa piccola", many: "spese piccole", price: 25, gender: "f" },
  { id: "pieno", one: "pieno di benzina", many: "pieni di benzina", price: 60, gender: "m" },
];

/** "30 caffè al bar" · "4 pizze e mezza" · "circa 19 pieni di benzina" · "meno di un pieno di benzina". */
export function countPhrase(count, unit) {
  const art = unit.gender === "f" ? "una" : "un";
  const half = unit.gender === "f" ? "mezza" : "mezzo";
  if (!(count > 0)) return `0 ${unit.many}`;
  const whole = Math.floor(count + 1e-9);
  const frac = count - whole;
  if (whole === 0) {
    if (frac >= 0.4 && frac <= 0.6) return `${half} ${unit.one}`;
    return `meno di ${art} ${unit.one}`;
  }
  const name = (n) => (n === 1 ? `1 ${unit.one}` : `${formatNumber(n, 0)} ${unit.many}`);
  if (frac < 0.005) return name(whole);
  if (frac >= 0.45 && frac <= 0.55) return `${name(whole)} e ${half}`;
  const r = Math.round(count);
  return `circa ${r === 1 ? `${art} ${unit.one}` : `${formatNumber(r, 0)} ${unit.many}`}`;
}

export function everyday(amount, unit) {
  const price = unit.price;
  if (!(price > 0)) return null;
  const count = amount / price;
  // Oltre 100 simboli ogni simbolo vale 10 oggetti, per restare leggibile.
  const per = count > 100 ? 10 : 1;
  return {
    count,
    per,
    icons: count / per,
    phrase: countPhrase(count, unit),
    sentence: `${E(amount)} sono come ${countPhrase(count, unit)} (prezzo indicativo: ${E(price)}).`,
    math: `${E(amount)} ÷ ${E(price)} = ${formatNumber(roundTo(count, 2), Number.isInteger(roundTo(count, 2)) ? 0 : 2)}`,
  };
}

// ── Controllo dei numeri ───────────────────────────────────────────────

const CHECK_NAMES = { taeg: "TAEG", totalDue: "Importo totale dovuto", tan: "TAN e rate" };

export function coherenceMessage(check) {
  const name = CHECK_NAMES[check.key];
  if (check.key === "taeg") {
    const d = Math.max(2, check.decimals ?? 2);
    const base = `Il TAEG calcolato dai dati del documento è ${P(check.computed, d)}, il documento dice ${P(check.declared, check.decimals ?? 2)}.`;
    return { name, match: check.match, text: check.match ? `${base} I numeri coincidono.` : `${base} Puoi chiedere chiarimenti al finanziatore.` };
  }
  if (check.key === "totalDue") {
    const base = `Sommando tutti i pagamenti del documento si arriva a ${E(check.computed)}, il documento dice ${E(check.declared)}.`;
    return { name, match: check.match, text: check.match ? `${base} I numeri coincidono.` : `${base} Puoi chiedere chiarimenti al finanziatore.` };
  }
  const base = `Il TAN che corrisponde alle rate del documento è ${P(check.computed)}, il documento dice ${P(check.declared)}.`;
  const tiny = check.match && Math.abs(check.computed - check.declared) >= 0.005;
  return {
    name, match: check.match,
    text: check.match
      ? `${base} I numeri coincidono${tiny ? ": la piccola differenza viene dall'arrotondamento della rata ai centesimi" : ""}.`
      : `${base} Puoi chiedere chiarimenti al finanziatore.`,
  };
}

// ── Confronto tra due offerte: solo fatti ─────────────────────────────

const diffEuro = (x) => E(Math.abs(round2(x)));

/**
 * a, b = { name, analysis, declaredTaeg } (name: di solito il finanziatore)
 * Restituisce righe affiancate e frasi di fatto. Mai una classifica.
 */
export function compareOffers(a, b) {
  const A = a.analysis;
  const B = b.analysis;
  const rows = [
    { label: "Ricevi", a: E(A.creditAmount), b: E(B.creditAmount) },
    { label: "Restituisci in totale", a: E(A.totalDue), b: E(B.totalDue) },
    { label: "Il credito costa", a: E(A.totalCost), b: E(B.totalCost) },
    { label: "Per quanto tempo", a: formatMonths(A.durationMonths), b: formatMonths(B.durationMonths) },
    { label: "Numero di rate", a: String(A.installments.count), b: String(B.installments.count) },
    { label: "Rata (senza spese)", a: E(A.installments.amount), b: E(B.installments.amount) },
    { label: "TAEG calcolato dai dati", a: P(A.taegRounded), b: P(B.taegRounded) },
    { label: "TAEG scritto nel documento", a: Number.isFinite(a.declaredTaeg) ? P(a.declaredTaeg) : "non indicato", b: Number.isFinite(b.declaredTaeg) ? P(b.declaredTaeg) : "non indicato" },
  ];

  // Stesso nome per tutte e due (per esempio due offerte dello stesso finanziatore): aggiungo A e B.
  const same = a.name === b.name;
  const nA = same ? `${a.name} (A)` : a.name;
  const nB = same ? `${b.name} (B)` : b.name;
  const facts = [];
  if (Math.abs(A.creditAmount - B.creditAmount) > 0.005) {
    facts.push(`Le due offerte non riguardano la stessa somma (${E(A.creditAmount)} e ${E(B.creditAmount)}): i costi in euro non si possono mettere a confronto direttamente.`);
  }
  const dc = round2(B.totalCost - A.totalCost);
  if (Math.abs(dc) < 0.005) facts.push(`Il credito costa uguale: ${E(A.totalCost)}.`);
  else facts.push(`Il credito di ${nB} costa ${diffEuro(dc)} ${dc > 0 ? "in più" : "in meno"} di quello di ${nA}.`);

  const dm = B.durationMonths - A.durationMonths;
  if (dm === 0) facts.push(`Durano tutte e due ${formatMonths(A.durationMonths)}.`);
  else facts.push(`L'offerta di ${nB} dura ${Math.abs(dm) === 1 ? "1 mese" : `${Math.abs(dm)} mesi`} ${dm > 0 ? "in più" : "in meno"} di quella di ${nA}.`);

  const dr = round2(B.installments.amount - A.installments.amount);
  if (Math.abs(dr) >= 0.005) facts.push(`La rata di ${nB} è di ${diffEuro(dr)} ${dr > 0 ? "più alta" : "più bassa"} di quella di ${nA} (spese escluse).`);
  else facts.push(`La rata è la stessa: ${E(A.installments.amount)} (spese escluse).`);

  const dt = roundTo(B.taegRounded - A.taegRounded, 2);
  if (Math.abs(dt) >= 0.005) facts.push(`Il TAEG calcolato di ${nB} è di ${formatNumber(Math.abs(dt), 2)} punti ${dt > 0 ? "più alto" : "più basso"} di quello di ${nA}.`);

  for (const [o, n] of [[a, nA], [b, nB]]) {
    if (Number.isFinite(o.declaredTaeg) && Math.abs(o.declaredTaeg - o.analysis.taegRounded) > 0.011) {
      facts.push(`Per ${n} il TAEG scritto nel documento (${P(o.declaredTaeg)}) è diverso da quello calcolato dai suoi dati (${P(o.analysis.taegRounded)}).`);
    }
  }
  return {
    rows,
    facts,
    note: "Sono fatti presi dai due documenti. Quale offerta va bene per te dipende da cose che conosci solo tu, per esempio quanto puoi pagare ogni mese.",
  };
}

// ── Micro-quiz ─────────────────────────────────────────────────────────

/** Domande costruite sui numeri del documento. Le opzioni sono uniche. */
export function buildQuiz(parsed, analysis) {
  const a = analysis;
  const f = parsed.fields;
  const tan = f.tan ? f.tan.raw.replace(/\s+/g, "") : P(a.impliedTan);
  const taeg = f.taeg ? f.taeg.raw.replace(/\s+/g, "") : P(a.taegRounded);
  const feeNames = a.fees.filter((x) => x.kind !== "altro").map((x) => x.label.toLowerCase());
  const feeList = feeNames.length ? feeNames.join(", ") : "le spese obbligatorie";
  const goods = f.goods ? "Il prezzo del bene che compri" : "La somma che ricevi";

  const qs = [
    {
      id: "tan-taeg",
      text: f.tan && f.taeg
        ? `Il documento scrive TAN ${tan} e TAEG ${taeg}. Quale dei due comprende anche le spese?`
        : `Con i dati del documento, il TAN è ${tan} e il TAEG è ${taeg}. Quale dei due comprende anche le spese?`,
      options: [`Il TAN (${tan})`, `Il TAEG (${taeg})`, "Nessuno dei due"],
      correct: 1,
      explain: "Il TAEG comprende interessi e spese obbligatorie. Il TAN riguarda solo gli interessi.",
      where: "Tasso annuo effettivo globale (TAEG)",
    },
    {
      id: "totale",
      text: "Alla fine, quanto restituisci in tutto?",
      options: [E(a.installments.amount), E(a.creditAmount), E(a.totalDue)],
      correct: 2,
      explain: `In tutto restituisci ${E(a.totalDue)}: la somma ricevuta (${E(a.creditAmount)}) più interessi e spese.`,
      where: "Importo totale dovuto dal consumatore",
    },
    {
      id: "include",
      text: "Cosa c'è dentro il TAEG?",
      options: [`Interessi e spese obbligatorie (${feeList})`, "Solo gli interessi", goods],
      correct: 0,
      explain: "Il TAEG è il costo totale del credito in percentuale all'anno: interessi più spese obbligatorie.",
      where: "Tasso annuo effettivo globale (TAEG)",
    },
    {
      id: "costo",
      text: "Quanto ti costa il credito, cioè quanto paghi in più della somma ricevuta?",
      options: [a.totalCost === 0 ? E(a.installments.amount) : E(0), E(a.totalDue), E(a.totalCost)],
      correct: 2,
      explain: `${E(a.totalDue)} − ${E(a.creditAmount)} = ${E(a.totalCost)}.${a.interestTotal === 0 && a.totalCost > 0 ? " Anche con TAN 0% le spese sono un costo." : ""}`,
      where: "Importo totale dovuto dal consumatore",
    },
  ];
  // Opzioni uguali (per esempio rata = totale) renderebbero la domanda ambigua: la togliamo.
  return qs.filter((q) => new Set(q.options).size === q.options.length);
}

export function scoreQuiz(quiz, answers) {
  return quiz.reduce((s, q) => s + (answers[q.id] === q.correct ? 1 : 0), 0);
}

// ── Sintesi ────────────────────────────────────────────────────────────

export function summaryLine(parsed, analysis) {
  const who = parsed.fields.lender?.value ? `${parsed.fields.lender.value}: ` : "";
  return `${who}ricevi ${E(analysis.creditAmount)}, restituisci in totale ${E(analysis.totalDue)}, il credito costa ${E(analysis.totalCost)}, per ${formatMonths(analysis.durationMonths)}.`;
}

/** Per il riquadro TAN e TAEG: di cosa è fatto il costo del credito. */
export function costParts(analysis) {
  const parts = [{ label: "Interessi", amount: analysis.interestTotal, note: "dalle rate: totale rate − somma ricevuta" }];
  for (const f of analysis.fees) {
    parts.push({
      label: f.label, amount: f.total,
      note: f.timing === "each" ? `${formatNumber(f.amount, 2)} € × ${analysis.installments.count} rate` : timingText(f),
    });
  }
  return parts;
}
