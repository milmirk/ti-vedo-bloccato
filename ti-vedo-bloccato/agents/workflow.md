# Workflow: come abbiamo costruito "Ti vedo bloccato"

Strumento: **Claude Code** (modello Claude Opus 5.5), nella sessione del team. Le fasi qui sotto sono quelle seguite davvero durante l'hackathon.

## Le fasi

| # | Fase | Agenti usati | Cosa ne è uscito |
|---|---|---|---|
| 1 | **Esplorazione delle idee** | 3 agenti di ricerca in parallelo (uno per tema della sfida), circa 145 ricerche web IT/EN/DE | 21 idee candidate verificate sul mercato: 10 tenute, 11 scartate perché già esistenti. "Ti vedo bloccato" è l'unica senza prodotti commerciali trovati. |
| 2 | **Scelta e persona** | — (decisione del team) | Idea, persona (Luca, ADHD) e servizio (Agenda CIE). |
| 3 | **Motore di rilevamento** | Claude Code + test `node:test` | `detector.js` con 7 segnali e i test con orologio finto, inclusi i casi "comportamento normale" che non devono far scattare nulla. |
| 4 | **Contesto, regole, interfaccia** | Claude Code | `context.js` (privacy: nessun valore letto, dati mascherati), `fallback-hints.js`, `companion.js` (Shadow DOM, niente focus rubato). |
| 5 | **Agente di runtime** | Claude Code + skill `claude-api` | `hint-agent.mjs`: structured output, effort basso, fallback lato server, controlli di fedeltà. Prompt in `prompts/hint-agent.md`. |
| 6 | **Replica del servizio** | Claude Code | `demo-site/`: 4 passi con i punti di attrito reali e le metriche prima/dopo. |
| 7 | **Verifica nel browser** | Claude Code con gli strumenti di anteprima del browser | Percorso completo con e senza assistente. Corretti: scheda che copriva «Avanti», asterischi nei nomi, verbo sbagliato per le caselle, chiamate inutili all'API senza chiave. |
| 8 | **Revisione** | subagenti `hint-copy-reviewer` e revisione del codice | Vedi [Revisione](#revisione) sotto. |
| 9 | **Consegna** | Claude Code | Struttura agentica, presentazione HTML, README. |
| 10 | **Feedback del team** | Claude Code | Richiesta: scheda subito e senza coprire il testo. La scheda ora entra nella pagina accanto al punto del blocco e appare in circa 0,2 s. Con «normale» basta il primo segnale chiaro. Il testo AI sostituisce le regole solo se la persona non ha ancora agito. |

## Dove ha contribuito l'AI e dove serve la revisione umana

| Parte | AI | Revisione umana |
|---|---|---|
| Ricerca di mercato | Ricerche, confronto con i prodotti esistenti, classifica di novità | Il team ha scelto l'idea. I link vanno riaperti prima della presentazione. |
| Codice | Scritto da Claude Code, test inclusi | Lettura del codice e prova dell'estensione installata in Chrome (la demo nel browser di anteprima non carica estensioni). |
| Soglie dei segnali | Valori iniziali ragionati (es. 25 s di inattività, 2 click a vuoto in 5 s) | **Da tarare** con una prova reale: sono ipotesi, non misure. |
| Testi dei suggerimenti | Scritti e rivisti con la skill `plain-italian-hints` | **Da far leggere** a una persona della popolazione target, o a chi lavora con persone con ADHD. |
| Suggerimenti AI a runtime | Claude scrive il suggerimento | Non serve una revisione per ogni suggerimento: i controlli automatici di `validateHint` scartano quelli che citano elementi inesistenti. |
| Privacy | Regole implementate e testate | Va validata la scelta di mandare a un servizio esterno etichette e testi della pagina. |

## Revisione

A fine sviluppo sono stati lanciati due subagenti in sola lettura, in parallelo.

- **`hint-copy-reviewer`**: 24 osservazioni sui testi.
- **Revisione del codice**: 15 problemi di sicurezza, privacy e falsi allarmi.

Le correzioni sono state applicate con nuovi test (da 33 a 37) e verificate di nuovo nel browser. L'elenco completo è nella sezione "Revisione" del [README principale](../README.md#revisione).

Due punti restano da verificare a mano:

- la chiamata a Claude con una chiave vera;
- i click su pulsanti disattivati con l'estensione installata in Chrome. Nel browser di anteprima sono stati provati con eventi simulati.

## Come rilanciare il ciclo

```text
/new-signal "scorre su e giù senza fermarsi"   → nuovo segnale con test
/review-hints                                   → revisione dei testi
/demo-check                                     → verifica completa prima della demo
```
