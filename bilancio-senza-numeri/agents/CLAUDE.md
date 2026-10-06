# Bilancio senza numeri — istruzioni per Claude Code

App web mobile che aiuta una persona che fa fatica con i numeri a capire il proprio budget fino al prossimo stipendio. I soldi che restano sono mostrati come oggetti quotidiani (caffè, pizze, spese piccole); ogni tanto l'app fa una domanda concreta sulla situazione vera e, se la risposta non torna, cambia il modo di mostrarli. Persona di riferimento: Marco, 35 anni, con discalculia.

## Struttura

- `app/public/lib/` — tutta la logica, in moduli ES condivisi tra browser e test: `units.js` (oggetti e scomposizione), `dates.js`, `budget.js` (stato, spese, annulla, parte di oggi), `words.js` (numeri in lettere, frasi), `view.js` (cosa mostra la schermata), `questions.js`, `adapt.js`, `parser.js` (frasi senza AI), `demo.js`.
- `app/public/app.js` — solo DOM ed eventi. Nessun conto qui.
- `app/server.mjs` — server Node senza framework: file statici, `/presentation/`, `/api/health`, `POST /api/interpreta`.
- `app/server/agent.mjs` — interprete delle frasi con `@anthropic-ai/sdk` e il suo validatore.
- `agents/prompts/interpreta-spesa.md` — system prompt dell'interprete, letto dal server all'avvio.

## Comandi

```bash
cd app && npm install
npm test        # node:test, nessuna rete
npm start       # http://localhost:8802/  (esempio pronto: /?demo=marco)
```

`?oggi=AAAA-MM-GG` fissa la data per le demo e le prove.

## Regole del progetto

- **Senza numeri per davvero.** Con «Mostra anche gli euro» spento, nessun testo mostrato contiene cifre, € o "euro": quantità e date si scrivono in lettere. Ogni nuovo testo passa da `words.js`/`view.js` e va aggiunto al test «modalità senza numeri» in `test/words.test.mjs`. Le uniche cifre ammesse sono nell'impostazione (la cifra iniziale, il calendario, i prezzi).
- **I conti li fa il codice.** Importi in centesimi interi. L'AI non calcola mai: legge la frase, il validatore controlla, il codice somma. Non togliere i controlli di `validateInterpretation`.
- **Nessun consiglio finanziario, nessuna morale.** Solo fatti neutri: «Se lo prendi, i giorni dopo avranno un po' meno». Vietati "dovresti", "attenzione", "hai sbagliato", "risparmia".
- **Niente etichette.** L'interfaccia non nomina mai la discalculia o altre difficoltà della persona. Linguaggio neutro rispetto al genere ("Ti restano", non "Sei andato in rosso").
- **Domande oneste.** La risposta giusta si calcola dai dati; la combinazione proposta è vicina alla soglia ma mai a meno di un oggetto piccolo (o dell'otto per cento) da essa; mai più di sei pezzi.
- **Adattamento spiegabile.** Le regole sono in `adapt.js`, documentate in testa al file e testate. Ogni cambio di rappresentazione si registra in `state.adaptations` e si vede nel pannello «Come lo capisci meglio». La scelta manuale della persona vince sempre.
- **Accessibilità.** `lang="it"`, HTML semantico, focus visibile, tutto usabile da tastiera, bersagli di almeno 44 px (meglio 52), contrasto AA, icone sempre con un testo, `aria-live` per gli aggiornamenti, `prefers-reduced-motion`. Quando un pulsante viene ricostruito, il focus deve ritrovarlo.
- **Senza AI deve funzionare.** Ogni frase che l'interprete AI capisce dovrebbe avere, se semplice, un caso in `parser.js` con un test.

## Prima di dire "fatto"

Lancia `/demo-check`: test verdi, server avviato su 8802, percorso completo con l'esempio di Marco, nessun errore in console.
