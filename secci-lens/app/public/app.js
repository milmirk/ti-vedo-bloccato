/*
 * SECCI Lens · interfaccia.
 *
 * Tutto il calcolo è in lib/ (deterministico, testato in Node). Qui si legge
 * il documento, si chiamano i moduli e si costruisce la pagina con elementi
 * DOM (mai innerHTML: il testo incollato non viene mai interpretato come HTML).
 * L'AI è facoltativa: se /api/health dice che non c'è, i pulsanti AI non compaiono.
 */
import { parseSecci, toCredit, fromAiFields, mergeParsed, FIELD_NAMES, FEE_NAMES, normalizeText } from "./lib/parser.js";
import { analyze, formatEuro as E, formatPercent, formatMonths, formatNumber, parseItNumber, computeTaeg, roundTo } from "./lib/finance.js";
import {
  plainSentences, everyday, countPhrase, UNITS, coherenceMessage, compareOffers, buildQuiz, scoreQuiz,
  summaryLine, costParts, rataInfo, timingText,
} from "./lib/explain.js";
import { SAMPLES } from "./lib/samples.js";

const P = (n, d = 2) => formatPercent(n, d);
const byId = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Piccolo aiuto per creare elementi ──────────────────────────────────

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  append(el, kids);
  return el;
}
function append(el, kids) {
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(typeof kid === "object" ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
function icon(id, cls = "ico") {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", cls);
  svg.setAttribute("viewBox", "0 0 48 48");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const use = document.createElementNS(NS, "use");
  use.setAttribute("href", "#i-" + id);
  svg.append(use);
  return svg;
}
const strong = (t) => h("strong", {}, t);

// ── Stato ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "sintesi", label: "In sintesi" },
  { id: "tassi", label: "TAN e TAEG" },
  { id: "rate", label: "Le rate" },
  { id: "cose", label: "In cose di tutti i giorni" },
  { id: "controllo", label: "Controllo dei numeri" },
  { id: "frasi", label: "Frase per frase" },
  { id: "confronta", label: "Confronta due offerte" },
  { id: "quiz", label: "Quiz" },
];

const state = {
  ai: false,
  text: "",
  sampleId: null,
  rules: null,
  parsed: null,
  aiFields: null,
  analysis: null,
  quiz: [],
  pre: { status: "offer", answers: {}, score: null },
  post: { answers: {} },
  unit: "caffe",
  prices: Object.fromEntries(UNITS.map((u) => [u.id, u.price])),
  compare: { a: null, b: null },
  aiItems: null,
};

const sampleModels = SAMPLES.map((s) => {
  const parsed = parseSecci(s.text);
  const m = toCredit(parsed);
  return { id: s.id, label: `${s.title} · ${s.lender}`, name: s.lender, parsed, analysis: analyze(m.credit, m.declared), declaredTaeg: parsed.fields.taeg?.value };
});

// ── Avvio ──────────────────────────────────────────────────────────────

function init() {
  const grid = byId("samples");
  for (const s of SAMPLES) {
    grid.append(h("button", {
      type: "button", class: "sample", "aria-pressed": "false", "data-id": s.id,
      onclick: () => loadSample(s.id),
    }, h("span", { class: "sample-title" }, s.title), h("span", { class: "sample-lender" }, s.lender), h("span", { class: "sample-sum" }, s.summary)));
  }
  byId("read").addEventListener("click", () => readDocument(byId("doc").value, null));
  byId("clear").addEventListener("click", () => {
    byId("doc").value = "";
    setPressed(null);
    byId("results").hidden = true;
    byId("ai-extract").hidden = true;
    say("Il riquadro è vuoto. Incolla un documento o scegli un esempio.");
    byId("doc").focus();
  });
  byId("doc").addEventListener("input", () => { if (state.sampleId) setPressed(null); });
  buildTabs();
  checkAi();
}

async function checkAi() {
  try {
    const r = await fetch("/api/health", { headers: { accept: "application/json" } });
    const data = await r.json();
    state.ai = !!data.ai;
  } catch {
    state.ai = false;
  }
  if (state.analysis) renderFrasi();
}

function say(text) {
  byId("read-status").textContent = text;
}

function setPressed(id) {
  state.sampleId = id;
  for (const b of byId("samples").children) b.setAttribute("aria-pressed", String(b.getAttribute("data-id") === id));
}

function loadSample(id) {
  const s = SAMPLES.find((x) => x.id === id);
  if (!s) return;
  byId("doc").value = s.text;
  readDocument(s.text, id);
}

// ── Lettura del documento ──────────────────────────────────────────────

function readDocument(raw, sampleId) {
  const text = normalizeText(raw);
  setPressed(sampleId);
  byId("ai-extract").hidden = true;
  if (!text.trim()) {
    byId("results").hidden = true;
    say("Il riquadro è vuoto. Incolla il testo del modulo o scegli un esempio.");
    byId("doc").focus();
    return;
  }
  state.text = text;
  state.aiFields = null;
  state.rules = parseSecci(text);
  if (state.rules.complete) showResults(state.rules);
  else showIncomplete(state.rules);
}

function showIncomplete(parsed) {
  byId("results").hidden = true;
  const names = parsed.missing.map((k) => `«${FIELD_NAMES[k]}»`).join(", ");
  say(parsed.isSecci
    ? `Non riesco a leggere tutti i dati che servono per i conti. Non ho trovato: ${names}.`
    : "Questo testo non sembra un modulo SECCI: non trovo le sue voci principali, come «Importo totale del credito».");
  const box = byId("ai-extract");
  box.replaceChildren();
  if (state.ai) {
    const btn = h("button", { type: "button", class: "btn primary" }, "Trova i dati con l'AI");
    const out = h("p", { class: "small", role: "status" });
    btn.addEventListener("click", () => aiExtract(btn, out));
    append(box, [
      h("p", {}, strong("Il testo usa parole diverse dal modulo standard?"), " Puoi chiedere all'AI di trovare i dati. L'AI copia solo brani del documento: il programma controlla che ci siano davvero e fa tutti i conti."),
      h("div", { class: "row" }, btn), out,
    ]);
  } else {
    append(box, [h("p", {}, "Il programma riconosce le voci standard del modulo, per esempio «Importo totale del credito» e «10 rate mensili da 60,00 €». Controlla di aver copiato tutto il testo, oppure prova con un esempio.")]);
  }
  box.hidden = false;
}

async function postJson(url, body) {
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, data };
  } catch {
    return { ok: false, data: { reason: "server non raggiungibile" } };
  }
}

