# SECCI Lens — istruzioni per Claude Code

Pagina web che legge il modulo SECCI di un finanziamento («Informazioni europee di base sul credito ai consumatori»), rifà i conti con i suoi numeri e lo spiega in parole semplici. Persona di riferimento: Samira, 41 anni, deve capire una lavatrice «a tasso zero» il cui TAEG non è zero. Tema 02 · Inclusione finanziaria: **educativo, nessun consiglio**.

## Struttura

- `app/public/lib/` — moduli ES condivisi tra browser e test Node: `finance.js` (TAEG, piano, coerenza, formati italiani), `parser.js` (lettura a regole e verifica delle citazioni AI), `explain.js` (testi a regole, cose di tutti i giorni, confronto, quiz), `guards.js` (filtro dei consigli e controllo dei numeri), `samples.js` (tre SECCI di fantasia).
- `app/public/` — `index.html`, `style.css`, `app.js`: l'interfaccia, costruita con elementi DOM (mai `innerHTML` con testo del documento).
- `app/server.mjs` — server Node senza framework, solo `127.0.0.1`. `app/server/agent.mjs` — Claude tramite `@anthropic-ai/sdk`.
- `agents/prompts/` — system prompt dei due agenti di runtime, letti all'avvio del server.

## Comandi

```bash
cd app && npm install
npm test        # test node:test, nessuna rete esterna
npm start       # http://localhost:8801/
```

## Regole del progetto

- **Il codice calcola, l'AI spiega.** Nessun numero mostrato alla persona nasce dall'AI. L'estrazione AI restituisce solo citazioni; i numeri li legge `fromAiFields`. Non aggiungere campi numerici agli schemi AI.
- **Semplificare senza tradire.** Ogni valore mostrato ha accanto il brano esatto del documento; il documento originale resta consultabile. Non correggere mai i numeri del documento: se non tornano, si mostra la differenza con la frase neutra «Il TAEG calcolato dai dati del documento è X%, il documento dice Y%. Puoi chiedere chiarimenti al finanziatore.»
- **Nessun consiglio, nessuna classifica.** Mai «conviene», «migliore», «è meglio», «scegli», «dovresti», «risparmi». Il confronto riporta solo fatti («costa 31,44 € in più, dura 6 mesi in più»). Ogni nuovo testo a regole va aggiunto ai test che lo passano da `findAdvice` e `findRanking`.
- **TAEG secondo la direttiva 2008/48/CE**: tempi in anni, mese = 1/12. Le ipotesi su quando si pagano le spese sono scritte in `finance.js` e mostrate nella pagina; un'ipotesi non dichiarata dal documento va segnalata come tale.
- **Esempi coerenti.** Il TAEG scritto negli esempi 1 e 2 deve essere uguale a quello calcolato (test in `samples.test.mjs`). L'esempio 3 ha di proposito un TAEG che non torna.
- **Senza AI deve funzionare tutto.** I pulsanti AI compaiono solo se `/api/health` dice `ai: true`.
- **Accessibilità.** `lang="it"`, HTML semantico, tastiera, focus visibile, obiettivi di almeno 44 px, contrasto AA, `aria-live` sui risultati, `prefers-reduced-motion`. La CSP dell'app vieta script e stili in linea: niente attributi `style` nell'HTML generato (usa classi o `element.style`).
- **Linguaggio.** Si dà del tu, forme neutre rispetto al genere, nessuna etichetta sulla persona: «bassa alfabetizzazione» non compare mai nell'interfaccia.

## Prima di dire "fatto"

Lancia `/demo-check`: test verdi, `node --check` su ogni file, server avviato, percorso completo con i tre esempi, nessun errore in console.
