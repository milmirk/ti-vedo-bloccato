# Workflow: come è stata costruita "SECCI Lens"

Strumento: **Claude Code** (modello Claude Opus 5.5). La demo è stata costruita **da un subagente di Claude Code**, partendo da una specifica scritta dalla **sessione principale di Claude Code** del team. La sessione principale aveva fatto prima la ricerca di mercato e scelto tema, persona e vincoli; il subagente ha scritto codice, test, documenti e presentazione in una sola corsa autonoma, senza browser. La verifica nel browser è affidata alla sessione principale e al team.

## Le fasi

| # | Fase | Chi | Cosa ne è uscito |
|---|---|---|---|
| 1 | **Ricerca di mercato** | Sessione principale, ricerche web (5 ottobre 2026) | Calcolatori a inserimento manuale, guida statica di Banca d'Italia, comparatori che classificano (Facile.it, Segugio), lettori AI per i finanziatori (es. TurnKey Lender). Nessuno strumento per il consumatore che legga un SECCI italiano e lo spieghi. |
| 2 | **Specifica** | Sessione principale | Persona (Samira), tre documenti di esempio, schermate, regole su AI e validatori, struttura di consegna. |
| 3 | **Calcoli** | Subagente + test `node:test` | `finance.js`: TAEG con bisezione, provato su casi fatti a mano (10%, 10,25%, 11,11%, TAN 0, tassi negativi e molto alti). |
| 4 | **Esempi** | Subagente | Tariffe scelte perché i TAEG fossero realistici; i TAEG scritti negli esempi 1 e 2 sono quelli calcolati dal codice (14,19% e 11,28%). L'esempio 3 scrive 6,08%, il TAEG calcolato senza le spese, contro 17,19%. |
| 5 | **Lettura a regole** | Subagente | `parser.js`: etichette a inizio riga, valore nelle righe successive, brano e posizioni per ogni dato, momento di pagamento delle spese. |
| 6 | **Testi, confronto, quiz** | Subagente + skill `spiegare-il-credito` | `explain.js` e `guards.js`, con test che passano ogni testo a regole dal filtro dei consigli e dal controllo dei numeri. |
| 7 | **Agenti di runtime** | Subagente | `agent.mjs` con lo stesso schema di chiamata di "Ti vedo bloccato", due prompt in `prompts/`, validatori. |
| 8 | **Interfaccia e server** | Subagente | Otto schede accessibili da tastiera, CSP senza script in linea, server con controllo dell'origine, limite di 64 KB e limite al minuto. |
| 9 | **Verifica senza browser** | Subagente | `npm test`, `node --check`, server avviato e interrogato con `curl`, prova dell'interfaccia in Node con un DOM simulato (click su esempi, schede, quiz, confronto, percorso AI simulato). |
| 10 | **Consegna** | Subagente | Struttura agentica, presentazione HTML, deliverable del tema, README. |

## Dove ha contribuito l'AI e dove serve la revisione umana

| Parte | AI | Revisione umana |
|---|---|---|
| Ricerca di mercato | Ricerche e confronto con i prodotti esistenti | I link vanno riaperti prima della presentazione. |
| Calcolo del TAEG | Formula della direttiva, test su casi fatti a mano | **Da far verificare** a chi lavora nel credito: in particolare l'ipotesi «prima rata dopo un mese» e il trattamento delle imposte nel TAEG. |
| Documenti di esempio | Scritti sul modello del SECCI italiano, con dati di fantasia | **Da confrontare** con moduli SECCI veri di più finanziatori: le etichette cambiano un po' da un modulo all'altro. |
| Testi per la persona | Scritti con la skill `spiegare-il-credito`, filtrati da `findAdvice` | **Da far leggere** a persone come Samira e a un'associazione di consumatori. |
| Confine "educazione / consulenza" | Filtro dei consigli e confronto senza classifiche | **Da validare** con un parere esperto: è il vincolo più importante del tema. |
| Interfaccia | Accessibile per costruzione (tastiera, contrasto, aria-live) | **Da provare nel browser**, con tastiera e lettore di schermo: il subagente non l'ha vista. |
| Agenti AI a runtime | Prompt, schemi, validatori, test con client simulato | **Da provare con una chiave vera**: la chiamata è stata testata solo con un client finto. |
| Quiz | Domande costruite sui numeri del documento | Il miglioramento "prima e dopo" va misurato con persone vere: finora nessuno studio con utenti. |

## Come rilanciare il ciclo

```text
/nuovo-documento "finanziamento di uno smartphone, 24 rate, TAN 9,9%"  → nuovo esempio con flussi e test
numbers-fidelity-reviewer                                               → ricontrollo di calcoli e validatori
plain-language-reviewer                                                 → revisione dei testi per la persona
/demo-check                                                             → verifica completa prima della demo
```