async function aiExtract(btn, out) {
  btn.disabled = true;
  btn.setAttribute("aria-busy", "true");
  out.textContent = "Sto chiedendo all'AI di trovare i dati. Può volerci qualche secondo.";
  const r = await postJson("/api/extract", { text: state.text });
  btn.disabled = false;
  btn.removeAttribute("aria-busy");
  if (!r.ok || !r.data.aiFields) {
    out.textContent = `L'AI non ha dato una risposta utilizzabile${r.data.reason ? ` (${r.data.reason})` : ""}. Restano le regole del programma.`;
    return;
  }
  // La pagina ricontrolla le citazioni con lo stesso codice del server.
  const aiParsed = fromAiFields(state.text, r.data.aiFields);
  const merged = mergeParsed(state.rules, aiParsed);
  state.aiFields = r.data.aiFields;
  if (merged.complete) {
    showResults(merged, aiParsed.rejected.length);
  } else {
    showIncomplete(merged);
    say(`Anche con l'AI mancano dei dati: ${merged.missing.map((k) => `«${FIELD_NAMES[k]}»`).join(", ")}.`);
  }
}

function showResults(parsed, aiRejected = 0) {
  const m = toCredit(parsed);
  state.parsed = parsed;
  state.analysis = analyze(m.credit, m.declared);
  state.quiz = buildQuiz(parsed, state.analysis);
  state.pre = { status: "offer", answers: {}, score: null };
  state.post = { answers: {} };
  state.aiItems = null;
  const current = state.sampleId || "current";
  const pairs = { "lavatrice-tasso-zero": "lavatrice-16-rate", "lavatrice-16-rate": "lavatrice-tasso-zero", "prestito-personale": "lavatrice-tasso-zero", current: "lavatrice-tasso-zero" };
  state.compare = { a: current, b: pairs[current] };

  const f = parsed.fields;
  const product = [f.productType?.value, f.lender?.value].filter(Boolean).join(" · ");
  byId("doc-title").textContent = product || "Documento incollato";

  renderPrequiz();
  for (const t of TABS) renderPanel(t.id);
  renderOriginal();
  byId("results").hidden = false;
  selectTab("sintesi");

  const missing = parsed.missing.length ? ` Non ho trovato: ${parsed.missing.map((k) => `«${FIELD_NAMES[k]}»`).join(", ")}.` : "";
  const ai = parsed.origin !== "regole" ? " Alcuni dati li ha trovati l'AI: ogni valore è stato verificato sul testo." : "";
  const rej = aiRejected ? ` ${aiRejected === 1 ? "Un dato proposto dall'AI è stato scartato" : `${aiRejected} dati proposti dall'AI sono stati scartati`} perché non compariva nel testo.` : "";
  say(`Documento letto. ${summaryLine(parsed, state.analysis)}${missing}${ai}${rej}`);
  byId("h-results").focus();
}

// ── Schede ─────────────────────────────────────────────────────────────

function buildTabs() {
  const list = byId("tablist");
  const panels = byId("panels");
  for (const t of TABS) {
    list.append(h("button", {
      type: "button", role: "tab", id: `tab-${t.id}`, class: "tab", "aria-controls": `panel-${t.id}`,
      "aria-selected": "false", tabindex: "-1", onclick: () => selectTab(t.id), onkeydown: onTabKey,
    }, t.label));
    panels.append(h("div", { role: "tabpanel", id: `panel-${t.id}`, class: "panel", "aria-labelledby": `tab-${t.id}`, tabindex: "0", hidden: true }));
  }
}

function onTabKey(e) {
  const i = TABS.findIndex((t) => `tab-${t.id}` === e.currentTarget.id);
  let j = null;
  if (e.key === "ArrowRight") j = (i + 1) % TABS.length;
  else if (e.key === "ArrowLeft") j = (i - 1 + TABS.length) % TABS.length;
  else if (e.key === "Home") j = 0;
  else if (e.key === "End") j = TABS.length - 1;
  if (j === null) return;
  e.preventDefault();
  selectTab(TABS[j].id, { focus: true });
}

