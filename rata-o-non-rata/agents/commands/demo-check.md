---
description: Verifica completa prima della demo — test, server, percorso di Chiara nel browser
---

Esegui, fermandoti al primo problema:

1. `cd app && npm test` — tutti i test devono passare.
2. Avvia il server con `npm start` e controlla `GET /api/health`: riporta se l'estrazione con l'AI è attiva (`ai: true`) o se resta il modulo a mano.
3. Apri `http://localhost:8804/?oggi=2026-10-06` e percorri:
   1. «Carica le 7 email di esempio»: 7 schede «Letta», nessuna da controllare.
   2. «Prova il quiz a memoria»: rispondi a caso e controlla che il punteggio compaia.
   3. «Calendario»: il mese prossimo deve essere **245,37 €** (novembre 2026, 8 rate, 4 servizi).
   4. Scrivi 720 in «Quanto ti entra in un mese» e scegli l'avviso 20%: ottobre e novembre «sopra il tuo avviso», novembre al 34%.
   5. Apri «Vedi i numeri in tabella» e un acquisto: ogni valore ha la sua frase dell'email.
   6. «E se…?»: 120 € in 3 rate mensili da oggi. Ottobre, novembre e dicembre +40,00 €, colonne a righe.
   7. «Impara»: rifai il quiz con le risposte giuste e controlla il confronto prima/dopo.
   8. «Prova un'email in un formato sconosciuto»: scheda «Incompleta»; con l'AI attiva prova la lettura, altrimenti «Completa a mano».
4. Ripeti i passi principali solo da tastiera (Tab, frecce sulle schede, Invio, Spazio).
5. Controlla che la console del browser non abbia errori.
6. Riduci la finestra a 375 px di larghezza: niente scorrimento orizzontale, a parte il grafico.

Riporta un riepilogo con ✅/❌ per ogni passo e, se l'AI è attiva, un esempio di estrazione con i campi scartati.

$ARGUMENTS
