# Rata o non rata — istruzioni per Claude Code

Web app educativa che mette in **un unico calendario** le rate di acquisti fatti con servizi diversi ("compra ora, paga dopo" e finanziamenti in negozio), partendo dalle email di conferma. Persona di riferimento: Chiara, 22 anni, primo lavoro part-time, 6 acquisti a rate su 3 servizi più un finanziamento in negozio. Tema 02 dell'Hagenthon: Inclusione finanziaria.

## Struttura

- `app/public/lib/` — tutta la logica, in moduli ES puri condivisi da browser, server e test:
  - `parsers.js` (un parser per formato noto + regole generiche, ogni valore con la sua frase sorgente)
  - `schedule.js` (rate datate, centesimi, aggregazioni)
  - `insights.js` (quote sulle entrate, avviso scelto dalla persona, "E se…?")
  - `quiz.js`, `glossary.js`, `verify.js` (validatore dell'AI e controllo anti-consiglio)
  - `money.js`, `dates.js`, `samples.js` (le 7 email inventate)
- `app/public/app.js` — solo stato, disegno della pagina ed eventi. Niente calcoli qui.
- `app/server.mjs` — server Node senza framework, solo `127.0.0.1`. `app/server/agent.mjs` — estrazione facoltativa con Claude.
- `agents/prompts/extract-agent.md` — system prompt dell'agente, letto dal server all'avvio.

## Comandi

```bash
cd app && npm install
npm test        # test unitari e del server (node:test), nessuna rete
npm start       # http://localhost:8804/?oggi=2026-10-06
```

## Regole del progetto

- **Fatti, non consigli.** Nessun testo dice cosa fare con i soldi: niente "ti conviene", "ti consiglio", "è meglio", "dovresti", né giudizi ("troppo", "attenzione", "rischio"). Un test controlla le frasi generate e i testi dell'interfaccia: se aggiungi testi, il test deve restare verde.
- **La soglia la sceglie la persona.** Di base nessun avviso. L'app non suggerisce valori e non cambia mai la soglia da sola.
- **Semplificare senza tradire.** Ogni valore estratto ha la frase esatta dell'email (`sources`), mostrata accanto al valore. Le penali si riportano solo copiando la frase dell'email.
- **L'AI estrae, il codice calcola.** L'AI non produce mai date delle rate, totali o percentuali. Ogni importo, data e numero proposto dall'AI passa da `verifyExtraction`: se non compare nell'email, viene scartato e la persona lo vede. Non togliere questi controlli.
- **Senza AI deve funzionare.** Parser deterministici e modulo "Aggiungi a mano" coprono tutto il percorso.
- **Centesimi interi.** Mai float nei calcoli. La somma delle rate è sempre uguale al totale: l'ultima rata assorbe l'arrotondamento.
- **Date in UTC**, stringhe `AAAA-MM-GG`. Mensile = stesso giorno del mese, con l'ultimo giorno se il mese è più corto (31 gennaio → 28/29 febbraio → 31 marzo).
- **Nessun marchio reale** nell'app o nei dati di esempio. I nomi veri solo nella verifica di mercato (README e una slide).
- **Accessibilità.** `lang="it"`, HTML semantico, focus visibile, tastiera, bersagli da 44 px, contrasto AA, grafici con testo equivalente (titolo, descrizione, tabella), `aria-live` per gli aggiornamenti, `prefers-reduced-motion`.
- **Linguaggio neutro** rispetto al genere dove possibile ("Hai scelto", non "Sei sicura").
- I testi delle email vanno sempre nel DOM come testo (`textContent`), mai come HTML.

## Prima di dire "fatto"

Lancia `/demo-check`: test verdi, server avviato, percorso completo nel browser con le 7 email di esempio, nessun errore in console.
