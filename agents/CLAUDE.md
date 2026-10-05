# Ti vedo bloccato — istruzioni per Claude Code

Estensione Chrome che si accorge quando una persona è bloccata su un servizio digitale e le dà **un solo** suggerimento mirato. Persona di riferimento: Luca, 29 anni, ADHD, deve prenotare la Carta d'Identità Elettronica su Agenda CIE.

## Struttura

- `app/extension/content/` — detector (logica pura), context (lettura della pagina), fallback-hints (regole), companion (DOM + interfaccia). I file sono script classici (non moduli) e funzionano sia nell'estensione sia in Node per i test.
- `app/server/` — server Node senza framework: serve la demo e `POST /api/hint`, che chiama Claude tramite `@anthropic-ai/sdk`.
- `app/demo-site/` — replica dimostrativa di Agenda CIE, con i punti di attrito del sito vero.
- `agents/prompts/hint-agent.md` — system prompt dell'agente di runtime, letto dal server all'avvio.

## Comandi

```bash
cd app && npm install
npm test        # test unitari (node:test), nessuna rete
npm start       # http://localhost:8787/demo/?assistente=1
```

## Regole del progetto

- **Un suggerimento, un'azione.** Mai liste di passi. Massimo circa 30 parole.
- **Semplificare senza tradire.** Ogni nome tra «» deve esistere nella pagina; il testo originale resta consultabile in "Perché me lo dici?". Non togliere i controlli di `validateHint`.
- **Privacy.** Il valore dei campi non lascia mai la pagina: `context.js` lo legge solo per sapere se un campo è compilato (sì/no). Niente `validationMessage` del browser (può citare il valore), niente testo di aree modificabili, prima si maschera e poi si taglia. Ogni nuovo campo del contesto va controllato contro questa regola.
- **Ambito.** L'estensione gira solo sui siti elencati in `manifest.json` (PA e localhost), non su banca o webmail.
- **Subito, e senza coprire.** La scheda compare appena scatta il segnale, con il suggerimento a regole. L'AI può sostituirne il testo solo entro pochi secondi e solo se la persona non ha ancora agito. La scheda entra nel flusso della pagina, subito dopo il blocco su cui agire, e non copre mai il testo: diventa fluttuante solo se non c'è un punto adatto.
- **Non invadere.** Niente focus rubato (solo su "Mostrami dove"), niente finestre modali. Ogni nuovo segnale ha soglie per sensibilità e una pausa minima prima del suggerimento successivo.
- **Linguaggio neutro.** Niente "bentornato/bentornata": usa forme neutre.
- **Senza AI deve funzionare.** Ogni segnale ha una regola in `fallback-hints.js` con un test.
- I test del detector usano un orologio finto: non usare `setTimeout` reali nei test.

## Prima di dire "fatto"

Lancia `/demo-check`: test verdi, server avviato, percorso completo nella demo con l'assistente, nessun errore in console.
