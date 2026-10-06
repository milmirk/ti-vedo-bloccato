---
description: Aggiunge un documento SECCI di esempio, con flussi di cassa espliciti, TAEG coerente e test
argument-hint: <tipo di finanziamento, importo, rate, TAN, spese>
---

Nuovo documento di esempio: $ARGUMENTS

1. **Flussi di cassa prima del testo.** Scrivi in un commento in cima a `app/public/lib/samples.js`, come per gli esempi esistenti: cosa ricevi a t = 0, cosa paghi alla firma, la prima rata (con le spese «sulla prima rata»), le rate successive, il totale dovuto, il costo del credito.
2. **Calcola con il codice, non a mano.** Usa `annuityPayment` per la rata (arrotondata ai centesimi), poi `computeTaeg` e `totalDue` di `app/public/lib/finance.js`. Il TAEG scritto nel documento è il valore calcolato arrotondato a due decimali, salvo che l'esempio serva apposta a mostrare un numero che non torna (in quel caso dillo nel titolo e nel commento).
3. **Scrivi il testo con le etichette del SECCI italiano**: «1. Identità e contatti del finanziatore», «2. Caratteristiche principali del prodotto di credito», «3. Costi del credito», «Importo totale del credito», «Durata del contratto di credito», «Rate ed, eventualmente, loro ordine di imputazione», «Importo totale dovuto dal consumatore», «Tasso annuo effettivo globale (TAEG)», le spese con il momento in cui si pagano. Finanziatore e contatti di fantasia, domini `.example`.
4. Aggiungi l'esempio a `SAMPLES` e, se serve, alle coppie di confronto predefinite in `app/public/app.js`.
5. **Test** in `app/test/samples.test.mjs`: TAEG scritto = calcolato, totale dovuto, nessun campo mancante. I test esistenti su consigli e classifiche girano già su tutti gli esempi.
6. Fai ricontrollare numeri e testi ai subagenti `numbers-fidelity-reviewer` e `plain-language-reviewer`.
7. `cd app && npm test`.

Se il parser non legge una voce del nuovo documento, aggiungi l'etichetta in `LABELS` di `parser.js` con un test dedicato, invece di cambiare il testo dell'esempio per farlo tornare.