function selectTab(id, { focus = false } = {}) {
  for (const t of TABS) {
    const on = t.id === id;
    const tab = byId(`tab-${t.id}`);
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
    byId(`panel-${t.id}`).hidden = !on;
  }
  const tab = byId(`tab-${id}`);
  if (!focus) return;
  tab.focus();
  if (typeof tab.scrollIntoView === "function") tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
}

function renderPanel(id) {
  ({ sintesi: renderSintesi, tassi: renderTassi, rate: renderRate, cose: renderCose, controllo: renderControllo, frasi: renderFrasi, confronta: renderConfronta, quiz: renderQuiz })[id]();
}

function fill(id, title, ...kids) {
  const panel = byId(`panel-${id}`);
  panel.replaceChildren();
  append(panel, [h("h3", {}, title), kids]);
  const i = TABS.findIndex((t) => t.id === id);
  const next = TABS[i + 1];
  if (next) {
    panel.append(h("div", { class: "next-row" }, h("button", {
      type: "button", class: "btn next", onclick: () => selectTab(next.id, { focus: true }),
    }, `Continua: ${next.label} `, h("span", { "aria-hidden": "true" }, "›"))));
  }
  return panel;
}

function sourceBox(field, label = "Dal documento") {
  if (!field?.source) return null;
  return h("details", { class: "src" },
    h("summary", {}, label),
    h("blockquote", { class: "quote" }, field.source),
    field.origin === "ai" ? h("p", { class: "badge ai" }, "Trovato dall'AI e verificato sul testo") : null);
}

// ── In sintesi ─────────────────────────────────────────────────────────

function tile(label, value, sub, field, cls = "") {
  return h("article", { class: `tile ${cls}` },
    h("h4", {}, label), h("p", { class: "big" }, value), sub ? h("p", { class: "sub" }, sub) : null, sourceBox(field));
}

function renderSintesi() {
  const { parsed: p, analysis: a } = state;
  const f = p.fields;
  const n = a.installments.count;
  const tiles = h("div", { class: "tiles" },
    tile("Ricevi", E(a.creditAmount), a.upfront > 0 ? `Alla firma paghi ${E(a.upfront)} di spese.` : "È l'«Importo totale del credito».", f.creditAmount),
    tile("Restituisci in totale", E(a.totalDue), "Tutte le rate e le spese, sommate dal programma.", f.totalDue),
    tile("Il credito ti costa", E(a.totalCost), `Quello che paghi in più: ${E(a.totalDue)} − ${E(a.creditAmount)}.`, null, "hot"),
    tile("Per quanto tempo", formatMonths(a.durationMonths), `${n} rate${a.installments.periodsPerYear === 12 ? ", una al mese" : ""}.`, f.duration || f.installments),
  );

  const share = a.totalDue > 0 ? Math.min(1, a.creditAmount / a.totalDue) : 1;
  const segA = h("span", { class: "seg seg-credit" });
  const segB = h("span", { class: "seg seg-cost" });
  segA.style.width = `${share * 100}%`;
  segB.style.width = `${(1 - share) * 100}%`;
  const split = h("div", { class: "split-box" },
    h("div", { class: "split", "aria-hidden": "true" }, segA, segB),
    h("p", { class: "split-legend" },
      h("span", { class: "key key-credit", "aria-hidden": "true" }), `Somma ricevuta ${E(a.creditAmount)}`,
      h("span", { class: "key key-cost", "aria-hidden": "true" }), `Costo del credito ${E(a.totalCost)}`),
    h("p", {}, `Di ${E(a.totalDue)} che restituisci, ${E(a.creditAmount)} sono la somma ricevuta e ${E(a.totalCost)} sono il costo del credito.`));

  const notes = [];
  if (f.tan && f.tan.value === 0 && a.totalCost > 0.005) {
    notes.push(h("div", { class: "callout zero" },
      h("p", {}, strong("«Tasso zero» vuol dire TAN 0,00%: niente interessi."), ` Ma ci sono ${E(a.feesTotal)} di spese obbligatorie. Per questo il TAEG non è zero: calcolato dai dati del documento è ${P(a.taegRounded)}.`)));
  }
  const due = a.checks.find((c) => c.key === "totalDue");
  if (due && !due.match) {
    notes.push(h("p", { class: "callout warn" }, `Il documento scrive ${E(due.declared)} come importo totale dovuto. Trovi il confronto in «Controllo dei numeri».`));
  }
  fill("sintesi", "In sintesi", tiles, split, notes);
}

// ── TAN e TAEG ─────────────────────────────────────────────────────────

