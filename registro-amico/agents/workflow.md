# Workflow: come è stato costruito "Registro amico"

Strumento: **Claude Code** (modello Claude Opus 5.5). La demo è stata costruita da **un subagente di Claude Code**, partendo da una specifica scritta dalla **sessione principale di Claude Code** del team. La specifica fissava persona, i 4 compiti, le regole di livello, i vincoli del Tema 03 e la struttura delle cartelle. Il subagente ha scritto codice, testi, test, presentazione e documentazione, e li ha verificati in locale. La sessione principale verifica poi la demo nel browser.

## Le fasi

| # | Fase | Chi | Cosa ne è uscito |
|---|---|---|---|
| 1 | **Scelta dell'idea e verifica di mercato** | Sessione principale (ricerche web del 5 ottobre 2026) | Esistono traduttori dei messaggi scuola-famiglia e guide multilingue statiche. Non abbiamo trovato una palestra con un registro italiano simulato, un glossario scolastico e un percorso adattivo. |
| 2 | **Specifica** | Sessione principale | Persona (Fatima), 4 compiti, livelli 1-2-3 con regole di passaggio, glossario, AI facoltativa, sicurezza del server, deliverable del Tema 03. |
| 3 | **Studio della demo di riferimento** | Subagente | Riuso dello stile di `ti-vedo-bloccato`: server con le stesse protezioni, stessa chiamata a Claude, stesso motore della presentazione. |
| 4 | **Logica pura e test** | Subagente | `tasks.js`, `coach.js`, `facts.js`, `quiz.js` con i test `node:test` (orologio finto per il blocco). |
| 5 | **Contenuti in 3 lingue** | Subagente, con la skill `istruzioni-multilingue-semplici` | `i18n.js` (testi dell'aiuto), `glossary.js` (26 parole della scuola), spiegazioni già pronte delle comunicazioni. Test di allineamento tra le lingue. |
| 6 | **Agente di runtime** | Subagente | `server/agent.mjs` e il prompt `prompts/spiega-comunicazione.md`: structured output, effort basso, fallback lato server, validatore di date e numeri. |
| 7 | **Interfaccia** | Subagente | Registro di prova (Home, Assenze, Voti, Colloqui, Bacheca, Pagella), pannello di aiuto con arabo da destra a sinistra, pagina «I tuoi progressi», verifica delle parole. |
| 8 | **Verifica locale** | Subagente | Test, controllo di sintassi, server avviato su 8805 e interrogato con `curl`; prova automatica dei 4 esercizi in un browser senza interfaccia. |
| 9 | **Consegna** | Subagente | Struttura agentica, presentazione, deliverable, README. |
| 10 | **Verifica nel browser** | Sessione principale | Da fare dopo la consegna del subagente. |

## Dove ha contribuito l'AI e dove serve la revisione umana

| Parte | AI | Revisione umana |
|---|---|---|
| Idea e verifica di mercato | Ricerche e confronto con prodotti esistenti | Il team ha scelto l'idea. I link vanno riaperti prima della presentazione. |
| Codice e test | Scritto dal subagente, test inclusi | Lettura del codice da parte del team. |
| Regole di livello e soglie | 10 s di inattività, 2 click sbagliati, 3 errori per tornare indietro: valori della specifica | **Da tarare** con genitori veri: sono ipotesi, non misure. |
| **Testi in arabo** | Scritti dal subagente in arabo standard moderno, con forme neutre | **Da far rivedere da una persona madrelingua araba prima di qualsiasi uso reale.** Va verificata anche la scelta tra parole del Maghreb e del Medio Oriente (per esempio «الصفّ» o «القسم» per "classe"). |
| Testi in inglese e italiano semplice | Scritti con la skill `istruzioni-multilingue-semplici` | Rilettura pensando a un livello A2. |
| Glossario | 26 parole con spiegazione in 3 lingue | Verifica di **mediatori culturali** e di chi lavora con le famiglie a scuola: le parole sono quelle giuste? Le spiegazioni sono corrette per la scuola italiana? |
| Spiegazioni AI a runtime | Claude spiega la comunicazione | Non serve rivedere ogni risposta: il validatore scarta quelle con date o numeri diversi dall'originale. Resta da verificare con una chiave vera (nei test il modello è simulato). |
| Esito sull'apprendimento | L'app registra tempi, errori e suggerimenti | **Da misurare con genitori veri**: finora i percorsi sono stati provati solo in automatico. |

## Cosa resta da fare con persone vere

1. **Revisione dell'arabo** da parte di una persona madrelingua: testi dell'aiuto, glossario, spiegazioni già pronte.
2. **Mediatori culturali** e personale di segreteria: le 4 situazioni sono quelle che bloccano davvero? Mancano parole importanti?
3. **Prove con genitori** (anche in altre lingue): tempi ed errori reali per livello, per tarare le soglie.
4. **Prova della chiamata a Claude con una chiave vera**, in particolare in arabo.

## Come rilanciare il ciclo

```text
/nuovo-compito "scaricare la pagella"   → nuovo esercizio con passi, testi in 3 lingue e test
/demo-check                             → verifica completa prima della demo
```

Dopo ogni modifica ai testi: subagente `translation-fidelity-reviewer`. Prima della demo: subagente `learner-path-tester`.
