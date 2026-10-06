---
description: Verifica completa prima della demo — test, sintassi, server, percorso con i tre documenti di esempio
---

Esegui, fermandoti al primo problema:

1. `cd app && npm test` — tutti i test devono passare.
2. `node --check` su ogni file `.js` e `.mjs` di `app/` (esclusa `node_modules`).
3. Avvia il server con `npm start` e controlla `GET /api/health`: riporta se l'agente AI è attivo (`ai: true`) o se si useranno solo le regole. Controlla anche che `/`, `/lib/finance.js` e `/presentation/` rispondano 200.
4. Apri `http://localhost:8801/` e percorri la demo:
   - **Lavatrice «tasso zero»**: fai le 4 domande iniziali, poi «In sintesi» deve mostrare 600,00 € · 636,00 € · 36,00 € · 10 mesi e il riquadro «tasso zero».
   - **TAN e TAEG**: la tabella del costo del credito somma 36,00 €.
   - **In cose di tutti i giorni**: 30 caffè al bar; cambia prezzo e oggetto da tastiera.
   - **Lavatrice in 16 rate** → **Controllo dei numeri**: «Il TAEG calcolato dai dati del documento è 17,19%, il documento dice 6,08%. Puoi chiedere chiarimenti al finanziatore.»
   - **Confronta due offerte**: nessuna parola da classifica; «costa 31,44 € in più», «dura 6 mesi in più».
   - **Quiz**: punteggio prima e dopo.
5. Ripeti un passaggio solo con la tastiera (Tab, frecce sulle schede, Invio, Spazio) e controlla che il focus sia sempre visibile.
6. Controlla che la console del browser non abbia errori, compresi quelli della Content Security Policy.
7. Se l'AI è attiva, prova «Spiegamelo in parole semplici» e incolla un testo non standard: riporta quante frasi o quanti dati sono stati scartati dai controlli e perché.

Riporta un riepilogo con ✅/❌ per ogni passo.

$ARGUMENTS
