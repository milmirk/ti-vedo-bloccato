# Registro amico — istruzioni per Claude Code

Una palestra per il registro elettronico della scuola: un registro di prova in italiano, con un aiuto in arabo, inglese o italiano semplice che si adatta a chi impara. Persona di riferimento: **Fatima, 38 anni**, madrelingua araba, italiano A2; il figlio Youssef è in prima media (classe 1ª B). Deve imparare a giustificare un'assenza, prenotare un colloquio, leggere una comunicazione con la presa visione e trovare un voto.

## Struttura

- `app/public/lib/` — moduli ES **puri** (nessun DOM), usati dal browser, dal server e dai test:
  - `data.js` registro inventato ed etichette `L` (unica fonte delle parole del registro);
  - `tasks.js` i 4 compiti come macchine a stati;
  - `coach.js` livelli, rilevamento del blocco, metriche dei tentativi, progressi;
  - `glossary.js` parole della scuola in italiano semplice, arabo e inglese;
  - `i18n.js` testi dell'aiuto nelle 3 lingue, una voce per chiave;
  - `quiz.js` verifica delle parole prima/dopo;
  - `facts.js` controllo di date, orari e numeri delle spiegazioni.
- `app/public/app.js` — solo DOM e rendering.
- `app/server.mjs` — server Node senza framework (127.0.0.1, porta 8805). `app/server/agent.mjs` — chiamata a Claude e validazione.
- `agents/prompts/spiega-comunicazione.md` — system prompt dell'agente di runtime, letto dal server all'avvio.

## Comandi

```bash
cd app && npm install
npm test        # test unitari (node:test), nessuna rete esterna
npm start       # http://localhost:8805/
```

## Regole del progetto

- **Il registro resta in italiano.** È finto ma realistico, senza nomi o loghi di prodotti reali. Le parole dei pulsanti stanno in `L` (`data.js`): l'aiuto le cita tra «» in italiano, anche dentro l'arabo, e i test verificano che esistano davvero.
- **Tre lingue sempre allineate.** Ogni chiave di `i18n.js` esiste in `it`, `ar`, `en`, con gli stessi segnaposto e le stesse parole tra «». Ogni voce del glossario ha le tre lingue.
- **Arabo neutro e da far rivedere.** Arabo standard moderno, frasi brevi. Forme neutre rispetto al genere: «يُرجى» + nome verbale, frasi descrittive, forme scritte uguali per madre e padre. Ogni testo arabo nuovo va segnato come **da rivedere da una persona madrelingua**.
- **Italiano neutro.** Niente "bentornato/a", "sei pronta": l'app è per qualsiasi genitore. Il livello 3 si chiama «In autonomia».
- **L'adattamento è codice, non AI.** Le regole di livello e di blocco stanno in `coach.js` e hanno test con orologio finto: non usare `setTimeout` reali nei test.
- **Semplificare senza tradire.** Ogni spiegazione (AI o già pronta) passa da `validateExplanation`: nessuna data, orario o numero che non sia nell'originale. Il testo originale resta sempre visibile sopra la spiegazione. Non togliere questi controlli.
- **Senza AI deve funzionare.** Ogni comunicazione ha la spiegazione già pronta nelle 3 lingue, e un test la fa passare dallo stesso validatore.
- **Niente consulenza.** L'aiuto spiega il registro e le comunicazioni; non dà consigli legali, sanitari o amministrativi.
- **Accessibilità.** `lang` e `dir` per ogni lingua, fuoco visibile, tutto da tastiera, bersagli di almeno 44 px, contrasto AA, `aria-live` per i suggerimenti, `prefers-reduced-motion`.
- **Misure oneste.** I numeri mostrati come miglioramento vengono dai tentativi registrati dall'app o dai test. Non inventare risultati con utenti.

## Prima di dire "fatto"

Lancia `/demo-check`: test verdi, server avviato, i 4 esercizi provati nel browser almeno ai livelli 1 e 3, nessun errore in console.
