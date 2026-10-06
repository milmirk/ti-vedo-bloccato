/*
 * Interfaccia di "Bilancio senza numeri".
 *
 * Qui c'è solo il DOM: tutti i conti, le parole, le domande e le regole di
 * adattamento sono nei moduli di lib/, gli stessi che girano nei test.
 */
import { CATALOG, DEFAULT_CHOICE, MIN_UNITS, MAX_UNITS, MIN_PRICE_CENTS, MAX_PRICE_CENTS, resolveUnits, decompose } from "./lib/units.js";
import { localTodayISO, isISODate, monthGrid, parts as dateParts, nextPayday, daysBetween, WEEKDAYS, MONTHS, weekday } from "./lib/dates.js";
import { countPhrase, partsPhrase, formatEuro, listPhrase, capitalize, distancePhrase, numberWord, dateWords } from "./lib/words.js";
import { STORAGE_KEY, createState, newPeriod, recordSpend, undoLast, loadState, chosenUnits, knownUnits, normalizeItems } from "./lib/budget.js";
import { buildView, evidenceView, recentSpends, spendText, itemText } from "./lib/view.js";
import { makeQuestion, feedbackText } from "./lib/questions.js";
import { LADDER, REP_LABELS, shouldAsk, answerPending, chooseRepresentation, postpone } from "./lib/adapt.js";
import { parseSpendText } from "./lib/parser.js";
import { marcoDemo } from "./lib/demo.js";

/* ---------- utilità ---------- */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const params = new URLSearchParams(location.search);
const fixedToday = isISODate(params.get("oggi")) ? params.get("oggi") : null;
const today = () => fixedToday || localTodayISO();

const unitName = (u) => u.one.replace(/^(un'|una |uno |un )/, "");
const dateLabel = (iso) => `${WEEKDAYS[weekday(iso)]} ${dateParts(iso).d} ${MONTHS[dateParts(iso).m - 1]}`;

function announce(text) {
  const el = $("#announcer");
  el.textContent = "";
  // Un attimo di pausa: alcuni lettori di schermo non annunciano un testo identico al precedente.
  setTimeout(() => { el.textContent = text; }, 60);
}

/** Icone ripetute, a gruppi di cinque, mai più di venti. */
function iconRun(icon, count, max = 20) {
  let html = "";
  for (let i = 0; i < Math.min(count, max); i++) {
    if (i && i % 5 === 0) html += '<span class="gap"></span>';
    html += `<span class="ico">${icon}</span>`;
  }
  if (count > max) html += '<span class="more">…</span>';
  return html;
}

function decIcons(dec, cls = "row-icons") {
  if (!dec.parts.length) return "";
  return `<div class="${cls}" aria-hidden="true">${dec.parts.map((p) => `<span class="run">${iconRun(p.unit.icon, p.count)}</span>`).join("")}</div>`;
}

/* ---------- stato ---------- */

let state = null;
try { state = loadState(localStorage.getItem(STORAGE_KEY)); } catch { state = null; }

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* modalità privata: si continua in memoria */ }
}

const ui = {
  mode: state ? "home" : "setup",
  step: 1,
  draft: null,
  altroOpen: false,
  altroBuilt: false,
  altro: new Map(),
  free: null,
  feedback: null,
  ai: false,
  reading: false,
  orderRep: null,
  toastTimer: null,
};

/* ---------- impostazione ---------- */

function newDraft(from) {
  const t = today();
  const units = from ? from.setup.units : DEFAULT_CHOICE.map((id) => ({ id }));
  const prices = new Map(CATALOG.map((u) => [u.id, u.cents]));
  for (const u of resolveUnits(units)) prices.set(u.id, u.cents);
  let payday = null;
  let paydayISO = null;
  if (from && from.setup.payday.type === "monthly") {
    payday = from.setup.payday;
    paydayISO = nextPayday(t, payday);
  }
  const { y, m } = dateParts(paydayISO || t);
  return { amount: "", payday, paydayISO, monthly: from ? from.setup.payday.type === "monthly" : true, selected: new Set(units.map((u) => u.id)), prices, editing: null, cal: { y, m }, period: !!from };
}

function typedCents(str) {
  if (!str) return 0;
  const [i, d = ""] = str.split(",");
  return Number(i || 0) * 100 + Number((d + "00").slice(0, 2));
}

