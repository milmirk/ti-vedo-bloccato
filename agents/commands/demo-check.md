---
description: Verifica completa prima della demo — test, server, percorso con e senza assistente
---

Esegui, fermandoti al primo problema:

1. `cd app && npm test` — tutti i test devono passare.
2. Avvia il server con `npm start` e controlla `GET /api/health`: riporta se l'agente AI è attivo (`ai: true`) o se si useranno le regole.
3. Apri `http://localhost:8787/demo/?assistente=1` e percorri i 4 punti di blocco descritti in `agents/subagents/a11y-persona-tester.md`. Per ognuno verifica che la scheda compaia, che il testo sia uno solo e che «Mostrami dove» evidenzi l'elemento giusto.
4. Completa la prenotazione e leggi la tabella delle metriche nella pagina finale.
5. Controlla che la console del browser non abbia errori.
6. Ripeti velocemente con `?assistente=0`: nessuna scheda deve comparire.

Riporta un riepilogo con ✅/❌ per ogni passo e, se l'AI è attiva, un esempio di suggerimento generato con la sua `source`.

$ARGUMENTS
