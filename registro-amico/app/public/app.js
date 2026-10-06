/*
 * Registro amico — interfaccia (registro di prova + aiuto adattivo).
 *
 * Qui c'è solo il DOM. Le regole stanno nei moduli puri di /lib, testati in
 * Node: tasks.js (passi dei compiti), coach.js (livelli, blocco, metriche),
 * glossary.js, i18n.js, quiz.js, data.js.
 *
 * Il registro resta in italiano (lang="it"). L'aiuto ha lang e dir della
 * lingua scelta; le parole del registro citate tra «» sono avvolte in
 * <bdi lang="it" dir="ltr"> per restare leggibili anche dentro l'arabo.
 */
import {
  SCHOOL, L, SUBJECTS, TEACHERS, NOTICES, GRADE_QUESTION,
  slotsOf, statusLabel, average, freshRegisterState, noticeById,
} from "./lib/data.js";
import { TASKS, taskById, parseAct } from "./lib/tasks.js";
import { createSession, createProgress, splitDuration } from "./lib/coach.js";
import { GLOSSARY, termById, termIn, findTerms } from "./lib/glossary.js";
import { t as translate, LANGS, LANG_META } from "./lib/i18n.js";
import { QUIZ, scoreQuiz, quizDelta } from "./lib/quiz.js";

const STORE_KEY = "registro-amico:v1";
const PAGES = ["home", "assenze", "voti", "colloqui", "bacheca", "pagella"];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const $ = (sel, root = document) => root.querySelector(sel);

const freshUi = () => ({
  event: null, justifyOpen: false, reason: null, notes: "",
  teacher: null, slot: null, notice: null, subject: null, msg: null,
});

const S = {
  lang: null,
  view: "practice", // practice | progress | quiz
  page: "home",
  reg: freshRegisterState(),
  ui: freshUi(),
  session: null,
  task: null,
  coach: "tasks", // pick | tasks | active | done
  result: null,
  termId: null,
  termOpener: null,
  explain: {},
  ai: false,
  quiz: null,
  quizSkipped: false,
  collapsed: false,
  lastAnnounced: "",
};
let progress = createProgress();

const lang = () => S.lang || "it";
const t = (key, vars) => translate(lang(), key, vars);
const dirOf = (l) => LANG_META[l].dir;

// ------------------------------------------------------------ memoria locale
function load() {
  const params = new URLSearchParams(location.search);
  try {
    if (params.get("reset") === "1") localStorage.removeItem(STORE_KEY);
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (saved && typeof saved === "object") {
      if (LANGS.includes(saved.lang)) S.lang = saved.lang;
      progress = createProgress(saved.progress);
    }
  } catch { /* memoria non disponibile: si parte da zero */ }
  const q = params.get("lang");
  if (LANGS.includes(q)) S.lang = q;
  S.coach = S.lang ? "tasks" : "pick";
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ lang: S.lang, progress: progress.toJSON() }));
  } catch { /* memoria piena o disattivata: i progressi valgono per questa visita */ }
}

// ------------------------------------------------------------ testo sicuro
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Le parole del registro tra «» restano in italiano e da sinistra a destra.
function rich(s) {
  return esc(s).replace(/«([^»]+)»/g, '<bdi lang="it" dir="ltr" class="reg-word">«$1»</bdi>');
}

// Testo del registro con le parole del glossario cliccabili.
function marker() {
  const seen = new Set();
  return (text) => findTerms(text, seen).map((p) => (p.termId
    ? `<button type="button" class="term" data-term="${p.termId}" aria-describedby="term-help">${esc(p.text)}</button>`
    : esc(p.text))).join("");
}

