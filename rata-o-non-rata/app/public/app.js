/*
 * Rata o non rata: interfaccia.
 *
 * Tutta la logica (lettura delle email, calendario, quote, simulazione, quiz)
 * sta nei moduli di ./lib, condivisi con i test. Qui ci sono solo stato,
 * disegno della pagina ed eventi. I testi delle email vengono sempre inseriti
 * come testo (textContent), mai come HTML.
 */
import { SAMPLE_EMAILS, SAMPLE_TODAY, UNKNOWN_SAMPLE } from "./lib/samples.js";
import { parseEmail, splitEmails, purchaseId, KNOWN_PROVIDERS, FIELD_LABELS } from "./lib/parsers.js";
import {
  buildSchedule, aggregateByMonth, monthSummary, nextMonthKey, upcoming, providerOrder,
  splitAmounts, frequencyLabel, sum, isComplete,
} from "./lib/schedule.js";
import { monthNotes, thresholdAmount, whatIf, whatIfSentence, normalizeThreshold, incomeFor, share, formatPercent } from "./lib/insights.js";
import { buildQuiz, scoreQuiz } from "./lib/quiz.js";
import { buildGlossary } from "./lib/glossary.js";
import { parseAmount, formatEuro, formatEuroShort } from "./lib/money.js";
import {
  todayIso, isValidIso, monthKey, monthLabel, monthShort, formatDateLong, withArticle, diffDays, parts, MONTHS, addDays,
} from "./lib/dates.js";

// ---- Data di riferimento ----------------------------------------------------

const params = new URLSearchParams(location.search);
const TODAY = isValidIso(params.get("oggi")) ? params.get("oggi") : todayIso();
const REF_YEAR = Number(TODAY.slice(0, 4));
const CURRENT = monthKey(TODAY);
const NEXT = nextMonthKey(TODAY);
const WEEKDAYS = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const weekday = (iso) => WEEKDAYS[new Date(iso + "T00:00:00Z").getUTCDay()];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// ---- Colori: seguono il servizio, non la posizione --------------------------

const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const KNOWN = ["Pago3", "Rateo", "DividiPay", "ElettroCasa"];
function colorMap(providers) {
  const map = {};
  let extra = KNOWN.length;
  for (const p of providers) {
    const k = KNOWN.indexOf(p);
    map[p] = k >= 0 ? PALETTE[k] : PALETTE[extra++] || "#8a8494";
  }
  return map;
}

// ---- Piccoli aiuti per il DOM -----------------------------------------------

const $ = (sel) => document.querySelector(sel);
function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : String(k));
  }
}
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "text") el.textContent = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  append(el, kids);
  return el;
}
const SVGNS = "http://www.w3.org/2000/svg";
function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === "text") el.textContent = v;
    else el.setAttribute(k, v);
  }
  append(el, kids);
  return el;
}
function announce(msg) {
  const live = $("#live");
  live.textContent = "";
  setTimeout(() => { live.textContent = msg; }, 60);
}
const plainAmount = (cents) => (cents == null ? "" : `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}`);

// ---- Stato e salvataggio locale ---------------------------------------------

const STORE = "rata-o-non-rata:v1";
const state = {
  purchases: [],
  income: null,
  overrides: {},
  thrChoice: "",
  thrCustom: "",
  attempts: [],
  reads: [],
  sim: null,
  quizAnswers: {},
  quizChecked: null,
};
let aiAvailable = false;
let readSeq = 0;
let manualPrefill = null;

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE) || "{}");
    if (Array.isArray(d.purchases)) state.purchases = d.purchases.filter(isComplete);
    if (Number.isInteger(d.income) && d.income > 0) state.income = d.income;
    if (d.overrides && typeof d.overrides === "object") {
      for (const [k, v] of Object.entries(d.overrides)) if (/^\d{4}-\d{2}$/.test(k) && Number.isInteger(v) && v > 0) state.overrides[k] = v;
    }
    if (["", "10", "20", "30", "custom"].includes(d.thrChoice)) state.thrChoice = d.thrChoice;
    if (typeof d.thrCustom === "string") state.thrCustom = d.thrCustom.slice(0, 5);
    if (Array.isArray(d.attempts)) state.attempts = d.attempts.filter((a) => Number.isInteger(a?.score)).slice(-10);
  } catch { /* dati locali illeggibili: si riparte da zero */ }
}
function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({
      purchases: state.purchases, income: state.income, overrides: state.overrides,
      thrChoice: state.thrChoice, thrCustom: state.thrCustom, attempts: state.attempts,
    }));
  } catch { /* spazio pieno o modalità privata: l'app funziona lo stesso */ }
}
const threshold = () => normalizeThreshold(state.thrChoice === "custom" ? state.thrCustom : state.thrChoice);

function addPurchase(p) {
  if (!isComplete(p)) return "incompleto";
  if (state.purchases.some((x) => x.id === p.id)) return "gia_presente";
  state.purchases.push(p);
  return "aggiunto";
}

// ---- Schede (tab) -------------------------------------------------------------

const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab, { focus = true } = {}) {
  for (const t of tabs) {
    const sel = t === tab;
    t.setAttribute("aria-selected", String(sel));
    t.tabIndex = sel ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !sel;
  }
  if (focus) tab.focus();
  history.replaceState(null, "", `${location.search}#${tab.id.slice(4)}`);
}
const goTo = (id, opts) => selectTab(document.getElementById(id), opts);
tabs.forEach((t, i) => {
  t.addEventListener("click", () => selectTab(t));
  t.addEventListener("keydown", (e) => {
    const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (k === undefined) return;
    e.preventDefault();
    selectTab(tabs[(k + tabs.length) % tabs.length]);
  });
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-goto]");
  if (b) goTo(b.dataset.goto);
});

// ---- 1 · Lettura delle email ------------------------------------------------

const ORIGIN_LABEL = {
  pago3: "letta con il formato di Pago3",
  rateo: "letta con il formato di Rateo",
  dividipay: "letta con il formato di DividiPay",
  elettrocasa: "letta con il formato di ElettroCasa",
  generico: "letta con regole generiche",
  ai: "letta con l'AI, valori verificati nell'email",
  manuale: "inserita a mano",
};
const ORIGIN_SOURCE = {
  pago3: "email di Pago3, letta con il formato dedicato",
  rateo: "email di Rateo, letta con il formato dedicato",
  dividipay: "email di DividiPay, letta con il formato dedicato",
  elettrocasa: "email di ElettroCasa, letta con il formato dedicato",
  generico: "email letta con regole generiche",
  ai: "email letta con l'AI, valori verificati nel testo",
  manuale: "dati inseriti o corretti a mano",
};
// Nomi dei campi dentro una frase ("manca il totale", "l'AI ha proposto … come data della prima rata").
const FIELD_NAMES = {
  provider: "servizio", merchant: "acquisto", total: "totale", count: "numero di rate",
  installmentAmount: "importo della rata", firstDate: "data della prima rata", frequency: "frequenza", lateFee: "frase sui ritardi",
};