function renderTassi() {
  const { parsed: p, analysis: a } = state;
  const f = p.fields;
  const taegCheck = a.checks.find((c) => c.key === "taeg");
  const duo = h("div", { class: "duo" },
    h("article", { class: "rate-card" },
      h("h4", {}, "TAN"), h("p", { class: "term" }, "Tasso annuo nominale"),
      h("p", { class: "big" }, f.tan ? f.tan.raw.replace(/\s+/g, "") : "non indicato"),
      h("p", {}, "È il prezzo degli ", strong("interessi"), ", in percentuale all'anno. ", strong("Non comprende le spese.")),
      sourceBox(f.tan)),
    h("article", { class: "rate-card hot" },
      h("h4", {}, "TAEG"), h("p", { class: "term" }, "Tasso annuo effettivo globale"),
      h("p", { class: "big" }, f.taeg ? f.taeg.raw.replace(/\s+/g, "") : P(a.taegRounded)),
      !f.taeg ? h("p", { class: "sub" }, "Il documento non lo scrive: questo è il valore calcolato dai suoi dati.") : null,
      taegCheck && !taegCheck.match ? h("p", { class: "sub warn-text" }, `Calcolato dai dati del documento: ${P(a.taegRounded)}. Vedi «Controllo dei numeri».`) : null,
      h("p", {}, "Mette insieme ", strong("interessi e spese obbligatorie"), ", in percentuale all'anno. È il numero pensato per confrontare offerte diverse."),
      sourceBox(f.taeg)),
  );

  const parts = costParts(a);
  const table = h("table", { class: "data" },
    h("caption", {}, "Di cosa è fatto il costo del credito"),
    h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Voce"), h("th", { scope: "col", class: "num" }, "Importo"), h("th", { scope: "col" }, "Come"))),
    h("tbody", {}, parts.map((x) => h("tr", {}, h("th", { scope: "row" }, x.label), h("td", { class: "num" }, E(x.amount)), h("td", {}, x.note)))),
    h("tfoot", {}, h("tr", {}, h("th", { scope: "row" }, "Costo del credito"), h("td", { class: "num" }, E(a.totalCost)), h("td", {}, "Questo è ciò che il TAEG trasforma in percentuale all'anno"))));

  const simple = a.creditAmount > 0 ? (a.totalCost / a.creditAmount) * 100 : 0;
  const why = h("details", { class: "more" },
    h("summary", {}, `Perché il TAEG non è semplicemente ${E(a.totalCost)} ÷ ${E(a.creditAmount)}?`),
    h("p", {}, `Il conto semplice dà ${P(simple)}. Ma non tiene conto di due cose: per quanto tempo hai i soldi, e il fatto che li restituisci un po' alla volta, rata dopo rata.`),
    h("p", {}, `Il TAEG misura il costo per ogni anno, sulla somma che hai davvero in mano mese per mese. Per questo, con questi dati, il risultato è ${P(a.taegRounded)}.`));

  fill("tassi", "TAN e TAEG, con i numeri del tuo documento", duo, h("div", { class: "table-wrap" }, table), why);
}

// ── Le rate ────────────────────────────────────────────────────────────

function renderRate() {
  const a = state.analysis;
  const rows = a.schedule;
  const r = rataInfo(a);
  const n = a.installments.count;
  const each = a.fees.filter((x) => x.timing === "each");
  const intro = [
    h("p", { class: "lead-s" },
      `Paghi ${n} rate da ${E(a.installments.amount)}`,
      each.length ? `, più ${E(each.reduce((s, x) => s + x.amount, 0))} di spese su ogni rata: ${E(r.regular)} a rata.` : ".",
      r.differs ? ` La prima rata è ${E(r.first)}, perché comprende anche altre spese.` : ""),
  ];
  if (a.upfront > 0) intro.push(h("p", {}, `Alla firma paghi ${E(a.upfront)} di spese, prima della prima rata.`));

  const max = Math.max(...rows.map((x) => x.total), 0.01);
  const chart = h("div", { class: "chart", "aria-hidden": "true" });
  for (const row of rows) {
    const col = h("div", { class: `col${row.k === 0 ? " col-start" : ""}` });
    const bar = h("div", { class: "bar" });
    bar.style.height = `${(row.total / max) * 100}%`;
    const segs = [["seg-p", row.principal], ["seg-i", Math.max(0, row.interest)], ["seg-f", row.fees]];
    for (const [cls, v] of segs) {
      if (v <= 0.004) continue;
      const s = h("span", { class: `bseg ${cls}` });
      s.style.height = `${(v / row.total) * 100}%`;
      bar.append(s);
    }
    const showLabel = row.k === 0 || row.k === 1 || row.k === n || n <= 12 || row.k % 12 === 0;
    append(col, [bar, h("span", { class: "col-lab" }, showLabel ? (row.k === 0 ? "firma" : String(row.k)) : "")]);
    chart.append(col);
  }
  const legend = h("p", { class: "legend" },
    h("span", { class: "key key-p", "aria-hidden": "true" }), "Capitale restituito",
    h("span", { class: "key key-i", "aria-hidden": "true" }), "Interessi",
    h("span", { class: "key key-f", "aria-hidden": "true" }), "Spese");

  const table = h("table", { class: "data" },
    h("caption", {}, "Piano dei pagamenti, mese per mese"),
    h("thead", {}, h("tr", {},
      ["Quando", "Paghi", "Capitale", "Interessi", "Spese", "Capitale ancora da restituire"].map((t, i) => h("th", { scope: "col", class: i ? "num" : null }, t)))),
    h("tbody", {}, rows.map((row) => h("tr", {},
      h("th", { scope: "row" }, row.k === 0 ? "Alla firma" : `Mese ${row.k}`),
      h("td", { class: "num" }, E(row.total)),
      h("td", { class: "num" }, row.k === 0 ? "—" : E(row.principal)),
      h("td", { class: "num" }, row.k === 0 ? "—" : E(Math.max(0, row.interest))),
      h("td", { class: "num" }, E(row.fees)),
      h("td", { class: "num" }, E(row.residual))))));
  const details = h("details", { class: "more", open: n <= 12 },
    h("summary", {}, "Vedi il piano come tabella"), h("div", { class: "table-wrap" }, table));

  fill("rate", "Le rate, una dopo l'altra", intro, h("figure", { class: "chart-box" }, chart, h("figcaption", {}, legend)), details);
}

