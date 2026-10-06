/*
 * Registro amico — il coach adattivo (la capacità agentica dell'app).
 *
 * Per ogni compito ci sono 3 livelli di aiuto:
 *
 *   1 Guidato      istruzione di ogni passo + evidenziazione del prossimo elemento
 *   2 Suggerimento nessuna istruzione; un suggerimento compare solo se la
 *                  persona è bloccata: ferma da IDLE_MS (10 s) oppure
 *                  WRONG_FOR_HINT (2) click sbagliati sul passo attuale.
 *                  Il secondo suggerimento sullo stesso passo mostra anche dove.
 *   3 In autonomia nessun aiuto: si misurano solo tempo ed errori.
 *
 * Il livello cambia da un tentativo all'altro (nextLevel):
 *   livello 1 completato                         → livello 2
 *   livello 2 completato con al massimo 1 errore → livello 3
 *   livello 3 con 3 errori o più, o non finito   → torna al livello 2
 *
 * Ogni tentativo registra tempo, click sbagliati, suggerimenti e livello.
 * L'orologio si può iniettare (`now`): i test usano un orologio finto.
 *
 * Modulo puro (nessun DOM): lo usano il browser e i test.
 */
import { createTaskRun } from "./tasks.js";

export const LEVELS = [1, 2, 3];
export const IDLE_MS = 10000;
export const WRONG_FOR_HINT = 2;
export const MAX_HINTS_PER_STEP = 2;
export const DROP_ERRORS = 3;

export function nextLevel(level, { completed, errors }) {
  if (level === 2) return completed && errors <= 1 ? 3 : 2;
  if (level === 3) return !completed || errors >= DROP_ERRORS ? 2 : 3;
  return completed ? 2 : 1;
}

export function createSession({ task, level = 1, now = () => Date.now(), idleMs = IDLE_MS, wrongForHint = WRONG_FOR_HINT } = {}) {
  if (!LEVELS.includes(level)) level = 1;
  const run = createTaskRun(task);
  const startedAt = now();
  const attempt = {
    taskId: task.id, level, startedAt, ms: 0, errors: 0, hints: 0,
    completed: false, endedBy: null, nextLevel: null,
  };

  let lastActivity = startedAt;
  let wrongOnStep = 0;
  let hintsOnStep = 0;
  let lastErrorKey = null;
  let strong = false; // il suggerimento mostra anche dove
  let message = null; // { kind: "feedback" | "hint" | "blocked", key, extraKey?, reason? }
  let finished = false;

  const step = () => task.steps[run.current] || null;

  function showHint(at, reason) {
    if (finished || level !== 2 || hintsOnStep >= MAX_HINTS_PER_STEP) return false;
    const s = step();
    if (!s) return false;
    hintsOnStep += 1;
    attempt.hints += 1;
    wrongOnStep = 0;
    lastActivity = at;
    if (hintsOnStep === 1) {
      // Feedback mirato: se l'ultimo errore ha una spiegazione, si parte da quella.
      message = { kind: "hint", key: lastErrorKey || `${task.key}.${s.id}.hint`, reason };
      strong = false;
    } else {
      message = { kind: "hint", key: `${task.key}.${s.id}.hint`, extraKey: "hint.showWhere", reason };
      strong = true;
    }
    return true;
  }

  function finish(at, completed, endedBy) {
    finished = true;
    message = null;
    attempt.ms = Math.max(0, at - startedAt);
    attempt.completed = completed;
    attempt.endedBy = endedBy;
    attempt.nextLevel = nextLevel(level, attempt);
  }

  function handle(ev) {
    const at = now();
    if (finished) return { outcome: "ignored" };
    lastActivity = at;
    const r = run.handle(ev);

    if (r.outcome === "correct" || r.outcome === "complete") {
      wrongOnStep = 0;
      hintsOnStep = 0;
      lastErrorKey = null;
      strong = false;
      message = null;
      if (r.outcome === "complete") finish(at, true, "complete");
      return r;
    }

    // Si è tornati a un passo precedente: i suggerimenti di prima riguardavano
    // un altro passo e non valgono più.
    if (r.rewound) {
      hintsOnStep = 0;
      strong = false;
      message = null;
    }

    if (r.outcome === "neutral") {
      wrongOnStep = 0;
      if (message && message.kind !== "hint") message = null;
      return r;
    }

    // Errore.
    attempt.errors += 1;
    wrongOnStep += 1;
    lastErrorKey = r.feedbackKey || null;
    const blockedKey = ev.action === "answer" ? "wrong.answer" : "wrong.blocked";

    if (level === 1) {
      message = {
        kind: "feedback",
        key: r.feedbackKey || (r.guarded ? blockedKey : "wrong.generic"),
        // "Niente è stato inviato" solo per le azioni che inviano qualcosa.
        extraKey: r.guarded && r.feedbackKey && ev.action !== "answer" ? blockedKey : null,
      };
    } else if (level === 2) {
      if (r.guarded) message = { kind: "blocked", key: blockedKey };
      else if (message && message.kind !== "hint") message = null;
      if (wrongOnStep >= wrongForHint) showHint(at, "errors");
    } else {
      // Livello 3: solo l'informazione che l'azione non è andata a buon fine.
      message = r.guarded ? { kind: "blocked", key: blockedKey } : null;
    }
    return { ...r, message };
  }

  // Da chiamare ogni secondo circa: rileva la persona ferma.
  function tick() {
    if (finished || level !== 2) return false;
    const at = now();
    if (at - lastActivity >= idleMs) return showHint(at, "idle");
    return false;
  }

  // Azioni utili che non riguardano il compito (glossario, spiegazioni).
  function activity() {
    if (!finished) lastActivity = now();
  }

  // «Chiedo aiuto»: al livello 2 mostra subito un suggerimento; al livello 3
  // chiude il tentativo come non completato (si riparte dal livello 2).
  function askHelp() {
    const at = now();
    if (finished) return { action: "none" };
    if (level === 2) return { action: showHint(at, "asked") ? "hint" : "none" };
    if (level === 3) {
      finish(at, false, "help");
      return { action: "finished" };
    }
    return { action: "none" };
  }

  function abandon() {
    if (!finished) finish(now(), false, "stopped");
  }

  function view() {
    const s = step();
    return {
      taskId: task.id,
      level,
      finished,
      stepIndex: run.current,
      stepCount: task.steps.length,
      stepId: s ? s.id : null,
      instructionKey: !finished && level === 1 && s ? `${task.key}.${s.id}` : null,
      target: !finished && s && (level === 1 || strong) ? s.target : null,
      message: finished ? null : message,
      attempt: { ...attempt },
    };
  }

  return { handle, tick, activity, askHelp, abandon, view, get finished() { return finished; } };
}

