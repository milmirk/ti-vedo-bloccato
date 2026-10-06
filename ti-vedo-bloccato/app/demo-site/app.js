/*
 * Replica dimostrativa del flusso Agenda CIE, con gli stessi punti di attrito
 * del sito reale: testo legale lungo, errore criptico sul codice fiscale,
 * calendario senza disponibilità nel mese corrente, conferma disattivata finché
 * non si spunta l'informativa in fondo alla pagina.
 *
 * Registra anche le metriche della prova (tempo, errori, click a vuoto) per il
 * confronto prima/dopo: ?assistente=0 (senza) e ?assistente=1 (con).
 */
(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const assisted = params.get("assistente") === "1";
  const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const $ = (s) => document.querySelector(s);

  // ---------- modalità demo ----------
  const modeLabel = $("#mode-label");
  modeLabel.innerHTML = assisted
    ? '· Modalità: <strong>con assistente</strong> · <a href="?assistente=0">prova senza</a>'
    : '· Modalità: <strong>senza assistente</strong> · <a href="?assistente=1">prova con l\'assistente</a>';

  if (assisted) {
    const files = ["detector.js", "context.js", "fallback-hints.js", "companion.js"];
    files.reduce((p, f) => p.then(() => new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "/extension/content/" + f;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    })), Promise.resolve()).catch(() => {
      modeLabel.insertAdjacentHTML("beforeend", " · <strong>assistente non caricato</strong>");
    });
  }

  // ---------- metriche della prova ----------
  const metrics = { start: null, errors: 0, deadClicks: 0, backs: 0, hints: 0 };
  const touch = () => { if (!metrics.start) metrics.start = Date.now(); };
  document.addEventListener("input", touch, true);
  document.addEventListener("pointerdown", (e) => {
    touch();
    const stack = document.elementsFromPoint(e.clientX, e.clientY);
    const onDisabled = (n) => n && n.matches && n.matches("button:disabled");
    if (onDisabled(e.target) || stack.some(onDisabled)) metrics.deadClicks++;
  }, true);
  document.addEventListener("tvb:hint-shown", () => metrics.hints++);

  // ---------- navigazione tra i passi ----------
  let step = 1;

  function show(n, push) {
    step = n;
    document.querySelectorAll(".step").forEach((el) => (el.hidden = Number(el.dataset.step) !== n));
    document.querySelectorAll(".steps li").forEach((li) => {
      const s = Number(li.dataset.step);
      li.classList.toggle("done", s < n);
      if (s === n) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
    if (push) history.pushState({ step: n }, "", "#passo-" + n);
    window.scrollTo(0, 0);
    if (n === 3) renderCalendar();
    if (n === 4) renderSummary();
  }

  window.addEventListener("popstate", (e) => {
    const n = (e.state && e.state.step) || 1;
    if (n < step) metrics.backs++;
    show(Math.min(n, 4), false);
  });

  document.querySelectorAll("[data-back]").forEach((b) =>
    b.addEventListener("click", () => history.back())
  );

  // ---------- validazione (volutamente "da PA": messaggi poco chiari) ----------
  function setError(id, message) {
    const input = document.getElementById(id);
    const box = document.getElementById(id + "-err");
    if (message) {
      input.setAttribute("aria-invalid", "true");
      if (box) box.textContent = message;
      metrics.errors++;
      return false;
    }
    input.removeAttribute("aria-invalid");
    if (box) box.textContent = "";
    return true;
  }

  function banner(form, text) {
    let b = form.querySelector(".alert");
    if (!text) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement("div");
      b.className = "alert";
      b.setAttribute("role", "alert");
      form.querySelector("h1").after(b);
    }
    b.textContent = text;
  }

  $("#step-1").addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = $("#comune").value && document.querySelector("input[name=motivo]:checked");
    if (!ok) {
      metrics.errors++;
      banner(e.target, "Compilare tutti i campi obbligatori contrassegnati con *.");
      return;
    }
    banner(e.target, "");
    show(2, true);
  });

  const CF = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  $("#step-2").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = (id) => document.getElementById(id).value;
    const results = [
      setError("nome", v("nome").trim() ? "" : "Campo obbligatorio"),
      setError("cognome", v("cognome").trim() ? "" : "Campo obbligatorio"),
      // Il sito non accetta spazi né minuscole "sporche": il messaggio non lo dice.
      setError("cf", CF.test(v("cf")) ? "" : "Valore non conforme (ERR_CF_016)"),
      setError("tel", !v("tel") || /^\d{6,12}$/.test(v("tel")) ? "" : "Formato non valido"),
      setError("email", EMAIL.test(v("email")) ? "" : "Formato non valido"),
      setError("email2", v("email2") && v("email2") === v("email") ? "" : "I campi non coincidono"),
    ];
    const bad = results.filter((r) => !r).length;
    if (bad) {
      banner(e.target, "Sono presenti errori nel modulo (" + bad + ").");
      return;
    }
    banner(e.target, "");
    show(3, true);
  });

  // ---------- calendario ----------
  const today = new Date();
  let viewOffset = 0; // 0 = mese corrente (nessuna disponibilità), 1 = mese dopo
  let chosen = { day: null, slot: null };

  function renderCalendar() {
    const base = new Date(today.getFullYear(), today.getMonth() + viewOffset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    $("#cal-month").textContent = MONTHS[month] + " " + year;
    $("#cal-next").hidden = viewOffset >= 1;
    const grid = $("#cal-grid");
    grid.innerHTML = "";
    ["lun", "mar", "mer", "gio", "ven", "sab", "dom"].forEach((d) => {
      const h = document.createElement("span");
      h.className = "cal-dow";
      h.textContent = d;
      h.setAttribute("aria-hidden", "true");
      grid.appendChild(h);
    });
    const lead = (base.getDay() + 6) % 7;
    for (let i = 0; i < lead; i++) grid.appendChild(document.createElement("span"));
    const days = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month, d);
      const weekend = date.getDay() === 0 || date.getDay() === 6;
      const available = viewOffset === 1 && !weekend && d >= 3 && d % 3 !== 0;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cal-day";
      b.textContent = String(d);
      b.disabled = !available;
      b.setAttribute("aria-label", d + " " + MONTHS[month] + (available ? ": posti disponibili" : ": nessuna disponibilità"));
      if (chosen.day === date.toDateString()) b.setAttribute("aria-pressed", "true");
      b.addEventListener("click", () => pickDay(date));
      grid.appendChild(b);
    }
  }

  $("#cal-next").addEventListener("click", () => { viewOffset = 1; renderCalendar(); });

  function pickDay(date) {
    chosen = { day: date.toDateString(), slot: null, date };
    $("#data").value = date.toISOString().slice(0, 10);
    renderCalendar();
    const box = $("#slots");
    box.innerHTML = "";
    ["09:00", "09:20", "10:40", "11:20", "15:00"].forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "slot";
      b.textContent = t;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => {
        chosen.slot = t;
        box.querySelectorAll(".slot").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        updateStep3();
      });
      box.appendChild(b);
    });
    $("#slot-box").hidden = false;
    updateStep3();
  }

  function updateStep3() {
    $("#avanti-3").disabled = !($("#sede").value && chosen.day && chosen.slot);
  }
  $("#sede").addEventListener("change", updateStep3);

  $("#step-3").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!$("#avanti-3").disabled) show(4, true);
  });

  // ---------- riepilogo e conferma ----------
  function renderSummary() {
    const motivo = document.querySelector("input[name=motivo]:checked");
    const rows = [
      ["Comune", $("#comune").value],
      ["Motivo", motivo ? motivo.parentElement.textContent.trim() : ""],
      ["Richiedente", $("#nome").value + " " + $("#cognome").value],
      ["Sede", $("#sede").value],
      ["Appuntamento", chosen.date ? chosen.date.getDate() + " " + MONTHS[chosen.date.getMonth()] + " alle " + chosen.slot : ""],
    ];
    $("#summary").innerHTML = rows.map(([k, v]) => "<dt>" + k + "</dt><dd>" + escapeHtml(v) + "</dd>").join("");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  $("#privacy").addEventListener("change", (e) => { $("#conferma").disabled = !e.target.checked; });

  $("#step-4").addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#conferma").disabled) return;
    $("#codice").textContent = "PRN-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    show(5, true);
    saveRun();
  });

  // ---------- confronto prima / dopo ----------
  function saveRun() {
    const run = {
      mode: assisted ? "con assistente" : "senza assistente",
      seconds: metrics.start ? Math.round((Date.now() - metrics.start) / 1000) : 0,
      errors: metrics.errors,
      deadClicks: metrics.deadClicks,
      backs: metrics.backs,
      hints: metrics.hints,
      at: new Date().toISOString(),
    };
    const runs = JSON.parse(localStorage.getItem("agenda-cie-runs") || "[]");
    runs.push(run);
    localStorage.setItem("agenda-cie-runs", JSON.stringify(runs.slice(-20)));
    renderMetrics(runs);
  }

  function fmt(sec) {
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0") + " min";
  }

  function renderMetrics(runs) {
    const last = {};
    runs.forEach((r) => (last[r.mode] = r));
    const rows = ["senza assistente", "con assistente"].filter((m) => last[m]).map((m) => {
      const r = last[m];
      return "<tr><th scope=row>" + m + "</th><td>" + fmt(r.seconds) + "</td><td>" + r.errors +
        "</td><td>" + r.deadClicks + "</td><td>" + r.backs + "</td><td>" + r.hints + "</td></tr>";
    });
    $("#metrics").innerHTML =
      "<h2>Metriche della prova (ultima per modalità)</h2>" +
      "<table><thead><tr><th>Modalità</th><th>Tempo</th><th>Errori</th><th>Click a vuoto</th><th>Indietro</th><th>Suggerimenti</th></tr></thead>" +
      "<tbody>" + rows.join("") + "</tbody></table>";
  }

  history.replaceState({ step: 1 }, "", location.pathname + location.search);
  show(1, false);
})();