function formatTyped(str) {
  const [i, d] = str.split(",");
  const int = (i || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return d === undefined ? int : `${int},${d}`;
}

function draftUnits() {
  const d = ui.draft;
  return resolveUnits([...d.selected].map((id) => ({ id, cents: d.prices.get(id) })));
}

function pressKey(k) {
  const d = ui.draft;
  let s = d.amount;
  if (k === "back") s = s.slice(0, -1);
  else if (k === ",") { if (!s.includes(",")) s = (s || "0") + ","; }
  else if (/^\d$/.test(k)) {
    const [i, dec] = s.split(",");
    if (dec !== undefined) { if (dec.length < 2) s += k; }
    else if (!i || i === "0") s = k;
    else if (i.length < 5) s += k;
  }
  d.amount = s;
  renderStep1();
}

function showStep(n, focus = true) {
  ui.step = n;
  for (let i = 1; i <= 3; i++) $(`#step-${i}`).hidden = i !== n;
  $$(".progress-steps span").forEach((s) => s.classList.toggle("on", Number(s.dataset.step) <= n));
  $("#step-label").textContent = `Passo ${numberWord(n)} di tre`;
  $("#setup").setAttribute("aria-labelledby", `step-title-${n}`);
  if (n === 1) renderStep1();
  if (n === 2) renderStep2();
  if (n === 3) renderStep3();
  if (focus) $(`#step-title-${n}`).focus();
}

function renderSetup() {
  if (!ui.draft) ui.draft = newDraft(null);
  $("#setup").hidden = false;
  $("#home").hidden = true;
  $("#welcome").hidden = ui.draft.period;
  $("#demo-link").hidden = ui.draft.period;
  $("#step-title-1").textContent = ui.draft.period ? "Quanti soldi hai adesso, fino al prossimo stipendio?" : "Quanti soldi hai fino al prossimo stipendio?";
  showStep(ui.step, false);
}

function renderStep1() {
  const d = ui.draft;
  $("#amount-display").textContent = d.amount ? formatTyped(d.amount) : "0";
  const cents = typedCents(d.amount);
  $("#step1-next").disabled = cents <= 0;
  const prev = $("#amount-preview");
  if (cents > 0) {
    const dec = decompose(cents, draftUnits());
    prev.innerHTML = `<p class="preview-title">Sono circa:</p>${decIcons(dec)}<p class="preview-text">${esc(partsPhrase(dec))}</p>`;
  } else {
    prev.innerHTML = '<p class="preview-text muted">Mentre scrivi, qui vedi la stessa cifra fatta di oggetti.</p>';
  }
}

function renderStep2(focusDate) {
  const d = ui.draft;
  const t = today();
  const { y, m } = d.cal;
  const tp = dateParts(t);
  const idx = (yy, mm) => yy * 12 + mm;
  $("#cal-title").textContent = `${capitalize(MONTHS[m - 1])} ${y}`;
  $("#cal-prev").disabled = idx(y, m) <= idx(tp.y, tp.m);
  $("#cal-next").disabled = idx(y, m) >= idx(tp.y, tp.m) + 2;
  $("#cal-grid").innerHTML = monthGrid(y, m).map((week) => `<div class="cal-row">${week.map((iso) => {
    if (!iso) return '<span class="cal-empty"></span>';
    const past = daysBetween(t, iso) < 1;
    const sel = iso === d.paydayISO;
    return `<button type="button" class="cal-day${sel ? " sel" : ""}${iso === t ? " today" : ""}" data-date="${iso}" aria-pressed="${sel}" aria-label="${esc(dateLabel(iso))}${iso === t ? ", oggi" : ""}"${past ? " disabled" : ""}>${dateParts(iso).d}</button>`;
  }).join("")}</div>`).join("");
  $("#monthly").checked = d.monthly;
  $$("[data-quick]").forEach((b) => b.setAttribute("aria-pressed", String(!!(d.payday && d.payday.type === "monthly" && String(d.payday.day) === b.dataset.quick))));
  const choice = $("#payday-choice");
  if (d.paydayISO) {
    const days = daysBetween(t, d.paydayISO);
    const rule = d.payday.type === "monthly" ? (d.payday.day >= 31 ? "l'ultimo giorno di ogni mese" : `il ${d.payday.day} di ogni mese`) : "solo questa volta";
    choice.innerHTML = `<span aria-hidden="true">💶</span> Prossimi soldi: <b>${esc(dateLabel(d.paydayISO))}</b>, ${esc(distancePhrase(days))} (${esc(rule)}).`;
  } else {
    choice.textContent = "Non hai ancora scelto il giorno.";
  }
  $("#step2-next").disabled = !d.paydayISO;
  if (focusDate) $(`[data-date="${focusDate}"]`)?.focus();
}

function choosePayday(iso) {
  const d = ui.draft;
  if (d.monthly) {
    d.payday = { type: "monthly", day: dateParts(iso).d };
    d.paydayISO = nextPayday(today(), d.payday);
  } else {
    d.payday = { type: "date", date: iso };
    d.paydayISO = iso;
  }
  const p = dateParts(d.paydayISO);
  d.cal = { y: p.y, m: p.m };
  renderStep2(d.paydayISO);
}

function renderStep3() {
  const d = ui.draft;
  $("#unit-grid").innerHTML = CATALOG.map((u) => {
    const on = d.selected.has(u.id);
    const price = d.prices.get(u.id);
    const editing = d.editing === u.id;
    return `<li class="unit-card${on ? " on" : ""}">
      <button type="button" class="unit-toggle" data-unit-toggle="${u.id}" aria-pressed="${on}">
        <span class="ic" aria-hidden="true">${u.icon}</span>
        <span class="nm">${esc(capitalize(unitName(u)))}</span>
        <span class="pr">${esc(formatEuro(price))}</span>
        <span class="tick" aria-hidden="true">${on ? "✓" : ""}</span>
      </button>
      ${on && !editing ? `<button type="button" class="btn link small" data-unit-edit="${u.id}" aria-label="Cambia il prezzo: ${esc(unitName(u))}">Cambia prezzo</button>` : ""}
      ${editing ? `<div class="price-edit">
        <label for="price-${u.id}">Prezzo di ${esc(u.one)}, in euro</label>
        <div class="row"><input id="price-${u.id}" type="text" inputmode="decimal" autocomplete="off" value="${esc(formatEuro(price).replace(" €", ""))}">
        <button type="button" class="btn small primary" data-unit-save="${u.id}">Salva</button></div>
        <p class="field-error" id="price-error-${u.id}" aria-live="polite"></p>
      </div>` : ""}
    </li>`;
  }).join("");
  const n = d.selected.size;
  $("#units-count").textContent = n === 0
    ? "Non ne hai ancora scelto nessuno: scegline almeno tre."
    : n < MIN_UNITS
      ? `Ne hai ${n === 1 ? "scelto uno" : `scelti ${numberWord(n)}`}: scegline almeno tre.`
      : `Ne hai scelti ${numberWord(n)}.${n === MAX_UNITS ? " Di più non si può: per cambiarne uno, prima toglilo." : ""}`;
  $("#step3-done").disabled = n < MIN_UNITS || n > MAX_UNITS;
}

function toggleUnit(id) {
  const d = ui.draft;
  if (d.selected.has(id)) {
    d.selected.delete(id);
    if (d.editing === id) d.editing = null;
  } else if (d.selected.size >= MAX_UNITS) {
    announce("Puoi sceglierne al massimo cinque. Per sceglierne un altro, prima togline uno.");
    return;
  } else {
    d.selected.add(id);
  }
  renderStep3();
  $(`[data-unit-toggle="${id}"]`)?.focus();
}

function savePrice(id) {
  const input = $(`#price-${id}`);
  const raw = input.value.replace(/€/g, "").replace(/\s/g, "").replace(".", ",");
  const m = /^(\d{1,3})(?:,(\d{1,2}))?$/.exec(raw);
  const cents = m ? Number(m[1]) * 100 + Number(((m[2] || "") + "00").slice(0, 2)) : NaN;
  if (!Number.isInteger(cents) || cents < MIN_PRICE_CENTS || cents > MAX_PRICE_CENTS) {
    $(`#price-error-${id}`).textContent = "Scrivi un prezzo come 1,20 (tra 0,10 e 500 euro).";
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }
  ui.draft.prices.set(id, cents);
  ui.draft.editing = null;
  renderStep3();
  $(`[data-unit-toggle="${id}"]`)?.focus();
  announce("Prezzo salvato.");
}

function finishSetup() {
  const d = ui.draft;
  const args = {
    startCents: typedCents(d.amount),
    todayISO: today(),
    payday: d.payday,
    units: [...d.selected].map((id) => ({ id, cents: d.prices.get(id) })),
  };
  try {
    state = d.period && state ? newPeriod(state, args) : createState(args);
  } catch {
    announce("Qualcosa non va nei dati: controlla i tre passi.");
    return;
  }
  save();
  ui.mode = "home";
  ui.draft = null;
  ui.step = 1;
  render();
  $("#period-title").focus();
}

/* ---------- schermata principale ---------- */

// La domanda sta subito sotto quello che chiede di capire.
const ORDER = {
  grandi: ["period-card", "remaining-card", "today-card", "check", "days-card"],
  piccoli: ["period-card", "remaining-card", "today-card", "check", "days-card"],
  giorni: ["period-card", "today-card", "days-card", "check", "remaining-card"],
  oggi: ["period-card", "today-card", "check", "remaining-card", "days-card"],
};
const TAIL = ["tools", "spend-card", "altro", "recent-card", "evidence-card", "settings-card"];

function maybeAsk(t) {
  if (ui.feedback || !shouldAsk(state, t)) return;
  const v = buildView(state, t);
  const q = makeQuestion({ plan: v.plan, units: v.repUnits, todayISO: t, rep: v.rep, index: state.checks.length });
  state = q ? { ...state, pending: q } : postpone(state, t);
  save();
}

function askNow() {
  const t = today();
  ui.feedback = null;
  const v = buildView(state, t);
  const q = makeQuestion({ plan: v.plan, units: v.repUnits, todayISO: t, rep: v.rep, index: state.checks.length, seed: Date.now() >>> 0 });
  if (!q) {
    const msg = "Adesso non c'è una domanda adatta: i soldi rimasti sono pochi o il periodo è finito.";
    announce(msg);
    showToast(msg, false);
    return;
  }
  state = { ...state, pending: q };
  save();
  render();
  $("#check").scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  $("#check-q")?.focus();
}

function renderHome() {
  const t = today();
  maybeAsk(t);
  const v = buildView(state, t);
  $("#setup").hidden = true;
  $("#home").hidden = false;

  if (ui.orderRep !== v.rep) {
    const home = $("#home");
    for (const id of [...ORDER[v.rep], ...TAIL]) home.append($(`#${id}`));
    ui.orderRep = v.rep;
  }

  renderCheck();
  renderPeriod(v);
  renderToday(v);
  renderRemaining(v);
  renderDays(v);
  renderTools(v);
  renderSpendGrid();
  if (ui.altroOpen) renderAltro(); else { $("#altro").hidden = true; $("#btn-altro")?.setAttribute("aria-expanded", "false"); }
  renderRecent(t);
  renderEvidence(t);
  renderSettings(v);
}

function renderPeriod(v) {
  $("#period-title").textContent = v.texts.header;
  $("#dots-label").textContent = v.texts.dotsLabel + ".";
  $("#dots").innerHTML = v.dots.map((d) => `<li class="dot ${d.kind}" title="${esc(d.name)}">${d.kind === "paga" ? "💶" : esc(d.short)}</li>`).join("");
}

function renderToday(v) {
  const card = $("#today-card");
  card.classList.toggle("big", v.rep === "oggi");
  $("#today-title").textContent = v.texts.todayTitle;
  let html = "";
  if (v.plan.ended) {
    html = `<p class="today-text">${esc(v.texts.today)}</p><button type="button" class="btn primary" data-action="new-period">Inizia un nuovo periodo</button>`;
  } else {
    html = decIcons(v.today, "today-icons") + `<p class="today-text">${esc(v.texts.today)}</p>`;
    if (v.rep !== "giorni") html += `<p class="future">${esc(v.texts.future)}</p>`;
  }
  $("#today-body").innerHTML = html;
}

function jarsHTML(v) {
  const euro = v.euro;
  const items = v.total.parts.map((p) => `<li class="jar">
      <div class="jar-icons" aria-hidden="true">${iconRun(p.unit.icon, p.count)}</div>
      <p class="jar-label">${esc(countPhrase(p.count, p.unit))}${euro ? ` <span class="eur">${esc(formatEuro(p.count * p.unit.cents))}</span>` : ""}</p>
    </li>`);
  if (v.total.rest > 0) {
    items.push(`<li class="jar coins"><div class="jar-icons" aria-hidden="true"><span class="ico">🪙</span></div><p class="jar-label">qualche spicciolo${euro ? ` <span class="eur">${esc(formatEuro(v.total.rest))}</span>` : ""}</p></li>`);
  }
  return `<ul class="jars">${items.join("")}</ul>`;
}

function renderRemaining(v) {
  const negative = v.plan.remaining < 0;
  const folded = v.rep === "giorni" || v.rep === "oggi";
  let inner;
  if (negative) inner = `<p class="remaining-text warn">${esc(v.texts.remaining)}</p>`;
  // Zero: il titolo «Non ti resta niente» basta; nella versione chiusa lo si ripete dentro.
  else if (v.plan.remaining === 0) inner = folded ? `<p class="remaining-text">${esc(v.texts.remainingTitle)}.</p>` : "";
  else inner = jarsHTML(v) + `<p class="remaining-text">${esc(capitalize(v.texts.remaining))}.</p>`;
  const body = $("#remaining-body");
  if (folded) {
    const wasOpen = !!body.querySelector("details[open]");
    body.innerHTML = `<details${wasOpen ? " open" : ""}><summary><h2 id="remaining-title">Tutto insieme, fino al giorno di paga</h2></summary>${inner}</details>`;
  } else {
    body.innerHTML = `<h2 id="remaining-title">${esc(v.texts.remainingTitle)}</h2>${inner}`;
  }
}

function renderDays(v) {
  const card = $("#days-card");
  card.hidden = v.rep !== "giorni" || v.plan.ended;
  if (card.hidden) return;
  $("#day-rows").innerHTML = v.dayRows.map((r, i) => `<li class="day-row${i === 0 ? " is-today" : ""}">
      <span class="day-name">${esc(r.name)}</span>
      ${decIcons(r.dec, "day-icons") || '<span class="day-icons"></span>'}
      <span class="day-text">${esc(r.text)}</span>
    </li>`).join("");
  $("#more-days").textContent = v.texts.moreDays;
}

function renderTools(v) {
  const sw = $("#btn-euro");
  sw.setAttribute("aria-checked", String(v.euro));
  $("#read-label").textContent = ui.reading ? "Ferma la lettura" : "Leggimelo";
}

function renderSpendGrid() {
  const units = chosenUnits(state);
  $("#spend-grid").innerHTML = units.map((u) => `<button type="button" class="spend-btn" data-spend="${u.id}">
      <span class="ic" aria-hidden="true">${u.icon}</span><span class="lbl">${esc(capitalize(u.one))}</span>${state.showEuro ? `<span class="eur">${esc(formatEuro(u.cents))}</span>` : ""}
    </button>`).join("") +
    `<button type="button" class="spend-btn other" id="btn-altro" aria-expanded="${ui.altroOpen}" aria-controls="altro">
      <span class="ic" aria-hidden="true">➕</span><span class="lbl">Altro</span>
    </button>`;
}

/* ---------- «Altro»: più oggetti insieme o una frase ---------- */

function stepperRow(u) {
  const n = ui.altro.get(u.id) || 0;
  return `<li class="stepper">
      <span class="ic" aria-hidden="true">${u.icon}</span>
      <span class="nm" id="st-${u.id}">${esc(capitalize(unitName(u)))}</span>
      <button type="button" class="btn icon" data-bump="${u.id}" data-delta="-1" aria-label="Togli ${esc(u.one)}"${n ? "" : " disabled"}>−</button>
      <span class="count" data-count-for="${u.id}" data-g="${u.g}" aria-live="polite">${esc(numberWord(n, u.g))}</span>
      <button type="button" class="btn icon" data-bump="${u.id}" data-delta="1" aria-label="Aggiungi ${esc(u.one)}">+</button>
    </li>`;
}

function renderAltro() {
  const panel = $("#altro");
  panel.hidden = false;
  $("#btn-altro")?.setAttribute("aria-expanded", "true");
  if (ui.altroBuilt) { updateAltroSum(); renderFreeResult(); return; }
  const mine = chosenUnits(state);
  const others = knownUnits(state).filter((u) => !mine.some((m) => m.id === u.id));
  panel.innerHTML = `
    <h2 id="altro-title" tabindex="-1">Altro</h2>
    <p class="hint">Scegli quante ne hai prese, anche più cose insieme.</p>
    <ul class="steppers">${mine.map(stepperRow).join("")}</ul>
    <details class="others"><summary>Altri oggetti</summary><ul class="steppers">${others.map(stepperRow).join("")}</ul></details>
    <p class="altro-sum" id="altro-sum" aria-live="polite"></p>
    <button type="button" class="btn primary wide" id="altro-save" disabled>Segna questa spesa</button>
    <div class="free">
      <label for="free-text">Oppure scrivilo con parole tue</label>
      <div class="row">
        <input id="free-text" type="text" maxlength="300" autocomplete="off" placeholder="per esempio: due caffè e un panino">
        <button type="button" class="btn icon" id="btn-dictate" aria-label="Dettalo a voce" hidden><span aria-hidden="true">🎤</span></button>
      </div>
      <button type="button" class="btn" id="free-go">Capisci la frase</button>
      <div id="free-result" aria-live="polite"></div>
    </div>
    <button type="button" class="btn link" id="altro-close">Chiudi</button>`;
  ui.altroBuilt = true;
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (Rec) $("#btn-dictate").hidden = false;
  updateAltroSum();
  renderFreeResult();
}

function altroItems() {
  return [...ui.altro.entries()].filter(([, n]) => n > 0).map(([unitId, count]) => ({ unitId, count }));
}

function updateAltroSum() {
  const items = altroItems();
  const sum = $("#altro-sum");
  if (!sum) return;
  if (!items.length) {
    sum.textContent = "Ancora niente.";
  } else {
    const clean = normalizeItems(items, knownUnits(state));
    const words = listPhrase(clean.map((it) => itemText(it, state)));
    const total = clean.reduce((s, x) => s + x.cents, 0);
    sum.textContent = `In tutto: ${words}${state.showEuro ? ` (${formatEuro(total)})` : ""}.`;
  }
  $("#altro-save").disabled = !items.length;
}

function bump(id, delta) {
  const n = Math.max(0, Math.min(20, (ui.altro.get(id) || 0) + delta));
  ui.altro.set(id, n);
  const out = $(`[data-count-for="${id}"]`);
  if (out) out.textContent = numberWord(n, out.dataset.g);
  const minus = $(`[data-bump="${id}"][data-delta="-1"]`);
  if (minus) {
    const hadFocus = document.activeElement === minus;
    minus.disabled = n === 0;
    if (hadFocus && n === 0) $(`[data-bump="${id}"][data-delta="1"]`).focus();
  }
  updateAltroSum();
}

function openAltro() {
  ui.altroOpen = true;
  renderAltro();
  $("#altro-title").focus();
}

function closeAltro() {
  ui.altroOpen = false;
  ui.altroBuilt = false;
  ui.altro.clear();
  ui.free = null;
  $("#altro").hidden = true;
  $("#altro").innerHTML = "";
  $("#btn-altro")?.setAttribute("aria-expanded", "false");
  $("#btn-altro")?.focus();
}

function sanitizeItems(items) {
  try { return normalizeItems((items || []).map((i) => ({ unitId: i.unitId, count: i.count, cents: i.cents, label: i.label })), knownUnits(state)); } catch { return []; }
}

async function interpretFree() {
  const input = $("#free-text");
  const text = input.value.trim().slice(0, 300);
  if (!text) { input.focus(); return; }
  let res = parseSpendText(text, knownUnits(state));
  let source = "regole";
  if ((res.unknown.length || !res.items.length) && ui.ai) {
    const btn = $("#free-go");
    btn.disabled = true;
    btn.textContent = "Ci penso…";
    try {
      const r = await fetch("/api/interpreta", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, units: state.setup.units }),
      });
      if (r.ok) {
        const data = await r.json();
        const items = sanitizeItems(data.items);
        if (items.length) {
          res = { items, unknown: data.notUnderstood ? [data.notUnderstood] : [] };
          source = "ai";
        }
      }
    } catch { /* senza rete restano le regole */ }
    btn.disabled = false;
    btn.textContent = "Capisci la frase";
  }
  ui.free = { text, items: sanitizeItems(res.items), unknown: res.unknown, source };
  renderFreeResult();
}