function readEmails(texts) {
  const out = { added: 0, dup: 0, check: 0, missing: 0 };
  for (const { text, label } of texts) {
    const result = parseEmail(text);
    const read = { rid: `r${++readSeq}`, label, result, added: null, ai: null };
    if (result.status === "riconosciuta") {
      read.added = addPurchase(result.purchase);
      if (read.added === "aggiunto") out.added++; else out.dup++;
    } else if (result.status === "da_controllare") out.check++;
    else out.missing++;
    state.reads.push(read);
  }
  save();
  renderAll();
  const msg = [`${plural(texts.length, "email letta", "email lette")}.`];
  if (out.added) msg.push(`${plural(out.added, "acquisto aggiunto", "acquisti aggiunti")} al calendario.`);
  if (out.dup) msg.push(`${plural(out.dup, "era già", "erano già")} nel calendario.`);
  if (out.check) msg.push(`${plural(out.check, "email da controllare", "email da controllare")}.`);
  if (out.missing) msg.push(`${plural(out.missing, "email incompleta", "email incomplete")}.`);
  announce(msg.join(" "));
  return out;
}

$("#load-samples").addEventListener("click", () => {
  readEmails(SAMPLE_EMAILS.map((e) => ({ text: e.text, label: e.label })));
  $("#read-results").querySelector(".next-step")?.querySelector("h3")?.focus();
});
$("#load-unknown").addEventListener("click", () => {
  $("#paste-text").value = UNKNOWN_SAMPLE;
  readEmails([{ text: UNKNOWN_SAMPLE, label: "Email di PagaPoi" }]);
  document.getElementById(`${state.reads[state.reads.length - 1].rid}-t`)?.focus();
});
$("#paste-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const chunks = splitEmails($("#paste-text").value);
  if (!chunks.length) {
    announce("Il campo è vuoto: incolla prima il testo di un'email.");
    $("#paste-text").focus();
    return;
  }
  readEmails(chunks.map((text, i) => ({ text, label: `Email incollata ${i + 1}` })));
  document.getElementById(`${state.reads[state.reads.length - chunks.length].rid}-t`)?.focus();
});

function valueText(field, v) {
  if (v == null || v === "") return "—";
  if (field === "total" || field === "installmentAmount") return formatEuro(v);
  if (field === "firstDate") return formatDateLong(v);
  if (field === "frequency") return frequencyLabel(v);
  if (field === "count") return String(v);
  return String(v);
}

/** Tabella "valore estratto | frase dell'email": semplificare senza tradire. */
function sourcesTable(p, caption) {
  const fields = ["provider", "merchant", "total", "count", "installmentAmount", "firstDate", "frequency", "lateFee"];
  const rows = fields.filter((f) => p[f] != null && p[f] !== "" && !(f === "provider" && p[f] === "Altro servizio") && !(f === "merchant" && p[f] === "Acquisto"));
  return h("div", { class: "table-scroll" },
    h("table", { class: "src-table" },
      h("caption", { class: "sr-only" }, caption),
      h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Dato"), h("th", { scope: "col" }, "Valore"), h("th", { scope: "col" }, "Frase dell'email"))),
      h("tbody", {}, rows.map((f) => h("tr", {},
        h("th", { scope: "row" }, FIELD_LABELS[f]),
        h("td", { class: "val" }, f === "lateFee" ? "come scritto →" : valueText(f, p[f])),
        h("td", {}, p.sources?.[f] ? h("q", { class: "src" }, p.sources[f]) : h("span", { class: "muted" }, "inserito a mano")),
      )))));
}

function statusInfo(read) {
  const { result } = read;
  const p = result.purchase;
  const missing = (result.missing || []).map((f) => FIELD_NAMES[f]).join(", ");
  switch (result.status) {
    case "riconosciuta":
      return { badge: "Letta", cls: "ok", text: `${cap(ORIGIN_LABEL[p.origin])}. ${read.added === "gia_presente" ? "Era già nel calendario." : "Aggiunta al calendario."}` };
    case "da_controllare":
      if (read.added === "aggiunto") return { badge: "Aggiunta", cls: "ok", text: "Aggiunta al calendario dopo il tuo controllo." };
      if (read.added === "gia_presente") return { badge: "Letta", cls: "ok", text: "Era già nel calendario." };
      return result.parser === "ai"
        ? { badge: "Da controllare", cls: "check", text: "Letta con l'AI. Ogni valore qui sotto è stato ritrovato nel testo dell'email: controllalo prima di aggiungerlo." }
        : { badge: "Da controllare", cls: "check", text: "Non conosciamo questo formato: i dati sono stati trovati con regole generiche. Controllali prima di aggiungerli." };
    case "incompleta":
      return { badge: "Incompleta", cls: "check", text: `Mancano: ${missing}.` };
    default:
      return { badge: "Non letta", cls: "none", text: "Non abbiamo trovato i dati di un acquisto a rate." };
  }
}

function readCard(read) {
  const { result } = read;
  const p = result.purchase;
  const info = statusInfo(read);
  const title = [p.provider !== "Altro servizio" ? p.provider : null, p.merchant !== "Acquisto" ? p.merchant : null].filter(Boolean).join(" · ") || read.label;
  const summary = isComplete(p)
    ? `${formatEuro(p.total)} in ${plural(p.count, "rata", "rate")}, ${frequencyLabel(p.frequency)}, ${withArticle(p.firstDate, REF_YEAR, "dal")}.`
    : null;
  const actions = h("div", { class: "actions" });
  const pending = result.status !== "riconosciuta" && read.added !== "aggiunto" && read.added !== "gia_presente";
  if (result.status === "da_controllare" && pending) {
    actions.append(h("button", { type: "button", class: "btn primary", onclick: () => {
      read.added = addPurchase(p);
      save(); renderAll();
      announce(read.added === "aggiunto" ? `${title}: aggiunto al calendario.` : `${title}: era già nel calendario.`);
      document.getElementById(`${read.rid}-t`)?.focus();
    } }, "Aggiungi al calendario"));
  }
  if ((result.status === "incompleta" || result.status === "non_riconosciuta") && result.parser !== "ai" && aiAvailable) {
    actions.append(h("button", { type: "button", class: "btn primary", disabled: read.ai === "loading" || null, "aria-busy": read.ai === "loading" ? "true" : null, onclick: () => tryAi(read) },
      read.ai === "loading" ? "Lettura con l'AI in corso…" : "Prova a leggerla con l'AI"));
  }
  if (pending) {
    actions.append(h("button", { type: "button", class: "btn", onclick: () => openManual(p, "", read) },
      result.status === "da_controllare" ? "Correggi a mano" : "Completa a mano"));
  }
  if ((read.added === "aggiunto" || read.added === "gia_presente") && result.status !== "riconosciuta") {
    actions.append(h("button", { type: "button", class: "btn", "data-goto": "tab-cal" }, "Vai al calendario"));
  }

  const rejected = result.rejected?.length
    ? h("div", { class: "rejected" },
      h("p", {}, h("b", {}, "Valori scartati dal controllo:")),
      h("ul", {}, result.rejected.map((r) => h("li", {}, `L'AI ha proposto «${r.value}» come ${FIELD_NAMES[r.field] || r.field}: ${r.reason}, quindi non lo usiamo.`))))
    : null;
  const aiError = read.ai && read.ai.error
    ? h("p", { class: "notice" }, `La lettura con l'AI non è riuscita (${read.ai.error}). Puoi completare a mano.`)
    : null;
  const noAi = (result.status === "incompleta" || result.status === "non_riconosciuta") && !aiAvailable && result.parser !== "ai"
    ? h("p", { class: "hint" }, "La lettura con l'AI non è attiva su questo computer: puoi completare a mano, con i valori già trovati.")
    : null;
  const hasSources = Object.keys(p.sources || {}).length > 0;

  return h("article", { class: `read card status-${info.cls}`, "aria-labelledby": `${read.rid}-t` },
    h("div", { class: "read-head" },
      h("span", { class: `badge ${info.cls}` }, info.badge),
      h("h3", { id: `${read.rid}-t`, tabindex: "-1" }, title)),
    summary ? h("p", { class: "read-sum" }, summary) : null,
    h("p", {}, info.text),
    result.note ? h("p", { class: "hint" }, `Nota dell'estrazione: ${result.note}`) : null,
    rejected,
    aiError,
    hasSources ? h("details", { class: "src-details", open: result.status !== "riconosciuta" || null },
      h("summary", {}, "Cosa abbiamo letto, frase per frase"),
      sourcesTable(p, `Valori letti dall'email ${title}`)) : null,
    noAi,
    actions.childNodes.length ? actions : null);
}

