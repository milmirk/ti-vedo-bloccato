/*
 * Dallo stato a quello che la persona vede e sente.
 *
 * buildView() calcola tutto ciò che la schermata principale mostra: oggetti,
 * puntini dei giorni, testi. Con «Mostra anche gli euro» spento nessun testo
 * contiene numeri: lo verifica il test «modalità senza numeri» (words.test.mjs).
 */
import { chosenUnits, knownUnits, dailyPlan } from "./budget.js";
import { decompose, unitsFor, OTHER } from "./units.js";
import { partsPhrase, paydayPhrase, dayName, numberWord, formatEuro, countPhrase, capitalize, listPhrase, isSingular } from "./words.js";
import { addDays, weekday, WEEKDAYS_SHORT } from "./dates.js";
import { REP_LABELS, REASON_LABELS, LADDER, evidence } from "./adapt.js";
import { approx } from "./questions.js";

const MAX_DOTS = 31;
const MAX_DAY_ROWS = 7;

const withEuro = (text, cents, euro) => (euro ? `${text} (${formatEuro(cents)})` : text);

/** "una domanda", "tre domande" */
function femCount(n, one, many) {
  return n === 1 ? `una ${one}` : `${numberWord(n, "f")} ${many}`;
}

export function buildView(state, todayISO) {
  const euro = !!state.showEuro;
  const units = chosenUnits(state);
  const plan = dailyPlan(state, todayISO);
  const rep = LADDER.includes(state.rep) ? state.rep : "grandi";
  const repUnits = unitsFor(rep, units, plan.dailyShare);
  const smallest = repUnits[0];

  const total = decompose(Math.max(0, plan.remaining), repUnits);
  const today = decompose(Math.max(0, plan.todayLeft), repUnits, 2);
  const future = decompose(plan.futureDaily, repUnits, 2);

  const dots = [];
  const n = Math.max(0, plan.daysLeft);
  for (let i = 0; i <= Math.min(n, MAX_DOTS); i++) {
    const day = addDays(todayISO, i);
    dots.push({ iso: day, kind: i === n ? "paga" : i === 0 ? "oggi" : "giorno", short: WEEKDAYS_SHORT[weekday(day)], name: capitalize(dayName(day, todayISO, { euro })) });
  }

  // Giorno per giorno: anche qui si arrotonda, quindi «circa».
  const dayRows = [];
  if (!plan.ended) {
    for (let i = 0; i < Math.min(plan.spendDays, MAX_DAY_ROWS); i++) {
      const day = addDays(todayISO, i);
      const cents = i === 0 ? Math.max(0, plan.todayLeft) : plan.futureDaily;
      const dec = i === 0 ? today : future;
      const text = dec.parts.length ? `circa ${partsPhrase(dec, { spiccioli: false })}` : smallText(cents, smallest);
      dayRows.push({ iso: day, name: capitalize(dayName(day, todayISO, { euro })), dec, cents, text: withEuro(text, cents, euro) });
    }
  }

  const texts = {
    header: paydayPhrase(todayISO, plan.paydayISO, { euro }),
    dotsLabel: plan.ended
      ? "Il periodo è finito"
      : plan.daysLeft === 1 ? "Manca un giorno al giorno di paga" : `Mancano ${euro ? plan.daysLeft : numberWord(plan.daysLeft)} giorni al giorno di paga`,
    remainingTitle: plan.remaining < 0 ? "Soldi finiti per questo periodo" : plan.remaining === 0 ? "Non ti resta niente" : isSingular(total) ? "Ti resta" : "Ti restano",
    remaining: remainingText(plan, total, repUnits, euro),
    todayTitle: plan.ended || plan.todayLeft <= 0 ? "Oggi" : today.parts.length ? "Oggi puoi usare circa" : "Oggi puoi usare",
    today: todayText(plan, today, smallest, euro),
    future: futureText(plan, future, smallest, euro),
    moreDays: plan.spendDays > MAX_DAY_ROWS ? "Gli altri giorni, fino al giorno di paga: come quelli sopra." : "",
    rep: REP_LABELS[rep],
  };
  texts.summary = [
    texts.header.replace(" · ", ", ") + ".",
    plan.remaining < 0 ? texts.remaining : texts.remaining ? `${texts.remainingTitle} ${texts.remaining}.` : `${texts.remainingTitle}.`,
    plan.ended ? "" : plan.todayLeft > 0 ? `${texts.todayTitle} ${texts.today}.` : texts.today,
    plan.ended || plan.futureDays < 1 ? "" : texts.future,
  ].filter(Boolean).join(" ");

  return { plan, rep, euro, units, repUnits, total, today, future, dots, dayRows, texts };
}

function remainingText(plan, total, units, euro) {
  if (plan.remaining < 0) {
    const a = approx(-plan.remaining, units);
    return withEuro(`Hai usato più soldi di quelli che avevi per questo periodo: ${a.singular ? "manca" : "mancano"} ${a.text}.`, plan.remaining, euro);
  }
  if (plan.remaining === 0) return "";
  return withEuro(partsPhrase(total), plan.remaining, euro);
}

/** Meno dell'oggetto più piccolo: niente «circa», si dice com'è. */
function smallText(cents, smallest) {
  return cents > 0 ? `meno di ${smallest.one}` : "niente";
}

