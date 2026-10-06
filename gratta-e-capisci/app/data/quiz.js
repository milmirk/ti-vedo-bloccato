// Quiz prima/dopo (BR-06). Le risposte corrette sono verificate dai test contro il motore e i dati.
// "fase": "entrambi" = quiz prima e dopo; "dopo" = solo quiz dopo (domanda di trasferimento).
window.QUIZ = {
  domande: [
    {
      id: "q1",
      fase: "entrambi",
      testo: "Se giochi 10 € al giorno, quanto spendi in un anno?",
      opzioni: [
        { chiave: "a", testo: "Circa 365 €" },
        { chiave: "b", testo: "Circa 1.200 €" },
        { chiave: "c", testo: "3.650 €" },
        { chiave: "d", testo: "Circa 36.500 €" }
      ],
      corretta: "c",
      spiegazione: "10 € × 365 giorni = 3.650 €.",
      verifica: { tipo: "spesaAnnua", giornaliera: 10, valore: 3650 }
    },
    {
      id: "q2",
      fase: "entrambi",
      testo: "Con un biglietto da 5 € della lotteria istantanea (modello A), che probabilità hai di vincere il premio massimo?",
      opzioni: [
        { chiave: "a", testo: "1 su 1.000" },
        { chiave: "b", testo: "1 su 100.000" },
        { chiave: "c", testo: "1 su 12.480.000" },
        { chiave: "d", testo: "1 su 10" }
      ],
      corretta: "c",
      spiegazione: "Su 49.920.000 biglietti emessi, i premi massimi sono 4: 1 su 12.480.000 (fonte ADM).",
      verifica: { tipo: "premioMax", gioco: "istantanea-5-a", unoSu: 12480000 }
    },
    {
      id: "q3",
      fase: "entrambi",
      testo: "Al Lotto un numero non esce da 100 estrazioni. Alla prossima estrazione ha:",
      opzioni: [
        { chiave: "a", testo: "Più probabilità di uscire, perché è in ritardo" },
        { chiave: "b", testo: "La stessa probabilità di sempre" },
        { chiave: "c", testo: "Meno probabilità di uscire" }
      ],
      corretta: "b",
      spiegazione: "Le estrazioni sono indipendenti: il ritardo non cambia la probabilità."
    },
    {
      id: "q4",
      fase: "dopo",
      testo: "Un biglietto ipotetico da 2 € restituisce in media il 70% di quanto si gioca. Quanto perdi in media su 100 giocate?",
      opzioni: [
        { chiave: "a", testo: "Niente, prima o poi si vince" },
        { chiave: "b", testo: "20 €" },
        { chiave: "c", testo: "60 €" },
        { chiave: "d", testo: "140 €" }
      ],
      corretta: "c",
      spiegazione: "Giochi 2 € × 100 = 200 €; in media ne tornano il 70% (140 €): perdi 60 €. Biglietto inventato per l'esercizio, non è un gioco reale.",
      verifica: { tipo: "trasferimento", prezzo: 2, payout: 0.7, giocate: 100, valore: 60 }
    }
  ]
};