function renderReads() {
  const box = $("#read-results");
  box.replaceChildren();
  if (!state.reads.length) return;
  const added = state.reads.filter((r) => r.added === "aggiunto" || r.added === "gia_presente").length;
  const sampleGap = Math.abs(diffDays(SAMPLE_TODAY, TODAY));
  box.append(h("div", { class: "card next-step" },
    h("h3", { tabindex: "-1" }, `${plural(state.reads.length, "email letta", "email lette")}, ${plural(added, "acquisto", "acquisti")} nel calendario`),
    h("p", {}, "Prima di aprire il calendario: sai quanto paghi di rate il mese prossimo? Prova il quiz a memoria, poi rifallo dopo."),
    sampleGap > 60 && state.reads.some((r) => r.label?.includes("·"))
      ? h("p", { class: "hint" }, `Le email di esempio sono di settembre e ottobre 2026. Per vederle come nella demo apri l'app con ?oggi=${SAMPLE_TODAY} nell'indirizzo.`)
      : null,
    h("div", { class: "actions" },
      h("button", { type: "button", class: "btn primary", "data-goto": "tab-cal" }, "Vai al calendario"),
      h("button", { type: "button", class: "btn", "data-goto": "tab-learn" }, "Prova il quiz a memoria"))));
  for (const r of state.reads) box.append(readCard(r));
}

async function tryAi(read) {
  read.ai = "loading";
  renderReads();
  announce("Lettura con l'AI in corso.");
  try {
    const r = await fetch("/api/extract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: read.result.purchase.emailText }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.purchase) {
      read.ai = { error: data.reason || data.error || `errore ${r.status}` };
    } else {
      data.purchase.emailText = read.result.purchase.emailText;
      read.result = data;
      read.ai = null;
    }
  } catch {
    read.ai = { error: "il server non risponde" };
  }
  renderReads();
  const st = statusInfo(read);
  announce(read.ai?.error ? `La lettura con l'AI non è riuscita. ${read.ai.error}.` : `${st.badge}. ${st.text}`);
  document.getElementById(`${read.rid}-t`)?.focus();
}

// ---- Modulo "Aggiungi a mano" -----------------------------------------------

const M = (id) => document.getElementById(`m-${id}`);
function setErr(input, errEl, msg) {
  errEl.textContent = msg || "";
  if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
}

function openManual(p, replaceId = "", read = null) {
  manualPrefill = { ...p, rid: read?.rid || null };
  $("#manual-box").open = true;
  M("provider").value = p.provider && p.provider !== "Altro servizio" ? p.provider : "";
  M("merchant").value = p.merchant && p.merchant !== "Acquisto" ? p.merchant : "";
  M("total").value = plainAmount(p.total);
  M("count").value = p.count ?? "";
  M("frequency").value = p.frequency || "mensile";
  M("first").value = p.firstDate || "";
  M("rata").value = plainAmount(p.installmentAmount);
  M("replace").value = replaceId;
  M("submit").textContent = replaceId ? "Salva la correzione" : "Aggiungi al calendario";
  goTo("tab-email", { focus: false });
  const firstEmpty = [M("total"), M("count"), M("first")].find((i) => !i.value) || M("provider");
  $("#manual-box").scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  firstEmpty.focus();
  announce(replaceId ? "Modulo aperto per correggere l'acquisto." : "Modulo aperto con i valori già trovati.");
}

$("#manual-form").addEventListener("reset", () => {
  manualPrefill = null;
  setTimeout(() => {
    M("replace").value = "";
    M("submit").textContent = "Aggiungi al calendario";
    for (const id of ["provider", "merchant", "total", "count", "first", "rata"]) setErr(M(id), M(`${id}-err`), "");
  });
});

$("#manual-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const total = parseAmount(M("total").value);
  const count = Number(M("count").value);
  const first = M("first").value;
  const rataRaw = M("rata").value.trim();
  const rata = rataRaw ? parseAmount(rataRaw) : null;
  const errors = [];
  const check = (id, ok, msg) => { setErr(M(id), M(`${id}-err`), ok ? "" : msg); if (!ok) errors.push(M(id)); };
  check("total", total != null && total > 0, "Scrivi il totale in euro, per esempio 89,90.");
  check("count", Number.isInteger(count) && count >= 1 && count <= 60, "Scrivi un numero di rate da 1 a 60.");
  check("first", isValidIso(first), "Scegli la data della prima rata.");
  check("rata", !rataRaw || (rata != null && rata > 0 && (total == null || rata <= total)), "L'importo della rata non è leggibile o è più grande del totale.");
  if (errors.length) {
    errors[0].focus();
    announce(`Il modulo ha ${plural(errors.length, "campo da sistemare", "campi da sistemare")}.`);
    return;
  }
  const pre = manualPrefill || {};
  const p = {
    provider: M("provider").value.trim().slice(0, 60) || "Altro servizio",
    merchant: M("merchant").value.trim().slice(0, 80) || "Acquisto",
    kind: pre.kind || "bnpl",
    total, count, installmentAmount: rata, firstDate: first,
    frequency: M("frequency").value,
    lateFee: pre.lateFee || null,
    sources: {},
    origin: "manuale",
  };
  // Le frasi dell'email restano solo per i valori che non sono stati cambiati.
  for (const f of ["provider", "merchant", "total", "count", "installmentAmount", "firstDate", "frequency", "lateFee"]) {
    if (pre.sources?.[f] && pre[f] === p[f]) p.sources[f] = pre.sources[f];
  }
  if (pre.emailText) p.emailText = pre.emailText;
  p.id = purchaseId(p);
  const replaceId = M("replace").value;
  if (replaceId) state.purchases = state.purchases.filter((x) => x.id !== replaceId);
  const res = addPurchase(p);
  if (pre.rid) {
    const read = state.reads.find((r) => r.rid === pre.rid);
    if (read) read.added = res;
  }
  save();
  $("#manual-form").reset();
  $("#manual-box").open = false;
  renderAll();
  announce(res === "aggiunto" ? `${p.merchant}: ${replaceId ? "correzione salvata" : "aggiunto al calendario"}.` : `${p.merchant}: era già nel calendario.`);
  goTo("tab-cal");
});