function renderFreeResult() {
  const box = $("#free-result");
  if (!box) return;
  const f = ui.free;
  if (!f) { box.innerHTML = ""; return; }
  const euro = state.showEuro;
  if (!f.items.length) {
    box.innerHTML = `<div class="free-card"><p>Non ho capito la spesa. Prova con parole semplici, come «due caffè e un panino», oppure usa i pulsanti qui sopra.</p></div>`;
    return;
  }
  const words = listPhrase(f.items.map((it) => itemText(it, state, { euro })));
  box.innerHTML = `<div class="free-card">
      <p><b>Ho capito:</b> ${esc(words)}.</p>
      ${f.unknown.length ? `<p class="muted">Non ho capito: «${esc(f.unknown.join(", "))}». Per quello usa i pulsanti.</p>` : ""}
      <p class="small muted">${f.source === "ai" ? "Frase letta con l'aiuto dell'AI. I conti li fa l'app." : "Frase letta dall'app, senza AI."}</p>
      <div class="row"><button type="button" class="btn primary" data-action="free-save">Sì, segna</button><button type="button" class="btn" data-action="free-cancel">No, lascia stare</button></div>
    </div>`;
}

function dictate() {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) return;
  try {
    const rec = new Rec();
    rec.lang = "it-IT";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      $("#free-text").value = e.results[0][0].transcript;
      announce("Ho scritto quello che hai detto. Premi «Capisci la frase».");
    };
    rec.onerror = () => announce("Non riesco ad ascoltare. Puoi scriverlo.");
    rec.start();
    announce("Ti ascolto.");
  } catch {
    announce("Non riesco ad ascoltare. Puoi scriverlo.");
  }
}