function duration(ms) {
  const { m, s } = splitDuration(ms);
  return m ? t("time.min", { m, s: String(s).padStart(2, "0") }) : t("time.sec", { s });
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

// ------------------------------------------------------------ registro
function noticeState(id) {
  return S.reg.notices.find((n) => n.id === id);
}

function regMsgHtml() {
  if (!S.ui.msg) return "";
  return `<p class="reg-msg reg-msg-${S.ui.msg.type}" role="status" tabindex="-1" id="reg-msg">${esc(S.ui.msg.text)}</p>`;
}

function navHtml() {
  const pending = S.reg.events.filter((e) => !e.justified).length;
  const toAck = NOTICES.filter((n) => n.ackRequired && !noticeState(n.id).ackDone).length;
  const badge = { assenze: pending, bacheca: toAck };
  return `<ul>${PAGES.map((p) => {
    const n = badge[p] || 0;
    const extra = n ? ` <span class="nav-count" aria-hidden="true">${n}</span><span class="sr-only">(${n} da fare)</span>` : "";
    return `<li><button type="button" data-act="nav:${p}"${S.page === p ? ' aria-current="page"' : ""}>${esc(L.nav[p])}${extra}</button></li>`;
  }).join("")}</ul>`;
}

function heading(text) {
  return `<h2 class="reg-h" id="reg-title" tabindex="-1">${esc(text)}</h2>`;
}

function homeHtml(m) {
  const pending = S.reg.events.filter((e) => !e.justified);
  const toAck = NOTICES.filter((n) => n.ackRequired && !noticeState(n.id).ackDone).length;
  return `${heading("Buongiorno")}
  <p class="reg-intro">${m(`Questa è la home del registro elettronico di ${SCHOOL.student}, classe ${SCHOOL.className}.`)} Ultimo accesso: ${esc(SCHOOL.lastAccess)}.</p>
  <div class="reg-cards">
    <section class="reg-card"><h3>Eventi</h3><p>${m(pending.length ? `${plural(pending.length, "evento", "eventi")} da giustificare.` : "Nessun evento da giustificare.")}</p></section>
    <section class="reg-card"><h3>Comunicazioni</h3><p>${m(toAck ? `${plural(toAck, "comunicazione", "comunicazioni")} con presa visione richiesta.` : "Nessuna comunicazione da confermare.")}</p></section>
    <section class="reg-card"><h3>Compiti per mercoledì 07/10/2026</h3><ul>
      <li>${m("Matematica: compiti per casa, esercizi 4 e 5 a pagina 32.")}</li>
      <li>Italiano: leggere il racconto a pagina 18.</li></ul></section>
    <section class="reg-card"><h3>Note</h3><p>${m("Nessuna nota disciplinare.")}</p></section>
    <section class="reg-card"><h3>Prossimi impegni</h3><p>${m("Martedì 20/10/2026: uscita didattica al Museo di Storia Naturale.")}</p></section>
  </div>`;
}

function assenzeHtml(m) {
  const evs = S.reg.events;
  const count = (type) => evs.filter((e) => e.type === type).length;
  const sel = evs.find((e) => e.id === S.ui.event) || null;
  const rows = evs.map((e) => `<tr${S.ui.event === e.id ? ' class="is-selected"' : ""}>
      <td>${esc(e.date)}</td>
      <td>${m(L.types[e.type])}</td>
      <td>${esc(e.detail)}</td>
      <td><span class="status ${e.justified ? "ok" : "pending"}">${m(statusLabel(e))}</span></td>
      <td><button type="button" class="btn-small" data-act="event:${e.id}" aria-label="${esc(`${L.open}: ${L.types[e.type]} del ${e.date}`)}">${esc(L.open)}</button></td>
    </tr>`).join("");
  return `${heading(L.nav.assenze)}
  <p class="reg-intro">${m(`Assenze, ritardi e uscite anticipate di ${SCHOOL.student} nell'anno scolastico ${SCHOOL.year}.`)}</p>
  <ul class="reg-summary">
    <li>Assenze: <b>${count("assenza")}</b></li><li>Ritardi: <b>${count("ritardo")}</b></li>
    <li>Uscite anticipate: <b>${count("uscita")}</b></li><li>${esc(L.status.pending)}: <b>${evs.filter((e) => !e.justified).length}</b></li>
  </ul>
  <div class="table-wrap"><table class="reg-table">
    <caption class="sr-only">Eventi dell'anno scolastico</caption>
    <thead><tr><th scope="col">${L.col.date}</th><th scope="col">${L.col.type}</th><th scope="col">${L.col.detail}</th><th scope="col">${L.col.status}</th><th scope="col"><span class="sr-only">${L.col.action}</span></th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
  ${sel ? eventDetailHtml(sel) : regMsgHtml()}`;
}

function eventDetailHtml(e) {
  const title = `${L.types[e.type]} del ${e.date}`;
  let body = `<dl class="reg-dl">
    <div><dt>${L.col.date}</dt><dd>${esc(e.date)}</dd></div>
    <div><dt>${L.col.type}</dt><dd>${esc(L.types[e.type])}</dd></div>
    <div><dt>${L.col.detail}</dt><dd>${esc(e.detail)}</dd></div>
    <div><dt>${L.col.status}</dt><dd><span class="status ${e.justified ? "ok" : "pending"}">${esc(statusLabel(e))}</span></dd></div>
  </dl>`;
  if (!e.justified && !S.ui.justifyOpen) {
    body += `<div class="reg-actions"><button type="button" class="btn-primary" data-act="justify:${e.id}">${esc(L.justify)}</button></div>`;
  }
  if (!e.justified && S.ui.justifyOpen) {
    body += `<div class="reg-form">
      <fieldset class="reg-fieldset"><legend>${esc(L.reasonLegend)}</legend><div class="choice-row">
        ${Object.entries(L.reasons).map(([k, label]) => `<button type="button" class="choice" data-act="reason:${k}" aria-pressed="${S.ui.reason === k}">${esc(label)}</button>`).join("")}
      </div></fieldset>
      <label class="reg-label" for="just-notes">${esc(L.notes)}</label>
      <textarea id="just-notes" rows="2" data-key="notes">${esc(S.ui.notes)}</textarea>
      <div class="reg-actions">
        <button type="button" class="btn-secondary" data-act="event:${e.id}" data-key="cancel">${esc(L.cancel)}</button>
        <button type="button" class="btn-primary" data-act="confirm-justify:${e.id}">${esc(L.confirmJustify)}</button>
      </div>
    </div>`;
  }
  return `<section class="reg-detail" aria-labelledby="ev-title"><h3 id="ev-title" tabindex="-1">${esc(title)}</h3>${body}${regMsgHtml()}</section>`;
}

function votiHtml(m) {
  const subject = SUBJECTS.find((s) => s.id === S.ui.subject);
  if (subject) {
    const rows = subject.grades.map((g) => `<tr><td>${esc(g.date)}</td><td>${m(g.kind)}</td><td class="grade">${esc(g.grade)}</td><td>${m(g.desc)}</td></tr>`).join("");
    return `${heading(L.nav.voti)}
    <div class="reg-bar"><button type="button" class="btn-secondary" data-act="nav:voti" data-key="all-subjects"><span aria-hidden="true">‹ </span>${esc(L.allSubjects)}</button></div>
    <section class="reg-detail" aria-labelledby="subj-title">
      <h3 id="subj-title" tabindex="-1">${esc(subject.name)}</h3>
      <p>${m(`Media del primo quadrimestre: ${average(subject)}.`)}</p>
      ${subject.grades.length ? `<div class="table-wrap"><table class="reg-table">
        <caption class="sr-only">Voti di ${esc(subject.name)}</caption>
        <thead><tr><th scope="col">${L.col.date}</th><th scope="col">${L.col.type}</th><th scope="col">${L.col.grade}</th><th scope="col">${L.col.description}</th></tr></thead>
        <tbody>${rows}</tbody></table></div>` : "<p>Nessun voto per questa materia.</p>"}
    </section>`;
  }
  const rows = SUBJECTS.map((s) => `<tr><td>${esc(s.name)}</td><td class="grade">${esc(average(s))}</td>
    <td><button type="button" class="btn-small" data-act="subject:${s.id}" aria-label="${esc(`${L.seeGrades}: ${s.name}`)}">${esc(L.seeGrades)}</button></td></tr>`).join("");
  return `${heading(L.nav.voti)}
  <p class="reg-intro">${m("Voti del primo quadrimestre. Da 6 in su il voto è sufficiente.")}</p>
  <div class="table-wrap"><table class="reg-table">
    <caption class="sr-only">Materie</caption>
    <thead><tr><th scope="col">${L.col.subject}</th><th scope="col">${m(L.col.average)}</th><th scope="col"><span class="sr-only">${L.col.action}</span></th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function colloquiHtml(m) {
  const rows = TEACHERS.map((tc) => `<tr${S.ui.teacher === tc.id ? ' class="is-selected"' : ""}>
    <td>${esc(tc.name)}${tc.role ? `<br><span class="reg-small">${m(tc.role)}</span>` : ""}</td>
    <td>${esc(tc.subjects)}</td>
    <td>${esc(tc.day)}, dalle ore ${esc(tc.start)}</td>
    <td><button type="button" class="btn-small" data-act="teacher:${tc.id}" aria-label="${esc(`${L.seeSlots}: ${tc.name}`)}">${esc(L.seeSlots)}</button></td>
  </tr>`).join("");
  const teacher = TEACHERS.find((x) => x.id === S.ui.teacher);
  let slotsHtml = "";
  if (teacher) {
    const slots = slotsOf(teacher);
    const chosen = slots.find((s) => s.id === S.ui.slot);
    const items = slots.map((s) => {
      const booked = S.reg.bookings.some((b) => b.slot === s.id);
      const free = s.free && !booked;
      const state = booked ? L.booked : free ? L.free : L.full;
      return `<li><button type="button" class="slot ${free ? "free" : "full"}${S.ui.slot === s.id ? " is-selected" : ""}"
        data-act="slot:${s.id}" data-teacher="${teacher.id}" data-free="${free}"${free ? ` aria-pressed="${S.ui.slot === s.id}"` : ' aria-disabled="true"'}
        aria-label="${esc(`ore ${s.time}, ${state}`)}"><span class="slot-time">${esc(s.time)}</span><span class="slot-state">${esc(state)}</span></button></li>`;
    }).join("");
    slotsHtml = `<section class="reg-detail" aria-labelledby="slots-title">
      <h3 id="slots-title" tabindex="-1">Orari di ricevimento · ${esc(teacher.name)}</h3>
      <p>${esc(teacher.day)}. Ogni colloquio dura 10 minuti.</p>
      <ul class="slots">${items}</ul>
      ${chosen ? `<div class="reg-summary-box"><h4>Riepilogo</h4>
        <p>Colloquio con ${esc(teacher.name)} (${esc(teacher.subjects)}) · ${esc(teacher.day)} · ore ${esc(chosen.time)} · 10 minuti</p>
        <button type="button" class="btn-primary" data-act="confirm-booking:${chosen.id}">${esc(L.confirmBooking)}</button></div>` : ""}
      ${regMsgHtml()}
    </section>`;
  }
  const mine = S.reg.bookings.map((b) => `<li>${esc(b.text)}</li>`).join("");
  return `${heading(L.nav.colloqui)}
  <p class="reg-intro">${m("Prenota un colloquio con i docenti. Scegli il docente e poi un orario libero.")}</p>
  <div class="table-wrap"><table class="reg-table">
    <caption class="sr-only">Docenti della classe ${esc(SCHOOL.className)}</caption>
    <thead><tr><th scope="col">${L.col.teacher}</th><th scope="col">${L.col.subjects}</th><th scope="col">${L.col.reception}</th><th scope="col"><span class="sr-only">${L.col.action}</span></th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  ${slotsHtml || regMsgHtml()}
  <section class="reg-mine" aria-labelledby="mine-title"><h3 id="mine-title">${esc(L.myMeetings)}</h3>
    ${mine ? `<ul>${mine}</ul>` : "<p>Nessun colloquio prenotato.</p>"}</section>`;
}

function noticeStatus(n) {
  const st = noticeState(n.id);
  if (n.ackRequired) return st.ackDone ? L.ackDone : L.ackRequired;
  return st.read ? L.readDone : L.toRead;
}

function bachecaHtml(m) {
  const n = S.ui.notice ? noticeById(S.ui.notice) : null;
  if (n) {
    const st = noticeState(n.id);
    let ack;
    if (n.ackRequired && !st.ackDone) ack = `<button type="button" class="btn-primary" data-act="ack:${n.id}">${esc(L.ack)}</button>`;
    else if (n.ackRequired) ack = `<p class="status ok">${esc(L.ackDone)}</p>`;
    else ack = `<p class="reg-small">${m("Per questa comunicazione non è richiesta la presa visione.")}</p>`;
    return `${heading(L.nav.bacheca)}
    <div class="reg-bar"><button type="button" class="btn-secondary" data-act="nav:bacheca" data-key="back-board"><span aria-hidden="true">‹ </span>${esc(L.backToBoard)}</button></div>
    <article class="notice" aria-labelledby="notice-title">
      <h3 id="notice-title" tabindex="-1">${esc(n.title)}</h3>
      <p class="notice-meta">Pubblicata il ${esc(n.date)} · ${L.col.from}: ${esc(n.from)}</p>
      <div class="notice-body">${n.body.map((p) => `<p>${m(p)}</p>`).join("")}</div>
      ${n.attachment ? `<p class="notice-attach">Allegato: ${esc(n.attachment)} <span>(non disponibile nell'ambiente di prova)</span></p>` : ""}
      <div class="notice-ack">${ack}${regMsgHtml()}</div>
    </article>
    ${explainHtml(n)}`;
  }
  const rows = NOTICES.map((x) => {
    const status = noticeStatus(x);
    const cls = status === L.ackRequired || status === L.toRead ? "pending" : "ok";
    return `<tr><td>${esc(x.date)}</td><td>${esc(x.title)}</td><td><span class="status ${cls}">${esc(status)}</span></td>
      <td><button type="button" class="btn-small" data-act="notice:${x.id}" aria-label="${esc(`${L.read}: ${x.title}`)}">${esc(L.read)}</button></td></tr>`;
  }).join("");
  return `${heading(L.nav.bacheca)}
  <p class="reg-intro">${m("Comunicazioni della scuola per le famiglie. Alcune chiedono la presa visione.")}</p>
  <div class="table-wrap"><table class="reg-table">
    <caption class="sr-only">Comunicazioni</caption>
    <thead><tr><th scope="col">${L.col.date}</th><th scope="col">${L.col.title}</th><th scope="col">${L.col.status}</th><th scope="col"><span class="sr-only">${L.col.action}</span></th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function pagellaHtml(m) {
  const rows = SUBJECTS.map((s) => `<tr><td>${esc(s.name)}</td><td>—</td></tr>`).join("");
  return `${heading(L.nav.pagella)}
  <p class="reg-intro">${m("La pagella del primo quadrimestre sarà pubblicata dopo lo scrutinio di febbraio 2027.")}</p>
  <div class="table-wrap"><table class="reg-table">
    <caption class="sr-only">Pagella del primo quadrimestre</caption>
    <thead><tr><th scope="col">${L.col.subject}</th><th scope="col">Voto finale</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  <p class="reg-small">${m("Per i dubbi sui voti puoi chiedere un colloquio al coordinatore di classe.")}</p>`;
}

function explainHtml(n) {
  const l = lang();
  const st = S.explain[`${n.id}:${l}`];
  let body = "";
  if (st && st.status === "loading") body = `<p class="ex-loading">${esc(t("explain.loading"))}</p>`;
  if (st && st.status === "ready") {
    const d = st.data;
    body = `<h3 class="ex-title" id="ex-title" tabindex="-1"><span class="mark" aria-hidden="true">&gt;</span> ${esc(t("explain.title"))}</h3>
      <p class="ex-source">${esc(st.source === "ai" ? t("explain.source.ai") : t("explain.source.ready"))}</p>
      <p class="ex-text">${rich(d.explanation)}</p>
      ${d.what_to_do ? `<h4 class="ex-h">${esc(t("explain.todo"))}</h4><p class="ex-todo">${rich(d.what_to_do)}</p>` : ""}
      ${d.quotes && d.quotes.length ? `<h4 class="ex-h">${esc(t("explain.words"))}</h4>
        <ul class="ex-quotes">${d.quotes.map((q) => `<li><bdi lang="it" dir="ltr">${esc(q)}</bdi></li>`).join("")}</ul>` : ""}
      <p class="ex-note">${esc(t("explain.original"))}</p>
      <p class="ex-note">${esc(t("explain.disclaimer"))}</p>`;
  }
  const button = st && st.status === "ready" ? ""
    : `<button type="button" class="btn-coach" data-coach="explain" data-notice="${n.id}"${st ? " disabled" : ""}><span class="mark" aria-hidden="true">&gt;</span> ${esc(t("explain.button"))}</button>`;
  return `<section class="coach-inline" lang="${l}" dir="${dirOf(l)}" aria-label="${esc(t("explain.title"))}">${button}${body}</section>`;
}

function renderRegister() {
  $("#reg-school").textContent = SCHOOL.institute;
  $("#reg-user").innerHTML = `Genitore di <b>${esc(SCHOOL.student)}</b> · classe ${esc(SCHOOL.className)} · a.s. ${esc(SCHOOL.year)}`;
  $("#reg-nav").innerHTML = navHtml();
  const m = marker();
  const pages = { home: homeHtml, assenze: assenzeHtml, voti: votiHtml, colloqui: colloquiHtml, bacheca: bachecaHtml, pagella: pagellaHtml };
  $("#reg-main").innerHTML = pages[S.page](m);
}

// ------------------------------------------------------------ aiuto (coach)
function levelBadge(level) {
  return `<span class="lvl lvl-${level}">${esc(t(`level.${level}`))}</span>`;
}

function pickHtml() {
  const order = ["ar", "en", "it"];
  return `<div class="c-pick">
    ${order.map((l) => `<p class="c-pick-q" lang="${l}" dir="${dirOf(l)}">${esc(translate(l, "lang.pick"))}</p>`).join("")}
    <div class="c-pick-btns">
      ${order.map((l) => `<button type="button" class="btn-lang-big" data-lang="${l}" lang="${l}" dir="${dirOf(l)}">${esc(LANG_META[l].name)}</button>`).join("")}
    </div>
  </div>`;
}

function tasksHtml() {
  const first = !TASKS.some((task) => progress.attemptsFor(task.id).length);
  const quizCta = !progress.quiz.pre && !S.quizSkipped;
  const items = TASKS.map((task) => {
    const n = progress.attemptsFor(task.id).length;
    const title = t(`${task.key}.title`);
    return `<li class="c-task-item">
      <div class="c-task-info">
        <p class="c-task-title">${esc(title)}</p>
        <p class="c-task-meta">${levelBadge(progress.levelFor(task.id))} <span>${esc(t("tasks.attempts", { n }))}</span>
          ${progress.mastered(task.id) ? `<span class="c-ok"><span aria-hidden="true">✓</span> ${esc(t("tasks.mastered"))}</span>` : ""}</p>
      </div>
      <button type="button" class="btn-c-primary" data-coach="start" data-task="${task.id}" aria-label="${esc(`${t("btn.start")}: ${title}`)}">${esc(t("btn.start"))}</button>
    </li>`;
  }).join("");
  const words = GLOSSARY.map((g) => `<li><button type="button" class="c-gloss-btn" data-term="${g.id}">
      <bdi lang="it" dir="ltr" class="c-gloss-it">${esc(g.term)}</bdi>${lang() !== "it" ? ` <span class="c-gloss-tr">${esc(termIn(g, lang()))}</span>` : ""}</button></li>`).join("");
  return `${first ? `<div class="c-welcome"><p class="c-big">${esc(t("welcome.title"))}</p><p>${esc(t("welcome.body"))}</p></div>` : ""}
    ${quizCta ? `<div class="c-card c-quizcta"><p>${esc(t("welcome.quiz"))}</p><div class="c-row">
      <button type="button" class="btn-c-primary" data-coach="quiz">${esc(t("btn.startQuiz"))}</button>
      <button type="button" class="btn-c-ghost" data-coach="skip-quiz">${esc(t("btn.skipQuiz"))}</button></div></div>` : ""}
    <h3 class="c-h">${esc(t("tasks.title"))}</h3>
    <p class="c-muted">${esc(t("tasks.intro"))}</p>
    <ol class="c-tasks">${items}</ol>
    <details class="c-gloss"><summary>${esc(t("glossary.title"))}</summary>
      <p class="c-muted">${esc(t("glossary.intro"))}</p><ul class="c-gloss-list">${words}</ul></details>
    <p class="c-muted">${esc(t("free.note"))}</p>`;
}

function messageHtml(msg) {
  const title = msg.kind === "hint" ? t("hint.title") : t("feedback.title");
  return `<div class="c-msg c-msg-${msg.kind}">
    <p class="c-msg-h"><span class="mark" aria-hidden="true">&gt;</span> ${esc(title)}</p>
    <p>${rich(t(msg.key))}</p>${msg.extraKey ? `<p>${rich(t(msg.extraKey))}</p>` : ""}</div>`;
}

function activeHtml() {
  const v = S.session.view();
  const task = S.task;
  const lvl = v.level;
  const answer = task.id === "T4" ? `<div class="c-answer" id="answer-group" role="group" aria-labelledby="answer-q">
      <p id="answer-q">${rich(t("t4.question"))}</p>
      <div class="c-answer-btns">${GRADE_QUESTION.options.map((o) => `<button type="button" class="btn-answer" data-act="answer:${o}" lang="it" dir="ltr">${esc(o)}</button>`).join("")}</div>
    </div>` : "";
  return `<div class="c-active">
    <p class="c-eyebrow">${esc(t("tasks.title"))}</p>
    <h3 class="c-task-h" id="c-task-h" tabindex="-1">${esc(t(`${task.key}.title`))}</h3>
    <div class="c-level">${levelBadge(lvl)}<p>${esc(t(`level.${lvl}.desc`))}</p></div>
    <section class="c-goal"><h4>${esc(t("task.goal"))}</h4><p>${rich(t(`${task.key}.goal`))}</p></section>
    ${v.instructionKey ? `<section class="c-step"><p class="c-count">${esc(t("step.count", { n: v.stepIndex + 1, total: v.stepCount }))}</p>
      <p class="c-instr">${rich(t(v.instructionKey))}</p></section>` : ""}
    ${lvl === 2 && !v.message ? `<p class="c-wait">${esc(t("hint.waiting"))}</p>` : ""}
    ${lvl === 3 && !v.message ? `<p class="c-wait">${esc(t("solo.status"))}</p>` : ""}
    ${v.message ? messageHtml(v.message) : ""}
    ${answer}
    <div class="c-actions">
      ${v.target ? `<button type="button" class="btn-c-primary" data-coach="show">${esc(t("btn.showMe"))}</button>` : ""}
      ${lvl >= 2 ? `<button type="button" class="btn-c-ghost" data-coach="help">${esc(t("btn.help"))}</button>` : ""}
      <button type="button" class="btn-c-ghost" data-coach="stop">${esc(t("btn.stop"))}</button>
    </div>
    ${lvl === 3 ? `<p class="c-muted c-small">${esc(t("help.level3"))}</p>` : ""}
  </div>`;
}

function doneHtml() {
  const a = S.result;
  const task = taskById(a.taskId);
  const title = a.completed ? t("done.title") : `${t(`${task.key}.title`)} · ${t("progress.ko")}`;
  return `<div class="c-done">
    <h3 class="c-done-h" id="c-done-h" tabindex="-1">${esc(title)}</h3>
    ${a.completed && a.level === 3 ? `<p class="c-solo"><span aria-hidden="true">★</span> ${esc(t("done.solo"))}</p>` : ""}
    <p>${a.completed ? rich(t(`${task.key}.done`)) : esc(t("done.stopped"))}</p>
    <p class="c-metrics">${esc(t("done.metrics", { time: duration(a.ms), errors: a.errors, hints: a.level === 1 ? t("progress.guided") : a.hints }))}</p>
    <p class="c-next">${esc(t("done.next", { level: "" }))}${levelBadge(a.nextLevel)}</p>
    <div class="c-actions">
      <button type="button" class="btn-c-primary" data-coach="start" data-task="${task.id}">${esc(t("btn.retry"))}</button>
      <button type="button" class="btn-c-ghost" data-coach="tasks">${esc(t("btn.others"))}</button>
      <button type="button" class="btn-c-ghost" data-view="progress">${esc(t("nav.progress"))}</button>
    </div>
  </div>`;
}

function termCardHtml() {
  const g = termById(S.termId);
  if (!g) return "";
  const l = lang();
  const others = LANGS.filter((x) => x !== l && x !== "it");
  return `<section class="c-term" aria-labelledby="c-term-h">
    <div class="c-term-top"><p class="c-eyebrow">${esc(t("glossary.title"))}</p>
      <button type="button" class="btn-c-ghost c-close" data-coach="close-term">${esc(t("glossary.close"))}</button></div>
    <h3 class="c-term-h" id="c-term-h" tabindex="-1"><bdi lang="it" dir="ltr">${esc(g.term)}</bdi></h3>
    ${l !== "it" ? `<p class="c-term-tr">${esc(g[l].term)}</p><p>${esc(g[l].def)}</p>` : ""}
    <p class="c-term-label">${esc(t("glossary.simpleIt"))}</p>
    <p lang="it" dir="ltr">${esc(g.it.def)}</p>
    ${others.length ? `<details class="c-term-more"><summary>${esc(t("glossary.other"))}</summary>
      ${others.map((x) => `<div lang="${x}" dir="${dirOf(x)}"><p class="c-term-label">${esc(LANG_META[x].name)}</p><p><b>${esc(g[x].term)}</b> · ${esc(g[x].def)}</p></div>`).join("")}
    </details>` : ""}
  </section>`;
}

function renderCoach() {
  const coach = $("#coach");
  const picking = S.coach === "pick";
  coach.lang = picking ? "it" : lang();
  coach.dir = picking ? "ltr" : dirOf(lang());
  $("#coach-live").lang = lang();
  $("#coach-title-text").textContent = picking ? "Registro amico" : t("coach.title");
  const toggle = $("#coach-toggle");
  toggle.textContent = S.collapsed ? t("coach.expand") : t("coach.collapse");
  toggle.setAttribute("aria-expanded", String(!S.collapsed));
  $("#coach-content").hidden = S.collapsed;
  $("#coach-term").innerHTML = S.termId && !picking ? termCardHtml() : "";
  const views = { pick: pickHtml, tasks: tasksHtml, active: activeHtml, done: doneHtml };
  $("#coach-body").innerHTML = views[S.coach]();
}

function renderAppbar() {
  const l = lang();
  const bar = $("#appbar");
  $("#tagline").textContent = t("app.tagline");
  $("#tagline").lang = l;
  $("#tagline").dir = dirOf(l);
  const views = $("#views");
  views.lang = l;
  views.dir = dirOf(l);
  views.setAttribute("aria-label", t("nav.views"));
  views.innerHTML = ["practice", "progress"].map((v) => `<button type="button" data-view="${v}"${S.view === v || (v === "practice" && S.view === "quiz") ? ' aria-current="page"' : ""}>${esc(t(v === "practice" ? "nav.practice" : "nav.progress"))}</button>`).join("");
  $("#langs-label").textContent = t("lang.label");
  $("#langs-label").lang = l;
  $("#langs").setAttribute("aria-label", t("lang.label"));
  bar.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === S.lang)));
}

// ------------------------------------------------------------ progressi e quiz
function progressHtml() {
  const cards = TASKS.map((task) => {
    const list = progress.attemptsFor(task.id);
    const trend = progress.errorsTrend(task.id);
    const table = list.length ? `<div class="table-wrap"><table class="pv-table">
      <thead><tr><th scope="col">${esc(t("progress.col.n"))}</th><th scope="col">${esc(t("progress.col.level"))}</th>
        <th scope="col">${esc(t("progress.col.time"))}</th><th scope="col">${esc(t("progress.col.errors"))}</th>
        <th scope="col">${esc(t("progress.col.hints"))}</th><th scope="col">${esc(t("progress.col.result"))}</th></tr></thead>
      <tbody>${list.map((a, i) => `<tr><td>${i + 1}</td><td>${levelBadge(a.level)}</td><td>${esc(duration(a.ms))}</td>
        <td>${a.errors}</td><td>${a.level === 1 ? esc(t("progress.guided")) : a.hints}</td>
        <td>${a.completed ? `<span class="status ok">${esc(t("progress.ok"))}</span>` : `<span class="status pending">${esc(t("progress.ko"))}</span>`}</td></tr>`).join("")}</tbody>
      </table></div>` : `<p class="c-muted">${esc(t("progress.none"))}</p>`;
    return `<section class="pv-card" aria-labelledby="pv-${task.id}">
      <h3 id="pv-${task.id}">${esc(t(`${task.key}.title`))}</h3>
      ${progress.mastered(task.id) ? `<p class="c-solo"><span aria-hidden="true">★</span> ${esc(t("progress.mastered"))}</p>` : ""}
      <p class="c-next">${esc(t("progress.next", { level: "" }))}${levelBadge(progress.levelFor(task.id))}</p>
      ${table}
      ${trend ? `<p class="pv-trend">${esc(t("progress.errorsTrend", trend))}</p>` : ""}
    </section>`;
  }).join("");
  const { pre, post } = progress.quiz;
  const delta = quizDelta(pre, post);
  return `<div class="pv">
    <h2 class="pv-h" id="pv-title" tabindex="-1">${esc(t("progress.title"))}</h2>
    <p class="pv-intro">${esc(t("progress.intro"))}</p>
    <div class="pv-grid">${cards}</div>
    <section class="pv-card pv-quiz" aria-labelledby="pv-quiz">
      <h3 id="pv-quiz">${esc(t("progress.quiz.title"))}</h3>
      <p>${pre ? esc(t("progress.quiz.pre", pre)) : `${esc(t("progress.quiz.pre", { score: "—", total: QUIZ.length }))} · ${esc(t("progress.quiz.missing"))}`}</p>
      <p>${post ? esc(t("progress.quiz.post", post)) : `${esc(t("progress.quiz.post", { score: "—", total: QUIZ.length }))} · ${esc(t("progress.quiz.missing"))}`}</p>
      ${delta !== null && delta > 0 ? `<p class="c-solo">${esc(t("progress.quiz.delta", { n: delta }))}</p>` : ""}
      <button type="button" class="btn-c-primary" data-coach="quiz">${esc(t(pre ? "btn.quizPost" : "btn.quizPre"))}</button>
    </section>
    <p class="c-muted">${esc(t("progress.local"))}</p>
    <button type="button" class="btn-c-ghost" data-coach="reset">${esc(t("btn.reset"))}</button>
  </div>`;
}

function quizHtml() {
  const qz = S.quiz;
  const l = lang();
  if (qz.done) {
    const r = qz.result;
    return `<div class="pv qz">
      <h2 class="pv-h" id="qz-title" tabindex="-1">${esc(t("quiz.title"))}</h2>
      <p class="c-big">${esc(t("quiz.result", r))}</p>
      <p>${esc(t("quiz.review"))}</p>
      <ul class="qz-review">${QUIZ.map((q) => {
        const g = termById(q.term);
        const ok = r.details.find((d) => d.id === q.id).ok;
        return `<li class="${ok ? "ok" : "ko"}"><span aria-hidden="true">${ok ? "✓" : "›"}</span> <bdi lang="it" dir="ltr"><b>${esc(g.term)}</b></bdi>: ${esc(g[l === "it" ? "it" : l].def)}</li>`;
      }).join("")}</ul>
      <button type="button" class="btn-c-primary" data-coach="quiz-close">${esc(t("btn.continue"))}</button>
    </div>`;
  }
  const q = QUIZ[qz.index];
  const g = termById(q.term);
  const chosen = qz.answers[q.id] || null;
  const options = q.options.map((id, i) => {
    const o = termById(id);
    const text = l === "it" ? o.it.def : o[l].def;
    return `<label class="qz-opt"><input type="radio" name="qz-${q.id}" value="${id}" data-quiz="${q.id}"${chosen === id ? " checked" : ""}>
      <span>${esc(text)}</span></label>`;
  }).join("");
  return `<div class="pv qz">
    <h2 class="pv-h" id="qz-title" tabindex="-1">${esc(t("quiz.title"))}</h2>
    <p class="c-muted">${esc(t("quiz.intro"))}</p>
    <p class="c-count">${esc(t("quiz.count", { n: qz.index + 1, total: QUIZ.length }))}</p>
    <fieldset class="qz-q"><legend>${rich(t("quiz.question", { term: g.term }))}</legend>${options}</fieldset>
    <button type="button" class="btn-c-primary" data-coach="quiz-next" id="qz-next"${chosen ? "" : " disabled"}>${esc(t(qz.index === QUIZ.length - 1 ? "btn.continue" : "btn.next"))}</button>
  </div>`;
}

function renderFullview() {
  const fv = $("#fullview");
  const practice = S.view === "practice";
  $("#practice").hidden = !practice;
  fv.hidden = practice;
  if (practice) { fv.innerHTML = ""; return; }
  fv.lang = lang();
  fv.dir = dirOf(lang());
  fv.innerHTML = S.view === "quiz" ? quizHtml() : progressHtml();
}

// ------------------------------------------------------------ evidenziazione e annunci
function applyHighlight() {
  document.querySelectorAll(".coach-target").forEach((el) => {
    el.classList.remove("coach-target");
    el.removeAttribute("data-here");
  });
  const v = S.coach === "active" && S.session ? S.session.view() : null;
  if (!v || !v.target) return;
  document.querySelectorAll(v.target).forEach((el) => {
    el.classList.add("coach-target");
    el.setAttribute("data-here", t("here.badge"));
    // Se il bersaglio è nel pannello di aiuto (le risposte di T4), lo porto in vista.
    if (el.closest("#coach")) el.scrollIntoView({ block: "nearest", behavior: reduceMotion.matches ? "auto" : "smooth" });
  });
}

function announce(text) {
  if (!text || text === S.lastAnnounced) return;
  S.lastAnnounced = text;
  const live = $("#coach-live");
  live.textContent = "";
  setTimeout(() => { live.textContent = text; }, 60);
}

function plain(key) {
  return t(key).replace(/[«»]/g, "");
}

function announceSession() {
  if (!S.session) return;
  const v = S.session.view();
  if (v.message) announce([plain(v.message.key), v.message.extraKey ? plain(v.message.extraKey) : ""].join(" "));
  else if (v.instructionKey) announce(plain(v.instructionKey));
}

// ------------------------------------------------------------ fuoco
function focusKey(el) {
  if (!el || el === document.body) return null;
  const d = el.dataset || {};
  if (d.key) return `[data-key="${d.key}"]`;
  if (d.act) return `[data-act="${CSS.escape(d.act)}"]`;
  if (d.coach) return `[data-coach="${d.coach}"]${d.task ? `[data-task="${d.task}"]` : ""}`;
  if (d.term) return `[data-term="${d.term}"]`;
  if (d.view) return `[data-view="${d.view}"]`;
  if (d.quiz) return `input[value="${CSS.escape(el.value)}"]`;
  return el.id ? `#${CSS.escape(el.id)}` : null;
}

// Ridisegna tutto e rimette il fuoco dove serve (o dove era).
function render(focusSel) {
  const keep = focusKey(document.activeElement);
  renderAppbar();
  renderRegister();
  renderCoach();
  renderFullview();
  applyHighlight();
  const target = (focusSel && $(focusSel)) || (keep && $(keep));
  if (target && target !== document.activeElement) target.focus({ preventScroll: !focusSel });
}

// ------------------------------------------------------------ azioni sul registro
const FOCUS_AFTER = {
  nav: "#reg-title",
  event: "#ev-title",
  justify: '[data-act="reason:salute"]',
  teacher: "#slots-title",
  notice: "#notice-title",
  subject: "#subj-title",
  "confirm-justify": "#reg-msg",
  "confirm-booking": "#reg-msg",
  ack: "#reg-msg",
};

function applyAction(ev) {
  switch (ev.action) {
    case "nav":
      if (!PAGES.includes(ev.value)) return;
      S.page = ev.value;
      S.ui = freshUi();
      break;
    case "event":
      S.ui.event = ev.value;
      S.ui.justifyOpen = false;
      S.ui.reason = null;
      S.ui.msg = null;
      break;
    case "justify":
      S.ui.justifyOpen = true;
      break;
    case "reason":
      S.ui.reason = ev.value;
      break;
    case "confirm-justify": {
      const e = S.reg.events.find((x) => x.id === ev.value);
      if (!e) return;
      if (!S.ui.reason) {
        S.ui.msg = { type: "error", text: "Scegli un motivo prima di confermare." };
        return;
      }
      e.justified = true;
      S.ui.justifyOpen = false;
      S.ui.reason = null;
      S.ui.notes = "";
      S.ui.msg = { type: "ok", text: "Giustificazione registrata. Ambiente di prova: niente è stato inviato alla scuola." };
      break;
    }
    case "teacher":
      S.ui.teacher = ev.value;
      S.ui.slot = null;
      S.ui.msg = null;
      break;
    case "slot": {
      const teacher = TEACHERS.find((x) => x.id === S.ui.teacher);
      const slot = teacher && slotsOf(teacher).find((s) => s.id === ev.value);
      const booked = S.reg.bookings.some((b) => b.slot === ev.value);
      if (!slot || !slot.free || booked) {
        S.ui.slot = null;
        S.ui.msg = { type: "error", text: "Orario non disponibile: è già prenotato. Scegli un orario libero." };
      } else {
        S.ui.slot = ev.value;
        S.ui.msg = null;
      }
      break;
    }
    case "confirm-booking": {
      const teacher = TEACHERS.find((x) => x.id === S.ui.teacher);
      const slot = teacher && slotsOf(teacher).find((s) => s.id === ev.value);
      if (!slot) return;
      S.reg.bookings.push({ slot: slot.id, text: `${teacher.name} · ${teacher.day} · ore ${slot.time}` });
      S.ui.slot = null;
      S.ui.msg = { type: "ok", text: "Prenotazione confermata. Ambiente di prova: niente è stato inviato alla scuola." };
      break;
    }
    case "notice": {
      const st = noticeState(ev.value);
      if (!st) return;
      st.read = true;
      S.ui.notice = ev.value;
      S.ui.msg = null;
      break;
    }
    case "ack": {
      const st = noticeState(ev.value);
      if (!st) return;
      st.ackDone = true;
      S.ui.msg = { type: "ok", text: "Presa visione registrata. Ambiente di prova: niente è stato inviato alla scuola." };
      break;
    }
    case "subject":
      S.ui.subject = ev.value;
      break;
    default:
      break;
  }
}

function onAct(actStr) {
  const ev = parseAct(actStr);
  const inTask = S.coach === "active" && S.session && !S.session.finished;
  let blocked = false;
  if (inTask) {
    const r = S.session.handle(ev);
    blocked = r.outcome === "wrong" && r.guarded;
  }
  if (ev.action === "answer" && !inTask) return;
  if (!blocked) applyAction(ev);
  if (inTask && S.session.finished) return finishAttempt();
  // Se l'azione è bloccata il fuoco resta dov'è; l'aiuto lo annuncia.
  render(blocked ? null : FOCUS_AFTER[ev.action]);
  if (inTask) announceSession();
}

// ------------------------------------------------------------ esercizi
function startTask(taskId) {
  const task = taskById(taskId);
  if (!task) return;
  S.task = task;
  S.reg = freshRegisterState();
  S.ui = freshUi();
  S.page = "home";
  S.explain = {};
  S.view = "practice";
  S.termId = null;
  S.session = createSession({ task, level: progress.levelFor(task.id) });
  S.coach = "active";
  S.lastAnnounced = "";
  render("#c-task-h");
  const v = S.session.view();
  announce([t(`${task.key}.title`), t(`level.${v.level}`), plain(`${task.key}.goal`), v.instructionKey ? plain(v.instructionKey) : ""].join(". "));
}

function finishAttempt() {
  const a = S.session.view().attempt;
  progress.record(a);
  save();
  S.result = a;
  S.coach = "done";
  S.session = null;
  render("#c-done-h");
  const parts = [a.completed ? t("done.title") : t("progress.ko")];
  if (a.completed && a.level === 3) parts.push(t("done.solo"));
  if (a.completed) parts.push(plain(`${taskById(a.taskId).key}.done`));
  parts.push(t("done.metrics", { time: duration(a.ms), errors: a.errors, hints: a.level === 1 ? t("progress.guided") : a.hints }));
  announce(parts.join(" "));
}

function showTarget() {
  const v = S.session && S.session.view();
  if (!v || !v.target) return;
  const el = $(v.target);
  if (!el) return;
  S.session.activity();
  el.scrollIntoView({ block: "center", behavior: reduceMotion.matches ? "auto" : "smooth" });
  const focusable = el.matches("button, input, textarea, [tabindex]") ? el : el.querySelector("button, input");
  if (focusable) focusable.focus({ preventScroll: true });
}

// ------------------------------------------------------------ spiegazione delle comunicazioni
async function requestExplain(noticeId) {
  const n = noticeById(noticeId);
  if (!n) return;
  const l = lang();
  const key = `${noticeId}:${l}`;
  if (S.session) S.session.activity();
  const ready = () => ({ status: "ready", data: n.explanations[l], source: "ready" });
  if (!S.ai) {
    S.explain[key] = ready();
  } else {
    S.explain[key] = { status: "loading" };
    render();
    announce(t("explain.loading"));
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ noticeId, lang: l }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(String(res.status));
      const d = await res.json();
      S.explain[key] = {
        status: "ready", source: "ai",
        data: { explanation: d.explanation, what_to_do: d.what_to_do || "", quotes: Array.isArray(d.quotes) ? d.quotes : [] },
      };
    } catch {
      // AI non disponibile o risposta scartata dai controlli: spiegazione già pronta.
      S.explain[key] = ready();
    }
  }
  render("#ex-title");
  const d = S.explain[key].data;
  announce(`${t("explain.title")}. ${d.explanation.replace(/[«»]/g, "")} ${d.what_to_do.replace(/[«»]/g, "")}`);
}

