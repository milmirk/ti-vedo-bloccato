# Workflow: come è stato costruito "Rata o non rata"

Strumento: **Claude Code** (modello Claude Opus 5.5). La demo è stata costruita in due livelli, ed è giusto dirlo chiaramente:

- la **sessione principale** di Claude Code, con il team, ha scelto il tema e la persona, ha fatto la verifica di mercato e ha scritto una specifica dettagliata (persona, funzioni, vincoli del tema, struttura delle cartelle, schema della chiamata a Claude da riusare);
- un **subagente** di Claude Code ha ricevuto la specifica e ha costruito tutto il resto in autonomia: codice, test, email di esempio, struttura agentica, presentazione e documenti. Il subagente non ha usato il browser: la verifica visiva spetta alla sessione principale.

## Le fasi

| # | Fase | Chi | Cosa ne è uscito |
|---|---|---|---|
| 1 | **Idee e mercato** | Sessione principale, ricerche web (5 ottobre 2026) | Il bisogno: nessuno in Italia somma le rate di servizi diversi e dei finanziamenti in negozio, e nessuno simula "e se aggiungo questo acquisto". |
| 2 | **Specifica** | Sessione principale + team | Persona (Chiara, 22 anni), le 8 funzioni, i vincoli del Tema 02 (niente consigli), la consegna `app/`, `agents/`, `presentation/`, `README.md`. |
| 3 | **Dati di esempio** | Subagente | 7 email inventate in 4 formati diversi (cifre, date a parole, punto decimale, linguaggio da contratto), con date scelte per mostrare i casi difficili: ogni 30 giorni che non è "ogni mese", il giorno 30 a febbraio, centesimi da arrotondare. |
| 4 | **Logica pura, test prima** | Subagente + `node:test` | `money.js`, `dates.js`, `parsers.js`, `schedule.js`, `insights.js`, `quiz.js`, `glossary.js`, `verify.js`: moduli ES condivisi tra browser e test. |
| 5 | **Agente di runtime** | Subagente | `server/agent.mjs` con lo stesso schema di chiamata di "Ti vedo bloccato" (structured output, effort basso, fallback lato server) e `verify.js` come validatore. Prompt in `prompts/extract-agent.md`. |
| 6 | **Server** | Subagente | `server.mjs`: solo `127.0.0.1`, stessa origine per `/api/extract`, 64 KB, limite al minuto, protezione dal path traversal, CSP per l'app. Testato con un agente finto. |
| 7 | **Interfaccia** | Subagente | `index.html`, `style.css`, `app.js`: schede, mese prossimo, grafico SVG con tabella, prossimi 30 giorni, dettaglio con le frasi dell'email, entrate e avviso, "E se…?", glossario e quiz. |
| 8 | **Prova automatica dell'interfaccia** | Subagente | Percorso completo con un DOM simulato (jsdom) e in Chrome headless guidato da script (fuori dal repository): nessun errore in console. Trovati e corretti: pagina più larga dello schermo a 375 px (grafico e tabelle), un colore "verde" ereditato per sbaglio nella slide prima/dopo, slide 4 e 10 oltre i 1080 px. Non sostituisce la prova di una persona. |
| 9 | **Consegna** | Subagente | Struttura agentica, presentazione HTML (stesso motore della demo "Ti vedo bloccato"), deliverable del tema, README. |

## Dove ha contribuito l'AI e dove serve la revisione umana

| Parte | AI | Revisione umana |
|---|---|---|
| Idea e mercato | Ricerche e confronto con i prodotti esistenti (sessione principale) | Il team ha scelto l'idea. I link vanno riaperti prima della presentazione. |
| Specifica | Scritta dalla sessione principale | Approvata dal team: persona, vincoli, perimetro. |
| Codice e test | Scritti dal subagente | **Da leggere**: soprattutto `verify.js` e i parser. |
| Email di esempio | Inventate dal subagente | Controllare che nomi e formati non ricordino marchi o contratti veri. |
| Testi rivolti alla persona | Scritti con la skill `fatti-non-consigli`, controllati da un test sulle parole vietate | **Da far leggere** a qualcuno della popolazione target: tono, chiarezza del glossario, difficoltà del quiz. |
| Interfaccia | Scritta e provata in automatico (DOM simulato e Chrome headless, anche a 375 px) | **Da provare a mano nel browser**: aspetto, grafico, tastiera, lettore di schermo. |
| AI a runtime | Estrae i valori dalle email sconosciute | Non serve rivedere ogni estrazione: il validatore scarta i valori che non sono nell'email. Va provata **con una chiave vera** (finora solo con un client simulato). |
| Presentazione | Slide scritte dal subagente con i numeri calcolati dai dati di esempio | Controllo visivo a 1920×1080 e prova della demo. |

## Cosa resta da verificare a mano

- La chiamata a Claude con una chiave vera, su almeno un'email reale anonimizzata.
- Il percorso completo nel browser, da tastiera e con un lettore di schermo.
- La resa del grafico in modalità a contrasto elevato.
- Le slide sono state misurate in Chrome headless a 1920×1080 (nessun contenuto oltre il bordo): resta da guardarle sullo schermo della presentazione.

## Come rilanciare il ciclo

```text
/nuovo-servizio "PagaPoi" + email di esempio   → nuovo parser con test
neutral-language-reviewer                      → revisione dei testi
/demo-check                                    → verifica completa prima della demo
```
