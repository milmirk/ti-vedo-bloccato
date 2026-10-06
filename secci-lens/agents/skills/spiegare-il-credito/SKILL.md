---
name: spiegare-il-credito
description: Regole per spiegare un finanziamento (modulo SECCI, TAN, TAEG, rate, spese) in italiano semplice, fedele al documento e senza consigli. Usala quando scrivi o rivedi le frasi a regole di explain.js, i testi dell'interfaccia o i prompt degli agenti di SECCI Lens.
---

# Spiegare un credito senza consigliare

Chi legge sta per firmare e non conosce i termini finanziari. Non deve diventare un esperto: deve sapere **quanto riceve, quanto restituisce, quanto costa e per quanto tempo**, e poter ritrovare ogni numero nel suo documento.

## Le regole

1. **Prima i quattro numeri, in euro.** Ricevi · Restituisci in totale · Il credito ti costa · Per quanto tempo. Le percentuali vengono dopo.
2. **Ogni numero ha la sua fonte.** Accanto a ogni frase semplice c'è il brano originale del documento. Se un numero è calcolato dal programma, dillo («sommate dal programma», «calcolato dai dati del documento»).
3. **Una parola difficile, una spiegazione.** TAN: il tasso degli interessi. TAEG: interessi più spese obbligatorie, in percentuale all'anno. Istruttoria: preparazione della pratica. Imposta di bollo: una tassa sul contratto.
4. **Frasi brevi, dai del tu**, forme neutre rispetto al genere («In tutto restituisci», non «Sei sicuro?»).
5. **Niente consigli, mai.** Non dire cosa scegliere, firmare, evitare o comprare. Parole vietate: conviene, consiglio, è meglio, scegli, dovresti, migliore, peggiore, vantaggioso, affare, risparmi.
6. **Niente classifiche.** Nel confronto solo fatti con il verso del numero: «costa 31,44 € in più», «dura 6 mesi in più», «la rata è di 20,91 € più bassa». Se le somme sono diverse, dillo prima di tutto.
7. **Niente giudizi sull'offerta** («cara», «conveniente», «rischiosa»). Il TAEG «è il numero pensato per confrontare offerte diverse»: è un fatto, non un invito.
8. **Se un numero non torna, resta neutro.** «Il TAEG calcolato dai dati del documento è 17,19%, il documento dice 6,08%. Puoi chiedere chiarimenti al finanziatore.» Mai «il documento è sbagliato».
9. **Le ipotesi si dichiarano.** Se il documento non dice quando si paga una spesa, scrivilo («il documento non dice quando si pagano: nel calcolo le consideriamo alla firma»).
10. **Niente etichette sulla persona.** Si parla del documento, non di chi lo legge.
11. **Cose di tutti i giorni come aiuto, non come giudizio.** «36,00 € sono come 30 caffè al bar», non «36 € buttati».

## Esempi

| Brano del documento | Da evitare | Meglio |
|---|---|---|
| «Tasso fisso. TAN (tasso annuo nominale): 0,00%» | "È gratis, ti conviene!" | "Il TAN è il tasso degli interessi: qui è 0,00%, quindi non paghi interessi. Le spese però si pagano lo stesso." |
| «TAEG: 14,19%» | "Il TAEG è alto, meglio evitare." | "Il TAEG mette insieme interessi e spese obbligatorie, in percentuale all'anno: il documento scrive 14,19%." |
| «Importo totale dovuto dal consumatore … 636,00 €» | "Paghi 36 € di troppo." | "In tutto restituisci 636,00 €: la somma prestata più interessi e spese." |
| «Spese di incasso rata: 1,00 € per ogni rata» | "Spese inutili." | "Le spese di incasso si pagano ogni volta che il finanziatore incassa una rata: 1,00 € per rata, 10,00 € in tutto." |
| Confronto tra due offerte | "La prima è migliore." | "Il credito di Faro Finanziaria costa 31,44 € in più di quello di Aurora Credito." |

## I numeri

Solo numeri presenti nel documento o calcolati dal codice, scritti all'italiana: `1.234,56 €`, `14,19%`. Mai un calcolo fatto "a mente" nel testo: se serve un totale, lo fornisce `finance.js`.