// "1 min 05 s" → { m: 1, s: 5 }
export function splitDuration(ms) {
  const total = Math.round(Math.max(0, ms) / 1000);
  return { m: Math.floor(total / 60), s: total % 60 };
}

/*
 * Progressi della persona: livello attuale di ogni compito, tentativi,
 * verifica delle parole prima/dopo. Serializzabile in JSON (localStorage).
 */
export function createProgress(saved) {
  const data = { levels: {}, attempts: [], quiz: { pre: null, post: null } };
  if (saved && typeof saved === "object") {
    if (saved.levels && typeof saved.levels === "object") {
      for (const [k, v] of Object.entries(saved.levels)) if (LEVELS.includes(v)) data.levels[k] = v;
    }
    if (Array.isArray(saved.attempts)) {
      data.attempts = saved.attempts.filter((a) => a && typeof a.taskId === "string" && LEVELS.includes(a.level)).map(cleanAttempt);
    }
    if (saved.quiz && typeof saved.quiz === "object") {
      data.quiz.pre = cleanQuiz(saved.quiz.pre);
      data.quiz.post = cleanQuiz(saved.quiz.post);
    }
  }

  function attemptsFor(taskId) {
    return data.attempts.filter((a) => a.taskId === taskId);
  }

  return {
    levelFor(taskId) { return data.levels[taskId] || 1; },
    attemptsFor,
    record(attempt) {
      const clean = cleanAttempt(attempt);
      if (clean.nextLevel == null) clean.nextLevel = nextLevel(clean.level, clean);
      data.attempts.push(clean);
      data.levels[clean.taskId] = clean.nextLevel;
      return clean.nextLevel;
    },
    // «Ce l'hai fatta senza aiuto»: completato almeno una volta al livello 3.
    mastered(taskId) { return attemptsFor(taskId).some((a) => a.completed && a.level === 3); },
    errorsTrend(taskId) {
      const list = attemptsFor(taskId);
      if (list.length < 2) return null;
      return { first: list[0].errors, last: list[list.length - 1].errors };
    },
    setQuiz(phase, result) {
      if (phase !== "pre" && phase !== "post") return;
      data.quiz[phase] = cleanQuiz({ ...result, at: result.at ?? Date.now() });
    },
    get quiz() { return { pre: data.quiz.pre, post: data.quiz.post }; },
    reset() {
      data.levels = {};
      data.attempts = [];
      data.quiz = { pre: null, post: null };
    },
    toJSON() { return JSON.parse(JSON.stringify(data)); },
  };
}

function cleanAttempt(a) {
  const n = (v) => (Number.isFinite(v) && v >= 0 ? Math.round(v) : 0);
  return {
    taskId: String(a.taskId),
    level: LEVELS.includes(a.level) ? a.level : 1,
    startedAt: n(a.startedAt),
    ms: n(a.ms),
    errors: n(a.errors),
    hints: n(a.hints),
    completed: a.completed === true,
    endedBy: typeof a.endedBy === "string" ? a.endedBy : null,
    nextLevel: LEVELS.includes(a.nextLevel) ? a.nextLevel : null,
  };
}

function cleanQuiz(q) {
  if (!q || typeof q !== "object" || !Number.isFinite(q.score) || !Number.isFinite(q.total)) return null;
  return { score: q.score, total: q.total, at: Number.isFinite(q.at) ? q.at : 0 };
}