// ------------------------------------------------------------ glossario
function openTerm(id, opener) {
  if (!termById(id)) return;
  S.termId = id;
  S.termOpener = focusKey(opener);
  if (S.session) S.session.activity();
  S.collapsed = false;
  render("#c-term-h");
  const g = termById(id);
  announce(`${g.term}. ${lang() === "it" ? g.it.def : `${g[lang()].term}. ${g[lang()].def}`}`);
}

function closeTerm() {
  const back = S.termOpener;
  S.termId = null;
  S.termOpener = null;
  render(back);
}

// ------------------------------------------------------------ comandi dell'aiuto
function onCoach(cmd, el) {
  switch (cmd) {
    case "start": return startTask(el.dataset.task);
    case "tasks":
      S.coach = "tasks";
      return render("#coach-title");
    case "show": return showTarget();
    case "help": {
      if (!S.session) return;
      const r = S.session.askHelp();
      if (S.session.finished) return finishAttempt();
      render();
      if (r.action === "hint") announceSession();
      return;
    }
    case "stop":
      if (!S.session) return;
      S.session.abandon();
      return finishAttempt();
    case "explain": return requestExplain(el.dataset.notice);
    case "close-term": return closeTerm();
    case "skip-quiz":
      S.quizSkipped = true;
      return render("#coach-title");
    case "quiz":
      if (S.session && !S.session.finished) { S.session.abandon(); finishAttempt(); }
      S.quiz = { phase: progress.quiz.pre ? "post" : "pre", index: 0, answers: {}, done: false, result: null };
      S.view = "quiz";
      return render("#qz-title");
    case "quiz-next": {
      const q = QUIZ[S.quiz.index];
      if (!S.quiz.answers[q.id]) return;
      if (S.quiz.index < QUIZ.length - 1) {
        S.quiz.index += 1;
        return render("#qz-title");
      }
      const result = scoreQuiz(S.quiz.answers);
      progress.setQuiz(S.quiz.phase, { score: result.score, total: result.total });
      save();
      S.quiz.done = true;
      S.quiz.result = result;
      render("#qz-title");
      return announce(t("quiz.result", result));
    }
    case "quiz-close":
      S.view = S.quiz && S.quiz.phase === "post" ? "progress" : "practice";
      S.quiz = null;
      return render(S.view === "progress" ? "#pv-title" : "#coach-title");
    case "reset":
      if (!window.confirm(t("reset.confirm"))) return;
      progress.reset();
      save();
      S.coach = "tasks";
      return render("#pv-title");
    default:
      return undefined;
  }
}