/* ---------- spese ---------- */

function addSpend(items, source) {
  const t = today();
  try {
    state = recordSpend(state, items, { dayISO: t, source });
  } catch {
    announce("Non riesco a segnare questa spesa.");
    return false;
  }
  // La domanda in sospeso era calcolata sui dati di prima: si rifà.
  if (state.pending) state = { ...state, pending: null };
  save();
  const last = state.spends[state.spends.length - 1];
  const text = `Segnato: ${spendText(last, state, { euro: state.showEuro })}.`;
  render();
  const v = buildView(state, t);
  showToast(text);
  announce(`${text} ${v.plan.remaining < 0 ? v.texts.remaining : `${v.texts.remainingTitle}: ${v.texts.remaining}.`}`);
  return true;
}

function undo() {
  const r = undoLast(state);
  if (!r.removed) { announce("Non ci sono spese da annullare."); return; }
  state = r.state;
  if (state.pending) state = { ...state, pending: null };
  save();
  hideToast();
  render();
  announce(`Annullato: ${spendText(r.removed, state, { euro: state.showEuro })}.`);
}

function showToast(text, withUndo = true) {
  const t = $("#toast");
  $("#toast-text").textContent = text;
  $("#toast-undo").hidden = !withUndo;
  t.hidden = false;
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(hideToast, 9000);
}

