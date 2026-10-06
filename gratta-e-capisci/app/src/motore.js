// Motore di calcolo di "Fortuna in Chiaro": funzioni pure, nessun accesso al DOM.
// Dipende solo dai dati in window.GIOCHI (data/giochi.js). Contratto in app/ARCHITETTURA.md §3.
(function (root) {
  "use strict";

  var GIORNI_ANNO = 365;
  var SOGLIA_VINCITA_NOTEVOLE = 100;

  function dati() {
    if (!root.GIOCHI) throw new Error("window.GIOCHI non caricato (data/giochi.js)");
    return root.GIOCHI;
  }

  function trovaGioco(id) {
    var g = dati().giochi.filter(function (x) { return x.id === id; })[0];
    if (!g) throw new Error("Gioco sconosciuto: " + id);
    return g;
  }

  // Costo di una giocata: prezzo del biglietto.
  function costoGiocata(gioco) { return gioco.prezzo; }

  function giocateAlGiorno(voce) {
    var v = Number(voce.volte) || 0;
    return voce.periodo === "settimana" ? v / 7 : v;
  }

  // ---- Spesa -------------------------------------------------------------
  function spesaAnnuaDaGiornaliera(eur) { return eur * GIORNI_ANNO; }

  function spesa(abitudine) {
    var giorno = 0;
    (abitudine.voci || []).forEach(function (voce) {
      giorno += giocateAlGiorno(voce) * costoGiocata(trovaGioco(voce.gioco));
    });
    var anno = spesaAnnuaDaGiornaliera(giorno);
    return { giorno: giorno, mese: anno / 12, anno: anno };
  }

  // ---- Valore atteso -----------------------------------------------------
  function valoreAtteso(giocoId) {
    var g = trovaGioco(giocoId);
    var costo = costoGiocata(g);
    var montepremi = g.premi.reduce(function (s, p) { return s + p.premio * p.vincenti; }, 0);
    var ritorno = montepremi / g.emissione;
    return { costo: costo, ritorno: ritorno, perEuro: ritorno / costo };
  }

  function payout(giocoId) { return valoreAtteso(giocoId).perEuro; }

  function perditaAttesa(abitudine) {
    var spesaGiorno = 0, ritornoGiorno = 0;
    (abitudine.voci || []).forEach(function (voce) {
      var va = valoreAtteso(voce.gioco);
      var n = giocateAlGiorno(voce);
      spesaGiorno += n * va.costo;
      ritornoGiorno += n * va.ritorno;
    });
    var perditaGiorno = spesaGiorno - ritornoGiorno;
    return {
      giorno: perditaGiorno,
      anno: perditaGiorno * GIORNI_ANNO,
      spesaAnno: spesaGiorno * GIORNI_ANNO,
      ritornoAnno: ritornoGiorno * GIORNI_ANNO,
      perEuro: spesaGiorno > 0 ? perditaGiorno / spesaGiorno : 0
    };
  }

  // Domanda di trasferimento: biglietto ipotetico con prezzo e payout dati.
  function perditaAttesaSu(prezzo, payoutFrazione, giocate) {
    return prezzo * giocate * (1 - payoutFrazione);
  }

  // ---- Probabilita' ------------------------------------------------------
  function probabilitaPremioMax(giocoId) {
    var g = trovaGioco(giocoId);
    var max = g.premi.reduce(function (a, b) { return b.premio > a.premio ? b : a; });
    return { premio: max.premio, p: max.vincenti / g.emissione, unoSu: g.emissione / max.vincenti };
  }

  function probabilitaVincita(giocoId) {
    var g = trovaGioco(giocoId);
    var tot = g.premi.reduce(function (s, p) { return s + p.vincenti; }, 0);
    return tot / g.emissione;
  }

  function anniAttesiPremioMax(abitudine) {
    return (abitudine.voci || []).map(function (voce) {
      var pm = probabilitaPremioMax(voce.gioco);
      var giocateAnno = giocateAlGiorno(voce) * GIORNI_ANNO;
      return {
        gioco: voce.gioco,
        premio: pm.premio,
        giocateAnno: giocateAnno,
        anni: giocateAnno > 0 ? 1 / (giocateAnno * pm.p) : Infinity
      };
    });
  }

  // ---- PRNG con seme (mulberry32) ----------------------------------------
  function creaPRNG(seme) {
    var a = (Number(seme) >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Distribuzione cumulativa per categoria (estrazione con reinserimento: approssimazione dichiarata).
  var cacheCumulate = {};
  function cumulata(g) {
    if (cacheCumulate[g.id]) return cacheCumulate[g.id];
    var acc = 0;
    var c = g.premi.map(function (p) { acc += p.vincenti / g.emissione; return { soglia: acc, premio: p.premio }; });
    cacheCumulate[g.id] = c;
    return c;
  }

  // Campionatore veloce: u in [0,1) -> premio. Stessa mappatura di estraiPremio (stesse estrazioni
  // a parita' di seme), ma senza ricerca del gioco a ogni giocata e con uscita immediata per i
  // biglietti non vincenti (~76% dei casi) e ricerca binaria sulla cumulata.
  function campionatore(g) {
    var c = cumulata(g), n = c.length;
    var soglie = c.map(function (x) { return x.soglia; }), premi = c.map(function (x) { return x.premio; });
    var pTot = soglie[n - 1];
    return function (u) {
      if (u >= pTot) return 0;
      var lo = 0, hi = n - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (u < soglie[mid]) hi = mid; else lo = mid + 1; }
      return premi[lo];
    };
  }

  function estraiPremio(giocoId, rnd) {
    var g = trovaGioco(giocoId);
    var u = rnd();
    var c = cumulata(g);
    for (var i = 0; i < c.length; i++) if (u < c[i].soglia) return c[i].premio;
    return 0;
  }

  // ---- Le vincite che non sono vincite (BR-13, L1) -----------------------
  // rimborso: premio = costo della giocata; piccole: costo < premio <= 2 x costo; reali: premio > 2 x costo.
  function classeVincita(premio, costo) {
    if (premio <= 0) return null;
    if (premio <= costo) return "rimborso";
    if (premio <= 2 * costo) return "piccole";
    return "reali";
  }

  // Calcolo esatto dalla tabella premi (non simulato).
  // quotaBigliettiVincenti = biglietti con un premio qualsiasi / emissione;
  // quotaRimborso = vincite pari al costo / vincite totali;
  // quotaPiccole  = vincite fino a 2 x costo (rimborso INCLUSO, cumulata) / vincite totali;
  // quotaSoloPiccole = vincite con costo < premio <= 2 x costo / vincite totali; quotaReali = il resto.
  function riepilogoVincite(giocoId) {
    var g = trovaGioco(giocoId);
    var costo = costoGiocata(g), conta = { rimborso: 0, piccole: 0, reali: 0 }, tot = 0;
    g.premi.forEach(function (p) { conta[classeVincita(p.premio, costo)] += p.vincenti; tot += p.vincenti; });
    return {
      quotaBigliettiVincenti: tot / g.emissione,
      quotaRimborso: conta.rimborso / tot,
      quotaPiccole: (conta.rimborso + conta.piccole) / tot,
      quotaSoloPiccole: conta.piccole / tot,
      quotaReali: conta.reali / tot,
      vincenti: { rimborso: conta.rimborso, piccole: conta.piccole, reali: conta.reali, totale: tot },
      emissione: g.emissione
    };
  }

  // ---- Probabilita' in cose fisiche (BR-15, L3) --------------------------
  var POSTI_STADIO = 60000;
  function scalaFisica(unoSu) {
    return { stadi: Math.round(unoSu / POSTI_STADIO), postiStadio: POSTI_STADIO };
  }

  // ---- Soglia scelta dall'utente (BR-16, CR1) ----------------------------
  // sogliaMensile non numerica o negativa = nessuna soglia impostata -> supera false.
  function superaSoglia(abitudine, sogliaMensile) {
    var spesaMese = spesa(abitudine).mese, s = Number(sogliaMensile);
    var valida = sogliaMensile !== null && sogliaMensile !== "" && isFinite(s) && s >= 0;
    var supera = valida && spesaMese > s + 1e-9;
    return { supera: supera, spesaMese: spesaMese, eccedenza: supera ? spesaMese - s : 0 };
  }

  // ---- Pausa e Conto (BR-17, CR2): i numeri di un singolo biglietto -----
  function contoBiglietto(giocoId) {
    var va = valoreAtteso(giocoId), pm = probabilitaPremioMax(giocoId);
    return {
      costo: va.costo,
      perditaMediaPerBiglietto: va.costo - va.ritorno,
      quotaRimborso: riepilogoVincite(giocoId).quotaRimborso,
      unoSu: pm.unoSu,
      stadi: scalaFisica(pm.unoSu).stadi
    };
  }

  function giocateNelGiorno(voce, d) {
    var v = Number(voce.volte) || 0;
    if (voce.periodo === "settimana") return Math.floor((d + 1) * v / 7) - Math.floor(d * v / 7);
    return v;
  }

  // ---- Un anno in 10 secondi ---------------------------------------------
  function simulaAnno(abitudine, seme, giorni) {
    var n = giorni || GIORNI_ANNO;
    var rnd = creaPRNG(seme);
    var serie = [], vincite = [];
    var spesoCum = 0, vintoCum = 0;
    var voci = preparaVoci(abitudine);
    var classi = { rimborso: 0, piccole: 0, reali: 0, totale: 0 };
    for (var d = 0; d < n; d++) {
      var speso = 0, vinto = 0, eventi = [];
      for (var j = 0; j < voci.length; j++) {
        var voce = voci[j];
        var k = giocateNelGiorno(voce.voce, d);
        for (var i = 0; i < k; i++) {
          speso += voce.costo;
          var premio = voce.estrai(rnd());
          if (premio <= 0) continue;
          vinto += premio;
          var classe = classeVincita(premio, voce.costo);
          classi[classe]++; classi.totale++;
          eventi.push({ premio: premio, classe: classe, gioco: voce.id, costo: voce.costo });
          if (premio >= SOGLIA_VINCITA_NOTEVOLE) vincite.push({ giorno: d + 1, gioco: voce.id, premio: premio });
        }
      }
      spesoCum += speso;
      vintoCum += vinto;
      var giorno = { giorno: d + 1, speso: speso, vinto: vinto, spesoCum: spesoCum, vintoCum: vintoCum };
      if (eventi.length) giorno.eventi = eventi;
      serie.push(giorno);
    }
    return {
      giorni: serie,
      totale: { speso: spesoCum, vinto: vintoCum, perso: spesoCum - vintoCum,
        classiVincite: classi, vinciteRimborso: classi.rimborso },
      vincite: vincite
    };
  }

  function preparaVoci(abitudine) {
    return (abitudine.voci || []).map(function (voce) {
      var g = trovaGioco(voce.gioco);
      return { voce: voce, id: g.id, costo: costoGiocata(g), estrai: campionatore(g) };
    });
  }

  // ---- Dalla parte del banco: n persone come te per un anno (BR-14, L2) ----
  // Un solo PRNG con seme, persone simulate in sequenza: risultato riproducibile.
  // inAttivo = persone con vinto > speso a fine anno.
  function simulaFolla(abitudine, seme, n) {
    var persone = n || 10000;
    var rnd = creaPRNG(seme);
    var voci = preparaVoci(abitudine);
    var perdite = new Float64Array(persone);
    var spesoTot = 0, vintoTot = 0, inAttivo = 0;
    for (var p = 0; p < persone; p++) {
      var speso = 0, vinto = 0;
      for (var d = 0; d < GIORNI_ANNO; d++) {
        for (var j = 0; j < voci.length; j++) {
          var v = voci[j], k = giocateNelGiorno(v.voce, d);
          for (var i = 0; i < k; i++) { speso += v.costo; vinto += v.estrai(rnd()); }
        }
      }
      spesoTot += speso; vintoTot += vinto;
      if (vinto > speso) inAttivo++;
      perdite[p] = speso - vinto;
    }
    var ordinate = Array.prototype.slice.call(perdite).sort(function (a, b) { return a - b; });
    var mediana = persone % 2 ? ordinate[(persone - 1) / 2] : (ordinate[persone / 2 - 1] + ordinate[persone / 2]) / 2;
    return {
      n: persone,
      inAttivo: inAttivo,
      quotaInAttivo: inAttivo / persone,
      speso: spesoTot,
      vinto: vintoTot,
      incassoBanco: spesoTot - vintoTot,
      perditaMedia: (spesoTot - vintoTot) / persone,
      perditaMediana: mediana
    };
  }

  // ---- Simulatore dei "ritardatari" --------------------------------------
  // Concetto, non gioco selezionabile: un'estrazione di 5 numeri su 90, come nel Lotto.
  // Estrae n volte 5 numeri distinti su 90; misura quante volte "numero" esce in generale
  // e quante volte esce quando e' in ritardo da almeno ritardoMinimo estrazioni.
  function simulaRitardatari(seme, n, numero, ritardoMinimo) {
    var L = dati().estrazioni;
    var bersaglio = numero || L.numeri;
    var soglia = ritardoMinimo === undefined ? 100 : ritardoMinimo;
    var rnd = creaPRNG(seme);
    var uscite = 0, casiInRitardo = 0, usciteDopoRitardo = 0, ritardo = 0, ritardoMassimo = 0;
    var urna = [];
    for (var e = 0; e < n; e++) {
      // estrazione senza reinserimento di 5 numeri su 90 (Fisher-Yates parziale)
      urna.length = 0;
      for (var x = 1; x <= L.numeri; x++) urna.push(x);
      var uscito = false;
      for (var s = 0; s < L.estratti; s++) {
        var r = s + Math.floor(rnd() * (L.numeri - s));
        var tmp = urna[s]; urna[s] = urna[r]; urna[r] = tmp;
        if (urna[s] === bersaglio) uscito = true;
      }
      var inRitardo = ritardo >= soglia;
      if (inRitardo) casiInRitardo++;
      if (uscito) {
        uscite++;
        if (inRitardo) usciteDopoRitardo++;
        ritardo = 0;
      } else {
        ritardo++;
        if (ritardo > ritardoMassimo) ritardoMassimo = ritardo;
      }
    }
    return {
      estrazioni: n,
      numero: bersaglio,
      ritardoMinimo: soglia,
      probabilitaTeorica: L.estratti / L.numeri,
      uscite: uscite,
      frequenza: n > 0 ? uscite / n : 0,
      casiInRitardo: casiInRitardo,
      usciteDopoRitardo: usciteDopoRitardo,
      frequenzaDopoRitardo: casiInRitardo > 0 ? usciteDopoRitardo / casiInRitardo : null,
      ritardoMassimo: ritardoMassimo
    };
  }

  // ---- Quiz --------------------------------------------------------------
  // domande: array di { id, corretta }; risposte: { [id]: chiaveOpzione }
  function verificaQuiz(domande, risposte) {
    var r = risposte || {};
    var dettaglio = domande.map(function (q) {
      var data = r[q.id] === undefined ? null : r[q.id];
      return { id: q.id, risposta: data, corretta: q.corretta, ok: data === q.corretta };
    });
    var punteggio = dettaglio.filter(function (x) { return x.ok; }).length;
    return { punteggio: punteggio, totale: domande.length, dettaglio: dettaglio };
  }

  function confrontaQuiz(prima, dopo) {
    return {
      prima: prima.punteggio, totalePrima: prima.totale,
      dopo: dopo.punteggio, totaleDopo: dopo.totale,
      delta: dopo.punteggio - prima.punteggio
    };
  }

  // ---- Formattazione -----------------------------------------------------
  function formattaNumero(n, decimali) {
    // Formattazione manuale: Intl it-IT non raggruppa i numeri a 4 cifre (3650 invece di 3.650).
    var d = decimali || 0;
    var x = Number(n);
    var segno = x < 0 ? "-" : "";
    var parti = Math.abs(x).toFixed(d).split(".");
    var intero = parti[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return segno + intero + (d > 0 ? "," + parti[1] : "");
  }
  function formattaEuro(n, decimali) { return formattaNumero(n, decimali) + " €"; }
  function formattaUnoSu(n) { return "1 su " + formattaNumero(Math.round(n)); }

  root.Motore = {
    GIORNI_ANNO: GIORNI_ANNO,
    trovaGioco: trovaGioco,
    spesa: spesa,
    spesaAnnuaDaGiornaliera: spesaAnnuaDaGiornaliera,
    valoreAtteso: valoreAtteso,
    payout: payout,
    perditaAttesa: perditaAttesa,
    perditaAttesaSu: perditaAttesaSu,
    probabilitaPremioMax: probabilitaPremioMax,
    probabilitaVincita: probabilitaVincita,
    anniAttesiPremioMax: anniAttesiPremioMax,
    creaPRNG: creaPRNG,
    estraiPremio: estraiPremio,
    simulaAnno: simulaAnno,
    simulaFolla: simulaFolla,
    classeVincita: classeVincita,
    riepilogoVincite: riepilogoVincite,
    scalaFisica: scalaFisica,
    superaSoglia: superaSoglia,
    contoBiglietto: contoBiglietto,
    simulaRitardatari: simulaRitardatari,
    verificaQuiz: verificaQuiz,
    confrontaQuiz: confrontaQuiz,
    formattaNumero: formattaNumero,
    formattaEuro: formattaEuro,
    formattaUnoSu: formattaUnoSu
  };
})(typeof window !== "undefined" ? window : this);
