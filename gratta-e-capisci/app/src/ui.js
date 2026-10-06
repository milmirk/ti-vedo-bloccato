// Interfaccia di "Fortuna in Chiaro": eventi, rendering, animazione.
// Usa solo window.Motore (calcoli) e legge window.GIOCHI / window.QUIZ (dati). Nessuna rete, nessuno storage.
(function () {
  "use strict";

  var M = window.Motore;
  var G = window.GIOCHI;
  var Q = window.QUIZ;
  var N_SCHERMATE = 7;
  var SEME_NORMALE = 42;            // seme fisso dichiarato a schermo (analisi funzionale §3.4)
  var DURATA_NORMALE = 10000;       // ms
  var DURATA_DEMO = 3000;           // ms (BR-10)
  var PUNTI_GRIGLIA = 10000;        // scheda A: 100 x 100 puntini
  var ESTRAZIONI_RITARDATARI = 500000;
  var LETTERE = ["A", "B", "C", "D", "E", "F"];

  var params = new URLSearchParams(window.location.search);
  var demoDaUrl = params.get("demo") === "1";
  var pausaDaUrl = params.get("pausa") !== "0";   // BR-17 attivo di default; ?pausa=0 lo disattiva
  var SOGLIA_DEMO = 100;                          // CR1: soglia mensile precompilata solo in ?demo=1
  var N_FOLLA = 10000;                            // L2: persone simulate
  var TOAST_FASE1 = 750, TOAST_DURATA = 1900;     // L1: "HAI VINTO" -> saldo reale
  var MAX_STADI_DISEGNATI = 600;
  var PAUSA_SECONDI = 30, PAUSA_SECONDI_DEMO = 10;
  // Italia 2024: spesa netta (raccolta - vincite). docs/idea/ricerca-azzardo.md, riga "Spesa netta 2024".
  var ITALIA = { spesaNettaMld: 21.5, perResidente: 360, anno: 2024,
    fonte: "ADM, Bilancio di esercizio 2024, ripreso da Agipronews (fonte ufficiale riportata dalla stampa di settore)" };

  var state;
  var anim = null; // animazione in corso: { raf, watch, ultimo }
  var toast = { timers: [], libero: 0, coda: null };
  function fermaToast() {
    toast.timers.forEach(clearTimeout);
    toast.timers = [];
    toast.libero = 0;
    toast.coda = null;
    var t = $("toast");
    if (t) { t.hidden = true; t.className = "toast"; }
  }
  function fermaAnimazione() {
    if (!anim) return;
    cancelAnimationFrame(anim.raf);
    clearInterval(anim.watch);
    anim = null;
  }
  function has(nome) { return !!M && typeof M[nome] === "function"; }

  // ---------------------------------------------------------------- utilita'
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") e.className = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function num(n, d) { return M.formattaNumero(n, d || 0); }
  // Euro: senza decimali se l'importo e' intero al centesimo, altrimenti 2 decimali.
  function eur(n) {
    var c = Math.round(n * 100) / 100;
    return M.formattaEuro(c, c % 1 === 0 ? 0 : 2);
  }
  function eur2(n) { return M.formattaEuro(n, 2); }
  function perc(f, d) { return num(f * 100, d === undefined ? 1 : d) + "%"; }
  function unoSu(n) { return "1 su " + num(n, n % 1 === 0 ? 0 : 1); }
  function seme() { return state.demo ? G.seme.demo : SEME_NORMALE; }
  // Seme dell'anno simulato: il primo anno usa il seme base (demo o normale), "Simula un altro anno" lo sposta di +1.
  function semeAnno() { return seme() + (state.altroAnno || 0); }

  function payoutDichiarato(g) {
    return g.dichiarati && typeof g.dichiarati.payout === "number" ? g.dichiarati.payout : M.payout(g.id);
  }
  // Gioco di riferimento per le schede: modello A se presente, altrimenti la prima lotteria, altrimenti il primo gioco.
  function giocoRiferimento() {
    var gs = G.giochi;
    return gs.filter(function (g) { return g.id === "istantanea-5-a"; })[0] ||
      gs.filter(function (g) { return g.tipo === "istantanea"; })[0] || gs[0];
  }
  function citaFonte(f) {
    if (!f) return "Fonte non indicata.";
    var s = "Fonte: " + f.ente + (f.descrizione ? " — " + f.descrizione : "") + " (" + f.sezione + ").";
    if (f.affidabilita === "STIMA") s += " Stima, non tabella ufficiale completa.";
    return s;
  }

  // ------------------------------------------------------------------ stato
  function statoIniziale() {
    var sel = {};
    G.giochi.forEach(function (g) { sel[g.id] = { on: false, volte: 0, importo: g.prezzo, quante: 1, periodo: "giorno" }; });
    var voci = (G.abitudineDemo && G.abitudineDemo.voci) || [];
    var applicate = 0;
    voci.forEach(function (v) {
      if (!sel[v.gioco]) return;
      sel[v.gioco] = { on: true, volte: v.volte, importo: M.trovaGioco(v.gioco).prezzo, quante: v.volte, periodo: v.periodo || "giorno" };
      applicate++;
    });
    if (!applicate && G.giochi.length) sel[G.giochi[0].id] = { on: true, volte: 1, importo: G.giochi[0].prezzo, quante: 1, periodo: "giorno" };
    var demo = demoDaUrl || ($("demo-toggle") && $("demo-toggle").checked) || false;
    return {
      schermata: 1,
      demo: demo,
      soglia: demo ? SOGLIA_DEMO : null,
      vistaBanco: false,
      sel: sel,
      rispostePrima: {},
      risposteDopo: {},
      ordineDopo: null,
      risultati: null
    };
  }

  function abitudine() {
    var voci = [];
    G.giochi.forEach(function (g) {
      var s = state.sel[g.id];
      if (!s || !s.on || !(s.volte > 0)) return;
      voci.push({ gioco: g.id, volte: s.volte, periodo: s.periodo });
    });
    return { voci: voci };
  }

  // ------------------------------------------------------------- navigazione
  function vai(n) {
    if (n < 1 || n > N_SCHERMATE) return;
    fermaAnimazione();
    fermaToast();
    state.schermata = n;
    document.querySelectorAll(".screen").forEach(function (s) {
      s.hidden = Number(s.getAttribute("data-screen")) !== n;
    });
    $("btn-ricomincia-top").hidden = n < 4;
    renderSteps();
    if (n === 2) aggiornaQuizPrima();
    if (n === 4) avviaSimulazione();
    if (n === 5) initSchede();
    if (n === 6) renderQuizDopo();
    if (n === 7) renderCruscotto();
    window.scrollTo(0, 0);
    var h = document.querySelector('.screen[data-screen="' + n + '"] h1');
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }

  function renderSteps() {
    var ol = $("steps");
    ol.innerHTML = "";
    for (var i = 1; i <= N_SCHERMATE; i++) {
      var li = el("li", { text: String(i) });
      if (i < state.schermata) li.className = "done";
      if (i === state.schermata) { li.className = "current"; li.setAttribute("aria-current", "step"); }
      ol.appendChild(li);
    }
  }

  function ricomincia() {
    state = statoIniziale();
    $("demo-toggle").checked = state.demo;
    aggiornaDemo();
    renderQuiz($("quiz-prima"), domandePrima(), state.rispostePrima, null, aggiornaQuizPrima);
    $("quiz-dopo").innerHTML = "";
    $("soglia").value = state.soglia === null ? "" : String(state.soglia);
    renderAbitudine();
    schedeInit = false;
    vai(1);
  }

  // --------------------------------------------------------- 1. Benvenuto
  function aggiornaDemo() {
    state.demo = $("demo-toggle").checked;
    if (state.demo && state.soglia === null && $("soglia")) {
      state.soglia = SOGLIA_DEMO;
      $("soglia").value = String(SOGLIA_DEMO);
      aggiornaSoglia();
    }
    $("demo-badge").hidden = !state.demo;
    $("demo-info").textContent = state.demo
      ? "Modalità demo attiva: simulazione riproducibile, animazione di circa 3 secondi, risultato identico a ogni esecuzione."
      : "";
  }

  // ------------------------------------------------------------- quiz
  function domandePrima() {
    return Q.domande.filter(function (q) { return q.fase !== "dopo"; });
  }
  function domandeTrasferimento() {
    return Q.domande.filter(function (q) { return q.fase === "dopo"; });
  }

  // Mescola le opzioni in modo deterministico (seme) per il quiz dopo.
  function mescola(arr, rnd) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function renderQuiz(form, domande, risposte, ordini, onChange) {
    form.innerHTML = "";
    domande.forEach(function (q, idx) {
      var fs = el("fieldset", { class: "domanda" });
      var etichetta = (idx + 1) + ". " + q.testo;
      fs.appendChild(el("legend", { text: etichetta }));
      if (q.fase === "dopo") fs.appendChild(el("p", { class: "tag", text: "Biglietto inventato per l'esercizio, non è un gioco reale" }));
      var opzioni = ordini && ordini[q.id] ? ordini[q.id] : q.opzioni;
      opzioni.forEach(function (o, i) {
        var lab = el("label", { class: "opzione" });
        var inp = el("input", { type: "radio", name: form.id + "-" + q.id, value: o.chiave });
        if (risposte[q.id] === o.chiave) inp.checked = true;
        inp.addEventListener("change", function () {
          risposte[q.id] = o.chiave;
          mostraSpiegazione(fs, q, risposte[q.id]);
          onChange();
        });
        lab.appendChild(inp);
        lab.appendChild(el("span", { text: LETTERE[i] + ") " + o.testo }));
        fs.appendChild(lab);
      });
      if (risposte[q.id]) mostraSpiegazione(fs, q, risposte[q.id]);
      form.appendChild(fs);
    });
  }

  function mostraSpiegazione(fs, q, risposta) {
    var p = fs.querySelector(".spiegazione");
    if (!p) { p = el("p", { "aria-live": "polite" }); fs.appendChild(p); }
    var ok = risposta === q.corretta;
    var giusta = q.opzioni.filter(function (o) { return o.chiave === q.corretta; })[0];
    p.className = "spiegazione " + (ok ? "ok" : "ko");
    p.textContent = (ok ? "Risposta corretta. " : "La risposta corretta è: " + giusta.testo + ". ") + q.spiegazione;
  }

  function completo(domande, risposte) {
    return domande.every(function (q) { return !!risposte[q.id]; });
  }

  function aggiornaQuizPrima() {
    $("avanti-2").disabled = !completo(domandePrima(), state.rispostePrima);
  }

  function renderQuizDopo() {
    var domande = domandePrima().concat(domandeTrasferimento());
    if (!state.ordineDopo) {
      var rnd = M.creaPRNG(seme() + 7);
      state.ordineDopo = {};
      domandePrima().forEach(function (q) {
        var o = mescola(q.opzioni, rnd);
        // garantisce un ordine diverso da quello del quiz prima
        if (o.every(function (x, i) { return x.chiave === q.opzioni[i].chiave; })) o.push(o.shift());
        state.ordineDopo[q.id] = o;
      });
    }
    var form = $("quiz-dopo");
    if (!form.children.length) renderQuiz(form, domande, state.risposteDopo, state.ordineDopo, aggiornaQuizDopo);
    aggiornaQuizDopo();
  }
  function aggiornaQuizDopo() {
    $("avanti-6").disabled = !completo(domandePrima().concat(domandeTrasferimento()), state.risposteDopo);
  }

  // ------------------------------------------------------- 3. Abitudine
  function renderAbitudine() {
    var box = $("lista-giochi");
    box.innerHTML = "";
    var gA = G.giochi.filter(function (g) { return g.id === "istantanea-5-a"; })[0];
    var gB = G.giochi.filter(function (g) { return g.id === "istantanea-5-b"; })[0];
    if (gA && gB) {
      var cent = function (g) { return num(Math.round(100 * payoutDichiarato(g))) + " centesimi"; };
      var stessoPrezzo = gA.prezzo === gB.prezzo;
      box.appendChild(el("p", { class: "diff-ab", text: "Due biglietti reali" + (stessoPrezzo ? " da " + eur(gA.prezzo) : "") +
        " con tabelle premi diverse: " + (stessoPrezzo ? "allo stesso prezzo, " : "") + "A restituisce in media " + cent(gA) +
        " per ogni euro giocato, B " + cent(gB) + "." }));
    }
    G.giochi.forEach(function (g) {
      var s = state.sel[g.id];
      var card = el("div", { class: "gioco" + (s.on ? " sel" : "") });
      var head = el("label", { class: "gioco-head" });
      var chk = el("input", { type: "checkbox" });
      chk.checked = s.on;
      head.appendChild(chk);
      head.appendChild(el("span", { text: g.nome }));
      card.appendChild(head);

      var pm = M.probabilitaPremioMax(g.id);
      var dati = el("ul", { class: "gioco-dati" });
      [["Costo", eur(g.prezzo)], ["Restituisce in media", num(100 * payoutDichiarato(g), 1) + " € ogni 100 € giocati"], ["Premio massimo", eur(pm.premio)], ["Probabilità premio massimo", unoSu(pm.unoSu)]]
        .forEach(function (r) { dati.appendChild(el("li", null, r[0] + ": <strong>" + r[1] + "</strong>")); });
      card.appendChild(dati);

      var inp = el("div", { class: "gioco-input" });
      if (!(s.importo > 0)) s.importo = g.prezzo;
      if (!(s.quante > 0)) s.quante = 1;
      var li = el("label", null, "Importo per giocata ");
      var imp = el("input", { type: "number", min: "0", max: "1000", step: "1", inputmode: "numeric", value: String(s.importo), "aria-label": "Importo per giocata in euro" });
      li.appendChild(imp);
      li.appendChild(document.createTextNode(" €"));
      var lq = el("label", null, "Quante volte ");
      var qv = el("input", { type: "number", min: "0", max: "100", step: "1", inputmode: "numeric", value: String(s.quante), "aria-label": "Quante volte" });
      lq.appendChild(qv);
      var per = el("select", { "aria-label": "Periodo" });
      [["giorno", "al giorno"], ["settimana", "a settimana"]].forEach(function (p) {
        var o = el("option", { value: p[0], text: p[1] });
        if (s.periodo === p[0]) o.selected = true;
        per.appendChild(o);
      });
      inp.appendChild(li);
      inp.appendChild(lq);
      inp.appendChild(per);
      var conv = el("p", { class: "conversione" });
      inp.appendChild(conv);
      // Schedina: biglietti per giocata = floor(importo / prezzo); il motore riceve {gioco, volte, periodo}
      // con volte = quante volte x biglietti per giocata.
      function aggConv() {
        var b = Math.floor((s.importo || 0) / g.prezzo);
        s.volte = (s.quante || 0) * b;
        var perTxt = s.periodo === "settimana" ? " a settimana" : " al giorno";
        if (b < 1) {
          conv.textContent = "L'importo minimo per giocata è " + eur(g.prezzo);
          return;
        }
        var q = s.quante || 0;
        var unita = s.volte === 1 ? " biglietto" : " biglietti";
        var t = "= " + num(q) + (q === 1 ? " giocata" : " giocate") + " da " + eur(b * g.prezzo) + perTxt +
          " → " + eur(q * b * g.prezzo) + perTxt + " (" + num(s.volte) + unita + " da " + eur(g.prezzo) + ")";
        if (b * g.prezzo !== s.importo) t += "; arrotondato a " + num(b) + (b === 1 ? " biglietto" : " biglietti") + " da " + eur(g.prezzo) + " per giocata";
        conv.textContent = t;
      }
      aggConv();
      inp.hidden = !s.on;
      card.appendChild(inp);
      card.appendChild(el("p", { class: "fonte", text: citaFonte(g.fonte) }));

      function intero(input, min, max) {
        var v = Math.floor(Number(input.value));
        if (!isFinite(v) || v < min) v = min;
        if (v > max) v = max;
        return v;
      }
      chk.addEventListener("change", function () {
        s.on = chk.checked;
        if (s.on && !(s.volte > 0)) {
          if (s.importo < g.prezzo) { s.importo = g.prezzo; imp.value = String(g.prezzo); }
          if (!(s.quante > 0)) { s.quante = 1; qv.value = "1"; }
          aggConv();
        }
        card.className = "gioco" + (s.on ? " sel" : "");
        inp.hidden = !s.on;
        aggiornaSpesa();
      });
      imp.addEventListener("input", function () { s.importo = intero(imp, 0, 1000); aggConv(); aggiornaSpesa(); });
      imp.addEventListener("change", function () { imp.value = String(s.importo); });
      qv.addEventListener("input", function () { s.quante = intero(qv, 0, 100); aggConv(); aggiornaSpesa(); });
      qv.addEventListener("change", function () { qv.value = String(s.quante); });
      per.addEventListener("change", function () { s.periodo = per.value; aggConv(); aggiornaSpesa(); });
      box.appendChild(card);
    });
    aggiornaSpesa();
  }

  function aggiornaSpesa() {
    var ab = abitudine();
    var sp = M.spesa(ab);
    var box = $("riepilogo-spesa");
    var vuoto = !ab.voci.length || !(sp.giorno > 0);
    $("avanti-3").disabled = vuoto;
    state.risultati = null; // l'abitudine e' cambiata: la simulazione va rifatta
    aggiornaSoglia();
    if (vuoto) {
      box.innerHTML = '<p class="avviso">Seleziona almeno un gioco per vedere la tua spesa</p>';
      return;
    }
    box.innerHTML =
      "<dl>" +
      "<dt>Al giorno</dt><dd class=\"big\">" + eur(sp.giorno) + "</dd>" +
      "<dt>Al mese</dt><dd class=\"big\">" + eur2(sp.mese) + "</dd>" +
      "<dt>All'anno</dt><dd class=\"big\">" + eur(sp.anno) + "</dd>" +
      "</dl>" +
      '<p class="note">Anno = giorno × 365; mese = anno ÷ 12, arrotondato al centesimo.</p>';
  }

  // ------------------------------------- 3b. Soglia scelta dall'utente (CR1, BR-16)
  function leggiSoglia() {
    var inp = $("soglia");
    var v = Number(inp.value);
    state.soglia = inp.value === "" || !isFinite(v) || v < 0 ? null : v;
    aggiornaSoglia();
  }
  function esitoSoglia() {
    if (state.soglia === null || !has("superaSoglia")) return null;
    var ab = abitudine();
    if (!ab.voci.length) return null;
    var r = M.superaSoglia(ab, state.soglia);
    return r && r.supera ? r : null;
  }
  function aggiornaSoglia() {
    var r = esitoSoglia();
    pannelloParlarne($("parlarne-3"), r);
  }
  // Pannello neutro: numeri, contatti, nessun invio automatico. Il messaggio lo invia solo l'utente.
  function pannelloParlarne(box, r) {
    if (!box) return;
    if (!r) { box.hidden = true; box.innerHTML = ""; return; }
    var nv = G.numeroVerde || {};
    var numero = nv.numero || "800 55 88 22";
    var tel = numero.replace(/\D/g, "");
    var orari = nv.orari || "lunedì-venerdì 10:00-16:00";
    var msg = "Ciao, volevo condividere con te due numeri sulla mia spesa di gioco di questo mese: " + eur2(r.spesaMese) +
      " su una soglia personale di " + eur(state.soglia) + " che mi ero dato. Se hai cinque minuti mi farebbe piacere parlarne con te.";
    box.innerHTML =
      "<h2>Vuoi parlarne con qualcuno?</h2>" +
      "<p>La tua spesa mensile stimata (<strong>" + eur2(r.spesaMese) + "</strong>) supera la soglia che hai scelto (" + eur(state.soglia) +
      "). Qui trovi il Telefono Verde Nazionale ISS, gratuito e anonimo, e un messaggio pronto per una persona di fiducia, se vuoi inviarlo tu.</p>" +
      '<p><a class="btn btn-primary" id="link-tel" href="tel:' + tel + '">Chiama il Telefono Verde ISS ' + numero + "</a></p>" +
      '<p class="note">Gratuito e anonimo, ' + orari + ".</p>" +
      "<p>Messaggio pronto per una persona di fiducia (si apre nell'app che scegli; lo invii solo tu, se vuoi):</p>" +
      '<blockquote class="msg">' + msg + "</blockquote>" +
      '<p class="azioni"><a class="btn" id="link-wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">Scrivi su WhatsApp</a> ' +
      '<a class="btn" id="link-mail" href="mailto:?subject=' + encodeURIComponent("Una cosa di cui parlare") + "&body=" + encodeURIComponent(msg) + '">Scrivi una email</a></p>' +
      '<p class="note">Questa pagina non salva e non invia nulla: né la soglia, né il messaggio, né i contatti.</p>';
    box.hidden = false;
  }

  // ---------------------------------------- L3: probabilita' in cose fisiche (BR-15)
  function stadiHtml(unoSuN) {
    if (!has("scalaFisica") || !(unoSuN > 0) || !isFinite(unoSuN)) return "";
    var sf = M.scalaFisica(unoSuN);
    var n = Math.round(sf.stadi);
    var html;
    if (n >= 2) {
      html = "<p>Per il premio massimo (" + unoSu(unoSuN) + ") servirebbero <strong>" + num(n) + " stadi da " + num(sf.postiStadio) +
        " posti</strong>, tutti pieni: tra tutte queste persone, vincerebbe <strong>una persona sola</strong>.</p>";
      var disegnati = Math.min(n, MAX_STADI_DISEGNATI);
      var vincente = Math.floor(disegnati * 0.62);
      var celle = "";
      for (var i = 0; i < disegnati; i++) celle += i === vincente ? '<i class="win"></i>' : "<i></i>";
      html += '<div class="stadi" role="img" aria-label="' + num(n) + ' stadi, uno solo contiene la persona che vince">' + celle + "</div>" +
        '<p class="note">Ogni quadrato è uno stadio da ' + num(sf.postiStadio) + " posti; quello rosso contiene la sola persona che vince" +
        (n > disegnati ? " (disegnati " + num(disegnati) + " stadi su " + num(n) + ")" : "") + ". Calcolo nostro: " + num(unoSuN) + " ÷ " + num(sf.postiStadio) + ".</p>";
    } else {
      html = "<p>Per il premio massimo (" + unoSu(unoSuN) + "): " + num(unoSuN) + " persone, meno di " + (n < 1 ? "uno stadio" : "due stadi") +
        " da " + num(sf.postiStadio) + " posti. Tra loro, in media, vince una persona sola.</p>";
    }
    return html;
  }

  // ------------------------------------------------ 4. Un anno in 10 secondi
  function calcolaRisultati() {
    var ab = abitudine();
    var pa = M.perditaAttesa(ab);
    var anni = M.anniAttesiPremioMax(ab);
    var top = anni.reduce(function (a, b) { return !a || b.premio > a.premio ? b : a; }, null);
    var sim = M.simulaAnno(ab, semeAnno());
    return {
      seme: semeAnno(),
      spesaAnno: pa.spesaAnno,
      ritornoAnno: pa.ritornoAnno,
      perditaAnno: pa.anno,
      payoutMedio: pa.spesaAnno > 0 ? 1 - pa.perEuro : 0,
      premioMax: top ? top.premio : null,
      anniPremioMax: top && isFinite(top.anni) ? top.anni : null,
      giocoPremioMax: top ? M.trovaGioco(top.gioco).nome : null,
      unoSuPremioMax: top ? M.probabilitaPremioMax(top.gioco).unoSu : null,
      sim: sim,
      folla: null
    };
  }
  function costoDi(id) { return M.trovaGioco(id).prezzo; }
  // Costo della giocata che ha prodotto l'evento: dal gioco dell'evento o, se c'e' un solo gioco, da quello.
  function costoEvento(e) {
    if (typeof e.costo === "number") return e.costo;
    if (e.gioco) return costoDi(e.gioco);
    var voci = abitudine().voci;
    return voci.length === 1 ? costoDi(voci[0].gioco) : null;
  }
  function classeEvento(e) {
    if (e.classe) return e.classe;
    var c = costoEvento(e);
    if (c === null) return "reali";
    return e.premio <= c ? "rimborso" : e.premio <= 2 * c ? "piccole" : "reali";
  }

  // L1 (BR-13): toast "HAI VINTO X €" che diventa il saldo reale della giocata.
  function mostraToast(e) {
    var t = $("toast");
    var cl = classeEvento(e), c = costoEvento(e);
    var seconda;
    if (cl === "rimborso") seconda = "Hai recuperato la giocata: guadagno netto 0 €.";
    else if (c !== null) seconda = "Tolta la giocata da " + eur(c) + ": guadagno netto " + eur(e.premio - c) + ".";
    else seconda = "vincita di " + eur(e.premio);
    t.className = "toast t-vinto";
    t.innerHTML = "<strong>HAI VINTO " + eur(e.premio) + "</strong>";
    t.hidden = false;
    toast.timers.push(setTimeout(function () {
      t.className = "toast t-saldo t-" + cl;
      t.innerHTML = "<strong>HAI VINTO " + eur(e.premio) + "</strong><span>" + seconda + "</span>";
    }, TOAST_FASE1));
    toast.libero = performance.now() + TOAST_DURATA;
    toast.timers.push(setTimeout(function () {
      if (toast.coda) { var n = toast.coda; toast.coda = null; mostraToast(n); }
    }, TOAST_DURATA));
  }
  function proponiToast(e) {
    if (performance.now() >= toast.libero) mostraToast(e);
    else toast.coda = e; // si mostra la vincita piu' recente appena il toast si libera
  }

  // Conteggio delle vincite per classe (dal motore se disponibile, altrimenti dagli eventi).
  function nuovoConto() { return { rimborso: 0, piccole: 0, reali: 0, totale: 0, euroRimborso: 0 }; }
  function contaEvento(k, e) {
    var cl = classeEvento(e);
    k[cl] = (k[cl] || 0) + 1;
    k.totale++;
    if (cl === "rimborso") k.euroRimborso += e.premio;
  }

  function avviaSimulazione() {
    if (!state.risultati || state.risultati.seme !== semeAnno()) state.risultati = calcolaRisultati();
    var r = state.risultati;
    $("seme-info").textContent = "Simulazione riproducibile: rivedendola, i numeri restano gli stessi." + (state.altroAnno ? " Anno simulato n. " + (state.altroAnno + 1) + "." : "") +
      (state.demo ? " Modalità demo: animazione accelerata." : "");

    $("atteso-dl").innerHTML =
      "<dt>Speso in un anno</dt><dd>" + eur(r.spesaAnno) + "</dd>" +
      "<dt>Torna in media</dt><dd>" + eur2(r.ritornoAnno) + "</dd>" +
      "<dt>Perso in media</dt><dd class=\"big\" style=\"color:var(--perso)\">" + eur2(r.perditaAnno) + "</dd>";
    $("atteso-media").textContent = "In media, su 100 € giocati, te ne tornano " + num(r.payoutMedio * 100, 2) + " €.";

    // calendario
    var cal = $("calendario");
    cal.innerHTML = "";
    var giorniVincita = {};
    r.sim.vincite.forEach(function (v) { giorniVincita[v.giorno] = true; });
    var celle = [];
    for (var i = 0; i < r.sim.giorni.length; i++) { var c = document.createElement("span"); cal.appendChild(c); celle.push(c); }
    $("vincite").innerHTML = "";
    $("sim-finale").innerHTML = "";
    $("btn-rivedi").disabled = true;
    $("btn-altro-anno").disabled = true;
    $("btn-banco").disabled = true;
    mostraVista(false);
    fermaToast();
    $("stadi-anno").innerHTML = r.unoSuPremioMax ? "<h3>Il premio massimo, in scala</h3>" + stadiHtml(r.unoSuPremioMax) : "";
    var conto = nuovoConto();
    var haEventi = !!r.sim.totale.classiVincite || r.sim.giorni.some(function (d) { return Array.isArray(d.eventi); });
    $("conto-vincite").textContent = haEventi ? testoConto(conto) : "";

    var durata = state.demo ? DURATA_DEMO : DURATA_NORMALE;
    var tot = r.sim.giorni.length;
    var inizio = null, mostrati = 0, vinciteMostrate = 0;
    fermaAnimazione();
    var a = anim = { raf: null, watch: null, ultimo: 0 };

    function frame() {
      if (anim !== a) return;
      var ts = performance.now();
      a.ultimo = ts;
      cancelAnimationFrame(a.raf);
      if (inizio === null) inizio = ts;
      var t = Math.min(1, (ts - inizio) / durata);
      var fino = Math.round(t * tot);
      var ultimo = null;
      for (; mostrati < fino; mostrati++) {
        var g = r.sim.giorni[mostrati];
        celle[mostrati].className = giorniVincita[g.giorno] ? "w" : (g.speso > 0 ? "g" : "");
        if (g.eventi) g.eventi.forEach(function (e) { contaEvento(conto, e); ultimo = e; });
      }
      if (ultimo) { proponiToast(ultimo); $("conto-vincite").textContent = testoConto(conto); }
      while (vinciteMostrate < r.sim.vincite.length && r.sim.vincite[vinciteMostrate].giorno <= fino) {
        var v = r.sim.vincite[vinciteMostrate++];
        $("vincite").insertBefore(el("li", { text: "Giorno " + v.giorno + ": vinti " + eur(v.premio) }), $("vincite").firstChild);
      }
      mostraContatori(fino ? r.sim.giorni[fino - 1] : null, fino, tot);
      if (t < 1) a.raf = requestAnimationFrame(frame);
      else { fermaAnimazione(); fineSimulazione(r); }
    }
    mostraContatori(null, 0, tot);
    a.raf = requestAnimationFrame(frame);
    // ripiego se requestAnimationFrame e' sospeso (scheda in background, browser headless)
    a.watch = setInterval(function () { if (performance.now() - a.ultimo > 150) frame(); }, 200);
  }

  function mostraContatori(g, fino, tot) {
    var speso = g ? g.spesoCum : 0, vinto = g ? g.vintoCum : 0;
    $("c-speso").textContent = eur(speso);
    $("c-vinto").textContent = eur(vinto);
    $("c-perso").textContent = eur(speso - vinto);
    $("sim-giorno").textContent = "Giorno " + fino + " di " + tot;
    $("sim-progress").style.width = (tot ? 100 * fino / tot : 0) + "%";
  }

  // Confronto esplicito tra l'anno simulato (un caso) e la media su tantissimi anni.
  function confrontoAnnoHtml(persoAnno, persoMedio) {
    var d = Math.round((persoAnno - persoMedio) * 100) / 100;
    var parte = Math.abs(d) < 0.005
      ? "Quest'anno hai perso esattamente quanto la media"
      : "Quest'anno hai perso <strong>" + eur2(Math.abs(d)) + (d > 0 ? " in più" : " in meno") + "</strong> della media";
    return '<p class="confronto-anno">' + parte + ": è il caso. Su tanti anni la perdita si avvicina a <strong>" +
      eur2(persoMedio) + "</strong> all'anno.</p>";
  }

  function fineSimulazione(r) {
    var t = r.sim.totale;
    var html =
      "<p>In questo anno simulato: speso <strong>" + eur(t.speso) + "</strong>, vinto <strong>" + eur(t.vinto) +
      "</strong>, perso <strong>" + eur(t.perso) + "</strong>.</p>" +
      confrontoAnnoHtml(t.perso, r.perditaAnno) +
      "<p>In media, su 100 € giocati, te ne tornano <strong>" + num(r.payoutMedio * 100, 2) + " €</strong>.</p>";
    if (r.anniPremioMax !== null) {
      html += "<p>Con questa abitudine, il premio massimo esce in media una volta ogni <strong>" +
        num(Math.round(r.anniPremioMax)) + " anni</strong> di gioco.</p>" +
        '<p class="note">Premio massimo considerato: ' + eur(r.premioMax) + " (" + r.giocoPremioMax +
        "). Stima derivata (calcolo nostro): 1 ÷ (probabilità del premio massimo × giocate all'anno).</p>";
    } else {
      html += "<p>Il premio massimo di questo gioco non è raggiungibile nella simulazione.</p>";
    }
    html += riepilogoClassiHtml(r);
    $("sim-finale").innerHTML = html;
    $("btn-rivedi").disabled = false;
    $("btn-altro-anno").disabled = false;
    $("btn-banco").disabled = !has("simulaFolla");
  }

  function testoConto(k) {
    return "Biglietti vincenti finora: " + num(k.totale) + " — di cui solo il rimborso della giocata: " + num(k.rimborso);
  }

  // L1: riepilogo di fine anno delle vincite per classe + quote esatte dalla tabella ufficiale.
  function riepilogoClassiHtml(r) {
    var t = r.sim.totale;
    var k = nuovoConto(), haEventi = false;
    r.sim.giorni.forEach(function (g) { if (g.eventi) { haEventi = true; g.eventi.forEach(function (e) { contaEvento(k, e); }); } });
    if (t.classiVincite) { // fonte primaria: i conteggi del motore
      k.rimborso = t.classiVincite.rimborso; k.piccole = t.classiVincite.piccole;
      k.reali = t.classiVincite.reali; k.totale = t.classiVincite.totale;
    } else if (!haEventi) return "";
    if (!k.totale) return "";
    var euroRimborso = haEventi ? k.euroRimborso : null;
    var html = '<div class="classi"><h2>Le vincite di quest\'anno, una per una</h2>' +
      "<p>Biglietti vincenti: <strong>" + num(k.totale) + "</strong>. Di questi:</p>" +
      '<div class="barra-classi" role="img" aria-label="Ripartizione delle vincite">' +
      '<span class="c-rimborso" style="flex:' + k.rimborso + '"></span>' +
      '<span class="c-piccole" style="flex:' + k.piccole + '"></span>' +
      '<span class="c-reali" style="flex:' + k.reali + '"></span></div>' +
      '<ul class="lista-classi">' +
      '<li><span class="sw c-rimborso"></span> <strong>' + num(k.rimborso) + "</strong> (" + perc(k.rimborso / k.totale, 0) + ") erano solo il rimborso della giocata: guadagno 0 €" +
      (euroRimborso !== null ? " (in tutto " + eur(euroRimborso) + " tornati indietro, già spesi prima)" : "") + "</li>" +
      '<li><span class="sw c-piccole"></span> <strong>' + num(k.piccole) + "</strong> (" + perc(k.piccole / k.totale, 0) + ") piccole vincite, fino al doppio della giocata</li>" +
      '<li><span class="sw c-reali"></span> <strong>' + num(k.reali) + "</strong> (" + perc(k.reali / k.totale, 0) + ") vincite più grandi del doppio della giocata</li></ul>";
    var voci = abitudine().voci;
    if (has("riepilogoVincite") && voci.length) {
      var id = voci[0].gioco, g = M.trovaGioco(id);
      var rv = M.riepilogoVincite(id);
      html += '<p class="note">Dalla tabella premi ufficiale (' + g.nome + "): vince il " + perc(rv.quotaBigliettiVincenti) + " dei biglietti (" +
        unoSu(1 / rv.quotaBigliettiVincenti) + "); il " + perc(rv.quotaRimborso) + " delle vincite è il rimborso della giocata e il " +
        perc(rv.quotaPiccole) + " è al massimo il doppio della giocata. " + citaFonte(g.fonte) + "</p>";
    }
    return html + "</div>";
  }

  // ------------------------------------------------ L2: Dalla parte del banco (BR-14)
  function mostraVista(banco) {
    state.vistaBanco = banco;
    $("vista-mia").hidden = banco;
    $("vista-banco").hidden = !banco;
    $("btn-banco").textContent = banco ? "Torna alla tua vista" : "Dalla parte del banco";
  }
  function apriBanco() {
    if (state.vistaBanco) { mostraVista(false); return; }
    var r = state.risultati;
    if (!r || !has("simulaFolla")) return;
    var box = $("vista-banco");
    fermaToast();
    mostraVista(true);
    if (r.folla) { renderBanco(r); return; }
    box.innerHTML = '<p class="note">Simulo un anno per ' + num(N_FOLLA) + " persone…</p>";
    $("btn-banco").disabled = true;
    setTimeout(function () {
      r.folla = M.simulaFolla(abitudine(), r.seme, N_FOLLA);
      $("btn-banco").disabled = false;
      renderBanco(r);
    }, 30);
  }
  function renderBanco(r) {
    var f = r.folla;
    var q = f.quotaInAttivo !== undefined ? f.quotaInAttivo : f.inAttivo / f.n;
    var verdi = Math.round(q * 100);
    if (f.inAttivo > 0 && verdi === 0) verdi = 1;
    var celle = "";
    for (var i = 0; i < 100; i++) celle += i < verdi ? '<i class="attivo"></i>' : "<i></i>";
    var html =
      "<h2>Dalla parte del banco: " + num(f.n) + " persone con la tua stessa abitudine, per un anno</h2>" +
      '<div class="banco-grid">' +
      '<div><div class="folla" role="img" aria-label="' + num(f.inAttivo) + " persone su " + num(f.n) + ' in attivo">' + celle + "</div>" +
      '<p class="note">Ogni quadrato = ' + num(f.n / 100) + " persone. Verde: in attivo a fine anno" +
      (f.inAttivo > 0 && Math.round(q * 100) === 0 ? " (meno di un quadrato, arrotondato per essere visibile)" : "") + ".</p></div>" +
      "<dl>" +
      "<dt>In attivo a fine anno</dt><dd class=\"big\" style=\"color:var(--vinto)\">" + num(f.inAttivo) + " su " + num(f.n) + " (" + perc(q) + ")</dd>" +
      "<dt>In perdita</dt><dd>" + num(f.n - f.inAttivo) + "</dd>" +
      "<dt>Giocato da tutti</dt><dd>" + eur(f.speso) + "</dd>" +
      "<dt>Tornato in vincite</dt><dd>" + eur(f.vinto) + "</dd>" +
      "<dt>Incasso del banco</dt><dd class=\"big\" style=\"color:var(--perso)\">" + eur(f.incassoBanco) + "</dd>" +
      "<dt>Perdita media per persona</dt><dd>" + eur2(f.perditaMedia) + "</dd>" +
      "<dt>Perdita mediana per persona</dt><dd>" + eur2(f.perditaMediana) + "</dd>" +
      "</dl></div>" +
      '<p class="note">Stesso motore e stesse probabilità ufficiali della tua simulazione. Simulazione riproducibile: rivedendola, i numeri restano gli stessi.</p>' +
      '<div class="italia"><h3>E in Italia</h3><p>Nel ' + ITALIA.anno + " la spesa netta nel gioco (giocato meno vinto) è stata di <strong>" +
      num(ITALIA.spesaNettaMld, 1) + " miliardi di euro</strong>: oltre " + eur(ITALIA.perResidente) + " l'anno per ogni residente, neonati inclusi.</p>" +
      '<p class="fonte">Fonte: ' + ITALIA.fonte + "; docs/idea/ricerca-azzardo.md.</p></div>";
    $("vista-banco").innerHTML = html;
  }

  // -------------------------------------------------- 5. Capire i numeri
  var schedeInit = false;
  function initSchede() {
    if (schedeInit) return;
    schedeInit = true;
    var g = giocoRiferimento();
    var pm = M.probabilitaPremioMax(g.id, 1);
    var pay = payoutDichiarato(g);

    // Scheda A
    $("sa-testo").textContent = "Immagina " + num(pm.unoSu) + " biglietti allineati: in media uno solo vince il premio massimo (" +
      eur(pm.premio) + ")." + (g.emissione ? " Nella serie completa da " + num(g.emissione) + " biglietti i vincenti sono " +
      num(Math.round(g.emissione / pm.unoSu)) + "." : "") +
      " È come scegliere a caso una sola persona tra tutti gli abitanti di una grande città europea.";
    $("sa-stadi").innerHTML = stadiHtml(pm.unoSu);
    var griglie = Math.max(1, Math.ceil(pm.unoSu / PUNTI_GRIGLIA));
    var range = $("sa-range");
    range.max = String(griglie);
    range.value = "1";
    function aggA() {
      var k = Number(range.value);
      $("sa-k").textContent = num(k);
      $("sa-u").textContent = k === 1 ? "griglia" : "griglie";
      disegnaGriglia(k >= griglie);
      $("sa-esito").textContent = k >= griglie
        ? num(k) + (k === 1 ? " griglia × " : " griglie × ") + num(PUNTI_GRIGLIA) + " puntini = " + num(k * PUNTI_GRIGLIA) + " biglietti: ora, in media, c'è un puntino vincente (in rosso)."
        : num(k) + (k === 1 ? " griglia × " : " griglie × ") + num(PUNTI_GRIGLIA) + " puntini = " + num(k * PUNTI_GRIGLIA) + " biglietti. Per trovare, in media, un puntino vincente servono " + num(griglie) + " griglie come questa.";
    }
    range.addEventListener("input", aggA);
    aggA();
    $("sa-fonte").textContent = citaFonte(g.fonte);

    // Scheda B
    $("sb-testo").textContent = "In media, su tantissime giocate, una parte di ciò che giochi torna indietro. Questo biglietto restituisce in media " + num(100 * pay, 1) + " € ogni 100 € giocati (" +
      perc(pay) + "): " + eur2(100 * (1 - pay)) + " ogni 100 € restano al banco.";
    var box = $("sb-scelte");
    [10, 100, 1000, 10000].forEach(function (n, i) {
      var lab = el("label");
      var r = el("input", { type: "radio", name: "sb-n", value: String(n) });
      if (i === 1) r.checked = true;
      r.addEventListener("change", function () { aggB(n); });
      lab.appendChild(r);
      lab.appendChild(document.createTextNode(num(n)));
      box.appendChild(lab);
    });
    var va = M.valoreAtteso(g.id, 1);
    function aggB(n) {
      var rnd = M.creaPRNG(seme());
      var vinto = 0;
      for (var i = 0; i < n; i++) vinto += M.estraiPremio(g.id, rnd, 1);
      var spesaTot = n * va.costo;
      $("sb-dl").innerHTML =
        "<dt>Spesa totale</dt><dd>" + eur(spesaTot) + "</dd>" +
        "<dt>Vincita media (su tantissime giocate)</dt><dd>" + eur2(spesaTot - M.perditaAttesaSu(va.costo, va.perEuro, n)) + " (" + perc(va.perEuro) + ")</dd>" +
        "<dt>Perdita media (su tantissime giocate)</dt><dd>" + eur2(M.perditaAttesaSu(va.costo, va.perEuro, n)) + "</dd>" +
        "<dt>Vincita in una prova simulata</dt><dd>" + eur(vinto) + " (" + perc(vinto / spesaTot) + ")</dd>";
    }
    aggB(100);
    $("sb-fonte").textContent = citaFonte(g.fonte) + " Simulazione riproducibile: rivedendola, i numeri restano gli stessi. Con più giocate la percentuale si avvicina alla media.";

    // Scheda C
    $("sc-testo").textContent = "Un'estrazione di 5 numeri su 90, come nel Lotto: ogni estrazione è indipendente dalle precedenti, quindi un numero fermo da 100 estrazioni ha la stessa probabilità di uscire di uno uscito ieri.";
    $("sc-lancia").textContent = "Lancia " + num(ESTRAZIONI_RITARDATARI) + " estrazioni";
    $("sc-lancia").addEventListener("click", function () {
      var b = $("sc-lancia");
      b.disabled = true;
      b.textContent = "Estrazioni in corso…";
      setTimeout(function () {
        var r = M.simulaRitardatari(seme(), ESTRAZIONI_RITARDATARI);
        $("sc-dl").innerHTML =
          "<dt>Probabilità teorica di uscita del numero " + r.numero + "</dt><dd>" + perc(r.probabilitaTeorica, 2) + "</dd>" +
          "<dt>Frequenza su tutte le estrazioni</dt><dd>" + perc(r.frequenza, 2) + "</dd>" +
          "<dt>Frequenza quando era fermo da " + r.ritardoMinimo + "+ estrazioni (" + num(r.casiInRitardo) + " casi)</dt><dd>" +
          (r.frequenzaDopoRitardo === null ? "nessun caso" : perc(r.frequenzaDopoRitardo, 2)) + "</dd>" +
          "<dt>Ritardo più lungo osservato</dt><dd>" + num(r.ritardoMassimo) + " estrazioni</dd>";
        b.disabled = false;
        b.textContent = "Lancia di nuovo (stessi numeri)";
      }, 30);
    });
    var L = G.estrazioni || {};
    $("sc-fonte").textContent = "Fonte: principio matematico standard di indipendenza delle estrazioni (calcolo, non dato ADM); " +
      (L.estratti || 5) + " numeri estratti su " + (L.numeri || 90) + " (" + (L.sezione || "ricerca-azzardo.md §2") + "). Simulazione riproducibile: rivedendola, i numeri restano gli stessi.";
  }

  function disegnaGriglia(vincente) {
    var c = $("griglia"), ctx = c.getContext("2d");
    var lato = Math.round(Math.sqrt(PUNTI_GRIGLIA)), passo = c.width / lato;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#8a93a1";
    for (var y = 0; y < lato; y++) for (var x = 0; x < lato; x++) ctx.fillRect(x * passo + 0.5, y * passo + 0.5, passo - 1, passo - 1);
    if (vincente) {
      ctx.fillStyle = "#a3141c";
      var px = 61 * passo, py = 37 * passo;
      ctx.fillRect(px - passo * 1.5, py - passo * 1.5, passo * 4, passo * 4);
    }
  }

  // ------------------------------------------------------ 7. Cruscotto
  function renderCruscotto() {
    var box = $("cruscotto");
    var dp = domandePrima(), dt = domandeTrasferimento();
    var html = "";
    if (!completo(dp.concat(dt), state.risposteDopo) || !completo(dp, state.rispostePrima)) {
      html += '<p class="cr-delta">Completa il quiz dopo per vedere il confronto</p>';
    } else {
      var prima = M.verificaQuiz(dp, state.rispostePrima);
      var dopo = M.verificaQuiz(dp, state.risposteDopo);
      var cf = M.confrontaQuiz(prima, dopo);
      var trasf = M.verificaQuiz(dt, state.risposteDopo);
      html += '<div class="cr-quiz">' +
        '<div class="cr-box"><span class="cr-l">Prima</span><span class="cr-v">' + cf.prima + "/" + cf.totalePrima + "</span></div>" +
        '<div class="cr-box cr-dopo"><span class="cr-l">Dopo</span><span class="cr-v">' + cf.dopo + "/" + cf.totaleDopo + "</span></div></div>";
      var delta;
      if (cf.delta > 0) delta = "+" + cf.delta + (cf.delta === 1 ? " risposta corretta in più" : " risposte corrette in più");
      else if (cf.delta === 0) delta = "Il tuo punteggio prima e dopo è " + cf.prima + "/" + cf.totalePrima + " in entrambi i casi.";
      else delta = "Prima: " + cf.prima + "/" + cf.totalePrima + ", dopo: " + cf.dopo + "/" + cf.totaleDopo + ".";
      html += '<p class="cr-delta">' + delta + "</p>";
      if (dt.length) {
        html += '<p class="cr-trasf">Hai calcolato da solo la perdita attesa di un biglietto nuovo: <strong>' +
          (trasf.punteggio === trasf.totale ? "Sì" : "No") + "</strong></p>";
      }
    }
    var r = state.risultati;
    if (r) {
      html += '<div class="cr-num">' +
        '<div class="cr-box"><span class="cr-l">Spesa annua</span><span class="cr-v">' + eur(r.spesaAnno) + "</span></div>" +
        '<div class="cr-box cr-perso"><span class="cr-l">Perdita media in un anno</span><span class="cr-v">' + eur2(r.perditaAnno) + "</span></div>" +
        '<div class="cr-box"><span class="cr-l">Anni attesi per il premio massimo</span><span class="cr-v">' +
        (r.anniPremioMax !== null ? num(Math.round(r.anniPremioMax)) : "—") + "</span></div></div>";
    }
    box.innerHTML = html;
    pannelloParlarne($("parlarne-7"), esitoSoglia());
  }

  // ------------------------- Pausa e Conto (BR-17, attivo di default; ?pausa=0 lo disattiva)
  var pausa = { timer: null };
  function initPausa() {
    if (!pausaDaUrl || !has("contoBiglietto")) return;
    var btn = $("btn-pausa"), sel = $("pausa-gioco");
    btn.hidden = false;
    G.giochi.forEach(function (g) {
      sel.appendChild(el("option", { value: g.id, text: g.nome }));
    });
    var rif = giocoRiferimento();
    if (rif) sel.value = rif.id;
    btn.addEventListener("click", apriPausa);
    sel.addEventListener("change", renderPausa);
    $("pausa-chiudi").addEventListener("click", chiudiPausa);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("pausa").hidden) chiudiPausa(); });
  }
  function renderPausa() {
    var id = $("pausa-gioco").value;
    var c = M.contoBiglietto(id);
    $("pausa-dl").innerHTML =
      "<dt>Costo del biglietto</dt><dd>" + eur(c.costo) + "</dd>" +
      "<dt>Perdita media attesa per biglietto</dt><dd class=\"big\" style=\"color:var(--perso)\">" + eur2(c.perditaMediaPerBiglietto) + "</dd>" +
      "<dt>Vincite che sono solo il rimborso della giocata</dt><dd>" + perc(c.quotaRimborso) + "</dd>" +
      "<dt>Probabilità del premio massimo</dt><dd>" + unoSu(c.unoSu) + "</dd>" +
      "<dt>In scala</dt><dd>" + (c.stadi >= 1 ? num(c.stadi) + " stadi da 60.000 posti pieni, vince una persona" : "meno di uno stadio") + "</dd>";
  }
  function apriPausa() {
    fermaToast();
    renderPausa();
    $("pausa").hidden = false;
    var resta = state.demo ? PAUSA_SECONDI_DEMO : PAUSA_SECONDI;
    var t = $("pausa-timer");
    t.textContent = "I numeri restano qui per " + resta + " secondi.";
    clearInterval(pausa.timer);
    pausa.timer = setInterval(function () {
      resta--;
      if (resta > 0) t.textContent = "Ancora " + resta + " secondi.";
      else { clearInterval(pausa.timer); t.innerHTML = "<strong>La scelta è tua.</strong>"; }
    }, 1000);
    $("pausa-chiudi").focus();
  }
  function chiudiPausa() {
    clearInterval(pausa.timer);
    $("pausa").hidden = true;
    $("btn-pausa").focus();
  }

  // ------------------------------------------------------------- avvio
  function init() {
    if (!M || !G || !Q) {
      $("main").innerHTML = '<p class="avviso">Impossibile caricare i dati o il motore di calcolo (data/*.js, src/motore.js).</p>';
      return;
    }
    if (demoDaUrl) $("demo-toggle").checked = true;
    state = statoIniziale();
    aggiornaDemo();
    $("demo-toggle").addEventListener("change", function () { aggiornaDemo(); state.risultati = null; });

    var nv = G.numeroVerde;
    if (nv) $("numero-verde").innerHTML = "Hai domande o preoccupazioni sul gioco? Telefono Verde Nazionale ISS: <strong>" +
      nv.numero + "</strong> — gratuito, anonimo, lun-ven 10:00-16:00.";

    renderQuiz($("quiz-prima"), domandePrima(), state.rispostePrima, null, aggiornaQuizPrima);
    $("soglia").value = state.soglia === null ? "" : String(state.soglia);
    $("soglia").addEventListener("input", leggiSoglia);
    renderAbitudine();
    initPausa();

    $("btn-banco").addEventListener("click", apriBanco);
    $("btn-inizia").addEventListener("click", function () { vai(2); });
    $("avanti-2").addEventListener("click", function () { if (completo(domandePrima(), state.rispostePrima)) vai(3); });
    $("avanti-3").addEventListener("click", function () { if (!$("avanti-3").disabled) vai(4); });
    $("avanti-6").addEventListener("click", function () { if (!$("avanti-6").disabled) vai(7); });
    $("btn-rivedi").addEventListener("click", avviaSimulazione);
    $("btn-altro-anno").addEventListener("click", function () { state.altroAnno = (state.altroAnno || 0) + 1; state.risultati = null; avviaSimulazione(); });
    $("btn-ricomincia").addEventListener("click", ricomincia);
    $("btn-ricomincia-top").addEventListener("click", ricomincia);
    document.querySelectorAll("[data-nav]").forEach(function (b) {
      b.addEventListener("click", function () { vai(state.schermata + (b.getAttribute("data-nav") === "next" ? 1 : -1)); });
    });
    vai(1);
  }

  init();
})();