function hideToast() {
  clearTimeout(ui.toastTimer);
  const t = $("#toast");
  if (t.contains(document.activeElement)) $("#spend-title").focus?.();
  t.hidden = true;
}

function renderRecent(t) {
  const list = recentSpends(state, t);
  $("#recent").innerHTML = list.length
    ? list.map((s) => `<li><span class="ic" aria-hidden="true">${s.icon}</span><span class="what">${esc(s.text)}</span><span class="when">${esc(s.when)}</span></li>`).join("")
    : '<li class="muted">Ancora nessuna spesa in questo periodo.</li>';
  $("#btn-undo").disabled = !state.spends.length;
}

/* ---------- domande ---------- */

function questionIcons(q) {
  const combo = `<span class="run">${iconRun(q.combo.icon, q.combo.count)}</span>`;
  if (q.kind === "dopo") return `<div class="q-icons" aria-hidden="true"><span class="run">${q.item.icon}</span><span class="q-sep">→</span>${combo}</div>`;
  return `<div class="q-icons" aria-hidden="true">${combo}</div>`;
}

function renderCheck() {
  const box = $("#check");
  if (ui.feedback) {
    const f = ui.feedback;
    box.hidden = false;
    box.innerHTML = `
      <h2 id="check-title"><span aria-hidden="true">💬</span> Una domanda veloce</h2>
      <p class="q">${esc(f.question)}</p>
      <p class="feedback ${f.outcome}" id="check-feedback" tabindex="-1"><span class="fb-mark" aria-hidden="true">${f.outcome === "giusta" ? "✓" : "→"}</span> ${esc(f.text)}</p>
      ${f.note ? `<p class="adapt-note"><span aria-hidden="true">🔄</span> ${esc(f.note)}</p>` : ""}
      <button type="button" class="btn primary" data-action="feedback-ok">Ok</button>`;
    return;
  }
  const q = state.pending;
  if (!q) { box.hidden = true; box.innerHTML = ""; return; }
  box.hidden = false;
  box.innerHTML = `
    <h2 id="check-title"><span aria-hidden="true">💬</span> Una domanda veloce</h2>
    <p class="q" id="check-q" tabindex="-1">${esc(q.text)}</p>
    ${questionIcons(q)}
    <div class="answers" role="group" aria-labelledby="check-q">
      <button type="button" class="btn ans" data-answer="si">Sì</button>
      <button type="button" class="btn ans" data-answer="no">No</button>
      <button type="button" class="btn ans" data-answer="nonso">Non so</button>
    </div>
    <div class="row-between">
      <button type="button" class="btn link" data-action="read-question"><span aria-hidden="true">🔊</span> Leggimi la domanda</button>
      <button type="button" class="btn link" data-action="later">Non ora</button>
    </div>`;
}