// ---- 2 · Calendario -----------------------------------------------------------

function niceScale(maxCents) {
  const steps = [1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 500000, 1000000];
  const step = steps.find((st) => Math.ceil(maxCents / st) <= 5) || 2000000;
  return { step, max: Math.max(step, Math.ceil(maxCents / step) * step) };
}

const tooltip = $("#tooltip");
function showTooltip(e, nodes) {
  tooltip.replaceChildren(...nodes);
  tooltip.hidden = false;
  const pad = 14;
  const w = tooltip.offsetWidth;
  const hgt = tooltip.offsetHeight;
  let x = e.clientX + pad;
  let y = e.clientY + pad;
  if (x + w > innerWidth - 8) x = e.clientX - w - pad;
  if (y + hgt > innerHeight - 8) y = e.clientY - hgt - pad;
  tooltip.style.left = `${Math.max(8, x)}px`;
  tooltip.style.top = `${Math.max(8, y)}px`;
}
const hideTooltip = () => { tooltip.hidden = true; };
addEventListener("keydown", (e) => { if (e.key === "Escape") hideTooltip(); });
addEventListener("scroll", hideTooltip, { passive: true });

/**
 * Grafico a colonne impilate, una colonna per mese, un colore per servizio.
 * Accessibile: SVG con titolo e descrizione, legenda testuale e tabella con
 * tutti i numeri. La simulazione è a righe, con il bordo tratteggiato.
 */
