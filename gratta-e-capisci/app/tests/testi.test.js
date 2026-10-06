// Test "guardia dei testi" (leva L4, vincolo T2-V3): l'app informa, non consiglia ne' giudica.
// Scansiona index.html, src/ui.js e data/quiz.js alla ricerca delle formule vietate (le stesse
// bloccate in scrittura da .claude/hooks/guardrail-t2.ps1).
//
// Lettura preferita: XHR sincrona sul file (funziona se l'app e' servita via http(s)).
// Nota empirica: aperta come file:///..., Chromium/Edge nega sempre la XHR tra file:// diversi
// (NetworkError), anche su file dello stesso progetto, perche' ogni file:// e' un'origine a se'.
// In quel caso si ripiega su window.QUIZ (dati gia' caricati in tests.html) o, se non
// disponibile, il test lo segnala esplicitamente nel proprio nome invece di passare in silenzio.
(function () {
  var FORMULE_VIETATE = [
    "conviene",
    "ti consiglio",
    "ti consigliamo",
    "smetti",
    "gioca meno",
    "dovresti smettere",
    "dovresti giocare",
    "non giocare",
    "faresti meglio"
  ];

  function trovaFormule(testo) {
    if (!testo) return [];
    var basso = String(testo).toLowerCase();
    return FORMULE_VIETATE.filter(function (f) { return basso.indexOf(f) !== -1; });
  }

  // Tenta una lettura sincrona del file; ritorna null se non e' possibile (es. CORS su file://).
  function leggiSincrono(percorso) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", percorso, false);
      xhr.send(null);
      if (xhr.status === 0 || xhr.status === 200) return xhr.responseText;
      return null;
    } catch (e) {
      return null;
    }
  }

  // Prepara la verifica su index.html: letto via XHR se possibile, altrimenti via window.QUIZ
  // non si applica (non e' dati), quindi il ripiego e' dichiarare la verifica "non eseguita"
  // nel nome del test, cosi' resta visibile in RISULTATO invece di dare un falso senso di sicurezza.
  function preparaVerificaTesto(nome, percorso) {
    var testo = leggiSincrono(percorso);
    if (testo !== null) {
      return { nomeCompleto: nome + " [letto via XHR] non contiene formule vietate (T2-V3)", testo: testo, eseguita: true };
    }
    return {
      nomeCompleto: nome + " [XHR non disponibile su file://, verifica NON eseguita qui: vedi guardrail-t2.ps1 e docs/qa/evidenze-hook-t2.md]",
      testo: "",
      eseguita: false
    };
  }

  var vIndex = preparaVerificaTesto("index.html", "../index.html");
  var vUi = preparaVerificaTesto("src/ui.js", "../src/ui.js");

  test(vIndex.nomeCompleto, function () {
    var trovate = trovaFormule(vIndex.testo);
    assert(trovate.length === 0, "index.html contiene formule vietate T2-V3: " + trovate.join(", "));
  });

  test(vUi.nomeCompleto, function () {
    var trovate = trovaFormule(vUi.testo);
    assert(trovate.length === 0, "src/ui.js contiene formule vietate T2-V3: " + trovate.join(", "));
  });

  test("data/quiz.js (window.QUIZ) non contiene formule da consiglio o giudizio (T2-V3)", function () {
    var testoQuiz = leggiSincrono("../data/quiz.js");
    if (testoQuiz === null) {
      // Ripiego solido e sempre disponibile: quiz.js e' gia' caricato come script in
      // tests.html, quindi il suo contenuto dati e' interamente ispezionabile via window.QUIZ.
      testoQuiz = JSON.stringify(window.QUIZ || {});
      assert(window.QUIZ, "window.QUIZ non e' disponibile: impossibile verificare data/quiz.js");
    }
    var trovate = trovaFormule(testoQuiz);
    assert(trovate.length === 0, "data/quiz.js contiene formule vietate T2-V3: " + trovate.join(", "));
  });
})();