// ── In cose di tutti i giorni ─────────────────────────────────────────

function renderCose() {
  const a = state.analysis;
  const out = h("div", { class: "cose-out", "aria-live": "polite" });
  const priceInput = h("input", { id: "unit-price", type: "text", inputmode: "decimal", autocomplete: "off", "aria-describedby": "unit-price-hint" });
  const priceLabel = h("label", { for: "unit-price" });
  const priceHint = h("p", { id: "unit-price-hint", class: "hint" }, "I prezzi sono indicativi: puoi cambiarli con quelli che paghi tu.");

  const update = () => {
    const unit = { ...UNITS.find((u) => u.id === state.unit) };
    const price = parseItNumber(priceInput.value);
    priceLabel.textContent = `Prezzo di ${unit.gender === "f" ? "una" : "un"} ${unit.one}, in euro`;
    out.replaceChildren();
    if (!(price > 0) || price > 100000) {
      priceInput.setAttribute("aria-invalid", "true");
      out.append(h("p", { class: "callout warn" }, "Scrivi un prezzo maggiore di zero, per esempio 1,20."));
      return;
    }
    priceInput.removeAttribute("aria-invalid");
    state.prices[unit.id] = price;
    unit.price = price;
    const ev = everyday(a.totalCost, unit);
    const grid = h("div", { class: "icons", "aria-hidden": "true" });
    const whole = Math.floor(ev.icons + 1e-9);
    for (let i = 0; i < whole; i++) grid.append(h("span", { class: "unit-ico" }, icon(unit.id)));
    const frac = ev.icons - whole;
    if (frac > 0.02) {
      const clip = h("span", { class: "clip" }, icon(unit.id));
      clip.style.width = `${frac * 100}%`;
      grid.append(h("span", { class: "unit-ico part" }, icon(unit.id, "ico ghost"), clip));
    }
    const perMonth = a.durationMonths > 0 ? a.totalCost / a.durationMonths : 0;
    append(out, [
      h("p", { class: "cose-big" }, `Il credito ti costa ${E(a.totalCost)}: è come ${ev.phrase}.`),
      grid,
      ev.per > 1 ? h("p", { class: "hint" }, `Ogni simbolo vale 10 ${unit.many}.`) : null,
      h("p", { class: "hint" }, `Il conto: ${ev.math}.`),
      a.durationMonths > 1 && perMonth > 0
        ? h("p", {}, `In media sono ${E(perMonth)} al mese per ${formatMonths(a.durationMonths)}: ${countPhrase(perMonth / price, unit)} al mese.`)
        : null,
    ]);
  };

  const radios = h("div", { class: "units" });
  for (const u of UNITS) {
    const input = h("input", { type: "radio", name: "unit", value: u.id, id: `unit-${u.id}` });
    input.checked = u.id === state.unit;
    input.addEventListener("change", () => {
      state.unit = u.id;
      priceInput.value = formatNumber(state.prices[u.id], 2);
      update();
    });
    radios.append(h("label", { class: "unit", for: `unit-${u.id}` }, input, icon(u.id), h("span", { class: "unit-name" }, u.one), h("span", { class: "unit-price" }, E(state.prices[u.id]))));
  }
  priceInput.value = formatNumber(state.prices[state.unit], 2);
  priceInput.addEventListener("input", update);

  fill("cose", "Il costo in cose di tutti i giorni",
    h("p", {}, `Un numero come ${E(a.totalCost)} può dire poco. Proviamo a vederlo in cose che compri spesso.`),
    h("fieldset", { class: "units-box" }, h("legend", {}, "Scegli un oggetto"), radios),
    h("div", { class: "price-row" }, priceLabel, priceInput, priceHint),
    out);
  update();
}

// ── Controllo dei numeri ───────────────────────────────────────────────

