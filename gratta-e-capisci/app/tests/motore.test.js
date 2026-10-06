// Test del motore di calcolo (eseguiti da tests.html in Edge headless).
(function () {
  var M = window.Motore, G = window.GIOCHI;
  function vicino(a, b, tol, msg) {
    if (Math.abs(a - b) > tol) throw new Error((msg ? msg + ": " : "") + "atteso " + b + " ± " + tol + ", ottenuto " + a);
  }
  var salvatore = { voci: [{ gioco: "istantanea-5-a", volte: 2, periodo: "giorno" }] };

  // ---- Spesa (BR-03) ----
  test("10 €/giorno -> 3.650 €/anno", function () {
    assertEqual(M.spesaAnnuaDaGiornaliera(10), 3650);
    var s = M.spesa(salvatore);
    assertEqual(s.giorno, 10); assertEqual(s.anno, 3650);
    vicino(s.mese, 304.1667, 0.001, "mese");
  });
  test("spesa settimanale: 7 volte a settimana = 1 al giorno", function () {
    var s = M.spesa({ voci: [{ gioco: "istantanea-5-b", volte: 7, periodo: "settimana" }] });
    vicino(s.giorno, 5, 1e-9); vicino(s.anno, 1825, 1e-9);
  });
  test("spesa abitudine mista: 2 biglietti A + 1 biglietto B al giorno = 15 €", function () {
    var s = M.spesa({ voci: [salvatore.voci[0], { gioco: "istantanea-5-b", volte: 1, periodo: "giorno" }] });
    assertEqual(s.giorno, 15);
  });
  test("abitudine vuota -> spesa 0", function () { assertEqual(M.spesa({ voci: [] }).anno, 0); });
  test("gioco sconosciuto -> eccezione", function () {
    var ok = false; try { M.trovaGioco("xyz"); } catch (e) { ok = true; } assert(ok);
  });

  // ---- Dati coerenti con la fonte (BR-09) ----
  test("ogni gioco ha fonte con sezione di ricerca-azzardo.md", function () {
    G.giochi.forEach(function (g) {
      assert(g.fonte && g.fonte.url && /ricerca-azzardo\.md §/.test(g.fonte.sezione), "fonte mancante per " + g.id);
    });
    assert(/ricerca-azzardo\.md §6/.test(G.numeroVerde.sezione));
  });
  test("probabilita' calcolate = probabilita' dichiarate nella tabella ufficiale", function () {
    G.giochi.filter(function (g) { return g.tipo === "istantanea"; }).forEach(function (g) {
      g.premi.forEach(function (p) {
        if (p.unoSu === null) return;
        var calc = g.emissione / p.vincenti;
        // la fonte arrotonda all'intero (o a 2 decimali sotto 100)
        vicino(calc, p.unoSu, p.unoSu < 100 ? 0.51 : 0.5, g.id + " premio " + p.premio);
      });
    });
  });
  test("premio massimo modello A: 500.000 € con 1 su 12.480.000", function () {
    var pm = M.probabilitaPremioMax("istantanea-5-a");
    assertEqual(pm.premio, 500000); assertEqual(pm.unoSu, 12480000);
    assertEqual(M.formattaUnoSu(pm.unoSu), "1 su 12.480.000");
  });
  test("montepremi modello A = 177.740.800 € (§1.1)", function () {
    vicino(M.valoreAtteso("istantanea-5-a").ritorno * 49920000, 177740800, 1e-3);
  });
  test("payout = valori dichiarati (A 71,2%, B 60,1%)", function () {
    G.giochi.forEach(function (g) { vicino(M.payout(g.id), g.dichiarati.payout, 0.0006, g.id); });
  });
  test("quota biglietti vincenti = dichiarata (A 23,8%, B 13,9% = 1 su 7,20)", function () {
    vicino(M.probabilitaVincita("istantanea-5-a"), 0.238, 0.0005);
    vicino(M.probabilitaVincita("istantanea-5-b"), 0.139, 0.0005);
    vicino(1 / M.probabilitaVincita("istantanea-5-b"), 7.20, 0.005);
  });
  test("payout dei biglietti sotto il tetto medio di legge del 75% (§3)", function () {
    G.giochi.filter(function (g) { return g.tipo === "istantanea"; }).forEach(function (g) {
      assert(M.payout(g.id) <= G.tettoPayoutLotterie.valore, g.id);
    });
  });
  test("giochi selezionabili: solo lotterie istantanee con tabella ADM (nessun Lotto)", function () {
    assertEqual(G.giochi.map(function (g) { return g.id; }), ["istantanea-5-a", "istantanea-5-b"]);
    G.giochi.forEach(function (g) { assertEqual(g.tipo, "istantanea"); assertEqual(g.fonte.affidabilita, "UFF"); });
    assertEqual([G.estrazioni.numeri, G.estrazioni.estratti], [90, 5]);
  });

  // ---- Valore atteso e perdita attesa (BR-04) ----
  test("perdita attesa Salvatore: 3.650 € × 28,79% ≈ 1.050,83 €/anno", function () {
    var p = M.perditaAttesa(salvatore);
    vicino(p.anno, 3650 * (1 - 177740800 / 249600000), 1e-6);
    vicino(p.anno, 1050.83, 0.01); vicino(p.perEuro, 0.288, 0.0006);
    vicino(p.spesaAnno, 3650, 1e-9);
  });
  test("anni attesi per il premio massimo: Salvatore ≈ 17.096 anni", function () {
    var a = M.anniAttesiPremioMax(salvatore)[0];
    assertEqual(a.giocateAnno, 730); vicino(a.anni, 12480000 / 730, 1e-6);
  });
  test("trasferimento: 2 € × 100 giocate, payout 70% -> 60 €", function () {
    vicino(M.perditaAttesaSu(2, 0.7, 100), 60, 1e-9);
  });

  // ---- PRNG e simulazione (BR-04, BR-10) ----
  test("PRNG: stesso seme -> stessa sequenza, semi diversi -> sequenze diverse", function () {
    var a = M.creaPRNG(42), b = M.creaPRNG(42), c = M.creaPRNG(43);
    var sa = [], sb = [], sc = [];
    for (var i = 0; i < 20; i++) { sa.push(a()); sb.push(b()); sc.push(c()); }
    assertEqual(sa, sb); assert(JSON.stringify(sa) !== JSON.stringify(sc));
    sa.forEach(function (x) { assert(x >= 0 && x < 1); });
  });
  test("simulaAnno riproducibile con lo stesso seme (seme demo)", function () {
    var s1 = M.simulaAnno(G.abitudineDemo, G.seme.demo), s2 = M.simulaAnno(G.abitudineDemo, G.seme.demo);
    assertEqual(s1, s2);
  });
  test("simulaAnno: 365 giorni, speso 3.650 €, cumulati coerenti", function () {
    var s = M.simulaAnno(salvatore, 7);
    assertEqual(s.giorni.length, 365); assertEqual(s.totale.speso, 3650);
    var ultimo = s.giorni[364];
    assertEqual(ultimo.spesoCum, 3650); assertEqual(ultimo.vintoCum, s.totale.vinto);
    assertEqual(s.totale.perso, s.totale.speso - s.totale.vinto);
    s.vincite.forEach(function (v) { assert(v.premio >= 100); });
  });
  test("simulaAnno settimanale: 3 volte a settimana -> 156 giocate in 365 giorni", function () {
    var s = M.simulaAnno({ voci: [{ gioco: "istantanea-5-b", volte: 3, periodo: "settimana" }] }, 1);
    assertEqual(s.totale.speso, 5 * Math.floor(365 * 3 / 7));
  });
  test("convergenza lotteria A: quota vincenti e ritorno medio (premi <= 1.000 €) su 400.000 giocate", function () {
    var g = M.trovaGioco("istantanea-5-a"), rnd = M.creaPRNG(12345), n = 400000;
    var vincenti = 0, somma = 0;
    for (var i = 0; i < n; i++) {
      var p = M.estraiPremio(g.id, rnd);
      if (p > 0) vincenti++;
      if (p <= 1000) somma += p;
    }
    var attesoCap = g.premi.filter(function (x) { return x.premio <= 1000; })
      .reduce(function (s, x) { return s + x.premio * x.vincenti / g.emissione; }, 0);
    vicino(vincenti / n, M.probabilitaVincita(g.id), 0.003, "quota vincenti");
    vicino(somma / n, attesoCap, 0.1, "ritorno medio per giocata");
  });

  // ---- Ritardatari (BR-05) ----
  test("ritardatari: frequenza dopo un ritardo = frequenza generale = 5/90", function () {
    var r = M.simulaRitardatari(2026, 200000, 90, 30);
    vicino(r.probabilitaTeorica, 5 / 90, 1e-12);
    vicino(r.frequenza, 5 / 90, 0.003, "frequenza generale");
    assert(r.casiInRitardo > 1000, "pochi casi in ritardo: " + r.casiInRitardo);
    vicino(r.frequenzaDopoRitardo, 5 / 90, 0.008, "frequenza dopo ritardo");
  });
  test("ritardatari riproducibile con lo stesso seme", function () {
    assertEqual(M.simulaRitardatari(5, 5000), M.simulaRitardatari(5, 5000));
  });

  // ---- Quiz (BR-06/07) ----
  test("quiz: le risposte corrette coincidono con il motore", function () {
    window.QUIZ.domande.forEach(function (q) {
      assert(q.opzioni.some(function (o) { return o.chiave === q.corretta; }), q.id + " senza opzione corretta");
      var v = q.verifica; if (!v) return;
      if (v.tipo === "spesaAnnua") assertEqual(M.spesaAnnuaDaGiornaliera(v.giornaliera), v.valore);
      if (v.tipo === "premioMax") assertEqual(M.probabilitaPremioMax(v.gioco).unoSu, v.unoSu);
      if (v.tipo === "trasferimento") vicino(M.perditaAttesaSu(v.prezzo, v.payout, v.giocate), v.valore, 1e-9);
    });
  });
  test("verificaQuiz e confrontaQuiz: 1/3 prima, 3/3 dopo", function () {
    var tre = window.QUIZ.domande.filter(function (q) { return q.fase === "entrambi"; });
    var prima = M.verificaQuiz(tre, { q1: "c", q2: "a" });
    assertEqual(prima.punteggio, 1); assertEqual(prima.totale, 3);
    assertEqual(prima.dettaglio[2].risposta, null);
    var dopo = M.verificaQuiz(tre, { q1: "c", q2: "c", q3: "b" });
    assertEqual(M.confrontaQuiz(prima, dopo), { prima: 1, totalePrima: 3, dopo: 3, totaleDopo: 3, delta: 2 });
  });

  // ---- Le vincite che non sono vincite (BR-13, L1) ----
  test("riepilogoVincite modello A: valori esatti dalla tabella ADM (23,8% / 38,5% / 79,4%)", function () {
    var r = M.riepilogoVincite("istantanea-5-a");
    assertEqual(r.vincenti, { rimborso: 4576000, piccole: 4867200, reali: 2450256, totale: 11893456 });
    vicino(r.quotaBigliettiVincenti, 11893456 / 49920000, 1e-12);
    vicino(r.quotaRimborso, 4576000 / 11893456, 1e-12);
    vicino(r.quotaPiccole, (4576000 + 4867200) / 11893456, 1e-12);
    vicino(r.quotaBigliettiVincenti, 0.238, 0.0005);
    vicino(r.quotaRimborso, 0.385, 0.0005);
    vicino(r.quotaPiccole, 0.794, 0.0005);
    vicino(r.quotaSoloPiccole + r.quotaRimborso + r.quotaReali, 1, 1e-12);
  });
  test("riepilogoVincite modello B (nessun rimborso)", function () {
    var b = M.riepilogoVincite("istantanea-5-b");
    assertEqual(b.quotaRimborso, 0);
    vicino(b.quotaPiccole, 2816000 / 5332875, 1e-12);
  });
  test("classeVincita: rimborso, piccole, reali", function () {
    assertEqual(M.classeVincita(5, 5), "rimborso"); assertEqual(M.classeVincita(10, 5), "piccole");
    assertEqual(M.classeVincita(20, 5), "reali"); assertEqual(M.classeVincita(0, 5), null);
  });
  test("simulaAnno: classiVincite coerenti con gli eventi dei giorni", function () {
    var s = M.simulaAnno(G.abitudineDemo, G.seme.demo), c = s.totale.classiVincite;
    var conta = { rimborso: 0, piccole: 0, reali: 0 }, vinto = 0;
    s.giorni.forEach(function (g) {
      if (!g.eventi) { assertEqual(g.vinto, 0); return; }
      assert(g.eventi.length > 0);
      g.eventi.forEach(function (e) { conta[e.classe]++; vinto += e.premio; assertEqual(M.classeVincita(e.premio, 5), e.classe); });
    });
    assertEqual([c.rimborso, c.piccole, c.reali], [conta.rimborso, conta.piccole, conta.reali]);
    assertEqual(c.totale, c.rimborso + c.piccole + c.reali);
    assertEqual(s.totale.vinciteRimborso, c.rimborso); assertEqual(vinto, s.totale.vinto);
    // 730 biglietti: ~174 vincite attese, ~67 rimborsi
    vicino(c.totale / 730, 0.238, 0.05); vicino(c.rimborso / c.totale, 0.385, 0.1);
  });

  // ---- Dalla parte del banco (BR-14, L2) ----
  var folla = null, tempoFolla = 0;
  function follaDemo() {
    if (!folla) { var t0 = performance.now(); folla = M.simulaFolla(G.abitudineDemo, G.seme.demo); tempoFolla = performance.now() - t0; }
    return folla;
  }
  test("simulaFolla 10.000 persone: sotto 1,5 s", function () {
    follaDemo(); assert(tempoFolla < 1500, "tempo " + tempoFolla.toFixed(0) + " ms");
    window.__tempoFolla = tempoFolla;
  });
  test("simulaFolla riproducibile con lo stesso seme, diversa con altro seme", function () {
    var a = M.simulaFolla(G.abitudineDemo, 7, 300), b = M.simulaFolla(G.abitudineDemo, 7, 300), c = M.simulaFolla(G.abitudineDemo, 8, 300);
    assertEqual(a, b); assert(a.vinto !== c.vinto);
  });
  test("simulaFolla: perdita media ≈ valore atteso (1.050,83 €), quota in attivo plausibile", function () {
    var f = follaDemo(), atteso = M.perditaAttesa(G.abitudineDemo).anno;
    assertEqual(f.n, 10000); assertEqual(f.speso, 3650 * 10000);
    assertEqual(f.incassoBanco, f.speso - f.vinto);
    vicino(f.perditaMedia, atteso, 160, "perdita media");   // sd della media ~39 € (dominata dai premi rari)
    assert(f.perditaMediana > atteso, "mediana > media: la maggior parte perde piu' del valore atteso");
    assert(f.quotaInAttivo > 0.003 && f.quotaInAttivo < 0.05, "quota in attivo " + f.quotaInAttivo);
    assertEqual(f.quotaInAttivo, f.inAttivo / f.n);
    window.__folla = f;
  });

  // ---- Scale fisiche, soglie, conto biglietto (BR-15, BR-16, BR-17) ----
  test("scalaFisica: 1 su 12.480.000 = 208 stadi da 60.000 posti", function () {
    assertEqual(M.scalaFisica(12480000), { stadi: 208, postiStadio: 60000 });
  });
  test("superaSoglia: 304,17 €/mese contro soglie 100, 304,17, 500", function () {
    var s = M.superaSoglia(salvatore, 100);
    assertEqual(s.supera, true); vicino(s.spesaMese, 304.1667, 0.001); vicino(s.eccedenza, 204.1667, 0.001);
    assertEqual(M.superaSoglia(salvatore, 3650 / 12).supera, false);
    assertEqual(M.superaSoglia(salvatore, 500), { supera: false, spesaMese: 3650 / 12, eccedenza: 0 });
    assertEqual(M.superaSoglia(salvatore, 0).supera, true);
    assertEqual(M.superaSoglia(salvatore, null).supera, false);
    assertEqual(M.superaSoglia(salvatore, "abc").supera, false);
    assertEqual(M.superaSoglia({ voci: [] }, 0).supera, false);
  });
  test("contoBiglietto modello A", function () {
    var c = M.contoBiglietto("istantanea-5-a");
    assertEqual(c.costo, 5); vicino(c.perditaMediaPerBiglietto, 5 - 177740800 / 49920000, 1e-9);
    vicino(c.quotaRimborso, 0.385, 0.0005); assertEqual(c.unoSu, 12480000); assertEqual(c.stadi, 208);
  });
  test("dato Italia 2024: 21,5 mld persi, fonte §4", function () {
    assertEqual(G.italia2024.perditaNetta, 21500000000);
    assert(/ricerca-azzardo\.md §4/.test(G.italia2024.fonte.sezione));
  });

  // ---- Formattazione ----
  test("formattaEuro in it-IT", function () {
    assertEqual(M.formattaEuro(3650), "3.650 €");
    assertEqual(M.formattaEuro(1050.8256, 2), "1.050,83 €");
    assertEqual(M.formattaEuro(5), "5 €");
    assertEqual(M.formattaUnoSu(400.5), "1 su 401");
  });
})();
