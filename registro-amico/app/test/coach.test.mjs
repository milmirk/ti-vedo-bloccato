import { test } from "node:test";
import assert from "node:assert/strict";
import { createSession, createProgress, nextLevel, splitDuration, IDLE_MS } from "../public/lib/coach.js";
import { taskById, parseAct } from "../public/lib/tasks.js";
import { FREE_SLOTS_BIANCHI, TEACHERS, slotsOf } from "../public/lib/data.js";

// Orologio finto: niente setTimeout reali nei test.
function clock(start = 1_000_000) {
  let t = start;
  const now = () => t;
  now.advance = (ms) => { t += ms; };
  now.at = (s) => { t = start + s * 1000; };
  return now;
}

const T1_PATH = ["nav:assenze", "event:ev-1001", "justify:ev-1001", "reason:salute", "confirm-justify:ev-1001"];
const act = (session, s) => session.handle(parseAct(s));

test("regole di livello: 1→2, 2→3 con al massimo 1 errore, 3→2 con 3 errori o se non finito", () => {
  assert.equal(nextLevel(1, { completed: true, errors: 5 }), 2);
  assert.equal(nextLevel(1, { completed: false, errors: 0 }), 1);
  assert.equal(nextLevel(2, { completed: true, errors: 1 }), 3);
  assert.equal(nextLevel(2, { completed: true, errors: 2 }), 2);
  assert.equal(nextLevel(2, { completed: false, errors: 0 }), 2);
  assert.equal(nextLevel(3, { completed: true, errors: 2 }), 3);
  assert.equal(nextLevel(3, { completed: true, errors: 3 }), 2);
  assert.equal(nextLevel(3, { completed: false, errors: 0 }), 2);
});

test("livello 1: istruzione del passo, evidenziazione e feedback mirato sull'errore", () => {
  const now = clock();
  const s = createSession({ task: taskById("T1"), level: 1, now });
  let v = s.view();
  assert.equal(v.instructionKey, "t1.apri-assenze");
  assert.equal(v.target, '[data-act="nav:assenze"]');
  act(s, "nav:assenze");
  act(s, "event:ev-1005");
  v = s.view();
  assert.equal(v.message.kind, "feedback");
  assert.equal(v.message.key, "t1.e.ritardo");
  assert.equal(v.instructionKey, "t1.scegli-assenza");
  assert.equal(v.attempt.errors, 1);
});

test("livello 1: un'azione bloccata dice che niente è stato inviato; una risposta sbagliata no", () => {
  const now = clock();
  const s = createSession({ task: taskById("T3"), level: 1, now });
  act(s, "nav:bacheca");
  act(s, "notice:n-sciopero");
  act(s, "ack:n-sciopero");
  assert.deepEqual(s.view().message, { kind: "feedback", key: "t3.e.otherNotice", extraKey: "wrong.blocked" });
  const s4 = createSession({ task: taskById("T4"), level: 1, now });
  ["nav:voti", "subject:matematica", "answer:8"].forEach((x) => act(s4, x));
  assert.deepEqual(s4.view().message, { kind: "feedback", key: "t4.e.wrongAnswer", extraKey: null });
});

test("livello 2: nessuna istruzione; suggerimento dopo 10 s di inattività", () => {
  const now = clock();
  const s = createSession({ task: taskById("T1"), level: 2, now });
  assert.equal(s.view().instructionKey, null);
  assert.equal(s.view().target, null);
  now.advance(IDLE_MS - 1);
  assert.equal(s.tick(), false, "a 9,999 s non è ancora bloccata");
  assert.equal(s.view().message, null);
  now.advance(1);
  assert.equal(s.tick(), true);
  assert.equal(s.view().message.key, "t1.apri-assenze.hint");
  assert.equal(s.view().target, null, "il primo suggerimento è solo testo");
  assert.equal(s.view().attempt.hints, 1);
});

