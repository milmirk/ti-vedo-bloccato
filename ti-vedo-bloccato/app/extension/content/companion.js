/*
 * Ti vedo bloccato — il compagno nella pagina.
 *
 * 1. Osserva  → trasforma gli eventi del DOM in eventi per il detector
 * 2. Capisce  → quando scatta un segnale, legge il contesto (context.js)
 * 3. Aiuta    → chiede UN suggerimento all'agente (o alle regole) e lo mostra
 * 4. Impara   → "Non ora" / "Mi è servito" regolano le soglie del detector
 *
 * Funziona in due modi:
 *  - come content script dell'estensione Chrome (chrome.runtime disponibile)
 *  - in "modalità demo", caricato direttamente dalla pagina di prova
 */
(function () {
  "use strict";
  const IS_EXTENSION = typeof chrome !== "undefined" && !!(chrome.runtime && chrome.runtime.id);
  // Estensione e modalità demo vivono in "mondi" JavaScript separati: per non
  // partire due volte sulla stessa pagina uso un segno nel DOM, che è condiviso.
  const root = document.documentElement;
  if (window.top !== window || root.hasAttribute("data-tvb-active")) return;
  root.setAttribute("data-tvb-active", IS_EXTENSION ? "estensione" : "demo");

  const TVB = window.TVB;
  const HINT_TIMEOUT_MS = 9000;
  const DEFAULTS = { enabled: true, sensitivity: "media" };

  // ---------- impostazioni ----------
  const settings = Object.assign({}, DEFAULTS);

  function loadSettings() {
    if (IS_EXTENSION) {
      return new Promise((resolve) =>
        chrome.storage.local.get(DEFAULTS, (s) => resolve(Object.assign(settings, s)))
      );
    }
    try {
      Object.assign(settings, JSON.parse(localStorage.getItem("tvb-settings") || "{}"));
    } catch (_) { /* impostazioni corrotte: restano i default */ }
    return Promise.resolve(settings);
  }

  function saveSettings() {
    if (IS_EXTENSION) chrome.storage.local.set(settings);
    else localStorage.setItem("tvb-settings", JSON.stringify(settings));
  }

  // ---------- richiesta del suggerimento ----------
  // In modalità demo chiedo una volta sola se l'agente AI è attivo: se non lo
  // è, uso subito le regole senza chiamate inutili.
  let aiReady = null;
  function aiAvailable() {
    if (IS_EXTENSION) return Promise.resolve(true); // ci pensa il service worker
    if (!aiReady) {
      aiReady = fetch("/api/health").then((r) => r.json()).then((h) => !!h.ai).catch(() => false);
    }
    return aiReady;
  }

  async function askAgent(context) {
    if (!(await aiAvailable())) return null;
    const request = IS_EXTENSION
      ? new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: "tvb:hint", context }, (resp) => {
            resolve(chrome.runtime.lastError ? null : resp);
          });
        })
      : fetch("/api/hint", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ context }),
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), HINT_TIMEOUT_MS));
    return Promise.race([request, timeout]);
  }

  // ---------- interfaccia (Shadow DOM, isolata dagli stili del sito) ----------
  const CSS_TEXT = `
    :host { all: initial; }
    .card {
      box-sizing: border-box; width: 100%;
      background: #ffffff; color: #1a1a1a;
      border: 2px solid #460073; border-left-width: 6px; border-radius: 14px;
      box-shadow: 0 6px 20px rgba(10, 0, 20, 0.12);
      font: 17px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      padding: 16px 18px 12px;
    }
    .floating .card { box-shadow: 0 12px 40px rgba(10, 0, 20, 0.28); max-height: calc(100vh - 40px); overflow: auto; }
    .card[hidden] { display: none; }
    .head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .mark { color: #A100FF; font-weight: 800; font-size: 22px; line-height: 1; }
    .title { font-weight: 700; font-size: 16px; flex: 1; color: #460073; }
    .close {
      border: 0; background: transparent; font-size: 22px; line-height: 1;
      width: 36px; height: 36px; border-radius: 8px; cursor: pointer; color: #333;
    }
    .hint { font-size: 18px; margin: 4px 0 14px; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    button.act {
      min-height: 44px; padding: 0 16px; border-radius: 10px; cursor: pointer;
      font: 600 16px/1 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      border: 2px solid #460073; background: #fff; color: #460073;
    }
    button.primary { background: #A100FF; border-color: #A100FF; color: #fff; }
    button:focus-visible { outline: 3px solid #FF50A0; outline-offset: 2px; }
    details { margin-top: 12px; font-size: 14px; color: #444; }
    summary { cursor: pointer; min-height: 32px; line-height: 32px; }
    .orig { margin: 6px 0 0; padding: 8px 10px; background: #f4eefb; border-left: 4px solid #A100FF; border-radius: 6px; }
    .meta { margin-top: 6px; font-size: 13px; color: #555; }
    .prefs { margin-top: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 14px; }
    .prefs button {
      min-height: 32px; padding: 0 10px; border-radius: 8px; cursor: pointer;
      border: 1px solid #999; background: #fff; color: #222; font: 14px system-ui, sans-serif;
    }
    .prefs button[aria-pressed="true"] { background: #460073; color: #fff; border-color: #460073; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    @media (prefers-reduced-motion: no-preference) {
      .card:not([hidden]) { animation: in 180ms ease-out; }
      @keyframes in { from { transform: translateY(12px); opacity: 0; } to { transform: none; opacity: 1; } }
    }
  `;

  let ui = null;

  function buildUi() {
    const host = document.createElement("div");
    host.setAttribute("data-tvb-host", "");
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>${CSS_TEXT}</style>
      <div class="sr" role="status" aria-live="polite"></div>
      <div class="wrap">
      <section class="card" role="dialog" aria-modal="false" aria-labelledby="tvb-title" hidden>
        <div class="head">
          <span class="mark" aria-hidden="true">&gt;</span>
          <span class="title" id="tvb-title">Ti do una mano?</span>
          <button class="close" type="button" aria-label="Chiudi il suggerimento">×</button>
        </div>
        <p class="hint"></p>
        <div class="actions">
          <button class="act primary" type="button" data-act="show">Mostrami dove</button>
          <button class="act" type="button" data-act="ok">Mi è servito</button>
          <button class="act" type="button" data-act="later">Non ora</button>
        </div>
        <details>
          <summary>Perché me lo dici?</summary>
          <p class="why"></p>
          <p class="orig" hidden></p>
          <p class="meta"></p>
          <div class="prefs" role="group" aria-label="Quanto spesso intervenire">
            <span>Quanto spesso:</span>
            <button type="button" data-sens="bassa">di rado</button>
            <button type="button" data-sens="media">normale</button>
            <button type="button" data-sens="alta">spesso</button>
            <button type="button" data-act="pause">Pausa 10 minuti</button>
          </div>
        </details>
      </section>
      </div>`;

    const $ = (s) => shadow.querySelector(s);
    const card = $(".card");
    const refs = {
      host, card, wrap: $(".wrap"), live: $(".sr"), hint: $(".hint"), why: $(".why"), orig: $(".orig"),
      meta: $(".meta"), details: $("details"), show: $('[data-act="show"]'),
    };

    shadow.addEventListener("click", (e) => {
      lastAction = Date.now();
      const b = e.target.closest("button");
      if (!b) return;
      if (b.classList.contains("close")) return dismiss("non_ora");
      if (b.dataset.sens) return setSensitivity(b.dataset.sens);
      const act = b.dataset.act;
      if (act === "show") return showTarget();
      if (act === "ok") return dismiss("utile");
      if (act === "later") return dismiss("non_ora");
      if (act === "pause") { detector.pause(10 * 60 * 1000); return hideCard(); }
    });

    return refs;
  }

  function syncPrefs() {
    if (!ui) return;
    ui.card.querySelectorAll("[data-sens]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.sens === settings.sensitivity))
    );
  }

  let current = null; // { signal, hint }
  let highlighted = null;
  let autoHide = null;
  const AUTO_HIDE_MS = 60000;

  function showCard(signal, hint, anchorEl) {
    if (!ui) ui = buildUi();
    current = { signal, hint };
    fillCard(hint);
    ui.details.open = false;
    syncPrefs();
    ui.card.hidden = false;
    mount(anchorEl);
    document.dispatchEvent(new CustomEvent("tvb:hint-shown", { detail: { signal: signal.type, source: hint.source } }));
    scheduleAutoHide();
  }

  function fillCard(hint) {
    if (current) current.hint = hint;
    ui.hint.textContent = hint.hint;
    ui.why.textContent = hint.why || "";
    if (hint.original_quote) {
      ui.orig.hidden = false;
      ui.orig.textContent = "Testo originale della pagina: «" + hint.original_quote + "»";
    } else {
      ui.orig.hidden = true;
    }
    ui.meta.textContent = hint.source === "ai"
      ? "Suggerimento scritto dall'assistente AI. I nomi tra «» sono controllati sulla pagina."
      : "Suggerimento preparato con regole fisse, senza AI.";
    ui.show.hidden = !TVB.byRef(hint.target_ref);
    // Non rubo il focus: annuncio il suggerimento a chi usa lo screen reader.
    ui.live.textContent = "";
    setTimeout(() => { ui.live.textContent = "Suggerimento: " + hint.hint; }, 50);
  }

  // ---------- posizione: dentro la pagina, accanto al punto del blocco ----------
  // La scheda non galleggia sopra il sito: entra nel flusso della pagina subito
  // dopo il blocco su cui agire. Il testo che segue scende più in basso invece
  // di essere coperto. Solo se non trovo un punto adatto resta in un angolo.
  const BLOCK_LEVEL = /^(block|flow-root|list-item|flex|grid|table)$/;
  const FLOW_LAYOUT = /^(block|flow-root|list-item)$/;
  // Contenitori da non spezzare: un gruppo di opzioni, un'etichetta, un elenco.
  const NO_SPLIT = "fieldset, label, legend, p, ul, ol, dl, table, button, a, select, [role=radiogroup], [role=group]";
  const MIN_WIDTH = 340;

  function anchorFor(el) {
    if (!el || !el.isConnected || !TVB.isVisible(el)) return null;
    let node = el;
    while (node && node.parentElement && node !== document.body) {
      const parent = node.parentElement;
      const fits = BLOCK_LEVEL.test(getComputedStyle(node).display)
        && FLOW_LAYOUT.test(getComputedStyle(parent).display)
        && !parent.matches(NO_SPLIT)
        && parent.clientWidth >= MIN_WIDTH;
      if (fits && parent !== document.documentElement) return node;
      node = parent;
    }
    return null;
  }

  function setHostStyle(styles) {
    const host = ui.host;
    host.removeAttribute("style");
    Object.keys(styles).forEach((k) => host.style.setProperty(k, styles[k], "important"));
  }

  function mount(anchorEl) {
    const anchor = anchorFor(anchorEl);
    if (anchor) {
      setHostStyle({
        display: "block", position: "static", float: "none", clear: "both",
        width: "auto", "max-width": "640px", margin: "14px 0", padding: "0", border: "0",
      });
      ui.wrap.className = "wrap";
      anchor.after(ui.host);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      ui.host.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    } else {
      setHostStyle({
        display: "block", position: "fixed", right: "20px", bottom: "20px",
        width: "min(380px, calc(100vw - 40px))", "z-index": "2147483647", margin: "0",
      });
      ui.wrap.className = "wrap floating";
      document.documentElement.appendChild(ui.host);
    }
  }

  // Una scheda ignorata non deve restare per sempre e bloccare i suggerimenti
  // successivi: dopo un minuto si chiude da sola, senza contare come "Non ora".
  function scheduleAutoHide() {
    clearTimeout(autoHide);
    autoHide = setTimeout(() => {
      const root = ui.card.getRootNode();
      const inUse = ui.card.matches(":hover") || (root.activeElement && ui.card.contains(root.activeElement));
      if (inUse) return scheduleAutoHide();
      hideCard();
    }, AUTO_HIDE_MS);
  }

  function hideCard() {
    clearTimeout(autoHide);
    if (ui) { ui.card.hidden = true; ui.host.remove(); }
    clearHighlight();
    current = null;
  }

  function dismiss(verdict) {
    if (current) {
      detector.feedback(current.signal.type, verdict);
      document.dispatchEvent(new CustomEvent("tvb:feedback", { detail: { signal: current.signal.type, verdict } }));
    }
    hideCard();
  }

  function clearHighlight() {
    if (!highlighted) return;
    highlighted.el.style.outline = highlighted.outline;
    highlighted.el.style.outlineOffset = highlighted.offset;
    highlighted = null;
  }

  function showTarget() {
    const el = current && TVB.byRef(current.hint.target_ref);
    if (!el) return;
    clearHighlight();
    highlighted = { el, outline: el.style.outline, offset: el.style.outlineOffset };
    el.style.outline = "4px solid #A100FF";
    el.style.outlineOffset = "4px";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    // Su richiesta esplicita porto lì anche il focus, se è un elemento attivabile.
    if (typeof el.focus === "function" && !TVB.isDisabled(el)) {
      setTimeout(() => { ignoreNextFocus = true; el.focus({ preventScroll: true }); }, 300);
    }
    setTimeout(clearHighlight, 8000);
  }

  function setSensitivity(level) {
    settings.sensitivity = level;
    detector.setSensitivity(level);
    saveSettings();
    syncPrefs();
  }

  // ---------- osservazione ----------
  const detector = TVB.createDetector({ sensitivity: settings.sensitivity });
  let lastField = null;
  let signature = TVB.stepSignature();
  let ignoreNextFocus = false;
  let lastAction = 0;
  // Finestra in cui il testo dell'AI può sostituire quello a regole già mostrato.
  const AI_SWAP_MS = 6000;

  // La scheda compare SUBITO con il suggerimento a regole. Se nel frattempo
  // arriva quello dell'AI e la persona non ha ancora fatto nulla, lo sostituisco:
  // non cambio le parole sotto gli occhi di chi sta già agendo.
  function handle(signals, targetEl) {
    if (!settings.enabled || !signals.length || current) return; // un suggerimento alla volta
    const signal = signals[0];
    const target = targetEl
      || TVB.byRef(signal.target)
      || (document.activeElement && document.activeElement.matches && document.activeElement.matches(TVB.FIELD_SELECTOR) ? document.activeElement : null)
      || lastField;
    const context = TVB.buildContext(signal, target);
    const quick = TVB.fallbackHint(context);
    const anchor = TVB.byRef(quick.target_ref) || TVB.byRef(context.target && context.target.ref)
      || document.querySelector("main h1, form h1, h1");
    showCard(signal, quick, anchor);
    const shownAt = Date.now();
    const startedOn = signature;

    askAgent(context).then((ai) => {
      if (!ai || !ai.hint || !current || current.signal !== signal) return;
      if (signature !== startedOn || lastAction > shownAt || Date.now() - shownAt > AI_SWAP_MS) return;
      fillCard(ai);
    });
  }

  function record(ev, targetEl) {
    if (ev.type === "activity" || ev.type === "click" || ev.type === "change" || ev.type === "invalid") lastAction = Date.now();
    handle(detector.record(ev), targetEl);
  }

  function inOurUi(e) {
    return e.composedPath().some((n) => n.hasAttribute && n.hasAttribute("data-tvb-host"));
  }

  // Click su controlli disabilitati: il browser non sempre consegna l'evento al
  // controllo, quindi cerco sotto il puntatore.
  function controlAt(e) {
    const stack = document.elementsFromPoint(e.clientX, e.clientY);
    const disabled = stack.find((n) => n.matches && n.matches("button, input, select, textarea, [role=button]") && TVB.isDisabled(n));
    if (disabled) return disabled;
    const t = e.target.closest ? e.target.closest("button, a, input, select, textarea, label, [role=button], [role=link]") : null;
    return t || e.target;
  }

  // Nei campi di testo e nei menu i click servono a spostare il cursore o a
  // selezionare: sono attività normale, non un segnale.
  const TYPING = /^(text|email|tel|number|password|search|url|date|time|datetime-local|month|week|select-one|select-multiple|textarea)$/;

  document.addEventListener("pointerdown", (e) => {
    if (inOurUi(e)) return;
    const el = controlAt(e);
    if (!el || !TVB.isControl(el) || TYPING.test(el.type || "")) return record({ type: "activity" });
    const dead = TVB.isDisabled(el);
    record({ type: "click", target: TVB.refOf(el), dead }, el);
  }, true);

  // Dopo ogni tentativo di invio (mouse, Invio o tastiera) controllo quali
  // campi sono rimasti in errore.
  document.addEventListener("submit", (e) => {
    if (!inOurUi(e)) setTimeout(scanErrors, 150);
  }, true);

  document.addEventListener("focusin", (e) => {
    if (inOurUi(e)) return;
    const el = e.target;
    // Il focus che torna da solo al rientro nella scheda, o che portiamo noi
    // con «Mostrami dove», non è esitazione.
    if (ignoreNextFocus) { ignoreNextFocus = false; return; }
    if (el.matches && el.matches(TVB.FIELD_SELECTOR) && el.type !== "checkbox" && el.type !== "radio") {
      lastField = el;
      record({ type: "focus", target: TVB.refOf(el) }, el);
    }
  }, true);

  window.addEventListener("blur", (e) => { if (e.target === window) ignoreNextFocus = true; });

  document.addEventListener("input", (e) => {
    if (inOurUi(e)) return;
    const el = e.target;
    if (el.dataset) el.dataset.tvbTouched = "1";
    record({ type: "change", target: TVB.refOf(el) }, el);
  }, true);

  document.addEventListener("change", (e) => {
    if (inOurUi(e)) return;
    record({ type: "change", target: TVB.refOf(e.target) }, e.target);
  }, true);

  // Errori di validazione nativi del browser.
  const recentErrors = new Map();
  function recordError(el) {
    const ref = TVB.refOf(el);
    const now = Date.now();
    if (now - (recentErrors.get(ref) || 0) < 600) return; // stesso tentativo
    recentErrors.set(ref, now);
    const ctx = TVB.buildContext({ type: "probe", detail: {} }, el);
    record({ type: "invalid", target: ref, message: (ctx.target && ctx.target.error) || "" }, el);
  }

  document.addEventListener("invalid", (e) => {
    if (e.target.dataset) e.target.dataset.tvbTouched = "1";
    recordError(e.target);
  }, true);

  // Errori mostrati dal sito (aria-invalid) dopo un tentativo di invio.
  function scanErrors() {
    document.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
      if (TVB.isVisible(el)) recordError(el);
    });
  }

  let lastPresence = 0;
  function presence(e) {
    if (inOurUi(e)) return;
    const now = Date.now();
    if (now - lastPresence < 2000) return;
    lastPresence = now;
    record({ type: "presence" });
  }
  document.addEventListener("mousemove", presence, { passive: true });
  document.addEventListener("scroll", presence, { passive: true, capture: true });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && current) return dismiss("non_ora");
    if (!inOurUi(e)) record({ type: "activity" });
  }, true);

  document.addEventListener("visibilitychange", () => {
    record({ type: document.hidden ? "hidden" : "visible" });
  });

  // Cambi di passo (URL, titolo del passo): avanti/indietro e fine del compito.
  const DONE = /(prenotazione|richiesta|domanda|pagamento|operazione)\s+(confermat|complet|inviat|eseguit|riuscit)|grazie per/i;
  setInterval(() => {
    const next = TVB.stepSignature();
    if (next !== signature) {
      signature = next;
      hideCard();
      record({ type: "step", id: next });
      if (DONE.test(next)) record({ type: "complete" });
    }
    handle(detector.tick());
  }, 1000);

  // Le impostazioni possono cambiare dal popup dell'estensione.
  if (IS_EXTENSION) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.sensitivity) setSensitivity(changes.sensitivity.newValue);
      if (changes.enabled) { settings.enabled = changes.enabled.newValue; if (!settings.enabled) hideCard(); }
    });
  }

  loadSettings().then(() => detector.setSensitivity(settings.sensitivity));
})();
