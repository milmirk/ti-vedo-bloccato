/*
 * Ti vedo bloccato — lettura del contesto della pagina.
 *
 * Costruisce una descrizione compatta di "dove si trova" la persona: titolo del
 * passo, campo su cui è ferma, errori mostrati, campi obbligatori ancora vuoti,
 * pulsanti disponibili. Serve all'agente per scrivere un suggerimento mirato.
 *
 * Privacy by design: non legge MAI il valore dei campi (solo se sono compilati
 * sì/no) e maschera nei testi i dati personali riconoscibili (email, codice
 * fiscale, numeri lunghi).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TVB = Object.assign(root.TVB || {}, api);
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const MAX_TEXT = 300;
  const MAX_CANDIDATES = 30;
  const MAX_DISABLED = 3; // es. i giorni grigi di un calendario: ne bastano pochi
  const MAX_TEXTS = 6;
  const FIELD_SELECTOR = "input:not([type=hidden]), select, textarea";
  const ACTION_SELECTOR = "button, a[href], [role=button], [role=link], input[type=submit], input[type=button]";
  const CONTROL_SELECTOR = FIELD_SELECTOR + ", " + ACTION_SELECTOR;
  const EDITABLE = '[contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]';

  // Dati personali da non mandare mai fuori dalla pagina.
  const REDACTIONS = [
    [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]"],
    [/\b[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]\b/gi, "[codice fiscale]"],
    [/\bIT\d{2}[A-Z]\d{10}[0-9A-Z]{12}\b/gi, "[IBAN]"],
    [/(?:\+?\d[\s.-]?){6,}/g, "[numero]"],
  ];

  function redact(text) {
    return REDACTIONS.reduce((acc, [re, label]) => acc.replace(re, label), text);
  }

  // Prima maschero, poi taglio: un taglio a metà di un'email la renderebbe irriconoscibile.
  function clean(text, max) {
    const t = redact(String(text || "").replace(/\s+/g, " ").trim());
    const limit = max || MAX_TEXT;
    return t.length > limit ? t.slice(0, limit - 1) + "…" : t;
  }

  let counter = 0;
  function refOf(el) {
    if (!el || !el.getAttribute) return null;
    let r = el.getAttribute("data-tvb-ref");
    if (!r) {
      counter += 1;
      r = "r" + counter;
      el.setAttribute("data-tvb-ref", r);
    }
    return r;
  }

  function byRef(ref) {
    return ref ? document.querySelector('[data-tvb-ref="' + ref + '"]') : null;
  }

  function isVisible(el) {
    if (!el || !el.getClientRects || el.getClientRects().length === 0) return false;
    const style = getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  }

  function textOfIds(ids) {
    return String(ids || "")
      .split(/\s+/)
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .map((n) => n.textContent)
      .join(" ");
  }

  // Il nome come lo legge una persona: senza l'asterisco degli obbligatori.
  function labelOf(el) {
    return rawLabelOf(el).replace(/\s*\*+\s*$/, "").trim();
  }

  function rawLabelOf(el) {
    if (!el) return "";
    const aria = el.getAttribute("aria-label");
    if (aria) return clean(aria, 120);
    const labelledby = el.getAttribute("aria-labelledby");
    if (labelledby) return clean(textOfIds(labelledby), 120);
    if (el.id) {
      const lab = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      if (lab) return clean(lab.textContent, 120);
    }
    // Un gruppo di radio si chiama come la sua legenda, non come la prima opzione.
    if (el.type === "radio") {
      const fs = el.closest("fieldset");
      const legend = fs && fs.querySelector("legend");
      if (legend) return clean(legend.textContent, 120);
    }
    const wrap = el.closest && el.closest("label");
    if (wrap) return clean(wrap.textContent, 120);
    if (el.matches && el.matches(FIELD_SELECTOR)) {
      return clean(el.getAttribute("placeholder") || el.getAttribute("title") || el.name || "", 120);
    }
    // Il testo visibile è il nome solo per pulsanti e link, mai per testo libero.
    if (el.matches && el.matches(ACTION_SELECTOR)) {
      return clean(el.textContent || el.getAttribute("title") || el.getAttribute("alt") || "", 120);
    }
    return clean(el.getAttribute("title") || "", 120);
  }

  function isDisabled(el) {
    return !!(el && (el.disabled || el.getAttribute("aria-disabled") === "true" || (el.closest && el.closest("fieldset[disabled]"))));
  }

  function isFilled(el) {
    if (!el || !el.matches || !el.matches(FIELD_SELECTOR)) return null;
    if (el.type === "checkbox") return el.checked;
    if (el.type === "radio") {
      const form = el.form || document;
      return !!form.querySelector('input[type=radio][name="' + CSS.escape(el.name) + '"]:checked');
    }
    return String(el.value || "").trim() !== "";
  }

  function errorOf(el) {
    if (!el) return "";
    const parts = [];
    const described = el.getAttribute("aria-describedby") || el.getAttribute("aria-errormessage");
    if (described && el.getAttribute("aria-invalid") === "true") parts.push(textOfIds(described));
    if (!parts.length && el.validity && !el.validity.valid && el.dataset.tvbTouched) {
      parts.push(nativeError(el.validity));
    }
    return clean(parts.join(" "), 200);
  }

  // Il messaggio del browser può citare il valore scritto ("'mario.rossi' non
  // contiene @"): uso frasi fisse in base al tipo di errore.
  function nativeError(v) {
    if (v.valueMissing) return "Campo obbligatorio";
    if (v.typeMismatch || v.patternMismatch || v.badInput) return "Formato non valido";
    if (v.tooShort) return "Testo troppo corto";
    if (v.tooLong) return "Testo troppo lungo";
    if (v.rangeUnderflow || v.rangeOverflow || v.stepMismatch) return "Valore fuori dall'intervallo ammesso";
    return "Valore non valido";
  }

  function isControl(el) {
    return !!(el && el.matches && el.matches(CONTROL_SELECTOR) && !el.closest(EDITABLE));
  }

  function kindOf(el) {
    if (el.matches(FIELD_SELECTOR)) {
      if (el.type === "checkbox") return "casella";
      if (el.type === "radio") return "opzione";
      if (el.tagName === "SELECT") return "menu";
      return "campo";
    }
    if (el.tagName === "A" || el.getAttribute("role") === "link") return "link";
    return "pulsante";
  }

  function describe(el) {
    const d = { ref: refOf(el), kind: kindOf(el), label: labelOf(el) };
    if (isDisabled(el)) d.disabled = true;
    if (el.required || el.getAttribute("aria-required") === "true") d.required = true;
    const filled = isFilled(el);
    if (filled !== null) d.filled = filled;
    const err = errorOf(el);
    if (err) d.error = err;
    return d;
  }

  // La zona "attiva": il form o la sezione principale che contiene il bersaglio.
  function firstVisible(root, selector) {
    return Array.from((root || document).querySelectorAll(selector)).find(isVisible) || null;
  }

  function scopeFor(target) {
    const host = target && target.closest && target.closest("form, [role=form], main, [role=main]");
    return host || firstVisible(document, "form, [role=form]") || firstVisible(document, "main, [role=main]") || document.body;
  }

  function headingOf(scope) {
    const h = firstVisible(scope, "h1, h2, legend") || firstVisible(document, "h1, h2");
    return h ? clean(h.textContent, 160) : "";
  }

  function stepOf() {
    const current = document.querySelector('[aria-current="step"]');
    if (current) return clean(current.textContent, 120);
    const m = (document.body.innerText || "").match(/passo\s+\d+\s+di\s+\d+/i);
    return m ? m[0] : "";
  }

  // Firma del passo corrente: cambia quando la persona va avanti o indietro.
  // Preferisco gli indicatori espliciti del passo; ignoro le ancore "#" interne
  // e i titoli secondari, che cambiano anche quando il passo resta lo stesso.
  function stepSignature() {
    const step = stepOf();
    if (step) return location.pathname + "|" + step;
    const form = firstVisible(document, "form[id], [role=form][id]");
    const h1 = firstVisible(document, "h1");
    return [location.pathname, form ? form.id : "", h1 ? clean(h1.textContent, 120) : ""].join("|");
  }

  function nearbyTexts(scope, target) {
    const out = [];
    const seen = new Set();
    const push = (t) => {
      const c = clean(t);
      if (c.length > 12 && !seen.has(c)) { seen.add(c); out.push(c); }
    };
    const usable = (n) => isVisible(n) && !n.closest("[data-tvb-host]") && !n.closest(EDITABLE) && !n.querySelector(EDITABLE);
    document.querySelectorAll('[role=alert], [aria-live="assertive"], .alert, .error, .invalid-feedback').forEach((n) => {
      if (usable(n)) push(n.textContent);
    });
    if (target) {
      const block = target.closest(".form-group, .field, fieldset");
      if (block && usable(block)) push(block.textContent);
    }
    scope.querySelectorAll("p, .help, .form-text, small").forEach((n) => {
      if (out.length < MAX_TEXTS && usable(n)) push(n.textContent);
    });
    return out.slice(0, MAX_TEXTS);
  }

  function buildContext(signal, target) {
    const scope = scopeFor(target);
    if (target && !isControl(target)) target = null;
    const elements = Array.from(scope.querySelectorAll(CONTROL_SELECTOR))
      .filter((el) => isVisible(el) && isControl(el) && !el.closest("[data-tvb-host]"));

    // Per i radio basta un rappresentante per gruppo.
    const groups = new Set();
    const unique = elements.filter((el) => {
      if (el.type !== "radio") return true;
      if (groups.has(el.name)) return false;
      groups.add(el.name);
      return true;
    });

    // Prima gli elementi attivi; dei disattivati ne tengo pochi, così un
    // calendario pieno di giorni grigi non nasconde gli orari e «Avanti».
    let disabledKept = 0;
    const picked = unique.filter((el) => !isDisabled(el) || el === target
      || el.type === "submit" || disabledKept++ < MAX_DISABLED);
    const candidates = picked.slice(0, MAX_CANDIDATES).map(describe);
    if (target && !candidates.some((c) => c.ref === refOf(target))) candidates.unshift(describe(target));

    const missing = candidates
      .filter((c) => c.required && c.filled === false)
      .map((c) => ({ ref: c.ref, kind: c.kind, label: c.label }));

    const detail = {};
    Object.keys(signal.detail || {}).forEach((k) => {
      const v = signal.detail[k];
      if (typeof v === "string") detail[k] = clean(v, 200);
      else if (typeof v === "number" || typeof v === "boolean") detail[k] = v;
    });

    return {
      signal: { type: signal.type, detail },
      page: {
        title: clean(document.title, 120),
        site: location.hostname,
        heading: headingOf(scope),
        step: stepOf(),
      },
      target: target ? describe(target) : null,
      missing,
      candidates,
      texts: nearbyTexts(scope, target),
    };
  }

  return { buildContext, refOf, byRef, labelOf, isDisabled, isVisible, isControl, stepSignature, redact, FIELD_SELECTOR, EDITABLE };
});
