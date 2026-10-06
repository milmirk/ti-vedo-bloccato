/*
 * Registro amico — i 4 compiti di prova come macchine a stati.
 *
 * Ogni elemento interattivo del registro ha un attributo
 * data-act="azione:valore" (es. "nav:assenze", "event:ev-1001").
 * La UI trasforma ogni click in un evento { action, value } e lo passa a
 * createTaskRun(task).handle(ev), che risponde:
 *
 *   correct   è il passo atteso: si avanza
 *   complete  era l'ultimo passo: compito finito
 *   neutral   ripete un passo già fatto (es. torna su «Assenze»): si riparte da lì, non è un errore
 *   wrong     non è il passo atteso: conta come errore, con la chiave del feedback mirato
 *
 * Le azioni in GUARDED hanno un effetto (inviare, confermare, rispondere):
 * se sono sbagliate la UI non le esegue, così l'esercizio resta coerente.
 *
 * Modulo puro (nessun DOM): lo usano il browser e i test.
 */
import { FREE_SLOTS_BIANCHI, GRADE_QUESTION } from "./data.js";

export const GUARDED = new Set(["justify", "confirm-justify", "confirm-booking", "ack", "answer"]);

export const TASKS = [
  {
    id: "T1",
    key: "t1",
    steps: [
      { id: "apri-assenze", expect: { action: "nav", value: "assenze" }, target: '[data-act="nav:assenze"]' },
      {
        id: "scegli-assenza", expect: { action: "event", value: "ev-1001" }, target: '[data-act="event:ev-1001"]',
        errors: { "ev-1005": "t1.e.ritardo", "ev-0924": "t1.e.giustificata", "ev-0918": "t1.e.giustificata" },
      },
      { id: "premi-giustifica", expect: { action: "justify", value: "ev-1001" }, target: '[data-act="justify:ev-1001"]' },
      {
        id: "scegli-motivo", expect: { action: "reason", value: "salute" }, target: '[data-act="reason:salute"]',
        errors: { famiglia: "t1.e.famiglia", altro: "t1.e.altro" },
      },
      { id: "conferma", expect: { action: "confirm-justify", value: "ev-1001" }, target: '[data-act="confirm-justify:ev-1001"]' },
    ],
    // Azioni di un passo successivo fatte troppo presto.
    early: { justify: "t1.e.wrongEvent", reason: "t1.e.wrongEvent", "confirm-justify": "t1.e.checkReason" },
  },
  {
    id: "T2",
    key: "t2",
    steps: [
      { id: "apri-colloqui", expect: { action: "nav", value: "colloqui" }, target: '[data-act="nav:colloqui"]' },
      {
        id: "scegli-docente", expect: { action: "teacher", value: "t-bianchi" }, target: '[data-act="teacher:t-bianchi"]',
        errors: { "*": "t2.e.otherTeacher" },
      },
      {
        id: "scegli-orario", expect: { action: "slot", value: FREE_SLOTS_BIANCHI }, target: '[data-teacher="t-bianchi"][data-free="true"]',
        errors: { "*": "t2.e.full" },
      },
      { id: "conferma", expect: { action: "confirm-booking", value: FREE_SLOTS_BIANCHI }, target: '[data-act^="confirm-booking:"]' },
    ],
    early: { slot: "t2.e.wrongTeacherSlot", "confirm-booking": "t2.e.checkBooking" },
  },
  {
    id: "T3",
    key: "t3",
    steps: [
      { id: "apri-bacheca", expect: { action: "nav", value: "bacheca" }, target: '[data-act="nav:bacheca"]' },
      {
        id: "apri-comunicazione", expect: { action: "notice", value: "n-uscita" }, target: '[data-act="notice:n-uscita"]',
        errors: { "*": "t3.e.otherNotice" },
      },
      { id: "presa-visione", expect: { action: "ack", value: "n-uscita" }, target: '[data-act="ack:n-uscita"]' },
    ],
    early: { ack: "t3.e.otherNotice" },
  },
  {
    id: "T4",
    key: "t4",
    steps: [
      { id: "apri-voti", expect: { action: "nav", value: "voti" }, target: '[data-act="nav:voti"]' },
      {
        id: "apri-materia", expect: { action: "subject", value: GRADE_QUESTION.subject }, target: `[data-act="subject:${GRADE_QUESTION.subject}"]`,
        errors: { "*": "t4.e.otherSubject" },
      },
      {
        id: "rispondi", expect: { action: "answer", value: GRADE_QUESTION.answer }, target: "#answer-group",
        errors: { "*": "t4.e.wrongAnswer" },
      },
    ],
    early: { answer: "t4.e.early" },
  },
];

export function taskById(id) {
  return TASKS.find((t) => t.id === id) || null;
}

// "nav:assenze" → { action: "nav", value: "assenze" }
export function parseAct(str) {
  const s = String(str || "");
  const i = s.indexOf(":");
  return i < 0 ? { action: s, value: "" } : { action: s.slice(0, i), value: s.slice(i + 1) };
}

export function matches(expect, ev) {
  if (!ev || ev.action !== expect.action) return false;
  return Array.isArray(expect.value) ? expect.value.includes(ev.value) : expect.value === ev.value;
}

export function createTaskRun(task) {
  const steps = task.steps;
  let current = 0;
  let done = false;

  function handle(ev) {
    if (done) return { outcome: "ignored", step: current };
    if (matches(steps[current].expect, ev)) {
      current += 1;
      if (current >= steps.length) {
        done = true;
        return { outcome: "complete", step: current };
      }
      return { outcome: "correct", step: current };
    }
    // Ripete un passo già fatto (es. clicca di nuovo «Assenze»): la pagina
    // torna a quel punto, e anche l'esercizio. Non è un errore.
    for (let k = current - 1; k >= 0; k--) {
      if (matches(steps[k].expect, ev)) {
        current = k + 1;
        return { outcome: "neutral", rewound: true, step: current };
      }
    }
    const guarded = GUARDED.has(ev.action);
    // Stessa azione di un passo già raggiunto ma valore sbagliato (es. un'altra
    // riga, un'altra pagina): errore, e si torna a quel passo.
    for (let k = current; k >= 0; k--) {
      if (steps[k].expect.action === ev.action) {
        const errs = steps[k].errors || {};
        const feedbackKey = errs[ev.value] || errs["*"] || (ev.action === "nav" ? "wrong.nav" : null);
        const rewound = k !== current;
        current = k;
        return { outcome: "wrong", feedbackKey, guarded, rewound, step: current };
      }
    }
    // Azione di un passo successivo, fatta troppo presto.
    const feedbackKey = (task.early && task.early[ev.action]) || null;
    return { outcome: "wrong", feedbackKey, guarded, rewound: false, step: current };
  }

  return {
    handle,
    get current() { return current; },
    get done() { return done; },
    get step() { return steps[current] || null; },
  };
}

// Tutte le chiavi di testo che un compito può mostrare (per i test).
export function taskStringKeys(task) {
  const keys = new Set([`${task.key}.title`, `${task.key}.goal`, `${task.key}.done`]);
  for (const s of task.steps) {
    keys.add(`${task.key}.${s.id}`);
    keys.add(`${task.key}.${s.id}.hint`);
    Object.values(s.errors || {}).forEach((k) => keys.add(k));
  }
  Object.values(task.early || {}).forEach((k) => keys.add(k));
  if (task.id === "T4") keys.add("t4.question");
  return [...keys];
}