function todayText(plan, today, smallest, euro) {
  if (plan.ended) return "Oggi arrivano i nuovi soldi. Quando sono arrivati, tocca «Inizia un nuovo periodo».";
  if (plan.todayLeft <= 0) return "La parte di oggi è già stata usata.";
  const text = today.parts.length ? partsPhrase(today, { spiccioli: false }) : smallText(plan.todayLeft, smallest);
  return withEuro(text, plan.todayLeft, euro);
}

function futureText(plan, future, smallest, euro) {
  if (plan.ended || plan.futureDays < 1) return "Domani arrivano i nuovi soldi.";
  if (plan.futureDaily <= 0) return "Per i giorni dopo non resta niente.";
  if (!future.parts.length) return `Da domani, ogni giorno: ${withEuro(smallText(plan.futureDaily, smallest), plan.futureDaily, euro)}.`;
  return `Da domani, ogni giorno circa: ${withEuro(partsPhrase(future, { spiccioli: false }), plan.futureDaily, euro)}.`;
}

function pricierWord(unit, count, more) {
  const end = unit.g === "f" ? (count > 1 ? "e" : "a") : (count > 1 ? "i" : "o");
  return `${more ? "più" : "meno"} car${end} del solito`;
}

/**
 * Una voce di spesa in parole: "un caffè".
 *  - Più cose con un totale scritto dalla persona: "due caffè e un panino (in tutto circa un pranzo fuori)".
 *  - Un oggetto con un importo diverso dal suo prezzo: "una spesa piccola (più cara del solito: circa…)".
 *  - Una spesa che non è un oggetto: "un'altra spesa (circa un pranzo fuori e due caffè)".
 */
export function itemText(item, state, { euro = false } = {}) {
  const unit = knownUnits(state).find((u) => u.id === item.unitId) || OTHER;
  const eur = euro ? `, ${formatEuro(item.cents)}` : "";
  const value = approx(item.cents, chosenUnits(state)).text;
  if (item.label) return `${item.label} (in tutto ${value}${eur})`;
  const base = countPhrase(item.count, unit);
  if (unit === OTHER) return `${base} (${value}${eur})`;
  const standardCents = item.count * unit.cents;
  if (item.cents === standardCents) return withEuro(base, item.cents, euro);
  const pricier = pricierWord(unit, item.count, item.cents > standardCents);
  return value === `circa ${base}` ? `${base} (${pricier}${eur})` : `${base} (${pricier}: ${value}${eur})`;
}

export function spendText(spend, state, opt) {
  return listPhrase(spend.items.map((it) => itemText(it, state, opt)));
}

export function spendIcon(spend, state) {
  const unit = knownUnits(state).find((u) => u.id === spend.items[0].unitId) || OTHER;
  return unit.icon;
}

/** Le ultime spese, dalla più recente. */
export function recentSpends(state, todayISO, limit = 8) {
  const euro = !!state.showEuro;
  return state.spends.slice(-limit).reverse().map((s) => ({
    id: s.id,
    icon: spendIcon(s, state),
    text: capitalize(spendText(s, state, { euro })),
    when: capitalize(dayName(s.day, todayISO, { euro })),
  }));
}

// Segni neutri: una risposta che non torna non è una croce.
const OUTCOME = {
  giusta: { mark: "✓", label: "giusta" },
  sbagliata: { mark: "→", label: "che non tornava" },
  nonso: { mark: "?", label: "«Non so»" },
};

/** Il pannello "evidenza": risposte nel tempo e il modo che funziona meglio. */
export function evidenceView(state, todayISO) {
  const ev = evidence(state.checks);
  const euro = !!state.showEuro;
  const right = (k) => (k === 0 ? "nessuna giusta" : k === 1 ? "una giusta" : `${euro ? k : numberWord(k, "f")} giuste`);
  const asked = (k) => (euro ? `${k} ${k === 1 ? "domanda" : "domande"}` : femCount(k, "domanda", "domande"));
  const summary = (a, r) => `${capitalize(asked(a))}, ${right(r)}`;
  return {
    empty: ev.total === 0,
    intro: "Ogni tanto l'app fa una domanda sulla tua situazione. Se una risposta non torna, cambia il modo di mostrarti i soldi.",
    totals: ev.total === 0 ? "Ancora nessuna domanda." : `${summary(ev.total, ev.right)}.`,
    rows: ev.byRep.filter((r) => r.asked > 0).map((r) => ({
      rep: r.rep,
      label: REP_LABELS[r.rep],
      marks: state.checks.filter((c) => c.rep === r.rep).map((c) => ({ ...OUTCOME[c.outcome], outcome: c.outcome })),
      text: summary(r.asked, r.right),
      current: r.rep === state.rep,
    })),
    best: ev.best
      ? `Finora il modo che funziona meglio per te: «${REP_LABELS[ev.best]}».`
      : "Servono ancora un paio di risposte per capire quale modo funziona meglio.",
    bestRep: ev.best,
    timeline: state.checks.slice(-12).map((c) => ({
      ...OUTCOME[c.outcome],
      outcome: c.outcome,
      when: capitalize(dayName(c.day, todayISO, { euro })),
      rep: REP_LABELS[c.rep],
      text: c.text,
    })),
    changes: state.adaptations.slice(-8).map((a) =>
      `${capitalize(dayName(a.day, todayISO, { euro }))}: da «${REP_LABELS[a.from]}» a «${REP_LABELS[a.to]}», ${REASON_LABELS[a.reason] || "dopo una risposta"}.`),
  };
}