function renderControllo() {
  const { parsed: p, analysis: a } = state;
  const list = h("ul", { class: "checks" });
  for (const c of a.checks) {
    const m = coherenceMessage(c);
    list.append(h("li", { class: `check ${m.match ? "ok" : "warn"}` },
      h("p", { class: "check-head" },
        h("span", { class: "check-ico", "aria-hidden": "true" }, iconSmall(m.match ? "ok" : "warn")),
        strong(m.name), h("span", { class: "pill" }, m.match ? "Coincide" : "Non coincide")),
      h("p", {}, m.text)));
  }
  const kids = [h("p", {}, "Rifacciamo i conti con i numeri scritti nel documento, con il metodo della direttiva europea sul credito ai consumatori (2008/48/CE).")];
  kids.push(a.checks.length ? list : h("p", { class: "callout" }, "Il documento non scrive né il TAEG né l'importo totale dovuto: non c'è un numero da confrontare. Trovi comunque il TAEG calcolato in «TAN e TAEG»."));

  const taegCheck = a.checks.find((c) => c.key === "taeg");
  if (taegCheck && !taegCheck.match) {
    const credit = toCredit(p).credit;
    const noFees = roundTo(computeTaeg({ ...credit, fees: [] }), 2);
    if (Math.abs(noFees - taegCheck.declared) <= 0.011) {
      kids.push(h("p", { class: "callout" }, `Rifacendo il conto senza le spese, il risultato è ${P(noFees)}: lo stesso numero scritto nel documento. Il TAEG, per definizione, comprende anche le spese obbligatorie.`));
    }
  }

  const assumptions = h("ol", { class: "steps" },
    h("li", {}, `Ricevi tutto il credito subito: ${E(a.creditAmount)}.`),
    h("li", {}, a.installments.periodsPerYear === 12 ? "Paghi la prima rata un mese dopo, poi una rata al mese." : "Paghi la prima rata dopo un periodo, poi una a ogni scadenza."),
    h("li", {}, "Ogni mese vale 1/12 di anno, come prevede la direttiva."),
    a.fees.map((x) => h("li", { class: x.assumed ? "assumed" : null }, `${x.label}: ${E(x.amount)}, ${timingText(x)}.`)));

  const flows = a.flows;
  const rowsFlow = [
    ...flows.drawdowns.map((d) => ({ when: "Alla firma", what: "Ricevi il credito", amount: `+ ${E(d.amount)}` })),
    ...flows.payments.map((x) => ({ when: x.k === 0 ? "Alla firma" : `Mese ${x.k}`, what: x.items.map((it) => `${it.label} ${E(it.amount)}`).join(" + "), amount: `− ${E(x.amount)}` })),
  ];
  const flowTable = h("table", { class: "data" },
    h("caption", {}, "Tutti i movimenti di denaro usati nel calcolo"),
    h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Quando"), h("th", { scope: "col" }, "Cosa"), h("th", { scope: "col", class: "num" }, "Importo"))),
    h("tbody", {}, rowsFlow.map((r) => h("tr", {}, h("th", { scope: "row" }, r.when), h("td", {}, r.what), h("td", { class: "num" }, r.amount)))));

  const pays = flows.payments.filter((x) => x.k > 0);
  const term = (x) => `${E(x.amount)} ÷ (1+X)^(${x.k}/12)`;
  const formula = pays.length > 3
    ? `${term(pays[0])} + ${term(pays[1])} + … + ${term(pays[pays.length - 1])}`
    : pays.map(term).join(" + ");
  const start = flows.payments.find((x) => x.k === 0);
  const left = start ? `${E(a.creditAmount)} − ${E(start.amount)}` : E(a.creditAmount);

  fill("controllo", "Controllo dei numeri", kids,
    h("h4", {}, "Come abbiamo fatto il conto"), assumptions,
    h("details", { class: "more" }, h("summary", {}, "I pagamenti uno per uno"), h("div", { class: "table-wrap" }, flowTable)),
    h("details", { class: "more" }, h("summary", {}, "La formula"),
      h("p", {}, "Il programma cerca il tasso annuo X per cui quello che ricevi è uguale a tutti i pagamenti «riportati a oggi»: un pagamento fatto dopo t anni conta come pagamento ÷ (1+X)^t."),
      h("p", { class: "formula" }, `${left} = ${formula}`),
      h("p", {}, `Risultato: X = ${P(a.taegRounded)}.`)));
}

function iconSmall(id) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "ico-s");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const use = document.createElementNS(NS, "use");
  use.setAttribute("href", "#i-" + id);
  svg.append(use);
  return svg;
}

// ── Frase per frase ────────────────────────────────────────────────────

function pairList(items, cls = "") {
  return h("ol", { class: `pairs ${cls}` }, items.map((it) => h("li", { class: "pair" },
    h("div", { class: "orig" }, h("span", { class: "lab" }, "Il documento dice"), h("blockquote", { class: "quote" }, it.quote)),
    h("div", { class: "plain" }, h("span", { class: "lab" }, it.origin === "ai" ? "In parole semplici · scritto dall'AI" : "In parole semplici"), h("p", {}, it.plain)))));
}

function renderFrasi() {
  if (!state.analysis) return;
  const items = plainSentences(state.parsed, state.analysis);
  const aiBox = h("div", { class: "ai-box" });
  if (state.ai) {
    const btn = h("button", { type: "button", class: "btn primary" }, "Spiegamelo in parole semplici con l'AI");
    const status = h("p", { class: "small", role: "status" });
    const res = h("div");
    btn.addEventListener("click", () => aiExplain(btn, status, res));
    append(aiBox, [
      h("h4", {}, "Vuoi un'altra spiegazione?"),
      h("p", {}, "L'AI può riscrivere altre frasi del documento. Il programma controlla ogni frase: deve citare il documento parola per parola, usare solo numeri che compaiono nei dati e non dare consigli. Le frasi che non passano vengono scartate."),
      h("div", { class: "row" }, btn), status, res,
    ]);
    if (state.aiItems) showAiItems(state.aiItems, res, status);
  } else {
    aiBox.append(h("p", { class: "small" }, "L'aiuto dell'AI non è attivo su questo computer. Le spiegazioni qui sopra sono scritte dalle regole del programma e bastano per leggere il documento."));
  }
  fill("frasi", "Frase per frase",
    h("p", {}, "A sinistra la frase del documento, a destra la stessa cosa in parole semplici. Le frasi semplici le scrivono le regole del programma, con i numeri letti nel documento."),
    pairList(items), aiBox);
}

