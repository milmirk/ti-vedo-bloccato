---
description: Verifica completa prima della demo — test, server, percorso di Marco dall'impostazione alla domanda che adatta la rappresentazione
---

Esegui, fermandoti al primo problema:

1. `cd app && npm test` — tutti i test devono passare, compreso «modalità senza numeri».
2. Avvia il server con `npm start` (porta 8802) e controlla `GET /api/health`: riporta se l'interprete AI è attivo (`ai: true`) o se si useranno le regole.
3. Apri `http://localhost:8802/` con dati vuoti e fai l'impostazione:
   - scrivi una cifra con il tastierino e controlla che sotto compaia subito in oggetti;
   - scegli «Il 27 di ogni mese»;
   - tieni quattro oggetti e cambia il prezzo del caffè.
4. Nella schermata principale verifica che **non compaia nessuna cifra**: titolo con i puntini dei giorni, «Ti restano», «Oggi puoi usare circa».
5. Tocca «Un caffè», poi «Annulla». Apri «Altro», scrivi «ho fatto la spesa, circa 30 euro» e premi «Capisci la frase».
6. Carica l'esempio di Marco (`/?demo=marco`): alla domanda rispondi «Non so» e controlla che la rappresentazione passi a «Tutto insieme, con gli oggetti piccoli» e che il cambio compaia in «Come lo capisci meglio».
7. Premi «Leggimelo» (la voce italiana) e «Mostra anche gli euro».
8. Ripeti un passaggio solo con la tastiera (Tab, Invio, Spazio) e controlla che il focus sia sempre visibile.
9. Controlla che la console del browser non abbia errori.

Riporta un riepilogo con ✅/❌ per ogni passo e, se l'AI è attiva, un esempio di frase interpretata con la sua `source`.

$ARGUMENTS
