/*
 * Le domande di comprensione.
 *
 * Ogni tanto l'app chiede qualcosa di concreto sulla situazione della
 * persona ("Se prima di venerdì prendi tre spese piccole, bastano i soldi
 * che ti restano?"). La risposta giusta è calcolata qui, dai dati veri, mai
 * dall'AI. Le domande sono costruite vicino alla soglia (altrimenti sarebbero
 * banali) ma mai a pochi centesimi da essa (altrimenti sarebbero tranelli).
 */
import { decompose } from "./units.js";
import { countPhrase, partsPhrase, dayName, isSingular } from "./words.js";

export const ANSWERS = ["si", "no", "nonso"];
export const MAX_COUNT_IN_QUESTION = 6;

/** Generatore pseudo-casuale con seme: stesse domande a parità di dati. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFrom(str) {
  let h = 2166136261;
  for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Quali domande fare, in ordine, per ogni rappresentazione. */
export const KINDS_BY_REP = {
  grandi: ["basta", "dopo", "oggi"],
  piccoli: ["basta", "oggi", "dopo"],
  giorni: ["oggi", "dopo", "basta"],
  oggi: ["oggi", "dopo"],
};

/**
 * Una cifra arrotondata in oggetti, con il numero del verbo che la segue:
 * { text: "circa due pizze e un caffè", singular: false }.
 */
export function approx(cents, units) {
  const dec = decompose(cents, units, 2);
  if (!dec.parts.length) return { text: cents > 0 ? "solo qualche spicciolo" : "niente", singular: true };
  return { text: "circa " + partsPhrase(dec, { spiccioli: false }), singular: isSingular(dec, { spiccioli: false }) };
}

/** "circa due pizze e un caffè" / "solo qualche spicciolo" / "niente" */
export function approxPhrase(cents, units) {
  return approx(cents, units).text;
}

/** "dopo restano circa…", "dopo resta solo qualche spicciolo", "dopo non resta niente" */
function rest(a, singular, plural) {
  if (a.text === "niente") return `non ${singular} niente`;
  return `${a.singular ? singular : plural} ${a.text}`;
}

function minGapFor(target, units) {
  const smallest = Math.min(...units.map((u) => u.cents));
  return Math.max(smallest, Math.round(target * 0.08));
}

/**
 * Combinazioni "k × oggetto" vicine alla soglia, dalla parte voluta.
 * wantYes: il costo resta entro la soglia (≤); altrimenti la supera.
 */
export function nearCombos(target, units, wantYes) {
  const minGap = minGapFor(target, units);
  const out = [];
  for (const unit of units) {
    for (let count = 1; count <= MAX_COUNT_IN_QUESTION; count++) {
      const cents = count * unit.cents;
      const gap = cents - target;
      if (Math.abs(gap) < minGap) continue;
      if (wantYes ? cents > target : cents <= target) continue;
      if (cents < target * 0.6 || cents > target * 1.6) continue;
      out.push({ unit, count, cents, dist: Math.abs(gap) });
    }
  }
  return out.sort((a, b) => a.dist - b.dist || a.unit.id.localeCompare(b.unit.id) || a.count - b.count);
}

function pick(list, r) {
  if (!list.length) return null;
  return list[Math.floor(r() * Math.min(3, list.length))];
}