function answer(a) {
  const q = state.pending;
  if (!q) return;
  const res = answerPending(state, a, { todayISO: today() });
  state = res.state;
  save();
  let note = "";
  if (res.decision.changed) note = `Da ora ti mostro i soldi così: «${REP_LABELS[res.decision.to]}». Puoi cambiarlo nelle impostazioni.`;
  else if (res.decision.reason === "funziona") note = `Questo modo sembra funzionare per te: «${REP_LABELS[state.rep]}».`;
  ui.feedback = { outcome: res.outcome, text: feedbackText(q, res.outcome), note, question: q.text };
  render();
  $("#check-feedback")?.focus();
}

function renderEvidence(t) {
  const e = evidenceView(state, t);
  const rows = e.rows.map((r) => `<li class="ev-row${r.current ? " current" : ""}">
      <span class="ev-label">${esc(r.label)}${r.current ? ' <span class="tag">in uso</span>' : ""}</span>
      <span class="marks" aria-hidden="true">${r.marks.map((m) => `<span class="mk ${m.outcome}">${m.mark}</span>`).join("")}</span>
      <span class="ev-text">${esc(r.text)}</span>
    </li>`).join("");
  $("#evidence-body").innerHTML = `
    <p class="hint">${esc(e.intro)}</p>
    <p class="totals"><b>${esc(e.totals)}</b></p>
    ${rows ? `<ul class="ev-rows">${rows}</ul>` : ""}
    ${e.empty ? "" : `<p class="best${e.bestRep ? " found" : ""}">${esc(e.best)}</p>`}
    ${e.timeline.length ? `<details><summary>Le risposte, una per una</summary><ol class="timeline">${e.timeline.map((x) => `<li><span class="mk ${x.outcome}" aria-hidden="true">${x.mark}</span> <span><b>${esc(x.when)}</b> · ${esc(x.rep)} · risposta ${esc(x.label)}<br><span class="muted">${esc(x.text)}</span></span></li>`).join("")}</ol></details>` : ""}
    ${e.changes.length ? `<details><summary>I cambi fatti</summary><ul class="changes">${e.changes.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></details>` : ""}`;
}

function renderSettings(v) {
  $("#rep-options").innerHTML = LADDER.map((rep) => `<label class="radio-row">
      <input type="radio" name="rep" value="${rep}"${rep === v.rep ? " checked" : ""}> <span>${esc(REP_LABELS[rep])}</span>
    </label>`).join("");
}

/* ---------- voce ---------- */

function speak(text) {
  const synth = window.speechSynthesis;
  if (!synth || typeof window.SpeechSynthesisUtterance === "undefined") {
    announce("La lettura ad alta voce non è disponibile su questo browser.");
    showToast("La lettura ad alta voce non è disponibile su questo browser.", false);
    return;
  }
  if (ui.reading) {
    synth.cancel();
    ui.reading = false;
    $("#read-label").textContent = "Leggimelo";
    return;
  }
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "it-IT";
    u.rate = 0.95;
    const voice = synth.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith("it"));
    if (voice) u.voice = voice;
    u.onend = u.onerror = () => { ui.reading = false; $("#read-label").textContent = "Leggimelo"; };
    synth.cancel();
    synth.speak(u);
    ui.reading = true;
    $("#read-label").textContent = "Ferma la lettura";
  } catch {
    announce("La lettura ad alta voce non è disponibile su questo browser.");
  }
}

