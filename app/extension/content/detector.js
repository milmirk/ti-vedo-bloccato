/*
 * Ti vedo bloccato — motore di rilevamento del blocco.
 *
 * Logica pura: non tocca il DOM. Riceve eventi già normalizzati da companion.js
 * (click, errori di validazione, cambi di passo, visibilità della scheda...) e
 * decide se l'utente sembra bloccato. Così è testabile in Node (app/test).
 *
 * Segnali emessi:
 *   idle               nessuna azione utile da troppo tempo, a compito iniziato
 *   return_after_away  rientro nella scheda dopo una distrazione
 *   dead_click         click ripetuti su qualcosa che non risponde (es. pulsante disabilitato)
 *   rage_click         raffica di click sullo stesso elemento
 *   field_error        un campo va in errore (subito, o dopo più tentativi se "di rado")
 *   back_forth         avanti e indietro tra gli stessi passi
 *   field_hesitation   entra ed esce dallo stesso campo senza scrivere
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TVB = Object.assign(root.TVB || {}, api);
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // "normale" interviene subito sui segnali chiari (un click su un pulsante
  // disattivato, un errore su un campo); "di rado" aspetta che si ripetano.
  const SENSITIVITY = {
    bassa: {
      idleMs: 30000, awayMs: 20000,
      rageClicks: 4, rageWindowMs: 1500,
      deadClicks: 2, deadWindowMs: 5000,
      fieldErrors: 2,
      backForthReturns: 3, backForthWindowMs: 90000,
      hesitationFocus: 3, hesitationWindowMs: 30000,
      cooldownMs: 25000,
    },
    media: {
      idleMs: 12000, awayMs: 5000,
      rageClicks: 3, rageWindowMs: 2000,
      deadClicks: 1, deadWindowMs: 5000,
      fieldErrors: 1,
      backForthReturns: 2, backForthWindowMs: 60000,
      hesitationFocus: 2, hesitationWindowMs: 30000,
      cooldownMs: 6000,
    },
    alta: {
      idleMs: 8000, awayMs: 3000,
      rageClicks: 3, rageWindowMs: 2500,
      deadClicks: 1, deadWindowMs: 6000,
      fieldErrors: 1,
      backForthReturns: 2, backForthWindowMs: 60000,
      hesitationFocus: 2, hesitationWindowMs: 30000,
      cooldownMs: 3000,
    },
  };

  const SIGNALS = [
    "idle", "return_after_away", "dead_click", "rage_click",
    "field_error", "back_forth", "field_hesitation",
  ];

  // Quanto si alzano le soglie quando l'utente risponde "Non ora".
  const DISMISS_STEP = 1.5;
  const MAX_FACTOR = 3;

  function createDetector(options) {
    const opts = options || {};
    const now = opts.now || (() => Date.now());
    let level = SENSITIVITY[opts.sensitivity] ? opts.sensitivity : "media";

    const factor = {};
    SIGNALS.forEach((s) => (factor[s] = 1));

    const state = {
      engaged: false,          // l'utente ha iniziato a fare qualcosa sulla pagina
      completed: false,        // compito concluso: smetto di osservare
      lastActivity: now(),
      idleFired: false,        // un solo avviso per ogni periodo di inattività
      hiddenAt: null,
      cooldownUntil: 0,
      pausedUntil: 0,
      clicks: [],              // { target, at }
      deadClicks: [],          // { target, at }
      errors: {},              // target -> conteggio
      steps: [],               // { id, at }
      focus: {},               // target -> { n, since }: focus senza modifiche
    };

    function t(name) {
      return SENSITIVITY[level][name];
    }
    function timeThreshold(name, signal) {
      return t(name) * factor[signal];
    }
    function countThreshold(name, signal) {
      return Math.max(1, Math.round(t(name) * factor[signal]));
    }

    function canEmit(at, bypassCooldown) {
      if (state.completed) return false;
      if (at < state.pausedUntil) return false;
      if (!bypassCooldown && at < state.cooldownUntil) return false;
      return true;
    }

    function emit(type, target, detail, at, bypassCooldown) {
      if (!canEmit(at, bypassCooldown)) return [];
      state.cooldownUntil = at + t("cooldownMs");
      return [{ type, target: target || null, detail: detail || {}, at }];
    }

    function markActivity(at) {
      state.engaged = true;
      state.lastActivity = at;
      state.idleFired = false;
    }

    function within(list, windowMs, at) {
      return list.filter((e) => at - e.at <= windowMs);
    }

    function onClick(ev, at) {
      if (ev.dead) {
        markActivity(at);
        state.deadClicks = within(state.deadClicks, t("deadWindowMs"), at);
        state.deadClicks.push({ target: ev.target, at });
        if (state.deadClicks.length >= countThreshold("deadClicks", "dead_click")) {
          const count = state.deadClicks.length;
          state.deadClicks = [];
          return emit("dead_click", ev.target, { count }, at);
        }
        return [];
      }

      markActivity(at);
      state.clicks = within(state.clicks, t("rageWindowMs"), at).filter((c) => c.target === ev.target);
      state.clicks.push({ target: ev.target, at });
      if (state.clicks.length >= countThreshold("rageClicks", "rage_click")) {
        const count = state.clicks.length;
        state.clicks = [];
        return emit("rage_click", ev.target, { count }, at);
      }
      return [];
    }

    function onInvalid(ev, at) {
      markActivity(at);
      const n = (state.errors[ev.target] || 0) + 1;
      state.errors[ev.target] = n;
      if (n >= countThreshold("fieldErrors", "field_error")) {
        state.errors[ev.target] = 0;
        return emit("field_error", ev.target, { count: n, message: ev.message || "" }, at);
      }
      return [];
    }

    function onFocus(ev, at) {
      markActivity(at);
      // Conta solo i ritorni sullo stesso campo in una finestra breve.
      const prev = state.focus[ev.target];
      const entry = prev && at - prev.since <= t("hesitationWindowMs") ? prev : { n: 0, since: at };
      entry.n += 1;
      state.focus[ev.target] = entry;
      if (entry.n >= countThreshold("hesitationFocus", "field_hesitation")) {
        delete state.focus[ev.target];
        return emit("field_hesitation", ev.target, { count: entry.n }, at);
      }
      return [];
    }

    function onChange(ev, at) {
      markActivity(at);
      delete state.focus[ev.target];
      return [];
    }

    function onStep(ev, at) {
      markActivity(at);
      const last = state.steps[state.steps.length - 1];
      if (last && last.id === ev.id) return [];
      // Pagina nuova, contesto nuovo: i conteggi e la pausa tra un suggerimento
      // e l'altro riguardavano il passo precedente.
      state.cooldownUntil = 0;
      state.clicks = [];
      state.deadClicks = [];
      state.errors = {};
      state.focus = {};
      state.steps = within(state.steps, t("backForthWindowMs"), at);
      state.steps.push({ id: ev.id, at });
      // Conta solo i passi indietro (verso un passo scoperto prima di quello
      // che si lascia): tornare indietro una volta per correggere è normale,
      // farlo più volte di fila è un segnale di disorientamento.
      const order = {};
      state.steps.forEach((s) => { if (!(s.id in order)) order[s.id] = Object.keys(order).length; });
      let returns = 0;
      for (let i = 1; i < state.steps.length; i++) {
        if (order[state.steps[i].id] < order[state.steps[i - 1].id]) returns++;
      }
      if (returns >= countThreshold("backForthReturns", "back_forth")) {
        const path = state.steps.map((s) => s.id);
        state.steps = [{ id: ev.id, at }];
        return emit("back_forth", null, { path, step: ev.id }, at);
      }
      return [];
    }

    function onHidden(at) {
      state.hiddenAt = at;
      return [];
    }

    function onVisible(at) {
      const hiddenAt = state.hiddenAt;
      state.hiddenAt = null;
      // Il tempo passato in un'altra scheda non conta come inattività.
      state.lastActivity = at;
      state.idleFired = false;
      if (hiddenAt === null || !state.engaged) return [];
      const awayMs = at - hiddenAt;
      if (awayMs >= timeThreshold("awayMs", "return_after_away")) {
        return emit("return_after_away", null, { awayMs }, at, true);
      }
      return [];
    }

    function record(ev) {
      const at = ev.at != null ? ev.at : now();
      if (state.completed) return [];
      switch (ev.type) {
        case "activity": markActivity(at); return [];
        case "presence":
          // Mouse o scroll: la persona è sulla pagina (sta leggendo), ma non ha
          // ancora iniziato il compito. Azzera l'inattività senza "ingaggiare".
          if (state.engaged) { state.lastActivity = at; state.idleFired = false; }
          return [];
        case "click": return onClick(ev, at);
        case "invalid": return onInvalid(ev, at);
        case "focus": return onFocus(ev, at);
        case "change": return onChange(ev, at);
        case "step": return onStep(ev, at);
        case "hidden": return onHidden(at);
        case "visible": return onVisible(at);
        case "complete": state.completed = true; return [];
        default: return [];
      }
    }

    function tick(at) {
      const current = at != null ? at : now();
      if (!state.engaged || state.idleFired || state.hiddenAt !== null) return [];
      const idleFor = current - state.lastActivity;
      if (idleFor >= timeThreshold("idleMs", "idle")) {
        const out = emit("idle", null, { idleMs: idleFor }, current);
        if (out.length) state.idleFired = true;
        return out;
      }
      return [];
    }

    // "Mi è servito" abbassa la soglia di quel segnale, "Non ora" la alza.
    function feedback(signalType, verdict) {
      if (!(signalType in factor)) return;
      if (verdict === "non_ora") factor[signalType] = Math.min(MAX_FACTOR, factor[signalType] * DISMISS_STEP);
      else if (verdict === "utile") factor[signalType] = Math.max(1, factor[signalType] / DISMISS_STEP);
    }

    return {
      record,
      tick,
      feedback,
      pause(ms, at) { state.pausedUntil = (at != null ? at : now()) + ms; },
      resume() { state.pausedUntil = 0; },
      setSensitivity(next) { if (SENSITIVITY[next]) level = next; },
      get sensitivity() { return level; },
      get factors() { return Object.assign({}, factor); },
      get completed() { return state.completed; },
      get paused() { return now() < state.pausedUntil; },
    };
  }

  return { createDetector, SENSITIVITY, SIGNALS };
});
