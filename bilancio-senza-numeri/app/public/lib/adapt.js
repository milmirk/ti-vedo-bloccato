/*
 * La parte che si adatta: dalle risposte alle domande al modo di mostrare i soldi.
 *
 * Quattro rappresentazioni, dalla più compatta alla più concreta:
 *   grandi  → tutto insieme, con tutti gli oggetti scelti (anche i più cari)
 *   piccoli → tutto insieme, solo con gli oggetti piccoli e familiari
 *   giorni  → giorno per giorno: la parte di ogni giorno, in oggetti
 *   oggi    → solo oggi, il resto si apre a richiesta
 *
 * Regole (deterministiche, testate in adapt.test.mjs):
 *  1. Risposta sbagliata o «Non so» → un gradino più concreto, e il cambio si registra.
 *  2. Se le ultime tre risposte con questa rappresentazione erano giuste,
 *     un singolo errore è tollerato: si resta dove si è.
 *  3. All'ultimo gradino si resta lì.
 *  4. Una risposta giusta non cambia nulla; tre di fila segnano che «funziona».
 *  5. La persona può sempre scegliere a mano: vale la sua scelta.
 */
import { evaluateAnswer } from "./questions.js";

export const LADDER = ["grandi", "piccoli", "giorni", "oggi"];

export const REP_LABELS = {
  grandi: "Tutto insieme, con tutti i tuoi oggetti",
  piccoli: "Tutto insieme, con gli oggetti più piccoli",
  giorni: "Giorno per giorno",
  oggi: "Solo oggi",
};

export const REASON_LABELS = {
  sbagliata: "dopo una risposta che non tornava",
  nonso: "dopo un «Non so»",
  scelta: "scelto da te",
};

const TOLERATED_AFTER = 3;
const MAX_CHECKS_PER_DAY = 3;
const SPENDS_BETWEEN_CHECKS = 3;

/** Risposte giuste di fila, dalla più recente, con quella rappresentazione. */
export function correctStreak(checks, rep) {
  let n = 0;
  for (let i = checks.length - 1; i >= 0; i--) {
    if (checks[i].rep !== rep || checks[i].outcome !== "giusta") break;
    n++;
  }
  return n;
}

/**
 * Decide se cambiare rappresentazione dopo l'ultima risposta.
 * @param {string} rep rappresentazione in uso quando è stata fatta la domanda
 * @param {{rep: string, outcome: string}[]} checks tutte le risposte, l'ultima compresa
 * @returns {{to: string, changed: boolean, reason: string}}
 */
export function decideAdaptation(rep, checks) {
  const last = checks[checks.length - 1];
  if (!last) return { to: rep, changed: false, reason: "nessuna" };
  if (last.outcome === "giusta") {
    return { to: rep, changed: false, reason: correctStreak(checks, rep) >= TOLERATED_AFTER ? "funziona" : "giusta" };
  }
  if (correctStreak(checks.slice(0, -1), rep) >= TOLERATED_AFTER) return { to: rep, changed: false, reason: "tollerata" };
  const i = LADDER.indexOf(rep);
  if (i < 0) return { to: LADDER[0], changed: true, reason: last.outcome };
  if (i === LADDER.length - 1) return { to: rep, changed: false, reason: "gia-concreta" };
  return { to: LADDER[i + 1], changed: true, reason: last.outcome };
}

/** Quando fare una domanda: di tanto in tanto, mai più di tre al giorno. */
export function shouldAsk(state, todayISO) {
  if (state.pending) return false;
  if (state.spends.length === 0 && state.checks.length === 0) return false;
  const today = state.checks.filter((c) => c.day === todayISO).length;
  if (today >= MAX_CHECKS_PER_DAY) return false;
  // «Non ora»: per oggi si riprova solo dopo qualche altra spesa.
  if (state.snooze && state.snooze.day === todayISO && state.spends.filter((s) => s.id > state.snooze.seq).length < SPENDS_BETWEEN_CHECKS) return false;
  if (state.checks.length === 0) return true;
  const spendsSince = state.spends.filter((s) => s.id > (state.lastCheckSeq || 0)).length;
  return spendsSince >= SPENDS_BETWEEN_CHECKS || (today === 0 && state.spends.some((s) => s.day === todayISO));
}

/** «Non ora» (o nessuna domanda sensata): niente domande per un po'. */
export function postpone(state, todayISO) {
  return { ...state, pending: null, snooze: { day: todayISO, seq: state.seq } };
}

/**
 * Registra la risposta alla domanda in sospeso e applica le regole.
 * @returns {{state: object, outcome: string, decision: object}}
 */
export function answerPending(state, answer, { todayISO, at = Date.now() }) {
  const q = state.pending;
  if (!q) throw new Error("nessuna domanda in sospeso");
  const outcome = evaluateAnswer(q, answer);
  const check = { day: todayISO, at, kind: q.kind, rep: q.rep, answer, correct: q.answer, outcome, text: q.text };
  const checks = [...state.checks, check];
  const decision = decideAdaptation(q.rep, checks);
  const adaptations = decision.changed
    ? [...state.adaptations, { day: todayISO, at, from: q.rep, to: decision.to, reason: decision.reason }]
    : state.adaptations;
  return {
    state: { ...state, checks, adaptations, pending: null, rep: decision.changed ? decision.to : state.rep, lastCheckSeq: state.seq },
    outcome,
    decision,
  };
}

/** Scelta manuale della rappresentazione: anche questa resta nello storico. */
export function chooseRepresentation(state, rep, { todayISO, at = Date.now() }) {
  if (!LADDER.includes(rep) || rep === state.rep) return state;
  return {
    ...state,
    rep,
    adaptations: [...state.adaptations, { day: todayISO, at, from: state.rep, to: rep, reason: "scelta" }],
  };
}

/**
 * L'evidenza: le risposte nel tempo e il modo che funziona meglio.
 * "Meglio" = più risposte giuste in proporzione, con almeno due domande;
 * a parità, quella con più domande, poi la più recente.
 */
export function evidence(checks) {
  const byRep = LADDER.map((rep) => {
    const xs = checks.filter((c) => c.rep === rep);
    return {
      rep,
      asked: xs.length,
      right: xs.filter((c) => c.outcome === "giusta").length,
      wrong: xs.filter((c) => c.outcome === "sbagliata").length,
      nonso: xs.filter((c) => c.outcome === "nonso").length,
      lastIndex: xs.length ? checks.lastIndexOf(xs[xs.length - 1]) : -1,
    };
  });
  const eligible = byRep.filter((r) => r.asked >= 2);
  eligible.sort((a, b) => b.right / b.asked - a.right / a.asked || b.asked - a.asked || b.lastIndex - a.lastIndex);
  const best = eligible.length && eligible[0].right > 0 ? eligible[0].rep : null;
  return { byRep, best, total: checks.length, right: checks.filter((c) => c.outcome === "giusta").length };
}