/* ---------- avvio e eventi ---------- */

function render() {
  // Alcuni pulsanti vengono ricostruiti: se avevano il focus, lo ritrovano.
  const active = document.activeElement;
  const sel = active && active !== document.body
    ? (active.id ? `#${active.id}` : active.dataset && active.dataset.spend ? `[data-spend="${active.dataset.spend}"]` : null)
    : null;
  if (ui.mode === "setup" || !state) {
    ui.mode = "setup";
    renderSetup();
  } else {
    renderHome();
  }
  if (sel && !document.contains(active)) $(sel)?.focus();
}

function loadDemo() {
  if (state && !confirm("Sostituire i tuoi dati con l'esempio di Marco?")) return;
  state = marcoDemo(today());
  save();
  ui.mode = "home";
  ui.draft = null;
  ui.step = 1;
  ui.feedback = null;
  ui.orderRep = null;
  closeAltroSilently();
  render();
  $("#period-title").focus();
  announce("Ecco l'esempio di Marco.");
}

function closeAltroSilently() {
  ui.altroOpen = false;
  ui.altroBuilt = false;
  ui.altro.clear();
  ui.free = null;
  $("#altro").innerHTML = "";
}

function startSetup(fromState) {
  ui.mode = "setup";
  ui.draft = newDraft(fromState);
  ui.step = 1;
  ui.feedback = null;
  closeAltroSilently();
  hideToast();
  render();
  $("#step-title-1").focus();
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("button, [data-date]");
  if (!el || el.disabled) return;
  const d = el.dataset;

  // impostazione
  if (d.key) return pressKey(d.key);
  if (el.id === "step1-next") return showStep(2);
  if (el.id === "step2-back") return showStep(1);
  if (el.id === "step2-next") return showStep(3);
  if (el.id === "step3-back") return showStep(2);
  if (el.id === "step3-done") return finishSetup();
  if (el.id === "load-demo" || el.id === "btn-demo") return loadDemo();
  if (d.date) return choosePayday(d.date);
  if (d.quick) {
    ui.draft.monthly = true;
    ui.draft.payday = { type: "monthly", day: Number(d.quick) };
    ui.draft.paydayISO = nextPayday(today(), ui.draft.payday);
    const p = dateParts(ui.draft.paydayISO);
    ui.draft.cal = { y: p.y, m: p.m };
    renderStep2();
    el.focus();
    return;
  }
  if (el.id === "cal-prev" || el.id === "cal-next") {
    const c = ui.draft.cal;
    const idx = c.y * 12 + (c.m - 1) + (el.id === "cal-next" ? 1 : -1);
    ui.draft.cal = { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
    renderStep2();
    if (!el.disabled) el.focus(); else $(el.id === "cal-next" ? "#cal-prev" : "#cal-next").focus();
    return;
  }
  if (d.unitToggle) return toggleUnit(d.unitToggle);
  if (d.unitEdit) {
    ui.draft.editing = d.unitEdit;
    renderStep3();
    $(`#price-${d.unitEdit}`)?.select();
    $(`#price-${d.unitEdit}`)?.focus();
    return;
  }
  if (d.unitSave) return savePrice(d.unitSave);

  // schermata principale
  if (d.spend) return addSpend([{ unitId: d.spend, count: 1 }], "tocco");
  if (el.id === "btn-altro") return ui.altroOpen ? closeAltro() : openAltro();
  if (el.id === "altro-close") return closeAltro();
  if (d.bump) return bump(d.bump, Number(d.delta));
  if (el.id === "altro-save") {
    if (addSpend(altroItems(), "altro")) closeAltro();
    return;
  }
  if (el.id === "free-go") return void interpretFree();
  if (el.id === "btn-dictate") return dictate();
  if (d.action === "free-save") {
    if (ui.free && ui.free.items.length && addSpend(ui.free.items, ui.free.source === "ai" ? "frase-ai" : "frase")) closeAltro();
    return;
  }
  if (d.action === "free-cancel") {
    ui.free = null;
    renderFreeResult();
    $("#free-text").focus();
    return;
  }
  if (el.id === "btn-undo" || el.id === "toast-undo") return undo();
  if (el.id === "btn-read") return speak(buildView(state, today()).texts.summary);
  if (el.id === "btn-euro") {
    state = { ...state, showEuro: !state.showEuro };
    save();
    render();
    announce(state.showEuro ? "Ora vedi anche gli euro." : "Gli euro sono nascosti.");
    return;
  }
  if (d.answer) return answer(d.answer);
  if (d.action === "read-question") return speak(state.pending ? state.pending.text : "");
  if (d.action === "later") {
    state = postpone(state, today());
    save();
    render();
    $("#period-title").focus();
    announce("Va bene, te lo chiedo un'altra volta.");
    return;
  }
  if (d.action === "feedback-ok") {
    ui.feedback = null;
    render();
    $("#period-title").focus();
    return;
  }
  if (el.id === "btn-ask") return askNow();
  if (el.id === "btn-new-period" || d.action === "new-period") return startSetup(state);
  if (el.id === "btn-reset") {
    if (!confirm("Cancellare tutti i dati e ricominciare da capo?")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* niente */ }
    state = null;
    ui.orderRep = null;
    startSetup(null);
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "monthly") {
    ui.draft.monthly = e.target.checked;
    if (ui.draft.paydayISO) choosePayday(ui.draft.paydayISO);
    else renderStep2();
    e.target.focus();
    return;
  }
  if (e.target.name === "rep") {
    const t = today();
    state = { ...chooseRepresentation(state, e.target.value, { todayISO: t }), pending: null };
    ui.feedback = null;
    save();
    render();
    $(`input[name="rep"][value="${e.target.value}"]`)?.focus();
    announce(`Ora vedi i soldi così: ${REP_LABELS[state.rep]}.`);
  }
});