function setLang(l) {
  if (!LANGS.includes(l)) return;
  S.lang = l;
  if (S.coach === "pick") S.coach = "tasks";
  save();
  S.lastAnnounced = "";
  render(document.activeElement && document.activeElement.closest("#coach") ? "#coach-title" : null);
  announce(t("welcome.title"));
}

function setView(v) {
  if (v === "progress" && S.session && !S.session.finished) {
    S.session.abandon();
    finishAttempt();
  }
  S.view = v === "progress" ? "progress" : "practice";
  if (S.view === "practice") S.quiz = null;
  render(S.view === "progress" ? "#pv-title" : "#reg-title");
}

// ------------------------------------------------------------ eventi
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-lang],[data-view],[data-term],[data-coach],[data-act]");
  if (!el || el.disabled) return;
  if (el.dataset.lang) return setLang(el.dataset.lang);
  if (el.dataset.view) return setView(el.dataset.view);
  if (el.dataset.term) return openTerm(el.dataset.term, el);
  if (el.dataset.coach) return onCoach(el.dataset.coach, el);
  if (el.dataset.act) return onAct(el.dataset.act);
  return undefined;
});

document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset && el.dataset.quiz && S.quiz) {
    S.quiz.answers[el.dataset.quiz] = el.value;
    const next = $("#qz-next");
    if (next) next.disabled = false;
  }
});

document.addEventListener("input", (e) => {
  if (e.target.id === "just-notes") {
    S.ui.notes = e.target.value;
    if (S.session) S.session.activity();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && S.termId) {
    e.preventDefault();
    closeTerm();
  }
});

$("#coach-toggle").addEventListener("click", () => {
  S.collapsed = !S.collapsed;
  renderCoach();
});

// Il tempo passato in un'altra scheda non conta come "ferma".
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && S.session) S.session.activity();
});

// Rilevamento del blocco (livello 2): un controllo al secondo.
setInterval(() => {
  if (S.coach !== "active" || !S.session || S.session.finished || document.hidden) return;
  if (S.session.tick()) {
    renderCoach();
    applyHighlight();
    announceSession();
  }
}, 1000);

// ------------------------------------------------------------ avvio
async function checkAi() {
  try {
    const res = await fetch("/api/health", { cache: "no-store" });
    const h = await res.json();
    S.ai = !!h.ai;
  } catch {
    S.ai = false;
  }
}

load();
render();
checkAi();