async function aiExplain(btn, status, res) {
  btn.disabled = true;
  btn.setAttribute("aria-busy", "true");
  status.textContent = "Sto chiedendo all'AI. Può volerci qualche secondo.";
  const r = await postJson("/api/explain", { text: state.text, aiFields: state.aiFields });
  btn.disabled = false;
  btn.removeAttribute("aria-busy");
  if (!r.ok || !Array.isArray(r.data.items)) {
    status.textContent = `L'AI non ha dato una risposta utilizzabile${r.data.reason ? ` (${r.data.reason})` : ""}. Restano le spiegazioni del programma.`;
    return;
  }
  state.aiItems = r.data;
  showAiItems(r.data, res, status);
}

function showAiItems(data, res, status) {
  const dropped = data.dropped || [];
  status.textContent = `L'AI ha scritto ${data.items.length === 1 ? "1 frase che ha passato i controlli" : `${data.items.length} frasi che hanno passato i controlli`}.${dropped.length ? ` ${dropped.length === 1 ? "Una frase è stata scartata" : `${dropped.length} frasi sono state scartate`}: ${dropped.map((d) => d.reason).join("; ")}.` : ""}`;
  res.replaceChildren(pairList(data.items, "ai"));
}

// ── Confronta due offerte ──────────────────────────────────────────────

function compareCandidates() {
  const list = [...sampleModels];
  if (!state.sampleId) {
    list.unshift({
      id: "current", label: "Il tuo documento", name: state.parsed.fields.lender?.value || "il tuo documento",
      parsed: state.parsed, analysis: state.analysis, declaredTaeg: state.parsed.fields.taeg?.value,
    });
  }
  return list;
}

function renderConfronta() {
  const cands = compareCandidates();
  const out = h("div", { class: "cmp-out", "aria-live": "polite" });
  const mkSelect = (key, label) => {
    const sel = h("select", { id: `cmp-${key}` }, cands.map((c) => h("option", { value: c.id }, c.label)));
    sel.value = state.compare[key];
    sel.addEventListener("change", () => { state.compare[key] = sel.value; draw(); });
    return h("div", { class: "field" }, h("label", { for: `cmp-${key}` }, label), sel);
  };
  const draw = () => {
    out.replaceChildren();
    const A = cands.find((c) => c.id === state.compare.a);
    const B = cands.find((c) => c.id === state.compare.b);
    if (!A || !B) return;
    if (A.id === B.id) {
      out.append(h("p", { class: "callout" }, "Hai indicato lo stesso documento due volte: seleziona due documenti diversi per vederli affiancati."));
      return;
    }
    const cmp = compareOffers(A, B);
    const table = h("table", { class: "data cmp" },
      h("caption", {}, "Le due offerte, una accanto all'altra"),
      h("thead", {}, h("tr", {}, h("td", {}), h("th", { scope: "col" }, `A · ${A.name}`), h("th", { scope: "col" }, `B · ${B.name}`))),
      h("tbody", {}, cmp.rows.map((r) => h("tr", {}, h("th", { scope: "row" }, r.label), h("td", {}, r.a), h("td", {}, r.b)))));
    append(out, [
      h("div", { class: "table-wrap" }, table),
      h("h4", {}, "I fatti, senza classifiche"),
      h("ul", { class: "facts" }, cmp.facts.map((t) => h("li", {}, t))),
      h("p", { class: "callout" }, cmp.note),
    ]);
  };
  fill("confronta", "Confronta due offerte",
    h("p", {}, "Metti due documenti uno accanto all'altro. Vedi solo i fatti: quanto costa ciascuno, quanto dura, quanto è la rata. Nessuna classifica."),
    h("div", { class: "cmp-pick" }, mkSelect("a", "Offerta A"), mkSelect("b", "Offerta B")),
    out);
  draw();
}

// ── Quiz ───────────────────────────────────────────────────────────────

function quizForm(round, answers, { feedback, onAnswer }) {
  const form = h("div", { class: "quiz" });
  state.quiz.forEach((q, qi) => {
    const fb = h("div", { class: "fb", "aria-live": "polite" });
    const showFb = () => {
      fb.replaceChildren();
      if (!feedback || answers[q.id] == null) return;
      const ok = answers[q.id] === q.correct;
      append(fb, [
        h("p", { class: ok ? "fb-ok" : "fb-no" }, iconSmall(ok ? "ok" : "warn"), strong(ok ? " Giusto." : " Non proprio."), " ", ok ? "" : `La risposta è: ${q.options[q.correct]}. `, q.explain),
        h("p", { class: "small" }, `Dove lo trovi nel documento: «${q.where}».`),
      ]);
    };
    const opts = q.options.map((o, oi) => {
      const id = `${round}-${q.id}-${oi}`;
      const input = h("input", { type: "radio", name: `${round}-${q.id}`, id, value: String(oi) });
      input.checked = answers[q.id] === oi;
      input.addEventListener("change", () => { answers[q.id] = oi; showFb(); onAnswer?.(); });
      return h("label", { class: "opt", for: id }, input, h("span", {}, o));
    });
    form.append(h("fieldset", { class: "q" }, h("legend", {}, h("span", { class: "qn" }, `Domanda ${qi + 1} di ${state.quiz.length}`), q.text), opts, fb));
    showFb();
  });
  return form;
}