function build(kind, wantYes, ctx, r) {
  const { plan, units, todayISO } = ctx;
  const smallest = Math.min(...units.map((u) => u.cents));
  const day = dayName(plan.paydayISO, todayISO);

  if (kind === "basta") {
    if (plan.daysLeft < 2 || plan.remaining < smallest * 2) return null;
    const c = pick(nearCombos(plan.remaining, units, wantYes), r);
    if (!c) return null;
    const yes = c.cents <= plan.remaining;
    return {
      kind, answer: yes ? "si" : "no", targetCents: plan.remaining, costCents: c.cents,
      combo: { unitId: c.unit.id, count: c.count, icon: c.unit.icon },
      text: `Se prima di ${day} prendi ${countPhrase(c.count, c.unit)}, bastano i soldi che ti restano?`,
      fact: yes
        ? `Bastano, e dopo ${rest(approx(plan.remaining - c.cents, units), "resta", "restano")}.`
        : `Non bastano: mancherebbero soldi per ${approxPhrase(c.cents - plan.remaining, units)}.`,
    };
  }

  if (kind === "oggi") {
    if (plan.todayLeft < smallest) return null;
    const c = pick(nearCombos(plan.todayLeft, units, wantYes), r);
    if (!c) return null;
    const yes = c.cents <= plan.todayLeft;
    return {
      kind, answer: yes ? "si" : "no", targetCents: plan.todayLeft, costCents: c.cents,
      combo: { unitId: c.unit.id, count: c.count, icon: c.unit.icon },
      text: `Se oggi prendi ${countPhrase(c.count, c.unit)}, resti dentro quello che puoi usare oggi?`,
      fact: yes
        ? `Ci resti dentro: per oggi ${rest(approx(plan.todayLeft - c.cents, units), "resterebbe ancora", "resterebbero ancora")}.`
        : `Per oggi ${rest(approx(c.cents - plan.todayLeft, units), "mancherebbe", "mancherebbero")}. Se lo fai lo stesso, i giorni dopo avranno un po' meno.`,
    };
  }

  if (kind === "dopo") {
    if (plan.daysLeft < 2 || plan.remaining < smallest * 3) return null;
    // L'oggetto di "stasera": uno solo, scelto tra quelli che non si mangiano tutto.
    const items = units.filter((u) => u.cents * 3 <= plan.remaining).sort((a, b) => a.cents - b.cents);
    if (!items.length) return null;
    const item = items[Math.floor((items.length - 1) / 2 + r() * 0.99)] || items[0];
    const after = plan.remaining - item.cents;
    const c = pick(nearCombos(after, units, wantYes), r);
    if (!c) return null;
    const yes = after >= c.cents;
    return {
      kind, answer: yes ? "si" : "no", targetCents: after, costCents: c.cents, itemCents: item.cents,
      combo: { unitId: c.unit.id, count: c.count, icon: c.unit.icon },
      item: { unitId: item.id, icon: item.icon },
      text: `Se oggi prendi ${item.one}, fino a ${day} ti ${c.count === 1 ? "resta" : "restano"} almeno ${countPhrase(c.count, c.unit)}?`,
      fact: `Dopo ${item.one}, fino a ${day} ${rest(approx(after, units), "resta", "restano")}.`,
    };
  }
  return null;
}

/**
 * Crea una domanda per la situazione di oggi, con le unità della
 * rappresentazione in uso. Restituisce null se non c'è una domanda sensata
 * (per esempio quando i soldi sono finiti).
 *
 * @param {{plan: object, units: object[], todayISO: string, rep: string, index?: number, seed?: number}} ctx
 */
export function makeQuestion(ctx) {
  if (!ctx.units || !ctx.units.length || ctx.plan.ended) return null;
  const r = rng(ctx.seed ?? seedFrom(`${ctx.todayISO}:${ctx.index || 0}:${ctx.plan.remaining}`));
  const base = KINDS_BY_REP[ctx.rep] || KINDS_BY_REP.grandi;
  const start = (ctx.index || 0) % base.length;
  // Prima i tipi adatti alla rappresentazione (a rotazione), poi gli altri se nessuno è possibile.
  const kinds = [...base.slice(start), ...base.slice(0, start), "basta", "oggi", "dopo"];
  const tried = new Set();
  for (const kind of kinds) {
    if (tried.has(kind)) continue;
    tried.add(kind);
    const firstYes = r() < 0.5;
    for (const wantYes of [firstYes, !firstYes]) {
      const q = build(kind, wantYes, ctx, r);
      if (q) return { ...q, rep: ctx.rep, day: ctx.todayISO };
    }
  }
  return null;
}

/** "giusta", "sbagliata" o "nonso". */
export function evaluateAnswer(question, answer) {
  if (!ANSWERS.includes(answer)) throw new Error("risposta non valida");
  if (answer === "nonso") return "nonso";
  return answer === question.answer ? "giusta" : "sbagliata";
}

/**
 * Il riscontro per la persona: prima la risposta, poi il fatto. Mai un
 * giudizio: «Esatto, la risposta è no» non si può leggere come «hai sbagliato».
 */
export function feedbackText(question, outcome) {
  const yn = question.answer === "si" ? "sì" : "no";
  if (outcome === "giusta") return `Esatto, la risposta è ${yn}. ${question.fact}`;
  if (outcome === "nonso") return `Nessun problema. La risposta è ${yn}. ${question.fact}`;
  return `Ecco come stanno le cose: la risposta è ${yn}. ${question.fact}`;
}
