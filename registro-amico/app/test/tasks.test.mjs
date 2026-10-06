import { test } from "node:test";
import assert from "node:assert/strict";
import { TASKS, taskById, createTaskRun, parseAct, GUARDED } from "../public/lib/tasks.js";
import { FREE_SLOTS_BIANCHI, TEACHERS, slotsOf, EVENTS, NOTICES, SUBJECTS, GRADE_QUESTION } from "../public/lib/data.js";

const ev = (s) => parseAct(s);
const run = (id) => createTaskRun(taskById(id));

test("parseAct separa azione e valore", () => {
  assert.deepEqual(parseAct("nav:assenze"), { action: "nav", value: "assenze" });
  assert.deepEqual(parseAct("answer:6½"), { action: "answer", value: "6½" });
  assert.deepEqual(parseAct("solo"), { action: "solo", value: "" });
});

test("T1: il percorso giusto completa la giustificazione in 5 passi", () => {
  const r = run("T1");
  const steps = ["nav:assenze", "event:ev-1001", "justify:ev-1001", "reason:salute", "confirm-justify:ev-1001"];
  const outcomes = steps.map((s) => r.handle(ev(s)).outcome);
  assert.deepEqual(outcomes, ["correct", "correct", "correct", "correct", "complete"]);
  assert.equal(r.done, true);
});

test("T1: scegliere il ritardo invece dell'assenza è un errore con feedback mirato", () => {
  const r = run("T1");
  r.handle(ev("nav:assenze"));
  const out = r.handle(ev("event:ev-1005"));
  assert.equal(out.outcome, "wrong");
  assert.equal(out.feedbackKey, "t1.e.ritardo");
  assert.equal(r.current, 1, "resta sul passo «scegli l'assenza»");
});

test("T1: un'assenza già giustificata e un motivo sbagliato hanno il loro feedback", () => {
  const r = run("T1");
  r.handle(ev("nav:assenze"));
  assert.equal(r.handle(ev("event:ev-0924")).feedbackKey, "t1.e.giustificata");
  r.handle(ev("event:ev-1001"));
  r.handle(ev("justify:ev-1001"));
  assert.equal(r.handle(ev("reason:famiglia")).feedbackKey, "t1.e.famiglia");
  assert.equal(r.handle(ev("reason:altro")).feedbackKey, "t1.e.altro");
  assert.equal(r.handle(ev("reason:salute")).outcome, "correct");
});

test("T1: confermare senza il motivo giusto è un errore bloccato (non viene eseguito)", () => {
  const r = run("T1");
  ["nav:assenze", "event:ev-1001", "justify:ev-1001"].forEach((s) => r.handle(ev(s)));
  const out = r.handle(ev("confirm-justify:ev-1001"));
  assert.equal(out.outcome, "wrong");
  assert.equal(out.guarded, true);
  assert.equal(out.feedbackKey, "t1.e.checkReason");
  assert.equal(r.done, false);
});

test("tornare su un passo già fatto è neutro e riporta l'esercizio a quel punto", () => {
  const r = run("T1");
  ["nav:assenze", "event:ev-1001", "justify:ev-1001"].forEach((s) => r.handle(ev(s)));
  const out = r.handle(ev("nav:assenze"));
  assert.equal(out.outcome, "neutral");
  assert.equal(r.current, 1);
});

test("andare su una pagina che non serve è un errore e riporta al primo passo", () => {
  const r = run("T1");
  r.handle(ev("nav:assenze"));
  r.handle(ev("event:ev-1001"));
  const out = r.handle(ev("nav:voti"));
  assert.equal(out.outcome, "wrong");
  assert.equal(out.feedbackKey, "wrong.nav");
  assert.equal(r.current, 0);
});

test("T2: un orario «Completo» è un errore, un orario «Libero» va bene", () => {
  const r = run("T2");
  r.handle(ev("nav:colloqui"));
  r.handle(ev("teacher:t-bianchi"));
  const full = slotsOf(TEACHERS[1]).find((s) => !s.free);
  assert.equal(r.handle(ev(`slot:${full.id}`)).feedbackKey, "t2.e.full");
  assert.equal(r.handle(ev(`slot:${FREE_SLOTS_BIANCHI[0]}`)).outcome, "correct");
  assert.equal(r.handle(ev(`confirm-booking:${FREE_SLOTS_BIANCHI[0]}`)).outcome, "complete");
});

test("T2: il docente sbagliato ha il suo feedback", () => {
  const r = run("T2");
  r.handle(ev("nav:colloqui"));
  assert.equal(r.handle(ev("teacher:t-conti")).feedbackKey, "t2.e.otherTeacher");
});

test("T3: aprire un'altra comunicazione e metterle la presa visione è un errore bloccato", () => {
  const r = run("T3");
  r.handle(ev("nav:bacheca"));
  assert.equal(r.handle(ev("notice:n-sciopero")).feedbackKey, "t3.e.otherNotice");
  const ack = r.handle(ev("ack:n-sciopero"));
  assert.equal(ack.outcome, "wrong");
  assert.equal(ack.guarded, true);
  r.handle(ev("notice:n-uscita"));
  assert.equal(r.handle(ev("ack:n-uscita")).outcome, "complete");
});

test("T4: rispondere prima di trovare il voto, o con il voto sbagliato, è un errore", () => {
  const r = run("T4");
  assert.equal(r.handle(ev("answer:7")).feedbackKey, "t4.e.early");
  r.handle(ev("nav:voti"));
  assert.equal(r.handle(ev("subject:italiano")).feedbackKey, "t4.e.otherSubject");
  r.handle(ev("subject:matematica"));
  assert.equal(r.handle(ev("answer:6½")).feedbackKey, "t4.e.wrongAnswer");
  assert.equal(r.handle(ev("answer:7")).outcome, "complete");
});

test("la risposta giusta di T4 è davvero il voto di Matematica del 03/10/2026 nei dati", () => {
  const math = SUBJECTS.find((s) => s.id === GRADE_QUESTION.subject);
  const grade = math.grades.find((g) => g.date === GRADE_QUESTION.date);
  assert.equal(grade.grade, GRADE_QUESTION.answer);
  assert.ok(GRADE_QUESTION.options.includes(GRADE_QUESTION.answer));
});

test("ogni passo dei compiti punta a dati che esistono nel registro", () => {
  const values = new Set([
    ...EVENTS.map((e) => e.id), ...NOTICES.map((n) => n.id), ...SUBJECTS.map((s) => s.id),
    ...TEACHERS.map((t) => t.id), "assenze", "voti", "colloqui", "bacheca", "salute", ...GRADE_QUESTION.options,
  ]);
  for (const task of TASKS) {
    assert.ok(task.steps.length >= 3, `${task.id} ha almeno 3 passi`);
    for (const s of task.steps) {
      const vals = Array.isArray(s.expect.value) ? s.expect.value : [s.expect.value];
      assert.ok(vals.length > 0);
      if (s.expect.action !== "slot" && s.expect.action !== "confirm-booking") {
        vals.forEach((v) => assert.ok(values.has(v), `${task.id}/${s.id}: ${v}`));
      }
      assert.ok(s.target, `${task.id}/${s.id} ha un elemento da evidenziare`);
    }
  }
  assert.ok(FREE_SLOTS_BIANCHI.length >= 2);
  assert.ok(GUARDED.has("confirm-justify") && GUARDED.has("ack"));
});