function renderPrequiz() {
  const box = byId("prequiz");
  box.replaceChildren();
  const pre = state.pre;
  const n = state.quiz.length;
  box.hidden = pre.status === "skipped";
  if (pre.status === "offer") {
    append(box, [
      h("h3", {}, "Prima di leggere: ", n, " domande veloci?"),
      h("p", {}, "Rispondi come ti viene, senza cercare nel documento. Alla fine rifai le stesse domande e vedi cosa è cambiato. Il punteggio resta in questa pagina."),
      h("div", { class: "row" },
        h("button", { type: "button", class: "btn primary", onclick: () => { pre.status = "running"; renderPrequiz(); byId("prequiz").querySelector?.("input")?.focus(); } }, "Inizia le domande"),
        h("button", { type: "button", class: "btn ghost", onclick: () => { pre.status = "skipped"; renderPrequiz(); renderQuiz(); byId("tab-sintesi").focus(); } }, "Salta, vai alla spiegazione")),
    ]);
  } else if (pre.status === "running") {
    append(box, [
      h("h3", {}, "Prima di leggere"),
      h("p", {}, "Le risposte giuste le scopri alla fine, nella parte «Quiz»."),
      quizForm("prima", pre.answers, { feedback: false }),
      h("div", { class: "row" }, h("button", {
        type: "button", class: "btn primary",
        onclick: () => {
          pre.score = scoreQuiz(state.quiz, pre.answers);
          pre.status = "done";
          renderPrequiz();
          renderQuiz();
          byId("prequiz").focus();
        },
      }, "Ho finito")),
    ]);
  } else if (pre.status === "done") {
    box.setAttribute("tabindex", "-1");
    append(box, [
      h("h3", {}, `Prima di leggere: ${pre.score} ${pre.score === 1 ? "risposta giusta" : "risposte giuste"} su ${n}`),
      h("p", {}, "Ora leggi la spiegazione qui sotto. Nella parte «Quiz» rifai le stesse domande e vedi le risposte."),
    ]);
  }
}

function renderQuiz() {
  const n = state.quiz.length;
  const pre = state.pre;
  const post = state.post;
  const score = h("div", { class: "score", "aria-live": "polite" });
  const drawScore = () => {
    score.replaceChildren();
    const answered = state.quiz.filter((q) => post.answers[q.id] != null).length;
    if (answered < n) {
      score.append(h("p", { class: "small" }, `Hai risposto a ${answered === 1 ? "1 domanda" : `${answered} domande`} su ${n}.`));
      return;
    }
    const after = scoreQuiz(state.quiz, post.answers);
    const bar = (label, v, cls) => {
      const fillEl = h("span", { class: `meter-fill ${cls}` });
      fillEl.style.width = `${(v / n) * 100}%`;
      return h("div", { class: "meter-row" }, h("span", { class: "meter-lab" }, label), h("span", { class: "meter", "aria-hidden": "true" }, fillEl), h("span", { class: "meter-val" }, `${v} su ${n}`));
    };
    append(score, [
      h("h4", {}, pre.status === "done" ? "Prima e dopo" : "Il tuo risultato"),
      pre.status === "done" ? bar("Prima di leggere", pre.score, "m-before") : null,
      bar("Dopo la spiegazione", after, "m-after"),
      pre.status !== "done" ? h("p", { class: "small" }, "Non hai fatto le domande iniziali: va bene lo stesso.") : null,
      h("p", { class: "small" }, "È una prova per te, non un esame: il punteggio non viene salvato né inviato."),
    ]);
  };
  fill("quiz", "Quiz: hai capito il tuo documento?",
    pre.status === "done" ? h("p", {}, `Prima di leggere avevi risposto giusto a ${pre.score === 1 ? "1 domanda" : `${pre.score} domande`} su ${n}. Ecco le stesse domande, questa volta con le risposte.`) : h("p", {}, "Rispondi alle domande: dopo ogni risposta vedi se è giusta e dove la trovi nel documento."),
    quizForm("dopo", post.answers, { feedback: true, onAnswer: drawScore }),
    score,
    h("div", { class: "row" }, h("button", { type: "button", class: "btn ghost", onclick: () => { state.post = { answers: {} }; renderQuiz(); } }, "Ricomincia le domande")));
  drawScore();
}

// ── Documento originale ────────────────────────────────────────────────

function renderOriginal() {
  const pre = byId("original");
  pre.replaceChildren();
  const p = state.parsed;
  const text = p.text;
  const ranges = [];
  for (const [k, f] of Object.entries(p.fields)) {
    // Evidenzio solo i dati usati nei conti (e il finanziatore), non i testi descrittivi.
    if (FIELD_NAMES[k] && Number.isFinite(f.valueStart)) ranges.push({ start: f.valueStart, end: f.valueEnd, label: FIELD_NAMES[k] });
  }
  for (const f of p.fees) if (Number.isFinite(f.valueStart)) ranges.push({ start: f.valueStart, end: f.valueEnd, label: FEE_NAMES[f.kind] || f.label });
  ranges.sort((x, y) => x.start - y.start);
  let pos = 0;
  for (const r of ranges) {
    if (r.start < pos) continue;
    pre.append(document.createTextNode(text.slice(pos, r.start)));
    pre.append(h("mark", { title: r.label }, text.slice(r.start, r.end)));
    pos = r.end;
  }
  pre.append(document.createTextNode(text.slice(pos)));
}

init();