test("livello 2: dopo 2 click sbagliati il suggerimento usa il feedback dell'ultimo errore", () => {
  const now = clock();
  const s = createSession({ task: taskById("T1"), level: 2, now });
  act(s, "nav:assenze");
  act(s, "event:ev-0924");
  assert.equal(s.view().message, null, "un errore solo: nessun aiuto");
  act(s, "event:ev-1005");
  const v = s.view();
  assert.equal(v.message.kind, "hint");
  assert.equal(v.message.key, "t1.e.ritardo");
  assert.equal(v.attempt.hints, 1);
});

test("livello 2: il secondo suggerimento sullo stesso passo mostra anche dove, poi basta", () => {
  const now = clock();
  const s = createSession({ task: taskById("T1"), level: 2, now });
  now.advance(IDLE_MS);
  s.tick();
  now.advance(IDLE_MS);
  assert.equal(s.tick(), true);
  const v = s.view();
  assert.equal(v.message.extraKey, "hint.showWhere");
  assert.equal(v.target, '[data-act="nav:assenze"]');
  now.advance(IDLE_MS * 3);
  assert.equal(s.tick(), false, "massimo 2 suggerimenti per passo");
  assert.equal(s.view().attempt.hints, 2);
});

test("livello 2: un passo giusto azzera il conteggio di inattività e toglie il suggerimento", () => {
  const now = clock();
  const s = createSession({ task: taskById("T1"), level: 2, now });
  now.advance(8000);
  act(s, "nav:assenze");
  now.advance(8000);
  assert.equal(s.tick(), false, "8 s dall'ultimo passo giusto: non ancora");
  now.advance(2000);
  assert.equal(s.tick(), true);
  act(s, "event:ev-1001");
  assert.equal(s.view().message, null);
});

test("livello 3: nessun aiuto anche se ferma o se sbaglia; si misurano solo tempo ed errori", () => {
  const now = clock();
  const s = createSession({ task: taskById("T1"), level: 3, now });
  now.advance(IDLE_MS * 5);
  assert.equal(s.tick(), false);
  act(s, "nav:voti");
  act(s, "nav:home");
  act(s, "nav:bacheca");
  const v = s.view();
  assert.equal(v.message, null);
  assert.equal(v.target, null);
  assert.equal(v.instructionKey, null);
  assert.equal(v.attempt.errors, 3);
});

test("livello 3: un'azione bloccata dice solo che non è andata, senza suggerire", () => {
  const now = clock();
  const s = createSession({ task: taskById("T1"), level: 3, now });
  ["nav:assenze", "event:ev-1001", "justify:ev-1001"].forEach((x) => act(s, x));
  act(s, "confirm-justify:ev-1001");
  assert.deepEqual(s.view().message, { kind: "blocked", key: "wrong.blocked" });
});

test("metriche del tentativo: tempo, errori, suggerimenti, livello e livello successivo", () => {
  const now = clock();
  const s = createSession({ task: taskById("T2"), level: 2, now });
  const full = slotsOf(TEACHERS[1]).find((x) => !x.free);
  now.at(4); act(s, "nav:colloqui");
  now.at(9); act(s, "teacher:t-bianchi");
  now.at(12); act(s, `slot:${full.id}`);
  now.at(22); s.tick();
  now.at(25); act(s, `slot:${FREE_SLOTS_BIANCHI[0]}`);
  now.at(31); act(s, `confirm-booking:${FREE_SLOTS_BIANCHI[0]}`);
  const a = s.view().attempt;
  assert.equal(s.finished, true);
  assert.deepEqual(
    { ms: a.ms, errors: a.errors, hints: a.hints, level: a.level, completed: a.completed, next: a.nextLevel },
    { ms: 31000, errors: 1, hints: 1, level: 2, completed: true, next: 3 }
  );
});

test("«Chiedo aiuto»: al livello 2 dà un suggerimento, al livello 3 chiude il tentativo e torna al 2", () => {
  const now = clock();
  const s2 = createSession({ task: taskById("T3"), level: 2, now });
  assert.equal(s2.askHelp().action, "hint");
  assert.equal(s2.view().attempt.hints, 1);
  const s3 = createSession({ task: taskById("T3"), level: 3, now });
  now.advance(5000);
  assert.equal(s3.askHelp().action, "finished");
  const a = s3.view().attempt;
  assert.equal(a.completed, false);
  assert.equal(a.endedBy, "help");
  assert.equal(a.nextLevel, 2);
});