document.addEventListener("keydown", (e) => {
  // Tastierino anche da tastiera fisica, al primo passo.
  if (ui.mode === "setup" && ui.step === 1 && !e.target.matches("input, textarea") && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (/^\d$/.test(e.key)) { pressKey(e.key); e.preventDefault(); }
    else if (e.key === "," || e.key === ".") { pressKey(","); e.preventDefault(); }
    else if (e.key === "Backspace") { pressKey("back"); e.preventDefault(); }
    else if (e.key === "Enter" && !e.target.matches("button") && typedCents(ui.draft.amount) > 0) { showStep(2); e.preventDefault(); }
  }
  if (e.key === "Enter" && e.target.id === "free-text") { e.preventDefault(); interpretFree(); }
  if (e.key === "Enter" && e.target.id && e.target.id.startsWith("price-")) { e.preventDefault(); savePrice(e.target.id.slice(6)); }
  if (e.key === "Escape" && e.target.id && e.target.id.startsWith("price-")) {
    const id = e.target.id.slice(6);
    ui.draft.editing = null;
    renderStep3();
    $(`[data-unit-toggle="${id}"]`)?.focus();
  }
});

// A mezzanotte cambia il giorno: quando si torna sull'app si ricalcola tutto.
document.addEventListener("visibilitychange", () => { if (!document.hidden && ui.mode === "home" && state) render(); });

if (fixedToday) {
  const b = $("#date-badge");
  b.hidden = false;
  b.textContent = `Data di prova: ${dateWords(fixedToday)}`;
}

if (params.get("demo") === "marco") {
  state = marcoDemo(today());
  save();
  ui.mode = "home";
  params.delete("demo");
  history.replaceState(null, "", location.pathname + (params.toString() ? `?${params}` : ""));
}

// Le voci della sintesi vocale si caricano in ritardo: si chiede l'elenco subito.
try { window.speechSynthesis?.getVoices(); } catch { /* niente voce: «Leggimelo» lo dirà */ }

fetch("/api/health").then((r) => r.json()).then((h) => { ui.ai = !!h.ai; }).catch(() => { ui.ai = false; });

render();
