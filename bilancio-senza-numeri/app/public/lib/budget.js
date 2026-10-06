/*
 * Lo stato del bilancio e i conti, tutti fatti dal codice.
 *
 * Funzioni pure: ricevono uno stato e ne restituiscono uno nuovo. Il browser
 * lo salva in localStorage; i test lo costruiscono a mano.
 */
import { resolveUnits, allUnits, catalogUnit, OTHER, MIN_UNITS, MAX_UNITS } from "./units.js";
import { nextPayday, daysBetween, spendDays, isISODate } from "./dates.js";

export const STORAGE_KEY = "bilancio-senza-numeri:v1";
export const MAX_START_CENTS = 9999999; // 99.999,99 €
export const MAX_ITEM_CENTS = 200000;   // una voce non supera 2.000 €
export const MAX_COUNT = 20;

/**
 * @param {{startCents: number, todayISO: string, payday: object, units: {id: string, cents?: number}[]}} setup
 */
export function createState({ startCents, todayISO, payday, units }) {
  if (!Number.isInteger(startCents) || startCents < 0 || startCents > MAX_START_CENTS) throw new Error("cifra iniziale non valida");
  if (!isISODate(todayISO)) throw new Error("data di oggi non valida");
  const chosen = resolveUnits(units);
  if (chosen.length < MIN_UNITS || chosen.length > MAX_UNITS) throw new Error("servono da tre a cinque oggetti");
  const paydayISO = nextPayday(todayISO, payday);
  if (daysBetween(todayISO, paydayISO) < 1) throw new Error("il giorno di paga deve essere dopo oggi");
  return {
    v: 1,
    setup: {
      startCents,
      startISO: todayISO,
      payday: payday.type === "date" ? { type: "date", date: payday.date } : { type: "monthly", day: payday.day },
      paydayISO,
      units: chosen.map((u) => ({ id: u.id, cents: u.cents })),
    },
    spends: [],
    seq: 0,
    rep: "grandi",
    showEuro: false,
    checks: [],
    adaptations: [],
    pending: null,
    lastCheckSeq: 0,
  };
}

/** Nuovo periodo: si tengono la rappresentazione e lo storico delle domande. */
export function newPeriod(state, { startCents, todayISO, payday, units }) {
  const fresh = createState({ startCents, todayISO, payday: payday || state.setup.payday, units: units || state.setup.units });
  return { ...fresh, rep: state.rep, showEuro: state.showEuro, checks: state.checks, adaptations: state.adaptations };
}

export function chosenUnits(state) {
  return resolveUnits(state.setup.units);
}

/** Per registrare e leggere le spese: tutto il catalogo, con i prezzi della persona. */
export function knownUnits(state) {
  return allUnits(state.setup.units);
}

export function spentCents(state) {
  return state.spends.reduce((s, x) => s + x.cents, 0);
}

export function remainingCents(state) {
  return state.setup.startCents - spentCents(state);
}

export function spentOn(state, dayISO) {
  return state.spends.filter((s) => s.day === dayISO).reduce((s, x) => s + x.cents, 0);
}

/**
 * Normalizza le voci di una spesa. Ogni voce ha un oggetto noto (o "altro"),
 * una quantità intera e un importo in centesimi calcolato dal codice:
 * se manca, è quantità × prezzo dell'oggetto.
 */
export function normalizeItems(items, units) {
  const byId = new Map(units.map((u) => [u.id, u]));
  const out = [];
  for (const it of items || []) {
    const unit = it && (byId.get(it.unitId) || (it.unitId === OTHER.id ? OTHER : null));
    if (!unit) throw new Error("oggetto sconosciuto: " + (it && it.unitId));
    const count = it.count === undefined ? 1 : it.count;
    if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) throw new Error("quantità non valida");
    let cents = it.cents;
    if (cents === undefined || cents === null) {
      if (unit === OTHER) throw new Error("manca l'importo");
      cents = count * unit.cents;
    }
    if (!Number.isInteger(cents) || cents <= 0 || cents > MAX_ITEM_CENTS) throw new Error("importo non valido");
    const clean = { unitId: unit.id, count, cents };
    // Più cose con un solo totale: l'etichetta è scritta dal codice ("due caffè e un panino").
    if (unit === OTHER && typeof it.label === "string" && it.label.trim()) clean.label = it.label.trim().slice(0, 80);
    out.push(clean);
  }
  if (!out.length) throw new Error("spesa vuota");
  return out;
}

/**
 * Registra una spesa.
 * @param {object} state
 * @param {{unitId: string, count?: number, cents?: number}[]} items
 * @param {{dayISO: string, at?: number, source?: string}} when
 */
export function recordSpend(state, items, { dayISO, at = Date.now(), source = "tocco" }) {
  if (!isISODate(dayISO)) throw new Error("data non valida");
  const clean = normalizeItems(items, knownUnits(state));
  const seq = state.seq + 1;
  const spend = { id: seq, day: dayISO, at, source, items: clean, cents: clean.reduce((s, x) => s + x.cents, 0) };
  return { ...state, seq, spends: [...state.spends, spend] };
}

/** Annulla l'ultima spesa. Restituisce anche la spesa tolta (o null). */
export function undoLast(state) {
  if (!state.spends.length) return { state, removed: null };
  const removed = state.spends[state.spends.length - 1];
  return { state: { ...state, spends: state.spends.slice(0, -1) }, removed };
}

/**
 * Il piano di oggi.
 *  - spendDays: i giorni che i soldi devono coprire (oggi compreso).
 *  - dailyShare: la parte di un giorno, calcolata su quello che c'era a inizio giornata.
 *  - todayLeft: quanto resta della parte di oggi (può essere negativo).
 *  - futureDaily: la parte di ciascuno dei giorni dopo, con quello che resta.
 */
export function dailyPlan(state, todayISO) {
  const paydayISO = state.setup.paydayISO;
  const daysLeft = daysBetween(todayISO, paydayISO);
  const days = spendDays(todayISO, paydayISO);
  const remaining = remainingCents(state);
  const spentToday = spentOn(state, todayISO);
  const startOfToday = remaining + spentToday;
  const dailyShare = Math.floor(Math.max(0, startOfToday) / days);
  const todayLeft = dailyShare - spentToday;
  const futureDays = days - 1;
  const futureDaily = futureDays > 0 ? Math.floor(Math.max(0, remaining - Math.max(0, todayLeft)) / futureDays) : 0;
  return { paydayISO, daysLeft, spendDays: days, ended: daysLeft <= 0, remaining, spentToday, dailyShare, todayLeft, futureDaily, futureDays };
}

/** Legge lo stato salvato; se è rovinato o di un'altra versione, ricomincia. */
export function loadState(json) {
  try {
    const s = JSON.parse(json);
    if (!s || s.v !== 1 || !s.setup || !Array.isArray(s.spends) || !Array.isArray(s.checks)) return null;
    if (!Number.isInteger(s.setup.startCents) || !isISODate(s.setup.paydayISO)) return null;
    if (resolveUnits(s.setup.units).length < MIN_UNITS) return null;
    return {
      adaptations: [], pending: null, lastCheckSeq: 0, rep: "grandi", showEuro: false, seq: s.spends.length,
      ...s,
    };
  } catch {
    return null;
  }
}

export { catalogUnit };