function renderChart(container, { months, purchases, ghost = null, idPrefix }) {
  container.replaceChildren();
  const providers = providerOrder(purchases, KNOWN);
  const colors = colorMap(providers);
  const thr = threshold();
  const thrLine = thresholdAmount(state.income, thr);
  const hasGhost = ghost && [...ghost.values()].some((v) => v > 0);

  container.append(h("ul", { class: "legend" },
    providers.map((p) => h("li", {}, h("span", { class: "sw", style: { background: colors[p] }, "aria-hidden": "true" }), p)),
    hasGhost ? h("li", {}, h("span", { class: "sw ghost", "aria-hidden": "true" }), "Simulazione") : null,
    thrLine ? h("li", {}, h("span", { class: "sw line", "aria-hidden": "true" }), `Il tuo avviso (${thr}%)`) : null));

  const band = 58, barW = 24, left = 58, right = 18, top = 34, plotH = 210, bottom = 50, GAP = 2;
  const W = left + months.length * band + right;
  const H = top + plotH + bottom;
  const totals = months.map((m) => m.total + (ghost?.get(m.key) || 0));
  const { step, max } = niceScale(Math.max(...totals, thrLine || 0, 1));
  const y = (v) => top + plotH - (v / max) * plotH;
  const maxIdx = totals.indexOf(Math.max(...totals));
  const nextIdx = months.findIndex((m) => m.key === NEXT);
  const realMax = months.reduce((a, m) => (m.total > a.total ? m : a), months[0]);
  const nextM = months[nextIdx];

  const svg = s("svg", {
    viewBox: `0 0 ${W} ${H}`, class: "chart-svg", role: "img", "aria-labelledby": `${idPrefix}-t ${idPrefix}-d`,
    preserveAspectRatio: "xMinYMin meet",
  });
  svg.style.minWidth = `${Math.round(W * 0.82)}px`;
  svg.style.maxWidth = `${Math.round(W * 1.5)}px`;
  svg.append(
    s("title", { id: `${idPrefix}-t`, text: "Rate per mese e per servizio" }),
    s("desc", { id: `${idPrefix}-d`, text:
      `Grafico a colonne impilate, da ${monthLabel(months[0].key)} a ${monthLabel(months[months.length - 1].key)}. `
      + `Il mese con più rate è ${monthLabel(realMax.key)}, con ${formatEuro(realMax.total)}. `
      + (nextM ? `Il mese prossimo, ${monthLabel(NEXT)}: ${formatEuro(nextM.total)}. ` : "")
      + (hasGhost ? "Le parti a righe sono la simulazione. " : "")
      + "Tutti i numeri sono nella tabella sotto il grafico." }),
    s("defs", {}, s("pattern", { id: `${idPrefix}-hatch`, patternUnits: "userSpaceOnUse", width: 6, height: 6, patternTransform: "rotate(45)" },
      s("rect", { width: 6, height: 6, fill: "#f1e4ff" }),
      s("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: "#7500C0", "stroke-width": 2.2 }))));

  if (nextIdx >= 0) {
    svg.append(s("rect", { x: left + nextIdx * band + 3, y: top - 22, width: band - 6, height: plotH + 22, rx: 10, class: "next-band" }));
  }
  for (let v = 0; v <= max; v += step) {
    svg.append(s("line", { x1: left, x2: W - right, y1: y(v), y2: y(v), class: v === 0 ? "axis" : "grid" }));
    svg.append(s("text", { x: left - 10, y: y(v) + 4, class: "tick", "text-anchor": "end", text: formatEuroShort(v) }));
  }

  months.forEach((m, i) => {
    const x = left + i * band + (band - barW) / 2;
    const segs = providers.filter((p) => m.byProvider[p]).map((p) => ({ p, v: m.byProvider[p], fill: colors[p] }));
    const g = ghost?.get(m.key);
    if (g > 0) segs.push({ p: "Simulazione", v: g, ghost: true });
    let acc = 0;
    segs.forEach((sg, j) => {
      const y0 = y(acc) - (j > 0 ? GAP : 0);
      const y1 = y(acc + sg.v);
      acc += sg.v;
      const hh = Math.max(y0 - y1, 1);
      const attrs = sg.ghost
        ? { fill: `url(#${idPrefix}-hatch)`, stroke: "#7500C0", "stroke-width": 1.5, "stroke-dasharray": "4 3" }
        : { fill: sg.fill };
      if (j === segs.length - 1) {
        const r = Math.min(4, hh / 2, barW / 2);
        const yb = y1 + hh;
        svg.append(s("path", { d: `M${x},${yb} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + barW - r} Q${x + barW},${y1} ${x + barW},${y1 + r} V${yb} Z`, ...attrs }));
      } else {
        svg.append(s("rect", { x, y: y1, width: barW, height: hh, ...attrs }));
      }
    });
    if ((i === nextIdx || i === maxIdx) && totals[i] > 0) {
      svg.append(s("text", { x: x + barW / 2, y: y(totals[i]) - 8, class: "val", "text-anchor": "middle", text: formatEuroShort(totals[i]) }));
    }
    svg.append(s("text", { x: x + barW / 2, y: top + plotH + 20, class: `xl${i === nextIdx ? " strong" : ""}`, "text-anchor": "middle", text: monthShort(m.key, REF_YEAR) }));
    if (i === nextIdx) svg.append(s("text", { x: x + barW / 2, y: top + plotH + 38, class: "xs", "text-anchor": "middle", text: "prossimo" }));
    svg.append(s("rect", { x: left + i * band, y: top - 22, width: band, height: plotH + 22, class: "hit", "data-i": i }));
  });

  if (thrLine) {
    svg.append(s("line", { x1: left, x2: W - right, y1: y(thrLine), y2: y(thrLine), class: "thr" }));
    svg.append(s("text", { x: W - right, y: y(thrLine) - 6, class: "thr-l", "text-anchor": "end", text: `avviso ${thr}% · ${formatEuroShort(thrLine)}` }));
  }

  svg.addEventListener("pointermove", (e) => {
    const hit = e.target.closest?.(".hit");
    if (!hit) return hideTooltip();
    const m = months[Number(hit.dataset.i)];
    const g = ghost?.get(m.key) || 0;
    const inc = incomeFor(m.key, state.income, state.overrides);
    const pct = share(m.total + g, inc);
    showTooltip(e, [
      h("p", { class: "tt-h" }, cap(monthLabel(m.key))),
      h("ul", {}, providers.filter((p) => m.byProvider[p]).map((p) => h("li", {}, h("span", { class: "sw", style: { background: colors[p] } }), `${p}: ${formatEuro(m.byProvider[p])}`)),
        g ? h("li", {}, h("span", { class: "sw ghost" }), `Simulazione: ${formatEuro(g)}`) : null),
      h("p", { class: "tt-t" }, `In tutto: ${formatEuro(m.total + g)} · ${plural(m.count, "rata", "rate")}${g ? " + simulazione" : ""}`),
      pct != null ? h("p", { class: "tt-p" }, `${formatPercent(pct, thr)} di quello che entra`) : null,
    ]);
  });
  svg.addEventListener("pointerleave", hideTooltip);

  if (hasGhost && idPrefix === "cal") {
    container.append(h("p", { class: "hint" }, "Nel grafico c'è anche l'acquisto simulato in «E se…?», a righe: non è tra i tuoi acquisti."));
  }
  container.append(h("div", { class: "chart-scroll" }, svg));
  container.append(chartTable(months, providers, colors, ghost, hasGhost, idPrefix));
}

function chartTable(months, providers, colors, ghost, hasGhost, idPrefix) {
  const thr = threshold();
  const withIncome = !!state.income;
  const head = ["Mese", ...providers, ...(hasGhost ? ["Simulazione"] : []), "Totale", ...(withIncome ? ["Quota su quello che entra"] : []), ...(withIncome && thr ? ["Sopra il tuo avviso"] : [])];
  const totalsBy = Object.fromEntries(providers.map((p) => [p, sum(months.map((m) => m.byProvider[p] || 0))]));
  const ghostTot = hasGhost ? sum(months.map((m) => ghost.get(m.key) || 0)) : 0;
  const rows = months.map((m) => {
    const g = hasGhost ? ghost.get(m.key) || 0 : 0;
    const inc = incomeFor(m.key, state.income, state.overrides);
    const pct = withIncome ? share(m.total + g, inc) : null;
    return h("tr", { class: m.key === NEXT ? "is-next" : null },
      h("th", { scope: "row" }, cap(monthLabel(m.key)), m.key === NEXT ? h("span", { class: "tag" }, "prossimo") : null),
      providers.map((p) => h("td", {}, m.byProvider[p] ? formatEuro(m.byProvider[p]) : "—")),
      hasGhost ? h("td", {}, g ? formatEuro(g) : "—") : null,
      h("td", { class: "tot" }, formatEuro(m.total + g)),
      withIncome ? h("td", {}, pct == null ? "—" : formatPercent(pct, thr)) : null,
      withIncome && thr ? h("td", {}, pct != null && pct > thr ? "sì" : "no") : null);
  });
  return h("details", { class: "table-details" },
    h("summary", {}, "Vedi i numeri in tabella"),
    h("div", { class: "table-scroll" },
      h("table", { class: "num-table", id: `${idPrefix}-table` },
        h("caption", {}, hasGhost ? "Rate per mese e per servizio, con la simulazione" : "Rate per mese e per servizio"),
        h("thead", {}, h("tr", {}, head.map((t) => h("th", { scope: "col" }, t)))),
        h("tbody", {}, rows),
        h("tfoot", {}, h("tr", {},
          h("th", { scope: "row" }, "In tutto"),
          providers.map((p) => h("td", {}, formatEuro(totalsBy[p]))),
          hasGhost ? h("td", {}, formatEuro(ghostTot)) : null,
          h("td", { class: "tot" }, formatEuro(sum(months.map((m) => m.total)) + ghostTot)),
          withIncome ? h("td", {}, "") : null,
          withIncome && thr ? h("td", {}, "") : null)))));
}

function chartMonths(extraTo = null) {
  return aggregateByMonth(state.purchases, { fromMonth: CURRENT, toMonth: extraTo });
}

function renderHero() {
  const nm = monthSummary(state.purchases, NEXT);
  const colors = colorMap(providerOrder(state.purchases, KNOWN));
  $("#hero-amount").textContent = formatEuro(nm.total);
  $("#hero-sub").textContent = nm.count
    ? `${cap(monthLabel(NEXT))} · ${plural(nm.count, "rata", "rate")} · ${plural(nm.providerCount, "servizio", "servizi")}`
    : `${cap(monthLabel(NEXT))}: nessuna rata in calendario.`;
  $("#hero-list").replaceChildren(...nm.items.map((it) => h("li", {},
    h("span", { class: "d" }, `${parts(it.date).d} ${MONTHS[parts(it.date).m - 1].slice(0, 3)}`),
    h("span", { class: "who" }, h("span", { class: "sw", style: { background: colors[it.provider] }, "aria-hidden": "true" }), h("b", {}, it.merchant), ` · ${it.provider}`, h("span", { class: "of" }, ` (rata ${it.n} di ${it.of})`)),
    h("span", { class: "a" }, formatEuro(it.amount)))));
  const rest = buildAll().filter((it) => it.date >= TODAY && monthKey(it.date) === CURRENT);
  const last = buildAll().at(-1);
  $("#hero-foot").textContent = [
    rest.length ? `Questo mese, da oggi alla fine di ${MONTHS[parts(TODAY).m - 1]}, restano ${formatEuro(sum(rest.map((r) => r.amount)))} in ${plural(rest.length, "rata", "rate")}.` : `Questo mese, da oggi alla fine di ${MONTHS[parts(TODAY).m - 1]}, non restano rate.`,
    last ? `L'ultima rata in calendario è ${withArticle(last.date, null)}.` : "",
  ].join(" ");
}
const buildAll = () => state.purchases.flatMap(buildSchedule).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

function renderOverrides() {
  const months = chartMonths();
  $("#ov-grid").replaceChildren(...months.map((m) => {
    const id = `ov-${m.key}`;
    return h("div", { class: "field" },
      h("label", { for: id }, cap(monthLabel(m.key))),
      h("input", {
        id, inputmode: "decimal", autocomplete: "off", value: state.overrides[m.key] ? plainAmount(state.overrides[m.key]) : "",
        placeholder: state.income ? plainAmount(state.income) : "come gli altri mesi",
        onchange: (e) => {
          const v = e.target.value.trim();
          const c = v ? parseAmount(v) : null;
          if (v && (c == null || c <= 0)) { e.target.setAttribute("aria-invalid", "true"); announce(`${cap(monthLabel(m.key))}: importo non leggibile.`); return; }
          e.target.removeAttribute("aria-invalid");
          if (c) state.overrides[m.key] = c; else delete state.overrides[m.key];
          save(); renderIncomeDependent();
        },
      }));
  }));
}

function renderNotes() {
  const box = $("#notes");
  box.replaceChildren();
  const thr = threshold();
  if (!state.income) {
    box.append(h("p", { class: "hint" }, "Scrivi quanto ti entra in un mese per vedere che parte va in rate, mese per mese."));
    return;
  }
  const notes = monthNotes(chartMonths(), { income: state.income, overrides: state.overrides, threshold: thr, refYear: REF_YEAR });
  let shown;
  let tail = null;
  if (thr == null) {
    shown = notes.slice(0, 3);
    tail = "Gli altri mesi sono nella tabella del grafico.";
  } else {
    shown = notes.filter((n) => n.over);
    const next = notes.find((n) => n.key === NEXT);
    if (next && !next.over) shown.unshift(next);
    if (!notes.some((n) => n.over)) tail = `In nessun mese le rate superano l'avviso che hai scelto (${String(thr).replace(".", ",")}%).`;
  }
  box.append(h("ul", { class: "note-list" }, shown.map((n) => h("li", { class: n.over ? "over" : null },
    n.over ? h("span", { class: "flag" }, "sopra il tuo avviso") : null,
    h("span", {}, n.text)))));
  if (tail) box.append(h("p", { class: "hint" }, tail));
}

function renderIncomeDependent() {
  if (!state.purchases.length) return;
  renderNotes();
  renderChart($("#chart"), { months: chartMonths(), purchases: state.purchases, ghost: state.sim ? simGhost() : null, idPrefix: "cal" });
  $("#ov-grid").querySelectorAll("input").forEach((i) => { i.placeholder = state.income ? plainAmount(state.income) : "come gli altri mesi"; });
  if (state.sim) renderSim();
}

function renderUpcoming() {
  const items = upcoming(state.purchases, TODAY, 30);
  const box = $("#upcoming");
  box.replaceChildren();
  const end = addDays(TODAY, 30);
  if (!items.length) {
    box.append(h("p", {}, `${cap(withArticle(TODAY, REF_YEAR, "dal"))} ${withArticle(end, REF_YEAR, "al")} non ci sono rate.`));
    return;
  }
  const colors = colorMap(providerOrder(state.purchases, KNOWN));
  box.append(h("p", { class: "upc-sum" }, `${cap(withArticle(TODAY, REF_YEAR, "dal"))} ${withArticle(end, REF_YEAR, "al")}: `, h("b", {}, formatEuro(sum(items.map((i) => i.amount)))), ` in ${plural(items.length, "rata", "rate")}.`));
  const byDate = new Map();
  for (const it of items) byDate.set(it.date, [...(byDate.get(it.date) || []), it]);
  box.append(h("ol", { class: "upc" }, [...byDate.entries()].map(([date, its]) => h("li", {},
    h("p", { class: "upc-d" }, h("span", { class: "day" }, String(parts(date).d)), h("span", { class: "mon" }, `${MONTHS[parts(date).m - 1].slice(0, 3)} · ${weekday(date)}`),
      date === TODAY ? h("span", { class: "tag" }, "oggi") : null),
    h("ul", {}, its.map((it) => h("li", {},
      h("span", { class: "sw", style: { background: colors[it.provider] }, "aria-hidden": "true" }),
      h("span", { class: "who" }, h("b", {}, it.merchant), ` · ${it.provider} · rata ${it.n} di ${it.of}`),
      h("span", { class: "a" }, formatEuro(it.amount)))))))));
}

function purchaseDetail(p, colors) {
  const sched = buildSchedule(p);
  const { note } = splitAmounts(p.total, p.count, p.installmentAmount);
  const lastDiffers = sched.length > 1 && sched.at(-1).amount !== sched[0].amount;
  return h("details", { class: "purchase" },
    h("summary", {},
      h("span", { class: "sw", style: { background: colors[p.provider] }, "aria-hidden": "true" }),
      h("span", { class: "p-name" }, h("b", {}, p.merchant), ` · ${p.provider}`),
      h("span", { class: "p-sum" }, `${formatEuro(p.total)} in ${plural(p.count, "rata", "rate")}`)),
    h("div", { class: "p-body" },
      h("p", { class: "hint" }, `Da dove viene: ${ORIGIN_SOURCE[p.origin] || "dati inseriti a mano"}.${p.kind === "finanziamento" ? " È un finanziamento in negozio." : ""}`),
      h("h4", {}, "Dall'email al calendario"),
      sourcesTable(p, `Valori dell'acquisto ${p.merchant} e frasi dell'email`),
      note === "importi_non_coerenti"
        ? h("p", { class: "notice" }, `L'email indica rate da ${formatEuro(p.installmentAmount)}, ma con un totale di ${formatEuro(p.total)} i conti non tornano. Nel calendario il totale è diviso in parti uguali: il dettaglio è nell'email del servizio.`)
        : null,
      h("h4", {}, "Il piano di pagamento"),
      h("ol", { class: "sched" }, sched.map((it) => h("li", { class: it.date < TODAY ? "past" : null },
        h("span", {}, `${it.n}ª rata · ${formatDateLong(it.date)}`),
        h("span", { class: "a" }, formatEuro(it.amount)),
        it.date < TODAY ? h("span", { class: "tag muted-tag" }, "data passata") : null))),
      lastDiffers ? h("p", { class: "hint" }, `L'ultima rata è di ${formatEuro(sched.at(-1).amount)}: porta i centesimi dell'arrotondamento, così la somma delle rate è esattamente ${formatEuro(p.total)}.`) : null,
      p.emailText ? h("details", { class: "orig" }, h("summary", {}, "Vedi l'email originale"), h("pre", {}, p.emailText)) : null,
      h("div", { class: "actions" },
        h("button", { type: "button", class: "btn", onclick: () => openManual(p, p.id) }, "Correggi"),
        h("button", { type: "button", class: "btn", onclick: () => {
          state.purchases = state.purchases.filter((x) => x.id !== p.id);
          for (const r of state.reads) if (r.result.purchase.id === p.id) r.added = null;
          save(); renderAll();
          announce(`${p.merchant}: tolto dal calendario.`);
          $("#cal-content").hidden ? $("#cal-empty h2")?.focus() : $("#purchases").closest(".card").querySelector("h2").focus();
        } }, "Togli dal calendario"))));
}

function renderPurchases() {
  const colors = colorMap(providerOrder(state.purchases, KNOWN));
  const sorted = [...state.purchases].sort((a, b) => (a.firstDate < b.firstDate ? -1 : 1));
  $("#purchases").replaceChildren(...sorted.map((p) => purchaseDetail(p, colors)));
}

function renderIncomeInputs() {
  $("#income").value = state.income ? plainAmount(state.income) : "";
  for (const r of document.querySelectorAll('input[name="thr"]')) r.checked = r.value === state.thrChoice;
  $("#custom-thr").hidden = state.thrChoice !== "custom";
  $("#thr-custom").value = state.thrCustom;
}

function renderCalendar() {
  const has = state.purchases.length > 0;
  $("#cal-empty").hidden = has;
  $("#cal-content").hidden = !has;
  if (!has) {
    for (const id of ["#chart", "#upcoming", "#purchases", "#notes", "#hero-list", "#ov-grid"]) $(id).replaceChildren();
    return;
  }
  renderHero();
  renderOverrides();
  renderNotes();
  renderChart($("#chart"), { months: chartMonths(), purchases: state.purchases, ghost: state.sim ? simGhost() : null, idPrefix: "cal" });
  renderUpcoming();
  renderPurchases();
}

$("#income").addEventListener("input", (e) => {
  const v = e.target.value.trim();
  const c = v ? parseAmount(v) : null;
  if (v && (c == null || c <= 0)) {
    setErr(e.target, $("#income-err"), "Scrivi un importo in euro, per esempio 720 oppure 720,50.");
    return;
  }
  setErr(e.target, $("#income-err"), "");
  state.income = c;
  save();
  // Aspetta che la persona smetta di scrivere: le note sono annunciate (aria-live).
  clearTimeout(incomeTimer);
  incomeTimer = setTimeout(renderIncomeDependent, 350);
});
let incomeTimer = null;
document.querySelectorAll('input[name="thr"]').forEach((r) => r.addEventListener("change", () => {
  state.thrChoice = r.value;
  $("#custom-thr").hidden = r.value !== "custom";
  if (r.value === "custom") $("#thr-custom").focus();
  save();
  renderIncomeDependent();
  const t = threshold();
  announce(t ? `Avviso impostato sopra il ${t}%.` : "Nessun avviso.");
}));
$("#thr-custom").addEventListener("input", (e) => {
  state.thrCustom = e.target.value.trim();
  save();
  renderIncomeDependent();
});

// ---- 3 · E se aggiungo questo acquisto? -------------------------------------

function simGhost() {
  const rows = whatIf(state.purchases, state.sim, { fromMonth: CURRENT });
  return new Map(rows.map((r) => [r.key, r.delta]));
}

function renderSim() {
  const box = $("#sim-result");
  box.replaceChildren();
  if (!state.sim) return;
  const rows = whatIf(state.purchases, state.sim, { fromMonth: CURRENT });
  const changed = rows.filter((r) => r.delta !== 0);
  const sched = buildSchedule({ ...state.sim, id: "simulazione", provider: "Simulazione" });
  const opts = { income: state.income, overrides: state.overrides, threshold: threshold(), refYear: REF_YEAR };
  const lastKey = rows.length ? rows.at(-1).key : CURRENT;
  const months = aggregateByMonth(state.purchases, { fromMonth: CURRENT, toMonth: lastKey });
  const chartBox = h("div", { class: "chart" });
  const card = h("div", { class: "card sim-card" },
    h("h2", { id: "sim-title", tabindex: "-1" }, "Cosa cambierebbe nel calendario"),
    h("p", {}, `Nuovo acquisto simulato: ${formatEuro(state.sim.total)} in ${plural(state.sim.count, "rata", "rate")} da ${formatEuro(sched[0].amount)}, ${frequencyLabel(state.sim.frequency)}, ${withArticle(sched[0].date, REF_YEAR, "dal")} ${withArticle(sched.at(-1).date, REF_YEAR, "al")}.`),
    h("ul", { class: "note-list" }, changed.map((r) => h("li", { class: opts.threshold && share(r.after, incomeFor(r.key, state.income, state.overrides)) > opts.threshold ? "over" : null }, whatIfSentence(r, opts)))),
    state.income ? null : h("p", { class: "hint" }, "Se scrivi quanto ti entra in un mese (nel Calendario), qui vedi anche la quota sulle entrate."),
    chartBox,
    h("div", { class: "table-scroll" }, h("table", { class: "num-table" },
      h("caption", {}, "Differenza mese per mese"),
      h("thead", {}, h("tr", {}, ["Mese", "Oggi", "Con questo acquisto", "Differenza"].map((t) => h("th", { scope: "col" }, t)))),
      h("tbody", {}, changed.map((r) => h("tr", {},
        h("th", { scope: "row" }, cap(monthLabel(r.key))),
        h("td", {}, formatEuro(r.before)),
        h("td", {}, formatEuro(r.after)),
        h("td", { class: "tot" }, formatEuro(r.delta, { sign: true }))))))),
    h("p", { class: "hint" }, "È solo una simulazione: non viene salvata e non cambia i tuoi acquisti."));
  box.append(card);
  renderChart(chartBox, { months, purchases: state.purchases, ghost: new Map(rows.map((r) => [r.key, r.delta])), idPrefix: "sim" });
}

$("#s-first").value = TODAY;
$("#s-first").min = `${CURRENT}-01`;
$("#sim-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const S = (id) => document.getElementById(`s-${id}`);
  const total = parseAmount(S("total").value);
  const count = Number(S("count").value);
  const first = S("first").value;
  const errors = [];
  const check = (id, ok, msg) => { setErr(S(id), S(`${id}-err`), ok ? "" : msg); if (!ok) errors.push(S(id)); };
  check("total", total != null && total > 0, "Scrivi l'importo in euro, per esempio 120.");
  check("count", Number.isInteger(count) && count >= 1 && count <= 60, "Scrivi un numero di rate da 1 a 60.");
  check("first", isValidIso(first) && monthKey(first) >= CURRENT, "Scegli una data da questo mese in poi.");
  if (errors.length) { errors[0].focus(); announce("Controlla i campi segnalati."); return; }
  state.sim = { total, count, frequency: S("frequency").value, firstDate: first, merchant: "Nuovo acquisto" };
  renderSim();
  if (state.purchases.length) renderChart($("#chart"), { months: chartMonths(), purchases: state.purchases, ghost: simGhost(), idPrefix: "cal" });
  $("#sim-title")?.focus();
  announce("Simulazione pronta: il nuovo acquisto è a righe nel grafico.");
});
$("#sim-clear").addEventListener("click", () => {
  state.sim = null;
  $("#sim-form").reset();
  $("#s-first").value = TODAY;
  renderSim();
  renderCalendar();
  announce("Simulazione tolta.");
});

// ---- 4 · Impara: glossario e quiz -------------------------------------------

function renderGlossary() {
  const items = buildGlossary(state.purchases, TODAY);
  $("#glossary").replaceChildren(...items.map((g) => h("div", { class: "gl" },
    h("dt", {}, g.term),
    h("dd", {},
      h("p", {}, g.definition),
      g.example ? h("p", { class: "ex" }, h("span", { class: "ex-l" }, "Nel tuo calendario"), g.example) : null,
      g.fees?.length ? h("ul", { class: "fees" }, g.fees.map((f) => h("li", {},
        f.quotes.length
          ? [h("p", { class: "ex-l" }, `Nelle email di ${f.provider}`), ...f.quotes.map((q) => h("blockquote", {}, h("p", {}, q)))]
          : h("p", {}, `Nelle email di ${f.provider} che hai caricato non si parla di penali.`)))) : null))));
}

function renderQuiz() {
  const box = $("#quiz");
  box.replaceChildren();
  if (!state.purchases.length) {
    box.append(h("p", { class: "hint" }, "Le domande sono sul tuo calendario: prima carica le email."), h("button", { type: "button", class: "btn", "data-goto": "tab-email" }, "Vai alle email"));
    return;
  }
  const qs = buildQuiz(state.purchases, TODAY);
  const checked = state.quizChecked;
  const form = h("form", { class: "quiz", novalidate: true });
  qs.forEach((q, i) => {
    const res = checked?.results.find((r) => r.id === q.id);
    form.append(h("fieldset", { class: `q${res ? (res.ok ? " ok" : " ko") : ""}` },
      h("legend", {}, `${i + 1}. ${q.text}`),
      h("div", { class: "chips" }, q.options.map((o) => h("label", { class: "chip" },
        h("input", {
          type: "radio", name: `q-${q.id}`, value: String(o.value),
          checked: String(state.quizAnswers[q.id]) === String(o.value) || null,
          disabled: checked ? true : null,
          onchange: () => { state.quizAnswers[q.id] = o.value; },
        }), " ", h("span", {}, o.label)))),
      res ? h("p", { class: "fb" }, h("b", {}, res.ok ? "Giusto. " : "Non ancora. "), res.explain) : null));
  });
  const err = h("p", { class: "err", id: "quiz-err" });
  const actions = h("div", { class: "actions" },
    checked
      ? h("button", { type: "button", class: "btn primary", onclick: () => { state.quizAnswers = {}; state.quizChecked = null; renderQuiz(); $("#quiz legend")?.closest("fieldset")?.querySelector("input")?.focus(); } }, "Rifai il quiz")
      : h("button", { type: "submit", class: "btn primary" }, "Controlla le risposte"),
    checked ? h("button", { type: "button", class: "btn", "data-goto": "tab-cal" }, "Guarda il calendario") : null);
  form.append(err, actions);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const missing = qs.filter((q) => state.quizAnswers[q.id] == null);
    if (missing.length) {
      err.textContent = `Manca la risposta a ${plural(missing.length, "domanda", "domande")}.`;
      form.querySelector(`input[name="q-${missing[0].id}"]`)?.focus();
      announce(err.textContent);
      return;
    }
    state.quizChecked = scoreQuiz(qs, state.quizAnswers);
    state.attempts.push({ score: state.quizChecked.score, total: state.quizChecked.total, at: new Date().toISOString() });
    save();
    renderQuiz();
    $("#quiz-score")?.focus();
    announce(`${state.quizChecked.score} risposte giuste su ${state.quizChecked.total}.`);
  });
  box.append(form);

  if (state.attempts.length) {
    const first = state.attempts[0];
    const last = state.attempts.at(-1);
    box.append(h("div", { class: "score", id: "quiz-score", tabindex: "-1" },
      h("div", { class: "sc" }, h("span", { class: "sc-l" }, "Primo tentativo"), h("span", { class: "sc-v" }, `${first.score} su ${first.total}`)),
      state.attempts.length > 1 ? h("div", { class: "sc" }, h("span", { class: "sc-l" }, "Ultimo tentativo"), h("span", { class: "sc-v" }, `${last.score} su ${last.total}`)) : null,
      h("p", { class: "hint" }, state.attempts.length > 1
        ? `${plural(state.attempts.length, "tentativo", "tentativi")} in tutto. I punteggi restano in questo browser.`
        : "Guarda il calendario e rifai il quiz: qui vedrai il confronto.")));
  }
}

// ---- Avvio --------------------------------------------------------------------

function renderAll() {
  renderReads();
  renderCalendar();
  renderSim();
  renderGlossary();
  renderQuiz();
}

let resetArmed = null;
$("#reset-all").addEventListener("click", (e) => {
  const b = e.currentTarget;
  if (!resetArmed) {
    b.textContent = "Confermi? Premi di nuovo per cancellare";
    resetArmed = setTimeout(() => { resetArmed = null; b.textContent = "Cancella tutti i dati"; }, 5000);
    return;
  }
  clearTimeout(resetArmed);
  resetArmed = null;
  b.textContent = "Cancella tutti i dati";
  try { localStorage.removeItem(STORE); } catch { /* niente da cancellare */ }
  Object.assign(state, { purchases: [], income: null, overrides: {}, thrChoice: "", thrCustom: "", attempts: [], reads: [], sim: null, quizAnswers: {}, quizChecked: null });
  renderIncomeInputs();
  renderAll();
  announce("Tutti i dati sono stati cancellati da questo browser.");
});

$("#today-label").textContent = `Calcoli riferiti a ${weekday(TODAY)} ${formatDateLong(TODAY)}${params.has("oggi") && isValidIso(params.get("oggi")) ? " (data impostata nell'indirizzo)" : ""}.`;
$("#known-providers").replaceChildren(...KNOWN_PROVIDERS.map((p) => h("option", { value: p })));

load();
renderIncomeInputs();
renderAll();
const initial = { email: "tab-email", cal: "tab-cal", sim: "tab-sim", learn: "tab-learn" }[location.hash.slice(1)];
if (initial) goTo(initial, { focus: false });

fetch("/api/health").then((r) => r.json()).then((d) => {
  aiAvailable = !!d.ai;
  renderReads();
}).catch(() => { aiAvailable = false; });
