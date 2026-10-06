---
description: Verifica completa prima della demo - test, server, percorso adattivo nel browser
---

Esegui, fermandoti al primo problema:

1. `cd app && npm test`: tutti i test devono passare.
2. `node --check` su ogni file `.js` e `.mjs` di `app/`.
3. Avvia il server con `npm start` e controlla `GET /api/health`: riporta se l'agente AI è attivo (`ai: true`) o se si useranno le spiegazioni già pronte.
4. Apri `http://localhost:8805/?reset=1&lang=ar` e fai la verifica delle parole (5 domande).
5. Esercizio «Giustificare un'assenza» tre volte di fila:
   - livello 1 con un errore (scegli il ritardo);
   - livello 2 fermandoti 10 secondi su un passo: deve comparire il suggerimento;
   - livello 3 senza errori: deve comparire «Ce l'hai fatta senza aiuto».
6. In «Bacheca» apri l'uscita didattica e premi «Spiegami questa comunicazione»: la spiegazione compare sotto il testo originale, con la fonte (già pronta o AI).
7. Cambia lingua (English, Italiano semplice) a metà esercizio: il pannello cambia lingua e direzione, il registro resta in italiano.
8. Apri «I tuoi progressi»: tabella dei tentativi e frase per il livello 3 completato. Rifai la verifica delle parole.
9. Controlla che la console del browser non abbia errori.
10. Apri `http://localhost:8805/presentation/` e scorri tutte le slide: nessuna esce dal 1920×1080.

Riporta un riepilogo con ✅/❌ per ogni passo e, se l'AI è attiva, un esempio di spiegazione generata con la sua `source`.

$ARGUMENTS