test("percorso adattivo: lo stesso compito ripetuto passa dal livello 1 al 3, poi torna al 2 se serve", () => {
  const now = clock();
  const progress = createProgress();
  const play = (actions) => {
    const s = createSession({ task: taskById("T1"), level: progress.levelFor("T1"), now });
    actions.forEach((x) => act(s, x));
    progress.record(s.view().attempt);
  };
  play(["nav:assenze", "event:ev-1005", ...T1_PATH.slice(1)]); // livello 1, 1 errore
  assert.equal(progress.levelFor("T1"), 2);
  play(T1_PATH); // livello 2, 0 errori
  assert.equal(progress.levelFor("T1"), 3);
  play(["nav:voti", "nav:pagella", "nav:home", ...T1_PATH]); // livello 3, 3 errori
  assert.equal(progress.levelFor("T1"), 2);
  assert.equal(progress.mastered("T1"), true, "completato al livello 3, anche se con errori");
  assert.deepEqual(progress.attemptsFor("T1").map((a) => a.level), [1, 2, 3]);
  assert.deepEqual(progress.errorsTrend("T1"), { first: 1, last: 3 });
});

// Lo scenario mostrato nella presentazione (slide «Risultato»): è l'output di
// questo test con l'orologio finto, NON una misura su persone reali.
test("scenario della presentazione: T1 in tre tentativi, dal livello 1 a «Ce l'hai fatta senza aiuto»", () => {
  const now = clock();
  const progress = createProgress();
  const attempt = (script) => {
    now.at(0);
    const s = createSession({ task: taskById("T1"), level: progress.levelFor("T1"), now });
    for (const [sec, a] of script) {
      now.at(sec);
      if (a === "tick") s.tick(); else act(s, a);
    }
    progress.record(s.view().attempt);
    return s.view().attempt;
  };
  const a1 = attempt([[6, "nav:assenze"], [15, "event:ev-1005"], [20, "event:ev-1001"], [24, "justify:ev-1001"],
    [31, "reason:famiglia"], [34, "reason:salute"], [38, "confirm-justify:ev-1001"]]);
  const a2 = attempt([[5, "nav:assenze"], [15, "tick"], [18, "event:ev-1001"], [21, "justify:ev-1001"],
    [25, "reason:salute"], [28, "confirm-justify:ev-1001"]]);
  const a3 = attempt([[3, "nav:assenze"], [7, "event:ev-1001"], [9, "justify:ev-1001"],
    [12, "reason:salute"], [14, "confirm-justify:ev-1001"]]);
  const row = (a) => [a.level, a.ms / 1000, a.errors, a.hints, a.completed];
  assert.deepEqual(row(a1), [1, 38, 2, 0, true]);
  assert.deepEqual(row(a2), [2, 28, 0, 1, true]);
  assert.deepEqual(row(a3), [3, 14, 0, 0, true]);
  assert.equal(progress.mastered("T1"), true);
});

test("i progressi si salvano e si ricaricano, e i dati rovinati vengono ignorati", () => {
  const p = createProgress();
  p.record({ taskId: "T4", level: 1, ms: 20000, errors: 1, hints: 0, completed: true, nextLevel: 2 });
  p.setQuiz("pre", { score: 2, total: 5, at: 1 });
  const again = createProgress(JSON.parse(JSON.stringify(p.toJSON())));
  assert.equal(again.levelFor("T4"), 2);
  assert.equal(again.attemptsFor("T4").length, 1);
  assert.deepEqual(again.quiz.pre, { score: 2, total: 5, at: 1 });
  const broken = createProgress({ levels: { T1: 9 }, attempts: [null, { taskId: 3 }], quiz: { pre: "x" } });
  assert.equal(broken.levelFor("T1"), 1);
  assert.equal(broken.attemptsFor("T1").length, 0);
  assert.equal(broken.quiz.pre, null);
});

test("durata in minuti e secondi", () => {
  assert.deepEqual(splitDuration(38000), { m: 0, s: 38 });
  assert.deepEqual(splitDuration(65400), { m: 1, s: 5 });
});
